// Board renderer: DOM <img> nuts positioned with transform only, animated with WAAPI.
// Logic state changes instantly (game.js); the renderer catches up visually. A new move can
// start while an old one is still animating: each nut continues from wherever it is on screen.
import { nutImage, baseImage, checkBadge, partyHat, IMG_H, STEP } from './art.js';
import { computeLayout, M } from './layout.js';
import { MOTION } from './config.js';

const EASE_OUT = 'cubic-bezier(.2,.8,.3,1)';
const EASE_IN_OUT = 'cubic-bezier(.45,0,.25,1)';
const EASE_IN = 'cubic-bezier(.5,0,.85,.4)';

export class BoardRenderer {
  /**
   * @param {HTMLElement} el board container (position:relative, sized by CSS)
   * @param {{ onTap:(bolt:number)=>void, onTapEmpty:()=>void, reducedMotion:()=>boolean, symbols:()=>boolean, partyHat:()=>boolean }} opts
   */
  constructor(el, opts) {
    this.el = el;
    this.opts = opts;
    this.cols = [];      // per bolt: array of nut objects bottom -> top
    this.slots = [];     // per bolt: { el, glow, rod, base, check, x, baseY }
    this.lifted = null;  // { bolt, count }
    this.cap = 3;
    this.layout = null;
    this.animating = 0;  // number of running move animations (fx pauses on this)
    this.hat = null;
    el.addEventListener('pointerdown', (e) => this._pointer(e));
    this._ro = new ResizeObserver(() => { if (this.cols.length) this.relayout(false); });
    this._ro.observe(el);
  }

  get rm() { return this.opts.reducedMotion(); }

  // ---------- building ----------
  build(state) {
    this.el.querySelectorAll('.nut, .slot, .check').forEach((n) => n.remove());
    this.cap = state.cap;
    this.cols = [];
    this.slots = [];
    this.lifted = null;
    this.hat = null;
    state.bolts.forEach((bolt, i) => {
      this._makeSlot(i);
      this.cols[i] = bolt.map((c, k) => this._makeNut(c, state.hidden[i][k]));
    });
    this.relayout(false);
    state.bolts.forEach((_, i) => this._setComplete(i, isComplete(state, i), false));
  }

  _makeSlot(i) {
    const s = document.createElement('div');
    s.className = 'slot';
    s.innerHTML = `<div class="glow"></div><div class="rod"></div><img class="base" alt="" draggable="false" src="${baseImage()}">`;
    const check = document.createElement('div');
    check.className = 'check';
    check.innerHTML = checkBadge();
    this.el.appendChild(s);
    this.el.appendChild(check);
    this.slots[i] = { el: s, glow: s.firstChild, rod: s.children[1], base: s.children[2], check, complete: false };
  }

  _makeNut(color, hidden) {
    const el = document.createElement('div');
    el.className = 'nut';
    const sym = this.opts.symbols();
    el.innerHTML = `<img alt="" draggable="false" src="${nutImage(color, sym)}">` + (hidden ? `<img class="hid" alt="" draggable="false" src="${nutImage(-1, sym)}">` : '');
    this.el.appendChild(el);
    return { el, color, hidden: !!hidden, x: 0, y: 0, anim: null };
  }

  /** Swap nut art when the "symbols on nuts" setting changes. */
  refreshArt() {
    const sym = this.opts.symbols();
    for (const col of this.cols) for (const n of col) {
      n.el.firstChild.src = nutImage(n.color, sym);
      const h = n.el.querySelector('.hid');
      if (h) h.src = nutImage(-1, sym);
    }
  }

  // ---------- geometry ----------
  relayout(animated) {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    const L = computeLayout(this.cols.length, this.cap, w, h);
    this.layout = L;
    const W = L.W;
    this.el.style.setProperty('--nut-w', `${W}px`);
    this.slots.forEach((s, i) => {
      const p = L.slots[i];
      s.x = p.x; s.baseY = p.baseY;
      const top = p.baseY - (this.cap * STEP + IMG_H - STEP + M.rodStub) * W - (M.liftGap + IMG_H) * W * 0.55;
      const bottom = p.baseY + M.baseBelow * W + 6;
      Object.assign(s.el.style, {
        transform: `translate3d(${p.x - (M.slotW * W) / 2}px, ${top}px, 0)`,
        width: `${M.slotW * W}px`, height: `${bottom - top}px`,
      });
      s.top = top;
      const rodTop = this.rodTop(i) - top;
      const rodW = Math.max(5, W * 0.15);
      Object.assign(s.rod.style, { left: `${(M.slotW * W - rodW) / 2}px`, width: `${rodW}px`, top: `${rodTop}px`, height: `${p.baseY - top - rodTop + 2}px` });
      const bw = 1.22 * W;
      Object.assign(s.base.style, { left: `${(M.slotW * W - bw) / 2}px`, width: `${bw}px`, top: `${p.baseY - top - 0.24 * W}px` });
      // check badge: top-right of where a full stack ends
      const cs = Math.max(16, W * 0.36);
      const fullTop = p.baseY - (IMG_H + (this.cap - 1) * STEP) * W;
      Object.assign(s.check.style, { width: `${cs}px`, height: `${cs}px`, transform: `translate3d(${p.x + W * 0.32}px, ${fullTop - cs * 0.15}px, 0)` });
    });
    for (let i = 0; i < this.cols.length; i++) {
      this.cols[i].forEach((n, k) => {
        n.el.style.width = `${W}px`;
        const liftedHere = this.lifted && this.lifted.bolt === i && k >= this.cols[i].length - this.lifted.count;
        const p = liftedHere ? this.liftPos(i, k - (this.cols[i].length - this.lifted.count)) : this.slotPos(i, k);
        if (animated) this._animate(n, [p], MOTION.glide, 0, EASE_IN_OUT);
        else this._place(n, p);
        n.el.style.zIndex = liftedHere ? 300 + k : 10 + k;
      });
    }
    if (this.hat) this._positionHat();
  }

  /** Top-left of nut k on bolt i. */
  slotPos(i, k) {
    const s = this.slots[i], W = this.layout.W;
    return { x: s.x - W / 2, y: s.baseY - IMG_H * W - k * STEP * W };
  }
  rodTop(i) {
    const s = this.slots[i], W = this.layout.W;
    return s.baseY - (IMG_H + (this.cap - 1) * STEP + M.rodStub) * W;
  }
  /** Top-left of the j-th nut (0 = lowest) of a run lifted above bolt i. */
  liftPos(i, j) {
    const W = this.layout.W;
    return { x: this.slots[i].x - W / 2, y: this.rodTop(i) - M.liftGap * W - IMG_H * W - j * STEP * W };
  }

  // ---------- animation helpers ----------
  _place(n, p) {
    if (n.anim) { n.anim.cancel(); n.anim = null; }
    n.x = p.x; n.y = p.y;
    n.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  }

  _current(n) {
    if (n.anim && n.anim.playState === 'running') {
      const m = getComputedStyle(n.el).transform;
      const v = m && m !== 'none' ? m.match(/-?[\d.e]+/g).map(Number) : null;
      if (v) return v.length === 16 ? { x: v[12], y: v[13] } : { x: v[4], y: v[5] };
    }
    return { x: n.x, y: n.y };
  }

  /**
   * Animate a nut through waypoints. frames: [{x,y,offset?,easing?}] (start is the current position).
   * Returns the end time in ms.
   */
  _animate(n, frames, duration, delay = 0, easing = EASE_IN_OUT) {
    const from = this._current(n);
    if (n.anim) n.anim.cancel();
    const last = frames[frames.length - 1];
    n.x = last.x; n.y = last.y;
    n.el.style.transform = `translate3d(${last.x}px, ${last.y}px, 0)`;
    if (this.rm) {
      // reduce motion: jump + quick fade
      n.anim = n.el.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: MOTION.fade, delay: Math.min(delay, 60), easing: 'ease-out' });
      n.anim.onfinish = () => { n.anim = null; };
      return MOTION.fade + Math.min(delay, 60);
    }
    const kf = [{ transform: `translate3d(${from.x}px, ${from.y}px, 0)`, offset: 0, easing: frames[0].easing || easing }];
    frames.forEach((f, idx) => kf.push({ transform: `translate3d(${f.x}px, ${f.y}px, 0)`, offset: f.offset ?? (idx === frames.length - 1 ? 1 : (idx + 1) / frames.length), easing: frames[idx + 1]?.easing || f.easing || easing }));
    n.anim = n.el.animate(kf, { duration, delay, fill: 'backwards' });
    this.animating++;
    const a = n.anim;
    const done = () => { this.animating = Math.max(0, this.animating - 1); if (n.anim === a) n.anim = null; };
    a.onfinish = done; a.oncancel = done;
    return delay + duration;
  }

  // ---------- interactions ----------
  _pointer(e) {
    if (!this.layout) return;
    const r = this.el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const W = this.layout.W;
    let hit = -1;
    this.slots.forEach((s, i) => {
      const half = (M.slotW * W) / 2;
      const top = s.top - (this.lifted && this.lifted.bolt === i ? this.lifted.count * STEP * W : 0);
      if (x >= s.x - half && x <= s.x + half && y >= top && y <= s.baseY + M.baseBelow * W + 8) hit = i;
    });
    e.preventDefault();
    if (hit >= 0) this.opts.onTap(hit); else this.opts.onTapEmpty();
  }

  /** Lift the top `count` nuts of bolt i. */
  lift(i, count) {
    this.lifted = { bolt: i, count };
    const col = this.cols[i];
    for (let j = 0; j < count; j++) {
      const n = col[col.length - count + j];
      n.el.style.zIndex = 300 + j;
      this._animate(n, [this.liftPos(i, j)], MOTION.lift, j * 12, EASE_OUT);
    }
    if (this.opts.partyHat()) this._showHat(col[col.length - 1]);
  }

  /** Put a lifted run back down. */
  drop() {
    if (!this.lifted) return;
    const { bolt, count } = this.lifted;
    this.lifted = null;
    const col = this.cols[bolt];
    for (let j = 0; j < count; j++) {
      const k = col.length - count + j;
      const n = col[k];
      this._animate(n, [{ ...this.slotPos(bolt, k), easing: EASE_IN }], MOTION.drop, (count - 1 - j) * 10, EASE_IN);
      setZ(n, 10 + k, MOTION.drop);
    }
    this._hideHat();
  }

  /**
   * Animate a move of `count` nuts from -> to. Uses the lifted run if it's on `from`.
   * opts: { revealed: index in source bolt or -1, completed: bool, uncompleted: bool }
   * Returns total duration (ms).
   */
  move(from, to, count, opts = {}) {
    const lifted = this.lifted && this.lifted.bolt === from ? this.lifted.count : 0;
    this.lifted = null;
    this._hideHat();
    const src = this.cols[from], dst = this.cols[to];
    const moving = src.splice(src.length - count, count);
    // lifted nuts that don't fit drop back
    for (let j = 0; j < lifted - count; j++) {
      const k = src.length - (lifted - count) + j;
      const n = src[k];
      this._animate(n, [{ ...this.slotPos(from, k) }], MOTION.drop, 40, EASE_IN);
      setZ(n, 10 + k, MOTION.drop + 40);
    }
    const W = this.layout.W;
    let end = 0;
    moving.forEach((n, j) => {
      const k = dst.length;
      dst.push(n);
      const target = this.slotPos(to, k);
      const above = this.liftPos(to, j);
      const wasLifted = lifted > 0;
      const liftT = wasLifted ? 0 : MOTION.lift;
      const total = liftT + MOTION.glide + MOTION.drop;
      const frames = [];
      if (!wasLifted) frames.push({ ...this.liftPos(from, j), offset: liftT / total, easing: EASE_IN_OUT });
      frames.push({ ...above, offset: (liftT + MOTION.glide) / total, easing: EASE_IN });
      // drop and settle with a tiny bounce
      frames.push({ x: target.x, y: target.y + W * 0.035, offset: (liftT + MOTION.glide + MOTION.drop * 0.8) / total, easing: 'ease-out' });
      frames.push({ ...target, offset: 1 });
      n.el.style.zIndex = 300 + j;
      end = Math.max(end, this._animate(n, frames, total, j * MOTION.stagger));
      setZ(n, 10 + k, end);
    });
    if (opts.revealed >= 0) this.reveal(from, opts.revealed, this.rm ? 0 : (lifted ? 40 : MOTION.lift));
    if (opts.uncompleted) this._setComplete(from, false, true);
    if (opts.completed) setTimeout(() => this._setComplete(to, true, true), this.rm ? 0 : end - MOTION.drop * 0.2);
    return end;
  }

  /** Reverse a move record (Undo). */
  undo(rec, opts = {}) {
    this.drop();
    if (rec.revealed >= 0) this.hide(rec.from, rec.revealed);
    if (opts.wasComplete) this._setComplete(rec.to, false, false);
    return this.move(rec.to, rec.from, rec.count, { revealed: -1, completed: opts.fromComplete });
  }

  reveal(i, k, delay = 0) {
    const n = this.cols[i][k];
    if (!n || !n.hidden) return;
    n.hidden = false;
    const h = n.el.querySelector('.hid');
    if (!h) return;
    const a = h.animate([{ opacity: 1 }, { opacity: 0 }], { duration: this.rm ? MOTION.fade : MOTION.reveal, delay, fill: 'forwards', easing: 'ease-out' });
    a.onfinish = () => { h.style.opacity = '0'; };
  }

  hide(i, k) {
    const n = this.cols[i][k];
    if (!n) return;
    n.hidden = true;
    let h = n.el.querySelector('.hid');
    if (!h) {
      h = document.createElement('img');
      h.className = 'hid'; h.alt = ''; h.draggable = false;
      h.src = nutImage(-1, this.opts.symbols());
      n.el.appendChild(h);
    }
    h.getAnimations().forEach((a) => a.cancel());
    h.style.opacity = '1';
  }

  /** Glow legal targets; `hint` gets the stronger hint glow. */
  setTargets(list, hint = -1) {
    this.slots.forEach((s, i) => {
      s.el.classList.toggle('target', list.includes(i));
      s.el.classList.toggle('hint', i === hint);
    });
  }

  _setComplete(i, on, animate) {
    const s = this.slots[i];
    if (!s) return;
    s.complete = on;
    s.check.classList.toggle('on', on);
    if (on && animate && !this.rm) {
      s.el.classList.remove('pulse');
      void s.el.offsetWidth; // restart CSS animation
      s.el.classList.add('pulse');
    }
  }

  markAllComplete() {
    this.slots.forEach((s, i) => { if (this.cols[i].length) this._setComplete(i, true, true); });
  }

  addBolt() {
    const i = this.cols.length;
    this._makeSlot(i);
    this.cols[i] = [];
    this.relayout(true);
    this.slots[i].el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    return i;
  }

  // ---------- birthday party hat on the lifted nut ----------
  _showHat(n) {
    this._hideHat();
    const h = document.createElement('div');
    h.className = 'party-hat';
    h.innerHTML = partyHat();
    n.el.appendChild(h);
    this.hat = h;
  }
  _hideHat() { if (this.hat) { this.hat.remove(); this.hat = null; } }
  _positionHat() {}

  destroy() { this._ro.disconnect(); }
}

function setZ(n, z, after) {
  clearTimeout(n.zt);
  n.zt = setTimeout(() => { n.el.style.zIndex = z; }, after);
}

function isComplete(state, i) {
  const b = state.bolts[i];
  return b.length === state.cap && b.every((c) => c === b[0]);
}

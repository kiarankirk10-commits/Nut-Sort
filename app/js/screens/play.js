// PLAYING (v2 p9/p11): top bar, star targets, board, hint bubble, Undo/Hint/Restart/Extra bolt.
// Also the overlays that appear while playing: level intro, pause, no moves left, level complete.
import { icon, stars } from '../icons.js';
import { wire, overlay, toast, esc } from '../ui.js';
import { BoardRenderer } from '../renderer.js';
import { Game, slotFor } from '../game.js';
import { thresholds } from '../stars.js';
import { recordLevelWin, recordDaily, starBalance, earn } from '../save.js';
import { findHint, cancelHints } from '../hints.js';
import { confetti } from '../confetti.js';
import { sfx } from '../audio.js';
import { chipLabel } from '../dates.js';
import { birthdayOn } from '../birthday.js';
import { starsFor } from '../stars.js';
import { DIFF_LABEL } from './common.js';
import { FEATURES, MOTION } from '../config.js';

let app = null;
let el = null;
let renderer = null;
let game = null;
let overlays = [];
let hintBusy = false;
let bubbleEl = null;

function closeOverlays() { overlays.forEach((o) => o.close()); overlays = []; }
function addOverlay(o) { overlays.push(o); return o; }

function titleFor(L) {
  if (L.kind === 'tutorial') return { title: 'LEVEL 1', tag: 'TUTORIAL' };
  if (L.kind === 'daily') return { title: 'DAILY', tag: chipLabel(L.date) + (L.mystery ? ' · MYSTERY' : '') };
  let tag = DIFF_LABEL[L.difficulty].toUpperCase();
  if (L.mystery) tag += ' · MYSTERY';
  else if (L.shape === 'tall' && L.cap >= 7) tag += ' · TALL';
  if (app.birthday()) tag += ' · BIRTHDAY';
  return { title: `LEVEL ${L.number}`, tag };
}

function shell() {
  el.innerHTML = `
    <div class="play-top">
      <button class="icon-btn" data-act="pause" aria-label="Pause">${icon('pause')}</button>
      <div class="mid"><div class="lvl-name" id="p-title"></div><span class="tag" id="p-tag"></span></div>
      <div class="moves"><small>MOVES</small><b id="p-moves">0</b></div>
    </div>
    <div class="targets panel" id="p-targets"></div>
    <div class="board-wrap"><div id="board"></div></div>
    <div id="p-bubble"></div>
    <div class="controls">
      <button class="ctl" data-act="undo" id="c-undo"><span class="ring">${icon('undo')}</span>Undo</button>
      ${FEATURES.hints ? `<button class="ctl" data-act="hint" id="c-hint"><span class="ring">${icon('bulb')}<span class="badge" id="b-hint">3</span></span>Hint</button>` : ''}
      <button class="ctl" data-act="restart" id="c-restart"><span class="ring">${icon('restart')}</span>Restart</button>
      ${FEATURES.extraBolt ? `<button class="ctl" data-act="extra" id="c-extra"><span class="ring">${icon('plus')}<span class="badge" id="b-extra">2</span></span>Extra bolt</button>` : ''}
    </div>`;
  renderer = new BoardRenderer(el.querySelector('#board'), {
    onTap: (i) => { clearPlainBubble(); game && game.tap(i); },
    onTapEmpty: () => game && game.tapEmpty(),
    reducedMotion: () => app.reducedMotion(),
    symbols: () => app.save.settings.symbols,
    partyHat: () => !!app.birthday(),
  });
  wire(el, {
    pause: openPause,
    undo: () => { closeStuck(); game.undo(); },
    hint: doHint,
    restart: () => { closeStuck(); cancelHints(); setBubble(null); game.restart(); },
    extra: () => { if (game.addExtraBolt()) closeStuck(); else if (!game.won) toast('No free bolts left on this level'); },
  });
}

// ---------- HUD ----------
function updateHUD() {
  const L = game.level;
  el.querySelector('#p-moves').textContent = game.moves;
  const t = thresholds(L.par, L.mystery);
  const m = game.moves;
  el.querySelector('#p-targets').innerHTML = `
    <div class="${m > t.three ? 'gone' : ''}"><span class="stars">${stars(3)}</span>≤${t.three}</div>
    <div class="${m > t.two ? 'gone' : ''}"><span class="stars">${stars(2, 2)}</span>≤${t.two}</div>
    <div><span class="stars">${stars(1, 1)}</span>any</div>`;
  const hb = el.querySelector('#b-hint');
  if (hb) { hb.textContent = game.hintsLeft; el.querySelector('#c-hint').classList.toggle('off', game.hintsLeft <= 0 || game.won); }
  const eb = el.querySelector('#b-extra');
  if (eb) { eb.textContent = game.extraLeft; el.querySelector('#c-extra').classList.toggle('off', game.extraLeft <= 0 || game.won); }
  el.querySelector('#c-undo').classList.toggle('off', !game.canUndo);
}

// ---------- bubbles ----------
function setBubble(html, plain = false) {
  const host = el.querySelector('#p-bubble');
  host.innerHTML = html ? `<div class="hint-bubble ${plain ? 'plain' : ''}">${html}</div>` : '';
  bubbleEl = host.firstChild;
}
function clearPlainBubble() { if (bubbleEl && bubbleEl.classList.contains('plain') && game && game.moves > 0) setBubble(null); }

function introBubbles() {
  const L = game.level;
  if (L.kind === 'tutorial' && game.moves === 0) {
    setBubble('<b>Tap a bolt to lift its top nut</b><span>A nut can go onto an empty bolt, or onto the same colour, if there\'s room.</span>');
  } else if (L.mystery && game.moves === 0) {
    setBubble('Grey nuts are hidden until the nut above moves', true);
  } else setBubble(null);
}

// ---------- hints ----------
async function doHint() {
  if (!game || game.won) return;
  closeStuck();
  if (game.hintsLeft <= 0) { toast(game.level.mystery ? 'Mystery levels get 1 hint' : 'No hints left on this level'); return; }
  if (hintBusy || game.hintMove) return;
  const g = game, v = game.version;
  hintBusy = true;
  const res = await findHint(g, (busy) => el.querySelector('#c-hint')?.classList.toggle('busy', busy));
  hintBusy = false;
  if (g !== game || res.cancelled) return;
  if (g.version !== v) return; // player moved meanwhile: drop the stale hint
  if (res.move && g.showHint(res.move[0], res.move[1])) {
    setBubble('<b>Try this move</b><span>Drop the lifted nut on the glowing bolt</span>');
  } else {
    setBubble("No sure route from here. Try Undo or an extra bolt.", true);
  }
}

// ---------- overlays ----------
function openIntro() {
  const L = game.level;
  const t = thresholds(L.par, L.mystery);
  const { title, tag } = titleFor(L);
  const o = addOverlay(overlay(`<div class="card panel intro">
    <div class="lv-label">${L.kind === 'daily' ? 'DAILY CHALLENGE' : 'LEVEL'}</div>
    <div class="lv-num">${L.kind === 'daily' ? esc(chipLabel(L.date)) : L.number}</div>
    <span class="tag">${esc(tag)}</span>
    <div class="facts">
      <div><b>${L.colors}</b><small>colours</small></div>
      <div><b>${L.bolts}</b><small>bolts · ${L.spares} spare</small></div>
      <div><div class="stars">${stars(3)}</div><b>≤${t.three}</b><small>3 stars</small></div>
    </div>
    <button class="btn btn-gold" data-act="start">Start</button>
    <p class="note">No timer. No penalties. Stuck? Undo, hint, add a bolt or restart.${L.mystery ? '<br>Grey nuts stay hidden until the nut above them moves.' : ''}</p>
    </div>`));
  void title;
  wire(o.el, { start: () => { o.close(); overlays = overlays.filter((x) => x !== o); } });
}

function openPause() {
  if (!game) return;
  game.cancel();
  const L = game.level;
  const what = L.kind === 'level' ? `${DIFF_LABEL[L.difficulty]} · Level ${L.number}` : L.kind === 'daily' ? 'Daily challenge' : 'Tutorial';
  const o = addOverlay(overlay(`<div class="card panel"><h2>PAUSED</h2><p>${what} · ${game.moves} move${game.moves === 1 ? '' : 's'}</p>
    <div class="btns"><button class="btn btn-gold" data-act="resume">Resume</button>
    <button class="btn btn-outline" data-act="restart">Restart</button>
    <button class="btn btn-outline" data-act="settings">Settings</button>
    <button class="btn btn-outline" data-act="home">Home</button></div></div>`, { onBackdrop: () => close() }));
  const close = () => { o.close(); overlays = overlays.filter((x) => x !== o); };
  wire(o.el, {
    resume: close,
    restart: () => { close(); cancelHints(); setBubble(null); game.restart(); },
    settings: () => { close(); app.go('settings'); },
    home: () => { close(); app.go('home'); },
  });
}

let stuckOverlay = null;
function openStuck() {
  if (stuckOverlay || !game || game.won) return;
  const o = overlay(`<div class="card panel" style="margin-top:auto;margin-bottom:84px"><h2>NO MOVES LEFT</h2>
    <p>No nut can move. Undo, add a free bolt, or start the level again.</p>
    <div class="btns"><button class="btn btn-gold" data-act="undo">Undo last move</button>
    <div class="btn-row"><button class="btn btn-outline btn-small" data-act="extra" ${game.extraLeft ? '' : 'disabled'}>+ Bolt (${game.extraLeft})</button>
    <button class="btn btn-outline btn-small" data-act="restart">Restart</button></div></div></div>`, { clear: true });
  stuckOverlay = addOverlay(o);
  wire(o.el, {
    undo: () => { closeStuck(); game.undo(); },
    extra: () => { closeStuck(); game.addExtraBolt(); },
    restart: () => { closeStuck(); game.restart(); },
  });
}
function closeStuck() { if (stuckOverlay) { stuckOverlay.close(); overlays = overlays.filter((x) => x !== stuckOverlay); stuckOverlay = null; } }

// ---------- win ----------
function onWin(g) {
  if (g !== game) return;
  const L = g.level;
  const s = app.save;
  const slot = slotFor(L);
  delete s.inProgress[slot];
  if (s.lastSlot === slot) s.lastSlot = null;
  let res = { level: L, moves: g.moves, par: L.par, mystery: L.mystery };
  const bday = app.birthday();
  if (L.kind === 'level') {
    res = { ...res, ...recordLevelWin(s, L.difficulty, L.number, g.moves, L.par, L.mystery, L.nuts) };
  } else if (L.kind === 'daily') {
    if (L.date === app.today) {
      const isBday = !!birthdayOn(app.today);
      res = { ...res, daily: recordDaily(s, app.today, g.moves, L.par, L.mystery, L.nuts, isBday) };
    } else {
      res = { ...res, daily: { already: true, stars: starsFor(g.moves, L.par, L.mystery), reward: { total: 0 } } };
    }
    res.stars = res.daily.stars;
  } else {
    res.stars = starsFor(g.moves, L.par, false);
    res.gained = s.tutorialDone ? 0 : res.stars;
    if (!s.tutorialDone) earn(s, res.gained);
    s.tutorialDone = true;
    s.stats.nutsSorted += L.nuts;
  }
  res.total = starBalance(s);
  app.persist();
  // visuals: checks everywhere, reveal leftovers, confetti, fanfare
  g.state.hidden.forEach((h, i) => h.forEach((x, k) => { if (x) renderer.reveal(i, k); }));
  renderer.markAllComplete();
  sfx.fanfare();
  if (!app.reducedMotion()) confetti({ count: bday ? 220 : 140, extra: bday ? ['#F583B2', '#5BCCFB'] : [] });
  updateHUD();
  setBubble(null);
  const o = addOverlay(overlay(`<div class="card panel complete-banner" style="margin-top:auto;margin-bottom:96px">
    <h2>${L.kind === 'daily' ? 'CHALLENGE COMPLETE' : 'LEVEL COMPLETE'}</h2><p style="margin-bottom:0">Every nut sorted. Nicely done.</p>
    <div class="tap-hint">Tap anywhere to continue</div></div>`, { clear: true }));
  o.el.style.pointerEvents = 'auto';
  let went = false;
  const go = () => {
    if (went) return; went = true;
    o.close(); overlays = overlays.filter((x) => x !== o);
    app.go('result', res);
  };
  o.el.addEventListener('click', go);
  setTimeout(go, app.reducedMotion() ? 1800 : MOTION.confetti + 1100);
}

export default {
  isAnimating() { return renderer ? renderer.animating > 0 : false; },

  render(a, element, params) {
    app = a; el = element;
    if (!renderer) shell();
    const L = params.level;
    const keep = game && game.level.id === L.id && !game.won && !params.forceNew;
    closeOverlays();
    stuckOverlay = null;
    if (!keep) {
      cancelHints();
      hintBusy = false;
      game = new Game(L, renderer, {
        onChange: () => updateHUD(),
        onMove: (g) => { if (g.moves === 1 || (bubbleEl && !bubbleEl.classList.contains('plain'))) setBubble(null); },
        onSave: (g) => {
          if (g.won) return;
          const slot = slotFor(g.level);
          app.save.inProgress[slot] = g.serialize();
          app.save.lastSlot = slot;
          app.persist();
        },
        onWin,
        onStuck: (g) => { if (g === game) openStuck(); },
      }, params.saved || null);
      // a brand-new attempt is "in progress" from the start so Continue works even before a move
      if (!params.saved) { app.save.inProgress[game.slot] = game.serialize(); app.save.lastSlot = game.slot; app.persist(); }
    } else {
      renderer.refreshArt();
      renderer.relayout(false);
    }
    window.__game = game; // debugging + smoke tests
    const { title, tag } = titleFor(L);
    el.querySelector('#p-title').textContent = title;
    el.querySelector('#p-tag').textContent = tag;
    updateHUD();
    introBubbles();
    if (params.intro && !keep) openIntro();
    params.intro = false; // coming back from Settings shouldn't show the intro again
  },

  leave() {
    closeOverlays();
    stuckOverlay = null;
    cancelHints();
    hintBusy = false;
    if (game) game.cancel();
  },
};

// Small DOM helpers shared by the screens: element builder, toast, overlays, modal, thumbnails.
import { NUT_COLORS } from './colors.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Create an element from an HTML string (single root). */
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Wire [data-act] clicks inside root to handlers. */
export function wire(root, handlers) {
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t || !root.contains(t)) return;
    const fn = handlers[t.dataset.act];
    if (fn) { e.stopPropagation(); fn(t.dataset.arg, t, e); }
  });
}

let toastTimer;
export function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show', 'panel');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/**
 * Show an overlay with a centred card. Returns { el, close }.
 * opts: { clear: bool (no dim, board visible), onBackdrop: fn, cls }
 */
export function overlay(innerHTML, opts = {}) {
  const el = h(`<div class="overlay ${opts.clear ? 'clear' : ''} ${opts.cls || ''}">${innerHTML}</div>`);
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 200);
  };
  if (opts.onBackdrop) el.addEventListener('click', (e) => { if (e.target === el) opts.onBackdrop(); });
  return { el, close };
}

/** In-app confirm (never window.confirm). Resolves true/false. */
export function confirmModal({ title, text, ok = 'OK', cancel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const o = overlay(`<div class="card panel"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btns">
      <button class="btn ${danger ? 'btn-outline btn-danger' : 'btn-gold'}" data-act="ok">${esc(ok)}</button>
      <button class="btn btn-outline" data-act="cancel">${esc(cancel)}</button></div></div>`, { onBackdrop: () => done(false) });
    const done = (v) => { o.close(); resolve(v); };
    wire(o.el, { ok: () => done(true), cancel: () => done(false) });
  });
}

/**
 * Tiny board thumbnail as SVG (rods with coloured nut bars), for cards.
 * bolts: arrays of colour indices (bottom -> top); hidden: optional same-shape booleans.
 */
export function thumbSVG(bolts, cap, hidden) {
  const n = bolts.length;
  const perRow = n > 9 ? Math.ceil(n / 2) : n;
  const rows = Math.ceil(n / perRow);
  const colW = 10, nutH = Math.max(3, Math.min(6, 30 / cap)), gapRow = 6;
  const rowH = cap * nutH + 8;
  const W = perRow * colW, H = rows * rowH + (rows - 1) * gapRow;
  let s = '';
  bolts.forEach((b, i) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    const inRow = r === rows - 1 ? n - r * perRow : perRow;
    const x0 = (W - inRow * colW) / 2 + c * colW + colW / 2;
    const yBase = r * (rowH + gapRow) + rowH;
    s += `<rect x="${x0 - 1}" y="${yBase - rowH + 1}" width="2" height="${rowH - 2}" rx="1" fill="#cfd4dc"/>`;
    s += `<rect x="${x0 - 4.2}" y="${yBase - 2}" width="8.4" height="2.4" rx="1.2" fill="#e9ecf2"/>`;
    b.forEach((col, k) => {
      const fill = hidden && hidden[i] && hidden[i][k] ? '#4C5059' : NUT_COLORS[col].front;
      s += `<rect x="${x0 - 3.6}" y="${yBase - 2 - (k + 1) * nutH}" width="7.2" height="${nutH - 0.6}" rx="1.4" fill="${fill}"/>`;
    });
  });
  return `<svg viewBox="-2 -2 ${W + 4} ${H + 4}" preserveAspectRatio="xMidYMid meet">${s}</svg>`;
}

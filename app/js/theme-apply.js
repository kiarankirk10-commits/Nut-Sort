// Apply a theme: CSS custom properties on :root, 300ms background crossfade, fx layers.
import { themeById } from './themes.js';
import { MOTION } from './config.js';
import * as fx from './fx.js';

let currentId = null;
let currentBg = null;

const VARS = {
  bg: '--bg', bgBase: '--bg-base', panel: '--panel', border: '--panel-border', accent: '--accent', accent2: '--accent-2',
  light: '--accent-light', onAccent: '--on-accent', text: '--text', muted: '--muted', glow: '--glow', bolt: '--bolt-tint',
  target: '--target-glow', btnSheen: '--btn-sheen',
};

export function applyTheme(id, { animate = true, reducedMotion = false } = {}) {
  const t = themeById(id);
  const root = document.documentElement;
  const old = document.getElementById('bg-old');
  if (animate && currentBg && currentId !== t.id && old && !reducedMotion) {
    old.style.background = currentBg;
    old.getAnimations().forEach((a) => a.cancel());
    old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MOTION.themeCrossfade, easing: 'ease', fill: 'forwards' });
  }
  for (const [k, v] of Object.entries(VARS)) root.style.setProperty(v, t.tokens[k]);
  document.body.className = document.body.className.split(' ').filter((c) => !c.startsWith('th-')).join(' ');
  if (t.cls) t.cls.split(' ').forEach((c) => document.body.classList.add('th-' + c));
  document.body.classList.add('th-id-' + t.id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.tokens.bgBase);
  currentId = t.id;
  currentBg = t.tokens.bg;
  fx.startFx(t, { reducedMotion });
  return t;
}

export function currentThemeId() { return currentId; }

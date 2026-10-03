// Themes = data. Tokens become CSS custom properties (see theme-apply.js). Themes change UI
// chrome, background, buttons and glow only — NEVER the 18 nut colours or symbols.
// Prices are tunable (docs/TUNING.md). Add a theme by appending an entry; tests check contrast.
//
// token map: bg (CSS background layers), bgBase (solid fallback / status bar), panel, border,
// accent, accent2 (gradient partner for main buttons), light (accent-light), onAccent (text on
// main buttons), text, muted, glow, bolt (bolt tint), target (target glow), boardBg (colour
// behind the board, used by the contrast test).
// fx: optional effect layers (fx.js): canvas particles + cheap CSS layers. Auto-off under Reduce Motion.

export const TIERS = [
  { id: 0, name: 'Free' },
  { id: 1, name: 'Classic' },
  { id: 2, name: 'Luxe' },
  { id: 3, name: 'Spectacular' },
  { id: 4, name: 'Legendary' },
];

const a = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/** Build a theme from a few colours; anything can be overridden. */
function T(id, name, tier, price, o) {
  const accent = o.accent, accent2 = o.accent2 || o.accent;
  return {
    id, name, tier, price,
    tokens: {
      bgBase: o.to,
      bg: o.bg || `radial-gradient(70% 45% at 80% 6%, ${a(accent, 0.13)}, transparent 70%), linear-gradient(170deg, ${o.from}, ${o.to} 70%)`,
      panel: o.panel || a(o.panelHex || mix(o.from, '#000000', 0.25), 0.88),
      border: o.border || a(accent, 0.3),
      accent, accent2,
      light: o.light,
      onAccent: o.onAccent || '#111111',
      text: o.text || '#F4F5F7',
      muted: o.muted || '#A3A8B3',
      glow: o.glow || a(accent, 0.38),
      bolt: o.bolt || '#E9ECF2',
      target: o.target || a(accent, 0.55),
      boardBg: o.boardBg || o.to,
      btnSheen: o.btnSheen || 'none',
    },
    fx: o.fx || [],
    cls: o.cls || '',
  };
}

function mix(h1, h2, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(h1), y = p(h2);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export const THEMES = [
  // ---------------- FREE ----------------
  {
    id: 'black-gold', name: 'Black & Gold', tier: 0, price: 0,
    tokens: {
      bgBase: '#09090B',
      bg: [
        'radial-gradient(circle at 104% -6%, rgba(234,186,60,.075) 0 27%, transparent 27.3%)',
        'radial-gradient(circle at 104% -6%, rgba(234,186,60,.045) 0 43%, transparent 43.3%)',
        'radial-gradient(circle at 104% -6%, rgba(234,186,60,.028) 0 60%, transparent 60.3%)',
        'radial-gradient(55% 35% at 88% 10%, rgba(234,186,60,.10), transparent 72%)',
        'radial-gradient(80% 40% at 50% 38%, rgba(234,186,60,.05), transparent 70%)',
        '#09090B',
      ].join(', '),
      panel: '#161411', border: 'rgba(234,186,60,.30)',
      accent: '#EABA3C', accent2: '#C9952A', light: '#FFECA8', onAccent: '#1A1408',
      text: '#F7F1E2', muted: '#AAA086', glow: 'rgba(234,186,60,.38)', bolt: '#E9ECF2', target: 'rgba(234,186,60,.58)',
      boardBg: '#0D0C0B', btnSheen: 'none',
    },
    fx: [],
  },
  {
    id: 'cosmic-purple', name: 'Cosmic Purple', tier: 0, price: 0,
    tokens: {
      bgBase: '#04040A',
      bg: 'radial-gradient(60% 40% at 80% 18%, rgba(123,63,228,.28), transparent 70%), radial-gradient(70% 45% at 15% 72%, rgba(46,91,255,.18), transparent 70%), linear-gradient(160deg, #141A4A, #0A0E2A 55%, #04040A)',
      panel: 'rgba(20,18,48,.85)', border: '#3B2F7A',
      accent: '#9B6BFF', accent2: '#5B3DF5', light: '#CDB8FF', onAccent: '#140A38',
      text: '#EEEAFF', muted: '#8C88B8', glow: 'rgba(155,107,255,.45)', bolt: '#E6E4F5', target: 'rgba(155,107,255,.62)',
      boardBg: '#0A0E2A', btnSheen: 'none',
    },
    fx: [{ kind: 'twinkle', count: 70, color: '#EEEAFF' }, { kind: 'nebula', colors: ['rgba(123,63,228,.22)', 'rgba(46,91,255,.16)'] }],
  },

  // ---------------- TIER 1 · CLASSIC ----------------
  T('graphite', 'Graphite', 1, 40, { from: '#1B1D21', to: '#0B0C0E', accent: '#C9CED6', accent2: '#8E96A3', light: '#F1F3F6', onAccent: '#15171A', muted: '#9CA2AC' }),
  T('midnight-navy', 'Midnight Navy', 1, 50, { from: '#0E1A33', to: '#060A14', accent: '#7FB6FF', accent2: '#3F7DE0', light: '#CFE3FF', onAccent: '#06122A', muted: '#93A3BF' }),
  T('forest', 'Forest', 1, 60, { from: '#10261A', to: '#050C08', accent: '#9BD36A', accent2: '#5E9E3A', light: '#DDF5C4', onAccent: '#0B1A07', muted: '#97AC98' }),
  T('ocean', 'Ocean', 1, 60, { from: '#0A2A3A', to: '#03111A', accent: '#3FD0E0', accent2: '#1A92B0', light: '#C6F6FB', onAccent: '#032029', muted: '#8EAAB5' }),
  T('crimson', 'Crimson', 1, 70, { from: '#2A0A10', to: '#0B0204', accent: '#FF4D5E', accent2: '#C0263A', light: '#FFC2C8', onAccent: '#1E0004', muted: '#B39598' }),
  T('mocha', 'Mocha', 1, 70, { from: '#2A1D16', to: '#0E0906', accent: '#D9A77A', accent2: '#A9774B', light: '#F5DEC6', onAccent: '#24150A', muted: '#AE9A8A' }),
  T('slate-teal', 'Slate Teal', 1, 80, { from: '#15302F', to: '#081312', accent: '#4FD1B5', accent2: '#229A82', light: '#C9F6EA', onAccent: '#04201A', muted: '#91ABA6' }),
  T('plum', 'Plum', 1, 90, { from: '#2A1230', to: '#0C050E', accent: '#E07BFF', accent2: '#A646CC', light: '#F6D5FF', onAccent: '#2A0636', muted: '#AE95B4' }),

  // ---------------- TIER 2 · LUXE ----------------
  T('rose-gold', 'Rose Gold', 2, 120, {
    from: '#2B1A1C', to: '#0D0809', accent: '#F2B5A0', accent2: '#C98A7A', light: '#FFE3D8', onAccent: '#2B1210', muted: '#B9A09B',
    bg: 'radial-gradient(60% 40% at 82% 10%, rgba(242,181,160,.18), transparent 70%), radial-gradient(70% 40% at 10% 85%, rgba(201,138,122,.12), transparent 70%), linear-gradient(170deg, #2B1A1C, #0D0809 70%)',
    glow: 'rgba(242,170,160,.42)', fx: [{ kind: 'sheen', color: 'rgba(255,214,200,.06)' }],
  }),
  T('emerald', 'Emerald', 2, 140, {
    from: '#063A2B', to: '#021410', accent: '#2EE59D', accent2: '#0FA36B', light: '#C2FFE6', onAccent: '#012116', muted: '#8DB3A5',
    bg: 'radial-gradient(55% 35% at 80% 8%, rgba(46,229,157,.16), transparent 70%), conic-gradient(from 210deg at 85% 0%, rgba(46,229,157,.0), rgba(46,229,157,.06), rgba(46,229,157,0) 30%), linear-gradient(170deg, #063A2B, #021410 70%)',
    fx: [{ kind: 'sheen', color: 'rgba(160,255,215,.07)' }],
  }),
  T('sapphire', 'Sapphire', 2, 150, {
    from: '#0B2370', to: '#030A24', accent: '#4C7DFF', accent2: '#2E52E0', light: '#D3DFFF', onAccent: '#030A24', muted: '#8F9CC4',
    bg: 'radial-gradient(60% 40% at 80% 10%, rgba(76,125,255,.22), transparent 70%), radial-gradient(50% 30% at 10% 90%, rgba(30,63,204,.18), transparent 70%), linear-gradient(170deg, #0B2370, #030A24 68%)',
    fx: [{ kind: 'sheen', color: 'rgba(190,210,255,.06)' }],
  }),
  T('copper', 'Copper', 2, 160, {
    from: '#2E1609', to: '#0D0603', accent: '#E58B4A', accent2: '#B4581F', light: '#FFD3B0', onAccent: '#240E02', muted: '#B39A88',
    btnSheen: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,.35) 45%, transparent 60%)',
  }),
  T('arctic', 'Arctic', 2, 180, {
    from: '#0E2233', to: '#05101A', accent: '#BFEFFF', accent2: '#7FC8E8', light: '#F0FCFF', onAccent: '#06202E', muted: '#93A9B8',
    bg: 'radial-gradient(70% 38% at 50% -4%, rgba(235,250,255,.20), transparent 70%), radial-gradient(40% 25% at 90% 20%, rgba(191,239,255,.10), transparent 70%), linear-gradient(175deg, #0E2233, #05101A 70%)',
    fx: [{ kind: 'snow', count: 45 }],
  }),
  T('chrome', 'Chrome', 2, 200, {
    from: '#2A2D33', to: '#0C0D10', accent: '#E4E8EE', accent2: '#9AA3AE', light: '#FFFFFF', onAccent: '#16181C', muted: '#A2A8B1',
    btnSheen: 'repeating-linear-gradient(90deg, rgba(255,255,255,.10) 0 1px, rgba(0,0,0,.04) 1px 3px)',
  }),

  // ---------------- TIER 3 · SPECTACULAR ----------------
  T('sunset-strip', 'Sunset Strip', 3, 260, {
    from: '#5A1E7A', to: '#120818', accent: '#FFB547', accent2: '#F0783A', light: '#FFE2A8', onAccent: '#2A1200', muted: '#C2A3B8',
    bg: 'radial-gradient(60% 18% at 50% 0%, rgba(255,200,120,.55), transparent 75%), linear-gradient(180deg, #FF7A3D 0%, #E63A6F 9%, #5A1E7A 24%, #2A0D3A 40%, #120818 62%)',
    panel: 'rgba(28,10,36,.86)', boardBg: '#2A0D3A',
    fx: [{ kind: 'sunglow' }],
  }),
  T('aurora', 'Aurora', 3, 300, {
    from: '#04202A', to: '#021018', accent: '#5CFFC8', accent2: '#19B98A', light: '#D2FFF0', onAccent: '#01231A', muted: '#8FB0AC',
    bg: 'linear-gradient(180deg, #03141C, #021018 60%)', boardBg: '#021018',
    fx: [{ kind: 'aurora', colors: ['#19E6A3', '#1FA3E6', '#8B5CF6'] }, { kind: 'twinkle', count: 40, color: '#D2FFF0' }],
  }),
  T('synthwave', 'Synthwave', 3, 340, {
    from: '#2B0A3D', to: '#0A0218', accent: '#FF3EC8', accent2: '#28E0FF', light: '#FFC7F0', onAccent: '#1A0326', muted: '#B293C2',
    bg: 'radial-gradient(45% 22% at 50% 102%, rgba(255,62,200,.38), transparent 75%), radial-gradient(60% 25% at 50% 0%, rgba(40,224,255,.12), transparent 75%), linear-gradient(180deg, #2B0A3D, #0A0218 75%)',
    glow: 'rgba(255,62,200,.45)', target: 'rgba(40,224,255,.55)',
    fx: [{ kind: 'grid' }],
  }),
  T('lava', 'Lava', 3, 380, {
    from: '#3A0800', to: '#0A0100', accent: '#FF7A1A', accent2: '#D94A00', light: '#FFD08A', onAccent: '#260900', muted: '#B89A8C',
    bg: 'radial-gradient(70% 30% at 50% 108%, rgba(255,90,0,.35), transparent 75%), linear-gradient(175deg, #3A0800, #0A0100 70%)',
    fx: [{ kind: 'lava' }],
  }),
  T('deep-ocean', 'Deep Ocean', 3, 400, {
    from: '#003B5C', to: '#000307', accent: '#00F0D0', accent2: '#00A3B4', light: '#B8FFF4', onAccent: '#002A26', muted: '#86A6B3',
    bg: 'radial-gradient(70% 30% at 50% -5%, rgba(80,200,255,.22), transparent 75%), linear-gradient(180deg, #003B5C, #001020 45%, #000307)', boardBg: '#001020',
    fx: [{ kind: 'bubbles', count: 26 }, { kind: 'rays' }],
  }),

  // ---------------- TIER 4 · LEGENDARY ----------------
  T('nebula', 'Nebula', 4, 600, {
    from: '#120A20', to: '#020104', accent: '#FF6FB5', accent2: '#6E4BFF', light: '#FFD1E8', onAccent: '#1E0614', muted: '#AE98B6',
    bg: 'radial-gradient(50% 30% at 20% 15%, rgba(255,61,154,.22), transparent 70%), radial-gradient(55% 35% at 85% 40%, rgba(91,43,224,.28), transparent 70%), radial-gradient(50% 30% at 30% 85%, rgba(0,194,209,.16), transparent 70%), #030207',
    boardBg: '#0A0612', cls: 'iridescent',
    fx: [{ kind: 'nebula', colors: ['rgba(255,61,154,.20)', 'rgba(91,43,224,.24)', 'rgba(0,194,209,.16)'] }, { kind: 'parallax', count: 90 }],
  }),
  T('molten-gold', 'Molten Gold', 4, 750, {
    from: '#1A1100', to: '#0A0700', accent: '#FFD45E', accent2: '#B8860B', light: '#FFF1C4', onAccent: '#1F1500', muted: '#B5A57F',
    bg: 'radial-gradient(60% 30% at 70% 0%, rgba(255,224,138,.20), transparent 70%), radial-gradient(70% 30% at 30% 105%, rgba(234,186,60,.18), transparent 70%), #0A0700',
    glow: 'rgba(255,212,94,.5)', cls: 'molten',
    btnSheen: 'linear-gradient(100deg, transparent 25%, rgba(255,255,255,.55) 45%, transparent 62%)',
    fx: [{ kind: 'goldflow' }, { kind: 'dust', count: 50 }],
  }),
  T('holographic', 'Holographic', 4, 900, {
    from: '#0B0B10', to: '#000000', accent: '#9AE6FF', accent2: '#FF9AE0', light: '#FFFFFF', onAccent: '#14101C', muted: '#A6A6B8',
    bg: 'radial-gradient(60% 30% at 80% 5%, rgba(154,230,255,.14), transparent 70%), radial-gradient(60% 30% at 15% 95%, rgba(255,154,224,.12), transparent 70%), #000000',
    cls: 'holo', fx: [{ kind: 'sheen', color: 'rgba(200,255,240,.06)' }],
  }),
  T('black-hole', 'Black Hole', 4, 1000, {
    from: '#000000', to: '#000000', accent: '#FFB070', accent2: '#E0702A', light: '#FFE6CC', onAccent: '#241000', muted: '#A9A0A0',
    bg: '#000000', boardBg: '#000000',
    fx: [{ kind: 'blackhole' }, { kind: 'streaks', count: 60 }],
  }),
  T('prism', 'Prism', 4, 1200, {
    from: '#0C0C14', to: '#07070B', accent: '#FF7AD9', accent2: '#7A8CFF', light: '#FFE0F6', onAccent: '#140818', muted: '#A7A4B8',
    bg: '#07070B', cls: 'prism-ui',
    fx: [{ kind: 'prism' }, { kind: 'hue' }],
  }),
];

export const DEFAULT_THEME = 'black-gold';
export function themeById(id) { return THEMES.find((t) => t.id === id) || THEMES[0]; }

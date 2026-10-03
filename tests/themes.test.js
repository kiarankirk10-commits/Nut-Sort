import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../app/js/themes.js';
import { NUT_COLORS } from '../app/js/colors.js';

// WCAG relative luminance / contrast, with rgba composited over a background
function parse(c) {
  c = c.trim();
  if (c.startsWith('#')) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; }
  const m = c.match(/rgba?\(([^)]+)\)/);
  const p = m[1].split(',').map((x) => parseFloat(x));
  return [p[0], p[1], p[2], p[3] ?? 1];
}
function over(fg, bg) { const f = parse(fg), b = parse(bg); return [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])); }
function lum(rgb) {
  const l = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
}
export function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

test('26 themes: 2 free, 24 paid, unique ids, sorted by tier then price', () => {
  assert.equal(THEMES.length, 26);
  assert.equal(THEMES.filter((t) => t.price === 0).length, 2);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, 26);
  for (let i = 1; i < THEMES.length; i++) {
    const p = THEMES[i - 1], t = THEMES[i];
    assert.ok(t.tier > p.tier || (t.tier === p.tier && t.price >= p.price), `${t.id} order`);
  }
  const paid = THEMES.filter((t) => t.price > 0).map((t) => t.price);
  assert.equal(Math.min(...paid), 40); assert.equal(Math.max(...paid), 1200);
});

for (const t of THEMES) {
  test(`theme ${t.id}: contrast checks`, () => {
    const k = t.tokens;
    const panel = over(k.panel, k.boardBg);
    const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    const P = hex(panel);
    assert.ok(contrast(over(k.text, P), panel) >= 4.5, `text on panel ${contrast(over(k.text, P), panel).toFixed(2)}`);
    assert.ok(contrast(over(k.muted, P), panel) >= 3, `muted on panel ${contrast(over(k.muted, P), panel).toFixed(2)}`);
    assert.ok(contrast(over(k.accent, P), panel) >= 3, `accent on panel ${contrast(over(k.accent, P), panel).toFixed(2)}`);
    const btn = over(k.accent, '#000000');
    assert.ok(contrast(over(k.onAccent, k.accent), btn) >= 4.5, `button text on accent ${contrast(over(k.onAccent, k.accent), btn).toFixed(2)}`);
    assert.ok(contrast(over(k.onAccent, k.accent2), over(k.accent2, '#000000')) >= 3, `button text on accent-2`);
    const board = over(k.boardBg, '#000000');
    for (const c of NUT_COLORS) {
      const r = contrast(over(c.top, '#000000'), board);
      assert.ok(r >= 2, `${c.name} nut vs board bg ${r.toFixed(2)}`);
    }
  });
}

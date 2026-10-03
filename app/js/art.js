// Procedural artwork for the board: 3D hex nuts, bolt bases, check badges, party hat.
// Everything is SVG built once per variant and cached as a data URL, so the board is just
// <img> elements moved with transforms (cheap to composite at 60fps on iPhone).
import { NUT_COLORS, HIDDEN_COLOR, SYMBOLS } from './colors.js';

// Nut geometry in a 100-wide box. The renderer scales by nut width W.
export const NUT = {
  w: 100,
  h: 74,        // image height
  top: 30,      // top-face height (flattened hexagon)
  body: 44,     // front body height == stacking step
};
export const STEP = NUT.body / NUT.w;       // vertical step between stacked nuts, as a fraction of W
export const IMG_H = NUT.h / NUT.w;         // image height as a fraction of W

const cache = new Map();
const url = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

function shade(hex, amt) {
  // amt -1..1 : darken / lighten
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function nutMarkup(c, withSymbol) {
  const id = c.name.replace(/\s/g, '');
  const sym = withSymbol || c.symbol === 'question'
    ? `<g transform="translate(36.8 38.8) scale(1.1)">${SYMBOLS[c.symbol].replaceAll('{c}', c.sym).replaceAll('{bg}', c.front)}</g>`
    : '';
  // faces: top hexagon, left / front / right sides
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 74" width="100" height="74">
<defs>
<linearGradient id="t${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c.top, 0.18)}"/><stop offset="1" stop-color="${c.top}"/></linearGradient>
<linearGradient id="f${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c.front, 0.06)}"/><stop offset=".75" stop-color="${c.front}"/><stop offset="1" stop-color="${shade(c.front, -0.12)}"/></linearGradient>
<radialGradient id="h${id}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#dfe3ea"/><stop offset="1" stop-color="#9aa1ad"/></radialGradient>
</defs>
<g stroke-linejoin="round" stroke-width="2.4">
<path d="M2 15 L22 30 L22 74 L2 59 Z" fill="${c.left}" stroke="${c.left}"/>
<path d="M78 30 L98 15 L98 59 L78 74 Z" fill="${c.right}" stroke="${c.right}"/>
<path d="M22 30 H78 V74 H22 Z" fill="url(#f${id})" stroke="${c.front}"/>
<path d="M2 15 L22 2 H78 L98 15 L78 30 H22 Z" fill="url(#t${id})" stroke="${shade(c.top, 0.1)}"/>
</g>
<path d="M22 30.6 H78" stroke="${shade(c.top, 0.35)}" stroke-width="1.6" opacity=".8"/>
<path d="M2.6 16 L22 30.6 M78 30.6 L97.4 16" stroke="${shade(c.top, 0.2)}" stroke-width="1.2" opacity=".6"/>
<path d="M22 73.3 H78" stroke="${shade(c.front, -0.3)}" stroke-width="1.4" opacity=".7"/>
<ellipse cx="50" cy="16" rx="16" ry="8.6" fill="${shade(c.left, -0.35)}" opacity=".85"/>
<ellipse cx="50" cy="15" rx="12" ry="6.6" fill="url(#h${id})"/>
<ellipse cx="46.5" cy="13" rx="4.4" ry="1.9" fill="#fff" opacity=".85"/>
${sym}
</svg>`;
}

/** Data URL for a nut image. color: 0..17 or -1 for hidden. */
export function nutImage(color, withSymbol = true) {
  const key = `${color}|${withSymbol ? 1 : 0}`;
  if (!cache.has(key)) cache.set(key, url(nutMarkup(color < 0 ? HIDDEN_COLOR : NUT_COLORS[color], withSymbol)));
  return cache.get(key);
}

/** Round white bolt base (disc). 122 x 40 box. */
export function baseImage() {
  if (!cache.has('base')) cache.set('base', url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122 40" width="122" height="40">
<defs><linearGradient id="bs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9ced8"/><stop offset="1" stop-color="#8d94a1"/></linearGradient>
<radialGradient id="bt" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef0f5"/><stop offset="1" stop-color="#d2d6df"/></radialGradient></defs>
<ellipse cx="61" cy="25" rx="59" ry="14" fill="url(#bs)"/>
<rect x="2" y="17" width="118" height="8" fill="url(#bs)"/>
<ellipse cx="61" cy="17" rx="59" ry="14" fill="url(#bt)"/>
<ellipse cx="61" cy="17" rx="44" ry="9.5" fill="none" stroke="#c5cad4" stroke-width="1.4" opacity=".8"/>
</svg>`));
  return cache.get('base');
}

export function checkBadge() {
  return `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="11" fill="var(--accent)" stroke="#1a1408" stroke-width="1.6"/><path d="M6.8 12.4l3.3 3.2 7-7.2" fill="none" stroke="#1a1408" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function partyHat() {
  return `<svg viewBox="0 0 40 48" width="100%" height="100%"><defs><clipPath id="hc"><path d="M20 4 L35 44 H5 Z"/></clipPath></defs>
<path d="M20 4 L35 44 H5 Z" fill="#EABA3C"/>
<g clip-path="url(#hc)"><path d="M0 18 L40 8 V14 L0 24Z M0 32 L40 22 V28 L0 38Z" fill="#E14751"/></g>
<ellipse cx="20" cy="44" rx="16" ry="3.4" fill="#C9952A"/><circle cx="20" cy="5" r="4.6" fill="#5BCCFB"/><circle cx="18.5" cy="3.6" r="1.4" fill="#fff" opacity=".8"/></svg>`;
}

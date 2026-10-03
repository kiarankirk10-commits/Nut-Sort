// Generate the PNG app icons from the same nut artwork the game uses.
//   node tools/make-icons.js
// Needs Google Chrome installed (rasterised headlessly via playwright-core, dev only).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { nutImage, baseImage } from '../app/js/art.js';

function iconSVG(size, { safe = 1 } = {}) {
  const W = 232 * safe;                 // nut width in a 512 box
  const step = W * 0.44, imgH = W * 0.74;
  const stackH = imgH + 2 * step + W * 0.2;
  const x = (512 - W) / 2;
  const top = (512 - stackH) / 2 + 6;
  const nut = (c, k) => `<image href="${nutImage(c)}" x="${x}" y="${top + 2 * step - k * step}" width="${W}" height="${imgH}"/>`;
  const bw = W * 1.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="62%"><stop offset="0" stop-color="#2a2110"/><stop offset=".55" stop-color="#121009"/><stop offset="1" stop-color="#09090B"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(234,186,60,.35)"/><stop offset="1" stop-color="rgba(234,186,60,0)"/></radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <circle cx="256" cy="262" r="${210 * safe}" fill="url(#glow)"/>
  <image href="${baseImage()}" x="${(512 - bw) / 2}" y="${top + 2 * step + imgH - W * 0.24}" width="${bw}" height="${bw * 40 / 122}"/>
  ${nut(7, 0)}${nut(4, 1)}${nut(10, 2)}
  ${safe === 1 ? '<rect x="10" y="10" width="492" height="492" rx="104" fill="none" stroke="rgba(234,186,60,.0)"/>' : ''}
</svg>`;
}

const out = new URL('../app/icons/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const jobs = [
  ['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['apple-touch-icon.png', 180, 1],
  ['icon-maskable-512.png', 512, 0.78], ['favicon-32.png', 32, 1.15],
];
for (const [name, size, safe] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:#09090B">${iconSVG(size, { safe })}</body></html>`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: fileURLToPath(new URL(name, out)), clip: { x: 0, y: 0, width: size, height: size } });
  console.log('wrote', name);
}
fs.writeFileSync(new URL('icon.svg', out), iconSVG(512));
await browser.close();

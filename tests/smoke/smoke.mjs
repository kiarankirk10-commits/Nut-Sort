// Playwright smoke test on an iPhone-sized viewport (390x844, touch).
//   npm run smoke      (stamps the service worker first)
// Uses the installed Google Chrome via playwright-core (no browser download).
// Checks: loads, plays the tutorial to a win by tapping, Continue appears after leaving
// mid-level, works offline after first load (service worker), 108-nut board frame times,
// PWA meta/manifest, and that no request ever leaves localhost.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const PORT = 8187;
const BASE = `http://localhost:${PORT}/`;
const outDir = fileURLToPath(new URL('./out/', import.meta.url));
fs.mkdirSync(outDir, { recursive: true });

const server = spawn(process.execPath, [fileURLToPath(new URL('../../tools/serve.js', import.meta.url)), String(PORT)], { stdio: 'pipe' });
await new Promise((r) => server.stdout.once('data', r));

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✔' : '✘'} ${msg}`); if (!cond) failures++; };

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await context.newPage();
const external = [];
page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) external.push(r.url()); });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

/** Tap bolt i of the current board (centre of its column). */
async function tapBolt(i) {
  const p = await page.evaluate((i) => {
    const r = window.__game.r, s = r.slots[i], b = r.el.getBoundingClientRect();
    return { x: b.left + s.x, y: b.top + s.baseY - r.layout.W * 0.4 };
  }, i);
  await page.touchscreen.tap(p.x, p.y);
}

try {
  await page.goto(BASE);
  await page.waitForSelector('#s-home.active');
  ok(await page.isVisible('text=Created by'), 'home shows "Created by Kiaran"');
  ok(await page.isVisible('[data-act=play]'), 'first launch shows PLAY (no Continue)');
  ok(!(await page.isVisible('.topbar .chip .sep')), 'no streak flame on first launch');
  await page.screenshot({ path: outDir + '01-home.png' });

  // PWA basics
  const meta = await page.evaluate(() => ({
    theme: document.querySelector('meta[name=theme-color]').content,
    capable: document.querySelector('meta[name=apple-mobile-web-app-capable]').content,
    status: document.querySelector('meta[name=apple-mobile-web-app-status-bar-style]').content,
  }));
  ok(meta.theme === '#09090B' && meta.capable === 'yes' && meta.status === 'black-translucent', 'iOS PWA meta tags');
  const man = await (await page.request.get(BASE + 'manifest.webmanifest')).json();
  ok(man.display === 'standalone' && man.icons.some((i) => i.sizes === '512x512') && man.theme_color === '#09090B', 'manifest: standalone, 512 icon, theme colour');

  // tutorial: play the stored optimal solution by tapping
  await page.tap('[data-act=play]');
  await page.waitForSelector('#s-play.active');
  await page.waitForFunction(() => window.__game && window.__game.level.kind === 'tutorial');
  ok(await page.isVisible('text=Tap a bolt to lift its top nut'), 'tutorial hint bubble shows');
  const sol = await page.evaluate(() => window.__game.level.solution);
  for (const [f, t] of sol) { await tapBolt(f); await tapBolt(t); await page.waitForTimeout(120); }
  await page.screenshot({ path: outDir + '02-tutorial-won.png' });
  await page.waitForSelector('#s-result.active', { timeout: 8000 });
  ok(await page.isVisible('text=PERFECT!'), 'tutorial won with 3 stars (PERFECT!)');
  await page.screenshot({ path: outDir + '03-result.png' });

  // next level -> intro -> start -> 1 move -> pause -> home -> Continue
  await page.tap('[data-act=next]');
  await page.waitForSelector('.intro [data-act=start]');
  await page.screenshot({ path: outDir + '04-intro.png' });
  await page.tap('.intro [data-act=start]');
  await page.waitForTimeout(300);
  const first = await page.evaluate(() => window.__game.level.solution[0]);
  await tapBolt(first[0]); await tapBolt(first[1]);
  await page.waitForTimeout(600);
  await page.tap('[data-act=pause]');
  await page.tap('.card [data-act=home]');
  await page.waitForSelector('#s-home.active');
  const cont = await page.textContent('[data-act=continue]').catch(() => '');
  ok(/Easy · Level 1 · 1 move in/.test(cont), `Continue appears: "${cont.replace(/\s+/g, ' ').trim()}"`);
  await page.screenshot({ path: outDir + '05-home-continue.png' });
  await page.tap('[data-act=continue]');
  await page.waitForSelector('#s-play.active');
  ok(await page.evaluate(() => window.__game.moves === 1 && window.__game.history.length === 1), 'Continue resumes exactly (moves + undo history)');

  // offline: service worker must control the page, then reload with the network off
  await page.goto(BASE);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('#s-home.active', { timeout: 10000 });
  ok(await page.isVisible('text=NUT'), 'reload works offline (service worker)');
  const offlinePlay = await page.evaluate(async () => {
    const m = await import('./js/levels.js');
    window.__app.go('play', { level: m.dailyLevel(window.__app.today), saved: null, intro: false });
    return window.__game.level.nuts;
  });
  ok(offlinePlay > 0, `daily board loads offline (${offlinePlay} nuts)`);
  await context.setOffline(false);

  // performance on the largest board (108 nuts)
  const perf = await page.evaluate(async () => {
    const m = await import('./js/levels.js');
    const d = await import('./js/dates.js');
    let date = window.__app.today;
    for (let i = 0; i < 10 && m.dailyLevel(date).nuts < 108; i++) date = d.addDays(date, 1);
    window.__app.go('play', { level: m.dailyLevel(date), saved: null, intro: false, forceNew: true });
    const g = window.__game;
    const frames = []; let last = performance.now(); let run = true;
    (function f(t) { frames.push(t - last); last = t; if (run) requestAnimationFrame(f); })(performance.now());
    for (let k = 0; k < 15; k++) { const [a, b] = g.level.solution[k]; g.tap(a); g.tap(b); await new Promise((r) => setTimeout(r, 150)); }
    await new Promise((r) => setTimeout(r, 600));
    run = false;
    const fr = frames.slice(2);
    return { nuts: g.level.nuts, avg: fr.reduce((a, b) => a + b, 0) / fr.length, worst: Math.max(...fr), long: fr.filter((x) => x > 25).length, n: fr.length };
  });
  ok(perf.nuts === 108 && perf.avg < 20, `108-nut board: avg frame ${perf.avg.toFixed(1)}ms, worst ${perf.worst.toFixed(1)}ms, ${perf.long}/${perf.n} frames > 25ms`);
  await page.screenshot({ path: outDir + '06-giant-board.png' });

  ok(external.length === 0, `no requests outside localhost${external.length ? ': ' + external.join(', ') : ''}`);
  ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} catch (e) {
  failures++;
  console.error('✘ smoke test crashed:', e);
  await page.screenshot({ path: outDir + 'crash.png' }).catch(() => {});
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} smoke check(s) failed` : '\nSmoke test passed');
process.exit(failures ? 1 : 0);

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setCache, ladderLevel, dailyLevel, tutorialLevel, TUTORIAL } from '../app/js/levels.js';
import { checkSolution } from '../app/js/solver.js';
import { validateBoard } from '../app/js/engine.js';
import { mysteryModeFor, BANDS } from '../app/js/config.js';
import { dailyIndex } from '../app/js/dates.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../app/data/${f}.json`, import.meta.url)));
for (const d of ['easy', 'medium', 'hard']) setCache(d, load(`levels-${d}`));
setCache('daily', load('daily'));

test('PDF anchors: Easy 13 = 10 colours, 12 bolts (2 spare), par 24; Hard 11 = 8x9 tall, par 62', () => {
  const e = ladderLevel('easy', 13);
  assert.equal(e.colors, 10); assert.equal(e.bolts, 12); assert.equal(e.spares, 2); assert.equal(e.par, 24);
  const h = ladderLevel('hard', 11);
  assert.equal(h.colors, 8); assert.equal(h.cap, 9); assert.equal(h.par, 62);
});

test('every shipped level: stored solution replays to a win in par moves', () => {
  for (const d of ['easy', 'medium', 'hard']) {
    const n = load(`levels-${d}`).count;
    for (let i = 1; i <= n; i++) {
      const L = ladderLevel(d, i);
      assert.equal(L.solution.length, L.par, `${d} ${i}`);
      assert.ok(checkSolution({ cap: L.cap, bolts: L.state.bolts }, L.solution), `${d} ${i}`);
      assert.equal(L.mysteryMode, mysteryModeFor(d, i));
      assert.ok(L.par >= BANDS[d].par[0] && L.par <= BANDS[d].par[1]);
    }
  }
});

test('endless levels beyond the shipped set are valid, deterministic, keep cadence', () => {
  for (const d of ['easy', 'medium', 'hard']) {
    for (const n of [301, 302, 303, 450, 999, 10000]) {
      const L = ladderLevel(d, n);
      assert.ok(validateBoard(L.cap, L.state.bolts).ok);
      assert.ok(checkSolution({ cap: L.cap, bolts: L.state.bolts }, L.solution), `${d} ${n}`);
      assert.equal(L.mysteryMode, mysteryModeFor(d, n));
      assert.deepEqual(ladderLevel(d, n).state, L.state);
      assert.ok(L.state.bolts.slice(-2).every((b) => !b.length), 'spares at the end');
    }
  }
});

test('daily: same board all day, different next day, valid', () => {
  const a = dailyLevel('2026-10-03');
  assert.deepEqual(dailyLevel('2026-10-03').state, a.state);
  assert.notEqual(dailyIndex('2026-10-04', 365), dailyIndex('2026-10-03', 365));
  assert.ok(a.par >= 75 && a.par <= 108);
  assert.ok(checkSolution({ cap: a.cap, bolts: a.state.bolts }, a.solution));
});

test('tutorial level', () => {
  const t = tutorialLevel();
  assert.equal(t.colors, 3); assert.equal(t.bolts, 5); assert.equal(t.par, TUTORIAL.p);
  assert.ok(checkSolution({ cap: 3, bolts: t.state.bolts }, t.solution));
});

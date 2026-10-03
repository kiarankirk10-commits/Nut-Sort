import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fullHint, mysteryHint } from '../app/js/hint-core.js';
import { setCache, ladderLevel } from '../app/js/levels.js';
import { solutionIndex } from '../app/js/hints.js';
import { canMove, cloneState, applyMove } from '../app/js/engine.js';
import { solve } from '../app/js/solver.js';

for (const d of ['easy', 'hard']) setCache(d, JSON.parse(fs.readFileSync(new URL(`../app/data/levels-${d}.json`, import.meta.url))));

test('stored solution path gives the next move at every step', () => {
  const L = ladderLevel('easy', 13);
  const idx = solutionIndex(L);
  const st = cloneState(L.state);
  for (const [f, t] of L.solution) {
    assert.deepEqual(idx.get(st.bolts.map((b) => b.join(',')).join('|')), [f, t]);
    applyMove(st, f, t);
  }
});

test('off-route full hint is a legal move that keeps the board solvable', () => {
  const L = ladderLevel('easy', 20);
  const st = cloneState(L.state);
  // wander off the stored route with two legal moves that are not the planned first move
  let n = 0;
  for (let i = 0; i < st.bolts.length && n < 2; i++) for (let j = 0; j < st.bolts.length && n < 2; j++) {
    if (canMove(st, i, j) && !(i === L.solution[0][0] && j === L.solution[0][1])) { applyMove(st, i, j); n++; }
  }
  const h = fullHint(st.cap, st.bolts, 2000);
  assert.ok(h.move && canMove(st, h.move[0], h.move[1]));
  applyMove(st, h.move[0], h.move[1]);
  assert.ok(solve({ cap: st.cap, bolts: st.bolts }, { timeMs: 3000 }).solved);
});

test('mystery hint only sees visible nuts: same answer whatever the hidden colours are', () => {
  const L = ladderLevel('hard', 6);
  assert.ok(L.mystery);
  const st = L.state;
  const masked = st.bolts.map((b, i) => b.map((c, k) => (st.hidden[i][k] ? -1 : c)));
  assert.ok(masked.flat().includes(-1));
  const a = mysteryHint(st.cap, masked, 3000, 4);
  const b = mysteryHint(st.cap, masked.map((x) => x.slice()), 3000, 4);
  assert.ok(a.move, 'found a move');
  assert.deepEqual(a.move, b.move, 'deterministic from visible info');
  assert.ok(canMove(st, a.move[0], a.move[1]), 'legal on the real board');
});

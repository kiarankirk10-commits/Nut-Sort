import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, checkSolution, heuristic, _internal } from '../app/js/solver.js';
import { TUTORIAL } from '../app/js/levels.js';
import { decodeBoard } from '../app/js/engine.js';
import { makeBoard, hashSeed } from '../tools/generator.js';

test('tutorial board: optimal par 5 with group moves (stars <=6 / <=8)', () => {
  const st = decodeBoard(TUTORIAL.b, TUTORIAL.h);
  const r = solve({ cap: TUTORIAL.h, bolts: st.bolts });
  assert.equal(r.solved, true);
  assert.equal(r.optimal, true);
  assert.equal(r.length, TUTORIAL.p);
  assert.ok(checkSolution({ cap: TUTORIAL.h, bolts: st.bolts }, r.moves));
});

test('solves random boards and solutions replay', () => {
  for (let i = 0; i < 10; i++) {
    const b = makeBoard({ C: 8, H: 4, S: 2 }, hashSeed('t', i));
    const r = solve(b, { timeMs: 3000 });
    assert.ok(r.solved);
    assert.ok(checkSolution(b, r.moves));
    assert.ok(r.length >= heuristic(_internal.toStrings(b.bolts)), 'heuristic is a lower bound');
  }
});

test('one spare is often unsolvable; solver reports it', () => {
  // classic dead board: two full bolts, swapped tops, no spare
  const r = solve({ cap: 2, bolts: [[0, 1], [1, 0]] }, { timeMs: 500 });
  assert.equal(r.solved, false);
});

test('canonical key ignores bolt order', () => {
  const { keyOf, toStrings } = _internal;
  assert.equal(keyOf(toStrings([[0, 1], [], [2]])), keyOf(toStrings([[2], [0, 1], []])));
});

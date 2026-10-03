import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../app/js/engine.js';

const R = 0, B = 1, G = 2, P = 3; // red blue green purple

test('legal: empty bolt or same colour with room', () => {
  const s = E.createState(4, [[R, B], [G, B], [], [R, R, R, B]]);
  assert.equal(E.canMove(s, 0, 2), true);   // onto empty
  assert.equal(E.canMove(s, 0, 1), true);   // blue onto blue
  assert.equal(E.canMove(s, 0, 3), false);  // full
  assert.equal(E.canMove(s, 2, 0), false);  // empty source
  assert.equal(E.canMove(s, 0, 0), false);
  assert.deepEqual(E.legalTargets(s, 0), [1, 2]);
});

test('group move: room for 3, run of 2 -> both move (counts as 1 move)', () => {
  // v2 p6 example: blue run of 2 onto a bolt with one blue on top and room
  const s = E.createState(5, [[G, R, B, B], [P, G, B], []]);
  const rec = E.applyMove(s, 0, 1);
  assert.equal(rec.count, 2);
  assert.deepEqual(s.bolts[0], [G, R]);
  assert.deepEqual(s.bolts[1], [P, G, B, B, B]);
});

test('group move: room for 1, run of 2 -> only one moves', () => {
  const s = E.createState(4, [[G, R, B, B], [P, R, B], []]);
  const rec = E.applyMove(s, 0, 1);
  assert.equal(rec.count, 1);
  assert.deepEqual(s.bolts[0], [G, R, B]);
  assert.deepEqual(s.bolts[1], [P, R, B, B]);
});

test('run lengths and move counts', () => {
  const s = E.createState(4, [[R, B, B, B], []]);
  assert.equal(E.topRun(s, 0), 3);
  assert.equal(E.moveCount(s, 0, 1), 3);
});

test('mystery: hidden nuts never join a group; reveal on becoming top', () => {
  // bottom red, hidden blue, visible blue, visible blue
  const s = E.createState(4, [[R, B, B, B], [], []], [[false, true, false, false], [], []]);
  assert.equal(E.topRun(s, 0), 2, 'the hidden blue does not join the run');
  const rec = E.applyMove(s, 0, 1);
  assert.equal(rec.count, 2);
  assert.deepEqual(s.bolts[1], [B, B]);
  assert.deepEqual(s.bolts[0], [R, B]);
  assert.equal(s.hidden[0][1], false, 'revealed after the run left');
  assert.equal(rec.revealed, 1);
});

test('mystery: a nut revealed by a move does not join that same move', () => {
  const s = E.createState(5, [[R, B, B], []], [[true, true, false], []]);
  const rec = E.applyMove(s, 0, 1);
  assert.equal(rec.count, 1, 'only the visible top blue moved');
  assert.deepEqual(s.bolts[0], [R, B]);
  assert.equal(s.hidden[0][1], false);
  assert.equal(s.hidden[0][0], true);
});

test('mystery: undo re-hides revealed nuts (no peeking)', () => {
  const s = E.createState(4, [[R, G, B], [], []], [[true, true, false], [], []]);
  const before = JSON.stringify(s);
  const rec = E.applyMove(s, 0, 1);
  assert.equal(s.hidden[0][1], false);
  E.undoMove(s, rec);
  assert.equal(JSON.stringify(s), before);
  assert.equal(s.hidden[0][1], true);
});

test('undo restores exact state for group + partial moves', () => {
  const s = E.createState(4, [[G, R, B, B], [P, R, B], [], [P, P, P, G]]);
  const snap = JSON.stringify(s);
  const recs = [E.applyMove(s, 0, 1), E.applyMove(s, 0, 2), E.applyMove(s, 1, 2)];
  assert.ok(recs.every(Boolean));
  for (const r of recs.reverse()) E.undoMove(s, r);
  assert.equal(JSON.stringify(s), snap);
});

test('top nut is never hidden', () => {
  const s = E.createState(3, [[R, G, B]], [[true, true, true]]);
  assert.deepEqual(s.hidden[0], [true, true, false]);
});

test('win detection', () => {
  assert.equal(E.isWon(E.createState(3, [[R, R, R], [B, B, B], []])), true);
  assert.equal(E.isWon(E.createState(3, [[R, R], [B, B, B], [R]])), false);
  assert.equal(E.isWon(E.createState(3, [[R, R, B], [B, B, R], []])), false);
  assert.equal(E.isBoltComplete(E.createState(3, [[R, R, R]]), 0), true);
});

test('no-moves detection', () => {
  const stuck = E.createState(2, [[R, B], [B, R]]);
  assert.equal(E.hasLegalMove(stuck), false);
  E.addBolt(stuck);
  assert.equal(E.hasLegalMove(stuck), true);
});

test('encode/decode board with hidden nuts round-trips', () => {
  const s = E.createState(3, [[R, G, B], [B, B, G], [], []], [[true, true, false], [], [], []]);
  const str = E.encodeBoard(s);
  assert.equal(str, 'ACb.bbc..');
  assert.deepEqual(E.decodeBoard(str, 3), s);
  assert.deepEqual(E.decodeMoves(E.encodeMoves([[0, 1], [12, 3]])), [[0, 1], [12, 3]]);
});

test('validateBoard', () => {
  assert.equal(E.validateBoard(3, [[R, R, B], [B, B, R], []]).ok, true);
  assert.equal(E.validateBoard(3, [[R, R, B], [B, B, B], []]).ok, false);
});

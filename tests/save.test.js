import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave, migrate, recordLevelWin, recordDaily, starBalance, spend, refreshStreak, averageStars } from '../app/js/save.js';
import { SCHEMA_VERSION } from '../app/js/config.js';

test('defaults + migration from an old/partial save', () => {
  const s = migrate({ progress: { easy: { best: { 1: 3 }, next: 2 } }, stars: { earned: 5, spent: 0 } });
  assert.equal(s.schema, SCHEMA_VERSION);
  assert.equal(s.progress.easy.best[1], 3);
  assert.ok(s.progress.hard, 'missing difficulty filled in');
  assert.ok(s.themes.owned.includes('black-gold'));
  assert.equal(migrate(null).schema, SCHEMA_VERSION);
  assert.throws(() => migrate({ schema: SCHEMA_VERSION + 1 }));
});

test('save round-trips through JSON (backup/restore)', () => {
  const s = defaultSave();
  recordLevelWin(s, 'easy', 1, 15, 14, false, 18);
  const back = migrate(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(back, s);
});

test('best stars kept; replay improvements earn the difference only', () => {
  const s = defaultSave();
  let r = recordLevelWin(s, 'easy', 13, 38, 24, false, 30);
  assert.equal(r.stars, 2); assert.equal(r.gained, 2);
  r = recordLevelWin(s, 'easy', 13, 40, 24, false, 30);
  assert.equal(r.stars, 1); assert.equal(r.gained, 0); assert.equal(s.progress.easy.best[13], 2);
  r = recordLevelWin(s, 'easy', 13, 21, 24, false, 30);
  assert.equal(r.gained, 1);
  assert.equal(starBalance(s), 3);
  assert.equal(s.stats.levelsSolved, 1);
  assert.equal(s.stats.perfect, 1);
  assert.equal(s.stats.nutsSorted, 90);
  assert.equal(s.progress.easy.next, 14);
});

test('daily pays once per day, with streak bonus; spending tracked separately', () => {
  const s = defaultSave();
  const a = recordDaily(s, '2026-10-02', 90, 99, false, 108, false);
  assert.equal(a.reward.total, 9);
  const b = recordDaily(s, '2026-10-02', 90, 99, false, 108, false);
  assert.equal(b.already, true);
  const c = recordDaily(s, '2026-10-03', 90, 99, false, 108, true);
  assert.equal(c.reward.total, (9 + 1) * 2);
  assert.equal(starBalance(s), 29);
  assert.equal(spend(s, 40), false);
  assert.equal(spend(s, 20), true);
  assert.equal(starBalance(s), 9);
  assert.equal(s.stars.earned, 29);
  assert.ok(Math.abs(averageStars(s) - 3) < 1e-9);
});

test('refreshStreak marks a freeze notice', () => {
  const s = defaultSave();
  s.streak = { ...s.streak, current: 3, best: 3, freezes: 1, lastWin: '2026-10-01', beaten: 3 };
  refreshStreak(s, '2026-10-03');
  assert.equal(s.seen.freezeNotice, '2026-10-03');
});

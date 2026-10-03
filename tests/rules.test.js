import { test } from 'node:test';
import assert from 'node:assert/strict';
import { thresholds, starsFor, dailyReward } from '../app/js/stars.js';
import { evaluateStreak, recordDailyWin, newStreak, daysToNextFreeze } from '../app/js/streak.js';
import { localDateStr, daysBetween, addDays, dailyIndex, chipLabel, dayNumber } from '../app/js/dates.js';
import { birthdayOn, activeBirthday } from '../app/js/birthday.js';

test('star thresholds match the PDF numbers (floor)', () => {
  assert.deepEqual(thresholds(24), { three: 28, two: 38 });   // v2 p12
  assert.deepEqual(thresholds(20), { three: 24, two: 32 });   // v1 p6
  assert.deepEqual(thresholds(62), { three: 74, two: 99 });   // v2 p8 Hard L11
  assert.deepEqual(thresholds(36, true), { three: 54, two: 72 }); // v2 p7 mystery L10
});

test('stars for moves', () => {
  assert.equal(starsFor(21, 24), 3);
  assert.equal(starsFor(28, 24), 3);
  assert.equal(starsFor(29, 24), 2);
  assert.equal(starsFor(38, 24), 2);
  assert.equal(starsFor(39, 24), 1);
  assert.equal(starsFor(54, 36, true), 3);
  assert.equal(starsFor(55, 36, true), 2);
  assert.equal(starsFor(73, 36, true), 1);
});

test('daily reward: 3x + streak bonus capped at +10, birthday 2x', () => {
  assert.deepEqual(dailyReward(3, 5), { base: 9, bonus: 4, mult: 1, total: 13 }); // PDF p5: 5-day streak +4
  assert.equal(dailyReward(1, 1).total, 3);
  assert.equal(dailyReward(2, 1).total, 6);
  assert.equal(dailyReward(3, 40).bonus, 10);
  assert.equal(dailyReward(3, 40).total, 19);       // max per day (non-birthday)
  assert.equal(dailyReward(3, 5, true).total, 26);  // (9 + 4) x 2
});

test('dates: local strings, day math across month/year/DST', () => {
  assert.equal(localDateStr(new Date(2026, 9, 3, 23, 59)), '2026-10-03');
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.equal(daysBetween('2027-03-27', '2027-03-29'), 2); // DST weekend in UK
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(chipLabel('2026-10-02'), 'FRI 2 OCT');
  assert.equal(chipLabel('2027-03-15'), 'MON 15 MAR');     // PDF: "In 2027 that is a Monday"
});

test('daily index is deterministic and rolls over at midnight', () => {
  const a = dailyIndex('2026-10-03', 365), b = dailyIndex('2026-10-04', 365);
  assert.equal(a, dailyIndex('2026-10-03', 365));
  assert.equal((a + 1) % 365, b);
  assert.ok(dailyIndex('1969-12-31', 70) >= 0);
  assert.equal(dayNumber('1970-01-01'), 0);
});

test('streak: consecutive wins, best, beaten', () => {
  let s = newStreak();
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) s = recordDailyWin(s, d).streak;
  assert.equal(s.current, 3); assert.equal(s.best, 3); assert.equal(s.beaten, 3);
  const again = recordDailyWin(s, '2026-10-03');
  assert.equal(again.already, true); assert.equal(again.streak.current, 3);
});

test('streak: freeze earned every 7 days, hold max 2', () => {
  let s = newStreak();
  let d = '2026-01-01';
  const earned = [];
  for (let i = 1; i <= 28; i++) { const r = recordDailyWin(s, d); s = r.streak; if (r.earnedFreeze) earned.push(i); d = addDays(d, 1); }
  assert.deepEqual(earned, [7, 14]);
  assert.equal(s.freezes, 2);
  assert.equal(s.current, 28);
  assert.equal(daysToNextFreeze(s), 7);
});

test('streak: missing exactly one day consumes a freeze', () => {
  let s = { ...newStreak(), current: 12, best: 12, freezes: 1, lastWin: '2026-10-01', beaten: 12 };
  const r = evaluateStreak(s, '2026-10-03'); // missed 10-02
  assert.equal(r.freezeUsed, true);
  assert.equal(r.streak.current, 12);
  assert.equal(r.streak.freezes, 0);
  const w = recordDailyWin(r.streak, '2026-10-03');
  assert.equal(w.streak.current, 13);
});

test('streak: missing one day with no freeze resets; missing 2+ always resets', () => {
  const base = { ...newStreak(), current: 5, best: 5, lastWin: '2026-10-01', beaten: 5 };
  assert.equal(evaluateStreak({ ...base, freezes: 0 }, '2026-10-03').streak.current, 0);
  const r = evaluateStreak({ ...base, freezes: 2 }, '2026-10-04');
  assert.equal(r.streak.current, 0); assert.equal(r.reset, true); assert.equal(r.streak.best, 5);
  assert.equal(recordDailyWin(r.streak, '2026-10-04').streak.current, 1);
});

test('streak: yesterday-won is still alive; clock moved back changes nothing', () => {
  const s = { ...newStreak(), current: 4, best: 4, lastWin: '2026-10-02', beaten: 4 };
  assert.equal(evaluateStreak(s, '2026-10-03').streak.current, 4);
  assert.equal(evaluateStreak(s, '2026-09-20').streak.current, 4);
});

test('streak: app not opened for days -> evaluated once, correctly', () => {
  const s = { ...newStreak(), current: 9, best: 9, freezes: 1, lastWin: '2026-09-01', beaten: 9 };
  const r = evaluateStreak(s, '2026-10-03');
  assert.equal(r.streak.current, 0);
  assert.equal(r.streak.freezes, 1, 'freeze not wasted on a long gap');
});

test('birthdays: Kiaran 15 Mar, Flynn 19 Oct, preview', () => {
  assert.equal(birthdayOn('2027-03-15').name, 'Kiaran');
  assert.equal(birthdayOn('2026-10-19').name, 'Flynn');
  assert.equal(birthdayOn('2026-10-18'), null);
  assert.deepEqual(activeBirthday('2026-10-03', 'Flynn'), { person: { name: 'Flynn', month: 10, day: 19 }, real: false });
  assert.equal(activeBirthday('2026-10-03', null), null);
  assert.equal(activeBirthday('2027-03-15', null).real, true);
});

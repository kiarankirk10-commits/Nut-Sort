// Star rules (pure). Thresholds: config STARS. Rounding: floor, matching the PDF
// (par 24 -> 3 stars <= 28, 2 stars <= 38; par 62 -> 74 / 99; mystery par 36 -> 54 / 72).
import { STARS } from './config.js';

export function thresholds(par, mystery = false) {
  const t = mystery ? STARS.mystery : STARS.normal;
  return {
    three: Math.floor(par * t.three + 1e-9),
    two: Math.floor(par * t.two + 1e-9),
  };
}

export function starsFor(moves, par, mystery = false) {
  const t = thresholds(par, mystery);
  if (moves <= t.three) return 3;
  if (moves <= t.two) return 2;
  return 1;
}

/**
 * Daily reward: base stars x3, plus streak bonus (+1 per day already in the streak before
 * today's win, capped), all x2 on a birthday.
 * PDF p5: a 5-day streak (after today's win) shows "+4".
 */
export function dailyReward(stars, newStreak, isBirthday = false) {
  const base = stars * STARS.dailyMultiplier;
  const bonus = Math.min(Math.max(0, newStreak - 1), STARS.streakBonusCap);
  const mult = isBirthday ? STARS.birthdayDailyMultiplier : 1;
  return { base, bonus, mult, total: (base + bonus) * mult };
}

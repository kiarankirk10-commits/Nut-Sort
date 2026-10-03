// Daily streak + streak freeze rules (pure). See docs/SPEC.md "Streaks".
//  - streak = consecutive days the daily was beaten
//  - earn 1 freeze each time the streak reaches a multiple of 7; hold at most 2
//  - missing exactly one day auto-uses a freeze (streak kept); missing 2+ days resets to 0
//  - clock moved backwards: nothing changes
import { STREAK } from './config.js';
import { daysBetween, addDays } from './dates.js';

export function newStreak() {
  return { current: 0, best: 0, freezes: 0, lastWin: null, beaten: 0, freezeUsedOn: null };
}

/**
 * Bring the streak up to date for `today` (call on launch / before showing streak UI).
 * Returns { streak, freezeUsed, reset }.
 */
export function evaluateStreak(s, today) {
  const st = { ...s };
  let freezeUsed = false, reset = false;
  if (!st.lastWin || st.current === 0) return { streak: st, freezeUsed, reset };
  const gap = daysBetween(st.lastWin, today);
  if (gap <= 1) return { streak: st, freezeUsed, reset };   // today or yesterday (or clock went back)
  if (gap === 2 && st.freezes > 0) {
    st.freezes -= 1;
    st.lastWin = addDays(today, -1);                          // the freeze covers yesterday
    st.freezeUsedOn = today;
    freezeUsed = true;
  } else {
    st.current = 0;
    reset = true;
  }
  return { streak: st, freezeUsed, reset };
}

/** Record beating today's daily. Returns { streak, earnedFreeze, already }. */
export function recordDailyWin(s, today) {
  const { streak: st } = evaluateStreak(s, today);
  if (st.lastWin === today) return { streak: st, earnedFreeze: false, already: true };
  const continuing = st.lastWin && daysBetween(st.lastWin, today) === 1 && st.current > 0;
  st.current = continuing ? st.current + 1 : 1;
  st.best = Math.max(st.best, st.current);
  st.beaten += 1;
  st.lastWin = today;
  let earnedFreeze = false;
  if (st.current % STREAK.freezeEvery === 0 && st.freezes < STREAK.freezeMax) {
    st.freezes += 1;
    earnedFreeze = true;
  }
  return { streak: st, earnedFreeze, already: false };
}

/** Days until the next freeze is earned. */
export function daysToNextFreeze(s) {
  return STREAK.freezeEvery - (s.current % STREAK.freezeEvery);
}

/** Is today's daily done? */
export function dailyDoneToday(s, today) {
  return s.lastWin === today;
}

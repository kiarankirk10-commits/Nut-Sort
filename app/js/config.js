// Nut Sort — central configuration. Every tunable number lives here (see docs/TUNING.md).
// "Starting point, to be tuned after Kiaran plays."

export const APP_NAME = 'Nut Sort';
export const APP_VERSION = '1.0.0';
export const CREATOR = 'Kiaran';
export const FUNDED_BY = 'F. Roughan';

// ---------- feature flags (new mechanics slot in here) ----------
export const FEATURES = {
  mystery: true,
  hints: true,
  extraBolt: true,
  daily: true,
  themes: true,
  birthday: true,
  music: true,
  levelSelect: true,
};

// ---------- board / screen rules ----------
export const MIN_SPARES = 2;
export const MIN_NUT_PX = 31;        // nuts must stay at least 31px wide (easy taps)
export const MAX_NUT_PX = 62;
// max bolts on screen by bolt height (v2 p8)
export const MAX_BOLTS_BY_HEIGHT = [
  { maxH: 5, bolts: 35 },
  { maxH: 7, bolts: 28 },
  { maxH: 10, bolts: 21 },
  { maxH: 12, bolts: 14 },
];
export function maxBoltsForHeight(h) {
  for (const r of MAX_BOLTS_BY_HEIGHT) if (h <= r.maxH) return r.bolts;
  return 14;
}

// ---------- difficulty bands (v2 p10 / p16) ----------
export const BANDS = {
  easy:   { colors: [6, 12], height: [3, 5], bolts: [9, 14],  spares: [2, 3], par: [14, 36], mystery: 'none' },
  medium: { colors: [6, 15], height: [3, 7], bolts: [8, 17],  spares: [2, 2], par: [26, 49], mystery: 'every 5th from L10, half the bolts' },
  hard:   { colors: [8, 18], height: [4, 9], bolts: [10, 20], spares: [2, 2], par: [48, 86], mystery: 'every 3rd from L6, every bolt' },
  daily:  { colors: [8, 18], height: [5, 9], bolts: [10, 21], spares: [2, 2], par: [75, 108] },
};
export const MAX_LADDER_NUTS = 90;
export const MAX_DAILY_NUTS = 108;

/** Mystery cadence: 0 none, 1 half the bolts, 2 every bolt. level is 1-based. */
export function mysteryModeFor(difficulty, level) {
  if (difficulty === 'medium') return level >= 10 && level % 5 === 0 ? 1 : 0;
  if (difficulty === 'hard') return level >= 6 && level % 3 === 0 ? 2 : 0;
  return 0;
}

// ---------- stars ----------
// Thresholds are fractions of par. PDF numbers use floor (par 24 -> 28 / 38; par 62 -> 74 / 99).
export const STARS = {
  normal: { three: 1.2, two: 1.6 },
  mystery: { three: 1.5, two: 2.0 },
  dailyMultiplier: 3,        // 3, 6 or 9
  streakBonusCap: 10,        // +1 per streak day (days already in the streak), max +10
  birthdayDailyMultiplier: 2,
};

// ---------- per-level helpers ----------
export const HINTS_PER_LEVEL = 3;
export const HINTS_PER_MYSTERY_LEVEL = 1;
export const EXTRA_BOLTS_PER_LEVEL = 2;

// ---------- streaks ----------
export const STREAK = {
  freezeEvery: 7,   // earn 1 freeze per 7-day streak
  freezeMax: 2,     // hold at most 2
};

// ---------- birthdays (local date) ----------
export const BIRTHDAYS = [
  { name: 'Kiaran', month: 3, day: 15 },
  { name: 'Flynn', month: 10, day: 19 },
];

// ---------- motion (ms) ----------
export const MOTION = {
  lift: 120,
  glide: 180,
  drop: 120,
  stagger: 40,          // each extra nut in a run starts 40ms later
  boltPulse: 250,
  reveal: 180,
  confetti: 1500,
  fade: 120,            // reduce-motion quick fades
  screenFade: 180,
  themeCrossfade: 300,
};

// ---------- level sets ----------
export const LEVEL_FILES = {
  easy: 'data/levels-easy.json',
  medium: 'data/levels-medium.json',
  hard: 'data/levels-hard.json',
  daily: 'data/daily.json',
};

// ---------- hints solver (in-app worker) ----------
export const HINT_SOLVER = {
  timeMs: 4000,          // background re-solve budget on the phone
  mysterySamples: 6,     // determinizations for mystery hints (visible info only)
  mysteryTimeMs: 4000,
};

export const STORAGE_KEY = 'nutsort.save';
export const SCHEMA_VERSION = 1;

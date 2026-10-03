// Save model (pure): defaults, migrations, and every progress mutation.
// storage.js handles the actual localStorage I/O and backup files.
import { SCHEMA_VERSION } from './config.js';
import { newStreak, recordDailyWin, evaluateStreak } from './streak.js';
import { starsFor, dailyReward } from './stars.js';

export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const FREE_THEMES = ['black-gold', 'cosmic-purple'];

export function defaultSave() {
  return {
    schema: SCHEMA_VERSION,
    createdAt: Date.now(),
    settings: { sound: true, music: false, reduceMotion: false, symbols: true, birthdayPreview: null },
    tutorialDone: false,
    progress: {
      easy: { best: {}, next: 1 },
      medium: { best: {}, next: 1 },
      hard: { best: {}, next: 1 },
    },
    inProgress: {},          // slot -> saved game (see game.js serialise())
    lastSlot: null,          // slot of the most recently played unfinished game
    daily: { results: {} },  // 'YYYY-MM-DD' -> { stars, moves, reward }
    streak: newStreak(),
    stars: { earned: 0, spent: 0 },
    stats: { levelsSolved: 0, perfect: 0, nutsSorted: 0, wins: 0, solvedBy: { easy: 0, medium: 0, hard: 0 } },
    themes: { owned: FREE_THEMES.slice(), equipped: 'black-gold' },
    seen: { birthdayGreeting: null, freezeNotice: null, hintBubble: false },
  };
}

// Migrations: index i upgrades schema i -> i+1. Add new ones at the end; never edit old ones.
export const MIGRATIONS = [
  // 0 -> 1: pre-release saves (no schema field) — merge onto defaults
  (s) => ({ ...defaultSave(), ...s, schema: 1 }),
];

/** Deep-merge missing keys from defaults so older saves always have every field. */
function fillDefaults(target, defaults) {
  for (const k of Object.keys(defaults)) {
    if (target[k] === undefined) target[k] = structuredCloneSafe(defaults[k]);
    else if (isPlainObject(defaults[k]) && isPlainObject(target[k]) && k !== 'best' && k !== 'results' && k !== 'inProgress') fillDefaults(target[k], defaults[k]);
  }
  return target;
}
function isPlainObject(x) { return x && typeof x === 'object' && !Array.isArray(x); }
function structuredCloneSafe(x) { return JSON.parse(JSON.stringify(x)); }

/** Bring any save (or garbage) up to the current schema. */
export function migrate(raw) {
  let s = raw && typeof raw === 'object' ? raw : defaultSave();
  let v = typeof s.schema === 'number' ? s.schema : 0;
  if (v > SCHEMA_VERSION) throw new Error(`Save is from a newer version (schema ${v})`);
  while (v < SCHEMA_VERSION) { s = MIGRATIONS[v](s); v = s.schema; }
  fillDefaults(s, defaultSave());
  for (const id of FREE_THEMES) if (!s.themes.owned.includes(id)) s.themes.owned.push(id);
  return s;
}

// ---------- stars economy ----------
export function starBalance(s) { return s.stars.earned - s.stars.spent; }
export function earn(s, n) { s.stars.earned += Math.max(0, n); }
export function spend(s, n) {
  if (starBalance(s) < n) return false;
  s.stars.spent += n;
  return true;
}

// ---------- ladder results ----------
/**
 * Record a finished ladder level. Returns { stars, gained, best, firstSolve }.
 * Only improvements over the previous best earn new stars (replay to chase 3 stars).
 */
export function recordLevelWin(s, difficulty, level, moves, par, mystery, nuts) {
  const stars = starsFor(moves, par, mystery);
  const p = s.progress[difficulty];
  const prev = p.best[level] || 0;
  const best = Math.max(prev, stars);
  const gained = best - prev;
  p.best[level] = best;
  if (level >= p.next) p.next = level + 1;
  earn(s, gained);
  const firstSolve = prev === 0;
  if (firstSolve) { s.stats.levelsSolved++; s.stats.solvedBy[difficulty]++; }
  if (stars === 3 && prev < 3) s.stats.perfect++;
  s.stats.nutsSorted += nuts;
  s.stats.wins++;
  return { stars, gained, best, firstSolve };
}

/** Record beating today's daily. Returns reward details. Re-beating the same day pays nothing. */
export function recordDaily(s, today, moves, par, mystery, nuts, isBirthday) {
  const stars = starsFor(moves, par, mystery);
  const r = recordDailyWin(s.streak, today);
  s.streak = r.streak;
  if (r.already) return { stars, already: true, reward: { base: 0, bonus: 0, mult: 1, total: 0 }, streak: s.streak };
  const reward = dailyReward(stars, s.streak.current, isBirthday);
  earn(s, reward.total);
  s.daily.results[today] = { stars, moves, reward: reward.total };
  if (stars === 3) s.stats.perfect++;
  s.stats.nutsSorted += nuts;
  s.stats.wins++;
  return { stars, already: false, reward, earnedFreeze: r.earnedFreeze, streak: s.streak };
}

/** Update streak for today; remembers that a freeze notice must be shown. */
export function refreshStreak(s, today) {
  const r = evaluateStreak(s.streak, today);
  s.streak = r.streak;
  if (r.freezeUsed) s.seen.freezeNotice = today;
  return r;
}

// ---------- derived stats ----------
export function averageStars(s) {
  let n = 0, sum = 0;
  for (const d of DIFFICULTIES) for (const v of Object.values(s.progress[d].best)) { n++; sum += v; }
  for (const r of Object.values(s.daily.results)) { n++; sum += r.stars; }
  return n ? sum / n : 0;
}

export function starsInDifficulty(s, d) {
  return Object.values(s.progress[d].best).reduce((a, b) => a + b, 0);
}
export function doneInDifficulty(s, d) {
  return Object.keys(s.progress[d].best).length;
}

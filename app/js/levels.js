// Level data access. Boards are pre-generated on the Mac (tools/build-levels.js) and shipped
// as JSON; the phone never solves to create levels.
import { decodeBoard, decodeMoves, encodeBoard, createState } from './engine.js';
import { LEVEL_FILES, mysteryModeFor } from './config.js';
import { dailyIndex } from './dates.js';
import { mulberry32, shuffleInPlace } from './rng.js';

// The very first level ever: 3 colours, 3 high, 2 spares (v1 p4 board).
// Colours: a = red/heart, b = light grey/star, c = purple/moon.
export const TUTORIAL = { c: 3, h: 3, s: 2, shape: 'tutorial', m: 0, b: 'cba.aab.bcc..', p: 5, sol: '2312010203', opt: 1 };

const cache = {};

/** Load a level set (browser: fetch; cached). Node tools read the JSON directly instead. */
export async function loadSet(name) {
  if (cache[name]) return cache[name];
  const res = await fetch(LEVEL_FILES[name]);
  if (!res.ok) throw new Error(`Could not load ${name} levels`);
  cache[name] = await res.json();
  return cache[name];
}
export function setCache(name, data) { cache[name] = data; }
export function shippedCount(name) { return cache[name] ? cache[name].count : 0; }

/** Turn a raw record into a playable level description. */
export function toLevel(rec, meta) {
  const state = decodeBoard(rec.b, rec.h);
  return {
    ...meta,
    cap: rec.h,
    colors: rec.c,
    spares: rec.s,
    bolts: state.bolts.length,
    shape: rec.shape,
    mystery: !!rec.m,
    mysteryMode: rec.m || 0,
    par: rec.p,
    state,
    solution: decodeMoves(rec.sol),
    nuts: rec.c * rec.h,
    raw: rec,
  };
}

export function tutorialLevel() {
  return toLevel(TUTORIAL, { kind: 'tutorial', difficulty: 'tutorial', number: 1, id: 'tutorial' });
}

/**
 * Level n (1-based) of a difficulty. Beyond the shipped count we keep going forever:
 * pick a plateau board with the right mystery cadence, recolour it with a seeded colour
 * permutation and shuffle the bolt order. Same n -> same board; par and solution carry over.
 */
export function ladderLevel(difficulty, n) {
  const set = cache[difficulty];
  if (!set) throw new Error(`${difficulty} levels not loaded`);
  const meta = { kind: 'level', difficulty, number: n, id: `${difficulty}-${n}` };
  if (n <= set.count) return toLevel(set.levels[n - 1], meta);
  return toLevel(endlessRecord(set, difficulty, n), meta);
}

export function endlessRecord(set, difficulty, n) {
  const want = mysteryModeFor(difficulty, n);
  const plateauStart = Math.min(30, set.count - 1);
  const pool = [];
  for (let i = plateauStart; i < set.count; i++) if ((set.levels[i].m || 0) === want) pool.push(i);
  const rnd = mulberry32((n * 2654435761) >>> 0);
  const base = set.levels[pool[Math.floor(rnd() * pool.length)]];
  const st = decodeBoard(base.b, base.h);
  // recolour
  const perm = shuffleInPlace([...Array(18).keys()], rnd);
  const bolts = st.bolts.map((b) => b.map((c) => perm[c]));
  // shuffle bolt order, remap solution
  // new position k holds old bolt order[k]; spares stay at the end
  const filled = [...bolts.keys()].filter((i) => bolts[i].length);
  const empty = [...bolts.keys()].filter((i) => !bolts[i].length);
  const order = [...shuffleInPlace(filled, rnd), ...empty];
  const inv = []; order.forEach((old, k) => { inv[old] = k; });
  const nb = order.map((o) => bolts[o]);
  const nh = order.map((o) => st.hidden[o]);
  const sol = decodeMoves(base.sol).map(([f, t]) => [inv[f], inv[t]]);
  const enc = encodeBoard(createState(base.h, nb, nh));
  return { ...base, b: enc, sol: sol.map(([f, t]) => f.toString(36) + t.toString(36)).join(''), endless: 1 };
}

/** Today's daily board. */
export function dailyLevel(dateStr) {
  const set = cache.daily;
  if (!set) throw new Error('daily pool not loaded');
  const idx = dailyIndex(dateStr, set.count);
  return toLevel(set.levels[idx], { kind: 'daily', difficulty: 'daily', number: idx + 1, id: `daily-${dateStr}`, date: dateStr });
}

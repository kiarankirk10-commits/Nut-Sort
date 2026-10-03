// Board generator: seed -> board. Pure + deterministic (mulberry32).
// Used by build-levels.js, build-daily.js, calibrate.js and tests.
import { mulberry32, shuffleInPlace } from '../app/js/rng.js';
import { solve } from '../app/js/solver.js';
import { createState, encodeBoard, encodeMoves } from '../app/js/engine.js';
import { maxBoltsForHeight } from '../app/js/config.js';

/** Stable 32-bit hash for building seeds from strings + numbers. */
export function hashSeed(...parts) {
  let h = 2166136261 >>> 0;
  for (const ch of parts.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

/**
 * Make a shuffled board: C colours, H high, S empty spares. All coloured bolts start full.
 * Colours are a random subset of the 18 palette colours (so levels look different).
 */
export function makeBoard({ C, H, S }, seed) {
  const rnd = mulberry32(seed);
  const palette = shuffleInPlace([...Array(18).keys()], rnd).slice(0, C);
  const nuts = [];
  for (const c of palette) for (let k = 0; k < H; k++) nuts.push(c);
  shuffleInPlace(nuts, rnd);
  const bolts = [];
  for (let i = 0; i < C; i++) bolts.push(nuts.slice(i * H, i * H + H));
  for (let i = 0; i < S; i++) bolts.push([]);
  return { cap: H, bolts };
}

/** Basic sanity: no bolt starts finished, no bolt starts with a run of H-1 or more. */
export function boardIsInteresting(board) {
  for (const b of board.bolts) {
    if (!b.length) continue;
    let same = 1, best = 1;
    for (let i = 1; i < b.length; i++) { same = b[i] === b[i - 1] ? same + 1 : 1; best = Math.max(best, same); }
    if (best >= Math.max(3, board.cap - 1)) return false;
  }
  return true;
}

/**
 * Mystery mask. mode 1 = half the coloured bolts, mode 2 = every coloured bolt.
 * On a mystery bolt every nut except the top one is hidden.
 */
export function mysteryMask(board, mode, seed) {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const colored = board.bolts.map((b, i) => (b.length ? i : -1)).filter((i) => i >= 0);
  let chosen = new Set(colored);
  if (mode === 1) chosen = new Set(shuffleInPlace(colored.slice(), rnd).slice(0, Math.ceil(colored.length / 2)));
  return board.bolts.map((b, i) => b.map((_, j) => mode > 0 && chosen.has(i) && j < b.length - 1));
}

/** Validate shape against the screen table and global rules. */
export function shapeAllowed({ C, H, S }) {
  if (S < 2) return false;                    // spare bolts never fewer than 2
  if (C < 3 || C > 18 || H < 3 || H > 9) return false;
  return C + S <= maxBoltsForHeight(H);
}

/**
 * Generate + solve one board. Returns a level record or null if binned.
 * spec: { C, H, S, mystery (0|1|2), shape, solveMs }
 */
export function buildBoard(spec, seed) {
  const board = makeBoard(spec, seed);
  if (!boardIsInteresting(board)) return { binned: 'boring' };
  const r = solve(board, { timeMs: spec.solveMs ?? 6000, firstPassMs: spec.firstPassMs ?? 4000, maxNodes: spec.maxNodes ?? 400000 });
  if (!r.solved) return { binned: 'unsolvable' };
  const hidden = mysteryMask(board, spec.mystery || 0, seed);
  const st = createState(board.cap, board.bolts, hidden);
  return {
    c: spec.C, h: spec.H, s: spec.S,
    shape: spec.shape || 'balanced',
    m: spec.mystery || 0,
    b: encodeBoard(st),
    p: r.length,
    opt: r.optimal ? 1 : 0,
    sol: encodeMoves(r.moves),
    seed,
  };
}

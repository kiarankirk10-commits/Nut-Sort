// Ladder design: target par per level, shape per level, plus the plateau after level 30.
// The first 30 targets are read off the v2 PDF chart (p16, measured with group moves).
import { BANDS, MAX_LADDER_NUTS, mysteryModeFor } from '../app/js/config.js';
import { shapeAllowed, hashSeed } from './generator.js';
import { mulberry32 } from '../app/js/rng.js';

export const LADDER_TARGETS = {
  easy:   [17, 14, 17, 18, 19, 19, 18, 20, 19, 23, 21, 22, 24, 22, 25, 25, 25, 24, 27, 26, 28, 29, 30, 26, 28, 29, 29, 34, 31, 36],
  medium: [32, 30, 26, 34, 29, 34, 35, 37, 36, 36, 34, 28, 38, 31, 35, 35, 36, 37, 39, 40, 40, 40, 41, 42, 48, 46, 44, 48, 48, 49],
  hard:   [48, 53, 52, 56, 54, 58, 64, 61, 62, 61, 62, 69, 59, 59, 64, 64, 67, 67, 79, 66, 76, 71, 72, 69, 75, 73, 78, 76, 80, 86],
};

// Sustained plateau after the hand-tuned 30: top-of-difficulty par range, cycling shapes.
export const PLATEAU = {
  easy: [26, 36],
  medium: [38, 49],
  hard: [64, 84],
};

// Height classes per shape and difficulty.
export const SHAPE_HEIGHTS = {
  easy:   { packed: [3], balanced: [4], tall: [5] },
  medium: { packed: [3, 4], balanced: [5], tall: [6, 7] },
  hard:   { packed: [4, 5], balanced: [6, 7], tall: [8, 9] },
};
const SHAPE_CYCLE = ['packed', 'balanced', 'tall'];

// Fixed anchors from the PDFs.
const ANCHORS = {
  easy: { 13: { C: 10, H: 3, S: 2, shape: 'packed', target: 24 } },
  hard: { 11: { C: 8, H: 9, S: 2, shape: 'tall', target: 62 } },
};

export function rungFor(difficulty, level) {
  const band = BANDS[difficulty];
  const anchor = ANCHORS[difficulty]?.[level];
  let target, shape;
  if (level <= 30) {
    target = LADDER_TARGETS[difficulty][level - 1];
  } else {
    const r = mulberry32(hashSeed('plateau', difficulty, level));
    const [lo, hi] = PLATEAU[difficulty];
    target = Math.round(lo + r() * (hi - lo));
  }
  shape = anchor?.shape || SHAPE_CYCLE[(level - 1) % 3];
  if (difficulty === 'easy' && level <= 6) shape = 'packed'; // gentle start
  const mystery = mysteryModeFor(difficulty, level);
  const tol = level <= 30 ? Math.max(1, Math.round(target * 0.05)) : Math.max(2, Math.round(target * 0.08));
  // PDF anchors must match their published par exactly (Easy 13 = par 24, Hard 11 = par 62)
  const window = anchor ? [target, target] : [Math.max(band.par[0], target - tol), Math.min(band.par[1], target + tol)];
  return { level, target, shape, mystery, window, anchor };
}

/** Candidate shapes for a rung, ranked by closeness of calibrated mean par to the target. */
export function candidatesFor(difficulty, rung, calibration) {
  const band = BANDS[difficulty];
  if (rung.anchor) return [{ C: rung.anchor.C, H: rung.anchor.H, S: rung.anchor.S }];
  const heights = SHAPE_HEIGHTS[difficulty][rung.shape];
  const list = calibration.filter((r) =>
    heights.includes(r.H) &&
    r.C >= band.colors[0] && r.C <= band.colors[1] &&
    r.S >= band.spares[0] && r.S <= band.spares[1] &&
    r.C + r.S >= band.bolts[0] && r.C + r.S <= band.bolts[1] &&
    r.C * r.H <= MAX_LADDER_NUTS &&
    !(difficulty === 'hard' && rung.shape === 'tall' && r.C < 8) && // hard tall levels use 8+ stacks
    r.solvedRate >= 0.5 &&
    shapeAllowed(r) && r.mean &&
    r.max >= rung.window[0] - 3 && r.min <= rung.window[1] + 3);
  list.sort((a, b) => Math.abs(a.mean - rung.target) - Math.abs(b.mean - rung.target));
  return list.slice(0, 4).map(({ C, H, S }) => ({ C, H, S }));
}

/** Fallback: any allowed shape in the band (used if the shape class can't reach the target). */
export function anyCandidates(difficulty, rung, calibration) {
  const r2 = { ...rung, shape: null };
  const band = BANDS[difficulty];
  const list = calibration.filter((r) =>
    r.C >= band.colors[0] && r.C <= band.colors[1] && r.H >= band.height[0] && r.H <= band.height[1] &&
    r.S >= band.spares[0] && r.S <= band.spares[1] && r.C + r.S >= band.bolts[0] && r.C + r.S <= band.bolts[1] &&
    r.C * r.H <= MAX_LADDER_NUTS && r.mean && r.solvedRate >= 0.5);
  list.sort((a, b) => Math.abs(a.mean - r2.target) - Math.abs(b.mean - r2.target));
  return list.slice(0, 4).map(({ C, H, S }) => ({ C, H, S }));
}

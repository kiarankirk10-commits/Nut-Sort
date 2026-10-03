// Board layout: wrap bolts into rows so nuts are as big as possible (>= 31px when it fits).
// Pure function of (bolt count, capacity, area) so it's testable.
import { IMG_H, STEP } from './art.js';
import { MIN_NUT_PX, MAX_NUT_PX } from './config.js';

// Vertical metrics in units of nut width W
export const M = {
  slotW: 1.3,          // column width per bolt
  rodStub: 0.14,       // rod visible above a full stack
  liftGap: 0.12,       // gap between rod tip and a lifted nut
  baseBelow: 0.2,      // base disc below baseY
  rowGap: 0.22,
};

export function stackHeight(cap) { return IMG_H + (cap - 1) * STEP; }
/** Height of one row (base to rod tip), in W. */
export function rowHeight(cap) { return M.baseBelow + stackHeight(cap) + M.rodStub; }
/** Extra room above a row for a lifted single nut, in W. */
export function liftRoom() { return M.liftGap + IMG_H; }

/** Split n into r rows as evenly as possible (earlier rows get the extra). */
export function rowCounts(n, r) {
  const base = Math.floor(n / r), extra = n % r;
  return Array.from({ length: r }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * Compute the layout.
 * @returns {{ W:number, rows:number[][], slots:{x:number, baseY:number, row:number}[], width:number, height:number }}
 *   x = column centre, baseY = y of the bottom nut's lower front edge (sits on the base disc).
 */
export function computeLayout(n, cap, width, height, maxNut = MAX_NUT_PX) {
  let best = null;
  const maxRows = Math.min(n, 6);
  for (let r = 1; r <= maxRows; r++) {
    const counts = rowCounts(n, r);
    const perRow = counts[0];
    const wByWidth = width / (perRow * M.slotW);
    // rows share the lift room: each row needs its own height + gap, plus lift room on top
    const unitsH = r * rowHeight(cap) + (r - 1) * (M.rowGap + liftRoom() * 0.55) + liftRoom();
    const wByHeight = height / unitsH;
    const W = Math.min(wByWidth, wByHeight, maxNut);
    if (!best || W > best.W + 0.5) best = { W, r, counts, unitsH };
  }
  const { W, counts } = best;
  const rows = [];
  let k = 0;
  for (const c of counts) { rows.push(Array.from({ length: c }, () => k++)); }
  const rowH = rowHeight(cap) * W;
  const between = (M.rowGap + liftRoom() * 0.55) * W;
  const contentH = rows.length * rowH + (rows.length - 1) * between + liftRoom() * W;
  // centre vertically, slightly towards the top
  const top = Math.max(0, (height - contentH) * 0.42);
  const slots = [];
  rows.forEach((row, ri) => {
    const rowTop = top + liftRoom() * W + ri * (rowH + between);
    const baseY = rowTop + (stackHeight(cap) + M.rodStub) * W;
    const rowW = row.length * M.slotW * W;
    const left = (width - rowW) / 2;
    row.forEach((bi, ci) => { slots[bi] = { x: left + (ci + 0.5) * M.slotW * W, baseY, row: ri }; });
  });
  return { W, rows, slots, width, height, tooSmall: W < MIN_NUT_PX, contentH };
}

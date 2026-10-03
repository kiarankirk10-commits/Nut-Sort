// Nut Sort solver — pure JS, no DOM. Used by the Node level builder (par + solution path)
// and by the in-app hint Web Worker.
//
// Algorithm: anytime weighted A* over canonical states (bolt order ignored when hashing).
//   f = g + w*h, run with a decreasing sequence of weights; each pass is pruned by the best
//   solution found so far, so the result only ever gets shorter. A pass with w = 1 that
//   finishes without hitting its node cap proves the result optimal.
// Heuristic h (admissible under group moves):
//   every run above the bottom run of a bolt must move at least once            -> sum(runs - 1)
//   for each colour, all but one of the bottom runs of that colour must move   -> sum(max(0, k_c - 1))
//   A single move carries exactly one run (or part of one), so it can satisfy only one of these.
// The solver always sees full information (mystery nuts are treated as known): par assumes it.

const BASE = 97; // 'a'

function toStrings(bolts) {
  return bolts.map((b) => String.fromCharCode(...b.map((c) => BASE + c)));
}

function keyOf(st) {
  return st.slice().sort().join('.');
}

function runInfo(b) {
  // returns [runs, bottomColorChar or -1, topRunLen]
  const n = b.length;
  if (!n) return [0, -1, 0];
  let runs = 1;
  for (let i = 1; i < n; i++) if (b.charCodeAt(i) !== b.charCodeAt(i - 1)) runs++;
  let top = 1;
  const tc = b.charCodeAt(n - 1);
  while (top < n && b.charCodeAt(n - 1 - top) === tc) top++;
  return [runs, b.charCodeAt(0), top];
}

export function heuristic(st) {
  let h = 0;
  const bottoms = new Map();
  for (const b of st) {
    if (!b.length) continue;
    let runs = 1;
    for (let i = 1; i < b.length; i++) if (b.charCodeAt(i) !== b.charCodeAt(i - 1)) runs++;
    h += runs - 1;
    const c = b.charCodeAt(0);
    bottoms.set(c, (bottoms.get(c) || 0) + 1);
  }
  for (const k of bottoms.values()) h += k - 1;
  return h;
}

function isSolved(st, cap) {
  for (const b of st) {
    if (!b.length) continue;
    if (b.length !== cap) return false;
    const c = b.charCodeAt(0);
    for (let i = 1; i < b.length; i++) if (b.charCodeAt(i) !== c) return false;
  }
  return true;
}

/** Generate pruned successor moves: [from, to, count]. */
function successors(st, cap) {
  const out = [];
  const n = st.length;
  let firstEmpty = -1;
  for (let j = 0; j < n; j++) if (!st[j].length) { firstEmpty = j; break; }
  for (let i = 0; i < n; i++) {
    const s = st[i];
    const len = s.length;
    if (!len) continue;
    const [, , run] = runInfo(s);
    if (run === len && len === cap) continue; // finished bolt never moves
    const tc = s.charCodeAt(len - 1);
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const d = st[j];
      const dl = d.length;
      if (dl >= cap) continue;
      if (dl === 0) {
        if (j !== firstEmpty) continue; // all empty bolts are equivalent
        if (run === len) continue;      // moving a whole single-run bolt to an empty bolt is pointless
      } else if (d.charCodeAt(dl - 1) !== tc) continue;
      const cnt = Math.min(run, cap - dl);
      out.push([i, j, cnt]);
    }
  }
  return out;
}

function applyStr(st, i, j, cnt) {
  const nx = st.slice();
  const s = st[i];
  nx[i] = s.slice(0, s.length - cnt);
  nx[j] = st[j] + s.slice(s.length - cnt);
  return nx;
}

// Minimal binary heap keyed by (f, h).
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (less(a[i], a[p])) { [a[i], a[p]] = [a[p], a[i]]; i = p; } else break;
    }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && less(a[l], a[m])) m = l;
        if (r < a.length && less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; i = m;
      }
    }
    return top;
  }
}
function less(x, y) { return x.f < y.f || (x.f === y.f && x.h < y.h); }

/**
 * One weighted-A* pass. Returns { moves, complete } where complete=true means the search
 * exhausted (or proved) within the node cap.
 */
function astarPass(start, cap, w, opts, bound, deadline) {
  const maxNodes = opts.maxNodes || 400000;
  const open = new Heap();
  const best = new Map(); // key -> g
  const h0 = heuristic(start);
  const root = { st: start, g: 0, h: h0, f: w * h0, parent: null, mv: null };
  open.push(root);
  best.set(keyOf(start), 0);
  let expanded = 0;
  while (open.size) {
    const node = open.pop();
    if (node.g + node.h >= bound) continue; // can't beat incumbent
    if (isSolved(node.st, cap)) {
      const moves = [];
      for (let n = node; n.parent; n = n.parent) moves.push(n.mv);
      moves.reverse();
      return { moves, complete: w === 1, expanded };
    }
    if (++expanded > maxNodes || (expanded % 2048 === 0 && Date.now() > deadline)) {
      return { moves: null, complete: false, expanded };
    }
    const g = node.g + 1;
    for (const [i, j, cnt] of successors(node.st, cap)) {
      const nx = applyStr(node.st, i, j, cnt);
      const k = keyOf(nx);
      const prev = best.get(k);
      if (prev !== undefined && prev <= g) continue;
      best.set(k, g);
      const h = heuristic(nx);
      if (g + h >= bound) continue;
      open.push({ st: nx, g, h, f: g + w * h, parent: node, mv: [i, j] });
    }
  }
  // open list exhausted: no solution shorter than bound exists (exact only when w==1 and no pruning issues)
  return { moves: null, complete: true, expanded };
}

/**
 * Solve a board.
 * @param {{cap:number, bolts:number[][]}} board  full-information board (hidden flags ignored)
 * @param {object} opts { timeMs, maxNodes, weights:number[], firstOnly:boolean }
 * @returns {{ solved:boolean, moves:number[][]|null, length:number, optimal:boolean, ms:number }}
 */
export function solve(board, opts = {}) {
  const t0 = Date.now();
  const timeMs = opts.timeMs ?? 5000;
  const deadline = t0 + timeMs;
  const weights = opts.weights || [3, 2, 1.5, 1.25, 1];
  const start = toStrings(board.bolts);
  const cap = board.cap;
  if (isSolved(start, cap)) return { solved: true, moves: [], length: 0, optimal: true, ms: 0 };
  let bestMoves = null;
  let optimal = false;
  for (const w of weights) {
    if (Date.now() > deadline && bestMoves) break;
    const bound = bestMoves ? bestMoves.length : Infinity;
    // first pass gets the whole budget if needed; later passes are refinement
    const passDeadline = bestMoves ? deadline : t0 + (opts.firstPassMs ?? timeMs);
    const r = astarPass(start, cap, w, opts, bound, passDeadline);
    if (r.moves) {
      bestMoves = r.moves;
      if (r.complete) { optimal = true; break; }
    } else if (r.complete && w === 1 && bestMoves) {
      optimal = true; // exhausted search under the bound: incumbent is optimal
      break;
    }
    if (opts.firstOnly && bestMoves) break;
  }
  return {
    solved: !!bestMoves,
    moves: bestMoves,
    length: bestMoves ? bestMoves.length : -1,
    optimal,
    ms: Date.now() - t0,
  };
}

/** Quick "find any good next move" for hints. Returns [from,to] or null. */
export function bestFirstMove(board, opts = {}) {
  const r = solve(board, { timeMs: opts.timeMs ?? 2500, weights: opts.weights || [2.5, 1.6], maxNodes: opts.maxNodes || 250000 });
  return r.solved && r.moves.length ? { move: r.moves[0], length: r.length } : null;
}

/** Replay a move list on a plain board (no hidden); returns true if it ends solved. */
export function checkSolution(board, moves) {
  let st = toStrings(board.bolts);
  const cap = board.cap;
  for (const [i, j] of moves) {
    const s = st[i], d = st[j];
    if (!s || d === undefined || !s.length || d.length >= cap) return false;
    if (d.length && d.charCodeAt(d.length - 1) !== s.charCodeAt(s.length - 1)) return false;
    const run = runInfo(s)[2];
    st = applyStr(st, i, j, Math.min(run, cap - d.length));
  }
  return isSolved(st, cap);
}

export const _internal = { toStrings, keyOf, successors, isSolved };

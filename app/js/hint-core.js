// Hint logic (pure, no DOM / worker APIs) — used by hint-worker.js and unit tests.
// fullHint    : solve the board as given and return the first move.
// mysteryHint : bolts contain -1 for hidden nuts. The real colours are never available here.
//               Sample fillings consistent with what is visible ("determinizations"), solve
//               each quickly, and return the first move most samples agree on.
import { solve } from './solver.js';

export function fullHint(cap, bolts, timeMs = 3000) {
  const r = solve({ cap, bolts }, { timeMs, weights: [2.5, 1.6, 1.25], firstPassMs: timeMs });
  return r.solved && r.moves.length ? { move: r.moves[0], length: r.length } : { move: null };
}

export function mysteryHint(cap, bolts, timeMs = 3000, samples = 6, seed = 12345) {
  const seen = new Map();
  let unknown = 0;
  for (const b of bolts) for (const c of b) { if (c < 0) unknown++; else seen.set(c, (seen.get(c) || 0) + 1); }
  if (!unknown) return fullHint(cap, bolts, timeMs);
  const pool = [];
  for (const [c, n] of seen) for (let k = n; k < cap; k++) pool.push(c);
  let ghost = 1000; // colours not visible anywhere yet get placeholder ids
  while (pool.length < unknown) { for (let k = 0; k < cap && pool.length < unknown; k++) pool.push(ghost); ghost++; }
  const votes = new Map();
  const per = Math.max(250, Math.floor(timeMs / samples));
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  for (let k = 0; k < samples; k++) {
    const p = pool.slice();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    let q = 0;
    const filled = bolts.map((b) => b.map((c) => (c < 0 ? p[q++] : c)));
    const r = solve({ cap, bolts: filled }, { timeMs: per, weights: [2.5, 1.6], firstPassMs: per });
    if (!r.solved || !r.moves.length) continue;
    const key = r.moves[0].join(',');
    const v = votes.get(key) || { n: 0, len: 0, move: r.moves[0] };
    v.n++; v.len += r.length;
    votes.set(key, v);
  }
  let best = null;
  for (const v of votes.values()) if (!best || v.n > best.n || (v.n === best.n && v.len / v.n < best.len / best.n)) best = v;
  return best ? { move: best.move, agree: best.n, samples } : { move: null };
}

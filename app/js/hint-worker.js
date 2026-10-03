// Hint solver Web Worker (module). Runs the same solver as the level builder, off the main thread.
// mode 'full'    : solve the current board (non-mystery levels: everything is visible anyway)
// mode 'mystery' : the main thread sends hidden nuts as -1 (unknown) — this worker never sees
//                  their real colours. We sample several fillings consistent with what's visible
//                  ("determinizations"), solve each quickly and pick the first move most samples
//                  agree on: a safe, good move using visible information only.
import { solve } from './solver.js';

self.onmessage = (e) => {
  const { id, mode, cap, bolts, timeMs, samples } = e.data;
  try {
    const result = mode === 'mystery' ? mysteryHint(cap, bolts, timeMs, samples) : fullHint(cap, bolts, timeMs);
    self.postMessage({ id, ...result });
  } catch (err) {
    self.postMessage({ id, move: null, error: String(err) });
  }
};

function fullHint(cap, bolts, timeMs) {
  const r = solve({ cap, bolts }, { timeMs, weights: [2.5, 1.6, 1.25], firstPassMs: timeMs });
  return r.solved && r.moves.length ? { move: r.moves[0], length: r.length } : { move: null };
}

function mysteryHint(cap, bolts, timeMs, samples) {
  // colours we can see, and how many of each are still unaccounted for
  const seen = new Map();
  let unknown = 0, total = 0;
  for (const b of bolts) for (const c of b) { total++; if (c < 0) unknown++; else seen.set(c, (seen.get(c) || 0) + 1); }
  const colours = total / cap;
  const pool = [];
  for (const [c, n] of seen) for (let k = n; k < cap; k++) pool.push(c);
  let ghost = 1000; // colours not visible anywhere yet get placeholder ids
  while (pool.length < unknown) { for (let k = 0; k < cap && pool.length < unknown; k++) pool.push(ghost); ghost++; }
  const votes = new Map();
  const per = Math.max(250, Math.floor(timeMs / samples));
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  for (let s = 0; s < samples; s++) {
    const p = pool.slice();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    let k = 0;
    const filled = bolts.map((b) => b.map((c) => (c < 0 ? p[k++] : c)));
    const r = solve({ cap, bolts: filled }, { timeMs: per, weights: [2.5, 1.6], firstPassMs: per });
    if (!r.solved || !r.moves.length) continue;
    const key = r.moves[0].join(',');
    const v = votes.get(key) || { n: 0, len: 0, move: r.moves[0] };
    v.n++; v.len += r.length;
    votes.set(key, v);
  }
  let best = null;
  for (const v of votes.values()) if (!best || v.n > best.n || (v.n === best.n && v.len / v.n < best.len / best.n)) best = v;
  void colours;
  return best ? { move: best.move, agree: best.n, samples } : { move: null };
}

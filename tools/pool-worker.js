// Worker side of tools/pool.js. Add job types here.
import { parentPort } from 'node:worker_threads';
import { buildBoard, hashSeed } from './generator.js';
import { solve } from '../app/js/solver.js';
import { decodeBoard } from '../app/js/engine.js';
import { makeBoard } from './generator.js';

const handlers = {
  // Try candidate shapes x seeds (round-robin) until a board lands in the par window.
  // Everything is seeded from seedKey, so the same inputs give the same level.
  buildLevel({ cands, fallback, shape, mystery, window, seedKey, tries, solveMs }) {
    const binned = { boring: 0, unsolvable: 0, outOfBand: 0 };
    const lists = [cands, fallback || []];
    for (const list of lists) {
      if (!list.length) continue;
      for (let k = 0; k < tries; k++) {
        const c = list[k % list.length];
        const seed = hashSeed(seedKey, c.C, c.H, c.S, k);
        const r = buildBoard({ ...c, shape, mystery, solveMs }, seed);
        if (r.binned) { binned[r.binned]++; continue; }
        if (r.p < window[0] || r.p > window[1]) { binned.outOfBand++; continue; }
        return { level: r, binned };
      }
    }
    return { level: null, binned };
  },
  calibrate({ spec, seeds }) {
    const pars = []; let unsolved = 0;
    for (const seed of seeds) {
      const r = solve(makeBoard(spec, seed), { timeMs: 4000 });
      if (r.solved) pars.push(r.length); else unsolved++;
    }
    return { spec, pars, unsolved };
  },
  verify({ b, cap, par, solveMs }) {
    const st = decodeBoard(b, cap);
    const r = solve({ cap, bolts: st.bolts }, { timeMs: solveMs || 8000 });
    return { solved: r.solved, length: r.length, par };
  },
};

parentPort.on('message', ({ id, job }) => {
  try {
    parentPort.postMessage({ id, result: handlers[job.fn](job.args) });
  } catch (e) {
    parentPort.postMessage({ id, error: String(e && e.stack || e) });
  }
});

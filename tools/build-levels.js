// Build the Easy / Medium / Hard level sets.
//   node tools/build-levels.js --all                       (default counts from DEFAULT_COUNT)
//   node tools/build-levels.js --difficulty hard --count 500
// Writes app/data/levels-<difficulty>.json and docs/LEVEL_STATS.md.
// Pipeline (v2 p16): 1 seed -> 2 shuffle & solve -> 3 keep or bin. Same code -> same levels.
import fs from 'node:fs';
import { runPool } from './pool.js';
import { rungFor, candidatesFor, anyCandidates } from './ladders.js';
import { writeStats } from './stats.js';

export const DEFAULT_COUNT = 300;
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const diffs = args.includes('--all') || !arg('--difficulty') ? ['easy', 'medium', 'hard'] : [arg('--difficulty')];
const count = +arg('--count', DEFAULT_COUNT);
const calibration = JSON.parse(fs.readFileSync(new URL('./calibration.json', import.meta.url)));

for (const d of diffs) {
  const t0 = Date.now();
  const jobs = [];
  for (let level = 1; level <= count; level++) {
    const rung = rungFor(d, level);
    const cands = candidatesFor(d, rung, calibration);
    jobs.push({ fn: 'buildLevel', args: {
      cands, fallback: anyCandidates(d, rung, calibration), shape: rung.shape, mystery: rung.mystery,
      window: rung.window, seedKey: `${d}-${level}`, tries: rung.anchor ? 600 : 300, solveMs: 6000,
    } });
  }
  let last = 0;
  const res = await runPool(jobs, { onResult: (_, __, done, total) => {
    if (done - last >= 50 || done === total) { last = done; process.stdout.write(`\r${d}: ${done}/${total}`); }
  } });
  const levels = [];
  const binned = { boring: 0, unsolvable: 0, outOfBand: 0 };
  res.forEach((r, i) => {
    for (const k in binned) binned[k] += r.binned[k];
    if (!r.level) throw new Error(`${d} level ${i + 1}: no board found in window ${JSON.stringify(jobs[i].args.window)}`);
    levels.push(r.level);
  });
  const out = { version: 1, difficulty: d, count: levels.length, levels };
  fs.writeFileSync(new URL(`../app/data/levels-${d}.json`, import.meta.url), JSON.stringify(out));
  writeStats(d, levels, binned, Date.now() - t0);
  console.log(`\n${d}: ${levels.length} levels, binned ${JSON.stringify(binned)} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

// Build the daily-challenge pool: harder than Hard (par 75–108), five rotating shapes.
//   node tools/build-daily.js [--count 365]
// Writes app/data/daily.json and a section in docs/LEVEL_STATS.md.
import fs from 'node:fs';
import { runPool } from './pool.js';
import { writeStats } from './stats.js';
import { BANDS } from '../app/js/config.js';

export const DEFAULT_DAILY_COUNT = 365; // a full year; the PDF's 70 is the minimum
const args = process.argv.slice(2);
const i = args.indexOf('--count');
const count = i >= 0 ? +args[i + 1] : DEFAULT_DAILY_COUNT;

// Five shapes rotate day by day (v2 p5). Mystery shapes hide every bolt (Hard style).
export const DAILY_SHAPES = [
  { shape: 'packed',        mystery: 0, cands: [{ C: 16, H: 5, S: 2 }, { C: 15, H: 6, S: 2 }, { C: 17, H: 5, S: 2 }, { C: 18, H: 5, S: 2 }] },
  { shape: 'wide-and-tall', mystery: 0, cands: [{ C: 13, H: 7, S: 2 }, { C: 12, H: 8, S: 2 }, { C: 14, H: 7, S: 2 }, { C: 11, H: 9, S: 2 }] },
  { shape: 'mystery',       mystery: 2, cands: [{ C: 14, H: 6, S: 2 }, { C: 15, H: 6, S: 2 }, { C: 16, H: 6, S: 2 }, { C: 17, H: 5, S: 2 }] },
  { shape: 'giant-tall',    mystery: 0, cands: [{ C: 12, H: 9, S: 2 }] },             // the 12x9 board: 14 bolts, 108 nuts
  { shape: 'tall-mystery',  mystery: 2, cands: [{ C: 12, H: 8, S: 2 }, { C: 11, H: 9, S: 2 }, { C: 12, H: 9, S: 2 }] },
];

const jobs = [];
for (let n = 0; n < count; n++) {
  const sh = DAILY_SHAPES[n % DAILY_SHAPES.length];
  jobs.push({ fn: 'buildLevel', args: {
    cands: sh.cands, fallback: [], shape: sh.shape, mystery: sh.mystery,
    window: BANDS.daily.par, seedKey: `daily-${n}`, tries: 200, solveMs: 10000,
  } });
}
const t0 = Date.now();
let last = 0;
const res = await runPool(jobs, { onResult: (_, __, done, total) => {
  if (done - last >= 25 || done === total) { last = done; process.stdout.write(`\rdaily: ${done}/${total}`); }
} });
const binned = { boring: 0, unsolvable: 0, outOfBand: 0 };
const levels = res.map((r, n) => {
  for (const k in binned) binned[k] += r.binned[k];
  if (!r.level) throw new Error(`daily ${n}: no board found`);
  return r.level;
});
fs.writeFileSync(new URL('../app/data/daily.json', import.meta.url), JSON.stringify({ version: 1, difficulty: 'daily', count: levels.length, levels }));
writeStats('daily', levels, binned, Date.now() - t0);
console.log(`\ndaily: ${levels.length} boards, binned ${JSON.stringify(binned)} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

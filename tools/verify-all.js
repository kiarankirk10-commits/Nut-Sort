// Re-check every shipped board. Exit code 1 if anything is wrong.
//   node tools/verify-all.js [--quick]   (--quick skips the independent re-solve)
// Checks: board valid (each colour exactly H nuts), spares >= 2, bolts within the screen table,
// nut limits, par inside the difficulty band, stored solution replays to a win in exactly par
// moves, mystery cadence matches config, and (unless --quick) an independent re-solve succeeds.
import fs from 'node:fs';
import { decodeBoard, decodeMoves, validateBoard } from '../app/js/engine.js';
import { checkSolution } from '../app/js/solver.js';
import { BANDS, MAX_LADDER_NUTS, MAX_DAILY_NUTS, maxBoltsForHeight, mysteryModeFor, MIN_SPARES } from '../app/js/config.js';
import { runPool } from './pool.js';

const quick = process.argv.includes('--quick');
const sets = ['easy', 'medium', 'hard', 'daily'];
const errors = [];
const jobs = [];
const summary = [];

for (const d of sets) {
  const file = new URL(`../app/data/${d === 'daily' ? 'daily' : 'levels-' + d}.json`, import.meta.url);
  const data = JSON.parse(fs.readFileSync(file));
  const band = BANDS[d];
  data.levels.forEach((L, i) => {
    const tag = `${d} #${i + 1}`;
    const st = decodeBoard(L.b, L.h);
    const v = validateBoard(L.h, st.bolts);
    if (!v.ok) errors.push(`${tag}: ${v.why}`);
    const empties = st.bolts.filter((b) => !b.length).length;
    if (empties < MIN_SPARES) errors.push(`${tag}: only ${empties} spare bolts`);
    if (st.bolts.length > maxBoltsForHeight(L.h)) errors.push(`${tag}: ${st.bolts.length} bolts too many for height ${L.h}`);
    const nuts = L.c * L.h;
    if (nuts > (d === 'daily' ? MAX_DAILY_NUTS : MAX_LADDER_NUTS)) errors.push(`${tag}: ${nuts} nuts`);
    if (L.p < band.par[0] || L.p > band.par[1]) errors.push(`${tag}: par ${L.p} outside ${band.par}`);
    if (d !== 'daily' && (L.m || 0) !== mysteryModeFor(d, i + 1)) errors.push(`${tag}: mystery mode ${L.m} != cadence`);
    const sol = decodeMoves(L.sol);
    if (sol.length !== L.p) errors.push(`${tag}: solution length ${sol.length} != par ${L.p}`);
    if (!checkSolution({ cap: L.h, bolts: st.bolts }, sol)) errors.push(`${tag}: stored solution does not solve the board`);
    if (!quick) jobs.push({ fn: 'verify', args: { b: L.b, cap: L.h, par: L.p, solveMs: 15000 }, tag });
  });
  const pars = data.levels.map((l) => l.p);
  summary.push(`${d}: ${data.levels.length} boards, par ${Math.min(...pars)}–${Math.max(...pars)}`);
}

if (jobs.length) {
  const res = await runPool(jobs.map(({ fn, args }) => ({ fn, args })));
  res.forEach((r, k) => {
    if (!r.solved) errors.push(`${jobs[k].tag}: re-solve failed`);
    else if (r.length < r.par) errors.push(`${jobs[k].tag}: re-solve found ${r.length} < par ${r.par} (par not minimal)`);
  });
}

console.log(summary.join('\n'));
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.slice(0, 50).join('\n'));
  process.exit(1);
}
console.log(`\nAll boards verified${quick ? ' (quick)' : ' (re-solved independently)'}.`);

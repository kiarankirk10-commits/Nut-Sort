// Measure mean par for every allowed board shape (C colours x H high, S spares).
// Writes tools/calibration.json, used by build-levels.js to pick shapes for each rung.
// Usage: node tools/calibrate.js [seedsPerShape=6]
import fs from 'node:fs';
import { runPool } from './pool.js';
import { shapeAllowed, hashSeed } from './generator.js';

const N = +process.argv[2] || 6;
const jobs = [];
for (let H = 3; H <= 9; H++) for (let C = 4; C <= 18; C++) for (const S of [2, 3]) {
  const spec = { C, H, S };
  if (!shapeAllowed(spec) || C * H > 108) continue;
  jobs.push({ fn: 'calibrate', args: { spec, seeds: [...Array(N)].map((_, i) => hashSeed('cal', C, H, S, i)) } });
}
const t0 = Date.now();
const res = await runPool(jobs);
const table = res.map(({ spec, pars, unsolved }) => {
  pars.sort((a, b) => a - b);
  const mean = pars.length ? pars.reduce((a, b) => a + b, 0) / pars.length : null;
  return { ...spec, nuts: spec.C * spec.H, mean: mean && +mean.toFixed(1), min: pars[0] ?? null, max: pars[pars.length - 1] ?? null, solvedRate: +(pars.length / N).toFixed(2) };
});
fs.writeFileSync(new URL('./calibration.json', import.meta.url), JSON.stringify(table, null, 0).replace(/},{/g, '},\n{'));
console.log(`calibrated ${table.length} shapes in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

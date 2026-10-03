// Tiny worker_threads pool: run jobs in parallel across CPU cores.
// Each job is { fn: 'name', args } dispatched to tools/pool-worker.js.
import { Worker } from 'node:worker_threads';
import os from 'node:os';

export async function runPool(jobs, { threads = Math.max(1, os.cpus().length - 1), onResult } = {}) {
  const results = new Array(jobs.length);
  let next = 0, done = 0;
  const url = new URL('./pool-worker.js', import.meta.url);
  await new Promise((resolve, reject) => {
    if (!jobs.length) return resolve();
    const n = Math.min(threads, jobs.length);
    for (let t = 0; t < n; t++) {
      const w = new Worker(url);
      const feed = () => {
        if (next >= jobs.length) { w.terminate(); return; }
        const id = next++;
        w.postMessage({ id, job: jobs[id] });
      };
      w.on('message', ({ id, result, error }) => {
        if (error) { reject(new Error(error)); return; }
        results[id] = result;
        done++;
        if (onResult) onResult(result, id, done, jobs.length);
        if (done === jobs.length) resolve();
        feed();
      });
      w.on('error', reject);
      feed();
    }
  });
  return results;
}

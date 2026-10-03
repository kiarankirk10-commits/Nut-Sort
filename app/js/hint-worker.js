// Hint solver Web Worker (module): runs hint-core.js off the main thread.
// The main thread masks hidden nuts as -1, so mystery hints use visible information only.
import { fullHint, mysteryHint } from './hint-core.js';

self.onmessage = (e) => {
  const { id, mode, cap, bolts, timeMs, samples } = e.data;
  try {
    const result = mode === 'mystery' ? mysteryHint(cap, bolts, timeMs, samples) : fullHint(cap, bolts, timeMs);
    self.postMessage({ id, ...result });
  } catch (err) {
    self.postMessage({ id, move: null, error: String(err) });
  }
};

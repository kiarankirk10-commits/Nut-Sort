// Hint provider. Order of preference:
//  1. Non-mystery and still on the stored solution path -> next stored move (instant).
//  2. Otherwise re-solve in a background Web Worker (subtle spinner; cancelled if the player moves).
//  3. Mystery levels always go to the worker with hidden nuts masked (visible info only).
import { decodeMoves, cloneState, applyMove } from './engine.js';
import { HINT_SOLVER } from './config.js';

let worker = null;
let reqId = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./hint-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => { const p = pending.get(e.data.id); if (p) { pending.delete(e.data.id); p(e.data); } };
    worker.onerror = () => { for (const p of pending.values()) p({ move: null, error: 'worker' }); pending.clear(); worker = null; };
  }
  return worker;
}

const orderedKey = (bolts) => bolts.map((b) => b.join(',')).join('|');

/** Map of board (bolt order matters) -> next solution move, built once per level. */
export function solutionIndex(level) {
  if (level._solIndex) return level._solIndex;
  const map = new Map();
  const st = cloneState(level.state);
  const moves = level.solution || decodeMoves(level.raw.sol);
  for (const [f, t] of moves) {
    map.set(orderedKey(st.bolts), [f, t]);
    applyMove(st, f, t);
  }
  level._solIndex = map;
  return map;
}

/** Cancel any running background hint. */
export function cancelHints() {
  for (const p of pending.values()) p({ move: null, cancelled: true });
  pending.clear();
  if (worker) { worker.terminate(); worker = null; }
}

/**
 * Find a hint for the current game. Resolves { move:[from,to] } or { move:null }.
 * onBusy(true/false) toggles the spinner.
 */
export async function findHint(game, onBusy = () => {}) {
  const { level, state } = game;
  if (!level.mystery) {
    const m = solutionIndex(level).get(orderedKey(state.bolts));
    if (m) return { move: m, source: 'path' };
  }
  const id = ++reqId;
  const bolts = state.bolts.map((b, i) => b.map((c, k) => (state.hidden[i][k] ? -1 : c)));
  onBusy(true);
  try {
    const res = await new Promise((resolve) => {
      pending.set(id, resolve);
      getWorker().postMessage({
        id, mode: level.mystery ? 'mystery' : 'full', cap: state.cap, bolts,
        timeMs: level.mystery ? HINT_SOLVER.mysteryTimeMs : HINT_SOLVER.timeMs, samples: HINT_SOLVER.mysterySamples,
      });
    });
    return { ...res, source: 'solver' };
  } finally {
    onBusy(false);
  }
}

// Nut Sort rules engine — pure, deterministic, UI-free.
// Shared by the game (browser) and the Node tools (generator / solver / verify).
//
// Board model
//   cap      : bolt capacity (nuts high). Every colour has exactly `cap` nuts.
//   bolts    : array of arrays of colour indices, bottom -> top.
//   hidden   : array of arrays of booleans (same shape as bolts). true = mystery nut (grey "?").
//              The top nut of a bolt is never hidden. May be omitted (no mystery).
//
// Move semantics (v2 rules)
//   - The whole contiguous VISIBLE top run of one colour moves together, as many as fit
//     (min(run, free slots)). The player can't choose fewer.
//   - Legal destination: empty bolt, or top nut same colour, with room.
//   - When a hidden nut becomes the top of its bolt it is revealed. A nut revealed by a move
//     never joins that same move (it's revealed after the run has left).
//   - Undo restores revealed nuts to hidden (no peeking via move + undo).

/** Create a board state. Deep-copies inputs. */
export function createState(cap, bolts, hidden) {
  const b = bolts.map((x) => x.slice());
  const h = b.map((bolt, i) => bolt.map((_, j) => !!(hidden && hidden[i] && hidden[i][j])));
  // the top nut is always visible
  h.forEach((hb) => { if (hb.length) hb[hb.length - 1] = false; });
  return { cap, bolts: b, hidden: h };
}

export function cloneState(s) {
  return { cap: s.cap, bolts: s.bolts.map((x) => x.slice()), hidden: s.hidden.map((x) => x.slice()) };
}

export function topColor(s, i) {
  const b = s.bolts[i];
  return b.length ? b[b.length - 1] : -1;
}

/** Length of the visible same-colour run on top of bolt i (hidden nuts never join). */
export function topRun(s, i) {
  const b = s.bolts[i], h = s.hidden[i];
  const n = b.length;
  if (!n) return 0;
  const c = b[n - 1];
  let k = 1;
  while (k < n && b[n - 1 - k] === c && !h[n - 1 - k]) k++;
  return k;
}

export function freeSlots(s, i) {
  return s.cap - s.bolts[i].length;
}

/** Is moving from bolt `from` onto bolt `to` legal? */
export function canMove(s, from, to) {
  if (from === to) return false;
  const src = s.bolts[from], dst = s.bolts[to];
  if (!src || !dst || !src.length) return false;
  if (dst.length >= s.cap) return false;
  return dst.length === 0 || dst[dst.length - 1] === src[src.length - 1];
}

/** How many nuts a move would carry (0 if illegal). */
export function moveCount(s, from, to) {
  if (!canMove(s, from, to)) return 0;
  return Math.min(topRun(s, from), freeSlots(s, to));
}

/** All legal destinations for a source bolt. */
export function legalTargets(s, from) {
  const out = [];
  for (let j = 0; j < s.bolts.length; j++) if (canMove(s, from, j)) out.push(j);
  return out;
}

/** Every legal move [from, to]. */
export function legalMoves(s) {
  const out = [];
  for (let i = 0; i < s.bolts.length; i++) {
    if (!s.bolts[i].length) continue;
    for (let j = 0; j < s.bolts.length; j++) if (canMove(s, i, j)) out.push([i, j]);
  }
  return out;
}

export function hasLegalMove(s) {
  for (let i = 0; i < s.bolts.length; i++) {
    if (!s.bolts[i].length) continue;
    for (let j = 0; j < s.bolts.length; j++) if (canMove(s, i, j)) return true;
  }
  return false;
}

/**
 * Apply a move in place. Returns a move record usable by undoMove, or null if illegal.
 * record = { from, to, count, color, revealed: index-in-source-bolt or -1 }
 */
export function applyMove(s, from, to) {
  const count = moveCount(s, from, to);
  if (!count) return null;
  const src = s.bolts[from], dst = s.bolts[to];
  const sh = s.hidden[from], dh = s.hidden[to];
  const color = src[src.length - 1];
  for (let k = 0; k < count; k++) {
    dst.push(src.pop());
    sh.pop();
    dh.push(false);
  }
  let revealed = -1;
  if (src.length && sh[src.length - 1]) {
    sh[src.length - 1] = false;
    revealed = src.length - 1;
  }
  return { from, to, count, color, revealed };
}

/** Undo a move record (in place). Re-hides any nut the move revealed. */
export function undoMove(s, rec) {
  const src = s.bolts[rec.from], dst = s.bolts[rec.to];
  const sh = s.hidden[rec.from], dh = s.hidden[rec.to];
  if (rec.revealed >= 0) sh[rec.revealed] = true;
  for (let k = 0; k < rec.count; k++) {
    src.push(dst.pop());
    dh.pop();
    sh.push(false);
  }
}

/** A bolt is complete when full and single-coloured. */
export function isBoltComplete(s, i) {
  const b = s.bolts[i];
  if (b.length !== s.cap) return false;
  for (let k = 1; k < b.length; k++) if (b[k] !== b[0]) return false;
  return true;
}

/** Win: every non-empty bolt full and single-coloured. */
export function isWon(s) {
  for (let i = 0; i < s.bolts.length; i++) {
    if (s.bolts[i].length && !isBoltComplete(s, i)) return false;
  }
  return true;
}

/** Add an empty spare bolt (the "Extra bolt" control). Returns its index. */
export function addBolt(s) {
  s.bolts.push([]);
  s.hidden.push([]);
  return s.bolts.length - 1;
}

/** Remove a trailing empty bolt (used to undo an extra bolt if ever needed). */
export function removeEmptyBolt(s, i) {
  if (s.bolts[i] && !s.bolts[i].length) { s.bolts.splice(i, 1); s.hidden.splice(i, 1); return true; }
  return false;
}

/** Count of hidden nuts left. */
export function hiddenCount(s) {
  let n = 0;
  for (const h of s.hidden) for (const x of h) if (x) n++;
  return n;
}

/** Validate a board: every colour exactly cap nuts, no bolt over capacity. */
export function validateBoard(cap, bolts) {
  const counts = new Map();
  for (const b of bolts) {
    if (b.length > cap) return { ok: false, why: 'bolt over capacity' };
    for (const c of b) counts.set(c, (counts.get(c) || 0) + 1);
  }
  for (const [c, n] of counts) if (n !== cap) return { ok: false, why: `colour ${c} has ${n} nuts, need ${cap}` };
  return { ok: true, colors: counts.size };
}

// ---------- compact encodings (level data) ----------
// Bolt string: one char per nut, 'a'..'r' = colour 0..17, bottom -> top. Bolts joined by '.'.
// A capital letter marks a hidden (mystery) nut of that colour.
const A = 'a'.charCodeAt(0), Z = 'A'.charCodeAt(0);

export function encodeBoard(s) {
  return s.bolts.map((b, i) => b.map((c, j) => String.fromCharCode((s.hidden[i][j] ? Z : A) + c)).join('')).join('.');
}

export function decodeBoard(str, cap) {
  const bolts = [], hidden = [];
  for (const part of str.split('.')) {
    const b = [], h = [];
    for (const ch of part) {
      const code = ch.charCodeAt(0);
      if (code >= A) { b.push(code - A); h.push(false); } else { b.push(code - Z); h.push(true); }
    }
    bolts.push(b); hidden.push(h);
  }
  return createState(cap, bolts, hidden);
}

// Solution string: two base-36 chars per move (from, to).
export function encodeMoves(moves) {
  return moves.map(([f, t]) => f.toString(36) + t.toString(36)).join('');
}
export function decodeMoves(str) {
  const out = [];
  for (let i = 0; i + 1 < (str || '').length; i += 2) out.push([parseInt(str[i], 36), parseInt(str[i + 1], 36)]);
  return out;
}

/** Order-independent key of the full board (colours only). */
export function stateKey(s) {
  return s.bolts.map((b) => String.fromCharCode(...b.map((c) => A + c))).sort().join('.');
}

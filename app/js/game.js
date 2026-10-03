// Game session controller: owns the logical board for one attempt and drives the renderer.
// Logic updates instantly on every tap; visuals catch up (input is never blocked).
import * as E from './engine.js';
import { HINTS_PER_LEVEL, HINTS_PER_MYSTERY_LEVEL, EXTRA_BOLTS_PER_LEVEL } from './config.js';
import { sfx } from './audio.js';

export function slotFor(level) {
  return level.kind === 'level' ? level.difficulty : level.kind; // easy|medium|hard|daily|tutorial
}

export class Game {
  /**
   * @param {object} level   from levels.js
   * @param {BoardRenderer} renderer
   * @param {object} cb { onChange(game), onWin(game), onStuck(game), onMove(game), onSave(game) }
   * @param {object} [saved] serialised in-progress game to resume
   */
  constructor(level, renderer, cb, saved) {
    this.level = level;
    this.r = renderer;
    this.cb = cb;
    this.slot = slotFor(level);
    this.version = 0;       // bumps on every change; stale hint results are ignored
    this.selected = -1;
    this.hintMove = null;
    if (saved) this._restore(saved); else this._fresh();
    this.r.build(this.state);
  }

  _fresh() {
    this.state = E.cloneState(this.level.state);
    this.history = [];
    this.moves = 0;
    this.hintsLeft = this.level.mystery ? HINTS_PER_MYSTERY_LEVEL : HINTS_PER_LEVEL;
    this.extraLeft = EXTRA_BOLTS_PER_LEVEL;
    this.won = false;
  }

  _restore(s) {
    this.state = E.decodeBoard(s.board, this.level.cap);
    this.history = s.history.map(([from, to, count, color, revealed]) => ({ from, to, count, color, revealed }));
    this.moves = s.moves;
    this.hintsLeft = s.hintsLeft;
    this.extraLeft = s.extraLeft;
    this.won = E.isWon(this.state);
  }

  serialize() {
    const L = this.level;
    return {
      ref: { kind: L.kind, difficulty: L.difficulty, number: L.number, date: L.date || null },
      board: E.encodeBoard(this.state),
      history: this.history.map((r) => [r.from, r.to, r.count, r.color, r.revealed]),
      moves: this.moves,
      hintsLeft: this.hintsLeft,
      extraLeft: this.extraLeft,
      savedAt: Date.now(),
    };
  }

  // ---------- input ----------
  tap(i) {
    if (this.won) return;
    const s = this.state;
    if (this.selected < 0) {
      if (!s.bolts[i].length || E.isBoltComplete(s, i)) { sfx.nope(); return; }
      this._select(i);
      return;
    }
    if (i === this.selected) { this.cancel(); return; }
    if (E.canMove(s, this.selected, i)) { this.move(this.selected, i); return; }
    // not a legal target: switch selection to that bolt if it can be lifted
    if (s.bolts[i].length && !E.isBoltComplete(s, i)) { this.r.drop(); this._select(i); }
    else { sfx.nope(); this.cancel(); }
  }

  tapEmpty() { if (this.selected >= 0) this.cancel(); }

  _select(i, hintTo = -1) {
    this.selected = i;
    this.r.lift(i, E.topRun(this.state, i));
    this.r.setTargets(hintTo >= 0 ? [hintTo] : E.legalTargets(this.state, i), hintTo);
    sfx.lift();
  }

  cancel() {
    if (this.selected < 0) return;
    this.selected = -1;
    this.hintMove = null;
    this.r.drop();
    this.r.setTargets([]);
    this.cb.onChange(this);
  }

  move(from, to) {
    const s = this.state;
    const wasComplete = E.isBoltComplete(s, from);
    const rec = E.applyMove(s, from, to);
    if (!rec) return;
    this.version++;
    this.selected = -1;
    this.hintMove = null;
    this.history.push(rec);
    this.moves++;
    const completed = E.isBoltComplete(s, to);
    this.r.setTargets([]);
    const dur = this.r.move(from, to, rec.count, { revealed: rec.revealed, completed, uncompleted: wasComplete });
    const rm = this.r.rm;
    sfx.drop(rm ? 0 : Math.max(0, dur - 140) / 1000);
    if (rec.revealed >= 0) setTimeout(() => sfx.reveal(), rm ? 0 : 140);
    if (completed) sfx.chime(rm ? 0 : dur / 1000);
    this.won = E.isWon(s);
    this.cb.onMove(this, rec);
    this.cb.onChange(this);
    this.cb.onSave(this);
    if (this.won) {
      setTimeout(() => this.cb.onWin(this), rm ? 150 : dur + 120);
    } else if (!E.hasLegalMove(s)) {
      const v = this.version;
      setTimeout(() => { if (this.version === v) this.cb.onStuck(this); }, rm ? 150 : dur + 200);
    }
  }

  undo() {
    if (this.won || !this.history.length) { sfx.nope(); return false; }
    this.cancel();
    const rec = this.history.pop();
    const toWasComplete = E.isBoltComplete(this.state, rec.to);
    E.undoMove(this.state, rec);
    this.version++;
    this.moves = Math.max(0, this.moves - 1);
    this.r.undo(rec, { wasComplete: toWasComplete, fromComplete: E.isBoltComplete(this.state, rec.from) });
    sfx.lift();
    this.cb.onChange(this);
    this.cb.onSave(this);
    return true;
  }

  restart() {
    this.version++;
    this.selected = -1;
    this.hintMove = null;
    this._fresh();
    this.r.build(this.state);
    this.cb.onChange(this);
    this.cb.onSave(this);
  }

  addExtraBolt() {
    if (this.won || this.extraLeft <= 0) { sfx.nope(); return false; }
    this.cancel();
    this.extraLeft--;
    E.addBolt(this.state);
    this.version++;
    this.r.addBolt();
    sfx.tap();
    this.cb.onChange(this);
    this.cb.onSave(this);
    return true;
  }

  /** Show a hint move: lift the run and glow only its landing bolt. */
  showHint(from, to) {
    if (this.won || !E.canMove(this.state, from, to)) return false;
    if (this.selected >= 0) { this.r.drop(); this.r.setTargets([]); }
    this.hintMove = [from, to];
    this.hintsLeft--;
    this._select(from, to);
    this.cb.onChange(this);
    this.cb.onSave(this);
    return true;
  }

  get canUndo() { return !this.won && this.history.length > 0; }
}

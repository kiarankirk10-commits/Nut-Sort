// Helpers shared by screens.
import { ladderLevel, dailyLevel, tutorialLevel } from '../levels.js';
import { slotFor } from '../game.js';
import { icon } from '../icons.js';
import { chipLabel } from '../dates.js';
import { starBalance } from '../save.js';
import { overlay, wire } from '../ui.js';
import { daysToNextFreeze } from '../streak.js';

export const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard', daily: 'Daily', tutorial: 'Tutorial' };

export function levelFromRef(ref) {
  if (ref.kind === 'tutorial') return tutorialLevel();
  if (ref.kind === 'daily') return dailyLevel(ref.date);
  return ladderLevel(ref.difficulty, ref.number);
}

/** The saved unfinished game for a slot, if still valid. */
export function savedGame(app, slot) {
  const g = app.save.inProgress[slot];
  if (!g) return null;
  if (slot === 'daily' && g.ref.date !== app.today) return null; // yesterday's daily is gone
  return g;
}

/** "Medium · Level 14 · 9 moves in" for the CONTINUE button (or null). */
export function continueInfo(app) {
  const slot = app.save.lastSlot;
  const g = slot && savedGame(app, slot);
  if (!g) return null;
  const r = g.ref;
  const what = r.kind === 'level' ? `${DIFF_LABEL[r.difficulty]} · Level ${r.number}` : r.kind === 'daily' ? 'Daily challenge' : 'Tutorial';
  return { slot, ref: r, text: `${what} · ${g.moves} move${g.moves === 1 ? '' : 's'} in`, saved: g };
}

/**
 * Open a level: resumes the slot's saved game if it is this same level, otherwise starts fresh
 * (with the level intro unless intro:false).
 */
export function openLevel(app, level, { intro = true } = {}) {
  const slot = slotFor(level);
  const g = savedGame(app, slot);
  const same = g && g.ref.kind === level.kind && g.ref.difficulty === level.difficulty && g.ref.number === level.number && (level.kind !== 'daily' || g.ref.date === level.date);
  if (same) app.go('play', { level, saved: g, intro: false });
  else app.go('play', { level, saved: null, intro });
}

export function resumeSlot(app, slot) {
  const g = savedGame(app, slot);
  if (!g) return false;
  app.go('play', { level: levelFromRef(g.ref), saved: g, intro: false });
  return true;
}

/** Top row: date chip (+streak), star balance, gear. */
export function topbarHTML(app, { gear = true } = {}) {
  const s = app.save;
  const done = s.streak.lastWin === app.today;
  const streak = s.streak.current;
  return `<div class="topbar">
    <button class="chip" data-act="daily" aria-label="Daily challenge">
      ${done ? `<span class="tick">${icon('check')}</span>` : '<span class="dot"></span>'}
      <span>${chipLabel(app.today)}</span>
      ${streak > 0 ? `<span class="sep"></span><span class="gold" style="display:flex;align-items:center;gap:3px">${icon('flame')}${streak}</span>` : ''}
    </button>
    <button class="chip" data-act="stats" aria-label="Stars">${icon('star').replace('<svg', '<svg style="color:var(--accent)"')}<span>${starBalance(s)}</span></button>
    <span class="spacer"></span>
    ${gear ? `<button class="icon-btn" data-act="settings" aria-label="Settings">${icon('gear')}</button>` : ''}
  </div>`;
}

export function backHeader(title, sub, right = '') {
  return `<div class="topbar"><button class="icon-btn back-btn" data-act="back" aria-label="Back">${icon('back')}</button><span class="spacer"></span>${right}</div>
  <h1 class="h-title">${title}</h1>${sub ? `<p class="h-sub">${sub}</p>` : ''}`;
}

/** "Streak saved" overlay (freeze used). */
export function showStreakSaved(app, onDone) {
  const s = app.save.streak;
  const o = overlay(`<div class="card panel ice">
    <div class="snow-icon">${icon('snow')}</div>
    <h2>STREAK SAVED</h2>
    <p>You missed yesterday, so a streak freeze kept your streak alive.</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;font-size:17px;margin:-4px 0 10px"><span class="gold" style="width:20px">${icon('flame')}</span>${s.current} day${s.current === 1 ? '' : 's'}</div>
    <p style="margin:0 0 14px;font-size:11px">Freezes left: ${s.freezes} · next one in ${daysToNextFreeze(s)} day${daysToNextFreeze(s) === 1 ? '' : 's'}</p>
    <div class="btns"><button class="btn btn-gold" data-act="ok">Nice</button></div></div>`);
  app.save.seen.freezeShown = app.save.seen.freezeNotice;
  app.persist();
  wire(o.el, { ok: () => { o.close(); onDone && onDone(); } });
}

export function maybeStreakSaved(app, onDone) {
  const seen = app.save.seen;
  if (seen.freezeNotice && seen.freezeShown !== seen.freezeNotice) { showStreakSaved(app, onDone); return true; }
  return false;
}

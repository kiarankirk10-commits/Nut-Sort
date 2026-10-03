// STATS (v2 p14). Opens from the star total; Themes is one tap from here.
import { icon } from '../icons.js';
import { wire } from '../ui.js';
import { averageStars, starBalance } from '../save.js';
import { backHeader } from './common.js';

export default {
  render(app, el) {
    const s = app.save;
    const st = s.stats;
    const by = st.solvedBy;
    const max = Math.max(1, by.easy, by.medium, by.hard);
    const bar = (name, n, color) => `<div class="bar"><span>${name}</span><div class="track"><div class="fill" style="width:${(n / max) * 100}%;background:${color}"></div></div><span>${n}</span></div>`;
    el.innerHTML = `${backHeader('Your stats', '', `<button class="chip" data-act="themes">${icon('palette').replace('<svg', '<svg style="color:var(--accent)"')}Themes</button>`)}
      <div class="scroll">
      <div class="panel stats-hero">${icon('star')}<div><b>${s.stars.earned}</b><small>STARS COLLECTED</small></div>
        <div class="side"><b>${starBalance(s)}</b>to spend<br>${s.stars.spent} spent</div></div>
      <div class="stat-grid">
        <div class="panel stat"><b>${st.levelsSolved}</b><small>Levels solved</small></div>
        <div class="panel stat"><b>${st.perfect}</b><small>Perfect solves</small></div>
        <div class="panel stat"><b>${st.nutsSorted.toLocaleString('en-GB')}</b><small>Nuts sorted</small></div>
        <div class="panel stat">${icon('flame')}<b>${s.streak.best}</b><small>Best streak</small></div>
        <div class="panel stat">${icon('flame')}<b>${s.streak.current}</b><small>Current streak</small></div>
        <div class="panel stat"><b>${s.streak.beaten}</b><small>Dailies beaten</small></div>
        <div class="panel stat"><b>${averageStars(s).toFixed(1)}</b><small>Avg stars</small></div>
        <div class="panel stat">${icon('snow')}<b>${s.streak.freezes}</b><small>Streak freezes</small></div>
      </div>
      <div class="bars"><h3>SOLVED BY DIFFICULTY</h3>
        ${bar('Easy', by.easy, '#6FD99A')}${bar('Medium', by.medium, '#F5C84C')}${bar('Hard', by.hard, '#F06A8A')}</div>
      <p class="h-sub" style="margin-top:14px">Perfect solve = finished within the 3-star target.</p>
      <div style="margin-top:16px"><button class="btn btn-outline" data-act="themes">Themes — spend your stars</button></div>
      </div>`;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, { back: () => app.back(), themes: () => app.go('themes') });
    }
  },
};

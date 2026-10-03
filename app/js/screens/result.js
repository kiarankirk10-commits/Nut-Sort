// STARS / RESULT (v2 p12) and DAILY RESULT (v2 p5).
import { icon } from '../icons.js';
import { wire, esc } from '../ui.js';
import { thresholds } from '../stars.js';
import { chipLabel } from '../dates.js';
import { ladderLevel } from '../levels.js';
import { DIFF_LABEL, openLevel, maybeStreakSaved } from './common.js';

const TITLES = { 3: 'PERFECT!', 2: 'GREAT JOB!', 1: 'SOLVED!' };

function bigStars(n) {
  return [0, 1, 2].map((i) => icon('star', `${i < n ? 'on pop' : 'off'}`).replace('<svg', `<svg style="animation-delay:${120 + i * 140}ms"`)).join('');
}

export default {
  render(app, el, r) {
    const L = r.level;
    const t = thresholds(L.par, L.mystery);
    const caption = r.stars === 3
      ? `3 stars at ${t.three} moves or fewer.`
      : r.stars === 2 ? `3 stars need ${t.three} moves or fewer.` : `2 stars need ${t.two} moves or fewer.`;
    let body;
    if (L.kind === 'daily') {
      const d = r.daily;
      const rw = d.reward;
      const streak = app.save.streak.current;
      body = `
        <div class="head"><div class="lbl">DAILY CHALLENGE</div><span class="tag" style="margin-top:6px">${esc(chipLabel(L.date))}</span></div>
        <div class="big-stars">${bigStars(r.stars)}</div>
        <div class="result-title">${d.already ? 'SOLVED AGAIN!' : 'CHALLENGE BEATEN!'}</div>
        <div class="panel stat3"><div><small>Moves</small><b>${r.moves}</b></div><div><small>Par</small><b>${L.par}</b></div>
          <div><small>Stars</small><b class="gold">+${d.already ? 0 : rw.base * rw.mult}</b></div><div class="cap">${d.already ? 'Already beaten today — replays are just for fun.' : caption}</div></div>
        ${!d.already ? `<div class="panel streak-strip">${icon('flame')}<div><div class="t">${streak}-DAY STREAK</div><div class="s">Streak bonus +${rw.bonus} star${rw.bonus === 1 ? '' : 's'}${rw.mult > 1 ? ' · birthday ×2' : ''}${d.earnedFreeze ? ' · freeze earned!' : ''}</div></div><div class="v">+${rw.bonus * rw.mult}</div></div>` : ''}
        <div class="actions"><button class="btn btn-gold" data-act="home">Home</button>
          <button class="btn btn-outline" data-act="stats">View stats</button></div>
        <div class="total">Come back tomorrow for a new board</div>`;
    } else {
      const name = L.kind === 'tutorial' ? 'TUTORIAL' : DIFF_LABEL[L.difficulty].toUpperCase();
      body = `
        <div class="head"><div class="lbl">${L.kind === 'tutorial' ? 'LEVEL 1' : `LEVEL ${L.number}`}</div><span class="tag" style="margin-top:6px">${name}${L.mystery ? ' · MYSTERY' : ''}</span></div>
        <div class="big-stars">${bigStars(r.stars)}</div>
        <div class="result-title">${TITLES[r.stars]}</div>
        <div class="panel stat3"><div><small>Moves</small><b>${r.moves}</b></div><div><small>Par</small><b>${L.par}</b></div>
          <div><small>Stars</small><b class="gold">+${r.gained ?? r.stars}</b></div><div class="cap">${caption}${r.best > r.stars ? ` Best so far: ${r.best}★` : ''}</div></div>
        <div class="actions"><button class="btn btn-gold" data-act="next">Next level</button>
          <div class="btn-row"><button class="btn btn-outline" data-act="replay">Replay</button><button class="btn btn-outline" data-act="home">Home</button></div></div>
        <div class="total">${r.total} stars to spend · ${app.save.stars.earned} collected in total</div>`;
    }
    el.classList.add('result');
    el.innerHTML = `<div class="rays"></div>${body}`;
    el._r = r;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, {
        home: () => app.go('home'),
        stats: () => app.go('stats'),
        next: () => {
          const L2 = el._r.level;
          const next = L2.kind === 'tutorial' ? ladderLevel('easy', 1) : ladderLevel(L2.difficulty, L2.number + 1);
          openLevel(app, next);
        },
        replay: () => app.go('play', { level: el._r.level, saved: null, intro: true, forceNew: true }),
      });
    }
  },
  enter(app) { maybeStreakSaved(app); },
};

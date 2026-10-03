// CHOOSE DIFFICULTY (v2 p10): Easy / Medium / Hard cards + daily card.
import { icon } from '../icons.js';
import { wire, thumbSVG } from '../ui.js';
import { ladderLevel } from '../levels.js';
import { starsInDifficulty, doneInDifficulty } from '../save.js';
import { FEATURES } from '../config.js';
import { backHeader, savedGame, resumeSlot, openLevel } from './common.js';

const CARDS = [
  { d: 'easy', name: 'EASY', hex: 1, desc: 'Relaxed boards, roomy bolts.' },
  { d: 'medium', name: 'MEDIUM', hex: 2, desc: 'Taller stacks. Mystery bolts appear.' },
  { d: 'hard', name: 'HARD', hex: 3, desc: 'Packed, tall and mystery boards.' },
];

export default {
  render(app, el) {
    const s = app.save;
    el.innerHTML = `${backHeader('Choose difficulty', 'Each one keeps its own progress.')}
      <div class="scroll"><div class="diff-list">
      ${CARDS.map((c) => {
        const g = savedGame(app, c.d);
        const next = s.progress[c.d].next;
        const L = ladderLevel(c.d, g ? g.ref.number : next);
        return `<div class="panel diff-card ${g ? 'resume' : ''}" data-act="pick" data-arg="${c.d}" role="button">
          <div class="row"><div>
            <div class="name">${c.name}</div>
            <div class="hexes">${[1, 2, 3].map((i) => `<i class="${i <= c.hex ? '' : 'off'}"></i>`).join('')}</div>
            <div class="desc">${c.desc}</div></div>
            <div class="thumb">${thumbSVG(L.state.bolts, L.cap, L.state.hidden)}</div></div>
          <div class="foot"><span>${doneInDifficulty(s, c.d)} done</span><span class="star-inline">${icon('star')}${starsInDifficulty(s, c.d)}</span>
            <span class="grow"></span>
            ${FEATURES.levelSelect && doneInDifficulty(s, c.d) ? `<button class="levels-link" data-act="levels" data-arg="${c.d}">Levels</button>` : ''}
            ${g ? `<span class="pill-btn solid">RESUME · L${g.ref.number}</span>` : `<span class="pill-btn">PLAY${next > 1 ? ` · L${next}` : ''}</span>`}
          </div></div>`;
      }).join('')}
      ${FEATURES.daily ? `<button class="panel daily-card" data-act="daily"><div><div class="t">DAILY CHALLENGE</div><div class="s">Extra hard · worth 3× stars</div></div>
        <div class="streak">${s.streak.current > 0 ? `${icon('flame')}${s.streak.current}` : icon('back').replace('<svg', '<svg style="transform:rotate(180deg)"')}</div></button>` : ''}
      </div></div>`;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, {
        back: () => app.go('home'),
        pick: (d) => { if (!resumeSlot(app, d)) openLevel(app, ladderLevel(d, app.save.progress[d].next)); },
        levels: (d) => app.go('select', { difficulty: d }),
        daily: () => app.go('daily'),
      });
    }
  },
};

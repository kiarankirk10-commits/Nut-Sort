// Level list for replaying solved levels (chase 3 stars).
import { wire } from '../ui.js';
import { stars } from '../icons.js';
import { ladderLevel } from '../levels.js';
import { backHeader, openLevel, DIFF_LABEL } from './common.js';

export default {
  render(app, el, { difficulty }) {
    const p = app.save.progress[difficulty];
    const max = p.next;
    const cells = [];
    for (let n = 1; n <= max; n++) {
      const b = p.best[n] || 0;
      cells.push(`<button class="panel lvl ${n === max ? 'next' : ''}" data-act="open" data-arg="${n}">${n}<span class="st">${b ? stars(b) : ''}</span></button>`);
    }
    el.innerHTML = `${backHeader(`${DIFF_LABEL[difficulty]} levels`, 'Replay any level to chase 3 stars.')}
      <div class="scroll"><div class="level-grid">${cells.join('')}</div></div>`;
    el.dataset.diff = difficulty;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, {
        back: () => app.back(),
        open: (n) => openLevel(app, ladderLevel(el.dataset.diff, +n)),
      });
    }
    // scroll so the newest levels are visible
    requestAnimationFrame(() => { const sc = el.querySelector('.scroll'); sc.scrollTop = sc.scrollHeight; });
  },
};

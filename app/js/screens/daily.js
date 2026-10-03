// DAILY (v2 p5): today's board, 3x stars, streak + freeze + this week's dots.
import { icon } from '../icons.js';
import { wire, thumbSVG, esc } from '../ui.js';
import { dailyLevel } from '../levels.js';
import { chipLabel, addDays, weekdayMon0 } from '../dates.js';
import { birthdayOn } from '../birthday.js';
import { backHeader, savedGame, openLevel, maybeStreakSaved } from './common.js';

const SHAPE_LABEL = { packed: 'PACKED', 'wide-and-tall': 'WIDE + TALL', mystery: 'MYSTERY', 'giant-tall': 'GIANT TALL', 'tall-mystery': 'TALL + ?' };

export default {
  render(app, el) {
    const s = app.save;
    const L = dailyLevel(app.today);
    const done = s.streak.lastWin === app.today;
    const g = savedGame(app, 'daily');
    const st = s.streak;
    const bday = birthdayOn(app.today);
    // this week (Mon..Sun): won days get a tick, today a ring
    const mon = addDays(app.today, -weekdayMon0(app.today));
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
      const date = addDays(mon, i);
      const won = !!s.daily.results[date];
      const frozen = !won && st.freezeUsedOn && addDays(st.freezeUsedOn, -1) === date;
      const cls = won ? 'won' : frozen ? 'frozen' : date === app.today ? 'today' : '';
      return `<div class="d"><i class="${cls}">${won ? icon('check') : frozen ? icon('snow') : ''}</i>${d}</div>`;
    }).join('');
    const streakLine = done ? `Beaten today. Come back tomorrow for ${st.current + 1}.`
      : st.current > 0 ? `Beat today to make it ${st.current + 1}` : 'Beat today to start a streak';
    el.innerHTML = `${backHeader('Daily challenge', 'One extra-hard board a day.')}
      <div class="scroll">
      <div class="panel daily-board">
        <div class="row"><b style="letter-spacing:.1em">${esc(chipLabel(app.today))}</b><span class="tag">EXTRA HARD</span></div>
        <div class="thumb">${thumbSVG(L.state.bolts, L.cap, L.state.hidden)}</div>
        <div class="facts"><div><b>${L.colors}</b><small>colours</small></div><div><b>${L.bolts}</b><small>bolts</small></div><div><b style="font-size:13px;line-height:27px">${SHAPE_LABEL[L.shape] || 'TALL'}</b><small>type</small></div></div>
      </div>
      <div class="panel info-row"><span class="st">${icon('star')}${icon('star')}${icon('star')}</span><div><b>3× stars${bday ? ' · 2× birthday bonus' : ''}</b><span>Up to 9, plus a streak bonus${bday ? `, all doubled for ${esc(bday.name)}'s birthday` : ''}</span></div></div>
      <div class="panel week">
        <div class="head">${icon('flame', 'flame')}<div><b>${st.current} DAY STREAK</b><span>${streakLine}</span></div>
          <div class="freeze">${icon('snow')}×${st.freezes}</div></div>
        <div class="days">${days}</div>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-gold" data-act="play">${g ? "Continue today's challenge" : done ? 'Play again (no stars)' : "Play today's challenge"}</button>
      </div>
      <p class="h-sub center" style="margin-top:12px">Best streak ${st.best} · dailies beaten ${st.beaten}</p>
      </div>`;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, {
        back: () => app.back(),
        play: () => openLevel(app, dailyLevel(app.today)),
      });
    }
  },
  enter(app) { maybeStreakSaved(app); },
};

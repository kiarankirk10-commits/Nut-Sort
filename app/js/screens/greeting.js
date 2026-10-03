// BIRTHDAY GREETING (v2 p4): shown once on the first open of the day (or from Settings preview).
import { wire, esc } from '../ui.js';
import { icon } from '../icons.js';
import { cakeSVG } from '../birthday-fx.js';
import { confetti } from '../confetti.js';
import { sfx, audioReady } from '../audio.js';
import { longDay } from '../dates.js';

export default {
  render(app, el, { person, real }) {
    el.classList.add('bday-screen');
    el.innerHTML = `<div style="margin:auto 0;width:100%">
      ${cakeSVG()}
      <div class="bday-title"><div class="hb">HAPPY BIRTHDAY</div><div class="nm">${esc(person.name.toUpperCase())}!</div></div>
      <p class="h-sub center" style="margin:8px 0 18px">${longDay(person.month, person.day)}. Today the game is yours twice over.</p>
      <div class="panel bday-card" style="margin:0 auto 18px;max-width:300px">${icon('star')}<div><b>Daily challenge pays 2× stars</b><span>${real ? 'Only on your birthday' : 'Preview — the bonus is real on the day'}</span></div></div>
      <button class="btn btn-gold" data-act="go" style="max-width:300px;margin:0 auto">Let's play</button>
      <p class="h-sub center" style="margin-top:14px;font-size:11px">${real ? `Shown once on ${longDay(person.month, person.day)}` : 'Birthday preview'}</p>
      </div>`;
    if (real) { app.save.seen.birthdayGreeting = app.today; app.persist(); }
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, { go: () => app.go('home') });
      // tap anywhere also unlocks audio; play the jingle on first touch if it couldn't autoplay
      el.addEventListener('pointerdown', () => { if (!el._played) { el._played = true; setTimeout(() => sfx.jingle(), 50); } }, { once: false });
    }
    el._played = false;
  },
  enter(app) {
    if (!app.reducedMotion()) setTimeout(() => confetti({ count: 180 }), 250);
    const el = document.getElementById('s-greeting');
    if (audioReady()) { sfx.jingle(); if (el) el._played = true; }
  },
};

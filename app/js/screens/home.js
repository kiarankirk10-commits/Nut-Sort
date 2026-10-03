// HOME (v2 p3): date chip + streak, star total, settings; stage; CONTINUE/PLAY; NEW GAME; credit.
import { icon } from '../icons.js';
import { wire } from '../ui.js';
import { nutImage, baseImage, checkBadge, partyHat } from '../art.js';
import { APP_VERSION, CREATOR } from '../config.js';
import { topbarHTML, continueInfo, resumeSlot, maybeStreakSaved } from './common.js';
import { tutorialLevel } from '../levels.js';

// stage: 3 bolts like the PDF — mixed stack, finished red stack (gold check), yellow + lifted blue
function heroHTML(app) {
  const W = 23; // nut width as % of hero width
  const nut = (c, x, k, extra = '', cls = '') => `<img class="${cls}" src="${nutImage(c, app.save.settings.symbols)}" style="left:${x - W / 2}%;width:${W}%;top:${62 - k * 15.6}%;${extra}">`;
  const base = (x) => `<img src="${baseImage()}" style="left:${x - 14.5}%;width:29%;top:84%">`;
  const hat = app.birthday() ? `<div style="position:absolute;left:${78 - 4.5}%;width:9%;top:7%;height:15%">${partyHat()}</div>` : '';
  return `<div class="hero" aria-hidden="true">
    ${base(22)}${base(50)}${base(78)}
    ${nut(7, 22, 0)}${nut(4, 22, 1)}${nut(10, 22, 2)}
    ${nut(0, 50, 0)}${nut(0, 50, 1)}${nut(0, 50, 2)}
    <div class="hero-check" style="left:${50 + 7}%;top:${62 - 2 * 15.6 - 2}%">${checkBadge()}</div>
    ${nut(8, 78, 0)}
    <div class="bob" style="position:absolute;inset:0">${nut(3, 78, 2.6)}${hat}</div>
  </div>`;
}

export default {
  render(app, el) {
    const cont = continueInfo(app);
    const b = app.birthday();
    const firstLaunch = !app.save.tutorialDone && !cont;
    el.innerHTML = `
      ${topbarHTML(app)}
      <div class="home-stage">${heroHTML(app)}</div>
      ${b ? `<div class="bday-title"><div class="hb">HAPPY BIRTHDAY</div><div class="nm">${b.person.name.toUpperCase()}!</div><div class="ed">NUT SORT · BIRTHDAY EDITION</div></div>`
          : `<div class="title-block"><div class="logo"><span class="a">NUT </span><span class="b">SORT</span></div>
             <div class="ornament"><i></i><b></b><i></i></div><div class="tagline">Sort · Stack · Satisfy</div></div>`}
      <div class="home-actions">
        ${cont
          ? `<button class="btn btn-gold btn-big" data-act="continue"><span class="play-circle">${icon('play')}</span><span class="stack">Continue<span class="sub">${cont.text}</span></span></button>`
          : `<button class="btn btn-gold btn-big" data-act="play"><span class="stack">Play<span class="sub">${firstLaunch ? 'Start with a quick tutorial' : 'Pick a difficulty'}</span></span></button>`}
        <button class="btn btn-outline" data-act="new">New game</button>
        ${b ? `<div class="panel bday-card">${icon('star')}<div><b>Birthday bonus</b><span>${b.real ? "Today's daily challenge pays double stars" : 'Preview — the real thing pays double daily stars'}</span></div></div>` : ''}
      </div>
      <div class="home-foot">
        <div class="rule"></div>
        <div class="by">CREATED BY</div>
        <div class="name">${CREATOR.toUpperCase()}</div>
        <div class="ver">v${APP_VERSION} · plays fully offline</div>
      </div>`;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, {
        daily: () => app.go('daily'),
        stats: () => app.go('stats'),
        settings: () => app.go('settings'),
        continue: () => { const c = continueInfo(app); if (!c || !resumeSlot(app, c.slot)) app.go('home', {}, { replace: true }); },
        play: () => {
          if (!app.save.tutorialDone) app.go('play', { level: tutorialLevel(), saved: null, intro: false });
          else app.go('difficulty');
        },
        new: () => app.go('difficulty'),
      });
    }
  },
  enter(app) {
    maybeStreakSaved(app);
  },
};

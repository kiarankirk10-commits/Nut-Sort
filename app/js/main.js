// Boot + router + shared app state. Screens live in js/screens/*.js and get this `app` object.
import { loadSave, persist, persistSoon, getSave } from './storage.js';
import { refreshStreak } from './save.js';
import { localDateStr } from './dates.js';
import { activeBirthday } from './birthday.js';
import { loadSet } from './levels.js';
import { applyTheme } from './theme-apply.js';
import { setBusyCheck } from './fx.js';
import { setBirthdayDecor } from './birthday-fx.js';
import { unlockAudio, setAudioSettings } from './audio.js';
import { FEATURES } from './config.js';

import home from './screens/home.js';
import difficulty from './screens/difficulty.js';
import select from './screens/select.js';
import play from './screens/play.js';
import result from './screens/result.js';
import daily from './screens/daily.js';
import stats from './screens/stats.js';
import themes from './screens/themes.js';
import settings from './screens/settings.js';
import greeting from './screens/greeting.js';

const SCREENS = { home, difficulty, select, play, result, daily, stats, themes, settings, greeting };

const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };

export const app = {
  save: null,
  today: localDateStr(),
  current: null,
  params: null,
  history: [],
  ready: null,

  /** Navigate to a screen. */
  go(id, params = {}, { replace = false } = {}) {
    const next = SCREENS[id];
    if (!next) throw new Error(`no screen ${id}`);
    const prev = this.current;
    if (prev && SCREENS[prev].leave) SCREENS[prev].leave(this);
    if (!replace && prev && prev !== id) this.history.push({ id: prev, params: this.params });
    if (id === 'home') this.history = [];
    this.current = id;
    this.params = params;
    const el = screenEl(id);
    next.render(this, el, params);
    for (const s of document.querySelectorAll('.screen.active')) if (s !== el) s.classList.remove('active');
    el.classList.add('active');
    if (next.enter) next.enter(this, el, params);
  },
  back() {
    const h = this.history.pop();
    if (h) this.go(h.id, h.params, { replace: true }); else this.go('home');
  },

  persist() { persist(); },
  persistSoon() { persistSoon(); },

  reducedMotion() { return !!(this.save?.settings.reduceMotion || mq.matches); },
  /** Active birthday treatment: real birthday today or Settings preview. */
  birthday() { return FEATURES.birthday ? activeBirthday(this.today, this.save.settings.birthdayPreview) : null; },

  applySettings({ themeAnimate = false } = {}) {
    const s = this.save.settings;
    document.documentElement.classList.toggle('reduce-motion', this.reducedMotion());
    setAudioSettings({ sound: s.sound, music: s.music });
    applyTheme(this.save.themes.equipped, { animate: themeAnimate, reducedMotion: this.reducedMotion() });
    setBirthdayDecor(!!this.birthday());
  },

  /** Re-check the date (midnight rollover, app resumed after days). */
  refreshDate() {
    const t = localDateStr();
    const changed = t !== this.today;
    this.today = t;
    const r = refreshStreak(this.save, t);
    if (changed || r.freezeUsed || r.reset) {
      persist();
      setBirthdayDecor(!!this.birthday());
      if (this.current === 'home' || this.current === 'daily' || this.current === 'difficulty') this.go(this.current, this.params, { replace: true });
    }
    return changed;
  },
};

function screenEl(id) {
  let el = document.getElementById(`s-${id}`);
  if (!el) {
    el = document.createElement('section');
    el.className = `screen screen-${id}`;
    el.id = `s-${id}`;
    document.getElementById('app').appendChild(el);
  }
  return el;
}

async function boot() {
  app.save = loadSave();
  refreshStreak(app.save, app.today);
  persist();
  app.applySettings();
  setBusyCheck(() => play.isAnimating && play.isAnimating());
  mq.addEventListener && mq.addEventListener('change', () => app.applySettings());

  // levels: small JSON files, cached by the service worker
  app.ready = Promise.all(['easy', 'medium', 'hard', 'daily'].map(loadSet));
  try { await app.ready; } catch (e) { console.error(e); }

  // resume straight into a game? No — Home first, CONTINUE is one tap (PDF nav map).
  const b = app.birthday();
  if (b && b.real && app.save.seen.birthdayGreeting !== app.today) {
    app.go('greeting', { person: b.person, real: true });
  } else {
    app.go('home');
  }

  // iOS: audio needs a gesture; also block pinch-zoom gestures
  const unlock = () => { unlockAudio(); window.removeEventListener('pointerdown', unlock, true); };
  window.addEventListener('pointerdown', unlock, true);
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // midnight / resume checks
  setInterval(() => app.refreshDate(), 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) app.refreshDate(); else persist(); });
  window.addEventListener('pagehide', () => persist());

  registerSW();
}

function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  // New versions install in the background and take over on the next launch (never mid-game).
  navigator.serviceWorker.register('service-worker.js').catch((e) => console.warn('SW', e));
}

window.__app = app; // handy for debugging + the smoke test
window.__getSave = getSave;
boot();

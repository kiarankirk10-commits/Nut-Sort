// SETTINGS (v2 p13): sound, music, symbols, reduce motion, birthday preview, backup/restore,
// reset (in-app confirm), credits at the bottom.
import { icon } from '../icons.js';
import { wire, h, toast, confirmModal, overlay } from '../ui.js';
import { APP_NAME, APP_VERSION, CREATOR, FUNDED_BY, BIRTHDAYS, FEATURES } from '../config.js';
import { exportBackup, readBackupFile, replaceSave, resetSave } from '../storage.js';
import { nutImage } from '../art.js';
import { confetti } from '../confetti.js';
import { sfx } from '../audio.js';
import { backHeader } from './common.js';

const row = (key, ic, title, sub, on) => `<button class="set-row" data-act="toggle" data-arg="${key}">${icon(ic)}<div class="txt"><b>${title}</b><span>${sub}</span></div><span class="toggle ${on ? 'on' : ''}"></span></button>`;

export default {
  render(app, el) {
    const s = app.save.settings;
    const prev = s.birthdayPreview;
    el.innerHTML = `${backHeader('Settings', '')}
      <div class="scroll">
      <div class="panel set-list">
        ${row('sound', 'sound', 'Sound effects', 'Clicks, chimes and win jingle', s.sound)}
        ${FEATURES.music ? row('music', 'music', 'Music', 'Soft background loop', s.music) : ''}
        ${row('symbols', 'heart', 'Show symbols on nuts', 'Helps tell similar colours apart', s.symbols)}
        ${row('reduceMotion', 'motion', 'Reduce motion', 'Shorter, calmer animations (quick fades)', s.reduceMotion)}
        ${FEATURES.birthday ? row('birthday', 'cake', 'Preview birthday theme', 'See the birthday look today', !!prev) : ''}
        ${prev ? `<div class="seg">${BIRTHDAYS.map((b) => `<button class="${prev === b.name ? 'on' : ''}" data-act="bday" data-arg="${b.name}">${b.name}</button>`).join('')}</div>` : ''}
        ${FEATURES.themes ? '' : '<!--'}<button class="set-row" data-act="themes">${icon('palette')}<div class="txt"><b>Themes</b><span>Spend stars on new looks</span></div>${icon('back').replace('<svg', '<svg style="transform:rotate(180deg);width:16px;color:var(--muted)"')}</button>${FEATURES.themes ? '' : '-->'}
      </div>
      <div class="panel set-list set-block">
        <div class="set-row">${icon('download')}<div class="txt"><b>Back up my progress</b><span>Export or import a save file</span></div>
          <button class="pill-btn" data-act="export">EXPORT</button></div>
        <div class="set-row">${icon('upload')}<div class="txt"><b>Restore a backup</b><span>Replaces progress on this phone</span></div>
          <button class="pill-btn" data-act="import">IMPORT</button></div>
      </div>
      <div class="panel set-list set-block danger">
        <div class="set-row">${icon('trash')}<div class="txt"><b>Reset all progress</b><span>Erases levels, stars, themes and streak</span></div>
          <button class="pill-btn btn-danger" style="border-color:var(--danger);color:var(--danger)" data-act="reset">RESET</button></div>
      </div>
      <button class="panel credits" data-act="credits">
        <h3>CREDITS</h3>
        <div class="l1">CREATED BY</div><div class="nm">${CREATOR.toUpperCase()}</div>
        <div class="l2">Funded by ${FUNDED_BY}</div>
        <div class="ver">${APP_NAME} · Version ${APP_VERSION}</div>
      </button>
      <input type="file" accept="application/json,.json" id="restore-file" hidden>
      </div>`;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      const rerender = () => this.render(app, el);
      wire(el, {
        back: () => app.back(),
        toggle: (key) => {
          const st = app.save.settings;
          if (key === 'birthday') {
            st.birthdayPreview = st.birthdayPreview ? null : BIRTHDAYS[0].name;
            if (st.birthdayPreview) showGreetingPreview(app, st.birthdayPreview);
          } else st[key] = !st[key];
          app.persist();
          app.applySettings();
          sfx.tap();
          rerender();
        },
        bday: (name) => { app.save.settings.birthdayPreview = name; app.persist(); app.applySettings(); showGreetingPreview(app, name); rerender(); },
        themes: () => app.go('themes'),
        export: () => { exportBackup(); toast('Backup saved — keep the file somewhere safe'); },
        import: () => el.querySelector('#restore-file').click(),
        reset: async () => {
          const ok = await confirmModal({ title: 'RESET PROGRESS?', text: 'This erases all levels, stars, themes and your streak on this phone. Make a backup first if you might want it back.', ok: 'Erase everything', cancel: 'Keep my progress', danger: true });
          if (!ok) return;
          app.save = resetSave();
          app.applySettings({ themeAnimate: true });
          toast('Progress reset');
          app.go('home');
        },
        credits: () => openCredits(),
      });
      el.addEventListener('change', async (e) => {
        if (e.target.id !== 'restore-file' || !e.target.files[0]) return;
        try {
          const s = await readBackupFile(e.target.files[0]);
          const ok = await confirmModal({ title: 'RESTORE BACKUP?', text: `This replaces the progress on this phone with the backup (${s.stars.earned} stars collected).`, ok: 'Restore', cancel: 'Cancel' });
          if (ok) { app.save = replaceSave(s); app.applySettings({ themeAnimate: true }); toast('Backup restored'); app.go('home'); }
        } catch (err) {
          toast(err.message || 'Could not read that file');
        }
        e.target.value = '';
      });
    }
  },
};

function showGreetingPreview(app, name) {
  const person = BIRTHDAYS.find((b) => b.name === name);
  if (person) app.go('greeting', { person, real: false });
}

function openCredits() {
  const nuts = [0, 8, 3, 9].map((c) => `<img src="${nutImage(c)}">`).join('');
  const o = overlay(`<div class="card panel credits-sheet"><div class="nuts">${nuts}</div><h2>CREDITS</h2>
    <p style="margin:10px 0 2px;letter-spacing:.3em;font-size:10px">CREATED BY</p><div style="font-size:24px;font-weight:700;letter-spacing:.26em;color:var(--accent)">${CREATOR.toUpperCase()}</div>
    <p style="margin:12px 0 4px;color:var(--text)">Funded by ${FUNDED_BY}</p><p style="margin:0 0 16px">${APP_NAME} · Version ${APP_VERSION}<br>No ads. No tracking. Fully offline.</p>
    <div class="btns"><button class="btn btn-gold" data-act="ok">Lovely</button></div></div>`, { onBackdrop: () => o.close() });
  wire(o.el, { ok: () => o.close() });
  confetti({ count: 70 });
  void h;
}

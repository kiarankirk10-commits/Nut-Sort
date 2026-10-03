// Persistence: localStorage (versioned schema, see save.js) + backup/restore JSON files.
import { STORAGE_KEY, APP_NAME, APP_VERSION } from './config.js';
import { migrate, defaultSave } from './save.js';

let writeTimer = null;
let current = null;

function safeGet() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
function safeSet(v) {
  try { localStorage.setItem(STORAGE_KEY, v); return true; } catch { return false; }
}

/** Load (and migrate) the save. Never throws: a broken save starts fresh but is kept aside. */
export function loadSave() {
  const raw = safeGet();
  if (!raw) { current = defaultSave(); return current; }
  try {
    current = migrate(JSON.parse(raw));
  } catch (e) {
    try { localStorage.setItem(STORAGE_KEY + '.broken.' + Date.now(), raw); } catch { /* full */ }
    current = defaultSave();
  }
  return current;
}

export function getSave() { return current; }

/** Persist now (used after every move — cheap: a single JSON string). */
export function persist() {
  clearTimeout(writeTimer);
  writeTimer = null;
  if (current) safeSet(JSON.stringify(current));
}
/** Persist soon (coalesces bursts). */
export function persistSoon() {
  if (writeTimer) return;
  writeTimer = setTimeout(persist, 150);
}

export function replaceSave(s) {
  current = migrate(s);
  persist();
  return current;
}

export function resetSave() {
  const keepSettings = current ? current.settings : undefined;
  current = defaultSave();
  if (keepSettings) current.settings = { ...keepSettings, birthdayPreview: null };
  persist();
  return current;
}

/** Download a backup file (iOS shows the share/save sheet). */
export function exportBackup() {
  persist();
  const data = { app: APP_NAME, version: APP_VERSION, exportedAt: new Date().toISOString(), save: current };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  a.href = url;
  a.download = `nut-sort-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

/** Read a backup file chosen by the user. Resolves to a migrated save object (not yet applied). */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const s = data && data.save ? data.save : data;
        if (!s || typeof s !== 'object' || !s.progress) throw new Error('This file is not a Nut Sort backup.');
        resolve(migrate(s));
      } catch (e) { reject(e); }
    };
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

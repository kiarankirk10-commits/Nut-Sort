// Sounds are synthesised with the Web Audio API — no audio files, so the app stays tiny/offline.
// iOS needs the AudioContext resumed inside a touch handler: call unlockAudio() on first touch.

let ctx = null;
let master = null;
let enabled = { sound: true, music: false };
let musicNodes = null;
let unlocked = false;

/** True once a touch has unlocked audio (iOS). */
export function audioReady() { return unlocked; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const c = ac();
  if (!c) return;
  unlocked = true;
  if (c.state === 'suspended') c.resume();
  // play one silent sample (old iOS needs it)
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b; s.connect(master); s.start(0);
  if (enabled.music) startMusic();
}

export function setAudioSettings({ sound, music }) {
  enabled.sound = !!sound;
  const wasMusic = enabled.music;
  enabled.music = !!music;
  if (enabled.music && !wasMusic && ctx && ctx.state === 'running') startMusic();
  if (!enabled.music && wasMusic) stopMusic();
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else ctx.resume();
});

// ---------- building blocks ----------
function tone({ freq, type = 'sine', t = 0, dur = 0.2, vol = 0.2, attack = 0.005, slideTo = null, dest = null }) {
  const c = ac(); if (!c) return;
  const now = c.currentTime + t;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, now);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(dest || master);
  o.start(now); o.stop(now + dur + 0.05);
}

function noise({ t = 0, dur = 0.06, vol = 0.15, freq = 800, q = 0.8, type = 'lowpass' }) {
  const c = ac(); if (!c) return;
  const now = c.currentTime + t;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(now);
}

const play = (fn) => (...a) => { if (enabled.sound && unlocked && ac() && ctx.state !== 'closed') fn(...a); };

// ---------- game sounds ----------
export const sfx = {
  /** click on lift */
  lift: play(() => {
    tone({ freq: 1500, slideTo: 1050, type: 'triangle', dur: 0.05, vol: 0.07 });
    noise({ dur: 0.02, vol: 0.05, freq: 4000, type: 'highpass' });
  }),
  /** clunk on drop */
  drop: play((t = 0) => {
    tone({ freq: 210, slideTo: 95, type: 'sine', dur: 0.13, vol: 0.28, t });
    noise({ dur: 0.05, vol: 0.12, freq: 900, t });
    tone({ freq: 620, slideTo: 480, type: 'triangle', dur: 0.05, vol: 0.04, t });
  }),
  /** chime on a finished bolt */
  chime: play((t = 0) => {
    [1046.5, 1568, 2093].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.9 - i * 0.2, vol: 0.09 / (i + 1), t: t + i * 0.012 }));
  }),
  /** short fanfare on a win */
  fanfare: play(() => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.13, t: i * 0.09 }));
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone({ freq: f, type: 'triangle', dur: 0.9, vol: 0.06, t: 0.4 }));
    tone({ freq: 2093, type: 'sine', dur: 0.8, vol: 0.04, t: 0.4 });
  }),
  reveal: play(() => {
    tone({ freq: 1760, type: 'sine', dur: 0.12, vol: 0.04 });
    tone({ freq: 2349, type: 'sine', dur: 0.14, vol: 0.03, t: 0.05 });
  }),
  nope: play(() => tone({ freq: 160, type: 'triangle', dur: 0.09, vol: 0.08, slideTo: 120 })),
  tap: play(() => tone({ freq: 900, type: 'sine', dur: 0.035, vol: 0.04 })),
  coin: play(() => { tone({ freq: 988, type: 'square', dur: 0.08, vol: 0.04 }); tone({ freq: 1319, type: 'square', dur: 0.2, vol: 0.04, t: 0.07 }); }),
  /** Happy Birthday (public-domain melody), little music box */
  jingle: play(() => {
    const G4 = 392, A4 = 440, C5 = 523.25, B4 = 493.88, D5 = 587.33, G5 = 783.99, E5 = 659.25, F5 = 698.46;
    const seq = [[G4, .75], [G4, .25], [A4, 1], [G4, 1], [C5, 1], [B4, 2], [G4, .75], [G4, .25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
      [G4, .75], [G4, .25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2], [F5, .75], [F5, .25], [E5, 1], [C5, 1], [D5, 1], [C5, 2.5]];
    const beat = 0.27;
    let t = 0;
    for (const [f, d] of seq) {
      tone({ freq: f * 2, type: 'sine', dur: Math.max(0.25, d * beat * 1.3), vol: 0.09, t });
      tone({ freq: f * 4, type: 'sine', dur: 0.2, vol: 0.02, t });
      t += d * beat;
    }
  }),
};

// ---------- optional ambient music (default off) ----------
const CHORDS = [[261.63, 329.63, 392, 493.88], [220, 261.63, 329.63, 392], [174.61, 220, 261.63, 329.63], [196, 246.94, 293.66, 392]];
function startMusic() {
  const c = ac(); if (!c || musicNodes) return;
  const out = c.createGain();
  out.gain.value = 0.0001;
  out.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 3);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1100;
  lp.connect(out); out.connect(master);
  let i = 0;
  const playChord = () => {
    const now = c.currentTime;
    CHORDS[i % CHORDS.length].forEach((f, k) => {
      for (const det of [-4, 4]) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = k === 0 ? 'triangle' : 'sine';
        o.frequency.value = f / (k === 0 ? 2 : 1);
        o.detune.value = det;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.18, now + 2.2);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 8.6);
        o.connect(g); g.connect(lp);
        o.start(now); o.stop(now + 9);
      }
    });
    i++;
  };
  playChord();
  const timer = setInterval(playChord, 7000);
  musicNodes = { out, timer };
}
function stopMusic() {
  if (!musicNodes) return;
  clearInterval(musicNodes.timer);
  const c = ac();
  musicNodes.out.gain.cancelScheduledValues(c.currentTime);
  musicNodes.out.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
  const o = musicNodes.out;
  setTimeout(() => o.disconnect(), 2000);
  musicNodes = null;
}

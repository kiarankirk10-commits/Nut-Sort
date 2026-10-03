// Lightweight theme effects. Two kinds:
//  - CSS layers (transform/opacity animations only — composited, cheap): nebula, aurora, grid,
//    lava, sunglow, goldflow, blackhole, prism, sheen, rays
//  - canvas particles at <= 30fps, DPR capped: twinkle, parallax, snow, bubbles, dust, streaks
// Everything stops under Reduce Motion, when the page is hidden, and canvas frames are skipped
// while the board is animating if the frame rate drops.

const CSS_KINDS = new Set(['nebula', 'aurora', 'grid', 'lava', 'sunglow', 'goldflow', 'blackhole', 'prism', 'sheen', 'rays']);
let layerEl, canvas, ctx2d;
let systems = [];
let raf = 0, last = 0, hueTimer = 0;
let busy = () => false;
let slowFrames = 0;

export function setBusyCheck(fn) { busy = fn; }

export function startFx(theme, { reducedMotion }) {
  layerEl = layerEl || document.getElementById('fx-layer');
  canvas = canvas || document.getElementById('fx-canvas');
  stopFx();
  if (reducedMotion || !theme.fx.length) return;
  for (const f of theme.fx) {
    if (CSS_KINDS.has(f.kind)) addCssLayer(f);
    else if (f.kind === 'hue') startHue(theme);
    else systems.push(makeSystem(f));
  }
  if (systems.length) {
    resize();
    raf = requestAnimationFrame(loop);
  }
}

export function stopFx() {
  cancelAnimationFrame(raf); raf = 0;
  clearInterval(hueTimer); hueTimer = 0;
  systems = [];
  if (layerEl) layerEl.innerHTML = '';
  if (canvas) { const c = canvas.getContext('2d'); c && c.clearRect(0, 0, canvas.width, canvas.height); }
}

function addCssLayer(f) {
  const d = document.createElement('div');
  d.className = `fx fx-${f.kind}`;
  if (f.colors) f.colors.forEach((c, i) => d.style.setProperty(`--c${i}`, c));
  if (f.color) d.style.setProperty('--c', f.color);
  d.innerHTML = '<i></i><i></i><i></i>';
  layerEl.appendChild(d);
}

// Prism: slowly cycle the accent hue (cheap: one CSS var update every 150ms).
function startHue(theme) {
  let h = 0;
  const root = document.documentElement;
  hueTimer = setInterval(() => {
    if (document.hidden) return;
    h = (h + 1.2) % 360;
    root.style.setProperty('--accent', `hsl(${(h + 320) % 360} 100% 74%)`);
    root.style.setProperty('--accent-2', `hsl(${(h + 230) % 360} 100% 72%)`);
    root.style.setProperty('--accent-light', `hsl(${(h + 320) % 360} 100% 90%)`);
    root.style.setProperty('--glow', `hsl(${(h + 320) % 360} 100% 70% / .4)`);
  }, 150);
}

function resize() {
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  ctx2d = canvas.getContext('2d');
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  systems.forEach((s) => s.init && s.init(innerWidth, innerHeight));
}
window.addEventListener('resize', () => { if (systems.length) resize(); });

function loop(t) {
  raf = requestAnimationFrame(loop);
  if (document.hidden) return;
  const dt = t - last;
  if (dt < 32) return;                 // ~30fps is plenty for ambience
  if (dt > 60) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
  if (busy() && slowFrames > 2) { last = t; return; } // board animating and we're dropping frames: pause
  last = t;
  const w = innerWidth, hgt = innerHeight;
  ctx2d.clearRect(0, 0, w, hgt);
  for (const s of systems) s.draw(ctx2d, w, hgt, t, Math.min(dt, 80) / 1000);
}

const rand = (a, b) => a + Math.random() * (b - a);

function makeSystem(f) {
  const n = f.count || 40;
  let ps = [];
  switch (f.kind) {
    case 'twinkle':
    case 'parallax':
      return {
        init(w, h) { ps = Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.3, f.kind === 'parallax' ? 1.8 : 1.4), p: rand(0, 6.3), s: rand(0.3, 1), z: rand(0.2, 1) })); },
        draw(c, w, h, t, dt) {
          c.fillStyle = f.color || '#ffffff';
          for (const s of ps) {
            if (f.kind === 'parallax') { s.x -= s.z * 6 * dt; if (s.x < -2) s.x = w + 2; }
            c.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t / 1300 * s.s + s.p));
            c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
        },
      };
    case 'snow':
      return {
        init(w, h) { ps = Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.8, 2.4), v: rand(10, 28), p: rand(0, 6.3) })); },
        draw(c, w, h, t, dt) {
          c.fillStyle = '#F0FCFF';
          for (const s of ps) {
            s.y += s.v * dt; s.x += Math.sin(t / 1600 + s.p) * 8 * dt;
            if (s.y > h + 4) { s.y = -4; s.x = rand(0, w); }
            c.globalAlpha = 0.55; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
        },
      };
    case 'bubbles':
      return {
        init(w, h) { ps = Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(1.5, 5), v: rand(12, 34), p: rand(0, 6.3) })); },
        draw(c, w, h, t, dt) {
          c.strokeStyle = 'rgba(160,255,245,.45)'; c.lineWidth = 1;
          for (const s of ps) {
            s.y -= s.v * dt; s.x += Math.sin(t / 900 + s.p) * 10 * dt;
            if (s.y < -8) { s.y = h + 8; s.x = rand(0, w); }
            c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.stroke();
            c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(s.x - s.r * 0.35, s.y - s.r * 0.35, s.r * 0.25, 0, 6.283); c.fill();
          }
        },
      };
    case 'dust':
      return {
        init(w, h) { ps = Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.6, 1.8), vx: rand(-6, 6), vy: rand(-10, -3), p: rand(0, 6.3) })); },
        draw(c, w, h, t, dt) {
          for (const s of ps) {
            s.x += s.vx * dt; s.y += s.vy * dt;
            if (s.y < -4) { s.y = h + 4; s.x = rand(0, w); }
            c.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t / 700 + s.p));
            c.fillStyle = '#FFD45E'; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
        },
      };
    case 'streaks':
      return {
        init(w, h) { ps = Array.from({ length: n }, () => ({ a: rand(0, 6.283), d: rand(40, Math.max(w, h)), v: rand(0.05, 0.25), l: rand(4, 18) })); },
        draw(c, w, h, t, dt) {
          const cx = w / 2, cy = h * 0.2;
          c.strokeStyle = 'rgba(255,230,210,.5)'; c.lineWidth = 1;
          for (const s of ps) {
            s.a += s.v * dt * (120 / (s.d + 20));
            s.d -= 8 * dt; if (s.d < 30) s.d = Math.max(w, h);
            const x = cx + Math.cos(s.a) * s.d, y = cy + Math.sin(s.a) * s.d * 0.5;
            const x2 = cx + Math.cos(s.a - s.l / s.d) * s.d, y2 = cy + Math.sin(s.a - s.l / s.d) * s.d * 0.5;
            c.globalAlpha = Math.min(1, s.d / 200) * 0.7;
            c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
          }
          c.globalAlpha = 1;
        },
      };
    default:
      return { draw() {} };
  }
}

// Confetti burst on a canvas (~1.5s). Pieces use the nut colours + gold.
import { NUT_COLORS } from './colors.js';
import { MOTION } from './config.js';

let canvas, ctx, raf = 0, pieces = [], until = 0;

export function confetti({ count = 140, duration = MOTION.confetti, origin = null, extra = [] } = {}) {
  canvas = canvas || document.getElementById('confetti');
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ['#EABA3C', '#FFECA8', ...NUT_COLORS.map((c) => c.top), ...extra];
  const ox = origin ? origin.x : innerWidth / 2, oy = origin ? origin.y : innerHeight * 0.35;
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const v = 260 + Math.random() * 520;
    pieces.push({
      x: ox + (Math.random() - 0.5) * 60, y: oy + (Math.random() - 0.5) * 30,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      c: colors[(Math.random() * colors.length) | 0], life: duration * (0.7 + Math.random() * 0.5),
    });
  }
  until = performance.now() + duration * 1.25;
  if (!raf) { let last = performance.now(); const step = (t) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; draw(dt, t); }; raf = requestAnimationFrame(function f(t) { step(t); raf = pieces.length ? requestAnimationFrame(f) : 0; if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight); }); }
}

function draw(dt) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  pieces = pieces.filter((p) => (p.life -= dt * 1000) > 0 && p.y < innerHeight + 40);
  for (const p of pieces) {
    p.vy += 900 * dt; p.vx *= 0.985; p.vy *= 0.985;
    p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life / 300);
    ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.scale(1, Math.cos(p.r * 1.7));
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
}

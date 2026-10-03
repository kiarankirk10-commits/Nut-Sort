// Birthday decorations layered over any theme: bunting across the top, balloons at the sides.
// (Party hat on the lifted nut lives in renderer.js; confetti on every win in screens/play.js.)
import { NUT_COLORS } from './colors.js';

const BALLOON_COLORS = ['#E14751', '#3882EC', '#FCCA3D', '#F583B2', '#50AF54', '#AC4BBB', '#5BCCFB'];

function bunting() {
  const n = 16, w = 400, step = w / n;
  let flags = '';
  for (let i = 0; i < n; i++) {
    const c = NUT_COLORS[[0, 3, 8, 11, 9, 2, 6, 4][i % 8]].top;
    flags += `<path d="M${i * step + 1} 6 L${(i + 1) * step - 1} 6 L${(i + 0.5) * step} 27 Z" fill="${c}"/>`;
  }
  return `<svg class="bunting" viewBox="0 0 400 32" preserveAspectRatio="none"><path d="M0 5 Q200 9 400 5" stroke="#EABA3C" stroke-width="1.6" fill="none"/>${flags}</svg>`;
}

function balloon(color, style) {
  return `<svg class="balloon" style="${style}" viewBox="0 0 40 90"><path d="M20 52 C 18 62, 24 70, 19 90" stroke="rgba(255,255,255,.45)" stroke-width="1" fill="none"/>
<ellipse cx="20" cy="24" rx="17" ry="22" fill="${color}"/><path d="M17 46 L23 46 L20 51 Z" fill="${color}"/>
<ellipse cx="13" cy="15" rx="4" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 13 15)"/></svg>`;
}

/** Show or hide the decorations. `screen` lets us keep balloons off the busy play area edges. */
export function setBirthdayDecor(on) {
  const root = document.getElementById('party');
  if (!on) { root.innerHTML = ''; root.dataset.on = ''; return; }
  if (root.dataset.on) return;
  root.dataset.on = '1';
  const spots = [
    'left:-8px; top:20%; animation-delay:-1s', 'left:4px; top:46%; width:26px; animation-delay:-2.5s', 'left:-6px; top:70%; width:30px; animation-delay:-.6s',
    'right:-8px; top:24%; animation-delay:-3s', 'right:2px; top:52%; width:28px; animation-delay:-1.8s', 'right:-6px; top:75%; width:30px; animation-delay:-4s',
  ];
  root.innerHTML = bunting() + spots.map((s, i) => balloon(BALLOON_COLORS[i % BALLOON_COLORS.length], s)).join('');
}

/** Birthday cake illustration for the greeting screen. */
export function cakeSVG() {
  return `<svg class="cake" viewBox="0 0 200 150">
<ellipse cx="100" cy="138" rx="92" ry="9" fill="#d9dde5"/>
<rect x="38" y="88" width="124" height="46" rx="8" fill="#8A3B2E"/><rect x="38" y="88" width="124" height="12" rx="6" fill="#A54A39"/>
<rect x="52" y="52" width="96" height="40" rx="8" fill="#F3D9C4"/>
<path d="M52 62 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 v-6 h-96z" fill="#FFF3E6"/>
${[70, 90, 110, 130].map((x, i) => `<rect x="${x - 3}" y="26" width="6" height="28" rx="2" fill="${['#5BCCFB', '#EABA3C', '#F583B2', '#50AF54'][i]}"/><path class="flame-anim" style="animation-delay:-${i * 0.15}s" d="M${x} 10 c5 7 5 12 0 15 c-5 -3 -5 -8 0 -15z" fill="#FFCF4A"/>`).join('')}
</svg>`;
}

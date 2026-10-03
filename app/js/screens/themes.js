// THEMES: grid of preview cards by tier; tap = full-screen live preview + Buy / Equip.
import { icon } from '../icons.js';
import { wire, h, toast, esc } from '../ui.js';
import { THEMES, TIERS, themeById } from '../themes.js';
import { applyTheme } from '../theme-apply.js';
import { nutImage } from '../art.js';
import { starBalance, spend } from '../save.js';
import { sfx } from '../audio.js';
import { backHeader } from './common.js';

let sheet = null;
let banner = null;

function card(app, t) {
  const s = app.save;
  const owned = s.themes.owned.includes(t.id);
  const eq = s.themes.equipped === t.id;
  const k = t.tokens;
  const st = eq ? '<span class="price eq">EQUIPPED</span>' : owned ? '<span class="price own">OWNED</span>'
    : `<span class="price ${starBalance(s) < t.price ? 'lock' : ''}">${starBalance(s) < t.price ? icon('lock') : icon('star')}${t.price}</span>`;
  return `<button class="panel theme-card ${eq ? 'equipped' : ''}" data-act="preview" data-arg="${t.id}">
    <div class="pv" style="background:${k.bg}">
      <div class="line" style="background:${k.accent}"></div>
      <div class="stk"><img src="${nutImage(11)}"><img src="${nutImage(0)}"><img src="${nutImage(3)}"></div>
      <div class="bt" style="background:linear-gradient(180deg, ${k.light} -40%, ${k.accent} 40%, ${k.accent2})"></div>
    </div>
    <div class="nm">${esc(t.name)}</div><div class="st">${st}</div></button>`;
}

function closeSheet(app, revert = true) {
  if (sheet) { const s = sheet; s.classList.remove('show'); setTimeout(() => s.remove(), 260); sheet = null; }
  if (banner) { banner.remove(); banner = null; }
  if (revert) applyTheme(app.save.themes.equipped, { animate: true, reducedMotion: app.reducedMotion() });
}

function openPreview(app, id, rerender) {
  const t = themeById(id);
  closeSheet(app, false);
  applyTheme(t.id, { animate: true, reducedMotion: app.reducedMotion() });
  const s = app.save;
  const owned = s.themes.owned.includes(t.id);
  const eq = s.themes.equipped === t.id;
  const bal = starBalance(s);
  const tier = TIERS[t.tier].name;
  let action;
  if (eq) action = '<button class="btn btn-gold" data-act="close">Equipped ✓</button>';
  else if (owned) action = '<button class="btn btn-gold" data-act="equip">Equip</button>';
  else if (bal >= t.price) action = `<button class="btn btn-gold" data-act="buy">Buy for ${t.price} stars</button>`;
  else action = `<p class="need">You have ${bal} ★ — ${t.price - bal} more needed. Earn stars on levels and the daily.</p><button class="btn btn-gold" disabled>Buy for ${t.price} stars</button>`;
  sheet = h(`<div class="theme-sheet panel"><h2>${esc(t.name)}</h2><div class="tier">${tier}${t.price ? ` · ${t.price} stars` : ' · free'}${t.fx.length ? ' · animated' : ''}</div>
    <div class="btns">${action}<button class="btn btn-outline" data-act="close">${eq ? 'Back' : 'Close preview'}</button></div></div>`);
  banner = h(`<span class="chip preview-banner">${icon('palette').replace('<svg', '<svg style="color:var(--accent)"')}Previewing ${esc(t.name)}</span>`);
  document.body.appendChild(banner);
  document.body.appendChild(sheet);
  requestAnimationFrame(() => requestAnimationFrame(() => sheet && sheet.classList.add('show')));
  wire(sheet, {
    close: () => closeSheet(app, true),
    equip: () => { s.themes.equipped = t.id; app.persist(); closeSheet(app, false); sfx.tap(); rerender(); },
    buy: () => {
      if (!spend(s, t.price)) { toast('Not enough stars yet'); return; }
      s.themes.owned.push(t.id);
      s.themes.equipped = t.id;
      app.persist();
      sfx.coin();
      toast(`${t.name} unlocked!`);
      closeSheet(app, false);
      rerender();
    },
  });
}

export default {
  render(app, el) {
    const s = app.save;
    const tiers = TIERS.map((tier) => {
      const list = THEMES.filter((t) => t.tier === tier.id);
      return `<div class="tier-h">${tier.name}<span>${tier.id === 0 ? 'included' : `${Math.min(...list.map((t) => t.price))}–${Math.max(...list.map((t) => t.price))} ★`}</span></div>
        <div class="theme-grid">${list.map((t) => card(app, t)).join('')}</div>`;
    }).join('');
    el.innerHTML = `${backHeader('Themes', '', `<span class="chip">${icon('star').replace('<svg', '<svg style="color:var(--accent)"')}${starBalance(s)}</span>`)}
      <div class="scroll">${tiers}
      <div class="tier-h">Special<span>not for sale</span></div>
      <div class="theme-grid"><div class="panel theme-card"><div class="pv" style="background:#09090B;display:grid;place-items:center;font-size:30px">🎂</div>
        <div class="nm">Birthday</div><div class="st"><span class="price own">AUTO · 15 MAR / 19 OCT</span></div></div></div>
      <p class="h-sub center" style="margin-top:16px">Earn stars on levels and the daily challenge. Themes change the look, never the nut colours.</p></div>`;
    if (!el.dataset.wired) {
      el.dataset.wired = '1';
      wire(el, {
        back: () => app.back(),
        preview: (id) => openPreview(app, id, () => this.render(app, el)),
      });
    }
  },
  leave(app) { closeSheet(app, true); },
};

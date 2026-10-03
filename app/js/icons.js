// Inline SVG icons (gold line/solid style). Use: icon('pause')
const S = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const F = (d) => `<svg viewBox="0 0 24 24" fill="currentColor">${d}</svg>`;

const ICONS = {
  pause: F('<rect x="6.5" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"/>'),
  back: S('<path d="M14.5 5.5L8 12l6.5 6.5"/>'),
  gear: S('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/><circle cx="12" cy="12" r="6.6"/>'),
  star: F('<path d="M12 2.4l2.95 6 6.6.95-4.78 4.65 1.13 6.57L12 17.47l-5.9 3.1 1.13-6.57L2.45 9.35l6.6-.95z"/>'),
  flame: F('<path d="M12.6 2.2c.5 3-1.3 4.6-2.9 6.4-1.6 1.8-3.2 3.7-3.2 6.6a5.5 5.5 0 0 0 11 0c0-2.4-1-4-2.2-5.3.1 1.5-.4 2.7-1.6 3.3.6-3.3-.2-7.6-1.1-11z"/>'),
  undo: S('<path d="M8.5 7.5H4.5v-4"/><path d="M4.8 7.3A8 8 0 1 1 4 13"/>'),
  bulb: S('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
  restart: S('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.6 4v4.3h-4.3"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.6"'),
  play: F('<path d="M7 4.5v15c0 .8.9 1.3 1.6.8l11.2-7.5c.6-.4.6-1.2 0-1.6L8.6 3.7C7.9 3.2 7 3.7 7 4.5z"/>'),
  check: S('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="3"'),
  lock: S('<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/>'),
  snow: S('<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4.2L12 6.5l2.5-2.3M9.5 19.8L12 17.5l2.5 2.3M4.4 10.3l3.2-.9-.8-3.3M19.6 13.7l-3.2.9.8 3.3M4.4 13.7l3.2.9-.8 3.3M19.6 10.3l-3.2-.9.8-3.3"/>', 'stroke-width="1.6"'),
  sound: S('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/>'),
  music: S('<path d="M9 18V5.5l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>'),
  heart: F('<path d="M12 20.5s-7.5-4.6-9.2-9C1.6 8.1 3.7 4.8 7 4.8c2 0 3.3 1 5 2.9 1.7-1.9 3-2.9 5-2.9 3.3 0 5.4 3.3 4.2 6.7-1.7 4.4-9.2 9-9.2 9z"/>'),
  motion: F('<rect x="7" y="5.5" width="3.4" height="13" rx="1.2"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2"/>'),
  cake: S('<path d="M4 20.5h16M5.5 20.5v-7a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5v7"/><path d="M5.5 15.5c1.4 1.2 2.8 1.2 4.2 0 1.4 1.2 2.8 1.2 4.2 0 1.4 1.2 2.8 1.2 4.6 0M12 12V8.5"/><path d="M12 4.5c.9 1 .9 2 0 2.8-.9-.8-.9-1.8 0-2.8z"/>'),
  download: S('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>'),
  upload: S('<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/>'),
  trash: S('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
  palette: S('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-1 1.3-2-.6-1.2.2-2.5 1.6-2.5H17a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9z"/><circle cx="7.8" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="7.8" r="1.2" fill="currentColor"/>'),
  close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
  chart: S('<path d="M5 20V10M12 20V4M19 20v-7"/>'),
  trophy: S('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5A3 3 0 0 1 16 10M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z"/>'),
  sort: S('<path d="M5 7h14M7 12h10M9.5 17h5"/>'),
  grid: S('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  info: S('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>'),
};

export function icon(name, cls = '') {
  const s = ICONS[name] || '';
  return cls ? s.replace('<svg ', `<svg class="${cls}" `) : s;
}

export function stars(n, of = 3, cls = '') {
  let s = '';
  for (let i = 0; i < of; i++) s += icon('star', i < n ? cls : `off ${cls}`.trim());
  return s;
}

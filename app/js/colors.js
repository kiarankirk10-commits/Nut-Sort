// The 18 original nut colours + symbols, sampled from Nut_Sort_App_Screens.pdf p9 swatches.
// Never changed by themes. Each colour has a distinct symbol for colour-blind play.
//   top   = lit top face, front = front face, left/right = side faces, sym = engraved symbol

export const NUT_COLORS = [
  { name: 'red',        top: '#E14751', front: '#D43B44', left: '#A82D33', right: '#BB333B', sym: '#8E232A', symbol: 'heart' },
  { name: 'light grey', top: '#D8E2DD', front: '#C9D4D0', left: '#A0A8A5', right: '#B3BCB8', sym: '#868D8A', symbol: 'star' },
  { name: 'purple',     top: '#AC4BBB', front: '#9E3FAE', left: '#7E3089', right: '#8C379A', sym: '#6A2475', symbol: 'moon' },
  { name: 'blue',       top: '#3882EC', front: '#2975DD', left: '#1F5CB1', right: '#2367C5', sym: '#174B93', symbol: 'drop' },
  { name: 'sky blue',   top: '#5BCCFB', front: '#4DBEED', left: '#3C97BD', right: '#44A9D2', sym: '#2F7FA0', symbol: 'diamond' },
  { name: 'indigo',     top: '#725AD8', front: '#654ECA', left: '#4F3CA1', right: '#5943B3', sym: '#3E2F88', symbol: 'play' },
  { name: 'orange',     top: '#F99A32', front: '#EA8C22', left: '#BB6F1A', right: '#D07C1E', sym: '#A05C14', symbol: 'bolt' },
  { name: 'brown',      top: '#B46144', front: '#A65436', left: '#844229', right: '#944A2F', sym: '#6E3520', symbol: 'cloud' },
  { name: 'yellow',     top: '#FCCA3D', front: '#EEBC2F', left: '#BE9624', right: '#D3A729', sym: '#9E7C1A', symbol: 'sun' },
  { name: 'green',      top: '#50AF54', front: '#42A247', left: '#348037', right: '#3B8F3F', sym: '#2A6A2D', symbol: 'plus' },
  { name: 'teal',       top: '#2E938B', front: '#1C867D', left: '#166963', right: '#19766F', sym: '#0F4E49', symbol: 'ring' },
  { name: 'pink',       top: '#F583B2', front: '#E776A5', left: '#B85D83', right: '#CD6892', sym: '#A04C70', symbol: 'crown' },
  { name: 'charcoal',   top: '#5F6875', front: '#525B68', left: '#404651', right: '#484F5B', sym: '#30353D', symbol: 'square' },
  { name: 'peach',      top: '#EEBD9A', front: '#E0AF8C', left: '#B28B6F', right: '#C69B7C', sym: '#9A6E50', symbol: 'flower' },
  { name: 'lime',       top: '#B1D54A', front: '#A4C63C', left: '#829E2E', right: '#91B034', sym: '#6A8423', symbol: 'hexagon' },
  { name: 'magenta',    top: '#D662E4', front: '#C856D6', left: '#9F43AA', right: '#B14CBE', sym: '#843690', symbol: 'arrow' },
  { name: 'mint',       top: '#8DD7CB', front: '#80C8BE', left: '#659F97', right: '#71B2A9', sym: '#4C807A', symbol: 'note' },
  { name: 'salmon',     top: '#FF927D', front: '#F38570', left: '#C16958', right: '#D77662', sym: '#A65242', symbol: 'triangle' },
];

// Hidden (mystery) nut: grey with "?"
export const HIDDEN_COLOR = { name: 'hidden', top: '#5E626C', front: '#4C5059', left: '#363940', right: '#41444C', sym: '#B4B9C3', symbol: 'question' };

// Symbol artwork, 24x24 box, filled with the symbol colour ({c}).
function flower() {
  let s = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    s += `<circle cx="${(12 + Math.cos(a) * 5.2).toFixed(2)}" cy="${(12.5 + Math.sin(a) * 5.2).toFixed(2)}" r="3.9"/>`;
  }
  return `<g fill="{c}">${s}</g><circle cx="12" cy="12.5" r="2.6" fill="{bg}"/>`;
}
function sun() {
  let rays = '';
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const x1 = 12 + Math.cos(a) * 6.6, y1 = 12 + Math.sin(a) * 6.6, x2 = 12 + Math.cos(a) * 10, y2 = 12 + Math.sin(a) * 10;
    rays += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
  }
  return `<circle cx="12" cy="12" r="4.4" fill="{c}"/><g stroke="{c}" stroke-width="2.2" stroke-linecap="round">${rays}</g>`;
}

export const SYMBOLS = {
  heart: '<path fill="{c}" d="M12 21s-7.2-4.5-9.4-8.8C1 8.9 3 5.3 6.6 5.3c2.1 0 3.5 1.1 5.4 3.1 1.9-2 3.3-3.1 5.4-3.1 3.6 0 5.6 3.6 4 6.9C19.2 16.5 12 21 12 21z"/>',
  star: '<path fill="{c}" d="M12 2.2l2.95 6.3 6.85.75-5.1 4.65 1.45 6.75L12 17.25 5.85 20.65 7.3 13.9 2.2 9.25l6.85-.75z"/>',
  moon: '<path fill="{c}" d="M15.2 2.6A9.6 9.6 0 1 0 21.4 18 7.9 7.9 0 0 1 15.2 2.6z"/>',
  drop: '<path fill="{c}" d="M12 2.2C9 7 5.3 10.6 5.3 14.8a6.7 6.7 0 0 0 13.4 0C18.7 10.6 15 7 12 2.2z"/>',
  diamond: '<path fill="{c}" d="M6.2 4h11.6l4.2 5.4L12 21 2 9.4z"/><path fill="{bg}" opacity=".35" d="M6.2 4h11.6l-2.2 5.4H8.4z"/>',
  play: '<path fill="{c}" d="M7 3.6c0-.9 1-1.4 1.7-.9l11.5 8.3c.6.5.6 1.4 0 1.9L8.7 21.3c-.7.5-1.7 0-1.7-.9z"/>',
  bolt: '<path fill="{c}" d="M13.8 1.8L4.6 13.6h6.2l-1.6 8.6 9.6-12.4h-6.3z"/>',
  cloud: '<path fill="{c}" d="M6.6 19.4a4.7 4.7 0 0 1-.7-9.35A6.3 6.3 0 0 1 17.9 8.7a5.35 5.35 0 0 1 .1 10.7z"/>',
  sun: sun(),
  plus: '<path fill="{c}" d="M8.8 2.8h6.4v6h6v6.4h-6v6h-6.4v-6h-6V8.8h6z"/>',
  ring: '<circle cx="12" cy="12" r="6.6" fill="none" stroke="{c}" stroke-width="3.8"/>',
  crown: '<path fill="{c}" d="M2.8 7.2l4.8 4.3L12 4l4.4 7.5 4.8-4.3-1.8 11.6H4.6z"/>',
  square: '<rect x="4.6" y="4.6" width="14.8" height="14.8" rx="2.6" fill="{c}"/>',
  flower: flower(),
  hexagon: '<path fill="{c}" d="M7 3.6h10l5 8.4-5 8.4H7l-5-8.4z"/>',
  arrow: '<path fill="{c}" d="M12 2.4l8.6 9.2h-5.4v9.8H8.8v-9.8H3.4z"/>',
  note: '<path fill="{c}" d="M9.4 3.2v11.1a3.9 3.9 0 1 0 2.3 3.6V8.1c2.6.4 5.1 1.9 6 4.4 1.1-4.5-2.4-7.9-8.3-9.3z"/>',
  triangle: '<path fill="{c}" d="M12 3.2l9.6 17.2H2.4z"/>',
  question: '<path fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round" d="M8.2 8.6a3.9 3.9 0 1 1 5.6 3.5c-1.3.7-1.8 1.6-1.8 3.1"/><circle cx="12" cy="19.6" r="1.9" fill="{c}"/>',
};

// Parsers for adding guests: typed lines, Excel/CSV rows (SheetJS, loaded on demand) and vCard.
const isPhone = v => /^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 8;

// "Nama | nomor" per line
export const fromText = text => text.split('\n').map(l => l.split('|').map(s => s.trim())).map(([name, phone]) => ({ name, phone }));

// Rows of cells → guests. Phone = first phone-looking cell, name = first cell with letters
// (so a "No" column of 1, 2, 3 is ignored). A first row without a phone that mentions nama/name is the header.
export const fromRows = rows => rows.map(r => r.map(c => String(c ?? '').trim()))
  .filter((cells, i) => !(i === 0 && !cells.some(isPhone) && /nama|name/i.test(cells.join(' '))))
  .map(cells => ({ name: cells.find(c => /\p{L}/u.test(c) && !isPhone(c)) || '', phone: cells.find(isPhone) || '' }));

export const fromVcf = text => text.replace(/\r?\n[ \t]/g, '').split(/BEGIN:VCARD/i).slice(1).map(card => ({
  name: (card.match(/^FN[^:]*:(.*)$/im) || [])[1]?.trim() || '',
  phone: (card.match(/^(?:item\d+\.)?TEL[^:]*:(.*)$/im) || [])[1]?.trim() || '',
}));

export const loadXlsx = () => window.XLSX || new Promise((ok, fail) => document.head.appendChild(Object.assign(
  document.createElement('script'), { src: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', onload: () => ok(window.XLSX), onerror: fail })));

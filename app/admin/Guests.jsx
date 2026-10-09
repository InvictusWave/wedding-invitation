'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { addGuests, markSent, deleteGuest } from './actions';

const DEFAULT_TPL = `Kepada Yth.
Bapak/Ibu/Saudara/i
*{nama}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.

Berikut link undangan kami untuk info lengkap acara:
{link}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih.`;

// The message template is a per-device convenience, so it lives in localStorage.
const store = {
  get: k => { try { return localStorage.getItem('adm:' + k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem('adm:' + k, v); } catch {} },
};

const isPhone = v => /^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 8;

// "Nama | nomor" per line
const fromText = text => text.split('\n').map(l => l.split('|').map(s => s.trim())).map(([name, phone]) => ({ name, phone }));

// Rows of cells → guests. Phone = first phone-looking cell, name = first cell with letters
// (so a "No" column of 1, 2, 3 is ignored). A first row without a phone that mentions nama/name is the header.
const fromRows = rows => rows.map(r => r.map(c => String(c ?? '').trim()))
  .filter((cells, i) => !(i === 0 && !cells.some(isPhone) && /nama|name/i.test(cells.join(' '))))
  .map(cells => ({ name: cells.find(c => /\p{L}/u.test(c) && !isPhone(c)) || '', phone: cells.find(isPhone) || '' }));

const fromVcf = text => text.replace(/\r?\n[ \t]/g, '').split(/BEGIN:VCARD/i).slice(1).map(card => ({
  name: (card.match(/^FN[^:]*:(.*)$/im) || [])[1]?.trim() || '',
  phone: (card.match(/^(?:item\d+\.)?TEL[^:]*:(.*)$/im) || [])[1]?.trim() || '',
}));

const loadXlsx = () => window.XLSX || new Promise((ok, fail) => document.head.appendChild(Object.assign(
  document.createElement('script'), { src: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', onload: () => ok(window.XLSX), onerror: fail })));

export default function Guests({ theme, guests }) {
  const [text, setText] = useState('');
  const [tpl, setTpl] = useState(DEFAULT_TPL);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [origin, setOrigin] = useState('');
  const [canPick, setCanPick] = useState(false);
  const [busy, start] = useTransition();
  const file = useRef(null);

  useEffect(() => {
    setTpl(store.get('tpl') || DEFAULT_TPL);
    setOrigin(location.origin);
    setCanPick('contacts' in navigator && 'select' in navigator.contacts); // Chrome Android only
  }, []);

  const save = list => start(async () => {
    const { added } = await addGuests(list);
    setMsg(`${added} tamu ditambahkan${list.length > added ? `, ${list.length - added} dilewati (kosong/sudah ada)` : ''}.`);
  });

  const onFile = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      if (/\.vcf$/i.test(f.name)) return save(fromVcf(await f.text()));
      const X = await loadXlsx();
      const wb = X.read(await f.arrayBuffer());
      save(fromRows(X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false })));
    } catch {
      setMsg('Gagal membaca file. Pastikan formatnya .xlsx, .csv, atau .vcf.');
    }
  };

  const pick = async () => {
    try {
      const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      save(picked.map(c => ({ name: (c.name?.[0] || '').trim(), phone: c.tel?.[0] || '' })));
    } catch {}
  };

  const linkFor = name => `${origin}/${theme}/?to=${encodeURIComponent(name).replace(/%20/g, '+')}`;
  const messageFor = name => tpl.replaceAll('{nama}', name).replaceAll('{link}', linkFor(name));
  const shown = guests.filter(g => g.name.toLowerCase().includes(q.toLowerCase()) || g.phone.includes(q));
  const sent = guests.filter(g => g.sent_at).length;

  return (
    <>
      <section className="adm-stats">
        <div><b>{guests.length}</b>Total tamu</div>
        <div><b>{sent}</b>Sudah dikirim</div>
        <div><b>{guests.length - sent}</b>Belum dikirim</div>
        <div><b>{guests.filter(g => !g.phone).length}</b>Tanpa nomor</div>
      </section>

      <details className="adm-box" open={!guests.length}>
        <summary>Tambah tamu</summary>
        <label htmlFor="g-add">Satu tamu per baris. Opsional nomor WA: <code>Keluarga Bapak Slamet | 0812xxxx</code></label>
        <textarea id="g-add" rows={5} value={text} onChange={e => setText(e.target.value)} placeholder={'Hasan dan Pasangan | 081234567890\nRekan Kantor'} />
        <div className="adm-row">
          <button className="adm-btn" disabled={busy || !text.trim()} onClick={() => { save(fromText(text)); setText(''); }}>Simpan</button>
          {canPick && <button className="adm-ghost" disabled={busy} onClick={pick}>Pilih dari Kontak HP</button>}
          <button className="adm-ghost" disabled={busy} onClick={() => file.current.click()}>Import Excel / CSV / vCard</button>
          <input ref={file} type="file" accept=".xlsx,.xls,.csv,.vcf" hidden onChange={onFile} />
        </div>
        <p className="adm-hint">Excel: kolom nama &amp; nomor WA, urutan bebas. iPhone: bagikan kontak sebagai .vcf lalu import.</p>
      </details>
      {(busy || msg) && <p className="adm-hint" role="status">{busy ? 'Menyimpan…' : msg}</p>}

      <details className="adm-box">
        <summary>Teks pesan WhatsApp</summary>
        <label htmlFor="g-tpl"><code>{'{nama}'}</code> dan <code>{'{link}'}</code> diganti otomatis</label>
        <textarea id="g-tpl" rows={10} value={tpl} onChange={e => { setTpl(e.target.value); store.set('tpl', e.target.value); }} />
      </details>

      {guests.length > 0 && <input className="adm-search" type="search" placeholder="Cari nama / nomor" value={q} onChange={e => setQ(e.target.value)} />}

      {guests.length === 0 ? <p className="adm-empty">Belum ada tamu untuk undangan ini.</p> : (
        <ul className="adm-list">
          {shown.map(g => (
            <li key={g.id} className="adm-guest">
              <div className="adm-who">
                <b>{g.name}</b>
                <span className="adm-sub">{g.phone ? `+${g.phone}` : 'tanpa nomor'}{g.sent_at ? ` · terkirim ${new Date(g.sent_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' })}` : ''}</span>
              </div>
              <button className="adm-ghost" onClick={async e => {
                await navigator.clipboard.writeText(messageFor(g.name));
                e.target.textContent = 'Tersalin';
              }}>Salin</button>
              <a className={`adm-wa${g.sent_at ? ' adm-sent' : ''}`} target="_blank" rel="noopener"
                href={`https://wa.me/${g.phone}?text=${encodeURIComponent(messageFor(g.name))}`}
                onClick={() => markSent(g.id)}>{g.sent_at ? 'Kirim lagi' : 'Kirim WA'}</a>
              <details className="adm-del">
                <summary aria-label={`Hapus ${g.name}`}>✕</summary>
                <button onClick={() => deleteGuest(g.id)}>Hapus tamu ini</button>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

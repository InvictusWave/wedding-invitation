import { isAdmin } from '../../lib/auth';
import { db, ready, ATTEND, INV, THEMES } from '../../lib/db';
import { logout, deleteWish, setTheme } from './actions';
import LoginForm from './LoginForm';
import Guests from './Guests';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Undangan', robots: { index: false } };

const Icon = ({ id }) => <svg className="i" aria-hidden="true"><use href={`/assets/icons.svg#${id}`} /></svg>;

export default async function Admin({ searchParams }) {
  if (!(await isAdmin())) return <main className="adm"><LoginForm /></main>;

  await ready;
  const view = (await searchParams).view === 'ucapan' ? 'ucapan' : 'tamu';
  const [list, counts, guests, saved] = await db.batch(
    [
      { sql: 'SELECT id, name, attend, msg, sticker, created_at FROM wishes WHERE inv = ? ORDER BY id DESC', args: [INV] },
      { sql: 'SELECT attend, COUNT(*) AS n FROM wishes WHERE inv = ? GROUP BY attend', args: [INV] },
      { sql: 'SELECT id, name, phone, sent_at FROM guests WHERE inv = ? ORDER BY sent_at IS NOT NULL, name', args: [INV] },
      "SELECT value FROM settings WHERE key = 'theme'",
    ],
    'read'
  );
  const theme = THEMES.includes(saved.rows[0]?.value) ? saved.rows[0].value : null;
  const n = Object.fromEntries(counts.rows.map(r => [r.attend, Number(r.n)]));

  return (
    <main className="adm">
      <header className="adm-head">
        <h1>Admin Undangan</h1>
        <form action={logout}><button className="adm-ghost"><Icon id="logout" /> Keluar</button></form>
      </header>

      <form action={setTheme} className="adm-themes">
        <input type="hidden" name="view" value={view} />
        <b>Template undangan {theme ? '' : <span className="adm-warn">— belum dipilih</span>}</b>
        <div>
          {THEMES.map(t => (
            <span key={t} className="adm-theme" aria-current={t === theme ? 'true' : undefined}>
              <button name="theme" value={t}>{t === theme ? '✓ ' : ''}{t}</button>
              <a href={`/${t}/`} target="_blank" aria-label={`Pratinjau ${t}`}><Icon id="external" /></a>
            </span>
          ))}
        </div>
      </form>

      <nav className="adm-views">
        <a href="/admin/?view=tamu" aria-current={view === 'tamu' ? 'page' : undefined}>Tamu ({guests.rows.length})</a>
        <a href="/admin/?view=ucapan" aria-current={view === 'ucapan' ? 'page' : undefined}>Ucapan ({list.rows.length})</a>
      </nav>

      {view === 'tamu' ? (
        <Guests theme={theme || THEMES[0]} guests={guests.rows.map(g => ({ id: Number(g.id), name: g.name, phone: g.phone, sent_at: g.sent_at && Number(g.sent_at) }))} />
      ) : <>

      <section className="adm-stats">
        <div><b>{list.rows.length}</b>Total ucapan</div>
        {ATTEND.map(a => <div key={a}><b>{n[a] || 0}</b>{a}</div>)}
      </section>

      <div className="adm-bar">
        <a href="/api/admin/export/"><Icon id="download" /> Export CSV</a>
      </div>

      {list.rows.length === 0 ? <p className="adm-empty">Belum ada ucapan untuk undangan ini.</p> : (
        <ul className="adm-list">
          {list.rows.map(w => (
            <li key={w.id}>
              <div className="adm-meta">
                <b>{w.name}</b>
                <span className={`adm-pill adm-${w.attend === 'Hadir' ? 'yes' : w.attend === 'Tidak Hadir' ? 'no' : 'maybe'}`}>{w.attend}</span>
                <time>{new Date(Number(w.created_at)).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}</time>
              </div>
              <p>{w.msg}</p>
              {w.sticker && <img src={`/adat-jawa/${w.sticker}`} alt="stiker" width="56" />}
              <details className="adm-del">
                <summary><Icon id="trash" /> Hapus</summary>
                <form action={deleteWish}>
                  <input type="hidden" name="id" value={w.id} />
                  <button>Ya, hapus ucapan ini</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
      </>}
    </main>
  );
}

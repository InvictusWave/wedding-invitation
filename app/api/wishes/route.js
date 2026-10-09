// Ucapan & RSVP per undangan, disimpan di Turso (lihat lib/db.js).
import { db, ready, ATTEND } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const INV = /^[a-z0-9-]{1,60}$/;
const STICKER = /^img\/stiker-[\w-]+\.(png|webp)$/;
const bad = msg => Response.json({ error: msg }, { status: 400 });

export async function GET(req) {
  const inv = new URL(req.url).searchParams.get('inv') || '';
  if (!INV.test(inv)) return bad('inv tidak valid');
  await ready;
  const [list, counts] = await db.batch(
    [
      { sql: 'SELECT name, attend, msg, sticker, created_at AS at FROM wishes WHERE inv = ? ORDER BY id DESC LIMIT 300', args: [inv] },
      { sql: 'SELECT attend, COUNT(*) AS n FROM wishes WHERE inv = ? GROUP BY attend', args: [inv] },
    ],
    'read'
  );
  return Response.json({
    wishes: list.rows,
    counts: Object.fromEntries(counts.rows.map(r => [r.attend, Number(r.n)])),
  });
}

// ponytail: no rate limit / captcha; add Cloudflare Turnstile here if spam shows up.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return bad('body harus JSON');
  const inv = String(b.inv || '');
  const name = String(b.name || '').trim().slice(0, 60);
  const msg = String(b.msg || '').trim().slice(0, 500);
  const sticker = b.sticker ? String(b.sticker) : null;
  if (!INV.test(inv)) return bad('inv tidak valid');
  if (!name) return bad('Nama wajib diisi');
  if (msg.length < 2) return bad('Ucapan minimal 2 karakter');
  if (!ATTEND.includes(b.attend)) return bad('Pilih konfirmasi kehadiran');
  if (sticker && !STICKER.test(sticker)) return bad('Stiker tidak valid');
  await ready;
  await db.execute({
    sql: 'INSERT INTO wishes (inv, name, attend, msg, sticker, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [inv, name, b.attend, msg, sticker, Date.now()],
  });
  return Response.json({ ok: true }, { status: 201 });
}

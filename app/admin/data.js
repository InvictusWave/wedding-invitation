import { db, ready, INV, THEMES } from '../../lib/db';

// One round trip for everything the admin pages show.
export async function loadAdmin() {
  await ready;
  const [wishes, guests, saved] = await db.batch(
    [
      { sql: 'SELECT id, name, attend, msg, sticker, created_at FROM wishes WHERE inv = ? ORDER BY id DESC', args: [INV] },
      { sql: 'SELECT id, name, phone, sent_at FROM guests WHERE inv = ? ORDER BY sent_at IS NOT NULL, name', args: [INV] },
      "SELECT value FROM settings WHERE key = 'theme'",
    ],
    'read'
  );
  return {
    theme: THEMES.includes(saved.rows[0]?.value) ? saved.rows[0].value : null,
    wishes: wishes.rows.map(w => ({ id: Number(w.id), name: w.name, attend: w.attend, msg: w.msg, sticker: w.sticker, at: Number(w.created_at) })),
    guests: guests.rows.map(g => ({ id: Number(g.id), name: g.name, phone: g.phone, sent_at: g.sent_at && Number(g.sent_at) })),
  };
}

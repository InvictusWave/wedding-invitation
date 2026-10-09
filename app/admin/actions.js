'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { checkLogin, startSession, endSession, isAdmin } from '../../lib/auth';
import { db, ready, INV, THEMES } from '../../lib/db';

// ponytail: no login rate limit; the password is long and random. Add one if it becomes guessable.
export async function login(_prev, form) {
  const user = form.get('user');
  if (!checkLogin(user, form.get('password'))) return { error: 'Username atau password salah', user };
  await startSession(user);
  redirect('/admin/');
}

export async function logout() {
  await endSession();
  redirect('/admin/');
}

export async function deleteWish(id) {
  if (!(await isAdmin())) redirect('/admin/');
  await ready;
  await db.execute({ sql: 'DELETE FROM wishes WHERE id = ?', args: [Number(id)] });
  revalidatePath('/admin/', 'layout');
}

// 0812… / +62812… / 62812… / 812… (Excel drops the leading 0) → 62812…
const waNumber = raw => {
  const d = String(raw || '').replace(/\D/g, '').slice(0, 15);
  return d.startsWith('0') ? '62' + d.slice(1) : d.startsWith('8') ? '62' + d : d;
};

// Called from the Guests client component with [{ name, phone }]; names already in the list are skipped.
export async function addGuests(list) {
  if (!(await isAdmin())) redirect('/admin/');
  if (!Array.isArray(list)) return { added: 0 };
  const rows = list.slice(0, 2000)
    .map(g => ({ name: String(g?.name || '').trim().slice(0, 80), phone: waNumber(g?.phone) }))
    .filter(g => g.name);
  if (!rows.length) return { added: 0 };
  await ready;
  const res = await db.batch(rows.map(g => ({
    sql: 'INSERT OR IGNORE INTO guests (inv, name, phone, created_at) VALUES (?, ?, ?, ?)',
    args: [INV, g.name, g.phone, Date.now()],
  })), 'write');
  revalidatePath('/admin/', 'layout');
  return { added: res.reduce((n, r) => n + r.rowsAffected, 0) };
}

// Template undangan yang dipakai; "/" dan link WA mengikuti pilihan ini.
export async function setTheme(theme) {
  if (!(await isAdmin())) redirect('/admin/');
  if (!THEMES.includes(theme)) return;
  await ready;
  await db.execute({ sql: "INSERT INTO settings (key, value) VALUES ('theme', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", args: [theme] });
  revalidatePath('/admin/', 'layout');
}

export async function markSent(id) {
  if (!(await isAdmin())) redirect('/admin/');
  await ready;
  await db.execute({ sql: 'UPDATE guests SET sent_at = ? WHERE id = ?', args: [Date.now(), Number(id)] });
  revalidatePath('/admin/', 'layout');
}

export async function deleteGuest(id) {
  if (!(await isAdmin())) redirect('/admin/');
  await ready;
  await db.execute({ sql: 'DELETE FROM guests WHERE id = ?', args: [Number(id)] });
  revalidatePath('/admin/', 'layout');
}

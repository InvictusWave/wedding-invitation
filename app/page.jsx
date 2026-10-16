import { redirect } from 'next/navigation';
import { db, ready, THEMES } from '../lib/db';

export const dynamic = 'force-dynamic';

// "/" → the template chosen in /admin/ (keeps guest name and schedule on short links).
export default async function Home({ searchParams }) {
  await ready;
  const { rows } = await db.execute("SELECT value FROM settings WHERE key = 'theme'");
  const theme = THEMES.includes(rows[0]?.value) ? rows[0].value : THEMES[0];
  const { to, jadwal } = await searchParams;
  const query = new URLSearchParams();
  if (to) query.set('to', to);
  if (['wanita', 'pria', 'sabtu', 'banyu-mili'].includes(jadwal)) query.set('jadwal', jadwal);
  redirect(`/${theme}/${query.size ? `?${query}` : ''}`);
}

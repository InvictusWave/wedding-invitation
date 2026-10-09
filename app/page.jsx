import { redirect } from 'next/navigation';
import { db, ready, THEMES } from '../lib/db';

export const dynamic = 'force-dynamic';

// "/" → the template chosen in /admin/ (keeps ?to=Nama so a short link still greets the guest).
export default async function Home({ searchParams }) {
  await ready;
  const { rows } = await db.execute("SELECT value FROM settings WHERE key = 'theme'");
  const theme = THEMES.includes(rows[0]?.value) ? rows[0].value : THEMES[0];
  const to = (await searchParams).to;
  redirect(`/${theme}/${to ? `?to=${encodeURIComponent(to)}` : ''}`);
}

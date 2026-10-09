import { redirect } from 'next/navigation';
import { checkToken, startSession } from '../../../lib/auth';

// /admin/masuk/?token=<ADMIN_TOKEN> → session cookie, then the token leaves the address bar.
export async function GET(req) {
  if (checkToken(new URL(req.url).searchParams.get('token') || '')) await startSession('token');
  redirect('/admin/');
}

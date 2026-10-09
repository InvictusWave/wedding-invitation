// Single admin user from env: ADMIN_USER, ADMIN_PASSWORD_HASH ("salt:scrypt-hex"), SESSION_SECRET.
// Or a link login: /admin/masuk/?token=<ADMIN_TOKEN>.
// Session = signed cookie "user.expiry.hmac"; nothing stored server-side.
import { scryptSync, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'adm';
const MAX_AGE = 7 * 24 * 3600; // 7 hari

const same = (a, b) => a.length === b.length && timingSafeEqual(a, b);
const sign = data => createHmac('sha256', process.env.SESSION_SECRET).update(data).digest('base64url');

export function checkLogin(user, password) {
  const [salt, hash] = (process.env.ADMIN_PASSWORD_HASH || '').split(':');
  if (!salt || !hash || !process.env.SESSION_SECRET) return false;
  const userOk = same(Buffer.from(String(user)), Buffer.from(process.env.ADMIN_USER || ''));
  const passOk = same(scryptSync(String(password), salt, 64), Buffer.from(hash, 'hex'));
  return userOk && passOk;
}

export function checkToken(token) {
  const t = process.env.ADMIN_TOKEN || '';
  return t.length >= 16 && !!process.env.SESSION_SECRET && same(Buffer.from(String(token)), Buffer.from(t));
}

export async function startSession(user) {
  const data = `${user}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  (await cookies()).set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value || '';
  const i = v.lastIndexOf('.');
  if (i < 0 || !process.env.SESSION_SECRET) return false;
  const data = v.slice(0, i);
  const exp = Number(data.split('.').pop());
  return same(Buffer.from(v.slice(i + 1)), Buffer.from(sign(data))) && exp > Date.now() / 1000;
}

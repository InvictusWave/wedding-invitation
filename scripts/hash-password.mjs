// Usage: node scripts/hash-password.mjs <password-baru>  → paste the line into .env.local / Vercel env
import { randomBytes, scryptSync } from 'node:crypto';
const pw = process.argv[2];
if (!pw || pw.length < 10) { console.error('Password minimal 10 karakter'); process.exit(1); }
const salt = randomBytes(16).toString('hex');
console.log(`ADMIN_PASSWORD_HASH=${salt}:${scryptSync(pw, salt, 64).toString('hex')}`);

import { isAdmin } from '../../../../lib/auth';
import { db, ready, INV } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function GET() {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  await ready;
  const { rows } = await db.execute({
    sql: 'SELECT created_at, name, attend, msg FROM wishes WHERE inv = ? ORDER BY id',
    args: [INV],
  });
  const lines = [
    ['Waktu', 'Nama', 'Kehadiran', 'Ucapan'],
    ...rows.map(r => [new Date(Number(r.created_at)).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), r.name, r.attend, r.msg]),
  ].map(r => r.map(cell).join(','));
  // BOM so Excel opens UTF-8 (emoji, accents) correctly
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ucapan.csv"',
    },
  });
}

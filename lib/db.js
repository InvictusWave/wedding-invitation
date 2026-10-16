// Turso (libSQL). Env: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN. Tanpa env (lokal) pakai file local.db.
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const ATTEND = ['Hadir', 'Tidak Hadir', 'Ragu-ragu'];

// Semua tema (adat-jawa, jawa-red-art, jawa-classic-foto) adalah satu undangan: tamu & ucapan dipakai bersama.
export const INV = 'utama';
export const THEMES = ['jawa-red-art', 'adat-jawa', 'jawa-classic-foto'];

export const ready = (async () => {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY,
      inv TEXT NOT NULL,
      name TEXT NOT NULL,
      attend TEXT NOT NULL CHECK (attend IN ('Hadir','Tidak Hadir','Ragu-ragu')),
      msg TEXT NOT NULL,
      sticker TEXT,
      created_at INTEGER NOT NULL
    )`,
    'CREATE INDEX IF NOT EXISTS wishes_inv ON wishes (inv, id DESC)',
    `CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY,
      inv TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      schedule TEXT NOT NULL DEFAULT 'semua',
      sent_at INTEGER,
      created_at INTEGER NOT NULL,
      UNIQUE (inv, name)
    )`,
    'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  ], 'write');
  // Existing local/prod databases need the new per-guest schedule column once.
  try {
    await db.execute("ALTER TABLE guests ADD COLUMN schedule TEXT NOT NULL DEFAULT 'semua'");
  } catch (error) {
    if (!/duplicate column|already exists/i.test(String(error))) throw error;
  }
  await db.batch([
    // ponytail: one-time merge of the old per-theme rows into INV; cheap no-op afterwards, delete once prod has run it.
    `UPDATE wishes SET inv = 'utama' WHERE inv <> 'utama'`,
    `UPDATE OR IGNORE guests SET inv = 'utama' WHERE inv <> 'utama'`,
    `DELETE FROM guests WHERE inv <> 'utama'`,
  ], 'write');
})();

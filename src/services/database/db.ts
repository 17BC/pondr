import * as SQLite from 'expo-sqlite';

import { CREATE_TABLES_SQL, DB_NAME, LEGACY_DB_NAME } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(CREATE_TABLES_SQL);

  // One-time migration: if a legacy database exists, copy its decisions into the new DB.
  // We use PRAGMA user_version as a lightweight marker to avoid doing this every launch.
  try {
    const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    const userVersion = Number(versionRow?.user_version ?? 0);

    if (userVersion < 1) {
      try {
        const legacyDb = await SQLite.openDatabaseAsync(LEGACY_DB_NAME);
        const legacyRows = await legacyDb.getAllAsync<any>('SELECT * FROM decisions;');

        for (const row of legacyRows) {
          await db.runAsync(
            `INSERT OR IGNORE INTO decisions
              (id, title, category, whyText, feeling, confidence, tradeoffGains, tradeoffLosses, tags, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              row.id,
              row.title,
              row.category,
              row.whyText ?? null,
              row.feeling,
              row.confidence,
              row.tradeoffGains,
              row.tradeoffLosses,
              row.tags,
              row.createdAt,
              row.updatedAt,
            ]
          );
        }
      } catch {
        // If the legacy DB doesn't exist or doesn't have the expected schema, ignore.
      }

      await db.execAsync('PRAGMA user_version = 1;');
    }
  } catch {
    // If user_version isn't accessible for some reason, do nothing.
  }
}

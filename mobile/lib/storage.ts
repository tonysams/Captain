import * as SQLite from 'expo-sqlite';
import type { OfflineJob } from '../types/session';

const DB_NAME = 'instructor_buddy.db';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS offline_jobs (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL,
      frame_index INTEGER NOT NULL,
      timestamp   REAL NOT NULL,
      image_uri   TEXT NOT NULL,
      pose_json   TEXT NOT NULL,
      context     TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      retries     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS instructor_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

// ─── Offline Job Queue ────────────────────────────────────────────────────────

export async function enqueueJob(job: Omit<OfflineJob, 'retries'>): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO offline_jobs
     (id, session_id, frame_index, timestamp, image_uri, pose_json, context, created_at, retries)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      job.id,
      job.sessionId,
      job.frameIndex,
      job.timestamp,
      job.imageUri,
      job.poseJson,
      job.context,
      job.createdAt,
    ],
  );
}

export async function getPendingJobs(limit = 5): Promise<OfflineJob[]> {
  const database = await getDb();
  return database.getAllAsync<OfflineJob>(
    `SELECT id, session_id as sessionId, frame_index as frameIndex,
            timestamp, image_uri as imageUri, pose_json as poseJson,
            context, created_at as createdAt, retries
     FROM offline_jobs
     WHERE retries < 3
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
}

export async function markJobComplete(jobId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM offline_jobs WHERE id = ?', [jobId]);
}

export async function incrementJobRetries(jobId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE offline_jobs SET retries = retries + 1 WHERE id = ?',
    [jobId],
  );
}

export async function getPendingJobCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM offline_jobs WHERE retries < 3',
  );
  return result?.count ?? 0;
}

// ─── Instructor Settings ──────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM instructor_settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO instructor_settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}

import { existsSync, mkdirSync } from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { Memory, RevisionEvent, TimelineEvent } from "../memory/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "memoryos.db");

let db: Database.Database | null = null;

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ensureDb(): Database.Database {
  if (db) {
    return db;
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const nextDb = new Database(DB_PATH);
  nextDb.pragma("journal_mode = WAL");

  nextDb.exec(`
    CREATE TABLE IF NOT EXISTS recent_memories (
      user_id TEXT NOT NULL,
      memory_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, memory_id)
    );

    CREATE INDEX IF NOT EXISTS idx_recent_memories_user_updated
      ON recent_memories(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      memory_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      metadata_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_user_ts
      ON timeline_events(user_id, timestamp ASC);

    CREATE TABLE IF NOT EXISTS revision_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      memory_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      changed_at TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      reason TEXT NOT NULL,
      changes_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_revision_memory_version
      ON revision_events(memory_id, version ASC);

    CREATE INDEX IF NOT EXISTS idx_revision_user_changed
      ON revision_events(user_id, changed_at ASC);
  `);

  db = nextDb;
  return db;
}

export function ensureRuntimeStoreDb(): void {
  void ensureDb();
}

export function isRuntimeStoreDbHealthy(): boolean {
  try {
    const database = ensureDb();
    database.prepare("SELECT 1 AS ok").get();
    return true;
  } catch {
    return false;
  }
}

export function upsertRecentMemoryInDb(
  memory: Memory,
  maxRecentPerUser: number,
): void {
  const database = ensureDb();
  const nowIso = memory.updatedAt || new Date().toISOString();

  const upsertStmt = database.prepare(`
    INSERT INTO recent_memories(user_id, memory_id, data_json, updated_at)
    VALUES (@userId, @memoryId, @dataJson, @updatedAt)
    ON CONFLICT(user_id, memory_id) DO UPDATE SET
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `);

  const pruneStmt = database.prepare(`
    DELETE FROM recent_memories
    WHERE user_id = @userId
      AND memory_id NOT IN (
        SELECT memory_id
        FROM recent_memories
        WHERE user_id = @userId
        ORDER BY updated_at DESC
        LIMIT @limit
      )
  `);

  const tx = database.transaction(() => {
    upsertStmt.run({
      userId: memory.userId,
      memoryId: memory.id,
      dataJson: JSON.stringify(memory),
      updatedAt: nowIso,
    });

    pruneStmt.run({
      userId: memory.userId,
      limit: maxRecentPerUser,
    });
  });

  tx();
}

export function listRecentMemoriesFromDb(userId?: string): Memory[] {
  const database = ensureDb();
  const rows = userId
    ? database
        .prepare(
          `
            SELECT data_json
            FROM recent_memories
            WHERE user_id = ?
            ORDER BY updated_at DESC
          `,
        )
        .all(userId)
    : database
        .prepare(
          `
            SELECT data_json
            FROM recent_memories
            ORDER BY updated_at DESC
          `,
        )
        .all();

  return rows
    .map((row: unknown) =>
      safeParseJson<Memory | null>(
        (row as { data_json: string }).data_json,
        null,
      ),
    )
    .filter((memory: Memory | null): memory is Memory => memory !== null);
}

export function insertTimelineEventInDb(event: TimelineEvent): void {
  const database = ensureDb();
  database
    .prepare(
      `
        INSERT INTO timeline_events(
          id, user_id, memory_id, event_type, reason, timestamp, metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      event.id,
      event.userId,
      event.memoryId,
      event.eventType,
      event.reason,
      event.timestamp,
      event.metadata ? JSON.stringify(event.metadata) : null,
    );
}

export function listTimelineEventsFromDb(userId?: string): TimelineEvent[] {
  const database = ensureDb();
  const rows = userId
    ? database
        .prepare(
          `
            SELECT id, user_id, memory_id, event_type, reason, timestamp, metadata_json
            FROM timeline_events
            WHERE user_id = ?
            ORDER BY timestamp ASC
          `,
        )
        .all(userId)
    : database
        .prepare(
          `
            SELECT id, user_id, memory_id, event_type, reason, timestamp, metadata_json
            FROM timeline_events
            ORDER BY timestamp ASC
          `,
        )
        .all();

  return rows.map((row: unknown) => {
    const typed = row as {
      id: string;
      user_id: string;
      memory_id: string;
      event_type: TimelineEvent["eventType"];
      reason: string;
      timestamp: string;
      metadata_json: string | null;
    };

    return {
      id: typed.id,
      userId: typed.user_id,
      memoryId: typed.memory_id,
      eventType: typed.event_type,
      reason: typed.reason,
      timestamp: typed.timestamp,
      ...(typed.metadata_json
        ? {
            metadata: safeParseJson<
              Record<string, string | number | boolean>
            >(typed.metadata_json, {}),
          }
        : {}),
    };
  });
}

export function insertRevisionEventInDb(event: RevisionEvent): void {
  const database = ensureDb();
  database
    .prepare(
      `
        INSERT INTO revision_events(
          id, user_id, memory_id, version, changed_at, changed_by, reason, changes_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      event.id,
      event.userId,
      event.memoryId,
      event.version,
      event.changedAt,
      event.changedBy,
      event.reason,
      JSON.stringify(event.changes),
    );
}

export function countRevisionEventsForMemoryInDb(memoryId: string): number {
  const database = ensureDb();
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM revision_events WHERE memory_id = ?")
    .get(memoryId) as { count: number } | undefined;
  return row?.count ?? 0;
}

export function listRevisionEventsFromDb(filters?: {
  userId?: string;
  memoryId?: string;
}): RevisionEvent[] {
  const database = ensureDb();
  const rows = filters?.memoryId
    ? database
        .prepare(
          `
            SELECT id, user_id, memory_id, version, changed_at, changed_by, reason, changes_json
            FROM revision_events
            WHERE memory_id = ?
            ORDER BY version ASC
          `,
        )
        .all(filters.memoryId)
    : filters?.userId
      ? database
          .prepare(
            `
              SELECT id, user_id, memory_id, version, changed_at, changed_by, reason, changes_json
              FROM revision_events
              WHERE user_id = ?
              ORDER BY changed_at ASC
            `,
          )
          .all(filters.userId)
      : database
          .prepare(
            `
              SELECT id, user_id, memory_id, version, changed_at, changed_by, reason, changes_json
              FROM revision_events
              ORDER BY changed_at ASC
            `,
          )
          .all();

  return rows.map((row: unknown) => {
    const typed = row as {
      id: string;
      user_id: string;
      memory_id: string;
      version: number;
      changed_at: string;
      changed_by: "system" | "user";
      reason: string;
      changes_json: string;
    };

    return {
      id: typed.id,
      userId: typed.user_id,
      memoryId: typed.memory_id,
      version: typed.version,
      changedAt: typed.changed_at,
      changedBy: typed.changed_by,
      reason: typed.reason,
      changes: safeParseJson(typed.changes_json, []),
    };
  });
}

import { existsSync, mkdirSync } from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { Memory, RevisionEvent, TimelineEvent } from "../memory/types";
import {
  getRuntimeStoreBackend,
  isPostgresRuntimeStore,
} from "./runtimeStoreBackend";
import { prisma } from "./prismaClient";

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

function ensureSqliteDb(): Database.Database {
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

function toTimelineEventFromDb(row: {
  id: string;
  user_id: string;
  memory_id: string;
  event_type: string;
  reason: string;
  timestamp: string;
  metadata_json: string | null;
}): TimelineEvent {
  return {
    id: row.id,
    userId: row.user_id,
    memoryId: row.memory_id,
    eventType: row.event_type as TimelineEvent["eventType"],
    reason: row.reason,
    timestamp: row.timestamp,
    ...(row.metadata_json
      ? {
          metadata: safeParseJson<Record<string, string | number | boolean>>(
            row.metadata_json,
            {},
          ),
        }
      : {}),
  };
}

function toTimelineEventFromPrisma(row: {
  id: string;
  userId: string;
  memoryId: string;
  eventType: string;
  reason: string;
  timestamp: string;
  metadataJson: string | null;
}): TimelineEvent {
  return {
    id: row.id,
    userId: row.userId,
    memoryId: row.memoryId,
    eventType: row.eventType as TimelineEvent["eventType"],
    reason: row.reason,
    timestamp: row.timestamp,
    ...(row.metadataJson
      ? {
          metadata: safeParseJson<Record<string, string | number | boolean>>(
            row.metadataJson,
            {},
          ),
        }
      : {}),
  };
}

function toRevisionEventFromDb(row: {
  id: string;
  user_id: string;
  memory_id: string;
  version: number;
  changed_at: string;
  changed_by: string;
  reason: string;
  changes_json: string;
}): RevisionEvent {
  return {
    id: row.id,
    userId: row.user_id,
    memoryId: row.memory_id,
    version: row.version,
    changedAt: row.changed_at,
    changedBy: row.changed_by as RevisionEvent["changedBy"],
    reason: row.reason,
    changes: safeParseJson(row.changes_json, []),
  };
}

function toRevisionEventFromPrisma(row: {
  id: string;
  userId: string;
  memoryId: string;
  version: number;
  changedAt: string;
  changedBy: string;
  reason: string;
  changesJson: string;
}): RevisionEvent {
  return {
    id: row.id,
    userId: row.userId,
    memoryId: row.memoryId,
    version: row.version,
    changedAt: row.changedAt,
    changedBy: row.changedBy as RevisionEvent["changedBy"],
    reason: row.reason,
    changes: safeParseJson(row.changesJson, []),
  };
}

export async function ensureRuntimeStoreDb(): Promise<void> {
  if (isPostgresRuntimeStore()) {
    await prisma.$queryRaw`SELECT 1`;
    return;
  }

  if (getRuntimeStoreBackend() === "sqlite") {
    void ensureSqliteDb();
  }
}

export async function isRuntimeStoreDbHealthy(): Promise<boolean> {
  try {
    if (isPostgresRuntimeStore()) {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    }

    if (getRuntimeStoreBackend() === "sqlite") {
      const database = ensureSqliteDb();
      database.prepare("SELECT 1 AS ok").get();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function upsertRecentMemoryInDb(
  memory: Memory,
  maxRecentPerUser: number,
): Promise<void> {
  const nowIso = memory.updatedAt || new Date().toISOString();

  if (isPostgresRuntimeStore()) {
    await prisma.recentMemory.upsert({
      where: {
        userId_memoryId: {
          userId: memory.userId,
          memoryId: memory.id,
        },
      },
      create: {
        userId: memory.userId,
        memoryId: memory.id,
        dataJson: JSON.stringify(memory),
        updatedAt: nowIso,
      },
      update: {
        dataJson: JSON.stringify(memory),
        updatedAt: nowIso,
      },
    });

    const keepRows = await prisma.recentMemory.findMany({
      where: { userId: memory.userId },
      orderBy: { updatedAt: "desc" },
      take: maxRecentPerUser,
      select: { memoryId: true },
    });

    const keepIds = keepRows.map((row) => row.memoryId);

    await prisma.recentMemory.deleteMany({
      where: {
        userId: memory.userId,
        memoryId: {
          notIn: keepIds,
        },
      },
    });
    return;
  }

  const database = ensureSqliteDb();
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

export async function listRecentMemoriesFromDb(userId?: string): Promise<Memory[]> {
  if (isPostgresRuntimeStore()) {
    const rows = await prisma.recentMemory.findMany({
      ...(userId ? { where: { userId } } : {}),
      orderBy: { updatedAt: "desc" },
      select: { dataJson: true },
    });

    return rows
      .map((row) => safeParseJson<Memory | null>(row.dataJson, null))
      .filter((memory): memory is Memory => memory !== null);
  }

  const database = ensureSqliteDb();
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
      safeParseJson<Memory | null>((row as { data_json: string }).data_json, null),
    )
    .filter((memory): memory is Memory => memory !== null);
}

export async function insertTimelineEventInDb(event: TimelineEvent): Promise<void> {
  if (isPostgresRuntimeStore()) {
    await prisma.timelineEvent.create({
      data: {
        id: event.id,
        userId: event.userId,
        memoryId: event.memoryId,
        eventType: event.eventType,
        reason: event.reason,
        timestamp: event.timestamp,
        metadataJson: event.metadata ? JSON.stringify(event.metadata) : null,
      },
    });
    return;
  }

  const database = ensureSqliteDb();
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

export async function listTimelineEventsFromDb(
  userId?: string,
): Promise<TimelineEvent[]> {
  if (isPostgresRuntimeStore()) {
    const rows = await prisma.timelineEvent.findMany({
      ...(userId ? { where: { userId } } : {}),
      orderBy: { timestamp: "asc" },
      select: {
        id: true,
        userId: true,
        memoryId: true,
        eventType: true,
        reason: true,
        timestamp: true,
        metadataJson: true,
      },
    });

    return rows.map(toTimelineEventFromPrisma);
  }

  const database = ensureSqliteDb();
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

  return rows.map((row: unknown) =>
    toTimelineEventFromDb(
      row as {
        id: string;
        user_id: string;
        memory_id: string;
        event_type: string;
        reason: string;
        timestamp: string;
        metadata_json: string | null;
      },
    ),
  );
}

export async function insertRevisionEventInDb(event: RevisionEvent): Promise<void> {
  if (isPostgresRuntimeStore()) {
    await prisma.revisionEvent.create({
      data: {
        id: event.id,
        userId: event.userId,
        memoryId: event.memoryId,
        version: event.version,
        changedAt: event.changedAt,
        changedBy: event.changedBy,
        reason: event.reason,
        changesJson: JSON.stringify(event.changes),
      },
    });
    return;
  }

  const database = ensureSqliteDb();
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

export async function countRevisionEventsForMemoryInDb(
  memoryId: string,
): Promise<number> {
  if (isPostgresRuntimeStore()) {
    return prisma.revisionEvent.count({ where: { memoryId } });
  }

  const database = ensureSqliteDb();
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM revision_events WHERE memory_id = ?")
    .get(memoryId) as { count: number } | undefined;

  return row?.count ?? 0;
}

export async function listRevisionEventsFromDb(filters?: {
  userId?: string;
  memoryId?: string;
}): Promise<RevisionEvent[]> {
  if (isPostgresRuntimeStore()) {
    const rows = await prisma.revisionEvent.findMany({
      where: {
        ...(filters?.memoryId ? { memoryId: filters.memoryId } : {}),
        ...(!filters?.memoryId && filters?.userId ? { userId: filters.userId } : {}),
      },
      orderBy: filters?.memoryId
        ? { version: "asc" }
        : {
            changedAt: "asc",
          },
      select: {
        id: true,
        userId: true,
        memoryId: true,
        version: true,
        changedAt: true,
        changedBy: true,
        reason: true,
        changesJson: true,
      },
    });

    return rows.map(toRevisionEventFromPrisma);
  }

  const database = ensureSqliteDb();
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

  return rows.map((row: unknown) =>
    toRevisionEventFromDb(
      row as {
        id: string;
        user_id: string;
        memory_id: string;
        version: number;
        changed_at: string;
        changed_by: string;
        reason: string;
        changes_json: string;
      },
    ),
  );
}

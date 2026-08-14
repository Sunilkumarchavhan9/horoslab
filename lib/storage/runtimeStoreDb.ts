import type { Memory, RevisionEvent, TimelineEvent } from "../memory/types";
import { normalizeOrgId, recentMemoryUserFilter } from "../auth/orgScope";
import { prisma } from "./prismaClient";

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
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

function toStoredMemoryEmbeddingFromPrisma(row: {
  userId: string;
  memoryId: string;
  model: string;
  embeddingJson: string;
  updatedAt: string;
}): {
  userId: string;
  memoryId: string;
  model: string;
  embedding: number[];
  updatedAt: string;
} | null {
  const embedding = safeParseJson<number[]>(row.embeddingJson, []);
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return null;
  }

  return {
    userId: row.userId,
    memoryId: row.memoryId,
    model: row.model,
    embedding,
    updatedAt: row.updatedAt,
  };
}

export async function ensureRuntimeStoreDb(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

export async function isRuntimeStoreDbHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function upsertRecentMemoryInDb(
  memory: Memory,
  maxRecentPerUser: number,
  orgId?: string,
): Promise<void> {
  const nowIso = memory.updatedAt || new Date().toISOString();
  const scopedOrgId = normalizeOrgId(orgId) ?? null;
  const pruneFilter = scopedOrgId
    ? recentMemoryUserFilter({ userId: memory.userId, orgId: scopedOrgId })
    : { userId: memory.userId, orgId: null as string | null };

  await prisma.recentMemory.upsert({
    where: {
      userId_memoryId: {
        userId: memory.userId,
        memoryId: memory.id,
      },
    },
    create: {
      userId: memory.userId,
      orgId: scopedOrgId,
      memoryId: memory.id,
      dataJson: JSON.stringify(memory),
      updatedAt: nowIso,
    },
    update: {
      orgId: scopedOrgId,
      dataJson: JSON.stringify(memory),
      updatedAt: nowIso,
    },
  });

  const keepRows = await prisma.recentMemory.findMany({
    where: pruneFilter,
    orderBy: { updatedAt: "desc" },
    take: maxRecentPerUser,
    select: { memoryId: true },
  });

  await prisma.recentMemory.deleteMany({
    where: {
      ...pruneFilter,
      memoryId: {
        notIn: keepRows.map((row) => row.memoryId),
      },
    },
  });
}

export async function listRecentMemoriesFromDb(
  userId?: string,
  orgId?: string,
): Promise<Memory[]> {
  const scopedOrgId = normalizeOrgId(orgId);
  const where = userId
    ? recentMemoryUserFilter({ userId, orgId: scopedOrgId })
    : scopedOrgId
      ? { orgId: scopedOrgId }
      : undefined;

  const rows = await prisma.recentMemory.findMany({
    ...(where ? { where } : {}),
    orderBy: { updatedAt: "desc" },
    select: { dataJson: true },
  });

  return rows
    .map((row) => safeParseJson<Memory | null>(row.dataJson, null))
    .filter((memory): memory is Memory => memory !== null);
}

export async function insertTimelineEventInDb(event: TimelineEvent): Promise<void> {
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
}

export async function listTimelineEventsFromDb(
  userId?: string,
): Promise<TimelineEvent[]> {
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

export async function insertRevisionEventInDb(event: RevisionEvent): Promise<void> {
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
}

export async function countRevisionEventsForMemoryInDb(
  memoryId: string,
): Promise<number> {
  return prisma.revisionEvent.count({ where: { memoryId } });
}

export async function upsertMemoryEmbeddingInDb(
  embedding: {
    userId: string;
    memoryId: string;
    model: string;
    embedding: number[];
    updatedAt: string;
  },
  orgId?: string,
): Promise<void> {
  const scopedOrgId = normalizeOrgId(orgId) ?? null;

  await prisma.memoryEmbedding.upsert({
    where: {
      userId_memoryId: {
        userId: embedding.userId,
        memoryId: embedding.memoryId,
      },
    },
    create: {
      userId: embedding.userId,
      orgId: scopedOrgId,
      memoryId: embedding.memoryId,
      model: embedding.model,
      embeddingJson: JSON.stringify(embedding.embedding),
      updatedAt: embedding.updatedAt,
    },
    update: {
      orgId: scopedOrgId,
      model: embedding.model,
      embeddingJson: JSON.stringify(embedding.embedding),
      updatedAt: embedding.updatedAt,
    },
  });
}

export async function getMemoryEmbeddingFromDb(
  userId: string,
  memoryId: string,
  orgId?: string,
): Promise<{
  userId: string;
  memoryId: string;
  model: string;
  embedding: number[];
  updatedAt: string;
} | null> {
  const scopedOrgId = normalizeOrgId(orgId);
  const filter = recentMemoryUserFilter({ userId, orgId: scopedOrgId });
  const row = await prisma.memoryEmbedding.findFirst({
    where: {
      userId: filter.userId,
      memoryId,
      ...(filter.orgId ? { orgId: filter.orgId } : { orgId: null }),
    },
    select: {
      userId: true,
      memoryId: true,
      model: true,
      embeddingJson: true,
      updatedAt: true,
    },
  });

  return row ? toStoredMemoryEmbeddingFromPrisma(row) : null;
}

export async function listMemoryEmbeddingsFromDb(
  userId: string,
  orgId?: string,
): Promise<
  Array<{
    userId: string;
    memoryId: string;
    model: string;
    embedding: number[];
    updatedAt: string;
  }>
> {
  const scopedOrgId = normalizeOrgId(orgId);
  const filter = recentMemoryUserFilter({ userId, orgId: scopedOrgId });
  const rows = await prisma.memoryEmbedding.findMany({
    where: {
      userId: filter.userId,
      ...(filter.orgId ? { orgId: filter.orgId } : { orgId: null }),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      userId: true,
      memoryId: true,
      model: true,
      embeddingJson: true,
      updatedAt: true,
    },
  });

  return rows
    .map((row) => toStoredMemoryEmbeddingFromPrisma(row))
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function deleteMemoryEmbeddingFromDb(
  userId: string,
  memoryId: string,
  orgId?: string,
): Promise<void> {
  const scopedOrgId = normalizeOrgId(orgId);
  const filter = recentMemoryUserFilter({ userId, orgId: scopedOrgId });

  await prisma.memoryEmbedding.deleteMany({
    where: {
      userId: filter.userId,
      memoryId,
      ...(filter.orgId ? { orgId: filter.orgId } : { orgId: null }),
    },
  });
}

export async function listRevisionEventsFromDb(filters?: {
  userId?: string;
  memoryId?: string;
}): Promise<RevisionEvent[]> {
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

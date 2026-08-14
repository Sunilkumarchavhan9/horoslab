import { prisma } from "../storage/prismaClient";

export type VoiceSessionSource = "pipecat";
export type VoiceSessionStatus = "active" | "ended";

export interface VoiceSessionRecord {
  sessionId: string;
  userId: string;
  source: VoiceSessionSource;
  status: VoiceSessionStatus;
  workspace?: string;
  project?: string;
  threadId?: string;
  startedAt: string;
  updatedAt: string;
  lastChunkAt?: string;
  endedAt?: string;
  chunkCount: number;
  totalCharacters: number;
  metadata?: Record<string, string>;
}

export interface StartVoiceSessionInput {
  sessionId: string;
  userId: string;
  source: VoiceSessionSource;
  workspace?: string;
  project?: string;
  threadId?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordVoiceChunkInput {
  sessionId: string;
  userId: string;
  chunkCharacters: number;
  workspace?: string;
  project?: string;
  threadId?: string;
}

export interface EndVoiceSessionInput {
  sessionId: string;
  userId: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  if (!metadata) {
    return undefined;
  }

  const pairs = Object.entries(metadata)
    .map(([key, value]) => {
      if (typeof key !== "string" || key.trim().length === 0) {
        return null;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [key.trim(), String(value)] as const;
      }

      return null;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  if (pairs.length === 0) {
    return undefined;
  }

  return Object.fromEntries(pairs);
}

function parseMetadata(raw: string | null): Record<string, string> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed as Record<string, unknown>)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string");
      return entries.length > 0 ? Object.fromEntries(entries) : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function toVoiceSessionRecord(row: {
  sessionId: string;
  userId: string;
  source: string;
  status: string;
  workspace: string | null;
  project: string | null;
  threadId: string | null;
  startedAt: string;
  updatedAt: string;
  lastChunkAt: string | null;
  endedAt: string | null;
  chunkCount: number;
  totalCharacters: number;
  metadataJson: string | null;
}): VoiceSessionRecord {
  return {
    sessionId: row.sessionId,
    userId: row.userId,
    source: row.source as VoiceSessionSource,
    status: row.status as VoiceSessionStatus,
    startedAt: row.startedAt,
    updatedAt: row.updatedAt,
    chunkCount: row.chunkCount,
    totalCharacters: row.totalCharacters,
    ...(row.workspace ? { workspace: row.workspace } : {}),
    ...(row.project ? { project: row.project } : {}),
    ...(row.threadId ? { threadId: row.threadId } : {}),
    ...(row.lastChunkAt ? { lastChunkAt: row.lastChunkAt } : {}),
    ...(row.endedAt ? { endedAt: row.endedAt } : {}),
    ...(parseMetadata(row.metadataJson) ? { metadata: parseMetadata(row.metadataJson) } : {}),
  };
}

export async function getVoiceSession(
  userId: string,
  sessionId: string,
): Promise<VoiceSessionRecord | null> {
  const row = await prisma.voiceSession.findUnique({
    where: { userId_sessionId: { userId, sessionId } },
  });
  return row ? toVoiceSessionRecord(row) : null;
}

export async function startVoiceSession(
  input: StartVoiceSessionInput,
): Promise<VoiceSessionRecord> {
  const timestamp = nowIso();
  const existing = await getVoiceSession(input.userId, input.sessionId);
  const sanitizedMetadata = sanitizeMetadata(input.metadata);
  const metadata = {
    ...(existing?.metadata ?? {}),
    ...(sanitizedMetadata ?? {}),
  };
  const row = await prisma.voiceSession.upsert({
    where: { userId_sessionId: { userId: input.userId, sessionId: input.sessionId } },
    create: {
      sessionId: input.sessionId,
      userId: input.userId,
      source: input.source,
      status: "active",
      startedAt: timestamp,
      updatedAt: timestamp,
      chunkCount: 0,
      totalCharacters: 0,
      workspace: input.workspace ?? null,
      project: input.project ?? null,
      threadId: input.threadId ?? null,
      metadataJson: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
    },
    update: {
      source: input.source,
      status: "active",
      workspace: input.workspace ?? existing?.workspace ?? null,
      project: input.project ?? existing?.project ?? null,
      threadId: input.threadId ?? existing?.threadId ?? null,
      metadataJson: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
      updatedAt: timestamp,
    },
  });
  return toVoiceSessionRecord(row);
}

export async function recordVoiceChunk(
  input: RecordVoiceChunkInput,
): Promise<VoiceSessionRecord | null> {
  const existing = await getVoiceSession(input.userId, input.sessionId);
  if (!existing) return null;
  const timestamp = nowIso();
  const row = await prisma.voiceSession.update({
    where: { userId_sessionId: { userId: input.userId, sessionId: input.sessionId } },
    data: {
      status: "active",
      chunkCount: existing.chunkCount + 1,
      totalCharacters: existing.totalCharacters + Math.max(0, input.chunkCharacters),
      updatedAt: timestamp,
      lastChunkAt: timestamp,
      workspace: input.workspace ?? existing.workspace ?? null,
      project: input.project ?? existing.project ?? null,
      threadId: input.threadId ?? existing.threadId ?? null,
    },
  });
  return toVoiceSessionRecord(row);
}

export async function endVoiceSession(
  input: EndVoiceSessionInput,
): Promise<VoiceSessionRecord | null> {
  const existing = await getVoiceSession(input.userId, input.sessionId);
  if (!existing) return null;
  const timestamp = nowIso();
  const row = await prisma.voiceSession.update({
    where: { userId_sessionId: { userId: input.userId, sessionId: input.sessionId } },
    data: {
      status: "ended",
      updatedAt: timestamp,
      endedAt: timestamp,
    },
  });
  return toVoiceSessionRecord(row);
}

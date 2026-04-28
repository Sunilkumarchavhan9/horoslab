import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { withFileLock } from "../memory/jsonStoreLock";

const DATA_DIR = path.join(process.cwd(), "data");
const VOICE_SESSION_STORE_PATH = path.join(DATA_DIR, "voice-sessions.json");

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

interface VoiceSessionStore {
  sessions: VoiceSessionRecord[];
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

function ensureVoiceSessionStore(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(VOICE_SESSION_STORE_PATH)) {
    const initial: VoiceSessionStore = { sessions: [] };
    writeFileSync(VOICE_SESSION_STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
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

function readVoiceSessionStore(): VoiceSessionStore {
  ensureVoiceSessionStore();

  try {
    const raw = readFileSync(VOICE_SESSION_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { sessions?: unknown }).sessions)
    ) {
      return parsed as VoiceSessionStore;
    }
  } catch {
    // Fall through to default.
  }

  return { sessions: [] };
}

function writeVoiceSessionStore(store: VoiceSessionStore): void {
  ensureVoiceSessionStore();
  writeFileSync(VOICE_SESSION_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function getVoiceSession(
  userId: string,
  sessionId: string,
): VoiceSessionRecord | null {
  const store = readVoiceSessionStore();
  return (
    store.sessions.find(
      (session) => session.userId === userId && session.sessionId === sessionId,
    ) ?? null
  );
}

export async function startVoiceSession(
  input: StartVoiceSessionInput,
): Promise<VoiceSessionRecord> {
  return withFileLock(VOICE_SESSION_STORE_PATH, async () => {
    const store = readVoiceSessionStore();
    const existingIndex = store.sessions.findIndex(
      (session) =>
        session.userId === input.userId && session.sessionId === input.sessionId,
    );
    const timestamp = nowIso();
    const sanitizedMetadata = sanitizeMetadata(input.metadata);

    if (existingIndex >= 0) {
      const existing = store.sessions[existingIndex];
      const updated: VoiceSessionRecord = {
        ...existing,
        source: input.source,
        status: "active",
        workspace: input.workspace ?? existing.workspace,
        project: input.project ?? existing.project,
        threadId: input.threadId ?? existing.threadId,
        metadata: {
          ...(existing.metadata ?? {}),
          ...(sanitizedMetadata ?? {}),
        },
        updatedAt: timestamp,
      };
      store.sessions[existingIndex] = updated;
      writeVoiceSessionStore(store);
      return updated;
    }

    const created: VoiceSessionRecord = {
      sessionId: input.sessionId,
      userId: input.userId,
      source: input.source,
      status: "active",
      startedAt: timestamp,
      updatedAt: timestamp,
      chunkCount: 0,
      totalCharacters: 0,
      ...(input.workspace ? { workspace: input.workspace } : {}),
      ...(input.project ? { project: input.project } : {}),
      ...(input.threadId ? { threadId: input.threadId } : {}),
      ...(sanitizedMetadata ? { metadata: sanitizedMetadata } : {}),
    };

    store.sessions.push(created);
    writeVoiceSessionStore(store);
    return created;
  });
}

export async function recordVoiceChunk(
  input: RecordVoiceChunkInput,
): Promise<VoiceSessionRecord | null> {
  return withFileLock(VOICE_SESSION_STORE_PATH, async () => {
    const store = readVoiceSessionStore();
    const existingIndex = store.sessions.findIndex(
      (session) =>
        session.userId === input.userId && session.sessionId === input.sessionId,
    );

    if (existingIndex < 0) {
      return null;
    }

    const existing = store.sessions[existingIndex];
    const timestamp = nowIso();
    const updated: VoiceSessionRecord = {
      ...existing,
      status: "active",
      chunkCount: existing.chunkCount + 1,
      totalCharacters: existing.totalCharacters + Math.max(0, input.chunkCharacters),
      updatedAt: timestamp,
      lastChunkAt: timestamp,
      workspace: input.workspace ?? existing.workspace,
      project: input.project ?? existing.project,
      threadId: input.threadId ?? existing.threadId,
    };

    store.sessions[existingIndex] = updated;
    writeVoiceSessionStore(store);
    return updated;
  });
}

export async function endVoiceSession(
  input: EndVoiceSessionInput,
): Promise<VoiceSessionRecord | null> {
  return withFileLock(VOICE_SESSION_STORE_PATH, async () => {
    const store = readVoiceSessionStore();
    const existingIndex = store.sessions.findIndex(
      (session) =>
        session.userId === input.userId && session.sessionId === input.sessionId,
    );

    if (existingIndex < 0) {
      return null;
    }

    const existing = store.sessions[existingIndex];
    const timestamp = nowIso();
    const ended: VoiceSessionRecord = {
      ...existing,
      status: "ended",
      updatedAt: timestamp,
      endedAt: timestamp,
    };

    store.sessions[existingIndex] = ended;
    writeVoiceSessionStore(store);
    return ended;
  });
}

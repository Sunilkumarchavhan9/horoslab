import type { MemoryStoreSearchResult } from "../adapters/adapters";
import { getMemoryStoreAdapter } from "../adapters/registry";
import { getRecentMemories } from "./recentMemoryStore";
import { toInternalMemory } from "../workflows/ingestShared";
import type { Memory, MemoryStatus, MemoryType } from "./types";

export interface ListMemoryInput {
  userId: string;
  orgId?: string;
  status?: MemoryStatus;
  type?: MemoryType;
  limit?: number;
}

export interface ListMemoryResult {
  memories: Memory[];
  count: number;
}

const PROVIDER_ENRICHMENT_TIMEOUT_MS = 1200;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error("provider_enrichment_timeout"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function listMemories(input: ListMemoryInput): Promise<ListMemoryResult> {
  const effectiveLimit = Math.min(Math.max(input.limit ?? 50, 1), 200);

  const localRecent = await getRecentMemories(input.userId, input.orgId);

  // Base list source: local recent memories is always available for each user.
  // This keeps /api/memory/list stable even if an external provider rejects empty queries.
  const uniqueById = new Map<string, Memory>(
    localRecent.map((memory) => [memory.id, memory]),
  );

  // Optional enrichment from provider search.
  // Some providers reject empty queries; swallow provider errors and keep local results.
  try {
    const memoryStore = getMemoryStoreAdapter();
    const candidates = await withTimeout(
      memoryStore.searchMemory({
        userId: input.userId,
        query: "recent memory context",
        topK: 200,
      }),
      PROVIDER_ENRICHMENT_TIMEOUT_MS,
    );

    const mapped = candidates
      .map((result) => ({
        result,
        memory: toInternalMemory(result, input.userId),
      }))
      .filter(
        (item): item is { result: MemoryStoreSearchResult; memory: Memory } =>
          item.memory !== null,
      );

    for (const { result, memory } of mapped) {
      const ownerFromMetadata =
        result.metadata &&
        typeof result.metadata === "object" &&
        typeof result.metadata.userId === "string"
          ? result.metadata.userId
          : result.metadata &&
              typeof result.metadata === "object" &&
              typeof result.metadata.user_id === "string"
            ? result.metadata.user_id
            : undefined;

      if (ownerFromMetadata && ownerFromMetadata !== input.userId) {
        continue;
      }

      const orgFromMetadata =
        result.metadata &&
        typeof result.metadata === "object" &&
        typeof result.metadata.orgId === "string"
          ? result.metadata.orgId
          : result.metadata &&
              typeof result.metadata === "object" &&
              typeof result.metadata.org_id === "string"
            ? result.metadata.org_id
            : undefined;

      if (input.orgId && orgFromMetadata && orgFromMetadata !== input.orgId) {
        continue;
      }

      if (input.orgId && !orgFromMetadata && !memory.orgId) {
        continue;
      }

      if (input.orgId && !orgFromMetadata && memory.orgId !== input.orgId) {
        continue;
      }

      uniqueById.set(memory.id, memory);
    }
  } catch {
    // no-op: localRecent fallback remains the source of truth for list endpoint stability.
  }

  const filtered = Array.from(uniqueById.values()).filter((memory) => {
    if (input.status && memory.status !== input.status) {
      return false;
    }

    if (input.type && memory.type !== input.type) {
      return false;
    }

    return true;
  });
  filtered.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const memories = filtered.slice(0, effectiveLimit);

  return {
    memories,
    count: memories.length,
  };
}

export async function getMemoryForUser(input: {
  memoryId: string;
  userId: string;
}): Promise<Memory | null> {
  const raw = await getMemoryStoreAdapter().getMemoryById({ id: input.memoryId });
  if (!raw) {
    return null;
  }

  const memory = toInternalMemory(raw, input.userId);
  if (!memory) {
    return null;
  }

  const ownerFromMetadata =
    raw.metadata &&
    typeof raw.metadata === "object" &&
    typeof raw.metadata.userId === "string"
      ? raw.metadata.userId
      : raw.metadata &&
          typeof raw.metadata === "object" &&
          typeof raw.metadata.user_id === "string"
        ? raw.metadata.user_id
        : undefined;

  if (ownerFromMetadata && ownerFromMetadata !== input.userId) {
    return null;
  }

  return memory;
}

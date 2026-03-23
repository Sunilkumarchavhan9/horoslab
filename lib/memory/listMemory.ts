import {
  getMemoryById,
  searchMemoryFromMem0,
  type Mem0SearchResult,
} from "../integrations/mem0";
import { toInternalMemory } from "../workflows/ingestShared";
import type { Memory, MemoryStatus, MemoryType } from "./types";

export interface ListMemoryInput {
  userId: string;
  status?: MemoryStatus;
  type?: MemoryType;
  limit?: number;
}

export interface ListMemoryResult {
  memories: Memory[];
  count: number;
}

export async function listMemories(input: ListMemoryInput): Promise<ListMemoryResult> {
  const effectiveLimit = Math.min(Math.max(input.limit ?? 50, 1), 200);

  const candidates = await searchMemoryFromMem0({
    userId: input.userId,
    query: "",
    topK: 200,
  });

  const mapped = candidates
    .map((result) => ({
      result,
      memory: toInternalMemory(result, input.userId),
    }))
    .filter(
      (item): item is { result: Mem0SearchResult; memory: Memory } =>
        item.memory !== null,
    );

  const filtered = mapped.filter(({ result, memory }) => {
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
      return false;
    }

    if (input.status && memory.status !== input.status) {
      return false;
    }

    if (input.type && memory.type !== input.type) {
      return false;
    }

    return true;
  });

  const unique = Array.from(
    new Map(filtered.map(({ memory }) => [memory.id, memory])).values(),
  );

  unique.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const memories = unique.slice(0, effectiveLimit);

  return {
    memories,
    count: memories.length,
  };
}

export async function getMemoryForUser(input: {
  memoryId: string;
  userId: string;
}): Promise<Memory | null> {
  const raw = await getMemoryById({ id: input.memoryId });
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

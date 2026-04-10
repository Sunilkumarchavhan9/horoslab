import MemoryClient, { type Memory as Mem0Memory } from "mem0ai";
import type { MemoryStoreAdapter, MemoryStoreSearchResult } from "./adapters";
import type { Memory } from "../memory/types";

type AddPayload = {
  user_id: string;
  text: string;
  metadata?: Record<string, unknown>;
};

type Mem0AddResponseItem = {
  id?: string | null;
  event_id?: string | null;
  status?: string;
  memory?: string | null;
  message?: string;
};

type SearchPayload = {
  user_id: string;
  query: string;
  top_k?: number;
};

function mapMem0Memory(item: Mem0Memory): MemoryStoreSearchResult {
  return {
    id: item.id,
    score: item.score,
    memory: item.memory ?? item.data?.memory,
    metadata: (item.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

export class Mem0MemoryStoreAdapter implements MemoryStoreAdapter {
  private clientInstance: MemoryClient | null = null;

  private getClient(): MemoryClient {
    if (!this.clientInstance) {
      this.clientInstance = new MemoryClient({
        apiKey: requireEnv("MEM0_API_KEY"),
      });
    }

    return this.clientInstance;
  }

  async saveMemory(input: {
    memory: Memory;
  }): Promise<{ id: string }> {
    const payload: AddPayload = {
      user_id: input.memory.userId,
      text: input.memory.content,
      metadata: {
        memoryId: input.memory.id,
        type: input.memory.type,
        summary: input.memory.summary,
        importanceScore: input.memory.importanceScore,
        confidence: input.memory.confidence,
        source: input.memory.source,
        status: input.memory.status,
        createdAt: input.memory.createdAt,
        updatedAt: input.memory.updatedAt,
        evidenceCount: input.memory.evidenceCount,
        developerSignals: input.memory.developerSignals,
      },
    };

    const created = await this.getClient().add(
      [{ role: "user", content: payload.text }],
      {
        user_id: payload.user_id,
        metadata: payload.metadata,
      },
    );

    const first = created?.[0] as Mem0AddResponseItem | undefined;
    const fallbackMemoryId =
      typeof payload.metadata?.memoryId === "string"
        ? payload.metadata.memoryId
        : undefined;
    const resolvedId = first?.id ?? first?.event_id ?? fallbackMemoryId;

    if (!resolvedId) {
      throw new Error("Mem0 add() returned neither id nor event_id");
    }

    return {
      id: resolvedId,
    };
  }

  async searchMemory(input: {
    userId: string;
    query: string;
    topK?: number;
  }): Promise<MemoryStoreSearchResult[]> {
    const payload: SearchPayload = {
      user_id: input.userId,
      query: input.query,
      top_k: input.topK ?? 10,
    };

    const found = await this.getClient().search(payload.query, {
      user_id: payload.user_id,
      top_k: payload.top_k,
    });

    return found.map(mapMem0Memory);
  }

  async getMemoryById(input: {
    id: string;
  }): Promise<MemoryStoreSearchResult | null> {
    const item = await this.getClient().get(input.id);
    if (!item?.id) {
      return null;
    }

    return mapMem0Memory(item);
  }
}

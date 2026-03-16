// lib/integrations/mem0.ts
import MemoryClient, { type Memory as Mem0Memory } from "mem0ai";
import type { Memory } from "../memory/types";

// Hint: keep this loose first; tighten after real Mem0 response shape is known.
export interface Mem0SearchResult {
  id: string;
  score?: number;
  memory?: string;
  metadata?: Record<string, unknown>;
}

export interface SaveMemoryInput {
  memory: Memory;
}

export interface SearchMemoryInput {
  userId: string;
  query: string;
  topK?: number;
}

export interface GetMemoryInput {
  id: string;
}

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

function mapMem0Memory(item: Mem0Memory): Mem0SearchResult {
  return {
    id: item.id,
    score: item.score,
    memory: item.memory ?? item.data?.memory,
    metadata: (item.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

// Hint: fail early if API key missing.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);

  return value;
}

let clientInstance: MemoryClient | null = null;

// Hint: one place to initialize SDK client.
function getMem0Client() {
  if (!clientInstance) {
    clientInstance = new MemoryClient({
      apiKey: requireEnv("MEM0_API_KEY"),
    });
  }

  return {
    async add(payload: AddPayload): Promise<{ id: string }> {
      const created = await clientInstance!.add(
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
    },

    async search(payload: SearchPayload): Promise<Mem0SearchResult[]> {
      const found = await clientInstance!.search(payload.query, {
        user_id: payload.user_id,
        top_k: payload.top_k ?? 10,
      });
      return found.map(mapMem0Memory);
    },

    async get(id: string): Promise<Mem0SearchResult | null> {
      const item = await clientInstance!.get(id);
      if (!item?.id) return null;
      return mapMem0Memory(item);
    },
  };
}

// Hint: map your internal Memory -> Mem0 payload shape.
export async function saveMemoryToMem0(input: SaveMemoryInput): Promise<{ id: string }> {
  const client = getMem0Client();

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
    },
  };
  const res = await client.add(payload);
  return {
    id: res.id 
  };
}

// Hint: this should only fetch candidates, not rerank.
export async function searchMemoryFromMem0(input: SearchMemoryInput): Promise<Mem0SearchResult[]> {
  const client = getMem0Client();

  const payload: SearchPayload = {
    user_id: input.userId,
    query: input.query,
    top_k: input.topK ?? 10,
  };

  const res = await client.search(payload);
  return res;
}

export async function getMemoryById(input: GetMemoryInput): Promise<Mem0SearchResult | null> {
  const client = getMem0Client();
  const res = await client.get(input.id);
  return res;
}

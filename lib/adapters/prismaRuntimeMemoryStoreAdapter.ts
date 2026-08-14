import type { MemoryStoreAdapter, MemoryStoreSearchResult } from "./adapters";
import type { Memory } from "../memory/types";
import { getRecentMemories, listRecentMemories, upsertRecentMemory } from "../memory/recentMemoryStore";
import {
  computeHybridScore,
  cosineSimilarity,
  embedText,
  isEmbeddingsEnabled,
} from "../memory/embeddings";
import { listMemoryEmbeddings } from "../memory/memoryEmbeddingStore";
import { scheduleMemoryEmbedding } from "../memory/persistMemoryEmbedding";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function computeLexicalSimilarity(query: string, memory: string): number {
  const queryTokens = new Set(tokenize(query));
  const memoryTokens = new Set(tokenize(memory));

  if (queryTokens.size === 0 || memoryTokens.size === 0) {
    return 0.5;
  }

  let intersection = 0;
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...queryTokens, ...memoryTokens]).size;
  return union === 0 ? 0.5 : intersection / union;
}

function toSearchResult(
  memory: Memory,
  query: string,
  score?: number,
): MemoryStoreSearchResult {
  return {
    id: memory.id,
    score: score ?? computeLexicalSimilarity(query, memory.content),
    memory: memory.content,
    metadata: {
      memoryId: memory.id,
      userId: memory.userId,
      orgId: memory.orgId,
      type: memory.type,
      summary: memory.summary,
      importanceScore: memory.importanceScore,
      confidence: memory.confidence,
      source: memory.source,
      status: memory.status,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      evidenceCount: memory.evidenceCount,
      contractVersion: memory.contractVersion,
      contractCategory: memory.contractCategory,
      developerSignals: memory.developerSignals,
      operationalTags: memory.operationalTags,
      companyBrainType: memory.companyBrainType,
      traceProof: memory.traceProof,
      freshness: memory.freshness,
      conflict: memory.conflict,
      graph: memory.graph,
      entities: memory.entities,
      relations: memory.relations,
      proofQuality: memory.proofQuality,
      sourceRef: memory.sourceRef,
      files: memory.files,
    },
  };
}

async function scoreMemoriesForQuery(input: {
  userId: string;
  query: string;
  memories: Memory[];
}): Promise<MemoryStoreSearchResult[]> {
  const lexicalResults = input.memories.map((memory) => {
    const lexicalScore = computeLexicalSimilarity(input.query, memory.content);
    return {
      memory,
      lexicalScore,
      result: toSearchResult(memory, input.query, lexicalScore),
    };
  });

  if (!isEmbeddingsEnabled()) {
    return lexicalResults
      .map((item) => item.result)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const storedEmbeddings = await listMemoryEmbeddings(input.userId);
  const embeddingByMemoryId = new Map(
    storedEmbeddings.map((item) => [item.memoryId, item.embedding]),
  );

  if (embeddingByMemoryId.size === 0) {
    return lexicalResults
      .map((item) => item.result)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  let queryEmbedding: number[] | null = null;
  try {
    queryEmbedding = await embedText(input.query);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(
      `[memory.retrieval] query embedding failed for user=${input.userId}; using lexical scores. ${message}`,
    );
  }

  return lexicalResults
    .map((item) => {
      const memoryEmbedding = embeddingByMemoryId.get(item.memory.id);
      const vectorScore =
        queryEmbedding && memoryEmbedding
          ? cosineSimilarity(queryEmbedding, memoryEmbedding)
          : undefined;

      return {
        ...item.result,
        score: computeHybridScore({
          lexicalScore: item.lexicalScore,
          vectorScore,
        }),
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export class PrismaRuntimeMemoryStoreAdapter implements MemoryStoreAdapter {
  async saveMemory(input: { memory: Memory }): Promise<{ id: string }> {
    await upsertRecentMemory(input.memory, input.memory.orgId ?? undefined);
    scheduleMemoryEmbedding(input.memory);
    return { id: input.memory.id };
  }

  async searchMemory(input: {
    userId: string;
    query: string;
    topK?: number;
  }): Promise<MemoryStoreSearchResult[]> {
    const recent = await getRecentMemories(input.userId);
    const results = await scoreMemoriesForQuery({
      userId: input.userId,
      query: input.query,
      memories: recent,
    });

    return results.slice(0, input.topK ?? 10);
  }

  async getMemoryById(input: { id: string }): Promise<MemoryStoreSearchResult | null> {
    const recent = await listRecentMemories();
    const memory = recent.find((item) => item.id === input.id);
    if (!memory) {
      return null;
    }

    return toSearchResult(memory, memory.content);
  }
}

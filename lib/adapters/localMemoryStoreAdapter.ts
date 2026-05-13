import type { MemoryStoreAdapter, MemoryStoreSearchResult } from "./adapters";
import type { Memory } from "../memory/types";
import { getRecentMemories, listRecentMemories, upsertRecentMemory } from "../memory/recentMemoryStore";

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

function toSearchResult(memory: Memory, query: string): MemoryStoreSearchResult {
  return {
    id: memory.id,
    score: computeLexicalSimilarity(query, memory.content),
    memory: memory.content,
    metadata: {
      memoryId: memory.id,
      userId: memory.userId,
      type: memory.type,
      summary: memory.summary,
      importanceScore: memory.importanceScore,
      confidence: memory.confidence,
      source: memory.source,
      status: memory.status,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      evidenceCount: memory.evidenceCount,
      developerSignals: memory.developerSignals,
    },
  };
}

export class LocalMemoryStoreAdapter implements MemoryStoreAdapter {
  async saveMemory(input: { memory: Memory }): Promise<{ id: string }> {
    await upsertRecentMemory(input.memory);
    return { id: input.memory.id };
  }

  async searchMemory(input: {
    userId: string;
    query: string;
    topK?: number;
  }): Promise<MemoryStoreSearchResult[]> {
    const recent = await getRecentMemories(input.userId);
    const results = recent
      .map((memory) => toSearchResult(memory, input.query))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

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

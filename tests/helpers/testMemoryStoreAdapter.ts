import type { MemoryStoreAdapter, MemoryStoreSearchResult } from "../../lib/adapters/adapters";
import type { Memory } from "../../lib/memory/types";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function lexicalScore(query: string, memory: string): number {
  const queryTokens = tokenize(query);
  const memoryTokens = tokenize(memory);

  if (queryTokens.size === 0 || memoryTokens.size === 0) {
    return 0.5;
  }

  let overlap = 0;
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / new Set([...queryTokens, ...memoryTokens]).size;
}

export function memoryToTestSearchResult(
  memory: Memory,
  score?: number,
): MemoryStoreSearchResult {
  return {
    id: memory.id,
    memory: memory.content,
    score: score ?? 1,
    metadata: {
      memoryId: memory.id,
      userId: memory.userId,
      orgId: memory.orgId,
      type: memory.type,
      summary: memory.summary,
      importanceScore: String(memory.importanceScore),
      confidence: String(memory.confidence),
      source: memory.source,
      status: memory.status,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      evidenceCount: String(memory.evidenceCount),
      contractVersion: memory.contractVersion,
      contractCategory: memory.contractCategory,
      developerSignals: memory.developerSignals,
      operationalTags: memory.operationalTags,
      companyBrainType: memory.companyBrainType,
      sourceRef: memory.sourceRef,
      traceProof: memory.traceProof,
      freshness: memory.freshness,
      conflict: memory.conflict,
      graph: memory.graph,
      entities: memory.entities,
      relations: memory.relations,
      proofQuality: memory.proofQuality,
      files: memory.files,
    },
  };
}

export class TestMemoryStoreAdapter implements MemoryStoreAdapter {
  private readonly rows = new Map<string, MemoryStoreSearchResult>();

  clear(): void {
    this.rows.clear();
  }

  seed(rows: MemoryStoreSearchResult[]): void {
    for (const row of rows) {
      this.rows.set(row.id, row);
    }
  }

  async saveMemory(input: { memory: Memory }): Promise<{ id: string }> {
    this.rows.set(input.memory.id, memoryToTestSearchResult(input.memory));
    return { id: input.memory.id };
  }

  async searchMemory(input: {
    userId: string;
    query: string;
    topK?: number;
  }): Promise<MemoryStoreSearchResult[]> {
    return [...this.rows.values()]
      .filter((row) => !row.metadata?.userId || row.metadata.userId === input.userId)
      .map((row) => ({
        ...row,
        score:
          typeof row.score === "number"
            ? row.score
            : lexicalScore(input.query, row.memory ?? ""),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, input.topK ?? 10);
  }

  async getMemoryById(input: { id: string }): Promise<MemoryStoreSearchResult | null> {
    return this.rows.get(input.id) ?? null;
  }
}

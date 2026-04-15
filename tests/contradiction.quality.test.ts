import { beforeEach, describe, expect, it, vi } from "vitest";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

const mem0Store: Array<{
  id: string;
  memory?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}> = [];

vi.mock("../lib/integrations/mem0", () => ({
  saveMemoryToMem0: vi.fn(async ({ memory }) => {
    const idx = mem0Store.findIndex((x) => x.metadata?.memoryId === memory.id);
    const row = {
      id: memory.id,
      memory: memory.content,
      score: 1,
      metadata: {
        memoryId: memory.id,
        userId: memory.userId,
        type: memory.type,
        summary: memory.summary,
        importanceScore: String(memory.importanceScore),
        confidence: String(memory.confidence),
        source: memory.source,
        status: memory.status,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt,
        evidenceCount: String(memory.evidenceCount),
        developerSignals: memory.developerSignals,
      },
    };
    if (idx >= 0) mem0Store[idx] = row;
    else mem0Store.push(row);
    return { id: memory.id };
  }),
  searchMemoryFromMem0: vi.fn(async ({ userId }) =>
    mem0Store.filter((x) => x.metadata?.userId === userId),
  ),
  getMemoryById: vi.fn(async ({ id }: { id: string }) =>
    mem0Store.find((x) => x.id === id) ?? null,
  ),
}));

describe("Contradiction diagnostics retrieval", () => {
  beforeEach(() => {
    mem0Store.length = 0;
    resetRuntimeDataStores();
  });

  it("default retrieval excludes contradicted memories, includeArchived=true can return them", async () => {
    const userId = "u_diag_contra";

    await runIngestFlowLangGraph({
      userId,
      threadId: "t1",
      message: "I prefer TypeScript over Python",
    });

    await runIngestFlowLangGraph({
      userId,
      threadId: "t2",
      message: "I prefer Python over TypeScript",
    });

    const defaultRes = await retrieveRelevantMemory({
      userId,
      question: "what stack should I use?",
      topK: 10,
    });

    const defaultHasContradicted = defaultRes.memories.some((m) => {
      const status = (m.metadata as Record<string, unknown> | undefined)?.status;
      return status === "contradicted";
    });

    expect(defaultHasContradicted).toBe(false);

    const diagRes = await retrieveRelevantMemory({
      userId,
      question: "what stack should I use?",
      topK: 10,
      includeArchived: true,
    });

    const diagHasContradicted = diagRes.memories.some((m) => {
      const status = (m.metadata as Record<string, unknown> | undefined)?.status;
      return status === "contradicted";
    });

    expect(diagHasContradicted).toBe(true);
  });
});


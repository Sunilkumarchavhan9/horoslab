import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";

const DATA_DIR = path.join(process.cwd(), "data");

const mem0Store: Array<{
  id: string;
  memory?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}> = [];

vi.mock("../lib/integrations/mem0", () => {
  return {
    saveMemoryToMem0: vi.fn(async ({ memory }) => {
      const existingIndex = mem0Store.findIndex(
        (item) => item.metadata?.memoryId === memory.id,
      );

      const nextItem = {
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

      if (existingIndex !== -1) {
        mem0Store[existingIndex] = nextItem;
      } else {
        mem0Store.push(nextItem);
      }

      return { id: memory.id };
    }),

    searchMemoryFromMem0: vi.fn(async ({ userId }) => {
      return mem0Store.filter((item) => item.metadata?.userId === userId);
    }),

    getMemoryById: vi.fn(async ({ id }: { id: string }) => {
      return mem0Store.find((item) => item.id === id) ?? null;
    }),
  };
});

beforeEach(() => {
  mem0Store.length = 0;

  if (existsSync(DATA_DIR)) {
    rmSync(DATA_DIR, { recursive: true, force: true });
  }
  mkdirSync(DATA_DIR, { recursive: true });
});

describe("Memory retrieval quality guardrails", () => {
  it("resume-project-1 regression: keeps project as top result and includes episodic context", async () => {
    await runIngestFlowLangGraph({
      userId: "u_quality_resume_1",
      threadId: "t1",
      message: "I am building MemoryOS",
    });

    await runIngestFlowLangGraph({
      userId: "u_quality_resume_1",
      threadId: "t2",
      message: "I shipped JWT auth",
    });

    await runIngestFlowLangGraph({
      userId: "u_quality_resume_1",
      threadId: "t3",
      message: "I added continuity API",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_quality_resume_1",
      question: "where did I leave off in MemoryOS?",
      topK: 5,
    });

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(retrieved.memories[0]?.memoryType).toBe("project");

    const memoryTypes = new Set(
      retrieved.memories.map((memory) => memory.memoryType),
    );

    expect(memoryTypes.has("project")).toBe(true);
    expect(memoryTypes.has("episodic")).toBe(true);
  });
});

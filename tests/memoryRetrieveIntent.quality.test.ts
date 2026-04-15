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
  resetRuntimeDataStores();
});

describe("Retrieve intent quality guardrails", () => {
  it("detects handoff intent and surfaces project continuity memory", async () => {
    await runIngestFlowLangGraph({
      userId: "u_intent_handoff",
      threadId: "t1",
      message: "I am building MemoryOS collaboration backend",
    });

    await runIngestFlowLangGraph({
      userId: "u_intent_handoff",
      threadId: "t2",
      message: "I solved Redis locking bug in worker queue",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_intent_handoff",
      question: "Create a handoff for another agent to take over this project.",
      topK: 5,
    });

    expect(retrieved.debug.length).toBeGreaterThan(0);
    expect(retrieved.debug[0]?.intent).toBe("handoff");
    const topTypes = new Set(
      retrieved.memories.slice(0, 3).map((memory) => memory.memoryType),
    );
    expect(topTypes.has("project")).toBe(true);
  });

  it("detects decision recall intent and prioritizes preference memory", async () => {
    await runIngestFlowLangGraph({
      userId: "u_intent_decision",
      threadId: "t1",
      message: "I prefer TypeScript over Python",
    });

    await runIngestFlowLangGraph({
      userId: "u_intent_decision",
      threadId: "t2",
      message: "I am building MemoryOS API",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_intent_decision",
      question: "Why did I choose TypeScript over Python before?",
      topK: 5,
    });

    expect(retrieved.debug.length).toBeGreaterThan(0);
    expect(retrieved.debug[0]?.intent).toBe("decision_recall");
    expect(retrieved.memories[0]?.memoryType).toBe("preference");
  });
});


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

async function seedMessages(
  userId: string,
  messages: string[],
): Promise<void> {
  let index = 1;
  for (const message of messages) {
    await runIngestFlowLangGraph({
      userId,
      threadId: `t${index}`,
      message,
    });
    index += 1;
  }
}

describe("Week 7 developer workflow validation", () => {
  it("learning path continuity", async () => {
    const userId = "u_w7_learning";

    await seedMessages(userId, [
      "I am learning transformers",
      "I trained a transformer model",
      "I am learning system design for backend architecture",
    ]);

    const retrieved = await retrieveRelevantMemory({
      userId,
      question: "what should I study this week?",
      topK: 5,
    });

    const types = new Set(retrieved.memories.map((item) => item.memoryType));

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(types.has("learning")).toBe(true);
    expect(["learning", "project"]).toContain(retrieved.memories[0]?.memoryType);
  });

  it("project continuity after pause", async () => {
    const userId = "u_w7_project_pause";

    await seedMessages(userId, [
      "I am building MemoryOS",
      "I shipped authentication module",
      "I deployed backend API",
    ]);

    const retrieved = await retrieveRelevantMemory({
      userId,
      question: "where did I leave off in MemoryOS?",
      topK: 5,
    });

    const types = new Set(retrieved.memories.map((item) => item.memoryType));

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(types.has("project")).toBe(true);
    expect(["project", "episodic"]).toContain(retrieved.memories[0]?.memoryType);
  });

  it("bug-solving history recall", async () => {
    const userId = "u_w7_bug_history";

    await seedMessages(userId, [
      "I solved a websocket latency bug",
      "I fixed Redis lock contention in production",
      "I deployed backend observability dashboard",
    ]);

    const retrieved = await retrieveRelevantMemory({
      userId,
      question: "did I solve something like this before?",
      topK: 5,
    });

    const types = new Set(retrieved.memories.map((item) => item.memoryType));

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(types.has("episodic")).toBe(true);
    expect(["episodic", "project"]).toContain(retrieved.memories[0]?.memoryType);
  });

  it("resume bullet memory recall", async () => {
    const userId = "u_w7_resume";

    await seedMessages(userId, [
      "I shipped authentication and billing integration",
      "I deployed backend API for MemoryOS",
      "I prefer TypeScript for backend services",
    ]);

    const retrieved = await retrieveRelevantMemory({
      userId,
      question: "help me write resume bullets for my backend work",
      topK: 5,
    });

    const types = new Set(retrieved.memories.map((item) => item.memoryType));
    const hasProjectOrEpisodic =
      types.has("project") || types.has("episodic");

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(hasProjectOrEpisodic).toBe(true);
    expect(["project", "episodic"]).toContain(retrieved.memories[0]?.memoryType);
  });

  it("30-day mixed scenario answers build, study, and bug recall with continuity context", async () => {
    const userId = "u_w7_mixed_30day";

    await seedMessages(userId, [
      "I am learning transformers",
      "I prefer TypeScript",
      "I am building MemoryOS",
      "I solved a websocket latency bug",
      "I want to work on AI infra",
    ]);

    const buildNext = await retrieveRelevantMemory({
      userId,
      question: "what should I build next?",
      topK: 5,
    });
    const studyWeek = await retrieveRelevantMemory({
      userId,
      question: "what should I study this week?",
      topK: 5,
    });
    const solvedBefore = await retrieveRelevantMemory({
      userId,
      question: "did I solve this before?",
      topK: 5,
    });

    const buildTypes = new Set(buildNext.memories.map((item) => item.memoryType));
    const studyTypes = new Set(studyWeek.memories.map((item) => item.memoryType));
    const bugTypes = new Set(solvedBefore.memories.map((item) => item.memoryType));

    expect(buildNext.memories.length).toBeGreaterThan(0);
    expect(studyWeek.memories.length).toBeGreaterThan(0);
    expect(solvedBefore.memories.length).toBeGreaterThan(0);

    expect(buildTypes.has("project")).toBe(true);
    expect(buildTypes.has("learning")).toBe(true);
    expect(buildTypes.has("preference")).toBe(true);
    expect(["project", "learning"]).toContain(buildNext.memories[0]?.memoryType);

    expect(studyTypes.has("learning")).toBe(true);
    expect(studyTypes.has("project")).toBe(true);
    expect(["learning", "project"]).toContain(studyWeek.memories[0]?.memoryType);

    expect(bugTypes.has("episodic")).toBe(true);
    expect(bugTypes.has("project")).toBe(true);
    expect(["episodic", "project"]).toContain(solvedBefore.memories[0]?.memoryType);
  });
});

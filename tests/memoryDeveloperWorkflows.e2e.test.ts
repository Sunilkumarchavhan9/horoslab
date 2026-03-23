import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import { listTimelineEvents } from "../lib/memory/timelineMemory";

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

describe("MemoryOS developer workflow scenarios", () => {
  it("learning path continuity: keeps learning context for study-next questions", async () => {
    await runIngestFlowLangGraph({
      userId: "u_wf_learning",
      threadId: "t1",
      message: "I am learning transformers",
    });

    await runIngestFlowLangGraph({
      userId: "u_wf_learning",
      threadId: "t2",
      message: "I trained a transformer model",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_wf_learning",
      question: "what should I study next?",
      topK: 3,
    });

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(retrieved.memories[0]?.memoryType).toBe("learning");
    expect(retrieved.debug[0]?.intent).toBe("study_next");
  });

  it("project continuity: prioritizes active build context and records timeline", async () => {
    await runIngestFlowLangGraph({
      userId: "u_wf_project",
      threadId: "t1",
      message: "I am building MemoryOS",
    });

    await runIngestFlowLangGraph({
      userId: "u_wf_project",
      threadId: "t2",
      message: "I shipped authentication module",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_wf_project",
      question: "what should I build next?",
      topK: 3,
    });

    const timeline = listTimelineEvents("u_wf_project");

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(retrieved.memories[0]?.memoryType).toBe("project");
    expect(retrieved.debug[0]?.intent).toBe("build_next");
    expect(timeline.length).toBeGreaterThanOrEqual(2);
    expect(timeline.some((event) => event.eventType === "memory_created")).toBe(
      true,
    );
  });

  it("bug-solving history: surfaces episodic bug memories for bug-recall questions", async () => {
    await runIngestFlowLangGraph({
      userId: "u_wf_bug",
      threadId: "t1",
      message: "I solved a Redis locking bug",
    });

    await runIngestFlowLangGraph({
      userId: "u_wf_bug",
      threadId: "t2",
      message: "I fixed a websocket timeout issue",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_wf_bug",
      question: "did I solve a similar bug before?",
      topK: 3,
    });

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(retrieved.memories[0]?.memoryType).toBe("episodic");
    expect(retrieved.debug[0]?.intent).toBe("bug_recall");
  });

  it("interview prep memory: keeps profile + learning context for backend preparation", async () => {
    await runIngestFlowLangGraph({
      userId: "u_wf_interview",
      threadId: "t1",
      message: "My goal is to prepare for backend interviews",
    });

    await runIngestFlowLangGraph({
      userId: "u_wf_interview",
      threadId: "t2",
      message: "I am learning system design",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_wf_interview",
      question: "what kind of backend role should I prepare for?",
      topK: 5,
    });

    const types = new Set(retrieved.memories.map((memory) => memory.memoryType));

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(types.has("profile")).toBe(true);
    expect(types.has("learning")).toBe(true);
    expect(retrieved.debug[0]?.intent).toBe("backend_fit");
  });

  it("startup-building memory: combines project, preference, and goal context", async () => {
    await runIngestFlowLangGraph({
      userId: "u_wf_startup",
      threadId: "t1",
      message: "I am building MemoryOS startup",
    });

    await runIngestFlowLangGraph({
      userId: "u_wf_startup",
      threadId: "t2",
      message: "I prefer TypeScript",
    });

    await runIngestFlowLangGraph({
      userId: "u_wf_startup",
      threadId: "t3",
      message: "I want to work on AI infra",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_wf_startup",
      question: "what should I build next for my startup?",
      topK: 5,
    });

    const types = new Set(retrieved.memories.map((memory) => memory.memoryType));

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(retrieved.memories[0]?.memoryType).toBe("project");
    expect(types.has("preference")).toBe(true);
    expect(types.has("profile")).toBe(true);
    expect(retrieved.debug[0]?.intent).toBe("build_next");
  });
});

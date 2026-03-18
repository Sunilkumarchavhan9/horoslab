import { runIngestFlow } from "../lib/workflows/ingestGraph";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import { listTimelineEvents } from "../lib/memory/timelineMemory";
import { listRevisionEvents } from "../lib/memory/revisionMemory";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";

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
      return mem0Store.filter(
        (item) => item.metadata?.userId === userId,
      );
    }),

    getMemoryById: vi.fn(async (id: string) => {
      return mem0Store.find((item) => item.id === id) ?? null;
    }),
  };
});


const DATA_DIR = path.join(process.cwd(), "data");

beforeEach(() => {
  mem0Store.length = 0;

  if (existsSync(DATA_DIR)) {
    rmSync(DATA_DIR, { recursive: true, force: true });
  }

  mkdirSync(DATA_DIR, { recursive: true });
});

describe("MemoryOS E2E", () => {
  it("creates, evolves, retrieves, records timeline, and records revisions", async () => {
    const first = await runIngestFlow({
      userId: "u_test_e2e",
      threadId: "t1",
      message: "I am learning transformers",
    });

    expect(first.acceptedMemories).toHaveLength(1);
    expect(first.timelineEvents[0]?.eventType).toBe("memory_created");

    const second = await runIngestFlow({
      userId: "u_test_e2e",
      threadId: "t2",
      message: "I trained a transformer model",
    });

    expect(second.acceptedMemories).toHaveLength(1);
    expect(second.acceptedMemories[0]?.evidenceCount).toBe(2);
    expect(second.timelineEvents[0]?.eventType).toBe("memory_evolved");

    const retrieved = await retrieveRelevantMemory({
      userId: "u_test_e2e",
      question: "what should I learn next?",
    });

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(retrieved.memories[0]?.memoryType).toBe("learning");

    const timeline = listTimelineEvents("u_test_e2e");
    expect(timeline).toHaveLength(2);
    expect(timeline.map((event) => event.eventType)).toEqual([
      "memory_created",
      "memory_evolved",
    ]);

    const revisions = listRevisionEvents({ userId: "u_test_e2e" });
    expect(revisions).toHaveLength(1);
    expect(revisions[0]?.changes.map((change) => change.field)).toEqual([
      "content",
      "summary",
      "evidenceCount",
    ]);
  });
});

it("retrieves project, learning, and preference memories for build-next questions", async () => {
  const learning = await runIngestFlow({
    userId: "u_test_build_next",
    threadId: "t1",
    message: "I am learning transformers",
  });

  const preference = await runIngestFlow({
    userId: "u_test_build_next",
    threadId: "t2",
    message: "I prefer TypeScript",
  });

  const project = await runIngestFlow({
    userId: "u_test_build_next",
    threadId: "t3",
    message: "I am building MemoryOS",
  });

  expect(learning.acceptedMemories.length).toBeGreaterThan(0);
  expect(preference.acceptedMemories.length).toBeGreaterThan(0);
  expect(project.acceptedMemories.length).toBeGreaterThan(0);

  const retrieved = await retrieveRelevantMemory({
    userId: "u_test_build_next",
    question: "what should I build next?",
  });

  expect(retrieved.memories.length).toBeGreaterThan(0);

  const memoryTypes = new Set(
    retrieved.memories.map((memory) => memory.memoryType),
  );

  expect(memoryTypes.has("project")).toBe(true);
  expect(memoryTypes.has("learning")).toBe(true);
  expect(memoryTypes.has("preference")).toBe(true);
});


it("does not evolve unrelated project milestones into one memory", async () => {
  const first = await runIngestFlow({
    userId: "u_test_project_milestones",
    threadId: "t1",
    message: "I shipped authentication",
  });

  expect(first.acceptedMemories).toHaveLength(1);
  expect(first.timelineEvents[0]?.eventType).toBe("memory_created");

  const second = await runIngestFlow({
    userId: "u_test_project_milestones",
    threadId: "t2",
    message: "I deployed backend",
  });

  expect(second.acceptedMemories).toHaveLength(1);
  expect(second.timelineEvents[0]?.eventType).toBe("memory_created");

  const timeline = listTimelineEvents("u_test_project_milestones");
  expect(timeline).toHaveLength(2);
  expect(timeline.map((event) => event.eventType)).toEqual([
    "memory_created",
    "memory_created",
  ]);
});


it("retrieves preference-heavy memories for stack-fit questions", async () => {
  await runIngestFlow({
    userId: "u_test_stack_fit",
    threadId: "t1",
    message: "I prefer TypeScript over Python",
  });

  await runIngestFlow({
    userId: "u_test_stack_fit",
    threadId: "t2",
    message: "I use Next.js with TypeScript",
  });

  await runIngestFlow({
    userId: "u_test_stack_fit",
    threadId: "t3",
    message: "I am building MemoryOS",
  });

  const retrieved = await retrieveRelevantMemory({
    userId: "u_test_stack_fit",
    question: "what stack fits me?",
  });

  expect(retrieved.memories.length).toBeGreaterThan(0);

  const memoryTypes = new Set(
    retrieved.memories.map((memory) => memory.memoryType),
  );

  expect(memoryTypes.has("preference")).toBe(true);
  expect(memoryTypes.has("project")).toBe(true);

  expect(retrieved.memories[0]?.memoryType).toBe("preference");
});




it("matches the existing ingest flow for a basic learning memory", async () => {
  const classic = await runIngestFlow({
    userId: "u_test_langgraph_parity",
    threadId: "t1",
    message: "I am learning transformers",
  });

  const langgraph = await runIngestFlowLangGraph({
    userId: "u_test_langgraph_parity_2",
    threadId: "t1",
    message: "I am learning transformers",
  });

  expect(classic.acceptedMemories).toHaveLength(1);
  expect(langgraph.acceptedMemories).toHaveLength(1);

  expect(classic.rejectedMemories).toHaveLength(0);
  expect(langgraph.rejectedMemories).toHaveLength(0);

  expect(classic.timelineEvents).toHaveLength(1);
  expect(langgraph.timelineEvents).toHaveLength(1);

  expect(classic.acceptedMemories[0]?.type).toBe("learning");
  expect(langgraph.acceptedMemories[0]?.type).toBe("learning");

  expect(classic.timelineEvents[0]?.eventType).toBe("memory_created");
  expect(langgraph.timelineEvents[0]?.eventType).toBe("memory_created");
});

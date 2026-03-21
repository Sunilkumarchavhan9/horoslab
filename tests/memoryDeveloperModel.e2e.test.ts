import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { runIngestFlow } from "../lib/workflows/ingestGraph";
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

describe("Developer memory model E2E", () => {
  it("captures developer signals and prefers project continuity for build-next", async () => {
    const build = await runIngestFlow({
      userId: "u_dev_model_build",
      threadId: "t1",
      message: "I am building MemoryOS backend",
    });

    await runIngestFlow({
      userId: "u_dev_model_build",
      threadId: "t2",
      message: "I prefer TypeScript over Python",
    });

    await runIngestFlow({
      userId: "u_dev_model_build",
      threadId: "t3",
      message: "I want to work on AI infra",
    });

    expect(build.acceptedMemories[0]?.developerSignals?.projectArea?.length).toBeGreaterThan(0);

    const retrieved = await retrieveRelevantMemory({
      userId: "u_dev_model_build",
      question: "what should I build next?",
      topK: 3,
    });

    expect(retrieved.memories[0]?.memoryType).toBe("project");
    expect(retrieved.debug[0]?.intent).toBe("build_next");
  });

  it("favors stack and bug continuity for stack-fit and bug-recall questions", async () => {
    const stackMemory = await runIngestFlow({
      userId: "u_dev_model_bug_stack",
      threadId: "t1",
      message: "I use Next.js with TypeScript",
    });

    const bugMemory = await runIngestFlow({
      userId: "u_dev_model_bug_stack",
      threadId: "t2",
      message: "I solved a Redis locking bug",
    });

    await runIngestFlow({
      userId: "u_dev_model_bug_stack",
      threadId: "t3",
      message: "I am building MemoryOS backend",
    });

    expect(stackMemory.acceptedMemories[0]?.developerSignals?.framework).toContain("Next.js");
    expect(bugMemory.acceptedMemories[0]?.developerSignals?.bugType?.length).toBeGreaterThan(0);

    const stackFit = await retrieveRelevantMemory({
      userId: "u_dev_model_bug_stack",
      question: "what stack fits me best?",
      topK: 3,
    });

    expect(stackFit.memories[0]?.memoryType).toBe("preference");
    expect(stackFit.debug[0]?.intent).toBe("stack_fit");

    const bugRecall = await retrieveRelevantMemory({
      userId: "u_dev_model_bug_stack",
      question: "did I solve a locking bug before?",
      topK: 3,
    });

    expect(bugRecall.memories[0]?.memoryType).toBe("episodic");
    expect(bugRecall.debug[0]?.intent).toBe("bug_recall");
  });
});

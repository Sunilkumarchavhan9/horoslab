import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
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

describe("Memory Retrieve Debug E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("returns full ranking breakdown with debug metadata", async () => {
    const userId = "u_retrieve_debug_e2e";
    const headers = await headersFor(userId);

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t1",
      message: "I am building MemoryOS",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t2",
      message: "I am learning transformers",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t3",
      message: "I prefer TypeScript",
    });

    const res = await request(app)
      .post("/api/memory/retrieve/debug")
      .set(await headersFor(userId))
      .send({
        question: "what should I build next?",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memories");
    expect(res.body).toHaveProperty("debug");
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta.debugTopK).toBe(100);
    expect(res.body.meta.returnedCount).toBe(res.body.memories.length);

    expect(Array.isArray(res.body.debug)).toBe(true);
    expect(res.body.debug.length).toBeGreaterThan(0);

    const firstDebug = res.body.debug[0] as Record<string, unknown>;
    expect(firstDebug).toHaveProperty("semanticScore");
    expect(firstDebug).toHaveProperty("typeRelevanceScore");
    expect(firstDebug).toHaveProperty("importanceScore");
    expect(firstDebug).toHaveProperty("recencyScore");
    expect(firstDebug).toHaveProperty("continuityBoost");
    expect(firstDebug).toHaveProperty("finalScore");
  });
});

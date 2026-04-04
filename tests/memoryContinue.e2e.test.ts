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

describe("Memory Continue E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("returns mode-based build_next actions", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_build"))
      .send({
        threadId: "t1",
        message: "I am building MemoryOS",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_build"))
      .send({
        threadId: "t2",
        message: "I am learning transformers",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_build"))
      .send({
        question: "what should I build next?",
        mode: "build_next",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("nextActions");
    expect(res.body).toHaveProperty("usedMemories");
    expect(res.body).toHaveProperty("debug");
    expect(Array.isArray(res.body.nextActions)).toBe(true);
    expect(res.body.nextActions.length).toBeGreaterThan(0);
    expect(res.body.debug.mode).toBe("build_next");
    expect(
      (res.body.nextActions as string[]).some((action) =>
        action.includes("project thread"),
      ),
    ).toBe(true);
  });

  it("returns mode-based debug_next actions", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_debug"))
      .send({
        threadId: "t1",
        message: "I solved a Redis locking bug",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_debug"))
      .send({
        threadId: "t2",
        message: "I deployed backend",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_debug"))
      .send({
        question: "did I solve a similar bug before?",
        mode: "debug_next",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.debug.mode).toBe("debug_next");
    expect(
      (res.body.nextActions as string[]).some((action) =>
        action.toLowerCase().includes("bug"),
      ),
    ).toBe(true);
  });

  it("returns mode-based learn_next actions", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_learn"))
      .send({
        threadId: "t1",
        message: "I am learning transformers",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_learn"))
      .send({
        threadId: "t2",
        message: "I am building MemoryOS",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_learn"))
      .send({
        question: "what should I learn next?",
        mode: "learn_next",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.debug.mode).toBe("learn_next");
    expect(
      (res.body.nextActions as string[]).some((action) =>
        action.toLowerCase().includes("study this next"),
      ),
    ).toBe(true);
  });

  it("dedupes same logical memory id in continue output", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_dedupe"))
      .send({
        threadId: "t1",
        message: "I am building MemoryOS",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_dedupe"))
      .send({
        threadId: "t2",
        message: "I am building MemoryOS backend",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_dedupe"))
      .send({
        question: "where did I leave off on MemoryOS?",
        mode: "build_next",
        topK: 10,
      });

    expect(res.status).toBe(200);

    const ids = (res.body.usedMemories as Array<{ id: string }>).map(
      (memory) => memory.id,
    );
    const uniqueCount = new Set(ids).size;
    expect(uniqueCount).toBe(ids.length);
  });
});

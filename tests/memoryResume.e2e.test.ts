
import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

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

describe("Memory Resume E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("returns fallback response when no memories exist", async () => {
    const res = await request(app)
      .post("/api/memory/resume")
      .set(await headersFor("u_resume_empty"))
      .send({
        project: "MemoryOS",
        question: "where did I leave off?",
      });

    expect(res.status).toBe(200);
    expect(res.body.usedMemories).toEqual([]);
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("recommendedNextStep");
    expect(res.body.debug).toHaveProperty("project", "MemoryOS");
  });

  it("returns project continuity response from seeded memories", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_resume_seeded"))
      .send({
        threadId: "t1",
        message: "I am building MemoryOS",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_resume_seeded"))
      .send({
        threadId: "t2",
        message: "I am learning transformers",
      });

    const res = await request(app)
      .post("/api/memory/resume")
      .set(await headersFor("u_resume_seeded"))
      .send({
        project: "MemoryOS",
        question: "where did I leave off?",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.usedMemories)).toBe(true);
    expect(res.body.usedMemories.length).toBeGreaterThan(0);
    expect(typeof res.body.summary).toBe("string");
    expect(typeof res.body.lastKnownState).toBe("string");
    expect(Array.isArray(res.body.openLoops)).toBe(true);
    expect(typeof res.body.recommendedNextStep).toBe("string");
    expect(res.body.debug).toHaveProperty("project", "MemoryOS");
    expect(Array.isArray(res.body.debug.retrieval)).toBe(true);
  });
});


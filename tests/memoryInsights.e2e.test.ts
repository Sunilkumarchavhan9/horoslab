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

describe("Memory Insights E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("seeds learning/preference/project and returns valid insights counts", async () => {
    const userId = "u_insights_e2e";
    const headers = await headersFor(userId);

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t1",
      message: "I am learning transformers",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t2",
      message: "I prefer TypeScript",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t3",
      message: "I am building MemoryOS",
    });

    const insightsRes = await request(app)
      .get("/api/memory/insights")
      .set(await headersFor(userId));

    expect(insightsRes.status).toBe(200);
    expect(insightsRes.body).toHaveProperty("totalsByType");
    expect(insightsRes.body).toHaveProperty("activeProjects");
    expect(insightsRes.body).toHaveProperty("recentMilestones");

    expect(insightsRes.body.totalsByType.learning).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.totalsByType.preference).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.totalsByType.project).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.activeProjects.length).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.recentMilestones.length).toBeGreaterThanOrEqual(1);
  });
});

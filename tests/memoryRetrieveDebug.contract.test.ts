import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
  analyzeRetrieval: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
  analyzeRetrieval: mocks.analyzeRetrieval,
}));

import { createMemoryOsApp } from "../server/app";

describe("Memory Retrieve Debug Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_retrieve_debug";
  let authHeader = "";

  beforeEach(async () => {
    mocks.retrieveRelevantMemory.mockReset();
    mocks.analyzeRetrieval.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/retrieve/debug")
      .send({ question: "what should I build next?" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid retrieve/debug payload", async () => {
    const res = await request(app)
      .post("/api/memory/retrieve/debug")
      .set("authorization", authHeader)
      .send({ question: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request body");
    expect(res.body).toHaveProperty("details");
  });

  it("returns 200 with expected retrieve/debug response keys", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [
        {
          id: "m1",
          memory: "User is building MemoryOS",
          score: 0.9,
          memoryType: "project",
          importanceScore: 0.84,
          recencyScore: 1,
          typeRelevanceScore: 1,
          semanticScore: 0.9,
          continuityBoost: 0.12,
          finalScore: 0.95,
          updatedAt: "2026-04-06T00:00:00.000Z",
        },
      ],
      debug: [
        {
          id: "m1",
          semanticScore: 0.9,
          typeRelevanceScore: 1,
          importanceScore: 0.84,
          recencyScore: 1,
          continuityBoost: 0.12,
          intent: "build_next",
          weightsUsed: {
            semantic: 0.4,
            typeRelevance: 0.25,
            importance: 0.2,
            recency: 0.15,
          },
          reasonTags: [
            "type:project",
            "semantic:strong-match",
            "intent:high-type-fit",
          ],
          contributions: {
            semantic: 0.36,
            typeRelevance: 0.25,
            importance: 0.168,
            recency: 0.15,
            continuity: 0.12,
            total: 1.048,
          },
          finalScore: 0.95,
          lifecycle: {
            latestEventType: "memory_stale",
            latestReason: "Superseded by shipped milestone",
            latestChangedAt: "2026-04-07T00:00:00.000Z",
          },
        },
      ],
    });

    const res = await request(app)
      .post("/api/memory/retrieve/debug")
      .set("authorization", authHeader)
      .send({
        question: "what should I build next?",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memories");
    expect(res.body).toHaveProperty("debug");
    expect(res.body.debug[0]).toHaveProperty("lifecycle");
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta).toHaveProperty("requestedTopK");
    expect(res.body.meta).toHaveProperty("debugTopK");
    expect(res.body.meta).toHaveProperty("returnedCount");

    expect(mocks.retrieveRelevantMemory).toHaveBeenCalledWith({
      userId: authUserId,
      question: "what should I build next?",
      topK: 100,
    });
  });
});

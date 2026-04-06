import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

import { createMemoryOsApp } from "../server/app";

describe("Memory Retrieve Explain Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_retrieve_explain";
  let authHeader = "";

  beforeEach(async () => {
    mocks.retrieveRelevantMemory.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app).get(
      "/api/memory/retrieve/explain?question=what%20should%20i%20build%20next",
    );

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 when question is missing", async () => {
    const res = await request(app)
      .get("/api/memory/retrieve/explain")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "question is required");
  });

  it("returns 200 with expected explain keys", async () => {
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
          finalScore: 0.95,
        },
      ],
    });

    const res = await request(app)
      .get("/api/memory/retrieve/explain?question=what%20should%20i%20build%20next&topK=5")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("intent");
    expect(res.body).toHaveProperty("weightsUsed");
    expect(res.body).toHaveProperty("ranked");
    expect(res.body).toHaveProperty("whyTop1");
    expect(typeof res.body.whyTop1).toBe("string");
    expect((res.body.whyTop1 as string).length).toBeGreaterThan(0);

    expect(mocks.retrieveRelevantMemory).toHaveBeenCalledWith({
      userId: authUserId,
      question: "what should i build next",
      topK: 5,
    });
  });
});

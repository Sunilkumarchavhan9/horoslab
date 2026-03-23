import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  explainMemory: vi.fn(),
}));

vi.mock("@/lib/memory/explainMemory", () => ({
  explainMemory: mocks.explainMemory,
}));

import { createMemoryOsApp } from "../server/app";

describe("Memory Explain Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_explain";
  let authHeader = "";

  beforeEach(async () => {
    mocks.explainMemory.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app).get("/api/memory/explain?memoryId=m1");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 when memoryId is missing", async () => {
    const res = await request(app)
      .get("/api/memory/explain")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "memoryId is required");
    expect(mocks.explainMemory).not.toHaveBeenCalled();
  });

  it("returns 404 when memory is not found", async () => {
    mocks.explainMemory.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/memory/explain?memoryId=missing-1")
      .set("authorization", authHeader);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Memory not found");
    expect(mocks.explainMemory).toHaveBeenCalledWith({
      memoryId: "missing-1",
      userId: authUserId,
    });
  });

  it("returns 200 with explain payload keys", async () => {
    mocks.explainMemory.mockResolvedValue({
      memory: {
        id: "m1",
        content: "User is learning transformers",
        type: "learning",
        summary: "Learning transformers",
        source: "chat",
        status: "active",
        importanceScore: 0.78,
        confidence: 0.86,
        evidenceCount: 2,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T11:00:00.000Z",
        rawMetadata: { userId: "u_auth_explain" },
      },
      latestRevision: null,
      timeline: [],
      explanation: {
        whySaved: "passed score threshold 0.65",
        importanceScore: 0.78,
        confidence: 0.86,
        evidenceCount: 2,
        lastUpdatedAt: "2026-03-20T11:00:00.000Z",
        status: "active",
        timelineCount: 1,
        revisionCount: 0,
        stalenessDays: 2,
        stalenessBucket: "fresh",
      },
    });

    const res = await request(app)
      .get("/api/memory/explain?memoryId=m1&userId=u1")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memory");
    expect(res.body).toHaveProperty("latestRevision");
    expect(res.body).toHaveProperty("timeline");
    expect(res.body).toHaveProperty("explanation");
    expect(res.body.explanation).toHaveProperty("status");
    expect(res.body.explanation).toHaveProperty("timelineCount");
    expect(res.body.explanation).toHaveProperty("revisionCount");
    expect(res.body.explanation).toHaveProperty("stalenessDays");
    expect(res.body.explanation).toHaveProperty("stalenessBucket");
    expect(mocks.explainMemory).toHaveBeenCalledWith({
      memoryId: "m1",
      userId: authUserId,
    });
  });
});

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

describe("Memory Retrieve Why-Not Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_retrieve_why_not";
  let authHeader = "";

  beforeEach(async () => {
    mocks.retrieveRelevantMemory.mockReset();
    mocks.analyzeRetrieval.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/retrieve/why-not")
      .send({ question: "why was this not retrieved?" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid why-not payload", async () => {
    const res = await request(app)
      .post("/api/memory/retrieve/why-not")
      .set("authorization", authHeader)
      .send({ question: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request body");
    expect(res.body).toHaveProperty("details");
  });

  it("returns selected and rejected candidates with filter reasons", async () => {
    mocks.analyzeRetrieval.mockResolvedValue({
      intent: "build_next",
      weightsUsed: {
        semantic: 0.4,
        typeRelevance: 0.25,
        importance: 0.2,
        recency: 0.15,
      },
      selected: [
        {
          id: "m1",
          memory: "User is building MemoryOS",
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
          reasonTags: ["type:project"],
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
            latestEventType: null,
            latestReason: null,
            latestChangedAt: null,
          },
        },
      ],
      rejected: [
        {
          id: "m2",
          memory: "Old archived note",
          memoryType: "project",
          semanticScore: 0.6,
          typeRelevanceScore: 0.8,
          importanceScore: 0.4,
          recencyScore: 0.4,
          continuityBoost: 0,
          intent: "build_next",
          weightsUsed: {
            semantic: 0.4,
            typeRelevance: 0.25,
            importance: 0.2,
            recency: 0.15,
          },
          reasonTags: ["type:project"],
          contributions: {
            semantic: 0.24,
            typeRelevance: 0.2,
            importance: 0.08,
            recency: 0.06,
            continuity: 0,
            total: 0.58,
          },
          finalScore: 0.58,
          filteredOut: true,
          filterReason: "status_archived",
          lifecycle: {
            latestEventType: "memory_archived",
            latestReason: "Archived after migration",
            latestChangedAt: "2026-04-05T00:00:00.000Z",
          },
        },
      ],
      allCandidates: [
        {
          id: "m1",
          memory: "User is building MemoryOS",
          memoryType: "project",
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
          reasonTags: ["type:project"],
          contributions: {
            semantic: 0.36,
            typeRelevance: 0.25,
            importance: 0.168,
            recency: 0.15,
            continuity: 0.12,
            total: 1.048,
          },
          finalScore: 0.95,
          filteredOut: false,
          lifecycle: {
            latestEventType: null,
            latestReason: null,
            latestChangedAt: null,
          },
        },
        {
          id: "m2",
          memory: "Old archived note",
          memoryType: "project",
          semanticScore: 0.6,
          typeRelevanceScore: 0.8,
          importanceScore: 0.4,
          recencyScore: 0.4,
          continuityBoost: 0,
          intent: "build_next",
          weightsUsed: {
            semantic: 0.4,
            typeRelevance: 0.25,
            importance: 0.2,
            recency: 0.15,
          },
          reasonTags: ["type:project"],
          contributions: {
            semantic: 0.24,
            typeRelevance: 0.2,
            importance: 0.08,
            recency: 0.06,
            continuity: 0,
            total: 0.58,
          },
          finalScore: 0.58,
          filteredOut: true,
          filterReason: "status_archived",
          lifecycle: {
            latestEventType: "memory_archived",
            latestReason: "Archived after migration",
            latestChangedAt: "2026-04-05T00:00:00.000Z",
          },
        },
      ],
    });

    const res = await request(app)
      .post("/api/memory/retrieve/why-not")
      .set("authorization", authHeader)
      .send({
        question: "what should I build next?",
        topK: 5,
        workspace: "ws-alpha",
        project: "memoryos",
        threadId: "thread-3",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("intent", "build_next");
    expect(res.body).toHaveProperty("weightsUsed");
    expect(res.body).toHaveProperty("selected");
    expect(res.body).toHaveProperty("rejected");
    expect(res.body).toHaveProperty("meta");
    expect(res.body.rejected[0]).toHaveProperty("filterReason", "status_archived");
    expect(res.body.rejected[0]).toHaveProperty("lifecycle.latestEventType", "memory_archived");

    expect(mocks.analyzeRetrieval).toHaveBeenCalledWith({
      userId: authUserId,
      question: "what should I build next?",
      topK: 5,
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-3",
    });
  });
});

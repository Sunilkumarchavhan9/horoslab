import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  runIngestFlowLangGraph: vi.fn(),
  retrieveRelevantMemory: vi.fn(),
  listRevisionEvents: vi.fn(),
}));

vi.mock("@/lib/workflows/ingestGraphLangGraph", () => ({
  runIngestFlowLangGraph: mocks.runIngestFlowLangGraph,
}));

vi.mock("@/lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

vi.mock("@/lib/memory/revisionMemory", () => ({
  listRevisionEvents: mocks.listRevisionEvents,
}));

import {
  createMemoryOsApp,
} from "../server/app";

describe("Memory API Route Contracts", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_contract";

  beforeEach(() => {
    mocks.runIngestFlowLangGraph.mockReset();
    mocks.retrieveRelevantMemory.mockReset();
    mocks.listRevisionEvents.mockReset();
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/process")
      .send({ message: "I am learning transformers" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid process payload", async () => {
    const res = await request(app)
      .post("/api/memory/process")
      .set("x-user-id", authUserId)
      .send({ message: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request body");
    expect(res.body).toHaveProperty("details");
  });

  it("returns 200 with expected process response keys", async () => {
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [],
      rejectedMemories: [],
      timelineEvents: [],
    });

    const res = await request(app)
      .post("/api/memory/process")
      .set("x-user-id", authUserId)
      .send({
        userId: "fake_user_from_body",
        threadId: "t1",
        message: "I am learning transformers",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("acceptedMemories");
    expect(res.body).toHaveProperty("rejectedMemories");
    expect(res.body).toHaveProperty("timelineEvents");
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: authUserId,
      threadId: "t1",
      message: "I am learning transformers",
    });
  });

  it("returns 400 for invalid retrieve payload", async () => {
    const res = await request(app)
      .post("/api/memory/retrieve")
      .set("x-user-id", authUserId)
      .send({ question: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request body");
    expect(res.body).toHaveProperty("details");
  });

  it("returns 200 with expected retrieve response keys", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });

    const res = await request(app)
      .post("/api/memory/retrieve")
      .set("x-user-id", authUserId)
      .send({
        userId: "fake_user_from_body",
        question: "what should I build next?",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memories");
    expect(res.body).toHaveProperty("debug");
    expect(mocks.retrieveRelevantMemory).toHaveBeenCalledWith({
      userId: authUserId,
      question: "what should I build next?",
      topK: 5,
    });
  });

  it("applies userId revision filter", async () => {
    mocks.listRevisionEvents.mockReturnValue([
      {
        id: "r1",
        userId: "u_auth_contract",
        memoryId: "m1",
        version: 1,
        changedAt: new Date().toISOString(),
        changedBy: "system",
        reason: "test",
        changes: [],
      },
    ]);

    const res = await request(app)
      .get("/api/memory/revisions?userId=u1")
      .set("x-user-id", authUserId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("revisions");
    expect(res.body).toHaveProperty("count", 1);
    expect(mocks.listRevisionEvents).toHaveBeenCalledWith({ userId: authUserId });
  });

  it("applies memoryId revision filter", async () => {
    mocks.listRevisionEvents.mockReturnValue([]);

    const res = await request(app)
      .get("/api/memory/revisions?memoryId=memory-123")
      .set("x-user-id", authUserId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("revisions");
    expect(res.body).toHaveProperty("count", 0);
    expect(mocks.listRevisionEvents).toHaveBeenCalledWith({
      memoryId: "memory-123",
    });
  });
});

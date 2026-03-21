import { beforeEach, describe, expect, it, vi } from "vitest";

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
  GET as memoryRouteGet,
  POST as memoryRoutePost,
} from "../app/api/memory/[...slug]/route";

describe("Memory API Route Contracts", () => {
  const authHeaders = {
    "content-type": "application/json",
    "x-user-id": "u_auth_contract",
  };

  beforeEach(() => {
    mocks.runIngestFlowLangGraph.mockReset();
    mocks.retrieveRelevantMemory.mockReset();
    mocks.listRevisionEvents.mockReset();
  });

  it("returns 401 when auth header is missing", async () => {
    const req = new Request("http://localhost/api/memory/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "I am learning transformers" }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid process payload", async () => {
    const req = new Request("http://localhost/api/memory/process", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ message: "" }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error", "Invalid request body");
    expect(body).toHaveProperty("details");
  });

  it("returns 200 with expected process response keys", async () => {
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [],
      rejectedMemories: [],
      timelineEvents: [],
    });

    const req = new Request("http://localhost/api/memory/process", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        userId: "fake_user_from_body",
        threadId: "t1",
        message: "I am learning transformers",
      }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("acceptedMemories");
    expect(body).toHaveProperty("rejectedMemories");
    expect(body).toHaveProperty("timelineEvents");
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: "u_auth_contract",
      threadId: "t1",
      message: "I am learning transformers",
    });
  });

  it("returns 400 for invalid retrieve payload", async () => {
    const req = new Request("http://localhost/api/memory/retrieve", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ question: "" }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error", "Invalid request body");
    expect(body).toHaveProperty("details");
  });

  it("returns 200 with expected retrieve response keys", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });

    const req = new Request("http://localhost/api/memory/retrieve", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        userId: "fake_user_from_body",
        question: "what should I build next?",
        topK: 5,
      }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("memories");
    expect(body).toHaveProperty("debug");
    expect(mocks.retrieveRelevantMemory).toHaveBeenCalledWith({
      userId: "u_auth_contract",
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

    const req = new Request(
      "http://localhost/api/memory/revisions?userId=u1",
      {
        method: "GET",
        headers: { "x-user-id": "u_auth_contract" },
      },
    );

    const res = await memoryRouteGet(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("revisions");
    expect(body).toHaveProperty("count", 1);
    expect(mocks.listRevisionEvents).toHaveBeenCalledWith({ userId: "u_auth_contract" });
  });

  it("applies memoryId revision filter", async () => {
    mocks.listRevisionEvents.mockReturnValue([]);

    const req = new Request(
      "http://localhost/api/memory/revisions?memoryId=memory-123",
      {
        method: "GET",
        headers: { "x-user-id": "u_auth_contract" },
      },
    );

    const res = await memoryRouteGet(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("revisions");
    expect(body).toHaveProperty("count", 0);
    expect(mocks.listRevisionEvents).toHaveBeenCalledWith({
      memoryId: "memory-123",
    });
  });
});

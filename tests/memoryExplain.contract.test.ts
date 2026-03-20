import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  explainMemory: vi.fn(),
}));

vi.mock("@/lib/memory/explainMemory", () => ({
  explainMemory: mocks.explainMemory,
}));

import { GET as memoryRouteGet } from "../app/api/memory/[...slug]/route";

describe("Memory Explain Route Contract", () => {
  beforeEach(() => {
    mocks.explainMemory.mockReset();
  });

  it("returns 400 when memoryId is missing", async () => {
    const req = new Request("http://localhost/api/memory/explain", {
      method: "GET",
    });

    const res = await memoryRouteGet(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error", "memoryId is required");
    expect(mocks.explainMemory).not.toHaveBeenCalled();
  });

  it("returns 404 when memory is not found", async () => {
    mocks.explainMemory.mockResolvedValue(null);

    const req = new Request("http://localhost/api/memory/explain?memoryId=missing-1", {
      method: "GET",
    });

    const res = await memoryRouteGet(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toHaveProperty("error", "Memory not found");
    expect(mocks.explainMemory).toHaveBeenCalledWith({
      memoryId: "missing-1",
      userId: undefined,
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
        rawMetadata: {},
      },
      latestRevision: null,
      timeline: [],
      explanation: {
        whySaved: "passed score threshold 0.65",
        importanceScore: 0.78,
        confidence: 0.86,
        evidenceCount: 2,
        lastUpdatedAt: "2026-03-20T11:00:00.000Z",
      },
    });

    const req = new Request(
      "http://localhost/api/memory/explain?memoryId=m1&userId=u1",
      { method: "GET" },
    );

    const res = await memoryRouteGet(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("memory");
    expect(body).toHaveProperty("latestRevision");
    expect(body).toHaveProperty("timeline");
    expect(body).toHaveProperty("explanation");
    expect(mocks.explainMemory).toHaveBeenCalledWith({
      memoryId: "m1",
      userId: "u1",
    });
  });
});

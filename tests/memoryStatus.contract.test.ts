import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  updateMemoryStatus: vi.fn(),
}));

vi.mock("@/lib/memory/archiveMemory", async () => {
  const actual = await vi.importActual<typeof import("@/lib/memory/archiveMemory")>(
    "@/lib/memory/archiveMemory",
  );
  return {
    ...actual,
    updateMemoryStatus: mocks.updateMemoryStatus,
  };
});

import { createMemoryOsApp } from "../server/app";

describe("Memory Status Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_status_contract";
  let authHeader = "";

  beforeEach(async () => {
    mocks.updateMemoryStatus.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .patch("/api/memory/m1/status")
      .send({ status: "archived" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid status body", async () => {
    const res = await request(app)
      .patch("/api/memory/m1/status")
      .set("authorization", authHeader)
      .send({ status: "paused" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request body");
    expect(res.body).toHaveProperty("details");
    expect(mocks.updateMemoryStatus).not.toHaveBeenCalled();
  });

  it("returns 404 when memory is not found", async () => {
    mocks.updateMemoryStatus.mockResolvedValue({
      status: "not_found",
    });

    const res = await request(app)
      .patch("/api/memory/missing-1/status")
      .set("authorization", authHeader)
      .send({ status: "archived" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Memory not found");
    expect(mocks.updateMemoryStatus).toHaveBeenCalledWith({
      memoryId: "missing-1",
      userId: authUserId,
      status: "archived",
    });
  });

  it("returns 200 with expected status update response keys", async () => {
    mocks.updateMemoryStatus.mockResolvedValue({
      status: "updated",
      memory: {
        id: "m1",
        userId: authUserId,
        type: "project",
        content: "User is building MemoryOS",
        summary: "Building MemoryOS",
        importanceScore: 0.9,
        confidence: 0.9,
        source: "chat",
        status: "archived",
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T11:00:00.000Z",
        evidenceCount: 1,
      },
      revisionEvent: null,
      timelineEvent: {
        id: "t1",
        userId: authUserId,
        memoryId: "m1",
        eventType: "memory_archived",
        reason: "memory status updated to archived by user",
        timestamp: "2026-03-20T11:00:00.000Z",
      },
    });

    const res = await request(app)
      .patch("/api/memory/m1/status")
      .set("authorization", authHeader)
      .send({ status: "archived" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memory");
    expect(res.body).toHaveProperty("revisionEvent");
    expect(res.body).toHaveProperty("timelineEvent");
    expect(res.body.memory).toHaveProperty("status", "archived");
    expect(mocks.updateMemoryStatus).toHaveBeenCalledWith({
      memoryId: "m1",
      userId: authUserId,
      status: "archived",
    });
  });

  it("accepts contradicted status in request payload", async () => {
    mocks.updateMemoryStatus.mockResolvedValue({
      status: "updated",
      memory: {
        id: "m1",
        userId: authUserId,
        type: "preference",
        content: "User prefers TypeScript over Python",
        summary: "Prefers TypeScript over Python",
        importanceScore: 0.8,
        confidence: 0.8,
        source: "chat",
        status: "contradicted",
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T11:00:00.000Z",
        evidenceCount: 1,
      },
      revisionEvent: null,
      timelineEvent: {
        id: "t2",
        userId: authUserId,
        memoryId: "m1",
        eventType: "memory_contradicted",
        reason: "memory status updated to contradicted by user",
        timestamp: "2026-03-20T11:00:00.000Z",
      },
    });

    const res = await request(app)
      .patch("/api/memory/m1/status")
      .set("authorization", authHeader)
      .send({ status: "contradicted" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memory.status", "contradicted");
    expect(mocks.updateMemoryStatus).toHaveBeenCalledWith({
      memoryId: "m1",
      userId: authUserId,
      status: "contradicted",
    });
  });
});

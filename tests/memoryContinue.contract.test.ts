import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  planContinuity: vi.fn(),
}));

vi.mock("@/lib/memory/continuityPlanner", () => ({
  planContinuity: mocks.planContinuity,
}));

import { createMemoryOsApp } from "../server/app";

describe("Memory Continue Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_continue";
  let authHeader = "";

  beforeEach(async () => {
    mocks.planContinuity.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/continue")
      .send({ question: "what should I do next?" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid continue payload", async () => {
    const res = await request(app)
      .post("/api/memory/continue")
      .set("authorization", authHeader)
      .send({ question: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error.code", "BAD_REQUEST");
    expect(res.body).toHaveProperty("error.message", "Invalid request body");
    expect(res.body).toHaveProperty("error.details");
    expect(res.body).toHaveProperty("meta.requestId");
    expect(res.body).toHaveProperty("meta.latencyMs");
    expect(mocks.planContinuity).not.toHaveBeenCalled();
  });

  it("returns 200 with expected continue response keys", async () => {
    mocks.planContinuity.mockResolvedValue({
      nextActions: ["Continue this project thread: User is building MemoryOS"],
      usedMemories: [],
      debug: { mode: "build_next", retrieval: [] },
    });

    const res = await request(app)
      .post("/api/memory/continue")
      .set("authorization", authHeader)
      .send({
        question: "what should I do next on MemoryOS?",
        mode: "build_next",
        topK: 5,
        includeArchived: false,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.nextActions");
    expect(res.body).toHaveProperty("data.usedMemories");
    expect(res.body).toHaveProperty("data.debug");
    expect(res.body).toHaveProperty("data.debug.mode");
    expect(res.body).toHaveProperty("data.debug.retrieval");
    expect(res.body).toHaveProperty("meta.requestId");
    expect(res.body).toHaveProperty("meta.latencyMs");
    expect(mocks.planContinuity).toHaveBeenCalledWith({
      userId: authUserId,
      question: "what should I do next on MemoryOS?",
      mode: "build_next",
      topK: 5,
      includeArchived: false,
    });
  });

  it("forwards workspace/project/threadId dimensions to continue flow", async () => {
    mocks.planContinuity.mockResolvedValue({
      nextActions: ["Continue this project thread: User is building MemoryOS"],
      usedMemories: [],
      debug: { mode: "build_next", retrieval: [] },
    });

    const res = await request(app)
      .post("/api/memory/continue")
      .set("authorization", authHeader)
      .send({
        question: "continue memoryos work",
        mode: "build_next",
        workspace: "ws-alpha",
        project: "memoryos",
        threadId: "thread-42",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(mocks.planContinuity).toHaveBeenCalledWith({
      userId: authUserId,
      question: "continue memoryos work",
      mode: "build_next",
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-42",
      topK: undefined,
      includeArchived: undefined,
    });
  });
});

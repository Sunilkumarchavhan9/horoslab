import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

const mocks = vi.hoisted(() => ({
  planHandoff: vi.fn(),
}));

vi.mock("@/lib/memory/handoffPlanner", () => ({
  planHandoff: mocks.planHandoff,
}));

import { createMemoryOsApp } from "../server/app";

describe("Memory Handoff Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_handoff";
  let authHeader = "";

  beforeEach(async () => {
    mocks.planHandoff.mockReset();
    resetRuntimeDataStores();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/handoff")
      .send({ project: "MemoryOS", question: "prepare a handoff" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid handoff payload", async () => {
    const res = await request(app)
      .post("/api/memory/handoff")
      .set("authorization", authHeader)
      .send({ project: "", question: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error.code", "BAD_REQUEST");
    expect(res.body).toHaveProperty("error.message", "Invalid request body");
    expect(res.body).toHaveProperty("error.details");
    expect(res.body).toHaveProperty("meta.requestId");
    expect(res.body).toHaveProperty("meta.latencyMs");
    expect(mocks.planHandoff).not.toHaveBeenCalled();
  });

  it("returns 200 with expected handoff response keys", async () => {
    mocks.planHandoff.mockResolvedValue({
      summary: "Handoff for MemoryOS.",
      currentState: "Trust layer endpoint work is in progress.",
      openLoops: ["Confirm the next shippable milestone."],
      recommendedNextActions: ["Finish the handoff endpoint tests."],
      keyMemories: [],
      debug: { project: "MemoryOS", retrieval: [] },
    });

    const res = await request(app)
      .post("/api/memory/handoff")
      .set("authorization", authHeader)
      .send({
        project: "MemoryOS",
        question: "prepare a handoff",
        topK: 5,
        includeArchived: false,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.summary");
    expect(res.body).toHaveProperty("data.currentState");
    expect(res.body).toHaveProperty("data.openLoops");
    expect(res.body).toHaveProperty("data.recommendedNextActions");
    expect(res.body).toHaveProperty("data.keyMemories");
    expect(res.body).toHaveProperty("data.debug");
    expect(res.body).toHaveProperty("meta.requestId");
    expect(res.body).toHaveProperty("meta.latencyMs");
    expect(mocks.planHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: authUserId,
        project: "MemoryOS",
        question: "prepare a handoff",
        topK: 5,
        includeArchived: false,
      }),
    );
  });

  it("forwards workspace/threadId dimensions to handoff flow", async () => {
    mocks.planHandoff.mockResolvedValue({
      summary: "Handoff for MemoryOS.",
      currentState: "Trust layer endpoint work is in progress.",
      openLoops: ["Confirm the next shippable milestone."],
      recommendedNextActions: ["Finish the handoff endpoint tests."],
      keyMemories: [],
      debug: { project: "MemoryOS", retrieval: [] },
    });

    const res = await request(app)
      .post("/api/memory/handoff")
      .set("authorization", authHeader)
      .send({
        project: "MemoryOS",
        question: "handoff this thread",
        workspace: "ws-alpha",
        threadId: "thread-9",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(mocks.planHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: authUserId,
        project: "MemoryOS",
        question: "handoff this thread",
        workspace: "ws-alpha",
        threadId: "thread-9",
        topK: undefined,
        includeArchived: undefined,
      }),
    );
  });
});

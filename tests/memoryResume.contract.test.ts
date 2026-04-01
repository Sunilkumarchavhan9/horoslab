import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  planResume: vi.fn(),
}));

vi.mock("@/lib/memory/resumePlanner", () => ({
  planResume: mocks.planResume,
}));

import { createMemoryOsApp } from "../server/app";

describe("Memory Resume Route Contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_resume";
  let authHeader = "";

  beforeEach(async () => {
    mocks.planResume.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/resume")
      .send({ project: "MemoryOS", question: "where did I leave off?" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 400 for invalid resume payload", async () => {
    const res = await request(app)
      .post("/api/memory/resume")
      .set("authorization", authHeader)
      .send({ project: "", question: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request body");
    expect(res.body).toHaveProperty("details");
    expect(mocks.planResume).not.toHaveBeenCalled();
  });

  it("returns 200 with expected resume response keys", async () => {
    mocks.planResume.mockResolvedValue({
      summary: "You were working on MemoryOS.",
      lastKnownState: "Recent project context found.",
      openLoops: ["Finish resume endpoint wiring"],
      recommendedNextStep: "Implement tests for resume endpoint.",
      usedMemories: [],
      debug: { project: "MemoryOS", retrieval: [] },
    });

    const res = await request(app)
      .post("/api/memory/resume")
      .set("authorization", authHeader)
      .send({
        project: "MemoryOS",
        question: "where did I leave off?",
        topK: 5,
        includeArchived: false,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("lastKnownState");
    expect(res.body).toHaveProperty("openLoops");
    expect(res.body).toHaveProperty("recommendedNextStep");
    expect(res.body).toHaveProperty("usedMemories");
    expect(res.body).toHaveProperty("debug");
    expect(mocks.planResume).toHaveBeenCalledWith({
      userId: authUserId,
      project: "MemoryOS",
      question: "where did I leave off?",
      topK: 5,
      includeArchived: false,
    });
  });
});


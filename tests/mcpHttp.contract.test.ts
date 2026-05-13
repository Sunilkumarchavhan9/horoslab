import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  beforeModel: vi.fn(),
  afterModel: vi.fn(),
  runHandoffFlowLangGraph: vi.fn(),
}));

vi.mock("@/lib/SDK/memoryHooks", () => ({
  beforeModel: mocks.beforeModel,
  afterModel: mocks.afterModel,
}));

vi.mock("@/lib/workflows/handoffGraphLangGraph", () => ({
  runHandoffFlowLangGraph: mocks.runHandoffFlowLangGraph,
}));

import { createMemoryOsApp } from "../server/app";

describe("MCP HTTP contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_mcp";
  let authHeader = "";

  beforeEach(async () => {
    mocks.beforeModel.mockReset();
    mocks.afterModel.mockReset();
    mocks.runHandoffFlowLangGraph.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app).get("/api/mcp/tools");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("lists memory MCP tools", async () => {
    const res = await request(app)
      .get("/api/mcp/tools")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.tools");
    expect(res.body.data.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "memory.before_model" }),
        expect.objectContaining({ name: "memory.after_model" }),
        expect.objectContaining({ name: "memory.handoff" }),
      ]),
    );
    expect(res.body).toHaveProperty("meta.requestId");
    expect(res.body).toHaveProperty("meta.latencyMs");
  });

  it("returns 400 for invalid MCP invoke payload", async () => {
    const res = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .send({
        name: "",
        input: "bad-input",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error.code", "BAD_REQUEST");
    expect(res.body).toHaveProperty("error.message", "Invalid request body");
    expect(res.body).toHaveProperty("error.details");
  });

  it("returns 404 for an unknown MCP tool", async () => {
    const res = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .send({
        name: "memory.unknown",
        input: {},
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error.code", "NOT_FOUND");
    expect(res.body).toHaveProperty("error.message", "Unknown memory tool: memory.unknown");
  });

  it("returns 400 for invalid tool input", async () => {
    const res = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .send({
        name: "memory.before_model",
        input: {},
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error.code", "BAD_REQUEST");
    expect(res.body).toHaveProperty("error.message", "Invalid memory tool input");
    expect(res.body).toHaveProperty("error.details");
  });

  it("invokes memory.before_model over HTTP", async () => {
    mocks.beforeModel.mockResolvedValue({
      contextText: "1. [project] User is building MemoryOS",
      memories: [
        {
          id: "m1",
          content: "User is building MemoryOS",
          memoryType: "project",
          finalScore: 0.95,
        },
      ],
      source: "retrieve",
    });

    const res = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .send({
        name: "memory.before_model",
        input: {
          question: "what should I build next?",
          project: "MemoryOS",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.name", "memory.before_model");
    expect(res.body).toHaveProperty("data.result.source", "retrieve");
    expect(mocks.beforeModel).toHaveBeenCalledWith({
      userId: authUserId,
      question: "what should I build next?",
      project: "MemoryOS",
    });
  });

  it("invokes memory.after_model over HTTP", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
    });

    const res = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .send({
        name: "memory.after_model",
        input: {
          message: "I fixed the MCP route tests",
          modelResponse: "Next add onboarding docs.",
          threadId: "thread-1",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.name", "memory.after_model");
    expect(res.body).toHaveProperty("data.result.acceptedCount", 1);
    expect(mocks.afterModel).toHaveBeenCalledWith({
      userId: authUserId,
      message: "I fixed the MCP route tests",
      modelResponse: "Next add onboarding docs.",
      threadId: "thread-1",
    });
  });

  it("invokes memory.after_model with contract-only input over HTTP", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
      contractFieldCount: 3,
    });

    const res = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .send({
        name: "memory.after_model",
        input: {
          contract: {
            goal: "Ship MCP contract support.",
            decisions: ["Use memory.after_model for structured ingest."],
            next_actions: ["Add MCP contract tests."],
          },
          enforceContract: true,
          threadId: "thread-contract-http-1",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.name", "memory.after_model");
    expect(res.body).toHaveProperty("data.result.contractFieldCount", 3);
    expect(mocks.afterModel).toHaveBeenCalledWith({
      userId: authUserId,
      contract: {
        goal: "Ship MCP contract support.",
        decisions: ["Use memory.after_model for structured ingest."],
        next_actions: ["Add MCP contract tests."],
      },
      enforceContract: true,
      threadId: "thread-contract-http-1",
    });
  });

  it("invokes memory.handoff over HTTP", async () => {
    mocks.runHandoffFlowLangGraph.mockResolvedValue({
      summary: "Handoff for MemoryOS.",
      currentState: "MCP HTTP integration is in progress.",
      openLoops: ["Add external integration docs."],
      recommendedNextActions: ["Ship design-partner onboarding notes."],
      keyMemories: [],
      debug: {
        project: "MemoryOS",
        retrieval: [],
      },
    });

    const res = await request(app)
      .post("/api/mcp/invoke")
      .set("authorization", authHeader)
      .send({
        name: "memory.handoff",
        input: {
          project: "MemoryOS",
          question: "prepare a handoff",
          workspace: "ws-alpha",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.name", "memory.handoff");
    expect(res.body).toHaveProperty("data.result.summary", "Handoff for MemoryOS.");
    expect(mocks.runHandoffFlowLangGraph).toHaveBeenCalledWith({
      userId: authUserId,
      project: "MemoryOS",
      question: "prepare a handoff",
      workspace: "ws-alpha",
    });
  });
});

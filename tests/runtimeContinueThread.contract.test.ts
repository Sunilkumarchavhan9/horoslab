import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  runContinueFlowLangGraph: vi.fn(),
}));

vi.mock("../lib/workflows/continueGraphLangGraph", () => ({
  runContinueFlowLangGraph: mocks.runContinueFlowLangGraph,
}));

import { createMemoryOsApp } from "../server/app";

describe("Runtime thread continuation contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_runtime_thread_continue";
  let authHeader = "";

  beforeEach(async () => {
    mocks.runContinueFlowLangGraph.mockReset();
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("persists retrieved provenance, generated plan, and checkpoint onto the thread", async () => {
    mocks.runContinueFlowLangGraph.mockResolvedValue({
      nextActions: ["Inspect OAuth callback ownership", "Propose the smallest guarded diff"],
      usedMemories: [
        {
          id: "mem-auth-1",
          content: "OAuth migration was blocked on callback ownership.",
          memoryType: "project",
          contractCategory: "blocker",
          source: "github",
          summary: "OAuth blocker",
          finalScore: 0.94,
          importanceScore: 0.88,
          updatedAt: "2026-05-27T00:00:00.000Z",
        },
      ],
      debug: {
        mode: "build_next",
        retrieval: [],
      },
    });

    const createRes = await request(app)
      .post("/api/runtime/threads")
      .set("authorization", authHeader)
      .send({
        title: "OAuth Migration",
        goal: "Continue the OAuth migration",
        workspace: "engineering",
        project: "memoryos",
      });

    const threadId = createRes.body.data.thread.id as string;
    const continueRes = await request(app)
      .post(`/api/runtime/threads/${threadId}/continue`)
      .set("authorization", authHeader)
      .send({
        question: "Continue the OAuth migration from last week",
        mode: "build_next",
        topK: 5,
        proposedChange: {
          filepath: "src/auth/callback.ts",
          instruction: "Guard the missing OAuth state before token exchange",
          originalText: "return exchangeCode(code);",
          newText: "if (!state) return null;\nreturn exchangeCode(code);",
          startLine: 10,
          startCharacter: 0,
          endLine: 10,
          endCharacter: 26,
        },
      });

    expect(continueRes.status).toBe(200);
    expect(continueRes.body.ok).toBe(true);
    expect(mocks.runContinueFlowLangGraph).toHaveBeenCalledWith({
      userId: authUserId,
      question: "Continue the OAuth migration from last week",
      mode: "build_next",
      topK: 5,
      includeArchived: undefined,
      omitNullPreviousCheckpoint: true,
      workspace: "engineering",
      project: "memoryos",
      threadId,
    });

    const thread = continueRes.body.data.thread;
    expect(thread.plan).toEqual([
      "Inspect OAuth callback ownership",
      "Propose the smallest guarded diff",
    ]);
    expect(thread.retrievals[0].question).toBe("Continue the OAuth migration from last week");
    expect(thread.retrievals[0].memoryIds).toEqual(["mem-auth-1"]);
    expect(thread.retrievals[0].provenance[0]).toMatchObject({
      sourceType: "github",
      memoryId: "mem-auth-1",
      score: 0.94,
    });
    expect(thread.checkpoints.some((checkpoint: { label: string }) => checkpoint.label === "Continue brief generated"))
      .toBe(true);
    expect(continueRes.body.data.change).toMatchObject({
      filepath: "src/auth/callback.ts",
      status: "pending",
      instruction: "Guard the missing OAuth state before token exchange",
    });
    expect(continueRes.body.data.change.checkpointId).toBeTruthy();
  });
});

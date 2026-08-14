import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { existsSync, unlinkSync } from "fs";
import path from "path";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";

const mocks = vi.hoisted(() => ({
  getProjectStateSnapshot: vi.fn(),
  getRankedNextActions: vi.fn(),
  getDecisionHistory: vi.fn(),
  getContinuityScore: vi.fn(),
  explainMemoryWhy: vi.fn(),
  getExecutionHistory: vi.fn(),
}));

vi.mock("../lib/memory/continuityApiService", () => ({
  getProjectStateSnapshot: mocks.getProjectStateSnapshot,
  getRankedNextActions: mocks.getRankedNextActions,
  getDecisionHistory: mocks.getDecisionHistory,
  getContinuityScore: mocks.getContinuityScore,
  explainMemoryWhy: mocks.explainMemoryWhy,
  getExecutionHistory: mocks.getExecutionHistory,
}));

const ACTION_MEMORY_STORE_PATH = path.join(process.cwd(), "data", "action-memory.json");

describe("Continuity APIs contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_continuity_api_contract";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
    mocks.getProjectStateSnapshot.mockReset();
    mocks.getRankedNextActions.mockReset();
    mocks.getDecisionHistory.mockReset();
    mocks.getContinuityScore.mockReset();
    mocks.explainMemoryWhy.mockReset();
    mocks.getExecutionHistory.mockReset();

    mocks.getProjectStateSnapshot.mockResolvedValue({
      projectId: "memoryos",
      briefSummary: {
        currentGoal: "Ship continuity APIs",
        whatChangedRecently: ["Added project-state route"],
        openBlockers: [],
        nextBestAction: "Run contract tests",
      },
      activeLoop: null,
      driftFlag: false,
      driftSummary: null,
      lastAction: null,
      resumeConfidenceScore: 72,
    });
    mocks.getRankedNextActions.mockResolvedValue([
      {
        id: "brief:next-best",
        text: "Run contract tests",
        source: "resume_brief",
        rank: 1,
        confidence: 0.72,
      },
    ]);
    mocks.getDecisionHistory.mockResolvedValue([
      {
        memoryId: "m-decision-1",
        summary: "Use continuity envelope on new routes",
        content: "Standardize API responses",
        contractCategory: "decision",
        updatedAt: new Date().toISOString(),
        confidence: 0.9,
      },
    ]);
    mocks.getContinuityScore.mockResolvedValue({
      score: 72,
      factors: [{ label: "Retrieval match quality", weight: 30, contribution: 21 }],
    });
    mocks.explainMemoryWhy.mockResolvedValue({
      memoryId: "m-decision-1",
      whySelected: "Ranked in project retrieval with final score 0.910.",
      confidence: 0.9,
      contractCategory: "decision",
    });
    mocks.getExecutionHistory.mockResolvedValue({
      items: [],
      actions: [],
      count: 0,
    });

    if (existsSync(ACTION_MEMORY_STORE_PATH)) {
      unlinkSync(ACTION_MEMORY_STORE_PATH);
    }
  });

  function expectEnvelope(body: Record<string, unknown>) {
    expect(body.ok).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.meta).toMatchObject({
      generatedAt: expect.any(String),
    });
  }

  it("GET /api/memory/project-state returns envelope and snapshot keys", async () => {
    const res = await request(app)
      .get("/api/memory/project-state?projectId=memoryos")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.data).toMatchObject({
      projectId: "memoryos",
      briefSummary: expect.objectContaining({ currentGoal: expect.any(String) }),
      resumeConfidenceScore: expect.any(Number),
    });
    expect(res.body.meta.projectId).toBe("memoryos");
  });

  it("GET /api/memory/next-actions returns ranked actions", async () => {
    const res = await request(app)
      .get("/api/memory/next-actions?projectId=memoryos&limit=5")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.actions[0]).toMatchObject({
      text: expect.any(String),
      rank: expect.any(Number),
    });
  });

  it("GET /api/memory/decision-history returns decisions", async () => {
    const res = await request(app)
      .get("/api/memory/decision-history?projectId=memoryos")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.data.decisions[0]).toMatchObject({
      memoryId: "m-decision-1",
      contractCategory: "decision",
    });
  });

  it("GET /api/memory/continuity-score returns score breakdown", async () => {
    const res = await request(app)
      .get("/api/memory/continuity-score?projectId=memoryos")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.data).toMatchObject({
      score: 72,
      factors: expect.any(Array),
    });
  });

  it("GET /api/memory/why returns explain payload", async () => {
    const res = await request(app)
      .get("/api/memory/why?memoryId=m-decision-1&projectId=memoryos")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.data).toMatchObject({
      memoryId: "m-decision-1",
      whySelected: expect.any(String),
    });
  });

  it("GET /api/memory/execution-history uses continuity envelope", async () => {
    const res = await request(app)
      .get("/api/memory/execution-history?projectId=memoryos&limit=10")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.data).toMatchObject({
      items: expect.any(Array),
      actions: expect.any(Array),
      count: expect.any(Number),
    });
  });

  it("returns 400 when projectId is missing", async () => {
    const res = await request(app)
      .get("/api/memory/project-state")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.code).toBe("invalid_query");
    expect(typeof res.body.error).toBe("string");
  });

  it("scopes org via header on service calls", async () => {
    await request(app)
      .get("/api/memory/project-state?projectId=memoryos")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_continuity_alpha");

    expect(mocks.getProjectStateSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: authUserId,
        orgId: "org_continuity_alpha",
        projectId: "memoryos",
      }),
    );
  });

  it("registers MCP tools for continuity APIs", async () => {
    const { memoryTools } = await import("../lib/memory/MCP/memoryTools");
    const names = memoryTools.map((tool) => tool.name);
    expect(names).toContain("memory.project_state");
    expect(names).toContain("memory.next_actions");
    expect(names).toContain("memory.continuity_score");
  });
});

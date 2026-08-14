import { createHmac } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers/authToken";
import { resetPrismaRuntimeDataStores } from "./helpers/resetDataDir";
import { createMemoryOsApp } from "../server/app";
import { prisma } from "../lib/storage/prismaClient";
import { RealityRuntime } from "../lib/reality/realityRuntime";

const { getGitHubPullRequestDetailMock } = vi.hoisted(() => ({
  getGitHubPullRequestDetailMock: vi.fn(),
}));

vi.mock("../lib/integrations/githubRepoBrowser", () => ({
  getGitHubPullRequestDetail: getGitHubPullRequestDetailMock,
}));

const app = createMemoryOsApp();
const payload = {
  action: "opened",
  repository: { full_name: "acme/reality-compiler" },
  pull_request: {
    number: 7,
    title: "Open compiler test PR",
    base: { sha: "base-7" },
    head: { sha: "head-7" },
  },
};

const mockedPullRequest = {
  number: 12,
  title: "Add destructive migration",
  state: "open",
  body: "This change drops a column.",
  htmlUrl: "https://github.com/acme/reality-compiler/pull/12",
  baseRef: "main",
  headRef: "feature/drop-column",
  headSha: "head-12",
  additions: 5,
  deletions: 1,
  changedFiles: 1,
  comments: 0,
  reviewComments: 0,
  commits: 1,
  draft: false,
  merged: false,
  mergedAt: null,
  updatedAt: "2026-07-20T12:00:00.000Z",
  createdAt: "2026-07-20T11:30:00.000Z",
  closedAt: null,
  files: [
    {
      filename: "prisma/migrations/20260720_drop_column/migration.sql",
      status: "modified",
      additions: 1,
      deletions: 1,
      changes: 2,
      patch: "ALTER TABLE users DROP COLUMN legacy_name;",
    },
  ],
  commentsList: [],
  reviews: [],
  statusState: "success",
  statusCount: 1,
};

describe("Reality Compiler GitHub webhook route", () => {
  const previousSecret = process.env.REALITY_COMPILER_GITHUB_WEBHOOK_SECRET;
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousMemoryJwtSecret = process.env.MEMORYOS_JWT_SECRET;

  beforeEach(() => {
    RealityRuntime.resetForTests();
    getGitHubPullRequestDetailMock.mockReset();
    getGitHubPullRequestDetailMock.mockResolvedValue(mockedPullRequest);
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.REALITY_COMPILER_GITHUB_WEBHOOK_SECRET;
    else process.env.REALITY_COMPILER_GITHUB_WEBHOOK_SECRET = previousSecret;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousMemoryJwtSecret === undefined) delete process.env.MEMORYOS_JWT_SECRET;
    else process.env.MEMORYOS_JWT_SECRET = previousMemoryJwtSecret;
  });

  it("rejects an invalid signature", async () => {
    process.env.REALITY_COMPILER_GITHUB_WEBHOOK_SECRET = "route-secret";
    const response = await request(app)
      .post("/api/reality-compiler/github/webhook")
      .set("x-github-event", "pull_request")
      .set("x-github-delivery", "route-delivery-invalid")
      .set("x-hub-signature-256", "sha256=invalid")
      .send(payload);
    expect(response.status).toBe(401);
  });

  it("accepts a signed pull request and returns a compilation decision", async () => {
    process.env.REALITY_COMPILER_GITHUB_WEBHOOK_SECRET = "route-secret";
    const raw = JSON.stringify(payload);
    const signature = `sha256=${createHmac("sha256", "route-secret").update(raw).digest("hex")}`;
    const response = await request(app)
      .post("/api/reality-compiler/github/webhook")
      .set("content-type", "application/json")
      .set("x-github-event", "pull_request")
      .set("x-github-delivery", "route-delivery-valid")
      .set("x-hub-signature-256", signature)
      .send(raw);
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.compilation).toMatchObject({ repository: "acme/reality-compiler", pullRequest: 7, decision: "CONDITIONAL" });

    const repositoryNode = RealityRuntime.getNode("acme-reality-compiler");
    expect(repositoryNode).toMatchObject({
      id: "acme-reality-compiler",
      type: "repository",
      name: "acme/reality-compiler",
    });
    expect(
      RealityRuntime.listEvents(10).some(
        (event) => event.nodeId === "acme-reality-compiler" && event.type === "github_pull_request_compiled",
      ),
    ).toBe(true);
  });

  it("exposes backend compilation status", async () => {
    const response = await request(app).get("/api/reality-compiler/status");
    expect(response.status).toBe(200);
    expect(response.body.data.compilerVersion).toBe("reality-compiler.v1");
    expect(response.body.data.plan.company).toBe("Reality Exchange");
    expect(response.body.data.plan.product).toBe("Institution Compiler");
    expect(response.body.data.plan.buildNow.items).toContain("Mandate Contract");
    expect(response.body.data.totalCompilations).toBeGreaterThan(0);
  });

  it("verifies a GitHub pull request and returns a verdict payload", async () => {
    await resetPrismaRuntimeDataStores();
    const token = await makeToken("user-verify");
    const response = await request(app)
      .post("/api/reality-compiler/verify")
      .set("authorization", `Bearer ${token}`)
      .set("content-type", "application/json")
      .send(
        JSON.stringify({
          owner: "acme",
          repo: "reality-compiler",
          pullRequestNumber: 12,
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.duplicate).toBe(false);
    expect(response.body.data.verification).toMatchObject({
      repository: "acme/reality-compiler",
      pullRequestNumber: 12,
      verdict: "FAIL",
    });
    expect(response.body.data.verification.confidence).toBeGreaterThan(0.5);
    expect(response.body.data.verification.evidenceReport.summary).toContain("Add destructive migration");
    expect(response.body.data.verification.risks.length).toBeGreaterThan(0);

    const experience = await prisma.experienceRecord.findUnique({
      where: { id: response.body.data.verification.id },
    });

    expect(experience).toMatchObject({
      outcomeId: response.body.data.verification.id,
      lesson: expect.any(String),
      confidence: expect.any(Number),
      status: "captured",
    });
    expect(experience?.proof).toMatchObject({
      version: "verification_experience.v1",
      repository: "acme/reality-compiler",
      wrongAttempts: expect.any(Array),
      correctSolution: expect.any(String),
      files: expect.arrayContaining(["prisma/migrations/20260720_drop_column/migration.sql"]),
    });

    const listResponse = await request(app)
      .get("/api/reality-compiler/verifications")
      .set("authorization", `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.ok).toBe(true);
    expect(listResponse.body.data.verifications).toHaveLength(1);
    expect(listResponse.body.data.verifications[0]).toMatchObject({
      repository: "acme/reality-compiler",
      pullRequestNumber: 12,
      verdict: "FAIL",
    });

    const missionsResponse = await request(app)
      .get("/api/reality-compiler/missions")
      .set("authorization", `Bearer ${token}`);

    expect(missionsResponse.status).toBe(200);
    expect(missionsResponse.body.ok).toBe(true);
    expect(missionsResponse.body.data.missions).toHaveLength(1);
    expect(missionsResponse.body.data.missions[0]).toMatchObject({
      repository: "acme/reality-compiler",
      pullRequestNumber: 12,
      verdict: "FAIL",
      status: "blocked",
    });
  });

  it("returns the MVP-shaped verification result", async () => {
    await resetPrismaRuntimeDataStores();
    const token = await makeToken("user-verify-mvp");
    const response = await request(app)
      .post("/api/reality-compiler/mvp/verify")
      .set("authorization", `Bearer ${token}`)
      .set("content-type", "application/json")
      .send(
        JSON.stringify({
          owner: "acme",
          repo: "reality-compiler",
          pullRequestNumber: 12,
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toMatchObject({
      duplicate: false,
      result: {
        verdict: "FAIL",
        risks: expect.any(Array),
        recommendedAction: expect.any(String),
      },
    });
    expect(response.body.data.result.evidenceReport.summary).toContain("Add destructive migration");
    expect(response.body.data.result.timeline).toHaveLength(5);
  });
});

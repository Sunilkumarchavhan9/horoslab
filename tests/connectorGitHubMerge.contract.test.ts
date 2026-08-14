import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  mergeGitHubPullRequest: vi.fn(),
  patchContinuityFunnelStep: vi.fn(),
}));

function githubExecutionMock() {
  return {
    mergeGitHubPullRequest: mocks.mergeGitHubPullRequest,
    approveAndExecuteGitHubProposal: vi.fn(),
    getGitHubProfileForUser: vi.fn(),
    listGitHubReposForUser: vi.fn(),
    proposeGitHubExecution: vi.fn(),
  };
}

vi.mock("@/lib/integrations/githubExecution", githubExecutionMock);
vi.mock("../lib/integrations/githubExecution", githubExecutionMock);

function funnelStoreMock() {
  return {
    patchContinuityFunnelStep: mocks.patchContinuityFunnelStep,
    patchCompanyBrainFunnelProgress: vi.fn().mockResolvedValue(undefined),
    recordConnectorIngestionToFunnel: vi.fn().mockResolvedValue(undefined),
  };
}

vi.mock("@/lib/companyBrain/funnelStore", funnelStoreMock);
vi.mock("../lib/companyBrain/funnelStore", funnelStoreMock);

import { createMemoryOsApp } from "../server/app";

describe("GitHub PR merge route contract", () => {
  const app = createMemoryOsApp();
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken("u_github_merge_contract")}`;
    mocks.mergeGitHubPullRequest.mockReset();
    mocks.patchContinuityFunnelStep.mockReset();
    mocks.patchContinuityFunnelStep.mockResolvedValue(undefined);
  });

  it("merges a PR through POST /api/connector/github/repos/:owner/:repo/pulls/:number/merge", async () => {
    mocks.mergeGitHubPullRequest.mockResolvedValue({
      merged: true,
      sha: "abc123",
      mergedAt: "2026-06-13T10:00:00.000Z",
      message: "Merged",
    });

    const res = await request(app)
      .post("/api/connector/github/repos/acme/widgets/pulls/42/merge")
      .set("authorization", authHeader)
      .send({
        mergeMethod: "squash",
        commitTitle: "Merge PR #42",
        commitMessage: "Merge widgets update",
        expectedHeadSha: "head-sha-123",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.mergeResult).toMatchObject({
      merged: true,
      sha: "abc123",
      mergedAt: "2026-06-13T10:00:00.000Z",
      message: "Merged",
    });
    expect(mocks.mergeGitHubPullRequest).toHaveBeenCalledWith({
      userId: "u_github_merge_contract",
      orgId: undefined,
      owner: "acme",
      repo: "widgets",
      number: 42,
      mergeMethod: "squash",
      commitTitle: "Merge PR #42",
      commitMessage: "Merge widgets update",
      expectedHeadSha: "head-sha-123",
    });
    expect(mocks.patchContinuityFunnelStep).toHaveBeenCalledWith(
      "u_github_merge_contract",
      "executed",
      { orgId: undefined },
    );
  });

  it("returns 400 when the PR number is invalid", async () => {
    const res = await request(app)
      .post("/api/connector/github/repos/acme/widgets/pulls/not-a-number/merge")
      .set("authorization", authHeader)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(mocks.mergeGitHubPullRequest).not.toHaveBeenCalled();
  });
});

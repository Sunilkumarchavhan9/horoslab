import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listRepos: vi.fn(),
  listWorkflowRunsForRepo: vi.fn(),
  listJobsForWorkflowRun: vi.fn(),
  upsertRecentMemory: vi.fn(async () => undefined),
  extractMemory: vi.fn(() => [
    {
      userId: "user-ci",
      type: "bug",
      content: "CI failed after auth middleware changed.",
      summary: "GitHub Actions failure should be checked before future auth changes.",
      source: "import",
      status: "active",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      importanceScore: 0.8,
      confidence: 0.8,
      evidenceCount: 1,
      contractVersion: "memoryos.contract.v1",
      contractCategory: "incident",
      companyBrainType: "test",
      developerSignals: { projectArea: ["auth"], goal: ["testing"], bugType: ["regression"] },
    },
  ]),
}));

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(function MockOctokit() {
    return {
      repos: {
        listForAuthenticatedUser: mocks.listRepos,
      },
      actions: {
        listWorkflowRunsForRepo: mocks.listWorkflowRunsForRepo,
        listJobsForWorkflowRun: mocks.listJobsForWorkflowRun,
      },
    };
  }),
}));

vi.mock("@/lib/memory/extractMemory", () => ({
  extractMemory: mocks.extractMemory,
}));

vi.mock("@/lib/memory/recentMemoryStore", () => ({
  upsertRecentMemory: mocks.upsertRecentMemory,
  getRecentMemories: vi.fn(async () => []),
}));

import { GitHubActionsClient } from "@/lib/integrations/githubActions";

describe("GitHub Actions CI/CD connector contract", () => {
  afterEach(() => {
    mocks.listRepos.mockReset();
    mocks.listWorkflowRunsForRepo.mockReset();
    mocks.listJobsForWorkflowRun.mockReset();
    mocks.upsertRecentMemory.mockClear();
    mocks.extractMemory.mockClear();
  });

  it("syncs workflow runs into traceable CI/CD memories", async () => {
    mocks.listRepos.mockResolvedValueOnce({
      data: [
        {
          owner: { login: "memoryos" },
          name: "app",
          full_name: "memoryos/app",
        },
      ],
    }).mockResolvedValue({ data: [] });
    mocks.listWorkflowRunsForRepo.mockResolvedValue({
      data: {
        workflow_runs: [
          {
            id: 123,
            name: "quality",
            status: "completed",
            conclusion: "failure",
            head_branch: "main",
            head_sha: "abc123",
            html_url: "https://github.com/memoryos/app/actions/runs/123",
            updated_at: "2026-06-19T12:00:00.000Z",
          },
        ],
      },
    });
    mocks.listJobsForWorkflowRun.mockResolvedValue({
      data: {
        jobs: [
          { name: "test", conclusion: "failure" },
          { name: "lint", conclusion: "success" },
        ],
      },
    });

    const result = await GitHubActionsClient.sync({
      userId: "user-ci",
      accessToken: "gho_test",
      recentItemKeys: [],
    });

    expect(result.extractedCount).toBe(1);
    expect(result.dedupeKeys).toEqual(["github_actions:run:memoryos/app:123"]);
    expect(result.contractCounts).toEqual({ incident: 1 });
    expect(result.checkpoint).toBe("2026-06-19T12:00:00.000Z");
    expect(result.diagnostics).toEqual({
      reposSeen: 1,
      runsSeen: 1,
      jobsSeen: 2,
    });
    expect(mocks.extractMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-ci",
        message: expect.stringContaining("Failed jobs: test=failure."),
      }),
    );
    expect(mocks.upsertRecentMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceRef: "github-actions://memoryos/app/runs/123",
        traceProof: expect.objectContaining({
          sourceType: "ci_cd_log",
          sourceRef: "github-actions://memoryos/app/runs/123",
          evidence: expect.arrayContaining([
            "GitHub Actions run 123: quality",
            "https://github.com/memoryos/app/actions/runs/123",
          ]),
        }),
        developerSignals: expect.objectContaining({
          projectArea: expect.arrayContaining(["auth", "memoryos/app"]),
          goal: expect.arrayContaining(["testing", "test history", "release pipeline"]),
          bugType: expect.arrayContaining(["regression", "failed build", "test failure"]),
        }),
      }),
    );
  });
});

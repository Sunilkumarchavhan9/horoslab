import { randomUUID } from "crypto";
import { Octokit } from "@octokit/rest";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";

export interface GitHubActionsSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

type GitHubActionsSourceDetails = {
  sourceRef: string;
  traceProof: {
    sourceType: "ci_cd_log";
    sourceRef: string;
    evidence: string[];
    confidence: number;
    capturedAt: string;
  };
  developerSignals: {
    projectArea: string[];
    goal: string[];
    bugType?: string[];
  };
};

const GITHUB_ACTIONS_REPO_PAGE_SIZE = Math.max(
  1,
  Math.min(100, Number(process.env.GITHUB_ACTIONS_SYNC_REPO_PAGE_SIZE ?? 15)),
);
const GITHUB_ACTIONS_REPO_MAX_PAGES = Math.max(1, Number(process.env.GITHUB_ACTIONS_SYNC_REPO_MAX_PAGES ?? 2));
const GITHUB_ACTIONS_RUN_PAGE_SIZE = Math.max(
  1,
  Math.min(100, Number(process.env.GITHUB_ACTIONS_SYNC_RUN_PAGE_SIZE ?? 10)),
);
const GITHUB_ACTIONS_JOB_PAGE_SIZE = Math.max(
  1,
  Math.min(100, Number(process.env.GITHUB_ACTIONS_SYNC_JOB_PAGE_SIZE ?? 25)),
);
const GITHUB_ACTIONS_BUDGET_MS = Math.max(5_000, Number(process.env.GITHUB_ACTIONS_SYNC_BUDGET_MS ?? 20_000));
const GITHUB_ACTIONS_REQUEST_TIMEOUT_MS = Math.max(
  3_000,
  Number(process.env.GITHUB_ACTIONS_REQUEST_TIMEOUT_MS ?? 10_000),
);

function incrementContractCount(counts: Record<string, number>, category?: string): void {
  if (!category) return;
  counts[category] = (counts[category] ?? 0) + 1;
}

export function buildGitHubActionsSourceDetails(input: {
  repoFullName: string;
  runId: number | string;
  runName: string;
  status?: string | null;
  conclusion?: string | null;
  url?: string | null;
  capturedAt?: string;
}): GitHubActionsSourceDetails {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const sourceRef = `github-actions://${input.repoFullName}/runs/${input.runId}`;
  return {
    sourceRef,
    traceProof: {
      sourceType: "ci_cd_log",
      sourceRef,
      evidence: [
        `GitHub Actions run ${input.runId}: ${input.runName}`,
        `Status: ${input.status ?? "unknown"}`,
        `Conclusion: ${input.conclusion ?? "unknown"}`,
        ...(input.url ? [input.url] : []),
      ],
      confidence: 0.91,
      capturedAt,
    },
    developerSignals: {
      projectArea: [input.repoFullName],
      goal: ["test history", "release pipeline"],
      bugType: input.conclusion === "failure" ? ["failed build", "test failure"] : undefined,
    },
  };
}

export const GitHubActionsClient = {
  async sync(options: GitHubActionsSyncOptions) {
    const octokit = new Octokit({
      auth: options.accessToken,
      request: {
        timeout: GITHUB_ACTIONS_REQUEST_TIMEOUT_MS,
      },
    });
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const contractCounts: Record<string, number> = {};
    const sinceMs = options.since ? new Date(options.since).getTime() : 0;
    let newestCheckpointMs = sinceMs;
    let extractedCount = 0;
    let reposSeen = 0;
    let runsSeen = 0;
    let jobsSeen = 0;
    const startedAt = Date.now();
    const deadline = startedAt + GITHUB_ACTIONS_BUDGET_MS;
    const budgetExceeded = () => Date.now() >= deadline;

    for (let repoPage = 1; repoPage <= GITHUB_ACTIONS_REPO_MAX_PAGES; repoPage += 1) {
      if (budgetExceeded()) break;
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: GITHUB_ACTIONS_REPO_PAGE_SIZE,
        page: repoPage,
      });
      if (repos.length === 0) break;

      for (const repo of repos) {
        if (budgetExceeded()) break;
        reposSeen += 1;
        const owner = repo.owner?.login;
        const repoName = repo.name;
        const repoFullName = repo.full_name ?? (owner && repoName ? `${owner}/${repoName}` : undefined);
        if (!owner || !repoName || !repoFullName) continue;

        const { data: runsResponse } = await octokit.actions.listWorkflowRunsForRepo({
          owner,
          repo: repoName,
          per_page: GITHUB_ACTIONS_RUN_PAGE_SIZE,
        });
        const runs = runsResponse.workflow_runs ?? [];
        for (const run of runs) {
          if (budgetExceeded()) break;
          runsSeen += 1;
          const runUpdatedMs = run.updated_at ? new Date(run.updated_at).getTime() : 0;
          if (runUpdatedMs > newestCheckpointMs) newestCheckpointMs = runUpdatedMs;
          if (sinceMs > 0 && runUpdatedMs > 0 && runUpdatedMs <= sinceMs) continue;

          const runKey = `github_actions:run:${repoFullName}:${run.id}`;
          if (seen.has(runKey)) continue;

          const { data: jobsResponse } = await octokit.actions.listJobsForWorkflowRun({
            owner,
            repo: repoName,
            run_id: Number(run.id),
            per_page: GITHUB_ACTIONS_JOB_PAGE_SIZE,
          });
          const jobs = jobsResponse.jobs ?? [];
          jobsSeen += jobs.length;
          const failedJobs = jobs
            .filter((job) => job.conclusion === "failure" || job.conclusion === "cancelled" || job.conclusion === "timed_out")
            .map((job) => `${job.name ?? "job"}=${job.conclusion ?? "unknown"}`)
            .slice(0, 8);
          const runName = run.name ?? run.display_title ?? run.workflow_id?.toString() ?? "workflow run";
          const content = [
            `GitHub Actions ${run.conclusion === "failure" ? "failed" : "completed"} run in ${repoFullName}.`,
            `Workflow: ${runName}.`,
            `Status: ${run.status ?? "unknown"}.`,
            `Conclusion: ${run.conclusion ?? "unknown"}.`,
            `Branch: ${run.head_branch ?? "unknown"}.`,
            `Commit: ${run.head_sha ?? "unknown"}.`,
            failedJobs.length > 0 ? `Failed jobs: ${failedJobs.join(", ")}.` : "",
            `Required future-agent check: inspect CI/CD history before risky changes and run matching tests before handoff.`,
          ].filter(Boolean).join(" ");
          const candidates = extractMemory({ userId: options.userId, message: content });
          const now = new Date().toISOString();
          const sourceDetails = buildGitHubActionsSourceDetails({
            repoFullName,
            runId: run.id,
            runName,
            status: run.status,
            conclusion: run.conclusion,
            url: run.html_url,
            capturedAt: now,
          });
          for (const candidate of candidates) {
            await upsertRecentMemory({
              ...candidate,
              id: randomUUID(),
              source: "import",
              status: "active",
              createdAt: now,
              updatedAt: now,
              importanceScore: run.conclusion === "failure" ? 0.84 : 0.76,
              confidence: 0.9,
              evidenceCount: sourceDetails.traceProof.evidence.length,
              developerSignals: {
                ...candidate.developerSignals,
                projectArea: Array.from(new Set([
                  ...(candidate.developerSignals?.projectArea ?? []),
                  ...sourceDetails.developerSignals.projectArea,
                ])),
                goal: Array.from(new Set([
                  ...(candidate.developerSignals?.goal ?? []),
                  ...sourceDetails.developerSignals.goal,
                ])),
                bugType: Array.from(new Set([
                  ...(candidate.developerSignals?.bugType ?? []),
                  ...(sourceDetails.developerSignals.bugType ?? []),
                ])),
              },
              sourceRef: sourceDetails.sourceRef,
              traceProof: sourceDetails.traceProof,
            });
            extractedCount += 1;
            incrementContractCount(contractCounts, candidate.contractCategory);
          }
          dedupeKeys.push(runKey);
        }
      }
    }

    if (runsSeen === 0) {
      throw new Error("GitHub Actions sync found no readable workflow runs. Verify GitHub workflow scope and repository access.");
    }

    return {
      success: true,
      extractedCount,
      dedupeKeys,
      contractCounts,
      checkpoint: newestCheckpointMs > 0 ? new Date(newestCheckpointMs).toISOString() : new Date().toISOString(),
      diagnostics: {
        reposSeen,
        runsSeen,
        jobsSeen,
      },
    };
  },
};

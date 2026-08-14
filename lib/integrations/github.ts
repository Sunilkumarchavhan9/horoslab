import { Octokit } from "@octokit/rest";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { randomUUID } from "crypto";

export interface GitHubSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

export type GitHubMemoryArtifactKind = "repo" | "pr" | "issue";

export type GitHubMemorySourceDetails = {
  sourceRef: string;
  traceProof: {
    sourceType: "github";
    sourceRef: string;
    evidence: string[];
    confidence: number;
    capturedAt: string;
  };
  developerSignals: {
    projectArea: string[];
  };
};

const GITHUB_REPO_PAGE_SIZE = Math.max(1, Math.min(100, Number(process.env.GITHUB_SYNC_REPO_PAGE_SIZE ?? 20)));
const GITHUB_REPO_MAX_PAGES = Math.max(1, Number(process.env.GITHUB_SYNC_REPO_MAX_PAGES ?? 1));
const GITHUB_ITEM_PAGE_SIZE = Math.max(1, Math.min(100, Number(process.env.GITHUB_SYNC_ITEM_PAGE_SIZE ?? 20)));
const GITHUB_ITEM_MAX_PAGES = Math.max(1, Number(process.env.GITHUB_SYNC_ITEM_MAX_PAGES ?? 1));
const GITHUB_SYNC_BUDGET_MS = Math.max(5_000, Number(process.env.GITHUB_SYNC_BUDGET_MS ?? 25_000));
const GITHUB_REQUEST_TIMEOUT_MS = Math.max(3_000, Number(process.env.GITHUB_REQUEST_TIMEOUT_MS ?? 10_000));
const GITHUB_SYNC_INCLUDE_ISSUES = process.env.GITHUB_SYNC_INCLUDE_ISSUES === "true";
const GITHUB_OAUTH_SCOPE =
  process.env.GITHUB_OAUTH_SCOPE || "repo workflow read:org read:user user:email";

export class GitHubSyncTransientError extends Error {
  readonly noInlineRetry = true;
  readonly transient = true;
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, input?: { status?: number; code?: string; cause?: unknown }) {
    super(message);
    this.name = "GitHubSyncTransientError";
    this.status = input?.status;
    this.code = input?.code;
    if (input?.cause) {
      this.cause = input.cause;
    }
  }
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const direct = "code" in error ? (error as { code?: unknown }).code : undefined;
  if (typeof direct === "string" && direct.trim()) return direct;
  const cause = "cause" in error ? (error as { cause?: unknown }).cause : undefined;
  if (!cause || typeof cause !== "object") return undefined;
  const causeCode = "code" in cause ? (cause as { code?: unknown }).code : undefined;
  return typeof causeCode === "string" && causeCode.trim() ? causeCode : undefined;
}

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  const status = Number((error as { status?: unknown }).status);
  return Number.isFinite(status) ? status : undefined;
}

export function isGitHubTransientNetworkError(error: unknown): boolean {
  const status = errorStatus(error);
  if (typeof status === "number" && (status === 429 || status >= 500)) return true;
  const code = errorCode(error)?.toLowerCase() ?? "";
  const message =
    error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message.toLowerCase()
      : "";
  return [
    "econnreset",
    "enotfound",
    "etimedout",
    "eai_again",
    "fetch failed",
    "network",
    "timeout",
    "rate limit",
  ].some((signal) => code.includes(signal) || message.includes(signal));
}

function normalizeGitHubSyncError(error: unknown): Error {
  if (isGitHubTransientNetworkError(error)) {
    const status = errorStatus(error);
    const code = errorCode(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "GitHub sync hit a transient network failure.";
    return new GitHubSyncTransientError(
      `GitHub sync deferred after transient failure${code ? ` (${code})` : ""}${status ? ` status=${status}` : ""}: ${message}`,
      { status, code, cause: error },
    );
  }
  return error instanceof Error ? error : new Error("GitHub sync failed.");
}

function incrementContractCount(counts: Record<string, number>, category?: string): void {
  if (!category) return;
  counts[category] = (counts[category] ?? 0) + 1;
}

export function buildGitHubMemorySourceDetails(input: {
  kind: GitHubMemoryArtifactKind;
  repoFullName: string;
  number?: number;
  title: string;
  url?: string | null;
  capturedAt?: string;
}): GitHubMemorySourceDetails {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const artifactPath =
    input.kind === "repo" ? "" : input.kind === "pr" ? `/pull/${input.number}` : `/issues/${input.number}`;
  const artifactLabel = input.kind === "repo" ? "Repository" : input.kind === "pr" ? "PR" : "Issue";
  const sourceRef = `github://${input.repoFullName}${artifactPath}`;
  return {
    sourceRef,
    traceProof: {
      sourceType: "github",
      sourceRef,
      evidence: [
        input.kind === "repo" ? `${artifactLabel}: ${input.title}` : `${artifactLabel} #${input.number}: ${input.title}`,
        ...(input.url ? [input.url] : []),
      ],
      confidence: 0.92,
      capturedAt,
    },
    developerSignals: {
      projectArea: [input.repoFullName],
    },
  };
}

/**
 * GitHub integration client for fetching and processing real developer signals.
 */
export const GitHubClient = {
  /**
   * Fetches recent PRs and Issues from the user's repositories and extracts memories.
   */
  async sync(options: GitHubSyncOptions) {
    const octokit = new Octokit({
      auth: options.accessToken,
      request: {
        timeout: GITHUB_REQUEST_TIMEOUT_MS,
      },
    });
    const memoriesExtracted = [];
    const contractCounts: Record<string, number> = {};
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const repoFullNames: string[] = [];
    let sourceItemCount = 0;
    const seenRepos = new Set<string>();
    const repoPullRequestsByRepo: Record<
      string,
      Array<{
        number: number;
        title: string;
        state: string;
        updatedAt: string | null;
        htmlUrl: string | null;
      }>
    > = {};
    const sinceMs = options.since ? new Date(options.since).getTime() : 0;
    let newestCheckpointMs = sinceMs;
    const startedAt = Date.now();
    const deadline = startedAt + GITHUB_SYNC_BUDGET_MS;
    const budgetExceeded = () => Date.now() >= deadline;

    try {
      for (let repoPage = 1; repoPage <= GITHUB_REPO_MAX_PAGES; repoPage += 1) {
        if (budgetExceeded()) {
          console.warn("[GitHubClient] Sync time budget reached while listing repositories.");
          break;
        }
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
          sort: "updated",
          per_page: GITHUB_REPO_PAGE_SIZE,
          page: repoPage,
        });
        if (repos.length === 0) break;

        for (const repo of repos) {
          if (budgetExceeded()) {
            console.warn("[GitHubClient] Sync time budget reached before finishing repositories.");
            break;
          }
          console.log(`[GitHubClient] Syncing repo: ${repo.full_name}`);
          sourceItemCount += 1;
          const repoKey = `github:repo:${repo.full_name}`;
          const repoFullName = repo.full_name ?? `${repo.owner.login}/${repo.name}`;
          if (!seenRepos.has(repoFullName)) {
            seenRepos.add(repoFullName);
            repoFullNames.push(repoFullName);
          }
          const now = new Date().toISOString();
          if (!seen.has(repoKey)) {
            const sourceDetails = buildGitHubMemorySourceDetails({
              kind: "repo",
              repoFullName,
              title: repoFullName,
              url: repo.html_url,
              capturedAt: now,
            });
            await upsertRecentMemory({
              id: randomUUID(),
              userId: options.userId,
              type: "project",
              content: [
                `GitHub repository ${repoFullName} is connected to MemoryOS.`,
                `Default branch: ${repo.default_branch ?? "unknown"}.`,
                `Last updated: ${repo.updated_at ?? "unknown"}.`,
                repo.description ? `Description: ${repo.description}` : "",
              ].filter(Boolean).join(" "),
              summary: `GitHub repository ${repoFullName} imported as an engineering source.`,
              source: "import",
              status: "active",
              createdAt: now,
              updatedAt: now,
              importanceScore: 0.72,
              confidence: 0.92,
              evidenceCount: sourceDetails.traceProof.evidence.length,
              contractVersion: "memoryos.contract.v1",
              contractCategory: "architecture_note",
              developerSignals: sourceDetails.developerSignals,
              sourceRef: sourceDetails.sourceRef,
              traceProof: sourceDetails.traceProof,
            });
            memoriesExtracted.push({ contractCategory: "architecture_note" });
            incrementContractCount(contractCounts, "architecture_note");
            dedupeKeys.push(repoKey);
          }

          // 2. Fetch recent merged PRs with pagination.
          let reachedPrDeltaBoundary = false;
          const repoPullRequestSummaries: Array<{
            number: number;
            title: string;
            state: string;
            updatedAt: string | null;
            htmlUrl: string | null;
          }> = [];
          for (let prPage = 1; prPage <= GITHUB_ITEM_MAX_PAGES; prPage += 1) {
            if (budgetExceeded()) {
              console.warn(`[GitHubClient] Sync time budget reached in PR loop for ${repo.full_name}.`);
              reachedPrDeltaBoundary = true;
              break;
            }
            const { data: prs } = await octokit.pulls.list({
              owner: repo.owner.login,
              repo: repo.name,
              state: "closed",
              sort: "updated",
              direction: "desc",
              per_page: GITHUB_ITEM_PAGE_SIZE,
              page: prPage,
            });
            if (prs.length === 0) break;
            for (const pr of prs) {
              if (budgetExceeded()) {
                reachedPrDeltaBoundary = true;
                break;
              }
              if (!pr.merged_at) continue;
              sourceItemCount += 1;
              const updatedMs = pr.updated_at ? new Date(pr.updated_at).getTime() : 0;
              if (sinceMs > 0 && updatedMs > 0 && updatedMs <= sinceMs) {
                reachedPrDeltaBoundary = true;
                break;
              }
              if (updatedMs > newestCheckpointMs) newestCheckpointMs = updatedMs;
              repoPullRequestSummaries.push({
                number: pr.number,
                title: pr.title,
                state: pr.state,
                updatedAt: pr.updated_at ?? null,
                htmlUrl: pr.html_url ?? null,
              });

              const prKey = `github:pr:${repo.full_name}:${pr.number}`;
              if (seen.has(prKey)) continue;

              const content = `GitHub PR ${pr.title}: ${pr.body || "No description provided."}\nMerged at: ${pr.merged_at}`;
              const candidates = extractMemory({
                userId: options.userId,
                message: content,
              });

              const now = new Date().toISOString();
              const sourceDetails = buildGitHubMemorySourceDetails({
                kind: "pr",
                repoFullName: repo.full_name ?? `${repo.owner.login}/${repo.name}`,
                number: pr.number,
                title: pr.title,
                url: pr.html_url,
                capturedAt: now,
              });
              for (const candidate of candidates) {
                const sourceRef = candidate.sourceRef ?? sourceDetails.sourceRef;
                await upsertRecentMemory({
                  ...candidate,
                  id: randomUUID(),
                  source: "import",
                  status: "active",
                  createdAt: now,
                  updatedAt: now,
                  importanceScore: 0.8,
                  confidence: 0.9,
                  evidenceCount: 1,
                  developerSignals: {
                    ...candidate.developerSignals,
                    projectArea: Array.from(
                      new Set([
                        ...(candidate.developerSignals?.projectArea ?? []),
                        ...sourceDetails.developerSignals.projectArea,
                      ]),
                    ),
                  },
                  sourceRef,
                  traceProof: {
                    ...sourceDetails.traceProof,
                    sourceRef,
                  },
                });
                memoriesExtracted.push(candidate);
                incrementContractCount(contractCounts, candidate.contractCategory);
              }
              dedupeKeys.push(prKey);
            }
            if (reachedPrDeltaBoundary) break;
          }
          if (repoPullRequestSummaries.length > 0) {
            repoPullRequestsByRepo[repoFullName] = repoPullRequestSummaries.slice(0, 200);
          }

          if (GITHUB_SYNC_INCLUDE_ISSUES) {
            // Issues are intentionally optional for the MVP sync path.
            let reachedIssueDeltaBoundary = false;
            for (let issuePage = 1; issuePage <= GITHUB_ITEM_MAX_PAGES; issuePage += 1) {
              if (budgetExceeded()) {
                console.warn(`[GitHubClient] Sync time budget reached in issue loop for ${repo.full_name}.`);
                reachedIssueDeltaBoundary = true;
                break;
              }
              const { data: issues } = await octokit.issues.listForRepo({
                owner: repo.owner.login,
                repo: repo.name,
                state: "closed",
                sort: "updated",
                direction: "desc",
                per_page: GITHUB_ITEM_PAGE_SIZE,
                page: issuePage,
              });
              if (issues.length === 0) break;
              for (const issue of issues) {
                if (budgetExceeded()) {
                  reachedIssueDeltaBoundary = true;
                  break;
                }
                if (issue.pull_request) continue; // Skip PRs (already handled)
                sourceItemCount += 1;
                const updatedMs = issue.updated_at ? new Date(issue.updated_at).getTime() : 0;
                if (sinceMs > 0 && updatedMs > 0 && updatedMs <= sinceMs) {
                  reachedIssueDeltaBoundary = true;
                  break;
                }
                if (updatedMs > newestCheckpointMs) newestCheckpointMs = updatedMs;

                const issueKey = `github:issue:${repo.full_name}:${issue.number}`;
                if (seen.has(issueKey)) continue;

                const content = `GitHub Issue ${issue.title}: ${issue.body || "No description provided."}\nClosed at: ${issue.closed_at}`;
                const candidates = extractMemory({
                  userId: options.userId,
                  message: content,
                });

                const now = new Date().toISOString();
                const sourceDetails = buildGitHubMemorySourceDetails({
                  kind: "issue",
                  repoFullName: repo.full_name ?? `${repo.owner.login}/${repo.name}`,
                  number: issue.number,
                  title: issue.title,
                  url: issue.html_url,
                  capturedAt: now,
                });
                for (const candidate of candidates) {
                  const sourceRef = candidate.sourceRef ?? sourceDetails.sourceRef;
                  await upsertRecentMemory({
                    ...candidate,
                    id: randomUUID(),
                    source: "import",
                    status: "active",
                    createdAt: now,
                    updatedAt: now,
                    importanceScore: 0.8,
                    confidence: 0.9,
                    evidenceCount: 1,
                    developerSignals: {
                      ...candidate.developerSignals,
                      projectArea: Array.from(
                        new Set([
                          ...(candidate.developerSignals?.projectArea ?? []),
                          ...sourceDetails.developerSignals.projectArea,
                        ]),
                      ),
                    },
                    sourceRef,
                    traceProof: {
                      ...sourceDetails.traceProof,
                      sourceRef,
                    },
                  });
                  memoriesExtracted.push(candidate);
                  incrementContractCount(contractCounts, candidate.contractCategory);
                }
                dedupeKeys.push(issueKey);
              }
              if (reachedIssueDeltaBoundary) break;
            }
          }
        }
      }

      return {
        success: true,
        extractedCount: memoriesExtracted.length,
        sourceItemCount,
        checkpoint: newestCheckpointMs > 0 ? new Date(newestCheckpointMs).toISOString() : new Date().toISOString(),
        dedupeKeys,
        contractCounts,
        repoFullNames,
        repoPullRequestsByRepo,
      };
    } catch (error) {
      const normalized = normalizeGitHubSyncError(error);
      console.error("[GitHubClient] Sync failed:", normalized.message);
      throw normalized;
    }
  },

  /**
   * Exchanges an authorization code for an access token.
   */
  async getAccessToken(code: string, redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "") {
    const body = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID ?? "",
      client_secret: process.env.GITHUB_CLIENT_SECRET ?? "",
      code,
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    });
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || data.error || `GitHub OAuth failed with ${response.status}`);
    }
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data.access_token as string;
  },

  /**
   * Generates the GitHub OAuth authorization URL.
   */
  getAuthorizeUrl(state: string, redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "") {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      redirect_uri: redirectUri,
      scope: GITHUB_OAUTH_SCOPE,
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },
};

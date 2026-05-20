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

const GITHUB_REPO_PAGE_SIZE = Math.max(1, Math.min(100, Number(process.env.GITHUB_SYNC_REPO_PAGE_SIZE ?? 20)));
const GITHUB_REPO_MAX_PAGES = Math.max(1, Number(process.env.GITHUB_SYNC_REPO_MAX_PAGES ?? 3));
const GITHUB_ITEM_PAGE_SIZE = Math.max(1, Math.min(100, Number(process.env.GITHUB_SYNC_ITEM_PAGE_SIZE ?? 20)));
const GITHUB_ITEM_MAX_PAGES = Math.max(1, Number(process.env.GITHUB_SYNC_ITEM_MAX_PAGES ?? 3));
const GITHUB_SYNC_BUDGET_MS = Math.max(5_000, Number(process.env.GITHUB_SYNC_BUDGET_MS ?? 25_000));
const GITHUB_REQUEST_TIMEOUT_MS = Math.max(3_000, Number(process.env.GITHUB_REQUEST_TIMEOUT_MS ?? 10_000));

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
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
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

          // 2. Fetch recent merged PRs with pagination.
          let reachedPrDeltaBoundary = false;
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
              const updatedMs = pr.updated_at ? new Date(pr.updated_at).getTime() : 0;
              if (sinceMs > 0 && updatedMs > 0 && updatedMs <= sinceMs) {
                reachedPrDeltaBoundary = true;
                break;
              }
              if (updatedMs > newestCheckpointMs) newestCheckpointMs = updatedMs;

              const prKey = `github:pr:${repo.full_name}:${pr.number}`;
              if (seen.has(prKey)) continue;

              const content = `GitHub PR ${pr.title}: ${pr.body || "No description provided."}\nMerged at: ${pr.merged_at}`;
              const candidates = extractMemory({
                userId: options.userId,
                message: content,
              });

              const now = new Date().toISOString();
              for (const candidate of candidates) {
                await upsertRecentMemory({
                  ...candidate,
                  id: randomUUID(),
                  source: "chat", // Only allowed types: chat, system, import
                  status: "active",
                  createdAt: now,
                  updatedAt: now,
                  importanceScore: 0.8,
                  confidence: 0.9,
                  evidenceCount: 1,
                  developerSignals: candidate.developerSignals,
                });
                memoriesExtracted.push(candidate);
              }
              dedupeKeys.push(prKey);
            }
            if (reachedPrDeltaBoundary) break;
          }

          // 3. Fetch recent closed issues with pagination.
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
              for (const candidate of candidates) {
                await upsertRecentMemory({
                  ...candidate,
                  id: randomUUID(),
                  source: "chat", // Only allowed types: chat, system, import
                  status: "active",
                  createdAt: now,
                  updatedAt: now,
                  importanceScore: 0.8,
                  confidence: 0.9,
                  evidenceCount: 1,
                  developerSignals: candidate.developerSignals,
                });
                memoriesExtracted.push(candidate);
              }
              dedupeKeys.push(issueKey);
            }
            if (reachedIssueDeltaBoundary) break;
          }
        }
      }

      return {
        success: true,
        extractedCount: memoriesExtracted.length,
        checkpoint: newestCheckpointMs > 0 ? new Date(newestCheckpointMs).toISOString() : new Date().toISOString(),
        dedupeKeys,
      };
    } catch (error) {
      console.error("[GitHubClient] Sync failed:", error);
      throw error;
    }
  },

  /**
   * Exchanges an authorization code for an access token.
   */
  async getAccessToken(code: string) {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data.access_token as string;
  },

  /**
   * Generates the GitHub OAuth authorization URL.
   */
  getAuthorizeUrl(state: string) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      redirect_uri: process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "",
      scope: "repo,read:user",
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },
};

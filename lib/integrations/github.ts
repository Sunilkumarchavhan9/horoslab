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

/**
 * GitHub integration client for fetching and processing real developer signals.
 */
export const GitHubClient = {
  /**
   * Fetches recent PRs and Issues from the user's repositories and extracts memories.
   */
  async sync(options: GitHubSyncOptions) {
    const octokit = new Octokit({ auth: options.accessToken });
    const memoriesExtracted = [];
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];

    try {
      // 1. Fetch recent repositories
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 5,
      });

      for (const repo of repos) {
        console.log(`[GitHubClient] Syncing repo: ${repo.full_name}`);

        // 2. Fetch recent merged PRs
        const { data: prs } = await octokit.pulls.list({
          owner: repo.owner.login,
          repo: repo.name,
          state: "closed",
          sort: "updated",
          direction: "desc",
          per_page: 5,
        });

        for (const pr of prs) {
          if (!pr.merged_at) continue;
          if (options.since && pr.updated_at && new Date(pr.updated_at).getTime() <= new Date(options.since).getTime()) continue;
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

        // 3. Fetch recent closed issues
        const { data: issues } = await octokit.issues.listForRepo({
          owner: repo.owner.login,
          repo: repo.name,
          state: "closed",
          sort: "updated",
          direction: "desc",
          per_page: 5,
        });

        for (const issue of issues) {
          if (issue.pull_request) continue; // Skip PRs (already handled)
          if (options.since && issue.updated_at && new Date(issue.updated_at).getTime() <= new Date(options.since).getTime()) continue;
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
      }

      return {
        success: true,
        extractedCount: memoriesExtracted.length,
        checkpoint: new Date().toISOString(),
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

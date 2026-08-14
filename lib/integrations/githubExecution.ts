import { Octokit } from "@octokit/rest";
import {
  createGitHubExecutionProposal,
  getGitHubExecutionProposal,
  listGitHubExecutionProposalsForUser,
  updateGitHubExecutionProposal,
  type GitHubExecutionKind,
  type GitHubExecutionProposal,
} from "./githubExecutionStore";
import { connectorUserFilter, resolveRequestOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

const DEFAULT_BRIEF_PATH = ".memoryos/company-brain-brief.md";
const READABLE_GITHUB_CONNECTOR_STATUSES = ["connected", "syncing", "error"] as const;

export type GitHubRepoSummary = {
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  private: boolean;
  updatedAt: string | null;
};

export type GitHubUserSummary = {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  htmlUrl: string | null;
};

async function getGitHubAccessTokenForUser(userId: string, orgId?: string): Promise<string | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId, orgId: scopedOrgId }),
      type: "github",
      status: {
        in: [...READABLE_GITHUB_CONNECTOR_STATUSES],
      },
    },
  });
  if (!row?.configJson) return null;
  try {
    const config = JSON.parse(row.configJson) as { accessToken?: string };
    return typeof config.accessToken === "string" ? config.accessToken : null;
  } catch {
    return null;
  }
}

async function getCachedGitHubRepoFullNamesForUser(userId: string, orgId?: string): Promise<string[]> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId, orgId: scopedOrgId }),
      type: "github",
      status: {
        in: [...READABLE_GITHUB_CONNECTOR_STATUSES],
      },
    },
    select: { configJson: true },
  });
  if (!row?.configJson) return [];
  try {
    const config = JSON.parse(row.configJson) as { repoFullNames?: unknown };
    if (!Array.isArray(config.repoFullNames)) return [];
    return config.repoFullNames.filter(
      (item): item is string => typeof item === "string" && item.includes("/"),
    );
  } catch {
    return [];
  }
}

async function getCachedGitHubPullRequestsForRepo(
  userId: string,
  repoFullName: string,
  orgId?: string,
): Promise<Array<{ number: number; title: string; state: string; updatedAt: string | null; htmlUrl: string | null }>> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId, orgId: scopedOrgId }),
      type: "github",
      status: {
        in: [...READABLE_GITHUB_CONNECTOR_STATUSES],
      },
    },
    select: { configJson: true },
  });
  if (!row?.configJson) return [];
  try {
    const config = JSON.parse(row.configJson) as {
      repoPullRequestsByRepo?: Record<
        string,
        Array<{ number: number; title: string; state: string; updatedAt: string | null; htmlUrl: string | null }>
      >;
    };
    const entries = config.repoPullRequestsByRepo?.[repoFullName];
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

async function octokitForUser(userId: string, orgId?: string): Promise<Octokit> {
  const token = await getGitHubAccessTokenForUser(userId, orgId);
  if (!token) {
    throw new Error("GitHub is not connected. Connect GitHub in Connected Intelligence Sources first.");
  }
  return new Octokit({ auth: token });
}

export async function getGitHubOctokitForUser(userId: string, orgId?: string): Promise<Octokit> {
  return octokitForUser(userId, orgId);
}

export async function listGitHubReposForUser(
  userId: string,
  limit = 40,
  orgId?: string,
): Promise<GitHubRepoSummary[]> {
  const mappedLimit = Math.min(Math.max(limit, 1), 100);
  const cached = await getCachedGitHubRepoFullNamesForUser(userId, orgId);
  if (cached.length > 0) {
    return cached.slice(0, mappedLimit).map((fullName) => {
      const [owner = "", name = fullName] = fullName.split("/", 2);
      return {
        fullName,
        owner,
        name,
        defaultBranch: "main",
        private: false,
        updatedAt: null,
      };
    });
  }
  try {
    const octokit = await octokitForUser(userId, orgId);
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: mappedLimit,
    });
    return data.map((repo) => ({
      fullName: repo.full_name,
      owner: repo.owner?.login ?? "",
      name: repo.name,
      defaultBranch: repo.default_branch ?? "main",
      private: repo.private ?? false,
      updatedAt: repo.updated_at ?? null,
    }));
  } catch {
    return cached.slice(0, mappedLimit).map((fullName) => {
      const [owner = "", name = fullName] = fullName.split("/", 2);
      return {
        fullName,
        owner,
        name,
        defaultBranch: "main",
        private: false,
        updatedAt: null,
      };
    });
  }
}

export async function getGitHubProfileForUser(userId: string, orgId?: string): Promise<GitHubUserSummary> {
  const octokit = await octokitForUser(userId, orgId);
  const { data } = await octokit.users.getAuthenticated();
  return {
    login: data.login,
    name: data.name ?? null,
    avatarUrl: data.avatar_url ?? null,
    htmlUrl: data.html_url ?? null,
  };
}

export async function listGitHubPullRequestsForUser(
  userId: string,
  orgId: string | undefined,
  owner: string,
  repo: string,
  limit = 50,
): Promise<Array<{ number: number; title: string; state: string; updatedAt: string | null; htmlUrl: string | null }>> {
  const mappedLimit = Math.min(Math.max(limit, 1), 100);
  const cached = await getCachedGitHubPullRequestsForRepo(userId, `${owner.trim()}/${repo.trim()}`, orgId);
  if (cached.length > 0) {
    return cached.slice(0, mappedLimit);
  }
  try {
    const octokit = await octokitForUser(userId, orgId);
    const { data } = await octokit.pulls.list({
      owner: owner.trim(),
      repo: repo.trim(),
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: mappedLimit,
    });
    return data.map((pull) => ({
      number: pull.number,
      title: pull.title,
      state: pull.state,
      updatedAt: pull.updated_at ?? null,
      htmlUrl: pull.html_url ?? null,
    }));
  } catch {
    return cached.slice(0, mappedLimit);
  }
}

export async function proposeGitHubExecution(input: {
  userId: string;
  kind: GitHubExecutionKind;
  owner: string;
  repo: string;
  body: string;
  issueNumber?: number;
  pullTitle?: string;
  headBranch?: string;
  baseBranch?: string;
  filePath?: string;
}): Promise<GitHubExecutionProposal> {
  if (!input.body.trim()) {
    throw new Error("Body content is required.");
  }
  if (!input.owner.trim() || !input.repo.trim()) {
    throw new Error("Repository owner and name are required.");
  }

  await octokitForUser(input.userId);

  if (input.kind === "issue_comment") {
    const issueNumber = input.issueNumber ?? 0;
    if (!Number.isFinite(issueNumber) || issueNumber < 1) {
      throw new Error("issueNumber must be a positive integer for issue comments.");
    }
    return createGitHubExecutionProposal({
      userId: input.userId,
      kind: "issue_comment",
      owner: input.owner.trim(),
      repo: input.repo.trim(),
      issueNumber: Math.floor(issueNumber),
      body: input.body.trim(),
      pullTitle: null,
      headBranch: null,
      baseBranch: null,
      filePath: null,
    });
  }

  const octokit = await octokitForUser(input.userId);
  const { data: repoMeta } = await octokit.repos.get({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
  });
  const baseBranch = input.baseBranch?.trim() || repoMeta.default_branch || "main";
  const filePath = input.filePath?.trim() || DEFAULT_BRIEF_PATH;

  if (input.kind === "brief_file_commit") {
    return createGitHubExecutionProposal({
      userId: input.userId,
      kind: "brief_file_commit",
      owner: input.owner.trim(),
      repo: input.repo.trim(),
      issueNumber: null,
      body: input.body.trim(),
      pullTitle: null,
      headBranch: baseBranch,
      baseBranch,
      filePath,
    });
  }

  const headBranch =
    input.headBranch?.trim() ||
    `memoryos/continuity-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7)}`;
  const pullTitle = input.pullTitle?.trim() || "MemoryOS: Continue project brief";

  return createGitHubExecutionProposal({
    userId: input.userId,
    kind: "pull_request",
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    issueNumber: null,
    body: input.body.trim(),
    pullTitle,
    headBranch,
    baseBranch,
    filePath,
  });
}

/** @deprecated Use proposeGitHubExecution */
export async function proposeGitHubIssueComment(input: {
  userId: string;
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}): Promise<GitHubExecutionProposal> {
  return proposeGitHubExecution({
    userId: input.userId,
    kind: "issue_comment",
    owner: input.owner,
    repo: input.repo,
    body: input.body,
    issueNumber: input.issueNumber,
  });
}

async function executeBriefFileCommit(
  octokit: Octokit,
  proposal: GitHubExecutionProposal,
): Promise<GitHubExecutionProposal> {
  const branch = proposal.baseBranch ?? "main";
  const path = proposal.filePath ?? DEFAULT_BRIEF_PATH;
  await octokit.git.getRef({
    owner: proposal.owner,
    repo: proposal.repo,
    ref: `heads/${branch}`,
  });
  let sha: string | undefined;
  try {
    const { data: existing } = await octokit.repos.getContent({
      owner: proposal.owner,
      repo: proposal.repo,
      path,
      ref: branch,
    });
    if (!Array.isArray(existing) && existing.type === "file" && "sha" in existing) {
      sha = existing.sha;
    }
  } catch {
    sha = undefined;
  }

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner: proposal.owner,
    repo: proposal.repo,
    path,
    message: "chore(memoryos): update company brain brief",
    content: Buffer.from(proposal.body, "utf8").toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  });
  proposal.status = "executed";
  proposal.executedAt = new Date().toISOString();
  proposal.githubResultUrl = data.commit.html_url ?? null;
  proposal.error = null;
  return proposal;
}

async function executePullRequest(
  octokit: Octokit,
  proposal: GitHubExecutionProposal,
): Promise<GitHubExecutionProposal> {
  const base = proposal.baseBranch ?? "main";
  const head = proposal.headBranch ?? `memoryos/continuity-${Date.now()}`;
  const path = proposal.filePath ?? DEFAULT_BRIEF_PATH;

  const { data: baseRef } = await octokit.git.getRef({
    owner: proposal.owner,
    repo: proposal.repo,
    ref: `heads/${base}`,
  });

  await octokit.git.createRef({
    owner: proposal.owner,
    repo: proposal.repo,
    ref: `refs/heads/${head}`,
    sha: baseRef.object.sha,
  });

  await octokit.repos.createOrUpdateFileContents({
    owner: proposal.owner,
    repo: proposal.repo,
    path,
    message: "feat(memoryos): continuity brief from Company Brain",
    content: Buffer.from(proposal.body, "utf8").toString("base64"),
    branch: head,
  });

  const { data: pr } = await octokit.pulls.create({
    owner: proposal.owner,
    repo: proposal.repo,
    title: proposal.pullTitle ?? "MemoryOS: Continue project brief",
    head,
    base,
    body: proposal.body,
  });

  proposal.status = "executed";
  proposal.executedAt = new Date().toISOString();
  proposal.githubPrNumber = pr.number;
  proposal.githubResultUrl = pr.html_url ?? null;
  proposal.error = null;
  return proposal;
}

export async function mergeGitHubPullRequest(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  number: number;
  mergeMethod?: "merge" | "squash" | "rebase";
  commitTitle?: string;
  commitMessage?: string;
  expectedHeadSha?: string;
}): Promise<{
  merged: boolean;
  sha: string | null;
  mergedAt: string | null;
  message: string | null;
}> {
  const owner = input.owner.trim();
  const repo = input.repo.trim();
  if (!owner || !repo) {
    throw new Error("Repository owner and name are required.");
  }
  if (!Number.isFinite(input.number) || input.number < 1) {
    throw new Error("Pull request number must be a positive integer.");
  }

  const octokit = await octokitForUser(input.userId, input.orgId);
  const { data } = await octokit.pulls.merge({
    owner,
    repo,
    pull_number: Math.floor(input.number),
    ...(input.mergeMethod ? { merge_method: input.mergeMethod } : {}),
    ...(input.commitTitle?.trim() ? { commit_title: input.commitTitle.trim() } : {}),
    ...(input.commitMessage?.trim() ? { commit_message: input.commitMessage.trim() } : {}),
    ...(input.expectedHeadSha?.trim() ? { sha: input.expectedHeadSha.trim() } : {}),
  });
  const mergeData = data as typeof data & { merged_at?: unknown };

  return {
    merged: Boolean(mergeData?.merged),
    sha: typeof mergeData?.sha === "string" ? mergeData.sha : null,
    mergedAt:
      typeof mergeData?.merged_at === "string" && mergeData.merged_at.length > 0 ? mergeData.merged_at : null,
    message: typeof mergeData?.message === "string" ? mergeData.message : null,
  };
}

export async function approveAndExecuteGitHubProposal(input: {
  userId: string;
  proposalId: string;
}): Promise<GitHubExecutionProposal> {
  const proposal = await getGitHubExecutionProposal(input.userId, input.proposalId);
  if (!proposal) {
    throw new Error("Execution proposal not found.");
  }
  if (proposal.status !== "pending") {
    throw new Error(`Proposal is already ${proposal.status}.`);
  }

  const octokit = await octokitForUser(input.userId);

  proposal.status = "approved";
  proposal.reviewedAt = new Date().toISOString();
  await updateGitHubExecutionProposal(proposal);

  try {
    if (proposal.kind === "issue_comment") {
      if (!proposal.issueNumber) {
        throw new Error("Missing issue number for comment proposal.");
      }
      const { data } = await octokit.issues.createComment({
        owner: proposal.owner,
        repo: proposal.repo,
        issue_number: proposal.issueNumber,
        body: proposal.body,
      });
      proposal.status = "executed";
      proposal.executedAt = new Date().toISOString();
      proposal.githubCommentId = data.id;
      proposal.githubResultUrl = data.html_url ?? null;
      proposal.error = null;
    } else if (proposal.kind === "brief_file_commit") {
      await executeBriefFileCommit(octokit, proposal);
    } else if (proposal.kind === "pull_request") {
      await executePullRequest(octokit, proposal);
    } else {
      throw new Error(`Unsupported execution kind: ${proposal.kind}`);
    }
  } catch (error) {
    proposal.status = "failed";
    proposal.error = error instanceof Error ? error.message : "GitHub API call failed.";
  }

  return updateGitHubExecutionProposal(proposal);
}

export async function listPendingGitHubExecutions(userId: string): Promise<GitHubExecutionProposal[]> {
  return (await listGitHubExecutionProposalsForUser(userId, 30)).filter((p) =>
    ["pending", "approved", "failed"].includes(p.status),
  );
}

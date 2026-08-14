import { Octokit } from "@octokit/rest";
import { connectorUserFilter, resolveRequestOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";
import { listGitHubPullRequestsForUser } from "./githubExecution";

const MAX_FILE_BYTES = 512_000;
const READABLE_GITHUB_CONNECTOR_STATUSES = ["connected", "syncing", "error"] as const;

async function octokitForUser(userId: string, orgId?: string): Promise<Octokit> {
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
  if (!row?.configJson) {
    throw new Error("GitHub is not connected. Connect GitHub in Connected Intelligence Sources first.");
  }
  let token: string | null = null;
  try {
    const config = JSON.parse(row.configJson) as { accessToken?: string };
    token = typeof config.accessToken === "string" ? config.accessToken : null;
  } catch {
    token = null;
  }
  if (!token) {
    throw new Error("GitHub is not connected. Connect GitHub in Connected Intelligence Sources first.");
  }
  return new Octokit({ auth: token });
}

export type GitHubRepoEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
};

export type GitHubRepoBranchEntry = {
  name: string;
  protected: boolean;
  commitSha: string | null;
};

export type GitHubPullRequestListEntry = {
  number: number;
  title: string;
  state: string;
  updatedAt: string | null;
  htmlUrl: string | null;
};

export type GitHubPullRequestFileEntry = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
};

export type GitHubPullRequestReviewCommentEntry = {
  id: number;
  body: string;
  path: string | null;
  line: number | null;
  side: string | null;
  user: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GitHubPullRequestReviewEntry = {
  id: number;
  state: string;
  body: string | null;
  submittedAt: string | null;
  user: string | null;
};

export type GitHubPullRequestDetail = {
  number: number;
  title: string;
  state: string;
  body: string | null;
  htmlUrl: string | null;
  baseRef: string | null;
  headRef: string | null;
  headSha: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  reviewComments: number;
  commits: number;
  draft: boolean;
  merged: boolean;
  mergedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  closedAt: string | null;
  files: GitHubPullRequestFileEntry[];
  commentsList: GitHubPullRequestReviewCommentEntry[];
  reviews: GitHubPullRequestReviewEntry[];
  statusState: string | null;
  statusCount: number | null;
};

export async function listGitHubRepoBranches(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  limit?: number;
}): Promise<{ branches: GitHubRepoBranchEntry[]; defaultBranch: string }> {
  const octokit = await octokitForUser(input.userId, input.orgId);
  const owner = input.owner.trim();
  const repo = input.repo.trim();
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 100);
  const { data: repoMeta } = await octokit.repos.get({ owner, repo });
  const { data } = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: limit,
  });
  const defaultBranch = repoMeta.default_branch || "main";
  const branches = data
    .map((branch) => ({
      name: branch.name,
      protected: Boolean(branch.protected),
      commitSha: branch.commit?.sha ?? null,
    }))
    .sort((a, b) => {
      if (a.name === defaultBranch) return -1;
      if (b.name === defaultBranch) return 1;
      return a.name.localeCompare(b.name);
    });
  return { branches, defaultBranch };
}

export async function listGitHubRepoContents(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
}): Promise<{ entries: GitHubRepoEntry[]; ref: string }> {
  const octokit = await octokitForUser(input.userId, input.orgId);
  const { data: repoMeta } = await octokit.repos.get({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
  });
  const ref = input.ref?.trim() || repoMeta.default_branch || "main";
  const path = (input.path ?? "").replace(/^\//, "");

  const { data } = await octokit.repos.getContent({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    path,
    ref,
  });

  const items = Array.isArray(data) ? data : [data];
  const entries: GitHubRepoEntry[] = items
    .map((item) => ({
      name: item.name ?? item.path.split("/").pop() ?? "",
      path: item.path,
      type: item.type === "dir" ? ("dir" as const) : ("file" as const),
      size: item.size,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return { entries, ref };
}

export async function readGitHubRepoFile(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  path: string;
  ref?: string;
}): Promise<{ path: string; content: string; ref: string; sha: string | null }> {
  const octokit = await octokitForUser(input.userId, input.orgId);
  const { data: repoMeta } = await octokit.repos.get({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
  });
  const ref = input.ref?.trim() || repoMeta.default_branch || "main";
  const path = input.path.replace(/^\//, "");

  const { data } = await octokit.repos.getContent({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    path,
    ref,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error("Path is not a file.");
  }
  if (typeof data.size === "number" && data.size > MAX_FILE_BYTES) {
    throw new Error(`File is too large to open in the browser IDE (${data.size} bytes).`);
  }
  if (!("content" in data) || typeof data.content !== "string") {
    throw new Error("Could not read file content.");
  }

  const content = Buffer.from(data.content, "base64").toString("utf8");
  return {
    path: data.path,
    content,
    ref,
    sha: typeof data.sha === "string" ? data.sha : null,
  };
}

export async function listGitHubPullRequests(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  limit?: number;
}): Promise<GitHubPullRequestListEntry[]> {
  const owner = input.owner.trim();
  const repo = input.repo.trim();
  return listGitHubPullRequestsForUser(
    input.userId,
    input.orgId,
    owner,
    repo,
    input.limit ?? 50,
  );
}

export async function getGitHubPullRequestDetail(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  number: number;
  fileLimit?: number;
}): Promise<GitHubPullRequestDetail> {
  const owner = input.owner.trim();
  const repo = input.repo.trim();
  const number = Number(input.number);
  const fileLimit = Math.min(Math.max(input.fileLimit ?? 100, 1), 100);
  try {
    const octokit = await octokitForUser(input.userId, input.orgId);
    const [pullRes, filesRes, commentsRes, reviewsRes] = await Promise.all([
      octokit.pulls.get({ owner, repo, pull_number: number }),
      octokit.pulls.listFiles({ owner, repo, pull_number: number, per_page: fileLimit }),
      octokit.pulls.listReviewComments({ owner, repo, pull_number: number, per_page: 100 }),
      octokit.pulls.listReviews({ owner, repo, pull_number: number, per_page: 100 }),
    ]);

    const pull = pullRes.data;
    const statusRes =
      pull.head.sha
        ? await octokit.repos.getCombinedStatusForRef({
            owner,
            repo,
            ref: pull.head.sha,
          }).catch(() => null)
        : null;

    return {
      number: pull.number,
      title: pull.title,
      state: pull.state,
      body: pull.body ?? null,
      htmlUrl: pull.html_url ?? null,
      baseRef: pull.base.ref ?? null,
      headRef: pull.head.ref ?? null,
      headSha: pull.head.sha ?? null,
      additions: typeof pull.additions === "number" ? pull.additions : 0,
      deletions: typeof pull.deletions === "number" ? pull.deletions : 0,
      changedFiles: typeof pull.changed_files === "number" ? pull.changed_files : 0,
      comments: typeof pull.comments === "number" ? pull.comments : 0,
      reviewComments: typeof pull.review_comments === "number" ? pull.review_comments : 0,
      commits: typeof pull.commits === "number" ? pull.commits : 0,
      draft: Boolean(pull.draft),
      merged: Boolean(pull.merged_at),
      mergedAt: pull.merged_at ?? null,
      updatedAt: pull.updated_at ?? null,
      createdAt: pull.created_at ?? null,
      closedAt: pull.closed_at ?? null,
      files: filesRes.data.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions ?? 0,
        deletions: file.deletions ?? 0,
        changes: file.changes ?? 0,
        patch: file.patch ?? null,
      })),
      commentsList: commentsRes.data.map((comment) => ({
        id: comment.id,
        body: comment.body ?? "",
        path: comment.path ?? null,
        line: typeof comment.line === "number" ? comment.line : null,
        side: typeof comment.side === "string" ? comment.side : null,
        user: comment.user?.login ?? null,
        createdAt: comment.created_at ?? null,
        updatedAt: comment.updated_at ?? null,
      })),
      reviews: reviewsRes.data.map((review) => ({
        id: review.id,
        state: review.state,
        body: review.body ?? null,
        submittedAt: review.submitted_at ?? null,
        user: review.user?.login ?? null,
      })),
      statusState: statusRes?.data.state ?? null,
      statusCount: typeof statusRes?.data.total_count === "number" ? statusRes.data.total_count : null,
    };
  } catch {
    const cached = await listGitHubPullRequestsForUser(
      input.userId,
      input.orgId,
      owner,
      repo,
      Math.max(fileLimit, 50),
    );
    const hit = cached.find((entry) => Number(entry.number) === number);
    if (!hit) {
      throw new Error("Could not load pull request details.");
    }
    return {
      number: hit.number,
      title: hit.title,
      state: hit.state,
      body: null,
      htmlUrl: hit.htmlUrl ?? null,
      baseRef: null,
      headRef: null,
      headSha: null,
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      comments: 0,
      reviewComments: 0,
      commits: 0,
      draft: false,
      merged: hit.state === "closed",
      mergedAt: null,
      updatedAt: hit.updatedAt,
      createdAt: null,
      closedAt: hit.state === "closed" ? hit.updatedAt : null,
      files: [],
      commentsList: [],
      reviews: [],
      statusState: null,
      statusCount: null,
    };
  }
}

export async function writeGitHubRepoFile(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  path: string;
  content: string;
  sha?: string | null;
  ref?: string;
  message?: string;
}): Promise<{ path: string; ref: string; sha: string | null; commitUrl: string | null }> {
  const octokit = await octokitForUser(input.userId, input.orgId);
  const { data: repoMeta } = await octokit.repos.get({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
  });
  const ref = input.ref?.trim() || repoMeta.default_branch || "main";
  const path = input.path.replace(/^\//, "");
  const message =
    input.message?.trim() ||
    `chore(memoryos): update ${path.split("/").pop() ?? path} via Continuity Lab`;

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    path,
    message,
    content: Buffer.from(input.content, "utf8").toString("base64"),
    branch: ref,
    ...(input.sha ? { sha: input.sha } : {}),
  });

  return {
    path,
    ref,
    sha: typeof data.content?.sha === "string" ? data.content.sha : null,
    commitUrl: data.commit.html_url ?? null,
  };
}

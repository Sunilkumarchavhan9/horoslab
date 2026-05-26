import { Octokit } from "@octokit/rest";
import { getConnectorAccessToken } from "./connectorTokens";

const RISKY_PATH_RE =
  /\b(auth|billing|payment|security|middleware|migration|schema|prisma|rate|token|secret|deploy|infra|database|db)\b/i;

export type GitHubOpenIssue = {
  number: number;
  title: string;
  url: string | null;
  updatedAt: string | null;
  labels: string[];
};

export type GitHubRecentCommit = {
  sha: string;
  message: string;
  author: string | null;
  committedAt: string | null;
  url: string | null;
};

export type GitHubRepoAnalysis = {
  owner: string;
  repo: string;
  defaultBranch: string;
  riskyPaths: string[];
  openIssues: GitHubOpenIssue[];
  recentCommits: GitHubRecentCommit[];
  analyzedAt: string;
};

type PathRisk = {
  path: string;
  score: number;
};

function labelNames(labels: GitHubOpenIssue["labels"] | Array<string | { name?: string | null }>): string[] {
  return labels
    .map((label) => (typeof label === "string" ? label : label.name ?? ""))
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
}

function addPathRisk(map: Map<string, PathRisk>, path: string, score: number): void {
  const existing = map.get(path);
  if (existing) {
    existing.score += score;
    return;
  }
  map.set(path, { path, score });
}

export async function analyzeGitHubRepoForUser(
  userId: string,
  owner: string,
  repo: string,
): Promise<GitHubRepoAnalysis> {
  const token = await getConnectorAccessToken(userId, "github");
  if (!token) {
    throw new Error("GitHub is not connected. Connect GitHub before running repo analysis.");
  }

  const octokit = new Octokit({ auth: token });
  const normalizedOwner = owner.trim();
  const normalizedRepo = repo.trim();
  const { data: repoMeta } = await octokit.repos.get({
    owner: normalizedOwner,
    repo: normalizedRepo,
  });
  const defaultBranch = repoMeta.default_branch || "main";

  const [issuesResult, commitsResult, pullsResult] = await Promise.all([
    octokit.issues.listForRepo({
      owner: normalizedOwner,
      repo: normalizedRepo,
      state: "open",
      sort: "updated",
      direction: "desc",
      per_page: 10,
    }),
    octokit.repos.listCommits({
      owner: normalizedOwner,
      repo: normalizedRepo,
      sha: defaultBranch,
      per_page: 10,
    }),
    octokit.pulls.list({
      owner: normalizedOwner,
      repo: normalizedRepo,
      state: "closed",
      sort: "updated",
      direction: "desc",
      per_page: 5,
    }),
  ]);

  const openIssues: GitHubOpenIssue[] = issuesResult.data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      url: issue.html_url ?? null,
      updatedAt: issue.updated_at ?? null,
      labels: labelNames(issue.labels),
    }));

  const recentCommits: GitHubRecentCommit[] = commitsResult.data.map((commit) => ({
    sha: commit.sha.slice(0, 7),
    message: commit.commit.message.split("\n")[0] ?? "",
    author: commit.commit.author?.name ?? commit.author?.login ?? null,
    committedAt: commit.commit.author?.date ?? null,
    url: commit.html_url ?? null,
  }));

  const risky = new Map<string, PathRisk>();
  await Promise.all(
    pullsResult.data.slice(0, 3).map(async (pull) => {
      const files = await octokit.pulls.listFiles({
        owner: normalizedOwner,
        repo: normalizedRepo,
        pull_number: pull.number,
        per_page: 30,
      });
      for (const file of files.data) {
        const changeWeight = Math.min(5, Math.max(1, Math.round((file.changes ?? 0) / 40)));
        const hintWeight = RISKY_PATH_RE.test(file.filename) ? 5 : 0;
        addPathRisk(risky, file.filename, changeWeight + hintWeight);
      }
    }),
  );

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    defaultBranch,
    riskyPaths: [...risky.values()]
      .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
      .slice(0, 8)
      .map((item) => item.path),
    openIssues,
    recentCommits,
    analyzedAt: new Date().toISOString(),
  };
}

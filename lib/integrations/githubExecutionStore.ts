import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type GitHubExecutionKind = "issue_comment" | "brief_file_commit" | "pull_request";

export type GitHubExecutionProposal = {
  id: string;
  userId: string;
  kind: GitHubExecutionKind;
  owner: string;
  repo: string;
  issueNumber: number | null;
  body: string;
  pullTitle: string | null;
  headBranch: string | null;
  baseBranch: string | null;
  filePath: string | null;
  status: "pending" | "approved" | "executed" | "rejected" | "failed";
  createdAt: string;
  reviewedAt: string | null;
  executedAt: string | null;
  githubCommentId: number | null;
  githubPrNumber: number | null;
  githubResultUrl: string | null;
  error: string | null;
};

type Store = {
  proposals: GitHubExecutionProposal[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "github-execution-proposals.json");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeProposal(raw: Partial<GitHubExecutionProposal>): GitHubExecutionProposal {
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    kind: raw.kind === "brief_file_commit" || raw.kind === "pull_request" ? raw.kind : "issue_comment",
    owner: String(raw.owner ?? ""),
    repo: String(raw.repo ?? ""),
    issueNumber:
      typeof raw.issueNumber === "number" && Number.isFinite(raw.issueNumber)
        ? raw.issueNumber
        : null,
    body: String(raw.body ?? ""),
    pullTitle: typeof raw.pullTitle === "string" ? raw.pullTitle : null,
    headBranch: typeof raw.headBranch === "string" ? raw.headBranch : null,
    baseBranch: typeof raw.baseBranch === "string" ? raw.baseBranch : null,
    filePath: typeof raw.filePath === "string" ? raw.filePath : null,
    status:
      raw.status === "approved" ||
      raw.status === "executed" ||
      raw.status === "rejected" ||
      raw.status === "failed"
        ? raw.status
        : "pending",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    reviewedAt: typeof raw.reviewedAt === "string" ? raw.reviewedAt : null,
    executedAt: typeof raw.executedAt === "string" ? raw.executedAt : null,
    githubCommentId:
      typeof raw.githubCommentId === "number" && Number.isFinite(raw.githubCommentId)
        ? raw.githubCommentId
        : null,
    githubPrNumber:
      typeof raw.githubPrNumber === "number" && Number.isFinite(raw.githubPrNumber)
        ? raw.githubPrNumber
        : null,
    githubResultUrl: typeof raw.githubResultUrl === "string" ? raw.githubResultUrl : null,
    error: typeof raw.error === "string" ? raw.error : null,
  };
}

function readStore(): Store {
  ensureDir();
  if (!existsSync(STORE_PATH)) return { proposals: [] };
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<Store>;
    const proposals = Array.isArray(parsed.proposals)
      ? parsed.proposals.map((item) => normalizeProposal(item as Partial<GitHubExecutionProposal>))
      : [];
    return { proposals };
  } catch {
    return { proposals: [] };
  }
}

function writeStore(store: Store): void {
  ensureDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function createGitHubExecutionProposal(
  input: Omit<GitHubExecutionProposal, "id" | "status" | "createdAt" | "reviewedAt" | "executedAt" | "githubCommentId" | "githubPrNumber" | "githubResultUrl" | "error">,
): GitHubExecutionProposal {
  const proposal: GitHubExecutionProposal = {
    ...input,
    id: `gh_exec_${randomUUID().slice(0, 12)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    executedAt: null,
    githubCommentId: null,
    githubPrNumber: null,
    githubResultUrl: null,
    error: null,
  };
  const store = readStore();
  store.proposals.unshift(proposal);
  writeStore(store);
  return proposal;
}

export function listGitHubExecutionProposalsForUser(
  userId: string,
  limit = 20,
): GitHubExecutionProposal[] {
  return readStore()
    .proposals.filter((p) => p.userId === userId)
    .slice(0, limit);
}

export function getGitHubExecutionProposal(
  userId: string,
  proposalId: string,
): GitHubExecutionProposal | null {
  return (
    readStore().proposals.find((p) => p.userId === userId && p.id === proposalId) ?? null
  );
}

export function updateGitHubExecutionProposal(
  proposal: GitHubExecutionProposal,
): GitHubExecutionProposal {
  const store = readStore();
  const index = store.proposals.findIndex((p) => p.id === proposal.id);
  if (index >= 0) store.proposals[index] = proposal;
  else store.proposals.unshift(proposal);
  writeStore(store);
  return proposal;
}

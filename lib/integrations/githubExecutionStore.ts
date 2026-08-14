import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

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

function rowToProposal(row: {
  id: string;
  userId: string;
  kind: string;
  owner: string;
  repo: string;
  issueNumber: number | null;
  body: string;
  pullTitle: string | null;
  headBranch: string | null;
  baseBranch: string | null;
  filePath: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  executedAt: string | null;
  githubCommentId: number | null;
  githubPrNumber: number | null;
  githubResultUrl: string | null;
  error: string | null;
}): GitHubExecutionProposal {
  return normalizeProposal(row as Partial<GitHubExecutionProposal>);
}

async function persistProposal(proposal: GitHubExecutionProposal): Promise<void> {
  await prisma.gitHubExecutionProposal.upsert({
    where: { id: proposal.id },
    create: proposal,
    update: proposal,
  });
}

export async function createGitHubExecutionProposal(
  input: Omit<GitHubExecutionProposal, "id" | "status" | "createdAt" | "reviewedAt" | "executedAt" | "githubCommentId" | "githubPrNumber" | "githubResultUrl" | "error">,
): Promise<GitHubExecutionProposal> {
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
  await persistProposal(proposal);
  return proposal;
}

export async function listGitHubExecutionProposalsForUser(
  userId: string,
  limit = 20,
): Promise<GitHubExecutionProposal[]> {
  const rows = await prisma.gitHubExecutionProposal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 200)),
  });
  return rows.map(rowToProposal);
}

export async function getGitHubExecutionProposal(
  userId: string,
  proposalId: string,
): Promise<GitHubExecutionProposal | null> {
  const row = await prisma.gitHubExecutionProposal.findUnique({
    where: { id: proposalId },
  });
  if (!row) return null;
  const proposal = rowToProposal(row);
  return proposal?.userId === userId ? proposal : null;
}

export async function updateGitHubExecutionProposal(
  proposal: GitHubExecutionProposal,
): Promise<GitHubExecutionProposal> {
  await persistProposal(proposal);
  return proposal;
}

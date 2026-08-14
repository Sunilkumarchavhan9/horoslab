import { randomUUID } from "crypto";
import { continuityUserFilter, normalizeOrgId, resolveRequestOrgId } from "../auth/orgScope";
import { getContinuityThread } from "./continuityThreadStore";
import { prisma } from "../storage/prismaClient";

export type FileChangeProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "applied"
  | "failed";

export type FileChangeProposal = {
  id: string;
  userId: string;
  orgId?: string;
  threadId: string;
  checkpointId: string | null;
  filepath: string;
  instruction: string | null;
  originalText: string;
  newText: string;
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
  status: FileChangeProposalStatus;
  createdAt: string;
  reviewedAt: string | null;
  appliedAt: string | null;
  error: string | null;
};

function normalizeProposal(raw: Partial<FileChangeProposal>): FileChangeProposal {
  const status: FileChangeProposalStatus =
    raw.status === "approved" ||
    raw.status === "rejected" ||
    raw.status === "applied" ||
    raw.status === "failed"
      ? raw.status
      : "pending";

  const orgId = normalizeOrgId(raw.orgId);
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    ...(orgId ? { orgId } : {}),
    threadId: String(raw.threadId ?? ""),
    checkpointId: typeof raw.checkpointId === "string" ? raw.checkpointId : null,
    filepath: String(raw.filepath ?? ""),
    instruction: typeof raw.instruction === "string" ? raw.instruction : null,
    originalText: String(raw.originalText ?? ""),
    newText: String(raw.newText ?? ""),
    startLine: typeof raw.startLine === "number" ? raw.startLine : 0,
    startCharacter: typeof raw.startCharacter === "number" ? raw.startCharacter : 0,
    endLine: typeof raw.endLine === "number" ? raw.endLine : 0,
    endCharacter: typeof raw.endCharacter === "number" ? raw.endCharacter : 0,
    status,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    reviewedAt: typeof raw.reviewedAt === "string" ? raw.reviewedAt : null,
    appliedAt: typeof raw.appliedAt === "string" ? raw.appliedAt : null,
    error: typeof raw.error === "string" ? raw.error : null,
  };
}

function parseProposalRow(dataJson: string): FileChangeProposal | null {
  try {
    return normalizeProposal(JSON.parse(dataJson) as Partial<FileChangeProposal>);
  } catch {
    return null;
  }
}

async function listUserProposals(userId: string, orgId?: string): Promise<FileChangeProposal[]> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const rows = await prisma.continuityFileChange.findMany({
    where: continuityUserFilter({ userId, orgId: scopedOrgId }),
    orderBy: { createdAt: "desc" },
    select: { dataJson: true },
  });
  return rows
    .map((row) => parseProposalRow(row.dataJson))
    .filter((proposal): proposal is FileChangeProposal => proposal !== null);
}

async function getProposalRecord(
  userId: string,
  changeId: string,
  orgId?: string,
): Promise<FileChangeProposal | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.continuityFileChange.findFirst({
    where: { id: changeId, ...continuityUserFilter({ userId, orgId: scopedOrgId }) },
    select: { dataJson: true },
  });
  if (!row) return null;
  return parseProposalRow(row.dataJson);
}

async function upsertProposalRecord(proposal: FileChangeProposal): Promise<void> {
  const orgId = normalizeOrgId(proposal.orgId) ?? null;
  await prisma.continuityFileChange.upsert({
    where: { id: proposal.id },
    create: {
      id: proposal.id,
      userId: proposal.userId,
      orgId,
      threadId: proposal.threadId,
      status: proposal.status,
      createdAt: proposal.createdAt,
      dataJson: JSON.stringify(proposal),
    },
    update: {
      userId: proposal.userId,
      orgId,
      threadId: proposal.threadId,
      status: proposal.status,
      createdAt: proposal.createdAt,
      dataJson: JSON.stringify(proposal),
    },
  });
}

export async function listFileChangeProposals(input: {
  userId: string;
  orgId?: string;
  threadId: string;
  status?: FileChangeProposalStatus;
}): Promise<FileChangeProposal[]> {
  return (await listUserProposals(input.userId, input.orgId))
    .filter((p) => p.userId === input.userId && p.threadId === input.threadId)
    .filter((p) => (input.status ? p.status === input.status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFileChangeProposal(
  userId: string,
  changeId: string,
  orgId?: string,
): Promise<FileChangeProposal | null> {
  return getProposalRecord(userId, changeId, orgId);
}

export async function createFileChangeProposal(input: {
  userId: string;
  orgId?: string;
  threadId: string;
  checkpointId?: string | null;
  filepath: string;
  instruction?: string | null;
  originalText: string;
  newText: string;
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
}): Promise<FileChangeProposal | null> {
  if (!(await getContinuityThread(input.userId, input.threadId, input.orgId))) return null;

  const scopedOrgId = resolveRequestOrgId(input.orgId);
  const proposal: FileChangeProposal = {
    id: randomUUID(),
    userId: input.userId,
    ...(scopedOrgId ? { orgId: scopedOrgId } : {}),
    threadId: input.threadId,
    checkpointId: input.checkpointId ?? null,
    filepath: input.filepath.trim(),
    instruction: input.instruction?.trim() || null,
    originalText: input.originalText,
    newText: input.newText,
    startLine: input.startLine,
    startCharacter: input.startCharacter,
    endLine: input.endLine,
    endCharacter: input.endCharacter,
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    appliedAt: null,
    error: null,
  };

  await upsertProposalRecord(proposal);
  return proposal;
}

export async function reviewFileChangeProposal(
  userId: string,
  changeId: string,
  approved: boolean,
  orgId?: string,
): Promise<FileChangeProposal | null> {
  const proposal = await getProposalRecord(userId, changeId, orgId);
  if (!proposal) return null;
  if (proposal.status !== "pending") return normalizeProposal(proposal);

  proposal.status = approved ? "approved" : "rejected";
  proposal.reviewedAt = new Date().toISOString();
  await upsertProposalRecord(proposal);
  return normalizeProposal(proposal);
}

export async function markFileChangeApplied(
  userId: string,
  changeId: string,
  input?: { error?: string },
  orgId?: string,
): Promise<FileChangeProposal | null> {
  const proposal = await getProposalRecord(userId, changeId, orgId);
  if (!proposal) return null;
  if (proposal.status !== "approved" && !input?.error) return null;

  const now = new Date().toISOString();
  if (input?.error) {
    proposal.status = "failed";
    proposal.error = input.error;
  } else {
    proposal.status = "applied";
    proposal.appliedAt = now;
    proposal.error = null;
  }
  await upsertProposalRecord(proposal);
  return normalizeProposal(proposal);
}

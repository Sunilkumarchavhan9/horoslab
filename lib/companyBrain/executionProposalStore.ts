import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";
import {
  continuityUserFilter,
  normalizeOrgId,
  resolveRequestOrgId,
} from "../auth/orgScope";
import type {
  ExecutionProposal,
  ExecutionProposalStatus,
  ExecutionRiskTier,
} from "./executionTypes";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeStatus(raw: unknown): ExecutionProposalStatus {
  if (raw === "approved" || raw === "rejected" || raw === "executed" || raw === "failed") {
    return raw;
  }
  return "pending";
}

function normalizeRiskTier(raw: unknown): ExecutionRiskTier {
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "medium";
}

export function normalizeExecutionProposal(raw: Partial<ExecutionProposal>): ExecutionProposal {
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    orgId: typeof raw.orgId === "string" ? raw.orgId : raw.orgId === null ? null : undefined,
    adapter: String(raw.adapter ?? ""),
    actionType: String(raw.actionType ?? ""),
    payload:
      raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload)
        ? (raw.payload as Record<string, unknown>)
        : {},
    status: normalizeStatus(raw.status),
    riskTier: normalizeRiskTier(raw.riskTier),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso(),
    reviewedAt: typeof raw.reviewedAt === "string" ? raw.reviewedAt : null,
    reviewedByUserId: typeof raw.reviewedByUserId === "string" ? raw.reviewedByUserId : null,
    executedAt: typeof raw.executedAt === "string" ? raw.executedAt : null,
    rejectionReason: typeof raw.rejectionReason === "string" ? raw.rejectionReason : null,
    secondFactorVerified: raw.secondFactorVerified === true,
    result:
      raw.result && typeof raw.result === "object" && !Array.isArray(raw.result)
        ? (raw.result as Record<string, unknown>)
        : null,
    error: typeof raw.error === "string" ? raw.error : null,
  };
}

function proposalMatchesScope(
  proposal: ExecutionProposal,
  userId: string,
  orgId?: string,
): boolean {
  if (proposal.userId !== userId) return false;
  const scopedOrg = normalizeOrgId(orgId);
  if (!scopedOrg) return true;
  return normalizeOrgId(proposal.orgId) === scopedOrg;
}

function rowToProposal(row: {
  id: string;
  userId: string;
  orgId: string | null;
  adapter: string;
  actionType: string;
  riskTier: string;
  status: string;
  payloadJson: string;
  resultJson: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  executedAt: string | null;
  rejectionReason: string | null;
  secondFactorVerified: boolean;
  error: string | null;
}): ExecutionProposal {
  let payload: Record<string, unknown> = {};
  let result: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(row.payloadJson) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    payload = {};
  }
  if (row.resultJson) {
    try {
      const parsed = JSON.parse(row.resultJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        result = parsed as Record<string, unknown>;
      }
    } catch {
      result = null;
    }
  }
  return normalizeExecutionProposal({
    id: row.id,
    userId: row.userId,
    orgId: row.orgId,
    adapter: row.adapter,
    actionType: row.actionType,
    riskTier: normalizeRiskTier(row.riskTier),
    status: normalizeStatus(row.status),
    payload,
    result,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewedAt: row.reviewedAt,
    reviewedByUserId: row.reviewedByUserId,
    executedAt: row.executedAt,
    rejectionReason: row.rejectionReason,
    secondFactorVerified: row.secondFactorVerified,
    error: row.error,
  });
}

async function upsertProposalRecord(proposal: ExecutionProposal): Promise<void> {
  const orgId = normalizeOrgId(proposal.orgId) ?? null;
  const payloadJson = JSON.stringify(proposal.payload);
  const resultJson = proposal.result ? JSON.stringify(proposal.result) : null;

  await prisma.companyBrainExecutionProposal.upsert({
    where: { id: proposal.id },
    create: {
      id: proposal.id,
      userId: proposal.userId,
      orgId,
      adapter: proposal.adapter,
      actionType: proposal.actionType,
      riskTier: proposal.riskTier,
      status: proposal.status,
      payloadJson,
      resultJson,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      reviewedAt: proposal.reviewedAt,
      reviewedByUserId: proposal.reviewedByUserId,
      executedAt: proposal.executedAt,
      rejectionReason: proposal.rejectionReason,
      secondFactorVerified: proposal.secondFactorVerified,
      error: proposal.error,
    },
    update: {
      userId: proposal.userId,
      orgId,
      adapter: proposal.adapter,
      actionType: proposal.actionType,
      riskTier: proposal.riskTier,
      status: proposal.status,
      payloadJson,
      resultJson,
      updatedAt: proposal.updatedAt,
      reviewedAt: proposal.reviewedAt,
      reviewedByUserId: proposal.reviewedByUserId,
      executedAt: proposal.executedAt,
      rejectionReason: proposal.rejectionReason,
      secondFactorVerified: proposal.secondFactorVerified,
      error: proposal.error,
    },
  });
}

export async function createExecutionProposal(
  input: Omit<
    ExecutionProposal,
    "id" | "status" | "createdAt" | "updatedAt" | "reviewedAt" | "reviewedByUserId" | "executedAt" | "rejectionReason" | "secondFactorVerified" | "result" | "error"
  > & { status?: ExecutionProposalStatus },
): Promise<ExecutionProposal> {
  const createdAt = nowIso();
  const proposal = normalizeExecutionProposal({
    ...input,
    id: `cb_exec_${randomUUID().slice(0, 12)}`,
    status: input.status ?? "pending",
    createdAt,
    updatedAt: createdAt,
    reviewedAt: null,
    reviewedByUserId: null,
    executedAt: null,
    rejectionReason: null,
    secondFactorVerified: false,
    result: null,
    error: null,
  });
  await upsertProposalRecord(proposal);
  return proposal;
}

export async function getExecutionProposal(
  userId: string,
  proposalId: string,
  orgId?: string,
): Promise<ExecutionProposal | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.companyBrainExecutionProposal.findFirst({
    where: { id: proposalId, ...continuityUserFilter({ userId, orgId: scopedOrgId }) },
  });
  if (!row) return null;
  const proposal = rowToProposal(row);
  return proposalMatchesScope(proposal, userId, scopedOrgId) ? proposal : null;
}

export async function listExecutionProposals(
  userId: string,
  options?: { orgId?: string; status?: ExecutionProposalStatus; limit?: number },
): Promise<ExecutionProposal[]> {
  const scopedOrgId = resolveRequestOrgId(options?.orgId);
  const limit = Math.min(Math.max(options?.limit ?? 30, 1), 100);

  const rows = await prisma.companyBrainExecutionProposal.findMany({
    where: {
      ...continuityUserFilter({ userId, orgId: scopedOrgId }),
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows
    .map((row) => rowToProposal(row))
    .filter((proposal) => proposalMatchesScope(proposal, userId, scopedOrgId));
}

export async function saveExecutionProposal(proposal: ExecutionProposal): Promise<ExecutionProposal> {
  const next = normalizeExecutionProposal({
    ...proposal,
    updatedAt: nowIso(),
  });
  await upsertProposalRecord(next);
  return next;
}

export type ExecutionProposalStatusCounts = {
  pending: number;
  approved: number;
  executed: number;
  failed: number;
  rejected: number;
};

function emptyStatusCounts(): ExecutionProposalStatusCounts {
  return {
    pending: 0,
    approved: 0,
    executed: 0,
    failed: 0,
    rejected: 0,
  };
}

function incrementStatusCount(
  counts: ExecutionProposalStatusCounts,
  status: ExecutionProposalStatus,
): void {
  if (status === "pending") counts.pending += 1;
  else if (status === "approved") counts.approved += 1;
  else if (status === "executed") counts.executed += 1;
  else if (status === "failed") counts.failed += 1;
  else if (status === "rejected") counts.rejected += 1;
}

function isWithinLast7Days(isoTimestamp: string): boolean {
  const ms = Date.parse(isoTimestamp);
  if (!Number.isFinite(ms)) return false;
  return ms >= Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export async function countExecutionProposalStats(
  userId: string,
  orgId?: string,
): Promise<{
  last7d: ExecutionProposalStatusCounts;
  allTime: ExecutionProposalStatusCounts;
  pendingApprovals: number;
}> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const last7d = emptyStatusCounts();
  const allTime = emptyStatusCounts();

  const rows = await prisma.companyBrainExecutionProposal.findMany({
    where: continuityUserFilter({ userId, orgId: scopedOrgId }),
    select: { status: true, createdAt: true },
  });
  for (const row of rows) {
    const status = normalizeStatus(row.status);
    incrementStatusCount(allTime, status);
    if (isWithinLast7Days(row.createdAt)) {
      incrementStatusCount(last7d, status);
    }
  }

  return {
    last7d,
    allTime,
    pendingApprovals: allTime.pending + allTime.approved,
  };
}

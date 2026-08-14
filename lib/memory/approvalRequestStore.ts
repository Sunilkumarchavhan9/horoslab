import { createHash, randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

export type MemoryIgnitionApprovalRequestStatus = "pending" | "approved" | "rejected";

export type MemoryIgnitionApprovalOutcomeLink = {
  outcomeEventId: string;
  sourceRef: string;
  sendEventId: string | null;
  targetAgent: string | null;
  targetFormat: string | null;
  futureInheritanceReady: boolean;
  evidence: string[];
  linkedAt: string;
};

export type MemoryIgnitionApprovalRequest = {
  id: string;
  userId: string;
  orgId?: string | null;
  source: "memoryignition_guard";
  runtimeEventId: string;
  guardMoment: "before_agent" | "before_action" | "during_action" | "risk_check";
  action: string;
  status: MemoryIgnitionApprovalRequestStatus;
  riskLevel: string;
  reason: string;
  approvalRequired: boolean;
  blocked: boolean;
  matchedRiskyFiles: string[];
  matchedForbiddenActions: string[];
  missingRequiredTests: string[];
  nextRequiredActions: string[];
  traceProofIds: string[];
  guardProof: Record<string, unknown>;
  outcomeLinks: MemoryIgnitionApprovalOutcomeLink[];
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
};

export type MemoryIgnitionApprovalAuditProof = {
  version: "memoryignition_approval_audit.v1";
  approvalId: string;
  runtimeEventId: string;
  guardMoment: MemoryIgnitionApprovalRequest["guardMoment"];
  action: string;
  status: MemoryIgnitionApprovalRequestStatus;
  riskLevel: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  approvalRequired: boolean;
  blocked: boolean;
  riskScope: {
    matchedRiskyFiles: string[];
    matchedForbiddenActions: string[];
    missingRequiredTests: string[];
    nextRequiredActions: string[];
    traceProofIds: string[];
  };
  decisionHash: string;
  immutableRef: string;
  outcomeEventIds: string[];
  evidence: string[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function parseStringArrayJson(value: string): string[] {
  try {
    return asStringArray(JSON.parse(value) as unknown);
  } catch {
    return [];
  }
}

function parseObjectJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function normalizeStatus(value: unknown): MemoryIgnitionApprovalRequestStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function normalizeGuardMoment(value: unknown): MemoryIgnitionApprovalRequest["guardMoment"] {
  if (
    value === "before_agent" ||
    value === "before_action" ||
    value === "during_action" ||
    value === "risk_check"
  ) {
    return value;
  }
  return "risk_check";
}

function normalizeOutcomeLink(raw: Partial<MemoryIgnitionApprovalOutcomeLink>): MemoryIgnitionApprovalOutcomeLink {
  const linkedAt = typeof raw.linkedAt === "string" ? raw.linkedAt : nowIso();
  return {
    outcomeEventId: String(raw.outcomeEventId ?? ""),
    sourceRef: String(raw.sourceRef ?? "memoryignition:outcome"),
    sendEventId: typeof raw.sendEventId === "string" ? raw.sendEventId : null,
    targetAgent: typeof raw.targetAgent === "string" ? raw.targetAgent : null,
    targetFormat: typeof raw.targetFormat === "string" ? raw.targetFormat : null,
    futureInheritanceReady: raw.futureInheritanceReady === true,
    evidence: asStringArray(raw.evidence),
    linkedAt,
  };
}

function normalizeOutcomeLinks(value: unknown): MemoryIgnitionApprovalOutcomeLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeOutcomeLink(item as Partial<MemoryIgnitionApprovalOutcomeLink>))
    .filter((item) => item.outcomeEventId.length > 0);
}

function parseOutcomeLinksJson(value: string): MemoryIgnitionApprovalOutcomeLink[] {
  try {
    return normalizeOutcomeLinks(JSON.parse(value) as unknown);
  } catch {
    return [];
  }
}

function toApprovalRequest(row: {
  id: string;
  userId: string;
  orgId: string | null;
  source: string;
  runtimeEventId: string;
  guardMoment: string;
  action: string;
  status: string;
  riskLevel: string;
  reason: string;
  approvalRequired: boolean;
  blocked: boolean;
  matchedRiskyFilesJson: string;
  matchedForbiddenActionsJson: string;
  missingRequiredTestsJson: string;
  nextRequiredActionsJson: string;
  traceProofIdsJson: string;
  guardProofJson: string;
  outcomeLinksJson: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
}): MemoryIgnitionApprovalRequest {
  return {
    id: row.id,
    userId: row.userId,
    orgId: row.orgId,
    source: "memoryignition_guard",
    runtimeEventId: row.runtimeEventId,
    guardMoment: normalizeGuardMoment(row.guardMoment),
    action: row.action,
    status: normalizeStatus(row.status),
    riskLevel: row.riskLevel,
    reason: row.reason,
    approvalRequired: row.approvalRequired,
    blocked: row.blocked,
    matchedRiskyFiles: parseStringArrayJson(row.matchedRiskyFilesJson),
    matchedForbiddenActions: parseStringArrayJson(row.matchedForbiddenActionsJson),
    missingRequiredTests: parseStringArrayJson(row.missingRequiredTestsJson),
    nextRequiredActions: parseStringArrayJson(row.nextRequiredActionsJson),
    traceProofIds: parseStringArrayJson(row.traceProofIdsJson),
    guardProof: parseObjectJson(row.guardProofJson),
    outcomeLinks: parseOutcomeLinksJson(row.outcomeLinksJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewedAt: row.reviewedAt,
    reviewedBy: row.reviewedBy,
    reviewNote: row.reviewNote,
  };
}

function matchesScopeWhere(userId: string, orgId?: string | null) {
  return {
    userId,
    ...(orgId ? { orgId } : {}),
  };
}

function pendingDedupKey(request: Pick<MemoryIgnitionApprovalRequest, "userId" | "orgId" | "guardMoment" | "action">): string {
  return [
    request.userId,
    request.orgId ?? "",
    request.guardMoment,
    request.action.trim().toLowerCase().slice(0, 240),
  ].join("::");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function buildApprovalDecisionHash(request: MemoryIgnitionApprovalRequest): string {
  return createHash("sha256")
    .update(stableJson({
      action: request.action,
      approvalRequired: request.approvalRequired,
      blocked: request.blocked,
      createdAt: request.createdAt,
      guardMoment: request.guardMoment,
      id: request.id,
      matchedForbiddenActions: request.matchedForbiddenActions,
      matchedRiskyFiles: request.matchedRiskyFiles,
      missingRequiredTests: request.missingRequiredTests,
      nextRequiredActions: request.nextRequiredActions,
      reason: request.reason,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy,
      reviewNote: request.reviewNote,
      riskLevel: request.riskLevel,
      runtimeEventId: request.runtimeEventId,
      status: request.status,
      traceProofIds: request.traceProofIds,
    }))
    .digest("hex");
}

export function buildMemoryIgnitionApprovalAuditProof(
  request: MemoryIgnitionApprovalRequest,
): MemoryIgnitionApprovalAuditProof {
  const decisionHash = buildApprovalDecisionHash(request);
  return {
    version: "memoryignition_approval_audit.v1",
    approvalId: request.id,
    runtimeEventId: request.runtimeEventId,
    guardMoment: request.guardMoment,
    action: request.action,
    status: request.status,
    riskLevel: request.riskLevel,
    requestedAt: request.createdAt,
    reviewedAt: request.reviewedAt,
    reviewedBy: request.reviewedBy,
    reviewNote: request.reviewNote,
    approvalRequired: request.approvalRequired,
    blocked: request.blocked,
    riskScope: {
      matchedRiskyFiles: request.matchedRiskyFiles,
      matchedForbiddenActions: request.matchedForbiddenActions,
      missingRequiredTests: request.missingRequiredTests,
      nextRequiredActions: request.nextRequiredActions,
      traceProofIds: request.traceProofIds,
    },
    decisionHash,
    immutableRef: `approval_audit:${request.id}:${decisionHash.slice(0, 16)}`,
    outcomeEventIds: request.outcomeLinks.map((link) => link.outcomeEventId),
    evidence: [
      `approval:${request.id}`,
      `runtime:${request.runtimeEventId}`,
      `guard:${request.guardMoment}`,
      `risk:${request.riskLevel}`,
      ...request.traceProofIds.map((id) => `trace:${id}`),
      ...(request.reviewedBy ? [`reviewer:${request.reviewedBy}`] : []),
      ...request.outcomeLinks.map((link) => `outcome:${link.outcomeEventId}`),
    ],
  };
}

export async function listMemoryIgnitionApprovalRequests(options: {
  userId: string;
  orgId?: string | null;
  status?: MemoryIgnitionApprovalRequestStatus;
  limit?: number;
}): Promise<MemoryIgnitionApprovalRequest[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const rows = await prisma.memoryIgnitionApprovalRequest.findMany({
    where: {
      ...matchesScopeWhere(options.userId, options.orgId),
      ...(options.status ? { status: options.status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map(toApprovalRequest);
}

export async function upsertMemoryIgnitionApprovalRequest(
  input: Omit<
    MemoryIgnitionApprovalRequest,
    | "id"
    | "source"
    | "status"
    | "outcomeLinks"
    | "createdAt"
    | "updatedAt"
    | "reviewedAt"
    | "reviewedBy"
    | "reviewNote"
  >,
): Promise<MemoryIgnitionApprovalRequest> {
  const nextAt = nowIso();
  const key = pendingDedupKey({
    userId: input.userId,
    orgId: input.orgId,
    guardMoment: input.guardMoment,
    action: input.action,
  });
  const pendingRows = await prisma.memoryIgnitionApprovalRequest.findMany({
    where: {
      ...matchesScopeWhere(input.userId, input.orgId),
      status: "pending",
      guardMoment: input.guardMoment,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const existing = pendingRows.map(toApprovalRequest).find((request) => pendingDedupKey(request) === key);

  const data = {
    userId: input.userId,
    orgId: input.orgId ?? null,
    source: "memoryignition_guard",
    runtimeEventId: input.runtimeEventId,
    guardMoment: input.guardMoment,
    action: input.action,
    status: "pending",
    riskLevel: input.riskLevel,
    reason: input.reason,
    approvalRequired: input.approvalRequired,
    blocked: input.blocked,
    matchedRiskyFilesJson: JSON.stringify(input.matchedRiskyFiles),
    matchedForbiddenActionsJson: JSON.stringify(input.matchedForbiddenActions),
    missingRequiredTestsJson: JSON.stringify(input.missingRequiredTests),
    nextRequiredActionsJson: JSON.stringify(input.nextRequiredActions),
    traceProofIdsJson: JSON.stringify(input.traceProofIds),
    guardProofJson: JSON.stringify(input.guardProof),
    updatedAt: nextAt,
  };

  const row = existing
    ? await prisma.memoryIgnitionApprovalRequest.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.memoryIgnitionApprovalRequest.create({
        data: {
          id: `mi_appr_${randomUUID().slice(0, 12)}`,
          ...data,
          outcomeLinksJson: "[]",
          createdAt: nextAt,
          reviewedAt: null,
          reviewedBy: null,
          reviewNote: null,
        },
      });

  return toApprovalRequest(row);
}

export async function findApprovedMemoryIgnitionApprovalRequest(input: {
  userId: string;
  orgId?: string | null;
  guardMoment: MemoryIgnitionApprovalRequest["guardMoment"];
  action: string;
}): Promise<MemoryIgnitionApprovalRequest | null> {
  const key = pendingDedupKey({
    userId: input.userId,
    orgId: input.orgId,
    guardMoment: input.guardMoment,
    action: input.action,
  });
  const rows = await prisma.memoryIgnitionApprovalRequest.findMany({
    where: {
      ...matchesScopeWhere(input.userId, input.orgId),
      status: "approved",
      guardMoment: input.guardMoment,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return rows
    .map(toApprovalRequest)
    .filter((request) => request.outcomeLinks.length === 0)
    .find((request) => pendingDedupKey(request) === key) ?? null;
}

export async function reviewMemoryIgnitionApprovalRequest(options: {
  id: string;
  userId: string;
  orgId?: string | null;
  decision: "approve" | "reject";
  reviewedBy: string;
  note?: string | null;
}): Promise<MemoryIgnitionApprovalRequest | null> {
  const target = await prisma.memoryIgnitionApprovalRequest.findFirst({
    where: {
      id: options.id,
      ...matchesScopeWhere(options.userId, options.orgId),
    },
  });
  if (!target) return null;

  const reviewedAt = nowIso();
  const row = await prisma.memoryIgnitionApprovalRequest.update({
    where: { id: target.id },
    data: {
      status: options.decision === "approve" ? "approved" : "rejected",
      reviewedAt,
      reviewedBy: options.reviewedBy,
      reviewNote: options.note ?? null,
      updatedAt: reviewedAt,
    },
  });
  return toApprovalRequest(row);
}

export async function attachOutcomeToMemoryIgnitionApprovalRequests(options: {
  userId: string;
  orgId?: string | null;
  approvalIds: string[];
  outcome: MemoryIgnitionApprovalOutcomeLink;
}): Promise<MemoryIgnitionApprovalRequest[]> {
  const ids = Array.from(new Set(options.approvalIds.filter((id) => id.trim().length > 0)));
  if (ids.length === 0) return [];

  const rows = await prisma.memoryIgnitionApprovalRequest.findMany({
    where: {
      id: { in: ids },
      ...matchesScopeWhere(options.userId, options.orgId),
    },
  });
  const linkedAt = nowIso();
  const normalizedOutcome = normalizeOutcomeLink({
    ...options.outcome,
    linkedAt: options.outcome.linkedAt || linkedAt,
  });

  const updated: MemoryIgnitionApprovalRequest[] = [];
  for (const row of rows) {
    const request = toApprovalRequest(row);
    const existingIndex = request.outcomeLinks.findIndex(
      (link) => link.outcomeEventId === normalizedOutcome.outcomeEventId,
    );
    const outcomeLinks =
      existingIndex >= 0
        ? request.outcomeLinks.map((link, index) => (index === existingIndex ? normalizedOutcome : link))
        : [normalizedOutcome, ...request.outcomeLinks];
    const nextRow = await prisma.memoryIgnitionApprovalRequest.update({
      where: { id: row.id },
      data: {
        outcomeLinksJson: JSON.stringify(outcomeLinks),
        updatedAt: linkedAt,
      },
    });
    updated.push(toApprovalRequest(nextRow));
  }

  return updated;
}

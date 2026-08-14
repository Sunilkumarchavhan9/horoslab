import { randomUUID } from "crypto";
import { continuityUserFilter, normalizeOrgId, resolveRequestOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";
import type {
  ActionMemory,
  ActionMemoryOutcome,
  ActionMemorySourceType,
  ActionMemoryWithLineage,
  ApprovalDecision,
  ApprovalTraceRecord,
  CreateActionMemoryInput,
  ExecutionOutcomeRecord,
} from "./actionMemoryTypes";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeOutcome(raw: unknown): ActionMemoryOutcome {
  if (raw === "success" || raw === "failed" || raw === "rolled_back") return raw;
  return "failed";
}

function normalizeSourceType(raw: unknown): ActionMemorySourceType | null {
  if (raw === "github_execution" || raw === "continuity" || raw === "manual") return raw;
  return null;
}

function normalizeDecision(raw: unknown): ApprovalDecision {
  if (raw === "approved" || raw === "rejected") return raw;
  return "rejected";
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === "string");
}

export function normalizeActionMemory(raw: Partial<ActionMemory>): ActionMemory {
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : nowIso();
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    orgId: typeof raw.orgId === "string" ? raw.orgId : raw.orgId === null ? null : undefined,
    projectId:
      typeof raw.projectId === "string" ? raw.projectId : raw.projectId === null ? null : undefined,
    workspace:
      typeof raw.workspace === "string" ? raw.workspace : raw.workspace === null ? null : undefined,
    action: String(raw.action ?? ""),
    reason: String(raw.reason ?? ""),
    approvedBy: typeof raw.approvedBy === "string" ? raw.approvedBy : raw.approvedBy === null ? null : undefined,
    approvedAt: typeof raw.approvedAt === "string" ? raw.approvedAt : raw.approvedAt === null ? null : undefined,
    filesChanged: parseStringArray(raw.filesChanged),
    outcome: normalizeOutcome(raw.outcome),
    followUps: parseStringArray(raw.followUps),
    sourceType: normalizeSourceType(raw.sourceType),
    sourceId: typeof raw.sourceId === "string" ? raw.sourceId : raw.sourceId === null ? null : undefined,
    metadata:
      raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
        ? (raw.metadata as Record<string, unknown>)
        : raw.metadata === null
          ? null
          : undefined,
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
  };
}

function entryMatchesScope(
  entry: { userId: string; orgId?: string | null },
  userId: string,
  orgId?: string,
): boolean {
  if (entry.userId !== userId) return false;
  const scopedOrg = normalizeOrgId(orgId);
  if (!scopedOrg) return true;
  return normalizeOrgId(entry.orgId) === scopedOrg;
}

export function normalizeExecutionOutcome(raw: Partial<ExecutionOutcomeRecord>): ExecutionOutcomeRecord {
  return {
    id: String(raw.id ?? ""),
    actionMemoryId:
      typeof raw.actionMemoryId === "string"
        ? raw.actionMemoryId
        : raw.actionMemoryId === null
          ? null
          : undefined,
    userId: String(raw.userId ?? ""),
    orgId: typeof raw.orgId === "string" ? raw.orgId : raw.orgId === null ? null : undefined,
    goal: typeof raw.goal === "string" ? raw.goal : raw.goal === null ? null : undefined,
    planSummary:
      typeof raw.planSummary === "string" ? raw.planSummary : raw.planSummary === null ? null : undefined,
    resultSummary:
      typeof raw.resultSummary === "string"
        ? raw.resultSummary
        : raw.resultSummary === null
          ? null
          : undefined,
    status: String(raw.status ?? ""),
    errorMessage:
      typeof raw.errorMessage === "string" ? raw.errorMessage : raw.errorMessage === null ? null : undefined,
    connectorAdapter:
      typeof raw.connectorAdapter === "string"
        ? raw.connectorAdapter
        : raw.connectorAdapter === null
          ? null
          : undefined,
    externalRef:
      typeof raw.externalRef === "string" ? raw.externalRef : raw.externalRef === null ? null : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso(),
  };
}

export function normalizeApprovalTrace(raw: Partial<ApprovalTraceRecord>): ApprovalTraceRecord {
  return {
    id: String(raw.id ?? ""),
    actionMemoryId:
      typeof raw.actionMemoryId === "string"
        ? raw.actionMemoryId
        : raw.actionMemoryId === null
          ? null
          : undefined,
    userId: String(raw.userId ?? ""),
    orgId: typeof raw.orgId === "string" ? raw.orgId : raw.orgId === null ? null : undefined,
    approverId: String(raw.approverId ?? ""),
    decision: normalizeDecision(raw.decision),
    reason: typeof raw.reason === "string" ? raw.reason : raw.reason === null ? null : undefined,
    riskTier: typeof raw.riskTier === "string" ? raw.riskTier : raw.riskTier === null ? null : undefined,
    proposalId:
      typeof raw.proposalId === "string" ? raw.proposalId : raw.proposalId === null ? null : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso(),
  };
}

function rowToActionMemory(row: {
  id: string;
  userId: string;
  orgId: string | null;
  projectId: string | null;
  workspace: string | null;
  action: string;
  reason: string;
  approvedBy: string | null;
  approvedAt: string | null;
  filesChangedJson: string;
  outcome: string;
  followUpsJson: string;
  sourceType: string | null;
  sourceId: string | null;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
}): ActionMemory {
  let filesChanged: string[] = [];
  let followUps: string[] = [];
  let metadata: Record<string, unknown> | null = null;
  try {
    filesChanged = parseStringArray(JSON.parse(row.filesChangedJson));
  } catch {
    filesChanged = [];
  }
  try {
    followUps = parseStringArray(JSON.parse(row.followUpsJson));
  } catch {
    followUps = [];
  }
  if (row.metadataJson) {
    try {
      const parsed = JSON.parse(row.metadataJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      }
    } catch {
      metadata = null;
    }
  }
  return normalizeActionMemory({
    id: row.id,
    userId: row.userId,
    orgId: row.orgId,
    projectId: row.projectId,
    workspace: row.workspace,
    action: row.action,
    reason: row.reason,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    filesChanged,
    outcome: normalizeOutcome(row.outcome),
    followUps,
    sourceType: normalizeSourceType(row.sourceType),
    sourceId: row.sourceId,
    metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

async function upsertActionMemoryRecord(actionMemory: ActionMemory): Promise<void> {
  const orgId = normalizeOrgId(actionMemory.orgId) ?? null;
  const filesChangedJson = JSON.stringify(actionMemory.filesChanged);
  const followUpsJson = JSON.stringify(actionMemory.followUps);
  const metadataJson = actionMemory.metadata ? JSON.stringify(actionMemory.metadata) : null;

  await prisma.actionMemory.upsert({
    where: { id: actionMemory.id },
    create: {
      id: actionMemory.id,
      userId: actionMemory.userId,
      orgId,
      projectId: actionMemory.projectId ?? null,
      workspace: actionMemory.workspace ?? null,
      action: actionMemory.action,
      reason: actionMemory.reason,
      approvedBy: actionMemory.approvedBy ?? null,
      approvedAt: actionMemory.approvedAt ?? null,
      filesChangedJson,
      outcome: actionMemory.outcome,
      followUpsJson,
      sourceType: actionMemory.sourceType ?? null,
      sourceId: actionMemory.sourceId ?? null,
      metadataJson,
      createdAt: actionMemory.createdAt,
      updatedAt: actionMemory.updatedAt,
    },
    update: {
      orgId,
      projectId: actionMemory.projectId ?? null,
      workspace: actionMemory.workspace ?? null,
      action: actionMemory.action,
      reason: actionMemory.reason,
      approvedBy: actionMemory.approvedBy ?? null,
      approvedAt: actionMemory.approvedAt ?? null,
      filesChangedJson,
      outcome: actionMemory.outcome,
      followUpsJson,
      sourceType: actionMemory.sourceType ?? null,
      sourceId: actionMemory.sourceId ?? null,
      metadataJson,
      updatedAt: actionMemory.updatedAt,
    },
  });
}

async function insertExecutionOutcomeRecord(outcome: ExecutionOutcomeRecord): Promise<void> {
  const orgId = normalizeOrgId(outcome.orgId) ?? null;

  await prisma.executionOutcome.upsert({
    where: { id: outcome.id },
    create: {
      id: outcome.id,
      actionMemoryId: outcome.actionMemoryId ?? null,
      userId: outcome.userId,
      orgId,
      goal: outcome.goal ?? null,
      planSummary: outcome.planSummary ?? null,
      resultSummary: outcome.resultSummary ?? null,
      status: outcome.status,
      errorMessage: outcome.errorMessage ?? null,
      connectorAdapter: outcome.connectorAdapter ?? null,
      externalRef: outcome.externalRef ?? null,
      createdAt: outcome.createdAt,
    },
    update: {
      actionMemoryId: outcome.actionMemoryId ?? null,
      orgId,
      goal: outcome.goal ?? null,
      planSummary: outcome.planSummary ?? null,
      resultSummary: outcome.resultSummary ?? null,
      status: outcome.status,
      errorMessage: outcome.errorMessage ?? null,
      connectorAdapter: outcome.connectorAdapter ?? null,
      externalRef: outcome.externalRef ?? null,
    },
  });
}

async function insertApprovalTraceRecord(trace: ApprovalTraceRecord): Promise<void> {
  const orgId = normalizeOrgId(trace.orgId) ?? null;

  await prisma.approvalTrace.upsert({
    where: { id: trace.id },
    create: {
      id: trace.id,
      actionMemoryId: trace.actionMemoryId ?? null,
      userId: trace.userId,
      orgId,
      approverId: trace.approverId,
      decision: trace.decision,
      reason: trace.reason ?? null,
      riskTier: trace.riskTier ?? null,
      proposalId: trace.proposalId ?? null,
      createdAt: trace.createdAt,
    },
    update: {
      actionMemoryId: trace.actionMemoryId ?? null,
      orgId,
      approverId: trace.approverId,
      decision: trace.decision,
      reason: trace.reason ?? null,
      riskTier: trace.riskTier ?? null,
      proposalId: trace.proposalId ?? null,
    },
  });
}

export async function createActionMemory(input: CreateActionMemoryInput): Promise<ActionMemory> {
  const createdAt = nowIso();
  const actionMemory = normalizeActionMemory({
    ...input,
    id: `act_mem_${randomUUID().slice(0, 12)}`,
    filesChanged: input.filesChanged ?? [],
    followUps: input.followUps ?? [],
    createdAt,
    updatedAt: createdAt,
  });
  await upsertActionMemoryRecord(actionMemory);
  return actionMemory;
}

export async function getActionMemory(
  userId: string,
  actionMemoryId: string,
  orgId?: string,
): Promise<ActionMemory | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);

  const row = await prisma.actionMemory.findFirst({
    where: { id: actionMemoryId, ...continuityUserFilter({ userId, orgId: scopedOrgId }) },
  });
  if (!row) return null;
  const actionMemory = rowToActionMemory(row);
  return entryMatchesScope(actionMemory, userId, scopedOrgId) ? actionMemory : null;
}

export async function listActionMemories(
  userId: string,
  options?: { orgId?: string; limit?: number; sourceId?: string },
): Promise<ActionMemory[]> {
  const scopedOrgId = resolveRequestOrgId(options?.orgId);
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

  const rows = await prisma.actionMemory.findMany({
    where: {
      ...continuityUserFilter({ userId, orgId: scopedOrgId }),
      ...(options?.sourceId ? { sourceId: options.sourceId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows
    .map((row) => rowToActionMemory(row))
    .filter((entry) => entryMatchesScope(entry, userId, scopedOrgId));
}

export async function listActionMemoriesWithLineage(
  userId: string,
  options?: { orgId?: string; limit?: number; sourceId?: string },
): Promise<ActionMemoryWithLineage[]> {
  const actions = await listActionMemories(userId, options);
  return Promise.all(
    actions.map(async (actionMemory) => {
      const lineage = await getLineageForActionMemory(userId, actionMemory.id, options?.orgId);
      return {
        actionMemory,
        executionOutcome: lineage.executionOutcomes[0],
        approvalTraces: lineage.approvalTraces,
      };
    }),
  );
}

export async function createExecutionOutcome(
  input: Omit<ExecutionOutcomeRecord, "id" | "createdAt">,
): Promise<ExecutionOutcomeRecord> {
  const outcome = normalizeExecutionOutcome({
    ...input,
    id: `exec_out_${randomUUID().slice(0, 12)}`,
    createdAt: nowIso(),
  });
  await insertExecutionOutcomeRecord(outcome);
  return outcome;
}

export async function createApprovalTrace(
  input: Omit<ApprovalTraceRecord, "id" | "createdAt">,
): Promise<ApprovalTraceRecord> {
  const trace = normalizeApprovalTrace({
    ...input,
    id: `appr_tr_${randomUUID().slice(0, 12)}`,
    createdAt: nowIso(),
  });
  await insertApprovalTraceRecord(trace);
  return trace;
}

export async function getLineageForActionMemory(
  userId: string,
  actionMemoryId: string,
  orgId?: string,
): Promise<{
  executionOutcomes: ExecutionOutcomeRecord[];
  approvalTraces: ApprovalTraceRecord[];
}> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const actionMemory = await getActionMemory(userId, actionMemoryId, scopedOrgId);
  if (!actionMemory) {
    return { executionOutcomes: [], approvalTraces: [] };
  }

  const [executionOutcomes, approvalTraces] = await Promise.all([
    prisma.executionOutcome.findMany({
      where: { actionMemoryId, ...continuityUserFilter({ userId, orgId: scopedOrgId }) },
      orderBy: { createdAt: "desc" },
    }),
    prisma.approvalTrace.findMany({
      where: { actionMemoryId, ...continuityUserFilter({ userId, orgId: scopedOrgId }) },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    executionOutcomes: executionOutcomes.map((row) =>
      normalizeExecutionOutcome({
        id: row.id,
        actionMemoryId: row.actionMemoryId,
        userId: row.userId,
        orgId: row.orgId,
        goal: row.goal,
        planSummary: row.planSummary,
        resultSummary: row.resultSummary,
        status: row.status,
        errorMessage: row.errorMessage,
        connectorAdapter: row.connectorAdapter,
        externalRef: row.externalRef,
        createdAt: row.createdAt,
      }),
    ),
    approvalTraces: approvalTraces.map((row) =>
      normalizeApprovalTrace({
        id: row.id,
        actionMemoryId: row.actionMemoryId,
        userId: row.userId,
        orgId: row.orgId,
        approverId: row.approverId,
        decision: row.decision,
        reason: row.reason,
        riskTier: row.riskTier,
        proposalId: row.proposalId,
        createdAt: row.createdAt,
      }),
    ),
  };
}

export async function linkActionMemoryToProposal(
  userId: string,
  actionMemoryId: string,
  proposalId: string,
  orgId?: string,
): Promise<ActionMemory | null> {
  const existing = await getActionMemory(userId, actionMemoryId, orgId);
  if (!existing) return null;
  const updated = normalizeActionMemory({
    ...existing,
    sourceId: proposalId,
    updatedAt: nowIso(),
  });
  await upsertActionMemoryRecord(updated);
  return updated;
}

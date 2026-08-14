import { randomUUID } from "crypto";
import {
  continuityUserFilter,
  normalizeOrgId,
  resolveRequestOrgId,
} from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";
import type {
  CreateOperationalLoopInput,
  OperationalLoop,
  OperationalLoopState,
} from "./operationalLoopTypes";

const VALID_STATES = new Set<OperationalLoopState>([
  "goal_set",
  "plan_proposed",
  "awaiting_approval",
  "executing",
  "completed",
  "failed",
  "rolled_back",
]);

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeState(raw: unknown): OperationalLoopState {
  if (typeof raw === "string" && VALID_STATES.has(raw as OperationalLoopState)) {
    return raw as OperationalLoopState;
  }
  return "goal_set";
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === "string");
}

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function normalizeOperationalLoop(raw: Partial<OperationalLoop>): OperationalLoop {
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : nowIso();
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    orgId: typeof raw.orgId === "string" ? raw.orgId : raw.orgId === null ? null : undefined,
    goal: String(raw.goal ?? ""),
    projectId:
      typeof raw.projectId === "string" ? raw.projectId : raw.projectId === null ? null : undefined,
    currentState: normalizeState(raw.currentState),
    linkedProposalIds: parseStringArray(raw.linkedProposalIds),
    linkedActionMemoryIds: parseStringArray(raw.linkedActionMemoryIds),
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
    metadata: parseMetadata(raw.metadata),
  };
}

function loopMatchesScope(loop: OperationalLoop, userId: string, orgId?: string): boolean {
  if (loop.userId !== userId) return false;
  const scopedOrg = normalizeOrgId(orgId);
  if (!scopedOrg) return true;
  return normalizeOrgId(loop.orgId) === scopedOrg;
}

function rowToLoop(row: {
  id: string;
  userId: string;
  orgId: string | null;
  goal: string;
  projectId: string | null;
  currentState: string;
  linkedProposalIdsJson: string;
  linkedActionMemoryIdsJson: string;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
}): OperationalLoop {
  let linkedProposalIds: string[] = [];
  let linkedActionMemoryIds: string[] = [];
  let metadata: Record<string, unknown> = {};
  try {
    linkedProposalIds = parseStringArray(JSON.parse(row.linkedProposalIdsJson));
  } catch {
    linkedProposalIds = [];
  }
  try {
    linkedActionMemoryIds = parseStringArray(JSON.parse(row.linkedActionMemoryIdsJson));
  } catch {
    linkedActionMemoryIds = [];
  }
  if (row.metadataJson) {
    try {
      metadata = parseMetadata(JSON.parse(row.metadataJson));
    } catch {
      metadata = {};
    }
  }
  return normalizeOperationalLoop({
    id: row.id,
    userId: row.userId,
    orgId: row.orgId,
    goal: row.goal,
    projectId: row.projectId,
    currentState: normalizeState(row.currentState),
    linkedProposalIds,
    linkedActionMemoryIds,
    metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

async function upsertLoopRecord(loop: OperationalLoop): Promise<void> {
  const orgId = normalizeOrgId(loop.orgId) ?? null;
  const linkedProposalIdsJson = JSON.stringify(loop.linkedProposalIds);
  const linkedActionMemoryIdsJson = JSON.stringify(loop.linkedActionMemoryIds);
  const metadataJson = JSON.stringify(loop.metadata);

  await prisma.operationalLoop.upsert({
    where: { id: loop.id },
    create: {
      id: loop.id,
      userId: loop.userId,
      orgId,
      goal: loop.goal,
      projectId: loop.projectId ?? null,
      currentState: loop.currentState,
      linkedProposalIdsJson,
      linkedActionMemoryIdsJson,
      metadataJson,
      createdAt: loop.createdAt,
      updatedAt: loop.updatedAt,
    },
    update: {
      userId: loop.userId,
      orgId,
      goal: loop.goal,
      projectId: loop.projectId ?? null,
      currentState: loop.currentState,
      linkedProposalIdsJson,
      linkedActionMemoryIdsJson,
      metadataJson,
      updatedAt: loop.updatedAt,
    },
  });
}

export async function createOperationalLoop(
  userId: string,
  input: CreateOperationalLoopInput,
  orgId?: string,
): Promise<OperationalLoop> {
  const createdAt = nowIso();
  const loop = normalizeOperationalLoop({
    id: `cb_loop_${randomUUID().slice(0, 12)}`,
    userId,
    orgId: normalizeOrgId(orgId) ?? null,
    goal: input.goal.trim(),
    projectId: input.projectId ?? null,
    currentState: "goal_set",
    linkedProposalIds: [],
    linkedActionMemoryIds: [],
    metadata: input.metadata ?? {},
    createdAt,
    updatedAt: createdAt,
  });
  await upsertLoopRecord(loop);
  return loop;
}

export async function getOperationalLoop(
  userId: string,
  loopId: string,
  orgId?: string,
): Promise<OperationalLoop | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.operationalLoop.findFirst({
    where: { id: loopId, ...continuityUserFilter({ userId, orgId: scopedOrgId }) },
  });
  if (!row) return null;
  const loop = rowToLoop(row);
  return loopMatchesScope(loop, userId, scopedOrgId) ? loop : null;
}

export async function findOperationalLoopByProposalId(
  userId: string,
  proposalId: string,
  orgId?: string,
): Promise<OperationalLoop | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const loops = await listOperationalLoops(userId, { orgId: scopedOrgId, limit: 100 });
  return loops.find((loop) => loop.linkedProposalIds.includes(proposalId)) ?? null;
}

export async function listOperationalLoops(
  userId: string,
  options?: {
    orgId?: string;
    projectId?: string;
    states?: OperationalLoopState[];
    limit?: number;
  },
): Promise<OperationalLoop[]> {
  const scopedOrgId = resolveRequestOrgId(options?.orgId);
  const limit = Math.min(Math.max(options?.limit ?? 30, 1), 100);
  const stateFilter = options?.states?.length ? new Set(options.states) : null;
  const projectKey = options?.projectId?.trim().toLowerCase();

  const rows = await prisma.operationalLoop.findMany({
    where: {
      ...continuityUserFilter({ userId, orgId: scopedOrgId }),
      ...(projectKey ? { projectId: options?.projectId } : {}),
      ...(stateFilter ? { currentState: { in: [...stateFilter] } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows
    .map((row) => rowToLoop(row))
    .filter((loop) => loopMatchesScope(loop, userId, scopedOrgId));
}

export async function saveOperationalLoop(loop: OperationalLoop): Promise<OperationalLoop> {
  const next = normalizeOperationalLoop({
    ...loop,
    updatedAt: nowIso(),
  });
  await upsertLoopRecord(next);
  return next;
}

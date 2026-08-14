import { randomUUID } from "crypto";
import { normalizeOrgId, resolveRequestOrgId } from "../auth/orgScope";
import { getProductAgent, isKnownProductAgent } from "./productAgents";
import { listExecutionProposals } from "../companyBrain/executionProposalStore";
import { extractAgentLineageFromPayload } from "./agentLineage";
import { listOperationalLoops } from "../companyBrain/operationalLoopStore";
import { prisma } from "../storage/prismaClient";

export type ProductAgentSessionStatus = "active" | "ended";

export type ProductAgentSession = {
  model?: string | null;
  id: string;
  userId: string;
  orgId?: string | null;
  agentId: string;
  projectId?: string | null;
  goal?: string | null;
  goalId?: string | null;
  status: ProductAgentSessionStatus;
  createdAt: string;
  updatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeStatus(raw: unknown): ProductAgentSessionStatus {
  return raw === "ended" ? "ended" : "active";
}

export function normalizeProductAgentSession(
  raw: Partial<ProductAgentSession>,
): ProductAgentSession {
  const modelVal = typeof raw.model === 'string' ? raw.model : raw.model === null ? null : undefined;

  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : nowIso();
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    orgId: typeof raw.orgId === "string" ? raw.orgId : raw.orgId === null ? null : undefined,
    agentId: String(raw.agentId ?? ""),
    projectId:
      typeof raw.projectId === "string" ? raw.projectId : raw.projectId === null ? null : undefined,
    goal: typeof raw.goal === "string" ? raw.goal : raw.goal === null ? null : undefined,
    goalId: typeof raw.goalId === "string" ? raw.goalId : raw.goalId === null ? null : undefined,
    status: normalizeStatus(raw.status),
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
  };
}

function sessionMatchesScope(
  session: ProductAgentSession,
  userId: string,
  orgId?: string,
): boolean {
  if (session.userId !== userId) return false;
  const scopedOrg = normalizeOrgId(orgId);
  if (!scopedOrg) return true;
  return normalizeOrgId(session.orgId) === scopedOrg;
}

async function upsertSessionRecord(session: ProductAgentSession): Promise<void> {
  await prisma.productAgentSession.upsert({
    where: { id: session.id },
    create: {
      id: session.id,
      userId: session.userId,
      orgId: normalizeOrgId(session.orgId) ?? null,
      agentId: session.agentId,
      projectId: session.projectId ?? null,
      goal: session.goal ?? null,
      goalId: session.goalId ?? null,
      status: session.status,
      model: session.model ?? null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    update: {
      userId: session.userId,
      orgId: normalizeOrgId(session.orgId) ?? null,
      agentId: session.agentId,
      projectId: session.projectId ?? null,
      goal: session.goal ?? null,
      goalId: session.goalId ?? null,
      status: session.status,
      model: session.model ?? null,
      updatedAt: session.updatedAt,
    },
  });
}

export type CreateProductAgentSessionInput = {
  model?: string;
  agentId: string;
  projectId?: string | null;
  goal?: string | null;
  goalId?: string | null;
};

export async function createProductAgentSession(
  userId: string,
  input: CreateProductAgentSessionInput,
  orgId?: string,
): Promise<ProductAgentSession> {
  const agentId = input.agentId.trim();
  if (!isKnownProductAgent(agentId)) {
    throw new Error(`Unknown product agent "${agentId}".`);
  }

  const createdAt = nowIso();
  const session = normalizeProductAgentSession({
    id: `pa_sess_${randomUUID().slice(0, 12)}`,
    userId,
    orgId: normalizeOrgId(orgId) ?? null,
    agentId,
    projectId: input.projectId ?? null,
    goal: input.goal?.trim() || null,
    goalId: input.goalId?.trim() || null,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  });
  await upsertSessionRecord(session);
  return session;
}

export async function getProductAgentSession(
  userId: string,
  sessionId: string,
  orgId?: string,
): Promise<ProductAgentSession | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.productAgentSession.findFirst({
    where: {
      id: sessionId,
      userId,
      ...(scopedOrgId ? { orgId: scopedOrgId } : {}),
    },
  });
  const session = row ? normalizeProductAgentSession(row as Partial<ProductAgentSession>) : null;
  return session ? normalizeProductAgentSession(session) : null;
}

export async function countSessionLinks(
  userId: string,
  sessionId: string,
  orgId?: string,
): Promise<{ loops: number; proposals: number }> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const loops = await listOperationalLoops(userId, { orgId: scopedOrgId, limit: 100 });
  const loopCount = loops.filter((loop) => {
    const metaSessionId =
      typeof loop.metadata?.productAgentSessionId === "string"
        ? loop.metadata.productAgentSessionId
        : undefined;
    return loop.id === sessionId || metaSessionId === sessionId;
  }).length;

  const proposals = await listExecutionProposals(userId, { orgId: scopedOrgId, limit: 100 });
  const proposalCount = proposals.filter((proposal) => {
    const lineage = extractAgentLineageFromPayload(proposal.payload);
    return lineage.sessionId === sessionId;
  }).length;

  return { loops: loopCount, proposals: proposalCount };
}

export async function getProductAgentSessionDetail(
  userId: string,
  sessionId: string,
  orgId?: string,
): Promise<{
  session: ProductAgentSession;
  agent: NonNullable<ReturnType<typeof getProductAgent>>;
  counts: { loops: number; proposals: number };
} | null> {
  const session = await getProductAgentSession(userId, sessionId, orgId);
  if (!session) return null;
  const agent = getProductAgent(session.agentId);
  if (!agent) return null;
  const counts = await countSessionLinks(userId, sessionId, orgId);
  return { session, agent, counts };
}

export async function listProductAgentSessions(
  userId: string,
  options?: { orgId?: string; agentId?: string; limit?: number },
): Promise<ProductAgentSession[]> {
  const scopedOrgId = resolveRequestOrgId(options?.orgId);
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const agentFilter = options?.agentId?.trim();

  const rows = await prisma.productAgentSession.findMany({
    where: {
      userId,
      ...(scopedOrgId ? { orgId: scopedOrgId } : {}),
      ...(agentFilter ? { agentId: agentFilter } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map((entry) => normalizeProductAgentSession(entry as Partial<ProductAgentSession>));
}

/** Test helper - reset Prisma-backed product agent sessions. */
export async function resetProductAgentSessionStoreForTests(): Promise<void> {
  await prisma.productAgentSession.deleteMany();
}

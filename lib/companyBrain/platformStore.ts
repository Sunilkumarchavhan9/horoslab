import {
  companyBrainPlatformKey,
  companyBrainPlatformOrgId,
  resolveRequestOrgId,
} from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

export type CompanyBrainSourceType =
  | "github"
  | "notion"
  | "local_files"
  | "slack"
  | "gmail"
  | "zendesk"
  | "jira"
  | "support"
  | "crm"
  | "db";

export type CompanyBrainUserState = {
  sources: Array<{
    id: string;
    userId: string;
    type: CompanyBrainSourceType;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    config: Record<string, unknown>;
  }>;
  graph: {
    nodes: Array<{
      id: string;
      type: "person" | "team" | "system" | "policy" | "incident" | "decision" | "runbook" | "risk";
      label: string;
      confidence: number;
      evidenceMemoryIds: string[];
      sourceTypes: CompanyBrainSourceType[];
      firstSeenAt: string;
      lastSeenAt: string;
      attributes?: Record<string, unknown>;
    }>;
    edges: Array<{
      id: string;
      from: string;
      to: string;
      relation:
        | "owns"
        | "depends_on"
        | "blocked_by"
        | "resolved_by"
        | "governed_by"
        | "implements"
        | "escalates_to"
        | "mitigates"
        | "informs"
        | "decides_for";
      confidence: number;
      evidenceMemoryIds: string[];
      firstSeenAt: string;
      lastSeenAt: string;
    }>;
    updatedAt: string | null;
  };
  skills: {
    items: Array<{
      id: string;
      title: string;
      body: string;
      confidence: number;
      provenance: string[];
      requiredApprovals: Array<"owner" | "admin" | "operator">;
      riskLevel: "low" | "medium" | "high";
      executionConstraints: string[];
      tests: string[];
    }>;
    updatedAt: string | null;
  };
  actions: Array<{
    id: string;
    userId: string;
    name: string;
    payload: Record<string, unknown>;
    risk: "low" | "medium" | "high";
    status: "pending" | "approved" | "executed" | "rejected" | "failed";
    requiredApprovals: Array<"owner" | "admin" | "operator">;
    approvals: Array<{
      reviewerUserId: string;
      reviewerRole: "owner" | "admin" | "operator" | "viewer";
      decision: "approve" | "reject";
      at: string;
    }>;
    executionConstraints: string[];
    executionResult?: { ok: boolean; detail: string; externalRef?: string };
    createdAt: string;
    updatedAt: string;
  }>;
  audit: Array<{
    id: string;
    userId: string;
    type: string;
    at: string;
    detail: string;
  }>;
  queue: Array<{
    id: string;
    userId: string;
    type: "sync_all_sources" | "rebuild_graph" | "compile_skills";
    status: "queued" | "running" | "completed" | "failed";
    createdAt: string;
    updatedAt: string;
    error?: string;
  }>;
  scheduler: {
    enabled: boolean;
    intervalSeconds: number;
    lastTickAt: string | null;
    lastError: string | null;
  };
  roles: Array<{
    userId: string;
    role: "owner" | "admin" | "operator" | "viewer";
    scopes: string[];
  }>;
  governance: {
    riskPolicy: Record<
      "low" | "medium" | "high",
      {
        autoExecute: boolean;
        requiredApprovals: Array<"owner" | "admin" | "operator">;
      }
    >;
  };
  compliance: {
    sourcePolicies: Record<
      CompanyBrainSourceType,
      {
        redactPII: boolean;
        retentionClass: "short" | "standard" | "extended";
        ttlHours: number;
        requireReplayApproval: boolean;
      }
    >;
  };
  auditReplayApprovals: Array<{
    id: string;
    from?: string;
    to?: string;
    status: "pending" | "approved" | "rejected";
    requestedBy: string;
    reviewedBy?: string;
    createdAt: string;
    reviewedAt?: string;
    usedAt?: string;
    usedBy?: string;
    note?: string;
  }>;
  sourceEvents: Array<{
    id: string;
    sourceType: CompanyBrainSourceType;
    payload: Record<string, unknown>;
    status: "pending" | "processed" | "failed" | "dead_letter";
    attempts: number;
    createdAt: string;
    updatedAt: string;
    nextAttemptAt?: string;
    deadLetteredAt?: string;
    error?: string;
  }>;
  sre: {
    alerts: Array<{
      id: string;
      at: string;
      level: "info" | "warning" | "critical";
      message: string;
      context?: Record<string, unknown>;
    }>;
    workers: Array<{
      id: string;
      name: string;
      status: "idle" | "running" | "error";
      lastHeartbeatAt: string | null;
      lastError: string | null;
    }>;
  };
};

export type CompanyBrainStoreFile = {
  users: Record<string, CompanyBrainUserState>;
};

let postgresHydrated = false;
let postgresCache: Map<string, CompanyBrainUserState> | null = null;
const postgresDirtyUsers = new Set<string>();
let postgresFlushPromise: Promise<void> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

export function defaultCompanyBrainUserState(): CompanyBrainUserState {
  return {
    sources: [],
    graph: { nodes: [], edges: [], updatedAt: null },
    skills: { items: [], updatedAt: null },
    actions: [],
    audit: [],
    queue: [],
    scheduler: { enabled: false, intervalSeconds: 300, lastTickAt: null, lastError: null },
    roles: [],
    governance: {
      riskPolicy: {
        low: { autoExecute: true, requiredApprovals: ["operator"] },
        medium: { autoExecute: false, requiredApprovals: ["admin", "operator"] },
        high: { autoExecute: false, requiredApprovals: ["owner", "admin"] },
      },
    },
    compliance: {
      sourcePolicies: {
        github: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 90, requireReplayApproval: false },
        notion: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 90, requireReplayApproval: false },
        local_files: { redactPII: true, retentionClass: "extended", ttlHours: 24 * 180, requireReplayApproval: false },
        slack: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 30, requireReplayApproval: true },
        gmail: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 30, requireReplayApproval: true },
        zendesk: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 30, requireReplayApproval: true },
        jira: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 60, requireReplayApproval: true },
        support: { redactPII: true, retentionClass: "short", ttlHours: 24 * 30, requireReplayApproval: true },
        crm: { redactPII: true, retentionClass: "extended", ttlHours: 24 * 180, requireReplayApproval: true },
        db: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 90, requireReplayApproval: true },
      },
    },
    auditReplayApprovals: [],
    sourceEvents: [],
    sre: {
      alerts: [],
      workers: [],
    },
  };
}

function parseUserState(dataJson: string): CompanyBrainUserState | null {
  try {
    const parsed = JSON.parse(dataJson) as Partial<CompanyBrainUserState>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...defaultCompanyBrainUserState(),
      ...parsed,
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      graph: parsed.graph && typeof parsed.graph === "object"
        ? {
            nodes: Array.isArray(parsed.graph.nodes) ? parsed.graph.nodes : [],
            edges: Array.isArray(parsed.graph.edges) ? parsed.graph.edges : [],
            updatedAt: parsed.graph.updatedAt ?? null,
          }
        : { nodes: [], edges: [], updatedAt: null },
      skills: parsed.skills && typeof parsed.skills === "object"
        ? {
            items: Array.isArray(parsed.skills.items) ? parsed.skills.items : [],
            updatedAt: parsed.skills.updatedAt ?? null,
          }
        : { items: [], updatedAt: null },
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      scheduler: parsed.scheduler && typeof parsed.scheduler === "object"
        ? {
            enabled: Boolean(parsed.scheduler.enabled),
            intervalSeconds: Number(parsed.scheduler.intervalSeconds) || 300,
            lastTickAt: parsed.scheduler.lastTickAt ?? null,
            lastError: parsed.scheduler.lastError ?? null,
          }
        : defaultCompanyBrainUserState().scheduler,
      roles: Array.isArray(parsed.roles) ? parsed.roles : [],
      governance: parsed.governance && typeof parsed.governance === "object"
        ? parsed.governance as CompanyBrainUserState["governance"]
        : defaultCompanyBrainUserState().governance,
      compliance: parsed.compliance && typeof parsed.compliance === "object"
        ? parsed.compliance as CompanyBrainUserState["compliance"]
        : defaultCompanyBrainUserState().compliance,
      auditReplayApprovals: Array.isArray(parsed.auditReplayApprovals) ? parsed.auditReplayApprovals : [],
      sourceEvents: Array.isArray(parsed.sourceEvents) ? parsed.sourceEvents : [],
      sre: parsed.sre && typeof parsed.sre === "object"
        ? {
            alerts: Array.isArray(parsed.sre.alerts) ? parsed.sre.alerts : [],
            workers: Array.isArray(parsed.sre.workers) ? parsed.sre.workers : [],
          }
        : { alerts: [], workers: [] },
    };
  } catch {
    return null;
  }
}

function getPostgresCache(): Map<string, CompanyBrainUserState> {
  if (!postgresCache) {
    postgresCache = new Map();
  }
  return postgresCache;
}

async function persistPostgresUser(
  userId: string,
  state: CompanyBrainUserState,
  orgId?: string,
): Promise<void> {
  const updatedAt = nowIso();
  const scopedOrgId = companyBrainPlatformOrgId(orgId);
  await prisma.companyBrainPlatformState.upsert({
    where: { userId_orgId: { userId, orgId: scopedOrgId } },
    create: {
      userId,
      orgId: scopedOrgId,
      updatedAt,
      dataJson: JSON.stringify(state),
    },
    update: {
      updatedAt,
      dataJson: JSON.stringify(state),
    },
  });
}

function schedulePostgresFlush(): void {
  if (postgresFlushPromise) return;
  postgresFlushPromise = (async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const cacheKeys = [...postgresDirtyUsers];
    postgresDirtyUsers.clear();
    for (const cacheKey of cacheKeys) {
      const state = getPostgresCache().get(cacheKey);
      if (!state) continue;
      const splitAt = cacheKey.indexOf("::");
      const userId = splitAt >= 0 ? cacheKey.slice(0, splitAt) : cacheKey;
      const orgId = splitAt >= 0 ? cacheKey.slice(splitAt + 2) : undefined;
      try {
        await persistPostgresUser(userId, state, orgId);
      } catch (error) {
        console.error(
          "[company-brain] Failed to persist platform state",
          cacheKey,
          error instanceof Error ? error.message : error,
        );
        postgresDirtyUsers.add(cacheKey);
      }
    }
    postgresFlushPromise = null;
    if (postgresDirtyUsers.size > 0) {
      schedulePostgresFlush();
    }
  })();
}

export async function hydrateCompanyBrainPlatformStore(): Promise<void> {
  if (postgresHydrated) return;

  await prisma.$connect();
  const rows = await prisma.companyBrainPlatformState.findMany({
    select: { userId: true, orgId: true, dataJson: true },
  });
  const cache = getPostgresCache();
  for (const row of rows) {
    const state = parseUserState(row.dataJson);
    if (!state) continue;
    const key = companyBrainPlatformKey(row.userId, row.orgId || undefined);
    cache.set(key, state);
  }
  postgresHydrated = true;
}

export async function flushCompanyBrainPlatformStore(): Promise<void> {
  if (postgresFlushPromise) {
    await postgresFlushPromise;
  }
  const cacheKeys = [...postgresDirtyUsers];
  postgresDirtyUsers.clear();
  for (const cacheKey of cacheKeys) {
    const state = getPostgresCache().get(cacheKey);
    if (!state) continue;
    const splitAt = cacheKey.indexOf("::");
    const userId = splitAt >= 0 ? cacheKey.slice(0, splitAt) : cacheKey;
    const orgId = splitAt >= 0 ? cacheKey.slice(splitAt + 2) : undefined;
    await persistPostgresUser(userId, state, orgId);
  }
}

export function readCompanyBrainStore(): CompanyBrainStoreFile {
  const users: Record<string, CompanyBrainUserState> = {};
  for (const [userId, state] of getPostgresCache().entries()) {
    users[userId] = state;
  }
  return { users };
}

export function mutateCompanyBrainUser<T>(
  userId: string,
  fn: (state: CompanyBrainUserState) => T,
  orgId?: string,
): T {
  const scopedOrg = resolveRequestOrgId(orgId);
  const cacheKey = companyBrainPlatformKey(userId, scopedOrg);
  const scopedOrgId = companyBrainPlatformOrgId(scopedOrg);

  void scopedOrgId;
  const cache = getPostgresCache();
  const state = cache.get(cacheKey) ?? defaultCompanyBrainUserState();
  const result = fn(state);
  cache.set(cacheKey, state);
  postgresDirtyUsers.add(cacheKey);
  schedulePostgresFlush();
  return result;
}

export function getCompanyBrainStoreBackend(): "postgres" {
  return "postgres";
}

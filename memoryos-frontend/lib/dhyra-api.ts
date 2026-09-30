"use client";

import { getMemoryOSOrgHeaders, readClerkOrganizationId, readDevConsoleOrganizationId } from "@/lib/org-scope-client";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { createMasterplanWorkspace, listMasterplanWorkspaces } from "@/lib/masterplan-api";

// Use the stable V12 route. The legacy /api/dhyra prefix remains server-side
// only for compatibility with older clients.
const DHYRA_BASE = "/api/v1/dhyra";
const configuredDhyraApiOrigin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() ?? "";
const DHYRA_API_ORIGIN = configuredDhyraApiOrigin && configuredDhyraApiOrigin.toLowerCase() !== "same-origin"
  ? configuredDhyraApiOrigin.replace(/\/$/, "")
  : "";
const ACTIVE_DHYRA_WORKSPACE_STORAGE_KEY_PREFIX = "memoryos.dhyra.activeWorkspaceId";

type ApiEnvelope<T> =
  | {
      ok: true;
      data: T;
      meta?: unknown;
    }
  | {
      ok: false;
      error?: {
        code?: string;
        message?: string;
      };
      meta?: unknown;
    };

async function readJson<T = unknown>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message
        : null;
    throw new Error(message || `Dhyra request failed (${response.status}).`);
  }

  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok) return payload.data;
    throw new Error(payload.error?.message || "Dhyra request failed.");
  }

  return payload as T;
}

async function dhyraFetchOnce(path: string, init?: RequestInit): Promise<Response> {
  const requestPath = `${DHYRA_BASE}${path}`;
  const url = DHYRA_API_ORIGIN ? `${DHYRA_API_ORIGIN}${requestPath}` : requestPath;
  const token = await getOrCreateMemoryToken();
  return fetch(url, {
    ...init,
    cache: "no-store",
    credentials: DHYRA_API_ORIGIN ? "include" : "same-origin",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getMemoryOSOrgHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

function clearPersistedActiveDhyraWorkspaceId(): void {
  if (typeof window === "undefined") return;
  const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
  window.localStorage.removeItem(`${ACTIVE_DHYRA_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`);
}

function replaceWorkspaceIdInPath(path: string, workspaceId: string): string | null {
  const match = path.match(/^\/workspaces\/([^/]+)(\/.*)$/);
  if (!match) return null;
  return `/workspaces/${encodeURIComponent(workspaceId)}${match[2]}`;
}

async function dhyraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await dhyraFetchOnce(path, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;
    const workspaceNotFound =
      response.status === 404 &&
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error?.code === "WORKSPACE_NOT_FOUND";

    if (workspaceNotFound && replaceWorkspaceIdInPath(path, "") !== null) {
      clearPersistedActiveDhyraWorkspaceId();
      const resolvedWorkspaceId = await resolveActiveDhyraWorkspaceId().catch(() => null);
      if (resolvedWorkspaceId) {
        const nextPath = replaceWorkspaceIdInPath(path, resolvedWorkspaceId);
        if (nextPath) {
          const retryResponse = await dhyraFetchOnce(nextPath, init);
          return readJson<T>(retryResponse);
        }
      }
    }

    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message
        : null;
    throw new Error(message || `Dhyra request failed (${response.status}).`);
  }

  return readJson<T>(response);
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...getMemoryOSOrgHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  return readJson<T>(response);
}

export function readActiveDhyraWorkspaceId(): string | null {
  if (typeof window !== "undefined") {
    const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
    const cached = window.localStorage.getItem(`${ACTIVE_DHYRA_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`);
    if (cached && cached.trim().length > 0) {
      return cached.trim();
    }
  }

  return null;
}

function persistActiveDhyraWorkspaceId(workspaceId: string | null): void {
  if (typeof window === "undefined") return;
  const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
  const storageKey = `${ACTIVE_DHYRA_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`;

  if (workspaceId && workspaceId.trim().length > 0) {
    window.localStorage.setItem(storageKey, workspaceId.trim());
    return;
  }

  window.localStorage.removeItem(storageKey);
}

async function readValidatedActiveDhyraWorkspaceId(): Promise<string | null> {
  const cached = readActiveDhyraWorkspaceId();
  const workspaces = await listMasterplanWorkspaces().catch(() => []);

  if (cached && workspaces.some((workspace) => workspace.id === cached)) {
    return cached;
  }

  if (cached) {
    persistActiveDhyraWorkspaceId(null);
  }

  return workspaces[0]?.id ?? null;
}

export async function resolveActiveDhyraWorkspaceId(): Promise<string | null> {
  const cached = await readValidatedActiveDhyraWorkspaceId();
  if (cached) {
    persistActiveDhyraWorkspaceId(cached);
    return cached;
  }

  const createdWorkspace = await createMasterplanWorkspace({
    name: "MemoryOS Workspace",
    plan: "developer",
    region: "local",
  }).catch(() => null);

  const workspaceId = createdWorkspace?.id ?? null;
  persistActiveDhyraWorkspaceId(workspaceId);
  return workspaceId;
}

export type DhyraMissionControlSnapshot = {
  workspaceId: string;
  generatedAt: string;
  overview: {
    institutions: number;
    templates: number;
    missions: number;
    evidence: number;
    verifications: number;
    certificates: number;
    memories: number;
    integrations: number;
    artifacts: number;
  };
  queue: {
    status: {
      queued: number;
      leased: number;
      done: number;
      failed: number;
      deadLettered: number;
      byType?: Record<string, number>;
      byStatus?: Record<string, number>;
    };
    deadLetters: {
      count: number;
      latest: Record<string, unknown> | null;
    };
  };
  webhooks?: { stats?: Record<string, number> };
  recent: {
    templates?: unknown[];
    institutions: DhyraInstitution[];
    missions: DhyraMission[];
    smokeRuns?: unknown[];
    integrations?: unknown[];
    artifacts?: unknown[];
  };
};

export type DhyraMission = {
  id: string;
  title?: string;
  objective?: string;
  repository?: string | null;
  baseBranch?: string | null;
  workingBranch?: string | null;
  state?: string;
  currentStep?: string | null;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  verificationRun?: {
    finalDecision?: string;
    confidence?: number;
  } | null;
  executionRun?: {
    startedAt?: string | null;
    finishedAt?: string | null;
  } | null;
  authorityPolicies?: Array<{
    id: string;
    name?: string;
    permissions?: string[] | null;
    checks?: string[] | null;
    canExecute?: boolean;
    needsApproval?: boolean;
    blocked?: boolean;
  }>;
};

export type DhyraInstitution = {
  id: string;
  workspaceId?: string;
  name: string;
  category?: string | null;
  version?: string | null;
  status?: string | null;
  currentState?: string | null;
  missionCount?: number;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  template?: {
    id?: string;
    name?: string;
    definition?: Record<string, unknown> | null;
  } | null;
  missions?: DhyraMission[];
};

export type DhyraInstitutionDetail = DhyraInstitution & {
  memberCount?: number;
  versions?: Array<{
    id: string;
    version?: string;
    createdAt?: string;
  }>;
  authorityPolicies?: Array<{
    id: string;
    name?: string;
    permissions?: string[] | null;
    checks?: string[] | null;
    canExecute?: boolean;
    needsApproval?: boolean;
    blocked?: boolean;
  }>;
  memoryRecords?: Array<{
    id: string;
    summary?: string;
    updatedAt?: string;
    lessons?: string[] | null;
    suggestedImprovements?: string[] | null;
  }>;
  integrations?: Array<{
    id: string;
    provider?: string;
    status?: string;
    updatedAt?: string;
  }>;
};

export type DhyraTemplate = {
  id: string;
  workspaceId?: string;
  name: string;
  category?: string | null;
  description?: string | null;
  version?: string | null;
  definition?: Record<string, unknown> | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  institutions?: DhyraInstitution[];
  versions?: Array<{
    id: string;
    version?: string;
    createdAt?: string;
  }>;
};

export type DhyraInstitutionVersion = {
  id: string;
  workspaceId?: string;
  institutionId?: string;
  templateId?: string | null;
  version?: string;
  snapshot?: Record<string, unknown> | null;
  createdBy?: string | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
};

export type DhyraEvidence = {
  id: string;
  kind?: string;
  url?: string | null;
  filePath?: string | null;
  contentType?: string | null;
  summary?: string | null;
  createdAt?: string;
};

export type DhyraAuthorityPolicy = {
  id: string;
  name?: string | null;
  workspaceId?: string | null;
  institutionId?: string | null;
  missionId?: string | null;
  status?: string | null;
  canExecute?: boolean | null;
  needsApproval?: boolean | null;
  blocked?: boolean | null;
  permissions?: string[] | null;
  budgets?: Record<string, unknown> | null;
  approvals?: string[] | null;
  checks?: string[] | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DhyraAuthorityPolicyDetail = DhyraAuthorityPolicy & {
  institution?: {
    id: string;
    name?: string;
  } | null;
  mission?: {
    id: string;
    title?: string;
    objective?: string;
    state?: string;
    updatedAt?: string;
    institution?: {
      id: string;
      name?: string;
    } | null;
  } | null;
};

export type DhyraAuthorityGate = {
  mission: DhyraMissionDetail;
  policy: DhyraAuthorityPolicyDetail | null;
  blocked: boolean;
  canExecute: boolean;
  needsApproval: boolean;
  explanation: {
    summary: string;
    decision: "allow" | "review" | "block";
    reasons: string[];
    recommendation: string;
    blockingPolicies: Array<{
      id: string;
      name?: string | null;
      reason: string;
    }>;
    approvalPolicies: Array<{
      id: string;
      name?: string | null;
      reason: string;
    }>;
    riskLevel: "low" | "medium" | "high";
    signals: {
      policyId: string | null;
      policyName: string | null;
      permissions: string[];
      budgets: Record<string, unknown>;
      approvals: string[];
      checks: string[];
      evidenceCount: number;
      timelineCount: number;
      hasPlan: boolean;
      hasExecutionRun: boolean;
      hasVerificationRun: boolean;
      hasCertificate: boolean;
      hasMemoryRecord: boolean;
      executionRunId: string | null;
      verificationRunId: string | null;
      certificateId: string | null;
    };
  };
  reason: string;
};

export type DhyraExecutionRun = {
  id: string;
  missionId?: string | null;
  missionTitle?: string | null;
  institutionId?: string | null;
  status?: string | null;
  planner?: Record<string, unknown> | null;
  executor?: Record<string, unknown> | null;
  reviewer?: Record<string, unknown> | null;
  human?: Record<string, unknown> | null;
  logs?: unknown[] | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type DhyraVerificationRun = {
  id: string;
  finalDecision?: string | null;
  confidence?: number | null;
  checklist?: unknown[] | null;
  evidenceSummary?: Record<string, unknown> | null;
  auditTrail?: unknown[] | null;
  createdAt?: string;
};

export type DhyraVerificationRunHistoryItem = DhyraVerificationRun & {
  missionId?: string;
  mission?: {
    id?: string;
    title?: string;
    objective?: string;
    state?: string;
  } | null;
  executionRun?: {
    id?: string;
    status?: string | null;
  } | null;
  certificate?: {
    id?: string;
    status?: string | null;
  } | null;
};

export type DhyraInstitutionHistory = {
  institutionId: string;
  institution?: DhyraInstitutionDetail | null;
  versions: DhyraInstitutionVersion[];
  missions: DhyraMission[];
  memoryRecords: DhyraMemoryRecord[];
  integrations: Array<{
    id: string;
    provider?: string;
    status?: string;
    updatedAt?: string;
  }>;
  runtimeEvents: Array<{
    id: string;
    type?: string;
    timestamp?: string;
    payload?: Record<string, unknown>;
  }>;
};

export type DhyraCertificate = {
  id: string;
  status?: string | null;
  summary?: string | null;
  evidenceSummary?: Record<string, unknown> | null;
  createdAt?: string;
};

export type DhyraEvidenceBundle = {
  version?: string;
  bundleHash: string;
  mission?: Record<string, unknown>;
  evidence?: unknown[];
  verification?: Record<string, unknown> | null;
};

export type DhyraSettlement = {
  id?: string;
  decision?: "PASS" | "FAIL" | "UNKNOWN" | string;
  status?: "settled" | "held" | string;
  reason?: string;
  evidenceHash?: string;
  assuranceConfidence?: number;
  learningEligible?: boolean;
  learningPayload?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export async function listDhyraCertificates(
  workspaceId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  certificates: DhyraCertificate[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}> {
  const query = new URLSearchParams();
  if (input?.missionId) query.set("missionId", input.missionId);
  if (typeof input?.limit === "number" && Number.isFinite(input.limit)) query.set("limit", String(input.limit));
  if (typeof input?.cursor === "string" && input.cursor.trim().length > 0) query.set("cursor", input.cursor.trim());
  const suffix = query.toString().length > 0 ? `?${query.toString()}` : "";
  return dhyraFetch<{
    certificates: DhyraCertificate[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/certificates${suffix}`);
}

export async function getDhyraMissionSettlement(workspaceId: string, missionId: string): Promise<DhyraSettlement | null> {
  const payload = await dhyraFetch<{ settlement?: DhyraSettlement }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`,
  );
  return payload.settlement ?? null;
}

export async function getDhyraMissionEvidenceBundle(workspaceId: string, missionId: string): Promise<DhyraEvidenceBundle> {
  const payload = await dhyraFetch<{ bundle: DhyraEvidenceBundle }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence-bundle`,
  );
  return payload.bundle;
}

export async function issueDhyraMissionCertificate(
  workspaceId: string,
  missionId: string,
  input?: {
    summary?: string;
    approvals?: string[];
    evidenceSummary?: Record<string, unknown>;
    auditTrail?: Array<Record<string, unknown>>;
    proof?: Record<string, unknown>;
  },
): Promise<{ certificate: DhyraCertificate }> {
  return dhyraFetch<{ certificate: DhyraCertificate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/certificate`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
}

export async function settleDhyraMission(
  workspaceId: string,
  missionId: string,
  input: {
    decision: "PASS" | "FAIL" | "UNKNOWN";
    evidenceHash: string;
    assuranceConfidence: number;
    humanApproval: "approved" | "rejected" | "review";
    unresolvedRisks: string[];
    summary?: string;
    lessons?: string[];
  },
): Promise<{ settlement: DhyraSettlement }> {
  return dhyraFetch<{ settlement: DhyraSettlement }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export type DhyraMemoryRecord = {
  id: string;
  workspaceId?: string | null;
  institutionId?: string | null;
  missionId?: string | null;
  certificateId?: string | null;
  status?: string | null;
  summary?: string | null;
  lessons?: string[] | null;
  mistakes?: string[] | null;
  suggestedImprovements?: string[] | null;
  history?: Array<Record<string, unknown>> | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DhyraMemoryRecordDetail = DhyraMemoryRecord & {
  institution?: {
    id: string;
    name?: string;
    category?: string | null;
    status?: string | null;
    currentState?: string | null;
    template?: {
      id?: string;
      name?: string;
    } | null;
  } | null;
  mission?: {
    id: string;
    title?: string;
    objective?: string;
    state?: string;
    updatedAt?: string;
  } | null;
  certificate?: {
    id: string;
    status?: string;
    summary?: string;
    issuedAt?: string;
  } | null;
};

export type DhyraMissionDetail = DhyraMission & {
  institution?: DhyraInstitution | null;
  authorityPolicies?: DhyraAuthorityPolicy[];
  executionRun?: DhyraExecutionRun | null;
  verificationRun?: DhyraVerificationRun | null;
  certificate?: DhyraCertificate | null;
  memoryRecord?: DhyraMemoryRecord | null;
  evidence?: DhyraEvidence[];
  timeline?: Array<{
    id: string;
    stage?: string;
    status?: string;
    note?: string;
    timestamp?: string;
  }>;
};

export type DhyraMissionRunResult =
  | {
      blocked: true;
      reason: string;
      gate: DhyraAuthorityGate;
      mission: DhyraMissionDetail;
    }
  | {
      approvalRequired: true;
      reason: string;
      gate: DhyraAuthorityGate;
      mission: DhyraMissionDetail;
    }
  | {
      idempotent: true;
      mission: DhyraMissionDetail;
      execution: DhyraExecutionRun | null;
      evidence: DhyraEvidence[];
      verification: DhyraVerificationRun | null;
      certificate: DhyraCertificate | null;
      memoryRecord: DhyraMemoryRecord | null;
    }
  | {
      mission: DhyraMissionDetail;
      execution: DhyraExecutionRun;
      evidence: DhyraEvidence[];
      verification: DhyraVerificationRun;
      certificate: DhyraCertificate | null;
      memoryRecord: DhyraMemoryRecord | null;
    };

export async function getDhyraMissionControlSnapshot(
  workspaceId: string,
  input?: string | { range?: string; search?: string; start?: string; end?: string },
): Promise<DhyraMissionControlSnapshot> {
  const params = new URLSearchParams();
  if (typeof input === "string" && input.trim().length > 0) {
    params.set("range", input);
  } else if (input && typeof input === "object") {
    if (input.range) params.set("range", input.range);
    if (input.search) params.set("search", input.search);
    if (input.start) params.set("start", input.start);
    if (input.end) params.set("end", input.end);
  }
  const search = params.toString() ? `?${params.toString()}` : "";
  const payload = await dhyraFetch<{ snapshot: DhyraMissionControlSnapshot }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/mission-control/snapshot${search}`,
  );
  return payload.snapshot;
}

export async function listDhyraExecutions(workspaceId: string): Promise<DhyraExecutionRun[]> {
  const payload = await dhyraFetch<{ executions: DhyraExecutionRun[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/executions`,
  );
  return payload.executions;
}

export type DhyraPagedResult<T> = {
  items: T[];
  page: { nextCursor: string | null; hasMore: boolean; total: number };
};

export async function listDhyraEvidence(workspaceId: string): Promise<DhyraPagedResult<DhyraEvidence>> {
  const payload = await dhyraFetch<{ evidence: DhyraEvidence[]; page: DhyraPagedResult<DhyraEvidence>["page"] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/evidence`,
  );
  return { items: payload.evidence, page: payload.page };
}

export async function listDhyraRecoveryEscalations(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await dhyraFetch<{ escalations: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/recovery-escalations`,
  );
  return payload.escalations;
}

export async function resolveDhyraRecoveryEscalation(workspaceId: string, escalationId: string, resolution: string): Promise<boolean> {
  await dhyraFetch<{ resolved: boolean }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/recovery-escalations/${encodeURIComponent(escalationId)}/resolve`,
    { method: "POST", body: JSON.stringify({ resolution }) },
  );
  return true;
}

export async function listDhyraInstitutions(
  workspaceId: string,
  input?: { search?: string },
): Promise<DhyraInstitution[]> {
  const search = new URLSearchParams();
  if (input?.search) search.set("search", input.search);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await dhyraFetch<{ institutions: DhyraInstitution[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions${suffix}`,
  );
  return payload.institutions;
}

export async function listDhyraWorkers(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await dhyraFetch<{ workers: Array<Record<string, unknown>> }>(`/workspaces/${encodeURIComponent(workspaceId)}/workers`);
  return payload.workers;
}

export async function createDhyraWorker(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ worker: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/workers`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.worker;
}

export async function updateDhyraWorker(workspaceId: string, workerId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ worker: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/workers/${encodeURIComponent(workerId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  return payload.worker;
}

export async function getDhyraAuditTrail(workspaceId: string): Promise<{ auditLogs: Array<Record<string, unknown>>; runtimeEvents: Array<Record<string, unknown>>; deadLetters: Array<Record<string, unknown>> }> {
  return dhyraFetch<{ auditLogs: Array<Record<string, unknown>>; runtimeEvents: Array<Record<string, unknown>>; deadLetters: Array<Record<string, unknown>> }>(`/workspaces/${encodeURIComponent(workspaceId)}/audit`);
}

export async function createDhyraInstitution(
  workspaceId: string,
  input: {
    name: string;
    category?: string;
    version?: string;
    summary?: string;
    templateId?: string;
    metadata?: Record<string, unknown>;
    proof?: Record<string, unknown>;
  },
): Promise<DhyraInstitution> {
  const payload = await dhyraFetch<{ institution: DhyraInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.institution;
}

export async function archiveDhyraInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<DhyraInstitution> {
  const payload = await dhyraFetch<{ institution: DhyraInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/archive`,
    { method: "POST" },
  );
  return payload.institution;
}

export async function updateDhyraInstitution(
  workspaceId: string,
  institutionId: string,
  input: {
    name?: string;
    category?: string;
    version?: string;
    status?: string;
    summary?: string;
    metadata?: Record<string, unknown>;
    proof?: Record<string, unknown>;
  },
): Promise<DhyraInstitution> {
  const payload = await dhyraFetch<{ institution: DhyraInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return payload.institution;
}

export async function cloneDhyraInstitution(
  workspaceId: string,
  institutionId: string,
  input?: {
    name?: string;
    version?: string;
  },
): Promise<DhyraInstitution> {
  const payload = await dhyraFetch<{ institution: DhyraInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/clone`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
  return payload.institution;
}

export async function deleteDhyraInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<DhyraInstitution> {
  const payload = await dhyraFetch<{ institution: DhyraInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
    { method: "DELETE" },
  );
  return payload.institution;
}

export async function getDhyraInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<DhyraInstitutionDetail> {
  const payload = await dhyraFetch<{ institution: DhyraInstitutionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
  );
  return payload.institution;
}

export async function listDhyraInstitutionVersions(
  workspaceId: string,
  institutionId: string,
  input?: { limit?: number; cursor?: string },
): Promise<{
  versions: DhyraInstitutionVersion[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}> {
  const query = new URLSearchParams();
  if (typeof input?.limit === "number" && Number.isFinite(input.limit)) {
    query.set("limit", String(input.limit));
  }
  if (typeof input?.cursor === "string" && input.cursor.trim().length > 0) {
    query.set("cursor", input.cursor.trim());
  }

  const suffix = query.toString().length > 0 ? `?${query.toString()}` : "";
  return dhyraFetch<{
    versions: DhyraInstitutionVersion[];
    page: {
      nextCursor: string | null;
      hasMore: boolean;
      total: number;
    };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/versions${suffix}`);
}

export async function getDhyraInstitutionHistory(
  workspaceId: string,
  institutionId: string,
): Promise<DhyraInstitutionHistory> {
  return dhyraFetch<DhyraInstitutionHistory>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/history`,
  );
}

export async function listDhyraTemplates(
  workspaceId: string,
  input?: { search?: string },
): Promise<DhyraTemplate[]> {
  const search = new URLSearchParams();
  if (input?.search) search.set("search", input.search);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await dhyraFetch<{ templates: DhyraTemplate[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates${suffix}`,
  );
  return payload.templates;
}

export async function getDhyraTemplate(
  workspaceId: string,
  templateId: string,
): Promise<DhyraTemplate> {
  const payload = await dhyraFetch<{ template: DhyraTemplate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates/${encodeURIComponent(templateId)}`,
  );
  return payload.template;
}

export async function createDhyraTemplate(
  workspaceId: string,
  input: {
    name: string;
    category?: string;
    description?: string;
    version?: string;
    definition?: Record<string, unknown>;
    proof?: Record<string, unknown>;
  },
): Promise<DhyraTemplate> {
  const payload = await dhyraFetch<{ template: DhyraTemplate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.template;
}

export async function listDhyraMissions(
  workspaceId: string,
  input?: { institutionId?: string; state?: string },
): Promise<DhyraMissionDetail[]> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (input?.state) search.set("state", input.state);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await dhyraFetch<{ missions: DhyraMissionDetail[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions${suffix}`,
  );
  return payload.missions;
}

export async function getDhyraMission(
  workspaceId: string,
  missionId: string,
): Promise<DhyraMissionDetail> {
  const payload = await dhyraFetch<{ mission: DhyraMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}`,
  );
  return payload.mission;
}

export async function getDhyraAuthorityGate(
  workspaceId: string,
  missionId: string,
): Promise<DhyraAuthorityGate> {
  const payload = await dhyraFetch<{ gate: DhyraAuthorityGate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority`,
  );
  return payload.gate;
}

export async function listDhyraAuthorityPolicies(
  workspaceId: string,
  missionId: string,
  input?: { institutionId?: string; limit?: number; cursor?: string },
): Promise<{
  policies: DhyraAuthorityPolicy[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (typeof input?.limit === "number") search.set("limit", String(input.limit));
  if (input?.cursor) search.set("cursor", input.cursor);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await dhyraFetch<{
    policies: DhyraAuthorityPolicy[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority/policies${suffix}`,
  );
  return payload;
}

export async function createDhyraAuthorityPolicy(
  workspaceId: string,
  missionId: string,
  input: {
    name: string;
    canExecute: boolean;
    needsApproval: boolean;
    blocked?: boolean;
    permissions: string[];
    checks: string[];
    approvals: string[];
    budgets?: Record<string, unknown>;
  },
): Promise<DhyraAuthorityPolicy> {
  const payload = await dhyraFetch<{ policy: DhyraAuthorityPolicy }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.policy;
}

export async function getDhyraAuthorityPolicy(
  workspaceId: string,
  missionId: string,
  policyId: string,
): Promise<DhyraAuthorityPolicyDetail> {
  const payload = await dhyraFetch<{ policy: DhyraAuthorityPolicyDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority/policies/${encodeURIComponent(policyId)}`,
  );
  return payload.policy;
}

export async function createDhyraMission(
  workspaceId: string,
  input: {
    institutionId: string;
    title: string;
    objective: string;
    repository?: string;
    baseBranch?: string;
    workingBranch?: string;
    budgetCents?: number;
    deadlineAt?: string;
    plan?: string[];
    acceptanceCriteria?: string[];
    authority?: Record<string, unknown>;
    proof?: Record<string, unknown>;
  },
): Promise<DhyraMissionDetail> {
  const payload = await dhyraFetch<{ mission: DhyraMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.mission;
}

export async function runDhyraMission(
  workspaceId: string,
  missionId: string,
  input?: {
    evidence?: Array<{
      kind: string;
      url?: string;
      filePath?: string;
      contentType?: string;
      summary?: string;
      payload?: Record<string, unknown>;
      proof?: Record<string, unknown>;
    }>;
    checklist?: string[];
    humanApproval?: "approved" | "rejected" | "review";
    confidence?: number;
    output?: Record<string, unknown>;
    approvals?: string[];
    notes?: string;
  },
): Promise<DhyraMissionRunResult> {
  return dhyraFetch<DhyraMissionRunResult>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/run`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function queueDhyraMission(
  workspaceId: string,
  missionId: string,
  input?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ job: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/queue/execute`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
  return payload.job;
}

export async function cancelDhyraMission(workspaceId: string, missionId: string, reason?: string): Promise<DhyraMissionDetail> {
  const payload = await dhyraFetch<{ mission: DhyraMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
  return payload.mission;
}

export async function decideDhyraMissionCandidates(
  workspaceId: string,
  missionId: string,
  input: { evaluations: Array<Record<string, unknown>>; objectives?: Array<{ metric: string; direction: "minimize" | "maximize"; weight: number }> },
): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ decision: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/decision`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.decision;
}

export async function sendDhyraMissionTelemetry(
  workspaceId: string,
  missionId: string,
  input: { workerId: string; measurements: Record<string, number>; evidenceIds?: string[]; observedAt?: string },
): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ observation: Record<string, unknown>; workerId: string }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/telemetry`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return { ...payload.observation, workerId: payload.workerId };
}

export async function verifyDhyraMissionWindow(
  workspaceId: string,
  missionId: string,
  input: { measurements: Record<string, number>; constraints: Array<Record<string, unknown>>; evidenceIds: string[]; requiredWindowSeconds: number; observedWindowSeconds: number },
): Promise<{ verification: Record<string, unknown>; outcome: Record<string, unknown> }> {
  return dhyraFetch<{ verification: Record<string, unknown>; outcome: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verification-window`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function retryDhyraMission(workspaceId: string, missionId: string, reason?: string): Promise<DhyraMissionDetail> {
  const payload = await dhyraFetch<{ mission: DhyraMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/retry`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
  return payload.mission;
}

export async function decideDhyraMissionApproval(
  workspaceId: string,
  missionId: string,
  decision: "approved" | "rejected" | "review",
  reason?: string,
): Promise<DhyraMissionDetail> {
  const payload = await dhyraFetch<{ mission: DhyraMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/approval`,
    { method: "POST", body: JSON.stringify({ decision, reason }) },
  );
  return payload.mission;
}

export async function createDhyraMissionEvidence(
  workspaceId: string,
  missionId: string,
  input: {
    evidence: Array<{
      kind: string;
      url?: string;
      filePath?: string;
      contentType?: string;
      summary?: string;
      payload?: Record<string, unknown>;
      proof?: Record<string, unknown>;
    }>;
  },
): Promise<{ evidence: DhyraEvidence[] }> {
  return dhyraFetch<{ evidence: DhyraEvidence[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function verifyDhyraMission(
  workspaceId: string,
  missionId: string,
  input?: {
    checklist?: string[];
    evidenceIds?: string[];
    humanApproval?: "approved" | "rejected" | "review";
    confidence?: number;
    output?: Record<string, unknown>;
    approvals?: string[];
  },
): Promise<{ verification: DhyraVerificationRun }> {
  return dhyraFetch<{ verification: DhyraVerificationRun }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verify`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function listDhyraMemoryRecords(
  workspaceId: string,
  input?: { institutionId?: string; missionId?: string; limit?: number; cursor?: string },
): Promise<{
  memoryRecords: DhyraMemoryRecordDetail[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (input?.missionId) search.set("missionId", input.missionId);
  if (typeof input?.limit === "number") search.set("limit", String(input.limit));
  if (input?.cursor) search.set("cursor", input.cursor);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return dhyraFetch<{
    memoryRecords: DhyraMemoryRecordDetail[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/memory-records${suffix}`);
}

export async function getDhyraMemoryRecord(
  workspaceId: string,
  memoryRecordId: string,
): Promise<DhyraMemoryRecordDetail> {
  const payload = await dhyraFetch<{ memoryRecord: DhyraMemoryRecordDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory-records/${encodeURIComponent(memoryRecordId)}`,
  );
  return payload.memoryRecord;
}

export async function listDhyraMemoryLessons(
  workspaceId: string,
  input?: { institutionId?: string; missionId?: string },
): Promise<{ lessons: DhyraMemoryLesson[]; count: number }> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (input?.missionId) search.set("missionId", input.missionId);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return dhyraFetch<{ lessons: DhyraMemoryLesson[]; count: number }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons${suffix}`,
  );
}

export async function applyDhyraMemoryLesson(
  workspaceId: string,
  lessonId: string,
): Promise<{ lesson: DhyraMemoryLesson }> {
  return dhyraFetch<{ lesson: DhyraMemoryLesson }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons/${encodeURIComponent(lessonId)}/apply`,
    { method: "POST" },
  );
}

export async function rejectDhyraMemoryLesson(
  workspaceId: string,
  lessonId: string,
): Promise<{ lesson: DhyraMemoryLesson }> {
  return dhyraFetch<{ lesson: DhyraMemoryLesson }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons/${encodeURIComponent(lessonId)}/reject`,
    { method: "POST" },
  );
}

export async function listDhyraInstitutionMemoryRecords(
  workspaceId: string,
  institutionId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  memoryRecords: DhyraMemoryRecordDetail[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}> {
  const search = new URLSearchParams();
  if (input?.missionId) search.set("missionId", input.missionId);
  if (typeof input?.limit === "number") search.set("limit", String(input.limit));
  if (input?.cursor) search.set("cursor", input.cursor);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return dhyraFetch<{
    memoryRecords: DhyraMemoryRecordDetail[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/memory-records${suffix}`);
}

export type DhyraIntegrationConnection = {
  id: string;
  workspaceId?: string | null;
  institutionId?: string | null;
  name: string;
  provider: string;
  status?: string | null;
  config?: Record<string, unknown> | null;
  proof?: Record<string, unknown> | null;
  lastSyncAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  institution?: {
    id: string;
    name?: string;
  } | null;
};

export type DhyraIntegrationHealth = {
  backendAvailable: boolean;
  counts?: Record<string, number>;
  freshness?: Array<{
    id?: string;
    provider?: string;
    status?: string;
    lastSyncAt?: string | null;
    updatedAt?: string | null;
    name?: string;
  }>;
};

export type DhyraDeveloperSummary = {
  workspaceId: string;
  developer: {
    mcpConnections: Array<{
      id: string;
      workspaceId?: string;
      name: string;
      client?: string;
      status?: string;
      config?: Record<string, unknown> | null;
      lastTestAt?: string | null;
      proof?: Record<string, unknown> | null;
      createdAt?: string;
      updatedAt?: string;
    }>;
    webhookEndpoints: Array<{
      id: string;
      workspaceId?: string;
      url: string;
      events?: string[] | null;
      status?: string;
      lastTestAt?: string | null;
      proof?: Record<string, unknown> | null;
      createdAt?: string;
      updatedAt?: string;
      deliveries?: Array<{
        id: string;
        eventType?: string;
        status?: string;
        attemptCount?: number;
        maxAttempts?: number;
        deliveredAt?: string | null;
        createdAt?: string;
      }>;
    }>;
    webhookDeliveries?: Record<string, unknown>;
    apiKeys: Array<{
      id: string;
      workspaceId?: string;
      name: string;
      keyPrefix?: string;
      keyHash?: string;
      mode?: string;
      status?: string;
      contentTag?: string;
      endpoints?: string[] | null;
      usage?: Record<string, unknown> | null;
      expiresAt?: string | null;
      lastUsedAt?: string | null;
      revokedAt?: string | null;
      createdAt?: string;
      updatedAt?: string;
    }>;
    runtimeApiKeys: Array<{
      id: string;
      name: string;
      prefix?: string;
      createdAt?: string;
      lastUsedAt?: string | null;
      expiresAt?: string;
      mode?: string;
      status?: string;
      endpoints?: string[];
      contentTag?: string;
    }>;
    operations?: {
      queueStatus?: Record<string, unknown>;
      deadLetters?: {
        count: number;
        latest?: Record<string, unknown> | null;
      };
      smoke?: {
        missionId: string;
        institutionId: string;
        state?: string;
        currentStep?: string | null;
        verificationDecision?: string | null;
        certificateId?: string | null;
        memoryRecordId?: string | null;
      } | null;
    };
  };
};

export type DhyraMemoryLessonSourceRecord = {
  id: string;
  summary?: string | null;
  missionId?: string | null;
  institutionId?: string | null;
  updatedAt?: string;
};

export type DhyraMemoryLesson = {
  id: string;
  workspaceId?: string | null;
  title?: string;
  content?: string;
  status?: string | null;
  count?: number;
  confidence?: number;
  proof?: Record<string, unknown> | null;
  sourceRecords?: DhyraMemoryLessonSourceRecord[];
  derived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type DhyraRuntimeApiKey = {
  id: string;
  name: string;
  prefix?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string | null;
  expiresAt?: string;
  mode?: string;
  status?: string;
  endpoints?: string[];
  contentTag?: string;
  creditLimit?: number | null;
  resetLimitEvery?: string | null;
};

export type DhyraWebhookEndpoint = {
  id: string;
  workspaceId?: string | null;
  url: string;
  events?: string[] | null;
  status?: string | null;
  lastTestAt?: string | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  deliveries?: DhyraWebhookDelivery[];
};

export type DhyraWebhookDelivery = {
  id: string;
  workspaceId?: string | null;
  endpointId?: string | null;
  eventType?: string | null;
  eventId?: string | null;
  status?: string | null;
  attemptCount?: number;
  maxAttempts?: number;
  requestBody?: Record<string, unknown> | null;
  requestHeaders?: Record<string, unknown> | null;
  responseStatus?: number | null;
  responseBody?: Record<string, unknown> | null;
  errorMessage?: string | null;
  nextRetryAt?: string | null;
  deliveredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DhyraMcpConnection = {
  id: string;
  workspaceId?: string | null;
  name: string;
  client?: string | null;
  status?: string | null;
  config?: Record<string, unknown> | null;
  lastTestAt?: string | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DhyraMcpStatusSnapshot = {
  workspaceId: string;
  server: {
    transport: string;
    version: string;
    status: string;
  };
  counts: {
    sessions: number;
    clients: number;
    connectedClients: number;
    tools: number;
    resources: number;
    requests: number;
    logs: number;
  };
  latest: {
    protocolGate: {
      id: string;
      status: string;
      ready: boolean;
      passed: number;
      total: number;
      createdAt: string;
    } | null;
    runtimeProof: {
      id: string;
      version: string;
      status: string;
      ready: boolean;
      totalEvents: number;
      createdAt: string;
      updatedAt: string;
    } | null;
  };
  clients: Array<{
    id: string;
    name: string;
    client: string;
    status: string;
    healthy: boolean;
    lastTestAt: string | null;
    createdAt: string;
    updatedAt: string;
    proof: Record<string, unknown>;
  }>;
  tools: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    callsToday: number;
    lastUsedAt: string | null;
    status: string;
    route?: string;
  }>;
  resources: Array<{
    id: string;
    name: string;
    kind: string;
    route: string;
    status: string;
    count: number;
    description: string;
  }>;
  sessions: Array<{
    id: string;
    createdAt: string;
    agent: string | null;
    route: string;
    status: string;
    requestId: string | null;
    summary: string;
    source: string;
  }>;
  requests: Array<{
    id: string;
    createdAt: string;
    method: string;
    route: string;
    status: string;
    statusCode: number | null;
    latencyMs: number | null;
    requestId: string | null;
    agent: string | null;
    type: string;
    payload: Record<string, unknown>;
  }>;
  logs: Array<{
    id: string;
    createdAt: string;
    method: string;
    route: string;
    status: string;
    statusCode: number | null;
    latencyMs: number | null;
    requestId: string | null;
    agent: string | null;
    type: string;
    payload: Record<string, unknown>;
    source: string;
    level: "info" | "warn" | "error";
    note: string;
  }>;
};

export async function listDhyraIntegrations(
  workspaceId: string,
  input?: { limit?: number; cursor?: string },
): Promise<{
  integrations: DhyraIntegrationConnection[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}> {
  const search = new URLSearchParams();
  if (typeof input?.limit === "number") search.set("limit", String(input.limit));
  if (input?.cursor) search.set("cursor", input.cursor);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return dhyraFetch<{
    integrations: DhyraIntegrationConnection[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/integrations${suffix}`);
}

export type DhyraServiceCatalogEntry = {
  id: string;
  name: string;
  status: string;
  routePrefixes: string[];
  models: string[];
  metrics: Record<string, number>;
  summary: string;
  remainingWork: string[];
};

export type DhyraServiceCatalog = {
  version: string;
  workspaceId: string;
  generatedAt: string;
  services: DhyraServiceCatalogEntry[];
  remaining: string[];
};

export async function listDhyraServices(workspaceId: string): Promise<DhyraServiceCatalog> {
  const payload = await dhyraFetch<{ catalog: DhyraServiceCatalog }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/services`,
  );
  return payload.catalog;
}

export async function getDhyraIntegration(
  workspaceId: string,
  integrationId: string,
): Promise<DhyraIntegrationConnection> {
  const payload = await dhyraFetch<{ integration: DhyraIntegrationConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/${encodeURIComponent(integrationId)}`,
  );
  return payload.integration;
}

export async function disconnectDhyraIntegration(
  workspaceId: string,
  integrationId: string,
  input?: { reason?: string; notes?: string },
): Promise<DhyraIntegrationConnection> {
  const payload = await dhyraFetch<{ integration: DhyraIntegrationConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/${encodeURIComponent(integrationId)}/disconnect`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
  return payload.integration;
}

export async function getDhyraIntegrationLogs(workspaceId: string): Promise<{
  logs: Array<Record<string, unknown>>;
}> {
  return dhyraFetch<{ logs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/logs`,
  );
}

export async function getDhyraDeveloperSummary(workspaceId: string): Promise<DhyraDeveloperSummary> {
  return dhyraFetch<DhyraDeveloperSummary>(`/workspaces/${encodeURIComponent(workspaceId)}/developer`);
}

export async function getDhyraSdkSnapshot(workspaceId: string): Promise<Record<string, unknown>> {
  return dhyraFetch<Record<string, unknown>>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/sdk`);
}

export async function getDhyraOpenApiContract(): Promise<Record<string, unknown>> {
  try {
    return await dhyraFetch<Record<string, unknown>>("/openapi");
  } catch {
    return fetchJson<Record<string, unknown>>("/api/openapi");
  }
}

export async function listDhyraAiCatalog(): Promise<{ version?: string; models: Array<{ provider?: string; model?: string; capabilities?: string[] }> }> {
  return dhyraFetch<{ version?: string; models: Array<{ provider?: string; model?: string; capabilities?: string[] }> }>("/ai/catalog");
}

export async function getDhyraCliCatalog(workspaceId: string): Promise<Record<string, unknown>> {
  return dhyraFetch<Record<string, unknown>>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/cli`);
}

export async function listDhyraVerificationRuns(
  workspaceId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  verifications: DhyraVerificationRunHistoryItem[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}> {
  const query = new URLSearchParams();
  if (typeof input?.missionId === "string" && input.missionId.trim().length > 0) {
    query.set("missionId", input.missionId.trim());
  }
  if (typeof input?.limit === "number" && Number.isFinite(input.limit)) {
    query.set("limit", String(input.limit));
  }
  if (typeof input?.cursor === "string" && input.cursor.trim().length > 0) {
    query.set("cursor", input.cursor.trim());
  }

  const suffix = query.toString().length > 0 ? `?${query.toString()}` : "";
  return dhyraFetch<{
    verifications: DhyraVerificationRunHistoryItem[];
    page: {
      nextCursor: string | null;
      hasMore: boolean;
      total: number;
    };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/verifications${suffix}`);
}

export async function listDhyraMcpConnections(workspaceId: string): Promise<DhyraMcpConnection[]> {
  const payload = await dhyraFetch<{ mcpConnections: DhyraMcpConnection[] }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp`,
  );
  return payload.mcpConnections;
}

export async function getDhyraMcpStatus(workspaceId: string): Promise<DhyraMcpStatusSnapshot> {
  try {
    const payload = await dhyraFetch<{ mcp: DhyraMcpStatusSnapshot }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp/status`,
    );
    return payload.mcp;
  } catch (error) {
    const fallback = await fetchJson<{ mcp: DhyraMcpStatusSnapshot }>(
      `/api/mcp/status?workspaceId=${encodeURIComponent(workspaceId)}`,
    );
    if (fallback?.mcp) {
      return fallback.mcp;
    }
    throw error;
  }
}

export async function listDhyraRuntimeApiKeys(workspaceId: string): Promise<DhyraRuntimeApiKey[]> {
  const payload = await dhyraFetch<{ runtimeApiKeys: DhyraRuntimeApiKey[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/api-keys`,
  );
  return payload.runtimeApiKeys;
}

export async function createDhyraRuntimeApiKey(
  workspaceId: string,
  input?: { name?: string; expires?: string; creditLimit?: number | null; resetLimitEvery?: string | null },
): Promise<{
  token: string;
  key: DhyraRuntimeApiKey;
  setup: {
    baseUrl: string;
    endpoints: string[];
  };
}> {
  return dhyraFetch<{
    token: string;
    key: DhyraRuntimeApiKey;
    setup: { baseUrl: string; endpoints: string[] };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/runtime-api-keys`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function revokeDhyraRuntimeApiKey(
  workspaceId: string,
  keyId: string,
): Promise<DhyraRuntimeApiKey> {
  const payload = await dhyraFetch<{ key: DhyraRuntimeApiKey }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/runtime-api-keys/${encodeURIComponent(keyId)}/revoke`,
    { method: "POST" },
  );
  return payload.key;
}

export async function enrollDhyraEdgeWorker(
  workspaceId: string,
  workerId: string,
  ttlMs?: number,
): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ enrollment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/edge/enrollment`,
    { method: "POST", body: JSON.stringify({ workerId, ...(ttlMs ? { ttlMs } : {}) }) },
  );
  return payload.enrollment;
}

export async function listDhyraDeveloperWebhooks(workspaceId: string): Promise<DhyraWebhookEndpoint[]> {
  const payload = await dhyraFetch<{ webhooks: DhyraWebhookEndpoint[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks`,
  );
  return payload.webhooks;
}

export async function createDhyraDeveloperWebhook(
  workspaceId: string,
  input: { url: string; events: string[]; status?: string },
): Promise<DhyraWebhookEndpoint> {
  const payload = await dhyraFetch<{ webhook: DhyraWebhookEndpoint }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.webhook;
}

export async function getDhyraDeveloperWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<DhyraWebhookEndpoint> {
  const payload = await dhyraFetch<{ webhook: DhyraWebhookEndpoint }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}`,
  );
  return payload.webhook;
}

export async function listDhyraWebhookDeliveries(
  workspaceId: string,
  webhookId: string,
): Promise<DhyraWebhookDelivery[]> {
  const payload = await dhyraFetch<{ deliveries: DhyraWebhookDelivery[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries`,
  );
  return payload.deliveries;
}

export async function getDhyraWebhookDelivery(
  workspaceId: string,
  webhookId: string,
  deliveryId: string,
): Promise<DhyraWebhookDelivery> {
  const payload = await dhyraFetch<{ delivery: DhyraWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}`,
  );
  return payload.delivery;
}

export async function retryDhyraWebhookDelivery(
  workspaceId: string,
  webhookId: string,
  deliveryId: string,
): Promise<DhyraWebhookDelivery> {
  const payload = await dhyraFetch<{ delivery: DhyraWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`,
    { method: "POST" },
  );
  return payload.delivery;
}

export async function testDhyraDeveloperWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<DhyraWebhookDelivery> {
  const payload = await dhyraFetch<{ delivery: DhyraWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/test`,
    { method: "POST", body: JSON.stringify({ eventType: "mission.completed", label: "Mission Control test" }) },
  );
  return payload.delivery;
}

export async function registerDhyraMcpConnection(
  workspaceId: string,
  input: { name: string; uri: string; capabilities?: string[]; resources?: string[]; policies?: string[] },
): Promise<DhyraMcpConnection> {
  const payload = await dhyraFetch<{ mcpConnection: DhyraMcpConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.mcpConnection;
}

export async function connectDhyraMcpConnection(
  workspaceId: string,
  connectionId: string,
  input?: { token?: string },
): Promise<DhyraMcpConnection> {
  const payload = await dhyraFetch<{ mcpConnection: DhyraMcpConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp/${encodeURIComponent(connectionId)}/connect`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
  return payload.mcpConnection;
}

export type DhyraProductionIntelligence = {
  interactions: Array<Record<string, unknown>>;
  signals: Array<Record<string, unknown>>;
  clusters: Array<Record<string, unknown>>;
  rootCauses: Array<Record<string, unknown>>;
  evaluations: Array<Record<string, unknown>>;
  replays: Array<Record<string, unknown>>;
  fixes: Array<Record<string, unknown>>;
  reliability: Array<Record<string, unknown>>;
  improvements: Array<Record<string, unknown>>;
};

export async function getDhyraProductionIntelligence(
  workspaceId: string,
  limit = 50,
): Promise<DhyraProductionIntelligence> {
  const query = new URLSearchParams({ limit: String(limit) });
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/production`;
  const [interactions, signals, clusters, rootCauses, evaluations, replays, fixes, reliability] = await Promise.all([
    dhyraFetch<{ interactions: Array<Record<string, unknown>> }>(`${base}/interactions?${query}`),
    dhyraFetch<{ failures: Array<Record<string, unknown>> }>(`${base}/failures?${query}`),
    dhyraFetch<{ clusters: Array<Record<string, unknown>> }>(`${base}/clusters?${query}`),
    dhyraFetch<{ rootCauses: Array<Record<string, unknown>> }>(`${base}/root-causes?${query}`),
    dhyraFetch<{ evaluations: Array<Record<string, unknown>> }>(`${base}/evaluations?${query}`),
    dhyraFetch<{ replays: Array<Record<string, unknown>> }>(`${base}/replays?${query}`),
    dhyraFetch<{ fixes: Array<Record<string, unknown>> }>(`${base}/fix-proposals?${query}`),
    dhyraFetch<{ reliability: Array<Record<string, unknown>> }>(`${base}/reliability?${query}`),
  ]);
  const improvements = await dhyraFetch<{ improvements: Array<Record<string, unknown>> }>(`${base}/improvements?${query}`);
  return { interactions: interactions.interactions, signals: signals.failures, clusters: clusters.clusters, rootCauses: rootCauses.rootCauses, evaluations: evaluations.evaluations, replays: replays.replays, fixes: fixes.fixes, reliability: reliability.reliability, improvements: improvements.improvements };
}

export async function approveDhyraFixProposal(workspaceId: string, proposalId: string): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ proposal: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/production/fix-proposals/${encodeURIComponent(proposalId)}/approve`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return payload.proposal;
}

export type DhyraAiExecutionOverview = {
  catalog: Array<Record<string, unknown>>;
  endpoints: Array<Record<string, unknown>>;
  health: Array<Record<string, unknown>>;
  providerHealth: Array<Record<string, unknown>>;
  executions: Array<Record<string, unknown>>;
  costs: Record<string, unknown>;
};

export async function getDhyraAiExecutionOverview(workspaceId: string): Promise<DhyraAiExecutionOverview> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const [catalog, workers, health, executions, costs] = await Promise.all([
    dhyraFetch<{ endpoints: Array<Record<string, unknown>> }>(`/ai-execution/catalog`),
    dhyraFetch<{ endpoints: Array<Record<string, unknown>> }>(`${base}/workers`),
    dhyraFetch<{ health: Array<Record<string, unknown>>; providerHealth: Array<Record<string, unknown>> }>(`${base}/health`),
    dhyraFetch<{ executions: Array<Record<string, unknown>> }>(`${base}/history`),
    dhyraFetch<Record<string, unknown>>(`${base}/costs`),
  ]);
  return { catalog: catalog.endpoints, endpoints: workers.endpoints, health: health.health, providerHealth: health.providerHealth, executions: executions.executions, costs };
}

export async function listDhyraHuggingFaceModels(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await dhyraFetch<{ models: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/model-registry/huggingface`,
  );
  return payload.models;
}

export type DhyraHuggingFaceSearchResult = {
  repositoryId: string;
  author: string | null;
  task: string | null;
  library: string | null;
  downloads: number;
  likes: number;
  tags: string[];
};

export async function searchDhyraHuggingFaceModels(workspaceId: string, search = ""): Promise<DhyraHuggingFaceSearchResult[]> {
  const params = new URLSearchParams({ limit: "20", sort: "downloads", direction: "desc" });
  if (search.trim()) params.set("search", search.trim());
  const payload = await dhyraFetch<{ results: DhyraHuggingFaceSearchResult[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/models/huggingface/search?${params.toString()}`,
  );
  return payload.results;
}

export async function probeDhyraAiProviderHealth(workspaceId: string, providers: string[] = ["openrouter"]): Promise<{ health: Array<Record<string, unknown>>; probedAt: string }> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const payload = await dhyraFetch<{ health: Array<Record<string, unknown>>; probedAt: string }>(`${base}/health/probe`, {
    method: "POST",
    body: JSON.stringify({ providers }),
  });
  return { health: payload.health, probedAt: payload.probedAt };
}

export async function executeDhyraAiTest(workspaceId: string, prompt: string): Promise<Record<string, unknown>> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const payload = await dhyraFetch<{ result: Record<string, unknown> }>(`${base}/execute`, {
    method: "POST",
    body: JSON.stringify({ prompt, preferredProvider: "openrouter", allowedProviders: ["openrouter"], allowFallback: false, maxOutputTokens: 128 }),
  });
  return payload.result;
}

export async function listDhyraPrograms(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await dhyraFetch<{ programs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs`,
  );
  return payload.programs;
}

export async function getDhyraProgram(workspaceId: string, programId: string): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}`,
  );
  return payload.program;
}

export async function createDhyraProgram(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.program;
}

export async function updateDhyraProgramStatus(workspaceId: string, programId: string, status: string): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  return payload.program;
}

export async function listDhyraProgramRuns(workspaceId: string, programId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await dhyraFetch<{ runs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/runs`,
  );
  return payload.runs;
}

export async function createDhyraProgramRun(
  workspaceId: string,
  programId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ run: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/runs`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.run;
}

export async function listDhyraDeployments(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await dhyraFetch<{ deployments: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
  );
  return payload.deployments;
}

export async function getDhyraDeployment(workspaceId: string, deploymentId: string): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}`,
  );
  return payload.deployment;
}

export async function createDhyraDeployment(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.deployment;
}

export async function rollbackDhyraDeployment(workspaceId: string, deploymentId: string): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/rollback`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return payload.deployment;
}

export async function listDhyraRegistryArtifacts(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await dhyraFetch<{ artifacts: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/registry`,
  );
  return payload.artifacts;
}

export async function createDhyraRegistryArtifact(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await dhyraFetch<{ artifact: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/registry`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.artifact;
}

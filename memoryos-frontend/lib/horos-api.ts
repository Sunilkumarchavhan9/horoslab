"use client";

import { getMemoryOSOrgHeaders, readClerkOrganizationId, readDevConsoleOrganizationId } from "@/lib/org-scope-client";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { createMasterplanWorkspace, listMasterplanWorkspaces } from "@/lib/masterplan-api";

// Use the stable V12 route. The legacy /api/horos prefix remains server-side
// only for compatibility with older clients.
const HOROS_BASE = "/api/v1/horos";
const configuredHorosApiOrigin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() ?? "";
const HOROS_API_ORIGIN = configuredHorosApiOrigin && configuredHorosApiOrigin.toLowerCase() !== "same-origin"
  ? configuredHorosApiOrigin.replace(/\/$/, "")
  : "";
const ACTIVE_HOROS_WORKSPACE_STORAGE_KEY_PREFIX = "memoryos.horos.activeWorkspaceId";

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
    throw new Error(message || `HOROS request failed (${response.status}).`);
  }

  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok) return payload.data;
    throw new Error(payload.error?.message || "HOROS request failed.");
  }

  return payload as T;
}

async function horosFetchOnce(path: string, init?: RequestInit): Promise<Response> {
  const requestPath = `${HOROS_BASE}${path}`;
  const url = HOROS_API_ORIGIN ? `${HOROS_API_ORIGIN}${requestPath}` : requestPath;
  const token = await getOrCreateMemoryToken();
  return fetch(url, {
    ...init,
    cache: "no-store",
    credentials: HOROS_API_ORIGIN ? "include" : "same-origin",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getMemoryOSOrgHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

function clearPersistedActiveHorosWorkspaceId(): void {
  if (typeof window === "undefined") return;
  const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
  window.localStorage.removeItem(`${ACTIVE_HOROS_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`);
}

function replaceWorkspaceIdInPath(path: string, workspaceId: string): string | null {
  const match = path.match(/^\/workspaces\/([^/]+)(\/.*)$/);
  if (!match) return null;
  return `/workspaces/${encodeURIComponent(workspaceId)}${match[2]}`;
}

async function horosFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await horosFetchOnce(path, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;
    const workspaceNotFound =
      response.status === 404 &&
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error?.code === "WORKSPACE_NOT_FOUND";

    if (workspaceNotFound && replaceWorkspaceIdInPath(path, "") !== null) {
      clearPersistedActiveHorosWorkspaceId();
      const resolvedWorkspaceId = await resolveActiveHorosWorkspaceId().catch(() => null);
      if (resolvedWorkspaceId) {
        const nextPath = replaceWorkspaceIdInPath(path, resolvedWorkspaceId);
        if (nextPath) {
          const retryResponse = await horosFetchOnce(nextPath, init);
          return readJson<T>(retryResponse);
        }
      }
    }

    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message
        : null;
    throw new Error(message || `HOROS request failed (${response.status}).`);
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

export function readActiveHorosWorkspaceId(): string | null {
  if (typeof window !== "undefined") {
    const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
    const cached = window.localStorage.getItem(`${ACTIVE_HOROS_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`);
    if (cached && cached.trim().length > 0) {
      return cached.trim();
    }
  }

  return null;
}

function persistActiveHorosWorkspaceId(workspaceId: string | null): void {
  if (typeof window === "undefined") return;
  const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
  const storageKey = `${ACTIVE_HOROS_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`;

  if (workspaceId && workspaceId.trim().length > 0) {
    window.localStorage.setItem(storageKey, workspaceId.trim());
    return;
  }

  window.localStorage.removeItem(storageKey);
}

async function readValidatedActiveHorosWorkspaceId(): Promise<string | null> {
  const cached = readActiveHorosWorkspaceId();
  const workspaces = await listMasterplanWorkspaces().catch(() => []);

  if (cached && workspaces.some((workspace) => workspace.id === cached)) {
    return cached;
  }

  if (cached) {
    persistActiveHorosWorkspaceId(null);
  }

  return workspaces[0]?.id ?? null;
}

export async function resolveActiveHorosWorkspaceId(): Promise<string | null> {
  const cached = await readValidatedActiveHorosWorkspaceId();
  if (cached) {
    persistActiveHorosWorkspaceId(cached);
    return cached;
  }

  const createdWorkspace = await createMasterplanWorkspace({
    name: "MemoryOS Workspace",
    plan: "developer",
    region: "local",
  }).catch(() => null);

  const workspaceId = createdWorkspace?.id ?? null;
  persistActiveHorosWorkspaceId(workspaceId);
  return workspaceId;
}

export type HorosMissionControlSnapshot = {
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
    institutions: HorosInstitution[];
    missions: HorosMission[];
    smokeRuns?: unknown[];
    integrations?: unknown[];
    artifacts?: unknown[];
  };
};

export type HorosMission = {
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

export type HorosInstitution = {
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
  missions?: HorosMission[];
};

export type HorosInstitutionDetail = HorosInstitution & {
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

export type HorosTemplate = {
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
  institutions?: HorosInstitution[];
  versions?: Array<{
    id: string;
    version?: string;
    createdAt?: string;
  }>;
};

export type HorosInstitutionVersion = {
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

export type HorosEvidence = {
  id: string;
  kind?: string;
  url?: string | null;
  filePath?: string | null;
  contentType?: string | null;
  summary?: string | null;
  createdAt?: string;
};

export type HorosAuthorityPolicy = {
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

export type HorosAuthorityPolicyDetail = HorosAuthorityPolicy & {
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

export type HorosAuthorityGate = {
  mission: HorosMissionDetail;
  policy: HorosAuthorityPolicyDetail | null;
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

export type HorosExecutionRun = {
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

export type HorosVerificationRun = {
  id: string;
  finalDecision?: string | null;
  confidence?: number | null;
  checklist?: unknown[] | null;
  evidenceSummary?: Record<string, unknown> | null;
  auditTrail?: unknown[] | null;
  createdAt?: string;
};

export type HorosVerificationRunHistoryItem = HorosVerificationRun & {
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

export type HorosInstitutionHistory = {
  institutionId: string;
  institution?: HorosInstitutionDetail | null;
  versions: HorosInstitutionVersion[];
  missions: HorosMission[];
  memoryRecords: HorosMemoryRecord[];
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

export type HorosCertificate = {
  id: string;
  status?: string | null;
  summary?: string | null;
  evidenceSummary?: Record<string, unknown> | null;
  createdAt?: string;
};

export type HorosEvidenceBundle = {
  version?: string;
  bundleHash: string;
  mission?: Record<string, unknown>;
  evidence?: unknown[];
  verification?: Record<string, unknown> | null;
};

export type HorosSettlement = {
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

export async function listHorosCertificates(
  workspaceId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  certificates: HorosCertificate[];
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
  return horosFetch<{
    certificates: HorosCertificate[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/certificates${suffix}`);
}

export async function getHorosMissionSettlement(workspaceId: string, missionId: string): Promise<HorosSettlement | null> {
  const payload = await horosFetch<{ settlement?: HorosSettlement }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`,
  );
  return payload.settlement ?? null;
}

export async function getHorosMissionEvidenceBundle(workspaceId: string, missionId: string): Promise<HorosEvidenceBundle> {
  const payload = await horosFetch<{ bundle: HorosEvidenceBundle }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence-bundle`,
  );
  return payload.bundle;
}

export async function issueHorosMissionCertificate(
  workspaceId: string,
  missionId: string,
  input?: {
    summary?: string;
    approvals?: string[];
    evidenceSummary?: Record<string, unknown>;
    auditTrail?: Array<Record<string, unknown>>;
    proof?: Record<string, unknown>;
  },
): Promise<{ certificate: HorosCertificate }> {
  return horosFetch<{ certificate: HorosCertificate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/certificate`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
}

export async function settleHorosMission(
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
): Promise<{ settlement: HorosSettlement }> {
  return horosFetch<{ settlement: HorosSettlement }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export type HorosMemoryRecord = {
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

export type HorosMemoryRecordDetail = HorosMemoryRecord & {
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

export type HorosMissionDetail = HorosMission & {
  institution?: HorosInstitution | null;
  authorityPolicies?: HorosAuthorityPolicy[];
  executionRun?: HorosExecutionRun | null;
  verificationRun?: HorosVerificationRun | null;
  certificate?: HorosCertificate | null;
  memoryRecord?: HorosMemoryRecord | null;
  evidence?: HorosEvidence[];
  timeline?: Array<{
    id: string;
    stage?: string;
    status?: string;
    note?: string;
    timestamp?: string;
  }>;
};

export type HorosMissionRunResult =
  | {
      blocked: true;
      reason: string;
      gate: HorosAuthorityGate;
      mission: HorosMissionDetail;
    }
  | {
      approvalRequired: true;
      reason: string;
      gate: HorosAuthorityGate;
      mission: HorosMissionDetail;
    }
  | {
      idempotent: true;
      mission: HorosMissionDetail;
      execution: HorosExecutionRun | null;
      evidence: HorosEvidence[];
      verification: HorosVerificationRun | null;
      certificate: HorosCertificate | null;
      memoryRecord: HorosMemoryRecord | null;
    }
  | {
      mission: HorosMissionDetail;
      execution: HorosExecutionRun;
      evidence: HorosEvidence[];
      verification: HorosVerificationRun;
      certificate: HorosCertificate | null;
      memoryRecord: HorosMemoryRecord | null;
    };

export async function getHorosMissionControlSnapshot(
  workspaceId: string,
  input?: string | { range?: string; search?: string; start?: string; end?: string },
): Promise<HorosMissionControlSnapshot> {
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
  const payload = await horosFetch<{ snapshot: HorosMissionControlSnapshot }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/mission-control/snapshot${search}`,
  );
  return payload.snapshot;
}

export async function listHorosExecutions(workspaceId: string): Promise<HorosExecutionRun[]> {
  const payload = await horosFetch<{ executions: HorosExecutionRun[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/executions`,
  );
  return payload.executions;
}

export type HorosPagedResult<T> = {
  items: T[];
  page: { nextCursor: string | null; hasMore: boolean; total: number };
};

export async function listHorosEvidence(workspaceId: string): Promise<HorosPagedResult<HorosEvidence>> {
  const payload = await horosFetch<{ evidence: HorosEvidence[]; page: HorosPagedResult<HorosEvidence>["page"] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/evidence`,
  );
  return { items: payload.evidence, page: payload.page };
}

export async function listHorosRecoveryEscalations(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await horosFetch<{ escalations: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/recovery-escalations`,
  );
  return payload.escalations;
}

export async function resolveHorosRecoveryEscalation(workspaceId: string, escalationId: string, resolution: string): Promise<boolean> {
  await horosFetch<{ resolved: boolean }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/recovery-escalations/${encodeURIComponent(escalationId)}/resolve`,
    { method: "POST", body: JSON.stringify({ resolution }) },
  );
  return true;
}

export async function listHorosInstitutions(
  workspaceId: string,
  input?: { search?: string },
): Promise<HorosInstitution[]> {
  const search = new URLSearchParams();
  if (input?.search) search.set("search", input.search);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await horosFetch<{ institutions: HorosInstitution[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions${suffix}`,
  );
  return payload.institutions;
}

export async function listHorosWorkers(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await horosFetch<{ workers: Array<Record<string, unknown>> }>(`/workspaces/${encodeURIComponent(workspaceId)}/workers`);
  return payload.workers;
}

export async function createHorosWorker(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ worker: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/workers`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.worker;
}

export async function updateHorosWorker(workspaceId: string, workerId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ worker: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/workers/${encodeURIComponent(workerId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  return payload.worker;
}

export async function getHorosAuditTrail(workspaceId: string): Promise<{ auditLogs: Array<Record<string, unknown>>; runtimeEvents: Array<Record<string, unknown>>; deadLetters: Array<Record<string, unknown>> }> {
  return horosFetch<{ auditLogs: Array<Record<string, unknown>>; runtimeEvents: Array<Record<string, unknown>>; deadLetters: Array<Record<string, unknown>> }>(`/workspaces/${encodeURIComponent(workspaceId)}/audit`);
}

export async function createHorosInstitution(
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
): Promise<HorosInstitution> {
  const payload = await horosFetch<{ institution: HorosInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.institution;
}

export async function archiveHorosInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<HorosInstitution> {
  const payload = await horosFetch<{ institution: HorosInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/archive`,
    { method: "POST" },
  );
  return payload.institution;
}

export async function updateHorosInstitution(
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
): Promise<HorosInstitution> {
  const payload = await horosFetch<{ institution: HorosInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return payload.institution;
}

export async function cloneHorosInstitution(
  workspaceId: string,
  institutionId: string,
  input?: {
    name?: string;
    version?: string;
  },
): Promise<HorosInstitution> {
  const payload = await horosFetch<{ institution: HorosInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/clone`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
  return payload.institution;
}

export async function deleteHorosInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<HorosInstitution> {
  const payload = await horosFetch<{ institution: HorosInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
    { method: "DELETE" },
  );
  return payload.institution;
}

export async function getHorosInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<HorosInstitutionDetail> {
  const payload = await horosFetch<{ institution: HorosInstitutionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
  );
  return payload.institution;
}

export async function listHorosInstitutionVersions(
  workspaceId: string,
  institutionId: string,
  input?: { limit?: number; cursor?: string },
): Promise<{
  versions: HorosInstitutionVersion[];
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
  return horosFetch<{
    versions: HorosInstitutionVersion[];
    page: {
      nextCursor: string | null;
      hasMore: boolean;
      total: number;
    };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/versions${suffix}`);
}

export async function getHorosInstitutionHistory(
  workspaceId: string,
  institutionId: string,
): Promise<HorosInstitutionHistory> {
  return horosFetch<HorosInstitutionHistory>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/history`,
  );
}

export async function listHorosTemplates(
  workspaceId: string,
  input?: { search?: string },
): Promise<HorosTemplate[]> {
  const search = new URLSearchParams();
  if (input?.search) search.set("search", input.search);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await horosFetch<{ templates: HorosTemplate[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates${suffix}`,
  );
  return payload.templates;
}

export async function getHorosTemplate(
  workspaceId: string,
  templateId: string,
): Promise<HorosTemplate> {
  const payload = await horosFetch<{ template: HorosTemplate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates/${encodeURIComponent(templateId)}`,
  );
  return payload.template;
}

export async function createHorosTemplate(
  workspaceId: string,
  input: {
    name: string;
    category?: string;
    description?: string;
    version?: string;
    definition?: Record<string, unknown>;
    proof?: Record<string, unknown>;
  },
): Promise<HorosTemplate> {
  const payload = await horosFetch<{ template: HorosTemplate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.template;
}

export async function listHorosMissions(
  workspaceId: string,
  input?: { institutionId?: string; state?: string },
): Promise<HorosMissionDetail[]> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (input?.state) search.set("state", input.state);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await horosFetch<{ missions: HorosMissionDetail[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions${suffix}`,
  );
  return payload.missions;
}

export async function getHorosMission(
  workspaceId: string,
  missionId: string,
): Promise<HorosMissionDetail> {
  const payload = await horosFetch<{ mission: HorosMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}`,
  );
  return payload.mission;
}

export async function getHorosAuthorityGate(
  workspaceId: string,
  missionId: string,
): Promise<HorosAuthorityGate> {
  const payload = await horosFetch<{ gate: HorosAuthorityGate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority`,
  );
  return payload.gate;
}

export async function listHorosAuthorityPolicies(
  workspaceId: string,
  missionId: string,
  input?: { institutionId?: string; limit?: number; cursor?: string },
): Promise<{
  policies: HorosAuthorityPolicy[];
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
  const payload = await horosFetch<{
    policies: HorosAuthorityPolicy[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority/policies${suffix}`,
  );
  return payload;
}

export async function createHorosAuthorityPolicy(
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
): Promise<HorosAuthorityPolicy> {
  const payload = await horosFetch<{ policy: HorosAuthorityPolicy }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.policy;
}

export async function getHorosAuthorityPolicy(
  workspaceId: string,
  missionId: string,
  policyId: string,
): Promise<HorosAuthorityPolicyDetail> {
  const payload = await horosFetch<{ policy: HorosAuthorityPolicyDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority/policies/${encodeURIComponent(policyId)}`,
  );
  return payload.policy;
}

export async function createHorosMission(
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
): Promise<HorosMissionDetail> {
  const payload = await horosFetch<{ mission: HorosMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.mission;
}

export async function runHorosMission(
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
): Promise<HorosMissionRunResult> {
  return horosFetch<HorosMissionRunResult>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/run`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function queueHorosMission(
  workspaceId: string,
  missionId: string,
  input?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ job: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/queue/execute`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
  return payload.job;
}

export async function cancelHorosMission(workspaceId: string, missionId: string, reason?: string): Promise<HorosMissionDetail> {
  const payload = await horosFetch<{ mission: HorosMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
  return payload.mission;
}

export async function decideHorosMissionCandidates(
  workspaceId: string,
  missionId: string,
  input: { evaluations: Array<Record<string, unknown>>; objectives?: Array<{ metric: string; direction: "minimize" | "maximize"; weight: number }> },
): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ decision: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/decision`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.decision;
}

export async function sendHorosMissionTelemetry(
  workspaceId: string,
  missionId: string,
  input: { workerId: string; measurements: Record<string, number>; evidenceIds?: string[]; observedAt?: string },
): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ observation: Record<string, unknown>; workerId: string }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/telemetry`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return { ...payload.observation, workerId: payload.workerId };
}

export async function verifyHorosMissionWindow(
  workspaceId: string,
  missionId: string,
  input: { measurements: Record<string, number>; constraints: Array<Record<string, unknown>>; evidenceIds: string[]; requiredWindowSeconds: number; observedWindowSeconds: number },
): Promise<{ verification: Record<string, unknown>; outcome: Record<string, unknown> }> {
  return horosFetch<{ verification: Record<string, unknown>; outcome: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verification-window`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function retryHorosMission(workspaceId: string, missionId: string, reason?: string): Promise<HorosMissionDetail> {
  const payload = await horosFetch<{ mission: HorosMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/retry`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
  return payload.mission;
}

export async function decideHorosMissionApproval(
  workspaceId: string,
  missionId: string,
  decision: "approved" | "rejected" | "review",
  reason?: string,
): Promise<HorosMissionDetail> {
  const payload = await horosFetch<{ mission: HorosMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/approval`,
    { method: "POST", body: JSON.stringify({ decision, reason }) },
  );
  return payload.mission;
}

export async function createHorosMissionEvidence(
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
): Promise<{ evidence: HorosEvidence[] }> {
  return horosFetch<{ evidence: HorosEvidence[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function verifyHorosMission(
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
): Promise<{ verification: HorosVerificationRun }> {
  return horosFetch<{ verification: HorosVerificationRun }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verify`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function listHorosMemoryRecords(
  workspaceId: string,
  input?: { institutionId?: string; missionId?: string; limit?: number; cursor?: string },
): Promise<{
  memoryRecords: HorosMemoryRecordDetail[];
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
  return horosFetch<{
    memoryRecords: HorosMemoryRecordDetail[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/memory-records${suffix}`);
}

export async function getHorosMemoryRecord(
  workspaceId: string,
  memoryRecordId: string,
): Promise<HorosMemoryRecordDetail> {
  const payload = await horosFetch<{ memoryRecord: HorosMemoryRecordDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory-records/${encodeURIComponent(memoryRecordId)}`,
  );
  return payload.memoryRecord;
}

export async function listHorosMemoryLessons(
  workspaceId: string,
  input?: { institutionId?: string; missionId?: string },
): Promise<{ lessons: HorosMemoryLesson[]; count: number }> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (input?.missionId) search.set("missionId", input.missionId);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return horosFetch<{ lessons: HorosMemoryLesson[]; count: number }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons${suffix}`,
  );
}

export async function applyHorosMemoryLesson(
  workspaceId: string,
  lessonId: string,
): Promise<{ lesson: HorosMemoryLesson }> {
  return horosFetch<{ lesson: HorosMemoryLesson }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons/${encodeURIComponent(lessonId)}/apply`,
    { method: "POST" },
  );
}

export async function rejectHorosMemoryLesson(
  workspaceId: string,
  lessonId: string,
): Promise<{ lesson: HorosMemoryLesson }> {
  return horosFetch<{ lesson: HorosMemoryLesson }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons/${encodeURIComponent(lessonId)}/reject`,
    { method: "POST" },
  );
}

export async function listHorosInstitutionMemoryRecords(
  workspaceId: string,
  institutionId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  memoryRecords: HorosMemoryRecordDetail[];
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
  return horosFetch<{
    memoryRecords: HorosMemoryRecordDetail[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/memory-records${suffix}`);
}

export type HorosIntegrationConnection = {
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

export type HorosIntegrationHealth = {
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

export type HorosDeveloperSummary = {
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

export type HorosMemoryLessonSourceRecord = {
  id: string;
  summary?: string | null;
  missionId?: string | null;
  institutionId?: string | null;
  updatedAt?: string;
};

export type HorosMemoryLesson = {
  id: string;
  workspaceId?: string | null;
  title?: string;
  content?: string;
  status?: string | null;
  count?: number;
  confidence?: number;
  proof?: Record<string, unknown> | null;
  sourceRecords?: HorosMemoryLessonSourceRecord[];
  derived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type HorosRuntimeApiKey = {
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

export type HorosWebhookEndpoint = {
  id: string;
  workspaceId?: string | null;
  url: string;
  events?: string[] | null;
  status?: string | null;
  lastTestAt?: string | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  deliveries?: HorosWebhookDelivery[];
};

export type HorosWebhookDelivery = {
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

export type HorosMcpConnection = {
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

export type HorosMcpStatusSnapshot = {
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

export async function listHorosIntegrations(
  workspaceId: string,
  input?: { limit?: number; cursor?: string },
): Promise<{
  integrations: HorosIntegrationConnection[];
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
  return horosFetch<{
    integrations: HorosIntegrationConnection[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/integrations${suffix}`);
}

export type HorosServiceCatalogEntry = {
  id: string;
  name: string;
  status: string;
  routePrefixes: string[];
  models: string[];
  metrics: Record<string, number>;
  summary: string;
  remainingWork: string[];
};

export type HorosServiceCatalog = {
  version: string;
  workspaceId: string;
  generatedAt: string;
  services: HorosServiceCatalogEntry[];
  remaining: string[];
};

export async function listHorosServices(workspaceId: string): Promise<HorosServiceCatalog> {
  const payload = await horosFetch<{ catalog: HorosServiceCatalog }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/services`,
  );
  return payload.catalog;
}

export async function getHorosIntegration(
  workspaceId: string,
  integrationId: string,
): Promise<HorosIntegrationConnection> {
  const payload = await horosFetch<{ integration: HorosIntegrationConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/${encodeURIComponent(integrationId)}`,
  );
  return payload.integration;
}

export async function disconnectHorosIntegration(
  workspaceId: string,
  integrationId: string,
  input?: { reason?: string; notes?: string },
): Promise<HorosIntegrationConnection> {
  const payload = await horosFetch<{ integration: HorosIntegrationConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/${encodeURIComponent(integrationId)}/disconnect`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
  return payload.integration;
}

export async function getHorosIntegrationLogs(workspaceId: string): Promise<{
  logs: Array<Record<string, unknown>>;
}> {
  return horosFetch<{ logs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/logs`,
  );
}

export async function getHorosDeveloperSummary(workspaceId: string): Promise<HorosDeveloperSummary> {
  return horosFetch<HorosDeveloperSummary>(`/workspaces/${encodeURIComponent(workspaceId)}/developer`);
}

export async function getHorosSdkSnapshot(workspaceId: string): Promise<Record<string, unknown>> {
  return horosFetch<Record<string, unknown>>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/sdk`);
}

export async function getHorosOpenApiContract(): Promise<Record<string, unknown>> {
  try {
    return await horosFetch<Record<string, unknown>>("/openapi");
  } catch {
    return fetchJson<Record<string, unknown>>("/api/openapi");
  }
}

export async function listHorosAiCatalog(): Promise<{ version?: string; models: Array<{ provider?: string; model?: string; capabilities?: string[] }> }> {
  return horosFetch<{ version?: string; models: Array<{ provider?: string; model?: string; capabilities?: string[] }> }>("/ai/catalog");
}

export async function getHorosCliCatalog(workspaceId: string): Promise<Record<string, unknown>> {
  return horosFetch<Record<string, unknown>>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/cli`);
}

export async function listHorosVerificationRuns(
  workspaceId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  verifications: HorosVerificationRunHistoryItem[];
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
  return horosFetch<{
    verifications: HorosVerificationRunHistoryItem[];
    page: {
      nextCursor: string | null;
      hasMore: boolean;
      total: number;
    };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/verifications${suffix}`);
}

export async function listHorosMcpConnections(workspaceId: string): Promise<HorosMcpConnection[]> {
  const payload = await horosFetch<{ mcpConnections: HorosMcpConnection[] }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp`,
  );
  return payload.mcpConnections;
}

export async function getHorosMcpStatus(workspaceId: string): Promise<HorosMcpStatusSnapshot> {
  try {
    const payload = await horosFetch<{ mcp: HorosMcpStatusSnapshot }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp/status`,
    );
    return payload.mcp;
  } catch (error) {
    const fallback = await fetchJson<{ mcp: HorosMcpStatusSnapshot }>(
      `/api/mcp/status?workspaceId=${encodeURIComponent(workspaceId)}`,
    );
    if (fallback?.mcp) {
      return fallback.mcp;
    }
    throw error;
  }
}

export async function listHorosRuntimeApiKeys(workspaceId: string): Promise<HorosRuntimeApiKey[]> {
  const payload = await horosFetch<{ runtimeApiKeys: HorosRuntimeApiKey[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/api-keys`,
  );
  return payload.runtimeApiKeys;
}

export async function createHorosRuntimeApiKey(
  workspaceId: string,
  input?: { name?: string; expires?: string; creditLimit?: number | null; resetLimitEvery?: string | null },
): Promise<{
  token: string;
  key: HorosRuntimeApiKey;
  setup: {
    baseUrl: string;
    endpoints: string[];
  };
}> {
  return horosFetch<{
    token: string;
    key: HorosRuntimeApiKey;
    setup: { baseUrl: string; endpoints: string[] };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/runtime-api-keys`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function revokeHorosRuntimeApiKey(
  workspaceId: string,
  keyId: string,
): Promise<HorosRuntimeApiKey> {
  const payload = await horosFetch<{ key: HorosRuntimeApiKey }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/runtime-api-keys/${encodeURIComponent(keyId)}/revoke`,
    { method: "POST" },
  );
  return payload.key;
}

export async function enrollHorosEdgeWorker(
  workspaceId: string,
  workerId: string,
  ttlMs?: number,
): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ enrollment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/edge/enrollment`,
    { method: "POST", body: JSON.stringify({ workerId, ...(ttlMs ? { ttlMs } : {}) }) },
  );
  return payload.enrollment;
}

export async function listHorosDeveloperWebhooks(workspaceId: string): Promise<HorosWebhookEndpoint[]> {
  const payload = await horosFetch<{ webhooks: HorosWebhookEndpoint[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks`,
  );
  return payload.webhooks;
}

export async function createHorosDeveloperWebhook(
  workspaceId: string,
  input: { url: string; events: string[]; status?: string },
): Promise<HorosWebhookEndpoint> {
  const payload = await horosFetch<{ webhook: HorosWebhookEndpoint }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.webhook;
}

export async function getHorosDeveloperWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<HorosWebhookEndpoint> {
  const payload = await horosFetch<{ webhook: HorosWebhookEndpoint }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}`,
  );
  return payload.webhook;
}

export async function listHorosWebhookDeliveries(
  workspaceId: string,
  webhookId: string,
): Promise<HorosWebhookDelivery[]> {
  const payload = await horosFetch<{ deliveries: HorosWebhookDelivery[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries`,
  );
  return payload.deliveries;
}

export async function getHorosWebhookDelivery(
  workspaceId: string,
  webhookId: string,
  deliveryId: string,
): Promise<HorosWebhookDelivery> {
  const payload = await horosFetch<{ delivery: HorosWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}`,
  );
  return payload.delivery;
}

export async function retryHorosWebhookDelivery(
  workspaceId: string,
  webhookId: string,
  deliveryId: string,
): Promise<HorosWebhookDelivery> {
  const payload = await horosFetch<{ delivery: HorosWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`,
    { method: "POST" },
  );
  return payload.delivery;
}

export async function testHorosDeveloperWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<HorosWebhookDelivery> {
  const payload = await horosFetch<{ delivery: HorosWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/test`,
    { method: "POST", body: JSON.stringify({ eventType: "mission.completed", label: "Mission Control test" }) },
  );
  return payload.delivery;
}

export async function registerHorosMcpConnection(
  workspaceId: string,
  input: { name: string; uri: string; capabilities?: string[]; resources?: string[]; policies?: string[] },
): Promise<HorosMcpConnection> {
  const payload = await horosFetch<{ mcpConnection: HorosMcpConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.mcpConnection;
}

export async function connectHorosMcpConnection(
  workspaceId: string,
  connectionId: string,
  input?: { token?: string },
): Promise<HorosMcpConnection> {
  const payload = await horosFetch<{ mcpConnection: HorosMcpConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp/${encodeURIComponent(connectionId)}/connect`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
  return payload.mcpConnection;
}

export type HorosProductionIntelligence = {
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

export async function getHorosProductionIntelligence(
  workspaceId: string,
  limit = 50,
): Promise<HorosProductionIntelligence> {
  const query = new URLSearchParams({ limit: String(limit) });
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/production`;
  const [interactions, signals, clusters, rootCauses, evaluations, replays, fixes, reliability] = await Promise.all([
    horosFetch<{ interactions: Array<Record<string, unknown>> }>(`${base}/interactions?${query}`),
    horosFetch<{ failures: Array<Record<string, unknown>> }>(`${base}/failures?${query}`),
    horosFetch<{ clusters: Array<Record<string, unknown>> }>(`${base}/clusters?${query}`),
    horosFetch<{ rootCauses: Array<Record<string, unknown>> }>(`${base}/root-causes?${query}`),
    horosFetch<{ evaluations: Array<Record<string, unknown>> }>(`${base}/evaluations?${query}`),
    horosFetch<{ replays: Array<Record<string, unknown>> }>(`${base}/replays?${query}`),
    horosFetch<{ fixes: Array<Record<string, unknown>> }>(`${base}/fix-proposals?${query}`),
    horosFetch<{ reliability: Array<Record<string, unknown>> }>(`${base}/reliability?${query}`),
  ]);
  const improvements = await horosFetch<{ improvements: Array<Record<string, unknown>> }>(`${base}/improvements?${query}`);
  return { interactions: interactions.interactions, signals: signals.failures, clusters: clusters.clusters, rootCauses: rootCauses.rootCauses, evaluations: evaluations.evaluations, replays: replays.replays, fixes: fixes.fixes, reliability: reliability.reliability, improvements: improvements.improvements };
}

export async function approveHorosFixProposal(workspaceId: string, proposalId: string): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ proposal: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/production/fix-proposals/${encodeURIComponent(proposalId)}/approve`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return payload.proposal;
}

export type HorosAiExecutionOverview = {
  catalog: Array<Record<string, unknown>>;
  endpoints: Array<Record<string, unknown>>;
  health: Array<Record<string, unknown>>;
  providerHealth: Array<Record<string, unknown>>;
  executions: Array<Record<string, unknown>>;
  costs: Record<string, unknown>;
};

export async function getHorosAiExecutionOverview(workspaceId: string): Promise<HorosAiExecutionOverview> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const [catalog, workers, health, executions, costs] = await Promise.all([
    horosFetch<{ endpoints: Array<Record<string, unknown>> }>(`/ai-execution/catalog`),
    horosFetch<{ endpoints: Array<Record<string, unknown>> }>(`${base}/workers`),
    horosFetch<{ health: Array<Record<string, unknown>>; providerHealth: Array<Record<string, unknown>> }>(`${base}/health`),
    horosFetch<{ executions: Array<Record<string, unknown>> }>(`${base}/history`),
    horosFetch<Record<string, unknown>>(`${base}/costs`),
  ]);
  return { catalog: catalog.endpoints, endpoints: workers.endpoints, health: health.health, providerHealth: health.providerHealth, executions: executions.executions, costs };
}

export async function listHorosHuggingFaceModels(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await horosFetch<{ models: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/model-registry/huggingface`,
  );
  return payload.models;
}

export type HorosHuggingFaceSearchResult = {
  repositoryId: string;
  author: string | null;
  task: string | null;
  library: string | null;
  downloads: number;
  likes: number;
  tags: string[];
};

export async function searchHorosHuggingFaceModels(workspaceId: string, search = ""): Promise<HorosHuggingFaceSearchResult[]> {
  const params = new URLSearchParams({ limit: "20", sort: "downloads", direction: "desc" });
  if (search.trim()) params.set("search", search.trim());
  const payload = await horosFetch<{ results: HorosHuggingFaceSearchResult[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/models/huggingface/search?${params.toString()}`,
  );
  return payload.results;
}

export async function probeHorosAiProviderHealth(workspaceId: string, providers: string[] = ["openrouter"]): Promise<{ health: Array<Record<string, unknown>>; probedAt: string }> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const payload = await horosFetch<{ health: Array<Record<string, unknown>>; probedAt: string }>(`${base}/health/probe`, {
    method: "POST",
    body: JSON.stringify({ providers }),
  });
  return { health: payload.health, probedAt: payload.probedAt };
}

export async function executeHorosAiTest(workspaceId: string, prompt: string): Promise<Record<string, unknown>> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const payload = await horosFetch<{ result: Record<string, unknown> }>(`${base}/execute`, {
    method: "POST",
    body: JSON.stringify({ prompt, preferredProvider: "openrouter", allowedProviders: ["openrouter"], allowFallback: false, maxOutputTokens: 128 }),
  });
  return payload.result;
}

export async function listHorosPrograms(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await horosFetch<{ programs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs`,
  );
  return payload.programs;
}

export async function getHorosProgram(workspaceId: string, programId: string): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}`,
  );
  return payload.program;
}

export async function createHorosProgram(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.program;
}

export async function updateHorosProgramStatus(workspaceId: string, programId: string, status: string): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  return payload.program;
}

export async function listHorosProgramRuns(workspaceId: string, programId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await horosFetch<{ runs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/runs`,
  );
  return payload.runs;
}

export async function createHorosProgramRun(
  workspaceId: string,
  programId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ run: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/runs`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.run;
}

export async function listHorosDeployments(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await horosFetch<{ deployments: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
  );
  return payload.deployments;
}

export async function getHorosDeployment(workspaceId: string, deploymentId: string): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}`,
  );
  return payload.deployment;
}

export async function createHorosDeployment(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.deployment;
}

export async function rollbackHorosDeployment(workspaceId: string, deploymentId: string): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/rollback`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return payload.deployment;
}

export async function listHorosRegistryArtifacts(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await horosFetch<{ artifacts: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/registry`,
  );
  return payload.artifacts;
}

export async function createHorosRegistryArtifact(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await horosFetch<{ artifact: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/registry`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.artifact;
}

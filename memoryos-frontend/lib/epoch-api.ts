"use client";

import { getMemoryOSOrgHeaders, readClerkOrganizationId, readDevConsoleOrganizationId } from "@/lib/org-scope-client";
import { createMasterplanWorkspace, listMasterplanWorkspaces } from "@/lib/masterplan-api";

// Use the stable V12 route. The legacy /api/epoch prefix remains server-side
// only for compatibility with older clients.
const EPOCH_BASE = "/api/v1/epoch";
const ACTIVE_EPOCH_WORKSPACE_STORAGE_KEY_PREFIX = "memoryos.epoch.activeWorkspaceId";

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
    throw new Error(message || `Epoch request failed (${response.status}).`);
  }

  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok) return payload.data;
    throw new Error(payload.error?.message || "Epoch request failed.");
  }

  return payload as T;
}

async function epochFetchOnce(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${EPOCH_BASE}${path}`, {
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
}

function clearPersistedActiveEpochWorkspaceId(): void {
  if (typeof window === "undefined") return;
  const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
  window.localStorage.removeItem(`${ACTIVE_EPOCH_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`);
}

function replaceWorkspaceIdInPath(path: string, workspaceId: string): string | null {
  const match = path.match(/^\/workspaces\/([^/]+)(\/.*)$/);
  if (!match) return null;
  return `/workspaces/${encodeURIComponent(workspaceId)}${match[2]}`;
}

async function epochFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await epochFetchOnce(path, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;
    const workspaceNotFound =
      response.status === 404 &&
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error?.code === "WORKSPACE_NOT_FOUND";

    if (workspaceNotFound && replaceWorkspaceIdInPath(path, "") !== null) {
      clearPersistedActiveEpochWorkspaceId();
      const resolvedWorkspaceId = await resolveActiveEpochWorkspaceId().catch(() => null);
      if (resolvedWorkspaceId) {
        const nextPath = replaceWorkspaceIdInPath(path, resolvedWorkspaceId);
        if (nextPath) {
          const retryResponse = await epochFetchOnce(nextPath, init);
          return readJson<T>(retryResponse);
        }
      }
    }

    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message
        : null;
    throw new Error(message || `Epoch request failed (${response.status}).`);
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

export function readActiveEpochWorkspaceId(): string | null {
  if (typeof window !== "undefined") {
    const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
    const cached = window.localStorage.getItem(`${ACTIVE_EPOCH_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`);
    if (cached && cached.trim().length > 0) {
      return cached.trim();
    }
  }

  return null;
}

function persistActiveEpochWorkspaceId(workspaceId: string | null): void {
  if (typeof window === "undefined") return;
  const scopeKey = readClerkOrganizationId() ?? readDevConsoleOrganizationId() ?? "personal";
  const storageKey = `${ACTIVE_EPOCH_WORKSPACE_STORAGE_KEY_PREFIX}:${scopeKey}`;

  if (workspaceId && workspaceId.trim().length > 0) {
    window.localStorage.setItem(storageKey, workspaceId.trim());
    return;
  }

  window.localStorage.removeItem(storageKey);
}

async function readValidatedActiveEpochWorkspaceId(): Promise<string | null> {
  const cached = readActiveEpochWorkspaceId();
  const workspaces = await listMasterplanWorkspaces().catch(() => []);

  if (cached && workspaces.some((workspace) => workspace.id === cached)) {
    return cached;
  }

  if (cached) {
    persistActiveEpochWorkspaceId(null);
  }

  return workspaces[0]?.id ?? null;
}

export async function resolveActiveEpochWorkspaceId(): Promise<string | null> {
  const cached = await readValidatedActiveEpochWorkspaceId();
  if (cached) {
    persistActiveEpochWorkspaceId(cached);
    return cached;
  }

  const createdWorkspace = await createMasterplanWorkspace({
    name: "MemoryOS Workspace",
    plan: "developer",
    region: "local",
  }).catch(() => null);

  const workspaceId = createdWorkspace?.id ?? null;
  persistActiveEpochWorkspaceId(workspaceId);
  return workspaceId;
}

export type EpochMissionControlSnapshot = {
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
    institutions: EpochInstitution[];
    missions: EpochMission[];
    smokeRuns?: unknown[];
    integrations?: unknown[];
    artifacts?: unknown[];
  };
};

export type EpochMission = {
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

export type EpochInstitution = {
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
  missions?: EpochMission[];
};

export type EpochInstitutionDetail = EpochInstitution & {
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

export type EpochTemplate = {
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
  institutions?: EpochInstitution[];
  versions?: Array<{
    id: string;
    version?: string;
    createdAt?: string;
  }>;
};

export type EpochInstitutionVersion = {
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

export type EpochEvidence = {
  id: string;
  kind?: string;
  url?: string | null;
  filePath?: string | null;
  contentType?: string | null;
  summary?: string | null;
  createdAt?: string;
};

export type EpochAuthorityPolicy = {
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

export type EpochAuthorityPolicyDetail = EpochAuthorityPolicy & {
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

export type EpochAuthorityGate = {
  mission: EpochMissionDetail;
  policy: EpochAuthorityPolicyDetail | null;
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

export type EpochExecutionRun = {
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

export type EpochVerificationRun = {
  id: string;
  finalDecision?: string | null;
  confidence?: number | null;
  checklist?: unknown[] | null;
  evidenceSummary?: Record<string, unknown> | null;
  auditTrail?: unknown[] | null;
  createdAt?: string;
};

export type EpochVerificationRunHistoryItem = EpochVerificationRun & {
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

export type EpochInstitutionHistory = {
  institutionId: string;
  institution?: EpochInstitutionDetail | null;
  versions: EpochInstitutionVersion[];
  missions: EpochMission[];
  memoryRecords: EpochMemoryRecord[];
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

export type EpochCertificate = {
  id: string;
  status?: string | null;
  summary?: string | null;
  evidenceSummary?: Record<string, unknown> | null;
  createdAt?: string;
};

export type EpochEvidenceBundle = {
  version?: string;
  bundleHash: string;
  mission?: Record<string, unknown>;
  evidence?: unknown[];
  verification?: Record<string, unknown> | null;
};

export type EpochSettlement = {
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

export async function listEpochCertificates(
  workspaceId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  certificates: EpochCertificate[];
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
  return epochFetch<{
    certificates: EpochCertificate[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/certificates${suffix}`);
}

export async function getEpochMissionSettlement(workspaceId: string, missionId: string): Promise<EpochSettlement | null> {
  const payload = await epochFetch<{ settlement?: EpochSettlement }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`,
  );
  return payload.settlement ?? null;
}

export async function getEpochMissionEvidenceBundle(workspaceId: string, missionId: string): Promise<EpochEvidenceBundle> {
  const payload = await epochFetch<{ bundle: EpochEvidenceBundle }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence-bundle`,
  );
  return payload.bundle;
}

export async function issueEpochMissionCertificate(
  workspaceId: string,
  missionId: string,
  input?: {
    summary?: string;
    approvals?: string[];
    evidenceSummary?: Record<string, unknown>;
    auditTrail?: Array<Record<string, unknown>>;
    proof?: Record<string, unknown>;
  },
): Promise<{ certificate: EpochCertificate }> {
  return epochFetch<{ certificate: EpochCertificate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/certificate`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
}

export async function settleEpochMission(
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
): Promise<{ settlement: EpochSettlement }> {
  return epochFetch<{ settlement: EpochSettlement }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export type EpochMemoryRecord = {
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

export type EpochMemoryRecordDetail = EpochMemoryRecord & {
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

export type EpochMissionDetail = EpochMission & {
  institution?: EpochInstitution | null;
  authorityPolicies?: EpochAuthorityPolicy[];
  executionRun?: EpochExecutionRun | null;
  verificationRun?: EpochVerificationRun | null;
  certificate?: EpochCertificate | null;
  memoryRecord?: EpochMemoryRecord | null;
  evidence?: EpochEvidence[];
  timeline?: Array<{
    id: string;
    stage?: string;
    status?: string;
    note?: string;
    timestamp?: string;
  }>;
};

export type EpochMissionRunResult =
  | {
      blocked: true;
      reason: string;
      gate: EpochAuthorityGate;
      mission: EpochMissionDetail;
    }
  | {
      approvalRequired: true;
      reason: string;
      gate: EpochAuthorityGate;
      mission: EpochMissionDetail;
    }
  | {
      idempotent: true;
      mission: EpochMissionDetail;
      execution: EpochExecutionRun | null;
      evidence: EpochEvidence[];
      verification: EpochVerificationRun | null;
      certificate: EpochCertificate | null;
      memoryRecord: EpochMemoryRecord | null;
    }
  | {
      mission: EpochMissionDetail;
      execution: EpochExecutionRun;
      evidence: EpochEvidence[];
      verification: EpochVerificationRun;
      certificate: EpochCertificate | null;
      memoryRecord: EpochMemoryRecord | null;
    };

export async function getEpochMissionControlSnapshot(
  workspaceId: string,
  input?: string | { range?: string; search?: string; start?: string; end?: string },
): Promise<EpochMissionControlSnapshot> {
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
  const payload = await epochFetch<{ snapshot: EpochMissionControlSnapshot }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/mission-control/snapshot${search}`,
  );
  return payload.snapshot;
}

export async function listEpochExecutions(workspaceId: string): Promise<EpochExecutionRun[]> {
  const payload = await epochFetch<{ executions: EpochExecutionRun[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/executions`,
  );
  return payload.executions;
}

export type EpochPagedResult<T> = {
  items: T[];
  page: { nextCursor: string | null; hasMore: boolean; total: number };
};

export async function listEpochEvidence(workspaceId: string): Promise<EpochPagedResult<EpochEvidence>> {
  const payload = await epochFetch<{ evidence: EpochEvidence[]; page: EpochPagedResult<EpochEvidence>["page"] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/evidence`,
  );
  return { items: payload.evidence, page: payload.page };
}

export async function listEpochRecoveryEscalations(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await epochFetch<{ escalations: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/recovery-escalations`,
  );
  return payload.escalations;
}

export async function resolveEpochRecoveryEscalation(workspaceId: string, escalationId: string, resolution: string): Promise<boolean> {
  await epochFetch<{ resolved: boolean }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/recovery-escalations/${encodeURIComponent(escalationId)}/resolve`,
    { method: "POST", body: JSON.stringify({ resolution }) },
  );
  return true;
}

export async function listEpochInstitutions(
  workspaceId: string,
  input?: { search?: string },
): Promise<EpochInstitution[]> {
  const search = new URLSearchParams();
  if (input?.search) search.set("search", input.search);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await epochFetch<{ institutions: EpochInstitution[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions${suffix}`,
  );
  return payload.institutions;
}

export async function listEpochWorkers(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await epochFetch<{ workers: Array<Record<string, unknown>> }>(`/workspaces/${encodeURIComponent(workspaceId)}/workers`);
  return payload.workers;
}

export async function createEpochWorker(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ worker: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/workers`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.worker;
}

export async function updateEpochWorker(workspaceId: string, workerId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ worker: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/workers/${encodeURIComponent(workerId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  return payload.worker;
}

export async function getEpochAuditTrail(workspaceId: string): Promise<{ auditLogs: Array<Record<string, unknown>>; runtimeEvents: Array<Record<string, unknown>>; deadLetters: Array<Record<string, unknown>> }> {
  return epochFetch<{ auditLogs: Array<Record<string, unknown>>; runtimeEvents: Array<Record<string, unknown>>; deadLetters: Array<Record<string, unknown>> }>(`/workspaces/${encodeURIComponent(workspaceId)}/audit`);
}

export async function createEpochInstitution(
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
): Promise<EpochInstitution> {
  const payload = await epochFetch<{ institution: EpochInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.institution;
}

export async function archiveEpochInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<EpochInstitution> {
  const payload = await epochFetch<{ institution: EpochInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/archive`,
    { method: "POST" },
  );
  return payload.institution;
}

export async function updateEpochInstitution(
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
): Promise<EpochInstitution> {
  const payload = await epochFetch<{ institution: EpochInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return payload.institution;
}

export async function cloneEpochInstitution(
  workspaceId: string,
  institutionId: string,
  input?: {
    name?: string;
    version?: string;
  },
): Promise<EpochInstitution> {
  const payload = await epochFetch<{ institution: EpochInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/clone`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
  return payload.institution;
}

export async function deleteEpochInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<EpochInstitution> {
  const payload = await epochFetch<{ institution: EpochInstitution }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
    { method: "DELETE" },
  );
  return payload.institution;
}

export async function getEpochInstitution(
  workspaceId: string,
  institutionId: string,
): Promise<EpochInstitutionDetail> {
  const payload = await epochFetch<{ institution: EpochInstitutionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}`,
  );
  return payload.institution;
}

export async function listEpochInstitutionVersions(
  workspaceId: string,
  institutionId: string,
  input?: { limit?: number; cursor?: string },
): Promise<{
  versions: EpochInstitutionVersion[];
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
  return epochFetch<{
    versions: EpochInstitutionVersion[];
    page: {
      nextCursor: string | null;
      hasMore: boolean;
      total: number;
    };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/versions${suffix}`);
}

export async function getEpochInstitutionHistory(
  workspaceId: string,
  institutionId: string,
): Promise<EpochInstitutionHistory> {
  return epochFetch<EpochInstitutionHistory>(
    `/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/history`,
  );
}

export async function listEpochTemplates(
  workspaceId: string,
  input?: { search?: string },
): Promise<EpochTemplate[]> {
  const search = new URLSearchParams();
  if (input?.search) search.set("search", input.search);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await epochFetch<{ templates: EpochTemplate[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates${suffix}`,
  );
  return payload.templates;
}

export async function getEpochTemplate(
  workspaceId: string,
  templateId: string,
): Promise<EpochTemplate> {
  const payload = await epochFetch<{ template: EpochTemplate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates/${encodeURIComponent(templateId)}`,
  );
  return payload.template;
}

export async function createEpochTemplate(
  workspaceId: string,
  input: {
    name: string;
    category?: string;
    description?: string;
    version?: string;
    definition?: Record<string, unknown>;
    proof?: Record<string, unknown>;
  },
): Promise<EpochTemplate> {
  const payload = await epochFetch<{ template: EpochTemplate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/templates`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.template;
}

export async function listEpochMissions(
  workspaceId: string,
  input?: { institutionId?: string; state?: string },
): Promise<EpochMissionDetail[]> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (input?.state) search.set("state", input.state);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const payload = await epochFetch<{ missions: EpochMissionDetail[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions${suffix}`,
  );
  return payload.missions;
}

export async function getEpochMission(
  workspaceId: string,
  missionId: string,
): Promise<EpochMissionDetail> {
  const payload = await epochFetch<{ mission: EpochMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}`,
  );
  return payload.mission;
}

export async function getEpochAuthorityGate(
  workspaceId: string,
  missionId: string,
): Promise<EpochAuthorityGate> {
  const payload = await epochFetch<{ gate: EpochAuthorityGate }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority`,
  );
  return payload.gate;
}

export async function listEpochAuthorityPolicies(
  workspaceId: string,
  missionId: string,
  input?: { institutionId?: string; limit?: number; cursor?: string },
): Promise<{
  policies: EpochAuthorityPolicy[];
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
  const payload = await epochFetch<{
    policies: EpochAuthorityPolicy[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority/policies${suffix}`,
  );
  return payload;
}

export async function createEpochAuthorityPolicy(
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
): Promise<EpochAuthorityPolicy> {
  const payload = await epochFetch<{ policy: EpochAuthorityPolicy }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.policy;
}

export async function getEpochAuthorityPolicy(
  workspaceId: string,
  missionId: string,
  policyId: string,
): Promise<EpochAuthorityPolicyDetail> {
  const payload = await epochFetch<{ policy: EpochAuthorityPolicyDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/authority/policies/${encodeURIComponent(policyId)}`,
  );
  return payload.policy;
}

export async function createEpochMission(
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
): Promise<EpochMissionDetail> {
  const payload = await epochFetch<{ mission: EpochMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.mission;
}

export async function runEpochMission(
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
): Promise<EpochMissionRunResult> {
  return epochFetch<EpochMissionRunResult>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/run`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function queueEpochMission(
  workspaceId: string,
  missionId: string,
  input?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ job: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/queue/execute`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
  return payload.job;
}

export async function cancelEpochMission(workspaceId: string, missionId: string, reason?: string): Promise<EpochMissionDetail> {
  const payload = await epochFetch<{ mission: EpochMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
  return payload.mission;
}

export async function decideEpochMissionCandidates(
  workspaceId: string,
  missionId: string,
  input: { evaluations: Array<Record<string, unknown>>; objectives?: Array<{ metric: string; direction: "minimize" | "maximize"; weight: number }> },
): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ decision: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/decision`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.decision;
}

export async function sendEpochMissionTelemetry(
  workspaceId: string,
  missionId: string,
  input: { workerId: string; measurements: Record<string, number>; evidenceIds?: string[]; observedAt?: string },
): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ observation: Record<string, unknown>; workerId: string }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/telemetry`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return { ...payload.observation, workerId: payload.workerId };
}

export async function verifyEpochMissionWindow(
  workspaceId: string,
  missionId: string,
  input: { measurements: Record<string, number>; constraints: Array<Record<string, unknown>>; evidenceIds: string[]; requiredWindowSeconds: number; observedWindowSeconds: number },
): Promise<{ verification: Record<string, unknown>; outcome: Record<string, unknown> }> {
  return epochFetch<{ verification: Record<string, unknown>; outcome: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verification-window`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function retryEpochMission(workspaceId: string, missionId: string, reason?: string): Promise<EpochMissionDetail> {
  const payload = await epochFetch<{ mission: EpochMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/retry`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
  return payload.mission;
}

export async function decideEpochMissionApproval(
  workspaceId: string,
  missionId: string,
  decision: "approved" | "rejected" | "review",
  reason?: string,
): Promise<EpochMissionDetail> {
  const payload = await epochFetch<{ mission: EpochMissionDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/approval`,
    { method: "POST", body: JSON.stringify({ decision, reason }) },
  );
  return payload.mission;
}

export async function createEpochMissionEvidence(
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
): Promise<{ evidence: EpochEvidence[] }> {
  return epochFetch<{ evidence: EpochEvidence[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function verifyEpochMission(
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
): Promise<{ verification: EpochVerificationRun }> {
  return epochFetch<{ verification: EpochVerificationRun }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verify`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function listEpochMemoryRecords(
  workspaceId: string,
  input?: { institutionId?: string; missionId?: string; limit?: number; cursor?: string },
): Promise<{
  memoryRecords: EpochMemoryRecordDetail[];
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
  return epochFetch<{
    memoryRecords: EpochMemoryRecordDetail[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/memory-records${suffix}`);
}

export async function getEpochMemoryRecord(
  workspaceId: string,
  memoryRecordId: string,
): Promise<EpochMemoryRecordDetail> {
  const payload = await epochFetch<{ memoryRecord: EpochMemoryRecordDetail }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory-records/${encodeURIComponent(memoryRecordId)}`,
  );
  return payload.memoryRecord;
}

export async function listEpochMemoryLessons(
  workspaceId: string,
  input?: { institutionId?: string; missionId?: string },
): Promise<{ lessons: EpochMemoryLesson[]; count: number }> {
  const search = new URLSearchParams();
  if (input?.institutionId) search.set("institutionId", input.institutionId);
  if (input?.missionId) search.set("missionId", input.missionId);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return epochFetch<{ lessons: EpochMemoryLesson[]; count: number }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons${suffix}`,
  );
}

export async function applyEpochMemoryLesson(
  workspaceId: string,
  lessonId: string,
): Promise<{ lesson: EpochMemoryLesson }> {
  return epochFetch<{ lesson: EpochMemoryLesson }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons/${encodeURIComponent(lessonId)}/apply`,
    { method: "POST" },
  );
}

export async function rejectEpochMemoryLesson(
  workspaceId: string,
  lessonId: string,
): Promise<{ lesson: EpochMemoryLesson }> {
  return epochFetch<{ lesson: EpochMemoryLesson }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/memory/lessons/${encodeURIComponent(lessonId)}/reject`,
    { method: "POST" },
  );
}

export async function listEpochInstitutionMemoryRecords(
  workspaceId: string,
  institutionId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  memoryRecords: EpochMemoryRecordDetail[];
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
  return epochFetch<{
    memoryRecords: EpochMemoryRecordDetail[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/institutions/${encodeURIComponent(institutionId)}/memory-records${suffix}`);
}

export type EpochIntegrationConnection = {
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

export type EpochIntegrationHealth = {
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

export type EpochDeveloperSummary = {
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

export type EpochMemoryLessonSourceRecord = {
  id: string;
  summary?: string | null;
  missionId?: string | null;
  institutionId?: string | null;
  updatedAt?: string;
};

export type EpochMemoryLesson = {
  id: string;
  workspaceId?: string | null;
  title?: string;
  content?: string;
  status?: string | null;
  count?: number;
  confidence?: number;
  proof?: Record<string, unknown> | null;
  sourceRecords?: EpochMemoryLessonSourceRecord[];
  derived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type EpochRuntimeApiKey = {
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

export type EpochWebhookEndpoint = {
  id: string;
  workspaceId?: string | null;
  url: string;
  events?: string[] | null;
  status?: string | null;
  lastTestAt?: string | null;
  proof?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  deliveries?: EpochWebhookDelivery[];
};

export type EpochWebhookDelivery = {
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

export type EpochMcpConnection = {
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

export type EpochMcpStatusSnapshot = {
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

export async function listEpochIntegrations(
  workspaceId: string,
  input?: { limit?: number; cursor?: string },
): Promise<{
  integrations: EpochIntegrationConnection[];
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
  return epochFetch<{
    integrations: EpochIntegrationConnection[];
    page: { nextCursor: string | null; hasMore: boolean; total: number };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/integrations${suffix}`);
}

export type EpochServiceCatalogEntry = {
  id: string;
  name: string;
  status: string;
  routePrefixes: string[];
  models: string[];
  metrics: Record<string, number>;
  summary: string;
  remainingWork: string[];
};

export type EpochServiceCatalog = {
  version: string;
  workspaceId: string;
  generatedAt: string;
  services: EpochServiceCatalogEntry[];
  remaining: string[];
};

export async function listEpochServices(workspaceId: string): Promise<EpochServiceCatalog> {
  const payload = await epochFetch<{ catalog: EpochServiceCatalog }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/services`,
  );
  return payload.catalog;
}

export async function getEpochIntegration(
  workspaceId: string,
  integrationId: string,
): Promise<EpochIntegrationConnection> {
  const payload = await epochFetch<{ integration: EpochIntegrationConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/${encodeURIComponent(integrationId)}`,
  );
  return payload.integration;
}

export async function disconnectEpochIntegration(
  workspaceId: string,
  integrationId: string,
  input?: { reason?: string; notes?: string },
): Promise<EpochIntegrationConnection> {
  const payload = await epochFetch<{ integration: EpochIntegrationConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/${encodeURIComponent(integrationId)}/disconnect`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  );
  return payload.integration;
}

export async function getEpochIntegrationLogs(workspaceId: string): Promise<{
  logs: Array<Record<string, unknown>>;
}> {
  return epochFetch<{ logs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/integrations/logs`,
  );
}

export async function getEpochDeveloperSummary(workspaceId: string): Promise<EpochDeveloperSummary> {
  return epochFetch<EpochDeveloperSummary>(`/workspaces/${encodeURIComponent(workspaceId)}/developer`);
}

export async function getEpochSdkSnapshot(workspaceId: string): Promise<Record<string, unknown>> {
  return epochFetch<Record<string, unknown>>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/sdk`);
}

export async function getEpochOpenApiContract(): Promise<Record<string, unknown>> {
  try {
    return await epochFetch<Record<string, unknown>>("/openapi");
  } catch {
    return fetchJson<Record<string, unknown>>("/api/openapi");
  }
}

export async function listEpochAiCatalog(): Promise<{ version?: string; models: Array<{ provider?: string; model?: string; capabilities?: string[] }> }> {
  return epochFetch<{ version?: string; models: Array<{ provider?: string; model?: string; capabilities?: string[] }> }>("/ai/catalog");
}

export async function getEpochCliCatalog(workspaceId: string): Promise<Record<string, unknown>> {
  return epochFetch<Record<string, unknown>>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/cli`);
}

export async function listEpochVerificationRuns(
  workspaceId: string,
  input?: { missionId?: string; limit?: number; cursor?: string },
): Promise<{
  verifications: EpochVerificationRunHistoryItem[];
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
  return epochFetch<{
    verifications: EpochVerificationRunHistoryItem[];
    page: {
      nextCursor: string | null;
      hasMore: boolean;
      total: number;
    };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/verifications${suffix}`);
}

export async function listEpochMcpConnections(workspaceId: string): Promise<EpochMcpConnection[]> {
  const payload = await epochFetch<{ mcpConnections: EpochMcpConnection[] }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp`,
  );
  return payload.mcpConnections;
}

export async function getEpochMcpStatus(workspaceId: string): Promise<EpochMcpStatusSnapshot> {
  try {
    const payload = await epochFetch<{ mcp: EpochMcpStatusSnapshot }>(
      `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp/status`,
    );
    return payload.mcp;
  } catch (error) {
    const fallback = await fetchJson<{ mcp: EpochMcpStatusSnapshot }>(
      `/api/mcp/status?workspaceId=${encodeURIComponent(workspaceId)}`,
    );
    if (fallback?.mcp) {
      return fallback.mcp;
    }
    throw error;
  }
}

export async function listEpochRuntimeApiKeys(workspaceId: string): Promise<EpochRuntimeApiKey[]> {
  const payload = await epochFetch<{ runtimeApiKeys: EpochRuntimeApiKey[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/api-keys`,
  );
  return payload.runtimeApiKeys;
}

export async function createEpochRuntimeApiKey(
  workspaceId: string,
  input?: { name?: string; expires?: string; creditLimit?: number | null; resetLimitEvery?: string | null },
): Promise<{
  token: string;
  key: EpochRuntimeApiKey;
  setup: {
    baseUrl: string;
    endpoints: string[];
  };
}> {
  return epochFetch<{
    token: string;
    key: EpochRuntimeApiKey;
    setup: { baseUrl: string; endpoints: string[] };
  }>(`/workspaces/${encodeURIComponent(workspaceId)}/developer/runtime-api-keys`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function revokeEpochRuntimeApiKey(
  workspaceId: string,
  keyId: string,
): Promise<EpochRuntimeApiKey> {
  const payload = await epochFetch<{ key: EpochRuntimeApiKey }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/runtime-api-keys/${encodeURIComponent(keyId)}/revoke`,
    { method: "POST" },
  );
  return payload.key;
}

export async function enrollEpochEdgeWorker(
  workspaceId: string,
  workerId: string,
  ttlMs?: number,
): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ enrollment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/edge/enrollment`,
    { method: "POST", body: JSON.stringify({ workerId, ...(ttlMs ? { ttlMs } : {}) }) },
  );
  return payload.enrollment;
}

export async function listEpochDeveloperWebhooks(workspaceId: string): Promise<EpochWebhookEndpoint[]> {
  const payload = await epochFetch<{ webhooks: EpochWebhookEndpoint[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks`,
  );
  return payload.webhooks;
}

export async function createEpochDeveloperWebhook(
  workspaceId: string,
  input: { url: string; events: string[]; status?: string },
): Promise<EpochWebhookEndpoint> {
  const payload = await epochFetch<{ webhook: EpochWebhookEndpoint }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return payload.webhook;
}

export async function getEpochDeveloperWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<EpochWebhookEndpoint> {
  const payload = await epochFetch<{ webhook: EpochWebhookEndpoint }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}`,
  );
  return payload.webhook;
}

export async function listEpochWebhookDeliveries(
  workspaceId: string,
  webhookId: string,
): Promise<EpochWebhookDelivery[]> {
  const payload = await epochFetch<{ deliveries: EpochWebhookDelivery[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries`,
  );
  return payload.deliveries;
}

export async function getEpochWebhookDelivery(
  workspaceId: string,
  webhookId: string,
  deliveryId: string,
): Promise<EpochWebhookDelivery> {
  const payload = await epochFetch<{ delivery: EpochWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}`,
  );
  return payload.delivery;
}

export async function retryEpochWebhookDelivery(
  workspaceId: string,
  webhookId: string,
  deliveryId: string,
): Promise<EpochWebhookDelivery> {
  const payload = await epochFetch<{ delivery: EpochWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`,
    { method: "POST" },
  );
  return payload.delivery;
}

export async function testEpochDeveloperWebhook(
  workspaceId: string,
  webhookId: string,
): Promise<EpochWebhookDelivery> {
  const payload = await epochFetch<{ delivery: EpochWebhookDelivery }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/webhooks/${encodeURIComponent(webhookId)}/test`,
    { method: "POST", body: JSON.stringify({ eventType: "mission.completed", label: "Mission Control test" }) },
  );
  return payload.delivery;
}

export async function registerEpochMcpConnection(
  workspaceId: string,
  input: { name: string; uri: string; capabilities?: string[]; resources?: string[]; policies?: string[] },
): Promise<EpochMcpConnection> {
  const payload = await epochFetch<{ mcpConnection: EpochMcpConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.mcpConnection;
}

export async function connectEpochMcpConnection(
  workspaceId: string,
  connectionId: string,
  input?: { token?: string },
): Promise<EpochMcpConnection> {
  const payload = await epochFetch<{ mcpConnection: EpochMcpConnection }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/developer/mcp/${encodeURIComponent(connectionId)}/connect`,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
  return payload.mcpConnection;
}

export type EpochProductionIntelligence = {
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

export async function getEpochProductionIntelligence(
  workspaceId: string,
  limit = 50,
): Promise<EpochProductionIntelligence> {
  const query = new URLSearchParams({ limit: String(limit) });
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/production`;
  const [interactions, signals, clusters, rootCauses, evaluations, replays, fixes, reliability] = await Promise.all([
    epochFetch<{ interactions: Array<Record<string, unknown>> }>(`${base}/interactions?${query}`),
    epochFetch<{ failures: Array<Record<string, unknown>> }>(`${base}/failures?${query}`),
    epochFetch<{ clusters: Array<Record<string, unknown>> }>(`${base}/clusters?${query}`),
    epochFetch<{ rootCauses: Array<Record<string, unknown>> }>(`${base}/root-causes?${query}`),
    epochFetch<{ evaluations: Array<Record<string, unknown>> }>(`${base}/evaluations?${query}`),
    epochFetch<{ replays: Array<Record<string, unknown>> }>(`${base}/replays?${query}`),
    epochFetch<{ fixes: Array<Record<string, unknown>> }>(`${base}/fix-proposals?${query}`),
    epochFetch<{ reliability: Array<Record<string, unknown>> }>(`${base}/reliability?${query}`),
  ]);
  const improvements = await epochFetch<{ improvements: Array<Record<string, unknown>> }>(`${base}/improvements?${query}`);
  return { interactions: interactions.interactions, signals: signals.failures, clusters: clusters.clusters, rootCauses: rootCauses.rootCauses, evaluations: evaluations.evaluations, replays: replays.replays, fixes: fixes.fixes, reliability: reliability.reliability, improvements: improvements.improvements };
}

export async function approveEpochFixProposal(workspaceId: string, proposalId: string): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ proposal: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/production/fix-proposals/${encodeURIComponent(proposalId)}/approve`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return payload.proposal;
}

export type EpochAiExecutionOverview = {
  catalog: Array<Record<string, unknown>>;
  endpoints: Array<Record<string, unknown>>;
  health: Array<Record<string, unknown>>;
  providerHealth: Array<Record<string, unknown>>;
  executions: Array<Record<string, unknown>>;
  costs: Record<string, unknown>;
};

export async function getEpochAiExecutionOverview(workspaceId: string): Promise<EpochAiExecutionOverview> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const [catalog, workers, health, executions, costs] = await Promise.all([
    epochFetch<{ endpoints: Array<Record<string, unknown>> }>(`/ai-execution/catalog`),
    epochFetch<{ endpoints: Array<Record<string, unknown>> }>(`${base}/workers`),
    epochFetch<{ health: Array<Record<string, unknown>>; providerHealth: Array<Record<string, unknown>> }>(`${base}/health`),
    epochFetch<{ executions: Array<Record<string, unknown>> }>(`${base}/history`),
    epochFetch<Record<string, unknown>>(`${base}/costs`),
  ]);
  return { catalog: catalog.endpoints, endpoints: workers.endpoints, health: health.health, providerHealth: health.providerHealth, executions: executions.executions, costs };
}

export async function listEpochHuggingFaceModels(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await epochFetch<{ models: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/model-registry/huggingface`,
  );
  return payload.models;
}

export type EpochHuggingFaceSearchResult = {
  repositoryId: string;
  author: string | null;
  task: string | null;
  library: string | null;
  downloads: number;
  likes: number;
  tags: string[];
};

export async function searchEpochHuggingFaceModels(workspaceId: string, search = ""): Promise<EpochHuggingFaceSearchResult[]> {
  const params = new URLSearchParams({ limit: "20", sort: "downloads", direction: "desc" });
  if (search.trim()) params.set("search", search.trim());
  const payload = await epochFetch<{ results: EpochHuggingFaceSearchResult[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/models/huggingface/search?${params.toString()}`,
  );
  return payload.results;
}

export async function probeEpochAiProviderHealth(workspaceId: string, providers: string[] = ["openrouter"]): Promise<{ health: Array<Record<string, unknown>>; probedAt: string }> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const payload = await epochFetch<{ health: Array<Record<string, unknown>>; probedAt: string }>(`${base}/health/probe`, {
    method: "POST",
    body: JSON.stringify({ providers }),
  });
  return { health: payload.health, probedAt: payload.probedAt };
}

export async function executeEpochAiTest(workspaceId: string, prompt: string): Promise<Record<string, unknown>> {
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/ai-execution`;
  const payload = await epochFetch<{ result: Record<string, unknown> }>(`${base}/execute`, {
    method: "POST",
    body: JSON.stringify({ prompt, preferredProvider: "openrouter", allowedProviders: ["openrouter"], allowFallback: false, maxOutputTokens: 128 }),
  });
  return payload.result;
}

export async function listEpochPrograms(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await epochFetch<{ programs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs`,
  );
  return payload.programs;
}

export async function getEpochProgram(workspaceId: string, programId: string): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}`,
  );
  return payload.program;
}

export async function createEpochProgram(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.program;
}

export async function updateEpochProgramStatus(workspaceId: string, programId: string, status: string): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ program: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  return payload.program;
}

export async function listEpochProgramRuns(workspaceId: string, programId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await epochFetch<{ runs: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/runs`,
  );
  return payload.runs;
}

export async function createEpochProgramRun(
  workspaceId: string,
  programId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ run: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/programs/${encodeURIComponent(programId)}/runs`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.run;
}

export async function listEpochDeployments(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await epochFetch<{ deployments: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
  );
  return payload.deployments;
}

export async function getEpochDeployment(workspaceId: string, deploymentId: string): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}`,
  );
  return payload.deployment;
}

export async function createEpochDeployment(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.deployment;
}

export async function rollbackEpochDeployment(workspaceId: string, deploymentId: string): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ deployment: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/rollback`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return payload.deployment;
}

export async function listEpochRegistryArtifacts(workspaceId: string): Promise<Array<Record<string, unknown>>> {
  const payload = await epochFetch<{ artifacts: Array<Record<string, unknown>> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/registry`,
  );
  return payload.artifacts;
}

export async function createEpochRegistryArtifact(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const payload = await epochFetch<{ artifact: Record<string, unknown> }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/registry`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload.artifact;
}

export type PolicySummaryCard = {
  key: string;
  label: string;
  value: string | number;
  trend: string;
  trendColor: string;
  sparklineData: number[];
};

export type PolicyCenterSummary = {
  cards: PolicySummaryCard[];
  totals: {
    active: number;
    highRisk: number;
    blocked: number;
    autoApprovals: number;
    coverage: number;
  };
  proofLoop: string;
};

export type PolicyRow = {
  id: string;
  name: string;
  desc: string;
  description: string;
  scope: string;
  severity: string;
  enforcement: string;
  action: string;
  condition: unknown;
  domain: string;
  status: string;
  ownerInitials: string;
  ownerName: string;
  ownerRole: string;
  ownerColor: string;
  version: string;
  isTemplate: boolean;
  ruleLogic: string;
  triggerConditions: string[];
  allowedActions: string[];
  blockedActionNames: string[];
  requiredApprover: string | null;
  proof: unknown;
  metadata: Record<string, unknown>;
  lastUpdated: string;
  lastUpdatedDisplay: string;
  violationCount: number;
  exceptionCount: number;
  auditLogCount: number;
  versionCount: number;
  checkCount: number;
};

export type PolicyViolationTrendPoint = { name: string; Blocked: number; Allowed: number; trend: number };
export type PolicyCoveragePoint = { name: string; value: number; count: number; color: string; percent: string };
export type PolicyExceptionRow = {
  id: string;
  policyId: string | null;
  reason: string;
  requester: string | null;
  approver: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  policy: PolicyRow | null;
};
export type PolicyAuditLogRow = { id: string; policyId: string | null; action: string; actor: string | null; summary: string; diff: unknown; proof: unknown; createdAt: string };
export type PolicyVersionRow = { id: string; policyId: string; version: string; snapshot: unknown; createdBy: string | null; createdAt: string };

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `policy_center_api_${response.status}`);
  }
  return response.json() as Promise<T>;
}

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function getPolicyCenterSummary(): Promise<PolicyCenterSummary> {
  return apiJson<PolicyCenterSummary>("/api/policy-center/summary");
}

export async function listPolicies(filters: { tab?: string; scope?: string; severity?: string; status?: string } = {}): Promise<PolicyRow[]> {
  const body = await apiJson<{ policies: PolicyRow[] }>(`/api/policies${qs(filters)}`);
  return body.policies;
}

export async function getPolicy(id: string): Promise<PolicyRow> {
  const body = await apiJson<{ policy: PolicyRow }>(`/api/policies/${encodeURIComponent(id)}`);
  return body.policy;
}

export async function createPolicy(payload: Partial<PolicyRow>): Promise<PolicyRow> {
  const body = await apiJson<{ policy: PolicyRow }>("/api/policies", { method: "POST", body: JSON.stringify(payload) });
  return body.policy;
}

export async function updatePolicy(id: string, payload: Partial<PolicyRow>): Promise<PolicyRow> {
  const body = await apiJson<{ policy: PolicyRow }>(`/api/policies/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  return body.policy;
}

export async function activatePolicy(id: string): Promise<PolicyRow> {
  const body = await apiJson<{ policy: PolicyRow }>(`/api/policies/${encodeURIComponent(id)}/activate`, { method: "POST" });
  return body.policy;
}

export async function deactivatePolicy(id: string): Promise<PolicyRow> {
  const body = await apiJson<{ policy: PolicyRow }>(`/api/policies/${encodeURIComponent(id)}/deactivate`, { method: "POST" });
  return body.policy;
}

export async function archivePolicy(id: string): Promise<PolicyRow> {
  const body = await apiJson<{ policy: PolicyRow }>(`/api/policies/${encodeURIComponent(id)}/archive`, { method: "POST" });
  return body.policy;
}

export async function duplicatePolicy(id: string): Promise<PolicyRow> {
  const body = await apiJson<{ policy: PolicyRow }>(`/api/policies/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
  return body.policy;
}

export async function createPolicyVersion(id: string, version?: string): Promise<PolicyVersionRow> {
  const body = await apiJson<{ version: PolicyVersionRow }>(`/api/policies/${encodeURIComponent(id)}/create-version`, { method: "POST", body: JSON.stringify({ version }) });
  return body.version;
}

export async function addPolicyException(id: string, reason: string): Promise<PolicyExceptionRow> {
  const body = await apiJson<{ exception: PolicyExceptionRow }>(`/api/policies/${encodeURIComponent(id)}/add-exception`, { method: "POST", body: JSON.stringify({ reason }) });
  return body.exception;
}

export async function getPolicyAuditLog(id: string): Promise<PolicyAuditLogRow[]> {
  const body = await apiJson<{ auditLog: PolicyAuditLogRow[] }>(`/api/policies/${encodeURIComponent(id)}/audit-log`);
  return body.auditLog;
}

export async function getPolicyVersions(id: string): Promise<PolicyVersionRow[]> {
  const body = await apiJson<{ versions: PolicyVersionRow[] }>(`/api/policies/${encodeURIComponent(id)}/versions`);
  return body.versions;
}

export async function listPolicyTemplates(): Promise<PolicyRow[]> {
  const body = await apiJson<{ templates: PolicyRow[] }>("/api/policies/templates");
  return body.templates;
}

export async function listPolicyExceptions(): Promise<PolicyExceptionRow[]> {
  const body = await apiJson<{ exceptions: PolicyExceptionRow[] }>("/api/policies/exceptions");
  return body.exceptions;
}

export async function getPolicyViolationsTrend(range = "7d"): Promise<PolicyViolationTrendPoint[]> {
  const body = await apiJson<{ points: PolicyViolationTrendPoint[] }>(`/api/policy-center/violations-trend?range=${encodeURIComponent(range)}`);
  return body.points;
}

export async function getPolicyCoverageByDomain(): Promise<{ points: PolicyCoveragePoint[]; overallCoverage: number }> {
  return apiJson<{ points: PolicyCoveragePoint[]; overallCoverage: number }>("/api/policy-center/coverage-by-domain");
}

export async function checkPolicy(payload: Record<string, unknown>): Promise<unknown> {
  return apiJson<unknown>("/api/policies/check", { method: "POST", body: JSON.stringify(payload) });
}

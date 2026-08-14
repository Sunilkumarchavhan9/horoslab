export type RiskSummaryCard = {
  key: string;
  label: string;
  value: string | number;
  trendValue: string;
  trendSuffix: string;
  trendIcon: "up" | "down";
  trendColor: string;
  sparklineData: number[];
};

export type RiskApprovalsSummary = {
  cards: RiskSummaryCard[];
  totals: {
    riskRecords: number;
    pendingApprovals: number;
    blockedActions: number;
    sensitiveSystems: number;
    highRiskFiles: number;
  };
  proofLoop: string;
};

export type RiskRecordRow = {
  id: string;
  displayId: string;
  type: string;
  area: string;
  severity: string;
  approver: string;
  status: string;
  run: string;
  artifacts: number;
  artifactsRaw: unknown;
  proof: unknown;
  reasoning: string;
  potentialImpact: string[];
  mitigation: string;
  riskyFiles: string[];
  policy: { id: string; name: string; severity: string } | null;
  approvalCount: number;
  blockedActionCount: number;
  detectedAt: string;
  updated: string;
};

export type ApprovalRow = {
  id: string;
  title: string;
  requester: string | null;
  approver: string | null;
  status: string;
  decision: string | null;
  response: unknown;
  proof: unknown;
  requestedAt: string;
  reviewedAt: string | null;
  riskRecord: RiskRecordRow | null;
};

export type SensitiveSystemRow = {
  id: string;
  name: string;
  category: string;
  severity: string;
  riskCount: number;
  owner: string | null;
  status: string;
};

export type RiskTrendPoint = { name: string; High: number; Medium: number; Low: number };
export type ApprovalThroughputPoint = { name: string; Approved: number; Reviewed: number; Rejected: number };

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
    throw new Error(body.error ?? `risk_approvals_api_${response.status}`);
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

export async function getRiskApprovalsSummary(): Promise<RiskApprovalsSummary> {
  return apiJson<RiskApprovalsSummary>("/api/risk-approvals/summary");
}

export async function listRiskRecords(filters: { tab?: string; status?: string } = {}): Promise<RiskRecordRow[]> {
  const body = await apiJson<{ records: RiskRecordRow[] }>(`/api/risk-approvals/records${qs(filters)}`);
  return body.records;
}

export async function getRiskRecord(id: string): Promise<RiskRecordRow> {
  const body = await apiJson<{ record: RiskRecordRow }>(`/api/risk-approvals/records/${encodeURIComponent(id)}`);
  return body.record;
}

export async function getRiskRecordProof(id: string): Promise<Record<string, unknown>> {
  const body = await apiJson<{ proof: Record<string, unknown> }>(`/api/risk-approvals/records/${encodeURIComponent(id)}/proof`);
  return body.proof;
}

export async function listApprovals(status?: string): Promise<ApprovalRow[]> {
  const body = await apiJson<{ approvals: ApprovalRow[] }>(`/api/approvals${qs({ status })}`);
  return body.approvals;
}

export async function getApproval(id: string): Promise<ApprovalRow> {
  const body = await apiJson<{ approval: ApprovalRow }>(`/api/approvals/${encodeURIComponent(id)}`);
  return body.approval;
}

export async function approveApproval(id: string, note?: string): Promise<ApprovalRow> {
  const body = await apiJson<{ approval: ApprovalRow }>(`/api/approvals/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
  return body.approval;
}

export async function reviewApproval(id: string, note?: string): Promise<ApprovalRow> {
  const body = await apiJson<{ approval: ApprovalRow }>(`/api/approvals/${encodeURIComponent(id)}/review`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
  return body.approval;
}

export async function rejectApproval(id: string, note?: string): Promise<ApprovalRow> {
  const body = await apiJson<{ approval: ApprovalRow }>(`/api/approvals/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
  return body.approval;
}

export async function respondApproval(id: string, status: string, note?: string): Promise<ApprovalRow> {
  const body = await apiJson<{ approval: ApprovalRow }>(`/api/approvals/${encodeURIComponent(id)}/respond`, {
    method: "POST",
    body: JSON.stringify({ status, note }),
  });
  return body.approval;
}

export async function listSensitiveSystems(): Promise<SensitiveSystemRow[]> {
  const body = await apiJson<{ systems: SensitiveSystemRow[] }>("/api/risk-approvals/sensitive-systems");
  return body.systems;
}

export async function getRiskTrend(range = "7d"): Promise<RiskTrendPoint[]> {
  const body = await apiJson<{ points: RiskTrendPoint[] }>(`/api/risk-approvals/risk-trend?range=${encodeURIComponent(range)}`);
  return body.points;
}

export async function getApprovalThroughput(range = "7d"): Promise<ApprovalThroughputPoint[]> {
  const body = await apiJson<{ points: ApprovalThroughputPoint[] }>(`/api/risk-approvals/approval-throughput?range=${encodeURIComponent(range)}`);
  return body.points;
}

export async function listPolicies(): Promise<unknown[]> {
  const body = await apiJson<{ policies: unknown[] }>("/api/policies");
  return body.policies;
}

export async function checkPolicy(payload: Record<string, unknown>): Promise<unknown> {
  return apiJson<unknown>("/api/policies/check", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

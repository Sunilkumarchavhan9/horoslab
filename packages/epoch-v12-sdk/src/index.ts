export type WorkerKind = "software" | "ai_agent" | "simulated_edge" | "human";
export type WorkerStatus = "available" | "busy" | "draining" | "offline" | "blocked" | "retired";
export type WorkerHeartbeatStatus = Exclude<WorkerStatus, "retired">;
export type V12WorkerConfig = { baseUrl: string; apiKey: string; workspaceId: string; workerId: string; fetch?: typeof fetch };
export type V12WorkerRegistration = { kind: WorkerKind; name: string; protocolVersion?: string; capabilities?: string[]; projectScope?: Record<string, unknown>; maxConcurrency?: number };
export type V12Job = Record<string, unknown> & { id: string };
export type V12Lease = { jobs: V12Job[]; fencingTokens: Record<string, number> };
export type V12EvidenceItem = { kind: string; url?: string; filePath?: string; contentType?: string; summary?: string; payload?: Record<string, unknown>; proof?: Record<string, unknown> };
export type V12WorkerEvaluation = { missionId?: string; outcome: "passed" | "failed" | "unknown"; score: number; latencyMs?: number; evidence?: Record<string, unknown> };
export type V12VerificationInput = { checklist?: string[]; evidenceIds?: string[]; humanApproval?: "approved" | "rejected" | "review"; confidence?: number; output?: Record<string, unknown>; approvals?: string[] };

export class EpochV12Worker {
  private readonly baseUrl: string; private readonly apiKey: string; private readonly workspaceId: string; private readonly workerId: string; private readonly http: typeof fetch;
  constructor(config: V12WorkerConfig) { this.baseUrl = config.baseUrl.replace(/\/$/, ""); this.apiKey = config.apiKey; this.workspaceId = config.workspaceId; this.workerId = config.workerId; this.http = config.fetch ?? fetch; }
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.http(`${this.baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", ...init.headers } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Epoch V12 worker API error ${response.status}: ${body?.error?.message ?? body?.message ?? response.statusText}`);
    return (body?.data ?? body) as T;
  }
  register(input: V12WorkerRegistration): Promise<{ worker: V12WorkerRegistration & { status: WorkerStatus } }> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/workers`, { method: "POST", body: JSON.stringify(input) }); }
  heartbeat(status?: WorkerHeartbeatStatus): Promise<Record<string, unknown>> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/workers/${encodeURIComponent(this.workerId)}/heartbeat`, { method: "POST", body: JSON.stringify(status ? { status } : {}) }); }
  lease(limit = 1, leaseMs = 30_000, missionId?: string): Promise<V12Lease> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/queue/lease`, { method: "POST", body: JSON.stringify({ workerId: this.workerId, limit, leaseMs, ...(missionId ? { missionId } : {}) }) }); }
  complete(jobId: string, fencingToken: number): Promise<Record<string, unknown>> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/queue/${encodeURIComponent(jobId)}/ack`, { method: "POST", body: JSON.stringify({ workerId: this.workerId, fencingToken }) }); }
  fail(jobId: string, error: string): Promise<Record<string, unknown>> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/queue/${encodeURIComponent(jobId)}/fail`, { method: "POST", body: JSON.stringify({ error }) }); }
  recordEvidence(missionId: string, evidence: V12EvidenceItem[]): Promise<Record<string, unknown>> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence`, { method: "POST", body: JSON.stringify({ evidence }) }); }
  evaluate(input: V12WorkerEvaluation): Promise<Record<string, unknown>> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/workers/${encodeURIComponent(this.workerId)}/evaluations`, { method: "POST", body: JSON.stringify(input) }); }
  verify(missionId: string, input: V12VerificationInput = {}): Promise<Record<string, unknown>> { return this.request(`/api/v1/epoch/workspaces/${encodeURIComponent(this.workspaceId)}/missions/${encodeURIComponent(missionId)}/verify`, { method: "POST", body: JSON.stringify(input) }); }
}

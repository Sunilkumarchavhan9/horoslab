export type EpochV12ClientConfig = { baseUrl: string; apiKey: string; fetch?: typeof fetch };
export type MissionState = "draft" | "running" | "waiting_review" | "completed" | "failed";
export type WorkerKind = "software" | "ai_agent" | "simulated_edge" | "human";
export type WorkerStatus = "online" | "draining" | "offline" | "blocked" | "retired";

export type Mission = Record<string, unknown> & { id: string; state: MissionState };
export type Worker = Record<string, unknown> & { id: string; status: WorkerStatus };
export type WorkerRegistration = {
  kind: WorkerKind; name: string; protocolVersion?: string;
  capabilities?: string[]; projectScope?: Record<string, unknown>; maxConcurrency?: number;
};
export type WorkerLease = { jobs: Array<Record<string, unknown>>; fencingTokens: Record<string, number> };
export type EvidenceItem = { kind: string; url?: string; filePath?: string; contentType?: string; summary?: string; payload?: Record<string, unknown>; proof?: Record<string, unknown> };
export type MissionVerificationInput = { checklist?: string[]; evidenceIds?: string[]; humanApproval?: "approved" | "rejected" | "review"; confidence?: number; output?: Record<string, unknown>; approvals?: string[] };
export type QueueEnqueueInput = { type: "plan" | "execute" | "review" | "verify" | "certificate" | "memory"; institutionId?: string; payload?: Record<string, unknown> };
export type VerifierAssignmentInput = { verifierId: string; verifierKind: "software" | "ai_agent" | "human"; evidenceIds?: string[]; checklist?: string[] };
export type SettlementInput = { decision: "PASS" | "FAIL" | "UNKNOWN"; evidenceHash: string; assuranceConfidence: number; humanApproval: "approved" | "rejected" | "review"; unresolvedRisks: string[]; summary?: string; lessons?: string[] };
export type MissionCreateInput = {
  institutionId: string; title: string; objective: string; acceptanceCriteria?: string[];
  plan?: string[]; budgetCents?: number; deadlineAt?: string;
};

export class EpochV12ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message); this.name = "EpochV12ApiError";
  }
}

export class EpochV12ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly http: typeof fetch;

  constructor(config: EpochV12ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.http = config.fetch ?? fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.http(`${this.baseUrl}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", ...init.headers },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new EpochV12ApiError(response.status, body?.error?.message ?? body?.message ?? response.statusText, body);
    return (body?.data ?? body) as T;
  }

  listMissions(workspaceId: string): Promise<{ missions: Mission[] }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions`);
  }

  createMission(workspaceId: string, input: MissionCreateInput): Promise<{ mission: Mission }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions`, { method: "POST", body: JSON.stringify(input) });
  }

  getMission(workspaceId: string, missionId: string): Promise<{ mission: Mission }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}`);
  }

  runMission(workspaceId: string, missionId: string, input: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/run`, { method: "POST", body: JSON.stringify(input) });
  }

  verifyMission(workspaceId: string, missionId: string, input: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verify`, { method: "POST", body: JSON.stringify(input) });
  }

  getEvidenceBundle(workspaceId: string, missionId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence-bundle`);
  }

  enqueueMission(workspaceId: string, missionId: string, input: QueueEnqueueInput): Promise<{ job: Record<string, unknown> }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/queue`, { method: "POST", body: JSON.stringify(input) });
  }

  recordEvidence(workspaceId: string, missionId: string, evidence: EvidenceItem[]): Promise<{ evidence: Record<string, unknown>[] }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/evidence`, { method: "POST", body: JSON.stringify({ evidence }) });
  }

  verifyMissionWithEvidence(workspaceId: string, missionId: string, input: MissionVerificationInput = {}): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verify`, { method: "POST", body: JSON.stringify(input) });
  }

  getCertificate(workspaceId: string, certificateId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/certificates/${encodeURIComponent(certificateId)}`);
  }

  createVerifierAssignment(workspaceId: string, missionId: string, input: VerifierAssignmentInput): Promise<{ assignment: Record<string, unknown> }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/verifier-assignments`, { method: "POST", body: JSON.stringify(input) });
  }

  completeVerifierAssignment(workspaceId: string, assignmentId: string, confidence?: number): Promise<{ assignment: Record<string, unknown> }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/verifier-assignments/${encodeURIComponent(assignmentId)}/complete`, { method: "POST", body: JSON.stringify(confidence === undefined ? {} : { confidence }) });
  }

  issueArtifactAccessToken(workspaceId: string, artifactId: string, ttlSeconds = 300): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/artifacts/${encodeURIComponent(artifactId)}/access-token?ttlSeconds=${encodeURIComponent(String(ttlSeconds))}`);
  }

  getSettlement(workspaceId: string, missionId: string): Promise<{ settlement: Record<string, unknown> }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`);
  }

  settleMission(workspaceId: string, missionId: string, input: SettlementInput): Promise<{ settlement: Record<string, unknown> }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/missions/${encodeURIComponent(missionId)}/settlement`, { method: "POST", body: JSON.stringify(input) });
  }

  listWorkers(workspaceId: string): Promise<{ workers: Worker[] }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/workers`);
  }

  registerWorker(workspaceId: string, input: WorkerRegistration): Promise<{ worker: Worker }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/workers`, { method: "POST", body: JSON.stringify(input) });
  }

  heartbeatWorker(workspaceId: string, workerId: string, status?: WorkerStatus): Promise<{ worker: Worker }> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/workers/${encodeURIComponent(workerId)}/heartbeat`, { method: "POST", body: JSON.stringify(status ? { status } : {}) });
  }

  leaseWorkerJobs(workspaceId: string, workerId: string, limit = 1, leaseMs = 30_000): Promise<WorkerLease> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/queue/lease`, { method: "POST", body: JSON.stringify({ workerId, limit, leaseMs }) });
  }

  completeWorkerJob(workspaceId: string, jobId: string, workerId: string, fencingToken: number): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/queue/${encodeURIComponent(jobId)}/ack`, { method: "POST", body: JSON.stringify({ workerId, fencingToken }) });
  }

  failWorkerJob(workspaceId: string, jobId: string, error: string): Promise<Record<string, unknown>> {
    return this.request(`/api/epoch/workspaces/${encodeURIComponent(workspaceId)}/queue/${encodeURIComponent(jobId)}/fail`, { method: "POST", body: JSON.stringify({ error }) });
  }
}

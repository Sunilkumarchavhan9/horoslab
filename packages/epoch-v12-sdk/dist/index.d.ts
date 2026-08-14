export type WorkerKind = "software" | "ai_agent" | "simulated_edge" | "human";
export type WorkerStatus = "available" | "busy" | "draining" | "offline" | "blocked" | "retired";
export type WorkerHeartbeatStatus = Exclude<WorkerStatus, "retired">;
export type V12WorkerConfig = {
    baseUrl: string;
    apiKey: string;
    workspaceId: string;
    workerId: string;
    fetch?: typeof fetch;
};
export type V12WorkerRegistration = {
    kind: WorkerKind;
    name: string;
    protocolVersion?: string;
    capabilities?: string[];
    projectScope?: Record<string, unknown>;
    maxConcurrency?: number;
};
export type V12Job = Record<string, unknown> & {
    id: string;
};
export type V12Lease = {
    jobs: V12Job[];
    fencingTokens: Record<string, number>;
};
export type V12EvidenceItem = {
    kind: string;
    url?: string;
    filePath?: string;
    contentType?: string;
    summary?: string;
    payload?: Record<string, unknown>;
    proof?: Record<string, unknown>;
};
export type V12WorkerEvaluation = {
    missionId?: string;
    outcome: "passed" | "failed" | "unknown";
    score: number;
    latencyMs?: number;
    evidence?: Record<string, unknown>;
};
export type V12VerificationInput = {
    checklist?: string[];
    evidenceIds?: string[];
    humanApproval?: "approved" | "rejected" | "review";
    confidence?: number;
    output?: Record<string, unknown>;
    approvals?: string[];
};
export declare class EpochV12Worker {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly workspaceId;
    private readonly workerId;
    private readonly http;
    constructor(config: V12WorkerConfig);
    private request;
    register(input: V12WorkerRegistration): Promise<{
        worker: V12WorkerRegistration & {
            status: WorkerStatus;
        };
    }>;
    heartbeat(status?: WorkerHeartbeatStatus): Promise<Record<string, unknown>>;
    lease(limit?: number, leaseMs?: number, missionId?: string): Promise<V12Lease>;
    complete(jobId: string, fencingToken: number): Promise<Record<string, unknown>>;
    fail(jobId: string, error: string): Promise<Record<string, unknown>>;
    recordEvidence(missionId: string, evidence: V12EvidenceItem[]): Promise<Record<string, unknown>>;
    evaluate(input: V12WorkerEvaluation): Promise<Record<string, unknown>>;
    verify(missionId: string, input?: V12VerificationInput): Promise<Record<string, unknown>>;
}

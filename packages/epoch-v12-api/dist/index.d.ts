export type EpochV12ClientConfig = {
    baseUrl: string;
    apiKey: string;
    fetch?: typeof fetch;
};
export type MissionState = "draft" | "running" | "waiting_review" | "completed" | "failed";
export type WorkerKind = "software" | "ai_agent" | "simulated_edge" | "human";
export type WorkerStatus = "online" | "draining" | "offline" | "blocked" | "retired";
export type Mission = Record<string, unknown> & {
    id: string;
    state: MissionState;
};
export type Worker = Record<string, unknown> & {
    id: string;
    status: WorkerStatus;
};
export type WorkerRegistration = {
    kind: WorkerKind;
    name: string;
    protocolVersion?: string;
    capabilities?: string[];
    projectScope?: Record<string, unknown>;
    maxConcurrency?: number;
};
export type WorkerLease = {
    jobs: Array<Record<string, unknown>>;
    fencingTokens: Record<string, number>;
};
export type EvidenceItem = {
    kind: string;
    url?: string;
    filePath?: string;
    contentType?: string;
    summary?: string;
    payload?: Record<string, unknown>;
    proof?: Record<string, unknown>;
};
export type MissionVerificationInput = {
    checklist?: string[];
    evidenceIds?: string[];
    humanApproval?: "approved" | "rejected" | "review";
    confidence?: number;
    output?: Record<string, unknown>;
    approvals?: string[];
};
export type QueueEnqueueInput = {
    type: "plan" | "execute" | "review" | "verify" | "certificate" | "memory";
    institutionId?: string;
    payload?: Record<string, unknown>;
};
export type VerifierAssignmentInput = {
    verifierId: string;
    verifierKind: "software" | "ai_agent" | "human";
    evidenceIds?: string[];
    checklist?: string[];
};
export type SettlementInput = {
    decision: "PASS" | "FAIL" | "UNKNOWN";
    evidenceHash: string;
    assuranceConfidence: number;
    humanApproval: "approved" | "rejected" | "review";
    unresolvedRisks: string[];
    summary?: string;
    lessons?: string[];
};
export type MissionCreateInput = {
    institutionId: string;
    title: string;
    objective: string;
    acceptanceCriteria?: string[];
    plan?: string[];
    budgetCents?: number;
    deadlineAt?: string;
};
export declare class EpochV12ApiError extends Error {
    readonly status: number;
    readonly details?: unknown | undefined;
    constructor(status: number, message: string, details?: unknown | undefined);
}
export declare class EpochV12ApiClient {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly http;
    constructor(config: EpochV12ClientConfig);
    private request;
    listMissions(workspaceId: string): Promise<{
        missions: Mission[];
    }>;
    createMission(workspaceId: string, input: MissionCreateInput): Promise<{
        mission: Mission;
    }>;
    getMission(workspaceId: string, missionId: string): Promise<{
        mission: Mission;
    }>;
    runMission(workspaceId: string, missionId: string, input?: Record<string, unknown>): Promise<Record<string, unknown>>;
    verifyMission(workspaceId: string, missionId: string, input?: Record<string, unknown>): Promise<Record<string, unknown>>;
    getEvidenceBundle(workspaceId: string, missionId: string): Promise<Record<string, unknown>>;
    enqueueMission(workspaceId: string, missionId: string, input: QueueEnqueueInput): Promise<{
        job: Record<string, unknown>;
    }>;
    recordEvidence(workspaceId: string, missionId: string, evidence: EvidenceItem[]): Promise<{
        evidence: Record<string, unknown>[];
    }>;
    verifyMissionWithEvidence(workspaceId: string, missionId: string, input?: MissionVerificationInput): Promise<Record<string, unknown>>;
    getCertificate(workspaceId: string, certificateId: string): Promise<Record<string, unknown>>;
    createVerifierAssignment(workspaceId: string, missionId: string, input: VerifierAssignmentInput): Promise<{
        assignment: Record<string, unknown>;
    }>;
    completeVerifierAssignment(workspaceId: string, assignmentId: string, confidence?: number): Promise<{
        assignment: Record<string, unknown>;
    }>;
    issueArtifactAccessToken(workspaceId: string, artifactId: string, ttlSeconds?: number): Promise<Record<string, unknown>>;
    getSettlement(workspaceId: string, missionId: string): Promise<{
        settlement: Record<string, unknown>;
    }>;
    settleMission(workspaceId: string, missionId: string, input: SettlementInput): Promise<{
        settlement: Record<string, unknown>;
    }>;
    listWorkers(workspaceId: string): Promise<{
        workers: Worker[];
    }>;
    registerWorker(workspaceId: string, input: WorkerRegistration): Promise<{
        worker: Worker;
    }>;
    heartbeatWorker(workspaceId: string, workerId: string, status?: WorkerStatus): Promise<{
        worker: Worker;
    }>;
    leaseWorkerJobs(workspaceId: string, workerId: string, limit?: number, leaseMs?: number): Promise<WorkerLease>;
    completeWorkerJob(workspaceId: string, jobId: string, workerId: string, fencingToken: number): Promise<Record<string, unknown>>;
    failWorkerJob(workspaceId: string, jobId: string, error: string): Promise<Record<string, unknown>>;
}

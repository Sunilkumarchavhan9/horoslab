
export const MEMORY_TYPES = [
    "profile",
    "preference",
    "learning",
    "project",
    "episodic",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export const MEMORY_STATUS = [
  "active",
  "stale",
  "contradicted",
  "archived",
  "merged",
] as const;
export type MemoryStatus = (typeof MEMORY_STATUS)[number];

export const MEMORY_SOURCE = ["chat", "system", "import"] as const;
export type MemorySource = (typeof MEMORY_SOURCE)[number];

export type IsoDateString = string;

export const MEMORY_CONTRACT_VERSION = "memoryos.contract.v1" as const;

export const MEMORY_CONTRACT_CATEGORIES = [
  "decision",
  "runbook",
  "incident",
  "preference",
  "policy",
  "blocker",
  "bug",
  "architecture_note",
  "previous_attempt",
  "model_tool_update",
  "risky_file",
  "next_action",
] as const;

export type MemoryContractCategory = (typeof MEMORY_CONTRACT_CATEGORIES)[number];

export interface DeveloperSignals {
  stack?: string[];
  framework?: string[];
  bugType?: string[];
  goal?: string[];
  projectArea?: string[];
}

export type OperationalTag = "decision" | "policy" | "incident" | "runbook";

export const COMPANY_BRAIN_MEMORY_TYPES = [
  "decision",
  "incident",
  "architecture",
  "process",
  "customer_issue",
  "execution",
  "agent_action",
  "risk",
  "test",
  "knowledge",
  "context",
] as const;

export type CompanyBrainMemoryType = (typeof COMPANY_BRAIN_MEMORY_TYPES)[number];

export type CompanyBrainTraceProof = {
  sourceType: string;
  sourceRef: string;
  evidence: string[];
  confidence: number;
  capturedAt: IsoDateString;
};

export type CompanyBrainFreshness = {
  status: "fresh" | "aging" | "stale";
  checkedAt: IsoDateString;
};

export type CompanyBrainConflict = {
  status: "none" | "possible_conflict";
  conflictsWith: string[];
  checkedAt: IsoDateString;
};

export type CompanyBrainGraph = {
  nodeId: string;
  nodeType: CompanyBrainMemoryType;
  edgeRefs: string[];
};

export type CompanyBrainEntityKind =
  | "source"
  | "project"
  | "workspace"
  | "thread"
  | "agent"
  | "repo"
  | "file"
  | "issue"
  | "pull_request"
  | "service"
  | "customer"
  | "memory_type"
  | "test"
  | "policy"
  | "memory_ref";

export type CompanyBrainResolvedEntity = {
  id: string;
  kind: CompanyBrainEntityKind;
  label: string;
  canonicalId: string;
  aliases: string[];
  references: string[];
  evidenceCount: number;
  memoryIds: string[];
  latestMemoryAt: IsoDateString;
  confidence: number;
};

export type CompanyBrainRelation = {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType:
    | "scopes"
    | "derived_from"
    | "evidenced_by"
    | "mentions"
    | "conflicts_with"
    | "inherits_to"
    | "validated_by";
  evidenceRefs: string[];
  memoryIds: string[];
  confidence: number;
};

export type CompanyBrainProofQuality = {
  score: number;
  status: "strong" | "usable" | "weak" | "blocked";
  productionReady: boolean;
  reasons: string[];
  gaps: string[];
  assessedAt: IsoDateString;
};

export interface Memory {
    id: string;
    userId: string;
    orgId?: string | null;
    type: MemoryType;
    content: string;
    summary: string;
    importanceScore: number;
    confidence: number;
    source: MemorySource;
    status: MemoryStatus;
    createdAt: IsoDateString;
    updatedAt: IsoDateString;
    evidenceCount: number;
    contractVersion?: typeof MEMORY_CONTRACT_VERSION;
    contractCategory?: MemoryContractCategory;
    developerSignals?: DeveloperSignals;
    operationalTags?: OperationalTag[];
    companyBrainType?: CompanyBrainMemoryType;
    traceProof?: CompanyBrainTraceProof;
    freshness?: CompanyBrainFreshness;
    conflict?: CompanyBrainConflict;
    graph?: CompanyBrainGraph;
    entities?: CompanyBrainResolvedEntity[];
    relations?: CompanyBrainRelation[];
    proofQuality?: CompanyBrainProofQuality;
    /** Connector or artifact reference, e.g. connector_source=github issue=42 */
    sourceRef?: string;
    /** Related repository file paths when known (risky_file, PR diffs, etc.). */
    files?: string[];

}


export interface MemoryCandidate {
  userId: string;
  type: MemoryType;
  content: string;
  summary: string;
  source: MemorySource;
  threadId?: string;
  contractVersion?: typeof MEMORY_CONTRACT_VERSION;
  contractCategory?: MemoryContractCategory;
  developerSignals?: DeveloperSignals;
  operationalTags?: OperationalTag[];
  sourceRef?: string;
  files?: string[];
}


export const TIMELINE_EVENT_TYPES = [
  "memory_created",
  "memory_updated",
  "memory_merged",
  "memory_stale",
  "memory_contradicted",
  "memory_archived",
  "memory_evolved",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export interface TimelineEvent {
  id: string;
  userId: string;
  memoryId: string;
  eventType: TimelineEventType;
  reason: string;
  timestamp: IsoDateString;
  metadata?: Record<string, string | number | boolean>;
}

export const MEMORY_REALTIME_EVENT_STAGES = [
  "source_sync",
  "memory",
  "experience",
  "skill",
  "governance",
  "execution",
  "learning",
  "system",
] as const;

export type MemoryRealtimeEventStage = (typeof MEMORY_REALTIME_EVENT_STAGES)[number];

export const MEMORY_REALTIME_EVENT_KINDS = [
  "source_synced",
  "memory_extracted",
  "experience_captured",
  "skill_candidate_generated",
  "skill_approved",
  "agent_run_prepared",
  "agent_run_started",
  "agent_run_completed",
  "outcome_recorded",
  "future_instruction_created",
  "brief_ready",
  "projection_refreshed",
  "memory_processed",
  "handoff_generated",
  "resume_generated",
  "timeline_updated",
  "request_logged",
  "governance_review_queued",
  "api_keys_changed",
  "service_users_changed",
] as const;

export type MemoryRealtimeEventKind = (typeof MEMORY_REALTIME_EVENT_KINDS)[number];

export type MemoryRealtimeSubject = {
  type: string;
  id?: string;
  label?: string;
};

export interface MemoryRealtimeEvent {
  id: string;
  userId: string;
  orgId?: string | null;
  contractVersion: string;
  correlationId?: string | null;
  causationId?: string | null;
  traceId?: string | null;
  kind: MemoryRealtimeEventKind;
  stage: MemoryRealtimeEventStage;
  source: "memory-router" | "memory-ignition" | "company-brain" | "continuity" | "request-logger" | "system";
  subject?: MemoryRealtimeSubject;
  payload: Record<string, unknown>;
  occurredAt: IsoDateString;
}

export interface MemoryRealtimeEventInput {
  id?: string;
  userId: string;
  orgId?: string | null;
  contractVersion?: string;
  correlationId?: string | null;
  causationId?: string | null;
  traceId?: string | null;
  kind: MemoryRealtimeEventKind;
  stage?: MemoryRealtimeEventStage;
  source?: MemoryRealtimeEvent["source"];
  subject?: MemoryRealtimeSubject;
  payload?: Record<string, unknown>;
  occurredAt?: IsoDateString;
}

export type MemoryRealtimeProjection = {
  userId: string;
  updatedAt: IsoDateString;
  totalEvents: number;
  totalByKind: Record<MemoryRealtimeEventKind, number>;
  totalByStage: Record<MemoryRealtimeEventStage, number>;
  latestEventAt: IsoDateString | null;
  latestEventId: string | null;
  recentEvents: Array<{
    id: string;
    kind: MemoryRealtimeEventKind;
    stage: MemoryRealtimeEventStage;
    occurredAt: IsoDateString;
    summary: string;
    subject?: MemoryRealtimeSubject;
  }>;
};


export interface RevisionChange {
  field: keyof Pick<
    Memory,
    "content" | "summary" | "importanceScore" | "confidence" | "status" | "evidenceCount"
  >;
  oldValue: string | number;
  newValue: string | number;
}


export interface RevisionEvent {
    id: string;
    userId: string;
    memoryId: string;
    version: number;
    changedAt: IsoDateString;
    changedBy: "system" | "user";
    reason: string;
    changes: RevisionChange[];
}

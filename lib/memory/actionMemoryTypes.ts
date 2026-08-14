export type ActionMemoryOutcome = "success" | "failed" | "rolled_back";

export type ActionMemorySourceType = "github_execution" | "continuity" | "manual";

export type ApprovalDecision = "approved" | "rejected";

export type ActionMemory = {
  id: string;
  userId: string;
  orgId?: string | null;
  projectId?: string | null;
  workspace?: string | null;
  action: string;
  reason: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  filesChanged: string[];
  outcome: ActionMemoryOutcome;
  followUps: string[];
  sourceType?: ActionMemorySourceType | null;
  sourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionOutcomeRecord = {
  id: string;
  actionMemoryId?: string | null;
  userId: string;
  orgId?: string | null;
  goal?: string | null;
  planSummary?: string | null;
  resultSummary?: string | null;
  status: string;
  errorMessage?: string | null;
  connectorAdapter?: string | null;
  externalRef?: string | null;
  createdAt: string;
};

export type ApprovalTraceRecord = {
  id: string;
  actionMemoryId?: string | null;
  userId: string;
  orgId?: string | null;
  approverId: string;
  decision: ApprovalDecision;
  reason?: string | null;
  riskTier?: string | null;
  proposalId?: string | null;
  createdAt: string;
};

export type ActionMemoryWithLineage = {
  actionMemory: ActionMemory;
  executionOutcome?: ExecutionOutcomeRecord;
  approvalTraces: ApprovalTraceRecord[];
};

export type CreateActionMemoryInput = {
  userId: string;
  orgId?: string | null;
  projectId?: string | null;
  workspace?: string | null;
  action: string;
  reason: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  filesChanged?: string[];
  outcome: ActionMemoryOutcome;
  followUps?: string[];
  sourceType?: ActionMemorySourceType | null;
  sourceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

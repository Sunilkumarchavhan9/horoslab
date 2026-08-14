export type OperationalLoopState =
  | "goal_set"
  | "plan_proposed"
  | "awaiting_approval"
  | "executing"
  | "completed"
  | "failed"
  | "rolled_back";

export type OperationalLoop = {
  id: string;
  userId: string;
  orgId?: string | null;
  goal: string;
  projectId?: string | null;
  currentState: OperationalLoopState;
  linkedProposalIds: string[];
  linkedActionMemoryIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type OperationalLoopScope = {
  userId: string;
  orgId?: string;
};

export type CreateOperationalLoopInput = {
  goal: string;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
};

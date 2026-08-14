export type ExecutionRiskTier = "low" | "medium" | "high";

export type ExecutionProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";

export type ExecutionProposal = {
  id: string;
  userId: string;
  orgId?: string | null;
  adapter: string;
  actionType: string;
  payload: Record<string, unknown>;
  status: ExecutionProposalStatus;
  riskTier: ExecutionRiskTier;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  executedAt: string | null;
  rejectionReason: string | null;
  secondFactorVerified: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
};

export type ExecutionScope = {
  userId: string;
  orgId?: string;
};

/** Optional closed-loop context for P2.1 operational loops. */
export type ExecutionLoopContext = {
  goal?: string;
  loopId?: string;
  projectId?: string | null;
};

export type ExecutionAdapterResult = {
  ok: boolean;
  detail: string;
  externalRef?: string;
  data?: Record<string, unknown>;
};

/** Slack `channel_message` / `post_message` proposal payload. */
export type SlackChannelMessagePayload = {
  channel: string;
  text: string;
  threadTs?: string;
};

/** Jira `issue_comment` proposal payload. */
export type JiraIssueCommentPayload = {
  issueKey: string;
  body: string;
};

/** Jira `issue_transition` proposal payload. */
export type JiraIssueTransitionPayload = {
  issueKey: string;
  transitionId: string;
};


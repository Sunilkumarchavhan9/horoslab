import {
  approveAndExecuteGitHubProposal,
  proposeGitHubExecution,
} from "../integrations/githubExecution";
import type { GitHubExecutionKind } from "../integrations/githubExecutionStore";
import { jiraExecutionAdapter } from "./adapters/jiraExecutionAdapter";
import type { ExecutionAdapter } from "./adapters/executionAdapterTypes";
import { slackExecutionAdapter } from "./adapters/slackExecutionAdapter";
import {
  createExecutionProposal,
  getExecutionProposal,
  listExecutionProposals,
  saveExecutionProposal,
} from "./executionProposalStore";
import { recordExecutionLineage, recordExecutionRejection } from "../memory/recordExecutionLineage";
import {
  onExecutionProposalCreated,
  onExecutionProposalFinished,
  onExecutionProposalReviewed,
  type ExecutionFinishedDriftContext,
} from "./operationalLoopService";
import {
  attachAgentLineageToPayload,
  mergeAgentLineage,
} from "../agents/agentLineage";
import type {
  ExecutionLoopContext,
  ExecutionProposal,
  ExecutionRiskTier,
  ExecutionScope,
} from "./executionTypes";

export type {
  ExecutionAdapterResult,
  ExecutionProposal,
  ExecutionProposalStatus,
  ExecutionRiskTier,
  ExecutionScope,
} from "./executionTypes";

const AUTO_EXECUTE_LOW_RISK =
  process.env.COMPANY_BRAIN_AUTO_EXECUTE_LOW_RISK?.trim().toLowerCase() === "true";

/** Optional product-agent lineage (P2.3). */
export type ExecutionAgentLineage = {
  agentId?: string;
  sessionId?: string;
  goalId?: string;
};

export type ProposeExecutionInput = {
  adapter: string;
  actionType: string;
  payload: Record<string, unknown>;
  riskTier?: ExecutionRiskTier;
  loop?: ExecutionLoopContext;
  agentLineage?: ExecutionAgentLineage;
};

export type ReviewExecutionInput = {
  proposalId: string;
  decision: "approve" | "reject";
  rejectionReason?: string;
  secondFactorVerified?: boolean;
};

const githubAdapter: ExecutionAdapter = {
  id: "github",
  inferRiskTier(actionType) {
    if (actionType === "issue_comment") return "low";
    if (actionType === "brief_file_commit") return "medium";
    if (actionType === "pull_request") return "high";
    return "medium";
  },
  async validatePropose() {
    // GitHub proposals are created in proposeExecution via createLinkedGitHubProposal.
  },
  async execute(scope, actionType, payload) {
    const linkedProposalId =
      typeof payload._linkedGitHubProposalId === "string"
        ? payload._linkedGitHubProposalId
        : "";
    if (!linkedProposalId) {
      throw new Error("Missing linked GitHub proposal id.");
    }
    const executed = await approveAndExecuteGitHubProposal({
      userId: scope.userId,
      proposalId: linkedProposalId,
    });
    if (executed.status === "failed") {
      return {
        ok: false,
        detail: executed.error ?? "GitHub execution failed.",
        data: {
          githubProposalId: executed.id,
          githubResultUrl: executed.githubResultUrl,
        },
      };
    }
    return {
      ok: true,
      detail: `GitHub ${actionType} executed.`,
      externalRef: executed.githubResultUrl ?? undefined,
      data: {
        githubProposalId: executed.id,
        githubResultUrl: executed.githubResultUrl,
        githubPrNumber: executed.githubPrNumber,
        githubCommentId: executed.githubCommentId,
      },
    };
  },
};

const stubAdapter: ExecutionAdapter = {
  id: "generic",
  inferRiskTier() {
    return "high";
  },
  async validatePropose() {
    // no-op; propose is allowed but execution is deferred to phase 2
  },
  async execute(_scope, actionType) {
    return {
      ok: false,
      detail: `Adapter action "${actionType}" is not implemented (Week 4 Phase 2).`,
    };
  },
};

const ADAPTERS: Record<string, ExecutionAdapter> = {
  github: githubAdapter,
  generic: stubAdapter,
  slack: slackExecutionAdapter,
  jira: jiraExecutionAdapter,
  ticket: stubAdapter,
};

function resolveAdapter(adapterId: string): ExecutionAdapter {
  const adapter = ADAPTERS[adapterId.trim().toLowerCase()];
  if (!adapter) {
    throw new Error(`Unknown execution adapter "${adapterId}". Supported: github, generic, slack, jira.`);
  }
  return adapter;
}

function resolveRiskTier(
  adapter: ExecutionAdapter,
  actionType: string,
  payload: Record<string, unknown>,
  explicit?: ExecutionRiskTier,
): ExecutionRiskTier {
  if (explicit === "low" || explicit === "medium" || explicit === "high") {
    return explicit;
  }
  return adapter.inferRiskTier(actionType, payload);
}

function canAutoExecuteOnPropose(riskTier: ExecutionRiskTier): boolean {
  return riskTier === "low" && AUTO_EXECUTE_LOW_RISK;
}

function mediumRequiresApproval(): boolean {
  return true;
}

function highRequiresApproval(): boolean {
  return true;
}

export function getExecutionRiskMatrix(): Array<{
  riskTier: ExecutionRiskTier;
  autoExecuteOnPropose: boolean;
  requiresApproval: boolean;
  secondFactorAuditField: boolean;
}> {
  return [
    {
      riskTier: "low",
      autoExecuteOnPropose: AUTO_EXECUTE_LOW_RISK,
      requiresApproval: !AUTO_EXECUTE_LOW_RISK,
      secondFactorAuditField: false,
    },
    {
      riskTier: "medium",
      autoExecuteOnPropose: false,
      requiresApproval: mediumRequiresApproval(),
      secondFactorAuditField: false,
    },
    {
      riskTier: "high",
      autoExecuteOnPropose: false,
      requiresApproval: highRequiresApproval(),
      secondFactorAuditField: true,
    },
  ];
}

async function createLinkedGitHubProposal(
  scope: ExecutionScope,
  actionType: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const owner = typeof payload.owner === "string" ? payload.owner : "";
  const repo = typeof payload.repo === "string" ? payload.repo : "";
  const body = typeof payload.body === "string" ? payload.body : "";
  const kind: GitHubExecutionKind =
    actionType === "brief_file_commit" || actionType === "pull_request"
      ? actionType
      : "issue_comment";
  const issueNumber =
    typeof payload.issueNumber === "number" ? payload.issueNumber : Number(payload.issueNumber);
  const ghProposal = await proposeGitHubExecution({
    userId: scope.userId,
    kind,
    owner,
    repo,
    body,
    issueNumber: Number.isFinite(issueNumber) ? issueNumber : undefined,
    pullTitle: typeof payload.pullTitle === "string" ? payload.pullTitle : undefined,
    headBranch: typeof payload.headBranch === "string" ? payload.headBranch : undefined,
    baseBranch: typeof payload.baseBranch === "string" ? payload.baseBranch : undefined,
    filePath: typeof payload.filePath === "string" ? payload.filePath : undefined,
  });
  return ghProposal.id;
}

export async function proposeExecution(
  scope: ExecutionScope,
  input: ProposeExecutionInput,
): Promise<ExecutionProposal> {
  const adapter = resolveAdapter(input.adapter);
  const actionType = input.actionType.trim();
  if (!actionType) {
    throw new Error("actionType is required.");
  }

  const riskTier = resolveRiskTier(adapter, actionType, input.payload, input.riskTier);
  let payload = { ...input.payload };

  const agentLineage = mergeAgentLineage(input.agentLineage, {
    goalId: input.loop?.loopId ?? input.agentLineage?.goalId,
  });
  if (agentLineage.agentId || agentLineage.sessionId || agentLineage.goalId) {
    payload = attachAgentLineageToPayload(payload, agentLineage);
  }

  if (adapter.id === "github") {
    payload._linkedGitHubProposalId = await createLinkedGitHubProposal(scope, actionType, payload);
  } else {
    await adapter.validatePropose(scope, actionType, payload);
  }

  let proposal = await createExecutionProposal({
    userId: scope.userId,
    orgId: scope.orgId ?? null,
    adapter: adapter.id,
    actionType,
    payload,
    riskTier,
    status: "pending",
  });

  if (input.loop) {
    try {
      await onExecutionProposalCreated(scope, proposal, input.loop);
    } catch (error) {
      console.warn("[OperationalLoop] proposal created hook failed:", error);
    }
  }

  if (canAutoExecuteOnPropose(riskTier)) {
    proposal = await saveExecutionProposal({
      ...proposal,
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: scope.userId,
    });
    return executeApproved(scope, proposal.id, input.loop);
  }

  return proposal;
}

export async function reviewExecution(
  scope: ExecutionScope,
  input: ReviewExecutionInput,
): Promise<ExecutionProposal> {
  const proposal = await getExecutionProposal(scope.userId, input.proposalId, scope.orgId);
  if (!proposal) {
    throw new Error("Execution proposal not found.");
  }
  if (proposal.status !== "pending") {
    throw new Error(`Proposal is already ${proposal.status}.`);
  }

  if (input.decision === "reject") {
    const rejected = await saveExecutionProposal({
      ...proposal,
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: scope.userId,
      rejectionReason: input.rejectionReason?.trim() || "Rejected by reviewer.",
      secondFactorVerified: input.secondFactorVerified === true,
    });
    try {
      await recordExecutionRejection(rejected);
    } catch (error) {
      console.warn("[ActionMemory] Failed to record rejection lineage:", error);
    }
    try {
      await onExecutionProposalReviewed(scope, rejected);
    } catch (error) {
      console.warn("[OperationalLoop] proposal reviewed hook failed:", error);
    }
    return rejected;
  }

  const adapter = resolveAdapter(proposal.adapter);
  try {
    await adapter.validatePropose(scope, proposal.actionType, proposal.payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connector validation failed at review.";
    return saveExecutionProposal({
      ...proposal,
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: scope.userId,
      rejectionReason: message,
      secondFactorVerified: input.secondFactorVerified === true,
    });
  }

  const approved = await saveExecutionProposal({
    ...proposal,
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedByUserId: scope.userId,
    rejectionReason: null,
    secondFactorVerified: input.secondFactorVerified === true,
  });
  try {
    await onExecutionProposalReviewed(scope, approved);
  } catch (error) {
    console.warn("[OperationalLoop] proposal reviewed hook failed:", error);
  }
  return approved;
}

export async function executeApproved(
  scope: ExecutionScope,
  proposalId: string,
  loopContext?: ExecutionLoopContext,
): Promise<ExecutionProposal> {
  const proposal = await getExecutionProposal(scope.userId, proposalId, scope.orgId);
  if (!proposal) {
    throw new Error("Execution proposal not found.");
  }
  if (proposal.status === "rejected") {
    throw new Error("Cannot execute a rejected proposal.");
  }
  if (proposal.status === "executed") {
    return proposal;
  }
  if (proposal.status !== "approved" && proposal.status !== "pending") {
    throw new Error(`Proposal cannot be executed while ${proposal.status}.`);
  }

  if (proposal.riskTier !== "low" && proposal.status === "pending") {
    throw new Error(`${proposal.riskTier} risk proposals require approval before execution.`);
  }

  const adapter = resolveAdapter(proposal.adapter);
  let next = proposal;
  if (next.status === "pending") {
    next = await saveExecutionProposal({
      ...next,
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedByUserId: scope.userId,
    });
  }

  try {
    const result = await adapter.execute(scope, next.actionType, next.payload);
    if (!result.ok) {
      const failed = await saveExecutionProposal({
        ...next,
        status: "failed",
        executedAt: new Date().toISOString(),
        error: result.detail,
        result: {
          ok: false,
          detail: result.detail,
          ...(result.data ?? {}),
        },
      });
      let actionMemoryId: string | undefined;
      let driftContext: ExecutionFinishedDriftContext | undefined;
      try {
        const lineage = await recordExecutionLineage(failed, false);
        actionMemoryId = lineage.actionMemory.id;
        driftContext = {
          filesChanged: lineage.actionMemory.filesChanged,
          executionOutcome: lineage.executionOutcome
            ? {
                status: lineage.executionOutcome.status,
                resultSummary: lineage.executionOutcome.resultSummary,
                errorMessage: lineage.executionOutcome.errorMessage,
                externalRef: lineage.executionOutcome.externalRef,
                goal: lineage.executionOutcome.goal,
                planSummary: lineage.executionOutcome.planSummary,
              }
            : undefined,
        };
      } catch (error) {
        console.warn("[ActionMemory] Failed to record execution lineage:", error);
      }
      try {
        await onExecutionProposalFinished(scope, failed, actionMemoryId, driftContext);
      } catch (error) {
        console.warn("[OperationalLoop] proposal finished hook failed:", error);
      }
      return failed;
    }
    const executed = await saveExecutionProposal({
      ...next,
      status: "executed",
      executedAt: new Date().toISOString(),
      error: null,
      result: {
        ok: true,
        detail: result.detail,
        externalRef: result.externalRef ?? null,
        ...(result.data ?? {}),
      },
    });
    let actionMemoryId: string | undefined;
    let driftContext: ExecutionFinishedDriftContext | undefined;
    try {
      const lineage = await recordExecutionLineage(executed, true);
      actionMemoryId = lineage.actionMemory.id;
      driftContext = {
        filesChanged: lineage.actionMemory.filesChanged,
        executionOutcome: lineage.executionOutcome
          ? {
              status: lineage.executionOutcome.status,
              resultSummary: lineage.executionOutcome.resultSummary,
              errorMessage: lineage.executionOutcome.errorMessage,
              externalRef: lineage.executionOutcome.externalRef,
              goal: lineage.executionOutcome.goal,
              planSummary: lineage.executionOutcome.planSummary,
            }
          : undefined,
      };
    } catch (error) {
      console.warn("[ActionMemory] Failed to record execution lineage:", error);
    }
    try {
      await onExecutionProposalFinished(scope, executed, actionMemoryId, driftContext);
    } catch (error) {
      console.warn("[OperationalLoop] proposal finished hook failed:", error);
    }
    return executed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed.";
    const failed = await saveExecutionProposal({
      ...next,
      status: "failed",
      executedAt: new Date().toISOString(),
      error: message,
      result: { ok: false, detail: message },
    });
    let actionMemoryId: string | undefined;
    let driftContext: ExecutionFinishedDriftContext | undefined;
    try {
      const lineage = await recordExecutionLineage(failed, false);
      actionMemoryId = lineage.actionMemory.id;
      driftContext = {
        filesChanged: lineage.actionMemory.filesChanged,
        executionOutcome: lineage.executionOutcome
          ? {
              status: lineage.executionOutcome.status,
              resultSummary: lineage.executionOutcome.resultSummary,
              errorMessage: lineage.executionOutcome.errorMessage,
              externalRef: lineage.executionOutcome.externalRef,
              goal: lineage.executionOutcome.goal,
              planSummary: lineage.executionOutcome.planSummary,
            }
          : undefined,
      };
    } catch (lineageError) {
      console.warn("[ActionMemory] Failed to record execution lineage:", lineageError);
    }
    try {
      await onExecutionProposalFinished(scope, failed, actionMemoryId, driftContext);
    } catch (loopError) {
      console.warn("[OperationalLoop] proposal finished hook failed:", loopError);
    }
    return failed;
  }
}

export async function listPendingExecutionProposals(
  scope: ExecutionScope,
  limit = 30,
): Promise<ExecutionProposal[]> {
  const proposals = await listExecutionProposals(scope.userId, {
    orgId: scope.orgId,
    limit,
  });
  return proposals.filter((entry) => entry.status === "pending" || entry.status === "approved");
}

export { listExecutionProposals };

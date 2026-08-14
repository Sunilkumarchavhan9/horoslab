import {
  agentLineageMetadata,
  extractAgentLineageFromPayload,
} from "../agents/agentLineage";
import { findOperationalLoopByProposalId } from "../companyBrain/operationalLoopStore";
import type { ExecutionProposal } from "../companyBrain/executionTypes";
import {
  createActionMemory,
  createApprovalTrace,
  createExecutionOutcome,
} from "./actionMemoryStore";
import type {
  ActionMemorySourceType,
  ActionMemoryWithLineage,
} from "./actionMemoryTypes";

function resolveSourceType(adapter: string): ActionMemorySourceType {
  if (adapter === "github") return "github_execution";
  if (adapter === "continuity") return "continuity";
  return "manual";
}

function extractFilesChanged(payload: Record<string, unknown>): string[] {
  const files: string[] = [];
  if (typeof payload.filePath === "string" && payload.filePath.trim()) {
    files.push(payload.filePath.trim());
  }
  if (Array.isArray(payload.filesChanged)) {
    for (const entry of payload.filesChanged) {
      if (typeof entry === "string" && entry.trim()) files.push(entry.trim());
    }
  }
  return files;
}

function buildActionLabel(proposal: ExecutionProposal): string {
  return `${proposal.adapter}:${proposal.actionType}`;
}

function buildReason(proposal: ExecutionProposal, succeeded: boolean): string {
  if (succeeded) {
    const detail =
      typeof proposal.result?.detail === "string" ? proposal.result.detail : undefined;
    return detail ?? `Executed ${proposal.adapter} ${proposal.actionType}.`;
  }
  return proposal.error ?? `Failed to execute ${proposal.adapter} ${proposal.actionType}.`;
}

export async function recordExecutionLineage(
  proposal: ExecutionProposal,
  succeeded: boolean,
): Promise<ActionMemoryWithLineage> {
  const outcome = succeeded ? "success" : "failed";
  const loop = await findOperationalLoopByProposalId(
    proposal.userId,
    proposal.id,
    proposal.orgId ?? undefined,
  );
  const agentLineage = extractAgentLineageFromPayload(proposal.payload);
  const resolvedGoalId = agentLineage.goalId ?? loop?.id;
  const actionMemory = await createActionMemory({
    userId: proposal.userId,
    orgId: proposal.orgId ?? null,
    action: buildActionLabel(proposal),
    reason: buildReason(proposal, succeeded),
    approvedBy: proposal.reviewedByUserId,
    approvedAt: proposal.reviewedAt,
    filesChanged: extractFilesChanged(proposal.payload),
    outcome,
    followUps: [],
    sourceType: resolveSourceType(proposal.adapter),
    sourceId: proposal.id,
    metadata: {
      proposalStatus: proposal.status,
      riskTier: proposal.riskTier,
      adapter: proposal.adapter,
      actionType: proposal.actionType,
      ...agentLineageMetadata({
        ...agentLineage,
        goalId: resolvedGoalId,
      }),
      ...(loop
        ? {
            operationalLoopId: loop.id,
            operationalLoopState: loop.currentState,
            operationalLoopGoal: loop.goal,
          }
        : {}),
    },
  });

  const externalRef =
    typeof proposal.result?.externalRef === "string"
      ? proposal.result.externalRef
      : typeof proposal.result?.githubResultUrl === "string"
        ? proposal.result.githubResultUrl
        : null;

  const executionOutcome = await createExecutionOutcome({
    actionMemoryId: actionMemory.id,
    userId: proposal.userId,
    orgId: proposal.orgId ?? null,
    goal: `${proposal.adapter} ${proposal.actionType}`,
    planSummary: JSON.stringify(proposal.payload),
    resultSummary:
      typeof proposal.result?.detail === "string" ? proposal.result.detail : proposal.error,
    status: succeeded ? "executed" : "failed",
    errorMessage: succeeded ? null : proposal.error,
    connectorAdapter: proposal.adapter,
    externalRef,
  });

  const approvalTraces = [];
  if (proposal.reviewedByUserId) {
    approvalTraces.push(
      await createApprovalTrace({
        actionMemoryId: actionMemory.id,
        userId: proposal.userId,
        orgId: proposal.orgId ?? null,
        approverId: proposal.reviewedByUserId,
        decision: proposal.status === "rejected" ? "rejected" : "approved",
        reason: proposal.rejectionReason,
        riskTier: proposal.riskTier,
        proposalId: proposal.id,
      }),
    );
  }

  return { actionMemory, executionOutcome, approvalTraces };
}

export async function recordExecutionRejection(
  proposal: ExecutionProposal,
): Promise<{ approvalTrace: Awaited<ReturnType<typeof createApprovalTrace>> }> {
  const approvalTrace = await createApprovalTrace({
    userId: proposal.userId,
    orgId: proposal.orgId ?? null,
    approverId: proposal.reviewedByUserId ?? proposal.userId,
    decision: "rejected",
    reason: proposal.rejectionReason,
    riskTier: proposal.riskTier,
    proposalId: proposal.id,
  });
  return { approvalTrace };
}

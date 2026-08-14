import {
  detectExecutionDrift,
  readDriftReport,
  shouldRollBackOnDrift,
  type DriftReport,
} from "./driftDetection";
import type { ExecutionProposal } from "./executionTypes";
import {
  createOperationalLoop,
  findOperationalLoopByProposalId,
  getOperationalLoop,
  listOperationalLoops,
  saveOperationalLoop,
} from "./operationalLoopStore";
import type {
  CreateOperationalLoopInput,
  OperationalLoop,
  OperationalLoopScope,
  OperationalLoopState,
} from "./operationalLoopTypes";

export type ProposeExecutionLoopContext = {
  goal?: string;
  loopId?: string;
  projectId?: string | null;
};

function uniqueIds(ids: string[], nextId: string): string[] {
  if (!nextId || ids.includes(nextId)) return ids;
  return [nextId, ...ids];
}

async function transitionLoop(
  loop: OperationalLoop,
  nextState: OperationalLoopState,
  patch?: Partial<Pick<OperationalLoop, "linkedProposalIds" | "linkedActionMemoryIds" | "metadata">>,
): Promise<OperationalLoop> {
  return saveOperationalLoop({
    ...loop,
    currentState: nextState,
    linkedProposalIds: patch?.linkedProposalIds ?? loop.linkedProposalIds,
    linkedActionMemoryIds: patch?.linkedActionMemoryIds ?? loop.linkedActionMemoryIds,
    metadata: patch?.metadata ?? loop.metadata,
  });
}

export async function createLoopFromGoal(
  scope: OperationalLoopScope,
  input: CreateOperationalLoopInput,
): Promise<OperationalLoop> {
  if (!input.goal.trim()) {
    throw new Error("goal is required.");
  }
  return createOperationalLoop(scope.userId, input, scope.orgId);
}

export async function resolveLoopForProposal(
  scope: OperationalLoopScope,
  context: ProposeExecutionLoopContext,
): Promise<OperationalLoop | null> {
  if (context.loopId) {
    const existing = await getOperationalLoop(scope.userId, context.loopId, scope.orgId);
    if (!existing) {
      throw new Error("Operational loop not found.");
    }
    return existing;
  }
  const goal = context.goal?.trim();
  if (!goal) return null;
  return createOperationalLoop(
    scope.userId,
    {
      goal,
      projectId: context.projectId ?? null,
      metadata: { source: "execution_propose" },
    },
    scope.orgId,
  );
}

export async function onExecutionProposalCreated(
  scope: OperationalLoopScope,
  proposal: ExecutionProposal,
  context: ProposeExecutionLoopContext,
): Promise<OperationalLoop | null> {
  const loop = await resolveLoopForProposal(scope, context);
  if (!loop) return null;

  const nextState: OperationalLoopState =
    proposal.status === "pending" ? "awaiting_approval" : "plan_proposed";

  return transitionLoop(
    {
      ...loop,
      linkedProposalIds: uniqueIds(loop.linkedProposalIds, proposal.id),
      projectId: loop.projectId ?? context.projectId ?? null,
    },
    nextState,
  );
}

export async function onExecutionProposalReviewed(
  scope: OperationalLoopScope,
  proposal: ExecutionProposal,
): Promise<OperationalLoop | null> {
  const loop = await findOperationalLoopByProposalId(scope.userId, proposal.id, scope.orgId);
  if (!loop) return null;

  if (proposal.status === "rejected") {
    return transitionLoop(loop, "failed", {
      metadata: {
        ...loop.metadata,
        lastRejectionReason: proposal.rejectionReason,
      },
    });
  }
  if (proposal.status === "approved") {
    return transitionLoop(loop, "executing");
  }
  return loop;
}

export type ExecutionFinishedDriftContext = {
  filesChanged?: string[];
  executionOutcome?: {
    status: string;
    resultSummary?: string | null;
    errorMessage?: string | null;
    externalRef?: string | null;
    goal?: string | null;
    planSummary?: string | null;
  };
};

async function applyDriftToLoop(
  loop: OperationalLoop,
  proposal: ExecutionProposal,
  context?: ExecutionFinishedDriftContext,
): Promise<{ loop: OperationalLoop; driftReport: DriftReport | null }> {
  const driftReport = detectExecutionDrift({
    loop,
    proposal,
    filesChanged: context?.filesChanged,
    executionOutcome: context?.executionOutcome ?? null,
  });
  const metadata = {
    ...loop.metadata,
    ...(driftReport ? { driftReport } : {}),
  };
  const saved = await saveOperationalLoop({ ...loop, metadata });
  return { loop: saved, driftReport };
}

export async function onExecutionProposalFinished(
  scope: OperationalLoopScope,
  proposal: ExecutionProposal,
  actionMemoryId?: string | null,
  driftContext?: ExecutionFinishedDriftContext,
): Promise<OperationalLoop | null> {
  const loop = await findOperationalLoopByProposalId(scope.userId, proposal.id, scope.orgId);
  if (!loop) return null;

  let nextState: OperationalLoopState = "failed";
  if (proposal.status === "executed") {
    nextState = "completed";
  } else if (proposal.status === "failed") {
    nextState = "failed";
  }

  const linkedActionMemoryIds = actionMemoryId
    ? uniqueIds(loop.linkedActionMemoryIds, actionMemoryId)
    : loop.linkedActionMemoryIds;

  const transitioned = await transitionLoop(loop, nextState, { linkedActionMemoryIds });
  const { loop: withDrift, driftReport } = await applyDriftToLoop(
    transitioned,
    proposal,
    driftContext,
  );

  if (shouldRollBackOnDrift(driftReport, proposal)) {
    return transitionLoop(withDrift, "rolled_back", {
      metadata: {
        ...withDrift.metadata,
        rolledBackAt: new Date().toISOString(),
        rolledBackReason: driftReport?.summary,
      },
    });
  }

  return withDrift;
}

export async function getLoopDriftReport(
  scope: OperationalLoopScope,
  loopId: string,
): Promise<DriftReport | null> {
  const loop = await getOperationalLoop(scope.userId, loopId, scope.orgId);
  if (!loop) return null;
  return readDriftReport(loop);
}

export function formatOperationalLoopHistoryLine(loop: OperationalLoop): string {
  const proposals = loop.linkedProposalIds.length;
  const actions = loop.linkedActionMemoryIds.length;
  const when = loop.updatedAt.slice(0, 10);
  return `Loop ${loop.currentState} (${when}): ${loop.goal} · ${proposals} proposal(s), ${actions} action(s)`;
}

export async function loadOperationalLoopHistoryForProject(
  scope: OperationalLoopScope,
  project: string,
  limit = 6,
): Promise<string[]> {
  const projectKey = project.trim();
  const loops = await listOperationalLoopsForResume(scope, projectKey, limit);
  return loops.map(formatOperationalLoopHistoryLine);
}

async function listOperationalLoopsForResume(
  scope: OperationalLoopScope,
  project: string,
  limit: number,
): Promise<OperationalLoop[]> {
  const active = await listOperationalLoops(scope.userId, {
    orgId: scope.orgId,
    projectId: project,
    limit,
  });
  if (active.length > 0) return active;

  const recent = await listOperationalLoops(scope.userId, {
    orgId: scope.orgId,
    limit: limit * 2,
  });
  const projectKey = project.trim().toLowerCase();
  return recent
    .filter((loop) => {
      if (loop.projectId?.trim().toLowerCase() === projectKey) return true;
      return projectKey.length > 0 && loop.goal.toLowerCase().includes(projectKey);
    })
    .slice(0, limit);
}

export async function loadProjectDriftBriefLines(
  scope: OperationalLoopScope,
  project: string,
  limit = 6,
): Promise<{ lines: string[]; hasUnresolvedHighDrift: boolean }> {
  const loops = await listOperationalLoops(scope.userId, {
    orgId: scope.orgId,
    projectId: project,
    limit: limit * 2,
  });
  const lines: string[] = [];
  let hasUnresolvedHighDrift = false;
  for (const loop of loops) {
    const report = readDriftReport(loop);
    if (!report) continue;
    const unresolved =
      loop.currentState === "failed" ||
      loop.currentState === "rolled_back" ||
      loop.currentState === "executing" ||
      loop.currentState === "awaiting_approval";
    if (unresolved && report.severity === "high") {
      hasUnresolvedHighDrift = true;
    }
    lines.push(`Loop ${loop.currentState}: ${report.summary}`);
    for (const step of report.correctiveSteps.slice(0, 2)) {
      lines.push(`→ ${step}`);
    }
    if (lines.length >= limit) break;
  }
  return { lines: lines.slice(0, limit), hasUnresolvedHighDrift };
}

export async function countRecentCompletedLoops(
  scope: OperationalLoopScope,
  project?: string,
  withinDays = 7,
): Promise<number> {
  const loops = await listOperationalLoops(scope.userId, {
    orgId: scope.orgId,
    projectId: project,
    states: ["completed"],
    limit: 20,
  });
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;
  return loops.filter((loop) => {
    const ms = Date.parse(loop.updatedAt);
    return Number.isFinite(ms) && ms >= cutoff;
  }).length;
}

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/storage/prismaClient";
import { createEpochMission } from "../lib/epoch/epochStore";
import { persistEpochProductionInteraction } from "../lib/epoch/latePhaseStore";
import {
  approvePersistedEpochFixProposal,
  listEpochProductionIntelligence,
  persistEpochFixProposal,
  persistEpochImprovementMetric,
  persistEpochReliabilityMetric,
  persistEpochReplayResult,
  persistEpochReplaySession,
} from "../lib/epoch/productionIntelligenceStore";

const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
const userId = process.env.EPOCH_V13_GATE_USER_ID;
const orgId = process.env.EPOCH_V13_GATE_ORG_ID;

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  if (!workspaceId || !userId) {
    throw new Error("Set EPOCH_V13_GATE_WORKSPACE_ID and EPOCH_V13_GATE_USER_ID before running this gate.");
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true, orgId: true },
  });
  assertCondition(workspace, "The configured V13 gate workspace was not found for this user.");
  const organizationId = workspace.orgId ?? orgId;

  const institution = await prisma.epochInstitution.findFirst({
    where: { workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true },
  });
  assertCondition(institution, "Create an institution in Mission Control before running the Phase 12 gate.");

  const fixture = `V13 production intelligence gate ${new Date().toISOString()}`;
  const mission = await createEpochMission({
    workspaceId,
    institutionId: institution.id,
    userId,
    ...(organizationId ? { orgId: organizationId } : {}),
    title: `${fixture} mission`,
    objective: "Turn a production failure into a reviewed, measurable improvement.",
  });

  const interactionInput = {
    workspaceId,
    missionId: mission.id,
    workerId: `worker-${randomUUID()}`,
    input: "Create a pull request for the authentication fix",
    output: "The request could not be created",
    latencyMs: 12_000,
    toolFailures: 2,
    retries: 3,
    userFeedback: "negative" as const,
    turns: 22,
    abandoned: true,
    repeatedQuestionCount: 3,
    setupStep: "repository_connection",
    supportEscalated: true,
    conversionDropped: true,
    humanEdited: true,
  };
  const first = await persistEpochProductionInteraction({ id: `interaction-${randomUUID()}`, ...interactionInput });
  const second = await persistEpochProductionInteraction({ id: `interaction-${randomUUID()}`, ...interactionInput, missionId: mission.id });
  assertCondition(first.failureScore > 70 && second.failureScore > 70, "Production failure scoring did not identify the high-impact interactions.");
  console.log(`[PASS] Production interactions captured and scored: ${first.signals.length} signals each.`);

  const intelligence = await listEpochProductionIntelligence({ workspaceId, limit: 100 });
  const cluster = intelligence.clusters.find((item) => {
    const interactionIds = Array.isArray(item.interactionIds) && item.interactionIds.every((value): value is string => typeof value === "string")
      ? item.interactionIds
      : [];
    return interactionIds.includes(first.id) && interactionIds.includes(second.id);
  });
  assertCondition(cluster, "Production interactions were not clustered together.");
  assertCondition(intelligence.signals.some((signal) => signal.interactionId === first.id), "Failure signals were not persisted.");
  assertCondition(intelligence.rootCauses.some((record) => record.clusterId === cluster.id), "Root-cause hypothesis was not created.");
  assertCondition(intelligence.evaluations.some((evaluation) => evaluation.clusterId === cluster.id), "Regression evaluation draft was not created.");
  console.log(`[PASS] Failure detection, clustering, root cause, and regression draft persisted: cluster=${cluster.id}.`);

  const replay = await persistEpochReplaySession({
    id: `replay-${randomUUID()}`,
    workspaceId,
    missionId: mission.id,
    variant: { promptVersion: "candidate", recovery: "bounded_retry" },
  });
  const replayResult = await persistEpochReplayResult({
    id: `replay-result-${randomUUID()}`,
    workspaceId,
    replaySessionId: replay.id,
    baseline: { score: 20, failureRate: 0.8 },
    candidate: { score: 90, failureRate: 0.1 },
  });
  assertCondition(replayResult.status === "pass", "Replay comparison did not pass.");
  console.log(`[PASS] Replay comparison passed: scoreDelta=${String(replayResult.comparison.scoreDelta)}.`);

  const proposal = await persistEpochFixProposal({
    id: `fix-${randomUUID()}`,
    workspaceId,
    clusterId: cluster.id,
    proposedBy: userId,
    kind: "recovery",
    proposal: "Apply the bounded retry recovery strategy validated by the candidate replay.",
    risk: "medium",
    rollback: "Restore the previous recovery policy version.",
  });
  await assertRejectsSeparationOfDuties(workspaceId, proposal.id, userId);
  const approvedProposal = await approvePersistedEpochFixProposal({ workspaceId, proposalId: proposal.id, approverId: `reviewer-${randomUUID()}` });
  assertCondition(approvedProposal?.status === "approved", "Fix proposal was not approved by an independent reviewer.");
  console.log("[PASS] Fix proposal approval enforced separation of duties.");

  const reliability = await persistEpochReliabilityMetric({
    id: `reliability-${randomUUID()}`,
    workspaceId,
    workerId: interactionInput.workerId,
    windowStart: new Date(Date.now() - 3_600_000),
    windowEnd: new Date(),
    sampleSize: 10,
    successes: 9,
    failures: 1,
    recoveries: 1,
    humanInterventions: 1,
  });
  const improvement = await persistEpochImprovementMetric({
    id: `improvement-${randomUUID()}`,
    workspaceId,
    clusterId: cluster.id,
    baseline: { failureRate: 0.8, successRate: 0.2 },
    after: { failureRate: 0.1, successRate: 0.9 },
  });
  assertCondition(reliability.successRate === 0.9 && improvement.verified, "Reliability or verified improvement was not persisted.");
  const final = await listEpochProductionIntelligence({ workspaceId, limit: 100 });
  assertCondition(final.replays.some((item) => item.id === replay.id && item.status === "completed"), "Replay session was not completed.");
  assertCondition(final.fixes.some((item) => item.id === proposal.id && item.status === "approved"), "Approved fix proposal was not readable.");
  assertCondition(final.improvements.some((item) => item.id === improvement.id && item.verified), "Verified improvement was not readable.");
  console.log(`[PASS] Phase 12 production intelligence gate passed: mission=${mission.id}, cluster=${cluster.id}.`);
}

async function assertRejectsSeparationOfDuties(workspace: string, proposalId: string, authorId: string) {
  try {
    await approvePersistedEpochFixProposal({ workspaceId: workspace, proposalId, approverId: authorId });
  } catch (error) {
    if (error instanceof Error && error.message === "epoch_fix_separation_of_duties_required") return;
    throw error;
  }
  throw new Error("Fix proposal author was allowed to approve their own proposal.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

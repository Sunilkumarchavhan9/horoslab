import type { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";
import {
  buildEpochFailureSignals,
  buildEpochRootCauseRecord,
  compareEpochReplay,
  computeEpochReliabilityMetric,
  createEpochFixProposal,
  createEpochReplaySession,
  verifyEpochImprovement,
  type EpochFailureCluster,
  type EpochProductionInteraction,
} from "./productionIntelligence";

const json = (value: unknown) => value as Prisma.InputJsonValue;

export async function persistEpochFailureSignals(interaction: EpochProductionInteraction) {
  const signals = buildEpochFailureSignals(interaction);
  if (signals.length) await prisma.epochFailureSignal.createMany({ data: signals.map((signal) => ({ id: signal.id, workspaceId: signal.workspaceId, interactionId: signal.interactionId, missionId: signal.missionId, kind: signal.kind, severity: signal.severity, score: signal.score, evidence: json(signal.evidence), createdAt: new Date(signal.createdAt) })) });
  return signals;
}

export async function persistEpochRootCause(input: { id: string; workspaceId: string; cluster: EpochFailureCluster; signals: Awaited<ReturnType<typeof persistEpochFailureSignals>> }) {
  const record = buildEpochRootCauseRecord(input);
  await prisma.epochRootCauseRecord.upsert({ where: { id: record.id }, create: { id: record.id, workspaceId: record.workspaceId, clusterId: record.clusterId, hypothesis: record.hypothesis, confidence: record.confidence, evidence: json(record.evidence), status: record.status, createdAt: new Date(record.createdAt) }, update: { hypothesis: record.hypothesis, confidence: record.confidence, evidence: json(record.evidence) } });
  return record;
}

export async function persistEpochRegressionEvaluation(input: { id: string; workspaceId: string; clusterId: string; input: string; expected: string; verification: string }) {
  const record = await prisma.epochRegressionEvaluation.upsert({ where: { id: input.id }, create: { id: input.id, workspaceId: input.workspaceId, clusterId: input.clusterId, input: input.input, expected: input.expected, verification: input.verification }, update: { input: input.input, expected: input.expected, verification: input.verification } });
  return record;
}

export async function persistEpochReplaySession(input: Parameters<typeof createEpochReplaySession>[0]) {
  const session = createEpochReplaySession(input);
  await prisma.epochReplaySession.create({ data: { id: session.id, workspaceId: session.workspaceId, missionId: session.missionId, sourceRunId: session.sourceRunId, variant: json(session.variant), status: session.status, createdAt: new Date(session.createdAt) } });
  return session;
}

export async function persistEpochReplayResult(input: Parameters<typeof compareEpochReplay>[0]) {
  const result = compareEpochReplay(input);
  await prisma.epochReplayResult.create({ data: { id: result.id, workspaceId: result.workspaceId, replaySessionId: result.replaySessionId, baseline: json(result.baseline), candidate: json(result.candidate), comparison: json(result.comparison), status: result.status, createdAt: new Date(result.createdAt) } });
  await prisma.epochReplaySession.updateMany({ where: { id: result.replaySessionId, workspaceId: result.workspaceId }, data: { status: "completed", completedAt: new Date(result.createdAt) } });
  return result;
}

export async function persistEpochFixProposal(input: Parameters<typeof createEpochFixProposal>[0]) {
  const proposal = createEpochFixProposal(input);
  await prisma.epochFixProposal.create({ data: { id: proposal.id, workspaceId: proposal.workspaceId, clusterId: proposal.clusterId, proposedBy: proposal.proposedBy, kind: proposal.kind, proposal: proposal.proposal, risk: proposal.risk, rollback: proposal.rollback, status: proposal.status, createdAt: new Date(proposal.createdAt) } });
  return proposal;
}

export async function approvePersistedEpochFixProposal(input: { workspaceId: string; proposalId: string; approverId: string; now?: Date }) {
  const stored = await prisma.epochFixProposal.findFirst({ where: { id: input.proposalId, workspaceId: input.workspaceId, status: "draft" } });
  if (!stored) return null;
  if (stored.proposedBy && stored.proposedBy === input.approverId) throw new Error("epoch_fix_separation_of_duties_required");
  const approvedAt = input.now ?? new Date();
  return prisma.epochFixProposal.update({
    where: { id: stored.id },
    data: { status: "approved", approvedAt, approvedBy: input.approverId },
  });
}

export async function persistEpochReliabilityMetric(input: Parameters<typeof computeEpochReliabilityMetric>[0]) {
  const metric = computeEpochReliabilityMetric(input);
  await prisma.epochReliabilityMetric.create({ data: { id: metric.id, workspaceId: metric.workspaceId, workerId: metric.workerId, windowStart: new Date(metric.windowStart), windowEnd: new Date(metric.windowEnd), sampleSize: metric.sampleSize, successRate: metric.successRate, failureRate: metric.failureRate, recoveryRate: metric.recoveryRate, humanInterventionRate: metric.humanInterventionRate, confidence: metric.confidence, createdAt: new Date(metric.createdAt) } });
  return metric;
}

export async function persistEpochImprovementMetric(input: Parameters<typeof verifyEpochImprovement>[0]) {
  const metric = verifyEpochImprovement(input);
  await prisma.epochImprovementMetric.create({ data: { id: metric.id, workspaceId: metric.workspaceId, clusterId: metric.clusterId, baseline: json(metric.baseline), after: json(metric.after), delta: json(metric.delta), verified: metric.verified, createdAt: new Date(metric.createdAt) } });
  return metric;
}

export async function listEpochProductionIntelligence(input: { workspaceId: string; limit?: number }) {
  const take = Math.min(100, Math.max(1, input.limit ?? 50));
  const [interactions, signals, clusters, rootCauses, evaluations, replays, fixes, reliability, improvements] = await Promise.all([
    prisma.epochProductionInteraction.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { capturedAt: "desc" }, take }),
    prisma.epochFailureSignal.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { createdAt: "desc" }, take }),
    prisma.epochFailureCluster.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { averageFailureScore: "desc" }, take }),
    prisma.epochRootCauseRecord.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { createdAt: "desc" }, take }),
    prisma.epochRegressionEvaluation.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { createdAt: "desc" }, take }),
    prisma.epochReplaySession.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { createdAt: "desc" }, take }),
    prisma.epochFixProposal.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { createdAt: "desc" }, take }),
    prisma.epochReliabilityMetric.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { windowEnd: "desc" }, take }),
    prisma.epochImprovementMetric.findMany({ where: { workspaceId: input.workspaceId }, orderBy: { createdAt: "desc" }, take }),
  ]);
  return { interactions, signals, clusters, rootCauses, evaluations, replays, fixes, reliability, improvements };
}

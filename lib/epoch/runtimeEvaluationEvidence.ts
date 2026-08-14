import { prisma } from "../storage/prismaClient";
import type { EpochTaskExecutionResult, EpochTaskFamily } from "./taskExecutionAdapters";

export function buildEpochRuntimeEvaluationEvidence(input: { task: EpochTaskFamily; model: string; execution: EpochTaskExecutionResult; caseId?: string; recordedAt?: Date }) {
  const recordedAt = (input.recordedAt ?? new Date()).toISOString();
  return {
    version: "epoch_runtime_evaluation_evidence.v1" as const,
    task: input.task,
    model: input.model,
    ...(input.caseId ? { caseId: input.caseId } : {}),
    execution: input.execution,
    benchmark: {
      status: input.execution.status === "OBSERVED" ? "OBSERVED" : input.execution.status,
      latencyMs: input.execution.latencyMs,
      httpStatus: input.execution.httpStatus,
    },
    quality: {
      status: "PENDING_DATASET_EVALUATION" as const,
      reason: "Runtime output validity is not a task-quality score; run a configured evaluator dataset.",
    },
    recordedAt,
  };
}

export async function persistEpochRuntimeEvaluationEvidence(input: { workspaceId: string; missionId: string; userId: string; task: EpochTaskFamily; model: string; caseId?: string; execution: EpochTaskExecutionResult }) {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId }, select: { id: true, proof: true, timeline: true } });
  if (!mission) throw new Error("epoch_mission_not_found");
  const evidence = buildEpochRuntimeEvaluationEvidence(input);
  const proof = mission.proof && typeof mission.proof === "object" ? mission.proof as Record<string, unknown> : {};
  const evaluations = Array.isArray(proof.runtimeEvaluations) ? proof.runtimeEvaluations : [];
  const timeline = Array.isArray(mission.timeline) ? mission.timeline : [];
  await prisma.epochMission.update({ where: { id: mission.id }, data: { proof: { ...proof, runtimeEvaluations: [...evaluations, evidence].slice(-100) } as any, timeline: [...timeline, { id: `runtime_${Date.now()}`, stage: "observation", status: input.execution.status, note: "Runtime execution recorded for benchmark and quality evaluation", timestamp: evidence.recordedAt, evidence: evidence.execution.responseSha256 }] as any } });
  return prisma.epochObservation.create({ data: { workspaceId: input.workspaceId, missionId: input.missionId, kind: "epoch_runtime_execution", value: evidence as any, evidenceIds: [], observedAt: new Date(evidence.recordedAt) } });
}

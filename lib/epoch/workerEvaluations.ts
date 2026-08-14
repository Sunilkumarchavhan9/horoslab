import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";

export type EpochWorkerEvaluationInput = { workspaceId: string; workerId: string; missionId?: string; outcome: "passed" | "failed" | "unknown"; score: number; latencyMs?: number; evidence?: Record<string, unknown> };

export async function recordEpochWorkerEvaluation(input: EpochWorkerEvaluationInput) {
  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 100) throw new Error("epoch_worker_evaluation_score_invalid");
  const worker = await prisma.epochWorker.findFirst({ where: { id: input.workerId, workspaceId: input.workspaceId } });
  if (!worker) return null;
  return prisma.epochWorkerEvaluation.create({ data: { id: randomUUID(), workspaceId: input.workspaceId, workerId: input.workerId, missionId: input.missionId, outcome: input.outcome, score: input.score, latencyMs: input.latencyMs, evidence: (input.evidence ?? {}) as Prisma.InputJsonValue } });
}

export async function listEpochWorkerEvaluations(input: { workspaceId: string; workerId: string; limit?: number }) {
  return prisma.epochWorkerEvaluation.findMany({ where: { workspaceId: input.workspaceId, workerId: input.workerId }, orderBy: { createdAt: "desc" }, take: Math.min(100, Math.max(1, input.limit ?? 20)) });
}

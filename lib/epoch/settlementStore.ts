import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";
import { buildEpochLearningHandoff } from "./learningHandoff";
import { buildEpochSettlement, type EpochSettlementDecision } from "./settlement";

export async function settleEpochMission(input: { workspaceId: string; missionId: string; decision: EpochSettlementDecision; evidenceHash: string; assuranceConfidence: number; humanApproval: "approved" | "rejected" | "review"; unresolvedRisks: string[]; summary?: string; lessons?: string[] }) {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId } });
  if (!mission) return null;
  const settlement = buildEpochSettlement(input);
  const persistedSettlement = {
    decision: settlement.decision,
    status: settlement.status,
    reason: settlement.reason,
    evidenceHash: settlement.evidenceHash,
    learningEligible: settlement.learningEligible,
  };
  const handoff = buildEpochLearningHandoff({ missionId: input.missionId, settlement, summary: input.summary ?? mission.title, lessons: input.lessons ?? [], risks: input.unresolvedRisks });
  return prisma.epochSettlement.upsert({ where: { workspaceId_missionId: { workspaceId: input.workspaceId, missionId: input.missionId } }, create: { id: randomUUID(), workspaceId: input.workspaceId, missionId: input.missionId, ...persistedSettlement, learningPayload: (handoff ?? {}) as Prisma.InputJsonValue }, update: { decision: settlement.decision, status: settlement.status, reason: settlement.reason, evidenceHash: settlement.evidenceHash, learningEligible: settlement.learningEligible, learningPayload: (handoff ?? {}) as Prisma.InputJsonValue } });
}

export async function getEpochMissionSettlement(workspaceId: string, missionId: string) {
  return prisma.epochSettlement.findFirst({ where: { workspaceId, missionId } });
}

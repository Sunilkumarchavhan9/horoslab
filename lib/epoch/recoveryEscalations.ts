import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";

export async function createEpochRecoveryEscalation(input: { workspaceId: string; missionId: string; executionRunId?: string; reason: string; payload?: Record<string, unknown> }) {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId } });
  if (!mission) return null;
  return prisma.epochRecoveryEscalation.create({ data: { id: randomUUID(), workspaceId: input.workspaceId, missionId: input.missionId, executionRunId: input.executionRunId, reason: input.reason, status: "open", payload: (input.payload ?? {}) as Prisma.InputJsonValue } });
}

export async function listEpochRecoveryEscalations(workspaceId: string, missionId?: string) {
  return prisma.epochRecoveryEscalation.findMany({ where: { workspaceId, ...(missionId ? { missionId } : {}) }, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function resolveEpochRecoveryEscalation(input: { workspaceId: string; escalationId: string; resolvedBy: string; resolution: string }) {
  return prisma.epochRecoveryEscalation.updateMany({ where: { id: input.escalationId, workspaceId: input.workspaceId, status: "open" }, data: { status: "resolved", resolvedBy: input.resolvedBy, resolution: input.resolution, resolvedAt: new Date() } });
}

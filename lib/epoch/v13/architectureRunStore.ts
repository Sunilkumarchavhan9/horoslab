import { Prisma } from "@prisma/client";
import { prisma } from "../../storage/prismaClient";
import { EpochArchitectureRunV1Schema, type EpochArchitectureRunV1 } from "./contracts";

function toContract(row: {
  id: string;
  workspaceId: string;
  missionId: string;
  environment: string;
  status: string;
  currentStage: string;
  stages: unknown;
  evidenceIds: unknown;
  verificationIds: unknown;
  outcomeId: string | null;
  experienceId: string | null;
  correlationId: string;
  traceId: string;
  createdAt: Date;
  updatedAt: Date;
}): EpochArchitectureRunV1 {
  return EpochArchitectureRunV1Schema.parse({
    contractVersion: "epoch.runtime.v13",
    id: row.id,
    workspaceId: row.workspaceId,
    missionId: row.missionId,
    environment: row.environment,
    status: row.status,
    currentStage: row.currentStage,
    stages: row.stages,
    evidenceIds: row.evidenceIds,
    verificationIds: row.verificationIds,
    ...(row.outcomeId ? { outcomeId: row.outcomeId } : {}),
    ...(row.experienceId ? { experienceId: row.experienceId } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    correlation: { correlationId: row.correlationId, traceId: row.traceId },
  });
}

export async function getEpochArchitectureRun(workspaceId: string, missionId: string) {
  const row = await prisma.epochArchitectureRun.findUnique({
    where: { workspaceId_missionId: { workspaceId, missionId } },
  });
  return row ? toContract(row) : null;
}

export async function persistEpochArchitectureRun(trace: EpochArchitectureRunV1) {
  const row = await prisma.epochArchitectureRun.upsert({
    where: { workspaceId_missionId: { workspaceId: trace.workspaceId, missionId: trace.missionId } },
    create: {
      id: trace.id,
      workspaceId: trace.workspaceId,
      missionId: trace.missionId,
      environment: trace.environment,
      status: trace.status,
      currentStage: trace.currentStage,
      stages: trace.stages as unknown as Prisma.InputJsonValue,
      evidenceIds: trace.evidenceIds as unknown as Prisma.InputJsonValue,
      verificationIds: trace.verificationIds as unknown as Prisma.InputJsonValue,
      outcomeId: trace.outcomeId,
      experienceId: trace.experienceId,
      correlationId: trace.correlation.correlationId,
      traceId: trace.correlation.traceId,
      createdAt: new Date(trace.createdAt),
      updatedAt: new Date(trace.updatedAt),
    },
    update: {
      environment: trace.environment,
      status: trace.status,
      currentStage: trace.currentStage,
      stages: trace.stages as unknown as Prisma.InputJsonValue,
      evidenceIds: trace.evidenceIds as unknown as Prisma.InputJsonValue,
      verificationIds: trace.verificationIds as unknown as Prisma.InputJsonValue,
      outcomeId: trace.outcomeId,
      experienceId: trace.experienceId,
      correlationId: trace.correlation.correlationId,
      traceId: trace.correlation.traceId,
    },
  });
  return toContract(row);
}

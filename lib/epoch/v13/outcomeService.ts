import { Prisma } from "@prisma/client";
import { prisma } from "../../storage/prismaClient";
import { emitEpochRuntimeEvent } from "../epochEvents";
import { ExperienceV1Schema, OutcomeV1Schema, type ExperienceV1, type OutcomeV1 } from "./contracts";

export type EpochOutcomeScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId?: string;
  traceId?: string;
  causationId?: string;
};

export type EpochOutcomeInput = {
  status: "pending" | "achieved" | "not_achieved" | "unknown";
  summary: string;
  verificationId?: string;
  evidenceIds?: string[];
  customerResult?: Record<string, unknown>;
};

export type EpochExperienceInput = {
  summary: string;
  lessons: string[];
  confidence: number;
  reusable?: boolean;
  context?: Record<string, unknown>;
};

function correlation(scope: EpochOutcomeScope, subjectId: string) {
  const correlationId = scope.correlationId ?? `epoch:${subjectId}`;
  return { correlationId, traceId: scope.traceId ?? correlationId };
}

async function assertMission(scope: EpochOutcomeScope, missionId: string) {
  const mission = await prisma.epochMission.findFirst({
    where: { id: missionId, workspaceId: scope.workspaceId },
    select: { id: true },
  });
  if (!mission) throw new Error("MISSION_NOT_FOUND");
}

async function validateReferences(scope: EpochOutcomeScope, missionId: string, input: EpochOutcomeInput) {
  if (input.verificationId) {
    const verification = await prisma.epochVerificationRun.findFirst({
      where: { id: input.verificationId, workspaceId: scope.workspaceId, missionId },
      select: { id: true },
    });
    if (!verification) throw new Error("VERIFICATION_NOT_FOUND");
  }
  const evidenceIds = input.evidenceIds ?? [];
  if (evidenceIds.length) {
    const evidence = await prisma.epochEvidence.findMany({
      where: { id: { in: evidenceIds }, workspaceId: scope.workspaceId, missionId },
      select: { id: true },
    });
    if (evidence.length !== new Set(evidenceIds).size) throw new Error("EVIDENCE_NOT_FOUND");
  }
}

function outcomeContract(row: {
  id: string; workspaceId: string; missionId: string; status: string; summary: string;
  verificationId: string | null; evidenceIds: unknown; createdAt: Date; updatedAt: Date;
  correlationId: string; traceId: string;
}): OutcomeV1 {
  return OutcomeV1Schema.parse({
    contractVersion: "epoch.runtime.v13",
    id: row.id,
    workspaceId: row.workspaceId,
    missionId: row.missionId,
    status: row.status,
    summary: row.summary,
    ...(row.verificationId ? { verificationId: row.verificationId } : {}),
    evidenceIds: row.evidenceIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    correlation: { correlationId: row.correlationId, traceId: row.traceId },
  });
}

function experienceContract(row: {
  id: string; workspaceId: string; outcomeId: string; summary: string; lessons: unknown;
  confidence: number; reusable: boolean; createdAt: Date; updatedAt: Date;
  correlationId: string; traceId: string;
}): ExperienceV1 {
  return ExperienceV1Schema.parse({
    contractVersion: "epoch.runtime.v13",
    id: row.id,
    workspaceId: row.workspaceId,
    sourceOutcomeId: row.outcomeId,
    summary: row.summary,
    lessons: row.lessons,
    confidence: row.confidence,
    reusable: row.reusable,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    correlation: { correlationId: row.correlationId, traceId: row.traceId },
  });
}

export async function upsertMissionOutcome(scope: EpochOutcomeScope, missionId: string, input: EpochOutcomeInput) {
  await assertMission(scope, missionId);
  await validateReferences(scope, missionId, input);
  const ids = correlation(scope, missionId);
  const row = await prisma.epochOutcome.upsert({
    where: { missionId },
    create: {
      id: `outcome_${missionId}`,
      workspaceId: scope.workspaceId,
      missionId,
      userId: scope.userId,
      orgId: scope.orgId,
      status: input.status,
      summary: input.summary,
      verificationId: input.verificationId,
      evidenceIds: (input.evidenceIds ?? []) as unknown as Prisma.InputJsonValue,
      customerResult: (input.customerResult ?? {}) as Prisma.InputJsonValue,
      correlationId: ids.correlationId,
      traceId: ids.traceId,
    },
    update: {
      status: input.status,
      summary: input.summary,
      verificationId: input.verificationId,
      evidenceIds: (input.evidenceIds ?? []) as unknown as Prisma.InputJsonValue,
      customerResult: (input.customerResult ?? {}) as Prisma.InputJsonValue,
      correlationId: ids.correlationId,
      traceId: ids.traceId,
    },
  });
  emitEpochRuntimeEvent({ userId: scope.userId, orgId: scope.orgId, workspaceId: scope.workspaceId, kind: "epoch.outcome.recorded", label: "Epoch outcome recorded", subjectId: missionId, payload: { outcomeId: row.id, status: row.status }, correlationId: ids.correlationId, traceId: ids.traceId, causationId: scope.causationId });
  return outcomeContract(row);
}

export async function getMissionOutcome(scope: EpochOutcomeScope, missionId: string) {
  await assertMission(scope, missionId);
  const row = await prisma.epochOutcome.findUnique({ where: { missionId } });
  return row ? outcomeContract(row) : null;
}

export async function upsertOutcomeExperience(scope: EpochOutcomeScope, outcomeId: string, input: EpochExperienceInput) {
  const outcome = await prisma.epochOutcome.findFirst({ where: { id: outcomeId, workspaceId: scope.workspaceId }, select: { id: true } });
  if (!outcome) throw new Error("OUTCOME_NOT_FOUND");
  const ids = correlation(scope, outcomeId);
  const row = await prisma.epochExperience.upsert({
    where: { outcomeId },
    create: { id: `experience_${outcomeId}`, workspaceId: scope.workspaceId, outcomeId, summary: input.summary, lessons: input.lessons as unknown as Prisma.InputJsonValue, confidence: input.confidence, reusable: input.reusable ?? true, context: (input.context ?? {}) as Prisma.InputJsonValue, correlationId: ids.correlationId, traceId: ids.traceId },
    update: { summary: input.summary, lessons: input.lessons as unknown as Prisma.InputJsonValue, confidence: input.confidence, reusable: input.reusable ?? true, context: (input.context ?? {}) as Prisma.InputJsonValue, correlationId: ids.correlationId, traceId: ids.traceId },
  });
  emitEpochRuntimeEvent({ userId: scope.userId, orgId: scope.orgId, workspaceId: scope.workspaceId, kind: "epoch.experience.recorded", label: "Epoch experience recorded", subjectId: outcomeId, payload: { experienceId: row.id, outcomeId }, correlationId: ids.correlationId, traceId: ids.traceId, causationId: scope.causationId });
  return experienceContract(row);
}

export async function getOutcomeExperience(scope: EpochOutcomeScope, outcomeId: string) {
  const row = await prisma.epochExperience.findFirst({ where: { outcomeId, workspaceId: scope.workspaceId } });
  if (!row) return null;
  return experienceContract(row);
}

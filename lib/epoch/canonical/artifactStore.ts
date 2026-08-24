import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../storage/prismaClient";
import { assertTenantScope } from "./contracts";
import { enqueueEpochOutboxEvent } from "../v13/outboxService";

export type CanonicalArtifactInput = {
  workspaceId: string;
  objectType: string;
  objectId: string;
  missionId?: string;
  parentId?: string;
  version?: number;
  state?: string;
  payload: Record<string, unknown>;
  provenance?: Record<string, unknown>;
  correlationId: string;
  traceId: string;
  causationId?: string;
  idempotencyKey?: string;
};

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function persistCanonicalArtifact(input: CanonicalArtifactInput) {
  if (!input.workspaceId || !input.objectType || !input.objectId) throw new Error("CANONICAL_ARTIFACT_IDENTITY_REQUIRED");
  const version = input.version ?? 1;
  const payload = input.payload;
  const provenance = input.provenance ?? {};
  const integritySha256 = digest({
    workspaceId: input.workspaceId,
    objectType: input.objectType,
    objectId: input.objectId,
    version,
    payload,
    provenance,
  });
  return prisma.$transaction(async (tx) => {
    const artifact = await tx.epochCanonicalArtifact.upsert({
      where: { workspaceId_objectType_objectId_version: { workspaceId: input.workspaceId, objectType: input.objectType, objectId: input.objectId, version } },
      create: {
        id: `${input.objectType.toLowerCase()}_${input.objectId}_v${version}`, workspaceId: input.workspaceId, objectType: input.objectType, objectId: input.objectId,
        missionId: input.missionId, parentId: input.parentId, version, state: input.state ?? "active", payload: payload as Prisma.InputJsonValue, provenance: provenance as Prisma.InputJsonValue,
        integritySha256, correlationId: input.correlationId, traceId: input.traceId, causationId: input.causationId, idempotencyKey: input.idempotencyKey,
      },
      update: { state: input.state ?? "active", payload: payload as Prisma.InputJsonValue, provenance: provenance as Prisma.InputJsonValue, integritySha256, correlationId: input.correlationId, traceId: input.traceId, causationId: input.causationId, idempotencyKey: input.idempotencyKey },
    });
    await enqueueEpochOutboxEvent({
      workspaceId: input.workspaceId, aggregateType: input.objectType, aggregateId: input.objectId, eventType: "canonical.artifact.upserted",
      idempotencyKey: `canonical-artifact:${input.workspaceId}:${input.objectType}:${input.objectId}:v${version}:${integritySha256}`,
      payload: { artifactId: artifact.id, workspaceId: input.workspaceId, objectType: input.objectType, objectId: input.objectId, missionId: input.missionId ?? null, version, state: artifact.state, integritySha256, correlationId: input.correlationId, traceId: input.traceId },
    }, tx);
    return artifact;
  });
}

export async function getCanonicalArtifact(workspaceId: string, objectType: string, objectId: string, version?: number) {
  const row = await prisma.epochCanonicalArtifact.findFirst({
    where: {
      workspaceId,
      objectType,
      objectId,
      ...(version === undefined ? {} : { version }),
    },
    orderBy: { version: "desc" },
  });
  if (row) assertTenantScope(row, workspaceId);
  return row;
}

export async function listCanonicalArtifacts(input: { workspaceId: string; objectType?: string; missionId?: string; limit?: number }) {
  const rows = await prisma.epochCanonicalArtifact.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.objectType ? { objectType: input.objectType } : {}),
      ...(input.missionId ? { missionId: input.missionId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: Math.max(1, Math.min(input.limit ?? 100, 500)),
  });
  rows.forEach((row) => assertTenantScope(row, input.workspaceId));
  return rows;
}

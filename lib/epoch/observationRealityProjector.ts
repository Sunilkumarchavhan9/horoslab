import { prisma } from "../storage/prismaClient";
import { persistEpochRealityGraph } from "./epochRealityStore";

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function explicitGraph(value: unknown) {
  const payload = record(value);
  const entities = Array.isArray(payload.entities) ? payload.entities.filter((item) => item && typeof item === "object") as RecordValue[] : [];
  const relationships = Array.isArray(payload.relationships) ? payload.relationships.filter((item) => item && typeof item === "object") as RecordValue[] : [];
  if (!entities.length && !relationships.length) return null;
  return {
    entities: entities.map((entity) => ({
      canonicalKey: String(entity.canonicalKey ?? entity.key ?? ""),
      entityType: String(entity.entityType ?? entity.type ?? "unknown"),
      name: String(entity.name ?? entity.canonicalKey ?? entity.key ?? "unknown"),
      attributes: record(entity.attributes),
      confidence: typeof entity.confidence === "number" ? entity.confidence : undefined,
      provenance: { ...(record(entity.provenance)), observation: "structured_observation" },
      status: typeof entity.status === "string" ? entity.status : undefined,
      validFrom: typeof entity.validFrom === "string" ? entity.validFrom : undefined,
      validUntil: typeof entity.validUntil === "string" ? entity.validUntil : undefined,
      observedAt: typeof entity.observedAt === "string" ? entity.observedAt : undefined,
    })),
    relationships: relationships.map((relationship) => ({
      fromCanonicalKey: String(relationship.fromCanonicalKey ?? relationship.from ?? ""),
      toCanonicalKey: String(relationship.toCanonicalKey ?? relationship.to ?? ""),
      relationType: String(relationship.relationType ?? relationship.type ?? "related_to"),
      attributes: record(relationship.attributes),
      confidence: typeof relationship.confidence === "number" ? relationship.confidence : undefined,
      provenance: { ...(record(relationship.provenance)), observation: "structured_observation" },
      status: typeof relationship.status === "string" ? relationship.status : undefined,
      validFrom: typeof relationship.validFrom === "string" ? relationship.validFrom : undefined,
      validUntil: typeof relationship.validUntil === "string" ? relationship.validUntil : undefined,
      observedAt: typeof relationship.observedAt === "string" ? relationship.observedAt : undefined,
    })),
  };
}

export async function projectEpochObservationsToReality(input: { workspaceId: string; missionId?: string; limit?: number }) {
  const observations = await prisma.epochObservation.findMany({
    where: { workspaceId: input.workspaceId, ...(input.missionId ? { missionId: input.missionId } : {}) },
    orderBy: { observedAt: "asc" },
    take: Math.min(Math.max(input.limit ?? 100, 1), 500),
  });
  let projected = 0;
  let skipped = 0;
  const projectionIds: string[] = [];
  for (const observation of observations) {
    const alreadyProjected = await prisma.epochRealityEntity.findFirst({ where: { sourceObservationId: observation.id }, select: { id: true } });
    if (alreadyProjected) { skipped += 1; continue; }
    const graph = explicitGraph(observation.value);
    if (!graph) { skipped += 1; continue; }
    await persistEpochRealityGraph({ workspaceId: input.workspaceId, missionId: observation.missionId ?? input.missionId, sourceObservationId: observation.id, graph });
    projected += 1;
    projectionIds.push(observation.id);
  }
  return { version: "epoch_observation_reality_projection.v1" as const, checked: observations.length, projected, skipped, observationIds: projectionIds };
}

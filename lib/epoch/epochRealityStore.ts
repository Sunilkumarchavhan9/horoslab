import { prisma } from "../storage/prismaClient";
import { normalizeEpochRealityGraph, type EpochRealityGraphInput } from "./realityGraph";

export async function persistEpochRealityGraph(input: {
  workspaceId: string;
  missionId?: string;
  sourceObservationId?: string;
  graph: EpochRealityGraphInput;
}) {
  const normalized = normalizeEpochRealityGraph(input.graph);
  return prisma.$transaction(async (tx) => {
    if (normalized.sourceInputId) {
      const source = await tx.epochInputEnvelope.findFirst({
        where: {
          id: normalized.sourceInputId,
          workspaceId: input.workspaceId,
          ...(input.missionId ? { missionId: input.missionId } : {}),
        },
        select: { id: true },
      });
      if (!source) throw new Error("epoch_reality_source_input_not_found");
    }
    const entities = new Map<string, { id: string }>();
    for (const entity of normalized.entities) {
      const record = await tx.epochRealityEntity.create({
        data: {
          workspaceId: input.workspaceId,
          missionId: input.missionId,
          sourceInputId: normalized.sourceInputId,
          sourceObservationId: input.sourceObservationId,
          canonicalKey: entity.canonicalKey,
          entityType: entity.entityType,
          name: entity.name,
          attributes: entity.attributes as any,
          confidence: entity.confidence,
          provenance: entity.provenance as any,
          status: entity.status,
          validFrom: entity.validFrom,
          validUntil: entity.validUntil,
          observedAt: entity.observedAt,
          integritySha256: entity.integritySha256,
        },
        select: { id: true },
      });
      entities.set(entity.canonicalKey, record);
    }
    const relationships = [];
    for (const relationship of normalized.relationships) {
      const record = await tx.epochRealityRelationship.create({
        data: {
          workspaceId: input.workspaceId,
          missionId: input.missionId,
          sourceInputId: normalized.sourceInputId,
          sourceObservationId: input.sourceObservationId,
          fromEntityId: entities.get(relationship.fromCanonicalKey)!.id,
          toEntityId: entities.get(relationship.toCanonicalKey)!.id,
          relationType: relationship.relationType,
          attributes: relationship.attributes as any,
          confidence: relationship.confidence,
          provenance: relationship.provenance as any,
          status: relationship.status,
          validFrom: relationship.validFrom,
          validUntil: relationship.validUntil,
          observedAt: relationship.observedAt,
          integritySha256: relationship.integritySha256,
        },
        include: { fromEntity: true, toEntity: true },
      });
      relationships.push(record);
    }
    return { entities: [...entities.entries()].map(([canonicalKey, value]) => ({ canonicalKey, id: value.id })), relationships, observedAt: normalized.observedAt };
  });
}

export async function listEpochRealityGraph(input: { workspaceId: string; missionId?: string; limit?: number }) {
  const where = { workspaceId: input.workspaceId, ...(input.missionId ? { missionId: input.missionId } : {}) };
  const [entities, relationships] = await Promise.all([
    prisma.epochRealityEntity.findMany({ where, orderBy: { observedAt: "asc" }, take: input.limit ?? 500 }),
    prisma.epochRealityRelationship.findMany({ where, include: { fromEntity: true, toEntity: true }, orderBy: { observedAt: "asc" }, take: input.limit ?? 500 }),
  ]);
  return { entities, relationships };
}

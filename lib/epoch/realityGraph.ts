import { createHash } from "node:crypto";

export type EpochRealityEntityInput = {
  canonicalKey: string;
  entityType: string;
  name: string;
  attributes?: Record<string, unknown>;
  confidence?: number;
  provenance?: Record<string, unknown>;
  status?: string;
  validFrom?: string;
  validUntil?: string;
  observedAt?: string;
};

export type EpochRealityRelationshipInput = {
  fromCanonicalKey: string;
  toCanonicalKey: string;
  relationType: string;
  attributes?: Record<string, unknown>;
  confidence?: number;
  provenance?: Record<string, unknown>;
  status?: string;
  validFrom?: string;
  validUntil?: string;
  observedAt?: string;
};

export type EpochRealityGraphInput = {
  entities: EpochRealityEntityInput[];
  relationships?: EpochRealityRelationshipInput[];
  sourceInputId?: string;
  observedAt?: string;
};

export function epochRealityIntegritySha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function timestamp(value: string | undefined, fallback: string): Date {
  const result = new Date(value ?? fallback);
  if (Number.isNaN(result.getTime())) throw new Error("epoch_reality_invalid_timestamp");
  return result;
}

function confidence(value: number | undefined): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value! : 0.5));
}

export function normalizeEpochRealityGraph(input: EpochRealityGraphInput, now = new Date()) {
  const observedAt = timestamp(input.observedAt, now.toISOString());
  const entities = input.entities.map((entity) => {
    const normalized = {
      canonicalKey: entity.canonicalKey.trim(),
      entityType: entity.entityType.trim(),
      name: entity.name.trim(),
      attributes: entity.attributes ?? {},
      confidence: confidence(entity.confidence),
      provenance: entity.provenance ?? {},
      status: entity.status?.trim() || "active",
      validFrom: timestamp(entity.validFrom, observedAt.toISOString()),
      validUntil: entity.validUntil ? timestamp(entity.validUntil, observedAt.toISOString()) : null,
      observedAt: timestamp(entity.observedAt, observedAt.toISOString()),
    };
    if (!normalized.canonicalKey || !normalized.entityType || !normalized.name) throw new Error("epoch_reality_entity_identity_required");
    return { ...normalized, integritySha256: epochRealityIntegritySha256(normalized) };
  });
  const keys = new Set(entities.map((entity) => entity.canonicalKey));
  const relationships = (input.relationships ?? []).map((relationship) => {
    const normalized = {
      fromCanonicalKey: relationship.fromCanonicalKey.trim(),
      toCanonicalKey: relationship.toCanonicalKey.trim(),
      relationType: relationship.relationType.trim(),
      attributes: relationship.attributes ?? {},
      confidence: confidence(relationship.confidence),
      provenance: relationship.provenance ?? {},
      status: relationship.status?.trim() || "active",
      validFrom: timestamp(relationship.validFrom, observedAt.toISOString()),
      validUntil: relationship.validUntil ? timestamp(relationship.validUntil, observedAt.toISOString()) : null,
      observedAt: timestamp(relationship.observedAt, observedAt.toISOString()),
    };
    if (!normalized.fromCanonicalKey || !normalized.toCanonicalKey || !normalized.relationType) throw new Error("epoch_reality_relationship_identity_required");
    if (!keys.has(normalized.fromCanonicalKey) || !keys.has(normalized.toCanonicalKey)) throw new Error("epoch_reality_relationship_entity_missing");
    return { ...normalized, integritySha256: epochRealityIntegritySha256(normalized) };
  });
  return { entities, relationships, observedAt, sourceInputId: input.sourceInputId };
}

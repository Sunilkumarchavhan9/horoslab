import { prisma } from "../storage/prismaClient";

type Candidate = { id: string; confidence: number; observedAt: Date; status: string; conflictStatus: string };

function score(candidate: Candidate, now: number, staleAfterMs: number): number {
  const freshness = Math.max(0, 1 - Math.max(0, now - candidate.observedAt.getTime()) / staleAfterMs);
  return candidate.confidence * (0.5 + freshness / 2);
}

function choose<T extends Candidate>(candidates: T[], now: number, staleAfterMs: number): T {
  return [...candidates].sort((left, right) => score(right, now, staleAfterMs) - score(left, now, staleAfterMs) || right.observedAt.getTime() - left.observedAt.getTime() || right.id.localeCompare(left.id))[0];
}

export type EpochRealityMaintenanceTick = {
  version: "epoch_reality_maintenance_tick.v1";
  checkedEntities: number;
  checkedRelationships: number;
  markedStale: number;
  conflictsResolved: number;
  refreshRequests: Array<{ kind: "entity" | "relationship"; id: string; workspaceId: string; sourceInputId: string | null; reason: string }>;
  checkedAt: string;
};

export async function runEpochRealityMaintenanceTick(input: { workspaceId?: string; staleAfterMs?: number; limit?: number; now?: Date } = {}): Promise<EpochRealityMaintenanceTick> {
  const now = input.now ?? new Date();
  const staleAfterMs = Math.max(1_000, input.staleAfterMs ?? 15 * 60 * 1000);
  const cutoff = new Date(now.getTime() - staleAfterMs);
  const take = Math.min(Math.max(input.limit ?? 500, 1), 2_000);
  const scope = input.workspaceId ? { workspaceId: input.workspaceId } : {};
  const [entities, relationships] = await Promise.all([
    prisma.epochRealityEntity.findMany({ where: { ...scope, status: { not: "superseded" } }, orderBy: { observedAt: "asc" }, take }),
    prisma.epochRealityRelationship.findMany({ where: { ...scope, status: { not: "superseded" } }, orderBy: { observedAt: "asc" }, take }),
  ]);
  const refreshRequests: EpochRealityMaintenanceTick["refreshRequests"] = [];
  const staleEntityIds = entities.filter((record) => record.status === "active" && (record.observedAt < cutoff || (record.refreshAfter && record.refreshAfter <= now))).map((record) => record.id);
  const staleRelationshipIds = relationships.filter((record) => record.status === "active" && (record.observedAt < cutoff || (record.refreshAfter && record.refreshAfter <= now))).map((record) => record.id);
  if (staleEntityIds.length) await prisma.epochRealityEntity.updateMany({ where: { id: { in: staleEntityIds } }, data: { status: "stale" } });
  if (staleRelationshipIds.length) await prisma.epochRealityRelationship.updateMany({ where: { id: { in: staleRelationshipIds } }, data: { status: "stale" } });
  for (const record of entities.filter((item) => item.status !== "superseded")) refreshRequests.push(...((staleEntityIds.includes(record.id) || record.confidence < 0.5) ? [{ kind: "entity" as const, id: record.id, workspaceId: record.workspaceId, sourceInputId: record.sourceInputId, reason: staleEntityIds.includes(record.id) ? "stale" : "low_confidence" }] : []));
  for (const record of relationships.filter((item) => item.status !== "superseded")) refreshRequests.push(...((staleRelationshipIds.includes(record.id) || record.confidence < 0.5) ? [{ kind: "relationship" as const, id: record.id, workspaceId: record.workspaceId, sourceInputId: record.sourceInputId, reason: staleRelationshipIds.includes(record.id) ? "stale" : "low_confidence" }] : []));

  const entityGroups = new Map<string, typeof entities>();
  for (const record of entities) entityGroups.set(`${record.workspaceId}:${record.canonicalKey}`, [...(entityGroups.get(`${record.workspaceId}:${record.canonicalKey}`) ?? []), record]);
  const relationshipGroups = new Map<string, typeof relationships>();
  for (const record of relationships) relationshipGroups.set(`${record.workspaceId}:${record.fromEntityId}:${record.toEntityId}:${record.relationType}`, [...(relationshipGroups.get(`${record.workspaceId}:${record.fromEntityId}:${record.toEntityId}:${record.relationType}`) ?? []), record]);
  let conflictsResolved = 0;
  await prisma.$transaction(async (tx) => {
    for (const group of entityGroups.values()) {
      if (group.length < 2) continue;
      const selected = choose(group, now.getTime(), staleAfterMs);
      const losers = group.filter((record) => record.id !== selected.id);
      await tx.epochRealityEntity.update({ where: { id: selected.id }, data: { conflictStatus: "resolved", status: selected.status === "stale" ? "stale" : "active" } });
      await tx.epochRealityEntity.updateMany({ where: { id: { in: losers.map((record) => record.id) } }, data: { conflictStatus: "superseded", status: "superseded" } });
      conflictsResolved += losers.length;
    }
    for (const group of relationshipGroups.values()) {
      if (group.length < 2) continue;
      const selected = choose(group, now.getTime(), staleAfterMs);
      const losers = group.filter((record) => record.id !== selected.id);
      await tx.epochRealityRelationship.update({ where: { id: selected.id }, data: { conflictStatus: "resolved", status: selected.status === "stale" ? "stale" : "active" } });
      await tx.epochRealityRelationship.updateMany({ where: { id: { in: losers.map((record) => record.id) } }, data: { conflictStatus: "superseded", status: "superseded" } });
      conflictsResolved += losers.length;
    }
  });
  return { version: "epoch_reality_maintenance_tick.v1", checkedEntities: entities.length, checkedRelationships: relationships.length, markedStale: staleEntityIds.length + staleRelationshipIds.length, conflictsResolved, refreshRequests, checkedAt: now.toISOString() };
}

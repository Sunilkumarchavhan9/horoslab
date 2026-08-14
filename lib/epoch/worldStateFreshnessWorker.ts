import { prisma } from "../storage/prismaClient";

export type EpochWorldStateFreshnessTick = {
  version: "epoch_world_state_freshness_tick.v1";
  checked: number;
  markedStale: number;
  refreshRequests: Array<{ worldStateId: string; workspaceId: string; projectId: string; environmentId: string; observedAt: string }>;
  checkedAt: string;
};

/**
 * Marks persisted world snapshots stale without deleting them. Discovery workers
 * can consume refreshRequests and create a newer immutable snapshot.
 */
export async function runEpochWorldStateFreshnessTick(input: { staleAfterMs?: number; limit?: number; now?: Date } = {}): Promise<EpochWorldStateFreshnessTick> {
  const now = input.now ?? new Date();
  const staleAfterMs = input.staleAfterMs ?? 15 * 60 * 1000;
  const cutoff = new Date(now.getTime() - staleAfterMs);
  const records = await prisma.epochWorldState.findMany({
    where: { observedAt: { lt: cutoff }, freshness: { not: "stale" } },
    orderBy: { observedAt: "asc" },
    take: Math.min(Math.max(input.limit ?? 100, 1), 1000),
    select: { id: true, workspaceId: true, projectId: true, environmentId: true, observedAt: true },
  });
  if (records.length) {
    await prisma.epochWorldState.updateMany({ where: { id: { in: records.map((record) => record.id) } }, data: { freshness: "stale" } });
  }
  return {
    version: "epoch_world_state_freshness_tick.v1",
    checked: records.length,
    markedStale: records.length,
    refreshRequests: records.map((record) => ({ worldStateId: record.id, workspaceId: record.workspaceId, projectId: record.projectId, environmentId: record.environmentId, observedAt: record.observedAt.toISOString() })),
    checkedAt: now.toISOString(),
  };
}

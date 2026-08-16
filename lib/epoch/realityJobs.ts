import { enqueueEpochJob, type EpochQueueJob } from "./epochQueue";

export function enqueueEpochRealityProjection(input: { workspaceId: string; missionId?: string; limit?: number }): Promise<EpochQueueJob> {
  return enqueueEpochJob({ workspaceId: input.workspaceId, missionId: input.missionId, type: "reality_projection", payload: { limit: input.limit ?? 100 } });
}

export function enqueueEpochRealityMaintenance(input: { workspaceId: string; missionId?: string; staleAfterMs?: number; limit?: number }): Promise<EpochQueueJob> {
  return enqueueEpochJob({ workspaceId: input.workspaceId, missionId: input.missionId, type: "reality_maintenance", payload: { staleAfterMs: input.staleAfterMs, limit: input.limit ?? 500 } });
}

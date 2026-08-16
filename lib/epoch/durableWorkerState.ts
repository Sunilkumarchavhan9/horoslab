import { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";
import { emitEpochRuntimeEvent } from "./epochEvents";

export type EpochWorkerCheckpoint = {
  version: number;
  stage: string;
  status: "started" | "running" | "completed" | "failed" | "retrying";
  progress?: number;
  data?: Record<string, unknown>;
  recordedAt: string;
};

export function nextEpochWorkerCheckpoint(previous: unknown, input: Omit<EpochWorkerCheckpoint, "version" | "recordedAt">): EpochWorkerCheckpoint {
  const prior = previous && typeof previous === "object" ? previous as Record<string, unknown> : {};
  const version = Number.isInteger(prior.version) ? Number(prior.version) + 1 : 1;
  return { ...input, version, recordedAt: new Date().toISOString() };
}

/** Persist a fencing-protected checkpoint in the canonical queue job payload. */
export async function persistEpochWorkerCheckpoint(input: {
  workspaceId: string;
  workerId: string;
  jobId: string;
  fencingToken: number;
  stage: string;
  status: EpochWorkerCheckpoint["status"];
  progress?: number;
  data?: Record<string, unknown>;
  userId?: string;
  orgId?: string;
}): Promise<{ accepted: boolean; checkpoint?: EpochWorkerCheckpoint }> {
  const job = await prisma.epochQueueJob.findFirst({ where: { id: input.jobId, workspaceId: input.workspaceId, status: "leased", leaseOwner: { not: null } } });
  if (!job) return { accepted: false };
  const lease = await prisma.epochWorkerLease.findFirst({ where: { workspaceId: input.workspaceId, workerId: input.workerId, jobId: input.jobId, fencingToken: input.fencingToken, status: "active" } });
  if (!lease) return { accepted: false };
  const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload) ? job.payload as Record<string, unknown> : {};
  const checkpoint = nextEpochWorkerCheckpoint(payload.workerCheckpoint, { stage: input.stage, status: input.status, progress: input.progress, data: input.data });
  const updated = await prisma.epochQueueJob.updateMany({
    where: { id: input.jobId, workspaceId: input.workspaceId, status: "leased", leaseOwner: job.leaseOwner },
    data: { payload: { ...payload, workerCheckpoint: checkpoint } as Prisma.InputJsonValue },
  });
  if (updated.count !== 1) return { accepted: false };
  emitEpochRuntimeEvent({
    userId: input.userId ?? input.workspaceId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.queue.checkpointed",
    label: `Worker checkpoint ${input.stage}`,
    subjectId: input.jobId,
    payload: { jobId: input.jobId, workerId: input.workerId, fencingToken: input.fencingToken, checkpoint },
  });
  return { accepted: true, checkpoint };
}

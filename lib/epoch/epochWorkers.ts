import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";
import {
  leaseEpochJobs,
  releaseEpochJobLease,
  type EpochQueueJob,
} from "./epochQueue";

export const EPOCH_WORKER_STALE_AFTER_MS = 30_000;

type WorkerStatus = "available" | "busy" | "draining" | "offline" | "blocked" | "retired";

function isStale(lastHeartbeat: Date): boolean {
  return Date.now() - lastHeartbeat.getTime() > EPOCH_WORKER_STALE_AFTER_MS;
}

function normalizedStatus(worker: { status: string; lastHeartbeat: Date; retiredAt: Date | null }): WorkerStatus {
  if (worker.retiredAt || worker.status === "retired") return "retired";
  if (isStale(worker.lastHeartbeat)) return "offline";
  return worker.status as WorkerStatus;
}

export async function registerEpochWorker(input: {
  workspaceId: string; userId: string; orgId?: string; kind: string; name: string;
  protocolVersion: string; capabilities: string[]; projectScope: Record<string, unknown>;
  maxConcurrency: number; metadata: Record<string, unknown>;
}) {
  return prisma.epochWorker.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      orgId: input.orgId,
      kind: input.kind,
      name: input.name,
      protocolVersion: input.protocolVersion,
      capabilities: input.capabilities as Prisma.InputJsonValue,
      projectScope: input.projectScope as Prisma.InputJsonValue,
      maxConcurrency: input.maxConcurrency,
      metadata: input.metadata as Prisma.InputJsonValue,
      status: "available",
      lastHeartbeat: new Date(),
      history: [{ id: randomUUID(), type: "registered", at: new Date().toISOString() }],
    },
  });
}

export async function listEpochWorkers(workspaceId: string) {
  const workers = await prisma.epochWorker.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" } });
  return workers.map((worker) => ({ ...worker, status: normalizedStatus(worker) }));
}

export async function getEpochWorker(workspaceId: string, workerId: string) {
  const worker = await prisma.epochWorker.findFirst({ where: { workspaceId, id: workerId }, include: { leases: { orderBy: { createdAt: "desc" }, take: 50 } } });
  return worker ? { ...worker, status: normalizedStatus(worker) } : null;
}

export async function heartbeatEpochWorker(input: { workspaceId: string; workerId: string; status?: WorkerStatus; activeLeases?: number }) {
  const worker = await prisma.epochWorker.findFirst({ where: { workspaceId: input.workspaceId, id: input.workerId } });
  if (!worker || worker.retiredAt || worker.status === "retired") return null;
  const status = input.status === "draining" || input.status === "blocked" ? input.status : input.status ?? worker.status;
  return prisma.epochWorker.update({
    where: { id: worker.id },
    data: {
      status,
      activeLeases: input.activeLeases ?? worker.activeLeases,
      lastHeartbeat: new Date(),
      history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "heartbeat", at: new Date().toISOString(), status }],
    },
  });
}

export async function updateEpochWorker(input: { workspaceId: string; workerId: string; status?: WorkerStatus; capabilities?: string[]; projectScope?: Record<string, unknown>; maxConcurrency?: number; metadata?: Record<string, unknown> }) {
  const worker = await prisma.epochWorker.findFirst({ where: { workspaceId: input.workspaceId, id: input.workerId } });
  if (!worker || worker.retiredAt || worker.status === "retired") return null;
  const nextStatus = input.status === "retired" ? "retired" : input.status;
  return prisma.epochWorker.update({
    where: { id: worker.id },
    data: {
      status: nextStatus,
      capabilities: input.capabilities as Prisma.InputJsonValue,
      projectScope: input.projectScope as Prisma.InputJsonValue,
      maxConcurrency: input.maxConcurrency,
      metadata: input.metadata as Prisma.InputJsonValue,
      retiredAt: nextStatus === "retired" ? new Date() : undefined,
      history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: nextStatus === "retired" ? "retired" : "updated", at: new Date().toISOString() }],
    },
  });
}

export function isEpochWorkerStale(lastHeartbeat: Date): boolean {
  return isStale(lastHeartbeat);
}

function workerCapabilities(worker: { capabilities: unknown }): string[] {
  return Array.isArray(worker.capabilities)
    ? worker.capabilities.filter((value): value is string => typeof value === "string")
    : [];
}

function requiredCapabilities(job: EpochQueueJob): string[] {
  const value = job.payload?.requiredCapabilities;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function workerCanRunEpochJob(worker: { capabilities: unknown }, job: EpochQueueJob): boolean {
  const required = requiredCapabilities(job);
  if (required.length === 0) return true;
  const available = new Set(workerCapabilities(worker));
  return required.every((capability) => available.has(capability));
}

export async function leaseEpochJobsForWorker(input: {
  workspaceId: string;
  workerId: string;
  userId?: string;
  orgId?: string;
  limit?: number;
  leaseMs?: number;
  missionId?: string;
}): Promise<{ jobs: EpochQueueJob[]; fencingTokens: Record<string, number>; reason?: string }> {
  const worker = await prisma.epochWorker.findFirst({ where: { workspaceId: input.workspaceId, id: input.workerId } });
  if (!worker) return { jobs: [], fencingTokens: {}, reason: "worker_not_found" };
  const status = normalizedStatus(worker);
  if (status === "retired" || status === "offline") return { jobs: [], fencingTokens: {}, reason: `worker_${status}` };
  if (status === "draining" || status === "blocked") return { jobs: [], fencingTokens: {}, reason: `worker_${status}` };

  const activeLeases = await prisma.epochWorkerLease.count({
    where: { workerId: worker.id, status: "active", expiresAt: { gt: new Date() } },
  });
  const capacity = Math.max(0, worker.maxConcurrency - activeLeases);
  if (capacity === 0) return { jobs: [], fencingTokens: {}, reason: "worker_capacity_exhausted" };

  const candidates = await leaseEpochJobs({
    workspaceId: input.workspaceId,
    workerId: input.workerId,
    userId: input.userId,
    orgId: input.orgId,
    missionId: input.missionId,
    // Inspect extra candidates so an incompatible head-of-queue job does not
    // hide an eligible fallback worker job behind it.
    limit: Math.min(20, Math.max(input.limit ?? capacity, capacity * 5)),
  });
  const accepted: EpochQueueJob[] = [];
  const fencingTokens: Record<string, number> = {};
  for (const job of candidates) {
    if (!workerCanRunEpochJob(worker, job)) {
      await releaseEpochJobLease(job.id, "worker_capability_scope_mismatch");
      continue;
    }
    let lease: Awaited<ReturnType<typeof prisma.epochWorkerLease.create>> | null = null;
    try {
      lease = await prisma.$transaction(async (tx) => {
        const latest = await tx.epochWorker.findUnique({ where: { id: worker.id } });
        if (!latest || latest.retiredAt || latest.status === "draining" || latest.status === "blocked") return null;
        const latestActive = await tx.epochWorkerLease.count({ where: { workerId: worker.id, status: "active", expiresAt: { gt: new Date() } } });
        if (latestActive >= latest.maxConcurrency) return null;
        const previous = await tx.epochWorkerLease.findFirst({ where: { workerId: worker.id }, orderBy: { fencingToken: "desc" } });
        const fencingToken = (previous?.fencingToken ?? 0) + 1;
        const created = await tx.epochWorkerLease.create({
          data: {
            workspaceId: input.workspaceId,
            workerId: worker.id,
            jobId: job.id,
            fencingToken,
            expiresAt: new Date(Date.now() + Math.max(1_000, input.leaseMs ?? 60_000)),
          },
        });
        await tx.epochWorker.update({ where: { id: worker.id }, data: { activeLeases: latestActive + 1, status: "busy" } });
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      // Concurrent lease attempts must lose safely rather than over-allocate capacity.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034") throw error;
    }
    if (!lease) {
      await releaseEpochJobLease(job.id, "worker_capacity_changed");
      continue;
    }
    accepted.push(job);
    fencingTokens[job.id] = lease.fencingToken;
  }
  return { jobs: accepted, fencingTokens };
}

export async function completeEpochWorkerLease(input: {
  workspaceId: string;
  workerId: string;
  jobId: string;
  fencingToken: number;
}): Promise<{ accepted: boolean; idempotent: boolean; reason?: string }> {
  const lease = await prisma.epochWorkerLease.findFirst({
    where: { workspaceId: input.workspaceId, workerId: input.workerId, jobId: input.jobId },
  });
  if (!lease) return { accepted: false, idempotent: false, reason: "lease_not_found" };
  if (lease.fencingToken !== input.fencingToken) return { accepted: false, idempotent: false, reason: "stale_fencing_token" };
  if (lease.status !== "active") return { accepted: true, idempotent: true };

  await prisma.$transaction(async (tx) => {
    const updated = await tx.epochWorkerLease.updateMany({
      where: { id: lease.id, status: "active", fencingToken: input.fencingToken },
      data: { status: "completed", releasedAt: new Date() },
    });
    if (updated.count === 0) return;
    const worker = await tx.epochWorker.findUnique({ where: { id: input.workerId } });
    if (!worker) return;
    const active = await tx.epochWorkerLease.count({ where: { workerId: worker.id, status: "active", expiresAt: { gt: new Date() } } });
    await tx.epochWorker.update({
      where: { id: worker.id },
      data: { activeLeases: active, status: active > 0 ? "busy" : worker.status === "draining" ? "draining" : "available" },
    });
  });
  return { accepted: true, idempotent: false };
}

/** Ensure the process has a durable identity before it claims a job. */
export async function ensureEpochProcessWorker(input: {
  workspaceId: string;
  userId: string;
  orgId?: string;
  processId: string;
  capabilities?: string[];
  maxConcurrency?: number;
}) {
  const name = `epoch-process:${input.processId}`;
  const existing = await prisma.epochWorker.findFirst({ where: { workspaceId: input.workspaceId, name } });
  if (existing) {
    if (existing.retiredAt || existing.status === "retired") {
      return registerEpochWorker({
        workspaceId: input.workspaceId,
        userId: input.userId,
        orgId: input.orgId,
        kind: "software",
        name: `${name}:${randomUUID().slice(0, 8)}`,
        protocolVersion: "epoch.worker.v1",
        capabilities: input.capabilities ?? [],
        projectScope: {},
        maxConcurrency: input.maxConcurrency ?? 1,
        metadata: { source: "epoch-worker-process" },
      });
    }
    return existing;
  }
  return registerEpochWorker({
    workspaceId: input.workspaceId,
    userId: input.userId,
    orgId: input.orgId,
    kind: "software",
    name,
    protocolVersion: "epoch.worker.v1",
    capabilities: input.capabilities ?? [],
    projectScope: {},
    maxConcurrency: input.maxConcurrency ?? 1,
    metadata: { source: "epoch-worker-process" },
  });
}

/** Attach a durable, fenced worker lease to a job already leased from the queue. */
export async function claimEpochWorkerLease(input: {
  workspaceId: string;
  workerId: string;
  jobId: string;
  leaseMs?: number;
}): Promise<{ id: string; fencingToken: number; expiresAt: Date } | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const worker = await tx.epochWorker.findFirst({ where: { id: input.workerId, workspaceId: input.workspaceId } });
      if (!worker || worker.retiredAt || ["retired", "draining", "blocked", "offline"].includes(worker.status)) return null;
      const active = await tx.epochWorkerLease.count({ where: { workerId: worker.id, status: "active", expiresAt: { gt: new Date() } } });
      if (active >= worker.maxConcurrency) return null;
      const previous = await tx.epochWorkerLease.findFirst({ where: { workerId: worker.id }, orderBy: { fencingToken: "desc" } });
      const fencingToken = (previous?.fencingToken ?? 0) + 1;
      const lease = await tx.epochWorkerLease.create({
        data: {
          workspaceId: input.workspaceId,
          workerId: input.workerId,
          jobId: input.jobId,
          fencingToken,
          expiresAt: new Date(Date.now() + Math.max(1_000, input.leaseMs ?? 60_000)),
        },
      });
      await tx.epochWorker.update({ where: { id: worker.id }, data: { activeLeases: active + 1, status: "busy", lastHeartbeat: new Date() } });
      return { id: lease.id, fencingToken: lease.fencingToken, expiresAt: lease.expiresAt };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return null;
    throw error;
  }
}

export async function renewEpochWorkerLease(input: {
  workspaceId: string;
  workerId: string;
  jobId: string;
  fencingToken: number;
  leaseMs?: number;
}): Promise<boolean> {
  const updated = await prisma.epochWorkerLease.updateMany({
    where: { workspaceId: input.workspaceId, workerId: input.workerId, jobId: input.jobId, fencingToken: input.fencingToken, status: "active" },
    data: { expiresAt: new Date(Date.now() + Math.max(1_000, input.leaseMs ?? 60_000)) },
  });
  if (updated.count === 0) return false;
  await heartbeatEpochWorker({ workspaceId: input.workspaceId, workerId: input.workerId, status: "busy" });
  return true;
}

export async function releaseEpochWorkerLease(input: {
  workspaceId: string;
  workerId: string;
  jobId: string;
  fencingToken: number;
  status?: "completed" | "released" | "failed" | "expired";
}): Promise<boolean> {
  const status = input.status ?? "released";
  return prisma.$transaction(async (tx) => {
    const updated = await tx.epochWorkerLease.updateMany({
      where: { workspaceId: input.workspaceId, workerId: input.workerId, jobId: input.jobId, fencingToken: input.fencingToken, status: "active" },
      data: { status, releasedAt: new Date() },
    });
    if (updated.count === 0) return false;
    const active = await tx.epochWorkerLease.count({ where: { workerId: input.workerId, status: "active", expiresAt: { gt: new Date() } } });
    const worker = await tx.epochWorker.findUnique({ where: { id: input.workerId } });
    if (worker) await tx.epochWorker.update({ where: { id: worker.id }, data: { activeLeases: active, status: active > 0 ? "busy" : worker.status === "draining" ? "draining" : "available" } });
    return true;
  });
}

/** Requeue jobs whose process lease expired. SQS will redeliver after visibility expires. */
export async function recoverExpiredEpochWorkerLeases(workspaceId?: string): Promise<number> {
  const expired = await prisma.epochWorkerLease.findMany({ where: { ...(workspaceId ? { workspaceId } : {}), status: "active", expiresAt: { lte: new Date() } }, take: 100 });
  let recovered = 0;
  for (const lease of expired) {
    const changed = await prisma.$transaction(async (tx) => {
      const updated = await tx.epochWorkerLease.updateMany({ where: { id: lease.id, status: "active", fencingToken: lease.fencingToken }, data: { status: "expired", releasedAt: new Date() } });
      if (updated.count === 0) return false;
      await tx.epochQueueJob.updateMany({ where: { id: lease.jobId, workspaceId: lease.workspaceId, status: "leased", leaseOwner: { not: null } }, data: { status: "queued", leasedAt: null, leaseOwner: null, lastError: "worker_lease_expired" } });
      const active = await tx.epochWorkerLease.count({ where: { workerId: lease.workerId, status: "active", expiresAt: { gt: new Date() } } });
      const worker = await tx.epochWorker.findUnique({ where: { id: lease.workerId } });
      if (worker) await tx.epochWorker.update({ where: { id: worker.id }, data: { activeLeases: active, status: active > 0 ? "busy" : "available" } });
      return true;
    });
    if (changed) recovered += 1;
  }
  return recovered;
}

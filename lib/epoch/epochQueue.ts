import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { getRedisClient } from "../cache/redisClient";
import { prisma } from "../storage/prismaClient";
import { emitEpochRuntimeEvent } from "./epochEvents";

export type EpochQueueJobType = "plan" | "execute" | "review" | "verify" | "certificate" | "memory" | "benchmark" | "quality" | "pipeline" | "model_sync" | "model_benchmark" | "model_quality" | "runtime_benchmark" | "runtime_quality";

export type EpochQueueJobStatus = "queued" | "leased" | "done" | "failed" | "dead_lettered";

export type EpochQueueJob = {
  id: string;
  workspaceId: string;
  institutionId?: string;
  missionId?: string;
  type: EpochQueueJobType;
  payload?: Record<string, unknown>;
  status: EpochQueueJobStatus;
  createdAt: string;
  leasedAt?: string;
  leaseOwner?: string;
  error?: string;
  lastError?: string;
  retryCount?: number;
  maxRetries?: number;
  nextRetryAt?: string;
  lastFailedAt?: string;
  deadLetteredAt?: string;
  deadLetterReason?: string;
};

type RedisLikeClient = {
  lPush(key: string, value: string): Promise<number>;
  rPop(key: string): Promise<string | null>;
  hSet(key: string, field: string, value: string): Promise<number>;
  hGet(key: string, field: string): Promise<string | null>;
  hDel(key: string, field: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  lLen(key: string): Promise<number>;
};

const memoryQueues = new Map<string, EpochQueueJob[]>();
const memoryJobs = new Map<string, EpochQueueJob>();
const memoryDeadLetters = new Map<string, EpochQueueJob>();
const retryTimers = new Map<string, NodeJS.Timeout>();

function nowIso(): string {
  return new Date().toISOString();
}

function queueKey(workspaceId: string): string {
  return `memoryos:epoch:queue:${workspaceId}`;
}

function jobKey(jobId: string): string {
  return `memoryos:epoch:job:${jobId}`;
}

function deadKey(workspaceId: string, jobId: string): string {
  return `memoryos:epoch:dead:${workspaceId}:${jobId}`;
}

async function getRedis(): Promise<RedisLikeClient | null> {
  return (await getRedisClient()) as RedisLikeClient | null;
}

function cloneJob(job: EpochQueueJob): EpochQueueJob {
  return JSON.parse(JSON.stringify(job)) as EpochQueueJob;
}

type EpochQueueCursor = {
  createdAt: string;
  id: string;
};

function encodeEpochQueueCursor(cursor: EpochQueueCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeEpochQueueCursor(cursor: string | undefined): EpochQueueCursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { createdAt?: unknown }).createdAt === "string" &&
      typeof (parsed as { id?: unknown }).id === "string"
    ) {
      return {
        createdAt: (parsed as { createdAt: string }).createdAt,
        id: (parsed as { id: string }).id,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function sortEpochJobsDesc(jobs: EpochQueueJob[]): EpochQueueJob[] {
  return [...jobs].sort((a, b) => {
    const byCreatedAt = b.createdAt.localeCompare(a.createdAt);
    if (byCreatedAt !== 0) return byCreatedAt;
    return b.id.localeCompare(a.id);
  });
}

async function collectEpochQueueJobs(workspaceId: string): Promise<EpochQueueJob[]> {
  const redis = await getRedis();
  if (!redis) {
    const rows = await prisma.epochQueueJob.findMany({
      where: { workspaceId, status: { in: ["queued", "leased", "failed"] } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return rows.map(mapDatabaseJob);
  }

  const raw = await redis.keys(`memoryos:epoch:job:*`);
  const jobs: EpochQueueJob[] = [];
  for (const key of raw) {
    const payload = await redis.hGet(key, "payload");
    if (!payload) continue;
    try {
      const job = withRetryDefaults(JSON.parse(payload) as EpochQueueJob);
      if (job.workspaceId === workspaceId) jobs.push(job);
    } catch {
      // ignore malformed payloads
    }
  }
  return jobs;
}

function normalizeRetryCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function normalizeMaxRetries(value: unknown): number {
  const raw = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 3;
  return Math.max(0, Math.min(10, raw));
}

function withRetryDefaults(job: EpochQueueJob): EpochQueueJob {
  return {
    ...job,
    retryCount: normalizeRetryCount(job.retryCount),
    maxRetries: normalizeMaxRetries(job.maxRetries ?? 3),
  };
}

function mapDatabaseJob(row: {
  id: string;
  workspaceId: string;
  institutionId: string | null;
  missionId: string | null;
  type: string;
  payload: unknown;
  status: string;
  createdAt: Date;
  leasedAt: Date | null;
  leaseOwner: string | null;
  error: string | null;
  lastError: string | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  lastFailedAt: Date | null;
  deadLetteredAt: Date | null;
  deadLetterReason: string | null;
}): EpochQueueJob {
  return withRetryDefaults({
    id: row.id,
    workspaceId: row.workspaceId,
    institutionId: row.institutionId ?? undefined,
    missionId: row.missionId ?? undefined,
    type: row.type as EpochQueueJobType,
    payload: row.payload as Record<string, unknown>,
    status: row.status as EpochQueueJobStatus,
    createdAt: row.createdAt.toISOString(),
    leasedAt: row.leasedAt?.toISOString(),
    leaseOwner: row.leaseOwner ?? undefined,
    error: row.error ?? undefined,
    lastError: row.lastError ?? undefined,
    retryCount: row.retryCount,
    maxRetries: row.maxRetries,
    nextRetryAt: row.nextRetryAt?.toISOString(),
    lastFailedAt: row.lastFailedAt?.toISOString(),
    deadLetteredAt: row.deadLetteredAt?.toISOString(),
    deadLetterReason: row.deadLetterReason ?? undefined,
  });
}

async function persistDatabaseJob(job: EpochQueueJob): Promise<EpochQueueJob> {
  const row = await prisma.epochQueueJob.upsert({
    where: { id: job.id },
    create: {
      id: job.id,
      workspaceId: job.workspaceId,
      institutionId: job.institutionId,
      missionId: job.missionId,
      type: job.type,
      payload: (job.payload ?? {}) as Prisma.InputJsonValue,
      status: job.status,
      createdAt: new Date(job.createdAt),
      leasedAt: job.leasedAt ? new Date(job.leasedAt) : null,
      leaseOwner: job.leaseOwner,
      error: job.error,
      lastError: job.lastError,
      retryCount: job.retryCount ?? 0,
      maxRetries: job.maxRetries ?? 3,
      nextRetryAt: job.nextRetryAt ? new Date(job.nextRetryAt) : null,
      lastFailedAt: job.lastFailedAt ? new Date(job.lastFailedAt) : null,
      deadLetteredAt: job.deadLetteredAt ? new Date(job.deadLetteredAt) : null,
      deadLetterReason: job.deadLetterReason,
    },
    update: {
      institutionId: job.institutionId,
      missionId: job.missionId,
      type: job.type,
      payload: (job.payload ?? {}) as Prisma.InputJsonValue,
      status: job.status,
      leasedAt: job.leasedAt ? new Date(job.leasedAt) : null,
      leaseOwner: job.leaseOwner ?? null,
      error: job.error ?? null,
      lastError: job.lastError ?? null,
      retryCount: job.retryCount ?? 0,
      maxRetries: job.maxRetries ?? 3,
      nextRetryAt: job.nextRetryAt ? new Date(job.nextRetryAt) : null,
      lastFailedAt: job.lastFailedAt ? new Date(job.lastFailedAt) : null,
      deadLetteredAt: job.deadLetteredAt ? new Date(job.deadLetteredAt) : null,
      deadLetterReason: job.deadLetterReason ?? null,
    },
  });
  return mapDatabaseJob(row);
}

async function persistActiveJob(job: EpochQueueJob): Promise<void> {
  await persistDatabaseJob(job);
  const normalized = withRetryDefaults(job);
  memoryJobs.set(normalized.id, cloneJob(normalized));
  const queue = memoryQueues.get(normalized.workspaceId) ?? [];
  const index = queue.findIndex((entry) => entry.id === normalized.id);
  if (index >= 0) {
    queue[index] = cloneJob(normalized);
  } else {
    queue.unshift(cloneJob(normalized));
  }
  memoryQueues.set(normalized.workspaceId, queue.slice(0, 500));
}

async function persistDeadLetterJob(job: EpochQueueJob): Promise<void> {
  const normalized = withRetryDefaults({
    ...job,
    status: "dead_lettered",
  });
  memoryDeadLetters.set(normalized.id, cloneJob(normalized));
  await persistDatabaseJob(normalized);
}

function scheduleRetryEnqueue(job: EpochQueueJob, delayMs: number): void {
  const existing = retryTimers.get(job.id);
  if (existing) clearTimeout(existing);
  const timeout = setTimeout(() => {
    retryTimers.delete(job.id);
    const payload = JSON.stringify({
      ...job,
      status: "queued",
      leasedAt: undefined,
      leaseOwner: undefined,
      nextRetryAt: undefined,
    });
    void (async () => {
      const redis = await getRedis();
      if (!redis) {
        await persistActiveJob({
          ...job,
          status: "queued",
          leasedAt: undefined,
          leaseOwner: undefined,
          nextRetryAt: undefined,
        });
        return;
      }
      await redis.lPush(queueKey(job.workspaceId), payload);
      await redis.hSet(jobKey(job.id), "payload", payload);
    })();
  }, delayMs);
  timeout.unref?.();
  retryTimers.set(job.id, timeout);
}

function retryDelayMs(retryCount: number): number {
  const base = Number(process.env.EPOCH_WORKER_RETRY_DELAY_MS);
  const initial = Number.isFinite(base) && base >= 250 ? Math.floor(base) : 1000;
  return Math.min(30_000, initial * Math.max(1, retryCount + 1));
}

export async function enqueueEpochJob(input: {
  workspaceId: string;
  userId?: string;
  orgId?: string;
  institutionId?: string;
  missionId?: string;
  type: EpochQueueJobType;
  payload?: Record<string, unknown>;
}): Promise<EpochQueueJob> {
  const job: EpochQueueJob = {
    id: `epoch_job_${randomUUID().slice(0, 12)}`,
    workspaceId: input.workspaceId,
    institutionId: input.institutionId,
    missionId: input.missionId,
    type: input.type,
    payload: input.payload,
    status: "queued",
    createdAt: nowIso(),
    retryCount: 0,
    maxRetries: 3,
  };

  const redis = await getRedis();
  if (!redis) {
    await persistActiveJob(job);
    emitEpochRuntimeEvent({
      userId: input.userId ?? input.workspaceId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: "epoch.queue.enqueued",
      label: `Queued ${input.type} job`,
      subjectId: job.id,
      payload: { jobId: job.id, type: input.type },
    });
    return job;
  }

  await redis.lPush(queueKey(input.workspaceId), JSON.stringify(job));
  await redis.hSet(jobKey(job.id), "payload", JSON.stringify(job));
  emitEpochRuntimeEvent({
    userId: input.userId ?? input.workspaceId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.queue.enqueued",
    label: `Queued ${input.type} job`,
    subjectId: job.id,
    payload: { jobId: job.id, type: input.type },
  });
  return job;
}

export async function leaseEpochJobs(input: {
  workspaceId: string;
  userId?: string;
  orgId?: string;
  workerId: string;
  missionId?: string;
  limit?: number;
}): Promise<EpochQueueJob[]> {
  const limit = Math.max(1, Math.min(20, Math.floor(input.limit ?? 5)));
  // Targeted leases must inspect durable storage so Redis cannot hand the
  // worker an unrelated job ahead of the requested mission.
  const redis = input.missionId ? null : await getRedis();
  if (!redis) {
    const now = new Date();
    const candidates = await prisma.epochQueueJob.findMany({
      where: {
        workspaceId: input.workspaceId,
        ...(input.missionId ? { missionId: input.missionId } : {}),
        status: "queued",
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    });
    const leased: EpochQueueJob[] = [];
    for (const candidate of candidates) {
      const updated = await prisma.epochQueueJob.updateMany({
        where: { id: candidate.id, status: "queued" },
        data: { status: "leased", leasedAt: now, leaseOwner: input.workerId },
      });
      if (updated.count !== 1) continue;
      leased.push(mapDatabaseJob({ ...candidate, status: "leased", leasedAt: now, leaseOwner: input.workerId }));
    }
    for (const job of leased) {
      memoryJobs.set(job.id, cloneJob(job));
    }
    if (leased.length > 0) {
      emitEpochRuntimeEvent({
        userId: input.userId ?? input.workspaceId,
        orgId: input.orgId,
        workspaceId: input.workspaceId,
        kind: "epoch.queue.leased",
        label: `Leased ${leased.length} job(s)`,
        subjectId: leased[0].id,
        payload: { jobIds: leased.map((job) => job.id), workerId: input.workerId },
      });
    }
    return leased;
  }

  const leased: EpochQueueJob[] = [];
  for (let i = 0; i < limit; i += 1) {
    const raw = await redis.rPop(queueKey(input.workspaceId));
    if (!raw) break;
    try {
      const parsed = withRetryDefaults(JSON.parse(raw) as EpochQueueJob);
      const job: EpochQueueJob = {
        ...parsed,
        status: "leased",
        leasedAt: nowIso(),
        leaseOwner: input.workerId,
      };
      leased.push(job);
      await redis.hSet(jobKey(job.id), "payload", JSON.stringify(job));
    } catch {
      // Skip malformed jobs and keep the queue moving.
    }
  }

  // Redis is an acceleration layer, not the source of truth. A process restart
  // or a Redis reconnect can leave the durable PostgreSQL queue ahead of Redis.
  // Recover queued jobs from Postgres when Redis produced no lease candidates.
  if (leased.length === 0) {
    const now = new Date();
    const candidates = await prisma.epochQueueJob.findMany({
      where: {
        workspaceId: input.workspaceId,
        ...(input.missionId ? { missionId: input.missionId } : {}),
        status: "queued",
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    });
    for (const candidate of candidates) {
      const updated = await prisma.epochQueueJob.updateMany({
        where: { id: candidate.id, status: "queued" },
        data: { status: "leased", leasedAt: now, leaseOwner: input.workerId },
      });
      if (updated.count !== 1) continue;
      leased.push(mapDatabaseJob({ ...candidate, status: "leased", leasedAt: now, leaseOwner: input.workerId }));
    }
    for (const job of leased) memoryJobs.set(job.id, cloneJob(job));
  }

  if (leased.length > 0) {
    emitEpochRuntimeEvent({
      userId: input.userId ?? input.workspaceId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: "epoch.queue.leased",
      label: `Leased ${leased.length} job(s)`,
      subjectId: leased[0].id,
      payload: { jobIds: leased.map((job) => job.id), workerId: input.workerId },
    });
  }
  return leased;
}

export async function releaseEpochJobLease(jobId: string, reason?: string): Promise<EpochQueueJob | null> {
  const redis = await getRedis();
  const current = await getEpochJobById(jobId);
  if (!current || current.status !== "leased") return current;
  const queued: EpochQueueJob = {
    ...current,
    status: "queued",
    leasedAt: undefined,
    leaseOwner: undefined,
    lastError: reason ?? current.lastError,
  };
  if (!redis) {
    await persistActiveJob(queued);
    return queued;
  }
  await redis.lPush(queueKey(queued.workspaceId), JSON.stringify(queued));
  await redis.hSet(jobKey(queued.id), "payload", JSON.stringify(queued));
  return queued;
}

export async function retryEpochJob(jobId: string, error: string, input?: {
  userId?: string;
  orgId?: string;
  delayMs?: number;
  payloadPatch?: Record<string, unknown>;
}): Promise<EpochQueueJob | null> {
  const redis = await getRedis();
  const delayMs = Math.max(250, Math.floor(input?.delayMs ?? 0) || 0);

  const currentJob = await getEpochJobById(jobId);
  if (!currentJob) return null;

  try {
    const parsed = withRetryDefaults(currentJob);
    const currentRetryCount = normalizeRetryCount(parsed.retryCount);
    const maxRetries = normalizeMaxRetries(parsed.maxRetries);
    const nextRetryCount = currentRetryCount + 1;
    const retryable = nextRetryCount <= maxRetries;
    if (!retryable) {
      return deadLetterEpochJob(jobId, error, input);
    }

    const queued: EpochQueueJob = {
      ...parsed,
      status: "queued",
      payload: { ...(parsed.payload ?? {}), ...(input?.payloadPatch ?? {}) },
      error,
      lastError: error,
      retryCount: nextRetryCount,
      lastFailedAt: nowIso(),
      nextRetryAt: delayMs > 0 ? new Date(Date.now() + delayMs).toISOString() : undefined,
      leasedAt: undefined,
      leaseOwner: undefined,
    };

    if (!redis) {
      await persistActiveJob(queued);
      scheduleRetryEnqueue(queued, delayMs || retryDelayMs(nextRetryCount));
    } else {
      await redis.hSet(jobKey(jobId), "payload", JSON.stringify(queued));
      scheduleRetryEnqueue(queued, delayMs || retryDelayMs(nextRetryCount));
    }

    emitEpochRuntimeEvent({
      userId: input?.userId ?? parsed.workspaceId,
      orgId: input?.orgId,
      workspaceId: parsed.workspaceId,
      kind: "epoch.queue.enqueued",
      label: "Queue job scheduled for retry",
      subjectId: jobId,
      payload: { jobId, error, retryCount: nextRetryCount, maxRetries, delayMs: delayMs || retryDelayMs(nextRetryCount) },
    });

    return queued;
  } catch {
    return null;
  }
}

export async function deferEpochJob(jobId: string, reason: string, input?: {
  userId?: string;
  orgId?: string;
  delayMs?: number;
}): Promise<EpochQueueJob | null> {
  const redis = await getRedis();
  const delayMs = Math.max(250, Math.floor(input?.delayMs ?? 0) || 0);

  const currentJob = await getEpochJobById(jobId);
  if (!currentJob) return null;

  try {
    const parsed = withRetryDefaults(currentJob);
    const deferred: EpochQueueJob = {
      ...parsed,
      status: "queued",
      error: reason,
      lastError: reason,
      lastFailedAt: nowIso(),
      nextRetryAt: delayMs > 0 ? new Date(Date.now() + delayMs).toISOString() : undefined,
      leasedAt: undefined,
      leaseOwner: undefined,
    };

    if (!redis) {
      await persistActiveJob(deferred);
      scheduleRetryEnqueue(deferred, delayMs || retryDelayMs(parsed.retryCount ?? 0));
    } else {
      await redis.hSet(jobKey(jobId), "payload", JSON.stringify(deferred));
      scheduleRetryEnqueue(deferred, delayMs || retryDelayMs(parsed.retryCount ?? 0));
    }

    emitEpochRuntimeEvent({
      userId: input?.userId ?? parsed.workspaceId,
      orgId: input?.orgId,
      workspaceId: parsed.workspaceId,
      kind: "epoch.queue.enqueued",
      label: "Queue job deferred",
      subjectId: jobId,
      payload: { jobId, reason, delayMs: delayMs || retryDelayMs(parsed.retryCount ?? 0) },
    });

    return deferred;
  } catch {
    return null;
  }
}

export async function deadLetterEpochJob(jobId: string, error: string, input?: {
  userId?: string;
  orgId?: string;
}): Promise<EpochQueueJob | null> {
  const redis = await getRedis();
  const current = await getEpochJobById(jobId);
  if (!current) return null;

  try {
    const parsed = withRetryDefaults(current);
    const dead: EpochQueueJob = {
      ...parsed,
      status: "dead_lettered",
      error,
      lastError: error,
      lastFailedAt: nowIso(),
      deadLetteredAt: nowIso(),
      deadLetterReason: error,
      leasedAt: undefined,
      leaseOwner: undefined,
    };

    if (!redis) {
      memoryJobs.delete(jobId);
      memoryQueues.set(
        dead.workspaceId,
        (memoryQueues.get(dead.workspaceId) ?? []).filter((job) => job.id !== jobId),
      );
      await persistDeadLetterJob(dead);
    } else {
      await redis.hSet(jobKey(jobId), "payload", JSON.stringify(dead));
      await redis.hSet(deadKey(dead.workspaceId, dead.id), "payload", JSON.stringify(dead));
    }

    emitEpochRuntimeEvent({
      userId: input?.userId ?? parsed.workspaceId,
      orgId: input?.orgId,
      workspaceId: parsed.workspaceId,
      kind: "epoch.queue.failed",
      label: "Queue job dead-lettered",
      subjectId: jobId,
      payload: { jobId, error, retryCount: parsed.retryCount, maxRetries: parsed.maxRetries },
    });

    return dead;
  } catch {
    return null;
  }
}

export async function acknowledgeEpochJob(jobId: string, userId?: string, orgId?: string): Promise<EpochQueueJob | null> {
  const redis = await getRedis();
  if (!redis) {
    const job = await getEpochJobById(jobId);
    if (!job) return null;
    const acked = { ...job, status: "done" as const };
    await persistDatabaseJob(acked);
    memoryJobs.set(jobId, acked);
    emitEpochRuntimeEvent({
      userId: userId ?? job.workspaceId,
      orgId,
      workspaceId: job.workspaceId,
      kind: "epoch.queue.acknowledged",
      label: "Queue job acknowledged",
      subjectId: jobId,
      payload: { jobId },
    });
    return acked;
  }

  const raw = await redis.hGet(jobKey(jobId), "payload");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EpochQueueJob;
    const acked = { ...parsed, status: "done" as const };
    await redis.hSet(jobKey(jobId), "payload", JSON.stringify(acked));
    emitEpochRuntimeEvent({
      userId: userId ?? parsed.workspaceId,
      orgId,
      workspaceId: parsed.workspaceId,
      kind: "epoch.queue.acknowledged",
      label: "Queue job acknowledged",
      subjectId: jobId,
      payload: { jobId },
    });
    return acked;
  } catch {
    return null;
  }
}

export async function failEpochJob(jobId: string, error: string, userId?: string, orgId?: string): Promise<EpochQueueJob | null> {
  const redis = await getRedis();
  if (!redis) {
    const job = await getEpochJobById(jobId);
    if (!job) return null;
    const failed = { ...job, status: "failed" as const, error };
    await persistDatabaseJob(failed);
    memoryJobs.set(jobId, failed);
    emitEpochRuntimeEvent({
      userId: userId ?? job.workspaceId,
      orgId,
      workspaceId: job.workspaceId,
      kind: "epoch.queue.failed",
      label: "Queue job failed",
      subjectId: jobId,
      payload: { jobId, error },
    });
    return failed;
  }

  const raw = await redis.hGet(jobKey(jobId), "payload");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EpochQueueJob;
    const failed = { ...parsed, status: "failed" as const, error };
    await redis.hSet(jobKey(jobId), "payload", JSON.stringify(failed));
    emitEpochRuntimeEvent({
      userId: userId ?? parsed.workspaceId,
      orgId,
      workspaceId: parsed.workspaceId,
      kind: "epoch.queue.failed",
      label: "Queue job failed",
      subjectId: jobId,
      payload: { jobId, error },
    });
    return failed;
  } catch {
    return null;
  }
}

export async function listEpochQueueJobs(workspaceId: string): Promise<EpochQueueJob[]> {
  const jobs = await collectEpochQueueJobs(workspaceId);
  return sortEpochJobsDesc(jobs);
}

export async function listEpochQueueJobsForMission(workspaceId: string, missionId: string): Promise<EpochQueueJob[]> {
  return (await listEpochQueueJobs(workspaceId)).filter((job) => job.missionId === missionId);
}

export async function hasEpochQueuedJob(workspaceId: string, missionId: string, type: EpochQueueJobType): Promise<boolean> {
  return (await listEpochQueueJobsForMission(workspaceId, missionId)).some((job) => job.type === type && job.status !== "dead_lettered" && job.status !== "done");
}

export async function listEpochQueueJobsPage(input: {
  workspaceId: string;
  status?: EpochQueueJobStatus;
  type?: EpochQueueJobType;
  limit?: number;
  cursor?: string;
}): Promise<{
  jobs: EpochQueueJob[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}> {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 20)));
  const jobs = sortEpochJobsDesc(await collectEpochQueueJobs(input.workspaceId)).filter((job) => {
    if (input.status && job.status !== input.status) return false;
    if (input.type && job.type !== input.type) return false;
    return true;
  });
  const cursor = decodeEpochQueueCursor(input.cursor);
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = jobs.findIndex((job) => job.createdAt === cursor.createdAt && job.id === cursor.id);
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    } else {
      // A job can be updated between pages (for example, dead-lettered and
      // requeued). If its exact serialized timestamp is no longer present,
      // continue from the first record strictly older than the cursor rather
      // than silently returning an empty page.
      const olderIndex = jobs.findIndex((job) =>
        job.createdAt < cursor.createdAt ||
        (job.createdAt === cursor.createdAt && job.id < cursor.id),
      );
      startIndex = olderIndex >= 0 ? olderIndex : jobs.length;
    }
  }

  const page = jobs.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < jobs.length;
  const nextCursor = hasMore && page.length > 0
    ? encodeEpochQueueCursor({ createdAt: page[page.length - 1].createdAt, id: page[page.length - 1].id })
    : null;

  return {
    jobs: page,
    nextCursor,
    hasMore,
    total: jobs.length,
  };
}

export async function listEpochDeadLetters(workspaceId: string): Promise<EpochQueueJob[]> {
  const redis = await getRedis();
  if (!redis) {
    const rows = await prisma.epochQueueJob.findMany({
      where: { workspaceId, status: "dead_lettered" },
      orderBy: [{ deadLetteredAt: "desc" }, { id: "desc" }],
    });
    return rows.map(mapDatabaseJob);
  }

  const raw = await redis.keys(`memoryos:epoch:dead:${workspaceId}:*`);
  const jobs: EpochQueueJob[] = [];
  for (const key of raw) {
    const payload = await redis.hGet(key, "payload");
    if (!payload) continue;
    try {
      jobs.push(withRetryDefaults(JSON.parse(payload) as EpochQueueJob));
    } catch {
      // ignore malformed payloads
    }
  }
  return jobs.sort((a, b) => a.deadLetteredAt?.localeCompare(b.deadLetteredAt ?? "") ?? 0);
}

export async function retryDeadLetterEpochJob(jobId: string, input?: { userId?: string; orgId?: string; delayMs?: number; reason?: string }): Promise<EpochQueueJob | null> {
  const dead = await getEpochJobById(jobId);
  if (!dead || dead.status !== "dead_lettered") return null;
  return retryEpochJob(jobId, input?.reason ?? dead.error ?? dead.deadLetterReason ?? "retrying_dead_letter", input);
}

export async function getEpochJobById(jobId: string): Promise<EpochQueueJob | null> {
  const redis = await getRedis();
  const raw = redis ? await redis.hGet(jobKey(jobId), "payload") : null;
  if (!redis) {
    const row = await prisma.epochQueueJob.findUnique({ where: { id: jobId } });
    return row ? mapDatabaseJob(row) : null;
  }
  if (!raw) return null;
  try {
    return withRetryDefaults(JSON.parse(raw) as EpochQueueJob);
  } catch {
    return null;
  }
}

export async function getEpochQueueJobForWorkspace(workspaceId: string, jobId: string): Promise<EpochQueueJob | null> {
  const job = await getEpochJobById(jobId);
  if (!job || job.workspaceId !== workspaceId) return null;
  return job;
}

export async function getEpochQueueStatus(workspaceId: string): Promise<{
  queued: number;
  leased: number;
  done: number;
  failed: number;
  deadLettered: number;
  byType: Record<EpochQueueJobType, number>;
  byStatus: Record<EpochQueueJobStatus, number>;
  deadLetterReasons: Array<{ jobId: string; reason: string; retryCount: number; maxRetries: number; deadLetteredAt: string | undefined }>;
}> {
  const jobs = await collectEpochQueueJobs(workspaceId);
  const deadLetters = await listEpochDeadLetters(workspaceId);
  const byType = {
    plan: jobs.filter((job) => job.type === "plan").length,
    execute: jobs.filter((job) => job.type === "execute").length,
    review: jobs.filter((job) => job.type === "review").length,
    verify: jobs.filter((job) => job.type === "verify").length,
    certificate: jobs.filter((job) => job.type === "certificate").length,
    memory: jobs.filter((job) => job.type === "memory").length,
    benchmark: jobs.filter((job) => job.type === "benchmark").length,
    quality: jobs.filter((job) => job.type === "quality").length,
    pipeline: jobs.filter((job) => job.type === "pipeline").length,
    model_sync: jobs.filter((job) => job.type === "model_sync").length,
    model_benchmark: jobs.filter((job) => job.type === "model_benchmark").length,
    model_quality: jobs.filter((job) => job.type === "model_quality").length,
    runtime_benchmark: jobs.filter((job) => job.type === "runtime_benchmark").length,
    runtime_quality: jobs.filter((job) => job.type === "runtime_quality").length,
  } satisfies Record<EpochQueueJobType, number>;
  const byStatus = {
    queued: jobs.filter((job) => job.status === "queued").length,
    leased: jobs.filter((job) => job.status === "leased").length,
    done: jobs.filter((job) => job.status === "done").length,
    failed: jobs.filter((job) => job.status === "failed").length,
    dead_lettered: deadLetters.length,
  } satisfies Record<EpochQueueJobStatus, number>;
  return {
    queued: byStatus.queued,
    leased: byStatus.leased,
    done: byStatus.done,
    failed: byStatus.failed,
    deadLettered: byStatus.dead_lettered,
    byType,
    byStatus,
    deadLetterReasons: deadLetters.slice(0, 10).map((job) => ({
      jobId: job.id,
      reason: job.deadLetterReason ?? job.lastError ?? job.error ?? "unknown",
      retryCount: job.retryCount ?? 0,
      maxRetries: job.maxRetries ?? 0,
      deadLetteredAt: job.deadLetteredAt,
    })),
  };
}

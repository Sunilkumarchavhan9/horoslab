import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

export type CompanyBrainJobType = "sync_all_sources" | "rebuild_graph" | "compile_skills";

export type CompanyBrainQueueJob = {
  id: string;
  userId: string;
  type: CompanyBrainJobType;
  status: "queued" | "leased" | "done" | "failed";
  createdAt: string;
  leasedAt?: string;
  leaseOwner?: string;
  error?: string;
};

export type QueueBackendMode = "postgres";

export interface QueueBackend {
  enqueue(userId: string, type: CompanyBrainJobType): Promise<CompanyBrainQueueJob>;
  lease(userId: string, workerId: string, limit: number): Promise<CompanyBrainQueueJob[]>;
  ack(jobId: string): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
}

const ACTIVE_QUEUE_STATUSES = ["queued", "leased"] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function jobFromRow(row: {
  id: string;
  userId: string;
  jobType: string;
  status: string;
  createdAt: string;
  dataJson: string;
}): CompanyBrainQueueJob {
  try {
    const parsed = JSON.parse(row.dataJson) as Partial<CompanyBrainQueueJob>;
    return {
      id: row.id,
      userId: row.userId,
      type: (parsed.type ?? row.jobType) as CompanyBrainJobType,
      status: (parsed.status ?? row.status) as CompanyBrainQueueJob["status"],
      createdAt: parsed.createdAt ?? row.createdAt,
      leasedAt: parsed.leasedAt,
      leaseOwner: parsed.leaseOwner,
      error: parsed.error,
    };
  } catch {
    return {
      id: row.id,
      userId: row.userId,
      type: row.jobType as CompanyBrainJobType,
      status: row.status as CompanyBrainQueueJob["status"],
      createdAt: row.createdAt,
    };
  }
}

async function persistQueueJob(job: CompanyBrainQueueJob): Promise<void> {
  await prisma.companyBrainQueueJob.upsert({
    where: { id: job.id },
    create: {
      id: job.id,
      userId: job.userId,
      jobType: job.type,
      status: job.status,
      createdAt: job.createdAt,
      dataJson: JSON.stringify(job),
    },
    update: {
      userId: job.userId,
      jobType: job.type,
      status: job.status,
      createdAt: job.createdAt,
      dataJson: JSON.stringify(job),
    },
  });
}

class PostgresQueueBackend implements QueueBackend {
  async enqueue(userId: string, type: CompanyBrainJobType): Promise<CompanyBrainQueueJob> {
    const existing = await prisma.companyBrainQueueJob.findFirst({
      where: {
        userId,
        jobType: type,
        status: { in: [...ACTIVE_QUEUE_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return jobFromRow(existing);

    const job: CompanyBrainQueueJob = {
      id: randomUUID(),
      userId,
      type,
      status: "queued",
      createdAt: nowIso(),
    };
    await persistQueueJob(job);
    return job;
  }

  async lease(userId: string, workerId: string, limit: number): Promise<CompanyBrainQueueJob[]> {
    const rows = await prisma.companyBrainQueueJob.findMany({
      where: { userId, status: "queued" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    const leased: CompanyBrainQueueJob[] = [];
    for (const row of rows) {
      const job = jobFromRow(row);
      job.status = "leased";
      job.leasedAt = nowIso();
      job.leaseOwner = workerId;
      await persistQueueJob(job);
      leased.push(job);
    }
    return leased;
  }

  async ack(jobId: string): Promise<void> {
    const row = await prisma.companyBrainQueueJob.findUnique({ where: { id: jobId } });
    if (!row) return;
    const job = jobFromRow(row);
    job.status = "done";
    await persistQueueJob(job);
  }

  async fail(jobId: string, error: string): Promise<void> {
    const row = await prisma.companyBrainQueueJob.findUnique({ where: { id: jobId } });
    if (!row) return;
    const job = jobFromRow(row);
    job.status = "failed";
    job.error = error;
    await persistQueueJob(job);
  }
}

type RedisLikeClient = {
  connect(): Promise<unknown>;
  isOpen?: boolean;
  lPush(key: string, value: string): Promise<number>;
  rPop(key: string): Promise<string | null>;
  hSet(key: string, field: string, value: string): Promise<number>;
  hGet(key: string, field: string): Promise<string | null>;
  hDel(key: string, field: string): Promise<number>;
};

class RedisQueueBackend implements QueueBackend {
  constructor(private readonly client: RedisLikeClient) {}

  private keyQueue(userId: string): string {
    return `memoryos:companybrain:queue:${userId}`;
  }

  private keyLeased(userId: string): string {
    return `memoryos:companybrain:leased:${userId}`;
  }

  private keyDone(userId: string): string {
    return `memoryos:companybrain:done:${userId}`;
  }

  private keyFailed(userId: string): string {
    return `memoryos:companybrain:failed:${userId}`;
  }

  async enqueue(userId: string, type: CompanyBrainJobType): Promise<CompanyBrainQueueJob> {
    const job: CompanyBrainQueueJob = {
      id: randomUUID(),
      userId,
      type,
      status: "queued",
      createdAt: nowIso(),
    };
    await this.client.lPush(this.keyQueue(userId), JSON.stringify(job));
    return job;
  }

  async lease(userId: string, workerId: string, limit: number): Promise<CompanyBrainQueueJob[]> {
    const leased: CompanyBrainQueueJob[] = [];
    for (let i = 0; i < limit; i += 1) {
      const raw = await this.client.rPop(this.keyQueue(userId));
      if (!raw) break;
      try {
        const parsed = JSON.parse(raw) as CompanyBrainQueueJob;
        const job: CompanyBrainQueueJob = {
          ...parsed,
          status: "leased",
          leasedAt: nowIso(),
          leaseOwner: workerId,
        };
        leased.push(job);
        await this.client.hSet(this.keyLeased(userId), job.id, JSON.stringify(job));
      } catch {
        // Skip malformed payloads.
      }
    }
    return leased;
  }

  async ack(jobId: string): Promise<void> {
    const userBuckets = [this.keyLeased("*")];
    void userBuckets;
    // We don't know userId from method args; scan is intentionally avoided for speed.
    // ACK is handled by writing to done bucket in fail-safe style by caller-local state.
    // No-op here to keep compatibility with existing interface.
    await Promise.resolve();
    void jobId;
  }

  async fail(jobId: string, error: string): Promise<void> {
    await Promise.resolve();
    void jobId;
    void error;
  }

  async ackWithUser(userId: string, jobId: string): Promise<void> {
    const raw = await this.client.hGet(this.keyLeased(userId), jobId);
    await this.client.hDel(this.keyLeased(userId), jobId);
    if (!raw) return;
    try {
      const job = JSON.parse(raw) as CompanyBrainQueueJob;
      job.status = "done";
      await this.client.hSet(this.keyDone(userId), jobId, JSON.stringify(job));
    } catch {
      // ignore malformed lease payload
    }
  }

  async failWithUser(userId: string, jobId: string, error: string): Promise<void> {
    const raw = await this.client.hGet(this.keyLeased(userId), jobId);
    await this.client.hDel(this.keyLeased(userId), jobId);
    const failed: CompanyBrainQueueJob = raw
      ? { ...(JSON.parse(raw) as CompanyBrainQueueJob), status: "failed", error }
      : { id: jobId, userId, type: "sync_all_sources", status: "failed", createdAt: nowIso(), error };
    await this.client.hSet(this.keyFailed(userId), jobId, JSON.stringify(failed));
  }
}

let backend: QueueBackend = new PostgresQueueBackend();
let backendMode: QueueBackendMode = "postgres";
let backendInitPromise: Promise<void> | null = null;

async function initBackend(): Promise<void> {
  if (backendInitPromise) return backendInitPromise;
  backendInitPromise = (async () => {
    await prisma.$connect();
    backend = new PostgresQueueBackend();
    backendMode = "postgres";
  })();
  return backendInitPromise;
}

export function getQueueBackend(): QueueBackend {
  void initBackend();
  return backend;
}

export async function ackQueueJob(userId: string, jobId: string): Promise<void> {
  void userId;
  await initBackend();
  await backend.ack(jobId);
}

export async function failQueueJob(userId: string, jobId: string, error: string): Promise<void> {
  void userId;
  await initBackend();
  await backend.fail(jobId, error);
}

export function getQueueBackendInfo(): { mode: QueueBackendMode } {
  return { mode: backendMode };
}

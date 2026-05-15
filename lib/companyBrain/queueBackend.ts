import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

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

export interface QueueBackend {
  enqueue(userId: string, type: CompanyBrainJobType): Promise<CompanyBrainQueueJob>;
  lease(userId: string, workerId: string, limit: number): Promise<CompanyBrainQueueJob[]>;
  ack(jobId: string): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "company-brain-queue.json");

function nowIso(): string {
  return new Date().toISOString();
}

function readJobs(): CompanyBrainQueueJob[] {
  if (!existsSync(STORE_PATH)) return [];
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CompanyBrainQueueJob[]) : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: CompanyBrainQueueJob[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(jobs, null, 2), "utf8");
}

class FileQueueBackend implements QueueBackend {
  async enqueue(userId: string, type: CompanyBrainJobType): Promise<CompanyBrainQueueJob> {
    const jobs = readJobs();
    const job: CompanyBrainQueueJob = {
      id: randomUUID(),
      userId,
      type,
      status: "queued",
      createdAt: nowIso(),
    };
    jobs.unshift(job);
    writeJobs(jobs.slice(0, 5000));
    return job;
  }

  async lease(userId: string, workerId: string, limit: number): Promise<CompanyBrainQueueJob[]> {
    const jobs = readJobs();
    const leased: CompanyBrainQueueJob[] = [];
    for (const job of jobs) {
      if (leased.length >= limit) break;
      if (job.userId !== userId || job.status !== "queued") continue;
      job.status = "leased";
      job.leasedAt = nowIso();
      job.leaseOwner = workerId;
      leased.push(job);
    }
    if (leased.length > 0) writeJobs(jobs);
    return leased;
  }

  async ack(jobId: string): Promise<void> {
    const jobs = readJobs();
    const job = jobs.find((entry) => entry.id === jobId);
    if (job) job.status = "done";
    writeJobs(jobs);
  }

  async fail(jobId: string, error: string): Promise<void> {
    const jobs = readJobs();
    const job = jobs.find((entry) => entry.id === jobId);
    if (job) {
      job.status = "failed";
      job.error = error;
    }
    writeJobs(jobs);
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

let backend: QueueBackend = new FileQueueBackend();
let backendMode: "file" | "redis" = "file";
let redisAdapter: RedisQueueBackend | null = null;
let backendInitPromise: Promise<void> | null = null;

async function initBackend(): Promise<void> {
  if (backendInitPromise) return backendInitPromise;
  backendInitPromise = (async () => {
    const preferred = (process.env.COMPANY_BRAIN_QUEUE_BACKEND ?? "").toLowerCase();
    const redisUrl = process.env.REDIS_URL;
    if (preferred !== "redis" && !redisUrl) {
      backend = new FileQueueBackend();
      backendMode = "file";
      return;
    }
    try {
      const redisModule = await import("redis");
      const client = redisModule.createClient(redisUrl ? { url: redisUrl } : undefined) as RedisLikeClient;
      if (!client.isOpen) {
        await client.connect();
      }
      redisAdapter = new RedisQueueBackend(client);
      backend = {
        enqueue: (userId, type) => redisAdapter!.enqueue(userId, type),
        lease: (userId, workerId, limit) => redisAdapter!.lease(userId, workerId, limit),
        ack: async (_jobId) => Promise.resolve(),
        fail: async (_jobId, _error) => Promise.resolve(),
      };
      backendMode = "redis";
    } catch {
      backend = new FileQueueBackend();
      backendMode = "file";
      redisAdapter = null;
    }
  })();
  return backendInitPromise;
}

export function getQueueBackend(): QueueBackend {
  void initBackend();
  return backend;
}

export async function ackQueueJob(userId: string, jobId: string): Promise<void> {
  await initBackend();
  if (backendMode === "redis" && redisAdapter) {
    await redisAdapter.ackWithUser(userId, jobId);
    return;
  }
  await backend.ack(jobId);
}

export async function failQueueJob(userId: string, jobId: string, error: string): Promise<void> {
  await initBackend();
  if (backendMode === "redis" && redisAdapter) {
    await redisAdapter.failWithUser(userId, jobId, error);
    return;
  }
  await backend.fail(jobId, error);
}

export function getQueueBackendInfo(): { mode: "file" | "redis" } {
  return { mode: backendMode };
}

import { randomUUID } from "crypto";
import { getRedisClient } from "../cache/redisClient";
import {
  createLabAutomationRun,
  getLabAutomation,
  type LabAutomationRunRecord,
} from "./labAutomationsStore";
import { publishLabAutomationRealtime } from "./labAutomationRealtime";

export type LabAutomationTriggerJob = {
  id: string;
  orgId: string;
  automationId: string;
  enqueuedBy: string;
  triggerType: LabAutomationRunRecord["triggerType"];
  payload: Record<string, unknown>;
  enqueuedAt: string;
};

export type EnqueueLabAutomationTriggerInput = {
  orgId: string;
  automationId: string;
  enqueuedBy: string;
  triggerType?: LabAutomationRunRecord["triggerType"];
  payload?: Record<string, unknown>;
};

const QUEUE_KEY = process.env.LAB_AUTOMATION_TRIGGER_QUEUE_KEY ??
  "memoryos:lab-automations:trigger-jobs:v1";
const WORKER_ID = `${process.pid}:${randomUUID()}`;

let workerTimer: NodeJS.Timeout | null = null;
let workerBusy = false;
const memoryQueue: LabAutomationTriggerJob[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function workerEnabled(): boolean {
  const raw = process.env.LAB_AUTOMATION_WORKER_ENABLED?.trim().toLowerCase();
  return raw !== "false" && raw !== "0";
}

function workerIntervalMs(): number {
  const value = Number(process.env.LAB_AUTOMATION_WORKER_INTERVAL_MS);
  return Number.isFinite(value) && value >= 250 ? Math.floor(value) : 2_500;
}

function workerBatchSize(): number {
  const value = Number(process.env.LAB_AUTOMATION_WORKER_BATCH_SIZE);
  return Number.isFinite(value) && value > 0 ? Math.min(50, Math.floor(value)) : 10;
}

function coerceTriggerType(value: unknown): LabAutomationRunRecord["triggerType"] {
  if (
    value === "schedule" ||
    value === "webhook" ||
    value === "github" ||
    value === "slack" ||
    value === "linear"
  ) {
    return value;
  }
  return "manual";
}

function parseJob(raw: string): LabAutomationTriggerJob | null {
  try {
    const parsed = JSON.parse(raw) as Partial<LabAutomationTriggerJob>;
    if (
      !parsed ||
      typeof parsed.orgId !== "string" ||
      typeof parsed.automationId !== "string" ||
      typeof parsed.enqueuedBy !== "string"
    ) {
      return null;
    }
    return {
      id: typeof parsed.id === "string" ? parsed.id : `job_${randomUUID()}`,
      orgId: parsed.orgId,
      automationId: parsed.automationId,
      enqueuedBy: parsed.enqueuedBy,
      triggerType: coerceTriggerType(parsed.triggerType),
      payload:
        parsed.payload && typeof parsed.payload === "object" && !Array.isArray(parsed.payload)
          ? parsed.payload as Record<string, unknown>
          : {},
      enqueuedAt: typeof parsed.enqueuedAt === "string" ? parsed.enqueuedAt : nowIso(),
    };
  } catch {
    return null;
  }
}

async function popJob(): Promise<LabAutomationTriggerJob | null> {
  const client = await getRedisClient();
  if (client) {
    try {
      const raw = await client.lPop(QUEUE_KEY);
      return raw ? parseJob(raw) : null;
    } catch {
      // Fall through to local queue for dev resilience.
    }
  }
  return memoryQueue.shift() ?? null;
}

async function processJob(job: LabAutomationTriggerJob): Promise<void> {
  const automation = await getLabAutomation(job.orgId, job.automationId);
  if (!automation) {
    await publishLabAutomationRealtime(job.orgId, "automation-trigger-failed", {
      automationId: job.automationId,
      jobId: job.id,
      error: "Automation not found",
    });
    return;
  }

  const run = await createLabAutomationRun(job.orgId, job.automationId, job.enqueuedBy, {
    status: "completed",
    triggerType: job.triggerType,
    metadata: {
      workerId: WORKER_ID,
      jobId: job.id,
      enqueuedAt: job.enqueuedAt,
      automationName: automation.name,
      payload: job.payload,
    },
  });

  if (run) {
    await publishLabAutomationRealtime(job.orgId, "automation-run-created", {
      automationId: job.automationId,
      run,
    });
  }
}

async function tickWorker(): Promise<void> {
  if (workerBusy) return;
  workerBusy = true;
  try {
    for (let index = 0; index < workerBatchSize(); index += 1) {
      const job = await popJob();
      if (!job) break;
      try {
        await processJob(job);
      } catch (error) {
        await publishLabAutomationRealtime(job.orgId, "automation-trigger-failed", {
          automationId: job.automationId,
          jobId: job.id,
          error: error instanceof Error ? error.message : "worker_failed",
        });
      }
    }
  } finally {
    workerBusy = false;
  }
}

export async function enqueueLabAutomationTriggerJob(
  input: EnqueueLabAutomationTriggerInput,
): Promise<LabAutomationTriggerJob> {
  const job: LabAutomationTriggerJob = {
    id: `job_${randomUUID()}`,
    orgId: input.orgId,
    automationId: input.automationId,
    enqueuedBy: input.enqueuedBy,
    triggerType: input.triggerType ?? "manual",
    payload: input.payload ?? {},
    enqueuedAt: nowIso(),
  };

  const client = await getRedisClient();
  if (client) {
    try {
      await client.rPush(QUEUE_KEY, JSON.stringify(job));
    } catch {
      memoryQueue.push(job);
    }
  } else {
    memoryQueue.push(job);
  }

  await publishLabAutomationRealtime(job.orgId, "automation-trigger-queued", {
    automationId: job.automationId,
    job,
  });
  return job;
}

export function startLabAutomationTriggerWorker(): void {
  if (workerTimer || !workerEnabled()) return;
  workerTimer = setInterval(() => {
    void tickWorker();
  }, workerIntervalMs());
  workerTimer.unref?.();
  void tickWorker();
}

export function stopLabAutomationTriggerWorkerForTests(): void {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
  workerBusy = false;
  memoryQueue.length = 0;
}

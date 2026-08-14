import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";
import {
  defaultCompanyBrainUserState,
  type CompanyBrainStoreFile,
  type CompanyBrainUserState,
} from "../lib/companyBrain/platformStore";
import { prisma } from "../lib/storage/prismaClient";
import { isPostgresRuntimeStore } from "../lib/storage/runtimeStoreBackend";

const repoRoot = process.cwd();
config({ path: path.join(repoRoot, ".env") });

const PLATFORM_PATH = path.join(repoRoot, "data", "company-brain-platform.json");
const QUEUE_PATH = path.join(repoRoot, "data", "company-brain-queue.json");

type MigrationSummary = {
  usersImported: number;
  usersSkipped: number;
  queueJobsImported: number;
  queueJobsSkipped: number;
  errors: string[];
};

function parseUserState(raw: unknown): CompanyBrainUserState | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return {
      ...defaultCompanyBrainUserState(),
      ...(raw as CompanyBrainUserState),
    };
  } catch {
    return null;
  }
}

function readPlatformFile(): CompanyBrainStoreFile {
  if (!existsSync(PLATFORM_PATH)) {
    return { users: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(PLATFORM_PATH, "utf8")) as CompanyBrainStoreFile;
    if (!parsed?.users || typeof parsed.users !== "object") {
      return { users: {} };
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to read ${PLATFORM_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

type QueueJobRow = {
  id: string;
  userId: string;
  type: string;
  status: string;
  createdAt: string;
  leasedAt?: string;
  leaseOwner?: string;
  error?: string;
};

const QUEUE_BACKEND_STATUSES = new Set(["queued", "leased", "done", "failed"]);

function normalizeQueueJobStatus(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (QUEUE_BACKEND_STATUSES.has(normalized)) return normalized;
  if (normalized === "running") return "leased";
  if (normalized === "completed") return "done";
  return "queued";
}

function normalizeQueueJobRow(job: QueueJobRow): QueueJobRow {
  const status = normalizeQueueJobStatus(job.status);
  return {
    ...job,
    status,
    type: job.type.trim(),
    createdAt: job.createdAt || new Date().toISOString(),
  };
}

function readQueueFile(): QueueJobRow[] {
  if (!existsSync(QUEUE_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(QUEUE_PATH, "utf8"));
    return Array.isArray(parsed) ? (parsed as QueueJobRow[]) : [];
  } catch (error) {
    throw new Error(
      `Failed to read ${QUEUE_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function upsertUser(userId: string, state: CompanyBrainUserState): Promise<void> {
  const updatedAt = new Date().toISOString();
  await prisma.companyBrainPlatformState.upsert({
    where: { userId_orgId: { userId, orgId: "" } },
    create: {
      userId,
      orgId: "",
      updatedAt,
      dataJson: JSON.stringify(state),
    },
    update: {
      updatedAt,
      dataJson: JSON.stringify(state),
    },
  });
}

async function upsertQueueJob(job: QueueJobRow): Promise<void> {
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

async function migrate(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    usersImported: 0,
    usersSkipped: 0,
    queueJobsImported: 0,
    queueJobsSkipped: 0,
    errors: [],
  };

  const platform = readPlatformFile();
  const userIds = Object.keys(platform.users);
  if (userIds.length === 0) {
    console.log(`No platform users to import (${PLATFORM_PATH} missing or empty).`);
  } else {
    console.log(`Importing ${userIds.length} user platform state(s) from ${PLATFORM_PATH}...`);
  }

  for (const userId of userIds) {
    const state = parseUserState(platform.users[userId]);
    if (!state) {
      summary.usersSkipped += 1;
      summary.errors.push(`user ${userId}: invalid state`);
      continue;
    }
    try {
      await upsertUser(userId, state);
      summary.usersImported += 1;
    } catch (error) {
      summary.usersSkipped += 1;
      summary.errors.push(
        `user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const queueJobs = readQueueFile();
  if (queueJobs.length === 0) {
    console.log(`No queue jobs to import (${QUEUE_PATH} missing or empty).`);
  } else {
    console.log(`Importing ${queueJobs.length} queue job(s) from ${QUEUE_PATH}...`);
  }

  for (const [index, job] of queueJobs.entries()) {
    if (!job.id || !job.userId || !job.type) {
      summary.queueJobsSkipped += 1;
      summary.errors.push(`queue[${index}]: missing id, userId, or type`);
      continue;
    }
    try {
      await upsertQueueJob(normalizeQueueJobRow(job));
      summary.queueJobsImported += 1;
    } catch (error) {
      summary.queueJobsSkipped += 1;
      summary.errors.push(
        `queue ${job.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}

function printSummary(summary: MigrationSummary): void {
  console.log("\n--- Company Brain JSON → Postgres migration ---");
  console.log(`Platform users imported: ${summary.usersImported}`);
  console.log(`Platform users skipped:  ${summary.usersSkipped}`);
  console.log(`Queue jobs imported:     ${summary.queueJobsImported}`);
  console.log(`Queue jobs skipped:      ${summary.queueJobsSkipped}`);
  if (summary.errors.length > 0) {
    console.log(`Errors (${summary.errors.length}):`);
    for (const message of summary.errors) {
      console.log(`  - ${message}`);
    }
  } else {
    console.log("Errors: none");
  }
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set. Configure Postgres in .env before migrating.");
  }

  if (!isPostgresRuntimeStore() && !force) {
    throw new Error(
      "MEMORY_STORE_BACKEND is not postgres. Set MEMORY_STORE_BACKEND=postgres or pass --force.",
    );
  }

  if (force && !isPostgresRuntimeStore()) {
    console.warn("Running with --force despite MEMORY_STORE_BACKEND != postgres.");
  }

  await prisma.$connect();
  const summary = await migrate();
  printSummary(summary);

  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

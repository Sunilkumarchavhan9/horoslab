import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";
import type {
  ContinuityExecutionState,
  ContinuityThread,
} from "../lib/continuity/continuityThreadStore";
import type { FileChangeProposal } from "../lib/continuity/fileChangeProposalStore";
import { prisma } from "../lib/storage/prismaClient";
import { isPostgresRuntimeStore } from "../lib/storage/runtimeStoreBackend";

const repoRoot = process.cwd();
config({ path: path.join(repoRoot, ".env") });

const THREADS_PATH = path.join(repoRoot, "data", "continuity-threads.json");
const PROPOSALS_PATH = path.join(repoRoot, "data", "continuity-file-changes.json");

const VALID_THREAD_STATUSES = new Set(["active", "archived", "blocked"]);
const VALID_PROPOSAL_STATUSES = new Set([
  "pending",
  "approved",
  "rejected",
  "applied",
  "failed",
]);

type MigrationSummary = {
  threadsImported: number;
  threadsSkipped: number;
  proposalsImported: number;
  proposalsSkipped: number;
  errors: string[];
};

function createDefaultExecutionState(updatedAt: string): ContinuityExecutionState {
  return {
    status: "idle",
    currentStage: "plan",
    retryCount: 0,
    approvalBlocked: false,
    workerStatus: "idle",
    workerJobs: [],
    steps: [],
    updatedAt,
  };
}

function normalizeThread(raw: Partial<ContinuityThread>): ContinuityThread | null {
  const id = String(raw.id ?? "").trim();
  const userId = String(raw.userId ?? "").trim();
  if (!id || !userId) return null;

  const status =
    typeof raw.status === "string" && VALID_THREAD_STATUSES.has(raw.status)
      ? raw.status
      : "active";
  const now = new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : now;
  const executionState: ContinuityExecutionState = {
    ...createDefaultExecutionState(updatedAt),
    ...(raw.executionState ?? {}),
    steps: Array.isArray(raw.executionState?.steps)
      ? raw.executionState.steps
      : Array.isArray(raw.executionSteps)
        ? raw.executionSteps
        : [],
    updatedAt:
      typeof raw.executionState?.updatedAt === "string" ? raw.executionState.updatedAt : updatedAt,
  };

  const thread: ContinuityThread = {
    id,
    userId,
    title: String(raw.title ?? "Untitled thread"),
    goal: typeof raw.goal === "string" ? raw.goal : undefined,
    workspace: String(raw.workspace ?? "default"),
    project: String(raw.project ?? "memoryos"),
    repoPath: typeof raw.repoPath === "string" ? raw.repoPath : undefined,
    status,
    blockers: Array.isArray(raw.blockers) ? raw.blockers.map(String) : [],
    plan: Array.isArray(raw.plan) ? raw.plan.map(String) : [],
    executionSteps: Array.isArray(raw.executionSteps) ? raw.executionSteps : [],
    executionLog: Array.isArray(raw.executionLog) ? raw.executionLog : [],
    currentStepIndex: typeof raw.currentStepIndex === "number" ? raw.currentStepIndex : -1,
    checkpoints: Array.isArray(raw.checkpoints) ? raw.checkpoints : [],
    retrievals: Array.isArray(raw.retrievals) ? raw.retrievals : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    runtimeState:
      raw.runtimeState === "running" ||
      raw.runtimeState === "paused" ||
      raw.runtimeState === "blocked"
        ? raw.runtimeState
        : "idle",
    linkedPrs: Array.isArray(raw.linkedPrs) ? raw.linkedPrs.map(String) : [],
    handoffs: Array.isArray(raw.handoffs) ? raw.handoffs : [],
    artifacts: Array.isArray(raw.artifacts) ? raw.artifacts : [],
    executionState,
    autonomousStage:
      raw.autonomousStage === "execute" ||
      raw.autonomousStage === "verify" ||
      raw.autonomousStage === "pr"
        ? raw.autonomousStage
        : "plan",
    autonomousStageStatus:
      raw.autonomousStageStatus === "running" ||
      raw.autonomousStageStatus === "blocked" ||
      raw.autonomousStageStatus === "completed"
        ? raw.autonomousStageStatus
        : "idle",
    autonomousStageUpdatedAt:
      typeof raw.autonomousStageUpdatedAt === "string" ? raw.autonomousStageUpdatedAt : updatedAt,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt,
  };

  return {
    ...thread,
    executionSteps: Array.isArray(thread.executionSteps) ? thread.executionSteps : [],
    executionLog: Array.isArray(thread.executionLog) ? thread.executionLog : [],
    currentStepIndex: typeof thread.currentStepIndex === "number" ? thread.currentStepIndex : -1,
    linkedPrs: Array.isArray(thread.linkedPrs) ? thread.linkedPrs : [],
    plan: Array.isArray(thread.plan) ? thread.plan : [],
    blockers: Array.isArray(thread.blockers) ? thread.blockers : [],
    checkpoints: Array.isArray(thread.checkpoints) ? thread.checkpoints : [],
    retrievals: Array.isArray(thread.retrievals) ? thread.retrievals : [],
    timeline: Array.isArray(thread.timeline) ? thread.timeline : [],
  };
}

function normalizeProposal(raw: Partial<FileChangeProposal>): FileChangeProposal | null {
  const id = String(raw.id ?? "").trim();
  const userId = String(raw.userId ?? "").trim();
  const threadId = String(raw.threadId ?? "").trim();
  if (!id || !userId || !threadId) return null;

  const status =
    typeof raw.status === "string" && VALID_PROPOSAL_STATUSES.has(raw.status)
      ? raw.status
      : "pending";

  return {
    id,
    userId,
    threadId,
    checkpointId: typeof raw.checkpointId === "string" ? raw.checkpointId : null,
    filepath: String(raw.filepath ?? ""),
    instruction: typeof raw.instruction === "string" ? raw.instruction : null,
    originalText: String(raw.originalText ?? ""),
    newText: String(raw.newText ?? ""),
    startLine: typeof raw.startLine === "number" ? raw.startLine : 0,
    startCharacter: typeof raw.startCharacter === "number" ? raw.startCharacter : 0,
    endLine: typeof raw.endLine === "number" ? raw.endLine : 0,
    endCharacter: typeof raw.endCharacter === "number" ? raw.endCharacter : 0,
    status,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    reviewedAt: typeof raw.reviewedAt === "string" ? raw.reviewedAt : null,
    appliedAt: typeof raw.appliedAt === "string" ? raw.appliedAt : null,
    error: typeof raw.error === "string" ? raw.error : null,
  };
}

function readThreadsFile(): Partial<ContinuityThread>[] {
  if (!existsSync(THREADS_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(THREADS_PATH, "utf8")) as { threads?: unknown };
    if (!Array.isArray(parsed.threads) || parsed.threads.length === 0) return [];
    return parsed.threads as Partial<ContinuityThread>[];
  } catch (error) {
    throw new Error(
      `Failed to read ${THREADS_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function readProposalsFile(): Partial<FileChangeProposal>[] {
  if (!existsSync(PROPOSALS_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(PROPOSALS_PATH, "utf8")) as { proposals?: unknown };
    if (!Array.isArray(parsed.proposals) || parsed.proposals.length === 0) return [];
    return parsed.proposals as Partial<FileChangeProposal>[];
  } catch (error) {
    throw new Error(
      `Failed to read ${PROPOSALS_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function upsertThread(thread: ContinuityThread): Promise<void> {
  await prisma.continuityThread.upsert({
    where: { id: thread.id },
    create: {
      id: thread.id,
      userId: thread.userId,
      workspace: thread.workspace,
      project: thread.project,
      status: thread.status,
      updatedAt: thread.updatedAt,
      dataJson: JSON.stringify(thread),
    },
    update: {
      userId: thread.userId,
      workspace: thread.workspace,
      project: thread.project,
      status: thread.status,
      updatedAt: thread.updatedAt,
      dataJson: JSON.stringify(thread),
    },
  });
}

async function upsertProposal(proposal: FileChangeProposal): Promise<void> {
  await prisma.continuityFileChange.upsert({
    where: { id: proposal.id },
    create: {
      id: proposal.id,
      userId: proposal.userId,
      threadId: proposal.threadId,
      status: proposal.status,
      createdAt: proposal.createdAt,
      dataJson: JSON.stringify(proposal),
    },
    update: {
      userId: proposal.userId,
      threadId: proposal.threadId,
      status: proposal.status,
      createdAt: proposal.createdAt,
      dataJson: JSON.stringify(proposal),
    },
  });
}

async function migrate(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    threadsImported: 0,
    threadsSkipped: 0,
    proposalsImported: 0,
    proposalsSkipped: 0,
    errors: [],
  };

  const rawThreads = readThreadsFile();
  if (rawThreads.length === 0) {
    console.log(`No threads to import (${THREADS_PATH} missing or empty).`);
  } else {
    console.log(`Importing ${rawThreads.length} thread(s) from ${THREADS_PATH}...`);
  }

  for (const [index, raw] of rawThreads.entries()) {
    const thread = normalizeThread(raw);
    if (!thread) {
      summary.threadsSkipped += 1;
      summary.errors.push(`thread[${index}]: missing id or userId`);
      continue;
    }
    try {
      await upsertThread(thread);
      summary.threadsImported += 1;
    } catch (error) {
      summary.threadsSkipped += 1;
      summary.errors.push(
        `thread ${thread.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const rawProposals = readProposalsFile();
  if (rawProposals.length === 0) {
    console.log(`No proposals to import (${PROPOSALS_PATH} missing or empty).`);
  } else {
    console.log(`Importing ${rawProposals.length} proposal(s) from ${PROPOSALS_PATH}...`);
  }

  for (const [index, raw] of rawProposals.entries()) {
    const proposal = normalizeProposal(raw);
    if (!proposal) {
      summary.proposalsSkipped += 1;
      summary.errors.push(`proposal[${index}]: missing id, userId, or threadId`);
      continue;
    }
    try {
      await upsertProposal(proposal);
      summary.proposalsImported += 1;
    } catch (error) {
      summary.proposalsSkipped += 1;
      summary.errors.push(
        `proposal ${proposal.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}

function printSummary(summary: MigrationSummary): void {
  console.log("\n--- Continuity JSON → Postgres migration ---");
  console.log(`Threads imported:  ${summary.threadsImported}`);
  console.log(`Threads skipped:   ${summary.threadsSkipped}`);
  console.log(`Proposals imported: ${summary.proposalsImported}`);
  console.log(`Proposals skipped:  ${summary.proposalsSkipped}`);
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

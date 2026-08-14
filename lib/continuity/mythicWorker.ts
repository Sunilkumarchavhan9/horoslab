import {
  claimThreadExecutionWorkerJob,
  enqueueThreadExecutionWorkerJob,
  getContinuityThread,
  getThreadExecutionWorkerJob,
  retryThreadExecutionWorkerJob,
  type ContinuityWorkerBlockedReason,
  type ContinuityWorkerJob,
  updateThreadExecutionWorkerJob,
} from "./continuityThreadStore";
import { orchestrateMythicNext } from "./mythicOrchestrator";
import { publishDesktopWorkerState } from "./desktopProvider";

const DRAINING_THREADS = new Set<string>();

function mapBlockedReason(message: string): ContinuityWorkerBlockedReason {
  if (message.includes("reviewer decision")) return "awaiting_review_decision";
  if (message.includes("proposal")) return "blocked_on_proposal";
  if (message.includes("verification")) return "blocked_on_verification";
  if (message.includes("GitHub") || message.includes("repoPath") || message.includes("PR stage")) {
    return "blocked_on_github";
  }
  if (message.includes("PR")) return "awaiting_pr_result";
  return "blocked_on_unknown";
}

async function processJob(input: {
  userId: string;
  threadId: string;
  jobId: string;
  orgId?: string;
}): Promise<void> {
  const claimed = await claimThreadExecutionWorkerJob(
    input.userId,
    input.threadId,
    input.jobId,
    input.orgId,
  );
  if (!claimed) return;
  const { job } = claimed;
  await publishDesktopWorkerState({
    userId: input.userId,
    orgId: input.orgId,
    threadId: input.threadId,
    workerJobId: job.id,
    phase: "claimed",
    note: `Worker ${job.role ?? "runtime"} is executing.`,
  });

  try {
    const result = await orchestrateMythicNext({
      userId: input.userId,
      orgId: input.orgId,
      threadId: input.threadId,
      reviewDecision: job.reviewDecision,
      note: job.note,
    });
    if (!result) {
      throw new Error("Thread not found.");
    }
    const nextThread = await getContinuityThread(input.userId, input.threadId, input.orgId);
    const nextStep =
      nextThread?.executionState.steps.find((step) => step.status === "running") ??
      nextThread?.executionState.steps.find((step) => step.status === "pending");

    await updateThreadExecutionWorkerJob(
      input.userId,
      input.threadId,
      job.id,
      { status: "completed", note: result.actions.join(" | ") },
      input.orgId,
    );
    await publishDesktopWorkerState({
      userId: input.userId,
      orgId: input.orgId,
      threadId: input.threadId,
      workerJobId: job.id,
      phase: "completed",
      note: result.actions.join(" | "),
    });

    if (nextThread && nextThread.executionState.status !== "completed" && nextStep?.role === "reviewer") {
      await updateThreadExecutionWorkerJob(
        input.userId,
        input.threadId,
        job.id,
        { blockedReason: "awaiting_review_decision" },
        input.orgId,
      );
      await publishDesktopWorkerState({
        userId: input.userId,
        orgId: input.orgId,
        threadId: input.threadId,
        workerJobId: job.id,
        phase: "blocked",
        note: "Awaiting reviewer decision before desktop flow can continue.",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mythic worker failed.";
    await updateThreadExecutionWorkerJob(
      input.userId,
      input.threadId,
      job.id,
      {
        status: "failed",
        error: message,
        blockedReason: mapBlockedReason(message),
      },
      input.orgId,
    );
    await publishDesktopWorkerState({
      userId: input.userId,
      orgId: input.orgId,
      threadId: input.threadId,
      workerJobId: job.id,
      phase: "failed",
      error: message,
    });
  }
}

async function drainThreadQueue(input: {
  userId: string;
  threadId: string;
  orgId?: string;
}): Promise<void> {
  if (DRAINING_THREADS.has(input.threadId)) return;
  DRAINING_THREADS.add(input.threadId);
  try {
    while (true) {
      const thread = await getContinuityThread(input.userId, input.threadId, input.orgId);
      const nextJob = thread?.executionState.workerJobs.find((job) => job.status === "queued");
      if (!nextJob) break;
      await processJob({
        userId: input.userId,
        threadId: input.threadId,
        orgId: input.orgId,
        jobId: nextJob.id,
      });
    }
  } finally {
    DRAINING_THREADS.delete(input.threadId);
  }
}

export async function enqueueMythicWorkerJob(input: {
  userId: string;
  orgId?: string;
  threadId: string;
  reviewDecision?: "approve" | "reject";
  note?: string;
}): Promise<ContinuityWorkerJob> {
  const queued = await enqueueThreadExecutionWorkerJob(
    input.userId,
    input.threadId,
    {
      reviewDecision: input.reviewDecision,
      note: input.note,
    },
    input.orgId,
  );
  if (!queued) {
    throw new Error("Thread not found.");
  }
  void drainThreadQueue({
    userId: input.userId,
    threadId: input.threadId,
    orgId: input.orgId,
  });
  return queued.job;
}

export async function retryMythicWorkerJob(input: {
  userId: string;
  orgId?: string;
  threadId: string;
  jobId: string;
}): Promise<ContinuityWorkerJob | null> {
  const retried = await retryThreadExecutionWorkerJob(
    input.userId,
    input.threadId,
    input.jobId,
    input.orgId,
  );
  if (!retried) return null;
  void drainThreadQueue({
    userId: input.userId,
    threadId: input.threadId,
    orgId: input.orgId,
  });
  return retried.job;
}

export async function getMythicWorkerJob(input: {
  userId: string;
  orgId?: string;
  threadId: string;
  jobId: string;
}): Promise<ContinuityWorkerJob | null> {
  return getThreadExecutionWorkerJob(input.userId, input.threadId, input.jobId, input.orgId);
}

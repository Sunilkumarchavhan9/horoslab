import { randomUUID } from "crypto";
import { continuityUserFilter, normalizeOrgId, resolveRequestOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

export type ContinuityThreadStatus = "active" | "archived" | "blocked";
export type ContinuityRuntimeState = "idle" | "running" | "paused" | "blocked";
export type ContinuityAutonomousStage = "plan" | "execute" | "verify" | "pr";
export type ContinuityAutonomousStageStatus =
  | "idle"
  | "running"
  | "blocked"
  | "completed";

export type ContinuityCheckpoint = {
  id: string;
  label: string;
  summary?: string;
  createdAt: string;
  approved?: boolean;
  approvedAt?: string;
};

export type ContinuityProvenanceItem = {
  label: string;
  sourceType: string;
  memoryId?: string;
  snippet?: string;
  score?: number;
};

export type ContinuityRetrieval = {
  id: string;
  question: string;
  memoryIds: string[];
  provenance: ContinuityProvenanceItem[];
  createdAt: string;
};

export type ContinuityTimelineEvent = {
  id: string;
  kind: "created" | "checkpoint" | "retrieve" | "blocker" | "plan" | "approval" | "status" | "execution";
  label: string;
  createdAt: string;
};

export type ExecutionStepStatus = "pending" | "running" | "done" | "skipped" | "failed";
export type ContinuityExecutionApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected";
export type ContinuityWorkerStatus =
  | "idle"
  | "queued"
  | "running"
  | "blocked"
  | "awaiting_review_decision"
  | "awaiting_pr_result"
  | "completed";
export type ContinuityWorkerBlockedReason =
  | "awaiting_review_decision"
  | "awaiting_pr_result"
  | "blocked_on_proposal"
  | "blocked_on_verification"
  | "blocked_on_github"
  | "blocked_on_retry_limit"
  | "blocked_on_unknown";
export type ContinuityWorkerJobStatus =
  | "queued"
  | "claimed"
  | "running"
  | "completed"
  | "failed";

export type ContinuityWorkerJob = {
  id: string;
  threadId: string;
  stepId?: string;
  role?: ContinuityAgentRole;
  status: ContinuityWorkerJobStatus;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  claimedAt?: string;
  completedAt?: string;
  failedAt?: string;
  reviewDecision?: "approve" | "reject";
  note?: string;
  error?: string;
};

export type ContinuityExecutionStep = {
  id: string;
  label: string;
  role: ContinuityAgentRole;
  stage: ContinuityAutonomousStage;
  status: ExecutionStepStatus;
  approvalStatus: ContinuityExecutionApprovalStatus;
  artifactIds: string[];
  proposalIds: string[];
  handoffId?: string;
  failureReason?: string;
  revisionReason?: string;
  retryCount: number;
  startedAt?: string;
  completedAt?: string;
};

export type ContinuityExecutionState = {
  taskId?: string;
  activeRole?: ContinuityAgentRole;
  status: "idle" | "running" | "blocked" | "completed";
  currentStage: ContinuityAutonomousStage;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  lastRevisionReason?: string;
  retryCount: number;
  approvalBlocked: boolean;
  workerStatus: ContinuityWorkerStatus;
  workerJobId?: string;
  queuedAt?: string;
  lastAttemptAt?: string;
  lastWorkerError?: string;
  blockedReason?: ContinuityWorkerBlockedReason;
  workerJobs: ContinuityWorkerJob[];
  steps: ContinuityExecutionStep[];
  updatedAt: string;
};

export type ContinuityExecutionLogEntry = {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  at: string;
};

export type ContinuityAgentRole =
  | "manager"
  | "coder"
  | "reviewer"
  | "verifier";

export type ContinuityAgentHandoff = {
  id: string;
  source: ContinuityAgentRole;
  target: ContinuityAgentRole;
  taskId: string;
  timestamp: string;
  payload: {
    codeChanges?: string[];
    testResults?: string[];
    artifacts?: string[];
    proposalIds?: string[];
    reviewOutcomes?: string[];
    revisionReason?: string;
  };
  metadata: {
    confidence: number;
    completeness: number;
    notes: string;
  };
  requirements: string[];
  compressedContext: string;
};

export type ContinuityArtifactType =
  | "code"
  | "test"
  | "preview"
  | "recording"
  | "log"
  | "review_note";

export type ContinuityArtifact = {
  id: string;
  type: ContinuityArtifactType;
  producer: ContinuityAgentRole;
  consumers: ContinuityAgentRole[];
  uri: string;
  title: string;
  description?: string;
  content?: string;
  sourceHandoffId?: string;
  metadata: {
    createdAt: string;
    expiresAt?: string;
    tags: string[];
    stage?: ContinuityAutonomousStage;
    verificationRequired?: boolean;
    sourceChangeId?: string;
    sourceProvider?: string;
    recordingArtifactId?: string;
  };
};

export type ContinuityDesktopSessionState =
  | "idle"
  | "starting"
  | "live"
  | "stale"
  | "blocked"
  | "error";

export type ContinuityDesktopSession = {
  provider: "preview" | "browser" | "vscode" | "playwright" | "custom";
  state: ContinuityDesktopSessionState;
  osType: "ubuntu" | "windows";
  previewUrl?: string;
  controlUrl?: string;
  providerSessionId?: string;
  sessionAuthToken?: string;
  sessionAuthExpiresAt?: string;
  resumeToken?: string;
  resumeSupported?: boolean;
  transportMode?: "webrtc" | "vnc" | "image-stream" | "unknown";
  nodeId?: string;
  runtimeMessage?: string;
  previewArtifactId?: string;
  recordingArtifactId?: string;
  lastFrameAt?: string;
  updatedAt: string;
};

export type ContinuityThread = {
  id: string;
  userId: string;
  orgId?: string;
  title: string;
  goal?: string;
  workspace: string;
  project: string;
  repoPath?: string;
  status: ContinuityThreadStatus;
  blockers: string[];
  plan: string[];
  executionSteps: ContinuityExecutionStep[];
  executionLog: ContinuityExecutionLogEntry[];
  currentStepIndex: number;
  checkpoints: ContinuityCheckpoint[];
  retrievals: ContinuityRetrieval[];
  timeline: ContinuityTimelineEvent[];
  runtimeState: ContinuityRuntimeState;
  linkedPrs: string[];
  handoffs: ContinuityAgentHandoff[];
  artifacts: ContinuityArtifact[];
  desktopSession?: ContinuityDesktopSession;
  executionState: ContinuityExecutionState;
  autonomousStage: ContinuityAutonomousStage;
  autonomousStageStatus: ContinuityAutonomousStageStatus;
  autonomousStageUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

function parseThreadRow(dataJson: string): ContinuityThread | null {
  try {
    return normalizeThread(JSON.parse(dataJson) as ContinuityThread);
  } catch {
    return null;
  }
}

async function listUserThreads(userId: string, orgId?: string): Promise<ContinuityThread[]> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const rows = await prisma.continuityThread.findMany({
    where: continuityUserFilter({ userId, orgId: scopedOrgId }),
    orderBy: { updatedAt: "desc" },
    select: { dataJson: true },
  });
  return rows
    .map((row) => parseThreadRow(row.dataJson))
    .filter((thread): thread is ContinuityThread => thread !== null);
}

async function getThreadRecord(
  userId: string,
  threadId: string,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const row = await prisma.continuityThread.findFirst({
    where: { id: threadId, ...continuityUserFilter({ userId, orgId: scopedOrgId }) },
    select: { dataJson: true },
  });
  if (!row) return null;
  return parseThreadRow(row.dataJson);
}

async function upsertThreadRecord(thread: ContinuityThread): Promise<void> {
  syncLegacyExecutionFields(thread);
  const orgId = normalizeOrgId(thread.orgId) ?? null;
  await prisma.continuityThread.upsert({
    where: { id: thread.id },
    create: {
      id: thread.id,
      userId: thread.userId,
      orgId,
      workspace: thread.workspace,
      project: thread.project,
      status: thread.status,
      updatedAt: thread.updatedAt,
      dataJson: JSON.stringify(thread),
    },
    update: {
      userId: thread.userId,
      orgId,
      workspace: thread.workspace,
      project: thread.project,
      status: thread.status,
      updatedAt: thread.updatedAt,
      dataJson: JSON.stringify(thread),
    },
  });
}

function normalizeThread(thread: ContinuityThread): ContinuityThread {
  const orgId = normalizeOrgId(thread.orgId);
  const autonomousStageUpdatedAt =
    typeof thread.autonomousStageUpdatedAt === "string" &&
    thread.autonomousStageUpdatedAt
      ? thread.autonomousStageUpdatedAt
      : thread.updatedAt;
  const autonomousStage: ContinuityAutonomousStage =
    thread.autonomousStage === "execute" ||
    thread.autonomousStage === "verify" ||
    thread.autonomousStage === "pr"
      ? thread.autonomousStage
      : "plan";
  const autonomousStageStatus: ContinuityAutonomousStageStatus =
    thread.autonomousStageStatus === "running" ||
    thread.autonomousStageStatus === "blocked" ||
    thread.autonomousStageStatus === "completed"
      ? thread.autonomousStageStatus
      : "idle";
  const updatedAt = thread.updatedAt || new Date().toISOString();
  const normalizedSteps = Array.isArray(thread.executionState?.steps)
    ? thread.executionState.steps
    : Array.isArray(thread.executionSteps)
      ? thread.executionSteps
      : [];
  const executionState: ContinuityExecutionState = {
    ...createDefaultExecutionState(updatedAt),
    ...(thread.executionState ?? {}),
    workerJobs: Array.isArray(thread.executionState?.workerJobs)
      ? thread.executionState.workerJobs.map((job) => ({
          id: String(job.id ?? ""),
          threadId: String(job.threadId ?? thread.id),
          ...(typeof job.stepId === "string" ? { stepId: job.stepId } : {}),
          ...(job.role === "manager" || job.role === "coder" || job.role === "reviewer" || job.role === "verifier"
            ? { role: job.role }
            : {}),
          status:
            job.status === "claimed" ||
            job.status === "running" ||
            job.status === "completed" ||
            job.status === "failed"
              ? job.status
              : "queued",
          createdAt: typeof job.createdAt === "string" ? job.createdAt : updatedAt,
          updatedAt: typeof job.updatedAt === "string" ? job.updatedAt : updatedAt,
          attempts: typeof job.attempts === "number" ? job.attempts : 0,
          ...(typeof job.claimedAt === "string" ? { claimedAt: job.claimedAt } : {}),
          ...(typeof job.completedAt === "string" ? { completedAt: job.completedAt } : {}),
          ...(typeof job.failedAt === "string" ? { failedAt: job.failedAt } : {}),
          ...(job.reviewDecision === "approve" || job.reviewDecision === "reject"
            ? { reviewDecision: job.reviewDecision }
            : {}),
          ...(typeof job.note === "string" ? { note: job.note } : {}),
          ...(typeof job.error === "string" ? { error: job.error } : {}),
        }))
      : [],
    steps: normalizedSteps.map((step) => ({
      id: step.id,
      label: step.label,
      role:
        step.role === "manager" ||
        step.role === "reviewer" ||
        step.role === "verifier"
          ? step.role
          : "coder",
      stage:
        step.stage === "execute" || step.stage === "verify" || step.stage === "pr"
          ? step.stage
          : "plan",
      status: step.status,
      approvalStatus:
        step.approvalStatus === "pending" ||
        step.approvalStatus === "approved" ||
        step.approvalStatus === "rejected"
          ? step.approvalStatus
          : step.role === "reviewer"
            ? "pending"
            : "not_required",
      artifactIds: Array.isArray(step.artifactIds) ? step.artifactIds : [],
      proposalIds: Array.isArray(step.proposalIds) ? step.proposalIds : [],
      ...(step.handoffId ? { handoffId: step.handoffId } : {}),
      ...(step.failureReason ? { failureReason: step.failureReason } : {}),
      ...(step.revisionReason ? { revisionReason: step.revisionReason } : {}),
      retryCount: typeof step.retryCount === "number" ? step.retryCount : 0,
      ...(step.startedAt ? { startedAt: step.startedAt } : {}),
      ...(step.completedAt ? { completedAt: step.completedAt } : {}),
    })),
    updatedAt:
      typeof thread.executionState?.updatedAt === "string" && thread.executionState.updatedAt
        ? thread.executionState.updatedAt
        : updatedAt,
  };
  const normalizedThread: ContinuityThread = {
    ...thread,
    ...(orgId ? { orgId } : {}),
    executionSteps: [],
    executionLog: Array.isArray(thread.executionLog) ? thread.executionLog : [],
    currentStepIndex: -1,
    linkedPrs: Array.isArray(thread.linkedPrs) ? thread.linkedPrs : [],
    handoffs: Array.isArray(thread.handoffs) ? thread.handoffs : [],
    artifacts: Array.isArray(thread.artifacts) ? thread.artifacts : [],
    desktopSession: thread.desktopSession
      ? {
          provider:
            thread.desktopSession.provider === "browser" ||
            thread.desktopSession.provider === "vscode" ||
            thread.desktopSession.provider === "playwright" ||
            thread.desktopSession.provider === "custom"
              ? thread.desktopSession.provider
              : "preview",
          state:
            thread.desktopSession.state === "starting" ||
            thread.desktopSession.state === "live" ||
            thread.desktopSession.state === "stale" ||
            thread.desktopSession.state === "blocked" ||
            thread.desktopSession.state === "error"
              ? thread.desktopSession.state
              : "idle",
          osType: thread.desktopSession.osType === "windows" ? "windows" : "ubuntu",
          ...(thread.desktopSession.previewUrl ? { previewUrl: thread.desktopSession.previewUrl } : {}),
          ...(thread.desktopSession.controlUrl ? { controlUrl: thread.desktopSession.controlUrl } : {}),
          ...(thread.desktopSession.providerSessionId
            ? { providerSessionId: thread.desktopSession.providerSessionId }
            : {}),
          ...(thread.desktopSession.sessionAuthToken
            ? { sessionAuthToken: thread.desktopSession.sessionAuthToken }
            : {}),
          ...(thread.desktopSession.sessionAuthExpiresAt
            ? { sessionAuthExpiresAt: thread.desktopSession.sessionAuthExpiresAt }
            : {}),
          ...(thread.desktopSession.resumeToken
            ? { resumeToken: thread.desktopSession.resumeToken }
            : {}),
          ...(typeof thread.desktopSession.resumeSupported === "boolean"
            ? { resumeSupported: thread.desktopSession.resumeSupported }
            : {}),
          ...(thread.desktopSession.transportMode
            ? { transportMode: thread.desktopSession.transportMode }
            : {}),
          ...(thread.desktopSession.nodeId ? { nodeId: thread.desktopSession.nodeId } : {}),
          ...(thread.desktopSession.runtimeMessage
            ? { runtimeMessage: thread.desktopSession.runtimeMessage }
            : {}),
          ...(thread.desktopSession.previewArtifactId
            ? { previewArtifactId: thread.desktopSession.previewArtifactId }
            : {}),
          ...(thread.desktopSession.recordingArtifactId
            ? { recordingArtifactId: thread.desktopSession.recordingArtifactId }
            : {}),
          ...(thread.desktopSession.lastFrameAt
            ? { lastFrameAt: thread.desktopSession.lastFrameAt }
            : {}),
          updatedAt:
            typeof thread.desktopSession.updatedAt === "string" && thread.desktopSession.updatedAt
              ? thread.desktopSession.updatedAt
              : updatedAt,
        }
      : createDefaultDesktopSession(updatedAt),
    plan: Array.isArray(thread.plan) ? thread.plan : [],
    blockers: Array.isArray(thread.blockers) ? thread.blockers : [],
    checkpoints: Array.isArray(thread.checkpoints) ? thread.checkpoints : [],
    retrievals: Array.isArray(thread.retrievals) ? thread.retrievals : [],
    timeline: Array.isArray(thread.timeline) ? thread.timeline : [],
    executionState,
    autonomousStage,
    autonomousStageStatus,
    autonomousStageUpdatedAt,
  };
  syncLegacyExecutionFields(normalizedThread);
  return normalizedThread;
}

function pushTimeline(
  thread: ContinuityThread,
  kind: ContinuityTimelineEvent["kind"],
  label: string,
): void {
  thread.timeline.push({
    id: randomUUID(),
    kind,
    label,
    createdAt: new Date().toISOString(),
  });
}

function createArtifactUri(threadId: string, artifactId: string): string {
  return `artifact://${threadId}/${artifactId}`;
}

function createDefaultDesktopSession(updatedAt: string): ContinuityDesktopSession {
  return {
    provider: "preview",
    state: "idle",
    osType: "ubuntu",
    updatedAt,
  };
}

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

function buildExecutionStep(
  label: string,
  role: ContinuityAgentRole,
  stage: ContinuityAutonomousStage,
): ContinuityExecutionStep {
  return {
    id: randomUUID(),
    label,
    role,
    stage,
    status: "pending",
    approvalStatus: role === "reviewer" ? "pending" : "not_required",
    artifactIds: [],
    proposalIds: [],
    retryCount: 0,
  };
}

function buildExecutionStepsFromPlan(
  labels: string[],
  taskId?: string,
): ContinuityExecutionState {
  const now = new Date().toISOString();
  const planSteps = labels.map((label) => buildExecutionStep(label, "coder", "execute"));
  const steps: ContinuityExecutionStep[] = [
    buildExecutionStep(
      taskId ? `Manager activation for ${taskId}` : "Manager activation",
      "manager",
      "plan",
    ),
    ...planSteps,
    buildExecutionStep("Reviewer approval gate", "reviewer", "verify"),
    buildExecutionStep("Verifier evidence and QA", "verifier", "verify"),
    buildExecutionStep("PR link and completion summary", "manager", "pr"),
  ];

  return {
    taskId,
    status: "idle",
    currentStage: "plan",
    retryCount: 0,
    approvalBlocked: false,
    workerStatus: "idle",
    workerJobs: [],
    steps,
    updatedAt: now,
  };
}

function getActiveExecutionStepIndex(thread: ContinuityThread): number {
  return thread.executionState.steps.findIndex((step) => step.status === "running");
}

function syncLegacyExecutionFields(thread: ContinuityThread): void {
  const legacySteps = thread.executionState.steps.filter((step) => step.stage === "execute");
  thread.executionSteps = legacySteps.map((step) => ({
    id: step.id,
    label: step.label,
    role: step.role,
    stage: step.stage,
    status: step.status,
    approvalStatus: step.approvalStatus,
    artifactIds: [...step.artifactIds],
    proposalIds: [...step.proposalIds],
    ...(step.handoffId ? { handoffId: step.handoffId } : {}),
    ...(step.failureReason ? { failureReason: step.failureReason } : {}),
    ...(step.revisionReason ? { revisionReason: step.revisionReason } : {}),
    retryCount: step.retryCount,
    ...(step.startedAt ? { startedAt: step.startedAt } : {}),
    ...(step.completedAt ? { completedAt: step.completedAt } : {}),
  }));
  thread.currentStepIndex = legacySteps.findIndex((step) => step.status === "running");
}

function getNextPendingStepIndex(
  thread: ContinuityThread,
  stage?: ContinuityAutonomousStage,
): number {
  return thread.executionState.steps.findIndex(
    (step) =>
      step.status === "pending" && (stage ? step.stage === stage : true),
  );
}

function completeExecutionIfDone(thread: ContinuityThread, now: string): void {
  const incomplete = thread.executionState.steps.some(
    (step) => step.status === "pending" || step.status === "running",
  );
  if (!incomplete) {
    thread.executionState.status = "completed";
    thread.executionState.completedAt = now;
    thread.executionState.activeRole = undefined;
  }
}

function getStepById(
  thread: ContinuityThread,
  stepId?: string,
): ContinuityExecutionStep | undefined {
  if (!stepId) return undefined;
  return thread.executionState.steps.find((step) => step.id === stepId);
}

export async function listContinuityThreads(input: {
  userId: string;
  orgId?: string;
  workspace?: string;
  project?: string;
  status?: ContinuityThreadStatus;
}): Promise<ContinuityThread[]> {
  return (await listUserThreads(input.userId, input.orgId))
    .filter((t) => (input.workspace ? t.workspace === input.workspace : true))
    .filter((t) => (input.project ? t.project === input.project : true))
    .filter((t) => (input.status ? t.status === input.status : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getContinuityThread(
  userId: string,
  threadId: string,
  orgId?: string,
): Promise<ContinuityThread | null> {
  return getThreadRecord(userId, threadId, orgId);
}

export async function createContinuityThread(input: {
  userId: string;
  orgId?: string;
  title: string;
  goal?: string;
  workspace: string;
  project: string;
  repoPath?: string;
}): Promise<ContinuityThread> {
  const now = new Date().toISOString();
  const scopedOrgId = resolveRequestOrgId(input.orgId);
  const thread: ContinuityThread = {
    id: randomUUID(),
    userId: input.userId,
    ...(scopedOrgId ? { orgId: scopedOrgId } : {}),
    title: input.title.trim(),
    goal: input.goal?.trim() || undefined,
    workspace: input.workspace,
    project: input.project,
    repoPath: input.repoPath,
    status: "active",
    blockers: [],
    plan: [],
    executionSteps: [],
    executionLog: [],
    currentStepIndex: -1,
    checkpoints: [],
    retrievals: [],
    timeline: [],
    runtimeState: "idle",
    linkedPrs: [],
    handoffs: [],
    artifacts: [],
    desktopSession: createDefaultDesktopSession(now),
    executionState: createDefaultExecutionState(now),
    autonomousStage: "plan",
    autonomousStageStatus: "idle",
    autonomousStageUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  pushTimeline(thread, "created", `Thread created: ${thread.title}`);
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function updateContinuityThread(
  userId: string,
  threadId: string,
  patch: Partial<
    Pick<
      ContinuityThread,
      | "title"
      | "goal"
      | "status"
      | "blockers"
      | "plan"
      | "runtimeState"
      | "linkedPrs"
      | "artifacts"
      | "desktopSession"
      | "repoPath"
      | "autonomousStage"
      | "autonomousStageStatus"
    >
  >,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  if (patch.title !== undefined) thread.title = patch.title.trim();
  if (patch.goal !== undefined) thread.goal = patch.goal.trim() || undefined;
  if (patch.status !== undefined) {
    thread.status = patch.status;
    pushTimeline(thread, "status", `Status → ${patch.status}`);
  }
  if (patch.blockers !== undefined) thread.blockers = patch.blockers;
  if (patch.plan !== undefined) thread.plan = patch.plan;
  if (patch.runtimeState !== undefined) {
    thread.runtimeState = patch.runtimeState;
    pushTimeline(thread, "status", `Runtime → ${patch.runtimeState}`);
  }
  if (patch.linkedPrs !== undefined) thread.linkedPrs = patch.linkedPrs;
  if (patch.artifacts !== undefined) thread.artifacts = patch.artifacts;
  if (patch.desktopSession !== undefined) {
    thread.desktopSession = {
      ...(thread.desktopSession ?? createDefaultDesktopSession(thread.updatedAt)),
      ...patch.desktopSession,
      updatedAt: new Date().toISOString(),
    };
  }
  if (patch.repoPath !== undefined) thread.repoPath = patch.repoPath;
  if (patch.autonomousStage !== undefined) {
    thread.autonomousStage = patch.autonomousStage;
    thread.autonomousStageUpdatedAt = new Date().toISOString();
    pushTimeline(thread, "execution", `Autonomous stage → ${patch.autonomousStage}`);
  }
  if (patch.autonomousStageStatus !== undefined) {
    thread.autonomousStageStatus = patch.autonomousStageStatus;
    thread.autonomousStageUpdatedAt = new Date().toISOString();
    pushTimeline(
      thread,
      "execution",
      `Autonomous stage status → ${patch.autonomousStageStatus}`,
    );
  }
  thread.updatedAt = new Date().toISOString();
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function addContinuityCheckpoint(
  userId: string,
  threadId: string,
  input: { label: string; summary?: string },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const checkpoint: ContinuityCheckpoint = {
    id: randomUUID(),
    label: input.label.trim(),
    summary: input.summary?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  thread.checkpoints.push(checkpoint);
  pushTimeline(thread, "checkpoint", checkpoint.label);
  thread.updatedAt = new Date().toISOString();
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function approveContinuityCheckpoint(
  userId: string,
  threadId: string,
  checkpointId: string,
  approved: boolean,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const checkpoint = thread.checkpoints.find((c) => c.id === checkpointId);
  if (!checkpoint) return null;

  checkpoint.approved = approved;
  checkpoint.approvedAt = new Date().toISOString();
  pushTimeline(
    thread,
    "approval",
    approved ? `Approved: ${checkpoint.label}` : `Rejected: ${checkpoint.label}`,
  );
  thread.updatedAt = new Date().toISOString();
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function recordContinuityRetrieval(
  userId: string,
  threadId: string,
  input: {
    question: string;
    memoryIds: string[];
    provenance: ContinuityProvenanceItem[];
  },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const retrieval: ContinuityRetrieval = {
    id: randomUUID(),
    question: input.question.trim(),
    memoryIds: input.memoryIds,
    provenance: input.provenance,
    createdAt: new Date().toISOString(),
  };
  thread.retrievals.unshift(retrieval);
  if (thread.retrievals.length > 40) thread.retrievals.length = 40;
  pushTimeline(thread, "retrieve", `Retrieved: ${retrieval.question.slice(0, 80)}`);
  thread.updatedAt = new Date().toISOString();
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function appendThreadExecutionLog(
  userId: string,
  threadId: string,
  level: ContinuityExecutionLogEntry["level"],
  message: string,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  appendExecutionLog(thread, level, message);
  thread.updatedAt = new Date().toISOString();
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

function appendExecutionLog(
  thread: ContinuityThread,
  level: ContinuityExecutionLogEntry["level"],
  message: string,
): void {
  thread.executionLog.unshift({
    id: randomUUID(),
    level,
    message: message.trim(),
    at: new Date().toISOString(),
  });
  if (thread.executionLog.length > 80) thread.executionLog.length = 80;
}

export async function setThreadExecutionPlan(
  userId: string,
  threadId: string,
  steps: string[],
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const labels = steps.map((s) => s.trim()).filter(Boolean);
  thread.plan = labels;
  thread.executionState = buildExecutionStepsFromPlan(labels, thread.executionState.taskId);
  thread.runtimeState = "idle";
  thread.autonomousStage = "plan";
  thread.autonomousStageStatus = "completed";
  thread.autonomousStageUpdatedAt = thread.executionState.updatedAt;
  pushTimeline(thread, "plan", `Plan set (${labels.length} steps)`);
  appendExecutionLog(thread, "info", `Plan updated: ${labels.length} steps`);
  thread.updatedAt = thread.executionState.updatedAt;
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function startThreadExecution(
  userId: string,
  threadId: string,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  if (thread.executionState.steps.length === 0 && thread.plan.length > 0) {
    thread.executionState = buildExecutionStepsFromPlan(
      thread.plan,
      thread.executionState.taskId,
    );
  }
  if (thread.executionState.steps.length === 0) return null;

  const now = new Date().toISOString();
  const nextIndex = getNextPendingStepIndex(thread, "execute");
  const startIndex = nextIndex >= 0 ? nextIndex : getNextPendingStepIndex(thread);
  if (startIndex < 0) return null;
  const step = thread.executionState.steps[startIndex];
  step.status = "running";
  step.startedAt = now;
  step.completedAt = undefined;
  thread.executionState.activeRole = step.role;
  thread.executionState.status = "running";
  thread.executionState.currentStage = step.stage;
  thread.executionState.startedAt = thread.executionState.startedAt ?? now;
  thread.executionState.updatedAt = now;
  thread.runtimeState = "running";
  thread.autonomousStage = step.stage;
  thread.autonomousStageStatus = "running";
  thread.autonomousStageUpdatedAt = now;
  pushTimeline(thread, "execution", `Execution started (${step.role} · ${step.stage})`);
  appendExecutionLog(
    thread,
    "info",
    `Running step ${startIndex + 1}/${thread.executionState.steps.length}: ${step.label}`,
  );
  thread.updatedAt = now;
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function pauseThreadExecution(
  userId: string,
  threadId: string,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  thread.runtimeState = "paused";
  thread.executionState.status = "idle";
  thread.executionState.updatedAt = new Date().toISOString();
  thread.autonomousStage = thread.executionState.currentStage;
  thread.autonomousStageStatus = "idle";
  thread.autonomousStageUpdatedAt = thread.executionState.updatedAt;
  pushTimeline(thread, "execution", "Execution paused");
  appendExecutionLog(thread, "warn", "Execution paused by operator");
  thread.updatedAt = thread.executionState.updatedAt;
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function advanceThreadExecutionStep(
  userId: string,
  threadId: string,
  input: { status: "done" | "failed" | "skipped" },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const idx = getActiveExecutionStepIndex(thread);
  if (idx < 0 || idx >= thread.executionState.steps.length) return null;

  const now = new Date().toISOString();
  const current = thread.executionState.steps[idx];
  current.status = input.status;
  current.completedAt = now;
  if (input.status === "failed") {
    current.failureReason = "Execution step failed";
    current.retryCount += 1;
    thread.executionState.failureReason = current.failureReason;
    thread.executionState.failedAt = now;
    thread.executionState.retryCount += 1;
  }

  appendExecutionLog(
    thread,
    input.status === "failed" ? "error" : "info",
    `Step ${idx + 1} ${input.status}: ${current.label}`,
  );

  const nextIndex = thread.executionState.steps.findIndex(
    (step, stepIndex) => stepIndex > idx && step.status === "pending",
  );
  if (nextIndex >= 0 && input.status !== "failed") {
    const nextStep = thread.executionState.steps[nextIndex];
    nextStep.status = "running";
    nextStep.startedAt = now;
    thread.executionState.activeRole = nextStep.role;
    thread.executionState.status = "running";
    thread.executionState.currentStage = nextStep.stage;
    thread.runtimeState = "running";
    thread.autonomousStage = nextStep.stage;
    thread.autonomousStageStatus = "running";
    thread.autonomousStageUpdatedAt = now;
    appendExecutionLog(
      thread,
      "info",
      `Running step ${nextIndex + 1}/${thread.executionState.steps.length}: ${nextStep.label}`,
    );
  } else {
    thread.executionState.activeRole = undefined;
    thread.runtimeState = input.status === "failed" ? "blocked" : "idle";
    if (input.status === "failed") {
      thread.executionState.status = "blocked";
      thread.autonomousStage = thread.executionState.currentStage;
      thread.autonomousStageStatus = "blocked";
    } else {
      completeExecutionIfDone(thread, now);
      thread.autonomousStage = "verify";
      thread.autonomousStageStatus = "running";
    }
    thread.autonomousStageUpdatedAt = now;
    pushTimeline(
      thread,
      "execution",
      input.status === "failed" ? "Execution blocked" : "Execution completed",
    );
    appendExecutionLog(
      thread,
      input.status === "failed" ? "error" : "info",
      input.status === "failed" ? "Execution blocked on failure" : "All steps completed",
    );
  }

  thread.executionState.updatedAt = now;
  thread.updatedAt = now;
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function linkThreadPullRequest(
  userId: string,
  threadId: string,
  prUrl: string,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const url = prUrl.trim();
  if (!url) return null;
  if (!thread.linkedPrs.includes(url)) thread.linkedPrs.push(url);
  thread.executionState.currentStage = "pr";
  thread.executionState.status = "running";
  thread.executionState.activeRole = "manager";
  thread.executionState.updatedAt = new Date().toISOString();
  thread.autonomousStage = "pr";
  thread.autonomousStageStatus = "running";
  thread.autonomousStageUpdatedAt = thread.executionState.updatedAt;
  pushTimeline(thread, "plan", `Linked PR: ${url}`);
  appendExecutionLog(thread, "info", `Handoff linked: ${url}`);
  thread.updatedAt = thread.executionState.updatedAt;
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function createThreadHandoff(
  userId: string,
  threadId: string,
  input: Omit<ContinuityAgentHandoff, "id" | "timestamp">,
  orgId?: string,
): Promise<{ thread: ContinuityThread; handoff: ContinuityAgentHandoff } | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const handoff: ContinuityAgentHandoff = {
    id: randomUUID(),
    source: input.source,
    target: input.target,
    taskId: input.taskId.trim(),
    timestamp: now,
    payload: {
      ...(input.payload.codeChanges ? { codeChanges: input.payload.codeChanges } : {}),
      ...(input.payload.testResults ? { testResults: input.payload.testResults } : {}),
      ...(input.payload.artifacts ? { artifacts: input.payload.artifacts } : {}),
      ...(input.payload.proposalIds ? { proposalIds: input.payload.proposalIds } : {}),
      ...(input.payload.reviewOutcomes
        ? { reviewOutcomes: input.payload.reviewOutcomes }
        : {}),
      ...(input.payload.revisionReason
        ? { revisionReason: input.payload.revisionReason }
        : {}),
    },
    metadata: input.metadata,
    requirements: input.requirements,
    compressedContext: input.compressedContext,
  };
  thread.handoffs.unshift(handoff);
  if (thread.handoffs.length > 100) thread.handoffs.length = 100;
  pushTimeline(
    thread,
    "execution",
    `Handoff ${handoff.source} → ${handoff.target} (${handoff.taskId})`,
  );
  appendExecutionLog(
    thread,
    "info",
    `Structured handoff created (${handoff.source} -> ${handoff.target}) for task ${handoff.taskId}`,
  );
  thread.updatedAt = now;
  await upsertThreadRecord(thread);
  return { thread: normalizeThread(thread), handoff };
}

export async function createThreadArtifact(
  userId: string,
  threadId: string,
  input: {
    type: ContinuityArtifactType;
    producer: ContinuityAgentRole;
    consumers?: ContinuityAgentRole[];
    title: string;
    description?: string;
    content?: string;
    expiresAt?: string;
    tags?: string[];
    stage?: ContinuityAutonomousStage;
    verificationRequired?: boolean;
    sourceChangeId?: string;
    sourceProvider?: string;
    recordingArtifactId?: string;
    sourceHandoffId?: string;
  },
  orgId?: string,
): Promise<{ thread: ContinuityThread; artifact: ContinuityArtifact } | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const artifactId = randomUUID();
  const artifact: ContinuityArtifact = {
    id: artifactId,
    type: input.type,
    producer: input.producer,
    consumers: (input.consumers ?? []).slice(0, 8),
    uri: createArtifactUri(thread.id, artifactId),
    title: input.title.trim(),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.content?.trim() ? { content: input.content.trim() } : {}),
    ...(input.sourceHandoffId ? { sourceHandoffId: input.sourceHandoffId } : {}),
    metadata: {
      createdAt: now,
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
      ...(input.stage ? { stage: input.stage } : {}),
      ...(input.verificationRequired !== undefined
        ? { verificationRequired: input.verificationRequired }
        : {}),
      ...(input.sourceChangeId ? { sourceChangeId: input.sourceChangeId } : {}),
      ...(input.sourceProvider ? { sourceProvider: input.sourceProvider } : {}),
      ...(input.recordingArtifactId ? { recordingArtifactId: input.recordingArtifactId } : {}),
    },
  };
  thread.artifacts.unshift(artifact);
  if (thread.artifacts.length > 200) thread.artifacts.length = 200;
  if (artifact.type === "preview") {
    thread.desktopSession = {
      ...(thread.desktopSession ?? createDefaultDesktopSession(now)),
      provider:
        artifact.metadata.sourceProvider === "browser" ||
        artifact.metadata.sourceProvider === "vscode" ||
        artifact.metadata.sourceProvider === "playwright" ||
        artifact.metadata.sourceProvider === "custom"
          ? artifact.metadata.sourceProvider
          : "preview",
      state: "live",
      previewArtifactId: artifact.id,
      previewUrl: artifact.content?.trim() || artifact.description?.trim() || undefined,
      controlUrl:
        thread.desktopSession?.controlUrl ||
        artifact.content?.trim() ||
        artifact.description?.trim() ||
        undefined,
      lastFrameAt: now,
      runtimeMessage: "Runtime preview attached.",
      updatedAt: now,
    };
  }
  if (artifact.type === "recording") {
    thread.desktopSession = {
      ...(thread.desktopSession ?? createDefaultDesktopSession(now)),
      recordingArtifactId: artifact.id,
      updatedAt: now,
    };
  }
  pushTimeline(thread, "execution", `Artifact created: ${artifact.type} (${artifact.title})`);
  appendExecutionLog(thread, "info", `Artifact registered (${artifact.type}) ${artifact.uri}`);
  thread.updatedAt = now;
  await upsertThreadRecord(thread);
  return { thread: normalizeThread(thread), artifact };
}

export async function updateThreadDesktopSession(
  userId: string,
  threadId: string,
  input: Partial<Omit<ContinuityDesktopSession, "updatedAt">>,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  thread.desktopSession = {
    ...(thread.desktopSession ?? createDefaultDesktopSession(now)),
    ...input,
    updatedAt: now,
  };
  thread.updatedAt = now;
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function listThreadArtifacts(
  userId: string,
  threadId: string,
  input?: { limit?: number; orgId?: string },
): Promise<ContinuityArtifact[] | null> {
  const thread = await getThreadRecord(userId, threadId, input?.orgId);
  if (!thread) return null;
  const limit = Math.max(1, Math.min(100, Math.floor(input?.limit ?? 20)));
  return thread.artifacts.slice(0, limit);
}

export async function getThreadArtifact(
  userId: string,
  threadId: string,
  artifactId: string,
  orgId?: string,
): Promise<ContinuityArtifact | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  return thread.artifacts.find((artifact) => artifact.id === artifactId) ?? null;
}

export async function listThreadHandoffs(
  userId: string,
  threadId: string,
  input?: { limit?: number; orgId?: string },
): Promise<ContinuityAgentHandoff[] | null> {
  const thread = await getThreadRecord(userId, threadId, input?.orgId);
  if (!thread) return null;
  const limit = Math.max(1, Math.min(100, Math.floor(input?.limit ?? 20)));
  return thread.handoffs.slice(0, limit);
}

export async function getThreadExecutionState(
  userId: string,
  threadId: string,
  orgId?: string,
): Promise<ContinuityExecutionState | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  return thread.executionState;
}

export async function assignThreadExecutionTask(
  userId: string,
  threadId: string,
  input: {
    taskId: string;
    activeRole?: ContinuityAgentRole;
  },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  if (thread.executionState.steps.length === 0 && thread.plan.length > 0) {
    thread.executionState = buildExecutionStepsFromPlan(thread.plan, input.taskId);
  }
  thread.executionState.taskId = input.taskId.trim();
  thread.executionState.activeRole = input.activeRole ?? thread.executionState.activeRole ?? "manager";
  thread.executionState.status = "idle";
  thread.executionState.updatedAt = now;
  thread.executionState.blockedReason = undefined;
  thread.runtimeState = "idle";
  thread.autonomousStage = "plan";
  thread.autonomousStageStatus = "completed";
  thread.autonomousStageUpdatedAt = now;
  thread.updatedAt = now;
  pushTimeline(thread, "plan", `Mythic task assigned (${thread.executionState.taskId})`);
  appendExecutionLog(thread, "info", `Mythic task assigned: ${thread.executionState.taskId}`);
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function startThreadExecutionTask(
  userId: string,
  threadId: string,
  input?: {
    taskId?: string;
    activeRole?: ContinuityAgentRole;
  },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  if (thread.executionState.steps.length === 0 && thread.plan.length > 0) {
    thread.executionState = buildExecutionStepsFromPlan(
      thread.plan,
      input?.taskId ?? thread.executionState.taskId,
    );
  }
  if (!thread.executionState.taskId && input?.taskId?.trim()) {
    thread.executionState.taskId = input.taskId.trim();
  }
  thread.executionState.status = "running";
  thread.executionState.startedAt = thread.executionState.startedAt ?? now;
  thread.executionState.updatedAt = now;
  if (input?.activeRole) thread.executionState.activeRole = input.activeRole;
  thread.executionState.workerStatus = "running";
  thread.executionState.lastAttemptAt = now;
  thread.executionState.lastWorkerError = undefined;
  thread.executionState.blockedReason = undefined;
  thread.runtimeState = "running";
  thread.autonomousStage = thread.executionState.currentStage;
  thread.autonomousStageStatus = "running";
  thread.autonomousStageUpdatedAt = now;
  pushTimeline(thread, "execution", "Mythic task execution started");
  appendExecutionLog(thread, "info", "Mythic task execution started");
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function startThreadExecutionStepById(
  userId: string,
  threadId: string,
  stepId: string,
  input?: { role?: ContinuityAgentRole },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const step = thread.executionState.steps.find((entry) => entry.id === stepId);
  if (!step) return null;
  const now = new Date().toISOString();
  for (const entry of thread.executionState.steps) {
    if (entry.id !== stepId && entry.status === "running") {
      entry.status = "pending";
      entry.startedAt = undefined;
    }
  }
  step.status = "running";
  step.startedAt = now;
  step.completedAt = undefined;
  if (step.stage === "verify" && step.role === "reviewer") {
    step.approvalStatus = "pending";
  }
  thread.executionState.activeRole = input?.role ?? step.role;
  thread.executionState.status = "running";
  thread.executionState.currentStage = step.stage;
  thread.executionState.updatedAt = now;
  thread.executionState.workerStatus = "running";
  thread.executionState.lastAttemptAt = now;
  thread.executionState.lastWorkerError = undefined;
  thread.executionState.blockedReason = undefined;
  thread.runtimeState = "running";
  thread.autonomousStage = step.stage;
  thread.autonomousStageStatus = "running";
  thread.autonomousStageUpdatedAt = now;
  pushTimeline(thread, "execution", `Step started: ${step.label}`);
  appendExecutionLog(thread, "info", `${step.role} started step: ${step.label}`);
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function completeThreadExecutionStepById(
  userId: string,
  threadId: string,
  stepId: string,
  input?: {
    artifactIds?: string[];
    proposalIds?: string[];
    handoffId?: string;
    approvalStatus?: ContinuityExecutionApprovalStatus;
    note?: string;
  },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const step = thread.executionState.steps.find((entry) => entry.id === stepId);
  if (!step) return null;
  const now = new Date().toISOString();
  step.status = "done";
  step.completedAt = now;
  step.failureReason = undefined;
  step.artifactIds = Array.from(new Set([...(input?.artifactIds ?? []), ...step.artifactIds]));
  step.proposalIds = Array.from(new Set([...(input?.proposalIds ?? []), ...step.proposalIds]));
  if (input?.handoffId) step.handoffId = input.handoffId;
  if (input?.approvalStatus) step.approvalStatus = input.approvalStatus;
  if (step.role === "reviewer" && step.approvalStatus === "rejected") {
    thread.executionState.approvalBlocked = true;
    thread.executionState.status = "blocked";
    thread.executionState.workerStatus = "blocked";
    thread.executionState.blockedReason = "awaiting_review_decision";
    thread.runtimeState = "blocked";
    thread.autonomousStage = step.stage;
    thread.autonomousStageStatus = "blocked";
  } else {
    thread.executionState.approvalBlocked = false;
    thread.executionState.blockedReason = undefined;
    const nextIndex = thread.executionState.steps.findIndex(
      (entry) => entry.status === "pending",
    );
    if (nextIndex >= 0) {
      const nextStep = thread.executionState.steps[nextIndex];
      thread.executionState.activeRole = nextStep.role;
      thread.executionState.currentStage = nextStep.stage;
      thread.executionState.workerStatus = "idle";
      thread.autonomousStage = nextStep.stage;
      thread.autonomousStageStatus = "running";
      thread.runtimeState = "running";
    } else {
      thread.executionState.activeRole = undefined;
      thread.executionState.status = "completed";
      thread.executionState.completedAt = now;
      thread.executionState.workerStatus = "completed";
      thread.autonomousStage = "pr";
      thread.autonomousStageStatus = "completed";
      thread.runtimeState = "idle";
    }
  }
  thread.executionState.updatedAt = now;
  thread.autonomousStageUpdatedAt = now;
  thread.updatedAt = now;
  pushTimeline(thread, "execution", `Step completed: ${step.label}`);
  appendExecutionLog(
    thread,
    "info",
    input?.note?.trim() || `${step.role} completed step: ${step.label}`,
  );
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function failThreadExecutionStepById(
  userId: string,
  threadId: string,
  stepId: string,
  reason: string,
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const step = thread.executionState.steps.find((entry) => entry.id === stepId);
  if (!step) return null;
  const now = new Date().toISOString();
  step.status = "failed";
  step.completedAt = now;
  step.failureReason = reason.trim();
  step.retryCount += 1;
  thread.executionState.status = "blocked";
  thread.executionState.failureReason = step.failureReason;
  thread.executionState.failedAt = now;
  thread.executionState.retryCount += 1;
  thread.executionState.activeRole = step.role;
  thread.executionState.currentStage = step.stage;
  thread.executionState.updatedAt = now;
  thread.executionState.workerStatus = "blocked";
  thread.executionState.lastWorkerError = step.failureReason;
  thread.executionState.lastAttemptAt = now;
  thread.executionState.blockedReason = "blocked_on_unknown";
  thread.runtimeState = "blocked";
  thread.autonomousStage = step.stage;
  thread.autonomousStageStatus = "blocked";
  thread.autonomousStageUpdatedAt = now;
  thread.updatedAt = now;
  pushTimeline(thread, "execution", `Step failed: ${step.label}`);
  appendExecutionLog(thread, "error", `${step.role} failed step: ${reason.trim()}`);
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function requestThreadExecutionRevision(
  userId: string,
  threadId: string,
  input: {
    reason: string;
    targetRole?: ContinuityAgentRole;
  },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const targetRole = input.targetRole ?? "coder";
  const now = new Date().toISOString();
  const targetStep =
    [...thread.executionState.steps]
      .reverse()
      .find((entry) => entry.role === targetRole) ?? null;
  if (!targetStep) return null;
  targetStep.status = "pending";
  targetStep.completedAt = undefined;
  targetStep.failureReason = undefined;
  targetStep.revisionReason = input.reason.trim();
  targetStep.retryCount += 1;
  thread.executionState.lastRevisionReason = input.reason.trim();
  thread.executionState.retryCount += 1;
  thread.executionState.status = "running";
  thread.executionState.approvalBlocked = false;
  thread.executionState.activeRole = targetRole;
  thread.executionState.currentStage = targetStep.stage;
  thread.executionState.updatedAt = now;
  thread.executionState.workerStatus = "queued";
  thread.executionState.queuedAt = now;
  thread.executionState.lastWorkerError = undefined;
  thread.executionState.blockedReason = undefined;
  thread.runtimeState = "running";
  thread.autonomousStage = targetStep.stage;
  thread.autonomousStageStatus = "running";
  thread.autonomousStageUpdatedAt = now;
  thread.updatedAt = now;
  pushTimeline(thread, "execution", `Revision requested for ${targetRole}`);
  appendExecutionLog(thread, "warn", `Revision requested: ${input.reason.trim()}`);
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function setThreadExecutionWorkerState(
  userId: string,
  threadId: string,
  input: {
    workerStatus: ContinuityWorkerStatus;
    workerJobId?: string;
    lastWorkerError?: string;
    queuedAt?: string;
    lastAttemptAt?: string;
    blockedReason?: ContinuityWorkerBlockedReason;
  },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  thread.executionState.workerStatus = input.workerStatus;
  if (input.workerJobId !== undefined) thread.executionState.workerJobId = input.workerJobId;
  if (input.lastWorkerError !== undefined) {
    thread.executionState.lastWorkerError = input.lastWorkerError || undefined;
  }
  if (input.queuedAt !== undefined) thread.executionState.queuedAt = input.queuedAt || undefined;
  if (input.lastAttemptAt !== undefined) {
    thread.executionState.lastAttemptAt = input.lastAttemptAt || undefined;
  }
  if (input.blockedReason !== undefined) {
    thread.executionState.blockedReason = input.blockedReason;
  }
  thread.executionState.updatedAt = now;
  thread.updatedAt = now;
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

export async function enqueueThreadExecutionWorkerJob(
  userId: string,
  threadId: string,
  input?: {
    reviewDecision?: "approve" | "reject";
    note?: string;
  },
  orgId?: string,
): Promise<{ thread: ContinuityThread; job: ContinuityWorkerJob } | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const activeStep =
    thread.executionState.steps.find((step) => step.status === "running") ??
    thread.executionState.steps.find((step) => step.status === "pending");
  const existing = thread.executionState.workerJobs.find(
    (job) =>
      (job.status === "queued" || job.status === "claimed" || job.status === "running") &&
      job.stepId === activeStep?.id &&
      job.reviewDecision === input?.reviewDecision,
  );
  if (existing) {
    thread.executionState.workerStatus = existing.status === "queued" ? "queued" : "running";
    thread.executionState.workerJobId = existing.id;
    thread.executionState.queuedAt = existing.createdAt;
    thread.executionState.updatedAt = now;
    thread.updatedAt = now;
    await upsertThreadRecord(thread);
    return { thread: normalizeThread(thread), job: existing };
  }

  const job: ContinuityWorkerJob = {
    id: `mythic_job_${randomUUID().slice(0, 12)}`,
    threadId: thread.id,
    ...(activeStep ? { stepId: activeStep.id, role: activeStep.role } : {}),
    status: "queued",
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    ...(input?.reviewDecision ? { reviewDecision: input.reviewDecision } : {}),
    ...(input?.note?.trim() ? { note: input.note.trim() } : {}),
  };
  thread.executionState.workerJobs.unshift(job);
  if (thread.executionState.workerJobs.length > 100) {
    thread.executionState.workerJobs.length = 100;
  }
  thread.executionState.workerStatus = "queued";
  thread.executionState.workerJobId = job.id;
  thread.executionState.queuedAt = now;
  thread.executionState.lastWorkerError = undefined;
  thread.executionState.blockedReason = undefined;
  thread.executionState.updatedAt = now;
  thread.updatedAt = now;
  appendExecutionLog(thread, "info", `Queued Mythic worker job ${job.id}`);
  await upsertThreadRecord(thread);
  return { thread: normalizeThread(thread), job };
}

export async function claimThreadExecutionWorkerJob(
  userId: string,
  threadId: string,
  jobId: string,
  orgId?: string,
): Promise<{ thread: ContinuityThread; job: ContinuityWorkerJob } | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const job = thread.executionState.workerJobs.find((entry) => entry.id === jobId);
  if (!job) return null;
  if (job.status === "completed") {
    return { thread: normalizeThread(thread), job };
  }
  job.status = "claimed";
  job.claimedAt = now;
  job.updatedAt = now;
  job.attempts += 1;
  job.error = undefined;
  thread.executionState.workerStatus = "running";
  thread.executionState.workerJobId = job.id;
  thread.executionState.lastAttemptAt = now;
  thread.executionState.lastWorkerError = undefined;
  thread.executionState.blockedReason = undefined;
  thread.executionState.updatedAt = now;
  thread.updatedAt = now;
  appendExecutionLog(thread, "info", `Claimed Mythic worker job ${job.id}`);
  await upsertThreadRecord(thread);
  return { thread: normalizeThread(thread), job };
}

export async function updateThreadExecutionWorkerJob(
  userId: string,
  threadId: string,
  jobId: string,
  input: {
    status?: ContinuityWorkerJobStatus;
    error?: string;
    blockedReason?: ContinuityWorkerBlockedReason;
    note?: string;
  },
  orgId?: string,
): Promise<{ thread: ContinuityThread; job: ContinuityWorkerJob } | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const job = thread.executionState.workerJobs.find((entry) => entry.id === jobId);
  if (!job) return null;
  if (input.status) job.status = input.status;
  if (input.error !== undefined) job.error = input.error || undefined;
  if (input.note?.trim()) job.note = input.note.trim();
  job.updatedAt = now;
  if (job.status === "completed") job.completedAt = now;
  if (job.status === "failed") job.failedAt = now;
  thread.executionState.workerJobId = job.id;
  thread.executionState.lastAttemptAt = now;
  if (input.error !== undefined) {
    thread.executionState.lastWorkerError = input.error || undefined;
  }
  if (input.blockedReason !== undefined) {
    thread.executionState.blockedReason = input.blockedReason;
  }
  if (job.status === "completed") {
    thread.executionState.workerStatus = "completed";
  } else if (job.status === "failed") {
    thread.executionState.workerStatus = "blocked";
  } else {
    thread.executionState.workerStatus = "running";
  }
  thread.executionState.updatedAt = now;
  thread.updatedAt = now;
  await upsertThreadRecord(thread);
  return { thread: normalizeThread(thread), job };
}

export async function getThreadExecutionWorkerJob(
  userId: string,
  threadId: string,
  jobId: string,
  orgId?: string,
): Promise<ContinuityWorkerJob | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  return thread.executionState.workerJobs.find((entry) => entry.id === jobId) ?? null;
}

export async function retryThreadExecutionWorkerJob(
  userId: string,
  threadId: string,
  jobId: string,
  orgId?: string,
): Promise<{ thread: ContinuityThread; job: ContinuityWorkerJob } | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const previous = thread.executionState.workerJobs.find((entry) => entry.id === jobId);
  if (!previous || previous.status !== "failed") return null;
  const targetStep = getStepById(thread, previous.stepId);
  if (targetStep && targetStep.status === "failed") {
    targetStep.status = "pending";
    targetStep.completedAt = undefined;
    targetStep.failureReason = undefined;
  }
  const retry: ContinuityWorkerJob = {
    id: `mythic_job_${randomUUID().slice(0, 12)}`,
    threadId: thread.id,
    ...(previous.stepId ? { stepId: previous.stepId } : {}),
    ...(previous.role ? { role: previous.role } : {}),
    status: "queued",
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    ...(previous.reviewDecision ? { reviewDecision: previous.reviewDecision } : {}),
    ...(previous.note ? { note: previous.note } : {}),
  };
  thread.executionState.workerJobs.unshift(retry);
  if (thread.executionState.workerJobs.length > 100) {
    thread.executionState.workerJobs.length = 100;
  }
  thread.executionState.workerStatus = "queued";
  thread.executionState.workerJobId = retry.id;
  thread.executionState.queuedAt = now;
  thread.executionState.lastWorkerError = undefined;
  thread.executionState.blockedReason = undefined;
  thread.executionState.status = "running";
  thread.executionState.updatedAt = now;
  thread.updatedAt = now;
  appendExecutionLog(thread, "warn", `Retry queued for Mythic worker job ${previous.id}`);
  await upsertThreadRecord(thread);
  return { thread: normalizeThread(thread), job: retry };
}

export async function setThreadAutonomousStage(
  userId: string,
  threadId: string,
  input: {
    stage: ContinuityAutonomousStage;
    status: ContinuityAutonomousStageStatus;
  },
  orgId?: string,
): Promise<ContinuityThread | null> {
  const thread = await getThreadRecord(userId, threadId, orgId);
  if (!thread) return null;
  thread.autonomousStage = input.stage;
  thread.autonomousStageStatus = input.status;
  const now = new Date().toISOString();
  thread.executionState.currentStage = input.stage;
  thread.executionState.status =
    input.status === "completed"
      ? "completed"
      : input.status === "blocked"
        ? "blocked"
        : input.status === "running"
          ? "running"
          : "idle";
  thread.executionState.updatedAt = now;
  thread.autonomousStageUpdatedAt = now;
  thread.updatedAt = now;
  pushTimeline(thread, "execution", `Autonomous ${input.stage} → ${input.status}`);
  appendExecutionLog(thread, "info", `Autonomous stage ${input.stage} is ${input.status}`);
  await upsertThreadRecord(thread);
  return normalizeThread(thread);
}

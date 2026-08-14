import { Router, type Request } from "express";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import {
  addContinuityCheckpoint,
  advanceThreadExecutionStep,
  appendThreadExecutionLog,
  approveContinuityCheckpoint,
  completeThreadExecutionStepById,
  createContinuityThread,
  createThreadArtifact,
  createThreadHandoff,
  failThreadExecutionStepById,
  getContinuityThread,
  getThreadExecutionState,
  getThreadArtifact,
  linkThreadPullRequest,
  listThreadArtifacts,
  listThreadHandoffs,
  listContinuityThreads,
  pauseThreadExecution,
  recordContinuityRetrieval,
  requestThreadExecutionRevision,
  setThreadExecutionPlan,
  setThreadAutonomousStage,
  startThreadExecutionStepById,
  startThreadExecutionTask,
  startThreadExecution,
  updateContinuityThread,
  updateThreadDesktopSession,
} from "../../lib/continuity/continuityThreadStore";
import {
  createFileChangeProposal,
  getFileChangeProposal,
  listFileChangeProposals,
  markFileChangeApplied,
  reviewFileChangeProposal,
} from "../../lib/continuity/fileChangeProposalStore";
import type { FileChangeProposal } from "../../lib/continuity/fileChangeProposalStore";
import { runContinueFlowLangGraph } from "../../lib/workflows/continueGraphLangGraph";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  ActivatePlanSchema,
  AdvanceStepSchema,
  ApproveCheckpointSchema,
  CheckpointSchema,
  ContinueThreadSchema,
  CaptureDesktopSchema,
  CreateArtifactSchema,
  CompleteExecutionStepSchema,
  DesktopInputSchema,
  CreateHandoffSchema,
  CreateFileChangeSchema,
  CreateThreadSchema,
  EnqueueMythicWorkerSchema,
  FailExecutionStepSchema,
  GeneratePlanSchema,
  LinkPrSchema,
  ListFileChangesQuerySchema,
  ListArtifactsQuerySchema,
  ListHandoffsQuerySchema,
  ListThreadsQuerySchema,
  MarkFileChangeAppliedSchema,
  OpenShellSessionSchema,
  OrchestrateExecutionSchema,
  RecordRetrievalSchema,
  ResolveArtifactQuerySchema,
  RequestExecutionRevisionSchema,
  RetryWorkerJobSchema,
  SetAutonomousStageSchema,
  SetPlanSchema,
  StartDesktopSchema,
  StartExecutionStepSchema,
  StartExecutionTaskSchema,
  StopDesktopSchema,
  SubmitShellPromptSchema,
  SubmitReviewDecisionSchema,
  RunShellCommandSchema,
  ShellDimensionsSchema,
  UpdateThreadSchema,
  UpdateDesktopSessionSchema,
  WakeDesktopSchema,
} from "../schemas/runtime.schema";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import { tenantFromRequest } from "./tenant";
import type { ContinuityPlannerResult, ContinuityUsedMemory } from "../../lib/memory/continuityPlanner";
import { activateMythicPlan } from "../../lib/continuity/activateMythicPlan";
import { orchestrateMythicNext } from "../../lib/continuity/mythicOrchestrator";
import { enqueueMythicWorkerJob, getMythicWorkerJob, retryMythicWorkerJob } from "../../lib/continuity/mythicWorker";
import { artifactRegistry } from "../../services/artifactRegistry";
import { memoryostmShellSessionManager } from "../services/memoryostmShellSessionManager";
import { getDesktopProviderAdapter } from "../services/desktop-provider";
import {
  recordDesktopLifecycleMetric,
  recordDesktopProviderHealthMetric,
} from "../observability/metrics";
import path from "node:path";
import { existsSync } from "node:fs";

export const runtimeRouter = Router();
type RuntimeUiEvent =
  | { kind: "message"; payload: { id: string; role: "user" | "agent" | "system"; text: string; timestamp: string } }
  | { kind: "file_change"; payload: { id: string; path: string; kind: "edit" | "write"; detail?: string; content?: string } }
  | { kind: "worklog"; payload: { id: string; label: string; detail?: string; timestamp: string } }
  | { kind: "shell"; payload: { id: string; command: string; timestamp: string } }
  | { kind: "pr_status"; payload: { status: "pending" | "passed" | "failed" | "merged"; number?: number; url?: string | null } }
  | {
      kind: "pr_ready";
      payload: {
        id: string;
        type: "pr_ready";
        url: string;
        number?: number;
        title: string;
        branch?: string;
        baseBranch?: string;
        ciStatus: "pending" | "passed" | "failed" | "merged";
        filesChanged?: number;
        additions?: number;
        deletions?: number;
        timestamp: string;
      };
    }
  | { kind: "desktop_status"; payload: { status: "idle" | "starting" | "live" | "error"; runtimeMessage?: string | null } }
  | { kind: "desktop_preview_url"; payload: { previewUrl: string | null; controlUrl?: string | null } };

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function toThreadProvenance(memory: ContinuityUsedMemory) {
  const label = memory.summary || memory.content || memory.id;
  return {
    label: truncate(label, 300),
    sourceType: memory.source || memory.contractCategory || memory.memoryType || "memory",
    memoryId: memory.id,
    snippet: truncate(memory.content, 2000),
    score: Number(memory.finalScore.toFixed(3)),
  };
}

function summarizeContinuation(result: ContinuityPlannerResult): string {
  const plan = result.nextActions.length
    ? `Plan: ${result.nextActions.join(" | ")}`
    : "Plan: no next actions generated";
  const memories = result.usedMemories.length
    ? `Sources: ${result.usedMemories.map((memory) => memory.id).slice(0, 8).join(", ")}`
    : "Sources: no matching memory found";
  return `${plan}\n${memories}`;
}

function runtimeStateToDesktopStatus(
  state: string | null | undefined,
): "idle" | "starting" | "live" | "error" {
  if (state === "running") return "live";
  if (state === "blocked") return "error";
  if (state === "paused") return "idle";
  return "starting";
}

function isHttpUrl(value: string | null | undefined): value is string {
  if (typeof value !== "string") return false;
  return /^https?:\/\//i.test(value.trim());
}

const DEFAULT_DESKTOP_SCREENSHOT_MAX_BYTES = 2 * 1024 * 1024;

function parseUrlOrigin(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

function getAllowedDesktopScreenshotOrigins(): Set<string> {
  const allowed = new Set<string>();
  const configured = process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_FETCH_ALLOWED_ORIGINS;
  for (const item of configured?.split(",") ?? []) {
    const origin = parseUrlOrigin(item);
    if (origin) allowed.add(origin);
  }
  const providerOrigin = parseUrlOrigin(process.env.MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL);
  if (providerOrigin) allowed.add(providerOrigin);
  return allowed;
}

function getDesktopScreenshotMaxBytes(): number {
  const configured = Number(process.env.MEMORYOSTM_DESKTOP_SCREENSHOT_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? Math.min(configured, 10 * 1024 * 1024)
    : DEFAULT_DESKTOP_SCREENSHOT_MAX_BYTES;
}

function isDesktopScreenshotFetchAllowed(rawUrl: string): boolean {
  const origin = parseUrlOrigin(rawUrl);
  if (!origin) return false;
  if (getAllowedDesktopScreenshotOrigins().has(origin)) return true;
  return process.env.NODE_ENV !== "production" && isLoopbackOrigin(origin);
}

async function resolveDesktopScreenshotArtifactContent(screenshot: {
  imageUrl: string;
  contentType?: string;
}): Promise<{ content: string; tags: string[]; descriptionNote?: string }> {
  const fallback = {
    content: screenshot.imageUrl,
    tags: ["linked-proof"],
    descriptionNote: "Screenshot proof is stored as a token-scoped link.",
  };
  if (!isDesktopScreenshotFetchAllowed(screenshot.imageUrl)) return fallback;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(screenshot.imageUrl, {
      method: "GET",
      headers: { accept: "image/png,image/jpeg,image/webp,image/*;q=0.9,*/*;q=0.1" },
      signal: controller.signal,
    });
    if (!response.ok) return fallback;

    const contentType = response.headers.get("content-type") ?? screenshot.contentType ?? "";
    if (!/^image\//i.test(contentType)) return fallback;

    const maxBytes = getDesktopScreenshotMaxBytes();
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return {
        ...fallback,
        descriptionNote: `Screenshot proof link saved because the image exceeded ${maxBytes} bytes.`,
      };
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) {
      return {
        ...fallback,
        descriptionNote: `Screenshot proof link saved because the image exceeded ${maxBytes} bytes.`,
      };
    }
    return {
      content: `data:${contentType};base64,${bytes.toString("base64")}`,
      tags: ["persisted-proof"],
      descriptionNote: "Screenshot proof image persisted at capture time.",
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function resolveThreadDesktopPreviewUrl(
  thread: Awaited<ReturnType<typeof getContinuityThread>>,
): string | null {
  if (!thread) return null;
  if (isHttpUrl(thread.desktopSession?.previewUrl)) return thread.desktopSession.previewUrl.trim();
  for (const artifact of thread.artifacts ?? []) {
    if (artifact.type !== "preview") continue;
    if (isHttpUrl(artifact.content)) return artifact.content.trim();
    if (isHttpUrl(artifact.description)) return artifact.description.trim();
    if (isHttpUrl(artifact.uri)) return artifact.uri.trim();
  }
  return null;
}

function resolveThreadDesktopControlUrl(
  thread: Awaited<ReturnType<typeof getContinuityThread>>,
): string | null {
  if (!thread) return null;
  if (isHttpUrl(thread.desktopSession?.controlUrl)) return thread.desktopSession.controlUrl.trim();
  return resolveThreadDesktopPreviewUrl(thread);
}

function extractPullRequestNumber(url: string | null | undefined): number | undefined {
  if (!url) return undefined;
  const match = url.match(/\/pull\/(\d+)/i);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function derivePrCiStatus(
  thread: NonNullable<Awaited<ReturnType<typeof getContinuityThread>>>,
): "pending" | "passed" | "failed" | "merged" {
  if (thread.autonomousStage === "pr" && thread.autonomousStageStatus === "completed") {
    return "passed";
  }
  if (thread.runtimeState === "blocked") return "failed";
  return "pending";
}

function estimateDiffLines(
  original: string,
  updated: string,
): { additions: number; deletions: number } {
  const oldLines = original.split("\n").length;
  const newLines = updated.split("\n").length;
  if (newLines >= oldLines) {
    return { additions: newLines - oldLines, deletions: 0 };
  }
  return { additions: 0, deletions: oldLines - newLines };
}

function buildPrReadyPayload(
  thread: NonNullable<Awaited<ReturnType<typeof getContinuityThread>>>,
  changes: FileChangeProposal[],
  prUrl: string,
) {
  const number = extractPullRequestNumber(prUrl);
  const uniqueFiles = new Set(changes.map((change) => change.filepath));
  let additions = 0;
  let deletions = 0;
  for (const change of changes) {
    const delta = estimateDiffLines(change.originalText ?? "", change.newText ?? "");
    additions += delta.additions;
    deletions += delta.deletions;
  }

  return {
    id: `pr-ready-${number ?? thread.id}`,
    type: "pr_ready" as const,
    url: prUrl,
    number,
    title:
      thread.autonomousStage === "pr"
        ? `MemoryOS Mythic: ${thread.title}`.slice(0, 120)
        : thread.title,
    baseBranch: "main",
    ciStatus: derivePrCiStatus(thread),
    filesChanged: uniqueFiles.size > 0 ? uniqueFiles.size : undefined,
    additions: additions > 0 ? additions : undefined,
    deletions: deletions > 0 ? deletions : undefined,
    timestamp: thread.updatedAt,
  };
}

function buildRuntimeEvents(
  thread: Awaited<ReturnType<typeof getContinuityThread>>,
  changes: FileChangeProposal[],
): RuntimeUiEvent[] {
  if (!thread) return [];
  const events: Array<{ at: string; event: RuntimeUiEvent }> = [];
  const desktopPreviewUrl = resolveThreadDesktopPreviewUrl(thread);
  const desktopControlUrl = resolveThreadDesktopControlUrl(thread);

  for (const retrieval of thread.retrievals) {
    events.push({
      at: retrieval.createdAt,
      event: {
        kind: "message",
        payload: {
          id: `message-${retrieval.id}`,
          role: "user",
          text: retrieval.question,
          timestamp: retrieval.createdAt,
        },
      },
    });
  }

  for (const timeline of thread.timeline) {
    events.push({
      at: timeline.createdAt,
      event: {
        kind: "worklog",
        payload: {
          id: `worklog-${timeline.id}`,
          label: timeline.label,
          detail: timeline.kind,
          timestamp: timeline.createdAt,
        },
      },
    });
  }

  for (const artifact of thread.artifacts ?? []) {
    events.push({
      at: artifact.metadata.createdAt,
      event: {
        kind: "worklog",
        payload: {
          id: `artifact-${artifact.id}`,
          label: `Artifact ${artifact.type}`,
          detail: artifact.title,
          timestamp: artifact.metadata.createdAt,
        },
      },
    });
  }

  for (const handoff of thread.handoffs ?? []) {
    events.push({
      at: handoff.timestamp,
      event: {
        kind: "worklog",
        payload: {
          id: `handoff-${handoff.id}`,
          label: `Handoff ${handoff.source} -> ${handoff.target}`,
          detail: handoff.taskId,
          timestamp: handoff.timestamp,
        },
      },
    });
  }

  for (const step of thread.executionState?.steps ?? []) {
    const timestamp = step.completedAt ?? step.startedAt;
    if (!timestamp) continue;
    events.push({
      at: timestamp,
      event: {
        kind: "worklog",
        payload: {
          id: `execution-step-${step.id}`,
          label: `${step.role} · ${step.label}`,
          detail: `${step.stage} · ${step.status}`,
          timestamp,
        },
      },
    });
  }

  for (const entry of thread.executionLog) {
    events.push({
      at: entry.at,
      event: {
        kind: "worklog",
        payload: {
          id: `execution-${entry.id}`,
          label: entry.level === "error" ? "Error" : "Execution",
          detail: entry.message,
          timestamp: entry.at,
        },
      },
    });
    events.push({
      at: entry.at,
      event: {
        kind: "shell",
        payload: {
          id: `shell-${entry.id}`,
          command: entry.message,
          timestamp: entry.at,
        },
      },
    });
  }

  for (const change of changes) {
    events.push({
      at: change.createdAt,
      event: {
        kind: "file_change",
        payload: {
          id: `change-${change.id}`,
          path: change.filepath,
          kind: change.status === "applied" ? "write" : "edit",
          detail: change.instruction ?? change.status,
          content: change.newText,
        },
      },
    });
  }

  const latestPr = thread.linkedPrs.length > 0 ? thread.linkedPrs[thread.linkedPrs.length - 1] : null;
  if (latestPr) {
    const ciStatus = derivePrCiStatus(thread);
    events.push({
      at: thread.updatedAt,
      event: {
        kind: "pr_ready",
        payload: buildPrReadyPayload(thread, changes, latestPr),
      },
    });
    events.push({
      at: thread.updatedAt,
      event: {
        kind: "pr_status",
        payload: {
          status: ciStatus,
          number: extractPullRequestNumber(latestPr),
          url: latestPr,
        },
      },
    });
  }

  events.push({
    at: thread.updatedAt,
    event: {
      kind: "desktop_status",
      payload: {
        status:
          desktopPreviewUrl && thread.runtimeState === "running"
            ? "live"
            : runtimeStateToDesktopStatus(thread.runtimeState),
        runtimeMessage:
          thread.desktopSession?.runtimeMessage ??
          (thread.runtimeState === "blocked"
            ? thread.executionState?.lastWorkerError ??
              thread.executionState?.failureReason ??
              "Runtime blocked by execution failure."
            : desktopPreviewUrl
              ? "Runtime active. Desktop preview attached."
              : thread.runtimeState === "running"
                ? "Runtime active. Waiting for desktop preview."
                : thread.runtimeState === "paused"
                  ? "Runtime paused."
                  : "Runtime waiting.")
      },
    },
  });
  events.push({
    at: thread.updatedAt,
    event: {
      kind: "desktop_preview_url",
      payload: {
        previewUrl: desktopPreviewUrl,
        controlUrl: desktopControlUrl,
      },
    },
  });
  if (desktopControlUrl) {
    events.push({
      at: thread.updatedAt,
      event: {
        kind: "worklog",
        payload: {
          id: `desktop-control-${thread.id}`,
          label: "Desktop control entry ready",
          detail: thread.desktopSession?.provider
            ? `Provider ${thread.desktopSession.provider}`
            : "Preview control target available",
          timestamp: thread.updatedAt,
        },
      },
    });
  }

  return events
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((entry) => entry.event);
}

runtimeRouter.get(
  "/threads",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ListThreadsQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid query", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const tenant = tenantFromRequest(req);
    const threads = await listContinuityThreads({
      userId: tenant.userId,
      ...(tenant.orgId ? { orgId: tenant.orgId } : {}),
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    });

    sendApiSuccess(res, 200, { threads }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = CreateThreadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const tenant = tenantFromRequest(req);
    const thread = await createContinuityThread({
      userId: tenant.userId,
      ...(tenant.orgId ? { orgId: tenant.orgId } : {}),
      title: parsed.data.title,
      goal: parsed.data.goal,
      workspace: parsed.data.workspace,
      project: parsed.data.project,
      repoPath: parsed.data.repoPath,
    });

    sendApiSuccess(res, 201, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/threads/:id",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/threads/:id/desktop",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(
      res,
      200,
      {
        desktop: {
          ...(thread.desktopSession ?? {}),
          previewUrl: resolveThreadDesktopPreviewUrl(thread),
          controlUrl: resolveThreadDesktopControlUrl(thread),
        },
        thread,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.patch(
  "/threads/:id/desktop",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = UpdateDesktopSessionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const thread = await updateThreadDesktopSession(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data,
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(
      res,
      200,
      {
        desktop: {
          ...(thread.desktopSession ?? {}),
          previewUrl: resolveThreadDesktopPreviewUrl(thread),
          controlUrl: resolveThreadDesktopControlUrl(thread),
        },
        thread,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

async function persistDesktopProviderSession(
  userId: string,
  threadId: string,
  session: {
    provider: "preview" | "browser" | "vscode" | "playwright" | "custom";
    state: "idle" | "starting" | "live" | "stale" | "blocked" | "error";
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
  },
) {
  return updateThreadDesktopSession(userId, threadId, {
    provider: session.provider,
    state: session.state,
    osType: session.osType,
    ...(session.previewUrl ? { previewUrl: session.previewUrl } : {}),
    ...(session.controlUrl ? { controlUrl: session.controlUrl } : {}),
    ...(session.providerSessionId ? { providerSessionId: session.providerSessionId } : {}),
    ...(session.sessionAuthToken ? { sessionAuthToken: session.sessionAuthToken } : {}),
    ...(session.sessionAuthExpiresAt ? { sessionAuthExpiresAt: session.sessionAuthExpiresAt } : {}),
    ...(session.resumeToken ? { resumeToken: session.resumeToken } : {}),
    ...(typeof session.resumeSupported === "boolean" ? { resumeSupported: session.resumeSupported } : {}),
    ...(session.transportMode ? { transportMode: session.transportMode } : {}),
    ...(session.nodeId ? { nodeId: session.nodeId } : {}),
    ...(session.runtimeMessage ? { runtimeMessage: session.runtimeMessage } : {}),
    ...(session.previewArtifactId ? { previewArtifactId: session.previewArtifactId } : {}),
    ...(session.recordingArtifactId ? { recordingArtifactId: session.recordingArtifactId } : {}),
    ...(session.lastFrameAt ? { lastFrameAt: session.lastFrameAt } : {}),
  });
}

async function persistDesktopProviderFailure(
  userId: string,
  threadId: string,
  osType: "ubuntu" | "windows",
  existingSession: NonNullable<Awaited<ReturnType<typeof getContinuityThread>>>["desktopSession"],
  message: string,
) {
  return updateThreadDesktopSession(userId, threadId, {
    provider: existingSession?.provider ?? "browser",
    state: "error",
    osType,
    ...(existingSession?.previewUrl ? { previewUrl: existingSession.previewUrl } : {}),
    ...(existingSession?.controlUrl ? { controlUrl: existingSession.controlUrl } : {}),
    ...(existingSession?.providerSessionId ? { providerSessionId: existingSession.providerSessionId } : {}),
    ...(existingSession?.sessionAuthToken ? { sessionAuthToken: existingSession.sessionAuthToken } : {}),
    ...(existingSession?.sessionAuthExpiresAt ? { sessionAuthExpiresAt: existingSession.sessionAuthExpiresAt } : {}),
    ...(existingSession?.resumeToken ? { resumeToken: existingSession.resumeToken } : {}),
    ...(typeof existingSession?.resumeSupported === "boolean" ? { resumeSupported: existingSession.resumeSupported } : {}),
    ...(existingSession?.transportMode ? { transportMode: existingSession.transportMode } : {}),
    ...(existingSession?.nodeId ? { nodeId: existingSession.nodeId } : {}),
    ...(existingSession?.previewArtifactId ? { previewArtifactId: existingSession.previewArtifactId } : {}),
    ...(existingSession?.recordingArtifactId ? { recordingArtifactId: existingSession.recordingArtifactId } : {}),
    runtimeMessage: message,
  });
}

function resolveThreadShellCwd(
  thread: NonNullable<Awaited<ReturnType<typeof getContinuityThread>>>,
): string {
  const allowedRoots = resolveAllowedShellRoots();
  const repoPath = thread.repoPath?.trim();
  if (repoPath) {
    const absoluteRepoPath = path.isAbsolute(repoPath)
      ? repoPath
      : path.resolve(process.cwd(), repoPath);
    if (existsSync(absoluteRepoPath) && isPathInsideAllowedRoots(absoluteRepoPath, allowedRoots)) {
      return absoluteRepoPath;
    }
  }
  return allowedRoots[0] ?? process.cwd();
}

function resolveAllowedShellRoots(): string[] {
  const configured = process.env.MEMORYOSTM_ALLOWED_SHELL_ROOTS?.split(path.delimiter)
    .map((value) => value.trim())
    .filter(Boolean) ?? [];
  const roots = configured.length > 0 ? configured : [process.cwd()];
  return roots.map((root) => path.resolve(root));
}

function isPathInsideAllowedRoots(targetPath: string, allowedRoots: string[]): boolean {
  const normalizedTarget = path.resolve(targetPath);
  return allowedRoots.some((root) => {
    const normalizedRoot = path.resolve(root);
    const relative = path.relative(normalizedRoot, normalizedTarget);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  });
}

function buildShellWebSocketUrl(req: Request, ticket: string): string {
  const protocol = req.protocol === "https" ? "wss" : "ws";
  return `${protocol}://${req.get("host")}/ws/runtime/memoryostm-shell?ticket=${encodeURIComponent(ticket)}`;
}

type MemoryOSTMShellRuntimeState = "working" | "waiting" | "missing";

type RawShellSyncEntry = {
  id?: string;
  at?: string;
  hookEventName?: string;
  toolName?: string | null;
  title?: string | null;
  detail?: string | null;
  output?: string | null;
  state?: MemoryOSTMShellRuntimeState;
  entryKind?: "command" | "runtime" | "prompt" | "session";
};

function safeParseShellSyncEntry(line: string): RawShellSyncEntry | null {
  try {
    return JSON.parse(line) as RawShellSyncEntry;
  } catch {
    return null;
  }
}

function mapShellSyncEntry(entry: RawShellSyncEntry, index: number) {
  return {
    id: entry.id ?? `memoryostm-shell-${index}`,
    at: entry.at ?? new Date().toISOString(),
    title: entry.title ?? entry.hookEventName ?? "Runtime event",
    detail: entry.detail ?? null,
    output: entry.output ?? null,
    kind: entry.entryKind ?? "runtime",
    state: entry.state ?? "waiting",
    hookEventName: entry.hookEventName ?? "Unknown",
    toolName: entry.toolName ?? null,
  };
}

function buildShellSyncSummary(entries: Array<{ kind: string; toolName: string | null; detail: string | null }>): string | null {
  const latest = entries.at(-1);
  if (!latest) return null;
  const bits = [
    latest.kind === "command"
      ? "Latest command completed"
      : latest.kind === "prompt"
        ? "Prompt forwarded to MemoryOSTM"
        : latest.kind === "session"
          ? "Session lifecycle updated"
          : "Runtime activity captured",
    latest.toolName ? `tool ${latest.toolName}` : null,
    latest.detail,
  ].filter(Boolean);
  return bits.join(" · ");
}

runtimeRouter.post(
  "/threads/:id/desktop/start",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = StartDesktopSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const osType = parsed.data.osType ?? existing.desktopSession?.osType ?? "ubuntu";
    let thread: Awaited<ReturnType<typeof getContinuityThread>> | null = null;
    try {
      const provider = getDesktopProviderAdapter();
      const desktopSession =
        existing.desktopSession?.resumeSupported === false
          ? await provider.startOrWakeSession({
              threadId,
              osType,
              existingSession: existing.desktopSession ?? null,
            })
          : await provider.resumeSession({
              threadId,
              osType,
              existingSession: existing.desktopSession ?? null,
            });
      thread = await persistDesktopProviderSession(req.authUserId, threadId, desktopSession);
      recordDesktopLifecycleMetric({
        operation: "start",
        result: "success",
        provider: desktopSession.provider,
        osType: desktopSession.osType,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Desktop provider failed to start.";
      await persistDesktopProviderFailure(
        req.authUserId,
        threadId,
        osType,
        existing.desktopSession,
        message,
      );
      sendApiError(
        res,
        502,
        { code: "DESKTOP_PROVIDER_UNAVAILABLE", message },
        buildApiMeta(req, startedAt),
      );
      recordDesktopLifecycleMetric({
        operation: "start",
        result: "error",
        provider: existing.desktopSession?.provider ?? "unknown",
        osType,
        durationMs: Date.now() - startedAt,
      });
      return;
    }
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        desktop: {
          ...(thread.desktopSession ?? {}),
          previewUrl: resolveThreadDesktopPreviewUrl(thread),
          controlUrl: resolveThreadDesktopControlUrl(thread),
        },
        thread,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.post(
  "/threads/:id/desktop/wake",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = WakeDesktopSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const osType = parsed.data.osType ?? existing.desktopSession?.osType ?? "ubuntu";
    let thread: Awaited<ReturnType<typeof getContinuityThread>> | null = null;
    try {
      const provider = getDesktopProviderAdapter();
      const desktopSession =
        existing.desktopSession?.resumeSupported === false
          ? await provider.startOrWakeSession({
              threadId,
              osType,
              existingSession: existing.desktopSession ?? null,
            })
          : await provider.resumeSession({
              threadId,
              osType,
              existingSession: existing.desktopSession ?? null,
            });
      thread = await persistDesktopProviderSession(req.authUserId, threadId, desktopSession);
      recordDesktopLifecycleMetric({
        operation: "wake",
        result: "success",
        provider: desktopSession.provider,
        osType: desktopSession.osType,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Desktop provider failed to wake.";
      await persistDesktopProviderFailure(
        req.authUserId,
        threadId,
        osType,
        existing.desktopSession,
        message,
      );
      sendApiError(
        res,
        502,
        { code: "DESKTOP_PROVIDER_UNAVAILABLE", message },
        buildApiMeta(req, startedAt),
      );
      recordDesktopLifecycleMetric({
        operation: "wake",
        result: "error",
        provider: existing.desktopSession?.provider ?? "unknown",
        osType,
        durationMs: Date.now() - startedAt,
      });
      return;
    }
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        desktop: {
          ...(thread.desktopSession ?? {}),
          previewUrl: resolveThreadDesktopPreviewUrl(thread),
          controlUrl: resolveThreadDesktopControlUrl(thread),
        },
        thread,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.get(
  "/threads/:id/shell",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const snapshot = memoryostmShellSessionManager.getSnapshot(threadId);
    sendApiSuccess(
      res,
      200,
      {
        shell: snapshot,
        cwd: resolveThreadShellCwd(thread),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.get(
  "/threads/:id/desktop/status",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const osType = existing.desktopSession?.osType ?? "ubuntu";
    let thread: Awaited<ReturnType<typeof getContinuityThread>> | null = null;
    try {
      const provider = getDesktopProviderAdapter();
      const desktopSession = await provider.getSessionStatus({
        threadId,
        osType,
        existingSession: existing.desktopSession ?? null,
      });
      thread = await persistDesktopProviderSession(req.authUserId, threadId, desktopSession);
      recordDesktopLifecycleMetric({
        operation: "status",
        result: "success",
        provider: desktopSession.provider,
        osType: desktopSession.osType,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Desktop provider status failed.";
      await persistDesktopProviderFailure(
        req.authUserId,
        threadId,
        osType,
        existing.desktopSession,
        message,
      );
      sendApiError(
        res,
        502,
        { code: "DESKTOP_PROVIDER_UNAVAILABLE", message },
        buildApiMeta(req, startedAt),
      );
      recordDesktopLifecycleMetric({
        operation: "status",
        result: "error",
        provider: existing.desktopSession?.provider ?? "unknown",
        osType,
        durationMs: Date.now() - startedAt,
      });
      return;
    }
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        desktop: {
          ...(thread.desktopSession ?? {}),
          previewUrl: resolveThreadDesktopPreviewUrl(thread),
          controlUrl: resolveThreadDesktopControlUrl(thread),
        },
        thread,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.post(
  "/threads/:id/desktop/stop",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = StopDesktopSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const osType = parsed.data.osType ?? existing.desktopSession?.osType ?? "ubuntu";
    let thread: Awaited<ReturnType<typeof getContinuityThread>> | null = null;
    try {
      const provider = getDesktopProviderAdapter();
      const desktopSession = await provider.stopSession({
        threadId,
        osType,
        existingSession: existing.desktopSession ?? null,
      });
      thread = await persistDesktopProviderSession(req.authUserId, threadId, desktopSession);
      recordDesktopLifecycleMetric({
        operation: "stop",
        result: "success",
        provider: desktopSession.provider,
        osType: desktopSession.osType,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Desktop provider failed to stop.";
      await persistDesktopProviderFailure(
        req.authUserId,
        threadId,
        osType,
        existing.desktopSession,
        message,
      );
      sendApiError(
        res,
        502,
        { code: "DESKTOP_PROVIDER_UNAVAILABLE", message },
        buildApiMeta(req, startedAt),
      );
      recordDesktopLifecycleMetric({
        operation: "stop",
        result: "error",
        provider: existing.desktopSession?.provider ?? "unknown",
        osType,
        durationMs: Date.now() - startedAt,
      });
      return;
    }
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        desktop: {
          ...(thread.desktopSession ?? {}),
          previewUrl: resolveThreadDesktopPreviewUrl(thread),
          controlUrl: resolveThreadDesktopControlUrl(thread),
        },
        thread,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.post(
  "/threads/:id/desktop/input",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = DesktopInputSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const osType = parsed.data.osType ?? existing.desktopSession?.osType ?? "ubuntu";
    try {
      const provider = getDesktopProviderAdapter();
      const result = await provider.sendInput({
        threadId,
        osType,
        existingSession: existing.desktopSession ?? null,
        event: parsed.data.event,
      });
      sendApiSuccess(
        res,
        200,
        { input: result },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Desktop input bridge failed.";
      await persistDesktopProviderFailure(
        req.authUserId,
        threadId,
        osType,
        existing.desktopSession,
        message,
      );
      sendApiError(
        res,
        502,
        { code: "DESKTOP_PROVIDER_UNAVAILABLE", message },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

runtimeRouter.get(
  "/threads/:id/desktop/stream",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const osType = existing.desktopSession?.osType ?? "ubuntu";
    try {
      const provider = getDesktopProviderAdapter();
      const stream = await provider.getStreamState({
        threadId,
        osType,
        existingSession: existing.desktopSession ?? null,
      });
      sendApiSuccess(
        res,
        200,
        { stream },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Desktop stream state unavailable.";
      await persistDesktopProviderFailure(
        req.authUserId,
        threadId,
        osType,
        existing.desktopSession,
        message,
      );
      sendApiError(
        res,
        502,
        { code: "DESKTOP_PROVIDER_UNAVAILABLE", message },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

runtimeRouter.post(
  "/threads/:id/desktop/screenshot",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = CaptureDesktopSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const osType = parsed.data.osType ?? existing.desktopSession?.osType ?? "ubuntu";
    try {
      const provider = getDesktopProviderAdapter();
      const screenshot = await provider.captureScreenshot({
        threadId,
        osType,
        existingSession: existing.desktopSession ?? null,
      });
      if (!screenshot.captured || !screenshot.imageUrl) {
        sendApiSuccess(
          res,
          200,
          {
            screenshot,
            artifact: null,
            thread: existing,
          },
          buildApiMeta(req, startedAt),
        );
        recordDesktopLifecycleMetric({
          operation: "capture",
          result: "success",
          provider: existing.desktopSession?.provider ?? "unknown",
          osType,
          durationMs: Date.now() - startedAt,
        });
        return;
      }

      const screenshotArtifactContent =
        await resolveDesktopScreenshotArtifactContent({
          imageUrl: screenshot.imageUrl,
          contentType: screenshot.contentType,
        });
      const description = [
        screenshot.message ?? "Captured from the live desktop session.",
        screenshotArtifactContent.descriptionNote,
      ].filter(Boolean).join(" ");
      const created = await createThreadArtifact(req.authUserId, threadId, {
        type: "preview",
        producer: "verifier",
        consumers: ["manager", "reviewer"],
        title: `Desktop screenshot proof (${osType})`,
        description,
        content: screenshotArtifactContent.content,
        tags: [
          "desktop",
          "screenshot",
          "visual-proof",
          osType,
          ...screenshotArtifactContent.tags,
        ],
        stage: "verify",
        verificationRequired: false,
        sourceProvider: existing.desktopSession?.provider ?? "browser",
      });
      if (!created) {
        sendApiError(
          res,
          404,
          { code: "NOT_FOUND", message: "Thread not found" },
          buildApiMeta(req, startedAt),
        );
        return;
      }

      recordDesktopLifecycleMetric({
        operation: "capture",
        result: "success",
        provider: existing.desktopSession?.provider ?? "unknown",
        osType,
        durationMs: Date.now() - startedAt,
      });
      sendApiSuccess(
        res,
        201,
        {
          screenshot,
          artifact: created.artifact,
          thread: created.thread,
        },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Desktop screenshot capture failed.";
      await persistDesktopProviderFailure(
        req.authUserId,
        threadId,
        osType,
        existing.desktopSession,
        message,
      );
      recordDesktopLifecycleMetric({
        operation: "capture",
        result: "error",
        provider: existing.desktopSession?.provider ?? "unknown",
        osType,
        durationMs: Date.now() - startedAt,
      });
      sendApiError(
        res,
        502,
        { code: "DESKTOP_PROVIDER_UNAVAILABLE", message },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

runtimeRouter.get(
  "/desktop/provider-health",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const provider = getDesktopProviderAdapter();
    const providerHealth = await provider.healthCheck();
    recordDesktopProviderHealthMetric({
      provider: providerHealth.provider,
      healthy: providerHealth.healthy,
    });
    sendApiSuccess(res, 200, { providerHealth }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/shell/open",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = OpenShellSessionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const cwd = resolveThreadShellCwd(thread);
    const snapshot = await memoryostmShellSessionManager.openSession(threadId, cwd, {
      cols: parsed.data.cols,
      rows: parsed.data.rows,
    });
    const ticket = memoryostmShellSessionManager.createTicket(threadId);
    sendApiSuccess(
      res,
      200,
      {
        shell: snapshot,
        wsUrl: buildShellWebSocketUrl(req, ticket),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.get(
  "/threads/:id/shell/sync",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const cwd = resolveThreadShellCwd(thread);
    const runtimeDir = path.join(cwd, ".memoryostm");
    const logPath = path.join(runtimeDir, "runtime", "cli-events.jsonl");
    const hooksPath = path.join(runtimeDir, "hooks.v1.json");
    let installed = false;

    try {
      await access(hooksPath, constants.F_OK);
      installed = true;
    } catch {
      // Hooks are optional for thread-scoped sync.
    }

    try {
      const raw = await readFile(logPath, "utf8");
      const entries = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(safeParseShellSyncEntry)
        .filter((entry): entry is RawShellSyncEntry => Boolean(entry))
        .slice(-250)
        .map(mapShellSyncEntry)
        .sort((a, b) => a.at.localeCompare(b.at));
      installed = true;

      sendApiSuccess(
        res,
        200,
        {
          shell: {
            installed: true,
            state: entries.at(-1)?.state ?? "waiting",
            summary: buildShellSyncSummary(entries),
            lastUpdatedAt: entries.at(-1)?.at ?? null,
            logPath,
            entries,
          },
        },
        buildApiMeta(req, startedAt),
      );
      return;
    } catch {
      sendApiSuccess(
        res,
        200,
        {
          shell: {
            installed,
            state: installed ? "waiting" : "missing",
            summary: installed ? `Shell hook installed at ${hooksPath}` : null,
            lastUpdatedAt: null,
            logPath,
            entries: [],
          },
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

runtimeRouter.post(
  "/threads/:id/shell/command",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = RunShellCommandSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    let snapshot = memoryostmShellSessionManager.getSnapshot(threadId);
    if (!snapshot) {
      snapshot = await memoryostmShellSessionManager.openSession(
        threadId,
        resolveThreadShellCwd(thread),
        {
          cols: parsed.data.cols,
          rows: parsed.data.rows,
        },
      );
    }
    const next = await memoryostmShellSessionManager.runCommand(threadId, parsed.data.command.trim());
    sendApiSuccess(res, 202, { shell: next }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/shell/prompt",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = SubmitShellPromptSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    let snapshot = memoryostmShellSessionManager.getSnapshot(threadId);
    if (!snapshot) {
      snapshot = await memoryostmShellSessionManager.openSession(
        threadId,
        resolveThreadShellCwd(thread),
        {
          cols: parsed.data.cols,
          rows: parsed.data.rows,
        },
      );
    }
    const next = await memoryostmShellSessionManager.recordPrompt(threadId, parsed.data.prompt.trim(), {
      currentLine: parsed.data.currentLine?.trim() || parsed.data.prompt.trim(),
      recentHistory: parsed.data.recentHistory?.trim() || null,
    });
    sendApiSuccess(res, 202, { shell: next }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/shell/close",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ShellDimensionsSchema.partial().safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    memoryostmShellSessionManager.closeSession(threadId, "Shell session closed by user.");
    sendApiSuccess(res, 200, { closed: true }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/threads/:id/events",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const tenant = tenantFromRequest(req);
    const changes = await listFileChangeProposals({
      userId: tenant.userId,
      ...(tenant.orgId ? { orgId: tenant.orgId } : {}),
      threadId,
    });
    const events = buildRuntimeEvents(thread, changes);
    const stream = String(req.query.stream ?? "").toLowerCase() === "1";

    if (!stream) {
      sendApiSuccess(res, 200, { events }, buildApiMeta(req, startedAt));
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(`data: ${JSON.stringify({ events })}\n\n`);

    const interval = setInterval(async () => {
      const latestThread = await getContinuityThread(req.authUserId, threadId);
      if (!latestThread) return;
      const latestChanges = await listFileChangeProposals({
        userId: tenant.userId,
        ...(tenant.orgId ? { orgId: tenant.orgId } : {}),
        threadId,
      });
      const latestEvents = buildRuntimeEvents(latestThread, latestChanges);
      res.write(`data: ${JSON.stringify({ events: latestEvents })}\n\n`);
    }, 2500);

    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  }),
);

runtimeRouter.get(
  "/threads/:id/execution",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const execution = await getThreadExecutionState(
      req.authUserId,
      String(req.params.id ?? ""),
    );
    if (!execution) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { execution }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.patch(
  "/threads/:id",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = UpdateThreadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await updateContinuityThread(req.authUserId, String(req.params.id ?? ""), parsed.data);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/checkpoint",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = CheckpointSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await addContinuityCheckpoint(req.authUserId, String(req.params.id ?? ""), parsed.data);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 201, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/approve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ApproveCheckpointSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await approveContinuityCheckpoint(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data.checkpointId,
      parsed.data.approved,
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread or checkpoint not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/handoffs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = CreateHandoffSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const created = await createThreadHandoff(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data,
    );
    if (!created) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(
      res,
      201,
      { handoff: created.handoff, thread: created.thread },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.get(
  "/threads/:id/handoffs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ListHandoffsQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid query", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const handoffs = await listThreadHandoffs(req.authUserId, String(req.params.id ?? ""), {
      limit: parsed.data.limit,
    });
    if (!handoffs) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(res, 200, { handoffs }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/artifacts",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = CreateArtifactSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const created = await createThreadArtifact(
      req.authUserId,
      String(req.params.id ?? ""),
      {
        type: parsed.data.type,
        producer: parsed.data.producer,
        consumers: parsed.data.consumers,
        title: parsed.data.title,
        description: parsed.data.description,
        content: parsed.data.content,
        expiresAt: parsed.data.metadata.expiresAt,
        tags: parsed.data.metadata.tags,
        stage: parsed.data.metadata.stage,
        verificationRequired: parsed.data.metadata.verificationRequired,
        sourceChangeId: parsed.data.metadata.sourceChangeId,
        sourceProvider: parsed.data.metadata.sourceProvider,
        recordingArtifactId: parsed.data.metadata.recordingArtifactId,
        sourceHandoffId: parsed.data.sourceHandoffId,
      },
    );
    if (!created) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      201,
      { artifact: created.artifact, thread: created.thread },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.get(
  "/threads/:id/artifacts",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ListArtifactsQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid query", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const artifacts = await listThreadArtifacts(req.authUserId, String(req.params.id ?? ""), {
      limit: parsed.data.limit,
    });
    if (!artifacts) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(res, 200, { artifacts }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/threads/:id/artifacts/:artifactId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const artifact = await getThreadArtifact(
      req.authUserId,
      String(req.params.id ?? ""),
      String(req.params.artifactId ?? ""),
    );
    if (!artifact) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Artifact not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(res, 200, { artifact }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/threads/:id/artifact-uri",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ResolveArtifactQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid query", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const resolved = artifactRegistry.resolveThreadScopedUri(parsed.data.uri);
    if (!resolved || resolved.threadId !== String(req.params.id ?? "")) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Artifact URI could not be resolved" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const artifact = await getThreadArtifact(
      req.authUserId,
      resolved.threadId,
      resolved.artifactId,
    );
    if (!artifact) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Artifact not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { artifact }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/autonomous-stage",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = SetAutonomousStageSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await setThreadAutonomousStage(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data,
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/retrievals",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = RecordRetrievalSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await recordContinuityRetrieval(req.authUserId, String(req.params.id ?? ""), parsed.data);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 201, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/plan",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = SetPlanSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await setThreadExecutionPlan(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data.steps,
    );
    if (!thread) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/plan/generate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = GeneratePlanSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const question =
      parsed.data.question?.trim() ||
      `Build an execution plan for: ${existing.goal || existing.title}`;

    const result = await runContinueFlowLangGraph({
      userId: req.authUserId,
      question,
      mode: "build_next",
      topK: 6,
      omitNullPreviousCheckpoint: true,
      workspace: parsed.data.workspace ?? existing.workspace,
      project: parsed.data.project ?? existing.project,
      threadId,
    });

    const steps = result.nextActions.length > 0 ? result.nextActions : [question];
    const thread = await setThreadExecutionPlan(req.authUserId, threadId, steps);
    sendApiSuccess(res, 200, { thread, generated: steps }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/plan/activate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ActivatePlanSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }

    let steps =
      parsed.data.steps?.map((step) => step.trim()).filter(Boolean) ??
      existing.plan.map((step) => step.trim()).filter(Boolean);

    if (steps.length === 0) {
      const question =
        parsed.data.question?.trim() ||
        `Build an execution plan for: ${existing.goal || existing.title}`;

      const result = await runContinueFlowLangGraph({
        userId: req.authUserId,
        question,
        mode: "build_next",
        topK: 6,
        omitNullPreviousCheckpoint: true,
        workspace: parsed.data.workspace ?? existing.workspace,
        project: parsed.data.project ?? existing.project,
        threadId,
      });

      steps = result.nextActions.length > 0 ? result.nextActions : [question];
    }

    const activated = await activateMythicPlan({
      userId: req.authUserId,
      threadId,
      steps,
    });

    if (!activated) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        thread: activated.thread,
        handoff: activated.handoff,
        artifact: activated.artifact,
        taskId: activated.taskId,
        generated: steps,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

runtimeRouter.post(
  "/threads/:id/continue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ContinueThreadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const workspace = parsed.data.workspace ?? existing.workspace;
    const project = parsed.data.project ?? existing.project;
    const continuation = await runContinueFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      mode: parsed.data.mode,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      omitNullPreviousCheckpoint: true,
      workspace,
      project,
      threadId,
      ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
      ...(parsed.data.service ? { service: parsed.data.service } : {}),
      ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
      ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
    });

    const provenance = continuation.usedMemories.slice(0, 40).map(toThreadProvenance);
    let change: FileChangeProposal | null = null;
    let thread = await recordContinuityRetrieval(req.authUserId, threadId, {
      question: parsed.data.question,
      memoryIds: continuation.usedMemories.map((memory) => memory.id),
      provenance,
    });

    if (parsed.data.savePlan && continuation.nextActions.length > 0) {
      thread = (await setThreadExecutionPlan(req.authUserId, threadId, continuation.nextActions)) ?? thread;
    }

    if (parsed.data.checkpoint) {
      thread = (await addContinuityCheckpoint(req.authUserId, threadId, {
        label: "Continue brief generated",
        summary: summarizeContinuation(continuation),
      })) ?? thread;
    }

    if (parsed.data.proposedChange) {
      const proposedChange = parsed.data.proposedChange;
      const threadWithChangeCheckpoint = await addContinuityCheckpoint(req.authUserId, threadId, {
        label: `Proposed: ${proposedChange.filepath}`,
        summary: proposedChange.instruction ?? "File change awaiting approval",
      });

      if (!threadWithChangeCheckpoint) {
        sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
        return;
      }

      const checkpointId =
        proposedChange.checkpointId ??
        threadWithChangeCheckpoint.checkpoints[threadWithChangeCheckpoint.checkpoints.length - 1]?.id ??
        null;

      change = await createFileChangeProposal({
        userId: req.authUserId,
        threadId,
        checkpointId,
        filepath: proposedChange.filepath,
        instruction: proposedChange.instruction ?? null,
        originalText: proposedChange.originalText,
        newText: proposedChange.newText,
        startLine: proposedChange.startLine,
        startCharacter: proposedChange.startCharacter,
        endLine: proposedChange.endLine,
        endCharacter: proposedChange.endCharacter,
      });

      if (!change) {
        sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
        return;
      }

      await appendThreadExecutionLog(
        req.authUserId,
        threadId,
        "info",
        `File change proposed during continuation (approval required): ${proposedChange.filepath}`,
      );
    }

    await appendThreadExecutionLog(
      req.authUserId,
      threadId,
      "info",
      `Continuation generated: ${continuation.nextActions.length} plan steps, ${provenance.length} sources`,
    );

    thread = (await getContinuityThread(req.authUserId, threadId)) ?? thread;
    sendApiSuccess(
      res,
      200,
      { thread, continuation, provenance, ...(change ? { change } : {}) },
      buildApiMeta(req, startedAt, { intent: continuation.debug.mode }),
    );
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/start-task",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = StartExecutionTaskSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const thread = await startThreadExecutionTask(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data,
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/start-step",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = StartExecutionStepSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const thread = await startThreadExecutionStepById(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data.stepId,
      { role: parsed.data.role },
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread or step not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/complete-step",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = CompleteExecutionStepSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const thread = await completeThreadExecutionStepById(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data.stepId,
      parsed.data,
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread or step not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/fail-step",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = FailExecutionStepSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const thread = await failThreadExecutionStepById(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data.stepId,
      parsed.data.reason,
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread or step not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/request-revision",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = RequestExecutionRevisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const thread = await requestThreadExecutionRevision(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data,
    );
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/enqueue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = EnqueueMythicWorkerSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const job = await enqueueMythicWorkerJob({
      userId: req.authUserId,
      threadId,
      reviewDecision: parsed.data.reviewDecision,
      note: parsed.data.note,
    });
    const thread = (await getContinuityThread(req.authUserId, threadId)) ?? existing;
    sendApiSuccess(res, 202, { job, thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/review-decision",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = SubmitReviewDecisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const existing = await getContinuityThread(req.authUserId, threadId);
    if (!existing) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const job = await enqueueMythicWorkerJob({
      userId: req.authUserId,
      threadId,
      reviewDecision: parsed.data.decision,
      note: parsed.data.note,
    });
    const thread = (await getContinuityThread(req.authUserId, threadId)) ?? existing;
    sendApiSuccess(res, 202, { job, thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/threads/:id/execution/worker/:jobId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const thread = await getContinuityThread(req.authUserId, String(req.params.id ?? ""));
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const job = await getMythicWorkerJob({
      userId: req.authUserId,
      threadId: thread.id,
      jobId: String(req.params.jobId ?? ""),
    });
    if (!job || job.threadId !== thread.id) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Worker job not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { job, thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/worker/retry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = RetryWorkerJobSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const threadId = String(req.params.id ?? "");
    const job = await retryMythicWorkerJob({
      userId: req.authUserId,
      threadId,
      jobId: parsed.data.jobId,
    });
    if (!job) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Failed Mythic worker job not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const thread = await getContinuityThread(req.authUserId, threadId);
    if (!thread) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Thread not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 202, { job, thread, execution: thread.executionState }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execution/orchestrate-next",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = OrchestrateExecutionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    try {
      const result = await orchestrateMythicNext({
        userId: req.authUserId,
        threadId: String(req.params.id ?? ""),
        reviewDecision: parsed.data.reviewDecision,
        note: parsed.data.note,
      });
      if (!result) {
        sendApiError(
          res,
          404,
          { code: "NOT_FOUND", message: "Thread not found" },
          buildApiMeta(req, startedAt),
        );
        return;
      }
      sendApiSuccess(
        res,
        200,
        {
          thread: result.thread,
          execution: result.thread.executionState,
          stepId: result.stepId,
          role: result.role,
          stage: result.stage,
          artifact: result.artifact,
          handoff: result.handoff,
          actions: result.actions,
        },
        buildApiMeta(req, startedAt),
      );
    } catch (error) {
      sendApiError(
        res,
        400,
        {
          code: "EXECUTION_BLOCKED",
          message: error instanceof Error ? error.message : "Execution could not be orchestrated",
        },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

runtimeRouter.post(
  "/threads/:id/execute/start",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const thread = await startThreadExecution(req.authUserId, String(req.params.id ?? ""));
    if (!thread) {
      sendApiError(
        res,
        400,
        { code: "NO_PLAN", message: "Add a plan before starting execution" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execute/pause",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const thread = await pauseThreadExecution(req.authUserId, String(req.params.id ?? ""));
    if (!thread) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/execute/advance",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = AdvanceStepSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await advanceThreadExecutionStep(
      req.authUserId,
      String(req.params.id ?? ""),
      parsed.data,
    );
    if (!thread) {
      sendApiError(
        res,
        400,
        { code: "NO_ACTIVE_STEP", message: "No active execution step" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/link-pr",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = LinkPrSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const thread = await linkThreadPullRequest(req.authUserId, String(req.params.id ?? ""), parsed.data.url);
    if (!thread) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/threads/:id/changes",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    if (!(await getContinuityThread(req.authUserId, threadId))) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const parsed = ListFileChangesQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid query", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const tenant = tenantFromRequest(req);
    const changes = await listFileChangeProposals({
      userId: tenant.userId,
      ...(tenant.orgId ? { orgId: tenant.orgId } : {}),
      threadId,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    });
    sendApiSuccess(res, 200, { changes }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/threads/:id/changes",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const threadId = String(req.params.id ?? "");
    const parsed = CreateFileChangeSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const threadWithCheckpoint = await addContinuityCheckpoint(req.authUserId, threadId, {
      label: `Proposed: ${parsed.data.filepath}`,
      summary: parsed.data.instruction ?? "File change awaiting approval",
    });
    if (!threadWithCheckpoint) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const checkpointId =
      parsed.data.checkpointId ??
      threadWithCheckpoint.checkpoints[threadWithCheckpoint.checkpoints.length - 1]?.id ??
      null;

    const change = await createFileChangeProposal({
      userId: req.authUserId,
      threadId,
      checkpointId,
      filepath: parsed.data.filepath,
      instruction: parsed.data.instruction ?? null,
      originalText: parsed.data.originalText,
      newText: parsed.data.newText,
      startLine: parsed.data.startLine,
      startCharacter: parsed.data.startCharacter,
      endLine: parsed.data.endLine,
      endCharacter: parsed.data.endCharacter,
    });

    if (!change) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Thread not found" }, buildApiMeta(req, startedAt));
      return;
    }

    await appendThreadExecutionLog(
      req.authUserId,
      threadId,
      "info",
      `File change proposed (approval required): ${parsed.data.filepath}`,
    );

    const thread = await getContinuityThread(req.authUserId, threadId);
    sendApiSuccess(res, 201, { change, thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.get(
  "/changes/:changeId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const change = await getFileChangeProposal(req.authUserId, String(req.params.changeId ?? ""));
    if (!change) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Change not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { change }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/changes/:changeId/approve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const change = await reviewFileChangeProposal(req.authUserId, String(req.params.changeId ?? ""), true);
    if (!change) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Change not found or not pending" }, buildApiMeta(req, startedAt));
      return;
    }
    if (change.checkpointId) {
      await approveContinuityCheckpoint(req.authUserId, change.threadId, change.checkpointId, true);
    }
    await appendThreadExecutionLog(req.authUserId, change.threadId, "info", `Approved file change: ${change.filepath}`);
    const thread = await getContinuityThread(req.authUserId, change.threadId);
    sendApiSuccess(res, 200, { change, thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/changes/:changeId/reject",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const change = await reviewFileChangeProposal(req.authUserId, String(req.params.changeId ?? ""), false);
    if (!change) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Change not found or not pending" }, buildApiMeta(req, startedAt));
      return;
    }
    if (change.checkpointId) {
      await approveContinuityCheckpoint(req.authUserId, change.threadId, change.checkpointId, false);
    }
    await appendThreadExecutionLog(req.authUserId, change.threadId, "warn", `Rejected file change: ${change.filepath}`);
    const thread = await getContinuityThread(req.authUserId, change.threadId);
    sendApiSuccess(res, 200, { change, thread }, buildApiMeta(req, startedAt));
  }),
);

runtimeRouter.post(
  "/changes/:changeId/applied",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = MarkFileChangeAppliedSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const change = await markFileChangeApplied(req.authUserId, String(req.params.changeId ?? ""), parsed.data);
    if (!change) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "Change not found or not approved" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (change.status === "applied") {
      await appendThreadExecutionLog(req.authUserId, change.threadId, "info", `Applied file change: ${change.filepath}`);
    }

    const thread = await getContinuityThread(req.authUserId, change.threadId);
    sendApiSuccess(res, 200, { change, thread }, buildApiMeta(req, startedAt));
  }),
);

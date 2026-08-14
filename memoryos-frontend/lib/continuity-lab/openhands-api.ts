import type { PrReadyArtifact } from "@/lib/continuity-lab/chat-events";
import { resolveBackendOrigin } from "@/app/api/_lib/backend-origin";

type ApiEnvelope<T> = {
  ok?: boolean;
  data?: T;
} & T;

export type V1TextContent = { type: "text"; text: string };
export type V1ImageContent = { type: "image"; image_urls: string[] };
export type V1MessageContent = V1TextContent | V1ImageContent;

export type V1SendMessageRequest = {
  role: "user" | "system" | "assistant" | "tool";
  content: V1MessageContent[];
};

export type V1AppConversation = {
  id: string;
  title: string | null;
  selected_repository: string | null;
  selected_branch: string | null;
  llm_model: string | null;
  sandbox_status: string;
  execution_status: string | null;
  conversation_url: string | null;
  session_api_key: string | null;
  created_at: string;
  updated_at: string;
  linked_prs?: string[];
  runtime_state?: string | null;
  autonomous_stage?: "plan" | "execute" | "verify" | "pr";
  autonomous_stage_status?: "idle" | "running" | "blocked" | "completed";
  autonomous_stage_updated_at?: string | null;
};

export type OpenHandsEvent = {
  id: string;
  timestamp: string;
  source: string;
  artifact?: PrReadyArtifact;
  llm_message?: {
    role: "user" | "assistant" | "system" | "tool";
    content: Array<{ type: "text"; text: string }>;
  };
  thought?: Array<{ type: "text"; text: string }>;
  error?: string;
  tool_name?: string;
  action?: {
    kind?: string;
    path?: string;
    command?: string;
  };
  observation?: {
    kind?: string;
    path?: string;
    content?: string;
  };
};

export type RuntimeThread = {
  executionState?: RuntimeExecutionState;
  desktopSession?: RuntimeDesktopSession;
  id: string;
  title: string;
  goal?: string;
  project: string;
  repoPath?: string;
  status: string;
  runtimeState: "idle" | "running" | "paused" | "blocked";
  autonomousStage?: "plan" | "execute" | "verify" | "pr";
  autonomousStageStatus?: "idle" | "running" | "blocked" | "completed";
  autonomousStageUpdatedAt?: string;
  linkedPrs: string[];
  executionLog: Array<{
    id: string;
    level: "info" | "warn" | "error";
    message: string;
    at: string;
  }>;
  retrievals: Array<{
    id: string;
    question: string;
    createdAt: string;
  }>;
  timeline: Array<{
    id: string;
    kind: string;
    label: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeDesktopSession = {
  provider: "preview" | "browser" | "vscode" | "playwright" | "custom";
  state: "idle" | "starting" | "live" | "stale" | "blocked" | "error";
  osType?: "ubuntu" | "windows";
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

export type RuntimeDesktopProviderHealth = {
  provider: "sandbox" | "external";
  healthy: boolean;
  detail: string;
  checkedAt: string;
};

export type RuntimeDesktopInputEvent =
  | { type: "mouse_move"; x: number; y: number }
  | { type: "mouse_click"; x: number; y: number; button?: "left" | "middle" | "right"; action?: "down" | "up" | "click" | "double_click" }
  | { type: "scroll"; x?: number; y?: number; deltaX: number; deltaY: number }
  | { type: "key"; key: string; action?: "down" | "up" | "press"; modifiers?: Array<"ctrl" | "alt" | "shift" | "meta"> }
  | { type: "text"; text: string };

export type RuntimeDesktopInputResult = {
  accepted: boolean;
  message?: string;
  at: string;
};

export type RuntimeDesktopStreamState = {
  connected: boolean;
  mode: "webrtc" | "vnc" | "image-stream" | "unknown";
  latencyMs?: number;
  fps?: number;
  width?: number;
  height?: number;
  cursorVisible?: boolean;
  sessionAuthExpiresAt?: string;
  resumeSupported?: boolean;
  reconnectRecommended?: boolean;
  reconnectAfterMs?: number;
  disconnectReason?: string;
  message?: string;
  at: string;
};

export type RuntimeDesktopScreenshotResult = {
  captured: boolean;
  imageUrl?: string;
  contentType?: string;
  width?: number;
  height?: number;
  message?: string;
  at: string;
};

export type RuntimeExecutionStep = {
  id: string;
  label: string;
  role: "manager" | "coder" | "reviewer" | "verifier";
  stage: "plan" | "execute" | "verify" | "pr";
  status: "pending" | "running" | "done" | "skipped" | "failed";
  approvalStatus?: "not_required" | "pending" | "approved" | "rejected";
  artifactIds?: string[];
  proposalIds?: string[];
  handoffId?: string;
  failureReason?: string;
  revisionReason?: string;
  retryCount?: number;
  startedAt?: string;
  completedAt?: string;
};

export type RuntimeExecutionState = {
  taskId?: string;
  activeRole?: "manager" | "coder" | "reviewer" | "verifier";
  status: "idle" | "running" | "blocked" | "completed";
  currentStage: "plan" | "execute" | "verify" | "pr";
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  lastRevisionReason?: string;
  retryCount: number;
  approvalBlocked: boolean;
  workerStatus?:
    | "idle"
    | "queued"
    | "running"
    | "blocked"
    | "awaiting_review_decision"
    | "awaiting_pr_result"
    | "completed";
  workerJobId?: string;
  queuedAt?: string;
  lastAttemptAt?: string;
  lastWorkerError?: string;
  blockedReason?:
    | "awaiting_review_decision"
    | "awaiting_pr_result"
    | "blocked_on_proposal"
    | "blocked_on_verification"
    | "blocked_on_github"
    | "blocked_on_retry_limit"
    | "blocked_on_unknown";
  workerJobs?: RuntimeWorkerJob[];
  steps: RuntimeExecutionStep[];
  updatedAt: string;
};

type RuntimeFileChange = {
  id: string;
  filepath: string;
  originalText: string;
  newText: string;
  status: "pending" | "approved" | "rejected" | "applied" | "failed";
  createdAt: string;
};

export type V1AppConversationStartTask = {
  id: string;
  status: "READY" | "PENDING";
  app_conversation_id: string;
};

export type RuntimeAgentHandoff = {
  id: string;
  source: "manager" | "coder" | "reviewer" | "verifier";
  target: "manager" | "coder" | "reviewer" | "verifier";
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

export type RuntimeArtifact = {
  id: string;
  type: "code" | "test" | "preview" | "recording" | "log" | "review_note";
  producer: "manager" | "coder" | "reviewer" | "verifier";
  consumers: Array<"manager" | "coder" | "reviewer" | "verifier">;
  uri: string;
  title: string;
  description?: string;
  content?: string;
  sourceHandoffId?: string;
  metadata: {
    createdAt: string;
    expiresAt?: string;
    tags: string[];
    stage?: "plan" | "execute" | "verify" | "pr";
    verificationRequired?: boolean;
    sourceChangeId?: string;
    sourceProvider?: "preview" | "browser" | "vscode" | "playwright" | "custom";
    recordingArtifactId?: string;
  };
};

export type RuntimeWorkerJob = {
  id: string;
  threadId: string;
  stepId?: string;
  role?: "manager" | "coder" | "reviewer" | "verifier";
  userId?: string;
  reviewDecision?: "approve" | "reject";
  note?: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  status: "queued" | "claimed" | "running" | "completed" | "failed";
  claimedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
};

function unwrapApiData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as ApiEnvelope<T>;
  if (record.data && typeof record.data === "object") return record.data;
  return payload as T;
}

async function runtimeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`/api/runtime${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => null)) as unknown;
    return unwrapApiData<T>(payload);
  } catch {
    return null;
  }
}

async function runtimeSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT",
  body: unknown,
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(`/api/runtime${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as
      | { error?: { message?: string } | string }
      | unknown;
    if (!res.ok) {
      const payloadError =
        payload && typeof payload === "object" && "error" in payload
          ? (payload as { error?: { message?: string } | string }).error
          : undefined;
      const message =
        typeof payloadError === "string"
          ? payloadError
          : payloadError?.message ?? "Runtime request failed."
      return { ok: false, status: res.status, data: null, error: message };
    }
    return {
      ok: true,
      status: res.status,
      data: unwrapApiData<T>(payload),
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: null,
      error: error instanceof Error ? error.message : "Runtime unavailable.",
    };
  }
}

function mapRuntimeStateToSandboxStatus(
  state: RuntimeThread["runtimeState"] | null | undefined,
): string {
  if (state === "running") return "RUNNING";
  if (state === "paused") return "PAUSED";
  if (state === "blocked") return "ERROR";
  return "PREPARING";
}

function toConversation(thread: RuntimeThread): V1AppConversation {
  const title = thread.title?.trim() || thread.goal?.trim() || "Continuity session";
  return {
    id: thread.id,
    title,
    selected_repository: thread.repoPath ?? null,
    selected_branch: "main",
    llm_model: null,
    sandbox_status: mapRuntimeStateToSandboxStatus(thread.runtimeState),
    execution_status: thread.runtimeState ?? null,
    conversation_url: `/continuity-lab/session/${encodeURIComponent(thread.id)}`,
    session_api_key: null,
    created_at: thread.createdAt,
    updated_at: thread.updatedAt,
    linked_prs: Array.isArray(thread.linkedPrs) ? thread.linkedPrs : [],
    runtime_state: thread.runtimeState ?? null,
    autonomous_stage: thread.autonomousStage ?? "plan",
    autonomous_stage_status: thread.autonomousStageStatus ?? "idle",
    autonomous_stage_updated_at: thread.autonomousStageUpdatedAt ?? null,
  };
}

function extractPullRequestNumber(url: string): number | undefined {
  const match = url.match(/\/pull\/(\d+)/i);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function derivePrCiStatus(
  thread: RuntimeThread,
): PrReadyArtifact["ciStatus"] {
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

export function buildPrReadyArtifact(
  thread: RuntimeThread,
  changes: RuntimeFileChange[],
  prUrl: string,
): PrReadyArtifact {
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
    type: "pr_ready",
    id: `pr-ready-${number ?? thread.id}`,
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
  };
}

function toThreadEvents(
  thread: RuntimeThread,
  changes: RuntimeFileChange[],
  handoffs: RuntimeAgentHandoff[],
  artifacts: RuntimeArtifact[],
): OpenHandsEvent[] {
  const events: OpenHandsEvent[] = [];

  for (const retrieval of thread.retrievals ?? []) {
    events.push({
      id: `retrieval-${retrieval.id}`,
      timestamp: retrieval.createdAt,
      source: "user",
      llm_message: {
        role: "user",
        content: [{ type: "text", text: retrieval.question }],
      },
    });
  }

  for (const timeline of thread.timeline ?? []) {
    events.push({
      id: `timeline-${timeline.id}`,
      timestamp: timeline.createdAt,
      source: "agent",
      tool_name: `timeline.${timeline.kind}`,
      action: {
        kind: timeline.kind,
        path: timeline.label,
      },
      thought: [{ type: "text", text: timeline.label }],
    });
  }

  for (const step of thread.executionState?.steps ?? []) {
    const stepTimestamp =
      step.completedAt ?? step.startedAt ?? thread.executionState?.updatedAt ?? thread.updatedAt;
    if (step.approvalStatus === "approved") {
      events.push({
        id: `step-${step.id}-approved`,
        timestamp: stepTimestamp,
        source: "agent",
        llm_message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: `Reviewer approved ${step.label}. Verification can proceed.`,
            },
          ],
        },
      });
    }
    if (step.approvalStatus === "rejected") {
      events.push({
        id: `step-${step.id}-rejected`,
        timestamp: stepTimestamp,
        source: "agent",
        llm_message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: `Reviewer rejected ${step.label}.${step.revisionReason ? ` Revision requested: ${step.revisionReason}` : ""}`,
            },
          ],
        },
      });
    }
    if (step.revisionReason) {
      events.push({
        id: `step-${step.id}-revision`,
        timestamp: stepTimestamp,
        source: "agent",
        llm_message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: `${step.role} requested revision for ${step.label}: ${step.revisionReason}`,
            },
          ],
        },
      });
    }
    if (step.failureReason) {
      events.push({
        id: `step-${step.id}-failure`,
        timestamp: stepTimestamp,
        source: "agent",
        error: `${step.role} step failed: ${step.failureReason}`,
      });
    }
  }

  for (const log of thread.executionLog ?? []) {
    const base: OpenHandsEvent = {
      id: `log-${log.id}`,
      timestamp: log.at,
      source: "agent",
      tool_name: "runtime.execution",
      action: {
        kind: "execution_log",
        command: log.message,
      },
    };
    if (log.level === "error") {
      base.error = log.message;
    } else {
      base.thought = [{ type: "text", text: log.message }];
    }
    events.push(base);
  }

  for (const handoff of handoffs) {
    const artifactList = handoff.payload.artifacts?.slice(0, 3).join(", ");
    const proposalList = handoff.payload.proposalIds?.slice(0, 3).join(", ");
    const parts = [
      `${handoff.source} handed work to ${handoff.target}.`,
      handoff.metadata.notes,
      handoff.payload.revisionReason
        ? `Revision reason: ${handoff.payload.revisionReason}`
        : null,
      artifactList ? `Artifacts: ${artifactList}` : null,
      proposalList ? `Proposals: ${proposalList}` : null,
    ].filter(Boolean);
    events.push({
      id: `handoff-${handoff.id}`,
      timestamp: handoff.timestamp,
      source: "agent",
      llm_message: {
        role: "assistant",
        content: [{ type: "text", text: parts.join(" ") }],
      },
    });
  }

  for (const artifact of artifacts) {
    const timestamp = artifact.metadata.createdAt;
    if (artifact.type === "review_note" || artifact.type === "test" || artifact.type === "recording") {
      const summary = [
        artifact.type === "test"
          ? "Verification evidence attached."
          : artifact.type === "review_note"
            ? "Review note attached."
            : "Recording attached.",
        artifact.title,
        artifact.description ?? null,
        artifact.metadata.stage ? `Stage: ${artifact.metadata.stage}.` : null,
      ]
        .filter(Boolean)
        .join(" ");
      events.push({
        id: `artifact-${artifact.id}`,
        timestamp,
        source: "agent",
        llm_message: {
          role: "assistant",
          content: [{ type: "text", text: summary }],
        },
      });
    }
  }

  const latestPr =
    thread.linkedPrs && thread.linkedPrs.length > 0
      ? thread.linkedPrs[thread.linkedPrs.length - 1]
      : null;
  if (latestPr) {
    const artifact = buildPrReadyArtifact(thread, changes, latestPr);
    events.push({
      id: artifact.id,
      timestamp: thread.updatedAt,
      source: "agent",
      artifact,
    });
  }

  for (const change of changes) {
    events.push({
      id: `change-${change.id}`,
      timestamp: change.createdAt,
      source: "agent",
      tool_name: change.status === "applied" ? "write_file" : "edit_file",
      action: {
        kind: "file_edit",
        path: change.filepath,
      },
      observation: {
        kind: "edit",
        path: change.filepath,
        content: change.newText,
      },
    });
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function deriveProjectFromRepo(repo: string | null | undefined): string {
  if (!repo) return "continuity-lab";
  const normalized = repo.trim();
  return normalized.length > 0 ? normalized : "continuity-lab";
}

export async function startAppConversationTask(input: {
  prompt: string;
  title?: string;
  selectedRepository?: string | null;
  selectedBranch?: string | null;
  llmModel?: string | null;
  systemMessageSuffix?: string;
}): Promise<V1AppConversationStartTask> {
  const title = input.title?.trim() || input.prompt.trim().slice(0, 80) || "Continuity session";
  const project = deriveProjectFromRepo(input.selectedRepository);
  const create = await runtimeSend<{ thread: RuntimeThread }>(
    "/threads",
    "POST",
    {
      title,
      goal: input.prompt.trim(),
      workspace: "continuity-lab",
      project,
      repoPath: input.selectedRepository ?? undefined,
      systemMessageSuffix: input.systemMessageSuffix?.trim() || undefined,
    },
  );
  if (!create.ok || !create.data?.thread?.id) {
    throw new Error(create.error ?? "Could not create runtime session.");
  }

  const threadId = create.data.thread.id;
  const runtimePrompt = input.prompt.trim();
  const startupContext = input.systemMessageSuffix?.trim();
  const initialQuestion =
    startupContext && startupContext.length > 0
      ? [
          "[MemoryOS startup context]",
          startupContext,
          "",
          "[User task]",
          runtimePrompt,
        ].join("\n")
      : runtimePrompt;

  const continueResponse = await runtimeSend<{ thread: RuntimeThread }>(
    `/threads/${encodeURIComponent(threadId)}/continue`,
    "POST",
    {
      question: initialQuestion,
      savePlan: true,
      checkpoint: true,
      ...(input.selectedRepository
        ? { repo: input.selectedRepository }
        : {}),
    },
  );
  if (!continueResponse.ok) {
    throw new Error(
      continueResponse.error ?? "Session created but first runtime step failed.",
    );
  }

  return {
    id: threadId,
    status: "READY",
    app_conversation_id: threadId,
  };
}

export async function getAppConversationStartTask(
  taskId: string,
): Promise<V1AppConversationStartTask | null> {
  const conversationId = taskId.startsWith("task-")
    ? taskId.slice(5)
    : taskId;
  const conversation = await getAppConversation(conversationId);
  if (!conversation) return null;
  return {
    id: taskId,
    status: "READY",
    app_conversation_id: conversation.id,
  };
}

export async function startAppConversation(input: {
  prompt: string;
}): Promise<V1AppConversation | null> {
  const task = await startAppConversationTask({ prompt: input.prompt });
  return getAppConversation(task.app_conversation_id);
}

export async function getAppConversation(
  conversationId: string,
): Promise<V1AppConversation | null> {
  const payload = await runtimeGet<{ thread: RuntimeThread }>(
    `/threads/${encodeURIComponent(conversationId)}`,
  );
  if (!payload?.thread) return null;
  return toConversation(payload.thread);
}

export async function getRuntimeThread(
  conversationId: string,
): Promise<RuntimeThread | null> {
  const payload = await runtimeGet<{ thread: RuntimeThread }>(
    `/threads/${encodeURIComponent(conversationId)}`,
  );
  return payload?.thread ?? null;
}

export async function getRuntimeExecutionState(
  conversationId: string,
): Promise<RuntimeExecutionState | null> {
  const payload = await runtimeGet<{ execution: RuntimeExecutionState }>(
    `/threads/${encodeURIComponent(conversationId)}/execution`,
  );
  return payload?.execution ?? null;
}

export async function searchAppConversations(
  limit = 20,
): Promise<V1AppConversation[]> {
  const payload = await runtimeGet<{ threads: RuntimeThread[] }>(
    `/threads?limit=${Math.max(1, Math.min(100, limit))}`,
  );
  const threads = Array.isArray(payload?.threads) ? payload.threads : [];
  return threads.slice(0, limit).map(toConversation);
}

export async function searchConversationEvents(
  conversationId: string,
  limit = 100,
): Promise<OpenHandsEvent[]> {
  const [threadPayload, changesPayload, handoffsPayload, artifactsPayload] = await Promise.all([
    runtimeGet<{ thread: RuntimeThread }>(
      `/threads/${encodeURIComponent(conversationId)}`,
    ),
    runtimeGet<{ changes: RuntimeFileChange[] }>(
      `/threads/${encodeURIComponent(conversationId)}/changes`,
    ),
    runtimeGet<{ handoffs: RuntimeAgentHandoff[] }>(
      `/threads/${encodeURIComponent(conversationId)}/handoffs?limit=40`,
    ),
    runtimeGet<{ artifacts: RuntimeArtifact[] }>(
      `/threads/${encodeURIComponent(conversationId)}/artifacts?limit=40`,
    ),
  ]);
  if (!threadPayload?.thread) return [];
  const changes = Array.isArray(changesPayload?.changes)
    ? changesPayload.changes
    : [];
  const handoffs = Array.isArray(handoffsPayload?.handoffs)
    ? handoffsPayload.handoffs
    : [];
  const artifacts = Array.isArray(artifactsPayload?.artifacts)
    ? artifactsPayload.artifacts
    : [];
  const events = toThreadEvents(threadPayload.thread, changes, handoffs, artifacts);
  if (limit <= 0) return events;
  return events.slice(Math.max(0, events.length - limit));
}

export async function sendConversationMessage(
  conversationId: string,
  text: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const result = await runtimeSend<{ thread: RuntimeThread }>(
    `/threads/${encodeURIComponent(conversationId)}/continue`,
    "POST",
    {
      question: text,
      savePlan: true,
      checkpoint: true,
    },
  );
  return {
    ok: result.ok,
    status: result.status,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function queuePendingMessage(
  conversationId: string,
  text: string,
): Promise<{ ok: boolean; status: number }> {
  const result = await sendConversationMessage(conversationId, text);
  return { ok: result.ok, status: result.status };
}

export async function fetchVsCodePanelUrl(
  conversationId: string,
): Promise<string | null> {
  const eventsPayload = await runtimeGet<{ events?: Array<{ kind?: string; payload?: { previewUrl?: string | null } }> }>(
    `/threads/${encodeURIComponent(conversationId)}/events`,
  );
  const eventPreview = eventsPayload?.events
    ?.find((event) => event.kind === "desktop_preview_url")
    ?.payload?.previewUrl;
  if (typeof eventPreview === "string" && /^https?:\/\//i.test(eventPreview)) {
    return eventPreview;
  }

  const artifactsPayload = await runtimeGet<{ artifacts?: RuntimeArtifact[] }>(
    `/threads/${encodeURIComponent(conversationId)}/artifacts?limit=50`,
  );
  const previewArtifact = artifactsPayload?.artifacts?.find(
    (artifact) =>
      artifact.type === "preview" &&
      [artifact.content, artifact.description, artifact.uri].some(
        (value) => typeof value === "string" && /^https?:\/\//i.test(value),
      ),
  );
  if (!previewArtifact) return null;

  const candidates = [
    previewArtifact.content,
    previewArtifact.description,
    previewArtifact.uri,
  ];
  const resolved = candidates.find(
    (value): value is string => typeof value === "string" && /^https?:\/\//i.test(value),
  );
  return resolved ?? null;
}

export async function listThreadHandoffs(
  threadId: string,
  limit = 20,
): Promise<RuntimeAgentHandoff[]> {
  const payload = await runtimeGet<{ handoffs: RuntimeAgentHandoff[] }>(
    `/threads/${encodeURIComponent(threadId)}/handoffs?limit=${Math.max(1, Math.min(100, limit))}`,
  );
  return Array.isArray(payload?.handoffs) ? payload.handoffs : [];
}

export async function createThreadHandoff(
  threadId: string,
  input: Omit<RuntimeAgentHandoff, "id" | "timestamp">,
): Promise<{
  ok: boolean;
  status: number;
  handoff: RuntimeAgentHandoff | null;
  error?: string;
}> {
  const result = await runtimeSend<{
    handoff?: RuntimeAgentHandoff;
  }>(`/threads/${encodeURIComponent(threadId)}/handoffs`, "POST", input);
  return {
    ok: result.ok,
    status: result.status,
    handoff: result.data?.handoff ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function listThreadArtifacts(
  threadId: string,
  limit = 20,
): Promise<RuntimeArtifact[]> {
  const payload = await runtimeGet<{ artifacts: RuntimeArtifact[] }>(
    `/threads/${encodeURIComponent(threadId)}/artifacts?limit=${Math.max(1, Math.min(100, limit))}`,
  );
  return Array.isArray(payload?.artifacts) ? payload.artifacts : [];
}

export async function getThreadDesktopSession(
  threadId: string,
): Promise<{ desktop: RuntimeDesktopSession | null; thread: RuntimeThread | null }> {
  const payload = await runtimeGet<{ desktop: RuntimeDesktopSession | null; thread: RuntimeThread | null }>(
    `/threads/${encodeURIComponent(threadId)}/desktop`,
  );
  return {
    desktop: payload?.desktop ?? null,
    thread: payload?.thread ?? null,
  };
}

export async function getThreadDesktopStatus(
  threadId: string,
): Promise<{ desktop: RuntimeDesktopSession | null; thread: RuntimeThread | null }> {
  const payload = await runtimeGet<{ desktop: RuntimeDesktopSession | null; thread: RuntimeThread | null }>(
    `/threads/${encodeURIComponent(threadId)}/desktop/status`,
  );
  return {
    desktop: payload?.desktop ?? null,
    thread: payload?.thread ?? null,
  };
}

export async function startThreadDesktopSession(
  threadId: string,
  osType?: "ubuntu" | "windows",
): Promise<{ ok: boolean; status: number; error?: string }> {
  const result = await runtimeSend<{
    desktop?: RuntimeDesktopSession | null;
  }>(`/threads/${encodeURIComponent(threadId)}/desktop/start`, "POST", osType ? { osType } : {});
  return {
    ok: result.ok,
    status: result.status,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function wakeThreadDesktopSession(
  threadId: string,
  osType?: "ubuntu" | "windows",
): Promise<{ ok: boolean; status: number; error?: string }> {
  const result = await runtimeSend<{
    desktop?: RuntimeDesktopSession | null;
  }>(`/threads/${encodeURIComponent(threadId)}/desktop/wake`, "POST", osType ? { osType } : {});
  return {
    ok: result.ok,
    status: result.status,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function wakeLocalDesktopProviderSession(
  threadId: string,
  osType: "ubuntu" | "windows" = "ubuntu",
): Promise<{ desktop: RuntimeDesktopSession | null; error?: string }> {
  try {
    const providerBaseUrl = resolveBackendOrigin().replace(/\/+$/, "");
    const response = await fetch(
      `${providerBaseUrl}/internal/desktop-provider/desktop/sessions/start`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer dev-desktop-token",
        },
        body: JSON.stringify({ threadId, osType }),
        cache: "no-store",
      },
    );
    const payload = (await response.json().catch(() => null)) as
      | { session?: RuntimeDesktopSession; desktop?: RuntimeDesktopSession; error?: string }
      | null;
    if (!response.ok) {
      return {
        desktop: null,
        error: payload?.error ?? `Local desktop provider failed (${response.status}).`,
      };
    }
    return { desktop: payload?.session ?? payload?.desktop ?? null };
  } catch (error) {
    return {
      desktop: null,
      error: error instanceof Error ? error.message : "Local desktop provider unavailable.",
    };
  }
}

export async function stopThreadDesktopSession(
  threadId: string,
  osType?: "ubuntu" | "windows",
): Promise<{ ok: boolean; status: number; error?: string }> {
  const result = await runtimeSend<{
    desktop?: RuntimeDesktopSession | null;
  }>(`/threads/${encodeURIComponent(threadId)}/desktop/stop`, "POST", osType ? { osType } : {});
  return {
    ok: result.ok,
    status: result.status,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function getDesktopProviderHealth(): Promise<RuntimeDesktopProviderHealth | null> {
  const payload = await runtimeGet<{ providerHealth: RuntimeDesktopProviderHealth }>(
    "/desktop/provider-health",
  );
  return payload?.providerHealth ?? null;
}

export async function sendThreadDesktopInput(
  threadId: string,
  event: RuntimeDesktopInputEvent,
  osType?: "ubuntu" | "windows",
): Promise<{ ok: boolean; status: number; input: RuntimeDesktopInputResult | null; error?: string }> {
  const result = await runtimeSend<{ input?: RuntimeDesktopInputResult }>(
    `/threads/${encodeURIComponent(threadId)}/desktop/input`,
    "POST",
    osType ? { osType, event } : { event },
  );
  return {
    ok: result.ok,
    status: result.status,
    input: result.data?.input ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function getThreadDesktopStreamState(
  threadId: string,
): Promise<RuntimeDesktopStreamState | null> {
  const payload = await runtimeGet<{ stream: RuntimeDesktopStreamState }>(
    `/threads/${encodeURIComponent(threadId)}/desktop/stream`,
  );
  return payload?.stream ?? null;
}

export async function captureThreadDesktopScreenshot(
  threadId: string,
  osType?: "ubuntu" | "windows",
): Promise<{
  ok: boolean;
  status: number;
  screenshot: RuntimeDesktopScreenshotResult | null;
  artifact: RuntimeArtifact | null;
  thread: RuntimeThread | null;
  error?: string;
}> {
  const result = await runtimeSend<{
    screenshot?: RuntimeDesktopScreenshotResult;
    artifact?: RuntimeArtifact | null;
    thread?: RuntimeThread | null;
  }>(
    `/threads/${encodeURIComponent(threadId)}/desktop/screenshot`,
    "POST",
    osType ? { osType } : {},
  );
  return {
    ok: result.ok,
    status: result.status,
    screenshot: result.data?.screenshot ?? null,
    artifact: result.data?.artifact ?? null,
    thread: result.data?.thread ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function createThreadArtifact(
  threadId: string,
  input: Omit<RuntimeArtifact, "id" | "uri" | "metadata"> & {
    metadata: {
      tags?: string[];
      expiresAt?: string;
    };
  },
): Promise<{
  ok: boolean;
  status: number;
  artifact: RuntimeArtifact | null;
  error?: string;
}> {
  const result = await runtimeSend<{
    artifact?: RuntimeArtifact;
  }>(`/threads/${encodeURIComponent(threadId)}/artifacts`, "POST", input);
  return {
    ok: result.ok,
    status: result.status,
    artifact: result.data?.artifact ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function startRuntimeExecutionTask(
  threadId: string,
  input?: {
    taskId?: string;
    activeRole?: "manager" | "coder" | "reviewer" | "verifier";
  },
): Promise<{ ok: boolean; status: number; thread: RuntimeThread | null; error?: string }> {
  const result = await runtimeSend<{ thread?: RuntimeThread }>(
    `/threads/${encodeURIComponent(threadId)}/execution/start-task`,
    "POST",
    input ?? {},
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function startRuntimeExecutionStep(
  threadId: string,
  input: {
    stepId: string;
    role?: "manager" | "coder" | "reviewer" | "verifier";
  },
): Promise<{ ok: boolean; status: number; thread: RuntimeThread | null; error?: string }> {
  const result = await runtimeSend<{ thread?: RuntimeThread }>(
    `/threads/${encodeURIComponent(threadId)}/execution/start-step`,
    "POST",
    input,
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function completeRuntimeExecutionStep(
  threadId: string,
  input: {
    stepId: string;
    artifactIds?: string[];
    proposalIds?: string[];
    handoffId?: string;
    approvalStatus?: "not_required" | "pending" | "approved" | "rejected";
    note?: string;
  },
): Promise<{ ok: boolean; status: number; thread: RuntimeThread | null; error?: string }> {
  const result = await runtimeSend<{ thread?: RuntimeThread }>(
    `/threads/${encodeURIComponent(threadId)}/execution/complete-step`,
    "POST",
    input,
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function failRuntimeExecutionStep(
  threadId: string,
  input: { stepId: string; reason: string },
): Promise<{ ok: boolean; status: number; thread: RuntimeThread | null; error?: string }> {
  const result = await runtimeSend<{ thread?: RuntimeThread }>(
    `/threads/${encodeURIComponent(threadId)}/execution/fail-step`,
    "POST",
    input,
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function enqueueRuntimeExecutionWorker(
  threadId: string,
  input?: {
    reviewDecision?: "approve" | "reject";
    note?: string;
  },
): Promise<{
  ok: boolean;
  status: number;
  thread: RuntimeThread | null;
  job: RuntimeWorkerJob | null;
  error?: string;
}> {
  const result = await runtimeSend<{
    thread?: RuntimeThread;
    job?: RuntimeWorkerJob;
  }>(
    `/threads/${encodeURIComponent(threadId)}/execution/enqueue`,
    "POST",
    input ?? {},
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    job: result.data?.job ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function getRuntimeExecutionWorkerJob(
  threadId: string,
  jobId: string,
): Promise<{
  job: RuntimeWorkerJob | null;
  thread: RuntimeThread | null;
}> {
  const payload = await runtimeGet<{
    job?: RuntimeWorkerJob;
    thread?: RuntimeThread;
  }>(
    `/threads/${encodeURIComponent(threadId)}/execution/worker/${encodeURIComponent(jobId)}`,
  );
  return {
    job: payload?.job ?? null,
    thread: payload?.thread ?? null,
  };
}

export async function retryRuntimeExecutionWorkerJob(
  threadId: string,
  jobId: string,
): Promise<{
  ok: boolean;
  status: number;
  thread: RuntimeThread | null;
  job: RuntimeWorkerJob | null;
  error?: string;
}> {
  const result = await runtimeSend<{
    thread?: RuntimeThread;
    job?: RuntimeWorkerJob;
  }>(
    `/threads/${encodeURIComponent(threadId)}/execution/worker/retry`,
    "POST",
    { jobId },
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    job: result.data?.job ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function submitRuntimeReviewDecision(
  threadId: string,
  input: {
    decision: "approve" | "reject";
    note?: string;
  },
): Promise<{
  ok: boolean;
  status: number;
  thread: RuntimeThread | null;
  job: RuntimeWorkerJob | null;
  error?: string;
}> {
  const result = await runtimeSend<{
    thread?: RuntimeThread;
    job?: RuntimeWorkerJob;
  }>(
    `/threads/${encodeURIComponent(threadId)}/execution/review-decision`,
    "POST",
    input,
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    job: result.data?.job ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function resolveRuntimeArtifactUri(
  threadId: string,
  uri: string,
): Promise<RuntimeArtifact | null> {
  const payload = await runtimeGet<{ artifact: RuntimeArtifact }>(
    `/threads/${encodeURIComponent(threadId)}/artifact-uri?uri=${encodeURIComponent(uri)}`,
  );
  return payload?.artifact ?? null;
}

export async function requestRuntimeExecutionRevision(
  threadId: string,
  input: {
    reason: string;
    targetRole?: "manager" | "coder" | "reviewer" | "verifier";
  },
): Promise<{ ok: boolean; status: number; thread: RuntimeThread | null; error?: string }> {
  const result = await runtimeSend<{ thread?: RuntimeThread }>(
    `/threads/${encodeURIComponent(threadId)}/execution/request-revision`,
    "POST",
    input,
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function orchestrateRuntimeExecutionNext(
  threadId: string,
  input?: {
    reviewDecision?: "approve" | "reject";
    note?: string;
  },
): Promise<{
  ok: boolean;
  status: number;
  thread: RuntimeThread | null;
  handoff: RuntimeAgentHandoff | null;
  artifact: RuntimeArtifact | null;
  actions: string[];
  error?: string;
}> {
  const result = await runtimeSend<{
    thread?: RuntimeThread;
    handoff?: RuntimeAgentHandoff;
    artifact?: RuntimeArtifact;
    actions?: string[];
  }>(
    `/threads/${encodeURIComponent(threadId)}/execution/orchestrate-next`,
    "POST",
    input ?? {},
  );
  return {
    ok: result.ok,
    status: result.status,
    thread: result.data?.thread ?? null,
    handoff: result.data?.handoff ?? null,
    artifact: result.data?.artifact ?? null,
    actions: Array.isArray(result.data?.actions) ? result.data.actions : [],
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function getRuntimeSettings(): Promise<{
  llm_api_key_set?: boolean;
  llm_model?: string | null;
} | null> {
  try {
    const res = await fetch("/api/runtime/company-model", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => null)) as
      | {
          data?: {
            model?: string | null;
            apiKeySet?: boolean;
          };
        }
      | null;
    return {
      llm_api_key_set: Boolean(payload?.data?.apiKeySet),
      llm_model: payload?.data?.model ?? null,
    };
  } catch {
    return null;
  }
}

export async function patchRuntimeLlmModel(model: string): Promise<boolean> {
  const trimmed = model.trim();
  if (!trimmed) return false;
  try {
    const res = await fetch("/api/runtime/company-model", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: trimmed }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function buildSandboxWebSocketUrl(
  conversation: V1AppConversation,
): string | null {
  void conversation;
  return null;
}

export function extractSandboxBaseHost(
  value: string | null | undefined,
): string | null {
  void value;
  return null;
}

export function extractSandboxPathPrefix(
  value: string | null | undefined,
): string {
  void value;
  return "";
}

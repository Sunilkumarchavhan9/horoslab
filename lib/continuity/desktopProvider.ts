import {
  getContinuityThread,
  updateThreadDesktopSession,
  type ContinuityDesktopSession,
  type ContinuityThread,
} from "./continuityThreadStore";

type DesktopWorkerPhase = "claimed" | "completed" | "blocked" | "failed";

export type DesktopWorkerStateInput = {
  userId: string;
  threadId: string;
  orgId?: string;
  workerJobId?: string;
  phase: DesktopWorkerPhase;
  note?: string;
  error?: string;
};

function isHttpUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^https?:\/\//i.test(value.trim());
}

function resolvePreviewUrl(thread: ContinuityThread): string | undefined {
  if (isHttpUrl(thread.desktopSession?.previewUrl)) return thread.desktopSession.previewUrl.trim();
  for (const artifact of thread.artifacts) {
    if (artifact.type !== "preview") continue;
    if (isHttpUrl(artifact.content)) return artifact.content.trim();
    if (isHttpUrl(artifact.description)) return artifact.description.trim();
  }
  return undefined;
}

function resolveProvider(thread: ContinuityThread): ContinuityDesktopSession["provider"] {
  const fromSession = thread.desktopSession?.provider;
  if (
    fromSession === "browser" ||
    fromSession === "vscode" ||
    fromSession === "playwright" ||
    fromSession === "custom"
  ) {
    return fromSession;
  }
  const previewArtifact = thread.artifacts.find((artifact) => artifact.type === "preview");
  const sourceProvider = previewArtifact?.metadata.sourceProvider;
  if (
    sourceProvider === "browser" ||
    sourceProvider === "vscode" ||
    sourceProvider === "playwright" ||
    sourceProvider === "custom"
  ) {
    return sourceProvider;
  }
  return "preview";
}

function resolveControlUrl(thread: ContinuityThread, previewUrl?: string): string | undefined {
  if (isHttpUrl(thread.desktopSession?.controlUrl)) return thread.desktopSession.controlUrl.trim();
  return previewUrl;
}

function buildRuntimeMessage(input: DesktopWorkerStateInput): string {
  if (input.phase === "failed") {
    return input.error?.trim() || "Desktop runtime failed during worker execution.";
  }
  if (input.phase === "blocked") {
    return input.note?.trim() || "Desktop runtime is waiting on a review or retry decision.";
  }
  if (input.phase === "completed") {
    return input.note?.trim() || "Desktop runtime synced to latest worker output.";
  }
  return input.note?.trim() || "Desktop runtime is syncing with worker execution.";
}

function resolveState(
  input: DesktopWorkerStateInput,
  hasPreview: boolean,
): ContinuityDesktopSession["state"] {
  if (input.phase === "failed") return "error";
  if (input.phase === "blocked") return "blocked";
  if (input.phase === "completed") return hasPreview ? "live" : "starting";
  return hasPreview ? "live" : "starting";
}

export async function publishDesktopWorkerState(input: DesktopWorkerStateInput): Promise<void> {
  const thread = await getContinuityThread(input.userId, input.threadId, input.orgId);
  if (!thread) return;
  const hasDesktopSignal =
    Boolean(thread.desktopSession?.previewUrl) ||
    Boolean(thread.desktopSession?.controlUrl) ||
    thread.artifacts.some((artifact) => artifact.type === "preview" || artifact.type === "recording");
  if (!hasDesktopSignal) return;
  const previewUrl = resolvePreviewUrl(thread);
  const controlUrl = resolveControlUrl(thread, previewUrl);
  const provider = resolveProvider(thread);
  const runtimeMessage = buildRuntimeMessage(input);
  const state = resolveState(input, Boolean(previewUrl));
  const recordingArtifact = thread.artifacts.find((artifact) => artifact.type === "recording");

  await updateThreadDesktopSession(
    input.userId,
    input.threadId,
    {
      provider,
      state,
      ...(previewUrl ? { previewUrl } : {}),
      ...(controlUrl ? { controlUrl } : {}),
      ...(input.workerJobId ? { providerSessionId: input.workerJobId } : {}),
      ...(runtimeMessage ? { runtimeMessage } : {}),
      ...(recordingArtifact ? { recordingArtifactId: recordingArtifact.id } : {}),
      ...(previewUrl ? { lastFrameAt: new Date().toISOString() } : {}),
    },
    input.orgId,
  );
}

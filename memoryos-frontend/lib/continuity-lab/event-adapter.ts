import { useAgentStore, type PRStatus } from "@/lib/continuity-lab/agent-store";
import {
  eventsToChatBubbles,
  eventsToFileChanges,
  eventsToShellLines,
  eventsToWorklog,
  mergeChatBubbles,
  type ChatBubble,
  type FileChangeEntry,
  type PrReadyArtifact,
  type ShellLineEntry,
  type WorklogEntry,
} from "@/lib/continuity-lab/chat-events";
import type { OpenHandsLikeEvent } from "@/lib/continuity-lab/openhands-event-stream";

export type RuntimeUiEvent =
  | { kind: "message"; payload: ChatBubble }
  | { kind: "file_change"; payload: FileChangeEntry }
  | { kind: "worklog"; payload: WorklogEntry }
  | { kind: "shell"; payload: ShellLineEntry }
  | { kind: "pr_status"; payload: PRStatus }
  | { kind: "pr_ready"; payload: PrReadyArtifact }
  | {
      kind: "desktop_status";
      payload: {
        status: "idle" | "starting" | "live" | "error";
        runtimeMessage?: string | null;
      };
    }
  | {
      kind: "desktop_preview_url";
      payload: { previewUrl: string | null; controlUrl?: string | null };
    }
  | {
      kind: "agent_status";
      payload: {
        id: string;
        name: string;
        role?: string;
        status?: "idle" | "running" | "error";
      };
    };

export function applyRuntimeUiEventToStore(event: RuntimeUiEvent) {
  const store = useAgentStore.getState();
  if (event.kind === "message") {
    store.appendMessage(event.payload);
    return;
  }
  if (event.kind === "file_change") {
    store.applyFileChange(event.payload);
    return;
  }
  if (event.kind === "worklog") {
    store.addWorklog(event.payload);
    return;
  }
  if (event.kind === "shell") {
    store.addShellLine(event.payload);
    return;
  }
  if (event.kind === "desktop_status") {
    store.setDesktopState({
      status: event.payload.status,
      runtimeMessage: event.payload.runtimeMessage ?? null,
      lastFrameAt: new Date().toISOString(),
    });
    return;
  }
  if (event.kind === "desktop_preview_url") {
    store.setDesktopState({
      previewUrl: event.payload.previewUrl,
      controlUrl: event.payload.controlUrl ?? event.payload.previewUrl,
      lastFrameAt: new Date().toISOString(),
    });
    return;
  }
  if (event.kind === "agent_status") {
    store.upsertAgent({
      id: event.payload.id,
      name: event.payload.name,
      role: event.payload.role,
      status: event.payload.status,
    });
    return;
  }
  if (event.kind === "pr_ready") {
    store.setPrReady(event.payload);
    store.setPrStatus({
      status: event.payload.ciStatus,
      number: event.payload.number,
      url: event.payload.url,
    });
    store.appendMessage({
      id: event.payload.id,
      role: "agent",
      variant: "artifact",
      text: event.payload.title,
      artifact: event.payload,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  const prev = store.prStatus;
  store.setPrStatus(event.payload);

  const prevStatus = prev?.status ?? null;
  const nextStatus = event.payload.status ?? null;
  const prevNumber = prev?.number ?? null;
  const nextNumber = event.payload.number ?? null;
  if (prevStatus === nextStatus && prevNumber === nextNumber) return;

  const timestamp = new Date().toISOString();
  const numberLabel = nextNumber ? `PR #${nextNumber}` : "Pull request";
  const statusText =
    nextStatus === "merged"
      ? `${numberLabel} merged successfully. Deployment started.`
      : nextStatus === "passed"
        ? `${numberLabel} checks passed and is ready to merge.`
        : nextStatus === "failed"
          ? `${numberLabel} has failing checks. Agent will investigate.`
          : `${numberLabel} checks are running.`;
  store.appendMessage({
    id: `pr-status-${timestamp}-${nextNumber ?? "unknown"}`,
    role: "system",
    variant: "tip",
    text: statusText,
    timestamp,
  });
}

export function applyOpenHandsEventsToStore(events: OpenHandsLikeEvent[]) {
  const store = useAgentStore.getState();
  const mergedMessages = mergeChatBubbles(
    store.messages,
    eventsToChatBubbles(events),
  );
  const fileChanges = eventsToFileChanges(events);
  const worklog = eventsToWorklog(events);
  const shellLines = eventsToShellLines(events);

  store.setMessages(mergedMessages);
  store.setFileChanges(fileChanges);
  store.setWorklog(worklog);
  store.setShellLines(shellLines);

  const latestPrReady = [...events]
    .reverse()
    .find((event) => event.artifact?.type === "pr_ready")?.artifact;
  if (latestPrReady) {
    store.setPrReady(latestPrReady);
    store.setPrStatus({
      status: latestPrReady.ciStatus,
      number: latestPrReady.number,
      url: latestPrReady.url,
    });
  }

  for (const event of events) {
    if (event.tool_name !== "runtime.desktop_preview_url") continue;
    const previewValue = event.observation?.content;
    const controlValue = event.observation?.path;
    store.setDesktopState({
      previewUrl:
        typeof previewValue === "string" && previewValue.trim().length > 0
          ? previewValue
          : null,
      controlUrl:
        typeof controlValue === "string" && controlValue.trim().length > 0
          ? controlValue
          : typeof previewValue === "string" && previewValue.trim().length > 0
            ? previewValue
            : null,
      lastFrameAt: new Date().toISOString(),
    });
  }

  // Infer coarse agent state from incoming runtime events.
  if (events.length > 0) {
    store.upsertAgent({
      id: "manager",
      name: "Manager Agent",
      role: "orchestrator",
      status: "running",
    });

    const hasError = events.some((e) => Boolean(e.error));
    const hasActiveWork = events.some(
      (e) =>
        Boolean(e.tool_name) ||
        Boolean(e.action) ||
        Boolean(e.thought?.length) ||
        e.source === "agent",
    );

    store.upsertAgent({
      id: "coder",
      name: "Code Agent",
      role: "implementation",
      status: hasError ? "error" : hasActiveWork ? "running" : "idle",
    });
  }
}

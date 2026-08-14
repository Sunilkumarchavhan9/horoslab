import type { V1AppConversation } from "@/lib/continuity-lab/openhands-api";

/** Sandbox statuses that block chat until URL or readiness hints appear. */
export function isSandboxStatusStarting(status: string | null | undefined): boolean {
  const normalized = (status ?? "").trim().toUpperCase();
  return normalized === "STARTING" || normalized === "PREPARING";
}

export type RuntimeReadyHints = {
  /** VS Code proxy returned a usable URL — sandbox agent is reachable. */
  vscodeUrlReady?: boolean;
  /** Conversation already has user/agent messages from event history. */
  hasChatActivity?: boolean;
};

/**
 * Whether the OpenHands sandbox is usable for chat and live events.
 * Does not wait on stale STARTING/PREPARING when VS Code or chat history proves the sandbox is up.
 */
export function isConversationRuntimeReady(
  conversation: V1AppConversation | null,
  hints: RuntimeReadyHints = {},
): boolean {
  if (!conversation?.conversation_url?.trim()) return false;
  if (hints.vscodeUrlReady || hints.hasChatActivity) return true;
  return !isSandboxStatusStarting(conversation.sandbox_status);
}

export function isWaitingForConversationRuntime(
  conversation: V1AppConversation | null,
  conversationId: string,
  hints: RuntimeReadyHints = {},
): boolean {
  if (!conversation || conversationId.startsWith("task-")) return false;
  return !isConversationRuntimeReady(conversation, hints);
}

/** Poll intervals (before → after) documented for session page tuning. */
export const RUNTIME_POLL_INTERVALS = {
  /** Conversation metadata + vscode-url while starting: was fixed 2000ms ×2 parallel. */
  sessionRuntimeBackoffInitialMs: 3000,
  sessionRuntimeBackoffMaxMs: 15000,
  sessionRuntimeBackoffFactor: 1.45,
  /** events/search while waiting: was fixed 2500ms in openhands-event-stream. */
  eventPollWhileWaitingInitialMs: 4000,
  eventPollWhileWaitingMaxMs: 20000,
  eventPollWhileWaitingFactor: 1.4,
  /** SSE proxy poll loop: was 500ms. */
  sseProxyPollMs: 2500,
  /** Task-route conversation resolution: was 1200ms. */
  taskRouteResolveInitialMs: 2000,
  taskRouteResolveMaxMs: 10000,
} as const;

export const RUNTIME_WAIT_TIMEOUT_MS = 60_000;

export const RUNTIME_STUCK_HELP =
  "If the runtime never starts, stop dev:all and run `bun run dev:all:mock` (backend + UI only), or set MEMORYOS_SKIP_OPENHANDS_RUNTIME=1 when starting dev:all.";

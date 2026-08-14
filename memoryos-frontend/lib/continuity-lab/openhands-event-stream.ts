"use client";

import { useEffect, useRef, useState } from "react";
import type { PrReadyArtifact } from "@/lib/continuity-lab/chat-events";

export type EventStreamMode = "websocket" | "sse" | "polling" | "idle";
export type ExecutionStatus = string | null;

export type UseOpenHandsEventStreamResult = {
  mode: EventStreamMode;
  isConnected: boolean;
  isAgentThinking: boolean;
  executionStatus: ExecutionStatus | null;
  waitingForRuntime: boolean;
};

type StreamOptions = {
  conversationId: string;
  conversation: { execution_status?: string | null } | null;
  waitingForRuntime: boolean;
  onEvents: (events: OpenHandsLikeEvent[]) => void;
  pollEvents: (
    conversationId: string,
    limit?: number,
  ) => Promise<OpenHandsLikeEvent[]>;
  enabled?: boolean;
  sending?: boolean;
};

type RuntimeEventPayload = {
  id?: string;
  role?: "user" | "agent" | "system";
  text?: string;
  timestamp?: string;
  path?: string;
  kind?: "edit" | "write";
  content?: string;
  label?: string;
  detail?: string;
  command?: string;
  previewUrl?: string | null;
  controlUrl?: string | null;
  url?: string;
  number?: number;
  title?: string;
  branch?: string;
  baseBranch?: string;
  ciStatus?: PrReadyArtifact["ciStatus"];
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  status?: PrReadyArtifact["ciStatus"];
};

type RuntimeUiEventEnvelope = {
  kind: string;
  payload?: RuntimeEventPayload;
};

export type OpenHandsLikeEvent = {
  id?: string;
  timestamp?: string;
  source?: string;
  artifact?: PrReadyArtifact;
  llm_message?: {
    role?: "user" | "assistant" | "system" | "tool";
    content?: Array<{ type: string; text?: string }>;
  };
  thought?: Array<{ type: string; text?: string }>;
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

function isRuntimeUiEventEnvelope(value: unknown): value is RuntimeUiEventEnvelope {
  return Boolean(
    value &&
      typeof value === "object" &&
      "kind" in value &&
      typeof (value as { kind?: unknown }).kind === "string",
  );
}

export function mapRuntimeUiEventsToOpenHands(
  events: RuntimeUiEventEnvelope[],
): OpenHandsLikeEvent[] {
  return events.map((event) => {
    const payload = event.payload ?? {};
    const now = new Date().toISOString();
    if (event.kind === "message") {
      return {
        id: payload.id ?? `message-${now}`,
        timestamp: payload.timestamp ?? now,
        source: payload.role === "user" ? "user" : "agent",
        llm_message: {
          role:
            payload.role === "user"
              ? "user"
              : payload.role === "system"
                ? "system"
                : "assistant",
          content: [{ type: "text", text: payload.text ?? "" }],
        },
      };
    }
    if (event.kind === "file_change") {
      return {
        id: payload.id ?? `change-${now}`,
        timestamp: payload.timestamp ?? now,
        source: "agent",
        tool_name: payload.kind === "write" ? "write_file" : "edit_file",
        action: {
          kind: payload.kind === "write" ? "write" : "file_edit",
          path: payload.path ?? "unknown",
        },
        observation: {
          kind: payload.kind === "write" ? "write" : "edit",
          path: payload.path ?? "unknown",
          content: payload.content ?? undefined,
        },
      };
    }
    if (event.kind === "worklog") {
      return {
        id: payload.id ?? `worklog-${now}`,
        timestamp: payload.timestamp ?? now,
        source: "agent",
        tool_name: payload.label ?? "runtime.worklog",
        action: {
          kind: "worklog",
          path: payload.detail ?? undefined,
        },
      };
    }
    if (event.kind === "shell") {
      return {
        id: payload.id ?? `shell-${now}`,
        timestamp: payload.timestamp ?? now,
        source: "agent",
        tool_name: "execute_bash",
        action: { command: payload.command ?? "" },
      };
    }
    if (event.kind === "desktop_preview_url") {
      return {
        id: payload.id ?? `desktop-preview-${now}`,
        timestamp: payload.timestamp ?? now,
        source: "agent",
        tool_name: "runtime.desktop_preview_url",
        observation: {
          kind: "desktop_preview_url",
          content: payload.previewUrl ?? "",
          path: payload.controlUrl ?? payload.previewUrl ?? "",
        },
      };
    }
    if (event.kind === "pr_ready" && payload.url) {
      const artifact: PrReadyArtifact = {
        type: "pr_ready",
        id: payload.id ?? `pr-ready-${payload.number ?? now}`,
        url: payload.url,
        number: payload.number,
        title: payload.title ?? "Pull request ready",
        branch: payload.branch,
        baseBranch: payload.baseBranch,
        ciStatus: payload.ciStatus ?? "pending",
        filesChanged: payload.filesChanged,
        additions: payload.additions,
        deletions: payload.deletions,
      };
      return {
        id: artifact.id,
        timestamp: payload.timestamp ?? now,
        source: "agent",
        artifact,
      };
    }
    return {
      id: `runtime-${event.kind}-${now}`,
      timestamp: now,
      source: "agent",
      tool_name: `runtime.${event.kind}`,
    };
  });
}

export function dedupeOpenHandsEvents(
  events: OpenHandsLikeEvent[],
  seenIds: Set<string>,
): OpenHandsLikeEvent[] {
  return events.filter((event: OpenHandsLikeEvent) => {
    const eventId =
      event && typeof event === "object" ? String(event.id ?? "") : "";
    if (!eventId) return true;
    if (seenIds.has(eventId)) return false;
    seenIds.add(eventId);
    if (seenIds.size > 3000) {
      const first = seenIds.values().next().value;
      if (first) seenIds.delete(first);
    }
    return true;
  });
}

export function normalizeIncomingEvents(payload: unknown[]): OpenHandsLikeEvent[] {
  const runtimeEvents = payload.filter(isRuntimeUiEventEnvelope);
  if (runtimeEvents.length === payload.length) {
    return mapRuntimeUiEventsToOpenHands(runtimeEvents);
  }
  return payload as OpenHandsLikeEvent[];
}

export function useOpenHandsEventStream(
  options: StreamOptions,
): UseOpenHandsEventStreamResult {
  const {
    conversationId,
    conversation,
    waitingForRuntime,
    onEvents,
    pollEvents,
    enabled = true,
    sending = false,
  } = options;

  const [mode, setMode] = useState<EventStreamMode>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !conversationId || conversationId.startsWith("task-")) return;

    let stopPolling = false;
    let eventSource: EventSource | null = null;
    const seenIds = seenIdsRef.current;

    const emitNewEvents = (events: OpenHandsLikeEvent[]) => {
      if (!Array.isArray(events) || events.length === 0) return;
      const next = dedupeOpenHandsEvents(events, seenIds);
      if (next.length === 0) return;
      onEvents(next);
      const nowThinking = next.some(
        (event) =>
          (Array.isArray(event?.thought) && event.thought.length > 0) ||
          Boolean(event?.tool_name) ||
          event?.source === "agent",
      );
      setIsAgentThinking(nowThinking);
    };

    const pollLoop = async (initialDelayMs: number) => {
      let delay = initialDelayMs;
      while (!stopPolling) {
        try {
          const events = await pollEvents(conversationId, 240);
          if (stopPolling || !mountedRef.current) break;
          emitNewEvents(events);
          setMode("polling");
          setIsConnected(true);
          delay = waitingForRuntime ? 3000 : sending ? 1500 : 2500;
        } catch {
          if (stopPolling || !mountedRef.current) break;
          setIsConnected(false);
          delay = Math.min(Math.round(delay * 1.45), 15000);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    };

    const trySse = () => {
      if (typeof window === "undefined" || typeof EventSource === "undefined") {
        return false;
      }
      try {
        eventSource = new EventSource(
          `/api/runtime/threads/${encodeURIComponent(conversationId)}/events?stream=1`,
        );
      } catch {
        eventSource = null;
        return false;
      }

      let opened = false;
      eventSource.onopen = () => {
        opened = true;
        if (!mountedRef.current) return;
        setMode("sse");
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const parsed = JSON.parse(event.data) as { events?: unknown[] } | unknown;
          const payload = Array.isArray((parsed as { events?: unknown[] })?.events)
            ? (parsed as { events?: unknown[] }).events ?? []
            : [parsed];
          emitNewEvents(normalizeIncomingEvents(payload));
        } catch {
          // ignore malformed stream message
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!mountedRef.current || stopPolling) return;
        setIsConnected(false);
        setMode(opened ? "polling" : "idle");
      };
      return true;
    };

    const sseStarted = trySse();
    void pollLoop(sseStarted ? 4000 : 0);

    return () => {
      stopPolling = true;
      if (eventSource) {
        eventSource.close();
      }
      setIsConnected(false);
      setMode("idle");
    };
  }, [conversationId, enabled, onEvents, pollEvents, sending, waitingForRuntime]);

  return {
    mode,
    isConnected,
    isAgentThinking,
    executionStatus: conversation?.execution_status ?? null,
    waitingForRuntime,
  };
}

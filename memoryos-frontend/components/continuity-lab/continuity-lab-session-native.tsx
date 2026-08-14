"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Laptop, MoreHorizontal, Square, X } from "lucide-react";
import { ContinuityLabSessionMessages } from "@/components/continuity-lab/continuity-lab-session-messages";
import { ContinuityLabSessionChatInput } from "@/components/continuity-lab/continuity-lab-session-chat-input";
import { ContinuityLabUnderstandingCheckSheet } from "@/components/continuity-lab/continuity-lab-understanding-check-sheet";
import { ContinuityLabWaitingConfirmationBar } from "@/components/continuity-lab/continuity-lab-waiting-confirmation-bar";
import { ContinuityLabExecutionProposeModal } from "@/components/continuity-lab/continuity-lab-execution-propose-modal";
import {
  ContinuityLabSessionRail,
  type SessionRailPanel,
} from "@/components/continuity-lab/continuity-lab-session-rail";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { expandSlashCommandMessage } from "@/lib/continuity-lab/lab-continuity-lab-settings-runtime";

import type { ExecutionProposeModalPrefill } from "@/components/continuity-lab/continuity-lab-execution-propose-modal";
import { markFunnelResumed } from "@/lib/company-brain-funnel";
import {
  buildLaunchTaskFromContext,
  readMemoryOSLaunchContext,
  type MemoryOSLaunchContext,
} from "@/lib/continuity-launch-context";
import { markFunnelLabOpened } from "@/lib/company-brain-funnel";
import { readSessionDefaults } from "@/lib/continuity-lab/session-defaults-storage";
import { projectIdForLab } from "@/lib/continuity-lab/resume-brief";
import { recordLabAgentTurn } from "@/lib/continuity-lab/session-lineage";
import {
  eventsToChatBubbles,
  eventsToFileChanges,
  eventsToShellLines,
  eventsToWorklog,
  mergeChatBubbles,
  type ChatBubble,
  type FileChangeEntry,
  type ShellLineEntry,
  type WorklogEntry,
} from "@/lib/continuity-lab/chat-events";
import {
  displaySessionTitle,
  LAB_SESSION_STORAGE_EVENT,
} from "@/lib/continuity-lab/session-storage";
import { useOpenHandsEventStream } from "@/lib/continuity-lab/openhands-event-stream";
import {
  fetchVsCodePanelUrl,
  getDesktopProviderHealth,
  getAppConversation,
  getThreadDesktopStreamState,
  getThreadDesktopStatus,
  getThreadDesktopSession,
  wakeLocalDesktopProviderSession,
  queuePendingMessage,
  sendThreadDesktopInput,
  searchConversationEvents,
  sendConversationMessage,
  wakeThreadDesktopSession,
  type RuntimeDesktopSession,
  type RuntimeDesktopStreamState,
  type V1AppConversation,
} from "@/lib/continuity-lab/openhands-api";
import { readConfirmBeforeWork } from "@/lib/continuity-lab/confirm-before-work";
import {
  clearPendingUnderstanding,
  readPendingUnderstanding,
  setPendingUnderstanding,
} from "@/lib/continuity-lab/pending-understanding";
import { rememberLocalSession, resolveSessionRouteId } from "@/lib/continuity-lab/sessions";
import { syncRuntimeCredentials } from "@/lib/continuity-lab/runtime";
import { RUNTIME_POLL_INTERVALS } from "@/lib/continuity-lab/runtime-ready";
import { isWaitingForConversationRuntime } from "@/lib/continuity-lab/runtime-ready";
import { useBackoffTimeout } from "@/lib/continuity-lab/use-backoff-timeout";
import { useSessionSplit } from "@/lib/continuity-lab/use-session-split";
import {
  fetchGitHubRepoPullRequests,
  type GitHubRepoPullRequestEntry,
} from "@/lib/continuity-lab/wiki-api";
import {
  createHandoffPacket,
  createPlaybookFromSession,
  extractExperienceFromSession,
  fetchHandoffTrace,
  fetchRelevantMemories,
  retrieveCompanyMemory,
  type SessionHandoffPacket,
  type SessionMemoryExtraction,
  type SessionPlaybook,
} from "@/lib/continuity-lab/continuity-memory-api";
import { cn } from "@/lib/utils";
import { applyOpenHandsEventsToStore } from "@/lib/continuity-lab/event-adapter";
import { useAgentStore } from "@/lib/continuity-lab/agent-store";
import { readAskOsPreference } from "@/lib/continuity-lab/ask-os-preference";
import { ChevronDown } from "lucide-react";

function formatSessionError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "An unknown error occurred.";
    }
  }
  return "An unknown error occurred.";
}

function safeReplaceSessionHistory(pathname: string): void {
  if (typeof window === "undefined") return;
  const run = () => {
    try {
      window.history.replaceState(null, "", pathname);
    } catch (error) {
      // Next router can throw during very early bootstrap; ignore and keep current URL.
      console.warn(
        "[Continuity Session] history.replaceState skipped:",
        error instanceof Error ? error.message : "unknown",
      );
    }
  };
  if (document.readyState === "complete") {
    window.setTimeout(run, 0);
    return;
  }
  window.addEventListener(
    "load",
    () => window.setTimeout(run, 0),
    { once: true },
  );
}

type ContinuityLabSessionNativeProps = {
  conversationId: string;
};

export function ContinuityLabSessionNative({
  conversationId: rawConversationId,
}: ContinuityLabSessionNativeProps) {
  const {
    canStartSession,
    openCompanyModelModal,
    connector,
    refresh,
    orgLabSlashCommands,
  } = useContinuityLab();
  const [resolvedId, setResolvedId] = useState(rawConversationId);
  const [conversation, setConversation] = useState<V1AppConversation | null>(
    null,
  );
  const [launchContext, setLaunchContext] =
    useState<MemoryOSLaunchContext | null>(null);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChangeEntry[]>([]);
  const [worklog, setWorklog] = useState<WorklogEntry[]>([]);
  const [shellLines, setShellLines] = useState<ShellLineEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vscodeUrl, setVscodeUrl] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<SessionRailPanel>("changes");
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [proposePrefill, setProposePrefill] = useState<
    ExecutionProposeModalPrefill | undefined
  >();
  const [governanceRefresh, setGovernanceRefresh] = useState(0);
  const [metaRefresh, setMetaRefresh] = useState(0);
  const [writeBackBannerDismissed, setWriteBackBannerDismissed] =
    useState(false);
  const [resumeToastProject, setResumeToastProject] = useState<string | null>(
    null,
  );
  const [focusMode, setFocusMode] = useState(false);
  const [tabsPanelVisible, setTabsPanelVisible] = useState(true);
  const [railFullscreen, setRailFullscreen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("Solve bug");
  const [understandingOpen, setUnderstandingOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [sessionMemories, setSessionMemories] = useState<
    SessionMemoryExtraction[]
  >([]);
  const [handoffPacket, setHandoffPacket] =
    useState<SessionHandoffPacket | null>(null);
  const [playbook, setPlaybook] = useState<SessionPlaybook | null>(null);
  const [repoPulls, setRepoPulls] = useState<GitHubRepoPullRequestEntry[]>([]);
  const [conversationLookupFailed, setConversationLookupFailed] =
    useState(false);

  useEffect(() => {
    if (readSessionDefaults().focusModeByDefault) {
      // Keep tools rail visible by default to match Devin-style multi-panel workflow.
      setFocusMode(false);
    }
  }, []);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const recordedAgentTurnsRef = useRef<Set<string>>(new Set());
  const memoryArtifactCacheRef = useRef<{
    key: string;
    memories: Awaited<ReturnType<typeof fetchRelevantMemories>>;
    trace: Awaited<ReturnType<typeof fetchHandoffTrace>>;
  } | null>(null);
  const prevFileChangeCountRef = useRef(0);
  const autoSentLaunchRef = useRef(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [focusChangePath, setFocusChangePath] = useState<string | null>(null);
  const [wakingDesktop, setWakingDesktop] = useState(false);
  const [desktopStreamState, setDesktopStreamState] =
    useState<RuntimeDesktopStreamState | null>(null);
  const [desktopAutoReconnecting, setDesktopAutoReconnecting] = useState(false);
  const [desktopReconnectAttemptCount, setDesktopReconnectAttemptCount] = useState(0);
  const lastMouseInputAtRef = useRef(0);
  const reconnectInFlightRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const desktopPollFailuresRef = useRef(0);
  const setRuntimeConnected = useAgentStore((s) => s.setRuntimeConnected);
  const setDesktopState = useAgentStore((s) => s.setDesktopState);
  const desktopStatus = useAgentStore((s) => s.desktop.status);
  const desktopPreviewUrl = useAgentStore((s) => s.desktop.previewUrl);
  const desktopControlUrl = useAgentStore((s) => s.desktop.controlUrl);
  const desktopOsType = useAgentStore((s) => s.desktop.osType);

  const isTaskRoute = rawConversationId.startsWith("task-");
  const isLegacyLocalRoute = rawConversationId.startsWith("local-");
  const repoFullName =
    launchContext?.repo ?? conversation?.selected_repository ?? null;
  const githubConnected = connector.payload.github.connected;
  const defaultBranch =
    launchContext?.branch ?? conversation?.selected_branch ?? "main";
  const labProjectId = useMemo(
    () =>
      projectIdForLab({
        repoFullName,
        fallbackProject: launchContext?.project ?? null,
      }),
    [repoFullName, launchContext?.project],
  );

  const hasChatActivity = bubbles.some(
    (bubble) => bubble.role === "user" || bubble.role === "agent",
  );
  const resolvedDesktopUrl = desktopControlUrl ?? desktopPreviewUrl ?? null;
  const desktopReady = Boolean(resolvedDesktopUrl);
  const desktopWaiting = !isTaskRoute && !desktopReady;
  const conversationReady = Boolean(conversation);
  const waitingForRuntime = isWaitingForConversationRuntime(
    conversation,
    resolvedId,
    {
      vscodeUrlReady: Boolean(resolvedDesktopUrl),
      hasChatActivity,
    },
  );
  const showTabsPanel = tabsPanelVisible && !focusMode;

  const normalizeRailPanel = useCallback(
    (panel: SessionRailPanel | "changes" | "pr"): SessionRailPanel => {
      if (panel === "desktop" || panel === "session") return "changes";
      return panel;
    },
    [],
  );

  const resolveDesktopOsType = useCallback(
    () => desktopOsType ?? readAskOsPreference(),
    [desktopOsType],
  );

  const openProposeModal = useCallback(
    (prefill?: ExecutionProposeModalPrefill) => {
      setProposePrefill(prefill);
      setProposeModalOpen(true);
    },
    [],
  );

  const applyEvents = useCallback(
    (events: Parameters<typeof eventsToChatBubbles>[0]) => {
      setBubbles((prev) => mergeChatBubbles(prev, eventsToChatBubbles(events)));
      setFileChanges((prev) => {
        const byId = new Map(prev.map((entry) => [entry.id, entry]));
        for (const entry of eventsToFileChanges(events))
          byId.set(entry.id, entry);
        return [...byId.values()];
      });
      setWorklog((prev) => {
        const byId = new Map(prev.map((entry) => [entry.id, entry]));
        for (const entry of eventsToWorklog(events)) byId.set(entry.id, entry);
        return [...byId.values()].sort((a, b) =>
          a.timestamp.localeCompare(b.timestamp),
        );
      });
      setShellLines((prev) => {
        const byId = new Map(prev.map((entry) => [entry.id, entry]));
        for (const entry of eventsToShellLines(events))
          byId.set(entry.id, entry);
        return [...byId.values()].sort((a, b) =>
          a.timestamp.localeCompare(b.timestamp),
        );
      });
      applyOpenHandsEventsToStore(events);
    },
    [],
  );

  useEffect(() => {
    function handleOpenPanel(event: Event) {
      const custom = event as CustomEvent<{
        panel?: SessionRailPanel | "changes" | "pr";
        path?: string;
      }>;
      const panel = custom.detail?.panel;
      if (panel) {
        setTabsPanelVisible(true);
        setFocusMode(false);
        const normalizedPanel = normalizeRailPanel(panel);
        setRightPanel(normalizedPanel);
        if (normalizedPanel === "changes" && custom.detail?.path) {
          setFocusChangePath(custom.detail.path);
        }
      }
    }
    window.addEventListener(
      "continuity-lab-open-panel",
      handleOpenPanel as EventListener,
    );
    return () =>
      window.removeEventListener(
        "continuity-lab-open-panel",
        handleOpenPanel as EventListener,
      );
  }, [normalizeRailPanel]);

  const refreshEvents = useCallback(async () => {
    if (
      !conversationReady ||
      !resolvedId ||
      resolvedId.startsWith("task-") ||
      isLegacyLocalRoute
    )
      return;
    const events = await searchConversationEvents(resolvedId, 120);
    applyEvents(events);
  }, [conversationReady, resolvedId, applyEvents, isLegacyLocalRoute]);

  const {
    isConnected: streamConnected,
    isAgentThinking,
  } = useOpenHandsEventStream({
    conversationId: resolvedId,
    conversation,
    waitingForRuntime,
    onEvents: applyEvents,
    pollEvents: searchConversationEvents,
    enabled:
      !conversationLookupFailed &&
      !resolvedId.startsWith("task-") &&
      !isLegacyLocalRoute,
    sending,
  });

  const loadConversation = useCallback(async (id: string) => {
    if (id.startsWith("local-")) return null;
    const data = await getAppConversation(id);
    if (data) {
      setConversation(data);
      rememberLocalSession({
        id: data.id,
        title: data.title ?? data.selected_repository ?? "Continuity Lab session",
        repo: data.selected_repository ?? null,
        createdAt: data.created_at ?? new Date().toISOString(),
        updatedAt: data.updated_at ?? new Date().toISOString(),
        source: "continuity_thread",
        navigable: true,
        status: data.execution_status ?? data.sandbox_status ?? null,
        sandboxStatus: data.sandbox_status ?? null,
        executionStatus: data.execution_status ?? null,
      });
      setConversationLookupFailed(false);
      setError(null);
    } else {
      setConversationLookupFailed(true);
      setError(`Runtime session ${id} was not found.`);
    }
    return data;
  }, []);

  const pollConversation = useCallback(async () => {
    if (
      conversationReady ||
      conversationLookupFailed ||
      !resolvedId ||
      resolvedId.startsWith("task-") ||
      isLegacyLocalRoute
    ) {
      return;
    }
    const data = await loadConversation(resolvedId);
    if (data) {
      setError(null);
    }
  }, [
    conversationReady,
    conversationLookupFailed,
    resolvedId,
    isLegacyLocalRoute,
    loadConversation,
  ]);

  useEffect(() => {
    setResolvedId(rawConversationId);
    setConversation(null);
    setConversationLookupFailed(false);
    setError(null);
    setVscodeUrl(null);
  }, [rawConversationId]);

  useEffect(() => {
    const fromStorage = readMemoryOSLaunchContext();
    if (fromStorage) setLaunchContext(fromStorage);
    markFunnelLabOpened();
    void syncRuntimeCredentials();
  }, []);

  useEffect(() => {
    function onMeta() {
      setMetaRefresh((n) => n + 1);
    }
    window.addEventListener(LAB_SESSION_STORAGE_EVENT, onMeta);
    return () => window.removeEventListener(LAB_SESSION_STORAGE_EVENT, onMeta);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "b" || e.key === "B") &&
        e.ctrlKey &&
        e.altKey &&
        !e.shiftKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        setTabsPanelVisible((visible) => !visible);
        return;
      }
      if (e.key !== "f" && e.key !== "F") return;
      if (!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey) return;
      e.preventDefault();
      setFocusMode((on) => !on);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const resolveTaskRoute = useCallback(async () => {
    if (!rawConversationId.startsWith("task-")) return;
    const id = await resolveSessionRouteId(rawConversationId);
    if (id && !id.startsWith("task-")) {
      setResolvedId(id);
      safeReplaceSessionHistory(`/continuity-lab/session/${encodeURIComponent(id)}`);
      void loadConversation(id);
      void refreshEvents();
      void fetchVsCodePanelUrl(id).then((url) => url && setVscodeUrl(url));
    }
  }, [rawConversationId, loadConversation, refreshEvents]);

  useBackoffTimeout(resolveTaskRoute, {
    enabled: rawConversationId.startsWith("task-"),
    initialMs: RUNTIME_POLL_INTERVALS.taskRouteResolveInitialMs,
    maxMs: RUNTIME_POLL_INTERVALS.taskRouteResolveMaxMs,
    factor: 1.35,
    runImmediately: true,
  });

  useBackoffTimeout(pollConversation, {
    enabled:
      !conversationLookupFailed &&
      !conversationReady &&
      !resolvedId.startsWith("task-") &&
      !isLegacyLocalRoute,
    initialMs: RUNTIME_POLL_INTERVALS.sessionRuntimeBackoffInitialMs,
    maxMs: RUNTIME_POLL_INTERVALS.sessionRuntimeBackoffMaxMs,
    factor: RUNTIME_POLL_INTERVALS.sessionRuntimeBackoffFactor,
    runImmediately: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setError(null);
      const id = await resolveSessionRouteId(rawConversationId);
      if (cancelled) return;
      setResolvedId(id);

      if (id !== rawConversationId && typeof window !== "undefined") {
        safeReplaceSessionHistory(
          `/continuity-lab/session/${encodeURIComponent(id)}`,
        );
      }

      const conv = await loadConversation(id);
      if (cancelled) return;

      if (!conv && !id.startsWith("task-") && !id.startsWith("local-")) {
        setError("Session not found. It may still be starting.");
        setConversationLookupFailed(true);
        return;
      }

      if (conv && !id.startsWith("task-") && !id.startsWith("local-")) {
        await refreshEvents();
        const url = await fetchVsCodePanelUrl(id);
        if (url) setVscodeUrl(url);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [rawConversationId, loadConversation, refreshEvents]);

  const applyDesktopSession = useCallback(
    (desktop: RuntimeDesktopSession | null) => {
      setDesktopState({
        status:
          desktop?.state === "error"
            ? "error"
            : desktop?.state === "live"
              ? "live"
              : desktop?.state === "idle"
                ? "idle"
              : "starting",
        osType: desktop?.osType ?? null,
        previewUrl: desktop?.previewUrl ?? resolvedDesktopUrl ?? null,
        controlUrl: desktop?.controlUrl ?? resolvedDesktopUrl ?? null,
        provider: desktop?.provider,
        runtimeMessage: desktop?.runtimeMessage ?? null,
        lastFrameAt: desktop?.lastFrameAt ?? new Date().toISOString(),
      });
    },
    [resolvedDesktopUrl, setDesktopState],
  );

  const pollRuntimeStatus = useCallback(async () => {
    if (
      !conversationReady ||
      !resolvedId ||
      resolvedId.startsWith("task-") ||
      isLegacyLocalRoute
    )
      return;
    const { desktop } = await getThreadDesktopStatus(resolvedId);
    applyDesktopSession(desktop);
    const stream = await getThreadDesktopStreamState(resolvedId);
    if (stream) setDesktopStreamState(stream);
    if (desktop) {
      desktopPollFailuresRef.current = 0;
    } else {
      desktopPollFailuresRef.current += 1;
      if (desktopPollFailuresRef.current >= 3) {
        const providerHealth = await getDesktopProviderHealth();
        const healthMessage = providerHealth
          ? providerHealth.healthy
            ? `Desktop transport healthy (${providerHealth.provider}). Waiting for session...`
            : `Desktop transport unavailable: ${providerHealth.detail}`
          : "Desktop status transport unavailable. Retrying.";
        setDesktopState({
          status: providerHealth?.healthy === false ? "error" : "starting",
          runtimeMessage: healthMessage,
          lastFrameAt: new Date().toISOString(),
        });
      }
    }
  }, [
    resolvedId,
    conversationReady,
    isLegacyLocalRoute,
    applyDesktopSession,
    setDesktopState,
  ]);

  const sendDesktopInput = useCallback(
    async (
      event:
        | { type: "mouse_move"; x: number; y: number }
        | { type: "mouse_click"; x: number; y: number; button?: "left" | "middle" | "right"; action?: "down" | "up" | "click" | "double_click" }
        | { type: "scroll"; x?: number; y?: number; deltaX: number; deltaY: number }
        | { type: "key"; key: string; action?: "down" | "up" | "press"; modifiers?: Array<"ctrl" | "alt" | "shift" | "meta"> }
        | { type: "text"; text: string },
    ) => {
      if (!resolvedId || resolvedId.startsWith("task-") || isLegacyLocalRoute) return;
      if (event.type === "mouse_move") {
        const now = Date.now();
        if (now - lastMouseInputAtRef.current < 70) return;
        lastMouseInputAtRef.current = now;
      }
      await sendThreadDesktopInput(
        resolvedId,
        event,
        resolveDesktopOsType(),
      );
    },
    [isLegacyLocalRoute, resolvedId, resolveDesktopOsType],
  );

  const wakeDesktop = useCallback(async () => {
    if (!resolvedId || resolvedId.startsWith("task-")) return;
    setWakingDesktop(true);
    try {
      if (isLegacyLocalRoute) {
        const { desktop, error: localDesktopError } =
          await wakeLocalDesktopProviderSession(
            resolvedId,
            resolveDesktopOsType(),
          );
        if (localDesktopError) {
          setError(`Could not wake local desktop: ${localDesktopError}`);
        }
        applyDesktopSession(desktop);
        setTabsPanelVisible(true);
        setRightPanel("changes");
        return;
      }
      await wakeThreadDesktopSession(
        resolvedId,
        resolveDesktopOsType(),
      );
      const { desktop } = await getThreadDesktopSession(resolvedId);
      applyDesktopSession(desktop);
      await pollRuntimeStatus();
      await refreshEvents();
      setTabsPanelVisible(true);
      setRightPanel("changes");
    } finally {
      setWakingDesktop(false);
    }
  }, [
    resolvedId,
    isLegacyLocalRoute,
    applyDesktopSession,
    pollRuntimeStatus,
    refreshEvents,
    resolveDesktopOsType,
  ]);

  useEffect(() => {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (!resolvedId || resolvedId.startsWith("task-") || isLegacyLocalRoute) return;
    if (!desktopReady) {
      setDesktopAutoReconnecting(false);
      setDesktopReconnectAttemptCount(0);
      return;
    }
    if (!desktopStreamState) return;
    const disconnected =
      desktopStatus === "live" &&
      desktopStreamState.connected === false;
    if (!disconnected) {
      setDesktopAutoReconnecting(false);
      setDesktopReconnectAttemptCount(0);
      reconnectInFlightRef.current = false;
      return;
    }
    const shouldReconnect = desktopStreamState.reconnectRecommended !== false;
    if (!shouldReconnect || reconnectInFlightRef.current) return;
    const nextAttempt = desktopReconnectAttemptCount + 1;
    const baseDelay = desktopStreamState.reconnectAfterMs ?? 1400;
    const delayMs = Math.min(15000, Math.max(800, baseDelay * nextAttempt));
    setDesktopAutoReconnecting(true);
    reconnectTimerRef.current = window.setTimeout(async () => {
      reconnectInFlightRef.current = true;
      setDesktopReconnectAttemptCount(nextAttempt);
      try {
        const wake = await wakeThreadDesktopSession(
          resolvedId,
          resolveDesktopOsType(),
        );
        if (wake.ok) {
          const { desktop } = await getThreadDesktopSession(resolvedId);
          applyDesktopSession(desktop);
          await pollRuntimeStatus();
          setDesktopAutoReconnecting(false);
          setDesktopReconnectAttemptCount(0);
        }
      } finally {
        reconnectInFlightRef.current = false;
      }
    }, delayMs);
    return () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [
    applyDesktopSession,
    desktopReady,
    desktopReconnectAttemptCount,
    desktopStatus,
    desktopStreamState,
    isLegacyLocalRoute,
    pollRuntimeStatus,
    resolvedId,
    resolveDesktopOsType,
  ]);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  useBackoffTimeout(pollRuntimeStatus, {
    enabled:
      !conversationLookupFailed &&
      conversationReady &&
      !resolvedId.startsWith("task-") &&
      !isLegacyLocalRoute,
    initialMs: RUNTIME_POLL_INTERVALS.sessionRuntimeBackoffInitialMs,
    maxMs: RUNTIME_POLL_INTERVALS.sessionRuntimeBackoffMaxMs,
    factor: RUNTIME_POLL_INTERVALS.sessionRuntimeBackoffFactor,
    runImmediately: true,
  });

  useEffect(() => {
    if (
      conversationLookupFailed ||
      !conversationReady ||
      !resolvedId ||
      resolvedId.startsWith("task-") ||
      isLegacyLocalRoute
    ) {
      return;
    }
    const refreshOnReconnect = () => {
      if (document.visibilityState === "hidden") return;
      void pollRuntimeStatus();
    };
    window.addEventListener("online", refreshOnReconnect);
    window.addEventListener("focus", refreshOnReconnect);
    document.addEventListener("visibilitychange", refreshOnReconnect);
    return () => {
      window.removeEventListener("online", refreshOnReconnect);
      window.removeEventListener("focus", refreshOnReconnect);
      document.removeEventListener("visibilitychange", refreshOnReconnect);
    };
  }, [
    conversationLookupFailed,
    conversationReady,
    isLegacyLocalRoute,
    pollRuntimeStatus,
    resolvedId,
  ]);

  useEffect(() => {
    if (!vscodeUrl && desktopPreviewUrl) {
      setVscodeUrl(desktopPreviewUrl);
    }
  }, [desktopPreviewUrl, vscodeUrl]);

  useEffect(() => {
    if (
      conversationLookupFailed ||
      !conversationReady ||
      !resolvedId ||
      resolvedId.startsWith("task-") ||
      isLegacyLocalRoute
    ) {
      return;
    }
    void refreshEvents();
    void fetchVsCodePanelUrl(resolvedId).then((url) => {
      if (url) setVscodeUrl(url);
    });
  }, [
    conversationReady,
    conversationLookupFailed,
    isLegacyLocalRoute,
    refreshEvents,
    resolvedId,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles.length, sending, isAgentThinking]);

  useEffect(() => {
    if (!resolvedId || resolvedId.startsWith("task-")) return;
    const projectId = projectIdForLab({
      repoFullName:
        launchContext?.repo ?? conversation?.selected_repository ?? null,
      fallbackProject: launchContext?.project ?? null,
    });
    for (const bubble of bubbles) {
      if (bubble.role !== "agent" || bubble.id.startsWith("optimistic-"))
        continue;
      if (recordedAgentTurnsRef.current.has(bubble.id)) continue;
      recordedAgentTurnsRef.current.add(bubble.id);
      void recordLabAgentTurn({
        sessionId: resolvedId,
        projectId,
        eventId: bubble.id,
      });
    }
  }, [bubbles, resolvedId, launchContext, conversation?.selected_repository]);

  useEffect(() => {
    if (fileChanges.length > prevFileChangeCountRef.current) {
      setWriteBackBannerDismissed(false);
    }
    prevFileChangeCountRef.current = fileChanges.length;
  }, [fileChanges.length]);

  useEffect(() => {
    if (tabsPanelVisible) return;
    const hasPrReady = bubbles.some(
      (bubble) =>
        bubble.variant === "artifact" && bubble.artifact?.type === "pr_ready",
    );
    if (hasPrReady) {
      setTabsPanelVisible(true);
      setRightPanel("pr");
      return;
    }
    if (fileChanges.length > 0) {
      setTabsPanelVisible(true);
      setRightPanel("changes");
      return;
    }
    if (worklog.length > 0) {
      setTabsPanelVisible(true);
      setRightPanel("worklog");
      return;
    }
    if (shellLines.length > 0) {
      setTabsPanelVisible(true);
      setRightPanel("shell");
      return;
    }
    if (launchContext || bubbles.length > 0) {
      setTabsPanelVisible(true);
      setRightPanel("changes");
    }
  }, [bubbles, fileChanges.length, launchContext, shellLines.length, tabsPanelVisible, worklog.length]);

  const showWriteBackBanner =
    fileChanges.length > 0 && !writeBackBannerDismissed && !isTaskRoute;

  const writeBackPrefill = useMemo(():
    | ExecutionProposeModalPrefill
    | undefined => {
    if (fileChanges.length === 0) return undefined;
    const paths = fileChanges.map((c) => c.path).slice(0, 6);
    const goal = `Governed write-back after agent edits: ${paths.join(", ")}`;
    return {
      goal,
      commentBody: `Continuity Lab session proposed a governed write-back for:\n${paths.map((p) => `- ${p}`).join("\n")}`,
      actionKind: githubConnected && repoFullName ? "issue_comment" : "noop",
    };
  }, [fileChanges, githubConnected, repoFullName]);

  function handleExecutionComplete(project: string | null) {
    void refresh();
    if (project) {
      setResumeToastProject(project);
    }
    setGovernanceRefresh((n) => n + 1);
  }

  function requestSendDraft() {
    const text = draft.trim();
    if (!text || sending) return;

    if (!canStartSession) {
      setError(
        "Save your Company Model (OpenRouter key + model) before chatting.",
      );
      openCompanyModelModal();
      return;
    }

    if (readConfirmBeforeWork()) {
      setPendingMessage(text);
      setPendingUnderstanding({ sessionId: resolvedId, text });
      setUnderstandingOpen(true);
      return;
    }

    void submitDraft(text);
  }

  const submitDraft = useCallback(async (messageText?: string) => {
    const raw = (messageText ?? draft).trim();
    if (!raw || sending) return;
    const text = expandSlashCommandMessage(raw, orgLabSlashCommands);

    if (!canStartSession) {
      setError(
        "Save your Company Model (OpenRouter key + model) before chatting.",
      );
      openCompanyModelModal();
      return;
    }

    setError(null);
    clearPendingUnderstanding();
    setPendingMessage(null);
    setUnderstandingOpen(false);
    setSending(true);
    const optimistic: ChatBubble = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setBubbles((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      if (resolvedId.startsWith("task-")) {
        const taskKey = resolvedId.slice("task-".length);
        await queuePendingMessage(taskKey, text);
      } else {
        const result = await sendConversationMessage(resolvedId, text);
        if (!result.ok) {
          if (result.status === 401 || result.status === 403) {
            setError(
              "OpenRouter authentication failed. Update your Company Model key and try again.",
            );
            openCompanyModelModal();
          } else if (result.status === 409) {
            await queuePendingMessage(resolvedId, text);
          } else {
            setError(
              formatSessionError(result.error ?? "Could not send message."),
            );
          }
        }
      }
      await refreshEvents();
    } catch {
      setError(
        "Could not send message. Is the Continuity Labs runtime running?",
      );
    } finally {
      setSending(false);
    }
  }, [
    canStartSession,
    draft,
    openCompanyModelModal,
    orgLabSlashCommands,
    refreshEvents,
    resolvedId,
    sending,
  ]);

  useEffect(() => {
    if (autoSentLaunchRef.current) return;
    if (!launchContext || !resolvedId || resolvedId.startsWith("task-")) return;
    if (hasChatActivity || sending) return;

    const storageKey = `memoryos.continuity-lab.launch-sent.${resolvedId}`;
    if (window.sessionStorage.getItem(storageKey) === "1") return;

    const text = buildLaunchTaskFromContext(launchContext).trim();
    if (!text) return;

    autoSentLaunchRef.current = true;
    window.sessionStorage.setItem(storageKey, "1");

    if (waitingForRuntime) {
      setBubbles((prev) => [
        ...prev,
        {
          id: `optimistic-launch-${Date.now()}`,
          role: "user",
          text,
          timestamp: new Date().toISOString(),
        },
      ]);
      void queuePendingMessage(resolvedId, text).then(() => refreshEvents());
      return;
    }

    void submitDraft(text);
  }, [
    hasChatActivity,
    launchContext,
    refreshEvents,
    resolvedId,
    sending,
    waitingForRuntime,
    submitDraft,
  ]);

  const sessionPendingUnderstanding = readPendingUnderstanding(resolvedId);

  const showWaitingConfirmation =
    understandingOpen ||
    Boolean(pendingMessage) ||
    Boolean(sessionPendingUnderstanding);

  const visibleBubbles = useMemo<ChatBubble[]>(() => {
    return bubbles;
  }, [bubbles]);

  const desktopStuck = false;
  const chatPlaceholder = repoFullName
    ? `Ask MemoryOS to work in ${repoFullName} — fix bugs, change code, verify, and prepare PRs`
    : "Ask MemoryOS to build features, fix bugs, or work on your code";

  useEffect(() => {
    setRuntimeConnected(streamConnected);
    const status = desktopStuck
      ? "error"
      : waitingForRuntime || desktopWaiting
        ? "starting"
        : desktopReady
          ? "live"
          : "idle";

    const runtimeMessage = desktopStuck
      ? "Runtime unreachable."
      : waitingForRuntime
        ? "Waiting for runtime to boot…"
        : desktopWaiting
          ? "Runtime starting…"
          : desktopReady
            ? "Desktop live"
            : "Runtime idle";

    setDesktopState({
      status,
      ...(resolvedDesktopUrl ? { previewUrl: resolvedDesktopUrl } : {}),
      runtimeMessage,
      lastFrameAt: new Date().toISOString(),
    });
  }, [
    desktopPreviewUrl,
    desktopReady,
    desktopStuck,
    desktopWaiting,
    resolvedDesktopUrl,
    setDesktopState,
    setRuntimeConnected,
    streamConnected,
    vscodeUrl,
    waitingForRuntime,
  ]);

  const sessionTitle = useMemo(() => {
    void metaRefresh;
    const fallbackTitle =
      resolvedId && resolvedId !== "new"
        ? `Session ${resolvedId.slice(0, 8)}`
        : "Session";
    return (
      launchContext?.project ??
      displaySessionTitle(
        resolvedId,
        conversation?.title?.trim() || fallbackTitle,
      )
    );
  }, [metaRefresh, launchContext?.project, resolvedId, conversation?.title]);

  useEffect(() => {
    if (!headerTitle.trim() || headerTitle === "Solve bug") {
      setHeaderTitle(sessionTitle || "Solve bug");
    }
  }, [sessionTitle, headerTitle]);

  const agentAsleep =
    !isTaskRoute &&
    !sending &&
    !isAgentThinking &&
    bubbles.some((b) => b.role === "agent" && b.variant !== "thought");

  const lastUserQuestion = useMemo(() => {
    const users = bubbles.filter((b) => b.role === "user");
    return users.length > 0 ? users[users.length - 1]!.text : null;
  }, [bubbles]);

  useEffect(() => {
    let cancelled = false;
    async function loadRepoCollections() {
      if (!repoFullName || !githubConnected) {
        setRepoPulls([]);
        return;
      }
      const parts = repoFullName.split("/", 2);
      if (parts.length !== 2) return;
      const [owner, repo] = parts;
      const pulls = await fetchGitHubRepoPullRequests(owner!, repo!, 8);
      if (cancelled) return;
      setRepoPulls(pulls);
    }
    void loadRepoCollections();
    return () => {
      cancelled = true;
    };
  }, [githubConnected, repoFullName]);

  useEffect(() => {
    let cancelled = false;
    async function loadMemoryArtifacts() {
      if (
        !resolvedId ||
        resolvedId.startsWith("task-") ||
        resolvedId.startsWith("local-")
      )
        return;
      const question =
        lastUserQuestion ??
        launchContext?.currentGoal ??
        launchContext?.briefSummary ??
        sessionTitle;
      const memoryKey = [
        resolvedId,
        labProjectId,
        repoFullName ?? "",
        question,
      ].join("\u001f");
      const cached = memoryArtifactCacheRef.current;
      let rankedMemories: Awaited<ReturnType<typeof fetchRelevantMemories>>;
      let trace: Awaited<ReturnType<typeof fetchHandoffTrace>>;
      if (cached?.key === memoryKey) {
        rankedMemories = cached.memories;
        trace = cached.trace;
      } else {
        [rankedMemories, trace] = await Promise.all([
          fetchRelevantMemories({
            projectId: labProjectId,
            repo: repoFullName,
            question,
            topK: 8,
          }),
          fetchHandoffTrace({
            projectId: labProjectId,
            repo: repoFullName,
            question,
            topK: 6,
          }),
        ]);
        memoryArtifactCacheRef.current = {
          key: memoryKey,
          memories: rankedMemories,
          trace,
        };
      }
      if (cancelled) return;
      const injected = retrieveCompanyMemory({
        question,
        launchContext,
        memories: rankedMemories,
        handoff: trace,
      });
      const files = fileChanges.map((change) => change.path);
      const commands = shellLines.map((line) => line.command);
      const workItems = worklog.map(
        (entry) => `${entry.label}${entry.detail ? `: ${entry.detail}` : ""}`,
      );
      const extracted = extractExperienceFromSession({
        question,
        files,
        commands,
        worklog: workItems,
        memories: injected,
        handoff: trace,
      });
      setSessionMemories(extracted);
      setHandoffPacket(
        createHandoffPacket({
          question,
          injectedMemory: injected,
          newMemories: extracted,
          handoff: trace,
        }),
      );
      setPlaybook(
        createPlaybookFromSession({
          question,
          files,
          commands,
          newMemories: extracted,
        }),
      );
    }
    void loadMemoryArtifacts();
    return () => {
      cancelled = true;
    };
  }, [
    fileChanges,
    labProjectId,
    lastUserQuestion,
    launchContext,
    repoFullName,
    resolvedId,
    sessionTitle,
    shellLines,
    worklog,
  ]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const update = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJumpToLatest(distance > 160);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  const {
    containerRef,
    splitStyle,
    railExpanded,
    toggleRailExpanded,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  } = useSessionSplit();

  return (
    <div
      className="continuity-lab-session-root flex h-full min-h-0 flex-col"
      suppressHydrationWarning
    >
      {showWaitingConfirmation ? (
        <ContinuityLabWaitingConfirmationBar
          onReview={() => {
            const text =
              pendingMessage ??
              sessionPendingUnderstanding?.text ??
              draft.trim();
            if (text) {
              setPendingMessage(text);
              setUnderstandingOpen(true);
            }
          }}
        />
      ) : null}

      {error ? (
        <div className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-100">
          {formatSessionError(error)}
          {(formatSessionError(error).includes("Company Model") ||
            formatSessionError(error).includes("OpenRouter")) && (
            <>
              {" "}
              <button
                type="button"
                onClick={openCompanyModelModal}
                className="font-semibold text-rose-50 underline"
              >
                Open Company Model
              </button>
            </>
          )}
        </div>
      ) : null}

      <div
        ref={containerRef}
        style={splitStyle}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
      >
        <section
            className={cn(
              "relative flex min-h-0 min-w-0 flex-col border-[#2F2F2F]",
              railFullscreen && "hidden lg:hidden",
              showTabsPanel
                ? "lg:w-[var(--session-chat-pane)] lg:shrink-0 lg:grow-0"
                : "lg:w-full lg:flex-1",
              focusMode && "lg:flex-1 lg:!w-auto lg:border-r-0",
            )}
        >
          <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#2A2A2A] bg-[#0A0A0A] px-3">
            <div className="flex min-w-0 items-center gap-2">
              <input
                value={headerTitle}
                onChange={(event) => setHeaderTitle(event.target.value)}
                className="h-8 w-[220px] max-w-[58vw] rounded-md border border-[#1f4da4]/70 bg-[#101317] px-2.5 text-[21px] font-semibold text-white outline-none focus:border-[#3b82f6]"
                aria-label="Session title"
              />
              <span className="inline-flex items-center gap-1 rounded-md border border-[#1f4da4]/60 bg-[#102849] px-2 py-0.5 text-[11px] font-medium text-[#6ca8ff]">
                <Laptop className="size-3" />
                Windows
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex size-6 items-center justify-center rounded-md text-white/45 hover:bg-[#141414] hover:text-white"
                aria-label="Header menu"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTabsPanelVisible((visible) => !visible)}
                className="inline-flex size-6 items-center justify-center rounded-md text-white/45 hover:bg-[#141414] hover:text-white"
                aria-label="Toggle tabs panel"
              >
                <Square className="size-3.5" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex flex-1 flex-col xl:flex-row">
            <div
              ref={chatScrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
              data-continuity-lab-scroll-root
            >
              <ContinuityLabSessionMessages
                bubbles={visibleBubbles}
                worklog={worklog}
                shellLines={shellLines}
                launchContext={launchContext}
                isAgentThinking={isAgentThinking}
                agentAsleep={agentAsleep}
                messagesEndRef={messagesEndRef}
              />
            </div>
          </div>

          {showJumpToLatest ? (
            <button
              type="button"
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="absolute bottom-24 left-1/2 z-10 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1a]/95 text-white/80 shadow-lg backdrop-blur hover:bg-[#222] hover:text-white"
              aria-label="Jump to latest message"
              title="Jump to latest"
            >
              <ChevronDown className="size-4" />
            </button>
          ) : null}

          <ContinuityLabSessionChatInput
            value={draft}
            onChange={setDraft}
            onSubmit={requestSendDraft}
            slashCommands={orgLabSlashCommands}
            sending={sending}
            disabled={isTaskRoute}
            placeholder={chatPlaceholder}
          />
        </section>

        {showTabsPanel ? (
          <>
            <button
              type="button"
              aria-label="Resize chat and tools panes"
              title="Drag to resize chat and tools panes"
              disabled={railExpanded || focusMode}
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
              className={cn(
                "group hidden w-1.5 shrink-0 touch-none items-stretch justify-center border-l border-[#2F2F2F] bg-[#0A0A0A] transition lg:flex",
                railFullscreen && "lg:hidden",
                focusMode && "lg:hidden",
                railExpanded
                  ? "cursor-default opacity-40"
                  : "cursor-col-resize hover:bg-[#141414]",
              )}
            >
              <span
                className={cn(
                  "my-auto h-12 w-px bg-[#3A3A3A] transition",
                  !railExpanded && "group-hover:bg-[#6366F1]/80",
                )}
              />
            </button>

            <ContinuityLabSessionRail
              focusChangePath={focusChangePath}
              panel={rightPanel}
              onPanelChange={setRightPanel}
              fileChanges={fileChanges}
              worklog={worklog}
              shellLines={shellLines}
              vscodeUrl={resolvedDesktopUrl}
              desktopControlUrl={
                desktopControlUrl ?? desktopPreviewUrl ?? null
              }
              desktopWaiting={desktopWaiting}
              desktopReady={desktopReady}
              wakingDesktop={wakingDesktop}
              showWriteBackBanner={showWriteBackBanner}
              writeBackPrefill={writeBackPrefill}
              onOpenPropose={openProposeModal}
              onDismissWriteBackBanner={() => setWriteBackBannerDismissed(true)}
              labProjectId={labProjectId}
              sessionId={resolvedId}
              repoFullName={repoFullName}
              sessionQuestion={lastUserQuestion}
              launchContext={launchContext}
              sessionMemories={sessionMemories}
              handoffPacket={handoffPacket}
              playbook={playbook}
              sessionTitle={sessionTitle}
              defaultBranch={defaultBranch}
              repoPulls={repoPulls}
              governanceRefresh={governanceRefresh}
              onGovernanceExecuted={handleExecutionComplete}
              railExpanded={railExpanded}
              onToggleRailExpanded={toggleRailExpanded}
              railFullscreen={railFullscreen}
              onToggleRailFullscreen={() => {
                setRailFullscreen((full) => {
                  const next = !full;
                  if (next) setRightPanel(null);
                  return next;
                });
              }}
              onToggleTabsPanel={() => setTabsPanelVisible((visible) => !visible)}
              onWakeDesktop={wakeDesktop}
              onDesktopInput={sendDesktopInput}
              desktopStreamState={desktopStreamState}
              desktopAutoReconnecting={desktopAutoReconnecting}
              desktopReconnectAttemptCount={desktopReconnectAttemptCount}
              className={cn(
                "min-h-[40vh] w-full min-w-0 lg:min-h-0",
                railFullscreen
                  ? "lg:w-full lg:shrink-0 lg:grow-1"
                  : "lg:w-[var(--session-rail-pane)] lg:shrink-0 lg:grow-0",
              )}
            />
          </>
        ) : null}
      </div>

      {resumeToastProject ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-[min(100%,28rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 border border-[#2F2F2F] bg-[#0A0A0A]/95 px-4 py-3 text-center shadow-lg">
          <p className="pointer-events-auto text-xs text-white/80">
            Execution saved. Resume{" "}
            <span className="font-semibold text-white">
              {resumeToastProject}
            </span>
            ?
          </p>
          <Link
            href="/continuity-lab"
            onClick={() => {
              markFunnelResumed(resumeToastProject);
              setResumeToastProject(null);
            }}
            className="pointer-events-auto border border-[#6366F1] bg-[#4338CA] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#4f46e5]"
          >
            Resume project
          </Link>
          <button
            type="button"
            onClick={() => setResumeToastProject(null)}
            className="pointer-events-auto text-white/40 hover:text-white/70"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <ContinuityLabUnderstandingCheckSheet
        open={understandingOpen}
        prompt={pendingMessage ?? draft}
        loading={sending}
        onEdit={() => {
          if (pendingMessage) setDraft(pendingMessage);
          setUnderstandingOpen(false);
          setPendingMessage(null);
          clearPendingUnderstanding();
        }}
        onClose={() => {
          setUnderstandingOpen(false);
          setPendingMessage(null);
          clearPendingUnderstanding();
        }}
        onConfirm={() => {
          const text = pendingMessage ?? draft.trim();
          if (text) void submitDraft(text);
        }}
      />

      <ContinuityLabExecutionProposeModal
        open={proposeModalOpen}
        onClose={() => {
          setProposeModalOpen(false);
          setProposePrefill(undefined);
        }}
        githubConnected={githubConnected}
        repoFullName={repoFullName}
        projectId={labProjectId}
        sessionId={resolvedId.startsWith("task-") ? undefined : resolvedId}
        prefill={proposePrefill}
        onProposed={() => {
          setGovernanceRefresh((n) => n + 1);
          setRightPanel("pr");
          void refresh();
        }}
      />
    </div>
  );
}

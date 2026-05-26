"use client";

import { type CSSProperties, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import {
  formatMemoryForDisplay,
} from "@/lib/memory-display-text";
import {
  clearPlaygroundSettings,
  readPlaygroundSettings,
  writePlaygroundSettings,
} from "@/lib/playground-settings";
import {
  fetchMemoryTokenFromBridge,
  getOrCreateMemoryTokenWithRetry,
  readMemoryTokenFromStorage,
  writeMemoryTokenToStorage,
} from "@/lib/memory-token";
import { UsageMeter } from "@/components/developer-console/usage-meter";

type PlaygroundMode = "process" | "retrieve" | "resume" | "handoff" | "prompt";
type CenterTab = "chat" | "code" | "python";
type SetupTab = "configure" | "import";

type MemoryRecord = {
  id: string;
  type: string;
  summary: string;
  content: string;
  status: string;
  confidence: number;
  updatedAt: string;
};

type InsightsResponse = {
  totalsByType: Record<string, number>;
  totalsByStatus: Record<string, number>;
  topSkills: string[];
  activeProjects: string[];
  recentMilestones: string[];
};

type TimelineEvent = {
  id: string;
  eventType: string;
  reason?: string;
  timestamp: string;
};

type RequestEvent = {
  id: string;
  method: string;
  path: string;
  routeType: string;
  statusCode: number;
  status: "Success" | "Error";
  durationMs: number;
  createdAt: string;
};

type MemoryListResponse = {
  memories: MemoryRecord[];
  count: number;
};

type TimelineResponse = {
  events: TimelineEvent[];
  count: number;
};

type RequestHistoryResponse = {
  requests: RequestEvent[];
};

type BillingSnapshot = {
  currentPlan: "Free" | "Pro" | "Scale" | "Enterprise";
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
};

function requireArray<T>(value: unknown, label: string): T[] {
  if (Array.isArray(value)) return value as T[];
  throw new Error(`Invalid MemoryOS API response: ${label} must be an array.`);
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Invalid MemoryOS API response: ${label} must be a number.`);
}

function requireBillingSnapshot(value: BillingSnapshot): BillingSnapshot {
  if (!value || typeof value !== "object" || !("usage" in value)) {
    throw new Error("Invalid MemoryOS API response: billing usage is missing.");
  }
  return {
    ...value,
    currentPlan: value.currentPlan,
    usage: {
      tokenLimit: requireNumber(value.usage?.tokenLimit, "usage.tokenLimit"),
      tokenUsed: requireNumber(value.usage?.tokenUsed, "usage.tokenUsed"),
      searchLimit: requireNumber(value.usage?.searchLimit, "usage.searchLimit"),
      searchUsed: requireNumber(value.usage?.searchUsed, "usage.searchUsed"),
      resetInDays: requireNumber(value.usage?.resetInDays, "usage.resetInDays"),
    },
  };
}

type ContinueProjectBrief = {
  whatChangedRecently: string[];
  currentGoal: string;
  keyDecisions: string[];
  openBlockers: string[];
  riskyFiles: string[];
  nextBestAction: string;
  mustKnowContextForAgent: string[];
};

type PromptTraceItem = {
  memoryId: string;
  source: string;
  contractCategory?: string;
  confidence: number;
  whySelected: string;
};

type PromptBundle = {
  cursor: string;
  codex: string;
  claudeCode: string;
};

type TraceProof = {
  runType: "resume_prompt";
  memoryUsedCount: number;
  averageConfidence: number;
  contractCategories: string[];
  whatChangedAfterAction: string;
  summary: string;
};

type ResumePromptPayload = {
  target: "cursor" | "codex" | "claude_code";
  brief: ContinueProjectBrief;
  prompts: PromptBundle;
  traceProof?: TraceProof;
  trace: PromptTraceItem[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
};

type GraphNode = {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
  subtitle: string;
  type: string;
  color: string;
  source: "chat" | "memory" | "project" | "agent";
  reason: string;
};

type GraphEdge = {
  from: string;
  to: string;
  relation: string;
  reason: string;
};

type ModeConfig = {
  mode: PlaygroundMode;
  label: string;
  endpoint: string;
  description: string;
};

const MODE_CONFIG: ModeConfig[] = [
  {
    mode: "process",
    label: "Process",
    endpoint: "/api/memory/process",
    description: "Ingest one message into memory extraction.",
  },
  {
    mode: "retrieve",
    label: "Retrieve",
    endpoint: "/api/memory/retrieve",
    description: "Get ranked memories for the active question.",
  },
  {
    mode: "resume",
    label: "Resume",
    endpoint: "/api/memory/resume",
    description: "Build continuation state for current project.",
  },
  {
    mode: "handoff",
    label: "Handoff",
    endpoint: "/api/memory/handoff",
    description: "Generate handoff payload for another agent/human.",
  },
  {
    mode: "prompt",
    label: "Prompt",
    endpoint: "/api/memory/resume/prompt",
    description: "Generate Cursor/Codex/Claude Code prompt from continuity memory.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    if (
      isRecord(payload.error) &&
      payload.error.code === "UPGRADE_REQUIRED" &&
      typeof payload.error.message === "string"
    ) {
      return `${payload.error.message} Upgrade in Developer Console > Billing to continue.`;
    }
    if (typeof payload.error === "string" && payload.error.length > 0) {
      return payload.error;
    }
    if (typeof payload.message === "string" && payload.message.length > 0) {
      return payload.message;
    }
  }
  return fallback;
}

class ApiRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

function isUnauthorized(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const text = error.message.toLowerCase();
  return text.includes("unauthorized") || text.includes("status 401");
}

function formatTs(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "--";
  }
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm} UTC`;
}

function confidenceToPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 1) {
    return Math.max(0, Math.min(100, Math.round(value * 100)));
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function compactGraphLabel(value: string, fallback: string): string {
  const readable = formatMemoryForDisplay(value);
  const normalized = (readable || value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  const words = normalized.split(" ").slice(0, 5).join(" ");
  return words.length > 32 ? `${words.slice(0, 29)}…` : words;
}

function memoryRecordText(record: unknown): string {
  if (!isRecord(record)) return "";
  const summary = typeof record.summary === "string" ? record.summary : "";
  const content = typeof record.content === "string" ? record.content : "";
  return formatMemoryForDisplay(summary || content);
}

function responseSnippet(payload: unknown, mode: PlaygroundMode): string {
  if (!isRecord(payload)) {
    return "Received response payload.";
  }

  if (mode === "process") {
    const accepted = Array.isArray(payload.acceptedMemories) ? payload.acceptedMemories : [];
    const timeline = Array.isArray(payload.timelineEvents) ? payload.timelineEvents.length : 0;
    const headline = memoryRecordText(accepted[0]);
    if (headline) {
      return `Saved to memory: ${headline}${accepted.length > 1 ? ` (+${accepted.length - 1} more)` : ""}.`;
    }
    return `Stored update. ${accepted.length} memories accepted, ${timeline} timeline events.`;
  }

  if (mode === "retrieve") {
    const memories = Array.isArray(payload.memories) ? payload.memories : [];
    const headline = memoryRecordText(memories[0]);
    if (headline) {
      return `Top match: ${headline}${memories.length > 1 ? ` (+${memories.length - 1} more)` : ""}.`;
    }
    return `Retrieved ${memories.length} ranked memories for your question.`;
  }

  if (mode === "resume") {
    if (typeof payload.summary === "string" && payload.summary.trim().length > 0) {
      return payload.summary;
    }
    return "Resume generated for active project.";
  }

  if (mode === "handoff") {
    if (typeof payload.summary === "string" && payload.summary.trim().length > 0) {
      return payload.summary;
    }
    return "Handoff generated for active project.";
  }

  if (mode === "prompt") {
    const maybeData = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
    if (isRecord(maybeData) && isRecord(maybeData.prompts) && typeof maybeData.prompts.cursor === "string") {
      return `Prompt bundle generated. Cursor prompt preview: ${maybeData.prompts.cursor.slice(0, 220)}${maybeData.prompts.cursor.length > 220 ? "..." : ""}`;
    }
    return "Prompt bundle generated.";
  }

  return "Response received.";
}

async function fetchMemoryApi<T>(
  routePath: string,
  token: string,
  init?: RequestInit,
  apiOrigin?: string,
): Promise<T> {
  const backendOrigin =
    apiOrigin?.trim() ||
    process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() ||
    "same-origin";
  const sameOriginAlias = /^\/?same-origin\/?$/i.test(backendOrigin);
  const localPathAlias = backendOrigin.startsWith("/") && !backendOrigin.startsWith("//");
  const normalizedOrigin = (sameOriginAlias || localPathAlias ? "" : backendOrigin)
    .replace(/\/+$/, "")
    .replace(/\/api\/memory$/i, "")
    .replace(/\/api$/i, "");
  const path = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const url = `${normalizedOrigin}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiRequestError(
      extractErrorMessage(payload, `Request failed with status ${response.status} at ${url}`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

function normalizeApiOriginForRuntime(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || /^\/?same-origin\/?$/i.test(trimmed)) return "";

  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (isLocalHost && /memoryostm\.live/i.test(trimmed)) {
      return "";
    }
  }

  return trimmed;
}

type PlaygroundPaneWidths = {
  left: number;
  center: number;
  right: number;
};

export function PlaygroundSection() {
  const [mode, setMode] = useState<PlaygroundMode>("process");
  const [tab, setTab] = useState<CenterTab>("chat");
  const [token, setToken] = useState(readMemoryTokenFromStorage() ?? "");
  const [threadId, setThreadId] = useState("playground-thread-1");
  const [project, setProject] = useState("memoryos-playground");
  const [workspace, setWorkspace] = useState("memoryostm");
  const [apiOrigin, setApiOrigin] = useState(
    normalizeApiOriginForRuntime(process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN),
  );
  const [topK, setTopK] = useState(5);
  const [input, setInput] = useState("I am building MemoryOS and now focusing on Week 2 live traction.");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showWelcomePanel, setShowWelcomePanel] = useState(true);
  const [statusLine, setStatusLine] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestBrief, setLatestBrief] = useState<ContinueProjectBrief | null>(null);
  const [latestPrompt, setLatestPrompt] = useState<ResumePromptPayload | null>(null);
  const [selectedPromptTab, setSelectedPromptTab] = useState<keyof PromptBundle>("cursor");

  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [requests, setRequests] = useState<RequestEvent[]>([]);
  const [graphScale, setGraphScale] = useState(1);
  const [graphPan, setGraphPan] = useState({ x: 0, y: 0 });
  const [isGraphDragging, setIsGraphDragging] = useState(false);
  const graphDragStartRef = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const paneContainerRef = useRef<HTMLDivElement | null>(null);
  const activePaneDividerRef = useRef<"left" | "right" | null>(null);
  const [paneWidths, setPaneWidths] = useState<PlaygroundPaneWidths>({
    left: 27,
    center: 42,
    right: 31,
  });
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(true);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const lightMode = false;
  const [selectedContainerTag, setSelectedContainerTag] = useState("memoryostm");
  const [setupTab, setSetupTab] = useState<SetupTab>("configure");
  const [importText, setImportText] = useState("");

  const selectedConfig = useMemo(
    () => MODE_CONFIG.find((item) => item.mode === mode) ?? MODE_CONFIG[0],
    [mode],
  );
  const liveRequestStats = useMemo(() => {
    const total = requests.length;
    const successful = requests.filter((request) => request.statusCode >= 200 && request.statusCode < 400).length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : null;
    const p95LatencyMs = total > 0
      ? [...requests]
          .map((request) => request.durationMs)
          .filter((duration) => Number.isFinite(duration))
          .sort((a, b) => a - b)[Math.max(0, Math.floor(total * 0.95) - 1)] ?? null
      : null;

    return { total, successRate, p95LatencyMs };
  }, [requests]);
  const paneStyle = useMemo(
    () =>
      ({
        "--playground-left-pane": `${paneWidths.left}%`,
        "--playground-center-pane": `${paneWidths.center}%`,
        "--playground-right-pane": `${paneWidths.right}%`,
      }) as CSSProperties,
    [paneWidths],
  );

  const updatePaneWidths = useCallback((divider: "left" | "right", clientX: number) => {
    const container = paneContainerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const pointerPercent = ((clientX - rect.left) / rect.width) * 100;
    const minLeft = 16;
    const minCenter = 24;
    const minRight = 18;

    setPaneWidths((current) => {
      if (divider === "left") {
        const left = Math.min(
          Math.max(pointerPercent, minLeft),
          100 - current.right - minCenter,
        );
        return {
          left,
          center: 100 - left - current.right,
          right: current.right,
        };
      }

      const right = Math.min(
        Math.max(100 - pointerPercent, minRight),
        100 - current.left - minCenter,
      );
      return {
        left: current.left,
        center: 100 - current.left - right,
        right,
      };
    });
  }, []);

  const handlePaneDragStart = useCallback(
    (divider: "left" | "right", event: ReactPointerEvent<HTMLButtonElement>) => {
      activePaneDividerRef.current = divider;
      event.currentTarget.setPointerCapture(event.pointerId);
      updatePaneWidths(divider, event.clientX);
    },
    [updatePaneWidths],
  );

  const handlePaneDragMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const divider = activePaneDividerRef.current;
      if (!divider) {
        return;
      }
      updatePaneWidths(divider, event.clientX);
    },
    [updatePaneWidths],
  );

  const handlePaneDragEnd = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    activePaneDividerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const withAuthorizedToken = useCallback(
    async <T,>(work: (effectiveToken: string) => Promise<T>): Promise<T> => {
      const cachedToken = token.trim() || readMemoryTokenFromStorage() || "";
      const initial =
        cachedToken ||
        (await getOrCreateMemoryTokenWithRetry({
          attempts: 3,
          delayMs: 250,
        })) ||
        "";

      if (!initial) {
        throw new Error("Missing API token. Sign in from developer console first.");
      }

      setToken(initial);

      try {
        return await work(initial);
      } catch (error) {
        if (!isUnauthorized(error)) {
          throw error;
        }

        const refreshed = await fetchMemoryTokenFromBridge();
        if (!refreshed) {
          throw error;
        }

        setToken(refreshed);
        return work(refreshed);
      }
    },
    [token],
  );

  const refreshBilling = useCallback(
    async (effectiveToken: string): Promise<void> => {
      const billingPayload = await fetchMemoryApi<BillingSnapshot>(
        "/api/memory/billing",
        effectiveToken,
        undefined,
        apiOrigin,
      );
      setBilling(requireBillingSnapshot(billingPayload));
    },
    [apiOrigin],
  );

  const refreshLiveData = useCallback(
    async (effectiveToken: string): Promise<void> => {
      const [memoryPayload, insightPayload, timelinePayload, requestPayload] = await Promise.all([
        fetchMemoryApi<MemoryListResponse>("/api/memory/list?limit=40", effectiveToken, undefined, apiOrigin),
        fetchMemoryApi<InsightsResponse>("/api/memory/insights", effectiveToken, undefined, apiOrigin),
        fetchMemoryApi<TimelineResponse>("/api/memory/timeline?limit=40", effectiveToken, undefined, apiOrigin),
        fetchMemoryApi<RequestHistoryResponse>("/api/memory/requests?limit=30&range=all", effectiveToken, undefined, apiOrigin),
      ]);

      setMemories(requireArray<MemoryRecord>(memoryPayload.memories, "memories"));
      setInsights(insightPayload);
      setTimeline(requireArray<TimelineEvent>(timelinePayload.events, "timeline.events"));
      setRequests(requireArray<RequestEvent>(requestPayload.requests, "requests"));
    },
    [apiOrigin],
  );

  const refreshAllLiveData = useCallback(
    async (effectiveToken: string): Promise<void> => {
      await Promise.all([refreshLiveData(effectiveToken), refreshBilling(effectiveToken)]);
    },
    [refreshBilling, refreshLiveData],
  );

  useEffect(() => {
    const saved = readPlaygroundSettings();
    if (saved?.apiOrigin) setApiOrigin(normalizeApiOriginForRuntime(saved.apiOrigin));
    if (saved?.workspace) setWorkspace(saved.workspace);
    if (saved?.project) setProject(saved.project);
    if (saved?.threadId) setThreadId(saved.threadId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setStatusLine("Syncing live memory data...");
        await withAuthorizedToken(async (effectiveToken) => {
          if (cancelled) return;
          await refreshAllLiveData(effectiveToken);
        });
        if (!cancelled) {
          setStatusLine("Live · connected");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load live data");
          setStatusLine("Auth required");
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [refreshAllLiveData, withAuthorizedToken]);

  useEffect(() => {
    const memoryInterval = window.setInterval(() => {
      void withAuthorizedToken(async (effectiveToken) => {
        await refreshLiveData(effectiveToken);
        setStatusLine((current) =>
          current.startsWith("Running ") ? current : "Live · syncing",
        );
      }).catch(() => {
        // background refresh stays quiet
      });
    }, 20_000);

    const billingInterval = window.setInterval(() => {
      void withAuthorizedToken(async (effectiveToken) => {
        await refreshBilling(effectiveToken);
      }).catch(() => {
        // background refresh stays quiet
      });
    }, 15_000);

    return () => {
      window.clearInterval(memoryInterval);
      window.clearInterval(billingInterval);
    };
  }, [refreshBilling, refreshLiveData, withAuthorizedToken]);

  useEffect(() => {
    let stream: EventSource | null = null;
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        openStream();
      }, 5000);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as { kind?: string; status?: string };
        if (payload.status === "offline") return;
        if (
          payload.kind === "request_logged" ||
          payload.kind === "memory_processed" ||
          payload.kind === "handoff_generated" ||
          payload.kind === "resume_generated" ||
          payload.kind === "governance_review_queued"
        ) {
          void withAuthorizedToken(async (effectiveToken) => {
            await refreshLiveData(effectiveToken);
            setStatusLine((current) =>
              current.startsWith("Running ") ? current : "Live · synced",
            );
          }).catch(() => {
            // background refresh stays quiet
          });
        }
      } catch {
        // ignore malformed stream payloads
      }
    };

    function openStream() {
      if (disposed) return;
      stream?.close();
      stream = new EventSource("/api/memory/events");
      stream.onmessage = handleMessage;
      stream.onerror = () => {
        stream?.close();
        stream = null;
        scheduleReconnect();
      };
    }

    openStream();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stream?.close();
    };
  }, [refreshLiveData, withAuthorizedToken]);

  const applyPlaygroundSettings = useCallback(async () => {
    writePlaygroundSettings({
      apiOrigin: normalizeApiOriginForRuntime(apiOrigin) || "same-origin",
      workspace: workspace.trim() || "memoryostm",
      project: project.trim() || "memoryos-playground",
      threadId: threadId.trim() || "playground-thread-1",
    });

    const trimmedToken = token.trim();
    if (trimmedToken) {
      writeMemoryTokenToStorage(trimmedToken);
    }

    setSettingsOpen(false);
    setStatusLine("Applying settings…");
    setErrorMessage(null);

    try {
      await withAuthorizedToken(async (effectiveToken) => {
        await refreshAllLiveData(effectiveToken);
      });
      setStatusLine("Live · settings applied");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not apply settings");
      setStatusLine("Settings saved · sync failed");
    }
  }, [apiOrigin, workspace, project, threadId, token, withAuthorizedToken, refreshAllLiveData]);

  const profileCards = useMemo(() => {
    return memories.slice(0, 4).map((memory) => ({
      id: memory.id,
      text: formatMemoryForDisplay(memory.summary || memory.content) || "Memory updated",
    }));
  }, [memories]);

  const recentSessions = useMemo(() => {
    return requests.slice(0, 4).map((request) => ({
      id: request.id,
      title: `${request.routeType} | ${request.status}`,
      detail: `${request.method} ${request.path} | ${request.durationMs}ms`,
      at: request.createdAt,
    }));
  }, [requests]);

  const graphNodes = useMemo<GraphNode[]>(() => {
    const source = memories.slice(0, 9);
    const chatSource = messages.filter((message) => message.role !== "system").slice(-5);
    if (source.length === 0 && chatSource.length > 0) {
      const positions = [
        [285, 170, 4],
        [120, 310, 2],
        [455, 315, 2],
        [230, 455, 3],
        [410, 520, 1],
      ];

      return chatSource.map((message, index) => {
        const [x, y, z] = positions[index] ?? [160 + index * 75, 300 + index * 45, 1];
        return {
          id: message.id,
          x,
          y,
          z,
          label: compactGraphLabel(message.text, message.role === "user" ? "User message" : "MemoryOS reply"),
          subtitle: `${message.role} | chat signal`,
          type: message.role,
          color: message.role === "user" ? "var(--color-primary)" : "var(--color-chart-2)",
          source: "chat",
          reason: `This node came from the live chat message: "${compactGraphLabel(message.text, "chat message")}". It is connected so the agent can trace which conversation turn created or retrieved context.`,
        };
      });
    }

    if (source.length === 0) {
      return [
        {
          id: "project-core",
          x: 285,
          y: 180,
          z: 3,
          label: compactGraphLabel(project, "Project"),
          subtitle: "active project",
          type: "project",
          color: "var(--color-chart-2)",
          source: "project",
          reason: "This is the active project/container tag. New chat messages and memories attach here first.",
        },
        {
          id: "agent-runtime",
          x: 130,
          y: 310,
          z: 2,
          label: "Agent runtime",
          subtitle: "SDK / MCP / HTTP",
          type: "agent",
          color: "var(--color-primary)",
          source: "agent",
          reason: "This node represents the agent runtime surface. SDK, MCP, and HTTP calls all create or retrieve memory through this path.",
        },
        {
          id: "continuity",
          x: 430,
          y: 335,
          z: 1,
          label: "Continuity state",
          subtitle: "waiting for memory",
          type: "memory",
          color: "var(--color-chart-4)",
          source: "memory",
          reason: "This placeholder becomes real memory after a Process call stores context from chat.",
        },
      ];
    }

    const positions = [
      [285, 170, 4],
      [120, 300, 2],
      [455, 305, 2],
      [230, 430, 3],
      [380, 465, 1],
      [95, 500, 1],
      [510, 535, 2],
      [285, 595, 3],
      [160, 635, 1],
    ];
    const colors = [
      "var(--color-chart-2)",
      "var(--color-primary)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
      "var(--destructive)",
      "var(--color-chart-1)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
    ];

    return source.map((memory, index) => {
      const [x, y, z] = positions[index] ?? [120 + (index % 4) * 110, 170 + Math.floor(index / 4) * 130, 1];
      return {
        id: memory.id,
        x,
        y,
        z,
        label: compactGraphLabel(memory.summary || memory.content, memory.type || "Memory"),
        subtitle: `${memory.type || "memory"} | ${memory.status || "active"} | ${confidenceToPercent(memory.confidence)}%`,
        type: memory.type || "memory",
        color: colors[index % colors.length],
        source: "memory",
        reason: `This memory was extracted from the conversation or API flow because MemoryOS found a durable ${memory.type || "memory"} signal: "${compactGraphLabel(memory.summary || memory.content, "memory")}". Status is ${memory.status || "active"} with ${confidenceToPercent(memory.confidence)}% confidence.`,
      };
    });
  }, [memories, messages, project]);

  const graphEdges = useMemo<GraphEdge[]>(() => {
    if (graphNodes.length <= 1) {
      return [];
    }

    const root = graphNodes[0];
    const edges: GraphEdge[] = graphNodes.slice(1).map((node, index) => ({
      from: index % 3 === 2 ? graphNodes[Math.max(1, index - 1)].id : root.id,
      to: node.id,
      relation: index % 3 === 0 ? "extends" : index % 3 === 1 ? "updates" : "derives",
      reason:
        index % 3 === 0
          ? `${node.label} extends the active context from ${root.label}.`
          : index % 3 === 1
            ? `${node.label} updates or refines an earlier memory signal.`
            : `${node.label} was derived from the nearby chat/memory signal.`,
    }));

    if (graphNodes.length > 4) {
      edges.push({
        from: graphNodes[1].id,
        to: graphNodes[3].id,
        relation: "related",
        reason: `${graphNodes[1].label} and ${graphNodes[3].label} share nearby project or preference context.`,
      });
      edges.push({
        from: graphNodes[2].id,
        to: graphNodes[4].id,
        relation: "supports",
        reason: `${graphNodes[2].label} supports the continuity path for ${graphNodes[4].label}.`,
      });
    }

    return edges;
  }, [graphNodes]);

  const selectedGraphNode = useMemo(() => {
    return graphNodes.find((node) => node.id === selectedGraphNodeId) ?? graphNodes[0] ?? null;
  }, [graphNodes, selectedGraphNodeId]);

  const selectedGraphConnections = useMemo(() => {
    if (!selectedGraphNode) {
      return [];
    }

    return graphEdges
      .filter((edge) => edge.from === selectedGraphNode.id || edge.to === selectedGraphNode.id)
      .map((edge) => {
        const otherNodeId = edge.from === selectedGraphNode.id ? edge.to : edge.from;
        const other = graphNodes.find((node) => node.id === otherNodeId);
        return {
          ...edge,
          direction: edge.from === selectedGraphNode.id ? "outgoing" : "incoming",
          otherLabel: other?.label ?? "unknown node",
        };
      });
  }, [graphEdges, graphNodes, selectedGraphNode]);

  const resetGraphView = useCallback(() => {
    setGraphScale(1);
    setGraphPan({ x: 0, y: 0 });
  }, []);

  const handleGraphPointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    graphDragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: graphPan.x,
      panY: graphPan.y,
    };
    setIsGraphDragging(true);
  }, [graphPan.x, graphPan.y]);

  const handleGraphPointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (!isGraphDragging) {
      return;
    }

    const start = graphDragStartRef.current;
    setGraphPan({
      x: start.panX + event.clientX - start.pointerX,
      y: start.panY + event.clientY - start.pointerY,
    });
  }, [isGraphDragging]);

  const handleGraphPointerEnd = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsGraphDragging(false);
  }, []);

  async function runModeCall() {
    const text = input.trim();
    if (!text) {
      setErrorMessage("Enter a message or question first.");
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setShowWelcomePanel(false);
    setStatusLine(`Running ${selectedConfig.label}...`);

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);

    try {
      const payload = await withAuthorizedToken(async (effectiveToken) => {
        let body: Record<string, unknown>;

        if (mode === "process") {
          body = {
            threadId,
            message: text,
          };
        } else if (mode === "retrieve") {
          body = {
            question: text,
            topK,
            threadId,
            project,
            workspace,
          };
        } else if (mode === "resume" || mode === "handoff") {
          body = {
            question: text,
            project,
            topK,
            threadId,
            workspace,
          };
        } else {
          body = {
            question: text,
            project,
            topK,
            threadId,
            workspace,
            target: "cursor",
          };
        }

        const response = await fetchMemoryApi<unknown>(
          selectedConfig.endpoint,
          effectiveToken,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          apiOrigin,
        );

        await Promise.all([refreshLiveData(effectiveToken), refreshBilling(effectiveToken)]);
        return response;
      });

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: responseSnippet(payload, mode),
        createdAt: new Date().toISOString(),
      };

      if (mode === "resume") {
        const responseData = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
        if (isRecord(responseData)) {
          const brief: ContinueProjectBrief = {
            whatChangedRecently: Array.isArray(responseData.whatChangedRecently) ? responseData.whatChangedRecently.filter((x): x is string => typeof x === "string") : [],
            currentGoal: typeof responseData.currentGoal === "string" ? responseData.currentGoal : "",
            keyDecisions: Array.isArray(responseData.keyDecisions) ? responseData.keyDecisions.filter((x): x is string => typeof x === "string") : [],
            openBlockers: Array.isArray(responseData.openBlockers) ? responseData.openBlockers.filter((x): x is string => typeof x === "string") : [],
            riskyFiles: Array.isArray(responseData.riskyFiles) ? responseData.riskyFiles.filter((x): x is string => typeof x === "string") : [],
            nextBestAction: typeof responseData.nextBestAction === "string" ? responseData.nextBestAction : "",
            mustKnowContextForAgent: Array.isArray(responseData.mustKnowContextForAgent) ? responseData.mustKnowContextForAgent.filter((x): x is string => typeof x === "string") : [],
          };
          setLatestBrief(brief);
        }
      }

      if (mode === "prompt") {
        const responseData = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
        if (
          isRecord(responseData) &&
          isRecord(responseData.prompts) &&
          typeof responseData.prompts.cursor === "string" &&
          typeof responseData.prompts.codex === "string" &&
          typeof responseData.prompts.claudeCode === "string"
        ) {
          const nextPrompt: ResumePromptPayload = {
            target:
              responseData.target === "codex" || responseData.target === "claude_code" || responseData.target === "cursor"
                ? responseData.target
                : "cursor",
            brief: isRecord(responseData.brief)
              ? {
                  whatChangedRecently: Array.isArray(responseData.brief.whatChangedRecently) ? responseData.brief.whatChangedRecently.filter((x): x is string => typeof x === "string") : [],
                  currentGoal: typeof responseData.brief.currentGoal === "string" ? responseData.brief.currentGoal : "",
                  keyDecisions: Array.isArray(responseData.brief.keyDecisions) ? responseData.brief.keyDecisions.filter((x): x is string => typeof x === "string") : [],
                  openBlockers: Array.isArray(responseData.brief.openBlockers) ? responseData.brief.openBlockers.filter((x): x is string => typeof x === "string") : [],
                  riskyFiles: Array.isArray(responseData.brief.riskyFiles) ? responseData.brief.riskyFiles.filter((x): x is string => typeof x === "string") : [],
                  nextBestAction: typeof responseData.brief.nextBestAction === "string" ? responseData.brief.nextBestAction : "",
                  mustKnowContextForAgent: Array.isArray(responseData.brief.mustKnowContextForAgent) ? responseData.brief.mustKnowContextForAgent.filter((x): x is string => typeof x === "string") : [],
                }
              : {
                  whatChangedRecently: [],
                  currentGoal: "",
                  keyDecisions: [],
                  openBlockers: [],
                  riskyFiles: [],
                  nextBestAction: "",
                  mustKnowContextForAgent: [],
                },
            prompts: {
              cursor: responseData.prompts.cursor,
              codex: responseData.prompts.codex,
              claudeCode: responseData.prompts.claudeCode,
            },
            traceProof: isRecord(responseData.traceProof)
              ? {
                  runType: responseData.traceProof.runType === "resume_prompt" ? "resume_prompt" : "resume_prompt",
                  memoryUsedCount: typeof responseData.traceProof.memoryUsedCount === "number" ? responseData.traceProof.memoryUsedCount : 0,
                  averageConfidence: typeof responseData.traceProof.averageConfidence === "number" ? responseData.traceProof.averageConfidence : 0,
                  contractCategories: Array.isArray(responseData.traceProof.contractCategories)
                    ? responseData.traceProof.contractCategories.filter((x): x is string => typeof x === "string")
                    : [],
                  whatChangedAfterAction:
                    typeof responseData.traceProof.whatChangedAfterAction === "string"
                      ? responseData.traceProof.whatChangedAfterAction
                      : "Prompt generated from current brief.",
                  summary: typeof responseData.traceProof.summary === "string" ? responseData.traceProof.summary : "",
                }
              : undefined,
            trace: Array.isArray(responseData.trace)
              ? responseData.trace
                  .filter((item): item is Record<string, unknown> => isRecord(item))
                  .map((item) => ({
                    memoryId: typeof item.memoryId === "string" ? item.memoryId : "unknown",
                    source: typeof item.source === "string" ? item.source : "general",
                    ...(typeof item.contractCategory === "string" ? { contractCategory: item.contractCategory } : {}),
                    confidence: typeof item.confidence === "number" ? item.confidence : 0,
                    whySelected: typeof item.whySelected === "string" ? item.whySelected : "",
                  }))
              : [],
          };
          setLatestPrompt(nextPrompt);
          setLatestBrief(nextPrompt.brief);
        }
      }

      setMessages((current) => [...current, assistantMessage]);
      setStatusLine(`${selectedConfig.label} completed`);
      setInput("");
    } catch (error) {
      if (error instanceof ApiRequestError && isRecord(error.payload) && isRecord(error.payload.error) && error.payload.error.code === "UPGRADE_REQUIRED") {
        const details = isRecord(error.payload.error.details) ? error.payload.error.details : null;
        if (details) {
          const meter = details.meter === "searches" ? "searches" : "tokens";
          const used = typeof details.used === "number" ? details.used : 0;
          const limit = typeof details.limit === "number" ? details.limit : 0;
          const plan = details.plan === "Pro" || details.plan === "Scale" || details.plan === "Enterprise" ? details.plan : "Free";
          setBilling((current) => ({
            currentPlan: plan,
            usage: {
              tokenLimit: meter === "tokens" ? limit : current?.usage.tokenLimit ?? 1_000_000,
              tokenUsed: meter === "tokens" ? used : current?.usage.tokenUsed ?? 0,
              searchLimit: meter === "searches" ? limit : current?.usage.searchLimit ?? 10_000,
              searchUsed: meter === "searches" ? used : current?.usage.searchUsed ?? 0,
              resetInDays: current?.usage.resetInDays ?? 30,
            },
          }));
        }
      }
      const message = error instanceof Error ? error.message : "Request failed";
      setErrorMessage(message);
      setStatusLine("Request failed");
      setMessages((current) => [
        ...current,
        {
          id: `err-${Date.now()}`,
          role: "system",
          text: `Error: ${message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setThreadId(`playground-thread-${Date.now().toString().slice(-6)}`);
    setInput("");
    setErrorMessage(null);
    setLatestBrief(null);
    setLatestPrompt(null);
    setShowWelcomePanel(false);
    setStatusLine("New chat session created");
  }

  const stats = {
    memories: memories.length,
    documents: timeline.length,
    connections: Math.max(0, graphEdges.length),
  };

  if (!selectedContainerTag) {
    const configureCode = `import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
});

const context = await memoryos.beforeModel({
  containerTag: "${workspace || "memoryos-playground"}",
  query: userMessage,
  mode: "hybrid",
  limit: ${topK},
  threshold: 0.4,
  include: {
    relatedMemories: true,
    documents: true,
    summaries: true,
  },
});

const answer = await model.generate({
  messages: [...context.messages, userMessage],
});`;

    return (
      <main className="min-h-screen bg-background text-foreground">
        <header className="grid h-16 grid-cols-3 border-b border-border">
          <div className="flex items-center border-r border-border px-5">
            <span className="inline-flex origin-left scale-75">
              <MemoryStarLogo tone="white" />
            </span>
          </div>
          <div className="flex items-center justify-between px-10">
            <div className="flex items-center gap-3">
              <span className="text-sm">⌂</span>
              <span className="text-sm font-semibold uppercase tracking-wide">{workspace || "memoryostm"}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-widest text-muted-foreground">Free</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-semibold uppercase tracking-wider">
              <a className="text-foreground transition hover:text-primary" href="/developer-console">Console</a>
              <a className="text-foreground transition hover:text-primary" href="/developer-console">Support</a>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/75 transition hover:text-foreground"
                aria-label="Settings"
              >
                V
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-l border-border px-4">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground6 transition hover:text-foreground"
              aria-label="Playground settings"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .28 1.7 1.7 0 0 0-.82 1.46V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-.82-1.46 1.7 1.7 0 0 0-1-.28 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.28-1 1.7 1.7 0 0 0-1.46-.82H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.46-.82 1.7 1.7 0 0 0 .28-1 1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.28 1.7 1.7 0 0 0 .82-1.46V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 .82 1.46 1.7 1.7 0 0 0 1 .28 1.7 1.7 0 0 0 1.87-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.36 9c0 .35.1.69.28 1 .3.5.84.82 1.46.82H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.46.82c-.18.31-.28.65-.28 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground"
              aria-label="Dark theme enabled"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M20 14.5A7.8 7.8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </header>

        <div className="grid min-h-screen grid-cols-3">
          <aside className="border-r border-border bg-background px-2.5 py-4">
            <div className="relative">
              <input
                placeholder="Search..."
                className="h-11 w-full rounded-md border border-border bg-muted/50 px-12 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</span>
              <span className="absolute right-5 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">⌘K</span>
            </div>

            <nav className="mt-5 space-y-1 text-sm">
              {[
                ["Overview", "⌂"],
                ["Playground", "○"],
                ["Documents", "□"],
                ["Container Tags", "◇"],
                ["Memory Graph", "⌬"],
                ["Requests", "〽"],
              ].map(([label, icon]) => (
                <button
                  key={label}
                  type="button"
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-4 text-left transition ${
                    label === "Playground" ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <span className="w-4 text-muted-foreground">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-9 space-y-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Analytics</p>
              <button type="button" className="flex h-9 w-full items-center justify-between rounded-md px-4 text-left text-sm text-muted-foreground">
                <span>User Insights</span>
                <span className="text-muted-foreground">▢</span>
              </button>
            </div>

            <div className="mt-7 space-y-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Data</p>
              {["Connectors", "Import"].map((item) => (
                <button key={item} type="button" className="flex h-9 w-full items-center rounded-md px-4 text-left text-sm text-muted-foreground hover:bg-muted/60">
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-7 space-y-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Developer</p>
              {["API Keys", "Agents", "Plugins"].map((item) => (
                <button key={item} type="button" className="flex h-9 w-full items-center rounded-md px-4 text-left text-sm text-muted-foreground hover:bg-muted/60">
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-7 space-y-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Organization</p>
              {["Team", "Billing", "Settings"].map((item) => (
                <button key={item} type="button" className="flex h-9 w-full items-center rounded-md px-4 text-left text-sm text-muted-foreground hover:bg-muted/60">
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-screen flex-col bg-background">
            <div className="flex flex-1 items-center justify-center px-8 pb-20">
              <div className="w-full max-w-3xl text-center">
                <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center">
                  <svg className="h-14 w-14 text-foreground" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <path d="M24 4v16M24 28v16M4 24h16M28 24h16M11.5 11.5 20 20M28 28l8.5 8.5M36.5 11.5 28 20M20 28l-8.5 8.5" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
                  </svg>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Select a container tag to start</h1>
                <p className="mt-3 text-sm text-muted-foreground">Scope memory to a user, project, team, or agent runtime.</p>
                <div className="mx-auto mt-8 flex h-20 max-w-3xl items-center gap-3 rounded-md border border-border bg-background px-5">
                  <input
                    value={workspace}
                    onChange={(event) => setWorkspace(event.target.value)}
                    placeholder="Select a container tag first"
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContainerTag(workspace.trim() || "memoryos-playground");
                      setStatusLine("Container tag selected");
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-xl text-foreground transition hover:bg-primary/90"
                    aria-label="Select container tag"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-screen flex-col border-l border-border bg-background">
            <div className="grid h-11 grid-cols-2 border-b border-border text-sm">
              <button
                type="button"
                onClick={() => setSetupTab("configure")}
                className={`border-b-2 font-semibold ${setupTab === "configure" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                Configure
              </button>
              <button
                type="button"
                onClick={() => setSetupTab("import")}
                className={`border-b-2 font-semibold ${setupTab === "import" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                Import
              </button>
            </div>

            {setupTab === "configure" ? (
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="grid gap-3">
                  <label className="grid grid-cols-4 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">Tag</span>
                    <button type="button" onClick={() => setWorkspace("memoryos-playground")} className="flex h-10 items-center justify-between rounded-md border border-input px-3 text-sm text-foreground">
                      <span>{workspace || "Select tag"}</span><span>⌄</span>
                    </button>
                  </label>
                  <label className="grid grid-cols-4 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">Model</span>
                    <button type="button" className="flex h-10 items-center justify-between rounded-md border border-input px-3 text-sm text-foreground">
                      <span>Claude Sonnet 4.6</span><span>⌄</span>
                    </button>
                  </label>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" className="min-h-32 rounded-md border border-primary bg-primary/10 px-4 py-6 text-center">
                    <span className="block text-xl text-primary">⌕</span>
                    <span className="mt-2 block text-sm font-semibold text-foreground">Agent</span>
                    <span className="mt-1 block text-xs text-muted-foreground">LLM decides when to search</span>
                  </button>
                  <button type="button" className="min-h-32 rounded-md border border-input px-4 py-6 text-center">
                    <span className="block text-xl text-muted-foreground">ϟ</span>
                    <span className="mt-2 block text-sm font-semibold text-muted-foreground">Auto-Search</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Search every message</span>
                  </button>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="grid grid-cols-4 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">Mode</span>
                    <button type="button" className="h-10 rounded-md border border-input px-3 text-left text-sm text-foreground">hybrid</button>
                    <span className="text-sm font-semibold text-foreground">Limit</span>
                    <input value={topK} onChange={(event) => setTopK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none" />
                    <span className="text-sm font-semibold text-foreground">Threshold</span>
                    <input defaultValue="0.4" className="h-10 rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-foreground">
                    {["Rerank", "Rewrite", "Aggregate"].map((item) => (
                      <label key={item} className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4" />{item}</label>
                    ))}
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Include</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-foreground">
                    {["Related", "Docs", "Chunks", "Summaries", "Forgotten"].map((item, index) => (
                      <label key={item} className="inline-flex items-center gap-2">
                        <input defaultChecked={index < 2} type="checkbox" className="h-4 w-4" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-sm font-semibold text-foreground">Code</p>
                  <pre className="mt-3 max-h-80 overflow-auto rounded-md border border-border bg-background p-3 text-xs leading-5 text-foreground">
                    {configureCode}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 px-4 py-4">
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder="Paste text - notes, articles, chat logs..."
                  className="h-32 w-full resize-none rounded-md border border-border bg-background p-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button type="button" className="mt-4 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  + Import
                </button>
                <p className="mt-20 text-center text-base text-muted-foreground">No documents processing</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleNewChat}
              className="h-16 border-t border-border text-sm font-semibold uppercase tracking-wider text-foreground"
            >
              Reset Chat
            </button>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className={`dark flex min-h-svh flex-col overflow-hidden ${lightMode ? "bg-background text-foreground" : "bg-background text-foreground"}`}>
      <header className={`flex h-14 shrink-0 items-center justify-between border-b px-3 sm:h-16 sm:px-5 ${lightMode ? "border-border bg-card text-card-foreground" : "border-border bg-background"}`}>
        <div className="flex items-center gap-4">
          <span className="inline-flex origin-left scale-75 sm:scale-90">
            <MemoryStarLogo tone={lightMode ? "black" : "white"} />
          </span>
          <span className={`hidden h-5 w-px sm:block ${lightMode ? "bg-background/12" : "bg-muted"}`} />
        </div>
        <div className="flex items-center gap-2">
          <button       
            type="button" 
            onClick={() => setSettingsOpen(true)}
            className={`flex h-9 w-9 items-center justify-center rounded-md bg-transparent transition ${lightMode ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Playground settings"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .28 1.7 1.7 0 0 0-.82 1.46V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-.82-1.46 1.7 1.7 0 0 0-1-.28 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.28-1 1.7 1.7 0 0 0-1.46-.82H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.46-.82 1.7 1.7 0 0 0 .28-1 1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.28 1.7 1.7 0 0 0 .82-1.46V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 .82 1.46 1.7 1.7 0 0 0 1 .28 1.7 1.7 0 0 0 1.87-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.36 9c0 .35.1.69.28 1 .3.5.84.82 1.46.82H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.46.82c-.18.31-.28.65-.28 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground"
            aria-label="Dark theme enabled"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M20 14.5A7.8 7.8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </header>

      <div
        ref={paneContainerRef}
        style={paneStyle}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden"
      >
        <aside className={`order-2 min-h-0 w-full overflow-visible border-b lg:order-1 lg:max-h-[calc(100svh-4rem)] lg:w-[var(--playground-left-pane)] lg:overflow-y-auto lg:border-b-0 ${lightMode ? "border-border bg-card text-card-foreground" : "border-border bg-background"}`}>
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="border-l-4 border-primary pl-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profile</p>
              <button
                type="button"
                title="Latest memories pulled from your live workspace."
                className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
              >
                Help
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {profileCards.length > 0 ? (
                profileCards.map((card) => (
                  <div
                    key={card.id}
                    className={`rounded-md border px-3 py-3 text-sm leading-6 ${
                      lightMode ? "border-border bg-popover text-popover-foreground" : "border-border bg-background text-foreground"
                    } w-full text-left`}
                  >
                    <div className="line-clamp-6">
                      {card.text}
                    </div>
                  </div>
                ))
              ) : (
                <div className={`flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed px-3 py-3 text-center ${
                  lightMode ? "border-border bg-popover text-popover-foreground" : "border-border bg-background"
                }`}>
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-2xl ${
                    lightMode ? "border-border bg-muted/30 text-muted-foreground" : "border-border bg-muted/30 text-muted-foreground"
                  }`}>
                    o
                  </div>
                  <p className={`text-sm ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>No profile memories yet</p>
                  <p className={`mt-1 text-xs ${lightMode ? "text-muted-foreground" : "text-foreground/35"}`}>No data yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className={`border-t px-4 py-4 ${lightMode ? "border-border" : "border-border"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="border-l-4 border-primary pl-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sessions</p>
              <button
                type="button"
                title="Recent playground API calls and request health."
                className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
              >
                Help
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-md border px-3 py-3 ${
                      lightMode ? "border-border bg-popover text-popover-foreground" : "border-border bg-background"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${lightMode ? "text-foreground" : "text-foreground/90"}`}>{session.title}</p>
                    <p className={`mt-1 text-xs ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>{session.detail}</p>
                    <p className={`mt-1 text-xs ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>{formatTs(session.at)}</p>
                  </div>
                ))
              ) : (
                <div className={`flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed px-3 py-3 text-center ${
                  lightMode ? "border-border bg-popover text-popover-foreground" : "border-border bg-background"
                }`}>
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-xl ${
                    lightMode ? "border-border bg-muted/30 text-muted-foreground" : "border-border bg-muted/30 text-muted-foreground"
                  }`}>
                    []
                  </div>
                  <p className={`text-sm ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>No sessions yet</p>
                  <p className={`mt-1 text-xs ${lightMode ? "text-muted-foreground" : "text-foreground/35"}`}>Requests appear after the first run.</p>
                </div>
              )}
            </div>
          </div>

          <div className={`border-t px-4 py-4 ${lightMode ? "border-border" : "border-border"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="border-l-4 border-primary pl-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Get Started</p>
              <button
                type="button"
                title="Open the console when you want the full operational view."
                className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
              >
                Help
              </button>
            </div>
            <div className={`mt-3 rounded-md border p-3 ${
              lightMode ? "border-border bg-card" : "border-border bg-background"
            }`}>
              <p className={`text-sm ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>Production-ready memory infrastructure</p>
              <a
                href="/developer-console"
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-foreground transition hover:bg-primary/90"
              >
                Back to Console
              </a>
            </div>
          </div>
        </aside>

        <button
          type="button"
          aria-label="Resize profile and chat panes"
          title="Drag to resize profile and chat panes"
          onPointerDown={(event) => handlePaneDragStart("left", event)}
          onPointerMove={handlePaneDragMove}
          onPointerUp={handlePaneDragEnd}
          onPointerCancel={handlePaneDragEnd}
          className="group order-1 hidden w-2 shrink-0 cursor-col-resize touch-none items-center justify-center border-x border-border bg-background transition hover:bg-muted/40 lg:order-2 lg:flex"
        >
          <span className="h-10 w-px bg-border transition group-hover:bg-primary" />
        </button>

        <section className={`order-1 flex min-h-[78svh] w-full flex-col border-b lg:order-3 lg:min-h-0 lg:max-h-[calc(100svh-4rem)] lg:w-[var(--playground-center-pane)] lg:border-l-0 xl:border-b-0 ${lightMode ? "border-border bg-card text-card-foreground" : "border-border bg-background"}`}>
          <div className={`flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-5 ${lightMode ? "border-border" : "border-border"}`}>
            <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
              {[
                { key: "chat", label: "Chat.md", icon: "MD" },
                { key: "code", label: "code.ts", icon: "TS" },
                { key: "python", label: "main.py", icon: "PY" },
              ].map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setTab(entry.key as CenterTab)}
                  className={`flex h-10 min-w-24 shrink-0 items-center gap-2 border-r px-3 text-sm font-semibold transition sm:min-w-28 sm:px-4 ${lightMode ? "border-border" : "border-border"} ${
                    tab === entry.key
                      ? lightMode
                        ? "bg-muted/30 text-foreground"
                        : "bg-muted/30 text-foreground"
                      : lightMode
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`text-xs font-bold ${tab === entry.key ? "text-primary" : lightMode ? "text-muted-foreground" : "text-foreground/35"}`}>
                    {entry.icon}
                  </span>
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-primary/90 sm:px-4"
              >
                + New Chat
              </button>
              <button
                type="button"
                onClick={() => setTab(tab === "chat" ? "code" : "chat")}
                className={`h-9 w-9 rounded-md text-sm font-semibold transition ${
                  lightMode ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Toggle code"
              >
                &lt;/&gt;
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-8">
            {tab === "chat" ? (
              <>
                {showWelcomePanel ? (
                  <div className="mx-auto mb-10 max-w-5xl pt-4 text-center sm:mb-12 sm:pt-8 xl:pt-10">
                    <div className="mx-auto flex items-center justify-center">
                      <span className="inline-flex scale-110">
                        <MemoryStarLogo tone={lightMode ? "black" : "white"} />
                      </span>
                    </div>
                    <p className={`mx-auto mt-6 max-w-3xl text-base leading-7 ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>
                      Live workspace continuity is connected to your backend.
                      <br />
                      Memory contracts, retrieval, and runtime requests are shown from real API data.
                    </p>

                    <div className={`mx-auto mt-8 max-w-3xl rounded-lg border p-4 text-left sm:mt-10 sm:p-7 ${
                      lightMode ? "border-border bg-popover text-popover-foreground" : "border-border bg-card text-foreground"
                    }`}>
                      <div className="mb-6 flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full bg-destructive" />
                        <span className="h-3.5 w-3.5 rounded-full bg-chart-5" />
                        <span className="h-3.5 w-3.5 rounded-full bg-chart-2" />
                        <span className={`ml-5 text-xs ${lightMode ? "text-muted-foreground" : "text-foreground/35"}`}>memoryos.ts (live workspace)</span>
                      </div>
                      <pre className={`overflow-x-auto text-sm leading-6 ${lightMode ? "text-foreground" : "text-foreground"}`}>
{`const model = withMemoryOS(baseModel, {
  workspace: "${workspace}",
  project: "${project}",
  conversationId: "${threadId}",
  mode: "${mode}",
  topK: ${topK},
})`}
                      </pre>
                    </div>

                    <div className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <p className={`text-2xl font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>
                          {memories.length}
                        </p>
                        <p className={`text-xs uppercase tracking-widest ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>Live memories</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>
                          {liveRequestStats.p95LatencyMs !== null ? `${liveRequestStats.p95LatencyMs}ms` : "--"}
                        </p>
                        <p className={`text-xs uppercase tracking-widest ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>P95 request latency</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>
                          {liveRequestStats.successRate !== null ? `${liveRequestStats.successRate}%` : "--"}
                        </p>
                        <p className={`text-xs uppercase tracking-widest ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>Request success rate</p>
                      </div>
                    </div>

                    <div className="mx-auto mt-12 max-w-4xl">
                      <p className={`text-sm font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>Try these prompts -</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                        {[
                          ["Introduce yourself", "My name is Alex. I am building MemoryOS."],
                          ["Store preferences", "Remember that I prefer dark mode and TypeScript examples."],
                          ["Update knowledge", "The backend is live and the product supports SDK, MCP, and HTTP."],
                          ["Test recall", "What should my next agent remember before continuing?"],
                        ].map(([label, prompt]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              setInput(prompt);
                              setMode(label === "Test recall" ? "retrieve" : "process");
                            }}
                            className={`min-h-24 rounded-md border px-3 py-3 text-center transition hover:border-primary/60 ${
                              lightMode ? "border-border bg-card hover:bg-primary/10" : "border-border bg-muted/30 hover:bg-primary/15"
                            }`}
                          >
                            <span className={`text-sm font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mx-auto max-w-5xl space-y-9">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex gap-5"
                    >
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold uppercase ${
                        message.role === "user"
                          ? lightMode
                            ? "border-primary/35 bg-primary/10 text-primary"
                            : "border-primary/35 bg-primary/20 text-primary"
                          : message.role === "assistant"
                            ? lightMode
                              ? "border-chart-2/35 bg-chart-2/10 text-chart-2"
                              : "border-chart-2/35 bg-chart-2/15 text-chart-2"
                            : lightMode
                              ? "border-border bg-muted/30 text-muted-foreground"
                              : "border-border bg-muted/50 text-muted-foreground"
                      }`}>
                        {message.role === "user" ? "U" : message.role === "assistant" ? "M" : "S"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-lg leading-8 ${
                          message.role === "user"
                            ? lightMode
                              ? "font-semibold text-foreground"
                              : "font-semibold text-foreground"
                            : lightMode
                              ? "text-foreground"
                              : "text-foreground/92"
                        }`}>
                          {formatMemoryForDisplay(message.text) || message.text}
                        </p>
                        <p className={`mt-2 text-xs uppercase tracking-widest ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>
                          {message.role} | {formatTs(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : tab === "code" ? (
              <pre className={`rounded-lg border p-4 text-sm leading-6 ${
                lightMode ? "border-border bg-popover text-popover-foreground" : "border-border bg-card text-muted-foreground"
              }`}>
{`import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
  baseUrl: process.env.MEMORYOS_BASE_URL,
});

const context = await memoryos.beforeModel({
  threadId: "${threadId}",
  project: "${project}",
  question: "What should the agent remember before continuing?",
  topK: ${topK},
});

// Call GPT, Claude, Qwen, DeepSeek, Ollama, or your own agent here.

await memoryos.afterModel({
  threadId: "${threadId}",
  project: "${project}",
  message: "${input || "Saved the latest project update."}",
});

const next = await memoryos.handoff({
  project: "${project}",
  question: "what should I do next?",
});`}
              </pre>
            ) : (
              <pre className={`rounded-lg border p-4 text-sm leading-6 ${
                lightMode ? "border-border bg-popover text-popover-foreground" : "border-border bg-card text-muted-foreground"
              }`}>
{`import os
import httpx

base_url = os.getenv("MEMORYOS_BASE_URL", "http://localhost:3001")
headers = {"Authorization": f"Bearer {os.environ['MEMORYOS_API_KEY']}"}

httpx.post(
    f"{base_url}/api/memory/process",
    headers=headers,
    json={"threadId": "${threadId}", "message": "${input || "your update"}"},
)

resume = httpx.post(
    f"{base_url}/api/memory/resume",
    headers=headers,
    json={"project": "${project}", "question": "what next?", "topK": ${topK}},
).json()

handoff = httpx.post(
    f"{base_url}/api/memory/handoff",
    headers=headers,
    json={"project": "${project}", "question": "handoff to another agent"},
).json()`}
              </pre>
            )}

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/15 px-3.5 py-2.5 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            {latestBrief ? (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resume Project Brief</p>
                <p className="mt-2 text-sm"><span className="font-semibold">Goal:</span> {latestBrief.currentGoal || "n/a"}</p>
                <p className="mt-2 text-sm"><span className="font-semibold">Next:</span> {latestBrief.nextBestAction || "n/a"}</p>
                {latestBrief.riskyFiles.length > 0 ? (
                  <p className="mt-2 text-sm"><span className="font-semibold">Risky files:</span> {latestBrief.riskyFiles.join(", ")}</p>
                ) : null}
              </div>
            ) : null}

            {latestPrompt ? (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">IDE Prompt</p>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(latestPrompt.prompts[selectedPromptTab])}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
                  >
                    Copy {selectedPromptTab}
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  {(["cursor", "codex", "claudeCode"] as const).map((tabName) => (
                    <button
                      key={tabName}
                      type="button"
                      onClick={() => setSelectedPromptTab(tabName)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                        selectedPromptTab === tabName ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                      }`}
                    >
                      {tabName}
                    </button>
                  ))}
                </div>
                <pre className="mt-3 max-h-56 overflow-auto rounded-md border border-border bg-background p-3 text-xs leading-5">
                  {latestPrompt.prompts[selectedPromptTab]}
                </pre>
                {latestPrompt.traceProof ? (
                  <div className="mt-3 border border-border bg-background p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold uppercase tracking-widest text-foreground">Trace Proof</p>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {latestPrompt.traceProof.memoryUsedCount} memories / confidence {latestPrompt.traceProof.averageConfidence}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{latestPrompt.traceProof.summary}</p>
                    <p className="mt-2 text-foreground">{latestPrompt.traceProof.whatChangedAfterAction}</p>
                    {latestPrompt.traceProof.contractCategories.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {latestPrompt.traceProof.contractCategories.map((category) => (
                          <span key={category} className="border border-border px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                            {category}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {latestPrompt.trace.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trace Evidence</p>
                    <div className="mt-2 space-y-2">
                      {latestPrompt.trace.slice(0, 4).map((item) => (
                        <div key={item.memoryId} className="rounded-md border border-border bg-background px-3 py-2 text-xs">
                          <p>
                            <span className="font-semibold">Source:</span> {item.source}
                            {item.contractCategory ? (
                              <><span className="ml-2 font-semibold">Contract:</span> {item.contractCategory}</>
                            ) : null}
                            <span className="ml-2 font-semibold">Confidence:</span> {item.confidence}
                          </p>
                          <p className="mt-1 text-muted-foreground">{item.whySelected}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={`shrink-0 border-t px-4 py-3 sm:px-6 xl:px-8 xl:py-4 ${lightMode ? "border-border bg-card" : "border-border bg-background"}`}>
            <div className="mx-auto mb-3 grid max-w-5xl grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={project}
                onChange={(event) => setProject(event.target.value)}
                placeholder="project"
                className={`h-10 rounded-md border px-3 text-sm outline-none ${
                  lightMode ? "border-border bg-popover text-popover-foreground placeholder:text-muted-foreground" : "border-input bg-muted text-foreground placeholder:text-muted-foreground"
                }`}
              />
              <input
                value={threadId}
                onChange={(event) => setThreadId(event.target.value)}
                placeholder="threadId"
                className={`h-10 rounded-md border px-3 text-sm outline-none ${
                  lightMode ? "border-border bg-popover text-popover-foreground placeholder:text-muted-foreground" : "border-input bg-muted text-foreground placeholder:text-muted-foreground"
                }`}
              />
              <input
                type="number"
                value={topK}
                min={1}
                max={20}
                onChange={(event) => setTopK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                className={`h-10 rounded-md border px-3 text-sm outline-none ${
                  lightMode ? "border-border bg-popover text-popover-foreground" : "border-input bg-muted text-foreground"
                }`}
                aria-label="Top K"
              />
            </div>
            <div className="mx-auto flex max-w-5xl flex-col gap-3">
              <div className="flex min-w-0 flex-1 items-stretch gap-2 sm:items-end">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === "process" ? "Message MemoryOS with a real project update..." : "Ask MemoryOS a continuity question..."}
                rows={3}
                className={`min-h-28 flex-1 resize-none rounded-md border px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary/70 ${
                  lightMode ? "border-border bg-popover text-popover-foreground placeholder:text-muted-foreground" : "border-input bg-muted text-foreground placeholder:text-muted-foreground"
                }`}
              />
              <button
                type="button"
                onClick={() => void runModeCall()}
                disabled={isRunning}
                className={`flex min-h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold transition disabled:opacity-60 sm:h-10 ${
                  lightMode ? "bg-foreground text-background hover:bg-foreground/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                aria-label={`Run ${selectedConfig.label}`}
              >
                {isRunning ? (
                  "..."
                ) : (
                  <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path d="m5 12 14-7-4.5 14-3-5.5L5 12Z" fill="currentColor" />
                  </svg>
                )}
              </button>
              </div>
              {billing ? (
                <div className="w-full">
                  <UsageMeter usage={billing.usage} currentPlan={billing.currentPlan} compact />
                </div>
              ) : null}
            </div>
            <div className={`mx-auto mt-2.5 flex max-w-5xl flex-wrap items-center gap-3 text-xs ${lightMode ? "text-muted-foreground" : "text-muted-foreground"}`}>
              <span>Mode: {selectedConfig.label}</span>
              <span>TopK: {topK}</span>
              <span>Workspace: {workspace}</span>
              <span>Plan: {billing?.currentPlan ?? "Free"}</span>
            </div>
          </div>
        </section>

        <button
          type="button"
          aria-label="Resize chat and memory graph panes"
          title="Drag to resize chat and memory graph panes"
          onPointerDown={(event) => handlePaneDragStart("right", event)}
          onPointerMove={handlePaneDragMove}
          onPointerUp={handlePaneDragEnd}
          onPointerCancel={handlePaneDragEnd}
          className="group order-3 hidden w-2 shrink-0 cursor-col-resize touch-none items-center justify-center border-x border-border bg-background transition hover:bg-muted/40 lg:order-4 lg:flex"
        >
          <span className="h-10 w-px bg-border transition group-hover:bg-primary" />
        </button>

        <aside className="order-3 flex min-h-[520px] w-full flex-col border-t border-border bg-card lg:order-5 lg:min-h-0 lg:max-h-[calc(100svh-4rem)] lg:w-[var(--playground-right-pane)] lg:border-t-0">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
            <p className="border-l-4 border-primary pl-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Memory Graph</p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                title="Live graph built from recent memories, chat turns, and inferred relationships."
                className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
              >
                Help
              </button>
              <button
                type="button"
                onClick={() => {
                  setGraphExpanded((current) => {
                    const next = !current;
                    setPaneWidths(next ? { left: 18, center: 30, right: 52 } : { left: 27, center: 42, right: 31 });
                    return next;
                  });
                }}
                className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
                aria-label={graphExpanded ? "Collapse memory graph" : "Expand memory graph"}
              >
                {graphExpanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          <div className="relative min-h-[420px] flex-1 overflow-hidden bg-muted/40 sm:min-h-[500px] xl:min-h-0">
            <svg
              viewBox="0 0 640 720"
              className={`absolute inset-0 h-full w-full select-none touch-none ${isGraphDragging ? "cursor-grabbing" : "cursor-grab"}`}
              role="img"
              aria-label="animated 3d memory graph"
              onPointerDown={handleGraphPointerDown}
              onPointerMove={handleGraphPointerMove}
              onPointerUp={handleGraphPointerEnd}
              onPointerCancel={handleGraphPointerEnd}
              onDoubleClick={resetGraphView}
            >
              <defs>
                <pattern id="grid-playground" width="56" height="56" patternUnits="userSpaceOnUse">
                  <path d="M 56 0 L 0 0 0 56" fill="none" stroke="var(--border)" strokeWidth="1" />
                </pattern>
                <radialGradient id="graph-vignette" cx="50%" cy="42%" r="72%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
                  <stop offset="72%" stopColor="var(--background)" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="var(--background)" stopOpacity="0.45" />
                </radialGradient>
                <linearGradient id="edge-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity="0.25" />
                  <stop offset="45%" stopColor="var(--color-primary)" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity="0.25" />
                </linearGradient>
                <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="0 0 0 0 0.32 0 0 0 0 0.64 0 0 0 0 1 0 0 0 0.7 0"
                    result="glow"
                  />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="edge-blur" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.2" />
                </filter>
              </defs>
              <rect x="0" y="0" width="640" height="720" fill="var(--muted)" />
              <rect x="0" y="0" width="640" height="720" fill="url(#grid-playground)" />
              <rect x="0" y="0" width="640" height="720" fill="url(#graph-vignette)" />
              <g transform={`translate(${10 + graphPan.x} ${20 + graphPan.y}) scale(${graphScale})`}>
                <ellipse cx="320" cy="648" rx="230" ry="42" fill="var(--background)" opacity="0.55" />
                {graphEdges.map((edge, index) => {
                  const from = graphNodes.find((node) => node.id === edge.from);
                  const to = graphNodes.find((node) => node.id === edge.to);
                  if (!from || !to) return null;
                  const controlX = (from.x + to.x) / 2 + (index % 2 === 0 ? 46 : -46);
                  const controlY = (from.y + to.y) / 2 - 52 - Math.abs(from.z - to.z) * 8;
                  const path = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
                  const labelX = (from.x + to.x + controlX) / 3;
                  const labelY = (from.y + to.y + controlY) / 3;
                  return (
                    <g key={`${edge.from}-${edge.to}-${edge.relation}`}>
                      <path d={path} fill="none" stroke="var(--color-primary)" strokeOpacity="0.22" strokeWidth="8" filter="url(#edge-blur)" />
                      <path d={path} fill="none" stroke="url(#edge-glow)" strokeLinecap="round" strokeWidth="2.2" strokeDasharray="10 9">
                        <animate attributeName="stroke-dashoffset" from="0" to="-38" dur={`${5 + index}s`} repeatCount="indefinite" />
                      </path>
                      <rect
                        x={labelX - 28}
                        y={labelY - 11}
                        width="56"
                        height="20"
                        rx="10"
                        fill="var(--card)"
                        stroke="var(--border)"
                        strokeWidth="1"
                        opacity="0.88"
                      />
                      <text x={labelX} y={labelY + 4} textAnchor="middle" fill="var(--primary)" fontSize="9" fontWeight="700">
                        {edge.relation}
                      </text>
                    </g>
                  );
                })}

                {graphNodes.map((node, index) => {
                  const radius = 15 + node.z * 3;
                  const labelY = node.y + radius + 22;
                  const isSelected = selectedGraphNode?.id === node.id;
                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer transition-transform duration-300"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedGraphNodeId(node.id);
                      }}
                    >
                      <ellipse cx={node.x + 9} cy={node.y + 20 + node.z * 2} rx={radius * 1.45} ry={radius * 0.5} fill="var(--background)" opacity="0.45" />
                      <circle cx={node.x} cy={node.y} r={radius + 12} fill={node.color} opacity="0.08" filter="url(#node-glow)">
                        <animate attributeName="r" values={`${radius + 10};${radius + 16};${radius + 10}`} dur={`${4.5 + index * 0.3}s`} repeatCount="indefinite" />
                      </circle>
                      {isSelected ? (
                        <circle cx={node.x} cy={node.y} r={radius + 18} fill="none" stroke="var(--ring)" strokeDasharray="5 6" strokeWidth="1.8" opacity="0.82">
                          <animateTransform attributeName="transform" type="rotate" from={`0 ${node.x} ${node.y}`} to={`360 ${node.x} ${node.y}`} dur="7s" repeatCount="indefinite" />
                        </circle>
                      ) : null}
                      <circle cx={node.x} cy={node.y} r={radius} fill="var(--card)" stroke={node.color} strokeWidth="2.2" filter="url(#node-glow)" />
                      <circle cx={node.x - radius * 0.28} cy={node.y - radius * 0.32} r={Math.max(4, radius * 0.28)} fill={node.color} opacity="0.92" />
                      <circle cx={node.x + radius * 0.22} cy={node.y + radius * 0.2} r={Math.max(3, radius * 0.18)} fill="var(--foreground)" opacity="0.16" />
                      <text x={node.x} y={labelY} textAnchor="middle" fill="var(--foreground)" fontSize={node.z >= 3 ? "13" : "11"} fontWeight="800">
                        {node.label}
                      </text>
                      <text x={node.x} y={labelY + 16} textAnchor="middle" fill="var(--muted-foreground)" fontSize="9" fontWeight="600">
                        {node.subtitle}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="absolute bottom-3 left-3 flex flex-col overflow-hidden rounded-lg border border-border bg-card/90 backdrop-blur sm:bottom-5 sm:left-5">
              <button
                type="button"
                onClick={resetGraphView}
                className="h-10 border-b border-border px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={resetGraphView}
                className="h-10 border-b border-border px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Center
              </button>
                <button
                  type="button"
                onClick={() => setGraphScale((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
                className="h-10 border-b border-border px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                +
                </button>
                <button
                  type="button"
                onClick={() => setGraphScale((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))}
                className="h-10 px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                -
                </button>
            </div>

            <div className="absolute bottom-3 right-3 hidden w-44 rounded-xl border border-input bg-card/95 p-4 backdrop-blur sm:bottom-5 sm:right-5 sm:block sm:w-48">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">Legend</p>
                <button
                  type="button"
                  onClick={() => setLegendCollapsed((current) => !current)}
                  className="text-muted-foreground transition hover:text-foreground"
                  aria-label={legendCollapsed ? "Expand legend" : "Collapse legend"}
                >
                  {legendCollapsed ? ">" : "v"}
                </button>
              </div>
              {!legendCollapsed ? <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Statistics</p>
              <div className="mt-2 space-y-2 text-sm text-foreground">
                <div className="flex items-center justify-between"><span>memories</span><span>{stats.memories}</span></div>
                <div className="flex items-center justify-between"><span>documents</span><span>{stats.documents}</span></div>
                <div className="flex items-center justify-between"><span>connections</span><span>{stats.connections}</span></div>
              </div>
              </div> : null}

              {!legendCollapsed ? <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Legend</p>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>Nodes: Memory (latest), Memory (older), Document</p>
                <p>Relations: updates, derives, extends</p>
              </div>
            </div> : null}
            </div>

          </div>
        </aside>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg border border-border bg-card p-5 text-foreground ">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">Configure your MemoryOS playground connection.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
                aria-label="Close settings"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-foreground">Base URL</span>
                <input
                  value={apiOrigin}
                  onChange={(event) => setApiOrigin(event.target.value)}
                  placeholder="same-origin"
                  className="mt-2 h-11 w-full rounded-md border border-input bg-muted px-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
                <span className="mt-2 block text-xs text-muted-foreground">Use same-origin for the console proxy. Only paste a full URL when testing an external backend directly.</span>
              </label>

              <label className="block">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">API Key</span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((current) => !current)}
                    className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="mos_..."
                  type={showApiKey ? "text" : "password"}
                  className="mt-2 h-11 w-full rounded-md border border-input bg-muted px-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
                <span className="mt-2 block text-xs text-muted-foreground">The console token is auto-created after sign-in. Paste a token here for manual testing.</span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-foreground">Workspace</span>
                <input
                  value={workspace}
                  onChange={(event) => setWorkspace(event.target.value)}
                  placeholder="memoryostm"
                  className="mt-2 h-11 w-full rounded-md border border-input bg-muted px-3 text-sm text-foreground outline-none transition focus:border-primary"
                />
                <span className="mt-2 block text-xs text-muted-foreground">Used in retrieve, resume, and handoff playground requests.</span>
              </label>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  clearPlaygroundSettings();
                  setApiOrigin("");
                  setToken("");
                  setShowApiKey(false);
                  setWorkspace("memoryostm");
                  setProject("memoryos-playground");
                  setThreadId(`playground-thread-${Date.now().toString().slice(-6)}`);
                  setStatusLine("Settings cleared");
                }}
                className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted/50"
              >
                Clear
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void applyPlaygroundSettings()}
                  className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Save & sync
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

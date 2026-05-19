"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type PlaygroundMode = "process" | "retrieve" | "resume" | "handoff";
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
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    "http://localhost:3001";
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
    throw new Error(extractErrorMessage(payload, `Request failed with status ${response.status} at ${url}`));
  }

  return payload as T;
}

type PlaygroundSectionProps = {
  variant?: "standalone" | "embedded";
};

export function PlaygroundSection({ variant = "standalone" }: PlaygroundSectionProps = {}) {
  const isEmbedded = variant === "embedded";
  const [mode, setMode] = useState<PlaygroundMode>("process");
  const [tab, setTab] = useState<CenterTab>("chat");
  const [token, setToken] = useState(readMemoryTokenFromStorage() ?? "");
  const [threadId, setThreadId] = useState("playground-thread-1");
  const [project, setProject] = useState("memoryos-playground");
  const [workspace, setWorkspace] = useState("memoryostm");
  const [apiOrigin, setApiOrigin] = useState(
    process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() || "http://localhost:3001",
  );
  const [topK, setTopK] = useState(5);
  const [input, setInput] = useState("I am building MemoryOS and now focusing on Week 2 live traction.");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      text: "MemoryOS Playground live mode. Send a real update to start memory graph evolution.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [statusLine, setStatusLine] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [requests, setRequests] = useState<RequestEvent[]>([]);
  const [graphScale, setGraphScale] = useState(1);
  const [graphPan, setGraphPan] = useState({ x: 0, y: 0 });
  const [isGraphDragging, setIsGraphDragging] = useState(false);
  const graphDragStartRef = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(true);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const lightMode = false;
  const [selectedContainerTag, setSelectedContainerTag] = useState(
    isEmbedded ? "" : "memoryostm",
  );
  const [setupTab, setSetupTab] = useState<SetupTab>("configure");
  const [importText, setImportText] = useState("");
  const [expandedProfileIds, setExpandedProfileIds] = useState<Record<string, boolean>>({});

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

  const refreshLiveData = useCallback(
    async (effectiveToken: string): Promise<void> => {
      const [memoryPayload, insightPayload, timelinePayload, requestPayload, billingPayload] = await Promise.all([
        fetchMemoryApi<MemoryListResponse>("/api/memory/list?limit=40", effectiveToken, undefined, apiOrigin),
        fetchMemoryApi<InsightsResponse>("/api/memory/insights", effectiveToken, undefined, apiOrigin),
        fetchMemoryApi<TimelineResponse>("/api/memory/timeline?limit=40", effectiveToken, undefined, apiOrigin),
        fetchMemoryApi<RequestHistoryResponse>("/api/memory/requests?limit=30&range=all", effectiveToken, undefined, apiOrigin),
        fetchMemoryApi<BillingSnapshot>("/api/memory/billing", effectiveToken, undefined, apiOrigin),
      ]);

      setMemories(memoryPayload.memories);
      setInsights(insightPayload);
      setTimeline(timelinePayload.events);
      setRequests(requestPayload.requests);
      setBilling(billingPayload);
    },
    [apiOrigin],
  );

  const tokenUsageLine = useMemo(() => {
    if (!billing) return "Tokens: --";
    return `Tokens: ${billing.usage.tokenUsed.toLocaleString()} / ${billing.usage.tokenLimit.toLocaleString()}`;
  }, [billing]);

  const searchUsageLine = useMemo(() => {
    if (!billing) return "Searches: --";
    return `Searches: ${billing.usage.searchUsed.toLocaleString()} / ${billing.usage.searchLimit.toLocaleString()}`;
  }, [billing]);

  useEffect(() => {
    const saved = readPlaygroundSettings();
    if (saved?.apiOrigin) setApiOrigin(saved.apiOrigin);
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
          await refreshLiveData(effectiveToken);
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
  }, [refreshLiveData, withAuthorizedToken]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void withAuthorizedToken(async (effectiveToken) => {
        await refreshLiveData(effectiveToken);
        setStatusLine((current) =>
          current.startsWith("Running ") ? current : "Live · syncing",
        );
      }).catch(() => {
        // background refresh stays quiet
      });
    }, 12_000);

    return () => window.clearInterval(interval);
  }, [refreshLiveData, withAuthorizedToken]);

  const applyPlaygroundSettings = useCallback(async () => {
    writePlaygroundSettings({
      apiOrigin: apiOrigin.trim() || "http://localhost:3001",
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
        await refreshLiveData(effectiveToken);
      });
      setStatusLine("Live · settings applied");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not apply settings");
      setStatusLine("Settings saved · sync failed");
    }
  }, [apiOrigin, workspace, project, threadId, token, withAuthorizedToken, refreshLiveData]);

  const profileCards = useMemo(() => {
    return memories.slice(0, 4).map((memory) => ({
      id: memory.id,
      text: formatMemoryForDisplay(memory.summary || memory.content) || "Memory updated",
    }));
  }, [memories]);

  const toggleProfileCard = useCallback((id: string) => {
    setExpandedProfileIds((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }, []);

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
        } else {
          body = {
            question: text,
            project,
            topK,
            threadId,
            workspace,
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

        await refreshLiveData(effectiveToken);
        return response;
      });

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: responseSnippet(payload, mode),
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, assistantMessage]);
      setStatusLine(`${selectedConfig.label} completed`);
      setInput("");
    } catch (error) {
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
    setMessages([
      {
        id: `system-${Date.now()}`,
        role: "system",
        text: "New chat started. MemoryOS is ready for live continuity requests.",
        createdAt: new Date().toISOString(),
      },
    ]);
    setThreadId(`playground-thread-${Date.now().toString().slice(-6)}`);
    setInput("");
    setErrorMessage(null);
    setStatusLine("New chat session created");
  }

  const stats = {
    memories: memories.length,
    documents: timeline.length,
    connections: Math.max(0, graphEdges.length),
  };

  if (!selectedContainerTag && isEmbedded) {
    return (
      <div className="grid min-h-[calc(100vh-150px)] overflow-hidden rounded-[10px] border border-border bg-background lg:grid-cols-[minmax(420px,1fr)_390px]">
        <section className="flex min-h-[660px] items-center justify-center px-8 pb-12">
          <div className="w-full max-w-[720px] text-center">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center">
              <svg className="h-14 w-14 text-foreground" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M24 4v16M24 28v16M4 24h16M28 24h16M11.5 11.5 20 20M28 28l8.5 8.5M36.5 11.5 28 20M20 28l-8.5 8.5" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
              </svg>
            </div>
            <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Select a container tag to start</h1>
            <p className="mt-3 text-[14px] text-muted-foreground">Scope memory to a user, project, team, or agent runtime.</p>
            <div className="mx-auto mt-8 flex h-[82px] max-w-[680px] items-center gap-3 rounded-[7px] border border-border bg-background px-5 shadow-2xl shadow-black/25">
              <input
                value={workspace}
                onChange={(event) => setWorkspace(event.target.value)}
                placeholder="Select a container tag first"
                className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedContainerTag(workspace.trim() || "memoryos-playground");
                  setStatusLine("Container tag selected");
                }}
                className="flex h-11 w-11 items-center justify-center rounded-[7px] bg-primary text-[20px] text-foreground transition hover:bg-primary/90"
                aria-label="Select container tag"
              >
                ↑
              </button>
            </div>
          </div>
        </section>

        <aside className="flex min-h-[660px] flex-col border-l border-border bg-background">
          <div className="grid h-12 grid-cols-2 border-b border-border text-[14px]">
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
              <div className="space-y-3">
                <label className="grid grid-cols-[72px_1fr] items-center gap-3">
                  <span className="text-[14px] font-semibold text-foreground">Tag</span>
                  <input
                    value={workspace}
                    onChange={(event) => setWorkspace(event.target.value)}
                    className="h-10 rounded-[7px] border border-input bg-transparent px-3 text-[14px] text-foreground outline-none"
                  />
                </label>
                <label className="grid grid-cols-[72px_1fr] items-center gap-3">
                  <span className="text-[14px] font-semibold text-foreground">Model</span>
                  <select className="h-10 rounded-[7px] border border-input bg-background px-3 text-[14px] text-foreground outline-none">
                    <option>Claude Sonnet 4.6</option>
                    <option>GPT agent</option>
                    <option>Qwen</option>
                    <option>Gemini Pro</option>
                    <option>DeepSeek </option>
                    <option>Ollama</option>

                  </select>
                </label>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" className="min-h-[108px] rounded-[8px] border border-primary bg-primary/10 px-4 py-5 text-center">
                  <span className="block text-[20px] text-primary">⌕</span>
                  <span className="mt-2 block text-[15px] font-semibold text-foreground">Agent</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">LLM decides when to search</span>
                </button>
                <button type="button" className="min-h-[108px] rounded-[8px] border border-input px-4 py-5 text-center">
                  <span className="block text-[20px] text-muted-foreground">ϟ</span>
                  <span className="mt-2 block text-[15px] font-semibold text-muted-foreground">Auto-Search</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">Search every message</span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-[90px_1fr] items-center gap-3 border-t border-border pt-4">
                <span className="text-[14px] font-semibold text-foreground">Mode</span>
                <input value="hybrid" readOnly className="h-10 rounded-[7px] border border-input bg-transparent px-3 text-[14px] text-foreground outline-none" />
                <span className="text-[14px] font-semibold text-foreground">Limit</span>
                <input value={topK} onChange={(event) => setTopK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} className="h-10 rounded-[7px] border border-input bg-transparent px-3 text-[14px] text-foreground outline-none" />
                <span className="text-[14px] font-semibold text-foreground">Threshold</span>
                <input defaultValue="0.4" className="h-10 rounded-[7px] border border-input bg-transparent px-3 text-[14px] text-foreground outline-none" />
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <p className="text-[14px] font-semibold text-foreground">Code</p>
                <pre className="mt-3 max-h-[260px] overflow-auto rounded-[7px] border border-border bg-background p-3 text-[11px] leading-5 text-foreground">
{`import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
});

const context = await memoryos.beforeModel({
  containerTag: "${workspace || "memoryos-playground"}",
  query: userMessage,
  mode: "hybrid",
  limit: ${topK},
});`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 px-4 py-4">
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder="Paste text - notes, articles, chat logs..."
                className="h-32 w-full resize-none rounded-[7px] border border-border bg-background p-4 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button type="button" className="mt-4 flex h-11 w-full items-center justify-center rounded-[7px] bg-primary text-[14px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                + Import
              </button>
              <p className="mt-20 text-center text-[16px] text-muted-foreground">No documents processing</p>
            </div>
          )}
        </aside>
      </div>
    );
  }

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
        <header className="grid h-[60px] grid-cols-[260px_1fr_400px] border-b border-border">
          <div className="flex items-center border-r border-border px-5">
            <span className="inline-flex origin-left scale-[0.72]">
              <MemoryStarLogo tone="white" />
            </span>
          </div>
          <div className="flex items-center justify-between px-10">
            <div className="flex items-center gap-3">
              <span className="text-[15px]">⌂</span>
              <span className="text-[15px] font-semibold uppercase tracking-[0.06em]">{workspace || "memoryostm"}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Free</span>
            </div>
            <div className="flex items-center gap-8 text-[13px] font-semibold uppercase tracking-[0.08em]">
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
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground6 transition hover:text-foreground"
              aria-label="Playground settings"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .28 1.7 1.7 0 0 0-.82 1.46V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-.82-1.46 1.7 1.7 0 0 0-1-.28 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.28-1 1.7 1.7 0 0 0-1.46-.82H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.46-.82 1.7 1.7 0 0 0 .28-1 1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.28 1.7 1.7 0 0 0 .82-1.46V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 .82 1.46 1.7 1.7 0 0 0 1 .28 1.7 1.7 0 0 0 1.87-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.36 9c0 .35.1.69.28 1 .3.5.84.82 1.46.82H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.46.82c-.18.31-.28.65-.28 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground"
              aria-label="Dark theme enabled"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M20 14.5A7.8 7.8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-60px)] grid-cols-[260px_minmax(620px,1fr)_400px]">
          <aside className="border-r border-border bg-background px-2.5 py-4">
            <div className="relative">
              <input
                placeholder="Search..."
                className="h-11 w-full rounded-[7px] border border-border bg-muted/50 px-12 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</span>
              <span className="absolute right-5 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">⌘K</span>
            </div>

            <nav className="mt-5 space-y-1 text-[14px]">
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
                  className={`flex h-9 w-full items-center gap-3 rounded-[5px] px-4 text-left transition ${
                    label === "Playground" ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <span className="w-4 text-muted-foreground">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-9 space-y-1">
              <p className="px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Analytics</p>
              <button type="button" className="flex h-9 w-full items-center justify-between rounded-[5px] px-4 text-left text-[14px] text-muted-foreground">
                <span>User Insights</span>
                <span className="text-muted-foreground">▢</span>
              </button>
            </div>

            <div className="mt-7 space-y-1">
              <p className="px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Data</p>
              {["Connectors", "Import"].map((item) => (
                <button key={item} type="button" className="flex h-9 w-full items-center rounded-[5px] px-4 text-left text-[14px] text-muted-foreground hover:bg-muted/60">
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-7 space-y-1">
              <p className="px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Developer</p>
              {["API Keys", "Agents", "Plugins"].map((item) => (
                <button key={item} type="button" className="flex h-9 w-full items-center rounded-[5px] px-4 text-left text-[14px] text-muted-foreground hover:bg-muted/60">
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-7 space-y-1">
              <p className="px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Organization</p>
              {["Team", "Billing", "Settings"].map((item) => (
                <button key={item} type="button" className="flex h-9 w-full items-center rounded-[5px] px-4 text-left text-[14px] text-muted-foreground hover:bg-muted/60">
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[calc(100vh-60px)] flex-col bg-background">
            <div className="flex flex-1 items-center justify-center px-8 pb-20">
              <div className="w-full max-w-[760px] text-center">
                <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center">
                  <svg className="h-14 w-14 text-foreground" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <path d="M24 4v16M24 28v16M4 24h16M28 24h16M11.5 11.5 20 20M28 28l8.5 8.5M36.5 11.5 28 20M20 28l-8.5 8.5" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
                  </svg>
                </div>
                <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Select a container tag to start</h1>
                <p className="mt-3 text-[14px] text-muted-foreground">Scope memory to a user, project, team, or agent runtime.</p>
                <div className="mx-auto mt-8 flex h-[86px] max-w-[720px] items-center gap-3 rounded-[7px] border border-border bg-background px-5 shadow-2xl shadow-black/25">
                  <input
                    value={workspace}
                    onChange={(event) => setWorkspace(event.target.value)}
                    placeholder="Select a container tag first"
                    className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContainerTag(workspace.trim() || "memoryos-playground");
                      setStatusLine("Container tag selected");
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-[7px] bg-primary text-[20px] text-foreground transition hover:bg-primary/90"
                    aria-label="Select container tag"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-[calc(100vh-60px)] flex-col border-l border-border bg-background">
            <div className="grid h-11 grid-cols-2 border-b border-border text-[14px]">
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
                  <label className="grid grid-cols-[74px_1fr] items-center gap-3">
                    <span className="text-[14px] font-semibold text-foreground">Tag</span>
                    <button type="button" onClick={() => setWorkspace("memoryos-playground")} className="flex h-10 items-center justify-between rounded-[7px] border border-input px-3 text-[14px] text-foreground">
                      <span>{workspace || "Select tag"}</span><span>⌄</span>
                    </button>
                  </label>
                  <label className="grid grid-cols-[74px_1fr] items-center gap-3">
                    <span className="text-[14px] font-semibold text-foreground">Model</span>
                    <button type="button" className="flex h-10 items-center justify-between rounded-[7px] border border-input px-3 text-[14px] text-foreground">
                      <span>Claude Sonnet 4.6</span><span>⌄</span>
                    </button>
                  </label>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" className="min-h-[118px] rounded-[8px] border border-primary bg-primary/10 px-4 py-6 text-center">
                    <span className="block text-[22px] text-primary">⌕</span>
                    <span className="mt-2 block text-[15px] font-semibold text-foreground">Agent</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">LLM decides when to search</span>
                  </button>
                  <button type="button" className="min-h-[118px] rounded-[8px] border border-input px-4 py-6 text-center">
                    <span className="block text-[22px] text-muted-foreground">ϟ</span>
                    <span className="mt-2 block text-[15px] font-semibold text-muted-foreground">Auto-Search</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">Search every message</span>
                  </button>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="grid grid-cols-[90px_1fr] items-center gap-3">
                    <span className="text-[14px] font-semibold text-foreground">Mode</span>
                    <button type="button" className="h-10 rounded-[7px] border border-input px-3 text-left text-[14px] text-foreground">hybrid</button>
                    <span className="text-[14px] font-semibold text-foreground">Limit</span>
                    <input value={topK} onChange={(event) => setTopK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} className="h-10 rounded-[7px] border border-input bg-transparent px-3 text-[14px] text-foreground outline-none" />
                    <span className="text-[14px] font-semibold text-foreground">Threshold</span>
                    <input defaultValue="0.4" className="h-10 rounded-[7px] border border-input bg-transparent px-3 text-[14px] text-foreground outline-none" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-foreground">
                    {["Rerank", "Rewrite", "Aggregate"].map((item) => (
                      <label key={item} className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4" />{item}</label>
                    ))}
                  </div>
                  <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Include</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[13px] text-foreground">
                    {["Related", "Docs", "Chunks", "Summaries", "Forgotten"].map((item, index) => (
                      <label key={item} className="inline-flex items-center gap-2">
                        <input defaultChecked={index < 2} type="checkbox" className="h-4 w-4" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-[14px] font-semibold text-foreground">Code</p>
                  <pre className="mt-3 max-h-[330px] overflow-auto rounded-[7px] border border-border bg-background p-3 text-[11px] leading-5 text-foreground">
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
                  className="h-32 w-full resize-none rounded-[7px] border border-border bg-background p-4 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button type="button" className="mt-4 flex h-11 w-full items-center justify-center rounded-[7px] bg-primary text-[14px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  + Import
                </button>
                <p className="mt-20 text-center text-[16px] text-muted-foreground">No documents processing</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleNewChat}
              className="h-[60px] border-t border-border text-[14px] font-semibold uppercase tracking-[0.08em] text-foreground"
            >
              Reset Chat
            </button>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className={`dark h-screen overflow-hidden ${lightMode ? "bg-background text-foreground" : "bg-background text-foreground"}`}>
      <header className={`flex h-[70px] items-center justify-between border-b px-5 ${lightMode ? "border-black/10 bg-white [&_*]:!text-foreground" : "border-border bg-background"}`}>
        <div className="flex items-center gap-4">
          <span className="inline-flex origin-left scale-[0.84]">
            <MemoryStarLogo tone={lightMode ? "black" : "white"} />
          </span>
          <span className={`hidden h-5 w-px sm:block ${lightMode ? "bg-background/12" : "bg-white/12"}`} />
        </div>
        <div className="flex items-center gap-2">
          <button       
            type="button" 
            onClick={() => setSettingsOpen(true)}
            className={`flex h-9 w-9 items-center justify-center rounded-[8px] bg-transparent transition ${lightMode ? "text-black/65 hover:text-black" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Playground settings"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .28 1.7 1.7 0 0 0-.82 1.46V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-.82-1.46 1.7 1.7 0 0 0-1-.28 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.28-1 1.7 1.7 0 0 0-1.46-.82H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.46-.82 1.7 1.7 0 0 0 .28-1 1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.28 1.7 1.7 0 0 0 .82-1.46V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 .82 1.46 1.7 1.7 0 0 0 1 .28 1.7 1.7 0 0 0 1.87-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.36 9c0 .35.1.69.28 1 .3.5.84.82 1.46.82H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.46.82c-.18.31-.28.65-.28 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted-foreground"
            aria-label="Dark theme enabled"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M20 14.5A7.8 7.8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </header>

      <div className={`grid h-[calc(100vh-70px)] min-h-0 grid-cols-1 ${graphExpanded ? "xl:grid-cols-[260px_minmax(420px,1fr)_minmax(560px,44vw)]" : "xl:grid-cols-[300px_minmax(560px,1fr)_430px]"}`}>
        <aside className={`min-h-0 overflow-y-auto border-b xl:border-b-0 xl:border-r ${lightMode ? "border-black/10 bg-white [&_*]:!text-foreground" : "border-border bg-background"}`}>
          <div className="px-4 py-4">
            <p className="border-l-4 border-primary pl-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Profile</p>
            <div className="mt-3 space-y-2.5">
              {profileCards.length > 0 ? (
                profileCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleProfileCard(card.id)}
                    className={`rounded-[8px] border px-3 py-3 text-[14px] leading-6 shadow-lg shadow-black/10 ${
                      lightMode ? "border-black/10 bg-white text-foreground" : "border-border bg-background text-foreground"
                    } w-full cursor-pointer text-left transition hover:border-primary/40`}
                  >
                    <div className={`${expandedProfileIds[card.id] ? "max-h-none" : "max-h-[168px] overflow-hidden"}`}>
                      {card.text}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {expandedProfileIds[card.id] ? "Collapse" : "Expand"}
                    </div>
                  </button>
                ))
              ) : (
                <div className={`flex min-h-[160px] flex-col items-center justify-center rounded-[10px] border border-dashed px-3 py-3 text-center ${
                  lightMode ? "border-black/15 bg-white text-foreground" : "border-border bg-background"
                }`}>
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-[24px] ${
                    lightMode ? "border-black/12 bg-background/[0.03] text-black/40" : "border-border bg-white/[0.03] text-muted-foreground"
                  }`}>
                    o
                  </div>
                  <p className={`text-[13px] ${lightMode ? "text-black/60" : "text-muted-foreground"}`}>No profile memories yet</p>
                  <p className={`mt-1 text-[12px] ${lightMode ? "text-black/42" : "text-foreground/35"}`}>No data yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className={`border-t px-4 py-4 ${lightMode ? "border-black/10" : "border-border"}`}>
            <p className="border-l-4 border-primary pl-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sessions</p>
            <div className="mt-3 space-y-2.5">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-[8px] border px-3 py-3 shadow-lg shadow-black/10 ${
                      lightMode ? "border-black/10 bg-white text-foreground" : "border-border bg-background"
                    }`}
                  >
                    <p className={`text-[13px] font-semibold ${lightMode ? "text-foreground" : "text-foreground/90"}`}>{session.title}</p>
                    <p className={`mt-1 text-[12px] ${lightMode ? "text-black/62" : "text-muted-foreground"}`}>{session.detail}</p>
                    <p className={`mt-1 text-[11px] ${lightMode ? "text-black/44" : "text-muted-foreground"}`}>{formatTs(session.at)}</p>
                  </div>
                ))
              ) : (
                <div className={`flex min-h-[160px] flex-col items-center justify-center rounded-[10px] border border-dashed px-3 py-3 text-center ${
                  lightMode ? "border-black/15 bg-white text-foreground" : "border-border bg-background"
                }`}>
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-[22px] ${
                    lightMode ? "border-black/12 bg-background/[0.03] text-black/40" : "border-border bg-white/[0.03] text-muted-foreground"
                  }`}>
                    []
                  </div>
                  <p className={`text-[13px] ${lightMode ? "text-black/60" : "text-muted-foreground"}`}>No sessions yet</p>
                  <p className={`mt-1 text-[12px] ${lightMode ? "text-black/42" : "text-foreground/35"}`}>Requests appear after the first run.</p>
                </div>
              )}
            </div>
          </div>

          <div className={`border-t px-4 py-4 ${lightMode ? "border-black/10" : "border-border"}`}>
            <p className="border-l-4 border-primary pl-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Get Started</p>
            <div className={`mt-3 rounded-[8px] border p-3 ${
              lightMode ? "border-black/10 bg-white" : "border-border bg-background"
            }`}>
              <p className={`text-[13px] ${lightMode ? "text-black/68" : "text-muted-foreground"}`}>Production-ready memory infrastructure</p>
              <a
                href="/developer-console"
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-primary text-[13px] font-semibold text-foreground transition hover:bg-primary/90"
              >
                Back to Console
              </a>
            </div>
          </div>
        </aside>

        <section className={`flex min-h-0 flex-col border-b xl:border-b-0 xl:border-r ${lightMode ? "border-black/10 bg-white [&_*]:!text-foreground" : "border-border bg-background"}`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 ${lightMode ? "border-black/10" : "border-border"}`}>
            <div className="flex items-center">
              {[
                { key: "chat", label: "Chat.md", icon: "MD" },
                { key: "code", label: "code.ts", icon: "TS" },
                { key: "python", label: "main.py", icon: "PY" },
              ].map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setTab(entry.key as CenterTab)}
                  className={`flex h-10 min-w-[118px] items-center gap-2 border-r px-4 text-[13px] font-semibold transition ${lightMode ? "border-black/10" : "border-border"} ${
                    tab === entry.key
                      ? lightMode
                        ? "bg-background/[0.04] text-foreground"
                        : "bg-white/[0.04] text-foreground"
                      : lightMode
                        ? "text-black/55 hover:text-black"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`text-[9px] font-bold ${tab === entry.key ? "text-primary" : lightMode ? "text-black/35" : "text-foreground/35"}`}>
                    {entry.icon}
                  </span>
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-semibold text-foreground transition hover:bg-primary/90"
              >
                + New Chat
              </button>
              <button
                type="button"
                onClick={() => setTab(tab === "chat" ? "code" : "chat")}
                className={`h-9 w-9 rounded-[8px] text-[13px] font-semibold transition ${
                  lightMode ? "text-black/50 hover:text-black" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Toggle code"
              >
                &lt;/&gt;
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
            {tab === "chat" ? (
              <>
                {!isEmbedded ? (
                  <div className="mx-auto mb-12 max-w-[920px] pt-10 text-center">
                    <div className="mx-auto flex items-center justify-center">
                      <span className="inline-flex scale-[1.18]">
                        <MemoryStarLogo tone={lightMode ? "black" : "white"} />
                      </span>
                    </div>
                    <p className={`mx-auto mt-6 max-w-[720px] text-[16px] leading-7 ${lightMode ? "text-black/70" : "text-muted-foreground"}`}>
                      Live workspace continuity is connected to your backend.
                      <br />
                      Memory contracts, retrieval, and runtime requests are shown from real API data.
                    </p>

                    <div className={`mx-auto mt-10 max-w-[780px] rounded-[10px] border p-7 text-left shadow-lg ${
                      lightMode ? "border-black/10 bg-white text-foreground shadow-primary/10" : "border-border bg-card text-foreground shadow-black/20"
                    }`}>
                      <div className="mb-6 flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full bg-destructive" />
                        <span className="h-3.5 w-3.5 rounded-full bg-chart-5" />
                        <span className="h-3.5 w-3.5 rounded-full bg-chart-2" />
                        <span className={`ml-5 text-[12px] ${lightMode ? "text-black/42" : "text-foreground/35"}`}>memoryos.ts (live workspace)</span>
                      </div>
                      <pre className={`overflow-x-auto text-[14px] leading-6 ${lightMode ? "text-foreground" : "text-foreground"}`}>
{`const model = withMemoryOS(baseModel, {
  workspace: "${workspace}",
  project: "${project}",
  conversationId: "${threadId}",
  mode: "${mode}",
  topK: ${topK},
})`}
                      </pre>
                    </div>

                    <div className="mx-auto mt-9 grid max-w-[720px] grid-cols-3 gap-4">
                      <div>
                        <p className={`text-[27px] font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>
                          {memories.length}
                        </p>
                        <p className={`text-[11px] uppercase tracking-[0.12em] ${lightMode ? "text-black/52" : "text-muted-foreground"}`}>Live memories</p>
                      </div>
                      <div>
                        <p className={`text-[27px] font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>
                          {liveRequestStats.p95LatencyMs !== null ? `${liveRequestStats.p95LatencyMs}ms` : "--"}
                        </p>
                        <p className={`text-[11px] uppercase tracking-[0.12em] ${lightMode ? "text-black/52" : "text-muted-foreground"}`}>P95 request latency</p>
                      </div>
                      <div>
                        <p className={`text-[27px] font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>
                          {liveRequestStats.successRate !== null ? `${liveRequestStats.successRate}%` : "--"}
                        </p>
                        <p className={`text-[11px] uppercase tracking-[0.12em] ${lightMode ? "text-black/52" : "text-muted-foreground"}`}>Request success rate</p>
                      </div>
                    </div>

                    <div className="mx-auto mt-12 max-w-[800px]">
                      <p className={`text-[13px] font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>Try these prompts -</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                            className={`min-h-[92px] rounded-[8px] border px-3 py-3 text-center transition hover:border-primary/60 ${
                              lightMode ? "border-black/10 bg-white hover:bg-primary/10" : "border-border bg-muted/30 hover:bg-primary/15"
                            }`}
                          >
                            <span className={`text-[13px] font-semibold ${lightMode ? "text-foreground" : "text-foreground"}`}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mx-auto max-w-[920px] space-y-9">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex gap-5"
                    >
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border text-[11px] font-semibold uppercase ${
                        message.role === "user"
                          ? lightMode
                            ? "border-primary/35 bg-primary/10 text-primary"
                            : "border-primary/35 bg-primary/20 text-primary"
                          : message.role === "assistant"
                            ? lightMode
                              ? "border-chart-2/35 bg-chart-2/10 text-chart-2"
                              : "border-chart-2/35 bg-chart-2/15 text-chart-2"
                            : lightMode
                              ? "border-black/12 bg-background/[0.04] text-black/55"
                              : "border-border bg-muted/50 text-muted-foreground"
                      }`}>
                        {message.role === "user" ? "U" : message.role === "assistant" ? "M" : "S"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[18px] leading-8 ${
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
                        <p className={`mt-2 text-[11px] uppercase tracking-[0.1em] ${lightMode ? "text-black/34" : "text-muted-foreground"}`}>
                          {message.role} | {formatTs(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : tab === "code" ? (
              <pre className={`rounded-[12px] border p-4 text-[13px] leading-6 ${
                lightMode ? "border-black/10 bg-white text-foreground" : "border-border bg-card text-muted-foreground"
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
              <pre className={`rounded-[12px] border p-4 text-[13px] leading-6 ${
                lightMode ? "border-black/10 bg-white text-foreground" : "border-border bg-card text-muted-foreground"
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
              <div className="mt-4 rounded-[10px] border border-destructive/40 bg-destructive/15 px-3.5 py-2.5 text-[13px] text-destructive">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className={`shrink-0 border-t px-8 py-4 ${lightMode ? "border-black/10 bg-white" : "border-border bg-background"}`}>
            <div className="mx-auto mb-3 grid max-w-[920px] gap-2 md:grid-cols-[1fr_1fr_100px]">
              <input
                value={project}
                onChange={(event) => setProject(event.target.value)}
                placeholder="project"
                className={`h-10 rounded-[8px] border px-3 text-[13px] outline-none ${
                  lightMode ? "border-black/10 bg-white text-foreground placeholder:text-black/34" : "border-input bg-muted text-foreground placeholder:text-muted-foreground"
                }`}
              />
              <input
                value={threadId}
                onChange={(event) => setThreadId(event.target.value)}
                placeholder="threadId"
                className={`h-10 rounded-[8px] border px-3 text-[13px] outline-none ${
                  lightMode ? "border-black/10 bg-white text-foreground placeholder:text-black/34" : "border-input bg-muted text-foreground placeholder:text-muted-foreground"
                }`}
              />
              <input
                type="number"
                value={topK}
                min={1}
                max={20}
                onChange={(event) => setTopK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                className={`h-10 rounded-[8px] border px-3 text-[13px] outline-none ${
                  lightMode ? "border-black/10 bg-white text-foreground" : "border-input bg-muted text-foreground"
                }`}
                aria-label="Top K"
              />
            </div>
            <div className="mx-auto flex max-w-[920px] items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === "process" ? "Message MemoryOS with a real project update..." : "Ask MemoryOS a continuity question..."}
                rows={3}
                className={`min-h-[112px] flex-1 resize-none rounded-[8px] border px-4 py-3 text-[15px] leading-6 outline-none transition focus:border-primary/70 ${
                  lightMode ? "border-black/10 bg-white text-foreground placeholder:text-black/34" : "border-input bg-muted text-foreground placeholder:text-muted-foreground"
                }`}
              />
              <button
                type="button"
                onClick={() => void runModeCall()}
                disabled={isRunning}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-[14px] font-semibold transition disabled:opacity-60 ${
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
            <div className={`mx-auto mt-2.5 flex max-w-[920px] flex-wrap items-center gap-3 text-[12px] ${lightMode ? "text-black/50" : "text-muted-foreground"}`}>
              <span>Mode: {selectedConfig.label}</span>
              <span>TopK: {topK}</span>
              <span>Workspace: {workspace}</span>
              <span>Plan: {billing?.currentPlan ?? "Free"}</span>
              <span>{tokenUsageLine}</span>
              <span>{searchUsageLine}</span>
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col bg-card">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <p className="border-l-4 border-primary pl-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Memory Graph</p>
            <button
              type="button"
              onClick={() => setGraphExpanded((current) => !current)}
              className="rounded-[7px] border border-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition hover:text-foreground"
              aria-label={graphExpanded ? "Collapse memory graph" : "Expand memory graph"}
            >
              {graphExpanded ? "Collapse" : "Expand"}
            </button>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/40">
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

            <div className="absolute bottom-5 left-5 flex flex-col overflow-hidden rounded-[10px] border border-border bg-card/90 shadow-2xl shadow-black/20 backdrop-blur dark:shadow-black/35">
              <button
                type="button"
                onClick={resetGraphView}
                className="h-10 border-b border-border px-4 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={resetGraphView}
                className="h-10 border-b border-border px-4 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Center
              </button>
                <button
                  type="button"
                onClick={() => setGraphScale((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
                className="h-10 border-b border-border px-4 text-[15px] font-semibold text-muted-foreground transition hover:text-foreground"
                >
                +
                </button>
                <button
                  type="button"
                onClick={() => setGraphScale((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))}
                className="h-10 px-4 text-[15px] font-semibold text-muted-foreground transition hover:text-foreground"
                >
                -
                </button>
            </div>

            <div className="absolute bottom-5 right-5 w-[190px] rounded-[14px] border border-input bg-card/95 p-4 shadow-2xl shadow-black/20 backdrop-blur dark:shadow-black/35">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-semibold text-foreground">Legend</p>
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
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Statistics</p>
              <div className="mt-2 space-y-2 text-[14px] text-foreground">
                <div className="flex items-center justify-between"><span>memories</span><span>{stats.memories}</span></div>
                <div className="flex items-center justify-between"><span>documents</span><span>{stats.documents}</span></div>
                <div className="flex items-center justify-between"><span>connections</span><span>{stats.connections}</span></div>
              </div>
              </div> : null}

              {!legendCollapsed ? <div className="mt-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Legend</p>
              <div className="mt-2 space-y-2 text-[13px] text-muted-foreground">
                <p>Nodes: Memory (latest), Memory (older), Document</p>
                <p>Relations: updates, derives, extends</p>
              </div>
            </div> : null}
            </div>

          </div>
        </aside>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/55 px-4 backdrop-blur-[6px]">
          <div className="w-full max-w-[560px] rounded-[12px] border border-border bg-card p-5 text-foreground shadow-2xl shadow-black/25 dark:shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Settings</h2>
                <p className="mt-1 text-[14px] text-muted-foreground">Configure your MemoryOS playground connection.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition hover:text-foreground"
                aria-label="Close settings"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-[14px] font-semibold text-foreground">Base URL</span>
                <input
                  value={apiOrigin}
                  onChange={(event) => setApiOrigin(event.target.value)}
                  placeholder="http://localhost:3001"
                  className="mt-2 h-11 w-full rounded-[8px] border border-input bg-muted px-3 text-[14px] text-foreground outline-none transition focus:border-primary"
                />
                <span className="mt-2 block text-[12px] text-muted-foreground">Use your local backend or deployed MemoryOS API origin.</span>
              </label>

              <label className="block">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-foreground">API Key</span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((current) => !current)}
                    className="rounded-[6px] border border-border bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="mos_..."
                  type={showApiKey ? "text" : "password"}
                  className="mt-2 h-11 w-full rounded-[8px] border border-input bg-muted px-3 text-[14px] text-foreground outline-none transition focus:border-primary"
                />
                <span className="mt-2 block text-[12px] text-muted-foreground">The console token is auto-created after sign-in. Paste a token here for manual testing.</span>
              </label>

              <label className="block">
                <span className="text-[14px] font-semibold text-foreground">Workspace</span>
                <input
                  value={workspace}
                  onChange={(event) => setWorkspace(event.target.value)}
                  placeholder="memoryostm"
                  className="mt-2 h-11 w-full rounded-[8px] border border-input bg-muted px-3 text-[14px] text-foreground outline-none transition focus:border-primary"
                />
                <span className="mt-2 block text-[12px] text-muted-foreground">Used in retrieve, resume, and handoff playground requests.</span>
              </label>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  clearPlaygroundSettings();
                  setApiOrigin("http://localhost:3001");
                  setToken("");
                  setShowApiKey(false);
                  setWorkspace("memoryostm");
                  setProject("memoryos-playground");
                  setThreadId(`playground-thread-${Date.now().toString().slice(-6)}`);
                  setStatusLine("Settings cleared");
                }}
                className="h-11 rounded-lg border border-border px-4 text-[14px] font-semibold text-foreground transition hover:bg-muted/50"
              >
                Clear
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="h-11 rounded-lg border border-border px-4 text-[14px] font-semibold text-foreground transition hover:bg-muted/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void applyPlaygroundSettings()}
                  className="h-11 rounded-lg bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition hover:bg-primary/90"
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

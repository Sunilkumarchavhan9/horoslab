/* eslint-disable react/no-unescaped-entities */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { LiveBrainMapDitherCanvas } from "@/components/landing/live-brain-map-dither-canvas";
import { DitherBackground } from "@/components/ui/dither-background";
import { Icon, type IconName } from "@/components/ui/icon";
import { EASE_OUT, SPRING } from "@/lib/motion";
import { StructuredDataPanel } from "./_shared/structured-data-panel";

const INSPECT_DRAWER_CONTAINER = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.052, delayChildren: 0.05 },
  },
} as const;

const INSPECT_DRAWER_ITEM = {
  hidden: { opacity: 0, x: 22, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: EASE_OUT },
  },
} as const;
import {
  formatMemoryForDisplay,
  hasRawMemoryPayload,
} from "@/lib/memory-display-text";
import { getOrCreateMemoryToken } from "../../../lib/memory-token";

type MemoryRelation = {
  label: string;
  tone: string;
};

type MemoryStatus = {
  label: string;
  tone: string;
};

type MemoryRow = {
  id: string;
  type: string;
  summary: string;
  content: string;
  status: string;
  confidence: number;
  updatedAt: string;
};

type MemorySessionEvent = {
  id: string;
  createdAt: string;
  type: string;
  status: "Success" | "Error";
  latencyMs: number;
  route: string;
  method: string;
  statusCode: number;
};

type MemoriesSectionProps = {
  selectedMemoryTags: string[];
  workspaceName: string;
  showMemoryTagFilter: boolean;
  memoryLegendExpanded: boolean;
  memoryTagQuery: string;
  filteredMemoryTagOptions: string[];
  memoryStats: Array<[string, string]>;
  memoryRelations: MemoryRelation[];
  memoryStatuses: MemoryStatus[];
  memories: MemoryRow[];
  requestEvents?: MemorySessionEvent[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onToggleLegend: () => void;
  onOpenTagFilter: () => void;
  onCloseTagFilter: () => void;
  onApplyTagFilter: () => void;
  onResetTagFilter: () => void;
  onTagQueryChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
};

type MemoryGraphNode = {
  id: string;
  memoryId?: string;
  eventId?: string;
  x: number;
  y: number;
  r: number;
  label: string;
  detail: string;
  color: string;
  kind: "session" | "operation" | "memory" | "agent";
  group: string;
};

type MemoryGraphEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  detail: string;
  color: string;
  opacity: number;
};

type MemoryGraphSelection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string };

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function accentForMemoryType(type: string | undefined): string {
  const t = (type || "").toLowerCase();
  if (t === "project") return "var(--color-primary)";
  if (t === "problem") return "var(--destructive)";
  if (t === "task") return "var(--color-primary)";
  if (t === "preference") return "var(--muted-foreground)";
  if (t === "episodic") return "var(--color-primary)";
  if (t === "handoff") return "var(--muted-foreground)";
  if (t === "insights") return "var(--color-primary)";
  const palette = [
    "var(--color-primary)",
    "var(--color-primary)",
    "var(--color-primary)",
    "var(--color-primary)",
    "var(--muted-foreground)",
    "var(--color-primary)",
    "var(--muted-foreground)",
  ];
  return palette[hashString(type || "memory") % palette.length];
}

function iconForMemoryType(type: string | undefined): IconName {
  const t = (type || "").toLowerCase();
  if (t === "project") return "graph";
  if (t === "problem") return "handoff";
  if (t === "task") return "agent";
  if (t === "preference") return "memory";
  if (t === "episodic") return "timeline";
  if (t === "handoff") return "handoff";
  if (t === "insights") return "search";
  return "vault";
}

function colorForMemory(memory: MemoryRow): string {
  return accentForMemoryType(memory.type);
}

function compactLabel(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > 30 ? `${normalized.slice(0, 27)}...` : normalized;
}

function operationForEvent(
  event: MemorySessionEvent,
):
  | "process"
  | "retrieve"
  | "resume"
  | "handoff"
  | "timeline"
  | "insights"
  | "other" {
  if (event.route.includes("/process")) return "process";
  if (event.route.includes("/retrieve")) return "retrieve";
  if (event.route.includes("/resume")) return "resume";
  if (event.route.includes("/handoff")) return "handoff";
  if (event.route.includes("/timeline")) return "timeline";
  if (event.route.includes("/insights")) return "insights";
  return event.type === "memory_list" ? "timeline" : "other";
}

function operationCopy(operation: string): string {
  switch (operation) {
    case "process":
      return "Saved new context from a playground, SDK, MCP, or HTTP agent turn.";
    case "retrieve":
      return "Asked MemoryOS to recall relevant memory before a model response.";
    case "resume":
      return "Asked MemoryOS what to continue next from previous project context.";
    case "handoff":
      return "Generated a handoff summary for a human or another agent.";
    case "timeline":
      return "Loaded historical memory activity for this workspace.";
    case "insights":
      return "Loaded derived workspace insights and active project signals.";
    default:
      return "Live MemoryOS API event from this signed-in workspace.";
  }
}

function shortTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : value;
}

function CountUp({ to, duration = 0.9 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / (duration * 1000), 1);
      setValue(Math.round((1 - Math.pow(1 - progress, 3)) * to));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [to, duration]);
  return <>{value}</>;
}

function ExpandedMemoryDetail({
  rawContent,
  rawSummary,
}: {
  rawContent: string;
  rawSummary: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!hasRawMemoryPayload(rawContent, rawSummary)) return null;

  let displayContent = rawContent.trim() || rawSummary.trim();
  if (displayContent.startsWith("{")) {
    try {
      displayContent = JSON.stringify(JSON.parse(displayContent), null, 2);
    } catch {
      // keep original string
    }
  }

  return (
    <motion.div className="mt-4 border-t border-border/60 pt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span
          className={`inline-block transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          aria-hidden
        >
          ›
        </span>
        {expanded ? "Hide raw trace" : "Inspect raw trace"}
      </button>
      {expanded ? (
        <motion.div className="mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StructuredDataPanel
            title="Raw trace"
            value={displayContent}
            maxHeightClassName="max-h-[300px]"
            compactChars={2600}
          />
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export function MemoriesSection({
  selectedMemoryTags,
  workspaceName,
  showMemoryTagFilter,
  memoryLegendExpanded,
  memoryTagQuery,
  filteredMemoryTagOptions,
  memoryStats,
  memoryRelations,
  memoryStatuses,
  memories,
  requestEvents = [],
  isLoading = false,
  errorMessage = null,
  onToggleLegend,
  onOpenTagFilter,
  onCloseTagFilter,
  onApplyTagFilter,
  onResetTagFilter,
  onTagQueryChange,
  onToggleTag,
}: MemoriesSectionProps) {
  const hasMemories = memories.length > 0;
  const hasGraphData = memories.length > 0 || requestEvents.length > 0;
  const [selectedGraphItem, setSelectedGraphItem] =
    useState<MemoryGraphSelection | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  // ─── Memory Doctor state ───────────────────────────────────────────────────
  const [inspectMemory, setInspectMemory] = useState<MemoryRow | null>(null);
  const [explainResult, setExplainResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [explainLoading, setExplainLoading] = useState<string | null>(null);
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null);
  const [autopilotResult, setAutopilotResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [compileResult, setCompileResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [compileLoading, setCompileLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  async function doctorFetch<T>(path: string, method = "POST"): Promise<T> {
    const callOnce = async (token: string | null) => {
      const res = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        /* non-JSON response */
      }
      return { res, json: (json ?? {}) as Record<string, unknown> };
    };

    let token = await getOrCreateMemoryToken();
    let { res, json } = await callOnce(token);

    // If unauthorized, try once more with a freshly issued token
    // (the cached one may have expired or been issued before sign-in completed).
    if (res.status === 401) {
      try {
        const { getOrCreateMemoryTokenWithRetry } =
          await import("../../../lib/memory-token");
        token = await getOrCreateMemoryTokenWithRetry({
          attempts: 2,
          delayMs: 200,
        });
        if (token) {
          ({ res, json } = await callOnce(token));
        }
      } catch {
        // fall through with the original 401
      }
    }

    if (!res.ok) {
      const errObj = json.error;
      const msg =
        typeof errObj === "string"
          ? errObj
          : errObj &&
              typeof errObj === "object" &&
              "message" in errObj &&
              typeof (errObj as { message?: unknown }).message === "string"
            ? (errObj as { message: string }).message
            : null;
      if (res.status === 401) {
        throw new Error(
          msg ?? "You're signed out. Refresh the page and sign in again.",
        );
      }
      if (res.status === 404) {
        throw new Error(
          msg ??
            "Memory Doctor endpoint not found. The backend may need to be restarted.",
        );
      }
      if (res.status === 502 || res.status === 503) {
        throw new Error(
          msg ??
            "Backend unreachable. Check that the MemoryOS API server is running on port 3001.",
        );
      }
      throw new Error(msg ?? `Request failed (${res.status})`);
    }
    return ((json as Record<string, unknown>).data ?? json) as T;
  }

  const handleInspect = useCallback((memory: MemoryRow) => {
    setInspectMemory(memory);
  }, []);

  const handleExplain = useCallback(
    async (memory: MemoryRow) => {
      setExplainLoading(memory.id);
      try {
        const result = await doctorFetch<Record<string, unknown>>(
          `/api/memory-doctor/explain/${memory.id}`,
        );
        setExplainResult(result);
        showToast("Explanation generated", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Explain failed",
          "error",
        );
      } finally {
        setExplainLoading(null);
      }
    },
    [showToast],
  );

  const handlePromote = useCallback(
    async (memory: MemoryRow) => {
      setPromoteLoading(memory.id);
      try {
        const result = await doctorFetch<{ promotedType: string }>(
          `/api/memory-doctor/promote/${memory.id}`,
        );
        showToast(`Promoted to ${result.promotedType}`, "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Promote failed",
          "error",
        );
      } finally {
        setPromoteLoading(null);
      }
    },
    [showToast],
  );

  const handleRunAutopilot = useCallback(async () => {
    setAutopilotLoading(true);
    try {
      const result = await doctorFetch<Record<string, unknown>>(
        "/api/memory-doctor/autopilot",
      );
      setAutopilotResult(result);
      showToast("Autopilot analysis complete", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Autopilot failed",
        "error",
      );
    } finally {
      setAutopilotLoading(false);
    }
  }, [showToast]);

  const handleCompileRawMemories = useCallback(async () => {
    setCompileLoading(true);
    try {
      const result = await doctorFetch<Record<string, unknown>>(
        "/api/memory-doctor/compile",
      );
      setCompileResult(result);
      showToast("Compilation complete", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Compile failed", "error");
    } finally {
      setCompileLoading(false);
    }
  }, [showToast]);

  const filteredMemories = useMemo(() => {
    if (activeFilter === "All") return memories;
    const lower = activeFilter.toLowerCase();
    return memories.filter((m) => {
      if (lower === "low confidence") return m.confidence < 0.6;
      if (lower === "needs cleanup")
        return m.status === "needs_review" || m.confidence < 0.4;
      if (lower === "conflicts") return m.status === "conflict";
      if (lower === "pinned") return m.status === "active";
      if (lower === "used in handoff") return m.type === "episodic";
      const typeStr = m.type?.toLowerCase() || "";
      if (lower.endsWith("s") && typeStr === lower.slice(0, -1)) return true;
      if (lower === "handoffs" && typeStr === "handoff") return true;
      return typeStr === lower;
    });
  }, [memories, activeFilter]);

  const memoryGraph = useMemo(() => {
    const visibleMemories = memories.slice(0, 10);
    const visibleEvents = requestEvents.slice(0, 12);
    const nodes: MemoryGraphNode[] = [];
    const edges: MemoryGraphEdge[] = [];
    const operationColors: Record<string, string> = {
      process: "var(--color-primary)",
      retrieve: "var(--color-primary)",
      resume: "var(--color-primary)",
      handoff: "var(--muted-foreground)",
      timeline: "var(--muted-foreground)",
      insights: "var(--color-primary)",
      other: "var(--muted-foreground)",
    };
    const inferredMemoryOperation = (memory: MemoryRow) =>
      memory.type === "project"
        ? "resume"
        : memory.type === "preference"
          ? "timeline"
          : memory.type === "handoff"
            ? "handoff"
            : memory.type === "insights"
              ? "insights"
              : "process";
    const liveOperations = Array.from(
      new Set([
        ...visibleEvents.map((event) => operationForEvent(event)),
        ...visibleMemories.map((memory) => inferredMemoryOperation(memory)),
      ]),
    );
    const operationNodes = liveOperations.map((operation, index) => ({
      operation,
      x: 360,
      y:
        liveOperations.length === 1
          ? 285
          : 120 +
            index * Math.min(92, 360 / Math.max(1, liveOperations.length - 1)),
      color: operationColors[operation] ?? operationColors.other,
    }));
    const operationNodeByName = new Map(
      operationNodes.map((node) => [node.operation, node]),
    );

    visibleEvents.forEach((event, index) => {
      const operation = operationForEvent(event);
      const y = 105 + (index % 6) * 76;
      const x = 92 + Math.floor(index / 6) * 82;
      const nodeId = `session-${event.id}`;
      const operationNodeId = `operation-${operation}`;
      const operationNodeExists = operationNodeByName.has(operation);

      nodes.push({
        id: nodeId,
        eventId: event.id,
        x,
        y,
        r: event.status === "Success" ? 8 : 9,
        label: `${event.method} ${operation}`,
        detail: `${event.status} ${event.statusCode} | ${event.latencyMs}ms | ${shortTime(event.createdAt)}`,
        color: event.status === "Success" ? "var(--color-primary)" : "var(--destructive)",
        kind: "session",
        group: "Live sessions",
      });

      if (operationNodeExists) {
        edges.push({
          id: `${nodeId}-${operationNodeId}`,
          from: nodeId,
          to: operationNodeId,
          label: operation,
          detail: `${event.method} ${event.route} triggered the ${operation} memory operation.`,
          color: event.status === "Success" ? "var(--color-primary)" : "var(--destructive)",
          opacity: 0.85,
        });
      }
    });

    operationNodes.forEach(({ operation, x, y, color }) => {
      nodes.push({
        id: `operation-${operation}`,
        x,
        y,
        r: 14,
        label: operation,
        detail: operationCopy(operation),
        color,
        kind: "operation",
        group: "Memory operations",
      });
    });

    visibleMemories.forEach((memory, memoryIndex) => {
      const color = colorForMemory(memory);
      const memoryNodeId = `memory-${memory.id}`;
      const x = 580;
      const y = 80 + memoryIndex * 45;

      nodes.push({
        id: memoryNodeId,
        memoryId: memory.id,
        x,
        y,
        r:
          8 +
          Math.min(
            8,
            Math.max(
              0,
              memory.confidence <= 1
                ? memory.confidence * 8
                : memory.confidence / 14,
            ),
          ),
        label: compactLabel(
          memory.summary || memory.content,
          memory.type || "memory",
        ),
        detail: `${memory.type || "memory"} | ${memory.status || "active"} | confidence ${memory.confidence <= 1 ? memory.confidence.toFixed(2) : `${Math.round(memory.confidence)}%`}`,
        color,
        kind: "memory",
        group: memory.type || "Memory facts",
      });

      const primaryOperation = inferredMemoryOperation(memory);

      if (operationNodeByName.has(primaryOperation)) {
        edges.push({
          id: `operation-${primaryOperation}-${memoryNodeId}`,
          from: `operation-${primaryOperation}`,
          to: memoryNodeId,
          label:
            (primaryOperation as string) === "process"
              ? "creates"
              : (primaryOperation as string) === "retrieve"
                ? "recalls"
                : (primaryOperation as string) === "resume"
                  ? "derives"
                  : "packages",
          detail: `${operationCopy(primaryOperation)} This edge explains why "${compactLabel(memory.summary || memory.content, memory.type)}" appears in the graph.`,
          color,
          opacity: 0.42,
        });
      }

      visibleMemories.slice(0, memoryIndex).forEach((other) => {
        if (other.type === memory.type || other.status === memory.status) {
          edges.push({
            id: `similar-${other.id}-${memory.id}`,
            from: `memory-${other.id}`,
            to: memoryNodeId,
            label: other.type === memory.type ? "extends" : "updates",
            detail: `These memories are connected because they share ${other.type === memory.type ? `type "${memory.type}"` : `status "${memory.status}"`}.`,
            color,
            opacity: 0.18,
          });
        }
      });
    });

    // Generate Developer Coding Agent nodes
    const agentNodes = [
      { id: "agent-copilot", label: "IDE Copilot", y: 180, color: "var(--destructive)" },
      { id: "agent-autopilot", label: "Autopilot", y: 280, color: "var(--destructive)" },
      { id: "agent-cli", label: "CLI Agent", y: 380, color: "var(--destructive)" },
    ];

    agentNodes.forEach((agent) => {
      nodes.push({
        id: agent.id,
        x: 880,
        y: agent.y,
        r: 10,
        label: agent.label,
        detail: `The ${agent.label} agent retrieving stored context in real-time.`,
        color: agent.color,
        kind: "agent",
        group: "Live Agents",
      });
    });

    // Generate edges from memories to agents to simulate live data passing
    visibleMemories.forEach((memory, idx) => {
      const targetAgent = agentNodes[idx % agentNodes.length];
      edges.push({
        id: `retrieve-${memory.id}-${targetAgent.id}`,
        from: `memory-${memory.id}`,
        to: targetAgent.id,
        label: "retrieves",
        detail: `${targetAgent.label} queries memory for real-time developer context.`,
        color: targetAgent.color,
        opacity: 0.9,
      });
    });

    return { nodes, edges };
  }, [memories, requestEvents]);

  const handleExploreGraph = useCallback((memory: MemoryRow) => {
    const node = memoryGraph.nodes.find((n) => n.memoryId === memory.id);
    if (node) {
      setSelectedGraphItem({ kind: "node", id: node.id });
      document
        .getElementById("memory-brain-map")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [memoryGraph.nodes]);

  const selectedGraphNode =
    selectedGraphItem?.kind === "node"
      ? memoryGraph.nodes.find((node) => node.id === selectedGraphItem.id)
      : null;
  const selectedGraphEdge =
    selectedGraphItem?.kind === "edge"
      ? memoryGraph.edges.find((edge) => edge.id === selectedGraphItem.id)
      : null;
  const selectedGraphMemory = selectedGraphNode?.memoryId
    ? (memories.find((memory) => memory.id === selectedGraphNode.memoryId) ??
      null)
    : null;

  const graphAwareStats = useMemo(() => {
    return memoryStats.map(([label, value]) => {
      if (label === "Memories") {
        return [label, `${memories.length}`] as [string, string];
      }
      if (label === "Connections") {
        return [label, `${memoryGraph.edges.length}`] as [string, string];
      }
      return [label, value] as [string, string];
    });
  }, [memories.length, memoryGraph.edges.length, memoryStats]);

  // ─── Live vault metrics (derived from real memories, not hard-coded) ───────
  const vaultStats = useMemo(() => {
    const total = memories.length;
    const cleanupCount = memories.filter(
      (m) =>
        m.status === "needs_review" ||
        (Number.isFinite(m.confidence) && m.confidence < 0.4),
    ).length;
    const conflictCount = memories.filter(
      (m) => m.status === "conflict",
    ).length;
    const avgConfidence =
      total === 0
        ? 0
        : memories.reduce(
            (sum, m) =>
              sum +
              (Number.isFinite(m.confidence)
                ? Math.min(
                    1,
                    Math.max(
                      0,
                      m.confidence > 1 ? m.confidence / 100 : m.confidence,
                    ),
                  )
                : 0),
            0,
          ) / total;
    const health = Math.round(avgConfidence * 100);
    const episodicCount = memories.filter((m) => m.type === "episodic").length;
    const noiseRatio = total === 0 ? 0 : episodicCount / total;
    const impactScore = Math.round(
      Math.max(0, Math.min(1, avgConfidence * (1 - noiseRatio * 0.4))) * 100,
    );
    return {
      total,
      cleanupCount,
      conflictCount,
      health,
      impactScore,
      episodicCount,
    };
  }, [memories]);

  const memoryTypeLegend = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of memories) {
      const t = (m.type || "other").trim() || "other";
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        color: accentForMemoryType(type),
        icon: iconForMemoryType(type),
      }));
  }, [memories]);

  // ─── Live Memory Doctor side-panel summary (derived from autopilotResult) ──
  const doctorPanelSummary = useMemo(() => {
    const issues = Array.isArray(autopilotResult?.issues)
      ? (autopilotResult!.issues as Array<Record<string, unknown>>)
      : [];
    const critical = issues.filter((i) => i.severity === "critical");
    const warnings = issues.filter((i) => i.severity === "warning");
    const info = issues.filter((i) => i.severity === "info");
    const suggested = Array.isArray(autopilotResult?.suggestedActions)
      ? (autopilotResult!.suggestedActions as Array<Record<string, unknown>>)
      : [];
    return {
      issues,
      critical,
      warnings,
      info,
      suggested,
      hasResult: !!autopilotResult,
    };
  }, [autopilotResult]);

  function formatConfidence(value: number) {
    if (!Number.isFinite(value)) return "-";
    return value <= 1 ? value.toFixed(2) : `${Math.round(value)}%`;
  }

  function formatDate(value: string) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
  }
  return (
    <div className="pb-12 text-foreground">
      {/* SECTION 1: Top Header */}
      <div className="relative overflow-hidden border-b border-transparent bg-background px-6 py-8">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-foreground shadow-black/50 drop-shadow-sm">
              Memory Intelligence Vault
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenTagFilter}
              className="rounded-none border border-transparent bg-background px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-border shadow-none"
            >
              {selectedMemoryTags.length > 0
                ? `TAGS: ${selectedMemoryTags.join(", ").toUpperCase()}`
                : "ALL TAGS"}
            </button>
            <div className="rounded-none border border-transparent bg-background px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground shadow-none">
              WORKSPACE: {workspaceName.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-8 max-w-[1440px]">
        {/* SECTION 2: Top Metrics — derived from real memories */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.28 }}
            whileHover={{ scale: 1.016 }}
            className="group relative overflow-hidden rounded-none border border-transparent bg-background p-5 shadow-none border-t-2 border-t-primary hover:bg-card transition-colors"
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] transition group-hover:opacity-[0.14]"
              accent="var(--color-primary)"
              density={0.44}
            />
            <p className="relative text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Memory Health
            </p>
            <div className="relative flex items-baseline gap-2">
              <span className="text-[32px] font-bold tracking-tight">
                {vaultStats.total === 0 ? (
                  "—"
                ) : (
                  <>
                    <CountUp to={vaultStats.health} />%
                  </>
                )}
              </span>
              <span
                className={`text-[12px] font-medium ${vaultStats.health >= 70 ? "text-primary" : vaultStats.health >= 40 ? "text-muted-foreground" : "text-destructive"}`}
              >
                {vaultStats.total === 0 ? "no data" : "avg confidence"}
              </span>
            </div>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.28 }}
            whileHover={{ scale: 1.016 }}
            className="group relative overflow-hidden rounded-none border border-transparent bg-background p-5 shadow-none border-t-2 border-t-primary hover:bg-card transition-colors"
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] transition group-hover:opacity-[0.14]"
              accent="var(--color-primary)"
              density={0.44}
            />
            <p className="relative text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Impact Score
            </p>
            <div className="relative flex items-baseline gap-2">
              <span className="text-[32px] font-bold tracking-tight">
                {vaultStats.total === 0 ? (
                  "—"
                ) : (
                  <>
                    <CountUp to={vaultStats.impactScore} />%
                  </>
                )}
              </span>
              <span className="text-[12px] font-medium text-muted-foreground">
                {vaultStats.total} memor{vaultStats.total === 1 ? "y" : "ies"}
              </span>
            </div>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.28 }}
            whileHover={{ scale: 1.016 }}
            className="group relative overflow-hidden rounded-none border border-transparent bg-background p-5 shadow-none border-t-2 border-t-muted-foreground hover:bg-card transition-colors"
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] transition group-hover:opacity-[0.14]"
              accent="var(--muted-foreground)"
              density={0.44}
            />
            <p className="relative text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Cleanup Needed
            </p>
            <div className="relative flex items-baseline gap-2">
              <span className="text-[32px] font-bold tracking-tight">
                <CountUp to={vaultStats.cleanupCount} />
              </span>
              <span
                className={`text-[12px] font-medium ${vaultStats.cleanupCount === 0 ? "text-primary" : "text-muted-foreground"}`}
              >
                {vaultStats.cleanupCount === 0 ? "all healthy" : "noisy nodes"}
              </span>
            </div>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.28 }}
            whileHover={{ scale: 1.016 }}
            className="group relative overflow-hidden rounded-none border border-transparent bg-background p-5 shadow-none border-t-2 border-t-destructive hover:bg-card transition-colors"
          >
            
            <p className="relative text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Conflicts
            </p>
            <div className="relative flex items-baseline gap-2">
              <span className="text-[32px] font-bold tracking-tight">
                <CountUp to={vaultStats.conflictCount} />
              </span>
              <span
                className={`text-[12px] font-medium ${vaultStats.conflictCount === 0 ? "text-primary" : "text-destructive"}`}
              >
                {vaultStats.conflictCount === 0 ? "all clear" : "needs review"}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* SECTION 3: Graph */}
        <div className="grid gap-6">
          <div
            id="memory-brain-map"
            className="relative rounded-none border border-transparent bg-background overflow-hidden flex flex-col min-h-[500px]"
          >
           
            <div className="px-5 py-4 border-b border-transparent bg-background flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-foreground flex items-center gap-3 shrink-0">
                  Live Brain Map
                  
                </h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  {graphAwareStats.map(([label, value]) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/20 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground"
                    >
                      <span className="text-foreground/35">{label}</span>
                      <span className="font-bold text-foreground/90">{value}</span>
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleLegend}
                className="inline-flex items-center gap-2 shrink-0 rounded-none border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-ring hover:text-foreground"
              >
                <Icon name="dither" className="h-3.5 w-3.5 opacity-80" />
                {memoryLegendExpanded ? "Hide legend" : "Legend"}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {memoryLegendExpanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE_OUT }}
                  className="overflow-hidden border-b border-border bg-background"
                >
                  <div className="px-5 py-4 grid gap-5 md:grid-cols-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/35 mb-2.5">
                        Memory types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {memoryTypeLegend.length === 0 ? (
                          <span className="text-[11px] text-foreground/35">
                            No types yet
                          </span>
                        ) : (
                          memoryTypeLegend.map((entry) => (
                            <span
                              key={entry.type}
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] text-muted-foreground"
                            >
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                              />
                              <Icon
                                name={entry.icon}
                                className="h-3 w-3 shrink-0 text-muted-foreground"
                              />
                              <span className="font-mono uppercase tracking-tighter">
                                {entry.type}
                              </span>
                              <span className="text-muted-foreground tabular-nums">
                                ×{entry.count}
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/35 mb-2.5">
                        Edge relations
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {memoryRelations.map((rel) => (
                          <span
                            key={rel.label}
                            className="inline-flex items-center gap-1.5 text-[10px] text-foreground/75"
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${rel.tone}`}
                            />
                            {rel.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/35 mb-2.5">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {memoryStatuses.map((st) => (
                          <span
                            key={st.label}
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${st.tone}`}
                          >
                            {st.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <div className="relative flex-1 bg-white overflow-hidden shadow-none group min-h-[520px]">
              {hasGraphData ? (
                <LiveBrainMapDitherCanvas
                  graph={memoryGraph}
                  selectedItem={selectedGraphItem}
                  onSelectNode={(id) => setSelectedGraphItem({ kind: "node", id })}
                  onSelectEdge={(id) => setSelectedGraphItem({ kind: "edge", id })}
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <p className="text-muted-foreground text-[13px] font-medium">
                    No graph data yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: Smart Filters */}
        <div className="flex flex-wrap gap-2 py-2">
          {[
            { label: "All", icon: "vault" as const },
            { label: "Projects", icon: "graph" as const },
            { label: "Goals", icon: "timeline" as const },
            { label: "Tasks", icon: "agent" as const },
            { label: "Decisions", icon: "handoff" as const },
            { label: "Preferences", icon: "memory" as const },
            { label: "Constraints", icon: "vault" as const },
            { label: "Risks", icon: "handoff" as const },
            { label: "Handoffs", icon: "handoff" as const },
            { label: "Low Confidence", icon: "memory" as const },
            { label: "Needs Cleanup", icon: "graph" as const },
            { label: "Conflicts", icon: "timeline" as const },
          ].map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-colors ${label === activeFilter ? "border-ring/50 bg-muted text-foreground" : "border-transparent bg-background text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Icon name={icon} className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* SECTION 5: Cards & Doctor */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 self-start">
            {filteredMemories.length > 0 ? (
              filteredMemories.map((memory, index) => (
                <motion.article
                  key={memory.id}
                  initial={{ opacity: 0, y: 14, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.26,
                    delay: Math.min(index * 0.04, 0.22),
                  }}
                  className="relative overflow-hidden rounded-none border border-transparent bg-background shadow-none group hover:border-border transition-colors"
                >
                  
                  <div
                    className={`absolute top-0 left-0 w-full h-[2px] ${
                      memory.type === "project"
                        ? "bg-primary"
                        : memory.type === "problem"
                          ? "bg-destructive"
                          : memory.type === "task"
                            ? "bg-primary"
                            : memory.type === "preference"
                              ? "bg-muted"
                              : memory.type === "episodic"
                                ? "bg-primary"
                                : "bg-muted"
                    }`}
                  />
                  <div className="px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                              memory.type === "project"
                                ? "border-primary/30 bg-primary/15 text-primary"
                                : memory.type === "problem"
                                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                                  : memory.type === "task"
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : memory.type === "preference"
                                      ? "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                                      : memory.type === "episodic"
                                        ? "border-primary/30 bg-primary/10 text-primary"
                                        : "border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {memory.type || "memory"}
                          </span>
                          <span className="rounded border border-transparent bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            {memory.status || "active"}
                          </span>
                        </div>
                        {(() => {
                          const displayText = formatMemoryForDisplay(
                            memory.summary || memory.content,
                          );
                          const detailText = formatMemoryForDisplay(memory.content);
                          const showDetail =
                            detailText.length > 0 && detailText !== displayText;
                          return (
                            <>
                              <p className="text-[15px] font-medium leading-relaxed text-foreground">
                                {displayText || "Agent context captured"}
                              </p>
                              {showDetail ? (
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                  {detailText}
                                </p>
                              ) : null}
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-right text-xs text-muted-foreground flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span>Conf</span>
                          <span className="font-bold text-foreground">
                            {formatConfidence(memory.confidence)}
                          </span>
                        </div>
                        <div>{formatDate(memory.updatedAt)}</div>
                      </div>
                    </div>
                    <ExpandedMemoryDetail
                      rawContent={memory.content}
                      rawSummary={memory.summary}
                    />
                  </div>
                  <div className="border-t border-border bg-background px-5 py-2.5 flex items-center justify-between gap-3">
                    <p className="truncate font-mono text-[10px] text-muted-foreground tracking-wider flex-1 min-w-0">
                      ID: {memory.id}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInspect(memory)}
                        title="Open the memory inspector drawer"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border hover:border-ring hover:bg-muted px-2.5 py-1 transition-colors"
                      >
                        Inspect
                      </button>
                      <motion.button
                        type="button"
                        onClick={() => handleExplain(memory)}
                        disabled={explainLoading === memory.id}
                        title="Ask Agent A to explain this memory"
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground border border-primary/20 hover:border-primary/60 hover:bg-primary/10 px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[28px]"
                      >
                        <AnimatePresence>
                          {explainLoading === memory.id ? (
                            <motion.span
                              className="pointer-events-none absolute inset-0 bg-primary/15"
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              exit={{ opacity: 0 }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.85,
                                ease: "linear",
                              }}
                            />
                          ) : null}
                        </AnimatePresence>
                        <span className="relative flex items-center gap-1.5">
                          {explainLoading === memory.id && (
                            <span className="inline-block h-2 w-2 border border-current border-t-transparent rounded-full animate-spin" />
                          )}
                          {explainLoading === memory.id
                            ? "Explaining"
                            : "Explain"}
                        </span>
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handlePromote(memory)}
                        disabled={promoteLoading === memory.id}
                        title="Promote to a structured memory (project / preference / learning / profile)"
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground border border-primary/20 hover:border-primary/60 hover:bg-primary/15 px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[28px]"
                      >
                        <AnimatePresence>
                          {promoteLoading === memory.id ? (
                            <motion.span
                              className="pointer-events-none absolute inset-0 bg-primary/15"
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              exit={{ opacity: 0 }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.85,
                                ease: "linear",
                              }}
                            />
                          ) : null}
                        </AnimatePresence>
                        <span className="relative flex items-center gap-1.5">
                          {promoteLoading === memory.id && (
                            <span className="inline-block h-2 w-2 border border-current border-t-transparent rounded-full animate-spin" />
                          )}
                          {promoteLoading === memory.id ? "Promoting" : "Promote"}
                        </span>
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => handleExploreGraph(memory)}
                        title="Highlight this memory in the brain map"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary border border-transparent hover:border-primary/30 px-2.5 py-1 transition-colors opacity-60 group-hover:opacity-100"
                      >
                        Graph →
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="grid place-items-center py-12 text-center text-muted-foreground">
                <p className="text-[13px] font-medium">
                  No memories match the filter "{activeFilter}".
                </p>
              </div>
            )}
          </div>

          <div className="relative rounded-none border border-border bg-gradient-to-b from-background to-background flex flex-col self-start overflow-hidden sticky top-6 shadow-lg shadow-primary/10">
            
            <div className="px-5 py-4 border-b border-border bg-background/60 flex items-center justify-between">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-primary">
                Memory Doctor
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                  {doctorPanelSummary.hasResult ? "live" : "idle"}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${doctorPanelSummary.hasResult ? "bg-primary animate-pulse" : "bg-muted"}`}
                ></span>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {!doctorPanelSummary.hasResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted px-3 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Episodic
                      </p>
                      <p className="text-[18px] font-bold">
                        {vaultStats.episodicCount}
                      </p>
                    </div>
                    <div className="bg-muted px-3 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        To clean
                      </p>
                      <p
                        className={`text-[18px] font-bold ${vaultStats.cleanupCount > 0 ? "text-muted-foreground" : "text-primary"}`}
                      >
                        {vaultStats.cleanupCount}
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed border-l-2 border-border pl-3">-</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-destructive/10 border-l-2 border-destructive px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-destructive mb-0.5">
                        Critical
                      </p>
                      <p className="text-[16px] font-bold">
                        {doctorPanelSummary.critical.length}
                      </p>
                    </div>
                    <div className="bg-muted/30 border-l-2 border-muted-foreground px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                        Warn
                      </p>
                      <p className="text-[16px] font-bold">
                        {doctorPanelSummary.warnings.length}
                      </p>
                    </div>
                    <div className="bg-muted border-l-2 border-border px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                        Info
                      </p>
                      <p className="text-[16px] font-bold">
                        {doctorPanelSummary.info.length}
                      </p>
                    </div>
                  </div>
                  {doctorPanelSummary.issues.slice(0, 2).map((issue, i) => {
                    const severity = String(issue.severity ?? "info");
                    const color =
                      severity === "critical"
                        ? "var(--destructive)"
                        : severity === "warning"
                          ? "var(--muted-foreground)"
                          : "var(--muted-foreground)";
                    return (
                      <div key={i}>
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                          style={{ color }}
                        >
                          {String(issue.type ?? "issue")}
                        </p>
                        <p
                          className="text-[12px] text-foreground leading-relaxed border-l-2 pl-3"
                          style={{ borderColor: color }}
                        >
                          {String(issue.message ?? "")}
                        </p>
                      </div>
                    );
                  })}
                  {doctorPanelSummary.issues.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setAutopilotResult(autopilotResult)}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors"
                    >
                      View all {doctorPanelSummary.issues.length} issues →
                    </button>
                  )}
                  {doctorPanelSummary.issues.length === 0 && (
                    <p className="text-[12px] text-primary leading-relaxed border-l-2 border-primary pl-3">
                      Memory store looks clean. No issues detected.
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-2.5">
                <button
                  onClick={handleRunAutopilot}
                  disabled={autopilotLoading}
                  className="relative overflow-hidden w-full bg-primary/15 hover:bg-primary/25 text-primary border border-primary/40 hover:border-primary/70 py-3 rounded-none text-[12px] font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AnimatePresence>
                    {autopilotLoading && (
                      <motion.span
                        className="absolute inset-0 bg-primary/15"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        exit={{ opacity: 0 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.9,
                          ease: "linear",
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <Icon name="memory" className="relative h-3.5 w-3.5" />
                  <span className="relative">
                    {autopilotLoading
                      ? "Running Autopilot…"
                      : "Run Memory Autopilot"}
                  </span>
                </button>
                <button
                  onClick={handleCompileRawMemories}
                  disabled={compileLoading}
                  className="relative overflow-hidden w-full bg-muted hover:bg-muted text-foreground hover:text-foreground border border-border hover:border-ring py-3 rounded-none text-[12px] font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AnimatePresence>
                    {compileLoading && (
                      <motion.span
                        className="absolute inset-0 bg-muted"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        exit={{ opacity: 0 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.9,
                          ease: "linear",
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <Icon name="graph" className="relative h-3.5 w-3.5" />
                  <span className="relative">
                    {compileLoading ? "Compiling…" : "Compile Raw Memories"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMemoryTagFilter ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-40 grid place-items-center bg-background/55 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="relative overflow-hidden w-full max-w-[560px] rounded-none border border-transparent bg-background p-7 shadow-2xl shadow-black/40"
            >
              
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                    Filter by Memory Tags
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    Select continuity tags to show in the MemoryOS graph and
                    explorer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCloseTagFilter}
                  className="text-[24px] text-muted-foreground hover:text-foreground transition"
                >
                  ×
                </button>
              </div>

              <div className="relative overflow-hidden mt-6 rounded-none border border-transparent bg-background px-4 py-3 shadow-none">
                <DitherBackground
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] transition group-hover:opacity-[0.14]"
                  accent="var(--color-primary)"
                  density={0.44}
                />
                <input
                  value={memoryTagQuery}
                  onChange={(event) => onTagQueryChange(event.target.value)}
                  placeholder="Search memory tags..."
                  className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="relative overflow-hidden mt-5 min-h-[160px] rounded-none border-transparent bg-background px-4 py-4 shadow-none">
                <DitherBackground
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] transition group-hover:opacity-[0.14]"
                  accent="var(--color-primary)"
                  density={0.44}
                />
                {filteredMemoryTagOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {filteredMemoryTagOptions.map((tag) => {
                      const active = selectedMemoryTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => onToggleTag(tag)}
                          className={`rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition shadow-sm ${
                            active
                              ? "border-primary/35 bg-primary/10 text-primary"
                              : "border-transparent bg-background text-muted-foreground hover:border-border hover:text-foreground"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid h-full min-h-[120px] place-items-center text-[14px] text-muted-foreground">
                    No matching tags found
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-transparent pt-5">
                <p className="text-[13px] text-muted-foreground font-mono uppercase tracking-widest">
                  {selectedMemoryTags.length > 0
                    ? `${selectedMemoryTags.length} tag(s) selected`
                    : "Showing all"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onResetTagFilter}
                    className="rounded-none border border-transparent bg-transparent px-5 py-2 text-[12px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onApplyTagFilter}
                    className="rounded-none bg-primary px-5 py-2 text-[12px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/25"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ─── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3 rounded-none text-[13px] font-medium shadow-xl shadow-black/35 border ${
                toastMessage.type === "success"
                ? "bg-primary text-background border-primary"
                : "bg-destructive text-destructive-foreground border-destructive"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${toastMessage.type === "success" ? "bg-background/40" : "bg-muted"} animate-pulse`}
            ></span>
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss"
              className={`ml-2 text-[16px] leading-none ${toastMessage.type === "success" ? "text-background/70 hover:text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Inspect Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {inspectMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-md"
            onClick={() => setInspectMemory(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="relative overflow-hidden w-full max-w-[540px] bg-gradient-to-b from-background to-background border-l border-border h-full overflow-y-auto shadow-[-20px_0_60px] shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
                        accent="var(--color-primary)"
              density={0.44}
            />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.25, ease: EASE_OUT }}
                className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full animate-pulse"
                    style={{
                      backgroundColor: accentForMemoryType(inspectMemory.type),
                    }}
                  />
                  <h2 className="text-[14px] font-bold text-foreground tracking-tight truncate">
                    Memory Inspector
                  </h2>
                  <Icon
                    name={iconForMemoryType(inspectMemory.type)}
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    title={inspectMemory.type ?? "memory"}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden sm:inline">
                    read-only
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectMemory(null)}
                  aria-label="Close inspector"
                  className="text-muted-foreground hover:text-foreground text-[22px] leading-none shrink-0"
                >
                  ×
                </button>
              </motion.div>
              <motion.div
                className="p-6 space-y-5"
                variants={INSPECT_DRAWER_CONTAINER}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={INSPECT_DRAWER_ITEM}
                  className="grid grid-cols-2 gap-3"
                >
                  {[
                    ["Type", inspectMemory.type ?? "—"],
                    ["Status", inspectMemory.status ?? "—"],
                    ["Confidence", formatConfidence(inspectMemory.confidence)],
                    ["Updated", formatDate(inspectMemory.updatedAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="relative overflow-hidden bg-muted px-3 py-2.5">
                      <DitherBackground
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
                        accent="var(--color-primary)"
                        density={0.44}
                      />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {k}
                      </p>
                      <p className="text-[12px] text-foreground/90 font-mono truncate">
                        {v}
                      </p>
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={INSPECT_DRAWER_ITEM}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    ID
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono break-all">
                    {inspectMemory.id}
                  </p>
                </motion.div>
                {formatMemoryForDisplay(inspectMemory.summary || inspectMemory.content) ? (
                  <motion.div variants={INSPECT_DRAWER_ITEM}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Summary
                    </p>
                    <p className="text-[13px] text-foreground/90 leading-relaxed">
                      {formatMemoryForDisplay(inspectMemory.summary || inspectMemory.content)}
                    </p>
                  </motion.div>
                ) : null}
                {(() => {
                  const body = formatMemoryForDisplay(inspectMemory.content);
                  const headline = formatMemoryForDisplay(inspectMemory.summary);
                  if (!body || body === headline) return null;
                  return (
                    <motion.div variants={INSPECT_DRAWER_ITEM}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Details
                      </p>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">
                        {body}
                      </p>
                    </motion.div>
                  );
                })()}
                <motion.div variants={INSPECT_DRAWER_ITEM}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Raw JSON
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(inspectMemory, null, 2),
                        );
                        showToast("Copied to clipboard", "success");
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors border border-primary/20 hover:border-primary/60 px-2.5 py-1"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <StructuredDataPanel
                    title="Memory JSON"
                    value={inspectMemory}
                    maxHeightClassName="max-h-[300px]"
                    compactChars={2600}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Explain Result Panel ──────────────────────────────────────────── */}
      {explainResult && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-md"
          onClick={() => setExplainResult(null)}
        >
          <div
            className="relative overflow-hidden w-full max-w-[540px] bg-gradient-to-b from-background to-background border-l border-primary/20 h-full overflow-y-auto shadow-[-20px_0_60px] shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
                        accent="var(--color-primary)"
              density={0.44}
            />
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <h2 className="text-[14px] font-bold text-foreground tracking-tight">
                  Memory Explanation
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  agent a
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExplainResult(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground text-[22px] leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ["Summary", explainResult.summary],
                ["Reason", explainResult.reason],
                ["Category", explainResult.category],
                ["Recommendation", explainResult.recommendation],
                ["Confidence", explainResult.confidence],
              ].map(([k, v]) => (
                <div
                  key={String(k)}
                  className="border-l-2 border-primary/30 pl-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    {String(k)}
                  </p>
                  <p className="text-[13px] text-foreground/90 leading-relaxed">
                    {String(v ?? "—")}
                  </p>
                </div>
              ))}
              {!!explainResult.agentError && (
                <div className="border border-muted-foreground/30 bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
                  <p className="font-bold uppercase tracking-widest mb-1 text-[10px]">
                    Agent fallback
                  </p>
                  <p className="font-mono">
                    {String(explainResult.agentError)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Autopilot Result Panel ────────────────────────────────────────── */}
      {autopilotResult && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-md"
          onClick={() => setAutopilotResult(null)}
        >
          <div
            className="relative overflow-hidden w-full max-w-[580px] bg-gradient-to-b from-background to-background border-l border-primary/20 h-full overflow-y-auto shadow-[-20px_0_60px] shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
           
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <h2 className="text-[14px] font-bold text-foreground tracking-tight">
                  Memory Autopilot
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  agent b
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutopilotResult(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground text-[22px] leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {Array.isArray(autopilotResult.issues) &&
              (autopilotResult.issues as Array<Record<string, unknown>>)
                .length > 0 ? (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Issues Found ({(autopilotResult.issues as unknown[]).length}
                    )
                  </p>
                  {(
                    autopilotResult.issues as Array<Record<string, unknown>>
                  ).map((issue, i) => {
                    const severity = String(issue.severity ?? "info");
                    const color =
                      severity === "critical"
                        ? "var(--destructive)"
                        : severity === "warning"
                          ? "var(--muted-foreground)"
                          : "var(--muted-foreground)";
                    return (
                      <div
                        key={i}
                        className="bg-muted border-l-2 pl-4 pr-3 py-3"
                        style={{ borderColor: color }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color }}
                          >
                            {String(issue.type ?? "issue")}
                          </p>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                            {severity}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                          {String(issue.message ?? "")}
                        </p>
                        {issue.action ? (
                          <p className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                            action: {String(issue.action)}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border-l-2 border-primary bg-primary/5 pl-4 py-3 mb-6">
                  <p className="text-[13px] text-primary font-medium">
                    No issues detected — memory store is clean.
                  </p>
                </div>
              )}
              {Array.isArray(autopilotResult.suggestedActions) &&
                (
                  autopilotResult.suggestedActions as Array<
                    Record<string, unknown>
                  >
                ).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Suggested Actions
                    </p>
                    {(
                      autopilotResult.suggestedActions as Array<
                        Record<string, unknown>
                      >
                    ).map((action, i) => (
                      <div
                        key={i}
                        className="relative overflow-hidden flex items-center justify-between bg-muted hover:bg-muted transition-colors px-4 py-3 border border-border"
                      >
                        <DitherBackground
                          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
                          accent="var(--color-primary)"
                          density={0.44}
                        />
                        <span className="text-[13px] text-muted-foreground">
                          {String(action.label ?? "")}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground bg-background px-2 py-0.5">
                          {String(action.count ?? 0)} items
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              {!!autopilotResult.agentError && (
                <div className="mt-6 border border-muted-foreground/30 bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
                  <p className="font-bold uppercase tracking-widest mb-1 text-[10px]">
                    Agent fallback (heuristic mode)
                  </p>
                  <p className="font-mono">
                    {String(autopilotResult.agentError)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Compile Result Panel ──────────────────────────────────────────── */}
      {compileResult && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-md"
          onClick={() => setCompileResult(null)}
        >
          <div
            className="relative overflow-hidden w-full max-w-[580px] bg-gradient-to-b from-background to-background border-l border-primary/20 h-full overflow-y-auto shadow-[-20px_0_60px] shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
              accent="var(--color-primary)"
              density={0.44}
            />
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <h2 className="text-[14px] font-bold text-foreground tracking-tight">
                  Compiled Memories
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  agent b
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCompileResult(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground text-[22px] leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="relative overflow-hidden bg-muted border-t-2 border-primary px-4 py-3 text-center">
                  <DitherBackground
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
                    accent="var(--color-primary)"
                    density={0.44}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Compiled
                  </p>
                  <p className="text-[24px] font-bold text-primary">
                    {Array.isArray(compileResult.compiled)
                      ? (compileResult.compiled as unknown[]).length
                      : 0}
                  </p>
                </div>
                <div className="relative overflow-hidden bg-muted border-t-2 border-muted-foreground px-4 py-3 text-center">
                  <DitherBackground
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
                    accent="var(--muted-foreground)"
                    density={0.44}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Duplicates Removed
                  </p>
                  <p className="text-[24px] font-bold text-muted-foreground">
                    {String(compileResult.removedDuplicates ?? 0)}
                  </p>
                </div>
              </div>
              {Array.isArray(compileResult.compiled) &&
              (compileResult.compiled as Array<Record<string, unknown>>)
                .length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Compiled memories
                  </p>
                  {(
                    compileResult.compiled as Array<Record<string, unknown>>
                  ).map((item, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden border border-border hover:border-border bg-background p-4 transition-colors"
                    >
                      <DitherBackground
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] transition group-hover:opacity-[0.14]"
                        accent="var(--color-primary)"
                        density={0.44}
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <span className="border border-primary/30 bg-primary/15 text-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                          {String(item.type ?? "memory")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          conf{" "}
                          {typeof item.confidence === "number"
                            ? item.confidence.toFixed(2)
                            : "—"}
                        </span>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">
                        {String(item.content ?? "")}
                      </p>
                      {Array.isArray(item.mergedFrom) &&
                        (item.mergedFrom as string[]).length > 0 && (
                          <p className="mt-2.5 text-[10px] font-mono text-muted-foreground">
                            merged from {(item.mergedFrom as string[]).length}{" "}
                            raw{" "}
                            {(item.mergedFrom as string[]).length === 1
                              ? "memory"
                              : "memories"}
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-l-2 border-border bg-muted pl-4 py-3">
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Nothing to compile right now — there are no episodic or
                    low-confidence memories to merge.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

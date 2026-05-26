/* eslint-disable react/no-unescaped-entities */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
            maxHeightClassName="max-h-72"
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
  memoryTagQuery,
  filteredMemoryTagOptions,
  memories,
  isLoading = false,
  errorMessage = null,
  onOpenTagFilter,
  onCloseTagFilter,
  onApplyTagFilter,
  onResetTagFilter,
  onTagQueryChange,
  onToggleTag,
}: MemoriesSectionProps) {
  const hasMemories = memories.length > 0;
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

  const memoryRegistryFilters = useMemo(() => {
    const options = [
      { label: "All", icon: "vault" as const, matches: (_memory: MemoryRow) => true },
      { label: "Projects", icon: "graph" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "project" },
      { label: "Goals", icon: "timeline" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "goal" },
      { label: "Tasks", icon: "agent" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "task" },
      { label: "Decisions", icon: "handoff" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "decision" },
      { label: "Preferences", icon: "memory" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "preference" },
      { label: "Constraints", icon: "vault" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "constraint" },
      { label: "Risks", icon: "handoff" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "risk" || memory.type?.toLowerCase() === "problem" },
      { label: "Handoffs", icon: "handoff" as const, matches: (memory: MemoryRow) => memory.type?.toLowerCase() === "handoff" },
      { label: "Low Confidence", icon: "memory" as const, matches: (memory: MemoryRow) => memory.confidence < 0.6 },
      {
        label: "Needs Cleanup",
        icon: "graph" as const,
        matches: (memory: MemoryRow) =>
          memory.status === "needs_review" || memory.confidence < 0.4,
      },
      { label: "Conflicts", icon: "timeline" as const, matches: (memory: MemoryRow) => memory.status === "conflict" },
    ];

    return options.map((option) => ({
      ...option,
      count: memories.filter(option.matches).length,
    }));
  }, [memories]);

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
    return `${Math.round((value <= 1 ? value : value / 100) * 100)}%`;
  }

  function confidenceLabel(value: number) {
    if (!Number.isFinite(value)) return "Review needed";
    const normalized = value <= 1 ? value : value / 100;
    if (normalized >= 0.9) return "High trust";
    if (normalized >= 0.72) return "Useful signal";
    return "Needs review";
  }

  function memoryKindLabel(type: string | undefined) {
    const normalized = (type || "").toLowerCase();
    if (normalized === "project") return "Project fact";
    if (normalized === "problem") return "Risk / blocker";
    if (normalized === "task") return "Next task";
    if (normalized === "preference") return "Preference";
    if (normalized === "handoff") return "Handoff";
    if (normalized === "episodic") return "Session memory";
    if (normalized === "insights") return "Insight";
    return "Reusable context";
  }

  function formatDate(value: string) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
  }

  function cleanMemoryPreview(value: string, maxLength = 240) {
    const formatted = formatMemoryForDisplay(value || "");
    const withoutTechnicalNoise = formatted
      .replace(/generated_at:\s*\S+/gi, " ")
      .replace(/schema:\s*memoryos\.[\w.-]+/gi, " ")
      .replace(/workspace:\s*MemoryOS/gi, " ")
      .replace(/COMPANY_BRAIN_SKILLS/gi, " ")
      .replace(/agent_chat_meta/gi, " ")
      .replace(/\/SDK|SDK\s*\//gi, " ")
      .replace(/##\s*(Summary|Constraints|Runbooks|Open Risks|Recent Signals|Operating Model)\s*-?/gi, ". ")
      .replace(/\b(query|User|Assistant|Owner|Deadline|purpose):\s*/gi, "")
      .replace(/\s*-\s*/g, " - ")
      .replace(/\s+/g, " ")
      .trim();

    const candidates = withoutTechnicalNoise
      .split(/(?:\.\s+|\s##\s|\s;\s)/)
      .map((part) => part.trim())
      .filter((part) => part.length > 12)
      .filter((part) => !/^(none captured yet|not available yet)$/i.test(part));

    const unique: string[] = [];
    for (const candidate of candidates) {
      const normalized = candidate.toLowerCase();
      if (!unique.some((item) => normalized.includes(item.toLowerCase()) || item.toLowerCase().includes(normalized))) {
        unique.push(candidate);
      }
      if (unique.join(". ").length >= maxLength) break;
    }

    const preview = (unique.length > 0 ? unique.join(". ") : withoutTechnicalNoise)
      .replace(/\s+/g, " ")
      .trim();

    if (preview.length <= maxLength) return preview;
    return `${preview.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
  }

  function buildMemorySummary(memory: MemoryRow) {
    return (
      cleanMemoryPreview(memory.summary || memory.content, 220) ||
      "Agent context captured for future retrieval."
    );
  }

  function buildMemorySupportingLine(memory: MemoryRow, summary: string) {
    const supporting = cleanMemoryPreview(memory.content, 180);
    if (!supporting || supporting === summary || summary.includes(supporting)) {
      return "";
    }
    return supporting;
  }
  return (
    <div className="pb-12 text-foreground">
      {/* SECTION 1: Top Header */}
      <div className="relative overflow-hidden border-b border-border bg-background px-6 py-8">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Company memory control plane
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Memory Intelligence Vault
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Review the shared memory graph your AI agents rely on: project facts, decisions, handoffs, risks, preferences, and cleanup signals for engineering teams.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl space-y-8 px-6">
        <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
          {[
            {
              label: "Agent continuity",
              value: "retrieval-ready",
              detail: "Memories here are used before agent calls to prevent restart-from-zero behavior.",
            },
            {
              label: "Governance surface",
              value: "explainable",
              detail: "Inspect, explain, promote, and clean memory nodes before they affect future work.",
            },
            {
              label: "Team graph",
              value: `${vaultStats.total} nodes`,
              detail: "One shared project memory base for developers, operators, and engineering leaders.",
            },
          ].map((item) => (
            <div key={item.label} className="bg-card px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </p>
                <span className="border border-border bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                  {item.value}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground">{item.detail}</p>
            </div>
          ))}
        </div>

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
            className="group relative overflow-hidden rounded-none border border-border bg-card p-5 border-t-2 border-t-primary transition-colors hover:bg-muted/30"
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10 transition group-hover:opacity-15"
              accent="var(--color-primary)"
              density={0.44}
            />
            <p className="relative text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Trust Health
            </p>
            <div className="relative flex flex-col gap-0.5">
              <span className="text-3xl font-bold leading-none tracking-tight tabular-nums">
                {vaultStats.total === 0 ? (
                  "—"
                ) : (
                  <>
                    <CountUp to={vaultStats.health} />%
                  </>
                )}
              </span>
              <span
                className={`text-xs font-medium ${vaultStats.health >= 70 ? "text-primary" : vaultStats.health >= 40 ? "text-muted-foreground" : "text-destructive"}`}
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
            className="group relative overflow-hidden rounded-none border border-border bg-card p-5 border-t-2 border-t-primary transition-colors hover:bg-muted/30"
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10 transition group-hover:opacity-15"
              accent="var(--color-primary)"
              density={0.44}
            />
            <p className="relative text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Usable Memory
            </p>
            <div className="relative flex flex-col gap-0.5">
              <span className="text-3xl font-bold leading-none tracking-tight tabular-nums">
                {vaultStats.total === 0 ? (
                  "—"
                ) : (
                  <>
                    <CountUp to={vaultStats.impactScore} />%
                  </>
                )}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
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
            className="group relative overflow-hidden rounded-none border border-border bg-card p-5 border-t-2 border-t-muted-foreground transition-colors hover:bg-muted/30"
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10 transition group-hover:opacity-15"
              accent="var(--muted-foreground)"
              density={0.44}
            />
            <p className="relative text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Cleanup Queue
            </p>
            <div className="relative flex flex-col gap-0.5">
              <span className="text-3xl font-bold leading-none tracking-tight tabular-nums">
                <CountUp to={vaultStats.cleanupCount} />
              </span>
              <span
                className={`text-xs font-medium ${vaultStats.cleanupCount === 0 ? "text-primary" : "text-muted-foreground"}`}
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
            className="group relative overflow-hidden rounded-none border border-border bg-card p-5 border-t-2 border-t-destructive transition-colors hover:bg-muted/30"
          >
            
            <p className="relative text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Conflict Risk
            </p>
            <div className="relative flex flex-col gap-0.5">
              <span className="text-3xl font-bold leading-none tracking-tight tabular-nums">
                <CountUp to={vaultStats.conflictCount} />
              </span>
              <span
                className={`text-xs font-medium ${vaultStats.conflictCount === 0 ? "text-primary" : "text-destructive"}`}
              >
                {vaultStats.conflictCount === 0 ? "all clear" : "needs review"}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* SECTION 3: Smart Filters */}
        <div className="space-y-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Memory registry
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter the company graph by operational memory type.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenTagFilter}
                className="border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition hover:border-ring hover:text-foreground"
              >
                {selectedMemoryTags.length > 0
                  ? `${selectedMemoryTags.length} tag${selectedMemoryTags.length === 1 ? "" : "s"} active`
                  : "All tags"}
              </button>
              <span className="border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                showing {filteredMemories.length} / {memories.length}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {memoryRegistryFilters.map(({ label, icon, count }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              disabled={count === 0 && label !== "All"}
              className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${label === activeFilter ? "border-border bg-muted text-foreground" : "border-transparent bg-background text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"}`}
            >
              <Icon name={icon} className="h-3 w-3" />
              {label}
              <span className="ml-1 border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {count}
              </span>
            </button>
          ))}
          </div>
        </div>

        {/* SECTION 5: Cards & Doctor */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <div className="grid min-w-0 gap-4">
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
                  className="relative overflow-hidden rounded-none border border-border bg-card group transition-colors hover:bg-muted/20"
                >
                  
                  <div
                    className={`absolute top-0 left-0 w-full h-0.5 ${
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
                            className={`border px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${
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
                          <span className="border border-border bg-muted px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {memory.status || "active"}
                          </span>
                        </div>
                        {(() => {
                          const displayText = buildMemorySummary(memory);
                          const detailText = buildMemorySupportingLine(
                            memory,
                            displayText,
                          );
                          return (
                            <>
                              <p className="text-base font-semibold leading-relaxed text-foreground">
                                {displayText || "Agent context captured"}
                              </p>
                              {detailText ? (
                                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                  {detailText}
                                </p>
                              ) : null}
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="border border-border bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  {memoryKindLabel(memory.type)}
                                </span>
                                <span className="border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                                  {confidenceLabel(memory.confidence)}
                                </span>
                                <span className="border border-border bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Used by retrieval
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-right text-xs text-muted-foreground flex flex-col items-end gap-1 shrink-0">
                        <span className="border border-border bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
                          {formatConfidence(memory.confidence)} match
                        </span>
                        <div className="max-w-32 text-muted-foreground">
                          Updated {formatDate(memory.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <ExpandedMemoryDetail
                      rawContent={memory.content}
                      rawSummary={memory.summary}
                    />
                  </div>
                  <div className="border-t border-border bg-background px-5 py-2.5 flex items-center justify-between gap-3">
                    <p className="truncate text-xs text-muted-foreground flex-1 min-w-0">
                      <span className="font-semibold uppercase tracking-widest">
                        Source
                      </span>{" "}
                      <span>MemoryOS graph node</span>
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInspect(memory)}
                        title="Open the memory inspector drawer"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border hover:border-ring hover:bg-muted px-2.5 py-1 transition-colors"
                      >
                        Inspect
                      </button>
                      <motion.button
                        type="button"
                        onClick={() => handleExplain(memory)}
                        disabled={explainLoading === memory.id}
                        title="Ask Agent A to explain this memory"
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground border border-primary/20 hover:border-primary/60 hover:bg-primary/10 px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-7"
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
                        className="relative overflow-hidden text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground border border-primary/20 hover:border-primary/60 hover:bg-primary/15 px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-7"
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
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="grid place-items-center py-12 text-center text-muted-foreground">
                <p className="text-sm font-medium">
                  No memories match the filter "{activeFilter}".
                </p>
              </div>
            )}
          </div>

          <div className="relative flex min-w-0 w-full flex-col overflow-hidden rounded-none border border-border bg-card lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Governance inspector
                </p>
                <h2 className="mt-1 text-sm font-bold uppercase tracking-widest text-primary">
                  Memory Doctor
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review memory quality before agents reuse context.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 border border-border bg-muted px-2.5 py-1.5">
                <span
                  className={`h-2 w-2 shrink-0 ${doctorPanelSummary.hasResult ? "animate-pulse bg-primary" : "bg-muted-foreground/40"}`}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {doctorPanelSummary.hasResult ? "live" : "idle"}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-5 px-5 py-5">
              {!doctorPanelSummary.hasResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border">
                    <div className="flex items-center justify-between bg-background px-3 py-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Episodic noise
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          session memories to compress
                        </p>
                      </div>
                      <p className="text-2xl font-bold leading-none tabular-nums">
                        {vaultStats.episodicCount}
                      </p>
                    </div>
                    <div className="flex items-center justify-between bg-background px-3 py-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Review queue
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          low-confidence / stale nodes
                        </p>
                      </div>
                      <p
                        className={`text-2xl font-bold leading-none tabular-nums ${vaultStats.cleanupCount > 0 ? "text-muted-foreground" : "text-primary"}`}
                      >
                        {vaultStats.cleanupCount}
                      </p>
                    </div>
                  </div>
                  <div className="border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Recommended workflow
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-foreground">
                      Run review, fix risky nodes, then compile a memory contract for the next agent handoff.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex min-h-[3.25rem] flex-col justify-between border border-destructive/30 bg-destructive/10 px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">
                        Critical
                      </p>
                      <p className="text-base font-bold leading-none tabular-nums">
                        {doctorPanelSummary.critical.length}
                      </p>
                    </div>
                    <div className="flex min-h-[3.25rem] flex-col justify-between border border-border bg-muted/30 px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Warn
                      </p>
                      <p className="text-base font-bold leading-none tabular-nums">
                        {doctorPanelSummary.warnings.length}
                      </p>
                    </div>
                    <div className="flex min-h-[3.25rem] flex-col justify-between border border-border bg-muted px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Info
                      </p>
                      <p className="text-base font-bold leading-none tabular-nums">
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
                          className="text-xs font-bold uppercase tracking-widest mb-1.5"
                          style={{ color }}
                        >
                          {String(issue.type ?? "issue")}
                        </p>
                        <p
                          className="text-xs text-foreground leading-relaxed border-l-2 pl-3"
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
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors"
                    >
                      View all {doctorPanelSummary.issues.length} issues →
                    </button>
                  )}
                  {doctorPanelSummary.issues.length === 0 && (
                    <p className="text-xs text-primary leading-relaxed border-l-2 border-primary pl-3">
                      Memory store looks clean. No issues detected.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-auto space-y-2 border-t border-border pt-4">
                <button
                  onClick={handleRunAutopilot}
                  disabled={autopilotLoading}
                  className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-none border border-primary/40 bg-primary/10 px-4 py-3 text-left transition hover:border-primary/70 hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-40"
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
                  <span className="relative flex items-center gap-3">
                    <Icon name="memory" className="h-3.5 w-3.5 text-primary" />
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-primary">
                        {autopilotLoading ? "Running Review…" : "Run Memory Review"}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Detect conflicts, noise, stale context
                      </span>
                    </span>
                  </span>
                  <span className="relative text-xs font-bold text-primary">→</span>
                </button>
                <button
                  onClick={handleCompileRawMemories}
                  disabled={compileLoading}
                  className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-none border border-border bg-muted/40 px-4 py-3 text-left transition hover:border-ring hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
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
                  <span className="relative flex items-center gap-3">
                    <Icon name="graph" className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-foreground">
                        {compileLoading ? "Compiling…" : "Compile Memory Contract"}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Package trusted context for agents
                      </span>
                    </span>
                  </span>
                  <span className="relative text-xs font-bold text-muted-foreground">→</span>
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
              className="relative overflow-hidden w-full max-w-xl rounded-none border border-transparent bg-background p-7"
            >
              
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Filter by Memory Tags
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Select continuity tags to show in the MemoryOS graph and
                    explorer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCloseTagFilter}
                  className="text-2xl text-muted-foreground hover:text-foreground transition"
                >
                  ×
                </button>
              </div>

              <div className="relative overflow-hidden mt-6 rounded-none border border-transparent bg-background px-4 py-3">
                <DitherBackground
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-10 transition group-hover:opacity-15"
                  accent="var(--color-primary)"
                  density={0.44}
                />
                <input
                  value={memoryTagQuery}
                  onChange={(event) => onTagQueryChange(event.target.value)}
                  placeholder="Search memory tags..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="relative overflow-hidden mt-5 min-h-40 rounded-none border-transparent bg-background px-4 py-4">
                <DitherBackground
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-10 transition group-hover:opacity-15"
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
                          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
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
                  <div className="grid h-full min-h-32 place-items-center text-sm text-muted-foreground">
                    No matching tags found
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-transparent pt-5">
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
                  {selectedMemoryTags.length > 0
                    ? `${selectedMemoryTags.length} tag(s) selected`
                    : "Showing all"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onResetTagFilter}
                    className="rounded-none border border-transparent bg-transparent px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onApplyTagFilter}
                    className="rounded-none bg-primary px-5 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition"
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
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-none text-sm font-medium border ${
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
              className={`ml-2 text-base leading-none ${toastMessage.type === "success" ? "text-background/70 hover:text-background" : "text-muted-foreground hover:text-foreground"}`}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md"
            onClick={() => setInspectMemory(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="relative max-h-[min(820px,calc(100vh-2rem))] w-full max-w-3xl overflow-hidden border border-border bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
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
                  <h2 className="text-sm font-bold text-foreground tracking-tight truncate">
                    Memory Inspector
                  </h2>
                  <Icon
                    name={iconForMemoryType(inspectMemory.type)}
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    title={inspectMemory.type ?? "memory"}
                  />
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground hidden sm:inline">
                    read-only
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectMemory(null)}
                  aria-label="Close inspector"
                  className="text-muted-foreground hover:text-foreground text-xl leading-none shrink-0"
                >
                  ×
                </button>
              </motion.div>
              <motion.div
                className="mx-auto max-w-2xl space-y-5 overflow-y-auto px-6 py-6 sm:px-8"
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
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
                        accent="var(--color-primary)"
                        density={0.44}
                      />
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {k}
                      </p>
                      <p className="text-xs text-foreground/90 font-mono truncate">
                        {v}
                      </p>
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={INSPECT_DRAWER_ITEM}>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    ID
                  </p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {inspectMemory.id}
                  </p>
                </motion.div>
                {formatMemoryForDisplay(inspectMemory.summary || inspectMemory.content) ? (
                  <motion.div variants={INSPECT_DRAWER_ITEM}>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Summary
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
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
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Details
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {body}
                      </p>
                    </motion.div>
                  );
                })()}
                <motion.div variants={INSPECT_DRAWER_ITEM}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors border border-primary/20 hover:border-primary/60 px-2.5 py-1"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <StructuredDataPanel
                    title="Memory JSON"
                    value={inspectMemory}
                    maxHeightClassName="max-h-72"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md"
          onClick={() => setExplainResult(null)}
        >
          <div
            className="relative max-h-[min(760px,calc(100vh-2rem))] w-full max-w-3xl overflow-hidden border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
              accent="var(--color-primary)"
              density={0.44}
            />
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <div>
                  <h2 className="text-sm font-bold text-foreground tracking-tight">
                    Memory Explanation
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Shows why this context should or should not be reused by future agents.
                  </p>
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary">
                  agent a
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExplainResult(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mx-auto max-w-2xl space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
              <div className="grid gap-3 border border-border bg-muted/30 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Decision
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize text-foreground">
                    {String(explainResult.recommendation ?? "review")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Memory class
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize text-foreground">
                    {String(explainResult.category ?? "context")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Trust
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {String(explainResult.confidence ?? "review")}
                  </p>
                </div>
              </div>
              {[
                ["Summary", explainResult.summary],
                ["Reason", explainResult.reason],
                [
                  "Team value",
                  "Keeps engineers, reviewers, and follow-up agents aligned on the same project context instead of relying on chat history or memory from the previous session.",
                ],
              ].map(([k, v]) => (
                <div
                  key={String(k)}
                  className="border-l-2 border-primary/30 pl-3"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    {String(k)}
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {String(v ?? "—")}
                  </p>
                </div>
              ))}
              {!!explainResult.agentError && (
                <div className="border border-muted-foreground/30 bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-bold uppercase tracking-widest mb-1 text-xs">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md"
          onClick={() => setAutopilotResult(null)}
        >
          <div
            className="relative max-h-[min(820px,calc(100vh-2rem))] w-full max-w-4xl overflow-hidden border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
           
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <div>
                  <h2 className="text-sm font-bold text-foreground tracking-tight">
                    Memory Autopilot Review
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Finds noisy, stale, or risky memory before engineering agents reuse it.
                  </p>
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary">
                  agent b
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutopilotResult(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mx-auto max-w-3xl overflow-y-auto px-6 py-6 sm:px-8">
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="border border-border bg-muted/30 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Review status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {Array.isArray(autopilotResult.issues) &&
                    (autopilotResult.issues as unknown[]).length > 0
                      ? "Action needed"
                      : "Clean"}
                  </p>
                </div>
                <div className="border border-border bg-muted/30 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Impact
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Retrieval quality
                  </p>
                </div>
                <div className="border border-border bg-muted/30 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Recommended owner
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Engineering ops
                  </p>
                </div>
              </div>
              {Array.isArray(autopilotResult.issues) &&
              (autopilotResult.issues as Array<Record<string, unknown>>)
                .length > 0 ? (
                <div className="space-y-3 mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                            className="text-xs font-bold uppercase tracking-widest"
                            style={{ color }}
                          >
                            {String(issue.type ?? "issue")}
                          </p>
                          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                            {severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {String(issue.message ?? "")}
                        </p>
                        {issue.action ? (
                          <p className="mt-1.5 text-xs font-mono text-muted-foreground">
                            action: {String(issue.action)}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border-l-2 border-primary bg-primary/5 pl-4 py-3 mb-6">
                  <p className="text-sm text-primary font-medium">
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
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                          className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
                          accent="var(--color-primary)"
                          density={0.44}
                        />
                        <span className="text-sm text-muted-foreground">
                          {String(action.label ?? "")}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-0.5">
                          {String(action.count ?? 0)} items
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              {!!autopilotResult.agentError && (
                <div className="mt-6 border border-muted-foreground/30 bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-bold uppercase tracking-widest mb-1 text-xs">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md"
          onClick={() => setCompileResult(null)}
        >
          <div
            className="relative max-h-[min(820px,calc(100vh-2rem))] w-full max-w-4xl overflow-hidden border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <DitherBackground
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
              accent="var(--color-primary)"
              density={0.44}
            />
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <div>
                  <h2 className="text-sm font-bold text-foreground tracking-tight">
                    Memory Contract Compile
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Converts noisy session memory into reusable company context for future agents.
                  </p>
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary">
                  agent b
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCompileResult(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mx-auto max-w-3xl overflow-y-auto px-6 py-6 sm:px-8">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="relative overflow-hidden bg-muted border-t-2 border-primary px-4 py-3 text-center">
                  <DitherBackground
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
                    accent="var(--color-primary)"
                    density={0.44}
                  />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Compiled
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {Array.isArray(compileResult.compiled)
                      ? (compileResult.compiled as unknown[]).length
                      : 0}
                  </p>
                </div>
                <div className="relative overflow-hidden bg-muted border-t-2 border-muted-foreground px-4 py-3 text-center">
                  <DitherBackground
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
                    accent="var(--muted-foreground)"
                    density={0.44}
                  />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Duplicates Removed
                  </p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {String(compileResult.removedDuplicates ?? 0)}
                  </p>
                </div>
              </div>
              {Array.isArray(compileResult.compiled) &&
              (compileResult.compiled as Array<Record<string, unknown>>)
                .length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-10 transition group-hover:opacity-15"
                        accent="var(--color-primary)"
                        density={0.44}
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <span className="border border-primary/30 bg-primary/15 text-primary px-2 py-0.5 text-xs font-bold uppercase tracking-widest">
                          {String(item.type ?? "memory")}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          conf{" "}
                          {typeof item.confidence === "number"
                            ? item.confidence.toFixed(2)
                            : "—"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {String(item.content ?? "")}
                      </p>
                      {Array.isArray(item.mergedFrom) &&
                        (item.mergedFrom as string[]).length > 0 && (
                          <p className="mt-2.5 text-xs font-mono text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground leading-relaxed">
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

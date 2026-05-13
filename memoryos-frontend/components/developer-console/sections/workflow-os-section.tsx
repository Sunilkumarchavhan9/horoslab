"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { DitherBackground } from "@/components/ui/dither-background";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

/* ─── types ──────────────────────────────────────────────────── */

type SessionStatus =
  | "IDLE"
  | "RECORDING"
  | "PAUSED"
  | "VERIFYING"
  | "COMPLETED";

type AgentProfile = {
  id: string;
  name: string;
  runtime: string | null;
  category: string | null;
  status: string | null;
  connectedAt: string | null;
  lastHeartbeat: string | null;
  threads24h: number | null;
  resumeScore: number | null;
  handoffs24h: number | null;
  createdAt?: string | null;
};

type AgentSession = {
  id: string;
  agentId: string;
  model: string;
  tool: string;
  task: string | null;
  mode: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  summary: string | null;
};

type TimelineEvent = {
  id: string;
  type: string;
  summary: string;
  payloadJson?: unknown;
  timestamp: string;
};

type WorkflowRow = {
  rowId: string;
  agent: AgentProfile | null;
  session: AgentSession | null;
  task: string;
  status: SessionStatus | "UNCONNECTED" | "IDLE_AGENT";
  progress: { current: number; total: number };
};

/* ─── api helpers ────────────────────────────────────────────── */

function unwrap<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "ok" in (payload as Record<string, unknown>) &&
    (payload as { ok: unknown }).ok === true &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

async function api<T>(
  url: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const token = await getOrCreateMemoryToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const opts: RequestInit = {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers,
  };
  if (init?.json !== undefined) {
    opts.body = JSON.stringify(init.json);
  }
  const response = await fetch(url, opts);
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    if (
      body &&
      typeof body === "object" &&
      "error" in (body as Record<string, unknown>) &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      message = (body as { error: string }).error;
    }
    throw new Error(message);
  }
  return unwrap<T>(body);
}

/* ─── live data hook ─────────────────────────────────────────── */

const POLL_MS = 12000;

function useWorkflowData() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const cancelled = useRef(false);

  const load = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true);
    try {
      const [agentsResult, sessionsResult] = await Promise.allSettled([
        api<{ agents: AgentProfile[] }>("/api/agents"),
        api<AgentSession[]>("/api/agent-sessions"),
      ]);

      if (cancelled.current) return;

      if (agentsResult.status === "fulfilled") {
        setAgents(agentsResult.value.agents ?? []);
      }
      if (sessionsResult.status === "fulfilled") {
        const list = Array.isArray(sessionsResult.value)
          ? sessionsResult.value
          : [];
        const deduped = Array.from(
          new Map(list.map((session) => [session.id, session])).values(),
        ).sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        );
        setSessions(deduped);
      }

      const bothFailed =
        agentsResult.status === "rejected" &&
        sessionsResult.status === "rejected";
      const firstError =
        agentsResult.status === "rejected"
          ? agentsResult.reason
          : sessionsResult.status === "rejected"
            ? sessionsResult.reason
            : null;

      if (bothFailed && firstError) {
        setError(
          firstError instanceof Error
            ? firstError.message
            : "Could not load Workflow OS data.",
        );
      } else {
        setError(null);
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      if (!cancelled.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Workflow OS data.",
        );
      }
    } finally {
      if (!cancelled.current) setLoading(false);
      if (!cancelled.current && background) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    void load(false);
    return () => {
      cancelled.current = true;
    };
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load(true);
    }, POLL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [load]);

  return { agents, sessions, loading, isRefreshing, error, lastUpdated, refresh: load };
}

/* ─── tab row builders ───────────────────────────────────────── */

function latestSessionFor(agentId: string, sessions: AgentSession[]) {
  return (
    sessions
      .filter((s) => s.agentId === agentId)
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )[0] ?? null
  );
}

function buildLiveRows(
  agents: AgentProfile[],
  sessions: AgentSession[],
): WorkflowRow[] {
  const live = sessions.filter(
    (s) =>
      s.status === "RECORDING" || s.status === "IDLE" || s.status === "VERIFYING",
  );
  return live.map((session) => {
    const agent = agents.find((a) => a.id === session.agentId) ?? null;
    return {
      rowId: session.id,
      agent,
      session,
      task: session.task || agent?.category || "Untitled task",
      status: session.status,
      progress: progressFromSession(),
    };
  });
}

function buildScheduledRows(
  agents: AgentProfile[],
  sessions: AgentSession[],
): WorkflowRow[] {
  const paused = sessions.filter((s) => s.status === "PAUSED");
  const idleAgents = agents.filter(
    (a) =>
      (a.status ?? "").toLowerCase() === "idle" &&
      !sessions.some(
        (s) =>
          s.agentId === a.id &&
          (s.status === "RECORDING" || s.status === "IDLE"),
      ),
  );

  const pausedRows: WorkflowRow[] = paused.map((session) => {
    const agent = agents.find((a) => a.id === session.agentId) ?? null;
    return {
      rowId: session.id,
      agent,
      session,
      task: session.task || agent?.category || "Paused session",
      status: "PAUSED",
      progress: progressFromSession(),
    };
  });

  const idleRows: WorkflowRow[] = idleAgents.map((agent) => ({
    rowId: agent.id,
    agent,
    session: null,
    task: agent.category || "Awaiting trigger",
    status: "IDLE_AGENT",
    progress: { current: 0, total: 1 },
  }));

  return [...pausedRows, ...idleRows];
}

function buildHistoricalRows(
  agents: AgentProfile[],
  sessions: AgentSession[],
): WorkflowRow[] {
  return sessions
    .filter((s) => s.status === "COMPLETED" || s.endedAt)
    .sort((a, b) => {
      const aT = new Date(a.endedAt || a.startedAt).getTime();
      const bT = new Date(b.endedAt || b.startedAt).getTime();
      return bT - aT;
    })
    .map((session) => {
      const agent = agents.find((a) => a.id === session.agentId) ?? null;
      return {
        rowId: session.id,
        agent,
        session,
        task: session.task || agent?.category || "Completed run",
        status: "COMPLETED" as SessionStatus,
        progress: progressFromSession(),
      };
    });
}

function progressFromSession(): { current: number; total: number } {
  // We don't know totalSteps without a timeline fetch. Use a stable placeholder
  // that will be filled in by the drawer when opened.
  return { current: 1, total: 5 };
}

/* ─── status visuals ─────────────────────────────────────────── */

function statusPillClass(status: WorkflowRow["status"]) {
  switch (status) {
    case "RECORDING":
      return "bg-primary/15 text-primary border border-primary/30";
    case "IDLE":
      return "bg-primary/10 text-primary border border-primary/30";
    case "VERIFYING":
      return "bg-primary/10 text-primary border border-primary/25";
    case "PAUSED":
      return "bg-muted text-muted-foreground border border-border";
    case "COMPLETED":
      return "bg-muted text-muted-foreground border border-border";
    case "IDLE_AGENT":
      return "bg-muted text-muted-foreground border border-border";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

function statusLabel(status: WorkflowRow["status"]) {
  if (status === "IDLE_AGENT") return "scheduled";
  return status.toLowerCase();
}

/* ─── component ──────────────────────────────────────────────── */

export function WorkflowOsSection() {
  const { agents, sessions, loading, isRefreshing, error, lastUpdated, refresh } = useWorkflowData();
  const [activeTab, setActiveTab] = useState<
    "live" | "scheduled" | "history"
  >("live");
  const [selectedRow, setSelectedRow] = useState<WorkflowRow | null>(null);
  const [drawerEvents, setDrawerEvents] = useState<TimelineEvent[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [injectMode, setInjectMode] = useState(false);
  const [injectText, setInjectText] = useState("");
  const [actionPending, setActionPending] = useState<string | null>(null);

  const liveRows = useMemo(
    () => buildLiveRows(agents, sessions),
    [agents, sessions],
  );
  const scheduledRows = useMemo(
    () => buildScheduledRows(agents, sessions),
    [agents, sessions],
  );
  const historicalRows = useMemo(
    () => buildHistoricalRows(agents, sessions),
    [agents, sessions],
  );

  const rows =
    activeTab === "live"
      ? liveRows
      : activeTab === "scheduled"
        ? scheduledRows
        : historicalRows;

  const emptyMessage =
    activeTab === "live"
      ? "No live sessions yet. Start an agent to populate this view."
      : activeTab === "scheduled"
        ? "No scheduled or paused agents right now."
        : "No completed runs yet. Past sessions will appear here.";

  const loadDrawerTimeline = useCallback(async (sessionId: string) => {
    setDrawerLoading(true);
    setDrawerError(null);
    try {
      const events = await api<TimelineEvent[]>(
        `/api/agent-sessions/${sessionId}/timeline`,
      );
      setDrawerEvents(Array.isArray(events) ? events : []);
    } catch (err) {
      setDrawerError(
        err instanceof Error
          ? err.message
          : "Could not load session timeline.",
      );
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  function openDrawer(row: WorkflowRow) {
    setSelectedRow(row);
    setInjectMode(false);
    setInjectText("");
    setDrawerEvents([]);
    setDrawerError(null);

    const sessionId =
      row.session?.id ??
      (row.agent ? latestSessionFor(row.agent.id, sessions)?.id : null);

    if (sessionId) {
      void loadDrawerTimeline(sessionId);
    }
  }

  function closeDrawer() {
    setSelectedRow(null);
    setDrawerEvents([]);
    setDrawerError(null);
    setInjectMode(false);
    setInjectText("");
  }

  async function postEvent(
    sessionId: string,
    type: string,
    summary: string,
  ) {
    return api(`/api/agent-sessions/${sessionId}/event`, {
      method: "POST",
      json: { type, summary },
    });
  }

  async function runIntervention(
    action: "pause" | "resume" | "inject" | "handoff" | "terminate",
  ) {
    if (!selectedRow?.session) return;
    const sessionId = selectedRow.session.id;
    setActionPending(action);
    try {
      if (action === "pause") {
        await postEvent(sessionId, "intervention.pause", "Paused by operator");
      } else if (action === "resume") {
        await postEvent(
          sessionId,
          "intervention.resume",
          "Resumed by operator",
        );
      } else if (action === "inject") {
        if (!injectText.trim()) {
          setActionPending(null);
          return;
        }
        await postEvent(
          sessionId,
          "intervention.inject",
          injectText.trim(),
        );
        setInjectText("");
        setInjectMode(false);
      } else if (action === "handoff") {
        await api(`/api/agent-sessions/${sessionId}/handoff`, {
          method: "POST",
          json: {},
        });
      } else if (action === "terminate") {
        await api(`/api/agent-sessions/${sessionId}/end`, {
          method: "POST",
          json: { summary: "Terminated by operator" },
        });
      }
      await Promise.all([loadDrawerTimeline(sessionId), refresh()]);
    } catch (err) {
      setDrawerError(
        err instanceof Error ? err.message : "Intervention failed.",
      );
    } finally {
      setActionPending(null);
    }
  }

  const drawerStages = useMemo(() => {
    if (!drawerEvents.length) return [];
    const sorted = [...drawerEvents].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const sessionStillRecording =
      selectedRow?.session?.status === "RECORDING" ||
      selectedRow?.session?.status === "IDLE";
    const lastIndex = sorted.length - 1;
    const grouped = new Map<
      string,
      { name: string; logs: string[]; latestTs: string }
    >();
    sorted.forEach((event) => {
      const key = event.type;
      const entry = grouped.get(key);
      if (entry) {
        entry.logs.push(event.summary);
        entry.latestTs = event.timestamp;
      } else {
        grouped.set(key, {
          name: event.type,
          logs: [event.summary],
          latestTs: event.timestamp,
        });
      }
    });
    return Array.from(grouped.values()).map((stage, index, arr) => {
      const isLast = index === arr.length - 1;
      return {
        name: stage.name,
        status:
          isLast && sessionStillRecording
            ? ("running" as const)
            : ("completed" as const),
        logs: stage.logs,
        latestTs: stage.latestTs,
        eventCount: stage.logs.length,
        eventCountTotal: lastIndex + 1,
      };
    });
  }, [drawerEvents, selectedRow]);

  return (
    <div className="pb-12 text-foreground h-full overflow-y-auto">
      {/* Header w/ dither */}
      <div className="relative overflow-hidden border-b border-border bg-background px-6 py-8">
        <div className="absolute inset-0 bg-primary/5" />
        
        
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="inline-flex items-center gap-3 rounded-[8px] px-3 py-1.5 text-[26px] font-bold tracking-tight text-foreground drop-shadow-sm">
              <Icon
                name="terminal"
                className="h-6 w-6 text-primary"
              />
              Agent Workflow OS
            </h1>
            <br/>
            <p className="mt-1.5 inline-flex max-w-xl items-center gap-2 rounded-[8px] px-3 py-1.5 text-[14px] leading-relaxed text-muted-foreground">
             
              Mission control for autonomous agents. Live sessions, paused
              workflows, completed runs - all wired to the MemoryOS backend.
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Status: {loading || isRefreshing ? "Syncing live workflow data..." : error ? "Sync error" : "Live backend connected"} | Last updated: {lastUpdated}
            </p>
          </div>
          
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[
            { label: "Live Workflows", value: liveRows.length, tone: "var(--color-primary)", icon: "play" as const },
            { label: "Scheduled Agents", value: scheduledRows.length, tone: "var(--color-primary)", icon: "pause" as const },
            { label: "Historical Runs", value: historicalRows.length, tone: "var(--color-primary)", icon: "graph" as const },
          ].map((card) => (
            <motion.div
              key={card.label}
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-[10px] border border-border bg-card px-3.5 py-3"
              style={{ borderTopColor: card.tone, borderTopWidth: "2px" }}
            >
              <DitherBackground className="pointer-events-none absolute inset-0 opacity-20" accent={card.tone} density={0.44} cols={56} rows={20} />
              <p className="relative inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <Icon name={card.icon} className="h-3 w-3" />
                {card.label}
              </p>
              <p className="relative mt-1 inline-block rounded-[6px] px-2 py-0.5 text-[22px] font-semibold tracking-[-0.03em] text-foreground">
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {[
            { id: "live" as const, label: "Live Workflows", count: liveRows.length },
            {
              id: "scheduled" as const,
              label: "Scheduled Agents",
              count: scheduledRows.length,
            },
            {
              id: "history" as const,
              label: "Historical Runs",
              count: historicalRows.length,
            },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary bg-primary/10 text-primary"
                  : "border-b-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="rounded-full border border-border bg-card/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error ? (
            <motion.div
              key="wf-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-[8px] border border-destructive/40 bg-destructive/15 px-4 py-2.5 font-mono text-[11px] text-destructive"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Table card with dither overlay */}
        <div className="relative overflow-hidden rounded-md border border-border bg-card">
          {loading && rows.length === 0 ? (
            <div className="relative p-12 text-center font-mono text-[12px] text-muted-foreground">
              Loading workflow data...
            </div>
          ) : rows.length === 0 ? (
            <div className="relative p-12 text-center text-[12px] text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="bg-muted text-muted-foreground uppercase tracking-widest">
                    <th className="px-5 py-3 font-medium">Worker ID</th>
                    <th className="px-5 py-3 font-medium">Agent Task</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-border"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.04 } },
                  }}
                >
                  {rows.map((row) => {
                    const isRunning =
                      row.status === "RECORDING" || row.status === "IDLE";
                    const pct =
                      (row.progress.current / Math.max(row.progress.total, 1)) *
                      100;
                    return (
                      <motion.tr
                        key={row.rowId}
                        variants={{
                          hidden: {
                            opacity: 0,
                            y: 8,
                            filter: "blur(3px)",
                          },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                          },
                        }}
                        transition={{ duration: 0.24 }}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDrawer(row)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-mono text-primary">
                            {row.session?.id?.slice(0, 8) ??
                              row.agent?.id?.slice(0, 8) ??
                              row.rowId.slice(0, 8)}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {row.agent?.name ?? "Unknown agent"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                          {row.task}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {row.progress.current}/{row.progress.total}
                            </div>
                            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusPillClass(row.status)}`}
                          >
                            {isRunning ? (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                              </span>
                            ) : null}
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDrawer(row);
                            }}
                            className="rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary/80 hover:text-secondary-foreground"
                          >
                            Manage
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedRow ? (
          <motion.div
            key="wf-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm"
          >
            <button
              type="button"
              aria-label="Close drawer"
              onClick={closeDrawer}
              className="absolute inset-0 h-full w-full cursor-default"
            />
            <motion.div
              initial={{ x: 480, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 480, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 38 }}
              className="relative flex w-full max-w-[480px] flex-col border-l border-border bg-background shadow-2xl"
            >
              <div className="relative sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/85 px-6 py-4 backdrop-blur-md">
                <div>
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${
                        selectedRow.status === "RECORDING" ||
                        selectedRow.status === "IDLE"
                          ? "bg-primary"
                          : selectedRow.status === "PAUSED"
                            ? "bg-muted-foreground"
                            : selectedRow.status === "COMPLETED"
                              ? "bg-muted"
                              : "bg-primary"
                      }`}
                    >
                      {selectedRow.status === "RECORDING" ||
                      selectedRow.status === "IDLE" ? (
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-60" />
                      ) : null}
                    </span>
                    {selectedRow.agent?.name ?? "Agent"}
                  </h3>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {selectedRow.session?.id ?? selectedRow.agent?.id} ·{" "}
                    {selectedRow.agent?.runtime ?? "unknown runtime"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-[6px] border border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:border-ring hover:bg-muted/50 hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <div className="relative flex-1 space-y-6 overflow-y-auto p-6">
                {/* Goal */}
                <div className="border border-border bg-muted p-4">
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Current Goal
                  </div>
                  <div className="text-[13px] leading-relaxed text-foreground">
                    {selectedRow.task}
                  </div>
                </div>

                {/* Agent metrics */}
                {selectedRow.agent ? (
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    {[
                      {
                        label: "Threads 24h",
                        value: selectedRow.agent.threads24h ?? 0,
                      },
                      {
                        label: "Resume",
                        value: selectedRow.agent.resumeScore ?? 0,
                      },
                      {
                        label: "Handoffs",
                        value: selectedRow.agent.handoffs24h ?? 0,
                      },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="border border-border bg-background/40 p-3"
                      >
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                          {cell.label}
                        </div>
                        <div className="mt-1 font-mono text-[18px] text-foreground">
                          {cell.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Drawer error */}
                {drawerError ? (
                  <div className="rounded-[6px] border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
                    {drawerError}
                  </div>
                ) : null}

                {/* Intervention controls */}
                <div>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Intervention Controls
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRow.session?.status === "RECORDING" ||
                    selectedRow.session?.status === "IDLE" ? (
                      <button
                        type="button"
                        onClick={() => runIntervention("pause")}
                        disabled={
                          !selectedRow.session || actionPending !== null
                        }
                        className="flex items-center justify-center gap-2 rounded-sm border border-border bg-secondary py-2 text-[11px] font-bold uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="pause" className="h-3.5 w-3.5" />
                        {actionPending === "pause" ? "Pausing..." : "Pause"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => runIntervention("resume")}
                        disabled={
                          !selectedRow.session || actionPending !== null
                        }
                        className="flex items-center justify-center gap-2 rounded-sm border border-primary/40 bg-primary/15 py-2 text-[11px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="play" className="h-3.5 w-3.5" />
                        {actionPending === "resume"
                          ? "Resuming..."
                          : "Resume"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setInjectMode((current) => !current)}
                      disabled={!selectedRow.session}
                      className="flex items-center justify-center gap-2 rounded-sm border border-primary/35 bg-primary/10 py-2 text-[11px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="terminal" className="h-3.5 w-3.5" />
                      Inject Context
                    </button>
                    <button
                      type="button"
                      onClick={() => runIntervention("handoff")}
                      disabled={!selectedRow.session || actionPending !== null}
                      className="flex items-center justify-center gap-2 rounded-sm border border-muted-foreground/35 bg-muted/30 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="handoff" className="h-3.5 w-3.5" />
                      {actionPending === "handoff"
                        ? "Generating..."
                        : "Force Handoff"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runIntervention("terminate")}
                      disabled={!selectedRow.session || actionPending !== null}
                      className="flex items-center justify-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 py-2 text-[11px] font-bold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="warning" className="h-3.5 w-3.5" />
                      {actionPending === "terminate"
                        ? "Ending..."
                        : "Terminate"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {injectMode ? (
                      <motion.div
                        key="inject"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden border border-primary/30 bg-muted"
                      >
                        <div className="p-4">
                          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-primary">
                            Force Runtime Guidance
                          </label>
                          <textarea
                            value={injectText}
                            onChange={(event) =>
                              setInjectText(event.target.value)
                            }
                            placeholder="Tell the agent what to prioritize next..."
                            className="min-h-[80px] w-full rounded-md border border-input bg-background p-2 text-[12px] text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setInjectMode(false);
                                setInjectText("");
                              }}
                              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => runIntervention("inject")}
                              disabled={
                                !injectText.trim() || actionPending !== null
                              }
                              className="rounded-sm bg-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {actionPending === "inject"
                                ? "Sending..."
                                : "Send to Agent"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Execution graph (live timeline) */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Execution Graph
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {drawerLoading
                        ? "Loading..."
                        : `${drawerEvents.length} event${drawerEvents.length === 1 ? "" : "s"}`}
                    </span>
                  </div>

                  {drawerLoading && drawerEvents.length === 0 ? (
                    <div className="border border-border bg-muted/40 p-6 text-center font-mono text-[11px] text-muted-foreground">
                      Loading session timeline...
                    </div>
                  ) : drawerStages.length === 0 ? (
                    <div className="border border-border bg-muted/40 p-6 text-center text-[11px] text-muted-foreground">
                      No timeline events yet for this agent.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drawerStages.map((stage, index) => (
                        <div
                          key={`${stage.name}-${index}`}
                          className="flex gap-3"
                        >
                          <div
                            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                              stage.status === "running"
                                ? "bg-primary animate-pulse"
                                : "bg-primary"
                            }`}
                          />
                          <div
                            className={`flex-1 border p-3 ${
                              stage.status === "running"
                                ? "border-primary/30 bg-primary/5"
                                : "border-border bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[12px] font-semibold text-foreground/90">
                                {stage.name}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {new Date(stage.latestTs).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                              {stage.status} · {stage.eventCount} log
                              {stage.eventCount === 1 ? "" : "s"}
                            </div>
                            <div className="mt-2 space-y-1 border-t border-border pt-2">
                              {stage.logs.slice(-4).map((log, li) => (
                                <div
                                  key={li}
                                  className={`font-mono text-[10px] leading-tight ${
                                    log.includes("intervention")
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  &gt; {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

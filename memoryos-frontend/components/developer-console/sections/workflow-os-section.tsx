"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ConsoleGrid,
  ConsolePage,
  ConsolePageHeader,
  ConsoleSurface,
} from "@/components/developer-console/console-ui";
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

function shortenLog(input: string, max = 180): string {
  if (!input) return "";
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}...`;
}

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

function useWorkflowData(_realtimeVersion = 0) {
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

function statusBadgeVariant(
  status: WorkflowRow["status"],
): ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "RECORDING":
    case "IDLE":
    case "VERIFYING":
      return "default";
    case "PAUSED":
    case "IDLE_AGENT":
      return "secondary";
    case "COMPLETED":
      return "outline";
    default:
      return "secondary";
  }
}

function statusIcon(status: WorkflowRow["status"]) {
  switch (status) {
    case "RECORDING":
      return "play" as const;
    case "IDLE":
      return "pause" as const;
    case "VERIFYING":
      return "graph" as const;
    case "PAUSED":
      return "pause" as const;
    case "COMPLETED":
      return "success" as const;
    case "IDLE_AGENT":
      return "pause" as const;
    default:
      return "success" as const;
  }
}

function statusLabel(status: WorkflowRow["status"]) {
  if (status === "IDLE_AGENT") return "scheduled";
  return status.toLowerCase();
}

/* ─── component ──────────────────────────────────────────────── */

type WorkflowOsSectionProps = {
  realtimeVersion?: number;
};

export function WorkflowOsSection({ realtimeVersion = 0 }: WorkflowOsSectionProps) {
  const { agents, sessions, loading, isRefreshing, error, lastUpdated, refresh } = useWorkflowData(realtimeVersion);
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

  const tabs = [
    { id: "live" as const, label: "Live Workflows", count: liveRows.length },
    { id: "scheduled" as const, label: "Scheduled Agents", count: scheduledRows.length },
    { id: "history" as const, label: "Historical Runs", count: historicalRows.length },
  ];

  const workflowStats = [
    {
      label: "Live Workflows",
      value: liveRows.length,
      icon: "play" as const,
      detail: "Agent sessions currently recording, idle, or verifying.",
    },
    {
      label: "Scheduled Agents",
      value: scheduledRows.length,
      icon: "pause" as const,
      detail: "Paused sessions and idle agents waiting for work.",
    },
    {
      label: "Historical Runs",
      value: historicalRows.length,
      icon: "graph" as const,
      detail: "Completed agent sessions available for review.",
    },
  ];

  const workflowSignals = [
    {
      label: "Backend source",
      value: "/api/agents + /api/agent-sessions",
    },
    {
      label: "Refresh cycle",
      value: "Manual + live events",
    },
    {
      label: "Last update",
      value: lastUpdated === "-" ? "waiting" : new Date(lastUpdated).toLocaleTimeString(),
    },
  ];

  return (
    <ConsolePage className="h-full overflow-y-auto bg-background pb-12">
      <ConsolePageHeader
        title="Agent Workflow OS"
        description="A company-grade control plane for engineering teams running AI agents: see active work, waiting agents, completed runs, interventions, and handoffs in one operating surface."
        badge={<Icon name="terminal" className="h-5 w-5 text-primary" />}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      <ConsoleSurface className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-[minmax(0,1fr)_22rem] lg:divide-x lg:divide-y-0">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Workflow runtime</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">Agent sessions are monitored from live backend data</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Built for companies and engineering teams, this page watches running sessions, paused work, and completed runs. Open any row to inspect timeline events, inject operator notes, generate a handoff, or terminate a session.
                </p>
              </div>
              <Badge variant="outline" className="gap-2 border-border bg-background px-3 py-1.5">
                <span className="h-2 w-2 bg-primary" />
                {isRefreshing ? "Syncing" : "Live monitor"}
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
              {workflowStats.map((card) => (
                <div key={card.label} className="bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon name={card.icon} className="h-4 w-4 text-primary" />
                      <span>{card.label}</span>
                    </div>
                    <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                      {card.value}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/20 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Runtime signals</p>
            <div className="mt-4 space-y-3">
              {workflowSignals.map((signal) => (
                <div key={signal.label} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{signal.label}</p>
                  <p className="mt-1 break-words font-mono text-xs text-foreground">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ConsoleSurface>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="gap-4"
      >
        <TabsList variant="line" className="w-full justify-start border-b border-border pb-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2 px-3">
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AnimatePresence>
        {error ? (
          <motion.div
            key="wf-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <ConsoleSurface tone="destructive" className="text-sm text-destructive">
              {error}
            </ConsoleSurface>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConsoleSurface className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTab === "live"
                ? "Active agent work that may need operator attention."
                : activeTab === "scheduled"
                  ? "Paused or idle agents ready to be resumed."
                  : "Completed runs you can inspect for handoffs and traceability."}
            </p>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {rows.length} total
          </Badge>
        </div>
        {loading && rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading workflow data...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker ID</TableHead>
                <TableHead>Agent Task</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isRunning =
                  row.status === "RECORDING" || row.status === "IDLE";
                const pct =
                  (row.progress.current / Math.max(row.progress.total, 1)) *
                  100;
                return (
                  <TableRow
                    key={row.rowId}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openDrawer(row)}
                  >
                    <TableCell>
                      <div className="font-medium text-primary">
                        {row.session?.id?.slice(0, 8) ??
                          row.agent?.id?.slice(0, 8) ??
                          row.rowId.slice(0, 8)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.agent?.name ?? "Unknown agent"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">
                      {row.task}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-32 items-center gap-3">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {row.progress.current}/{row.progress.total}
                        </span>
                        <Progress value={pct} className="w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(row.status)} className="gap-1.5">
                        {isRunning ? (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                          </span>
                        ) : (
                          <Icon name={statusIcon(row.status)} className="h-3 w-3" />
                        )}
                        {statusLabel(row.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDrawer(row);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ConsoleSurface>

      {/* Session command modal */}
      <AnimatePresence>
        {selectedRow ? (
          <motion.div
            key="wf-session-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              aria-label="Close session command modal"
              onClick={closeDrawer}
              className="absolute inset-0 h-full w-full cursor-default"
            />
            <motion.div
              initial={{ y: 24, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 24, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 38 }}
              className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden border border-border bg-background shadow-2xl"
            >
              <div className="relative sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/85 px-6 py-4 backdrop-blur-md">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                    Agent command center
                  </p>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
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
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="border border-border bg-background px-2 py-0.5">
                      {statusLabel(selectedRow.status)}
                    </span>
                    <span className="border border-border bg-background px-2 py-0.5">
                      {selectedRow.session?.tool ?? selectedRow.agent?.runtime ?? "operator session"}
                    </span>
                    <span className="border border-border bg-background px-2 py-0.5">
                      {selectedRow.session?.mode ?? selectedRow.agent?.category ?? "workflow"}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      ref {selectedRow.session?.id?.slice(0, 8) ?? selectedRow.agent?.id?.slice(0, 8) ?? selectedRow.rowId.slice(0, 8)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:border-ring hover:bg-muted/50 hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <div className="relative grid flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="space-y-6">
                {/* Goal */}
                <div className="border border-border bg-muted p-4">
                  <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                    Current Goal
                  </div>
                  <div className="text-sm leading-relaxed text-foreground">
                    {selectedRow.task}
                  </div>
                </div>

                {/* Agent metrics */}
                {selectedRow.agent ? (
                  <div className="grid grid-cols-3 gap-2 text-xs">
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
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">
                          {cell.label}
                        </div>
                        <div className="mt-1 font-mono text-lg text-foreground">
                          {cell.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Drawer error */}
                {drawerError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
                    {drawerError}
                  </div>
                ) : null}
                </div>

                <div className="space-y-6">
                {/* Intervention controls */}
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                        className="flex items-center justify-center gap-2 rounded-sm border border-border bg-secondary py-2 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
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
                        className="flex items-center justify-center gap-2 rounded-sm border border-primary/40 bg-primary/15 py-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
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
                      className="flex items-center justify-center gap-2 rounded-sm border border-primary/35 bg-primary/10 py-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="terminal" className="h-3.5 w-3.5" />
                      Inject Context
                    </button>
                    <button
                      type="button"
                      onClick={() => runIntervention("handoff")}
                      disabled={!selectedRow.session || actionPending !== null}
                      className="flex items-center justify-center gap-2 rounded-sm border border-muted-foreground/35 bg-muted/30 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
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
                      className="flex items-center justify-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 py-2 text-xs font-bold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">
                            Force Runtime Guidance
                          </label>
                          <textarea
                            value={injectText}
                            onChange={(event) =>
                              setInjectText(event.target.value)
                            }
                            placeholder="Tell the agent what to prioritize next..."
                            className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setInjectMode(false);
                                setInjectText("");
                              }}
                              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => runIntervention("inject")}
                              disabled={
                                !injectText.trim() || actionPending !== null
                              }
                              className="rounded-sm bg-primary px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
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
                </div>

                <div className="lg:col-span-2">
                {/* Execution graph (live timeline) */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Execution Graph
                    </h4>
                    <span className="font-mono text-xs text-muted-foreground">
                      {drawerLoading
                        ? "Loading..."
                        : `${drawerEvents.length} event${drawerEvents.length === 1 ? "" : "s"}`}
                    </span>
                  </div>

                  {drawerLoading && drawerEvents.length === 0 ? (
                    <div className="border border-border bg-muted/40 p-6 text-center font-mono text-xs text-muted-foreground">
                      Loading session timeline...
                    </div>
                  ) : drawerStages.length === 0 ? (
                    <div className="border border-border bg-muted/40 p-6 text-center text-xs text-muted-foreground">
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
                              <span className="font-mono text-xs font-semibold text-foreground/90">
                                {stage.name}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {new Date(stage.latestTs).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                              {stage.status} · {stage.eventCount} log
                              {stage.eventCount === 1 ? "" : "s"}
                            </div>
                            <div className="mt-2 space-y-1 border-t border-border pt-2">
                              {stage.logs.slice(-4).map((log, li) => (
                                <div
                                  key={li}
                                  className={`font-mono text-xs leading-tight ${
                                    log.includes("intervention")
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  &gt; {shortenLog(log)}
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
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ConsolePage>
  );
}

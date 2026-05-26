"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import { EASE_OUT } from "@/lib/motion";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type ConnectorStatus = "connected" | "not_connected" | "pending" | "syncing" | "error";

type ConnectorRecord = {
  id: string;
  type: string;
  name: string;
  status: ConnectorStatus;
  lastSyncAt?: string | null;
  recordCount?: number;
};

type ActivityItem = {
  id: string;
  message: string;
  at: string;
  tone: "success" | "info" | "error";
  connectorType?: string;
};

type ConnectorDiagnostic = {
  type?: string | null;
  connectorType?: string | null;
  status?: string | null;
  checkedAt?: string | null;
  latencyMs?: number;
  errorRate?: number;
  lastFailureAt?: string | null;
  message?: string | null;
  auth?: {
    configured?: boolean;
    mode?: string;
  };
  transport?: {
    protocol?: string;
    healthy?: boolean;
  };
  retry?: {
    retryCount?: number;
    lastFailureAt?: string | null;
    lastFailureReason?: string | null;
  };
  checkpoints?: {
    lastCheckpointAt?: string | null;
    recentItemKeysCount?: number;
  };
};

type ConnectorEventPayload = {
  type?: string;
  event?: string;
  connectorType?: string;
  connector?: string;
  status?: string;
  message?: string;
  extractedCount?: number;
  timestamp?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function formatRelative(value?: string | null) {
  if (!value) return "No sync yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function connectorLabel(type?: string | null) {
  const value = typeof type === "string" && type.trim() ? type : "unknown";
  const normalized = value.toLowerCase();
  if (normalized === "github") return "GitHub";
  if (normalized === "local_files") return "Local Files";
  if (normalized === "google_drive") return "Google Drive";
  if (normalized === "not_connected") return "Not connected";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(status?: ConnectorStatus | string | null) {
  if (!status) return "Unknown";
  if (status === "not_connected") return "Not connected";
  return status.replace(/_/g, " ");
}

function statusClass(status: ConnectorStatus) {
  if (status === "connected") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "syncing") return "border-chart-2/30 bg-chart-2/10 text-chart-2";
  if (status === "pending") return "border-chart-4/30 bg-chart-4/10 text-chart-4";
  if (status === "error") return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-border bg-muted text-muted-foreground";
}

function healthTone(status?: string | null) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("not_connected") || normalized.includes("not connected")) {
    return "text-muted-foreground";
  }
  if (normalized.includes("connected") || normalized.includes("healthy") || normalized.includes("good")) {
    return "text-primary";
  }
  if (normalized.includes("sync") || normalized.includes("pending") || normalized.includes("degraded")) {
    return "text-chart-4";
  }
  if (normalized.includes("error") || normalized.includes("down") || normalized.includes("fail")) {
    return "text-destructive";
  }
  return "text-muted-foreground";
}

function clampPercent(value: number) {
  return Math.max(4, Math.min(100, value));
}

function diagnosticConnectorType(diagnostic?: ConnectorDiagnostic | null) {
  return diagnostic?.connectorType || diagnostic?.type || null;
}

function diagnosticStatus(diagnostic?: ConnectorDiagnostic | null, fallback?: string | null) {
  return diagnostic?.status || fallback || "unknown";
}

function diagnosticSummary(diagnostic?: ConnectorDiagnostic | null) {
  if (!diagnostic) return "Waiting for backend health";
  const authMode = diagnostic.auth?.mode ? connectorLabel(diagnostic.auth.mode) : "Auth";
  const authState = diagnostic.auth?.configured ? "configured" : "not configured";
  const protocol = diagnostic.transport?.protocol ? connectorLabel(diagnostic.transport.protocol) : "transport";
  const transportState = diagnostic.transport?.healthy ? "healthy" : "not ready";
  return `${authMode} ${authState} · ${protocol} ${transportState}`;
}

function diagnosticTime(diagnostic?: ConnectorDiagnostic | null, fallback?: string | null) {
  return diagnostic?.checkedAt || diagnostic?.checkpoints?.lastCheckpointAt || diagnostic?.retry?.lastFailureAt || fallback || null;
}

export function ImportsSection({ liveMemoryCount = 0 }: { liveMemoryCount?: number }) {
  const didLoadRef = useRef(false);
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<ConnectorDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [streamOnline, setStreamOnline] = useState(false);

  const addActivity = useCallback((message: string, tone: ActivityItem["tone"], connectorType?: string) => {
    setActivity((current) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        at: new Date().toISOString(),
        tone,
        connectorType,
      },
      ...current,
    ].slice(0, 24));
  }, []);

  const loadConnectors = useCallback(async () => {
    setLoading(true);
    const token = await getOrCreateMemoryToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const response = await fetch("/api/connector", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { data?: { connectors?: ConnectorRecord[] }; error?: { message?: string } }
      | null;

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Could not load connectors.");
    }

    const raw = payload?.data?.connectors ?? [];
    const deduped = Array.from(
      new Map(
        raw
          .filter((item) => item && typeof item.id === "string")
          .map((item) => [item.type || item.id, item]),
      ).values(),
    ) as ConnectorRecord[];

    setConnectors(deduped);
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  const loadDiagnostics = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) return;

    const response = await fetch("/api/connector/health", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return;

    const payload = (await response.json().catch(() => null)) as
      | { data?: { diagnostics?: ConnectorDiagnostic[] } }
      | null;
    const list = payload?.data?.diagnostics;
    if (Array.isArray(list)) {
      setDiagnostics(list);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([loadConnectors(), loadDiagnostics()]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load imports.");
      setLoading(false);
    }
  }, [loadConnectors, loadDiagnostics]);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    void refreshAll();
    return undefined;
  }, [refreshAll]);

  useEffect(() => {
    let stream: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let refreshTimer: number | null = null;
    let disposed = false;

    const scheduleRefresh = () => {
      if (disposed || refreshTimer) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void refreshAll();
      }, 1200);
    };

    const connect = () => {
      if (disposed) return;
      stream?.close();
      stream = new EventSource("/api/connector/events");

      stream.onopen = () => {
        setStreamOnline(true);
      };

      stream.onmessage = (event) => {
        const payload = JSON.parse(event.data || "{}") as ConnectorEventPayload;
        const type = payload.connectorType || payload.connector || "connector";
        const eventType = payload.type || payload.event || "connector_event";
        const count = typeof payload.extractedCount === "number" ? ` (${payload.extractedCount} records)` : "";
        addActivity(payload.message || `${connectorLabel(type)} ${eventType}${count}`, "info", type);
        scheduleRefresh();
      };

      stream.onerror = () => {
        setStreamOnline(false);
        stream?.close();
        stream = null;
        if (!disposed && !reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 5000);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (refreshTimer) window.clearTimeout(refreshTimer);
      stream?.close();
    };
  }, [addActivity, refreshAll]);

  const connected = connectors.filter((item) => item.status === "connected" || item.status === "syncing");
  const failed = connectors.filter((item) => item.status === "error");
  const totalRecords = connectors.reduce((sum, item) => sum + (item.recordCount ?? 0), 0);
  const maxRecords = Math.max(1, ...connectors.map((item) => item.recordCount ?? 0));
  const lastSyncAt = connectors
    .map((item) => item.lastSyncAt)
    .filter(Boolean)
    .sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0];

  const healthLabel = useMemo(() => {
    if (failed.length > 0 || diagnostics.some((item) => /down|error|fail/i.test(String(item.status ?? "")))) return "Needs attention";
    if (connectors.some((item) => item.status === "syncing")) return "Sync running";
    if (connected.length > 0) return "Operational";
    return "Waiting for source";
  }, [connected.length, connectors, diagnostics, failed.length]);

  const sourceRows = connectors.map((connector) => {
    const diagnostic = diagnostics.find((item) => {
      const type = diagnosticConnectorType(item);
      return type === connector.type || type === connector.id;
    });
    return { connector, diagnostic };
  });
  const recentDiagnostics = diagnostics
    .filter((item) => diagnosticConnectorType(item) || item.status)
    .slice(0, 8);
  const agentReadySources = sourceRows.filter(
    ({ connector, diagnostic }) =>
      (connector.status === "connected" || connector.status === "syncing") &&
      (connector.recordCount ?? 0) > 0 &&
      diagnostic?.transport?.healthy !== false,
  );
  const sourceReadinessScore = connectors.length
    ? Math.round((agentReadySources.length / connectors.length) * 100)
    : 0;
  const notConnectedCount = connectors.filter((item) => item.status === "not_connected").length;
  const primaryBlocker =
    failed.length > 0
      ? `${failed.length} source${failed.length === 1 ? "" : "s"} failing`
      : notConnectedCount > 0
        ? `${notConnectedCount} source${notConnectedCount === 1 ? "" : "s"} not connected`
        : totalRecords === 0
          ? "No indexed records yet"
          : "No blocking issue";
  const nextOperatorAction =
    failed.length > 0
      ? "Open the failing source and retry sync."
      : notConnectedCount > 0
        ? "Connect the missing source before production agent runs."
        : totalRecords === 0
          ? "Run sync so agents have source context."
          : "Run a fresh sync before handoff or release.";
  const trustChecks = [
    {
      label: "Agent-ready sources",
      value: `${agentReadySources.length}/${Math.max(connectors.length, 1)}`,
      ok: agentReadySources.length > 0,
    },
    {
      label: "Indexed memory records",
      value: totalRecords.toLocaleString(),
      ok: totalRecords > 0,
    },
    {
      label: "Connector event stream",
      value: streamOnline ? "Live" : "Polling",
      ok: streamOnline,
    },
    {
      label: "Backend health check",
      value: errorMessage ? "Attention" : "Ready",
      ok: !errorMessage,
    },
  ];

  async function syncConnector(type: string) {
    setBusyId(type);
    setErrorMessage(null);
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token.");
      const response = await fetch(`/api/connector/${type}/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { extractedCount?: number; queued?: boolean }; error?: { message?: string } }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? `Failed to sync ${type}`);
      }
      const extracted = payload?.data?.extractedCount ?? 0;
      addActivity(
        payload?.data?.queued
          ? `${connectorLabel(type)} sync queued by backend.`
          : `${connectorLabel(type)} synced ${extracted} records.`,
        "success",
        type,
      );
      await refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to sync ${type}`;
      setErrorMessage(message);
      addActivity(message, "error", type);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5 text-foreground">
      <motion.section
        className="relative overflow-hidden border border-border bg-card"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
      >
        <div className="absolute inset-0 bg-primary/5" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ x: [0, 2, -2, 0], y: [0, -1, 1, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <DitherBackground className="h-full w-full opacity-20" accent="var(--color-primary)" density={0.5} cols={220} rows={58} />
        </motion.div>
        <div className="relative z-10 grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-stretch">
          <div className="flex min-h-48 flex-col justify-between">
            <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ingestion Control</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Imports</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Decide whether company sources are safe for agent work: connected, indexed, fresh, and explainable before a handoff,
                code review, or customer escalation depends on memory.
            </p>
          </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Engineer", text: "Know which project context an agent can use." },
                { label: "Platform", text: "Watch sync health before runtime failures happen." },
                { label: "Compliance", text: "Verify memory came from approved sources." },
              ].map((item) => (
                <div key={item.label} className="border border-border bg-background/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">{item.label}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-background/85 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Agent source readiness</p>
                <p className="mt-3 text-5xl font-semibold tracking-tight tabular-nums">{sourceReadinessScore}%</p>
              </div>
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${sourceReadinessScore >= 80 ? "bg-primary" : sourceReadinessScore > 0 ? "bg-chart-4" : "bg-muted-foreground"}`} />
            </div>
            <div className="mt-4 h-2 bg-muted">
              <div className="h-full bg-primary" style={{ width: `${clampPercent(sourceReadinessScore)}%` }} />
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Blocker</p>
                <p className="mt-1 text-sm font-medium">{primaryBlocker}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next action</p>
                <p className="mt-1 text-sm text-muted-foreground">{nextOperatorAction}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {errorMessage ? (
        <div className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-4">
        {trustChecks.map((check) => (
          <div key={check.label} className="border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{check.label}</p>
              <span className={`mt-1 h-2 w-2 rounded-full ${check.ok ? "bg-primary" : "bg-muted-foreground"}`} />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{check.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{check.ok ? "Verified from backend" : "Needs operator attention"}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Source Readiness</p>
              <p className="mt-1 text-sm text-muted-foreground">What agents can trust right now, pulled from live connector and health APIs.</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition hover:border-primary hover:text-primary"
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-3 p-4">
            {sourceRows.map(({ connector, diagnostic }) => {
              const records = connector.recordCount ?? 0;
              const sourceHealth = diagnosticStatus(diagnostic, connector.status);
              const sourceTime = diagnosticTime(diagnostic, connector.lastSyncAt);
              const ready = (connector.status === "connected" || connector.status === "syncing") && records > 0;
              return (
                <article key={connector.id} className="border border-border bg-background p-4">
                  <div className="grid gap-4 lg:grid-cols-[minmax(12rem,1fr)_9rem_12rem_8rem] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{connector.name || connectorLabel(connector.type)}</p>
                        <span className={`inline-flex border px-2 py-1 text-xs font-semibold uppercase tracking-widest ${statusClass(connector.status)}`}>
                          {statusLabel(connector.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{diagnosticSummary(diagnostic)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Indexed</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{records}</p>
                      <div className="mt-2 h-1.5 bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${clampPercent((records / maxRecords) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Agent use</p>
                      <p className={`mt-1 font-medium ${ready ? "text-primary" : "text-muted-foreground"}`}>
                        {ready ? "Ready for retrieval" : "Do not rely yet"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatRelative(sourceTime)} · {connectorLabel(sourceHealth)}</p>
                    </div>

                    <div className="lg:text-right">
                      <button
                        type="button"
                        disabled={connector.status === "not_connected" || busyId === connector.type}
                        onClick={() => void syncConnector(connector.type)}
                        className="w-full border border-primary/40 bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground lg:w-auto"
                      >
                        {busyId === connector.type || connector.status === "syncing" ? "Syncing" : "Sync"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 border-t border-border pt-3 text-xs sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">Source type</span>
                      <p className="mt-1 font-medium">{connectorLabel(connector.type)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last sync</span>
                      <p className="mt-1 font-medium">{formatDate(sourceTime)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Runtime risk</span>
                      <p className={`mt-1 font-medium ${ready ? "text-primary" : "text-chart-4"}`}>
                        {ready ? "Low" : connector.status === "not_connected" ? "Missing source" : "Needs sync"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && connectors.length === 0 ? (
            <div className="border-t border-border px-4 py-8 text-sm text-muted-foreground">
              No connector data returned yet. Connect a source from Data Sources, then this table will update from the backend.
            </div>
          ) : null}
          {loading && connectors.length === 0 ? (
            <div className="border-t border-border px-4 py-8 text-sm text-muted-foreground">
              Loading live connector status...
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sync Activity</p>
              <p className="mt-1 text-sm text-muted-foreground">Live connector events and recent health checks.</p>
            </div>
            <div className="max-h-[28rem] space-y-2 overflow-y-auto p-4">
              {activity.map((item) => (
                <div key={item.id} className="border border-border bg-background px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{item.message}</p>
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        item.tone === "success" ? "bg-primary" : item.tone === "error" ? "bg-destructive" : "bg-chart-4"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.at)}</p>
                </div>
              ))}

              {activity.length === 0 && recentDiagnostics.length > 0
                ? recentDiagnostics.map((item, index) => {
                    const type = diagnosticConnectorType(item);
                    const status = diagnosticStatus(item);
                    const time = diagnosticTime(item);
                    return (
                    <div
                      key={`${type ?? "connector"}-${time ?? "latest"}-${index}`}
                      className="border border-border bg-background px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{connectorLabel(type)} health check</p>
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            healthTone(status) === "text-primary"
                              ? "bg-primary"
                              : healthTone(status) === "text-destructive"
                                ? "bg-destructive"
                                : "bg-muted-foreground"
                          }`}
                        />
                      </div>
                      <p className={`mt-1 text-xs font-semibold uppercase tracking-widest ${healthTone(status)}`}>
                        {connectorLabel(status)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{diagnosticSummary(item)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{time ? formatDate(time) : "Latest backend sample"}</p>
                    </div>
                    );
                  })
                : null}

              {activity.length === 0 && diagnostics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sync activity yet. Run a source sync to create the first event.</p>
              ) : null}
            </div>
          </section>

          <section className="border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Operational Signal</p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Connector stream", ok: streamOnline },
                { label: "Backend status API", ok: !errorMessage },
                { label: "Memory records visible", ok: totalRecords > 0 || liveMemoryCount > 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-xs font-semibold uppercase tracking-widest ${item.ok ? "text-primary" : "text-muted-foreground"}`}>
                    {item.ok ? "Ready" : "Waiting"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

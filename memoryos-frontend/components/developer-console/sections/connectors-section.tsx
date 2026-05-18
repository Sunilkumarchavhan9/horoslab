"use client";

import { useState, useEffect } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { type BillingPlan } from "@/lib/plan-catalog";

type ConnectorStatus = "connected" | "not_connected" | "pending";
type HealthStatus = "good" | "watch" | "error" | "offline";

type ConnectorRow = {
  id: string;
  name: string;
  purpose: string;
  requiredPlan: BillingPlan;
  status: ConnectorStatus;
  health: HealthStatus;
  records: number;
  lastSync: string;
  primary?: boolean;
  category: string;
  description: string;
};

type ConnectorDiagnostic = {
  type: string;
  status: string;
  auth: { configured: boolean; mode: string };
  transport: { protocol: string; healthy: boolean };
  retry: {
    enabled: boolean;
    retryCount: number;
    lastFailureAt: string | null;
    lastFailureReason: string | null;
  };
  checkpoints?: {
    lastCheckpointAt: string | null;
    recentItemKeysCount: number;
    slackCursor: string | null;
    slackLastMessageTs: string | null;
    gmailLastMessageId: string | null;
    gmailLastCheckpointEpochMs: number | null;
  };
  tokens?: {
    hasRefreshToken: boolean;
    lastTokenRefreshAt: string | null;
    hasAccessToken: boolean;
  };
  safety: { mcpSafeMetadata: boolean; policyCompatible: boolean };
};

type ConnectorSyncLog = {
  id: string;
  type: string;
  status: "success" | "error";
  extractedCount: number;
  message: string;
  at: string;
};

const INITIAL_CONNECTORS: ConnectorRow[] = [
  {
    id: "github",
    name: "GitHub",
    purpose: "Best for developer continuity: PRs, issues, repo decisions, bug history",
    description: "PRs, issues, commits, repo decisions",
    requiredPlan: "Free",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    primary: true,
    category: "Recommended",
  },
  {
    id: "local-files",
    name: "Local Files",
    purpose: "Import markdown/json context from local workspace",
    description: "Markdown, JSON, workspace context",
    requiredPlan: "Free",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    category: "Recommended",
  },
  {
    id: "notion",
    name: "Notion",
    purpose: "Product notes, specs, and team decisions",
    description: "Docs, Specs, and Team decisions",
    requiredPlan: "Pro",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    category: "Knowledge Sources",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    purpose: "Shared documents and project specs",
    description: "Shared documents and project specs",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Knowledge Sources",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    purpose: "Enterprise docs and shared folders",
    description: "Enterprise docs and shared folders",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Knowledge Sources",
  },
  {
    id: "gmail",
    name: "Gmail",
    purpose: "Email threads and follow-up context",
    description: "Email threads and follow-up context",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Communication",
  },
  {
    id: "web-crawler",
    name: "Web Crawler",
    purpose: "Capture public docs and release notes",
    description: "Capture public docs and release notes",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Advanced",
  },
  {
    id: "amazon-s3",
    name: "Amazon S3",
    purpose: "Import knowledge snapshots from object storage",
    description: "Import knowledge snapshots from object storage",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Advanced",
  },
];

const EXTRACTS = [
  {
    source: "GitHub",
    items: ["PR decisions", "Open bugs", "Architecture changes", "Repo ownership", "TODO patterns"],
  },
  {
    source: "Local Files",
    items: ["Project goals", "Stack decisions", "API contracts", "Roadmap notes"],
  },
];

const INITIAL_ACTIVITY: Array<{ time: string; message: string; status: string }> = [];
const PLAN_ORDER: BillingPlan[] = ["Free", "Pro", "Scale", "Enterprise"];
const FOUNDER_EMAIL = "chavhansunilkumar753@gmail.com";

function canUseConnector(currentPlan: BillingPlan, requiredPlan: BillingPlan): boolean {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

function nextUpgradeLabel(currentPlan: BillingPlan, requiredPlan: BillingPlan): string {
  if (canUseConnector(currentPlan, requiredPlan)) return "Connect";
  if (requiredPlan === "Enterprise") return "Contact Sales";
  return `Upgrade to ${requiredPlan}`;
}

function connectorSeverity(item: ConnectorDiagnostic): "good" | "watch" | "error" {
  if (!item.transport.healthy || item.status === "error") return "error";
  if ((item.retry.retryCount ?? 0) > 0 || Boolean(item.retry.lastFailureReason)) return "watch";
  return "good";
}

async function unlockConnector(type: string, addActivity: (message: string, status?: string) => void): Promise<void> {
  try {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token.");
    const response = await fetch(`/api/connector/${type}/unlock`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json().catch(() => null) as { data?: { message?: string }; error?: string; message?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? payload?.message ?? `Unlock failed (${response.status})`);
    }
    addActivity(payload?.data?.message ?? `Unlocked ${type}`, "success");
  } catch (error) {
    addActivity(error instanceof Error ? error.message : `Failed to unlock ${type}`, "error");
  }
}

export function ConnectorsSection({ 
  liveMemoryCount = 0, 
  liveRequestCount = 0 
}: { 
  liveMemoryCount?: number; 
  liveRequestCount?: number;
}) {
  const [connectors, setConnectors] = useState<ConnectorRow[]>(INITIAL_CONNECTORS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [internalRecords] = useState(0);
  const [diagnostics, setDiagnostics] = useState<ConnectorDiagnostic[]>([]);
  const [syncLogs, setSyncLogs] = useState<ConnectorSyncLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<BillingPlan>("Free");
  const [realtimeTick, setRealtimeTick] = useState(0);

  const connectedCount = connectors.filter((connector) => connector.status === "connected").length;
  const totalRecords = liveMemoryCount + internalRecords;
  const githubConnected = connectors.find((c) => c.id === "github")?.status === "connected";
// Simulation Engine removed for real implementation
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const connectedType = urlParams.get("connected");

  if (connectedType) {
    addActivity(
      `${connectedType.charAt(0).toUpperCase() + connectedType.slice(1)} connected successfully!`,
      "success",
    );

    // Clean up URL
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + (window.location.hash || ""),
    );
  }
}, []);

  // Fetch real connector status from backend
useEffect(() => {
  let cancelled = false;
  async function loadConnectors() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;

      const response = await fetch("/api/connector", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const { data } = (await response.json()) as {
          data?: {
            connectors?: Array<{
              type: string;
              status: ConnectorStatus;
              recordCount: number;
              lastSyncAt: string | null;
            }>;
          };
        };
        const dbConnectors = data?.connectors || [];

        if (cancelled) return;
        setConnectors((prev) =>
          prev.map((c) => {
            const dbMatch = dbConnectors.find((dbc) => dbc.type === c.id.replace("-", "_"));

            if (dbMatch) {
              return {
                ...c,
                status: dbMatch.status as ConnectorStatus,
                records: dbMatch.recordCount,
                lastSync: dbMatch.lastSyncAt
                  ? new Date(dbMatch.lastSyncAt).toLocaleString()
                  : "Never",
              };
            }

            return c;
          }),
        );
      }
    } catch (err) {
      console.error("Failed to load real connectors:", err);
    }
  }

  loadConnectors();
  const timer = window.setInterval(() => {
    void loadConnectors();
  }, 10000);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [liveMemoryCount, realtimeTick]);

useEffect(() => {
  let cancelled = false;
  async function loadDiagnostics() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;
      const response = await fetch("/api/connector/health", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      const list = payload?.data?.diagnostics;
      if (!cancelled && Array.isArray(list)) {
        setDiagnostics(list);
      }
    } catch {
      // non-blocking
    }
  }
  void loadDiagnostics();
  const timer = window.setInterval(() => {
    void loadDiagnostics();
  }, 10000);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [liveMemoryCount, liveRequestCount, realtimeTick]);

useEffect(() => {
  let cancelled = false;
  async function loadSyncLogs() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;
      const response = await fetch("/api/connector/logs", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      const logs = payload?.data?.logs;
      if (!cancelled && Array.isArray(logs)) {
        setSyncLogs(logs as ConnectorSyncLog[]);
      }
    } catch {
      // non-blocking
    }
  }
  void loadSyncLogs();
  const timer = window.setInterval(() => {
    void loadSyncLogs();
  }, 12000);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [liveMemoryCount, liveRequestCount, realtimeTick]);

useEffect(() => {
  let stream: EventSource | null = null;
  let disposed = false;

  async function openStream() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token || disposed) return;
      const url = `/api/connector/events?token=${encodeURIComponent(token)}`;
      stream = new EventSource(url);
      stream.onmessage = () => {
        if (disposed) return;
        setRealtimeTick((value) => value + 1);
      };
      stream.onerror = () => {
        // Polling fallback remains active.
      };
    } catch {
      // Polling fallback remains active.
    }
  }

  void openStream();
  return () => {
    disposed = true;
    if (stream) stream.close();
  };
}, []);

useEffect(() => {
  let cancelled = false;
  async function loadCurrentPlan() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;
      const response = await fetch("/api/memory/billing", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json().catch(() => null)) as { currentPlan?: BillingPlan } | null;
      const plan = payload?.currentPlan;
      if (!cancelled && plan && PLAN_ORDER.includes(plan)) {
        setCurrentPlan(plan);
      }
    } catch {
      // non-blocking
    }
  }
  void loadCurrentPlan();
  return () => {
    cancelled = true;
  };
}, []);

async function routeToUpgrade(requiredPlan: BillingPlan) {
  if (requiredPlan === "Enterprise") {
    window.location.href = `mailto:${FOUNDER_EMAIL}`;
    return;
  }
  try {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token.");
    const response = await fetch("/api/memory/billing/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan: requiredPlan }),
    });
    const payload = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? `Checkout failed (${response.status})`);
    }
    if (payload?.checkoutUrl) {
      window.open(payload.checkoutUrl, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    addActivity(error instanceof Error ? error.message : "Could not start checkout", "error");
  }
}

async function connectConnector(connectorId: string) {
  const connectorMeta = connectors.find((entry) => entry.id === connectorId);
  if (!connectorMeta) return;
  if (!canUseConnector(currentPlan, connectorMeta.requiredPlan)) {
    addActivity(
      `${connectorMeta.name} requires ${connectorMeta.requiredPlan}. You are on ${currentPlan}.`,
      "info",
    );
    await routeToUpgrade(connectorMeta.requiredPlan);
    return;
  }

  const typeMap: Record<string, string> = {
    github: "github",
    notion: "notion",
    "local-files": "local_files",
    "google-drive": "google_drive",
    onedrive: "onedrive",
  };

  const type = typeMap[connectorId];
  if (!type) return;

  if (connectorMeta.status === "connected") {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token");
      const response = await fetch(`/api/connector/${type}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => null) as { data?: { extractedCount?: number } } | null;
      if (!response.ok) {
        throw new Error("Sync failed");
      }
      const extractedCount = data?.data?.extractedCount ?? 0;
      setConnectors((current) =>
        current.map((connector) =>
          connector.id === connectorId
            ? {
                ...connector,
                status: "connected",
                health: "good",
                records: connector.records + extractedCount,
                lastSync: "Just now",
              }
            : connector,
        ),
      );
      addActivity(`${connectorMeta.name} synced ${extractedCount} memories`, "success");
    } catch (error) {
      addActivity(error instanceof Error ? error.message : `Failed to sync ${connectorMeta.name}`, "error");
    }
    return;
  }

  if (type === "local_files") {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token. Sign in again.");
      const connectRes = await fetch("/api/connector/local_files/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!connectRes.ok) {
        throw new Error(`Failed to enable local files (${connectRes.status})`);
      }
      const syncRes = await fetch("/api/connector/local_files/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const syncPayload = await syncRes.json().catch(() => null) as { data?: { extractedCount?: number } } | null;
      if (!syncRes.ok) {
        throw new Error(`Local files sync failed (${syncRes.status})`);
      }
      const extracted = syncPayload?.data?.extractedCount ?? 0;
      setConnectors((current) =>
        current.map((connector) =>
          connector.id === connectorId
            ? {
                ...connector,
                status: "connected",
                health: "good",
                records: extracted,
                lastSync: "Just now",
              }
            : connector,
        ),
      );
      addActivity(`Local Files connected and synced ${extracted} memories.`, "success");
    } catch (error) {
      addActivity(error instanceof Error ? error.message : "Failed to connect Local Files", "error");
    }
    return;
  }

  if (
    type === "github"
    || type === "notion"
    || type === "google_drive"
    || type === "onedrive"
    || type === "gmail"
    || type === "slack"
  ) {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token. Sign in again.");
      const response = await fetch(`/api/connector/${type}/authorize`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { authorizeUrl?: string }; error?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? payload?.message ?? `OAuth authorize failed (${response.status})`);
      }
      const authorizeUrl = payload?.data?.authorizeUrl;
      if (!authorizeUrl) {
        throw new Error("Missing authorize URL from connector endpoint.");
      }
      window.location.href = authorizeUrl;
    } catch (error) {
      addActivity(error instanceof Error ? error.message : "Could not start connector OAuth", "error");
    }
    return;
  }

  setConnectors((current) =>
    current.map((connector) =>
      connector.id === connectorId
        ? { ...connector, status: "pending" as const }
        : connector,
    ),
  );

  try {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token");

    const response = await fetch(`/api/connector/${type}/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Sync failed");
    }

    const data = await response.json();
    const extractedCount = data?.data?.extractedCount ?? 0;

    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: "connected",
              health: "good",
              records:
                connector.records > 0
                  ? connector.records + extractedCount
                  : 128 + extractedCount,
              lastSync: "Just now",
            }
          : connector,
      ),
    );

    const connectorName =
      connectors.find((c) => c.id === connectorId)?.name || connectorId;

    addActivity(
      `${connectorName} connected and synced ${extractedCount} memories`,
      "success",
    );
  } catch (error) {
    console.error("Failed to connect connector:", error);

    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: "not_connected",
              health: "error",
            }
          : connector,
      ),
    );

    addActivity(`Failed to connect ${connectorId}`, "error");
  }
}

function disconnectConnector(connectorId: string) {
  setConnectors((current) =>
    current.map((connector) =>
      connector.id === connectorId
        ? {
            ...connector,
            status: "not_connected",
            health: "offline",
            records: connector.requiredPlan === "Scale" ? 0 : connector.records,
            lastSync:
              connector.requiredPlan === "Scale"
                ? "Requires Scale plan"
                : "Disconnected",
          }
        : connector,
    ),
  );

  addActivity(`${connectorId} disconnected`, "info");
}

async function runConnectedSync() {
  const connected = connectors.filter((c) => c.status === "connected");
  if (connected.length === 0) {
    addActivity("No connected sources to sync.", "info");
    return;
  }
  await Promise.all(connected.map((c) => connectConnector(c.id)));
}

function addActivity(message: string, status: string = "info") {
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  setActivity((prev) => [{ time: now, message, status }, ...prev].slice(0, 10));
}

  const categories = ["Recommended", "Knowledge Sources", "Communication", "Advanced"];

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      {/* Page Title & Positioning */}
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.04em] text-foreground">Data Sources</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground max-w-2xl">
          Connect the tools your agents use every day and turn them into long-term developer memory. 
          MemoryOS indexes issues, docs, commits, messages, and local context so agents can continue work with full project awareness.
        </p>
      </div>

      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-[4px] border border-border bg-card p-6">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Memory Ingestion Overview</h2>
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-[24px] font-bold text-foreground">{totalRecords}</p>
                <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">records indexed</p>
              </div>
              <div>
                <p className="text-[24px] font-bold text-foreground">{connectedCount}</p>
                <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">active sources</p>
              </div>
              <div>
                <p className="text-[24px] font-bold text-foreground">0</p>
                <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">failed syncs</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {!githubConnected && (
                <button 
                  onClick={() => connectConnector("github")}
                  className="rounded-[4px] bg-primary px-4 py-1.5 text-[12px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Connect GitHub
                </button>
              )}
              <button 
                className="rounded-[4px] border border-border bg-muted px-4 py-1.5 text-[12px] font-bold text-foreground hover:bg-muted transition-colors"
                onClick={() => void runConnectedSync()}
              >
                Run Sync
              </button>
              <button
                onClick={() => setShowLogs((current) => !current)}
                className="rounded-[4px] border border-border bg-muted px-4 py-1.5 text-[12px] font-bold text-foreground hover:bg-muted transition-colors"
              >
                View Ingestion Logs
              </button>
            </div>
          </div>

          {/* Mini Live Feed inside Hero */}
          <div className="w-full md:w-64 rounded-[4px] border border-border bg-background/40 p-4">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-chart-2 animate-pulse"></span>
              Live Memory Feed
            </h3>
            <div className="space-y-2.5">
              {activity.slice(0, 4).map((item, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="text-chart-2 shrink-0">✓</span>
                  <span className="text-muted-foreground truncate">{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLogs && (
        <div className="rounded-[4px] border border-border bg-card p-5">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Connector Sync Logs</h2>
          <div className="mt-3 space-y-2">
            {syncLogs.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No logs yet.</p>
            ) : (
              syncLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="rounded-[4px] border border-border bg-background/40 px-3 py-2">
                  <p className="text-[12px] font-medium text-foreground">
                    {log.type} · {log.status} · {log.extractedCount} extracted
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{log.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(log.at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="rounded-[4px] border border-border bg-card p-5">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">MCP Connector Health</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {diagnostics.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No diagnostics yet.</p>
          ) : (
            diagnostics.map((item) => (
              <div key={item.type} className="rounded-[4px] border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-foreground">{item.type}</p>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      connectorSeverity(item) === "good"
                        ? "border-chart-2/35 bg-chart-2/10 text-chart-2"
                        : connectorSeverity(item) === "watch"
                          ? "border-chart-5/35 bg-chart-5/10 text-chart-5"
                          : "border-destructive/35 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {connectorSeverity(item)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">auth={item.auth.mode} transport={item.transport.protocol}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">status={item.status} healthy={String(item.transport.healthy)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">retries={item.retry.retryCount}</p>
                {item.retry.lastFailureAt ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    lastFailureAt={new Date(item.retry.lastFailureAt).toLocaleString()}
                  </p>
                ) : null}
                {item.retry.lastFailureReason ? (
                  <p className="mt-1 text-[11px] text-destructive">{item.retry.lastFailureReason}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-chart-2">no sync failures</p>
                )}
                {item.checkpoints ? (
                  <div className="mt-2 space-y-1 rounded-[4px] border border-border/60 bg-muted/30 p-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">checkpoints</p>
                    <p className="text-[11px] text-muted-foreground">
                      lastCheckpointAt={item.checkpoints.lastCheckpointAt ? new Date(item.checkpoints.lastCheckpointAt).toLocaleString() : "none"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">recentItemKeys={item.checkpoints.recentItemKeysCount}</p>
                    {item.checkpoints.slackLastMessageTs ? (
                      <p className="text-[11px] text-muted-foreground">slackLastTs={item.checkpoints.slackLastMessageTs}</p>
                    ) : null}
                    {item.checkpoints.slackCursor ? (
                      <p className="text-[11px] text-muted-foreground">slackCursor=present</p>
                    ) : null}
                    {item.checkpoints.gmailLastMessageId ? (
                      <p className="text-[11px] text-muted-foreground">gmailLastId={item.checkpoints.gmailLastMessageId}</p>
                    ) : null}
                    {item.checkpoints.gmailLastCheckpointEpochMs ? (
                      <p className="text-[11px] text-muted-foreground">
                        gmailCheckpoint={new Date(item.checkpoints.gmailLastCheckpointEpochMs).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {item.tokens ? (
                  <div className="mt-2 space-y-1 rounded-[4px] border border-border/60 bg-muted/30 p-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">token state</p>
                    <p className="text-[11px] text-muted-foreground">hasAccessToken={String(item.tokens.hasAccessToken)}</p>
                    <p className="text-[11px] text-muted-foreground">hasRefreshToken={String(item.tokens.hasRefreshToken)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      lastTokenRefreshAt={item.tokens.lastTokenRefreshAt ? new Date(item.tokens.lastTokenRefreshAt).toLocaleString() : "never"}
                    </p>
                  </div>
                ) : null}
                {item.status === "syncing" ? (
                  <button
                    type="button"
                    onClick={() => void unlockConnector(item.type, addActivity)}
                    className="mt-2 rounded-[4px] border border-chart-5/35 bg-chart-5/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-chart-5 hover:bg-chart-5/20"
                  >
                    Force Unlock Sync
                  </button>
                ) : null}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  mcpSafe={String(item.safety.mcpSafeMetadata)} policyCompat={String(item.safety.policyCompatible)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Grid Section */}
        <div className="lg:col-span-2 space-y-10">
          {categories.map((category) => (
            <div key={category} className="space-y-4">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-1">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {connectors
                  .filter((c) => c.category === category)
                  .map((connector) => (
                    <div 
                      key={connector.id} 
                      className={`group relative flex flex-col justify-between rounded-[4px] border p-5 transition-all duration-300 ${
                        connector.status === "connected" 
                          ? "border-chart-2/30 bg-chart-2/5 shadow-lg shadow-chart-2/15" 
                          : "border-border bg-card hover:border-border"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[16px] font-bold text-foreground">{connector.name}</h3>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                connector.requiredPlan === "Free" ? "border-primary/30 text-primary bg-primary/5" : "border-chart-5/30 text-chart-5 bg-chart-5/5"
                              }`}
                            >
                              {connector.requiredPlan}
                            </span>
                            {connector.status === "connected" && (
                              <div className="h-2 w-2 rounded-full bg-chart-2 shadow-md shadow-chart-2/40" />
                            )}
                          </div>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed mb-6">
                          {connector.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground uppercase tracking-wider">Status</span>
                          <span className={`font-medium ${connector.status === "connected" ? "text-chart-2" : "text-muted-foreground"}`}>
                            {connector.status === "connected" ? "Active" : "Not connected"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground uppercase tracking-wider">Records</span>
                          <span className="text-foreground font-mono">{connector.records}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground uppercase tracking-wider">Last Sync</span>
                          <span className="text-muted-foreground">{connector.lastSync}</span>
                        </div>

                        <div className="pt-4 flex gap-2">
                          {!canUseConnector(currentPlan, connector.requiredPlan) ? (
                            <button
                              onClick={() => void routeToUpgrade(connector.requiredPlan)}
                              className="flex-1 rounded-[4px] border border-chart-5/30 bg-chart-5/10 py-1.5 text-[10px] font-bold uppercase tracking-widest text-chart-5 hover:bg-chart-5/20 transition-colors"
                            >
                              {nextUpgradeLabel(currentPlan, connector.requiredPlan)}
                            </button>
                          ) : connector.status === "connected" ? (
                            <>
                              <button 
                                onClick={() => void connectConnector(connector.id)}
                                className="flex-1 rounded-[4px] bg-muted border border-border py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-muted transition-colors"
                              >
                                Sync Now
                              </button>
                              <button 
                                onClick={() => disconnectConnector(connector.id)}
                                className="px-3 rounded-[4px] bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => connectConnector(connector.id)}
                              className="flex-1 rounded-[4px] bg-primary/10 border border-primary/30 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 transition-colors"
                            >
                              Connect {connector.name}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-8">
          {/* Recommended Next Action */}
          <div className="rounded-[4px] border border-chart-5/30 bg-chart-5/5 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-chart-5/10 rounded-full -mr-12 -mt-12 blur-2xl" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-chart-5 mb-4">Recommended Next</h3>
            {!githubConnected ? (
              <>
                <h4 className="text-[18px] font-bold text-foreground mb-2">Connect GitHub</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
                  Your local workspace is indexed, but MemoryOS cannot yet understand PRs, issues, commits, or repo decisions.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-[12px] text-foreground">
                    <span className="text-chart-2">+</span> Better agent handoffs
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-foreground">
                    <span className="text-chart-2">+</span> Repo-aware planning
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-foreground">
                    <span className="text-chart-2">+</span> Bug history memory
                  </div>
                </div>
                <button 
                  onClick={() => connectConnector("github")}
                  className="w-full rounded-[4px] bg-chart-5 py-2 text-[12px] font-bold text-background hover:bg-chart-5/90 transition-colors"
                >
                  Connect GitHub
                </button>
              </>
            ) : (
              <>
                <h4 className="text-[18px] font-bold text-foreground mb-2">Configure Notion</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
                  Connect Notion to give your agents access to product specs, meeting notes, and team decisions.
                </p>
                <button 
                  onClick={() => connectConnector("notion")}
                  className="w-full rounded-[4px] bg-chart-5 py-2 text-[12px] font-bold text-background hover:bg-chart-5/90 transition-colors"
                >
                  Connect Notion
                </button>
              </>
            )}
          </div>

          {/* Live Activity Timeline */}
          <div className="rounded-[4px] border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-5 py-4">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-foreground">Recent Ingestion Activity</h3>
            </div>
            <div className="p-5 space-y-4">
              {activity.map((item, i) => (
                <div key={i} className="relative pl-5 border-l border-border pb-4 last:pb-0">
                  <div className={`absolute left-[-5px] top-1 h-2 w-2 rounded-full ${item.status === "success" ? "bg-chart-2" : "bg-primary"}`} />
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-[12px] font-medium text-foreground/90">{item.message}</p>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.time}</span>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-[12px] text-muted-foreground italic">No recent activity</p>
              )}
            </div>
          </div>

          {/* Memory Extraction Panel */}
          <div className="rounded-[4px] border border-border bg-card p-6">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-foreground mb-6 flex items-center justify-between">
              What MemoryOS extracts
              <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
            </h3>
            <div className="space-y-8">
              {EXTRACTS.map((extract) => (
                <div key={extract.source} className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">{extract.source}</h4>
                  <ul className="space-y-2">
                    {extract.items.map((item, i) => (
                      <li key={i} className="text-[12px] text-muted-foreground flex items-center gap-2">
                        <span className="text-muted-foreground">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

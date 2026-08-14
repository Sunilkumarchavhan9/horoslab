"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, CheckCircle2, Network, RefreshCw } from "lucide-react";
import { useOnboardingStore } from "../../store";
import { ConnectorBrandAvatar } from "@/components/continuity-lab/connector-brand-icons";
import { listSources, isLiveCompanySource, type CompanySource } from "@/lib/company-sources-api";
import { resolveActiveEpochWorkspaceId } from "@/lib/epoch-api";

type SyncConnector = {
  id: "github" | "slack" | "notion" | "jira";
  name: string;
  description: string;
};

const CONNECTORS: SyncConnector[] = [
  { id: "github", name: "GitHub", description: "Repositories and PRs" },
  { id: "slack", name: "Slack", description: "Channel history and decisions" },
  { id: "notion", name: "Notion", description: "Docs and playbooks" },
  { id: "jira", name: "Jira", description: "Issues and work tracking" },
];

function sourceMatchesConnector(source: CompanySource, key: string): boolean {
  const provider = (source.provider ?? "").toLowerCase();
  const providerName = (source.providerName ?? "").toLowerCase();
  const type = (source.type ?? "").toLowerCase();
  return provider.includes(key) || providerName.includes(key) || type.includes(key);
}

function connectorStatus(source?: CompanySource | null): string {
  if (!source) return "Not connected";
  const status = (source.status ?? "").toLowerCase();
  if (status === "connected" || status === "synced") return "Connected";
  if (status === "syncing") return "Syncing";
  if (status === "error") return "Needs retry";
  if (status === "disconnected") return "Disconnected";
  return source.status ?? "Unknown";
}

function connectorProgress(source?: CompanySource | null): number {
  if (!source) return 0;
  const status = (source.status ?? "").toLowerCase();
  const hasData = Boolean(source.lastSyncedAt || (source.itemCount ?? 0) > 0 || (source.memoryCount ?? 0) > 0);

  if (status === "synced" || (status === "connected" && hasData)) return 100;
  if (status === "syncing") return hasData ? 72 : 42;
  if (status === "connected") return 58;
  if (status === "error") return hasData ? 34 : 18;
  if (status === "disconnected") return 10;
  return 0;
}

function syncStatusTone(progress: number): string {
  if (progress >= 100) return "text-emerald-500";
  if (progress >= 70) return "text-blue-500";
  if (progress >= 30) return "text-amber-500";
  return "text-muted-foreground";
}

export function OnboardingSyncView() {
  const { setStep, setSyncProgress, completeOnboarding } = useOnboardingStore();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [sources, setSources] = useState<CompanySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      try {
        const nextWorkspaceId = await resolveActiveEpochWorkspaceId();
        if (mounted) {
          setWorkspaceId(nextWorkspaceId);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load workspace.");
        }
      }
    }

    void loadWorkspace();

    const syncWorkspace = () => {
      void loadWorkspace();
    };

    window.addEventListener("focus", syncWorkspace);
    window.addEventListener("storage", syncWorkspace);

    return () => {
      mounted = false;
      window.removeEventListener("focus", syncWorkspace);
      window.removeEventListener("storage", syncWorkspace);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      if (!workspaceId) {
        setSources([]);
        setLoading(false);
        setError("Create or select an organization and connect your sources first.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextSources = await listSources();
        if (cancelled) return;
        setSources(nextSources);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load sync state.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSources();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, refreshTick]);

  const connectorRows = useMemo(
    () =>
      CONNECTORS.map((connector) => {
        const source = sources.find((item) => sourceMatchesConnector(item, connector.id)) ?? null;
        return {
          ...connector,
          source,
          connected: Boolean(source && isLiveCompanySource(source)),
          status: connectorStatus(source),
          progress: connectorProgress(source),
          hasData: Boolean(source && (source.lastSyncedAt || (source.itemCount ?? 0) > 0 || (source.memoryCount ?? 0) > 0)),
        };
      }),
    [sources],
  );

  const syncProgress = useMemo(() => {
    if (connectorRows.length === 0) return 0;

    const total = connectorRows.reduce((sum, row) => sum + row.progress, 0);
    const progress = Math.round(total / connectorRows.length);
    return Math.max(0, Math.min(100, progress));
  }, [connectorRows]);

  const connectedCount = connectorRows.filter((row) => row.connected).length;
  const indexedCount = connectorRows.filter((row) => row.hasData).length;
  const complete = connectedCount === connectorRows.length && indexedCount === connectorRows.length && connectorRows.length > 0;

  useEffect(() => {
    setSyncProgress(syncProgress);
  }, [setSyncProgress, syncProgress]);

  useEffect(() => {
    const activeSync = connectorRows.some((row) => row.status === "Syncing");
    if (!activeSync && complete) return;

    const timer = window.setInterval(() => {
      setRefreshTick((tick) => tick + 1);
    }, 2500);

    return () => window.clearInterval(timer);
  }, [connectorRows, complete]);

  async function handleRefresh() {
    setRefreshTick((tick) => tick + 1);
  }

  async function handleEnterEpoch() {
    setCompleting(true);
    try {
      completeOnboarding();
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-in slide-in-from-right-8 duration-500 fade-in px-8 py-10 bg-card border border-border rounded-xl shadow-xl shadow-black/5">
      <div className="flex flex-col gap-3 text-center items-center">
        <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-2 border border-border relative">
          <Network className="size-6 text-foreground relative z-10" />
          <div className="absolute inset-0 border border-emerald-500 rounded-full animate-ping opacity-20" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Building the Mission Control Graph</h1>
        <p className="text-muted-foreground text-[15px] max-w-md">
          Epoch now reads live source state from your connected systems. This screen tracks the actual backend sync
          status instead of a local animation.
        </p>
      </div>

      <div className="flex flex-col gap-6 mt-8">
        {error ? (
          <div className="rounded-[18px] border border-[#f4c7c7] bg-[#fff6f6] px-4 py-3 text-[13px] leading-6 text-[#8a2b2b]">
            {error}
          </div>
        ) : null}

        <section className="rounded-[22px] border border-border bg-background/80 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Live sync status
              </p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-foreground">
                Repository and workspace data are being indexed
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-muted-foreground">
                The onboarding flow now reflects live connector status from GitHub, Slack, Notion, and Jira. When
                those sources have data, Mission Control is ready for the first question.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-[12px] font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Sync Progress</span>
              <span className={syncStatusTone(syncProgress)}>{syncProgress}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300 ease-out"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{connectedCount}/{connectorRows.length} connected</span>
              <span>{indexedCount}/{connectorRows.length} indexed</span>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {connectorRows.map((connector) => (
            <article
              key={connector.id}
              className="rounded-[18px] border border-border bg-card px-4 py-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <ConnectorBrandAvatar
                  connectorId={connector.id}
                  className="size-11 rounded-[14px] border border-border bg-white"
                  iconClassName="size-6"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">{connector.name}</div>
                      <div className="text-[12px] text-muted-foreground">{connector.description}</div>
                    </div>
                    <div
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                        connector.status === "Connected" || connector.status === "Synced"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : connector.status === "Syncing"
                            ? "bg-blue-500/10 text-blue-600"
                            : connector.status === "Needs retry"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {connector.status}
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={[
                        "h-full rounded-full transition-all duration-300",
                        connector.progress >= 100
                          ? "bg-emerald-500"
                          : connector.progress >= 70
                            ? "bg-blue-500"
                            : connector.progress >= 30
                              ? "bg-amber-500"
                              : "bg-muted-foreground",
                      ].join(" ")}
                      style={{ width: `${connector.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[12px] text-muted-foreground">
                    {connector.source
                      ? connector.hasData
                        ? `${connector.source.itemCount ?? 0} items · ${connector.source.memoryCount ?? 0} memories`
                        : "Connected and waiting on initial indexed data."
                      : "Connect this source to start indexing."}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="flex flex-col bg-[#0a0a0a] rounded-lg border border-[#27272a] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#27272a] bg-[#121212]">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-500/80" />
              <div className="size-2.5 rounded-full bg-yellow-500/80" />
              <div className="size-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="ml-2 text-[11px] font-mono text-[#71717a]">sync_engine.log</span>
          </div>

          <div className="p-4 font-mono text-[12px] flex flex-col gap-1.5 min-h-32 justify-end text-emerald-400">
            {connectorRows.some((row) => row.connected) && <div>[SYS] Live source lease acquired from backend.</div>}
            {connectorRows.some((row) => row.status === "Syncing") && (
              <div className="text-blue-400">[SYNC] Backfill in progress across connected sources...</div>
            )}
            {indexedCount > 0 && (
              <div className="text-yellow-400">[GRAPH] Indexed {indexedCount} source(s) into the Mission Control graph.</div>
            )}
            {complete && <div className="text-white font-bold">[VERIFY] Initial sync complete. Ready for questions.</div>}

            {!complete && (
              <div className="flex items-center gap-2 text-[#71717a] mt-2">
                <Activity className="size-3 animate-pulse" /> Watching backend source state...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => setStep("connectors")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium px-4 py-2 transition-colors"
        >
          <ArrowRight className="size-4 rotate-180" />
          Back to Connectors
        </button>

        {complete ? (
          <button
            type="button"
            onClick={handleEnterEpoch}
            disabled={completing || loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-medium px-6 py-2.5 rounded-md transition-colors animate-in fade-in"
          >
            {completing ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Enter Mission Control
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center gap-2 bg-muted text-muted-foreground font-medium px-6 py-2.5 rounded-md cursor-not-allowed"
          >
            Syncing...
          </button>
        )}
      </div>
    </div>
  );
}

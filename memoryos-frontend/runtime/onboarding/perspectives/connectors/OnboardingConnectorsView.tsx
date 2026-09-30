"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Blocks, CheckCircle2, Loader2, RefreshCw, Unplug, Zap } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useOnboardingStore } from "../../store";
import { cn } from "@/lib/utils";
import { authorizeConnector } from "@/lib/continuity-lab/connector-actions";
import { listSources, disconnectSource, isLiveCompanySource, reconnectSource, syncSourceNow, type CompanySource } from "@/lib/company-sources-api";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { resolveActiveDhyraWorkspaceId } from "@/lib/dhyra-api";
import { ConnectorBrandAvatar } from "@/components/continuity-lab/connector-brand-icons";

const CONNECTORS = [
  { id: "github", name: "GitHub", description: "Repositories and PRs" },
  { id: "slack", name: "Slack", description: "Channel history" },
] as const;

type ConnectorId = (typeof CONNECTORS)[number]["id"];

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

export function OnboardingConnectorsView() {
  const { setStep, connectedApps, setConnectedApps, startSync } = useOnboardingStore();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sources, setSources] = useState<CompanySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const urlError = searchParams.get("connectorError");
    if (urlError) {
      const detail = searchParams.get("detail");
      setError(detail || "Failed to authorize connector.");
      
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("connectorError");
      newParams.delete("detail");
      router.replace(`${pathname}?${newParams.toString()}`);
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      try {
        const nextWorkspaceId = await resolveActiveDhyraWorkspaceId();
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
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextSources = await listSources();
        if (cancelled) return;
        setSources(nextSources);
        setConnectedApps(
          CONNECTORS
            .filter((connector) =>
              nextSources.some((source) => sourceMatchesConnector(source, connector.id)),
            )
            .map((connector) => connector.id),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load connectors.");
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
  }, [workspaceId, refreshTick, setConnectedApps]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let closed = false;
    let debounceTimer: number | null = null;
    let retryTimer: number | null = null;

    async function connectStream() {
      const token = await getOrCreateMemoryToken();
      if (!token || closed) return;

      eventSource = new EventSource(`/api/connector/events?token=${encodeURIComponent(token)}`);
      eventSource.onmessage = () => {
        if (debounceTimer) window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
          setRefreshTick((tick) => tick + 1);
        }, 300);
      };
      eventSource.onerror = () => {
        eventSource?.close();
        if (closed) return;
        retryTimer = window.setTimeout(() => {
          void connectStream();
        }, 10_000);
      };
    }

    void connectStream();

    return () => {
      closed = true;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
      eventSource?.close();
    };
  }, []);

  const connectors = useMemo(
    () =>
      CONNECTORS.map((connector) => {
        const source = sources.find((item) => sourceMatchesConnector(item, connector.id)) ?? null;
        return {
          ...connector,
          source,
          status: connectorStatus(source),
          connected: Boolean(source && isLiveCompanySource(source)),
        };
      }),
    [sources],
  );

  async function refreshSources() {
    if (!workspaceId) return;
    const nextSources = await listSources();
    setSources(nextSources);
    setConnectedApps(
      CONNECTORS
        .filter((connector) => nextSources.some((source) => sourceMatchesConnector(source, connector.id)))
        .map((connector) => connector.id),
    );
  }

  async function handleConnect(connectorId: ConnectorId) {
    setError(null);
    setConnecting(connectorId);
    try {
      await authorizeConnector(connectorId);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : `Could not connect ${connectorId}.`);
      setConnecting(null);
    }
  }

  async function handleDisconnect(connectorId: ConnectorId, source: CompanySource | null) {
    if (!source) return;
    setError(null);
    setConnecting(connectorId);
    try {
      await disconnectSource(source.id);
      await refreshSources();
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : `Could not disconnect ${connectorId}.`);
    } finally {
      setConnecting(null);
    }
  }

  async function handleRetry(connectorId: ConnectorId, source: CompanySource | null) {
    if (!source) {
      await handleConnect(connectorId);
      return;
    }

    setError(null);
    setSyncing(connectorId);
    try {
      await syncSourceNow(source.id);
      await refreshSources();
    } catch (syncError) {
      if ((source.status ?? "").toLowerCase() === "disconnected" || (source.status ?? "").toLowerCase() === "error") {
        try {
          await reconnectSource(source.id);
          await refreshSources();
        } catch (reconnectError) {
          setError(reconnectError instanceof Error ? reconnectError.message : `Could not retry ${connectorId}.`);
        }
      } else {
        setError(syncError instanceof Error ? syncError.message : `Could not retry ${connectorId}.`);
      }
    } finally {
      setSyncing(null);
    }
  }

  const handleNext = () => {
    startSync();
    setStep("sync");
  };

  return (
    <div className="flex w-full flex-col gap-6 animate-in slide-in-from-right-8 duration-500 fade-in px-8 py-10">
      <div className="flex flex-col gap-3 text-center items-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full border border-border bg-background/80">
          <Blocks className="size-6 text-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Connect Mission Control Sources</h1>
        <p className="text-muted-foreground text-[15px] max-w-md">
          Connect GitHub and Slack to power the first Mission Control sync. Hover a connector to reveal Connect.
        </p>
      </div>

      {error ? (
        <div className="rounded-[18px] border border-[#f4c7c7] bg-[#fff6f6] px-4 py-3 text-[13px] leading-6 text-[#8a2b2b]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {connectors.map((connector) => {
          const isConnected = connector.connected;
          const isConnecting = connecting === connector.id;
          const isRetrying = syncing === connector.id;

          return (
            <div
              key={connector.id}
              className={cn(
                "group relative overflow-hidden rounded-[24px] px-1 py-4 text-left transition-all duration-200",
                "hover:-translate-y-0.5",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <ConnectorBrandAvatar
                    connectorId={connector.id}
                    className={cn(
                      "size-12 rounded-[16px] bg-background/70",
                      isConnected ? "ring-2 ring-emerald-400/20" : "",
                    )}
                    iconClassName="size-6"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      Connector
                    </div>
                    <div className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-foreground">
                      {connector.name}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
                  )}
                >
                  {connector.status}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={() => void handleConnect(connector.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-all duration-200 hover:bg-blue-600 md:opacity-0 md:translate-y-1 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto"
                  >
                    {isConnecting ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                    Connect {connector.name}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-[13px] font-semibold text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    Connected
                  </span>
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRetry(connector.id, connector.source);
                  }}
                  disabled={loading || isRetrying}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRetrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Retry connection
                </button>

                {isConnected ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDisconnect(connector.id, connector.source);
                    }}
                    disabled={loading || connecting === connector.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Unplug className="size-4" />
                    Disconnect
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between pt-6">
        <button
          onClick={() => setStep("team")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium px-4 py-2 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={connectedApps.length === 0 || loading}
          className="flex items-center gap-2 bg-foreground text-background font-medium px-6 py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Begin Syncing in Mission Control <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

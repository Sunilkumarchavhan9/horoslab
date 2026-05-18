"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type SettingsTab = "Organization" | "Advanced";
type ConnectorFilter = "All" | "OAuth" | "Services";

type ConnectorRecord = {
  id: string;
  type: string;
  name: string;
  status: "connected" | "not_connected" | "pending";
};

type SettingsPayload = {
  workspaceName: string;
  organization?: {
    organizationId?: string;
    ownerName?: string;
    ownerEmail?: string;
    contextEnabled?: boolean;
  };
};

type SettingsSectionProps = {
  workspaceName: string;
  ownerName: string;
  ownerEmail: string;
  organizationId: string;
};

const CONNECTOR_FILTERS: ConnectorFilter[] = ["All", "OAuth", "Services"];

function mapConnectorFilter(type: string): Exclude<ConnectorFilter, "All"> {
  const value = type.toLowerCase();
  if (value.includes("s3") || value.includes("web")) return "Services";
  return "OAuth";
}

export function SettingsSection({ workspaceName, ownerName, ownerEmail, organizationId }: SettingsSectionProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Organization");
  const [connectorFilter, setConnectorFilter] = useState<ConnectorFilter>("All");
  const [connectorSearch, setConnectorSearch] = useState("");
  const [orgName, setOrgName] = useState(workspaceName);
  const [orgContextEnabled, setOrgContextEnabled] = useState(false);
  const [runtimeSettings, setRuntimeSettings] = useState<SettingsPayload | null>(null);
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadLiveSettings = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token.");

    const [settingsRes, connectorsRes] = await Promise.all([
      fetch("/api/memory/settings", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch("/api/connector", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const settingsPayload = (await settingsRes.json().catch(() => null)) as SettingsPayload | null;
    if (!settingsRes.ok || !settingsPayload) {
      throw new Error("Could not load live settings.");
    }

    const connectorPayload = (await connectorsRes.json().catch(() => null)) as
      | { data?: { connectors?: ConnectorRecord[] } }
      | null;
    const rawConnectors = connectorPayload?.data?.connectors ?? [];
    const dedupedConnectors = Array.from(
      new Map(rawConnectors.map((connector) => [connector.type || connector.id, connector])).values(),
    ) as ConnectorRecord[];

    setRuntimeSettings(settingsPayload);
    setOrgName(settingsPayload.workspaceName || workspaceName);
    setOrgContextEnabled(Boolean(settingsPayload.organization?.contextEnabled));
    setConnectors(dedupedConnectors);
    setErrorMessage(null);
    setLastUpdated(new Date().toISOString());
  }, [workspaceName]);

  useEffect(() => {
    void loadLiveSettings().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load settings.");
    });

    const timer = window.setInterval(() => {
      void loadLiveSettings().catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Failed to refresh settings.");
      });
    }, 12000);

    return () => window.clearInterval(timer);
  }, [loadLiveSettings]);

  const visibleConnectors = useMemo(() => {
    const query = connectorSearch.trim().toLowerCase();
    return connectors.filter((connector) => {
      const connectorType = mapConnectorFilter(connector.type);
      const matchesFilter = connectorFilter === "All" || connectorType === connectorFilter;
      const matchesSearch =
        query.length === 0 || `${connector.name} ${connector.type}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [connectorFilter, connectorSearch, connectors]);

  async function saveSettings(nextContextEnabled: boolean) {
    try {
      setSaving(true);
      setStatusMessage(null);
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token.");

      const response = await fetch("/api/memory/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceName: orgName.trim(),
          contextEnabled: nextContextEnabled,
        }),
      });

      const payload = (await response.json().catch(() => null)) as SettingsPayload | null;
      if (!response.ok || !payload) {
        throw new Error("Could not save settings.");
      }

      setRuntimeSettings(payload);
      setOrgName(payload.workspaceName || orgName);
      setOrgContextEnabled(Boolean(payload.organization?.contextEnabled));
      setStatusMessage("Settings saved.");
      setLastUpdated(new Date().toISOString());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function copyOrgId() {
    const id = runtimeSettings?.organization?.organizationId || organizationId;
    try {
      await navigator.clipboard.writeText(id);
      setStatusMessage("Organization ID copied.");
    } catch {
      setStatusMessage("Could not copy organization ID.");
    }
  }

  const displayOwnerName = runtimeSettings?.organization?.ownerName || ownerName;
  const displayOwnerEmail = runtimeSettings?.organization?.ownerEmail || ownerEmail;
  const displayOrgId = runtimeSettings?.organization?.organizationId || organizationId;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Settings</h1>
        </div>
      </div>
      {errorMessage ? <div className="mt-2 rounded-[8px] border border-destructive/35 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{errorMessage}</div> : null}
      {statusMessage ? <div className="mt-2 rounded-[8px] border border-border bg-card px-3 py-2 text-[12px] text-foreground">{statusMessage}</div> : null}

      <div className="mt-2.5 flex items-center border-b border-border">
        {(["Organization", "Advanced"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Organization" ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
              <p className="text-[14px] font-semibold">Organization Name</p>
              <div className="space-y-2">
                <input
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  className="w-full rounded-[8px] border border-border bg-muted px-3 py-2.5 text-[13px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => void saveSettings(orgContextEnabled)}
                  disabled={saving}
                  className="rounded-[7px] border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] tracking-[0.08em] text-primary disabled:opacity-50"
                >
                  SAVE
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
              <p className="text-[14px] font-semibold">Organization ID</p>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-[8px] border border-border bg-muted/50 px-3 py-2.5 font-mono text-[12px] text-muted-foreground">
                  {displayOrgId}
                </div>
                <button type="button" onClick={copyOrgId} className="rounded-[7px] border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                  COPY
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
              <p className="text-[14px] font-semibold">Organization Context</p>
              <div>
                <button
                  type="button"
                  onClick={() => void saveSettings(!orgContextEnabled)}
                  disabled={saving}
                  className={`rounded-[8px] border px-3 py-2 text-[11px] tracking-[0.08em] ${
                    orgContextEnabled ? "border-chart-2/35 bg-chart-2/10 text-chart-2" : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {orgContextEnabled ? "ENABLED" : "ENABLE"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="text-[16px] font-semibold tracking-[-0.02em]">Connector Configurations</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Live connector statuses from backend.</p>

            <div className="mt-3">
              <input
                value={connectorSearch}
                onChange={(event) => setConnectorSearch(event.target.value)}
                placeholder="Search connectors..."
                className="w-full rounded-[8px] border border-border bg-muted px-3 py-2.5 text-[13px] outline-none"
              />
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              {CONNECTOR_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setConnectorFilter(filter)}
                  className={`rounded-[7px] border px-2.5 py-1.5 text-[11px] tracking-[0.08em] ${
                    connectorFilter === filter ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {visibleConnectors.map((connector) => (
                <div key={connector.id} className="rounded-[10px] border border-border bg-card px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-muted text-[13px] font-bold text-foreground">
                      {connector.name.slice(0, 1)}
                    </div>
                    <span className={`rounded-[6px] border px-2 py-0.5 text-[10px] tracking-[0.1em] ${
                      connector.status === "connected" ? "border-chart-2/35 bg-chart-2/10 text-chart-2" : "border-border bg-muted/50 text-muted-foreground"
                    }`}>
                      {connector.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] font-semibold">{connector.name}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{connector.type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "Advanced" ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Name</p>
            <p className="mt-1 text-[24px] font-semibold">{displayOwnerName}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Email</p>
            <p className="mt-1 text-[14px] text-muted-foreground">{displayOwnerEmail}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Organization</p>
            <p className="mt-1 text-[14px] text-muted-foreground">{orgName}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

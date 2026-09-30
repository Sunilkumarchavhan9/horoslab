"use client";

import { useEffect, useMemo, useState } from "react";
import { Cable, CheckCircle2, ExternalLink, RefreshCw, Search, Unplug } from "lucide-react";
import { authorizeConnector, disconnectConnector } from "@/lib/continuity-lab/connector-actions";
import { listDhyraIntegrations, type DhyraIntegrationConnection } from "@/lib/dhyra-api";
import { fetchConnectorList, type ConnectorListRow } from "@/lib/continuity-lab/connector-list";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { cn } from "@/lib/utils";

const supported = [
  { id: "github", name: "GitHub", description: "Repositories, issues, pull requests, and checks" },
  { id: "slack", name: "Slack", description: "Messages, channels, and approved notifications" },
  { id: "jira", name: "Jira", description: "Issues, projects, and workflow updates" },
  { id: "linear", name: "Linear", description: "Issues, projects, and team operations" },
  { id: "google_drive", name: "Google Drive", description: "Governed document and file access" },
  { id: "onedrive", name: "Microsoft OneDrive", description: "Governed enterprise file access" },
  { id: "zendesk", name: "Zendesk", description: "Support tickets and customer signals" },
];

export function DeveloperIntegrationsView({ workspaceId }: { workspaceId?: string | null }) {
  const [rows, setRows] = useState<DhyraIntegrationConnection[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!workspaceId) return;
    try {
      setError(null);
      const [result, connectorRows] = await Promise.all([
        listDhyraIntegrations(workspaceId, { limit: 100 }),
        fetchConnectorList(),
      ]);

      // The connector vault is authoritative for OAuth state. Dhyra rows are
      // the workspace projection used for mission policy and sync metadata.
      // Merge them here so the UI cannot show a stale shadow row as disconnected.
      const merged = new Map(
        result.integrations.map((integration) => [integration.provider.toLowerCase(), integration]),
      );
      for (const connector of connectorRows) {
        const provider = connector.type.toLowerCase();
        const existing = merged.get(provider);
        if (existing) {
          merged.set(provider, {
            ...existing,
            status: connector.status,
          });
        } else {
          merged.set(provider, connectorRowToIntegration(connector, workspaceId));
        }
      }
      setRows(Array.from(merged.values()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load integrations.");
    } finally {
      setLoading(false);
    }
};

function connectorRowToIntegration(
  connector: ConnectorListRow,
  workspaceId: string,
): DhyraIntegrationConnection {
  return {
    id: `connector-${connector.type}`,
    workspaceId,
    institutionId: null,
    name: connector.type,
    provider: connector.type,
    status: connector.status,
    config: null,
    proof: { source: "connector-vault" },
  };
}

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    const onConnectorResult = (event: MessageEvent<unknown>) => {
      if (!event.data || typeof event.data !== "object") return;
      const data = event.data as { type?: string };
      if (data.type === "memoryos:connector-result") void load();
    };
    window.addEventListener("message", onConnectorResult);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("message", onConnectorResult);
    };
  }, [workspaceId]);

  const visible = useMemo(() => rows.filter((row) => {
    const text = `${row.name} ${row.provider} ${row.status ?? ""}`.toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (status === "All" || row.status === status);
  }), [rows, search, status]);

  const connect = async (provider: string) => {
    try {
      setBusy(provider);
      await authorizeConnector(provider);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to connect ${provider}.`);
    } finally {
      // OAuth continues in the new tab; this button only represents opening
      // that flow and must not remain stuck after the authorize URL is ready.
      setBusy(null);
    }
  };

  const disconnect = async (row: DhyraIntegrationConnection) => {
    try {
      setBusy(row.provider);
      await disconnectConnector(row.provider);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to disconnect ${row.provider}.`);
    } finally {
      setBusy(null);
    }
  };

  const connectedByProvider = new Map(rows.map((row) => [row.provider.toLowerCase(), row]));
  return <div className="flex h-full flex-col bg-background">
    <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-6 py-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground"><Cable className="size-5 text-primary" /> Integration Gateway</h1>
        <p className="mt-1 text-xs text-muted-foreground">Connect approved external systems that missions may use. Credentials stay in the connector vault and are never exposed to workers.</p>
      </div>
      <div className="flex gap-2"><button type="button" onClick={() => exportLiveRows("dhyra-integrations.json", visible)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Export</button><button type="button" onClick={() => void load()} className="rounded-md border border-border p-2 hover:bg-muted" aria-label="Refresh integrations"><RefreshCw className="size-3.5" /></button></div>
    </div>
    <div className="flex shrink-0 items-center gap-2 border-b border-border/50 bg-muted/20 px-6 py-3">
      <div className="relative w-72"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search integrations..." className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs" /></div>
      <LiveFilterDropdown label="Status" value={status} options={["All", ...Array.from(new Set(rows.map((row) => row.status).filter((value): value is string => Boolean(value))))]} onChange={setStatus} />
    </div>
    <div className="flex-1 overflow-auto p-6">
      {error && <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {supported.map((item) => { const connection = connectedByProvider.get(item.id.toLowerCase()); const normalizedStatus = connection?.status?.toLowerCase(); const connected = normalizedStatus === "connected" || normalizedStatus === "syncing" || normalizedStatus === "synced" || normalizedStatus === "active"; return <article key={item.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-foreground">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{item.description}</p></div><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", connected ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>{connection?.status ?? "not connected"}</span></div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">{connection?.lastSyncAt ? <span>Last sync {new Date(connection.lastSyncAt).toLocaleString()}</span> : <span>OAuth and scoped permissions required</span>}{connected && connection ? <button type="button" onClick={() => void disconnect(connection)} disabled={busy === item.id} className="flex items-center gap-1 text-red-500"><Unplug className="size-3" /> Disconnect</button> : <button type="button" onClick={() => void connect(item.id)} disabled={busy === item.id} className="flex items-center gap-1 font-semibold text-primary">{busy === item.id ? "Opening..." : "Connect"}<ExternalLink className="size-3" /></button>}</div>
          {connected && <p className="mt-3 flex items-center gap-1 text-[11px] text-emerald-500"><CheckCircle2 className="size-3" /> Available to missions only through policy-approved tool calls</p>}
        </article>; })}
      </div>
      {!loading && visible.length === 0 && rows.length > 0 && <p className="mt-8 text-center text-xs text-muted-foreground">No connected integrations match the current filter.</p>}
      {loading && <p className="mt-8 text-center text-xs text-muted-foreground">Loading integration state...</p>}
      {!loading && !error && rows.length === 0 && <p className="mt-8 text-center text-xs text-muted-foreground">No integrations are connected. Connect one above to make it available to governed missions.</p>}
    </div>
  </div>;
}

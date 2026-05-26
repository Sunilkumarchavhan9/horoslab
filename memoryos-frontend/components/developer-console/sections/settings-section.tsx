"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Settings } from "lucide-react";
import {
  INTEL_LINE_CELL,
  IntelLineGridFrame,
  IntelPageStack,
  IntelSectionGutter,
  IntelTileGrid,
  intelPanelBleed,
  intelSectionRootClass,
  IntelSectionScroll,
  OverviewChartRow,
} from "@/components/developer-console/intel-line-grid";
import {
  IntelligenceBreadcrumb,
  IntelligenceDataTable,
  IntelligenceEntityHeader,
  IntelligenceFlowChart,
  IntelligenceGhostButton,
  IntelligenceStatusBadge,
  IntelligenceWorkspace,
  type IntelChartPoint,
  type IntelTableRow,
} from "@/components/developer-console/os-intelligence-shell";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import type { BillingPlan } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

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
  currentPlan?: BillingPlan;
  realtimeVersion?: number;
};

const CONNECTOR_FILTERS: ConnectorFilter[] = ["All", "OAuth", "Services"];
const SETTINGS_FETCH_MIN_MS = 15_000;

function mapConnectorFilter(type: string): Exclude<ConnectorFilter, "All"> {
  const value = type.toLowerCase();
  if (value.includes("s3") || value.includes("web")) return "Services";
  return "OAuth";
}

function connectorStatusTone(status: ConnectorRecord["status"]): IntelTableRow["sourceTone"] {
  if (status === "connected") return "cyan";
  if (status === "pending") return "amber";
  return "slate";
}

function buildConnectorChartSeries(connected: number, total: number): IntelChartPoint[] {
  const labels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "Now"];
  const disconnected = Math.max(0, total - connected);
  return labels.map((label, index) => ({
    label,
    retrieval: Math.max(0, Math.round((disconnected * (index + 1)) / labels.length)),
    memory: Math.max(connected > 0 ? 1 : 0, Math.round((connected * (index + 1)) / labels.length)),
  }));
}

export function SettingsSection({
  workspaceName,
  ownerName,
  ownerEmail,
  organizationId,
  currentPlan = "Free",
  realtimeVersion = 0,
}: SettingsSectionProps) {
  const didLoadRef = useRef(false);
  const loadInFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const [activeTab, setActiveTab] = useState<SettingsTab>("Organization");
  const [connectorFilter, setConnectorFilter] = useState<ConnectorFilter>("All");
  const [connectorSearch, setConnectorSearch] = useState("");
  const [orgName, setOrgName] = useState(workspaceName);
  const [orgContextEnabled, setOrgContextEnabled] = useState(false);
  const [runtimeSettings, setRuntimeSettings] = useState<SettingsPayload | null>(null);
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState("M");

  const loadLiveSettings = useCallback(async (force = false) => {
    const now = Date.now();
    if (loadInFlightRef.current) return;
    if (!force && now - lastFetchAtRef.current < SETTINGS_FETCH_MIN_MS) return;

    loadInFlightRef.current = true;
    setLoading(true);
    try {
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
      lastFetchAtRef.current = Date.now();
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load settings.");
    } finally {
      setLoading(false);
      loadInFlightRef.current = false;
    }
  }, [workspaceName]);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    void loadLiveSettings(true);
  }, [loadLiveSettings]);

  useEffect(() => {
    if (realtimeVersion <= 0) return;
    void loadLiveSettings();
  }, [realtimeVersion, loadLiveSettings]);

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

  const connectedCount = connectors.filter((c) => c.status === "connected").length;
  const chartData = useMemo(
    () => buildConnectorChartSeries(connectedCount, connectors.length),
    [connectedCount, connectors.length],
  );

  const connectorRows: IntelTableRow[] = useMemo(
    () =>
      visibleConnectors.map((connector, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: connector.name,
        operator: mapConnectorFilter(connector.type),
        detail: connector.type,
        value: connector.id,
        source: connector.status.replace("_", " "),
        sourceTone: connectorStatusTone(connector.status),
      })),
    [visibleConnectors],
  );

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
  const settingsLive = !loading && Boolean(runtimeSettings);

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", orgName, "Settings"]}
          actions={
            <IntelligenceGhostButton loading={loading} onClick={() => void loadLiveSettings(true)}>
              Refresh
            </IntelligenceGhostButton>
          }
        />
        <IntelligenceEntityHeader
          icon={Settings}
          title="Settings"
          badge={
            <IntelligenceStatusBadge live={settingsLive}>
              {connectedCount}/{connectors.length} connectors · context{" "}
              {orgContextEnabled ? "on" : "off"}
            </IntelligenceStatusBadge>
          }
          meta={
            <span className="max-w-3xl text-[#9CA3AF]">
              Organization profile and connector configuration for {displayOwnerName} ({displayOwnerEmail}
              ). Plan: {currentPlan} — connector limits follow billing.
            </span>
          }
        />

        <IntelSectionScroll>
        <div className={intelPanelBleed}>
          <IntelPageStack>
            {(errorMessage || statusMessage) && (
              <>
                <div className={cn(INTEL_LINE_CELL, "space-y-2 py-4 text-sm")}>
                  {errorMessage ? <p className="text-[#B91C1C]">{errorMessage}</p> : null}
                  {statusMessage ? <p className="text-[#111827]">{statusMessage}</p> : null}
                </div>
                <IntelSectionGutter />
              </>
            )}

            <IntelLineGridFrame flush>
              <IntelTileGrid variant="kpi">
                {[
                  ["Organization", orgName, "Workspace display name"],
                  ["Connectors", String(connectors.length), `${connectedCount} connected`],
                  ["OAuth sources", String(connectors.filter((c) => mapConnectorFilter(c.type) === "OAuth").length), "OAuth-class integrations"],
                  ["Context", orgContextEnabled ? "Enabled" : "Disabled", "Shared org memory scope"],
                ].map(([label, value, detail]) => (
                  <div key={label} className={INTEL_LINE_CELL}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">{value}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{detail}</p>
                  </div>
                ))}
              </IntelTileGrid>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <OverviewChartRow>
                <div className={cn(INTEL_LINE_CELL, "overview-chart-cell min-w-0 p-0")}>
                  <IntelligenceFlowChart
                    embedded
                    title="Connector posture signal"
                    subtitle={`Connected (${connectedCount}) vs not connected (${Math.max(0, connectors.length - connectedCount)}).`}
                    data={chartData}
                    range={chartRange}
                    onRangeChange={setChartRange}
                    emptyTitle="No connectors loaded"
                    emptyDescription="Connector statuses appear here once the backend registry responds."
                  />
                </div>
                <SettingsOrgInsight
                  ownerName={displayOwnerName}
                  ownerEmail={displayOwnerEmail}
                  orgId={displayOrgId}
                  lastUpdated={lastUpdated}
                />
              </OverviewChartRow>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "flex flex-wrap gap-2 p-0")}>
                {(["Organization", "Advanced"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "intel-filter-chip h-11 flex-1 min-w-[9rem] border px-4 text-xs font-semibold uppercase tracking-[0.14em] sm:flex-none",
                      activeTab === tab
                        ? "border-[#111827] bg-[#111827] text-white"
                        : "border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827]",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            {activeTab === "Organization" ? (
              <>
                <IntelLineGridFrame flush>
                  <div className="grid gap-px bg-[#E5E7EB] md:grid-cols-2">
                    <OrgField label="Organization name">
                      <input
                        value={orgName}
                        onChange={(event) => setOrgName(event.target.value)}
                        className="prody-input h-11 w-full px-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void saveSettings(orgContextEnabled)}
                        disabled={saving}
                        className="mt-3 h-10 rounded-none bg-[#111827] px-4 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-45"
                      >
                        {saving ? "Saving…" : "Save name"}
                      </button>
                    </OrgField>
                    <OrgField label="Organization ID">
                      <div className="prody-input flex h-11 items-center bg-[#F9FAFB] px-3 font-mono text-xs text-[#6B7280]">
                        {displayOrgId}
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyOrgId()}
                        className="mt-3 h-10 rounded-none border border-[#E5E7EB] px-4 text-xs font-semibold uppercase tracking-wide text-[#374151]"
                      >
                        Copy ID
                      </button>
                    </OrgField>
                    <OrgField label="Organization context" className="md:col-span-2">
                      <p className="text-sm text-[#6B7280]">
                        Enable shared organizational context for memories and agent continuity.
                      </p>
                      <button
                        type="button"
                        onClick={() => void saveSettings(!orgContextEnabled)}
                        disabled={saving}
                        className={cn(
                          "mt-3 h-10 rounded-none border px-4 text-xs font-semibold uppercase tracking-wide",
                          orgContextEnabled
                            ? "border-[#A7F3D0] bg-[#D1FAE5] text-[#047857]"
                            : "border-[#E5E7EB] bg-white text-[#374151]",
                        )}
                      >
                        {orgContextEnabled ? "Context enabled" : "Enable context"}
                      </button>
                    </OrgField>
                  </div>
                </IntelLineGridFrame>

                <IntelSectionGutter />

                <IntelLineGridFrame flush>
                  <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                    <div className="border-b border-[#E5E7EB] px-5 py-4">
                      <p className="text-sm font-semibold text-[#111827]">Connector configurations</p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Live connector statuses from the backend.
                      </p>
                    </div>
                    <div className="space-y-3 px-5 py-4">
                      <input
                        value={connectorSearch}
                        onChange={(event) => setConnectorSearch(event.target.value)}
                        placeholder="Search connectors…"
                        className="prody-input h-11 w-full px-3 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        {CONNECTOR_FILTERS.map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setConnectorFilter(filter)}
                            className={cn(
                              "intel-filter-chip h-9 border px-3 text-xs font-semibold uppercase tracking-[0.14em]",
                              connectorFilter === filter
                                ? "border-[#111827] bg-[#111827] text-white"
                                : "border-[#E5E7EB] bg-white text-[#6B7280]",
                            )}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <IntelligenceDataTable
                        lineGrid
                        rows={connectorRows}
                        emptyMessage={
                          loading
                            ? "Loading connectors…"
                            : "No connectors match this filter."
                        }
                      />
                    </div>
                  </div>
                </IntelLineGridFrame>
              </>
            ) : null}

            {activeTab === "Advanced" ? (
              <IntelLineGridFrame flush>
                <div className="grid gap-px bg-[#E5E7EB] md:grid-cols-2">
                  <div className={INTEL_LINE_CELL}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      Account owner
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[#111827]">{displayOwnerName}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{displayOwnerEmail}</p>
                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      Workspace
                    </p>
                    <p className="mt-1 text-sm text-[#111827]">{orgName}</p>
                  </div>
                  <div className={cn(INTEL_LINE_CELL, "border-[#FECACA] bg-[#FEF2F2]")}>
                    <p className="text-sm font-semibold text-[#991B1B]">Delete organization</p>
                    <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                      Permanently delete this organization, projects, connected accounts, API keys, and logs.
                      Backend deletion is not enabled yet.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setErrorMessage(
                          "Organization deletion is not wired yet. Add the backend delete endpoint before enabling this action.",
                        )
                      }
                      className="mt-4 h-10 rounded-none bg-[#DC2626] px-4 text-xs font-semibold uppercase tracking-wide text-white"
                    >
                      Delete organization
                    </button>
                  </div>
                </div>
              </IntelLineGridFrame>
            ) : null}

            <IntelSectionGutter />
          </IntelPageStack>
        </div>
        </IntelSectionScroll>
      </IntelligenceWorkspace>
    </div>
  );
}

function OrgField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(INTEL_LINE_CELL, className)}>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SettingsOrgInsight({
  ownerName,
  ownerEmail,
  orgId,
  lastUpdated,
}: {
  ownerName: string;
  ownerEmail: string;
  orgId: string;
  lastUpdated: string | null;
}) {
  const rows = [
    ["Owner", ownerName],
    ["Email", ownerEmail],
    ["Org ID", orgId],
  ] as const;

  return (
    <div className="overview-flow-insight flex min-h-[320px] min-w-0 flex-col bg-[#F3F4F6] text-[#111827]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
          Organization snapshot
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">Owner and workspace identifiers.</p>
      </div>
      <div className="flex-1 divide-y divide-[#E5E7EB] bg-white">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 px-5 py-3 text-sm"
          >
            <span className="shrink-0 text-[#6B7280]">{label}</span>
            <span className="max-w-[12rem] break-all text-right font-medium text-[#111827]">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-[#E5E7EB] px-5 py-2.5 text-[11px] text-[#9CA3AF]">
        Last sync ·{" "}
        {lastUpdated
          ? new Date(lastUpdated).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </div>
    </div>
  );
}

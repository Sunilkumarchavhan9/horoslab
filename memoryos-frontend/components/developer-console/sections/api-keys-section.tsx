"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import {
  INTEL_LINE_CELL,
  IntelLineGridFrame,
  IntelPageStack,
  IntelSectionGutter,
  IntelSectionScroll,
  IntelTileGrid,
  intelPanelBleed,
  intelSectionRootClass,
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
import { PLAN_CATALOG, formatLimit } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

type PermissionMode = "full" | "scoped";

type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  mode: PermissionMode;
  status: "active" | "revoked";
  endpoints: string[];
  contentTag: string;
  requests24h: number;
};

type ApiKeysListResponse = {
  keys: ApiKeyRecord[];
};

type ApiKeyCreateResponse = {
  token: string;
  key: ApiKeyRecord;
};

const KEY_EXPIRY_OPTIONS = ["30 days", "90 days", "1 year", "Never"] as const;
const KEY_ENDPOINTS = [
  "retrieve",
  "resume",
  "continue",
  "handoff",
  "memory_add",
  "memory_update",
  "memory_delete",
  "search",
] as const;

const NAME_FRAGMENTS_A = ["rapid", "clear", "stable", "sharp", "steady", "trusted"] as const;
const NAME_FRAGMENTS_B = ["resume", "handoff", "memory", "context", "agent", "thread"] as const;
const NAME_FRAGMENTS_C = ["key", "token", "access", "bridge", "scope", "sync"] as const;

function randomName() {
  const a = NAME_FRAGMENTS_A[Math.floor(Math.random() * NAME_FRAGMENTS_A.length)];
  const b = NAME_FRAGMENTS_B[Math.floor(Math.random() * NAME_FRAGMENTS_B.length)];
  const c = NAME_FRAGMENTS_C[Math.floor(Math.random() * NAME_FRAGMENTS_C.length)];
  return `${a}-${b}-${c}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: ApiKeyRecord["status"]): IntelTableRow["sourceTone"] {
  return status === "active" ? "cyan" : "rose";
}

function buildApiKeyChartSeries(active: number, requests24h: number): IntelChartPoint[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, index) => ({
    label,
    retrieval: Math.max(0, Math.round(requests24h / 7) + (index % 3)),
    memory: Math.max(0, active + (index % 2)),
  }));
}

async function fetchApiKeys<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getOrCreateMemoryToken();
  if (!token) {
    throw new Error("Sign in first so MemoryOS can mint your console token.");
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

type ApiKeysSectionProps = {
  workspaceName: string;
  currentPlan?: BillingPlan;
  realtimeVersion?: number;
};

function ApiKeysInsight({
  activeCount,
  scopedCount,
  lastUpdated,
}: {
  activeCount: number;
  scopedCount: number;
  lastUpdated: string;
}) {
  return (
    <div className={cn(INTEL_LINE_CELL, "memory-graph-sidebar-cell flex flex-col")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
        Key posture
      </p>
      <p className="mt-3 text-lg font-semibold text-[#111827]">
        {activeCount} active · {scopedCount} scoped
      </p>
      <p className="mt-3 border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs leading-5 text-[#6B7280]">
        Rotate scoped keys for production agents. Full-access keys should stay in secure runtimes only.
      </p>
      <p className="mt-3 text-xs text-[#9CA3AF]">
        Last sync · {lastUpdated === "-" ? "pending" : formatDate(lastUpdated)}
      </p>
    </div>
  );
}

export function ApiKeysSection({
  workspaceName,
  currentPlan = "Free",
  realtimeVersion = 0,
}: ApiKeysSectionProps) {
  const didLoadRef = useRef(false);
  const planLimits = PLAN_CATALOG[currentPlan];
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState(randomName);
  const [expires, setExpires] = useState<(typeof KEY_EXPIRY_OPTIONS)[number]>("1 year");
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("full");
  const [contentTag, setContentTag] = useState("continuity");
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([
    "retrieve",
    "resume",
    "handoff",
  ]);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [chartRange, setChartRange] = useState("7d");

  const activeKeys = keys.filter((key) => key.status === "active");
  const scopedCount = keys.filter((key) => key.mode === "scoped").length;
  const fullCount = keys.filter((key) => key.mode === "full").length;
  const totalRequests24h = keys.reduce(
    (sum, key) => sum + (Number.isFinite(key.requests24h) ? key.requests24h : 0),
    0,
  );

  const chartData = useMemo(
    () => buildApiKeyChartSeries(activeKeys.length, totalRequests24h),
    [activeKeys.length, totalRequests24h],
  );

  const auditRows: IntelTableRow[] = useMemo(
    () =>
      keys.slice(0, 12).map((key, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: key.status === "active" ? "API key active" : "API key revoked",
        operator: key.name,
        detail: key.prefix,
        value: formatDate(key.createdAt),
        source: key.mode,
        sourceTone: statusTone(key.status),
      })),
    [keys],
  );

  async function loadKeys() {
    setErrorMessage(null);
    try {
      const response = await fetchApiKeys<ApiKeysListResponse>("/api/memory/api-keys");
      const deduped = Array.from(
        new Map((response.keys ?? []).map((key) => [key.id, key])).values(),
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setKeys(deduped);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load API keys.");
    } finally {
      setIsLoadingKeys(false);
    }
  }

  function openCreateModal() {
    setShowCreateModal(true);
    setKeyName(randomName());
  }

  function closeCreateModal() {
    setShowCreateModal(false);
  }

  function toggleEndpoint(endpoint: string) {
    setSelectedEndpoints((current) =>
      current.includes(endpoint) ? current.filter((item) => item !== endpoint) : [...current, endpoint],
    );
  }

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    let cancelled = false;
    setIsLoadingKeys(true);
    void (async () => {
      if (!cancelled) await loadKeys();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (realtimeVersion <= 0) return;
    void loadKeys();
  }, [realtimeVersion]);

  async function createKey() {
    const normalizedName = keyName.trim();
    if (!normalizedName) return;

    const endpoints = permissionMode === "full" ? [...KEY_ENDPOINTS] : selectedEndpoints;
    setIsSavingKey(true);
    setErrorMessage(null);
    try {
      const response = await fetchApiKeys<ApiKeyCreateResponse>("/api/memory/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          expires,
          mode: permissionMode,
          endpoints,
          contentTag: permissionMode === "scoped" ? contentTag.trim() || "continuity" : "all",
        }),
      });
      setKeys((current) =>
        Array.from(new Map([response.key, ...current].map((key) => [key.id, key])).values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
      setRevealedToken(response.token);
      setShowCreateModal(false);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create API key.");
    } finally {
      setIsSavingKey(false);
    }
  }

  async function revokeKey(keyId: string) {
    setErrorMessage(null);
    try {
      const response = await fetchApiKeys<{ key: ApiKeyRecord }>(
        `/api/memory/api-keys/${keyId}/revoke`,
        { method: "POST" },
      );
      setKeys((current) => current.map((key) => (key.id === keyId ? response.key : key)));
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to revoke API key.");
    }
  }

  async function copyToken() {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken);
    } catch {
      // best effort
    }
  }

  const keysLive = activeKeys.length > 0 || keys.length > 0;

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceName, "API Keys"]}
          actions={
            <>
              <IntelligenceGhostButton loading={isLoadingKeys} onClick={() => void loadKeys()}>
                Refresh
              </IntelligenceGhostButton>
              <button
                type="button"
                onClick={openCreateModal}
                className="h-10 rounded-none bg-[#111827] px-4 text-xs font-semibold uppercase tracking-wide text-white"
              >
                + Create key
              </button>
            </>
          }
        />
        <IntelligenceEntityHeader
          icon={KeyRound}
          title="API Keys"
          badge={
            <IntelligenceStatusBadge live={keysLive}>
              {activeKeys.length} active · {keys.length} total
            </IntelligenceStatusBadge>
          }
          meta={
            <span className="max-w-3xl text-[#9CA3AF]">
              Secure keys for retrieve, resume, continue, and handoff APIs in {workspaceName}. Usage bills
              to this workspace on the {currentPlan} plan (
              {formatLimit(planLimits.searchLimit ?? 0)} searches/mo ·{" "}
              {formatLimit(planLimits.tokenLimit ?? 0)} tokens/mo).
            </span>
          }
        />

        <IntelSectionScroll>
          <div className={intelPanelBleed}>
            <IntelPageStack>
              {revealedToken ? (
                <>
                  <div className={cn(INTEL_LINE_CELL, "space-y-3 py-4")}>
                    <p className="text-sm font-semibold text-[#111827]">Copy this key now</p>
                    <p className="text-xs text-[#6B7280]">
                      You will not see the full token again after leaving this page.
                    </p>
                    <code className="block border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 font-mono text-xs text-[#374151]">
                      {revealedToken}
                    </code>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyToken()}
                        className="h-9 rounded-none border border-[#E5E7EB] bg-white px-3 text-xs font-semibold uppercase tracking-wide text-[#374151]"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevealedToken(null)}
                        className="h-9 rounded-none bg-[#111827] px-3 text-xs font-semibold uppercase tracking-wide text-white"
                      >
                        I saved it
                      </button>
                    </div>
                  </div>
                  <IntelSectionGutter />
                </>
              ) : null}

              {errorMessage ? (
                <>
                  <div className={cn(INTEL_LINE_CELL, "py-4 text-sm text-[#B91C1C]")}>{errorMessage}</div>
                  <IntelSectionGutter />
                </>
              ) : null}

              <IntelLineGridFrame flush>
                <IntelTileGrid variant="kpi">
                  {[
                    ["Active keys", activeKeys.length.toString(), "Keys currently authorized"],
                    ["Scoped keys", scopedCount.toString(), "Endpoint-limited credentials"],
                    ["Full-access keys", fullCount.toString(), "Unrestricted MemoryOS APIs"],
                    ["24h requests", totalRequests24h.toString(), "Observed usage across all keys"],
                  ].map(([label, value, detail]) => (
                    <div key={label} className={INTEL_LINE_CELL}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                        {label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#111827]">
                        {value}
                      </p>
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
                      title="API usage signal"
                      subtitle={`24h requests (${totalRequests24h}) vs active keys (${activeKeys.length}).`}
                      data={chartData}
                      range={chartRange}
                      onRangeChange={setChartRange}
                      emptyTitle="No API usage yet"
                      emptyDescription="Create a key and run SDK or HTTP calls to populate this chart."
                    />
                  </div>
                  <ApiKeysInsight
                    activeCount={activeKeys.length}
                    scopedCount={scopedCount}
                    lastUpdated={lastUpdated}
                  />
                </OverviewChartRow>
              </IntelLineGridFrame>

              <IntelSectionGutter />

              <IntelLineGridFrame flush>
                <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">Key inventory</p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Names, scopes, and lifecycle for programmatic access.
                      </p>
                    </div>
                    <span className="border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                      {keys.length} total
                    </span>
                  </div>

                  {isLoadingKeys ? (
                    <p className="border-t border-[#E5E7EB] py-14 text-center text-sm text-[#6B7280]">
                      Loading API keys…
                    </p>
                  ) : keys.length === 0 ? (
                    <div className="border-t border-[#E5E7EB] px-5 py-14 text-center">
                      <p className="text-sm font-semibold text-[#111827]">No API keys yet</p>
                      <p className="mt-2 text-xs text-[#6B7280]">
                        Create your first key for apps, agents, and MCP tools.
                      </p>
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-4 h-10 rounded-none bg-[#111827] px-4 text-xs font-semibold uppercase tracking-wide text-white"
                      >
                        + Create key
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="intel-line-table w-full min-w-[920px] text-left text-sm">
                        <thead>
                          <tr>
                            <th className="w-10" />
                            <th>Name</th>
                            <th>Prefix</th>
                            <th>Mode</th>
                            <th>Status</th>
                            <th>Last used</th>
                            <th>24h req</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keys.map((key) => (
                            <tr key={key.id} className="group">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  className="size-3.5 border-[#D1D5DB]"
                                  readOnly
                                />
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-[#111827]">{key.name}</p>
                                <p className="mt-1 max-w-[220px] truncate text-[10px] text-[#9CA3AF]">
                                  {key.endpoints.join(", ")}
                                </p>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">
                                {key.prefix}••••••••
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                    key.mode === "full"
                                      ? "border-[#FEF3C7] bg-[#FEF3C7] text-[#B45309]"
                                      : "border-[#E0E7FF] bg-[#EEF2FF] text-[#4338CA]",
                                  )}
                                >
                                  {key.mode}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                    key.status === "active"
                                      ? "border-[#D1FAE5] bg-[#ECFDF5] text-[#059669]"
                                      : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
                                  )}
                                >
                                  {key.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#6B7280]">
                                {formatDate(key.lastUsedAt)}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-[#6B7280]">
                                {Number.isFinite(key.requests24h) ? key.requests24h : 0}
                              </td>
                              <td className="px-4 py-3">
                                {key.status === "active" ? (
                                  <button
                                    type="button"
                                    onClick={() => void revokeKey(key.id)}
                                    className="h-8 rounded-none border border-[#FECACA] bg-[#FEF2F2] px-2.5 text-[10px] font-semibold uppercase tracking-wide text-[#B91C1C]"
                                  >
                                    Revoke
                                  </button>
                                ) : (
                                  <span className="text-xs text-[#9CA3AF]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </IntelLineGridFrame>

              <IntelSectionGutter />

              <IntelLineGridFrame flush>
                <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                  <div className="border-b border-[#E5E7EB] px-5 py-4">
                    <p className="text-sm font-semibold text-[#111827]">Audit feed</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Recent key lifecycle events for this workspace.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <IntelligenceDataTable
                      lineGrid
                      rows={auditRows}
                      emptyMessage="No key events yet. Create or revoke a key to populate this feed."
                    />
                  </div>
                </div>
              </IntelLineGridFrame>

              <IntelSectionGutter />
            </IntelPageStack>
          </div>
        </IntelSectionScroll>
      </IntelligenceWorkspace>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/40 p-4">
          <div className="w-full max-w-xl overflow-hidden border border-[#E5E7EB] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-4 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Create new API key</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Configure access for MemoryOS retrieve, resume, continue, and handoff flows.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="h-8 w-8 border border-[#E5E7EB] text-[#6B7280]"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                  Key name
                </p>
                <input
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                  placeholder="helpful-context-key"
                  className="prody-input mt-1.5 h-11 w-full px-3 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                    Expires
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-px bg-[#E5E7EB]">
                    {KEY_EXPIRY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setExpires(option)}
                        className={cn(
                          "intel-filter-chip h-10 border-0 px-2.5 text-xs font-medium",
                          expires === option
                            ? "bg-[#111827] text-white"
                            : "bg-white text-[#6B7280]",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                    Permissions
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-px bg-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => setPermissionMode("full")}
                      className={cn(
                        "intel-filter-chip h-10 border-0 text-xs font-medium",
                        permissionMode === "full" ? "bg-[#111827] text-white" : "bg-white text-[#6B7280]",
                      )}
                    >
                      Full access
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissionMode("scoped")}
                      className={cn(
                        "intel-filter-chip h-10 border-0 text-xs font-medium",
                        permissionMode === "scoped"
                          ? "bg-[#111827] text-white"
                          : "bg-white text-[#6B7280]",
                      )}
                    >
                      Scoped
                    </button>
                  </div>
                </div>
              </div>

              {permissionMode === "scoped" ? (
                <>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                      Content tag
                    </p>
                    <input
                      value={contentTag}
                      onChange={(event) => setContentTag(event.target.value)}
                      placeholder="continuity"
                      className="prody-input mt-1.5 h-11 w-full px-3 text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                      Allowed endpoints
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {KEY_ENDPOINTS.map((endpoint) => {
                        const selected = selectedEndpoints.includes(endpoint);
                        return (
                          <button
                            key={endpoint}
                            type="button"
                            onClick={() => toggleEndpoint(endpoint)}
                            className={cn(
                              "intel-filter-chip h-8 border px-2.5 text-xs",
                              selected
                                ? "border-[#111827] bg-[#111827] text-white"
                                : "border-[#E5E7EB] bg-white text-[#6B7280]",
                            )}
                          >
                            {endpoint}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="border border-[#FEF3C7] bg-[#FFFBEB] px-3 py-2 text-xs text-[#B45309]">
                  Full access grants every MemoryOS endpoint. Prefer scoped keys in production.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-4 py-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="h-9 rounded-none border border-[#E5E7EB] bg-white px-3 text-xs font-semibold uppercase tracking-wide text-[#374151]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!keyName.trim() || (permissionMode === "scoped" && selectedEndpoints.length === 0)}
                onClick={() => void createKey()}
                className="h-9 rounded-none bg-[#111827] px-3 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-45"
              >
                {isSavingKey ? "Creating…" : "Create key"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

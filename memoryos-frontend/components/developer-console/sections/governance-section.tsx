"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
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
  IntelligenceEntityHeader,
  IntelligenceFlowChart,
  IntelligenceGhostButton,
  IntelligenceStatusBadge,
  IntelligenceWorkspace,
  type IntelChartPoint,
} from "@/components/developer-console/os-intelligence-shell";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { cn } from "@/lib/utils";

type RetentionClass = "short" | "standard" | "long";
type GovernanceMode = "balanced" | "strict" | "enterprise";

type GovernancePolicy = {
  ttlHours: number;
  retentionClass: RetentionClass;
  pinCriticalDecisions: boolean;
  redactSecrets: boolean;
  requireManualReviewForHighRisk: boolean;
  mode: GovernanceMode;
};

type GovernanceReviewItem = {
  id: string;
  reason: string;
  state: "pending" | "approved" | "rejected";
  reviewedAt?: string;
};

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getOrCreateMemoryToken();
  if (!token) throw new Error("Missing auth token");
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

type GovernanceSectionProps = {
  workspaceName?: string;
  realtimeVersion?: number;
};

function buildGovernanceChartSeries(
  pendingCount: number,
  safeguardCount: number,
): IntelChartPoint[] {
  return [
    {
      label: "Pending",
      retrieval: pendingCount,
      memory: safeguardCount,
    },
    {
      label: "Now",
      retrieval: pendingCount,
      memory: safeguardCount,
    },
  ];
}

function formatSavedAt(value: string) {
  if (value === "-") return "Not saved";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Saved";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GovernanceSection({
  workspaceName = "MemoryOS",
  realtimeVersion = 0,
}: GovernanceSectionProps) {
  const didInitialLoadRef = useRef(false);
  const [policy, setPolicy] = useState<GovernancePolicy>({
    ttlHours: 168,
    retentionClass: "standard",
    pinCriticalDecisions: true,
    redactSecrets: true,
    requireManualReviewForHighRisk: true,
    mode: "balanced",
  });
  const [status, setStatus] = useState("Loading governance policy...");
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [reviewItems, setReviewItems] = useState<GovernanceReviewItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("All");

  const dedupedReviewItems = useMemo(
    () => Array.from(new Map(reviewItems.map((item) => [item.id, item])).values()),
    [reviewItems],
  );

  const loadGovernanceData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [policyRes, queueRes] = await Promise.all([
        authFetch("/api/memory/governance-policy"),
        authFetch("/api/memory/governance/review-queue?state=pending"),
      ]);
      const policyPayload = await policyRes.json().catch(() => ({}));
      const queuePayload = await queueRes.json().catch(() => ({}));

      if (!policyRes.ok) {
        throw new Error(policyPayload?.error ?? "Failed to load governance policy");
      }
      if (!queueRes.ok) {
        throw new Error(queuePayload?.error ?? "Failed to load governance review queue");
      }

      if (policyPayload?.governance) {
        setPolicy(policyPayload.governance);
      }
      if (Array.isArray(queuePayload?.items)) {
        setReviewItems(
          queuePayload.items.map((item: GovernanceReviewItem) => ({
            id: item.id,
            reason: item.reason,
            state: item.state,
            reviewedAt: item.reviewedAt,
          })),
        );
      }

      setStatus("Governance policy and review queue loaded");
      setLastUpdated(
        typeof policyPayload?.savedAt === "string" && policyPayload.savedAt.trim().length > 0
          ? policyPayload.savedAt
          : new Date().toISOString(),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load governance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    void loadGovernanceData();
  }, [loadGovernanceData]);

  useEffect(() => {
    if (realtimeVersion <= 0) return;
    void loadGovernanceData();
  }, [realtimeVersion, loadGovernanceData]);

  async function savePolicy(): Promise<void> {
    setBusy(true);
    setStatus("Saving policy...");
    try {
      const response = await authFetch("/api/memory/governance-policy", {
        method: "POST",
        body: JSON.stringify({ governance: policy }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save policy");
      }
      setPolicy(payload.governance);
      setStatus("Governance policy saved");
      setLastUpdated(
        typeof payload?.savedAt === "string" && payload.savedAt.trim().length > 0
          ? payload.savedAt
          : new Date().toISOString(),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save policy");
    } finally {
      setBusy(false);
    }
  }

  async function reviewItem(reviewItemId: string, decision: "approve" | "reject"): Promise<void> {
    setBusy(true);
    setStatus(`${decision === "approve" ? "Approving" : "Rejecting"} review item...`);
    try {
      const response = await authFetch("/api/memory/governance/review", {
        method: "POST",
        body: JSON.stringify({
          reviewItemId,
          decision,
          note: "Reviewed in Governance panel",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Review action failed");
      }
      setReviewItems((current) => current.filter((item) => item.id !== reviewItemId));
      setStatus(`Review item ${decision}d`);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Review action failed");
    } finally {
      setBusy(false);
    }
  }

  const retentionTtl =
    policy.retentionClass === "short" ? 24 : policy.retentionClass === "long" ? 720 : 168;
  const policyLocked = status.toLowerCase().includes("pro") || status.includes("402");
  const policyHealth = policyLocked ? "Plan required" : loading ? "Checking" : "Active";
  const riskModeLabel =
    policy.mode === "enterprise"
      ? "Enterprise review"
      : policy.mode === "strict"
        ? "Strict controls"
        : "Balanced controls";
  const protectedSignals = [
    { label: "Secret redaction", active: policy.redactSecrets },
    { label: "Critical decision pinning", active: policy.pinCriticalDecisions },
    { label: "High-risk manual review", active: policy.requireManualReviewForHighRisk },
  ];
  const safeguardCount = protectedSignals.filter((signal) => signal.active).length;
  const pendingCount = dedupedReviewItems.length;
  const chartData = useMemo(
    () => buildGovernanceChartSeries(pendingCount, safeguardCount),
    [pendingCount, safeguardCount],
  );
  const showStatusBanner =
    policyLocked ||
    (status && status !== "Governance policy and review queue loaded");

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceName, "Security + Governance"]}
          actions={
            <IntelligenceGhostButton loading={loading} onClick={() => void loadGovernanceData()}>
              Refresh
            </IntelligenceGhostButton>
          }
        />
        <IntelligenceEntityHeader
          icon={ShieldCheck}
          title="Security + Governance"
          badge={
            <IntelligenceStatusBadge live={!policyLocked && policyHealth === "Active"}>
              {policyHealth}
            </IntelligenceStatusBadge>
          }
          meta={
            <span className="max-w-3xl text-[#9CA3AF]">
              Control what agent memory can store, reuse, and execute — retention, redaction, and
              high-risk review before context becomes shared company memory.
            </span>
          }
        />

        <IntelSectionScroll>
        <div className={intelPanelBleed}>
          <IntelPageStack>
            {showStatusBanner ? (
              <>
                <div className={cn(INTEL_LINE_CELL, "py-4")}>
                  {policyLocked ? (
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        Governance policy requires Scale or higher.
                      </p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Upgrade unlocks persisted governance controls and high-risk review workflows.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#4338CA]">{status}</p>
                  )}
                </div>
                <IntelSectionGutter />
              </>
            ) : null}

            <IntelLineGridFrame flush>
              <IntelTileGrid variant="kpi">
                {[
                  { label: "Mode", value: riskModeLabel, detail: "Policy posture" },
                  {
                    label: "Retention",
                    value: `${policy.ttlHours}h`,
                    detail: `${policy.retentionClass} class`,
                  },
                  {
                    label: "Protected signals",
                    value: `${safeguardCount}/3`,
                    detail: "Memory safeguards",
                  },
                  {
                    label: "Last update",
                    value: lastUpdated === "-" ? "Not saved" : "Saved",
                    detail: formatSavedAt(lastUpdated),
                  },
                ].map((stat) => (
                  <div key={stat.label} className={INTEL_LINE_CELL}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-[#111827]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">{stat.detail}</p>
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
                    title="Governance enforcement posture"
                    subtitle={`Pending review (${pendingCount}) vs active safeguards (${safeguardCount}/3).`}
                    data={chartData}
                    range={chartRange}
                    onRangeChange={setChartRange}
                    emptyTitle="No governance signal"
                    emptyDescription="Enable safeguards or queue a high-risk write to populate this chart."
                  />
                </div>
                <GovernancePostureInsight
                  policyHealth={policyHealth}
                  pendingCount={pendingCount}
                  policy={policy}
                  retentionTtl={retentionTtl}
                  safeguardCount={safeguardCount}
                />
              </OverviewChartRow>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <p className="text-sm font-semibold text-[#111827]">Policy editor</p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Default behavior for memory writes, retention, and review requirements.
                  </p>
                </div>
                <div className="grid gap-px bg-[#E5E7EB] md:grid-cols-2">
                  <PolicyField label="Retention class">
                    <select
                      value={policy.retentionClass}
                      onChange={(event) =>
                        setPolicy((current) => ({
                          ...current,
                          retentionClass: event.target.value as RetentionClass,
                          ttlHours:
                            event.target.value === "short"
                              ? 24
                              : event.target.value === "long"
                                ? 720
                                : 168,
                        }))
                      }
                      className="prody-input h-11 w-full px-3 text-sm"
                    >
                      <option value="short">short (24h)</option>
                      <option value="standard">standard (168h)</option>
                      <option value="long">long (720h)</option>
                    </select>
                  </PolicyField>
                  <PolicyField label="Governance mode">
                    <select
                      value={policy.mode}
                      onChange={(event) =>
                        setPolicy((current) => ({
                          ...current,
                          mode: event.target.value as GovernanceMode,
                        }))
                      }
                      className="prody-input h-11 w-full px-3 text-sm"
                    >
                      <option value="balanced">balanced</option>
                      <option value="strict">strict</option>
                      <option value="enterprise">enterprise</option>
                    </select>
                  </PolicyField>
                  <PolicyField label="TTL (hours)">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={policy.ttlHours}
                      onChange={(event) =>
                        setPolicy((current) => ({
                          ...current,
                          ttlHours: Number(event.target.value),
                        }))
                      }
                      className="prody-input h-11 w-full px-3 text-sm"
                    />
                  </PolicyField>
                  <PolicyField label="Role resolution">
                    <div className="prody-input flex h-11 w-full items-center bg-[#F9FAFB] px-3 text-sm text-[#6B7280]">
                      Server-resolved (owner/admin required)
                    </div>
                  </PolicyField>
                </div>
                <IntelTileGrid variant="cards" className="border-t border-[#E5E7EB]">
                  <PolicyToggle
                    label="Redact secrets"
                    detail="Prevent keys, tokens, and sensitive values from entering memory."
                    checked={policy.redactSecrets}
                    onChange={(checked) =>
                      setPolicy((current) => ({ ...current, redactSecrets: checked }))
                    }
                  />
                  <PolicyToggle
                    label="Pin critical decisions"
                    detail="Keep important decisions retrievable across future agent sessions."
                    checked={policy.pinCriticalDecisions}
                    onChange={(checked) =>
                      setPolicy((current) => ({ ...current, pinCriticalDecisions: checked }))
                    }
                  />
                  <PolicyToggle
                    label="Review high-risk writes"
                    detail="Queue risky memory writes for owner/admin approval."
                    checked={policy.requireManualReviewForHighRisk}
                    onChange={(checked) =>
                      setPolicy((current) => ({
                        ...current,
                        requireManualReviewForHighRisk: checked,
                      }))
                    }
                  />
                </IntelTileGrid>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-4">
                  <p className="text-xs text-[#6B7280]">
                    Class baseline TTL is {retentionTtl}h. Custom policy TTL is {policy.ttlHours}h.
                  </p>
                  <button
                    type="button"
                    onClick={() => void savePolicy()}
                    disabled={busy || policyLocked}
                    className="h-10 rounded-none bg-[#111827] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy ? "Saving…" : policyLocked ? "Upgrade to save" : "Save policy"}
                  </button>
                </div>
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">High-risk review queue</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Approve or reject pending memory writes before they become reusable context.
                    </p>
                  </div>
                  <IntelligenceGhostButton loading={loading} onClick={() => void loadGovernanceData()}>
                    Refresh queue
                  </IntelligenceGhostButton>
                </div>
                <div className="overflow-x-auto">
                  <GovernanceReviewTable
                    items={dedupedReviewItems}
                    busy={busy}
                    loading={loading}
                    onReview={reviewItem}
                  />
                </div>
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />
          </IntelPageStack>
        </div>
        </IntelSectionScroll>
      </IntelligenceWorkspace>
    </div>
  );
}

function GovernancePostureInsight({
  policyHealth,
  pendingCount,
  policy,
  retentionTtl,
  safeguardCount,
}: {
  policyHealth: string;
  pendingCount: number;
  policy: GovernancePolicy;
  retentionTtl: number;
  safeguardCount: number;
}) {
  const rows = [
    ["Policy state", policyHealth],
    ["Review queue", `${pendingCount} pending`],
    ["Mode", policy.mode],
    ["Retention", policy.retentionClass],
    ["Policy TTL", `${policy.ttlHours}h`],
    ["Baseline TTL", `${retentionTtl}h`],
    ["Redaction", policy.redactSecrets ? "On" : "Off"],
    ["Manual review", policy.requireManualReviewForHighRisk ? "On" : "Off"],
    ["Safeguards", `${safeguardCount}/3 active`],
  ] as const;

  return (
    <div className="overview-flow-insight flex min-h-[320px] min-w-0 flex-col bg-[#F3F4F6] text-[#111827]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
          Live mode summary
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">Current enforcement posture from backend policy.</p>
      </div>
      <div className="flex-1 divide-y divide-[#E5E7EB] bg-white">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
          >
            <span className="text-[#6B7280]">{label}</span>
            <span className="font-medium tabular-nums text-[#111827]">{value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-[#E5E7EB] px-5 py-2.5 text-[11px] text-[#9CA3AF]">
        Server-resolved roles · owner/admin for review actions
      </div>
    </div>
  );
}

function GovernanceReviewTable({
  items,
  busy,
  loading,
  onReview,
}: {
  items: GovernanceReviewItem[];
  busy: boolean;
  loading: boolean;
  onReview: (id: string, decision: "approve" | "reject") => void;
}) {
  if (items.length === 0) {
    return (
      <p className="border border-dashed border-[#E5E7EB] bg-[#F9FAFB] py-14 text-center text-sm text-[#6B7280]">
        {loading
          ? "Loading review queue…"
          : "No pending high-risk writes. Risky memory updates will appear here with trace and approval controls."}
      </p>
    );
  }

  return (
    <table className="intel-line-table w-full min-w-[760px] text-left text-sm">
      <thead>
        <tr>
          <th className="w-10" />
          <th>ID</th>
          <th>Reason</th>
          <th>State</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id} className="group hover:bg-[#F9FAFB]">
            <td className="px-4 py-3">
              <input
                type="checkbox"
                readOnly
                className="size-3.5 rounded border-[#D1D5DB]"
              />
            </td>
            <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">
              #{String(index + 1).padStart(4, "0")}
            </td>
            <td className="px-4 py-3">
              <p className="font-medium text-[#111827]">{item.reason}</p>
              <p className="mt-1 font-mono text-[11px] text-[#9CA3AF]">Trace {item.id}</p>
            </td>
            <td className="px-4 py-3">
              <span className="inline-flex rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-medium text-[#6B7280] ring-1 ring-inset ring-[#E5E7EB]">
                {item.state}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onReview(item.id, "approve")}
                  disabled={busy}
                  className="h-9 rounded-none border border-[#A7F3D0] bg-[#D1FAE5] px-3 text-xs font-medium text-[#047857] disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void onReview(item.id, "reject")}
                  disabled={busy}
                  className="h-9 rounded-none border border-[#FECACA] bg-[#FEE2E2] px-3 text-xs font-medium text-[#B91C1C] disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PolicyField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={cn(INTEL_LINE_CELL, "block text-sm text-[#6B7280]")}>
      <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function PolicyToggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cn(INTEL_LINE_CELL, "block cursor-pointer")}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#111827]">{label}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 rounded-none border-[#D1D5DB] accent-[#111827]"
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-[#6B7280]">{detail}</p>
    </label>
  );
}

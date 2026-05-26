"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
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
import { usagePercent } from "@/lib/billing-usage";
import { PLAN_CATALOG, formatLimit } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

type BillingTab = "Plans" | "Usage" | "Invoices" | "Events";
type BillingPlan = "Free" | "Pro" | "Scale" | "Enterprise";

type BillingSectionProps = {
  workspaceName: string;
  currentPlan?: BillingPlan;
  /** Bumps when workspace runtime activity changes — refreshes live usage meters. */
  realtimeVersion?: number;
};

type BillingInvoice = {
  id: string;
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void";
  issuedAt: string;
  hostedInvoiceUrl: string | null;
};

type MeteringCatalogEntry = {
  operation: string;
  label: string;
  routes: string;
  searchCost: number;
  tokenWeight: number;
  minTokenCost: number;
  exampleTokenCost1kChars: number;
};

type MeteringCatalogResponse = {
  charsPerToken: number;
  operations: MeteringCatalogEntry[];
};

type BillingResponse = {
  workspaceName: string;
  currentPlan: BillingPlan;
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
  seats?: {
    activeMembers: number;
    pendingInvites: number;
    seatLimit: number | null;
  };
  connectorSyncUsage?: {
    used: number;
    limit: number | null;
  };
  invoices: BillingInvoice[];
  events?: {
    id: string;
    provider: "polar" | "custom";
    type: string;
    status: "processed" | "skipped" | "failed";
    summary: string;
    createdAt: string;
  }[];
  checkout?: {
    configured: boolean;
    provider: "polar" | "custom";
    portalUrl?: string;
  };
};

type PlanCard = {
  name: BillingPlan;
  price: string;
  subtitle: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const TABS: BillingTab[] = ["Plans", "Usage", "Invoices", "Events"];
const FOUNDER_EMAIL = "chavhansunilkumar753@gmail.com";

const PLAN_CARDS: PlanCard[] = [
  {
    name: "Free",
    price: `$${PLAN_CATALOG.Free.monthlyPriceUsd}`,
    subtitle: "Get started with core continuity workflows",
    features: [
      `${formatLimit(PLAN_CATALOG.Free.tokenLimit ?? 0)} tokens/month`,
      `${formatLimit(PLAN_CATALOG.Free.searchLimit ?? 0)} search queries/month`,
      "Email support",
    ],
    cta: "Current Plan",
  },
  {
    name: "Pro",
    price: `$${PLAN_CATALOG.Pro.monthlyPriceUsd}/month`,
    subtitle: "For solo developers building with AI memory",
    features: [
      `${formatLimit(PLAN_CATALOG.Pro.tokenLimit ?? 0)} tokens/month`,
      `${formatLimit(PLAN_CATALOG.Pro.searchLimit ?? 0)} search queries/month`,
      "Priority support",
      "All plugin integrations",
    ],
    cta: "Upgrade",
  },
  {
    name: "Scale",
    price: `$${PLAN_CATALOG.Scale.monthlyPriceUsd}/month`,
    subtitle: "For teams and production continuity workloads",
    features: [
      `${formatLimit(PLAN_CATALOG.Scale.tokenLimit ?? 0)} tokens/month`,
      `${formatLimit(PLAN_CATALOG.Scale.searchLimit ?? 0)} search queries/month`,
      "Dedicated support",
      "Connector suite",
    ],
    cta: "Upgrade",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "Custom deployments with dedicated engineering",
    features: [
      "Unlimited tokens",
      "Unlimited search queries",
      "Forward-deployed engineer",
      "Custom integrations + SSO",
    ],
    cta: "Contact Us",
  },
];

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
  }).format((cents || 0) / 100);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMeterSearchCost(searchCost: number): string {
  if (searchCost <= 0) return "No search charge";
  return `${searchCost} search ${searchCost === 1 ? "unit" : "units"}`;
}

function formatMeterTokenWeight(tokenWeight: number, minTokenCost: number): string {
  if (tokenWeight <= 0) return "—";
  const weightLabel = `${tokenWeight}×`;
  return minTokenCost > 0 ? `${weightLabel} text (min ${minTokenCost})` : `${weightLabel} text`;
}

function isUsableCheckoutUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("placeholder_")) return false;
  return normalized.startsWith("http://") || normalized.startsWith("https://");
}

function buildBillingChartSeries(tokenUsed: number, searchUsed: number): IntelChartPoint[] {
  const labels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "Now"];
  return labels.map((label, index) => ({
    label,
    retrieval: Math.max(0, Math.round((searchUsed * (index + 1)) / labels.length)),
    memory: Math.max(1, Math.round((tokenUsed * (index + 1)) / labels.length)),
  }));
}

function invoiceTone(status: BillingInvoice["status"]): IntelTableRow["sourceTone"] {
  if (status === "paid") return "cyan";
  if (status === "open") return "amber";
  return "rose";
}

function eventTone(status: "processed" | "skipped" | "failed"): IntelTableRow["sourceTone"] {
  if (status === "processed") return "cyan";
  if (status === "skipped") return "amber";
  return "rose";
}

const BILLING_FETCH_MIN_MS = 15_000;

export function BillingSection({
  workspaceName,
  currentPlan = "Free",
  realtimeVersion = 0,
}: BillingSectionProps) {
  const didLoadRef = useRef(false);
  const loadInFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const [activeTab, setActiveTab] = useState<BillingTab>("Plans");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [metering, setMetering] = useState<MeteringCatalogResponse | null>(null);
  const [checkoutPendingPlan, setCheckoutPendingPlan] = useState<BillingPlan | null>(null);
  const [chartRange, setChartRange] = useState("M");

  const plan = billing?.currentPlan ?? currentPlan;
  const labelWorkspace = billing?.workspaceName ?? workspaceName;
  const rawUsage = billing?.usage ?? {
    tokenLimit: PLAN_CATALOG.Free.tokenLimit ?? 1_000_000,
    tokenUsed: 0,
    searchLimit: PLAN_CATALOG.Free.searchLimit ?? 10_000,
    searchUsed: 0,
    resetInDays: 30,
  };
  const usage = {
    tokenLimit: Number.isFinite(rawUsage.tokenLimit)
      ? rawUsage.tokenLimit
      : (PLAN_CATALOG.Free.tokenLimit ?? 1_000_000),
    tokenUsed: Number.isFinite(rawUsage.tokenUsed) ? rawUsage.tokenUsed : 0,
    searchLimit: Number.isFinite(rawUsage.searchLimit)
      ? rawUsage.searchLimit
      : (PLAN_CATALOG.Free.searchLimit ?? 10_000),
    searchUsed: Number.isFinite(rawUsage.searchUsed) ? rawUsage.searchUsed : 0,
    resetInDays: Number.isFinite(rawUsage.resetInDays) ? rawUsage.resetInDays : 30,
  };

  const invoices = useMemo(
    () =>
      Array.from(new Map((billing?.invoices ?? []).map((invoice) => [invoice.id, invoice])).values()).sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      ),
    [billing?.invoices],
  );

  const events = useMemo(
    () =>
      (billing?.events ?? [])
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [billing?.events],
  );

  const tokenPercent = usagePercent(usage.tokenUsed, usage.tokenLimit);
  const searchPercent = usagePercent(usage.searchUsed, usage.searchLimit);
  const connectorSync = billing?.connectorSyncUsage;
  const connectorLimit =
    connectorSync?.limit ?? PLAN_CATALOG[plan].connectorSyncRecordLimit ?? null;
  const connectorUsed = connectorSync?.used ?? 0;
  const connectorPercent =
    connectorLimit && connectorLimit > 0
      ? usagePercent(connectorUsed, connectorLimit)
      : 0;
  const seatLimit = billing?.seats?.seatLimit ?? PLAN_CATALOG[plan].seatLimit;
  const activeSeats = billing?.seats?.activeMembers ?? 0;
  const chartData = useMemo(
    () => buildBillingChartSeries(usage.tokenUsed, usage.searchUsed),
    [usage.tokenUsed, usage.searchUsed],
  );

  const invoiceRows: IntelTableRow[] = useMemo(
    () =>
      invoices.map((invoice, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: invoice.id,
        operator: invoice.status,
        detail: formatMoney(invoice.amountCents, invoice.currency),
        value: formatDateTime(invoice.issuedAt),
        source: invoice.hostedInvoiceUrl ? "View" : "—",
        sourceTone: invoiceTone(invoice.status),
      })),
    [invoices],
  );

  const eventRows: IntelTableRow[] = useMemo(
    () =>
      events.map((event, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: event.type,
        operator: event.provider.toUpperCase(),
        detail: event.summary,
        value: formatDateTime(event.createdAt),
        source: event.status,
        sourceTone: eventTone(event.status),
      })),
    [events],
  );

  const meteringRows: IntelTableRow[] = useMemo(
    () =>
      (metering?.operations ?? []).map((entry, index) => ({
        id: `#${String(index + 1).padStart(2, "0")}`,
        title: entry.label,
        operator: entry.routes,
        detail: formatMeterSearchCost(entry.searchCost),
        value: formatMeterTokenWeight(entry.tokenWeight, entry.minTokenCost),
        source: entry.exampleTokenCost1kChars > 0 ? `${entry.exampleTokenCost1kChars} tok / 1k chars` : "—",
        sourceTone: entry.searchCost >= 2 ? "amber" : "cyan",
      })),
    [metering?.operations],
  );

  const loadBilling = useCallback(async (force = false): Promise<void> => {
    const now = Date.now();
    if (loadInFlightRef.current) return;
    if (!force && now - lastFetchAtRef.current < BILLING_FETCH_MIN_MS) return;

    loadInFlightRef.current = true;
    setLoading(true);
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) {
        setErrorMessage("Missing auth token. Sign in again.");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [billingResponse, meteringResponse] = await Promise.all([
        fetch("/api/memory/billing", { headers, cache: "no-store" }),
        fetch("/api/memory/billing/metering", { headers, cache: "no-store" }),
      ]);
      const payload = (await billingResponse.json().catch(() => null)) as
        | BillingResponse
        | { error?: string }
        | null;
      if (!billingResponse.ok) {
        throw new Error(
          (payload as { error?: string } | null)?.error ??
            `Failed to load billing (${billingResponse.status})`,
        );
      }
      setBilling(payload as BillingResponse);

      if (meteringResponse.ok) {
        const meteringPayload = (await meteringResponse.json().catch(() => null)) as
          | MeteringCatalogResponse
          | null;
        if (meteringPayload?.operations) {
          setMetering(meteringPayload);
        }
      }
      setLastUpdated(new Date().toISOString());
      setErrorMessage(null);
      lastFetchAtRef.current = Date.now();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load billing.");
    } finally {
      setLoading(false);
      loadInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    void loadBilling(true);
  }, [loadBilling]);

  useEffect(() => {
    if (realtimeVersion <= 0) return;
    void loadBilling();
  }, [realtimeVersion, loadBilling]);

  async function startCheckout(nextPlan: BillingPlan): Promise<void> {
    if (nextPlan === "Free") return;
    if (nextPlan === "Enterprise") {
      window.location.href = `mailto:${FOUNDER_EMAIL}`;
      return;
    }
    try {
      setCheckoutPendingPlan(nextPlan);
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token.");
      const response = await fetch("/api/memory/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: nextPlan }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { checkoutUrl?: string; currentPlan?: BillingPlan; error?: string }
        | null;
      if (!response.ok) {
        const message = payload?.error ?? `Checkout failed (${response.status})`;
        if (message.toLowerCase().includes("not configured")) {
          throw new Error("Polar checkout URL is not configured for this plan.");
        }
        throw new Error(message);
      }
      await loadBilling(true);
      const checkoutUrl = payload?.checkoutUrl;
      if (isUsableCheckoutUrl(checkoutUrl)) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Polar checkout URL is missing or invalid.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to start checkout.");
    } finally {
      setCheckoutPendingPlan(null);
    }
  }

  const checkoutConfigured = billing?.checkout?.configured ?? false;
  const billingLive = !loading && Boolean(billing);

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", labelWorkspace, "Billing"]}
          actions={
            <IntelligenceGhostButton loading={loading} onClick={() => void loadBilling(true)}>
              Refresh
            </IntelligenceGhostButton>
          }
        />
        <IntelligenceEntityHeader
          icon={CreditCard}
          title="Billing"
          badge={
            <IntelligenceStatusBadge live={billingLive}>
              {plan} plan · resets in {usage.resetInDays}d
            </IntelligenceStatusBadge>
          }
          meta={
            <span className="max-w-3xl text-[#9CA3AF]">
              Plans, usage, invoices, and checkout events for {labelWorkspace}.
              {checkoutConfigured ? " Polar checkout enabled." : " Checkout not configured."}
            </span>
          }
        />

        <IntelSectionScroll>
        <div className={intelPanelBleed}>
          <IntelPageStack>
            {errorMessage ? (
              <>
                <div className={cn(INTEL_LINE_CELL, "py-4 text-sm text-[#B91C1C]")}>{errorMessage}</div>
                <IntelSectionGutter />
              </>
            ) : null}

            <IntelLineGridFrame flush>
              <IntelTileGrid variant="kpi">
                {[
                  ["Current plan", plan, "Active subscription"],
                  ["Token usage", `${tokenPercent}%`, `${usage.tokenUsed.toLocaleString()} / ${usage.tokenLimit.toLocaleString()}`],
                  ["Search usage", `${searchPercent}%`, `${usage.searchUsed.toLocaleString()} / ${usage.searchLimit.toLocaleString()}`],
                  [
                    "Connector sync",
                    connectorLimit ? `${connectorPercent}%` : "Unlimited",
                    connectorLimit
                      ? `${connectorUsed.toLocaleString()} / ${connectorLimit.toLocaleString()} records`
                      : `${connectorUsed.toLocaleString()} records indexed`,
                  ],
                  [
                    "Team seats",
                    seatLimit ? `${activeSeats} / ${seatLimit}` : `${activeSeats}`,
                    seatLimit ? "Active members on plan" : "Unlimited seats",
                  ],
                  ["Period reset", `${usage.resetInDays}d`, "Days until quota refresh"],
                ].map(([label, value, detail]) => (
                  <div key={label} className={INTEL_LINE_CELL}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[#111827]">
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
                    title="Usage burn signal"
                    subtitle={`Tokens (${usage.tokenUsed.toLocaleString()}) vs search queries (${usage.searchUsed.toLocaleString()}).`}
                    data={chartData}
                    range={chartRange}
                    onRangeChange={setChartRange}
                    emptyTitle="No usage recorded"
                    emptyDescription="Usage appears here once tokens or search queries are consumed."
                  />
                </div>
                <BillingUsageInsight usage={usage} tokenPercent={tokenPercent} searchPercent={searchPercent} lastUpdated={lastUpdated} />
              </OverviewChartRow>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "flex flex-wrap gap-2 p-0")}>
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "intel-filter-chip h-11 flex-1 min-w-[7rem] border px-4 text-xs font-semibold uppercase tracking-[0.14em] sm:flex-none",
                      activeTab === tab
                        ? "border-[#111827] bg-[#111827] text-white"
                        : "border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827]",
                    )}
                  >
                    {tab}
                    {tab === "Invoices" ? ` (${invoices.length})` : ""}
                    {tab === "Events" ? ` (${events.length})` : ""}
                  </button>
                ))}
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            {activeTab === "Plans" ? (
              <IntelLineGridFrame flush>
                <IntelTileGrid variant="cards">
                  {PLAN_CARDS.map((card) => {
                    const isCurrent = card.name === plan;
                    return (
                      <div
                        key={card.name}
                        className={cn(
                          INTEL_LINE_CELL,
                          "flex flex-col",
                          card.highlight && "bg-[#F9FAFB]",
                        )}
                      >
                        <p className="text-xl font-semibold tracking-tight text-[#111827]">{card.name}</p>
                        <p className="mt-2 text-3xl font-semibold tabular-nums text-[#111827]">{card.price}</p>
                        <p className="mt-2 text-sm leading-6 text-[#6B7280]">{card.subtitle}</p>
                        <div className="mt-4 flex-1 space-y-1.5">
                          {card.features.map((feature) => (
                            <p key={feature} className="text-sm text-[#6B7280]">
                              {feature}
                            </p>
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={isCurrent || checkoutPendingPlan === card.name}
                          onClick={() => void startCheckout(card.name)}
                          className={cn(
                            "mt-4 h-10 w-full text-xs font-semibold uppercase tracking-wide",
                            isCurrent
                              ? "border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]"
                              : "bg-[#111827] text-white disabled:opacity-45",
                          )}
                        >
                          {isCurrent
                            ? "Current plan"
                            : checkoutPendingPlan === card.name
                              ? "Opening…"
                              : card.cta}
                        </button>
                      </div>
                    );
                  })}
                </IntelTileGrid>
              </IntelLineGridFrame>
            ) : null}

            {activeTab === "Usage" ? (
              <IntelLineGridFrame flush>
                <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                  <div className="border-b border-[#E5E7EB] px-5 py-4">
                    <p className="text-sm font-semibold text-[#111827]">Current billing period</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Live workspace usage · resets in {usage.resetInDays} days
                    </p>
                  </div>
                  <div className="grid gap-px bg-[#E5E7EB] md:grid-cols-2">
                    <UsageBar
                      label="Tokens (ingest / process)"
                      used={usage.tokenUsed}
                      limit={usage.tokenLimit}
                      percent={tokenPercent}
                      tone="bg-[#111827]"
                    />
                    <UsageBar
                      label="Search queries (retrieve / continuity)"
                      used={usage.searchUsed}
                      limit={usage.searchLimit}
                      percent={searchPercent}
                      tone="bg-[#0F766E]"
                    />
                    {connectorLimit ? (
                      <UsageBar
                        label="Connector records synced"
                        used={connectorUsed}
                        limit={connectorLimit}
                        percent={connectorPercent}
                        tone="bg-[#4338CA]"
                      />
                    ) : null}
                  </div>
                  <p className="border-t border-[#E5E7EB] px-5 py-3 text-xs leading-5 text-[#6B7280]">
                    Tokens use ~{metering?.charsPerToken ?? 4} characters per billed unit on ingest.
                    Search units vary by endpoint (see table). API keys bill to this workspace user.
                  </p>
                </div>
              </IntelLineGridFrame>
            ) : null}

            {activeTab === "Usage" && meteringRows.length > 0 ? (
              <>
                <IntelSectionGutter />
                <IntelLineGridFrame flush>
                  <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                    <div className="border-b border-[#E5E7EB] px-5 py-4">
                      <p className="text-sm font-semibold text-[#111827]">Per-endpoint metering</p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Live catalog from{" "}
                        <code className="text-[11px] text-[#374151]">GET /api/memory/billing/metering</code>
                        . Tune costs in <code className="text-[11px] text-[#374151]">lib/billing/metering.ts</code>.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <IntelligenceDataTable
                        lineGrid
                        rows={meteringRows}
                        emptyMessage="Metering catalog unavailable."
                      />
                    </div>
                  </div>
                </IntelLineGridFrame>
              </>
            ) : null}

            {activeTab === "Invoices" ? (
              <IntelLineGridFrame flush>
                <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                  <div className="border-b border-[#E5E7EB] px-5 py-4">
                    <p className="text-sm font-semibold text-[#111827]">Invoices</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Paid and open invoices from your billing provider.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <IntelligenceDataTable
                      lineGrid
                      rows={invoiceRows}
                      emptyMessage={
                        loading
                          ? "Loading invoices…"
                          : "No invoices yet. Invoices appear here once billing starts."
                      }
                    />
                  </div>
                  {invoices.some((inv) => inv.hostedInvoiceUrl) ? (
                    <div className="border-t border-[#E5E7EB] px-5 py-3 text-xs text-[#6B7280]">
                      Open invoice links from the provider column in your billing portal when available.
                    </div>
                  ) : null}
                </div>
              </IntelLineGridFrame>
            ) : null}

            {activeTab === "Events" ? (
              <IntelLineGridFrame flush>
                <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                  <div className="border-b border-[#E5E7EB] px-5 py-4">
                    <p className="text-sm font-semibold text-[#111827]">Billing events</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Webhook and checkout activity from Polar or custom billing.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <IntelligenceDataTable
                      lineGrid
                      rows={eventRows}
                      emptyMessage={
                        loading
                          ? "Loading events…"
                          : "No billing events yet. Webhook and checkout activity appears here."
                      }
                    />
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

function BillingUsageInsight({
  usage,
  tokenPercent,
  searchPercent,
  lastUpdated,
}: {
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
  tokenPercent: number;
  searchPercent: number;
  lastUpdated: string;
}) {
  const rows = [
    ["Tokens", `${usage.tokenUsed.toLocaleString()} (${tokenPercent}%)`],
    ["Search", `${usage.searchUsed.toLocaleString()} (${searchPercent}%)`],
    ["Reset", `${usage.resetInDays} days`],
  ] as const;

  return (
    <div className="overview-flow-insight flex min-h-[320px] min-w-0 flex-col bg-[#F3F4F6] text-[#111827]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
          Period snapshot
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">Current quota consumption.</p>
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
        Last sync ·{" "}
        {lastUpdated === "-"
          ? "—"
          : new Date(lastUpdated).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
  percent,
  tone,
}: {
  label: string;
  used: number;
  limit: number;
  percent: number;
  tone: string;
}) {
  return (
    <div className={cn(INTEL_LINE_CELL)}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-[#111827]">{label}</span>
        <span className="tabular-nums text-[#6B7280]">
          {used.toLocaleString()} / {limit.toLocaleString()} ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden bg-[#E5E7EB]">
        <div className={cn("h-full transition-all", tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

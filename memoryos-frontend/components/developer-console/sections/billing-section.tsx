"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type BillingTab = "Plans" | "Usage" | "Invoices";
type BillingPlan = "Free" | "Pro" | "Scale" | "Enterprise";

type BillingSectionProps = {
  workspaceName: string;
  currentPlan?: BillingPlan;
};

type BillingInvoice = {
  id: string;
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void";
  issuedAt: string;
  hostedInvoiceUrl: string | null;
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
  invoices: BillingInvoice[];
  paddle?: {
    configured: boolean;
    environment: "sandbox" | "production";
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

const TABS: BillingTab[] = ["Plans", "Usage", "Invoices"];

const PLAN_CARDS: PlanCard[] = [
  {
    name: "Free",
    price: "$0",
    subtitle: "Get started with core continuity workflows",
    features: ["1M tokens/month", "10K search queries/month", "Email support"],
    cta: "Current Plan",
  },
  {
    name: "Pro",
    price: "$19/month",
    subtitle: "For solo developers building with AI memory",
    features: ["3M tokens/month", "100K search queries/month", "Priority support", "All plugin integrations"],
    cta: "Upgrade",
  },
  {
    name: "Scale",
    price: "$399/month",
    subtitle: "For teams and production continuity workloads",
    features: ["80M tokens/month", "20M search queries/month", "Dedicated support", "Connector suite"],
    cta: "Upgrade",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "Custom deployments with dedicated engineering",
    features: ["Unlimited tokens", "Unlimited search queries", "Forward-deployed engineer", "Custom integrations + SSO"],
    cta: "Contact Us",
  },
];

function usagePercent(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
  }).format((cents || 0) / 100);
}

export function BillingSection({ workspaceName, currentPlan = "Free" }: BillingSectionProps) {
  const [activeTab, setActiveTab] = useState<BillingTab>("Plans");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [checkoutPendingPlan, setCheckoutPendingPlan] = useState<BillingPlan | null>(null);

  const plan = billing?.currentPlan ?? currentPlan;
  const labelWorkspace = billing?.workspaceName ?? workspaceName;
  const usage = billing?.usage ?? {
    tokenLimit: 1_000_000,
    tokenUsed: 0,
    searchLimit: 10_000,
    searchUsed: 0,
    resetInDays: 30,
  };
  const invoices = useMemo(
    () =>
      Array.from(new Map((billing?.invoices ?? []).map((invoice) => [invoice.id, invoice])).values()).sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      ),
    [billing?.invoices],
  );

  const tokenPercent = usagePercent(usage.tokenUsed, usage.tokenLimit);
  const searchPercent = usagePercent(usage.searchUsed, usage.searchLimit);

  async function loadBilling(): Promise<void> {
    const token = await getOrCreateMemoryToken();
    if (!token) {
      setErrorMessage("Missing auth token. Sign in again.");
      setLoading(false);
      return;
    }
    const response = await fetch("/api/memory/billing", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as BillingResponse | { error?: string } | null;
    if (!response.ok) {
      throw new Error((payload as { error?: string } | null)?.error ?? `Failed to load billing (${response.status})`);
    }
    setBilling(payload as BillingResponse);
    setLastUpdated(new Date().toISOString());
    setErrorMessage(null);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadBilling();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load billing.");
          setLoading(false);
        }
      }
    })();
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          await loadBilling();
        } catch (error) {
          if (!cancelled) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to refresh billing.");
          }
        }
      })();
    }, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function startCheckout(nextPlan: BillingPlan): Promise<void> {
    if (nextPlan === "Free") return;
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
        throw new Error(payload?.error ?? `Checkout failed (${response.status})`);
      }
      await loadBilling();
      if (payload?.checkoutUrl) {
        window.open(payload.checkoutUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to start checkout.");
    } finally {
      setCheckoutPendingPlan(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Billing</h1>
          <p className="mt-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
            Manage plans, monitor usage, and review invoices for {labelWorkspace}.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Status: {loading ? "Syncing billing..." : errorMessage ? "Sync error" : "Live backend connected"} | Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-2.5 rounded-[10px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Plans" ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {PLAN_CARDS.map((card) => {
            const isCurrent = card.name === plan;
            return (
              <div
                key={card.name}
                className={`rounded-[10px] border px-4 py-4 ${
                  card.highlight ? "border-primary/40 bg-gradient-to-b from-primary/10 to-card" : "border-border bg-card"
                }`}
              >
                <p className="text-[34px] font-semibold tracking-[-0.04em] leading-none">{card.name}</p>
                <p className="mt-2 text-[34px] font-semibold tracking-[-0.05em]">{card.price}</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{card.subtitle}</p>
                <div className="mt-3 space-y-1.5">
                  {card.features.map((feature) => (
                    <p key={feature} className="text-[13px] text-muted-foreground">{feature}</p>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={isCurrent || checkoutPendingPlan === card.name}
                  onClick={() => void startCheckout(card.name)}
                  className={`mt-4 w-full rounded-[8px] border px-3 py-2 text-[12px] font-medium tracking-[0.08em] uppercase ${
                    isCurrent ? "border-border bg-muted/50 text-muted-foreground" : "border-primary/30 bg-primary/10 text-primary disabled:opacity-50"
                  }`}
                >
                  {isCurrent ? "Current Plan" : checkoutPendingPlan === card.name ? "Opening..." : card.cta}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "Usage" ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[30px] font-semibold tracking-[-0.04em]">Current Billing Period</p>
                <p className="mt-1 text-[14px] text-muted-foreground">Live workspace usage</p>
              </div>
              <p className="text-[14px] text-muted-foreground">Resets in {usage.resetInDays} days</p>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-[14px]">
                  <span>Tokens</span>
                  <span className="text-muted-foreground">
                    {usage.tokenUsed.toLocaleString()} / {usage.tokenLimit.toLocaleString()} ({tokenPercent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${tokenPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[14px]">
                  <span>Search Queries</span>
                  <span className="text-muted-foreground">
                    {usage.searchUsed.toLocaleString()} / {usage.searchLimit.toLocaleString()} ({searchPercent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-chart-2" style={{ width: `${searchPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "Invoices" ? (
        <div className="mt-3 rounded-[10px] border border-border bg-card px-4 py-4">
          {invoices.length === 0 ? (
            <div className="grid min-h-[240px] place-items-center text-center">
              <p className="text-[15px] leading-7 text-muted-foreground">
                No invoices yet. Your invoices will appear here once billing starts.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-[8px] border border-border bg-muted/40 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-foreground">{invoice.id}</p>
                    <span className="text-[11px] text-muted-foreground">{invoice.status}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {formatMoney(invoice.amountCents, invoice.currency)} · {new Date(invoice.issuedAt).toLocaleString()}
                  </p>
                  {invoice.hostedInvoiceUrl ? (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-[11px] text-primary"
                    >
                      Open invoice
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}


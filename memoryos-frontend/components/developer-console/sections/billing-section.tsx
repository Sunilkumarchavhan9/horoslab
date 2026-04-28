"use client";

import { useMemo, useState } from "react";

type BillingTab = "Plans" | "Usage" | "Invoices";
type BillingPlan = "Free" | "Pro" | "Scale" | "Enterprise";

type BillingSectionProps = {
  workspaceName: string;
  currentPlan?: BillingPlan;
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

export function BillingSection({ workspaceName, currentPlan = "Free" }: BillingSectionProps) {
  const [activeTab, setActiveTab] = useState<BillingTab>("Plans");

  const usageData = useMemo(() => {
    const isFree = currentPlan === "Free";
    return {
      previous: {
        from: "Mar 6, 2026",
        to: "Apr 6, 2026",
        tokens: isFree ? 0 : 184_230,
        searches: isFree ? 0 : 22_910,
      },
      current: {
        from: "Apr 6, 2026",
        to: "May 6, 2026",
        resetInDays: 20,
        tokenLimit: isFree ? 1_000_000 : 3_000_000,
        tokenUsed: isFree ? 0 : 452_840,
        searchLimit: isFree ? 10_000 : 100_000,
        searchUsed: isFree ? 0 : 28_760,
      },
    };
  }, [currentPlan]);

  const tokenPercent = usagePercent(usageData.current.tokenUsed, usageData.current.tokenLimit);
  const searchPercent = usagePercent(usageData.current.searchUsed, usageData.current.searchLimit);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Billing</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Manage plans, monitor usage, and review invoices for {workspaceName}.
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition ${
              activeTab === tab
                ? "border-[#4f93ff] text-[#8bb5ff]"
                : "border-transparent text-white/44 hover:text-white/76"
            }`}
          >
            {tab === "Plans" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="2" width="10" height="3" rx="1" />
                <rect x="1" y="7" width="10" height="3" rx="1" />
              </svg>
            )}
            {tab === "Usage" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="6.5" width="2" height="4" rx="0.5" />
                <rect x="5" y="4" width="2" height="6.5" rx="0.5" />
                <rect x="9" y="1.5" width="2" height="9" rx="0.5" />
              </svg>
            )}
            {tab === "Invoices" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 1.5h8v9l-1.5-1.5L7 10.5 6 9l-1 1.5-1.5-1.5L2 10.5V1.5z" />
                <path d="M4 4.5h4M4 6.5h2.5" />
              </svg>
            )}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Plans" ? (
        <>
          <div className="mt-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
            {PLAN_CARDS.map((plan) => {
              const isCurrent = plan.name === currentPlan;
              return (
                <div
                  key={plan.name}
                  className={`rounded-[10px] border px-4 py-4 ${
                    plan.highlight
                      ? "border-[#4f93ff]/40 bg-[linear-gradient(180deg,#1a1f2e_0%,#161616_35%)]"
                      : "border-white/10 bg-[#161616]"
                  }`}
                >
                  <p className="text-[34px] font-semibold tracking-[-0.04em] leading-none">{plan.name}</p>
                  <p className="mt-2 text-[34px] font-semibold tracking-[-0.05em]">{plan.price}</p>
                  <p className="mt-2 text-[13px] leading-6 text-white/58">{plan.subtitle}</p>

                  <div className="mt-3 space-y-1.5">
                    {plan.features.map((feature) => (
                      <p key={feature} className="text-[13px] text-white/74">
                        {feature}
                      </p>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`mt-4 w-full rounded-[8px] border px-3 py-2 text-[12px] font-medium tracking-[0.08em] uppercase ${
                      isCurrent
                        ? "border-white/10 bg-[#111111] text-white/42"
                        : "border-[#4f93ff]/30 bg-[#4f93ff]/8 text-[#8bb5ff]"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-[10px] border border-white/10 bg-[#161616] px-4 py-3.5">
            <p className="text-[16px] font-semibold tracking-[-0.02em]">Overage Pricing (Pro & Scale)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p className="text-[14px] text-white/74">Token Processing: $0.01 per 1,000 tokens</p>
              <p className="text-[14px] text-white/74">Search Queries: $0.10 per 1,000 queries</p>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === "Usage" ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="text-[30px] font-semibold tracking-[-0.04em]">Previous Billing Period</p>
            <p className="mt-1 text-[14px] text-white/66">
              {usageData.previous.from} - {usageData.previous.to}
            </p>
            <p className="mt-2 text-[14px] leading-7 text-white/52">
              Previous period data is available in the billing portal.
            </p>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[30px] font-semibold tracking-[-0.04em]">Current Billing Period</p>
                <p className="mt-1 text-[14px] text-white/66">
                  {usageData.current.from} - {usageData.current.to}
                </p>
              </div>
              <p className="text-[14px] text-white/46">Resets in {usageData.current.resetInDays} days</p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-[14px]">
                  <span>Tokens</span>
                  <span className="text-white/66">
                    {usageData.current.tokenUsed.toLocaleString()} / {usageData.current.tokenLimit.toLocaleString()} ({tokenPercent}
                    %)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#101010]">
                  <div className="h-full bg-[#4f93ff]" style={{ width: `${tokenPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-[14px]">
                  <span>Search Queries</span>
                  <span className="text-white/66">
                    {usageData.current.searchUsed.toLocaleString()} / {usageData.current.searchLimit.toLocaleString()} ({searchPercent}
                    %)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#101010]">
                  <div className="h-full bg-[#5cbe88]" style={{ width: `${searchPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "Invoices" ? (
        <div className="mt-3 rounded-[10px] border border-white/10 bg-[#141414] px-4 py-4">
          <div className="grid min-h-[340px] place-items-center text-center">
            <div className="max-w-[420px]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 text-white/28">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5.5" width="18" height="12" rx="2" />
                  <path d="M2 10h18M5.5 14.5h5" />
                </svg>
              </div>
              <h2 className="mt-3 text-[34px] font-semibold tracking-[-0.05em]">No invoices yet</h2>
              <p className="mt-2 text-[15px] leading-7 text-white/46">
                Your invoices will appear here once you move to a paid subscription.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import { PLAN_CATALOG, formatLimit } from "@/lib/plan-catalog";

const proCheckoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL_PRO?.trim() || "";
const scaleCheckoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL_SCALE?.trim() || "";
const founderEmail = "chavhansunilkumar753@gmail.com";

type PlanCardProps = {
  name: string;
  price: string;
  limits: string;
  ctaLabel: string;
  onClick: () => void;
  disabled?: boolean;
};

function PlanCard({ name, price, limits, ctaLabel, onClick, disabled = false }: PlanCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <h2 className="text-xl font-semibold">{name}</h2>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{price}</p>
      <p className="mt-2 text-sm text-slate-700">{limits}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ctaLabel}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const [busyPlan, setBusyPlan] = useState<"pro" | "scale" | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function openBackendCheckout(plan: "pro" | "scale"): Promise<boolean> {
    try {
      const planName = plan === "pro" ? "Pro" : "Scale";
      const response = await fetch("/api/memory/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ plan: planName }),
      });
      if (!response.ok) {
        return false;
      }
      const data = (await response.json()) as { checkoutUrl?: string };
      if (!data.checkoutUrl) {
        return false;
      }
      window.location.href = data.checkoutUrl;
      return true;
    } catch {
      return false;
    }
  }

  async function openPlanCheckout(plan: "pro" | "scale"): Promise<void> {
    const directUrl = plan === "pro" ? proCheckoutUrl : scaleCheckoutUrl;

    try {
      setBusyPlan(plan);
      setCheckoutError(null);

      if (directUrl) {
        window.location.href = directUrl;
        return;
      }

      const openedBackend = await openBackendCheckout(plan);
      if (openedBackend) {
        return;
      }

      setCheckoutError("Checkout is temporarily unavailable. Please sign in and retry, or contact support.");
      window.location.href = "/developer-console/sign-in";
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">Pricing</h1>
        <p className="mt-4 text-base text-slate-700">
          Free: {formatLimit(PLAN_CATALOG.Free.tokenLimit ?? 0)} tokens + {formatLimit(PLAN_CATALOG.Free.searchLimit ?? 0)} searches.
          Pro: {formatLimit(PLAN_CATALOG.Pro.tokenLimit ?? 0)} + {formatLimit(PLAN_CATALOG.Pro.searchLimit ?? 0)}.
          Scale: {formatLimit(PLAN_CATALOG.Scale.tokenLimit ?? 0)} + {formatLimit(PLAN_CATALOG.Scale.searchLimit ?? 0)} per month.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <PlanCard
            name="Free"
            price="$0"
            limits={`${formatLimit(PLAN_CATALOG.Free.tokenLimit ?? 0)} tokens/month · ${formatLimit(PLAN_CATALOG.Free.searchLimit ?? 0)} searches/month`}
            ctaLabel="Start free"
            onClick={() => {
              window.location.href = "/developer-console/sign-in";
            }}
          />
          <PlanCard
            name="Pro"
            price={`$${PLAN_CATALOG.Pro.monthlyPriceUsd}/month`}
            limits={`${formatLimit(PLAN_CATALOG.Pro.tokenLimit ?? 0)} tokens/month · ${formatLimit(PLAN_CATALOG.Pro.searchLimit ?? 0)} searches/month`}
            ctaLabel={busyPlan === "pro" ? "Opening..." : "Upgrade to Pro"}
            onClick={() => void openPlanCheckout("pro")}
            disabled={busyPlan !== null}
          />
          <PlanCard
            name="Scale"
            price={`$${PLAN_CATALOG.Scale.monthlyPriceUsd}/month`}
            limits={`${formatLimit(PLAN_CATALOG.Scale.tokenLimit ?? 0)} tokens/month · ${formatLimit(PLAN_CATALOG.Scale.searchLimit ?? 0)} searches/month`}
            ctaLabel={busyPlan === "scale" ? "Opening..." : "Upgrade to Scale"}
            onClick={() => void openPlanCheckout("scale")}
            disabled={busyPlan !== null}
          />
        </div>
        {checkoutError ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {checkoutError}
          </p>
        ) : null}

        <div className="mt-8 rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold">Enterprise</h3>
          <p className="mt-2 text-slate-700">Custom pricing, security, and dedicated support.</p>
          <a
            href={`mailto:${founderEmail}`}
            className="mt-4 inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Talk to founder
          </a>
        </div>
      </div>
    </main>
  );
}

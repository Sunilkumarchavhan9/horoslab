"use client";

import { useMemo, useState } from "react";
import type { BillingPlan } from "@/lib/plan-catalog";
import {
  suggestedUpgradePlans,
  usageLimitReached,
  usagePercent,
  type BillingUsageSnapshot,
} from "@/lib/billing-usage";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type UsageMeterProps = {
  usage: BillingUsageSnapshot;
  currentPlan?: BillingPlan;
  compact?: boolean;
  className?: string;
};

function UsageBar({
  label,
  used,
  limit,
  compact,
}: {
  label: string;
  used: number;
  limit: number;
  compact?: boolean;
}) {
  const safeUsed = Number.isFinite(used) ? used : 0;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 0;
  const percent = usagePercent(safeUsed, safeLimit);

  return (
    <div className={compact ? "min-w-0 flex-1" : "w-full"}>
      <div className={`flex items-center justify-between gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        <span className="font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">
          {safeUsed.toLocaleString()} / {safeLimit.toLocaleString()} ({percent}%)
        </span>
      </div>
      <div
        className={`mt-1 w-full overflow-hidden rounded-full bg-muted ${compact ? "h-1.5" : "h-2.5"}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} usage`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

async function startCheckout(plan: "Pro" | "Scale"): Promise<void> {
  const token = await getOrCreateMemoryToken();
  if (!token) {
    window.location.href = "/developer-console/sign-in";
    return;
  }
  const response = await fetch("/api/memory/billing/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { checkoutUrl?: string; error?: string }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? `Checkout failed (${response.status})`);
  }
  if (payload?.checkoutUrl) {
    window.location.href = payload.checkoutUrl;
    return;
  }
  window.location.href = "/developer-console?section=billing";
}

export function UsageMeter({ usage, currentPlan = "Free", compact = false, className = "" }: UsageMeterProps) {
  const [checkoutPlan, setCheckoutPlan] = useState<"Pro" | "Scale" | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const showUpgrade = useMemo(() => usageLimitReached(usage), [usage]);
  const upgradePlans = useMemo(() => suggestedUpgradePlans(currentPlan), [currentPlan]);

  async function handleUpgrade(plan: "Pro" | "Scale"): Promise<void> {
    setCheckoutError(null);
    setCheckoutPlan(plan);
    try {
      await startCheckout(plan);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setCheckoutPlan(null);
    }
  }

  return (
    <div className={className}>
      <div
        className={
          compact
            ? "flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-4"
            : "space-y-4"
        }
      >
        <UsageBar label="Tokens" used={usage.tokenUsed} limit={usage.tokenLimit} compact={compact} />
        <UsageBar label="Search queries" used={usage.searchUsed} limit={usage.searchLimit} compact={compact} />
      </div>

      {!compact && usage.resetInDays != null ? (
        <p className="mt-2 text-xs text-muted-foreground">Resets in {usage.resetInDays} days</p>
      ) : null}

      {showUpgrade && upgradePlans.length > 0 ? (
        <div className="mt-3 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">
            Monthly limit reached on {currentPlan}. Upgrade to keep using MemoryOS.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {upgradePlans.map((plan) => (
              <button
                key={plan}
                type="button"
                disabled={checkoutPlan !== null}
                onClick={() => void handleUpgrade(plan)}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {checkoutPlan === plan ? "Opening checkout…" : `Upgrade to ${plan}`}
              </button>
            ))}
            <a
              href="/developer-console?section=billing"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/50"
            >
              View billing
            </a>
          </div>
          {checkoutError ? <p className="mt-2 text-xs text-destructive">{checkoutError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

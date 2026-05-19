import type { BillingPlan } from "@/lib/plan-catalog";

export type BillingUsageSnapshot = {
  tokenLimit: number;
  tokenUsed: number;
  searchLimit: number;
  searchUsed: number;
  resetInDays?: number;
};

export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

export function isUsageAtLimit(used: number, limit: number): boolean {
  if (limit <= 0) return false;
  return used >= limit;
}

export function usageLimitReached(usage: BillingUsageSnapshot): boolean {
  return (
    isUsageAtLimit(usage.tokenUsed, usage.tokenLimit) ||
    isUsageAtLimit(usage.searchUsed, usage.searchLimit)
  );
}

export function suggestedUpgradePlans(currentPlan: BillingPlan): Array<"Pro" | "Scale"> {
  if (currentPlan === "Scale" || currentPlan === "Enterprise") return [];
  if (currentPlan === "Pro") return ["Scale"];
  return ["Pro", "Scale"];
}

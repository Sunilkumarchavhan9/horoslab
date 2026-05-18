export type BillingPlan = "Free" | "Pro" | "Scale" | "Enterprise";

export type PlanDefinition = {
  name: BillingPlan;
  monthlyPriceUsd: number | null;
  tokenLimit: number | null;
  searchLimit: number | null;
  seatLimit: number | null;
  connectorSyncRecordLimit: number | null;
};

export const PLAN_CATALOG: Record<BillingPlan, PlanDefinition> = {
  Free: {
    name: "Free",
    monthlyPriceUsd: 0,
    tokenLimit: 1_000_000,
    searchLimit: 10_000,
    seatLimit: 1,
    connectorSyncRecordLimit: 2_500,
  },
  Pro: {
    name: "Pro",
    monthlyPriceUsd: 19,
    tokenLimit: 3_000_000,
    searchLimit: 100_000,
    seatLimit: 5,
    connectorSyncRecordLimit: 50_000,
  },
  Scale: {
    name: "Scale",
    monthlyPriceUsd: 399,
    tokenLimit: 80_000_000,
    searchLimit: 20_000_000,
    seatLimit: 25,
    connectorSyncRecordLimit: 500_000,
  },
  Enterprise: {
    name: "Enterprise",
    monthlyPriceUsd: null,
    tokenLimit: null,
    searchLimit: null,
    seatLimit: null,
    connectorSyncRecordLimit: null,
  },
};

export function formatLimit(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return `${value}`;
}

/**
 * Helpers for `memoryos.contract.v1` category counts from connector sync metadata.
 */

export function totalContractCount(counts?: Record<string, number>): number {
  if (!counts) return 0;
  return Object.values(counts).reduce(
    (sum, value) => sum + (typeof value === "number" && value > 0 ? value : 0),
    0,
  );
}

export function hasContractCategories(counts?: Record<string, number>): boolean {
  return totalContractCount(counts) > 0;
}

export function formatContractCounts(counts?: Record<string, number>): string {
  if (!counts) return "";
  return Object.entries(counts)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key.replace(/_/g, " ")}=${value}`)
    .join(" · ");
}

export function connectorTitleFromType(type: string): string {
  return type
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type OsRuntimeRow = {
  id: string;
  title: string;
  contact: string;
  email: string;
  value: string;
  source: string;
  sourceTone: "blue" | "green" | "amber" | "slate";
  at: string;
};

export function OsWorkspaceCanvas({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function OsBreadcrumb({
  items,
  actions,
}: {
  items: string[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <p className="text-sm text-muted-foreground">
        {items.join(" › ")}
      </p>
      {actions}
    </div>
  );
}

export function OsEntityHeader({
  icon,
  title,
  badge,
  meta,
  kpis,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  meta?: ReactNode;
  kpis: Array<{ label: string; value: number; tone?: string }>;
}) {
  return (
    <div className="border-b border-border pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-border bg-muted">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {badge}
            </div>
            {meta ? <div className="mt-1 text-sm text-muted-foreground">{meta}</div> : null}
          </div>
        </div>
        <div className="flex gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className="text-sm font-semibold tabular-nums">{kpi.value.toFixed(1)}/10</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OsFlowChart({
  title,
  subtitle,
  seriesA,
  seriesB,
  labels,
  range,
  onRangeChange,
}: {
  title: string;
  subtitle?: string;
  seriesA: number[];
  seriesB: number[];
  labels: string[];
  range: string;
  onRangeChange: (r: string) => void;
}) {
  const max = Math.max(1, ...seriesA, ...seriesB);
  return (
    <div className="border-b border-border py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex gap-1">
          {["Day", "Month", "Year", "All"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={cn(
                "rounded-md px-2 py-1 text-xs",
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex h-32 items-end gap-1">
        {labels.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 96 }}>
              <div
                className="w-2 rounded-t bg-teal-500/80"
                style={{ height: `${(seriesA[i] ?? 0) / max * 100}%`, minHeight: 2 }}
              />
              <div
                className="w-2 rounded-t bg-rose-500/80"
                style={{ height: `${(seriesB[i] ?? 0) / max * 100}%`, minHeight: 2 }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OsRuntimeTable({
  title,
  rows,
  toolbar,
  emptyMessage,
}: {
  title: string;
  rows: OsRuntimeRow[];
  toolbar?: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div className="py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {toolbar}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{row.id}</td>
                  <td className="px-3 py-2">{row.title}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">{row.email}</td>
                  <td className="px-3 py-2">{row.value}</td>
                  <td className="px-3 py-2">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function OsStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "neutral" | "new";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-700"
      : tone === "new"
        ? "bg-red-500/15 text-red-700"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cls)}>{children}</span>
  );
}

export function buildChartBuckets(
  events: Array<{ createdAt: string; kind: "retrieve" | "memory" }>,
  range: string,
  bucketCount = 8,
): { labels: string[]; retrieval: number[]; memory: number[] } {
  const now = Date.now();
  const rangeMs =
    range === "Day"
      ? 24 * 60 * 60 * 1000
      : range === "Month"
        ? 30 * 24 * 60 * 60 * 1000
        : range === "Year"
          ? 365 * 24 * 60 * 60 * 1000
          : Number.POSITIVE_INFINITY;

  const filtered = events.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return Number.isFinite(t) && now - t <= rangeMs;
  });

  const bucketMs =
    range === "Day"
      ? (24 * 60 * 60 * 1000) / bucketCount
      : range === "Month"
        ? (30 * 24 * 60 * 60 * 1000) / bucketCount
        : (365 * 24 * 60 * 60 * 1000) / bucketCount;

  const retrieval = Array.from({ length: bucketCount }, () => 0);
  const memory = Array.from({ length: bucketCount }, () => 0);
  const start =
    filtered.length > 0
      ? Math.min(...filtered.map((e) => new Date(e.createdAt).getTime()))
      : now - bucketMs * bucketCount;

  for (const event of filtered) {
    const t = new Date(event.createdAt).getTime();
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((t - start) / bucketMs)));
    if (event.kind === "retrieve") retrieval[index] += 1;
    else memory[index] += 1;
  }

  const labels = Array.from({ length: bucketCount }, (_, i) => {
    const d = new Date(start + i * bucketMs);
    return range === "Day"
      ? d.toLocaleTimeString([], { hour: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  });

  return { labels, retrieval, memory };
}

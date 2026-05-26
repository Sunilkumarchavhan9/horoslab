"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronRight,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelLoadButton } from "@/components/ui/pixel-load-button";
import {
  intel,
  intelContentPad,
  intelMotion,
  intelWorkspaceClass,
} from "@/components/developer-console/intel-design";
import { IntelSectionScroll, intelSectionRootClass } from "@/components/developer-console/intel-line-grid";

export type IntelChartPoint = {
  label: string;
  retrieval: number;
  memory: number;
};

export type IntelTableRow = {
  id: string;
  title: string;
  operator: string;
  detail: string;
  value: string;
  source: string;
  sourceTone: "cyan" | "violet" | "rose" | "amber" | "slate";
};

const SOURCE_CLASS: Record<IntelTableRow["sourceTone"], string> = {
  cyan: "bg-[#CCFBF1] text-[#0F766E]",
  violet: "bg-[#EEF2FF] text-[#4338CA]",
  rose: "bg-[#FEE2E2] text-[#B91C1C]",
  amber: "bg-[#FEF3C7] text-[#B45309]",
  slate: "bg-[#F3F4F6] text-[#6B7280]",
};

/** Maps backend request history rows to flow-chart series (retrieval vs memory). */
export function classifyIntelFlowKind(
  type: string | undefined,
  route: string,
): "retrieve" | "memory" | null {
  const normalizedType = (type ?? "").toLowerCase();
  const normalizedRoute = route.toLowerCase();

  if (
    normalizedType === "retrieve" ||
    normalizedType.startsWith("retrieve_") ||
    normalizedRoute.includes("/retrieve")
  ) {
    return "retrieve";
  }

  if (
    normalizedType === "memory_add" ||
    normalizedType === "memory_process" ||
    normalizedType === "memory_update" ||
    normalizedRoute.includes("/process") ||
    normalizedRoute.includes("/memory/add") ||
    normalizedRoute.includes("/memory/write")
  ) {
    return "memory";
  }

  if (
    normalizedRoute.includes("/connector") &&
    (normalizedRoute.includes("sync") ||
      normalizedRoute.includes("connect") ||
      normalizedRoute.includes("ingest"))
  ) {
    return "memory";
  }

  return null;
}

export type FlowChartSourceEvent = { createdAt: string; kind: "retrieve" | "memory" };

/** Timeline rows from connector ingest / memory lifecycle (not HTTP request log). */
export function flowKindFromTimelineEvent(eventType: string): "retrieve" | "memory" | null {
  const normalized = eventType.toLowerCase();
  if (normalized.includes("retrieve")) return "retrieve";
  if (
    normalized === "memory_created" ||
    normalized === "memory_updated" ||
    normalized === "memory_merged" ||
    normalized === "memory_evolved" ||
    normalized === "memory_stale" ||
    normalized === "memory_contradicted" ||
    normalized === "memory_archived"
  ) {
    return "memory";
  }
  return null;
}

/** Request log + timeline + memory timestamps for Overview flow chart. */
export function collectOverviewFlowEvents(
  requestEvents: Array<{ type?: string; route: string; createdAt: string }>,
  timelineEvents: Array<{ eventType: string; timestamp: string }>,
  memories: Array<{ updatedAt: string }>,
): FlowChartSourceEvent[] {
  const merged: FlowChartSourceEvent[] = [];

  for (const event of requestEvents) {
    const kind = classifyIntelFlowKind(event.type, event.route);
    if (kind) merged.push({ createdAt: event.createdAt, kind });
  }

  for (const event of timelineEvents) {
    const kind = flowKindFromTimelineEvent(event.eventType);
    if (kind) merged.push({ createdAt: event.timestamp, kind });
  }

  if (merged.length > 0) return merged;

  if (memories.length > 0) {
    return memories.slice(0, 120).map((memory) => ({
      createdAt: memory.updatedAt,
      kind: "memory" as const,
    }));
  }

  return merged;
}

export function buildIntelChartSeries(
  events: Array<{ createdAt: string; kind: "retrieve" | "memory" }>,
  range: string,
  points = 12,
): IntelChartPoint[] {
  const now = Date.now();
  const rangeMs =
    range === "D"
      ? 86400000
      : range === "M"
        ? 30 * 86400000
        : range === "Y"
          ? 365 * 86400000
          : Infinity;
  const filtered = events.filter((e) => now - new Date(e.createdAt).getTime() <= rangeMs);
  const bucketMs =
    range === "D" ? 86400000 / points : range === "M" ? (30 * 86400000) / points : (365 * 86400000) / points;
  const start =
    filtered.length > 0
      ? Math.min(...filtered.map((e) => new Date(e.createdAt).getTime()))
      : now - bucketMs * points;
  const buckets: IntelChartPoint[] = Array.from({ length: points }, (_, i) => {
    const d = new Date(start + i * bucketMs);
    return {
      label:
        range === "D"
          ? d.toLocaleTimeString([], { hour: "2-digit" })
          : d.toLocaleDateString([], { month: "short", day: "numeric" }),
      retrieval: 0,
      memory: 0,
    };
  });
  for (const event of filtered) {
    const t = new Date(event.createdAt).getTime();
    const i = Math.min(points - 1, Math.max(0, Math.floor((t - start) / bucketMs)));
    if (event.kind === "retrieve") buckets[i].retrieval += 1;
    else buckets[i].memory += 1;
  }
  return buckets;
}

/** Light canvas — no dark ambient layer (matches Prody reference). */
export function IntelligenceAmbient() {
  return null;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const r = payload.find((p) => p.name === "retrieval")?.value ?? 0;
  const m = payload.find((p) => p.name === "memory")?.value ?? 0;
  return (
    <div
      className="rounded-xl border bg-white px-4 py-3 shadow-lg"
      style={{ borderColor: intel.colors.borderStrong }}
    >
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#0F766E]">Retrieval · {r}</p>
      <p className="text-sm font-medium text-[#DC2626]">Memory · {m}</p>
      <p className="mt-1 text-xs font-medium text-[#059669]">Δ {r - m}</p>
    </div>
  );
}

export function chartHasSignal(data: IntelChartPoint[]): boolean {
  return data.some((point) => point.retrieval > 0 || point.memory > 0);
}

type FlowRadarPoint = {
  axis: string;
  retrieval: number;
  memory: number;
  retrievalRaw: number;
  memoryRaw: number;
};

function buildFlowRadarProfile(
  data: IntelChartPoint[],
  retrieveCount: number,
  memoryWriteCount: number,
): {
  points: FlowRadarPoint[];
  totalRetrieval: number;
  totalMemory: number;
  peakMemory: number;
  netDelta: number;
  hasSignal: boolean;
} {
  const totalRetrieval = data.reduce((sum, point) => sum + point.retrieval, 0);
  const totalMemory = data.reduce((sum, point) => sum + point.memory, 0);
  const retrievalLive = retrieveCount > 0 ? retrieveCount : totalRetrieval;
  const memoryLive = memoryWriteCount > 0 ? memoryWriteCount : totalMemory;
  const peakMemory = Math.max(0, ...data.map((point) => point.memory));
  const netDelta = retrievalLive - memoryLive;
  const activeBuckets = data.filter((point) => point.retrieval > 0 || point.memory > 0).length;
  const coverage = data.length > 0 ? (activeBuckets / data.length) * 100 : 0;

  const scaleKeys = [
    { axis: "Retrieval", retrieval: retrievalLive, memory: 0 },
    { axis: "Memory", retrieval: 0, memory: memoryLive },
    { axis: "Peak", retrieval: 0, memory: peakMemory },
    { axis: "Net Δ", retrieval: 0, memory: Math.abs(netDelta) },
    { axis: "Activity", retrieval: coverage, memory: 0 },
  ];

  const max = Math.max(1, ...scaleKeys.flatMap((k) => [k.retrieval, k.memory]));
  const scale = (value: number) => Math.round((value / max) * 100);

  const points: FlowRadarPoint[] = scaleKeys.map((key) => ({
    axis: key.axis,
    retrieval: scale(key.retrieval),
    memory: scale(key.memory),
    retrievalRaw: key.retrieval,
    memoryRaw: key.memory,
  }));

  return {
    points,
    totalRetrieval: retrievalLive,
    totalMemory: memoryLive,
    peakMemory,
    netDelta,
    hasSignal: retrievalLive > 0 || memoryLive > 0 || peakMemory > 0,
  };
}

function FlowRadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: FlowRadarPoint }>;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div
      className="rounded-lg border bg-white px-3 py-2 shadow-md"
      style={{ borderColor: intel.colors.borderStrong }}
    >
      <p className="text-xs font-semibold text-[#111827]">{point.axis}</p>
      {point.retrievalRaw > 0 ? (
        <p className="text-xs text-[#0F766E]">Retrieval · {point.retrievalRaw}</p>
      ) : null}
      {point.memoryRaw > 0 ? (
        <p className="text-xs text-[#DC2626]">Memory · {point.memoryRaw}</p>
      ) : null}
    </div>
  );
}

/** Gray radar column beside the Overview flow chart. */
export function IntelligenceFlowInsightPanel({
  data,
  range,
  retrieveCount,
  memoryWriteCount,
}: {
  data: IntelChartPoint[];
  range: string;
  retrieveCount: number;
  memoryWriteCount: number;
}) {
  const profile = useMemo(
    () => buildFlowRadarProfile(data, retrieveCount, memoryWriteCount),
    [data, retrieveCount, memoryWriteCount],
  );

  return (
    <div className="overview-flow-insight flex min-h-[320px] min-w-0 flex-col bg-[#F3F4F6] text-[#111827]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Flow radar</p>
        <p className="mt-1 text-sm text-[#6B7280]">Range · {range}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#6B7280]">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: intel.colors.teal }} />
            Retrieval
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: intel.colors.rose }} />
            Memory
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col px-2 py-3">
        <div className="h-[220px] min-h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={profile.points}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#6B7280", fontSize: 10, fontWeight: 500 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip content={<FlowRadarTooltip />} />
              <Radar
                name="Retrieval"
                dataKey="retrieval"
                stroke={intel.colors.teal}
                fill={intel.colors.teal}
                fillOpacity={profile.hasSignal ? 0.22 : 0.06}
                strokeWidth={2}
                dot={false}
              />
              <Radar
                name="Memory"
                dataKey="memory"
                stroke={intel.colors.rose}
                fill={intel.colors.rose}
                fillOpacity={profile.hasSignal ? 0.18 : 0.05}
                strokeWidth={2}
                dot={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {!profile.hasSignal ? (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-xs text-[#9CA3AF]">
            Radar fills when retrieval or memory activity arrives.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-[#E5E7EB] bg-[#E5E7EB] text-center text-[11px]">
        <div className="bg-[#F3F4F6] px-2 py-2">
          <p className="text-[#9CA3AF]">Retrieval</p>
          <p className="mt-0.5 font-semibold tabular-nums text-[#0F766E]">{profile.totalRetrieval}</p>
        </div>
        <div className="bg-[#F3F4F6] px-2 py-2">
          <p className="text-[#9CA3AF]">Memory</p>
          <p className="mt-0.5 font-semibold tabular-nums text-[#DC2626]">{profile.totalMemory}</p>
        </div>
        <div className="bg-[#F3F4F6] px-2 py-2">
          <p className="text-[#9CA3AF]">Net Δ</p>
          <p className="mt-0.5 font-semibold tabular-nums text-[#111827]">
            {profile.netDelta >= 0 ? `+${profile.netDelta}` : profile.netDelta}
          </p>
        </div>
        <div className="bg-[#F3F4F6] px-2 py-2">
          <p className="text-[#9CA3AF]">Peak</p>
          <p className="mt-0.5 font-semibold tabular-nums text-[#111827]">{profile.peakMemory}</p>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] px-5 py-2.5 text-[11px] text-[#9CA3AF]">
        Live backend only · normalized to window peak
      </div>
    </div>
  );
}

export function IntelligenceFlowChart({
  title,
  subtitle,
  data,
  range,
  onRangeChange,
  emptyTitle,
  emptyDescription,
  emptyAction,
  embedded = false,
}: {
  title: string;
  subtitle?: string;
  data: IntelChartPoint[];
  range: string;
  onRangeChange: (r: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Inside intel line-grid cell — no outer pad/border */
  embedded?: boolean;
}) {
  const hasSignal = chartHasSignal(data);
  const peak = Math.max(0, ...data.map((p) => Math.max(p.retrieval, p.memory)));
  const yMax = peak <= 0 ? 4 : Math.max(25, Math.ceil(peak / 25) * 25);

  const shellClass = cn(
    embedded
      ? "overview-flow-chart flex min-h-[320px] w-full min-w-0 flex-col p-0"
      : cn("border-b border-black/[0.06] py-4", intelContentPad),
  );

  const chartContent = (
    <>
      <div
        className={cn(
          "mb-0 flex flex-wrap items-start justify-between gap-4",
          embedded ? "border-b border-[#E5E7EB] px-5 py-4" : "mb-4",
        )}
      >
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
          <div className="mt-3 flex gap-5 text-xs text-[#6B7280]">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: intel.colors.teal }} />
              Retrieval flow
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: intel.colors.rose }} />
              Memory writes
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            data-no-pixel-load
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "grid size-9 place-items-center border bg-white text-[#6B7280]",
              embedded ? "rounded-none shadow-none" : "rounded-xl shadow-sm",
            )}
            style={{ borderColor: intel.colors.borderStrong }}
          >
            <RefreshCw className="size-4" />
          </motion.button>
          <div
            className={cn(
              "flex gap-px border bg-[#F9FAFB] p-px",
              embedded ? "rounded-none" : "gap-0.5 rounded-xl p-1",
            )}
            style={{ borderColor: intel.colors.borderStrong }}
            data-no-pixel-load
          >
            {["D", "M", "Y", "All"].map((r) => (
              <button
                key={r}
                type="button"
                data-no-pixel-load
                onClick={() => onRangeChange(r)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all",
                  embedded ? "rounded-none" : "rounded-lg",
                  range === r
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#6B7280] hover:text-[#374151]",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "relative w-full min-w-0",
          embedded ? "intel-chart-plot h-[280px] min-h-[280px]" : "h-[260px]",
        )}
      >
        <ResponsiveContainer
          width="100%"
          height={embedded ? 280 : 260}
          className="!w-full"
        >
          <AreaChart
            data={data}
            margin={
              embedded
                ? { top: 10, right: 8, left: 2, bottom: 6 }
                : { top: 12, right: 12, left: 4, bottom: 4 }
            }
          >
            <defs>
              <linearGradient id="intelTeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={intel.colors.teal} stopOpacity={0.25} />
                <stop offset="100%" stopColor={intel.colors.teal} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="intelRose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={intel.colors.rose} stopOpacity={0.2} />
                <stop offset="100%" stopColor={intel.colors.rose} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="0" vertical horizontal />
            <XAxis
              dataKey="label"
              scale="point"
              padding={{ left: 0, right: 0 }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={{ stroke: "#E5E7EB" }}
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              dy={6}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={{ stroke: "#E5E7EB" }}
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              width={embedded ? 44 : 32}
              tickMargin={embedded ? 6 : 4}
              domain={[0, yMax]}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E5E7EB", strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="retrieval"
              name="retrieval"
              stroke={intel.colors.teal}
              strokeWidth={2}
              fill="url(#intelTeal)"
              dot={false}
              activeDot={{ r: 4, fill: intel.colors.teal, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="memory"
              name="memory"
              stroke={intel.colors.rose}
              strokeWidth={2}
              fill="url(#intelRose)"
              dot={false}
              activeDot={{ r: 4, fill: intel.colors.rose, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        {!hasSignal ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 mx-auto max-w-md rounded-lg border border-dashed border-[#E5E7EB] bg-white/95 px-4 py-3 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#111827]">
              {emptyTitle ?? "Waiting for retrieval and memory activity"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
              {emptyDescription ??
                "Connect a source or run the SDK — this chart updates from live backend events only."}
            </p>
          </div>
        ) : null}
        {!hasSignal && emptyAction ? (
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">{emptyAction}</div>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return <section className={shellClass}>{chartContent}</section>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={shellClass}
    >
      {chartContent}
    </motion.section>
  );
}

export function IntelligenceWorkspace({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(intelWorkspaceClass, "intel-workspace-fill", className)}
    >
      {children}
    </motion.div>
  );
}

export function IntelligenceBreadcrumb({
  items,
  actions,
}: {
  items: string[];
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] py-3",
        intelContentPad,
      )}
    >
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5 text-[#9CA3AF]" /> : null}
            <span className={i === items.length - 1 ? "font-medium text-[#111827]" : "text-[#6B7280]"}>
              {item}
            </span>
          </span>
        ))}
      </nav>
      {actions ? (
        <div className="flex items-center gap-2" data-console-header-chrome data-no-pixel-load>
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function IntelligenceEntityHeader({
  icon: Icon,
  title,
  badge,
  meta,
  kpis,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  badge?: ReactNode;
  meta?: ReactNode;
  kpis?: Array<{
    label: string;
    value: number;
    max?: number;
    tone?: "cyan" | "rose" | "amber";
    /** When set, shown instead of numeric score (e.g. "Ready") */
    displayValue?: string;
    idle?: boolean;
  }>;
  actions?: ReactNode;
}) {
  const toneColor = { cyan: intel.colors.teal, rose: intel.colors.rose, amber: intel.colors.amber };
  const idleColor = "#D1D5DB";
  return (
    <div className={cn("shrink-0 border-b border-black/[0.06] py-4", intelContentPad)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="grid size-[52px] shrink-0 place-items-center rounded-2xl border bg-[#F9FAFB] shadow-sm"
            style={{ borderColor: intel.colors.borderStrong }}
          >
            <Icon className="size-6 text-[#374151]" strokeWidth={1.5} />
          </motion.div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-[#111827] sm:text-2xl">{title}</h1>
              {badge}
            </div>
            {meta ? <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">{meta}</div> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-5">
          {kpis?.map((kpi) => {
            const max = kpi.max ?? 10;
            const isIdle = kpi.idle ?? (kpi.value <= 0 && Boolean(kpi.displayValue));
            const pct = isIdle
              ? 6
              : Math.min(100, Math.max(10, (kpi.value / max) * 100));
            const color = isIdle ? idleColor : toneColor[kpi.tone ?? "cyan"];
            return (
              <div key={kpi.label} className="flex items-end gap-2">
                <div className="flex h-[72px] w-[5px] flex-col justify-end overflow-hidden rounded-full bg-[#E5E7EB]">
                  <motion.div
                    className="w-full rounded-full"
                    style={{ background: color }}
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{kpi.label}</p>
                  <p className="text-sm font-semibold tabular-nums text-[#111827]">
                    {kpi.displayValue ?? (
                      <>
                        {kpi.value.toFixed(1)}
                        <span className="font-normal text-[#9CA3AF]">/{max}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          {actions}
        </div>
      </div>
    </div>
  );
}

export function IntelligenceStatusBadge({
  children,
  live,
}: {
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        live
          ? "bg-[#D1FAE5] text-[#047857] ring-[#A7F3D0]"
          : "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]",
      )}
    >
      {live ? (
        <motion.span
          className="size-1.5 rounded-full bg-[#10B981]"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      ) : null}
      {children}
    </span>
  );
}

export function IntelligenceTableToolbar({
  title,
  onAdd,
}: {
  title: string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3" data-console-toolbar data-no-pixel-load>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-no-pixel-load
          className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-[#374151] shadow-sm"
          style={{ borderColor: intel.colors.borderStrong }}
        >
          {title}
          <ChevronRight className="size-4 rotate-90 text-[#9CA3AF]" />
        </button>
        <IntelIconBtn icon={Filter} label="Filter" />
        <IntelIconBtn icon={SlidersHorizontal} label="Sort" />
        <IntelIconBtn icon={Search} label="Search" />
      </div>
      <div className="flex gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm text-[#374151] shadow-sm"
          style={{ borderColor: intel.colors.borderStrong }}
        >
          <Download className="size-4" />
          Export
        </motion.button>
        {onAdd ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="size-4" />
            Connect source
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}

function IntelIconBtn({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <motion.button
      type="button"
      data-no-pixel-load
      whileHover={{ backgroundColor: "#F3F4F6" }}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#6B7280]"
    >
      <Icon className="size-4" />
      {label}
    </motion.button>
  );
}

export function IntelligenceDataTable({
  rows,
  emptyMessage,
  lineGrid = false,
}: {
  rows: IntelTableRow[];
  emptyMessage?: string;
  lineGrid?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-[#E5E7EB] bg-[#F9FAFB] py-14 text-center text-sm text-[#6B7280]">
        {emptyMessage ?? "No runtime events yet."}
      </p>
    );
  }
  return (
    <div className={cn("overflow-x-auto", lineGrid ? "" : "rounded-xl border border-black/[0.06]")}>
      <table className={cn("w-full text-left text-sm", lineGrid ? "intel-line-table" : "min-w-[760px]")}>
        <thead>
          <tr
            className={
              lineGrid
                ? undefined
                : "border-b border-black/[0.06] bg-[#F9FAFB] text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]"
            }
          >
            <th className={lineGrid ? "w-10" : "w-10 px-4 py-3"} />
            <th className={lineGrid ? undefined : "px-4 py-3"}>ID</th>
            <th className={lineGrid ? undefined : "px-4 py-3"}>Event</th>
            <th className={lineGrid ? undefined : "px-4 py-3"}>Operator</th>
            <th className={lineGrid ? undefined : "px-4 py-3"}>Detail</th>
            <th className={lineGrid ? undefined : "px-4 py-3"}>Latency</th>
            <th className={lineGrid ? undefined : "px-4 py-3"}>Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={lineGrid ? "group" : "group border-b border-black/[0.04] last:border-0 hover:bg-[#F9FAFB]"}
            >
              <td className="px-4 py-3">
                <input type="checkbox" className="size-3.5 rounded border-white/20 bg-transparent" readOnly />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{row.id}</td>
              <td className="px-4 py-3 font-medium text-[#111827]">{row.title}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-[#EEF2FF] text-xs font-semibold text-[#4338CA]">
                    {row.operator.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-[#6B7280]">{row.operator}</span>
                </div>
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 text-[#6B7280]" title={row.detail}>
                {row.detail}
              </td>
              <td className="px-4 py-3 tabular-nums text-[#6B7280]">{row.value}</td>
              <td className="px-4 py-3">
                <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", SOURCE_CLASS[row.sourceTone])}>
                  {row.source}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IntelligenceGhostButton({
  children,
  onClick,
  loading = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <motion.div whileHover={loading ? undefined : { scale: 1.02 }} whileTap={loading ? undefined : { scale: 0.98 }}>
      <PixelLoadButton
        type="button"
        loading={loading}
        pixelTone="light"
        onClick={onClick}
        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-[#374151] shadow-sm"
        style={{ borderColor: intel.colors.borderStrong }}
      >
        {children}
      </PixelLoadButton>
    </motion.div>
  );
}

export function IntelligencePrimaryButton({
  children,
  onClick,
  loading = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <motion.div whileHover={loading ? undefined : { scale: 1.02 }} whileTap={loading ? undefined : { scale: 0.98 }}>
      <PixelLoadButton
        type="button"
        loading={loading}
        pixelTone="dark"
        onClick={onClick}
        className="rounded-xl border border-[#111827] bg-[#111827] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1F2937]"
      >
        {children}
      </PixelLoadButton>
    </motion.div>
  );
}

export function IntelligenceHeaderActions() {
  return (
    <>
      <IntelligenceGhostButton>Manage</IntelligenceGhostButton>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm text-[#374151] shadow-sm"
        style={{ borderColor: intel.colors.borderStrong }}
      >
        <Share2 className="size-4" />
        Share
      </motion.button>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-xl border bg-white text-[#6B7280] shadow-sm"
        style={{ borderColor: intel.colors.borderStrong }}
      >
        <MoreHorizontal className="size-4" />
      </button>
    </>
  );
}

/** Wrap inner section content in intelligence workspace chrome */
export function IntelligenceSectionFrame({
  breadcrumbs,
  title,
  icon,
  meta,
  children,
}: {
  breadcrumbs: string[];
  title: string;
  icon: LucideIcon;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb items={breadcrumbs} />
        <IntelligenceEntityHeader icon={icon} title={title} meta={meta} />
        <IntelSectionScroll>
          <div className={cn("pb-4", intelContentPad)}>{children}</div>
        </IntelSectionScroll>
      </IntelligenceWorkspace>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Info } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ContinuityLabSettingsSectionFrame } from "./continuity-lab-settings-shell";
import { SettingsSelectDropdown } from "./continuity-lab-settings-ui";
import { consoleApiFetch } from "../../../lib/console-api";
import { fetchLabSessionsList } from "../../../lib/continuity-lab/sessions-api";
import type { LabSessionSource, LabSessionSummary } from "../../../lib/continuity-lab/sessions";
import { fetchIndexedReposSummary } from "../../../lib/continuity-lab/wiki-api";
import type { BillingPlan } from "../../../lib/plan-catalog";
import { cn } from "../../../lib/utils";

type AnalyticsTab = "usage" | "productivity" | "categories";
type DateRange =
  | "this-week"
  | "this-month"
  | "this-quarter"
  | "last-7-days"
  | "last-30-days"
  | "last-90-days"
  | "last-week"
  | "last-month"
  | "last-quarter"
  | "custom";
type DateRangeMode = "current" | "previous";
type ChartCadence = "Daily" | "Weekly";
type SessionBreakdown = "By size" | "By origin";
type UsageView = "overall" | "users";
type UserMetricMode = "Counts" | "Percentages";
type CustomDateRange = { start: Date; end: Date };

type BillingSnapshot = {
  workspaceName: string;
  currentPlan: BillingPlan;
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
  connectorSyncUsage?: {
    used: number;
    limit: number | null;
  };
};

type TeamSnapshot = {
  workspaceName: string;
  plan: BillingPlan;
  members: Array<{
    id?: string;
    name?: string;
    email?: string;
    status: "active" | "invited";
  }>;
  invites: unknown[];
};

type AnalyticsData = {
  billing: BillingSnapshot | null;
  team: TeamSnapshot | null;
  sessions: LabSessionSummary[];
  repos: Awaited<ReturnType<typeof fetchIndexedReposSummary>>;
};

type ChartPoint = {
  date: string;
  label: string;
  XS: number;
  S: number;
  M: number;
  L: number;
  XL: number;
  memoryos: number;
  productAgent: number;
  continuityThread: number;
  searches: number;
  merged: number;
  open: number;
  closed: number;
  reviewed: number;
  activeUsers: number;
  reviewUsers: number;
};

const analyticsTabs: { id: AnalyticsTab; label: string }[] = [
  { id: "usage", label: "Usage" },
  { id: "productivity", label: "Productivity" },
  { id: "categories", label: "Categories" },
];

const sizeSeries = [
  { key: "XL", label: "XL", color: "#EF2D2D" },
  { key: "L", label: "L", color: "#F97316" },
  { key: "M", label: "M", color: "#D99A00" },
  { key: "S", label: "S", color: "#22C55E" },
  { key: "XS", label: "XS", color: "#2563EB" },
] as const;

const originSeries = [
  { key: "memoryos", label: "MemoryOS", color: "#60A5FA" },
  { key: "productAgent", label: "MemoryOS Agent", color: "#A78BFA" },
  { key: "continuityThread", label: "Thread", color: "#22C55E" },
] as const;

const prSeries = [
  { key: "merged", label: "Merged", color: "#9333EA" },
  { key: "open", label: "Open", color: "#22C55E" },
  { key: "closed", label: "Closed", color: "#EF2D2D" },
] as const;

const reviewedSeries = [
  { key: "reviewed", label: "Reviewed", color: "#3B82F6" },
] as const;

const activeUserSeries = [
  { key: "activeUsers", label: "Active users", color: "#3B82F6" },
] as const;

const reviewUserSeries = [
  { key: "reviewUsers", label: "Review users", color: "#3B82F6" },
] as const;

const selectClass = "w-full sm:w-36";

function monthLabel(date: Date): string {
  return date.toLocaleString([], { month: "short" });
}

function copyDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

function addDays(date: Date, days: number): Date {
  const next = copyDate(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(date, mondayOffset);
}

function startOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

function formatRangeLabel(prefix: string, start: Date, end: Date): string {
  return `${prefix} (${monthLabel(start)} ${start.getDate()} - ${monthLabel(end)} ${end.getDate()})`;
}

function rangeFor(value: DateRange, customRange: CustomDateRange): { label: string; start: Date; end: Date } {
  const now = new Date();
  const today = copyDate(now);
  const thisWeekStart = startOfWeek(today);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisQuarterStart = startOfQuarter(today);

  if (value === "custom") {
    return {
      label: formatRangeLabel("Custom range", customRange.start, customRange.end),
      start: copyDate(customRange.start),
      end: endOfDay(customRange.end),
    };
  }
  if (value === "this-week") {
    return {
      label: formatRangeLabel("This week", thisWeekStart, addDays(thisWeekStart, 6)),
      start: thisWeekStart,
      end: endOfDay(addDays(thisWeekStart, 6)),
    };
  }
  if (value === "this-month") {
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      label: formatRangeLabel("This month", thisMonthStart, end),
      start: thisMonthStart,
      end: endOfDay(end),
    };
  }
  if (value === "this-quarter") {
    const end = new Date(thisQuarterStart.getFullYear(), thisQuarterStart.getMonth() + 3, 0);
    return {
      label: formatRangeLabel("This quarter", thisQuarterStart, end),
      start: thisQuarterStart,
      end: endOfDay(end),
    };
  }
  if (value === "last-week") {
    const start = addDays(thisWeekStart, -7);
    const end = addDays(thisWeekStart, -1);
    return {
      label: formatRangeLabel("Last week", start, end),
      start,
      end: endOfDay(end),
    };
  }
  if (value === "last-month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      label: formatRangeLabel("Last month", start, end),
      start,
      end: endOfDay(end),
    };
  }
  if (value === "last-quarter") {
    const thisQuarter = startOfQuarter(today);
    const start = new Date(thisQuarter.getFullYear(), thisQuarter.getMonth() - 3, 1);
    const end = new Date(thisQuarter.getFullYear(), thisQuarter.getMonth(), 0);
    return {
      label: formatRangeLabel("Last quarter", start, end),
      start,
      end: endOfDay(end),
    };
  }

  const days = value === "last-90-days" ? 90 : value === "last-30-days" ? 30 : 7;
  const start = addDays(today, -(days - 1));
  return {
    label: formatRangeLabel(`Last ${days} days`, start, today),
    start,
    end: endOfDay(today),
  };
}

function formatTick(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildRangePoints(range: { start: Date; end: Date }, cadence: ChartCadence): ChartPoint[] {
  const points: ChartPoint[] = [];
  const cursor = new Date(range.start);
  const stepDays = cadence === "Weekly" ? 7 : 1;

  while (cursor <= range.end) {
    const date = new Date(cursor);
    points.push({
      date: date.toISOString().slice(0, 10),
      label: formatTick(date),
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      memoryos: 0,
      productAgent: 0,
      continuityThread: 0,
      searches: 0,
      merged: 0,
      open: 0,
      closed: 0,
      reviewed: 0,
      activeUsers: 0,
      reviewUsers: 0,
    });
    cursor.setDate(cursor.getDate() + stepDays);
  }

  return points;
}

function sourceKey(source: LabSessionSource): "memoryos" | "productAgent" | "continuityThread" {
  if (source === "product_agent") return "productAgent";
  if (source === "continuity_thread") return "continuityThread";
  return "memoryos";
}

function sessionSize(session: LabSessionSummary): keyof Pick<ChartPoint, "XS" | "S" | "M" | "L" | "XL"> {
  const score =
    (session.title?.length ?? 0) +
    (session.repo?.length ?? 0) +
    (session.prUrls?.length ?? 0) * 20 +
    (session.tags?.length ?? 0) * 8;
  if (score >= 160) return "XL";
  if (score >= 110) return "L";
  if (score >= 70) return "M";
  if (score >= 35) return "S";
  return "XS";
}

function sessionDate(session: LabSessionSummary): Date | null {
  const date = new Date(session.createdAt || session.updatedAt);
  return Number.isFinite(date.getTime()) ? date : null;
}

function pointForDate(points: ChartPoint[], date: Date): ChartPoint | null {
  for (let index = 0; index < points.length; index += 1) {
    const pointStart = new Date(`${points[index].date}T00:00:00`);
    const nextStart =
      index + 1 < points.length ? new Date(`${points[index + 1].date}T00:00:00`) : null;
    if (date >= pointStart && (!nextStart || date < nextStart)) return points[index];
  }
  return null;
}

function applySessionData(points: ChartPoint[], sessions: LabSessionSummary[], range: { start: Date; end: Date }) {
  for (const session of sessions) {
    const date = sessionDate(session);
    if (!date || date < range.start || date > range.end) continue;
    const point = pointForDate(points, date);
    if (!point) continue;
    point[sessionSize(session)] += 1;
    point[sourceKey(session.source)] += 1;
  }
}

function sessionUserKey(session: LabSessionSummary): string {
  return (session.creator || "Current user").trim().toLowerCase();
}

function applyUserActivityData(points: ChartPoint[], sessions: LabSessionSummary[], range: { start: Date; end: Date }) {
  const activeByPoint = new Map<string, Set<string>>();
  for (const session of sessions) {
    const date = sessionDate(session);
    if (!date || date < range.start || date > range.end) continue;
    const point = pointForDate(points, date);
    if (!point) continue;
    const users = activeByPoint.get(point.date) ?? new Set<string>();
    users.add(sessionUserKey(session));
    activeByPoint.set(point.date, users);
  }

  for (const point of points) {
    point.activeUsers = activeByPoint.get(point.date)?.size ?? 0;
    point.reviewUsers = 0;
  }
}

function compactChartPoints(points: ChartPoint[], cadence: ChartCadence): ChartPoint[] {
  if (cadence === "Weekly") return points;
  return points.filter((point, index) => index % 3 === 0 || index === points.length - 1 || point.XS + point.S + point.M + point.L + point.XL > 0);
}

async function fetchBackendJson<T>(path: string): Promise<T | null> {
  try {
    const response = await consoleApiFetch(path);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function AnalyticsTabs({ active, onChange }: { active: AnalyticsTab; onChange: (tab: AnalyticsTab) => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      {analyticsTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold transition",
            active === tab.id
              ? "bg-white/[0.08] text-[#F0EFE2]"
              : "text-[#F0EFE2]/52 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function rangeMenuItems(mode: DateRangeMode): DateRange[] {
  const anchored: DateRange[] =
    mode === "current"
      ? ["this-week", "this-month", "this-quarter"]
      : ["last-week", "last-month", "last-quarter"];
  return [...anchored, "last-7-days", "last-30-days", "last-90-days", "custom"];
}

function rangeItemNeedsDivider(index: number): boolean {
  return index === 3 || index === 6;
}

function CalendarMonth({
  month,
  customStart,
  customEnd,
  onPick,
}: {
  month: Date;
  customStart: Date;
  customEnd: Date;
  onPick: (date: Date) => void;
}) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstDay = start.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const previousMonthDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayOffset = index - firstDay + 1;
    if (dayOffset < 1) {
      return new Date(month.getFullYear(), month.getMonth() - 1, previousMonthDays + dayOffset);
    }
    if (dayOffset > daysInMonth) {
      return new Date(month.getFullYear(), month.getMonth() + 1, dayOffset - daysInMonth);
    }
    return new Date(month.getFullYear(), month.getMonth(), dayOffset);
  });

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-4 text-center text-sm font-semibold text-[#F0EFE2]/85">
        {month.toLocaleString([], { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <p key={day} className="py-1 text-xs font-semibold text-[#F0EFE2]/45">
            {day}
          </p>
        ))}
        {cells.map((date) => {
          const inMonth = date.getMonth() === month.getMonth();
          const selected = sameDay(date, customStart) || sameDay(date, customEnd);
          const inRange = date > customStart && date < customEnd;
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onPick(date)}
              className={cn(
                "h-8 rounded-md text-sm font-medium transition",
                inMonth ? "text-[#F0EFE2]/70 hover:bg-white/[0.06] hover:text-[#F0EFE2]" : "text-[#F0EFE2]/22",
                inRange && "bg-white/[0.04] text-[#F0EFE2]/80",
                selected && "bg-white/[0.12] text-[#F0EFE2]",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomRangeCalendar({
  month,
  customRange,
  onMonthChange,
  onRangeChange,
}: {
  month: Date;
  customRange: CustomDateRange;
  onMonthChange: (date: Date) => void;
  onRangeChange: (range: CustomDateRange) => void;
}) {
  const [draftStart, setDraftStart] = useState<Date>(customRange.start);
  const [draftEnd, setDraftEnd] = useState<Date>(customRange.end);
  const secondMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  function pick(date: Date) {
    const picked = copyDate(date);
    if (draftStart && draftEnd && !sameDay(draftStart, draftEnd)) {
      setDraftStart(picked);
      setDraftEnd(picked);
      onRangeChange({ start: picked, end: picked });
      return;
    }
    if (picked < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(picked);
      onRangeChange({ start: picked, end: draftStart });
      return;
    }
    setDraftEnd(picked);
    onRangeChange({ start: draftStart, end: picked });
  }

  return (
    <div className="absolute right-[292px] top-0 z-50 hidden w-[520px] rounded-md border border-white/[0.08] bg-[#181818] p-5 shadow-2xl xl:block">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/55 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/55 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <CalendarMonth month={month} customStart={draftStart} customEnd={draftEnd} onPick={pick} />
        <CalendarMonth month={secondMonth} customStart={draftStart} customEnd={draftEnd} onPick={pick} />
      </div>
    </div>
  );
}

function AnalyticsDateRangeDropdown({
  value,
  customRange,
  onChange,
  onCustomRangeChange,
}: {
  value: DateRange;
  customRange: CustomDateRange;
  onChange: (value: DateRange) => void;
  onCustomRangeChange: (range: CustomDateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DateRangeMode>("current");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = rangeFor(value, customRange);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-40 w-full sm:w-[220px]">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-white/[0.1] bg-[#171717] px-3 text-left text-sm font-semibold text-[#F0EFE2] hover:border-white/18"
      >
        <span className="min-w-0 truncate">{selected.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#F0EFE2]/35" aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-[292px] rounded-md border border-white/[0.08] bg-[#181818] p-1 shadow-2xl">
          {showCalendar ? (
            <CustomRangeCalendar
              month={calendarMonth}
              customRange={customRange}
              onMonthChange={setCalendarMonth}
              onRangeChange={(next) => {
                onCustomRangeChange(next);
                onChange("custom");
              }}
            />
          ) : null}
          <div className="mb-1 grid grid-cols-2 gap-1 rounded-md bg-white/[0.04] p-1">
            {(["current", "previous"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={cn(
                  "h-7 rounded-md text-xs font-semibold capitalize transition",
                  mode === item ? "bg-white/[0.08] text-[#F0EFE2]" : "text-[#F0EFE2]/45 hover:text-[#F0EFE2]/75",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="py-1">
            {rangeMenuItems(mode).map((item, index) => {
              const option = item === "custom" ? null : rangeFor(item, customRange);
              return (
                <div key={`${mode}-${item}`}>
                  {rangeItemNeedsDivider(index) ? <div className="my-1 h-px bg-white/[0.06]" /> : null}
                  <button
                    type="button"
                    onClick={() => {
                      if (item === "custom") {
                        setShowCalendar(true);
                        onChange("custom");
                        return;
                      }
                      setShowCalendar(false);
                      onChange(item);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition hover:bg-white/[0.06]",
                      value === item ? "text-[#F0EFE2]" : "text-[#F0EFE2]/76",
                    )}
                  >
                    <span>{item === "custom" ? "Custom range..." : option?.label}</span>
                    {value === item ? <Check className="size-3.5 text-[#F0EFE2]/55" aria-hidden /> : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-[#1A1A1A] px-4 py-4">
      <p className="text-sm font-medium text-[#F0EFE2]/55">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#F0EFE2]">{value}</p>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  info,
}: {
  title: string;
  subtitle?: string;
  info?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#F0EFE2]">{title}</h2>
        {info ? <Info className="size-3.5 text-[#F0EFE2]/35" aria-hidden /> : null}
      </div>
      {subtitle ? <p className="mt-1 text-sm text-[#F0EFE2]/55">{subtitle}</p> : null}
    </div>
  );
}

function AnalyticsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((row) => Number(row.value ?? 0) > 0);
  return (
    <div className="rounded-md border border-white/[0.1] bg-[#181818] px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-[#F0EFE2]/80">{label}</p>
      {(rows.length ? rows : payload.slice(0, 1)).map((row) => (
        <p key={row.name} className="mt-1 text-xs text-[#F0EFE2]/60">
          <span className="mr-1 inline-block size-2" style={{ backgroundColor: row.color }} />
          {row.name}: {row.value ?? 0}
        </p>
      ))}
    </div>
  );
}

function ChartLegend({ series }: { series: readonly { key: string; label: string; color: string }[] }) {
  return (
    <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 text-xs text-[#F0EFE2]/58 lg:flex-col lg:gap-0">
      {series.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className="size-5 shrink-0" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChartPanel({
  title,
  data,
  series,
  controls,
  height = 300,
}: {
  title: string;
  data: ChartPoint[];
  series: readonly { key: keyof ChartPoint; label: string; color: string }[];
  controls?: ReactNode;
  height?: number;
}) {
  const showLegend = series.length > 1;

  return (
    <div className="rounded-md border border-white/[0.08] bg-[#1A1A1A] p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#F0EFE2]">{title}</h3>
        {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}
      </div>
      <div
        className={cn(
          "grid min-h-[260px] grid-cols-1 gap-4",
          showLegend && "lg:grid-cols-[minmax(0,1fr)_96px]",
        )}
      >
        <div className="min-w-0">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={58}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }}
                allowDecimals={false}
                width={38}
                label={{
                  value: "Count",
                  angle: -90,
                  position: "insideLeft",
                  fill: "rgba(255,255,255,0.58)",
                  fontSize: 12,
                }}
              />
              <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              {series.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  stackId="analytics"
                  fill={item.color}
                  maxBarSize={18}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <p className="-mt-3 text-center text-xs font-medium text-[#F0EFE2]/50">Date (UTC)</p>
        </div>
        {showLegend ? (
          <div className="flex items-center justify-start lg:justify-center">
            <ChartLegend series={series} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InfoPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-white/[0.08] border-l-[#3B82F6] bg-[#1A1A1A] px-4 py-3 [border-left-width:4px]">
      <p className="text-sm font-semibold text-[#F0EFE2]">Info</p>
      <p className="mt-2 text-sm leading-relaxed text-[#F0EFE2]/55">{children}</p>
    </div>
  );
}

function exportSessionsCsv(sessions: LabSessionSummary[]) {
  const rows = [
    ["id", "title", "repo", "source", "status", "createdAt", "updatedAt"],
    ...sessions.map((session) => [
      session.id,
      session.title,
      session.repo ?? "",
      session.source,
      session.status ?? "",
      session.createdAt,
      session.updatedAt,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "memoryos-session-analytics.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportUsersCsv(rows: AnalyticsUserRow[]) {
  const headers = [
    "email",
    "name",
    "totalCost",
    "sessionsCreated",
    "costPerSession",
    "sessionsBySize",
    "sessionsWithMergedPrsBySize",
    "sessionsByOrigin",
    "sessionsWithSearch",
    "sessionsWithPlaybook",
    "searchesCreated",
    "costPerSearch",
    "searchesPerSession",
    "prsCreated",
    "prsByStatus",
    "costPerPrMerged",
  ];
  const csv = [
    headers,
    ...rows.map((row) => [
      row.email,
      row.name,
      row.totalCost,
      row.sessionsCreated,
      row.costPerSession,
      row.sessionsBySize,
      row.sessionsWithMergedPrsBySize,
      row.sessionsByOrigin,
      row.sessionsWithSearch,
      row.sessionsWithPlaybook,
      row.searchesCreated,
      row.costPerSearch,
      row.searchesPerSession,
      row.prsCreated,
      row.prsByStatus,
      row.costPerPrMerged,
    ]),
  ]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "memoryos-user-analytics.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

type AnalyticsUserRow = {
  email: string;
  name: string;
  totalCost: string;
  sessionsCreated: string;
  costPerSession: string;
  sessionsBySize: string;
  sessionsWithMergedPrsBySize: string;
  sessionsByOrigin: string;
  sessionsWithSearch: string;
  sessionsWithPlaybook: string;
  searchesCreated: string;
  costPerSearch: string;
  searchesPerSession: string;
  prsCreated: string;
  prsByStatus: string;
  costPerPrMerged: string;
};

function formatSizeBreakdown(sessions: LabSessionSummary[]): string {
  if (!sessions.length) return "No data";
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const size = sessionSize(session);
    counts.set(size, (counts.get(size) ?? 0) + 1);
  }
  return sizeSeries
    .map((item) => {
      const count = counts.get(item.key) ?? 0;
      return count > 0 ? `${item.label} ${count}` : null;
    })
    .filter(Boolean)
    .join(", ") || "No data";
}

function formatOriginBreakdown(sessions: LabSessionSummary[]): string {
  if (!sessions.length) return "No data";
  const counts = new Map<LabSessionSource, number>();
  for (const session of sessions) {
    counts.set(session.source, (counts.get(session.source) ?? 0) + 1);
  }
  return originSeries
    .map((item) => {
    const source =
      item.key === "productAgent"
        ? "product_agent"
        : item.key === "continuityThread"
          ? "continuity_thread"
          : "memoryos";
      const count = counts.get(source as LabSessionSource) ?? 0;
      return count > 0 ? `${item.label} ${count}` : null;
    })
    .filter(Boolean)
    .join(", ") || "No data";
}

function buildUserRows({
  data,
  fallbackName,
  fallbackEmail,
  mode,
}: {
  data: AnalyticsData;
  fallbackName: string;
  fallbackEmail: string;
  mode: UserMetricMode;
}): AnalyticsUserRow[] {
  const members =
    data.team?.members.length
      ? data.team.members.map((member) => ({
          name: member.name?.trim() || member.email?.trim() || fallbackName,
          email: member.email?.trim() || fallbackEmail,
        }))
      : [{ name: fallbackName, email: fallbackEmail }];
  const totalSessions = Math.max(data.sessions.length, 1);
  const totalSearches = Math.max(data.billing?.usage.searchUsed ?? 0, 1);

  return members.map((member, index) => {
    const memberKey = member.name.trim().toLowerCase();
    const sessions =
      data.sessions.filter((session) => {
        const creator = (session.creator ?? "").trim().toLowerCase();
        return creator && creator === memberKey;
      }) || [];
    const assignedSessions = sessions.length > 0 || index > 0 ? sessions : data.sessions;
    const sessionsCreated = assignedSessions.length;
    const searchesCreated = index === 0 ? data.billing?.usage.searchUsed ?? 0 : 0;
    const percent = (value: number, total: number) => `${((value / total) * 100).toFixed(0)}%`;
    const displaySessions = mode === "Percentages" ? percent(sessionsCreated, totalSessions) : String(sessionsCreated);
    const displaySearches = mode === "Percentages" ? percent(searchesCreated, totalSearches) : String(searchesCreated);
    const totalCostValue = sessionsCreated * 0.61;

    return {
      email: member.email,
      name: member.name,
      totalCost: `$${totalCostValue.toFixed(2)}`,
      sessionsCreated: displaySessions,
      costPerSession: sessionsCreated ? "$0.61" : "-",
      sessionsBySize: formatSizeBreakdown(assignedSessions),
      sessionsWithMergedPrsBySize: "No data",
      sessionsByOrigin: formatOriginBreakdown(assignedSessions),
      sessionsWithSearch: "0",
      sessionsWithPlaybook: String(assignedSessions.filter((session) => session.playbook).length),
      searchesCreated: displaySearches,
      costPerSearch: searchesCreated ? "$0.01" : "-",
      searchesPerSession: sessionsCreated ? (searchesCreated / sessionsCreated).toFixed(2) : "-",
      prsCreated: "0",
      prsByStatus: "No data",
      costPerPrMerged: "-",
    };
  });
}

function UsageSubTabs({ active, onChange }: { active: UsageView; onChange: (view: UsageView) => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      {(["overall", "users"] as const).map((view) => (
        <button
          key={view}
          type="button"
          onClick={() => onChange(view)}
          className={cn(
            "inline-flex h-8 items-center rounded-md px-3 text-sm font-semibold transition",
            active === view
              ? "bg-white/[0.08] text-[#F0EFE2]"
              : "text-[#F0EFE2]/48 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80",
          )}
        >
          {view === "overall" ? "Overall" : "Users"}
        </button>
      ))}
    </div>
  );
}

function InlineCadenceToggle({
  value,
  onChange,
}: {
  value: ChartCadence;
  onChange: (value: ChartCadence) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {(["Daily", "Weekly"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "inline-flex h-8 items-center rounded-md px-3 text-sm font-semibold transition",
            value === item
              ? "bg-white/[0.08] text-[#F0EFE2]"
              : "text-[#F0EFE2]/48 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function UsersTable({
  rows,
  mode,
  onModeChange,
}: {
  rows: AnalyticsUserRow[];
  mode: UserMetricMode;
  onModeChange: (mode: UserMetricMode) => void;
}) {
  const columns: { key: keyof AnalyticsUserRow; label: string; group?: string; shaded?: boolean }[] = [
    { key: "email", label: "Email" },
    { key: "name", label: "Name" },
    { key: "totalCost", label: "Total cost", group: "Sessions" },
    { key: "sessionsCreated", label: "Sessions created", group: "Sessions" },
    { key: "costPerSession", label: "$ per session", group: "Sessions" },
    { key: "sessionsBySize", label: "Sessions by size", group: "Sessions", shaded: true },
    { key: "sessionsWithMergedPrsBySize", label: "Sessions with merged PRs by size", group: "Sessions", shaded: true },
    { key: "sessionsByOrigin", label: "Sessions by origin", group: "Sessions", shaded: true },
    { key: "sessionsWithSearch", label: "Sessions with search", group: "Searches" },
    { key: "sessionsWithPlaybook", label: "Sessions with playbook", group: "Searches" },
    { key: "searchesCreated", label: "Searches created", group: "Searches" },
    { key: "costPerSearch", label: "$ / search", group: "Searches" },
    { key: "searchesPerSession", label: "Searches per session", group: "Searches" },
    { key: "prsCreated", label: "PRs created", group: "PRs" },
    { key: "prsByStatus", label: "PRs by status", group: "PRs", shaded: true },
    { key: "costPerPrMerged", label: "$ per PR merged", group: "PRs" },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Users" info />
        <div className="flex flex-wrap items-center gap-2">
          <InlineSegmented
            value={mode}
            options={["Counts", "Percentages"]}
            onChange={onModeChange}
          />
          <button
            type="button"
            onClick={() => exportUsersCsv(rows)}
            className="inline-flex h-9 items-center rounded-md bg-[#3B82F6] px-3.5 text-sm font-semibold text-[#F0EFE2] transition hover:bg-[#60A5FA]"
          >
            Export to CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-white/[0.08] bg-[#1A1A1A]">
        <table className="min-w-[1680px] table-fixed text-left text-sm">
          <thead>
            <tr className="bg-white/[0.05]">
              <th className="w-64 px-4 py-3" />
              <th className="w-56 px-4 py-3" />
              <th colSpan={6} className="px-4 py-3 text-center font-semibold text-[#F0EFE2]">
                Sessions
              </th>
              <th colSpan={5} className="px-4 py-3 text-center font-semibold text-[#F0EFE2]">
                Searches
              </th>
              <th colSpan={3} className="px-4 py-3 text-center font-semibold text-[#F0EFE2]">
                PRs
              </th>
            </tr>
            <tr className="border-t border-white/[0.06] bg-white/[0.05]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 font-semibold text-[#F0EFE2]",
                    column.shaded && "bg-white/[0.04]",
                  )}
                >
                  {column.shaded ? <span className="mr-2 text-[#F0EFE2]/45">›</span> : null}
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.email} className="border-t border-white/[0.06]">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "truncate px-4 py-3 text-[#F0EFE2]/58",
                      column.key === "name" && "text-[#F0EFE2]/70",
                      column.shaded && "bg-white/[0.04]",
                    )}
                    title={String(row[column.key])}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InlineSegmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold transition",
            value === option
              ? "bg-white/[0.08] text-[#F0EFE2]"
              : "text-[#F0EFE2]/48 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function UserUsageTab({
  data,
  dailyChartData,
  weeklyChartData,
  fallbackName,
  fallbackEmail,
}: {
  data: AnalyticsData;
  dailyChartData: ChartPoint[];
  weeklyChartData: ChartPoint[];
  fallbackName: string;
  fallbackEmail: string;
}) {
  const [activeCadence, setActiveCadence] = useState<ChartCadence>("Daily");
  const [reviewCadence, setReviewCadence] = useState<ChartCadence>("Daily");
  const [metricMode, setMetricMode] = useState<UserMetricMode>("Counts");
  const rows = useMemo(
    () =>
      buildUserRows({
        data,
        fallbackName,
        fallbackEmail,
        mode: metricMode,
      }),
    [data, fallbackEmail, fallbackName, metricMode],
  );
  const activeData = activeCadence === "Weekly" ? weeklyChartData : dailyChartData;
  const reviewData = reviewCadence === "Weekly" ? weeklyChartData : dailyChartData;

  return (
    <div className="space-y-9">
      <section className="space-y-4">
        <SectionTitle title="Active users" info />
        <ChartPanel
          title="Active users over time"
          data={activeData}
          series={activeUserSeries}
          controls={<InlineCadenceToggle value={activeCadence} onChange={setActiveCadence} />}
        />
      </section>

      <section className="space-y-4">
        <SectionTitle title="MemoryOS review users" info />
        <ChartPanel
          title="MemoryOS review users over time"
          data={reviewData}
          series={reviewUserSeries}
          controls={<InlineCadenceToggle value={reviewCadence} onChange={setReviewCadence} />}
        />
      </section>

      <UsersTable rows={rows} mode={metricMode} onModeChange={setMetricMode} />
    </div>
  );
}

function UsageTab({
  data,
  sessionsChartData,
  searchesChartData,
  prChartData,
  reviewChartData,
  activeUserDailyData,
  activeUserWeeklyData,
  usageView,
  sessionBreakdown,
  sessionCadence,
  searchCadence,
  prCadence,
  reviewCadence,
  currentUserName,
  currentUserEmail,
  onUsageViewChange,
  onSessionBreakdownChange,
  onSessionCadenceChange,
  onSearchCadenceChange,
  onPrCadenceChange,
  onReviewCadenceChange,
}: {
  data: AnalyticsData;
  sessionsChartData: ChartPoint[];
  searchesChartData: ChartPoint[];
  prChartData: ChartPoint[];
  reviewChartData: ChartPoint[];
  activeUserDailyData: ChartPoint[];
  activeUserWeeklyData: ChartPoint[];
  usageView: UsageView;
  sessionBreakdown: SessionBreakdown;
  sessionCadence: ChartCadence;
  searchCadence: ChartCadence;
  prCadence: ChartCadence;
  reviewCadence: ChartCadence;
  currentUserName: string;
  currentUserEmail: string;
  onUsageViewChange: (value: UsageView) => void;
  onSessionBreakdownChange: (value: SessionBreakdown) => void;
  onSessionCadenceChange: (value: ChartCadence) => void;
  onSearchCadenceChange: (value: ChartCadence) => void;
  onPrCadenceChange: (value: ChartCadence) => void;
  onReviewCadenceChange: (value: ChartCadence) => void;
}) {
  const sessionCount = data.sessions.length;
  const searchCount = data.billing?.usage.searchUsed ?? 0;
  const costPerSession = sessionCount > 0 ? "$0.61" : "-";
  const costPerSearch = searchCount > 0 ? "$0.01" : "-";
  const sessionSeries = sessionBreakdown === "By size" ? sizeSeries : originSeries;

  if (usageView === "users") {
    return (
      <div className="space-y-6">
        <UsageSubTabs active={usageView} onChange={onUsageViewChange} />
        <UserUsageTab
          data={data}
          dailyChartData={activeUserDailyData}
          weeklyChartData={activeUserWeeklyData}
          fallbackName={currentUserName}
          fallbackEmail={currentUserEmail}
        />
      </div>
    );
  }

  return (
    <div className="space-y-9">
      <UsageSubTabs active={usageView} onChange={onUsageViewChange} />
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Sessions" info />
          <button
            type="button"
            onClick={() => exportSessionsCsv(data.sessions)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#3B82F6] px-3.5 text-sm font-semibold text-[#F0EFE2] transition hover:bg-[#60A5FA]"
          >
            <Download className="size-4" aria-hidden />
            Export session data
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard label="Number of sessions" value={String(sessionCount)} />
          <MetricCard label="$ / session" value={costPerSession} />
        </div>
        <ChartPanel
          title="Sessions over time"
          data={sessionsChartData}
          series={sessionSeries}
          controls={
            <>
              <SettingsSelectDropdown
                value={sessionBreakdown}
                onChange={onSessionBreakdownChange}
                options={[
                  { value: "By size", label: "By size" },
                  { value: "By origin", label: "By origin" },
                ]}
                className={selectClass}
              />
              <SettingsSelectDropdown
                value={sessionCadence}
                onChange={onSessionCadenceChange}
                options={[
                  { value: "Daily", label: "Daily" },
                  { value: "Weekly", label: "Weekly" },
                ]}
                className={selectClass}
              />
            </>
          }
        />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Searches" info />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Number of searches" value={String(searchCount)} />
          <MetricCard label="$ / search" value={costPerSearch} />
          <MetricCard label="Searches to sessions ratio" value={sessionCount ? (searchCount / sessionCount).toFixed(2) : "0.00"} />
        </div>
        <ChartPanel
          title="Searches over time"
          data={searchesChartData}
          series={[{ key: "searches", label: "Searches", color: "#3B82F6" }]}
          controls={
            <SettingsSelectDropdown
              value={searchCadence}
              onChange={onSearchCadenceChange}
              options={[
                { value: "Daily", label: "Daily" },
                { value: "Weekly", label: "Weekly" },
              ]}
              className={selectClass}
            />
          }
        />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Pull requests" info />
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="PRs created" value="0" />
          <MetricCard label="PRs merged" value="0" />
          <MetricCard label="PR merge rate" value="-" />
          <MetricCard label="$ / PR merged" value="-" />
        </div>
        <ChartPanel
          title="Pull requests over time"
          data={prChartData}
          series={prSeries}
          controls={
            <SettingsSelectDropdown
              value={prCadence}
              onChange={onPrCadenceChange}
              options={[
                { value: "Daily", label: "Daily" },
                { value: "Weekly", label: "Weekly" },
              ]}
              className={selectClass}
            />
          }
        />
      </section>

      <InfoPanel>
        PR data is tracked for GitHub, Azure DevOps, Bitbucket, and GitLab in SaaS deployments.
        Status for non-GitHub PRs may be temporarily out of date.
      </InfoPanel>

      <section className="space-y-4">
        <SectionTitle
          title="MemoryOS reviews"
          subtitle="Reviews grouped by the day they were created"
          info
        />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="PRs reviewed" value="0" />
          <MetricCard label="Jobs ran" value="0" />
          <MetricCard label="Merge time reduction" value="-" />
          <MetricCard label="Bugs caught" value="0" />
          <MetricCard label="$ per review" value="-" />
          <MetricCard label="$ per PR" value="-" />
        </div>
        <ChartPanel
          title="Review jobs over time"
          data={reviewChartData}
          series={reviewedSeries}
          controls={
            <SettingsSelectDropdown
              value={reviewCadence}
              onChange={onReviewCadenceChange}
              options={[
                { value: "Daily", label: "Daily" },
                { value: "Weekly", label: "Weekly" },
              ]}
              className={selectClass}
            />
          }
        />
      </section>
    </div>
  );
}

function ProductivityTab({ data, chartData }: { data: AnalyticsData; chartData: ChartPoint[] }) {
  const activeMembers = data.team?.members.filter((member) => member.status === "active").length ?? 1;
  return (
    <div className="space-y-6">
      <SectionTitle title="Productivity" subtitle="Operational activity across sessions, reviews, and team usage." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Active members" value={String(activeMembers)} />
        <MetricCard label="Sessions per member" value={(data.sessions.length / Math.max(activeMembers, 1)).toFixed(2)} />
        <MetricCard label="Automation runs" value="0" />
        <MetricCard label="Estimated hours saved" value="0.0" />
      </div>
      <ChartPanel
        title="Productivity over time"
        data={chartData}
        series={originSeries}
        height={320}
      />
    </div>
  );
}

function CategoriesTab({ data, chartData }: { data: AnalyticsData; chartData: ChartPoint[] }) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Categories" subtitle="Breakdowns by session size, origin, and repository coverage." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Indexed repositories" value={`${data.repos?.indexed ?? 0} / ${data.repos?.total ?? 0}`} />
        <MetricCard label="Connector sync records" value={String(data.billing?.connectorSyncUsage?.used ?? 0)} />
        <MetricCard label="MemoryOS sessions" value={String(data.sessions.filter((session) => session.source === "memoryos").length)} />
        <MetricCard label="MemoryOS agent sessions" value={String(data.sessions.filter((session) => session.source === "product_agent").length)} />
      </div>
      <ChartPanel
        title="Sessions by size"
        data={chartData}
        series={sizeSeries}
        height={320}
      />
      <ChartPanel
        title="Sessions by origin"
        data={chartData}
        series={originSeries}
        height={320}
      />
    </div>
  );
}

export function ContinuityLabAnalyticsSection() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("usage");
  const [range, setRange] = useState<DateRange>("this-month");
  const [customRange, setCustomRange] = useState<CustomDateRange>(() => {
    const today = copyDate(new Date());
    return { start: today, end: addDays(today, 30) };
  });
  const [usageView, setUsageView] = useState<UsageView>("overall");
  const [sessionBreakdown, setSessionBreakdown] = useState<SessionBreakdown>("By size");
  const [sessionCadence, setSessionCadence] = useState<ChartCadence>("Daily");
  const [searchCadence, setSearchCadence] = useState<ChartCadence>("Daily");
  const [prCadence, setPrCadence] = useState<ChartCadence>("Daily");
  const [reviewCadence, setReviewCadence] = useState<ChartCadence>("Daily");
  const [data, setData] = useState<AnalyticsData>({
    billing: null,
    team: null,
    sessions: [],
    repos: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [billing, team, sessionsResult, repos] = await Promise.all([
          fetchBackendJson<BillingSnapshot>("/api/memory/billing"),
          fetchBackendJson<TeamSnapshot>("/api/memory/team"),
          fetchLabSessionsList({ limit: 200, signal: controller.signal }),
          fetchIndexedReposSummary(),
        ]);
        if (cancelled) return;
        setData({
          billing,
          team,
          sessions: sessionsResult.sessions,
          repos,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load analytics.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const currentUserName = user?.fullName?.trim() || user?.username?.trim() || "Current user";
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.trim() || "current-user@memoryos.local";

  const selectedRange = useMemo(() => rangeFor(range, customRange), [customRange, range]);

  const chartPoints = useMemo(() => {
    const points = buildRangePoints(selectedRange, "Daily");
    applySessionData(points, data.sessions, selectedRange);
    applyUserActivityData(points, data.sessions, selectedRange);
    if (data.billing?.usage.searchUsed) {
      points[0].searches = data.billing.usage.searchUsed;
    }
    return points;
  }, [data.billing?.usage.searchUsed, data.sessions, selectedRange]);

  const weeklyPoints = useMemo(() => {
    const points = buildRangePoints(selectedRange, "Weekly");
    applySessionData(points, data.sessions, selectedRange);
    applyUserActivityData(points, data.sessions, selectedRange);
    if (data.billing?.usage.searchUsed) {
      points[0].searches = data.billing.usage.searchUsed;
    }
    return points;
  }, [data.billing?.usage.searchUsed, data.sessions, selectedRange]);

  const chartFor = (cadence: ChartCadence) =>
    compactChartPoints(cadence === "Weekly" ? weeklyPoints : chartPoints, cadence);

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="analytics"
      titleOverride="Settings"
      descriptionOverride=""
      contentClassName="max-w-6xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AnalyticsTabs active={activeTab} onChange={setActiveTab} />
          <AnalyticsDateRangeDropdown
            value={range}
            onChange={setRange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>

        <Link
          href="/continuity-lab/settings/general"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#F0EFE2]/50 hover:text-[#F0EFE2]/75"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to organization
        </Link>

        {loading ? <p className="text-sm text-[#F0EFE2]/45">Loading analytics...</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        {!loading && activeTab === "usage" ? (
          <UsageTab
            data={data}
            sessionsChartData={chartFor(sessionCadence)}
            searchesChartData={chartFor(searchCadence)}
            prChartData={chartFor(prCadence)}
            reviewChartData={chartFor(reviewCadence)}
            activeUserDailyData={chartFor("Daily")}
            activeUserWeeklyData={chartFor("Weekly")}
            usageView={usageView}
            sessionBreakdown={sessionBreakdown}
            sessionCadence={sessionCadence}
            searchCadence={searchCadence}
            prCadence={prCadence}
            reviewCadence={reviewCadence}
            currentUserName={currentUserName}
            currentUserEmail={currentUserEmail}
            onUsageViewChange={setUsageView}
            onSessionBreakdownChange={setSessionBreakdown}
            onSessionCadenceChange={setSessionCadence}
            onSearchCadenceChange={setSearchCadence}
            onPrCadenceChange={setPrCadence}
            onReviewCadenceChange={setReviewCadence}
          />
        ) : null}

        {!loading && activeTab === "productivity" ? (
          <ProductivityTab data={data} chartData={chartFor("Daily")} />
        ) : null}

        {!loading && activeTab === "categories" ? (
          <CategoriesTab data={data} chartData={chartFor("Daily")} />
        ) : null}
      </div>
    </ContinuityLabSettingsSectionFrame>
  );
}

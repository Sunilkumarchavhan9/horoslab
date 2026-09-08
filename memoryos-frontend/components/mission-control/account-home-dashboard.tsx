"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, isSameDay } from "date-fns";
import {
 Search,
 ChevronRight,
 MoreHorizontal,
 RefreshCw,
 Plus,
 Rocket,
 Building,
 Check,
 LayoutGrid,
 ArrowUpRight,
 ArrowDownRight,
 Trash2,
 Calendar as CalendarIcon,
 ChevronLeft,
 X,
 ChevronDown,
 CheckCircle2,
 AlertCircle,
 FileCheck,
 Briefcase,
} from "lucide-react";
import {
 getEpochMissionControlSnapshot,
 listEpochEvidence,
 listEpochMemoryRecords,
 readActiveEpochWorkspaceId,
 resolveActiveEpochWorkspaceId,
 type EpochMissionControlSnapshot,
 type EpochMission,
 type EpochEvidence,
} from "@/lib/epoch-api";
import { cn } from "@/lib/utils";
import { MetricCard } from "./ui/metric-card";
import { Timeline } from "./ui/timeline";
import { ActivityFeed } from "./ui/activity-feed";
import { useProfilePreferences } from "@/lib/continuity-lab/use-profile-preferences";
import {
 formatInProfileTimezone,
 profileLocale,
 profileText,
} from "@/lib/continuity-lab/profile-preferences-formatting";
import type {
 ProfileLanguagePreference,
 ProfileTimezonePreference,
} from "@/lib/continuity-lab/profile-preferences-storage";

type ColumnType =
 | "Command Center" | "Missions" | "Institutions" | "Workers" | "Activity" | "Recents"
 | "Executions" | "Evidence" | "Verification" | "Approvals" | "Recovery"
 | "Production Intelligence" | "Failure Clusters" | "Root Causes" | "Evaluations" | "Replays" | "Fix Proposals" | "Reliability" | "Improvements"
 | "Memory Preflight" | "Mission Outcomes" | "Learning Handoff" | "Settlement" | "Certificates"
 | "API" | "API Keys" | "SDK" | "MCP" | "CLI" | "Webhooks" | "Edge Runtime"
 | "Policies" | "Budgets" | "Audit";

const ACCOUNT_HOME_COLUMN_TYPES: ColumnType[] = [
 "Command Center", "Missions", "Institutions", "Workers", "Activity", "Recents",
 "Executions", "Evidence", "Verification", "Approvals", "Recovery",
 "Production Intelligence", "Failure Clusters", "Root Causes", "Evaluations", "Replays", "Fix Proposals", "Reliability", "Improvements",
 "Memory Preflight", "Mission Outcomes", "Learning Handoff", "Settlement", "Certificates",
 "API", "API Keys", "SDK", "MCP", "CLI", "Webhooks", "Edge Runtime",
 "Policies", "Budgets", "Audit",
];
type SpanSize = "1x1" | "2x1" | "2x2";

export interface MetricCardData {
 id: string;
 title: string;
 value: string | number;
 change?: string;
 changeType?: "up" | "down";
 badge?: string;
 points?: number[];
 metricName?: string;
 spanSize?: SpanSize;
}

/* Blue Diagonal Arrows Icon matching Screenshot */
function BlueDragHandleIcon({ className }: { className?: string }) {
 return (
 <svg className={cn("size-3.5 text-[#0f52ff]", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">

 <path d="M15 9l5-5" />
 <path d="M15 4h5v5" />
 <path d="M9 15l-5 5" />
 <path d="M9 20H4v-5" />
 </svg>
 );
}

const AVAILABLE_METRICS_CATALOG = [
 { id: "cpu_time", title: "CPU Time (P90)", value: "1.4 ms", change: "12%", changeType: "down", points: [0.8, 1.2, 0.9, 1.8, 1.4], metricName: "CPU Time" },
 { id: "encrypted_req", title: "Encrypted Requests Rate", value: "52.2%", change: "6.1%", changeType: "down", points: [40, 55, 30, 60, 52.2], metricName: "Encrypted" },
 { id: "encrypted_bw", title: "Encrypted Bandwidth", value: "48.7 MB", change: "14.2%", changeType: "up", points: [20, 35, 28, 42, 48.7], metricName: "Bandwidth" },
 { id: "build_mins", title: "Build Minutes", value: "142 min", change: "5%", changeType: "up", points: [80, 110, 95, 130, 142], metricName: "Build Mins" },
 { id: "cache_rate", title: "Cache Rate", value: "88.4%", change: "2.3%", changeType: "up", points: [75, 82, 80, 89, 88.4], metricName: "Cache Rate" },
 { id: "total_bw", title: "Total Bandwidth", value: "1.2 GB", change: "8.9%", changeType: "down", points: [0.5, 0.9, 0.7, 1.4, 1.2], metricName: "Total BW" },
];

function parseMissionControlRangeDurationMs(range: string | number): number {
 if (typeof range === "number" && Number.isFinite(range)) {
 return Math.max(0, range);
 }
 if (typeof range !== "string") {
 return 30 * 24 * 60 * 60 * 1000;
 }
 const value = range.trim().toLowerCase();
 if (value.includes("30 minutes") || value === "30m") return 30 * 60 * 1000;
 if (value.includes("1 hour") || value === "1h") return 60 * 60 * 1000;
 if (value.includes("6 hours") || value === "6h") return 6 * 60 * 60 * 1000;
 if (value.includes("12 hours") || value === "12h") return 12 * 60 * 60 * 1000;
 if (value.includes("24 hours") || value === "24h") return 24 * 60 * 60 * 1000;
 if (value.includes("7 days") || value === "7d") return 7 * 24 * 60 * 60 * 1000;
 return 30 * 24 * 60 * 60 * 1000;
}

type TimelineItem = {
 createdAt?: string | null;
 updatedAt?: string | null;
};

type RecentActivityItem = {
 id: string;
 title: string;
 sub: string;
 timestamp?: string;
 icon: React.ReactNode;
 tone: "emerald" | "blue" | "slate" | "amber";
};

type SearchResult =
 | {
 type: "tip";
 id: string;
 label: string;
 icon: React.ReactNode;
 sub?: never;
 tone?: never;
 }
 | {
 type: "item";
 id: string;
 label: string;
 sub: string;
 icon: React.ReactNode;
 tone: RecentActivityItem["tone"];
 targetSection?: string;
 };


function enforceGridPadding(arr: (MetricCardData | null)[]): (MetricCardData | null)[] {
  let lastFilled = -1;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined) {
      lastFilled = i;
      break;
    }
  }
  const targetLength = (Math.floor(lastFilled / 4) + 2) * 4;
  const next = [...arr];
  next.length = targetLength;
  for (let i = 0; i < targetLength; i++) {
    if (next[i] === undefined) next[i] = null;
  }
  return next;
}

let cachedAccountHomeSnapshot: EpochMissionControlSnapshot | null = null;

function formatRelativeTime(
 value?: string,
 language: ProfileLanguagePreference = "en",
): string {
 if (!value) return "Unknown";
 const timestamp = new Date(value).getTime();
 if (!Number.isFinite(timestamp)) return "Unknown";
 const diffMs = timestamp - Date.now();
 const diffMinutes = Math.round(diffMs / 60000);
 const absMinutes = Math.abs(diffMinutes);

 if (absMinutes < 1) return language === "es" ? "Ahora" : language === "fr" ? "À l’instant" : "Just now";
 if (absMinutes < 60) {
 const unit = language === "es" ? "min" : language === "fr" ? "min" : "min";
 const suffix = diffMinutes < 0 ? language === "es" ? " atrás" : language === "fr" ? "" : " ago" : "";
 return `${absMinutes} ${unit}${suffix}`;
 }

 const diffHours = Math.round(diffMinutes / 60);
 const absHours = Math.abs(diffHours);
 if (absHours < 24) {
 const hour = language === "es" ? "hora" : language === "fr" ? "heure" : "hour";
 const plural = absHours === 1 ? "" : language === "es" ? "s" : language === "fr" ? "s" : "s";
 const suffix = diffHours < 0 ? language === "es" ? " atrás" : language === "fr" ? "" : " ago" : "";
 return `${absHours} ${hour}${plural}${suffix}`;
 }

 const diffDays = Math.round(diffHours / 24);
 const absDays = Math.abs(diffDays);
 const day = language === "es" ? "día" : language === "fr" ? "jour" : "day";
 const plural = absDays === 1 ? "" : language === "es" ? "s" : language === "fr" ? "s" : "s";
 const suffix = diffDays < 0 ? language === "es" ? " atrás" : language === "fr" ? "" : " ago" : "";
 return `${absDays} ${day}${plural}${suffix}`;
}

function parseTimestamp(value?: string): number {
 if (!value) return 0;
 const parsed = new Date(value).getTime();
 return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTimeLocalInputValue(value: Date): string {
 const pad = (input: number) => String(input).padStart(2, "0");
 return [
 value.getFullYear(),
 "-",
 pad(value.getMonth() + 1),
 "-",
 pad(value.getDate()),
 "T",
 pad(value.getHours()),
 ":",
 pad(value.getMinutes()),
 ].join("");
}

function parseDateTimeLocalInputValue(value: string): Date | null {
 const parsed = new Date(value);
 return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDayLocal(value: Date): Date {
 return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfDayLocal(value: Date): Date {
 return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 0, 0);
}

function addMonthsLocal(value: Date, months: number): Date {
 return new Date(value.getFullYear(), value.getMonth() + months, 1, 0, 0, 0, 0);
}

function sameDayLocal(a: Date, b: Date): boolean {
 return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarDays(month: Date): Date[] {
 const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0);
 const startOffset = firstOfMonth.getDay();
 const start = new Date(firstOfMonth);
 start.setDate(firstOfMonth.getDate() - startOffset);

 return Array.from({ length: 42 }, (_, index) => {
 const date = new Date(start);
 date.setDate(start.getDate() + index);
 return date;
 });
}

function buildRangeWindow(preset: string): { start: Date; end: Date } {
 const end = new Date();
 const start = new Date(end.getTime() - parseMissionControlRangeDurationMs(preset));
 return { start, end };
}

function buildTimelineSeries(items: TimelineItem[], range: string | number, buckets = 5): number[] {
 const durationMs = parseMissionControlRangeDurationMs(range);
 const bucketMs = Math.max(1, Math.floor(durationMs / buckets));
 const now = Date.now();
 const series = Array.from({ length: buckets }, () => 0);

 for (const item of items) {
 const stamp = item.updatedAt ?? item.createdAt;
 if (!stamp) continue;
 const timestamp = new Date(stamp).getTime();
 if (Number.isNaN(timestamp)) continue;
 const age = now - timestamp;
 if (age < 0 || age > durationMs) continue;
 const bucketIndex = Math.min(buckets - 1, Math.floor(age / bucketMs));
 series[buckets - 1 - bucketIndex] += 1;
 }

 return series;
}

function summarizeSeriesTrend(series: number[]): { change: string; changeType: "up" | "down" } {
 if (series.length < 2) {
 return { change: "Live", changeType: "up" };
 }

 const first = series[0] ?? 0;
 const last = series[series.length - 1] ?? 0;

 if (first === 0 && last === 0) {
 return { change: "Live", changeType: "up" };
 }

 if (first === 0) {
 return { change: `+${last}`, changeType: "up" };
 }

 const delta = last - first;
 if (delta === 0) {
 return { change: "Live", changeType: "up" };
 }

 const pct = Math.abs((delta / first) * 100);
 return {
 change: `${delta > 0 ? "+" : "-"}${pct.toFixed(0)}%`,
 changeType: delta > 0 ? "up" : "down",
 };
}

function flattenMissionEvidence(missions: EpochMission[]): EpochEvidence[] {
 const evidence: EpochEvidence[] = [];
 for (const mission of missions) {
 const missionEvidence = (mission as EpochMission & { evidence?: EpochEvidence[] }).evidence ?? [];
 evidence.push(...missionEvidence);
 }
 return evidence;
}

function buildLiveMetricSlots(snapshot: EpochMissionControlSnapshot | null, range: string | number): (MetricCardData | null)[] {
 const institutions = snapshot?.recent?.institutions ?? [];
 const missions = snapshot?.recent?.missions ?? [];
 const evidence = flattenMissionEvidence(missions);
 const verifications = missions.filter((mission) => Boolean(mission.verificationRun));

 const institutionSeries = buildTimelineSeries(institutions, range);
 const missionSeries = buildTimelineSeries(missions, range);
 const evidenceSeries = buildTimelineSeries(evidence, range);
  const verificationSeries = buildTimelineSeries(verifications, range);
 const institutionTrend = summarizeSeriesTrend(institutionSeries);
 const missionTrend = summarizeSeriesTrend(missionSeries);
 const evidenceTrend = summarizeSeriesTrend(evidenceSeries);
 const verificationTrend = summarizeSeriesTrend(verificationSeries);

 return enforceGridPadding([
 {
 id: "active_institutions",
 title: "Active institutions",
 value: snapshot?.overview?.institutions ?? 0,
 change: institutionTrend.change,
 changeType: institutionTrend.changeType,
 points: institutionSeries,
 metricName: "Institutions",
 spanSize: "1x1",
 },
 {
 id: "active_missions",
 title: "Active missions",
 value: snapshot?.overview?.missions ?? 0,
 change: missionTrend.change,
 changeType: missionTrend.changeType,
 points: missionSeries,
 metricName: "Missions",
 spanSize: "1x1",
 },
 {
 id: "evidence_collected",
 title: "Evidence collected",
 value: snapshot?.overview?.evidence ?? 0,
 change: evidenceTrend.change,
 changeType: evidenceTrend.changeType,
 points: evidenceSeries,
 metricName: "Evidence",
 spanSize: "1x1",
  },
 {
 id: "human_reviews",
 title: "Human reviews / verifications",
 value: snapshot?.overview?.verifications ?? 0,
 change: verificationTrend.change,
 changeType: verificationTrend.changeType,
 points: verificationSeries,
 metricName: "Verifications",
 spanSize: "1x1",
 },
 ]);
}

function buildRecentActivityItems(snapshot: EpochMissionControlSnapshot | null): RecentActivityItem[] {
 const institutions = snapshot?.recent?.institutions ?? [];
 const missions = snapshot?.recent?.missions ?? [];
 const evidence = flattenMissionEvidence(missions);

 const items: RecentActivityItem[] = [];

 for (const institution of institutions) {
 const timestamp = institution.updatedAt ?? institution.createdAt;
 if (!timestamp) continue;

 items.push({
 id: `institution-${institution.id}-${timestamp}`,
 title: institution.name,
 sub: `${institution.currentState ?? institution.status ?? "Active"} • ${institution.template?.name ?? institution.category ?? "Institution"}`,
 timestamp,
 icon: <Building className="size-4 text-[#0f52ff]" />,
 tone: "blue",
 });
 }

 for (const mission of missions) {
 const missionActivity = mission as EpochMission & {
 verificationRun?: { createdAt?: string | null; finalDecision?: string | null; confidence?: number | null };
 certificate?: { createdAt?: string | null };
 };
 const timestamp = missionActivity.verificationRun?.createdAt ?? missionActivity.certificate?.createdAt ?? missionActivity.updatedAt;
 if (!timestamp) continue;

 const decision = missionActivity.verificationRun?.finalDecision?.toUpperCase?.() ?? "";
 const title =
 decision === "PASS"
 ? `Verification passed: ${mission.title ?? mission.id}`
 : decision === "FAIL"
 ? `Verification failed: ${mission.title ?? mission.id}`
 : decision === "REVIEW"
 ? `Verification review: ${mission.title ?? mission.id}`
 : missionActivity.certificate
 ? `Certificate issued: ${mission.title ?? mission.id}`
 : mission.state
 ? `Mission ${mission.state}: ${mission.title ?? mission.id}`
 : `Mission updated: ${mission.title ?? mission.id}`;

 const detail =
 missionActivity.verificationRun?.confidence != null
 ? `${missionActivity.verificationRun.confidence}% confidence`
 : mission.currentStep ?? mission.objective ?? "Live mission activity";

 items.push({
 id: `mission-${mission.id}-${timestamp}`,
 title,
 sub: detail,
 timestamp,
 icon:
 decision === "PASS" ? (
 <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-500" />
 ) : decision === "FAIL" ? (
 <AlertCircle className="size-4 text-rose-600 dark:text-rose-500" />
 ) : missionActivity.certificate ? (
 <FileCheck className="size-4 text-[#0f52ff]" />
 ) : (
 <Rocket className="size-4 text-muted-foreground dark:text-[#F0EFE2]/50" />
 ),
 tone: decision === "PASS" ? "emerald" : decision === "FAIL" ? "amber" : "slate",
 });
 }

 for (const item of evidence) {
 const timestamp = item.createdAt;
 if (!timestamp) continue;

 items.push({
 id: `evidence-${item.id}-${timestamp}`,
 title: item.summary ?? item.filePath ?? item.kind ?? "Evidence uploaded",
 sub: item.filePath ?? item.contentType ?? item.kind ?? "Evidence record",
 timestamp,
 icon: <FileCheck className="size-4 text-[#0f52ff]" />,
 tone: "blue",
 });
 }

 return items
 .sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp))
 .slice(0, 4);
}
export function DashboardSkeletonLoader() {
 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="max-w-6xl w-full mx-auto space-y-10 py-6"
 >
 <div className="space-y-4 max-w-4xl mx-auto">
 <div className="h-6 w-3/4 bg-gradient-to-r from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5 rounded-full animate-pulse" />
 <div className="border-b border-border dark:border-white/10/60 my-2" />
 <div className="h-6 w-1/3 bg-gradient-to-r from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5 rounded-full animate-pulse" />
 <div className="border-b border-border dark:border-white/10/60 my-2" />
 <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5 rounded-full animate-pulse" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
 {[1, 2, 3, 4, 5, 6].map((idx) => (
 <div
 key={idx}
 className="bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md p-6 shadow-xs flex flex-col justify-between h-[190px] relative overflow-hidden"
 >
 <div className="space-y-3">
 <div className="h-3 w-1/2 bg-gradient-to-r from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5 rounded-full animate-pulse" />
 <div className="h-3 w-full bg-gradient-to-r from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5 rounded-full animate-pulse" />
 <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5 rounded-full animate-pulse" />
 <div className="h-3 w-2/3 bg-gradient-to-r from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5 rounded-full animate-pulse" />
 </div>

 <div className="w-full h-4 bg-card dark:bg-white/10 rounded-md animate-pulse mt-auto" />
 </div>
 ))}
 </div>
 </motion.div>
 );
}

/* Interactive Sparkline Graph */
function InteractiveSparklineGraph({
 points,
 strokeColor = "#2563eb",
 fillColor = "#2563eb",
 metricName = "Requests",
 spanSize = "1x1",
}: {
 points: number[];
 strokeColor?: string;
 fillColor?: string;
 metricName?: string;
 spanSize?: SpanSize;
}) {
 const [hoverIdx, setHoverIdx] = useState<number | null>(null);

 const min = Math.min(...points);
 const max = Math.max(...points);
 const range = max - min || 1;
 const isExpanded = spanSize !== "1x1";
 const isLarge = spanSize === "2x2";

 const width = isExpanded ? 520 : 280;
 const height = isLarge ? 220 : 90;

 const coords = points.map((val, idx) => {
 const x = (idx / (points.length - 1)) * (width - (isExpanded ? 30 : 0));
 const y = height - ((val - min) / range) * (height - 30) - 15;
 return { x, y, val };
 });

 const pathD = `M ${coords.map((c) => `${c.x},${c.y}`).join(" L ")}`;

 return (
 <motion.div
 layout
 transition={{ type: "spring", stiffness: 350, damping: 30 }}
 className={cn(
 "w-full relative overflow-visible select-none transition-all duration-300",
 isLarge ? "h-[220px] mt-4" : "h-[90px] mt-4"
 )}
 onMouseLeave={() => setHoverIdx(null)}
 >
 <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
 <defs>
 <linearGradient id={`grad-${strokeColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
 <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
 </linearGradient>
 </defs>

 <line x1="0" y1={height * 0.2} x2={width} y2={height * 0.2} className="stroke-[#f0f0f4] dark:stroke-white/5" strokeWidth="1" strokeDasharray="3 3" />
 <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} className="stroke-[#f0f0f4] dark:stroke-white/5" strokeWidth="1" strokeDasharray="3 3" />
 <line x1="0" y1={height * 0.8} x2={width} y2={height * 0.8} className="stroke-[#f0f0f4] dark:stroke-white/5" strokeWidth="1" strokeDasharray="3 3" />

 <path d={`${pathD} L ${width - (isExpanded ? 30 : 0)},${height} L 0,${height} Z`} fill={`url(#grad-${strokeColor.replace("#", "")})`} />
 <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

 {hoverIdx !== null && (
 <>
 <line
 x1={coords[hoverIdx].x}
 y1="0"
 x2={coords[hoverIdx].x}
 y2={height}
 className="stroke-[#cbd5e1] dark:stroke-white/20"
 strokeWidth="1"
 />
 <circle
 cx={coords[hoverIdx].x}
 cy={coords[hoverIdx].y}
 r="4"
 fill="#2563eb"
 className="stroke-white dark:stroke-black"
 strokeWidth="2"
 />
 </>
 )}
 </svg>

 {/* Y-Axis Ticks */}
 {isExpanded && (
 <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-between text-[10px] text-[#aaa] dark:text-[#F0EFE2]/20 font-mono pointer-events-none">
 <span>{Math.round(max)}</span>
 <span>{Math.round((max + min) / 2)}</span>
 <span>{Math.round(min)}</span>
 </div>
 )}

 {/* X-Axis Timestamps */}
 {isLarge && (
 <div className="absolute left-0 right-8 -bottom-5 flex justify-between text-[10.5px] text-muted-foreground dark:text-[#F0EFE2]/30 font-mono pointer-events-none border-t border-[#f0f0f2] dark:border-white/5 dark:border-white/5 pt-1">
 <span>14:30</span>
 <span>00:30</span>
 <span>04:30</span>
 <span>12:30</span>
 </div>
 )}

 <div className="absolute inset-0 flex right-8">
 {coords.map((_, idx) => (
 <div
 key={idx}
 className="flex-1 h-full cursor-crosshair"
 onMouseEnter={() => setHoverIdx(idx)}
 />
 ))}
 </div>

 {/* Floating Tooltip */}
 {hoverIdx !== null && (
 <motion.div
 initial={{ opacity: 0, y: 4 }}
 animate={{ opacity: 1, y: 0 }}
 className="absolute z-30 bg-card dark:bg-[#121212]/95 backdrop-blur-xs border border-border dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
 style={{
 left: `${(coords[hoverIdx].x / width) * 100}%`,
 top: `${(coords[hoverIdx].y / height) * 100}%`,
 }}
 >
 <div className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/60 font-medium">Live snapshot</div>
 <div className="text-[12px] font-semibold text-[#0f52ff]">
 {metricName} : {coords[hoverIdx].val}
 </div>
 </motion.div>
 )}
 </motion.div>
 );
}

/* Cloudflare Date Picker Modal Popover */
function DateRangePickerPopover({
 selectedPreset,
 windowRange,
 language,
 timezone,
 onSelectPreset,
 onApplyCustomRange,
 onClose,
 arrowPositionClass = "right-12",
}: {
 selectedPreset: string;
 windowRange: { start: Date; end: Date };
 language: ProfileLanguagePreference;
 timezone: ProfileTimezonePreference;
 onSelectPreset: (preset: string) => void;
 onApplyCustomRange: (input: { start: Date; end: Date }) => void;
 onClose: () => void;
 arrowPositionClass?: string;
}) {
 const [draftStart, setDraftStart] = useState(() => formatDateTimeLocalInputValue(windowRange.start));
 const [draftEnd, setDraftEnd] = useState(() => formatDateTimeLocalInputValue(windowRange.end));
 const [calendarMonth, setCalendarMonth] = useState(() => new Date(windowRange.start));
 const [selectionPhase, setSelectionPhase] = useState<"start" | "end">("start");
 const parsedDraftStart = parseDateTimeLocalInputValue(draftStart) ?? windowRange.start;
 const parsedDraftEnd = parseDateTimeLocalInputValue(draftEnd) ?? windowRange.end;
 const rangeStart = parsedDraftStart.getTime() <= parsedDraftEnd.getTime() ? parsedDraftStart : parsedDraftEnd;
 const rangeEnd = parsedDraftStart.getTime() <= parsedDraftEnd.getTime() ? parsedDraftEnd : parsedDraftStart;
 const calendarDays = buildCalendarDays(calendarMonth);
 const rangeStartDay = startOfDayLocal(rangeStart);
 const rangeEndDay = endOfDayLocal(rangeEnd);

 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -4 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -4 }}
 transition={{ duration: 0.18, ease: "easeOut" }}
 className="absolute right-0 top-12 z-50 w-[560px] bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md shadow-2xl p-6 text-sm text-foreground dark:text-[#F0EFE2]"
 >
 <div className={cn("absolute -top-[7px] size-3.5 bg-card dark:bg-[#121212] rotate-45 border-l border-t border-border dark:border-white/10 z-10", arrowPositionClass)} />

 <div className="grid grid-cols-2 gap-6 border-b border-[#f0f0f2] dark:border-white/5 pb-5 mb-4 relative z-20">
 <div>
 <div className="flex items-center justify-between mb-3 font-semibold text-xs">
 <span>{formatInProfileTimezone(calendarMonth, language, timezone, { month: "long", year: "numeric" })}</span>
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => setCalendarMonth((current) => addMonthsLocal(current, -1))}
 className="p-1 hover:bg-card rounded-md"
 >
 <ChevronLeft className="size-3.5" />
 </button>
 <button
 type="button"
 onClick={() => setCalendarMonth((current) => addMonthsLocal(current, 1))}
 className="p-1 hover:bg-card rounded-md"
 >
 <ChevronRight className="size-3.5" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground dark:text-[#F0EFE2]/50 mb-2">
 {Array.from({ length: 7 }, (_, index) => {
 const weekday = new Date(Date.UTC(2024, 0, 7 + index));
 return <span key={index}>{new Intl.DateTimeFormat(profileLocale(language), { weekday: "short", timeZone: "UTC" }).format(weekday)}</span>;
 })}
 </div>

 <div className="grid grid-cols-7 gap-1 text-center text-xs">
 {calendarDays.map((day, i) => {
 const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
 const isSelected = day >= rangeStartDay && day <= rangeEndDay;
 const isRangeStart = sameDayLocal(day, rangeStartDay);
 const isRangeEnd = sameDayLocal(day, rangeEndDay);

 return (
 <button
 key={i}
 type="button"
 onClick={() => {
 const clickedStart = startOfDayLocal(day);
 const clickedEnd = endOfDayLocal(day);

 if (selectionPhase === "start") {
 setDraftStart(formatDateTimeLocalInputValue(clickedStart));
 setDraftEnd(formatDateTimeLocalInputValue(clickedEnd));
 onApplyCustomRange({
 start: clickedStart,
 end: clickedEnd,
 });
 setSelectionPhase("end");
 return;
 }

 const nextStart = parsedDraftStart.getTime() <= clickedStart.getTime() ? parsedDraftStart : clickedStart;
 const nextEnd = parsedDraftStart.getTime() <= clickedStart.getTime() ? clickedEnd : endOfDayLocal(parsedDraftStart);
 setDraftStart(formatDateTimeLocalInputValue(nextStart));
 setDraftEnd(formatDateTimeLocalInputValue(nextEnd));
 onApplyCustomRange({
 start: nextStart,
 end: nextEnd,
 });
 setSelectionPhase("start");
 }}
 className={cn(
 "h-7 rounded-md flex items-center justify-center font-medium transition-colors",
 isRangeStart || isRangeEnd
 ? "bg-[#1a1a1a] dark:bg-white text-[#F0EFE2] font-bold"
 : isSelected
 ? "bg-[#eef4ff] dark:bg-[#0f52ff]/20 text-[#0f52ff] font-semibold"
 : isCurrentMonth
 ? "hover:bg-card text-foreground/90 dark:text-[#F0EFE2]/90"
 : "text-[#C8C7BA] dark:text-[#F0EFE2]/10"
 )}
 >
 {day.getDate()}
 </button>
 );
 })}
 </div>
 </div>

 <div className="space-y-1 text-xs">
 {["Last 30 minutes", "Last 1 hour", "Last 6 hours", "Last 12 hours", "Last 24 hours", "Last 7 days", "Last 30 days"].map((preset) => (
 <button
 key={preset}
 onClick={() => onSelectPreset(preset)}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md font-medium transition-colors block",
 selectedPreset === preset ? "bg-card dark:bg-white/10 text-foreground dark:text-[#F0EFE2] font-semibold" : "hover:bg-card dark:bg-white/10 text-muted-foreground dark:text-[#F0EFE2]/70"
 )}
 >
 {profileText(language, preset)}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-3 relative z-20">
 <div className="grid grid-cols-2 gap-3 text-xs">
 <div>
 <label className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/50 font-medium block mb-1">{profileText(language, "Start")}</label>
 <div className="flex items-center gap-2 h-9 px-3 bg-card dark:bg-white/5 border border-border dark:border-white/10 rounded-md">
 <CalendarIcon className="size-3.5 text-muted-foreground dark:text-[#F0EFE2]/40" />
 <input
 type="datetime-local"
 value={draftStart}
 onChange={(event) => setDraftStart(event.target.value)}
 className="flex-1 bg-transparent outline-none font-mono text-[11px] text-foreground dark:text-[#F0EFE2]"
 />
 </div>
 </div>

 <div>
 <label className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/50 font-medium block mb-1">{profileText(language, "End")}</label>
 <div className="flex items-center gap-2 h-9 px-3 bg-card dark:bg-white/5 border border-border dark:border-white/10 rounded-md">
 <CalendarIcon className="size-3.5 text-muted-foreground dark:text-[#F0EFE2]/40" />
 <input
 type="datetime-local"
 value={draftEnd}
 onChange={(event) => setDraftEnd(event.target.value)}
 className="flex-1 bg-transparent outline-none font-mono text-[11px] text-foreground dark:text-[#F0EFE2]"
 />
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between pt-1">
 <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-[#F0EFE2]/70">
 <span>{timezone}</span>
 <ChevronDown className="size-3.5 text-muted-foreground dark:text-[#F0EFE2]/50" />
 </div>

 <button
 onClick={() => {
 const start = parseDateTimeLocalInputValue(draftStart);
 const end = parseDateTimeLocalInputValue(draftEnd);
 if (start && end) {
 onApplyCustomRange({ start, end });
 }
 onClose();
 }}
 className="h-9 px-6 bg-[#0f52ff] hover:bg-[#0042e6] text-[#F0EFE2] text-xs font-semibold rounded-md transition-all cursor-pointer"
 >
 {profileText(language, "Apply")}
 </button>
 </div>
 </div>
 </motion.div>
 );
}

export function AccountHomeDashboard({ onNavigate }: { onNavigate?: (section: string) => void }) {
 const { preferences } = useProfilePreferences();
 const t = (key: string) => profileText(preferences.language, key);
 const relativeTime = (value?: string) => formatRelativeTime(value, preferences.language);
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [snapshot, setSnapshot] = useState<EpochMissionControlSnapshot | null>(cachedAccountHomeSnapshot);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [refreshTick, setRefreshTick] = useState(0);
 const hasSnapshotRef = useRef(Boolean(cachedAccountHomeSnapshot));
 const [isLoading, setIsLoading] = useState(!hasSnapshotRef.current);

 /* Search & Columns States */
 const [searchQuery, setSearchQuery] = useState("");
 const [isSearchFocused, setIsSearchFocused] = useState(false);
 const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);
 const searchInputRef = useRef<HTMLInputElement>(null);
 const [searchEvidence, setSearchEvidence] = useState<EpochEvidence[]>([]);
 const [liveEvidence, setLiveEvidence] = useState<EpochEvidence[]>([]);
 const [searchMemoryRecords, setSearchMemoryRecords] = useState<Array<{ id: string; summary?: string | null; mission?: { title?: string; objective?: string } | null; createdAt?: string }>>([]);
 const [dashboardColumns, setDashboardColumns] = useState([
  { id: "col1_Institutions", type: "Institutions" as ColumnType },
  { id: "col2_Missions", type: "Missions" as ColumnType },
  { id: "col3_Recents", type: "Recents" as ColumnType },
]);

const pushColumn = (newType: ColumnType) => {
  setDashboardColumns(prev => [
    prev[1],
    prev[2],
    { id: `col_${Date.now()}_${newType}`, type: newType }
  ]);
};

 const [gridSlots, setGridSlots] = useState<(MetricCardData | null)[]>(() =>
 buildLiveMetricSlots(null, "Last 24 hours"),
 );

 /* Continuous Realtime Drag State */
 const [activeDragState, setActiveDragState] = useState<{
 slotIdx: number;
 width: number;
 height: number;
 } | null>(null);

 const cardRefMap = useRef<Map<number, HTMLDivElement>>(new Map());

 /* Hover state on Analytics Section */
 const [isHoveringSection, setIsHoveringSection] = useState(false);

 /* Popover States */
 const [activeMenu, setActiveMenu] = useState<string | null>(null);
 const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
 const [cardDatePickerOpen, setCardDatePickerOpen] = useState<string | null>(null);
 const [selectedRangePreset, setSelectedRangePreset] = useState("Last 24 hours");
 const [activeSlotMenuIndex, setActiveSlotMenuIndex] = useState<number | null>(null);
 const recentActivityItems = useMemo(() => buildRecentActivityItems(snapshot), [snapshot]);
 const [dateRangeWindow, setDateRangeWindow] = useState(() => buildRangeWindow("Last 24 hours"));
 const recencyToneClasses: Record<RecentActivityItem["tone"], string> = {
 emerald: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500",
 blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-[#0f52ff]",
 slate: "bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-white/10 text-muted-foreground dark:text-[#F0EFE2]/60",
 amber: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500",
 };

 const liveInstitutions = snapshot?.recent?.institutions ?? [];
 const liveMissions = snapshot?.recent?.missions ?? [];
 const latestMission = liveMissions[0] ?? null;

 const primaryRepository =
 liveInstitutions.find((institution) =>
 /repo|github|core/i.test(institution.name) || /repo|github|core/i.test(institution.template?.name ?? ""),
 )?.name ?? "-";

 const companyBrainRows = [
 { label: "Repository", value: primaryRepository },
 { label: "Current Mission", value: latestMission?.title ?? latestMission?.objective ?? "-" },
 { label: "Planner", value: latestMission?.executionRun ? "Completed" : "-" },
 { label: "Execution", value: latestMission?.state ? latestMission.state.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "-" },
 { label: "Evidence", value: String(snapshot?.overview?.evidence ?? 0) },
 { label: "Verification", value: latestMission?.verificationRun?.finalDecision?.toUpperCase() ?? "-" },
 { label: "Settlement", value: latestMission?.completedAt || latestMission?.state === "completed" ? "Completed" : "-" },
 { label: "Learning", value: snapshot?.overview?.memories ? "Stored" : "-" },
 ];

 const storyFlow = [
 "Workspace",
 "Create Mission",
 "Policy Check",
 "Planner",
 "Execution",
 "Evidence",
 "Verification",
 "Approval",
 "Settlement",
 "Learning",
 "Production Feedback",
 "Improvement",
 ];

 // Sync workspace ID
 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveEpochWorkspaceId());
 syncWorkspace();
 window.addEventListener("focus", syncWorkspace);
 window.addEventListener("storage", syncWorkspace);
 return () => {
 window.removeEventListener("focus", syncWorkspace);
 window.removeEventListener("storage", syncWorkspace);
 };
 }, []);

 // Fetch Live Backend Mission Control Snapshot
 useEffect(() => {
 let canceled = false;
 async function loadData() {
 if (!hasSnapshotRef.current) setIsLoading(true);
 try {
 let wid = workspaceId;
 if (!wid) {
 wid = await resolveActiveEpochWorkspaceId();
 if (wid) setWorkspaceId(wid);
 }
 if (wid) {
 const snap = await getEpochMissionControlSnapshot(wid, {
 search: searchQuery.trim() || undefined,
 start: dateRangeWindow.start.toISOString(),
 end: dateRangeWindow.end.toISOString(),
 });
 if (!canceled && snap) {
 hasSnapshotRef.current = true;
 cachedAccountHomeSnapshot = snap;
 setSnapshot(snap);
 setLoadError(null);
 const rangeDurationMs = Math.max(1, dateRangeWindow.end.getTime() - dateRangeWindow.start.getTime());
 const liveSlots = buildLiveMetricSlots(snap, rangeDurationMs);
 setGridSlots((prev) =>
 prev.map((card, idx) => {
 if (idx >= 4) return card;
 const liveCard = liveSlots[idx];
 if (!card || !liveCard) return card;
 return {
 ...liveCard,
 spanSize: card.spanSize ?? liveCard.spanSize,
 };
 }),
 );
 }
 }
 } catch (err) {
 console.error("Failed to fetch live epoch snapshot", err);
 if (!canceled) setLoadError(err instanceof Error ? err.message : "Could not load the live workspace snapshot.");
 } finally {
 if (!canceled) {
 setTimeout(() => setIsLoading(false), 400);
 }
 }
 }
 void loadData();
 const refreshInterval = window.setInterval(() => void loadData(), 5_000);
 return () => {
 canceled = true;
 window.clearInterval(refreshInterval);
 };
 }, [workspaceId, refreshTick, dateRangeWindow, searchQuery]);

 // Keep the Account Home evidence column backed by the durable evidence endpoint.
 useEffect(() => {
  let canceled = false;
  if (!workspaceId) {
   setLiveEvidence([]);
   return;
  }
  void listEpochEvidence(workspaceId).then((result) => {
   if (!canceled) {
    setLiveEvidence(result.items);
    setSearchEvidence(result.items);
   }
  }).catch((error) => {
   if (!canceled) {
    console.warn("Account Home evidence could not be loaded", error);
    setLiveEvidence([]);
   }
  });
  return () => { canceled = true; };
 }, [workspaceId, refreshTick]);

 // Search the durable workspace collections only when the user is actually searching.
 useEffect(() => {
  let canceled = false;
  const query = searchQuery.trim();
  if (!workspaceId || !query) {
   setSearchEvidence([]);
   setSearchMemoryRecords([]);
   return;
  }

  void Promise.all([
   listEpochEvidence(workspaceId),
   listEpochMemoryRecords(workspaceId, { limit: 100 }),
  ]).then(([evidence, memories]) => {
   if (canceled) return;
   setSearchEvidence(evidence.items);
   setSearchMemoryRecords(memories.memoryRecords);
  }).catch((error) => {
   if (!canceled) {
    console.warn("Account Home search could not load all live collections", error);
    setSearchEvidence([]);
    setSearchMemoryRecords([]);
   }
  });

  return () => { canceled = true; };
 }, [workspaceId, searchQuery]);

 const triggerRefresh = () => {
 setIsLoading(true);
 setRefreshTick((t) => t + 1);
 };

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 const target = e.target as HTMLElement;
 if (!target.closest("[data-popover]")) {
 setActiveMenu(null);
 setActiveSubMenu(null);
 setCardDatePickerOpen(null);
 setActiveSlotMenuIndex(null);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 /* Continuous Pixel Drag Handler */
 const handleStartDragResize = (e: React.MouseEvent, slotIdx: number) => {
 e.preventDefault();
 e.stopPropagation();

 const cardElem = cardRefMap.current.get(slotIdx);
 if (!cardElem) return;

 const initialRect = cardElem.getBoundingClientRect();
 const startX = e.clientX;
 const startY = e.clientY;
 const startW = initialRect.width;
 const startH = initialRect.height;

 setActiveDragState({ slotIdx, width: startW, height: startH });

 let latestW = startW;
 let latestH = startH;

 const handleMouseMove = (moveEvent: MouseEvent) => {
 const deltaX = moveEvent.clientX - startX;
 const deltaY = moveEvent.clientY - startY;

 latestW = Math.max(220, Math.min(620, startW + deltaX));
 latestH = Math.max(210, Math.min(460, startH + deltaY));

 setActiveDragState({ slotIdx, width: latestW, height: latestH });
 };

 const handleMouseUp = () => {
 window.removeEventListener("mousemove", handleMouseMove);
 window.removeEventListener("mouseup", handleMouseUp);

 let finalSpan: SpanSize = "1x1";
 if (latestW > 380 && latestH > 300) {
 finalSpan = "2x2";
 } else if (latestW > 380) {
 finalSpan = "2x1";
 } else {
 finalSpan = "1x1";
 }

 setGridSlots((prev) => {
 const next = [...prev];
 const item = next[slotIdx];
 if (item) {
 next[slotIdx] = { ...item, spanSize: finalSpan };
 }
 return next;
 });

 setActiveDragState(null);
 };

 window.addEventListener("mousemove", handleMouseMove);
 window.addEventListener("mouseup", handleMouseUp);
 };

 /* Toggle Card Size Click Handler */
 const handleToggleCardSize = (slotIdx: number) => {
 setGridSlots((prev) => {
 const next = [...prev];
 const current = next[slotIdx];
 if (!current) return prev;

 let nextSpan: SpanSize = "2x1";
 if (current.spanSize === "2x1") nextSpan = "2x2";
 else if (current.spanSize === "2x2") nextSpan = "1x1";
 else nextSpan = "2x1";

 next[slotIdx] = { ...current, spanSize: nextSpan };
 return next;
 });
 };

 /* Add metric to slot */
 const handleAddMetricToSlot = (slotIdx: number, catalogItem: (typeof AVAILABLE_METRICS_CATALOG)[0]) => {
 setGridSlots((prev) => {
 const next = [...prev];
 next[slotIdx] = {
 id: `${catalogItem.id}_${Date.now()}`,
 title: catalogItem.title,
 value: catalogItem.value,
 change: catalogItem.change,
 changeType: catalogItem.changeType as "up" | "down",
 points: catalogItem.points,
 metricName: catalogItem.metricName,
 spanSize: "1x1",
 };
 return next;
 });
 setActiveSlotMenuIndex(null);
 };

 /* Remove metric from slot */
 const handleRemoveMetricFromSlot = (slotIdx: number) => {
 setGridSlots((prev) => {
 const next = [...prev];
 next[slotIdx] = null;
 return next;
 });
 setActiveMenu(null);
 };

 /* Render Live Content in Columns (Institutions, Missions, Recents) */
 function renderColumnContent(colType: ColumnType) {
 // 1. Institutions Card (Live backend institutions)
 if (colType === "Institutions") {
 const institutionsList = snapshot?.recent?.institutions ?? [];

 if (institutionsList.length === 0) {
 return (
 <div className="divide-y divide-[#f0f0f2]">
 <div className="py-8 px-2 text-[13px] text-muted-foreground dark:text-[#F0EFE2]/50">
 No institutions found in this workspace yet.
 </div>
 </div>
 );
 }

 return (
 <div className="divide-y divide-[#f0f0f2]">
 {institutionsList.map((inst) => (
 <div
 key={inst.id}
 onClick={() => onNavigate?.("workspace-institutions")}
 className="py-2.5 flex items-center justify-between hover:bg-card dark:bg-white/5 px-2 rounded-md transition-colors cursor-pointer group"
 >
 <div className="flex items-center gap-3 min-w-0 pr-2">
 <Building className="size-4 text-muted-foreground dark:text-[#F0EFE2]/50 group-hover:text-[#0f52ff] transition-colors shrink-0" />
 <div className="min-w-0">
 <div className="text-[13.5px] font-semibold text-foreground dark:text-[#F0EFE2] group-hover:text-[#0f52ff] transition-colors truncate">
 {inst.name}
 </div>
 <div className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/50 truncate">
 {inst.template?.name ?? inst.category ?? t("Institution")} • {relativeTime(inst.updatedAt ?? inst.createdAt)}
 </div>
 </div>
 </div>
 <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20/60 dark:border-emerald-500/20 shrink-0">
 {inst.status ?? "Active"}
 </span>
 </div>
 ))}
 </div>
 );
 }

 // 2. Missions Card (Live backend missions)
 if (colType === "Missions") {
 const missionsList = snapshot?.recent?.missions ?? [];

 if (missionsList.length === 0) {
 return (
 <div className="divide-y divide-[#f0f0f2]">
 <div className="py-8 px-2 text-[13px] text-muted-foreground dark:text-[#F0EFE2]/50">
 No missions found in this workspace yet.
 </div>
 </div>
 );
 }

 return (
 <div className="divide-y divide-[#f0f0f2]">
 {missionsList.map((mission) => (
 <div
 key={mission.id}
 onClick={() => onNavigate?.("workspace-missions")}
 className="py-2.5 flex items-center justify-between hover:bg-card dark:bg-white/5 px-2 rounded-md transition-colors cursor-pointer group"
 >
 <div className="flex items-center gap-2.5 min-w-0 pr-2">
 <Briefcase className="size-4 text-muted-foreground dark:text-[#F0EFE2]/50 group-hover:text-[#0f52ff] transition-colors shrink-0" />
 <div className="min-w-0">
 <div className="text-[13.5px] font-semibold text-foreground dark:text-[#F0EFE2] group-hover:text-[#0f52ff] transition-colors truncate">
 {mission.title ?? mission.id}
 </div>
 <div className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/50 truncate">
 {mission.currentStep ?? mission.objective ?? mission.state ?? t("Running")} • {relativeTime(mission.updatedAt)}
 </div>
 </div>
 </div>
 <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#0f52ff] border border-blue-200 dark:border-blue-500/20/60 dark:border-blue-500/20 shrink-0">
 {mission.state ?? "Active"}
 </span>
 </div>
 ))}
 </div>
 );
 }

 // 3. Recents Card (Latest real events)
 if (colType === "Recents") {
 const recentsList = recentActivityItems;

 if (recentsList.length === 0) {
 return (
 <div className="divide-y divide-[#f0f0f2]">
 <div className="py-8 px-2 text-[13px] text-muted-foreground dark:text-[#F0EFE2]/50">
 No recent activity yet.
 </div>
 </div>
 );
 }

 return (
 <div className="divide-y divide-[#f0f0f2]">
 {recentsList.map((item) => (
 <div key={item.id} onClick={() => onNavigate?.("recents")} className="py-2.5 flex items-center justify-between hover:bg-card dark:bg-white/5 px-2 rounded-md transition-colors cursor-pointer group">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className={cn("shrink-0 size-7 rounded-full border flex items-center justify-center", recencyToneClasses[item.tone])}>
 {item.icon}
 </div>
 <div className="min-w-0">
 <span className="block text-[13px] text-muted-foreground dark:text-[#F0EFE2]/60 truncate">
 {item.title}
 </span>
 <span className="block text-[11px] text-muted-foreground dark:text-[#F0EFE2]/30 truncate">{item.sub}</span>
 </div>
 </div>
 <span className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/30 font-mono shrink-0 ml-2">
 {relativeTime(item.timestamp)}
 </span>
 </div>
 ))}
 </div>
 );
 }

 // 4. Evidence Card (live backend evidence artifacts)
 if (colType === "Evidence") {
  if (liveEvidence.length === 0) {
   return (
    <div className="divide-y divide-[#f0f0f2]">
     <div className="py-8 px-2 text-[13px] text-muted-foreground dark:text-[#F0EFE2]/50">
      No evidence collected in this workspace yet.
     </div>
    </div>
   );
  }

  return (
   <div className="divide-y divide-[#f0f0f2]">
    {liveEvidence.slice(0, 6).map((evidence) => (
     <div
      key={evidence.id}
      onClick={() => onNavigate?.("operations-evidence")}
      className="py-2.5 flex items-center justify-between hover:bg-card dark:bg-white/5 px-2 rounded-md transition-colors cursor-pointer group"
     >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
       <FileCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
       <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-foreground dark:text-[#F0EFE2] group-hover:text-[#0f52ff] transition-colors truncate">
         {evidence.summary ?? evidence.kind ?? evidence.id}
        </div>
        <div className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/50 truncate">
         {evidence.contentType ?? evidence.filePath ?? "Evidence artifact"}
        </div>
       </div>
      </div>
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
       Live
      </span>
     </div>
    ))}
   </div>
  );
 }

 // Other Account Home columns are live summaries of the canonical backend
 // collections. Their dedicated pages remain the place for full tables and
 // mutations; this keeps the four-column home useful without fake rows.
 const summary: Record<string, { value: string; detail: string; target?: string }> = {
  "Command Center": { value: String(snapshot?.overview?.missions ?? 0), detail: "missions in this workspace", target: "workspace-command-center" },
  "Workers": { value: "-", detail: "Open Workers for live health and leases", target: "workspace-workers" },
  "Activity": { value: String(recentActivityItems.length), detail: "recent live runtime events", target: "workspace-activity" },
  "Executions": { value: String((snapshot?.queue?.status?.queued ?? 0) + (snapshot?.queue?.status?.leased ?? 0) + (snapshot?.queue?.status?.done ?? 0) + (snapshot?.queue?.status?.failed ?? 0)), detail: "durable queue executions", target: "operations-executions" },
  "Verification": { value: String(snapshot?.overview?.verifications ?? 0), detail: "verification runs", target: "operations-verification" },
  "Approvals": { value: String(liveMissions.filter((mission) => ["waiting_review", "awaiting_approval"].includes(String(mission.state ?? "").toLowerCase())).length), detail: "missions awaiting approval", target: "operations-approvals" },
  "Recovery": { value: String((snapshot?.queue?.status?.failed ?? 0) + (snapshot?.queue?.deadLetters?.count ?? 0)), detail: "failed or dead-lettered queue items", target: "operations-recovery" },
  "Production Intelligence": { value: "-", detail: "Open Production Intelligence for live failure signals", target: "intelligence-production" },
  "Evidence": { value: String(snapshot?.overview?.evidence ?? 0), detail: "evidence artifacts", target: "operations-evidence" },
  "Certificates": { value: String(snapshot?.overview?.certificates ?? 0), detail: "verification certificates", target: "memory-certificates" },
  "Mission Outcomes": { value: String(snapshot?.overview?.memories ?? 0), detail: "stored mission memory outcomes", target: "memory-mission-outcomes" },
  "Settlement": { value: String(snapshot?.overview?.certificates ?? 0), detail: "settled missions with certificates", target: "memory-settlement" },
  "Policies": { value: "-", detail: "Open Policies for live authority rules", target: "governance-policies" },
  "Audit": { value: "-", detail: "Open Audit for the durable audit trail", target: "governance-audit" },
  "API": { value: "Live", detail: "versioned Epoch API explorer", target: "runtime-api" },
  "API Keys": { value: "Live", detail: "workspace runtime access keys", target: "runtime-keys" },
  "SDK": { value: "Live", detail: "published worker SDK and contract", target: "runtime-sdk" },
  "MCP": { value: String(snapshot?.overview?.integrations ?? 0), detail: "runtime integrations and MCP access", target: "runtime-mcp" },
  "CLI": { value: "Live", detail: "published Epoch CLI commands", target: "runtime-cli" },
  "Webhooks": { value: String(Object.values(snapshot?.webhooks?.stats ?? {}).reduce((sum, count) => sum + Number(count || 0), 0)), detail: "webhook delivery records", target: "runtime-webhooks" },
  "Institutions": { value: String(snapshot?.overview?.institutions ?? 0), detail: "institutions in this workspace", target: "workspace-institutions" },
  "Missions": { value: String(snapshot?.overview?.missions ?? 0), detail: "missions in this workspace", target: "workspace-missions" },
  "Recents": { value: String(recentActivityItems.length), detail: "recent live runtime events", target: "recents" },
 };

 const liveSummary = summary[colType];
 if (liveSummary) {
  return (
   <button
    type="button"
    onClick={() => liveSummary.target && onNavigate?.(liveSummary.target)}
    className="w-full text-left py-6 px-2 rounded-md hover:bg-accent/40 transition-colors"
   >
    <div className="text-3xl font-semibold text-foreground dark:text-[#F0EFE2]">{liveSummary.value}</div>
    <div className="mt-2 text-[13px] text-muted-foreground dark:text-[#F0EFE2]/60">{liveSummary.detail}</div>
    <div className="mt-4 text-[11px] font-medium text-[#0f52ff]">Open live details <ChevronRight className="inline size-3" /></div>
   </button>
  );
 }

 // Every selectable Account Home column has a live renderer above. Keep a
 // neutral empty state for old saved UI state rather than advertising a fake
 // "Coming soon" surface.
 return (
 <div className="divide-y divide-[#f0f0f2]">
 <div className="py-8 px-2 text-[13px] text-muted-foreground dark:text-[#F0EFE2]/50">
 No live records for this view yet.
 </div>
 </div>
 );
 }

 const predefinedTips = useMemo<SearchResult[]>(() => [
 { type: 'tip', id: 'tip-inst', label: 'inst: — Search Institutions', icon: <Building className="size-4 text-muted-foreground dark:text-[#F0EFE2]/40" /> },
 { type: 'tip', id: 'tip-mis', label: 'mis: — Search Missions', icon: <Rocket className="size-4 text-muted-foreground dark:text-[#F0EFE2]/40" /> },
 { type: 'tip', id: 'tip-evid', label: 'evid: — Search Evidence', icon: <FileCheck className="size-4 text-muted-foreground dark:text-[#F0EFE2]/40" /> },
 { type: 'tip', id: 'tip-rec', label: 'rec: — Search Memory Records', icon: <CheckCircle2 className="size-4 text-muted-foreground dark:text-[#F0EFE2]/40" /> },
 { type: 'tip', id: 'tip-gov', label: 'gov: — Search Governance Policies', icon: <Briefcase className="size-4 text-muted-foreground dark:text-[#F0EFE2]/40" /> },
 ], []);

 const searchResults = useMemo<SearchResult[]>(() => {
 if (!searchQuery.trim()) return predefinedTips;

 const rawQuery = searchQuery.trim().toLowerCase();
 const prefixMatch = rawQuery.match(/^(inst|mis|evid|rec|gov):\s*(.*)$/);
 const prefix = prefixMatch?.[1];
 const q = (prefixMatch?.[2] ?? rawQuery).trim();
 const results: SearchResult[] = [];
 const matches = (value: unknown) => !q || String(value ?? "").toLowerCase().includes(q);

 if (!prefix || prefix === "inst") {
  for (const institution of liveInstitutions) {
   if (matches(institution.name) || matches(institution.category)) results.push({ type: "item", id: `institution:${institution.id}`, label: institution.name, sub: institution.category ?? "Institution", icon: <Building className="size-4 text-[#0f52ff]" />, tone: "blue", targetSection: "workspace-institutions" });
  }
 }
 if (!prefix || prefix === "mis") {
  for (const mission of liveMissions) {
   if (matches(mission.title) || matches(mission.objective) || matches(mission.id)) results.push({ type: "item", id: `mission:${mission.id}`, label: mission.title ?? mission.id, sub: mission.objective ?? mission.state ?? "Mission", icon: <Rocket className="size-4 text-[#0f52ff]" />, tone: "blue", targetSection: "workspace-missions" });
  }
 }
 if (!prefix || prefix === "evid") {
  for (const evidence of searchEvidence) {
   if (matches(evidence.id) || matches(evidence.kind) || matches(evidence.summary) || matches(evidence.filePath)) results.push({ type: "item", id: `evidence:${evidence.id}`, label: evidence.summary ?? evidence.kind ?? evidence.id, sub: evidence.filePath ?? evidence.contentType ?? "Evidence", icon: <FileCheck className="size-4 text-emerald-600" />, tone: "emerald", targetSection: "operations-evidence" });
  }
 }
 if (!prefix || prefix === "rec") {
  for (const memory of searchMemoryRecords) {
   if (matches(memory.id) || matches(memory.summary) || matches(memory.mission?.title) || matches(memory.mission?.objective)) results.push({ type: "item", id: `memory:${memory.id}`, label: memory.summary ?? memory.id, sub: memory.mission?.title ?? "Memory record", icon: <CheckCircle2 className="size-4 text-amber-600" />, tone: "amber", targetSection: "memory-records" });
  }
 }
 if (!prefix || prefix === "gov") {
  for (const mission of liveMissions) {
   for (const policy of mission.authorityPolicies ?? []) {
    if (matches(policy.name) || matches(policy.id)) results.push({ type: "item", id: `policy:${policy.id}`, label: policy.name ?? policy.id, sub: "Governance policy", icon: <Briefcase className="size-4 text-slate-600" />, tone: "slate", targetSection: "governance-policies" });
   }
  }
 }
 return results.slice(0, 12);
 }, [searchQuery, liveInstitutions, liveMissions, searchEvidence, searchMemoryRecords, predefinedTips]);

 useEffect(() => {
  const handleGlobalSearch = (event: KeyboardEvent) => {
   if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    setIsSearchFocused(true);
    searchInputRef.current?.focus();
   }
  };
  window.addEventListener("keydown", handleGlobalSearch);
  return () => window.removeEventListener("keydown", handleGlobalSearch);
 }, []);

 const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (!isSearchFocused && searchResults.length > 0) {
 if (e.key === 'ArrowDown' || e.key === 'Enter') {
 setIsSearchFocused(true);
 }
 }

 if (!isSearchFocused) return;

 if (e.key === 'ArrowDown') {
 e.preventDefault();
 setSearchSelectedIndex(prev => (prev + 1) % searchResults.length);
 } else if (e.key === 'ArrowUp') {
 e.preventDefault();
 setSearchSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
 } else if (e.key === 'Enter') {
 e.preventDefault();
 const selected = searchResults[searchSelectedIndex];
 if (selected) {
 if (selected.type === 'tip') {
 setSearchQuery(selected.label.split(':')[0] + ': ');
 } else {
 setSearchQuery(selected.label);
 if (selected.targetSection) onNavigate?.(selected.targetSection);
 setIsSearchFocused(false);
 }
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setIsSearchFocused(false);
  }
};

useEffect(() => {
  setSearchSelectedIndex(0);
}, [searchQuery]);

return (
  <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-background dark:bg-[#0a0a0a] text-foreground dark:text-[#F0EFE2] font-sans flex flex-col relative" data-popover>

    {/* 1. Top Greeting Header */}
    <div className="flex flex-col items-center mb-7">
 <h1 className="text-[34px] font-bold text-foreground dark:text-[#F0EFE2] tracking-tight text-center">
        {t("What are we building today?")}
      </h1>
    </div>

 <div className="max-w-3xl w-full mx-auto mb-12 relative z-50">
 <div className={cn(
 "relative flex items-center w-full bg-card dark:bg-[#121212] border rounded-md h-11 px-6 shadow-xs transition-all",
 isSearchFocused ? "border-[#0f52ff] ring-1 ring-[#0f52ff]/20 rounded-b-none" : "border-border dark:border-white/10"
 )}>
 <input
 ref={searchInputRef}
 type="text"
 placeholder={t("Search institutions, missions, evidence...")}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 onFocus={() => setIsSearchFocused(true)}
 onBlur={() => {
 setTimeout(() => setIsSearchFocused(false), 200);
 }}
 onKeyDown={handleSearchKeyDown}
 className="flex-1 bg-transparent border-none outline-none text-[14.5px] text-foreground dark:text-[#F0EFE2] placeholder:text-muted-foreground dark:text-[#F0EFE2]/30 min-w-0"
 />
 <div className="flex items-center gap-2 shrink-0 ml-2">
 {searchQuery ? (
 <button
  type="button"
  onMouseDown={(event) => event.preventDefault()}
  onClick={() => {
   setSearchQuery("");
   searchInputRef.current?.focus();
  }}
  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/10"
  aria-label={t("Clear search")}
 >
  <X className="size-3.5" />
 </button>
 ) : null}
 <kbd className="inline-flex h-5 items-center justify-center rounded border border-border dark:border-white/10 bg-card dark:bg-white/5 px-1.5 text-[10.5px] font-medium text-muted-foreground dark:text-[#F0EFE2]/60">Ctrl</kbd>
 <kbd className="inline-flex h-5 items-center justify-center rounded border border-border dark:border-white/10 bg-card dark:bg-white/5 px-1.5 text-[10.5px] font-medium text-muted-foreground dark:text-[#F0EFE2]/60">K</kbd>
 </div>
 </div>

 {/* Search Dropdown / Command Palette */}
 <AnimatePresence>
 {isSearchFocused && (searchResults.length > 0 || searchQuery.trim()) && (
 <motion.div
 initial={{ opacity: 0, y: -4 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -4 }}
 transition={{ duration: 0.15 }}
 className="absolute top-full left-0 right-0 bg-card dark:bg-[#121212] border border-border dark:border-white/10 border-t-0 rounded-b-xl overflow-hidden flex flex-col"
 >
 <div className="p-2 text-xs font-semibold text-muted-foreground dark:text-[#F0EFE2]/40 px-6 py-3 bg-background dark:bg-[#0a0a0a] border-b border-border dark:border-white/10">
 {searchQuery.trim() === "" ? t("Search tips") : t("Suggestions")}
 </div>
 <div className="max-h-[300px] overflow-y-auto py-2">
 {searchResults.length === 0 ? (
  <div className="px-6 py-8 text-center text-[13px] text-muted-foreground dark:text-[#F0EFE2]/50">
   {t("No matching live records found.")}
  </div>
 ) : searchResults.map((item, index) => (
 <div
 key={item.id}
 onMouseDown={(e) => {
 e.preventDefault();
 if (item.type === 'tip') {
 setSearchQuery(item.label.split(':')[0] + ': ');
 } else {
 setSearchQuery(item.label);
 if (item.targetSection) onNavigate?.(item.targetSection);
 setIsSearchFocused(false);
 }
 }}
 onMouseEnter={() => setSearchSelectedIndex(index)}
 className={cn(
 "flex items-center gap-3 px-6 py-2.5 mx-2 rounded-md cursor-pointer transition-colors",
 searchSelectedIndex === index ? "bg-card text-[#0f52ff]" : "hover:bg-card dark:bg-white/5 text-foreground/80 dark:text-[#F0EFE2]/80"
 )}
 >
 <div className={cn("shrink-0", item.type !== 'tip' && "size-6 rounded-full border flex items-center justify-center bg-card dark:bg-white/5 border-border dark:border-white/10")}>
 {item.icon}
 </div>
 <div className="flex flex-col min-w-0">
 <span className={cn("text-[13px] truncate", searchSelectedIndex === index ? "font-medium" : "")}>
 {item.type === 'tip' ? (
 <>
 <strong className="font-semibold text-foreground dark:text-[#F0EFE2]">{item.label.split('—')[0]}</strong>
 <span className="text-muted-foreground dark:text-[#F0EFE2]/60"> — {item.label.split('—')[1]}</span>
 </>
 ) : (
 item.label
 )}
 </span>
 {item.sub && (
 <span className="text-[11px] text-muted-foreground dark:text-[#F0EFE2]/40 truncate">{item.sub}</span>
 )}
 </div>
 {item.type === 'tip' && (
 <ChevronRight className={cn("size-3.5 ml-auto", searchSelectedIndex === index ? "text-[#0f52ff]" : "text-[#aaa] dark:text-[#F0EFE2]/20")} />
 )}
 </div>
 ))}
 </div>

 <div className="px-6 py-2 bg-card dark:bg-white/5 border-t border-border dark:border-white/10 flex items-center gap-6 text-[11px] text-muted-foreground dark:text-[#F0EFE2]/50">
 <div className="flex items-center gap-1.5">
 <span className="inline-flex items-center justify-center border border-border dark:border-white/10 bg-card dark:bg-[#121212] rounded-[3px] px-1 leading-none h-4">↑</span>
 <span className="inline-flex items-center justify-center border border-border dark:border-white/10 bg-card dark:bg-[#121212] rounded-[3px] px-1 leading-none h-4">↓</span>
 <span>to navigate</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="inline-flex items-center justify-center border border-border dark:border-white/10 bg-card dark:bg-[#121212] rounded-[3px] px-1 leading-none h-4">↵</span>
 <span>to select</span>
 </div>
 <div className="flex items-center gap-1.5 ml-auto">
 <span className="inline-flex items-center justify-center border border-border dark:border-white/10 bg-card dark:bg-[#121212] rounded-[3px] px-1 leading-none h-4">esc</span>
 <span>to close</span>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {loadError ? (
 <div className="mx-auto mb-4 flex w-full max-w-6xl items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
 <span>Live Account Home data could not be refreshed: {loadError}</span>
 <button type="button" onClick={triggerRefresh} className="font-semibold underline">Retry</button>
 </div>
 ) : null}

 {/* AnimatePresence for Loading Skeleton vs Main Content */}
 <AnimatePresence mode="wait">
 {isLoading ? (
 <DashboardSkeletonLoader key="skeleton_loader" />
 ) : (
 <motion.div
 key="dashboard_content"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3 }}
 className="w-full"
 >
 {/* 4. 3-Column Customizable Widget Cards Wired to Backend Data */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto mb-16">
    <AnimatePresence mode="popLayout">
      {dashboardColumns.map((col, idx) => {
        let addLabel = "Add item";
        let addAction = () => {};
        let showAllAction = () => {};
        
        if (col.type === "Institutions") {
          addLabel = "Add institution";
          addAction = () => onNavigate?.("workspace-institutions");
          showAllAction = () => onNavigate?.("workspace-institutions");
        } else if (col.type === "Missions") {
          addLabel = "Start mission";
          addAction = () => onNavigate?.("workspace-missions");
          showAllAction = () => onNavigate?.("workspace-missions");
        } else {
          addLabel = "Open details";
          addAction = () => onNavigate?.(col.type.toLowerCase().replaceAll(" ", "-"));
          showAllAction = addAction;
        }

        return (
          <motion.div
            layout
            key={col.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.15, filter: "blur(10px)", transition: { duration: 0.25, ease: "easeOut" } }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="flex flex-col relative"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1 text-[15px] font-semibold text-foreground dark:text-[#F0EFE2] cursor-pointer hover:text-[#0f52ff]">
                <span>{col.type}</span>
                <ChevronRight className="size-4 text-muted-foreground dark:text-[#F0EFE2]/40" />
              </div>

              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === col.id ? null : col.id)}
                  className="text-muted-foreground dark:text-[#F0EFE2]/40 hover:text-foreground dark:text-[#F0EFE2] p-1 rounded-md hover:bg-accent dark:bg-white/5 dark:hover:bg-card/5 transition-colors"
                >
                  <MoreHorizontal className="size-4" />
                </button>

                <AnimatePresence>
                  {activeMenu === col.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-7 z-50 w-[200px] bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md shadow-xl p-1.5 text-xs text-foreground/90 dark:text-[#F0EFE2]/90"
                    >
                      <button onClick={addAction} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">
                        <Plus className="size-3.5" /> {addLabel}
                      </button>
                      <button onClick={showAllAction} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">
                        <MoreHorizontal className="size-3.5" /> Show all
                      </button>
                      <div className="border-t border-[#f0f0f2] dark:border-white/5 dark:border-white/5 my-1" />
                      <div className="relative">
                        <button
                          onClick={() => setActiveSubMenu(activeSubMenu === `${col.id}-change` ? null : `${col.id}-change`)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <LayoutGrid className="size-3.5" /> Change column
                          </span>
                          <ChevronRight className="size-3.5 text-muted-foreground dark:text-[#F0EFE2]/40" />
                        </button>
                        {activeSubMenu === `${col.id}-change` && (
                          <div className="absolute left-full top-0 ml-1 z-50 w-[160px] bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md shadow-xl p-1.5 space-y-0.5">
                            {ACCOUNT_HOME_COLUMN_TYPES.map((t) => (
                              <button
                                key={t}
                                onClick={() => {
                                  pushColumn(t);
                                  setActiveMenu(null);
                                  setActiveSubMenu(null);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-between",
                                  col.type === t ? "bg-card dark:bg-[#0f52ff]/20 text-[#0f52ff]" : "hover:bg-card dark:bg-white/10 text-foreground/90 dark:text-[#F0EFE2]/90"
                                )}
                              >
                                <span>{t}</span>
                                {col.type === t && <Check className="size-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {renderColumnContent(col.type)}
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>

 {/* 6. Dynamic Grid Container Wired to Live Snapshot Counts */}
 <motion.div
 layout
 className="max-w-6xl w-full mx-auto"
 onMouseEnter={() => setIsHoveringSection(true)}
 onMouseLeave={() => setIsHoveringSection(false)}
 >
 <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
 {gridSlots.map((card, slotIdx) => {
 const isRow1 = slotIdx < 4;
 const row2HasCard = gridSlots.slice(4).some((c) => c !== null);
 const shouldRenderSlot = isRow1 || isHoveringSection || row2HasCard || activeSlotMenuIndex !== null;

 // Keep empty customization slots available on hover, but do not show them
 // while the dashboard is idle.
 if (!shouldRenderSlot) return null;

 // A) Active Metric Card at this exact slot position
 if (card !== null) {
 const hasChart = card.points && card.points.length > 0;
 const effectiveSpan: SpanSize = card.spanSize ?? "1x1";
 const isDraggingThis = activeDragState?.slotIdx === slotIdx;

 const spanClasses =
 effectiveSpan === "2x2"
 ? "col-span-2 row-span-2 min-h-[440px]"
 : effectiveSpan === "2x1"
 ? "col-span-2 row-span-1 min-h-[210px]"
 : "col-span-1 row-span-1 min-h-[210px]";

 return (
 <motion.div
 key={`slot_${slotIdx}_${card.id}`}
 ref={(el) => {
 if (el) cardRefMap.current.set(slotIdx, el);
 else cardRefMap.current.delete(slotIdx);
 }}
 layout={!isDraggingThis}
 transition={{ type: "spring", stiffness: 350, damping: 30 }}
 className={cn("relative group/card", spanClasses)}
 >
 <div
 style={
 isDraggingThis
 ? {
 width: `${activeDragState.width}px`,
 height: `${activeDragState.height}px`,
 zIndex: 40,
 }
 : undefined
 }
 className={cn(
 "bg-card dark:bg-[#121212] border border-border dark:border-white/10 hover:border-[#0f52ff]/40 dark:border-[#0f52ff]/60 rounded-md p-6 shadow-xs flex flex-col justify-between h-full relative overflow-visible transition-colors duration-200",
 isDraggingThis && "shadow-2xl border-[#0f52ff]"
 )}
 >
 <div>
 {/* Card Header Row */}
 <div className="flex items-center justify-between mb-1">
 <span className="text-[13px] font-semibold text-muted-foreground dark:text-[#F0EFE2]/70 truncate pr-2">{t(card.title)}</span>

 <div className="flex items-center gap-1">
 {/* Top-Right Clean Expand/Shrink Button */}
 <motion.button
 whileHover={{ scale: 1.15 }}
 whileTap={{ scale: 0.9 }}
 onClick={() => handleToggleCardSize(slotIdx)}
 title={`Toggle size: ${effectiveSpan}`}
 className="text-muted-foreground dark:text-[#F0EFE2]/40 hover:text-[#0f52ff] p-1 rounded-md hover:bg-accent dark:bg-white/5 dark:hover:bg-card/5 flex items-center justify-center transition-colors"
 >
 <BlueDragHandleIcon className="size-3 text-muted-foreground dark:text-[#F0EFE2]/50 hover:text-[#0f52ff]" />
 </motion.button>

 <div className="relative">
 <button
 onClick={() => setActiveMenu(activeMenu === card.id ? null : card.id)}
 className="text-muted-foreground dark:text-[#F0EFE2]/40 hover:text-foreground dark:text-[#F0EFE2] p-1 rounded-md hover:bg-accent dark:bg-white/5 dark:hover:bg-card/5"
 >
 <MoreHorizontal className="size-4" />
 </button>

 <AnimatePresence>
 {activeMenu === card.id && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.15 }}
 className="absolute right-0 top-7 z-50 w-[190px] bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md shadow-xl p-1.5 text-xs text-foreground/90 dark:text-[#F0EFE2]/90"
 >
 <button
 onClick={() => handleToggleCardSize(slotIdx)}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center justify-between"
 >
 <span>Resize card</span>
 <span className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded text-[#0f52ff] font-bold">{effectiveSpan}</span>
 </button>

 <button
 onClick={triggerRefresh}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2"
 >
 <RefreshCw className="size-3.5 text-muted-foreground dark:text-[#F0EFE2]/50" /> {t("Refresh")}
 </button>

 <button
 onClick={() => {
 setCardDatePickerOpen(card.id);
 setActiveMenu(null);
 }}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center justify-between"
 >
 <span className="flex items-center gap-2">
 <CalendarIcon className="size-3.5 text-muted-foreground dark:text-[#F0EFE2]/50" /> {t("Last 24 hours")} ...
 </span>
 <ChevronRight className="size-3.5 text-muted-foreground dark:text-[#F0EFE2]/40" />
 </button>

 <div className="border-t border-[#f0f0f2] dark:border-white/5 dark:border-white/5 my-1" />

 <button
 onClick={() => handleRemoveMetricFromSlot(slotIdx)}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-2"
 >
 <Trash2 className="size-3.5" /> {t("Remove")}
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Card Date Picker Popover */}
 <AnimatePresence>
 {cardDatePickerOpen === card.id && (
 <DateRangePickerPopover
 key={`card-${card.id}-${dateRangeWindow.start.toISOString()}-${dateRangeWindow.end.toISOString()}`}
 selectedPreset={selectedRangePreset}
 windowRange={dateRangeWindow}
 language={preferences.language}
 timezone={preferences.timezone}
 onSelectPreset={(preset) => {
 setSelectedRangePreset(preset);
 setDateRangeWindow(buildRangeWindow(preset));
 }}
 onApplyCustomRange={({ start, end }) => {
 setDateRangeWindow({ start, end });
 }}
 onClose={() => setCardDatePickerOpen(null)}
 arrowPositionClass="right-24"
 />
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>
 </div>

 <MetricCard
   title={card.title}
   value={card.value.toString()}
   trend={card.changeType ?? "neutral"}
   trendValue={card.change ?? ""}
   data={card.points ?? []}
   className="h-full border-none shadow-none bg-transparent -mx-6 -mb-6"
 />

 {/* Bottom-Right Drag Resize Handle Grip */}
 <motion.div
   whileHover={{ scale: 1.25 }}
   whileTap={{ scale: 0.95 }}
   onMouseDown={(e) => handleStartDragResize(e, slotIdx)}
   title="Drag to resize card continuously with your mouse cursor"
 className="absolute right-1 bottom-1 p-1 cursor-nwse-resize z-20 group/grip flex items-center justify-center"
 >
 <BlueDragHandleIcon className="size-3.5 text-[#0f52ff]" />
 </motion.div>

 </div>
 </motion.div>
 );
 }

 // B) Empty Slot Card at this position
 const showEmptySlot = isHoveringSection || activeSlotMenuIndex === slotIdx;
 if (!showEmptySlot) return <motion.div layout key={`empty_spacer_${slotIdx}`} className="col-span-1 row-span-1" />;

 return (
 <motion.div
 key={`empty_slot_${slotIdx}`}
 layout
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ type: "spring", stiffness: 350, damping: 30 }}
 className="relative col-span-1 row-span-1"
 >
 <button
 type="button"
 onClick={() => setActiveSlotMenuIndex(activeSlotMenuIndex === slotIdx ? null : slotIdx)}
 className="w-full min-h-[210px] bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:border-[#0f52ff] rounded-md shadow-xs flex items-center justify-center text-[#b0b0b8] dark:text-[#F0EFE2]/30 hover:text-[#0f52ff] transition-all cursor-pointer"
 >
 <Plus className="size-5 stroke-[1.5]" />
 </button>

 {/* Add Metric Popover Menu */}
 <AnimatePresence>
 {activeSlotMenuIndex === slotIdx && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -4 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -4 }}
 transition={{ duration: 0.15 }}
 className="absolute left-0 top-12 z-50 w-[240px] bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md shadow-2xl p-2.5 text-foreground dark:text-[#F0EFE2]"
 >
 <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#f0f0f2] dark:border-white/5 mb-1">
 <span className="text-xs font-semibold text-muted-foreground dark:text-[#F0EFE2]/70">{t("Add metric")}</span>
 <button onClick={() => setActiveSlotMenuIndex(null)} className="text-muted-foreground dark:text-[#F0EFE2]/40 hover:text-foreground dark:text-[#F0EFE2]">
 <X className="size-3.5" />
 </button>
 </div>
 <div className="max-h-[200px] overflow-y-auto space-y-0.5 custom-scrollbar text-xs font-medium text-foreground/90 dark:text-[#F0EFE2]/90">
 {AVAILABLE_METRICS_CATALOG.map((item) => (
 <button
 key={item.id}
 onClick={() => handleAddMetricToSlot(slotIdx, item)}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 transition-colors block"
 >
 {item.title}
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
 })}
 </motion.div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 </div>
 );
}

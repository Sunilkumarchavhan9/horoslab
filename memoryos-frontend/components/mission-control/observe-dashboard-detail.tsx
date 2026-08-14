"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Reorder, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
 ArrowLeft,
 Printer,
 Link as LinkIcon,
 Plus,
 Filter,
 Calendar,
 Globe2,
 ChevronDown,
 Bookmark,
 List,
 LineChart,
 BarChart3,
 Hash,
 Percent,
 BarChart2,
 PieChart,
 ListOrdered,
 AreaChart,
 GitMerge,
 AlignLeft,
 Code,
 Check,
 Info,
 GripVertical,
 X,
 Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart as RechartsAreaChart, Area, Sankey, FunnelChart, Funnel, LabelList, ScatterChart, Scatter, ZAxis, Treemap, RadialBarChart, RadialBar, ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, SunburstChart, ReferenceLine, Label, Brush } from 'recharts';
import type { SankeyLinkProps, SankeyNodeProps, TreemapNode } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
 getEpochMissionControlSnapshot,
 readActiveEpochWorkspaceId,
 type EpochMission,
 type EpochMissionControlSnapshot,
} from "@/lib/epoch-api";

const MOCK_CHART_DATA = [
 { time: "Jul 23, 03:30 PM", s1: 0, s2: 0, s3: 0 },
 { time: "Jul 23, 04:15 PM", s1: 2, s2: 0, s3: 0 },
 { time: "Jul 23, 07:30 PM", s1: 0, s2: 0, s3: 2 },
 { time: "Jul 23, 07:45 PM", s1: 2, s2: 0, s3: 0 },
 { time: "Jul 23, 11:15 PM", s1: 0, s2: 2, s3: 0 },
 { time: "Jul 23, 11:30 PM", s1: 4, s2: 0, s3: 2 },
 { time: "Jul 24, 02:45 AM", s1: 2, s2: 0, s3: 0 },
 { time: "Jul 24, 03:30 AM", s1: 0, s2: 0, s3: 0 },
 { time: "Jul 24, 04:00 AM", s1: 1, s2: 0, s3: 0 },
 { time: "Jul 24, 06:15 AM", s1: 1, s2: 0, s3: 0 },
 { time: "Jul 24, 07:30 AM", s1: 0, s2: 0, s3: 2 },
 { time: "Jul 24, 08:00 AM", s1: 2, s2: 0, s3: 0 },
 { time: "Jul 24, 09:45 AM", s1: 0, s2: 0, s3: 2 },
 { time: "Jul 24, 10:30 AM", s1: 0, s2: 0, s3: 3 },
 { time: "Jul 24, 11:30 AM", s1: 2, s2: 0, s3: 0 },
 { time: "Jul 24, 12:00 PM", s1: 5, s2: 0, s3: 0 },
 { time: "Jul 24, 01:15 PM", s1: 0, s2: 0, s3: 2 },
 { time: "Jul 24, 03:30 PM", s1: 2, s2: 0, s3: 0 },
];

interface ObserveDashboardDetailProps {
 id: string;
 onBack: () => void;
 mode?: "view" | "edit";
 createdDashboards?: Array<{
 id: string;
 title: string;
 charts: number;
 createdAt: string;
 updatedAt: string;
 author: string;
 chartType?: string;
 }>;
 onCreateDashboard?: (dashboard: {
 id: string;
 title: string;
 charts: number;
 createdAt: string;
 updatedAt: string;
 author: string;
 chartType?: string;
 }) => void;
}

type ChartTypeOption = {
 name: string;
 desc: string;
 icon: typeof Hash;
};

type PreviewMode = "summary" | "timeseries" | "bars" | "doughnut" | "geo" | "flow";
type BuilderMode = "summary" | "percentage" | "timeseries" | "bars" | "geo" | "flow";

const BLANK_CHART_SECTIONS: Array<{ heading: string; items: ChartTypeOption[] }> = [
 {
 heading: "Overview",
 items: [
 { name: "KPI Summary", desc: "Show a high-level KPI such as mission success rate or verification rate.", icon: Hash },
 { name: "Single Metric", desc: "Display a single runtime metric.", icon: Hash },
 { name: "Verification Percentage", desc: "Compare one institutional metric against another.", icon: Percent },
 ],
 },
 {
 heading: "Time",
 items: [
 { name: "Mission Timeline", desc: "Track mission execution and verification over time.", icon: LineChart },
 { name: "Institution Comparison", desc: "Compare institutions, missions, planners, or reviewers.", icon: BarChart3 },
 { name: "Mission State Trends", desc: "Visualize mission state changes over time.", icon: AreaChart },
 ],
 },
 {
 heading: "Categorical",
 items: [
 { name: "Mission Breakdown", desc: "Group missions by institution, planner, owner, or risk.", icon: List },
 { name: "Verification Breakdown", desc: "Compare PASS, FAIL, REVIEW across institutions.", icon: BarChart2 },
 { name: "Top Institutions", desc: "Rank institutions by activity or performance.", icon: AlignLeft },
 { name: "Authority Usage", desc: "Compare approval requests, spend limits, blocked actions, and policy checks.", icon: BarChart3 },
 { name: "Mission Status Distribution", desc: "Visualize mission outcomes.", icon: PieChart },
 { name: "Leaderboard", desc: "Rank institutional activity.", icon: ListOrdered },
 ],
 },
 {
 heading: "Flow",
 items: [
 { name: "Mission Flow", desc: "Display Mission → Planner → Executor → Reviewer → Human Approval → Certificate → Institution Record", icon: GitMerge },
 { name: "Institution Runtime Flow", desc: "Visualize how work moves through your runtime.", icon: GitMerge },
 ],
 },
 {
 heading: "Runtime Metrics",
 items: [
 { name: "Verification Score", desc: "Average confidence, PASS rate, Evidence completeness", icon: Check },
 { name: "Evidence Sources", desc: "GitHub, Browser, Slack, CRM, Files, Manual Review", icon: Code },
 { name: "Authority Decisions", desc: "Allowed, Blocked, Approval Required, Escalated", icon: Check },
 { name: "Policy Violations", desc: "Rules Triggered, High Risk Missions, Approval Failures", icon: Info },
 { name: "Certificate Trend", desc: "Certificates Generated, PASS, FAIL, REVIEW", icon: LineChart },
 { name: "Institution Health", desc: "Mission Success, Verification, Memory Growth, Policy Compliance", icon: Hash },
 ],
 }
];

const CHART_PREVIEW_MODE_BY_NAME: Record<string, PreviewMode> = {
 "KPI Summary": "summary",
 "Single Metric": "summary",
 "Verification Percentage": "summary",
 "Mission Timeline": "timeseries",
 "Institution Comparison": "timeseries",
 "Mission State Trends": "timeseries",
 "Mission Breakdown": "bars",
 "Verification Breakdown": "bars",
 "Top Institutions": "bars",
 "Authority Usage": "bars",
 "Leaderboard": "bars",
 "Mission Status Distribution": "doughnut",
 "Mission Flow": "flow",
 "Institution Runtime Flow": "flow",
 "Verification Score": "summary",
 "Evidence Sources": "doughnut",
 "Authority Decisions": "bars",
 "Policy Violations": "bars",
 "Certificate Trend": "timeseries",
 "Institution Health": "summary",
};

const CHART_MODIFIER_MODE_BY_NAME: Record<string, BuilderMode> = {
 "KPI Summary": "summary",
 "Single Metric": "summary",
 "Verification Percentage": "percentage",
 "Mission Timeline": "timeseries",
 "Institution Comparison": "timeseries",
 "Mission State Trends": "timeseries",
 "Mission Breakdown": "bars",
 "Verification Breakdown": "bars",
 "Top Institutions": "bars",
 "Authority Usage": "bars",
 "Leaderboard": "bars",
 "Mission Status Distribution": "bars",
 "Mission Flow": "flow",
 "Institution Runtime Flow": "flow",
 "Verification Score": "summary",
 "Evidence Sources": "bars",
 "Authority Decisions": "bars",
 "Policy Violations": "bars",
 "Certificate Trend": "timeseries",
 "Institution Health": "summary",
};

const SANKEY_DATA = {
 nodes: [
 { name: "Sales Research", fill: "#90caf9" },
 { name: "Vendor DD", fill: "#ffcc80" },
 { name: "Engineering", fill: "#ffe082" },
 { name: "PASS", fill: "#ffcc80" },
 { name: "FAIL", fill: "#f48fb1" },
 { name: "Review", fill: "#90caf9" },
 { name: "Support", fill: "#81c784" },
 { name: "Legal", fill: "#f48fb1" },
 { name: "Finance", fill: "#ce93d8" },
 { name: "HR", fill: "#80deea" },
 { name: "IT", fill: "#9fa8da" },
 ],
 links: [
 { source: 0, target: 3, value: 30, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 0, target: 4, value: 5, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 0, target: 5, value: 8, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 0, target: 6, value: 3, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 0, target: 7, value: 3, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 0, target: 8, value: 3, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 0, target: 9, value: 2, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 0, target: 10, value: 2, fill: "#90caf9", fillOpacity: 0.7 },
 { source: 1, target: 3, value: 2, fill: "#ffcc80", fillOpacity: 0.7 },
 { source: 1, target: 4, value: 10, fill: "#ffcc80", fillOpacity: 0.7 },
 { source: 2, target: 10, value: 10, fill: "#ffe082", fillOpacity: 0.7 }
 ]
};

const CustomSankeyLink = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload }: SankeyLinkProps) => {
 const linkPayload = payload as { fill?: string; fillOpacity?: number };
 return (
 <path
 d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
 stroke={linkPayload.fill || "#2196f3"}
 strokeWidth={Math.max(linkWidth, 1)}
 strokeOpacity={linkPayload.fillOpacity || 0.4}
 fill="none"
 />
 );
};

const CustomSankeyNode = ({ x, y, width, height, payload }: SankeyNodeProps) => {
 const nodePayload = payload as { fill?: string; name?: string };
 const isRight = x > 100;
 return (
 <g>
 <rect x={x} y={y} width={width} height={height} fill={nodePayload.fill || "#2196f3"} />
 <text
 x={isRight ? x + width + 8 : x + 8}
 y={y + height / 2}
 dy={4}
 fontSize={11}
 fill="#555"
 >
 {nodePayload.name}
 </text>
 </g>
 );
};

const CustomTreemapContent = ({ x, y, width, height, name, fill }: TreemapNode) => {
 if (!name) return <g />;

 return (
 <g>
 <rect
 x={x}
 y={y}
 width={width}
 height={height}
 style={{
 fill: fill as string | undefined,
 stroke: '#fff',
 strokeWidth: 2,
 }}
 />
 {width > 50 && height > 30 ? (
 <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={500}>
 {name}
 </text>
 ) : null}
 </g>
 );
};

const OPERATOR_OPTIONS = [
 { value: "equals", label: "Equals", symbol: "=" },
 { value: "not_equals", label: "Does Not Equal", symbol: "≠" },
 { value: "greater_equals", label: "Greater Than Or Equals", symbol: "≥" },
 { value: "less_equals", label: "Less Than Or Equals", symbol: "≤" },
 { value: "in", label: "Is In", symbol: "∈" },
 { value: "not_in", label: "Is Not In", symbol: "∉" },
];

const MOCK_FILTER_VALUES = [
 "100 Continue", "101 Switching Protocols", "102 Processing", 
 "200 OK", "201 Created", "202 Accepted", "203 Non-Authoritative Information",
 "204 No Content", "205 Reset Content"
];

type LiveDashboardMetric = {
 label: string;
 value: string;
 hint?: string;
};

type LiveDashboardView = {
 dashboardId: string;
 title: string;
 subtitle: string;
 metrics: LiveDashboardMetric[];
 statusBreakdown: Array<{ name: string; value: number; color: string }>;
 trend: Array<{ day: string; missions: number; passRate: number }>;
 runtimeTrend: Array<{ day: string; missions: number; runtime: number }>;
 confidenceTrend: Array<{ day: string; missions: number; confidence: number }>;
 leaderboard: Array<{ name: string; value: number }>;
 policyBreakdown: Array<{ name: string; value: number; color: string }>;
 proofMix: Array<{ name: string; value: number; color: string }>;
 missions: EpochMission[];
};

function formatRuntimeDuration(startedAt?: string | null, finishedAt?: string | null): string {
 if (!startedAt || !finishedAt) return "Open";
 const start = new Date(startedAt).getTime();
 const end = new Date(finishedAt).getTime();
 if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "Open";
 const minutes = Math.max(1, Math.round((end - start) / 60000));
 if (minutes < 60) return `${minutes}m`;
 const hours = Math.floor(minutes / 60);
 const remainder = minutes % 60;
 return `${hours}h ${remainder}m`;
}

function buildLiveDashboardView(
 id: string,
 snapshot: EpochMissionControlSnapshot | null,
): LiveDashboardView | null {
 if (!snapshot) return null;

 const missions = snapshot.recent.missions ?? [];
 const institutions = snapshot.recent.institutions ?? [];
 const title = {
 "mission-control": "Mission Control",
 "institution-overview": "Institution Overview",
 "execution-overview": "Execution Overview",
 "verification-overview": "Verification Overview",
 "evidence-overview": "Evidence Overview",
 "authority-overview": "Authority Overview",
 "institution-memory": "Institution Memory",
 "sales-research-dashboard": "Sales Research Dashboard",
 "vendor-due-diligence-dashboard": "Vendor Due Diligence Dashboard",
 "engineering-dashboard": "Engineering Dashboard",
 }[id] ?? id.replace(/-/g, " ");

 const runningMissions = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "running").length;
 const completedMissions = missions.filter((mission) => {
 const state = (mission.state ?? "").toLowerCase();
 const verdict = (mission.verificationRun?.finalDecision ?? "").toUpperCase();
 return state === "completed" || verdict === "PASS";
 }).length;
 const failedMissions = missions.filter((mission) => {
 const state = (mission.state ?? "").toLowerCase();
 const verdict = (mission.verificationRun?.finalDecision ?? "").toUpperCase();
 return state === "failed" || verdict === "FAIL";
 }).length;
 const waitingReview = Math.max(0, missions.length - runningMissions - completedMissions - failedMissions);
 const passRate = missions.length > 0 ? Math.round((completedMissions / missions.length) * 100) : 0;
 const avgRuntimeMinutes = missions.length > 0
 ? (() => {
 const durations = missions
 .map((mission) => {
 const startedAt = mission.executionRun?.startedAt ?? mission.startedAt;
 const finishedAt = mission.executionRun?.finishedAt ?? mission.completedAt;
 if (!startedAt || !finishedAt) return 0;
 const start = new Date(startedAt).getTime();
 const end = new Date(finishedAt).getTime();
 return Number.isFinite(start) && Number.isFinite(end) && end > start ? (end - start) / 60000 : 0;
 })
 .filter((value) => value > 0);

 if (durations.length === 0) return 0;
 return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
 })()
 : 0;

 const statusCounts = missions.reduce(
 (acc, mission) => {
 const state = (mission.state ?? "unknown").toLowerCase();
 acc[state] = (acc[state] ?? 0) + 1;
 return acc;
 },
 {} as Record<string, number>,
 );

 const statusBreakdown = [
 { name: "Running", value: statusCounts.running ?? 0, color: "#0f52ff" },
 { name: "Completed", value: statusCounts.completed ?? 0, color: "#10b981" },
 { name: "Waiting Review", value: statusCounts.waiting_review ?? 0, color: "#f59e0b" },
 { name: "Failed", value: statusCounts.failed ?? 0, color: "#ef4444" },
 ].filter((item) => item.value > 0);

 const dayBuckets = Array.from({ length: 7 }, (_, index) => {
 const date = new Date(snapshot.generatedAt);
 date.setDate(date.getDate() - (6 - index));
 const key = date.toISOString().slice(0, 10);
 return {
 key,
 day: date.toLocaleDateString(undefined, { weekday: "short" }),
 missions: 0,
 passCount: 0,
 runtimeSum: 0,
 runtimeCount: 0,
 confidenceSum: 0,
 confidenceCount: 0,
 };
 });
 const bucketMap = new Map(dayBuckets.map((item) => [item.key, item]));
 missions.forEach((mission) => {
 const timestamp = mission.updatedAt ?? mission.completedAt ?? mission.startedAt;
 if (!timestamp) return;
 const bucket = bucketMap.get(new Date(timestamp).toISOString().slice(0, 10));
 if (!bucket) return;
 bucket.missions += 1;
 const verdict = (mission.verificationRun?.finalDecision ?? "").toUpperCase();
 if (verdict === "PASS") bucket.passCount += 1;

 const startedAt = mission.executionRun?.startedAt ?? mission.startedAt;
 const finishedAt = mission.executionRun?.finishedAt ?? mission.completedAt;
 if (startedAt && finishedAt) {
 const start = new Date(startedAt).getTime();
 const end = new Date(finishedAt).getTime();
 if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
 bucket.runtimeSum += (end - start) / 60000;
 bucket.runtimeCount += 1;
 }
 }

 if (typeof mission.verificationRun?.confidence === "number") {
 bucket.confidenceSum += mission.verificationRun.confidence;
 bucket.confidenceCount += 1;
 }
 });

 const trend = dayBuckets.map((bucket) => ({
 day: bucket.day,
 missions: bucket.missions,
 passRate: bucket.missions > 0 ? Math.round((bucket.passCount / bucket.missions) * 100) : 0,
 }));

 const institutionCount = institutions.length;
 const memoryCount = snapshot.overview.memories;
 const evidenceCount = snapshot.overview.evidence;
 const verificationCount = snapshot.overview.verifications;
 const certificateCount = snapshot.overview.certificates;

 const categoryMatch = (label: string) =>
 institutions.filter((institution) => (institution.category ?? institution.name ?? "").toLowerCase().includes(label.toLowerCase()));

 const recentMissionItems = [...missions]
 .sort((a, b) => (b.updatedAt ?? b.startedAt ?? "").localeCompare(a.updatedAt ?? a.startedAt ?? ""))
 .slice(0, 6);

 const metricsById: Record<string, LiveDashboardMetric[]> = {
 "mission-control": [
 { label: "Running Missions", value: String(runningMissions), hint: "Live backend state" },
 { label: "Completed", value: String(completedMissions), hint: "Passed runs" },
 { label: "Waiting Review", value: String(waitingReview), hint: "Needs human eyes" },
 { label: "PASS Rate", value: `${passRate}%`, hint: "Computed from live missions" },
 ],
 "institution-overview": [
 { label: "Institutions", value: String(institutionCount), hint: "Workspace record count" },
 { label: "Templates", value: String(snapshot.overview.templates), hint: "Blueprints available" },
 { label: "Mission Links", value: String(snapshot.overview.missions), hint: "Attached live runs" },
 { label: "Memories", value: String(memoryCount), hint: "Generated from missions" },
 ],
 "execution-overview": [
 { label: "Running", value: String(runningMissions), hint: "Active execution" },
 { label: "Average Runtime", value: `${avgRuntimeMinutes || 0}m`, hint: "Derived from execution runs" },
 { label: "Artifacts", value: String(snapshot.overview.artifacts), hint: "Execution outputs" },
 { label: "Completed", value: String(completedMissions), hint: "Finished runs" },
 ],
 "verification-overview": [
 { label: "Verifications", value: String(verificationCount), hint: "Backend record count" },
 { label: "Certificates", value: String(certificateCount), hint: "Issued proofs" },
 { label: "PASS Rate", value: `${passRate}%`, hint: "Live verification outcome" },
 { label: "Failed", value: String(failedMissions), hint: "Rejected runs" },
 ],
 "evidence-overview": [
 { label: "Evidence", value: String(evidenceCount), hint: "Collected proof items" },
 { label: "Artifacts", value: String(snapshot.overview.artifacts), hint: "Stored outputs" },
 { label: "Missions", value: String(snapshot.overview.missions), hint: "Source missions" },
 { label: "PASS Rate", value: `${passRate}%`, hint: "Verification health" },
 ],
 "authority-overview": [
 { label: "Policies", value: String(missions.reduce((sum, mission) => sum + (mission.authorityPolicies?.length ?? 0), 0)), hint: "Mission policy rows" },
 { label: "Running", value: String(runningMissions), hint: "Currently executing" },
 { label: "Blocked", value: String(missions.filter((mission) => (mission.authorityPolicies ?? []).some((policy) => policy.blocked)).length), hint: "Denied by policy" },
 { label: "Needs Approval", value: String(missions.filter((mission) => (mission.authorityPolicies ?? []).some((policy) => policy.needsApproval)).length), hint: "Awaiting review" },
 ],
 "institution-memory": [
 { label: "Memories", value: String(memoryCount), hint: "Generated learning" },
 { label: "Institutions", value: String(institutionCount), hint: "Active workspace assets" },
 { label: "Completed", value: String(completedMissions), hint: "Successful runs" },
 { label: "Certificates", value: String(certificateCount), hint: "Persisted proof" },
 ],
 "sales-research-dashboard": [
 { label: "Matched Institutions", value: String(categoryMatch("sales").length || institutionCount), hint: "Sales research scope" },
 { label: "Missions", value: String(snapshot.overview.missions), hint: "Relevant live runs" },
 { label: "Evidence", value: String(evidenceCount), hint: "Captured artifacts" },
 { label: "PASS Rate", value: `${passRate}%`, hint: "Current health" },
 ],
 "vendor-due-diligence-dashboard": [
 { label: "Matched Institutions", value: String(categoryMatch("vendor").length || institutionCount), hint: "Vendor diligence scope" },
 { label: "Verifications", value: String(verificationCount), hint: "Assessment volume" },
 { label: "Evidence", value: String(evidenceCount), hint: "Proof completeness" },
 { label: "PASS Rate", value: `${passRate}%`, hint: "Current health" },
 ],
 "engineering-dashboard": [
 { label: "Running", value: String(runningMissions), hint: "Engineering execution" },
 { label: "Artifacts", value: String(snapshot.overview.artifacts), hint: "Build outputs" },
 { label: "Completed", value: String(completedMissions), hint: "Delivered work" },
 { label: "Avg Runtime", value: `${avgRuntimeMinutes || 0}m`, hint: "Execution speed" },
 ],
 };

 return {
 dashboardId: id,
 title,
 subtitle: `${snapshot.overview.missions} missions · ${snapshot.overview.institutions} institutions · live as of ${new Date(snapshot.generatedAt).toLocaleString()}`,
 metrics: metricsById[id] ?? metricsById["mission-control"],
 statusBreakdown,
 trend,
 runtimeTrend: trend.map((bucket) => ({
 day: bucket.day,
 missions: bucket.missions,
 runtime: (() => {
 const related = bucketMap.get(dayBuckets.find((entry) => entry.day === bucket.day)?.key ?? "");
 if (!related || related.runtimeCount === 0) return 0;
 return Math.max(1, Math.round(related.runtimeSum / related.runtimeCount));
 })(),
 })),
 confidenceTrend: dayBuckets.map((bucket) => ({
 day: bucket.day,
 missions: bucket.missions,
 confidence: bucket.confidenceCount > 0 ? Math.min(100, Math.max(0, Math.round(bucket.confidenceSum / bucket.confidenceCount))) : 0,
 })),
 leaderboard: [...institutions]
 .sort((a, b) => (b.missionCount ?? 0) - (a.missionCount ?? 0))
 .slice(0, 5)
 .map((institution) => ({
 name: institution.name,
 value: institution.missionCount ?? 0,
 }))
 .filter((row) => row.value > 0),
 policyBreakdown: [
 { name: "Can Execute", value: missions.filter((mission) => (mission.authorityPolicies ?? []).some((policy) => policy.canExecute)).length, color: "#10b981" },
 { name: "Needs Approval", value: missions.filter((mission) => (mission.authorityPolicies ?? []).some((policy) => policy.needsApproval)).length, color: "#f59e0b" },
 { name: "Blocked", value: missions.filter((mission) => (mission.authorityPolicies ?? []).some((policy) => policy.blocked)).length, color: "#ef4444" },
 ].filter((item) => item.value > 0),
 proofMix: [
 { name: "Evidence", value: evidenceCount, color: "#0f52ff" },
 { name: "Artifacts", value: snapshot.overview.artifacts, color: "#10b981" },
 { name: "Certificates", value: certificateCount, color: "#f59e0b" },
 ].filter((item) => item.value > 0),
 missions: recentMissionItems,
 };
}

export function ObserveDashboardDetail({ id, onBack, mode = "view", createdDashboards, onCreateDashboard }: ObserveDashboardDetailProps) {
 const LIVE_REFRESH_MS = 15000;
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [snapshot, setSnapshot] = useState<EpochMissionControlSnapshot | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [selectedBuilderType, setSelectedBuilderType] = useState<string | null>(null);
 const [selectedChartType, setSelectedChartType] = useState("Mission Timeline");
 const [graphMode] = useState<"group" | "custom">("group");
 const [chartTypeOpen, setChartTypeOpen] = useState(false);
 const [previewTitleOpen, setPreviewTitleOpen] = useState(false);
 const [chartTypeQuery] = useState("");
 const chartTypeRef = useRef<HTMLDivElement | null>(null);
 const previewTitleRef = useRef<HTMLButtonElement | null>(null);
 const customDashboard = useMemo(() => createdDashboards?.find((dashboard) => dashboard.id === id) ?? null, [createdDashboards, id]);

 useEffect(() => {
 if (customDashboard?.chartType) {
 setSelectedChartType(customDashboard.chartType);
 }
 }, [customDashboard?.chartType]);

 const [activeDataset, setActiveDataset] = useState("Missions");
 const [activeMetric, setActiveMetric] = useState("Completed Missions");
 const [groupBys, setGroupBys] = useState<string[]>(["Mission Status"]);
 const [filters, setFilters] = useState<{ id: string; field: string; operator: string; value: string }[]>([]);

 type CustomSeriesItem = { id: string; name: string; metric: string; filters: { id: string; field: string; operator: string; value: string }[] };
 const [customSeries, setCustomSeries] = useState<CustomSeriesItem[]>([
 { id: "series-1", name: "Mission Series", metric: "Completed Missions", filters: [] }
 ]);

 useEffect(() => {
 if (mode !== "edit" || id === "blank-dashboard" || selectedBuilderType) {
 return;
 }

 const chartType = customDashboard?.chartType ?? "KPI Summary";
 setSelectedChartType(chartType);
 setSelectedBuilderType(chartType);
 }, [customDashboard?.chartType, id, mode, selectedBuilderType]);

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

 const refresh = useCallback(async () => {
 if (!workspaceId) {
 setSnapshot(null);
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const snap = await getEpochMissionControlSnapshot(workspaceId);
 setSnapshot(snap);
 } catch (loadError) {
 setSnapshot(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard details.");
 } finally {
 setLoading(false);
 }
 }, [workspaceId]);

 useEffect(() => {
 void refresh();
 }, [refresh]);

 useEffect(() => {
 if (!workspaceId) return;

 const interval = window.setInterval(() => {
 void refresh();
 }, LIVE_REFRESH_MS);

 return () => window.clearInterval(interval);
 }, [workspaceId, refresh]);

 const liveDashboard = useMemo(() => {
 if (customDashboard) {
 return null;
 }
 return buildLiveDashboardView(id, snapshot);
 }, [customDashboard, id, snapshot]);

 useEffect(() => {
 function handlePointerDown(event: MouseEvent) {
 const target = event.target as Node;
 if (chartTypeRef.current && !chartTypeRef.current.contains(target)) {
 setChartTypeOpen(false);
 }
 if (previewTitleRef.current && !previewTitleRef.current.contains(target)) {
 setPreviewTitleOpen(false);
 }
 }

 if (chartTypeOpen || previewTitleOpen) {
 document.addEventListener("mousedown", handlePointerDown);
 }

 return () => document.removeEventListener("mousedown", handlePointerDown);
 }, [chartTypeOpen, previewTitleOpen]);

 const filteredChartSections = useMemo(() => {
 const query = chartTypeQuery.trim().toLowerCase();
 if (!query) {
 return BLANK_CHART_SECTIONS;
 }

 return BLANK_CHART_SECTIONS.map((section) => ({
 ...section,
 items: section.items.filter((chart) => {
 return `${chart.name} ${chart.desc} ${section.heading}`.toLowerCase().includes(query);
 }),
 })).filter((section) => section.items.length > 0);
 }, [chartTypeQuery]);

 const previewMode = useMemo<PreviewMode>(() => {
 return CHART_PREVIEW_MODE_BY_NAME[selectedChartType] ?? "timeseries";
 }, [selectedChartType]);

 const previewTitle = useMemo(() => {
 if (selectedChartType === "Verification Percentage") return "Mission Timeline";
 switch (previewMode) {
 case "summary":
 return "KPI Summary";
 case "bars":
 return "Mission Breakdown";
 case "doughnut":
 return "Mission Status Distribution";
 case "geo":
 return "Missions by country";
 case "flow":
 return "Mission Flow";
 default:
 return "Mission Timeline";
 }
 }, [previewMode, selectedChartType]);

 const previewLegend = useMemo(() => {
 const baseLegend = groupBys[0] === "Mission Status"
 ? [
 { label: "Running", value: 25, color: "#2196f3", key: "s1" },
 { label: "Completed", value: 2, color: "#ffb300", key: "s2" },
 { label: "Waiting Review", value: 2, color: "#e91e63", key: "s3" },
 ]
 : [
 { label: "PASS", value: 25, color: "#2196f3", key: "s1" },
 { label: "FAIL", value: 2, color: "#ffb300", key: "s2" },
 { label: "Review", value: 2, color: "#e91e63", key: "s3" },
 ];

 // Scale values based on Metric
 const mult = activeMetric === "Failed Missions" ? 0.2 : activeMetric === "Average Runtime" ? 150 : 1;
 return baseLegend.map(l => ({ ...l, value: l.value * mult }));
 }, [groupBys, activeMetric]);

 const dynamicTimeseriesData = useMemo(() => {
 const mult = activeMetric === "Failed Missions" ? 0.2 : activeMetric === "Average Runtime" ? 150 : 1;
 return MOCK_CHART_DATA.map(row => ({
 ...row,
 s1: row.s1 * mult,
 s2: row.s2 * mult,
 s3: row.s3 * mult,
 }));
 }, [activeMetric]);

 const summaryTotal = useMemo(() => {
 return previewLegend.reduce((sum, item) => sum + item.value, 0).toFixed(1);
 }, [previewLegend]);

 const handleAddBlankDashboardCard = useCallback(() => {
 const nowLabel = new Date().toLocaleString();
 const dashboard = {
 id: mode === "edit" ? id : (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
 ? crypto.randomUUID()
 : `blank-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
 title: mode === "edit" ? (customDashboard?.title ?? liveDashboard?.title ?? id.replace(/-/g, " ")) : previewTitle,
 charts: 1,
 createdAt: nowLabel,
 updatedAt: nowLabel,
 author: "memoryostm@gmail.com",
 chartType: selectedChartType,
 };

 onCreateDashboard?.(dashboard);
 setSelectedBuilderType(null);
 onBack();
 }, [customDashboard?.title, id, liveDashboard?.title, mode, onBack, onCreateDashboard, previewTitle, selectedChartType]);

 const handleCancelBlankDashboardCard = useCallback(() => {
 setSelectedBuilderType(null);
 onBack();
 }, [onBack]);

 function renderPreviewBody() {
 if (previewMode === "summary") {
 return (
 <div className="absolute inset-0 flex flex-col justify-end z-0 bg-card overflow-hidden rounded-b-xl border-t border-border">
 <div className="px-6 flex-1 flex flex-col justify-center">
 <div className="flex items-baseline gap-2">
 <span className="text-[32px] font-semibold text-foreground leading-none">
 {selectedChartType === "Verification Percentage" ? "100.00%" : 
 selectedChartType === "Institution Health" ? "98/100" :
 selectedChartType === "Verification Score" ? "A+" : summaryTotal}
 </span>
 {selectedChartType === "Verification Percentage" ? (
 <span className="text-[12px] font-medium text-muted-foreground">0.0%</span>
 ) : selectedChartType === "Institution Health" || selectedChartType === "Verification Score" ? null : (
 <span className="text-[12px] font-medium text-green-600">↑ 38.1%</span>
 )}
 </div>
 </div>
 <div className="w-full h-[60px] pb-2">
 <ResponsiveContainer width="100%" height="100%">
 {selectedChartType === "Verification Percentage" ? (
 <RadialBarChart 
 innerRadius="150%" 
 outerRadius="200%" 
 data={[{ name: 'Score', value: 100, fill: '#4caf50' }]} 
 startAngle={180} 
 endAngle={0}
 >
 <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f5f5f5' }} />
 </RadialBarChart>
 ) : selectedChartType === "Single Metric" ? (
 <RechartsAreaChart data={dynamicTimeseriesData}>
 <Area type="monotone" dataKey="s1" stroke="#ffb300" fill="#ffb300" fillOpacity={0.2} strokeWidth={1.5} isAnimationActive={false} />
 </RechartsAreaChart>
 ) : selectedChartType === "Institution Health" || selectedChartType === "Verification Score" ? (
 <div className="w-full h-full flex items-end px-6 pb-2">
 <div className="w-full h-2 bg-card rounded-full overflow-hidden">
 <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }} />
 </div>
 </div>
 ) : (
 <RechartsLineChart data={dynamicTimeseriesData}>
 <Line type="linear" dataKey="s1" stroke="#2196f3" strokeWidth={1.5} dot={false} activeDot={false} isAnimationActive={false} />
 </RechartsLineChart>
 )}
 </ResponsiveContainer>
 </div>
 </div>
 );
 }

 if (previewMode === "bars") {
 const isHorizontal = selectedChartType === "Horizontal Bar";
 const isTopList = selectedChartType === "Top List";
 const isCategorical = selectedChartType === "Categorical Bar";

 return (
 <div className="absolute inset-0 px-6 pt-6 pb-8 flex flex-col justify-between z-0">
 <div className="flex items-center gap-6 mb-6 z-10 flex-wrap">
 {previewLegend.map((item) => (
 <div key={item.label} className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
 <span className="text-[11px] font-medium text-muted-foreground">
 {item.label} <strong className="text-foreground font-semibold">{item.value.toFixed(1).replace('.0', '')}</strong>
 </span>
 </div>
 ))}
 </div>
 <div className="flex-1 w-full relative">
 {isTopList ? (
 <div className="flex flex-col gap-6 mt-4 w-full max-w-[400px]">
 {previewLegend.map(item => (
 <div key={item.key} className="flex items-center gap-6">
 <span className="text-[11px] font-medium text-foreground w-20 truncate">{item.label}</span>
 <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden">
 <div className="h-full rounded-full" style={{ width: `${(item.value / 25) * 100}%`, backgroundColor: item.color }} />
 </div>
 <span className="text-[11px] text-foreground w-8 text-right font-medium">{item.value.toFixed(1).replace('.0', '')}</span>
 </div>
 ))}
 </div>
 ) : selectedChartType === "Mission Breakdown" ? (
 <ResponsiveContainer width="100%" height="100%">
 <Treemap
 width={400}
 height={200}
 data={previewLegend.map(item => ({ name: item.label, size: item.value, fill: item.color }))}
 dataKey="size"
 aspectRatio={4 / 3}
 stroke="#fff"
 fill="#8884d8"
 content={CustomTreemapContent}
 >
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500, color: "#111" }}
 />
 </Treemap>
 </ResponsiveContainer>
 ) : selectedChartType === "Verification Breakdown" ? (
 <ResponsiveContainer width="100%" height="100%">
 <SunburstChart 
 startAngle={90} 
 endAngle={270} 
 data={{
 name: 'Root',
 value: previewLegend.reduce((acc, curr) => acc + curr.value, 0),
 children: previewLegend.map(item => ({
 name: item.label,
 value: item.value,
 fill: item.color,
 }))
 }}
 >
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500, color: "#111" }}
 />
 </SunburstChart>
 </ResponsiveContainer>
 ) : isCategorical ? (
 <ResponsiveContainer width="100%" height="100%">
 <RechartsBarChart layout="vertical" data={[{ name: "Total", s1: previewLegend[0]?.value || 0, s2: previewLegend[1]?.value || 0, s3: previewLegend[2]?.value || 0 }]} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
 <XAxis type="number" hide />
 <YAxis type="category" dataKey="name" hide />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 cursor={{ fill: 'transparent' }}
 />
 {previewLegend.map(item => (
 <Bar key={item.key} dataKey={item.key} stackId="a" fill={item.color} name={item.label} barSize={24} />
 ))}
 </RechartsBarChart>
 </ResponsiveContainer>
 ) : selectedChartType === "Top Institutions" ? (
 <ResponsiveContainer width="100%" height="100%">
 <RechartsBarChart data={dynamicTimeseriesData} margin={{ top: 10, right: 0, left: -20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} minTickGap={30} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} tickCount={6} />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 cursor={{ fill: '#f5f5f5' }}
 />
 <ReferenceLine y={0} stroke="#e2e2e2" />
 <Brush dataKey="time" height={20} stroke="#e2e2e2" fill="#f9f9f9" tickFormatter={() => ''} />
 <Bar dataKey="s1" fill="#2196f3" radius={[2, 2, 0, 0]} name="Running" />
 <Bar dataKey="s2" fill="#ffb300" radius={[2, 2, 0, 0]} name="Completed" />
 </RechartsBarChart>
 </ResponsiveContainer>
 ) : selectedChartType === "Leaderboard" ? (
 <ResponsiveContainer width="100%" height="100%">
 <RechartsBarChart layout="vertical" data={previewLegend} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
 <XAxis type="number" hide />
 <YAxis type="category" dataKey="label" hide />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
 <LabelList dataKey="label" position="insideLeft" fill="#fff" fontSize={11} fontWeight={600} />
 <LabelList dataKey="value" position="right" fill="#333" fontSize={11} fontWeight={600} />
 {previewLegend.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Bar>
 </RechartsBarChart>
 </ResponsiveContainer>
 ) : selectedChartType === "Mission Status Distribution" ? (
 <ResponsiveContainer width="100%" height="100%">
 <RechartsPieChart>
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 <Pie data={previewLegend} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="label" stroke="none">
 {previewLegend.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
 </Pie>
 </RechartsPieChart>
 </ResponsiveContainer>
 ) : selectedChartType === "Evidence Sources" ? (
 <ResponsiveContainer width="100%" height="100%">
 <RechartsPieChart>
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 <Pie data={previewLegend} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="label" stroke="#fff" strokeWidth={2}>
 <LabelList dataKey="label" position="inside" fill="#fff" fontSize={10} fontWeight={600} />
 {previewLegend.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
 </Pie>
 </RechartsPieChart>
 </ResponsiveContainer>
 ) : selectedChartType === "Authority Access" ? (
 <ResponsiveContainer width="100%" height="100%">
 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={previewLegend.map(item => ({ name: item.label, value: item.value, fullMark: 100 }))}>
 <PolarGrid stroke="#e2e2e2" />
 <PolarAngleAxis dataKey="name" tick={{ fill: '#555', fontSize: 10, fontWeight: 500 }} />
 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
 <Radar name="Usage" dataKey="value" stroke="#2196f3" fill="#2196f3" fillOpacity={0.4} />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500, color: "#111" }}
 />
 </RadarChart>
 </ResponsiveContainer>
 ) : selectedChartType === "Authority Decisions" ? (
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={dynamicTimeseriesData.slice(0, 7)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 <Bar yAxisId="left" dataKey="s1" fill="#4caf50" name="Approved" barSize={12} radius={[2, 2, 0, 0]} />
 <Bar yAxisId="right" dataKey="s2" fill="#f44336" name="Denied" barSize={12} radius={[2, 2, 0, 0]} />
 </ComposedChart>
 </ResponsiveContainer>
 ) : selectedChartType === "Policy Violations" ? (
 <ResponsiveContainer width="100%" height="100%">
 <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" />
 <XAxis dataKey="s1" type="number" name="Severity" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis dataKey="s2" type="number" name="Frequency" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <ZAxis dataKey="s3" type="number" range={[20, 200]} name="Impact" />
 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }} itemStyle={{ fontSize: "11px", fontWeight: 500 }} />
 <Scatter name="Violations" data={dynamicTimeseriesData.slice(0, 10)} fill="#e91e63" opacity={0.6} />
 </ScatterChart>
 </ResponsiveContainer>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <RechartsBarChart
 layout={isHorizontal ? "vertical" : "horizontal"}
 data={previewLegend}
 margin={isHorizontal ? { top: 0, right: 0, left: 30, bottom: 0 } : { top: 10, right: 0, left: -20, bottom: 0 }}
 >
 <CartesianGrid strokeDasharray="3 3" vertical={isHorizontal} horizontal={!isHorizontal} stroke="#e2e2e2" />
 {isHorizontal ? (
 <>
 <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} width={80} dx={-10} />
 </>
 ) : (
 <>
 <XAxis type="category" dataKey="label" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} tickCount={6} />
 </>
 )}
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 cursor={{ fill: '#f5f5f5' }}
 />
 <Bar dataKey="value" barSize={isHorizontal ? 16 : 32}>
 {previewLegend.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Bar>
 </RechartsBarChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>
 );
 }

 if (previewMode === "doughnut") {
 return (
 <div className="absolute inset-0 px-6 pt-6 pb-8 flex flex-col justify-between z-0">
 <div className="flex items-center gap-6 mb-6 z-10 flex-wrap">
 {previewLegend.map((item) => (
 <div key={item.label} className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
 <span className="text-[11px] font-medium text-muted-foreground">
 {item.label} <strong className="text-foreground font-semibold">{item.value.toFixed(1).replace('.0', '')}</strong>
 </span>
 </div>
 ))}
 </div>
 <div className="flex-1 w-full relative">
 <ResponsiveContainer width="100%" height="100%">
 <RechartsPieChart>
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 <Pie
 data={previewLegend}
 cx="50%"
 cy="50%"
 innerRadius={70}
 outerRadius={100}
 paddingAngle={2}
 dataKey="value"
 nameKey="label"
 stroke="none"
 startAngle={90}
 endAngle={-270}
 >
 {previewLegend.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 </RechartsPieChart>
 </ResponsiveContainer>
 </div>
 </div>
 );
 }

 if (previewMode === "geo") {
 const geoData = [
 { name: "United States", x: 25, y: 60, z: 250, fill: '#2196f3' },
 { name: "Brazil", x: 35, y: 30, z: 80, fill: '#ffb300' },
 { name: "China", x: 75, y: 55, z: 120, fill: '#e91e63' },
 { name: "Singapore", x: 80, y: 40, z: 40, fill: '#9c27b0' },
 { name: "Canada", x: 25, y: 75, z: 60, fill: '#00bcd4' },
 ];

 return (
 <div className="absolute inset-0 px-6 pt-6 pb-8 flex flex-col justify-between z-0">
 <div className="flex items-center gap-6 mb-6 z-10 flex-wrap">
 {previewLegend.map((item) => (
 <div key={item.label} className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
 <span className="text-[11px] font-medium text-muted-foreground">
 {item.label} <strong className="text-foreground font-semibold">{item.value.toFixed(1).replace('.0', '')}</strong>
 </span>
 </div>
 ))}
 </div>
 <div className="flex-1 w-full relative flex gap-6">
 <div className="flex-1 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjYjBjY2Q0IiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=')] rounded-md border border-border overflow-hidden">
 <ResponsiveContainer width="100%" height="100%">
 {selectedChartType === "Choropleth Country Map" ? (
 <Treemap
 data={geoData}
 dataKey="z"
 aspectRatio={4 / 3}
 stroke="#fff"
 content={CustomTreemapContent}
 >
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 </Treemap>
 ) : selectedChartType === "Geographic" ? (
 <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={12} data={geoData}>
 <RadialBar
 minPointSize={15}
 label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 500, formatter: () => '' }}
 background
 dataKey="z"
 />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 </RadialBarChart>
 ) : (
 <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
 <XAxis type="number" dataKey="x" name="Longitude" hide domain={[0, 100]} />
 <YAxis type="number" dataKey="y" name="Latitude" hide domain={[0, 100]} />
 <ZAxis type="number" dataKey="z" range={[50, 600]} name="Value" />
 <Tooltip
 cursor={{ strokeDasharray: '3 3' }}
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 <Scatter name="Countries" data={geoData}>
 {geoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
 </Scatter>
 </ScatterChart>
 )}
 </ResponsiveContainer>
 </div>
 <div className="w-[220px] flex flex-col gap-3 justify-center">
 {geoData.sort((a, b) => b.z - a.z).map((item) => (
 <div key={item.name} className="flex items-center gap-3">
 <span className="text-[11px] font-medium text-foreground/90 w-[110px] truncate">{item.name}</span>
 <div className="h-1.5 flex-1 rounded-full bg-[#eef2f7] overflow-hidden">
 <div className="h-full rounded-full" style={{ width: `${(item.z / 250) * 100}%`, backgroundColor: item.fill }} />
 </div>
 <span className="text-[11px] font-medium text-foreground">{item.z}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
 }

 if (previewMode === "flow") {
 return (
 <div className="absolute inset-0 px-6 py-6 flex flex-col justify-between z-0">
 <div className="flex-1 w-full relative">
 <ResponsiveContainer width="100%" height="100%">
 {selectedChartType === "Institution Runtime Flow" ? (
 <FunnelChart>
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 <Funnel
 dataKey="value"
 data={[
 { value: 100, name: 'Visited', fill: '#2196f3' },
 { value: 80, name: 'Signed Up', fill: '#03a9f4' },
 { value: 50, name: 'Used Feature', fill: '#00bcd4' },
 { value: 40, name: 'Subscribed', fill: '#009688' },
 { value: 26, name: 'Retained', fill: '#4caf50' },
 ]}
 isAnimationActive
 >
 <LabelList position="right" fill="#333" stroke="none" dataKey="name" fontSize={11} fontWeight={500} />
 </Funnel>
 </FunnelChart>
 ) : (
 <Sankey
 data={SANKEY_DATA}
 node={CustomSankeyNode}
 link={CustomSankeyLink}
 nodePadding={20}
 margin={{ left: 20, right: 100, top: 20, bottom: 20 }}
 >
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 />
 </Sankey>
 )}
 </ResponsiveContainer>
 </div>
 </div>
 );
 }

 return (
 <div className="absolute inset-0 px-6 pt-6 pb-8 flex flex-col justify-between z-0">
 <div className="flex items-center gap-6 mb-6 z-10 flex-wrap">
 {previewLegend.map((item) => (
 <div key={item.label} className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
 <span className="text-[11px] font-medium text-muted-foreground">
 {item.label} <strong className="text-foreground font-semibold">{item.value.toFixed(1).replace('.0', '')}</strong>
 </span>
 </div>
 ))}
 </div>
 <div className="flex-1 w-full relative">
 <ResponsiveContainer width="100%" height="100%">
 {selectedChartType === "Institution Comparison" || selectedChartType === "Bar Chart" ? (
 <RechartsBarChart data={dynamicTimeseriesData} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} minTickGap={30} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} tickCount={6} />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 cursor={{ fill: '#f5f5f5' }}
 labelStyle={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}
 />
 <ReferenceLine y={40} stroke="#e91e63" strokeDasharray="3 3">
 <Label value="Target Goal (40)" position="top" fill="#e91e63" fontSize={11} fontWeight={500} />
 </ReferenceLine>
 <Bar dataKey="s1" stackId="a" fill="#2196f3" name="PASS" />
 <Bar dataKey="s2" stackId="a" fill="#ffb300" name="FAIL" />
 <Bar dataKey="s3" stackId="a" fill="#e91e63" name="Review" radius={[2, 2, 0, 0]} />
 </RechartsBarChart>
 ) : selectedChartType === "Mission State Trends" || selectedChartType === "Stacked Area" ? (
 <RechartsAreaChart data={dynamicTimeseriesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} minTickGap={30} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} tickCount={6} />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 labelStyle={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}
 />
 <Area type="monotone" dataKey="s1" stackId="1" stroke="#2196f3" fill="#2196f3" fillOpacity={0.6} name="PASS" />
 <Area type="monotone" dataKey="s2" stackId="1" stroke="#ffb300" fill="#ffb300" fillOpacity={0.6} name="FAIL" />
 <Area type="monotone" dataKey="s3" stackId="1" stroke="#e91e63" fill="#e91e63" fillOpacity={0.6} name="Review" />
 </RechartsAreaChart>
 ) : selectedChartType === "Mission Timeline" ? (
 <ComposedChart data={dynamicTimeseriesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2196f3" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} minTickGap={30} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} tickCount={6} />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 labelStyle={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}
 />
 <Area type="monotone" dataKey="s1" fill="url(#colorArea)" stroke="none" name="Total Activity" />
 <Bar dataKey="s2" barSize={12} fill="#ffb300" radius={[2, 2, 0, 0]} name="Completed" />
 <Line type="monotone" dataKey="s3" stroke="#e91e63" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} name="Waiting Review" />
 <Line type="step" dataKey="s1" stroke="#2196f3" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Running" />
 </ComposedChart>
 ) : (
 <RechartsLineChart data={dynamicTimeseriesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} minTickGap={30} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} tickCount={6} />
 <Tooltip
 contentStyle={{ borderRadius: "6px", border: "1px solid #e2e2e2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px", padding: "8px 12px" }}
 itemStyle={{ fontSize: "11px", fontWeight: 500 }}
 labelStyle={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}
 />
 <Line type="monotone" dataKey="s1" stroke="#2196f3" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="PASS" />
 <Line type="monotone" dataKey="s2" stroke="#ffb300" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="FAIL" />
 <Line type="monotone" dataKey="s3" stroke="#e91e63" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Review" />
 </RechartsLineChart>
 )}
 </ResponsiveContainer>
 </div>
 </div>
 );

 }

 type GroupedOption = { label: string; options: string[] };
 type SelectOption = string | GroupedOption;
 const selectShell = (
 value: string,
 onChange: (val: string) => void,
 options: SelectOption[],
 className?: string,
 ) => (
 <Select value={value} onValueChange={onChange}>
 <SelectTrigger className={cn("w-full border border-border rounded flex items-center justify-between px-3 py-1.5 cursor-pointer hover:border-[#b0b0b0] bg-card text-[12px] text-foreground/90 h-[30px] shadow-none focus:ring-0", className)}>
 <SelectValue />
 </SelectTrigger>
 <SelectContent position="popper" className="bg-card border border-border rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-0">
 <div className="sticky top-0 bg-card z-10 px-2 pt-2 pb-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
 <input 
 type="text" 
 placeholder="Search..."
 className="w-full text-[12px] text-foreground/90 bg-card border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#b0b0b0]"
 onKeyDown={(e) => e.stopPropagation()} 
 />
 </div>
 <div className="py-1">
 {options.map((opt, i) => {
 if (typeof opt === 'string') {
 return <SelectItem key={opt} value={opt} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8">{opt}</SelectItem>;
 }
 return (
 <SelectGroup key={opt.label || i}>
 {opt.label && <SelectLabel className="text-[11px] font-semibold text-muted-foreground pl-3 py-1.5">{opt.label}</SelectLabel>}
 {opt.options.map(subOpt => (
 <SelectItem key={subOpt} value={subOpt} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8">{subOpt}</SelectItem>
 ))}
 </SelectGroup>
 );
 })}
 </div>
 </SelectContent>
 </Select>
 );

 const filterOptions: SelectOption[] = [
 "Institution", 
 "Mission", 
 "Mission Type", 
 "Mission Status", 
 "Risk", 
 "Planner", 
 "Reviewer", 
 "Agent", 
 "Certificate Result", 
 "Policy", 
 "Evidence Type", 
 "Approval Status", 
 "Template", 
 "Time Range"
 ];

 const renderFilters = () => {
 return (
 <div className="flex flex-col gap-2 w-full">
 {filters.map(filter => (
 <div key={filter.id} className="border border-border rounded-md p-2.5 flex flex-col gap-2 bg-card relative group shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="flex items-center justify-between">
 <Select value={filter.field} onValueChange={(val) => {
 setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, field: val } : f));
 }}>
 <SelectTrigger className="w-full border-none h-6 px-1 shadow-none focus:ring-0 text-[13px] font-medium text-foreground bg-transparent hover:bg-transparent [&>svg]:hidden justify-start p-0">
 <SelectValue placeholder="Select field..." />
 </SelectTrigger>
 <SelectContent position="popper" className="w-[300px] bg-card border border-border rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-0">
 <div className="sticky top-0 bg-card z-10 px-2 pt-2 pb-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
 <input 
 type="text" 
 placeholder="Search fields..."
 className="w-full text-[12px] text-foreground/90 bg-card border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#b0b0b0]"
 onKeyDown={(e) => e.stopPropagation()} 
 />
 </div>
 <div className="py-1">
 {filterOptions.map((opt, i) => {
 if (typeof opt === 'string') {
 return <SelectItem key={opt} value={opt} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8">{opt}</SelectItem>;
 }
 return (
 <SelectGroup key={opt.label || i}>
 {opt.label && <SelectLabel className="text-[11px] font-semibold text-muted-foreground pl-3 py-1.5">{opt.label}</SelectLabel>}
 {opt.options.map(subOpt => (
 <SelectItem key={subOpt} value={subOpt} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8">{subOpt}</SelectItem>
 ))}
 </SelectGroup>
 );
 })}
 </div>
 </SelectContent>
 </Select>
 <button 
 onClick={() => setFilters(prev => prev.filter(f => f.id !== filter.id))} 
 className="text-muted-foreground hover:text-foreground/90 px-1"
 >
 <X className="size-3.5" />
 </button>
 </div>

 {filter.field && (
 <div className="flex items-center gap-2">
 <Select value={filter.operator} onValueChange={(val) => {
 setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, operator: val } : f));
 }}>
 <SelectTrigger className="w-fit min-w-[28px] border-none h-6 px-1 shadow-none focus:ring-0 text-[13px] font-mono text-foreground/90 bg-transparent hover:bg-transparent [&>svg]:hidden p-0 justify-start">
 {OPERATOR_OPTIONS.find(o => o.value === filter.operator)?.symbol || "="}
 </SelectTrigger>
 <SelectContent position="popper" className="w-[180px] bg-card border border-border rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] py-1">
 {OPERATOR_OPTIONS.map(op => (
 <SelectItem key={op.value} value={op.value} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8 flex items-center gap-2">
 <div className="flex items-center gap-2">
 <span className="font-mono w-4">{op.symbol}</span>
 <span>{op.label}</span>
 </div>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 <Select value={filter.value} onValueChange={(val) => {
 setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, value: val } : f));
 }}>
 <SelectTrigger className="flex-1 border-none h-6 px-1 shadow-none focus:ring-0 text-[13px] text-foreground/90 bg-transparent hover:bg-transparent [&>svg]:hidden p-0 justify-start">
 <SelectValue placeholder="Select value..." />
 </SelectTrigger>
 <SelectContent position="popper" className="w-[240px] bg-card border border-border rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-0">
 <div className="sticky top-0 bg-card z-10 px-2 pt-2 pb-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
 <input 
 type="text" 
 placeholder="Search values..."
 className="w-full text-[12px] text-foreground/90 bg-card border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#b0b0b0]"
 onKeyDown={(e) => e.stopPropagation()} 
 />
 </div>
 <div className="py-1 max-h-[250px] overflow-y-auto">
 {MOCK_FILTER_VALUES.map(v => (
 <SelectItem key={v} value={v} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8">{v}</SelectItem>
 ))}
 </div>
 </SelectContent>
 </Select>
 </div>
 )}
 </div>
 ))}

 <button 
 onClick={() => setFilters(prev => [...prev, { id: Math.random().toString(), field: "", operator: "equals", value: "" }])}
 className="w-fit border-none rounded-md flex items-center justify-center px-2.5 py-1 hover:bg-[#e8e8e8] bg-card text-[13px] text-[#0f52ff] h-[28px] mt-1"
 >
 <div className="flex items-center gap-1.5">
 <Plus className="size-3.5" />
 <span>Add filter</span>
 </div>
 </button>
 </div>
 );
 };

 const groupByOptions: SelectOption[] = [
 "Institution", 
 "Mission Type", 
 "Planner", 
 "Reviewer", 
 "Risk", 
 "Certificate", 
 "Evidence Source", 
 "Policy", 
 "Authority", 
 "Agent", 
 "Owner"
 ];

 const renderGroupBys = () => {
 return (
 <div className="flex flex-col gap-2 w-full mt-1">
 <span className="text-[11px] font-medium text-muted-foreground">Group by</span>
 <div className="flex flex-col gap-2 w-full">
 {groupBys.map((gb, i) => (
 <div key={i} className="flex items-center gap-2">
 <Select value={gb} onValueChange={(val) => {
 setGroupBys(prev => {
 const next = [...prev];
 next[i] = val;
 return next;
 });
 }}>
 <SelectTrigger className="w-full border border-border rounded-md flex items-center justify-between px-3 py-1.5 hover:border-[#b0b0b0] bg-card text-[12px] text-foreground/90 h-[30px] shadow-none focus:ring-0">
 <SelectValue placeholder="Select group by..." />
 </SelectTrigger>
 <SelectContent position="popper" className="bg-card border border-border rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-0">
 <div className="sticky top-0 bg-card z-10 px-2 pt-2 pb-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
 <input 
 type="text" 
 placeholder="Search..."
 className="w-full text-[12px] text-foreground/90 bg-card border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#b0b0b0]"
 onKeyDown={(e) => e.stopPropagation()} 
 />
 </div>
 <div className="py-1">
 {groupByOptions.map((opt, idx) => {
 if (typeof opt === 'string') {
 return <SelectItem key={opt} value={opt} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8">{opt}</SelectItem>;
 }
 return (
 <SelectGroup key={opt.label || idx}>
 {opt.label && <SelectLabel className="text-[11px] font-semibold text-muted-foreground pl-3 py-1.5">{opt.label}</SelectLabel>}
 {opt.options.map(subOpt => (
 <SelectItem key={subOpt} value={subOpt} className="text-[12px] text-foreground/90 focus:bg-card focus:text-foreground cursor-pointer rounded-none data-[state=checked]:text-[#0f52ff] py-2 pl-3 pr-8">{subOpt}</SelectItem>
 ))}
 </SelectGroup>
 );
 })}
 </div>
 </SelectContent>
 </Select>
 <button 
 onClick={() => setGroupBys(prev => prev.filter((_, idx) => idx !== i))}
 className="text-muted-foreground hover:text-foreground shrink-0 p-1"
 >
 <Trash2 className="size-4" />
 </button>
 </div>
 ))}

 <button 
 onClick={() => setGroupBys(prev => [...prev, ""])}
 className="w-fit border-none rounded-md flex items-center justify-center px-2 py-1 text-[13px] text-[#0f52ff] h-[28px] bg-transparent hover:bg-accent -ml-2 mt-1"
 >
 <div className="flex items-center gap-1.5">
 <Plus className="size-3.5" />
 <span>Add group by</span>
 </div>
 </button>
 </div>
 </div>
 );
 };


 const metricOptions: SelectOption[] = [
 { label: "Missions", options: ["Total Missions", "Running Missions", "Completed Missions", "Failed Missions", "Average Runtime", "Waiting Review", "Mission Success Rate", "Mission Retry Count"] },
 { label: "Verification", options: ["PASS Certificates", "FAIL Certificates", "Needs Review", "Verification Rate", "Average Confidence", "Human Approval %", "Evidence Completeness", "Policy Compliance"] },
 { label: "Evidence", options: ["Evidence Count", "GitHub Evidence", "Browser Evidence", "API Evidence", "Manual Notes", "Screenshots", "Documents", "Average Evidence per Mission"] },
 { label: "Authority", options: ["Allowed Actions", "Blocked Actions", "Approval Requests", "Spend Used", "Spend Remaining", "Policy Violations", "Denied Requests"] },
 { label: "Institution Memory", options: ["Institution Records", "Lessons Learned", "Template Updates", "Improvement Suggestions", "Repeat Missions", "Knowledge Growth"] },
 { label: "Institutions", options: ["Institution Health", "Active Missions", "Mission Queue", "Average Runtime", "Verification %", "Certificates", "Memory Growth"] }
 ];

 const renderCustomSeries = () => {
 return (
 <div className="flex flex-col gap-6 w-full">
 <Reorder.Group axis="y" values={customSeries} onReorder={setCustomSeries} className="flex flex-col gap-6 w-full">
 {customSeries.map((series, index) => (
 <Reorder.Item 
 key={series.id} 
 value={series}
 className="flex items-stretch bg-card rounded-md border border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden relative"
 >
 <div className="w-[3px] bg-[#0f52ff] shrink-0" />
 <div className="p-3.5 flex-1 flex flex-col gap-3 min-w-0 bg-card">
 <div className="flex items-center gap-2">
 <div className="cursor-grab hover:bg-accent p-1 rounded active:cursor-grabbing text-[#b0b0b0]">
 <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
 <circle cx="4" cy="4" r="1.5" />
 <circle cx="4" cy="8" r="1.5" />
 <circle cx="4" cy="12" r="1.5" />
 <circle cx="8" cy="4" r="1.5" />
 <circle cx="8" cy="8" r="1.5" />
 <circle cx="8" cy="12" r="1.5" />
 </svg>
 </div>
 <input 
 type="text" 
 value={series.name}
 onChange={(e) => {
 const next = [...customSeries];
 next[index] = { ...next[index], name: e.target.value };
 setCustomSeries(next);
 }}
 className="flex-1 border border-border rounded-md px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff]"
 />
 {customSeries.length > 1 && (
 <button 
 onClick={() => setCustomSeries(prev => prev.filter((_, i) => i !== index))}
 className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent"
 >
 <Trash2 className="size-4" />
 </button>
 )}
 </div>
 
 <div className="flex flex-col gap-1 mt-1 ml-[28px]">
 <span className="text-[11px] font-medium text-foreground">Metric</span>
 {selectShell(
 series.metric, 
 (val) => {
 const next = [...customSeries];
 next[index] = { ...next[index], metric: val };
 setCustomSeries(next);
 }, 
 metricOptions
 )}
 </div>
 
 <div className="flex flex-col gap-2 mt-1 ml-[28px]">
 <span className="text-[11px] font-medium text-foreground">Filters</span>
 <button className="text-[13px] text-[#0f52ff] flex items-center gap-1.5 hover:underline w-fit">
 <Plus className="size-3.5" /> Add filter
 </button>
 </div>
 </div>
 </Reorder.Item>
 ))}
 </Reorder.Group>
 <button 
 onClick={() => setCustomSeries(prev => [...prev, { id: `series-${Math.random()}`, name: "Mission Series", metric: "Total Missions", filters: [] }])}
 className="text-[13px] text-foreground/90 flex items-center gap-1.5 hover:text-foreground font-medium w-fit mt-1 ml-1"
 >
 <Plus className="size-3.5" /> Add series
 </button>
 </div>
 );
 };

 const renderModifierControls = () => {
 const modifierMode = CHART_MODIFIER_MODE_BY_NAME[selectedChartType] || "summary";
 
 if (graphMode === "custom" && ["timeseries", "bars", "geo"].includes(modifierMode)) {
 return renderCustomSeries();
 }

 if (modifierMode === "summary") {
 return (
 <>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Metric</span>
 {selectShell(activeMetric, setActiveMetric, metricOptions)}
 </div>
 {renderFilters()}
 </>
 );
 }

 if (modifierMode === "percentage") {
 return (
 <>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">
 Numerator <Info className="inline size-3 align-[-1px] text-[#98a2b3]" />
 </span>
 <span className="text-[11px] font-medium text-muted-foreground">Metric</span>
 {selectShell(activeMetric, setActiveMetric, metricOptions)}
 </div>

 <div className="flex flex-col gap-2">
 <span className="text-[11px] font-medium text-muted-foreground">Filters</span>
 {renderFilters()}
 </div>

 <div className="w-full h-[1px] bg-card" />

 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">
 Denominator <Info className="inline size-3 align-[-1px] text-[#98a2b3]" />
 </span>
 <span className="text-[11px] font-medium text-muted-foreground">Metric</span>
 {selectShell("Requests - Total", () => { }, metricOptions)}
 </div>

 <div className="flex flex-col gap-2">
 <span className="text-[11px] font-medium text-muted-foreground">Filters</span>
 {renderFilters()}
 </div>
 </>
 );
 }

 if (modifierMode === "timeseries") {
 return (
 <>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Metric</span>
 {selectShell(activeMetric, setActiveMetric, metricOptions)}
 </div>
 {renderFilters()}
 {renderGroupBys()}
 </>
 );
 }

 if (modifierMode === "bars") {
 return (
 <>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Metric</span>
 {selectShell(activeMetric, setActiveMetric, metricOptions)}
 </div>
 {renderFilters()}
 {renderGroupBys()}
 </>
 );
 }

 if (modifierMode === "geo") {
 return (
 <>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Metric</span>
 {selectShell(activeMetric, setActiveMetric, metricOptions)}
 </div>
 {renderFilters()}
 {renderGroupBys()}
 </>
 );
 }

 if (modifierMode === "flow") {
 return (
 <>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Metric</span>
 {selectShell(activeMetric, setActiveMetric, metricOptions)}
 </div>
 {renderFilters()}

 <div className="flex flex-col gap-1 mt-2">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Split by</span>
 <div className="flex items-center gap-2">
 <GripVertical className="size-3.5 text-[#b0b0b0]" />
 {selectShell("Path", () => { }, ["Path", "Country"])}
 </div>

 <div className="flex justify-center my-0.5">
 <span className="text-[#b0b0b0] text-[12px]">↓</span>
 </div>

 <div className="flex items-center gap-2">
 <GripVertical className="size-3.5 text-[#b0b0b0]" />
 {selectShell("Country", () => { }, ["Path", "Country"])}
 </div>

 <button className="text-[12px] text-muted-foreground font-medium flex items-center gap-1.5 hover:text-foreground self-start mt-2">
 <Plus className="size-3" />
 Add split by
 </button>
 </div>
 </>
 );
 }

 return (
 <>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Metric</span>
 {selectShell(activeMetric, setActiveMetric, metricOptions)}
 </div>
 <div className="flex flex-col gap-2 w-full mt-1">
 <span className="text-[11px] font-medium text-muted-foreground">Filters</span>
 {renderFilters()}
 </div>
 </>
 );
 }

 if (selectedBuilderType) {
 if (mode === "edit" || id === "blank-dashboard") {
 return (
 <motion.div
 key="blank-dashboard-editor"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.18, ease: "easeOut" }}
 className="w-full flex flex-col font-sans min-h-screen relative isolate bg-card"
 >
 <div className="flex items-center justify-between px-6 py-6 border-b border-border bg-card z-10">
 <div className="flex flex-col">
 <h1 className="text-[18px] font-semibold text-foreground tracking-tight">{selectedChartType}</h1>
 <p className="text-[11px] text-[#667085]">Blank dashboard builder</p>
 </div>
 <div className="flex items-center gap-2">
 <Button onClick={handleAddBlankDashboardCard} className="h-8 px-6 text-[13px] font-medium bg-[#0f52ff] hover:bg-[#0044ff] text-white">
 Save
 </Button>
 <Button
 variant="outline"
 onClick={() => {
 setSelectedBuilderType(null);
 onBack();
 }}
 className="h-8 px-6 text-[13px] font-medium border-border !text-foreground/90 hover:bg-card"
 >
 Cancel
 </Button>
 </div>
 </div>

 <div className="flex flex-1 overflow-hidden">
 <div className="w-[380px] shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto z-10 shadow-[2px_0_10px_rgba(0,0,0,0.01)] relative">
 <div className="flex-1 p-6 flex flex-col gap-6">
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between cursor-pointer">
 <span className="text-[12px] font-medium text-foreground flex items-center gap-1.5"><ChevronDown className="size-3.5" /> Chart type</span>
 </div>
 <div className="flex flex-col gap-1 ml-5">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Chart type</span>
 <div ref={chartTypeRef} className="relative">
 <Popover open={chartTypeOpen} onOpenChange={setChartTypeOpen}>
 <PopoverTrigger asChild>
 <button type="button" className="w-full border border-border rounded flex items-center justify-between px-3 py-1.5 cursor-pointer hover:border-[#b0b0b0] bg-card">
 <div className="flex items-center gap-2 text-[12px] text-foreground/90">
 <Hash className="size-4 text-muted-foreground" />
 <span>{selectedChartType}</span>
 </div>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </PopoverTrigger>
 <PopoverContent align="start" sideOffset={8} className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-border bg-card shadow-[0_18px_50px_rgba(15,23,42,0.10)] overflow-hidden p-0">
 <div className="max-h-[360px] overflow-y-auto py-1.5">
 {filteredChartSections.map((section) => (
 <div key={section.heading} className="py-1">
 <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#98a2b3]">{section.heading}</div>
 <div className="flex flex-col">
 {section.items.map((chart) => {
 const ActiveIcon = chart.icon;
 const isSelected = chart.name === selectedChartType;
 return (
 <button
 key={chart.name}
 type="button"
 onClick={() => {
 setSelectedChartType(chart.name);
 setChartTypeOpen(false);
 }}
 className={cn("flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-card", isSelected && "bg-[#eef4ff]")}
 >
 <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border", isSelected ? "border-[#0f52ff] bg-card text-[#0f52ff]" : "border-border bg-card text-[#4b5563]")}>
 <ActiveIcon className="size-4" />
 </div>
 <div className="min-w-0 flex-1">
 <span className="text-[13px] font-semibold text-foreground">{chart.name}</span>
 <p className="mt-0.5 text-[11px] leading-snug text-[#667085]">{chart.desc}</p>
 </div>
 {isSelected ? <Check className="mt-2 size-4 shrink-0 text-[#0f52ff]" /> : null}
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </PopoverContent>
 </Popover>
 </div>
 </div>
 </div>
 <div className="w-full h-[1px] bg-card" />
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between cursor-pointer">
 <span className="text-[12px] font-medium text-foreground flex items-center gap-1.5"><ChevronDown className="size-3.5" /> Dataset</span>
 </div>
 <div className="flex flex-col gap-1 ml-5">
 <span className="text-[11px] font-medium text-muted-foreground mb-1">Dataset</span>
 <Select value={activeDataset} onValueChange={setActiveDataset}>
 <SelectTrigger className="w-full border border-border rounded flex items-center justify-between px-3 py-1.5 hover:border-[#b0b0b0] bg-card text-[12px] text-foreground/90 h-[30px] shadow-none focus:ring-0">
 <SelectValue />
 </SelectTrigger>
 <SelectContent position="popper" className="bg-card border border-border rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-0">
 <div className="py-1">
 <SelectItem value="Missions">Missions</SelectItem>
 <SelectItem value="Institutions">Institutions</SelectItem>
 </div>
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="w-full h-[1px] bg-card" />
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between cursor-pointer">
 <span className="text-[12px] font-medium text-foreground flex items-center gap-1.5"><ChevronDown className="size-3.5" /> Graph the data</span>
 </div>
 <div className="flex flex-col gap-6 ml-5 mt-2">
 {renderModifierControls()}
 </div>
 </div>
 </div>
 </div>
 <div className="flex-1 bg-card relative overflow-hidden flex flex-col p-6">
 <div className="absolute inset-0 bg-[radial-gradient(#e2e2e2_1px,transparent_1px)] bg-[size:24px_24px] opacity-70" />
 <div className="relative z-10 flex flex-col w-full flex-1 items-center justify-center">
 <div className="w-[360px]">
 <span className="text-[11px] text-muted-foreground font-medium mb-2 pl-2">Chart preview</span>
 <div className="bg-card border border-border rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden transition-all duration-300 w-full h-[160px] shrink-0">
 <div className="flex items-center justify-end gap-2 p-3 border-b border-[#f0f0f0] shrink-0 bg-card z-10">
 <div className="inline-flex items-center gap-1.5 rounded-full border border-[#cfdcff] bg-card px-2.5 py-1 text-[11px] font-medium text-[#2457ff] shadow-[0_1px_2px_rgba(36,87,255,0.06)]">
 <Globe2 className="size-3 shrink-0 text-[#2457ff]" />
 <span className="max-w-[150px] truncate">{previewTitle}</span>
 <ChevronDown className="size-3 shrink-0 text-[#6f86d6]" />
 </div>
 <button type="button" className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-[#8a94a8] transition-colors hover:border-[#c9d6ff] hover:text-[#2457ff]" aria-label="Archive dashboard shortcut" title="Archive">
 <Bookmark className="size-4" />
 </button>
 </div>
 <div className="relative flex-1 w-full flex flex-col min-h-0 bg-card">
 {renderPreviewBody()}
 </div>
 </div>
 </div>
 </div>
 <div className="absolute bottom-4 right-4 z-10">
 <button className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 hover:text-foreground">
 <Code className="size-3" /> View GraphQL query
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 );
 }

 return (
 <motion.div
 key="blank-dashboard-picker"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.18, ease: "easeOut" }}
 className="w-full flex flex-col font-sans min-h-screen relative isolate bg-card px-6 py-6"
 >
 <div className="flex items-center justify-between px-6 py-6 border-b border-border bg-card z-10">
 <div className="flex flex-col">
 <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0f52ff] mb-1">Step 1 of 2</div>
 <h1 className="text-[18px] font-semibold text-foreground tracking-tight">Start from a blank dashboard</h1>
 </div>
 <div className="flex items-center gap-2">
 <Button onClick={handleAddBlankDashboardCard} className="h-8 px-6 text-[13px] font-medium bg-[#0f52ff] hover:bg-[#0044ff] text-white">Add</Button>
 <Button variant="outline" onClick={handleCancelBlankDashboardCard} className="h-8 px-6 text-[13px] font-medium border-border !text-foreground/90 hover:bg-card">Cancel</Button>
 </div>
 </div>

 <div className="flex flex-1 flex-col items-center justify-start px-8 py-10">
 <div className="w-full max-w-[980px]">
 <div className="mb-6 flex items-center justify-between gap-6">
 <div>
 <p className="text-[13px] font-medium text-[#667085]">Pick the first chart for this dashboard.</p>
 <p className="text-[12px] text-[#98a2b3]">You can add more charts after the dashboard is created.</p>
 </div>
 <div className="hidden rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-[#0f52ff] md:inline-flex">
 Guided builder
 </div>
 </div>
 <div className="flex flex-col bg-card border border-border rounded-md overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="h-[140px] bg-card border-b border-border p-6 flex flex-col gap-3 relative overflow-hidden">
 <div className="flex gap-2 w-full">
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">#</div>
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">#</div>
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">%</div>
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">#</div>
 </div>
 <button type="button" className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-[#8a94a8] hover:border-[#c9d6ff] hover:text-[#2457ff]" aria-label="Archive dashboard shortcut" title="Archive">
 <Bookmark className="size-4" />
 </button>
 <div className="absolute bottom-[-10px] left-0 w-full h-[80px]">
 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
 <path d="M0,80 Q10,40 25,60 T50,30 T75,50 T100,20 L100,100 L0,100 Z" fill="none" stroke="#ddd" strokeWidth="1.5" />
 <line x1="25" y1="60" x2="25" y2="90" stroke="#eee" strokeWidth="1" strokeDasharray="2 2" />
 <line x1="50" y1="30" x2="50" y2="90" stroke="#eee" strokeWidth="1" strokeDasharray="2 2" />
 <line x1="75" y1="50" x2="75" y2="90" stroke="#eee" strokeWidth="1" strokeDasharray="2 2" />
 </svg>
 </div>
 </div>
 <div className="p-6 flex flex-col">
 <h3 className="text-[14px] font-semibold text-foreground">{previewTitle}</h3>
 <p className="text-[12px] text-muted-foreground mb-5">1 chart</p>
 <p className="text-[11px] text-muted-foreground leading-relaxed">Custom dashboard card from live backend data.</p>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );
 }

 return (
 <div className="w-full flex flex-col p-6 bg-card font-sans min-h-screen relative isolate">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
 <div className="flex items-center gap-6">
 <Button
 variant="ghost"
 size="icon"
 onClick={onBack}
 className="size-8 text-muted-foreground hover:text-foreground hover:bg-card"
 >
 <ArrowLeft className="size-4" />
 </Button>
 <h1 className="text-[24px] font-semibold text-foreground tracking-tight capitalize">
 {id === "blank-dashboard" ? previewTitle : liveDashboard?.title ?? id.replace(/-/g, " ")}
 </h1>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" className="h-8 px-3 text-[12px] font-medium border-border text-foreground/90 hover:bg-card">
 <Printer className="size-3.5 mr-1.5" />
 Print
 </Button>
 <Button variant="outline" className="h-8 px-3 text-[12px] font-medium border-border text-foreground/90 hover:bg-card">
 <LinkIcon className="size-3.5 mr-1.5" />
 Copy link
 </Button>
 <Button className="h-8 px-3 text-[12px] font-medium bg-[#0f52ff] hover:bg-[#0044ff] text-white">
 <Plus className="size-3.5 mr-1.5" />
 Add a chart
 </Button>
 </div>
 </div>

 {/* Filter Bar */}
 <div className="flex items-center justify-between bg-card border border-border p-1.5 rounded mb-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <Button variant="ghost" className="h-8 px-3 text-[13px] text-foreground/80 font-medium hover:text-foreground hover:bg-card rounded-sm">
 <Filter className="size-3.5 mr-2" />
 Add filter
 </Button>
 <Button variant="outline" className="h-8 px-3 text-[13px] text-foreground/80 font-medium border-border hover:bg-card rounded-sm bg-card">
 Last 24 hours (GMT+5:30)
 <Calendar className="size-3.5 ml-2 text-muted-foreground" />
 </Button>
 </div>

 {error && (
 <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-6 py-3 text-[14px] text-red-700">
 {error}
 </div>
 )}

 {customDashboard && mode === "view" ? (
 <div className="space-y-6 pb-12">
 <div className="rounded-md border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f52ff]">Custom dashboard</div>
 <div className="mt-1 text-[14px] text-muted-foreground">{customDashboard.title}</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="mb-4">
 <div className="text-[14px] font-semibold text-foreground">{customDashboard.chartType ?? "Mission Timeline"}</div>
 <div className="text-[12px] text-muted-foreground">Saved from the blank dashboard flow.</div>
 </div>
 <div className="flex justify-start">
 <div className="w-full max-w-[420px] rounded-md border border-border bg-card overflow-hidden">
 <div className="h-[120px] bg-muted/50 border-b border-border p-6 flex flex-col gap-2 relative overflow-hidden">
 <div className="flex gap-2 w-full">
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">#</div>
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">#</div>
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">%</div>
 <div className="flex-1 h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">#</div>
 </div>
 <div className="absolute bottom-[-10px] left-0 w-full h-[68px]">
 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
 <path d="M0,80 Q10,40 25,60 T50,30 T75,50 T100,20" fill="none" stroke="#ccd5e1" strokeWidth="1.5" />
 </svg>
 </div>
 </div>
 <div className="p-6 flex flex-col">
 <h3 className="text-[14px] font-semibold text-foreground">{customDashboard.title}</h3>
 <p className="text-[12px] text-muted-foreground mb-4">1 chart</p>
 <p className="text-[11px] text-muted-foreground leading-relaxed">Open this dashboard to continue editing the chart.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : liveDashboard ? (
 <div className="space-y-6 pb-12">
 <div className="rounded-md border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f52ff]">Live backend snapshot</div>
 <div className="mt-1 text-[14px] text-muted-foreground">{liveDashboard.subtitle}</div>
 </div>
 <div className="text-[12px] text-muted-foreground">
 {loading ? "Refreshing live metrics..." : "Auto-refreshes every 15 seconds"}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
 {liveDashboard.metrics.map((metric) => (
 <div key={metric.label} className="rounded-md border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</div>
 <div className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">{metric.value}</div>
 {metric.hint ? <div className="mt-1 text-[12px] text-muted-foreground">{metric.hint}</div> : null}
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
 <div className="rounded-md border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="mb-4">
 <div className="text-[14px] font-semibold text-foreground">
 {liveDashboard.dashboardId === "execution-overview"
 ? "Runtime Trend"
 : liveDashboard.dashboardId === "verification-overview"
 ? "Confidence Trend"
 : liveDashboard.dashboardId === "authority-overview"
 ? "Policy Mix"
 : liveDashboard.dashboardId === "institution-overview"
 ? "Institution Leaderboard"
 : liveDashboard.dashboardId === "evidence-overview"
 ? "Proof Mix"
 : "Live Status Mix"}
 </div>
 <div className="text-[12px] text-muted-foreground">
 {liveDashboard.dashboardId === "execution-overview"
 ? "Average runtime across recent mission activity."
 : liveDashboard.dashboardId === "verification-overview"
 ? "Verification confidence averaged across live missions."
 : liveDashboard.dashboardId === "authority-overview"
 ? "Policy outcomes derived from live authority rules."
 : liveDashboard.dashboardId === "institution-overview"
 ? "Institutions ranked by mission throughput."
 : liveDashboard.dashboardId === "evidence-overview"
 ? "Current evidence, artifacts, and certificates."
 : "Derived from current missions in the backend."}
 </div>
 </div>
 <ResponsiveContainer width="100%" height={260}>
 {liveDashboard.dashboardId === "execution-overview" ? (
 <ComposedChart data={liveDashboard.runtimeTrend}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Bar dataKey="missions" fill="#0f52ff" radius={[4, 4, 0, 0]} />
 <Line type="monotone" dataKey="runtime" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
 </ComposedChart>
 ) : liveDashboard.dashboardId === "verification-overview" ? (
 <RechartsLineChart data={liveDashboard.confidenceTrend}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2.5} dot={false} />
 </RechartsLineChart>
 ) : liveDashboard.dashboardId === "authority-overview" ? (
 <RechartsBarChart data={liveDashboard.policyBreakdown}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
 {liveDashboard.policyBreakdown.map((entry) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Bar>
 </RechartsBarChart>
 ) : liveDashboard.dashboardId === "institution-overview" ? (
 <RechartsBarChart data={liveDashboard.leaderboard} layout="vertical" margin={{ left: 20 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis type="number" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Bar dataKey="value" fill="#0f52ff" radius={[0, 4, 4, 0]} />
 </RechartsBarChart>
 ) : liveDashboard.dashboardId === "evidence-overview" ? (
 <RechartsPieChart>
 <Pie data={liveDashboard.proofMix} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
 {liveDashboard.proofMix.map((entry) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip />
 </RechartsPieChart>
 ) : (
 <RechartsPieChart>
 <Pie data={liveDashboard.statusBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
 {liveDashboard.statusBreakdown.map((entry) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip />
 </RechartsPieChart>
 )}
 </ResponsiveContainer>
 </div>

 <div className="xl:col-span-2 rounded-md border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="mb-4">
 <div className="text-[14px] font-semibold text-foreground">
 {liveDashboard.dashboardId === "execution-overview"
 ? "Execution Throughput"
 : liveDashboard.dashboardId === "verification-overview"
 ? "PASS Rate Trend"
 : liveDashboard.dashboardId === "authority-overview"
 ? "Policies vs Reviews"
 : liveDashboard.dashboardId === "institution-overview"
 ? "Mission Activity Trend"
 : liveDashboard.dashboardId === "evidence-overview"
 ? "Proof Volume Trend"
 : "Seven Day Trend"}
 </div>
 <div className="text-[12px] text-muted-foreground">
 {liveDashboard.dashboardId === "execution-overview"
 ? "Missions and runtime minutes from the backend snapshot."
 : liveDashboard.dashboardId === "verification-overview"
 ? "Confidence over time from the latest mission verdicts."
 : liveDashboard.dashboardId === "authority-overview"
 ? "Live policy distribution across recent missions."
 : liveDashboard.dashboardId === "institution-overview"
 ? "Top institutions and their current mission throughput."
 : liveDashboard.dashboardId === "evidence-overview"
 ? "Evidence, artifacts, and certificate counts from the backend."
 : "Missions and PASS rate from the live snapshot feed."}
 </div>
 </div>
 <ResponsiveContainer width="100%" height={260}>
 {liveDashboard.dashboardId === "execution-overview" ? (
 <ComposedChart data={liveDashboard.runtimeTrend}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Bar yAxisId="left" dataKey="missions" fill="#0f52ff" radius={[4, 4, 0, 0]} />
 <Line yAxisId="right" type="monotone" dataKey="runtime" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
 </ComposedChart>
 ) : liveDashboard.dashboardId === "verification-overview" ? (
 <RechartsPieChart>
 <Pie data={liveDashboard.statusBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
 {liveDashboard.statusBreakdown.map((entry) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip />
 </RechartsPieChart>
 ) : liveDashboard.dashboardId === "authority-overview" ? (
 <RechartsLineChart data={liveDashboard.trend}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2.5} dot={false} />
 </RechartsLineChart>
 ) : liveDashboard.dashboardId === "institution-overview" ? (
 <RechartsPieChart>
 <Pie data={liveDashboard.statusBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
 {liveDashboard.statusBreakdown.map((entry) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip />
 </RechartsPieChart>
 ) : liveDashboard.dashboardId === "evidence-overview" ? (
 <ComposedChart data={liveDashboard.trend}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Bar dataKey="missions" fill="#0f52ff" radius={[4, 4, 0, 0]} />
 <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2.5} dot={false} />
 </ComposedChart>
 ) : (
 <ComposedChart data={liveDashboard.trend}>
 <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
 <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#666" }} />
 <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12, fill: "#666" }} />
 <Tooltip />
 <Bar yAxisId="left" dataKey="missions" fill="#0f52ff" radius={[4, 4, 0, 0]} />
 <Line yAxisId="right" type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2.5} dot={false} />
 </ComposedChart>
 )}
 </ResponsiveContainer>
 </div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
 <div className="mb-4">
 <div className="text-[14px] font-semibold text-foreground">Recent Missions</div>
 <div className="text-[12px] text-muted-foreground">Pulled from the backend in real time.</div>
 </div>
 <div className="overflow-hidden rounded-md border border-border">
 <table className="w-full text-left border-collapse">
 <thead className="bg-muted/50">
 <tr>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground">Mission</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground">Status</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground">Runtime</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground">Verification</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground">Updated</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e8]">
 {liveDashboard.missions.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-6 py-8 text-center text-[13px] text-muted-foreground">
 No live missions yet.
 </td>
 </tr>
 ) : (
 liveDashboard.missions.map((mission) => (
 <tr key={mission.id} className="hover:bg-card">
 <td className="px-6 py-3">
 <div className="font-medium text-foreground">{mission.title ?? mission.id}</div>
 <div className="text-[11px] text-muted-foreground truncate max-w-[360px]">{mission.objective ?? "Live mission"}</div>
 </td>
 <td className="px-6 py-3 text-[12px] text-muted-foreground">{mission.state ?? "Unknown"}</td>
 <td className="px-6 py-3 text-[12px] text-muted-foreground">
 {formatRuntimeDuration(mission.executionRun?.startedAt ?? mission.startedAt, mission.executionRun?.finishedAt ?? mission.completedAt)}
 </td>
 <td className="px-6 py-3 text-[12px] text-muted-foreground">{mission.verificationRun?.finalDecision ?? "Pending"}</td>
 <td className="px-6 py-3 text-[12px] text-muted-foreground">{mission.updatedAt ? new Date(mission.updatedAt).toLocaleString() : "Just now"}</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 ) : id === "blank-dashboard" ? (
 <div className="flex flex-col items-center pt-8 pb-16">
 <p className="text-[14px] text-muted-foreground mb-8">Get started by adding your first chart</p>
 <div className="w-full max-w-[920px] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {BLANK_CHART_SECTIONS.flatMap((section) =>
 section.items.map((chart) => {
 const Icon = chart.icon;
 return (
 <button
 key={`${section.heading}-${chart.name}`}
 type="button"
 onClick={() => {
 setSelectedChartType(chart.name);
 setSelectedBuilderType(chart.name);
 }}
 className="flex min-h-[108px] flex-col items-start rounded-md border border-border bg-card p-6 text-left transition-all hover:border-[#0f52ff] hover:shadow-[0_4px_14px_rgba(15,82,255,0.06)]"
 >
 <div className="mb-3 flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
 <Icon className="size-4" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground">{chart.name}</h3>
 <p className="mt-1 max-w-[260px] text-[12px] leading-snug text-[#667085]">{chart.desc}</p>
 </button>
 );
 }),
 )}
 </div>
 </div>
 ) : (
 <div className="flex flex-col items-center pt-8 pb-16">
 <p className="text-[14px] text-muted-foreground mb-3">
 {loading ? "Loading live analytics snapshot..." : "Live analytics snapshot unavailable."}
 </p>
 <p className="text-[12px] text-muted-foreground max-w-[520px] text-center">
 This dashboard now reads from the backend mission-control snapshot. Select a workspace or wait for the next refresh.
 </p>
 </div>
 )}

 </div>
 );
}

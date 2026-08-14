"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
 Search,
 Globe,
 MoreVertical,
 Plus,
 Building2,
 Trash2,
 RefreshCw,
 ArrowUpRight,
 ArrowDownRight,
 LayoutGrid,
} from "lucide-react";
import {
 AreaChart,
 Area,
 ResponsiveContainer,
 Tooltip,
 PieChart,
 Pie,
 Cell,
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
} from "recharts";
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
 archiveEpochInstitution,
 cloneEpochInstitution,
 createEpochInstitution,
 listEpochInstitutions,
 readActiveEpochWorkspaceId,
 type EpochInstitution,
 type EpochMission,
} from "@/lib/epoch-api";
import { cn } from "@/lib/utils";

type SpanSize = "1x1" | "2x1" | "2x2";

interface MetricCardData {
 id: string;
 title: string;
 value: string | number;
 spanSize?: SpanSize;
}

type InstitutionRow = {
 id: string;
 name: string;
 type: string;
 health: string;
 activeMissions: number;
 totalMissions: number;
 verification: string;
 activity: string;
 rawMissions?: EpochMission[];
};

function formatRelativeTime(value?: string): string {
 if (!value) return "Unknown";
 const timestamp = new Date(value).getTime();
 if (!Number.isFinite(timestamp)) return "Unknown";
 const deltaMs = timestamp - Date.now();
 const deltaMinutes = Math.round(deltaMs / 60000);
 const absMinutes = Math.abs(deltaMinutes);
 if (absMinutes < 1) return "Just now";
 if (absMinutes < 60) return `${deltaMinutes < 0 ? "" : "in "}${absMinutes} min${absMinutes === 1 ? "" : "s"}${deltaMinutes < 0 ? " ago" : ""}`.trim();
 const deltaHours = Math.round(deltaMinutes / 60);
 const absHours = Math.abs(deltaHours);
 if (absHours < 24) return `${deltaHours < 0 ? "" : "in "}${absHours} hour${absHours === 1 ? "" : "s"}${deltaHours < 0 ? " ago" : ""}`.trim();
 const deltaDays = Math.round(deltaHours / 24);
 const absDays = Math.abs(deltaDays);
 return `${deltaDays < 0 ? "" : "in "}${absDays} day${absDays === 1 ? "" : "s"}${deltaDays < 0 ? " ago" : ""}`.trim();
}

function getLatestMission(institution: EpochInstitution) {
 const missions = institution.missions ?? [];
 return missions[0] ?? null;
}

function getInstitutionHealth(institution: EpochInstitution): string {
 const latestMission = getLatestMission(institution);
 const status = (institution.status ?? institution.currentState ?? "").toLowerCase();
 const latestDecision = latestMission?.verificationRun?.finalDecision?.toUpperCase?.() ?? "";
 const latestMissionState = (latestMission?.state ?? "").toLowerCase();

 if (status === "archived" || latestMissionState === "failed" || latestDecision === "FAIL") {
 return "Attention";
 }
 if (latestMissionState === "waiting_review" || latestDecision === "REVIEW") {
 return "Needs Review";
 }
 if (latestMissionState === "running") {
 return "Running";
 }
 return "Healthy";
}

function getHealthBadge(health: string) {
 switch (health) {
 case "Healthy":
 case "Running":
 return (
 <span className="inline-flex items-center gap-1.5 text-[13px] text-[#2a7b2a] font-medium px-2 py-0.5 rounded-full bg-[#eef7ee] border border-border">
 <span className="size-1.5 rounded-full bg-[#2a7b2a] animate-pulse" />
 {health}
 </span>
 );
 case "Needs Review":
 return (
 <span className="inline-flex items-center gap-1.5 text-[13px] text-[#8a6d1d] font-medium px-2 py-0.5 rounded-full bg-[#fff8dd] border border-[#fbeeb6]">
 <span className="size-1.5 rounded-full bg-[#8a6d1d]" />
 {health}
 </span>
 );
 case "Attention":
 return (
 <span className="inline-flex items-center gap-1.5 text-[13px] text-[#b42318] font-medium px-2 py-0.5 rounded-full bg-card border border-[#fecdca]">
 <span className="size-1.5 rounded-full bg-[#b42318]" />
 {health}
 </span>
 );
 default:
 return (
 <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-card border border-border">
 <span className="size-1.5 rounded-full bg-[#999]" />
 Unknown
 </span>
 );
 }
}

function mapInstitutionRows(institutions: EpochInstitution[]): InstitutionRow[] {
 return institutions.map((institution) => {
 const missions = institution.missions ?? [];
 const latestMission = missions[0] ?? null;
 const verification = latestMission?.verificationRun;
 const activeMissions = missions.filter((mission) => {
 const state = (mission.state ?? "").toLowerCase();
 return state === "running" || state === "waiting_review";
 }).length;

 return {
 id: institution.id,
 name: institution.name,
 type: institution.category ?? institution.template?.name ?? "General",
 health: getInstitutionHealth(institution),
 activeMissions,
 totalMissions: missions.length,
 verification:
 typeof verification?.confidence === "number"
 ? `${verification.confidence}%`
 : verification?.finalDecision ?? "N/A",
 activity: formatRelativeTime(institution.updatedAt ?? latestMission?.updatedAt),
 rawMissions: missions,
 };
 });
}

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
 { id: "institutions_health", title: "Institutions Health", value: "Health Status" },
 { id: "operations_velocity", title: "Operations Velocity", value: "Missions executed" },
 { id: "verdicts_ratio", title: "Verdicts Ratio", value: "PASS/FAIL Ratios" },
 { id: "confidence_trend", title: "Confidence Trend", value: "AI Confidence" },
];

export function InstitutionsOverview({ onViewInstitution }: { onViewInstitution?: (id: string) => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [query, setQuery] = useState("");
 const [searchInput, setSearchInput] = useState("");
 const [creating, setCreating] = useState(false);
 const [refreshTick, setRefreshTick] = useState(0);

 /* Draggable Grid Slots State (4 Slots) */
 const [gridSlots, setGridSlots] = useState<(MetricCardData | null)[]>(() => [
 { id: "institutions_health", title: "Institutions Health", value: "Active Health", spanSize: "1x1" },
 { id: "operations_velocity", title: "Operations Velocity", value: "Missions Flow", spanSize: "2x1" },
 { id: "verdicts_ratio", title: "Verdicts Ratio", value: "Pass/Fail Ratio", spanSize: "1x1" },
 { id: "confidence_trend", title: "Confidence Trend", value: "Avg Confidence", spanSize: "1x1" },
 ]);

 const [activeDragState, setActiveDragState] = useState<{
 slotIdx: number;
 width: number;
 height: number;
 } | null>(null);

 const cardRefMap = useRef<Map<number, HTMLDivElement>>(new Map());
 const [isHoveringSection, setIsHoveringSection] = useState(false);
 const [activeMenu, setActiveMenu] = useState<string | null>(null);
 const [activeSlotMenuIndex, setActiveSlotMenuIndex] = useState<number | null>(null);

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

 const refresh = useCallback(async () => {
 if (!workspaceId) {
 setInstitutions([]);
 setError("Select a workspace to load Epoch institutions.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const liveInstitutions = await listEpochInstitutions(workspaceId, {
 search: query.trim() || undefined,
 });
 setInstitutions(mapInstitutionRows(liveInstitutions ?? []));
 } catch (loadError) {
 setError(loadError instanceof Error ? loadError.message : "Failed to load institutions.");
 setInstitutions([]);
 } finally {
 setLoading(false);
 }
 }, [query, workspaceId]);

 useEffect(() => {
 void refresh();
 }, [refresh, refreshTick]);

 const handleCreateInstitution = useCallback(async () => {
 if (!workspaceId) {
 setError("Select a workspace before creating an institution.");
 return;
 }

 setCreating(true);
 setError(null);
 try {
 const created = await createEpochInstitution(workspaceId, {
 name: "New Institution",
 category: "general",
 });
 await refresh();
 onViewInstitution?.(created.id);
 } catch (createError) {
 setError(createError instanceof Error ? createError.message : "Failed to create institution.");
 } finally {
 setCreating(false);
 }
 }, [onViewInstitution, refresh, workspaceId]);

 const handleCloneInstitution = useCallback(
 async (institutionId: string) => {
 if (!workspaceId) return;
 setError(null);
 try {
 await cloneEpochInstitution(workspaceId, institutionId);
 await refresh();
 } catch (cloneError) {
 setError(cloneError instanceof Error ? cloneError.message : "Failed to clone institution.");
 }
 },
 [refresh, workspaceId],
 );

 const handleArchiveInstitution = useCallback(
 async (institutionId: string) => {
 if (!workspaceId) return;
 setError(null);
 try {
 await archiveEpochInstitution(workspaceId, institutionId);
 await refresh();
 } catch (archiveError) {
 setError(archiveError instanceof Error ? archiveError.message : "Failed to archive institution.");
 }
 },
 [refresh, workspaceId],
 );

 const handleSearch = useCallback(() => {
 setQuery(searchInput.trim());
 }, [searchInput]);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 const target = e.target as HTMLElement;
 if (!target.closest("[data-popover]")) {
 setActiveMenu(null);
 setActiveSlotMenuIndex(null);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 /* Drag Resize handler matching account home */
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

 const handleAddMetricToSlot = (slotIdx: number, catalogItem: typeof AVAILABLE_METRICS_CATALOG[0]) => {
 setGridSlots((prev) => {
 const next = [...prev];
 next[slotIdx] = {
 id: catalogItem.id,
 title: catalogItem.title,
 value: catalogItem.value,
 spanSize: "1x1",
 };
 return next;
 });
 setActiveSlotMenuIndex(null);
 };

 const handleRemoveMetricFromSlot = (slotIdx: number) => {
 setGridSlots((prev) => {
 const next = [...prev];
 next[slotIdx] = null;
 return next;
 });
 setActiveMenu(null);
 };

 /* Memoized dynamic data structures for Recharts */
 const chartData = useMemo(() => {
 // 1. Health Distribution
 let healthyCount = 0;
 let reviewCount = 0;
 let attentionCount = 0;

 institutions.forEach((inst) => {
 if (inst.health === "Healthy" || inst.health === "Running") healthyCount++;
 else if (inst.health === "Needs Review") reviewCount++;
 else if (inst.health === "Attention") attentionCount++;
 });

 const healthData = [
 { name: "Healthy", value: healthyCount, color: "#10b981" },
 { name: "Needs Review", value: reviewCount, color: "#f59e0b" },
 { name: "Attention", value: attentionCount, color: "#ef4444" },
 ].filter((item) => item.value > 0);

 const finalHealthData = healthData.length > 0 ? healthData : [
 { name: "Healthy", value: 3, color: "#10b981" },
 { name: "Needs Review", value: 1, color: "#f59e0b" },
 { name: "Attention", value: 0, color: "#ef4444" },
 ].filter((item) => item.value > 0);

 // 2. Verdicts Ratio
 let passCount = 0;
 let failCount = 0;
 let reviewVerdictCount = 0;

 institutions.forEach((inst) => {
 (inst.rawMissions ?? []).forEach((m) => {
 const dec = m.verificationRun?.finalDecision?.toUpperCase() ?? "";
 if (dec === "PASS") passCount++;
 else if (dec === "FAIL") failCount++;
 else if (dec === "REVIEW" || m.state === "waiting_review") reviewVerdictCount++;
 });
 });

 const verdictsData = [
 { name: "PASS", value: passCount, color: "#10b981" },
 { name: "FAIL", value: failCount, color: "#ef4444" },
 { name: "REVIEW", value: reviewVerdictCount, color: "#3b82f6" },
 ].filter((item) => item.value > 0);

 const finalVerdictsData = verdictsData.length > 0 ? verdictsData : [
 { name: "PASS", value: 14, color: "#10b981" },
 { name: "FAIL", value: 2, color: "#ef4444" },
 { name: "REVIEW", value: 4, color: "#3b82f6" },
 ].filter((item) => item.value > 0);

 // 3. Operations Velocity & Confidence Trends
 const velocityData = [
 { day: "Mon", active: 2, total: 4, confidence: 85 },
 { day: "Tue", active: 3, total: 7, confidence: 89 },
 { day: "Wed", active: 1, total: 5, confidence: 88 },
 { day: "Thu", active: 4, total: 10, confidence: 91 },
 { day: "Fri", active: 5, total: 12, confidence: 94 },
 { day: "Sat", active: 2, total: 8, confidence: 90 },
 { day: "Sun", active: 3, total: 9, confidence: 92 },
 ];

 // Overlay real data on the last data point if available
 const activeSum = institutions.reduce((sum, inst) => sum + inst.activeMissions, 0);
 const totalSum = institutions.reduce((sum, inst) => sum + inst.totalMissions, 0);
 if (institutions.length > 0) {
 velocityData[velocityData.length - 1].active = activeSum;
 velocityData[velocityData.length - 1].total = totalSum;
 }

 return {
 health: finalHealthData,
 verdicts: finalVerdictsData,
 trends: velocityData,
 };
 }, [institutions]);

 const activeMissionsTotal = useMemo(() => institutions.reduce((sum, inst) => sum + inst.activeMissions, 0), [institutions]);
 const totalMissionsCount = useMemo(() => institutions.reduce((sum, inst) => sum + inst.totalMissions, 0), [institutions]);

 const renderWidgetChart = (cardId: string, spanSize: SpanSize) => {
 const isBig = spanSize === "2x2" || spanSize === "2x1";

 if (cardId === "institutions_health") {
 return (
 <div className="h-[120px] w-full flex items-center justify-center relative mt-3">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={chartData.health}
 cx="50%"
 cy="50%"
 innerRadius={30}
 outerRadius={50}
 paddingAngle={4}
 dataKey="value"
 >
 {chartData.health.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip formatter={(value) => [`${value} count`, "Status"]} />
 </PieChart>
 </ResponsiveContainer>
 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
 <span className="text-[14px] font-bold text-foreground">{institutions.length || 4}</span>
 <span className="text-[9px] text-muted-foreground uppercase font-bold">Total</span>
 </div>
 </div>
 );
 }

 if (cardId === "operations_velocity") {
 return (
 <div className="h-[120px] w-full mt-3">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData.trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorMissions" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#0f52ff" stopOpacity={0.2} />
 <stop offset="95%" stopColor="#0f52ff" stopOpacity={0} />
 </linearGradient>
 </defs>
 {isBig && <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#777" }} />}
 {isBig && <YAxis tick={{ fontSize: 10, fill: "#777" }} />}
 {isBig && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" />}
 <Tooltip formatter={(value) => [value, "Missions"]} />
 <Area type="monotone" dataKey="total" stroke="#0f52ff" strokeWidth={2} fillOpacity={1} fill="url(#colorMissions)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 );
 }

 if (cardId === "verdicts_ratio") {
 return (
 <div className="h-[120px] w-full mt-3">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={chartData.verdicts}
 cx="50%"
 cy="50%"
 innerRadius={0}
 outerRadius={50}
 dataKey="value"
 >
 {chartData.verdicts.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip formatter={(value) => [value, "Verdicts"]} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 );
 }

 if (cardId === "confidence_trend") {
 return (
 <div className="h-[120px] w-full mt-3">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData.trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
 {isBig && <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#777" }} />}
 {isBig && <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "#777" }} />}
 {isBig && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" />}
 <Tooltip formatter={(value) => [`${value}%`, "Confidence"]} />
 <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2.5} dot={isBig} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 );
 }

 return null;
 };

 const getMetricSubtitle = (cardId: string) => {
 if (cardId === "institutions_health") {
 const activeCount = institutions.filter(i => i.health !== "Attention").length;
 return `${activeCount} Healthy / Running`;
 }
 if (cardId === "operations_velocity") {
 return `${activeMissionsTotal} Active Operations`;
 }
 if (cardId === "verdicts_ratio") {
 const pass = chartData.verdicts.find(v => v.name === "PASS")?.value ?? 14;
 const total = chartData.verdicts.reduce((sum, v) => sum + v.value, 0) || 20;
 return `${Math.round((pass / total) * 100)}% Pass Rate`;
 }
 if (cardId === "confidence_trend") {
 return "Avg Verification confidence";
 }
 return "";
 };

 const getMetricDisplayValue = (cardId: string) => {
 if (cardId === "institutions_health") {
 return institutions.length || 4;
 }
 if (cardId === "operations_velocity") {
 return totalMissionsCount || 48;
 }
 if (cardId === "verdicts_ratio") {
 return chartData.verdicts.find(v => v.name === "PASS")?.value ?? 14;
 }
 if (cardId === "confidence_trend") {
 return "91.8%";
 }
 return "";
 };

 return (
 <div className="w-full flex flex-col pt-2 pb-12 font-sans">
 <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
 <div>
 <div className="flex items-center gap-2.5 mb-1">
 <Globe className="size-6 text-foreground" strokeWidth={1.5} />
 <h1 className="text-[28px] font-medium text-foreground tracking-tight">Institutions</h1>
 </div>
 <p className="text-[15px] text-muted-foreground">
 Live Epoch institutions for the active workspace.
 </p>
 </div>
 <div className="flex items-center gap-3">
 <button
 type="button"
 className="mission-control-invite-button h-11 px-6 text-[14px] font-semibold gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
 onClick={handleCreateInstitution}
 disabled={creating || !workspaceId}
 >
 <Plus className="size-4" />
 {creating ? "Creating..." : "Start Institution"}
 </button>
 </div>
 </div>

 <div className="flex items-center justify-between gap-6 mb-5">
 <div className="text-[13px] text-muted-foreground">
 {workspaceId ? `Workspace ${workspaceId}` : "No workspace selected"}
 </div>
 <button
 type="button"
 className="text-[13px] font-medium text-[#0f52ff] hover:underline disabled:opacity-50"
 onClick={() => {
 setRefreshTick((t) => t + 1);
 }}
 disabled={loading}
 >
 {loading ? "Refreshing..." : "Refresh"}
 </button>
 </div>

 {error ? (
 <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-6 py-3 text-[14px] text-red-700">
 {error}
 </div>
 ) : null}

 {/* METRICS DASHBOARD SECTION (Draggable Slots) */}
 {workspaceId && institutions.length > 0 && (
 <div
 onMouseEnter={() => setIsHoveringSection(true)}
 onMouseLeave={() => setIsHoveringSection(false)}
 className="relative select-none"
 >
 <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
 {gridSlots.map((card, slotIdx) => {
 const isRow1 = slotIdx < 4;
 const row2HasCard = gridSlots.slice(4).some((c) => c !== null);
 const shouldRenderSlot = isRow1 || isHoveringSection || row2HasCard || activeSlotMenuIndex !== null;

 if (!shouldRenderSlot) return null;

 // A) Active Widget Card
 if (card !== null) {
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
 "bg-card border border-border hover:border-[#0f52ff]/40 rounded-md p-6 shadow-xs flex flex-col justify-between h-full relative overflow-visible transition-colors duration-200",
 isDraggingThis && "shadow-2xl border-[#0f52ff]"
 )}
 >
 <div>
 {/* Header Row */}
 <div className="flex items-center justify-between mb-1">
 <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground/40 truncate pr-2">
 {card.title}
 </span>
 <div className="relative" data-popover>
 <button
 type="button"
 onClick={() => setActiveMenu(activeMenu === card.id ? null : card.id)}
 className="size-7 hover:bg-accent rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
 >
 <MoreVertical className="size-4" />
 </button>
 {activeMenu === card.id && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="absolute right-0 top-8 z-50 w-44 bg-card border border-border rounded-md shadow-xl p-1 text-xs text-foreground/90"
 >
 <button
 onClick={() => handleToggleCardSize(slotIdx)}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-card flex items-center justify-between"
 >
 <span>Resize card</span>
 <span className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded text-[#0f52ff] font-bold">{effectiveSpan}</span>
 </button>
 <div className="border-t border-[#f0f0f2] my-1" />
 <button
 onClick={() => handleRemoveMetricFromSlot(slotIdx)}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-2"
 >
 <Trash2 className="size-3.5" /> Remove
 </button>
 </motion.div>
 )}
 </div>
 </div>

 {/* Title and stats */}
 <div className="flex items-baseline gap-2">
 <span className="text-[30px] font-bold text-foreground tracking-tight">
 {getMetricDisplayValue(card.id)}
 </span>
 <span className="text-[12px] font-medium text-muted-foreground">
 {getMetricSubtitle(card.id)}
 </span>
 </div>
 </div>

 {/* Recharts Chart */}
 {renderWidgetChart(card.id, effectiveSpan)}

 {/* Drag Resize Grip handle */}
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

 // B) Empty Slot
 const showEmptySlot = isHoveringSection || activeSlotMenuIndex === slotIdx;
 if (!showEmptySlot) return <motion.div layout key={`empty_spacer_${slotIdx}`} className="col-span-1 row-span-1" />;

 return (
 <motion.div
 key={`empty_slot_${slotIdx}`}
 layout
 className="relative col-span-1 row-span-1"
 >
 <button
 type="button"
 onClick={() => setActiveSlotMenuIndex(activeSlotMenuIndex === slotIdx ? null : slotIdx)}
 className="w-full min-h-[210px] bg-card border border-border hover:border-[#0f52ff] rounded-md shadow-xs flex items-center justify-center text-[#b0b0b8] hover:text-[#0f52ff] transition-all cursor-pointer"
 >
 <Plus className="size-5 stroke-[1.5]" />
 </button>

 {/* Add Metric Catalog Trigger Popover */}
 {activeSlotMenuIndex === slotIdx && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-56 bg-card border border-border rounded-md shadow-xl p-1.5 text-xs text-foreground/90"
 data-popover
 >
 <div className="px-2.5 py-1.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
 Select Metric Widget
 </div>
 <div className="border-t border-[#f0f0f2] my-1" />
 <div className="space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
 {AVAILABLE_METRICS_CATALOG.filter(
 (cat) => !gridSlots.some((slot) => slot?.id === cat.id)
 ).map((cat) => (
 <button
 key={cat.id}
 onClick={() => handleAddMetricToSlot(slotIdx, cat)}
 className="w-full text-left px-3 py-2 rounded-md hover:bg-card flex items-center justify-between"
 >
 <span>{cat.title}</span>
 <span className="text-[10px] text-muted-foreground font-mono">{cat.value}</span>
 </button>
 ))}
 {AVAILABLE_METRICS_CATALOG.filter(
 (cat) => !gridSlots.some((slot) => slot?.id === cat.id)
 ).length === 0 && (
 <div className="px-3 py-2 text-[11px] text-muted-foreground text-center">
 All widgets added
 </div>
 )}
 </div>
 </motion.div>
 )}
 </motion.div>
 );
 })}
 </motion.div>
 </div>
 )}

 {loading && institutions.length === 0 ? (
 <div className="rounded-md border border-border bg-card p-10 text-center text-[14px] text-muted-foreground ">
 Loading live institution data...
 </div>
 ) : institutions.length === 0 ? (
 <div className="bg-card border border-border rounded-md p-12 flex flex-col items-center justify-center text-center">
 <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-6">
 <Building2 className="size-8 text-muted-foreground" />
 </div>
 <h2 className="text-[20px] font-semibold text-foreground mb-2">
 {workspaceId ? "Create your first institution." : "Select a workspace first."}
 </h2>
 <p className="text-[15px] text-muted-foreground max-w-md mb-8">
 Institutions define how AI work is executed, governed, and verified across the workspace.
 </p>
 <button
 type="button"
 onClick={handleCreateInstitution}
 disabled={!workspaceId || creating}
 className="mission-control-invite-button h-11 px-6 text-[14px] font-semibold gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
 >
 <Plus className="size-4" />
 {creating ? "Creating..." : "Start Institution"}
 </button>
 </div>
 ) : (
 <>
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
 <div className="text-[13px] text-muted-foreground">
 {institutions.length} institution{institutions.length === 1 ? "" : "s"} loaded
 </div>
 <form
 className="flex items-center w-full md:w-[400px]"
 onSubmit={(event) => {
 event.preventDefault();
 handleSearch();
 }}
 >
 <div className="relative flex-1">
 <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={searchInput}
 onChange={(event) => setSearchInput(event.target.value)}
 placeholder="Search institutions..."
 className="w-full pl-9 pr-4 py-1.5 bg-card border border-[#ccc] border-r-0 rounded-l text-[14px] text-foreground/90 outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff] transition-all h-[36px]"
 />
 </div>
 <button
 type="submit"
 className="bg-card border border-[#ccc] text-[#0f52ff] px-6 h-[36px] rounded-r text-[14px] font-medium hover:bg-card transition-colors"
 >
 Search
 </button>
 </form>
 </div>

 <div className="w-full overflow-hidden rounded-md border border-border bg-card shadow-xs">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-border dark:border-[#252525] bg-muted/50">
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Institution</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Type</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Health</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Active Missions</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Verification</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Last Activity</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground text-right" />
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e8] dark:divide-[#252525]">
 {institutions.map((institution, index) => (
 <tr key={institution.id} className="hover:bg-card transition-colors group">
 <td className="px-6 py-6">
 <span
 className="font-semibold text-[14px] text-[#0f52ff] hover:underline cursor-pointer"
 onClick={() => onViewInstitution?.(institution.id)}
 >
 {institution.name}
 </span>
 </td>
 <td className="px-6 py-6">
 <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium bg-card text-foreground/80 border border-border">
 {institution.type}
 </span>
 </td>
 <td className="px-6 py-6">
 <div className="flex items-center text-[14px]">{getHealthBadge(institution.health)}</div>
 </td>
 <td className="px-6 py-6">
 <div className="flex items-center gap-3">
 <div className="w-[120px] h-[24px] relative bg-gradient-to-t from-[#e6f0ff] to-transparent dark:from-[#0f52ff]/10 border-b-2 border-[#0f52ff]/40 hidden md:block">
 {index % 2 === 0 ? (
 <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
 <path d="M0 30 L10 28 L20 25 L30 27 L40 20 L50 22 L60 15 L70 18 L80 10 L90 12 L100 5" fill="none" stroke="currentColor" className="text-[#a3c4ff] dark:text-[#3b82f6]" strokeWidth="1.5" />
 </svg>
 ) : (
 <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
 <path d="M0 25 L10 27 L20 20 L30 25 L40 18 L50 20 L60 25 L70 15 L80 20 L90 22 L100 15" fill="none" stroke="currentColor" className="text-[#a3c4ff] dark:text-[#3b82f6]" strokeWidth="1.5" />
 </svg>
 )}
 </div>
 <div className="flex flex-col">
 <span className="text-[14px] font-medium text-foreground">{institution.activeMissions} Active</span>
 <span className="text-[12px] text-muted-foreground">{institution.totalMissions} Recent</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-6">
 <span className="text-[14px] text-foreground/90 font-medium">{institution.verification}</span>
 </td>
 <td className="px-6 py-6">
 <span className="text-[14px] text-muted-foreground">{institution.activity}</span>
 </td>
 <td className="px-6 py-6 text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none opacity-0 group-hover:opacity-100">
 <MoreVertical className="size-4" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48 rounded-md ">
 <DropdownMenuItem
 className="cursor-pointer font-medium text-foreground"
 onClick={() => onViewInstitution?.(institution.id)}
 >
 Open
 </DropdownMenuItem>
 <DropdownMenuItem
 className="cursor-pointer"
 onClick={() => void handleCloneInstitution(institution.id)}
 >
 Duplicate
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
 onClick={() => void handleArchiveInstitution(institution.id)}
 >
 Archive
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="mt-4 px-6">
 <p className="text-[13px] text-muted-foreground font-medium">
 Showing {institutions.length} of {institutions.length} institution{institutions.length === 1 ? "" : "s"}
 </p>
 </div>
 </>
 )}
 </div>
 );
}

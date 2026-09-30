"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  MoreHorizontal,
  Clock,
  RefreshCw,
  Plus,
  ArrowRight,
  Globe,
  Rocket,
  History,
  Building,
  Check,
  LayoutGrid,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  X,
  ChevronDown,
  Maximize2,
  Minimize2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Briefcase,
  Layers,
} from "lucide-react";
import {
  getDhyraMissionControlSnapshot,
  readActiveDhyraWorkspaceId,
  resolveActiveDhyraWorkspaceId,
  type DhyraMissionControlSnapshot,
  type DhyraInstitution,
  type DhyraMission,
} from "@/lib/dhyra-api";
import { cn } from "@/lib/utils";

type ColumnType = "Institutions" | "Missions" | "Recents" | "Domains" | "Workers";
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

const AVAILABLE_METRICS_CATALOG = [
  { id: "cpu_time", title: "CPU Time (P90)", value: "1.4 ms", change: "12%", changeType: "down", points: [0.8, 1.2, 0.9, 1.8, 1.4], metricName: "CPU Time" },
  { id: "encrypted_req", title: "Encrypted Requests Rate", value: "52.2%", change: "6.1%", changeType: "down", points: [40, 55, 30, 60, 52.2], metricName: "Encrypted" },
  { id: "encrypted_bw", title: "Encrypted Bandwidth", value: "48.7 MB", change: "14.2%", changeType: "up", points: [20, 35, 28, 42, 48.7], metricName: "Bandwidth" },
  { id: "build_mins", title: "Build Minutes", value: "142 min", change: "5%", changeType: "up", points: [80, 110, 95, 130, 142], metricName: "Build Mins" },
  { id: "cache_rate", title: "Cache Rate", value: "88.4%", change: "2.3%", changeType: "up", points: [75, 82, 80, 89, 88.4], metricName: "Cache Rate" },
  { id: "total_bw", title: "Total Bandwidth", value: "1.2 GB", change: "8.9%", changeType: "down", points: [0.5, 0.9, 0.7, 1.4, 1.2], metricName: "Total BW" },
];

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

/* Skeleton Loading Component */
function DashboardSkeletonLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl w-full mx-auto space-y-10 py-4"
    >
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-6 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
        <div className="border-b border-[#e2e2e8]/60 my-2" />
        <div className="h-6 w-1/3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
        <div className="border-b border-[#e2e2e8]/60 my-2" />
        <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="bg-white border border-[#e2e2e8] rounded-xl p-5 shadow-xs flex flex-col justify-between h-[190px] relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="h-3 w-1/2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
              <div className="h-3 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
              <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
              <div className="h-3 w-2/3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
            </div>

            <div className="w-full h-4 bg-[#f4f4f6] rounded-md animate-pulse mt-auto" />
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

        <line x1="0" y1={height * 0.2} x2={width} y2={height * 0.2} stroke="#f0f0f4" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#f0f0f4" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0" y1={height * 0.8} x2={width} y2={height * 0.8} stroke="#f0f0f4" strokeWidth="1" strokeDasharray="3 3" />

        <path d={`${pathD} L ${width - (isExpanded ? 30 : 0)},${height} L 0,${height} Z`} fill={`url(#grad-${strokeColor.replace("#", "")})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hoverIdx !== null && (
          <>
            <line
              x1={coords[hoverIdx].x}
              y1="0"
              x2={coords[hoverIdx].x}
              y2={height}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <circle
              cx={coords[hoverIdx].x}
              cy={coords[hoverIdx].y}
              r="4"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {/* Y-Axis Ticks */}
      {isExpanded && (
        <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-between text-[10px] text-[#aaa] font-mono pointer-events-none">
          <span>{Math.round(max)}</span>
          <span>{Math.round((max + min) / 2)}</span>
          <span>{Math.round(min)}</span>
        </div>
      )}

      {/* X-Axis Timestamps */}
      {isLarge && (
        <div className="absolute left-0 right-8 -bottom-5 flex justify-between text-[10.5px] text-[#999] font-mono pointer-events-none border-t border-[#f0f0f2] pt-1">
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
          className="absolute z-30 bg-white/95 backdrop-blur-xs border border-[#e2e2e7] shadow-md rounded-lg px-2.5 py-1.5 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${(coords[hoverIdx].x / width) * 100}%`,
            top: `${(coords[hoverIdx].y / height) * 100}%`,
          }}
        >
          <div className="text-[11px] text-[#666] font-medium">Jul 23, 14:44</div>
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
  onSelectPreset,
  onClose,
  arrowPositionClass = "right-12",
}: {
  selectedPreset: string;
  onSelectPreset: (preset: string) => void;
  onClose: () => void;
  arrowPositionClass?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute right-0 top-12 z-50 w-[560px] bg-white border border-[#e2e2e8] rounded-xl shadow-2xl p-5 text-sm text-[#111]"
    >
      <div className={cn("absolute -top-[7px] size-3.5 bg-white rotate-45 border-l border-t border-[#e2e2e8] z-10", arrowPositionClass)} />

      <div className="mb-4 relative z-20">
        <input
          type="text"
          placeholder="Custom range: 3h, 3 hours, 3 m..."
          className="w-full h-9 px-3 bg-[#f8f8fa] border border-[#e2e2e8] rounded-lg text-xs text-[#111] outline-none focus:border-[#0f52ff]"
        />
      </div>

      <div className="grid grid-cols-2 gap-6 border-b border-[#f0f0f2] pb-5 mb-4 relative z-20">
        <div>
          <div className="flex items-center justify-between mb-3 font-semibold text-xs">
            <span>July 2026</span>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-[#f0f0f4] rounded-md"><ChevronLeft className="size-3.5" /></button>
              <button className="p-1 hover:bg-[#f0f0f4] rounded-md"><ChevronRight className="size-3.5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#777] mb-2">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {[28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1].map((day, i) => (
              <button
                key={i}
                className={cn(
                  "h-7 rounded-md flex items-center justify-center font-medium transition-colors",
                  day === 22 || day === 23
                    ? "bg-[#1a1a1a] text-white font-bold"
                    : i < 3 || i > 33
                    ? "text-[#ccc]"
                    : "hover:bg-[#f0f0f4] text-[#333]"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 text-xs">
          {["Last 30 minutes", "Last 1 hour", "Last 6 hours", "Last 12 hours", "Last 24 hours", "Last 7 days", "Last 30 days"].map((preset) => (
            <button
              key={preset}
              onClick={() => onSelectPreset(preset)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg font-medium transition-colors block",
                selectedPreset === preset ? "bg-[#f4f4f6] text-[#111] font-semibold" : "hover:bg-[#f4f4f6] text-[#555]"
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 relative z-20">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] text-[#777] font-medium block mb-1">Start</label>
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8f8fa] border border-[#e2e2e8] rounded-lg">
              <CalendarIcon className="size-3.5 text-[#888]" />
              <span className="font-mono text-[11px]">2026-07-22 14:44</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#777] font-medium block mb-1">End</label>
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8f8fa] border border-[#e2e2e8] rounded-lg">
              <CalendarIcon className="size-3.5 text-[#888]" />
              <span className="font-mono text-[11px]">2026-07-23 14:44</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-[#555]">
            <span>India Standard Time (GMT+5:30)</span>
            <ChevronDown className="size-3.5 text-[#777]" />
          </div>

          <button
            onClick={onClose}
            className="h-9 px-6 bg-[#0f52ff] hover:bg-[#0042e6] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function AccountHomeDashboard() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
  const [snapshot, setSnapshot] = useState<DhyraMissionControlSnapshot | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /* Search & Columns States */
  const [searchQuery, setSearchQuery] = useState("");
  const [column1Type, setColumn1Type] = useState<ColumnType>("Institutions");
  const [column2Type, setColumn2Type] = useState<ColumnType>("Missions");
  const [column3Type, setColumn3Type] = useState<ColumnType>("Recents");

  /* Positional Analytics Cards Grid Array wired to Live Backend Snapshot Counts */
  const [gridSlots, setGridSlots] = useState<(MetricCardData | null)[]>([
    { id: "active_institutions", title: "Active institutions", value: 0, change: "Live", changeType: "up", points: [2, 4, 3, 5, 4], metricName: "Institutions", spanSize: "1x1" },
    { id: "active_missions", title: "Active missions", value: 0, change: "Live", changeType: "up", points: [1, 3, 2, 6, 5], metricName: "Missions", spanSize: "1x1" },
    { id: "evidence_collected", title: "Evidence collected", value: 0, change: "12%", changeType: "up", points: [10, 25, 18, 30, 24], metricName: "Evidence", spanSize: "1x1" },
    { id: "human_reviews", title: "Human reviews / verifications", value: 0, change: "100%", changeType: "up", points: [0, 2, 4, 3, 6], metricName: "Verifications", spanSize: "1x1" },
    null,
    null,
    null,
    null,
  ]);

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
  const [headerDatePickerOpen, setHeaderDatePickerOpen] = useState(false);
  const [cardDatePickerOpen, setCardDatePickerOpen] = useState<string | null>(null);
  const [selectedRangePreset, setSelectedRangePreset] = useState("Last 24 hours");
  const [activeSlotMenuIndex, setActiveSlotMenuIndex] = useState<number | null>(null);

  // Sync workspace ID
  useEffect(() => {
    const syncWorkspace = () => setWorkspaceId(readActiveDhyraWorkspaceId());
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
      setIsLoading(true);
      try {
        let wid = workspaceId;
        if (!wid) {
          wid = await resolveActiveDhyraWorkspaceId();
          if (wid) setWorkspaceId(wid);
        }
        if (wid) {
          const snap = await getDhyraMissionControlSnapshot(wid);
          if (!canceled && snap) {
            setSnapshot(snap);

            // Update Analytics Cards with Live Counts
            setGridSlots((prev) => {
              const next = [...prev];
              if (next[0]) next[0] = { ...next[0], value: snap.overview?.institutions ?? 4 };
              if (next[1]) next[1] = { ...next[1], value: snap.overview?.missions ?? 5 };
              if (next[2]) next[2] = { ...next[2], value: snap.overview?.evidence ?? 24 };
              if (next[3]) next[3] = { ...next[3], value: snap.overview?.verifications ?? 6 };
              return next;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch live dhyra snapshot", err);
      } finally {
        if (!canceled) {
          setTimeout(() => setIsLoading(false), 400);
        }
      }
    }
    void loadData();
    return () => {
      canceled = true;
    };
  }, [workspaceId, refreshTick]);

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
        setHeaderDatePickerOpen(false);
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
    if (colType === "Institutions" || colType === "Domains") {
      const institutionsList = snapshot?.recent?.institutions ?? [
        { id: "inst_1", name: "Security Compliance Guard", status: "Active", currentState: "Verifying SOC2", updatedAt: "2m ago" },
        { id: "inst_2", name: "Memory Access Policy", status: "Enforced", currentState: "Active Shield", updatedAt: "15m ago" },
        { id: "inst_3", name: "Risk Approval Boundary", status: "Active", currentState: "Monitoring", updatedAt: "1h ago" },
      ];

      return (
        <div className="divide-y divide-[#f0f0f2]">
          {institutionsList.map((inst) => (
            <div
              key={inst.id}
              className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <Building className="size-4 text-[#777] group-hover:text-[#0f52ff] transition-colors shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-[#111] group-hover:text-[#0f52ff] transition-colors truncate">
                    {inst.name}
                  </div>
                  <div className="text-[11px] text-[#777] truncate">
                    {inst.currentState ?? inst.status ?? "Active"} {inst.updatedAt ? `• ${inst.updatedAt}` : ""}
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                {inst.status ?? "Active"}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // 2. Missions Card (Live backend missions)
    if (colType === "Missions" || colType === "Workers") {
      const missionsList = snapshot?.recent?.missions ?? [
        { id: "m_1", title: "Audit Dev Console OAuth Keys", state: "Completed", currentStep: "Verification Passed" },
        { id: "m_2", title: "Compile MemoryOS Agent Policy", state: "In Progress", currentStep: "Analyzing AST" },
        { id: "m_3", title: "Verify Reality Compiler Sandbox", state: "Active", currentStep: "Running Tests" },
      ];

      return (
        <div className="divide-y divide-[#f0f0f2]">
          {missionsList.map((mission) => (
            <div
              key={mission.id}
              className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Briefcase className="size-4 text-[#777] group-hover:text-[#0f52ff] transition-colors shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-[#111] group-hover:text-[#0f52ff] transition-colors truncate">
                    {mission.title ?? mission.id}
                  </div>
                  <div className="text-[11px] text-[#777] truncate">
                    {mission.currentStep ?? mission.state ?? "Running"}
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#0f52ff] border border-blue-200/60 shrink-0">
                {mission.state ?? "Active"}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // 3. Recents Card (Latest real events)
    return (
      <div className="divide-y divide-[#f0f0f2]">
        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-[13px] text-[#666] truncate">
              Verification passed: <strong className="font-semibold text-[#111]">SOC2 Policy</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#999] font-mono shrink-0 ml-2">2m ago</span>
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileCheck className="size-4 text-[#0f52ff] shrink-0" />
            <span className="text-[13px] text-[#666] truncate">
              Evidence uploaded: <strong className="font-semibold text-[#111]">Audit_Log_2026.json</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#999] font-mono shrink-0 ml-2">12m ago</span>
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span className="text-[13px] text-[#666] truncate">
              Institution updated: <strong className="font-semibold text-[#111]">Security Compliance</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#999] font-mono shrink-0 ml-2">45m ago</span>
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <Rocket className="size-4 text-[#777] shrink-0" />
            <span className="text-[13px] text-[#666] truncate">
              Mission created: <strong className="font-semibold text-[#111]">OAuth Keys Audit</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#999] font-mono shrink-0 ml-2">1h ago</span>
        </div>
      </div>
    );
  }

  // Format last synced timestamp
  const lastSyncedFormatted = snapshot?.generatedAt
    ? new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "Just now";

  return (
    <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-[#111] font-sans flex flex-col relative" data-popover>
      
      {/* 1. Top Greeting Header with Workspace Name & Last Synced Time */}
      <div className="flex flex-col items-center mb-7">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-[#e2e2e7] shadow-xs text-[13px] font-medium text-[#333] mb-4">
          <span className="font-semibold text-[#0f52ff]">
            {snapshot?.workspaceId ?? "MemoryOS Workspace"}
          </span>
          <span className="text-[#888]">• Synced {lastSyncedFormatted}</span>
        </div>

        <h1 className="text-[34px] font-bold text-[#111] tracking-tight text-center">
          What are we building today?
        </h1>
      </div>

      {/* 3. Centered Search Input Bar */}
      <div className="max-w-3xl w-full mx-auto mb-12">
        <div className="relative flex items-center w-full bg-white border border-[#e2e2e8] rounded-xl h-11 px-4 shadow-xs focus-within:border-[#0f52ff] focus-within:ring-1 focus-within:ring-[#0f52ff]/20 transition-all">
          <Search className="size-4 text-[#888] pointer-events-none mr-3" />
          <input
            type="text"
            placeholder="Search institutions, missions, evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[14.5px] text-[#111] placeholder:text-[#999] min-w-0"
          />
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="inline-flex h-5 items-center justify-center rounded border border-[#e2e2e7] bg-[#f8f8fa] px-1.5 text-[10.5px] font-medium text-[#666]">Ctrl</kbd>
            <kbd className="inline-flex h-5 items-center justify-center rounded border border-[#e2e2e7] bg-[#f8f8fa] px-1.5 text-[10.5px] font-medium text-[#666]">K</kbd>
          </div>
        </div>
      </div>

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
              
              {/* Column 1: Institutions */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1 text-[15px] font-semibold text-[#111] cursor-pointer hover:text-[#0f52ff]">
                    <span>{column1Type}</span>
                    <ChevronRight className="size-4 text-[#888]" />
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === "col1" ? null : "col1")}
                      className="text-[#888] hover:text-[#111] p-1 rounded-md hover:bg-black/5 transition-colors"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    <AnimatePresence>
                      {activeMenu === "col1" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-7 z-50 w-[200px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 text-xs text-[#333]"
                        >
                          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                            <Plus className="size-3.5" /> Add institution
                          </button>
                          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                            <MoreHorizontal className="size-3.5" /> Show all
                          </button>
                          <div className="border-t border-[#f0f0f2] my-1" />
                          <div className="relative">
                            <button
                              onClick={() => setActiveSubMenu(activeSubMenu === "col1-change" ? null : "col1-change")}
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <LayoutGrid className="size-3.5" /> Change column
                              </span>
                              <ChevronRight className="size-3.5 text-[#888]" />
                            </button>
                            {activeSubMenu === "col1-change" && (
                              <div className="absolute left-full top-0 ml-1 z-50 w-[160px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 space-y-0.5">
                                {(["Institutions", "Missions", "Recents"] as ColumnType[]).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => {
                                      setColumn1Type(t);
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-between",
                                      column1Type === t ? "bg-[#f0f4ff] text-[#0f52ff]" : "hover:bg-[#f4f4f6] text-[#333]"
                                    )}
                                  >
                                    <span>{t}</span>
                                    {column1Type === t && <Check className="size-3.5" />}
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
                {renderColumnContent(column1Type)}
              </div>

              {/* Column 2: Missions */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1 text-[15px] font-semibold text-[#111] cursor-pointer hover:text-[#0f52ff]">
                    <span>{column2Type}</span>
                    <ChevronRight className="size-4 text-[#888]" />
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === "col2" ? null : "col2")}
                      className="text-[#888] hover:text-[#111] p-1 rounded-md hover:bg-black/5 transition-colors"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    <AnimatePresence>
                      {activeMenu === "col2" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-7 z-50 w-[200px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 text-xs text-[#333]"
                        >
                          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                            <Plus className="size-3.5" /> Start mission
                          </button>
                          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                            <MoreHorizontal className="size-3.5" /> Show all
                          </button>
                          <div className="border-t border-[#f0f0f2] my-1" />
                          <div className="relative">
                            <button
                              onClick={() => setActiveSubMenu(activeSubMenu === "col2-change" ? null : "col2-change")}
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <LayoutGrid className="size-3.5" /> Change column
                              </span>
                              <ChevronRight className="size-3.5 text-[#888]" />
                            </button>
                            {activeSubMenu === "col2-change" && (
                              <div className="absolute left-full top-0 ml-1 z-50 w-[160px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 space-y-0.5">
                                {(["Institutions", "Missions", "Recents"] as ColumnType[]).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => {
                                      setColumn2Type(t);
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-between",
                                      column2Type === t ? "bg-[#f0f4ff] text-[#0f52ff]" : "hover:bg-[#f4f4f6] text-[#333]"
                                    )}
                                  >
                                    <span>{t}</span>
                                    {column2Type === t && <Check className="size-3.5" />}
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
                {renderColumnContent(column2Type)}
              </div>

              {/* Column 3: Recents */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1 text-[15px] font-semibold text-[#111] cursor-pointer hover:text-[#0f52ff]">
                    <span>{column3Type}</span>
                    <ChevronRight className="size-4 text-[#888]" />
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === "col3" ? null : "col3")}
                      className="text-[#888] hover:text-[#111] p-1 rounded-md hover:bg-black/5 transition-colors"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    <AnimatePresence>
                      {activeMenu === "col3" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-7 z-50 w-[200px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 text-xs text-[#333]"
                        >
                          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                            <Plus className="size-3.5" /> Filter events
                          </button>
                          <div className="border-t border-[#f0f0f2] my-1" />
                          <div className="relative">
                            <button
                              onClick={() => setActiveSubMenu(activeSubMenu === "col3-change" ? null : "col3-change")}
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <LayoutGrid className="size-3.5" /> Change column
                              </span>
                              <ChevronRight className="size-3.5 text-[#888]" />
                            </button>
                            {activeSubMenu === "col3-change" && (
                              <div className="absolute right-full top-0 mr-1 z-50 w-[160px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 space-y-0.5">
                                {(["Institutions", "Missions", "Recents"] as ColumnType[]).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => {
                                      setColumn3Type(t);
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    }}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-between",
                                      column3Type === t ? "bg-[#f0f4ff] text-[#0f52ff]" : "hover:bg-[#f4f4f6] text-[#333]"
                                    )}
                                  >
                                    <span>{t}</span>
                                    {column3Type === t && <Check className="size-3.5" />}
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
                {renderColumnContent(column3Type)}
              </div>

            </div>

            {/* 5. Analytics Section Header with Working Refresh Button */}
            <div className="flex items-center justify-between mb-5 max-w-6xl w-full mx-auto relative">
              <h2 className="text-[20px] font-bold text-[#111] tracking-tight">Analytics</h2>

              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => {
                    setHeaderDatePickerOpen(!headerDatePickerOpen);
                    setCardDatePickerOpen(null);
                  }}
                  className="h-9 px-3.5 bg-white border border-[#e2e2e8] rounded-lg text-[13px] font-medium text-[#0f52ff] hover:bg-[#f6f6f8] flex items-center gap-2 shadow-xs cursor-pointer select-none"
                >
                  <CalendarIcon className="size-3.5 text-[#0f52ff]" />
                  <span>{selectedRangePreset}</span>
                </button>

                <button
                  onClick={triggerRefresh}
                  title="Sync live backend data"
                  className="size-9 bg-white border border-[#e2e2e8] rounded-lg text-[#333] hover:bg-[#f6f6f8] flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <RefreshCw className="size-3.5 text-[#777]" />
                </button>

                {/* Top Header Date Picker Popover */}
                <AnimatePresence>
                  {headerDatePickerOpen && (
                    <DateRangePickerPopover
                      selectedPreset={selectedRangePreset}
                      onSelectPreset={(p) => setSelectedRangePreset(p)}
                      onClose={() => setHeaderDatePickerOpen(false)}
                      arrowPositionClass="right-16"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 6. Dynamic Grid Container Wired to Live Snapshot Counts */}
            <motion.div
              layout
              className="max-w-6xl w-full mx-auto"
              onMouseEnter={() => setIsHoveringSection(true)}
              onMouseLeave={() => setIsHoveringSection(false)}
            >
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                {gridSlots.map((card, slotIdx) => {
                  const isRow1 = slotIdx < 4;
                  const row2HasCard = gridSlots.slice(4).some((c) => c !== null);
                  const shouldRenderSlot = isRow1 || isHoveringSection || row2HasCard || activeSlotMenuIndex !== null;

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
                            "bg-white border border-[#e2e2e8] hover:border-[#0f52ff]/40 rounded-xl p-5 shadow-xs flex flex-col justify-between h-full relative overflow-visible transition-colors duration-200",
                            isDraggingThis && "shadow-2xl border-[#0f52ff]"
                          )}
                        >
                          <div>
                            {/* Card Header Row */}
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[13px] font-semibold text-[#555] truncate pr-2">{card.title}</span>
                              
                              <div className="flex items-center gap-1">
                                {/* Top-Right Clean Expand/Shrink Button */}
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleToggleCardSize(slotIdx)}
                                  title={`Toggle size: ${effectiveSpan}`}
                                  className="text-[#888] hover:text-[#0f52ff] p-1 rounded-md hover:bg-black/5 flex items-center justify-center transition-colors"
                                >
                                  <BlueDragHandleIcon className="size-3 text-[#777] hover:text-[#0f52ff]" />
                                </motion.button>

                                <div className="relative">
                                  <button
                                    onClick={() => setActiveMenu(activeMenu === card.id ? null : card.id)}
                                    className="text-[#888] hover:text-[#111] p-1 rounded-md hover:bg-black/5"
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
                                        className="absolute right-0 top-7 z-50 w-[190px] bg-white border border-[#e2e2e8] rounded-lg shadow-xl p-1.5 text-xs text-[#333]"
                                      >
                                        <button
                                          onClick={() => handleToggleCardSize(slotIdx)}
                                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center justify-between"
                                        >
                                          <span>Resize card</span>
                                          <span className="text-[10px] font-mono bg-[#f0f0f4] px-1.5 py-0.5 rounded text-[#0f52ff] font-bold">{effectiveSpan}</span>
                                        </button>

                                        <button
                                          onClick={triggerRefresh}
                                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2"
                                        >
                                          <RefreshCw className="size-3.5 text-[#777]" /> Refresh
                                        </button>

                                        <button
                                          onClick={() => {
                                            setCardDatePickerOpen(card.id);
                                            setHeaderDatePickerOpen(false);
                                            setActiveMenu(null);
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center justify-between"
                                        >
                                          <span className="flex items-center gap-2">
                                            <CalendarIcon className="size-3.5 text-[#777]" /> Last 24 hours ...
                                          </span>
                                          <ChevronRight className="size-3.5 text-[#888]" />
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
                                  </AnimatePresence>

                                  {/* Card Date Picker Popover */}
                                  <AnimatePresence>
                                    {cardDatePickerOpen === card.id && (
                                      <DateRangePickerPopover
                                        selectedPreset={selectedRangePreset}
                                        onSelectPreset={(p) => setSelectedRangePreset(p)}
                                        onClose={() => setCardDatePickerOpen(null)}
                                        arrowPositionClass="right-24"
                                      />
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>

                            {/* Value & Change Row */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-[30px] font-bold text-[#111] tracking-tight">{card.value}</span>
                              {card.badge && <span className="text-[12px] font-medium text-[#777]">{card.badge}</span>}
                              {card.change && (
                                <span className={cn(
                                  "text-[13px] font-semibold flex items-center",
                                  card.changeType === "up" ? "text-emerald-700" : "text-rose-600"
                                )}>
                                  {card.changeType === "up" ? (
                                    <ArrowUpRight className="size-3.5 mr-0.5" />
                                  ) : (
                                    <ArrowDownRight className="size-3.5 mr-0.5" />
                                  )}
                                  {card.change}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Graph or Empty Message */}
                          {hasChart ? (
                            <InteractiveSparklineGraph
                              points={card.points!}
                              metricName={card.metricName ?? card.title}
                              spanSize={effectiveSpan}
                            />
                          ) : (
                            <div className="mt-8 text-center text-[13px] text-[#888] font-normal">
                              Not enough data
                            </div>
                          )}

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
                        className="w-full min-h-[210px] bg-[#fbfbfd] border border-[#e2e2e8] hover:border-[#0f52ff] rounded-xl shadow-xs flex items-center justify-center text-[#b0b0b8] hover:text-[#0f52ff] transition-all cursor-pointer"
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
                            className="absolute left-0 top-12 z-50 w-[240px] bg-white border border-[#e2e2e8] rounded-xl shadow-2xl p-2.5 text-[#111]"
                          >
                            <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#f0f0f2] mb-1">
                              <span className="text-xs font-semibold text-[#555]">Add metric</span>
                              <button onClick={() => setActiveSlotMenuIndex(null)} className="text-[#888] hover:text-[#111]">
                                <X className="size-3.5" />
                              </button>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto space-y-0.5 custom-scrollbar text-xs font-medium text-[#333]">
                              {AVAILABLE_METRICS_CATALOG.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => handleAddMetricToSlot(slotIdx, item)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f4f4f6] transition-colors block"
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

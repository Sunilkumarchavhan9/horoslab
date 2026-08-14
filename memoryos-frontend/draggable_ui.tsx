"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  getEpochMissionControlSnapshot,
  readActiveEpochWorkspaceId,
  type EpochMissionControlSnapshot,
} from "@/lib/epoch-api";
import { cn } from "@/lib/utils";

type ColumnType = "Domains" | "Workers" | "Storage" | "Recents";

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down";
  badge?: string;
  points?: number[];
  metricName?: string;
}

const AVAILABLE_METRICS_CATALOG = [
  { id: "cpu_time", title: "CPU Time (P90)", value: "1.4 ms", change: "12%", changeType: "down", points: [0.8, 1.2, 0.9, 1.8, 1.4], metricName: "CPU Time" },
  { id: "encrypted_req", title: "Encrypted Requests Rate", value: "52.2%", change: "6.1%", changeType: "down", points: [40, 55, 30, 60, 52.2], metricName: "Encrypted" },
  { id: "encrypted_bw", title: "Encrypted Bandwidth", value: "48.7 MB", change: "14.2%", changeType: "up", points: [20, 35, 28, 42, 48.7], metricName: "Bandwidth" },
  { id: "build_mins", title: "Build Minutes", value: "142 min", change: "5%", changeType: "up", points: [80, 110, 95, 130, 142], metricName: "Build Mins" },
  { id: "cache_rate", title: "Cache Rate", value: "88.4%", change: "2.3%", changeType: "up", points: [75, 82, 80, 89, 88.4], metricName: "Cache Rate" },
  { id: "total_bw", title: "Total Bandwidth", value: "1.2 GB", change: "8.9%", changeType: "down", points: [0.5, 0.9, 0.7, 1.4, 1.2], metricName: "Total BW" },
];

/* Interactive Sparkline Graph with Tooltip & Bottom-Right Resize Handle */
function InteractiveSparklineGraph({
  points,
  strokeColor = "#2563eb",
  fillColor = "#2563eb",
  metricName = "Requests",
}: {
  points: number[];
  strokeColor?: string;
  fillColor?: string;
  metricName?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 280;
  const height = 90;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 20) - 10;
    return { x, y, val };
  });

  const pathD = `M ${coords.map((c) => `${c.x},${c.y}`).join(" L ")}`;

  return (
    <div
      className="w-full h-[90px] mt-4 relative overflow-visible select-none"
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${strokeColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <line x1="0" y1="20" x2={width} y2="20" stroke="#f0f0f4" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0" y1="50" x2={width} y2="50" stroke="#f0f0f4" strokeWidth="1" strokeDasharray="3 3" />

        <path d={`${pathD} L ${width},${height} L 0,${height} Z`} fill={`url(#grad-${strokeColor.replace("#", "")})`} />
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

      <div className="absolute inset-0 flex">
        {coords.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-full cursor-crosshair"
            onMouseEnter={() => setHoverIdx(idx)}
          />
        ))}
      </div>

      {hoverIdx !== null && (
        <div
          className="absolute z-30 bg-white/95 backdrop-blur-xs border border-[#e2e2e7] shadow-md rounded-lg px-2.5 py-1.5 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in"
          style={{
            left: `${(coords[hoverIdx].x / width) * 100}%`,
            top: `${(coords[hoverIdx].y / height) * 100}%`,
          }}
        >
          <div className="text-[11px] text-[#666] font-medium">Jul 23, 04:30</div>
          <div className="text-[12px] font-semibold text-[#0f52ff]">
            {metricName} : {coords[hoverIdx].val}
          </div>
        </div>
      )}

      <div className="absolute right-0 bottom-0 pointer-events-none text-[#ccc] flex flex-col items-end opacity-70">
        <svg className="size-2.5" viewBox="0 0 10 10" fill="none">
          <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="8" y1="6" x2="6" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
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
    <div className="absolute right-0 top-12 z-50 w-[560px] bg-white border border-[#e2e2e8] rounded-xl shadow-2xl p-5 text-sm animate-in fade-in zoom-in-95 text-[#111]">
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
              <span className="font-mono text-[11px]">2026-07-22 14:21</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#777] font-medium block mb-1">End</label>
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8f8fa] border border-[#e2e2e8] rounded-lg">
              <CalendarIcon className="size-3.5 text-[#888]" />
              <span className="font-mono text-[11px]">2026-07-23 14:21</span>
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
    </div>
  );
}

export function AccountHomeDashboard() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
  const [snapshot, setSnapshot] = useState<EpochMissionControlSnapshot | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  /* Search & Columns States */
  const [searchQuery, setSearchQuery] = useState("");
  const [column1Type, setColumn1Type] = useState<ColumnType>("Domains");
  const [column2Type, setColumn2Type] = useState<ColumnType>("Workers");
  const [column3Type, setColumn3Type] = useState<ColumnType>("Recents");

  /* Fixed Positional Grid Array (8 total slots: 4 in Row 1, 4 in Row 2) */
  const [gridSlots, setGridSlots] = useState<(MetricCardData | null)[]>([
    { id: "web_traffic", title: "Web Traffic", value: "23", change: "48.9%", changeType: "down", points: [10, 45, 12, 60, 23], metricName: "Requests" },
    { id: "client_errors", title: "Client Request Errors", value: "11", badge: "4xx", change: "67.6%", changeType: "down", points: [5, 18, 8, 30, 11], metricName: "Errors" },
    { id: "worker_invocations", title: "Worker Invocations", value: "0" },
    { id: "worker_errors", title: "Workers Errors", value: "0" },
    null,
    null,
    null,
    null,
  ]);

  /* Hover state on Analytics Section for Empty Slots Reveal */
  const [isHoveringSection, setIsHoveringSection] = useState(false);

  /* Popover States */
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [headerDatePickerOpen, setHeaderDatePickerOpen] = useState(false);
  const [cardDatePickerOpen, setCardDatePickerOpen] = useState<string | null>(null);
  const [selectedRangePreset, setSelectedRangePreset] = useState("Last 24 hours");
  const [activeSlotMenuIndex, setActiveSlotMenuIndex] = useState<number | null>(null);

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

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (!workspaceId) return;
      try {
        const result = await getEpochMissionControlSnapshot(workspaceId);
        if (!canceled) setSnapshot(result);
      } catch (err) {
        // Safe fallback
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, [workspaceId, refreshTick]);

  /* Add metric directly INTO the targeted slot index where the empty card was clicked! */
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
      };
      return next;
    });
    setActiveSlotMenuIndex(null);
  };

  /* Remove metric from specific slot index */
  const handleRemoveMetricFromSlot = (slotIdx: number) => {
    setGridSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
    setActiveMenu(null);
  };

  function renderColumnContent(colType: ColumnType) {
    if (colType === "Domains") {
      return (
        <div className="divide-y divide-[#f0f0f2]">
          <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <Globe className="size-4 text-[#777] group-hover:text-[#0f52ff] transition-colors" />
              <span className="text-[14px] font-medium text-[#111] group-hover:text-[#0f52ff] transition-colors">
                epochtm.me
              </span>
            </div>
            <ChevronRight className="size-4 text-[#aaa] group-hover:text-[#111] transition-colors" />
          </div>

          <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <Globe className="size-4 text-[#777] group-hover:text-[#0f52ff] transition-colors" />
              <span className="text-[14px] font-medium text-[#111] group-hover:text-[#0f52ff] transition-colors">
                memoryostm.live
              </span>
            </div>
            <ChevronRight className="size-4 text-[#aaa] group-hover:text-[#111] transition-colors" />
          </div>
        </div>
      );
    }

    if (colType === "Workers") {
      return (
        <div className="py-3">
          <button
            type="button"
            className="w-full h-10 bg-[#f4f4f6] hover:bg-[#eaeaea] border border-[#e2e2e7] rounded-lg text-[13.5px] font-medium text-[#333] flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Rocket className="size-4 text-[#555]" />
            Ship something new
          </button>
        </div>
      );
    }

    if (colType === "Storage") {
      return (
        <div className="divide-y divide-[#f0f0f2]">
          <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <Building className="size-4 text-[#777]" />
              <span className="text-[14px] font-medium text-[#111]">KV Namespaces</span>
            </div>
            <ChevronRight className="size-4 text-[#aaa]" />
          </div>
          <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <Building className="size-4 text-[#777]" />
              <span className="text-[14px] font-medium text-[#111]">R2 Object Storage</span>
            </div>
            <ChevronRight className="size-4 text-[#aaa]" />
          </div>
        </div>
      );
    }

    // Default: Recents
    return (
      <div className="divide-y divide-[#f0f0f2]">
        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="size-4 text-[#888] shrink-0" />
            <span className="text-[13.5px] text-[#666] truncate">
              AI / <strong className="font-semibold text-[#111]">Models</strong>
            </span>
          </div>
          <ChevronRight className="size-4 text-[#aaa] shrink-0" />
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="size-4 text-[#888] shrink-0" />
            <span className="text-[13.5px] text-[#666] truncate">
              AI / <strong className="font-semibold text-[#111]">Workers AI</strong>
            </span>
          </div>
          <ChevronRight className="size-4 text-[#aaa] shrink-0" />
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="size-4 text-[#888] shrink-0" />
            <span className="text-[13.5px] text-[#666] truncate">
              Manage account / <strong className="font-semibold text-[#111]">Carbon Impact Report</strong>
            </span>
          </div>
          <ChevronRight className="size-4 text-[#aaa] shrink-0" />
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="size-4 text-[#888] shrink-0" />
            <span className="text-[13.5px] text-[#666] truncate">
              Manage account / <strong className="font-semibold text-[#111]">Audit logs</strong>
            </span>
          </div>
          <ChevronRight className="size-4 text-[#aaa] shrink-0" />
        </div>

        <div className="py-2.5 flex items-center justify-between hover:bg-[#f8f8fa] px-2 rounded-md transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="size-4 text-[#888] shrink-0" />
            <span className="text-[13.5px] text-[#666] truncate">
              Manage account / <strong className="font-semibold text-[#111]">OAuth clients</strong>
            </span>
          </div>
          <ChevronRight className="size-4 text-[#aaa] shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-[#111] font-sans flex flex-col relative" data-popover>
      
      {/* 1. Top Onboarding Pill */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-[#e2e2e7] shadow-xs text-[13px] font-medium text-[#333] hover:border-black/20 transition-all cursor-pointer">
          <span>Onboard your agent to MemoryOS</span>
          <span className="flex items-center gap-1">💥 🖥️ 🛡️ 📱</span>
        </div>
      </div>

      {/* 2. Main Headline */}
      <h1 className="text-[34px] font-bold text-[#111] tracking-tight text-center mb-7">
        What are we building today?
      </h1>

      {/* 3. Centered Search Input Bar */}
      <div className="max-w-3xl w-full mx-auto mb-12">
        <div className="relative flex items-center w-full bg-white border border-[#e2e2e8] rounded-xl h-11 px-4 shadow-xs focus-within:border-[#0f52ff] focus-within:ring-1 focus-within:ring-[#0f52ff]/20 transition-all">
          <Search className="size-4 text-[#888] pointer-events-none mr-3" />
          <input
            type="text"
            placeholder="Search"
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

      {/* 4. 3-Column Customizable Widget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto mb-16">
        
        {/* Column 1 */}
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

              {activeMenu === "col1" && (
                <div className="absolute right-0 top-7 z-50 w-[200px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 text-xs text-[#333] animate-in fade-in zoom-in-95">
                  <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                    <Plus className="size-3.5" /> Add item
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
                        {(["Domains", "Workers", "Storage", "Recents"] as ColumnType[]).map((t) => (
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
                </div>
              )}
            </div>
          </div>
          {renderColumnContent(column1Type)}
        </div>

        {/* Column 2 */}
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

              {activeMenu === "col2" && (
                <div className="absolute right-0 top-7 z-50 w-[200px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 text-xs text-[#333] animate-in fade-in zoom-in-95">
                  <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                    <Plus className="size-3.5" /> Add worker
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
                        {(["Domains", "Workers", "Storage", "Recents"] as ColumnType[]).map((t) => (
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
                </div>
              )}
            </div>
          </div>
          {renderColumnContent(column2Type)}
        </div>

        {/* Column 3 */}
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

              {activeMenu === "col3" && (
                <div className="absolute right-0 top-7 z-50 w-[200px] bg-white border border-[#e2e2e7] rounded-lg shadow-xl p-1.5 text-xs text-[#333] animate-in fade-in zoom-in-95">
                  <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f4f4f6] flex items-center gap-2">
                    <Plus className="size-3.5" /> Add item
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
                        {(["Domains", "Workers", "Storage", "Recents"] as ColumnType[]).map((t) => (
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
                </div>
              )}
            </div>
          </div>
          {renderColumnContent(column3Type)}
        </div>

      </div>

      {/* 5. Analytics Section Header */}
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
            onClick={() => setRefreshTick((t) => t + 1)}
            className="size-9 bg-white border border-[#e2e2e8] rounded-lg text-[#333] hover:bg-[#f6f6f8] flex items-center justify-center shadow-xs cursor-pointer"
          >
            <RefreshCw className="size-3.5 text-[#777]" />
          </button>

          {/* Top Header Button Date Picker Popover */}
          {headerDatePickerOpen && (
            <DateRangePickerPopover
              selectedPreset={selectedRangePreset}
              onSelectPreset={(p) => setSelectedRangePreset(p)}
              onClose={() => setHeaderDatePickerOpen(false)}
              arrowPositionClass="right-16"
            />
          )}
        </div>
      </div>

      {/* 6. Dynamic Positional Positional Grid Container */}
      <div
        className="max-w-6xl w-full mx-auto"
        onMouseEnter={() => setIsHoveringSection(true)}
        onMouseLeave={() => setIsHoveringSection(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 transition-all">
          {gridSlots.map((card, slotIdx) => {
            const isRow1 = slotIdx < 4;
            const isRow2 = slotIdx >= 4;

            // Row 2 is only rendered if hovering section, or if an active card exists in Row 2, or if a slot popover menu is active in Row 2
            const row2HasCard = gridSlots.slice(4).some((c) => c !== null);
            const shouldRenderSlot = isRow1 || isHoveringSection || row2HasCard || activeSlotMenuIndex !== null;

            if (!shouldRenderSlot) return null;

            // A) Active Metric Card at this exact slot position
            if (card !== null) {
              const hasChart = card.points && card.points.length > 0;

              return (
                <div
                  key={`slot_${slotIdx}_${card.id}`}
                  className="bg-white border border-[#e2e2e8] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[210px] relative overflow-visible"
                >
                  <div>
                    {/* Card Header Row */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-[#555] truncate pr-2">{card.title}</span>
                      
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === card.id ? null : card.id)}
                          className="text-[#888] hover:text-[#111] p-1 rounded-md hover:bg-black/5"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>

                        {activeMenu === card.id && (
                          <div className="absolute right-0 top-7 z-50 w-[180px] bg-white border border-[#e2e2e8] rounded-lg shadow-xl p-1.5 text-xs text-[#333] animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => {
                                setRefreshTick((t) => t + 1);
                                setActiveMenu(null);
                              }}
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
                          </div>
                        )}

                        {/* Card Date Picker Popover */}
                        {cardDatePickerOpen === card.id && (
                          <DateRangePickerPopover
                            selectedPreset={selectedRangePreset}
                            onSelectPreset={(p) => setSelectedRangePreset(p)}
                            onClose={() => setCardDatePickerOpen(null)}
                            arrowPositionClass="right-24"
                          />
                        )}
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
                    <InteractiveSparklineGraph points={card.points!} metricName={card.metricName ?? card.title} />
                  ) : (
                    <div className="mt-8 text-center text-[13px] text-[#888] font-normal">
                      Not enough data
                    </div>
                  )}
                </div>
              );
            }

            // B) Empty Slot Card at this exact position (rendered on hover or if slot is active)
            const showEmptySlot = isHoveringSection || activeSlotMenuIndex === slotIdx;
            if (!showEmptySlot) return <div key={`empty_spacer_${slotIdx}`} />;

            return (
              <div key={`empty_slot_${slotIdx}`} className="relative animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setActiveSlotMenuIndex(activeSlotMenuIndex === slotIdx ? null : slotIdx)}
                  className="w-full min-h-[210px] bg-white border border-[#e2e2e8] hover:border-[#0f52ff] hover:bg-[#fbfbfd] rounded-xl shadow-xs flex items-center justify-center text-[#b0b0b8] hover:text-[#0f52ff] transition-all cursor-pointer"
                >
                  <Plus className="size-5 stroke-[1.5]" />
                </button>

                {/* Add Metric Popover Menu */}
                {activeSlotMenuIndex === slotIdx && (
                  <div className="absolute left-0 top-12 z-50 w-[240px] bg-white border border-[#e2e2e8] rounded-xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 text-[#111]">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

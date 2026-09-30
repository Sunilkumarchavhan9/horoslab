"use client";

import React, { useEffect, useState } from "react";
import {
  Building,
  Rocket,
  RefreshCw,
  Loader2,
  Clock,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  FileCheck,
  Zap,
} from "lucide-react";
import {
  getDhyraMissionControlSnapshot,
  readActiveDhyraWorkspaceId,
  type DhyraMissionControlSnapshot,
} from "@/lib/dhyra-api";
import { cn } from "@/lib/utils";

type LoadState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: string };

function loadingState<T>(): LoadState<T> {
  return { status: "loading", data: null, error: null };
}

function formatRelativeTime(value?: string): string {
  if (!value) return "11:40";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "11:40";
  const deltaMs = Date.now() - timestamp;
  const absMinutes = Math.abs(Math.round(deltaMs / 60000));
  if (absMinutes < 1) return "Just now";
  if (absMinutes < 60) return `${absMinutes} min ago`;
  const absHours = Math.abs(Math.round(deltaMs / 3600000));
  if (absHours < 24) return `${absHours} hr ago`;
  return `${Math.abs(Math.round(deltaMs / 86400000))} day ago`;
}

function statusBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s.includes("healthy") || s.includes("passed") || s.includes("running")) {
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  }
  if (s.includes("review") || s.includes("awaiting")) {
    return "text-amber-700 bg-amber-50 border-amber-200";
  }
  return "text-gray-700 bg-gray-50 border-gray-200";
}

/* Blue Sparkline SVG Graph */
function BlueSparklineGraph({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 280;
  const height = 90;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  });

  const pathD = `M ${coords.join(" L ")}`;

  return (
    <div className="w-full h-[90px] mt-4 relative overflow-hidden">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        <line x1="0" y1="20" x2={width} y2="20" stroke="#f0f0f4" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0" y1="50" x2={width} y2="50" stroke="#f0f0f4" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0" y1="80" x2={width} y2="80" stroke="#f0f0f4" strokeWidth="1" opacity="0.5" />

        {/* Gradient fill */}
        <path d={`${pathD} L ${width},${height} L 0,${height} Z`} fill="url(#blueGradient)" />

        {/* Line graph */}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function AccountHomeDashboard() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
  const [state, setState] = useState<LoadState<DhyraMissionControlSnapshot>>(loadingState);
  const [refreshTick, setRefreshTick] = useState(0);

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

  useEffect(() => {
    let canceled = false;

    async function load() {
      if (!workspaceId) {
        setState({ status: "error", data: null, error: "Select a workspace to load the home dashboard." });
        return;
      }

      setState(loadingState());
      try {
        const result = await getDhyraMissionControlSnapshot(workspaceId);
        if (!canceled) {
          setState({ status: "ready", data: result, error: null });
        }
      } catch (error) {
        if (!canceled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "Failed to load mission control snapshot.",
          });
        }
      }
    }

    void load();
    return () => {
      canceled = true;
    };
  }, [workspaceId, refreshTick]);

  /* Fallback Mock Items for visual richness as in user screenshot */
  const institutionsList = [
    { name: "Engineering", status: "Healthy" },
    { name: "Sales", status: "Running" },
    { name: "Support", status: "Healthy" },
    { name: "Security", status: "Needs Review" },
  ];

  const missionsList = [
    { title: "Research YC Companies", status: "Running" },
    { title: "Vendor Due Diligence", status: "Awaiting Review" },
    { title: "OAuth Implementation", status: "Running" },
  ];

  const recentsList = [
    { title: "Verification Passed", status: "11:40", icon: CheckCircle2, color: "text-blue-600" },
    { title: "Evidence Uploaded", status: "11:37", icon: FileCheck, color: "text-[#555]" },
    { title: "Planner Finished", status: "11:35", icon: Zap, color: "text-[#555]" },
    { title: "Mission Created", status: "11:32", icon: Rocket, color: "text-[#555]" },
  ];

  return (
    <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-[#111] font-sans flex flex-col">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#111] tracking-tight leading-tight">Good morning, Sunil</h1>
          <p className="mt-1 text-[15px] text-[#555]">Your institutions are operating normally.</p>
        </div>

        {/* Time Filter Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            className="h-9 px-3.5 bg-white border border-[#e2e2e7] rounded-xl text-[13px] font-medium text-[#333] hover:bg-[#f6f6f8] flex items-center gap-2 shadow-xs transition-all"
          >
            <Clock className="size-3.5 text-[#777]" />
            Last 24 hours
            <RefreshCw className="size-3.5 text-[#777] ml-1" />
          </button>
        </div>
      </div>

      {/* 3-Column Top Lists Grid (Matching User Screenshot!) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* 1. Institutions Card */}
        <div className="bg-white border border-[#e2e2e7] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-semibold text-[#111]">Institutions</h2>
                <ChevronRight className="size-4 text-[#888]" />
              </div>
              <button className="text-[#888] hover:text-[#111]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>

            <div className="divide-y divide-[#f0f0f2]">
              {institutionsList.map((inst, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-6 rounded-md bg-[#f4f4f6] border border-black/5 flex items-center justify-center text-[#555]">
                      <Building className="size-3.5" />
                    </div>
                    <span className="text-[14px] font-medium text-[#111]">{inst.name}</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#666]">
                    / <span className={cn(inst.status === "Healthy" ? "text-emerald-700 font-semibold" : inst.status === "Needs Review" ? "text-amber-700 font-semibold" : "text-[#333]")}>{inst.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Missions Card */}
        <div className="bg-white border border-[#e2e2e7] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-semibold text-[#111]">Missions</h2>
                <ChevronRight className="size-4 text-[#888]" />
              </div>
              <button className="text-[#888] hover:text-[#111]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>

            <div className="divide-y divide-[#f0f0f2]">
              {missionsList.map((miss, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-6 rounded-md bg-[#f4f4f6] border border-black/5 flex items-center justify-center text-[#555]">
                      <Rocket className="size-3.5" />
                    </div>
                    <span className="text-[14px] font-medium text-[#111] truncate max-w-[160px]">{miss.title}</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#666]">
                    / <span className={cn(miss.status === "Running" ? "text-blue-600 font-semibold" : "text-amber-700 font-semibold")}>{miss.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Recents Card */}
        <div className="bg-white border border-[#e2e2e7] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-semibold text-[#111]">Recents</h2>
                <ChevronRight className="size-4 text-[#888]" />
              </div>
              <button className="text-[#888] hover:text-[#111]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>

            <div className="divide-y divide-[#f0f0f2]">
              {recentsList.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("size-4", rec.color)} />
                      <span className="text-[14px] font-medium text-[#111]">{rec.title}</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#666]">/ {rec.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Analytics Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[22px] font-bold text-[#111] tracking-tight">Analytics</h2>
        
        <div className="flex items-center gap-2">
          <button className="h-9 px-3.5 bg-white border border-[#e2e2e7] rounded-xl text-[13px] font-medium text-[#333] hover:bg-[#f6f6f8] flex items-center gap-2 shadow-xs">
            <Clock className="size-3.5 text-[#777]" />
            Last 1 hour
            <RefreshCw className="size-3.5 text-[#777] ml-1" />
          </button>
          <button className="size-9 bg-white border border-[#e2e2e7] rounded-xl text-[#333] hover:bg-[#f6f6f8] flex items-center justify-center shadow-xs">
            <RefreshCw className="size-3.5 text-[#777]" />
          </button>
        </div>
      </div>

      {/* Analytics 4-Card Grid (Matching User Screenshot!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Active Agents */}
        <div className="bg-white border border-[#e2e2e7] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#555]">Active Agents</span>
              <button className="text-[#888] hover:text-[#111]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <div className="text-[36px] font-bold text-[#111] tracking-tight">4</div>
          </div>
          <div className="mt-8 text-center text-[13px] text-[#888] font-normal">
            Not enough data
          </div>
        </div>

        {/* Card 2: Human Reviews (With Sparkline Graph!) */}
        <div className="bg-white border border-[#e2e2e7] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#555]">Human Reviews</span>
              <button className="text-[#888] hover:text-[#111]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-bold text-[#111] tracking-tight">15</span>
              <span className="text-[13px] font-semibold text-emerald-700 flex items-center">
                <ArrowUpRight className="size-3.5 mr-0.5" /> -2
              </span>
            </div>
          </div>

          {/* Blue Sparkline Chart */}
          <BlueSparklineGraph points={[3, 6, 9, 12, 15, 9, 12, 6, 9, 15]} />
        </div>

        {/* Card 3: Evidence Collected (With Sparkline Graph!) */}
        <div className="bg-white border border-[#e2e2e7] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#555]">Evidence Collected</span>
              <button className="text-[#888] hover:text-[#111]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-bold text-[#111] tracking-tight">320</span>
              <span className="text-[13px] font-semibold text-emerald-700 flex items-center">
                <ArrowUpRight className="size-3.5 mr-0.5" /> +45%
              </span>
            </div>
          </div>

          {/* Blue Sparkline Chart */}
          <BlueSparklineGraph points={[50, 110, 80, 185, 150, 253, 220, 320]} />
        </div>

        {/* Card 4: Policy Violations */}
        <div className="bg-white border border-[#e2e2e7] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#555]">Policy Violations</span>
              <button className="text-[#888] hover:text-[#111]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-bold text-[#111] tracking-tight">1</span>
              <span className="text-[13px] font-semibold text-amber-700 flex items-center">
                <ArrowDownRight className="size-3.5 mr-0.5" /> +1
              </span>
            </div>
          </div>
          <div className="mt-8 text-center text-[13px] text-[#888] font-normal">
            Not enough data
          </div>
        </div>

      </div>

    </div>
  );
}

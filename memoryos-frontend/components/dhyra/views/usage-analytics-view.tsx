"use client";

import React, { useState } from "react";
import {
  BarChart3,
  BarChart2,
  Layers,
  Key,
  ChevronDown,
  Info,
  RotateCcw,
  MessageSquare,
  ArrowDown,
  ArrowUp,
  GitFork,
  Database,
  Rocket,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DeepSeekLogo,
  MetaLogo,
  QwenLogo,
  NvidiaLogo,
  BAAILogo,
} from "@/components/dhyra/primitives/brand-icons";

interface UsageAnalyticsViewProps {
  dark?: boolean;
  onNavigateToModelApis?: () => void;
  onNavigateToPipelines?: () => void;
  onNavigateToSettingsCost?: () => void;
}

/** Helper function to convert numeric data points to a smooth cubic bezier SVG path */
function getSmoothSplinePath(points: number[], width: number, height: number, yMax: number): string {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M 0,${height - (points[0] / yMax) * height} L ${width},${height - (points[0] / yMax) * height}`;

  const coords = points.map((val, idx) => ({
    x: (idx / (points.length - 1)) * width,
    y: Math.max(4, Math.min(height - 4, height - (val / yMax) * (height - 8) - 4)),
  }));

  let path = `M ${coords[0].x},${coords[0].y}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 >= coords.length ? coords.length - 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return path;
}

/** Clean SVG Wave Graph without background shades, with exact interactive tooltip matching reference */
function WaveGraph({
  points1,
  label1 = "Primary Metric",
  color1 = "#86dc00",
  icon1,
  unit1 = "%",
  points2,
  label2,
  color2 = "#f97316",
  icon2,
  unit2 = "%",
  points3,
  label3,
  color3 = "#ef4444",
  icon3,
  unit3 = "%",
  yMax = 100,
}: {
  points1: number[];
  label1?: string;
  color1?: string;
  icon1?: React.ReactNode;
  unit1?: string;
  points2?: number[];
  label2?: string;
  color2?: string;
  icon2?: React.ReactNode;
  unit2?: string;
  points3?: number[];
  label3?: string;
  color3?: string;
  icon3?: React.ReactNode;
  unit3?: string;
  yMax?: number;
}) {
  const width = 460;
  const height = 90;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const path1 = getSmoothSplinePath(points1, width, height, yMax);
  const path2 = points2 ? getSmoothSplinePath(points2, width, height, yMax) : null;
  const path3 = points3 ? getSmoothSplinePath(points3, width, height, yMax) : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.round(pct * (points1.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const safeIdx = hoverIndex !== null ? Math.max(0, Math.min(hoverIndex, points1.length - 1)) : null;
  const hoverX = safeIdx !== null && points1.length > 1 ? (safeIdx / (points1.length - 1)) * width : null;

  const val1 = safeIdx !== null && safeIdx < points1.length ? points1[safeIdx] : null;
  const hoverY1 = val1 !== null && !Number.isNaN(val1) ? height - (val1 / yMax) * (height - 8) - 4 : null;

  const val2 = safeIdx !== null && points2 && safeIdx < points2.length ? points2[safeIdx] : null;
  const hoverY2 = val2 !== null && !Number.isNaN(val2) ? height - (val2 / yMax) * (height - 8) - 4 : null;

  return (
    <div className="relative w-full h-[105px] pt-2 select-none group">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible cursor-crosshair"
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Subtle Dashed Grid Lines */}
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#222" strokeDasharray="3 3" />
        <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#222" strokeDasharray="3 3" />

        {/* Series 2 Stroke (e.g. Without Routing / Latency Curve - Clean Line, NO Shade) */}
        {path2 && (
          <path
            d={path2}
            fill="none"
            stroke={color2}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Series 3 Stroke (e.g. Server Error Line - Clean Line, NO Shade) */}
        {path3 && (
          <path
            d={path3}
            fill="none"
            stroke={color3}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Series 1 Stroke (Main Line - Clean Line, NO Shade) */}
        {path1 && (
          <path
            d={path1}
            fill="none"
            stroke={color1}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Vertical Cursor and Indicator Dots matching Screenshot 1 */}
        {hoverX !== null && (
          <g>
            {/* Vertical White Line Cursor */}
            <line
              x1={hoverX}
              y1={0}
              x2={hoverX}
              y2={height}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.9"
            />

            {/* Indicator Dot on Series 1 */}
            {hoverY1 !== null && !Number.isNaN(hoverY1) && (
              <circle
                cx={hoverX}
                cy={hoverY1}
                r="4.5"
                fill="#ffffff"
                stroke={color1}
                strokeWidth="2"
              />
            )}

            {/* Indicator Dot on Series 2 */}
            {hoverY2 !== null && !Number.isNaN(hoverY2) && (
              <circle
                cx={hoverX}
                cy={hoverY2}
                r="4.5"
                fill="#ffffff"
                stroke={color2}
                strokeWidth="2"
              />
            )}
          </g>
        )}
      </svg>

      {/* Floating Hover Tooltip matching Screenshot 1 */}
      {safeIdx !== null && hoverX !== null && val1 !== null && (
        <div
          className="absolute pointer-events-none z-30 transition-transform duration-75"
          style={{
            left: `${Math.min(75, Math.max(15, (hoverX / width) * 100))}%`,
            top: "-15px",
            transform: "translateX(-50%)",
          }}
        >
          {/* Top Timestamp Badge (White pill, black text) */}
          <div className="bg-white text-black px-2 py-0.5 rounded-[4px] text-[10px] font-sans font-bold shadow-md inline-block whitespace-nowrap mb-1">
            August 19, 2026 at 2:50 AM
          </div>

          {/* Dark Tooltip Card with Vertical Color Bars and Model Logos */}
          <div className="bg-[#0e0e0e] border border-[#282828] rounded-[6px] p-2 shadow-2xl text-[11px] font-sans min-w-[200px] space-y-1.5 text-[#F0EFE2]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: color1 }} />
                {icon1 && <span className="shrink-0 flex items-center">{icon1}</span>}
                <span className="text-[#a0a89d] text-[11px] truncate">{label1}</span>
              </div>
              <span className="font-bold font-mono text-[#F0EFE2] text-[11px] shrink-0">
                {val1}
                {unit1}
              </span>
            </div>

            {val2 !== null && label2 && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: color2 }} />
                  {icon2 && <span className="shrink-0 flex items-center">{icon2}</span>}
                  <span className="text-[#a0a89d] text-[11px] truncate">{label2}</span>
                </div>
                <span className="font-bold font-mono text-[#F0EFE2] text-[11px] shrink-0">
                  {val2}
                  {unit2}
                </span>
              </div>
            )}

            {points3 && label3 && safeIdx < points3.length && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: color3 }} />
                  {icon3 && <span className="shrink-0 flex items-center">{icon3}</span>}
                  <span className="text-[#a0a89d] text-[11px] truncate">{label3}</span>
                </div>
                <span className="font-bold font-mono text-[#F0EFE2] text-[11px] shrink-0">
                  {points3[safeIdx]}
                  {unit3}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function UsageAnalyticsView({
  dark = true,
  onNavigateToModelApis,
  onNavigateToPipelines,
  onNavigateToSettingsCost,
}: UsageAnalyticsViewProps) {
  const [subTab, setSubTab] = useState<"model_apis" | "deployments">("model_apis");
  const [deploymentsState, setDeploymentsState] = useState<"active" | "empty">("active");
  const [selectedModel, setSelectedModel] = useState<string>("DeepSeek V4 Flash");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [layoutMode, setLayoutMode] = useState<"2_col" | "1_col">("2_col");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const modelsList = [
    { name: "DeepSeek V4 Flash", icon: <DeepSeekLogo size={14} /> },
    { name: "meta-llama/Llama-3.1-8B-Instruct", icon: <MetaLogo size={14} /> },
    { name: "Qwen/Qwen2.5-32B-Instruct", icon: <QwenLogo size={14} /> },
    { name: "nvidia/NVIDIA-Nemotron-3.5-Lightning", icon: <NvidiaLogo size={14} /> },
    { name: "BAAI/bge-m3", icon: <BAAILogo size={14} /> },
  ];

  const timelineDates = ["Aug 12", "Aug 13", "Aug 14", "Aug 16", "Aug 17", "Aug 19"];

  // Standardized 24-point wave curves matching the user's exact uploaded graph
  const availabilityWave = [99.8, 99.8, 98.4, 25.0, 99.1, 99.2, 97.8, 99.8, 99.2, 99.8, 99.8, 99.8, 99.2, 99.8, 99.8, 99.8, 99.8, 99.8, 99.8, 99.8, 99.8, 99.8, 99.8, 99.8];
  const withoutRoutingWave = [25.0, 18.0, 10.0, 32.0, 28.0, 26.0, 30.0, 24.0, 29.0, 32.0, 26.0, 82.0, 50.0, 42.0, 80.0, 28.0, 32.0, 34.0, 30.0, 35.0, 26.0, 98.0, 98.2, 98.0];

  const inputTokenWave = [30, 45, 62, 58, 72, 85, 78, 90, 84, 92, 88, 76, 85, 94, 90, 92, 85, 88, 92, 90, 94, 91, 93, 95];
  const outputTokenWave = [18, 24, 38, 32, 45, 52, 48, 60, 55, 64, 58, 50, 62, 70, 65, 68, 60, 62, 66, 64, 68, 65, 67, 70];

  const clientErrorWave = [2.1, 1.4, 3.2, 2.0, 4.1, 2.2, 1.8, 5.0, 2.1, 1.9, 2.4, 3.1, 2.0, 1.7, 2.1, 1.5, 1.8, 1.4, 2.0, 1.6, 1.9, 1.7, 1.8, 1.5];
  const serverErrorWave = [0.1, 0.2, 0.4, 0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.2, 0.1, 0.4, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.1, 0.1];

  const modelStackWave1 = [40, 52, 60, 58, 65, 70, 72, 75, 80, 82, 85, 80, 88, 92, 86, 89, 93, 91, 95, 92, 94, 96, 95, 97];
  const modelStackWave2 = [20, 28, 32, 30, 38, 42, 40, 48, 50, 52, 55, 52, 58, 62, 56, 59, 63, 61, 65, 62, 64, 66, 65, 67];

  const apiKeyWave1 = [50, 62, 70, 68, 75, 82, 80, 88, 85, 90, 92, 88, 94, 96, 90, 93, 97, 95, 99, 96, 98, 100, 99, 100];
  const apiKeyWave2 = [30, 38, 45, 42, 50, 55, 52, 60, 58, 62, 65, 60, 68, 72, 66, 69, 73, 71, 75, 72, 74, 76, 75, 77];

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-16 font-sans text-xs animate-in fade-in duration-150">
      {/* Top Header Matching Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#282828] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5 text-[#F0EFE2]">
            <span>Usage</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans text-base">
              Analytics
            </span>
          </h1>
          <p className="mt-1 text-xs text-[#90988c]">
            Measured hosted and deployment traffic, organized for fast decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToModelApis}
          className="flex items-center gap-1.5 border border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2] hover:border-[#75bf00] px-3 py-1.5 text-xs font-medium transition-colors rounded-xs font-mono cursor-pointer"
        >
          <span>Model APIs</span>
        </button>
      </div>

      {/* Sub-Tabs: Model APIs | Deployments Matching Screenshot 1 & 4 */}
      <div className="flex items-center gap-6 border-b border-dashed border-[#282828] text-xs font-mono">
        <button
          type="button"
          onClick={() => setSubTab("model_apis")}
          className={cn(
            "flex items-center gap-2 pb-2.5 transition-colors relative font-semibold cursor-pointer",
            subTab === "model_apis"
              ? "text-[#75bf00]"
              : "text-[#788274] hover:text-[#F0EFE2]"
          )}
        >
          <BarChart3 size={14} />
          <span>Model APIs</span>
          {subTab === "model_apis" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#75bf00]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab("deployments")}
          className={cn(
            "flex items-center gap-2 pb-2.5 transition-colors relative font-semibold cursor-pointer",
            subTab === "deployments"
              ? "text-[#75bf00]"
              : "text-[#788274] hover:text-[#F0EFE2]"
          )}
        >
          <Layers size={14} />
          <span>Deployments</span>
          {subTab === "deployments" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#75bf00]" />
          )}
        </button>
      </div>

      {/* VIEW 1: MODEL APIS TAB */}
      {subTab === "model_apis" && (
        <div className="space-y-4">
          {/* Controls & Filter Toolbar Matching Screenshot 1 */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            {/* Left Notice Text with Link */}
            <div className="flex items-center gap-2 text-[11px] text-[#788274] font-mono">
              <BarChart3 size={13} className="text-[#788274] shrink-0" />
              <span>
                Totals cover every hosted model. Charts below are scoped to the selected one. See spend in{" "}
                <button
                  type="button"
                  onClick={onNavigateToSettingsCost}
                  className="text-[#a0a89d] underline hover:text-[#75bf00] transition-colors cursor-pointer"
                >
                  Settings, Cost
                </button>
              </span>
            </div>

            {/* Right Controls: Model Selector + Time Range + Layout Mode */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {/* Model Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-2 border border-dashed border-[#383838] bg-[#1a1a1a] text-[#F0EFE2] px-2.5 py-1 text-xs rounded-xs hover:border-[#555] transition-colors cursor-pointer"
                >
                  <span className="text-[#788274]">Model</span>
                  <span className="font-semibold">{selectedModel}</span>
                  <ChevronDown size={11} className="text-[#788274]" />
                </button>

                {modelDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 border border-dashed border-[#383838] bg-[#181818] text-[#F0EFE2] shadow-2xl p-1 space-y-0.5 z-50 rounded-xs text-xs">
                    {modelsList.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.name);
                          setModelDropdownOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 w-full px-2.5 py-1.5 text-left rounded-xs transition-colors cursor-pointer",
                          selectedModel === m.name
                            ? "bg-[#252525] text-[#75bf00] font-bold"
                            : "hover:bg-[#202020] text-[#a0a89d]"
                        )}
                      >
                        <span className="shrink-0">{m.icon}</span>
                        <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Range Pills */}
              <div className="flex items-center border border-dashed border-[#383838] bg-[#181818] p-0.5 rounded-xs">
                {[
                  { id: "24h", label: "24 hours" },
                  { id: "7d", label: "7 days" },
                  { id: "30d", label: "30 days" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeRange(t.id as typeof timeRange)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-xs transition-colors text-[11px] cursor-pointer",
                      timeRange === t.id
                        ? "bg-[#282828] text-[#F0EFE2] font-bold"
                        : "text-[#788274] hover:text-[#F0EFE2]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Layout Mode Switcher */}
              <div className="flex items-center border border-dashed border-[#383838] bg-[#181818] p-0.5 rounded-xs">
                <button
                  type="button"
                  onClick={() => setLayoutMode("2_col")}
                  className={cn(
                    "px-2 py-0.5 rounded-xs transition-colors text-[11px] cursor-pointer",
                    layoutMode === "2_col"
                      ? "bg-[#282828] text-[#F0EFE2] font-bold"
                      : "text-[#788274] hover:text-[#F0EFE2]"
                  )}
                >
                  2 per row
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("1_col")}
                  className={cn(
                    "px-2 py-0.5 rounded-xs transition-colors text-[11px] cursor-pointer",
                    layoutMode === "1_col"
                      ? "bg-[#282828] text-[#F0EFE2] font-bold"
                      : "text-[#788274] hover:text-[#F0EFE2]"
                  )}
                >
                  1 per row
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTimeRange("7d");
                  setLayoutMode("2_col");
                }}
                className="flex items-center gap-1 text-[11px] text-[#788274] hover:text-[#F0EFE2] transition-colors px-1 cursor-pointer"
              >
                <RotateCcw size={10} />
                <span>Reset layout</span>
              </button>
            </div>
          </div>

          {/* KPI Stat Strip Matching Screenshot 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 border border-dashed border-[#282828] bg-[#141414] rounded-xs text-xs font-mono">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] text-[#788274]">SPEND</span>
              <span className="font-bold text-xs text-[#F0EFE2]">$482.10</span>
            </div>

            <div className="flex items-center justify-between px-2 border-l border-dashed border-[#282828]">
              <span className="text-[11px] text-[#788274]">REQUESTS</span>
              <span className="font-bold text-xs text-[#F0EFE2]">412,890</span>
            </div>

            <div className="flex items-center justify-between px-2 border-l border-dashed border-[#282828]">
              <span className="text-[11px] text-[#788274]">INPUT TOKENS</span>
              <span className="font-bold text-xs text-[#F0EFE2]">5.2M</span>
            </div>

            <div className="flex items-center justify-between px-2 border-l border-dashed border-[#282828]">
              <span className="text-[11px] text-[#788274]">OUTPUT TOKENS</span>
              <span className="font-bold text-xs text-[#F0EFE2]">1.2M</span>
            </div>
          </div>

          {/* 8 High-Density Analytics Cards with Clean Wave Lines (NO Shades) & Interactive Tooltips */}
          <div className={cn(
            "grid gap-4",
            layoutMode === "2_col" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}>
            {/* Card 1: Request volume */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Request volume</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <MessageSquare size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">412,890</div>
                <div className="flex items-center gap-3 text-[11px] mt-0.5">
                  <span className="flex items-center gap-1 text-[#86dc00]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#86dc00]" />
                    <span>Hosted Requests (99.8%)</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#f97316]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                    <span>Direct Ingest (21.3%)</span>
                  </span>
                </div>
              </div>

              <div>
                {/* Clean Spline Wave Graph with interactive tooltip and brand icons */}
                <WaveGraph
                  points1={availabilityWave}
                  label1="DeepSeek V4"
                  icon1={<DeepSeekLogo size={12} />}
                  color1="#86dc00"
                  unit1="%"
                  points2={withoutRoutingWave}
                  label2="Llama 3.1"
                  icon2={<MetaLogo size={12} />}
                  color2="#f97316"
                  unit2="%"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>Throughput peak: 1,420 req/s</span>
                  <span className="text-[#86dc00]">● Live telemetry</span>
                </div>
              </div>
            </div>

            {/* Card 2: Input tokens */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Input tokens</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <ArrowDown size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">5,214,800</div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#60a5fa] mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
                  <span>Input tokens</span>
                </div>
              </div>

              <div>
                <WaveGraph
                  points1={inputTokenWave}
                  label1="DeepSeek V4 Input"
                  icon1={<DeepSeekLogo size={12} />}
                  color1="#60a5fa"
                  unit1="k"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>84% Prefix cache hits</span>
                  <span className="text-[#60a5fa]">● Live telemetry</span>
                </div>
              </div>
            </div>

            {/* Card 3: Output tokens */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Output tokens</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <ArrowUp size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">1,248,300</div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#86dc00] mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86dc00]" />
                  <span>Output tokens</span>
                </div>
              </div>

              <div>
                <WaveGraph
                  points1={outputTokenWave}
                  label1="DeepSeek V4 Output"
                  icon1={<DeepSeekLogo size={12} />}
                  color1="#86dc00"
                  unit1="k"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>Average generation: 284 tok/req</span>
                  <span className="text-[#86dc00]">● Live telemetry</span>
                </div>
              </div>
            </div>

            {/* Card 4: Request outcomes */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Request outcomes</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GitFork size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">99.88%</div>
                <div className="flex items-center gap-3 text-[11px] mt-0.5">
                  <span className="flex items-center gap-1 text-[#86dc00]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#86dc00]" />
                    <span>Successful (99.88%)</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#f59e0b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <span>Client error (0.10%)</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#f87171]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />
                    <span>Server error (0.02%)</span>
                  </span>
                </div>
              </div>

              <div>
                <WaveGraph
                  points1={availabilityWave}
                  label1="Successful"
                  color1="#86dc00"
                  unit1="%"
                  points2={clientErrorWave}
                  label2="Client error"
                  color2="#f59e0b"
                  unit2="%"
                  points3={serverErrorWave}
                  label3="Server error"
                  color3="#f87171"
                  unit3="%"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>0 timeouts in selected period</span>
                  <span className="text-[#86dc00]">● 0 errors</span>
                </div>
              </div>
            </div>

            {/* Card 5: Requests by model */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Requests by model</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <BarChart2 size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">1,219,490</div>
                <div className="text-[11px] text-[#788274] mt-0.5">Across 5 hosted models</div>
              </div>

              <div>
                <WaveGraph
                  points1={modelStackWave1}
                  label1="DeepSeek V4"
                  icon1={<DeepSeekLogo size={12} />}
                  color1="#4d6bfe"
                  unit1="k"
                  points2={modelStackWave2}
                  label2="Llama 3.1"
                  icon2={<MetaLogo size={12} />}
                  color2="#86dc00"
                  unit2="k"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>DeepSeek V4 (52%) • Llama 3.1 (34%)</span>
                  <span className="text-[#4d6bfe]">● Distributed</span>
                </div>
              </div>
            </div>

            {/* Card 6: Tokens by model */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Tokens by model</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <Database size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">14,820,000</div>
                <div className="flex items-center gap-3 text-[11px] mt-0.5">
                  <span className="flex items-center gap-1 text-[#60a5fa]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
                    <span>Input (11.8M)</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#86dc00]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#86dc00]" />
                    <span>Output (3.0M)</span>
                  </span>
                </div>
              </div>

              <div>
                <WaveGraph
                  points1={inputTokenWave}
                  label1="DeepSeek V4 (Input)"
                  icon1={<DeepSeekLogo size={12} />}
                  color1="#60a5fa"
                  unit1="M"
                  points2={outputTokenWave}
                  label2="Llama 3.1 (Output)"
                  icon2={<MetaLogo size={12} />}
                  color2="#86dc00"
                  unit2="M"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>Total throughput: 3.92 tok/input</span>
                  <span className="text-[#60a5fa]">● Live compute</span>
                </div>
              </div>
            </div>

            {/* Card 7: Requests by API key */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Requests by API key</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <Key size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">412,890</div>
                <div className="text-[11px] text-[#788274] mt-0.5">key_prod_runtime_9a4f (Primary)</div>
              </div>

              <div>
                <WaveGraph
                  points1={apiKeyWave1}
                  label1="Prod Key"
                  color1="#86dc00"
                  unit1="k"
                  points2={apiKeyWave2}
                  label2="Staging Key"
                  color2="#a78bfa"
                  unit2="k"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>prod (74%) • staging (26%)</span>
                  <span className="text-[#86dc00]">● Authenticated</span>
                </div>
              </div>
            </div>

            {/* Card 8: Tokens by API key */}
            <div className="border border-dashed border-[#282828] bg-[#141414] p-4 rounded-xs font-mono text-xs flex flex-col justify-between min-h-[225px]">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F0EFE2] text-xs">Tokens by API key</span>
                      <Info size={11} className="text-[#666]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <GripVertical size={11} />
                    </div>
                    <div className="w-6 h-6 rounded-xs border border-[#282828] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                      <Key size={12} />
                    </div>
                  </div>
                </div>

                <div className="text-base font-bold text-[#F0EFE2] mt-2">6,463,100</div>
                <div className="flex items-center gap-3 text-[11px] mt-0.5">
                  <span className="flex items-center gap-1 text-[#60a5fa]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
                    <span>Input (5.2M)</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#86dc00]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#86dc00]" />
                    <span>Output (1.2M)</span>
                  </span>
                </div>
              </div>

              <div>
                <WaveGraph
                  points1={inputTokenWave}
                  label1="Input Tokens"
                  color1="#60a5fa"
                  unit1="M"
                  points2={outputTokenWave}
                  label2="Output Tokens"
                  color2="#86dc00"
                  unit2="M"
                  yMax={100}
                />
                <div className="flex justify-between text-[10px] text-[#788274] pt-1.5 border-t border-dashed border-[#242424]">
                  {timelineDates.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="text-[10px] text-[#788274] mt-1.5 flex items-center justify-between">
                  <span>Quota usage: 42.8% of daily tier</span>
                  <span className="text-[#60a5fa]">● Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DEPLOYMENTS ANALYTICS TAB (Matching Image 1 & Image 2) */}
      {subTab === "deployments" && (
        <div className="space-y-6 font-mono text-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-dashed border-[#282828] pb-2">
            <span className="text-[#F0EFE2] font-bold font-sans">Active Deployed Pipeline Route Metrics</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-dashed border-[#383838] bg-[#181818] p-0.5 rounded-xs font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setDeploymentsState("active")}
                  className={cn(
                    "px-2.5 py-0.5 rounded-xs transition-colors cursor-pointer",
                    deploymentsState === "active"
                      ? "bg-[#282828] text-[#75bf00] font-bold"
                      : "text-[#788274] hover:text-[#F0EFE2]"
                  )}
                >
                  Active Routes (2)
                </button>
                <button
                  type="button"
                  onClick={() => setDeploymentsState("empty")}
                  className={cn(
                    "px-2.5 py-0.5 rounded-xs transition-colors cursor-pointer",
                    deploymentsState === "empty"
                      ? "bg-[#282828] text-[#75bf00] font-bold"
                      : "text-[#788274] hover:text-[#F0EFE2]"
                  )}
                >
                  Empty State
                </button>
              </div>
              <span className="text-[10px] text-[#75bf00]">● 4 Routes Healthy</span>
            </div>
          </div>

          {deploymentsState === "empty" ? (
            /* IMAGE 2 UI: Empty Deployments State matching Screenshot 2 */
            <div className="flex flex-col items-center justify-center min-h-[380px] border border-dashed border-[#282828] bg-[#141414] rounded-xs p-12 text-center font-sans">
              <div className="w-12 h-12 rounded-xs border border-dashed border-[#383838] bg-[#1d1d1d] flex items-center justify-center text-[#C8C7BA] mb-4 shadow-md">
                <Rocket size={22} className="text-[#C8C7BA]" />
              </div>
              <h3 className="text-sm font-semibold text-[#F0EFE2]">No deployments yet</h3>
              <p className="text-xs text-[#788274] mt-1 max-w-sm">
                Create a pipeline deployment to begin measuring deployment analytics.
              </p>
              <button
                type="button"
                onClick={onNavigateToPipelines}
                className="mt-5 border border-dashed border-[#444] bg-[#222] hover:bg-[#2e2e2e] hover:border-[#75bf00] text-[#F0EFE2] text-xs font-mono px-4 py-2 rounded-xs transition-colors cursor-pointer shadow-sm"
              >
                Go to pipelines
              </button>
            </div>
          ) : (
            /* IMAGE 1 UI: Active Deployment Route Analytics Grid matching Screenshot 1 */
            <div className="space-y-4">
              {/* Pipeline 1: prod-fast-rag-v2 */}
              <div className="p-4 border border-dashed border-[#262626] bg-[#141414] rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#75bf00]" />
                    <span className="text-[#F0EFE2] font-bold font-sans">prod-fast-rag-v2</span>
                    <span className="text-[10px] text-[#C8C7BA] font-mono">api.dhyra.run/v1/pipelines/prod-fast-rag-v2</span>
                  </div>
                  <span className="bg-[#75bf00]/10 text-[#75bf00] border border-dashed border-[#75bf00]/40 px-2 py-0.5 text-[10px] rounded-xs font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">24H REQUESTS</div>
                    <div className="text-sm font-bold text-[#F0EFE2] mt-0.5">540,210</div>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">P99 LATENCY</div>
                    <div className="text-sm font-bold text-[#75bf00] mt-0.5">184ms</div>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">COST RATE</div>
                    <div className="text-sm font-bold text-[#F0EFE2] mt-0.5">$0.14 / 1M</div>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">CACHE HIT RATE</div>
                    <div className="text-sm font-bold text-[#75bf00] mt-0.5">86.4%</div>
                  </div>
                </div>

                {/* Traffic Wave */}
                <WaveGraph
                  points1={[240, 310, 480, 520, 610, 540, 580]}
                  label1="Requests/min"
                  color1="#75bf00"
                  unit1="req"
                  points2={[140, 180, 190, 184, 175, 184, 180]}
                  label2="P99 Latency (ms)"
                  color2="#38bdf8"
                  unit2="ms"
                  yMax={700}
                />
              </div>

              {/* Pipeline 2: code-generation-ensemble */}
              <div className="p-4 border border-dashed border-[#262626] bg-[#141414] rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-[#F0EFE2] font-bold font-sans">code-generation-ensemble</span>
                    <span className="text-[10px] text-[#C8C7BA] font-mono">api.dhyra.run/v1/pipelines/code-generation-ensemble</span>
                  </div>
                  <span className="bg-[#f59e0b]/10 text-[#f59e0b] border border-dashed border-[#f59e0b]/40 px-2 py-0.5 text-[10px] rounded-xs font-bold">
                    CANARY (90/10 SPLIT)
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">24H REQUESTS</div>
                    <div className="text-sm font-bold text-[#F0EFE2] mt-0.5">412,890</div>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">P99 LATENCY</div>
                    <div className="text-sm font-bold text-[#75bf00] mt-0.5">210ms</div>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">COST RATE</div>
                    <div className="text-sm font-bold text-[#F0EFE2] mt-0.5">$0.18 / 1M</div>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-dashed border-[#282828] rounded-xs">
                    <div className="text-[10px] text-[#777]">CANARY ACCURACY</div>
                    <div className="text-sm font-bold text-[#75bf00] mt-0.5">99.2%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

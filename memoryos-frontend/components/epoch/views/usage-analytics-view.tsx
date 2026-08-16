"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Key,
  Cpu,
  ChevronDown,
  LayoutGrid,
  Rows,
  RefreshCw,
  Info,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeepSeekLogo, MetaLogo, QwenLogo, BAAILogo, FluxLogo } from "@/components/epoch/primitives/brand-icons";

interface UsageAnalyticsViewProps {
  dark?: boolean;
  onNavigateToModelApis?: () => void;
  onNavigateToSettingsCost?: () => void;
}

export function UsageAnalyticsView({
  dark = true,
  onNavigateToModelApis,
  onNavigateToSettingsCost,
}: UsageAnalyticsViewProps) {
  const [subTab, setSubTab] = useState<"model_apis" | "deployments">("model_apis");
  const [selectedModel, setSelectedModel] = useState<string>("DeepSeek V4 Flash");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [layoutMode, setLayoutMode] = useState<"2_col" | "1_col">("2_col");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const modelsList = [
    { name: "DeepSeek V4 Flash", icon: <DeepSeekLogo size={14} /> },
    { name: "meta-llama/Llama-3.1-8B-Instruct", icon: <MetaLogo size={14} /> },
    { name: "Qwen/Qwen2.5-7B-Instruct", icon: <QwenLogo size={14} /> },
    { name: "BAAI/bge-m3", icon: <BAAILogo size={14} /> },
    { name: "black-forest-labs/FLUX.1-schnell", icon: <FluxLogo size={14} /> },
  ];

  const primaryText = dark ? "text-white" : "text-[#171a17]";
  const secondaryText = dark ? "text-[#889084]" : "text-[#687063]";

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-in fade-in duration-150">
      {/* Top Header matching Reference Screenshot 2 & 3 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5">
            <span className={primaryText}>Usage</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans">
              Analytics
            </span>
          </h1>
          <p className={cn("mt-1 text-xs", secondaryText)}>
            Measured hosted and deployment traffic, organized for fast decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToModelApis}
          className={cn(
            "flex items-center gap-1.5 border border-dashed px-3 py-1.5 text-xs font-medium transition-colors rounded-xs font-mono",
            dark
              ? "border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-white hover:border-[#75bf00]"
              : "border-[#d8ddd3] bg-white text-[#525a4d] hover:text-black hover:border-black"
          )}
        >
          <span>Model APIs</span>
        </button>
      </div>

      {/* Primary Subtabs: Model APIs | Deployments */}
      <div className="flex items-center gap-4 border-b border-dashed border-[#2e2e2e] pb-1 text-xs font-mono">
        <button
          type="button"
          onClick={() => setSubTab("model_apis")}
          className={cn(
            "flex items-center gap-2 pb-2 transition-colors relative font-semibold",
            subTab === "model_apis"
              ? "text-[#75bf00]"
              : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-black"
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
            "flex items-center gap-2 pb-2 transition-colors relative font-semibold",
            subTab === "deployments"
              ? "text-[#75bf00]"
              : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-black"
          )}
        >
          <Layers size={14} />
          <span>Deployments</span>
          {subTab === "deployments" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#75bf00]" />
          )}
        </button>
      </div>

      {/* Controls & Filter Bar matching Reference Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Notice Text */}
        <div className="flex items-center gap-2 text-[11px] text-[#788274] font-mono">
          <BarChart3 size={13} className="text-[#788274] shrink-0" />
          <span>
            Totals cover every hosted model. Charts below are scoped to the selected one. See spend in{" "}
            <button
              type="button"
              onClick={onNavigateToSettingsCost}
              className="text-[#90988c] underline hover:text-[#75bf00] transition-colors"
            >
              Settings, Cost
            </button>
          </span>
        </div>

        {/* Right Filter Actions: Model Selector + Time Range + Layout Mode */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className={cn(
                "flex items-center gap-2 border border-dashed px-2.5 py-1 text-xs rounded-xs transition-colors",
                dark ? "border-[#383838] bg-[#1a1a1a] text-white hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#171a17]"
              )}
            >
              <span className="text-[#788274]">Model</span>
              <span className="font-semibold">{selectedModel}</span>
              <ChevronDown size={11} className="text-[#788274]" />
            </button>

            {modelDropdownOpen && (
              <div className={cn(
                "absolute right-0 top-full mt-1 w-64 border border-dashed shadow-2xl p-1 space-y-0.5 z-50 rounded-xs text-xs",
                dark ? "border-[#383838] bg-[#181818] text-white" : "border-[#d8ddd3] bg-white text-[#171a17]"
              )}>
                {modelsList.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => {
                      setSelectedModel(m.name);
                      setModelDropdownOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 text-left rounded-xs transition-colors",
                      selectedModel === m.name
                        ? dark ? "bg-[#252525] text-[#75bf00] font-bold" : "bg-[#f5faee] text-[#2d5800] font-bold"
                        : dark ? "hover:bg-[#202020] text-[#a0a89d]" : "hover:bg-[#fafbfa] text-[#555]"
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
          <div className={cn(
            "flex items-center border border-dashed p-0.5 rounded-xs",
            dark ? "border-[#383838] bg-[#181818]" : "border-[#d8ddd3] bg-white"
          )}>
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
                  "px-2 py-0.5 rounded-xs transition-colors text-[11px]",
                  timeRange === t.id
                    ? dark ? "bg-[#282828] text-white font-bold" : "bg-[#eaeaea] text-[#111] font-bold"
                    : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-black"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Layout Mode Switcher */}
          <div className={cn(
            "flex items-center border border-dashed p-0.5 rounded-xs",
            dark ? "border-[#383838] bg-[#181818]" : "border-[#d8ddd3] bg-white"
          )}>
            <button
              type="button"
              onClick={() => setLayoutMode("2_col")}
              className={cn(
                "px-2 py-0.5 rounded-xs transition-colors text-[11px]",
                layoutMode === "2_col"
                  ? dark ? "bg-[#282828] text-white font-bold" : "bg-[#eaeaea] text-[#111] font-bold"
                  : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-black"
              )}
            >
              2 per row
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("1_col")}
              className={cn(
                "px-2 py-0.5 rounded-xs transition-colors text-[11px]",
                layoutMode === "1_col"
                  ? dark ? "bg-[#282828] text-white font-bold" : "bg-[#eaeaea] text-[#111] font-bold"
                  : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-black"
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
            className="text-[11px] text-[#788274] hover:text-white transition-colors px-1"
          >
            Reset layout
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip matching Reference Screenshot 2 */}
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-3 p-3 border border-dashed rounded-xs text-xs font-mono",
        dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
      )}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5 text-[#788274]">
            <span className="text-[11px]">SPEND</span>
          </div>
          <span className={cn("font-bold text-xs", primaryText)}>$0.00</span>
        </div>

        <div className="flex items-center justify-between px-2 border-l border-dashed border-[#2e2e2e]">
          <div className="flex items-center gap-1.5 text-[#788274]">
            <span className="text-[11px]">REQUESTS</span>
          </div>
          <span className={cn("font-bold text-xs", primaryText)}>0</span>
        </div>

        <div className="flex items-center justify-between px-2 border-l border-dashed border-[#2e2e2e]">
          <div className="flex items-center gap-1.5 text-[#788274]">
            <span className="text-[11px]">INPUT TOKENS</span>
          </div>
          <span className={cn("font-bold text-xs", primaryText)}>0</span>
        </div>

        <div className="flex items-center justify-between px-2 border-l border-dashed border-[#2e2e2e]">
          <div className="flex items-center gap-1.5 text-[#788274]">
            <span className="text-[11px]">OUTPUT TOKENS</span>
          </div>
          <span className={cn("font-bold text-xs", primaryText)}>0</span>
        </div>
      </div>

      {/* 8 High-Density Analytics Chart Cards matching Reference Screenshot 2 & 3 */}
      <div className={cn(
        "grid gap-4",
        layoutMode === "2_col" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
      )}>
        {/* Chart 1: Request Volume */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[220px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Request volume</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#75bf00] mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                <span>Requests</span>
              </div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>

          {/* Minimal Clean Line Chart Area */}
          <div className="space-y-1 pt-4">
            <div className="h-16 w-full flex items-end justify-between border-b border-dashed border-[#2e2e2e] pb-1">
              <span className="text-[9px] text-[#555]">1</span>
              <div className="w-full h-0.5 bg-[#75bf00]/40 mx-2" />
              <span className="text-[9px] text-[#555]">0</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#666] pt-1">
              <span>Aug 7</span>
              <span>Aug 8</span>
              <span>Aug 10</span>
              <span>Aug 11</span>
              <span>Aug 12</span>
              <span>Aug 14</span>
            </div>
            <div className="text-[10px] text-center text-[#666] pt-1">
              No requests were measured in this window.
            </div>
          </div>
        </div>

        {/* Chart 2: Input Tokens */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[220px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Input tokens</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#60a5fa] mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
                <span>Input tokens</span>
              </div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <div className="h-16 w-full flex items-end justify-between border-b border-dashed border-[#2e2e2e] pb-1">
              <span className="text-[9px] text-[#555]">1</span>
              <div className="w-full h-0.5 bg-[#60a5fa]/40 mx-2" />
              <span className="text-[9px] text-[#555]">0</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#666] pt-1">
              <span>Aug 7</span>
              <span>Aug 8</span>
              <span>Aug 10</span>
              <span>Aug 11</span>
              <span>Aug 12</span>
              <span>Aug 14</span>
            </div>
            <div className="text-[10px] text-center text-[#666] pt-1">
              No input tokens were measured in this window.
            </div>
          </div>
        </div>

        {/* Chart 3: Output Tokens */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[220px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Output tokens</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#a3e635] mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a3e635]" />
                <span>Output tokens</span>
              </div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <div className="h-16 w-full flex items-end justify-between border-b border-dashed border-[#2e2e2e] pb-1">
              <span className="text-[9px] text-[#555]">1</span>
              <div className="w-full h-0.5 bg-[#a3e635]/40 mx-2" />
              <span className="text-[9px] text-[#555]">0</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#666] pt-1">
              <span>Aug 7</span>
              <span>Aug 8</span>
              <span>Aug 10</span>
              <span>Aug 11</span>
              <span>Aug 12</span>
              <span>Aug 14</span>
            </div>
            <div className="text-[10px] text-center text-[#666] pt-1">
              No output tokens were measured in this window.
            </div>
          </div>
        </div>

        {/* Chart 4: Request Outcomes */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[220px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Request outcomes</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">{selectedModel}</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
              <div className="flex items-center gap-3 text-[10px] mt-0.5">
                <span className="flex items-center gap-1 text-[#75bf00]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                  <span>Successful</span>
                </span>
                <span className="flex items-center gap-1 text-[#f59e0b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                  <span>Client error</span>
                </span>
                <span className="flex items-center gap-1 text-[#ef4444]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                  <span>Server error</span>
                </span>
              </div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <div className="h-16 w-full flex items-end justify-between border-b border-dashed border-[#2e2e2e] pb-1">
              <span className="text-[9px] text-[#555]">1</span>
              <div className="w-full h-0.5 bg-[#ef4444]/40 mx-2" />
              <span className="text-[9px] text-[#555]">0</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#666] pt-1">
              <span>Aug 7</span>
              <span>Aug 8</span>
              <span>Aug 10</span>
              <span>Aug 11</span>
              <span>Aug 12</span>
              <span>Aug 14</span>
            </div>
            <div className="text-[10px] text-center text-[#666] pt-1">
              No requests were measured in this window.
            </div>
          </div>
        </div>

        {/* Chart 5: Requests by Model */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[200px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Requests by model</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>
          <div className="text-[10px] text-center text-[#666] py-6 border-t border-dashed border-[#2e2e2e]">
            No requests were measured in this window.
          </div>
        </div>

        {/* Chart 6: Tokens by Model */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[200px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Tokens by model</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
              <div className="flex items-center gap-3 text-[10px] mt-0.5">
                <span className="flex items-center gap-1 text-[#60a5fa]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
                  <span>Input tokens</span>
                </span>
                <span className="flex items-center gap-1 text-[#75bf00]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                  <span>Output tokens</span>
                </span>
              </div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>
          <div className="text-[10px] text-center text-[#666] py-6 border-t border-dashed border-[#2e2e2e]">
            No input or output tokens were measured in this window.
          </div>
        </div>

        {/* Chart 7: Requests by API Key */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[200px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Requests by API key</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>
          <div className="text-[10px] text-center text-[#666] py-6 border-t border-dashed border-[#2e2e2e]">
            No requests were measured in this window.
          </div>
        </div>

        {/* Chart 8: Tokens by API Key */}
        <div className={cn(
          "border border-dashed p-4 rounded-xs space-y-3 font-mono text-xs flex flex-col justify-between min-h-[200px]",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn("font-bold", primaryText)}>Tokens by API key</span>
                <Info size={11} className="text-[#666]" />
              </div>
              <div className="text-[11px] text-[#788274] mt-0.5">7 days</div>
              <div className={cn("text-base font-bold mt-1", primaryText)}>0</div>
              <div className="flex items-center gap-3 text-[10px] mt-0.5">
                <span className="flex items-center gap-1 text-[#60a5fa]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
                  <span>Input tokens</span>
                </span>
                <span className="flex items-center gap-1 text-[#75bf00]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                  <span>Output tokens</span>
                </span>
              </div>
            </div>
            <div className="text-[#666]">
              <span className="text-xs">:::</span>
            </div>
          </div>
          <div className="text-[10px] text-center text-[#666] py-6 border-t border-dashed border-[#2e2e2e]">
            No input or output tokens were measured in this window.
          </div>
        </div>
      </div>
    </div>
  );
}

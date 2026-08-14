"use client";

import React, { useState } from "react";
import { Play, Search, Terminal, ChevronRight, RefreshCw } from "lucide-react";
import { RunEntity } from "@/lib/epoch-types";
import { EpochBadge } from "../ui/epoch-badge";
import { EpochStatusDot } from "../ui/epoch-status-dot";
import { EpochEmptyState } from "../ui/epoch-empty-state";
import { cn } from "@/lib/utils";

interface RunsListViewProps {
  runs: RunEntity[];
  onSelectRun: (runId: string) => void;
  onRefresh?: () => void;
  dark?: boolean;
}

export function RunsListView({ runs, onSelectRun, onRefresh, dark = true }: RunsListViewProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRuns = runs.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.programName.toLowerCase().includes(q) ||
        r.candidateName.toLowerCase().includes(q) ||
        r.environment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabs = [
    { id: "all", label: "All Runs", count: runs.length },
    { id: "benchmark", label: "Benchmarks", count: runs.filter((r) => r.type === "benchmark").length },
    { id: "optimization", label: "Optimizations", count: runs.filter((r) => r.type === "optimization").length },
    { id: "verification", label: "Verifications", count: runs.filter((r) => r.type === "verification").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
        dark ? "border-[#2e2e2e]" : "border-[#e1e4df]"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788274]">
              Execution Engine
            </span>
          </div>
          <h1 className={cn(
            "mt-1 text-3xl font-normal tracking-[-0.03em] md:text-4xl",
            dark ? "text-white" : "text-[#171a17]"
          )}>
            Runs
          </h1>
          <p className={cn("mt-1 text-xs md:text-sm", dark ? "text-[#889084]" : "text-[#656d60]")}>
            Empirical runtime runs, benchmark sweeps, and verification traces.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className={cn(
              "flex items-center gap-1.5 border px-3 py-1.5 text-xs rounded-xs transition-colors",
              dark ? "border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-white hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#525a4d] hover:border-[#171a17]"
            )}
          >
            <RefreshCw size={13} />
            <span>Refresh stream</span>
          </button>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={cn(
          "flex items-center gap-1 border-b pb-1 overflow-x-auto",
          dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
        )}>
          {tabs.map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-b-2 border-[#75bf00] text-white font-bold"
                    : dark
                    ? "text-[#889084] hover:text-white"
                    : "text-[#6b7367] hover:text-[#171a17]"
                )}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] text-[#788274]">({tab.count})</span>
              </button>
            );
          })}
        </div>

        <label className={cn(
          "flex items-center gap-2 border px-3 py-1.5 text-xs min-w-[240px] rounded-xs",
          dark ? "border-[#2e2e2e] bg-[#202020] text-[#889084]" : "border-[#d8ddd3] bg-white text-[#687063]"
        )}>
          <Search size={13} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search run ID, program, candidate..."
            className="bg-transparent outline-none placeholder:text-[#666] w-full text-xs"
          />
        </label>
      </div>

      {/* Runs Table / Cards List */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {filteredRuns.length > 0 ? (
          filteredRuns.map((r) => (
            <div
              key={r.id}
              onClick={() => onSelectRun(r.id)}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors cursor-pointer text-xs",
                dark ? "hover:bg-[#282828]" : "hover:bg-[#fafbfa]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center border shrink-0 rounded-xs",
                  dark ? "border-[#383838] bg-[#1a1a1a] text-[#889084]" : "border-[#d8ddd3] bg-[#fbfbfa] text-[#6b7367]"
                )}>
                  <Terminal size={14} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#60a5fa]">{r.id}</span>
                    <span className={cn(
                      "font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-xs",
                      r.status === "completed"
                        ? "border border-[#75bf00]/40 bg-[#162916] text-[#a3e635]"
                        : r.status === "running"
                        ? "border border-[#38bdf8]/40 bg-[#0c2a38] text-[#7dd3fc]"
                        : "border border-[#d97706]/40 bg-[#382405] text-[#fbbf24]"
                    )}>
                      {r.status}
                    </span>
                    <span className="text-[10px] text-[#788274] uppercase">{r.type}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#788274]">
                    <span className={dark ? "text-white" : "text-[#171a17]"}>{r.programName}</span>
                    <span>•</span>
                    <span>{r.candidateName}</span>
                    <span>•</span>
                    <span>{r.environment}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-[11px] text-[#788274]">
                <span>{r.durationSeconds ? `${r.durationSeconds}s` : "4.2s"}</span>
                <span>{r.startedAt}</span>
                <ChevronRight size={14} className="text-[#889084]" />
              </div>
            </div>
          ))
        ) : (
          <EpochEmptyState
            icon={<Terminal size={18} />}
            title="No runs match filter"
            description="No active benchmark sweeps or optimization runs match your criteria."
            dark={dark}
          />
        )}
      </div>
    </div>
  );
}

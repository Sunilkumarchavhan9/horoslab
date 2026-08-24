"use client";

import React, { useState } from "react";
import {
  Play,
  Search,
  Terminal,
  ChevronRight,
  RefreshCw,
  Cpu,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Zap,
  Layers,
} from "lucide-react";
import { RunEntity } from "@/lib/epoch-types";
import { EpochEmptyState } from "../ui/epoch-empty-state";
import { VLLMLogo } from "../primitives/brand-icons";
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
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Fallback demo runs if list is empty
  const allRuns: RunEntity[] = runs.length > 0 ? runs : [
    {
      id: "run-0819-llama3-vllm",
      programId: "prog-llama3-opt",
      programName: "Cost Reduction: Llama-3.1-8B",
      candidateName: "vLLM Chunked Prefill + Continuous Batching",
      type: "optimization",
      status: "completed",
      environment: "1x NVIDIA A100-40GB PCIe",
      executionDomain: "cloud",
      startedAt: "2026-08-19 12:30:14",
      durationSeconds: 330,
      trustLevel: "VERIFIED",
      metrics: {
        latencyP95: 82.4,
        throughputTps: 61.4,
        costUsd: 18.5,
        gpuMemoryGb: 12.8,
        qualityScore: 0.98,
      },
      logs: [],
    },
    {
      id: "run-0819-qwen32b-baseline",
      programId: "prog-qwen-opt",
      programName: "Latency Sweep: Qwen-2.5-32B",
      candidateName: "FP16 Standard Baseline",
      type: "benchmark",
      status: "completed",
      environment: "2x NVIDIA A100-80GB SXM4",
      executionDomain: "cloud",
      startedAt: "2026-08-19 11:15:00",
      durationSeconds: 180,
      trustLevel: "MEASURED",
      metrics: {
        latencyP95: 142.1,
        throughputTps: 38.2,
        costUsd: 12.0,
        gpuMemoryGb: 48.2,
        qualityScore: 1.0,
      },
      logs: [],
    },
    {
      id: "run-0819-mistral-proof",
      programId: "prog-mistral-verif",
      programName: "SLA Assurance: Mistral-Small",
      candidateName: "SLO Proof Package Verifier",
      type: "verification",
      status: "completed",
      environment: "1x NVIDIA L40S 48GB",
      executionDomain: "cloud",
      startedAt: "2026-08-19 10:00:22",
      durationSeconds: 94,
      trustLevel: "VERIFIED",
      metrics: {
        latencyP95: 45.0,
        throughputTps: 84.6,
        costUsd: 4.8,
        gpuMemoryGb: 14.1,
        qualityScore: 0.99,
      },
      logs: [],
    },
    {
      id: "run-0819-deepseek-quant",
      programId: "prog-deepseek-fp8",
      programName: "FP8 Quantization Benchmark",
      candidateName: "TensorRT-LLM FP8 Gemm",
      type: "optimization",
      status: "running",
      environment: "4x NVIDIA H100-80GB",
      executionDomain: "data_center",
      startedAt: "2026-08-19 12:45:00",
      durationSeconds: 62,
      trustLevel: "MEASURED",
      metrics: {
        latencyP95: 31.2,
        throughputTps: 128.0,
        costUsd: 8.2,
        gpuMemoryGb: 36.4,
        qualityScore: 0.97,
      },
      logs: [],
    },
  ];

  const filteredRuns = allRuns.filter((r) => {
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
    { id: "all", label: "All Runs", count: allRuns.length },
    { id: "optimization", label: "Optimizations", count: allRuns.filter((r) => r.type === "optimization").length },
    { id: "benchmark", label: "Benchmarks", count: allRuns.filter((r) => r.type === "benchmark").length },
    { id: "verification", label: "Verifications", count: allRuns.filter((r) => r.type === "verification").length },
  ];

  const totalCost = allRuns.reduce((acc, r) => acc + (r.metrics?.costUsd || 0), 0);

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-in fade-in duration-150 pb-12 font-sans text-xs">
      {/* Top Header */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b pb-4",
        dark ? "border-[#282828]" : "border-[#e1e4df]"
      )}>
        <div>
          <h1 className="text-base font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <span>Runs &amp; Execution Fabric</span>
            <span className="text-xs font-normal text-[#788274] font-mono">({allRuns.length} total)</span>
          </h1>
          <p className="mt-1 text-xs text-[#788274]">
            Empirical runtime runs, benchmark sweeps, and verification traces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className={cn(
                "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-mono rounded-xs transition-colors cursor-pointer",
                dark ? "border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-white hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#525a4d] hover:border-[#171a17]"
              )}
            >
              <RefreshCw size={12} />
              <span>Refresh stream</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className={cn(
          "border p-3 rounded-xs space-y-1",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Total Runs</span>
          <span className="text-sm font-bold text-white">{allRuns.length}</span>
        </div>
        <div className={cn(
          "border p-3 rounded-xs space-y-1",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Active Now</span>
          <span className="text-sm font-bold text-[#60a5fa]">
            {allRuns.filter((r) => r.status === "running").length}
          </span>
        </div>
        <div className={cn(
          "border p-3 rounded-xs space-y-1",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Verified Winners</span>
          <span className="text-sm font-bold text-white">
            {allRuns.filter((r) => r.status === "completed").length}
          </span>
        </div>
        <div className={cn(
          "border p-3 rounded-xs space-y-1",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Compute Spend</span>
          <span className="text-sm font-bold text-white">${totalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 text-xs font-mono">
          {tabs.map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={cn(
                  "px-3 py-1 border border-dashed transition-colors rounded-xs cursor-pointer",
                  isActive
                    ? dark
                      ? "border-[#555] bg-[#282828] text-white font-bold"
                      : "border-[#888] bg-[#eaeaea] text-[#111] font-bold"
                    : dark
                    ? "border-transparent text-[#788274] hover:text-white"
                    : "border-transparent text-[#687063] hover:text-[#171a17]"
                )}
              >
                <span>{tab.label}</span>
                <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <label className={cn(
            "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[260px]",
            dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
          )}>
            <Search size={13} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search run ID, model, hardware..."
              className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-full text-white"
            />
          </label>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#788274]">
            <span>{filteredRuns.length} runs</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {sortBy === "newest" ? "Newest first" : "Oldest first"}
            </button>
          </div>
        </div>
      </div>

      {/* Runs Table */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {/* Table Header */}
        <div className={cn(
          "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
          dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
        )}>
          <div className="col-span-4">Run ID &amp; Program</div>
          <div className="col-span-3">Candidate / Strategy</div>
          <div className="col-span-2">Hardware</div>
          <div className="col-span-1 text-right">Latency</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Rows */}
        {filteredRuns.length > 0 ? (
          filteredRuns.map((r) => (
            <div
              key={r.id}
              onClick={() => onSelectRun(r.id)}
              className={cn(
                "grid grid-cols-12 gap-3 px-4 py-3 items-center text-xs transition-colors cursor-pointer",
                dark ? "hover:bg-[#252525]" : "hover:bg-[#fafbfa]"
              )}
            >
              {/* Col 1: Run ID & Program */}
              <div className="col-span-4 space-y-0.5">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-white">{r.id}</span>
                  <span className="text-[10px] text-[#788274] border border-[#383838] bg-[#181818] px-1 py-0.2 rounded-xs uppercase">
                    {r.type}
                  </span>
                </div>
                <div className="text-[11px] text-[#788274] truncate">
                  {r.programName}
                </div>
              </div>

              {/* Col 2: Candidate / Strategy */}
              <div className="col-span-3 space-y-0.5 font-mono text-[11px]">
                <div className="text-white truncate">{r.candidateName}</div>
                <div className="text-[10px] text-[#788274]">{r.durationSeconds}s • ${r.metrics?.costUsd?.toFixed(2)}</div>
              </div>

              {/* Col 3: Hardware */}
              <div className="col-span-2 text-[11px] font-mono text-[#a0a89d] truncate">
                {r.environment}
              </div>

              {/* Col 4: Latency */}
              <div className="col-span-1 text-right font-mono text-white">
                {r.metrics?.latencyP95 ? `${r.metrics.latencyP95}ms` : "—"}
              </div>

              {/* Col 5: Status */}
              <div className="col-span-1 text-center">
                <span className={cn(
                  "font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-xs border",
                  r.status === "completed"
                    ? "border-[#384820] bg-[#1c2a12] text-[#86dc00]"
                    : r.status === "running"
                    ? "border-[#1e3a5f] bg-[#0c1e33] text-[#60a5fa] animate-pulse"
                    : "border-[#383838] bg-[#181818] text-[#a0a89d]"
                )}>
                  {r.status}
                </span>
              </div>

              {/* Col 6: Action */}
              <div className="col-span-1 text-right font-mono text-[#788274] hover:text-white flex items-center justify-end gap-1">
                <span>View</span>
                <ChevronRight size={13} />
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

"use client";

import React, { useState } from "react";
import {
  Sparkles,
  GitMerge,
  Layers,
  ArrowRight,
  Shield,
  Gauge,
  Sliders,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  Cpu,
  Zap,
  Play,
  Rocket,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CandidateSystemItem } from "@/lib/dhyra-types";

interface SystemsViewProps {
  dark?: boolean;
  onLaunchExperiment?: (system: CandidateSystemItem) => void;
  onDeploySystem?: (system: CandidateSystemItem) => void;
}

const SAMPLE_CANDIDATE_SYSTEMS: CandidateSystemItem[] = [
  {
    id: "sys-cand-1",
    name: "Ultra-Low Latency Voice Agent (Candidate A)",
    architecture: ["Whisper-Large-v3", "BGE-M3", "Llama-3.1-8B-FP8", "Cartesia TTS"],
    components: [
      { role: "stt", model: "Whisper-Large-v3", runtime: "vLLM-Omni", hardware: "1x A100" },
      { role: "retrieval", model: "BGE-M3", runtime: "TEI", hardware: "1x L4" },
      { role: "llm", model: "Llama-3.1-8B-Instruct", runtime: "SGLang-FP8", hardware: "1x A100" },
      { role: "tts", model: "Cartesia Sonic", runtime: "Custom Engine", hardware: "Edge" },
    ],
    predictedMetrics: {
      p95LatencyMs: 185,
      costPer1kReqUsd: 0.012,
      qualityRetentionPct: 99.4,
      vramGb: 34.2,
      monthlyTcoUsd: 1420,
    },
    paretoRank: 1,
    policyStatus: "compliant",
    compatibilityScorePct: 100,
  },
  {
    id: "sys-cand-2",
    name: "High-Throughput Batch RAG System (Candidate B)",
    architecture: ["Qwen-2.5-7B-Instruct", "Qdrant", "Cohere-Rerank-v3", "vLLM"],
    components: [
      { role: "retrieval", model: "BGE-Large-EN", runtime: "TEI", hardware: "1x L4" },
      { role: "reranker", model: "Cohere-Rerank-v3", runtime: "API", hardware: "Cloud" },
      { role: "llm", model: "Qwen-2.5-7B-Instruct", runtime: "vLLM-FP8", hardware: "1x H100" },
    ],
    predictedMetrics: {
      p95LatencyMs: 240,
      costPer1kReqUsd: 0.008,
      qualityRetentionPct: 98.8,
      vramGb: 28.0,
      monthlyTcoUsd: 980,
    },
    paretoRank: 2,
    policyStatus: "compliant",
    compatibilityScorePct: 100,
  },
  {
    id: "sys-cand-3",
    name: "Full Precision Enterprise Reasoning Stack (Candidate C)",
    architecture: ["Llama-3.1-70B-Instruct", "TensorRT-LLM", "Qdrant Hybrid"],
    components: [
      { role: "llm", model: "Llama-3.1-70B-Instruct", runtime: "TensorRT-LLM (BF16)", hardware: "4x H100" },
    ],
    predictedMetrics: {
      p95LatencyMs: 420,
      costPer1kReqUsd: 0.048,
      qualityRetentionPct: 100.0,
      vramGb: 156.0,
      monthlyTcoUsd: 4800,
    },
    paretoRank: 3,
    policyStatus: "requires_approval",
    compatibilityScorePct: 95,
  },
];

export function SystemsView({
  dark = false,
  onLaunchExperiment,
  onDeploySystem,
}: SystemsViewProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<string>("sys-cand-1");
  const selectedSystem = SAMPLE_CANDIDATE_SYSTEMS.find((s) => s.id === selectedSystemId) || SAMPLE_CANDIDATE_SYSTEMS[0];

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* Top Header Matching Image 1 */}
      <div className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div>
          <h1 className={cn("text-2xl md:text-3xl font-medium tracking-tight", dark ? "text-[#F0EFE2]" : "text-[#151515]")}>
            Candidate{" "}
            <span className="bg-[#75bf00] text-black px-2 py-0.5 font-bold inline-block rounded-xs">
              systems
            </span>
          </h1>
          <p className={cn("mt-1 text-xs md:text-sm", dark ? "text-[#889084]" : "text-[#555]")}>
            {SAMPLE_CANDIDATE_SYSTEMS.length} Pareto-optimal architectures discovered. Optimized across latency, request cost, quality retention, and monthly TCO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs border-[#383838] bg-[#202020] text-[#a0a89d]">
            <span className="text-[#75bf00] font-bold mr-1.5">●</span>
            Pareto Optimal: 3 Candidates
          </span>
        </div>
      </div>

      {/* Tabs Toolbar Matching Image 1 */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-dashed py-3",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          <button
            type="button"
            className={cn("relative px-3 py-1 text-xs transition-colors rounded-xs font-bold", dark ? "text-[#F0EFE2]" : "text-[#151515]")}
          >
            <span>All Candidate Architectures ({SAMPLE_CANDIDATE_SYSTEMS.length})</span>
            <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#75bf00]" />
          </button>
        </div>
      </div>

      {/* Candidate Pipeline Cards & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Systems List */}
        <div className="lg:col-span-2 space-y-4">
          {SAMPLE_CANDIDATE_SYSTEMS.map((cand) => {
            const isSelected = cand.id === selectedSystemId;
            return (
              <div
                key={cand.id}
                onClick={() => setSelectedSystemId(cand.id)}
                className={cn(
                  "p-4 border border-dashed rounded-xs cursor-pointer transition-all space-y-3",
                  isSelected
                    ? dark
                      ? "border-[#75bf00] bg-[#1a2216]/50 shadow-md"
                      : "border-[#75bf00] bg-[#f5fbf0] shadow-md"
                    : dark
                    ? "border-[#2e2e2e] bg-[#181818] hover:border-[#444]"
                    : "border-[#d8ddd3] bg-white hover:border-[#999]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[#75bf00] text-[#75bf00] bg-[#75bf00]/10 rounded-xs">
                      RANK #{cand.paretoRank}
                    </span>
                    <span className={cn("font-bold text-sm", dark ? "text-[#F0EFE2]" : "text-[#111]")}>
                      {cand.name}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-xs uppercase",
                      cand.policyStatus === "compliant"
                        ? "text-[#16a34a] bg-[#16a34a]/10"
                        : "text-[#f59e0b] bg-[#f59e0b]/10"
                    )}
                  >
                    {cand.policyStatus.replace("_", " ")}
                  </span>
                </div>

                {/* Architecture DAG chain */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#788274]">
                  {cand.architecture.map((arch, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2 py-0.5 border bg-black/5 dark:bg-white/5 rounded-xs font-semibold">
                        {arch}
                      </span>
                      {idx < cand.architecture.length - 1 && (
                        <ArrowRight size={12} className="text-[#75bf00]" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Metric Summary Strip */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-dashed border-[#333]/20 font-mono text-xs">
                  <div>
                    <span className="text-[#C8C7BA] block text-[9px] uppercase">P95 Latency</span>
                    <span className="font-bold text-[#75bf00]">{cand.predictedMetrics.p95LatencyMs}ms</span>
                  </div>
                  <div>
                    <span className="text-[#C8C7BA] block text-[9px] uppercase">Cost / 1k Req</span>
                    <span className="font-bold text-[#75bf00]">${cand.predictedMetrics.costPer1kReqUsd}</span>
                  </div>
                  <div>
                    <span className="text-[#C8C7BA] block text-[9px] uppercase">Quality Retention</span>
                    <span className="font-bold text-[#75bf00]">{cand.predictedMetrics.qualityRetentionPct}%</span>
                  </div>
                  <div>
                    <span className="text-[#C8C7BA] block text-[9px] uppercase">Monthly TCO</span>
                    <span className="font-bold">${cand.predictedMetrics.monthlyTcoUsd}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected System Inspector Panel */}
        <div
          className={cn(
            "p-4 border border-dashed rounded-xs space-y-4 h-fit",
            dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]"
          )}
        >
          <div className="flex items-center justify-between border-b border-dashed border-[#333]/20 pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#75bf00]">
              SYSTEM INSPECTOR
            </span>
            <span className="font-mono text-[10px] text-[#C8C7BA]">Compatibility: {selectedSystem.compatibilityScorePct}%</span>
          </div>

          <div>
            <h3 className={cn("text-base font-bold", dark ? "text-[#F0EFE2]" : "text-[#111]")}>
              {selectedSystem.name}
            </h3>
            <p className="text-xs text-[#788274] font-mono mt-0.5">ID: {selectedSystem.id}</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#C8C7BA] uppercase block">
              Component Composition
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {selectedSystem.components.map((c, i) => (
                <div key={i} className="p-2 border rounded-xs border-[#333]/20 bg-black/5 dark:bg-white/5 space-y-0.5">
                  <div className="flex justify-between text-[11px] font-bold text-[#75bf00] uppercase">
                    <span>{c.role}</span>
                    <span className="text-[#C8C7BA]">{c.hardware}</span>
                  </div>
                  <div className="text-[10px] truncate">{c.model} on {c.runtime}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-dashed border-[#333]/20">
            <button
              type="button"
              onClick={() => onLaunchExperiment?.(selectedSystem)}
              className={cn(
                "w-full py-2 text-xs font-bold font-mono border rounded-xs transition-colors flex items-center justify-center gap-1.5",
                dark
                  ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635] hover:bg-[#222e1d]"
                  : "border-[#b9de78] bg-[#f2fbe6] text-[#2d5800] hover:bg-[#eaf8db]"
              )}
            >
              <Zap size={13} />
              <span>Launch Experiment Run</span>
            </button>

            <button
              type="button"
              onClick={() => onDeploySystem?.(selectedSystem)}
              className={cn(
                "w-full py-1.5 text-xs font-bold font-mono border rounded-xs transition-colors flex items-center justify-center gap-1.5",
                dark
                  ? "border-[#444] bg-[#222] text-[#F0EFE2] hover:bg-[#333]"
                  : "border-[#ccc] bg-white text-black hover:bg-[#f0f0f0]"
              )}
            >
              <Rocket size={13} />
              <span>Deploy Canary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

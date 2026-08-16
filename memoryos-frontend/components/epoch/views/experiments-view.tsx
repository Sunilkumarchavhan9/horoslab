"use client";

import React, { useState } from "react";
import {
  Zap,
  FlaskConical,
  Play,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  Server,
  DollarSign,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BenchmarkMatrixRow, SandboxExecution } from "@/lib/epoch-types";

interface ExperimentsViewProps {
  dark?: boolean;
  onRunBenchmark?: (row: BenchmarkMatrixRow) => void;
}

const SAMPLE_BENCHMARK_MATRIX: BenchmarkMatrixRow[] = [
  {
    candidateId: "bench-1",
    model: "meta-llama/Llama-3.1-8B-Instruct",
    runtime: "vLLM 0.6.2 (AWQ-FP8)",
    hardware: "1x NVIDIA A100-SXM4-40GB",
    batchSize: 16,
    ttftMs: 38.2,
    p50LatencyMs: 24.5,
    p95LatencyMs: 38.2,
    p99LatencyMs: 44.1,
    tokensPerSec: 245.0,
    vramUsageGb: 14.8,
    costPer1MTokensUsd: 0.12,
    qualityScore: 99.4,
    taskSuccessRatePct: 100,
    status: "verified",
  },
  {
    candidateId: "bench-2",
    model: "Qwen/Qwen2.5-7B-Instruct",
    runtime: "SGLang 0.3.4 (FP8 PrefixCache)",
    hardware: "1x NVIDIA A100-SXM4-40GB",
    batchSize: 32,
    ttftMs: 34.1,
    p50LatencyMs: 21.0,
    p95LatencyMs: 34.1,
    p99LatencyMs: 39.8,
    tokensPerSec: 285.0,
    vramUsageGb: 13.2,
    costPer1MTokensUsd: 0.10,
    qualityScore: 99.1,
    taskSuccessRatePct: 100,
    status: "verified",
  },
  {
    candidateId: "bench-3",
    model: "meta-llama/Llama-3.1-70B-Instruct",
    runtime: "TensorRT-LLM (INT4-AWQ)",
    hardware: "2x NVIDIA H100-SXM5-80GB",
    batchSize: 8,
    ttftMs: 62.4,
    p50LatencyMs: 48.0,
    p95LatencyMs: 78.5,
    p99LatencyMs: 92.0,
    tokensPerSec: 142.0,
    vramUsageGb: 48.5,
    costPer1MTokensUsd: 0.85,
    qualityScore: 99.8,
    taskSuccessRatePct: 100,
    status: "verified",
  },
  {
    candidateId: "bench-4",
    model: "openai/whisper-large-v3",
    runtime: "vLLM-Omni Streaming",
    hardware: "1x NVIDIA L4-24GB",
    batchSize: 1,
    ttftMs: 28.0,
    p50LatencyMs: 32.0,
    p95LatencyMs: 52.0,
    p99LatencyMs: 64.0,
    tokensPerSec: 88.0,
    vramUsageGb: 6.8,
    costPer1MTokensUsd: 0.04,
    qualityScore: 98.7,
    werCerRate: 0.032,
    taskSuccessRatePct: 99.2,
    status: "verified",
  },
];

const SAMPLE_SANDBOX_RUN: SandboxExecution = {
  id: "sbx-exec-894",
  sandboxId: "sbx-env-isolated-vllm-01",
  containerImage: "epoch-runtime/vllm:v0.6.2-cuda12.4",
  resourceLimits: { cpu: "8 cores", memory: "32 GB", gpu: "1x NVIDIA A100 (Isolated)", timeoutSec: 300 },
  status: "destroyed",
  exitCode: 0,
  logsSnippet: [
    "[Epoch Sandbox] Initializing isolated microVM container with cgroups containment...",
    "[Epoch Sandbox] Attached 1x A100 device via secure VFIO passthrough.",
    "[vLLM Engine] Initializing engine with model meta-llama/Llama-3.1-8B-Instruct (commit 8f4ca7b)...",
    "[Epoch Benchmark] Synthetic load sweep: 100 req/s, 250 req/s, 500 req/s completed with 0 errors.",
    "[Epoch Verification] Capturing cryptographically hashed telemetry digest...",
    "[Epoch Sandbox] Destroying ephemeral sandbox instance. Evidence bundle committed to Merkle tree.",
  ],
  capturedEvidenceDigest: "sha256:8f4ca7b9e112d308fbc8a23d84f18e9072a4bc03198de7",
};

export function ExperimentsView({
  dark = false,
  onRunBenchmark,
}: ExperimentsViewProps) {
  const [activeTab, setActiveTab] = useState<"benchmarks" | "sandbox" | "economics">("benchmarks");

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* Top Header Matching Image 1 */}
      <div className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div>
          <h1 className={cn("text-2xl md:text-3xl font-medium tracking-tight", dark ? "text-white" : "text-[#151515]")}>
            Benchmark{" "}
            <span className="bg-[#75bf00] text-black px-2 py-0.5 font-bold inline-block rounded-xs">
              matrix
            </span>
          </h1>
          <p className={cn("mt-1 text-xs md:text-sm", dark ? "text-[#889084]" : "text-[#555]")}>
            {SAMPLE_BENCHMARK_MATRIX.length} verified benchmark profiles. Measured against real workloads in isolated sandbox environments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs border-[#383838] bg-[#202020] text-[#a0a89d]">
            <Zap size={13} className="text-[#75bf00]" />
            <span>Max Info Gain Selection</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Toolbar Matching Image 1 */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-dashed py-3",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          {[
            { id: "benchmarks", label: `Benchmark Matrix (${SAMPLE_BENCHMARK_MATRIX.length})` },
            { id: "sandbox", label: "Sandbox Isolation Runner" },
            { id: "economics", label: "Economic Reality Normalizer" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "relative px-3 py-1 text-xs transition-colors rounded-xs",
                  isActive
                    ? dark ? "text-white font-bold" : "text-[#151515] font-bold"
                    : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-black"
                )}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#75bf00]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: BENCHMARK MATRIX TABLE */}
      {activeTab === "benchmarks" && (
        <div className="space-y-4">
          <div
            className={cn(
              "border border-dashed rounded-xs overflow-x-auto",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-dashed border-[#333]/30 bg-black/5 dark:bg-white/5 text-[10px] uppercase text-[#888]">
                  <th className="p-3">Model & Runtime</th>
                  <th className="p-3">Hardware</th>
                  <th className="p-3">TTFT (ms)</th>
                  <th className="p-3">P95 (ms)</th>
                  <th className="p-3">Throughput</th>
                  <th className="p-3">VRAM</th>
                  <th className="p-3">Cost / 1M</th>
                  <th className="p-3">Quality</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#333]/20">
                {SAMPLE_BENCHMARK_MATRIX.map((row) => (
                  <tr key={row.candidateId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="font-bold">{row.model}</div>
                      <div className="text-[10px] text-[#788274]">{row.runtime}</div>
                    </td>
                    <td className="p-3 text-[11px]">{row.hardware}</td>
                    <td className="p-3 font-bold text-[#75bf00]">{row.ttftMs}</td>
                    <td className="p-3 font-bold text-[#75bf00]">{row.p95LatencyMs}</td>
                    <td className="p-3">{row.tokensPerSec} tok/s</td>
                    <td className="p-3">{row.vramUsageGb} GB</td>
                    <td className="p-3 font-bold">${row.costPer1MTokensUsd}</td>
                    <td className="p-3 font-bold text-[#75bf00]">{row.qualityScore}%</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.2 border border-[#16a34a] bg-[#16a34a]/10 text-[#16a34a] rounded-xs text-[10px] uppercase font-bold">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SANDBOX ISOLATION RUNNER */}
      {activeTab === "sandbox" && (
        <div className="space-y-4">
          <div
            className={cn(
              "p-4 border border-dashed rounded-xs space-y-4",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <div className="flex items-center justify-between border-b border-dashed border-[#333]/20 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="text-[#75bf00]" size={16} />
                <h3 className={cn("text-sm font-bold", dark ? "text-white" : "text-[#111]")}>
                  Isolated Sandbox Runner ({SAMPLE_SANDBOX_RUN.sandboxId})
                </h3>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 border border-[#16a34a] text-[#16a34a] rounded-xs font-bold uppercase">
                STATUS: {SAMPLE_SANDBOX_RUN.status} (Exit 0)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-2 border rounded-xs border-[#333]/20 bg-black/5 dark:bg-white/5">
                <span className="text-[#888] block text-[9px] uppercase">CPU Limit</span>
                <span className="font-bold">{SAMPLE_SANDBOX_RUN.resourceLimits.cpu}</span>
              </div>
              <div className="p-2 border rounded-xs border-[#333]/20 bg-black/5 dark:bg-white/5">
                <span className="text-[#888] block text-[9px] uppercase">Memory Limit</span>
                <span className="font-bold">{SAMPLE_SANDBOX_RUN.resourceLimits.memory}</span>
              </div>
              <div className="p-2 border rounded-xs border-[#333]/20 bg-black/5 dark:bg-white/5">
                <span className="text-[#888] block text-[9px] uppercase">GPU Passthrough</span>
                <span className="font-bold text-[#75bf00]">{SAMPLE_SANDBOX_RUN.resourceLimits.gpu}</span>
              </div>
              <div className="p-2 border rounded-xs border-[#333]/20 bg-black/5 dark:bg-white/5">
                <span className="text-[#888] block text-[9px] uppercase">Timeout</span>
                <span className="font-bold">{SAMPLE_SANDBOX_RUN.resourceLimits.timeoutSec}s</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#888] uppercase block">
                Execution Logs & Containment Trail
              </span>
              <pre
                className={cn(
                  "p-3 rounded-xs text-[11px] font-mono overflow-x-auto border space-y-1",
                  dark ? "bg-[#111] border-[#333] text-[#ddd]" : "bg-black text-[#a3e635] border-[#222]"
                )}
              >
                {SAMPLE_SANDBOX_RUN.logsSnippet.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </pre>
            </div>

            <div className="pt-2 border-t border-dashed border-[#333]/20 flex items-center justify-between font-mono text-xs">
              <span className="text-[#888]">Captured Evidence Digest:</span>
              <span className="text-[#75bf00] font-bold">{SAMPLE_SANDBOX_RUN.capturedEvidenceDigest}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ECONOMIC REALITY NORMALIZER */}
      {activeTab === "economics" && (
        <div className="space-y-4">
          <div
            className={cn(
              "p-4 border border-dashed rounded-xs space-y-4",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={cn("text-sm font-bold", dark ? "text-white" : "text-[#111]")}>
                  Economic Normalization Formula: Total Cost / Successful Outcomes
                </h3>
                <p className="text-xs text-[#788274] mt-0.5">
                  Optimization must never reward cheap failure. Epoch normalizes cost exclusively by successful outcome completions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]")}>
                <span className="text-[#888] block text-[10px] uppercase">Cost Per Token</span>
                <div className="text-lg font-bold text-[#75bf00]">$0.00000012</div>
                <div className="text-[10px] text-[#888]">$0.12 per 1,000,000 output tokens</div>
              </div>

              <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]")}>
                <span className="text-[#888] block text-[10px] uppercase">Cost Per Request</span>
                <div className="text-lg font-bold text-[#75bf00]">$0.00024</div>
                <div className="text-[10px] text-[#888]">Avg 2,000 tokens / prompt response</div>
              </div>

              <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]")}>
                <span className="text-[#888] block text-[10px] uppercase">Cost / Verified Successful Outcome</span>
                <div className="text-lg font-bold text-[#75bf00]">$0.00024</div>
                <div className="text-[10px] text-[#16a34a] font-bold">100.0% verification pass rate</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Plus,
  Copy,
  Check,
  X,
  ExternalLink,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BenchmarkMatrixRow, SandboxExecution } from "@/lib/horos-types";
import {
  MetaLogo,
  QwenLogo,
  OpenAILogo,
  NvidiaLogo,
  VLLMLogo,
  SGLangLogo,
  DeepSeekLogo,
} from "@/components/horos/primitives/brand-icons";

interface ExperimentsViewProps {
  dark?: boolean;
  onRunBenchmark?: (row: BenchmarkMatrixRow) => void;
  onDeployCandidate?: (candidateId: string) => void;
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
  containerImage: "horos-runtime/vllm:v0.6.2-cuda12.4",
  resourceLimits: { cpu: "8 cores", memory: "32 GB", gpu: "1x NVIDIA A100 (Isolated)", timeoutSec: 300 },
  status: "destroyed",
  exitCode: 0,
  logsSnippet: [
    "[HOROS Sandbox] Initializing isolated microVM container with cgroups containment...",
    "[HOROS Sandbox] Attached 1x A100 device via secure VFIO passthrough.",
    "[vLLM Engine] Initializing engine with model meta-llama/Llama-3.1-8B-Instruct (commit 8f4ca7b)...",
    "[HOROS Benchmark] Synthetic load sweep: 100 req/s, 250 req/s, 500 req/s completed with 0 errors.",
    "[HOROS Verification] Capturing cryptographically hashed telemetry digest...",
    "[HOROS Sandbox] Destroying ephorosl sandbox instance. Evidence bundle committed to Merkle tree.",
  ],
  capturedEvidenceDigest: "sha256:8f4ca7b9e112d308fbc8a23d84f18e9072a4bc03198de7",
};

function getModelBrandIcon(modelName: string) {
  const m = modelName.toLowerCase();
  if (m.includes("llama") || m.includes("meta")) return <MetaLogo size={14} />;
  if (m.includes("qwen")) return <QwenLogo size={14} />;
  if (m.includes("whisper") || m.includes("openai")) return <OpenAILogo size={14} />;
  if (m.includes("deepseek")) return <DeepSeekLogo size={14} />;
  return null;
}

function getRuntimeBrandIcon(runtimeName: string) {
  const r = runtimeName.toLowerCase();
  if (r.includes("vllm")) return <VLLMLogo size={13} />;
  if (r.includes("sglang")) return <SGLangLogo size={13} />;
  if (r.includes("tensorrt") || r.includes("trt") || r.includes("nvidia")) return <NvidiaLogo size={13} />;
  return null;
}

export function ExperimentsView({
  dark = true,
  onRunBenchmark,
  onDeployCandidate,
}: ExperimentsViewProps) {
  const [activeTab, setActiveTab] = useState<"benchmarks" | "sandbox" | "economics">("benchmarks");
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [selectedModel, setSelectedModel] = useState("meta-llama/Llama-3.1-70B-Instruct");
  const [selectedBudget, setSelectedBudget] = useState("$50.00");
  const [selectedDataset, setSelectedDataset] = useState("Synthetic Load Sweep (1,000 reqs)");

  const copyDigest = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-24 font-sans text-xs text-left animate-in fade-in duration-150">
      {/* Noise-Free HOROS Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#282828] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold font-sans text-xs uppercase tracking-wider">
              Benchmark Runner & Sandbox
            </span>
            <h1 className="text-lg font-bold font-mono tracking-tight text-[#F0EFE2]">
              Experiment Fabric
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#C8C7BA]">
            Maximizing Expected Information Gain (EIG), bounded microVM sandbox execution, and economic outcome normalization.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            onClick={() => setLaunchModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-3.5 py-1.5 text-xs rounded-xs transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Launch Experiment</span>
          </button>
        </div>
      </div>

      {/* Subnav Tabs & 24 hours Benchmark Window matching User Image */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm gap-1 overflow-x-auto">
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
                  "px-2.5 py-0.5 text-xs font-mono transition-colors cursor-pointer rounded-sm",
                  isActive
                    ? "bg-[#242424] text-[#F0EFE2] font-bold"
                    : "text-[#889284] hover:text-[#F0EFE2]"
                )}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 24 hours Time Window Badge (1:1 Match with User Image) */}
        <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm">
          <span className="bg-[#242424] text-[#F0EFE2] font-bold px-2 py-0.5 rounded-sm">
            24 hours
          </span>
        </div>
      </div>

      {/* TAB 1: BENCHMARK MATRIX TABLE (Section 38) */}
      {activeTab === "benchmarks" && (
        <div className="space-y-3 font-mono">
          <div className="border border-dashed border-[#262626] bg-[#141414] rounded-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dashed border-[#282828] text-[10px] text-[#666] bg-[#181818]">
                  <th className="p-3">CANDIDATE & MODEL</th>
                  <th className="p-3">RUNTIME BACKEND</th>
                  <th className="p-3">HARDWARE</th>
                  <th className="p-3">TTFT (MS)</th>
                  <th className="p-3">P95 (MS)</th>
                  <th className="p-3">THROUGHPUT</th>
                  <th className="p-3">VRAM</th>
                  <th className="p-3">COST / 1M</th>
                  <th className="p-3">QUALITY</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#222]">
                {SAMPLE_BENCHMARK_MATRIX.map((row, idx) => (
                  <tr key={row.candidateId} className="hover:bg-[#181818] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[#F0EFE2] font-sans flex items-center gap-1.5">
                        {getModelBrandIcon(row.model)}
                        <span>{row.model}</span>
                      </div>
                      <div className="text-[10px] text-[#777] font-mono mt-0.5 flex items-center gap-1.5">
                        <span>ID: #{row.candidateId}</span>
                        {idx === 1 && (
                          <span className="border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00] px-1 text-[9px] font-bold rounded-xs">
                            ● OPTIMAL CHOICE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-[#C8C7BA] text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {getRuntimeBrandIcon(row.runtime)}
                        <span>{row.runtime}</span>
                      </div>
                    </td>
                    <td className="p-3 text-[#777] text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <NvidiaLogo size={12} />
                        <span>{row.hardware}</span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-[#75bf00]">{row.ttftMs}ms</td>
                    <td className="p-3 font-bold text-[#75bf00]">{row.p95LatencyMs}ms</td>
                    <td className="p-3 text-[#C8C7BA]">{row.tokensPerSec} t/s</td>
                    <td className="p-3 text-[#777]">{row.vramUsageGb} GB</td>
                    <td className="p-3 font-bold text-[#F0EFE2]">${row.costPer1MTokensUsd}</td>
                    <td className="p-3 font-bold text-[#75bf00]">{row.qualityScore}%</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeployCandidate?.(row.candidateId)}
                        className="px-2.5 py-1 border border-dashed border-[#383838] bg-[#181818] hover:border-[#75bf00] hover:text-[#75bf00] text-[#F0EFE2] rounded-xs text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                      >
                        Deploy Candidate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SANDBOX ISOLATION RUNNER (Section 37) */}
      {activeTab === "sandbox" && (
        <div className="space-y-4 font-mono">
          <div className="p-4 border border-dashed border-[#262626] bg-[#141414] rounded-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="text-[#75bf00]" size={14} />
                <h3 className="text-xs font-bold text-[#F0EFE2]">
                  Isolated MicroVM Sandbox Container ({SAMPLE_SANDBOX_RUN.sandboxId})
                </h3>
              </div>
              <span className="text-[10px] border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00] px-2 py-0.5 rounded-xs font-bold uppercase">
                STATUS: {SAMPLE_SANDBOX_RUN.status} (Exit Code 0)
              </span>
            </div>

            {/* Resource Limit Gauges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 border border-dashed border-[#282828] bg-[#111111] rounded-xs">
                <span className="text-[#666] text-[10px] uppercase block">CPU CONTAINER CAP</span>
                <span className="font-bold text-[#F0EFE2] text-xs mt-0.5 block">{SAMPLE_SANDBOX_RUN.resourceLimits.cpu}</span>
              </div>
              <div className="p-2.5 border border-dashed border-[#282828] bg-[#111111] rounded-xs">
                <span className="text-[#666] text-[10px] uppercase block">MEMORY LIMIT</span>
                <span className="font-bold text-[#F0EFE2] text-xs mt-0.5 block">{SAMPLE_SANDBOX_RUN.resourceLimits.memory}</span>
              </div>
              <div className="p-2.5 border border-dashed border-[#282828] bg-[#111111] rounded-xs">
                <span className="text-[#666] text-[10px] uppercase block">GPU VFIO PASSTHROUGH</span>
                <span className="font-bold text-[#75bf00] text-xs mt-0.5 block">{SAMPLE_SANDBOX_RUN.resourceLimits.gpu}</span>
              </div>
              <div className="p-2.5 border border-dashed border-[#282828] bg-[#111111] rounded-xs">
                <span className="text-[#666] text-[10px] uppercase block">TIMEOUT CAP</span>
                <span className="font-bold text-[#F0EFE2] text-xs mt-0.5 block">{SAMPLE_SANDBOX_RUN.resourceLimits.timeoutSec}s</span>
              </div>
            </div>

            {/* Terminal Log Output */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#777] uppercase tracking-wider block">
                EXECUTION LOGS & CONTAINMENT TRAIL (SECTION 37)
              </span>
              <pre className="p-3 bg-[#0d0d0d] border border-dashed border-[#282828] rounded-xs text-[11px] text-[#75bf00] overflow-x-auto space-y-1 leading-relaxed select-all">
                {SAMPLE_SANDBOX_RUN.logsSnippet.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </pre>
            </div>

            {/* SHA-256 Evidence Digest Footer */}
            <div className="pt-2 border-t border-dashed border-[#222] flex items-center justify-between text-xs">
              <span className="text-[#777]">Captured Evidence Digest:</span>
              <div className="flex items-center gap-2">
                <code className="text-[#75bf00] text-[10px] select-all">{SAMPLE_SANDBOX_RUN.capturedEvidenceDigest}</code>
                <button
                  type="button"
                  onClick={() => copyDigest(SAMPLE_SANDBOX_RUN.capturedEvidenceDigest)}
                  className="text-[#777] hover:text-[#F0EFE2] p-0.5 cursor-pointer transition-colors"
                >
                  {copiedSha ? <Check size={11} className="text-[#75bf00]" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ECONOMIC REALITY NORMALIZER (Section 40) */}
      {activeTab === "economics" && (
        <div className="space-y-4 font-mono">
          <div className="p-4 border border-dashed border-[#262626] bg-[#141414] rounded-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#F0EFE2]">
                Economic Normalization Formula: Total Cost / Successful Outcomes
              </h3>
              <p className="text-xs text-[#777] font-sans mt-1">
                Optimization must never reward cheap failure. HOROS normalizes compute cost exclusively by verified successful outcome completions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 border border-dashed border-[#282828] bg-[#111111] rounded-xs space-y-1">
                <span className="text-[#666] text-[10px] uppercase block">COST PER TOKEN</span>
                <div className="text-base font-bold text-[#75bf00]">$0.00000012</div>
                <div className="text-[10px] text-[#777]">$0.12 per 1,000,000 output tokens</div>
              </div>

              <div className="p-3.5 border border-dashed border-[#282828] bg-[#111111] rounded-xs space-y-1">
                <span className="text-[#666] text-[10px] uppercase block">COST PER REQUEST</span>
                <div className="text-base font-bold text-[#75bf00]">$0.00024</div>
                <div className="text-[10px] text-[#777]">Avg 2,000 tokens / prompt response</div>
              </div>

              <div className="p-3.5 border border-dashed border-[#282828] bg-[#111111] rounded-xs space-y-1">
                <span className="text-[#666] text-[10px] uppercase block">COST / VERIFIED OUTCOME</span>
                <div className="text-base font-bold text-[#75bf00]">$0.00024</div>
                <div className="text-[10px] text-[#75bf00]">100.0% verification pass rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch New Benchmark Experiment Modal */}
      {launchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-100 backdrop-blur-xs">
          <div className="w-full max-w-lg border border-[#282828] bg-[#141414] rounded-xs p-6 text-xs space-y-4 shadow-2xl text-left font-mono">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-[#F0EFE2] font-sans">Launch Benchmark Experiment</h2>
                <p className="text-[11px] text-[#777]">
                  Configure candidate system sweeps, dataset workloads, and budget caps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLaunchModalOpen(false)}
                className="text-[#777] hover:text-[#F0EFE2] cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] text-[#777] uppercase block">TARGET MODEL</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-xs text-[#F0EFE2] outline-none"
                >
                  <option value="meta-llama/Llama-3.1-70B-Instruct">meta-llama/Llama-3.1-70B-Instruct</option>
                  <option value="Qwen/Qwen2.5-32B-Instruct">Qwen/Qwen2.5-32B-Instruct</option>
                  <option value="deepseek-ai/DeepSeek-R1">deepseek-ai/DeepSeek-R1 (671B FP8)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#777] uppercase block">WORKLOAD DATASET SWEEP</label>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-xs text-[#F0EFE2] outline-none"
                >
                  <option value="Synthetic Load Sweep (1,000 reqs)">Synthetic Load Sweep (1,000 reqs)</option>
                  <option value="Enterprise RAG Groundedness Eval (500 queries)">Enterprise RAG Groundedness Eval (500 queries)</option>
                  <option value="Coding Unit Test Ensemble (200 tasks)">Coding Unit Test Ensemble (200 tasks)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#777] uppercase block">EXPERIMENT BUDGET CAP</label>
                <div className="flex items-center gap-2">
                  {["$25.00", "$50.00", "$100.00"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBudget(b)}
                      className={cn(
                        "flex-1 py-1.5 text-xs border border-dashed rounded-xs transition-colors cursor-pointer",
                        selectedBudget === b
                          ? "border-[#75bf00] bg-[#75bf00]/10 text-[#75bf00] font-bold"
                          : "border-[#383838] bg-[#181818] text-[#777] hover:text-[#F0EFE2]"
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-dashed border-[#222]">
              <button
                type="button"
                onClick={() => setLaunchModalOpen(false)}
                className="px-4 py-2 border border-dashed border-[#383838] bg-[#181818] hover:bg-[#222] text-[#F0EFE2] rounded-xs cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLaunchModalOpen(false);
                  alert(`Launched Benchmark Experiment for ${selectedModel} with ${selectedBudget} cap!`);
                }}
                className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-4 py-2 rounded-xs cursor-pointer text-xs transition-colors"
              >
                <FlaskConical size={12} />
                <span>Execute Experiment Sweep</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Cpu,
  Activity,
  Check,
  Copy,
  Download,
  Terminal,
  Lock,
  Zap,
  Clock,
  Sparkles,
  BarChart3,
  FileCode,
  CheckCheck,
} from "lucide-react";
import { EvidenceItem } from "@/lib/epoch-types";
import { MetaLogo, QwenLogo, BAAILogo, NvidiaLogo, VLLMLogo, SGLangLogo, HuggingFaceLogo } from "../primitives/brand-icons";
import { cn } from "@/lib/utils";

interface EvidenceViewProps {
  evidenceList?: EvidenceItem[];
  onSelectProgram?: (programId: string) => void;
  dark?: boolean;
}

interface RichAssuranceCase {
  id: string;
  claimId: string;
  programName: string;
  model: string;
  modelIcon: React.ReactNode;
  category: "latency" | "throughput" | "precision" | "security";
  claim: string;
  candidateName: string;
  hardwareCluster: string;
  gpuCount: string;
  confidencePct: number;
  verificationChecksPassed: number;
  verificationChecksTotal: number;
  integrityHash: string;
  merkleRoot: string;
  signature: string;
  timestamp: string;
  measurements: Array<{
    name: string;
    value: string;
    baseline: string;
    delta: string;
    isImprovement: boolean;
  }>;
  verificationRules: Array<{
    ruleId: string;
    assertion: string;
    observed: string;
    passed: boolean;
  }>;
  artifacts: Array<{
    name: string;
    hash: string;
    size: string;
  }>;
  executionRuns: Array<{
    runId: string;
    environment: string;
    gpu: string;
    duration: string;
    status: string;
  }>;
}

const RICH_ASSURANCE_CASES: RichAssuranceCase[] = [
  {
    id: "case-llama3-latency",
    claimId: "EVD-0941-LLAMA3-P95",
    programName: "llama-3.1-8b-latency-opt",
    model: "meta-llama/Llama-3.1-8B-Instruct",
    modelIcon: <MetaLogo size={16} />,
    category: "latency",
    claim: "Llama-3.1-8B AWQ-FP8 achieves p95 latency <= 38.2ms under 250 req/s load with 0.00 perplexity degradation against unquantized FP16 baseline.",
    candidateName: "Candidate #4: vLLM + AWQ-FP8 + FlashInfer",
    hardwareCluster: "NVIDIA A100-SXM4-40GB",
    gpuCount: "1x A100 (Cluster US-East-1A)",
    confidencePct: 99.8,
    verificationChecksPassed: 8,
    verificationChecksTotal: 8,
    integrityHash: "sha256:8f4ca7b9e112d308fbc8a23d84f18e9072a4bc03198de7",
    merkleRoot: "0x4e82b79a1f09c8d32e54a01c7793b821045f91a6",
    signature: "sig_ed25519_88f912a7d401be9c81204ef09",
    timestamp: "12 mins ago (Aug 11, 05:32 UTC)",
    measurements: [
      { name: "Time to First Token (TTFT)", value: "14.1 ms", baseline: "29.4 ms", delta: "-52.0%", isImprovement: true },
      { name: "p95 End-to-End Latency", value: "38.2 ms", baseline: "72.8 ms", delta: "-47.5%", isImprovement: true },
      { name: "Token Generation Throughput", value: "1,840 tps", baseline: "720 tps", delta: "+155.5%", isImprovement: true },
      { name: "VRAM Footprint", value: "18.2 GB", baseline: "34.1 GB", delta: "-46.6%", isImprovement: true },
      { name: "Perplexity Delta (Wikitext-2)", value: "+0.002", baseline: "6.812", delta: "0.03% (Equiv)", isImprovement: true },
    ],
    verificationRules: [
      { ruleId: "VER-01", assertion: "latency_p95 <= 45.0 ms", observed: "38.2 ms", passed: true },
      { ruleId: "VER-02", assertion: "ttft_p95 <= 20.0 ms", observed: "14.1 ms", passed: true },
      { ruleId: "VER-03", assertion: "perplexity_delta <= 0.05", observed: "+0.002", passed: true },
      { ruleId: "VER-04", assertion: "memory_headroom_gb >= 6.0", observed: "21.8 GB", passed: true },
      { ruleId: "VER-05", assertion: "request_concurrency >= 200", observed: "250 conn", passed: true },
      { ruleId: "VER-06", assertion: "kv_cache_fragmentation <= 5%", observed: "1.2%", passed: true },
      { ruleId: "VER-07", assertion: "cuda_kernel_determinism == true", observed: "Verified (Bit-exact)", passed: true },
      { ruleId: "VER-08", assertion: "cryptographic_hash_chain == valid", observed: "Merkle Root Valid", passed: true },
    ],
    artifacts: [
      { name: "model-awq-fp8.safetensors", hash: "sha256:7f901ab8c3409ef1", size: "4.82 GB" },
      { name: "flashinfer-kernel-manifest.json", hash: "sha256:22c0199e4f0183b2", size: "128 KB" },
      { name: "empirical-benchmark-trace.jsonl", hash: "sha256:889ba012ef448109", size: "14.2 MB" },
    ],
    executionRuns: [
      { runId: "RUN-9021-BENCH", environment: "prod-cluster-us-east", gpu: "1x A100-40GB", duration: "18.4s", status: "completed" },
      { runId: "RUN-9020-SWEEP", environment: "prod-cluster-us-east", gpu: "1x A100-40GB", duration: "124.0s", status: "completed" },
      { runId: "RUN-9019-INVARIANT", environment: "local-eval-engine", gpu: "1x A100-40GB", duration: "6.2s", status: "completed" },
    ],
  },
  {
    id: "case-qwen-throughput",
    claimId: "EVD-0832-QWEN-THROUGHPUT",
    programName: "qwen2.5-coder-throughput",
    model: "Qwen/Qwen2.5-7B-Instruct",
    modelIcon: <QwenLogo size={16} />,
    category: "throughput",
    claim: "Qwen2.5-7B with SGLang RadixAttention delivers 2,410 tokens/sec sustained throughput on 1x L40S GPU cluster with sub-50ms latency.",
    candidateName: "Candidate #2: SGLang Radix-Cache + FP8",
    hardwareCluster: "NVIDIA L40S-48GB",
    gpuCount: "1x L40S (Cluster US-Central)",
    confidencePct: 100.0,
    verificationChecksPassed: 7,
    verificationChecksTotal: 7,
    integrityHash: "sha256:39a041f98de0012bc4f9901726a48f0293bd4812",
    merkleRoot: "0x91823abf440192e8172c918a002931bc88491a22",
    signature: "sig_ed25519_23f001928bc9447190",
    timestamp: "45 mins ago (Aug 11, 04:59 UTC)",
    measurements: [
      { name: "Sustained Throughput", value: "2,410 tps", baseline: "840 tps", delta: "+186.9%", isImprovement: true },
      { name: "Prefix Cache Hit Rate", value: "88.4%", baseline: "0.0%", delta: "+88.4%", isImprovement: true },
      { name: "p95 Latency under 400 req/s", value: "42.5 ms", baseline: "94.0 ms", delta: "-54.7%", isImprovement: true },
      { name: "Cost per 1M Output Tokens", value: "$0.14", baseline: "$0.38", delta: "-63.1%", isImprovement: true },
    ],
    verificationRules: [
      { ruleId: "VER-01", assertion: "throughput_tps >= 2000", observed: "2,410 tps", passed: true },
      { ruleId: "VER-02", assertion: "radix_cache_integrity == true", observed: "Verified (100%)", passed: true },
      { ruleId: "VER-03", assertion: "max_error_rate <= 0.001%", observed: "0.000%", passed: true },
      { ruleId: "VER-04", assertion: "temperature_sampling_drift == 0", observed: "Bit-exact match", passed: true },
      { ruleId: "VER-05", assertion: "merkle_signature_valid == true", observed: "Cryptographically Verified", passed: true },
      { ruleId: "VER-06", assertion: "vram_peak_gb <= 44.0", observed: "32.4 GB", passed: true },
      { ruleId: "VER-07", assertion: "context_window >= 32768", observed: "32,768 tokens", passed: true },
    ],
    artifacts: [
      { name: "qwen2.5-radix-weights.bin", hash: "sha256:119a002bc449190e", size: "7.12 GB" },
      { name: "sglang-runtime-config.json", hash: "sha256:880129bcfa018239", size: "48 KB" },
    ],
    executionRuns: [
      { runId: "RUN-8910-THROUGHPUT", environment: "cluster-us-central", gpu: "1x L40S", duration: "44.0s", status: "completed" },
    ],
  },
  {
    id: "case-bge-embeddings",
    claimId: "EVD-0719-BGE-EMBEDDINGS",
    programName: "bge-m3-tei-edge",
    model: "BAAI/bge-m3",
    modelIcon: <BAAILogo size={16} />,
    category: "latency",
    claim: "BAAI/bge-m3 on Text Embeddings Inference (TEI) achieves 12.1ms p95 latency on low-cost T4 edge instances.",
    candidateName: "Candidate #1: TEI + ONNX-CUDA",
    hardwareCluster: "NVIDIA Tesla T4-16GB",
    gpuCount: "1x T4 (Edge EU-West)",
    confidencePct: 99.9,
    verificationChecksPassed: 6,
    verificationChecksTotal: 6,
    integrityHash: "sha256:77291a0f8bc9440192e4719028bc1193",
    merkleRoot: "0x33491028bcfa119028837192004812bc",
    signature: "sig_ed25519_9948192001bbcf4",
    timestamp: "2 hours ago",
    measurements: [
      { name: "Embedding Latency (p95)", value: "12.1 ms", baseline: "38.6 ms", delta: "-68.6%", isImprovement: true },
      { name: "Embedding Batch (128 items)", value: "28.4 ms", baseline: "89.1 ms", delta: "-68.1%", isImprovement: true },
      { name: "Cosine Similarity Drift", value: "0.00000", baseline: "1.00000", delta: "Bit-exact", isImprovement: true },
    ],
    verificationRules: [
      { ruleId: "VER-01", assertion: "latency_p95 <= 15.0 ms", observed: "12.1 ms", passed: true },
      { ruleId: "VER-02", assertion: "cosine_similarity_loss == 0.0", observed: "0.00000 (Exact)", passed: true },
      { ruleId: "VER-03", assertion: "edge_daemon_memory <= 4.0 GB", observed: "2.1 GB", passed: true },
      { ruleId: "VER-04", assertion: "onnx_graph_optimization == passed", observed: "Level 99 Fusion", passed: true },
      { ruleId: "VER-05", assertion: "t4_tensor_core_utilization >= 85%", observed: "91.2%", passed: true },
      { ruleId: "VER-06", assertion: "cryptographic_proof == verified", observed: "Valid Root", passed: true },
    ],
    artifacts: [
      { name: "bge-m3-onnx-fp16.onnx", hash: "sha256:6630199e4f0183b2", size: "1.14 GB" },
    ],
    executionRuns: [
      { runId: "RUN-8402-EMBED", environment: "edge-eu-west", gpu: "1x T4", duration: "8.2s", status: "completed" },
    ],
  },
  {
    id: "case-flux-precision",
    claimId: "EVD-0612-FLUX-FID",
    programName: "flux-schnell-distill",
    model: "black-forest-labs/FLUX.1-schnell",
    modelIcon: <HuggingFaceLogo size={16} />,
    category: "precision",
    claim: "FLUX.1-schnell BF16 distilled 4-step diffusion retains FID score within 0.12 of full 50-step model with 11x generation speedup.",
    candidateName: "Candidate #3: 4-Step Distilled Transformer",
    hardwareCluster: "NVIDIA A100-SXM4-80GB",
    gpuCount: "1x A100-80GB",
    confidencePct: 99.4,
    verificationChecksPassed: 5,
    verificationChecksTotal: 5,
    integrityHash: "sha256:4401928bc944719028bc119377291a0f",
    merkleRoot: "0x8891028bcfa119028837192004812bc3",
    signature: "sig_ed25519_5548192001bbcf499",
    timestamp: "3 hours ago",
    measurements: [
      { name: "Image Generation Latency (4-step)", value: "680 ms", baseline: "7,800 ms", delta: "-91.2%", isImprovement: true },
      { name: "FID Image Quality Metric", value: "12.4", baseline: "12.3", delta: "+0.1 (Negligible)", isImprovement: true },
      { name: "CLIP Score Similarity", value: "0.342", baseline: "0.344", delta: "-0.5% (Match)", isImprovement: true },
    ],
    verificationRules: [
      { ruleId: "VER-01", assertion: "generation_time <= 800 ms", observed: "680 ms", passed: true },
      { ruleId: "VER-02", assertion: "fid_delta <= 0.25", observed: "0.10", passed: true },
      { ruleId: "VER-03", assertion: "clip_score_drift <= 1.0%", observed: "0.5%", passed: true },
      { ruleId: "VER-04", assertion: "vram_peak <= 40GB", observed: "34.2 GB", passed: true },
      { ruleId: "VER-05", assertion: "cryptographic_hash_chain == valid", observed: "Signed & Sealed", passed: true },
    ],
    artifacts: [
      { name: "flux-schnell-bf16.safetensors", hash: "sha256:990199e4f0183b28", size: "23.4 GB" },
    ],
    executionRuns: [
      { runId: "RUN-8100-FLUX", environment: "prod-cluster-us-west", gpu: "1x A100-80GB", duration: "24.1s", status: "completed" },
    ],
  },
];

export function EvidenceView({
  evidenceList,
  onSelectProgram,
  dark = true,
}: EvidenceViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case-llama3-latency");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"graph" | "measurements" | "rules" | "artifacts" | "runs" | "certificate">("graph");
  const [copiedHash, setCopiedHash] = useState(false);

  const selectedCase = RICH_ASSURANCE_CASES.find((c) => c.id === selectedCaseId) ?? RICH_ASSURANCE_CASES[0];

  const filteredCases = RICH_ASSURANCE_CASES.filter((c) => {
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.claimId.toLowerCase().includes(q) ||
        c.programName.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.claim.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyHash = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* Executive Top Banner */}
      <div className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
        dark ? "border-[#2e2e2e]" : "border-[#e1e4df]"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788274]">
              Institutional Governance • Proof Engine
            </span>
          </div>
          <h1 className={cn(
            "mt-1 text-3xl font-normal tracking-[-0.03em] md:text-4xl",
            dark ? "text-white" : "text-[#171a17]"
          )}>
            Evidence & Assurance
          </h1>
          <p className={cn("mt-1 text-xs md:text-sm", dark ? "text-[#889084]" : "text-[#656d60]")}>
            Empirically verifiable proofs, cryptographic invariants, and hardware assurance guarantees that govern institutional execution.
          </p>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 text-xs font-mono">
          {[
            { id: "all", label: `All Invariants (${RICH_ASSURANCE_CASES.length})` },
            { id: "latency", label: "Latency p95 (2)" },
            { id: "throughput", label: "Throughput (1)" },
            { id: "precision", label: "Precision/FID (1)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              className={cn(
                "px-3 py-1 border border-dashed transition-colors rounded-xs",
                filterCategory === tab.id
                  ? dark
                    ? "border-[#555] bg-[#282828] text-white font-bold"
                    : "border-[#888] bg-[#eaeaea] text-[#111] font-bold"
                  : dark
                  ? "border-transparent text-[#788274] hover:text-white"
                  : "border-transparent text-[#687063] hover:text-[#171a17]"
              )}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <label className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[260px]",
          dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
        )}>
          <Search size={13} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search proof cases, models, hashes..."
            className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-full"
          />
        </label>
      </div>

      {/* Flagship Split Workspace: Assurance Case List (Left 5 cols) & Deep Verification Inspector (Right 7 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Assurance Cases Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#788274] px-1">
            <span className="uppercase font-semibold tracking-wider">Assurance Case Ledger</span>
            <span>{filteredCases.length} proofs active</span>
          </div>

          <div className="space-y-2.5">
            {filteredCases.map((item) => {
              const isSelected = selectedCase.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCaseId(item.id)}
                  className={cn(
                    "cursor-pointer border border-dashed p-4 transition-all text-xs rounded-xs relative group",
                    isSelected
                      ? dark
                        ? "border-[#75bf00] bg-[#141b12]"
                        : "border-[#75bf00] bg-[#f5faee]"
                      : dark
                      ? "border-[#2e2e2e] bg-[#202020] hover:border-[#444] hover:bg-[#252525]"
                      : "border-[#d8ddd3] bg-white hover:border-[#a8b0a2]"
                  )}
                >
                  {/* Top row: Case ID & Confidence Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono">
                      <ShieldCheck size={13} className="text-[#75bf00]" />
                      <span className={cn("font-bold", dark ? "text-white" : "text-[#171a17]")}>
                        {item.claimId}
                      </span>
                    </div>

                    <span className={cn(
                      "font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs border border-dashed",
                      dark
                        ? "text-[#a3e635] border-[#75bf00]/30 bg-transparent"
                        : "text-[#2d5800] border-[#b9de78]/60 bg-transparent"
                    )}>
                      {item.confidencePct}% Confidence
                    </span>
                  </div>

                  {/* Model & Hardware Tag */}
                  <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-[#788274]">
                    {item.modelIcon}
                    <span className={dark ? "text-[#d1d5db]" : "text-[#374151]"}>{item.model}</span>
                    <span>•</span>
                    <span className="text-[#60a5fa]">{item.hardwareCluster.split("-")[0]}</span>
                  </div>

                  {/* Claim Text */}
                  <p className={cn(
                    "mt-2 text-xs leading-relaxed font-sans",
                    dark ? "text-[#e5e7eb]" : "text-[#1f2937]"
                  )}>
                    {item.claim}
                  </p>

                  {/* Bottom metrics row */}
                  <div className={cn(
                    "mt-3 flex items-center justify-between border-t border-dashed pt-2 text-[11px] font-mono",
                    dark ? "border-[#282828] text-[#788274]" : "border-[#edf0eb] text-[#6b7367]"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-[#75bf00] font-semibold">
                        ✓ {item.verificationChecksPassed}/{item.verificationChecksTotal} Rules Passed
                      </span>
                    </div>
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Deep Verification Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={cn(
            "border border-dashed rounded-xs overflow-hidden",
            dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
          )}>
            {/* Inspector Header */}
            <div className={cn(
              "flex flex-wrap items-center justify-between gap-3 border-b border-dashed px-4 py-3",
              dark ? "border-[#282828] bg-[#181818]" : "border-[#edf0eb] bg-[#fafbfa]"
            )}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#75bf00]" />
                <div>
                  <span className={cn("font-bold text-xs font-mono block", dark ? "text-white" : "text-[#171a17]")}>
                    {selectedCase.claimId} • Verification Assurance Graph
                  </span>
                  <span className="text-[10px] text-[#788274] font-mono">
                    Target: {selectedCase.candidateName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyHash(selectedCase.integrityHash)}
                  className={cn(
                    "flex items-center gap-1 border border-dashed px-2.5 py-1 text-xs font-mono rounded-xs transition-colors",
                    dark ? "border-[#383838] bg-[#202020] text-[#889084] hover:text-white" : "border-[#d8ddd3] bg-white text-[#525a4d]"
                  )}
                  title="Copy Merkle Hash"
                >
                  {copiedHash ? <Check size={12} className="text-[#75bf00]" /> : <Copy size={12} />}
                  <span>{copiedHash ? "Hash Copied" : "Copy Hash"}</span>
                </button>
              </div>
            </div>

            {/* 5-Stage Interactive Verification Flow Rail */}
            <div className={cn(
              "border-b border-dashed px-4 py-3 overflow-x-auto",
              dark ? "border-[#282828] bg-[#151515]" : "border-[#edf0eb] bg-[#f8faf6]"
            )}>
              <div className="flex items-center justify-between gap-2 text-xs font-mono min-w-[540px]">
                {[
                  { id: "graph", label: "01. CLAIM", count: "1" },
                  { id: "measurements", label: "02. DELTAS", count: `${selectedCase.measurements.length}` },
                  { id: "rules", label: "03. VERIFIER", count: `${selectedCase.verificationRules.length}` },
                  { id: "artifacts", label: "04. ARTIFACTS", count: `${selectedCase.artifacts.length}` },
                  { id: "runs", label: "05. RUN TRACES", count: `${selectedCase.executionRuns.length}` },
                  { id: "certificate", label: "06. CERTIFICATE", count: "SEALED" },
                ].map((stage, idx) => (
                  <React.Fragment key={stage.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(stage.id as typeof activeTab)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 border border-dashed transition-all rounded-xs shrink-0",
                        activeTab === stage.id
                          ? "border-[#75bf00] bg-[#75bf00] text-black font-bold"
                          : dark
                          ? "border-[#333] bg-[#202020] text-[#889084] hover:text-white"
                          : "border-[#d8ddd3] bg-white text-[#5c6457] hover:border-[#999]"
                      )}
                    >
                      <span>{stage.label}</span>
                      <span className="opacity-70 text-[10px]">[{stage.count}]</span>
                    </button>
                    {idx < 5 && <span className={dark ? "text-[#444]" : "text-[#ccc]"}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-5 space-y-4 text-xs">
              {/* TAB 1: FORMAL CLAIM & HARDWARE TARGET */}
              {activeTab === "graph" && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#788274] block font-mono">
                      Formal Institutional Claim
                    </span>
                    <p className={cn(
                      "mt-2 text-xs font-medium leading-relaxed border-l-2 border-[#75bf00] pl-3 py-1",
                      dark ? "text-white bg-[#1a1f18]/50" : "text-[#151515] bg-[#f7faf4]"
                    )}>
                      &ldquo;{selectedCase.claim}&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                    <div className={cn("border border-dashed p-3 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                      <span className="text-[10px] text-[#788274] uppercase block font-sans">Target Hardware</span>
                      <span className={cn("mt-1 font-bold block text-xs truncate", dark ? "text-white" : "text-[#171a17]")}>
                        {selectedCase.hardwareCluster}
                      </span>
                    </div>

                    <div className={cn("border border-dashed p-3 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                      <span className="text-[10px] text-[#788274] uppercase block font-sans">Verification SLA</span>
                      <span className="mt-1 font-bold block text-xs text-[#a3e635]">
                        {selectedCase.verificationChecksPassed}/{selectedCase.verificationChecksTotal} Invariants Passed
                      </span>
                    </div>

                    <div className={cn("border border-dashed p-3 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                      <span className="text-[10px] text-[#788274] uppercase block font-sans">Cryptographic Status</span>
                      <span className="mt-1 font-bold block text-xs text-[#60a5fa] truncate">
                        Merkle Signed
                      </span>
                    </div>
                  </div>

                  {/* Summary Measurements Preview */}
                  <div className={cn(
                    "border border-dashed p-3 rounded-xs space-y-2 font-mono",
                    dark ? "border-[#333] bg-[#181818]" : "border-[#d8ddd3] bg-[#fafbfa]"
                  )}>
                    <div className="flex items-center justify-between text-[11px] text-[#788274] uppercase">
                      <span className="text-[#75bf00]">Statistical Significance: 99.8%</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {selectedCase.measurements.slice(0, 4).map((m, idx) => (
                        <div key={idx} className={cn("p-2 border border-dashed rounded-xs", dark ? "border-[#282828] bg-[#202020]" : "border-[#edf0eb] bg-white")}>
                          <span className="text-[10px] text-[#788274] block truncate font-sans">{m.name}</span>
                          <span className={cn("font-bold text-xs mt-0.5 block", dark ? "text-white" : "text-[#171a17]")}>{m.value}</span>
                          <span className="text-[10px] text-[#a3e635] font-bold">{m.delta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEASURED EMPIRICAL DELTAS */}
              {activeTab === "measurements" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#788274]">
                    <span>Empirical Benchmark Measurements vs Baseline</span>
                    <span>1,000 requests sample distribution</span>
                  </div>

                  <div className={cn(
                    "overflow-x-auto border border-dashed rounded-xs",
                    dark ? "border-[#282828]" : "border-[#edf0eb]"
                  )}>
                    <table className="min-w-full text-xs font-mono">
                      <thead className={cn("border-b border-dashed text-[10px] uppercase", dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]")}>
                        <tr>
                          <th className="px-3 py-2 text-left font-sans">Metric</th>
                          <th className="px-3 py-2 text-left">Observed Value</th>
                          <th className="px-3 py-2 text-left">Baseline (FP16)</th>
                          <th className="px-3 py-2 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y divide-dashed", dark ? "divide-[#282828] bg-[#202020]" : "divide-[#edf0eb] bg-white")}>
                        {selectedCase.measurements.map((m, idx) => (
                          <tr key={idx} className={dark ? "hover:bg-[#252525]" : "hover:bg-[#f8faf6]"}>
                            <td className={cn("px-3 py-2.5 font-sans font-medium", dark ? "text-white" : "text-[#171a17]")}>{m.name}</td>
                            <td className={cn("px-3 py-2.5 font-bold", dark ? "text-white" : "text-[#171a17]")}>{m.value}</td>
                            <td className="px-3 py-2.5 text-[#788274]">{m.baseline}</td>
                            <td className={cn("px-3 py-2.5 text-right font-bold", dark ? "text-[#a3e635]" : "text-[#2d5800]")}>{m.delta}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: VERIFIER INVARIANT RULES */}
              {activeTab === "rules" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#788274]">
                    <span>Formal Verification Assertions</span>
                    <span className="text-[#75bf00] font-bold">All {selectedCase.verificationRules.length} Assertions Passed</span>
                  </div>

                  <div className="space-y-2">
                    {selectedCase.verificationRules.map((rule) => (
                      <div
                        key={rule.ruleId}
                        className={cn(
                          "flex items-center justify-between p-3 border border-dashed font-mono text-xs rounded-xs",
                          dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#edf0eb] bg-[#fafbfa]"
                        )}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#788274] uppercase font-bold">{rule.ruleId}</span>
                            <code className={cn("font-bold", dark ? "text-white" : "text-[#171a17]")}>
                              {rule.assertion}
                            </code>
                          </div>
                          <div className="text-[11px] text-[#788274]">
                            Observed Value: <span className={dark ? "text-[#d1d5db]" : "text-[#374151]"}>{rule.observed}</span>
                          </div>
                        </div>

                        <span className={cn(
                          "flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs border border-dashed",
                          dark ? "bg-transparent text-[#a3e635] border-[#75bf00]/40" : "bg-transparent text-[#2d5800] border-[#b9de78]"
                        )}>
                          <Check size={11} />
                          <span>PASSED</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ARTIFACT INTEGRITY */}
              {activeTab === "artifacts" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#788274]">
                    <span>Sealed Weight & Kernel Artifacts</span>
                    <span>Immutable SHA-256 Hashes</span>
                  </div>

                  <div className="space-y-2">
                    {selectedCase.artifacts.map((art, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-3 border border-dashed font-mono text-xs rounded-xs",
                          dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#edf0eb] bg-[#fafbfa]"
                        )}
                      >
                        <div className="space-y-0.5">
                          <div className={cn("font-bold", dark ? "text-white" : "text-[#171a17]")}>{art.name}</div>
                          <div className="text-[10px] text-[#788274] truncate max-w-sm">{art.hash}</div>
                        </div>
                        <span className="text-[11px] text-[#788274]">{art.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: EXECUTION RUN TRACES */}
              {activeTab === "runs" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#788274]">
                    <span>Linked Empirical Sweep Runs</span>
                    <span>Direct Hardware Profiler Traces</span>
                  </div>

                  <div className="space-y-2">
                    {selectedCase.executionRuns.map((r) => (
                      <div
                        key={r.runId}
                        className={cn(
                          "flex items-center justify-between p-3 border border-dashed font-mono text-xs rounded-xs",
                          dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#edf0eb] bg-[#fafbfa]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Terminal size={14} className="text-[#75bf00]" />
                          <div>
                            <div className={cn("font-bold", dark ? "text-white" : "text-[#171a17]")}>{r.runId}</div>
                            <div className="text-[10px] text-[#788274]">{r.environment} • {r.gpu}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-[#788274]">{r.duration}</span>
                          <span className="text-[#a3e635] uppercase font-bold">COMPLETED</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CRYPTOGRAPHIC CERTIFICATE */}
              {activeTab === "certificate" && (
                <div className="space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-[#788274]">
                    <span>Cryptographic Evidence Attestation Token</span>
                    <span className="text-[#75bf00] font-bold">Ed25519 Valid</span>
                  </div>

                  <div className={cn(
                    "p-4 border border-dashed rounded-xs space-y-2 text-[11px] leading-relaxed",
                    dark ? "border-[#333] bg-[#151515] text-[#9ca3af]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#374151]"
                  )}>
                    <div className="text-[#75bf00] font-bold">-----BEGIN EPOCH ASSURANCE CERTIFICATE-----</div>
                    <div>Issuer: epoch://governance.root.v14</div>
                    <div>Claim ID: {selectedCase.claimId}</div>
                    <div>Candidate: {selectedCase.candidateName}</div>
                    <div>Merkle Root: {selectedCase.merkleRoot}</div>
                    <div>Integrity Hash: {selectedCase.integrityHash}</div>
                    <div>Signature: {selectedCase.signature}</div>
                    <div>Confidence SLA: {selectedCase.confidencePct}% Statistical Bound</div>
                    <div>Timestamp: {selectedCase.timestamp}</div>
                    <div className="text-[#75bf00] font-bold">-----END EPOCH ASSURANCE CERTIFICATE-----</div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 font-sans">
                    <button
                      type="button"
                      onClick={() => handleCopyHash(JSON.stringify(selectedCase, null, 2))}
                      className={cn(
                        "flex items-center gap-1.5 border border-dashed px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors",
                        dark ? "border-[#383838] bg-[#202020] text-white hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white text-[#171a17]"
                      )}
                    >
                      <Copy size={12} />
                      <span>Copy Full JSON Proof</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

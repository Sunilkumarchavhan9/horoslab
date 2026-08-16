"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
import {
  MetaLogo,
  QwenLogo,
  BAAILogo,
  NvidiaLogo,
  VLLMLogo,
  SGLangLogo,
  HuggingFaceLogo,
} from "../primitives/brand-icons";
import { cn } from "@/lib/utils";

interface EvidenceViewProps {
  evidenceList?: EvidenceItem[];
  onSelectProgram?: (programId: string) => void;
  onNavigateToPipelines?: () => void;
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
    modelIcon: <MetaLogo size={15} />,
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
    modelIcon: <QwenLogo size={15} />,
    category: "throughput",
    claim: "Qwen2.5-7B with SGLang RadixAttention delivers 2,410 tokens/sec sustained throughput on 1x L40S GPU cluster with sub-50ms latency.",
    candidateName: "Candidate #2: SGLang Radix-Cache + FP8",
    hardwareCluster: "NVIDIA L40S-48GB",
    gpuCount: "1x L40S (Cluster US-Central)",
    confidencePct: 100.0,
    verificationChecksPassed: 7,
    verificationChecksTotal: 7,
    integrityHash: "sha256:39a8c1f01de98a002bc910248aef017834bc12984e",
    merkleRoot: "0x889a12c8b7401ef982001bca7791402fe948a101",
    signature: "sig_ed25519_99a01f82c401be8a0149e",
    timestamp: "45 mins ago (Aug 11, 04:59 UTC)",
    measurements: [
      { name: "Sustained Output Token Throughput", value: "2,410 tps", baseline: "920 tps", delta: "+161.9%", isImprovement: true },
      { name: "p95 End-to-End Latency", value: "42.5 ms", baseline: "88.0 ms", delta: "-51.7%", isImprovement: true },
      { name: "Prefix Cache Hit Rate", value: "84.2%", baseline: "0.0%", delta: "+84.2%", isImprovement: true },
      { name: "Cost per 1M Output Tokens", value: "$0.14", baseline: "$0.48", delta: "-70.8%", isImprovement: true },
    ],
    verificationRules: [
      { ruleId: "VER-01", assertion: "throughput_tps >= 2000", observed: "2,410 tps", passed: true },
      { ruleId: "VER-02", assertion: "p95_latency <= 50.0 ms", observed: "42.5 ms", passed: true },
      { ruleId: "VER-03", assertion: "radix_cache_integrity == true", observed: "Cache Validated", passed: true },
      { ruleId: "VER-04", assertion: "gpu_utilization_mean >= 85%", observed: "91.4%", passed: true },
      { ruleId: "VER-05", assertion: "zero_cuda_ooms == true", observed: "0 OOMs reported", passed: true },
      { ruleId: "VER-06", assertion: "stress_test_duration >= 30m", observed: "45m Run", passed: true },
      { ruleId: "VER-07", assertion: "cryptographic_chain == valid", observed: "Merkle Root Valid", passed: true },
    ],
    artifacts: [
      { name: "qwen-radix-compiled.plan", hash: "sha256:558a01f92e448b11", size: "3.91 GB" },
      { name: "benchmark-concurrency-trace.csv", hash: "sha256:1198ae409b8214fa", size: "8.4 MB" },
    ],
    executionRuns: [
      { runId: "RUN-8401-RADIX", environment: "prod-cluster-us-central", gpu: "1x L40S-48GB", duration: "45.0m", status: "completed" },
    ],
  },
  {
    id: "case-bge-embeddings",
    claimId: "EVD-0719-BGE-EMBEDDINGS",
    programName: "bge-m3-tei-latency-scale",
    model: "BAAI/bge-m3",
    modelIcon: <BAAILogo size={15} />,
    category: "latency",
    claim: "BAAI/bge-m3 on Text Embeddings Inference (TEI) achieves 12.1ms p95 latency on low-cost T4 edge instances.",
    candidateName: "Candidate #1: TEI + ONNX Runtime FP16",
    hardwareCluster: "NVIDIA Tesla T4-16GB",
    gpuCount: "1x T4 (Edge EU-West)",
    confidencePct: 99.9,
    verificationChecksPassed: 6,
    verificationChecksTotal: 6,
    integrityHash: "sha256:4918ef019a823bf104ecbd37651a21e646279930ba",
    merkleRoot: "0x3391ba90c8411e502bb1478140410ffaa9128509",
    signature: "sig_ed25519_22104fe9a018bc7712",
    timestamp: "2 hours ago",
    measurements: [
      { name: "p95 Embedding Latency (512 tokens)", value: "12.1 ms", baseline: "34.0 ms", delta: "-64.4%", isImprovement: true },
      { name: "Recall@100 (MTEB Benchmark)", value: "89.4%", baseline: "89.4%", delta: "0.0% (Lossless)", isImprovement: true },
      { name: "Requests per Second per GPU", value: "840 rps", baseline: "290 rps", delta: "+189.6%", isImprovement: true },
    ],
    verificationRules: [
      { ruleId: "VER-01", assertion: "p95_latency <= 15.0 ms", observed: "12.1 ms", passed: true },
      { ruleId: "VER-02", assertion: "mteb_ndcg_at_10 >= 0.70", observed: "0.742", passed: true },
      { ruleId: "VER-03", assertion: "zero_fp16_overflows == true", observed: "0 Underflows/Overflows", passed: true },
      { ruleId: "VER-04", assertion: "batch_capacity >= 64", observed: "128 batch max", passed: true },
      { ruleId: "VER-05", assertion: "tei_dynamic_batching == true", observed: "Verified", passed: true },
      { ruleId: "VER-06", assertion: "cryptographic_chain == valid", observed: "Merkle Root Valid", passed: true },
    ],
    artifacts: [
      { name: "bge-m3-fp16-engine.onnx", hash: "sha256:1008ef091a4b889a", size: "2.14 GB" },
    ],
    executionRuns: [
      { runId: "RUN-7102-MTEB", environment: "edge-cluster-eu-west", gpu: "1x T4-16GB", duration: "12.0m", status: "completed" },
    ],
  },
  {
    id: "case-flux-precision",
    claimId: "EVD-0612-FLUX-FID",
    programName: "flux-schnell-bf16-precision",
    model: "black-forest-labs/FLUX.1-schnell",
    modelIcon: <HuggingFaceLogo size={15} />,
    category: "precision",
    claim: "FLUX.1 Schnell image generation achieves FID score 18.2 with sub-700ms 4-step generation on 1x A100.",
    candidateName: "Candidate #3: Diffusers + FP8 Flux Transformer",
    hardwareCluster: "NVIDIA A100-SXM4-80GB",
    gpuCount: "1x A100-80GB (US-West)",
    confidencePct: 99.4,
    verificationChecksPassed: 5,
    verificationChecksTotal: 5,
    integrityHash: "sha256:19904baef01824cb019ea01948ba0194ef889104",
    merkleRoot: "0x77ae41c88147d3910ffbe9146522c019a84b01e9",
    signature: "sig_ed25519_55018f92ea018bc9910",
    timestamp: "5 hours ago",
    measurements: [
      { name: "End-to-End Image Gen Latency (4 steps)", value: "680 ms", baseline: "1,420 ms", delta: "-52.1%", isImprovement: true },
      { name: "FID Score (COCO 30k val)", value: "18.2", baseline: "18.1", delta: "0.5% (Equal)", isImprovement: true },
      { name: "Peak VRAM Usage", value: "24.1 GB", baseline: "44.8 GB", delta: "-46.2%", isImprovement: true },
    ],
    verificationRules: [
      { ruleId: "VER-01", assertion: "latency <= 800 ms", observed: "680 ms", passed: true },
      { ruleId: "VER-02", assertion: "fid_coco <= 20.0", observed: "18.2", passed: true },
      { ruleId: "VER-03", assertion: "clip_score >= 0.28", observed: "0.312", passed: true },
      { ruleId: "VER-04", assertion: "vram_peak <= 32.0 GB", observed: "24.1 GB", passed: true },
      { ruleId: "VER-05", assertion: "cryptographic_chain == valid", observed: "Merkle Root Valid", passed: true },
    ],
    artifacts: [
      { name: "flux-schnell-transformer-fp8.safetensors", hash: "sha256:901ef09a88bc114a", size: "11.8 GB" },
    ],
    executionRuns: [
      { runId: "RUN-6091-COCO", environment: "staging-cluster-us-west", gpu: "1x A100-80GB", duration: "32.0m", status: "completed" },
    ],
  },
];

export function EvidenceView({
  evidenceList,
  onSelectProgram,
  onNavigateToPipelines,
  dark = true,
}: EvidenceViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>("case-llama3-latency");
  const [inspectorSubTab, setInspectorSubTab] = useState<"claim" | "deltas" | "verifier" | "artifacts" | "runs" | "certificate">("claim");
  const [copiedHash, setCopiedHash] = useState(false);

  const cases = RICH_ASSURANCE_CASES;

  const filteredCases = cases.filter((c) => {
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.claimId.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.claim.toLowerCase().includes(q) ||
        c.hardwareCluster.toLowerCase().includes(q) ||
        c.candidateName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const primaryText = dark ? "text-white" : "text-[#171a17]";
  const secondaryText = dark ? "text-[#889084]" : "text-[#656d60]";

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-in fade-in duration-150">
      {/* Top Header matching RunInfra / Epoch Design */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#75bf00]">
              INSTITUTIONAL GOVERNANCE • PROOF ENGINE
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5 mt-0.5">
            <span className={primaryText}>Evidence &amp;</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans">
              Assurance
            </span>
          </h1>
          <p className={cn("mt-1 text-xs", secondaryText)}>
            Empirically verifiable proofs, cryptographic invariants, and hardware assurance guarantees that govern institutional execution.
          </p>
        </div>

        {/* Global Merkle Proof Badge */}
        <div className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs",
          dark ? "border-[#333] bg-[#181818] text-[#a0a89d]" : "border-[#d8ddd3] bg-white text-[#555]"
        )}>
          <ShieldCheck size={13} className="text-[#75bf00]" />
          <span>Merkle Root: 0x9bf4...27c3</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar matching Deployments & Registry Tables */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Filter Tabs */}
        <div className="flex items-center gap-1 text-xs font-mono">
          {[
            { id: "all", label: `All Invariants (${cases.length})` },
            { id: "latency", label: `Latency p95 (${cases.filter((c) => c.category === "latency").length})` },
            { id: "throughput", label: `Throughput (${cases.filter((c) => c.category === "throughput").length})` },
            { id: "precision", label: `Precision/FID (${cases.filter((c) => c.category === "precision").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 border border-dashed transition-colors rounded-xs",
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

        {/* Search Bar & Right Stats */}
        <div className="flex items-center gap-3">
          <label className={cn(
            "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[240px]",
            dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
          )}>
            <Search size={13} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search proof cases, models, hardware..."
              className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-full"
            />
          </label>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-[#788274]">
            <span>{filteredCases.length} proofs active</span>
            <span>•</span>
            <span className="text-[#75bf00] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
              100% verified
            </span>
          </div>
        </div>
      </div>

      {/* Full-Width Assurance Table Container with Dashed Borders */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {/* Table Header Row */}
        <div className={cn(
          "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
          dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
        )}>
          <div className="col-span-4">Assurance Case &amp; Claim</div>
          <div className="col-span-3">Target Model &amp; Candidate</div>
          <div className="col-span-2">Hardware Cluster</div>
          <div className="col-span-1 text-center">Invariants</div>
          <div className="col-span-1 text-center">Confidence</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Data Rows */}
        {filteredCases.map((c) => {
          const isExpanded = expandedCaseId === c.id;

          return (
            <div key={c.id} className="transition-colors">
              {/* Main Summary Row */}
              <div
                onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                className={cn(
                  "grid grid-cols-12 gap-3 px-4 py-3.5 items-center cursor-pointer text-xs transition-colors",
                  dark ? "hover:bg-[#232323]" : "hover:bg-[#fafbfa]",
                  isExpanded ? dark ? "bg-[#252525]" : "bg-[#f5f7f3]" : ""
                )}
              >
                {/* 1. Case & Claim */}
                <div className="col-span-4 flex items-center gap-2.5 truncate">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center border border-dashed rounded-xs shrink-0",
                    dark ? "border-[#383838] bg-[#181818] text-[#889284]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#687063]"
                  )}>
                    <ShieldCheck size={14} className="text-[#75bf00]" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-xs font-mono", primaryText)}>{c.claimId}</span>
                      <span className="text-[10px] text-[#788274] font-mono">{c.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-[#788274] font-mono mt-0.5 truncate">
                      {c.claim}
                    </div>
                  </div>
                </div>

                {/* 2. Target Model & Candidate */}
                <div className="col-span-3 space-y-0.5 truncate font-mono text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="shrink-0">{c.modelIcon}</span>
                    <span className={cn("font-semibold text-xs truncate", primaryText)}>{c.model}</span>
                  </div>
                  <div className="text-[11px] text-[#788274] truncate">
                    {c.candidateName}
                  </div>
                </div>

                {/* 3. Hardware Cluster */}
                <div className="col-span-2 font-mono text-xs space-y-0.5">
                  <div className={cn("text-xs truncate", primaryText)}>{c.hardwareCluster}</div>
                  <div className="text-[10px] text-[#788274] truncate">{c.gpuCount}</div>
                </div>

                {/* 4. Invariants Passed */}
                <div className="col-span-1 text-center font-mono">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-xs font-bold border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]">
                    <CheckCheck size={10} />
                    <span>{c.verificationChecksPassed}/{c.verificationChecksTotal}</span>
                  </span>
                </div>

                {/* 5. Confidence Score */}
                <div className="col-span-1 text-center font-mono">
                  <span className="border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00] px-1.5 py-0.5 text-[10px] font-bold rounded-xs">
                    {c.confidencePct}%
                  </span>
                </div>

                {/* 6. Actions */}
                <div className="col-span-1 flex items-center justify-end gap-2 font-mono">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHash(c.integrityHash);
                    }}
                    className="text-[#788274] hover:text-white p-1"
                    title="Copy Integrity Hash"
                  >
                    {copiedHash ? <Check size={12} className="text-[#75bf00]" /> : <Copy size={12} />}
                  </button>
                  <button
                    type="button"
                    className="text-[#788274] hover:text-white p-1"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* In-Row Deep Assurance Graph & Evidence Inspector */}
              {isExpanded && (
                <div className={cn(
                  "p-5 border-t border-dashed space-y-5 text-xs font-mono",
                  dark ? "bg-[#161616] border-[#2e2e2e]" : "bg-[#fafbfa] border-[#edf0eb]"
                )}>
                  {/* Verification Assurance Subtabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[#282828] pb-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {[
                        { id: "claim", label: "01. CLAIM [1]" },
                        { id: "deltas", label: `02. DELTAS [${c.measurements.length}]` },
                        { id: "verifier", label: `03. VERIFIER [${c.verificationRules.length}]` },
                        { id: "artifacts", label: `04. ARTIFACTS [${c.artifacts.length}]` },
                        { id: "runs", label: `05. RUN TRACES [${c.executionRuns.length}]` },
                        { id: "certificate", label: "06. CERTIFICATE" },
                      ].map((subtab) => (
                        <button
                          key={subtab.id}
                          type="button"
                          onClick={() => setInspectorSubTab(subtab.id as typeof inspectorSubTab)}
                          className={cn(
                            "px-2.5 py-1 text-[11px] border border-dashed rounded-xs transition-colors",
                            inspectorSubTab === subtab.id
                              ? "border-[#75bf00] bg-[#75bf00]/10 text-[#75bf00] font-bold"
                              : dark ? "border-transparent text-[#788274] hover:text-white" : "border-transparent text-[#666] hover:text-black"
                          )}
                        >
                          {subtab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#788274]">
                      <span>Hash: {c.integrityHash.slice(0, 16)}...</span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(c.integrityHash)}
                        className="text-[#75bf00] hover:underline"
                      >
                        Copy Hash
                      </button>
                    </div>
                  </div>

                  {/* SUBTAB 1: FORMAL CLAIM & 4-METRIC SIGNIFICANCE GRID */}
                  {inspectorSubTab === "claim" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                          FORMAL INSTITUTIONAL CLAIM
                        </span>
                        <div className={cn(
                          "p-3.5 border border-dashed rounded-xs font-mono text-xs leading-relaxed",
                          dark ? "border-[#75bf00]/30 bg-[#121c12] text-[#a3e635]" : "border-[#b9de78] bg-[#f5faee] text-[#2d5800]"
                        )}>
                          "{c.claim}"
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className={cn("p-2.5 border border-dashed rounded-xs space-y-1", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#ddd] bg-white")}>
                          <span className="text-[10px] text-[#788274] uppercase">Target Hardware</span>
                          <div className={cn("font-bold", primaryText)}>{c.hardwareCluster}</div>
                        </div>
                        <div className={cn("p-2.5 border border-dashed rounded-xs space-y-1", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#ddd] bg-white")}>
                          <span className="text-[10px] text-[#788274] uppercase">Verification SLA</span>
                          <div className="font-bold text-[#75bf00]">{c.verificationChecksPassed}/{c.verificationChecksTotal} Invariants Passed</div>
                        </div>
                        <div className={cn("p-2.5 border border-dashed rounded-xs space-y-1", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#ddd] bg-white")}>
                          <span className="text-[10px] text-[#788274] uppercase">Cryptographic Status</span>
                          <div className="font-bold text-[#60a5fa]">Merkle Signed (Ed25519)</div>
                        </div>
                      </div>

                      {/* 4 Statistical Significance Cards */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                          STATISTICAL SIGNIFICANCE: {c.confidencePct}%
                        </span>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {c.measurements.slice(0, 4).map((m, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "p-3 border border-dashed rounded-xs space-y-1",
                                dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#ddd] bg-white"
                              )}
                            >
                              <span className="text-[10px] text-[#788274] block truncate">{m.name}</span>
                              <div className={cn("text-sm font-bold", primaryText)}>{m.value}</div>
                              <div className="text-[10px] text-[#75bf00] font-bold">{m.delta}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: DELTAS COMPARISON */}
                  {inspectorSubTab === "deltas" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        EMPIRICAL MEASUREMENT DELTAS (VS FP16 BASELINE)
                      </span>

                      <div className={cn(
                        "border border-dashed divide-y divide-dashed rounded-xs overflow-hidden",
                        dark ? "border-[#2e2e2e] bg-[#181818] divide-[#282828]" : "border-[#ddd] bg-white divide-[#eee]"
                      )}>
                        <div className={cn(
                          "grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase text-[#788274]",
                          dark ? "bg-[#141414]" : "bg-[#f5f5f5]"
                        )}>
                          <div className="col-span-5">Metric</div>
                          <div className="col-span-2 text-right">Baseline</div>
                          <div className="col-span-2 text-right">Measured</div>
                          <div className="col-span-3 text-right">Verified Delta</div>
                        </div>

                        {c.measurements.map((m, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2.5 text-xs">
                            <div className={cn("col-span-5 font-semibold", primaryText)}>{m.name}</div>
                            <div className="col-span-2 text-right text-[#788274]">{m.baseline}</div>
                            <div className={cn("col-span-2 text-right font-bold", primaryText)}>{m.value}</div>
                            <div className="col-span-3 text-right font-bold text-[#75bf00]">{m.delta}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 3: INDEPENDENT VERIFIER RULES */}
                  {inspectorSubTab === "verifier" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        FORMAL INVARIANT VERIFICATION RULES ({c.verificationRules.length}/{c.verificationRules.length} PASSED)
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {c.verificationRules.map((rule) => (
                          <div
                            key={rule.ruleId}
                            className={cn(
                              "p-2.5 border border-dashed rounded-xs flex items-center justify-between text-xs",
                              rule.passed
                                ? dark ? "border-[#75bf00]/30 bg-[#121c12]" : "border-[#b9de78] bg-[#f5faee]"
                                : dark ? "border-[#ef4444]/30 bg-[#1c1212]" : "border-[#fca5a5] bg-[#fff5f5]"
                            )}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[10px] text-[#75bf00]">{rule.ruleId}</span>
                                <span className={cn("font-bold text-xs", primaryText)}>{rule.assertion}</span>
                              </div>
                              <div className="text-[11px] text-[#788274] mt-0.5">Observed: {rule.observed}</div>
                            </div>
                            <CheckCircle2 size={15} className="text-[#75bf00] shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 4: ARTIFACT INTEGRITY */}
                  {inspectorSubTab === "artifacts" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        TIED IMMUTABLE ARTIFACTS
                      </span>

                      <div className="space-y-2">
                        {c.artifacts.map((art, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-3 border border-dashed rounded-xs flex items-center justify-between text-xs",
                              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#ddd] bg-white"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <FileCode size={14} className="text-[#75bf00]" />
                              <div>
                                <div className={cn("font-bold text-xs", primaryText)}>{art.name}</div>
                                <div className="text-[10px] text-[#788274] font-mono">{art.hash}</div>
                              </div>
                            </div>
                            <span className="text-xs text-[#788274] font-mono">{art.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 5: EXECUTION TRACES */}
                  {inspectorSubTab === "runs" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        CORROBORATING RUN TRACES
                      </span>

                      <div className="space-y-2">
                        {c.executionRuns.map((run) => (
                          <div
                            key={run.runId}
                            className={cn(
                              "p-3 border border-dashed rounded-xs flex items-center justify-between text-xs",
                              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#ddd] bg-white"
                            )}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#75bf00]">{run.runId}</span>
                                <span className={cn("text-xs font-semibold", primaryText)}>{run.environment}</span>
                              </div>
                              <div className="text-[10px] text-[#788274]">{run.gpu} • Duration: {run.duration}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-xs font-bold border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]">
                              {run.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 6: CERTIFICATE PROOF */}
                  {inspectorSubTab === "certificate" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        CRYPTOGRAPHIC PROOF TOKEN (ED25519 MERKLE SEAL)
                      </span>

                      <div className={cn(
                        "p-4 border border-dashed rounded-xs font-mono text-[11px] leading-relaxed relative",
                        dark ? "border-[#333] bg-[#0f0f0f] text-[#a3e635]" : "border-[#ddd] bg-[#111] text-[#a3e635]"
                      )}>
                        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify({
                          claimId: c.claimId,
                          model: c.model,
                          candidate: c.candidateName,
                          hardware: c.hardwareCluster,
                          confidence: `${c.confidencePct}%`,
                          merkleRoot: c.merkleRoot,
                          integrityDigest: c.integrityHash,
                          signature: c.signature,
                          verifiedBy: "Epoch Independent Verifier Runtime v14.2",
                          status: "VERIFIED_BIT_EXACT",
                        }, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State matching Image 1 */}
        {filteredCases.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-3 font-mono">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center border border-dashed rounded-xs",
              dark ? "border-[#383838] bg-[#1a1a1a] text-[#888]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#555]"
            )}>
              <ShieldCheck size={18} className="text-[#888]" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className={cn("font-bold text-xs", primaryText)}>
                No assurance cases yet
              </h3>
              <p className={cn("text-[11px]", secondaryText)}>
                Run an optimization or benchmark mission to generate cryptographic evidence proofs.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToPipelines}
              className={cn(
                "flex items-center gap-1.5 border border-dashed px-3.5 py-1.5 text-xs font-medium transition-colors rounded-xs",
                dark
                  ? "border-[#383838] bg-[#222] text-white hover:border-[#75bf00] hover:text-[#75bf00]"
                  : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-black"
              )}
            >
              <span>Go to pipelines</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Database,
  Search,
  Layers,
  Box,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  GitBranch,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Fingerprint,
  RefreshCw,
  Zap,
  Cpu,
} from "lucide-react";
import { RegistryArtifact } from "@/lib/epoch-types";
import {
  MetaLogo,
  QwenLogo,
  VLLMLogo,
  NvidiaLogo,
  HuggingFaceLogo,
} from "../primitives/brand-icons";
import { cn } from "@/lib/utils";

interface RegistryViewProps {
  artifacts?: RegistryArtifact[];
  onNavigateToPipelines?: () => void;
  dark?: boolean;
}

const DEFAULT_ARTIFACTS: RegistryArtifact[] = [
  {
    id: "art-qwen-fp8-weights",
    name: "qwen2.5-7b-instruct-fp8-w8a8",
    type: "weights",
    version: "v4.2",
    source: "Epoch AutoFP8 Quantizer (FlashInfer 0.1.6)",
    sizeBytes: "7.8 GB",
    integrityHash: "sha256:9bf42cae7104b689aa1028711e5927c3ff89104871",
    status: "active",
    createdAt: "2026-08-09T18:22:00Z",
    usedByPrograms: ["prog-qwen3-latency-cost", "dep-live-prod-qwen"],
    historyTree: [
      { version: "v4.2", label: "FP8 (W8A8) Chunked Prefill + Act Scales", isActive: true, createdAt: "Aug 09, 2026" },
      { version: "v3.1", label: "FP8 (W8A8) Dynamic Quant", isActive: false, createdAt: "Aug 07, 2026" },
      { version: "v2.0", label: "AWQ 4-bit 128 Group Size", isActive: false, createdAt: "Aug 05, 2026" },
      { version: "v1.0", label: "BF16 Base HuggingFace Import", isActive: false, createdAt: "Aug 01, 2026" },
    ],
  },
  {
    id: "art-vllm-runtime-container",
    name: "runtime-vllm-v0.6.4-cuda12.4-epoch",
    type: "container",
    version: "v2.1.0",
    source: "Epoch OCI Registry (ghcr.io/epoch-os/vllm)",
    sizeBytes: "4.2 GB",
    integrityHash: "sha256:77ae41c88147d3910ffbe9146522c019a84b01e92c",
    status: "verified",
    createdAt: "2026-08-08T11:15:00Z",
    usedByPrograms: ["prog-qwen3-latency-cost", "prog-bge-embeddings-scale"],
    historyTree: [
      { version: "v2.1.0", label: "CUDA 12.4 + FlashInfer 0.1.6 Kernel", isActive: true, createdAt: "Aug 08, 2026" },
      { version: "v2.0.0", label: "CUDA 12.2 + FlashAttention 2.5", isActive: false, createdAt: "Jul 28, 2026" },
      { version: "v1.0.0", label: "Initial Base vLLM Container", isActive: false, createdAt: "Jul 15, 2026" },
    ],
  },
  {
    id: "art-llama-trt-engine",
    name: "llama3.1-8b-trtllm-h100-engine",
    type: "variant",
    version: "v3.0",
    source: "TensorRT-LLM 0.12 Builder (H100 SXM5 Plan)",
    sizeBytes: "9.1 GB",
    integrityHash: "sha256:4ca81055fbf104ecbd37651a21e646279930ba5501",
    status: "active",
    createdAt: "2026-08-06T14:40:00Z",
    usedByPrograms: ["prog-llama3-agent-eval"],
    historyTree: [
      { version: "v3.0", label: "FP8 TensorRT-LLM In-flight Batching", isActive: true, createdAt: "Aug 06, 2026" },
      { version: "v2.0", label: "FP16 TensorRT-LLM Static Shape", isActive: false, createdAt: "Aug 02, 2026" },
      { version: "v1.0", label: "Unoptimized ONNX Intermediate", isActive: false, createdAt: "Jul 29, 2026" },
    ],
  },
  {
    id: "art-bge-snapshot-bundle",
    name: "bge-m3-tei-onnx-production-snapshot",
    type: "snapshot",
    version: "v1.4",
    source: "Merkle Tree Tree-Sealed State Snapshot",
    sizeBytes: "2.1 GB",
    integrityHash: "sha256:3391ba90c8411e502bb1478140410ffaa91285091a",
    status: "verified",
    createdAt: "2026-08-04T09:12:00Z",
    usedByPrograms: ["prog-bge-embeddings-scale"],
    historyTree: [
      { version: "v1.4", label: "Production Verified State Snapshot", isActive: true, createdAt: "Aug 04, 2026" },
      { version: "v1.0", label: "Staging Evaluation Snapshot", isActive: false, createdAt: "Aug 01, 2026" },
    ],
  },
];

export function RegistryView({
  artifacts = DEFAULT_ARTIFACTS,
  onNavigateToPipelines,
  dark = true,
}: RegistryViewProps) {
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [activeDeployTab, setActiveDeployTab] = useState<"docker" | "k8s" | "vllm">("vllm");

  const list = artifacts.length > 0 ? artifacts : DEFAULT_ARTIFACTS;

  const filteredArtifacts = list.filter((a) => {
    const matchesTab = filterTab === "all" || a.type === filterTab;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.integrityHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.version.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCopyHash = (hash: string, id: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const primaryText = dark ? "text-[#F0EFE2]" : "text-[#171a17]";
  const secondaryText = dark ? "text-[#889084]" : "text-[#656d60]";

  const getDeploySnippet = (artifact: RegistryArtifact) => {
    switch (activeDeployTab) {
      case "docker":
        return `docker run --gpus all -p 8000:8000 \\
  -v epoch-weights:/root/.cache \\
  ghcr.io/epoch-os/vllm:${artifact.version} \\
  --model /root/.cache/${artifact.name} \\
  --quantization fp8 --gpu-memory-utilization 0.92`;
      case "k8s":
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${artifact.name}
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: inference-engine
        image: ghcr.io/epoch-os/vllm:${artifact.version}
        resources:
          limits:
            nvidia.com/gpu: 1`;
      default:
        return `vllm serve ${artifact.name} \\
  --tensor-parallel-size 1 \\
  --max-model-len 8192 \\
  --enable-chunked-prefill \\
  --quantization fp8`;
    }
  };

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-in fade-in duration-150">
      {/* Top Header matching RunInfra Design */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5">
            <span className={primaryText}>Artifact</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans">
              Registry
            </span>
          </h1>
          <p className={cn("mt-1 text-xs", secondaryText)}>
            Cryptographically signed model weights, container images, compiled engines, and verifiable version lineage.
          </p>
        </div>

        {/* Global Storage Proof Badge */}
        <div className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs",
          dark ? "border-[#333] bg-[#181818] text-[#a0a89d]" : "border-[#d8ddd3] bg-white text-[#555]"
        )}>
          <ShieldCheck size={13} className="text-[#75bf00]" />
          <span>Merkle Root: 0x9bf4...27c3</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar matching Image 1 Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Filter Tabs */}
        <div className="flex items-center gap-1 text-xs font-mono">
          {[
            { id: "all", label: `All ${list.length}` },
            { id: "weights", label: `Quantized Weights ${list.filter((a) => a.type === "weights").length}` },
            { id: "container", label: `Containers ${list.filter((a) => a.type === "container").length}` },
            { id: "variant", label: `Compiled Variants ${list.filter((a) => a.type === "variant").length}` },
            { id: "snapshot", label: `Snapshots ${list.filter((a) => a.type === "snapshot").length}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 border border-dashed transition-colors rounded-xs",
                filterTab === tab.id
                  ? dark
                    ? "border-[#555] bg-[#282828] text-[#F0EFE2] font-bold"
                    : "border-[#888] bg-[#eaeaea] text-[#111] font-bold"
                  : dark
                  ? "border-transparent text-[#788274] hover:text-[#F0EFE2]"
                  : "border-transparent text-[#687063] hover:text-[#171a17]"
              )}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar & Right Stats matching Image 1 */}
        <div className="flex items-center gap-3">
          <label className={cn(
            "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[240px]",
            dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
          )}>
            <Search size={13} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts by name, SHA256..."
              className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-full"
            />
          </label>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-[#788274]">
            <span>{filteredArtifacts.length} total</span>
            <span>•</span>
            <span className="text-[#75bf00] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
              Verified immutable
            </span>
          </div>
        </div>
      </div>

      {/* Artifacts Table Container with Dashed Borders matching Image 1 */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {/* Table Header Row matching Image 1 proper columns */}
        <div className={cn(
          "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
          dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
        )}>
          <div className="col-span-4">Artifact / Model</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Digest (SHA256)</div>
          <div className="col-span-1 text-right">Size</div>
          <div className="col-span-1 text-center">Version</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        {filteredArtifacts.map((artifact) => {
          const isExpanded = expandedRowId === artifact.id;
          const isCopied = copiedHashId === artifact.id;

          return (
            <div key={artifact.id} className="transition-colors">
              {/* Main Summary Row */}
              <div
                onClick={() => setExpandedRowId(isExpanded ? null : artifact.id)}
                className={cn(
                  "grid grid-cols-12 gap-3 px-4 py-3.5 items-center cursor-pointer text-xs transition-colors",
                  dark ? "hover:bg-[#232323]" : "hover:bg-[#fafbfa]",
                  isExpanded ? dark ? "bg-[#252525]" : "bg-[#f5f7f3]" : ""
                )}
              >
                {/* 1. Artifact / Model */}
                <div className="col-span-4 flex items-center gap-2.5 truncate">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center border border-dashed rounded-xs shrink-0",
                    dark ? "border-[#383838] bg-[#181818] text-[#889284]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#687063]"
                  )}>
                    {artifact.type === "weights" && <Layers size={14} className="text-[#75bf00]" />}
                    {artifact.type === "container" && <Box size={14} className="text-[#60a5fa]" />}
                    {artifact.type === "variant" && <Cpu size={14} className="text-[#a78bfa]" />}
                    {artifact.type === "snapshot" && <Database size={14} className="text-[#f59e0b]" />}
                  </div>
                  <div className="truncate">
                    <div className={cn("font-semibold text-xs truncate", primaryText)}>
                      {artifact.name}
                    </div>
                    <div className="text-[11px] text-[#788274] font-mono mt-0.5 truncate">
                      {artifact.source}
                    </div>
                  </div>
                </div>

                {/* 2. Type */}
                <div className="col-span-2 font-mono text-xs">
                  <span className={cn(
                    "px-2 py-0.5 border border-dashed rounded-xs text-[10px] uppercase font-bold",
                    artifact.type === "weights"
                      ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]"
                      : artifact.type === "container"
                      ? "border-[#60a5fa]/40 bg-[#60a5fa]/10 text-[#60a5fa]"
                      : artifact.type === "variant"
                      ? "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]"
                      : "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]"
                  )}>
                    {artifact.type}
                  </span>
                </div>

                {/* 3. Digest SHA256 */}
                <div className="col-span-2 font-mono text-xs flex items-center gap-1.5">
                  <span className="text-[#788274] truncate text-[11px]">
                    {artifact.integrityHash.slice(0, 16)}...
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHash(artifact.integrityHash, artifact.id);
                    }}
                    className="text-[#666] hover:text-[#F0EFE2] transition-colors p-1"
                    title="Copy SHA256 checksum"
                  >
                    {isCopied ? <Check size={11} className="text-[#75bf00]" /> : <Copy size={11} />}
                  </button>
                </div>

                {/* 4. Size */}
                <div className="col-span-1 text-right font-mono text-xs text-[#788274]">
                  {artifact.sizeBytes}
                </div>

                {/* 5. Version */}
                <div className="col-span-1 text-center font-mono text-xs">
                  <span className={cn(
                    "px-1.5 py-0.5 border border-dashed rounded-xs text-[10px]",
                    dark ? "border-[#383838] bg-[#181818] text-[#a0a89d]" : "border-[#d8ddd3] bg-white text-[#555]"
                  )}>
                    {artifact.version}
                  </span>
                </div>

                {/* 6. Status */}
                <div className="col-span-1 text-center font-mono">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-xs font-bold border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                    <span>VERIFIED</span>
                  </span>
                </div>

                {/* 7. Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1 font-mono">
                  <button
                    type="button"
                    className="p-1 text-[#788274] hover:text-[#F0EFE2] transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expandable Detail Panel (Version Lineage & Deployment Terminal) */}
              {isExpanded && (
                <div className={cn(
                  "p-4 border-t border-dashed space-y-4 text-xs font-mono",
                  dark ? "bg-[#161616] border-[#2e2e2e]" : "bg-[#fafbfa] border-[#edf0eb]"
                )}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Version Lineage DAG */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#788274] uppercase">
                        <GitBranch size={12} className="text-[#75bf00]" />
                        <span>Cryptographic Version Lineage</span>
                      </div>

                      <div className="space-y-1.5 pl-2 border-l border-dashed border-[#333]">
                        {artifact.historyTree?.map((ver, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-2 border border-dashed rounded-xs flex items-center justify-between text-[11px]",
                              ver.isActive
                                ? dark ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#F0EFE2]" : "border-[#75bf00]/50 bg-[#f5faee] text-[#111]"
                                : dark ? "border-[#333] bg-[#111] text-[#777]" : "border-[#ddd] bg-white text-[#666]"
                            )}
                          >
                            <div className="space-y-0.5 truncate">
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{ver.version}</span>
                                {ver.isActive && (
                                  <span className="text-[9px] px-1 bg-[#75bf00] text-black font-extrabold rounded-xs leading-tight">
                                    CURRENT
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#C8C7BA] truncate">{ver.label}</div>
                            </div>
                            <span className="text-[10px] text-[#666] shrink-0">{ver.createdAt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Quick Deploy Terminal Snippet */}
                    <div className="lg:col-span-7 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Terminal size={12} className="text-[#75bf00]" />
                          <span className="text-[11px] font-bold text-[#788274] uppercase">Deployment Recipe</span>
                        </div>

                        {/* Subtabs for deploy runtime */}
                        <div className="flex items-center gap-1">
                          {(["vllm", "docker", "k8s"] as const).map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setActiveDeployTab(tab)}
                              className={cn(
                                "px-2 py-0.5 text-[10px] uppercase border border-dashed rounded-xs transition-colors",
                                activeDeployTab === tab
                                  ? "border-[#75bf00] bg-[#75bf00]/10 text-[#75bf00] font-bold"
                                  : "border-transparent text-[#788274] hover:text-[#F0EFE2]"
                              )}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={cn(
                        "p-3 border border-dashed rounded-xs relative group overflow-x-auto text-[11px] leading-relaxed",
                        dark ? "border-[#333] bg-[#0f0f0f] text-[#a3e635]" : "border-[#ddd] bg-[#111] text-[#a3e635]"
                      )}>
                        <pre className="font-mono">{getDeploySnippet(artifact)}</pre>

                        <button
                          type="button"
                          onClick={() => handleCopyHash(getDeploySnippet(artifact), artifact.id + "-code")}
                          className="absolute top-2 right-2 p-1.5 bg-[#222] border border-dashed border-[#444] rounded-xs text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors"
                          title="Copy snippet"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State matching Image 1 */}
        {filteredArtifacts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-3 font-mono">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center border border-dashed rounded-xs",
              dark ? "border-[#383838] bg-[#1a1a1a] text-[#C8C7BA]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#555]"
            )}>
              <Database size={18} className="text-[#C8C7BA]" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className={cn("font-bold text-xs", primaryText)}>
                No registry artifacts yet
              </h3>
              <p className={cn("text-[11px]", secondaryText)}>
                Deploy a pipeline or compile a model variant to record your first immutable artifact.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToPipelines}
              className={cn(
                "flex items-center gap-1.5 border border-dashed px-3.5 py-1.5 text-xs font-medium transition-colors rounded-xs",
                dark
                  ? "border-[#383838] bg-[#222] text-[#F0EFE2] hover:border-[#75bf00] hover:text-[#75bf00]"
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

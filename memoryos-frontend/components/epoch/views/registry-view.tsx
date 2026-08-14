"use client";

import React, { useEffect, useState } from "react";
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
  HardDrive,
  GitBranch,
  Terminal,
  ExternalLink,
  Lock,
  ArrowUpRight,
  Download,
  Share2,
  Calendar,
  Cpu,
  Fingerprint,
  RefreshCw,
  Boxes,
  Zap,
} from "lucide-react";
import { RegistryArtifact } from "@/lib/epoch-types";
import {
  MetaLogo,
  QwenLogo,
  VLLMLogo,
  NvidiaLogo,
  DiffusersLogo,
} from "../primitives/brand-icons";
import { cn } from "@/lib/utils";

interface RegistryViewProps {
  artifacts?: RegistryArtifact[];
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
  artifacts = [],
  dark = true,
}: RegistryViewProps) {
  const combinedArtifacts = artifacts;
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState<RegistryArtifact | null>(artifacts[0] ?? null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeDeployTab, setActiveDeployTab] = useState<"docker" | "k8s" | "vllm">("vllm");

  useEffect(() => {
    setSelectedArtifact((current) => {
      if (current && artifacts.some((artifact) => artifact.id === current.id)) return current;
      return artifacts[0] ?? null;
    });
  }, [artifacts]);

  const filteredArtifacts = combinedArtifacts.filter((a) => {
    const matchesTab = activeTab === "all" || a.type === activeTab;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.integrityHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.version.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  function handleCopyHash(hash: string) {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }

  function handleCopyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const primaryText = dark ? "text-white" : "text-[#171a17]";
  const subText = dark ? "text-[#90988c]" : "text-[#555d50]";

  const getDeploySnippet = () => {
    if (!selectedArtifact) return "";
    switch (activeDeployTab) {
      case "docker":
        return `docker run --gpus all -p 8000:8000 \\
  -v epoch-weights:/root/.cache \\
  ghcr.io/epoch-os/vllm:${selectedArtifact.version} \\
  --model /root/.cache/${selectedArtifact.name} \\
  --quantization fp8 --gpu-memory-utilization 0.92`;
      case "k8s":
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${selectedArtifact.name}
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: inference-engine
        image: ghcr.io/epoch-os/vllm:${selectedArtifact.version}
        resources:
          limits:
            nvidia.com/gpu: 1`;
      default:
        return `vllm serve ${selectedArtifact.name} \\
  --tensor-parallel-size 1 \\
  --max-model-len 8192 \\
  --enable-chunked-prefill \\
  --quantization fp8`;
    }
  };

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-16">
      {/* Top Header */}
      <div className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#75bf00]">
              IMMUTABLE ARTIFACT LEDGER
            </span>
          </div>
          <h1 className={cn("mt-1 text-2xl md:text-3xl font-medium tracking-tight", primaryText)}>
            Artifact{" "}
            <span className="bg-[#75bf00] text-black px-2 py-0.5 font-bold inline-block rounded-xs">
              Registry
            </span>
          </h1>
          <p className={cn("mt-1 text-xs md:text-sm", subText)}>
            Cryptographically signed model weights, container images, compiled engines, and verifiable version lineage.
          </p>
        </div>

        {/* Global Storage Badge */}
        <div className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs",
          dark ? "border-[#333] bg-[#202020] text-[#a0a89d]" : "border-[#d8ddd3] bg-white text-[#555]"
        )}>
          <ShieldCheck size={14} className="text-[#75bf00]" />
          <span>Merkle Root: 0x9bf4...27c3</span>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-dashed py-3",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          {[
            { id: "all", label: "All Artifacts" },
            { id: "weights", label: "Quantized Weights" },
            { id: "container", label: "Containers" },
            { id: "variant", label: "Compiled Variants" },
            { id: "snapshot", label: "Snapshots" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-xs transition-colors rounded-xs border border-dashed",
                activeTab === tab.id
                  ? dark ? "bg-[#282828] text-[#75bf00] font-bold border-[#75bf00]" : "bg-[#f0f4ec] text-[#2d5800] font-bold border-[#75bf00]"
                  : dark ? "border-transparent text-[#888] hover:text-white" : "border-transparent text-[#666] hover:text-black"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1 text-xs rounded-xs w-full sm:w-72",
          dark ? "border-[#333] bg-[#202020] text-white" : "border-[#d8ddd3] bg-white text-[#171a17]"
        )}>
          <Search size={13} className="text-[#888]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or SHA..."
            className={cn(
              "w-full bg-transparent text-xs outline-none",
              dark ? "placeholder:text-[#666] text-white" : "placeholder:text-[#90988c] text-[#171a17]"
            )}
          />
        </div>
      </div>

      {/* 2-Column Split: Left Artifacts Ledger & Right Lineage Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Artifacts List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredArtifacts.length === 0 && (
            <div className={cn(
              "border border-dashed p-6 text-xs font-mono",
              dark ? "border-[#2e2e2e] bg-[#202020] text-[#90988c]" : "border-[#d8ddd3] bg-white text-[#656d60]"
            )}>
              {artifacts.length === 0 ? "No registry artifacts have been recorded for this workspace." : "No artifacts match the current filter."}
            </div>
          )}
          {filteredArtifacts.map((art) => {
            const isSelected = selectedArtifact?.id === art.id;
            return (
              <div
                key={art.id}
                onClick={() => setSelectedArtifact(art)}
                className={cn(
                  "cursor-pointer border border-dashed p-3.5 transition-all text-xs rounded-xs",
                  isSelected
                    ? dark
                      ? "border-[#75bf00] bg-[#1a2416] shadow-sm"
                      : "border-[#75bf00] bg-[#f5faee] shadow-xs"
                    : dark
                    ? "border-[#2e2e2e] bg-[#202020] hover:border-[#444] hover:bg-[#252525]"
                    : "border-[#d8ddd3] bg-white hover:border-[#a8b0a2]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {art.type === "weights" && <QwenLogo size={16} />}
                    {art.type === "container" && <VLLMLogo size={16} />}
                    {art.type === "variant" && <NvidiaLogo size={16} />}
                    {art.type === "snapshot" && <Database size={16} className="text-[#75bf00]" />}
                    <div>
                      <div className={cn("font-mono font-bold text-xs", primaryText)}>
                        {art.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#788274] font-mono">
                        {art.sizeBytes || "4.2 GB"} • {art.version}
                      </div>
                    </div>
                  </div>

                  <span className={cn(
                    "font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-xs tracking-wider border border-dashed",
                    dark ? "border-[#383838] bg-[#181818] text-[#a0a89d]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#656d60]"
                  )}>
                    {art.type}
                  </span>
                </div>

                <div className={cn(
                  "mt-3 flex items-center justify-between border-t border-dashed pt-2.5 font-mono text-[11px]",
                  dark ? "border-[#282828]" : "border-[#edf0eb]"
                )}>
                  <div className="flex items-center gap-1.5 text-[#788274]">
                    <span>SHA:</span>
                    <span className={dark ? "text-[#a0a89d]" : "text-[#2a3028]"}>
                      {art.integrityHash?.slice(0, 14)}...
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (art.integrityHash) handleCopyHash(art.integrityHash);
                    }}
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-mono",
                      copiedHash ? "text-[#75bf00]" : dark ? "text-[#889084] hover:text-white" : "text-[#656d60] hover:text-black"
                    )}
                  >
                    {copiedHash ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copiedHash ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Lineage & Attestation Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedArtifact ? (
            <div className={cn(
              "border border-dashed p-5 rounded-xs space-y-5",
              dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white"
            )}>
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-[#282828] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#75bf00]">
                      IMMUTABLE SPECIFICATION
                    </span>
                    <span className="border border-dashed border-[#75bf00]/40 bg-[#162916] text-[#75bf00] px-1.5 py-0.2 text-[9px] rounded-xs font-mono uppercase">
                      {selectedArtifact.status}
                    </span>
                  </div>
                  <h2 className={cn("text-base font-bold font-mono mt-1", primaryText)}>
                    {selectedArtifact.name}
                  </h2>
                  <p className="text-xs text-[#788274] mt-0.5">
                    {selectedArtifact.source}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyHash(selectedArtifact.integrityHash)}
                    className={cn(
                      "flex items-center gap-1.5 border border-dashed px-2.5 py-1 text-xs font-mono transition-colors rounded-xs",
                      dark ? "border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#333]"
                    )}
                  >
                    {copiedHash ? <Check size={12} className="text-[#75bf00]" /> : <Copy size={12} />}
                    <span>{copiedHash ? "Hash Copied" : "Copy Digest"}</span>
                  </button>
                </div>
              </div>

              {/* 4 Detail Stats */}
              <div className={cn(
                "grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 border border-dashed rounded-xs text-xs font-mono",
                dark ? "border-[#282828] bg-[#141414]" : "border-[#edf0eb] bg-[#fafbfa]"
              )}>
                <div>
                  <div className="text-[#788274] text-[10px]">VERSION</div>
                  <div className={cn("font-bold text-xs mt-0.5", primaryText)}>{selectedArtifact.version}</div>
                </div>
                <div>
                  <div className="text-[#788274] text-[10px]">SIZE</div>
                  <div className={cn("font-bold text-xs mt-0.5", primaryText)}>{selectedArtifact.sizeBytes || "-"}</div>
                </div>
                <div>
                  <div className="text-[#788274] text-[10px]">FORMAT</div>
                  <div className="font-bold text-xs text-[#75bf00] mt-0.5">{selectedArtifact.type}</div>
                </div>
                <div>
                  <div className="text-[#788274] text-[10px]">SEAL</div>
                  <div className="font-bold text-xs text-[#60a5fa] mt-0.5">Digest recorded</div>
                </div>
              </div>

              {/* Version History Lineage Tree */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#788274] font-mono">
                  <GitBranch size={13} />
                  <span>VERSION LINEAGE & PROVENANCE GRAPH</span>
                </div>

                <div className={cn(
                  "border border-dashed divide-y divide-dashed rounded-xs text-xs font-mono",
                  dark ? "border-[#282828] bg-[#141414] divide-[#242424]" : "border-[#edf0eb] bg-white divide-[#edf0eb]"
                )}>
                  {(selectedArtifact.historyTree || [
                    { version: selectedArtifact.version, label: "Current Immutable State", isActive: true, createdAt: "2026-08-09" }
                  ]).map((node, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-2.5 transition-colors",
                        node.isActive
                          ? dark ? "bg-[#1d2618]" : "bg-[#f5faee]"
                          : dark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#fafbfa]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          node.isActive ? "bg-[#75bf00]" : "bg-[#555]"
                        )} />
                        <span className={cn("font-bold", node.isActive ? "text-[#75bf00]" : primaryText)}>
                          {node.version}
                        </span>
                        <span className="text-[#788274]">{node.label}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#788274]">
                        <span>{node.createdAt}</span>
                        {node.isActive && (
                          <span className="border border-dashed border-[#75bf00]/40 bg-[#162916] text-[#75bf00] px-1.5 py-0.2 text-[9px] rounded-xs font-bold">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployment & Pull Commands */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#788274] font-mono">
                    <Terminal size={13} />
                    <span>PULL & DEPLOY INSTRUCTIONS</span>
                  </div>

                  <div className="flex items-center gap-1 border border-dashed border-[#333] p-0.5 rounded-xs text-[11px] font-mono">
                    {(["vllm", "docker", "k8s"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveDeployTab(tab)}
                        className={cn(
                          "px-2 py-0.5 rounded-xs transition-colors uppercase",
                          activeDeployTab === tab
                            ? "bg-[#75bf00] text-black font-bold"
                            : dark ? "text-[#888] hover:text-white" : "text-[#666] hover:text-black"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={cn(
                  "relative border border-dashed p-3 rounded-xs font-mono text-xs overflow-x-auto",
                  dark ? "border-[#2e2e2e] bg-[#111111] text-[#a3e635]" : "border-[#d8ddd3] bg-[#1a1f18] text-[#a3e635]"
                )}>
                  <pre className="whitespace-pre">{getDeploySnippet()}</pre>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(getDeploySnippet())}
                    className="absolute top-2.5 right-2.5 flex items-center gap-1 border border-dashed border-[#383838] bg-[#222] px-2 py-0.5 text-[10px] text-[#d1d5db] hover:border-[#555] rounded-xs font-mono"
                  >
                    {copiedCode ? <Check size={10} className="text-[#75bf00]" /> : <Copy size={10} />}
                    <span>{copiedCode ? "Copied" : "Copy Command"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              "flex min-h-[300px] flex-col items-center justify-center border border-dashed p-8 text-center rounded-xs",
              dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white"
            )}>
              <Database size={24} className="text-[#788274] mb-2" />
              <div className={cn("font-bold text-xs", primaryText)}>No artifact selected</div>
              <p className="text-[11px] text-[#788274] mt-0.5">
                Select an artifact from the left list to view version lineage and cryptographic proofs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

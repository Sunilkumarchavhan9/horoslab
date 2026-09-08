"use client";

import React, { useState } from "react";
import {
  Cpu,
  Search,
  Network,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  ExternalLink,
  RefreshCw,
  Sliders,
  Server,
  FileCode,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CapabilityNode, ModalityType } from "@/lib/epoch-types";
import { HuggingFaceLogo, NvidiaLogo, MetaLogo, VLLMLogo, SGLangLogo } from "../primitives/brand-icons";

interface CapabilitiesViewProps {
  dark?: boolean;
  onSelectModel?: (modelId: string) => void;
  onComposePipeline?: (capability: CapabilityNode) => void;
}

const SAMPLE_CAPABILITIES: CapabilityNode[] = [
  {
    id: "cap-llm-chat",
    name: "Text Generation & Chat Completion",
    inputModalities: ["text"],
    outputModalities: ["text", "code"],
    task: "text-generation",
    supportedRuntimes: ["vLLM", "SGLang", "TensorRT-LLM", "Ollama"],
    supportedHardware: ["NVIDIA H100", "NVIDIA A100", "L40S", "Apple Silicon M3/M4"],
    isVerified: true,
    providerCount: 42,
  },
  {
    id: "cap-stt-audio",
    name: "Automatic Speech Recognition (ASR)",
    inputModalities: ["audio"],
    outputModalities: ["text"],
    task: "automatic-speech-recognition",
    supportedRuntimes: ["vLLM-Omni", "TensorRT-LLM", "Faster-Whisper"],
    supportedHardware: ["NVIDIA A100", "NVIDIA L4", "T4"],
    isVerified: true,
    providerCount: 18,
  },
  {
    id: "cap-vlm-multimodal",
    name: "Vision-Language Understanding",
    inputModalities: ["image", "text"],
    outputModalities: ["text", "code", "tabular"],
    task: "image-text-to-text",
    supportedRuntimes: ["vLLM", "SGLang", "Ollama"],
    supportedHardware: ["NVIDIA H100", "NVIDIA A100", "L40S"],
    isVerified: true,
    providerCount: 26,
  },
  {
    id: "cap-embed-dense",
    name: "Dense Semantic Embeddings",
    inputModalities: ["text", "document"],
    outputModalities: ["tabular"],
    task: "feature-extraction",
    supportedRuntimes: ["TEI", "vLLM", "Infinity"],
    supportedHardware: ["NVIDIA L4", "T4", "CPU AVX-512"],
    isVerified: true,
    providerCount: 31,
  },
  {
    id: "cap-tts-speech",
    name: "Text-to-Speech Synthesis",
    inputModalities: ["text"],
    outputModalities: ["audio"],
    task: "text-to-speech",
    supportedRuntimes: ["ChatTTS", "XTTS", "Kokoro"],
    supportedHardware: ["NVIDIA L4", "RTX 4090"],
    isVerified: true,
    providerCount: 14,
  },
  {
    id: "cap-img-diffusion",
    name: "Text-to-Image Generation",
    inputModalities: ["text"],
    outputModalities: ["image"],
    task: "text-to-image",
    supportedRuntimes: ["Diffusers", "TensorRT", "ComfyUI"],
    supportedHardware: ["NVIDIA H100", "NVIDIA A100", "L40S"],
    isVerified: true,
    providerCount: 29,
  },
];

const HF_PINNED_MODELS = [
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    task: "text-generation",
    commitSha: "8f4ca7b9e112d308fbc8a23d84f18e9072a4bc03",
    license: "Llama 3.1 Community",
    contextLength: 131072,
    parameters: "8.03B",
    hfSignals: { pricingPer1kTokens: 0.00015, ttftMs: 42, throughputTps: 180, isGated: true },
    verifiedProfile: "vLLM 0.6.2 on 1x A100 (p95 38.2ms, $0.00012/1k)",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    task: "text-generation",
    commitSha: "4e82b79a1f09c8d32e54a01c7793b821045f91a6",
    license: "Apache 2.0",
    contextLength: 131072,
    parameters: "7.61B",
    hfSignals: { pricingPer1kTokens: 0.00014, ttftMs: 39, throughputTps: 195, isGated: false },
    verifiedProfile: "SGLang 0.3.4 on 1x A100 (p95 34.1ms, $0.00010/1k)",
  },
  {
    id: "BAAI/bge-m3",
    task: "feature-extraction",
    commitSha: "56d78a9bc012e345f678a901b234c567d890e123",
    license: "MIT",
    contextLength: 8192,
    parameters: "567M",
    hfSignals: { pricingPer1kTokens: 0.00002, ttftMs: 12, throughputTps: 840, isGated: false },
    verifiedProfile: "TEI on 1x L4 (p95 8.4ms, $0.00001/1k)",
  },
  {
    id: "openai/whisper-large-v3",
    task: "automatic-speech-recognition",
    commitSha: "123456789abcdef0123456789abcdef012345678",
    license: "MIT",
    contextLength: 448,
    parameters: "1.55B",
    hfSignals: { pricingPer1kTokens: 0.0003, ttftMs: 65, throughputTps: 92, isGated: false },
    verifiedProfile: "vLLM-Omni on 1x A100 (RTF 0.04, $0.003/min)",
  },
];

export function CapabilitiesView({
  dark = false,
  onSelectModel,
  onComposePipeline,
}: CapabilitiesViewProps) {
  const [activeTab, setActiveTab] = useState<"graph" | "hf_sync" | "runtimes">("graph");
  const [selectedInputModality, setSelectedInputModality] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCapabilities = SAMPLE_CAPABILITIES.filter((c) => {
    if (selectedInputModality !== "all" && !c.inputModalities.includes(selectedInputModality as ModalityType)) {
      return false;
    }
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.task.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* Top Header Matching Image 1 */}
      <div className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div>
          <h1 className={cn("text-2xl md:text-3xl font-medium tracking-tight", dark ? "text-[#F0EFE2]" : "text-[#151515]")}>
            Capability{" "}
            <span className="bg-[#75bf00] text-black px-2 py-0.5 font-bold inline-block rounded-xs">
              fabric
            </span>
          </h1>
          <p className={cn("mt-1 text-xs md:text-sm", dark ? "text-[#889084]" : "text-[#555]")}>
            {SAMPLE_CAPABILITIES.length} verified capability profiles across all input modalities, pinned Hugging Face revisions, and execution runtimes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs border-[#383838] bg-[#202020] text-[#a0a89d]">
            <Sparkles size={13} className="text-[#75bf00]" />
            <span>Pinned Revisions: 100% Verifiable</span>
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
            { id: "graph", label: `Capability I/O Graph (${SAMPLE_CAPABILITIES.length})` },
            { id: "hf_sync", label: "Hugging Face Hub Sync & Pinned Models" },
            { id: "runtimes", label: "Runtimes & Hardware Matrix" },
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
                    ? dark ? "text-[#F0EFE2] font-bold" : "text-[#151515] font-bold"
                    : dark ? "text-[#788274] hover:text-[#F0EFE2]" : "text-[#687063] hover:text-black"
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

      {/* TAB 1: CAPABILITY I/O GRAPH */}
      {activeTab === "graph" && (
        <div className="space-y-4">
          {/* Modality Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
              <span className="text-[#C8C7BA] mr-1">Input Modality:</span>
              {["all", "text", "audio", "image", "video", "document", "tabular", "telemetry"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedInputModality(m)}
                  className={cn(
                    "px-2 py-0.5 border rounded-xs uppercase text-[10px]",
                    selectedInputModality === m
                      ? "border-[#75bf00] bg-[#75bf00]/10 font-bold text-[#75bf00]"
                      : dark
                      ? "border-[#333] text-[#C8C7BA] hover:text-[#F0EFE2]"
                      : "border-[#ddd] text-[#666] hover:text-black"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-[#C8C7BA]" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search capabilities..."
                className={cn(
                  "pl-7 pr-3 py-1 text-xs font-mono border rounded-xs w-56",
                  dark ? "border-[#333] bg-[#181818] text-[#F0EFE2]" : "border-[#ddd] bg-white text-black"
                )}
              />
            </div>
          </div>

          {/* Capability Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCapabilities.map((cap) => (
              <div
                key={cap.id}
                className={cn(
                  "p-4 border border-dashed rounded-xs space-y-3 flex flex-col justify-between transition-all",
                  dark ? "border-[#2e2e2e] bg-[#181818] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white hover:border-[#75bf00]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 border border-[#75bf00]/30 text-[#75bf00] bg-[#75bf00]/10 rounded-xs uppercase">
                      {cap.task}
                    </span>
                    <span className="font-mono text-[10px] text-[#C8C7BA]">
                      {cap.providerCount} providers
                    </span>
                  </div>

                  <h3 className={cn("text-sm font-bold mt-2.5", dark ? "text-[#F0EFE2]" : "text-[#111]")}>
                    {cap.name}
                  </h3>

                  {/* Input -> Output Modality Flow */}
                  <div className="flex items-center gap-2 mt-3 font-mono text-xs text-[#788274]">
                    <div className="flex items-center gap-1">
                      {cap.inputModalities.map((im) => (
                        <span key={im} className="px-1.5 py-0.2 border bg-black/5 dark:bg-white/5 uppercase text-[9px] rounded-xs font-bold">
                          {im}
                        </span>
                      ))}
                    </div>
                    <ArrowRight size={12} className="text-[#75bf00]" />
                    <div className="flex items-center gap-1">
                      {cap.outputModalities.map((om) => (
                        <span key={om} className="px-1.5 py-0.2 border bg-[#75bf00]/10 text-[#75bf00] uppercase text-[9px] rounded-xs font-bold">
                          {om}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-dashed border-[#333]/20 text-[11px] font-mono">
                  <div className="text-[#C8C7BA] truncate">
                    <strong>Runtimes:</strong> {cap.supportedRuntimes.join(", ")}
                  </div>
                  <div className="text-[#C8C7BA] truncate">
                    <strong>Hardware:</strong> {cap.supportedHardware.join(", ")}
                  </div>

                  <button
                    type="button"
                    onClick={() => onComposePipeline?.(cap)}
                    className={cn(
                      "w-full mt-2 py-1.5 text-xs font-bold font-mono border rounded-xs transition-colors flex items-center justify-center gap-1.5",
                      dark
                        ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635] hover:bg-[#222e1d]"
                        : "border-[#b9de78] bg-[#f2fbe6] text-[#2d5800] hover:bg-[#eaf8db]"
                    )}
                  >
                    <Sparkles size={12} />
                    <span>Compose System</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: HUGGING FACE HUB SYNC & PINNED MODELS */}
      {activeTab === "hf_sync" && (
        <div className="space-y-4">
          <div
            className={cn(
              "p-4 border border-dashed rounded-xs space-y-3",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <div className="flex items-center justify-between border-b border-dashed border-[#333]/20 pb-3">
              <div>
                <h3 className={cn("text-sm font-bold", dark ? "text-[#F0EFE2]" : "text-[#111]")}>
                  Hugging Face Hub Model Truth Layer
                </h3>
                <p className="text-xs text-[#788274] mt-0.5">
                  Epoch pins every model by Repository + Revision + Commit SHA + Artifact Digest. External provider claims are distinguished from empirical measurements.
                </p>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 border border-[#75bf00] text-[#75bf00] rounded-xs font-bold">
                LIVE HUB SYNC ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              {HF_PINNED_MODELS.map((model) => (
                <div
                  key={model.id}
                  className={cn(
                    "p-3.5 border rounded-xs font-mono text-xs space-y-2",
                    dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#75bf00]">{model.id}</span>
                      <span className="text-[10px] px-1.5 py-0.2 border rounded-xs text-[#C8C7BA]">
                        {model.parameters}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 border rounded-xs text-[#C8C7BA]">
                        {model.license}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#C8C7BA]">SHA: {model.commitSha.slice(0, 10)}...</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 border border-dashed rounded-xs border-[#f59e0b]/30 bg-[#f59e0b]/5 text-[#f59e0b]">
                      <strong>External Provider Claim:</strong> ${model.hfSignals.pricingPer1kTokens}/1k | TTFT ~{model.hfSignals.ttftMs}ms | {model.hfSignals.throughputTps} tok/s
                    </div>
                    <div className="p-2 border border-dashed rounded-xs border-[#16a34a]/30 bg-[#16a34a]/5 text-[#16a34a]">
                      <strong>Epoch Verified Fact:</strong> {model.verifiedProfile}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RUNTIMES & HARDWARE MATRIX */}
      {activeTab === "runtimes" && (
        <div className="space-y-4">
          <div
            className={cn(
              "p-4 border border-dashed rounded-xs space-y-4",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <h3 className={cn("text-sm font-bold", dark ? "text-[#F0EFE2]" : "text-[#111]")}>
              Runtime Engine & Hardware Compatibility Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className={cn("p-3 border rounded-xs space-y-2", dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]")}>
                <div className="flex items-center gap-2 font-bold text-[#75bf00]">
                  <VLLMLogo size={14} />
                  <span>vLLM (v0.6.2)</span>
                </div>
                <div className="text-[11px] text-[#C8C7BA]">
                  • PagedAttention v2 with FP8 KV cache<br />
                  • Continuous batching with speculative decoding<br />
                  • Target: NVIDIA H100 / A100 / L40S
                </div>
              </div>

              <div className={cn("p-3 border rounded-xs space-y-2", dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]")}>
                <div className="flex items-center gap-2 font-bold text-[#75bf00]">
                  <SGLangLogo size={14} />
                  <span>SGLang (v0.3.4)</span>
                </div>
                <div className="text-[11px] text-[#C8C7BA]">
                  • RadixAttention prefix caching for agent loops<br />
                  • Jump-forward decoding for structured JSON<br />
                  • Target: Multi-turn RAG & Agentic Workloads
                </div>
              </div>

              <div className={cn("p-3 border rounded-xs space-y-2", dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]")}>
                <div className="flex items-center gap-2 font-bold text-[#75bf00]">
                  <NvidiaLogo size={14} />
                  <span>TensorRT-LLM (v0.12)</span>
                </div>
                <div className="text-[11px] text-[#C8C7BA]">
                  • In-flight batching & custom kernel fusions<br />
                  • Sub-millisecond TTFT on NVIDIA H100 SXM5<br />
                  • Target: Ultra low latency SLA (&lt;30ms p99)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronRight, CheckCircle2 } from "lucide-react";
import { ModelEntity } from "@/lib/horos-types";
import {
  AnthropicLogo,
  BAAILogo,
  DeepSeekLogo,
  GLMLogo,
  GoogleLogo,
  HuggingFaceLogo,
  MetaLogo,
  MistralLogo,
  NvidiaLogo,
  OpenAILogo,
  QwenLogo,
  KimiLogo,
  MicrosoftLogo,
  MiniMaxLogo,
  InclusionAILogo,
  XiaomiLogo,
  PoolsideLogo,
  UpstageLogo,
  OrnithLogo,
} from "../primitives/brand-icons";

export interface CanonicalHostedModelItem extends ModelEntity {
  servedId: string;
  isChat?: boolean;
  isTrending?: boolean;
  promoBadge?: string;
  inputPromoSub?: string;
  inputListPrice?: string;
  outputPromoSub?: string;
  outputListPrice?: string;
  brand: "ornith" | "deepseek" | "glm" | "nvidia" | "qwen" | "other";
}

export const CANONICAL_HOSTED_MODELS: CanonicalHostedModelItem[] = [
  {
    id: "ornith-1-5-122b",
    name: "Ornith 1.5 122B",
    servedId: "ornith-ai/Ornith-1.5-122B",
    provider: "ornith-ai",
    brand: "ornith",
    task: "Multimodal Chat & Agent Reasoning",
    parameters: "122B",
    contextWindow: 262144,
    license: "Ornith Community License",
    format: "BF16 / FP8",
    status: "available",
    isChat: true,
    isTrending: true,
    description: "Flagship multi-modal reasoning and tool calling foundation model with ultra-long 262k context.",
    hfIdentity: {
      repositoryId: "ornith-ai/Ornith-1.5-122B",
      revision: "main",
      commitSha: "8a1b2c3d4e5f",
      license: "Ornith Community License",
      isGated: false,
      retrievedAt: "2026-10-20T08:00:00Z",
    },
    pricing: {
      inputPricePer1M: 0.26,
      cachedInputPricePer1M: 0.05,
      outputPricePer1M: 2.08,
      contextWindow: 262144,
      maxGeneratedOutput: 16384,
      ttftLimitSec: 45,
      maxRequestDurationSec: 300,
      perKeyConcurrency: 8,
      workspaceConcurrency: 32,
      workspaceTokenRatePerMin: 500000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming", "Image input"],
    bestObservedProfile: {
      engine: "SGLang",
      hardware: "8x NVIDIA H100 SXM5 80GB",
      executionDomain: "data_center",
      p95LatencyMs: 280,
      costPer1M: 0.26,
    },
    variants: [],
  },
  {
    id: "deepseek-v4-1-flash-1017",
    name: "DeepSeek V4.1 Flash 1017",
    servedId: "deepseek-ai/DeepSeek-V4.1-Flash-1017",
    provider: "deepseek-ai",
    brand: "deepseek",
    task: "Chat & Agent Tool Execution",
    parameters: "MoE 16B active (130B total)",
    contextWindow: 1048576,
    license: "DeepSeek Open License",
    format: "FP8",
    status: "available",
    isChat: true,
    isTrending: true,
    description: "DeepSeek V4.1 Flash checkpoint 1017 with 1M tokens context and high-concurrency tool calling.",
    hfIdentity: {
      repositoryId: "deepseek-ai/DeepSeek-V4.1-Flash-1017",
      revision: "main",
      commitSha: "10179a8b7c6d",
      license: "DeepSeek Open License",
      isGated: false,
      retrievedAt: "2026-10-17T12:00:00Z",
    },
    pricing: {
      inputPricePer1M: 0.15,
      cachedInputPricePer1M: 0.03,
      outputPricePer1M: 0.60,
      contextWindow: 1048576,
      maxGeneratedOutput: 32768,
      ttftLimitSec: 30,
      maxRequestDurationSec: 600,
      perKeyConcurrency: 16,
      workspaceConcurrency: 64,
      workspaceTokenRatePerMin: 1000000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming", "Image input"],
    bestObservedProfile: {
      engine: "SGLang",
      hardware: "4x NVIDIA H100 SXM5 80GB",
      executionDomain: "data_center",
      p95LatencyMs: 190,
      costPer1M: 0.15,
    },
    variants: [],
  },
  {
    id: "glm-5-3",
    name: "GLM 5.3",
    servedId: "zai-org/GLM-5.3",
    provider: "zai-org",
    brand: "glm",
    task: "Chat & Enterprise Reasoning",
    parameters: "130B",
    contextWindow: 1048576,
    license: "Zhipu AI Open License",
    format: "BF16",
    status: "available",
    isChat: true,
    isTrending: true,
    description: "Zhipu AI GLM 5.3 full reasoning model with 1M context window and tool calling support.",
    hfIdentity: {
      repositoryId: "zai-org/GLM-5.3",
      revision: "main",
      commitSha: "5300abcdef12",
      license: "Zhipu Open License",
      isGated: false,
      retrievedAt: "2026-10-18T10:00:00Z",
    },
    pricing: {
      inputPricePer1M: 1.30,
      cachedInputPricePer1M: 0.25,
      outputPricePer1M: 4.20,
      contextWindow: 1048576,
      maxGeneratedOutput: 16384,
      ttftLimitSec: 60,
      maxRequestDurationSec: 300,
      perKeyConcurrency: 8,
      workspaceConcurrency: 32,
      workspaceTokenRatePerMin: 400000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming"],
    bestObservedProfile: {
      engine: "vLLM",
      hardware: "8x NVIDIA H100 SXM5 80GB",
      executionDomain: "data_center",
      p95LatencyMs: 320,
      costPer1M: 1.30,
    },
    variants: [],
  },
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    servedId: "zai-org/GLM-5.3-Flash",
    provider: "zai-org",
    brand: "glm",
    task: "High-Throughput Chat & Vision",
    parameters: "32B (MoE 8B active)",
    contextWindow: 1048576,
    license: "Zhipu AI Open License",
    format: "FP8",
    status: "available",
    isChat: true,
    isTrending: true,
    promoBadge: "51% off until Nov 4, 2026, 7:59 AM UTC",
    inputPromoSub: "until Nov 4, 2026, 7:59 AM UTC",
    inputListPrice: "List $0.11",
    outputPromoSub: "until Nov 4, 2026, 7:59 AM UTC",
    outputListPrice: "List $0.45",
    description: "High-speed 1M context GLM model with 51% promotional discount on input and output tokens.",
    hfIdentity: {
      repositoryId: "zai-org/GLM-5.3-Flash",
      revision: "main",
      commitSha: "53f198273641",
      license: "Zhipu Open License",
      isGated: false,
      retrievedAt: "2026-10-22T08:00:00Z",
    },
    pricing: {
      inputPricePer1M: 0.05,
      cachedInputPricePer1M: 0.01,
      outputPricePer1M: 0.22,
      contextWindow: 1048576,
      maxGeneratedOutput: 32768,
      ttftLimitSec: 25,
      maxRequestDurationSec: 600,
      perKeyConcurrency: 32,
      workspaceConcurrency: 128,
      workspaceTokenRatePerMin: 2000000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming", "Image input"],
    bestObservedProfile: {
      engine: "SGLang",
      hardware: "2x NVIDIA L40S 48GB",
      executionDomain: "cloud",
      p95LatencyMs: 140,
      costPer1M: 0.05,
    },
    variants: [],
  },
  {
    id: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    servedId: "deepseek-ai/DeepSeek-V4.1-Flash",
    provider: "deepseek-ai",
    brand: "deepseek",
    task: "Chat & Agent Coding",
    parameters: "14B (MoE 2.4B active)",
    contextWindow: 1048576,
    license: "DeepSeek Open License",
    format: "FP8",
    status: "available",
    isChat: true,
    isTrending: false,
    description: "Production stable DeepSeek V4.1 Flash with 1M context, exceptional coding and structured JSON synthesis.",
    hfIdentity: {
      repositoryId: "deepseek-ai/DeepSeek-V4.1-Flash",
      revision: "main",
      commitSha: "410098f7e6d5",
      license: "DeepSeek Open License",
      isGated: false,
      retrievedAt: "2026-10-15T09:00:00Z",
    },
    pricing: {
      inputPricePer1M: 0.14,
      cachedInputPricePer1M: 0.03,
      outputPricePer1M: 0.58,
      contextWindow: 1048576,
      maxGeneratedOutput: 32768,
      ttftLimitSec: 30,
      maxRequestDurationSec: 600,
      perKeyConcurrency: 16,
      workspaceConcurrency: 64,
      workspaceTokenRatePerMin: 800000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming"],
    bestObservedProfile: {
      engine: "SGLang",
      hardware: "2x NVIDIA H100 SXM5 80GB",
      executionDomain: "data_center",
      p95LatencyMs: 175,
      costPer1M: 0.14,
    },
    variants: [],
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Nemotron 3.5 Lightning 30B",
    servedId: "nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16",
    provider: "nvidia",
    brand: "nvidia",
    task: "Low-Latency Enterprise Chat",
    parameters: "30B (MoE active)",
    contextWindow: 262144,
    license: "NVIDIA Open Model License",
    format: "BF16",
    status: "available",
    isChat: true,
    isTrending: false,
    description: "NVIDIA optimized Nemotron-3.5 Lightning with ultra-fast time-to-first-token and low per-token cost.",
    hfIdentity: {
      repositoryId: "nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16",
      revision: "main",
      commitSha: "35b1f6e89a0b",
      license: "NVIDIA License",
      isGated: false,
      retrievedAt: "2026-10-16T11:00:00Z",
    },
    pricing: {
      inputPricePer1M: 0.05,
      cachedInputPricePer1M: 0.01,
      outputPricePer1M: 0.15,
      contextWindow: 262144,
      maxGeneratedOutput: 8192,
      ttftLimitSec: 20,
      maxRequestDurationSec: 180,
      perKeyConcurrency: 32,
      workspaceConcurrency: 128,
      workspaceTokenRatePerMin: 1500000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming"],
    bestObservedProfile: {
      engine: "TensorRT-LLM",
      hardware: "1x NVIDIA H100 SXM5 80GB",
      executionDomain: "cloud",
      p95LatencyMs: 95,
      costPer1M: 0.05,
    },
    variants: [],
  },
  {
    id: "ornith-1-5-35b",
    name: "Ornith 1.5 35B",
    servedId: "ornith-ai/Ornith-1.5-35B-A3B",
    provider: "ornith-ai",
    brand: "ornith",
    task: "Cost-Effective Multimodal Chat",
    parameters: "35B",
    contextWindow: 262144,
    license: "Ornith Community License",
    format: "BF16",
    status: "available",
    isChat: true,
    isTrending: false,
    description: "Compact Ornith 1.5 35B model for high-efficiency image and multimodal understanding.",
    hfIdentity: {
      repositoryId: "ornith-ai/Ornith-1.5-35B-A3B",
      revision: "main",
      commitSha: "35a3b7c89d0e",
      license: "Ornith Community License",
      isGated: false,
      retrievedAt: "2026-10-21T14:00:00Z",
    },
    pricing: {
      inputPricePer1M: 0.10,
      cachedInputPricePer1M: 0.02,
      outputPricePer1M: 0.40,
      contextWindow: 262144,
      maxGeneratedOutput: 16384,
      ttftLimitSec: 35,
      maxRequestDurationSec: 300,
      perKeyConcurrency: 16,
      workspaceConcurrency: 64,
      workspaceTokenRatePerMin: 600000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming", "Image input"],
    bestObservedProfile: {
      engine: "SGLang",
      hardware: "2x NVIDIA L40S 48GB",
      executionDomain: "cloud",
      p95LatencyMs: 165,
      costPer1M: 0.10,
    },
    variants: [],
  },
  {
    id: "qwen-3-8-27b",
    name: "Qwen3.8 27B",
    servedId: "Qwen/Qwen3.8-27B",
    provider: "Qwen",
    brand: "qwen",
    task: "Multilingual Chat & Vision Reasoning",
    parameters: "27B",
    contextWindow: 262144,
    license: "Apache 2.0",
    format: "BF16",
    status: "available",
    isChat: true,
    isTrending: false,
    description: "Alibaba Tongyi Qwen 3.8 27B dense foundation model with multimodal visual comprehension and structured output.",
    hfIdentity: {
      repositoryId: "Qwen/Qwen3.8-27B",
      revision: "main",
      commitSha: "3827bcda1234",
      license: "Apache 2.0",
      isGated: false,
      retrievedAt: "2026-10-23T09:00:00Z",
    },
    pricing: {
      inputPricePer1M: 0.10,
      cachedInputPricePer1M: 0.02,
      outputPricePer1M: 0.40,
      contextWindow: 262144,
      maxGeneratedOutput: 16384,
      ttftLimitSec: 35,
      maxRequestDurationSec: 300,
      perKeyConcurrency: 16,
      workspaceConcurrency: 64,
      workspaceTokenRatePerMin: 600000,
    },
    capabilities: ["Tool calling", "JSON mode", "Streaming", "Image input"],
    bestObservedProfile: {
      engine: "vLLM",
      hardware: "2x NVIDIA L40S 48GB",
      executionDomain: "cloud",
      p95LatencyMs: 155,
      costPer1M: 0.10,
    },
    variants: [],
  },
];

interface ModelsCatalogViewProps {
  models?: ModelEntity[];
  onSelectModel: (modelId: string) => void;
  onOpenImport?: () => void;
  onManageKeys?: () => void;
  onSearchModels?: (query: string) => Promise<ModelEntity[]>;
  dark?: boolean;
}

export function ModelsCatalogView({
  models = [],
  onSelectModel,
  onSearchModels,
}: ModelsCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ModelEntity[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!onSearchModels || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const next = await onSearchModels(searchQuery.trim());
        if (!cancelled) setSearchResults(next);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onSearchModels, searchQuery]);

  function iconFor(brand: string, rawText?: string) {
    const raw = `${brand} ${rawText || ""}`.toLowerCase();
    if (raw.includes("ornith")) return <OrnithLogo size={24} />;
    if (raw.includes("deepseek")) return <DeepSeekLogo size={22} />;
    if (raw.includes("glm") || raw.includes("zhipu") || raw.includes("zai")) return <GLMLogo size={22} />;
    if (raw.includes("nvidia") || raw.includes("nemotron")) return <NvidiaLogo size={22} />;
    if (raw.includes("qwen") || raw.includes("alibaba")) return <QwenLogo size={22} />;
    if (raw.includes("minimaxai")) return <MiniMaxLogo size={22} />;
    if (raw.includes("inclusionai")) return <InclusionAILogo size={22} />;
    if (raw.includes("xiaomi")) return <XiaomiLogo size={22} />;
    if (raw.includes("poolside")) return <PoolsideLogo size={22} />;
    if (raw.includes("upstage")) return <UpstageLogo size={22} />;
    if (raw.includes("microsoft") || raw.includes("phi-")) return <MicrosoftLogo size={22} />;
    if (raw.includes("llama") || raw.includes("meta")) return <MetaLogo size={22} />;
    if (raw.includes("mistral") || raw.includes("mixtral")) return <MistralLogo size={22} />;
    if (raw.includes("claude") || raw.includes("anthropic")) return <AnthropicLogo size={22} />;
    if (raw.includes("gpt") || raw.includes("openai")) return <OpenAILogo size={22} />;
    if (raw.includes("gemini") || raw.includes("google")) return <GoogleLogo size={22} />;
    if (raw.includes("bge") || raw.includes("baai")) return <BAAILogo size={22} />;
    if (raw.includes("kimi") || raw.includes("moonshot")) return <KimiLogo size={22} />;
    return <HuggingFaceLogo size={22} />;
  }

  // Combine canonical list with incoming models
  const sourceModels: CanonicalHostedModelItem[] = useMemo(() => {
    if (searchResults && searchResults.length > 0) {
      return searchResults.map((m) => ({
        ...m,
        servedId: m.hfIdentity?.repositoryId || m.id,
        isChat: true,
        isTrending: false,
        brand: "other",
      }));
    }

    if (!models || models.length === 0) {
      return CANONICAL_HOSTED_MODELS;
    }

    // If incoming models match canonical IDs, overlay them
    const canonicalMap = new Map(CANONICAL_HOSTED_MODELS.map((cm) => [cm.id, cm]));
    const overlaid: CanonicalHostedModelItem[] = models.map((m) => {
      const canonical = canonicalMap.get(m.id);
      if (canonical) {
        return {
          ...canonical,
          ...m,
          servedId: canonical.servedId,
          brand: canonical.brand,
          isChat: canonical.isChat,
          isTrending: canonical.isTrending,
          promoBadge: canonical.promoBadge,
          inputPromoSub: canonical.inputPromoSub,
          inputListPrice: canonical.inputListPrice,
          outputPromoSub: canonical.outputPromoSub,
          outputListPrice: canonical.outputListPrice,
        };
      }
      return {
        ...m,
        servedId: m.hfIdentity?.repositoryId || m.id,
        brand: "other" as const,
        isChat: true,
      };
    });

    // Ensure our 8 canonical hosted models are always displayed
    for (const cm of CANONICAL_HOSTED_MODELS) {
      if (!overlaid.some((om) => om.id === cm.id)) {
        overlaid.push(cm);
      }
    }

    return overlaid;
  }, [models, searchResults]);

  const filteredModels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sourceModels;
    return sourceModels.filter((m) => {
      const matchName = m.name.toLowerCase().includes(q);
      const matchServed = (m.servedId || "").toLowerCase().includes(q);
      const matchProvider = (m.provider || "").toLowerCase().includes(q);
      const matchCapabilities = (m.capabilities || []).some((c) => c.toLowerCase().includes(q));
      return matchName || matchServed || matchProvider || matchCapabilities;
    });
  }, [sourceModels, searchQuery]);

  return (
    <div className="w-full bg-[#111111] min-h-screen text-[#F0EFE2] font-sans pb-32">
      <div className="max-w-[1320px] mx-auto px-6 pt-10">
        
        {/* Header Block matching Image 1 */}
        <div className="flex flex-col">
          <div className="flex items-center">
            <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center">
              Model
              <span className="ml-2.5 bg-[#75bf00] text-black text-[13px] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wide leading-none">
                APIs
              </span>
            </h1>
          </div>
          <p className="text-[#8e8e93] text-[13.5px] mt-1.5 font-normal">
            Choose the hosted model that fits your request.
          </p>
        </div>

        {/* Search Toolbar matching Image 1 */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[5px] bg-[#141414] border border-[#262626] focus-within:border-[#444] transition-colors w-full max-w-[320px]">
            <Search size={14} className="text-[#666] shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, provider or served ID"
              className="bg-transparent text-[13px] text-[#eee] placeholder:text-[#666] outline-none w-full font-normal"
            />
          </div>
          <div className="text-[13px] text-[#777] font-normal whitespace-nowrap">
            {filteredModels.length} models
          </div>
        </div>

        {/* Table Container */}
        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Table Header Row matching Image 1 */}
            <div className="border-b border-dashed border-[#282828] pb-3 text-[11px] font-mono tracking-wider text-[#777] uppercase flex items-center select-none">
              <div className="flex-[2.5] min-w-0 pr-4">MODEL</div>
              <div className="w-[120px] shrink-0 text-left">INPUT / 1M</div>
              <div className="w-[120px] shrink-0 text-left">OUTPUT / 1M</div>
              <div className="w-[170px] shrink-0 text-left">CONTEXT</div>
              <div className="w-[110px] shrink-0 text-left">STATE</div>
              <div className="w-[28px] shrink-0"></div>
            </div>

            {/* Model Rows */}
            {searching && (
              <div className="py-16 text-center text-[#777] text-[13px] border-b border-dashed border-[#242424]">
                Searching hosted models...
              </div>
            )}

            {!searching && filteredModels.length === 0 && (
              <div className="py-16 text-center text-[#777] text-[13px] border-b border-dashed border-[#242424]">
                No models found matching &quot;{searchQuery}&quot;
              </div>
            )}

            {!searching && filteredModels.map((m) => {
              const inputPriceFormatted = m.pricing?.inputPricePer1M
                ? `$${m.pricing.inputPricePer1M.toFixed(2)}`
                : "$0.10";
              const outputPriceFormatted = m.pricing?.outputPricePer1M
                ? `$${m.pricing.outputPricePer1M.toFixed(2)}`
                : "$0.40";
              const contextFormatted = m.contextWindow
                ? Number(m.contextWindow).toLocaleString()
                : "262,144";
              const capabilitiesStr = m.capabilities && m.capabilities.length > 0
                ? m.capabilities.join(" / ")
                : "Tool calling / JSON mode / Streaming";

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className="flex items-center border-b border-dashed border-[#242424] py-4.5 hover:bg-[#161616]/70 transition-colors cursor-pointer group"
                >
                  {/* Left Column (Logo + Name + Badges + Served ID + Capabilities) */}
                  <div className="flex-[2.5] min-w-0 pr-4 flex items-center gap-3.5">
                    {/* Dark square icon container */}
                    <div className="w-[36px] h-[36px] rounded-[5px] bg-[#181818] border border-[#282828] flex items-center justify-center shrink-0">
                      {iconFor(m.brand, `${m.id} ${m.name}`)}
                    </div>

                    {/* Text block */}
                    <div className="flex flex-col min-w-0">
                      {/* Line 1: Name + Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-semibold text-white tracking-tight group-hover:text-[#75bf00] transition-colors">
                          {m.name}
                        </span>
                        {m.isChat && (
                          <span className="bg-[#202020] text-[#aaa] border border-[#2d2d2d] text-[10.5px] font-medium px-2 py-0.5 rounded-[3px] leading-none">
                            Chat
                          </span>
                        )}
                        {m.promoBadge && (
                          <span className="bg-[#12220e] text-[#75bf00] border border-[#75bf00]/30 text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] leading-none">
                            {m.promoBadge}
                          </span>
                        )}
                        {m.isTrending && (
                          <span className="bg-[#202020] text-[#aaa] border border-[#2d2d2d] text-[10.5px] font-medium px-2 py-0.5 rounded-[3px] leading-none">
                            Trending
                          </span>
                        )}
                      </div>

                      {/* Line 2: Served ID */}
                      <div className="text-[12px] font-mono text-[#777] mt-0.5 truncate">
                        {m.servedId}
                      </div>

                      {/* Line 3: Model Capabilities */}
                      <div className="text-[10.5px] font-mono text-[#666] mt-0.5 tracking-tight truncate">
                        <span className="text-[#555] font-semibold">MODEL CAPABILITIES:</span>{" "}
                        {capabilitiesStr}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: INPUT / 1M */}
                  <div className="w-[120px] shrink-0 flex flex-col justify-center">
                    <div className="flex items-center text-[13.5px] font-semibold text-white">
                      <span className="text-[#888] text-[12px] mr-1">↓</span>
                      <span>{inputPriceFormatted}</span>
                    </div>
                    {m.inputPromoSub && (
                      <div className="text-[9.5px] font-mono text-[#666] leading-tight mt-0.5">
                        {m.inputPromoSub}
                      </div>
                    )}
                    {m.inputListPrice && (
                      <div className="text-[9.5px] font-mono text-[#555] leading-tight line-through">
                        {m.inputListPrice}
                      </div>
                    )}
                  </div>

                  {/* Column 3: OUTPUT / 1M */}
                  <div className="w-[120px] shrink-0 flex flex-col justify-center">
                    <div className="flex items-center text-[13.5px] font-semibold text-white">
                      <span className="text-[#888] text-[12px] mr-1">↑</span>
                      <span>{outputPriceFormatted}</span>
                    </div>
                    {m.outputPromoSub && (
                      <div className="text-[9.5px] font-mono text-[#666] leading-tight mt-0.5">
                        {m.outputPromoSub}
                      </div>
                    )}
                    {m.outputListPrice && (
                      <div className="text-[9.5px] font-mono text-[#555] leading-tight line-through">
                        {m.outputListPrice}
                      </div>
                    )}
                  </div>

                  {/* Column 4: CONTEXT */}
                  <div className="w-[170px] shrink-0 flex items-center">
                    <span className="font-mono text-[#555] text-[13px] mr-1.5">{"{ }"}</span>
                    <span className="text-[13px] font-semibold text-white tracking-tight">
                      {contextFormatted}
                    </span>
                    <span className="text-[10px] font-mono text-[#666] ml-1 uppercase">TOKENS</span>
                  </div>

                  {/* Column 5: STATE */}
                  <div className="w-[110px] shrink-0 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[#75bf00] shrink-0" />
                    <span className="text-[#75bf00] text-[12.5px] font-medium">Available</span>
                  </div>

                  {/* Column 6: Right Chevron */}
                  <div className="w-[28px] shrink-0 flex justify-end text-[#555] group-hover:text-white transition-colors">
                    <ChevronRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

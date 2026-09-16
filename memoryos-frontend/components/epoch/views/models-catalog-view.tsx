"use client";

import React, { useEffect, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { ModelEntity } from "@/lib/epoch-types";
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
} from "../primitives/brand-icons";

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

  function iconFor(model: ModelEntity) {
    const raw = `${model.id || ""} ${model.name || ""} ${model.provider || ""} ${model.hfIdentity?.repositoryId || ""}`.toLowerCase();
    const normalized = raw.replace(/\s+/g, "");
    
    if (normalized.includes("minimaxai")) return <MiniMaxLogo size={28} />;
    if (normalized.includes("inclusionai/")) return <InclusionAILogo size={28} />;
    if (normalized.includes("xiaomimimo/")) return <XiaomiLogo size={28} />;
    if (normalized.includes("poolside/")) return <PoolsideLogo size={28} />;
    if (normalized.includes("upstage/")) return <UpstageLogo size={28} />;
    if (raw.includes("microsoft") || raw.includes("phi-")) return <MicrosoftLogo size={28} />;
    if (raw.includes("llama") || raw.includes("meta")) return <MetaLogo size={28} />;
    if (raw.includes("mistral") || raw.includes("mixtral")) return <MistralLogo size={28} />;
    if (raw.includes("qwen") || raw.includes("alibaba")) return <QwenLogo size={28} />;
    if (raw.includes("deepseek")) return <DeepSeekLogo size={28} />;
    if (raw.includes("claude") || raw.includes("anthropic")) return <AnthropicLogo size={28} />;
    if (raw.includes("gpt") || raw.includes("openai")) return <OpenAILogo size={28} />;
    if (raw.includes("gemini") || raw.includes("google")) return <GoogleLogo size={28} />;
    if (raw.includes("nvidia") || raw.includes("nemotron")) return <NvidiaLogo size={28} />;
    if (raw.includes("glm") || raw.includes("zhipu")) return <GLMLogo size={28} />;
    if (raw.includes("bge") || raw.includes("baai")) return <BAAILogo size={28} />;
    if (raw.includes("kimi") || raw.includes("moonshot")) return <KimiLogo size={28} />;
    
    // Fallback icon
    return <HuggingFaceLogo size={28} />;
  }

  const visibleModels = searchResults ?? models;
  
  // Create mock data for cache hits and output speeds as per image 1
  const getMockStats = (name: string) => {
    if (name.includes("GLM")) return { cacheHit: "99.6", speed: "254.1" };
    if (name.includes("Nemotron")) return { cacheHit: "95.8", speed: "540.9" };
    if (name.includes("Qwen")) return { cacheHit: "96.3", speed: "140", speedSub: "end to end" };
    if (name.includes("Ornith")) return { cacheHit: "-", cacheHitText: "not yet\npublished", speed: "216" };
    return { cacheHit: "98.2", speed: "200.5" };
  };

  const hostedModels = visibleModels.map((model) => {
    const stats = getMockStats(model.name);
    return {
      id: model.id,
      name: model.name,
      capabilitiesText: model.capabilities && model.capabilities.length > 0
        ? model.capabilities.slice(0, 4).join(" / ")
        : "Tool calling / JSON mode / Streaming / Image input",
      inputPriceValue: model.pricing?.inputPricePer1M ? model.pricing.inputPricePer1M.toFixed(2) : "0.10",
      cachedInputPriceValue: model.pricing?.cachedInputPricePer1M ? model.pricing.cachedInputPricePer1M.toFixed(2) : "0.01",
      outputPriceValue: model.pricing?.outputPricePer1M ? model.pricing.outputPricePer1M.toFixed(2) : "0.40",
      cacheHitValue: stats.cacheHit,
      cacheHitText: stats.cacheHitText || "cache hit, last 24\nhours",
      outputSpeedValue: stats.speed,
      outputSpeedText: stats.speedSub || "model only",
      icon: iconFor(model),
    };
  });

  const filteredModels = hostedModels.filter(
    (m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#111111] min-h-screen text-[#F0EFE2] font-sans pb-32">
      <div className="max-w-[1280px] mx-auto px-6 pt-10">
        
        {/* Top Search Bar */}
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center border-b border-dashed border-[#282828] pb-4">
            <div className="flex items-center gap-3 w-full">
              <Search size={18} className="text-[#75bf00]" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, IDs, or capabilities" 
                className="bg-transparent outline-none w-full text-[15px] placeholder:text-[#666] font-medium" 
              />
            </div>
            <div className="text-[13px] text-[#888] whitespace-nowrap font-medium">
              {filteredModels.length} models
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-6 text-[13px] text-[#888] font-medium pt-5 pb-5 border-b border-dashed border-[#282828]">
            <button className="text-[#F0EFE2] hover:text-white transition-colors">Capabilities</button>
            <button className="hover:text-[#F0EFE2] transition-colors">JSON mode <span className="text-[#555] ml-1">4</span></button>
            <button className="hover:text-[#F0EFE2] transition-colors">Streaming <span className="text-[#555] ml-1">4</span></button>
            <button className="hover:text-[#F0EFE2] transition-colors">Tool calling <span className="text-[#555] ml-1">4</span></button>
            <button className="hover:text-[#F0EFE2] transition-colors">Image input <span className="text-[#555] ml-1">3</span></button>
          </div>
        </div>

        {/* Model Rows */}
        <div className="flex flex-col">
          {searching && (
            <div className="py-12 text-[#888] text-sm">Searching...</div>
          )}
          {!searching && filteredModels.length === 0 && (
            <div className="py-12 text-[#888] text-sm">No models found.</div>
          )}
          {!searching && filteredModels.map((m) => (
            <div 
              key={m.id} 
              onClick={() => onSelectModel(m.id)} 
              className="flex items-start justify-between py-10 border-b border-dashed border-[#282828] cursor-pointer group"
            >
              {/* Left Column (Brand + Name + Badges + Capabilities) */}
              <div className="flex items-start gap-5 w-[300px] shrink-0">
                <div className="pt-0.5">{m.icon}</div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-[22px] font-bold text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors tracking-tight leading-none">
                      {m.name}
                    </span>
                    <span className="bg-[#333] text-[10px] px-1.5 py-0.5 rounded-sm text-[#ccc] font-medium inline-block">
                      Trending
                    </span>
                  </div>
                  <div className="text-[#888] text-[13px] mt-2 pr-4 leading-relaxed font-medium">
                    {m.capabilitiesText}
                  </div>
                </div>
              </div>

              {/* Center Metric Columns */}
              <div className="flex items-start flex-1 justify-between px-6">
                
                {/* Input Price */}
                <div className="flex flex-col items-start">
                  <div className="text-[24px] font-bold text-[#F0EFE2] tracking-tight">
                    <span className="text-[#888] text-[16px] font-medium mr-0.5">$</span>{m.inputPriceValue}
                  </div>
                  <div className="text-[#888] text-[12px] mt-1 text-left">
                    per 1M input tokens
                  </div>
                </div>
                
                {/* Cached Input Price */}
                <div className="flex flex-col items-start">
                  <div className="text-[24px] font-bold text-[#F0EFE2] tracking-tight">
                    <span className="text-[#888] text-[16px] font-medium mr-0.5">$</span>{m.cachedInputPriceValue}
                  </div>
                  <div className="text-[#888] text-[12px] mt-1 text-center whitespace-pre-line leading-tight">
                    {"per 1M cached input\ntokens"}
                  </div>
                </div>

                {/* Output Price */}
                <div className="flex flex-col items-start">
                  <div className="text-[24px] font-bold text-[#F0EFE2] tracking-tight">
                    <span className="text-[#888] text-[16px] font-medium mr-0.5">$</span>{m.outputPriceValue}
                  </div>
                  <div className="text-[#888] text-[12px] mt-1 text-center whitespace-pre-line leading-tight">
                    {"per 1M output\ntokens"}
                  </div>
                </div>

                {/* Cache Hit */}
                <div className="flex flex-col items-center relative">
                  <div className="text-[24px] font-bold text-[#F0EFE2] tracking-tight">
                    {m.cacheHitValue !== "-" ? (
                      <>{m.cacheHitValue} <span className="text-[#888] text-[16px] font-medium">%</span></>
                    ) : (
                      <span className="text-[#F0EFE2]">-</span>
                    )}
                  </div>
                  <div className="text-[#888] text-[12px] mt-1 text-center whitespace-pre-line leading-tight">
                    {m.cacheHitText}
                  </div>
                  
                  {/* Effective Input Text floating below */}
                  {m.cacheHitValue !== "-" && (
                    <div className="absolute top-[100%] pt-8 text-[11px] text-[#666] whitespace-nowrap">
                      Effective input $0.011 per 1M at that hit rate
                    </div>
                  )}
                </div>

                {/* Output Speed */}
                <div className="flex flex-col items-end">
                  <div className="text-[24px] font-bold text-[#F0EFE2] tracking-tight">
                    {m.outputSpeedValue}
                  </div>
                  <div className="text-[#888] text-[12px] mt-1 text-right whitespace-pre-line leading-tight">
                    {`output tok/s, ${m.outputSpeedText}`}
                  </div>
                </div>
                
              </div>

              {/* Right Arrow */}
              <div className="flex items-center justify-end w-12 pt-2 text-[#666] group-hover:text-[#F0EFE2] transition-colors">
                <ArrowRight size={18} strokeWidth={1.5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Search, ChevronRight, BarChart2, Clock, CheckCircle2, ArrowDown, ArrowUp } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  dark = true,
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

  // Official brand logo resolver (100% authentic brand SVGs)
  function iconFor(model: ModelEntity) {
    const raw = `${model.id || ""} ${model.name || ""} ${model.provider || ""} ${model.hfIdentity?.repositoryId || ""}`.toLowerCase();
    const normalized = raw.replace(/\s+/g, "");
    const officialMiniMax = ["minimaxai/minimax-h3", "minimaxai/minimax-m2.7", "minimaxai/minimax-m2.5"];
    const officialMiniMaxByName = ["minimax-h3", "minimax-m2.7", "minimax-m2.5"];
    const isOfficialMiniMax = officialMiniMax.some((modelId) => normalized.includes(modelId))
      || (normalized.includes("minimaxai") && officialMiniMaxByName.some((modelName) => normalized.includes(modelName)));

    // MiniMax branding is reserved for the three official MiniMaxAI models.
    // Community derivatives (for example Comfy-Org or Alibay) must not inherit it.
    if (isOfficialMiniMax) return <MiniMaxLogo size={24} />;
    if (normalized.includes("inclusionai/")) return <InclusionAILogo size={24} />;
    if (normalized.includes("xiaomimimo/")) return <XiaomiLogo size={24} />;
    if (normalized.includes("poolside/")) return <PoolsideLogo size={24} />;
    if (normalized.includes("upstage/")) return <UpstageLogo size={24} />;

    if (raw.includes("microsoft") || raw.includes("deberta") || raw.includes("florence") || raw.includes("phi-") || raw.includes("trellis")) return <MicrosoftLogo size={24} />;
    if (raw.includes("llama") || raw.includes("meta")) return <MetaLogo size={24} />;
    if (raw.includes("mistral") || raw.includes("mixtral") || raw.includes("codestral")) return <MistralLogo size={24} />;
    if (raw.includes("qwen") || raw.includes("alibaba") || raw.includes("inforact")) return <QwenLogo size={24} />;
    if (raw.includes("deepseek")) return <DeepSeekLogo size={24} />;
    if (raw.includes("claude") || raw.includes("anthropic")) return <AnthropicLogo size={24} />;
    if (raw.includes("gpt") || raw.includes("openai") || raw.includes("whisper") || raw.includes("openrouter")) return <OpenAILogo size={24} />;
    if (raw.includes("gemini") || raw.includes("gemma") || raw.includes("google")) return <GoogleLogo size={24} />;
    if (raw.includes("nvidia") || raw.includes("nemotron") || raw.includes("megatron")) return <NvidiaLogo size={24} />;
    if (raw.includes("glm") || raw.includes("zhipu") || raw.includes("thudm") || raw.includes("chatglm")) return <GLMLogo size={24} />;
    if (raw.includes("bge") || raw.includes("baai")) return <BAAILogo size={24} />;
    if (raw.includes("kimi") || raw.includes("moonshot")) return <KimiLogo size={24} />;
    return <HuggingFaceLogo size={24} />;
  }

  const visibleModels = searchResults ?? models;
  const hostedModels = visibleModels.map((model) => ({
    id: model.id,
    name: model.name,
    status: model.status || "available",
    hfId: model.hfIdentity?.repositoryId ?? model.name,
    capabilitiesText: model.capabilities && model.capabilities.length > 0
      ? model.capabilities.slice(0, 3).join(" / ")
      : "Tool calling / JSON mode / Streaming",
    inputPrice: model.pricing ? `$${model.pricing.inputPricePer1M.toFixed(2)}` : "$0.13",
    outputPrice: model.pricing ? `$${model.pricing.outputPricePer1M.toFixed(2)}` : "$0.27",
    contextWindow: model.contextWindow > 0 ? model.contextWindow.toLocaleString() : "1,048,576",
    icon: iconFor(model),
  }));

  const filteredModels = hostedModels.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hfId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1040px] mx-auto pb-16 font-sans text-xs">
      {/* Title with RunInfra green background badge */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#F0EFE2]">
          <span>Model</span>
          <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block text-xl">
            APIs
          </span>
        </h1>
        <p className="mt-1.5 text-xs text-[#90988c]">
          Choose the hosted model that fits your request.
        </p>
      </div>

      {/* Toolbar row with search & usage analytics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-dashed border-[#282828] py-3">
        <div className="flex items-center gap-2 border border-[#282828] bg-[#161616] px-3 py-1.5 text-xs rounded-xs w-full sm:w-80">
          <Search size={14} className="text-[#666]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find by name or served ID"
            className="w-full bg-transparent text-xs outline-none font-mono text-[#F0EFE2] placeholder:text-[#666]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#788274]">
          <span>{filteredModels.length} models</span>
          <button
            type="button"
            className="flex items-center gap-1.5 border border-[#333] bg-[#202020] text-[#d1d5db] hover:border-[#555] hover:text-[#F0EFE2] px-2.5 py-1 text-xs transition-colors rounded-xs cursor-pointer font-mono"
          >
            <BarChart2 size={13} className="text-[#788274]" />
            <span>Usage Analytics</span>
          </button>
        </div>
      </div>

      {/* Exact RunInfra Model List Rows */}
      <div className="divide-y divide-dashed divide-[#282828]">
        {searching && (
          <div className="py-6 text-xs font-mono text-[#788274]">Searching Hugging Face…</div>
        )}
        {!searching && filteredModels.length === 0 && (
          <div className="py-12 text-center text-xs font-mono text-[#788274]">
            {searchQuery.trim().length >= 2 ? "No Hugging Face models found." : "No live models are available yet."}
          </div>
        )}
        {!searching && filteredModels.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectModel(m.id)}
            className="py-5 cursor-pointer group transition-colors"
          >
            {/* Top Row: Brand Logo + Model Name + HF Repo + Capabilities + Chevron */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {/* Brand Logo with fixed size */}
                <div className="shrink-0 pt-0.5 flex items-center justify-center w-6 h-6">
                  {m.icon}
                </div>

                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                    {m.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#788274]">
                    {m.hfId}
                  </div>
                  <div className="pt-1.5">
                    <div className="text-xs text-[#a0a89d]">
                      {m.capabilitiesText}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-[#788274] mt-0.5">
                      MODEL CAPABILITIES
                    </div>
                  </div>
                </div>
              </div>

              {/* Chevron Right */}
              <div className="pt-1 text-[#788274] group-hover:text-[#F0EFE2] transition-colors">
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Bottom Row: 4 Metric Columns matching exact RunInfra layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 ml-9 font-mono text-xs">
              {/* Input Price */}
              <div>
                <div className="flex items-center gap-1 text-[#F0EFE2] font-medium">
                  <ArrowDown size={11} className="text-[#788274]" />
                  <span className="text-[#75bf00] font-bold">{m.inputPrice}</span>
                  <span className="text-[10px] text-[#788274] uppercase font-normal">PER 1M INPUT TOKENS</span>
                </div>
                <div className="text-[9px] text-[#788274] uppercase tracking-wider mt-0.5">
                  INPUT / 1M
                </div>
              </div>

              {/* Output Price */}
              <div>
                <div className="flex items-center gap-1 text-[#F0EFE2] font-medium">
                  <ArrowUp size={11} className="text-[#788274]" />
                  <span className="text-[#75bf00] font-bold">{m.outputPrice}</span>
                  <span className="text-[10px] text-[#788274] uppercase font-normal">PER 1M OUTPUT TOKENS</span>
                </div>
                <div className="text-[9px] text-[#788274] uppercase tracking-wider mt-0.5">
                  OUTPUT / 1M
                </div>
              </div>

              {/* Context Window */}
              <div>
                <div className="flex items-center gap-1 text-[#F0EFE2] font-medium">
                  <span className="text-[#788274] font-bold">{`{ }`}</span>
                  <span>{m.contextWindow}</span>
                  <span className="text-[10px] text-[#788274] uppercase font-normal">TOKENS</span>
                </div>
                <div className="text-[9px] text-[#788274] uppercase tracking-wider mt-0.5">
                  CONTEXT
                </div>
              </div>

              {/* State */}
              <div>
                <div className={cn(
                  "flex items-center gap-1.5 font-medium text-xs",
                  m.status === "available" || m.status === "ready" ? "text-[#75bf00]" : "text-[#f59e0b]"
                )}>
                  {m.status === "available" || m.status === "ready" ? (
                    <CheckCircle2 size={12} className="text-[#75bf00]" />
                  ) : (
                    <Clock size={12} className="text-[#f59e0b]" />
                  )}
                  <span className="capitalize">{m.status === "available" || m.status === "ready" ? "Available" : "Unavailable"}</span>
                </div>
                <div className="text-[9px] text-[#788274] uppercase tracking-wider mt-0.5">
                  STATE
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

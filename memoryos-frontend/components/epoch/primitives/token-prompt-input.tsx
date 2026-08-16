"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ArrowRight,
  ArrowUp,
  Cpu,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Check,
  Cloud,
  Boxes,
  Gauge,
  FlaskConical,
  Paperclip,
  TrendingDown,
  Timer,
  Sparkles,
  HardDrive,
  Laptop,
  Box,
  CircleDashed,
  Lock,
  Download,
  Heart,
} from "lucide-react";
import {
  MetaLogo,
  QwenLogo,
  BAAILogo,
  FluxLogo,
  VLLMLogo,
  SGLangLogo,
  NvidiaLogo,
  HuggingFaceLogo,
  OpenAILogo,
  DiffusersLogo,
  GoogleLogo,
  DeepSeekLogo,
  MistralLogo,
  TEILogo,
  GLMLogo,
} from "./brand-icons";
import { cn } from "@/lib/utils";
import { resolveActiveEpochWorkspaceId, searchEpochHuggingFaceModels } from "@/lib/epoch-api";
import { ModelEntity } from "@/lib/epoch-types";

export interface HfModelItem {
  id: string;
  name: string;
  org: string;
  task: string;
  downloads: string;
  likes: string;
  iconType: "glm" | "meta" | "qwen" | "baai" | "flux" | "openai" | "kimi" | "nvidia" | "google" | "deepseek" | "mistral" | "hf";
}

export function ModelBrandIcon({ model, size = 13 }: { model?: HfModelItem | { iconType?: string; name?: string }; size?: number }) {
  if (!model) return <HuggingFaceLogo size={size} />;
  if (model.iconType === "glm") return <GLMLogo size={size} />;
  if (model.iconType === "meta") return <MetaLogo size={size} />;
  if (model.iconType === "qwen") return <QwenLogo size={size} />;
  if (model.iconType === "baai") return <BAAILogo size={size} />;
  if (model.iconType === "flux") return <FluxLogo size={size} />;
  if (model.iconType === "openai") return <OpenAILogo size={size} />;
  if (model.iconType === "google") return <GoogleLogo size={size} />;
  if (model.iconType === "deepseek") return <DeepSeekLogo size={size} />;
  if (model.iconType === "mistral") return <MistralLogo size={size} />;
  if (model.iconType === "nvidia") return <NvidiaLogo size={size} />;
  return <HuggingFaceLogo size={size} />;
}

export function EngineBrandIcon({ engine, size = 13 }: { engine: string; size?: number }) {
  if (engine === "vLLM" || engine === "vLLM-Omni" || engine === "vLLM Omni") return <VLLMLogo size={size} />;
  if (engine === "SGLang") return <SGLangLogo size={size} />;
  if (engine === "TEI") return <TEILogo size={size} />;
  if (engine === "Diffusers") return <DiffusersLogo size={size} />;
  if (engine === "TensorRT-LLM") return <NvidiaLogo size={size} />;
  return <Cpu size={size} />;
}

export const POPULAR_HF_MODELS: HfModelItem[] = [
  {
    id: "Qwen/Qwen3-0.6B",
    name: "Qwen3-0.6B",
    org: "Qwen, text generation",
    task: "text-generation",
    downloads: "29.2M",
    likes: "1.5K",
    iconType: "qwen",
  },
  {
    id: "facebook/opt-125m",
    name: "opt-125m",
    org: "facebook, text generation",
    task: "text-generation",
    downloads: "17.0M",
    likes: "292",
    iconType: "baai",
  },
  {
    id: "Qwen/Qwen3-8B",
    name: "Qwen3-8B",
    org: "Qwen, text generation",
    task: "text-generation",
    downloads: "16.0M",
    likes: "1.3K",
    iconType: "qwen",
  },
  {
    id: "trl-internal-testing/tiny-Qwen2ForCausalLM-2.5",
    name: "tiny-Qwen2ForCausalLM-2.5",
    org: "trl-internal-testing, text generation",
    task: "text-generation",
    downloads: "15.6M",
    likes: "20",
    iconType: "qwen",
  },
  {
    id: "openai-community/gpt2",
    name: "gpt2",
    org: "openai-community, text generation",
    task: "text-generation",
    downloads: "13.7M",
    likes: "3.4K",
    iconType: "openai",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    name: "Qwen2.5-7B-Instruct",
    org: "Qwen, text generation",
    task: "text-generation",
    downloads: "12.3M",
    likes: "1.5K",
    iconType: "qwen",
  },
  {
    id: "nvidia/Qwen3.6-35B-A3B-NVFP4",
    name: "Qwen3.6-35B-A3B-NVFP4",
    org: "nvidia, text generation",
    task: "text-generation",
    downloads: "12.2M",
    likes: "554",
    iconType: "nvidia",
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama 3.1 8B",
    org: "meta-llama, text generation",
    task: "text-generation",
    downloads: "32.4M",
    likes: "4.8K",
    iconType: "meta",
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B",
    org: "mistralai, text generation",
    task: "text-generation",
    downloads: "24.1M",
    likes: "3.7K",
    iconType: "mistral",
  },
];

export const SERVING_ENGINES = {
  core: [
    { id: "vLLM", name: "vLLM", desc: "llm, embedding, vision-language, +1", icon: <VLLMLogo size={14} /> },
    { id: "SGLang", name: "SGLang", desc: "llm, vision-language", icon: <SGLangLogo size={14} /> },
    { id: "TensorRT-LLM", name: "TensorRT-LLM", desc: "llm, vision-language", icon: <NvidiaLogo size={14} /> },
  ],
  experiments: [
    { id: "vLLM-Omni", name: "vLLM Omni", badge: "Experiment", desc: "asr, tts, audio-language, +2", icon: <VLLMLogo size={14} /> },
    { id: "Diffusers", name: "Diffusers", badge: "Experiment", desc: "image-gen, video-gen", icon: <DiffusersLogo size={14} /> },
    { id: "TEI", name: "TEI", badge: "Experiment", desc: "embedding, rerank, classification", icon: <TEILogo size={14} /> },
  ],
  expanding: [
    { id: "NVIDIA Dynamo", name: "NVIDIA Dynamo", desc: "Dynamo has no live RunInfra Cloud image or Modal stress-test worker in this workspace yet.", icon: <Cpu size={14} /> },
  ],
};

export const GPU_OPTIONS = [
  { id: "T4", name: "T4", vram: "16 GB", desc: "Budget, tiny models" },
  { id: "L4", name: "L4", vram: "24 GB", desc: "Budget, quantized 7B-14B" },
  { id: "A10G", name: "A10G", vram: "24 GB", desc: "Balanced, quantized 13B" },
  { id: "L40S", name: "L40S", vram: "48 GB", desc: "Great cost/performance" },
  { id: "A100-40GB", name: "A100-40GB", vram: "40 GB", desc: "Mid-tier, 70B quantized" },
  { id: "A100-80GB", name: "A100-80GB", vram: "80 GB", desc: "Large models, 70B quantized" },
  { id: "H100", name: "H100", vram: "80 GB", desc: "Maximum throughput, FP8" },
  { id: "H200", name: "H200", vram: "141 GB", desc: "70B FP16, large MoE" },
  { id: "B200", name: "B200", vram: "192 GB", desc: "Flagship, 70B+ FP16" },
];

export interface SuggestionItem {
  id: string;
  action: string;
  modelBadge: { icon: React.ReactNode; text: string; iconType: "baai" | "meta" | "qwen" | "openai" | "flux" | "mistral" };
  secondaryText?: string;
  secondaryModelBadge?: { icon: React.ReactNode; text: string; iconType: "meta" };
  engineBadge: { icon: React.ReactNode; text: string };
  rest: string;
  fullPrompt: string;
  modelId: string;
  engine: string;
}

export const SUGGESTIONS: SuggestionItem[] = [
  {
    id: "sug-1",
    action: "Optimize",
    modelBadge: { icon: <MetaLogo size={13} />, text: "Llama 3.1 8B", iconType: "meta" },
    engineBadge: { icon: <VLLMLogo size={13} />, text: "vLLM" },
    rest: "for cheapest GPU with latency and VRAM checks",
    fullPrompt: "Optimize Llama 3.1 8B on vLLM for cheapest GPU with latency and VRAM checks",
    modelId: "meta-llama/Llama-3.1-8B-Instruct",
    engine: "vLLM",
  },
  {
    id: "sug-2",
    action: "Optimize",
    modelBadge: { icon: <QwenLogo size={13} />, text: "Qwen 2.5 7B", iconType: "qwen" },
    engineBadge: { icon: <SGLangLogo size={13} />, text: "SGLang" },
    rest: "with prefix cache and batch tuning",
    fullPrompt: "Optimize Qwen 2.5 7B on SGLang with prefix cache and batch tuning",
    modelId: "Qwen/Qwen2.5-7B-Instruct",
    engine: "SGLang",
  },
  {
    id: "sug-3",
    action: "Optimize",
    modelBadge: { icon: <BAAILogo size={13} />, text: "BGE-M3", iconType: "baai" },
    secondaryText: "embeddings on",
    engineBadge: { icon: <VLLMLogo size={13} />, text: "vLLM" },
    rest: "with /v1/embeddings batch and a recall sweep",
    fullPrompt: "Optimize BGE-M3 embeddings on vLLM with /v1/embeddings batch and a recall sweep",
    modelId: "BAAI/bge-m3",
    engine: "vLLM",
  },
  {
    id: "sug-4",
    action: "Optimize",
    modelBadge: { icon: <OpenAILogo size={13} />, text: "Whisper Large V3", iconType: "openai" },
    secondaryModelBadge: { icon: <MetaLogo size={13} />, text: "Llama 3.2 3B", iconType: "meta" },
    engineBadge: { icon: <VLLMLogo size={13} />, text: "vLLM-Omni" },
    rest: "for RTF and streaming latency",
    fullPrompt: "Optimize Whisper Large V3 + Llama 3.2 3B on vLLM-Omni for RTF and streaming latency",
    modelId: "openai/whisper-large-v3",
    engine: "vLLM-Omni",
  },
  {
    id: "sug-5",
    action: "Optimize",
    modelBadge: { icon: <FluxLogo size={13} />, text: "FLUX.1 Schnell", iconType: "flux" },
    engineBadge: { icon: <DiffusersLogo size={13} />, text: "Diffusers" },
    rest: "with FP8, compile, and step tuning",
    fullPrompt: "Optimize FLUX.1 Schnell on Diffusers with FP8, compile, and step tuning",
    modelId: "black-forest-labs/FLUX.1-schnell",
    engine: "Diffusers",
  },
];

export type FlyoutTab = "models" | "engine" | "gpu" | "runs_on" | "output_format";

export interface TokenPromptInputProps {
  onSubmit?: (prompt: string, metadata?: Record<string, unknown>) => void;
  onLaunchPrompt?: (params: {
    prompt: string;
    model: string;
    engine: string;
    gpu: string;
    runsOn: string;
    outputFormat: string;
    mode: "Optimize" | "Experiment";
  }) => void;
  initialPrompt?: string;
  availableModels?: ModelEntity[];
  dark?: boolean;
  className?: string;
}

export function TokenPromptInput({
  onSubmit,
  onLaunchPrompt,
  initialPrompt = "",
  availableModels = [],
  dark = true,
  className,
}: TokenPromptInputProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [promptEdited, setPromptEdited] = useState(false);
  const [selectedModel, setSelectedModel] = useState<HfModelItem>(POPULAR_HF_MODELS[0]);
  const [selectedEngine, setSelectedEngine] = useState<string>("vLLM");
  const [selectedGpu, setSelectedGpu] = useState<string>("Auto (recommended)");
  const [selectedRunsOn, setSelectedRunsOn] = useState<string>("Managed cloud");
  const [selectedOutputFormat, setSelectedOutputFormat] = useState<string>("Managed endpoint");
  const [selectedMode, setSelectedMode] = useState<"Optimize" | "Experiment">("Optimize");

  // Autocomplete / Flyout states
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [activeFlyoutTab, setActiveFlyoutTab] = useState<FlyoutTab>("models");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [hfSearchQuery, setHfSearchQuery] = useState("");
  const [hfModels, setHfModels] = useState<HfModelItem[]>([]);
  const [hfSearchLoading, setHfSearchLoading] = useState(false);
  const [hfSearchError, setHfSearchError] = useState<string | null>(null);
  const [animatedSuggestionIndex, setAnimatedSuggestionIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cycle suggestions when idle
  useEffect(() => {
    if (promptEdited) return;
    const cycleTimer = window.setInterval(() => {
      setAnimatedSuggestionIndex((current) => (current + 1) % SUGGESTIONS.length);
    }, 4000);
    return () => window.clearInterval(cycleTimer);
  }, [animatedSuggestionIndex, promptEdited]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFlyoutOpen(false);
        setModeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // HF Search debounced
  useEffect(() => {
    const query = hfSearchQuery.trim();
    let cancelled = false;
    if (!query) {
      setHfModels([]);
      setHfSearchLoading(false);
      setHfSearchError(null);
      return;
    }
    setHfSearchLoading(true);
    setHfSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const wsId = await resolveActiveEpochWorkspaceId();
        if (!wsId) return;
        const results = await searchEpochHuggingFaceModels(wsId, query);
        if (cancelled) return;
        setHfModels(
          results.map((r) => ({
            id: r.repositoryId,
            name: r.repositoryId.split("/").pop() ?? r.repositoryId,
            org: r.author ?? r.repositoryId.split("/")[0] ?? "Hugging Face",
            task: r.task ?? r.library ?? "model",
            downloads: r.downloads >= 1_000_000 ? `${(r.downloads / 1_000_000).toFixed(1)}M` : String(r.downloads),
            likes: String(r.likes),
            iconType: "hf",
          }))
        );
      } catch {
        if (!cancelled) {
          setHfModels([]);
          setHfSearchError("Hugging Face search is unavailable right now.");
        }
      } finally {
        if (!cancelled) setHfSearchLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hfSearchQuery]);

  const handleSubmit = () => {
    const finalPrompt = prompt.trim() || SUGGESTIONS[animatedSuggestionIndex].fullPrompt;
    if (onLaunchPrompt) {
      onLaunchPrompt({
        prompt: finalPrompt,
        model: selectedModel.id,
        engine: selectedEngine,
        gpu: selectedGpu,
        runsOn: selectedRunsOn,
        outputFormat: selectedOutputFormat,
        mode: selectedMode,
      });
    } else if (onSubmit) {
      onSubmit(finalPrompt, {
        model: selectedModel.id,
        engine: selectedEngine,
        gpu: selectedGpu,
        runsOn: selectedRunsOn,
        outputFormat: selectedOutputFormat,
        mode: selectedMode,
      });
    }
  };

  const handleOpenFlyout = (tab: FlyoutTab) => {
    if (flyoutOpen && activeFlyoutTab === tab) {
      setFlyoutOpen(false);
    } else {
      setActiveFlyoutTab(tab);
      setFlyoutOpen(true);
      setModeDropdownOpen(false);
    }
  };

  const handleSelectSuggestion = (sug: SuggestionItem) => {
    setPromptEdited(true);
    setPrompt(sug.fullPrompt);
    setSelectedEngine(sug.engine);
    const matched = POPULAR_HF_MODELS.find((m) => m.id === sug.modelId) || {
      id: sug.modelId,
      name: sug.modelBadge.text,
      org: sug.modelId.split("/")[0] || "model",
      task: "inference",
      downloads: "10M+",
      likes: "1K+",
      iconType: sug.modelBadge.iconType,
    };
    setSelectedModel(matched);
  };

  const animatedSuggestion = SUGGESTIONS[animatedSuggestionIndex];

  return (
    <div ref={containerRef} className={cn("w-full space-y-4", className)}>
      {/* Title & Subtitle Matching Image 2 */}
      <div className="text-left">
        <h1 className={cn(
          "text-2xl font-medium tracking-[-0.03em] sm:text-3xl",
          dark ? "text-white" : "text-[#171a17]"
        )}>
          Describe your{" "}
          <span className="bg-[#75bf00] px-2 py-0.5 font-medium text-black inline-block rounded-xs">
            inference pipeline
          </span>
        </h1>
        <p className={cn("mt-2 text-xs md:text-sm", dark ? "text-[#90988c]" : "text-[#555d50]")}>
          Models, routing, optimization, and hosting. From chat to production API in minutes.
        </p>
      </div>

      {/* Main Interactive Prompt Card (Matching Image 2 & 3) */}
      <div className="relative max-w-[840px]">
        <div className={cn(
          "relative border p-4 transition-all rounded-xs",
          dark
            ? "border-[#282828] bg-[#141414] shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
            : "border-[#d8ddd3] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        )}>
          {/* Prompt Input Area / Placeholder */}
          <div className="relative min-h-[52px]">
            {!promptEdited && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setPromptEdited(true);
                  setPrompt(SUGGESTIONS[animatedSuggestionIndex].fullPrompt);
                  textareaRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setPromptEdited(true);
                    setPrompt(SUGGESTIONS[animatedSuggestionIndex].fullPrompt);
                    textareaRef.current?.focus();
                  }
                }}
                className={cn(
                  "absolute inset-0 z-10 flex min-h-[52px] cursor-text items-center gap-2 overflow-hidden whitespace-nowrap text-xs md:text-sm transition-opacity",
                  dark ? "text-[#888]" : "text-[#777]"
                )}
              >
                <span>What do you want to optimize? Use @ to pick models...</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => {
                setPromptEdited(true);
                setPrompt(e.target.value);
              }}
              onFocus={() => {
                if (!promptEdited) {
                  setPromptEdited(true);
                }
              }}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What do you want to optimize? Use @ to pick models..."
              className={cn(
                "min-h-[52px] w-full resize-none bg-transparent p-0 text-xs md:text-sm font-normal outline-none",
                !promptEdited && "pointer-events-none opacity-0",
                dark ? "text-white placeholder:text-[#666]" : "text-[#171a17] placeholder:text-[#90988c]"
              )}
            />
          </div>

          {/* Bottom Tool Rail (Matching Image 2 & 3 exact 4-group structure) */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#222222] pt-3 overflow-x-auto no-scrollbar">
            {/* Left Controls (3 pills) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1. Models Pill */}
              <button
                type="button"
                onClick={() => handleOpenFlyout("models")}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs font-sans shrink-0 whitespace-nowrap",
                  activeFlyoutTab === "models" && flyoutOpen
                    ? "border-[#75bf00] bg-[#222222] text-white"
                    : dark
                    ? "border-[#383838] bg-[#1a1a1a] text-[#d1d5db] hover:border-[#555]"
                    : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#171a17]"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                <span>Models</span>
                {activeFlyoutTab === "models" && flyoutOpen ? (
                  <ChevronUp size={11} className="text-[#788274]" />
                ) : (
                  <ChevronDown size={11} className="text-[#788274]" />
                )}
              </button>

              {/* 2. Output Format Pill */}
              <button
                type="button"
                onClick={() => handleOpenFlyout("output_format")}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs font-sans shrink-0 whitespace-nowrap",
                  activeFlyoutTab === "output_format" && flyoutOpen
                    ? "border-[#75bf00] bg-[#222222] text-white"
                    : dark
                    ? "border-[#383838] bg-[#1a1a1a] text-[#d1d5db] hover:border-[#555]"
                    : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#171a17]"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                <span>Output format</span>
                {activeFlyoutTab === "output_format" && flyoutOpen ? (
                  <ChevronUp size={11} className="text-[#788274]" />
                ) : (
                  <ChevronDown size={11} className="text-[#788274]" />
                )}
              </button>

              {/* 3. Combined Engine / GPU Auto Pill */}
              <button
                type="button"
                onClick={() => handleOpenFlyout("engine")}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs font-sans shrink-0 whitespace-nowrap",
                  (activeFlyoutTab === "engine" || activeFlyoutTab === "gpu") && flyoutOpen
                    ? "border-[#75bf00] bg-[#222222] text-white"
                    : dark
                    ? "border-[#383838] bg-[#1a1a1a] text-[#888] hover:border-[#555] hover:text-white"
                    : "border-[#d8ddd3] bg-white text-[#666] hover:border-[#171a17]"
                )}
              >
                <VLLMLogo size={12} />
                <NvidiaLogo size={12} className="text-[#76b900]" />
                <Cpu size={12} className="text-[#788274]" />
                <span className="font-mono text-xs text-[#888]">Auto</span>
              </button>
            </div>

            {/* Right Controls: Mode Switcher + Launch */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setModeDropdownOpen(!modeDropdownOpen);
                    setFlyoutOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs font-mono shrink-0 whitespace-nowrap",
                    dark
                      ? "border-[#383838] bg-[#1a1a1a] text-[#d1d5db] hover:border-[#555]"
                      : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#171a17]"
                  )}
                >
                  {selectedMode === "Experiment" ? (
                    <FlaskConical size={12} className="text-[#75bf00]" />
                  ) : (
                    <Gauge size={12} className="text-[#75bf00]" />
                  )}
                  <span>{selectedMode}</span>
                  {modeDropdownOpen ? (
                    <ChevronUp size={11} className="text-[#788274]" />
                  ) : (
                    <ChevronDown size={11} className="text-[#788274]" />
                  )}
                </button>

                {/* Mode Dropdown Popover */}
                {modeDropdownOpen && (
                  <div className={cn(
                    "absolute right-0 top-full mt-1.5 w-80 border shadow-2xl p-1.5 space-y-1 text-xs z-50 rounded-xs animate-in fade-in zoom-in-95 duration-100",
                    dark
                      ? "border-[#333] bg-[#181818] text-white"
                      : "border-[#c9cec4] bg-white text-[#171a17]"
                  )}>
                    <div
                      onClick={() => {
                        setSelectedMode("Optimize");
                        setModeDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-left",
                        selectedMode === "Optimize"
                          ? dark ? "bg-[#282828]" : "bg-[#f0f4ee]"
                          : dark ? "hover:bg-[#222222]" : "hover:bg-[#f8faf7]"
                      )}
                    >
                      <Gauge size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-white">Optimize</span>
                          {selectedMode === "Optimize" && <Check size={14} className="text-[#75bf00]" />}
                        </div>
                        <p className="text-[11px] text-[#888] mt-0.5 leading-relaxed">
                          Full run: measure candidates and apply the winner.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setSelectedMode("Experiment");
                        setModeDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-left",
                        selectedMode === "Experiment"
                          ? dark ? "bg-[#282828]" : "bg-[#f0f4ee]"
                          : dark ? "hover:bg-[#222222]" : "hover:bg-[#f8faf7]"
                      )}
                    >
                      <FlaskConical size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-white">Experiment</span>
                          {selectedMode === "Experiment" && <Check size={14} className="text-[#75bf00]" />}
                        </div>
                        <p className="text-[11px] text-[#888] mt-0.5 leading-relaxed">
                          Exploratory run: measure candidates side by side. No winner is applied.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Action Button */}
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  "flex h-7 w-7 items-center justify-center transition-all rounded-xs border shrink-0",
                  dark
                    ? "border-[#444] bg-[#222222] text-[#888] hover:text-white hover:bg-[#333] active:scale-95 shadow-sm cursor-pointer"
                    : "border-[#171a17] bg-[#171a17] text-white hover:bg-[#2a2a2a] active:scale-95 shadow-sm cursor-pointer"
                )}
                title="Launch Mission"
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Split Flyout Drawer (Anchored Popover matching Image 3) */}
        {flyoutOpen && (
          <div className={cn(
            "absolute left-0 right-0 top-full mt-2 z-50 border border-dashed shadow-2xl rounded-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col md:flex-row min-h-[380px]",
            dark ? "border-[#383838] bg-[#111111] text-white" : "border-[#c9cec4] bg-white text-[#171a17]"
          )}>
            {/* Left Rail: 5 Tabs */}
            <div className={cn(
              "w-full md:w-56 border-b md:border-b-0 md:border-r border-[#222222] p-2 space-y-1 shrink-0 font-sans text-xs",
              dark ? "bg-[#141414]" : "bg-[#fafbfa]"
            )}>
              {[
                { id: "models", label: "Models", icon: <HuggingFaceLogo size={14} /> },
                { id: "engine", label: "Serving engine", icon: <VLLMLogo size={14} /> },
                { id: "gpu", label: "GPU", icon: <NvidiaLogo size={14} /> },
                { id: "runs_on", label: "Runs on", icon: <Cloud size={14} /> },
                { id: "output_format", label: "Output format", icon: <Boxes size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFlyoutTab(tab.id as FlyoutTab)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 rounded-xs text-left transition-colors font-medium text-xs",
                    activeFlyoutTab === tab.id
                      ? dark
                        ? "bg-[#252525] text-white font-semibold shadow-xs"
                        : "bg-[#e8eee4] text-[#171a17] font-semibold"
                      : dark
                      ? "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                      : "text-[#666] hover:bg-[#f2f4f0] hover:text-[#171a17]"
                  )}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Right Pane */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[420px]">
              {/* TAB 1: Models */}
              {activeFlyoutTab === "models" && (
                <div className="space-y-3">
                  <div className="relative border border-[#2a2a2a] rounded-xs bg-[#161616] flex items-center px-2.5 py-1.5">
                    <HuggingFaceLogo size={14} className="shrink-0 text-[#888] mr-2" />
                    <input
                      type="text"
                      value={hfSearchQuery}
                      onChange={(e) => setHfSearchQuery(e.target.value)}
                      placeholder="Search Hugging Face models or paste a repo id..."
                      className="w-full bg-transparent text-xs text-white placeholder:text-[#666] outline-none font-sans"
                    />
                  </div>

                  {hfSearchLoading && (
                    <div className="flex items-center gap-2 px-2 py-2 text-[11px] text-[#788274]">
                      <LoaderCircle size={12} className="animate-spin" /> Searching Hugging Face…
                    </div>
                  )}
                  {hfSearchError && !hfSearchLoading && (
                    <div className="px-2 py-2 text-[11px] text-[#a58b72]">{hfSearchError}</div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#888] px-1 pt-1">
                    <HuggingFaceLogo size={13} />
                    <span>Popular on Hugging Face 20</span>
                  </div>

                  <div className="space-y-1">
                    {(hfModels.length > 0 ? hfModels : POPULAR_HF_MODELS).map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xs cursor-pointer transition-colors text-xs",
                          dark ? "hover:bg-[#1c1c1c] text-[#d1d5db]" : "hover:bg-[#f2f4f0] text-[#333]"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5"><ModelBrandIcon model={m} size={15} /></span>
                          <div>
                            <div className="font-semibold text-white text-xs">{m.name}</div>
                            <div className="text-[11px] text-[#788274] mt-0.5">{m.org}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#2a2a2a] bg-[#1a1a1a] text-[10px] font-mono text-[#888] rounded-xs">
                            <Download size={10} />
                            <span>{m.downloads}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#2a2a2a] bg-[#1a1a1a] text-[10px] font-mono text-[#888] rounded-xs">
                            <Heart size={10} />
                            <span>{m.likes}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Serving engine */}
              {activeFlyoutTab === "engine" && (
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      setSelectedEngine("vLLM");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "p-3 border rounded-xs cursor-pointer transition-colors text-xs",
                      dark ? "border-[#2a2a2a] bg-[#1e221b] text-white" : "border-[#d8ddd3] bg-[#f0f9eb] text-[#111]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[#75bf00]" />
                        <span className="font-semibold text-white text-xs">Auto (recommended)</span>
                      </div>
                      <Check size={14} className="text-[#75bf00]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-1 pl-5">
                      Agent picks from the supported runtime matrix
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#888] px-1">
                      <div className="flex items-center gap-1.5">
                        <VLLMLogo size={11} />
                        <span>Core LLM</span>
                      </div>
                      <span className="text-[10px] text-[#666]">current</span>
                    </div>

                    {SERVING_ENGINES.core.map((engine) => (
                      <div
                        key={engine.id}
                        onClick={() => {
                          setSelectedEngine(engine.id);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-xs",
                          selectedEngine === engine.id
                            ? dark ? "bg-[#222222] border border-[#383838]" : "bg-[#f0f4ee]"
                            : dark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#fafbfa]"
                        )}
                      >
                        <span className="mt-0.5">{engine.icon}</span>
                        <div>
                          <div className="font-semibold text-white text-xs">{engine.name}</div>
                          <div className="text-[11px] text-[#788274] mt-0.5">{engine.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#888] px-1">
                      <FlaskConical size={12} />
                      <span>Experiments</span>
                    </div>

                    {SERVING_ENGINES.experiments.map((engine) => (
                      <div
                        key={engine.id}
                        onClick={() => {
                          setSelectedEngine(engine.id);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-xs",
                          selectedEngine === engine.id
                            ? dark ? "bg-[#222222] border border-[#383838]" : "bg-[#f0f4ee]"
                            : dark ? "hover:bg-[#1a1a1a]" : "hover:bg-[#fafbfa]"
                        )}
                      >
                        <span className="mt-0.5">{engine.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs">{engine.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 border border-[#8a6800] bg-[#3a2800] text-[#e6b800] rounded-xs">
                              {engine.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">{engine.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#888] px-1">
                      <Lock size={12} />
                      <span>Expanding</span>
                    </div>

                    {SERVING_ENGINES.expanding.map((engine) => (
                      <div
                        key={engine.id}
                        className="flex items-start gap-3 p-2.5 rounded-xs text-xs opacity-60 bg-[#161616]"
                      >
                        <span className="mt-0.5">{engine.icon}</span>
                        <div>
                          <div className="font-semibold text-white text-xs">{engine.name}</div>
                          <div className="text-[11px] text-[#788274] mt-0.5">{engine.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: GPU */}
              {activeFlyoutTab === "gpu" && (
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      setSelectedGpu("Auto (recommended)");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "p-3 border rounded-xs cursor-pointer transition-colors text-xs",
                      dark ? "border-[#2a2a2a] bg-[#1e221b] text-white" : "border-[#d8ddd3] bg-[#f0f9eb] text-[#111]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-[#75bf00]" />
                        <span className="font-semibold text-white text-xs">Auto (recommended)</span>
                      </div>
                      <Check size={14} className="text-[#75bf00]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-1 pl-5">
                      Will likely pick T4 (cheapest viable option).
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#888] px-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <NvidiaLogo size={12} className="text-[#76b900]" />
                      <span>GPU options</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 border border-[#2e5e1a] bg-[#1e3e0e] text-[#75bf00] rounded-xs font-semibold">
                      $50+
                    </span>
                  </div>

                  <div className="space-y-1">
                    {GPU_OPTIONS.map((gpu) => (
                      <div
                        key={gpu.id}
                        className="flex items-center justify-between p-2.5 rounded-xs text-xs hover:bg-[#181818] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Lock size={13} className="text-[#666]" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white text-xs">{gpu.name}</span>
                              <span className="text-[10px] font-mono text-[#666]">{gpu.vram}</span>
                            </div>
                            <div className="text-[11px] text-[#788274] mt-0.5">{gpu.desc}</div>
                          </div>
                        </div>
                        <Lock size={13} className="text-[#666]" />
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#788274] leading-relaxed px-1 pt-2 border-t border-[#222]">
                    Manual GPU selection unlocks at $50 lifetime credits. Auto GPU still chooses the lowest viable hardware for the current model.
                  </div>
                </div>
              )}

              {/* TAB 4: Runs on (Matching User Screenshot) */}
              {activeFlyoutTab === "runs_on" && (
                <div className="space-y-3">
                  {/* Top Auto (recommended) */}
                  <div
                    onClick={() => {
                      setSelectedRunsOn("Auto (recommended)");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "p-3 border rounded-xs cursor-pointer transition-colors text-xs",
                      dark ? "border-[#2a2a2a] bg-[#1e221b] text-white" : "border-[#d8ddd3] bg-[#f0f9eb] text-[#111]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[#75bf00]" />
                        <span className="font-semibold text-white text-xs">Auto (recommended)</span>
                      </div>
                      <Check size={14} className="text-[#75bf00]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-1 pl-5">
                      Agent infers placement from your use case.
                    </div>
                  </div>

                  {/* Section Header */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#888] px-1 pt-1">
                    <Cloud size={13} />
                    <span>Runs on</span>
                  </div>

                  {/* 4 Runs On Options */}
                  <div className="space-y-1">
                    {[
                      {
                        name: "Local machine",
                        desc: "Your own desktop or workstation GPU.",
                        icon: <Laptop size={14} className="text-[#888]" />,
                      },
                      {
                        name: "Own server",
                        desc: "A single server you operate.",
                        icon: <HardDrive size={14} className="text-[#888]" />,
                      },
                      {
                        name: "Managed cloud",
                        desc: "Provisioned and metered in RunInfra's cloud.",
                        icon: <Cloud size={14} className="text-[#888]" />,
                      },
                      {
                        name: "Personal",
                        desc: "Side projects and light traffic, smallest viable footprint.",
                        icon: <Box size={14} className="text-[#888]" />,
                      },
                    ].map((target) => (
                      <div
                        key={target.name}
                        onClick={() => {
                          setSelectedRunsOn(target.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-xs border border-transparent",
                          selectedRunsOn === target.name
                            ? dark ? "bg-[#222222] border-[#383838] text-white" : "bg-[#f0f4ee] text-[#111]"
                            : dark ? "hover:bg-[#1a1a1a] text-[#aaa]" : "hover:bg-[#fafbfa] text-[#555]"
                        )}
                      >
                        <span className="mt-0.5 shrink-0">{target.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-xs">{target.name}</span>
                            {selectedRunsOn === target.name && <Check size={14} className="text-[#75bf00]" />}
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">{target.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Output format */}
              {activeFlyoutTab === "output_format" && (
                <div className="space-y-3">
                  <div className="p-3 border border-[#2e2e2e] rounded-xs text-xs opacity-75 bg-[#181818]">
                    <div className="flex items-start gap-2.5">
                      <CircleDashed size={14} className="text-[#666] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs text-[#aaa]">Auto format</div>
                        <div className="text-[11px] text-[#788274] mt-0.5">
                          Not available for a new run: the plan optimizes toward a declared format from the first step, so pick one below.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#788274]">
                    OUTPUT FORMAT
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { name: "Managed endpoint", desc: "A live endpoint in RunInfra's cloud, provisioned and metered.", icon: <Cloud size={14} /> },
                      { name: "Self-host kit", desc: "Docker image and Compose file with serve and verify scripts.", icon: <Box size={14} /> },
                      { name: "Local (Ollama / GGUF)", desc: "GGUF weights for llama.cpp and Ollama on your own machine.", icon: <Laptop size={14} /> },
                      { name: "Kubernetes", desc: "Deployment manifests for a cluster you operate.", icon: <Boxes size={14} /> },
                      { name: "Direct weights", desc: "Direct weights export is coming soon.", icon: <HardDrive size={14} />, badge: "Coming soon" },
                    ].map((fmt) => (
                      <div
                        key={fmt.name}
                        onClick={() => {
                          setSelectedOutputFormat(fmt.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "p-3 border rounded-xs cursor-pointer transition-colors text-xs",
                          selectedOutputFormat === fmt.name
                            ? dark ? "border-[#4a4a4a] bg-[#222222] text-white" : "border-[#999] bg-[#f0f4ee] text-[#111]"
                            : dark ? "border-[#262626] hover:bg-[#1a1a1a] text-[#aaa]" : "border-[#e0e4dd] hover:bg-[#fafbfa] text-[#555]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[#888]">{fmt.icon}</span>
                            <span className="font-semibold text-white text-xs">{fmt.name}</span>
                            {fmt.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs border border-[#383838] bg-[#222] text-[#888]">
                                {fmt.badge}
                              </span>
                            )}
                          </div>
                          {selectedOutputFormat === fmt.name && <Check size={14} className="text-[#75bf00]" />}
                        </div>
                        <div className="text-[11px] text-[#788274] mt-1 pl-5">{fmt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Section Matching Image 2 */}
      <div className="space-y-2 max-w-[840px] pt-1">
        <div className="text-[11px] font-mono text-[#788274]">
          Suggestions
        </div>

        <div className={cn(
          "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
          dark ? "border-[#2e2e2e] bg-[#191919] divide-[#262626]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
        )}>
          {SUGGESTIONS.map((sug) => (
            <div
              key={sug.id}
              onClick={() => handleSelectSuggestion(sug)}
              className={cn(
                "group flex flex-wrap items-center gap-2 p-3 text-xs cursor-pointer transition-colors font-sans",
                dark ? "hover:bg-[#222222] text-[#d1d5db]" : "hover:bg-[#fafbfa] text-[#374151]"
              )}
            >
              <ArrowRight size={13} className="text-[#788274] group-hover:text-[#75bf00] group-hover:translate-x-0.5 transition-all shrink-0" />
              <span className="text-[#aaa]">{sug.action}</span>

              {/* Model Pill */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-xs font-medium text-xs",
                dark ? "border-[#383838] bg-[#242424] text-white" : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]"
              )}>
                {sug.modelBadge.icon}
                <span>{sug.modelBadge.text}</span>
              </span>

              {sug.secondaryModelBadge && (
                <>
                  <span className="text-[#888] font-normal">+</span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-xs font-medium text-xs",
                    dark ? "border-[#383838] bg-[#242424] text-white" : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]"
                  )}>
                    {sug.secondaryModelBadge.icon}
                    <span>{sug.secondaryModelBadge.text}</span>
                  </span>
                </>
              )}

              <span className="text-[#888] font-normal">{sug.secondaryText || "on"}</span>

              {/* Engine Pill */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-xs font-medium text-xs",
                dark ? "border-[#383838] bg-[#242424] text-white" : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]"
              )}>
                {sug.engineBadge.icon}
                <span>{sug.engineBadge.text}</span>
              </span>

              <span className="truncate text-[#889084] group-hover:text-white transition-colors">{sug.rest}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

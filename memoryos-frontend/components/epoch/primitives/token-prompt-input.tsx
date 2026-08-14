"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Sparkles,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Layers,
  Cpu,
  Zap,
  Check,
  Plus,
  Cloud,
  HardDrive,
  Activity,
  Sliders,
  ExternalLink,
  Download,
  Heart,
  Gauge,
  FlaskConical,
  Radio,
  FileCode,
  Box,
  Server,
  Settings,
  ArrowRight,
  Lock,
  Laptop,
  Home,
  Boxes,
  CircleDashed,
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
  SimpleBrandLogo,
} from "./brand-icons";
import { siAlibabacloud, siAmd, siAnthropic, siApple, siDeepseek, siFacebook, siFlux, siHuggingface, siIntel, siKimi, siMeta, siMistralai, siNvidia, siQwen } from "simple-icons";
import { cn } from "@/lib/utils";
import { resolveActiveEpochWorkspaceId, searchEpochHuggingFaceModels } from "@/lib/epoch-api";

interface TokenPromptInputProps {
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
  dark?: boolean;
  className?: string;
}

interface HfModelItem {
  id: string;
  name: string;
  org: string;
  task: string;
  downloads: string;
  likes: string;
  iconType: "meta" | "qwen" | "baai" | "flux" | "openai" | "kimi" | "nvidia" | "google" | "hf" | "simple" | "author";
  brandIcon?: typeof siQwen;
}

function modelBrand(author: string | null, repositoryId: string): Pick<HfModelItem, "iconType" | "brandIcon"> {
  // Brand identity comes from the HF author/org, never from a model name.
  // A user can publish a model named "claude" or "qwen" and must not inherit
  // the upstream company's branding.
  const value = (author ?? "").toLowerCase();
  if (value.includes("moonshot") || value === "kimi") return { iconType: "simple", brandIcon: siKimi };
  if (value.includes("nvidia")) return { iconType: "simple", brandIcon: siNvidia };
  if (value.includes("google") || value === "gemma") return { iconType: "google" };
  if (value.includes("qwen")) return { iconType: "simple", brandIcon: siQwen };
  if (value.includes("meta-llama") || value.includes("meta")) return { iconType: "simple", brandIcon: siMeta };
  if (value.includes("flux") || value.includes("black-forest-labs")) return { iconType: "simple", brandIcon: siFlux };
  if (value.includes("openai")) return { iconType: "openai" };
  if (value.includes("deepseek")) return { iconType: "simple", brandIcon: siDeepseek };
  if (value.includes("mistral")) return { iconType: "simple", brandIcon: siMistralai };
  if (value.includes("anthropic") || value.includes("claude")) return { iconType: "simple", brandIcon: siAnthropic };
  if (value.includes("facebook")) return { iconType: "simple", brandIcon: siFacebook };
  if (value.includes("apple")) return { iconType: "simple", brandIcon: siApple };
  if (value.includes("amd")) return { iconType: "simple", brandIcon: siAmd };
  if (value.includes("intel")) return { iconType: "simple", brandIcon: siIntel };
  if (value.includes("alibaba")) return { iconType: "simple", brandIcon: siAlibabacloud };
  // HF has many individual authors and organizations without a verified public
  // brand asset. Do not guess or hotlink arbitrary avatars; use HF branding.
  return { iconType: "hf", brandIcon: siHuggingface };
}

const POPULAR_HF_MODELS: HfModelItem[] = [
  {
    id: "Qwen/Qwen3-0.6B",
    name: "Qwen3-0.6B",
    org: "Qwen",
    task: "text generation",
    downloads: "27.7M",
    likes: "1.5K",
    iconType: "qwen",
  },
  {
    id: "facebook/opt-125m",
    name: "opt-125m",
    org: "facebook",
    task: "text generation",
    downloads: "17.2M",
    likes: "289",
    iconType: "hf",
  },
  {
    id: "Qwen/Qwen3-8B",
    name: "Qwen3-8B",
    org: "Qwen",
    task: "text generation",
    downloads: "15.2M",
    likes: "1.3K",
    iconType: "qwen",
  },
  {
    id: "trl-internal-testing/tiny-Qwen2ForCausalLM-2.5",
    name: "tiny-Qwen2ForCausalLM-2.5",
    org: "trl-internal-testing",
    task: "text generation",
    downloads: "14.1M",
    likes: "19",
    iconType: "qwen",
  },
  {
    id: "openai-community/gpt2",
    name: "gpt2",
    org: "openai-community",
    task: "text generation",
    downloads: "12.8M",
    likes: "3.4K",
    iconType: "openai",
  },
  {
    id: "Qwen/Qwen2.5-1.5B-Instruct",
    name: "Qwen2.5-1.5B-Instruct",
    org: "Qwen",
    task: "text generation",
    downloads: "12.4M",
    likes: "792",
    iconType: "qwen",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    name: "Qwen2.5-7B-Instruct",
    org: "Qwen",
    task: "text generation",
    downloads: "11.3M",
    likes: "1.5K",
    iconType: "qwen",
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama-3.1-8B-Instruct",
    org: "meta-llama",
    task: "text generation",
    downloads: "32.4M",
    likes: "4.8K",
    iconType: "meta",
  },
  {
    id: "BAAI/bge-m3",
    name: "bge-m3",
    org: "BAAI",
    task: "feature extraction",
    downloads: "18.9M",
    likes: "2.1K",
    iconType: "baai",
  },
  {
    id: "black-forest-labs/FLUX.1-schnell",
    name: "FLUX.1-schnell",
    org: "black-forest-labs",
    task: "text-to-image",
    downloads: "8.4M",
    likes: "3.2K",
    iconType: "flux",
  },
];

const SUGGESTIONS = [
  {
    id: "sug-1",
    action: "Optimize",
    modelBadge: { icon: <MetaLogo size={13} />, text: "Llama 3.1 8B" },
    engineBadge: { icon: <VLLMLogo size={13} />, text: "vLLM" },
    rest: "for cheapest GPU with latency and VRAM checks",
    fullPrompt: "Optimize meta-llama/Llama-3.1-8B-Instruct on vLLM for cheapest GPU with latency and VRAM checks",
    modelId: "meta-llama/Llama-3.1-8B-Instruct",
    engine: "vLLM",
  },
  {
    id: "sug-2",
    action: "Optimize",
    modelBadge: { icon: <QwenLogo size={13} />, text: "Qwen 2.5 7B" },
    engineBadge: { icon: <SGLangLogo size={13} />, text: "SGLang" },
    rest: "with prefix cache and batch tuning",
    fullPrompt: "Optimize Qwen/Qwen2.5-7B-Instruct on SGLang with prefix cache and batch tuning",
    modelId: "Qwen/Qwen2.5-7B-Instruct",
    engine: "SGLang",
  },
  {
    id: "sug-3",
    action: "Optimize",
    modelBadge: { icon: <BAAILogo size={13} />, text: "BGE-M3" },
    engineBadge: { icon: <VLLMLogo size={13} />, text: "vLLM" },
    rest: "embeddings on vLLM with /v1/embeddings batch and a recall sweep",
    fullPrompt: "Optimize BAAI/bge-m3 embeddings on vLLM with /v1/embeddings batch and a recall sweep",
    modelId: "BAAI/bge-m3",
    engine: "vLLM",
  },
  {
    id: "sug-4",
    action: "Optimize",
    modelBadge: { icon: <OpenAILogo size={13} />, text: "Whisper Large V3" },
    secondaryModelBadge: { icon: <MetaLogo size={13} />, text: "Llama 3.2 3B" },
    engineBadge: { icon: <VLLMLogo size={13} />, text: "vLLM-Omni" },
    rest: "for RTF and streaming latency",
    fullPrompt: "Optimize Whisper Large V3 + meta-llama/Llama-3.2-3B on vLLM-Omni for RTF and streaming latency",
    modelId: "openai/whisper-large-v3",
    engine: "vLLM Omni",
  },
  {
    id: "sug-5",
    action: "Optimize",
    modelBadge: { icon: <FluxLogo size={13} />, text: "FLUX.1 Schnell" },
    engineBadge: { icon: <DiffusersLogo size={13} />, text: "Diffusers" },
    rest: "with FP8, compile, and step tuning",
    fullPrompt: "Optimize black-forest-labs/FLUX.1-schnell on Diffusers with FP8, compile, and step tuning",
    modelId: "black-forest-labs/FLUX.1-schnell",
    engine: "Diffusers",
  },
  {
    id: "sug-6",
    action: "Run",
    modelBadge: { icon: <QwenLogo size={13} />, text: "Qwen 3 0.6B" },
    engineBadge: { icon: <CircleDashed size={13} />, text: "Ollama" },
    rest: "locally on the smallest viable GPU for fast prototyping",
    fullPrompt: "Run Qwen/Qwen3-0.6B on Ollama locally for fast prototyping",
    modelId: "Qwen/Qwen3-0.6B",
    engine: "Ollama",
  },
  {
    id: "sug-7",
    action: "Optimize",
    modelBadge: { icon: <BAAILogo size={13} />, text: "BGE-M3" },
    engineBadge: { icon: <HuggingFaceLogo size={13} />, text: "TEI" },
    rest: "embeddings and reranking for high-recall search",
    fullPrompt: "Optimize BAAI/bge-m3 on TEI for embeddings and reranking",
    modelId: "BAAI/bge-m3",
    engine: "TEI",
  },
  {
    id: "sug-8",
    action: "Benchmark",
    modelBadge: { icon: <MetaLogo size={13} />, text: "Llama 3.2 3B" },
    engineBadge: { icon: <VLLMLogo size={13} />, text: "vLLM" },
    rest: "for throughput, latency, and quality tradeoffs",
    fullPrompt: "Benchmark meta-llama/Llama-3.2-3B on vLLM for throughput and latency",
    modelId: "meta-llama/Llama-3.2-3B",
    engine: "vLLM",
  },
  {
    id: "sug-9",
    action: "Optimize",
    modelBadge: { icon: <QwenLogo size={13} />, text: "Qwen 2.5 VL 7B" },
    engineBadge: { icon: <SGLangLogo size={13} />, text: "SGLang" },
    rest: "for vision-language serving with batching",
    fullPrompt: "Optimize Qwen/Qwen2.5-VL-7B-Instruct on SGLang for vision-language batching",
    modelId: "Qwen/Qwen2.5-VL-7B-Instruct",
    engine: "SGLang",
  },
  {
    id: "sug-10",
    action: "Generate",
    modelBadge: { icon: <FluxLogo size={13} />, text: "FLUX.1 Schnell" },
    engineBadge: { icon: <DiffusersLogo size={13} />, text: "Diffusers" },
    rest: "images with low-step inference and memory checks",
    fullPrompt: "Generate images with black-forest-labs/FLUX.1-schnell on Diffusers with memory checks",
    modelId: "black-forest-labs/FLUX.1-schnell",
    engine: "Diffusers",
  },
];

type FlyoutTab = "models" | "engine" | "gpu" | "runs_on" | "output_format";

export function TokenPromptInput({
  onSubmit,
  onLaunchPrompt,
  initialPrompt = "Build a voice pipeline with Whisper on vLLM Omni ...",
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

  // Dropdown popover states
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [activeFlyoutTab, setActiveFlyoutTab] = useState<FlyoutTab>("models");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [hfSearchQuery, setHfSearchQuery] = useState("");
  const [hfModels, setHfModels] = useState<HfModelItem[]>([]);
  const [animatedSuggestionIndex, setAnimatedSuggestionIndex] = useState(0);

  // Cycle the same rich chip rows shown below the prompt. Clicking or typing
  // immediately reveals the real editor.
  useEffect(() => {
    if (promptEdited) return;
    const cycleTimer = window.setInterval(() => {
      setAnimatedSuggestionIndex((current) => (current + 1) % SUGGESTIONS.length);
    }, 3500);
    return () => window.clearInterval(cycleTimer);
  }, [animatedSuggestionIndex, promptEdited]);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close menus when clicking outside
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

  useEffect(() => {
    const query = hfSearchQuery.trim();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const workspaceId = await resolveActiveEpochWorkspaceId().catch(() => null);
      if (!workspaceId) return;
      const results = await searchEpochHuggingFaceModels(workspaceId, query).catch(() => []);
      if (cancelled) return;
      setHfModels(results.map((result) => {
        const brand = modelBrand(result.author, result.repositoryId);
        return {
          id: result.repositoryId,
          name: result.repositoryId.split("/").pop() ?? result.repositoryId,
          org: result.author ?? result.repositoryId.split("/")[0] ?? "Hugging Face",
          task: result.task ?? result.library ?? "model",
          downloads: result.downloads >= 1_000_000 ? `${(result.downloads / 1_000_000).toFixed(1)}M` : result.downloads >= 1_000 ? `${(result.downloads / 1_000).toFixed(1)}K` : String(result.downloads),
          likes: result.likes >= 1_000 ? `${(result.likes / 1_000).toFixed(1)}K` : String(result.likes),
          ...brand,
        };
      }));
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [hfSearchQuery]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    if (onLaunchPrompt) {
      onLaunchPrompt({
        prompt: prompt.trim(),
        model: selectedModel.id,
        engine: selectedEngine,
        gpu: selectedGpu,
        runsOn: selectedRunsOn,
        outputFormat: selectedOutputFormat,
        mode: selectedMode,
      });
    } else if (onSubmit) {
      onSubmit(prompt.trim(), {
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

  const handleSelectSuggestion = (sug: typeof SUGGESTIONS[0]) => {
    setPromptEdited(true);
    setPrompt(sug.fullPrompt);
    setSelectedEngine(sug.engine);
    const matched = POPULAR_HF_MODELS.find((m) => m.id === sug.modelId);
    if (matched) setSelectedModel(matched);
  };

  const filteredHfModels = hfModels.filter(
    (m) =>
      m.name.toLowerCase().includes(hfSearchQuery.toLowerCase()) ||
      m.org.toLowerCase().includes(hfSearchQuery.toLowerCase())
  );
  const animatedSuggestion = SUGGESTIONS[animatedSuggestionIndex];

  return (
    <div ref={containerRef} className={cn("w-full space-y-4", className)}>
      {/* Title & Subtitle */}
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

      {/* Main Interactive Prompt Card */}
      <div className={cn(
        "relative max-w-[840px] border p-4 transition-all rounded-xs",
        dark
          ? "border-[#333333] bg-[#1a1a1a] shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
          : "border-[#d8ddd3] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      )}>
        {/* Prompt Input Area */}
        <div className="relative min-h-[56px]">
          {!promptEdited && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setPromptEdited(true);
                setPrompt(SUGGESTIONS[animatedSuggestionIndex].fullPrompt);
                textareaRef.current?.focus();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setPromptEdited(true);
                  setPrompt(SUGGESTIONS[animatedSuggestionIndex].fullPrompt);
                  textareaRef.current?.focus();
                }
              }}
              className={cn("absolute inset-0 z-10 flex min-h-[56px] cursor-text items-start gap-2 overflow-hidden whitespace-nowrap text-xs md:text-sm transition-opacity", dark ? "text-[#d1d5db]" : "text-[#374151]")}
            >
              <ArrowRight size={13} className="mt-1 text-[#788274] shrink-0" />
              <span className="mt-0.5 shrink-0">{animatedSuggestion.action}</span>
              <span className="inline-flex shrink-0 items-center gap-1 border border-[#383838] bg-[#242424] px-1.5 py-0.5 rounded-xs font-medium text-white">
                {animatedSuggestion.modelBadge.icon}
                {animatedSuggestion.modelBadge.text}
              </span>
              {animatedSuggestion.secondaryModelBadge && (
                <>
                  <span className="mt-0.5 shrink-0">+</span>
                  <span className="inline-flex shrink-0 items-center gap-1 border border-[#383838] bg-[#242424] px-1.5 py-0.5 rounded-xs font-medium text-white">
                    {animatedSuggestion.secondaryModelBadge.icon}
                    {animatedSuggestion.secondaryModelBadge.text}
                  </span>
                </>
              )}
              <span className="mt-0.5 shrink-0">on</span>
              <span className="inline-flex shrink-0 items-center gap-1 border border-[#383838] bg-[#242424] px-1.5 py-0.5 rounded-xs font-medium text-white">
                {animatedSuggestion.engineBadge.icon}
                {animatedSuggestion.engineBadge.text}
              </span>
              <span className="mt-0.5 truncate">{animatedSuggestion.rest}</span>
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
                setPrompt(SUGGESTIONS[animatedSuggestionIndex].fullPrompt);
              }
            }}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Build a voice pipeline with Whisper on vLLM Omni ..."
            className={cn(
              "min-h-[56px] w-full resize-none bg-transparent p-0 text-sm md:text-base font-normal outline-none",
              !promptEdited && "pointer-events-none opacity-0",
              dark ? "text-white placeholder:text-[#666]" : "text-[#171a17] placeholder:text-[#90988c]"
            )}
          />
        </div>

        {/* Structured Token Controls Row */}
        <div className={cn(
          "mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-dashed pt-3",
          dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
        )}>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {/* 1. Models Token Pill */}
            <button
              type="button"
              onClick={() => handleOpenFlyout("models")}
              className={cn(
                "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs",
                flyoutOpen && activeFlyoutTab === "models"
                  ? "border-[#75bf00] bg-[#1a2416] text-[#a3e635] font-medium"
                  : dark
                  ? "border-[#383838] bg-[#222222] text-white hover:border-[#555]"
                  : "border-[#d8ddd3] bg-[#fafbfa] text-[#2a3028] hover:border-[#8ec840]"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
              <span>Models</span>
              {flyoutOpen && activeFlyoutTab === "models" ? (
                <ChevronUp size={12} className="text-[#888]" />
              ) : (
                <ChevronDown size={12} className="text-[#888]" />
              )}
            </button>

            {/* 2. Output format Pill */}
            <button
              type="button"
              onClick={() => handleOpenFlyout("output_format")}
              className={cn(
                "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs",
                flyoutOpen && activeFlyoutTab === "output_format"
                  ? "border-[#75bf00] bg-[#1a2416] text-[#a3e635] font-medium"
                  : dark
                  ? "border-[#383838] bg-[#222222] text-white hover:border-[#555]"
                  : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#a8b0a2]"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
              <span>Output format</span>
              {flyoutOpen && activeFlyoutTab === "output_format" ? (
                <ChevronUp size={12} className="text-[#888]" />
              ) : (
                <ChevronDown size={12} className="text-[#888]" />
              )}
            </button>

            {/* 3. Grouped Token Pill [ vLLM | Nvidia | Cloud | Auto ] */}
            <div
              onClick={() => handleOpenFlyout("engine")}
              className={cn(
                "flex items-center gap-1.5 border px-2.5 py-1 text-xs rounded-xs font-mono text-[11px] cursor-pointer hover:border-[#555] transition-colors",
                dark ? "border-[#383838] bg-[#222222] text-[#888]" : "border-[#d8ddd3] bg-white text-[#666]"
              )}
            >
              <VLLMLogo size={13} />
              <NvidiaLogo size={13} />
              <Cloud size={13} />
              <span className="text-[10px]">Auto</span>
            </div>
          </div>

          {/* Right Token Actions: Mode Switcher + Launch Button */}
          <div className="flex items-center gap-2">
            {/* Mode Switcher Popover Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setModeDropdownOpen(!modeDropdownOpen);
                  setFlyoutOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs",
                  dark
                    ? "border-[#383838] bg-[#222222] text-white hover:border-[#555]"
                    : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#171a17]"
                )}
              >
                {selectedMode === "Experiment" ? (
                  <FlaskConical size={13} className="text-[#788274]" />
                ) : (
                  <Gauge size={13} className="text-[#75bf00]" />
                )}
                <span className="font-medium">{selectedMode}</span>
                {modeDropdownOpen ? (
                  <ChevronUp size={11} className="text-[#788274]" />
                ) : (
                  <ChevronDown size={11} className="text-[#788274]" />
                )}
              </button>

              {/* Mode Dropdown Popover */}
              {modeDropdownOpen && (
                <div className={cn(
                  "absolute right-0 top-full mt-2 w-80 border shadow-2xl p-1.5 space-y-1 text-xs z-50 rounded-xs animate-in fade-in zoom-in-95 duration-100",
                  dark
                    ? "border-[#383838] bg-[#202020] text-white"
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
                        ? dark ? "bg-[#282828]" : "bg-[#f3f6f0]"
                        : dark ? "hover:bg-[#282828]" : "hover:bg-[#f3f6f0]"
                    )}
                  >
                    <Gauge size={15} className="text-[#75bf00] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">Optimize</span>
                        {selectedMode === "Optimize" && (
                          <Check size={14} className="text-[#75bf00]" />
                        )}
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
                        ? dark ? "bg-[#282828]" : "bg-[#f3f6f0]"
                        : dark ? "hover:bg-[#282828]" : "hover:bg-[#f3f6f0]"
                    )}
                  >
                    <FlaskConical size={15} className="text-[#788274] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">Experiment</span>
                        {selectedMode === "Experiment" && (
                          <Check size={14} className="text-[#75bf00]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#888] mt-0.5 leading-relaxed">
                        Test candidates against constraints without applying changes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Launch / Send Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className={cn(
                "flex h-7 w-7 items-center justify-center transition-all rounded-xs",
                prompt.trim()
                  ? "bg-[#75bf00] text-black hover:bg-[#68ab00] active:scale-95 shadow-sm"
                  : "border border-[#383838] bg-[#222] text-[#666] cursor-not-allowed"
              )}
              title="Launch pipeline optimization (Enter)"
            >
              <ArrowUp size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 2-COLUMN SPLIT FLYOUT MODAL (Exact match for all user screenshots!) */}
        {flyoutOpen && (
          <div className={cn(
            "absolute left-0 right-0 top-full mt-2 z-50 border border-dashed shadow-2xl rounded-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col md:flex-row min-h-[410px]",
            dark ? "border-[#383838] bg-[#181818] text-white" : "border-[#c9cec4] bg-white text-[#171a17]"
          )}>
            {/* Left Column / Vertical Rail */}
            <div className={cn(
              "w-full md:w-52 border-b md:border-b-0 md:border-r border-dashed p-2 space-y-1 shrink-0 font-sans text-xs",
              dark ? "border-[#282828] bg-[#151515]" : "border-[#edf0eb] bg-[#fafbfa]"
            )}>
              {[
                { id: "models", label: "Models", icon: <HuggingFaceLogo size={14} /> },
                { id: "engine", label: "Serving engine", icon: <VLLMLogo size={14} /> },
                { id: "gpu", label: "GPU", icon: <NvidiaLogo size={14} /> },
                { id: "runs_on", label: "Runs on", icon: <Cloud size={14} className="text-[#888]" /> },
                { id: "output_format", label: "Output format", icon: <Layers size={14} className="text-[#888]" /> },
              ].map((tab) => {
                const isActive = activeFlyoutTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFlyoutTab(tab.id as FlyoutTab)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-medium rounded-xs transition-colors text-left",
                      isActive
                        ? dark
                          ? "bg-[#282828] text-white font-semibold shadow-xs"
                          : "bg-[#e8ece5] text-black font-semibold shadow-xs"
                        : dark
                        ? "text-[#889084] hover:bg-[#202020] hover:text-white"
                        : "text-[#656d60] hover:bg-[#f0f2ee] hover:text-black"
                    )}
                  >
                    <span className="shrink-0 flex items-center justify-center">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Column / Main Body */}
            <div className="flex-1 p-4 space-y-3 overflow-hidden flex flex-col min-w-0">
              {/* TAB 1: MODELS (Matching Screenshot 2) */}
              {activeFlyoutTab === "models" && (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  {/* Hugging Face Search Bar */}
                  <div className={cn(
                    "flex items-center gap-2 border border-dashed px-3 py-2 text-xs rounded-xs shrink-0",
                    dark ? "border-[#333] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                  )}>
                    <HuggingFaceLogo size={16} />
                    <input
                      value={hfSearchQuery}
                      onChange={(e) => setHfSearchQuery(e.target.value)}
                      placeholder="Search Hugging Face models or paste a repo id..."
                      className="w-full bg-transparent text-xs outline-none placeholder:text-[#666]"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#788274] font-mono shrink-0">
                    <HuggingFaceLogo size={13} />
                    <span>Popular on Hugging Face {filteredHfModels.length}</span>
                  </div>

                  {/* High-density model items list */}
                  <div className="flex-1 overflow-y-auto space-y-1 max-h-[300px] pr-1">
                    {filteredHfModels.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m);
                          setPrompt(`Optimize @${m.id} on @${selectedEngine} for latency and VRAM checks`);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2.5 cursor-pointer transition-colors text-xs rounded-xs group",
                          selectedModel?.id === m.id
                            ? dark ? "bg-[#252525]" : "bg-[#f3f6f0]"
                            : dark ? "hover:bg-[#202020]" : "hover:bg-[#fafbfa]"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 flex items-center justify-center">
                            {m.iconType === "meta" && <MetaLogo size={16} />}
                            {m.iconType === "qwen" && <QwenLogo size={16} />}
                            {m.iconType === "baai" && <BAAILogo size={16} />}
                            {m.iconType === "flux" && <FluxLogo size={16} />}
                            {m.iconType === "openai" && <OpenAILogo size={16} />}
                            {m.iconType === "kimi" && <span className="inline-flex h-4 w-4 items-center justify-center font-sans text-[20px] font-light leading-none text-[#d9d9d9]">K</span>}
                            {m.iconType === "nvidia" && <NvidiaLogo size={16} />}
                            {m.iconType === "google" && <GoogleLogo size={16} />}
                            {m.iconType === "simple" && m.brandIcon && <SimpleBrandLogo icon={m.brandIcon} size={16} />}
                            {m.iconType === "hf" && m.brandIcon && <SimpleBrandLogo icon={m.brandIcon} size={16} />}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className={cn("font-bold text-xs truncate", dark ? "text-white" : "text-[#171a17]")}>
                              {m.name}
                            </div>
                            <div className="text-[11px] text-[#788274] font-mono truncate">
                              {m.org}, {m.task}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#788274] shrink-0 ml-3">
                          <span className={cn(
                            "flex items-center gap-1 px-2 py-0.5 border border-dashed rounded-xs",
                            dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#edf0eb] bg-white"
                          )}>
                            <Download size={10} /> {m.downloads}
                          </span>
                          <span className={cn(
                            "flex items-center gap-1 px-2 py-0.5 border border-dashed rounded-xs",
                            dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#edf0eb] bg-white"
                          )}>
                            <Heart size={10} /> {m.likes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: SERVING ENGINE (Matching Screenshot 1 of serving engine) */}
              {activeFlyoutTab === "engine" && (
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[340px] pr-1">
                  {/* Top option: Auto (recommended) */}
                  <div
                    onClick={() => {
                      setSelectedEngine("vLLM");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 border border-dashed rounded-xs cursor-pointer transition-colors",
                      dark ? "border-[#2e2e2e] bg-[#1d2419]" : "border-[#b9de78] bg-[#f5faee]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Zap size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                      <div>
                        <div className={cn("font-bold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                          Auto (recommended)
                        </div>
                        <div className="text-[11px] text-[#788274] mt-0.5">
                          Agent picks from the supported runtime matrix
                        </div>
                      </div>
                    </div>
                    <Check size={16} className="text-[#75bf00]" />
                  </div>

                  {/* Group 1: Core LLM */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#788274] px-1">
                      <div className="flex items-center gap-1.5">
                        <VLLMLogo size={12} />
                        <span>Core LLM</span>
                      </div>
                      <span className="text-[10px]">current</span>
                    </div>

                    {[
                      { name: "vLLM", tags: "llm, embedding, vision-language, +1", icon: <VLLMLogo size={15} /> },
                      { name: "SGLang", tags: "llm, vision-language", icon: <SGLangLogo size={15} /> },
                      { name: "TensorRT-LLM", tags: "llm, vision-language", icon: <NvidiaLogo size={15} /> },
                    ].map((eng) => (
                      <div
                        key={eng.name}
                        onClick={() => {
                          setSelectedEngine(eng.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2.5 border border-dashed rounded-xs cursor-pointer transition-colors text-xs",
                          selectedEngine === eng.name
                            ? dark ? "border-[#383838] bg-[#252525]" : "border-[#d8ddd3] bg-[#f5f8f3]"
                            : dark ? "border-transparent hover:bg-[#222]" : "border-transparent hover:bg-[#fafbfa]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="shrink-0">{eng.icon}</div>
                          <div>
                            <div className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                              {eng.name}
                            </div>
                            <div className="text-[11px] text-[#788274] font-mono">{eng.tags}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Group 2: Experiments */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#788274] px-1">
                      <Sparkles size={12} />
                      <span>Experiments</span>
                    </div>

                    {[
                      { name: "vLLM Omni", tags: "asr, tts, audio-language, +2", icon: <VLLMLogo size={15} />, badge: "Experiment" },
                      { name: "Diffusers", tags: "image-gen, video-gen", icon: <DiffusersLogo size={15} />, badge: "Experiment" },
                      { name: "TEI", tags: "embedding, rerank, classification", icon: <HuggingFaceLogo size={15} />, badge: "Experiment" },
                    ].map((eng) => (
                      <div
                        key={eng.name}
                        onClick={() => {
                          setSelectedEngine(eng.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2.5 border border-dashed rounded-xs cursor-pointer transition-colors text-xs",
                          selectedEngine === eng.name
                            ? dark ? "border-[#383838] bg-[#252525]" : "border-[#d8ddd3] bg-[#f5f8f3]"
                            : dark ? "border-transparent hover:bg-[#222]" : "border-transparent hover:bg-[#fafbfa]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="shrink-0">{eng.icon}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                                {eng.name}
                              </span>
                              <span className={cn(
                                "text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-xs border border-dashed",
                                dark ? "bg-[#38260d] text-[#fbbf24] border-[#d97706]/40" : "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                              )}>
                                {eng.badge}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#788274] font-mono mt-0.5">{eng.tags}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Group 3: Expanding */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#788274] px-1">
                      <Lock size={12} />
                      <span>Expanding</span>
                    </div>

                    <div className="p-2.5 border border-dashed border-[#282828] rounded-xs text-xs space-y-1 opacity-70">
                      <div className="font-semibold text-xs text-[#a0a89d]">NVIDIA Dynamo</div>
                      <p className="text-[11px] text-[#6b7367]">
                        Dynamo has no live RunInfra Cloud image or Modal stress-test worker in this workspace yet.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GPU (Matching Screenshot 2 & 3 of GPU) */}
              {activeFlyoutTab === "gpu" && (
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
                  {/* Auto GPU */}
                  <div
                    onClick={() => {
                      setSelectedGpu("Auto (recommended)");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 border border-dashed rounded-xs cursor-pointer transition-colors",
                      selectedGpu.startsWith("Auto")
                        ? dark ? "border-[#2e2e2e] bg-[#1d2419]" : "border-[#b9de78] bg-[#f5faee]"
                        : dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Cpu size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                      <div>
                        <div className={cn("font-bold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                          Auto (recommended)
                        </div>
                        <div className="text-[11px] text-[#788274] mt-0.5">
                          Will likely pick T4 (cheapest viable option).
                        </div>
                      </div>
                    </div>
                    {selectedGpu.startsWith("Auto") && <Check size={16} className="text-[#75bf00]" />}
                  </div>

                  {/* GPU Options Header */}
                  <div className="flex items-center justify-between text-[11px] font-mono px-1">
                    <div className="flex items-center gap-1.5 text-[#788274]">
                      <NvidiaLogo size={12} />
                      <span>GPU options</span>
                    </div>
                    <span className="text-[10px] text-[#75bf00] font-bold border border-dashed border-[#75bf00]/40 bg-[#162916] px-1.5 py-0.2 rounded-xs">
                      Core
                    </span>
                  </div>

                  {/* Locked GPU items list */}
                  <div className="space-y-1">
                    {[
                      { name: "T4", ram: "16 GB", desc: "Budget, tiny models" },
                      { name: "L4", ram: "24 GB", desc: "Budget, quantized 7B-14B" },
                      { name: "A10G", ram: "24 GB", desc: "Balanced, quantized 13B" },
                      { name: "L40S", ram: "48 GB", desc: "Great cost/performance" },
                      { name: "A100-40GB", ram: "40 GB", desc: "Mid-tier, 70B quantized" },
                      { name: "A100-80GB", ram: "80 GB", desc: "Large models, 70B quantized" },
                      { name: "H100", ram: "80 GB", desc: "Maximum throughput, FP8" },
                      { name: "H200", ram: "141 GB", desc: "70B FP16, large MoE" },
                      { name: "B200", ram: "192 GB", desc: "Flagship, 70B+ FP16" },
                    ].map((gpu) => (
                      <div
                        key={gpu.name}
                        onClick={() => {
                          setSelectedGpu(`${gpu.name} ${gpu.ram}`);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2.5 border border-dashed rounded-xs cursor-pointer transition-colors text-xs",
                          selectedGpu.startsWith(gpu.name)
                            ? dark ? "border-[#383838] bg-[#252525]" : "border-[#d8ddd3] bg-[#f5f8f3]"
                            : dark ? "border-transparent hover:bg-[#202020]" : "border-transparent hover:bg-[#fafbfa]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Lock size={13} className="text-[#666] shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                                {gpu.name}
                              </span>
                              <span className="text-[11px] font-mono text-[#788274]">{gpu.ram}</span>
                            </div>
                            <div className="text-[11px] text-[#788274] font-mono mt-0.5">{gpu.desc}</div>
                          </div>
                        </div>

                        <Lock size={13} className="text-[#666] shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* Footer explanation note */}
                  <div className="text-[11px] text-[#788274] pt-2 border-t border-dashed border-[#282828] font-sans leading-relaxed">
                    Manual GPU selection unlocks on Core. Auto GPU still chooses the lowest viable hardware for the current model.
                  </div>
                </div>
              )}

              {/* TAB 4: RUNS ON (Matching Screenshot 4) */}
              {activeFlyoutTab === "runs_on" && (
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
                  {/* Top option: Auto (recommended) */}
                  <div
                    onClick={() => {
                      setSelectedRunsOn("Auto");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 border border-dashed rounded-xs cursor-pointer transition-colors",
                      selectedRunsOn === "Auto"
                        ? dark ? "border-[#2e2e2e] bg-[#1d2419]" : "border-[#b9de78] bg-[#f5faee]"
                        : dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Zap size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                      <div>
                        <div className={cn("font-bold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                          Auto (recommended)
                        </div>
                        <div className="text-[11px] text-[#788274] mt-0.5">
                          Agent infers placement from your use case.
                        </div>
                      </div>
                    </div>
                    {selectedRunsOn === "Auto" && <Check size={16} className="text-[#75bf00]" />}
                  </div>

                  {/* Section Header */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#788274] px-1">
                    <Cloud size={12} />
                    <span>Runs on</span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-1">
                    {[
                      { name: "Local machine", desc: "Your own desktop or workstation GPU.", icon: <Laptop size={15} /> },
                      { name: "Own server", desc: "A single server you operate.", icon: <Server size={15} /> },
                      { name: "Managed cloud", desc: "Provisioned and metered in RunInfra's cloud.", icon: <Cloud size={15} /> },
                      { name: "Personal", desc: "Side projects and light traffic, smallest viable footprint.", icon: <Home size={15} /> },
                    ].map((opt) => (
                      <div
                        key={opt.name}
                        onClick={() => {
                          setSelectedRunsOn(opt.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 p-3 border border-dashed rounded-xs cursor-pointer transition-colors text-xs",
                          selectedRunsOn === opt.name
                            ? dark ? "border-[#383838] bg-[#252525]" : "border-[#d8ddd3] bg-[#f5f8f3]"
                            : dark ? "border-transparent hover:bg-[#202020]" : "border-transparent hover:bg-[#fafbfa]"
                        )}
                      >
                        <div className="mt-0.5 text-[#888] shrink-0">{opt.icon}</div>
                        <div>
                          <div className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                            {opt.name}
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">{opt.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: OUTPUT FORMAT (Matching Screenshot 5) */}
              {activeFlyoutTab === "output_format" && (
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
                  {/* Top option: Auto format (disabled notice matching screenshot 5) */}
                  <div className={cn(
                    "p-3 border border-dashed rounded-xs text-xs opacity-75",
                    dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-[#fcfcfc]"
                  )}>
                    <div className="flex items-start gap-3">
                      <CircleDashed size={16} className="text-[#666] shrink-0 mt-0.5" />
                      <div>
                        <div className={cn("font-bold text-xs", dark ? "text-[#a0a89d]" : "text-[#555]")}>
                          Auto format
                        </div>
                        <div className="text-[11px] text-[#788274] mt-0.5 leading-relaxed">
                          Not available for a new run: the plan optimizes toward a declared format from the first step, so pick one below.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Header */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#788274] px-1">
                    <Layers size={12} />
                    <span>Output format</span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-1">
                    {[
                      { name: "Managed endpoint", desc: "A live endpoint in RunInfra's cloud, provisioned and metered.", icon: <Cloud size={15} /> },
                      { name: "Self-host kit", desc: "Docker image and Compose file with serve and verify scripts.", icon: <Box size={15} /> },
                      { name: "Local (Ollama / GGUF)", desc: "GGUF weights for llama.cpp and Ollama on your own machine.", icon: <Laptop size={15} /> },
                      { name: "Kubernetes", desc: "Deployment manifests for a cluster you operate.", icon: <Boxes size={15} /> },
                      { name: "Direct weights", desc: "Direct weights export is coming soon.", icon: <HardDrive size={15} />, badge: "Coming soon" },
                    ].map((fmt) => (
                      <div
                        key={fmt.name}
                        onClick={() => {
                          setSelectedOutputFormat(fmt.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 p-3 border border-dashed rounded-xs cursor-pointer transition-colors text-xs",
                          selectedOutputFormat === fmt.name
                            ? dark ? "border-[#383838] bg-[#252525]" : "border-[#d8ddd3] bg-[#f5f8f3]"
                            : dark ? "border-transparent hover:bg-[#202020]" : "border-transparent hover:bg-[#fafbfa]"
                        )}
                      >
                        <div className="mt-0.5 text-[#888] shrink-0">{fmt.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                              {fmt.name}
                            </span>
                            {fmt.badge && (
                              <span className={cn(
                                "text-[9px] font-mono px-1.5 py-0.2 rounded-xs border border-dashed",
                                dark ? "border-[#383838] bg-[#222] text-[#888]" : "border-[#d8ddd3] bg-white text-[#777]"
                              )}>
                                {fmt.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">{fmt.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Section Below Prompt Card (Matching Screenshot 1) */}
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
                "flex items-center gap-2 p-3 text-xs cursor-pointer transition-colors font-sans",
                dark ? "hover:bg-[#222222] text-[#d1d5db]" : "hover:bg-[#fafbfa] text-[#374151]"
              )}
            >
              <ArrowRight size={13} className="text-[#788274] shrink-0" />
              <span>{sug.action}</span>

              {/* Model Pill */}
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-xs font-medium text-xs",
                dark ? "border-[#383838] bg-[#242424] text-white" : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]"
              )}>
                {sug.modelBadge.icon}
                <span>{sug.modelBadge.text}</span>
              </span>

              {sug.secondaryModelBadge && (
                <>
                  <span>+</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-xs font-medium text-xs",
                    dark ? "border-[#383838] bg-[#242424] text-white" : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]"
                  )}>
                    {sug.secondaryModelBadge.icon}
                    <span>{sug.secondaryModelBadge.text}</span>
                  </span>
                </>
              )}

              <span>on</span>

              {/* Engine Pill */}
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-xs font-medium text-xs",
                dark ? "border-[#383838] bg-[#242424] text-white" : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]"
              )}>
                {sug.engineBadge.icon}
                <span>{sug.engineBadge.text}</span>
              </span>

              <span className="truncate">{sug.rest}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

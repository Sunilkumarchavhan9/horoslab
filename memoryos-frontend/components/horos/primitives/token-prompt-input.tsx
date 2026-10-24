"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Server,
  Activity,
  Layers,
  GitCompare,
  Rocket,
  ShieldAlert,
  GraduationCap,
  TrendingUp,
  Compass,
  Eye,
  Mic,
  Image as ImageIcon,
  Video as VideoIcon,
  Radio,
  Bot,
  Plus,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  FileText,
  Table,
  Code,
  X,
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
  KimiLogo,
  MicrosoftLogo,
  TEILogo,
  GLMLogo,
  MiniMaxLogo,
  InclusionAILogo,
  XiaomiLogo,
  PoolsideLogo,
  UpstageLogo,
} from "./brand-icons";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import {
  resolveActiveHorosWorkspaceId,
  searchHorosHuggingFaceModels,
} from "@/lib/horos-api";
import { ModelEntity, HorosIntent } from "@/lib/horos-types";
import {
  compileIntent,
  MULTI_DOMAIN_SUGGESTIONS,
  MULTI_REALITY_ENTITIES,
  type ComposerSuggestion,
  type CompiledMissionIntent,
} from "@/lib/composer/intent-compiler";
import {
  SegmentedInlineComposer,
  type SegmentedInlineComposerHandle,
} from "./segmented-inline-composer";

export interface HfModelItem {
  id: string;
  name: string;
  org: string;
  task: string;
  downloads: string;
  likes: string;
  iconType:
    | "glm"
    | "meta"
    | "qwen"
    | "baai"
    | "flux"
    | "openai"
    | "kimi"
    | "nvidia"
    | "google"
    | "deepseek"
    | "mistral"
    | "microsoft"
    | "minimax"
    | "inclusionai"
    | "xiaomi"
    | "poolside"
    | "upstage"
    | "hf";
  repositoryId?: string;
  revision?: string | null;
  commitSha?: string | null;
  artifactDigest?: string | null;
  metadata?: Record<string, unknown>;
}

export type ComposerSegment =
  | { type: "text"; value: string }
  | {
      type:
        "model" | "runtime" | "gpu" | "provider" | "environment" | "objective";
      id: string;
      label: string;
      metadata?: Record<string, unknown>;
    };

export function ModelBrandIcon({
  model,
  size = 13,
}: {
  model?:
    | HfModelItem
    | { id?: string; iconType?: string; name?: string; org?: string };
  size?: number;
}) {
  if (!model) return <HuggingFaceLogo size={size} />;
  const n = (model.name || "").toLowerCase();
  const id = (model.id || "").toLowerCase();
  const org = (
    ("org" in model && typeof model.org === "string" ? model.org : "") || ""
  ).toLowerCase();
  const iconType = (model.iconType || "").toLowerCase();

  const normalizedId = id.replace(/\s+/g, "");
  const normalizedName = n.replace(/\s+/g, "");
  const normalizedOrg = org.replace(/\s+/g, "");
  const officialMiniMaxIds = [
    "minimaxai/minimax-h3",
    "minimaxai/minimax-m2.7",
    "minimaxai/minimax-m2.5",
  ];
  const officialMiniMaxNames = ["minimax-h3", "minimax-m2.7", "minimax-m2.5"];
  const isOfficialMiniMax =
    iconType === "minimax" ||
    officialMiniMaxIds.includes(normalizedId) ||
    (normalizedOrg.includes("minimaxai") &&
      officialMiniMaxNames.includes(normalizedName));

  // Keep MiniMax branding limited to the three official MiniMaxAI models.
  if (isOfficialMiniMax) return <MiniMaxLogo size={size} />;
  const officialInclusionAI =
    normalizedId.startsWith("inclusionai/") ||
    (iconType === "inclusionai" && normalizedOrg.includes("inclusionai"));
  if (officialInclusionAI) return <InclusionAILogo size={size} />;
  if (
    normalizedId.startsWith("xiaomimimo/") ||
    (iconType === "xiaomi" && normalizedOrg.includes("xiaomimimo"))
  )
    return <XiaomiLogo size={size} />;
  if (
    normalizedId.startsWith("poolside/") ||
    (iconType === "poolside" && normalizedOrg.includes("poolside"))
  )
    return <PoolsideLogo size={size} />;
  if (
    normalizedId.startsWith("upstage/") ||
    (iconType === "upstage" && normalizedOrg.includes("upstage"))
  )
    return <UpstageLogo size={size} />;

  // 1. Explicit author / org prefix priority checks
  if (
    org.startsWith("microsoft") ||
    id.startsWith("microsoft/") ||
    iconType === "microsoft"
  )
    return <MicrosoftLogo size={size} />;
  if (org.startsWith("nvidia") || id.startsWith("nvidia/"))
    return <NvidiaLogo size={size} />;
  if (
    org.startsWith("meta") ||
    id.startsWith("meta-llama/") ||
    id.startsWith("facebook/")
  )
    return <MetaLogo size={size} />;
  if (org.startsWith("google") || id.startsWith("google/"))
    return <GoogleLogo size={size} />;
  if (
    org.startsWith("qwen") ||
    org.startsWith("alibaba") ||
    id.startsWith("qwen/")
  )
    return <QwenLogo size={size} />;
  if (org.startsWith("deepseek") || id.startsWith("deepseek-ai/"))
    return <DeepSeekLogo size={size} />;
  if (org.startsWith("mistral") || id.startsWith("mistralai/"))
    return <MistralLogo size={size} />;
  if (org.startsWith("baai") || id.startsWith("baai/"))
    return <BAAILogo size={size} />;
  if (
    org.startsWith("moonshot") ||
    id.startsWith("moonshotai/") ||
    iconType === "kimi" ||
    iconType === "moonshot"
  )
    return <KimiLogo size={size} />;

  // 2. Keyword fallback matching
  if (
    iconType === "microsoft" ||
    n.includes("microsoft") ||
    id.includes("microsoft") ||
    n.includes("deberta") ||
    id.includes("deberta") ||
    n.includes("florence") ||
    id.includes("florence") ||
    n.includes("phi-") ||
    id.includes("phi-") ||
    n.includes("trellis") ||
    id.includes("trellis")
  )
    return <MicrosoftLogo size={size} />;
  if (iconType === "nvidia" || n.includes("nvidia") || id.includes("nemotron"))
    return <NvidiaLogo size={size} />;
  if (
    iconType === "google" ||
    n.includes("gemma") ||
    id.includes("gemma") ||
    id.includes("google")
  )
    return <GoogleLogo size={size} />;
  if (iconType === "qwen" || n.includes("qwen") || id.includes("qwen"))
    return <QwenLogo size={size} />;
  if (
    iconType === "meta" ||
    n.includes("llama") ||
    id.includes("llama") ||
    id.includes("meta")
  )
    return <MetaLogo size={size} />;
  if (
    iconType === "deepseek" ||
    n.includes("deepseek") ||
    id.includes("deepseek")
  )
    return <DeepSeekLogo size={size} />;
  if (
    iconType === "baai" ||
    n.includes("bge") ||
    id.includes("baai") ||
    id.includes("bge")
  )
    return <BAAILogo size={size} />;
  if (iconType === "flux" || n.includes("flux") || id.includes("flux"))
    return <FluxLogo size={size} />;
  if (
    iconType === "openai" ||
    n.includes("whisper") ||
    id.includes("openai") ||
    id.includes("whisper")
  )
    return <OpenAILogo size={size} />;
  if (iconType === "mistral" || n.includes("mistral") || id.includes("mistral"))
    return <MistralLogo size={size} />;
  if (iconType === "glm" || n.includes("glm") || id.includes("glm"))
    return <GLMLogo size={size} />;
  if (
    n.includes("kimi") ||
    id.includes("kimi") ||
    n.includes("moonshot") ||
    id.includes("moonshot")
  )
    return <KimiLogo size={size} />;

  return <HuggingFaceLogo size={size} />;
}

export function EngineBrandIcon({
  engine,
  size = 13,
}: {
  engine: string;
  size?: number;
}) {
  if (engine === "vLLM" || engine === "vLLM-Omni" || engine === "vLLM Omni")
    return <VLLMLogo size={size} />;
  if (engine === "SGLang") return <SGLangLogo size={size} />;
  if (engine === "TEI") return <TEILogo size={size} />;
  if (engine === "Diffusers") return <DiffusersLogo size={size} />;
  if (engine === "TensorRT-LLM") return <NvidiaLogo size={size} />;
  return <Cpu size={size} />;
}

export const POPULAR_HF_MODELS: HfModelItem[] = [
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
    id: "Qwen/Qwen2.5-7B-Instruct",
    name: "Qwen 2.5 7B",
    org: "Qwen, text generation",
    task: "text-generation",
    downloads: "16.0M",
    likes: "1.3K",
    iconType: "qwen",
  },
  {
    id: "Qwen/tiny-Qwen2ForCausalLM-2.5",
    name: "tiny-Qwen2ForCausalLM-2.5",
    org: "Qwen, text generation",
    task: "text-generation",
    downloads: "4.2M",
    likes: "612",
    iconType: "qwen",
  },
  {
    id: "deepseek-ai/DeepSeek-R1",
    name: "DeepSeek R1",
    org: "deepseek-ai, reasoning",
    task: "text-generation",
    downloads: "28.5M",
    likes: "9.8K",
    iconType: "deepseek",
  },
  {
    id: "google/gemma-3-1b-it",
    name: "gemma-3-1b-it",
    org: "google, text generation",
    task: "text-generation",
    downloads: "11.2M",
    likes: "1.1K",
    iconType: "google",
  },
  {
    id: "facebook/opt-125m",
    name: "opt-125m",
    org: "facebook, text generation",
    task: "text-generation",
    downloads: "17.0M",
    likes: "292",
    iconType: "hf",
  },
  {
    id: "BAAI/bge-m3",
    name: "BGE-M3",
    org: "BAAI, feature extraction",
    task: "feature-extraction",
    downloads: "18.9M",
    likes: "2.1K",
    iconType: "baai",
  },
  {
    id: "openai/whisper-large-v3",
    name: "Whisper Large V3",
    org: "openai, speech recognition",
    task: "automatic-speech-recognition",
    downloads: "14.8M",
    likes: "3.1K",
    iconType: "openai",
  },
  {
    id: "black-forest-labs/FLUX.1-schnell",
    name: "FLUX.1 Schnell",
    org: "black-forest-labs, text to image",
    task: "text-to-image",
    downloads: "8.4M",
    likes: "3.2K",
    iconType: "flux",
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
  {
    id: "RadixArk/Kimi-K3-DSpark",
    name: "Kimi-K3-DSpark",
    org: "RadixArk, reasoning",
    task: "text-generation",
    downloads: "2.8M",
    likes: "53",
    iconType: "hf",
  },
  {
    id: "moonshotai/Kimi-K3",
    name: "Kimi-K3",
    org: "moonshotai, reasoning",
    task: "text-generation",
    downloads: "2.4M",
    likes: "10.9K",
    iconType: "kimi",
  },
  {
    id: "nvidia/Kimi-K2.7-Code-NVFP4",
    name: "Kimi-K2.7-Code-NVFP4",
    org: "nvidia, code generation",
    task: "text-generation",
    downloads: "1.0M",
    likes: "9",
    iconType: "nvidia",
  },
  {
    id: "moonshotai/Kimi-K2.6",
    name: "Kimi-K2.6",
    org: "moonshotai, text generation",
    task: "text-generation",
    downloads: "834K",
    likes: "1.5K",
    iconType: "kimi",
  },
  {
    id: "moonshotai/Kimi-K2.5",
    name: "Kimi-K2.5",
    org: "moonshotai, text generation",
    task: "text-generation",
    downloads: "764K",
    likes: "2.8K",
    iconType: "kimi",
  },
  {
    id: "moonshotai/Kimi-K2.7-Code",
    name: "Kimi-K2.7-Code",
    org: "moonshotai, code generation",
    task: "text-generation",
    downloads: "483K",
    likes: "1.3K",
    iconType: "kimi",
  },
  {
    id: "microsoft/mdeberta-v3-base",
    name: "mdeberta-v3-base",
    org: "microsoft, fill mask",
    task: "fill-mask",
    downloads: "5.0M",
    likes: "232",
    iconType: "microsoft",
  },
  {
    id: "microsoft/deberta-v3-base",
    name: "deberta-v3-base",
    org: "microsoft, fill mask",
    task: "fill-mask",
    downloads: "2.9M",
    likes: "434",
    iconType: "microsoft",
  },
  {
    id: "microsoft/Florence-2-base",
    name: "Florence-2-base",
    org: "microsoft, image-to-text",
    task: "image-to-text",
    downloads: "2.8M",
    likes: "393",
    iconType: "microsoft",
  },
  {
    id: "microsoft/TRELLIS-image-large",
    name: "TRELLIS-image-large",
    org: "microsoft, 3d-generation",
    task: "image-to-3d",
    downloads: "1.9M",
    likes: "672",
    iconType: "microsoft",
  },
  {
    id: "microsoft/deberta-v3-large",
    name: "deberta-v3-large",
    org: "microsoft, fill mask",
    task: "fill-mask",
    downloads: "1.9M",
    likes: "285",
    iconType: "microsoft",
  },
  {
    id: "microsoft/resnet-50",
    name: "resnet-50",
    org: "microsoft, image-classification",
    task: "image-classification",
    downloads: "1.8M",
    likes: "506",
    iconType: "microsoft",
  },
];

export const SERVING_ENGINES = {
  core: [
    {
      id: "vLLM",
      name: "vLLM",
      desc: "llm, embedding, vision-language, +1",
      icon: <VLLMLogo size={14} />,
    },
    {
      id: "SGLang",
      name: "SGLang",
      desc: "llm, vision-language",
      icon: <SGLangLogo size={14} />,
    },
    {
      id: "TensorRT-LLM",
      name: "TensorRT-LLM",
      desc: "llm, vision-language",
      icon: <NvidiaLogo size={14} />,
    },
  ],
  experiments: [
    {
      id: "vLLM-Omni",
      name: "vLLM Omni",
      badge: "Experiment",
      desc: "asr, tts, audio-language, +2",
      icon: <VLLMLogo size={14} />,
    },
    {
      id: "Diffusers",
      name: "Diffusers",
      badge: "Experiment",
      desc: "image-gen, video-gen",
      icon: <DiffusersLogo size={14} />,
    },
    {
      id: "TEI",
      name: "TEI",
      badge: "Experiment",
      desc: "embedding, rerank, classification",
      icon: <TEILogo size={14} />,
    },
  ],
  expanding: [
    {
      id: "NVIDIA Dynamo",
      name: "NVIDIA Dynamo",
      desc: "Dynamo has no live RunInfra Cloud image or Modal stress-test worker in this workspace yet.",
      icon: <Cpu size={14} />,
    },
  ],
};

export const GPU_OPTIONS = [
  {
    id: "Auto",
    name: "Auto",
    vram: "Auto",
    desc: "Agent picks cheapest viable GPU tier.",
  },
  { id: "T4", name: "T4", vram: "16 GB", desc: "Budget, tiny models" },
  { id: "L4", name: "L4", vram: "24 GB", desc: "Budget, quantized 7B-14B" },
  { id: "A10G", name: "A10G", vram: "24 GB", desc: "Balanced, quantized 13B" },
  { id: "L40S", name: "L40S", vram: "48 GB", desc: "Great cost/performance" },
  {
    id: "A100-40GB",
    name: "A100-40GB",
    vram: "40 GB",
    desc: "Mid-tier, 70B quantized",
  },
  {
    id: "A100-80GB",
    name: "A100-80GB",
    vram: "80 GB",
    desc: "Large models, 70B quantized",
  },
  { id: "H100", name: "H100", vram: "80 GB", desc: "Maximum throughput, FP8" },
  { id: "H200", name: "H200", vram: "141 GB", desc: "70B FP16, large MoE" },
  { id: "B200", name: "B200", vram: "192 GB", desc: "Flagship, 70B+ FP16" },
];

export type BlueprintMissionMode =
  | "Auto"
  | "Optimize"
  | "Compare"
  | "Diagnose"
  | "Teach"
  | "Predict"
  | "Simulate"
  | "Experiment"
  | "Discover"
  | string;

export interface MissionModeOption {
  id: string;
  name: string;
  actionText: string;
  icon: (props?: { className?: string; size?: number }) => React.ReactNode;
  desc: string;
  badge?: string;
}

export const BLUEPRINT_MISSION_MODES: MissionModeOption[] = [
  {
    id: "auto",
    name: "Auto (Compiler)",
    actionText: "Auto",
    icon: ({ className, size = 14 } = {}) => (
      <Sparkles size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Dynamic autonomy: Compiles intent, targets, and constraints automatically from prompt.",
    badge: "Recommended",
  },
  {
    id: "optimize",
    name: "Optimize & Deploy",
    actionText: "Optimize",
    icon: ({ className, size = 14 } = {}) => (
      <Gauge size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "L4 Bounded Production: Discover candidates, benchmark under load, and deploy verified winner.",
  },
  {
    id: "compare",
    name: "Benchmark & Compare",
    actionText: "Compare",
    icon: ({ className, size = 14 } = {}) => (
      <Layers size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "L2 Auto-Experiment: Side-by-side empirical test across models/runtimes without applying changes.",
  },
  {
    id: "teach",
    name: "Teach & Evolve Model",
    actionText: "Teach",
    icon: ({ className, size = 14 } = {}) => (
      <GraduationCap size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "World Model Learning: Teach models from video, camera & sensor streams to predict action consequences.",
  },
  {
    id: "decode",
    name: "Decode Physical Experience",
    actionText: "Decode",
    icon: ({ className, size = 14 } = {}) => (
      <Compass size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Physical Reality Dynamics: Ingest physical telemetry to decode real-world dynamics for superior power & execution.",
  },
  {
    id: "diagnose",
    name: "Diagnose & Trace",
    actionText: "Diagnose",
    icon: ({ className, size = 14 } = {}) => (
      <Activity size={size} className={className ?? "text-[#e6b800]"} />
    ),
    desc: "L1 Root Cause: Correlate telemetry, traces, and commits to isolate regression causes.",
  },
  {
    id: "predict",
    name: "Predict & Forecast",
    actionText: "Predict",
    icon: ({ className, size = 14 } = {}) => (
      <TrendingUp size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Reality Dynamics: Predict GPU failures, thermal limits, and action consequences before execution.",
  },
  {
    id: "discover",
    name: "Discover & Map Reality",
    actionText: "Discover",
    icon: ({ className, size = 14 } = {}) => (
      <Search size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Reality Graph: Discover entities, infrastructure relationships, dependencies, and system topology.",
  },
  {
    id: "experiment",
    name: "Run Experiment",
    actionText: "Experiment",
    icon: ({ className, size = 14 } = {}) => (
      <FlaskConical size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Hypothesis Engine: Conduct controlled empirical experiments to validate operational hypotheses.",
  },
  {
    id: "evaluate",
    name: "Evaluate Quality",
    actionText: "Evaluate",
    icon: ({ className, size = 14 } = {}) => (
      <CheckCircle2 size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Quality Fabric: Score task success, accuracy, groundedness, and domain metrics with pinned evaluators.",
  },
  {
    id: "datacenter",
    name: "Optimize Data Center",
    actionText: "Optimize DC",
    icon: ({ className, size = 14 } = {}) => (
      <Server size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Data Center Reality: Balance PUE, liquid-cooling temps, NVLink bandwidth, and PCIe contention.",
  },
  {
    id: "simulate",
    name: "Simulate & Sandbox",
    actionText: "Simulate",
    icon: ({ className, size = 14 } = {}) => (
      <Boxes size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "L3 Sandbox: Construct environment dynamics and simulate candidate routing/actuation policies.",
  },
  {
    id: "repair",
    name: "Repair & Remediate",
    actionText: "Repair",
    icon: ({ className, size = 14 } = {}) => (
      <Wrench size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Software Fabric: Auto-patch failing pipelines, code regressions, and infrastructure anomalies.",
  },
  {
    id: "actuate",
    name: "Actuate & Control",
    actionText: "Actuate",
    icon: ({ className, size = 14 } = {}) => (
      <Zap size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "Physical Control: Authorized physical state change on robots, machines, vehicles, and PLCs.",
  },
  {
    id: "continuous",
    name: "Continuous Mission",
    actionText: "Monitor",
    icon: ({ className, size = 14 } = {}) => (
      <ShieldCheck size={size} className={className ?? "text-[#75bf00]"} />
    ),
    desc: "L5 Autonomous Loop: Continuously monitor drift, enforce SLOs & budgets, and adapt over time.",
  },
];

export interface MissionGraph {
  id: string;
  intent: HorosIntent | string;
  actionButtonLabel: string;
  objective: string;
  models: HfModelItem[];
  runtime: string;
  compute: string;
  infrastructure: string;
  outputFormat: string;
  workload?: string;
  constraints: string[];
  mode: BlueprintMissionMode;
  rawInput: string;
  segments: ComposerSegment[];
  resolvedEntities: Array<{
    type: ComposerSegment["type"] | string;
    id: string;
    label: string;
    metadata?: Record<string, unknown>;
  }>;
  domain?: string;
  executionDomain?: string;
  outcomeContract?: Record<string, unknown>;
  unknowns?: string[];
  hypotheses?: string[];
  candidateSystems?: Array<{
    name: string;
    runtime?: string;
    hardware?: string;
    description: string;
  }>;
  discoveryRequirements?: string[];
}

export interface CyclingPromptItem {
  id: string;
  action: string;
  model: { name: string; icon: React.ReactNode };
  secondaryText?: string;
  secondaryModel?: { name: string; icon: React.ReactNode };
  engine?: { name: string; icon: React.ReactNode };
  rest: string;
  fullPrompt: string;
}

export const CYCLING_PROMPTS: CyclingPromptItem[] = [
  {
    id: "c-1",
    action: "Optimize",
    model: { name: "Qwen3-32B", icon: <QwenLogo size={13} /> },
    secondaryText: "on",
    engine: { name: "vLLM", icon: <VLLMLogo size={13} /> },
    rest: "for lower cost while preserving quality and P99 latency",
    fullPrompt:
      "Optimize @Qwen/Qwen3-32B on @vLLM for lower cost while preserving quality and P99 latency",
  },
  {
    id: "c-2",
    action: "Compare",
    model: { name: "Qwen3-32B", icon: <QwenLogo size={13} /> },
    secondaryText: "against",
    secondaryModel: { name: "Llama 3.1 70B", icon: <MetaLogo size={13} /> },
    engine: { name: "Dynamo + TRT", icon: <NvidiaLogo size={13} /> },
    rest: "on @H100 for cost and throughput under batch load",
    fullPrompt:
      "Compare @Qwen/Qwen3-32B against @Llama-3.1-70B on @Dynamo+TRT on @H100 for cost and throughput under batch load",
  },
  {
    id: "c-3",
    action: "Diagnose",
    model: { name: "checkout-service", icon: <HuggingFaceLogo size={13} /> },
    secondaryText: "with",
    engine: { name: "OpenTelemetry", icon: <Cpu size={13} /> },
    rest: "why P99 increased after the latest deployment",
    fullPrompt:
      "Find why @checkout-service P99 increased after the latest deployment",
  },
  {
    id: "c-4",
    action: "Predict",
    model: { name: "cluster-prod", icon: <NvidiaLogo size={13} /> },
    secondaryText: "from",
    engine: { name: "Telemetry", icon: <Cpu size={13} /> },
    rest: "GPU failures using thermal and power history",
    fullPrompt:
      "Predict GPU failures in @cluster-prod from telemetry and thermal history",
  },
  {
    id: "c-5",
    action: "Teach",
    model: { name: "Qwen 2.5-VL", icon: <QwenLogo size={13} /> },
    secondaryText: "to understand",
    secondaryModel: { name: "factory-01", icon: <HuggingFaceLogo size={13} /> },
    rest: "from @video-data and @sensor-data, then predict next state",
    fullPrompt:
      "Teach @Qwen/Qwen2.5-VL to understand @factory-01 from @video-data and @sensor-data, then predict what happens after an action",
  },
  {
    id: "c-6",
    action: "Discover",
    model: { name: "Cosmos-Predict", icon: <NvidiaLogo size={13} /> },
    secondaryText: "observing",
    secondaryModel: { name: "machine-07", icon: <HuggingFaceLogo size={13} /> },
    engine: { name: "Edge Sensors", icon: <Cpu size={13} /> },
    rest: "from multi-modal telemetry and detect anomalies with uncertainty bounds",
    fullPrompt:
      "Learn normal behavior of @machine-07 using @Cosmos-Predict from @camera-data and @sensor-data, then detect abnormal states",
  },
  {
    id: "c-7",
    action: "Predict",
    model: { name: "RoboCat-V2", icon: <GoogleLogo size={13} /> },
    secondaryText: "for",
    secondaryModel: { name: "robot-07", icon: <HuggingFaceLogo size={13} /> },
    engine: { name: "camera + force", icon: <Cpu size={13} /> },
    rest: "the consequence of an action using @camera-data and @force-data",
    fullPrompt:
      "Teach @robot-07 with @RoboCat-V2 to predict the consequence of an action using @camera-data and @force-data",
  },
  {
    id: "c-8",
    action: "Simulate",
    model: { name: "Cosmos-World-Model", icon: <NvidiaLogo size={13} /> },
    secondaryText: "for",
    secondaryModel: {
      name: "warehouse-01",
      icon: <HuggingFaceLogo size={13} />,
    },
    engine: { name: "Observations", icon: <Cpu size={13} /> },
    rest: "from historical observations and simulate candidate routing policies",
    fullPrompt:
      "Build a world model of @warehouse-01 using @Cosmos-World-Model from historical observations and simulate candidate routing policies",
  },
  {
    id: "c-9",
    action: "Experiment",
    model: { name: "gpu-07 (H100)", icon: <NvidiaLogo size={13} /> },
    secondaryText: "vs",
    secondaryModel: { name: "network-02", icon: <Cpu size={13} /> },
    rest: "to isolate PCIe bottleneck vs network packet jitter with statistical proof",
    fullPrompt:
      "Find an experiment that distinguishes whether @gpu-07 or @network-02 is causing the latency increase in @cluster-prod",
  },
  {
    id: "c-10",
    action: "Evaluate",
    model: { name: "DeepSeek-R1", icon: <DeepSeekLogo size={13} /> },
    secondaryText: "powering",
    secondaryModel: { name: "agent-01", icon: <HuggingFaceLogo size={13} /> },
    engine: { name: "Kubernetes", icon: <Cpu size={13} /> },
    rest: "to complete @deployment-mission and verify evidence before continuing",
    fullPrompt:
      "Teach @agent-01 powered by @DeepSeek-R1 to complete @deployment-mission and verify every change before claiming success",
  },
  {
    id: "c-11",
    action: "Optimize",
    model: { name: "BGE-M3", icon: <BAAILogo size={13} /> },
    secondaryText: "on",
    engine: { name: "TEI", icon: <TEILogo size={13} /> },
    rest: "with /v1/embeddings batching and recall evaluation",
    fullPrompt:
      "Optimize @BGE-M3 on @TEI for embedding throughput while preserving retrieval quality",
  },
  {
    id: "c-12",
    action: "Optimize",
    model: { name: "Whisper Large V3", icon: <OpenAILogo size={13} /> },
    secondaryText: "+",
    secondaryModel: { name: "Llama 3.2 3B", icon: <MetaLogo size={13} /> },
    engine: { name: "vLLM-Omni", icon: <VLLMLogo size={13} /> },
    rest: "for RTF and streaming latency",
    fullPrompt:
      "Optimize @Whisper-Large-V3 against @Llama-3.2-3B on @vLLM-Omni for RTF and streaming latency",
  },
];

export interface SuggestionItem {
  id: string;
  action: string;
  modelBadge: { icon: React.ReactNode; text: string; iconType: string };
  secondaryText?: string;
  secondaryModelBadge?: {
    icon: React.ReactNode;
    text: string;
    iconType: string;
  };
  engineBadge?: { icon: React.ReactNode; text: string };
  rest: string;
  fullPrompt: string;
  modelId?: string;
  engine?: string;
  domain?: string;
}

export const DEFAULT_SUGGESTIONS: SuggestionItem[] =
  MULTI_DOMAIN_SUGGESTIONS.map((sug) => {
    const getIcon = (type?: string) => {
      switch (type) {
        case "qwen":
          return <QwenLogo size={13} />;
        case "meta":
          return <MetaLogo size={13} />;
        case "baai":
          return <BAAILogo size={13} />;
        case "openai":
          return <OpenAILogo size={13} />;
        case "flux":
          return <FluxLogo size={13} />;
        case "nvidia":
          return <NvidiaLogo size={13} />;
        case "google":
          return <GoogleLogo size={13} />;
        case "deepseek":
          return <DeepSeekLogo size={13} />;
        case "mistral":
          return <MistralLogo size={13} />;
        case "tei":
          return <TEILogo size={13} />;
        default:
          return <HuggingFaceLogo size={13} />;
      }
    };

    const getEngineIcon = (name?: string) => {
      if (!name) return <Cpu size={13} />;
      if (name.includes("vLLM")) return <VLLMLogo size={13} />;
      if (name.includes("SGLang")) return <SGLangLogo size={13} />;
      if (name.includes("TEI")) return <TEILogo size={13} />;
      if (name.includes("Diffusers")) return <DiffusersLogo size={13} />;
      if (name.includes("TensorRT") || name.includes("Dynamo"))
        return <NvidiaLogo size={13} />;
      return <Cpu size={13} />;
    };

    return {
      id: sug.id,
      action: sug.action,
      modelBadge: sug.modelBadge
        ? {
            icon: getIcon(sug.modelBadge.iconType),
            text: sug.modelBadge.text,
            iconType: sug.modelBadge.iconType,
          }
        : {
            icon: <HuggingFaceLogo size={13} />,
            text: sug.entities[0]?.label || "Target",
            iconType: "hf",
          },
      secondaryText: sug.secondaryText,
      secondaryModelBadge: sug.secondaryModelBadge
        ? {
            icon: getIcon(sug.secondaryModelBadge.iconType),
            text: sug.secondaryModelBadge.text,
            iconType: sug.secondaryModelBadge.iconType,
          }
        : undefined,
      engineBadge: sug.engineBadge
        ? {
            icon: getEngineIcon(sug.engineBadge.text),
            text: sug.engineBadge.text,
          }
        : undefined,
      rest: sug.rest,
      fullPrompt: sug.fullPrompt,
      modelId: sug.entities.find((e) => e.type === "model")?.id,
      engine: sug.engineBadge?.text,
      domain: sug.domain,
    };
  });

export function getContextualSuggestions(
  model: HfModelItem,
  secondaryModel: HfModelItem | undefined,
  engine: string | undefined,
  includeEngine: boolean,
): SuggestionItem[] {
  if (secondaryModel) {
    const sec = secondaryModel;
    return [
      {
        id: "cmp-1",
        action: "Compare",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        secondaryText: "against",
        secondaryModelBadge: {
          icon: <ModelBrandIcon model={sec} size={13} />,
          text: sec.name,
          iconType: sec.iconType,
        },
        engineBadge: engine
          ? {
              icon: <EngineBrandIcon engine={engine} size={13} />,
              text: engine,
            }
          : undefined,
        rest: "for cost per request",
        fullPrompt: `Compare ${model.name} against ${sec.name}${engine ? ` on @${engine}` : ""} for cost per request`,
      },
      {
        id: "cmp-2",
        action: "Compare",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        secondaryText: "against",
        secondaryModelBadge: {
          icon: <ModelBrandIcon model={sec} size={13} />,
          text: sec.name,
          iconType: sec.iconType,
        },
        engineBadge: engine
          ? {
              icon: <EngineBrandIcon engine={engine} size={13} />,
              text: engine,
            }
          : undefined,
        rest: "for the same workload",
        fullPrompt: `Compare ${model.name} against ${sec.name}${engine ? ` on @${engine}` : ""} for the same workload`,
      },
      {
        id: "cmp-3",
        action: "Compare",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        secondaryText: "against",
        secondaryModelBadge: {
          icon: <ModelBrandIcon model={sec} size={13} />,
          text: sec.name,
          iconType: sec.iconType,
        },
        engineBadge: engine
          ? {
              icon: <EngineBrandIcon engine={engine} size={13} />,
              text: engine,
            }
          : undefined,
        rest: "for latency and cost",
        fullPrompt: `Compare ${model.name} against ${sec.name}${engine ? ` on @${engine}` : ""} for latency and cost`,
      },
      {
        id: "cmp-4",
        action: "Compare",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        secondaryText: "against",
        secondaryModelBadge: {
          icon: <ModelBrandIcon model={sec} size={13} />,
          text: sec.name,
          iconType: sec.iconType,
        },
        engineBadge: engine
          ? {
              icon: <EngineBrandIcon engine={engine} size={13} />,
              text: engine,
            }
          : undefined,
        rest: "for throughput",
        fullPrompt: `Compare ${model.name} against ${sec.name}${engine ? ` on @${engine}` : ""} for throughput`,
      },
      {
        id: "cmp-5",
        action: "Compare",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        secondaryText: "against",
        secondaryModelBadge: {
          icon: <ModelBrandIcon model={sec} size={13} />,
          text: sec.name,
          iconType: sec.iconType,
        },
        engineBadge: engine
          ? {
              icon: <EngineBrandIcon engine={engine} size={13} />,
              text: engine,
            }
          : undefined,
        rest: "for output quality",
        fullPrompt: `Compare ${model.name} against ${sec.name}${engine ? ` on @${engine}` : ""} for output quality`,
      },
    ];
  }

  if (includeEngine && engine) {
    return [
      {
        id: "opt-e1",
        action: "Optimize",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        engineBadge: {
          icon: <EngineBrandIcon engine={engine} size={13} />,
          text: engine,
        },
        rest: "for the cheapest GPU",
        fullPrompt: `Optimize ${model.name} on @${engine} for the cheapest GPU`,
      },
      {
        id: "opt-e2",
        action: "Optimize",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        engineBadge: {
          icon: <EngineBrandIcon engine={engine} size={13} />,
          text: engine,
        },
        rest: "for lowest latency",
        fullPrompt: `Optimize ${model.name} on @${engine} for lowest latency`,
      },
      {
        id: "opt-e3",
        action: "Optimize",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        engineBadge: {
          icon: <EngineBrandIcon engine={engine} size={13} />,
          text: engine,
        },
        rest: "for highest throughput",
        fullPrompt: `Optimize ${model.name} on @${engine} for highest throughput`,
      },
      {
        id: "opt-e4",
        action: "Optimize",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        engineBadge: {
          icon: <EngineBrandIcon engine={engine} size={13} />,
          text: engine,
        },
        rest: "with quantization and a quality gate",
        fullPrompt: `Optimize ${model.name} on @${engine} with quantization and a quality gate`,
      },
      {
        id: "opt-e5",
        action: "Optimize",
        modelBadge: {
          icon: <ModelBrandIcon model={model} size={13} />,
          text: model.name,
          iconType: model.iconType,
        },
        engineBadge: {
          icon: <EngineBrandIcon engine={engine} size={13} />,
          text: engine,
        },
        rest: "for production latency and cost budgets",
        fullPrompt: `Optimize ${model.name} on @${engine} for production latency and cost budgets`,
      },
    ];
  }

  return [
    {
      id: "opt-1",
      action: "Optimize",
      modelBadge: {
        icon: <ModelBrandIcon model={model} size={13} />,
        text: model.name,
        iconType: model.iconType,
      },
      rest: "for lowest latency with an accuracy check",
      fullPrompt: `Optimize ${model.name} for lowest latency with an accuracy check`,
    },
    {
      id: "opt-2",
      action: "Optimize",
      modelBadge: {
        icon: <ModelBrandIcon model={model} size={13} />,
        text: model.name,
        iconType: model.iconType,
      },
      rest: "for the cheapest GPU that fits its VRAM",
      fullPrompt: `Optimize ${model.name} for the cheapest GPU that fits its VRAM`,
    },
    {
      id: "opt-3",
      action: "Optimize",
      modelBadge: {
        icon: <ModelBrandIcon model={model} size={13} />,
        text: model.name,
        iconType: model.iconType,
      },
      rest: "for highest throughput under batch load",
      fullPrompt: `Optimize ${model.name} for highest throughput under batch load`,
    },
    {
      id: "opt-4",
      action: "Optimize",
      modelBadge: {
        icon: <ModelBrandIcon model={model} size={13} />,
        text: model.name,
        iconType: model.iconType,
      },
      rest: "with quantization and a quality gate",
      fullPrompt: `Optimize ${model.name} with quantization and a quality gate`,
    },
    {
      id: "opt-5",
      action: "Optimize",
      modelBadge: {
        icon: <ModelBrandIcon model={model} size={13} />,
        text: model.name,
        iconType: model.iconType,
      },
      rest: "for production latency and cost budgets",
      fullPrompt: `Optimize ${model.name} for production latency and cost budgets`,
    },
  ];
}

export type FlyoutTab =
  "models" | "engine" | "gpu" | "runs_on" | "output_format";

export interface TokenPromptInputProps {
  hideHeader?: boolean;
  showSuggestions?: boolean;
  fixedPromptIndex?: number;
  onSubmit?: (prompt: string, metadata?: Record<string, unknown>) => void;
  onLaunchPrompt?: (params: {
    prompt: string;
    model: string;
    engine: string;
    gpu: string;
    runsOn: string;
    outputFormat: string;
    mode: BlueprintMissionMode;
    missionGraph?: MissionGraph;
  }) => void;
  initialPrompt?: string;
  availableModels?: ModelEntity[];
  dark?: boolean;
  className?: string;
  cardClassName?: string;
}

export function TokenPromptInput({
  onSubmit,
  onLaunchPrompt,
  initialPrompt = "",
  dark = true,
  className,
  cardClassName,
  showSuggestions = true,
  hideHeader = false,
}: TokenPromptInputProps) {
  // Professional Token Composer State
  const [promptEdited, setPromptEdited] = useState(false);
  const [actionText, setActionText] = useState("Optimize");
  const [selectedModels, setSelectedModels] = useState<HfModelItem[]>([
    POPULAR_HF_MODELS[0],
  ]);
  const [includeEngineInPrompt, setIncludeEngineInPrompt] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<string>("vLLM");
  const [customPromptText, setCustomPromptText] = useState(
    "for cheapest GPU with latency and VRAM checks",
  );
  const [canonicalSegments, setCanonicalSegments] = useState<
    ComposerSegment[] | null
  >(null);

  // Bottom tool rail state
  const [selectedGpu, setSelectedGpu] = useState<string>("Auto");
  const [selectedRunsOn, setSelectedRunsOn] = useState<string>("Managed cloud");
  const [selectedOutputFormat, setSelectedOutputFormat] =
    useState<string>("Managed endpoint");
  const [selectedMode, setSelectedMode] =
    useState<BlueprintMissionMode>("Optimize");

  // Autocomplete / Flyout state
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [activeFlyoutTab, setActiveFlyoutTab] = useState<FlyoutTab>("models");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [hfSearchQuery, setHfSearchQuery] = useState("");
  const [hfModels, setHfModels] = useState<HfModelItem[]>([]);
  const [hfSearchLoading, setHfSearchLoading] = useState(false);
  const [hfSearchError, setHfSearchError] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cyclingIndex, setCyclingIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // (+) Attachment dropdown and multi-modal state inside composer
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{
    type:
      | "image"
      | "video"
      | "audio"
      | "doc"
      | "data"
      | "code"
      | "logs"
      | "k8s"
      | "sensor"
      | "datacenter";
    name: string;
  } | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<SegmentedInlineComposerHandle>(null);

  // Cycling animated prompts when idle with GSAP token transition
  useEffect(() => {
    if (promptEdited) return;
    const cycleTimer = window.setInterval(() => {
      setCyclingIndex((current) => (current + 1) % CYCLING_PROMPTS.length);
      composerRef.current?.animateTokensIn();
    }, 4500);
    return () => window.clearInterval(cycleTimer);
  }, [cyclingIndex, promptEdited]);

  // Close flyout on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFlyoutOpen(false);
        setModeDropdownOpen(false);
        setAttachMenuOpen(false);
        setIsFocused(false);
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
        const wsId = await resolveActiveHorosWorkspaceId();
        if (!wsId) return;
        const results = await searchHorosHuggingFaceModels(wsId, query);
        if (cancelled) return;
        setHfModels(
          results.map((r) => {
            const repositoryId = r.repositoryId;
            const repositoryKey = repositoryId
              .toLowerCase()
              .replace(/\s+/g, "");
            const isOfficialMiniMax = [
              "minimaxai/minimax-h3",
              "minimaxai/minimax-m2.7",
              "minimaxai/minimax-m2.5",
            ].includes(repositoryKey);
            const isOfficialInclusionAI =
              repositoryKey.startsWith("inclusionai/");
            const isOfficialXiaomi = repositoryKey.startsWith("xiaomimimo/");
            const isOfficialPoolside = repositoryKey.startsWith("poolside/");
            const isOfficialUpstage = repositoryKey.startsWith("upstage/");
            const isGoogle =
              repositoryKey.includes("google") ||
              repositoryKey.includes("gemma");
            return {
              id: r.repositoryId,
              name: r.repositoryId.split("/").pop() ?? r.repositoryId,
              org: `${r.author ?? r.repositoryId.split("/")[0] ?? "Hugging Face"}, ${r.task ?? r.library ?? "model"}`,
              task: r.task ?? r.library ?? "model",
              downloads:
                r.downloads >= 1_000_000
                  ? `${(r.downloads / 1_000_000).toFixed(1)}M`
                  : String(r.downloads),
              likes: String(r.likes),
              iconType: isOfficialMiniMax
                ? "minimax"
                : isOfficialInclusionAI
                  ? "inclusionai"
                  : isOfficialXiaomi
                    ? "xiaomi"
                    : isOfficialPoolside
                      ? "poolside"
                      : isOfficialUpstage
                        ? "upstage"
                        : isGoogle
                          ? "google"
                          : "hf",
              repositoryId,
              metadata: {
                provider:
                  r.author ?? repositoryId.split("/")[0] ?? "Hugging Face",
                task: r.task ?? r.library ?? "model",
              },
            };
          }),
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

  const compiledPrompt = useMemo(() => {
    if (!promptEdited) return CYCLING_PROMPTS[cyclingIndex].fullPrompt;
    if (canonicalSegments)
      return canonicalSegments
        .map((segment) =>
          segment.type === "text" ? segment.value : segment.label,
        )
        .join("")
        .trim();
    const modelNames = selectedModels.map((m) => m.name).join(" + ");
    return `${actionText} ${modelNames}${includeEngineInPrompt ? ` on @${selectedEngine}` : ""} ${customPromptText}`.trim();
  }, [
    promptEdited,
    cyclingIndex,
    actionText,
    selectedModels,
    includeEngineInPrompt,
    selectedEngine,
    customPromptText,
    canonicalSegments,
  ]);

  const composerSegments = useMemo<ComposerSegment[]>(() => {
    if (!promptEdited) {
      const cur = CYCLING_PROMPTS[cyclingIndex] || CYCLING_PROMPTS[0];
      const segments: ComposerSegment[] = [
        { type: "text", value: `${cur.action} ` },
      ];
      segments.push({
        type: "model",
        id: cur.model.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        label: cur.model.name,
      });
      if (cur.secondaryModel) {
        segments.push({
          type: "text",
          value: ` ${cur.secondaryText || "against"} `,
        });
        segments.push({
          type: "model",
          id: cur.secondaryModel.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          label: cur.secondaryModel.name,
        });
      }
      if (cur.engine) {
        segments.push({
          type: "text",
          value: ` ${cur.secondaryText === "on" ? "on" : "on"} `,
        });
        segments.push({
          type: "runtime",
          id: cur.engine.name as string,
          label: cur.engine.name as string,
        });
      }
      if (cur.rest) {
        segments.push({ type: "text", value: ` ${cur.rest}` });
      }
      return segments;
    }

    const segments: ComposerSegment[] = [
      { type: "text", value: `${actionText} ` },
    ];
    selectedModels.forEach((model, index) => {
      segments.push({
        type: "model",
        id: model.repositoryId ?? model.id,
        label: model.name,
        metadata: {
          repositoryId: model.repositoryId ?? model.id,
          revision: model.revision ?? null,
          commitSha: model.commitSha ?? null,
          artifactDigest: model.artifactDigest ?? null,
          provider: model.org.split(",")[0],
          task: model.task,
          iconType: model.iconType,
          ...(model.metadata ?? {}),
        },
      });
      if (index < selectedModels.length - 1)
        segments.push({ type: "text", value: " against " });
    });
    if (includeEngineInPrompt) {
      segments.push({ type: "text", value: " on " });
      segments.push({
        type: "runtime",
        id: selectedEngine,
        label: selectedEngine,
      });
    }
    if (customPromptText.trim())
      segments.push({ type: "text", value: ` ${customPromptText.trim()}` });
    return segments;
  }, [
    promptEdited,
    cyclingIndex,
    actionText,
    selectedModels,
    includeEngineInPrompt,
    selectedEngine,
    customPromptText,
  ]);

  const displayedComposerSegments = canonicalSegments ?? composerSegments;

  const handleSubmit = () => {
    const finalPrompt = compiledPrompt;
    const compiled = compileIntent(finalPrompt, {
      selectedEngine,
      selectedGpu,
      selectedRunsOn,
      selectedOutputFormat,
      selectedMode,
    });

    const missionGraph: MissionGraph = {
      id: compiled.id,
      intent: compiled.intent,
      actionButtonLabel: compiled.actionButtonLabel || actionText,
      objective: finalPrompt,
      models: selectedModels,
      runtime: selectedEngine,
      compute: selectedGpu,
      infrastructure: selectedRunsOn,
      outputFormat: selectedOutputFormat,
      constraints: compiled.outcomeContract.hardConstraints,
      mode: selectedMode,
      rawInput: finalPrompt,
      segments: displayedComposerSegments,
      resolvedEntities: [
        ...compiled.resolvedEntities.map((e) => ({
          type: e.type,
          id: e.id,
          label: e.label,
          metadata: e.metadata,
        })),
        ...displayedComposerSegments
          .filter(
            (segment): segment is Exclude<ComposerSegment, { type: "text" }> =>
              segment.type !== "text",
          )
          .map((segment) => ({
            type: segment.type,
            id: segment.id,
            label: segment.label,
            ...(segment.metadata ? { metadata: segment.metadata } : {}),
          })),
      ],
      domain: compiled.domain,
      executionDomain: compiled.executionDomain,
      outcomeContract: compiled.outcomeContract as unknown as Record<
        string,
        unknown
      >,
      unknowns: compiled.unknowns,
      hypotheses: compiled.hypotheses,
      candidateSystems: compiled.candidateSystems,
      discoveryRequirements: compiled.discoveryRequirements,
    };

    if (onLaunchPrompt) {
      onLaunchPrompt({
        prompt: finalPrompt,
        model: selectedModels[0]?.id || POPULAR_HF_MODELS[0].id,
        engine: selectedEngine,
        gpu: selectedGpu,
        runsOn: selectedRunsOn,
        outputFormat: selectedOutputFormat,
        mode: selectedMode,
        missionGraph,
      });
    } else if (onSubmit) {
      onSubmit(finalPrompt, {
        model: selectedModels[0]?.id || POPULAR_HF_MODELS[0].id,
        engine: selectedEngine,
        gpu: selectedGpu,
        runsOn: selectedRunsOn,
        outputFormat: selectedOutputFormat,
        mode: selectedMode,
        missionGraph,
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
    setCanonicalSegments(null);
    setPromptEdited(true);
    setActionText(sug.action);
    setCustomPromptText(sug.rest);
    if (sug.engine) {
      setSelectedEngine(sug.engine);
      setIncludeEngineInPrompt(true);
    } else {
      setIncludeEngineInPrompt(false);
    }
    if (sug.modelId) {
      const matched = POPULAR_HF_MODELS.find((m) => m.id === sug.modelId) || {
        id: sug.modelId,
        name: sug.modelBadge.text,
        org: sug.modelId.split("/")[0] || "model",
        task: "inference",
        downloads: "10M+",
        likes: "1K+",
        iconType: (sug.modelBadge.iconType as HfModelItem["iconType"]) || "hf",
      };
      if (sug.secondaryModelBadge) {
        const secMatch =
          POPULAR_HF_MODELS.find(
            (m) => m.name === sug.secondaryModelBadge?.text,
          ) || POPULAR_HF_MODELS[1];
        setSelectedModels([matched, secMatch]);
      } else {
        setSelectedModels([matched]);
      }
    }
    // Trigger GSAP pulse and token entrance animation
    if (containerRef.current) {
      const card = containerRef.current.querySelector(".main-input-card");
      if (card) {
        gsap.fromTo(
          card,
          { borderColor: "#75bf00", scale: 0.995 },
          {
            borderColor: "",
            scale: 1,
            duration: 0.45,
            ease: "power2.out",
            clearProps: "borderColor,scale",
          },
        );
      }
    }
    composerRef.current?.animateTokensIn();
  };

  const handleAddModel = (m: HfModelItem) => {
    if (composerRef.current) {
      composerRef.current.insertModelAtCaret(m);
      setFlyoutOpen(false);
      return;
    }
    setCanonicalSegments(null);
    setPromptEdited(true);
    if (selectedModels.length === 0) {
      setSelectedModels([m]);
      setActionText("Optimize");
      return;
    }
    if (selectedModels.some((existing) => existing.id === m.id)) {
      return;
    }
    setSelectedModels((prev) => [...prev, m]);
    if (selectedModels.length >= 1) setActionText("Compare");
  };

  const handleRemoveModel = (id: string) => {
    setCanonicalSegments(null);
    setPromptEdited(true);
    const next = selectedModels.filter((m) => m.id !== id);
    setSelectedModels(next);
    if (next.length <= 1) {
      setActionText("Optimize");
    }
  };

  const handlePromptTextChange = (value: string, caret: number) => {
    setPromptEdited(true);
    setCustomPromptText(value);
    const beforeCaret = value.slice(0, caret);
    const mention = beforeCaret.match(/(?:^|\s)@([^\s@]*)$/);
    if (mention) {
      setMentionQuery(mention[1]);
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  };

  const insertMentionModel = (model: HfModelItem) => {
    const value = customPromptText;
    const caret = inputRef.current?.selectionStart ?? value.length;
    const beforeCaret = value.slice(0, caret);
    const match = beforeCaret.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) return;
    const start = caret - match[1].length - 1;
    const nextValue = `${value.slice(0, start)}${value.slice(caret)}`
      .replace(/\s{2,}/g, " ")
      .trimStart();
    setCustomPromptText(nextValue);
    setSelectedModels([model]);
    setActionText("Optimize");
    setIncludeEngineInPrompt(true);
    setMentionOpen(false);
    setMentionQuery("");
    requestAnimationFrame(() => {
      const nextCaret = start;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const currentCycling = CYCLING_PROMPTS[cyclingIndex];
  const activeSuggestions = promptEdited
    ? getContextualSuggestions(
        selectedModels[0] || POPULAR_HF_MODELS[0],
        selectedModels[1],
        selectedEngine,
        includeEngineInPrompt,
      )
    : DEFAULT_SUGGESTIONS;

  const handleCanonicalSegmentsChange = (nextSegments: ComposerSegment[]) => {
    setCanonicalSegments(nextSegments);
    setPromptEdited(true);
    const nextModels = nextSegments
      .filter((segment) => segment.type === "model")
      .map((segment) => {
        const modelSegment = segment as {
          type: "model";
          id: string;
          label: string;
          metadata?: Record<string, unknown>;
        };
        const existing = [...POPULAR_HF_MODELS, ...hfModels].find(
          (model) =>
            (model.repositoryId ?? model.id) === modelSegment.id ||
            model.name === modelSegment.label,
        );
        return (
          existing ?? {
            id: modelSegment.id,
            name: modelSegment.label,
            org: String(modelSegment.metadata?.provider ?? "model"),
            task: String(modelSegment.metadata?.task ?? "unknown"),
            downloads: "",
            likes: "",
            iconType: "hf" as const,
            repositoryId: modelSegment.id,
            metadata: modelSegment.metadata,
          }
        );
      });
    setSelectedModels(nextModels);
    const runtime = nextSegments.find((segment) => segment.type === "runtime");
    if (runtime) setSelectedEngine((runtime as { label: string }).label);
    setCustomPromptText(
      nextSegments
        .filter((segment) => segment.type === "text")
        .map((segment) => segment.value)
        .join("")
        .replace(/^\s*\w+\s*/, "")
        .trim(),
    );
  };

  return (
    <div ref={containerRef} className={cn("w-full space-y-4", className)}>
      {/* Hero Title & Subtitle: Canonical Blueprint Format */}
      {!hideHeader && (
        <div className="text-left">
          <h1
            className={cn(
              "text-2xl font-medium tracking-[-0.03em] sm:text-3xl",
              dark ? "text-[#F0EFE2]" : "text-[#171a17]",
            )}
          >
            What should{" "}
            <span className="bg-[#75bf00] px-2 py-0.5 font-medium text-black inline-block rounded-xs">
              become true?
            </span>
          </h1>
          <p
            className={cn(
              "mt-2 text-xs md:text-sm",
              dark ? "text-[#90988c]" : "text-[#555d50]",
            )}
          >
            Models, software, data centers, and physical reality. From intent to
            verified intelligence in minutes.
          </p>
        </div>
      )}

      {/* Main Interactive Prompt Card (Green border ONLY when focused/typing or flyout open) */}
      <div ref={containerRef} className="relative max-w-[840px]">
        <div
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
            }
          }}
          className={cn(
            "main-input-card relative border p-4 transition-all rounded-xs",
            isFocused || flyoutOpen || modeDropdownOpen || attachMenuOpen
              ? "border-[#75bf00] bg-[#141414]"
              : dark
                ? "border-[#282828] bg-[#141414] hover:border-[#383838]"
                : "border-[#d8ddd3] bg-white hover:border-[#b0b8aa]",
            cardClassName
          )}
        >
          {/* Prompt Input Area: Exactly ONE unified row with live badges and inline typing (No duplicate row below!) */}
          <div
            className="relative min-h-[44px] flex flex-wrap items-center gap-1.5 cursor-text text-xs md:text-sm font-sans"
            onClick={() => {
              setIsFocused(true);
              if (!promptEdited) {
                setPromptEdited(true);
                const matched =
                  POPULAR_HF_MODELS.find(
                    (m) => m.name === currentCycling.model.name,
                  ) || POPULAR_HF_MODELS[0];
                setSelectedModels([matched]);
                if (currentCycling.engine) {
                  setSelectedEngine(currentCycling.engine.name as string);
                }
                setCustomPromptText(currentCycling.rest);
              }
              inputRef.current?.focus();
            }}
          >
            <SegmentedInlineComposer
              ref={composerRef}
              segments={displayedComposerSegments}
              suggestions={hfModels.length > 0 ? hfModels : POPULAR_HF_MODELS}
              dark={dark}
              onChange={handleCanonicalSegmentsChange}
              onSubmit={handleSubmit}
            />
            {mentionOpen && (
              <div
                className={cn(
                  "absolute left-0 top-full z-50 mt-1 w-72 border p-1.5 shadow-2xl rounded-xs",
                  dark
                    ? "border-[#333] bg-[#181818] text-[#F0EFE2]"
                    : "border-[#c9cec4] bg-white text-[#171a17]",
                )}
              >
                {(hfModels.length > 0 ? hfModels : POPULAR_HF_MODELS)
                  .filter(
                    (model) =>
                      model.name
                        .toLowerCase()
                        .includes(mentionQuery.toLowerCase()) ||
                      model.id
                        .toLowerCase()
                        .includes(mentionQuery.toLowerCase()),
                  )
                  .slice(0, 8)
                  .map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertMentionModel(model)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-xs rounded-xs",
                        dark ? "hover:bg-[#282828]" : "hover:bg-[#f0f4ee]",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5 truncate">
                        <ModelBrandIcon model={model} size={13} />
                        <span className="truncate">{model.name}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-[#788274]">
                        {model.org.split(",")[0]}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Model Feasibility Validation Card matching Reference Screenshot */}
          {(customPromptText.toLowerCase().includes("qwen3.6") ||
            customPromptText.toLowerCase().includes("nvfp4") ||
            customPromptText.toLowerCase().includes("unsupported")) && (
            <div
              className={cn(
                "mt-3 p-3.5 border border-dashed text-xs rounded-xs space-y-1.5 font-sans animate-in fade-in duration-150",
                dark
                  ? "border-[#483818] bg-[#1a160d] text-[#e0cfb0]"
                  : "border-[#e0c080] bg-[#fffbf0] text-[#554010]",
              )}
            >
              <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#e6b800]">
                <span className="h-2 w-2 rounded-full bg-[#e6b800] animate-pulse" />
                <span>NOT YET SUPPORTED</span>
              </div>
              <p
                className={cn(
                  "text-xs leading-relaxed font-sans",
                  dark ? "text-[#c8b898]" : "text-[#665020]",
                )}
              >
                Authoritative model metadata cannot size this model for
                optimization.
              </p>
              <p
                className={cn(
                  "text-[11px] font-mono",
                  dark ? "text-[#C8C7BA]" : "text-[#777]",
                )}
              >
                No charge will be created.
              </p>
              <div
                className={cn(
                  "pt-2 border-t border-dashed text-[11px] leading-relaxed",
                  dark
                    ? "border-[#382b14] text-[#a09070]"
                    : "border-[#e0d0b0] text-[#776030]",
                )}
              >
                <span className="font-semibold text-[#F0EFE2]">
                  Supported families:
                </span>{" "}
                text generation, speech recognition, text to speech, embeddings,
                audio language, image generation, video generation, voice
                pipelines, reranking, classification.
              </div>
            </div>
          )}

          {/* Bottom Tool Rail (Synchronized with natural language intent and dropdowns) */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#222222] pt-3 relative z-30">
            {/* Left Controls - Scrollable without scrollbar so it never collides with right buttons */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
              {/* (+) Attachment & Modality Dropdown Button */}
              <div className="relative shrink-0 z-50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachMenuOpen(!attachMenuOpen);
                    setModeDropdownOpen(false);
                    setFlyoutOpen(false);
                  }}
                  className={cn(
                    "flex h-6.5 w-6.5 items-center justify-center border transition-all rounded-xs font-mono shrink-0 cursor-pointer",
                    attachMenuOpen
                      ? "border-[#75bf00] bg-[#222222] text-[#75bf00]"
                      : dark
                        ? "border-[#383838] bg-[#1a1a1a] text-[#C8C7BA] hover:border-[#75bf00] hover:text-[#F0EFE2]"
                        : "border-[#d8ddd3] bg-white text-[#555] hover:border-[#75bf00] hover:text-black",
                  )}
                  title="Add Input Modality / Connect Reality Source"
                >
                  <Plus
                    size={13}
                    className={
                      attachMenuOpen
                        ? "rotate-45 transition-transform duration-150"
                        : "transition-transform duration-150"
                    }
                  />
                </button>

                {/* (+) Dropdown Menu (Dashed Product Motif & Canonical Modality Surface) */}
                {attachMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute left-0 bottom-full mb-2 w-72 border border-dashed shadow-2xl rounded-xs z-[200] animate-in fade-in zoom-in-95 duration-100 overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-dashed",
                      dark
                        ? "border-[#2e2e2e] bg-[#181818] text-[#F0EFE2] divide-[#282828]"
                        : "border-[#d8ddd3] bg-white text-[#171a17] divide-[#edf0eb]",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] font-semibold flex items-center justify-between sticky top-0 z-10",
                        dark
                          ? "bg-[#141414] text-[#788274]"
                          : "bg-[#fafbfa] text-[#6b7367]",
                      )}
                    >
                      <span>ADD INPUT MODALITY & REALITY</span>
                      <button
                        type="button"
                        onClick={() => setAttachMenuOpen(false)}
                        className="hover:text-[#F0EFE2] cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="p-1 space-y-0.5 text-xs font-sans">
                      {/* Section 1: Media & Files */}
                      <div className="text-[9px] font-mono text-[#75bf00] px-2 pt-1 pb-0.5 uppercase tracking-wider font-bold">
                        Media & Files
                      </div>

                      {/* 1. Voice Intent */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachMenuOpen(false);
                          setIsRecordingVoice(true);
                          setTimeout(() => {
                            setIsRecordingVoice(false);
                            setPromptEdited(true);
                            setCustomPromptText(
                              "Reduce inference cost on @Qwen/Qwen3-32B by 30% without latency regression",
                            );
                            setAttachedMedia({
                              type: "audio",
                              name: "voice_intent_01.wav",
                            });
                          }, 2500);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <Mic
                            size={11}
                            className={
                              isRecordingVoice
                                ? "text-red-400 animate-spin"
                                : "text-[#75bf00]"
                            }
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Voice Intent
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Dictate spoken prompt or audio
                          </div>
                        </div>
                      </button>

                      {/* 2. Upload Diagram */}
                      <label
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <ImageIcon size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Upload Diagram / Screenshot
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Architecture diagram, PNG or JPEG
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachedMedia({
                                type: "image",
                                name: file.name,
                              });
                              setPromptEdited(true);
                              setAttachMenuOpen(false);
                            }
                          }}
                        />
                      </label>

                      {/* 3. Video / Camera Feed */}
                      <label
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <VideoIcon size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Video / Camera Stream
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Screen recording or vehicle camera
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachedMedia({
                                type: "video",
                                name: file.name,
                              });
                              setPromptEdited(true);
                              setAttachMenuOpen(false);
                            }
                          }}
                        />
                      </label>

                      {/* 4. Document / Spec */}
                      <label
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <FileText size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Document / Spec PDF
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Architecture spec, PRD, or PDF
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.md,.txt"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachedMedia({
                                type: "doc",
                                name: file.name,
                              });
                              setPromptEdited(true);
                              setAttachMenuOpen(false);
                            }
                          }}
                        />
                      </label>

                      {/* 5. Tabular / Datasets */}
                      <label
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <Table size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Tabular / Dataset
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            CSV, Parquet, or JSON benchmark
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".csv,.parquet,.json,.jsonl"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachedMedia({
                                type: "data",
                                name: file.name,
                              });
                              setPromptEdited(true);
                              setAttachMenuOpen(false);
                            }
                          }}
                        />
                      </label>

                      {/* Section 2: Code & Infrastructure */}
                      <div className="text-[9px] font-mono text-[#75bf00] px-2 pt-2 pb-0.5 uppercase tracking-wider font-bold border-t border-dashed border-[#282828] mt-1">
                        Code & Infrastructure
                      </div>

                      {/* 6. Repository / Code */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachMenuOpen(false);
                          setAttachedMedia({
                            type: "code",
                            name: "repo: main-service@v2.4",
                          });
                          setPromptEdited(true);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <Code size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Repository / Code Diff
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Git repository link or code diff
                          </div>
                        </div>
                      </button>

                      {/* 7. Logs & Traces */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachMenuOpen(false);
                          setAttachedMedia({
                            type: "logs",
                            name: "otel_trace_98a72.json",
                          });
                          setPromptEdited(true);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <Activity size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Logs & OpenTelemetry
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Server logs, stack traces, OTel
                          </div>
                        </div>
                      </button>

                      {/* 8. Cloud & K8s State */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachMenuOpen(false);
                          setAttachedMedia({
                            type: "k8s",
                            name: "k8s-cluster: prod-us-east-1",
                          });
                          setPromptEdited(true);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <Cloud size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Cloud & K8s Cluster State
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Kubernetes state, AWS/GCP config
                          </div>
                        </div>
                      </button>

                      {/* Section 3: Physical & Data Center Reality */}
                      <div className="text-[9px] font-mono text-[#75bf00] px-2 pt-2 pb-0.5 uppercase tracking-wider font-bold border-t border-dashed border-[#282828] mt-1">
                        Physical & Data Center Reality
                      </div>

                      {/* 9. Physical Sensors / Robotics */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachMenuOpen(false);
                          setAttachedMedia({
                            type: "sensor",
                            name: "sensor_telemetry: vehicle_07",
                          });
                          setPromptEdited(true);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <Radio size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Physical Sensor / Robotics
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            LiDAR, IMU, vehicle, PLC sensors
                          </div>
                        </div>
                      </button>

                      {/* 10. Data Center Telemetry */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachMenuOpen(false);
                          setAttachedMedia({
                            type: "datacenter",
                            name: "datacenter_telemetry: rack_14_power",
                          });
                          setPromptEdited(true);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs transition-colors text-left cursor-pointer group",
                          dark
                            ? "hover:bg-[#222] text-[#d1d5db]"
                            : "hover:bg-[#f2f5f0] text-[#374151]",
                        )}
                      >
                        <div className="flex h-5.5 w-5.5 items-center justify-center rounded-xs border border-dashed border-[#333] bg-[#1e1e1e] group-hover:border-[#75bf00] transition-colors shrink-0">
                          <Cpu size={11} className="text-[#75bf00]" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                            Data Center Power & Cooling
                          </div>
                          <div className="text-[10px] text-[#788274]">
                            Power MW, liquid cooling, thermals
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Attached Media Pill inside composer rail if present */}
              {attachedMedia && (
                <div className="flex items-center gap-1.5 border border-dashed border-[#75bf00]/50 bg-[#75bf00]/10 text-[#75bf00] px-2 py-0.5 rounded-xs text-[11px] shrink-0">
                  <span className="truncate max-w-[120px]">
                    📎 {attachedMedia.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedMedia(null)}
                    className="text-[#75bf00] hover:text-[#F0EFE2] transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {/* ALWAYS RENDER RESOLVED DIMENSION PILLS MATCHING IMAGE 1 */}
              <button
                type="button"
                onClick={() => handleOpenFlyout("models")}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs font-sans shrink-0 whitespace-nowrap cursor-pointer",
                  activeFlyoutTab === "models" && flyoutOpen
                    ? "border-[#75bf00] bg-[#222222] text-[#F0EFE2]"
                    : dark
                      ? "border-[#383838] bg-[#1a1a1a] text-[#d1d5db] hover:border-[#555]"
                      : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#171a17]",
                )}
              >
                <ModelBrandIcon model={selectedModels[0]} size={13} />
                <span>
                  {selectedModels[0]?.name || "Select Model"}
                  {selectedModels.length > 1
                    ? ` vs ${selectedModels[1]?.name}`
                    : ""}
                </span>
                <ChevronDown size={11} className="text-[#788274]" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenFlyout("output_format")}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs font-sans shrink-0 whitespace-nowrap cursor-pointer",
                  activeFlyoutTab === "output_format" && flyoutOpen
                    ? "border-[#75bf00] bg-[#222222] text-[#F0EFE2]"
                    : dark
                      ? "border-[#383838] bg-[#1a1a1a] text-[#d1d5db] hover:border-[#555]"
                      : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#171a17]",
                )}
              >
                <Cloud size={12} className="text-[#C8C7BA]" />
                <span>
                  {selectedOutputFormat.length > 15
                    ? `${selectedOutputFormat.slice(0, 14)}...`
                    : selectedOutputFormat}
                </span>
                <ChevronDown size={11} className="text-[#788274]" />
              </button>

              {/* Grouped Runtime + Cloud + Compute Box */}
              <div
                className={cn(
                  "hidden sm:flex items-center gap-2.5 border px-2.5 py-1 text-xs rounded-xs font-sans shrink-0 whitespace-nowrap",
                  dark
                    ? "border-[#383838] bg-[#1a1a1a] text-[#d1d5db]"
                    : "border-[#d8ddd3] bg-white text-[#2a3028]",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleOpenFlyout("engine")}
                  className="flex items-center gap-1.5 hover:text-[#F0EFE2] transition-colors cursor-pointer"
                >
                  <EngineBrandIcon engine={selectedEngine} size={12} />
                  <span>{selectedEngine}</span>
                  <ChevronDown size={10} className="text-[#788274]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenFlyout("runs_on")}
                  className="flex items-center gap-1.5 hover:text-[#F0EFE2] transition-colors cursor-pointer"
                >
                  <Cloud size={12} className="text-[#C8C7BA]" />
                  <span>{selectedRunsOn}</span>
                  <ChevronDown size={10} className="text-[#788274]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenFlyout("gpu")}
                  className="flex items-center gap-1 text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors text-[11px] font-mono cursor-pointer"
                >
                  <NvidiaLogo size={11} className="text-[#76b900]" />
                  <span>{selectedGpu}</span>
                </button>
              </div>
            </div>

            {/* Right Controls: Adaptive Mode Switcher + Bright Green Launch Button */}
            <div className="flex items-center gap-1.5 shrink-0 relative z-50 ml-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModeDropdownOpen(!modeDropdownOpen);
                    setFlyoutOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs font-mono shrink-0 whitespace-nowrap cursor-pointer",
                    modeDropdownOpen
                      ? "border-[#75bf00] bg-[#222222] text-[#F0EFE2]"
                      : dark
                        ? "border-[#383838] bg-[#1a1a1a] text-[#d1d5db] hover:border-[#555]"
                        : "border-[#d8ddd3] bg-white text-[#2a3028] hover:border-[#171a17]",
                  )}
                >
                  {(() => {
                    const actionLower = (
                      actionText ||
                      selectedMode ||
                      "optimize"
                    ).toLowerCase();
                    if (actionLower.includes("compare"))
                      return <Layers size={12} className="text-[#75bf00]" />;
                    if (actionLower.includes("diagnose"))
                      return <Activity size={12} className="text-[#e6b800]" />;
                    if (actionLower.includes("teach"))
                      return (
                        <GraduationCap size={12} className="text-[#75bf00]" />
                      );
                    if (actionLower.includes("decode"))
                      return <Compass size={12} className="text-[#75bf00]" />;
                    if (actionLower.includes("predict"))
                      return (
                        <TrendingUp size={12} className="text-[#75bf00]" />
                      );
                    if (actionLower.includes("simulate"))
                      return <Boxes size={12} className="text-[#75bf00]" />;
                    if (
                      actionLower.includes("experiment") ||
                      actionLower.includes("monitor")
                    )
                      return <FlaskConical size={12} className="text-[#C8C7BA]" />;
                    if (
                      actionLower.includes("discover") ||
                      actionLower.includes("auto")
                    )
                      return <Sparkles size={12} className="text-[#75bf00]" />;
                    return <Gauge size={12} className="text-[#75bf00]" />;
                  })()}
                  <span>{actionText || selectedMode}</span>
                  {modeDropdownOpen ? (
                    <ChevronUp size={11} className="text-[#788274]" />
                  ) : (
                    <ChevronDown size={11} className="text-[#788274]" />
                  )}
                </button>

                {/* Mode Dropdown Popover (Dashed borders with product aesthetic) */}
                {modeDropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute right-0 top-full mt-2 w-84 max-h-[420px] overflow-y-auto border border-dashed shadow-2xl rounded-xs z-[100] animate-in fade-in zoom-in-95 duration-100",
                      dark
                        ? "border-[#2e2e2e] bg-[#181818] text-[#F0EFE2] divide-y divide-dashed divide-[#282828]"
                        : "border-[#d8ddd3] bg-white text-[#171a17] divide-y divide-dashed divide-[#edf0eb]",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3.5 py-2 text-[10px] font-mono uppercase tracking-[0.14em] font-semibold border-b border-dashed",
                        dark
                          ? "border-[#282828] bg-[#141414] text-[#788274]"
                          : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]",
                      )}
                    >
                      MISSION EXECUTION INTENT
                    </div>
                    {BLUEPRINT_MISSION_MODES.map((mode) => {
                      const isSelected =
                        selectedMode.toLowerCase() === mode.id.toLowerCase() ||
                        actionText.toLowerCase() ===
                          mode.actionText.toLowerCase();
                      return (
                        <div
                          key={mode.id}
                          onClick={() => {
                            setSelectedMode(mode.name);
                            setActionText(mode.actionText);
                            setPromptEdited(true);
                            setModeDropdownOpen(false);
                          }}
                          className={cn(
                            "group flex items-start gap-3 p-3 cursor-pointer transition-colors text-left",
                            isSelected
                              ? dark
                                ? "bg-[#222222]"
                                : "bg-[#f0f4ee]"
                              : dark
                                ? "hover:bg-[#202020]"
                                : "hover:bg-[#f8faf7]",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center border border-dashed text-xs transition-colors rounded-xs shrink-0 mt-0.5",
                              isSelected
                                ? "border-[#75bf00] bg-[#75bf00]/10 text-[#75bf00]"
                                : dark
                                  ? "border-[#303030] bg-[#1a1a1a] text-[#889284] group-hover:border-[#75bf00] group-hover:text-[#75bf00]"
                                  : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063] group-hover:border-[#75bf00] group-hover:text-[#2d5800]",
                            )}
                          >
                            {mode.icon({ size: 14 })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "font-semibold text-xs transition-colors",
                                    isSelected
                                      ? "text-[#75bf00]"
                                      : dark
                                        ? "text-[#F0EFE2] group-hover:text-[#75bf00]"
                                        : "text-[#171a17] group-hover:text-[#2d5800]",
                                  )}
                                >
                                  {mode.name}
                                </span>
                                {mode.badge && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs border border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]">
                                    {mode.badge}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <Check
                                  size={14}
                                  className="text-[#75bf00] shrink-0"
                                />
                              )}
                            </div>
                            <p className="text-[11px] font-sans text-[#788274] mt-0.5 leading-relaxed group-hover:text-[#a0a89c] transition-colors">
                              {mode.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Launch Action Button (Bright Green when active) */}
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  "flex h-7 w-7 items-center justify-center transition-all rounded-xs border shrink-0 cursor-pointer active:scale-95 shadow-sm",
                  promptEdited
                    ? "border-[#75bf00] bg-[#75bf00] text-black font-bold hover:bg-[#68ab00]"
                    : dark
                      ? "border-[#444] bg-[#222222] text-[#C8C7BA] hover:text-[#F0EFE2] hover:bg-[#333]"
                      : "border-[#171a17] bg-[#171a17] text-[#F0EFE2] hover:bg-[#2a2a2a]",
                )}
                title="Launch Mission"
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Split Flyout Drawer with Custom Scrollbar */}
        {flyoutOpen && (
          <div
            className={cn(
              "absolute left-0 right-0 top-full mt-2 z-50 border border-dashed shadow-2xl rounded-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col md:flex-row min-h-[380px]",
              dark
                ? "border-[#383838] bg-[#111111] text-[#F0EFE2]"
                : "border-[#c9cec4] bg-white text-[#171a17]",
            )}
          >
            {/* Left Rail: 5 Tabs */}
            <div
              className={cn(
                "w-full md:w-56 border-b md:border-b-0 md:border-r border-[#222222] p-2 space-y-1 shrink-0 font-sans text-xs",
                dark ? "bg-[#141414]" : "bg-[#fafbfa]",
              )}
            >
              {[
                {
                  id: "models",
                  label: "Models",
                  icon: <HuggingFaceLogo size={14} />,
                },
                {
                  id: "engine",
                  label: "Serving engine",
                  icon: <VLLMLogo size={14} />,
                },
                { id: "gpu", label: "GPU", icon: <NvidiaLogo size={14} /> },
                { id: "runs_on", label: "Runs on", icon: <Cloud size={14} /> },
                {
                  id: "output_format",
                  label: "Output format",
                  icon: <Boxes size={14} />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFlyoutTab(tab.id as FlyoutTab)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 rounded-xs text-left transition-colors font-medium text-xs",
                    activeFlyoutTab === tab.id
                      ? dark
                        ? "bg-[#252525] text-[#F0EFE2] font-semibold shadow-xs"
                        : "bg-[#e8eee4] text-[#171a17] font-semibold"
                      : dark
                        ? "text-[#C8C7BA] hover:bg-[#1a1a1a] hover:text-[#F0EFE2]"
                        : "text-[#666] hover:bg-[#f2f4f0] hover:text-[#171a17]",
                  )}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Right Pane with HOROS Custom Scrollbar */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[420px] horos-scrollbar">
              {/* TAB 1: Models */}
              {activeFlyoutTab === "models" && (
                <div className="space-y-3">
                  <div className="relative border border-[#2a2a2a] rounded-xs bg-[#161616] flex items-center px-2.5 py-1.5">
                    <HuggingFaceLogo
                      size={14}
                      className="shrink-0 text-[#C8C7BA] mr-2"
                    />
                    <input
                      type="text"
                      value={hfSearchQuery}
                      onChange={(e) => setHfSearchQuery(e.target.value)}
                      placeholder="Search Hugging Face models or paste a repo id / URL..."
                      className="w-full bg-transparent text-xs text-[#F0EFE2] placeholder:text-[#666] outline-none font-sans"
                    />
                  </div>

                  {hfSearchLoading && (
                    <div className="flex items-center gap-2 px-2 py-2 text-[11px] text-[#788274]">
                      <LoaderCircle size={12} className="animate-spin" />{" "}
                      Searching Hugging Face…
                    </div>
                  )}
                  {hfSearchError && !hfSearchLoading && (
                    <div className="px-2 py-2 text-[11px] text-[#a58b72]">
                      {hfSearchError}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#C8C7BA] px-1 pt-1">
                    <HuggingFaceLogo size={13} />
                    <span>Popular on Hugging Face 20</span>
                  </div>

                  <div className="space-y-1">
                    {(hfModels.length > 0 ? hfModels : POPULAR_HF_MODELS).map(
                      (m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            handleAddModel(m);
                            setFlyoutOpen(false);
                            setTimeout(() => inputRef.current?.focus(), 20);
                          }}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xs cursor-pointer transition-colors text-xs",
                            dark
                              ? "hover:bg-[#1c1c1c] text-[#d1d5db]"
                              : "hover:bg-[#f2f4f0] text-[#333]",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5">
                              <ModelBrandIcon model={m} size={15} />
                            </span>
                            <div>
                              <div className="font-semibold text-[#F0EFE2] text-xs">
                                {m.name}
                              </div>
                              <div className="text-[11px] text-[#788274] mt-0.5">
                                {m.org}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#2a2a2a] bg-[#1a1a1a] text-[10px] font-mono text-[#C8C7BA] rounded-xs">
                              <Download size={10} />
                              <span>{m.downloads}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#2a2a2a] bg-[#1a1a1a] text-[10px] font-mono text-[#C8C7BA] rounded-xs">
                              <Heart size={10} />
                              <span>{m.likes}</span>
                            </span>
                          </div>
                        </div>
                      ),
                    )}
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
                      dark
                        ? "border-[#2a2a2a] bg-[#1e221b] text-[#F0EFE2]"
                        : "border-[#d8ddd3] bg-[#f0f9eb] text-[#111]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[#75bf00]" />
                        <span className="font-semibold text-[#F0EFE2] text-xs">
                          Auto
                        </span>
                      </div>
                      <Check size={14} className="text-[#75bf00]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-1 pl-5">
                      Agent picks from the supported runtime matrix
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#C8C7BA] px-1">
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
                            ? dark
                              ? "bg-[#222222] border border-[#383838]"
                              : "bg-[#f0f4ee]"
                            : dark
                              ? "hover:bg-[#1a1a1a]"
                              : "hover:bg-[#fafbfa]",
                        )}
                      >
                        <span className="mt-0.5">{engine.icon}</span>
                        <div>
                          <div className="font-semibold text-[#F0EFE2] text-xs">
                            {engine.name}
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">
                            {engine.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#C8C7BA] px-1">
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
                            ? dark
                              ? "bg-[#222222] border border-[#383838]"
                              : "bg-[#f0f4ee]"
                            : dark
                              ? "hover:bg-[#1a1a1a]"
                              : "hover:bg-[#fafbfa]",
                        )}
                      >
                        <span className="mt-0.5">{engine.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F0EFE2] text-xs">
                              {engine.name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 border border-[#8a6800] bg-[#3a2800] text-[#e6b800] rounded-xs">
                              {engine.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">
                            {engine.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#C8C7BA] px-1">
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
                          <div className="font-semibold text-[#F0EFE2] text-xs">
                            {engine.name}
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">
                            {engine.desc}
                          </div>
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
                      setSelectedGpu("Auto");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "p-3 border rounded-xs cursor-pointer transition-colors text-xs",
                      dark
                        ? "border-[#2a2a2a] bg-[#1e221b] text-[#F0EFE2]"
                        : "border-[#d8ddd3] bg-[#f0f9eb] text-[#111]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-[#75bf00]" />
                        <span className="font-semibold text-[#F0EFE2] text-xs">
                          Auto
                        </span>
                      </div>
                      <Check size={14} className="text-[#75bf00]" />
                    </div>
                    <div className="text-[11px] text-[#788274] mt-1 pl-5">
                      Will likely pick T4 (cheapest viable option).
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#C8C7BA] px-1 pt-1">
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
                        onClick={() => {
                          setSelectedGpu(gpu.name);
                          setFlyoutOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xs text-xs hover:bg-[#181818] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Lock size={13} className="text-[#666]" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#F0EFE2] text-xs">
                                {gpu.name}
                              </span>
                              <span className="text-[10px] font-mono text-[#666]">
                                {gpu.vram}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#788274] mt-0.5">
                              {gpu.desc}
                            </div>
                          </div>
                        </div>
                        <Lock size={13} className="text-[#666]" />
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#788274] leading-relaxed px-1 pt-2 border-t border-[#222]">
                    Manual GPU selection unlocks at $50 lifetime credits. Auto
                    GPU still chooses the lowest viable hardware for the current
                    model.
                  </div>
                </div>
              )}

              {/* TAB 4: Runs on */}
              {activeFlyoutTab === "runs_on" && (
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      setSelectedRunsOn("Auto");
                      setFlyoutOpen(false);
                    }}
                    className={cn(
                      "p-3 border rounded-xs cursor-pointer transition-colors text-xs",
                      selectedRunsOn === "Auto"
                        ? dark
                          ? "border-[#444] bg-[#222222] text-[#F0EFE2]"
                          : "border-[#171a17] bg-[#f0f4ee] text-[#111]"
                        : dark
                          ? "border-[#282828] bg-[#181818] text-[#aaa]"
                          : "border-[#d8ddd3] bg-[#fafbfa] text-[#555]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[#aaa]" />
                        <span className="font-semibold text-[#F0EFE2] text-xs">
                          Auto
                        </span>
                      </div>
                      {selectedRunsOn === "Auto" && (
                        <Check size={14} className="text-[#F0EFE2]" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#788274] mt-1 pl-5">
                      Agent infers placement from your use case.
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#C8C7BA] px-1 pt-1">
                    <Cloud size={13} />
                    <span>Runs on</span>
                  </div>

                  <div className="space-y-1">
                    {[
                      {
                        name: "Managed cloud",
                        desc: "Multi-cloud GPU fabric across AWS, GCP, Azure, & DigitalOcean.",
                        icon: <Cloud size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Data center / On-prem",
                        desc: "Bare-metal GPU racks and datacenter hardware with IPMI/PDU control.",
                        icon: <Server size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Kubernetes cluster",
                        desc: "Private company Kubernetes cluster with automated GPU orchestration.",
                        icon: <Boxes size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Edge & Robotics",
                        desc: "Factory edge computers, NVIDIA Jetson Orin, and robot controllers.",
                        icon: <Bot size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Local workstation",
                        desc: "Your own desktop GPU, Apple Metal (MPS), or local Ollama runtime.",
                        icon: <Laptop size={14} className="text-[#C8C7BA]" />,
                      },
                    ].map((target) => (
                      <div
                        key={target.name}
                        onClick={() => {
                          setSelectedRunsOn(target.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-xs border",
                          selectedRunsOn === target.name
                            ? dark
                              ? "bg-[#222222] border-[#444] text-[#F0EFE2]"
                              : "bg-[#f0f4ee] border-[#171a17] text-[#111]"
                            : dark
                              ? "border-transparent hover:bg-[#1a1a1a] text-[#aaa]"
                              : "border-transparent hover:bg-[#fafbfa] text-[#555]",
                        )}
                      >
                        <span className="mt-0.5 shrink-0">{target.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F0EFE2] text-xs">
                              {target.name}
                            </span>
                            {selectedRunsOn === target.name && (
                              <Check size={14} className="text-[#F0EFE2]" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#788274] mt-0.5">
                            {target.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Output format */}
              {activeFlyoutTab === "output_format" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#788274] px-0.5">
                    <span>DEPLOYMENT DELIVERABLE</span>
                    <span className="text-[#C8C7BA]">SELECT TARGET FORMAT</span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      {
                        name: "Managed endpoint",
                        desc: "A live production endpoint provisioned, verified, and monitored in HOROS.",
                        icon: <Cloud size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Docker & Compose Kit",
                        desc: "Production container and docker-compose.yml with automated verify scripts.",
                        icon: <Box size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Kubernetes Helm Chart",
                        desc: "Production-grade Helm chart with GPU node affinities and autoscaling.",
                        icon: <Boxes size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Local & Edge (GGUF / TensorRT)",
                        desc: "Quantized weights for Ollama, llama.cpp, and factory robotics hardware.",
                        icon: <Laptop size={14} className="text-[#C8C7BA]" />,
                      },
                      {
                        name: "Private Weights (HF / S3)",
                        desc: "Direct immutable export of weights and LoRA adapters to private Hugging Face or S3.",
                        icon: <HuggingFaceLogo size={14} />,
                      },
                    ].map((fmt) => (
                      <div
                        key={fmt.name}
                        onClick={() => {
                          setSelectedOutputFormat(fmt.name);
                          setFlyoutOpen(false);
                        }}
                        className={cn(
                          "p-2.5 border rounded-xs cursor-pointer transition-colors text-xs",
                          selectedOutputFormat === fmt.name
                            ? dark
                              ? "border-[#444] bg-[#222222] text-[#F0EFE2]"
                              : "border-[#171a17] bg-[#f0f4ee] text-[#111]"
                            : dark
                              ? "border-[#262626] hover:bg-[#1a1a1a] text-[#aaa]"
                              : "border-[#e0e4dd] hover:bg-[#fafbfa] text-[#555]",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0">{fmt.icon}</span>
                            <span className="font-semibold text-[#F0EFE2] text-xs">
                              {fmt.name}
                            </span>
                          </div>
                          {selectedOutputFormat === fmt.name && (
                            <Check size={14} className="text-[#F0EFE2] shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#788274] mt-0.5 pl-5.5 leading-relaxed">
                          {fmt.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] font-mono text-[#666] pt-1 px-1 border-t border-[#222]">
                    * The optimization plan compiles and verifies directly
                    toward the selected deliverable format.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connect Reality Source Modal Drawer (Dashed Product Motif) */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={cn(
              "w-full max-w-lg border border-dashed shadow-2xl rounded-xs overflow-hidden",
              dark
                ? "border-[#2e2e2e] bg-[#161616] text-[#F0EFE2]"
                : "border-[#c9cec4] bg-white text-[#171a17]",
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-[#282828] bg-[#131313]">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-[#75bf00]" />
                <span className="text-xs font-mono uppercase tracking-[0.14em] font-semibold text-[#889084]">
                  CONNECT REALITY SOURCE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="text-[#788274] hover:text-[#F0EFE2] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-2.5 text-xs font-sans">
              <p className="text-[#889084] text-[11px] leading-relaxed">
                Connect live machine-observable sources into HOROS to
                reconstruct reality and enable autonomous optimization.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {[
                  {
                    name: "GitHub / GitLab",
                    desc: "Repositories, pull requests, & CI/CD",
                    icon: <GitCompare size={14} className="text-[#75bf00]" />,
                  },
                  {
                    name: "Kubernetes Cluster",
                    desc: "Pods, nodes, namespaces, & CRDs",
                    icon: <Boxes size={14} className="text-[#75bf00]" />,
                  },
                  {
                    name: "OpenTelemetry / Logs",
                    desc: "Distributed traces, metrics, & logs",
                    icon: <Activity size={14} className="text-[#e6b800]" />,
                  },
                  {
                    name: "Edge Cameras & Sensors",
                    desc: "Video streams, force/torque, & thermals",
                    icon: <Bot size={14} className="text-[#75bf00]" />,
                  },
                  {
                    name: "AWS / GCP / Azure",
                    desc: "Cloud GPUs, VPCs, & billing exports",
                    icon: <Cloud size={14} className="text-[#60a5fa]" />,
                  },
                  {
                    name: "Datacenter Hardware",
                    desc: "IPMI, PDU, thermal, & switch telemetry",
                    icon: <Server size={14} className="text-[#75bf00]" />,
                  },
                ].map((src) => (
                  <div
                    key={src.name}
                    onClick={() => {
                      setConnectModalOpen(false);
                      setAttachedMedia({
                        type: "doc",
                        name: `${src.name} Linked`,
                      });
                    }}
                    className={cn(
                      "p-2.5 border border-dashed rounded-xs cursor-pointer transition-all text-left group",
                      dark
                        ? "border-[#2c2c2c] bg-[#1a1a1a] hover:border-[#75bf00] hover:bg-[#202020]"
                        : "border-[#d8ddd3] bg-[#fafbfa] hover:border-[#75bf00] hover:bg-white",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {src.icon}
                      <span className="font-semibold text-xs text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                        {src.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#788274] mt-1 leading-snug">
                      {src.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-dashed border-[#282828] bg-[#131313] flex justify-end">
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="px-3 py-1 text-xs border border-[#383838] bg-[#202020] text-[#F0EFE2] hover:border-white transition-colors rounded-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      {showSuggestions && (
        <div className="space-y-2 max-w-[840px] pt-1">
          <div className="text-[11px] font-mono text-[#788274] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Suggestions</span>
            </div>
          </div>

          <div
            className={cn(
              "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
              dark
                ? "border-[#2e2e2e] bg-[#191919] divide-[#262626]"
                : "border-[#d8ddd3] bg-white divide-[#edf0eb]",
            )}
          >
            {activeSuggestions.map((sug) => (
              <div
                key={sug.id}
                onClick={(e) => {
                  gsap.fromTo(
                    e.currentTarget,
                    { scale: 0.985 },
                    { scale: 1, duration: 0.25, ease: "back.out(2)" },
                  );
                  handleSelectSuggestion(sug);
                }}
                className={cn(
                  "group flex flex-wrap items-center gap-2 p-3 text-xs cursor-pointer transition-colors font-sans",
                  dark
                    ? "hover:bg-[#222222] text-[#d1d5db]"
                    : "hover:bg-[#fafbfa] text-[#374151]",
                )}
              >
                <ArrowRight
                  size={13}
                  className="text-[#788274] group-hover:text-[#75bf00] group-hover:translate-x-0.5 transition-all shrink-0"
                />
                <span className="text-[#aaa] font-medium">{sug.action}</span>

                {/* Model Pill */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-xs font-medium text-xs",
                    dark
                      ? "border-[#383838] bg-[#242424] text-[#F0EFE2]"
                      : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]",
                  )}
                >
                  {sug.modelBadge.icon}
                  <span>{sug.modelBadge.text}</span>
                </span>

                {sug.secondaryModelBadge && (
                  <>
                    <span className="text-[#C8C7BA] font-normal">
                      {sug.secondaryText || "against"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-xs font-medium text-xs",
                        dark
                          ? "border-[#383838] bg-[#242424] text-[#F0EFE2]"
                          : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]",
                      )}
                    >
                      {sug.secondaryModelBadge.icon}
                      <span>{sug.secondaryModelBadge.text}</span>
                    </span>
                  </>
                )}

                {sug.engineBadge && (
                  <>
                    <span className="text-[#C8C7BA] font-normal">on</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-xs font-medium text-xs",
                        dark
                          ? "border-[#383838] bg-[#242424] text-[#F0EFE2]"
                          : "border-[#d8ddd3] bg-[#fafbfa] text-[#111]",
                      )}
                    >
                      {sug.engineBadge.icon}
                      <span>{sug.engineBadge.text}</span>
                    </span>
                  </>
                )}

                <span className="truncate text-[#889084] group-hover:text-[#F0EFE2] transition-colors">
                  {sug.rest}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

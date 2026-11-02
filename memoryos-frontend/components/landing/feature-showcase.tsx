"use client";
import { SectionDivider } from "@/components/landing/section-divider";

import React, { useState, useEffect } from "react";
import { ChevronDown, ExternalLink, Play, ClipboardList, GitBranch, ListChecks, Cpu, X } from "lucide-react";
import { MetaLogo, VLLMLogo, QwenLogo, MicrosoftLogo, DeepSeekLogo, OpenAILogo, AnthropicLogo, MistralLogo, GoogleLogo, SGLangLogo, NvidiaLogo, TEILogo, DiffusersLogo, HorosLogo, VLLMOmniLogo } from "@/components/horos/primitives/brand-icons";
import { OptimizationStep } from "./optimization-step";
import { DeployStep } from "./deploy-step";
import { PhysicalWorldStep } from "./physical-world-step";
import { PolicyAuthorityStep } from "./policy-authority-step";
import { EvidenceProofStep } from "./evidence-proof-step";
import { LearningFlywheelStep } from "./learning-flywheel-step";
import { TokenPromptInput, CYCLING_PROMPTS } from "@/components/horos/primitives/token-prompt-input";

// Master alignment lines: Outer (18%), Inner Margins (pushed inside by 120px)



const MODELS = [
  { name: "DeepSeek V3", color: "#75bf00", Icon: DeepSeekLogo },
  { name: "Llama 3.1 70B", color: "#75bf00", Icon: MetaLogo },
  { name: "Qwen 2.5 7B", color: "#75bf00", Icon: QwenLogo },
  { name: "Claude 3.5 Sonnet", color: "#75bf00", Icon: AnthropicLogo },
  { name: "Phi-4", color: "#75bf00", Icon: MicrosoftLogo },
  { name: "Mistral Large 2", color: "#75bf00", Icon: MistralLogo },
  { name: "Whisper Large v3", color: "#75bf00", Icon: OpenAILogo },
  { name: "Gemma 2 9B", color: "#75bf00", Icon: GoogleLogo }
];

const ENGINES = [
  { name: "vLLM-Omni", color: "#75bf00", Icon: VLLMOmniLogo },
  { name: "vLLM", color: "#F59E0B", Icon: VLLMLogo },
  { name: "SGLang", color: "#EA580C", Icon: SGLangLogo },
  { name: "TensorRT-LLM", color: "#76B900", Icon: NvidiaLogo },
  { name: "Diffusers", color: "#FFFFFF", Icon: DiffusersLogo },
  { name: "TEI", color: "#FFD21E", Icon: TEILogo },
  { name: "NVIDIA Dynamo", color: "#888888", Icon: NvidiaLogo }
];

const GPUS = [
  { name: "NVIDIA A100", color: "#75bf00", Icon: NvidiaLogo },
  { name: "NVIDIA H100", color: "#75bf00", Icon: NvidiaLogo },
  { name: "NVIDIA L40S", color: "#75bf00", Icon: NvidiaLogo },
  { name: "NVIDIA RTX 4090", color: "#75bf00", Icon: NvidiaLogo }
];

const SURFACES = [
  { name: "Autonomous Vehicles", color: "#75bf00" },
  { name: "Robotic Systems", color: "#75bf00" },
  { name: "Industrial Workcells", color: "#75bf00" },
  { name: "Sensor Telemetry", color: "#75bf00" }
];

// --- Scrollers ---
function ModelScroller() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % MODELS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-1.5 mb-1.5 h-10 overflow-hidden relative inline-block align-middle">
      <div
        className="flex flex-col transition-transform duration-500 ease-in-out"
        style={{ transform: `translateY(-${index * 40}px)` }}
      >
        {MODELS.map((m, i) => (
          <div key={i} className="h-10 flex items-center gap-2.5">
            <m.Icon size={32} className="shrink-0" />
            <span className="font-sans font-medium text-xl sm:text-2xl lg:text-[28px] xl:text-[32px] leading-none whitespace-nowrap" style={{ color: m.color }}>
              {m.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngineScroller() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ENGINES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-1.5 mb-1.5 h-10 overflow-hidden relative inline-block align-middle">
      <div
        className="flex flex-col transition-transform duration-500 ease-in-out"
        style={{ transform: `translateY(-${index * 40}px)` }}
      >
        {ENGINES.map((e, i) => (
          <div key={i} className="h-10 flex items-center gap-2.5">
            <e.Icon size={28} />
            <span className="font-sans font-medium text-xl sm:text-2xl lg:text-[28px] xl:text-[32px] leading-none whitespace-nowrap shrink-0" style={{ color: e.color }}>
              {e.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GPUScroller() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % GPUS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-1.5 mb-1.5 h-10 overflow-hidden relative inline-block align-middle">
      <div
        className="flex flex-col transition-transform duration-500 ease-in-out"
        style={{ transform: `translateY(-${index * 40}px)` }}
      >
        {GPUS.map((g, i) => (
          <div key={i} className="h-10 flex items-center gap-2.5">
            <g.Icon size={28} />
            <span className="font-sans font-medium text-xl sm:text-2xl lg:text-[28px] xl:text-[32px] leading-none whitespace-nowrap shrink-0" style={{ color: g.color }}>
              {g.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SurfaceScroller() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SURFACES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-1.5 mb-1.5 h-10 overflow-hidden relative inline-block align-middle">
      <div
        className="flex flex-col transition-transform duration-500 ease-in-out"
        style={{ transform: `translateY(-${index * 40}px)` }}
      >
        {SURFACES.map((s, i) => (
          <div key={i} className="h-10 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#75bf00] animate-pulse"></span>
            <span className="font-sans font-medium text-xl sm:text-2xl lg:text-[28px] xl:text-[32px] leading-none whitespace-nowrap shrink-0" style={{ color: s.color }}>
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Inner Right-Side Components ---
function SimulatorConsole({ isSpacer = false }: { isSpacer?: boolean }) {
  return (
    <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#333333] p-4 sm:p-5 lg:p-6 bg-[#151515] rounded-[1px] font-mono text-sm select-none overflow-hidden">
      <div>
        {/* Console Header Bar */}
        <div className="flex items-center justify-start gap-3 py-1 mb-2.5 text-[#aaa]">
          <div className="flex items-center">
            <svg width="28" height="18" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="40" />
              <path d="M53.6688 3.16846H59.9748C60.473 3.16846 60.9508 3.46054 61.3031 3.98044C61.6553 4.50034 61.8532 5.20548 61.8532 5.94073V15.2477C61.8532 15.9829 61.6553 16.6881 61.3031 17.208C60.9508 17.7279 60.473 18.0199 59.9748 18.0199H53.6688C53.1706 18.0199 52.6928 17.7279 52.3405 17.208C51.9882 16.6881 51.7903 15.9829 51.7903 15.2477V5.94073C51.7903 5.20548 51.9882 4.50034 52.3405 3.98044C52.6928 3.46054 53.1706 3.16846 53.6688 3.16846Z" fill="white" />
              <path d="M22.2725 20.9902H32.3354V33.0694C32.3354 33.8047 32.1375 34.5098 31.7852 35.0297C31.433 35.5496 30.9552 35.8417 30.457 35.8417H24.1509C23.6527 35.8417 23.175 35.5496 22.8227 35.0297C22.4704 34.5098 22.2725 33.8047 22.2725 33.0694V20.9902Z" fill="white" />
              <path d="M14.7589 6.13867H21.065C21.5632 6.13867 22.0409 6.43075 22.3932 6.95065C22.7455 7.47056 22.9434 8.1757 22.9434 8.91095V20.9902H14.7589C14.2607 20.9902 13.7829 20.6981 13.4307 20.1782C13.0784 19.6583 12.8805 18.9531 12.8805 18.2179V8.91095C12.8805 8.1757 13.0784 7.47056 13.4307 6.95065C13.7829 6.43075 14.2607 6.13867 14.7589 6.13867Z" fill="white" />
              <path d="M41.7274 20H49.9119C50.4101 20 50.8879 20.2921 51.2401 20.812C51.5924 21.3319 51.7903 22.037 51.7903 22.7723V32.0792C51.7903 32.8145 51.5924 33.5196 51.2401 34.0395C50.8879 34.5594 50.4101 34.8515 49.9119 34.8515H43.6058C43.1076 34.8515 42.6299 34.5594 42.2776 34.0395C41.9253 33.5196 41.7274 32.8145 41.7274 32.0792V20Z" fill="white" />
              <path d="M4.02514 21.9805H10.3312C10.8294 21.9805 11.3072 22.2725 11.6594 22.7924C12.0117 23.3124 12.2096 24.0175 12.2096 24.7527V34.0597C12.2096 34.7949 12.0117 35.5001 11.6594 36.02C11.3072 36.5399 10.8294 36.832 10.3312 36.832H4.02514C3.52695 36.832 3.04917 36.5399 2.6969 36.02C2.34463 35.5001 2.14673 34.7949 2.14673 34.0597V24.7527C2.14673 24.0175 2.34463 23.3124 2.6969 22.7924C3.04917 22.2725 3.52695 21.9805 4.02514 21.9805Z" fill="white" />
              <path d="M33.543 6.13867H39.849C40.3472 6.13867 40.825 6.43075 41.1773 6.95065C41.5295 7.47056 41.7274 8.1757 41.7274 8.91095V20.9902H31.6646V8.91095C31.6646 8.1757 31.8625 7.47056 32.2147 6.95065C32.567 6.43075 33.0448 6.13867 33.543 6.13867Z" fill="white" />
              <path d="M22.9434 18.2178C22.9434 20.297 23.319 20.9901 24.8218 20.9901H22.9434V18.2178Z" fill="white" />
              <path d="M31.6645 18.2178C31.6645 20.297 31.2889 20.9901 29.7861 20.9901H31.6645V18.2178Z" fill="white" />
              <path d="M22.2725 23.7625C22.2725 21.6833 21.8968 20.9902 20.3941 20.9902H22.2725V23.7625Z" fill="white" />
              <path d="M41.7275 23.7625C41.7275 21.6833 41.3518 20.9902 39.8491 20.9902H41.7275V23.7625Z" fill="white" />
              <path d="M32.3354 23.7625C32.3354 21.6833 32.7111 20.9902 34.2138 20.9902H32.3354V23.7625Z" fill="white" />
              <path d="M41.7274 17.228C41.7274 19.3072 42.1031 20.0003 43.6058 20.0003H41.7274V17.228Z" fill="white" />
            </svg>
          </div>
          <div className="w-[1px] h-3.5 bg-[#333]" />
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#F0EFE2] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            <span className="text-[12px] font-medium ml-0.5">New Session</span>
            <ChevronDown size={12} className="ml-0.5" />
          </div>
        </div>

        {/* Prompt Token Input box (Styled like the real composer) */}
        <div className="p-3 border border-[#333333] bg-[#202020] rounded-sm leading-[2.2] text-[13px] mb-3 font-sans font-medium text-[#F0EFE2] shadow-sm">
          Optimize{" "}
          <span className="inline-flex items-center gap-1 border border-[#333] bg-[#111111] text-[#F0EFE2] px-1.5 py-0.5 text-[11px] font-medium rounded-sm shadow-sm align-middle mx-1 cursor-pointer hover:border-[#555] transition-colors">
            <MetaLogo size={12} />
            <span>Llama-3.1-8B</span>
            <ChevronDown size={12} className="text-[#C8C7BA] ml-0.5" />
          </span>{" "}
          on{" "}
          <span className="inline-flex items-center gap-1 border border-[#333] bg-[#111111] text-[#F0EFE2] px-1.5 py-0.5 text-[11px] font-medium rounded-sm shadow-sm align-middle mx-1 cursor-pointer hover:border-[#555] transition-colors">
            <VLLMLogo size={12} />
            <span>vLLM</span>
            <ChevronDown size={12} className="text-[#C8C7BA] ml-0.5" />
          </span>{" "}
          for latency
        </div>

        {/* Static Step Log Area */}
        <div className="space-y-2 flex flex-col justify-start">
          {/* Step 1: Thought Process */}
          <div className="space-y-1 text-[12px]">
            <div className="text-[#666666] font-mono text-[12px] flex items-center gap-2">
              <span>&gt;</span>
              <span>Thought for 1s</span>
            </div>
            <div className="text-[#F0EFE2] tracking-wide">
              Capturing cost-first intent for Llama 3.1 8B on vLLM.
            </div>
          </div>

          {/* Step 2: Intake Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#F0EFE2] font-medium text-[12px]">
                <ClipboardList size={12} className="text-[#788274]" />
                <span>Intake updated</span>
              </div>
              <div className="flex items-center gap-2 text-[#666]">
                <span className="text-[11px] uppercase font-bold tracking-widest">Model, engine, goal</span>
                <ChevronDown size={10} />
              </div>
            </div>
            <div className="flex flex-col gap-y-1 pl-7 pr-2 text-[#777777] text-[12px] w-full">
              <div className="flex justify-between items-center w-full">
                <span>Model</span>
                <span className="text-[#F0EFE2] font-medium tracking-wide">Llama 3.1 8B</span>
              </div>
              <div className="flex justify-between items-center w-full">
                <span>Engine</span>
                <span className="text-[#F0EFE2] font-medium tracking-wide">vLLM</span>
              </div>
              <div className="flex justify-between items-center w-full">
                <span>Goal</span>
                <span className="text-[#F0EFE2] font-medium tracking-wide">Low cost, latency checked</span>
              </div>
            </div>
          </div>

          {/* Step 3: Plan Draft Confirmation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#F0EFE2] font-medium text-[12px]">
                <GitBranch size={14} className="text-[#788274]" />
                <span>Plan drafted</span>
                <span className="text-[#666] text-[11px] font-normal">3.1s</span>
              </div>
              <div className="text-[#666]">
                <span className="font-mono text-[12px]">&gt;</span>
              </div>
            </div>
            <div className="pl-7 text-[#777777] text-[11px]">
              10 execution phases prepared
            </div>
          </div>

          {/* Step 4: Plan Action Card */}
          <div className="border border-[#2a2a2a] bg-[#1a1a1a] rounded-[3px] p-1.5 mt-0.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-[#F0EFE2] font-medium text-[11px]">
                <div className="flex items-center justify-center border border-[#333] rounded w-5 h-5 bg-[#222]">
                  <ListChecks size={11} className="text-[#F0EFE2]" />
                </div>
                <span>Plan ready</span>
              </div>
              <span className="text-[10px] text-[#666]">review / 10 phases / ~23m</span>
            </div>

            <div className="space-y-0.5">
              <div className="text-[#F0EFE2] text-[11px] leading-snug tracking-wide truncate">
                Optimize Llama 3.1 8B on vLLM for latency
              </div>
              <div className="text-[#C8C7BA] text-[10px] leading-snug">
                Recommended path: vLLM on L4. Review plan before execution.
              </div>
            </div>

            {/* Divider line before buttons */}
            <div className="border-t border-[#2a2a2a] pt-1.5 mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-2 py-1 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-[#F0EFE2] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ExternalLink size={8} />
                <span>Open Plan</span>
              </button>
              <button
                type="button"
                className="px-2 py-1 text-black text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer bg-[#75bf00] hover:bg-[#86dc00] rounded-[1px]"
              >
                <Play size={8} strokeWidth={2} />
                <span>Accept and run</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Working... status indicator below the console area */}
      <div className="pt-2 border-t border-[#222222] text-[10px] flex items-center gap-2 font-sans text-[#777777]">
        <span className="w-1.5 h-1.5 bg-[#555] rounded-[1px] shrink-0" />
        <span>Working...</span>
      </div>
    </div>
  );
}

function RunbookDashboard() {
  return (
    <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#333333] p-4 sm:p-5 lg:p-5 bg-[#151515] rounded-[1px] font-mono text-sm select-none overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-dashed border-[#333333]">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 border border-[#444] rounded-[1px] p-1.5 bg-[#1a1a1a]">
              <ClipboardList size={16} className="text-[#C8C7BA]" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[#F0EFE2] font-medium text-[14px]">Mission Runtime Execution Plan</div>
              <div className="text-[#666666] font-mono text-[11px]">HOROS Reality Intelligence Loop</div>
            </div>
          </div>
          <div className="border border-[#333] bg-[#1a1a1a] text-[#C8C7BA] font-mono text-[10px] px-2 py-0.5 rounded-[1px]">
            draft
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 border-b border-dashed border-[#333333] divide-x divide-dashed divide-[#333333] my-3">
          <div className="p-2.5 flex flex-col gap-1">
            <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">Primary Intent</div>
            <div className="text-[#F0EFE2] font-medium text-[12px]">Optimize Inference Cost</div>
          </div>
          <div className="p-2.5 flex flex-col gap-1">
            <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">Hard Constraints</div>
            <div className="text-[#F0EFE2] font-medium text-[12px]">{"P99 <= 250ms, 24GB"}</div>
          </div>
          <div className="p-2.5 flex flex-col gap-1">
            <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">Verification Mode</div>
            <div className="text-[#F0EFE2] font-medium text-[12px]">Empirical Benchmark</div>
          </div>
        </div>

        {/* Execution Plan */}
        <div className="pt-2 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="text-[#C8C7BA] font-mono text-[10px] uppercase tracking-wider">Execution & Evolution Plan</div>
            <div className="text-[#666666] font-mono text-[10px]">15 phases, 3 validated</div>
          </div>

          {/* 3-Column Grid for Phases */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-4 gap-y-2.5 overflow-hidden">
            <div className="space-y-2.5">
              <PhaseItem num="01" title="Input Normalization" desc="Process text, telemetry & sensors" status="ready" />
              <PhaseItem num="02" title="Outcome Intelligence" desc="Extract intent & build contract" status="ready" />
              <PhaseItem num="03" title="Capability Discovery" desc="Find models, runtimes, hardware" status="ready" />
              <PhaseItem num="04" title="System Composer" desc="Build candidate stacks" status="queued" />
              <PhaseItem num="05" title="Experiment Engine" desc="Simulate, sandbox, benchmark" status="queued" />
            </div>
            <div className="space-y-2.5">
              <PhaseItem num="06" title="Autonomous Decision" desc="Quality and economics ranking" status="queued" />
              <PhaseItem num="07" title="Policy & Authority" desc="Risk, cost, and safety gates" status="queued" />
              <PhaseItem num="08" title="Execution Layer" desc="Deploy software or actuate physical" status="ready" />
              <PhaseItem num="09" title="Evidence Collection" desc="Observe and gather provenance" status="queued" />
              <PhaseItem num="10" title="Independent Verifier" desc="Verifiably confirm claims" status="queued" />
            </div>
            <div className="space-y-2.5">
              <PhaseItem num="11" title="Experience Engine" desc="Compile verified outcome records" status="queued" />
              <PhaseItem num="12" title="Lesson Engine" desc="Generalize into teaching signals" status="queued" />
              <PhaseItem num="13" title="Teaching System" desc="Train, adapt, and route models" status="queued" />
              <PhaseItem num="14" title="Intelligence Evolution" desc="Evaluate, canary, and promote" status="queued" />
              <PhaseItem num="15" title="Better Reality Model" desc="Continuously adapt world state" status="queued" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="border-t border-dashed border-[#333333] pt-3 mt-3 flex items-center justify-between shrink-0">
        <div className="text-[#666666] font-mono text-[10px] flex items-center gap-2">
          <span className="w-[3px] h-[3px] bg-[#666]" />
          Review the mission contract, then authorize.
        </div>
        <div className="text-[#555555] font-mono text-[10px] uppercase tracking-wider">
          HOROS CANONICAL_V4
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---


export interface FeatureShowcaseProps {
  onOpenSignIn?: () => void;
  dark?: boolean;
}

export function FeatureShowcase({ onOpenSignIn, dark = true }: FeatureShowcaseProps) {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [isComposerDismissed, setIsComposerDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 500) {
        setIsComposerDismissed(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = parseInt(entry.target.getAttribute("data-section") || "0", 10);
            setActiveSection(section);
            window.dispatchEvent(new CustomEvent("horosActiveSectionChange", { detail: section }));
          }
        });
      },
      {
        rootMargin: "-20% 0px -20% 0px",
        threshold: 0
      }
    );

    const elements = document.querySelectorAll('.scroll-spy-trigger');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="feature-showcase-section" className="relative w-full bg-[#151515] text-[#F0EFE2] font-mono select-none">

      {/* 4 Adaptive Vertical Guidelines (2 on Left, 2 on Right) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left Outer Line */}
        <div className="hidden md:block absolute left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
        {/* Left Inner Line */}
        <div className="absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        {/* Right Inner Line */}
        <div className="absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#333]" />
        {/* Right Outer Line */}
        <div className="hidden md:block absolute right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#262626]" />
      </div>

      {/* Row 1: Centered Header Block (Scrolls away naturally) */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-[10%_1fr_10%] xl:grid-cols-[14%_1fr_14%] 2xl:grid-cols-[18%_1fr_18%] pt-16">
        <div className="relative p-4 min-h-[140px] hidden lg:block" />

        {/* Main Center Header Content */}
        <div className="relative flex flex-col items-center justify-center p-8 text-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00]" />
            <span className="text-xs font-mono tracking-[0.2em] text-[#C8C7BA] uppercase">
              Reality Intelligence Runtime
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#F0EFE2] font-sans leading-tight">
            From intent to a
            <br />
            verified reality you own.
          </h2>

          <p className="mt-4 max-w-2xl text-sm lg:text-base text-[#C8C7BA] font-sans font-normal leading-relaxed">
            Teach intelligent systems to decode reality, explore unknowns, autonomously experiment across models and hardware, and deliver verified production results.
          </p>
        </div>

        <div className="p-4 min-h-[140px] hidden lg:block" />
      </div>

      {/* Row 2: Sticky Scroll Arena */}
      <SectionDivider />
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-[10%_5fr_7fr_10%] xl:grid-cols-[14%_5fr_7fr_14%] 2xl:grid-cols-[18%_5fr_7fr_18%]">

        {/* Column 1: Left Margin Cell */}
        <div className="relative border-r border-dashed border-[#333333] hidden lg:block">
          <span className="sticky top-[80vh] ml-3 text-[9px] font-mono tracking-[0.25em] text-[#555555] font-semibold select-none pointer-events-none uppercase">
            HOROS
          </span>
        </div>

        {/* Column 2: Left Typography (Scrolling Blocks) */}
        <div className="relative flex flex-col lg:border-r border-dashed border-[#333333] pb-[80vh]">

          {/* Block 1 */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16"
            data-section="1"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
                Tell HOROS what you want
                <br />
                <ModelScroller />
                <br />
                to do in plain English.
              </h3>
            </div>
          </div>

          {/* Block 2 */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16 border-t border-dashed border-[#333333]"
            data-section="2"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#cccccc] font-sans leading-snug tracking-tight">
                HOROS explores
                <br />
                <EngineScroller />
                <br />
                <span className="text-[#F0EFE2]">and instantly builds the</span>
                <br />
                <span className="text-[#F0EFE2]">perfect system for you.</span>
              </h3>
            </div>
          </div>

          {/* Block 3 */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16 border-t border-dashed border-[#333333]"
            data-section="3"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
                It tests and
                <br />
                <span className="text-[#75bf00]">benchmarks</span>
                <br />
                everything in the background,
                <br />
                so you don't have to.
              </h3>
            </div>
          </div>

          {/* Block 4 */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16 border-t border-dashed border-[#333333]"
            data-section="4"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
                Run it anywhere, from
                <br />
                <span className="inline-flex items-center gap-2 text-[#75bf00] align-middle mt-2 mb-1">
                  <span className="flex items-center justify-center shrink-0 w-8 h-8"><NvidiaLogo size={32} /></span>
                  <span className="font-bold tracking-tight mt-1">NVIDIA L40S</span>
                </span>
                <span className="ml-4 text-[#F0EFE2] align-middle">to</span>
                <br />
                your own hardware,
                <br />
                and own the final result.
              </h3>
            </div>
          </div>

          {/* Block 5: Physical World Decoding */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16 border-t border-dashed border-[#333333]"
            data-section="5"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
                Decode
                <br />
                <span className="inline-flex items-center gap-2 text-[#75bf00]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#75bf00]"></span>
                  Sensor Telemetry
                </span>
                <br />
                into verified, live
                <br />
                <span className="text-[#75bf00]">World State.</span>
              </h3>
            </div>
          </div>

          {/* Block 6: Autonomous Policy & Safety Authority */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16 border-t border-dashed border-[#333333]"
            data-section="6"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
                Acts within authorized
                <br />
                <span className="text-[#75bf00]">safety boundaries</span>,
                <br />
                never exceeding your
                <br />
                organization&apos;s policy.
              </h3>
            </div>
          </div>

          {/* Block 7: Independent Proof & Verification */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16 border-t border-dashed border-[#333333]"
            data-section="7"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
                Proves every outcome
                <br />
                through independent
                <br />
                <span className="text-[#75bf00]">verification</span> and
                <br />
                empirical evidence.
              </h3>
            </div>
          </div>

          {/* Block 8: Teaching System & Compounding Intelligence */}
          <div
            className="scroll-spy-trigger min-h-[85vh] flex flex-col justify-start p-8 lg:p-12 pt-12 lg:pt-16 border-t border-dashed border-[#333333]"
            data-section="8"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
                Turns verified results
                <br />
                into <span className="text-[#75bf00]">compounding</span>
                <br />
                intelligence that learns
                <br />
                from every mission.
              </h3>
            </div>
          </div>

        </div>

        {/* Column 3: Right Container (Sticky UI) */}
        <div className="relative w-full h-full pb-16 lg:pb-24">
          <div className="sticky top-12 lg:top-16 flex flex-col justify-start p-4 lg:p-6 w-full">

            <div className="relative w-full">
              {/* Simulator State (Section 1) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection <= 1 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 -translate-y-8 scale-95 pointer-events-none'}`}
              >
                <SimulatorConsole />
              </div>

              {/* Runbook State (Section 2) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection === 2 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 translate-y-8 scale-95 pointer-events-none'}`}
              >
                <RunbookDashboard />
              </div>

              {/* Optimization Run State (Section 3) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection === 3 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 translate-y-8 scale-95 pointer-events-none'}`}
              >
                <OptimizationStep />
              </div>

              {/* Deploy Dashboard State (Section 4) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection === 4 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 translate-y-8 scale-95 pointer-events-none'}`}
              >
                <DeployStep />
              </div>

              {/* Physical World Decoder State (Section 5) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection === 5 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 translate-y-8 scale-95 pointer-events-none'}`}
              >
                <PhysicalWorldStep />
              </div>

              {/* Policy & Safety Authority State (Section 6) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection === 6 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 translate-y-8 scale-95 pointer-events-none'}`}
              >
                <PolicyAuthorityStep />
              </div>

              {/* Evidence & Verification State (Section 7) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection === 7 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 translate-y-8 scale-95 pointer-events-none'}`}
              >
                <EvidenceProofStep />
              </div>

              {/* Learning Flywheel State (Section 8) */}
              <div
                className={`transition-all duration-700 absolute inset-0 w-full h-full flex flex-col ${activeSection >= 8 ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 -z-10 translate-y-8 scale-95 pointer-events-none'}`}
              >
                <LearningFlywheelStep />
              </div>

              {/* Invisible canonical spacer that locks the EXACT width and height for all cards */}
              <div className="opacity-0 pointer-events-none min-h-[660px] h-[660px] lg:h-[660px] xl:h-[660px] w-full">
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Right Margin Cell */}
        <div className="relative pt-12 lg:pt-16 hidden lg:block">
          <div className="sticky top-32 w-full">
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <HorosLogo className="w-16 h-auto text-[#F0EFE2]" />
              <div className="text-[11px] text-[#F0EFE2] font-sans font-medium leading-[1.8]" style={{ writingMode: 'vertical-rl' }}>
                <p>Frontier Intelligence</p>
                <p>Engineering</p>
                <p>System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

function PhaseItem({ num, title, desc, status }: { num: string, title: string, desc: string, status: "ready" | "queued" }) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-dashed border-[#222222] last:border-0 last:pb-0">
      <div className="text-[#F0EFE2] font-mono text-[12px] font-bold mt-0.5">{num}</div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-[#dddddd] font-medium text-[12px] leading-tight truncate">{title}</span>
          <span className="shrink-0 flex items-center gap-1.5 border border-[#333] bg-[#1a1a1a] px-1.5 py-0.5 rounded-[1px]">
            <span className={`w-1 h-1 rounded-full ${status === 'ready' ? 'bg-[#75bf00]' : 'bg-[#555555]'}`} />
            <span className={`font-mono text-[8px] uppercase tracking-wider ${status === 'ready' ? 'text-[#75bf00]' : 'text-[#666666]'}`}>
              {status}
            </span>
          </span>
        </div>
        <div className="text-[#666666] text-[11px] leading-tight font-sans truncate">
          {desc}
        </div>
      </div>
    </div>
  );
}

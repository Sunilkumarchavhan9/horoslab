"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  ChevronRight,
  Cpu,
  Workflow,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";
import {
  DeepSeekLogo,
  OrnithLogo,
  NvidiaLogo,
  QwenLogo,
  AnthropicLogo,
  MistralLogo,
  OpenAILogo,
} from "@/components/horos/primitives/brand-icons";

const founderEmail = "chavhansunilkumar753@gmail.com";

function ZLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="4 6 22 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-white"
    >
      <g fill="currentColor">
        <path d="M15.47 7.1l-1.3 1.85c-0.2 0.29-0.54 0.47-0.9 0.47h-7.1V7.09C6.16 7.1 15.47 7.1 15.47 7.1z" />
        <polygon points="24.3 7.1 13.14 22.91 5.7 22.91 16.86 7.1" />
        <path d="M14.53 22.91l1.31-1.86c0.2-0.29 0.54-0.47 0.9-0.47h7.09v2.33H14.53z" />
      </g>
    </svg>
  );
}

const MODEL_APIS_DATA = [
  {
    id: "probe-1-robotics",
    name: "HOROS PROBE-1 (Humanoid Contact Policy)",
    developer: "HOROS Lab",
    icon: ShieldCheck,
    isFirstParty: true,
    promo: "Certified p-CBF Safety",
    promoUntil: "Zero crush damage guarantee",
    inputPrice: "$0.30",
    strikethroughCached: "$0.08",
    cachedPrice: "$0.03",
    cacheHitRate: "98.2% cache hit on trajectories",
    outputPrice: "$1.20",
    link: "/capabilities/Horos/Probe-1",
  },
  {
    id: "aeroprobe-1-aerospace",
    name: "HOROS AEROPROBE-1 (CFD Field Surrogate)",
    developer: "HOROS Lab",
    icon: Cpu,
    isFirstParty: true,
    promo: "Inverse Solver Active",
    promoUntil: "Real-time aerodynamic field",
    inputPrice: "$0.40",
    strikethroughCached: "$0.10",
    cachedPrice: "$0.04",
    cacheHitRate: "96.5% mesh prefix cache hit",
    outputPrice: "$1.60",
    link: "/capabilities/Horos/Aeroprobe-1",
  },
  {
    id: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    developer: "DeepSeek",
    icon: DeepSeekLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026",
    inputPrice: "$0.15",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "94.6% cache hit rate",
    outputPrice: "$0.60",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash%201017",
  },
  {
    id: "nemotron-3-5-30b",
    name: "Nemotron 3.5 Lightning 30B",
    developer: "NVIDIA",
    icon: NvidiaLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026",
    inputPrice: "$0.05",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "99.2% cache hit rate",
    outputPrice: "$0.15",
    link: "/capabilities/NVIDIA/Nemotron%203.5%20Lightning%2030B",
  },
  {
    id: "qwen3-8-27b",
    name: "Qwen 3.8 27B",
    developer: "Alibaba Cloud",
    icon: QwenLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026",
    inputPrice: "$0.10",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "97.1% cache hit rate",
    outputPrice: "$0.40",
    link: "/capabilities/Alibaba%20Cloud/Qwen3.8%2027B",
  },
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    developer: "Z.ai",
    icon: ZLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026",
    inputPrice: "$0.11",
    strikethroughCached: "$0.03",
    cachedPrice: "Free",
    cacheHitRate: "98.1% cache hit rate",
    outputPrice: "$0.45",
    link: "/capabilities/Z.ai/GLM%205.3%20Flash",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Frontier Model APIs",
    compute: "All open-weights & Horos models",
    lab: "All models + fine-tuned adapters",
    physical: "Custom checkpoints + private weights",
  },
  {
    feature: "Inference Engine",
    compute: "vLLM, SGLang & TensorRT-LLM",
    lab: "Auto-tuned kernels & Pareto search",
    physical: "Dedicated bare-metal H100/H200 nodes",
  },
  {
    feature: "Prefix & State Caching",
    compute: "Up to 90% discount on cache hits",
    lab: "Warm trajectory & rollout memory",
    physical: "Zero-latency dedicated NVMe KV cache",
  },
  {
    feature: "Autonomous Research Loops",
    compute: false,
    lab: "SFT, DPO, GRPO & RFT pipelines",
    physical: "Closed-loop hardware-in-the-loop (HIL)",
  },
  {
    feature: "Physical AI Programs",
    compute: "API access only",
    lab: "MuJoCo & Isaac Sim rollouts",
    physical: "PROBE-1 & AEROPROBE-1 private deployments",
  },
  {
    feature: "Outcome Verification",
    compute: "Token & latency traces",
    lab: "15-point benchmark harness",
    physical: "Certified p-CBF safety (0.0% damage)",
  },
  {
    feature: "Deployment Target",
    compute: "Multi-tenant cloud API",
    lab: "Isolated team workspace",
    physical: "Private VPC, on-prem & air-gapped",
  },
  {
    feature: "Support & SLA",
    compute: "Community & email",
    lab: "Priority research engineer",
    physical: "99.99% contractual SLA + direct Slack",
  },
];

export default function PricingPage() {
  const [selectedTrack, setSelectedTrack] = useState<"compute" | "lab" | "physical">("compute");
  const [creditAmount, setCreditAmount] = useState(50);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState("Frontier Compute (PAYG)");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    org: "",
    workload: "Foundation Research",
    volume: "10M - 100M tokens/month",
    notes: "",
  });

  const openModal = (planName: string) => {
    setModalPlan(planName);
    setSubmitted(false);
    setModalOpen(true);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("apply") === "founding") {
        openModal("Founding Cohort Track");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#151515] text-[#F0EFE2] font-sans selection:bg-[#76b900] selection:text-black flex flex-col relative overflow-x-hidden">
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

      <div className="relative z-[100]">
        <LandingNavbar dark onOpenFoundingCohort={() => openModal("Founding Cohort Track")} />
      </div>

      {/* Main Content Area - Auto-responsive fluid container framed within the 4 vertical guidelines */}
      <main className="flex-grow flex flex-col w-full relative z-10 pt-24 sm:pt-28 md:pt-32 pb-24 sm:pb-32">
        <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto flex flex-col px-4 sm:px-6 md:px-8 lg:px-10">

        {/* SECTION 1: Clean, Minimal Header - Left-aligned and Inline */}
        <section className="mb-8 sm:mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#76b900] font-mono text-[11px] font-semibold tracking-wider uppercase mb-3.5">
            <span className="w-1.5 h-1.5 bg-[#76b900] animate-pulse" />
            PRICING & INFRASTRUCTURE
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-medium tracking-tight text-[#F0EFE2] leading-tight flex items-center flex-wrap gap-2 sm:gap-2.5">
            <span>Frontier AI Research &</span>
            <span className="bg-[#76b900] text-black font-semibold px-2 py-0.5 rounded-none whitespace-nowrap">
              Lab Infrastructure
            </span>
          </h1>

          <p className="text-[#888] text-sm sm:text-base mt-3 max-w-2xl leading-relaxed">
            High-throughput model endpoints, autonomous research loops, and physical AI compute.
          </p>
        </section>

        {/* Active Cohort Notice: Minimal 1-line bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-[#161a13] border border-[#76b900]/30 text-xs mb-8">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-[#76b900] animate-pulse shrink-0" />
            <span className="font-mono text-[#76b900] font-semibold tracking-wide text-[11px]">
              FOUNDING COHORT ALLOCATION
            </span>
            <span className="text-[#555] hidden sm:inline">•</span>
            <span className="text-[#aaa] text-xs">
              Model endpoints, compiler autotuning, and physical AI clusters allocate in phased batches.
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#76b900] border border-[#76b900]/40 px-2 py-0.5 shrink-0 self-start sm:self-auto">
            PRIORITY ACCESS
          </span>
        </div>

        {/* SECTION 2: 3 Clean Architecture Track Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Track 1: Compute & Model APIs */}
          <div
            onClick={() => setSelectedTrack("compute")}
            className={`p-5 cursor-pointer transition-all border ${
              selectedTrack === "compute"
                ? "border-[#76b900] bg-[#181818] shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                : "border-[#262626] bg-[#141414] hover:border-[#444]"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Cpu size={16} className={selectedTrack === "compute" ? "text-[#76b900]" : "text-[#777]"} />
                <h2 className="text-base font-semibold text-[#F0EFE2]">Compute & Model API</h2>
              </div>
              <div
                className={`w-3 h-3 border transition-colors ${
                  selectedTrack === "compute" ? "border-[#76b900] bg-[#76b900]" : "border-[#444]"
                }`}
              />
            </div>
            <p className="text-[#888] text-xs mb-4 leading-relaxed">
              Pay-per-token model endpoints, verified kernels, and controlled inference harness.
            </p>
            <div className="pt-3 border-t border-[#222]">
              <span className="font-mono font-bold text-[#F0EFE2] text-sm">Pay As You Go</span>
              <span className="text-[11px] text-[#777] block mt-0.5">Top-up from $25 • Zero seat fees</span>
            </div>
          </div>

          {/* Track 2: Autonomous Research Lab */}
          <div
            onClick={() => setSelectedTrack("lab")}
            className={`p-5 cursor-pointer transition-all border ${
              selectedTrack === "lab"
                ? "border-[#76b900] bg-[#181818] shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                : "border-[#262626] bg-[#141414] hover:border-[#444]"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Workflow size={16} className={selectedTrack === "lab" ? "text-[#76b900]" : "text-[#777]"} />
                <h2 className="text-base font-semibold text-[#F0EFE2]">Autonomous Research Lab</h2>
              </div>
              <div
                className={`w-3 h-3 border transition-colors ${
                  selectedTrack === "lab" ? "border-[#76b900] bg-[#76b900]" : "border-[#444]"
                }`}
              />
            </div>
            <p className="text-[#888] text-xs mb-4 leading-relaxed">
              SFT/DPO/RL training orchestrator, 15-point benchmark suite, and rollout stores.
            </p>
            <div className="pt-3 border-t border-[#222]">
              <span className="font-mono font-bold text-[#F0EFE2] text-sm">From $190 / mo</span>
              <span className="text-[11px] text-[#777] block mt-0.5">Includes monthly research compute</span>
            </div>
          </div>

          {/* Track 3: Physical AI & Dedicated Clusters */}
          <div
            onClick={() => setSelectedTrack("physical")}
            className={`p-5 cursor-pointer transition-all border ${
              selectedTrack === "physical"
                ? "border-[#76b900] bg-[#181818] shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                : "border-[#262626] bg-[#141414] hover:border-[#444]"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={selectedTrack === "physical" ? "text-[#76b900]" : "text-[#777]"} />
                <h2 className="text-base font-semibold text-[#F0EFE2]">Physical AI & Clusters</h2>
              </div>
              <div
                className={`w-3 h-3 border transition-colors ${
                  selectedTrack === "physical" ? "border-[#76b900] bg-[#76b900]" : "border-[#444]"
                }`}
              />
            </div>
            <p className="text-[#888] text-xs mb-4 leading-relaxed">
              PROBE-1 (Humanoids), AEROPROBE-1 (Aerospace), and dedicated H100 bare-metal clusters.
            </p>
            <div className="pt-3 border-t border-[#222]">
              <span className="font-mono font-bold text-[#F0EFE2] text-sm">Custom Contracts</span>
              <span className="text-[11px] text-[#777] block mt-0.5">Private VPC & Air-Gapped Deployments</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Dynamic View by Selected Track */}

        {/* TRACK 1: Compute & Model API */}
        {selectedTrack === "compute" && (
          <section className="mb-14">
            <div className="border border-[#262626] bg-[#141414] grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Top-Up */}
              <div className="p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-medium text-[#F0EFE2]">Frontier Compute Top-Up</h2>
                    <span className="text-[11px] font-mono bg-[#1a1a1a] border border-[#333] px-2 py-0.5 text-[#aaa]">
                      PAYG
                    </span>
                  </div>
                  <p className="text-[#888] text-xs mb-6">
                    Direct access to open-weights & Horos compiled kernels on one unified balance.
                  </p>

                  <div className="mb-6">
                    <label className="text-[10px] text-[#777] font-semibold uppercase tracking-widest mb-2 block">
                      TOP-UP AMOUNT
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {[25, 50, 100, 250, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCreditAmount(amt)}
                          className={`text-xs px-3 py-1 font-mono transition-colors border ${
                            creditAmount === amt
                              ? "bg-[#76b900] text-black border-[#76b900] font-bold"
                              : "bg-[#1c1c1c] text-[#888] border-[#333] hover:text-white"
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F0EFE2] font-semibold text-base">
                        $
                      </span>
                      <input
                        type="number"
                        min="25"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#0d0d0d] border border-[#333] py-2.5 pl-8 pr-3 text-[#F0EFE2] font-mono text-base focus:outline-none focus:border-[#76b900] transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-[#777]">
                      <span>No expiration for 12 months.</span>
                      <span className="text-[#76b900] font-mono">~{Math.round((creditAmount / 0.15) * 10) / 10}M tokens estimate</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#bbb] mb-6">
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>vLLM, SGLang, and TensorRT-LLM runtimes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Up to 90% discount on cached context prefixes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Standard OpenAI and Anthropic API compatibility</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal(`Compute PAYG ($${creditAmount})`)}
                  className="w-full bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs sm:text-sm py-3 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                >
                  Apply for Compute Cohort <ChevronRight size={15} strokeWidth={2.5} className="ml-1" />
                </button>
              </div>

              {/* Right Column: Architectural Highlights */}
              <div className="p-6 sm:p-7 border-t md:border-t-0 md:border-l border-[#262626] bg-[#121212] flex flex-col justify-between">
                <div>
                  <div className="mb-4">
                    <span className="text-[10px] font-mono text-[#76b900] uppercase tracking-wider block mb-1">
                      HOROS RUNTIME COMPILER
                    </span>
                    <h2 className="text-xl font-medium text-[#F0EFE2] mb-1">Universal IR & Kernel Autotuning</h2>
                    <p className="text-[#888] text-xs">
                      Universal computation graphs optimized across memory and compiled to verified hardware kernels.
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="p-3 bg-[#161616] border border-[#262626] text-xs">
                      <div className="flex items-center justify-between text-[#F0EFE2] font-semibold mb-0.5">
                        <span>Dynamic Speculative Decoding</span>
                        <span className="font-mono text-[#76b900]">2.8x speedup</span>
                      </div>
                      <p className="text-[11px] text-[#777]">Draft verification routes smaller helper models to predict tokens ahead of time.</p>
                    </div>

                    <div className="p-3 bg-[#161616] border border-[#262626] text-xs">
                      <div className="flex items-center justify-between text-[#F0EFE2] font-semibold mb-0.5">
                        <span>Paged KV Memory Cache</span>
                        <span className="font-mono text-[#76b900]">Zero OOM</span>
                      </div>
                      <p className="text-[11px] text-[#777]">Virtual memory allocation eliminates fragmentation during long inference sessions.</p>
                    </div>

                    <div className="p-3 bg-[#161616] border border-[#262626] text-xs">
                      <div className="flex items-center justify-between text-[#F0EFE2] font-semibold mb-0.5">
                        <span>Outcome Contract Tracing</span>
                        <span className="font-mono text-[#76b900]">Verified Evidence</span>
                      </div>
                      <p className="text-[11px] text-[#777]">Every token records latency, GPU wattage, and causal verification lineage.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Research Infra API Track")}
                  className="w-full bg-[#1e1e1e] hover:bg-[#252525] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-xs sm:text-sm py-3 flex items-center justify-center transition-colors cursor-pointer"
                >
                  Request API Ingestion Keys <ChevronRight size={14} className="ml-1 text-[#888]" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TRACK 2: Autonomous Research Lab */}
        {selectedTrack === "lab" && (
          <section className="mb-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Explorer Tier */}
              <div className="border border-[#262626] bg-[#141414] p-5 sm:p-6 flex flex-col justify-between hover:border-[#444] transition-colors">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-semibold text-[#F0EFE2]">Lab Explorer</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#182012] border border-[#76b900]/40 px-1.5 py-0.2">RESEARCH</span>
                  </div>
                  <div className="text-3xl font-bold text-[#F0EFE2] font-mono tracking-tight my-2">
                    $190 <span className="text-xs font-normal text-[#888]">/ mo</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-4">Includes $100 compute credits</p>

                  <div className="space-y-2 text-xs mb-6 text-[#aaa]">
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>5 concurrent research missions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>LoRA & SFT task adaptation engine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>15-point benchmark harness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Trajectory store for 1,000 episodes</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Lab Explorer ($190/mo)")}
                  className="w-full bg-[#1e1e1e] hover:bg-[#252525] text-[#F0EFE2] border border-[#333] hover:border-[#76b900] font-semibold text-xs py-2.5 flex items-center justify-center transition-colors cursor-pointer"
                >
                  Apply for Explorer Cohort <ChevronRight size={14} className="ml-1" />
                </button>
              </div>

              {/* Lab Pro Tier */}
              <div className="border border-[#76b900] bg-[#151c11] p-5 sm:p-6 flex flex-col justify-between shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)] relative">
                <div className="absolute -top-2.5 right-3 bg-[#76b900] text-black font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  RECOMMENDED FOR LABS
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-semibold text-[#F0EFE2]">Frontier Lab Pro</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#182012] border border-[#76b900]/40 px-1.5 py-0.2">AUTONOMOUS</span>
                  </div>
                  <div className="text-3xl font-bold text-[#F0EFE2] font-mono tracking-tight my-2">
                    $690 <span className="text-xs font-normal text-[#888]">/ mo</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-4">Includes $450 compute credits</p>

                  <div className="space-y-2 text-xs mb-6 text-[#bbb]">
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Unlimited autonomous research missions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Full Post-Training: SFT, DPO, GRPO & RFT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Causal Experiment Engine & failure mining</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>RL Environment Factory with rollouts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Priority allocation on H100 SXM5 nodes</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Frontier Lab Pro ($690/mo)")}
                  className="w-full bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs py-2.5 flex items-center justify-center transition-colors cursor-pointer shadow-md"
                >
                  Apply for Pro Lab Cohort <ChevronRight size={14} className="ml-1" />
                </button>
              </div>

              {/* Cluster Team Tier */}
              <div className="border border-[#262626] bg-[#141414] p-5 sm:p-6 flex flex-col justify-between hover:border-[#444] transition-colors">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-base font-semibold text-[#F0EFE2]">Cluster Team</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#182012] border border-[#76b900]/40 px-1.5 py-0.2">SCALE</span>
                  </div>
                  <div className="text-3xl font-bold text-[#F0EFE2] font-mono tracking-tight my-2">
                    $1,950 <span className="text-xs font-normal text-[#888]">/ mo</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-4">Includes $1,500 compute credits</p>

                  <div className="space-y-2 text-xs mb-6 text-[#aaa]">
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Distributed rollout & trainer worker pools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Teaching-Data Admission Gate & contamination check</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Multi-node benchmarking & cold-start profiling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={13} className="text-[#76b900] shrink-0" />
                      <span>Full team RBAC & workspace isolation</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Cluster Team ($1950/mo)")}
                  className="w-full bg-[#1e1e1e] hover:bg-[#252525] text-[#F0EFE2] border border-[#333] hover:border-[#76b900] font-semibold text-xs py-2.5 flex items-center justify-center transition-colors cursor-pointer"
                >
                  Apply for Cluster Team <ChevronRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TRACK 3: Physical AI & Dedicated Clusters */}
        {selectedTrack === "physical" && (
          <section className="mb-14">
            <div className="border border-[#76b900]/40 bg-[#141812] p-6 sm:p-7">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#76b900]/10 border border-[#76b900]/40 text-[#76b900] text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#76b900] animate-pulse" />
                    FIRST-PARTY MODEL PROGRAMS & INDUSTRIAL COHORTS
                  </div>
                  <h2 className="text-2xl font-medium text-[#F0EFE2] tracking-tight">
                    Physical Intelligence & Dedicated GPU Infrastructure
                  </h2>
                  <p className="text-xs text-[#aaa] leading-relaxed">
                    Deploy dedicated bare-metal H100/H200 clusters with certified p-CBF safety and private weights for robotics, aerospace, and defense facilities.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Enterprise & Physical AI Cohort")}
                  className="w-full md:w-auto bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs sm:text-sm px-6 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                >
                  <span>Apply for Dedicated Cohort</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* 2 Program Callout Cards: Clean, concise, no walls of text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-[#262626]">
                {/* PROBE-1 */}
                <div className="p-4 bg-[#141414] border border-[#262626] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#76b900]">PROGRAM 01</span>
                    <span className="text-[10px] font-mono text-[#888] bg-[#1a1a1a] px-2 py-0.5 border border-[#333]">HUMANOID ROBOTICS</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F0EFE2]">PROBE-1 Tactile & Contact Policy</h3>
                  <p className="text-xs text-[#888] leading-relaxed">
                    Multifingered hand manipulation, nonstationary contact states, and predictive Control Barrier Functions (0.0% drops/crushes).
                  </p>
                  <div className="flex items-center gap-2.5 text-[11px] text-[#76b900] font-mono pt-1">
                    <span>• Hardware-in-the-Loop</span>
                    <span>• MuJoCo & Isaac Sim</span>
                    <span>• ROS2 Telemetry</span>
                  </div>
                </div>

                {/* AEROPROBE-1 */}
                <div className="p-4 bg-[#141414] border border-[#262626] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#76b900]">PROGRAM 02</span>
                    <span className="text-[10px] font-mono text-[#888] bg-[#1a1a1a] px-2 py-0.5 border border-[#333]">AEROSPACE ENGINEERING</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F0EFE2]">AEROPROBE-1 Fluid & CFD Surrogate</h3>
                  <p className="text-xs text-[#888] leading-relaxed">
                    Aerodynamic pressure and velocity field surrogate models with inverse parameter estimation calibrated against wind tunnel and OpenFOAM data.
                  </p>
                  <div className="flex items-center gap-2.5 text-[11px] text-[#76b900] font-mono pt-1">
                    <span>• Mach/Reynolds Inputs</span>
                    <span>• Mesh Conditioning</span>
                    <span>• Inverse Solvers</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: Model APIs & Lab Weights Table */}
        <section id="model-apis-pricing" className="mb-20 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-[#76b900] text-xs font-mono font-medium tracking-wider uppercase mb-1">
                FRONTIER MODEL APIS & LAB WEIGHTS
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#F0EFE2] tracking-tight">
                Pay for model tokens, not idle capacity
              </h2>
            </div>

            <span className="text-[11px] text-[#888] font-mono border border-[#333] bg-[#181818] px-3 py-1 shrink-0 self-start sm:self-auto">
              Price per 1M tokens
            </span>
          </div>

          {/* Table Container: Solid clean border, no dashed borders */}
          <div className="w-full border border-[#262626] bg-[#141414] overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-[3fr_1.1fr_1.8fr_1.1fr_1.2fr] px-4 sm:px-5 py-3 border-b border-[#262626] text-xs font-medium text-[#777]">
                <div>Model</div>
                <div>Input</div>
                <div>Cached input</div>
                <div>Output</div>
                <div></div>
              </div>

              {/* Rows */}
              {MODEL_APIS_DATA.map((model, idx) => {
                const IconComponent = model.icon;
                return (
                  <Link
                    key={model.id}
                    href={model.link}
                    className={`grid grid-cols-[3fr_1.1fr_1.8fr_1.1fr_1.2fr] px-4 sm:px-5 py-3.5 items-center group hover:bg-[#1a1a1a] transition-colors ${
                      idx < MODEL_APIS_DATA.length - 1 ? "border-b border-[#222]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-3">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <IconComponent size={18} />
                      </div>
                      <span className="font-semibold text-[#F0EFE2] text-sm group-hover:text-[#76b900] transition-colors truncate">
                        {model.name}
                      </span>
                    </div>

                    <div className="font-semibold text-[#F0EFE2] text-sm font-mono">
                      {model.inputPrice}
                    </div>

                    <div className="flex flex-col justify-center">
                      <span className="line-through text-[#666] text-[11px] font-mono leading-none mb-0.5">
                        {model.strikethroughCached}
                      </span>
                      <span className="font-bold text-[#F0EFE2] text-sm leading-tight">
                        {model.cachedPrice}
                      </span>
                      <span className="text-[10px] text-[#666] mt-0.5">
                        {model.cacheHitRate}
                      </span>
                    </div>

                    <div className="font-semibold text-[#F0EFE2] text-sm font-mono">
                      {model.outputPrice}
                    </div>

                    <div className="flex justify-end">
                      <span className="text-xs text-[#888] group-hover:text-[#F0EFE2] flex items-center gap-1 font-medium transition-colors">
                        View model <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5: Clean Comparison Matrix */}
        <section className="mb-20">
          <div className="w-full border border-[#262626] bg-[#141414] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#262626]">
              <h2 className="text-lg font-semibold text-[#F0EFE2] mb-1 tracking-tight">
                Compare Architecture Tiers
              </h2>
              <p className="text-xs text-[#888]">
                Self-serve compute is funded by flexible top-ups. Lab and Physical tiers add autonomous orchestration and private cluster hardware.
              </p>
            </div>

            {/* Matrix Header */}
            <div className="grid grid-cols-[1.2fr_1.2fr_1.2fr_1.2fr] divide-x divide-[#262626] border-b border-[#262626] bg-[#161616]">
              <div className="p-3.5 sm:p-4 text-xs font-medium text-[#777]">Feature</div>
              <div className="p-3.5 sm:p-4 text-xs font-semibold text-[#F0EFE2]">Compute (PAYG)</div>
              <div className="p-3.5 sm:p-4 text-xs font-semibold text-[#F0EFE2]">Autonomous Lab</div>
              <div className="p-3.5 sm:p-4 text-xs font-semibold text-[#F0EFE2]">Physical AI Clusters</div>
            </div>

            {/* Rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1.2fr_1.2fr_1.2fr_1.2fr] divide-x divide-[#262626] border-b border-[#202020] text-xs ${
                  i % 2 === 1 ? "bg-[#161616]/40" : "bg-transparent"
                }`}
              >
                <div className="p-3.5 text-[#aaa]">{row.feature}</div>
                <div className="p-3.5 text-[#F0EFE2]">
                  {typeof row.compute === "boolean" ? (
                    row.compute ? <Check size={15} className="text-[#76b900]" /> : <X size={14} className="text-[#555]" />
                  ) : (
                    row.compute
                  )}
                </div>
                <div className="p-3.5 text-[#F0EFE2]">
                  {typeof row.lab === "boolean" ? (
                    row.lab ? <Check size={15} className="text-[#76b900]" /> : <X size={14} className="text-[#555]" />
                  ) : (
                    row.lab
                  )}
                </div>
                <div className="p-3.5 text-[#F0EFE2]">
                  {typeof row.physical === "boolean" ? (
                    row.physical ? <Check size={15} className="text-[#76b900]" /> : <X size={14} className="text-[#555]" />
                  ) : (
                    row.physical
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        </div>
      </main>

      <GlobalFooter />

      {/* Cohort Application Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#161616] border border-[#333] p-6 text-[#F0EFE2] shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#888] hover:text-[#F0EFE2]"
            >
              <X size={18} />
            </button>

            {!submitted ? (
              <div>
                <div className="mb-4">
                  <span className="text-[10px] font-mono text-[#76b900] uppercase tracking-wider block mb-1">
                    FOUNDING COHORT ACCESS
                  </span>
                  <h3 className="text-xl font-bold">{modalPlan}</h3>
                  <p className="text-xs text-[#888] mt-1">
                    Reserve your allocation in our phased research cluster deployment.
                  </p>
                </div>

                <form onSubmit={handleSubmitApplication} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-[#888] uppercase block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#101010] border border-[#333] px-3 py-2 text-xs text-[#F0EFE2] outline-none focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#888] uppercase block mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@lab.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#101010] border border-[#333] px-3 py-2 text-xs text-[#F0EFE2] outline-none focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#888] uppercase block mb-1">Organization / Lab</label>
                    <input
                      type="text"
                      required
                      placeholder="Autonomous Systems Lab"
                      value={formData.org}
                      onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                      className="w-full bg-[#101010] border border-[#333] px-3 py-2 text-xs text-[#F0EFE2] outline-none focus:border-[#76b900]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs py-2.5 mt-4 transition-colors"
                  >
                    Submit Application
                  </button>
                </form>
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <div className="w-10 h-10 bg-[#76b900]/20 text-[#76b900] mx-auto flex items-center justify-center">
                  <Check size={20} />
                </div>
                <h3 className="text-lg font-bold text-[#F0EFE2]">Application Received</h3>
                <p className="text-xs text-[#888]">
                  Our research engineering team will review your allocation request and reach out via email.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-[#222] hover:bg-[#333] text-xs px-4 py-2 text-[#eee]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

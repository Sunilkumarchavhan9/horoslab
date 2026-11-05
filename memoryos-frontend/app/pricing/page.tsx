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
import { HorosIcon } from "@/components/horos/primitives/horos-logo";

const founderEmail = "chavhansunilkumar753@gmail.com";

function HorosModelLogo({ size = 20, className }: { size?: number; className?: string }) {
  return <HorosIcon width={size} height={size} className={className || "text-[#F0EFE2]"} />;
}

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
  // First-party HOROS Foundation Models
  {
    id: "probe-1-robotics",
    name: "PROBE-1",
    developer: "HOROS Lab",
    icon: HorosModelLogo,
    isFirstParty: true,
    inputPrice: "$0.30",
    cachedPrice: "$0.03",
    cacheHitRate: "98.2% cache hit, last 24 hours",
    outputPrice: "$1.20",
    link: "/capabilities/Horos/Probe-1",
  },
  {
    id: "aeroprobe-1-aerospace",
    name: "AEROPROBE-1",
    developer: "HOROS Lab",
    icon: HorosModelLogo,
    isFirstParty: true,
    inputPrice: "$0.40",
    cachedPrice: "$0.04",
    cacheHitRate: "96.5% cache hit, last 24 hours",
    outputPrice: "$1.60",
    link: "/capabilities/Horos/Aeroprobe-1",
  },
  // Open-weights & Partner Models from catalog
  {
    id: "deepseek-v4-1-flash-1017",
    name: "DeepSeek V4.1 Flash 1017",
    developer: "DeepSeek",
    icon: DeepSeekLogo,
    inputPrice: "$0.15",
    cachedPrice: "$0.01",
    cacheHitRate: "99.5% cache hit, last 24 hours",
    outputPrice: "$0.60",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash%201017",
  },
  {
    id: "glm-5-3",
    name: "GLM 5.3",
    developer: "Z.ai",
    icon: ZLogo,
    inputPrice: "$1.30",
    cachedPrice: "$0.13",
    cacheHitRate: "99.1% cache hit, last 24 hours",
    outputPrice: "$4.20",
    link: "/capabilities/Z.ai/GLM%205.3",
  },
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    developer: "Z.ai",
    icon: ZLogo,
    inputPrice: "$0.11",
    cachedPrice: "$0.03",
    cacheHitRate: "99.3% cache hit, last 24 hours",
    outputPrice: "$0.45",
    link: "/capabilities/Z.ai/GLM%205.3%20Flash",
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Nemotron 3.5 Lightning 30B",
    developer: "NVIDIA",
    icon: NvidiaLogo,
    inputPrice: "$0.05",
    cachedPrice: "$0.01",
    cacheHitRate: "",
    outputPrice: "$0.15",
    link: "/capabilities/NVIDIA/Nemotron%203.5%20Lightning%2030B",
  },
  {
    id: "qwen3-8-27b",
    name: "Qwen3.8 27B",
    developer: "Alibaba Cloud",
    icon: QwenLogo,
    inputPrice: "$0.10",
    cachedPrice: "$0.01",
    cacheHitRate: "95.7% cache hit, last 24 hours",
    outputPrice: "$0.40",
    link: "/capabilities/Alibaba%20Cloud/Qwen3.8%2027B",
  },
  {
    id: "ornith-1-5-35b",
    name: "Ornith 1.5 35B",
    developer: "Ornith",
    icon: OrnithLogo,
    inputPrice: "$0.10",
    cachedPrice: "$0.01",
    cacheHitRate: "94.3% cache hit, last 24 hours",
    outputPrice: "$0.40",
    link: "/capabilities/Ornith/Ornith%201.5%2035B",
  },
  {
    id: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    developer: "DeepSeek",
    icon: DeepSeekLogo,
    inputPrice: "$0.14",
    cachedPrice: "$0.03",
    cacheHitRate: "98.8% cache hit, last 24 hours",
    outputPrice: "$0.58",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash",
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
  const [highlightedModelId, setHighlightedModelId] = useState<string>("deepseek-v4-1-flash-1017");
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
        <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto flex flex-col px-4 sm:px-6 md:px-8 lg:px-10 mb-6 sm:mb-8">
          {/* SECTION 1: Clean, Minimal Header - Left-aligned and Inline */}
          <section className="text-left">
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
        </div>

        {/* Section Divider dashed line with HOROS brand logo and + crosshairs */}
        <SectionDivider className="mb-10 sm:mb-12" />

        <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto flex flex-col px-4 sm:px-6 md:px-8 lg:px-10">
          {/* SECTION 2: 3 Clean Architecture Track Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {/* Track 1: Compute & Model APIs */}
            <div
              onClick={() => setSelectedTrack("compute")}
              className={`p-6 sm:p-7 cursor-pointer transition-all border border-dashed flex flex-col justify-between min-h-[195px] ${
                selectedTrack === "compute"
                  ? "border-[#76b900] bg-[#151515] shadow-[0_0_20px_-10px_rgba(118,185,0,0.25)]"
                  : "border-[#333] bg-[#151515] hover:border-[#555]"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <Cpu size={16} className={selectedTrack === "compute" ? "text-[#76b900]" : "text-[#777]"} />
                    <h2 className="text-base font-semibold text-[#F0EFE2] tracking-tight">Compute & Model API</h2>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                      selectedTrack === "compute" ? "border-[#76b900] bg-[#76b900]/15" : "border-[#444]"
                    }`}
                  >
                    {selectedTrack === "compute" && <div className="w-1.5 h-1.5 bg-[#76b900]" />}
                  </div>
                </div>
                <p className="text-[#888] text-xs sm:text-[13px] leading-relaxed font-normal">
                  Pay-per-token model endpoints, verified kernels, and controlled inference harness.
                </p>
              </div>
              <div className="pt-5">
                <span className="font-mono font-bold text-[#F0EFE2] text-sm block">Pay As You Go</span>
                <span className="text-[11px] text-[#777] block mt-0.5">Top-up from $5 • Zero seat fees</span>
              </div>
            </div>

            {/* Track 2: Autonomous Research Lab */}
            <div
              onClick={() => setSelectedTrack("lab")}
              className={`p-6 sm:p-7 cursor-pointer transition-all border border-dashed flex flex-col justify-between min-h-[195px] ${
                selectedTrack === "lab"
                  ? "border-[#76b900] bg-[#151515] shadow-[0_0_20px_-10px_rgba(118,185,0,0.25)]"
                  : "border-[#333] bg-[#151515] hover:border-[#555]"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <Workflow size={16} className={selectedTrack === "lab" ? "text-[#76b900]" : "text-[#777]"} />
                    <h2 className="text-base font-semibold text-[#F0EFE2] tracking-tight">Autonomous Research Lab</h2>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                      selectedTrack === "lab" ? "border-[#76b900] bg-[#76b900]/15" : "border-[#444]"
                    }`}
                  >
                    {selectedTrack === "lab" && <div className="w-1.5 h-1.5 bg-[#76b900]" />}
                  </div>
                </div>
                <p className="text-[#888] text-xs sm:text-[13px] leading-relaxed font-normal">
                  SFT/DPO/RL training orchestrator, 15-point benchmark suite, and rollout stores.
                </p>
              </div>
              <div className="pt-5">
                <span className="font-mono font-bold text-[#F0EFE2] text-sm block">From $190 / mo</span>
                <span className="text-[11px] text-[#777] block mt-0.5">Includes monthly research compute</span>
              </div>
            </div>

            {/* Track 3: Physical AI & Dedicated Clusters */}
            <div
              onClick={() => setSelectedTrack("physical")}
              className={`p-6 sm:p-7 cursor-pointer transition-all border border-dashed flex flex-col justify-between min-h-[195px] ${
                selectedTrack === "physical"
                  ? "border-[#76b900] bg-[#151515] shadow-[0_0_20px_-10px_rgba(118,185,0,0.25)]"
                  : "border-[#333] bg-[#151515] hover:border-[#555]"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className={selectedTrack === "physical" ? "text-[#76b900]" : "text-[#777]"} />
                    <h2 className="text-base font-semibold text-[#F0EFE2] tracking-tight">Physical AI & Clusters</h2>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                      selectedTrack === "physical" ? "border-[#76b900] bg-[#76b900]/15" : "border-[#444]"
                    }`}
                  >
                    {selectedTrack === "physical" && <div className="w-1.5 h-1.5 bg-[#76b900]" />}
                  </div>
                </div>
                <p className="text-[#888] text-xs sm:text-[13px] leading-relaxed font-normal">
                  PROBE-1 (Humanoids), AEROPROBE-1 (Aerospace), and dedicated H100 bare-metal clusters.
                </p>
              </div>
              <div className="pt-5">
                <span className="font-mono font-bold text-[#F0EFE2] text-sm block">Custom Contracts</span>
                <span className="text-[11px] text-[#777] block mt-0.5">Private VPC & Air-Gapped Deployments</span>
              </div>
            </div>
          </div>

        {/* SECTION 3: Dynamic View by Selected Track */}

        {/* TRACK 1: Compute & Model API - Pay as you go vs Enterprise Split */}
        {selectedTrack === "compute" && (
          <section className="mb-14">
            <div className="border border-dashed border-[#333] bg-[#151515] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dashed divide-[#333]">
              {/* Left Column: Pay as you go */}
              <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#F0EFE2]">Pay as you go</h2>
                    <span className="text-[11px] font-mono tracking-wide bg-[#202020] border border-[#333] px-2.5 py-1 text-[#aaa] flex items-center gap-1.5">
                      <span className="text-[#76b900] font-bold">#</span> No subscription
                    </span>
                  </div>
                  <p className="text-[#888] text-xs sm:text-[13px] mb-6">
                    Hosted Model APIs, per token, on one prepaid balance.
                  </p>

                  <div className="mb-6">
                    <label className="text-[10px] text-[#777] font-semibold uppercase tracking-widest mb-2.5 block">
                      AMOUNT IN DOLLARS
                    </label>

                    {/* Quick amount presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      {[5, 20, 50, 100, 250].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCreditAmount(amt)}
                          className={`text-xs px-2.5 py-1 font-mono transition-colors border ${
                            creditAmount === amt
                              ? "bg-[#76b900] text-black border-[#76b900] font-bold"
                              : "bg-[#151515] text-[#888] border border-dashed border-[#333] hover:text-white hover:border-[#555]"
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    <div className="relative mb-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0EFE2] font-medium text-sm sm:text-base">
                        $
                      </span>
                      <input
                        type="number"
                        min="5"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#151515] border border-dashed border-[#333] py-2 pl-7 pr-3 text-[#F0EFE2] font-mono text-sm sm:text-base focus:outline-none focus:border-[#76b900] transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#777]">
                      <span>$5 minimum top-up. Pay per token.</span>
                      <span className="text-[#76b900] font-mono">~{Math.round((creditAmount / 0.15) * 10) / 10}M tokens estimate</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-xs sm:text-sm text-[#F0EFE2] mb-3">What's included</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-[#bbb]">
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>OpenAI-compatible chat completions and Anthropic-compatible Messages</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Per-token pricing with cached input discounts on supported models</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Session-aware routing keeps agent replays warm</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>One prepaid balance, no seats, no per-user fees</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-center text-[11px] text-[#777] mb-3">
                    Get $1 free to test the Model APIs.
                  </p>
                  <Link
                    href={`/sign-up?plan=payg&amount=${creditAmount}`}
                    className="w-full bg-[#76b900] hover:bg-[#86dc00] text-black font-semibold text-xs sm:text-sm py-2 sm:py-2.5 flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Direct Signup & Add Credits</span>
                    <ChevronRight size={15} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>

              {/* Right Column: Enterprise */}
              <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full bg-[#151515]">
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#F0EFE2] mb-1.5">Enterprise</h2>
                    <p className="text-[#888] text-xs sm:text-[13px] leading-relaxed">
                      Dedicated infrastructure, compliance, and custom volume.
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-[#F0EFE2] font-mono mb-5">
                      Custom pricing
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-[#F0EFE2] mb-3">
                      Everything self-serve includes, plus
                    </p>
                    <ul className="space-y-3 text-xs text-[#bbb]">
                      <li className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Audit logs and role-based access control (RBAC)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Custom volume and contract terms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Custom SLAs up to 99.99%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Enterprise compliance and dedicated security controls</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Dedicated CSM and private Slack</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://cal.com/vegito?tier=Enterprise&notes=Tier%3A+Enterprise"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1e1e1e] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-xs sm:text-sm py-2 sm:py-2.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Book a Call (Enterprise Demo)</span>
                    <ChevronRight size={15} strokeWidth={2} className="text-[#888]" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TRACK 2: Autonomous Research Lab */}
        {selectedTrack === "lab" && (
          <section className="mb-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Explorer Tier */}
              <div className="border border-dashed border-[#333] bg-[#151515] p-6 sm:p-7 md:p-8 flex flex-col justify-between hover:border-[#555] transition-all min-h-[470px]">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-[#F0EFE2] tracking-tight">Lab Explorer</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#76b900]/10 border border-dashed border-[#76b900]/40 px-2 py-0.5">
                      RESEARCH
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-[#F0EFE2] font-mono tracking-tight my-3">
                    $190 <span className="text-xs font-normal text-[#888]">/ mo</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-6">Includes $100 compute credits</p>

                  <div className="space-y-3.5 mb-8 text-xs sm:text-[13px] text-[#aaa]">
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>5 concurrent research missions</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>LoRA & SFT task adaptation engine</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>15-point benchmark harness</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Trajectory store for 1,000 episodes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/sign-up?plan=lab-explorer"
                    className="w-full bg-[#1e1e1e] hover:bg-[#252525] text-[#F0EFE2] border border-dashed border-[#444] hover:border-[#76b900] font-semibold text-xs py-2 sm:py-2.5 flex items-center justify-center transition-all cursor-pointer"
                  >
                    Direct Signup <ChevronRight size={14} className="ml-1" />
                  </Link>
                  <a
                    href="https://cal.com/vegito?tier=Lab+Explorer&notes=Tier%3A+Lab+Explorer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-[11px] text-[#888] hover:text-[#76b900] hover:underline block mt-2 font-mono"
                  >
                    Or Book a Call via Cal.com &rarr;
                  </a>
                </div>
              </div>

              {/* Lab Pro Tier (Recommended) */}
              <div className="border border-dashed border-[#76b900] bg-[#151515] p-6 sm:p-7 md:p-8 flex flex-col justify-between shadow-[0_0_25px_-10px_rgba(118,185,0,0.25)] relative min-h-[470px]">
                <div className="absolute -top-3 right-4 bg-[#76b900] text-black font-mono text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                  RECOMMENDED FOR LABS
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-[#F0EFE2] tracking-tight">Frontier Lab Pro</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#76b900]/10 border border-dashed border-[#76b900]/40 px-2 py-0.5">
                      AUTONOMOUS
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-[#F0EFE2] font-mono tracking-tight my-3">
                    $690 <span className="text-xs font-normal text-[#888]">/ mo</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-6">Includes $450 compute credits</p>

                  <div className="space-y-3.5 mb-8 text-xs sm:text-[13px] text-[#ccc]">
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Unlimited autonomous research missions</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Full Post-Training: SFT, DPO, GRPO & RFT</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Causal Experiment Engine & failure mining</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>RL Environment Factory with rollouts</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Priority allocation on H100 SXM5 nodes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/sign-up?plan=frontier-lab-pro"
                    className="w-full bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs py-2 sm:py-2.5 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  >
                    Direct Signup <ChevronRight size={14} className="ml-1" />
                  </Link>
                  <a
                    href="https://cal.com/vegito?tier=Frontier+Lab+Pro&notes=Tier%3A+Frontier+Lab+Pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-[11px] text-[#76b900] hover:underline block mt-2 font-mono font-medium"
                  >
                    Or Book a Call via Cal.com &rarr;
                  </a>
                </div>
              </div>

              {/* Cluster Team Tier */}
              <div className="border border-dashed border-[#333] bg-[#151515] p-6 sm:p-7 md:p-8 flex flex-col justify-between hover:border-[#555] transition-all min-h-[470px]">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-[#F0EFE2] tracking-tight">Cluster Team</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#76b900]/10 border border-dashed border-[#76b900]/40 px-2 py-0.5">
                      SCALE
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-[#F0EFE2] font-mono tracking-tight my-3">
                    $1,950 <span className="text-xs font-normal text-[#888]">/ mo</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-6">Includes $1,500 compute credits</p>

                  <div className="space-y-3.5 mb-8 text-xs sm:text-[13px] text-[#aaa]">
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Distributed rollout & trainer worker pools</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Teaching-Data Admission Gate & contamination check</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Multi-node benchmarking & cold-start profiling</span>
                    </div>
                    <div className="flex items-start gap-2.5 leading-relaxed">
                      <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                      <span>Full team RBAC & workspace isolation</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://cal.com/vegito?tier=Cluster+Team&notes=Tier%3A+Cluster+Team"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1e1e1e] hover:bg-[#252525] text-[#F0EFE2] border border-dashed border-[#444] hover:border-[#76b900] font-semibold text-xs py-2 sm:py-2.5 flex items-center justify-center transition-all cursor-pointer"
                  >
                    Book a Call via Cal.com <ChevronRight size={14} className="ml-1" />
                  </a>
                  <Link
                    href="/sign-up?plan=cluster-team"
                    className="text-center text-[11px] text-[#888] hover:text-[#76b900] hover:underline block mt-2 font-mono"
                  >
                    Or Direct Signup &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TRACK 3: Physical AI & Dedicated Clusters */}
        {selectedTrack === "physical" && (
          <section className="mb-14">
            <div className="border border-dashed border-[#333] bg-[#151515]">
              {/* Top Header Row */}
              <div className="p-6 sm:p-8 lg:p-9 border-b border-dashed border-[#333] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#76b900]/10 border border-dashed border-[#76b900]/40 text-[#76b900] text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#76b900] animate-pulse" />
                    FIRST-PARTY MODEL PROGRAMS & INDUSTRIAL COHORTS
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F0EFE2] tracking-tight">
                    Physical Intelligence & Dedicated GPU Infrastructure
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#888] leading-relaxed">
                    Deploy dedicated bare-metal H100/H200 clusters with certified p-CBF safety and private weights for robotics, aerospace, and defense facilities.
                  </p>
                </div>

                <a
                  href="https://cal.com/vegito?tier=Physical+AI+Dedicated+Cohort&notes=Tier%3A+Physical+AI+Dedicated+Cohort"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#76b900] hover:bg-[#86dc00] text-black font-semibold text-xs py-2 sm:py-2.5 px-5 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap self-start md:self-auto"
                >
                  <span>Book a Call via Cal.com</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </a>
              </div>

              {/* 2 Program Columns: Spacious, de-cluttered, unified split layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dashed divide-[#333]">
                {/* PROBE-1 */}
                <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-[#76b900] tracking-wider">PROGRAM 01</span>
                      <span className="text-[10px] font-mono text-[#aaa] bg-[#202020] border border-dashed border-[#333] px-2.5 py-0.5">
                        HUMANOID ROBOTICS
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#F0EFE2] mb-2 tracking-tight">
                      PROBE-1 Tactile & Contact Policy
                    </h3>

                    <p className="text-xs sm:text-[13px] text-[#888] leading-relaxed mb-6">
                      Multifingered hand manipulation, nonstationary contact states, and predictive Control Barrier Functions with guaranteed zero crush damage.
                    </p>

                    <div className="space-y-3 mb-6 text-xs sm:text-[13px] text-[#ccc]">
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>Hardware-in-the-Loop (HIL) tactile policy execution</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>MuJoCo, Isaac Sim, and Isaac Lab simulation rollouts</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>Sub-millisecond ROS2 & DDS sensor telemetry streaming</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>Certified p-CBF safety contracts (0.0% drops/crushes)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-[#262626] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#76b900]">Certified p-CBF Safety</span>
                    <span className="text-[#777]">Private VPC & Air-Gapped</span>
                  </div>
                </div>

                {/* AEROPROBE-1 */}
                <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-[#76b900] tracking-wider">PROGRAM 02</span>
                      <span className="text-[10px] font-mono text-[#aaa] bg-[#202020] border border-dashed border-[#333] px-2.5 py-0.5">
                        AEROSPACE ENGINEERING
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#F0EFE2] mb-2 tracking-tight">
                      AEROPROBE-1 Fluid & CFD Surrogate
                    </h3>

                    <p className="text-xs sm:text-[13px] text-[#888] leading-relaxed mb-6">
                      Aerodynamic pressure and velocity field surrogate models with inverse parameter estimation calibrated against wind tunnel and OpenFOAM data.
                    </p>

                    <div className="space-y-3 mb-6 text-xs sm:text-[13px] text-[#ccc]">
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>Mach & Reynolds parametric aerodynamic field inputs</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>Automated 3D surface mesh conditioning & prefix caching</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>Real-time inverse airfoil optimization solver (&gt;200 fps)</span>
                      </div>
                      <div className="flex items-start gap-2.5 leading-relaxed">
                        <Check size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                        <span>Continuous Navier-Stokes latent neural operators</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-[#262626] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#76b900]">OpenFOAM Validated</span>
                    <span className="text-[#777]">Bare-Metal H100 / H200</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: Model APIs Table */}
        <section id="model-apis-pricing" className="mb-20 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-[#76b900] text-xs font-mono font-medium tracking-wider uppercase mb-1.5">
                MODEL APIS
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#F0EFE2] tracking-tight">
                Pay for model tokens, not idle{" "}
                <span className="bg-[#76b900] text-black font-semibold px-2 py-0.5 rounded-none whitespace-nowrap">
                  capacity
                </span>
              </h2>
            </div>

            <span className="text-xs text-[#888] font-mono border border-dashed border-[#333] bg-[#151515] px-3.5 py-1.5 shrink-0 self-start sm:self-auto">
              Price per 1M tokens
            </span>
          </div>

          {/* Table Container with dashed border on #151515 */}
          <div className="w-full border border-dashed border-[#333] bg-[#151515] overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Header */}
              <div className="grid grid-cols-[3.2fr_1.1fr_1.8fr_1.1fr_1.2fr] px-6 py-4 border-b border-dashed border-[#333] text-xs font-medium text-[#777]">
                <div>Model</div>
                <div>Input</div>
                <div>Cached input</div>
                <div>Output</div>
                <div></div>
              </div>

              {/* Rows */}
              {MODEL_APIS_DATA.map((model, idx) => {
                const IconComponent = model.icon;
                const isHighlighted = highlightedModelId === model.id;
                return (
                  <Link
                    key={model.id}
                    href={model.link}
                    onMouseEnter={() => setHighlightedModelId(model.id)}
                    className={`grid grid-cols-[3.2fr_1.1fr_1.8fr_1.1fr_1.2fr] px-6 py-4.5 items-center group transition-all ${
                      isHighlighted
                        ? "bg-[#1c1c1c] border-b border-dashed border-[#444]"
                        : idx < MODEL_APIS_DATA.length - 1
                        ? "border-b border-dashed border-[#262626] hover:bg-[#1a1a1a]"
                        : "hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 pr-3">
                      <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        <IconComponent size={20} className={model.isFirstParty ? "text-[#F0EFE2]" : ""} />
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-[#F0EFE2] text-sm sm:text-[15px] group-hover:text-[#76b900] transition-colors truncate">
                          {model.name}
                        </span>
                      </div>
                    </div>

                    <div className="font-bold text-[#F0EFE2] text-sm sm:text-base font-mono">
                      {model.inputPrice}
                    </div>

                    <div className="flex flex-col justify-center">
                      <span className="font-bold text-[#F0EFE2] text-sm sm:text-base font-mono">
                        {model.cachedPrice}
                      </span>
                      {model.cacheHitRate ? (
                        <span className="text-[11px] text-[#777] mt-0.5 whitespace-nowrap font-sans">
                          {model.cacheHitRate}
                        </span>
                      ) : null}
                    </div>

                    <div className="font-bold text-[#F0EFE2] text-sm sm:text-base font-mono">
                      {model.outputPrice}
                    </div>

                    <div className="flex justify-end">
                      <span className="text-xs text-[#888] group-hover:text-[#F0EFE2] flex items-center gap-1.5 font-medium transition-colors">
                        View model <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#777] mt-3.5 font-normal">
            Limits and modality-specific capabilities are listed on each model page.
          </p>
        </section>

        {/* SECTION 5: Clean Comparison Matrix */}
        <section className="mb-20">
          <div className="w-full border border-[#262626] bg-[#151515] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#262626]">
              <h2 className="text-lg font-semibold text-[#F0EFE2] mb-1 tracking-tight">
                Compare Architecture Tiers
              </h2>
              <p className="text-xs text-[#888]">
                Self-serve compute is funded by flexible top-ups. Lab and Physical tiers add autonomous orchestration and private cluster hardware.
              </p>
            </div>

            {/* Matrix Header */}
            <div className="grid grid-cols-[1.2fr_1.2fr_1.2fr_1.2fr] divide-x divide-[#262626] border-b border-[#262626] bg-[#151515]">
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
                  i % 2 === 1 ? "bg-[#151515]/40" : "bg-transparent"
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
            className="w-full max-w-md bg-[#151515] border border-[#333] p-6 text-[#F0EFE2] shadow-2xl relative"
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
                  <p className="text-xs text-[#888] mt-1 mb-3">
                    Reserve your allocation in our phased research cluster deployment.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-[#2b2b2b]">
                    <Link
                      href={`/sign-up?plan=${encodeURIComponent(modalPlan)}`}
                      className="bg-[#76b900] text-black text-center text-xs py-2 font-semibold hover:bg-[#86dc00] transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Direct Signup</span>
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </Link>
                    <a
                      href={`https://cal.com/vegito?tier=${encodeURIComponent(modalPlan)}&notes=Tier%3A+${encodeURIComponent(modalPlan)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#202020] border border-dashed border-[#444] text-[#F0EFE2] text-center text-xs py-2 font-medium hover:border-[#76b900] transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Book a Call</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
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
                      className="w-full bg-[#151515] border border-[#333] px-3 py-2 text-xs text-[#F0EFE2] outline-none focus:border-[#76b900]"
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
                      className="w-full bg-[#151515] border border-[#333] px-3 py-2 text-xs text-[#F0EFE2] outline-none focus:border-[#76b900]"
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
                      className="w-full bg-[#151515] border border-[#333] px-3 py-2 text-xs text-[#F0EFE2] outline-none focus:border-[#76b900]"
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

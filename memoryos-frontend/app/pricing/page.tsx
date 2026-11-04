"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  Copy,
  RotateCw,
  Lock,
  Cpu,
  EyeOff,
  Activity,
  Layers,
  Terminal,
  Server,
  Workflow,
  Gauge,
  Database,
  Radio,
  FileCheck,
  Compass,
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";
import {
  DeepSeekLogo,
  OrnithLogo,
  NvidiaLogo,
  QwenLogo,
  HorosLogo,
  HorosWordmarkLogo,
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

// Frontier Models and First-Party Programs Data
const MODEL_APIS_DATA = [
  {
    id: "probe-1-humanoid",
    name: "PROBE-1 Humanoid Hand & Contact Policy",
    developer: "Horos Lab",
    category: "Physical AI",
    badge: "First-Party Program",
    icon: HorosLogo,
    promo: "Certified p-CBF Safety",
    inputPrice: "$0.35",
    strikethroughCached: "$0.10",
    cachedPrice: "Free",
    cacheHitRate: "99.8% cache hit,\nactive robot loop",
    outputPrice: "$1.40",
    link: "/capabilities/Horos/PROBE-1",
  },
  {
    id: "aeroprobe-1-aerospace",
    name: "AEROPROBE-1 Aerodynamic Field Surrogate",
    developer: "Horos Lab",
    category: "Aerospace",
    badge: "First-Party Program",
    icon: HorosLogo,
    promo: "CFD & Wind Tunnel Calibrated",
    inputPrice: "$0.40",
    strikethroughCached: "$0.12",
    cachedPrice: "Free",
    cacheHitRate: "98.5% cache hit,\nmesh state reuse",
    outputPrice: "$1.60",
    link: "/capabilities/Horos/AEROPROBE-1",
  },
  {
    id: "deepseek-v4-1-flash-1017",
    name: "DeepSeek V4.1 Flash 1017 (Autotuned Kernel)",
    developer: "DeepSeek",
    category: "Reasoning",
    icon: DeepSeekLogo,
    promo: "Free cached input",
    inputPrice: "$0.15",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "92.7% cache hit,\nlast 24 hours",
    outputPrice: "$0.60",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash%201017",
  },
  {
    id: "ornith-1-5-122b",
    name: "Ornith 1.5 122B Frontier",
    developer: "Ornith",
    category: "Frontier General",
    icon: OrnithLogo,
    promo: "Free cached input",
    inputPrice: "$0.20",
    strikethroughCached: "$0.05",
    cachedPrice: "Free",
    cacheHitRate: "94.6% cache hit,\nlast 24 hours",
    outputPrice: "$0.80",
    link: "/capabilities/Ornith/Ornith%201.5%20122B",
  },
  {
    id: "glm-5-3",
    name: "GLM 5.3 Long-Context Engine",
    developer: "Z.ai",
    category: "Long Context",
    icon: ZLogo,
    promo: "Free cached input",
    inputPrice: "$1.30",
    strikethroughCached: "$0.13",
    cachedPrice: "Free",
    cacheHitRate: "88.1% cache hit,\nlast 24 hours",
    outputPrice: "$4.20",
    link: "/capabilities/Z.ai/GLM%205.3",
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Nemotron 3.5 Lightning 30B",
    developer: "NVIDIA",
    category: "High-Throughput",
    icon: NvidiaLogo,
    promo: "Free cached input",
    inputPrice: "$0.05",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "99.2% cache hit,\nlast 24 hours",
    outputPrice: "$0.15",
    link: "/capabilities/NVIDIA/Nemotron%203.5%20Lightning%2030B",
  },
  {
    id: "qwen3-8-27b",
    name: "Qwen3.8 27B Autonomous Agent Edition",
    developer: "Alibaba Cloud",
    category: "Agent Tooling",
    icon: QwenLogo,
    promo: "Free cached input",
    inputPrice: "$0.10",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "97.1% cache hit,\nlast 24 hours",
    outputPrice: "$0.40",
    link: "/capabilities/Alibaba%20Cloud/Qwen3.8%2027B",
  },
];

// Architecture-Aligned Comparison Rows
const COMPARISON_ROWS = [
  {
    feature: "Primary focus",
    compute: "Pay-as-you-go model APIs, compiled kernels & inference compute",
    lab: "Autonomous research orchestration, SFT/DPO/RL loops & benchmark suites",
    enterprise: "Physical AI (PROBE-1 / AEROPROBE-1), private cluster nodes & air-gapped deploy",
    isText: true,
  },
  {
    feature: "Billing structure",
    compute: "Flexible top-ups from $25, pay per verified token & compute",
    lab: "Monthly subscription ($190/mo to $1,950/mo) includes monthly compute credits",
    enterprise: "Annual custom cohort contract, dedicated capacity SLAs",
    isText: true,
  },
  {
    feature: "Inference harness (vLLM, SGLang, TensorRT-LLM)",
    compute: "Multi-tenant optimized harness with automated prefix caching",
    lab: "Dedicated worker pool with speculative decoding & custom batch scheduler",
    enterprise: "Isolated GPU clusters, custom kernel compilation & zero-contention queues",
    isText: true,
  },
  {
    feature: "First-Party Model Access (PROBE-1 & AEROPROBE-1)",
    compute: "Pay-per-query API endpoints",
    lab: "Full fine-tuning access, task adaptation & simulation integration",
    enterprise: "Full private weights, continued pretraining & custom sensor calibration",
    isText: true,
  },
  {
    feature: "Model Improvement Orchestrator (SFT, DPO, GRPO, RL)",
    compute: false,
    lab: "Automated candidate checkpoints, run manifests & rollout workers",
    enterprise: "Distributed multi-node trainer workers & custom objective loss",
    isText: "mixed",
  },
  {
    feature: "15-Point Inference Benchmark & Evaluation Fabric",
    compute: "Baseline throughput & TTFT latency reports",
    lab: "Full suite: load testing, saturation, failure injection & holdouts",
    enterprise: "Continuous hardware-in-the-loop & regression certification",
    isText: true,
  },
  {
    feature: "RL Environment Factory & Rollout Store",
    compute: false,
    lab: "Versioned environment packages, trajectory store & episode inspection",
    enterprise: "Custom physical simulator integration (Isaac Gym, MuJoCo, OpenFOAM)",
    isText: "mixed",
  },
  {
    feature: "Causal Experiment Engine & Attribution",
    compute: false,
    lab: "Controlled variables, A/B counterfactuals & reproducible packages",
    enterprise: "Full historical lineage, telemetry provenance & audit defense",
    isText: "mixed",
  },
  {
    feature: "Certified Physical Safety (p-CBF)",
    compute: "Read-only trajectory verification",
    lab: "Simulated barrier function checks & collision predictions",
    enterprise: "Certified 0.0% drops/crushes hardware emergency interlock",
    isText: true,
  },
  {
    feature: "Deployment targets",
    compute: "Serverless multi-region GPU endpoints",
    lab: "Managed cloud & hybrid Kubernetes runners",
    enterprise: "Bare-metal H100/H200/B200 clusters, On-Premises & Air-Gapped Edge",
    isText: true,
  },
  {
    feature: "Uptime & Throughput SLA",
    compute: "99.9% high-availability cloud cluster",
    lab: "99.95% with priority execution queues",
    enterprise: "Contractual 99.99% SLA with dedicated throughput reservations",
    isText: true,
  },
  {
    feature: "Support & Research Partnership",
    compute: "Developer Discord & technical email",
    lab: "Priority research engineering channel & architecture review",
    enterprise: "Dedicated AI Research Systems Engineer & private Slack room",
    isText: true,
  },
];

const COMPATIBLE_FRAMEWORKS = [
  { name: "vLLM", tag: "Inference Engine" },
  { name: "SGLang", tag: "Fast Runtime" },
  { name: "TensorRT-LLM", tag: "NVIDIA Compiler" },
  { name: "PyTorch", tag: "Deep Learning" },
  { name: "Hugging Face", tag: "Open-Weights" },
  { name: "MuJoCo", tag: "Physics Engine" },
  { name: "Isaac Sim", tag: "Robot Simulation" },
  { name: "OpenFOAM", tag: "CFD Solver" },
  { name: "ROS 2", tag: "Robotics Core" },
  { name: "CUDA 12", tag: "GPU Kernel Suite" },
  { name: "OpenAI API", tag: "Protocol Compat" },
  { name: "Anthropic API", tag: "Protocol Compat" },
];

const LAB_FAQS = [
  {
    question: "What is the difference between Compute API, Frontier Lab, and Physical AI?",
    answer:
      "Compute API is purely pay-as-you-go token and kernel execution for deploying models. Frontier Lab is the complete autonomous research platform: it gives your team tools to train (SFT, DPO, GRPO), evaluate with a 15-point benchmark harness, run closed-loop RL simulators, and mine failure cases. Physical AI adds dedicated clusters, private weights for PROBE-1 (robotics) and AEROPROBE-1 (aerospace), certified p-CBF safety, and air-gapped deployments.",
  },
  {
    question: "How does the Controlled Inference Harness and KV-cache discount work?",
    answer:
      "When prompts share large prefix contexts (such as sensor histories, robot trajectories, codebases, or research papers), our infrastructure detects identical tokens in GPU memory and discounts cached input tokens by up to 90% or serves them free during active cohort promos. Our kernel autotuner also compiles universal IR directly to native hardware kernels.",
  },
  {
    question: "What are PROBE-1 and AEROPROBE-1?",
    answer:
      "These are Horos First-Party Frontier Programs. PROBE-1 is a physical intelligence model trained on multi-fingered humanoid demonstrations, tactile shear adaptation, and predictive p-CBF safety limits delivering 0.0% drop/crush rates. AEROPROBE-1 is a field surrogate model for aerodynamic pressure/velocity prediction and inverse parameter estimation calibrated against wind-tunnel and CFD ground truths.",
  },
  {
    question: "How does the Model Candidate Promotion Gate work?",
    answer:
      "Unlike basic benchmark scoring, HOROS enforces a strict promotion gate before any new model checkpoint reaches production. It tests for contamination, data leakage, reward-hacking, and safety regressions across sealed holdouts and historical production replay traces. Only models passing all threshold Pareto constraints are promoted.",
  },
  {
    question: "Can HOROS be deployed on private bare-metal or air-gapped environments?",
    answer:
      "Yes. For enterprise aerospace, robotics, defense, and industrial cohorts, HOROS System Packages are packaged as self-contained containers and Kubernetes manifests designed to run on bare-metal GPU clusters, sovereign clouds, or completely air-gapped hardware-in-the-loop test benches.",
  },
  {
    question: "How do credit top-ups work for the Compute API?",
    answer:
      "You can fund your prepaid balance starting at $25. Credits never expire for 12 months and are shared across all team members and research workspaces without per-seat licensing fees. You only pay for verified tokens and kernel compute time consumed.",
  },
];

export default function PricingPage() {
  const [selectedTrack, setSelectedTrack] = useState<"compute" | "lab" | "physical">("compute");
  const [creditAmount, setCreditAmount] = useState(50);
  const [activeFaq, setActiveFaq] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState("Frontier Compute (PAYG)");
  const [submitted, setSubmitted] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    org: "",
    workload: "Frontier AI Research & Model Adaptation",
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

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText("curl -fsSL https://horoslab.org/install-harness.sh | bash");
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#151515] text-[#C8C7BA] font-sans overflow-x-hidden selection:bg-[#76b900] selection:text-black">
      {/* 4 Adaptive Vertical Guidelines */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="hidden md:block absolute left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
        <div className="absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#333]" />
        <div className="hidden md:block absolute right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#262626]" />
      </div>

      <LandingNavbar onOpenFoundingCohort={() => openModal("Founding Cohort Track")} />

      <main className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto pt-24 sm:pt-28 pb-32 relative z-10">

        {/* SECTION 1: Header */}
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#76b900] tracking-wider uppercase">
              <span className="w-2 h-2 rounded-none bg-[#76b900] animate-pulse" />
              HOROS ARCHITECTURE PRICING & CLUSTER ALLOCATION
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-medium tracking-tight flex items-center gap-2 text-[#F0EFE2] leading-tight flex-wrap">
              Frontier AI Research &{" "}
              <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none font-bold inline-block">
                Lab Infrastructure
              </span>
            </h1>
            <p className="text-[#888] text-xs sm:text-sm md:text-base mt-2.5 max-w-3xl leading-relaxed font-normal">
              Continuous intelligence evolution from compilation to physical execution. High-throughput model APIs, autonomous research loops, verified kernels, and physical AI systems (PROBE-1 & AEROPROBE-1).
            </p>
          </div>

          {/* Pre-launch Cohort Transparency Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border border-dashed border-[#76b900]/40 bg-[#161b12] text-xs mb-8 rounded-none">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2 h-2 rounded-none bg-[#76b900] animate-pulse shrink-0" />
              <span className="font-mono text-[#76b900] font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                FOUNDING RESEARCH COHORT ACTIVE
              </span>
              <span className="text-[#555] hidden sm:inline">•</span>
              <span className="text-[#bbb] text-xs">
                Inference endpoints, compiler autotuning, and physical AI programs are allocating in phased batches.
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#76b900] border border-[#76b900]/40 px-2 py-0.5 shrink-0 self-start sm:self-auto uppercase">
              PRIORITY ACCESS
            </span>
          </div>

          {/* 3 Architecture Track Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
            {/* Track 1: Compute & Model APIs */}
            <div
              onClick={() => setSelectedTrack("compute")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all rounded-none ${
                selectedTrack === "compute"
                  ? "border-[#76b900] bg-[#1a1a1a]/60 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                  : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className={selectedTrack === "compute" ? "text-[#76b900]" : "text-[#777]"} />
                  <h2 className="text-base sm:text-lg font-medium text-[#F0EFE2]">Compute & Model API</h2>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center transition-colors ${
                    selectedTrack === "compute" ? "border-[#76b900] bg-[#76b900]" : "border-[#555]"
                  }`}
                />
              </div>
              <p className="text-[#888] text-xs mb-3 font-normal leading-relaxed">
                Pay-per-token model endpoints, verified kernels, and controlled inference harness.
              </p>
              <div className="text-xs pt-2 border-t border-dashed border-[#282828]">
                <span className="font-mono font-semibold text-[#F0EFE2] text-sm">Pay As You Go</span>
                <span className="text-[11px] text-[#777] block mt-0.5">Top-up from $25 • Zero seat fees</span>
              </div>
            </div>

            {/* Track 2: Autonomous Research Lab */}
            <div
              onClick={() => setSelectedTrack("lab")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all rounded-none ${
                selectedTrack === "lab"
                  ? "border-[#76b900] bg-[#1a1a1a]/60 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                  : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Workflow size={16} className={selectedTrack === "lab" ? "text-[#76b900]" : "text-[#777]"} />
                  <h2 className="text-base sm:text-lg font-medium text-[#F0EFE2]">Autonomous Research Lab</h2>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center transition-colors ${
                    selectedTrack === "lab" ? "border-[#76b900] bg-[#76b900]" : "border-[#555]"
                  }`}
                />
              </div>
              <p className="text-[#888] text-xs mb-3 font-normal leading-relaxed">
                SFT/DPO/RL training orchestrator, 15-point benchmark suite, and rollout stores.
              </p>
              <div className="text-xs pt-2 border-t border-dashed border-[#282828]">
                <span className="font-mono font-semibold text-[#F0EFE2] text-sm">From $190 / mo</span>
                <span className="text-[11px] text-[#777] block mt-0.5">Includes monthly research credits</span>
              </div>
            </div>

            {/* Track 3: Physical AI & Dedicated Clusters */}
            <div
              onClick={() => setSelectedTrack("physical")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all rounded-none ${
                selectedTrack === "physical"
                  ? "border-[#76b900] bg-[#1a1a1a]/60 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                  : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={selectedTrack === "physical" ? "text-[#76b900]" : "text-[#777]"} />
                  <h2 className="text-base sm:text-lg font-medium text-[#F0EFE2]">Physical AI & Clusters</h2>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center transition-colors ${
                    selectedTrack === "physical" ? "border-[#76b900] bg-[#76b900]" : "border-[#555]"
                  }`}
                />
              </div>
              <p className="text-[#888] text-xs mb-3 font-normal leading-relaxed">
                PROBE-1 (Humanoids), AEROPROBE-1 (Aerospace), p-CBF safety, and dedicated H100 clusters.
              </p>
              <div className="text-xs pt-2 border-t border-dashed border-[#282828]">
                <span className="font-mono font-semibold text-[#F0EFE2] text-sm">Custom Contracts</span>
                <span className="text-[11px] text-[#777] block mt-0.5">Private VPC & Air-Gapped Bare Metal</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Dynamic Content by Selected Track */}
        {selectedTrack === "compute" && (
          <section className="mb-16">
            <div className="border border-dashed border-[#333] bg-[#181818]/60 flex flex-col md:flex-row">
              {/* Left Column: PAYG Compute Top-up */}
              <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-7">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2]">Frontier Compute (PAYG)</h2>
                    <span className="text-[11px] font-mono tracking-wide bg-[#222] border border-[#333] px-2 py-0.5 text-[#aaa] flex items-center gap-1.5">
                      <span className="text-[#76b900]">#</span> Metered Ingestion
                    </span>
                  </div>
                  <p className="text-[#aaa] text-xs sm:text-[13px] mb-6">
                    Direct access to open-weights & Horos compiled kernels on one prepaid research balance.
                  </p>

                  <div className="mb-6">
                    <label className="text-[10px] text-[#777] font-semibold uppercase tracking-widest mb-2.5 block">
                      TOP-UP AMOUNT IN DOLLARS
                    </label>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      {[25, 50, 100, 250, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCreditAmount(amt)}
                          className={`text-xs px-3 py-1 font-mono transition-colors border ${
                            creditAmount === amt
                              ? "bg-[#76b900] text-black border-[#76b900] font-semibold"
                              : "bg-[#222] text-[#888] border-[#333] hover:text-white"
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
                        className="w-full bg-[#121212] border border-dashed border-[#333] rounded-none py-2.5 pl-8 pr-3 text-[#F0EFE2] font-mono text-base focus:outline-none focus:border-[#76b900] transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-[#777]">
                      <span>$25 minimum top-up. Zero expiration for 12 months.</span>
                      <span className="text-[#76b900] font-mono">~{Math.round((creditAmount / 0.15) * 10) / 10}M tokens estimate</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-medium text-xs sm:text-sm text-[#F0EFE2] mb-3">Architectural Features Included</h3>
                    <div className="space-y-2 text-xs text-[#bbb]">
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Controlled inference harness: vLLM, SGLang, and TensorRT-LLM runtimes</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Up to 90% discount on cached context prefixes & active state reuse</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Session-aware routing keeps simulation traces & KV caches warm</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Standard OpenAI and Anthropic API wire-level compatibility</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-center text-[11px] text-[#777] mb-3 font-mono">
                      New research accounts receive $1 free compute to benchmark model endpoints.
                    </p>
                    <button
                      type="button"
                      onClick={() => openModal(`Frontier Compute PAYG - $${creditAmount}`)}
                      className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-bold text-xs sm:text-sm py-3 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    >
                      Apply for Compute Cohort <ChevronRight size={15} strokeWidth={2.5} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Architectural Highlights */}
              <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-7 border-t md:border-t-0 md:border-l border-dashed border-[#333] bg-[#141414]/70">
                <div>
                  <div className="mb-5">
                    <span className="text-[10px] font-mono text-[#76b900] uppercase tracking-wider block mb-1">
                      HOROS RUNTIME COMPILER
                    </span>
                    <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2] mb-1.5">Universal IR & Kernel Autotuning</h2>
                    <p className="text-[#aaa] text-xs sm:text-[13px] leading-relaxed">
                      Models are parsed into universal computation graphs, optimized across memory, and compiled to verified hardware kernels.
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="p-3 bg-[#111] border border-[#2a2a2a] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#F0EFE2] font-semibold">
                        <span>Dynamic Speculative Decoding</span>
                        <span className="font-mono text-[#76b900]">2.8x speedup</span>
                      </div>
                      <p className="text-[11px] text-[#777]">Draft verification routes smaller helper models to predict tokens ahead of time.</p>
                    </div>

                    <div className="p-3 bg-[#111] border border-[#2a2a2a] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#F0EFE2] font-semibold">
                        <span>Paged KV Memory Cache</span>
                        <span className="font-mono text-[#76b900]">Zero OOM</span>
                      </div>
                      <p className="text-[11px] text-[#777]">Virtual memory allocation completely eliminates GPU memory fragmentation during long sessions.</p>
                    </div>

                    <div className="p-3 bg-[#111] border border-[#2a2a2a] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#F0EFE2] font-semibold">
                        <span>Outcome Contract Tracing</span>
                        <span className="font-mono text-[#76b900]">Verified Evidence</span>
                      </div>
                      <p className="text-[11px] text-[#777]">Every token generated records latency, GPU wattage, and causal verification lineage.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => openModal("Research Infra API Track")}
                    className="w-full bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-xs sm:text-sm py-3 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Request API Ingestion Keys <ChevronRight size={15} strokeWidth={2} className="ml-1 text-[#888]" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {selectedTrack === "lab" && (
          <section className="mb-16">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2] mb-1.5">
                Frontier Lab: Continuous Research & Adaptation Tiers
              </h2>
              <p className="text-xs sm:text-[13px] text-[#888] max-w-3xl leading-relaxed">
                Connect your research team directly to our Model Improvement Orchestrator. Run SFT, DPO, and GRPO training loops, evaluate on closed-loop RL simulators, and automatically mine production edge cases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Explorer Tier */}
              <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors rounded-none">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-medium text-[#F0EFE2]">Lab Explorer</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#1f2617] border border-[#76b900]/40 px-1.5 py-0.2">RESEARCH</span>
                  </div>
                  <div className="text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-1.5 my-2">
                    $190 <span className="text-xs font-normal text-[#888]">/ month</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-5">Includes $100 compute credits</p>

                  <div className="space-y-2.5 text-xs mb-6 text-[#bbb]">
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>5 concurrent autonomous research missions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>LoRA & SFT task adaptation engine</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>15-point benchmark harness & latency profiling</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Trajectory store for up to 1,000 recorded episodes</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Lab Explorer ($190/mo)")}
                  className="w-full bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#76b900] font-medium text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors cursor-pointer"
                >
                  Apply for Explorer Cohort <ChevronRight size={14} className="ml-1" />
                </button>
              </div>

              {/* Lab Pro Tier */}
              <div className="border border-dashed border-[#76b900] bg-[#1a2015]/40 p-5 sm:p-6 flex flex-col justify-between shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)] rounded-none relative">
                <div className="absolute -top-2.5 right-3 bg-[#76b900] text-black font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  RECOMMENDED FOR LABS
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-medium text-[#F0EFE2]">Frontier Lab Pro</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#1f2617] border border-[#76b900]/40 px-1.5 py-0.2">AUTONOMOUS</span>
                  </div>
                  <div className="text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-1.5 my-2">
                    $690 <span className="text-xs font-normal text-[#888]">/ month</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-5">Includes $450 compute credits</p>

                  <div className="space-y-2.5 text-xs mb-6 text-[#bbb]">
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Unlimited autonomous research missions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Full Post-Training: SFT, DPO, GRPO & RFT</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Causal Experiment Engine & failure mining loops</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>RL Environment Factory with closed-loop rollouts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Priority allocation on H100 SXM5 nodes</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Frontier Lab Pro ($690/mo)")}
                  className="w-full bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors cursor-pointer shadow-md"
                >
                  Apply for Pro Lab Cohort <ChevronRight size={14} className="ml-1" />
                </button>
              </div>

              {/* Lab Cluster Team Tier */}
              <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors rounded-none">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-medium text-[#F0EFE2]">Cluster Team</h3>
                    <span className="text-[10px] font-mono text-[#76b900] bg-[#1f2617] border border-[#76b900]/40 px-1.5 py-0.2">SCALE</span>
                  </div>
                  <div className="text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-1.5 my-2">
                    $1,950 <span className="text-xs font-normal text-[#888]">/ month</span>
                  </div>
                  <p className="text-xs text-[#76b900] font-mono mb-5">Includes $1,500 compute credits</p>

                  <div className="space-y-2.5 text-xs mb-6 text-[#bbb]">
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Distributed rollout & trainer worker pools</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Teaching-Data Admission Gate & contamination defense</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Multi-node benchmarking & cold-start profiling</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Custom Verifier Fabric & synthetic data factory</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Full team RBAC, audit logs, and workspace isolation</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal("Cluster Team ($1950/mo)")}
                  className="w-full bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#76b900] font-medium text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors cursor-pointer"
                >
                  Apply for Cluster Team <ChevronRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          </section>
        )}

        {selectedTrack === "physical" && (
          <section className="mb-16">
            <div className="border border-dashed border-[#76b900]/50 bg-[#161c12]/50 p-6 sm:p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#76b900]/10 border border-[#76b900]/40 text-[#76b900] text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#76b900] animate-pulse" />
                    FIRST-PARTY MODEL PROGRAMS & INDUSTRIAL COHORTS
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-medium text-[#F0EFE2] tracking-tight">
                    Physical Intelligence & Dedicated GPU Infrastructure
                  </h2>
                  <p className="text-xs sm:text-sm text-[#aaa] leading-relaxed">
                    Designed for humanoid robotics teams, aerospace manufacturers, defense contractors, and industrial automated facilities. Deploy dedicated bare-metal H100/H200/B200 clusters with certified p-CBF safety and private weights.
                  </p>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => openModal("Enterprise & Physical AI Cohort")}
                    className="w-full md:w-auto bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs sm:text-sm px-6 py-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <span>Apply for Dedicated Cohort</span>
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* 2 Program Callout Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-dashed border-[#333]">
                {/* PROBE-1 Callout */}
                <div className="p-4 sm:p-5 bg-[#121212] border border-[#2a2a2a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#76b900]">PROGRAM 01</span>
                    <span className="text-[10px] font-mono text-[#888] bg-[#1a1a1a] px-2 py-0.5 border border-[#333]">HUMANOID ROBOTICS</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#F0EFE2]">PROBE-1 Tactile & Contact Policy</h3>
                  <p className="text-xs text-[#888] leading-relaxed">
                    Multifingered humanoid hand manipulation, nonstationary contact states, tactile shear adaptation, and hardware limits with predictive Control Barrier Functions (0.0% drops/crushes).
                  </p>
                  <div className="pt-2 flex items-center gap-3 text-[11px] text-[#76b900] font-mono">
                    <span>• Hardware-in-the-Loop</span>
                    <span>• MuJoCo & Isaac Sim</span>
                    <span>• ROS2 Telemetry</span>
                  </div>
                </div>

                {/* AEROPROBE-1 Callout */}
                <div className="p-4 sm:p-5 bg-[#121212] border border-[#2a2a2a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#76b900]">PROGRAM 02</span>
                    <span className="text-[10px] font-mono text-[#888] bg-[#1a1a1a] px-2 py-0.5 border border-[#333]">AEROSPACE ENGINEERING</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#F0EFE2]">AEROPROBE-1 Fluid & CFD Field Surrogate</h3>
                  <p className="text-xs text-[#888] leading-relaxed">
                    Aerodynamic pressure and velocity field surrogate models with inverse parameter estimation and uncertainty quantification calibrated against wind tunnel and OpenFOAM data.
                  </p>
                  <div className="pt-2 flex items-center gap-3 text-[11px] text-[#76b900] font-mono">
                    <span>• Mach/Reynolds Inputs</span>
                    <span>• Mesh Conditioning</span>
                    <span>• Inverse Solvers</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: Model APIs & Lab Weights Table */}
        <div className="w-screen relative left-1/2 -translate-x-1/2 z-20 mb-12">
          <SectionDivider position="top" />
        </div>

        <section id="model-apis-pricing" className="mb-24 scroll-mt-20">
          <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-2">
            MODEL REGISTRY & VERIFIED RATES
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <h2 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-[#F0EFE2] tracking-tight flex items-center gap-2 flex-wrap">
              High-throughput tokens with verified{" "}
              <span className="bg-[#76b900] text-[#0e0f12] px-2 py-0.5 rounded-none font-semibold leading-tight inline-block">
                prefix reuse
              </span>
            </h2>

            <div className="shrink-0">
              <span className="text-[11px] text-[#888] font-mono font-medium border border-dashed border-[#333] bg-[#1a1a1a] px-3 py-1 rounded-none inline-block">
                Price per 1M tokens
              </span>
            </div>
          </div>

          <div className="w-full border border-dashed border-[#333] bg-[#151515] overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Header Row */}
              <div className="grid grid-cols-[3.2fr_1.1fr_1.8fr_1.1fr_1.2fr] px-4 sm:px-5 py-3 border-b border-dashed border-[#333] text-xs font-medium text-[#777]">
                <div>Model & Program</div>
                <div>Input</div>
                <div>Cached input</div>
                <div>Output</div>
                <div></div>
              </div>

              {/* Data Rows */}
              {MODEL_APIS_DATA.map((model, idx) => {
                const IconComponent = model.icon;
                return (
                  <Link
                    key={model.id}
                    href={model.link}
                    className={`grid grid-cols-[3.2fr_1.1fr_1.8fr_1.1fr_1.2fr] px-4 sm:px-5 py-3.5 sm:py-4 items-center group hover:bg-[#1c1c1c] transition-colors ${
                      idx < MODEL_APIS_DATA.length - 1 ? "border-b border-dashed border-[#262626]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-3">
                      <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        <IconComponent size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#F0EFE2] text-sm group-hover:text-[#76b900] transition-colors leading-snug truncate">
                            {model.name}
                          </span>
                          {model.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/40 font-bold shrink-0">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#666] font-mono block">
                          {model.developer} • {model.category}
                        </span>
                      </div>
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
                      <span className="text-[10px] text-[#666] leading-snug mt-0.5 whitespace-pre-line pr-2 font-mono">
                        {model.cacheHitRate}
                      </span>
                    </div>

                    <div className="font-semibold text-[#F0EFE2] text-sm font-mono">
                      {model.outputPrice}
                    </div>

                    <div className="flex justify-end">
                      <span className="text-xs text-[#aaa] group-hover:text-[#F0EFE2] flex items-center gap-1 font-medium transition-colors">
                        Inspect model <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-3 text-xs text-[#777] font-mono">
            All models served through the Horos Inference Harness with universal IR kernel autotuning and zero-egress encryption.
          </div>
        </section>

        {/* SECTION 4: Architecture Comparison Matrix */}
        <section className="mb-20">
          <div className="w-full border border-dashed border-[#333] bg-[#151515] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-dashed border-[#333]">
              <div className="text-[#76b900] text-xs font-mono font-medium tracking-wider uppercase mb-1">
                COMPREHENSIVE CAPABILITY MATRIX
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#F0EFE2] mb-1.5 tracking-tight">
                Compare Compute, Autonomous Lab, and Physical AI Deployments
              </h2>
              <p className="text-xs sm:text-[13px] text-[#888] max-w-3xl leading-relaxed">
                From self-serve token compute to full RL environment factories and bare-metal cluster deployments with certified p-CBF safety.
              </p>
            </div>

            <div className="grid grid-cols-[1.3fr_1.3fr_1.3fr_1.3fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#181818]/80 text-xs">
              <div className="p-4 sm:p-5 flex items-end font-semibold text-[#777]">Architecture Layer</div>
              <div className="p-4 sm:p-5 flex flex-col justify-end">
                <span className="text-sm font-semibold text-[#F0EFE2]">Compute & APIs</span>
                <span className="text-[11px] text-[#777] font-mono mt-0.5">PAYG from $25</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col justify-end">
                <span className="text-sm font-semibold text-[#76b900]">Frontier Lab</span>
                <span className="text-[11px] text-[#777] font-mono mt-0.5">From $190 / mo</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col justify-end">
                <span className="text-sm font-semibold text-[#F0EFE2]">Physical AI & Cluster</span>
                <span className="text-[11px] text-[#777] font-mono mt-0.5">Custom Cohort</span>
              </div>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1.3fr_1.3fr_1.3fr_1.3fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#282828] text-xs sm:text-[13px] ${
                  i % 2 === 1 ? "bg-[#181818]/40" : "bg-transparent"
                }`}
              >
                <div className="p-3.5 sm:p-4 text-[#aaa] font-medium flex items-center">
                  {row.feature}
                </div>

                <div className="p-3.5 sm:p-4 flex items-center text-[#C8C7BA]">
                  {row.isText === true ? (
                    <span className="leading-snug">{row.compute as string}</span>
                  ) : row.compute === true ? (
                    <Check size={16} className="text-[#76b900]" strokeWidth={2.5} />
                  ) : (
                    <X size={15} className="text-[#666]" strokeWidth={2} />
                  )}
                </div>

                <div className="p-3.5 sm:p-4 flex items-center text-[#C8C7BA]">
                  {row.isText === true ? (
                    <span className="leading-snug">{row.lab as string}</span>
                  ) : row.lab === true ? (
                    <Check size={16} className="text-[#76b900]" strokeWidth={2.5} />
                  ) : (
                    <span className="leading-snug">{row.lab as string}</span>
                  )}
                </div>

                <div className="p-3.5 sm:p-4 flex items-center text-[#C8C7BA]">
                  {row.isText === true ? (
                    <span className="leading-snug">{row.enterprise as string}</span>
                  ) : row.enterprise === true ? (
                    <Check size={16} className="text-[#76b900]" strokeWidth={2.5} />
                  ) : (
                    <X size={15} className="text-[#666]" strokeWidth={2} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-dashed border-[#333] bg-[#161616]">
            <div className="text-xs text-[#888]">
              Compare pay-as-you-go token costs against renting dedicated GPU capacity.{" "}
              <Link
                href="/economics"
                className="underline decoration-[#76b900] decoration-1 underline-offset-4 text-[#F0EFE2] hover:text-[#76b900] font-medium transition-colors"
              >
                Inspect GPU fit, idle losses, and cluster economics →
              </Link>
            </div>
            <button
              onClick={() => openModal("Architecture Consultation")}
              className="text-xs font-mono text-[#76b900] border border-[#76b900]/50 hover:bg-[#76b900]/10 px-3 py-1.5 shrink-0 transition-colors"
            >
              Request Architecture Consultation
            </button>
          </div>
        </section>

        {/* SECTION 5: Runtime & Connectors Suite */}
        <section className="mb-20">
          <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-2">
            INTEGRATION RUNTIMES & CONNECTORS
          </div>
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-8">
            <div className="max-w-md">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#F0EFE2] tracking-tight mb-2">
                Connect your models, simulators, and physical rigs
              </h2>
              <p className="text-xs sm:text-sm text-[#888] leading-relaxed">
                Native adapters for high-throughput inference runtimes, robotics physics engines, and enterprise telemetry pipelines.
              </p>
            </div>

            <div className="w-full lg:max-w-md border border-dashed border-[#333] bg-[#181818]/60 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-[#F0EFE2]">Harness CLI Install</span>
                <button
                  onClick={handleCopyPrompt}
                  className="text-[11px] text-[#aaa] hover:text-white flex items-center gap-1.5 px-2.5 py-1 border border-[#333] bg-[#141414] transition-colors"
                >
                  <Copy size={12} /> {copiedPrompt ? "Copied!" : "Copy bash command"}
                </button>
              </div>
              <code className="block p-2 bg-[#101010] border border-[#2a2a2a] text-[#76b900] font-mono text-xs overflow-x-auto">
                curl -fsSL https://horoslab.org/install-harness.sh | bash
              </code>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {COMPATIBLE_FRAMEWORKS.map((fw) => (
              <div
                key={fw.name}
                className="p-3 border border-dashed border-[#262626] bg-[#161616] hover:border-[#76b900]/40 transition-colors"
              >
                <div className="text-xs font-semibold text-[#F0EFE2] truncate">{fw.name}</div>
                <div className="text-[10px] font-mono text-[#777] uppercase mt-0.5">{fw.tag}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: Common Questions FAQ */}
        <section className="max-w-3xl mx-auto flex flex-col items-center mb-16">
          <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-2">
            RESEARCH ARCHITECTURE FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium text-[#F0EFE2] mb-2 flex items-center gap-2">
            Frequently Asked{" "}
            <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none font-bold">
              Questions
            </span>
          </h2>
          <p className="text-[#888] text-xs sm:text-sm mb-8 text-center">
            Have questions about cluster topology, custom kernels, or physical deployment?{" "}
            <a href={`mailto:${founderEmail}`} className="text-[#76b900] hover:underline">
              Contact our engineering team
            </a>
            .
          </p>

          <div className="w-full space-y-3">
            {LAB_FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={faq.question}
                  className="border border-dashed border-[#333] bg-[#181818]/60 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? -1 : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 border border-[#76b900] flex items-center justify-center shrink-0">
                        {isOpen && <div className="w-1.5 h-1.5 bg-[#76b900]" />}
                      </div>
                      <span className="font-semibold text-[#F0EFE2] text-xs sm:text-sm">{faq.question}</span>
                    </div>
                    <span className="text-xs text-[#888] font-mono">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 pl-11 text-xs sm:text-[13px] text-[#aaa] leading-relaxed border-t border-dashed border-[#282828]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 7: Bottom Call to Action */}
        <section className="border border-dashed border-[#76b900]/50 bg-gradient-to-r from-[#141712] via-[#161a13] to-[#141712] p-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#76b900]/10 border border-[#76b900]/30 text-[#76b900] text-xs font-mono uppercase font-bold">
            <span className="w-1.5 h-1.5 bg-[#76b900] animate-pulse" />
            FOUNDING COHORT ALLOCATION
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold text-[#F0EFE2] tracking-tight">
            Reserve Priority Frontier Compute Access
          </h2>
          <p className="text-xs sm:text-sm text-[#aaa] max-w-2xl mx-auto leading-relaxed">
            Phased onboarding is now open for research labs, autonomous robotics teams, and frontier AI systems. Lock in founding token rates and dedicated cluster capacity.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openModal("Founding Cohort Track")}
              className="w-full sm:w-auto bg-[#76b900] hover:bg-[#86dc00] text-black font-bold text-xs sm:text-sm px-6 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <span>Apply for Cohort Allocation</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
            <Link
              href="/research"
              className="w-full sm:w-auto bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-xs sm:text-sm px-6 py-3 flex items-center justify-center transition-colors"
            >
              Read Research Architecture Paper
            </Link>
          </div>
        </section>
      </main>

      {/* Application Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl border border-dashed border-[#444] bg-[#161616] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-none bg-[#76b900] animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#76b900] font-semibold">
                    Founding Cohort Application
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2] tracking-tight">
                  Apply for Cluster Allocation
                </h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-[#888]">Selected Track:</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-[#202020] border border-[#333] text-[#76b900] font-medium">
                    {modalPlan}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#888] hover:text-white p-1 hover:bg-[#222] transition-colors rounded-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-none bg-[#76b900]/10 border border-[#76b900] flex items-center justify-center mx-auto text-[#76b900]">
                  <Check size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Application Received</h3>
                  <p className="text-xs text-[#aaa] mt-1.5 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="text-[#F0EFE2] font-semibold">{formData.name || "Researcher"}</span>. Your priority founding access request for <span className="text-[#76b900] font-mono">{modalPlan}</span> has been logged.
                  </p>
                </div>
                <div className="p-3.5 bg-[#1a1a1a] border border-dashed border-[#333] text-left text-xs space-y-2 max-w-md mx-auto font-mono">
                  <div className="text-[11px] text-[#76b900] uppercase font-semibold">Next Steps:</div>
                  <p className="text-[#888] leading-relaxed">
                    1. Our engineering systems team evaluates cluster capacity and workload fit within 24 hours.
                  </p>
                  <p className="text-[#888] leading-relaxed">
                    2. Endpoint keys, harness sandbox credentials, and documentation will be dispatched to <span className="text-[#F0EFE2]">{formData.email || "your provided address"}</span>.
                  </p>
                  <p className="text-[#888] leading-relaxed">
                    3. Direct research contact:{" "}
                    <a href={`mailto:${founderEmail}`} className="underline text-[#76b900] hover:text-[#85cc00]">
                      {founderEmail}
                    </a>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-[#76b900] hover:bg-[#85cc00] text-black font-semibold text-xs px-6 py-2.5 transition-colors cursor-pointer"
                >
                  Close & Return
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div className="p-3 border border-dashed border-[#76b900]/30 bg-[#161b12] text-xs text-[#aaa] leading-relaxed">
                  <span className="text-[#76b900] font-semibold">Cohort Allocation:</span> Phased onboarding locks in founding pricing and grants dedicated cluster queue priority.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Dr. Evelyn Vance"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#121212] border border-[#333] focus:border-[#76b900] px-3 py-2 text-xs text-[#F0EFE2] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                      Work / Lab Email *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="evelyn@frontierlab.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#121212] border border-[#333] focus:border-[#76b900] px-3 py-2 text-xs text-[#F0EFE2] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                      Company / Lab / Institute
                    </label>
                    <input
                      type="text"
                      placeholder="Aerospace Systems / Robotics Lab"
                      value={formData.org}
                      onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                      className="w-full bg-[#121212] border border-[#333] focus:border-[#76b900] px-3 py-2 text-xs text-[#F0EFE2] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                      Estimated Monthly Volume
                    </label>
                    <select
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full bg-[#121212] border border-[#333] focus:border-[#76b900] px-2.5 py-2 text-xs text-[#F0EFE2] outline-none transition-colors cursor-pointer"
                    >
                      <option value="Under 25M tokens/month">Under 25M tokens / month</option>
                      <option value="25M - 200M tokens/month">25M - 200M tokens / month</option>
                      <option value="200M - 1B tokens/month">200M - 1B tokens / month</option>
                      <option value="1B+ tokens / Dedicated Cluster">1B+ tokens / Dedicated Cluster</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                    Primary Architecture Focus
                  </label>
                  <select
                    value={formData.workload}
                    onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] focus:border-[#76b900] px-2.5 py-2 text-xs text-[#F0EFE2] outline-none transition-colors cursor-pointer"
                  >
                    <option value="Frontier Model APIs & Kernel Autotuning">Frontier Model APIs & Kernel Autotuning</option>
                    <option value="Autonomous Research Loops (SFT/DPO/GRPO)">Autonomous Research Loops (SFT/DPO/GRPO)</option>
                    <option value="Physical AI: PROBE-1 Humanoid Robotics">Physical AI: PROBE-1 Humanoid Robotics</option>
                    <option value="Aerospace: AEROPROBE-1 Fluid Field Surrogates">Aerospace: AEROPROBE-1 Fluid Field Surrogates</option>
                    <option value="Dedicated H100 Cluster & Air-Gapped Deployment">Dedicated H100 Cluster & Air-Gapped Deployment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                    Research or Cluster Specifications (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe your simulator, sensor streams, target models, or private cluster requirements..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] focus:border-[#76b900] px-3 py-2 text-xs text-[#F0EFE2] outline-none transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-black font-semibold text-xs sm:text-sm py-3 transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    Submit Founding Cohort Application <ArrowRight size={15} strokeWidth={2.5} />
                  </button>
                  <p className="text-[10px] text-center text-[#666] mt-2 font-mono">
                    Engineering review turnaround within 24 hours. No upfront payment required until cluster allocation is verified.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <GlobalFooter />
    </div>
  );
}

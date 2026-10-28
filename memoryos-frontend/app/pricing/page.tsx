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
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";
import {
  DeepSeekLogo,
  OrnithLogo,
  NvidiaLogo,
  QwenLogo,
  GLMLogo,
  AnthropicLogo,
  MistralLogo,
  OpenAILogo,
  ClaudeLogo,
  GrokLogo,
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

// Exact 8 models from Screenshot 1 & Screenshot 2
const MODEL_APIS_DATA = [
  {
    id: "ornith-1-5-122b",
    name: "Ornith 1.5 122B",
    developer: "Ornith",
    icon: OrnithLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$0.20",
    strikethroughCached: "$0.05",
    cachedPrice: "Free",
    cacheHitRate: "94.6% cache hit,\nlast 24 hours",
    outputPrice: "$0.80",
    link: "/capabilities/Ornith/Ornith%201.5%20122B",
  },
  {
    id: "deepseek-v4-1-flash-1017",
    name: "DeepSeek V4.1 Flash 1017",
    developer: "DeepSeek",
    icon: DeepSeekLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$0.15",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "29.7% cache hit,\nlast 24 hours",
    outputPrice: "$0.60",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash%201017",
  },
  {
    id: "glm-5-3",
    name: "GLM 5.3",
    developer: "Z.ai",
    icon: ZLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$1.30",
    strikethroughCached: "$0.13",
    cachedPrice: "Free",
    cacheHitRate: "28.1% cache hit,\nlast 24 hours",
    outputPrice: "$4.20",
    link: "/capabilities/Z.ai/GLM%205.3",
  },
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    developer: "Z.ai",
    icon: ZLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$0.11",
    strikethroughCached: "$0.03",
    cachedPrice: "Free",
    cacheHitRate: "98.1% cache hit,\nlast 24 hours",
    outputPrice: "$0.45",
    link: "/capabilities/Z.ai/GLM%205.3%20Flash",
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Nemotron 3.5 Lightning 30B",
    developer: "NVIDIA",
    icon: NvidiaLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$0.05",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "99.2% cache hit,\nlast 24 hours, DeepSeek\nV4.1 Flash's rate",
    outputPrice: "$0.15",
    link: "/capabilities/NVIDIA/Nemotron%203.5%20Lightning%2030B",
  },
  {
    id: "qwen3-8-27b",
    name: "Qwen3.8 27B",
    developer: "Alibaba Cloud",
    icon: QwenLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$0.10",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "97.1% cache hit,\nlast 24 hours",
    outputPrice: "$0.40",
    link: "/capabilities/Alibaba%20Cloud/Qwen3.8%2027B",
  },
  {
    id: "ornith-1-5-35b",
    name: "Ornith 1.5 35B",
    developer: "Ornith",
    icon: OrnithLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$0.10",
    strikethroughCached: "$0.01",
    cachedPrice: "Free",
    cacheHitRate: "96.8% cache hit,\nlast 24 hours",
    outputPrice: "$0.40",
    link: "/capabilities/Ornith/Ornith%201.5%2035B",
  },
  {
    id: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    developer: "DeepSeek",
    icon: DeepSeekLogo,
    promo: "Free cached input",
    promoUntil: "until Oct 31, 2026, 11:59 PM UTC",
    inputPrice: "$0.14",
    strikethroughCached: "$0.03",
    cachedPrice: "Free",
    cacheHitRate: "29.2% cache hit,\nlast 24 hours",
    outputPrice: "$0.58",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash",
  },
];

// Exact comparison matrix for Frontier AI Research Infra & Frontier AI Lab
const COMPARISON_ROWS = [
  {
    feature: "Pricing model",
    payg: "Credit top-ups from $5, pay for compute consumed",
    enterprise: "Custom volume, dedicated nodes, and contract terms",
    isText: true,
  },
  {
    feature: "Balance",
    payg: "One unified balance for Model APIs & reasoning",
    enterprise: "Shared research balance with custom quota controls",
    isText: true,
  },
  {
    feature: "Seats",
    payg: "Zero per-seat licensing fees",
    enterprise: "Unlimited researchers & engineers, zero seat fees",
    isText: true,
  },
  {
    feature: "OpenAI- and Anthropic-compatible APIs",
    payg: true,
    enterprise: true,
    isText: false,
  },
  {
    feature: "Audit logs and RBAC",
    payg: "Free with a Business account (Settings)",
    enterprise: true,
    isText: "mixed",
  },
  {
    feature: "SOC 2 Type II",
    payg: false,
    enterprise: true,
    isText: false,
  },
  {
    feature: "SLA",
    payg: "High-availability cloud cluster",
    enterprise: "Contractual SLA up to 99.99%",
    isText: true,
  },
  {
    feature: "Support",
    payg: "Priority research engineering email",
    enterprise: "Dedicated AI research engineer and private Slack",
    isText: true,
  },
];

const CODING_PLAN_FAQS = [
  {
    question: "What happens at a limit?",
    answer:
      "If you turned on Keep full speed on credits, credits pay with your choice of a cap per billing period or no limit. When credits cannot pay, free Standby serves chat. Choose at checkout and change it in your Frontier Lab plan settings. If neither can serve a request, it stops with the reason, reset time and next step.",
  },
  {
    question: "What does my plan cover?",
    answer:
      "Your plan covers all frontier models, coding agents, and reasoning workflows up to your 5-hour and weekly limits. Standby chat remains free when limits are reached, so your research and development are never interrupted.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Yes, you can cancel at any time with one click from your developer console. Your plan benefits remain active until the end of your current billing period.",
  },
  {
    question: "When do the limits reset?",
    answer:
      "Your 5-hour limit resets continuously on a rolling 5-hour window from your first request, and your weekly limit resets at the start of every calendar week.",
  },
  {
    question: "How is usage counted?",
    answer:
      "Usage is calculated per token generated and test-time compute processed by your connected agent, discounted by automated prefix and context caching.",
  },
  {
    question: "What is Standby?",
    answer:
      "Standby is our free, guaranteed-fallback chat mode that allows coding sessions to continue at reduced concurrency when primary limits are reached.",
  },
  {
    question: "When am I charged?",
    answer:
      "Subscriptions are billed monthly on your signup anniversary. Any extra credits you enable are topped up automatically according to your cap.",
  },
  {
    question: "What can I count on?",
    answer:
      "We guarantee 99.9% platform availability, high-throughput model endpoints, sub-second TTFT, and zero downtime across coding sessions.",
  },
  {
    question: "What if a payment fails or is disputed?",
    answer:
      "If a payment fails, we retry up to three times over seven days. Your account transitions to Standby mode so your workflows are not abruptly severed.",
  },
];

const READY_AGENTS = [
  {
    name: "Horos",
    logo: "/horos-icon.svg",
  },
  {
    name: "Claude Code",
    logo: "/logos/agents/claude-code.svg",
  },
  {
    name: "Codex",
    logo: "/logos/agents/codex.svg",
  },
  {
    name: "OpenCode",
    logo: "/logos/agents/opencode.svg",
  },
  {
    name: "Pi",
    logo: "/logos/agents/pi.svg",
  },
  {
    name: "Aider",
    logo: "/logos/agents/aider.png",
  },
  {
    name: "Qwen Code",
    logo: "/logos/agents/qwen-code.svg",
  },
  {
    name: "Kilo Code",
    logo: "/logos/agents/kilo-code.svg",
  },
  {
    name: "Goose",
    logo: "/logos/agents/goose.png",
  },
  {
    name: "Continue",
    logo: "/logos/agents/continue.png",
  },
  {
    name: "Cline",
    logo: "/logos/agents/cline.png",
  },
  {
    name: "Droid",
    logo: "/logos/agents/droid.svg",
  },
  {
    name: "Grok Build",
    logo: "/newland/agent-marks/grok.png",
  },
  {
    name: "Hermes Agent",
    logo: "/logos/agents/hermes.png",
  },
  {
    name: "OpenClaw",
    logo: "/logos/agents/openclaw.svg",
  },
  {
    name: "Crush",
    logo: "/newland/agent-marks/crush.png",
  },
  {
    name: "Kimi CLI",
    logo: "/newland/agent-marks/kimi.png",
  },
  {
    name: "Mistral Vibe",
    logo: "/newland/agent-marks/mistral-vibe.svg",
  },
  {
    name: "Forge",
    logo: "/newland/agent-marks/forge.svg",
  },
  {
    name: "Nanocoder",
    logo: "/newland/agent-marks/nanocoder.svg",
  },
];

const PREVIEW_AGENTS = [
  {
    name: "Zed",
    logo: "/logos/agents/zed.png",
  },
  {
    name: "Oh My Pi",
    logo: "/newland/agent-marks/oh-my-pi.svg",
  },
  {
    name: "gptme",
    logo: "/newland/agent-marks/gptme.svg",
  },
  {
    name: "Tabby",
    logo: "/newland/agent-marks/tabby.png",
  },
  {
    name: "Octofriend",
    monogram: "OC",
  },
  {
    name: "Command Code",
    logo: "/logos/agents/commandcode.svg",
    invertDark: true,
  },
  {
    name: "Junie CLI",
    logo: "/newland/agent-marks/junie.svg",
  },
  {
    name: "VS Code Copilot Chat",
    monogram: "VC",
  },
  {
    name: "Theia AI",
    logo: "/newland/agent-marks/theia.png",
  },
  {
    name: "OpenHands CLI",
    logo: "/newland/agent-marks/openhands.png",
  },
  {
    name: "Copilot CLI",
    monogram: "CP",
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<"payg" | "coding">("payg");
  const [creditAmount, setCreditAmount] = useState(20);
  const [faqTab, setFaqTab] = useState<"payg" | "enterprise">("payg");
  const [codingFaqActive, setCodingFaqActive] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState("Research Infra (PAYG)");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    org: "",
    workload: "Autonomous Agents",
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
    navigator.clipboard.writeText("curl -fsSL https://memoryos.ai/setup.sh | bash");
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#151515] text-[#C8C7BA] font-sans overflow-x-hidden selection:bg-[#76b900] selection:text-black">
      {/* Background Vertical Dashed Layout Guidelines - Matching Global Footer Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(14%_+_120px)] lg:left-[calc(18%_+_120px)] top-0 bottom-0 border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(86%_-_120px)] lg:left-[calc(82%_-_120px)] top-0 bottom-0 border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 border-l border-dashed border-[#333]" />
      </div>

      {/* Top Navbar with Founding Cohort Integration */}
      <LandingNavbar onOpenFoundingCohort={() => openModal("Founding Cohort Track")} />

      {/* Main Container - Sits cleanly inside inner dashed lines with breathing room */}
      <main className="w-[92%] sm:w-[90%] md:w-[calc(72%_-_280px)] lg:w-[calc(64%_-_300px)] xl:w-[calc(64%_-_340px)] mx-auto pt-24 sm:pt-28 pb-32 relative z-10">

        {/* SECTION 1: Top Product Plans Selection */}
        <section className="mb-16">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight flex items-center gap-2 text-[#F0EFE2] leading-tight">
              Frontier AI Research Infra &{" "}
              <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none font-semibold inline-block">
                Lab
              </span>
            </h1>
            <p className="text-[#888] text-xs sm:text-sm md:text-base mt-2 font-normal">
              One unified platform: Frontier AI Research Infrastructure + Frontier AI Lab, delivering high-throughput compute, foundation models, and verified token pricing.
            </p>
          </div>

          {/* Pre-launch Cohort Transparency Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 border border-dashed border-[#76b900]/40 bg-[#161b12] text-xs mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#76b900] animate-pulse shrink-0" />
              <span className="font-mono text-[#76b900] font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                FOUNDING COHORT ONBOARDING
              </span>
              <span className="text-[#555] hidden sm:inline">•</span>
              <span className="text-[#bbb] text-xs">
                Model endpoints and compute clusters are rolling out in active cohorts. Lock in founding pricing and priority cluster allocation below.
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#76b900] border border-[#76b900]/40 px-2 py-0.5 shrink-0 self-start sm:self-auto">
              PRE-LAUNCH ACCESS
            </span>
          </div>

          {/* Plan Selector Cards (Pay as you go vs Coding plan vs Platform) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
            {/* Pay as you go Card */}
            <div
              onClick={() => setSelectedPlan("payg")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all ${selectedPlan === "payg"
                ? "border-[#76b900] bg-[#1a1a1a]/40 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
                }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <h2 className="text-lg font-medium text-[#F0EFE2]">Research Infra (Pay as you go)</h2>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedPlan === "payg" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "payg" && <div className="w-2 h-2 rounded-full bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-xs sm:text-[13px] mb-4 font-normal">For frontier model APIs, reasoning, and research workloads</p>

              <div className="text-xs sm:text-sm">
                <p className="font-medium mb-2 text-[#F0EFE2]">Any amount from $5</p>
                <ul className="space-y-1.5 text-xs text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Pay per verified token & test-time compute
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Credits last a year across all workspaces
                  </li>
                </ul>
              </div>
            </div>

            {/* Frontier Lab & Agent Plan Card */}
            <div
              onClick={() => setSelectedPlan("coding")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all ${selectedPlan === "coding"
                ? "border-[#76b900] bg-[#1a1a1a]/40 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
                }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <h2 className="text-lg font-medium text-[#F0EFE2]">Frontier Lab & Agent Plan</h2>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedPlan === "coding" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "coding" && <div className="w-2 h-2 rounded-full bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-xs sm:text-[13px] mb-4 font-normal">For autonomous agents, lab researchers & intelligence tools</p>

              <div className="text-xs sm:text-sm">
                <p className="font-medium mb-2 text-[#F0EFE2]">From $10 a month</p>
                <ul className="space-y-1.5 text-xs text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Included frontier reasoning & agent compute, resets every 5h and weekly
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> At a limit, continue with credits or free Standby
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </section>

        {selectedPlan === "payg" ? (
          <>
            {/* Selected Plan Details & Enterprise Split Box */}
            <section className="mb-16">
              <div className="border border-dashed border-[#333] bg-[#181818]/60 flex flex-col md:flex-row">
                {/* Left Column: Pay as you go */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-6 lg:p-7">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2]">Research Infra (PAYG)</h2>
                      <span className="text-[11px] font-mono tracking-wide bg-[#222] border border-[#333] px-2 py-0.5 text-[#aaa] flex items-center gap-1.5">
                        <span className="text-[#76b900]">#</span> No subscription
                      </span>
                    </div>
                    <p className="text-[#aaa] text-xs sm:text-[13px] mb-6">
                      Frontier research model APIs, per token, on one unified prepaid balance.
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
                            className={`text-xs px-2.5 py-1 font-mono transition-colors border ${creditAmount === amt
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
                          min="5"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-[#121212] border border-dashed border-[#333] rounded-none py-2.5 pl-8 pr-3 text-[#F0EFE2] font-mono text-base focus:outline-none focus:border-[#76b900] transition-colors"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-[#777]">
                        <span>$5 minimum top-up. Pay per token.</span>
                        <span className="text-[#76b900]">~{Math.round((creditAmount / 0.15) * 10) / 10}M tokens estimate</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-medium text-xs sm:text-sm text-[#F0EFE2] mb-3">What's included</h3>
                      <div className="space-y-2 text-xs text-[#bbb]">
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>OpenAI- and Anthropic-compatible research endpoints</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Per-token pricing with verified prefix & KV-cache discounts</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Session-aware routing keeps replays & simulation states warm</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>One unified research balance, no per-seat licensing fees</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="text-center text-[11px] text-[#777] mb-3">
                        New research accounts start with $1 free compute to test model endpoints.
                      </p>
                      <button
                        type="button"
                        onClick={() => openModal(`Research Infra (PAYG - $${creditAmount})`)}
                        className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-3 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      >
                        Apply for Early Access <ChevronRight size={15} strokeWidth={2.5} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Enterprise */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-6 lg:p-7 border-t md:border-t-0 md:border-l border-dashed border-[#333]">
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2] mb-1.5">Enterprise & Frontier Lab</h2>
                      <p className="text-[#aaa] text-xs sm:text-[13px] leading-relaxed">
                        Dedicated cluster infrastructure, private model weights, and custom research contracts.
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="text-xl sm:text-2xl font-semibold text-[#F0EFE2] font-mono mb-2">Custom pricing</div>
                      <p className="text-xs sm:text-sm font-medium text-[#F0EFE2] mt-5 mb-3">
                        Everything in self-serve research infrastructure, plus:
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#bbb]">
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Private cluster nodes, VPC peering, and custom weights isolation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Audit logs, role-based access control (RBAC), and governance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Contractual high-throughput SLAs up to 99.99% across clusters</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>SOC 2 Type II attestation and enterprise compliance controls</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Dedicated AI research engineer, custom SLA, and direct Slack</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => openModal("Enterprise & Frontier Lab")}
                      className="w-full bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-xs sm:text-sm py-3 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      Apply for Enterprise Cohort <ChevronRight size={15} strokeWidth={2} className="ml-1 text-[#888]" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Exact Screenshot 1 & 2 Model APIs Token Pricing Table */}
            <div className="w-screen relative left-1/2 -translate-x-1/2 z-20 mb-12">
              <SectionDivider position="top" />
            </div>

            <section id="model-apis-pricing" className="mb-24 scroll-mt-20">
              {/* Header & Category Badge */}
              <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-3">
                FRONTIER MODEL APIS & LAB WEIGHTS
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                <h2 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-[#F0EFE2] tracking-tight flex items-center gap-2 flex-wrap">
                  Pay for model tokens, not idle{" "}
                  <span className="bg-[#76b900] text-[#0e0f12] px-2 py-0.5 rounded-none font-semibold leading-tight inline-block">
                    capacity
                  </span>
                </h2>

                <div className="shrink-0">
                  <span className="text-[11px] text-[#888] font-mono font-medium border border-dashed border-[#333] bg-[#1a1a1a] px-3 py-1 rounded-none inline-block">
                    Price per 1M tokens
                  </span>
                </div>
              </div>

              {/* Table Container */}
              <div className="w-full border border-dashed border-[#333] bg-[#151515] overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-[3fr_1.1fr_1.8fr_1.1fr_1.2fr] px-4 sm:px-5 py-3 border-b border-dashed border-[#333] text-xs font-medium text-[#777]">
                    <div>Model</div>
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
                        className={`grid grid-cols-[3fr_1.1fr_1.8fr_1.1fr_1.2fr] px-4 sm:px-5 py-3.5 sm:py-4 items-center group hover:bg-[#1c1c1c] transition-colors ${idx < MODEL_APIS_DATA.length - 1 ? "border-b border-dashed border-[#262626]" : ""
                          }`}
                      >
                        {/* Model Icon + Title (clean row background, no icon border or box) */}
                        <div className="flex items-center gap-3 pr-3">
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <IconComponent size={20} />
                          </div>
                          <span className="font-semibold text-[#F0EFE2] text-sm group-hover:text-[#76b900] transition-colors leading-snug truncate">
                            {model.name}
                          </span>
                        </div>

                        {/* Input Price */}
                        <div className="font-semibold text-[#F0EFE2] text-sm font-mono">
                          {model.inputPrice}
                        </div>

                        {/* Cached Input */}
                        <div className="flex flex-col justify-center">
                          <span className="line-through text-[#666] text-[11px] font-mono leading-none mb-0.5">
                            {model.strikethroughCached}
                          </span>
                          <span className="font-bold text-[#F0EFE2] text-sm leading-tight">
                            {model.cachedPrice}
                          </span>
                          <span className="text-[10px] text-[#666] leading-snug mt-0.5 whitespace-pre-line pr-2">
                            {model.cacheHitRate}
                          </span>
                        </div>

                        {/* Output Price */}
                        <div className="font-semibold text-[#F0EFE2] text-sm font-mono">
                          {model.outputPrice}
                        </div>

                        {/* View Model Link */}
                        <div className="flex justify-end">
                          <span className="text-xs text-[#aaa] group-hover:text-[#F0EFE2] flex items-center gap-1 font-medium transition-colors">
                            View model <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Subtext below table */}
              <div className="mt-3 text-xs text-[#777]">
                Served via Frontier Research Fabric. Context windows, token throughput, and lab evaluation benchmarks are listed on each model page.
              </div>
            </section>

            {/* SECTION 3: Exact Screenshot 2 & 3 Comparison Section */}
            <section className="mb-20">
              <div className="w-full border border-dashed border-[#333] bg-[#151515] flex flex-col">
                {/* Header Description Box */}
                <div className="p-4 sm:p-6 border-b border-dashed border-[#333]">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#F0EFE2] mb-1.5 tracking-tight">
                    Compare Research Infra and Frontier Lab Enterprise
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#888] max-w-2xl leading-relaxed">
                    Self-serve research infrastructure is funded by flexible credit top-ups. Frontier Lab Enterprise adds private cluster compute, custom fine-tuned weights, compliance, and custom terms.
                  </p>
                </div>

                {/* Table Matrix Header */}
                <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#181818]/80">
                  <div className="p-4 sm:p-5 flex items-end">
                    <span className="text-xs font-medium text-[#777]">Feature</span>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col justify-end">
                    <span className="text-sm sm:text-base font-semibold text-[#F0EFE2]">Research Infra</span>
                    <span className="text-[11px] text-[#777] mt-0.5">from a $5 top-up</span>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col justify-end">
                    <span className="text-sm sm:text-base font-semibold text-[#F0EFE2]">Frontier Lab Enterprise</span>
                    <span className="text-[11px] text-[#777] mt-0.5">Custom</span>
                  </div>
                </div>

                {/* Comparison Rows */}
                {COMPARISON_ROWS.map((row, i) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-[1.2fr_1.4fr_1.4fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#282828] text-xs sm:text-[13px] ${i % 2 === 1 ? "bg-[#181818]/40" : "bg-transparent"
                      }`}
                  >
                    <div className="p-3.5 sm:p-4 text-[#aaa] font-normal flex items-center">
                      {row.feature}
                    </div>

                    <div className="p-3.5 sm:p-4 flex items-center text-[#C8C7BA]">
                      {row.isText === true ? (
                        <span>{row.payg as string}</span>
                      ) : row.isText === "mixed" ? (
                        <span>{row.payg as string}</span>
                      ) : row.payg === true ? (
                        <Check size={16} className="text-[#76b900]" strokeWidth={2.5} />
                      ) : (
                        <X size={15} className="text-[#666]" strokeWidth={2} />
                      )}
                    </div>

                    <div className="p-3.5 sm:p-4 flex items-center text-[#C8C7BA]">
                      {row.isText === true ? (
                        <span>{row.enterprise as string}</span>
                      ) : row.enterprise === true ? (
                        <Check size={16} className="text-[#76b900]" strokeWidth={2.5} />
                      ) : (
                        <X size={15} className="text-[#666]" strokeWidth={2} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Callout */}
              <div className="mt-6 text-xs sm:text-sm text-[#888]">
                Compare pay-as-you-go API costs with renting GPUs.{" "}
                <Link
                  href="/economics"
                  className="underline decoration-[#76b900] decoration-1 underline-offset-4 text-[#F0EFE2] hover:text-[#76b900] font-medium transition-colors"
                >
                  Compare GPU fit, rental costs, idle time and API costs
                </Link>{" "}
                for your model and traffic.
              </div>
            </section>

            {/* SECTION 4: Common Questions FAQ */}
            <section className="max-w-3xl mx-auto flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-medium text-[#F0EFE2] mb-2 flex items-center gap-2">
                Common{" "}
                <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none font-semibold">
                  questions
                </span>
              </h2>
              <p className="text-[#888] text-xs sm:text-sm mb-8 text-center">
                Need something else?{" "}
                <a href={`mailto:${founderEmail}`} className="text-[#76b900] hover:underline">
                  Contact our team
                </a>
                .
              </p>

              {/* FAQ Tabs */}
              <div className="flex gap-2 mb-8 bg-[#181818] p-1 border border-[#333]">
                <button
                  onClick={() => setFaqTab("payg")}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${faqTab === "payg" ? "bg-[#76b900] text-[#151515]" : "text-[#888] hover:text-[#F0EFE2]"
                    }`}
                >
                  Pay as you go
                </button>
                <button
                  onClick={() => setFaqTab("enterprise")}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${faqTab === "enterprise" ? "bg-[#76b900] text-[#151515]" : "text-[#888] hover:text-[#F0EFE2]"
                    }`}
                >
                  Enterprise & Batch
                </button>
              </div>

              {/* FAQ Content */}
              <div className="w-full space-y-3.5">
                {faqTab === "payg" ? (
                  <>
                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        How does cached input pricing work?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        When you submit prompts with repeated context (such as large codebases, research papers, sensory state, or conversation memory), our infrastructure detects the cached prefix and discounts input tokens by up to 90% or serves it free during promotional windows.
                      </p>
                    </div>

                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        How do credit top-ups work?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        You can fund your prepaid balance with any amount starting from $5. You only pay for the tokens generated and test-time compute consumed by your models. Unused credits remain valid for 12 months across all research workspaces.
                      </p>
                    </div>

                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        Are there per-seat or per-user fees?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        No. Our frontier AI research infrastructure is charged strictly by token consumption and compute, allowing your entire research team or product application to share one single balance without seat penalties.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        What SLA options are available for Enterprise?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        We offer contractual SLAs up to 99.99% uptime with guaranteed throughput reservations and sub-second failover routing across dedicated frontier cluster hardware.
                      </p>
                    </div>

                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        Can we run private dedicated deployments?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        Yes. Frontier Lab Enterprise contracts support private VPC peering, on-prem datacenter integration, SOC 2 Type II controls, and custom model weights loaded into isolated GPU/TPU nodes.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        ) : (
          <div>
            {/* SECTION 1: 3-Tier Coding Plan Cards & Models Context (Screenshot 1) */}
            <section className="mb-14">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Starter Card */}
                <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors">
                  <div>
                    <h3 className="text-lg font-medium text-[#F0EFE2] mb-1">Starter</h3>
                    <div className="text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-1.5">
                      $10 <span className="text-xs font-normal text-[#888]">a month</span>
                    </div>
                    <p className="text-xs text-[#888] mt-1 mb-6">About $12 of usage a month</p>

                    <div className="space-y-3 text-xs mb-8">
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">5-hour limit</span>
                        <span className="font-semibold text-[#F0EFE2] font-mono">$1.11</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Weekly limit</span>
                        <span className="font-semibold text-[#F0EFE2] font-mono">$2.77</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Free Standby</span>
                        <span className="font-medium text-[#F0EFE2]">Up to $0.20 of chat a day</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#888] pr-2">Requests at once per model, when busy</span>
                        <span className="font-semibold text-[#F0EFE2] shrink-0 font-mono">4 to 48</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openModal("Starter Plan ($10/month)")}
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                  >
                    Apply for Starter Cohort <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </button>
                </div>

                {/* Pro Card */}
                <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors">
                  <div>
                    <h3 className="text-lg font-medium text-[#F0EFE2] mb-1">Pro</h3>
                    <div className="text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-1.5">
                      $29 <span className="text-xs font-normal text-[#888]">a month</span>
                    </div>
                    <p className="text-xs text-[#888] mt-1 mb-6">About $35 of usage a month</p>

                    <div className="space-y-3 text-xs mb-8">
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">5-hour limit</span>
                        <span className="font-semibold text-[#F0EFE2] font-mono">$3.23</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Weekly limit</span>
                        <span className="font-semibold text-[#F0EFE2] font-mono">$8.08</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Free Standby</span>
                        <span className="font-medium text-[#F0EFE2]">Up to $0.58 of chat a day</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#888] pr-2">Requests at once per model, when busy</span>
                        <span className="font-semibold text-[#F0EFE2] shrink-0 font-mono">5 to 48</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openModal("Pro Plan ($29/month)")}
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                  >
                    Apply for Pro Cohort <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </button>
                </div>

                {/* Team Card */}
                <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors">
                  <div>
                    <h3 className="text-lg font-medium text-[#F0EFE2] mb-1">Team</h3>
                    <div className="text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-1.5">
                      $99 <span className="text-xs font-normal text-[#888]">a month</span>
                    </div>
                    <p className="text-xs text-[#888] mt-1 mb-6">About $119 of usage a month</p>

                    <div className="space-y-3 text-xs mb-8">
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">5-hour limit</span>
                        <span className="font-semibold text-[#F0EFE2] font-mono">$10.98</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Weekly limit</span>
                        <span className="font-semibold text-[#F0EFE2] font-mono">$27.46</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Free Standby</span>
                        <span className="font-medium text-[#F0EFE2]">Up to $1.98 of chat a day</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#888] pr-2">Requests at once per model, when busy</span>
                        <span className="font-semibold text-[#F0EFE2] shrink-0 font-mono">8 to 48</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openModal("Team Plan ($99/month)")}
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                  >
                    Apply for Team Cohort <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </button>
                </div>
              </div>

              {/* Models List */}
              <div className="mb-6">
                <div className="text-xs text-[#777] mb-2 font-medium">Frontier Models & Lab Weights</div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#F0EFE2]">
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <OrnithLogo size={14} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">Ornith 1.5 122B</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <DeepSeekLogo size={14} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">DeepSeek V4.1 Flash 1017</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <ZLogo size={12} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">GLM 5.3</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <ZLogo size={12} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">GLM 5.3 Flash</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <NvidiaLogo size={14} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">Nemotron 3.5 Lightning 30B</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <QwenLogo size={14} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">Qwen3.8 27B</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <OrnithLogo size={14} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">Ornith 1.5 35B</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer">
                    <DeepSeekLogo size={14} />
                    <span className="underline decoration-[#555] group-hover:decoration-[#76b900] transition-colors">DeepSeek V4.1 Flash</span>
                  </div>
                </div>
              </div>

              {/* Cached Context Box */}
              <div className="border-t border-dashed border-[#282828] pt-4 mb-4">
                <div className="text-xs text-[#777] mb-1 font-medium">Cached context</div>
                <p className="text-xs sm:text-[13px] text-[#aaa]">
                  Up to <span className="font-bold text-[#F0EFE2]">99.6%</span> cache hit rate, last 24 hours.{" "}
                  From <span className="font-bold text-[#F0EFE2]">$0.01 per 1M cached input tokens</span>, so your plan goes further.
                </p>
              </div>

              <p className="text-xs text-[#777]">
                Every plan is shared by its workspace, not per member.
              </p>
            </section>

            {/* SECTION 2: Limits Section (Screenshot 2) */}
            <div className="w-screen relative left-1/2 -translate-x-1/2 z-20 my-14">
              <SectionDivider position="top" />
            </div>

            <section className="mb-20">
              <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-2">
                LIMITS
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#F0EFE2] tracking-tight mb-8">
                Limits that reset every 5 hours and every{" "}
                <span className="bg-[#76b900] text-black px-2 py-0.5 rounded-none font-semibold inline-block">
                  week
                </span>
              </h2>

              <div className="flex flex-col lg:flex-row items-start justify-between gap-8 pt-2">
                {/* Left Column: Progress bars */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center shrink-0">
                    <RotateCw size={16} className="text-[#76b900]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#777] mb-3 font-medium">Limits reset</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-[#F0EFE2] mb-1.5">Every 5 hours</div>
                        <div className="h-1.5 w-48 sm:w-60 bg-[#262626] rounded-none overflow-hidden">
                          <div className="h-full bg-[#76b900] w-[60%]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#F0EFE2] mb-1.5">Every week</div>
                        <div className="h-1.5 w-48 sm:w-60 bg-[#262626] rounded-none overflow-hidden">
                          <div className="h-full bg-[#76b900] w-[30%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Illustration Label */}
                <div className="hidden lg:block text-[10px] text-[#666] tracking-widest font-mono uppercase pt-1">
                  ILLUSTRATION
                </div>

                {/* Right Column: Flow */}
                <div className="w-full lg:w-auto">
                  <div className="text-xs text-[#777] mb-4 font-medium">What happens at a limit</div>
                  <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto pb-2">
                    {/* Step: Plan */}
                    <div className="flex flex-col items-start min-w-[70px]">
                      <div className="w-2.5 h-2.5 bg-[#76b900] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Plan</span>
                    </div>

                    <div className="text-[#555] text-xs pt-0.5">→</div>

                    {/* Step: Credits */}
                    <div className="flex flex-col items-start max-w-[120px]">
                      <div className="w-2.5 h-2.5 border border-[#76b900] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Credits</span>
                      <span className="text-[11px] text-[#777] leading-tight mt-1">Your choice: a cap, or no limit</span>
                    </div>

                    <div className="text-[#555] text-xs pt-0.5">→</div>

                    {/* Step: Standby */}
                    <div className="flex flex-col items-start max-w-[110px]">
                      <div className="w-2.5 h-2.5 bg-[#76b900] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Standby</span>
                      <span className="text-[11px] text-[#777] leading-tight mt-1">Free, slower chat</span>
                    </div>

                    <div className="text-[#555] text-xs pt-0.5">→</div>

                    {/* Step: Stop */}
                    <div className="flex flex-col items-start max-w-[90px]">
                      <div className="w-2.5 h-2.5 border border-[#666] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Stop</span>
                      <span className="text-[11px] text-[#777] leading-tight mt-1">Until a reset</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Setup Section (Screenshot 3) */}
            <div className="w-screen relative left-1/2 -translate-x-1/2 z-20 my-14">
              <SectionDivider position="top" />
            </div>

            <section className="mb-20">
              <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-2">
                SETUP
              </div>

              <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-10">
                <div className="max-w-md">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#F0EFE2] tracking-tight mb-3">
                    Connect your agents to{" "}
                    <span className="bg-[#76b900] text-black px-2 py-0.5 rounded-none font-semibold inline-block">
                      Frontier Lab
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#888]">
                    Route any coding agent, research CLI, or IDE directly through our Frontier Lab foundation models and high-throughput compute.
                  </p>
                </div>

                <div className="w-full lg:max-w-md">
                  <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-xs sm:text-sm font-medium text-[#F0EFE2] truncate">
                        Automatic setup for your agent
                      </span>
                      <button
                        onClick={handleCopyPrompt}
                        className="text-[11px] text-[#aaa] hover:text-white flex items-center gap-1.5 px-2.5 py-1 border border-[#333] hover:border-[#555] bg-[#141414] transition-colors shrink-0 whitespace-nowrap"
                      >
                        <Copy size={12} /> {copiedPrompt ? "Copied!" : "Copy setup prompt"}
                      </button>
                    </div>

                    <div className="space-y-3 relative pl-1">
                      <div className="absolute left-[13px] top-3 bottom-3 w-[1px] border-l border-dashed border-[#333]" />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-5 h-5 border border-[#76b900] bg-[#151515] text-[#76b900] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          1
                        </div>
                        <span className="text-xs text-[#C8C7BA]">Paste the prompt into your agent or terminal</span>
                      </div>
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-5 h-5 border border-[#76b900] bg-[#151515] text-[#76b900] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          2
                        </div>
                        <span className="text-xs text-[#C8C7BA]">Approve the sign-in in your browser</span>
                      </div>
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-5 h-5 border border-[#76b900] bg-[#151515] text-[#76b900] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          3
                        </div>
                        <span className="text-xs text-[#C8C7BA]">Say yes to the setup plan</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/developer-console"
                    className="text-xs sm:text-[13px] text-[#76b900] underline font-medium mt-3 inline-block hover:opacity-80"
                  >
                    Set up with your coding agent
                  </Link>
                </div>
              </div>

              {/* 20 agents ready */}
              <div className="mb-6">
                <div className="text-xs text-[#777] mb-3 font-medium">20 compatible agents ready</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {READY_AGENTS.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center gap-2.5 min-h-[38px] px-2.5 py-1.5 border border-dashed border-[#262626] bg-[#161616] hover:border-[#76b900]/40 transition-colors"
                    >
                      <span className="w-8 h-8 shrink-0 flex items-center justify-center border border-[#333] bg-black/60 overflow-hidden">
                        <img
                          src={agent.logo}
                          alt={agent.name}
                          width={22}
                          height={22}
                          loading="lazy"
                          decoding="async"
                          className="w-[22px] h-[22px] object-contain"
                        />
                      </span>
                      <span className="text-[13px] leading-[18px] font-medium text-[#F0EFE2] truncate">{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview agents */}
              <div>
                <div className="text-xs text-[#777] mb-3 font-medium">Preview</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-3">
                  {PREVIEW_AGENTS.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center gap-2.5 min-h-[38px] px-2.5 py-1.5 border border-dashed border-[#262626] bg-[#161616] hover:border-[#76b900]/40 transition-colors"
                    >
                      <span className="w-8 h-8 shrink-0 flex items-center justify-center border border-[#333] bg-black/60 overflow-hidden">
                        {agent.logo ? (
                          <img
                            src={agent.logo}
                            alt={agent.name}
                            width={22}
                            height={22}
                            loading="lazy"
                            decoding="async"
                            className="w-[22px] h-[22px] object-contain"
                          />
                        ) : (
                          <span className="text-[11px] font-mono font-medium text-[#888]">{agent.monogram}</span>
                        )}
                      </span>
                      <span className="text-[13px] leading-[18px] font-medium text-[#bbb] truncate">{agent.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#777]">
                  Preview agents may need extra setup. Each connection makes one small test request.
                </p>
              </div>
            </section>

            {/* SECTION 4: Common Questions FAQ & Bottom Choose a Plan (Screenshot 4) */}
            <div className="w-screen relative left-1/2 -translate-x-1/2 z-20 my-14">
              <SectionDivider position="top" />
            </div>

            <section className="mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#F0EFE2] text-center tracking-tight mb-2">
                Common{" "}
                <span className="bg-[#76b900] text-black px-2 py-0.5 rounded-none font-semibold inline-block">
                  questions
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#888] text-center mb-6">
                Can't find what you're looking for?{" "}
                <a href={`mailto:${founderEmail}`} className="text-[#76b900] hover:underline">
                  Get in touch
                </a>
              </p>

              {/* Interactive Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-4xl mx-auto">
                {CODING_PLAN_FAQS.map((faq, index) => {
                  const isActive = codingFaqActive === index;
                  return (
                    <button
                      key={faq.question}
                      onClick={() => setCodingFaqActive(index)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all ${isActive
                          ? "bg-[#76b900] text-black font-semibold shadow-sm"
                          : "bg-[#181818] text-[#888] hover:text-[#F0EFE2] border border-[#282828] hover:border-[#444]"
                        }`}
                    >
                      {faq.question}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Box */}
              <div className="border-t border-b border-dashed border-[#333] py-6 my-8">
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 border border-[#76b900] bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-[#76b900]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[#F0EFE2] mb-2">
                      {CODING_PLAN_FAQS[codingFaqActive].question}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#aaa] leading-relaxed max-w-3xl">
                      {CODING_PLAN_FAQS[codingFaqActive].answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom: Choose a plan */}
              <div className="mt-12">
                <h3 className="text-base sm:text-lg font-medium text-[#F0EFE2] mb-3 flex items-center gap-1.5">
                  Choose a{" "}
                  <span className="bg-[#76b900] text-black px-1.5 py-0.5 font-semibold inline-block">
                    plan
                  </span>
                </h3>

                {/* 3 Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => openModal("Starter Plan ($10/month)")}
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    Apply for Starter, $10 a month <ChevronRight size={13} className="text-[#888]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal("Pro Plan ($29/month)")}
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    Apply for Pro, $29 a month <ChevronRight size={13} className="text-[#888]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal("Team Plan ($99/month)")}
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    Apply for Team, $99 a month <ChevronRight size={13} className="text-[#888]" />
                  </button>
                </div>

                {/* 4 Security Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <Lock size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">TLS in transit, AES-256 at rest</span>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <Cpu size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">Workspace & cluster isolation</span>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <EyeOff size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">No training on your research data</span>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <ShieldCheck size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">SOC 2 Type II attestation</span>
                  </div>
                </div>

                {/* Footer Links */}
                <div className="flex items-center gap-4 text-xs text-[#777]">
                  <Link href="/developer-console" className="underline hover:text-[#F0EFE2] transition-colors">
                    Model library
                  </Link>
                  <Link href="/terms" className="underline hover:text-[#F0EFE2] transition-colors">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Founding Cohort Application Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl border border-dashed border-[#444] bg-[#161616] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#76b900] animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#76b900] font-semibold">
                    Founding Cohort Application
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2] tracking-tight">
                  Apply for Early Compute Access
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
                <div className="w-12 h-12 rounded-full bg-[#76b900]/10 border border-[#76b900] flex items-center justify-center mx-auto text-[#76b900]">
                  <Check size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Application Received</h3>
                  <p className="text-xs text-[#aaa] mt-1.5 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="text-[#F0EFE2] font-semibold">{formData.name || "Researcher"}</span>. Your priority founding access request for <span className="text-[#76b900] font-mono">{modalPlan}</span> has been logged.
                  </p>
                </div>
                <div className="p-3.5 bg-[#1a1a1a] border border-dashed border-[#333] text-left text-xs space-y-2 max-w-md mx-auto">
                  <div className="text-[11px] font-mono text-[#76b900] uppercase font-semibold">What happens next:</div>
                  <p className="text-[#888] leading-relaxed">
                    1. Our engineering team reviews cluster capacity and workload fit within 24 hours.
                  </p>
                  <p className="text-[#888] leading-relaxed">
                    2. We will email API endpoint keys and sandbox onboarding instructions directly to <span className="text-[#F0EFE2]">{formData.email || "your provided address"}</span>.
                  </p>
                  <p className="text-[#888] leading-relaxed">
                    3. Direct founder line:{" "}
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
                  <span className="text-[#76b900] font-semibold">Pre-launch note:</span> We are currently rolling out verified compute access to research labs & engineering teams in phased cohorts. Submitting this form locks in your founding price tier and places you in the next active deployment batch.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ada Lovelace"
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
                      placeholder="researcher@lab.org"
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
                      placeholder="Frontier AI Lab / Independent"
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
                      <option value="Under 10M tokens/month">Under 10M tokens / month</option>
                      <option value="10M - 100M tokens/month">10M - 100M tokens / month</option>
                      <option value="100M - 1B tokens/month">100M - 1B tokens / month</option>
                      <option value="1B+ tokens/month (Dedicated)">1B+ tokens / month (Dedicated)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                    Primary Workload Focus
                  </label>
                  <select
                    value={formData.workload}
                    onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] focus:border-[#76b900] px-2.5 py-2 text-xs text-[#F0EFE2] outline-none transition-colors cursor-pointer"
                  >
                    <option value="Autonomous Agents & Memory Systems">Autonomous Agents & Memory Systems</option>
                    <option value="Reasoning & RL Test-Time Compute">Reasoning & RL Test-Time Compute</option>
                    <option value="Frontier Coding & Synthetic Data">Frontier Coding & Synthetic Data</option>
                    <option value="Physical Intelligence / Robotics Simulation">Physical Intelligence / Robotics Simulation</option>
                    <option value="High-Throughput Production Inference">High-Throughput Production Inference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#888] mb-1.5">
                    Research or Application Details (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe your stack, models needed, or cluster SLA requirements..."
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
                  <p className="text-[10px] text-center text-[#666] mt-2">
                    Review turnaround within 24 hours. No upfront payment required until cluster access is activated.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  );
}

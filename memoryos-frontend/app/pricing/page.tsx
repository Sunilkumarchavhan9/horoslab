"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, ChevronRight, Sparkles, ShieldCheck, Zap, Info } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";
import {
  DeepSeekLogo,
  OrnithLogo,
  NvidiaLogo,
  QwenLogo,
  GLMLogo,
} from "@/components/horos/primitives/brand-icons";
const founderEmail = "chavhansunilkumar753@gmail.com";

function ZLogo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-white shrink-0"
    >
      <path d="M4 4.5h16v3.2l-9.8 9.5H20V20.5H4v-3.2l9.8-9.5H4V4.5z" />
    </svg>
  );
}

function OrnithAvatar({ size = 26 }: { size?: number }) {
  return (
    <img
      src="https://ornith.ai/assets/webp/header-logo-Bjk6zmTF.webp"
      alt="Ornith"
      width={size}
      height={size}
      className="w-full h-full object-cover rounded-sm"
    />
  );
}

// Exact 8 models from Screenshot 1 & Screenshot 2
const MODEL_APIS_DATA = [
  {
    id: "ornith-1-5-122b",
    name: "Ornith 1.5 122B",
    developer: "Ornith",
    icon: OrnithAvatar,
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
    icon: OrnithAvatar,
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

// Exact comparison matrix from Screenshot 2 & 3
const COMPARISON_ROWS = [
  {
    feature: "Pricing model",
    payg: "Credit top-ups from $5, pay for what you run",
    enterprise: "Custom volume and terms",
    isText: true,
  },
  {
    feature: "Balance",
    payg: "One balance for Model APIs",
    enterprise: "One shared balance with custom controls",
    isText: true,
  },
  {
    feature: "Seats",
    payg: "No per-seat fees",
    enterprise: "No per-seat fees",
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
    payg: "No contractual SLA",
    enterprise: "Up to 99.99%",
    isText: true,
  },
  {
    feature: "Support",
    payg: "Priority email",
    enterprise: "Dedicated CSM and private Slack",
    isText: true,
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<"payg" | "coding">("payg");
  const [creditAmount, setCreditAmount] = useState(20);
  const [faqTab, setFaqTab] = useState<"payg" | "enterprise">("payg");

  return (
    <div className="relative min-h-screen bg-[#151515] text-[#C8C7BA] font-sans overflow-x-hidden selection:bg-[#76b900] selection:text-black">
      {/* Background Vertical Dashed Layout Guidelines */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[6%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
        <div className="absolute left-[94%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
      </div>

      {/* Top Navbar */}
      <LandingNavbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto pt-28 pb-32 px-4 sm:px-6 md:px-0 relative z-10">

        {/* SECTION 1: Top Product Plans Selection */}
        <section className="mb-20">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-[42px] font-medium tracking-tight flex items-center gap-2.5 text-[#F0EFE2] leading-tight">
              Simple pricing for open{" "}
              <span className="bg-[#76b900] text-[#151515] px-2.5 py-0.5 rounded-none font-semibold inline-block">
                models
              </span>
            </h1>
            <p className="text-[#888] text-base md:text-lg mt-2 font-normal">
              Pick the way that fits how you work.
            </p>
          </div>

          {/* Plan Selector Cards (Pay as you go vs Coding plan vs Platform) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Pay as you go Card */}
            <div
              onClick={() => setSelectedPlan("payg")}
              className={`border border-dashed p-6 cursor-pointer transition-all ${selectedPlan === "payg"
                  ? "border-[#76b900] bg-[#1a1a1a]/40 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                  : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-medium text-[#F0EFE2]">Pay as you go</h2>
                <div
                  className={`w-4 h-4 rounded-none border flex items-center justify-center transition-colors ${selectedPlan === "payg" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "payg" && <div className="w-2 h-2 rounded-none bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-sm mb-6 font-normal">For apps, APIs and everything else</p>

              <div className="text-sm">
                <p className="font-medium mb-3 text-[#F0EFE2]">Any amount from $5</p>
                <ul className="space-y-2 text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#76b900] shrink-0" /> Pay per token at published prices
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#76b900] shrink-0" /> Credits last a year
                  </li>
                </ul>
              </div>
            </div>

            {/* Coding Plan Card */}
            <div
              onClick={() => setSelectedPlan("coding")}
              className={`border border-dashed p-6 cursor-pointer transition-all ${selectedPlan === "coding"
                  ? "border-[#76b900] bg-[#1a1a1a]/40 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                  : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-medium text-[#F0EFE2]">Coding plan</h2>
                <div
                  className={`w-4 h-4 rounded-none border flex items-center justify-center transition-colors ${selectedPlan === "coding" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "coding" && <div className="w-2 h-2 rounded-none bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-sm mb-6 font-normal">For Claude Code, Codex, OpenCode and more</p>

              <div className="text-sm">
                <p className="font-medium mb-3 text-[#F0EFE2]">From $10 a month</p>
                <ul className="space-y-2 text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#76b900] shrink-0" /> Usage included, resets every 5 hours and every week
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#76b900] shrink-0" /> At a limit, credits or free Standby
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Selected Plan Details & Enterprise Split Box */}
          <div className="border border-dashed border-[#333] bg-[#181818]/60 flex flex-col md:flex-row">
            {/* Left Column: Dynamic based on selected plan */}
            <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-8 md:p-10">
              {selectedPlan === "payg" ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-medium text-[#F0EFE2]">Pay as you go</h2>
                    <span className="text-xs font-mono tracking-wide bg-[#222] border border-[#333] px-2.5 py-1 text-[#aaa] flex items-center gap-1.5">
                      <span className="text-[#76b900]">#</span> No subscription
                    </span>
                  </div>
                  <p className="text-[#aaa] text-sm mb-8">
                    Hosted Model APIs, per token, on one prepaid balance.
                  </p>

                  <div className="mb-8">
                    <label className="text-[11px] text-[#777] font-semibold uppercase tracking-widest mb-3 block">
                      AMOUNT IN DOLLARS
                    </label>

                    {/* Quick amount presets */}
                    <div className="flex items-center gap-2 mb-3">
                      {[5, 20, 50, 100, 250].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCreditAmount(amt)}
                          className={`text-xs px-3 py-1 font-mono transition-colors border ${creditAmount === amt
                              ? "bg-[#76b900] text-black border-[#76b900] font-semibold"
                              : "bg-[#222] text-[#888] border-[#333] hover:text-white"
                            }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F0EFE2] font-semibold text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        min="5"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#121212] border border-dashed border-[#333] rounded-none py-3 pl-9 pr-4 text-[#F0EFE2] font-mono text-lg focus:outline-none focus:border-[#76b900] transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2.5 text-[11px] text-[#777]">
                      <span>$5 minimum top-up. Pay per token.</span>
                      <span className="text-[#76b900]">~{Math.round((creditAmount / 0.15) * 10) / 10}M tokens estimate</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="font-medium text-sm text-[#F0EFE2] mb-4">What's included</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#bbb]">
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>OpenAI- and Anthropic-compatible APIs</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Per-token pricing with cached input discounts</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Session-aware routing keeps replays warm</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>One prepaid balance, no per-seat fees</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-center text-xs text-[#777] mb-4">
                      New accounts start with $1 free to test the Model APIs.
                    </p>
                    <Link
                      href="/developer-console"
                      className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-sm py-3.5 flex items-center justify-center transition-colors shadow-sm"
                    >
                      Add credits <ChevronRight size={16} strokeWidth={2.5} className="ml-1" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-medium text-[#F0EFE2]">Coding plan</h2>
                    <span className="text-xs font-mono tracking-wide bg-[#222] border border-[#333] px-2.5 py-1 text-[#aaa] flex items-center gap-1.5">
                      <span className="text-[#76b900]">#</span> Subscription
                    </span>
                  </div>
                  <p className="text-[#aaa] text-sm mb-8">
                    For Claude Code, Codex, OpenCode, Cursor, and agent terminal workflows.
                  </p>

                  <div className="mb-8 p-4 border border-dashed border-[#333] bg-[#141414]">
                    <div className="text-xs text-[#777] uppercase tracking-wider mb-1">Developer Subscription</div>
                    <div className="text-3xl font-semibold text-[#F0EFE2] font-mono">$10 <span className="text-xs font-normal text-[#888]">/ month</span></div>
                    <p className="text-xs text-[#888] mt-2">Includes dedicated throughput and priority coding queues.</p>
                  </div>

                  <div className="mb-8">
                    <h3 className="font-medium text-sm text-[#F0EFE2] mb-4">What's included</h3>
                    <div className="space-y-3 text-xs text-[#bbb]">
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Usage included, resets every 5 hours and every week</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>At a limit, automatic fallback to credits or free Standby</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Native integration with Cursor, Claude Code, and Windsurf</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                        <span>Zero rate-limit throttling during sprint sessions</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/developer-console"
                      className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-sm py-3.5 flex items-center justify-center transition-colors shadow-sm"
                    >
                      Subscribe to Coding Plan <ChevronRight size={16} strokeWidth={2.5} className="ml-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Enterprise (Always visible) */}
            <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-8 md:p-10 border-t md:border-t-0 md:border-l border-dashed border-[#333]">
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-[#F0EFE2] mb-2">Enterprise</h2>
                  <p className="text-[#aaa] text-sm leading-relaxed">
                    Dedicated infrastructure, compliance, and custom volume.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="text-2xl font-semibold text-[#F0EFE2] font-mono mb-2">Custom pricing</div>
                  <p className="text-sm font-medium text-[#F0EFE2] mt-6 mb-4">
                    Everything self-serve includes, plus:
                  </p>
                  <ul className="space-y-3.5 text-xs text-[#bbb]">
                    <li className="flex items-start gap-2.5">
                      <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Audit logs and role-based access control (RBAC)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Custom volume and contract terms</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Custom SLAs up to 99.99%</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>SOC 2 Type II attestation</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={14} className="text-[#76b900] mt-0.5 shrink-0" />
                      <span>Dedicated CSM and private Slack</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4">
                <a
                  href={`mailto:${founderEmail}?subject=HOROS%20Enterprise%20Inquiry`}
                  className="w-full bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-sm py-3.5 flex items-center justify-center transition-colors"
                >
                  Request a demo <ChevronRight size={16} strokeWidth={2} className="ml-1 text-[#888]" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Exact Screenshot 1 & 2 Model APIs Token Pricing Table */}
        <div className="w-full relative z-20 mb-12">
          <SectionDivider position="top" />
        </div>

        <section id="model-apis-pricing" className="mb-24 scroll-mt-20">
          {/* Header & Category Badge */}
          <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-3">
            MODEL APIS
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-[#F0EFE2] tracking-tight flex items-center gap-2 flex-wrap">
              Pay for model tokens, not idle{" "}
              <span className="bg-[#76b900] text-[#0e0f12] px-2.5 py-0.5 rounded-none font-semibold leading-tight inline-block">
                capacity
              </span>
            </h2>

            <div className="shrink-0">
              <span className="text-xs text-[#888] font-mono font-medium border border-dashed border-[#333] bg-[#1a1a1a] px-3.5 py-1.5 rounded-none inline-block">
                Price per 1M tokens
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full border border-dashed border-[#333] bg-[#151515] overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Header Row */}
              <div className="grid grid-cols-[3fr_1.1fr_1.8fr_1.1fr_1.2fr] px-6 py-4 border-b border-dashed border-[#333] text-xs font-medium text-[#777]">
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
                    className={`grid grid-cols-[3fr_1.1fr_1.8fr_1.1fr_1.2fr] px-6 py-5 items-center group hover:bg-[#1c1c1c] transition-colors ${
                      idx < MODEL_APIS_DATA.length - 1 ? "border-b border-dashed border-[#262626]" : ""
                    }`}
                  >
                    {/* Model Icon + Title + Promo Subtext */}
                    <div className="flex items-center gap-3.5 pr-4">
                      <div className="w-9 h-9 rounded-md bg-[#1c1c1f] border border-[#333] flex items-center justify-center shrink-0 p-1 group-hover:border-[#76b900] transition-colors overflow-hidden">
                        <IconComponent size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#F0EFE2] text-[15px] group-hover:text-[#76b900] transition-colors leading-snug">
                          {model.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs leading-snug mt-0.5">
                          <span className="text-[#76b900] font-medium">{model.promo}</span>
                          <span className="text-[#777] font-normal">{model.promoUntil}</span>
                        </div>
                      </div>
                    </div>

                    {/* Input Price */}
                    <div className="font-semibold text-[#F0EFE2] text-[15px] font-mono">
                      {model.inputPrice}
                    </div>

                    {/* Cached Input (3 separate stacked lines matching Image 2) */}
                    <div className="flex flex-col justify-center">
                      <span className="line-through text-[#666] text-xs font-mono leading-none mb-1">
                        {model.strikethroughCached}
                      </span>
                      <span className="font-bold text-[#F0EFE2] text-[15px] leading-tight">
                        {model.cachedPrice}
                      </span>
                      <span className="text-[11px] text-[#666] leading-snug mt-1 whitespace-pre-line pr-2">
                        {model.cacheHitRate}
                      </span>
                    </div>

                    {/* Output Price */}
                    <div className="font-semibold text-[#F0EFE2] text-[15px] font-mono">
                      {model.outputPrice}
                    </div>

                    {/* View Model Link */}
                    <div className="flex justify-end">
                      <span className="text-xs md:text-[13px] text-[#aaa] group-hover:text-[#F0EFE2] flex items-center gap-1.5 font-medium transition-colors">
                        View model <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Subtext below table */}
          <div className="mt-4 text-xs text-[#777]">
            Limits and modality-specific capabilities are listed on each model page.
          </div>
        </section>

        {/* SECTION 3: Exact Screenshot 2 & 3 Comparison Section */}
        <section className="mb-24">
          <div className="w-full border border-dashed border-[#333] bg-[#151515] flex flex-col">
            {/* Header Description Box */}
            <div className="p-6 sm:p-8 border-b border-dashed border-[#333]">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#F0EFE2] mb-2 tracking-tight">
                Compare Pay as you go and Enterprise
              </h2>
              <p className="text-xs sm:text-sm text-[#888] max-w-2xl leading-relaxed">
                Pay as you go is self-serve, funded by credit top-ups. Enterprise adds private infrastructure, reserved capacity, compliance, and custom terms.
              </p>
            </div>

            {/* Table Matrix Header */}
            <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#181818]/80">
              <div className="p-5 sm:p-6 flex items-end">
                <span className="text-xs font-medium text-[#777]">Feature</span>
              </div>
              <div className="p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-base sm:text-lg font-semibold text-[#F0EFE2]">Pay as you go</span>
                <span className="text-xs text-[#777] mt-0.5">from a $5 top-up</span>
              </div>
              <div className="p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-base sm:text-lg font-semibold text-[#F0EFE2]">Enterprise</span>
                <span className="text-xs text-[#777] mt-0.5">Custom</span>
              </div>
            </div>

            {/* Comparison Rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1.2fr_1.4fr_1.4fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#282828] text-xs sm:text-sm ${i % 2 === 1 ? "bg-[#181818]/40" : "bg-transparent"
                  }`}
              >
                {/* Feature Name */}
                <div className="p-4 sm:p-5 text-[#aaa] font-normal flex items-center">
                  {row.feature}
                </div>

                {/* Pay as you go Value */}
                <div className="p-4 sm:p-5 flex items-center text-[#C8C7BA]">
                  {row.isText === true ? (
                    <span>{row.payg as string}</span>
                  ) : row.isText === "mixed" ? (
                    <span>{row.payg as string}</span>
                  ) : row.payg === true ? (
                    <Check size={18} className="text-[#76b900]" strokeWidth={2.5} />
                  ) : (
                    <X size={16} className="text-[#666]" strokeWidth={2} />
                  )}
                </div>

                {/* Enterprise Value */}
                <div className="p-4 sm:p-5 flex items-center text-[#C8C7BA]">
                  {row.isText === true ? (
                    <span>{row.enterprise as string}</span>
                  ) : row.enterprise === true ? (
                    <Check size={18} className="text-[#76b900]" strokeWidth={2.5} />
                  ) : (
                    <X size={16} className="text-[#666]" strokeWidth={2} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Screenshot 3 Bottom Callout */}
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



        {/* SECTION 5: Common Questions FAQ */}
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
          <div className="w-full space-y-4">
            {faqTab === "payg" ? (
              <>
                <div className="border border-dashed border-[#333] bg-[#181818]/60 p-6">
                  <h3 className="font-medium text-[#F0EFE2] mb-2 text-sm flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 border border-[#76b900] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-[#76b900]" />
                    </div>
                    How does cached input pricing work?
                  </h3>
                  <p className="text-[#aaa] text-xs sm:text-sm pl-6 leading-relaxed">
                    When you send a prompt with repeated context (like conversation history, code repositories, or documents), supported models detect the cached prefix and discount the input cost by up to 90% or offer it completely free during promotional windows.
                  </p>
                </div>

                <div className="border border-dashed border-[#333] bg-[#181818]/60 p-6">
                  <h3 className="font-medium text-[#F0EFE2] mb-2 text-sm flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 border border-[#76b900] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-[#76b900]" />
                    </div>
                    How do credit top-ups work?
                  </h3>
                  <p className="text-[#aaa] text-xs sm:text-sm pl-6 leading-relaxed">
                    You can fund your prepaid balance with any amount starting from $5. You only pay for the tokens generated and executed. Unused credits remain valid for 12 months.
                  </p>
                </div>

                <div className="border border-dashed border-[#333] bg-[#181818]/60 p-6">
                  <h3 className="font-medium text-[#F0EFE2] mb-2 text-sm flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 border border-[#76b900] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-[#76b900]" />
                    </div>
                    Are there per-seat or per-user fees?
                  </h3>
                  <p className="text-[#aaa] text-xs sm:text-sm pl-6 leading-relaxed">
                    No. Our pay-as-you-go model APIs are charged strictly by token consumption, allowing your entire team or product application to share one single balance without seat penalties.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="border border-dashed border-[#333] bg-[#181818]/60 p-6">
                  <h3 className="font-medium text-[#F0EFE2] mb-2 text-sm flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 border border-[#76b900] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-[#76b900]" />
                    </div>
                    What SLA options are available for Enterprise?
                  </h3>
                  <p className="text-[#aaa] text-xs sm:text-sm pl-6 leading-relaxed">
                    We offer contractual SLAs up to 99.99% uptime with guaranteed throughput reservations and sub-second failover routing across dedicated clusters.
                  </p>
                </div>

                <div className="border border-dashed border-[#333] bg-[#181818]/60 p-6">
                  <h3 className="font-medium text-[#F0EFE2] mb-2 text-sm flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 border border-[#76b900] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-[#76b900]" />
                    </div>
                    Can we run private dedicated deployments?
                  </h3>
                  <p className="text-[#aaa] text-xs sm:text-sm pl-6 leading-relaxed">
                    Yes. Enterprise contracts support private VPC peering, on-prem hardware integration, SOC 2 Type II controls, and custom model weights loaded into isolated nodes.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  );
}

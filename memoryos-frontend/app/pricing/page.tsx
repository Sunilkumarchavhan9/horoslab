"use client";

import React, { useState } from "react";
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

const CODING_PLAN_FAQS = [
  {
    question: "What happens at a limit?",
    answer:
      "If you turned on Keep full speed on credits, credits pay with your choice of a cap per billing period or no limit. When credits cannot pay, free Standby serves chat. Choose at checkout and change it in Coding plan. If neither can serve a request, it stops with the reason, reset time and next step.",
  },
  {
    question: "What does my plan cover?",
    answer:
      "Your plan covers all coding models and agent workflows up to your 5-hour and weekly limits. Standby chat remains free when limits are reached, so your workflow is never interrupted.",
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
      "Usage is calculated per token generated and processed by your connected coding agent, discounted by automated prefix and context caching.",
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
    name: "Claude Code",
    icon: <ClaudeLogo size={15} className="text-[#E27D60]" />,
  },
  {
    name: "Codex",
    icon: <OpenAILogo size={15} className="text-[#10A37F]" />,
  },
  {
    name: "OpenCode",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2.5" fill="none" />
        <rect x="8.5" y="8.5" width="7" height="7" fill="white" />
      </svg>
    ),
  },
  {
    name: "Pi",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M4 6.5h16v3h-3.5v8H13v-8H9v8H5.5v-8H4v-3z" />
      </svg>
    ),
  },
  {
    name: "Aider",
    icon: (
      <div className="w-full h-full bg-[#00e676] flex items-center justify-center">
        <span className="font-mono font-black text-[10px] text-black tracking-tighter">ai</span>
      </div>
    ),
  },
  {
    name: "Qwen Code",
    icon: <QwenLogo size={15} className="text-[#8B5CF6]" />,
  },
  {
    name: "Kilo Code",
    icon: (
      <div className="w-full h-full bg-[#FACC15] flex items-center justify-center">
        <span className="font-mono font-black text-[9px] text-black tracking-tighter leading-none">kilo</span>
      </div>
    ),
  },
  {
    name: "Goose",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M5 11c0-2.8 2.2-5 5-5 1.5 0 2.8.6 3.7 1.6l.8.9h4.5c1.1 0 2 .9 2 2v1h-5.5l-1.5-1.5c-.5-.5-1.2-.8-1.9-.8-1.7 0-3 1.3-3 3 0 .9.4 1.7 1 2.2l2.8 2.5v3.6l-3.2-2.8C6.8 16.1 5 13.7 5 11z" />
        <circle cx="8" cy="9" r="1" fill="#151515" />
      </svg>
    ),
  },
  {
    name: "Continue",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-white">
        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.2" />
        <circle cx="12" cy="12" r="4" fill="white" />
      </svg>
    ),
  },
  {
    name: "Cline",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#38BDF8]">
        <rect x="4" y="6" width="16" height="14" rx="3.5" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
        <path d="M12 2v4" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="12" r="1.5" fill="#38BDF8" />
        <circle cx="15" cy="12" r="1.5" fill="#38BDF8" />
        <path d="M9 16c.8.6 1.8.8 3 .8s2.2-.2 3-.8" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Droid",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-white">
        <circle cx="12" cy="12" r="2.8" fill="white" />
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.1-6.9-2.8 2.8m-8.2 8.2-2.8 2.8m0-13.8 2.8 2.8m8.2 8.2 2.8 2.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Grok Build",
    icon: <GrokLogo size={14} className="text-white" />,
  },
  {
    name: "Hermes Agent",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" fill="#0D0D11" rx="2" />
        <path d="M6 18c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="#FFFFFF" />
        <circle cx="12" cy="9" r="4" fill="#FFFFFF" />
        <path d="M4 8l4 2-1 3-3-2zM20 8l-4 2 1 3 3-2z" fill="#FFFFFF" />
        <circle cx="10.5" cy="9" r="0.8" fill="#0D0D11" />
        <circle cx="13.5" cy="9" r="0.8" fill="#0D0D11" />
      </svg>
    ),
  },
  {
    name: "OpenClaw",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-[#EF4444]">
        <ellipse cx="12" cy="14" rx="6.5" ry="5" />
        <circle cx="9.5" cy="11.5" r="1.3" fill="#151515" />
        <circle cx="14.5" cy="11.5" r="1.3" fill="#151515" />
        <path d="M6.5 11C4.5 9.5 3 7.5 4 5s3.5.5 4 2.8M17.5 11c2-1.5 3.5-3.5 2.5-6s-3.5.5-4 2.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M5 16.5l-2.5 2.5M19 16.5l2.5 2.5M7.5 18.5l-1.5 2.5M16.5 18.5l1.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Crush",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#F43F5E">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        <circle cx="8.5" cy="9.5" r="1.2" fill="#151515" />
        <circle cx="15.5" cy="9.5" r="1.2" fill="#151515" />
      </svg>
    ),
  },
  {
    name: "Kimi CLI",
    icon: (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
          <path d="M6 3h3.5v7.5l5.5-7.5H20l-6.8 9 7.3 9h-4.8l-5.2-7v7H6V3z" />
        </svg>
      </div>
    ),
  },
  {
    name: "Mistral Vibe",
    icon: <MistralLogo size={14} />,
  },
  {
    name: "Forge",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400">
        <path d="M8 3C6 3 5 4 5 6v3c0 1.5-1 2-2 2 1 0 2 .5 2 2v3c0 2 1 3 3 3m8-16c2 0 3 1 3 3v3c0 1.5 1 2 2 2-1 0-2 .5-2 2v3c0 2-1 3-3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Nanocoder",
    icon: (
      <div className="w-full h-full bg-[#111] flex items-center justify-center">
        <span className="font-mono font-bold text-[10px] text-white tracking-tight">NC</span>
      </div>
    ),
  },
];

const PREVIEW_AGENTS = [
  {
    name: "Zed",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M4 5h16v3.2l-9.8 9.5H20V20.5H4v-3.2l9.8-9.5H4V5z" />
      </svg>
    ),
  },
  {
    name: "Oh My Pi",
    icon: (
      <div className="w-full h-full bg-[#25143a] flex items-center justify-center">
        <span className="font-serif font-bold text-xs text-[#C084FC]">π</span>
      </div>
    ),
  },
  {
    name: "gptme",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-sky-400">
        <rect x="3" y="6" width="18" height="14" rx="3.5" fill="#0C2340" stroke="#38BDF8" strokeWidth="1.8" />
        <path d="M12 2v4" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8.5" cy="12" r="1.5" fill="#38BDF8" />
        <circle cx="15.5" cy="12" r="1.5" fill="#38BDF8" />
      </svg>
    ),
  },
  {
    name: "Tabby",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#F97316">
        <path d="M12 3C7 3 3 7 3 12c0 5 4 9 9 9s9-4 9-9c0-5-4-9-9-9z" />
        <path d="M6 7l2.5 3.5h-5L6 7zm12 0l2.5 3.5h-5L18 7z" fill="#EA580C" />
        <circle cx="8.5" cy="13" r="1.3" fill="#151515" />
        <circle cx="15.5" cy="13" r="1.3" fill="#151515" />
        <path d="M12 15l-1 1.2h2l-1-1.2z" fill="#FFFFFF" />
        <path d="M11 5h2v3h-2zm-3.5 1h2v2h-2zm7 0h2v2h-2z" fill="#C2410C" />
      </svg>
    ),
  },
  {
    name: "Octofriend",
    icon: (
      <div className="w-full h-full bg-[#1b1c20] flex items-center justify-center">
        <span className="font-mono font-bold text-[9px] text-[#CBD5E1]">OC</span>
      </div>
    ),
  },
  {
    name: "Command Code",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-white">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
  {
    name: "Junie CLI",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#00E676" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#00B0FF" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#7C4DFF" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#FF5252" />
      </svg>
    ),
  },
  {
    name: "VS Code Copilot Chat",
    icon: (
      <div className="w-full h-full bg-[#081a2e] flex items-center justify-center">
        <span className="font-mono font-bold text-[9px] text-[#38BDF8]">VC</span>
      </div>
    ),
  },
  {
    name: "Theia AI",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-white">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4.5" fill="white" />
      </svg>
    ),
  },
  {
    name: "OpenHands CLI",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-300">
        <path d="M10 2c-.6 0-1 .4-1 1v7H8V4c0-.6-.4-1-1-1s-1 .4-1 1v6H5V6c0-.6-.4-1-1-1s-1 .4-1 1v9c0 4.4 3.6 8 8 8s8-3.6 8-8V9c0-.6-.4-1-1-1s-1 .4-1 1v3h-1V5c0-.6-.4-1-1-1s-1 .4-1 1v5h-1V3c0-.6-.4-1-1-1z" />
      </svg>
    ),
  },
  {
    name: "Copilot CLI",
    icon: (
      <div className="w-full h-full bg-[#1e232a] flex items-center justify-center">
        <span className="font-mono font-bold text-[9px] text-white">CP</span>
      </div>
    ),
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<"payg" | "coding">("payg");
  const [creditAmount, setCreditAmount] = useState(20);
  const [faqTab, setFaqTab] = useState<"payg" | "enterprise">("payg");
  const [codingFaqActive, setCodingFaqActive] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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

      {/* Top Navbar */}
      <LandingNavbar />

      {/* Main Container - Sits cleanly inside inner dashed lines with breathing room */}
      <main className="w-[92%] sm:w-[90%] md:w-[calc(72%_-_280px)] lg:w-[calc(64%_-_300px)] xl:w-[calc(64%_-_340px)] mx-auto pt-24 sm:pt-28 pb-32 relative z-10">

        {/* SECTION 1: Top Product Plans Selection */}
        <section className="mb-16">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight flex items-center gap-2 text-[#F0EFE2] leading-tight">
              Simple pricing for open{" "}
              <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none font-semibold inline-block">
                models
              </span>
            </h1>
            <p className="text-[#888] text-xs sm:text-sm md:text-base mt-2 font-normal">
              Pick the way that fits how you work.
            </p>
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
                <h2 className="text-lg font-medium text-[#F0EFE2]">Pay as you go</h2>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedPlan === "payg" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "payg" && <div className="w-2 h-2 rounded-full bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-xs sm:text-[13px] mb-4 font-normal">For apps, APIs and everything else</p>

              <div className="text-xs sm:text-sm">
                <p className="font-medium mb-2 text-[#F0EFE2]">Any amount from $5</p>
                <ul className="space-y-1.5 text-xs text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Pay per token at published prices
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Credits last a year
                  </li>
                </ul>
              </div>
            </div>

            {/* Coding Plan Card */}
            <div
              onClick={() => setSelectedPlan("coding")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all ${selectedPlan === "coding"
                  ? "border-[#76b900] bg-[#1a1a1a]/40 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                  : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
                }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <h2 className="text-lg font-medium text-[#F0EFE2]">Coding plan</h2>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedPlan === "coding" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "coding" && <div className="w-2 h-2 rounded-full bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-xs sm:text-[13px] mb-4 font-normal">For Claude Code, Codex, OpenCode and more</p>

              <div className="text-xs sm:text-sm">
                <p className="font-medium mb-2 text-[#F0EFE2]">From $10 a month</p>
                <ul className="space-y-1.5 text-xs text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Usage included, resets every 5 hours and every week
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> At a limit, credits or free Standby
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
                      <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2]">Pay as you go</h2>
                      <span className="text-[11px] font-mono tracking-wide bg-[#222] border border-[#333] px-2 py-0.5 text-[#aaa] flex items-center gap-1.5">
                        <span className="text-[#76b900]">#</span> No subscription
                      </span>
                    </div>
                    <p className="text-[#aaa] text-xs sm:text-[13px] mb-6">
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
                          <span>OpenAI- and Anthropic-compatible APIs</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Per-token pricing with cached input discounts</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Session-aware routing keeps replays warm</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>One prepaid balance, no per-seat fees</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="text-center text-[11px] text-[#777] mb-3">
                        New accounts start with $1 free to test the Model APIs.
                      </p>
                      <Link
                        href="/developer-console"
                        className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-3 flex items-center justify-center transition-colors shadow-sm"
                      >
                        Add credits <ChevronRight size={15} strokeWidth={2.5} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right Column: Enterprise */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-6 lg:p-7 border-t md:border-t-0 md:border-l border-dashed border-[#333]">
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2] mb-1.5">Enterprise</h2>
                      <p className="text-[#aaa] text-xs sm:text-[13px] leading-relaxed">
                        Dedicated infrastructure, compliance, and custom volume.
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="text-xl sm:text-2xl font-semibold text-[#F0EFE2] font-mono mb-2">Custom pricing</div>
                      <p className="text-xs sm:text-sm font-medium text-[#F0EFE2] mt-5 mb-3">
                        Everything self-serve includes, plus:
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#bbb]">
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
                          <span>SOC 2 Type II attestation</span>
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
                      href={`mailto:${founderEmail}?subject=HOROS%20Enterprise%20Inquiry`}
                      className="w-full bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-xs sm:text-sm py-3 flex items-center justify-center transition-colors"
                    >
                      Request a demo <ChevronRight size={15} strokeWidth={2} className="ml-1 text-[#888]" />
                    </a>
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
                MODEL APIS
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
                        className={`grid grid-cols-[3fr_1.1fr_1.8fr_1.1fr_1.2fr] px-4 sm:px-5 py-3.5 sm:py-4 items-center group hover:bg-[#1c1c1c] transition-colors ${
                          idx < MODEL_APIS_DATA.length - 1 ? "border-b border-dashed border-[#262626]" : ""
                        }`}
                      >
                        {/* Model Icon + Title + Promo Subtext */}
                        <div className="flex items-center gap-3 pr-3">
                          <div className="w-8 h-8 rounded-md bg-[#1c1c1f] border border-[#333] flex items-center justify-center shrink-0 p-1 group-hover:border-[#76b900] transition-colors overflow-hidden">
                            <IconComponent size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#F0EFE2] text-sm group-hover:text-[#76b900] transition-colors leading-snug">
                              {model.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] leading-snug mt-0.5">
                              <span className="text-[#76b900] font-medium">{model.promo}</span>
                              <span className="text-[#777] font-normal">{model.promoUntil}</span>
                            </div>
                          </div>
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
                Limits and modality-specific capabilities are listed on each model page.
              </div>
            </section>

            {/* SECTION 3: Exact Screenshot 2 & 3 Comparison Section */}
            <section className="mb-20">
              <div className="w-full border border-dashed border-[#333] bg-[#151515] flex flex-col">
                {/* Header Description Box */}
                <div className="p-4 sm:p-6 border-b border-dashed border-[#333]">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#F0EFE2] mb-1.5 tracking-tight">
                    Compare Pay as you go and Enterprise
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#888] max-w-2xl leading-relaxed">
                    Pay as you go is self-serve, funded by credit top-ups. Enterprise adds private infrastructure, reserved capacity, compliance, and custom terms.
                  </p>
                </div>

                {/* Table Matrix Header */}
                <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#181818]/80">
                  <div className="p-4 sm:p-5 flex items-end">
                    <span className="text-xs font-medium text-[#777]">Feature</span>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col justify-end">
                    <span className="text-sm sm:text-base font-semibold text-[#F0EFE2]">Pay as you go</span>
                    <span className="text-[11px] text-[#777] mt-0.5">from a $5 top-up</span>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col justify-end">
                    <span className="text-sm sm:text-base font-semibold text-[#F0EFE2]">Enterprise</span>
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
                        When you send a prompt with repeated context (like conversation history, code repositories, or documents), supported models detect the cached prefix and discount the input cost by up to 90% or offer it completely free during promotional windows.
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
                        You can fund your prepaid balance with any amount starting from $5. You only pay for the tokens generated and executed. Unused credits remain valid for 12 months.
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
                        No. Our pay-as-you-go model APIs are charged strictly by token consumption, allowing your entire team or product application to share one single balance without seat penalties.
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
                        We offer contractual SLAs up to 99.99% uptime with guaranteed throughput reservations and sub-second failover routing across dedicated clusters.
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
                        Yes. Enterprise contracts support private VPC peering, on-prem hardware integration, SOC 2 Type II controls, and custom model weights loaded into isolated nodes.
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

                  <Link
                    href="/developer-console"
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm"
                  >
                    Choose Starter <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </Link>
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

                  <Link
                    href="/developer-console"
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm"
                  >
                    Choose Pro <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </Link>
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

                  <Link
                    href="/developer-console"
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm"
                  >
                    Choose Team <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </Link>
                </div>
              </div>

              {/* Models List */}
              <div className="mb-6">
                <div className="text-xs text-[#777] mb-2 font-medium">Models</div>
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
                    Connect your coding{" "}
                    <span className="bg-[#76b900] text-black px-2 py-0.5 rounded-none font-semibold inline-block">
                      agents
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#888]">
                    Review each connection before it is applied.
                  </p>
                </div>

                <div className="w-full lg:max-w-md">
                  <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs sm:text-sm font-medium text-[#F0EFE2]">
                        Let your coding agent set it up
                      </span>
                      <button
                        onClick={handleCopyPrompt}
                        className="text-[11px] text-[#aaa] hover:text-white flex items-center gap-1.5 px-2.5 py-1 border border-[#333] hover:border-[#555] bg-[#141414] transition-colors"
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
                        <span className="text-xs text-[#C8C7BA]">Paste the prompt into your coding agent</span>
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

              {/* 19 agents ready */}
              <div className="mb-6">
                <div className="text-xs text-[#777] mb-3 font-medium">19 agents ready</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {READY_AGENTS.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center gap-2.5 px-3 py-2 border border-dashed border-[#262626] bg-[#161616] hover:border-[#76b900]/40 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-[4px] bg-[#1a1a1c] border border-[#2a2a2e] flex items-center justify-center shrink-0 overflow-hidden">
                        {agent.icon}
                      </div>
                      <span className="text-xs font-medium text-[#F0EFE2] truncate">{agent.name}</span>
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
                      className="flex items-center gap-2.5 px-3 py-2 border border-dashed border-[#262626] bg-[#161616] hover:border-[#76b900]/40 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-[4px] bg-[#1a1a1c] border border-[#2a2a2e] flex items-center justify-center shrink-0 overflow-hidden">
                        {agent.icon}
                      </div>
                      <span className="text-xs font-medium text-[#bbb] truncate">{agent.name}</span>
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
                      className={`px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive
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
                  <Link
                    href="/developer-console"
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors"
                  >
                    Choose Starter, $10 a month <ChevronRight size={13} className="text-[#888]" />
                  </Link>
                  <Link
                    href="/developer-console"
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors"
                  >
                    Choose Pro, $29 a month <ChevronRight size={13} className="text-[#888]" />
                  </Link>
                  <Link
                    href="/developer-console"
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors"
                  >
                    Choose Team, $99 a month <ChevronRight size={13} className="text-[#888]" />
                  </Link>
                </div>

                {/* 4 Security Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <Lock size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">TLS in transit, AES-256 at rest</span>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <Cpu size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">Workspace isolation</span>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <EyeOff size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">No training on your data</span>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] py-2 px-3 flex items-center gap-2 text-xs text-[#bbb]">
                    <ShieldCheck size={13} className="text-[#76b900] shrink-0" />
                    <span className="truncate">SOC 2 Type II</span>
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

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  );
}

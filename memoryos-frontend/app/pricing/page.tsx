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

// Exact 8 models showing research direction & foundation architectures
const MODEL_APIS_DATA = [
  {
    id: "ornith-1-5-122b",
    name: "Ornith 1.5 122B",
    developer: "Ornith",
    icon: OrnithLogo,
    domain: "Physical AI & Robotics",
    architecture: "122B MoE Foundation",
    status: "Active Research",
    link: "/capabilities/Ornith/Ornith%201.5%20122B",
  },
  {
    id: "deepseek-v4-1-flash-1017",
    name: "DeepSeek V4.1 Flash 1017",
    developer: "DeepSeek",
    icon: DeepSeekLogo,
    domain: "Mathematical Reasoning",
    architecture: "Sparse Attention MoE",
    status: "Research Preview",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash%201017",
  },
  {
    id: "glm-5-3",
    name: "GLM 5.3",
    developer: "Z.ai",
    icon: ZLogo,
    domain: "Multimodal Agent Cognition",
    architecture: "Bilingual Foundation",
    status: "Active Research",
    link: "/capabilities/Z.ai/GLM%205.3",
  },
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    developer: "Z.ai",
    icon: ZLogo,
    domain: "Low-Latency Inference",
    architecture: "Distilled Dense",
    status: "Research Preview",
    link: "/capabilities/Z.ai/GLM%205.3%20Flash",
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Nemotron 3.5 Lightning 30B",
    developer: "NVIDIA",
    icon: NvidiaLogo,
    domain: "Autonomous Systems",
    architecture: "30B Optimized Backbone",
    status: "Benchmark Evaluation",
    link: "/capabilities/NVIDIA/Nemotron%203.5%20Lightning%2030B",
  },
  {
    id: "qwen3-8-27b",
    name: "Qwen3.8 27B",
    developer: "Alibaba Cloud",
    icon: QwenLogo,
    domain: "Scientific Discovery & Code",
    architecture: "27B Dense Architecture",
    status: "Research Preview",
    link: "/capabilities/Alibaba%20Cloud/Qwen3.8%2027B",
  },
  {
    id: "ornith-1-5-35b",
    name: "Ornith 1.5 35B",
    developer: "Ornith",
    icon: OrnithLogo,
    domain: "Embodied Decision Making",
    architecture: "35B Multimodal",
    status: "Active Research",
    link: "/capabilities/Ornith/Ornith%201.5%2035B",
  },
  {
    id: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    developer: "DeepSeek",
    icon: DeepSeekLogo,
    domain: "Code Verification & Logic",
    architecture: "Fast Reasoning Core",
    status: "Research Preview",
    link: "/capabilities/DeepSeek/DeepSeek%20V4.1%20Flash",
  },
];

// Comparison matrix for Research Infrastructure & Research Collaboration
const COMPARISON_ROWS = [
  {
    feature: "Access Model",
    payg: "Early Access application & preview cohorts",
    enterprise: "Joint research collaboration & dedicated partnerships",
    isText: true,
  },
  {
    feature: "Research Direction",
    payg: "Foundation models, evaluation & inference exploration",
    enterprise: "Co-development, optimization & physical AI research",
    isText: true,
  },
  {
    feature: "Seats & Teams",
    payg: "Open to individual researchers & engineers",
    enterprise: "Multi-disciplinary labs & institutional teams",
    isText: true,
  },
  {
    feature: "Standardized APIs & Schemas",
    payg: true,
    enterprise: true,
    isText: false,
  },
  {
    feature: "Audit logs, RBAC & Governance",
    payg: "Included in research workspace settings",
    enterprise: true,
    isText: "mixed",
  },
  {
    feature: "Security & Compliance Controls",
    payg: false,
    enterprise: true,
    isText: false,
  },
  {
    feature: "Compute Access",
    payg: "Shared high-throughput research cluster",
    enterprise: "Dedicated compute nodes & cluster isolation",
    isText: true,
  },
  {
    feature: "Technical Collaboration",
    payg: "Developer community & research office hours",
    enterprise: "Direct collaboration with Horos scientists & Slack",
    isText: true,
  },
];

const CODING_PLAN_FAQS = [
  {
    question: "What is Founding Access?",
    answer:
      "Founding Access is our collaborative program for early researchers, developers, and teams building frontier AI systems. Access is granted in cohorts as new compute clusters, foundation models, and evaluation tools become available.",
  },
  {
    question: "What does Founding Access cover?",
    answer:
      "Access provides early exploration of Horos models, reasoning architectures, and research prototypes across digital and physical intelligence. You'll have direct avenues to test capabilities and provide architectural feedback.",
  },
  {
    question: "Are there subscription fees during early access?",
    answer:
      "No. We are currently in active research and infrastructure development. Live commercial subscriptions and billing will only launch once APIs, model weights, and production verification gates are fully operational.",
  },
  {
    question: "How are access cohorts selected?",
    answer:
      "We prioritize researchers, engineers, and labs working on ambitious frontier AI problems including autonomous agents, world models, scientific discovery, and robotics.",
  },
  {
    question: "How can we collaborate on research?",
    answer:
      "Institutions and labs can apply for dedicated research collaboration to work directly with Horos on model development, specialized evaluation, and customized optimization pipelines.",
  },
  {
    question: "What is Standby?",
    answer:
      "Standby is our guaranteed fallback routing mode designed to ensure research sessions and agent tool workflows remain resilient during heavy cluster experimentation.",
  },
  {
    question: "When will public billing and self-serve APIs open?",
    answer:
      "Public billing and instant self-serve top-ups will open once model weights, verification safety checks, and high-throughput cluster nodes complete their evaluation phase.",
  },
  {
    question: "What can I count on as a founding researcher?",
    answer:
      "You can count on direct technical collaboration with the Horos engineering team, transparent research updates, and early availability of next-generation AI infrastructure.",
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
              Frontier AI Research Infrastructure &{" "}
              <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none font-semibold inline-block">
                Lab
              </span>
            </h1>
            <p className="text-[#888] text-xs sm:text-sm md:text-base mt-2 font-normal">
              One unified platform: Frontier AI Research Infrastructure + Frontier AI Lab, delivering high-throughput compute, foundation models, and research collaboration.
            </p>
          </div>

          {/* Plan Selector Cards (Research Infrastructure vs Frontier Lab) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
            {/* Research Infrastructure Card */}
            <div
              onClick={() => setSelectedPlan("payg")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all ${selectedPlan === "payg"
                ? "border-[#76b900] bg-[#1a1a1a]/40 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
                }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <h2 className="text-lg font-medium text-[#F0EFE2]">Research Infrastructure</h2>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedPlan === "payg" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "payg" && <div className="w-2 h-2 rounded-full bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-xs sm:text-[13px] mb-4 font-normal">For developers and researchers building with frontier AI</p>

              <div className="text-xs sm:text-sm">
                <p className="font-medium mb-1 text-[#F0EFE2]">Early Access</p>
                <p className="text-[#888] text-xs mb-2.5 leading-relaxed">
                  We're building infrastructure for model development, evaluation, optimization, and inference.
                </p>
                <ul className="space-y-1.5 text-xs text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Explore emerging research infrastructure
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Get early access as capabilities become available
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Help shape the next generation of AI tools
                  </li>
                </ul>
              </div>
            </div>

            {/* Frontier Lab Card */}
            <div
              onClick={() => setSelectedPlan("coding")}
              className={`border border-dashed p-4 sm:p-5 cursor-pointer transition-all ${selectedPlan === "coding"
                ? "border-[#76b900] bg-[#1a1a1a]/40 shadow-[0_0_20px_-10px_rgba(118,185,0,0.3)]"
                : "border-[#333] bg-[#1a1a1a]/20 hover:border-[#555]"
                }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <h2 className="text-lg font-medium text-[#F0EFE2]">Frontier Lab</h2>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedPlan === "coding" ? "border-[#76b900]" : "border-[#555]"
                    }`}
                >
                  {selectedPlan === "coding" && <div className="w-2 h-2 rounded-full bg-[#76b900]" />}
                </div>
              </div>
              <p className="text-[#888] text-xs sm:text-[13px] mb-4 font-normal">Advancing intelligence across the physical and digital worlds</p>

              <div className="text-xs sm:text-sm">
                <p className="font-medium mb-1 text-[#F0EFE2]">Founding Access</p>
                <p className="text-[#888] text-xs mb-2.5 leading-relaxed">
                  Join the early community exploring Horos models, research, and new capabilities.
                </p>
                <ul className="space-y-1.5 text-xs text-[#aaa]">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Early access to select Horos models as they become available
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Opportunities to explore new model capabilities
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[#76b900] shrink-0" /> Direct technical collaboration with the Horos team
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </section>

        {selectedPlan === "payg" ? (
          <>
            {/* Selected Plan Details & Research Collaboration Split Box */}
            <section className="mb-16">
              <div className="border border-dashed border-[#333] bg-[#181818]/60 flex flex-col md:flex-row">
                {/* Left Column: Research Infrastructure */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-6 lg:p-7">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2]">Research Infrastructure</h2>
                      <span className="text-[11px] font-mono tracking-wide bg-[#222] border border-[#333] px-2 py-0.5 text-[#aaa] flex items-center gap-1.5">
                        <span className="text-[#76b900]">#</span> Early access
                      </span>
                    </div>
                    <p className="text-[#aaa] text-xs sm:text-[13px] mb-6">
                      We're building infrastructure for model development, evaluation, optimization, and inference.
                    </p>

                    <div className="mb-6 p-4 border border-dashed border-[#333] bg-[#141414]/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-[#76b900] font-mono uppercase tracking-widest font-semibold flex items-center gap-1.5">
                          <Sparkles size={13} /> Cohort Applications Open
                        </span>
                        <span className="text-[10px] text-[#888] font-mono border border-[#333] px-2 py-0.5">
                          Research Preview
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#C8C7BA] leading-relaxed">
                        Join developers and researchers testing emerging model development, evaluation, optimization, and inference infrastructure before public release.
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-medium text-xs sm:text-sm text-[#F0EFE2] mb-3">What's included</h3>
                      <div className="space-y-2.5 text-xs text-[#bbb]">
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Explore emerging research infrastructure</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Get early access as capabilities become available</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Help shape the next generation of AI tools</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Direct technical collaboration on model development and optimization</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="text-center text-[11px] text-[#777] mb-3">
                        Early access cohorts are onboarded continuously as compute clusters expand.
                      </p>
                      <a
                        href={`mailto:${founderEmail}?subject=HOROS%20Research%20Infrastructure%20Early%20Access%20Application`}
                        className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-3 flex items-center justify-center transition-colors shadow-sm"
                      >
                        Apply for Early Access <ChevronRight size={15} strokeWidth={2.5} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Column: Research Collaboration */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-6 lg:p-7 border-t md:border-t-0 md:border-l border-dashed border-[#333]">
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl font-medium text-[#F0EFE2] mb-1.5">Research Collaboration</h2>
                      <p className="text-[#aaa] text-xs sm:text-[13px] leading-relaxed">
                        Work with Horos on model development, optimization, and research, not selling service plans.
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="text-xl sm:text-2xl font-semibold text-[#F0EFE2] font-mono mb-2">Collaborative Research</div>
                      <p className="text-xs sm:text-sm font-medium text-[#F0EFE2] mt-5 mb-3">
                        Partner directly with our research scientists and engineers:
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#bbb]">
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Co-development and evaluation of frontier foundation models</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Joint research on physical AI, reasoning, and world models</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Custom optimization, pre-training, and fine-tuning pipelines</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Dedicated research compute clusters and isolated infrastructure</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#76b900] mt-0.5 shrink-0" />
                          <span>Direct technical collaboration with the Horos team</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`mailto:${founderEmail}?subject=HOROS%20Research%20Collaboration`}
                      className="w-full bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] border border-[#333] hover:border-[#555] font-medium text-xs sm:text-sm py-3 flex items-center justify-center transition-colors"
                    >
                      Initiate Research Collaboration <ChevronRight size={15} strokeWidth={2} className="ml-1 text-[#888]" />
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
                FRONTIER MODELS & RESEARCH ROADMAP
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                <h2 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-[#F0EFE2] tracking-tight flex items-center gap-2 flex-wrap">
                  Our research direction across foundation{" "}
                  <span className="bg-[#76b900] text-[#0e0f12] px-2 py-0.5 rounded-none font-semibold leading-tight inline-block">
                    models
                  </span>
                </h2>

                <div className="shrink-0">
                  <span className="text-[11px] text-[#888] font-mono font-medium border border-dashed border-[#333] bg-[#1a1a1a] px-3 py-1 rounded-none inline-block">
                    Research Preview
                  </span>
                </div>
              </div>

              {/* Table Container */}
              <div className="w-full border border-dashed border-[#333] bg-[#151515] overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-[2.8fr_2fr_1.8fr_1.3fr_1.1fr] px-4 sm:px-5 py-3 border-b border-dashed border-[#333] text-xs font-medium text-[#777]">
                    <div>Model</div>
                    <div>Research Domain</div>
                    <div>Architecture</div>
                    <div>Status</div>
                    <div></div>
                  </div>

                  {/* Data Rows */}
                  {MODEL_APIS_DATA.map((model, idx) => {
                    const IconComponent = model.icon;
                    return (
                      <Link
                        key={model.id}
                        href={model.link}
                        className={`grid grid-cols-[2.8fr_2fr_1.8fr_1.3fr_1.1fr] px-4 sm:px-5 py-3.5 sm:py-4 items-center group hover:bg-[#1c1c1c] transition-colors ${idx < MODEL_APIS_DATA.length - 1 ? "border-b border-dashed border-[#262626]" : ""
                          }`}
                      >
                        {/* Model Icon + Title */}
                        <div className="flex items-center gap-3 pr-3">
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <IconComponent size={20} />
                          </div>
                          <span className="font-semibold text-[#F0EFE2] text-sm group-hover:text-[#76b900] transition-colors leading-snug truncate">
                            {model.name}
                          </span>
                        </div>

                        {/* Research Domain */}
                        <div className="text-xs text-[#ccc] font-medium pr-2">
                          {model.domain}
                        </div>

                        {/* Architecture */}
                        <div className="text-xs text-[#aaa] font-mono pr-2">
                          {model.architecture}
                        </div>

                        {/* Status */}
                        <div>
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-[#1e1e1e] border border-[#333] text-[#76b900] whitespace-nowrap">
                            {model.status}
                          </span>
                        </div>

                        {/* View Model Link */}
                        <div className="flex justify-end">
                          <span className="text-xs text-[#aaa] group-hover:text-[#F0EFE2] flex items-center gap-1 font-medium transition-colors">
                            View details <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Subtext below table */}
              <div className="mt-3 text-xs text-[#777]">
                Models are currently in active research, internal evaluation, and capability benchmarking. Public API endpoints, token allocations, and billing will open as models complete safety and verification gates.
              </div>
            </section>

            {/* SECTION 3: Comparison Section */}
            <section className="mb-20">
              <div className="w-full border border-dashed border-[#333] bg-[#151515] flex flex-col">
                {/* Header Description Box */}
                <div className="p-4 sm:p-6 border-b border-dashed border-[#333]">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#F0EFE2] mb-1.5 tracking-tight">
                    Compare Research Infrastructure and Research Collaboration
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#888] max-w-2xl leading-relaxed">
                    Research Infrastructure provides early access to model development, evaluation, and inference tools. Research Collaboration offers direct joint development, co-training, and dedicated cluster compute.
                  </p>
                </div>

                {/* Table Matrix Header */}
                <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#181818]/80">
                  <div className="p-4 sm:p-5 flex items-end">
                    <span className="text-xs font-medium text-[#777]">Focus & Capabilities</span>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col justify-end">
                    <span className="text-sm sm:text-base font-semibold text-[#F0EFE2]">Research Infrastructure</span>
                    <span className="text-[11px] text-[#76b900] mt-0.5">Early Access</span>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col justify-end">
                    <span className="text-sm sm:text-base font-semibold text-[#F0EFE2]">Research Collaboration</span>
                    <span className="text-[11px] text-[#76b900] mt-0.5">Joint Research</span>
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
                Explore compute architectures, physical sensor interfaces, and datacenter hardware.{" "}
                <Link
                  href="/economics"
                  className="underline decoration-[#76b900] decoration-1 underline-offset-4 text-[#F0EFE2] hover:text-[#76b900] font-medium transition-colors"
                >
                  View datacenter power, cluster compute, and economics projections
                </Link>{" "}
                for frontier workloads.
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
                  Contact our research team
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
                  Research Infrastructure
                </button>
                <button
                  onClick={() => setFaqTab("enterprise")}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${faqTab === "enterprise" ? "bg-[#76b900] text-[#151515]" : "text-[#888] hover:text-[#F0EFE2]"
                    }`}
                >
                  Research Collaboration
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
                        What is the Research Infrastructure early access program?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        We are actively building high-throughput infrastructure for model development, evaluation, optimization, and inference. The early access program lets developers and researchers test emerging capabilities before public release.
                      </p>
                    </div>

                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        How do early access cohorts work?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        Researchers and engineers are accepted in rolling cohorts as compute capacity and model capabilities expand. You will receive direct access to endpoints, evaluation tools, and technical documentation.
                      </p>
                    </div>

                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        When will public billing and self-serve APIs open?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        Live per-token billing, self-serve credit top-ups, and commercial subscriptions will open once model weights, verification safety checks, and high-throughput cluster nodes complete their evaluation phase.
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
                        What does a research collaboration include?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        Research collaborations are tailored partnerships with Horos scientists and engineers focused on joint model development, customized pre-training/fine-tuning, dedicated cluster nodes, and co-evaluation.
                      </p>
                    </div>

                    <div className="border border-dashed border-[#333] bg-[#181818]/60 p-4 sm:p-5">
                      <h3 className="font-medium text-[#F0EFE2] mb-1.5 text-xs sm:text-sm flex items-center gap-2">
                        <div className="w-3 h-3 border border-[#76b900] flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 bg-[#76b900]" />
                        </div>
                        Can labs deploy custom models on Horos infrastructure?
                      </h3>
                      <p className="text-[#aaa] text-xs sm:text-[13px] pl-5 leading-relaxed">
                        Yes. Collaborative research partners can deploy private weights, custom tokenizers, and domain-specific architectures onto isolated GPU/TPU nodes with dedicated cluster isolation.
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
                {/* Founding Developer Card */}
                <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors">
                  <div>
                    <h3 className="text-lg font-medium text-[#F0EFE2] mb-1">Founding Developer</h3>
                    <div className="text-2xl sm:text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-2">
                      Founding Access <span className="text-[11px] font-normal text-[#76b900] border border-[#76b900]/40 px-1.5 py-0.5">Early Cohort</span>
                    </div>
                    <p className="text-xs text-[#888] mt-1 mb-6">Join the early community exploring Horos models, research, and new capabilities.</p>

                    <div className="space-y-3 text-xs mb-8">
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Model access</span>
                        <span className="font-medium text-[#F0EFE2]">Select Horos models as available</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Capabilities</span>
                        <span className="font-medium text-[#F0EFE2]">Early test-time reasoning</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Collaboration</span>
                        <span className="font-medium text-[#F0EFE2]">Direct technical collaboration</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#888] pr-2">Compute queue</span>
                        <span className="font-semibold text-[#76b900] shrink-0 font-mono">Continuous early access</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`mailto:${founderEmail}?subject=HOROS%20Founding%20Developer%20Access`}
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm"
                  >
                    Apply for Founding Access <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </a>
                </div>

                {/* Research Lab Card */}
                <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors">
                  <div>
                    <h3 className="text-lg font-medium text-[#F0EFE2] mb-1">Research Lab</h3>
                    <div className="text-2xl sm:text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-2">
                      Lab Access <span className="text-[11px] font-normal text-[#76b900] border border-[#76b900]/40 px-1.5 py-0.5">Active Cohort</span>
                    </div>
                    <p className="text-xs text-[#888] mt-1 mb-6">Advancing intelligence across physical and digital worlds with dedicated research groups.</p>

                    <div className="space-y-3 text-xs mb-8">
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Model access</span>
                        <span className="font-medium text-[#F0EFE2]">Expanded Horos model suite</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Capabilities</span>
                        <span className="font-medium text-[#F0EFE2]">Autonomous agentic workflows</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Collaboration</span>
                        <span className="font-medium text-[#F0EFE2]">Weekly technical sync & review</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#888] pr-2">Compute queue</span>
                        <span className="font-semibold text-[#76b900] shrink-0 font-mono">High-priority queue</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`mailto:${founderEmail}?subject=HOROS%20Research%20Lab%20Access`}
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm"
                  >
                    Apply for Founding Access <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </a>
                </div>

                {/* Institutional Partner Card */}
                <div className="border border-dashed border-[#333] bg-[#181818]/70 p-5 sm:p-6 flex flex-col justify-between hover:border-[#555] transition-colors">
                  <div>
                    <h3 className="text-lg font-medium text-[#F0EFE2] mb-1">Institutional Partner</h3>
                    <div className="text-2xl sm:text-3xl font-semibold text-[#F0EFE2] font-mono tracking-tight flex items-baseline gap-2">
                      Partner Access <span className="text-[11px] font-normal text-[#76b900] border border-[#76b900]/40 px-1.5 py-0.5">Institutional</span>
                    </div>
                    <p className="text-xs text-[#888] mt-1 mb-6">Joint research on model development, optimization, and foundational architectures.</p>

                    <div className="space-y-3 text-xs mb-8">
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Model access</span>
                        <span className="font-medium text-[#F0EFE2]">Custom weights & private nodes</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Capabilities</span>
                        <span className="font-medium text-[#F0EFE2]">Full frontier architecture suite</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#262626]">
                        <span className="text-[#888]">Collaboration</span>
                        <span className="font-medium text-[#F0EFE2]">Co-development & co-authorship</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#888] pr-2">Compute queue</span>
                        <span className="font-semibold text-[#76b900] shrink-0 font-mono">Dedicated cluster</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`mailto:${founderEmail}?subject=HOROS%20Institutional%20Partnership`}
                    className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-semibold text-xs sm:text-sm py-2.5 flex items-center justify-center transition-colors shadow-sm"
                  >
                    Apply for Founding Access <ChevronRight size={14} strokeWidth={2.5} className="ml-1" />
                  </a>
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
                  Up to <span className="font-bold text-[#F0EFE2]">99.6%</span> cache hit rate across research evaluations.{" "}
                  Optimized <span className="font-bold text-[#F0EFE2]">prefix and KV-cache reuse</span> enabled across all cohorts, so research capacity goes further.
                </p>
              </div>

              <p className="text-xs text-[#777]">
                Every cohort allocation is shared by its research workspace, not per member.
              </p>
            </section>

            {/* SECTION 2: Limits Section (Screenshot 2) */}
            <div className="w-screen relative left-1/2 -translate-x-1/2 z-20 my-14">
              <SectionDivider position="top" />
            </div>

            <section className="mb-20">
              <div className="text-[#76b900] text-xs font-mono font-medium tracking-[0.2em] uppercase mb-2">
                CAPACITY ALLOCATION
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#F0EFE2] tracking-tight mb-8">
                Compute cycles allocated for research every 5 hours and every{" "}
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
                    <div className="text-xs text-[#777] mb-3 font-medium">Allocation resets</div>
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
                  <div className="text-xs text-[#777] mb-4 font-medium">Research capacity flow</div>
                  <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto pb-2">
                    {/* Step: Cohort */}
                    <div className="flex flex-col items-start min-w-[70px]">
                      <div className="w-2.5 h-2.5 bg-[#76b900] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Cohort</span>
                      <span className="text-[11px] text-[#777] leading-tight mt-1">Active allocation</span>
                    </div>

                    <div className="text-[#555] text-xs pt-0.5">→</div>

                    {/* Step: Priority Queue */}
                    <div className="flex flex-col items-start max-w-[120px]">
                      <div className="w-2.5 h-2.5 border border-[#76b900] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Research Queue</span>
                      <span className="text-[11px] text-[#777] leading-tight mt-1">Dedicated priority queue</span>
                    </div>

                    <div className="text-[#555] text-xs pt-0.5">→</div>

                    {/* Step: Standby */}
                    <div className="flex flex-col items-start max-w-[110px]">
                      <div className="w-2.5 h-2.5 bg-[#76b900] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Standby</span>
                      <span className="text-[11px] text-[#777] leading-tight mt-1">Standard baseline queue</span>
                    </div>

                    <div className="text-[#555] text-xs pt-0.5">→</div>

                    {/* Step: Reset */}
                    <div className="flex flex-col items-start max-w-[90px]">
                      <div className="w-2.5 h-2.5 border border-[#666] mb-2" />
                      <span className="text-xs font-semibold text-[#F0EFE2]">Cycle Reset</span>
                      <span className="text-[11px] text-[#777] leading-tight mt-1">Replenished automatically</span>
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
                    Connecting AI agents to{" "}
                    <span className="bg-[#76b900] text-black px-2 py-0.5 rounded-none font-semibold inline-block">
                      Frontier Infrastructure
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#888]">
                    Route any coding agent, research CLI, or experimental workflow directly through our Horos foundation models and emerging compute infrastructure.
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
                    href="/horos"
                    className="text-xs sm:text-[13px] text-[#76b900] underline font-medium mt-3 inline-flex items-center gap-1 hover:opacity-80"
                  >
                    Follow our research <ChevronRight size={13} />
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
                  Explore{" "}
                  <span className="bg-[#76b900] text-black px-1.5 py-0.5 font-semibold inline-block">
                    research cohorts
                  </span>
                </h3>

                {/* 3 Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <a
                    href={`mailto:${founderEmail}?subject=HOROS%20Founding%20Developer%20Access`}
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors"
                  >
                    Apply for Founding Access <ChevronRight size={13} className="text-[#888]" />
                  </a>
                  <a
                    href={`mailto:${founderEmail}?subject=HOROS%20Research%20Lab%20Access`}
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors"
                  >
                    Explore Lab Collaboration <ChevronRight size={13} className="text-[#888]" />
                  </a>
                  <a
                    href={`mailto:${founderEmail}?subject=HOROS%20Institutional%20Partnership`}
                    className="border border-[#333] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#76b900] text-xs sm:text-[13px] text-[#F0EFE2] font-medium py-3 px-4 flex items-center justify-center gap-1 transition-colors"
                  >
                    Institutional Research <ChevronRight size={13} className="text-[#888]" />
                  </a>
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

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  );
}

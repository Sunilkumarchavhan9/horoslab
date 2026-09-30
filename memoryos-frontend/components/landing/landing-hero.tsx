"use client";

import React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CornerDownLeft } from "lucide-react";
import { TokenPromptInput } from "@/components/dhyra/primitives/token-prompt-input";
import { CellularRevealBackground } from "@/components/dhyra/primitives/cellular-reveal-background";
import { LeftFeedStrip, RightFeedStrip } from "./side-feed-strips";
import { HeroGlitchImage } from "./hero-glitch-image";
import { FloatingBrandGrid } from "./floating-brand-grid";
import { MetaLogo, QwenLogo, DeepSeekLogo, VLLMLogo, OpenAILogo, BAAILogo, NvidiaLogo } from "@/components/dhyra/primitives/brand-icons";

interface LandingHeroProps {
  onLaunchPrompt?: (params: any) => void;
  dark?: boolean;
}

const HEADLINES = [
  { prefix: "Frontier Reality ", highlight: "Infrastructure." },
  { prefix: "Build, Adapt, and ", highlight: "Evaluate." },
  { prefix: "Optimize, Experiment, and ", highlight: "Decide." },
  { prefix: "Deploy, Observe, and ", highlight: "Verify." },
  { prefix: "Learn, Teach, and ", highlight: "Evolve." },
];

// 14 Canonical Workloads representing Dhyra's Reality Intelligence Architecture
const ALL_14_WORKLOADS = [
  {
    label: "Compare engines",
    title: "Find the best serving engine for",
    target: "Qwen3-32B on vLLM / H100",
    icon: <QwenLogo size={12} />,
  },
  {
    label: "Serve reasoning",
    title: "Deploy",
    target: "DeepSeek R1 Distill 8B for reasoning",
    icon: <DeepSeekLogo size={12} />,
  },
  {
    label: "Decode reality",
    title: "Teach",
    target: "Qwen2.5-VL 7B for driving perception",
    icon: <QwenLogo size={12} />,
  },
  {
    label: "Optimize workload",
    title: "Optimize",
    target: "Llama 3.1 8B for <40ms TTFT latency",
    icon: <MetaLogo size={12} />,
  },
  {
    label: "Diagnose SRE",
    title: "Trace",
    target: "PCIe Gen5 bottleneck on GPU Cluster-04",
    icon: <NvidiaLogo size={12} />,
  },
  {
    label: "Facility power",
    title: "Optimize",
    target: "Data Center PUE 1.12 & 4.8 MW cooling",
    icon: <NvidiaLogo size={12} />,
  },
  {
    label: "Benchmark Pareto",
    title: "Compare",
    target: "vLLM vs SGLang vs TensorRT-LLM",
    icon: <VLLMLogo size={12} />,
  },
  {
    label: "Quantize to fit",
    title: "Quantize",
    target: "Llama 3.1 70B to FP8 on single H100",
    icon: <MetaLogo size={12} />,
  },
  {
    label: "Teach model",
    title: "Compound",
    target: "factory.machine_state:v4 from telemetry",
    icon: <QwenLogo size={12} />,
  },
  {
    label: "Independent audit",
    title: "Evaluate",
    target: "Groundedness & hallucination across 1K evals",
    icon: <OpenAILogo size={12} />,
  },
  {
    label: "Transcribe audio",
    title: "Serve",
    target: "Whisper Large V3 on edge gateway",
    icon: <OpenAILogo size={12} />,
  },
  {
    label: "Embedding search",
    title: "Index",
    target: "BGE-M3 for multi-modal vector search",
    icon: <BAAILogo size={12} />,
  },
  {
    label: "Code repair",
    title: "Patch",
    target: "SSO token vulnerability with verified PR",
    icon: <MetaLogo size={12} />,
  },
  {
    label: "Bounded policy",
    title: "Enforce",
    target: "$250 max spend & US-East residency gate",
    icon: <DeepSeekLogo size={12} />,
  },
];

export function LandingHero({ onLaunchPrompt, dark = true }: LandingHeroProps) {
  const [index, setIndex] = React.useState(0);
  const [workloadOffset, setWorkloadOffset] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const headlineTextRef = React.useRef<HTMLHeadingElement>(null);
  const badgeBgRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HEADLINES.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  // Smoothly cycle through the 14 Canonical Workloads one-by-one inside the 4 slots
  React.useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setWorkloadOffset((prev) => (prev + 1) % ALL_14_WORKLOADS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isHovered]);

  useGSAP(
    () => {
      if (!headlineTextRef.current || !badgeBgRef.current) return;
      const tl = gsap.timeline();

      // Step 1: Text slides & fades in first
      tl.fromTo(
        headlineTextRef.current,
        { opacity: 0, y: 22, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power3.out" }
      );

      // Step 2: Green background badge fades in cleanly with text
      tl.fromTo(
        badgeBgRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" },
        "-=0.1"
      );
    },
    { dependencies: [index], scope: containerRef }
  );

  const currentHeadline = HEADLINES[index] || HEADLINES[0];

  // Pick 4 cards based on workloadOffset
  const visibleCards = React.useMemo(() => {
    return [0, 1, 2, 3].map((slotIndex) => {
      const itemIndex = (workloadOffset + slotIndex) % ALL_14_WORKLOADS.length;
      return {
        ...ALL_14_WORKLOADS[itemIndex],
        itemNumber: itemIndex + 1,
      };
    });
  }, [workloadOffset]);

  return (
    <section className="relative w-full pb-16 bg-[#151515] overflow-visible">


      <div className="relative z-10 w-full flex items-stretch justify-between">
        {/* Left Vertical Feed Strip */}
        <LeftFeedStrip />

        {/* Center Hero Block */}
        <div className="flex-1 min-w-0 w-full mx-auto flex flex-col items-center text-center pb-2 sm:pb-4" ref={containerRef}>

          {/* Top Hero Image with WebGL Glitch Effect */}
          <div className="w-full relative mb-0">
            <HeroGlitchImage
              src="/hero-rack.jpg"
              alt="Dhyra NVIDIA Rack"
              className="w-full relative z-10"
            />
          </div>

          <div className="w-full max-w-[840px] mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 relative z-20">
            <FloatingBrandGrid pattern="top-left" className="top-0 right-full mr-6 xl:mr-10 hidden lg:block opacity-60" />
            <FloatingBrandGrid pattern="bottom-right" className="bottom-22 left-full ml-6 xl:ml-18 hidden lg:block opacity-60" />

            {/* Natural Language Token Composer Box */}
            <div id="hero-composer-wrapper" className="text-left w-full mx-auto">
              <TokenPromptInput
                onSubmit={(prompt) => {
                  if (onLaunchPrompt) onLaunchPrompt({ prompt });
                }}
                dark={dark}
                hideHeader={true}
                showSuggestions={false}
                cardClassName="!bg-[#202020]"
              />
            </div>

            {/* 14 Canonical Workloads Grid (Cycling one-by-one with 14 Heading) */}
            <div
              className="space-y-2 text-left font-mono"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="flex items-center justify-between text-[10px] text-[#788274] uppercase tracking-wider font-bold">
                <div className="flex items-center gap-2">
                  <span>EXAMPLE WORKLOADS</span>
                  <span className="text-[#75bf00] font-bold">(14 CANONICAL MISSIONS)</span>
                </div>
                <div className="text-[10px] text-[#555] font-mono">
                  AUTOCYCLE [{String(visibleCards[0].itemNumber).padStart(2, '0')}/14]
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 bg-[#333333] gap-[1px] border border-[#333333] rounded-xs overflow-hidden">
                {visibleCards.map((card, i) => (
                  <div
                    key={`slot-${i}`}
                    onClick={() => {
                      if (onLaunchPrompt) {
                        onLaunchPrompt({ prompt: `${card.label}: ${card.title} ${card.target}` });
                      }
                    }}
                    className="h-[64px] min-h-[64px] max-h-[64px] bg-[#202020] hover:bg-[#282828] p-3 cursor-pointer transition-colors duration-200 flex items-center justify-between gap-3 group overflow-hidden"
                  >
                    <div key={`${card.label}-${card.itemNumber}`} className="space-y-1 min-w-0 flex-1 transition-opacity duration-300 animate-in fade-in">
                      <div className="text-[10px] text-[#788274] uppercase flex items-center gap-1.5 font-mono truncate">
                        <span className="w-1.5 h-1.5 bg-[#555555] rounded-none shrink-0" />
                        <span className="truncate">{card.label}</span>
                      </div>
                      <div className="text-xs text-[#C8C7BA] group-hover:text-[#F0EFE2] transition-colors truncate font-mono flex items-center gap-1">
                        <span className="shrink-0">{card.title}</span>
                        <span className="inline-flex items-center gap-1 border border-[#444444] bg-[#2a2a2a] px-1.5 py-0.2 text-[11px] text-[#F0EFE2] font-bold rounded-xs truncate max-w-[240px]">
                          <span className="shrink-0">{card.icon}</span>
                          <span className="truncate">{card.target}</span>
                        </span>
                      </div>
                    </div>
                    <CornerDownLeft size={13} className="text-[#666] group-hover:text-[#75bf00] transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic GSAP Staggered Animated Headline Title with Fixed Height (Zero Shaking/Layout Shift) */}
            <div className="space-y-3">
              <div className="min-h-[120px] sm:min-h-[160px] lg:min-h-[220px] flex flex-col items-center justify-center">
                <h1
                  ref={headlineTextRef}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black font-mono tracking-tight text-[#F0EFE2] leading-[1.15] text-center"
                >
                  {currentHeadline.prefix}
                  <span className="relative inline-block ml-1">
                    {/* Green Highlight Badge Background - Animates second */}
                    <span
                      ref={badgeBgRef}
                      className="absolute inset-0 bg-[#75bf00] rounded-xs -z-0"
                    />
                    {/* Text inside highlight */}
                    <span className="relative z-10 px-2.5 py-0.5 text-black font-black">
                      {currentHeadline.highlight}
                    </span>
                  </span>
                </h1>
              </div>
              <p className="text-sm sm:text-base text-[#90988c] font-mono max-w-3xl mx-auto leading-relaxed pt-1 pb-4">
                Dhyra builds frontier intelligence systems that learn from real-world evidence—discovering gaps, adapting models, running experiments, verifying outcomes, and evolving continuously.
              </p>
            </div>

          </div>
        </div>

        {/* Right Vertical Feed Strip */}
        <RightFeedStrip />
      </div>
    </section>
  );
}

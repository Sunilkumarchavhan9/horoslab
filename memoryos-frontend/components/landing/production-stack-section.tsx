"use client";
import { SectionDivider } from "@/components/landing/section-divider";

import React, { useState, useEffect } from "react";
import { ChevronDown, ExternalLink, Play, ClipboardList, GitBranch, ListChecks } from "lucide-react";
import { MetaLogo, VLLMLogo, QwenLogo } from "@/components/horos/primitives/brand-icons";

interface ProductionStackSectionProps {
  onOpenSignIn?: () => void;
  dark?: boolean;
}

// Master alignment lines: Outer (18%), Inner Margins (pushed inside by 120px)
export const MARGIN_VERTICAL_POSITIONS = ["18%", "calc(18% + 120px)", "calc(82% - 120px)", "82%"];

const GemmaLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 12L12 22L22 12L12 2Z" fill="#4285F4" />
  </svg>
);

const MODELS = [
  { name: "Qwen 2.5 7B", color: "#75bf00", Icon: QwenLogo },
  { name: "Llama 3.1 70B", color: "#0866FF", Icon: MetaLogo },
  { name: "Gemma 2 9B", color: "#4285F4", Icon: GemmaLogo }
];

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
            <m.Icon size={32} />
            <span className="font-sans font-medium text-2xl lg:text-[32px] leading-none" style={{ color: m.color }}>
              {m.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductionStackSection({ onOpenSignIn, dark = true }: ProductionStackSectionProps) {
  return (
    <section className="relative w-full bg-[#151515] text-[#F0EFE2] font-mono overflow-hidden select-none">
      {/* 4 Continuous Margin Dashed Vertical Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {MARGIN_VERTICAL_POSITIONS.map((pos, idx) => (
          <div
            key={idx}
            className="absolute top-0 bottom-0 border-r border-dashed border-[#333333]"
            style={{ left: pos }}
          />
        ))}
      </div>

      {/* Intersection Pin Point Dots on TOP Border */}
      <div className="absolute top-0 inset-x-0 pointer-events-none z-10">
        {MARGIN_VERTICAL_POSITIONS.map((pos, idx) => (
          <span
            key={idx}
            className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
            style={{ left: pos }}
          />
        ))}
      </div>

      {/* Row 1: Centered Header Block */}
      <div className="relative z-10 w-full grid grid-cols-[calc(18%_+_120px)_1fr_calc(18%_+_120px)]">
        <div className="relative p-4 min-h-[140px]" />

        <div className="p-8 sm:p-12 lg:py-16 text-center flex flex-col items-center justify-center space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[#F0EFE2] leading-tight font-sans max-w-4xl">
            From intent to a verified Mission Result you
            <div className="mt-3">
              <span className="bg-[#75bf00] text-black px-4 py-1 font-bold inline-block rounded-[2px] leading-none">
                control
              </span>
            </div>
          </h2>
          <p className="text-xs sm:text-[13px] text-[#C8C7BA] font-mono leading-relaxed max-w-2xl mx-auto">
            HOROS observes reality, discovers capabilities, runs experiments, and verifies outcomes.
            Deploy live changes or export fully reproducible system packages. <br className="hidden sm:inline" />
            Illustrative mock values shown for visualization. Verification receipts and actual telemetry are stored securely in the Evidence Fabric.
          </p>
        </div>

        <div className="p-4 min-h-[140px]" />
      </div>

      {/* Row 2: Split Simulator Grid Layout (aligned with master vertical lines) */}
      <SectionDivider />
      <div className="relative z-10 w-full grid grid-cols-[calc(18%_+_120px)_17fr_19fr_calc(18%_+_120px)]">
        {/* Column 1: Left Margin Cell with Watermark */}
        <div className="relative p-4 min-h-[460px]">
          <span className="absolute bottom-4 right-3 text-[9px] font-mono tracking-[0.25em] text-[#555555] font-semibold select-none pointer-events-none uppercase">
            HOROS
          </span>
        </div>

        {/* Column 2: Left Typography */}
        <div className="relative p-8 lg:p-12 flex flex-col justify-center h-[460px] border-r border-dashed border-[#333333]">
          <div className="space-y-4">
            <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#F0EFE2] font-sans leading-snug tracking-tight">
              Describe a
              <br />
              <ModelScroller />
              <br />
              workload in plain English.
            </h3>
          </div>
        </div>

        {/* Column 3: Right Simulator Console */}
        <div className="relative p-6 lg:p-10 flex flex-col justify-start h-[460px] font-sans text-[#cccccc] z-10 w-full">
          <div className="w-full flex flex-col border border-dashed border-[#333333] p-6 lg:p-8">
            {/* Console Header Bar */}
            <div className="flex items-center justify-start gap-3 py-1 mb-5 text-[#aaa]">
              <div className="flex items-center">
                <svg width="32" height="20" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <div className="w-[1px] h-4 bg-[#333]" />
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#F0EFE2] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                <span className="text-[13px] font-medium ml-1">New Session</span>
                <ChevronDown size={14} className="ml-0.5" />
              </div>
            </div>

            {/* Prompt Token Input box */}
            <div className="p-4 border border-[#2a2a2a] bg-[#161616] rounded-md leading-[2.2] text-[14px] mb-6">
              <span className="text-[#F0EFE2]">Optimize</span>{" "}
              <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#222222] text-[#F0EFE2] px-2 py-0.5 text-[12px] font-medium rounded-md shadow-sm align-middle mx-1">
                <MetaLogo size={14} />
                <span>Llama-3.1-8B-Instruct</span>
                <ChevronDown size={14} className="text-[#C8C7BA] ml-0.5" />
              </span>{" "}
              <span className="text-[#F0EFE2] ">on</span>{" "}
              <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#222222] text-[#F0EFE2] px-2 py-0.5 text-[12px] font-medium rounded-md shadow-sm align-middle mx-1">
                <VLLMLogo size={14} />
                <span>vLLM</span>
                <ChevronDown size={14} className="text-[#C8C7BA] ml-0.5" />
              </span>{" "}
              <span className="text-[#F0EFE2] ">for cheapest GPU with latency and VRAM checks</span>
            </div>

            {/* Static Step Log Area */}
            <div className="space-y-4 flex flex-col justify-start">

              {/* Step 1: Thought Process */}
              <div className="space-y-2 text-[13px]">
                <div className="text-[#666666] font-mono text-[13px] flex items-center gap-2">
                  <span>&gt;</span>
                  <span>Thought for 1s</span>
                </div>
                <div className="text-[#F0EFE2]  tracking-wide">
                  Capturing cost-first intent for Llama 3.1 8B on vLLM.
                </div>
              </div>

              {/* Step 2: Intake Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[#F0EFE2] font-medium text-[13px]">
                    <ClipboardList size={10} className="text-[#788274]" />
                    <span>Intake updated</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#666]">
                    <span className="text-[13px] uppercase font-bold tracking-widest">Model, engine, goal</span>
                    <ChevronDown size={10} />
                  </div>
                </div>
                <div className="flex flex-col gap-y-1.5 pl-9 pr-2 text-[#777777] text-[13px] w-full">
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
                  <div className="flex items-center gap-4 text-[#F0EFE2] font-medium text-[13px]">
                    <GitBranch size={18} className="text-[#788274]" />
                    <span>Plan drafted</span>
                    <span className="text-[#666] text-[13px] font-normal">3.1s</span>
                  </div>
                  <div className="text-[#666]">
                    <span className="font-mono text-[13px]">&gt;</span>
                  </div>
                </div>
                <div className="pl-9 text-[#777777] text-[13px]">
                  10 execution phases prepared
                </div>
              </div>

              {/* Step 4: Plan Action Card */}
              <div className="border border-[#2a2a2a] bg-[#1a1a1a] rounded-[3px] p-2 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 text-[#F0EFE2] font-medium text-[13px]">
                    <div className="flex items-center justify-center border border-[#333] rounded-md w-7 h-7 bg-[#222]">
                      <ListChecks size={15} className="text-[#F0EFE2]" />
                    </div>
                    <span>Plan ready</span>
                  </div>
                  <span className="text-[13px] text-[#666]">review / 10 phases / ~23m</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[#F0EFE2]  text-[13px] leading-snug tracking-wide">
                    Optimize Llama 3.1 8B on vLLM for cheapest GPU with latency and VRAM checks
                  </div>
                  <div className="text-[#C8C7BA] text-[13px] leading-snug">
                    Recommended path: vLLM on L4. Review the plan before execution.
                  </div>
                </div>

                {/* Divider line before buttons */}
                <div className="border-[#333] pt-3 mt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-[#F0EFE2] text-[13px] font-semibold  flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={9} />
                    <span>Open Plan</span>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-black text-[13px] font-bold  flex items-center gap-2 transition-colors cursor-pointer bg-[#75bf00] hover:bg-[#86dc00]"
                  >
                    <Play size={9} strokeWidth={2} />
                    <span>Accept and run</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Working... status indicator below the console area */}
            <div className="mt-2 pl-1 text-[10px] flex items-center gap-2 font-sans text-[#777777]">
              <span className="w-2 h-2 bg-[#555] rounded-[1px] shrink-0" />
              <span>Working...</span>
            </div>
          </div>
        </div>

        {/* Column 6: Right Margin Cell */}
        <div className="relative p-4 min-h-[460px]" />
      </div>

      {/* Intersection Pin Point Dots on BOTTOM Border */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10">
        {MARGIN_VERTICAL_POSITIONS.map((pos, idx) => (
          <span
            key={idx}
            className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
            style={{ left: pos }}
          />
        ))}
      </div>
    </section>
  );
}

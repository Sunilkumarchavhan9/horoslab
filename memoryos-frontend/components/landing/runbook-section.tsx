"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { MARGIN_VERTICAL_POSITIONS } from "./production-stack-section";

const VLLMOmniLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 22h20L12 2z" fill="#75bf00" opacity="0.8" />
    <path d="M12 8L6 20h12L12 8z" fill="#151515" />
  </svg>
);

const SGLangLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="18" r="3" fill="#8B5A2B" />
    <circle cx="18" cy="6" r="3" fill="#8B5A2B" />
    <path d="M7.5 16.5L16.5 7.5" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const NvidiaLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12Z" fill="#76B900" />
    <path d="M7 15L12 8L17 15H7Z" fill="#151515" />
  </svg>
);

const ENGINES = [
  { name: "vLLM-Omni", color: "#75bf00", Icon: VLLMOmniLogo },
  { name: "SGLang", color: "#8B5A2B", Icon: SGLangLogo },
  { name: "TensorRT-LLM", color: "#76B900", Icon: NvidiaLogo }
];

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
            <span className="font-sans font-medium text-2xl lg:text-[32px] leading-none" style={{ color: e.color }}>
              {e.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface RunbookSectionProps {
  onOpenSignIn?: () => void;
  dark?: boolean;
}

export function RunbookSection({ onOpenSignIn, dark = true }: RunbookSectionProps) {
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

      {/* Main Grid Layout (aligned with master vertical lines) */}
      <div className="relative z-10 w-full grid grid-cols-[14%_34%_38%_14%] border-t border-dashed border-[#333333]">
        {/* Column 1: Left Margin Cell */}
        <div className="relative p-4 min-h-[580px]" />

        {/* Column 2: Left Typography */}
        <div className="relative p-8 lg:p-12 flex flex-col justify-center border-r border-dashed border-[#333333] h-[580px]">
          <div className="space-y-4">
            <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-[#cccccc] font-sans leading-snug tracking-tight">
              RunInfra compares
              <br />
              <EngineScroller />
              <span className="ml-3 text-[#F0EFE2] align-middle">and</span>
              <br />
              <span className="text-[#F0EFE2]">every other engine your</span>
              <br />
              <span className="text-[#F0EFE2]">model can run on.</span>
            </h3>
          </div>
        </div>

        {/* Column 3: Right Dashboard */}
        <div className="relative p-6 lg:p-10 flex flex-col justify-start h-[580px] font-sans text-[#cccccc] z-10 w-full">
          {/* Inner dashed bounding box for the dashboard content */}
          <div className="w-full flex flex-col border border-dashed border-[#333333] bg-[#121212] rounded-[1px]">
            
            {/* Header */}
            <div className="flex items-start justify-between p-5 lg:p-6 border-b border-dashed border-[#333333]">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 border border-[#444] rounded-[1px] p-1.5 bg-[#1a1a1a]">
                  <ClipboardList size={16} className="text-[#C8C7BA]" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[#F0EFE2] font-medium text-[14px]">Mission Runtime Execution Plan</div>
                  <div className="text-[#666666] font-mono text-[11px]">Epoch Reality Intelligence Loop</div>
                </div>
              </div>
              <div className="border border-[#333] bg-[#1a1a1a] text-[#C8C7BA] font-mono text-[10px] px-2 py-0.5 rounded-[1px]">
                draft
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 border-b border-dashed border-[#333333] divide-x divide-dashed divide-[#333333]">
              <div className="p-4 lg:p-5 flex flex-col gap-1.5">
                <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">Primary Intent</div>
                <div className="text-[#F0EFE2] font-medium text-[13px]">Optimize Inference Cost</div>
              </div>
              <div className="p-4 lg:p-5 flex flex-col gap-1.5">
                <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">Hard Constraints</div>
                <div className="text-[#F0EFE2] font-medium text-[13px]">{"P99 <= 250ms, 24GB"}</div>
              </div>
              <div className="p-4 lg:p-5 flex flex-col gap-1.5">
                <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">Verification Mode</div>
                <div className="text-[#F0EFE2] font-medium text-[13px]">Empirical Benchmark</div>
              </div>
            </div>

            {/* Execution Plan */}
            <div className="p-5 lg:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="text-[#C8C7BA] font-mono text-[10px] uppercase tracking-wider">Execution Plan</div>
                <div className="text-[#666666] font-mono text-[10px]">10 phases, 3 validated</div>
              </div>

              {/* 2-Column Grid for Phases */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4">
                
                {/* Column 1 */}
                <div className="space-y-4">
                  <PhaseItem num="01" title="Input Normalization" desc="Process text, telemetry & sensors" status="ready" />
                  <PhaseItem num="02" title="Outcome Intelligence" desc="Extract intent & build contract" status="ready" />
                  <PhaseItem num="03" title="Capability Discovery" desc="Find models, runtimes, hardware" status="ready" />
                  <PhaseItem num="04" title="System Composer" desc="Build candidate stacks" status="queued" />
                  <PhaseItem num="05" title="Experiment Engine" desc="Simulate, sandbox, benchmark" status="queued" />
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <PhaseItem num="06" title="Autonomous Decision" desc="Quality and economics ranking" status="queued" />
                  <PhaseItem num="07" title="Policy & Authority" desc="Risk, cost, and safety gates" status="queued" />
                  <PhaseItem num="08" title="Execution Layer" desc="Deploy software or actuate physical" status="ready" />
                  <PhaseItem num="09" title="Evidence Collection" desc="Observe and gather provenance" status="queued" />
                  <PhaseItem num="10" title="Independent Verifier" desc="Verifiably confirm claims" status="queued" />
                </div>

              </div>
            </div>

            {/* Footer Bar */}
            <div className="border-t border-dashed border-[#333333] p-4 lg:px-6 lg:py-4 flex items-center justify-between">
              <div className="text-[#666666] font-mono text-[10px] flex items-center gap-2">
                <span className="w-[3px] h-[3px] bg-[#666]" />
                Review the mission contract, then authorize.
              </div>
              <div className="text-[#555555] font-mono text-[10px] uppercase tracking-wider">
                EPOCH CANONICAL_V4
              </div>
            </div>

          </div>
        </div>

        {/* Column 4: Right Margin Cell */}
        <div className="relative p-4 min-h-[580px]" />
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

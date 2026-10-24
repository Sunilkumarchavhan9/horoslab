"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

// Helper component for the horizontal borders with corner intersection dots
function HorizontalDivider({ position = "top", infinite = false }: { position?: "top" | "bottom", infinite?: boolean }) {
  return (
    <>
      <div
        className={`absolute ${position}-0 ${infinite ? "left-1/2 -translate-x-1/2 w-[100vw]" : "left-0 w-full"} h-[1px] border-t border-dashed border-[#333] pointer-events-none z-0`}
      />
      {/* Corner intersection dots at left-0 and right-0 of the container */}
      <div
        className={`absolute ${position === "top" ? "top-[-2.5px]" : "bottom-[-2.5px]"} left-[-2.5px] w-[5px] h-[5px] bg-[#555] rounded-[1px] z-20 pointer-events-none`}
      />
      <div
        className={`absolute ${position === "top" ? "top-[-2.5px]" : "bottom-[-2.5px]"} right-[-2.5px] w-[5px] h-[5px] bg-[#555] rounded-[1px] z-20 pointer-events-none`}
      />
    </>
  );
}

export function SystemComposerSection() {
  const candidates = [
    {
      id: "System A",
      model: "Llama 3 70B",
      runtime: "vLLM",
      hardware: "8x H100 (AWS)",
      quality: "98.2%",
      latency: "112ms",
      cost: "$0.90/1M",
      risk: "Low",
      status: "selected",
    },
    {
      id: "System B",
      model: "Qwen 2.5 72B",
      runtime: "TRT-LLM",
      hardware: "4x L40S (CoreWeave)",
      quality: "97.8%",
      latency: "145ms",
      cost: "$0.45/1M",
      risk: "Low",
      status: "shadow",
    },
    {
      id: "System C",
      model: "Mixtral 8x22B",
      runtime: "vLLM",
      hardware: "8x A100 (Azure)",
      quality: "95.1%",
      latency: "190ms",
      cost: "$0.65/1M",
      risk: "Medium",
      status: "rejected",
    }
  ];

  return (
    <section className="relative w-full bg-[#151515] font-sans overflow-hidden flex justify-center pt-12 lg:pt-16">

      {/* Outer Global Lines to match the Hardware section (6% and 94%) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      {/* Main Blueprint Container (aligned with the 120px inward margin on both sides) */}
      <div className="relative z-10 w-[92%] sm:w-[88%] lg:w-[calc(64%_-_240px)] flex flex-col pb-12 lg:pb-16">

        {/* Absolute Bottom Infinite Horizontal Line */}
        <HorizontalDivider position="bottom" infinite={true} />

        {/* Infinite Vertical Borders of the Main Box (These will exactly align with 14% and 86%) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute left-0 top-[-100vh] bottom-[-100vh] w-[1px] border-l border-dashed border-[#333]" />
          <div className="absolute right-0 top-[-100vh] bottom-[-100vh] w-[1px] border-r border-dashed border-[#333]" />
        </div>

        {/* 1. Header Section */}
        <div className="w-full text-center py-20 relative z-10">
          <HorizontalDivider position="top" infinite={true} />
          <h2 className="text-3xl lg:text-4xl font-medium text-[#C8C7BA] tracking-tight">
            System <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm inline-block leading-tight">Composer</span>
          </h2>
          <p className="text-[#FFF5CE] mt-6 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">
            HOROS discovers models, runtimes, and hardware, composing multiple candidate systems that compete in simulated sandboxes before execution.
          </p>
        </div>

        {/* Inner Container for Grid Sections */}
        <div className="relative w-full">
          {/* Fading Blueprint Grid Background (Starts Below Header) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent_80%)] pointer-events-none opacity-50 z-0" />

          {/* 2. Pipeline Flow Header */}
          <div className="w-full p-5 lg:p-10 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <HorizontalDivider position="top" />

            <div className="flex flex-col gap-3">
              <div className="text-[#75bf00] text-[9px] md:text-[10px] font-medium uppercase tracking-widest">
                Capability Discovery Phase
              </div>
              <div className="text-[#e0e0e0] text-[10px] md:text-[11px] lg:text-[12px] md:text-[14px] font-mono flex items-center flex-wrap gap-2">
                <span className="bg-[#111] px-2 py-1 rounded-[2px] text-[#C8C7BA] border border-[#333]">DISCOVER</span>
                <ArrowRight size={14} className="text-[#C8C7BA]" />
                <span className="bg-[#111] px-2 py-1 rounded-[2px] text-[#C8C7BA] border border-[#333]">COMPOSE</span>
                <ArrowRight size={14} className="text-[#C8C7BA]" />
                <span className="bg-[#1a1a1a] text-[#75bf00] border border-[#75bf00]/30 px-2 py-1 rounded-[2px] animate-pulse">EXPERIMENT</span>
                <ArrowRight size={14} className="text-[#C8C7BA]" />
                <span className="bg-[#111] px-2 py-1 rounded-[2px] text-[#C8C7BA] border border-[#333]">DECIDE</span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-[#C8C7BA] text-[9px] md:text-[10px] uppercase tracking-wider font-mono">Simulations Run</div>
                <div className="text-[#C8C7BA] font-mono text-[14px] md:text-[15px] lg:text-[16px]">3</div>
              </div>
              <div className="h-8 w-[1px] bg-[#333] border-r border-dashed border-[#333]" />
              <div className="text-right">
                <div className="text-[#C8C7BA] text-[9px] md:text-[10px] uppercase tracking-wider font-mono">Winner</div>
                <div className="text-[#75bf00] font-mono text-[14px] md:text-[15px] lg:text-[16px] font-medium">System A</div>
              </div>
            </div>
          </div>

          {/* 3. The Columns (Candidate Systems) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-dashed divide-[#333] relative z-10 border-b border-dashed border-[#333]">
            <HorizontalDivider position="top" />

            {candidates.map((system, idx) => (
              <div key={system.id} className={`p-6 lg:p-8 relative group ${system.status === 'selected' ? 'bg-[#75bf00]/[0.02]' : 'bg-[#111]/50'}`}>
                {/* Inner vertical alignment dashed line */}
                <div className="absolute top-0 bottom-0 left-6 lg:left-8 w-[1px] border-l border-dashed border-[#333] opacity-30" />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className={`text-[10px] md:text-[11px] lg:text-[12px] font-medium uppercase tracking-widest ${system.status === 'selected' ? 'text-[#75bf00]' : 'text-[#C8C7BA]'}`}>
                    {system.id}
                  </div>
                  <div className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[2px] border ${system.status === 'selected' ? 'border-[#75bf00]/50 text-[#75bf00] bg-[#75bf00]/10' :
                      system.status === 'shadow' ? 'border-[#f59e0b]/50 text-[#f59e0b] bg-[#f59e0b]/10' :
                        'border-[#333] text-[#666] bg-[#1a1a1a]'
                    }`}>
                    {system.status}
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {/* Composition */}
                  <div className="space-y-3 pl-4 border-l border-[#333] ml-1">
                    <div className="text-[#C8C7BA] text-[9px] md:text-[10px] font-mono uppercase tracking-wider -ml-5 bg-[#151515] inline-block px-1">Composition</div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                      <div className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium">{system.model}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                      <div className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px]">{system.runtime}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                      <div className="text-[#aaa] text-[11px] md:text-[12px] lg:text-[13px] font-mono">{system.hardware}</div>
                    </div>
                  </div>

                  {/* Benchmark Results */}
                  <div className="space-y-4 pt-6 border-t border-dashed border-[#333]">
                    <div className="text-[#C8C7BA] text-[9px] md:text-[10px] font-mono uppercase tracking-wider">Simulated Benchmark</div>

                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                      <div>
                        <div className="text-[#C8C7BA] text-[9px] md:text-[10px] mb-1 font-mono">Quality Score</div>
                        <div className={`text-[12px] md:text-[13px] lg:text-[14px] font-mono ${system.status === 'selected' ? 'text-[#C8C7BA]' : 'text-[#aaa]'}`}>{system.quality}</div>
                      </div>
                      <div>
                        <div className="text-[#C8C7BA] text-[9px] md:text-[10px] mb-1 font-mono">Median Latency</div>
                        <div className={`text-[12px] md:text-[13px] lg:text-[14px] font-mono ${system.status === 'selected' ? 'text-[#75bf00]' : 'text-[#aaa]'}`}>{system.latency}</div>
                      </div>
                      <div>
                        <div className="text-[#C8C7BA] text-[9px] md:text-[10px] mb-1 font-mono">Cost Efficiency</div>
                        <div className={`text-[12px] md:text-[13px] lg:text-[14px] font-mono ${system.status === 'selected' ? 'text-[#75bf00]' : 'text-[#aaa]'}`}>{system.cost}</div>
                      </div>
                      <div>
                        <div className="text-[#C8C7BA] text-[9px] md:text-[10px] mb-1 font-mono">Policy Risk</div>
                        <div className={`text-[12px] md:text-[13px] lg:text-[14px] font-mono ${system.risk === 'Low' ? 'text-[#C8C7BA]' : 'text-[#f59e0b]'}`}>{system.risk}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlight line for selected */}
                {system.status === 'selected' && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#75bf00] z-20" />
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

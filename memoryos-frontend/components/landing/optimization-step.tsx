"use client";

import React from "react";
import { Info } from "lucide-react";

export function OptimizationStep() {
  const metrics = [
    {
      title: "Latency",
      value: "38.2 ms",
      baseline: "184ms",
      delta: "-79%",
      desc: "measured across 10k reqs on L40S"
    },
    {
      title: "TTFT p50",
      value: "24.1 ms",
      baseline: "75ms",
      delta: "-68%",
      desc: "prefix caching + AWQ kernel prefill"
    },
    {
      title: "TPOT p50",
      value: "4.2 ms/tok",
      baseline: "12ms",
      delta: "+185%",
      desc: "FlashAttention v2 + CUDA Graphs"
    },
    {
      title: "Throughput",
      value: "518 tok/s",
      baseline: "164 tok/s",
      delta: "+216%",
      desc: "continuous batching @ 64"
    },
    {
      title: "Cost per 1M tokens",
      value: "$0.12",
      baseline: "$0.41",
      delta: "-71%",
      desc: "L40S ($0.92/hr) vs A100 baseline"
    },
    {
      title: "VRAM",
      value: "14.2 GB",
      baseline: "33.1 GB",
      delta: "-57%",
      desc: "fits in single 48GB GPU budget"
    }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#333333] p-4 sm:p-5 lg:p-5 bg-[#151515] rounded-[1px] font-mono select-none overflow-hidden">
      
      {/* Top Header Title */}
      <div className="flex items-center justify-between pb-0.5">
        <span className="text-[11px] font-bold text-[#F0EFE2] tracking-widest uppercase">
          OPTIMIZATION RESULTS
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[1px] bg-[#181818] border border-[#2a2a2a] text-[10px] text-[#A3A3A3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00]"></span>
          <span>completed on L40S</span>
        </div>
      </div>

      {/* Optimization Pillars (Model, Runtime, Compute) */}
      <div className="p-2.5 lg:p-3 rounded-[1px] border border-[#222222] bg-[#161616] space-y-2.5">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 text-[#cccccc] font-medium">
            <span>Applied Optimizations</span>
            <Info size={11} className="text-[#666666]" />
          </div>
          <span className="text-[9px] text-[#75bf00] font-mono font-semibold">
            3 phases verified
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Model Optimize */}
          <div className="flex flex-col gap-1 border-l border-[#75bf00] pl-2 relative">
            <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 bg-[#75bf00] rounded-full"></div>
            <span className="text-[9px] text-[#C8C7BA] font-bold uppercase tracking-wider">Model</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-[#F0EFE2]">AWQ int4 quantize</span>
              <span className="text-[9px] text-[#F0EFE2]">Specialize</span>
            </div>
          </div>

          {/* Runtime Optimize */}
          <div className="flex flex-col gap-1 border-l border-[#75bf00] pl-2 relative">
            <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 bg-[#75bf00] rounded-full"></div>
            <span className="text-[9px] text-[#C8C7BA] font-bold uppercase tracking-wider">Runtime</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-[#F0EFE2]">FlashAttention v2</span>
              <span className="text-[9px] text-[#F0EFE2]">Paged KV cache</span>
              <span className="text-[9px] text-[#F0EFE2]">CUDA graphs</span>
            </div>
          </div>

          {/* Compute Optimize */}
          <div className="flex flex-col gap-1 border-l border-[#75bf00] pl-2 relative">
            <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 bg-[#75bf00] rounded-full"></div>
            <span className="text-[9px] text-[#C8C7BA] font-bold uppercase tracking-wider">Compute</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-[#F0EFE2]">GPU Auto-Tune</span>
              <span className="text-[9px] text-[#F0EFE2]">L40S placement</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid (6 Metric Cards with compact heights) */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-2.5 rounded-[1px] border border-[#222222] bg-[#161616] flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] pb-1">
              <div className="flex items-center gap-1 text-[#aaaaaa]">
                <span className="font-medium truncate">{m.title}</span>
                <Info size={10} className="text-[#555555] shrink-0" />
              </div>
              <span className="text-[9px] text-[#75bf00] font-bold shrink-0">{m.delta}</span>
            </div>

            {/* Value Area */}
            <div className="py-1.5 text-center flex flex-col items-center justify-center border-t border-b border-dashed border-[#222222] my-0.5">
              <div className="text-[14px] font-bold text-[#F0EFE2] tracking-tight">
                {m.value}
              </div>
              <div className="text-[8px] text-[#666666] line-through font-mono">
                baseline {m.baseline}
              </div>
            </div>

            {/* Subtext */}
            <div className="text-[8px] text-[#666666] text-center truncate pt-0.5">
              {m.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-[#222222]">
        <div className="flex items-center gap-1.5 text-[9px] text-[#C8C7BA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00]"></span>
          <span>Confirmed winner: <strong className="text-[#F0EFE2]">NVIDIA L40S</strong></span>
        </div>
        <div className="text-[#75bf00] text-[9px] font-semibold">
          94.2s runtime elapsed
        </div>
      </div>

    </div>
  );
}

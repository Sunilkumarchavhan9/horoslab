"use client";

import React from "react";
import { Cpu, Zap } from "lucide-react";

export function OptimizationDashboard() {
  return (
    <div className="w-full max-w-xl bg-[#111111] rounded-[1px] border border-[#262626] font-mono text-sm overflow-hidden select-none p-5">

      {/* Header Section */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Real R: Logo Mark */}
            <div className="flex items-center justify-center w-6 h-6 bg-[#222222] rounded-[1px] border border-[#333333] shrink-0 font-sans font-medium text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] tracking-tighter">
              R:
            </div>

            <span className="text-[#C8C7BA] font-medium text-[11px] md:text-[12px] lg:text-[13px]">Optimization run</span>

            {/* Running Badge */}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[1px] border border-[#2a2a2a] bg-[#181818] text-[9px] md:text-[10px] text-[#A3A3A3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00]"></span>
              running
            </span>
          </div>

          <div className="text-[9px] md:text-[10px] text-[#A3A3A3] px-2.5 py-0.5 rounded-[1px] bg-[#181818] border border-[#2a2a2a]">
            4/5 phases
          </div>
        </div>

        <div className="text-[#C8C7BA] text-[9px] md:text-[10px] lg:text-[11px]">
          Benchmarking the tuned config against cheaper GPU candidates.
        </div>
      </div>

      {/* Chart Box */}
      <div className="p-4 rounded-[1px] border border-[#222222] bg-[#141414] mb-4">

        {/* Chart Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] text-[#666666] font-medium tracking-wider uppercase">
            P95 LATENCY DURING THE RUN
          </span>
          <span className="text-[9px] text-[#666666]">
            96s window
          </span>
        </div>

        {/* SVG Line Chart */}
        <div className="relative h-[150px] w-full my-2">

          {/* Baseline reference */}
          <div className="absolute top-[18%] left-0 w-full border-t border-dashed border-[#3a3a3a]"></div>
          <span className="absolute top-[8%] left-0 text-[9px] text-[#666666]">baseline 184ms</span>

          <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" className="overflow-visible absolute inset-0">
            {/* Curve path matching the screenshot: starts at (0, 20), drops to (12, 30), (160, 80), (240, 100), (390, 108) */}
            <path
              d="M 0 20 L 15 30 L 170 80 L 250 100 L 390 108"
              vectorEffect="non-scaling-stroke"
              stroke="#75bf00"
              strokeWidth="2"
              fill="none"
            />
            {/* Green node dots */}
            <circle cx="0" cy="20" r="3" fill="#75bf00" />
            <circle cx="15" cy="30" r="3" fill="#75bf00" />
            <circle cx="170" cy="80" r="3" fill="#75bf00" />
            <circle cx="250" cy="100" r="3" fill="#75bf00" />
            <circle cx="390" cy="108" r="3" fill="#75bf00" />
          </svg>

          {/* 38ms Tag */}
          <div className="absolute right-3 bottom-3 flex items-center justify-center bg-[#75bf00] text-[#111111] text-[9px] md:text-[10px] font-medium px-1.5 py-0.5 rounded-[1px] shadow-sm">
            38ms
          </div>
        </div>

        {/* Chart Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00]"></span>
            <span className="text-[9px] md:text-[10px] text-[#C8C7BA]">Confirming winner on L40S</span>
          </div>
          <span className="text-[9px] md:text-[10px] text-[#666666]">
            94.2s elapsed
          </span>
        </div>

      </div>

      {/* Baseline vs Optimized Table */}
      <div className="pt-1">
        <div className="text-[9px] text-[#666666] font-medium tracking-wider uppercase mb-3">
          BASELINE VS OPTIMIZED
        </div>

        <div className="w-full">
          {/* Header */}
          <div className="grid grid-cols-[38%_20%_24%_18%] pb-1.5 border-b border-[#222222] text-[9px] text-[#666666] uppercase">
            <div>METRIC</div>
            <div>BASELINE</div>
            <div>OPTIMIZED</div>
            <div className="text-right">DELTA</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1c1c1c] text-[9px] md:text-[10px] lg:text-[11px] text-[#C8C7BA]">

            <div className="grid grid-cols-[38%_20%_24%_18%] py-2 items-center">
              <div>P95 latency</div>
              <div>184ms</div>
              <div className="text-[#C8C7BA] font-medium">38ms</div>
              <div className="text-right text-[#75bf00] font-medium">-79%</div>
            </div>

            <div className="grid grid-cols-[38%_20%_24%_18%] py-2 items-center">
              <div>Throughput</div>
              <div>45 tok/s</div>
              <div className="text-[#C8C7BA] font-medium">142 tok/s</div>
              <div className="text-right text-[#75bf00] font-medium">+216%</div>
            </div>

            <div className="grid grid-cols-[38%_20%_24%_18%] py-2 items-center">
              <div>VRAM</div>
              <div>28.4 GB</div>
              <div className="text-[#C8C7BA] font-medium">12.1 GB</div>
              <div className="text-right text-[#75bf00] font-medium">-57%</div>
            </div>

            <div className="grid grid-cols-[38%_20%_24%_18%] py-2 items-center">
              <div>Cost / 1M tokens</div>
              <div>$0.42</div>
              <div className="text-[#C8C7BA] font-medium">$0.12</div>
              <div className="text-right text-[#75bf00] font-medium">-71%</div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

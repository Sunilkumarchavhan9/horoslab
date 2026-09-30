"use client";

import React, { useState } from "react";
import { Cloud, ExternalLink, Rocket, Check, Cpu } from "lucide-react";
import { NvidiaLogo } from "@/components/dhyra/primitives/brand-icons";

export function DeployDashboard() {
  const [activeTab, setActiveTab] = useState<"dockerfile" | "servesh" | "runinfrayaml">("dockerfile");
  const [selectedTarget, setSelectedTarget] = useState<"runinfra" | "runpod" | "modal">("runinfra");

  return (
    <div className="w-full max-w-xl bg-[#111111] rounded-[1px] border border-[#262626] font-mono text-sm overflow-hidden select-none p-5 space-y-4">

      {/* Header Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Cloud Icon */}
            <div className="flex items-center justify-center w-6 h-6 bg-[#162010] rounded-[1px] border border-[#2e4719] text-[#75bf00]">
              <Cloud size={13} strokeWidth={2.2} />
            </div>

            <span className="text-[#C8C7BA] font-medium text-[11px] md:text-[12px] lg:text-[13px]">Deploy or export the stack</span>
          </div>

          <div className="text-[9px] md:text-[10px] text-[#A3A3A3] px-2.5 py-0.5 rounded-[1px] bg-[#181818] border border-[#2a2a2a] flex items-center gap-1">
            <Check size={11} className="text-[#75bf00]" />
            ready
          </div>
        </div>

        <div className="text-[#C8C7BA] text-[9px] md:text-[10px] lg:text-[11px] pl-8">
          Pick a target for the optimized L40S build.
        </div>
      </div>

      {/* Target Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[9px] text-[#666666] uppercase tracking-wider font-medium">
          <span>TARGET</span>
          <span>SUPPORTED GPUS</span>
        </div>

        <div className="border border-[#222222] bg-[#141414] rounded-[1px] divide-y divide-[#1c1c1c] overflow-hidden">

          {/* Item 1: RunInfra Cloud */}
          <div
            onClick={() => setSelectedTarget("runinfra")}
            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${selectedTarget === "runinfra" ? "bg-[#181a16] border-l-2 border-l-[#75bf00]" : "hover:bg-[#161616]"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-[#222222] rounded-[1px] border border-[#333333] shrink-0 font-sans font-medium text-[#C8C7BA] text-[9px] md:text-[10px] lg:text-[11px]">
                R:
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] md:text-[11px] lg:text-[12px] font-medium text-[#C8C7BA]">RunInfra Cloud</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-[1px] bg-[#1d2d14] text-[#75bf00] border border-[#2d471e] flex items-center gap-0.5">
                    <Check size={9} />
                    selected
                  </span>
                </div>
                <div className="text-[9px] md:text-[10px] text-[#666666] truncate max-w-[200px]">
                  Fully managed endpoint, billed per mil...
                </div>
              </div>
            </div>

            {/* GPU Badges */}
            <div className="flex items-center gap-1">
              {["H100", "L40S", "A100", "L4"].map((gpu) => (
                <span key={gpu} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[1px] bg-[#1b1b1b] border border-[#282828] text-[#999999]">
                  <NvidiaLogo size={9} />
                  {gpu}
                </span>
              ))}
            </div>
          </div>

          {/* Item 2: Your RunPod */}
          <div
            onClick={() => setSelectedTarget("runpod")}
            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${selectedTarget === "runpod" ? "bg-[#181a16] border-l-2 border-l-[#75bf00]" : "hover:bg-[#161616]"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-[#251833] rounded-[1px] border border-[#43236b] text-[#A855F7] shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.3l7.5 4.1-7.5 4.1-7.5-4.1L12 4.3z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] md:text-[11px] lg:text-[12px] font-medium text-[#C8C7BA]">Your RunPod</span>
                <div className="text-[9px] md:text-[10px] text-[#666666]">
                  Deploy to your own RunPod account
                </div>
              </div>
            </div>

            {/* GPU Badges */}
            <div className="flex items-center gap-1">
              {["H100", "A100", "RTX 4090", "L40S"].map((gpu) => (
                <span key={gpu} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[1px] bg-[#1b1b1b] border border-[#282828] text-[#999999]">
                  <NvidiaLogo size={9} />
                  {gpu}
                </span>
              ))}
            </div>
          </div>

          {/* Item 3: Your Modal */}
          <div
            onClick={() => setSelectedTarget("modal")}
            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${selectedTarget === "modal" ? "bg-[#181a16] border-l-2 border-l-[#75bf00]" : "hover:bg-[#161616]"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-[#11241f] rounded-[1px] border border-[#1d463a] text-[#10B981] shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] md:text-[11px] lg:text-[12px] font-medium text-[#C8C7BA]">Your Modal</span>
                <div className="text-[9px] md:text-[10px] text-[#666666]">
                  Deploy to your own Modal workspace
                </div>
              </div>
            </div>

            {/* GPU Badges */}
            <div className="flex items-center gap-1">
              {["H100", "A100", "L40S", "T4"].map((gpu) => (
                <span key={gpu} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[1px] bg-[#1b1b1b] border border-[#282828] text-[#999999]">
                  <NvidiaLogo size={9} />
                  {gpu}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Generated Stack Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#666666] uppercase tracking-wider font-medium">
            GENERATED STACK
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("dockerfile")}
              className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-[1px] transition-colors ${activeTab === "dockerfile" ? "bg-[#252525] text-[#C8C7BA] border border-[#333333]" : "text-[#666666] hover:text-[#aaaaaa]"}`}
            >
              Dockerfile
            </button>
            <button
              onClick={() => setActiveTab("servesh")}
              className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-[1px] transition-colors ${activeTab === "servesh" ? "bg-[#252525] text-[#C8C7BA] border border-[#333333]" : "text-[#666666] hover:text-[#aaaaaa]"}`}
            >
              serve.sh
            </button>
            <button
              onClick={() => setActiveTab("runinfrayaml")}
              className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-[1px] transition-colors ${activeTab === "runinfrayaml" ? "bg-[#252525] text-[#C8C7BA] border border-[#333333]" : "text-[#666666] hover:text-[#aaaaaa]"}`}
            >
              runinfra.yaml
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-3 bg-[#0d0d0d] rounded-[1px] border border-[#1e1e1e] text-[9px] md:text-[10px] lg:text-[11px] leading-relaxed font-mono overflow-x-auto text-[#d4d4d4]">
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">1</span><span><span className="text-[#E06C75]">FROM</span> runinfra/vllm:0.6.3-l40s</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">2</span><span><span className="text-[#E06C75]">ENV</span> MODEL=Llama-3.1-8B-Instruct</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">3</span><span><span className="text-[#E06C75]">ENV</span> QUANTIZATION=awq_marlin</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">4</span><span><span className="text-[#E06C75]">COPY</span> ./weights /models</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">5</span><span><span className="text-[#E06C75]">CMD</span> vllm serve $MODEL \</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">6</span><span className="pl-4">--quantization awq_marlin \</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">7</span><span className="pl-4">--kv-cache-dtype fp8 \</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">8</span><span className="pl-4">--enable-prefix-caching \</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">9</span><span className="pl-4">--max-num-seqs 256 \</span></div>
          <div className="flex"><span className="text-[#444444] select-none w-5 text-right mr-3 shrink-0">10</span><span className="pl-4">--gpu-memory-utilization 0.92</span></div>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
        <div className="flex items-center gap-3 text-[9px] md:text-[10px] lg:text-[11px]">
          <span className="text-[#C8C7BA] font-medium">$0.12 / 1M</span>
          <span className="text-[#666666]">38ms p95</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[1px] bg-[#181818] border border-[#2a2a2a] text-[9px] md:text-[10px] text-[#999999]">
            <NvidiaLogo size={10} />
            L40S
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[1px] border border-[#333333] bg-[#1a1a1a] text-[9px] md:text-[10px] lg:text-[11px] text-[#C8C7BA] hover:bg-[#252525] transition-colors">
            <ExternalLink size={11} className="text-[#C8C7BA]" />
            Deployment kit
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-[1px] bg-[#75bf00] text-black font-medium text-[9px] md:text-[10px] lg:text-[11px] hover:bg-[#86d900] transition-colors shadow-[0_0_8px_rgba(117,191,0,0.3)]">
            <Rocket size={12} className="fill-black" />
            Deploy
          </button>
        </div>
      </div>

    </div>
  );
}

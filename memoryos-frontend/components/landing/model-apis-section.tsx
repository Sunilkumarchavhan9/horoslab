"use client";

import React from "react";
import { ArrowRight, Box, Cloud, Radio, Server } from "lucide-react";
import { VLLMLogo, NvidiaLogo, DeepSeekLogo, EpochLogo, RunPodLogo, TeslaLogo, OneXLogo, OpenTelemetryLogo, ModalLogo, K8sFaviconLogo, SGLangLogo } from "../epoch/primitives/brand-icons";

interface ModelApisSectionProps {
  dark?: boolean;
}

export function ModelApisSection({ dark = true }: ModelApisSectionProps) {
  return (
    <section className="relative w-full bg-[#151515] text-[#F0EFE2] font-sans select-none overflow-hidden pb-16">

      {/* Background Dashed Lines - Global Layout */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[6%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[94%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />

        {/* Top horizontal line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] border-t border-dashed border-[#333]" />
      </div>

      <div className="relative z-10 w-full px-0 pt-0">
        <div className="w-full flex flex-col items-center">

          {/* Small floating logo element exactly centered on the 50% line at top-0 */}
          <div className="absolute top-0 left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 bg-[#151515] px-2 text-[#75bf00]">
            <EpochLogo size={18} />
          </div>

          {/* Header Section (Spans the 72% inner area) */}
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-center py-24 z-10 relative">
            Decode physical reality, or build your own <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm inline-block leading-tight">stack</span>
          </h2>

          {/* Main 2-Column Grid Area */}
          <div className="w-full relative">
            <div className="w-full grid grid-cols-[14%_72%_14%] relative z-10">
              {/* Empty Left Margin */}
              <div />

              {/* The 72% inner container with 2 columns */}
              <div className="grid grid-cols-2 w-full border-t border-x border-dashed border-[#333] divide-x divide-dashed divide-[#333]">

                {/* --- ROW 1 --- */}
                <div className="flex flex-col p-6 lg:p-8 xl:p-10 border-b border-dashed border-[#333] relative overflow-hidden group">
                  <div className="text-[#75bf00] text-[10px] font-mono font-bold uppercase tracking-widest mb-6 relative z-10">
                    BUILD OR EXPORT
                  </div>
                  <h3 className="text-2xl font-semibold text-[#F0EFE2] mb-2 tracking-tight relative z-10">
                    Optimize models for reality
                  </h3>
                  <p className="text-[#C8C7BA] text-[13px] relative z-10 max-w-[90%]">
                    Upload any Hugging Face model or dataset repository. Let Epoch auto-optimize it for your physical reality and constraints.
                  </p>
                </div>
                <div className="flex flex-col p-6 lg:p-8 xl:p-10 border-b border-dashed border-[#333] relative overflow-hidden group">
                  <div className="text-[#75bf00] text-[10px] font-mono font-bold uppercase tracking-widest mb-6 relative z-10">
                    MODEL APIS
                  </div>
                  <h3 className="text-2xl font-semibold text-[#F0EFE2] mb-2 tracking-tight relative z-10">
                    Serverless capability routing
                  </h3>
                  <p className="text-[#C8C7BA] text-[13px] max-w-sm leading-relaxed relative z-10">
                    Or skip the infra entirely. Hit one universal endpoint that seamlessly routes your intent to the best hardware and models behind the scenes.
                  </p>
                </div>

                {/* --- ROW 2 --- */}
                <div className="flex flex-col border-b border-dashed border-[#333]">
                  <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-10 border-b border-dashed border-[#333]">
                    <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                      <Radio size={20} className="text-[#8b5cf6]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#e0e0e0]">Connect with any sensory hardware</span>
                  </div>

                  <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-10 border-b border-dashed border-[#333]">
                    <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                      <NvidiaLogo size={22} />
                    </div>
                    <span className="text-[13px] font-medium text-[#e0e0e0]">Size the GPU / XPU edge target</span>
                  </div>

                  <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-10">
                    <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                      <Server size={20} className="text-[#C8C7BA]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#e0e0e0]">Allocate shared cache & VRAM limits</span>
                  </div>
                </div>

                <div className="p-6 lg:p-8 xl:p-10 border-b border-dashed border-[#333] flex flex-col justify-center relative group cursor-pointer transition-colors hover:bg-white/[0.02]">
                  <div className="absolute right-6 lg:right-8 xl:right-10 top-1/2 -translate-y-1/2 text-[#666] group-hover:text-[#F0EFE2] transition-colors">
                    <ArrowRight size={14} />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                      <DeepSeekLogo size={20} className="text-[#4d7aff]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-[#F0EFE2] text-[17px]">DeepSeek V4 Flash</span>
                        <span className="text-[#75bf00] text-[10px] font-mono uppercase font-bold tracking-wider mt-0.5">AVAILABLE</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
                        <span className="text-[13px] text-[#C8C7BA] font-mono bg-[#222] px-1.5 rounded-sm">Intelligence</span>
                        <span className="text-[13px] text-[#C8C7BA] font-mono bg-[#222] px-1.5 rounded-sm">Vision</span>
                        <span className="text-[13px] text-[#C8C7BA] font-mono bg-[#222] px-1.5 rounded-sm">Tool Use</span>
                        <span className="text-[13px] font-mono bg-transparent border border-[#75bf00]/30 text-[#75bf00] px-1.5 rounded-sm">P99 SLA</span>
                      </div>

                      <div className="text-[12px] text-[#666] font-mono mb-1">
                        deepseek-ai/DeepSeek-V4-Flash-0731
                      </div>
                      <div className="text-[12px] text-[#C8C7BA] mb-2">
                        OpenAI-compatible chat completions, Anthropic-compatible Messages
                      </div>
                      <div className="text-[12px] text-[#C8C7BA] flex items-center gap-2">
                        Hosted via <ModalLogo size={14} /> Modal & AWS
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- ROW 3 --- */}
                <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-10 border-b border-dashed border-[#333]">
                  <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" className="w-[24px] h-[24px] grayscale opacity-70" />
                  </div>
                  <span className="text-[13px] font-medium text-[#e0e0e0]">Export the dedicated K8s & Docker kit</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333]">
                  <div className="p-6 lg:px-8 flex flex-col justify-center">
                    <div className="text-[#F0EFE2] font-semibold text-[17px]">$0.13</div>
                    <div className="text-[#C8C7BA] text-[12px] mt-1">per 1M input tokens</div>
                  </div>
                  <div className="p-6 lg:px-8 flex flex-col justify-center">
                    <div className="text-[#F0EFE2] font-semibold text-[17px]">$0.27</div>
                    <div className="text-[#C8C7BA] text-[12px] mt-1">per 1M output tokens</div>
                  </div>
                  <div className="p-6 lg:px-8 flex flex-col justify-center">
                    <div className="text-[#F0EFE2] font-semibold text-[17px]">1,048,576 <span className="text-[#C8C7BA] text-[12px] font-normal">tokens</span></div>
                    <div className="text-[#C8C7BA] text-[12px] mt-1">Context window</div>
                  </div>
                </div>

                {/* --- ROW 4 --- */}
                <div className="flex items-center p-6 lg:px-8 xl:px-10">
                  <a href="#" className="inline-flex items-center gap-2 text-[#75bf00] hover:text-[#F0EFE2] transition-colors text-[13px] font-medium group">
                    Start building your stack
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
                <div className="flex items-center p-6 lg:px-8 xl:px-10">
                  <a href="#" className="inline-flex items-center gap-2 text-[#75bf00] hover:text-[#F0EFE2] transition-colors text-[13px] font-medium group">
                    Browse 40+ supported APIs
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Empty Right Margin */}
              <div />

            </div>

            {/* Footer Logos Row */}
            <div className="w-full grid grid-cols-[14%_72%_14%] relative z-10">
              <div />
              <div className="py-8 border-y border-x border-dashed border-[#333] flex flex-wrap items-center justify-center gap-12 lg:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500 px-8 lg:px-12">
                <div className="text-[11px] font-mono font-bold text-[#444] tracking-widest uppercase">
                  Built and served with
                </div>
                <div className="flex flex-wrap items-center gap-8 lg:gap-12">
                  <div className="flex items-center gap-2"><NvidiaLogo size={24} /><span className="text-[#C8C7BA] font-semibold text-[13px]">NVIDIA</span></div>
                  <div className="flex items-center gap-2"><VLLMLogo size={24} /><span className="text-[#C8C7BA] font-semibold text-[13px]">vLLM</span></div>
                  <div className="flex items-center gap-2 text-[#C8C7BA]">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg" alt="PyTorch" className="w-[24px] h-[24px] grayscale opacity-80" />
                    <span className="font-semibold text-[13px]">PyTorch</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#C8C7BA]"><NvidiaLogo size={24} /><span className="font-semibold text-[13px]">TensorRT-LLM</span></div>
                  <div className="flex items-center gap-2 text-[#C8C7BA]">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" className="w-[24px] h-[24px]" />
                    <span className="font-mono text-[13px] font-semibold">Docker</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#C8C7BA]">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" alt="Kubernetes" className="w-[24px] h-[24px]" />
                    <span className="font-mono text-[13px] font-semibold">Kubernetes</span>
                  </div>
                </div>
              </div>
              <div />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

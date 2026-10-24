"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, Cloud, Radio, Server } from "lucide-react";
import { VLLMLogo, NvidiaLogo, DeepSeekLogo, HorosLogo, RunPodLogo, TeslaLogo, OneXLogo, OpenTelemetryLogo, ModalLogo, K8sFaviconLogo, SGLangLogo } from "../horos/primitives/brand-icons";
import { SectionDivider } from "@/components/landing/section-divider";

interface ModelApisSectionProps {
  dark?: boolean;
}

export function ModelApisSection({ dark = true }: ModelApisSectionProps) {
  const [selectedModel, setSelectedModel] = useState<"horos" | "deepseek">("horos");

  return (
    <section className="relative w-full bg-[#151515] text-[#F0EFE2] font-sans select-none overflow-hidden pb-16">

      {/* Background Dashed Lines - Global Layout */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[calc(14%_+_120px)] lg:left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[calc(86%_-_120px)] lg:left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />

        {/* Top Infinite Horizontal Line to separate from previous section */}
        <SectionDivider />
      </div>

      <div className="relative z-10 w-full px-0 pt-0">
        <div className="w-full flex flex-col items-center">

          {/* Small floating logo element exactly centered on the 50% line at top-0 */}
          <div className="absolute top-0 left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 bg-[#151515] px-2 text-[#75bf00]">
            <HorosLogo size={18} />
          </div>

          {/* Header Section (Spans the 72% inner area) */}
          <div className="py-20 lg:py-24 text-center z-10 relative px-4">
            <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#75bf00] uppercase mb-3">
              FRONTIER AI LAB · REALITY INTELLIGENCE INFRASTRUCTURE
            </div>
            <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-center">
              Teach intelligence to decode your <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm inline-block leading-tight">reality</span>
            </h2>
          </div>

          {/* Main 2-Column Grid Area */}
          <div className="w-full relative">
            <div className="w-full grid grid-cols-1 lg:grid-cols-[calc(18%_+_120px)_1fr_calc(18%_+_120px)] relative z-10">
              {/* Empty Left Margin */}
              <div className="hidden lg:block" />

              {/* The 72% inner container with 2 columns */}
              <div className="grid grid-cols-2 w-full border-t border-x border-dashed border-[#333] divide-x divide-dashed divide-[#333]">

                {/* --- ROW 1 --- */}
                <div className="flex flex-col p-6 lg:p-8 xl:p-10 border-b border-dashed border-[#333] relative overflow-hidden group">
                  <div className="text-[#75bf00] text-[10px] font-mono font-bold uppercase tracking-widest mb-6 relative z-10">
                    TEACH CONTINUOUSLY
                  </div>
                  <h3 className="text-2xl font-semibold text-[#F0EFE2] mb-2 tracking-tight relative z-10">
                    Adapt models to your physics
                  </h3>
                  <p className="text-[#C8C7BA] text-[13px] relative z-10 max-w-[90%]">
                    Provide HOROS with open models and physical telemetry. The runtime continually adapts weights, state, and rules to match your environment.
                  </p>
                </div>
                <div className="flex flex-col p-6 lg:p-8 xl:p-10 border-b border-dashed border-[#333] relative overflow-hidden group">
                  <div className="text-[#75bf00] text-[10px] font-mono font-bold uppercase tracking-widest mb-6 relative z-10">
                    INTELLIGENCE ROUTING
                  </div>
                  <h3 className="text-2xl font-semibold text-[#F0EFE2] mb-2 tracking-tight relative z-10">
                    Route intent, not inference
                  </h3>
                  <p className="text-[#C8C7BA] text-[13px] max-w-sm leading-relaxed relative z-10">
                    Stop manually calling model APIs. Send intent to the runtime, and it routes tasks to the best adapted intelligence for the job.
                  </p>
                </div>

                {/* --- ROW 2 --- */}
                <div className="flex flex-col border-b border-dashed border-[#333]">
                  <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-[120px] border-b border-dashed border-[#333]">
                    <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                      <Radio size={20} className="text-[#8b5cf6]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#e0e0e0]">Connect with any sensory hardware</span>
                  </div>

                  <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-[120px] border-b border-dashed border-[#333]">
                    <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                      <NvidiaLogo size={22} />
                    </div>
                    <span className="text-[13px] font-medium text-[#e0e0e0]">Size the GPU / XPU edge target</span>
                  </div>

                  <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-[120px]">
                    <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                      <Server size={20} className="text-[#C8C7BA]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#e0e0e0]">Allocate shared cache & VRAM limits</span>
                  </div>
                </div>

                <div className="p-6 lg:p-8 xl:p-10 border-b border-dashed border-[#333] flex flex-col justify-center relative group transition-colors hover:bg-white/[0.02]">
                  {/* Model Tab Switcher */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedModel("horos")}
                      className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                        selectedModel === "horos"
                          ? "bg-[#75bf00]/15 text-[#75bf00] border border-[#75bf00]/40 font-semibold"
                          : "text-[#888] hover:text-[#ccc] border border-transparent"
                      }`}
                    >
                      <HorosLogo size={12} />
                      Horos Reality Decoder (Lab)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModel("deepseek")}
                      className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                        selectedModel === "deepseek"
                          ? "bg-white/10 text-[#F0EFE2] border border-white/20 font-semibold"
                          : "text-[#888] hover:text-[#ccc] border border-transparent"
                      }`}
                    >
                      <DeepSeekLogo size={12} />
                      DeepSeek V4 Flash (Mesh)
                    </button>
                  </div>

                  {selectedModel === "horos" ? (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#75bf00]/40 flex items-center justify-center shrink-0 text-[#75bf00]">
                        <HorosLogo size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-[#F0EFE2] text-[17px]">Horos Reality Decoder</span>
                          <span className="bg-[#75bf00]/20 text-[#75bf00] border border-[#75bf00]/40 text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-xs">FRONTIER LAB</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
                          <span className="text-[12px] text-[#C8C7BA] font-mono bg-[#222] px-1.5 rounded-sm">128B MoE</span>
                          <span className="text-[12px] text-[#C8C7BA] font-mono bg-[#222] px-1.5 rounded-sm">Spatial 3D</span>
                          <span className="text-[12px] text-[#C8C7BA] font-mono bg-[#222] px-1.5 rounded-sm">Sensor Fusion</span>
                          <span className="text-[12px] font-mono bg-[#75bf00]/10 border border-[#75bf00]/30 text-[#75bf00] px-1.5 rounded-sm">&lt;45ms TTFT</span>
                        </div>

                        <div className="text-[12px] text-[#888] font-mono mb-1">
                          horos-lab/Reality-Decoder-v1
                        </div>
                        <div className="text-[12px] text-[#C8C7BA] mb-2 leading-relaxed">
                          Multi-camera spatial depth, point clouds & industrial telemetry decoding
                        </div>
                        <div className="text-[12px] text-[#888] flex items-center gap-2">
                          Served natively via Horos Reality Fabric & Edge Mesh
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* --- ROW 3 --- */}
                <div className="flex items-center gap-4 p-6 lg:px-8 xl:px-[120px] border-b border-dashed border-[#333]">
                  <div className="w-10 h-10 rounded-[2px] bg-[#151515] border border-dashed border-[#333] flex items-center justify-center shrink-0">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" className="w-[24px] h-[24px] grayscale opacity-70" />
                  </div>
                  <span className="text-[13px] font-medium text-[#e0e0e0]">Export the dedicated K8s & Docker kit</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333]">
                  <div className="p-6 lg:px-8 flex flex-col justify-center">
                    <div className="text-[#F0EFE2] font-semibold text-[17px]">
                      {selectedModel === "horos" ? "$0.01" : "$0.13"}
                    </div>
                    <div className="text-[#C8C7BA] text-[12px] mt-1">
                      {selectedModel === "horos" ? "per 1M cached tokens" : "per 1M input tokens"}
                    </div>
                  </div>
                  <div className="p-6 lg:px-8 flex flex-col justify-center">
                    <div className="text-[#F0EFE2] font-semibold text-[17px]">
                      {selectedModel === "horos" ? "$0.24" : "$0.27"}
                    </div>
                    <div className="text-[#C8C7BA] text-[12px] mt-1">per 1M output tokens</div>
                  </div>
                  <div className="p-6 lg:px-8 flex flex-col justify-center">
                    <div className="text-[#F0EFE2] font-semibold text-[17px]">1,048,576 <span className="text-[#C8C7BA] text-[12px] font-normal">tokens</span></div>
                    <div className="text-[#C8C7BA] text-[12px] mt-1">Context window</div>
                  </div>
                </div>

                {/* --- ROW 4 --- */}
                <div className="flex items-center p-6 lg:px-8 xl:px-[120px]">
                  <Link href="/horos#horos-model-family" className="inline-flex items-center gap-2 text-[#75bf00] hover:text-[#F0EFE2] transition-colors text-[13px] font-medium group">
                    Explore Horos Foundation Models
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="flex items-center p-6 lg:px-8 xl:px-[120px]">
                  <Link href="/capabilities" className="inline-flex items-center gap-2 text-[#75bf00] hover:text-[#F0EFE2] transition-colors text-[13px] font-medium group">
                    Browse 40+ supported APIs & Models
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Empty Right Margin */}
              <div />

            </div>

            {/* Footer Logos Row */}
            <div className="w-full grid grid-cols-[calc(18%_+_120px)_1fr_calc(18%_+_120px)] relative z-10">
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

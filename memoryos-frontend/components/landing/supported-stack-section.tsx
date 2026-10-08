"use client";

import React from "react";
import { Box, Cpu, Cloud, Settings, Layers, Code, Zap, HardDrive, Database, Server } from "lucide-react";
import {
  QwenLogo, NvidiaLogo, HuggingFaceLogo, MicrosoftLogo, MistralLogo, DeepSeekLogo,
  MetaLogo, OpenAILogo, VLLMLogo, SGLangLogo, ModalLogo, RunPodLogo, HorosLogo, AWSLogo, GoogleLogo,
  OneXLogo, TeslaLogo
} from "@/components/horos/primitives/brand-icons";

export function SupportedStackSection() {
  const models = [
    { category: "IMAGE", name: "Qwen-Image", icon: QwenLogo },
    { category: "EMBED", name: "NV-Embed", icon: NvidiaLogo },
    { category: "TTS", name: "Parler-TTS", icon: HuggingFaceLogo },
    { category: "VIDEO", name: "Cosmos", icon: MicrosoftLogo },
    { category: "VISION", name: "Pixtral", icon: MistralLogo },
    { category: "LLM", name: "DeepSeek-V3", icon: DeepSeekLogo },
    { category: "LLM", name: "Llama-3.1", icon: MetaLogo },
    { category: "AUDIO", name: "Whisper", icon: OpenAILogo },
    { category: "PHYSICAL", name: "1X NEO", icon: OneXLogo },
    { category: "WORLD", name: "FSD v12", icon: TeslaLogo },
  ];

  const engines = [
    { category: "ENGINE", name: "TEI", icon: HuggingFaceLogo },
    { category: "ENGINE", name: "Transformers", icon: HuggingFaceLogo },
    { category: "ENGINE", name: "vLLM", icon: VLLMLogo },
    { category: "ENGINE", name: "SGLang", icon: SGLangLogo },
    { category: "ENGINE", name: "TensorRT-LLM", icon: NvidiaLogo },
    { category: "ENGINE", name: "vLLM Omni", icon: VLLMLogo },
    { category: "ENGINE", name: "Ollama", icon: ({ size }: { size?: number }) => <img src="https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ollama.com/&size=256" width={size} height={size} alt="Ollama" className="rounded-sm object-contain" referrerPolicy="no-referrer" /> },
    { category: "ENGINE", name: "TGI", icon: HuggingFaceLogo },
  ];

  const gpus = [
    { category: "48 GB", name: "L40S", icon: NvidiaLogo },
    { category: "24 GB", name: "RTX 4090", icon: NvidiaLogo },
    { category: "80 GB", name: "A100", icon: NvidiaLogo },
    { category: "80 GB", name: "H100", icon: NvidiaLogo },
    { category: "141 GB", name: "H200", icon: NvidiaLogo },
    { category: "192 GB", name: "B200", icon: NvidiaLogo },
    { category: "24 GB", name: "L4", icon: NvidiaLogo },
    { category: "16 GB", name: "T4", icon: NvidiaLogo },
  ];

  const clouds = [
    { category: "H100", name: "Modal", icon: ModalLogo },
    { category: "A100", name: "RunPod", icon: RunPodLogo },
    { category: "B200", name: "HOROS Cloud", icon: HorosLogo },
    { category: "L40S", name: "AWS", icon: AWSLogo },
    { category: "H200", name: "Azure", icon: MicrosoftLogo },
    { category: "RTX 4090", name: "CoreWeave", icon: ({ size }: { size?: number }) => <img src="https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.coreweave.com/&size=256" width={size} height={size} alt="CoreWeave" className="rounded-[4px] object-contain" referrerPolicy="no-referrer" /> },
    { category: "A100", name: "GCP", icon: GoogleLogo },
    { category: "H100", name: "Lambda", icon: ({ size }: { size?: number }) => <img src="https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://lambdalabs.com/&size=256" width={size} height={size} alt="Lambda" className="rounded-sm object-contain" referrerPolicy="no-referrer" /> },
  ];

  const datacenters = [
    { category: "FACILITY", name: "Data Center", icon: Server },
    { category: "COMPUTE", name: "Bare Metal", icon: HardDrive },
    { category: "COMPUTE", name: "CPU/XPU", icon: Cpu },
    { category: "INFRA", name: "Memory", icon: Database },
    { category: "INFRA", name: "Network & Routing", icon: Zap },
    { category: "INFRA", name: "Storage", icon: Database },
    { category: "SCALE", name: "Kubernetes (K8s)", icon: Layers },
    { category: "SCALE", name: "Scaling", icon: Settings },
  ];

  const edge = [
    { category: "PHYSICAL", name: "Robots & Vehicles", icon: Box },
    { category: "PHYSICAL", name: "Machines", icon: Settings },
    { category: "EDGE", name: "Local Compute", icon: Cpu },
    { category: "EDGE", name: "Gateways", icon: Server },
    { category: "EDGE", name: "Cameras", icon: Zap },
    { category: "EDGE", name: "Sensors", icon: Code },
    { category: "OBSERVE", name: "Telemetry", icon: Database },
    { category: "OBSERVE", name: "Streams", icon: Layers },
  ];

  // Helper to render an infinite scrolling row
  const renderRow = (title: string, items: any[], reverse = false) => {
    return (
      <div className="flex items-center w-full relative mb-4">
        <div className="w-[160px] shrink-0 text-[#C8C7BA] text-[10px] font-mono tracking-widest pl-8 md:pl-12 z-10">
          {title}
        </div>
        <div className="flex-1 overflow-hidden relative flex">
          {/* Gradient masks for smooth fade on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#151515] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#151515] to-transparent z-10 pointer-events-none" />

          <div
            className="flex items-center gap-3 whitespace-nowrap will-change-transform flex-nowrap shrink-0"
            style={{
              animation: `marquee ${reverse ? '30s' : '40s'} linear infinite ${reverse ? 'reverse' : 'normal'}`,
            }}
          >
            {/* Repeat items 3 times for seamless looping */}
            {[...items, ...items, ...items].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-1.5 border border-[#333333] bg-[#1a1a1a] rounded-[4px] shrink-0"
              >
                <div className="text-[#C8C7BA] flex items-center justify-center">
                  <item.icon size={18} />
                </div>
                <span className="text-[#666666] text-[10px] font-bold tracking-wider">{item.category}</span>
                <span className="text-[#F0EFE2] text-[13px] font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full bg-[#151515] py-24 font-sans overflow-hidden flex flex-col items-center">

      {/* Architectural Grid Lines (Aligned with the new 14% and 120px borders) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      {/* CSS Animation defined inline to ensure it works without tailwind config changes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}} />

      {/* Header Section */}
      <div className="text-center mb-16 px-4 relative z-10">
        <h2 className="text-4xl md:text-5xl font-medium text-[#F0EFE2] tracking-tight mb-6">
          <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm inline-block leading-tight font-bold">Own</span> the winning stack before you ship
        </h2>
        <p className="text-[#C8C7BA] text-[19px] font-medium max-w-lg mx-auto">
          Not a black box. You get the measured stack to run, deploy, or export.
        </p>
      </div>

      {/* Sub Header */}
      <div className="text-center mb-10 px-4 relative z-10">
        <h3 className="text-[#F0EFE2] text-lg font-semibold mb-2">Supported across the stack</h3>
        <p className="text-[#666] text-[19px] font-medium max-w-xl mx-auto leading-relaxed">
          Open models, serving engines, GPUs, and the clouds you deploy to. HOROS supports every layer of the inference stack.
        </p>
      </div>

      {/* Scrolling Rows */}
      <div className="w-[calc(64%_-_240px)] mx-auto relative z-10 mt-6 flex flex-col gap-1">
        {renderRow("MODELS", models, false)}
        {renderRow("ENGINES", engines, true)}
        {renderRow("GPUS", gpus, false)}
        {renderRow("CLOUDS", clouds, true)}
        {renderRow("DATACENTER", datacenters, false)}
        {renderRow("EDGE", edge, true)}
      </div>

    </section>
  );
}

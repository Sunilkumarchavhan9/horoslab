"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { EpochLogo } from "@/components/epoch/primitives/epoch-logo";
import { 
  QwenLogo, 
  DeepSeekLogo, 
  MetaLogo, 
  MistralLogo, 
  NvidiaLogo, 
  MicrosoftLogo, 
  OneXLogo,
  HuggingFaceLogo,
  OpenAILogo,
  AnthropicLogo,
  GoogleLogo,
  TeslaLogo,
  BAAILogo,
  FluxLogo,
  DiffusersLogo,
  K8sFaviconLogo,
  GithubLogo,
  VLLMLogo
} from "@/components/epoch/primitives/brand-icons";

interface LandingNavbarProps {
  onOpenDashboard?: () => void;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  dark?: boolean;
}

export function LandingNavbar({
  onOpenDashboard,
  onOpenSignIn,
  onOpenSignUp,
  dark = true,
}: LandingNavbarProps) {
  const [useCasesOpen, setUseCasesOpen] = useState(false);
  const [infrastructureOpen, setInfrastructureOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-[100] border-b border-dashed border-[#333333] bg-[#151515]/90 backdrop-blur-md font-mono text-xs text-[#F0EFE2]">
      
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee-nav {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />

      {/* Animated Marquee Background */}
      <div className="absolute inset-0 z-0 flex items-center overflow-hidden pointer-events-none opacity-60">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#151515] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#151515] to-transparent z-10" />
        
        <div 
          className="flex items-center gap-4 whitespace-nowrap will-change-transform"
          style={{ animation: 'marquee-nav 400s linear infinite' }}
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 shrink-0">
              {Array(16).fill([
                { name: "Qwen3-1.7B", detail: "1.7B", val: "526", icon: QwenLogo },
                { name: "Ornith-1.0-9B", detail: "H100", val: "3.9M", icon: HuggingFaceLogo },
                { name: "DeepSeek-V3", detail: "FP8", val: "1.2M", icon: DeepSeekLogo },
                { name: "Llama-3.1-405B", detail: "H200", val: "892", icon: MetaLogo },
                { name: "Pixtral-12B", detail: "Vision", val: "450", icon: MistralLogo },
                { name: "Mistral-Large", detail: "V2", val: "120", icon: MistralLogo },
                { name: "GPT-4o", detail: "Omni", val: "12k", icon: OpenAILogo },
                { name: "Claude-3.5", detail: "Sonnet", val: "8k", icon: AnthropicLogo },
                { name: "Gemini-1.5", detail: "Pro", val: "2M", icon: GoogleLogo },
                { name: "NV-Embed-v2", detail: "Embed", val: "18k", icon: NvidiaLogo },
                { name: "Cosmos-1.0", detail: "Video", val: "90", icon: MicrosoftLogo },
                { name: "1X NEO", detail: "Physical", val: "12", icon: OneXLogo },
                { name: "FSD v12", detail: "World", val: "36", icon: TeslaLogo },
                { name: "BGE-M3", detail: "Embed", val: "8k", icon: BAAILogo },
                { name: "FLUX.1", detail: "Image", val: "4 steps", icon: FluxLogo },
                { name: "Stable-Diff", detail: "Video", val: "24", icon: DiffusersLogo }
              ]).flat().map((item, j) => (
                <div key={j} className="flex items-center gap-3 px-3 py-1.5 rounded-[4px]">
                  <div className="flex items-center justify-center text-[#C8C7BA]">
                    <item.icon size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#C8C7BA] leading-tight">{item.name}</span>
                    <div className="flex items-center gap-1.5 text-[9px] text-[#666] leading-tight">
                      <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-[#75bf00]" /> {item.detail}</span>
                      <span>↓ {item.val}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full grid grid-cols-[14%_72%_14%] h-14 relative z-10">
        <div />
        <div className="flex items-center justify-between w-full bg-[#151515] shadow-[0_0_20px_10px_rgba(21,21,21,1)]">
          {/* Left: Official Vector Brand Logo */}
        <div className="flex items-center shrink-0 h-14 border-l border-dashed border-[#333333] pl-3 pr-2">
          <Link href="/" className="flex items-center group shrink-0 whitespace-nowrap">
            <EpochLogo variant="full" size="xl" className="h-[50px] w-auto text-[#F0EFE2]" />
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7 text-[#cccccc] whitespace-nowrap">
          {/* Use cases dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUseCasesOpen(!useCasesOpen);
                setInfrastructureOpen(false);
                setResourcesOpen(false);
              }}
              className="flex items-center gap-1 hover:text-[#F0EFE2] transition-colors cursor-pointer py-1 whitespace-nowrap"
            >
              <span>Use cases</span>
              <ChevronDown size={11} className="text-[#666]" />
            </button>

            {useCasesOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[720px] border border-dashed border-[#333] bg-[#151515] shadow-2xl z-50 text-left font-sans grid grid-cols-3 whitespace-normal">
                {[
                  {
                    title: "Voice agent",
                    desc: "Whisper, Llama, and GPU scheduling in one recipe.",
                    icons: [OpenAILogo, MetaLogo, NvidiaLogo],
                    href: "/use-cases/voice-agent"
                  },
                  {
                    title: "AI assistant",
                    desc: "Llama, Hermes, and Qwen with tools.",
                    icons: [QwenLogo, MetaLogo, NvidiaLogo],
                    href: "/use-cases/ai-assistant"
                  },
                  {
                    title: "Embeddings",
                    desc: "BGE encoders plus reranker on one server.",
                    icons: [BAAILogo, NvidiaLogo],
                    href: "/use-cases/embeddings"
                  },
                  {
                    title: "RAG search",
                    desc: "BGE embeddings with rerank in the loop.",
                    icons: [BAAILogo, HuggingFaceLogo],
                    href: "/use-cases/rag-search"
                  },
                  {
                    title: "Document AI",
                    desc: "Qwen2.5-VL and Llama 3.2 Vision to JSON.",
                    icons: [QwenLogo, MetaLogo],
                    href: "/use-cases/document-ai"
                  },
                  {
                    title: "Transcription",
                    desc: "Whisper plus diarization and PII redaction.",
                    icons: [OpenAILogo, NvidiaLogo],
                    href: "/use-cases/transcription"
                  },
                  {
                    title: "Synthetic Data Factory",
                    desc: "Auto-generate data to fine-tune models.",
                    icons: [MetaLogo, HuggingFaceLogo],
                    href: "/use-cases/teaching-data-factory"
                  },
                  {
                    title: "Simulation & World Models",
                    desc: "Replay and predict physical dynamics.",
                    icons: [GoogleLogo, NvidiaLogo],
                    href: "/use-cases/simulation-world-models"
                  },
                  {
                    title: "Continuous Auto-Diagnosis",
                    desc: "Deploy agents to self-heal infrastructure.",
                    icons: [GithubLogo, K8sFaviconLogo],
                    href: "/use-cases/continuous-auto-diagnosis"
                  },
                  {
                    title: "Autonomous Software Engineers",
                    desc: "Agents that autonomously write and test code.",
                    icons: [GithubLogo, MetaLogo],
                    href: "/use-cases/autonomous-software-engineers"
                  },
                  {
                    title: "Verifiable Legal Agents",
                    desc: "Verifiable proofs for zero-hallucination AI.",
                    icons: [OpenAILogo, NvidiaLogo],
                    href: "/use-cases/verifiable-legal-agents"
                  },
                  {
                    title: "Automated Scientific Discoverers",
                    desc: "Agents that run massive physics simulations.",
                    icons: [HuggingFaceLogo, MetaLogo],
                    href: "/use-cases/automated-scientific-discoverers"
                  },
                  {
                    title: "Decoding Physical Reality",
                    desc: "Process sensor streams to teach AI models.",
                    icons: [DeepSeekLogo, NvidiaLogo],
                    href: "/use-cases/decoding-physical-reality"
                  },
                  {
                    title: "Generative Video & Physics",
                    desc: "Synthesize physical worlds to train models.",
                    icons: [GoogleLogo, MetaLogo],
                    href: "/use-cases/generative-video-and-physics"
                  },

                  {
                    title: "Embodied Humanoid Robots",
                    desc: "Low-latency brains for humanoid robots.",
                    icons: [NvidiaLogo, MetaLogo],
                    href: "/use-cases/embodied-humanoid-robots"
                  }
                ].map((uc, i) => {
                  const content = (
                    <>
                      <div className="flex items-center w-fit border border-dashed border-[#333] p-[3px] gap-[3px] rounded-sm group-hover:border-[#555] transition-colors relative z-10">
                        {uc.icons.map((Icon, idx) => (
                          <div key={idx} className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm group-hover:border-[#555] transition-colors">
                            <Icon size={14} />
                          </div>
                        ))}
                      </div>
                      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={16} className="text-[#75bf00]" />
                      </div>
                      <div className="flex flex-col gap-1 mt-auto relative z-10">
                        <div className="font-medium text-[14px] text-[#F0EFE2] tracking-tight w-fit px-1 -ml-1 group-hover:bg-[#75bf00] group-hover:text-black transition-colors">
                          {uc.title}
                        </div>
                        <div className="text-[12px] text-[#C8C7BA] group-hover:text-[#e5e5e5] transition-colors leading-snug pr-2">
                          {uc.desc}
                        </div>
                      </div>
                    </>
                  );

                  const commonClasses = `relative min-h-[140px] p-5 hover:bg-[#161616] cursor-pointer transition-colors group flex flex-col gap-3 ${i % 3 !== 2 ? "border-r border-dashed border-[#333]" : ""} ${i < 12 ? "border-b border-dashed border-[#333]" : ""}`;

                  if (uc.href) {
                    return (
                      <Link 
                        key={uc.title} 
                        href={uc.href} 
                        onClick={() => setUseCasesOpen(false)}
                        className={commonClasses}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={uc.title}
                      onClick={() => setUseCasesOpen(false)}
                      className={commonClasses}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Infrastructure/Platform dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setInfrastructureOpen(!infrastructureOpen);
                setUseCasesOpen(false);
                setResourcesOpen(false);
              }}
              className="flex items-center gap-1 hover:text-[#F0EFE2] transition-colors cursor-pointer py-1 whitespace-nowrap"
            >
              <span>Platform</span>
              <ChevronDown size={11} className="text-[#666]" />
            </button>

            {infrastructureOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[720px] border border-dashed border-[#333] bg-[#151515] shadow-2xl z-50 text-left font-sans grid grid-cols-3 whitespace-normal">
                {[
                  {
                    title: "Embodied AI & Robotics",
                    desc: "LiDAR, IMU, and vehicle sensor perception on the edge.",
                    icons: [DeepSeekLogo, NvidiaLogo]
                  },
                  {
                    title: "Datacenter Automation",
                    desc: "Liquid cooling, power states, and PUE optimization at scale.",
                    icons: [NvidiaLogo, K8sFaviconLogo]
                  },
                  {
                    title: "Multi-Model Inference",
                    desc: "Seamlessly route between Llama 3, Qwen 2, and DeepSeek.",
                    icons: [MetaLogo, QwenLogo, DeepSeekLogo]
                  },
                  {
                    title: "Agentic System Repair",
                    desc: "Auto-remediating cloud pipelines and self-healing infrastructure.",
                    icons: [GithubLogo, HuggingFaceLogo]
                  },
                  {
                    title: "Video & Telemetry",
                    desc: "Process Cosmos and NV-Embed streams for continuous observation.",
                    icons: [MicrosoftLogo, NvidiaLogo]
                  },
                  {
                    title: "Hardware Scheduling",
                    desc: "Dynamic GPU/XPU binpacking for TRT-LLM and vLLM runtimes.",
                    icons: [VLLMLogo, NvidiaLogo]
                  },
                ].map((uc, i) => (
                  <div
                    key={uc.title}
                    onClick={() => setInfrastructureOpen(false)}
                    className={`relative min-h-[140px] p-5 hover:bg-[#161616] cursor-pointer transition-colors group flex flex-col gap-3 ${i % 3 !== 2 ? "border-r border-dashed border-[#333]" : ""} ${i < 3 ? "border-b border-dashed border-[#333]" : ""}`}
                  >
                    <div className="flex items-center w-fit border border-dashed border-[#333] p-[3px] gap-[3px] rounded-sm group-hover:border-[#555] transition-colors relative z-10">
                      {uc.icons.map((Icon, idx) => (
                        <div key={idx} className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm group-hover:border-[#555] transition-colors">
                          <Icon size={14} />
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={16} className="text-[#75bf00]" />
                    </div>
                    <div className="flex flex-col gap-1 mt-auto relative z-10">
                      <div className="font-medium text-[14px] text-[#F0EFE2] tracking-tight w-fit px-1 -ml-1 group-hover:bg-[#75bf00] group-hover:text-black transition-colors">
                        {uc.title}
                      </div>
                      <div className="text-[12px] text-[#C8C7BA] group-hover:text-[#e5e5e5] transition-colors leading-snug pr-2">{uc.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link href="#model-apis" className="flex items-center gap-1.5 hover:text-[#F0EFE2] transition-colors whitespace-nowrap">
            <span>Model APIs</span>
            <span className="bg-[#75bf00] text-black text-[9px] font-black px-1.5 py-0.2 rounded-xs tracking-tight whitespace-nowrap">
              NEW
            </span>
          </Link>

          <Link href="#pricing" className="hover:text-[#F0EFE2] transition-colors whitespace-nowrap">
            Pricing
          </Link>

          <Link href="#research" className="hover:text-[#F0EFE2] transition-colors whitespace-nowrap">
            Research
          </Link>

          {/* Resources dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setResourcesOpen(!resourcesOpen);
                setUseCasesOpen(false);
              }}
              className="flex items-center gap-1 hover:text-[#F0EFE2] transition-colors cursor-pointer py-1 whitespace-nowrap"
            >
              <span>Resources</span>
              <ChevronDown size={11} className="text-[#666]" />
            </button>

            {resourcesOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 border border-[#2a2a2a] bg-[#141414] p-2 rounded-xs shadow-2xl space-y-1 z-50 text-left font-sans">
                {[
                  { title: "Documentation", desc: "Architecture & API references" },
                  { title: "Benchmarks", desc: "Empirical latency & throughput data" },
                  { title: "OpenTelemetry", desc: "Trace ingestion & metrics" },
                ].map((res) => (
                  <div
                    key={res.title}
                    onClick={() => setResourcesOpen(false)}
                    className="p-2 hover:bg-[#202020] rounded-xs cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-xs text-[#F0EFE2]">{res.title}</div>
                    <div className="text-[10px] text-[#788274] mt-0.5">{res.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link href="#contact" className="hover:text-[#F0EFE2] transition-colors whitespace-nowrap">
            Contact
          </Link>
        </nav>

        {/* Right Actions: Sign in & Get started (Desktop & Mobile) */}
        <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap h-14 border-r border-dashed border-[#333333] pr-3">
          <button
            type="button"
            onClick={onOpenSignIn || onOpenDashboard}
            className="hidden sm:flex items-center gap-1 border border-[#2a2a2a] bg-[#161616] hover:border-[#444] text-[#cccccc] hover:text-[#F0EFE2] px-3.5 py-1.5 rounded-xs transition-colors cursor-pointer text-xs whitespace-nowrap"
          >
            <span>Sign in</span>
          </button>

          <button
            type="button"
            onClick={onOpenSignUp || onOpenDashboard}
            className="flex items-center gap-1 bg-[#75bf00] hover:bg-[#86dc00] text-black font-extrabold px-3 py-1.5 rounded-xs transition-all cursor-pointer text-xs whitespace-nowrap shadow-sm"
          >
            <span>Get started</span>
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#aaa] hover:text-[#F0EFE2] bg-[#1c1c1c] border border-[#2a2a2a] rounded-xs cursor-pointer ml-1"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
        </div>
        <div />
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#282828] bg-[#141414] px-4 py-4 space-y-3 font-mono text-xs">
          <div className="flex flex-col space-y-2.5">
            <Link
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2]"
            >
              Use cases
            </Link>
            <Link
              href="#model-apis"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2] flex items-center justify-between"
            >
              <span>Model APIs</span>
              <span className="bg-[#75bf00] text-black text-[9px] font-black px-1.5 py-0.2 rounded-xs">
                NEW
              </span>
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2]"
            >
              Pricing
            </Link>
            <Link
              href="#research"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2]"
            >
              Research
            </Link>

            <div className="pt-2 border-t border-[#222] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenSignIn) onOpenSignIn();
                }}
                className="flex-1 py-2 text-center bg-[#1e1e1e] border border-[#333] text-[#F0EFE2] rounded-xs"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenSignUp) onOpenSignUp();
                }}
                className="flex-1 py-2 text-center bg-[#75bf00] text-black font-extrabold rounded-xs"
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

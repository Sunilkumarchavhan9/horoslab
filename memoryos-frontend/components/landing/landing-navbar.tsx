"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, ArrowUpRight, Menu, X, Box, Calculator, BookOpen, Clock, Rocket, Newspaper } from "lucide-react";
import HorosLogo from "@/components/horos/primitives/horos-logo";
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
} from "@/components/horos/primitives/brand-icons";

interface LandingNavbarProps {
  onOpenDashboard?: () => void;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onOpenFoundingCohort?: () => void;
  dark?: boolean;
}

export function LandingNavbar({
  onOpenDashboard,
  onOpenSignIn,
  onOpenSignUp,
  onOpenFoundingCohort,
  dark = true,
}: LandingNavbarProps) {
  const [useCasesOpen, setUseCasesOpen] = useState(false);
  const [infrastructureOpen, setInfrastructureOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Pre-launch Announcement Banner */}
      <div
        className={`fixed top-0 left-0 right-0 z-[101] bg-[#151515] border-b border-dashed border-[#333333] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? "-translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="h-[34px] px-4 flex items-center justify-center">
          <Link
            href="/pricing?apply=founding"
            onClick={(e) => {
              if (onOpenFoundingCohort) {
                e.preventDefault();
                onOpenFoundingCohort();
              }
            }}
            className="group inline-flex items-center gap-1.5 text-xs text-[#b8b7a9] hover:text-[#F0EFE2] transition-colors cursor-pointer"
          >
            <span className="font-normal">
              Founding compute cohort is open.
            </span>
            <span className="text-[#76b900] font-medium inline-flex items-center gap-1 group-hover:underline ml-1">
              Apply now
              <ArrowRight size={12} strokeWidth={2.5} className="text-[#76b900] transition-transform group-hover:translate-x-0.5 shrink-0" />
            </span>
          </Link>
        </div>
      </div>

      <header className={`fixed left-0 right-0 z-[100] font-sans antialiased tracking-tight text-sm text-[#F0EFE2] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled
        ? "top-4 mx-auto w-[96%] max-w-[1600px] border border-dashed border-[#555] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] bg-[#151515]/95 backdrop-blur-xl"
        : "top-[34px] w-full border-b border-dashed border-[#333333] bg-[#151515]/90 backdrop-blur-md"
        }`}>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee-nav {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />

      {/* Animated Marquee Background */}
      <div className={`absolute inset-0 z-0 flex items-center pointer-events-none opacity-60 transition-all duration-500 overflow-hidden`}>
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
                    <span className="text-xs font-bold text-[#C8C7BA] leading-tight">{item.name}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#666] leading-tight">
                      <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-[#75bf00]" /> {item.detail}</span>
                      <span className="font-semibold text-[#888]">↓ {item.val}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex justify-center h-14 relative z-10 pointer-events-none">
        <div className="flex items-center justify-between w-[96%] sm:w-[96%] md:w-[calc(72%_-_240px)] lg:w-[calc(64%_-_240px)] bg-[#151515] shadow-[0_0_20px_10px_rgba(21,21,21,1)] border-x border-dashed border-[#333333] pointer-events-auto px-3 sm:px-4 lg:px-4">
          {/* Left: Official Vector Brand Logo */}
          <div className="flex items-center shrink-0 h-14 mr-4 xl:mr-7">
            <Link href="/" className="flex items-center group shrink-0 whitespace-nowrap">
              <HorosLogo variant="wordmark" size="xl" className="text-[#F0EFE2]" />
            </Link>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-3 xl:gap-5 text-[#F0EFE2] font-medium whitespace-nowrap text-xs">
            {/* Use cases dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setUseCasesOpen(true)}
              onMouseLeave={() => setUseCasesOpen(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setUseCasesOpen(!useCasesOpen);
                  setInfrastructureOpen(false);
                  setResourcesOpen(false);
                }}
                className="flex items-center gap-1 transition-colors cursor-pointer py-1 whitespace-nowrap"
              >
                <span>Use cases</span>
                <ChevronDown size={11} className="text-[#666]" />
              </button>

              {useCasesOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[720px] border border-dashed border-[#333] bg-[#151515] shadow-2xl z-50 text-left font-sans grid grid-cols-3 whitespace-normal">
                  {[
                    {
                      title: "Voice AI",
                      desc: "Speech recognition, perception, and generation.",
                      icons: [OpenAILogo, QwenLogo, NvidiaLogo],
                      href: "/use-cases/voice-ai"
                    },
                    {
                      title: "Language Models",
                      desc: "Instruction following, dialogue, and tool use.",
                      icons: [MetaLogo, QwenLogo, MistralLogo],
                      href: "/use-cases/language-models"
                    },
                    {
                      title: "Code Intelligence",
                      desc: "Code generation, debugging, and verification.",
                      icons: [QwenLogo, DeepSeekLogo, MistralLogo],
                      href: "/use-cases/code-intelligence"
                    },
                    {
                      title: "Research AI",
                      desc: "Research, experiments, and model development.",
                      icons: [DeepSeekLogo, QwenLogo, MistralLogo],
                      href: "/use-cases/research-ai"
                    },
                    {
                      title: "Vision AI",
                      desc: "Visual understanding, objects, and motion.",
                      icons: [QwenLogo, MetaLogo, NvidiaLogo],
                      href: "/use-cases/vision-ai"
                    },
                    {
                      title: "Multimodal AI",
                      desc: "Reason across text, images, audio, and video.",
                      icons: [QwenLogo, MetaLogo, MistralLogo],
                      href: "/use-cases/multimodal-ai"
                    },
                    {
                      title: "Reasoning AI",
                      desc: "Solve difficult problems with measurable correctness.",
                      icons: [DeepSeekLogo, QwenLogo, MistralLogo],
                      href: "/use-cases/reasoning-ai"
                    },
                    {
                      title: "World Models",
                      desc: "Predict physical dynamics and future states.",
                      icons: [NvidiaLogo, GoogleLogo, MetaLogo],
                      href: "/use-cases/world-models"
                    },
                    {
                      title: "Engineering Intelligence",
                      desc: "Solve complex engineering and optimization problems.",
                      icons: [QwenLogo, MetaLogo, NvidiaLogo],
                      href: "/use-cases/engineering-intelligence"
                    },
                    {
                      title: "Autonomous Agents",
                      desc: "Agents that plan, use tools, execute tasks, and adapt from feedback.",
                      icons: [MetaLogo, QwenLogo, DeepSeekLogo],
                      href: "/use-cases/autonomous-agents"
                    },
                    {
                      title: "Autonomous Systems",
                      desc: "Systems that perceive, decide, and act.",
                      icons: [NvidiaLogo, MetaLogo, QwenLogo],
                      href: "/use-cases/autonomous-systems"
                    },
                    {
                      title: "Scientific AI",
                      desc: "Scientific modeling, simulation, and discovery.",
                      icons: [DeepSeekLogo, QwenLogo, NvidiaLogo],
                      href: "/use-cases/scientific-ai"
                    },
                    {
                      title: "Physical AI",
                      desc: "Learn and predict how the physical world behaves.",
                      icons: [NvidiaLogo, QwenLogo, MetaLogo],
                      href: "/use-cases/physical-ai"
                    },
                    {
                      title: "Synthetic Reality",
                      desc: "Generate environments for training and evaluation.",
                      icons: [NvidiaLogo, GoogleLogo, MetaLogo],
                      href: "/use-cases/synthetic-reality"
                    },
                    {
                      title: "Robotics",
                      desc: "Deploy and evaluate intelligence on robots.",
                      icons: [NvidiaLogo, GoogleLogo],
                      href: "/use-cases/robotics"
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
                          onClick={() => setTimeout(() => setUseCasesOpen(false), 100)}
                          className={commonClasses}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={uc.title}
                        onClick={() => setTimeout(() => setUseCasesOpen(false), 100)}
                        className={commonClasses}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>



            <Link href="/pricing" className="transition-colors whitespace-nowrap">
              Pricing
            </Link>

            <Link href="#research" className="transition-colors whitespace-nowrap">
              Research
            </Link>

            {/* Resources dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setResourcesOpen(!resourcesOpen);
                  setUseCasesOpen(false);
                  setInfrastructureOpen(false);
                }}
                className="flex items-center gap-1 transition-colors cursor-pointer py-1 whitespace-nowrap"
              >
                <span>Resources</span>
                <ChevronDown size={11} className="text-[#666]" />
              </button>

              {resourcesOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 xl:left-0 xl:translate-x-0 top-full mt-2 w-[720px] xl:-ml-48 border border-dashed border-[#333] bg-[#151515] shadow-2xl z-50 text-left font-sans grid grid-cols-3 whitespace-normal">
                  {[
                    {
                      title: "Capabilities Graph",
                      desc: "Discover supported models, runtimes, and physical sensors.",
                      icon: <Box size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
                      href: "/capabilities"
                    },
                    {
                      title: "Economics & Cost",
                      desc: "Analyze TCO, $/request, and data center power projections.",
                      icon: <Calculator size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
                      href: "/economics"
                    },
                    {
                      title: "Documentation",
                      desc: "Core architecture, execution APIs, and adapter schemas.",
                      icon: <BookOpen size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
                      href: "#documentation"
                    },
                    {
                      title: "Changelog",
                      desc: "Continuous updates to the Reality Intelligence Runtime.",
                      icon: <Clock size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
                      href: "#changelog"
                    },
                    {
                      title: "Startups & Scaleups",
                      desc: "Execution credits, plus hands-on integration engineering.",
                      icon: <Rocket size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
                      href: "#startups-scaleups"
                    },
                    {
                      title: "Research & Evidence",
                      desc: "Empirical benchmarks and intelligence evolution papers.",
                      icon: <Newspaper size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
                      href: "#research-evidence"
                    },
                  ].map((res, i) => (
                    <Link
                      key={res.title}
                      href={res.href}
                      onClick={() => setTimeout(() => setResourcesOpen(false), 150)}
                      className={`relative min-h-[140px] p-6 hover:bg-[#1a1a1a] cursor-pointer transition-colors group flex flex-col gap-4 ${i % 3 !== 2 ? "border-r border-dashed border-[#333]" : ""} ${i < 3 ? "border-b border-dashed border-[#333]" : ""}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 border border-dashed border-[#444] rounded-[2px] bg-[#111] group-hover:border-[#666] transition-colors">
                        {res.icon}
                      </div>
                      <div className="flex flex-col gap-1.5 mt-auto">
                        <div className="font-bold text-[14px] text-[#F0EFE2] tracking-tight group-hover:text-[#75bf00] transition-colors">
                          {res.title}
                        </div>
                        <div className="text-[12px] text-[#999] leading-snug group-hover:text-[#ccc] transition-colors">
                          {res.desc}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/horos" className="transition-colors whitespace-nowrap flex items-center gap-1.5">
              HOROS
              <span className="bg-[#C3C2B6] text-black text-[9px] font-medium px-1.5 py-0.2 rounded-xs tracking-tight whitespace-nowrap">
                NEW
              </span>
            </Link>

            <Link href="#contact" className="transition-colors whitespace-nowrap mr-1 xl:mr-2">
              Contact
            </Link>
          </nav>

          {/* Right Actions: Sign in & Get started (Desktop & Mobile) */}
          <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap h-14 pl-1 ml-2 xl:ml-4">
            <button
              type="button"
              onClick={onOpenSignUp || onOpenDashboard}
              className="hidden sm:flex items-center justify-center gap-1 border border-[#2a2a2a] bg-[#161616] hover:border-[#444] text-[#cccccc] hover:text-[#F0EFE2] px-5 py-2 min-h-[34px] rounded-xs transition-colors cursor-pointer text-xs sm:text-[13px] font-semibold whitespace-nowrap"
            >
              <span>Sign up</span>
            </button>

            <button
              type="button"
              onClick={onOpenSignIn || onOpenDashboard}
              className="flex items-center justify-center gap-1 bg-[#75bf00] hover:bg-[#86dc00] text-black font-semibold px-5 py-2 min-h-[34px] rounded-xs transition-all cursor-pointer text-xs sm:text-[13px] whitespace-nowrap shadow-sm"
            >
              <span>Demo</span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 text-[#aaa] hover:text-[#F0EFE2] bg-[#1c1c1c] border border-[#2a2a2a] rounded-xs cursor-pointer ml-1"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        <div />
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-[#282828] bg-[#141414] px-4 py-4 space-y-3 font-sans tracking-tight text-sm font-medium">
          <div className="flex flex-col space-y-2.5">
            <Link
              href="#use-cases"
              onClick={() => setTimeout(() => setMobileMenuOpen(false), 150)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2]"
            >
              Use cases
            </Link>

            <Link
              href="/pricing"
              onClick={() => setTimeout(() => setMobileMenuOpen(false), 150)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2]"
            >
              Pricing
            </Link>
            <Link
              href="/horos"
              onClick={() => setTimeout(() => setMobileMenuOpen(false), 150)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2] flex items-center justify-between"
            >
              <span>HOROS</span>
              <span className="bg-[#C3C2B6] text-black text-[9px] font-medium px-1.5 py-0.2 rounded-xs">
                NEW
              </span>
            </Link>

            <Link
              href="#research"
              onClick={() => setTimeout(() => setMobileMenuOpen(false), 150)}
              className="py-1 text-[#C8C7BA] hover:text-[#F0EFE2]"
            >
              Research
            </Link>

            <div className="pt-2 border-t border-[#222] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenSignUp) onOpenSignUp();
                }}
                className="flex-1 py-2 text-center bg-[#1e1e1e] border border-[#333] text-[#F0EFE2] rounded-xs"
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenSignIn) onOpenSignIn();
                }}
                className="flex-1 py-2 text-center bg-[#75bf00] text-black font-extrabold rounded-xs"
              >
                Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}

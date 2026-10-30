"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "@/components/horos/primitives/brand-icons";

interface LandingNavbarProps {
  onOpenDashboard?: () => void;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onOpenFoundingCohort?: () => void;
  dark?: boolean;
}

const USE_CASES = [
  {
    title: "Voice AI",
    desc: "Speech recognition, perception, and generation.",
    icons: [OpenAILogo, QwenLogo, NvidiaLogo],
    href: "/use-cases/voice-ai",
  },
  {
    title: "Language Models",
    desc: "Instruction following, dialogue, and tool use.",
    icons: [MetaLogo, QwenLogo, MistralLogo],
    href: "/use-cases/language-models",
  },
  {
    title: "Code Intelligence",
    desc: "Code generation, debugging, and verification.",
    icons: [QwenLogo, DeepSeekLogo, MistralLogo],
    href: "/use-cases/code-intelligence",
  },
  {
    title: "Research AI",
    desc: "Research, experiments, and model development.",
    icons: [DeepSeekLogo, QwenLogo, MistralLogo],
    href: "/use-cases/research-ai",
  },
  {
    title: "Vision AI",
    desc: "Visual understanding, objects, and motion.",
    icons: [QwenLogo, MetaLogo, NvidiaLogo],
    href: "/use-cases/vision-ai",
  },
  {
    title: "Multimodal AI",
    desc: "Reason across text, images, audio, and video.",
    icons: [QwenLogo, MetaLogo, MistralLogo],
    href: "/use-cases/multimodal-ai",
  },
  {
    title: "Reasoning AI",
    desc: "Solve difficult problems with measurable correctness.",
    icons: [DeepSeekLogo, QwenLogo, MistralLogo],
    href: "/use-cases/reasoning-ai",
  },
  {
    title: "World Models",
    desc: "Predict physical dynamics and future states.",
    icons: [NvidiaLogo, GoogleLogo, MetaLogo],
    href: "/use-cases/world-models",
  },
  {
    title: "Engineering Intelligence",
    desc: "Solve complex engineering and optimization problems.",
    icons: [QwenLogo, MetaLogo, NvidiaLogo],
    href: "/use-cases/engineering-intelligence",
  },
  {
    title: "Autonomous Agents",
    desc: "Agents that plan, use tools, execute tasks, and adapt from feedback.",
    icons: [MetaLogo, QwenLogo, DeepSeekLogo],
    href: "/use-cases/autonomous-agents",
  },
  {
    title: "Autonomous Systems",
    desc: "Systems that perceive, decide, and act.",
    icons: [NvidiaLogo, MetaLogo, QwenLogo],
    href: "/use-cases/autonomous-systems",
  },
  {
    title: "Scientific AI",
    desc: "Scientific modeling, simulation, and discovery.",
    icons: [DeepSeekLogo, QwenLogo, NvidiaLogo],
    href: "/use-cases/scientific-ai",
  },
  {
    title: "Physical AI",
    desc: "Learn and predict how the physical world behaves.",
    icons: [NvidiaLogo, QwenLogo, MetaLogo],
    href: "/use-cases/physical-ai",
  },
  {
    title: "Synthetic Reality",
    desc: "Generate environments for training and evaluation.",
    icons: [NvidiaLogo, GoogleLogo, MetaLogo],
    href: "/use-cases/synthetic-reality",
  },
  {
    title: "Robotics",
    desc: "Deploy and evaluate intelligence on robots.",
    icons: [NvidiaLogo, GoogleLogo],
    href: "/use-cases/robotics",
  },
];

const RESOURCES = [
  {
    title: "Capabilities Graph",
    desc: "Discover supported models, runtimes, and physical sensors.",
    icon: <Box size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
    href: "/capabilities",
  },
  {
    title: "Economics & Cost",
    desc: "Analyze TCO, $/request, and data center power projections.",
    icon: <Calculator size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
    href: "/economics",
  },
  {
    title: "Documentation",
    desc: "Core architecture, execution APIs, and adapter schemas.",
    icon: <BookOpen size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
    href: "#documentation",
  },
  {
    title: "Changelog",
    desc: "Continuous updates to the Reality Intelligence Runtime.",
    icon: <Clock size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
    href: "#changelog",
  },
  {
    title: "Startups & Scaleups",
    desc: "Execution credits, plus hands-on integration engineering.",
    icon: <Rocket size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
    href: "#startups-scaleups",
  },
  {
    title: "Research & Evidence",
    desc: "Empirical benchmarks and intelligence evolution papers.",
    icon: <Newspaper size={16} className="text-[#888] group-hover:text-[#F0EFE2] transition-colors" />,
    href: "#research-evidence",
  },
];

export function LandingNavbar({
  onOpenDashboard,
  onOpenSignIn,
  onOpenSignUp,
  onOpenFoundingCohort,
  dark = true,
}: LandingNavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<"use-cases" | "resources" | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUseCasesOpen, setMobileUseCasesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside and Esc key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setIsPinned(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setIsPinned(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (menu: "use-cases" | "resources") => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    if (isPinned) return; // Keep open if pinned by click
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const handleTriggerClick = (e: React.MouseEvent, menu: "use-cases" | "resources") => {
    e.stopPropagation();
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (activeDropdown === menu && isPinned) {
      // Toggle close
      setActiveDropdown(null);
      setIsPinned(false);
    } else {
      // Open and pin
      setActiveDropdown(menu);
      setIsPinned(true);
    }
  };

  const handleItemClick = () => {
    setActiveDropdown(null);
    setIsPinned(false);
    setMobileMenuOpen(false);
    setMobileUseCasesOpen(false);
    setMobileResourcesOpen(false);
  };

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
            <span className="font-normal">Founding compute cohort is open.</span>
            <span className="text-[#76b900] font-medium inline-flex items-center gap-1 group-hover:underline ml-1">
              Apply now
              <ArrowRight
                size={12}
                strokeWidth={2.5}
                className="text-[#76b900] transition-transform group-hover:translate-x-0.5 shrink-0"
              />
            </span>
          </Link>
        </div>
      </div>

      <header
        ref={navbarRef}
        className={`fixed left-0 right-0 z-[100] font-sans antialiased tracking-tight text-sm text-[#F0EFE2] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? "top-4 mx-auto w-[96%] max-w-[1600px] border border-dashed border-[#555] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] bg-[#151515]/95 backdrop-blur-xl"
            : "top-[34px] w-full border-b border-dashed border-[#333333] bg-[#151515]/90 backdrop-blur-md"
        }`}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
        @keyframes marquee-nav {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `,
          }}
        />

        {/* Animated Marquee Background */}
        <div
          className={`absolute inset-0 z-0 flex items-center pointer-events-none opacity-60 transition-all duration-500 overflow-hidden`}
        >
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#151515] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#151515] to-transparent z-10" />

          <div
            className="flex items-center gap-4 whitespace-nowrap will-change-transform"
            style={{ animation: "marquee-nav 400s linear infinite" }}
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 shrink-0">
                {Array(16)
                  .fill([
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
                    { name: "Stable-Diff", detail: "Video", val: "24", icon: DiffusersLogo },
                  ])
                  .flat()
                  .map((item, j) => (
                    <div key={j} className="flex items-center gap-3 px-3 py-1.5 rounded-[4px]">
                      <div className="flex items-center justify-center text-[#C8C7BA]">
                        <item.icon size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#C8C7BA] leading-tight">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#666] leading-tight">
                          <span className="flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-[#75bf00]" /> {item.detail}
                          </span>
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
          <div className="flex items-center justify-between w-[96%] sm:w-[94%] md:w-[calc(72%_-_240px)] lg:w-[calc(64%_-_240px)] min-w-0 md:min-w-[760px] lg:min-w-[820px] max-w-[1040px] mx-auto bg-[#151515] shadow-[0_0_20px_10px_rgba(21,21,21,1)] border-x border-dashed border-[#333333] pointer-events-auto px-3 sm:px-4 lg:px-5">
            {/* Left: Official Vector Brand Logo */}
            <div className="flex items-center shrink-0 h-14 mr-2 lg:mr-3 xl:mr-5">
              <Link href="/" className="flex items-center group shrink-0 whitespace-nowrap">
                <HorosLogo variant="wordmark" size="xl" className="text-[#F0EFE2]" />
              </Link>
            </div>

            {/* Center: Navigation Links (Desktop & Laptop) */}
            <nav className="hidden lg:flex items-center gap-2.5 lg:gap-3.5 xl:gap-4.5 text-[#F0EFE2] font-medium whitespace-nowrap text-xs xl:text-[13px]">
              {/* Use cases dropdown (Hover + Click) */}
              <div
                className="relative py-2"
                onMouseEnter={() => handleMouseEnter("use-cases")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={(e) => handleTriggerClick(e, "use-cases")}
                  aria-expanded={activeDropdown === "use-cases"}
                  className={`flex items-center gap-1 transition-colors cursor-pointer py-1 whitespace-nowrap ${
                    activeDropdown === "use-cases"
                      ? "text-[#75bf00]"
                      : "text-[#F0EFE2] hover:text-[#75bf00]"
                  }`}
                >
                  <span>Use cases</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "use-cases"
                        ? "rotate-180 text-[#75bf00]"
                        : "text-[#888]"
                    }`}
                  />
                </button>

                {activeDropdown === "use-cases" && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 pointer-events-auto"
                    onMouseEnter={() => handleMouseEnter("use-cases")}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Invisible hover bridge to eliminate gap */}
                    <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />

                    <div className="w-[min(720px,94vw)] border border-dashed border-[#333] bg-[#151515] shadow-2xl text-left font-sans grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 whitespace-normal">
                      {USE_CASES.map((uc, i) => (
                        <Link
                          key={uc.title}
                          href={uc.href}
                          onClick={handleItemClick}
                          className={`relative min-h-[140px] p-5 hover:bg-[#1a1a1a] cursor-pointer transition-colors group flex flex-col gap-3 ${
                            i % 3 !== 2 ? "md:border-r border-dashed border-[#333]" : ""
                          } ${i < 12 ? "border-b border-dashed border-[#333]" : ""}`}
                        >
                          <div className="flex items-center w-fit border border-dashed border-[#333] p-[3px] gap-[3px] rounded-sm group-hover:border-[#555] transition-colors relative z-10">
                            {uc.icons.map((Icon, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm group-hover:border-[#555] transition-colors text-[#C8C7BA]"
                              >
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
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/pricing"
                className="transition-colors hover:text-[#75bf00] whitespace-nowrap"
              >
                Pricing
              </Link>

              <Link
                href="#research"
                className="transition-colors hover:text-[#75bf00] whitespace-nowrap"
              >
                Research
              </Link>

              {/* Resources dropdown (Hover + Click) */}
              <div
                className="relative py-2"
                onMouseEnter={() => handleMouseEnter("resources")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={(e) => handleTriggerClick(e, "resources")}
                  aria-expanded={activeDropdown === "resources"}
                  className={`flex items-center gap-1 transition-colors cursor-pointer py-1 whitespace-nowrap ${
                    activeDropdown === "resources"
                      ? "text-[#75bf00]"
                      : "text-[#F0EFE2] hover:text-[#75bf00]"
                  }`}
                >
                  <span>Resources</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "resources"
                        ? "rotate-180 text-[#75bf00]"
                        : "text-[#888]"
                    }`}
                  />
                </button>

                {activeDropdown === "resources" && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 xl:left-0 xl:translate-x-0 top-full pt-2 xl:-ml-48 z-50 pointer-events-auto"
                    onMouseEnter={() => handleMouseEnter("resources")}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Invisible hover bridge to eliminate gap */}
                    <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />

                    <div className="w-[min(720px,94vw)] border border-dashed border-[#333] bg-[#151515] shadow-2xl text-left font-sans grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 whitespace-normal">
                      {RESOURCES.map((res, i) => (
                        <Link
                          key={res.title}
                          href={res.href}
                          onClick={handleItemClick}
                          className={`relative min-h-[140px] p-5 hover:bg-[#1a1a1a] cursor-pointer transition-colors group flex flex-col gap-3 ${
                            i % 3 !== 2 ? "md:border-r border-dashed border-[#333]" : ""
                          } ${i < 3 ? "border-b border-dashed border-[#333]" : ""}`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 border border-dashed border-[#333] bg-[#0a0a0a] rounded-sm group-hover:border-[#555] transition-colors">
                            {res.icon}
                          </div>
                          <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={16} className="text-[#75bf00]" />
                          </div>
                          <div className="flex flex-col gap-1 mt-auto relative z-10">
                            <div className="font-medium text-[14px] text-[#F0EFE2] tracking-tight w-fit px-1 -ml-1 group-hover:bg-[#75bf00] group-hover:text-black transition-colors">
                              {res.title}
                            </div>
                            <div className="text-[12px] text-[#C8C7BA] group-hover:text-[#e5e5e5] transition-colors leading-snug pr-2">
                              {res.desc}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/horos"
                className="transition-colors hover:text-[#75bf00] whitespace-nowrap flex items-center gap-1.5"
              >
                HOROS
                <span className="bg-[#C3C2B6] text-black text-[9px] font-medium px-1.5 py-0.2 rounded-xs tracking-tight whitespace-nowrap">
                  NEW
                </span>
              </Link>

              <Link
                href="#contact"
                className="transition-colors hover:text-[#75bf00] whitespace-nowrap mr-1 xl:mr-2"
              >
                Contact
              </Link>
            </nav>

            {/* Right Actions: Sign in & Get started (Desktop & Mobile) */}
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap h-14 pl-1 ml-1.5 xl:ml-3">
              <button
                type="button"
                onClick={onOpenSignUp || onOpenDashboard}
                className="hidden sm:flex items-center justify-center gap-1 border border-[#2a2a2a] bg-[#161616] hover:border-[#444] text-[#cccccc] hover:text-[#F0EFE2] px-3.5 xl:px-4 py-1.5 min-h-[32px] rounded-xs transition-colors cursor-pointer text-xs font-semibold whitespace-nowrap"
              >
                <span>Sign up</span>
              </button>

              <button
                type="button"
                onClick={onOpenSignIn || onOpenDashboard}
                className="flex items-center justify-center gap-1 bg-[#75bf00] hover:bg-[#86dc00] text-black font-semibold px-3.5 xl:px-4 py-1.5 min-h-[32px] rounded-xs transition-all cursor-pointer text-xs whitespace-nowrap shadow-sm"
              >
                <span>Demo</span>
              </button>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-[#aaa] hover:text-[#F0EFE2] bg-[#1c1c1c] border border-[#2a2a2a] rounded-xs cursor-pointer ml-1"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#282828] bg-[#141414] px-4 py-4 space-y-3 font-sans tracking-tight text-sm font-medium max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col space-y-2.5">
              {/* Mobile Use cases Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileUseCasesOpen(!mobileUseCasesOpen)}
                  className="w-full flex items-center justify-between py-2 text-[#C8C7BA] hover:text-[#F0EFE2] font-semibold cursor-pointer"
                >
                  <span>Use cases</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      mobileUseCasesOpen ? "rotate-180 text-[#75bf00]" : ""
                    }`}
                  />
                </button>
                {mobileUseCasesOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 py-2 border-l border-dashed border-[#333] my-1">
                    {USE_CASES.map((uc) => (
                      <Link
                        key={uc.title}
                        href={uc.href}
                        onClick={handleItemClick}
                        className="py-1.5 px-2 text-xs text-[#a0a095] hover:text-[#75bf00] hover:bg-[#1a1a1a] rounded-xs flex items-center justify-between"
                      >
                        <span>{uc.title}</span>
                        <ArrowUpRight size={12} className="text-[#555]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Resources Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                  className="w-full flex items-center justify-between py-2 text-[#C8C7BA] hover:text-[#F0EFE2] font-semibold cursor-pointer"
                >
                  <span>Resources</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      mobileResourcesOpen ? "rotate-180 text-[#75bf00]" : ""
                    }`}
                  />
                </button>
                {mobileResourcesOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 py-2 border-l border-dashed border-[#333] my-1">
                    {RESOURCES.map((res) => (
                      <Link
                        key={res.title}
                        href={res.href}
                        onClick={handleItemClick}
                        className="py-1.5 px-2 text-xs text-[#a0a095] hover:text-[#75bf00] hover:bg-[#1a1a1a] rounded-xs flex items-center justify-between"
                      >
                        <span>{res.title}</span>
                        <ArrowUpRight size={12} className="text-[#555]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/pricing"
                onClick={handleItemClick}
                className="py-1.5 text-[#C8C7BA] hover:text-[#F0EFE2]"
              >
                Pricing
              </Link>
              <Link
                href="/horos"
                onClick={handleItemClick}
                className="py-1.5 text-[#C8C7BA] hover:text-[#F0EFE2] flex items-center justify-between"
              >
                <span>HOROS</span>
                <span className="bg-[#C3C2B6] text-black text-[9px] font-medium px-1.5 py-0.2 rounded-xs">
                  NEW
                </span>
              </Link>
              <Link
                href="#research"
                onClick={handleItemClick}
                className="py-1.5 text-[#C8C7BA] hover:text-[#F0EFE2]"
              >
                Research
              </Link>
              <Link
                href="#contact"
                onClick={handleItemClick}
                className="py-1.5 text-[#C8C7BA] hover:text-[#F0EFE2]"
              >
                Contact
              </Link>

              <div className="pt-3 border-t border-[#222] flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleItemClick();
                    if (onOpenSignUp) onOpenSignUp();
                  }}
                  className="flex-1 py-2 text-center bg-[#1e1e1e] border border-[#333] text-[#F0EFE2] rounded-xs font-semibold cursor-pointer"
                >
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleItemClick();
                    if (onOpenSignIn) onOpenSignIn();
                  }}
                  className="flex-1 py-2 text-center bg-[#75bf00] hover:bg-[#86dc00] text-black font-extrabold rounded-xs cursor-pointer"
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

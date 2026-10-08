"use client";

import React from "react";
import { Lock, Shield, Server, FileCheck, ArrowRight, MessageSquare, Activity, Sun, Monitor, Moon, EyeOff, ShieldCheck } from "lucide-react";
import {
  HorosLogo, HorosWordmarkLogo, MetaLogo, DeepSeekLogo, GoogleLogo, NvidiaLogo, MistralLogo,
  SGLangLogo, HuggingFaceLogo, OpenAILogo, AnthropicLogo, GithubLogo, QwenLogo
} from "@/components/horos/primitives/brand-icons";

export function FooterCtaSection() {
  return (
    <footer className="relative w-full bg-[#151515] font-sans flex flex-col items-center">

      {/* All Vertical Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Outer Lines (Mobile & Desktop) */}
        <div className="absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />

        {/* Inner Lines (Desktop Only) */}
        <div className="hidden md:block absolute left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />

        {/* Top Infinite Horizontal Line to separate from FAQ section */}
        <div className="absolute top-0 left-0 right-0 h-[1px] border-t border-dashed border-[#333]" />
        
        {/* Crosses at intersections */}
        <div className="absolute left-[14%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%] top-0">+</div>
        <div className="absolute left-[86%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%] top-0">+</div>
        <div className="hidden md:block absolute left-[calc(18%_+_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%] top-0">+</div>
        <div className="hidden md:block absolute left-[calc(82%_-_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%] top-0">+</div>

        {/* Center Logo Divider */}
        <div className="absolute left-1/2 top-0 -translate-y-1/2 -translate-x-1/2 z-20 bg-[#151515] p-2 hidden md:block">
          <HorosLogo variant="icon" size="sm" className="w-5 h-auto text-[#F0EFE2]" />
        </div>
      </div>

      {/* --- CTA SECTION --- */}
      <div className="relative w-[88%] md:w-[calc(64%_-_240px)] mx-auto pt-32 pb-24 flex flex-col items-center">

        {/* Faint Blueprint Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 z-0" />

        {/* Floating Brand Cubes (Absolute Positioned exactly on the 48px grid) */}
        {/* Top Left Cluster */}
        <div className="absolute top-[48px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><DeepSeekLogo size={20} /></div>
        <div className="absolute top-[96px] left-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><MetaLogo size={20} /></div>
        <div className="absolute top-[96px] left-[144px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><NvidiaLogo size={20} /></div>
        <div className="absolute top-[144px] left-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><GoogleLogo size={20} /></div>
        <div className="absolute top-[192px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><MistralLogo size={20} /></div>

        {/* Bottom Right Cluster */}
        <div className="absolute bottom-[240px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><SGLangLogo size={20} /></div>
        <div className="absolute bottom-[192px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><DeepSeekLogo size={20} /></div>
        <div className="absolute bottom-[144px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><QwenLogo size={20} /></div>
        <div className="absolute bottom-[144px] right-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><MetaLogo size={20} /></div>
        <div className="absolute bottom-[96px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-0"><MistralLogo size={20} /></div>

        {/* Center Icon */}
        <div className="mb-8 relative z-10 flex items-center justify-center text-[#F0EFE2]">
          <HorosLogo size={40} />
        </div>

        {/* Text Content */}
        <div className="text-center relative z-10 max-w-4xl mx-auto mb-10">
          <h2 className="text-5xl md:text-[56px] lg:text-[64px] font-semibold text-[#F0EFE2] tracking-tight leading-[1.1] mb-6">
            Deploy your first verified intelligence,{" "}
            <span className="relative inline-block mt-2">
              <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span>
            </span>{" "}
            before you act
          </h2>
          <p className="text-[#a0a0a0] text-[16px] md:text-[18px] font-medium">
            Define the intent. HOROS discovers, builds, and verifies the capability stack.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4 relative z-10 mb-16">
          <button className="bg-[#75bf00] hover:bg-[#86d900] text-black font-bold text-[15px] px-8 py-3.5 transition-colors">
            Start Building
          </button>
          <button className="bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-[#F0EFE2] font-medium text-[15px] px-8 py-3.5 transition-colors">
            View Pricing
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap md:flex-nowrap border border-[#333] divide-y md:divide-y-0 md:divide-x divide-[#333] relative z-10">
          <div className="flex items-center gap-2 px-6 py-3 w-full md:w-auto justify-center">
            <Lock size={14} className="text-[#75bf00]" />
            <span className="text-[#a0a0a0] text-[11px] font-bold uppercase tracking-wider">End-to-end encryption</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 w-full md:w-auto justify-center">
            <Monitor size={14} className="text-[#75bf00]" />
            <span className="text-[#a0a0a0] text-[11px] font-bold uppercase tracking-wider">Isolated GPU infrastructure</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 w-full md:w-auto justify-center">
            <EyeOff size={14} className="text-[#75bf00]" />
            <span className="text-[#a0a0a0] text-[11px] font-bold uppercase tracking-wider">No training on your data</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 w-full md:w-auto justify-center">
            <ShieldCheck size={14} className="text-[#75bf00]" />
            <span className="text-[#a0a0a0] text-[11px] font-bold uppercase tracking-wider">SOC 2 Type II</span>
          </div>
        </div>

      </div>

      {/* --- DIVIDER --- */}
      <div className="w-full relative flex items-center justify-center my-8 z-10" style={{ height: "38px" }}>

        {/* Custom SVG 5-Line Divider from User */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="paint0_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#75BF00" />
              <stop offset="0.480769" stopColor="#333333" />
            </linearGradient>
            <linearGradient id="paint1_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0.110577" stopColor="#333333" />
              <stop offset="0.586538" stopColor="#75BF00" />
              <stop offset="1" stopColor="#333333" />
            </linearGradient>
            <linearGradient id="paint2_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0.423077" stopColor="#333333" />
              <stop offset="0.942308" stopColor="#75BF00" />
              <stop offset="1" stopColor="#333333" />
            </linearGradient>
            <linearGradient id="paint3_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#75BF00" />
              <stop offset="1" stopColor="#333333" />
            </linearGradient>
          </defs>
          <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="url(#paint0_linear_55_3)" strokeDasharray="3 3" />
          <line x1="0" y1="8.5" x2="100%" y2="8.5" stroke="url(#paint1_linear_55_3)" strokeDasharray="3 3" />
          <line x1="0" y1="16.5" x2="100%" y2="16.5" stroke="#333333" strokeDasharray="3 3" />
          <line x1="0" y1="24.5" x2="100%" y2="24.5" stroke="url(#paint2_linear_55_3)" strokeDasharray="3 3" />
          <line x1="0" y1="32.5" x2="100%" y2="32.5" stroke="url(#paint3_linear_55_3)" strokeDasharray="3 3" />
        </svg>

        {/* Center Logo Cutout */}
        <div className="px-8 py-2 text-[#F0EFE2] relative z-20 flex items-center justify-center">
          <HorosLogo variant="icon" className="w-[60px] h-auto text-[#F0EFE2]" />
        </div>
      </div>

      {/* --- FOOTER CONTENT --- */}
      <div className="w-[88%] md:w-[calc(64%_-_240px)] mx-auto py-16 flex flex-col relative z-10">

        {/* Top Footer Row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0 pb-16 px-8 lg:px-12">

          {/* Left Column */}
          <div className="flex flex-col items-start">
            <div className="mb-4 text-[#F0EFE2]">
              <HorosLogo variant="wordmark" size="4xl" />
            </div>
            <p className="text-[#63625C] text-[15px] mb-6 font-medium">© 2026 HOROS Infra. All rights reserved.</p>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mb-8 text-[#C8C7BA]">
              <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="GitHub">
                <GithubLogo size={18} />
              </a>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[#222] hover:bg-[#2a2a2a] text-[#C8C7BA] px-3.5 py-2 rounded-[6px] transition-colors border border-[#333]">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                <span className="text-[12px] font-medium tracking-tight">Join the community</span>
              </button>
              <button className="flex items-center gap-2 bg-[#222] hover:bg-[#2a2a2a] text-[#C8C7BA] px-3.5 py-2 rounded-[6px] transition-colors border border-[#333]">
                <div className="w-1.5 h-1.5 bg-[#75bf00] rounded-full" />
                <span className="text-[12px] font-medium tracking-tight">System status</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col items-end">

            {/* Nav Links */}
            <div className="flex flex-col items-end gap-3 mb-10 w-full">
              <div className="flex items-center gap-x-6">
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Intelligence Agent</a>
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Capability Fabric</a>
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Pricing</a>
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Enterprise</a>
              </div>
              <div className="flex items-center gap-x-6">
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Benchmarks</a>
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Docs</a>
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Research</a>
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">News</a>
                <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Contact</a>
              </div>
            </div>


            {/* Ask AI about HOROS */}
            <div className="flex flex-col items-end">
              <span className="text-[#F0EFE2] font-bold text-[11px] mb-3">Ask AI about HOROS</span>
              <div className="flex items-center gap-4 text-[#C8C7BA]">
                <OpenAILogo size={18} className="text-[#00a67e] hover:brightness-125 transition-all cursor-pointer" />
                <AnthropicLogo size={18} className="text-[#d97757] hover:brightness-125 transition-all cursor-pointer" />
                <GoogleLogo size={18} className="text-[#4285f4] hover:brightness-125 transition-all cursor-pointer" />
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors cursor-pointer">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
                <div className="w-[18px] h-[18px] border-[1.5px] border-current rounded-full flex items-center justify-center text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors cursor-pointer">
                  <div className="w-1.5 h-1.5 bg-current rounded-full" />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Legal / Theme Row */}
      <div className="w-full border-t border-dashed border-[#333] relative">

        {/* Tiny HOROS text aligned to the left of the 14% grid line */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[86%] mr-6 text-[#555] text-[9px] font-bold tracking-[0.2em] z-10 hidden md:block">HOROS</div>

        <div className="w-[88%] md:w-[calc(64%_-_240px)] mx-auto py-8 px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center relative z-10">

          <div className="flex flex-wrap items-center gap-5 text-[11px] font-medium text-[#777] mb-4 md:mb-0">
            <span className="flex items-center text-[#F0EFE2] mr-12">
              <HorosLogo variant="wordmark" size="3xl" />
            </span>
            <a href="#" className="hover:text-[#F0EFE2] transition-colors">Security</a>
            <a href="#" className="hover:text-[#F0EFE2] transition-colors">DPA</a>
            <a href="#" className="hover:text-[#F0EFE2] transition-colors">AUP</a>
            <a href="#" className="hover:text-[#F0EFE2] transition-colors">Cookies</a>
            <a href="#" className="hover:text-[#F0EFE2] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#F0EFE2] transition-colors">Privacy</a>
          </div>

          <div className="flex items-center gap-2 text-[#666]">
            <button className="p-1.5 rounded-[6px] hover:text-[#F0EFE2] hover:bg-[#222] transition-colors">
              <Sun size={15} />
            </button>
            <button className="p-1.5 rounded-[6px] bg-[#1a1a1a] text-[#F0EFE2] border border-[#333] transition-colors">
              <Monitor size={15} />
            </button>
            <button className="p-1.5 rounded-[6px] hover:text-[#F0EFE2] hover:bg-[#222] transition-colors">
              <Moon size={15} />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
}


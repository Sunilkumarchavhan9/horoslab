"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Calendar,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Zap,
  ArrowUpRight,
  Bell,
  ExternalLink,
} from "lucide-react";
import { HorosLogo, HorosWordmarkLogo } from "@/components/horos/primitives/brand-icons";
import { GlobalFooter } from "@/components/landing/global-footer";

function ThankYouContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const queryEmail = searchParams.get("email");
  const queryProvider = searchParams.get("provider");

  const displayEmail =
    session?.user?.email ||
    queryEmail ||
    (queryProvider ? `${queryProvider.toUpperCase()} Account (Verified)` : null);

  const displayName =
    session?.user?.name || (displayEmail ? displayEmail.split("@")[0] : "Founding Partner");

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#F0EFE2] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col justify-between relative overflow-hidden">
      {/* Background Blueprint Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none opacity-30 z-0" />

      {/* Top Header */}
      <header className="w-full border-b border-dashed border-[#262626] bg-[#111111]/80 backdrop-blur-md relative z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <HorosLogo variant="icon" size="sm" className="text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors" />
            <HorosWordmarkLogo className="h-4.5 w-auto text-[#F0EFE2]" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-[#888] hover:text-[#F0EFE2] transition-colors font-mono hidden sm:inline"
            >
              ← Back to Overview
            </Link>
            <a
              href="https://cal.com/vegito"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-semibold text-xs px-4 py-1.5 rounded-none transition-colors shadow-xs"
            >
              <Calendar size={13} />
              <span>Demo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 sm:py-16 relative z-10 w-full flex flex-col items-center">
        
        {/* Top Confirmation Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-none bg-[#75bf00]/10 border border-[#75bf00]/30 text-xs text-[#75bf00] font-mono font-semibold tracking-wider mb-6">
          <span className="w-2 h-2 rounded-none bg-[#75bf00] animate-pulse" />
          <span>EARLY ACCESS CONFIRMED</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-center text-[#F0EFE2] tracking-tight leading-[1.15] mb-4 max-w-3xl">
          Thank you for{" "}
          <span className="bg-[#75bf00] text-black px-2.5 py-0.5 rounded-none inline-block">
            signing in
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#9ca3af] text-center max-w-2xl leading-relaxed mb-10">
          Your reservation is secured in the HOROS Founding Compute & Physical Intelligence Cohort.
        </p>

        {/* Key Early Launch Promise Notice Box */}
        <div className="w-full max-w-3xl bg-[#161616] border border-[#75bf00]/40 rounded-none p-6 sm:p-7 mb-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#75bf00]/5 rounded-none blur-2xl pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-none bg-[#75bf00]/15 border border-[#75bf00]/30 flex items-center justify-center shrink-0 text-[#75bf00] mt-0.5">
              <Bell size={20} className="text-[#75bf00]" />
            </div>
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono font-bold text-[#75bf00] uppercase tracking-wider">
                  Priority Access Guarantee
                </span>
                <span className="text-[11px] font-mono text-[#777] bg-[#111] px-2 py-0.5 border border-[#262626] rounded-none">
                  Cohort Status: Active
                </span>
              </div>

              <p className="text-sm sm:text-[15px] font-medium text-[#F0EFE2] leading-relaxed">
                When we launch early, you will get the first notification through email and you can get to use our product early before everyone.
              </p>

              {displayEmail && (
                <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs text-[#888] font-mono">
                  <span>Registered account:</span>
                  <span className="text-[#75bf00] font-semibold">{displayEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cal.com Demo Walkthrough Box */}
        <div className="w-full max-w-3xl bg-gradient-to-r from-[#171717] to-[#141414] border border-[#333] hover:border-[#75bf00]/50 rounded-none p-6 sm:p-7 mb-12 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#75bf00]" />
                <h3 className="text-base font-bold text-[#F0EFE2]">
                  Want a live walkthrough right now?
                </h3>
              </div>
              <p className="text-xs text-[#999] leading-relaxed">
                You don't need to wait for the public rollout. Schedule an immediate 1-on-1 technical walkthrough and live inference demo directly with our founding team on Cal.com.
              </p>
            </div>

            <a
              href="https://cal.com/vegito"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold text-xs px-5 py-3 rounded-none transition-all shadow-md shrink-0"
            >
              <Calendar size={14} />
              <span>Schedule Demo on Cal.com</span>
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </a>
          </div>
        </div>

        {/* Product Intros Section */}
        <div className="w-full max-w-3xl space-y-4 mb-12">
          <div className="flex items-center justify-between border-b border-dashed border-[#2b2b2b] pb-3 mb-6">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[#888]">
              What you're getting early access to
            </h2>
            <span className="text-xs font-mono text-[#75bf00]">3 Core Engines</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-[#141414] border border-[#262626] p-5 rounded-none space-y-2.5">
              <div className="w-8 h-8 rounded-none bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-[#75bf00]">
                <Cpu size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#F0EFE2]">
                Physical Intelligence
              </h3>
              <p className="text-xs text-[#888] leading-relaxed">
                Foundation models for multifingered humanoid hands, nonstationary contacts, and tactile shear adaptation.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#141414] border border-[#262626] p-5 rounded-none space-y-2.5">
              <div className="w-8 h-8 rounded-none bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-[#75bf00]">
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#F0EFE2]">
                Certified p-CBF Safety
              </h3>
              <p className="text-xs text-[#888] leading-relaxed">
                Predictive Control Barrier Functions delivering 0.0% drops and 0.0% crush damage across 6,200 episodes.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#141414] border border-[#262626] p-5 rounded-none space-y-2.5">
              <div className="w-8 h-8 rounded-none bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-[#75bf00]">
                <Zap size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#F0EFE2]">
                Verified Runtime
              </h3>
              <p className="text-xs text-[#888] leading-relaxed">
                Measured capability stack discovery, sub-millisecond dispatch, and hardware-native execution.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links & Research Explore */}
        <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-4 p-5 rounded-none bg-[#121212] border border-[#262626]">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-[#F0EFE2]">
              Explore while you wait
            </span>
            <p className="text-[11px] text-[#777]">
              Read our latest arXiv paper or inspect the live capabilities fabric.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/research"
              className="inline-flex items-center gap-1.5 bg-[#1f1f1f] hover:bg-[#282828] border border-[#333] hover:border-[#444] text-[#C8C7BA] hover:text-[#F0EFE2] text-xs px-3.5 py-1.5 rounded-none transition-colors"
            >
              <span>Read Paper</span>
              <ExternalLink size={11} />
            </Link>
            <Link
              href="/capabilities"
              className="inline-flex items-center gap-1.5 bg-[#1f1f1f] hover:bg-[#282828] border border-[#333] hover:border-[#444] text-[#C8C7BA] hover:text-[#F0EFE2] text-xs px-3.5 py-1.5 rounded-none transition-colors"
            >
              <span>Capabilities</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>

      </main>

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center font-mono text-xs text-[#75bf00]">
          Loading confirmation...
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}

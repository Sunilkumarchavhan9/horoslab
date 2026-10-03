"use client";

import React, { useState } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { AuthModal } from "@/components/dhyra/modals/auth-modal";
import { DhyraHero } from "@/components/dhyra/dhyra-hero";
import { DhyraContextRouting } from "@/components/dhyra/dhyra-context-routing";
import { DhyraPricingEfficiency } from "@/components/dhyra/dhyra-pricing-efficiency";
import { DhyraDeveloperAPI } from "@/components/dhyra/dhyra-developer-api";
import { DhyraIntegrations } from "@/components/dhyra/dhyra-integrations";
import { DhyraSecurityTrust } from "@/components/dhyra/dhyra-security-trust";
import { PixelFilter } from "@/components/dhyra/primitives/pixel-filter";

const GridDivider = () => (
  <div className="relative w-full h-[1px]">
    <div className="absolute left-0 right-0 h-[1px] border-t border-dashed border-[#333]" />
    
    {/* Crosses at intersections */}
    <div className="absolute left-[14%] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="absolute left-[86%] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="hidden md:block absolute left-[calc(14%_+_120px)] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="hidden md:block absolute left-[calc(86%_-_120px)] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
  </div>
);

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full grid grid-cols-[14%_72%_14%] md:grid-cols-[calc(14%_+_120px)_calc(72%_-_240px)_calc(14%_+_120px)] relative z-10">
    <div /> {/* Left Gutter */}
    <div className="w-full flex flex-col min-w-0 py-16 lg:py-24 px-6 lg:px-12 xl:px-16">
      {children}
    </div>
    <div /> {/* Right Gutter */}
  </div>
);

export default function DhyraPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  return (
    <div className="relative min-h-screen bg-[#151515] text-[#F0EFE2] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col overflow-x-hidden">
      
      <PixelFilter />

      <LandingNavbar
        onOpenDashboard={() => {
          setAuthModalMode("sign-in");
          setAuthModalOpen(true);
        }}
        onOpenSignIn={() => {
          setAuthModalMode("sign-in");
          setAuthModalOpen(true);
        }}
        onOpenSignUp={() => {
          setAuthModalMode("sign-up");
          setAuthModalOpen(true);
        }}
        dark={true}
      />
      
      <main className="pb-32 w-full relative z-10 flex flex-col">
        {/* Global Vertical Grid Lines */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="hidden md:block absolute left-[calc(14%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="hidden md:block absolute left-[calc(86%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        </div>

        <GridDivider />
        <SectionWrapper>
          <DhyraHero />
        </SectionWrapper>
        
        <GridDivider />
        <SectionWrapper>
          <DhyraContextRouting />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <DhyraPricingEfficiency />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <DhyraDeveloperAPI />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <DhyraIntegrations />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <DhyraSecurityTrust />
        </SectionWrapper>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

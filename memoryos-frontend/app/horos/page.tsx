"use client";

import React, { useState } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { AuthModal } from "@/components/horos/modals/auth-modal";
import { HorosHero } from "@/components/horos/horos-hero";
import { HorosModelFamily } from "@/components/horos/horos-model-family";
import { HorosContextRouting } from "@/components/horos/horos-context-routing";
import { HorosPricingEfficiency } from "@/components/horos/horos-pricing-efficiency";
import { HorosDeveloperAPI } from "@/components/horos/horos-developer-api";
import { HorosIntegrations } from "@/components/horos/horos-integrations";
import { HorosSecurityTrust } from "@/components/horos/horos-security-trust";
import { PixelFilter } from "@/components/horos/primitives/pixel-filter";
import HorosLogo from "@/components/horos/primitives/horos-logo";

const GridDivider = () => (
  <div className="relative w-full h-[1px]">
    <div className="absolute left-0 right-0 h-[1px] border-t border-dashed border-[#333]" />
    
    {/* Crosses at intersections */}
    <div className="absolute hidden md:block left-[14%] lg:left-[18%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="absolute hidden md:block left-[86%] lg:left-[82%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="hidden md:block absolute left-[calc(14%_+_120px)] lg:left-[calc(18%_+_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="hidden md:block absolute left-[calc(86%_-_120px)] lg:left-[calc(82%_-_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    
    {/* Center Logo Divider */}
    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 bg-[#151515] p-2 hidden md:block">
      <HorosLogo variant="icon" size="sm" className="w-5 h-auto text-[#F0EFE2]" />
    </div>
  </div>
);

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full grid grid-cols-[14%_72%_14%] md:grid-cols-[calc(14%_+_120px)_calc(72%_-_240px)_calc(14%_+_120px)] lg:grid-cols-[calc(18%_+_120px)_calc(64%_-_240px)_calc(18%_+_120px)] relative z-10">
    <div /> {/* Left Gutter */}
    <div className="w-full flex flex-col min-w-0 py-16 lg:py-24 px-6 lg:px-12 xl:px-16">
      {children}
    </div>
    <div /> {/* Right Gutter */}
  </div>
);

export default function HorosPage() {
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
          <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="hidden md:block absolute left-[calc(14%_+_120px)] lg:left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="hidden md:block absolute left-[calc(86%_-_120px)] lg:left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        </div>

        <GridDivider />
        <SectionWrapper>
          <HorosHero />
        </SectionWrapper>
        
        <GridDivider />
        <SectionWrapper>
          <HorosModelFamily />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <HorosContextRouting />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <HorosPricingEfficiency />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <HorosDeveloperAPI />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <HorosIntegrations />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <HorosSecurityTrust />
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

"use client";

import React, { useState } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { AuthModal } from "@/components/epoch/modals/auth-modal";
import { EpochInfraHero } from "@/components/epochinfra/epochinfra-hero";
import { EpochInfraContextRouting } from "@/components/epochinfra/epochinfra-context-routing";
import { EpochInfraPricingEfficiency } from "@/components/epochinfra/epochinfra-pricing-efficiency";
import { EpochInfraDeveloperAPI } from "@/components/epochinfra/epochinfra-developer-api";
import { EpochInfraIntegrations } from "@/components/epochinfra/epochinfra-integrations";
import { EpochInfraSecurityTrust } from "@/components/epochinfra/epochinfra-security-trust";
import { PixelFilter } from "@/components/epoch/primitives/pixel-filter";

const GridDivider = () => (
  <div className="relative w-full h-[1px]">
    <div className="absolute left-0 right-0 h-[1px] border-t border-dashed border-[#333]" />
    
    {/* Crosses at intersections */}
    <div className="absolute left-[6%] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="hidden md:block absolute left-[14%] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="hidden md:block absolute left-[86%] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="absolute left-[94%] text-[#666] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
  </div>
);

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full grid grid-cols-[6%_88%_6%] md:grid-cols-[14%_72%_14%] relative z-10">
    <div /> {/* Left Gutter */}
    <div className="w-full flex flex-col min-w-0 py-16 lg:py-24 px-6 lg:px-12 xl:px-16">
      {children}
    </div>
    <div /> {/* Right Gutter */}
  </div>
);

export default function EpochInfraPage() {
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
          <div className="absolute left-[6%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="absolute left-[94%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="hidden md:block absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          <div className="hidden md:block absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        </div>

        <GridDivider />
        <SectionWrapper>
          <EpochInfraHero />
        </SectionWrapper>
        
        <GridDivider />
        <SectionWrapper>
          <EpochInfraContextRouting />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <EpochInfraPricingEfficiency />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <EpochInfraDeveloperAPI />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <EpochInfraIntegrations />
        </SectionWrapper>

        <GridDivider />
        <SectionWrapper>
          <EpochInfraSecurityTrust />
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

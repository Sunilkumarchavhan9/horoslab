"use client";

import React, { useState } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { AuthModal } from "@/components/horos/modals/auth-modal";
import { PixelFilter } from "@/components/horos/primitives/pixel-filter";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { ContactForm } from "@/components/landing/contact-form";

const GridDivider = () => (
  <div className="relative w-full h-[1px]">
    <div className="absolute left-0 right-0 h-[1px] border-t border-dashed border-[#333]" />
    
    {/* Crosses at intersections */}
    <div className="absolute hidden md:block left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] text-[#666] font-mono text-[9px] md:text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] text-[#666] font-mono text-[9px] md:text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] text-[#666] font-mono text-[9px] md:text-[10px] leading-none transform translate-x-[45%] -translate-y-[52%]">+</div>
    <div className="absolute hidden md:block right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] text-[#666] font-mono text-[9px] md:text-[10px] leading-none transform translate-x-[45%] -translate-y-[52%]">+</div>
  </div>
);

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] relative z-10 min-h-[75vh]">
    <div className="hidden lg:block" /> {/* Left Margin Gutter */}
    <div className="w-full flex flex-col min-w-0 px-6 sm:px-8 lg:px-12 xl:px-16 pt-12 pb-24">
      {children}
    </div>
    <div className="hidden lg:block" /> {/* Right Margin Gutter */}
  </div>
);

export default function ContactPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  
  return (
    <div className="relative min-h-screen bg-[#151515] text-[#C8C7BA] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col overflow-x-hidden">
      
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
      
      <main className="pb-0 w-full relative z-10 flex flex-col pt-[80px]">
        {/* 4 Adaptive Vertical Guidelines (2 on Left, 2 on Right) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Left Outer Line */}
          <div className="hidden md:block absolute left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
          {/* Left Inner Line */}
          <div className="absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
          {/* Right Inner Line */}
          <div className="absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#333]" />
          {/* Right Outer Line */}
          <div className="hidden md:block absolute right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#262626]" />
        </div>

        <GridDivider />
        <SectionWrapper>
          <ContactForm />
        </SectionWrapper>
        <GridDivider />

        {/* Footer */}
        <FooterCtaSection />
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

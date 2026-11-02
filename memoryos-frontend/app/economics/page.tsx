import React from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { ResourceCalculatorSection } from "@/components/landing/resource-calculator-section";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { PixelFilter } from "@/components/horos/primitives/pixel-filter";

export default function EconomicsPage() {
  return (
    <div className="relative min-h-screen bg-[#151515] text-[#F0EFE2] font-sans flex flex-col">
      <PixelFilter />

      {/* Background Dashed Lines - Global Layout */}
      <div className="fixed inset-0 pointer-events-none z-0">
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

        <main className="flex-grow flex flex-col w-full relative z-10">
          <ResourceCalculatorSection />
        </main>

        <FooterCtaSection />
      </div>
    </div>
  );
}

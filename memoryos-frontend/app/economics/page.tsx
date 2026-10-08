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
        {/* Outer Lines (Mobile & Desktop) */}
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />

        {/* Inner Lines (Desktop Only) */}
        <div className="hidden md:block absolute left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      <div className="relative z-10 flex flex-col w-full min-h-screen">
        <div className="w-full border-b border-dashed border-[#333] flex justify-center">
          <div className="w-full">
            <LandingNavbar />
          </div>
        </div>

        <main className="flex-grow flex flex-col w-full relative z-10">
          <ResourceCalculatorSection />
        </main>

        <FooterCtaSection />
      </div>
    </div>
  );
}

import { ThesisManifestoSection } from "@/components/landing/thesis-manifesto-section";
import { BlueBand } from "@/components/landing/blue-band";
import { MemoryIgnitionSection } from "@/components/landing/memory-ignition-section";
import { TheProblemSection } from "@/components/landing/the-problem-section";
import { ThePainSection } from "@/components/landing/the-pain-section";
import { InstitutionRuntimeSection } from "@/components/landing/institution-runtime-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingNav } from "@/components/landing/landing-nav";
import { PersonalMemorySection } from "@/components/landing/personal-memory-section";
import { VerificationAssuranceCaseSection } from "@/components/landing/verification-assurance-case-section";
import { SectionLabel } from "@/components/landing/section-label";
import { MistakeImmunityGrid } from "@/components/landing/mistake-immunity-grid";
import { WhatWeDoSection } from "@/components/landing/what-we-do-section";
import { RealitySettlementSection } from "@/components/landing/reality-settlement-section";
import { ProductSurfacesSection } from "@/components/landing/product-surfaces-section";
import { DeveloperExperienceSection } from "@/components/landing/developer-experience-section";
import { FaqSection } from "@/components/landing/faq-section";

export default function Home() {
  return (
    <main className="landing-root min-h-screen bg-white pb-0 pt-16 lg:pt-[60px]">
      <div className="fixed left-0 top-0 z-[80] w-full border-b border-[#c9d8ee] bg-white">
        <LandingNav />
      </div>

      <section className="relative w-full">
        <HeroSection />
        <BlueBand />
      </section>

      <div className="mx-auto max-w-[1240px] border-x border-b border-[#c9d8ee] bg-white">
        <section id="what-we-do" className="relative">
          <SectionLabel
            title="AUTONOMOUS ORGANIZATION INFRASTRUCTURE"
            index="[1/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <WhatWeDoSection />
        </section>

        <section id="how-it-works" className="relative">
          <SectionLabel
            title="THE ORGANIZATION LOOP"
            index="[2/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <TheProblemSection />
        </section>

        <section id="memory-ignition" className="relative">
          <SectionLabel
            title="RUNTIME BRIEF"
            index="[3/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <MemoryIgnitionSection />
        </section>

        <section id="under-the-hood" className="relative">
          <SectionLabel
            title="WHY AGENT PLATFORMS BREAK"
            index="[4/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <MistakeImmunityGrid />
        </section>

        <section id="the-thesis" className="relative bg-white">
          <SectionLabel
            title="THESIS"
            index="[5/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <ThesisManifestoSection />
        </section>

        <section id="the-pain" className="relative bg-white">
          <SectionLabel
            title="THE AUTONOMY GAP"
            index="[6/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <ThePainSection />
        </section>

        <section id="personal-memory" className="relative bg-white">
          <SectionLabel
            title="WHAT EPOCH IS"
            index="[7/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <PersonalMemorySection />
        </section>

        <section id="institution-runtime" className="relative">
          <SectionLabel
            title="INSTITUTION RUNTIME"
            index="[8/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <InstitutionRuntimeSection />
        </section>

        <section id="verification" className="relative">
          <SectionLabel
            title="VERIFICATION & ASSURANCE"
            index="[9/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <VerificationAssuranceCaseSection />
        </section>

        <section id="reality-settlement" className="relative">
          <SectionLabel
            title="REALITY SETTLEMENT"
            index="[10/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <RealitySettlementSection />
        </section>

        <section id="developer-experience" className="relative">
          <SectionLabel
            title="AGENT-NATIVE INTEGRATIONS"
            index="[11/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <DeveloperExperienceSection />
        </section>

        <section id="product-surfaces" className="relative">
          <SectionLabel
            title="AUTHORITY & TRUST"
            index="[12/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <ProductSurfacesSection />
        </section>

        <section id="faq" className="relative">
          <SectionLabel
            title="FAQ"
            index="[13/13]"
            className="sticky top-16 z-[70] lg:top-[60px]"
          />
          <FaqSection />
        </section>
      </div>

      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-white">
        <LandingFooter />
      </div>
    </main>
  );
}


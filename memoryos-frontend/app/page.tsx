import { BenchmarksSection } from "@/components/landing/benchmarks-section";
import { BlueBand } from "@/components/landing/blue-band";
import { ContextStackSection } from "@/components/landing/context-stack-section";
import { CompanyBrainThesisSection } from "@/components/landing/company-brain-thesis-section";
import { DeveloperExperienceSection } from "@/components/landing/developer-experience-section";
import { EnterpriseSection } from "@/components/landing/enterprise-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingNav } from "@/components/landing/landing-nav";
import { PersonalMemorySection } from "@/components/landing/personal-memory-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SectionLabel } from "@/components/landing/section-label";
import { UnderTheHoodSection } from "@/components/landing/under-the-hood-section";
import { WhatWeDoSection } from "@/components/landing/what-we-do-section";

export default function Home() {
  return (
    <main className="landing-root min-h-screen bg-white pb-0 pt-[72px]">
      <div className="fixed left-1/2 top-0 z-[80] w-full max-w-[1240px] -translate-x-1/2 border-x border-b border-[#c9d8ee] bg-white">
        <LandingNav />
      </div>

      <div className="mx-auto max-w-[1240px] border-x border-b border-[#c9d8ee] bg-white">
        <section className="relative">
          <HeroSection />
          <BlueBand />
        </section>

        <section id="what-we-do" className="relative">
          <SectionLabel
            title="WHAT WE DO"
            index="[1/9]"
            className="sticky top-[72px] z-[70]"
          />
          <WhatWeDoSection />
        </section>

        <section id="company-brain-thesis" className="relative">
          <SectionLabel
            title="COMPANY BRAIN"
            index="[2/9]"
            className="sticky top-[72px] z-[70]"
          />
          <CompanyBrainThesisSection />
        </section>

        <section id="context-stack" className="relative">
          <SectionLabel
            title="THE CONTEXT STACK"
            index="[3/9]"
            className="sticky top-[72px] z-[70]"
          />
          <ContextStackSection />
        </section>

        <section id="under-the-hood" className="relative">
          <SectionLabel
            title="UNDER THE HOOD"
            index="[4/9]"
            className="sticky top-[72px] z-[70]"
          />
          <UnderTheHoodSection />
        </section>

        <section id="benchmarks" className="relative">
          <SectionLabel
            title="BENCHMARKS"
            index="[5/9]"
            className="sticky top-[72px] z-[70]"
          />
          <BenchmarksSection />
        </section>

        <section id="developer-experience" className="relative">
          <SectionLabel
            title="DEVELOPER EXPERIENCE"
            index="[6/9]"
            className="sticky top-[72px] z-[70]"
          />
          <DeveloperExperienceSection />
        </section>
      </div>

      <section id="personal-memory" className="relative left-1/2 right-1/2 -mx-[50vw] mt-0 w-screen">
        <div className="sticky top-[72px] z-[70] mx-auto max-w-[1240px] border-x border-b border-[#c9d8ee] bg-white">
          <SectionLabel title="PERSONAL MEMORY" index="[7/9]" />
        </div>
        <PersonalMemorySection />
      </section>

      <div className="mx-auto max-w-[1240px] border-x border-b border-[#c9d8ee] bg-white">
        <section id="enterprise" className="relative">
          <SectionLabel
            title="ENTERPRISE"
            index="[8/9]"
            className="sticky top-[72px] z-[70]"
          />
          <EnterpriseSection />
        </section>

        <section id="pricing" className="relative">
          <SectionLabel
            title="PRICING"
            index="[9/9]"
            className="sticky top-[72px] z-[70]"
          />
          <PricingSection />
        </section>
      </div>

      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-white">
        <LandingFooter />
      </div>
    </main>
  );
}

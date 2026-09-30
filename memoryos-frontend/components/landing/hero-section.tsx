"use client";

import { AnimatedRailTicks } from "./animated-rail-ticks";
import { HeroAnnouncementStrip } from "./hero-announcement-strip";
import { HeroCornerSvg } from "./hero-corner-svg";
import { HeroBottomCornerSvg } from "./hero-bottom-corner-svg";
import { HeroLeftBottomSvg } from "./hero-left-bottom-svg";

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-hidden border-b border-[#c9d8ee] bg-white">
      {/* Background Video */}
      <video
        src="/grrek.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 z-[-1] h-full w-full object-cover pointer-events-none"
        style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: 'transform' }}
      />

      <HeroCornerSvg />
      <HeroBottomCornerSvg />
      <HeroLeftBottomSvg />

      <div className="relative h-8 border-y border-dashed border-[#c9d8ee]">
        <AnimatedRailTicks positions={["24%", "50%", "76%"]} />
      </div>

      <HeroAnnouncementStrip />

      <div className="mx-auto flex max-w-[1440px] justify-center px-6 pb-24 pt-10 sm:px-10 lg:px-16 lg:pb-32 lg:pt-14 xl:px-20 xl:pb-40">
        <div className="flex w-full max-w-[1200px] flex-col items-center text-center">

          {/* Eyebrow */}
          <div className="mb-4 text-[13px] font-bold tracking-widest text-[#F0EFE2]/80 uppercase">
            AUTONOMOUS ORGANIZATION INFRASTRUCTURE
          </div>

          <h1 className="glitch-text mt-2 w-full max-w-[1100px] text-4xl font-semibold leading-[1.02] tracking-tight text-[#F0EFE2] md:text-5xl lg:text-[56px] xl:text-[64px]">
            Agents are becoming<br />
            organizations.
          </h1>

          <div className="mx-auto mt-6 max-w-[800px] text-[16px] leading-relaxed text-[#F0EFE2] sm:text-[18px] space-y-4">
            <p>
              Dhyra is the institution runtime for the autonomous enterprise: mission-scoped authority, governed execution, independent proof, settlement, and institutional evolution for AI workforces.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="inline-flex flex-wrap justify-center items-center gap-2 text-[13px] font-medium text-[#F0EFE2]/70 text-center">
              <span className="border-b border-dashed border-white/40 pb-[1px]">
                Sign up, connect GitHub and Slack, ask Reality, and run the first mission.
              </span>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="/auth/sign-up"
                className="flex items-center bg-[#0015FF] text-[14px] font-medium text-[#F0EFE2] transition hover:bg-[#0015FF]/90"
              >
                <span className="px-6 py-2.5">Open Institution Runtime</span>
                <span className="border-l border-[#0015FF] px-4 py-2.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
              <a
                href="https://cal.com/vegito"
                target="_blank"
                rel="noreferrer"
                className="border border-slate-200 bg-white px-6 py-2.5 text-[14px] font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Book Founder Call
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

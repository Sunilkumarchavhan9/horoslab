import { AnimatedRailTicks } from "./animated-rail-ticks";
import { Reveal } from "./motion";
import { HeroAnnouncementStrip } from "./hero-announcement-strip";
import { HeroBrainCyberCanvas } from "./hero-brain-cyber-canvas";

export function HeroSection() {
  return (
    <section className="border-b border-[#c9d8ee]">
      <div className="relative h-11 border-y border-dashed border-[#c9d8ee]">
        <AnimatedRailTicks positions={["24%", "50%", "76%"]} />
      </div>

      <HeroAnnouncementStrip />

      <div className="grid gap-6 px-5 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-7">
        <Reveal>
          <p className="font-mono text-[11px] tracking-[0.22em] text-[#356acc]">
            DEVELOPER CONTINUITY INFRASTRUCTURE
          </p>
          <h1 className="max-w-[620px] text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-slate-900 md:text-5xl lg:text-[56px]">
            Resume real engineering work without re-explaining context
          </h1>

          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.5] text-[#5f6f86] md:text-[16px]">
            MemoryOS captures project state, decisions, bugs, and preferences as structured memory,
            then retrieves and explains the right context for the next session, agent, or handoff.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="/developer-console/sign-in"
              className="bg-[#2166f3] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0f56de]"
            >
              Start Building →
            </a>
            <a
              href="#contact"
              className="border border-[#c9d8ee] bg-white px-5 py-2.5 text-[15px] font-medium text-slate-800 transition hover:border-[#9db8e3] hover:text-[#2166f3]"
            >
              Talk to Founder
            </a>
          </div>

          <a
            href="#personal-memory"
            className="mt-3 inline-flex text-[14px] text-[#516882] underline-offset-4 transition hover:text-[#2166f3] hover:underline"
          >
            Get a personal MemoryOS ↗
          </a>

          <div className="mt-4 grid max-w-[620px] gap-2 sm:grid-cols-3">
            {[
              ["Top-3 retrieval precision", "100%"],
              ["Resume success rate", "100%"],
              ["Contradiction miss rate", "0%"],
            ].map(([label, value]) => (
              <div key={label} className="border border-[#c9d8ee] bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.11em] text-[#667991]">{label}</p>
                <p className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-2.5 inline-flex w-fit items-center gap-2 border border-[#c9d8ee] bg-white px-3.5 py-2 font-mono text-[12px] text-[#5f6f86]">
            <span className="text-[#8a9ab1]">$</span>
            <span>npm install @memoryostm/sdk</span>
            <span className="text-[#a1b1c7]">TypeScript • Python • REST</span>
          </div>

          <div className="mt-4 flex max-w-[620px] flex-wrap gap-2">
            {[
              "Developer memory graph",
              "Team memory workspaces",
              "Timeline + revisions",
              "Dashboard + trust controls",
              "MCP + agent integrations",
            ].map((item) => (
              <span
                key={item}
                className="border border-[#c7d7ee] bg-white px-3 py-1.5 text-[12px] text-[#456180]"
              >
                {item}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="grid place-items-center">
          <div className="relative aspect-square w-full max-w-[360px] overflow-hidden">
            <HeroBrainCyberCanvas className="h-full w-full" src="/braine.png" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

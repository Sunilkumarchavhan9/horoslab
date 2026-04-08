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
            DEVELOPER MEMORY INFRASTRUCTURE
          </p>
          <h1 className="max-w-[620px] text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-slate-900 md:text-5xl lg:text-[56px]">
            The memory layer for software agents, IDEs, and long-running developer workflows
          </h1>

          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.5] text-[#5f6f86] md:text-[16px]">
            MemoryOS turns real engineering work into durable context. It stores developer preferences,
            project state, bug history, architectural decisions, and evolving technical knowledge so
            agents can resume work with context that is visible, shared, and trusted.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="#context-stack"
              className="bg-[#2166f3] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0f56de]"
            >
              Start Building →
            </a>
            <a
              href="#developer-experience"
              className="border border-[#c9d8ee] bg-white px-5 py-2.5 text-[15px] font-medium text-slate-800"
            >
              See setup flow
            </a>
          </div>

          <p className="mt-3 max-w-[560px] text-[15px] text-[#5e6f85]">
            Built for developer profiles, continuity retrieval, evolving memory, trustable recall,
            and shared project memory across Claude, ChatGPT, Cursor, VS Code, internal copilots,
            and multi-agent development stacks.
          </p>

          <div className="mt-2.5 inline-flex w-fit items-center gap-2 border border-[#c9d8ee] bg-white px-3.5 py-2 font-mono text-[12px] text-[#5f6f86]">
            <span className="text-[#8a9ab1]">$</span>
            <span>npm install @memoryos/sdk</span>
            <span className="text-[#a1b1c7]">typescript • python • rest</span>
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

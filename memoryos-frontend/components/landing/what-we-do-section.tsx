import { Reveal } from "./motion";

export function WhatWeDoSection() {
  return (
    <section>
      <Reveal className="border-b border-[#c9d8ee] px-5 py-8 text-center md:px-7 md:py-10">
        <h2
          className="mx-auto max-w-5xl text-3xl font-semibold leading-[1.14] tracking-[-0.035em] text-slate-900 md:text-5xl"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          <span>Developer work in.</span>{" "}
          <span className="inline-flex h-[0.62em] min-h-[20px] items-center justify-center rounded-md bg-[#2166f3] px-2 align-[0.08em] text-[0.42em] font-semibold leading-none text-white">
            ✶
          </span>{" "}
          <span className="text-[#2166f3]">Memory lifecycle runs.</span>
          <br />
          <span>Context stays recoverable across agents.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-4xl text-[11px] leading-[1.55] text-slate-600 md:text-[13px]">
          MemoryOS turns messy technical conversations into structured developer memory, retrieves
          the right context when work resumes, and keeps a visible trail of what changed.
        </p>
      </Reveal>

      <div className="grid border-b border-[#c9d8ee] lg:grid-cols-2">
        <Reveal className="border-b border-[#c9d8ee] bg-white [background-image:radial-gradient(rgba(33,102,243,0.16)_0.8px,transparent_0.8px)] [background-size:18px_18px] px-5 py-7 md:px-7 md:py-9 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#2166f3]">FOR DEVELOPERS &amp; TEAMS</p>
          <h3 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[30px]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}>A memory layer for real coding sessions</h3>
          <p className="mt-4 max-w-[680px] text-[12px] leading-[1.6] text-slate-600 md:text-[14px]">
            MemoryOS is designed for developer workflows where preference, project state, bug history,
            and prior decisions need to survive across threads, tools, and model sessions.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-slate-900">
            <div>
              <p className="text-4xl font-semibold tracking-[-0.03em]">PROCESS</p>
              <p className="mt-1 text-sm text-slate-600">extract + score + merge/evolve</p>
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-[-0.03em]">RETRIEVE</p>
              <p className="mt-1 text-sm text-slate-600">semantic + type + importance + recency</p>
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-[-0.03em]">TRUST</p>
              <p className="mt-1 text-sm text-slate-600">timeline + revisions + explain</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] text-slate-700">Developer profile + continuity retrieval + memory evolution + trust layer</p>
            <a
            href="#under-the-hood"
            className="mt-7 inline-flex w-full items-center justify-center bg-gradient-to-r from-[#1158df] to-[#246dfc] px-4 py-3 text-[16px] font-semibold text-white"
          >
            Explore the engine →
          </a>
        </Reveal>

        <Reveal delay={0.08} className="bg-[#faf8f5] px-5 py-7 md:px-7 md:py-9">
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#a55f21]">PLATFORM SURFACE</p>
          <h3 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[30px]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}>One memory API for the full developer loop</h3>
          <p className="mt-4 max-w-[680px] text-[12px] leading-[1.6] text-slate-600 md:text-[14px]">
            MemoryOS exposes focused routes to write memory, recover context, continue work,
            and inspect why a memory was saved, changed, or recalled.
          </p>
          <div className="mt-6 border-y border-[#c9d8ee]">
            <div className="flex items-center justify-between border-b border-[#c9d8ee] py-3">
              <span className="text-[18px] font-medium text-slate-900 md:text-[15px]">Write memory</span>
              <span className="text-[15px] text-slate-600 md:text-[11px]">/process + status + archive controls</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#c9d8ee] py-3">
              <span className="text-[18px] font-medium text-slate-900 md:text-[15px]">Recover context</span>
              <span className="text-[15px] text-slate-600 md:text-[11px]">/retrieve + /continue + /resume</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[18px] font-medium text-slate-900 md:text-[15px]">Inspect trust</span>
              <span className="text-[15px] text-slate-600 md:text-[11px]">/timeline + /revisions + /explain</span>
            </div>
          </div>
          <p className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-slate-900 md:text-xl">
            Developer memory, continuity planners, trust history, and integration-ready APIs in one system
          </p>
          <a
            href="#developer-experience"
            className="mt-7 inline-flex w-full items-center justify-center bg-[#9b4a13] px-4 py-3 text-[16px] font-semibold text-white"
          >
            View integration flow →
          </a>
        </Reveal>
      </div>

      <div className="grid border-b border-[#c9d8ee] md:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "AGENT MEMORY",
            "Persistent context for coding agents",
            "Preferences, project state, bug history, and prior decisions stay available across sessions.",
          ],
          [
            "TEAM MEMORY",
            "Shared workspace intelligence",
            "MemoryOS stores project-level memory so teams and agents can resume work with the same context model.",
          ],
          [
            "TRUST LAYER",
            "Every memory is inspectable",
            "Explain, timeline, and revisions turn memory recall into something developers can verify and debug.",
          ],
          [
            "CONTROL SURFACE",
            "Dashboard, APIs, and policies",
            "Search, archive, review, and govern memory through the MemoryOS dashboard and unified API surface.",
          ],
        ].map(([eyebrow, title, body], index) => (
          <Reveal
            key={title}
            delay={index * 0.04}
            className="border-b border-[#c9d8ee] px-5 py-5 md:border-r md:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0"
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#356acc]">{eyebrow}</p>
            <h4 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h4>
            <p className="mt-2 text-[14px] leading-6 text-[#5a6d88]">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

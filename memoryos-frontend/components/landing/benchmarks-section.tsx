import { Reveal } from "./motion";

const COMPARISON_ROWS = [
  ["Developer profile memory", "Deep, structured, evolving", "Fragmented or session-bound", "Usually flat recall"],
  ["Cross-session resume", "Built into retrieval + resume flows", "Often manual or partial", "Usually search-only"],
  ["Trust + explainability", "Timeline, revisions, explain", "Limited visibility", "Rarely first-class"],
  ["Shared workspaces", "Team and project memory", "Mostly user-local", "Often integration-specific"],
  ["Control plane", "Dashboard, archive, review, inspect", "Minimal memory controls", "Admin-heavy or absent"],
  ["Integration surface", "SDKs, REST, MCP, IDEs, agents", "One or two interfaces", "API-first but less workflow-native"],
];

function CapabilityCell({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "strong" | "muted";
}) {
  const toneClass =
    tone === "strong"
      ? "text-slate-900 font-semibold"
      : tone === "muted"
        ? "text-[#70819b]"
        : "text-[#556983]";

  return (
    <div className={`border-b border-[#d3deef] px-4 py-4 text-[14px] leading-6 ${toneClass}`}>
      {children}
    </div>
  );
}

export function BenchmarksSection() {
  return (
    <section className="border-b border-[#c9d8ee] px-5 py-7">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl">
          Built to replace session memory, not just store notes
        </h2>
        <p className="mx-auto mt-3 max-w-4xl text-center text-base text-slate-600 md:text-lg">
          MemoryOS combines developer memory, retrieval, trust, and shared workspace controls in one
          system. The product is designed to feel closer to infrastructure than a thin memory add-on.
        </p>
      </Reveal>

      <div className="mx-auto mt-6 grid max-w-[1080px] gap-3 md:grid-cols-3">
        {[
          [
            "WHY TEAMS SWITCH",
            "Session-only agents lose architectural decisions, debugging history, and stack preferences too easily.",
          ],
          [
            "WHAT MEMORYOS ADDS",
            "A persistent developer profile, continuity retrieval, explainable memory recall, and shared project workspaces.",
          ],
          [
            "WHAT CHANGES",
            "Less repeated prompting, cleaner handoffs, faster resume, and a visible memory layer that teams can trust.",
          ],
        ].map(([title, body], index) => (
          <Reveal
            key={title}
            delay={index * 0.04}
            className="border border-[#c9d8ee] bg-white p-5"
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#356acc]">{title}</p>
            <p className="mt-3 text-[15px] leading-7 text-[#556983]">{body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.08} className="mx-auto mt-7 max-w-[1120px] overflow-hidden border border-[#c9d8ee] bg-white">
        <div className="grid grid-cols-[1.15fr_1fr_1fr_1fr] border-b border-[#c9d8ee] bg-white">
          <div className="px-4 py-4" />
          <div className="border-l border-[#d3deef] px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#356acc]">MEMORYOS</p>
            <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Developer memory platform</p>
          </div>
          <div className="border-l border-[#d3deef] px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#7f8fa7]">SESSION AGENTS</p>
            <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Context resets often</p>
          </div>
          <div className="border-l border-[#d3deef] px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#7f8fa7]">GENERIC MEMORY TOOLS</p>
            <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Usually storage-first</p>
          </div>
        </div>

        {COMPARISON_ROWS.map(([capability, memoryOs, sessionAgents, genericTools]) => (
          <div
            key={capability}
            className="grid grid-cols-[1.15fr_1fr_1fr_1fr] bg-white"
          >
            <CapabilityCell tone="strong">{capability}</CapabilityCell>
            <div className="border-l border-[#d3deef]">
              <CapabilityCell>{memoryOs}</CapabilityCell>
            </div>
            <div className="border-l border-[#d3deef]">
              <CapabilityCell tone="muted">{sessionAgents}</CapabilityCell>
            </div>
            <div className="border-l border-[#d3deef]">
              <CapabilityCell tone="muted">{genericTools}</CapabilityCell>
            </div>
          </div>
        ))}
      </Reveal>

      <div className="mx-auto mt-5 grid max-w-[1080px] gap-3 md:grid-cols-4">
        {[
          ["SDKs", "TypeScript, Python, and REST for product teams and internal platforms."],
          ["Trust", "Timeline, revisions, and explainability built into the platform surface."],
          ["Workspaces", "Shared memory for teams, projects, copilots, and multi-agent systems."],
          ["Observability", "Metrics, health checks, and inspectable memory behavior."],
        ].map(([title, body], index) => (
          <Reveal
            key={title}
            delay={index * 0.04}
            className="border border-[#c9d8ee] bg-white p-4"
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#356acc]">{title}</p>
            <p className="mt-2 text-[14px] leading-6 text-[#556983]">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

"use client";

const STAT_CARDS = [
  { label: "Memories Stored", value: "0", accent: "#4f93ff" },
  { label: "Resume Runs", value: "0", accent: "#14c38e" },
  { label: "Retrieve Requests", value: "0", accent: "#9b7bff" },
  { label: "Handoffs Generated", value: "0", accent: "#f0b429" },
  { label: "Active Projects", value: "0", accent: "#4f93ff" },
] as const;

const ACTION_CARDS = [
  {
    title: "Quick Start",
    copy: "Set up MemoryOS in your app or agent loop",
    accent: "#4f93ff",
  },
  {
    title: "Run Demo",
    copy: "See retrieve, resume, and handoff in action",
    accent: "#14c38e",
  },
  {
    title: "Playground",
    copy: "Test continuity flows interactively",
    accent: "#9b7bff",
  },
  {
    title: "Documentation",
    copy: "Read the SDK, MCP, and API quickstart",
    accent: "#f0b429",
  },
] as const;

type ActionCardTitle = (typeof ACTION_CARDS)[number]["title"];
type OverviewActionHandlers = Partial<Record<ActionCardTitle, () => void>>;

type OverviewSectionProps = {
  actions?: OverviewActionHandlers;
};

function ActionIcon({ title }: { title: ActionCardTitle }) {
  if (title === "Quick Start") {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 7.5h11M9 3.5l4 4-4 4" />
      </svg>
    );
  }
  if (title === "Run Demo") {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3.5,2.5 12,7.5 3.5,12.5" />
      </svg>
    );
  }
  if (title === "Playground") {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" />
        <rect x="9" y="1.5" width="4.5" height="4.5" rx="1" />
        <rect x="1.5" y="9" width="4.5" height="4.5" rx="1" />
        <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 2H2v11h11V8.5M8.5 2H13v4.5M13 2L6.5 8.5" />
    </svg>
  );
}

export function OverviewSection({ actions }: OverviewSectionProps) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.05em]">Overview</h1>
          <p className="mt-1 text-[13px] text-white/40">Workspace usage and continuity metrics at a glance.</p>
        </div>
        <div className="flex items-center gap-2 rounded-[8px] border border-[#14c38e]/25 bg-[#14c38e]/6 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14c38e]" />
          <span className="text-[11px] font-medium tracking-[0.06em] text-[#8ce6c7]">WORKSPACE ACTIVE</span>
        </div>
      </div>

      <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-[8px] border border-white/10 bg-[#161616] px-5 py-4"
            style={{ borderTopColor: card.accent, borderTopWidth: "2px" }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/36">{card.label}</p>
            <p className="mt-2.5 text-[28px] font-semibold tracking-[-0.05em]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">Build with MemoryOS</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          {ACTION_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={actions?.[card.title]}
              className="group cursor-pointer rounded-[8px] border border-white/10 bg-[#161616] px-5 py-4.5 transition-colors hover:border-white/18 hover:bg-[#1b1b1b]"
              style={{ borderTopColor: card.accent, borderTopWidth: "2px" }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[15px] font-semibold tracking-[-0.03em]">{card.title}</p>
                <span
                  className="mt-0.5 shrink-0 transition-all group-hover:translate-x-0.5"
                  style={{ color: card.accent, opacity: 0.6 }}
                >
                  <ActionIcon title={card.title} />
                </span>
              </div>
              <p className="mt-1.5 text-left text-[13px] leading-5 text-white/40">{card.copy}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[10px] border border-white/8 bg-[#141414] px-5 py-4.5">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
            <circle cx="6.5" cy="6.5" r="5" />
            <path d="M6.5 4v3.5h2.5" />
          </svg>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/30">Getting started</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["1", "Install the SDK", "npm install @memoryostm/sdk", "#4f93ff"],
            ["2", "Initialize a client", "createMemoryOSClient({ apiKey })", "#9b7bff"],
            ["3", "Start saving context", "client.afterModel({ ... })", "#14c38e"],
          ].map(([step, label, code, accent]) => (
            <div key={step} className="flex items-start gap-3 rounded-[8px] border border-white/8 bg-[#0f0f0f] px-3.5 py-3.5">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: `${accent}22`, color: accent }}
              >
                {step}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white/76">{label}</p>
                <p className="mt-1 truncate font-mono text-[11px] text-white/36">{code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

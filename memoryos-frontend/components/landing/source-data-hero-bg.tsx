"use client";

import { cn } from "@/lib/utils";

const SOURCE_WORDS = [
  "commits", "pull requests", "codebase context", "risky files", "bug fixes", "repo history", "failed fixes", "code ownership", "merged PRs", "broken tests", "deploy diffs", "architecture drift",
  "decisions", "blockers", "team context", "incident discussion", "launch notes", "customer pain", "product debate", "why changed", "who approved", "decision trail",
  "tasks", "sprint", "roadmap", "priority", "shipped work", "backlog", "execution state", "owner", "current work", "next action",
  "tickets", "bug lifecycle", "issue links", "delivery history", "release notes", "incident links", "root cause", "reproduction steps", "acceptance criteria",
  "docs", "architecture notes", "project plans", "system design", "company knowledge", "product strategy", "team notes", "approved context",
  "runbooks", "policies", "API rules", "architecture", "onboarding", "internal docs", "engineering playbooks", "safe changes", "approved instructions",
  "outages", "rollback", "prevention", "postmortem", "failure pattern", "alert", "production risk", "incident memory", "recovery steps",
  "failed attempt", "successful run", "agent mistake", "outcome", "lesson", "reusable skill", "proof chain", "memory ignition", "mistake immunity", "inherited context"
];

// Shuffle words deterministically for visual variety across rows
const shuffle = (array: string[], seed: number) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(seed + i)) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const CARDS = [
  {
    title: "GitHub",
    learns: "commits, PRs, bug fixes, risky files, code ownership",
    becomes: "repo context, implementation patterns, failure history",
    inherits: "codebase context, risky files, previous fixes, approved engineering patterns",
    avoids: "breaking old logic, touching dangerous files blindly, repeating failed fixes"
  },
  {
    title: "Slack",
    learns: "team discussions, decisions, blockers, incidents",
    becomes: "decision history, team context, why something changed",
    inherits: "the reasoning behind decisions, not just final code",
    avoids: "asking the same questions again or reversing past decisions"
  },
  {
    title: "Linear",
    learns: "tasks, roadmap, priorities, sprint work",
    becomes: "execution context, priority memory, current work state",
    inherits: "what matters now, what is blocked, and what should be worked on next",
    avoids: "working on outdated or low-priority tasks"
  },
  {
    title: "Jira",
    learns: "tickets, incident links, bug lifecycle, delivery history",
    becomes: "delivery memory, issue patterns, team workflow memory",
    inherits: "how work moved from issue to shipped fix",
    avoids: "solving the wrong bug or missing linked context"
  },
  {
    title: "Notion",
    learns: "docs, architecture notes, project plans, team knowledge",
    becomes: "approved company knowledge and system memory",
    inherits: "company-specific context before acting",
    avoids: "guessing from generic prompts"
  },
  {
    title: "Docs",
    learns: "architecture, runbooks, policies, API rules",
    becomes: "approved knowledge, system rules, company playbooks",
    inherits: "trusted instructions before execution",
    avoids: "outdated assumptions and unsafe changes"
  },
  {
    title: "Incidents",
    learns: "outages, root causes, fixes, prevention steps",
    becomes: "incident memory, risk signals, prevention skills",
    inherits: "what failed before and what not to repeat",
    avoids: "repeating production mistakes"
  },
  {
    title: "Agent Runs",
    learns: "failed attempts, successful actions, mistakes, outcomes",
    becomes: "experience records, reusable skills, mistake immunity",
    inherits: "what previous agents tried, what worked, what failed, and why",
    avoids: "repeating the same AI agent mistakes again"
  }
];

const LEFT_CARDS = CARDS.filter((_, i) => i % 2 === 0);
const RIGHT_CARDS = CARDS.filter((_, i) => i % 2 !== 0);

function SourceCard({ card }: { card: typeof CARDS[0] }) {
  return (
    <div className="w-[300px] sm:w-[340px] bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-md p-5 shrink-0 transition-transform hover:scale-[1.02]">
      <h3 className="font-black text-[15px] text-slate-900 mb-3 flex items-center gap-2">
        {card.title}
      </h3>
      <div className="space-y-2.5 text-[12px] leading-relaxed">
        <p><span className="font-bold text-slate-700">Learns:</span> <span className="text-slate-600">{card.learns}</span></p>
        <p><span className="font-bold text-slate-700">Becomes:</span> <span className="text-slate-600">{card.becomes}</span></p>
        <p><span className="font-bold text-[#0015FF]">Future agents inherit:</span> <span className="text-slate-700 font-medium">{card.inherits}</span></p>
        <p><span className="font-bold text-amber-600">Avoids:</span> <span className="text-slate-700 font-medium">{card.avoids}</span></p>
      </div>
    </div>
  );
}

export function SourceDataHeroBg() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-white z-0 flex flex-col justify-center">
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        @keyframes marquee-up {
          0% { transform: translateY(0%); }
          100% { transform: translateY(-50%); }
        }
        @keyframes marquee-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0%); }
        }
        .animate-marquee-left { animation: marquee-left 120s linear infinite; }
        .animate-marquee-right { animation: marquee-right 120s linear infinite; }
        .animate-marquee-up { animation: marquee-up 60s linear infinite; }
        .animate-marquee-down { animation: marquee-down 60s linear infinite; }
        .mask-vertical {
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
      `}</style>

      {/* TEXT ROWS (BACKGROUND) */}
      <div className="absolute inset-0 flex flex-col justify-between py-10 opacity-30 select-none pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => {
          const isLeft = i % 2 === 0;
          const words = shuffle(SOURCE_WORDS, i).slice(0, 25).join("  •  ");
          // Duplicate for seamless loop
          const rowText = `${words}  •  ${words}`;

          return (
            <div key={i} className="flex whitespace-nowrap overflow-hidden">
              <div 
                className={cn(
                  "text-[28px] sm:text-[36px] font-black uppercase tracking-tight text-slate-300",
                  isLeft ? "animate-marquee-left" : "animate-marquee-right"
                )}
                style={{ 
                  animationDuration: `${100 + (i * 10)}s`,
                  opacity: Math.max(0.2, 1 - Math.abs(i - 5.5) * 0.15) // Fade out top/bottom rows slightly
                }}
              >
                {rowText}
              </div>
            </div>
          );
        })}
      </div>

      {/* GRADIENT MASKS TO FADE EDGES */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80 pointer-events-none" />

      {/* FLOATING CARDS (LEFT & RIGHT) */}
      <div className="absolute inset-y-0 left-0 lg:left-8 w-[300px] sm:w-[340px] hidden md:flex flex-col overflow-hidden opacity-90 z-10 mask-vertical">
        <div className="animate-marquee-up flex flex-col gap-6 py-6 h-max">
          {[...LEFT_CARDS, ...LEFT_CARDS].map((card, i) => (
            <SourceCard key={i} card={card} />
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 right-0 lg:right-8 w-[300px] sm:w-[340px] hidden md:flex flex-col overflow-hidden opacity-90 z-10 mask-vertical">
        <div className="animate-marquee-down flex flex-col gap-6 py-6 h-max">
          {[...RIGHT_CARDS, ...RIGHT_CARDS].map((card, i) => (
            <SourceCard key={i} card={card} />
          ))}
        </div>
      </div>

    </div>
  );
}



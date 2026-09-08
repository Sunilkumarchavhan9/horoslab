import { Reveal } from "./motion";
import { NavAsciiTile } from "./nav-ascii-tile";
import type { NavAsciiVariant } from "@/lib/nav-ascii-variants";

const LOGO_PLACEHOLDERS = [
  "Design partner slot",
  "Platform engineering team",
  "Internal AI workspace",
  "Your company mark",
];

const HERO_ASCII = {
  id: "01",
  variant: "mesh" as NavAsciiVariant,
  searchTerms: [
    "retrieve",
    "handoff",
    "workspace",
    "timeline",
    "topK:8",
    "memory.match",
    "process",
    "resume",
  ],
};

const ENTERPRISE_TILES = [
  {
    id: "02",
    variant: "stack" as const,
    searchTerms: ["vpc-ready", "workspace", "retention", "self-host", "deploy"],
    title: "Deploy in your stack",
    body:
      "Run MemoryOS behind cloud agents, local model runners, agent frameworks, and internal tools with workspace-level control over memory scope and retention.",
    tags: ["VPC-ready", "workspace isolation", "self-host options"],
  },
  {
    id: "03",
    variant: "orbit" as const,
    searchTerms: ["timeline", "revision", "explain", "audit", "surface"],
    title: "Audit every memory decision",
    body:
      "Timeline, revisions, and memory explainability give teams a clear record of what changed, why it changed, and what was surfaced to agents.",
    tags: ["timeline", "revisions", "memory explain"],
  },
  {
    id: "04",
    variant: "bloom" as const,
    searchTerms: ["export", "searchable", "company-brain", "shared", "visible"],
    title: "Own your company brain",
    body:
      "Keep developer knowledge inside your product stack. Project memory stays searchable, exportable, and visible to the teams that rely on it.",
    tags: ["export control", "shared memory", "team visibility"],
  },
];

export function EnterpriseSection() {
  return (
    <section className="border-b border-[#c9d8ee] bg-white">
      <Reveal className="px-5 py-12 text-center lg:px-7 lg:py-16">
        <h2 className="mx-auto max-w-[900px] text-[34px] font-semibold tracking-[-0.05em] text-slate-900 md:text-[54px]">
          Production memory infrastructure for serious teams
        </h2>
        <p className="mx-auto mt-5 max-w-[860px] text-[16px] leading-[1.7] text-[#6a778a] md:text-[19px]">
          MemoryOS is built for platform teams and agent products that need durable shared context,
          interoperability, and governance without slowing engineering velocity. This is an execution
          layer for agents, not a document chatbot or static search index.
        </p>
      </Reveal>

      <Reveal delay={0.05} className="border-t border-[#c9d8ee] px-5 py-8 lg:px-7">
        <p className="text-center font-mono text-[13px] tracking-[0.22em] text-[#243f67]">
          DESIGN PARTNERS AND TEAM WALL
        </p>

        <div className="mt-6 grid border border-[#c9d8ee] bg-white sm:grid-cols-2 lg:grid-cols-4">
          {LOGO_PLACEHOLDERS.map((item, index) => (
            <div
              key={item}
              className={`grid min-h-[112px] place-items-center px-6 py-8 text-center text-[17px] text-[#7b8798] ${
                index < LOGO_PLACEHOLDERS.length - 1 ? "border-b border-[#c9d8ee] sm:border-b-0 sm:border-r lg:border-r" : ""
              }`}
            >
              <div className="w-full max-w-[220px] border border-dashed border-[#bfd0ea] px-4 py-6 font-mono text-[13px] tracking-[0.12em] text-[#7f8da3]">
                {item}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[14px] text-[#6f7d91]">
          When customer teams go live, this wall can switch from placeholders to real deployment
          marks, design partners, or platform groups.
        </p>
      </Reveal>

      {/* Wireframe layout: hero ASCII → three tiles → three text columns */}
      <div className="border-t border-[#c9d8ee]">
        <Reveal delay={0.06} className="border-b border-[#c9d8ee] px-5 py-6 lg:px-7 lg:py-8">
          <div className="h-[200px] w-full sm:h-[240px] md:h-[280px] lg:h-[300px]">
            <NavAsciiTile
              variant={HERO_ASCII.variant}
              active
              smoothMotion
              speed={1.15}
              searchTerms={HERO_ASCII.searchTerms}
              className="h-full w-full"
            />
          </div>
        </Reveal>

        <div className="grid border-b border-[#c9d8ee] lg:grid-cols-3">
          {ENTERPRISE_TILES.map((tile, index) => (
            <Reveal
              key={tile.id}
              delay={0.08 + index * 0.04}
              className={index < 2 ? "border-b border-[#c9d8ee] lg:border-b-0 lg:border-r" : ""}
            >
              <div className="px-5 py-6 lg:px-7 lg:py-7">
                <div className="h-[120px] w-full sm:h-[132px]">
                  <NavAsciiTile
                    variant={tile.variant}
                    active
                    smoothMotion
                    speed={1.65 + index * 0.12}
                    searchTerms={tile.searchTerms}
                    className="h-full w-full"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid lg:grid-cols-3">
          {ENTERPRISE_TILES.map((tile, index) => (
            <Reveal
              key={`${tile.id}-copy`}
              delay={0.1 + index * 0.04}
              className={index < 2 ? "border-b border-[#c9d8ee] lg:border-b-0 lg:border-r" : ""}
            >
              <div className="h-full px-7 py-8">
                <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                  {tile.title}
                </h3>
                <p className="mt-3 max-w-[360px] text-[15px] leading-7 text-[#6a778a]">
                  {tile.body}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {tile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[#c9d8ee] bg-white px-3 py-1.5 text-[13px] text-[#27466e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal delay={0.14} className="border-t border-[#c9d8ee] px-5 py-7 lg:px-7">
        <div className="mx-auto grid max-w-[1120px] gap-4 border border-[#c9d8ee] bg-[#f6f9ff] p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#356acc]">ENTERPRISE ROLLOUT</p>
            <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
              Launch MemoryOS with your platform team
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[#61738d]">
              We help teams scope memory contracts, rollout sequence, governance policies, and first continuity benchmark baselines.
            </p>
          </div>
          <a
            href="#contact"
            className="inline-flex min-w-[190px] items-center justify-center bg-[hsl(var(--primary))] px-6 py-3 text-[14px] font-medium text-[#F0EFE2]"
          >
            Request enterprise intro →
          </a>
        </div>
      </Reveal>
    </section>
  );
}

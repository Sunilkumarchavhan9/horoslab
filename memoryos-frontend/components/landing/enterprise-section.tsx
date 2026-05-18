import { Reveal } from "./motion";

const LOGO_PLACEHOLDERS = [
  "Design partner slot",
  "Platform engineering team",
  "Internal AI workspace",
  "Your company mark",
];

const ENTERPRISE_CARDS = [
  {
    title: "Deploy in your stack",
    body:
      "Run MemoryOS behind cloud agents, local model runners, agent frameworks, and internal tools with workspace-level control over memory scope and retention.",
    tags: ["VPC-ready", "workspace isolation", "self-host options"],
  },
  {
    title: "Audit every memory decision",
    body:
      "Timeline, revisions, and memory explainability give teams a clear record of what changed, why it changed, and what was surfaced to agents.",
    tags: ["timeline", "revisions", "memory explain"],
  },
  {
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

      <div className="grid border-t border-[#c9d8ee] lg:grid-cols-3">
        {ENTERPRISE_CARDS.map((card, index) => (
          <Reveal key={card.title} delay={0.08 + index * 0.04} className={index < 2 ? "border-b border-[#c9d8ee] lg:border-b-0 lg:border-r" : "border-b border-[#c9d8ee] lg:border-b-0"}>
            <div className="h-full px-7 py-9">
              <div className="grid h-12 w-12 place-items-center bg-white text-[hsl(var(--primary))]">
                <span className="text-[22px]">{index === 0 ? "⌂" : index === 1 ? "◎" : "↓"}</span>
              </div>
              <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                {card.title}
              </h3>
              <p className="mt-3 max-w-[320px] text-[15px] leading-7 text-[#6a778a]">
                {card.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {card.tags.map((tag) => (
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

      <Reveal delay={0.14} className="border-t border-[#c9d8ee] px-5 py-7 lg:px-7">
        <div className="mx-auto grid max-w-[1040px] gap-4 border border-[#c9d8ee] bg-[#f6f9ff] p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#356acc]">ENTERPRISE ROLLOUT</p>
            <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
              Launch MemoryOS with your platform team
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[#61738d]">
              We help teams scope memory contracts, rollout sequence, governance policies, and first
              continuity benchmark baselines.
            </p>
          </div>
          <a
            href="#contact"
            className="inline-flex min-w-[190px] items-center justify-center bg-[hsl(var(--primary))] px-6 py-3 text-[14px] font-medium text-white"
          >
            Request enterprise intro →
          </a>
        </div>
      </Reveal>
    </section>
  );
}

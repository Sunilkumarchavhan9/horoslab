import { Reveal } from "./motion";

const PLAN_CARDS = [
  {
    tier: "STARTER",
    price: "$0",
    suffix: "",
    description: "For developers validating memory contracts and continuity loops in personal workflows.",
    features: [
      "1M tokens/month",
      "10K search queries/month",
      "1 workspace",
      "Core memory processing",
      "Email support",
    ],
    cta: "Start free →",
    secondary: "Explore the docs →",
    ctaHref: "/developer-console/sign-in",
    secondaryHref: "#developer-experience",
    featured: false,
  },
  {
    tier: "PRO",
    price: "$19",
    suffix: "/mo.",
    description: "For active builders running MemoryOS in daily multi-agent and model workflows.",
    features: [
      "3M tokens/month",
      "100K search queries/month",
      "Unlimited personal projects",
      "Resume + retrieve + continue",
      "Priority email support",
    ],
    cta: "Get MemoryOS Pro →",
    secondary: "Install the SDK →",
    ctaHref: "/developer-console/sign-in",
    secondaryHref: "#developer-experience",
    featured: true,
  },
  {
    tier: "SCALE",
    price: "$399",
    suffix: "/mo.",
    description: "For teams running shared company memory across products, internal agents, and workspaces.",
    features: [
      "80M tokens/month",
      "20M search queries/month",
      "Shared workspaces",
      "Team memory graph",
      "Dedicated support channel",
    ],
    cta: "Talk to sales →",
    secondary: "See platform details →",
    ctaHref: "#contact",
    secondaryHref: "#enterprise",
    featured: false,
  },
];

const ENTERPRISE_POINTS = [
  "Private deployment options",
  "SSO and access controls",
  "Custom retention and audit policies",
  "Deployment and onboarding support",
];

export function PricingSection() {
  return (
    <section className="border-b border-[#c9d8ee] bg-white">
      <Reveal className="px-5 py-10 text-center lg:px-7 lg:py-14">
        <h2 className="mx-auto max-w-[860px] text-[30px] font-semibold tracking-[-0.05em] text-slate-900 md:text-[44px]">
          Pricing for production continuity infrastructure
        </h2>
        <p className="mx-auto mt-4 max-w-[820px] text-[15px] leading-[1.7] text-[#6a778a] md:text-[16px]">
          One platform for memory contracts, injected context visibility, interoperability, governance,
          and team workspaces. Start free, scale with usage, and move to enterprise deployment when needed.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-slate-900 md:text-[14px]">
          <span className="inline-flex items-center gap-2">
            <span className="text-[#18b45b]">✓</span>
            Timeline + revisions + explainability in paid plans
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="text-[#18b45b]">✓</span>
            SDK + HTTP + MCP interoperability
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="text-[#18b45b]">✓</span>
            Built for cross-agent engineering teams
          </span>
        </div>
      </Reveal>

      <div className="grid border-t border-[#c9d8ee] lg:grid-cols-3">
        {PLAN_CARDS.map((plan, index) => (
          <Reveal
            key={plan.tier}
            delay={0.03 * index}
            className={index < 2 ? "border-b border-[#c9d8ee] lg:border-b-0 lg:border-r" : "border-b border-[#c9d8ee] lg:border-b-0"}
          >
            <div className="flex h-full flex-col px-7 py-7">
              <p className="font-mono text-[11px] tracking-[0.2em] text-[hsl(var(--primary))]">{plan.tier}</p>
              <div className="mt-4 flex items-end gap-1 text-slate-900">
                <span className="text-[38px] font-semibold tracking-[-0.05em] md:text-[42px]">{plan.price}</span>
                {plan.suffix ? (
                  <span className="pb-2 text-[14px] font-semibold">{plan.suffix}</span>
                ) : null}
              </div>
              <p className="mt-3 max-w-[320px] text-[14px] leading-6 text-[#61738d] md:text-[15px]">
                {plan.description}
              </p>

              <div className="mt-5 grid gap-3 text-[14px] leading-6 text-slate-900 md:text-[15px]">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3">
                    <span className="mt-1 text-[#111827]">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 space-y-3">
                <a
                  href={plan.ctaHref}
                  className={`inline-flex w-full items-center justify-center px-4 py-3 text-[14px] font-medium transition md:text-[15px] ${plan.featured
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border border-[#c9d8ee] bg-white text-slate-900"
                    }`}
                >
                  {plan.cta}
                </a>
                <a
                  href={plan.secondaryHref}
                  className="block text-center text-[12px] text-[#6b7c95] transition hover:text-slate-900 md:text-[13px]"
                >
                  {plan.secondary}
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid border-t border-[#c9d8ee] lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="border-b border-[#c9d8ee] px-7 py-7 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[11px] tracking-[0.2em] text-[hsl(var(--primary))]">ENTERPRISE</p>
          <h3 className="mt-4 text-[32px] font-semibold tracking-[-0.05em] text-slate-900 md:text-[36px]">
            Custom
          </h3>
          <p className="mt-3 max-w-[430px] text-[14px] leading-6 text-[#61738d] md:text-[15px]">
            For companies that need custom deployment, deeper governance, or a dedicated rollout
            path for internal AI products.
          </p>
          <div className="mt-5 grid gap-3 text-[14px] leading-6 text-slate-900 md:text-[15px]">
            {ENTERPRISE_POINTS.map((point) => (
              <div key={point} className="flex gap-3">
                <span className="mt-1 text-[#111827]">✓</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
          <a
            href="mailto:chavhansunilkumar753@gmail.com"
            className="mt-7 inline-flex w-full max-w-[270px] items-center justify-center whitespace-nowrap border border-[#c9d8ee] bg-white px-10 py-3 text-[14px] font-medium text-slate-900 md:text-[15px]"
          >
            Talk to founder →
          </a>
        </Reveal>

        <Reveal delay={0.05} className="px-7 py-7">
          <p className="font-mono text-[11px] tracking-[0.2em] text-[hsl(var(--primary))]">
            PLATFORM NOTES
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="border border-[#c9d8ee] bg-white px-5 py-4">
              <p className="text-[14px] text-[#61738d]">Overage</p>
              <p className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-slate-900">
                Usage-based
              </p>
              <p className="text-[13px] text-[#61738d]">Scales with storage, retrieval, and team load.</p>
            </div>
            <div className="border border-[#c9d8ee] bg-white px-5 py-4">
              <p className="text-[14px] text-[#61738d]">Support</p>
              <p className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-slate-900">
                Human
              </p>
              <p className="text-[13px] text-[#61738d]">Direct onboarding help for production teams.</p>
            </div>
          </div>

          <p className="mt-4 text-[13px] leading-6 text-[#61738d]">
            Pricing can be tuned around seats, workspace count, deployment model, and memory
            volume. The right structure depends on how your agents and engineering teams actually
            use MemoryOS.
          </p>

          <div className="mt-5 border border-[#c9d8ee]  px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[20px]">
                  Startup program
                </p>
                <p className="mt-2 text-[13px] text-[#61738d]">
                  Early product teams can get guided setup, feedback calls, and launch support.
                </p>
              </div>
              <a
                href="#contact"
                className="inline-flex min-w-[164px] items-center justify-center whitespace-nowrap bg-blue-600 hover:bg-blue-700 transition-colors px-7 py-3 text-[13px] font-medium text-white md:text-[14px]"
              >
                Apply now →
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


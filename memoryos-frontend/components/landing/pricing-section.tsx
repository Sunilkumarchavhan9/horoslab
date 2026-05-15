import { Reveal } from "./motion";
import { PLAN_CATALOG, formatLimit } from "@/lib/plan-catalog";

const polarProCheckoutUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_PRO?.trim() || process.env.NEXT_PUBLIC_CHECKOUT_URL_PRO?.trim() || "";
const polarScaleCheckoutUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_SCALE?.trim() || process.env.NEXT_PUBLIC_CHECKOUT_URL_SCALE?.trim() || "";

const PLAN_CARDS = [
  {
    tier: "STARTER",
    price: `$${PLAN_CATALOG.Free.monthlyPriceUsd}`,
    suffix: "",
    description: "For individuals getting started with MemoryOS.",
    features: [
      `${formatLimit(PLAN_CATALOG.Free.tokenLimit ?? 0)} tokens/month`,
      `${formatLimit(PLAN_CATALOG.Free.searchLimit ?? 0)} search queries/month`,
      "1 workspace",
      "Basic memory/history",
      "Community support",
    ],
    cta: "Start free →",
    secondary: "Explore the docs →",
    ctaHref: "/developer-console/sign-in",
    secondaryHref: "#developer-experience",
    featured: false,
  },
  {
    tier: "PRO",
    price: `$${PLAN_CATALOG.Pro.monthlyPriceUsd}`,
    suffix: "/mo.",
    description: "For active builders running MemoryOS in daily multi-agent workflows.",
    features: [
      `${formatLimit(PLAN_CATALOG.Pro.tokenLimit ?? 0)} tokens/month`,
      `${formatLimit(PLAN_CATALOG.Pro.searchLimit ?? 0)} search queries/month`,
      "Advanced memory tools (resume/handoff/insights)",
      "Connector integrations",
      "Priority email support",
    ],
    cta: "Get MemoryOS Pro →",
    secondary: "Install the SDK →",
    ctaHref: polarProCheckoutUrl || "/pricing?plan=pro",
    secondaryHref: "#developer-experience",
    featured: true,
  },
  {
    tier: "SCALE",
    price: `$${PLAN_CATALOG.Scale.monthlyPriceUsd}`,
    suffix: "/mo.",
    description: "For teams running shared company memory in production.",
    features: [
      `${formatLimit(PLAN_CATALOG.Scale.tokenLimit ?? 0)} tokens/month`,
      `${formatLimit(PLAN_CATALOG.Scale.searchLimit ?? 0)} search queries/month`,
      "Team collaboration + governance",
      "Audit logs + advanced controls",
      "Faster support/SLA response",
    ],
    cta: "Upgrade to Scale →",
    secondary: "See platform details →",
    ctaHref: polarScaleCheckoutUrl || "/pricing?plan=scale",
    secondaryHref: "#enterprise",
    featured: false,
  },
];

const ENTERPRISE_POINTS = [
  "Custom token/search limits (or unlimited by contract)",
  "SSO/SAML",
  "Dedicated infra/security controls",
  "Onboarding + dedicated success/support",
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
            Limit reset: usage resets monthly on billing anniversary. If limit is reached, requests pause
            until reset or upgrade. On downgrade, new plan limits apply immediately.
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


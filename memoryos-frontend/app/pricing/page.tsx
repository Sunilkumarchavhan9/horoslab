import { PLAN_CATALOG, formatLimit } from "@/lib/plan-catalog";

const proCheckoutUrl = process.env.NEXT_PUBLIC_PADDLE_CHECKOUT_URL_PRO?.trim() || "";
const scaleCheckoutUrl = process.env.NEXT_PUBLIC_PADDLE_CHECKOUT_URL_SCALE?.trim() || "";
const founderEmail = "chavhansunilkumar753@gmail.com";

type PlanCardProps = {
  name: string;
  price: string;
  limits: string;
  ctaLabel: string;
  ctaHref: string;
};

function PlanCard({ name, price, limits, ctaLabel, ctaHref }: PlanCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <h2 className="text-xl font-semibold">{name}</h2>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{price}</p>
      <p className="mt-2 text-sm text-slate-700">{limits}</p>
      <a
        href={ctaHref}
        className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {ctaLabel}
      </a>
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">Pricing</h1>
        <p className="mt-4 text-base text-slate-700">
          Free: {formatLimit(PLAN_CATALOG.Free.tokenLimit ?? 0)} tokens + {formatLimit(PLAN_CATALOG.Free.searchLimit ?? 0)} searches.
          Pro: {formatLimit(PLAN_CATALOG.Pro.tokenLimit ?? 0)} + {formatLimit(PLAN_CATALOG.Pro.searchLimit ?? 0)}.
          Scale: {formatLimit(PLAN_CATALOG.Scale.tokenLimit ?? 0)} + {formatLimit(PLAN_CATALOG.Scale.searchLimit ?? 0)} per month.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <PlanCard
            name="Free"
            price="$0"
            limits={`${formatLimit(PLAN_CATALOG.Free.tokenLimit ?? 0)} tokens/month · ${formatLimit(PLAN_CATALOG.Free.searchLimit ?? 0)} searches/month`}
            ctaLabel="Start free"
            ctaHref="/developer-console/sign-in"
          />
          <PlanCard
            name="Pro"
            price={`$${PLAN_CATALOG.Pro.monthlyPriceUsd}/month`}
            limits={`${formatLimit(PLAN_CATALOG.Pro.tokenLimit ?? 0)} tokens/month · ${formatLimit(PLAN_CATALOG.Pro.searchLimit ?? 0)} searches/month`}
            ctaLabel="Upgrade to Pro"
            ctaHref={proCheckoutUrl || "/developer-console/sign-in"}
          />
          <PlanCard
            name="Scale"
            price={`$${PLAN_CATALOG.Scale.monthlyPriceUsd}/month`}
            limits={`${formatLimit(PLAN_CATALOG.Scale.tokenLimit ?? 0)} tokens/month · ${formatLimit(PLAN_CATALOG.Scale.searchLimit ?? 0)} searches/month`}
            ctaLabel="Upgrade to Scale"
            ctaHref={scaleCheckoutUrl || "/developer-console/sign-in"}
          />
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold">Enterprise</h3>
          <p className="mt-2 text-slate-700">Custom pricing, security, and dedicated support.</p>
          <a
            href={`mailto:${founderEmail}`}
            className="mt-4 inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Talk to founder
          </a>
        </div>
      </div>
    </main>
  );
}

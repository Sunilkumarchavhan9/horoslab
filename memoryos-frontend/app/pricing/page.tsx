export default function PricingPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-slate-900">
      <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-4 text-base text-slate-600">
        MemoryOS offers flexible plans for startups, product teams, and enterprise deployments.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">How Pricing Works</h2>
        <p className="text-slate-700">
          Pricing is based on usage, team size, and deployment model. We support monthly plans and
          custom enterprise agreements.
        </p>
        <p className="text-slate-700">
          For current plan details, contact us at{" "}
          <a className="text-blue-700 underline" href="mailto:sunilkumarchavhan753@gmail.com">
            sunilkumarchavhan753@gmail.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}


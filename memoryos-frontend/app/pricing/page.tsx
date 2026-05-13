const bullets = [
  "MemoryOS helps teams persist and retrieve project context across AI-assisted workflows.",
  "Plans are subscription-based for developer teams and enterprise deployments.",
  "Checkout and billing are processed securely through Paddle.",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">Pricing</h1>
        <p className="mt-4 text-base text-slate-700">
          MemoryOS provides usage-based plans for individual builders, growing teams, and enterprise operations.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Current plans</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
            <li>Free: $0 with 1M tokens/month and 10K search queries/month</li>
            <li>Pro: $19/month with 3M tokens/month and 100K search queries/month</li>
            <li>Scale: $399/month with 80M tokens/month and 20M search queries/month</li>
            <li>Enterprise: custom security, support, and deployment requirements</li>
          </ul>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">What we sell</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

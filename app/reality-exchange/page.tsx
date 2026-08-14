import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { REALITY_EXCHANGE_PLAN } from "../../shared/realityExchangePlan";

type RealityCompilerStatus = {
  ok: boolean;
  data: {
    compilerVersion: string;
    plan: typeof REALITY_EXCHANGE_PLAN;
    totalCompilations: number;
    decisions: Record<string, number>;
    latest: {
      id: string;
      repository: string;
      pullRequest: number;
      decision: string;
      riskLevel: string;
      createdAt: string;
    } | null;
  };
};

function getRequestOrigin(): string {
  const requestHeaders = headers();
  const host = requestHeaders.get("host");
  if (!host) {
    return "http://localhost:3000";
  }
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

async function loadRealityCompilerStatus(): Promise<RealityCompilerStatus | null> {
  try {
    const response = await fetch(`${getRequestOrigin()}/api/reality-compiler/status`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as RealityCompilerStatus;
  } catch {
    return null;
  }
}

function SectionList({
  title,
  summary,
  items,
  accent,
}: {
  title: string;
  summary: string;
  items: string[];
  accent: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
            {accent}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
            {summary}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
          {items.length} items
        </span>
      </div>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3"
          >
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-[11px] font-semibold text-cyan-200">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-white/80">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
      {children}
    </span>
  );
}

export default async function RealityExchangePage() {
  const status = await loadRealityCompilerStatus();
  const plan = status?.data.plan ?? REALITY_EXCHANGE_PLAN;
  const latest = status?.data.latest ?? null;
  const decisionEntries = Object.entries(status?.data.decisions ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07080b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.22),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.16),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(234,88,12,0.12),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-16 pt-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_100px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <Pill>Reality Exchange</Pill>
            <Pill>{plan.version}</Pill>
            <Pill>{plan.product}</Pill>
            <Pill>{plan.initialWedge}</Pill>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/38">
            Institution Compiler
          </p>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-cyan-200/70">
                Authoritative plan
              </p>
              <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                {plan.oneLiner}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
                The new plan keeps the current codebase as the memory, evidence, policy, and learning substrate. We are not replacing the product tree; we are compiling it into a governed institution runtime.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/continuity-lab"
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#090a0c] transition hover:bg-cyan-100"
                >
                  Open Continuity Lab
                </Link>
                <a
                  href="#build-now"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                >
                  Review build cut
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-[#0d0f14] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/38">
                  Live compiler status
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {status?.data.compilerVersion ?? "reality-compiler.v1"}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  {latest
                    ? `Latest compilation ${latest.decision} for ${latest.repository}#${latest.pullRequest} at ${new Date(latest.createdAt).toLocaleString()}`
                    : "No compilations have been recorded yet. The plan is ready to compile first."}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#0d0f14] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/38">
                  First customer
                </p>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  {plan.firstCustomer.profile}
                </p>
                <p className="mt-3 text-sm leading-7 text-cyan-100">
                  {plan.firstCustomer.firstUseCase}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Buyer</p>
            <p className="mt-2 text-sm leading-7 text-white/80">{plan.firstCustomer.buyer}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Daily users</p>
            <p className="mt-2 text-sm leading-7 text-white/80">{plan.firstCustomer.dailyUsers.join(" · ")}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Initial wedge</p>
            <p className="mt-2 text-sm leading-7 text-white/80">{plan.initialWedge}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Compilations</p>
            <p className="mt-2 text-3xl font-semibold text-white">{status?.data.totalCompilations ?? 0}</p>
            <p className="mt-2 text-sm leading-7 text-white/60">
              {decisionEntries.length > 0
                ? `${decisionEntries.map(([decision, count]) => `${decision}: ${count}`).join(" · ")}`
                : "No decision history yet."}
            </p>
          </div>
        </section>

        <div id="build-now" className="mt-6 grid gap-6">
          <SectionList
            accent="Build now"
            title={plan.buildNow.title}
            summary={plan.buildNow.summary}
            items={plan.buildNow.items}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
                    Mandate contract
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    The source program
                  </h2>
                </div>
                <Pill>Typed</Pill>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                {plan.mandateContract.sourceProgram}
              </p>
              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {plan.mandateContract.requiredFields.map((field) => (
                  <div key={field} className="rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3 text-sm text-white/80">
                    {field}
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
                  States
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.mandateContract.states.map((state) => (
                    <Pill key={state}>{state}</Pill>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
                    Signature demo
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    What the first proof looks like
                  </h2>
                </div>
                <Pill>Replay</Pill>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/65">
                {plan.signatureDemo.mission}
              </p>
              <div className="mt-5 space-y-2">
                {plan.signatureDemo.demoSequence.slice(0, 5).map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-[11px] font-semibold text-cyan-200">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-white/80">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionList
            accent="Build next"
            title={plan.buildNext.title}
            summary={plan.buildNext.summary}
            items={plan.buildNext.items}
          />
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
                  Build later
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  The platform beyond the wedge
                </h2>
              </div>
              <Pill>{plan.buildLater.horizon}</Pill>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/65">
              {plan.buildLater.summary}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {plan.buildLater.items.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3 text-sm text-white/80">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">
                Institution compiler pipeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Build the organization, not just the action
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill>{plan.buildNow.horizon}</Pill>
              <Pill>{plan.buildNext.horizon}</Pill>
              <Pill>{plan.buildLater.horizon}</Pill>
            </div>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-3 xl:grid-cols-4">
            {plan.institutionCompilerPipeline.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">
                  Stage {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/82">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-white/[0.04] to-amber-500/10 p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-100/70">
                North star
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {plan.northStar.mission}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
                {plan.northStar.proof}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0d0f14]/90 p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
                Acceptance criteria
              </p>
              <div className="mt-4 space-y-2">
                {plan.northStar.acceptanceCriteria.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#0d0f14] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/38">
                Closing screen
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                What verified settlement looks like
              </h2>
            </div>
            <Pill>Demo proof</Pill>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {plan.signatureDemo.closingScreen.map((item) => (
              <div key={item} className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-50">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {latest ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
                  Latest compilation
                </p>
                <p className="mt-2 text-sm leading-7 text-white/80">
                  {latest.repository}#{latest.pullRequest} · {latest.decision} · {latest.riskLevel}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/60">
                No backend compilation yet. The plan is still ready to compile.
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
                Mission classes
              </p>
              <p className="mt-2 text-sm leading-7 text-white/80">
                Duplicate financial action, unsafe migration, authorization regression, and performance regression are the first supported classes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

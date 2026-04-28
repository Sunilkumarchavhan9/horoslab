"use client";

import { useMemo, useState } from "react";

const BENCHMARK_TIME_FILTERS = ["7d", "30d", "90d", "All"] as const;
const BENCHMARK_SUITE_FILTERS = [
  "Full suite",
  "retrieve",
  "resume",
  "contradiction",
] as const;
const BENCHMARK_ENV_FILTERS = ["All envs", "local", "mem0"] as const;

type BenchmarkTimeFilter = (typeof BENCHMARK_TIME_FILTERS)[number];
type BenchmarkSuiteFilter = (typeof BENCHMARK_SUITE_FILTERS)[number];
type BenchmarkEnvFilter = (typeof BENCHMARK_ENV_FILTERS)[number];

export type BenchmarkRunItem = {
  id: string;
  generatedAt: string;
  status: "Passed" | "Failed" | "Running";
  mode: "local" | "mem0";
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  top3RetrievalPrecision: number;
  resumeSuccessRate: number;
  contradictionMissRate: number;
  wrongMergeRate: number;
  p95RetrieveLatencyMs: number | null;
  suites: {
    retrieve: { passed: number; total: number };
    resume: { passed: number; total: number };
    contradiction: { passed: number; total: number };
  };
  failedDetails: Array<{
    id: string;
    type: "retrieve" | "resume" | "contradiction";
    reason: string;
  }>;
};

type BenchmarksSectionProps = {
  runs: BenchmarkRunItem[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

function shortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function statusTone(status: BenchmarkRunItem["status"]) {
  if (status === "Passed") return "border-[#14c38e]/30 bg-[#0a1f18] text-[#8ce6c7]";
  if (status === "Running") return "border-[#4f93ff]/30 bg-[#4f93ff]/8 text-[#8bb5ff]";
  return "border-[#ff6d6d]/30 bg-[#2a1111] text-[#ffb0b0]";
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <div className="h-9" />;
  }

  const width = 120;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * (width - 2) + 1;
      const y = height - 4 - ((value - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full">
      <polyline points={points} fill="none" stroke="#4f93ff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function BenchmarksSection({
  runs,
  isLoading = false,
  errorMessage = null,
}: BenchmarksSectionProps) {
  const [timeFilter, setTimeFilter] = useState<BenchmarkTimeFilter>("30d");
  const [suiteFilter, setSuiteFilter] = useState<BenchmarkSuiteFilter>("Full suite");
  const [envFilter, setEnvFilter] = useState<BenchmarkEnvFilter>("All envs");

  const filteredRuns = useMemo(() => {
    const envRuns =
      envFilter === "All envs" ? runs : runs.filter((run) => run.mode === envFilter);
    if (timeFilter === "All") {
      return envRuns;
    }

    const referenceTimeMs = envRuns.reduce((max, run) => {
      const runTime = new Date(run.generatedAt).getTime();
      return Number.isFinite(runTime) ? Math.max(max, runTime) : max;
    }, 0);
    const days = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 90;
    const cutoff = referenceTimeMs - days * ONE_DAY_MS;
    return envRuns.filter((run) => {
      const runAt = new Date(run.generatedAt).getTime();
      return Number.isFinite(runAt) && runAt >= cutoff;
    });
  }, [envFilter, runs, timeFilter]);

  const sortedRuns = useMemo(
    () =>
      [...filteredRuns].sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      ),
    [filteredRuns],
  );

  const latestRun = sortedRuns[0] ?? null;
  const trendRuns = [...sortedRuns].reverse();
  const passTrend = trendRuns.map((run) => run.passRate);

  const suiteRows =
    latestRun === null
      ? []
      : [
          { key: "retrieve", label: "Retrieve", ...latestRun.suites.retrieve },
          { key: "resume", label: "Resume", ...latestRun.suites.resume },
          {
            key: "contradiction",
            label: "Contradiction",
            ...latestRun.suites.contradiction,
          },
        ];

  const visibleFailedCases =
    latestRun === null
      ? []
      : suiteFilter === "Full suite"
        ? latestRun.failedDetails
        : latestRun.failedDetails.filter((item) => item.type === suiteFilter);

  const qualityGates =
    latestRun === null
      ? []
      : [
          {
            label: "Pass rate >= 85%",
            value: latestRun.passRate,
            target: 85,
            higherIsBetter: true,
          },
          {
            label: "Resume success >= 80%",
            value: latestRun.resumeSuccessRate,
            target: 80,
            higherIsBetter: true,
          },
          {
            label: "Contradiction miss <= 5%",
            value: latestRun.contradictionMissRate,
            target: 5,
            higherIsBetter: false,
          },
        ];

  const emptyTitle = isLoading
    ? "Loading benchmark report..."
    : errorMessage
      ? "Could not load benchmark report"
      : "No benchmark runs yet";
  const emptyDescription = isLoading
    ? "Fetching latest benchmark artifact from MemoryOS API."
    : errorMessage
      ? errorMessage
      : "Run `bun run eval:benchmark` to generate your first quality report.";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Benchmarks</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Track retrieve, resume, and contradiction quality with live benchmark evidence.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#111111]">
          {BENCHMARK_TIME_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTimeFilter(item)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                timeFilter === item ? "bg-[#1e1e1e] text-white" : "text-white/42 hover:bg-white/5 hover:text-white/72"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#111111]">
          {BENCHMARK_SUITE_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSuiteFilter(item)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                suiteFilter === item ? "bg-[#1e1e1e] text-white" : "text-white/42 hover:bg-white/5 hover:text-white/72"
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#111111]">
          {BENCHMARK_ENV_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEnvFilter(item)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                envFilter === item ? "bg-[#1e1e1e] text-white" : "text-white/42 hover:bg-white/5 hover:text-white/72"
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {latestRun === null ? (
        <div className="mt-3 rounded-[10px] border border-white/10 bg-[#141414] px-4 py-10 text-center">
          <h2 className="text-[24px] font-semibold tracking-[-0.04em]">{emptyTitle}</h2>
          <p className="mt-2 text-[13px] text-white/50">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Pass rate", value: `${latestRun.passRate.toFixed(1)}%`, trend: passTrend, accent: "#14c38e" },
              {
                label: "Top-3 retrieval precision",
                value: `${latestRun.top3RetrievalPrecision.toFixed(1)}%`,
                trend: trendRuns.map((run) => run.top3RetrievalPrecision),
                accent: "#4f93ff",
              },
              {
                label: "Resume success",
                value: `${latestRun.resumeSuccessRate.toFixed(1)}%`,
                trend: trendRuns.map((run) => run.resumeSuccessRate),
                accent: "#9b7bff",
              },
              {
                label: "Contradiction miss",
                value: `${latestRun.contradictionMissRate.toFixed(1)}%`,
                trend: trendRuns.map((run) => 100 - run.contradictionMissRate),
                accent: "#f0b429",
              },
              {
                label: "Wrong merge",
                value: `${latestRun.wrongMergeRate.toFixed(1)}%`,
                trend: trendRuns.map((run) => 100 - run.wrongMergeRate),
                accent: "#ff6d6d",
              },
              {
                label: "p95 retrieve latency",
                value:
                  latestRun.p95RetrieveLatencyMs !== null
                    ? `${latestRun.p95RetrieveLatencyMs}ms`
                    : "-",
                trend: trendRuns.map((run) =>
                  run.p95RetrieveLatencyMs !== null
                    ? 1000 - run.p95RetrieveLatencyMs
                    : 0,
                ),
                accent: "#4f93ff",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-[8px] border border-white/10 bg-[#161616] px-3.5 py-3.5"
                style={{ borderTopColor: card.accent, borderTopWidth: "2px" }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/34">{card.label}</p>
                <p className="mt-1.5 text-[22px] font-semibold tracking-[-0.04em]">{card.value}</p>
                <div className="mt-1.5">
                  <Sparkline values={card.trend} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <div className="rounded-[10px] border border-white/10 bg-[#181818] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Latest run</p>
                <span className={`rounded-[6px] border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${statusTone(latestRun.status)}`}>
                  {latestRun.status}
                </span>
              </div>
              <div className="mt-2.5 space-y-2">
                {[
                  ["Run ID", latestRun.id],
                  ["Generated at", shortDate(latestRun.generatedAt)],
                  ["Mode", latestRun.mode],
                  ["Cases", `${latestRun.passedCases}/${latestRun.totalCases}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2">
                    <span className="text-[11px] text-white/46">{label}</span>
                    <span className="text-[11px] font-semibold text-white/84">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[10px] border border-white/10 bg-[#181818] px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Suite breakdown</p>
              <div className="mt-3 space-y-3">
                {suiteRows.map((suite) => {
                  const passPct = suite.total > 0 ? (suite.passed / suite.total) * 100 : 0;
                  return (
                    <div key={suite.key}>
                      <div className="mb-1.5 flex items-center justify-between text-[12px]">
                        <span className="text-white/76">{suite.label}</span>
                        <span className="text-white/52">{suite.passed}/{suite.total}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#0f0f0f]">
                        <div className="h-full bg-[#4f93ff]" style={{ width: `${passPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[10px] border border-white/10 bg-[#181818] px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Quality gate</p>
              <div className="mt-2.5 space-y-2">
                {qualityGates.map((gate) => {
                  const passed = gate.higherIsBetter ? gate.value >= gate.target : gate.value <= gate.target;
                  return (
                    <div key={gate.label} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-3">
                      <p className="text-[11px] text-white/52">{gate.label}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold text-white/84">{gate.value.toFixed(1)}%</p>
                        <span className={`rounded-[6px] border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${
                          passed ? "border-[#14c38e]/30 bg-[#0a1f18] text-[#8ce6c7]" : "border-[#ff6d6d]/30 bg-[#2a1111] text-[#ffb0b0]"
                        }`}>
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[10px] border border-white/10 bg-[#181818] px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Failed cases</p>
            <div className="mt-2.5 space-y-2">
              {visibleFailedCases.length === 0 ? (
                <div className="rounded-[8px] border border-[#14c38e]/20 bg-[#0a1f18] px-3 py-3 text-[12px] text-[#8ce6c7]">
                  No failed cases in this run.
                </div>
              ) : (
                visibleFailedCases.map((item) => (
                  <div key={item.id} className="rounded-[8px] border border-[#ff6d6d]/20 bg-[#1a0e0e] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-semibold text-white/84">{item.id}</p>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[#ffb0b0]">{item.type}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-white/58">{item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

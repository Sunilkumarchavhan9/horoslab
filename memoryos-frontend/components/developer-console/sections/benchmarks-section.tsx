"use client";

import { useEffect, useMemo, useState } from "react";
import { useBenchmarks } from "@/lib/useBenchmarks";

const BENCHMARK_TIME_FILTERS = ["7d", "30d", "90d", "All"] as const;
const BENCHMARK_SUITE_FILTERS = [
  "Full suite",
  "retrieve",
  "resume",
  "contradiction",
] as const;
const BENCHMARK_ENV_FILTERS = ["All envs", "local", "preview", "production"] as const;

type BenchmarkTimeFilter = (typeof BENCHMARK_TIME_FILTERS)[number];
type BenchmarkSuiteFilter = (typeof BENCHMARK_SUITE_FILTERS)[number];
type BenchmarkEnvFilter = (typeof BENCHMARK_ENV_FILTERS)[number];

export type BenchmarkRunItem = {
  runId: string;
  generatedAt: string;
  status: "Passed" | "Failed" | "Running";
  mode: "local" | "preview" | "production";
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
  abSummary?: {
    missingStepsImprovement: number;
    contradictionImprovement: number;
    timeToCorrectActionDeltaMs: number;
  };
  failedDetails: Array<{
    id: string;
    type: "retrieve" | "resume" | "contradiction";
    reason: string;
  }>;
};

type BenchmarksSectionProps = {
  runs?: BenchmarkRunItem[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

function shortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function statusTone(status: BenchmarkRunItem["status"]) {
  if (status === "Passed") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "Running") return "border-primary/30 bg-primary/10 text-primary";
  return "border-destructive/30 bg-destructive/10 text-destructive";
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
      <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function BenchmarksSection({
  runs: runsProp,
  isLoading: isLoadingProp,
  errorMessage: errorMessageProp,
}: BenchmarksSectionProps) {
  const live = useBenchmarks();
  const runs = useMemo<BenchmarkRunItem[]>(
    () =>
      (runsProp ??
        live.history.map((run) => ({
          runId: run.runId,
          generatedAt: run.generatedAt,
          status:
            run.status === "passed"
              ? "Passed"
              : run.status === "failed"
                ? "Failed"
                : "Running",
          mode:
            run.mode === "preview" || run.mode === "production" ? run.mode : "local",
          totalCases: run.totalCases,
          passedCases: run.passedCases,
          failedCases: run.failedCases,
          passRate: run.passRate,
          top3RetrievalPrecision: run.top3RetrievalPrecision,
          resumeSuccessRate: run.resumeSuccessRate,
          contradictionMissRate: run.contradictionMissRate,
          wrongMergeRate: run.wrongMergeRate,
          p95RetrieveLatencyMs: run.p95RetrieveLatencyMs,
          suites: { retrieve: { passed: 0, total: 0 }, resume: { passed: 0, total: 0 }, contradiction: { passed: 0, total: 0 } },
          failedDetails: [],
          abSummary: undefined,
        }))) as BenchmarkRunItem[],
    [live.history, runsProp],
  );
  const latestFromLive = useMemo<BenchmarkRunItem | null>(() => {
    if (!live.latest) return null;
    return {
      runId: live.latest.runId,
      generatedAt: live.latest.generatedAt,
      status:
        live.latest.status === "passed"
          ? "Passed"
          : live.latest.status === "failed"
            ? "Failed"
            : "Running",
      mode: live.latest.mode,
      totalCases: live.latest.totalCases,
      passedCases: live.latest.passedCases,
      failedCases: live.latest.failedCases,
      passRate: live.latest.passRate,
      top3RetrievalPrecision: live.latest.top3RetrievalPrecision,
      resumeSuccessRate: live.latest.resumeSuccessRate,
      contradictionMissRate: live.latest.contradictionMissRate,
      wrongMergeRate: live.latest.wrongMergeRate,
      p95RetrieveLatencyMs: live.latest.p95RetrieveLatencyMs,
      suites: live.latest.suites,
      failedDetails: live.latest.failedDetails,
      abSummary: live.latest.abSummary,
    };
  }, [live.latest]);
  const isLoading = isLoadingProp ?? live.isLoading;
  const errorMessage = errorMessageProp ?? live.errorMessage;
  const [timeFilter, setTimeFilter] = useState<BenchmarkTimeFilter>("30d");
  const [suiteFilter, setSuiteFilter] = useState<BenchmarkSuiteFilter>("Full suite");
  const [envFilter, setEnvFilter] = useState<BenchmarkEnvFilter>("All envs");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseTraceText, setCaseTraceText] = useState<string>("");
  const [scenarioName, setScenarioName] = useState("Core Continuity Proof");
  const [gateSummary, setGateSummary] = useState<string>("");
  const [runCases, setRunCases] = useState<Array<{ caseId: string; suite: string; passed: boolean; failureReason: string | null }>>([]);
  const [weeklyMetrics, setWeeklyMetrics] = useState<null | {
    window: string;
    sampleSize: number;
    previousSampleSize: number;
    metrics: {
      continuityPassRate: number | null;
      contradictionRate: number | null;
      staleMemoryRate: number | null;
      recoveryLatencyMs: number | null;
    };
    deltasVsPreviousWeek: {
      continuityPassRate: number | null;
      contradictionRate: number | null;
      staleMemoryRate: number | null;
      recoveryLatencyMs: number | null;
    };
  }>(null);
  const [regressionAlerts, setRegressionAlerts] = useState<
    Array<{
      id: string;
      severity: "warning" | "critical";
      message: string;
      metric: string;
      latestValue: number;
      previousValue: number | null;
      delta: number | null;
      generatedAt: string;
    }>
  >([]);

  const filteredRuns = useMemo(() => {
    const envRuns =
      envFilter === "All envs" ? runs : runs.filter((run) => run.mode === envFilter);
    if (timeFilter === "All") {
      return envRuns;
    }

    const referenceTimeMs = Date.now();
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

  const latestRun = latestFromLive ?? sortedRuns[0] ?? null;
  useEffect(() => {
    if (!latestRun?.runId) return;
    void live.listRunCases(latestRun.runId).then((cases) => {
      setRunCases(
        cases.map((item) => ({
          caseId: item.caseId,
          suite: item.suite,
          passed: item.passed,
          failureReason: item.failureReason,
        })),
      );
    });
  }, [latestRun?.runId, live]);
  useEffect(() => {
    void live.getWeeklyMetrics().then((value) => setWeeklyMetrics(value));
    void live.getRegressionAlerts().then((value) => setRegressionAlerts(value?.alerts ?? []));
  }, [live, latestRun?.runId]);
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
          <p className="mt-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
            Track retrieve, resume, and contradiction quality with live benchmark evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void live.triggerRun()}
          disabled={live.isRunning}
          className="rounded-[8px] border border-primary/50 bg-primary px-3 py-2 text-[11px] font-medium tracking-[0.08em] text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {live.isRunning ? "RUNNING..." : "RUN A/B NOW"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center overflow-hidden rounded-[8px] border border-border bg-muted/50">
          {BENCHMARK_TIME_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTimeFilter(item)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                timeFilter === item ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center overflow-hidden rounded-[8px] border border-border bg-muted/50">
          {BENCHMARK_SUITE_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSuiteFilter(item)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                suiteFilter === item ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground"
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center overflow-hidden rounded-[8px] border border-border bg-muted/50">
          {BENCHMARK_ENV_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEnvFilter(item)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                envFilter === item ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground"
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            void live
              .createScenario({
                name: scenarioName.trim() || "Continuity Scenario",
                mode: latestRun?.mode === "preview" || latestRun?.mode === "production" ? latestRun.mode : "local",
                caseIds: runCases.slice(0, 5).map((c) => c.caseId),
              })
              .then(async (scenario) => {
                if (!scenario) return;
                await live.runScenario(scenario.id);
                live.refreshNow();
              })
          }
          className="rounded-[8px] border border-primary/50 bg-primary px-3 py-2 text-[11px] font-medium tracking-[0.08em] text-primary-foreground transition hover:bg-primary/90"
        >
          SAVE + RUN SCENARIO
        </button>
        <button
          type="button"
          onClick={() =>
            void live.checkRegressionGate().then((result) => {
              if (!result) {
                setGateSummary("Regression gate: unavailable");
                return;
              }
              setGateSummary(`Regression gate: ${result.pass ? "PASS" : "FAIL"} (${result.checks.map((c) => `${c.key}:${c.pass ? "ok" : "fail"}`).join(", ")})`);
              live.refreshNow();
            })
          }
          className="rounded-[8px] border border-primary/50 bg-primary px-3 py-2 text-[11px] font-medium tracking-[0.08em] text-primary-foreground transition hover:bg-primary/90"
        >
          CHECK GATE
        </button>
        <input
          value={scenarioName}
          onChange={(event) => setScenarioName(event.target.value)}
          className="h-8 rounded-[8px] border border-primary/50 bg-primary/10 px-2 text-[11px] text-primary-foreground placeholder:text-primary-foreground/70"
          placeholder="Scenario name"
        />
      </div>
      {gateSummary ? <p className="mt-2 text-[11px] text-muted-foreground">{gateSummary}</p> : null}

      {latestRun === null ? (
        <div className="mt-3 rounded-[10px] border border-border bg-muted px-4 py-10 text-center">
          <h2 className="text-[24px] font-semibold tracking-[-0.04em]">{emptyTitle}</h2>
          <p className="mt-2 text-[13px] text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Pass rate", value: `${latestRun.passRate.toFixed(1)}%`, trend: passTrend, accent: "var(--color-primary)" },
              {
                label: "Top-3 retrieval precision",
                value: `${latestRun.top3RetrievalPrecision.toFixed(1)}%`,
                trend: trendRuns.map((run) => run.top3RetrievalPrecision),
                accent: "var(--color-primary)",
              },
              {
                label: "Resume success",
                value: `${latestRun.resumeSuccessRate.toFixed(1)}%`,
                trend: trendRuns.map((run) => run.resumeSuccessRate),
                accent: "var(--color-primary)",
              },
              {
                label: "Contradiction miss",
                value: `${latestRun.contradictionMissRate.toFixed(1)}%`,
                trend: trendRuns.map((run) => 100 - run.contradictionMissRate),
                accent: "var(--color-muted-foreground)",
              },
              {
                label: "Wrong merge",
                value: `${latestRun.wrongMergeRate.toFixed(1)}%`,
                trend: trendRuns.map((run) => 100 - run.wrongMergeRate),
                accent: "var(--color-destructive)",
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
                accent: "var(--color-primary)",
              },
              {
                label: "Missing-step delta",
                value: `+${(latestRun.abSummary?.missingStepsImprovement ?? 0).toFixed(2)}`,
                trend: trendRuns.map((run) => run.abSummary?.missingStepsImprovement ?? 0),
                accent: "var(--color-primary)",
              },
              {
                label: "Contradiction delta",
                value: `+${(latestRun.abSummary?.contradictionImprovement ?? 0).toFixed(2)}`,
                trend: trendRuns.map((run) => run.abSummary?.contradictionImprovement ?? 0),
                accent: "var(--color-muted-foreground)",
              },
              {
                label: "Time-to-correct delta",
                value: `${Math.round(latestRun.abSummary?.timeToCorrectActionDeltaMs ?? 0)}ms`,
                trend: trendRuns.map((run) => run.abSummary?.timeToCorrectActionDeltaMs ?? 0),
                accent: "var(--color-primary)",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-[8px] border border-border bg-card px-3.5 py-3.5"
                style={{ borderTopColor: card.accent, borderTopWidth: "2px" }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{card.label}</p>
                <p className="mt-1.5 text-[22px] font-semibold tracking-[-0.04em]">{card.value}</p>
                <div className="mt-1.5">
                  <Sparkline values={card.trend} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <div className="rounded-[10px] border border-border bg-card px-4 py-4 xl:col-span-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Weekly continuity metrics</p>
              <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Continuity pass rate", weeklyMetrics?.metrics.continuityPassRate, weeklyMetrics?.deltasVsPreviousWeek.continuityPassRate, "%"],
                  ["Contradiction rate", weeklyMetrics?.metrics.contradictionRate, weeklyMetrics?.deltasVsPreviousWeek.contradictionRate, "%"],
                  ["Stale-memory rate", weeklyMetrics?.metrics.staleMemoryRate, weeklyMetrics?.deltasVsPreviousWeek.staleMemoryRate, "%"],
                  ["Recovery latency", weeklyMetrics?.metrics.recoveryLatencyMs, weeklyMetrics?.deltasVsPreviousWeek.recoveryLatencyMs, "ms"],
                ].map(([label, value, delta, unit]) => (
                  <div key={String(label)} className="rounded-[8px] border border-border bg-muted/50 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground">{String(label)}</p>
                    <p className="mt-1 text-[16px] font-semibold text-foreground">
                      {typeof value === "number" ? `${value.toFixed(1)}${unit}` : "-"}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Delta vs prev week: {typeof delta === "number" ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}${unit}` : "-"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Window: {weeklyMetrics?.window ?? "7d"} sample={weeklyMetrics?.sampleSize ?? 0} previous={weeklyMetrics?.previousSampleSize ?? 0}
              </p>
            </div>

            <div className="rounded-[10px] border border-border bg-card px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Latest run</p>
                <span className={`rounded-[6px] border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${statusTone(latestRun.status)}`}>
                  {latestRun.status}
                </span>
              </div>
              <div className="mt-2.5 space-y-2">
                {[
                  ["Run ID", latestRun.runId],
                  ["Generated at", shortDate(latestRun.generatedAt)],
                  ["Mode", latestRun.mode],
                  ["Cases", `${latestRun.passedCases}/${latestRun.totalCases}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-[8px] border border-border bg-muted/50 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                    <span className="text-[11px] font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[10px] border border-border bg-card px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Suite breakdown</p>
              <div className="mt-3 space-y-3">
                {suiteRows.map((suite) => {
                  const passPct = suite.total > 0 ? (suite.passed / suite.total) * 100 : 0;
                  return (
                    <div key={suite.key}>
                      <div className="mb-1.5 flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">{suite.label}</span>
                        <span className="text-muted-foreground">{suite.passed}/{suite.total}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${passPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[10px] border border-border bg-card px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Quality gate</p>
              <div className="mt-2.5 space-y-2">
                {qualityGates.map((gate) => {
                  const passed = gate.higherIsBetter ? gate.value >= gate.target : gate.value <= gate.target;
                  return (
                    <div key={gate.label} className="rounded-[8px] border border-border bg-muted/50 px-3 py-3">
                      <p className="text-[11px] text-muted-foreground">{gate.label}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold text-foreground">{gate.value.toFixed(1)}%</p>
                        <span className={`rounded-[6px] border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${
                          passed ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}>
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[10px] border border-border bg-card px-4 py-4 xl:col-span-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Regression alerts</p>
              <div className="mt-2.5 space-y-2">
                {regressionAlerts.length === 0 ? (
                  <div className="rounded-[8px] border border-primary/20 bg-primary/10 px-3 py-3 text-[12px] text-primary">
                    No regression alerts in latest run.
                  </div>
                ) : (
                  regressionAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-[8px] border px-3 py-3 ${
                        alert.severity === "critical"
                          ? "border-destructive/30 bg-destructive/10"
                          : "border-muted-foreground/30 bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold text-foreground">{alert.message}</p>
                        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{alert.severity}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {alert.metric}: latest={alert.latestValue.toFixed(2)}
                        {typeof alert.previousValue === "number" ? ` previous=${alert.previousValue.toFixed(2)}` : ""}
                        {typeof alert.delta === "number" ? ` delta=${alert.delta >= 0 ? "+" : ""}${alert.delta.toFixed(2)}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Failed cases</p>
            <div className="mt-2.5 space-y-2">
              {visibleFailedCases.length === 0 ? (
                <div className="rounded-[8px] border border-primary/20 bg-primary/10 px-3 py-3 text-[12px] text-primary">
                  No failed cases in this run.
                </div>
              ) : (
                visibleFailedCases.map((item) => (
                  <div key={item.id} className="rounded-[8px] border border-destructive/20 bg-destructive/10 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-semibold text-foreground">{item.id}</p>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-destructive">{item.type}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Case Drilldown</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {runCases.map((item) => (
                <button
                  key={item.caseId}
                  type="button"
                  onClick={() =>
                    void live.fetchTrace(latestRun.runId, item.caseId).then((trace) => {
                      setSelectedCaseId(item.caseId);
                      setCaseTraceText(trace ? JSON.stringify(trace, null, 2) : "No trace data.");
                    })
                  }
                  className={`rounded-[6px] border px-2 py-1 text-[10px] ${
                    selectedCaseId === item.caseId ? "border-primary/50 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {item.caseId}
                </button>
              ))}
            </div>
            <pre className="mt-3 max-h-72 overflow-auto rounded-[8px] border border-border bg-muted p-3 text-[11px] text-muted-foreground">
              {caseTraceText || "Select a case to inspect with/without-memory traces."}
            </pre>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useBenchmarks } from "@/lib/useBenchmarks";
import { StructuredDataPanel } from "./_shared/structured-data-panel";

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
  realtimeVersion?: number;
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

function formatPercent(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)}%` : "-";
}

function formatLatency(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}ms` : "-";
}

function formatDelta(value: number | null | undefined, unit = ""): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(unit === "ms" ? 0 : 1)}${unit}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function metricTone(value: number, target: number, higherIsBetter = true): string {
  const passed = higherIsBetter ? value >= target : value <= target;
  return passed ? "text-primary" : "text-destructive";
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function BenchmarksSection({
  runs: runsProp,
  isLoading: isLoadingProp,
  errorMessage: errorMessageProp,
  realtimeVersion: _realtimeVersion = 0,
}: BenchmarksSectionProps) {
  const live = useBenchmarks();
  const {
    listRunCases,
    getWeeklyMetrics,
    getRegressionAlerts,
    triggerRun,
    isRunning,
  } = live;
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

    const referenceTimeMs = envRuns.reduce((max, run) => {
      const runAt = new Date(run.generatedAt).getTime();
      return Number.isFinite(runAt) ? Math.max(max, runAt) : max;
    }, 0);
    if (referenceTimeMs <= 0) {
      return envRuns;
    }

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
    void listRunCases(latestRun.runId).then((cases) => {
      setRunCases(
        cases.map((item) => ({
          caseId: item.caseId,
          suite: item.suite,
          passed: item.passed,
          failureReason: item.failureReason,
        })),
      );
    });
  }, [latestRun?.runId, listRunCases]);
  useEffect(() => {
    void getWeeklyMetrics().then((value) => setWeeklyMetrics(value));
    void getRegressionAlerts().then((value) => setRegressionAlerts(value?.alerts ?? []));
  }, [getWeeklyMetrics, getRegressionAlerts, latestRun?.runId]);
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

  const latestStatusText = latestRun?.status ?? (isLoading ? "Loading" : "No runs");
  const latestStatusClass = latestRun ? statusTone(latestRun.status) : "border-border bg-muted text-muted-foreground";
  const latestRunDate = latestRun ? formatDateTime(latestRun.generatedAt) : "-";
  const latestRunShortId = latestRun?.runId ? latestRun.runId.slice(0, 12) : "-";
  const passRateGate = latestRun ? latestRun.passRate >= 85 : false;
  const contradictionGate = latestRun ? latestRun.contradictionMissRate <= 5 : false;
  const resumeGate = latestRun ? latestRun.resumeSuccessRate >= 80 : false;
  const gatePassCount = [passRateGate, contradictionGate, resumeGate].filter(Boolean).length;
  const sampleWindow = `${weeklyMetrics?.window ?? "7d"} sample ${weeklyMetrics?.sampleSize ?? 0}`;

  return (
    <section className="space-y-5">
      <div className="border border-border bg-card">
        <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Evaluation control plane
              </p>
              <span className={`border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${latestStatusClass}`}>
                {latestStatusText}
              </span>
              <span className="border border-border bg-background px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {live.connectionStatus}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Benchmark Quality Gates
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Prove retrieval, resume, contradiction handling, and memory regression quality before teams trust agents in production workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => live.refreshNow()}
              className="border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition hover:bg-muted"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void triggerRun()}
              disabled={isRunning}
              className="border border-primary bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? "Running suite" : "Run A/B now"}
            </button>
          </div>
        </div>

        <div className="grid gap-px border-t border-border bg-border md:grid-cols-4">
          <div className="bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest run</p>
            <p className="mt-2 font-mono text-sm font-semibold text-foreground">{latestRunShortId}</p>
            <p className="mt-1 text-xs text-muted-foreground">{latestRunDate}</p>
          </div>
          <div className="bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gate health</p>
            <p className={`mt-2 text-3xl font-semibold tracking-tight ${gatePassCount === 3 ? "text-primary" : "text-destructive"}`}>
              {latestRun ? `${gatePassCount}/3` : "-"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">pass, resume, contradiction</p>
          </div>
          <div className="bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cases</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {latestRun ? `${latestRun.passedCases}/${latestRun.totalCases}` : "-"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">passed in latest run</p>
          </div>
          <div className="bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Updated</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {live.lastUpdatedAt ? formatDateTime(live.lastUpdatedAt.toISOString()) : "-"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{sampleWindow}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex border border-border bg-card">
          {BENCHMARK_TIME_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTimeFilter(item)}
              className={`px-3 py-2 text-xs font-semibold transition ${
                timeFilter === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex border border-border bg-card">
          {BENCHMARK_SUITE_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSuiteFilter(item)}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                suiteFilter === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex border border-border bg-card">
          {BENCHMARK_ENV_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEnvFilter(item)}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                envFilter === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scenario runner</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Save a focused evaluation suite, then run it against the current MemoryOS runtime.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
                className="border border-primary bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-primary/90"
              >
                Save + run scenario
              </button>
              <button
                type="button"
                onClick={() =>
                  void live.checkRegressionGate().then((result) => {
                    if (!result) {
                      setGateSummary("Regression gate unavailable");
                      return;
                    }
                    setGateSummary(
                      `Regression gate: ${result.pass ? "PASS" : "FAIL"} (${result.checks
                        .map((c) => `${c.key}:${c.pass ? "ok" : "fail"}`)
                        .join(", ")})`,
                    );
                    live.refreshNow();
                  })
                }
                className="border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition hover:bg-muted"
              >
                Check gate
              </button>
            </div>
          </div>
          <label className="mt-4 grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scenario</span>
            <input
              value={scenarioName}
              onChange={(event) => setScenarioName(event.target.value)}
              aria-label="Benchmark scenario name"
              className="h-11 border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring"
              placeholder="Core Continuity Proof"
            />
          </label>
          {gateSummary ? (
            <p className="mt-3 border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">{gateSummary}</p>
          ) : null}
      </div>

      {latestRun === null ? (
        <div className="grid min-h-80 place-items-center border border-border bg-card px-6 py-12 text-center">
          <div className="max-w-md">
            <div className="mx-auto h-2 w-2 bg-primary" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{emptyTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
            {[
              {
                label: "Continuity pass rate",
                value: formatPercent(latestRun.passRate),
                detail: `${latestRun.passedCases} of ${latestRun.totalCases} cases passed`,
                tone: metricTone(latestRun.passRate, 85),
                trend: passTrend,
              },
              {
                label: "Retrieval precision",
                value: formatPercent(latestRun.top3RetrievalPrecision),
                detail: "top-3 memory selection accuracy",
                tone: metricTone(latestRun.top3RetrievalPrecision, 70),
                trend: trendRuns.map((run) => run.top3RetrievalPrecision),
              },
              {
                label: "Resume success",
                value: formatPercent(latestRun.resumeSuccessRate),
                detail: "can another agent continue work",
                tone: metricTone(latestRun.resumeSuccessRate, 80),
                trend: trendRuns.map((run) => run.resumeSuccessRate),
              },
              {
                label: "Contradiction miss",
                value: formatPercent(latestRun.contradictionMissRate),
                detail: "lower is safer for teams",
                tone: metricTone(latestRun.contradictionMissRate, 5, false),
                trend: trendRuns.map((run) => 100 - run.contradictionMissRate),
              },
            ].map((card) => (
              <div key={card.label} className="bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                <p className={`mt-3 text-3xl font-semibold tracking-tight ${card.tone}`}>{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
                <div className="mt-3"><Sparkline values={card.trend} /></div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Suite health</p>
                  <p className="mt-1 text-sm text-muted-foreground">Latest run breakdown by evaluation suite.</p>
                </div>
                <span className={`border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone(latestRun.status)}`}>
                  {latestRun.status}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {suiteRows.map((suite) => {
                  const passPct = suite.total > 0 ? (suite.passed / suite.total) * 100 : 0;
                  return (
                    <div key={suite.key}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{suite.label}</span>
                        <span className="text-muted-foreground">{suite.passed}/{suite.total}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${passPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Production gate</p>
              <div className="mt-4 space-y-2">
                {qualityGates.map((gate) => {
                  const passed = gate.higherIsBetter ? gate.value >= gate.target : gate.value <= gate.target;
                  return (
                    <div key={gate.label} className="border border-border bg-background px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{gate.label}</p>
                        <span className={`border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          passed ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}>
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">{formatPercent(gate.value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <div className="border border-border bg-card p-4 xl:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Weekly continuity metrics</p>
              <div className="mt-4 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
                {[
                  ["Continuity pass", weeklyMetrics?.metrics.continuityPassRate, weeklyMetrics?.deltasVsPreviousWeek.continuityPassRate, "%"],
                  ["Contradiction rate", weeklyMetrics?.metrics.contradictionRate, weeklyMetrics?.deltasVsPreviousWeek.contradictionRate, "%"],
                  ["Stale-memory rate", weeklyMetrics?.metrics.staleMemoryRate, weeklyMetrics?.deltasVsPreviousWeek.staleMemoryRate, "%"],
                  ["Recovery latency", weeklyMetrics?.metrics.recoveryLatencyMs, weeklyMetrics?.deltasVsPreviousWeek.recoveryLatencyMs, "ms"],
                ].map(([label, value, delta, unit]) => (
                  <div key={String(label)} className="bg-card p-4">
                    <p className="text-xs font-semibold text-muted-foreground">{String(label)}</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {unit === "ms" ? formatLatency(value as number | null) : formatPercent(value as number | null)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">delta {formatDelta(delta as number | null, unit as string)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest run metadata</p>
              <div className="mt-4 space-y-2">
                {[
                  ["Run", latestRun.runId],
                  ["Generated", formatDateTime(latestRun.generatedAt)],
                  ["Mode", latestRun.mode],
                  ["Latency p95", formatLatency(latestRun.p95RetrieveLatencyMs)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="truncate text-xs font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <div className="border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Regression alerts</p>
              <div className="mt-4 space-y-2">
                {regressionAlerts.length === 0 ? (
                  <div className="border border-primary/20 bg-primary/10 px-3 py-3 text-sm text-primary">No regression alerts in latest run.</div>
                ) : (
                  regressionAlerts.map((alert) => (
                    <div key={alert.id} className={`border px-3 py-3 ${alert.severity === "critical" ? "border-destructive/30 bg-destructive/10" : "border-border bg-background"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{alert.severity}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {alert.metric}: latest {alert.latestValue.toFixed(2)}{typeof alert.delta === "number" ? `, delta ${formatDelta(alert.delta)}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Failed cases</p>
              <div className="mt-4 space-y-2">
                {visibleFailedCases.length === 0 ? (
                  <div className="border border-primary/20 bg-primary/10 px-3 py-3 text-sm text-primary">No failed cases for this suite.</div>
                ) : (
                  visibleFailedCases.map((item) => (
                    <div key={item.id} className="border border-destructive/25 bg-destructive/10 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs font-semibold text-foreground">{item.id}</p>
                        <span className="text-xs uppercase tracking-[0.16em] text-destructive">{item.type}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Case drilldown</p>
                <p className="mt-1 text-sm text-muted-foreground">Inspect with-memory and without-memory traces for individual eval cases.</p>
              </div>
              <span className="border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {runCases.length} cases
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
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
                  className={`border px-2.5 py-1 text-xs font-semibold transition ${
                    selectedCaseId === item.caseId
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.caseId}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <StructuredDataPanel
                title="Case trace"
                value={caseTraceText || "Select a case to inspect with/without-memory traces."}
                maxHeightClassName="max-h-72"
                compactChars={2600}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

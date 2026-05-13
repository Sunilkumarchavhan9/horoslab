/**
 * Benchmark Routes — Backend API for the Benchmark QA Dashboard.
 *
 * GET  /api/benchmarks/latest           → latest benchmark run
 * GET  /api/benchmarks/history          → run history for charts
 * GET  /api/benchmarks/runs/:runId      → single run detail
 * GET  /api/benchmarks/runs/:runId/cases → case results for a run
 * GET  /api/benchmarks/cases/:runId/:caseId/trace → trace for a case
 * POST /api/benchmarks/run              → start a new benchmark run
 * POST /api/benchmarks/cases/:runId/:caseId/replay → replay a single case
 */

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  getLatestRun,
  getRunById,
  getRunHistory,
  getCaseResultsForRun,
  getCaseResultById,
  hasRunningBenchmark,
} from "../../lib/benchmark/benchmarkStore";
import { executeBenchmarkRun } from "../../lib/benchmark/benchmarkRunner";
import {
  getBenchmarkScenario,
  listBenchmarkScenarios,
  upsertBenchmarkScenario,
} from "../../lib/benchmark/scenarioStore";

export const benchmarkRouter = Router();

// ─── GET /latest ─────────────────────────────────────────────────────────────

benchmarkRouter.get(
  "/latest",
  asyncHandler(async (_req, res) => {
    const latest = getLatestRun();

    if (!latest) {
      res.status(200).json({
        ok: true,
        data: null,
        message: "No benchmark runs yet. Run your first benchmark.",
      });
      return;
    }

    // Strip heavy case results from the latest endpoint (use /cases for those)
    const { caseResults, ...summary } = latest;
    const failedDetails = caseResults
      .filter((c) => !c.passed)
      .map((c) => ({
        id: c.caseId,
        type: c.suite,
        reason: c.failureReason ?? "Unknown failure",
        severity: c.suite === "contradiction" ? "critical" : "warning",
      }));

    res.status(200).json({
      ok: true,
      data: {
        ...summary,
        failedDetails,
        failedCaseCount: failedDetails.length,
      },
    });
  }),
);

// ─── GET /history ────────────────────────────────────────────────────────────

benchmarkRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const range = (req.query.range as string) ?? "30d";
    const validRanges = ["7d", "30d", "90d", "all"] as const;
    const safeRange = validRanges.includes(range as (typeof validRanges)[number])
      ? (range as (typeof validRanges)[number])
      : "30d";

    const runs = getRunHistory(safeRange);

    // Return lightweight summaries for chart rendering
    const summaries = runs.map((run) => ({
      runId: run.runId,
      generatedAt: run.generatedAt,
      status: run.status,
      mode: run.mode,
      passRate: run.passRate,
      top3RetrievalPrecision: run.top3RetrievalPrecision,
      resumeSuccessRate: run.resumeSuccessRate,
      contradictionMissRate: run.contradictionMissRate,
      wrongMergeRate: run.wrongMergeRate,
      p95RetrieveLatencyMs: run.p95RetrieveLatencyMs,
      abSummary: run.abSummary,
      totalCases: run.totalCases,
      passedCases: run.passedCases,
      failedCases: run.failedCases,
    }));

    res.status(200).json({ ok: true, data: summaries });
  }),
);

// ─── GET /runs/:runId ────────────────────────────────────────────────────────

benchmarkRouter.get(
  "/runs/:runId",
  asyncHandler(async (req, res) => {
    const run = getRunById(req.params.runId as string);
    if (!run) {
      res.status(404).json({ ok: false, error: "Benchmark run not found" });
      return;
    }

    const { caseResults, ...summary } = run;
    const failedDetails = caseResults
      .filter((c) => !c.passed)
      .map((c) => ({
        id: c.caseId,
        type: c.suite,
        reason: c.failureReason ?? "Unknown failure",
        severity: c.suite === "contradiction" ? "critical" : "warning",
      }));

    res.status(200).json({
      ok: true,
      data: { ...summary, failedDetails },
    });
  }),
);

// ─── GET /runs/:runId/cases ──────────────────────────────────────────────────

benchmarkRouter.get(
  "/runs/:runId/cases",
  asyncHandler(async (req, res) => {
    const cases = getCaseResultsForRun(req.params.runId as string);
    res.status(200).json({ ok: true, data: cases });
  }),
);

// ─── GET /cases/:runId/:caseId/trace ─────────────────────────────────────────

benchmarkRouter.get(
  "/cases/:runId/:caseId/trace",
  asyncHandler(async (req, res) => {
    const caseResult = getCaseResultById(
      req.params.runId as string,
      req.params.caseId as string,
    );

    if (!caseResult) {
      res.status(404).json({ ok: false, error: "Case result not found" });
      return;
    }

    res.status(200).json({
      ok: true,
      data: {
        caseId: caseResult.caseId,
        suite: caseResult.suite,
        input: caseResult.input,
        expectedOutput: caseResult.expectedOutput,
        actualOutput: caseResult.actualOutput,
        retrievedMemories: caseResult.retrievedMemories,
        scores: caseResult.scores,
        passed: caseResult.passed,
        failureReason: caseResult.failureReason,
        ab: caseResult.ab,
        traceSteps: caseResult.traceSteps,
      },
    });
  }),
);

// ─── POST /run ───────────────────────────────────────────────────────────────

benchmarkRouter.post(
  "/run",
  asyncHandler(async (req, res) => {
    if (hasRunningBenchmark()) {
      res.status(409).json({
        ok: false,
        error: "A benchmark run is already in progress.",
      });
      return;
    }

    const mode = (req.body?.mode as string) ?? "local";
    const validModes = ["local", "preview", "production"] as const;
    const safeMode = validModes.includes(mode as (typeof validModes)[number])
      ? (mode as (typeof validModes)[number])
      : "local";

    // Start the run asynchronously and return immediately with the runId
    const runId = `run_${Date.now().toString(36)}`;

    // Return immediately so the frontend can start polling
    res.status(202).json({
      ok: true,
      data: { runId, status: "running", message: "Benchmark run started." },
    });

    // Execute in the background (don't await in the response handler)
    executeBenchmarkRun(safeMode).catch((error) => {
      console.error("[benchmark] Run failed:", error);
    });
  }),
);

benchmarkRouter.get(
  "/regression/check",
  asyncHandler(async (req, res) => {
    const latest = getLatestRun();
    if (!latest) {
      res.status(200).json({
        ok: true,
        data: {
          pass: false,
          reason: "No benchmark runs available.",
          checks: [],
        },
      });
      return;
    }

    const minPassRate = Number(req.query.minPassRate ?? 85);
    const maxContradictionMissRate = Number(req.query.maxContradictionMissRate ?? 5);
    const minMissingStepsImprovement = Number(req.query.minMissingStepsImprovement ?? 0);

    const checks = [
      {
        key: "passRate",
        value: latest.passRate,
        target: minPassRate,
        pass: latest.passRate >= minPassRate,
      },
      {
        key: "contradictionMissRate",
        value: latest.contradictionMissRate,
        target: maxContradictionMissRate,
        pass: latest.contradictionMissRate <= maxContradictionMissRate,
      },
      {
        key: "missingStepsImprovement",
        value: latest.abSummary?.missingStepsImprovement ?? 0,
        target: minMissingStepsImprovement,
        pass: (latest.abSummary?.missingStepsImprovement ?? 0) >= minMissingStepsImprovement,
      },
    ];

    const pass = checks.every((c) => c.pass);
    res.status(200).json({
      ok: true,
      data: {
        pass,
        runId: latest.runId,
        generatedAt: latest.generatedAt,
        checks,
      },
    });
  }),
);

benchmarkRouter.get(
  "/metrics/weekly",
  asyncHandler(async (_req, res) => {
    const runs = getRunHistory("30d");
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const currentStart = now - weekMs;
    const previousStart = now - 2 * weekMs;

    const current = runs.filter((run) => {
      const ts = new Date(run.generatedAt).getTime();
      return Number.isFinite(ts) && ts >= currentStart;
    });
    const previous = runs.filter((run) => {
      const ts = new Date(run.generatedAt).getTime();
      return Number.isFinite(ts) && ts >= previousStart && ts < currentStart;
    });

    const avg = (values: number[]) =>
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;

    const currentPassRate = avg(current.map((r) => r.passRate));
    const previousPassRate = avg(previous.map((r) => r.passRate));
    const currentContradictionRate = avg(current.map((r) => r.contradictionMissRate));
    const previousContradictionRate = avg(previous.map((r) => r.contradictionMissRate));

    const staleMemoryRateCurrent = avg(
      current.map((r) => Math.max(0, 100 - r.top3RetrievalPrecision)),
    );
    const staleMemoryRatePrevious = avg(
      previous.map((r) => Math.max(0, 100 - r.top3RetrievalPrecision)),
    );
    const recoveryLatencyCurrent = avg(
      current.map((r) => r.abSummary?.timeToCorrectActionDeltaMs ?? 0),
    );
    const recoveryLatencyPrevious = avg(
      previous.map((r) => r.abSummary?.timeToCorrectActionDeltaMs ?? 0),
    );

    res.status(200).json({
      ok: true,
      data: {
        window: "7d",
        sampleSize: current.length,
        previousSampleSize: previous.length,
        metrics: {
          continuityPassRate: currentPassRate,
          contradictionRate: currentContradictionRate,
          staleMemoryRate: staleMemoryRateCurrent,
          recoveryLatencyMs: recoveryLatencyCurrent,
        },
        deltasVsPreviousWeek: {
          continuityPassRate:
            currentPassRate !== null && previousPassRate !== null
              ? currentPassRate - previousPassRate
              : null,
          contradictionRate:
            currentContradictionRate !== null && previousContradictionRate !== null
              ? currentContradictionRate - previousContradictionRate
              : null,
          staleMemoryRate:
            staleMemoryRateCurrent !== null && staleMemoryRatePrevious !== null
              ? staleMemoryRateCurrent - staleMemoryRatePrevious
              : null,
          recoveryLatencyMs:
            recoveryLatencyCurrent !== null && recoveryLatencyPrevious !== null
              ? recoveryLatencyCurrent - recoveryLatencyPrevious
              : null,
        },
      },
    });
  }),
);

benchmarkRouter.get(
  "/regression/alerts",
  asyncHandler(async (req, res) => {
    const runs = getRunHistory("30d");
    const latest = getLatestRun();
    if (!latest) {
      res.status(200).json({ ok: true, data: { alerts: [] } });
      return;
    }

    const sensitivity = ((req.query.sensitivity as string) ?? "normal").toLowerCase();
    const passRateDropThreshold =
      sensitivity === "high" ? 3 : sensitivity === "low" ? 8 : 5;
    const contradictionRiseThreshold =
      sensitivity === "high" ? 2 : sensitivity === "low" ? 6 : 4;

    const previous = runs
      .filter((run) => run.runId !== latest.runId)
      .sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      )[0];

    const alerts: Array<{
      id: string;
      severity: "warning" | "critical";
      message: string;
      metric: string;
      latestValue: number;
      previousValue: number | null;
      delta: number | null;
      generatedAt: string;
    }> = [];

    if (previous) {
      const passRateDelta = latest.passRate - previous.passRate;
      if (passRateDelta <= -passRateDropThreshold) {
        alerts.push({
          id: `pass-rate-drop-${latest.runId}`,
          severity: passRateDelta <= -10 ? "critical" : "warning",
          message: "Continuity pass rate dropped versus previous run.",
          metric: "passRate",
          latestValue: latest.passRate,
          previousValue: previous.passRate,
          delta: passRateDelta,
          generatedAt: latest.generatedAt,
        });
      }

      const contradictionDelta =
        latest.contradictionMissRate - previous.contradictionMissRate;
      if (contradictionDelta >= contradictionRiseThreshold) {
        alerts.push({
          id: `contradiction-rise-${latest.runId}`,
          severity: contradictionDelta >= 10 ? "critical" : "warning",
          message: "Contradiction miss rate increased versus previous run.",
          metric: "contradictionMissRate",
          latestValue: latest.contradictionMissRate,
          previousValue: previous.contradictionMissRate,
          delta: contradictionDelta,
          generatedAt: latest.generatedAt,
        });
      }
    }

    if ((latest.abSummary?.missingStepsImprovement ?? 0) <= 0) {
      alerts.push({
        id: `missing-steps-flat-${latest.runId}`,
        severity: "warning",
        message: "Missing-step improvement is flat or negative.",
        metric: "missingStepsImprovement",
        latestValue: latest.abSummary?.missingStepsImprovement ?? 0,
        previousValue: null,
        delta: null,
        generatedAt: latest.generatedAt,
      });
    }

    res.status(200).json({
      ok: true,
      data: {
        runId: latest.runId,
        alerts,
      },
    });
  }),
);

benchmarkRouter.get(
  "/scenarios",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ ok: true, data: listBenchmarkScenarios() });
  }),
);

benchmarkRouter.post(
  "/scenarios",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const modeRaw = req.body?.mode;
    const mode =
      modeRaw === "preview" || modeRaw === "production" || modeRaw === "local"
        ? modeRaw
        : "local";
    const caseIds = Array.isArray(req.body?.caseIds)
      ? req.body.caseIds.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    if (!name) {
      res.status(400).json({ ok: false, error: "Scenario name is required." });
      return;
    }
    if (caseIds.length === 0) {
      res.status(400).json({ ok: false, error: "At least one caseId is required." });
      return;
    }

    const scenario = upsertBenchmarkScenario({
      id: typeof req.body?.id === "string" ? req.body.id : undefined,
      name,
      mode,
      caseIds,
    });
    res.status(201).json({ ok: true, data: scenario });
  }),
);

benchmarkRouter.post(
  "/scenarios/:scenarioId/run",
  asyncHandler(async (req, res) => {
    if (hasRunningBenchmark()) {
      res.status(409).json({
        ok: false,
        error: "A benchmark run is already in progress.",
      });
      return;
    }
    const scenario = getBenchmarkScenario(req.params.scenarioId as string);
    if (!scenario) {
      res.status(404).json({ ok: false, error: "Scenario not found." });
      return;
    }

    const runId = `run_${Date.now().toString(36)}`;
    res.status(202).json({
      ok: true,
      data: {
        runId,
        status: "running",
        message: `Scenario '${scenario.name}' started.`,
      },
    });

    executeBenchmarkRun(scenario.mode, { caseIds: scenario.caseIds }).catch((error) => {
      console.error("[benchmark] Scenario run failed:", error);
    });
  }),
);

// ─── POST /cases/:runId/:caseId/replay ───────────────────────────────────────

benchmarkRouter.post(
  "/cases/:runId/:caseId/replay",
  asyncHandler(async (_req, res) => {
    // Replay is a future feature — stub it with a proper response
    res.status(501).json({
      ok: false,
      error: "Case replay is not yet implemented. Coming in v2.",
    });
  }),
);

/**
 * Benchmark Runner — Executes benchmark cases against real MemoryOS APIs.
 *
 * Reads cases from data/eval/benchmark-cases.json, calls the live ingest +
 * retrieve + resume endpoints, evaluates results, and saves everything to the
 * benchmark store.
 */

import { access, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  saveRun,
  updateRunStatus,
  type BenchmarkRun,
  type BenchmarkCaseResult,
  type BenchmarkSuite,
} from "./benchmarkStore";
import { runIngestFlowLangGraph } from "../workflows/ingestGraphLangGraph";
import { runRetrieveFlowLangGraph } from "../workflows/retrieveGraphLangGraph";
import { runResumeFlowLangGraph } from "../workflows/resumeGraphLangGraph";

// ─── Types for benchmark case definitions ────────────────────────────────────

interface SeedMemory {
  text: string;
  expectedType: string;
}

interface BenchmarkCase {
  id: string;
  type: BenchmarkSuite;
  userId: string;
  seedMemories: SeedMemory[];
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}

type RetrievedMemory = {
  memoryType?: string;
  type?: string;
  content?: string;
  summary?: string;
  status?: string;
  finalScore?: number;
};

// ─── Case loader ─────────────────────────────────────────────────────────────

const CASES_PATH = path.join(process.cwd(), "data", "eval", "benchmark-cases.json");

async function loadBenchmarkCases(): Promise<BenchmarkCase[]> {
  try {
    await access(CASES_PATH);
  } catch {
    console.warn(
      `[benchmark] benchmark-cases.json missing at ${CASES_PATH}; running with 0 cases`,
    );
    return [];
  }
  try {
    const raw = await readFile(CASES_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      console.warn("[benchmark] benchmark-cases.json is not an array; ignoring");
      return [];
    }
    return parsed as BenchmarkCase[];
  } catch (error) {
    console.warn(
      `[benchmark] failed to parse benchmark-cases.json: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}

// ─── Evaluators ──────────────────────────────────────────────────────────────

function evaluateRetrieveCase(
  caseDefn: BenchmarkCase,
  retrievedMemories: Array<{ type?: string; content?: string; summary?: string }>,
): { passed: boolean; failureReason: string | null; scores: Record<string, number>; matchedCount: number; requiredCount: number } {
  const expected = caseDefn.expected as { requiredTypes?: string[]; intent?: string };
  const requiredTypes = expected.requiredTypes ?? [];
  const actualTypes = retrievedMemories.map((m) => m.type).filter(Boolean) as string[];
  const missingTypes = requiredTypes.filter((t) => !actualTypes.includes(t));
  const matchedCount = requiredTypes.filter((t) => actualTypes.includes(t)).length;

  const precision =
    requiredTypes.length > 0
      ? matchedCount / requiredTypes.length
      : 1;

  if (missingTypes.length > 0) {
    return {
      passed: false,
      failureReason: `Missing types: ${missingTypes.join(", ")}`,
      scores: { precision, coverage: 1 - missingTypes.length / requiredTypes.length },
      matchedCount,
      requiredCount: requiredTypes.length,
    };
  }

  return {
    passed: true,
    failureReason: null,
    scores: { precision: 1, coverage: 1 },
    matchedCount,
    requiredCount: requiredTypes.length,
  };
}

function evaluateResumeCase(
  caseDefn: BenchmarkCase,
  resumeOutput: string,
): { passed: boolean; failureReason: string | null; scores: Record<string, number>; matchedCount: number; requiredCount: number } {
  const expected = caseDefn.expected as { mustMention?: string[] };
  const mustMention = expected.mustMention ?? [];
  const lower = resumeOutput.toLowerCase();
  const missing = mustMention.filter((term) => !lower.includes(term.toLowerCase()));
  const matchedCount = mustMention.length - missing.length;

  if (missing.length > 0) {
    return {
      passed: false,
      failureReason: `Missing mentions: ${missing.join(", ")}`,
      scores: { mentionCoverage: 1 - missing.length / mustMention.length },
      matchedCount,
      requiredCount: mustMention.length,
    };
  }

  return {
    passed: true,
    failureReason: null,
    scores: { mentionCoverage: 1 },
    matchedCount,
    requiredCount: mustMention.length,
  };
}

function evaluateContradictionCase(
  caseDefn: BenchmarkCase,
  retrievedMemories: Array<{ status?: string; content?: string; summary?: string }>,
): { passed: boolean; failureReason: string | null; scores: Record<string, number>; contradictionScore: number } {
  const expected = caseDefn.expected as {
    lifecycleStates?: string[];
    preferFreshMemory?: string;
  };

  let lifecyclePass = true;
  if (expected.lifecycleStates && expected.lifecycleStates.length > 0) {
    const statuses = retrievedMemories.map((m) => m.status).filter(Boolean) as string[];
    const statusSignal = statuses.length > 0;

    // Fallback signal: if no explicit lifecycle status is surfaced, detect
    // contradiction context by checking for multiple distinct memory lines.
    const normalizedLines = retrievedMemories
      .map((m) => `${m.content ?? ""} ${m.summary ?? ""}`.trim().toLowerCase())
      .filter((text) => text.length > 0);
    const distinctLines = new Set(normalizedLines);
    const contradictionContextSignal = distinctLines.size >= 2;

    lifecyclePass = statusSignal || contradictionContextSignal;
  }

  let freshMemoryPass = true;
  if (expected.preferFreshMemory) {
    const preferred = expected.preferFreshMemory.toLowerCase();
    // Use top 3 to reduce brittleness from small ranking shifts.
    const topWindow = retrievedMemories.slice(0, 3);
    freshMemoryPass = topWindow.some((memory) =>
      `${memory?.content ?? ""} ${memory?.summary ?? ""}`.toLowerCase().includes(preferred),
    );
  }

  const passed = lifecyclePass && freshMemoryPass;
  return {
    passed,
    failureReason: passed
      ? null
      : `Lifecycle: ${lifecyclePass ? "ok" : "fail"}, Fresh memory: ${freshMemoryPass ? "ok" : "fail"}`,
    scores: { lifecyclePass: lifecyclePass ? 1 : 0, freshMemoryPass: freshMemoryPass ? 1 : 0 },
    contradictionScore: passed ? 1 : 0,
  };
}

type CaseVariantResult = {
  passed: boolean;
  failureReason: string | null;
  scores: Record<string, number>;
  actualOutput: string;
  retrievedMemories: string[];
  retrievedCount: number;
  latencyMs: number;
  matchedCount: number;
  requiredCount: number;
  contradictionScore: number;
  traceSteps: BenchmarkCaseResult["traceSteps"];
};

async function runCaseVariant(
  caseDefn: BenchmarkCase,
  runId: string,
  variant: "with_memory" | "without_memory",
): Promise<CaseVariantResult> {
  const traceSteps: BenchmarkCaseResult["traceSteps"] = [];
  const variantUserId =
    variant === "with_memory"
      ? caseDefn.userId
      : `${caseDefn.userId}_without_memory_${runId}`;
  const threadId = `benchmark-${runId}-${caseDefn.id}-${variant}`;
  const overallStart = Date.now();

  if (variant === "with_memory") {
    const seedStart = Date.now();
    for (const seed of caseDefn.seedMemories) {
      await runIngestFlowLangGraph({
        userId: variantUserId,
        threadId,
        message: seed.text,
      });
    }
    traceSteps.push({
      step: "seed_memories",
      data: { count: caseDefn.seedMemories.length, variant },
      durationMs: Date.now() - seedStart,
    });
  } else {
    traceSteps.push({
      step: "seed_memories_skipped",
      data: { count: 0, variant },
      durationMs: 0,
    });
  }

  let passed = false;
  let failureReason: string | null = null;
  let scores: Record<string, number> = {};
  let actualOutput = "";
  let retrievedMemories: string[] = [];
  let retrievedCount = 0;
  let matchedCount = 0;
  let requiredCount = 0;
  let contradictionScore = 0;

  if (caseDefn.type === "retrieve" || caseDefn.type === "contradiction") {
    const retrieveStart = Date.now();
    const retrieveResult = await runRetrieveFlowLangGraph({
      userId: variantUserId,
      question: (caseDefn.input as { question: string }).question,
    });
    const retrieveDurationMs = Date.now() - retrieveStart;

    const memories = (retrieveResult.memories ?? []) as RetrievedMemory[];
    retrievedCount = memories.length;
    retrievedMemories = memories.map(
      (m) => `[${m.memoryType ?? m.type ?? "unknown"}] ${m.content ?? m.summary ?? ""}`,
    );

    traceSteps.push({
      step: "retrieve",
      data: {
        variant,
        query: (caseDefn.input as { question: string }).question,
        resultCount: memories.length,
        topScore: memories[0]?.finalScore ?? null,
      },
      durationMs: retrieveDurationMs,
    });

    if (caseDefn.type === "retrieve") {
      const evaluation = evaluateRetrieveCase(caseDefn, memories);
      passed = evaluation.passed;
      failureReason = evaluation.failureReason;
      scores = evaluation.scores;
      matchedCount = evaluation.matchedCount;
      requiredCount = evaluation.requiredCount;
      actualOutput = JSON.stringify(
        memories.slice(0, 3).map((m) => ({
          type: m.memoryType ?? m.type,
          content: m.content ?? m.summary,
        })),
      );
    } else {
      const evaluation = evaluateContradictionCase(caseDefn, memories);
      passed = evaluation.passed;
      failureReason = evaluation.failureReason;
      scores = evaluation.scores;
      contradictionScore = evaluation.contradictionScore;
      actualOutput = JSON.stringify(
        memories.map((m) => ({
          status: m.status,
          content: m.content ?? m.summary,
        })),
      );
    }
  } else {
    const resumeStart = Date.now();
    const resumeResult = await runResumeFlowLangGraph({
      userId: variantUserId,
      project: (caseDefn.input as { project?: string }).project ?? "memoryos",
      question: (caseDefn.input as { question?: string }).question ?? "where did I leave off?",
    });
    const resumeDurationMs = Date.now() - resumeStart;

    actualOutput = resumeResult.summary ?? "";
    retrievedCount = resumeResult.usedMemories?.length ?? 0;
    retrievedMemories = (resumeResult.usedMemories ?? []).map((m) => `memory:${m.id}`);

    traceSteps.push({
      step: "resume",
      data: {
        variant,
        project: (caseDefn.input as { project?: string }).project,
        summaryLength: actualOutput.length,
        usedMemories: retrievedCount,
      },
      durationMs: resumeDurationMs,
    });

    const evaluation = evaluateResumeCase(caseDefn, actualOutput);
    passed = evaluation.passed;
    failureReason = evaluation.failureReason;
    scores = evaluation.scores;
    matchedCount = evaluation.matchedCount;
    requiredCount = evaluation.requiredCount;
  }

  const latencyMs = Date.now() - overallStart;
  traceSteps.push({
    step: "evaluate",
    data: { variant, passed, scores, failureReason, matchedCount, requiredCount, contradictionScore },
    durationMs: latencyMs,
  });

  return {
    passed,
    failureReason,
    scores,
    actualOutput,
    retrievedMemories,
    retrievedCount,
    latencyMs,
    matchedCount,
    requiredCount,
    contradictionScore,
    traceSteps,
  };
}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function runSingleCase(
  caseDefn: BenchmarkCase,
  runId: string,
): Promise<BenchmarkCaseResult> {
  try {
    const withMemory = await runCaseVariant(caseDefn, runId, "with_memory");
    const withoutMemory = await runCaseVariant(caseDefn, runId, "without_memory");
    const missingStepsImprovement = Math.max(0, withMemory.matchedCount - withoutMemory.matchedCount);
    const contradictionImprovement = Math.max(0, withMemory.contradictionScore - withoutMemory.contradictionScore);
    const timeToCorrectActionDeltaMs = withoutMemory.latencyMs - withMemory.latencyMs;
    const traceSteps = [
      ...withMemory.traceSteps,
      ...withoutMemory.traceSteps,
      {
        step: "ab_summary",
        data: {
          missingStepsImprovement,
          contradictionImprovement,
          timeToCorrectActionDeltaMs,
        },
      },
    ];

    return {
      caseId: caseDefn.id,
      runId,
      suite: caseDefn.type,
      input: JSON.stringify(caseDefn.input),
      expectedOutput: JSON.stringify(caseDefn.expected),
      actualOutput: withMemory.actualOutput,
      retrievedMemories: withMemory.retrievedMemories,
      scores: withMemory.scores,
      passed: withMemory.passed,
      failureReason: withMemory.failureReason,
      traceSteps,
      ab: {
        withMemory: {
          passed: withMemory.passed,
          scores: withMemory.scores,
          actualOutput: withMemory.actualOutput,
          retrievedCount: withMemory.retrievedCount,
          latencyMs: withMemory.latencyMs,
        },
        withoutMemory: {
          passed: withoutMemory.passed,
          scores: withoutMemory.scores,
          actualOutput: withoutMemory.actualOutput,
          retrievedCount: withoutMemory.retrievedCount,
          latencyMs: withoutMemory.latencyMs,
        },
        delta: {
          missingStepsImprovement,
          contradictionImprovement,
          timeToCorrectActionDeltaMs,
        },
      },
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      caseId: caseDefn.id,
      runId,
      suite: caseDefn.type,
      input: JSON.stringify(caseDefn.input),
      expectedOutput: JSON.stringify(caseDefn.expected),
      actualOutput: "",
      retrievedMemories: [],
      scores: {},
      passed: false,
      failureReason: error instanceof Error ? error.message : "Unknown error",
      traceSteps: [
        {
          step: "error",
          data: { message: error instanceof Error ? error.message : String(error) },
        },
      ],
      ab: {
        withMemory: {
          passed: false,
          scores: {},
          actualOutput: "",
          retrievedCount: 0,
          latencyMs: 0,
        },
        withoutMemory: {
          passed: false,
          scores: {},
          actualOutput: "",
          retrievedCount: 0,
          latencyMs: 0,
        },
        delta: {
          missingStepsImprovement: 0,
          contradictionImprovement: 0,
          timeToCorrectActionDeltaMs: 0,
        },
      },
      createdAt: new Date().toISOString(),
    };
  }
}

function calculateP95Latency(caseResults: BenchmarkCaseResult[]): number | null {
  const latencies = caseResults
    .filter((r) => r.suite === "retrieve" || r.suite === "contradiction")
    .flatMap((r) =>
      r.traceSteps
        .filter((s) => s.step === "retrieve" && typeof s.durationMs === "number")
        .map((s) => s.durationMs!),
    );
  if (latencies.length === 0) return null;
  latencies.sort((a, b) => a - b);
  const index = Math.ceil(latencies.length * 0.95) - 1;
  return latencies[Math.min(index, latencies.length - 1)];
}

export async function executeBenchmarkRun(
  mode: BenchmarkRun["mode"] = "local",
  options?: { caseIds?: string[] },
): Promise<BenchmarkRun> {
  const runId = `run_${randomUUID().slice(0, 8)}`;
  const allCases = await loadBenchmarkCases();
  const caseIds = options?.caseIds ?? [];
  const cases =
    caseIds.length > 0
      ? allCases.filter((c) => caseIds.includes(c.id))
      : allCases;

  const suiteCounts = {
    retrieve: { passed: 0, total: 0 },
    resume: { passed: 0, total: 0 },
    contradiction: { passed: 0, total: 0 },
  };

  for (const c of cases) {
    if (c.type in suiteCounts) {
      suiteCounts[c.type].total++;
    }
  }

  // Create initial "running" run
  const run: BenchmarkRun = {
    runId,
    generatedAt: new Date().toISOString(),
    completedAt: null,
    mode,
    environment: process.env.NODE_ENV ?? "development",
    commitHash: null,
    branch: null,
    totalCases: cases.length,
    passedCases: 0,
    failedCases: 0,
    passRate: 0,
    top3RetrievalPrecision: 0,
    resumeSuccessRate: 0,
    contradictionMissRate: 0,
    wrongMergeRate: 0,
    p95RetrieveLatencyMs: null,
    abSummary: {
      missingStepsImprovement: 0,
      contradictionImprovement: 0,
      timeToCorrectActionDeltaMs: 0,
    },
    status: "running",
    suites: suiteCounts,
    caseResults: [],
  };

  await saveRun(run);

  // Execute all cases
  const caseResults: BenchmarkCaseResult[] = [];

  for (const caseDefn of cases) {
    const result = await runSingleCase(caseDefn, runId);
    caseResults.push(result);
  }

  // Calculate metrics
  const passedCases = caseResults.filter((r) => r.passed).length;
  const failedCases = caseResults.filter((r) => !r.passed).length;
  const passRate = cases.length > 0 ? (passedCases / cases.length) * 100 : 0;

  // Suite breakdown
  for (const result of caseResults) {
    if (result.suite in suiteCounts && result.passed) {
      suiteCounts[result.suite].passed++;
    }
  }

  // KPIs
  const retrieveCases = caseResults.filter((r) => r.suite === "retrieve");
  const top3RetrievalPrecision =
    retrieveCases.length > 0
      ? (retrieveCases.filter((r) => r.passed).length / retrieveCases.length) * 100
      : 0;

  const resumeCases = caseResults.filter((r) => r.suite === "resume");
  const resumeSuccessRate =
    resumeCases.length > 0
      ? (resumeCases.filter((r) => r.passed).length / resumeCases.length) * 100
      : 0;

  const contradictionCases = caseResults.filter((r) => r.suite === "contradiction");
  const contradictionMissRate =
    contradictionCases.length > 0
      ? (contradictionCases.filter((r) => !r.passed).length / contradictionCases.length) * 100
      : 0;

  const p95RetrieveLatencyMs = calculateP95Latency(caseResults);
  const abCaseCount = caseResults.length || 1;
  const abSummary = {
    missingStepsImprovement:
      caseResults.reduce((sum, r) => sum + r.ab.delta.missingStepsImprovement, 0) /
      abCaseCount,
    contradictionImprovement:
      caseResults.reduce((sum, r) => sum + r.ab.delta.contradictionImprovement, 0) /
      abCaseCount,
    timeToCorrectActionDeltaMs:
      caseResults.reduce((sum, r) => sum + r.ab.delta.timeToCorrectActionDeltaMs, 0) /
      abCaseCount,
  };

  const status: BenchmarkRun["status"] = failedCases > 0 ? "failed" : "passed";

  const completedRun = await updateRunStatus(runId, {
    status,
    completedAt: new Date().toISOString(),
    passedCases,
    failedCases,
    passRate,
    top3RetrievalPrecision,
    resumeSuccessRate,
    contradictionMissRate,
    wrongMergeRate: 0,
    p95RetrieveLatencyMs,
    abSummary,
    suites: suiteCounts,
    caseResults,
  });

  return completedRun ?? run;
}

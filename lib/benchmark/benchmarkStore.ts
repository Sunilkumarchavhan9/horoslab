/**
 * Benchmark Store — JSON file-backed storage for benchmark runs and case results.
 *
 * Stores everything under data/eval/benchmark-runs.json so it persists across
 * restarts without requiring a Postgres migration (design-partner friendly).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BenchmarkRunStatus = "running" | "passed" | "failed";
export type BenchmarkMode = "local" | "preview" | "production";
export type BenchmarkSuite = "retrieve" | "resume" | "contradiction";

export interface BenchmarkCaseResult {
  caseId: string;
  runId: string;
  suite: BenchmarkSuite;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  retrievedMemories: string[];
  scores: Record<string, number>;
  passed: boolean;
  failureReason: string | null;
  traceSteps: Array<{
    step: string;
    data: unknown;
    durationMs?: number;
  }>;
  ab: {
    withMemory: {
      passed: boolean;
      scores: Record<string, number>;
      actualOutput: string;
      retrievedCount: number;
      latencyMs: number;
    };
    withoutMemory: {
      passed: boolean;
      scores: Record<string, number>;
      actualOutput: string;
      retrievedCount: number;
      latencyMs: number;
    };
    delta: {
      missingStepsImprovement: number;
      contradictionImprovement: number;
      timeToCorrectActionDeltaMs: number;
    };
  };
  createdAt: string;
}

export interface BenchmarkRun {
  runId: string;
  generatedAt: string;
  completedAt: string | null;
  mode: BenchmarkMode;
  environment: string;
  commitHash: string | null;
  branch: string | null;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  top3RetrievalPrecision: number;
  resumeSuccessRate: number;
  contradictionMissRate: number;
  wrongMergeRate: number;
  p95RetrieveLatencyMs: number | null;
  abSummary: {
    missingStepsImprovement: number;
    contradictionImprovement: number;
    timeToCorrectActionDeltaMs: number;
  };
  status: BenchmarkRunStatus;
  suites: {
    retrieve: { passed: number; total: number };
    resume: { passed: number; total: number };
    contradiction: { passed: number; total: number };
  };
  caseResults: BenchmarkCaseResult[];
}

interface BenchmarkStoreFile {
  runs: BenchmarkRun[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data", "eval");
const STORE_PATH = path.join(DATA_DIR, "benchmark-runs.json");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): BenchmarkStoreFile {
  ensureDataDir();
  if (!existsSync(STORE_PATH)) {
    return { runs: [] };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as BenchmarkStoreFile;
    if (!Array.isArray(parsed.runs)) {
      return { runs: [] };
    }
    return parsed;
  } catch {
    return { runs: [] };
  }
}

function writeStore(store: BenchmarkStoreFile): void {
  ensureDataDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAllRuns(): BenchmarkRun[] {
  return readStore().runs;
}

export function getLatestRun(): BenchmarkRun | null {
  const runs = readStore().runs;
  if (runs.length === 0) return null;
  return runs.reduce((latest, run) =>
    new Date(run.generatedAt).getTime() > new Date(latest.generatedAt).getTime()
      ? run
      : latest,
  );
}

export function getRunById(runId: string): BenchmarkRun | null {
  return readStore().runs.find((r) => r.runId === runId) ?? null;
}

export function getRunHistory(range: "7d" | "30d" | "90d" | "all"): BenchmarkRun[] {
  const runs = readStore().runs;
  if (range === "all") {
    return runs.sort(
      (a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime(),
    );
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return runs
    .filter((r) => new Date(r.generatedAt).getTime() >= cutoff)
    .sort(
      (a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime(),
    );
}

export function getCaseResultsForRun(runId: string): BenchmarkCaseResult[] {
  const run = getRunById(runId);
  return run?.caseResults ?? [];
}

export function getCaseResultById(
  runId: string,
  caseId: string,
): BenchmarkCaseResult | null {
  const results = getCaseResultsForRun(runId);
  return results.find((r) => r.caseId === caseId) ?? null;
}

export function saveRun(run: BenchmarkRun): void {
  const store = readStore();
  const existingIndex = store.runs.findIndex((r) => r.runId === run.runId);
  if (existingIndex >= 0) {
    store.runs[existingIndex] = run;
  } else {
    store.runs.push(run);
  }
  writeStore(store);
}

export function updateRunStatus(
  runId: string,
  updates: Partial<Pick<BenchmarkRun, "status" | "completedAt" | "passedCases" | "failedCases" | "passRate" | "totalCases" | "top3RetrievalPrecision" | "resumeSuccessRate" | "contradictionMissRate" | "wrongMergeRate" | "p95RetrieveLatencyMs" | "abSummary" | "suites" | "caseResults">>,
): BenchmarkRun | null {
  const store = readStore();
  const run = store.runs.find((r) => r.runId === runId);
  if (!run) return null;
  Object.assign(run, updates);
  writeStore(store);
  return run;
}

/** Check if there is a run currently in "running" status */
export function hasRunningBenchmark(): boolean {
  return readStore().runs.some((r) => r.status === "running");
}

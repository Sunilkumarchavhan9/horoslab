import { prisma } from "../storage/prismaClient";

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

function parseRun(raw: string): BenchmarkRun | null {
  try {
    const parsed = JSON.parse(raw) as BenchmarkRun;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getAllRuns(): Promise<BenchmarkRun[]> {
  const rows = await prisma.benchmarkRun.findMany({ orderBy: { generatedAt: "desc" } });
  return rows
    .map((row) => parseRun(row.dataJson))
    .filter((run): run is BenchmarkRun => run !== null);
}

export async function getLatestRun(): Promise<BenchmarkRun | null> {
  const row = await prisma.benchmarkRun.findFirst({ orderBy: { generatedAt: "desc" } });
  return row ? parseRun(row.dataJson) : null;
}

export async function getRunById(runId: string): Promise<BenchmarkRun | null> {
  const row = await prisma.benchmarkRun.findUnique({ where: { runId } });
  return row ? parseRun(row.dataJson) : null;
}

export async function getRunHistory(range: "7d" | "30d" | "90d" | "all"): Promise<BenchmarkRun[]> {
  const where =
    range === "all"
      ? undefined
      : {
          generatedAt: {
            gte: new Date(
              Date.now() -
                (range === "7d" ? 7 : range === "30d" ? 30 : 90) * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        };
  const rows = await prisma.benchmarkRun.findMany({
    ...(where ? { where } : {}),
    orderBy: { generatedAt: "asc" },
  });
  const runs = rows
    .map((row) => parseRun(row.dataJson))
    .filter((run): run is BenchmarkRun => run !== null);
  if (range === "all") {
    return runs;
  }
  return runs;
}

export async function getCaseResultsForRun(runId: string): Promise<BenchmarkCaseResult[]> {
  const run = await getRunById(runId);
  return run?.caseResults ?? [];
}

export async function getCaseResultById(
  runId: string,
  caseId: string,
): Promise<BenchmarkCaseResult | null> {
  const results = await getCaseResultsForRun(runId);
  return results.find((r) => r.caseId === caseId) ?? null;
}

export async function saveRun(run: BenchmarkRun): Promise<void> {
  await prisma.benchmarkRun.upsert({
    where: { runId: run.runId },
    create: {
      runId: run.runId,
      generatedAt: run.generatedAt,
      completedAt: run.completedAt,
      mode: run.mode,
      status: run.status,
      dataJson: JSON.stringify(run),
    },
    update: {
      generatedAt: run.generatedAt,
      completedAt: run.completedAt,
      mode: run.mode,
      status: run.status,
      dataJson: JSON.stringify(run),
    },
  });
}

export async function updateRunStatus(
  runId: string,
  updates: Partial<Pick<BenchmarkRun, "status" | "completedAt" | "passedCases" | "failedCases" | "passRate" | "totalCases" | "top3RetrievalPrecision" | "resumeSuccessRate" | "contradictionMissRate" | "wrongMergeRate" | "p95RetrieveLatencyMs" | "abSummary" | "suites" | "caseResults">>,
): Promise<BenchmarkRun | null> {
  const run = await getRunById(runId);
  if (!run) return null;
  Object.assign(run, updates);
  await saveRun(run);
  return run;
}

/** Check if there is a run currently in "running" status */
export async function hasRunningBenchmark(): Promise<boolean> {
  return (await prisma.benchmarkRun.count({ where: { status: "running" } })) > 0;
}

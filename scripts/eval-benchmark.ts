import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  resetMemoryStoreAdapter,
  setMemoryStoreAdapter,
} from "../lib/adapters/registry";
import type {
  MemoryStoreAdapter,
  MemoryStoreSearchResult,
} from "../lib/adapters/adapters";
import { getRecentMemories } from "../lib/memory/recentMemoryStore";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import { MEMORY_TYPES, type Memory, type MemoryType } from "../lib/memory/types";
import { runResumeFlowLangGraph } from "../lib/workflows/resumeGraphLangGraph";
import {
  resetDataDir,
  runCase,
  seedCaseMemories,
  type EvalCase,
} from "./eval/harness";
import { saveRun, type BenchmarkRun } from "../lib/benchmark/benchmarkStore";

type BenchmarkCase = {
  id: string;
  type: "retrieve" | "resume" | "contradiction";
  userId: string;
  seedMemories: unknown[];
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
};

type BenchmarkKpis = {
  top3_retrieval_precision: number;
  resume_success_rate: number | null;
  contradiction_miss_rate: number | null;
  wrong_merge_rate: number | null;
  p95_retrieve_latency: number | null;
};

type BenchmarkReport = {
  generatedAt: string;
  totalCases: number;
  executedSuiteCases: number;
  declaredCasesByType: {
    retrieve: number;
    resume: number;
    contradiction: number;
  };
  passedCases: number;
  failedCases: number;
  passRate: number;
  kpis: BenchmarkKpis;
  abSummary: {
    missingStepsImprovement: number;
  };
  results: BenchmarkCaseResult[];
};

type BenchmarkCaseResult = {
  id: string;
  type: "retrieve" | "resume" | "contradiction";
  passed: boolean;
  score: number;
  details: Record<string, unknown>;
};

const BENCHMARK_CASES_PATH = path.join(
  process.cwd(),
  "data",
  "eval",
  "benchmark-cases.json",
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function computeLexicalSimilarity(query: string, memory: string): number {
  const queryTokens = new Set(tokenize(query));
  const memoryTokens = new Set(tokenize(memory));

  if (queryTokens.size === 0 || memoryTokens.size === 0) {
    return 0.5;
  }

  let intersection = 0;
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...queryTokens, ...memoryTokens]).size;
  return union === 0 ? 0.5 : intersection / union;
}

function toSearchResult(memory: Memory, query: string): MemoryStoreSearchResult {
  return {
    id: memory.id,
    score: computeLexicalSimilarity(query, memory.content),
    memory: memory.content,
    metadata: {
      memoryId: memory.id,
      type: memory.type,
      summary: memory.summary,
      importanceScore: memory.importanceScore,
      confidence: memory.confidence,
      source: memory.source,
      status: memory.status,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      evidenceCount: memory.evidenceCount,
      developerSignals: memory.developerSignals,
    },
  };
}

class LocalBenchmarkMemoryStoreAdapter implements MemoryStoreAdapter {
  private readonly store = new Map<string, Memory>();

  async saveMemory(input: { memory: Memory }): Promise<{ id: string }> {
    this.store.set(input.memory.id, { ...input.memory });
    return { id: input.memory.id };
  }

  async searchMemory(input: {
    userId: string;
    query: string;
    topK?: number;
  }): Promise<MemoryStoreSearchResult[]> {
    const results = [...this.store.values()]
      .filter((memory) => memory.userId === input.userId)
      .map((memory) => toSearchResult(memory, input.query))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return results.slice(0, input.topK ?? 10);
  }

  async getMemoryById(input: { id: string }): Promise<MemoryStoreSearchResult | null> {
    const memory = this.store.get(input.id);
    if (!memory) {
      return null;
    }

    return toSearchResult(memory, memory.content);
  }
}

async function loadBenchmarkCases(): Promise<BenchmarkCase[]> {
  const jsonFile = await fs.promises.readFile(BENCHMARK_CASES_PATH, "utf8");
  const parsed: unknown = JSON.parse(jsonFile);

  if (!Array.isArray(parsed)) {
    throw new Error("benchmark-cases.json must contain an array");
  }

  return parsed as BenchmarkCase[];
}

function extractSeedMessages(testCase: BenchmarkCase): string[] {
  return testCase.seedMemories.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(
        `benchmark case ${testCase.id}: seedMemories[${index}] must be an object`,
      );
    }

    const text = (item as Record<string, unknown>).text;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error(
        `benchmark case ${testCase.id}: seedMemories[${index}].text must be a non-empty string`,
      );
    }

    return text;
  });
}

function toRetrieveEvalCase(testCase: BenchmarkCase): EvalCase {
  const requiredTypes = Array.isArray(testCase.expected.requiredTypes)
    ? testCase.expected.requiredTypes.filter(
        (item): item is EvalCase["expectedTypes"][number] => typeof item === "string",
      )
    : [];

  const question =
    typeof testCase.input.question === "string" ? testCase.input.question : "";

  if (!question) {
    throw new Error(
      `benchmark case ${testCase.id}: retrieve case requires input.question`,
    );
  }

  return {
    id: testCase.id,
    seedMessages: extractSeedMessages(testCase),
    query: question,
    expectedTypes: requiredTypes,
    topK:
      typeof testCase.input.topK === "number" && Number.isInteger(testCase.input.topK)
        ? testCase.input.topK
        : 5,
    includeArchived:
      typeof testCase.input.includeArchived === "boolean"
        ? testCase.input.includeArchived
        : undefined,
  };
}

function validateBenchmarkCases(cases: BenchmarkCase[]): void {
  for (const testCase of cases) {
    if (typeof testCase.id !== "string" || testCase.id.length === 0) {
      throw new Error("benchmark case id must be a non-empty string");
    }

    if (
      testCase.type !== "retrieve" &&
      testCase.type !== "resume" &&
      testCase.type !== "contradiction"
    ) {
      throw new Error(`benchmark case ${testCase.id}: invalid type`);
    }

    if (typeof testCase.userId !== "string" || testCase.userId.length === 0) {
      throw new Error(`benchmark case ${testCase.id}: userId must be a non-empty string`);
    }

    if (!Array.isArray(testCase.seedMemories)) {
      throw new Error(`benchmark case ${testCase.id}: seedMemories must be an array`);
    }

    if (!testCase.input || typeof testCase.input !== "object") {
      throw new Error(`benchmark case ${testCase.id}: input must be an object`);
    }

    if (!testCase.expected || typeof testCase.expected !== "object") {
      throw new Error(`benchmark case ${testCase.id}: expected must be an object`);
    }
  }
}

function printBenchmarkCaseResult(result: BenchmarkCaseResult): void {
  const status = result.passed ? "PASS" : "FAIL";
  console.log(`\n[${status}] ${result.type} :: ${result.id}`);
}

async function runRetrieveCase(
  testCase: BenchmarkCase,
): Promise<BenchmarkCaseResult> {
  const evalCase = toRetrieveEvalCase(testCase);
  const result = await runCase(evalCase);

  return {
    id: testCase.id,
    type: "retrieve",
    passed: result.pass,
    score: result.pass ? 1 : 0,
    details: {
      expectedTypes: result.expectedTypes,
      forbiddenTypes: result.forbiddenTypes,
      actualTypes: result.actualTypes,
      missingTypes: result.missingTypes,
      forbiddenPresentTypes: result.forbiddenPresentTypes,
      topMemory: result.topMemory ?? null,
      topExpectationFailed: result.topExpectationFailed,
    },
  };
}

async function runRetrieveCaseWithoutMemory(
  testCase: BenchmarkCase,
): Promise<BenchmarkCaseResult> {
  const requiredTypes = Array.isArray(testCase.expected.requiredTypes)
    ? testCase.expected.requiredTypes.filter(
        (item): item is MemoryType =>
          typeof item === "string" && (MEMORY_TYPES as readonly string[]).includes(item),
      )
    : [];
  const question =
    typeof testCase.input.question === "string" ? testCase.input.question : "";

  if (!question) {
    throw new Error(
      `benchmark case ${testCase.id}: retrieve case requires input.question`,
    );
  }

  const retrieval = await retrieveRelevantMemory({
    userId: `${testCase.userId}_without_memory_${Date.now()}`,
    question,
    topK:
      typeof testCase.input.topK === "number" && Number.isInteger(testCase.input.topK)
        ? testCase.input.topK
        : 5,
    includeArchived:
      typeof testCase.input.includeArchived === "boolean"
        ? testCase.input.includeArchived
        : undefined,
  });

  const actualTypes = (retrieval.memories ?? []).map((m) => m.memoryType ?? null);
  const actualTypesAsStrings: MemoryType[] = actualTypes.flatMap((value) =>
    typeof value === "string" && value.length > 0 ? [value] : [],
  );
  const missingTypes = requiredTypes.filter(
    (type) => !actualTypesAsStrings.includes(type),
  );
  const passed = missingTypes.length === 0;

  return {
    id: `${testCase.id}__without_memory`,
    type: "retrieve",
    passed,
    score: passed ? 1 : 0,
    details: {
      expectedTypes: requiredTypes,
      actualTypes,
      missingTypes,
    },
  };
}

async function runResumeCase(
  testCase: BenchmarkCase,
): Promise<BenchmarkCaseResult> {
  resetDataDir();

  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const userId = `${testCase.userId}_${runId}`;
  const seedMessages = extractSeedMessages(testCase);
  await seedCaseMemories(userId, seedMessages);

  const project =
    typeof testCase.input.project === "string" ? testCase.input.project : undefined;
  const question =
    typeof testCase.input.question === "string" ? testCase.input.question : "";

  if (!project) {
    throw new Error(`benchmark case ${testCase.id}: resume case requires input.project`);
  }

  if (!question) {
    throw new Error(`benchmark case ${testCase.id}: resume case requires input.question`);
  }

  const result = await runResumeFlowLangGraph({
    userId,
    project,
    question,
    topK:
      typeof testCase.input.topK === "number" && Number.isInteger(testCase.input.topK)
        ? testCase.input.topK
        : undefined,
  });

  const combinedText = [
    result.summary,
    result.lastKnownState,
    result.recommendedNextStep,
    ...result.openLoops,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  const mustMention = Array.isArray(testCase.expected.mustMention)
    ? testCase.expected.mustMention.filter((item): item is string => typeof item === "string")
    : [];

  const missing = mustMention.filter(
    (phrase) => !combinedText.includes(phrase.toLowerCase()),
  );

  const score =
    mustMention.length === 0
      ? result.usedMemories.length > 0
        ? 1
        : 0
      : (mustMention.length - missing.length) / mustMention.length;

  return {
    id: testCase.id,
    type: "resume",
    passed: missing.length === 0,
    score,
    details: {
      mustMention,
      missing,
      summary: result.summary,
      lastKnownState: result.lastKnownState,
      recommendedNextStep: result.recommendedNextStep,
      openLoops: result.openLoops,
      usedMemoryIds: result.usedMemories.map((memory) => memory.id),
    },
  };
}

async function runResumeCaseWithoutMemory(
  testCase: BenchmarkCase,
): Promise<BenchmarkCaseResult> {
  resetDataDir();
  const userId = `${testCase.userId}_without_memory_${Date.now()}`;
  const project =
    typeof testCase.input.project === "string" ? testCase.input.project : undefined;
  const question =
    typeof testCase.input.question === "string" ? testCase.input.question : "";

  if (!project || !question) {
    throw new Error(`benchmark case ${testCase.id}: resume case requires input.project and input.question`);
  }

  const result = await runResumeFlowLangGraph({ userId, project, question });
  const combinedText = [
    result.summary,
    result.lastKnownState,
    result.recommendedNextStep,
    ...result.openLoops,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  const mustMention = Array.isArray(testCase.expected.mustMention)
    ? testCase.expected.mustMention.filter((item): item is string => typeof item === "string")
    : [];
  const missing = mustMention.filter(
    (phrase) => !combinedText.includes(phrase.toLowerCase()),
  );

  return {
    id: `${testCase.id}__without_memory`,
    type: "resume",
    passed: missing.length === 0,
    score:
      mustMention.length === 0 ? (result.usedMemories.length > 0 ? 1 : 0) : (mustMention.length - missing.length) / mustMention.length,
    details: {
      mustMention,
      missing,
      summary: result.summary,
      usedMemoryIds: result.usedMemories.map((memory) => memory.id),
    },
  };
}

async function runContradictionCase(
  testCase: BenchmarkCase,
): Promise<BenchmarkCaseResult> {
  resetDataDir();

  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const userId = `${testCase.userId}_${runId}`;
  const seedMessages = extractSeedMessages(testCase);
  await seedCaseMemories(userId, seedMessages);

  const statuses = (await getRecentMemories(userId)).map(
    (memory) => memory.status,
  );
  const expectedStates = Array.isArray(testCase.expected.lifecycleStates)
    ? testCase.expected.lifecycleStates.filter((item): item is string => typeof item === "string")
    : [];

  const preferFreshMemory =
    typeof testCase.expected.preferFreshMemory === "string"
      ? testCase.expected.preferFreshMemory
      : undefined;
  const question =
    typeof testCase.input.question === "string" ? testCase.input.question : "";

  let topMemory: string | null = null;
  let freshMemoryPass = true;

  if (preferFreshMemory && question) {
    const retrieval = await retrieveRelevantMemory({
      userId,
      question,
      topK: 5,
    });
    topMemory = retrieval.memories[0]?.memory ?? null;
    freshMemoryPass =
      typeof topMemory === "string" &&
      topMemory.toLowerCase().includes(preferFreshMemory.toLowerCase());
  }

  const lifecyclePass =
    expectedStates.length === 0 ||
    expectedStates.some((state) => statuses.includes(state as Memory["status"]));

  const passed = lifecyclePass && freshMemoryPass;

  return {
    id: testCase.id,
    type: "contradiction",
    passed,
    score: passed ? 1 : 0,
    details: {
      statuses,
      expectedStates,
      topMemory,
      preferFreshMemory: preferFreshMemory ?? null,
      lifecyclePass,
      freshMemoryPass,
    },
  };
}

async function runBenchmarkCase(
  testCase: BenchmarkCase,
): Promise<BenchmarkCaseResult> {
  if (testCase.type === "retrieve") {
    return runRetrieveCase(testCase);
  }

  if (testCase.type === "resume") {
    return runResumeCase(testCase);
  }

  return runContradictionCase(testCase);
}

function buildBenchmarkReport(params: {
  generatedAt: string;
  executedSuiteCases: number;
  declaredCasesByType: {
    retrieve: number;
    resume: number;
    contradiction: number;
  };
  passedCases: number;
  totalCases: number;
  results: BenchmarkCaseResult[];
}): BenchmarkReport {
  const failedCases = params.totalCases - params.passedCases;
  const passRate =
    params.totalCases === 0 ? 0 : (params.passedCases / params.totalCases) * 100;

  const retrievalCases = params.results.filter((result) => result.type === "retrieve");
  const resumeCases = params.results.filter((result) => result.type === "resume");
  const contradictionCases = params.results.filter(
    (result) => result.type === "contradiction",
  );

  const retrievalPassRate =
    retrievalCases.length === 0
      ? 0
      : (retrievalCases.filter((result) => result.passed).length / retrievalCases.length) *
        100;
  const resumePassRate =
    resumeCases.length === 0
      ? null
      : (resumeCases.filter((result) => result.passed).length / resumeCases.length) *
        100;
  const contradictionMissRate =
    contradictionCases.length === 0
      ? null
      : (contradictionCases.filter((result) => !result.passed).length /
          contradictionCases.length) *
        100;

  const missingStepsImprovement = (() => {
    const deltas = params.results
      .map((result) => {
        const details = result.details as Record<string, unknown>;
        const value = details.missingStepsImprovement;
        return typeof value === "number" ? value : null;
      })
      .filter((value): value is number => value !== null);
    if (deltas.length === 0) return 0;
    return deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  })();

  return {
    generatedAt: params.generatedAt,
    totalCases: params.totalCases,
    executedSuiteCases: params.executedSuiteCases,
    declaredCasesByType: params.declaredCasesByType,
    passedCases: params.passedCases,
    failedCases,
    passRate,
    kpis: {
      top3_retrieval_precision: retrievalPassRate,
      resume_success_rate: resumePassRate,
      contradiction_miss_rate: contradictionMissRate,
      wrong_merge_rate: null,
      p95_retrieve_latency: null,
    },
    abSummary: {
      missingStepsImprovement,
    },
    results: params.results,
  };
}

function reportToBenchmarkRun(report: BenchmarkReport): BenchmarkRun {
  const runId = `eval_${new Date(report.generatedAt).getTime().toString(36)}`;
  return {
    runId,
    generatedAt: report.generatedAt,
    completedAt: report.generatedAt,
    mode: "local",
    environment: process.env.NODE_ENV ?? "development",
    commitHash: null,
    branch: null,
    totalCases: report.totalCases,
    passedCases: report.passedCases,
    failedCases: report.failedCases,
    passRate: report.passRate,
    top3RetrievalPrecision: report.kpis.top3_retrieval_precision,
    resumeSuccessRate: report.kpis.resume_success_rate ?? 0,
    contradictionMissRate: report.kpis.contradiction_miss_rate ?? 0,
    wrongMergeRate: report.kpis.wrong_merge_rate ?? 0,
    p95RetrieveLatencyMs: report.kpis.p95_retrieve_latency,
    abSummary: {
      missingStepsImprovement: report.abSummary.missingStepsImprovement,
      contradictionImprovement: 0,
      timeToCorrectActionDeltaMs: 0,
    },
    status: report.failedCases > 0 ? "failed" : "passed",
    suites: {
      retrieve: {
        passed: report.results.filter((result) => result.type === "retrieve" && result.passed).length,
        total: report.results.filter((result) => result.type === "retrieve").length,
      },
      resume: {
        passed: report.results.filter((result) => result.type === "resume" && result.passed).length,
        total: report.results.filter((result) => result.type === "resume").length,
      },
      contradiction: {
        passed: report.results.filter((result) => result.type === "contradiction" && result.passed).length,
        total: report.results.filter((result) => result.type === "contradiction").length,
      },
    },
    caseResults: report.results.map((result) => ({
      caseId: result.id,
      runId,
      suite: result.type,
      input: "",
      expectedOutput: "",
      actualOutput: JSON.stringify(result.details),
      retrievedMemories: [],
      scores: { score: result.score },
      passed: result.passed,
      failureReason: result.passed ? null : "Benchmark case failed.",
      traceSteps: [{ step: "eval-benchmark", data: result.details }],
      ab: {
        withMemory: {
          passed: result.passed,
          scores: { score: result.score },
          actualOutput: JSON.stringify(result.details),
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
          missingStepsImprovement:
            typeof result.details.missingStepsImprovement === "number"
              ? result.details.missingStepsImprovement
              : 0,
          contradictionImprovement: 0,
          timeToCorrectActionDeltaMs: 0,
        },
      },
      createdAt: report.generatedAt,
    })),
  };
}

async function main(): Promise<void> {
  const benchmarkCases = await loadBenchmarkCases();
  validateBenchmarkCases(benchmarkCases);
  setMemoryStoreAdapter(new LocalBenchmarkMemoryStoreAdapter());

  try {
    const results: BenchmarkCaseResult[] = [];

    for (const testCase of benchmarkCases) {
      const result = await runBenchmarkCase(testCase);
      let missingStepsImprovement = 0;

      if (testCase.type === "retrieve") {
        const without = await runRetrieveCaseWithoutMemory(testCase);
        const withMissing = Array.isArray((result.details as Record<string, unknown>).missingTypes)
          ? ((result.details as Record<string, unknown>).missingTypes as unknown[]).length
          : 0;
        const withoutMissing = Array.isArray((without.details as Record<string, unknown>).missingTypes)
          ? ((without.details as Record<string, unknown>).missingTypes as unknown[]).length
          : 0;
        missingStepsImprovement = Math.max(0, withoutMissing - withMissing);
      } else if (testCase.type === "resume") {
        const without = await runResumeCaseWithoutMemory(testCase);
        const withMissing = Array.isArray((result.details as Record<string, unknown>).missing)
          ? ((result.details as Record<string, unknown>).missing as unknown[]).length
          : 0;
        const withoutMissing = Array.isArray((without.details as Record<string, unknown>).missing)
          ? ((without.details as Record<string, unknown>).missing as unknown[]).length
          : 0;
        missingStepsImprovement = Math.max(0, withoutMissing - withMissing);
      }

      result.details = {
        ...result.details,
        missingStepsImprovement,
      };
      results.push(result);
      printBenchmarkCaseResult(result);
    }

    const generatedAt = new Date().toISOString();
    const passedCases = results.filter((result) => result.passed).length;

    const report = buildBenchmarkReport({
      generatedAt,
      executedSuiteCases: results.length,
      declaredCasesByType: {
        retrieve: benchmarkCases.filter((testCase) => testCase.type === "retrieve")
          .length,
        resume: benchmarkCases.filter((testCase) => testCase.type === "resume")
          .length,
        contradiction: benchmarkCases.filter(
          (testCase) => testCase.type === "contradiction",
        ).length,
      },
      passedCases,
      totalCases: results.length,
      results,
    });

    await saveRun(reportToBenchmarkRun(report));

    console.log("\nBenchmark mode: deterministic Prisma-compatible adapter");
    console.log("\nBenchmark report:");
    console.log(JSON.stringify(report, null, 2));

    if (
      report.kpis.top3_retrieval_precision < 95 ||
      (typeof report.kpis.resume_success_rate === "number" &&
        report.kpis.resume_success_rate < 95) ||
      (typeof report.kpis.contradiction_miss_rate === "number" &&
        report.kpis.contradiction_miss_rate > 10)
    ) {
      process.exitCode = 1;
    }
  } finally {
    resetMemoryStoreAdapter();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

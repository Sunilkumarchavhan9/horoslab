import "dotenv/config";
import { readFileSync, existsSync, rmSync, mkdirSync } from "fs";
import path from "path";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import type { MemoryType } from "../lib/memory/types";

type EvalCase = {
  id: string;
  seedMessages: string[];
  query: string;
  expectedTypes: MemoryType[];
  topK?: number;
};

type EvalResult = {
  id: string;
  pass: boolean;
  expectedTypes: MemoryType[];
  actualTypes: (MemoryType | undefined)[];
  missingTypes: MemoryType[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const PRIMARY_CASES_PATH = path.join(
  process.cwd(),
  "scripts",
  "eval",
  "retrieval-cases.json",
);
const FALLBACK_CASES_PATH = path.join(
  process.cwd(),
  "data",
  "eval",
  "retrieval-cases.json",
);
const RUNTIME_STORE_FILES = [
  "recent-memories.json",
  "timeline-events.json",
  "revision-events.json",
];

function resetDataDir(): void {
  mkdirSync(DATA_DIR, { recursive: true });

  for (const fileName of RUNTIME_STORE_FILES) {
    const filePath = path.join(DATA_DIR, fileName);
    if (existsSync(filePath)) {
      rmSync(filePath, { force: true });
    }
  }
}

function resolveCasesPath(): string {
  if (existsSync(PRIMARY_CASES_PATH)) {
    return PRIMARY_CASES_PATH;
  }

  if (existsSync(FALLBACK_CASES_PATH)) {
    return FALLBACK_CASES_PATH;
  }

  throw new Error(
    `retrieval cases file not found. looked in:\n- ${PRIMARY_CASES_PATH}\n- ${FALLBACK_CASES_PATH}`,
  );
}

function loadCases(): EvalCase[] {
  const casesPath = resolveCasesPath();
  const raw = readFileSync(casesPath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("retrieval-cases.json must be an array");
  }

  const cases: EvalCase[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      throw new Error("each case must be an object");
    }

    const obj = item as Record<string, unknown>;

    if (typeof obj.id !== "string" || obj.id.length === 0) {
      throw new Error("case.id must be a non-empty string");
    }

    if (
      !Array.isArray(obj.seedMessages) ||
      obj.seedMessages.some((m) => typeof m !== "string" || m.length === 0)
    ) {
      throw new Error(`case ${obj.id}: seedMessages must be string[]`);
    }

    if (typeof obj.query !== "string" || obj.query.length === 0) {
      throw new Error(`case ${obj.id}: query must be a non-empty string`);
    }

    if (
      !Array.isArray(obj.expectedTypes) ||
      obj.expectedTypes.some((t) => typeof t !== "string" || t.length === 0)
    ) {
      throw new Error(`case ${obj.id}: expectedTypes must be string[]`);
    }

    if (
      obj.topK !== undefined &&
      (typeof obj.topK !== "number" ||
        !Number.isInteger(obj.topK) ||
        obj.topK <= 0)
    ) {
      throw new Error(`case ${obj.id}: topK must be a positive integer`);
    }

    cases.push({
      id: obj.id,
      seedMessages: obj.seedMessages as string[],
      query: obj.query,
      expectedTypes: obj.expectedTypes as MemoryType[],
      topK: obj.topK as number | undefined,
    });
  }

  return cases;
}

async function seedCaseMemories(userId: string, messages: string[]): Promise<void> {
  let index = 1;

  for (const message of messages) {
    await runIngestFlowLangGraph({
      userId,
      threadId: `eval-thread-${index}`,
      message,
    });
    index += 1;
  }
}

function evaluateTypes(
  expected: MemoryType[],
  actual: (MemoryType | undefined)[],
): { pass: boolean; missingTypes: MemoryType[] } {
  const actualSet = new Set(
    actual.filter((t): t is MemoryType => typeof t === "string"),
  );
  const missingTypes = expected.filter((type) => !actualSet.has(type));

  return {
    pass: missingTypes.length === 0,
    missingTypes,
  };
}

async function runCase(testCase: EvalCase): Promise<EvalResult> {
  resetDataDir();

  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const userId = `u_eval_${testCase.id}_${runId}`;
  await seedCaseMemories(userId, testCase.seedMessages);

  const retrieval = await retrieveRelevantMemory({
    userId,
    question: testCase.query,
    topK: testCase.topK ?? 5,
  });

  const actualTypes = retrieval.memories.map((m) => m.memoryType);
  const { pass, missingTypes } = evaluateTypes(
    testCase.expectedTypes,
    actualTypes,
  );

  return {
    id: testCase.id,
    pass,
    expectedTypes: testCase.expectedTypes,
    actualTypes,
    missingTypes,
  };
}

function printResult(result: EvalResult): void {
  const status = result.pass ? "PASS" : "FAIL";

  console.log(`\n[${status}] ${result.id}`);
  console.log(`  expectedTypes: ${result.expectedTypes.join(", ")}`);
  console.log(
    `  actualTypes: ${result.actualTypes.map((t) => t ?? "unknown").join(", ")}`,
  );

  if (!result.pass) {
    console.log(`  missingTypes: ${result.missingTypes.join(", ")}`);
  }
}

async function main(): Promise<void> {
  const cases = loadCases();
  const results: EvalResult[] = [];

  for (const testCase of cases) {
    const result = await runCase(testCase);
    results.push(result);
    printResult(result);
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const score = total === 0 ? 0 : (passed / total) * 100;

  console.log(`\nSummary: ${passed}/${total} passed (${score.toFixed(1)}%)`);
  process.exit(score >= 80 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

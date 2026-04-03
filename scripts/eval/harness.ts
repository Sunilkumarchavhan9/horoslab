import "dotenv/config";
import { readFileSync, existsSync, rmSync, mkdirSync } from "fs";
import path from "path";
import { runIngestFlowLangGraph } from "../../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../../lib/memory/retrieveRelevantMemory";
import { saveMemoryToMem0 } from "../../lib/integrations/mem0";
import { upsertRecentMemory } from "../../lib/memory/recentMemoryStore";
import type { Memory, MemoryType } from "../../lib/memory/types";

export type AgeAcceptedConfig = {
  acceptedIndex: number;
  daysAgo: number;
};

export type EvalCase = {
  id: string;
  seedMessages: string[];
  query: string;
  expectedTypes: MemoryType[];
  forbiddenTypes?: MemoryType[];
  includeArchived?: boolean;
  archiveAcceptedIndices?: number[];
  ageAccepted?: AgeAcceptedConfig[];
  expectedTopContains?: string;
  topK?: number;
};

export type EvalResult = {
  id: string;
  pass: boolean;
  expectedTypes: MemoryType[];
  forbiddenTypes: MemoryType[];
  actualTypes: (MemoryType | undefined)[];
  missingTypes: MemoryType[];
  forbiddenPresentTypes: MemoryType[];
  topMemory?: string;
  topExpectationFailed: boolean;
};

export type EvalSummary = {
  results: EvalResult[];
  passed: number;
  total: number;
  score: number;
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

export function resetDataDir(): void {
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

export function loadCases(): EvalCase[] {
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

    if (
      obj.forbiddenTypes !== undefined &&
      (!Array.isArray(obj.forbiddenTypes) ||
        obj.forbiddenTypes.some((t) => typeof t !== "string" || t.length === 0))
    ) {
      throw new Error(`case ${obj.id}: forbiddenTypes must be string[]`);
    }

    if (
      obj.includeArchived !== undefined &&
      typeof obj.includeArchived !== "boolean"
    ) {
      throw new Error(`case ${obj.id}: includeArchived must be boolean`);
    }

    if (
      obj.archiveAcceptedIndices !== undefined &&
      (!Array.isArray(obj.archiveAcceptedIndices) ||
        obj.archiveAcceptedIndices.some(
          (idx) => typeof idx !== "number" || !Number.isInteger(idx) || idx < 0,
        ))
    ) {
      throw new Error(`case ${obj.id}: archiveAcceptedIndices must be number[]`);
    }

    if (obj.ageAccepted !== undefined) {
      if (!Array.isArray(obj.ageAccepted)) {
        throw new Error(`case ${obj.id}: ageAccepted must be an array`);
      }

      for (const ageItem of obj.ageAccepted) {
        if (!ageItem || typeof ageItem !== "object") {
          throw new Error(`case ${obj.id}: ageAccepted items must be objects`);
        }

        const ageObj = ageItem as Record<string, unknown>;
        if (
          typeof ageObj.acceptedIndex !== "number" ||
          !Number.isInteger(ageObj.acceptedIndex) ||
          ageObj.acceptedIndex < 0
        ) {
          throw new Error(
            `case ${obj.id}: ageAccepted.acceptedIndex must be >= 0 integer`,
          );
        }
        if (
          typeof ageObj.daysAgo !== "number" ||
          !Number.isInteger(ageObj.daysAgo) ||
          ageObj.daysAgo <= 0
        ) {
          throw new Error(`case ${obj.id}: ageAccepted.daysAgo must be > 0 integer`);
        }
      }
    }

    if (
      obj.expectedTopContains !== undefined &&
      (typeof obj.expectedTopContains !== "string" ||
        obj.expectedTopContains.trim().length === 0)
    ) {
      throw new Error(
        `case ${obj.id}: expectedTopContains must be a non-empty string`,
      );
    }

    cases.push({
      id: obj.id,
      seedMessages: obj.seedMessages as string[],
      query: obj.query,
      expectedTypes: obj.expectedTypes as MemoryType[],
      forbiddenTypes: obj.forbiddenTypes as MemoryType[] | undefined,
      includeArchived: obj.includeArchived as boolean | undefined,
      archiveAcceptedIndices: obj.archiveAcceptedIndices as number[] | undefined,
      ageAccepted: obj.ageAccepted as AgeAcceptedConfig[] | undefined,
      expectedTopContains: obj.expectedTopContains as string | undefined,
      topK: obj.topK as number | undefined,
    });
  }

  return cases;
}

export async function seedCaseMemories(
  userId: string,
  messages: string[],
): Promise<Memory[]> {
  const acceptedMemories: Memory[] = [];
  let index = 1;

  for (const message of messages) {
    const result = await runIngestFlowLangGraph({
      userId,
      threadId: `eval-thread-${index}`,
      message,
    });
    acceptedMemories.push(...result.acceptedMemories);
    index += 1;
  }

  return acceptedMemories;
}

export async function applyCaseMutations(
  testCase: EvalCase,
  acceptedMemories: Memory[],
): Promise<void> {
  const archiveIndices = testCase.archiveAcceptedIndices ?? [];

  for (const acceptedIndex of archiveIndices) {
    const memory = acceptedMemories[acceptedIndex];
    if (!memory) {
      throw new Error(
        `case ${testCase.id}: archiveAcceptedIndices contains out-of-range index ${acceptedIndex}`,
      );
    }

    const archivedMemory: Memory = {
      ...memory,
      status: "archived",
      updatedAt: new Date().toISOString(),
    };

    await saveMemoryToMem0({ memory: archivedMemory });
    await upsertRecentMemory(archivedMemory);
    acceptedMemories[acceptedIndex] = archivedMemory;
  }

  const ageConfigs = testCase.ageAccepted ?? [];
  for (const config of ageConfigs) {
    const memory = acceptedMemories[config.acceptedIndex];
    if (!memory) {
      throw new Error(
        `case ${testCase.id}: ageAccepted contains out-of-range index ${config.acceptedIndex}`,
      );
    }

    const agedDate = new Date(
      Date.now() - config.daysAgo * 24 * 60 * 60 * 1000,
    ).toISOString();
    const agedMemory: Memory = {
      ...memory,
      updatedAt: agedDate,
    };

    await saveMemoryToMem0({ memory: agedMemory });
    await upsertRecentMemory(agedMemory);
    acceptedMemories[config.acceptedIndex] = agedMemory;
  }
}

export function evaluateTypes(
  expected: MemoryType[],
  forbidden: MemoryType[],
  actual: (MemoryType | undefined)[],
): {
  pass: boolean;
  missingTypes: MemoryType[];
  forbiddenPresentTypes: MemoryType[];
} {
  const actualSet = new Set(
    actual.filter((t): t is MemoryType => typeof t === "string"),
  );
  const missingTypes = expected.filter((type) => !actualSet.has(type));
  const forbiddenPresentTypes = forbidden.filter((type) => actualSet.has(type));

  return {
    pass: missingTypes.length === 0 && forbiddenPresentTypes.length === 0,
    missingTypes,
    forbiddenPresentTypes,
  };
}

export async function runCase(testCase: EvalCase): Promise<EvalResult> {
  resetDataDir();

  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const userId = `u_eval_${testCase.id}_${runId}`;
  const acceptedMemories = await seedCaseMemories(userId, testCase.seedMessages);
  await applyCaseMutations(testCase, acceptedMemories);

  const retrieval = await retrieveRelevantMemory({
    userId,
    question: testCase.query,
    topK: testCase.topK ?? 5,
    includeArchived: testCase.includeArchived === true,
  });

  const actualTypes = retrieval.memories.map((m) => m.memoryType);
  const forbiddenTypes = testCase.forbiddenTypes ?? [];
  const { pass: typePass, missingTypes, forbiddenPresentTypes } = evaluateTypes(
    testCase.expectedTypes,
    forbiddenTypes,
    actualTypes,
  );

  const topMemory = retrieval.memories[0]?.memory;
  const topExpectationFailed =
    typeof testCase.expectedTopContains === "string" &&
    testCase.expectedTopContains.length > 0
      ? !topMemory
          ?.toLowerCase()
          .includes(testCase.expectedTopContains.toLowerCase())
      : false;

  const pass = typePass && !topExpectationFailed;

  return {
    id: testCase.id,
    pass,
    expectedTypes: testCase.expectedTypes,
    forbiddenTypes,
    actualTypes,
    missingTypes,
    forbiddenPresentTypes,
    topMemory,
    topExpectationFailed,
  };
}

export function printResult(result: EvalResult): void {
  const status = result.pass ? "PASS" : "FAIL";

  console.log(`\n[${status}] ${result.id}`);
  console.log(`  expectedTypes: ${result.expectedTypes.join(", ")}`);
  if (result.forbiddenTypes.length > 0) {
    console.log(`  forbiddenTypes: ${result.forbiddenTypes.join(", ")}`);
  }
  console.log(
    `  actualTypes: ${result.actualTypes.map((t) => t ?? "unknown").join(", ")}`,
  );

  if (result.missingTypes.length > 0) {
    console.log(`  missingTypes: ${result.missingTypes.join(", ")}`);
  }

  if (result.forbiddenPresentTypes.length > 0) {
    console.log(
      `  forbiddenPresentTypes: ${result.forbiddenPresentTypes.join(", ")}`,
    );
  }

  if (result.topExpectationFailed) {
    console.log(`  topMemory: ${result.topMemory ?? "none"}`);
  }
}

export async function runAllCases(options?: {
  cases?: EvalCase[];
  printEach?: boolean;
}): Promise<EvalSummary> {
  const cases = options?.cases ?? loadCases();
  const results: EvalResult[] = [];

  for (const testCase of cases) {
    const result = await runCase(testCase);
    results.push(result);
    if (options?.printEach !== false) {
      printResult(result);
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const score = total === 0 ? 0 : (passed / total) * 100;

  return {
    results,
    passed,
    total,
    score,
  };
}

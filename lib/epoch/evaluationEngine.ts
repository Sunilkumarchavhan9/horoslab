export type EpochQualityCase = {
  id: string;
  input: string;
  expectedContains?: string;
  expectedRegex?: string;
  expectedJson?: Record<string, unknown>;
  weight?: number;
};

export type EpochQualityOutput = { caseId: string; output: string; error?: string };

export type EpochQualityEvaluation = {
  version: "epoch_quality_evaluation.v1";
  status: "PASS" | "FAIL" | "UNKNOWN";
  scorePct: number | null;
  passedCases: number;
  totalCases: number;
  weightedScorePct: number | null;
  failures: Array<{ caseId: string; reason: string }>;
  evidenceStatus: "OBSERVED" | "UNKNOWN";
};

function jsonMatches(actual: unknown, expected: Record<string, unknown>): boolean {
  if (!actual || typeof actual !== "object" || Array.isArray(actual)) return false;
  return Object.entries(expected).every(([key, value]) => JSON.stringify((actual as Record<string, unknown>)[key]) === JSON.stringify(value));
}

export function evaluateEpochQuality(input: { cases: EpochQualityCase[]; outputs: EpochQualityOutput[]; minimumScorePct?: number }): EpochQualityEvaluation {
  if (!input.cases.length) return { version: "epoch_quality_evaluation.v1", status: "UNKNOWN", scorePct: null, passedCases: 0, totalCases: 0, weightedScorePct: null, failures: [], evidenceStatus: "UNKNOWN" };
  const outputs = new Map(input.outputs.map((output) => [output.caseId, output]));
  let passedCases = 0;
  let totalWeight = 0;
  let passedWeight = 0;
  const failures: EpochQualityEvaluation["failures"] = [];
  for (const testCase of input.cases) {
    const weight = Number.isFinite(testCase.weight) && (testCase.weight ?? 0) > 0 ? testCase.weight as number : 1;
    totalWeight += weight;
    const result = outputs.get(testCase.id);
    let passed = Boolean(result && !result.error);
    let reason = result?.error ?? "missing output";
    if (passed && testCase.expectedContains !== undefined) { passed = result!.output.includes(testCase.expectedContains); reason = passed ? "" : "expected text was not found"; }
    if (passed && testCase.expectedRegex !== undefined) { try { passed = new RegExp(testCase.expectedRegex, "s").test(result!.output); reason = passed ? "" : "expected pattern did not match"; } catch { passed = false; reason = "invalid evaluator pattern"; } }
    if (passed && testCase.expectedJson !== undefined) { try { passed = jsonMatches(JSON.parse(result!.output), testCase.expectedJson); reason = passed ? "" : "expected JSON fields did not match"; } catch { passed = false; reason = "output was not valid JSON"; } }
    if (passed) { passedCases += 1; passedWeight += weight; } else failures.push({ caseId: testCase.id, reason });
  }
  const scorePct = Number((passedCases / input.cases.length * 100).toFixed(2));
  const weightedScorePct = Number((passedWeight / totalWeight * 100).toFixed(2));
  return { version: "epoch_quality_evaluation.v1", status: weightedScorePct >= (input.minimumScorePct ?? 0) ? "PASS" : "FAIL", scorePct, passedCases, totalCases: input.cases.length, weightedScorePct, failures, evidenceStatus: "OBSERVED" };
}

export type EpochEconomicEvaluation = {
  version: "epoch_economic_evaluation.v1";
  status: "PASS" | "FAIL" | "UNKNOWN";
  costPerHour: number | null;
  requestsPerHour: number | null;
  costPerRequest: number | null;
  costPer1kTokens: number | null;
  monthlyProjection: number | null;
  monthlyRequests: number | null;
  evidenceStatus: "OBSERVED" | "INFERRED" | "UNKNOWN";
  assumptions: string[];
};

export function evaluateEpochEconomics(input: { costPerHour?: number; requestsPerHour?: number; tokensPerHour?: number; monthlyRequests?: number; monthlyHours?: number; budgetPerMonth?: number }): EpochEconomicEvaluation {
  const costPerHour = Number.isFinite(input.costPerHour) && (input.costPerHour as number) >= 0 ? input.costPerHour as number : null;
  const requestsPerHour = Number.isFinite(input.requestsPerHour) && (input.requestsPerHour as number) > 0 ? input.requestsPerHour as number : null;
  const tokensPerHour = Number.isFinite(input.tokensPerHour) && (input.tokensPerHour as number) > 0 ? input.tokensPerHour as number : null;
  const monthlyRequests = Number.isFinite(input.monthlyRequests) && (input.monthlyRequests as number) >= 0 ? input.monthlyRequests as number : null;
  const costPerRequest = costPerHour !== null && requestsPerHour !== null ? Number((costPerHour / requestsPerHour).toFixed(8)) : null;
  const costPer1kTokens = costPerHour !== null && tokensPerHour !== null ? Number((costPerHour / tokensPerHour * 1000).toFixed(8)) : null;
  const monthlyProjection = costPerHour !== null && monthlyRequests !== null && requestsPerHour !== null ? Number((costPerRequest! * monthlyRequests).toFixed(2)) : costPerHour !== null && input.monthlyHours !== undefined ? Number((costPerHour * input.monthlyHours).toFixed(2)) : null;
  const complete = costPerHour !== null && (requestsPerHour !== null || tokensPerHour !== null);
  const status = !complete ? "UNKNOWN" : input.budgetPerMonth !== undefined && monthlyProjection !== null ? monthlyProjection <= input.budgetPerMonth ? "PASS" : "FAIL" : "PASS";
  return { version: "epoch_economic_evaluation.v1", status, costPerHour, requestsPerHour, costPerRequest, costPer1kTokens, monthlyProjection, monthlyRequests, evidenceStatus: complete ? "OBSERVED" : "UNKNOWN", assumptions: [input.monthlyHours !== undefined ? "monthlyHours supplied by caller" : "monthly projection uses measured cost/request", tokensPerHour !== null ? "tokens/hour supplied by caller" : "token economics unavailable"] };
}

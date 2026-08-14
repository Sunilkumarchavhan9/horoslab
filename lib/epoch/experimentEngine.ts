import { evaluateEpochConstraints, type EpochMetricConstraint } from "./outcomeCompiler";
import type { EpochCandidate } from "./candidateEngine";

export type EpochSandboxPolicy = {
  version: "epoch_sandbox_policy.v1";
  network: "denied" | "allowlisted";
  credentials: "none" | "scoped";
  maxDurationSeconds: number;
  maxSpendCents: number;
  maxOutputBytes: number;
  cleanupRequired: true;
  artifactCaptureRequired: true;
};

export type EpochExperimentPlan = {
  version: "epoch_experiment_plan.v1";
  candidateId: string;
  phases: Array<"compatibility" | "smoke" | "benchmark" | "quality" | "economics" | "verification">;
  sandbox: EpochSandboxPolicy;
  reproducibility: {
    model: Record<string, unknown>;
    runtime: Record<string, unknown>;
    hardware: Record<string, unknown>;
    workload: Record<string, unknown>;
  };
};

export type EpochCandidateEvaluation = {
  candidateId: string;
  status: "PASS" | "FAIL" | "UNKNOWN";
  measurements: Record<string, number>;
  quality: { baseline: number | null; measured: number | null; retentionPct: number | null };
  economics: { costPerRequest: number | null; monthlyProjection: number | null };
  constraintResults: Array<Record<string, unknown>>;
  evidenceStatus: "OBSERVED" | "UNKNOWN";
};

function finite(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildEpochSandboxPolicy(input: Partial<EpochSandboxPolicy> = {}): EpochSandboxPolicy {
  return {
    version: "epoch_sandbox_policy.v1",
    network: input.network === "allowlisted" ? "allowlisted" : "denied",
    credentials: input.credentials === "scoped" ? "scoped" : "none",
    maxDurationSeconds: Math.max(1, Math.min(86_400, Math.floor(input.maxDurationSeconds ?? 900))),
    maxSpendCents: Math.max(0, Math.min(10_000_000, Math.floor(input.maxSpendCents ?? 1_000))),
    maxOutputBytes: Math.max(1_024, Math.min(1_000_000_000, Math.floor(input.maxOutputBytes ?? 50_000_000))),
    cleanupRequired: true,
    artifactCaptureRequired: true,
  };
}

export function buildEpochExperimentPlans(input: {
  candidates: EpochCandidate[];
  workload?: Record<string, unknown>;
  sandbox?: Partial<EpochSandboxPolicy>;
},): EpochExperimentPlan[] {
  return input.candidates
    .filter((candidate) => candidate.compatibility.status !== "INCOMPATIBLE")
    .map((candidate) => ({
      version: "epoch_experiment_plan.v1",
      candidateId: candidate.id,
      phases: candidate.compatibility.status === "UNKNOWN"
        ? ["compatibility", "smoke"]
        : ["compatibility", "smoke", "benchmark", "quality", "economics", "verification"],
      sandbox: buildEpochSandboxPolicy(input.sandbox),
      reproducibility: {
        model: { ...candidate.model },
        runtime: { ...candidate.runtime },
        hardware: { ...candidate.hardware },
        workload: { ...(input.workload ?? candidate.workload) },
      },
    }));
}

export function evaluateEpochCandidate(input: {
  candidateId: string;
  baseline?: Record<string, unknown>;
  measurements?: Record<string, unknown>;
  hardConstraints?: EpochMetricConstraint[];
  monthlyRequests?: number;
}): EpochCandidateEvaluation {
  const baseline = input.baseline ?? {};
  const measurements = Object.fromEntries(Object.entries(input.measurements ?? {}).flatMap(([key, value]) => {
    const parsed = finite(value);
    return parsed === null ? [] : [[key, parsed]];
  }));
  const baselineQuality = finite(baseline.quality);
  const measuredQuality = finite(measurements.quality);
  const retentionPct = baselineQuality !== null && baselineQuality !== 0 && measuredQuality !== null ? (measuredQuality / baselineQuality) * 100 : null;
  const costPerRequest = finite(measurements.costPerRequest);
  const monthlyProjection = costPerRequest !== null && Number.isFinite(input.monthlyRequests) ? costPerRequest * (input.monthlyRequests as number) : null;
  const constraintResults = evaluateEpochConstraints(input.hardConstraints ?? [], measurements).map((result) => ({ ...result }));
  const hasUnknown = Object.keys(measurements).length === 0 || constraintResults.some((result) => result.passed === false && result.actual === null);
  const passed = !hasUnknown && constraintResults.every((result) => result.passed === true);
  return {
    candidateId: input.candidateId,
    status: hasUnknown ? "UNKNOWN" : passed ? "PASS" : "FAIL",
    measurements,
    quality: { baseline: baselineQuality, measured: measuredQuality, retentionPct },
    economics: { costPerRequest, monthlyProjection },
    constraintResults,
    evidenceStatus: Object.keys(measurements).length > 0 ? "OBSERVED" : "UNKNOWN",
  };
}

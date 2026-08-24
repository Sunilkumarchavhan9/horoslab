import { createHash, randomUUID } from "node:crypto";
import {
  BenchmarkSchema,
  ExperimentSchema,
  type Benchmark,
  type Experiment,
} from "./contracts";
import { getCanonicalArtifact, persistCanonicalArtifact } from "./artifactStore";

type BaseInput = {
  workspaceId: string;
  missionId: string;
  correlationId: string;
  traceId: string;
  now?: Date;
};

function base(input: BaseInput, id: string) {
  const timestamp = (input.now ?? new Date()).toISOString();
  return {
    contractVersion: "epoch.canonical.v1" as const,
    id,
    workspaceId: input.workspaceId,
    createdAt: timestamp,
    updatedAt: timestamp,
    correlation: { correlationId: input.correlationId, traceId: input.traceId },
  };
}

export function buildCanonicalExperiment(input: BaseInput & {
  hypothesisId?: string;
  candidateId: string;
  type: Experiment["type"];
  baseline: Record<string, unknown>;
  intervention: Record<string, unknown>;
  controls?: Record<string, unknown>;
  metrics: string[];
  durationSeconds: number;
  sampleSize?: number;
  safetyConstraints?: Array<Record<string, unknown>>;
  rollback: Record<string, unknown>;
  evidenceRequirements?: string[];
  verdictRules?: Array<Record<string, unknown>>;
}): Experiment {
  return ExperimentSchema.parse({
    ...base(input, `experiment_${randomUUID()}`),
    missionId: input.missionId,
    ...(input.hypothesisId ? { hypothesisId: input.hypothesisId } : {}),
    candidateId: input.candidateId,
    type: input.type,
    baseline: input.baseline,
    intervention: input.intervention,
    controls: input.controls ?? {},
    metrics: input.metrics,
    durationSeconds: input.durationSeconds,
    ...(input.sampleSize ? { sampleSize: input.sampleSize } : {}),
    safetyConstraints: input.safetyConstraints ?? [],
    rollback: input.rollback,
    evidenceRequirements: input.evidenceRequirements ?? ["benchmark", "observation", "independent_verification"],
    verdictRules: input.verdictRules ?? [],
    status: "planned",
  });
}

export async function createCanonicalExperiment(input: Parameters<typeof buildCanonicalExperiment>[0]) {
  const candidate = await getCanonicalArtifact(input.workspaceId, "CandidateSystem", input.candidateId);
  if (!candidate || candidate.missionId !== input.missionId) throw new Error("CANDIDATE_NOT_FOUND_FOR_MISSION");
  const experiment = buildCanonicalExperiment(input);
  await persistCanonicalArtifact({
    workspaceId: input.workspaceId,
    objectType: "Experiment",
    objectId: experiment.id,
    missionId: input.missionId,
    parentId: input.candidateId,
    payload: experiment,
    provenance: { classification: "INFERRED", source: "canonical-experiment-runtime", candidateId: input.candidateId },
    correlationId: input.correlationId,
    traceId: input.traceId,
  });
  return experiment;
}

export function buildCanonicalBenchmark(input: BaseInput & {
  experimentId: string;
  modelRevision: string;
  artifactDigest?: string;
  runtimeVersion: string;
  servingVersion?: string;
  hardware: Record<string, unknown>;
  driver?: Record<string, unknown>;
  kernel?: string;
  container?: string;
  configuration: Record<string, unknown>;
  workload: Record<string, unknown>;
  dataset?: Record<string, unknown>;
  randomSeeds: number[];
  environment: Record<string, unknown>;
  measurementMethod: string;
  results: Record<string, unknown>;
  status?: Benchmark["status"];
}): Benchmark {
  const manifest = {
    modelRevision: input.modelRevision,
    artifactDigest: input.artifactDigest ?? null,
    runtimeVersion: input.runtimeVersion,
    servingVersion: input.servingVersion ?? null,
    hardware: input.hardware,
    driver: input.driver ?? null,
    kernel: input.kernel ?? null,
    container: input.container ?? null,
    configuration: input.configuration,
    workload: input.workload,
    dataset: input.dataset ?? null,
    randomSeeds: input.randomSeeds,
    environment: input.environment,
    measurementMethod: input.measurementMethod,
  };
  return BenchmarkSchema.parse({
    ...base(input, `benchmark_${randomUUID()}`),
    experimentId: input.experimentId,
    modelRevision: input.modelRevision,
    ...(input.artifactDigest ? { artifactDigest: input.artifactDigest } : {}),
    runtimeVersion: input.runtimeVersion,
    ...(input.servingVersion ? { servingVersion: input.servingVersion } : {}),
    hardware: input.hardware,
    ...(input.driver ? { driver: input.driver } : {}),
    ...(input.kernel ? { kernel: input.kernel } : {}),
    ...(input.container ? { container: input.container } : {}),
    configuration: input.configuration,
    workload: input.workload,
    ...(input.dataset ? { dataset: input.dataset } : {}),
    randomSeeds: input.randomSeeds,
    environment: input.environment,
    measurementMethod: input.measurementMethod,
    results: input.results,
    reproducibilityHash: createHash("sha256").update(JSON.stringify(manifest)).digest("hex"),
    status: input.status ?? "completed",
  });
}

export async function persistCanonicalBenchmark(input: Parameters<typeof buildCanonicalBenchmark>[0]) {
  const benchmark = buildCanonicalBenchmark(input);
  await persistCanonicalArtifact({
    workspaceId: input.workspaceId,
    objectType: "Benchmark",
    objectId: benchmark.id,
    missionId: input.missionId,
    parentId: input.experimentId,
    payload: benchmark,
    provenance: { classification: "MEASURED", source: "canonical-benchmark-runtime", experimentId: input.experimentId },
    correlationId: input.correlationId,
    traceId: input.traceId,
  });
  return benchmark;
}

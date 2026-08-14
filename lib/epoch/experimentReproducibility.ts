import { createHash } from "node:crypto";

export type EpochExperimentArtifact = { name: string; contentSha256: string; sizeBytes?: number; uri?: string };

export type EpochExperimentReproducibilityInput = {
  experimentId?: string;
  model: Record<string, unknown>;
  runtime: Record<string, unknown>;
  hardware: Record<string, unknown>;
  workload: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  dataset?: Record<string, unknown>;
  softwareEnvironment?: Record<string, unknown>;
  randomSeed?: number;
  metrics?: Record<string, unknown>;
  logs?: Array<{ timestamp?: string; level?: string; message: string }>;
  artifacts?: EpochExperimentArtifact[];
};

export type EpochExperimentReproducibilityManifest = {
  version: "epoch_experiment_reproducibility.v1";
  experimentId: string;
  capturedAt: string;
  identity: { model: Record<string, unknown>; runtime: Record<string, unknown>; hardware: Record<string, unknown> };
  workload: Record<string, unknown>;
  configuration: Record<string, unknown>;
  dataset: Record<string, unknown>;
  softwareEnvironment: Record<string, unknown>;
  randomSeed: number | null;
  metrics: Record<string, unknown>;
  logs: Array<{ timestamp?: string; level?: string; message: string }>;
  artifacts: EpochExperimentArtifact[];
  manifestSha256: string;
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export function sha256EpochExperimentArtifact(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export function buildEpochExperimentReproducibilityManifest(input: EpochExperimentReproducibilityInput, capturedAt = new Date()): EpochExperimentReproducibilityManifest {
  const unsigned = {
    version: "epoch_experiment_reproducibility.v1" as const,
    experimentId: input.experimentId ?? `experiment-${capturedAt.getTime()}`,
    capturedAt: capturedAt.toISOString(),
    identity: { model: input.model, runtime: input.runtime, hardware: input.hardware },
    workload: input.workload,
    configuration: input.configuration ?? {},
    dataset: input.dataset ?? {},
    softwareEnvironment: input.softwareEnvironment ?? {},
    randomSeed: input.randomSeed ?? null,
    metrics: input.metrics ?? {},
    logs: input.logs ?? [],
    artifacts: input.artifacts ?? [],
  };
  return { ...unsigned, manifestSha256: sha256EpochExperimentArtifact(canonical(unsigned)) };
}

export function verifyEpochExperimentReproducibilityManifest(manifest: EpochExperimentReproducibilityManifest): { valid: boolean; expectedSha256: string; actualSha256: string } {
  const { manifestSha256: actualSha256, ...unsigned } = manifest;
  const expectedSha256 = sha256EpochExperimentArtifact(canonical(unsigned));
  return { valid: actualSha256 === expectedSha256, expectedSha256, actualSha256 };
}

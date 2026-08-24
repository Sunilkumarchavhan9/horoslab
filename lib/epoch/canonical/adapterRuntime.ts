import { createHash, randomUUID } from "node:crypto";
import { inspectEpochHuggingFaceModel, type EpochHuggingFaceInspection } from "../huggingFace";
import { ingestEpochObservability, type EpochObservabilityIngestion } from "../observabilityIngestion";
import { ModelProfileSchema, ObservationSchema, CapabilitySchema, type ModelProfile, type Observation, type Capability } from "./contracts";

type Context = { workspaceId: string; correlationId: string; traceId: string; now?: Date };
function metadata(input: Context, id: string) {
  const timestamp = (input.now ?? new Date()).toISOString();
  return { contractVersion: "epoch.canonical.v1" as const, id, workspaceId: input.workspaceId, createdAt: timestamp, updatedAt: timestamp, correlation: { correlationId: input.correlationId, traceId: input.traceId } };
}
function digest(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

export const CANONICAL_ADAPTERS = [
  { id: "huggingface", kind: "model_registry", status: "implemented", source: "lib/epoch/huggingFace.ts" },
  { id: "vllm", kind: "runtime", status: "implemented", source: "lib/epoch/runtimeAdapters.ts" },
  { id: "sglang", kind: "runtime", status: "implemented", source: "lib/epoch/runtimeAdapters.ts" },
  { id: "kubernetes", kind: "execution", status: "implemented", source: "lib/epoch/kubernetesVllmAdapter.ts" },
  { id: "opentelemetry", kind: "observation", status: "implemented", source: "lib/epoch/observabilityIngestion.ts" },
  { id: "object-storage", kind: "artifact", status: "implemented", source: "lib/epoch/objectStorage.ts" },
  { id: "cloud", kind: "reality", status: "implemented", source: "lib/epoch/v13/cloudWorldStateService.ts" },
  { id: "gpu", kind: "reality", status: "implemented", source: "lib/epoch/gpuMemoryEstimator.ts" },
] as const;

export async function inspectCanonicalModel(input: Context & { repositoryId: string; revision?: string; token?: string; fetchImpl?: typeof fetch }): Promise<{ inspection: EpochHuggingFaceInspection; profile: ModelProfile }> {
  const inspection = await inspectEpochHuggingFaceModel(input);
  const profile = ModelProfileSchema.parse({
    ...metadata(input, `model_profile_${randomUUID()}`), repository: inspection.repositoryId, revision: inspection.revision,
    ...(inspection.commitSha ? { commitSha: inspection.commitSha } : {}), ...(inspection.artifactDigest ? { artifactDigest: inspection.artifactDigest } : {}),
    task: inspection.taskFamily ?? inspection.task ?? "unknown", modalities: inspection.modalities ?? ["text"], ...(inspection.architecture[0] ? { architecture: inspection.architecture[0] } : {}),
    ...(inspection.license ? { license: inspection.license } : {}), ...(inspection.gated !== null ? { gated: inspection.gated } : {}),
    claims: [{ source: "huggingface", task: inspection.task, files: inspection.files.length, providerMappings: inspection.providerMappings }],
    verifiedFacts: [{ fact: "repository inspection completed", source: "huggingface", retrievedAt: inspection.retrievedAt, governance: inspection.governance }],
    provenance: { sourceType: "huggingface", sourceUri: `https://huggingface.co/${inspection.repositoryId}`, capturedAt: inspection.retrievedAt, classification: "OBSERVED", confidence: inspection.governance.status === "ELIGIBLE" ? 1 : 0.7, integritySha256: inspection.artifactDigest?.replace(/^sha256:/, ""), derivation: [] },
    lifecycle: inspection.governance.eligible ? "profiled" : "rejected",
  });
  return { inspection, profile };
}

export function buildCanonicalTelemetryObservation(input: Context & { missionId: string; experimentId?: string; environmentId: string; source: string; content: unknown; contentType?: string; observedAt?: string }): { ingestion: EpochObservabilityIngestion; observation: Observation } {
  const ingestion = ingestEpochObservability(input);
  if (ingestion.status !== "OBSERVED") throw new Error(`CANONICAL_TELEMETRY_INVALID:${ingestion.reasons.join(",")}`);
  const observedAt = input.observedAt ?? new Date().toISOString();
  const observation = ObservationSchema.parse({
    ...metadata(input, `observation_${randomUUID()}`), missionId: input.missionId, ...(input.experimentId ? { experimentId: input.experimentId } : {}), environmentId: input.environmentId,
    kind: "opentelemetry.metrics", value: { source: input.source, samples: ingestion.samples, contentType: input.contentType ?? "", evidenceSha256: ingestion.evidenceSha256 }, observedAt,
    provenance: { sourceType: "opentelemetry", sourceId: input.source, capturedAt: observedAt, observedAt, classification: "MEASURED", confidence: 1, integritySha256: digest(ingestion), derivation: [] },
  });
  return { ingestion, observation };
}

export function buildRuntimeCapability(input: Context & { provider: string; version?: string; status: Capability["status"]; inputTypes: string[]; outputTypes: string[]; probe: Record<string, unknown> }): Capability {
  return CapabilitySchema.parse({ ...metadata(input, `capability_${randomUUID()}`), name: `${input.provider}.runtime`, category: "model-serving", inputTypes: input.inputTypes, outputTypes: input.outputTypes, provider: input.provider, ...(input.version ? { version: input.version } : {}), status: input.status, provenance: { sourceType: "runtime-probe", sourceId: input.provider, capturedAt: (input.now ?? new Date()).toISOString(), classification: "OBSERVED", confidence: 1, derivation: [digest(input.probe)] } });
}

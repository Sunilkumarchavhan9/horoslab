import { generateEpochCandidates, type EpochCandidate } from "./candidateEngine";
import type { EpochHuggingFaceInspection } from "./huggingFace";
import type { EpochLocalCapabilities } from "./localCapabilities";

function totalArtifactGb(inspection: EpochHuggingFaceInspection) {
  const bytes = inspection.files.reduce((sum, file) => sum + (file.size ?? 0), 0);
  return bytes > 0 ? bytes / 1024 / 1024 / 1024 : null;
}

export function generateEpochLocalCandidates(input: { inspection: EpochHuggingFaceInspection; capabilities: EpochLocalCapabilities; workload?: Record<string, unknown> }): { candidates: EpochCandidate[]; modelProfile: Record<string, unknown>; missingCapabilities: string[] } {
  const artifactGb = totalArtifactGb(input.inspection);
  const estimatedVramGb = artifactGb === null ? null : Math.round(artifactGb * 1.2 * 100) / 100;
  const modelProfile = { source: "huggingface", repositoryId: input.inspection.repositoryId, revision: input.inspection.revision, commitSha: input.inspection.commitSha, artifactDigest: input.inspection.artifactDigest, task: input.inspection.task, architecture: input.inspection.architecture, license: input.inspection.license, tags: input.inspection.tags, estimatedArtifactGb: artifactGb, estimatedVramGb, governance: input.inspection.governance };
  const runtimes = input.capabilities.runtimes.filter((runtime) => runtime.available && runtime.name !== "docker").map((runtime) => ({ name: runtime.name, version: runtime.version, supportedPrecisions: ["fp16", "bf16", "int8", "int4"], available: true }));
  const hardware = input.capabilities.gpus.length > 0 ? input.capabilities.gpus.map((gpu) => ({ name: gpu.name, vramGb: gpu.vramGb, available: true, driverVersion: gpu.driverVersion, computeCapability: gpu.computeCapability })) : [{ name: "cpu-only", vramGb: null, available: true, cpuCores: input.capabilities.host.cpuCores, memoryGb: input.capabilities.host.memoryGb }];
  const candidates = generateEpochCandidates({ model: { ...modelProfile, requiredVramGb: estimatedVramGb }, runtimeOptions: runtimes, hardwareOptions: hardware, workload: input.workload });
  const missingCapabilities = input.capabilities.runtimes.filter((runtime) => !runtime.available).map((runtime) => `${runtime.name}_runtime`).concat(estimatedVramGb === null ? ["model_artifact_size"] : []);
  return { candidates, modelProfile, missingCapabilities };
}

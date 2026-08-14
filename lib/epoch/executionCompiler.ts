import { createHash } from "node:crypto";
import { buildEvidenceIntegrityProof } from "./evidenceIntegrity";
import type { EpochModelIntelligenceProfile } from "./modelIntelligence";
import type { EpochRuntimeCompatibility, EpochRuntimeProfile, EpochHardwareProfile } from "./runtimeIntelligence";

export type EpochCompiledExecutionPlan = {
  version: "epoch_execution_plan.v2";
  identity: string;
  status: "READY" | "NEEDS_EXPERIMENT" | "BLOCKED";
  model: { repositoryId: string; revision: string; commitSha: string | null; artifactDigest: string | null };
  artifact: { paths: string[]; digest: string | null };
  runtime: { name: string; version: string; executionProvider: string | null };
  hardware: { id: string; name: string; gpuName: string | null; gpuCount: number | null; vramGb: number | null };
  configuration: { precision: string | null; quantization: string | null; batching: number; concurrency: number; resourceLimits: Record<string, number>; timeoutMs: number };
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  sandbox: { network: "none" | "restricted" | "full"; readOnlyRoot: boolean; dropCapabilities: boolean; timeoutMs: number };
  verification: { strategy: "smoke" | "benchmark" | "quality" | "full"; requiredEvidence: string[] };
  compatibility: EpochRuntimeCompatibility;
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export function hashEpochExecutionPlan(value: Omit<EpochCompiledExecutionPlan, "identity">): string {
  return createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

export function compileEpochExecutionPlan(input: {
  profile: EpochModelIntelligenceProfile;
  runtime: EpochRuntimeProfile;
  hardware: EpochHardwareProfile;
  compatibility: EpochRuntimeCompatibility;
  executionProvider?: string;
  precision?: string;
  quantization?: string;
  batching?: number;
  concurrency?: number;
  timeoutMs?: number;
  network?: "none" | "restricted" | "full";
  verificationStrategy?: "smoke" | "benchmark" | "quality" | "full";
}): EpochCompiledExecutionPlan {
  const timeoutMs = Math.max(1000, Math.min(3_600_000, Math.floor(input.timeoutMs ?? 120_000)));
  const status: EpochCompiledExecutionPlan["status"] = input.compatibility.status === "BLOCKED" || input.compatibility.status === "PREDICTED_INCOMPATIBLE" || input.compatibility.status === "UNSUPPORTED" || input.compatibility.status === "FAILED"
    ? "BLOCKED" : input.compatibility.status === "UNKNOWN" ? "NEEDS_EXPERIMENT" : "READY";
  const unsigned = {
    version: "epoch_execution_plan.v2" as const,
    status,
    model: { repositoryId: input.profile.identity.repositoryId.value, revision: input.profile.identity.revision.value, commitSha: input.profile.identity.commitSha.value, artifactDigest: input.profile.identity.manifestDigest.value },
    artifact: { paths: input.profile.artifacts.map((artifact) => artifact.path.value).sort(), digest: input.profile.identity.manifestDigest.value },
    runtime: { name: input.runtime.name, version: input.runtime.version, executionProvider: input.executionProvider?.trim() || null },
    hardware: { id: input.hardware.id, name: input.hardware.name, gpuName: input.hardware.gpuName ?? null, gpuCount: input.hardware.gpuCount ?? null, vramGb: input.hardware.vramGb ?? null },
    configuration: { precision: input.precision?.trim() || null, quantization: input.quantization?.trim() || null, batching: Math.max(1, Math.min(1024, Math.floor(input.batching ?? 1))), concurrency: Math.max(1, Math.min(1024, Math.floor(input.concurrency ?? 1))), resourceLimits: { memoryMb: input.hardware.vramGb ? Math.floor(input.hardware.vramGb * 1024 * 0.9) : 0 }, timeoutMs },
    inputSchema: input.profile.inputSchema.value, outputSchema: input.profile.outputSchema.value,
    sandbox: { network: input.network ?? "none", readOnlyRoot: true, dropCapabilities: true, timeoutMs },
    verification: { strategy: input.verificationStrategy ?? "full", requiredEvidence: ["runtime_probe", "execution_output", "latency_metrics", "quality_evaluation", "reproducibility_manifest"] },
    compatibility: input.compatibility,
  };
  return { ...unsigned, identity: hashEpochExecutionPlan(unsigned) };
}

export type EpochSystemEvidenceRecord = {
  version: "epoch_system_evidence.v1";
  kind: "system_compatibility" | "system_execution" | "system_verification";
  summary: string;
  payload: Record<string, unknown>;
  proof: Record<string, unknown>;
};

export function buildEpochSystemEvidence(input: { plan: EpochCompiledExecutionPlan; kind: EpochSystemEvidenceRecord["kind"]; observed?: Record<string, unknown>; capturedAt?: Date }): EpochSystemEvidenceRecord {
  const capturedAt = (input.capturedAt ?? new Date()).toISOString();
  const payload = { version: "epoch_system_evidence.v1", planIdentity: input.plan.identity, plan: input.plan, observed: input.observed ?? {}, capturedAt };
  const summary = `${input.kind} for ${input.plan.model.repositoryId} on ${input.plan.runtime.name}/${input.plan.hardware.name}`;
  return { version: "epoch_system_evidence.v1", kind: input.kind, summary, payload, proof: buildEvidenceIntegrityProof({ kind: input.kind, summary, payload }, { planIdentity: input.plan.identity, state: input.kind === "system_verification" ? "VERIFIED" : "OBSERVED" }) };
}

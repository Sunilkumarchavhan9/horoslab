import { randomUUID } from "node:crypto";
import { CandidateSystemSchema, SystemSchema, type CandidateSystem, type ModelProfile, type WorkloadProfile } from "./contracts";

export type CompatibilityInput = {
  model: ModelProfile;
  workload: WorkloadProfile;
  runtime: Record<string, unknown>;
  hardware: Record<string, unknown>;
  environmentId: string;
  policyAllowed?: boolean;
  now?: Date;
};

export type CompatibilityReport = {
  status: CandidateSystem["compatibility"];
  reasons: string[];
  hardConstraintResult: CandidateSystem["hardConstraintResult"];
  evidence: string[];
};

function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function number(value: unknown): number | null {
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : null;
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase()) : [];
}

export function evaluateCanonicalCompatibility(input: CompatibilityInput): CompatibilityReport {
  const reasons: string[] = [];
  const evidence: string[] = [];
  const modelMemory = number(input.model.verifiedFacts.find((fact) => typeof fact.requiredVramGb === "number")?.requiredVramGb);
  const hardwareMemory = number(input.hardware.availableVramGb ?? input.hardware.vramGb);
  if (modelMemory !== null && hardwareMemory !== null && hardwareMemory < modelMemory) reasons.push("hardware VRAM is below the verified model requirement");
  if (modelMemory !== null && hardwareMemory === null) reasons.push("available hardware VRAM is unknown");
  if (hardwareMemory !== null) evidence.push(`hardware_vram_gb:${hardwareMemory}`);

  const runtimeName = text(input.runtime.name);
  if (!runtimeName) reasons.push("runtime identity is unknown");
  const supportedRuntimes = list(input.model.verifiedFacts.find((fact) => Array.isArray(fact.supportedRuntimes))?.supportedRuntimes);
  if (runtimeName && supportedRuntimes.length && !supportedRuntimes.includes(runtimeName)) reasons.push("runtime is not verified for this model");

  const requestRate = input.workload.requestRate;
  if (requestRate === undefined) reasons.push("workload request rate is unknown");
  if (!input.workload.slo || Object.keys(input.workload.slo).length === 0) reasons.push("workload SLO is unknown");
  if (input.policyAllowed === false) reasons.push("candidate is blocked by policy");

  const blocked = input.policyAllowed === false;
  const incompatible = reasons.some((reason) => reason.includes("below") || reason.includes("not verified"));
  const unknown = reasons.some((reason) => reason.includes("unknown"));
  return {
    status: blocked ? "blocked" : incompatible ? "incompatible" : unknown ? "unknown" : "compatible",
    reasons,
    hardConstraintResult: blocked || incompatible ? "fail" : unknown ? "unknown" : "pass",
    evidence,
  };
}

export function composeCanonicalCandidates(input: {
  missionId: string;
  model: ModelProfile;
  workload: WorkloadProfile;
  runtimes: Array<Record<string, unknown>>;
  hardware: Array<Record<string, unknown>>;
  environmentId: string;
  policyAllowed?: boolean;
  maxCandidates?: number;
  now?: Date;
}): CandidateSystem[] {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const limit = Math.max(1, Math.min(500, Math.floor(input.maxCandidates ?? 100)));
  const candidates: CandidateSystem[] = [];
  for (const runtime of input.runtimes) {
    for (const hardware of input.hardware) {
      if (candidates.length >= limit) return candidates;
      const report = evaluateCanonicalCompatibility({ ...input, runtime, hardware, now });
      const base = {
        contractVersion: "epoch.canonical.v1" as const,
        id: id("candidate"),
        workspaceId: input.model.workspaceId,
        createdAt: timestamp,
        updatedAt: timestamp,
        correlation: input.model.correlation,
      };
      const system = SystemSchema.parse({
        ...base,
        id: id("system"),
        name: `${input.model.repository} on ${String(runtime.name ?? "unknown-runtime")} / ${String(hardware.name ?? "unknown-hardware")}`,
        modelProfileId: input.model.id,
        workloadProfileId: input.workload.id,
        runtime,
        serving: runtime.serving ?? {},
        hardware,
        network: runtime.network ?? {},
        configuration: runtime.configuration ?? {},
        environmentId: input.environmentId,
      });
      candidates.push(CandidateSystemSchema.parse({
        ...base,
        missionId: input.missionId,
        system,
        compatibility: report.status,
        compatibilityReasons: report.reasons,
        hardConstraintResult: report.hardConstraintResult,
        predictedMetrics: {},
        measuredMetrics: {},
        risk: report.status === "compatible" ? "low" : report.status === "unknown" ? "medium" : "high",
        status: report.status === "compatible" ? "eligible" : "rejected",
      }));
    }
  }
  return candidates;
}

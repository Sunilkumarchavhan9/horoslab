import { describe, expect, it } from "vitest";
import { composeCanonicalCandidates, evaluateCanonicalCompatibility } from "../lib/epoch/canonical";
import type { ModelProfile, WorkloadProfile } from "../lib/epoch/canonical";

const now = "2026-08-17T00:00:00.000Z";
const model: ModelProfile = {
  contractVersion: "epoch.canonical.v1",
  id: "model-1",
  workspaceId: "workspace-1",
  createdAt: now,
  updatedAt: now,
  correlation: { correlationId: "c-1", traceId: "t-1" },
  repository: "Qwen/Qwen3-32B",
  revision: "main",
  task: "text-generation",
  modalities: ["text"],
  verifiedFacts: [{ requiredVramGb: 60, supportedRuntimes: ["vllm"] }],
  claims: [],
  provenance: { classification: "VERIFIED", confidence: 1, derivation: [] },
  lifecycle: "verified",
};
const workload: WorkloadProfile = {
  contractVersion: "epoch.canonical.v1",
  id: "workload-1",
  workspaceId: "workspace-1",
  createdAt: now,
  updatedAt: now,
  correlation: { correlationId: "c-1", traceId: "t-1" },
  name: "production",
  modality: "text",
  requestShape: { input: "text", output: "text" },
  requestRate: 100,
  slo: { p99Ms: 200 },
  baseline: { p99Ms: 230 },
  provenance: { classification: "MEASURED", confidence: 1, derivation: [] },
};

describe("Epoch canonical compatibility and candidate composition", () => {
  it("returns explicit compatibility states and reasons", () => {
    expect(evaluateCanonicalCompatibility({ model, workload, runtime: { name: "vLLM" }, hardware: { name: "H100", availableVramGb: 80 }, environmentId: "env-1" })).toMatchObject({ status: "compatible", hardConstraintResult: "pass" });
    expect(evaluateCanonicalCompatibility({ model, workload, runtime: { name: "SGLang" }, hardware: { name: "H100", availableVramGb: 80 }, environmentId: "env-1" })).toMatchObject({ status: "incompatible" });
    expect(evaluateCanonicalCompatibility({ model, workload, runtime: { name: "vLLM" }, hardware: { name: "GPU" }, environmentId: "env-1" })).toMatchObject({ status: "unknown", hardConstraintResult: "unknown" });
    expect(evaluateCanonicalCompatibility({ model, workload, runtime: { name: "vLLM" }, hardware: { name: "H100", availableVramGb: 80 }, environmentId: "env-1", policyAllowed: false })).toMatchObject({ status: "blocked", hardConstraintResult: "fail" });
  });

  it("composes candidate systems without collapsing unknown into compatible", () => {
    const candidates = composeCanonicalCandidates({ missionId: "mission-1", model, workload, runtimes: [{ name: "vLLM" }, { name: "SGLang" }], hardware: [{ name: "H100", availableVramGb: 80 }, { name: "GPU" }], environmentId: "env-1" });
    expect(candidates).toHaveLength(4);
    expect(candidates.map((candidate) => candidate.compatibility)).toEqual(["compatible", "unknown", "incompatible", "incompatible"]);
    expect(candidates.every((candidate) => candidate.system.modelProfileId === "model-1")).toBe(true);
  });
});

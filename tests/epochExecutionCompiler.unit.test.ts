import { describe, expect, it } from "vitest";
import { normalizeEpochHuggingFaceInspection } from "../lib/epoch/huggingFace";
import { buildEpochModelIntelligenceProfile } from "../lib/epoch/modelIntelligence";
import { compileEpochExecutionPlan, buildEpochSystemEvidence } from "../lib/epoch/executionCompiler";
import { resolveEpochRuntime, evaluateEpochRuntimeCompatibility } from "../lib/epoch/runtimeIntelligence";
import { verifyEvidenceIntegrity } from "../lib/epoch/evidenceIntegrity";

function inputs() {
  const profile = buildEpochModelIntelligenceProfile(normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abc123", pipeline_tag: "text-generation", library_name: "transformers", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "model.safetensors", size: 10 }] }));
  const runtime = { ...resolveEpochRuntime({ name: "vLLM", version: "0.8.5", installed: true })!, installationState: "available" as const };
  const hardware = { id: "gpu-1", name: "RTX 4050", gpuName: "NVIDIA", gpuCount: 1, vramGb: 6, available: true };
  const compatibility = evaluateEpochRuntimeCompatibility({ profile, runtime, hardware, executionProvider: "CUDA", precision: "fp16" });
  return { profile, runtime, hardware, compatibility };
}

describe("Epoch execution compiler", () => {
  it("creates a deterministic plan identity from the complete execution system", () => {
    const input = inputs();
    const first = compileEpochExecutionPlan(input);
    const second = compileEpochExecutionPlan(input);
    expect(first).toEqual(second);
    expect(first.status).toBe("READY");
    expect(first.model.commitSha).toBe("abc123");
    expect(first.sandbox).toMatchObject({ network: "none", readOnlyRoot: true, dropCapabilities: true });
    expect(first.identity).toHaveLength(64);
  });

  it("does not compile unknown compatibility as ready", () => {
    const input = inputs();
    const plan = compileEpochExecutionPlan({ ...input, compatibility: { ...input.compatibility, status: "UNKNOWN", score: null } });
    expect(plan.status).toBe("NEEDS_EXPERIMENT");
  });

  it("creates hash-integrity evidence for the compiled system", () => {
    const plan = compileEpochExecutionPlan(inputs());
    const evidence = buildEpochSystemEvidence({ plan, kind: "system_verification", observed: { p99Ms: 250 }, capturedAt: new Date("2026-01-01T00:00:00.000Z") });
    expect(evidence.payload.planIdentity).toBe(plan.identity);
    expect(evidence.proof).toMatchObject({ contentHash: expect.any(String), canonicalVersion: "epoch.evidence.canonical.v1", state: "VERIFIED" });
    expect(verifyEvidenceIntegrity({ kind: evidence.kind, summary: evidence.summary, payload: evidence.payload, proof: evidence.proof }).valid).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { normalizeEpochHuggingFaceInspection } from "../lib/epoch/huggingFace";
import { buildEpochModelIntelligenceProfile } from "../lib/epoch/modelIntelligence";
import { evaluateEpochRuntimeCompatibility, resolveEpochRuntime } from "../lib/epoch/runtimeIntelligence";
import { buildEpochMissionSystemEvidence, compileEpochMissionSystem } from "../lib/epoch/missionSystemProof";
import { runEpochMissionOrchestrator } from "../lib/epoch/missionOrchestrator";

function system() {
  const profile = buildEpochModelIntelligenceProfile(normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abc123", pipeline_tag: "text-generation", library_name: "transformers", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "model.safetensors", size: 10 }] }));
  const runtime = { ...resolveEpochRuntime({ name: "vLLM", version: "0.8.5", installed: true })!, installationState: "available" as const };
  const hardware = { id: "gpu-1", name: "RTX 4050", gpuName: "NVIDIA", gpuCount: 1, vramGb: 6, available: true };
  const compatibility = evaluateEpochRuntimeCompatibility({ profile, runtime, hardware, executionProvider: "CUDA", precision: "fp16" });
  return { profile, runtime, hardware, compatibility, executionProvider: "CUDA", precision: "fp16" };
}

describe("Epoch mission system proof integration", () => {
  it("adds the compiled system plan to mission orchestration", () => {
    const result = runEpochMissionOrchestrator({ baseline: { quality: 100 }, workload: { monthlyRequests: 1000 }, acceptanceCriteria: ["quality >= 97"], model: { name: "qwen2.5:3b", requiredVramGb: 4, supportedRuntimes: ["vLLM"], supportedPrecisions: ["fp16"] }, runtimeOptions: [{ name: "vLLM", supportedPrecisions: ["fp16"] }], hardwareOptions: [{ name: "RTX 4050", vramGb: 6, available: true }], candidateMeasurements: { candidate_1: { quality: 98, p99: 250, costPerRequest: 0.001 } }, authorization: { allowed: true, reason: "approved" }, verification: { passed: true }, executionSystem: system() });
    expect(result.compiledExecutionPlan).toMatchObject({ version: "epoch_execution_plan.v2", status: "READY" });
    expect(result.stages.some((stage) => stage.provenance.includes(result.compiledExecutionPlan!.identity))).toBe(true);
  });

  it("creates three persistable integrity-protected evidence records", () => {
    const plan = compileEpochMissionSystem(system());
    const evidence = buildEpochMissionSystemEvidence(plan, { p99Ms: 250, qualityPct: 98 });
    expect(evidence).toHaveLength(3);
    expect(evidence.map((item) => item.kind)).toEqual(["system_compatibility", "system_execution", "system_verification"]);
    expect(evidence.every((item) => item.proof?.contentHash && item.payload?.planIdentity === plan.identity)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { runEpochMissionOrchestrator } from "../lib/epoch/missionOrchestrator";

describe("Epoch mission orchestrator", () => {
  it("covers the full planning loop and routes missing evidence to rediscovery", () => {
    const result = runEpochMissionOrchestrator({ outcome: { objective: "reduce cost" }, baseline: { quality: 100 }, workload: { monthlyRequests: 1000 }, acceptanceCriteria: ["quality >= 97"], runtimeOptions: [{ name: "ollama", supportedPrecisions: ["fp16"] }], hardwareOptions: [{ name: "RTX 4050", vramGb: 6, available: true }], model: { name: "qwen2.5:3b", requiredVramGb: 4, supportedRuntimes: ["ollama"], supportedPrecisions: ["fp16"] }, authorization: { allowed: false, reason: "awaiting approval" } });
    expect(result.version).toBe("epoch_mission_orchestrator.v1");
    expect(result.stages.map((stage) => stage.name)).toEqual(expect.arrayContaining(["customer_outcome", "current_reality", "unknown_uncertainty", "hypotheses", "capability_gap", "capability_discovery", "system_generation", "simulation", "sandbox", "benchmark", "quality_evaluation", "economic_evaluation", "constraint_filter", "system_selection", "authorization", "execution", "observation", "evidence", "verification", "rediscovery"]));
    expect(result.rediscoveryRequested).toBe(true);
  });

  it("selects a measured authorized candidate", () => {
    const result = runEpochMissionOrchestrator({ baseline: { quality: 100 }, workload: { monthlyRequests: 1000 }, acceptanceCriteria: ["quality >= 97", "p99 <= 300"], model: { name: "qwen2.5:3b", requiredVramGb: 4, supportedRuntimes: ["ollama"], supportedPrecisions: ["fp16"] }, runtimeOptions: [{ name: "ollama", supportedPrecisions: ["fp16"] }], hardwareOptions: [{ name: "RTX 4050", vramGb: 6, available: true }], candidateMeasurements: { candidate_1: { quality: 98, p99: 250, costPerRequest: 0.001 } }, authorization: { allowed: true, reason: "approved for local bounded execution" }, verification: { passed: true, evidenceIds: ["evidence-1"] } });
    expect(result.status).toBe("SUCCESS");
    expect(result.decision.winner?.candidateId).toBe("candidate_1");
    expect(result.executionPlan).not.toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { EpochArchitectureRuntime } from "../lib/epoch/architectureRuntime";

describe("Epoch architecture runtime", () => {
  it("replays stage state, versions world facts, and resolves conflicts", () => {
    const runtime = new EpochArchitectureRuntime(); const created = runtime.createMission({ missionId: "m1", outcome: { target: "latency" }, facts: { gpu: { value: "RTX", source: "probe", confidence: 0.8 } } });
    runtime.transition("m1", "customer_outcome", { status: "completed", detail: "accepted" }); runtime.updateWorldModel("m1", { gpu: { value: "RTX 4050", source: "nvidia-smi", confidence: 0.99, classification: "OBSERVED" } });
    runtime.resolveFactConflict("m1", "region", [{ value: "us", source: "old", confidence: 0.4, observedAt: "2026-01-01", classification: "EXTERNAL" }, { value: "in", source: "probe", confidence: 0.9, observedAt: "2026-02-01", classification: "OBSERVED" }]);
    const replay = runtime.replay("m1")!; expect(created.worldModel.version).toBe("world-v1"); expect(replay.worldModel.version).toBe("world-v3"); expect(replay.worldModel.facts.region.value).toBe("in"); expect(replay.stages.find((stage) => stage.stage === "customer_outcome")?.status).toBe("completed");
  });

  it("chains evidence and requests rediscovery after a failure", () => {
    const runtime = new EpochArchitectureRuntime(); runtime.createMission({ missionId: "m2", outcome: { target: "quality" } }); const evidence = runtime.appendEvidence("m2", { stage: "benchmark", kind: "benchmark_result", payload: { score: 0.9 } }); runtime.transition("m2", "execution", { status: "failed", detail: "runtime timeout" }); const state = runtime.get("m2")!;
    expect(evidence.proof.contentHash).toHaveLength(64); expect(runtime.verifyEvidence("m2")[0].valid).toBe(true); expect(state.rediscovery?.rediscoveryRequired).toBe(true); expect(state.stages.at(-1)?.stage).toBe("rediscovery");
  });

  it("tracks stale facts and capability probes", () => {
    const runtime = new EpochArchitectureRuntime(); runtime.createMission({ missionId: "m3", outcome: {}, facts: { old: { value: 1, source: "probe", observedAt: "2020-01-01", confidence: 1 } } }); runtime.recordCapability("m3", { name: "vllm", version: "0.8", compatible: null, source: "endpoint-probe", checkedAt: new Date().toISOString(), evidenceSha256: "a" }); const state = runtime.get("m3")!;
    expect(runtime.staleFacts("m3", 1000)).toEqual(["old"]); expect(state.capabilities[0].name).toBe("vllm");
  });
});

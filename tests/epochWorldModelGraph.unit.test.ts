import { describe, expect, it } from "vitest";
import { buildEpochWorldGraph, buildEpochWorldModelSnapshot, buildEpochWorldRefreshPlan, mergeEpochWorldFacts } from "../lib/epoch/worldModel";

describe("Epoch world model graph and freshness", () => {
  it("builds namespace and dependency edges", () => {
    const graph = buildEpochWorldGraph({
      runtime: { value: "ollama", source: "probe", confidence: 1, classification: "OBSERVED", observedAt: new Date().toISOString() },
      "runtime.version": { value: { dependsOn: ["runtime"] }, source: "probe", confidence: 1, classification: "OBSERVED", observedAt: new Date().toISOString() },
    });
    expect(graph.edges).toEqual(expect.arrayContaining([
      { from: "fact:runtime", to: "fact:runtime.version", relation: "namespace" },
      { from: "fact:runtime.version", to: "fact:runtime", relation: "depends_on" },
    ]));
  });

  it("resolves conflicts and schedules stale facts for refresh", () => {
    const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const merged = mergeEpochWorldFacts({
      candidates: [
        { key: "gpu.vram", value: 6, source: "telemetry", observedAt: old, confidence: 1, classification: "OBSERVED" },
        { key: "gpu.vram", value: 8, source: "user", observedAt: new Date().toISOString(), confidence: 0.8, classification: "USER_ASSERTED" },
      ],
      staleAfterMs: 15 * 60 * 1000,
    });
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.facts["gpu.vram"].value).toBe(8);
    expect(merged.refreshKeys).toEqual([]);
  });

  it("includes the graph in tamper-evident snapshots and emits refresh plans", () => {
    const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const snapshot = buildEpochWorldModelSnapshot({ facts: { gpu: { value: 6, source: "telemetry", observedAt: old, confidence: 1, classification: "OBSERVED" } } });
    expect(snapshot.graph?.nodes).toHaveLength(1);
    expect(buildEpochWorldRefreshPlan({ facts: snapshot.facts, staleAfterMs: 15 * 60 * 1000 }).keys).toEqual(["gpu"]);
  });
});

import { describe, expect, it } from "vitest";
import { buildEpochCapabilityCompatibilityGraph } from "../lib/epoch/capabilityGraph";

describe("Epoch capability compatibility graph", () => {
  it("connects model, runtime, and hardware with truthful compatibility status", () => {
    const graph = buildEpochCapabilityCompatibilityGraph({
      model: { repositoryId: "org/model", requiredVramGb: 4, supportedRuntimes: ["ollama"] },
      runtimeOptions: [{ name: "ollama" }],
      hardwareOptions: [{ name: "RTX 4050", vramGb: 6, available: true }],
      capabilityProbes: { ollama: { reachable: true, models: ["org/model"], evidenceSha256: "probe" } },
      generatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges.filter((edge) => edge.status === "COMPATIBLE")).toHaveLength(3);
    expect(graph.evidenceSha256).toHaveLength(64);
  });

  it("does not hide insufficient VRAM", () => {
    const graph = buildEpochCapabilityCompatibilityGraph({ model: { repositoryId: "org/model", requiredVramGb: 12 }, runtimeOptions: [{ name: "ollama" }], hardwareOptions: [{ name: "laptop", vramGb: 6 }] });
    expect(graph.edges[0]?.status).toBe("INCOMPATIBLE");
    expect(graph.edges[0]?.reasons).toContain("hardware VRAM is below the model requirement");
  });
});

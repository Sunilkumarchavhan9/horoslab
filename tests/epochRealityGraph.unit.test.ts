import { describe, expect, it } from "vitest";
import { normalizeEpochRealityGraph } from "../lib/epoch/realityGraph";

describe("Epoch durable reality graph", () => {
  it("normalizes provenance, clamps confidence, and verifies relationship endpoints", () => {
    const graph = normalizeEpochRealityGraph({
      entities: [
        { canonicalKey: " service:api ", entityType: "service", name: "API", confidence: 2, provenance: { source: "input-1" } },
        { canonicalKey: " gpu:local", entityType: "hardware", name: "RTX 4050", confidence: -1 },
      ],
      relationships: [{ fromCanonicalKey: "service:api", toCanonicalKey: "gpu:local", relationType: "runs_on" }],
      sourceInputId: "input-1",
    });
    expect(graph.entities[0]).toMatchObject({ canonicalKey: "service:api", confidence: 1, status: "active" });
    expect(graph.entities[0].integritySha256).toHaveLength(64);
    expect(graph.relationships[0]).toMatchObject({ fromCanonicalKey: "service:api", toCanonicalKey: "gpu:local" });
  });

  it("rejects relationships to entities outside the submitted graph", () => {
    expect(() => normalizeEpochRealityGraph({
      entities: [{ canonicalKey: "service:api", entityType: "service", name: "API" }],
      relationships: [{ fromCanonicalKey: "service:api", toCanonicalKey: "gpu:missing", relationType: "runs_on" }],
    })).toThrow("epoch_reality_relationship_entity_missing");
  });
});

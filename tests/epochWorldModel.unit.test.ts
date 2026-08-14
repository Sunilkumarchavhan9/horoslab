import { describe, expect, it } from "vitest";
import { buildEpochWorldModelSnapshot, compareEpochWorldStates } from "../lib/epoch/worldModel";

describe("Epoch versioned World Model", () => {
  it("creates versioned provenance-backed facts and blocks material drift", () => {
    const planned = buildEpochWorldModelSnapshot({ previousVersion: 1, facts: { gpu: { value: "RTX 4050", source: "nvidia-smi", confidence: 1, classification: "OBSERVED" }, runtime: { value: "ollama", source: "ollama-api", confidence: 1, classification: "OBSERVED" } } });
    const current = buildEpochWorldModelSnapshot({ previousVersion: 2, facts: { gpu: { value: "different-gpu", source: "nvidia-smi", confidence: 1, classification: "OBSERVED" }, runtime: { value: "ollama", source: "ollama-api", confidence: 1, classification: "OBSERVED" } } });
    expect(planned.version).toBe("world-v2");
    expect(planned.snapshotSha256).toHaveLength(64);
    const comparison = compareEpochWorldStates({ planned, current, materialKeys: ["gpu"] });
    expect(comparison.decision).toBe("BLOCK_AND_REDISCOVER");
    expect(comparison.material).toBe(true);
  });

  it("requests review for unknown current facts", () => {
    const planned = buildEpochWorldModelSnapshot({ facts: { capacity: { value: 10, source: "planner", confidence: 1, classification: "INFERRED" } } });
    const current = buildEpochWorldModelSnapshot({ facts: { capacity: { value: 10, source: "telemetry", confidence: 0.2, classification: "UNKNOWN" } } });
    expect(compareEpochWorldStates({ planned, current }).decision).toBe("REVIEW");
  });
});

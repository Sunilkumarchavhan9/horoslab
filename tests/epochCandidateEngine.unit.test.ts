import { describe, expect, it } from "vitest";
import { generateEpochCandidates } from "../lib/epoch/candidateEngine";

describe("Epoch candidate engine", () => {
  it("generates compatible, incompatible, and unknown candidates without guessing", () => {
    const candidates = generateEpochCandidates({
      model: { repositoryId: "Qwen/Qwen3-8B", requiredVramGb: 24, supportedRuntimes: ["vllm"], supportedPrecisions: ["fp8"] },
      runtimeOptions: [
        { name: "vllm", version: "0.8.0", supportedPrecisions: ["fp8"] },
        { name: "unknown-runtime" },
      ],
      hardwareOptions: [
        { name: "H100", vramGb: 80, available: true },
        { name: "T4", vramGb: 16, available: true },
      ],
    }, new Date("2026-01-01T00:00:00.000Z"));

    expect(candidates).toHaveLength(4);
    expect(candidates[0].compatibility.status).toBe("COMPATIBLE");
    expect(candidates[1].compatibility.status).toBe("INCOMPATIBLE");
    expect(candidates[2].compatibility.status).toBe("INCOMPATIBLE");
    expect(candidates[3].compatibility.status).toBe("INCOMPATIBLE");
  });

  it("filters candidates by explicit allowed targets and bounds search", () => {
    const candidates = generateEpochCandidates({
      model: { repositoryId: "model" },
      runtimeOptions: [{ name: "vllm" }, { name: "sglang" }],
      hardwareOptions: [{ name: "H100" }, { name: "L40S" }],
      allowedRuntimes: ["sglang"],
      allowedHardware: ["l40s"],
      maxCandidates: 1,
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].runtime.name).toBe("sglang");
    expect(candidates[0].hardware.name).toBe("L40S");
  });

  it("does not call an unprobed runtime compatible", () => {
    const result = generateEpochCandidates({
      model: { repositoryId: "model-a", requiredVramGb: 4 },
      runtimeOptions: [{ name: "vllm" }],
      hardwareOptions: [{ name: "RTX", vramGb: 6 }],
      capabilityProbes: {},
    });
    expect(result[0].compatibility.status).toBe("UNKNOWN");
    expect(result[0].compatibility.reasons).toContain("one or more compatibility facts are unknown");
  });

  it("rejects a candidate when observed runtime capacity is insufficient", () => {
    const result = generateEpochCandidates({
      model: { repositoryId: "model-a", requiredVramGb: 4 },
      runtimeOptions: [{ name: "vllm" }],
      hardwareOptions: [{ name: "RTX", vramGb: 6, availableVramGb: 2 }],
      capabilityProbes: { vllm: { reachable: true, models: ["model-a"], version: "1.0.0", evidenceSha256: "a".repeat(64) } },
    });
    expect(result[0].compatibility.status).toBe("INCOMPATIBLE");
    expect(result[0].compatibility.reasons).toContain("available GPU capacity is below the model requirement");
  });
});

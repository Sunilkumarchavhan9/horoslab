import { describe, expect, it } from "vitest";
import { buildEpochExperimentReproducibilityManifest, sha256EpochExperimentArtifact, verifyEpochExperimentReproducibilityManifest } from "../lib/epoch/experimentReproducibility";

describe("Epoch experiment reproducibility", () => {
  it("creates a canonical tamper-evident experiment manifest", () => {
    const manifest = buildEpochExperimentReproducibilityManifest({ experimentId: "exp-1", model: { repositoryId: "Qwen/Qwen3-8B", revision: "abc" }, runtime: { name: "ollama", version: "0.32.8" }, hardware: { name: "RTX 4050", vramGb: 6 }, workload: { concurrency: 1 }, configuration: { maxOutputTokens: 32 }, dataset: { id: "smoke-v1", sha256: sha256EpochExperimentArtifact("dataset") }, softwareEnvironment: { node: "22" }, randomSeed: 7, metrics: { p95: 279 }, logs: [{ message: "completed" }], artifacts: [{ name: "result.json", contentSha256: sha256EpochExperimentArtifact("result") }] }, new Date("2026-01-01T00:00:00.000Z"));
    expect(manifest.manifestSha256).toHaveLength(64);
    expect(verifyEpochExperimentReproducibilityManifest(manifest).valid).toBe(true);
    expect(verifyEpochExperimentReproducibilityManifest({ ...manifest, metrics: { p95: 300 } }).valid).toBe(false);
  });
});

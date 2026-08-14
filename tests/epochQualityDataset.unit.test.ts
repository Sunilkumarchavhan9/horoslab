import { describe, expect, it } from "vitest";
import { loadEpochQualityDataset, validateEpochQualityDataset } from "../lib/epoch/qualityDataset";

describe("Epoch quality dataset", () => {
  it("loads the versioned local dataset with a checksum", async () => {
    const dataset = await loadEpochQualityDataset();
    expect(dataset.version).toBe("epoch_quality_dataset.v1");
    expect(dataset.cases.length).toBeGreaterThanOrEqual(5);
    expect(dataset.sha256).toHaveLength(64);
  });

  it("rejects cases without an independent expectation", () => {
    expect(() => validateEpochQualityDataset([{ id: "bad", prompt: "test" }])).toThrow("evaluator expectation");
  });
});

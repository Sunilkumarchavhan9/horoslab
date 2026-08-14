import { describe, expect, it } from "vitest";
import { estimateEpochGpuMemory } from "../lib/epoch/gpuMemoryEstimator";

describe("Epoch GPU memory estimator", () => {
  it("rejects a model that cannot fit the declared GPU", () => {
    const estimate = estimateEpochGpuMemory({ model: "large", parameterCount: 70_000_000_000, quantization: "fp16", contextLength: 8192, numLayers: 80, hiddenSize: 8192, gpuName: "RTX 4050", vramMb: 6144 });
    expect(estimate.fits).toBe(false);
    expect(estimate.evidenceSha256).toHaveLength(64);
  });
});

import { describe, expect, it } from "vitest";
import { enqueueEpochRealityMaintenance, enqueueEpochRealityProjection } from "../lib/epoch/realityJobs";

describe("Epoch reality durable jobs", () => {
  it("exposes projection and maintenance queue entry points", () => {
    expect(enqueueEpochRealityProjection).toBeTypeOf("function");
    expect(enqueueEpochRealityMaintenance).toBeTypeOf("function");
  });
});

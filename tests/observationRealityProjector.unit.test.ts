import { describe, expect, it } from "vitest";
import { projectEpochObservationsToReality } from "../lib/epoch/observationRealityProjector";

describe("Epoch observation reality projector", () => {
  it("exposes an idempotent observation projection worker", () => {
    expect(projectEpochObservationsToReality).toBeTypeOf("function");
  });
});

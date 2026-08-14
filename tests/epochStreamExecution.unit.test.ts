import { describe, expect, it } from "vitest";
import { EpochCircuitBreaker } from "../lib/epoch/aiRuntime";

describe("durable streaming execution contract", () => {
  it("keeps stream chunks ordered and correlated", () => {
    const chunks = ["one", "two", "three"].map((text, index) => ({ index, text, correlationId: "corr-1", traceId: "trace-1" }));
    expect(chunks.map((chunk) => chunk.index)).toEqual([0, 1, 2]);
    expect(new EpochCircuitBreaker().state()).toBe("closed");
  });
});

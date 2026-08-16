import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Epoch mission reality wiring", () => {
  it("starts durable reality maintenance and projection when a mission is created", () => {
    const source = readFileSync("lib/epoch/epochStore.ts", "utf8");
    expect(source).toContain("enqueueEpochRealityMaintenance");
    expect(source).toContain("enqueueEpochRealityProjection");
  });
});

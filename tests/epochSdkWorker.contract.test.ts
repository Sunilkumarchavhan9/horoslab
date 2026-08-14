import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Epoch Worker SDK contract", () => {
  it("exposes the V12 worker lifecycle and fenced completion methods", async () => {
    const source = await readFile("packages/epoch-sdk/src/index.ts", "utf8");
    expect(source).toContain("registerWorker");
    expect(source).toContain("heartbeatWorker");
    expect(source).toContain("leaseWorkerJobs");
    expect(source).toContain("completeWorkerJob");
    expect(source).toContain("fencingToken");
  });
});

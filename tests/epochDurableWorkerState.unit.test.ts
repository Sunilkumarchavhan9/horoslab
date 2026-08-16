import { describe, expect, it } from "vitest";
import { nextEpochWorkerCheckpoint } from "../lib/epoch/durableWorkerState";

describe("Epoch durable worker checkpoint contract", () => {
  it("creates a versioned checkpoint from an empty job payload", () => {
    const checkpoint = nextEpochWorkerCheckpoint(undefined, { stage: "planner", status: "started" });
    expect(checkpoint.version).toBe(1);
    expect(checkpoint.stage).toBe("planner");
    expect(checkpoint.status).toBe("started");
    expect(checkpoint.recordedAt).toEqual(expect.any(String));
  });

  it("increments the checkpoint version for crash-safe resume", () => {
    const checkpoint = nextEpochWorkerCheckpoint({ version: 4 }, { stage: "benchmark", status: "running", progress: 0.5 });
    expect(checkpoint.version).toBe(5);
    expect(checkpoint.progress).toBe(0.5);
  });
});

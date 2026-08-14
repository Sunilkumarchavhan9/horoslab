import { describe, expect, it } from "vitest";
import { EPOCH_WORKER_STALE_AFTER_MS, isEpochWorkerStale, workerCanRunEpochJob } from "../lib/epoch/epochWorkers";

describe("Epoch worker liveness", () => {
  it("marks workers stale after the heartbeat lease window", () => {
    expect(isEpochWorkerStale(new Date(Date.now() - EPOCH_WORKER_STALE_AFTER_MS - 1))).toBe(true);
    expect(isEpochWorkerStale(new Date(Date.now() - EPOCH_WORKER_STALE_AFTER_MS + 1))).toBe(false);
  });

  it("enforces declared job capabilities", () => {
    const job = {
      id: "job-1",
      workspaceId: "workspace-1",
      type: "execute" as const,
      status: "queued" as const,
      createdAt: new Date().toISOString(),
      payload: { requiredCapabilities: ["repository.read", "test.run"] },
    };
    expect(workerCanRunEpochJob({ capabilities: ["repository.read", "test.run"] }, job)).toBe(true);
    expect(workerCanRunEpochJob({ capabilities: ["repository.read"] }, job)).toBe(false);
  });
});

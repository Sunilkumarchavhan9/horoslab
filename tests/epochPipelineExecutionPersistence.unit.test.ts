import { describe, expect, it } from "vitest";
import { buildEpochPipelineCheckpoint } from "../lib/epoch/pipelineExecutionPersistence";

describe("Epoch durable pipeline checkpoints", () => {
  it("creates a versioned integrity-bound resumable checkpoint", () => {
    const checkpoint = buildEpochPipelineCheckpoint({
      runId: "run-1",
      sequence: 4,
      status: "running",
      event: { type: "node_completed", runId: "run-1", nodeId: "model", at: "2026-08-13T00:00:00.000Z", payload: { latencyMs: 12 } },
    });
    expect(checkpoint).toMatchObject({ version: "epoch_pipeline_checkpoint.v1", runId: "run-1", sequence: 4, status: "running" });
    expect(checkpoint.checkpointSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});

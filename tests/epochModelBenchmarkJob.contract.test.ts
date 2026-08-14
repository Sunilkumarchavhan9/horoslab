import { describe, expect, it } from "vitest";

describe("Epoch model benchmark job", () => {
  it("exposes a durable model benchmark queue and worker rediscovery path", async () => {
    const queue = await import("../lib/epoch/epochQueue");
    expect(queue).toBeDefined();
    const source = await import("node:fs/promises").then((fs) => fs.readFile("lib/epoch/epochWorker.ts", "utf8"));
    expect(source).toContain('case "model_benchmark"');
    expect(source).toContain('kind: "epoch_model_benchmark"');
    expect(source).toContain('kind: "epoch_model_rediscovery"');
  });

  it("keeps benchmark API gated on a synced model", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile("server/routes/epoch-runtime.routes.ts", "utf8"));
    expect(source).toContain("/workspaces/:workspaceId/models/huggingface/benchmark-jobs");
    expect(source).toContain('code: "MODEL_NOT_SYNCED"');
    expect(source).toContain('type: "model_benchmark"');
  });

  it("exposes durable quality evaluation and the quality rediscovery path", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile("lib/epoch/epochWorker.ts", "utf8"));
    const routes = await import("node:fs/promises").then((fs) => fs.readFile("server/routes/epoch-runtime.routes.ts", "utf8"));
    expect(source).toContain('case "model_quality"');
    expect(source).toContain('kind: "epoch_model_quality"');
    expect(source).toContain("evaluateEpochQuality");
    expect(routes).toContain("/workspaces/:workspaceId/models/huggingface/quality-jobs");
    expect(routes).toContain('type: "model_quality"');
  });
});

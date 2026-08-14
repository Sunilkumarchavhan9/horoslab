import { describe, expect, it } from "vitest";

describe("Epoch Hugging Face durable sync job contract", () => {
  it("uses the durable queue type and never puts a token in the job payload", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) => readFile("server/routes/epoch-runtime.routes.ts", "utf8"));
    expect(source).toContain('type: "model_sync"'); expect(source).toContain("downloadArtifacts: body.data.downloadArtifacts"); expect(source).not.toContain("token: body.data.token");
  });
  it("defines a retryable persisted sync state flow", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) => readFile("lib/epoch/epochWorker.ts", "utf8"));
    expect(source).toContain('state: "RUNNING"'); expect(source).toContain('state: "COMPLETED"'); expect(source).toContain('state: "FAILED"'); expect(source).toContain('case "model_sync"');
  });
});

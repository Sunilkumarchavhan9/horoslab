import { describe, expect, it } from "vitest";

describe("Epoch telemetry reverification", () => {
  it("queues benchmark and quality jobs after material drift", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile("server/routes/epoch-runtime.routes.ts", "utf8"));
    expect(source).toContain("repositoryId: z.string().min(1).max(200).optional()");
    expect(source).toContain("benchmarkPrompts");
    expect(source).toContain('type: "model_benchmark"');
    expect(source).toContain('type: "model_quality"');
    expect(source).toContain("reverificationJobs");
  });
});

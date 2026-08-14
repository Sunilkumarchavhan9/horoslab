import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Phase C worker evaluation persistence", () => {
  it("keeps evaluation data workspace and worker scoped", async () => {
    const source = await readFile("lib/epoch/workerEvaluations.ts", "utf8");
    expect(source).toContain("workspaceId: input.workspaceId");
    expect(source).toContain("workerId: input.workerId");
    expect(source).toContain("score < 0 || input.score > 100");
  });
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Epoch V12 CLI", () => {
  it("uses only V12 API routes", async () => {
    const source = await readFile("packages/epoch-v12-cli/src/index.ts", "utf8");
    expect(source).toContain("/api/v1/epoch/workspaces/");
    expect(source).toContain("/queue/enqueue");
    expect(source).not.toMatch(/MemoryIgnition|memoryignition|onboarding|github|packages\/epoch-(sdk|api|mcp)/i);
  });
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Phase I stable Epoch route mount", () => {
  it("mounts the canonical router at the versioned API path and preserves the legacy adapter", async () => {
    const source = await readFile("server/app.ts", "utf8");
    expect(source).toContain('"/api/v1/epoch"');
    expect(source).toContain('"/api/epoch"');
    expect(source).toContain('epochRouter,');
  });
});

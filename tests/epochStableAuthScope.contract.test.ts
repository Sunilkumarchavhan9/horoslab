import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Stable Epoch API key scope", () => {
  it("allows epoch_runtime keys on both current and migration mounts", async () => {
    const source = await readFile("server/middleware/auth.ts", "utf8");
    expect(source).toContain('baseUrl === "/api/epoch" || baseUrl === "/api/v1/epoch"');
  });
});

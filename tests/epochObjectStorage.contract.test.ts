import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Phase E object storage boundary", () => {
  it("delegates to the canonical Epoch artifact store", async () => {
    const source = await readFile("lib/epoch/objectStorage.ts", "utf8");
    expect(source).toContain("saveEpochArtifact");
    expect(source).toContain("getEpochArtifactById");
    expect(source).toContain("must not create a second evidence store");
  });
});

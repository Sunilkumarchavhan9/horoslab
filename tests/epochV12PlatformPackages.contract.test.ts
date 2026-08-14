import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Epoch V12 platform packages", () => {
  it("keeps API, SDK, and MCP packages isolated from legacy package imports", async () => {
    const files = [
      "packages/epoch-v12-api/src/index.ts",
      "packages/epoch-v12-sdk/src/index.ts",
      "packages/epoch-v12-mcp/src/stdio.ts",
    ];
    for (const file of files) {
      const source = await readFile(file, "utf8");
      expect(source).not.toMatch(/packages\/epoch-(sdk|api|mcp)/);
      expect(source).not.toMatch(/MemoryIgnition|memoryignition|onboarding|github/i);
    }
  });

  it("exposes only the canonical V12 MCP tool namespace", async () => {
    const source = await readFile("packages/epoch-v12-mcp/src/stdio.ts", "utf8");
    expect(source).toContain("epoch_v12.list_missions");
    expect(source).toContain("epoch_v12.create_mission");
    expect(source).toContain("epoch_v12.list_workers");
    expect(source).toContain("epoch_v12.get_evidence_bundle");
    expect(source).not.toContain("memory.before_model");
  });

  it("exposes Phase E verification, artifact, and settlement methods", async () => {
    const source = await readFile("packages/epoch-v12-api/src/index.ts", "utf8");
    expect(source).toContain("createVerifierAssignment");
    expect(source).toContain("completeVerifierAssignment");
    expect(source).toContain("issueArtifactAccessToken");
    expect(source).toContain("settleMission");
  });
});

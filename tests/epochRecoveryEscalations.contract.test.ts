import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Phase D escalation persistence", () => {
  it("requires workspace and mission scope for escalation records", async () => {
    const source = await readFile("lib/epoch/recoveryEscalations.ts", "utf8");
    expect(source).toContain("workspaceId: input.workspaceId");
    expect(source).toContain("missionId: input.missionId");
    expect(source).toContain('status: "open"');
  });
});

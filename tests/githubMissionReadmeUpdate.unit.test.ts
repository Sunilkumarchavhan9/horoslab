import { describe, expect, it } from "vitest";
import { buildReadmeUpdate } from "../lib/epoch/githubMissionExecution";

describe("guarded GitHub README updates", () => {
  it("preserves Local Development and adds a distinct evidence section", () => {
    const current = "# Keepalive\n\n## Local Development\n\nExisting setup instructions.";
    const next = buildReadmeUpdate(
      current,
      "Add a unique evidence section to README.md and create a reviewed pull request.",
      "npm test",
      "npm run lint && npm run typecheck",
    );

    expect(next).toContain("## Local Development\n\nExisting setup instructions.");
    expect(next).toContain("## Epoch Evidence");
    expect(next).toContain("Add a unique evidence section");
  });

  it("still rejects a duplicate section of the requested type", () => {
    expect(() => buildReadmeUpdate(
      "# Keepalive\n\n## Epoch Evidence\n\nAlready recorded.",
      "Add an evidence section to README.md.",
      "npm test",
      "npm run lint",
    )).toThrow("already contains a Epoch Evidence section");
  });

  it("keeps the original Local Development behavior for setup missions", () => {
    expect(buildReadmeUpdate(
      "# Keepalive",
      "Add a short local-development setup section.",
      "npm test",
      "npm run lint",
    )).toContain("## Local Development");
  });
});

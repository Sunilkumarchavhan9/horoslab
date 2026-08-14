import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Codex MemoryIgnition skill", () => {
  const skillPath = path.join(process.cwd(), ".codex", "skills", "memoryignition", "SKILL.md");
  const skill = readFileSync(skillPath, "utf8");

  it("defines a Codex skill that triggers for MemoryOS inheritance work", () => {
    expect(skill).toContain("name: memoryignition");
    expect(skill).toContain("approved skills");
    expect(skill).toContain("risk rules");
    expect(skill).toContain("trace proof");
  });

  it("requires the MCP before/during/after workflow", () => {
    expect(skill).toContain("memoryignition_get_brief");
    expect(skill).toContain("memoryignition_search_memory");
    expect(skill).toContain("memoryignition_save_outcome");
    expect(skill).toContain("memoryignition_create_handoff");
  });

  it("keeps the product boundary honest", () => {
    expect(skill).toContain("does not scrape private Codex chat history");
    expect(skill).toContain("Never put MemoryOS API keys");
  });
});

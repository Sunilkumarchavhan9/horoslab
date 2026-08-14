import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Codex MemoryOS runner", () => {
  const source = readFileSync(path.join(process.cwd(), "scripts", "codex-memoryos-run.ts"), "utf8");

  it("streams the MemoryIgnition prompt through stdin instead of argv", () => {
    expect(source).toContain('const args = ["exec", "-"]');
    expect(source).toContain('stdio: ["pipe", "pipe", "pipe"]');
    expect(source).toContain("child.stdin.write(prompt)");
    expect(source).not.toContain('const args = ["exec", prompt]');
  });
});

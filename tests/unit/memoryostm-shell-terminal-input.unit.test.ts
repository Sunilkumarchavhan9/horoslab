import { describe, expect, it } from "vitest";
import {
  applyShellTerminalInput,
  summarizeShellHistory,
} from "../../memoryos-frontend/lib/continuity-lab/memoryostm-shell-terminal-input";

describe("memoryostm shell terminal input", () => {
  it("summarizes recent history entries for prompt metadata", () => {
    const summary = summarizeShellHistory([
      { id: "1", at: "", title: "Session started", detail: null, output: null, kind: "session", state: "waiting", source: "browser" },
      { id: "2", at: "", title: "Investigate bug", detail: null, output: null, kind: "prompt", state: "working", source: "browser" },
      { id: "3", at: "", title: "npm test", detail: null, output: null, kind: "command", state: "waiting", source: "browser" },
    ]);

    expect(summary).toBe("session:Session started | prompt:Investigate bug | cmd:npm test");
  });

  it("detects prompt submission from comment-style terminal input", () => {
    const result = applyShellTerminalInput("", "# Investigate bug\r", "cmd:npm test");

    expect(result.currentLine).toBe("");
    expect(result.promptSubmission).toEqual({
      prompt: "Investigate bug",
      currentLine: "# Investigate bug",
      recentHistory: "cmd:npm test",
    });
  });

  it("detects prompt submission from ctrl-g", () => {
    const result = applyShellTerminalInput("Investigate bug", "\u0007", "cmd:npm test");

    expect(result.currentLine).toBe("");
    expect(result.promptSubmission).toEqual({
      prompt: "Investigate bug",
      currentLine: "Investigate bug",
      recentHistory: "cmd:npm test",
    });
  });
});

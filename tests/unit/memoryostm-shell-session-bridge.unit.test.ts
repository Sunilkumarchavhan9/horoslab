import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("memoryostm shell session bridge", () => {
  it("persists prompt metadata from the shell environment", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "memoryostm-shell-bridge-"));
    const script = path.join(process.cwd(), "tools", "memoryostm-shell", "session-bridge.mjs");

    try {
      const result = spawnSync(
        process.execPath,
        [script, "prompt", "Investigate the bug"],
        {
          cwd: tempDir,
          encoding: "utf8",
          env: {
            ...process.env,
            MEMORYOSTM_SHELL_PROJECT_ROOT: tempDir,
            MEMORYOSTM_SHELL_CURRENT_LINE: "Investigate the bug",
            MEMORYOSTM_SHELL_RECENT_HISTORY: "git status | npm test",
          },
        },
      );

      expect(result.status).toBe(0);
      const logPath = path.join(tempDir, ".memoryostm", "runtime", "cli-events.jsonl");
      const log = await readFile(logPath, "utf8");
      expect(log).toContain('"hookEventName":"UserPromptSubmit"');
      expect(log).toContain('"prompt":"Investigate the bug"');
      expect(log).toContain('"currentLine":"Investigate the bug"');
      expect(log).toContain('"recentHistory":"git status | npm test"');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

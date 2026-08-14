import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("memoryostm shell hook runner", () => {
  it("accepts env-driven shell events and persists runtime logs", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "memoryostm-shell-hook-"));
    const script = path.join(process.cwd(), "tools", "memoryostm-shell", "hook-runner.mjs");

    try {
      const result = spawnSync(
        process.execPath,
        [script],
        {
          cwd: tempDir,
          encoding: "utf8",
          env: {
            ...process.env,
            DEVIN_PROJECT_DIR: tempDir,
            MEMORYOSTM_SHELL_HOOK_EVENT_NAME: "PostToolUse",
            MEMORYOSTM_SHELL_TOOL_NAME: "shell.exec",
            MEMORYOSTM_SHELL_COMMAND: "echo hello",
            MEMORYOSTM_SHELL_OUTPUT: "hello",
            MEMORYOSTM_SHELL_CURRENT_LINE: "echo hello",
            MEMORYOSTM_SHELL_RECENT_HISTORY: "pwd | ls",
            MEMORYOSTM_SHELL_SUCCESS: "true",
            MEMORYOSTM_SHELL_EXIT_CODE: "0",
            MEMORYOSTM_SHELL_SOURCE: "terminal",
          },
        },
      );

      expect(result.status).toBe(0);
      const logPath = path.join(tempDir, ".memoryostm", "runtime", "cli-events.jsonl");
      const log = await readFile(logPath, "utf8");
      expect(log).toContain('"hookEventName":"PostToolUse"');
      expect(log).toContain('"command":"echo hello"');
      expect(log).toContain('"output":"hello"');
      expect(log).toContain('"currentLine":"echo hello"');
      expect(log).toContain('"recentHistory":"pwd | ls"');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

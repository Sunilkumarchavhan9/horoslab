import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function runInstaller(shell: "bash" | "zsh" | "fish", rcPath: string) {
  const script = path.join(process.cwd(), "tools", "memoryostm-shell", "install-shell-integration.mjs");
  return spawnSync(process.execPath, [script, "--shell", shell, "--rc", rcPath], {
    encoding: "utf8",
    cwd: process.cwd(),
  });
}

describe("memoryostm shell installer", () => {
  it("writes bash hooks, prompt binding, and status helpers", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "memoryostm-shell-installer-"));
    const rcPath = path.join(tempDir, ".bashrc");

    try {
      const result = runInstaller("bash", rcPath);
      expect(result.status).toBe(0);
      const rc = await readFile(rcPath, "utf8");
      expect(rc).toContain("MemoryOSTM shell integration");
      expect(rc).toContain("memoryostm-shell-status()");
      expect(rc).toContain("memoryostm-shell-recent-history()");
      expect(rc).toContain("memoryostm-shell-submit-current-line()");
      expect(rc).toContain('bind -x \'"\\C-g":memoryostm-shell-submit-current-line\'');
      expect(rc).toContain("PROMPT_COMMAND=\"memoryostm-shell-record-command");
      expect(rc).toContain("MEMORYOSTM_SHELL_CURRENT_LINE");
      expect(rc).toContain("MEMORYOSTM_SHELL_RECENT_HISTORY");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("writes zsh comment submission and hook bindings", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "memoryostm-shell-installer-"));
    const rcPath = path.join(tempDir, ".zshrc");

    try {
      const result = runInstaller("zsh", rcPath);
      expect(result.status).toBe(0);
      const rc = await readFile(rcPath, "utf8");
      expect(rc).toContain("autoload -Uz add-zsh-hook");
      expect(rc).toContain("memoryostm-shell-accept-line()");
      expect(rc).toContain("memoryostm-shell-recent-history()");
      expect(rc).toContain("bindkey '^G' memoryostm-shell-submit-current-line");
      expect(rc).toContain("add-zsh-hook preexec memoryostm-shell-preexec");
      expect(rc).toContain("add-zsh-hook precmd memoryostm-shell-precmd");
      expect(rc).toContain("MEMORYOSTM_SHELL_CURRENT_LINE");
      expect(rc).toContain("MEMORYOSTM_SHELL_RECENT_HISTORY");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("writes fish prompt bindings and event hooks", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "memoryostm-shell-installer-"));
    const rcPath = path.join(tempDir, "config.fish");

    try {
      const result = runInstaller("fish", rcPath);
      expect(result.status).toBe(0);
      const rc = await readFile(rcPath, "utf8");
      expect(rc).toContain("memoryostm-shell-submit-current-line");
      expect(rc).toContain("memoryostm-shell-accept-line");
      expect(rc).toContain("memoryostm-shell-recent-history");
      expect(rc).toContain("fish_preexec");
      expect(rc).toContain("fish_postexec");
      expect(rc).toContain("bind \\cg memoryostm-shell-submit-current-line");
      expect(rc).toContain("MEMORYOSTM_SHELL_CURRENT_LINE");
      expect(rc).toContain("MEMORYOSTM_SHELL_RECENT_HISTORY");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

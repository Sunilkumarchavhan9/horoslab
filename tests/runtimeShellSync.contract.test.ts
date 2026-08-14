import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";

describe("Runtime shell sync contract", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_auth_shell_sync";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  it("returns shell sync data scoped to the authenticated thread repo path", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "memoryostm-shell-sync-"));
    vi.stubEnv("MEMORYOSTM_ALLOWED_SHELL_ROOTS", repoRoot);

    try {
      const runtimeDir = path.join(repoRoot, ".memoryostm", "runtime");
      await mkdir(runtimeDir, { recursive: true });
      await writeFile(
        path.join(repoRoot, ".memoryostm", "hooks.v1.json"),
        JSON.stringify({ installed: true }),
        "utf8",
      );
      await writeFile(
        path.join(runtimeDir, "cli-events.jsonl"),
        [
          JSON.stringify({
            id: "event-1",
            at: "2026-06-15T00:00:00.000Z",
            hookEventName: "PostToolUse",
            toolName: "memoryostm-shell",
            title: "ls",
            detail: "Command completed",
            output: "file.txt",
            state: "waiting",
            entryKind: "command",
          }),
          JSON.stringify({
            id: "event-2",
            at: "2026-06-15T00:00:01.000Z",
            hookEventName: "SessionStart",
            title: "Shell session started",
            detail: repoRoot,
            output: null,
            state: "waiting",
            entryKind: "session",
          }),
        ].join("\n") + "\n",
        "utf8",
      );

      const createRes = await request(app)
        .post("/api/runtime/threads")
        .set("authorization", authHeader)
        .send({
          title: "Shell sync thread",
          workspace: "default",
          project: "memoryos",
          repoPath: repoRoot,
        });

      expect(createRes.status).toBe(201);
      const threadId = createRes.body.data.thread.id as string;

      const syncRes = await request(app)
        .get(`/api/runtime/threads/${threadId}/shell/sync`)
        .set("authorization", authHeader);

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.ok).toBe(true);
      expect(syncRes.body.data.shell.installed).toBe(true);
      expect(syncRes.body.data.shell.entries).toHaveLength(2);
      expect(syncRes.body.data.shell.entries[0].title).toBe("ls");
      expect(syncRes.body.data.shell.logPath).toContain(repoRoot);
    } finally {
      vi.unstubAllEnvs();
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("accepts prompt metadata when submitting browser/API shell prompts", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "memoryostm-shell-prompt-"));
    vi.stubEnv("MEMORYOSTM_ALLOWED_SHELL_ROOTS", repoRoot);

    try {
      const createRes = await request(app)
        .post("/api/runtime/threads")
        .set("authorization", authHeader)
        .send({
          title: "Shell prompt metadata thread",
          workspace: "default",
          project: "memoryos",
          repoPath: repoRoot,
        });

      expect(createRes.status).toBe(201);
      const threadId = createRes.body.data.thread.id as string;

      const promptRes = await request(app)
        .post(`/api/runtime/threads/${threadId}/shell/prompt`)
        .set("authorization", authHeader)
        .send({
          prompt: "Investigate the bug",
          currentLine: "Investigate the bug",
          recentHistory: "pwd | git status",
        });

      expect(promptRes.status).toBe(202);
      expect(promptRes.body.ok).toBe(true);
      const promptEntry = promptRes.body.data.shell.entries.find(
        (entry: { kind: string }) => entry.kind === "prompt",
      );
      expect(promptEntry.currentLine).toBe("Investigate the bug");
      expect(promptEntry.recentHistory).toBe("pwd | git status");

      const closeRes = await request(app)
        .post(`/api/runtime/threads/${threadId}/shell/close`)
        .set("authorization", authHeader)
        .send({});
      expect(closeRes.status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});

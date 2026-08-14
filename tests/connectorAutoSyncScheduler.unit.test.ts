import { mkdirSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAutoSyncSourceConfigured } from "../lib/integrations/connectorAutoSyncScheduler";

describe("connector auto-sync scheduler configuration guard", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = path.join(os.tmpdir(), `memoryos-autosync-${Date.now()}-${Math.random()}`);
    mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("skips hidden engineering signal connectors until they have a real source root or provider", () => {
    expect(isAutoSyncSourceConfigured("cursor_chats", { rootPath: tempRoot })).toBe(false);
    expect(isAutoSyncSourceConfigured("vs_code_chats", { rootPath: tempRoot })).toBe(false);
    expect(isAutoSyncSourceConfigured("windsurf_chats", { rootPath: tempRoot })).toBe(false);
    expect(isAutoSyncSourceConfigured("ide_chats", { rootPath: tempRoot })).toBe(false);

    expect(isAutoSyncSourceConfigured("codex_chats", { rootPath: tempRoot })).toBe(true);
    expect(isAutoSyncSourceConfigured("cursor_chats", { rootPath: tempRoot, autoSyncEnabled: true })).toBe(false);
    expect(isAutoSyncSourceConfigured("ci_cd_logs", { provider: "github_actions" })).toBe(true);
    expect(isAutoSyncSourceConfigured("deployment_errors", { provider: "sentry" })).toBe(true);
    expect(isAutoSyncSourceConfigured("devin_chats", { provider: "devin" })).toBe(true);
  });
});

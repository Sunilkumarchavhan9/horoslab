import { mkdirSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildEngineeringSignalDirectorySignature,
  shouldLiveWatchEngineeringSignal,
} from "../lib/integrations/engineeringSignalLiveWatcher";

describe("engineering signal live watcher", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = path.join(os.tmpdir(), `memoryos-live-watch-${Date.now()}-${Math.random()}`);
    mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("builds a changed signature when watched engineering files change", () => {
    const chatFile = path.join(tempRoot, "cursor-session.md");
    writeFileSync(chatFile, "Initial Cursor handoff: auth middleware changed.", "utf8");

    const before = buildEngineeringSignalDirectorySignature(tempRoot);
    writeFileSync(chatFile, "Updated Cursor handoff: run phase1 gate before ship.", "utf8");
    const after = buildEngineeringSignalDirectorySignature(tempRoot);

    expect(before.exists).toBe(true);
    expect(before.fileCount).toBe(1);
    expect(after.fileCount).toBe(1);
    expect(after.signature).not.toBe(before.signature);
  });

  it("ignores unsupported file types so screenshots or binaries do not trigger sync", () => {
    writeFileSync(path.join(tempRoot, "screen.png"), "not a real png", "utf8");

    const signature = buildEngineeringSignalDirectorySignature(tempRoot);

    expect(signature.exists).toBe(true);
    expect(signature.fileCount).toBe(0);
    expect(signature.signature).toBe("empty");
  });

  it("watches local engineering signal connectors but skips API-backed providers", () => {
    expect(shouldLiveWatchEngineeringSignal("cursor_chats", {})).toBe(true);
    expect(shouldLiveWatchEngineeringSignal("codex_chats", { liveWatchEnabled: false })).toBe(false);
    expect(shouldLiveWatchEngineeringSignal("ci_cd_logs", { provider: "github_actions" })).toBe(false);
    expect(shouldLiveWatchEngineeringSignal("deployment_errors", { provider: "sentry" })).toBe(false);
    expect(shouldLiveWatchEngineeringSignal("devin_chats", { provider: "devin" })).toBe(false);
    expect(shouldLiveWatchEngineeringSignal("linear", {})).toBe(false);
  });
});

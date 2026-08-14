import { mkdirSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEngineeringSignalMemorySourceDetails,
  defaultEngineeringSignalRoot,
  EngineeringSignalFilesClient,
} from "../lib/integrations/engineeringSignalFiles";
import { upsertRecentMemory } from "../lib/memory/recentMemoryStore";

vi.mock("../lib/memory/extractMemory", () => ({
  extractMemory: vi.fn(() => []),
}));

vi.mock("../lib/memory/recentMemoryStore", () => ({
  upsertRecentMemory: vi.fn(async () => undefined),
}));

describe("engineering signal file imports", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = path.join(os.tmpdir(), `memoryos-engineering-signals-${Date.now()}-${Math.random()}`);
    mkdirSync(tempRoot, { recursive: true });
    vi.mocked(upsertRecentMemory).mockClear();
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("builds stable chat source refs and trace proof per agent surface", () => {
    const cases = [
      {
        type: "cursor_chats" as const,
        relativePath: "session-001.md",
        absolutePath: "C:/projects/MemoryOS/.memoryostm/imports/cursor-chats/session-001.md",
        sourceRef: "cursor-chat://session-001.md",
        sourceType: "cursor_chat",
        evidence: "Cursor Chat: session-001.md",
      },
      {
        type: "vs_code_chats" as const,
        relativePath: "copilot-chat.md",
        absolutePath: "C:/projects/MemoryOS/.memoryostm/imports/vs-code-chats/copilot-chat.md",
        sourceRef: "vs-code-chat://copilot-chat.md",
        sourceType: "vs_code_chat",
        evidence: "VS Code Chat: copilot-chat.md",
      },
      {
        type: "codex_chats" as const,
        relativePath: "handoff.md",
        absolutePath: "C:/projects/MemoryOS/.memoryostm/imports/codex-chats/handoff.md",
        sourceRef: "codex-chat://handoff.md",
        sourceType: "codex_chat",
        evidence: "Codex Chat: handoff.md",
      },
      {
        type: "chatgpt_chats" as const,
        relativePath: "project-chat.md",
        absolutePath: "C:/projects/MemoryOS/.memoryostm/imports/chatgpt-chats/project-chat.md",
        sourceRef: "chatgpt-chat://project-chat.md",
        sourceType: "chatgpt_chat",
        evidence: "ChatGPT Chat: project-chat.md",
      },
      {
        type: "windsurf_chats" as const,
        relativePath: "cascade-session.md",
        absolutePath: "C:/projects/MemoryOS/.memoryostm/imports/windsurf-chats/cascade-session.md",
        sourceRef: "windsurf-chat://cascade-session.md",
        sourceType: "windsurf_chat",
        evidence: "Windsurf Chat: cascade-session.md",
      },
      {
        type: "devin_chats" as const,
        relativePath: "devin-session.md",
        absolutePath: "C:/projects/MemoryOS/.memoryostm/imports/devin-chats/devin-session.md",
        sourceRef: "devin-chat://devin-session.md",
        sourceType: "devin_chat",
        evidence: "Devin Chat: devin-session.md",
      },
    ];

    for (const testCase of cases) {
      const proof = buildEngineeringSignalMemorySourceDetails({
        type: testCase.type,
        relativePath: testCase.relativePath,
        absolutePath: testCase.absolutePath,
        capturedAt: "2026-06-18T00:00:00.000Z",
      });

      expect(proof.sourceRef).toBe(testCase.sourceRef);
      expect(proof.traceProof).toMatchObject({
        sourceType: testCase.sourceType,
        sourceRef: testCase.sourceRef,
        capturedAt: "2026-06-18T00:00:00.000Z",
      });
      expect(proof.traceProof.evidence).toEqual([
        testCase.evidence,
        testCase.absolutePath,
      ]);
    }
  });

  it("builds stable default roots", () => {
    expect(defaultEngineeringSignalRoot("cursor_chats").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/cursor-chats",
    );
    expect(defaultEngineeringSignalRoot("vs_code_chats").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/vs-code-chats",
    );
    expect(defaultEngineeringSignalRoot("codex_chats").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/codex-chats",
    );
    expect(defaultEngineeringSignalRoot("chatgpt_chats").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/chatgpt-chats",
    );
    expect(defaultEngineeringSignalRoot("windsurf_chats").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/windsurf-chats",
    );
    expect(defaultEngineeringSignalRoot("devin_chats").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/devin-chats",
    );
    expect(defaultEngineeringSignalRoot("ci_cd_logs").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/ci-cd-logs",
    );
    expect(defaultEngineeringSignalRoot("deployment_errors").replace(/\\/g, "/")).toContain(
      ".memoryostm/imports/deployment-errors",
    );
  });

  it("imports exported engineering signal files into traceable memories", async () => {
    writeFileSync(
      path.join(tempRoot, "failed-build.log"),
      "npm test failed after auth middleware changed. Required test: npm run phase1:e2e:gate",
      "utf8",
    );

    const result = await EngineeringSignalFilesClient.sync({
      userId: "user_phase1",
      type: "ci_cd_logs",
      rootPath: tempRoot,
      recentItemKeys: [],
    });

    expect(result.success).toBe(true);
    expect(result.extractedCount).toBe(1);
    expect(result.dedupeKeys).toEqual(["ci_cd_logs:failed-build.log"]);
    expect(result.contractCounts).toEqual({ incident: 1 });
    expect(upsertRecentMemory).toHaveBeenCalledTimes(1);
    expect(vi.mocked(upsertRecentMemory).mock.calls[0]?.[0]).toMatchObject({
      userId: "user_phase1",
      source: "import",
      contractVersion: "memoryos.contract.v1",
      contractCategory: "incident",
      companyBrainType: "test",
      sourceRef: "ci-cd://failed-build.log",
      traceProof: {
        sourceType: "ci_cd_log",
        sourceRef: "ci-cd://failed-build.log",
      },
    });
  });
});

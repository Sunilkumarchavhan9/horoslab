import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ShellPtyMock = {
  onData: ReturnType<typeof vi.fn>;
  onExit: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  __emitData(chunk: string): void;
  __emitExit(exitCode?: number | null): void;
};

const mocks = vi.hoisted(() => {
  const spawnedPtys: ShellPtyMock[] = [];
  return {
    spawnedPtys,
    fs: {
      appendFile: vi.fn(async () => undefined),
      mkdir: vi.fn(async () => undefined),
      writeFile: vi.fn(async () => undefined),
    },
    spawn: vi.fn(() => {
        const handlers: {
          data?: (chunk: string) => void;
          exit?: (payload: { exitCode: number | null }) => void;
        } = {};

      const pty = {
        onData: vi.fn((handler: (chunk: string) => void) => {
          handlers.data = handler;
          return { dispose: () => undefined };
        }),
        onExit: vi.fn((handler: (payload: { exitCode: number | null }) => void) => {
          handlers.exit = handler;
          return { dispose: () => undefined };
        }),
        write: vi.fn(),
        resize: vi.fn(),
        kill: vi.fn(),
        __emitData(chunk: string) {
          handlers.data?.(chunk);
        },
        __emitExit(exitCode: number | null = 0) {
          handlers.exit?.({ exitCode });
        },
      };

      spawnedPtys.push(pty);
      return pty;
    }),
  };
});

vi.mock("node:fs/promises", () => mocks.fs);
vi.mock("node-pty", () => ({
  spawn: mocks.spawn,
}));

describe("MemoryOSTM shell session manager", () => {
  beforeEach(async () => {
    mocks.spawnedPtys.length = 0;
    mocks.fs.appendFile.mockClear();
    mocks.fs.writeFile.mockClear();
    mocks.fs.mkdir.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    mocks.spawnedPtys.length = 0;
  });

  it("promotes typed PTY input into structured history and truncates output", async () => {
    const { memoryostmShellSessionManager } = await import(
      "../../server/services/memoryostmShellSessionManager"
    );

    const threadId = "thread-typed-history";
    const cwd = "C:/tmp/memoryostm-shell";
    await memoryostmShellSessionManager.openSession(threadId, cwd, { cols: 80, rows: 24 });

    memoryostmShellSessionManager.writeInput(threadId, "ls\r");
    const afterInput = memoryostmShellSessionManager.getSnapshot(threadId);
    expect(afterInput).not.toBeNull();
    expect(afterInput?.entries.some((entry) => entry.kind === "command" && entry.title === "ls")).toBe(true);
    expect(afterInput?.activeCommandId).toBeTruthy();
  });

  it("stores prompt metadata from browser/API submissions", async () => {
    const { memoryostmShellSessionManager } = await import(
      "../../server/services/memoryostmShellSessionManager"
    );

    const threadId = "thread-prompt-metadata";
    const cwd = "C:/tmp/memoryostm-shell";
    await memoryostmShellSessionManager.openSession(threadId, cwd, { cols: 80, rows: 24 });

    await memoryostmShellSessionManager.recordPrompt(threadId, "Investigate the bug", {
      currentLine: "Investigate the bug",
      recentHistory: "pwd | git status",
    });

    const snapshot = memoryostmShellSessionManager.getSnapshot(threadId);
    const promptEntry = snapshot?.entries.find((entry) => entry.kind === "prompt");
    expect(promptEntry?.currentLine).toBe("Investigate the bug");
    expect(promptEntry?.recentHistory).toBe("pwd | git status");
  });

  it("redacts secret-like commands and outputs from structured history", async () => {
    vi.stubEnv("MEMORYOSTM_SHELL_PERSIST_OUTPUT", "1");
    try {
      const { memoryostmShellSessionManager } = await import(
        "../../server/services/memoryostmShellSessionManager"
      );

      const threadId = "thread-redact-secrets";
      const cwd = "C:/tmp/memoryostm-shell";
      await memoryostmShellSessionManager.openSession(threadId, cwd, { cols: 80, rows: 24 });

      memoryostmShellSessionManager.writeInput(threadId, "export TOKEN=supersecret\r");
      const typedSnapshot = memoryostmShellSessionManager.getSnapshot(threadId);
      const typedEntry = typedSnapshot?.entries.find((entry) => entry.kind === "command");
      expect(typedEntry?.title).toContain("[REDACTED]");

      const pty = mocks.spawnedPtys[0];
      expect(pty).toBeTruthy();
      const commandId = typedSnapshot?.activeCommandId;
      expect(commandId).toBeTruthy();

      pty.__emitData(`__MEMORYOSTM_CMD_START__${commandId}\n`);
      pty.__emitData("Authorization: Bearer ghp_supersecrettoken123456789\n");
      pty.__emitData(`__MEMORYOSTM_CMD_EXIT__${commandId}:0\n`);

      const finalSnapshot = memoryostmShellSessionManager.getSnapshot(threadId);
      const commandEntry = finalSnapshot?.entries.find((entry) => entry.kind === "command");
      expect(commandEntry?.output).toContain("[REDACTED]");
      expect(commandEntry?.output).not.toContain("ghp_supersecrettoken123456789");
      expect(commandEntry?.title).toContain("[REDACTED]");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("persists redacted snapshots without leaking pasted secrets", async () => {
    vi.stubEnv("MEMORYOSTM_SHELL_PERSIST_OUTPUT", "1");
    try {
      const { memoryostmShellSessionManager } = await import(
        "../../server/services/memoryostmShellSessionManager"
      );

      const threadId = "thread-persist-redaction";
      const cwd = "C:/tmp/memoryostm-shell";
      await memoryostmShellSessionManager.openSession(threadId, cwd, { cols: 80, rows: 24 });
      const pty = mocks.spawnedPtys[0];
      expect(pty).toBeTruthy();

      await memoryostmShellSessionManager.runCommand(
        threadId,
        "export TOKEN=supersecret\nexport PASSWORD=anothersecret",
      );
      const startedSnapshot = memoryostmShellSessionManager.getSnapshot(threadId);
      const commandId = startedSnapshot?.activeCommandId;
      expect(commandId).toBeTruthy();

      pty.__emitData(`__MEMORYOSTM_CMD_START__${commandId}\n`);
      pty.__emitData("Bearer ghp_supersecrettoken123456789\n");
      pty.__emitData(`__MEMORYOSTM_CMD_EXIT__${commandId}:0\n`);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const snapshotWrites = (mocks.fs.writeFile.mock.calls as unknown as Array<[string, string, ...unknown[]]>).filter(
        ([filePath]) => String(filePath).endsWith("latest-shell-state.json"),
      );
      expect(snapshotWrites.length).toBeGreaterThan(0);

      const persistedBody = String(snapshotWrites.at(-1)?.[1] ?? "");
      expect(persistedBody).toContain("[REDACTED]");
      expect(persistedBody).not.toContain("supersecret");
      expect(persistedBody).not.toContain("anothersecret");
      expect(persistedBody).not.toContain("ghp_supersecrettoken123456789");
      expect(persistedBody).not.toContain("TOKEN=supersecret");
      expect(persistedBody).not.toContain("PASSWORD=anothersecret");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("truncates wrapped command output before it overflows the shell history", async () => {
    const { memoryostmShellSessionManager } = await import(
      "../../server/services/memoryostmShellSessionManager"
    );

    const threadId = "thread-truncate-output";
    const cwd = "C:/tmp/memoryostm-shell";
    await memoryostmShellSessionManager.openSession(threadId, cwd, { cols: 80, rows: 24 });
    const pty = mocks.spawnedPtys[0];
    expect(pty).toBeTruthy();

    await memoryostmShellSessionManager.runCommand(threadId, "echo hello");
    const startedSnapshot = memoryostmShellSessionManager.getSnapshot(threadId);
    const commandId = startedSnapshot?.activeCommandId;
    expect(commandId).toBeTruthy();

    pty.__emitData(`__MEMORYOSTM_CMD_START__${commandId}\n`);
    pty.__emitData(`${"x".repeat(70_000)}\n`);
    pty.__emitData(`__MEMORYOSTM_CMD_EXIT__${commandId}:0\n`);

    const finalSnapshot = memoryostmShellSessionManager.getSnapshot(threadId);
    const commandEntry = finalSnapshot?.entries.find((entry) => entry.kind === "command");
    const outputText =
      typeof commandEntry?.output === "string"
        ? commandEntry.output
        : JSON.stringify(commandEntry?.output ?? "");

    expect(outputText.length).toBeGreaterThan(0);
    expect(outputText.length).toBeLessThanOrEqual(64_000);
    expect(finalSnapshot?.activeCommandId).toBeNull();
    expect(finalSnapshot?.state).toBe("waiting");
  });
});

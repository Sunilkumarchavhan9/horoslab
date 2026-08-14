import { EventEmitter } from "node:events";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { spawn, type IPty } from "node-pty";
import { redactSensitiveText } from "./secret-policy";

export type MemoryOSTMShellSessionState =
  | "starting"
  | "working"
  | "waiting"
  | "error"
  | "closed";

export type MemoryOSTMShellSessionEntryKind =
  | "command"
  | "runtime"
  | "prompt"
  | "session";

export type MemoryOSTMShellSessionEntry = {
  id: string;
  at: string;
  title: string;
  detail: string | null;
  output: string | null;
  kind: MemoryOSTMShellSessionEntryKind;
  state: MemoryOSTMShellSessionState;
  exitCode?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  source: "browser" | "hook";
  currentLine?: string | null;
  recentHistory?: string | null;
};

export type MemoryOSTMShellSessionSnapshot = {
  threadId: string;
  sessionId: string;
  state: MemoryOSTMShellSessionState;
  shell: "powershell" | "bash";
  cwd: string;
  promptLabel: string;
  summary: string | null;
  lastUpdatedAt: string | null;
  activeCommandId: string | null;
  cols: number;
  rows: number;
  entries: MemoryOSTMShellSessionEntry[];
};

type BrowserTicket = {
  threadId: string;
  expiresAt: number;
};

type BrowserShellSession = {
  snapshot: MemoryOSTMShellSessionSnapshot;
  pty: IPty;
  parseBuffer: string;
  activeCommandId: string | null;
  activeCommandMode: "wrapped" | "typed" | null;
  activeOutputs: Map<string, string>;
  typedLineBuffer: string;
  typedLineDirty: boolean;
  lastTouchedAt: number;
};

const ENTRY_LIMIT = 250;
const TICKET_TTL_MS = 10 * 60 * 1000;
const COMMAND_START_MARKER = "__MEMORYOSTM_CMD_START__";
const COMMAND_EXIT_MARKER = "__MEMORYOSTM_CMD_EXIT__";
const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 30;
const SNAPSHOT_PERSIST_DEBOUNCE_MS = 250;
const DEFAULT_IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const IDLE_SWEEP_INTERVAL_MS = 60 * 1000;
const PERSIST_OUTPUT_ENABLED = process.env.MEMORYOSTM_SHELL_PERSIST_OUTPUT === "1";
const MAX_TYPED_INPUT_BYTES = 8_000;
const MAX_COMMAND_OUTPUT_CHARS = 64_000;
const MAX_TERMINAL_INPUT_CHARS = 8_000;

class MemoryOSTMShellSessionManager extends EventEmitter {
  private readonly sessions = new Map<string, BrowserShellSession>();

  private readonly tickets = new Map<string, BrowserTicket>();

  private readonly persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private readonly idleTimeoutMs = this.resolveIdleTimeoutMs();

  constructor() {
    super();
    const interval = setInterval(() => {
      this.sweepIdleSessions();
    }, IDLE_SWEEP_INTERVAL_MS);
    interval.unref?.();
  }

  async openSession(
    threadId: string,
    cwd: string,
    dimensions?: { cols?: number; rows?: number },
  ): Promise<MemoryOSTMShellSessionSnapshot> {
    const existing = this.sessions.get(threadId);
    if (existing) {
      if (dimensions?.cols && dimensions?.rows) {
        this.resizeTerminal(threadId, dimensions.cols, dimensions.rows);
      }
      return this.cloneSnapshot(existing.snapshot);
    }

    const shell = process.platform === "win32" ? "powershell" : "bash";
    const cols = this.normalizeDimension(dimensions?.cols, DEFAULT_COLS);
    const rows = this.normalizeDimension(dimensions?.rows, DEFAULT_ROWS);
    const sessionId = crypto.randomUUID();
    const promptLabel =
      shell === "powershell"
        ? `PS ${cwd}>`
        : `ubuntu@memoryostm-shell:${this.formatUnixPromptPath(cwd)}$`;

    const snapshot: MemoryOSTMShellSessionSnapshot = {
      threadId,
      sessionId,
      state: "starting",
      shell,
      cwd,
      promptLabel,
      summary: "Starting shell session",
      lastUpdatedAt: new Date().toISOString(),
      activeCommandId: null,
      cols,
      rows,
      entries: [],
    };

    const pty = spawn(
      shell === "powershell" ? "powershell.exe" : "bash",
      shell === "powershell" ? ["-NoLogo", "-NoProfile"] : ["--noprofile", "--norc"],
      {
        name: shell === "powershell" ? "xterm-256color" : "xterm-256color",
        cols,
        rows,
        cwd,
        env: this.buildShellEnvironment(shell),
      },
    );

    const session: BrowserShellSession = {
      snapshot,
      pty,
      parseBuffer: "",
      activeCommandId: null,
      activeCommandMode: null,
      activeOutputs: new Map<string, string>(),
      typedLineBuffer: "",
      typedLineDirty: false,
      lastTouchedAt: Date.now(),
    };

    this.sessions.set(threadId, session);
    this.pushEntry(session, {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      title: "MemoryOSTM shell session started",
      detail: cwd,
      output: null,
      kind: "session",
      state: "working",
      source: "browser",
    });

    pty.onData((chunk) => {
      this.consumeOutput(session, chunk);
    });

    this.initializePrompt(session);

    pty.onExit(({ exitCode }) => {
      session.snapshot.state = "closed";
      session.snapshot.activeCommandId = null;
      session.activeCommandId = null;
      session.activeCommandMode = null;
      session.snapshot.summary =
        exitCode == null ? "Shell closed" : `Shell closed with exit ${exitCode}`;
      session.snapshot.lastUpdatedAt = new Date().toISOString();
      this.pushEntry(session, {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        title: "MemoryOSTM shell session ended",
        detail: exitCode == null ? "Shell closed" : `Exit ${exitCode}`,
        output: null,
        kind: "session",
        state: "waiting",
        exitCode,
        source: "browser",
      });
      this.clearPersistTimer(threadId);
      this.sessions.delete(threadId);
    });

    session.snapshot.state = "waiting";
    session.snapshot.summary = "Shell session ready";
    session.snapshot.lastUpdatedAt = new Date().toISOString();
    this.emitSnapshot(session);
    await this.persistSnapshot(session.snapshot);
    return this.cloneSnapshot(session.snapshot);
  }

  async recordPrompt(
    threadId: string,
    prompt: string,
    metadata?: { currentLine?: string | null; recentHistory?: string | null },
  ): Promise<MemoryOSTMShellSessionSnapshot> {
    const session = this.sessions.get(threadId);
    if (!session) {
      throw new Error("Shell session is not open.");
    }

    const currentLine = this.normalizeOptionalText(metadata?.currentLine) ?? prompt;
    const recentHistory = this.normalizeOptionalText(metadata?.recentHistory);
    this.pushEntry(session, {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      title: prompt,
      detail: "Prompt submitted",
      output: null,
      kind: "prompt",
      state: "working",
      source: "browser",
      currentLine,
      recentHistory,
    });
    this.touchSession(session);
    session.snapshot.state = "working";
    session.snapshot.summary = "Prompt submitted to MemoryOSTM shell";
    session.snapshot.lastUpdatedAt = new Date().toISOString();
    this.emitSnapshot(session);
    await this.persistSnapshot(session.snapshot);
    return this.cloneSnapshot(session.snapshot);
  }

  async runCommand(threadId: string, command: string): Promise<MemoryOSTMShellSessionSnapshot> {
    const session = this.sessions.get(threadId);
    if (!session) {
      throw new Error("Shell session is not open.");
    }

    const commandId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const entry: MemoryOSTMShellSessionEntry = {
      id: commandId,
      at: startedAt,
      title: command,
      detail: "Command running",
      output: null,
      kind: "command",
      state: "working",
      startedAt,
      completedAt: null,
      source: "browser",
    };

    session.activeCommandId = commandId;
    session.activeCommandMode = "wrapped";
    session.activeOutputs.set(commandId, "");
    this.touchSession(session);
    session.snapshot.activeCommandId = commandId;
    session.snapshot.state = "working";
    session.snapshot.summary = `Running ${command}`;
    session.snapshot.lastUpdatedAt = startedAt;
    this.pushEntry(session, entry);
    session.pty.write(this.wrapCommand(session.snapshot.shell, commandId, command));
    this.emitSnapshot(session);
    await this.persistSnapshot(session.snapshot);
    return this.cloneSnapshot(session.snapshot);
  }

  writeInput(threadId: string, input: string): void {
    const session = this.sessions.get(threadId);
    if (!session || !input) return;
    if (input.length > MAX_TERMINAL_INPUT_CHARS) return;
    this.touchSession(session);
    this.trackTypedInput(session, input);
    session.snapshot.lastUpdatedAt = new Date().toISOString();
    session.snapshot.state = "working";
    session.pty.write(input);
    this.emitSnapshot(session);
    this.scheduleSnapshotPersist(session.snapshot);
  }

  resizeTerminal(threadId: string, cols: number, rows: number): void {
    const session = this.sessions.get(threadId);
    if (!session) return;
    this.touchSession(session);
    const nextCols = this.normalizeDimension(cols, session.snapshot.cols);
    const nextRows = this.normalizeDimension(rows, session.snapshot.rows);
    session.snapshot.cols = nextCols;
    session.snapshot.rows = nextRows;
    session.pty.resize(nextCols, nextRows);
    this.emitSnapshot(session);
    this.scheduleSnapshotPersist(session.snapshot);
  }

  getSnapshot(threadId: string): MemoryOSTMShellSessionSnapshot | null {
    const session = this.sessions.get(threadId);
    if (!session) return null;
    return this.cloneSnapshot(session.snapshot);
  }

  closeSession(threadId: string, reason = "Shell session closed"): boolean {
    const session = this.sessions.get(threadId);
    if (!session) return false;
    this.touchSession(session);
    session.snapshot.state = "closed";
    session.snapshot.activeCommandId = null;
    session.snapshot.summary = reason;
    session.snapshot.lastUpdatedAt = new Date().toISOString();
    this.pushEntry(session, {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      title: "MemoryOSTM shell session closed",
      detail: reason,
      output: null,
      kind: "session",
      state: "waiting",
      source: "browser",
    });
    this.clearPersistTimer(threadId);
    try {
      session.pty.kill();
    } catch {
      this.sessions.delete(threadId);
    }
    return true;
  }

  createTicket(threadId: string): string {
    const ticket = crypto.randomBytes(24).toString("hex");
    this.tickets.set(ticket, {
      threadId,
      expiresAt: Date.now() + TICKET_TTL_MS,
    });
    return ticket;
  }

  consumeTicket(ticket: string): string | null {
    const record = this.tickets.get(ticket);
    if (!record) return null;
    this.tickets.delete(ticket);
    if (record.expiresAt < Date.now()) return null;
    return record.threadId;
  }

  subscribe(
    threadId: string,
    listener: (snapshot: MemoryOSTMShellSessionSnapshot) => void,
  ): () => void {
    const channel = `snapshot:${threadId}`;
    this.on(channel, listener);
    const current = this.getSnapshot(threadId);
    if (current) {
      listener(current);
    }
    return () => {
      this.off(channel, listener);
    };
  }

  subscribeTerminalOutput(
    threadId: string,
    listener: (chunk: string) => void,
  ): () => void {
    const channel = `terminal:${threadId}`;
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }

  private wrapCommand(
    shell: "powershell" | "bash",
    commandId: string,
    command: string,
  ): string {
    if (shell === "powershell") {
      return [
        `Write-Output '${COMMAND_START_MARKER}${commandId}'`,
        "$__memoryostm_exit = 0",
        "try {",
        "  Invoke-Expression @'",
        command,
        "'@",
        "  if ($LASTEXITCODE -ne $null) { $__memoryostm_exit = $LASTEXITCODE }",
        "} catch {",
        "  Write-Error $_",
        "  $__memoryostm_exit = 1",
        "}",
        `Write-Output "\`n${COMMAND_EXIT_MARKER}${commandId}:$($__memoryostm_exit)"`,
        "",
      ].join("\r\n");
    }

    const encoded = Buffer.from(command, "utf8").toString("base64");
    return [
      `printf '${COMMAND_START_MARKER}${commandId}\\n'`,
      `printf '%s' '${encoded}' | base64 --decode | bash`,
      "__memoryostm_exit=$?",
      `printf '\\n${COMMAND_EXIT_MARKER}${commandId}:%s\\n' \"$__memoryostm_exit\"`,
      "",
    ].join("\n");
  }

  private consumeOutput(session: BrowserShellSession, chunk: string): void {
    this.touchSession(session);
    session.parseBuffer += chunk;

    while (session.parseBuffer.length > 0) {
      const startIndex = session.parseBuffer.indexOf(COMMAND_START_MARKER);
      const exitIndex = session.parseBuffer.indexOf(COMMAND_EXIT_MARKER);
      const markerIndexes = [startIndex, exitIndex].filter((index) => index >= 0);
      const nextMarkerIndex =
        markerIndexes.length > 0 ? Math.min(...markerIndexes) : -1;

      if (nextMarkerIndex < 0) {
        this.captureVisibleOutput(session, session.parseBuffer);
        session.parseBuffer = "";
        break;
      }

      if (nextMarkerIndex > 0) {
        const visible = session.parseBuffer.slice(0, nextMarkerIndex);
        this.captureVisibleOutput(session, visible);
        session.parseBuffer = session.parseBuffer.slice(nextMarkerIndex);
      }

      if (session.parseBuffer.startsWith(COMMAND_START_MARKER)) {
        const lineEnd = this.findLineEnd(session.parseBuffer);
        if (lineEnd < 0) break;
        const markerLine = session.parseBuffer.slice(0, lineEnd);
        const commandId = markerLine.slice(COMMAND_START_MARKER.length).trim();
        session.activeCommandId = commandId;
        session.snapshot.activeCommandId = commandId;
        session.snapshot.state = "working";
        session.parseBuffer = this.consumeLine(session.parseBuffer, lineEnd);
        continue;
      }

      if (session.parseBuffer.startsWith(COMMAND_EXIT_MARKER)) {
        const lineEnd = this.findLineEnd(session.parseBuffer);
        if (lineEnd < 0) break;
        const markerLine = session.parseBuffer.slice(0, lineEnd);
        const payload = markerLine.slice(COMMAND_EXIT_MARKER.length);
        const [commandId, exitCodeText] = payload.split(":");
        this.finishCommand(session, commandId?.trim() ?? "", Number(exitCodeText));
        session.parseBuffer = this.consumeLine(session.parseBuffer, lineEnd);
        continue;
      }
    }

    session.snapshot.lastUpdatedAt = new Date().toISOString();
    this.emitSnapshot(session);
    this.scheduleSnapshotPersist(session.snapshot);
  }

  private captureVisibleOutput(session: BrowserShellSession, value: string): void {
    if (!value) return;
    const normalized = value.replace(/\r/g, "");
    this.emitTerminalOutput(session.snapshot.threadId, value);
    const promptToken = `${session.snapshot.promptLabel} `;
    let cursor = 0;

    while (cursor < normalized.length) {
      const promptIndex = this.findPromptBoundary(normalized, promptToken, cursor);
      const segment =
        promptIndex < 0 ? normalized.slice(cursor) : normalized.slice(cursor, promptIndex);

      if (segment) {
        if (session.activeCommandId) {
          this.appendActiveOutput(session, segment);
        } else {
          const line = segment.trim();
          if (line) {
            this.pushEntry(session, {
              id: crypto.randomUUID(),
              at: new Date().toISOString(),
              title: line,
              detail: "runtime output",
              output: null,
              kind: "runtime",
              state: session.snapshot.state === "error" ? "error" : "waiting",
              source: "browser",
            });
          }
        }
      }

      if (promptIndex < 0) {
        break;
      }

      this.handlePromptBoundary(session);
      cursor = promptIndex + promptToken.length;
    }
  }

  private appendActiveOutput(session: BrowserShellSession, value: string): void {
    const commandId = session.activeCommandId;
    if (!commandId) return;
    const current = session.activeOutputs.get(commandId) ?? "";
    const next = `${current}${value}`.slice(-MAX_COMMAND_OUTPUT_CHARS);
    session.activeOutputs.set(commandId, next);
    const entry = session.snapshot.entries.find((item) => item.id === commandId);
    if (!entry) return;
    entry.output = next.trimEnd() || null;
    entry.detail = "Streaming output";
    entry.state = "working";
  }

  private finishCommand(
    session: BrowserShellSession,
    commandId: string,
    exitCode: number | null,
  ): void {
    const entry = session.snapshot.entries.find((item) => item.id === commandId);
    const completedAt = new Date().toISOString();
    const commandMode = session.activeCommandMode;
    const output = session.activeOutputs.get(commandId) ?? entry?.output ?? null;
    session.activeOutputs.delete(commandId);
    session.activeCommandId = null;
    session.activeCommandMode = null;
    session.snapshot.activeCommandId = null;
    session.snapshot.state = exitCode == null || exitCode === 0 ? "waiting" : "error";
    session.snapshot.summary =
      exitCode == null
        ? "Command completed"
        : exitCode === 0
          ? "Command completed"
          : `Command failed (${exitCode})`;
    session.snapshot.lastUpdatedAt = completedAt;

    if (!entry) return;
    const normalizedOutput =
      commandMode === "typed" ? this.stripEchoedInput(entry.title, output) : output;
    entry.output = normalizedOutput ? normalizedOutput.trimEnd() : null;
    entry.detail =
      exitCode == null
        ? "Command completed"
        : exitCode === 0
          ? "Command completed"
          : `Command failed (${exitCode})`;
    entry.exitCode = exitCode != null && Number.isFinite(exitCode) ? exitCode : null;
    entry.state = exitCode == null || exitCode === 0 ? "waiting" : "error";
    entry.completedAt = completedAt;
  }

  private initializePrompt(session: BrowserShellSession): void {
    if (session.snapshot.shell === "powershell") {
      session.pty.write(
        [
          `function global:prompt { "${this.escapePowerShellPromptLabel(session.snapshot.promptLabel)} " }`,
          "Clear-Host",
          "",
        ].join("\r\n"),
      );
      return;
    }

    session.pty.write(
      [
        `export PS1='${this.escapeBashPromptLabel(session.snapshot.promptLabel)} '`,
        "clear",
        "",
      ].join("\n"),
    );
  }

  private escapePowerShellPromptLabel(label: string): string {
    return label.replace(/`/g, "``").replace(/"/g, '`"');
  }

  private escapeBashPromptLabel(label: string): string {
    return label.replace(/'/g, `'\\''`);
  }

  private trackTypedInput(session: BrowserShellSession, input: string): void {
    if (input.length > MAX_TYPED_INPUT_BYTES) {
      session.typedLineBuffer = "";
      session.typedLineDirty = true;
      return;
    }

    let index = 0;
    while (index < input.length) {
      const char = input[index]!;

      if (char === "\u0003") {
        session.typedLineBuffer = "";
        session.typedLineDirty = false;
        if (session.activeCommandMode === "typed" && session.activeCommandId) {
          this.finishCommand(session, session.activeCommandId, 130);
        }
        index += 1;
        continue;
      }

      if (char === "\r" || char === "\n") {
        this.flushTypedCommand(session);
        index += 1;
        continue;
      }

      if (char === "\b" || char === "\u007f") {
        session.typedLineBuffer = session.typedLineBuffer.slice(0, -1);
        index += 1;
        continue;
      }

      if (char === "\t" || char === "\u001b") {
        session.typedLineDirty = true;
        if (char === "\u001b") {
          const nextBracket = input[index + 1];
          if (nextBracket === "[") {
            index += 3;
            continue;
          }
        }
        index += 1;
        continue;
      }

      if (char >= " " && char !== "\u007f") {
        session.typedLineBuffer += char;
      } else {
        session.typedLineDirty = true;
      }
      index += 1;
    }
  }

  private flushTypedCommand(session: BrowserShellSession): void {
    const command = session.typedLineBuffer.trim();
    const dirty = session.typedLineDirty;
    session.typedLineBuffer = "";
    session.typedLineDirty = false;
    if (!command || dirty || session.activeCommandId) return;

    const startedAt = new Date().toISOString();
    const commandId = crypto.randomUUID();
    session.activeCommandId = commandId;
    session.activeCommandMode = "typed";
    session.activeOutputs.set(commandId, "");
    session.snapshot.activeCommandId = commandId;
    session.snapshot.state = "working";
    session.snapshot.summary = `Running ${command}`;
    session.snapshot.lastUpdatedAt = startedAt;
    this.pushEntry(session, {
      id: commandId,
      at: startedAt,
      title: command,
      detail: "Command running",
      output: null,
      kind: "command",
      state: "working",
      startedAt,
      completedAt: null,
      source: "browser",
    });
  }

  private handlePromptBoundary(session: BrowserShellSession): void {
    if (session.activeCommandMode === "typed" && session.activeCommandId) {
      this.finishCommand(session, session.activeCommandId, null);
      return;
    }
    session.snapshot.state = "waiting";
    session.snapshot.summary = "Shell session ready";
    session.snapshot.lastUpdatedAt = new Date().toISOString();
  }

  private findPromptBoundary(value: string, promptToken: string, fromIndex: number): number {
    let nextIndex = value.indexOf(promptToken, fromIndex);
    while (nextIndex >= 0) {
      if (nextIndex === 0 || value[nextIndex - 1] === "\n") {
        return nextIndex;
      }
      nextIndex = value.indexOf(promptToken, nextIndex + promptToken.length);
    }
    return -1;
  }

  private stripEchoedInput(commandTitle: string, output: string | null): string | null {
    if (!output) return output;
    const normalized = output.replace(/\r/g, "");
    const [firstLine, ...rest] = normalized.split("\n");
    if ((firstLine ?? "").trim() !== commandTitle.trim()) {
      return output;
    }
    const next = rest.join("\n");
    return next || null;
  }

  private pushEntry(session: BrowserShellSession, entry: MemoryOSTMShellSessionEntry): void {
    session.snapshot.entries.push(entry);
    if (session.snapshot.entries.length > ENTRY_LIMIT) {
      session.snapshot.entries = session.snapshot.entries.slice(-ENTRY_LIMIT);
    }
    session.snapshot.lastUpdatedAt = entry.at;
    this.safePersistEntry(session.snapshot, entry);
    this.emitSnapshot(session);
  }

  private emitSnapshot(session: BrowserShellSession): void {
    this.emit(`snapshot:${session.snapshot.threadId}`, this.cloneSnapshot(session.snapshot));
  }

  private emitTerminalOutput(threadId: string, chunk: string): void {
    this.emit(`terminal:${threadId}`, chunk);
  }

  private cloneSnapshot(
    snapshot: MemoryOSTMShellSessionSnapshot,
  ): MemoryOSTMShellSessionSnapshot {
    const sanitized = this.sanitizeSnapshot(snapshot);
    return {
      ...sanitized,
      entries: sanitized.entries.map((entry) => ({ ...entry })),
    };
  }

  private sanitizeSnapshot(
    snapshot: MemoryOSTMShellSessionSnapshot,
  ): MemoryOSTMShellSessionSnapshot {
    return {
      ...snapshot,
      summary: redactSensitiveText(snapshot.summary),
      entries: snapshot.entries.map((entry) => this.sanitizeEntry(entry)),
    };
  }

  private sanitizeEntry(entry: MemoryOSTMShellSessionEntry): MemoryOSTMShellSessionEntry {
    return {
      ...entry,
      title: redactSensitiveText(entry.title) ?? entry.title,
      detail: redactSensitiveText(entry.detail),
      output: PERSIST_OUTPUT_ENABLED ? redactSensitiveText(entry.output) : null,
    };
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private safePersistEntry(
    snapshot: MemoryOSTMShellSessionSnapshot,
    entry: MemoryOSTMShellSessionEntry,
  ): void {
    void this.persistEntry(snapshot, entry).catch(() => undefined);
  }

  private scheduleSnapshotPersist(snapshot: MemoryOSTMShellSessionSnapshot): void {
    this.clearPersistTimer(snapshot.threadId);
    const timer = setTimeout(() => {
      this.persistTimers.delete(snapshot.threadId);
      void this.persistSnapshot(snapshot).catch(() => undefined);
    }, SNAPSHOT_PERSIST_DEBOUNCE_MS);
    timer.unref?.();
    this.persistTimers.set(snapshot.threadId, timer);
  }

  private clearPersistTimer(threadId: string): void {
    const timer = this.persistTimers.get(threadId);
    if (!timer) return;
    clearTimeout(timer);
    this.persistTimers.delete(threadId);
  }

  private async persistEntry(
    snapshot: MemoryOSTMShellSessionSnapshot,
    entry: MemoryOSTMShellSessionEntry,
  ): Promise<void> {
    const runtimeDir = await this.ensureRuntimeDir(snapshot.cwd);
    const logPath = path.join(runtimeDir, "cli-events.jsonl");
    const sanitizedEntry = this.sanitizeEntry(entry);
    const payload = {
      id: sanitizedEntry.id,
      at: sanitizedEntry.at,
      hookEventName:
        sanitizedEntry.kind === "prompt"
          ? "UserPromptSubmit"
          : sanitizedEntry.kind === "session"
            ? "SessionStart"
            : sanitizedEntry.kind === "command"
              ? "PostToolUse"
              : "RuntimeUpdate",
      toolName: sanitizedEntry.kind === "command" ? "memoryostm-shell" : null,
      title: sanitizedEntry.title,
      detail: sanitizedEntry.detail,
      output: sanitizedEntry.output,
      state: sanitizedEntry.state === "closed" ? "waiting" : sanitizedEntry.state,
      entryKind: sanitizedEntry.kind,
      source: "memoryostm-shell-browser",
    };
    await appendFile(logPath, `${JSON.stringify(payload)}\n`, "utf8");
    await this.persistSnapshot(snapshot);
  }

  private async persistSnapshot(
    snapshot: MemoryOSTMShellSessionSnapshot,
  ): Promise<void> {
    const runtimeDir = await this.ensureRuntimeDir(snapshot.cwd);
    const snapshotPath = path.join(runtimeDir, "latest-shell-state.json");
    await writeFile(
      snapshotPath,
      JSON.stringify(
        {
          updatedAt: snapshot.lastUpdatedAt,
          state: snapshot.state,
          lastEvent: this.sanitizeSnapshot(snapshot).entries.at(-1) ?? null,
          shellSession: this.sanitizeSnapshot(snapshot),
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  private async ensureRuntimeDir(cwd: string): Promise<string> {
    const runtimeDir = path.join(cwd, ".memoryostm", "runtime");
    await mkdir(runtimeDir, { recursive: true });
    return runtimeDir;
  }

  private formatUnixPromptPath(cwd: string): string {
    const home = process.env.HOME?.replace(/\\/g, "/");
    const normalized = cwd.replace(/\\/g, "/");
    if (home && normalized.startsWith(home)) {
      return `~${normalized.slice(home.length)}`;
    }
    return normalized;
  }

  private normalizeDimension(value: number | undefined, fallback: number): number {
    if (!value || !Number.isFinite(value)) return fallback;
    return Math.max(20, Math.floor(value));
  }

  private resolveIdleTimeoutMs(): number {
    const configured = Number(process.env.MEMORYOSTM_SHELL_IDLE_TIMEOUT_MS);
    if (Number.isFinite(configured) && configured >= 60_000) {
      return configured;
    }
    return DEFAULT_IDLE_TIMEOUT_MS;
  }

  private buildShellEnvironment(shell: "powershell" | "bash"): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {};
    const copyKeys = [
      "PATH",
      "Path",
      "HOME",
      "USERPROFILE",
      "TMP",
      "TEMP",
      "SystemRoot",
      "ComSpec",
      "PSModulePath",
      "LANG",
      "LC_ALL",
    ];

    for (const key of copyKeys) {
      const value = process.env[key];
      if (typeof value === "string" && value.length > 0) {
        env[key] = value;
      }
    }

    env.TERM = "xterm-256color";
    env.COLORTERM = "truecolor";
    if (shell === "powershell" && !env.ComSpec) {
      env.ComSpec = process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";
    }

    return env;
  }

  private touchSession(session: BrowserShellSession): void {
    session.lastTouchedAt = Date.now();
  }

  private sweepIdleSessions(): void {
    const now = Date.now();
    for (const [threadId, session] of this.sessions.entries()) {
      if (now - session.lastTouchedAt < this.idleTimeoutMs) continue;
      this.closeSession(threadId, "Shell session closed after inactivity.");
    }
  }

  private findLineEnd(value: string): number {
    const newlineIndex = value.indexOf("\n");
    return newlineIndex;
  }

  private consumeLine(value: string, lineEnd: number): string {
    return value.slice(lineEnd + 1);
  }
}

export const memoryostmShellSessionManager = new MemoryOSTMShellSessionManager();

import { spawn } from "node:child_process";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function resolveRoot() {
  return process.env.MEMORYOSTM_SHELL_PROJECT_ROOT
    ? path.resolve(process.env.MEMORYOSTM_SHELL_PROJECT_ROOT)
    : process.cwd();
}

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureRuntimeDir(root) {
  const runtimeDir = path.join(root, ".memoryostm", "runtime");
  await mkdir(runtimeDir, { recursive: true });
  return runtimeDir;
}

async function writeEntry(root, entry) {
  const runtimeDir = await ensureRuntimeDir(root);
  const logPath = path.join(runtimeDir, "cli-events.jsonl");
  const snapshotPath = path.join(runtimeDir, "latest-shell-state.json");
  await appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
  await writeFile(
    snapshotPath,
    JSON.stringify(
      {
        updatedAt: entry.at,
        state: entry.state,
        lastEvent: entry,
      },
      null,
      2,
    ),
    "utf8",
  );
}

function createEntry(overrides = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    version: 1,
    at: new Date().toISOString(),
    cwd: resolveRoot(),
    hookEventName: "UserPromptSubmit",
    toolName: null,
    command: null,
    output: null,
    prompt: null,
    source: "memoryostm-shell",
    success: null,
    currentLine: null,
    recentHistory: null,
    entryKind: "runtime",
    title: "MemoryOSTM shell event",
    detail: null,
    state: "waiting",
    ...overrides,
  };
}

async function runPrompt(root, promptText) {
  const currentLine =
    normalizeText(process.env.MEMORYOSTM_SHELL_CURRENT_LINE) ?? promptText;
  const recentHistory = normalizeText(process.env.MEMORYOSTM_SHELL_RECENT_HISTORY);
  const sessionStart = createEntry({
    hookEventName: "SessionStart",
    entryKind: "session",
    title: "MemoryOSTM shell session started",
    detail: root,
    state: "working",
  });
  const promptEntry = createEntry({
    hookEventName: "UserPromptSubmit",
    entryKind: "prompt",
    title: promptText,
    prompt: promptText,
    detail: "Prompt submitted",
    state: "working",
    currentLine,
    recentHistory,
  });
  await writeEntry(root, sessionStart);
  await writeEntry(root, promptEntry);
  process.stdout.write(`MemoryOSTM captured prompt: ${promptText}\n`);
}

async function runExec(root, commandText) {
  const preEntry = createEntry({
    hookEventName: "PreToolUse",
    toolName: "shell.exec",
    command: commandText,
    entryKind: "runtime",
    title: `Running ${commandText}`,
    detail: "Command pending",
    state: "working",
  });
  await writeEntry(root, preEntry);

  await new Promise((resolve) => {
    const child = spawn(commandText, {
      cwd: root,
      env: process.env,
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("close", async (code) => {
      const postEntry = createEntry({
        hookEventName: "PostToolUse",
        toolName: "shell.exec",
        command: commandText,
        output: output.trim() || null,
        success: code === 0,
        entryKind: "command",
        title: commandText,
        detail: code === 0 ? "Command completed" : `Command failed (${code ?? "unknown"})`,
        state: "waiting",
      });
      await writeEntry(root, postEntry);
      resolve(undefined);
    });
  });
}

async function main() {
  const root = resolveRoot();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    process.stdout.write(
      "Usage:\n  memoryostm-shell prompt \"describe task\"\n  memoryostm-shell exec \"npm test\"\n",
    );
    return;
  }

  const mode = args[0];
  const payload = args.slice(1).join(" ").trim();

  if (mode === "prompt") {
    if (!payload) {
      throw new Error("Prompt text is required.");
    }
    await runPrompt(root, payload);
    return;
  }

  if (mode === "exec") {
    if (!payload) {
      throw new Error("Command text is required.");
    }
    await runExec(root, payload);
    return;
  }

  await runPrompt(root, args.join(" "));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

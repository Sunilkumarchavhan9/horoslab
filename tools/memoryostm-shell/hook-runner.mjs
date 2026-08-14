import { mkdir, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

function readPayloadFromEnv() {
  const hookEventName = normalizeText(process.env.MEMORYOSTM_SHELL_HOOK_EVENT_NAME);
  if (!hookEventName) return null;

  const toolName = normalizeText(process.env.MEMORYOSTM_SHELL_TOOL_NAME);
  const command = normalizeText(process.env.MEMORYOSTM_SHELL_COMMAND);
  const prompt = normalizeText(process.env.MEMORYOSTM_SHELL_PROMPT);
  const output = normalizeText(process.env.MEMORYOSTM_SHELL_OUTPUT);
  const source = normalizeText(process.env.MEMORYOSTM_SHELL_SOURCE);
  const currentLine = normalizeText(process.env.MEMORYOSTM_SHELL_CURRENT_LINE);
  const recentHistory = normalizeText(process.env.MEMORYOSTM_SHELL_RECENT_HISTORY);
  const successRaw = process.env.MEMORYOSTM_SHELL_SUCCESS;
  const exitCodeRaw = process.env.MEMORYOSTM_SHELL_EXIT_CODE;

  return {
    hook_event_name: hookEventName,
    tool_name: toolName,
    tool_input: command ? { command } : {},
    tool_response: {
      output,
      success:
        successRaw == null
          ? null
          : successRaw === "1" || successRaw.toLowerCase() === "true",
      exit_code:
        exitCodeRaw == null || exitCodeRaw.trim() === ""
          ? null
          : Number(exitCodeRaw),
    },
    prompt,
    source,
    current_line: currentLine,
    recent_history: recentHistory,
  };
}

function safeJsonParse(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function rootDir() {
  return process.env.DEVIN_PROJECT_DIR
    ? path.resolve(process.env.DEVIN_PROJECT_DIR)
    : process.cwd();
}

function detectShellCommand(payload) {
  const toolInput = payload?.tool_input ?? {};
  return normalizeText(
    toolInput.command ??
      toolInput.cmd ??
      toolInput.script ??
      toolInput.input ??
      toolInput.text ??
      null,
  );
}

function detectToolOutput(payload) {
  const response = payload?.tool_response ?? {};
  return normalizeText(response.output ?? response.stdout ?? response.result ?? response.error ?? null);
}

function buildEntry(payload, cwd) {
  const hookEventName = normalizeText(payload?.hook_event_name) ?? "Unknown";
  const toolName = normalizeText(payload?.tool_name);
  const command = detectShellCommand(payload);
  const output = detectToolOutput(payload);
  const prompt = normalizeText(payload?.prompt);
  const source = normalizeText(payload?.source);
  const currentLine = normalizeText(payload?.current_line);
  const recentHistory = normalizeText(payload?.recent_history);
  const success =
    typeof payload?.tool_response?.success === "boolean" ? payload.tool_response.success : null;

  let entryKind = "runtime";
  let title = hookEventName;
  let detail = toolName;
  let state = "waiting";

  if (hookEventName === "PreToolUse" && command) {
    entryKind = "runtime";
    title = `Running ${command}`;
    detail = toolName ? `${toolName} pending` : "Command pending";
    state = "working";
  } else if (hookEventName === "PostToolUse" && command) {
    entryKind = "command";
    title = command;
    detail = success === false ? "Command failed" : "Command completed";
    state = "waiting";
  } else if (hookEventName === "UserPromptSubmit" && prompt) {
    entryKind = "prompt";
    title = prompt;
    detail = "Prompt submitted";
    state = "working";
  } else if (hookEventName === "SessionStart") {
    entryKind = "session";
    title = source ? `Session started from ${source}` : "Session started";
    detail = cwd;
    state = "working";
  } else if (hookEventName === "SessionEnd" || hookEventName === "Stop") {
    entryKind = "session";
    title = hookEventName === "Stop" ? "Agent stopped" : "Session ended";
    detail = cwd;
    state = "waiting";
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    version: 1,
    at: new Date().toISOString(),
    cwd,
    hookEventName,
    toolName,
    command,
    output,
    prompt,
    source,
    success,
    currentLine,
    recentHistory,
    entryKind,
    title,
    detail,
    state,
    raw: payload,
  };
}

async function main() {
  const cwd = rootDir();
  const runtimeDir = path.join(cwd, ".memoryostm", "runtime");
  await mkdir(runtimeDir, { recursive: true });

  const rawInput = await readStdin();
  const payload = rawInput ? safeJsonParse(rawInput) : readPayloadFromEnv() ?? {};
  const entry = buildEntry(payload, cwd);
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

main().catch(async (error) => {
  const cwd = rootDir();
  const runtimeDir = path.join(cwd, ".memoryostm", "runtime");
  await mkdir(runtimeDir, { recursive: true });
  const failurePath = path.join(runtimeDir, "cli-hook-errors.log");
  const message = `[${new Date().toISOString()}] ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`;
  await appendFile(failurePath, message, "utf8");
  process.exit(0);
});

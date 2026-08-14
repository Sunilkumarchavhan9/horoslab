export type CodexMemoryOsConfigInput = {
  cwd: string;
  baseUrl?: string;
  serverName?: string;
};

export type CodexMemoryOsPromptInput = {
  task: string;
  brief: unknown;
};

export type CodexMemoryOsSessionImportInput = {
  task: string;
  threadId: string;
  project: string;
  status: number | null;
  stdout: string;
  stderr: string;
  outcomeStatus: "success" | "failed";
  capturedAt?: string;
};

function tomlString(value: string): string {
  return JSON.stringify(value);
}

export function buildCodexMemoryOsMcpConfig(input: CodexMemoryOsConfigInput): string {
  const serverName = input.serverName?.trim() || "epoch";
  const baseUrl = input.baseUrl?.trim() || "http://localhost:3011";
  return [
    `# Epoch MCP bridge for Codex.`,
    `# Codex reads this project-scoped config in trusted repos.`,
    `# Keep EPOCH_API_KEY or EPOCH_API_TOKEN in your shell env, not in git.`,
    `[mcp_servers.${serverName}]`,
    `command = "npm"`,
    `args = ["run", "epoch:mcp:stdio"]`,
    `cwd = ${tomlString(input.cwd)}`,
    `env_vars = ["EPOCH_API_KEY", "EPOCH_API_TOKEN"]`,
    `startup_timeout_sec = 20`,
    `tool_timeout_sec = 90`,
    `enabled = true`,
    `required = false`,
    `enabled_tools = ["memoryignition_get_brief", "memoryignition_search_memory", "memoryignition_save_outcome", "memoryignition_create_handoff"]`,
    ``,
    `[mcp_servers.${serverName}.env]`,
    `EPOCH_BASE_URL = ${tomlString(baseUrl)}`,
    ``,
  ].join("\n");
}

export function buildCodexMemoryOsPrompt(input: CodexMemoryOsPromptInput): string {
  const briefText = typeof input.brief === "string" ? input.brief : JSON.stringify(input.brief, null, 2);
  return [
    "You are Codex working inside an Epoch-enabled repository.",
    "",
    "Use this MemoryIgnition brief as inherited company context before acting.",
    "Respect risky files, required tests, approval rules, past mistakes, and trace proof.",
    "",
    "MemoryIgnition Brief:",
    "```json",
    briefText,
    "```",
    "",
    "Task:",
    input.task,
    "",
    "After completing the task, summarize what changed, tests run, outcome, and any lesson future agents should inherit.",
    "",
    "Fallback if the MCP tools are not exposed in the current session:",
    "- use the direct Epoch HTTP routes at /api/memory/memoryignition/brief and /api/memory/memoryignition/outcome",
    "- or run npm run codex:memoryos:save-outcome with a JSON payload after the work is complete",
  ].join("\n");
}

export function buildCodexSessionImportContent(input: CodexMemoryOsSessionImportInput): string {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const stdout = input.stdout.trim();
  const stderr = input.stderr.trim();
  return [
    "# Codex MemoryOS Session",
    "",
    `Captured at: ${capturedAt}`,
    `Project: ${input.project}`,
    `Thread: ${input.threadId}`,
    `Outcome status: ${input.outcomeStatus}`,
    `Exit status: ${input.status ?? "unknown"}`,
    "",
    "## Task",
    "",
    input.task.trim(),
    "",
    "## Codex Output",
    "",
    stdout ? fenced("text", stdout.slice(0, 24_000)) : "No stdout captured.",
    "",
    "## Codex Errors",
    "",
    stderr ? fenced("text", stderr.slice(0, 8_000)) : "No stderr captured.",
    "",
    "## Epoch Lesson",
    "",
    input.outcomeStatus === "success"
      ? "Future agents can inherit this Codex run as successful execution context."
      : "Future agents should inspect this Codex run before repeating the same task.",
  ].join("\n");
}

function fenced(language: string, value: string): string {
  return [`\`\`\`${language}`, value.replace(/```/g, "'''"), "```"].join("\n");
}

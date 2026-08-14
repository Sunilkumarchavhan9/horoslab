import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);

function readArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function detectShellName() {
  const explicit = readArg("--shell");
  if (explicit) return explicit;
  const shellPath = process.env.SHELL ?? "";
  const base = path.basename(shellPath).toLowerCase();
  if (base.includes("zsh")) return "zsh";
  if (base.includes("fish")) return "fish";
  return "bash";
}

function resolveProjectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function defaultRcPath(shellName) {
  const home = os.homedir();
  if (shellName === "zsh") return path.join(home, ".zshrc");
  if (shellName === "fish") return path.join(home, ".config", "fish", "config.fish");
  return path.join(home, ".bashrc");
}

function escapeForDoubleQuotes(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildManagedBlock(shellName, projectRoot) {
  const escapedRoot = escapeForDoubleQuotes(projectRoot);
  const escapedInstaller = escapeForDoubleQuotes(
    path.join(projectRoot, "tools", "memoryostm-shell", "install-shell-integration.mjs"),
  );
  const escapedBridge = escapeForDoubleQuotes(
    path.join(projectRoot, "tools", "memoryostm-shell", "session-bridge.mjs"),
  );
  const escapedHookRunner = escapeForDoubleQuotes(
    path.join(projectRoot, "tools", "memoryostm-shell", "hook-runner.mjs"),
  );
  const escapedHooks = escapeForDoubleQuotes(path.join(projectRoot, ".memoryostm", "hooks.v1.json"));
  const escapedLog = escapeForDoubleQuotes(
    path.join(projectRoot, ".memoryostm", "runtime", "cli-events.jsonl"),
  );
  const escapedSnapshot = escapeForDoubleQuotes(
    path.join(projectRoot, ".memoryostm", "runtime", "latest-shell-state.json"),
  );

  if (shellName === "fish") {
    return [
      "# >>> MemoryOSTM shell integration >>>",
      `set -gx MEMORYOSTM_SHELL_PROJECT_ROOT "${escapedRoot}"`,
      `set -gx MEMORYOSTM_SHELL_HOOKS_PATH "${escapedHooks}"`,
      `set -gx MEMORYOSTM_SHELL_RUNTIME_LOG "${escapedLog}"`,
      `set -gx MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT "${escapedSnapshot}"`,
      `set -gx MEMORYOSTM_SHELL_HOOK_RUNNER "${escapedHookRunner}"`,
      "function memoryostm-shell",
      '  cd "$MEMORYOSTM_SHELL_PROJECT_ROOT"; or return 1',
      `  node "${escapedBridge}" $argv`,
      "end",
      "function memoryostm-shell__emit",
      "  set -l hook_event_name $argv[1]",
      "  set -l tool_name $argv[2]",
      "  set -l command_text $argv[3]",
      "  set -l output_text $argv[4]",
      "  set -l prompt_text $argv[5]",
      "  set -l current_line_text $argv[6]",
      "  set -l recent_history_text $argv[7]",
      "  set -l success_text $argv[8]",
      "  set -l exit_code_text $argv[9]",
      '  env MEMORYOSTM_SHELL_HOOK_EVENT_NAME="$hook_event_name" MEMORYOSTM_SHELL_TOOL_NAME="$tool_name" MEMORYOSTM_SHELL_COMMAND="$command_text" MEMORYOSTM_SHELL_OUTPUT="$output_text" MEMORYOSTM_SHELL_PROMPT="$prompt_text" MEMORYOSTM_SHELL_CURRENT_LINE="$current_line_text" MEMORYOSTM_SHELL_RECENT_HISTORY="$recent_history_text" MEMORYOSTM_SHELL_SUCCESS="$success_text" MEMORYOSTM_SHELL_EXIT_CODE="$exit_code_text" node "$MEMORYOSTM_SHELL_HOOK_RUNNER" >/dev/null 2>&1',
      "end",
      "function memoryostm-shell-prompt",
      "  set -l prompt_text $argv[1]",
      "  set -l current_line_text $argv[2]",
      "  set -l recent_history_text $argv[3]",
      '  env MEMORYOSTM_SHELL_CURRENT_LINE="$current_line_text" MEMORYOSTM_SHELL_RECENT_HISTORY="$recent_history_text" memoryostm-shell prompt "$prompt_text"',
      "end",
      "function memoryostm-shell-recent-history",
      "  set -l recent (history --max 5)",
      '  if test (count $recent) -gt 0',
      '    string join " | " $recent',
      "  end",
      "end",
      "function memoryostm-shell-hooks",
      '  cat "$MEMORYOSTM_SHELL_HOOKS_PATH"',
      "end",
      "function memoryostm-shell-log",
      '  tail -n 60 "$MEMORYOSTM_SHELL_RUNTIME_LOG"',
      "end",
      "function memoryostm-shell-status",
      '  if test -f "$MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT"',
      '    cat "$MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT"',
      "  else",
      '    printf "{}"',
      "  end",
      "end",
      "function memoryostm-shell-submit-current-line",
      "  set -l current_line (commandline --current-buffer)",
      "  if test -n \"$current_line\"",
      '    memoryostm-shell-prompt "$current_line" "$current_line" (memoryostm-shell-recent-history)',
      "  end",
      "end",
      "function memoryostm-shell-accept-line",
      "  set -l current_line (commandline --current-buffer)",
      '  if string match -qr "^#\\s*" -- "$current_line"',
      '    set -l prompt_text (string replace -r "^#\\s*" "" -- "$current_line")',
      '    if test -n "$prompt_text"',
      '      memoryostm-shell-prompt "$prompt_text" "$prompt_text" (memoryostm-shell-recent-history)',
      "    end",
      '    commandline -r ""',
      "    commandline -f repaint",
      "    return",
      "  end",
      "  commandline -f execute",
      "end",
      "if functions -q fish_user_key_bindings",
      "  functions -c fish_user_key_bindings memoryostm_shell_user_key_bindings_backup",
      "end",
      "function fish_user_key_bindings",
      "  if functions -q memoryostm_shell_user_key_bindings_backup",
      "    memoryostm_shell_user_key_bindings_backup",
      "  end",
      "  bind \\cg memoryostm-shell-submit-current-line",
      "  bind \\r memoryostm-shell-accept-line",
      "end",
      "function fish_preexec --on-event fish_preexec",
      '  set -l command_text (string join " " $argv)',
      "  if test -n \"$command_text\"",
      "    set -l recent_history_text (memoryostm-shell-recent-history)",
      '    memoryostm-shell__emit "PreToolUse" "shell.exec" "$command_text" "" "" "$command_text" "$recent_history_text" "" ""',
      "  end",
      "end",
      "function fish_postexec --on-event fish_postexec",
      "  set -l exit_code_text $status",
      '  set -l command_text (history --max 1 | string trim)',
      "  if test -n \"$command_text\"",
      '    if not string match -q "memoryostm-shell*" -- "$command_text"',
      "      set -l recent_history_text (memoryostm-shell-recent-history)",
      '      set -l success_text (test $exit_code_text -eq 0; and echo true; or echo false)',
      '      memoryostm-shell__emit "PostToolUse" "shell.exec" "$command_text" "" "" "$command_text" "$recent_history_text" "$success_text" "$exit_code_text"',
      "    end",
      "  end",
      "end",
      "function memoryostm-shell-install",
      `  node "${escapedInstaller}" --shell fish`,
      "end",
      "# <<< MemoryOSTM shell integration <<<",
      "",
    ].join("\n");
  }

  if (shellName === "zsh") {
    return [
      "# >>> MemoryOSTM shell integration >>>",
      `export MEMORYOSTM_SHELL_PROJECT_ROOT="${escapedRoot}"`,
      `export MEMORYOSTM_SHELL_HOOKS_PATH="${escapedHooks}"`,
      `export MEMORYOSTM_SHELL_RUNTIME_LOG="${escapedLog}"`,
      `export MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT="${escapedSnapshot}"`,
      `export MEMORYOSTM_SHELL_HOOK_RUNNER="${escapedHookRunner}"`,
      "autoload -Uz add-zsh-hook",
      "typeset -g MEMORYOSTM_SHELL_LAST_COMMAND=\"\"",
      "memoryostm-shell() {",
      '  cd "$MEMORYOSTM_SHELL_PROJECT_ROOT" || return 1',
      `  node "${escapedBridge}" "$@"`,
      "}",
      "memoryostm-shell__emit() {",
      "  local hook_event_name=\"$1\"",
      "  local tool_name=\"$2\"",
      "  local command_text=\"$3\"",
      "  local output_text=\"$4\"",
      "  local prompt_text=\"$5\"",
      "  local current_line_text=\"$6\"",
      "  local recent_history_text=\"$7\"",
      "  local success_text=\"$8\"",
      "  local exit_code_text=\"$9\"",
      '  env MEMORYOSTM_SHELL_HOOK_EVENT_NAME="$hook_event_name" MEMORYOSTM_SHELL_TOOL_NAME="$tool_name" MEMORYOSTM_SHELL_COMMAND="$command_text" MEMORYOSTM_SHELL_OUTPUT="$output_text" MEMORYOSTM_SHELL_PROMPT="$prompt_text" MEMORYOSTM_SHELL_CURRENT_LINE="$current_line_text" MEMORYOSTM_SHELL_RECENT_HISTORY="$recent_history_text" MEMORYOSTM_SHELL_SUCCESS="$success_text" MEMORYOSTM_SHELL_EXIT_CODE="$exit_code_text" node "$MEMORYOSTM_SHELL_HOOK_RUNNER" >/dev/null 2>&1',
      "}",
      "memoryostm-shell-prompt() {",
      "  emulate -L zsh",
      "  local prompt_text=\"$1\"",
      "  local current_line_text=\"$2\"",
      "  local recent_history_text=\"$3\"",
      '  MEMORYOSTM_SHELL_CURRENT_LINE="$current_line_text" MEMORYOSTM_SHELL_RECENT_HISTORY="$recent_history_text" memoryostm-shell prompt "$prompt_text"',
      "}",
      "memoryostm-shell-recent-history() {",
      "  emulate -L zsh",
      '  local -a recent_commands',
      '  recent_commands=("${(@f)$(fc -ln -5 2>/dev/null)}")',
      '  if (( ${#recent_commands} )); then',
      '    print -r -- "${(j: | :)recent_commands}"',
      "  fi",
      "}",
      "memoryostm-shell-hooks() {",
      '  cat "$MEMORYOSTM_SHELL_HOOKS_PATH"',
      "}",
      "memoryostm-shell-log() {",
      '  tail -n 60 "$MEMORYOSTM_SHELL_RUNTIME_LOG"',
      "}",
      "memoryostm-shell-status() {",
      '  if [[ -f "$MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT" ]]; then',
      '    cat "$MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT"',
      "  else",
      '    printf "{}"',
      "  fi",
      "}",
      "memoryostm-shell-submit-current-line() {",
      "  emulate -L zsh",
      '  local current_line="${BUFFER:-}"',
      '  if [[ -n "$current_line" ]]; then',
      '    memoryostm-shell-prompt "$current_line" "$current_line" "$(memoryostm-shell-recent-history)"',
      "  fi",
      "  zle reset-prompt",
      "}",
      "zle -N memoryostm-shell-submit-current-line",
      "bindkey '^G' memoryostm-shell-submit-current-line",
      "memoryostm-shell-accept-line() {",
      "  emulate -L zsh",
      '  local current_line="${BUFFER:-}"',
      '  if [[ "$current_line" == \#* ]]; then',
      '    local prompt_text="${current_line#\# }"',
      '    prompt_text="${prompt_text#\#}"',
      '    prompt_text="${prompt_text# }"',
      '    if [[ -n "$prompt_text" ]]; then',
      '      memoryostm-shell-prompt "$prompt_text" "$prompt_text" "$(memoryostm-shell-recent-history)"',
      "    fi",
      '    BUFFER=""',
      "    CURSOR=0",
      "    zle reset-prompt",
      "    return 0",
      "  fi",
      "  zle .accept-line",
      "}",
      "zle -N memoryostm-shell-accept-line",
      "bindkey '^M' memoryostm-shell-accept-line",
      "memoryostm-shell-preexec() {",
      "  emulate -L zsh",
      '  MEMORYOSTM_SHELL_LAST_COMMAND="$1"',
      '  if [[ -n "$1" && "$1" != memoryostm-shell* ]]; then',
      '    local recent_history_text="$(memoryostm-shell-recent-history)"',
      '    memoryostm-shell__emit "PreToolUse" "shell.exec" "$1" "" "" "$1" "$recent_history_text" "" ""',
      "  fi",
      "}",
      "memoryostm-shell-precmd() {",
      "  emulate -L zsh",
      '  local exit_code_text="$?"',
      '  local command_text="${MEMORYOSTM_SHELL_LAST_COMMAND:-}"',
      '  if [[ -n "$command_text" && "$command_text" != memoryostm-shell* ]]; then',
      '    local success_text="false"',
      '    [[ "$exit_code_text" -eq 0 ]] && success_text="true"',
      '    local recent_history_text="$(memoryostm-shell-recent-history)"',
      '    memoryostm-shell__emit "PostToolUse" "shell.exec" "$command_text" "" "" "$command_text" "$recent_history_text" "$success_text" "$exit_code_text"',
      "  fi",
      '  MEMORYOSTM_SHELL_LAST_COMMAND=""',
      "}",
      "add-zsh-hook preexec memoryostm-shell-preexec",
      "add-zsh-hook precmd memoryostm-shell-precmd",
      "memoryostm-shell-install() {",
      `  node "${escapedInstaller}" --shell zsh`,
      "}",
      "# <<< MemoryOSTM shell integration <<<",
      "",
    ].join("\n");
  }

  return [
    "# >>> MemoryOSTM shell integration >>>",
    `export MEMORYOSTM_SHELL_PROJECT_ROOT="${escapedRoot}"`,
    `export MEMORYOSTM_SHELL_HOOKS_PATH="${escapedHooks}"`,
    `export MEMORYOSTM_SHELL_RUNTIME_LOG="${escapedLog}"`,
    `export MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT="${escapedSnapshot}"`,
    `export MEMORYOSTM_SHELL_HOOK_RUNNER="${escapedHookRunner}"`,
    "memoryostm-shell() {",
    '  cd "$MEMORYOSTM_SHELL_PROJECT_ROOT" || return 1',
    `  node "${escapedBridge}" "$@"`,
    "}",
    "memoryostm-shell__emit() {",
    "  local hook_event_name=\"$1\"",
    "  local tool_name=\"$2\"",
    "  local command_text=\"$3\"",
    "  local output_text=\"$4\"",
    "  local prompt_text=\"$5\"",
    "  local current_line_text=\"$6\"",
    "  local recent_history_text=\"$7\"",
    "  local success_text=\"$8\"",
    "  local exit_code_text=\"$9\"",
    '  env MEMORYOSTM_SHELL_HOOK_EVENT_NAME="$hook_event_name" MEMORYOSTM_SHELL_TOOL_NAME="$tool_name" MEMORYOSTM_SHELL_COMMAND="$command_text" MEMORYOSTM_SHELL_OUTPUT="$output_text" MEMORYOSTM_SHELL_PROMPT="$prompt_text" MEMORYOSTM_SHELL_CURRENT_LINE="$current_line_text" MEMORYOSTM_SHELL_RECENT_HISTORY="$recent_history_text" MEMORYOSTM_SHELL_SUCCESS="$success_text" MEMORYOSTM_SHELL_EXIT_CODE="$exit_code_text" node "$MEMORYOSTM_SHELL_HOOK_RUNNER" >/dev/null 2>&1',
    "}",
    "memoryostm-shell-prompt() {",
    '  local prompt_text="$1"',
    '  local current_line_text="$2"',
    '  local recent_history_text="$3"',
    '  MEMORYOSTM_SHELL_CURRENT_LINE="$current_line_text" MEMORYOSTM_SHELL_RECENT_HISTORY="$recent_history_text" memoryostm-shell prompt "$prompt_text"',
    "}",
    "memoryostm-shell-recent-history() {",
    '  local recent_commands',
    "  recent_commands=\"$(history 5 2>/dev/null | sed -E 's/^ *[0-9]+[* ]*//')\"",
    '  printf "%s" "$recent_commands"',
    "}",
    "memoryostm-shell-hooks() {",
    '  cat "$MEMORYOSTM_SHELL_HOOKS_PATH"',
    "}",
    "memoryostm-shell-log() {",
    '  tail -n 60 "$MEMORYOSTM_SHELL_RUNTIME_LOG"',
    "}",
    "memoryostm-shell-status() {",
    '  if [[ -f "$MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT" ]]; then',
    '    cat "$MEMORYOSTM_SHELL_RUNTIME_SNAPSHOT"',
    "  else",
    '    printf "{}"',
    "  fi",
    "}",
    "memoryostm-shell-submit-current-line() {",
    '  local current_line="${READLINE_LINE-}"',
    '  [[ -n "$current_line" ]] && memoryostm-shell-prompt "$current_line" "$current_line" "$(memoryostm-shell-recent-history)"',
    "}",
    "memoryostm-shell-accept-line() {",
    '  local current_line="${READLINE_LINE-}"',
    '  if [[ "$current_line" == \#* ]]; then',
    '    local prompt_text="${current_line#\# }"',
    '    prompt_text="${prompt_text#\#}"',
    '    prompt_text="${prompt_text# }"',
    '    [[ -n "$prompt_text" ]] && memoryostm-shell-prompt "$prompt_text" "$prompt_text" "$(memoryostm-shell-recent-history)"',
    '    READLINE_LINE=""',
    "    READLINE_POINT=0",
    "    return 0",
    "  fi",
    "  return 1",
    "}",
    "memoryostm-shell-record-command() {",
      "  local exit_code_text=\"$?\"",
      "  local command_text=\"\"",
      '  command_text="$(fc -ln -1 2>/dev/null | tail -n 1)"',
      '  [[ -z "$command_text" ]] && return 0',
      '  if [[ "$command_text" == memoryostm-shell* ]]; then',
      "    return 0",
      "  fi",
      '  local recent_history_text="$(memoryostm-shell-recent-history)"',
      '  local success_text="false"',
      '  [[ "$exit_code_text" -eq 0 ]] && success_text="true"',
      '  memoryostm-shell__emit "PostToolUse" "shell.exec" "$command_text" "" "" "$command_text" "$recent_history_text" "$success_text" "$exit_code_text"',
      "}",
    'if [[ -n ${PROMPT_COMMAND-} ]]; then',
    '  PROMPT_COMMAND="memoryostm-shell-record-command; ${PROMPT_COMMAND}"',
    "else",
    '  PROMPT_COMMAND="memoryostm-shell-record-command"',
    "fi",
    'bind -x \'"\\C-g":memoryostm-shell-submit-current-line\'',
    "memoryostm-shell-install() {",
    `  node "${escapedInstaller}" --shell ${shellName}`,
    "}",
    "# <<< MemoryOSTM shell integration <<<",
    "",
  ].join("\n");
}

function replaceManagedBlock(current, block) {
  const pattern =
    /# >>> MemoryOSTM shell integration >>>[\s\S]*?# <<< MemoryOSTM shell integration <<</m;
  if (pattern.test(current)) {
    return current.replace(pattern, block.trimEnd());
  }
  return `${current.trimEnd()}\n\n${block}`;
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureFile(filePath) {
  if (await fileExists(filePath)) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, "", "utf8");
}

async function main() {
  const shellName = detectShellName();
  if (!["bash", "zsh", "fish"].includes(shellName)) {
    throw new Error(`Unsupported shell "${shellName}". Use bash, zsh, or fish.`);
  }

  const projectRoot = resolveProjectRoot();
  const rcPath = path.resolve(readArg("--rc") ?? defaultRcPath(shellName));
  const runtimeDir = path.join(projectRoot, ".memoryostm", "runtime");
  await mkdir(runtimeDir, { recursive: true });
  await ensureFile(rcPath);

  const current = await readFile(rcPath, "utf8");
  const next = replaceManagedBlock(current, buildManagedBlock(shellName, projectRoot));
  if (next !== current) {
    await writeFile(rcPath, next, "utf8");
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        shell: shellName,
        rcPath,
        projectRoot,
        hooksPath: path.join(projectRoot, ".memoryostm", "hooks.v1.json"),
        runtimeLogPath: path.join(projectRoot, ".memoryostm", "runtime", "cli-events.jsonl"),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});

export const DEVIN_SHELL_SETUP_COMMAND = "npm run memoryostm:shell:install -- --shell bash";

export const DEVIN_SHELL_CONFIG_PATH = ".memoryostm/config.json";

export const DEVIN_SHELL_HOOKS_PATH = ".memoryostm/hooks.v1.json";

export const DEVIN_SHELL_CONFIG_JSON = `{
  "shell": {
    "keybinding_trigger": "C-g",
    "enable_comments": true
  }
}`;

export const DEVIN_SHELL_SUPPORTED_ENVIRONMENT = [
  "macOS",
  "Linux",
  "WSL",
  "Bash",
  "Zsh",
  "Fish",
] as const;

export const DEVIN_SHELL_UNSUPPORTED_ENVIRONMENT = [
  "PowerShell",
  "CMD",
] as const;

export type DevinShellHookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "PermissionRequest"
  | "UserPromptSubmit"
  | "Stop"
  | "SessionStart"
  | "SessionEnd";

export type DevinShellHookSpec = {
  event: DevinShellHookEvent;
  title: string;
  description: string;
  inputFields: string[];
};

export const DEVIN_SHELL_HOOKS: DevinShellHookSpec[] = [
  {
    event: "PreToolUse",
    title: "Pre-tool use",
    description: "Validate policy before MemoryOSTM runs a tool.",
    inputFields: ["tool_name", "tool_input"],
  },
  {
    event: "PostToolUse",
    title: "Post-tool use",
    description: "Inspect the result of a tool after it finishes.",
    inputFields: ["tool_name", "tool_input", "tool_response"],
  },
  {
    event: "PermissionRequest",
    title: "Permission request",
    description: "Gate actions that need approval before execution.",
    inputFields: ["tool_name", "tool_input"],
  },
  {
    event: "UserPromptSubmit",
    title: "Prompt submit",
    description: "Capture prompt input before the session starts work.",
    inputFields: ["prompt"],
  },
  {
    event: "SessionStart",
    title: "Session start",
    description: "Run setup logic as a MemoryOSTM shell session starts.",
    inputFields: ["session metadata"],
  },
  {
    event: "SessionEnd",
    title: "Session end",
    description: "Flush session artifacts or upload final context.",
    inputFields: ["session metadata", "result"],
  },
  {
    event: "Stop",
    title: "Stop",
    description: "Observe when a session is interrupted or stopped.",
    inputFields: ["session state"],
  },
];

export const DEVIN_SHELL_BEHAVIOR_POINTS = [
  "Ctrl+G can invoke MemoryOSTM with the current line and recent shell history.",
  "MemoryOSTM can see recent shell commands and output while the integration is active.",
  "In Zsh, `# comment` syntax can submit a prompt directly.",
  "After changing shell config, rerun the MemoryOSTM installer and restart the terminal.",
] as const;

import type { HorosTMShellLiveEntry } from "@/lib/continuity-lab/horostm-shell-session-api";

export type ShellTerminalInputResult = {
  currentLine: string;
  forwardToPty: string | null;
  promptSubmission: {
    prompt: string;
    currentLine: string;
    recentHistory: string | null;
  } | null;
};

function stripPromptPrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("#")) return trimmed;
  return trimmed.replace(/^#\s*/, "").trim();
}

export function summarizeShellHistory(
  entries: HorosTMShellLiveEntry[],
  maxEntries = 5,
): string | null {
  const recent = entries.slice(-maxEntries);
  if (recent.length === 0) return null;
  return recent
    .map((entry) => {
      const label =
        entry.kind === "command"
          ? "cmd"
          : entry.kind === "prompt"
            ? "prompt"
            : entry.kind === "session"
              ? "session"
              : "runtime";
      return `${label}:${entry.title}`;
    })
    .join(" | ");
}

export function applyShellTerminalInput(
  currentLine: string,
  data: string,
  recentHistory: string | null,
): ShellTerminalInputResult {
  let nextLine = currentLine;
  let forwardToPty = "";
  let promptSubmission: ShellTerminalInputResult["promptSubmission"] = null;

  for (let index = 0; index < data.length; index += 1) {
    const char = data[index]!;

    if (char === "\u0007") {
      const trimmed = nextLine.trim();
      if (trimmed.length > 0) {
        promptSubmission = {
          prompt: stripPromptPrefix(nextLine),
          currentLine: nextLine,
          recentHistory,
        };
      }
      nextLine = "";
      forwardToPty = "";
      continue;
    }

    if (char === "\r" || char === "\n") {
      const trimmed = nextLine.trim();
      if (trimmed.startsWith("#")) {
        const promptText = stripPromptPrefix(nextLine);
        if (promptText.length > 0) {
          promptSubmission = {
            prompt: promptText,
            currentLine: nextLine,
            recentHistory,
          };
        }
        nextLine = "";
        forwardToPty = "";
        continue;
      }
      nextLine = "";
      forwardToPty += char;
      continue;
    }

    if (char === "\b" || char === "\u007f") {
      nextLine = nextLine.slice(0, -1);
      forwardToPty += char;
      continue;
    }

    nextLine += char;
    forwardToPty += char;
  }

  return {
    currentLine: nextLine,
    forwardToPty: forwardToPty.length > 0 ? forwardToPty : null,
    promptSubmission,
  };
}

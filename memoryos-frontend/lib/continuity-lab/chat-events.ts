import type { OpenHandsLikeEvent } from "@/lib/continuity-lab/openhands-event-stream";

export type ChatBubbleVariant =
  | "message"
  | "thought"
  | "tip"
  | "status"
  | "artifact";

export type PrReadyArtifact = {
  type: "pr_ready";
  id: string;
  url: string;
  number?: number;
  title: string;
  branch?: string;
  baseBranch?: string;
  ciStatus: "pending" | "passed" | "failed" | "merged";
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  timestamp?: string;
};

export type ChatArtifact = PrReadyArtifact;

export type ChatBubble = {
  id: string;
  role: "user" | "agent" | "system";
  variant?: ChatBubbleVariant;
  text: string;
  timestamp: string;
  artifact?: ChatArtifact;
  /** Seconds until the next event (thought blocks only). */
  thoughtDurationSec?: number;
};

export type FileChangeEntry = {
  id: string;
  path: string;
  kind: "edit" | "write" | "read" | "command" | "other";
  detail?: string;
  /** Raw content from the agent event observation (diff preview or file content). */
  content?: string;
};

function textFromContent(
  content?: Array<{ type: string; text?: string }>,
): string {
  if (!content?.length) return "";
  return content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text ?? "")
    .join("\n")
    .trim();
}

function thoughtDurationSec(
  event: OpenHandsLikeEvent,
  events: OpenHandsLikeEvent[],
  index: number,
): number | undefined {
  const next = events[index + 1];
  if (!event.timestamp || !next?.timestamp) return undefined;
  const deltaMs =
    new Date(next.timestamp).getTime() - new Date(event.timestamp).getTime();
  if (!Number.isFinite(deltaMs) || deltaMs < 500) return undefined;
  const sec = Math.round(deltaMs / 1000);
  return sec > 0 && sec < 600 ? sec : undefined;
}

function classifyMessageVariant(text: string): ChatBubbleVariant {
  const normalized = text.trim();
  if (!normalized) return "message";
  if (
    /^Reviewer approved /i.test(normalized) ||
    /^Reviewer rejected /i.test(normalized) ||
    /requested revision/i.test(normalized) ||
    /^Linked pull request:/i.test(normalized) ||
    /Verification evidence attached/i.test(normalized) ||
    /Review note attached/i.test(normalized) ||
    / handed work to /i.test(normalized)
  ) {
    return "status";
  }
  return "message";
}

export function eventsToChatBubbles(events: OpenHandsLikeEvent[]): ChatBubble[] {
  const bubbles: ChatBubble[] = [];

  for (let index = 0; index < events.length; index++) {
    const event = events[index]!;
    const eventId = event.id ?? event.timestamp ?? `event-${index}`;
    const timestamp = event.timestamp ?? new Date().toISOString();
    if (event.artifact?.type === "pr_ready") {
      bubbles.push({
        id: eventId,
        role: "agent",
        variant: "artifact",
        text: event.artifact.title,
        artifact: event.artifact,
        timestamp,
      });
      continue;
    }

    if (event.llm_message) {
      const text = textFromContent(event.llm_message.content);
      if (!text) continue;
      const role =
        event.llm_message.role === "user"
          ? "user"
          : event.llm_message.role === "assistant"
            ? "agent"
            : "system";
      bubbles.push({
        id: eventId,
        role,
        variant: classifyMessageVariant(text),
        text,
        timestamp,
      });
      continue;
    }

    if (event.source === "agent" && event.thought?.length) {
      const text = textFromContent(event.thought);
      if (text) {
        bubbles.push({
          id: `${eventId}-thought`,
          role: "agent",
          variant: "thought",
          text,
          timestamp,
          thoughtDurationSec: thoughtDurationSec(event, events, index),
        });
      }
    }

    if (event.source === "agent" && event.error) {
      bubbles.push({
        id: `${eventId}-error`,
        role: "system",
        text: event.error,
        timestamp,
      });
    }
  }

  return bubbles;
}

export function eventsToFileChanges(
  events: OpenHandsLikeEvent[],
): FileChangeEntry[] {
  const changes: FileChangeEntry[] = [];

  for (const event of events) {
    const eventId = event.id ?? event.timestamp ?? `event-${changes.length}`;
    const tool = event.tool_name ?? "";
    const action = event.action;
    const observation = event.observation;

    if (
      tool.includes("edit") ||
      action?.kind === "file_edit" ||
      observation?.kind === "edit"
    ) {
      const path = action?.path ?? observation?.path;
      if (path) {
        changes.push({
          id: eventId,
          path,
          kind: "edit",
          detail: tool || action?.kind,
          content: observation?.content ?? undefined,
        });
      }
      continue;
    }

    if (tool.includes("write") || action?.kind === "write") {
      const path = action?.path ?? observation?.path;
      if (path) {
        changes.push({
          id: eventId,
          path,
          kind: "write",
          detail: tool,
          content: observation?.content ?? undefined,
        });
      }
      continue;
    }

    if (tool.includes("execute_bash") || action?.command) {
      changes.push({
        id: eventId,
        path: action?.command?.slice(0, 80) ?? "terminal",
        kind: "command",
        detail: action?.command,
        content: observation?.content ?? undefined,
      });
    }
  }

  const seen = new Set<string>();
  return changes.filter((c) => {
    const key = `${c.kind}:${c.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type WorklogEntry = {
  id: string;
  label: string;
  detail?: string;
  timestamp: string;
};

export type ShellLineEntry = {
  id: string;
  command: string;
  timestamp: string;
  output?: string;
  kind?: "command" | "runtime" | "output";
};

export function eventsToWorklog(events: OpenHandsLikeEvent[]): WorklogEntry[] {
  const entries: WorklogEntry[] = [];

  for (const event of events) {
    const eventId = event.id ?? event.timestamp ?? `event-${entries.length}`;
    const timestamp = event.timestamp ?? new Date().toISOString();
    if (event.tool_name) {
      entries.push({
        id: `${eventId}-tool`,
        label: event.tool_name,
        detail: event.action?.path ?? event.action?.command?.slice(0, 120),
        timestamp,
      });
      continue;
    }
    if (event.source === "agent" && event.thought?.length) {
      const text = textFromContent(event.thought);
      if (text) {
        entries.push({
          id: `${eventId}-thought`,
          label: "Agent thought",
          detail: text.slice(0, 200),
          timestamp,
        });
      }
    }
    if (event.source === "agent" && event.error) {
      entries.push({
        id: `${eventId}-error`,
        label: "Error",
        detail: event.error,
        timestamp,
      });
    }
  }

  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function eventsToShellLines(events: OpenHandsLikeEvent[]): ShellLineEntry[] {
  const lines: ShellLineEntry[] = [];

  for (const event of events) {
    const eventId = event.id ?? event.timestamp ?? `event-${lines.length}`;
    const timestamp = event.timestamp ?? new Date().toISOString();
    const tool = event.tool_name ?? "";
    const command = event.action?.command;
    const observation = event.observation;
    const isShellCommand =
      Boolean(command) ||
      tool.includes("execute_bash") ||
      tool.includes("bash") ||
      tool === "runtime.execution" ||
      event.action?.kind === "execution_log";
    if (!isShellCommand)
      continue;
    const cmd = command ?? observation?.content ?? tool;
    lines.push({
      id: eventId,
      command: cmd,
      timestamp,
      output: observation?.content ?? undefined,
      kind: tool === "runtime.execution" || event.action?.kind === "execution_log" ? "runtime" : "command",
    });
  }

  return lines.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function mergeChatBubbles(
  existing: ChatBubble[],
  incoming: ChatBubble[],
): ChatBubble[] {
  const byId = new Map(existing.map((b) => [b.id, b]));
  for (const bubble of incoming) {
    byId.set(bubble.id, bubble);
  }
  return [...byId.values()].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
}

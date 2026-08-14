"use client";

import { broadcastLabContinuityLabSettingsChanged } from "@/lib/continuity-lab/lab-continuity-lab-settings-events";

export type LabDefaultAgentId = "agent" | "fast" | "gpt-5.5" | "opus-4.8";
export type LabDefaultPlatform = "ubuntu" | "windows";
export type LabOpenPrsAs = "memoryos" | "user";
export type LabRespondingToBots = "all" | "selected" | "none";

export type LabSlashCommand = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  system: boolean;
};

export type LabContinuityLabSettings = {
  secureMode: boolean;
  computerUse: boolean;
  defaultAgent: LabDefaultAgentId;
  defaultPlatform: LabDefaultPlatform;
  customCommands: LabSlashCommand[];
  batchLimit: number;
  messageUsageLimitUsd: number | null;
  sharePromptsInPrs: boolean;
  requireMemoryosToRespond: boolean;
  autoAddReviewer: boolean;
  openPrsAs: LabOpenPrsAs;
  respondingToBots: LabRespondingToBots;
};

export const SYSTEM_SLASH_COMMANDS: LabSlashCommand[] = [
  {
    id: "sys-implement",
    name: "implement",
    description: "Implement a feature or fix from the current task context.",
    prompt:
      "Implement the requested change. Read relevant files, make minimal focused edits, and verify behavior.",
    system: true,
  },
  {
    id: "sys-plan",
    name: "plan",
    description: "Produce a step-by-step plan before making changes.",
    prompt:
      "Create a concise implementation plan with risks, files to touch, and verification steps. Do not edit code yet.",
    system: true,
  },
  {
    id: "sys-review",
    name: "review",
    description: "Review code changes for correctness, security, and style.",
    prompt:
      "Review the diff or files in scope. List findings by severity with file references and suggested fixes.",
    system: true,
  },
  {
    id: "sys-test",
    name: "test",
    description: "Run and interpret tests for the current scope.",
    prompt: "Run appropriate tests for the change, report failures with root cause, and propose fixes.",
    system: true,
  },
  {
    id: "sys-think-hard",
    name: "think-hard",
    description: "Deep reasoning pass before acting on ambiguous work.",
    prompt:
      "Think carefully through constraints, edge cases, and tradeoffs. Summarize reasoning before next actions.",
    system: true,
  },
];

export const DEFAULT_LAB_CONTINUITY_LAB_SETTINGS: LabContinuityLabSettings = {
  secureMode: false,
  computerUse: true,
  defaultAgent: "agent",
  defaultPlatform: "ubuntu",
  customCommands: [],
  batchLimit: 30,
  messageUsageLimitUsd: null,
  sharePromptsInPrs: true,
  requireMemoryosToRespond: false,
  autoAddReviewer: false,
  openPrsAs: "memoryos",
  respondingToBots: "selected",
};

/** Static fallback labels; UI should prefer `buildLabDefaultAgentOptions` when OpenRouter is configured. */
export const LAB_DEFAULT_AGENT_OPTIONS: { value: LabDefaultAgentId; label: string }[] = [
  { value: "agent", label: "Company model (default)" },
  { value: "fast", label: "Fast mode (GLM 4.5 Air)" },
  { value: "gpt-5.5", label: "GPT OSS 120B" },
  { value: "opus-4.8", label: "Claude Sonnet 4.5" },
];

const STORAGE_KEY = "memoryos-lab-continuity-lab-settings";

function mergeParsed(parsed: Partial<LabContinuityLabSettings>): LabContinuityLabSettings {
  const base = DEFAULT_LAB_CONTINUITY_LAB_SETTINGS;
  const batch =
    typeof parsed.batchLimit === "number" && Number.isFinite(parsed.batchLimit)
      ? Math.min(500, Math.max(1, Math.round(parsed.batchLimit)))
      : base.batchLimit;
  const agents = new Set<LabDefaultAgentId>(["agent", "fast", "gpt-5.5", "opus-4.8"]);
  const platforms = new Set<LabDefaultPlatform>(["ubuntu", "windows"]);
  const openAs = new Set<LabOpenPrsAs>(["memoryos", "user"]);
  const bots = new Set<LabRespondingToBots>(["all", "selected", "none"]);

  return {
    secureMode: typeof parsed.secureMode === "boolean" ? parsed.secureMode : base.secureMode,
    computerUse:
      typeof parsed.computerUse === "boolean" ? parsed.computerUse : base.computerUse,
    defaultAgent:
      parsed.defaultAgent && agents.has(parsed.defaultAgent)
        ? parsed.defaultAgent
        : base.defaultAgent,
    defaultPlatform:
      parsed.defaultPlatform && platforms.has(parsed.defaultPlatform)
        ? parsed.defaultPlatform
        : base.defaultPlatform,
    customCommands: Array.isArray(parsed.customCommands)
      ? parsed.customCommands.filter(
          (c): c is LabSlashCommand =>
            !!c &&
            typeof c === "object" &&
            typeof (c as LabSlashCommand).id === "string" &&
            typeof (c as LabSlashCommand).name === "string" &&
            !(c as LabSlashCommand).system,
        )
      : base.customCommands,
    batchLimit: batch,
    messageUsageLimitUsd:
      parsed.messageUsageLimitUsd === null || parsed.messageUsageLimitUsd === undefined
        ? base.messageUsageLimitUsd
        : typeof parsed.messageUsageLimitUsd === "number"
          ? parsed.messageUsageLimitUsd
          : base.messageUsageLimitUsd,
    sharePromptsInPrs:
      typeof parsed.sharePromptsInPrs === "boolean"
        ? parsed.sharePromptsInPrs
        : base.sharePromptsInPrs,
    requireMemoryosToRespond:
      typeof parsed.requireMemoryosToRespond === "boolean"
        ? parsed.requireMemoryosToRespond
        : base.requireMemoryosToRespond,
    autoAddReviewer:
      typeof parsed.autoAddReviewer === "boolean"
        ? parsed.autoAddReviewer
        : base.autoAddReviewer,
    openPrsAs:
      parsed.openPrsAs && openAs.has(parsed.openPrsAs) ? parsed.openPrsAs : base.openPrsAs,
    respondingToBots:
      parsed.respondingToBots && bots.has(parsed.respondingToBots)
        ? parsed.respondingToBots
        : base.respondingToBots,
  };
}

export function readLabContinuityLabSettings(): LabContinuityLabSettings {
  if (typeof window === "undefined") return { ...DEFAULT_LAB_CONTINUITY_LAB_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAB_CONTINUITY_LAB_SETTINGS };
    return mergeParsed(JSON.parse(raw) as Partial<LabContinuityLabSettings>);
  } catch {
    return { ...DEFAULT_LAB_CONTINUITY_LAB_SETTINGS };
  }
}

export function saveLabContinuityLabSettings(
  partial: Partial<LabContinuityLabSettings>,
  options?: { broadcast?: boolean },
): LabContinuityLabSettings {
  const next = { ...readLabContinuityLabSettings(), ...partial };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (options?.broadcast !== false) {
      broadcastLabContinuityLabSettingsChanged({
        settings: next,
        commands: listAllSlashCommands(next),
      });
    }
  }
  return next;
}

export function listAllSlashCommands(settings: LabContinuityLabSettings): LabSlashCommand[] {
  return [...SYSTEM_SLASH_COMMANDS, ...settings.customCommands];
}

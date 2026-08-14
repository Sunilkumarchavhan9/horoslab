import { randomUUID } from "crypto";
import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

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

export type LabContinuityLabSettingsRecord = {
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
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-continuity-lab-settings";

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
    prompt:
      "Run appropriate tests for the change, report failures with root cause, and propose fixes.",
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

const DEFAULTS: Omit<LabContinuityLabSettingsRecord, "updatedAt"> = {
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

function isDefaultAgent(v: unknown): v is LabDefaultAgentId {
  return v === "agent" || v === "fast" || v === "gpt-5.5" || v === "opus-4.8";
}

function isPlatform(v: unknown): v is LabDefaultPlatform {
  return v === "ubuntu" || v === "windows";
}

function isOpenPrsAs(v: unknown): v is LabOpenPrsAs {
  return v === "memoryos" || v === "user";
}

function isRespondingToBots(v: unknown): v is LabRespondingToBots {
  return v === "all" || v === "selected" || v === "none";
}

function normalizeCommandName(name: string): string {
  return name.trim().replace(/^\//, "").toLowerCase();
}

function coerceCustomCommands(raw: unknown): LabSlashCommand[] {
  if (!Array.isArray(raw)) return [];
  const out: LabSlashCommand[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabSlashCommand>;
    const name = typeof row.name === "string" ? normalizeCommandName(row.name) : "";
    if (!name || row.system === true) continue;
    const description = typeof row.description === "string" ? row.description.trim() : "";
    const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
    if (!description || !prompt) continue;
    out.push({
      id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : randomUUID(),
      name,
      description,
      prompt,
      system: false,
    });
  }
  return out;
}

function clampBatchLimit(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULTS.batchLimit;
  return Math.min(500, Math.max(1, Math.round(n)));
}

function coerceMessageLimit(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function mergeRecord(
  existing: Omit<LabContinuityLabSettingsRecord, "updatedAt"> | undefined,
  partial: Partial<Omit<LabContinuityLabSettingsRecord, "updatedAt">>,
): LabContinuityLabSettingsRecord {
  const base = existing ?? DEFAULTS;
  return {
    secureMode:
      typeof partial.secureMode === "boolean" ? partial.secureMode : base.secureMode,
    computerUse:
      typeof partial.computerUse === "boolean" ? partial.computerUse : base.computerUse,
    defaultAgent: isDefaultAgent(partial.defaultAgent) ? partial.defaultAgent : base.defaultAgent,
    defaultPlatform: isPlatform(partial.defaultPlatform)
      ? partial.defaultPlatform
      : base.defaultPlatform,
    customCommands:
      partial.customCommands !== undefined
        ? coerceCustomCommands(partial.customCommands)
        : base.customCommands,
    batchLimit:
      partial.batchLimit !== undefined ? clampBatchLimit(partial.batchLimit) : base.batchLimit,
    messageUsageLimitUsd:
      partial.messageUsageLimitUsd !== undefined
        ? coerceMessageLimit(partial.messageUsageLimitUsd)
        : base.messageUsageLimitUsd,
    sharePromptsInPrs:
      typeof partial.sharePromptsInPrs === "boolean"
        ? partial.sharePromptsInPrs
        : base.sharePromptsInPrs,
    requireMemoryosToRespond:
      typeof partial.requireMemoryosToRespond === "boolean"
        ? partial.requireMemoryosToRespond
        : base.requireMemoryosToRespond,
    autoAddReviewer:
      typeof partial.autoAddReviewer === "boolean"
        ? partial.autoAddReviewer
        : base.autoAddReviewer,
    openPrsAs: isOpenPrsAs(partial.openPrsAs) ? partial.openPrsAs : base.openPrsAs,
    respondingToBots: isRespondingToBots(partial.respondingToBots)
      ? partial.respondingToBots
      : base.respondingToBots,
    updatedAt: new Date().toISOString(),
  };
}

export function listSlashCommandsForOrg(
  record: LabContinuityLabSettingsRecord,
): LabSlashCommand[] {
  return [...SYSTEM_SLASH_COMMANDS, ...record.customCommands];
}

export async function getLabContinuityLabSettings(
  orgId: string,
): Promise<LabContinuityLabSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => mergeRecord(raw as Omit<LabContinuityLabSettingsRecord, "updatedAt"> | undefined, {}),
  );
}

export async function patchLabContinuityLabSettings(
  orgId: string,
  partial: Partial<Omit<LabContinuityLabSettingsRecord, "updatedAt">>,
): Promise<LabContinuityLabSettingsRecord> {
  const current = await getLabContinuityLabSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}

export async function resetLabContinuityLabCustomCommands(
  orgId: string,
): Promise<LabContinuityLabSettingsRecord> {
  return patchLabContinuityLabSettings(orgId, { customCommands: [] });
}

export async function addLabContinuityLabCustomCommand(
  orgId: string,
  input: { name: string; description: string; prompt: string },
): Promise<
  { record: LabContinuityLabSettingsRecord; command: LabSlashCommand } | { error: string }
> {
  const name = normalizeCommandName(input.name);
  const description = input.description.trim();
  const prompt = input.prompt.trim();
  if (!name) return { error: "Command name is required" };
  if (!description) return { error: "Description is required" };
  if (!prompt) return { error: "Prompt is required" };
  if (SYSTEM_SLASH_COMMANDS.some((c) => c.name === name)) {
    return { error: "This command name is reserved" };
  }
  const record = await getLabContinuityLabSettings(orgId);
  if (record.customCommands.some((c) => c.name === name)) {
    return { error: "A custom command with this name already exists" };
  }
  const command: LabSlashCommand = {
    id: randomUUID(),
    name,
    description,
    prompt,
    system: false,
  };
  const next = await patchLabContinuityLabSettings(orgId, {
    customCommands: [...record.customCommands, command],
  });
  return { record: next, command };
}

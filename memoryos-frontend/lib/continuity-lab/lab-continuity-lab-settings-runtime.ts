import { DEFAULT_OPENROUTER_MODEL } from "@/lib/continuity-lab/company-model";
import { LAB_PRESET_AGENT_MODELS } from "@/lib/continuity-lab/lab-default-agent-options";
import {
  listAllSlashCommands,
  readLabContinuityLabSettings,
  type LabContinuityLabSettings,
  type LabDefaultAgentId,
  type LabSlashCommand,
} from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";
import type { LabPreferences } from "@/lib/continuity-lab/lab-preferences-storage";
import type { AskOsId } from "@/lib/continuity-lab/ask-os-preference";
import { saveOrgDefaultSandboxOs } from "@/lib/continuity-lab/sandbox-os-defaults";

export function resolveOpenRouterModelForDefaultAgent(
  agent: LabDefaultAgentId,
  runtimeOrCompanyModel?: string | null,
): string | null {
  if (agent === "agent") {
    const trimmed = runtimeOrCompanyModel?.trim();
    return trimmed || DEFAULT_OPENROUTER_MODEL;
  }
  return LAB_PRESET_AGENT_MODELS[agent];
}

export function readOrgContinuityLabSettingsSnapshot(): LabContinuityLabSettings {
  return readLabContinuityLabSettings();
}

export function readOrgSlashCommandsSnapshot(): LabSlashCommand[] {
  return listAllSlashCommands(readOrgContinuityLabSettingsSnapshot());
}

export function syncOrgSandboxOsFromSettings(settings: LabContinuityLabSettings): void {
  saveOrgDefaultSandboxOs(settings.defaultPlatform as AskOsId);
}


export function mergeLabPreferencesWithOrgPrSettings(
  userPrefs: LabPreferences,
  orgSettings: LabContinuityLabSettings,
): LabPreferences {
  return {
    ...userPrefs,
    openPullRequestsAsDrafts:
      orgSettings.openPrsAs === "memoryos" ? userPrefs.openPullRequestsAsDrafts : false,
    reviewTrigger: orgSettings.requireMemoryosToRespond
      ? "manual"
      : userPrefs.reviewTrigger,
  };
}

export function expandSlashCommandMessage(
  text: string,
  commands: LabSlashCommand[],
): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return text;
  const match = trimmed.match(/^\/([a-z0-9-]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return text;
  const name = match[1].toLowerCase();
  const rest = (match[2] ?? "").trim();
  const command = commands.find((c) => c.name.toLowerCase() === name);
  if (!command) return text;
  if (!rest) return command.prompt;
  return `${command.prompt}\n\nAdditional context from the user:\n${rest}`;
}

export type OpenHandsOrgSettingsSyncInput = {
  defaultAgent: LabDefaultAgentId;
  secureMode: boolean;
  computerUse: boolean;
  defaultPlatform: LabContinuityLabSettings["defaultPlatform"];
  runtimeModel?: string | null;
};

/**
 * Best-effort push of org session defaults to the OpenHands runtime settings API.
 * Fields without a known OpenHands schema are stored in MemoryOS only (see DEVIN_PARITY.md).
 */
export async function syncOrgSettingsToOpenHandsRuntime(
  input: OpenHandsOrgSettingsSyncInput,
): Promise<boolean> {
  try {
    const model = resolveOpenRouterModelForDefaultAgent(
      input.defaultAgent,
      input.runtimeModel,
    );
    if (!model) return false;

    const res = await fetch("/api/runtime/company-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        apiKey: null,
        providerName: "memoryos",
        baseUrl: null,
        memoryos_org_defaults: {
          secure_mode: input.secureMode,
          computer_use: input.computerUse,
          default_platform: input.defaultPlatform,
        },
      }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

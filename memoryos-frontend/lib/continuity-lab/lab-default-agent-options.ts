import {
  OPENROUTER_MODEL_OPTIONS,
  type CompanyModelSnapshot,
} from "@/lib/continuity-lab/company-model";
import type { LabDefaultAgentId } from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";

/** OpenRouter slugs used by org default-agent presets (see lab-continuity-lab-settings-runtime). */
export const LAB_PRESET_AGENT_MODELS: Record<
  Exclude<LabDefaultAgentId, "agent">,
  string
> = {
  fast: "openrouter/z-ai/glm-4.5-air:free",
  "gpt-5.5": "openrouter/openai/gpt-oss-120b",
  "opus-4.8": "openrouter/anthropic/claude-sonnet-4.5",
};

export function labelForOpenRouterModel(model: string): string {
  const trimmed = model.trim();
  const preset = OPENROUTER_MODEL_OPTIONS.find((o) => o.value === trimmed);
  if (preset) return preset.label;
  return trimmed.replace(/^openrouter\//, "") || trimmed;
}

export type LabDefaultAgentOption = {
  value: LabDefaultAgentId;
  label: string;
  modelSlug: string;
};

export function isOpenRouterConfigured(snapshot: CompanyModelSnapshot | null): boolean {
  return Boolean(snapshot?.apiKeySet && snapshot.modelReady);
}

/**
 * Org default-agent dropdown options — only presets with real OpenRouter slugs,
 * and only when the org has saved a Company Model (OpenRouter key + model).
 */
export function buildLabDefaultAgentOptions(
  snapshot: CompanyModelSnapshot | null,
): LabDefaultAgentOption[] {
  if (!isOpenRouterConfigured(snapshot)) return [];

  const companyModel = snapshot!.model.trim();
  const options: LabDefaultAgentOption[] = [
    {
      value: "agent",
      label: `Company model (${labelForOpenRouterModel(companyModel)})`,
      modelSlug: companyModel,
    },
  ];

  for (const id of ["fast", "gpt-5.5", "opus-4.8"] as const) {
    const modelSlug = LAB_PRESET_AGENT_MODELS[id];
    const baseLabel = labelForOpenRouterModel(modelSlug);
    options.push({
      value: id,
      label: id === "fast" ? `Fast mode (${baseLabel})` : baseLabel,
      modelSlug,
    });
  }

  return options;
}

export function coerceLabDefaultAgent(
  current: LabDefaultAgentId,
  options: LabDefaultAgentOption[],
): LabDefaultAgentId {
  if (options.some((o) => o.value === current)) return current;
  return options[0]?.value ?? "agent";
}

import { resolveOpenHandsRuntimeOrigin } from "./openhands-runtime-origin";
import { parseRuntimeSettings } from "../../../lib/continuity-lab/runtime-settings";
import {
  DEFAULT_BOOTSTRAP_OPENROUTER_MODEL,
  isOpenRouterModel,
  isPlausibleOpenRouterApiKey,
  normalizeOpenRouterModel,
  OPENROUTER_DEFAULT_BASE_URL,
} from "./openrouter-env";

export type OpenHandsLlmPayload = Record<string, string | null>;

export type RuntimeLlmSettingsSnapshot = {
  llm_api_key_set?: boolean;
  llm_model?: string | null;
  agent_settings?: {
    llm?: { model?: string | null };
  };
};

export async function fetchRuntimeLlmSettings(): Promise<RuntimeLlmSettingsSnapshot | null> {
  // OpenHands runtime removed — return null so callers fall back to defaults.
  return null;
}

export function buildOpenRouterLlmPayload(
  apiKey: string,
  model: string,
  options?: {
    baseUrl?: string | null;
    providerName?: string | null;
  },
): OpenHandsLlmPayload {
  const normalizedModel = normalizeOpenRouterModel(model);
  return {
    model: normalizedModel,
    api_key: apiKey,
    base_url:
      options?.baseUrl?.trim() ||
      process.env.OPENROUTER_BASE_URL?.trim() ||
      OPENROUTER_DEFAULT_BASE_URL,
    openrouter_site_url:
      process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://memoryostm.live",
    openrouter_app_name:
      options?.providerName?.trim() ||
      process.env.OPENROUTER_APP_TITLE?.trim() ||
      "MemoryOS Continuity Labs",
  };
}

export function resolveBootstrapOpenRouterModel(
  settings: RuntimeLlmSettingsSnapshot | null,
): string {
  const fromSettings =
    settings?.llm_model && isOpenRouterModel(settings.llm_model)
      ? settings.llm_model.trim()
      : null;
  const configured =
    fromSettings ||
    process.env.MEMORYOS_RUNTIME_LLM_MODEL?.trim() ||
    process.env.AGENT_A_MODEL?.trim() ||
    DEFAULT_BOOTSTRAP_OPENROUTER_MODEL;
  return normalizeOpenRouterModel(configured);
}

export function runtimeReportsLlmApiKey(
  settings: RuntimeLlmSettingsSnapshot | null,
): boolean {
  return Boolean(settings?.llm_api_key_set);
}

export function shouldPushOpenRouterKeyToRuntime(
  settings: RuntimeLlmSettingsSnapshot | null,
  userApiKey: string | null | undefined,
  options?: { force?: boolean },
): boolean {
  if (options?.force) return true;
  if (!runtimeReportsLlmApiKey(settings)) return true;
  // User's saved company model is the source of truth — re-sync when present so
  // a corrupt runtime key (e.g. sandbox error text) cannot block bootstrap.
  return isPlausibleOpenRouterApiKey(userApiKey);
}

export async function pushLlmSettingsToOpenHandsRuntime(
  _llm: OpenHandsLlmPayload,
): Promise<{
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  llm_api_key_set?: boolean;
}> {
  // OpenHands runtime removed — do not attempt to push settings. Indicate skipped.
  return {
    ok: false,
    skipped: true,
    reason:
      "OpenHands runtime removed; LLM settings are not applied to a runtime.",
  };
}

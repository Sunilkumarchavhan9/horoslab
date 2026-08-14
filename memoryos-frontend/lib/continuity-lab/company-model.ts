/**
 * OpenRouter Company Model — shared between Continuity Lab modal and runtime APIs.
 */

import {
  fetchRuntimeSettings,
  resolveModelReady,
} from "@/lib/continuity-lab/runtime";

export type OpenRouterModelOption = {
  label: string;
  value: string;
  tier: "Free" | "Premium" | "Company";
};

export const DEFAULT_OPENROUTER_MODEL = "openrouter/pareto-code";

export const OPENROUTER_MODEL_OPTIONS: OpenRouterModelOption[] = [
  { label: "Pareto Code (default)", value: DEFAULT_OPENROUTER_MODEL, tier: "Company" },
  { label: "GLM 4.5 Air", value: "openrouter/z-ai/glm-4.5-air:free", tier: "Free" },
  { label: "GPT OSS 120B", value: "openrouter/openai/gpt-oss-120b", tier: "Free" },
  { label: "Gemma 2 9B", value: "openrouter/google/gemma-2-9b-it:free", tier: "Free" },
  { label: "Gemma 3 27B", value: "openrouter/google/gemma-3-27b-it:free", tier: "Free" },
  { label: "Llama 3.3 70B", value: "openrouter/meta-llama/llama-3.3-70b-instruct:free", tier: "Free" },
  { label: "Claude Sonnet 4.5", value: "openrouter/anthropic/claude-sonnet-4.5", tier: "Premium" },
  { label: "Gemini 2.5 Pro", value: "openrouter/google/gemini-2.5-pro", tier: "Premium" },
  { label: "DeepSeek V3.1", value: "openrouter/deepseek/deepseek-chat-v3.1", tier: "Premium" },
  { label: "Custom OpenRouter model", value: "openrouter/provider/model", tier: "Company" },
];

export const CUSTOM_OPENROUTER_MODEL_VALUE = "openrouter/provider/model";

export function resolveCompanyModelFormState(savedModel: string): {
  model: string;
  customModel: string;
} {
  const trimmed = savedModel.trim();
  const preset = OPENROUTER_MODEL_OPTIONS.find(
    (option) => option.value === trimmed && option.value !== CUSTOM_OPENROUTER_MODEL_VALUE,
  );
  if (preset) {
    return { model: preset.value, customModel: "" };
  }
  if (trimmed) {
    return { model: CUSTOM_OPENROUTER_MODEL_VALUE, customModel: trimmed };
  }
  return { model: DEFAULT_OPENROUTER_MODEL, customModel: "" };
}

export function resolveEffectiveOpenRouterModel(model: string, customModel: string): string {
  const custom = customModel.trim();
  if (model === CUSTOM_OPENROUTER_MODEL_VALUE) {
    return custom ? normalizeOpenRouterModel(custom) : "";
  }
  if (custom) {
    return normalizeOpenRouterModel(custom);
  }
  return model.trim();
}

export function isPlausibleOpenRouterApiKey(key: string | null | undefined): boolean {
  const trimmed = key?.trim();
  if (!trimmed || trimmed.length < 20) return false;
  if (/^500:/i.test(trimmed)) return false;
  if (/sandbox entered error state/i.test(trimmed)) return false;
  if (/^oh-agent-server-/i.test(trimmed)) return false;
  if (!trimmed.startsWith("sk-or-")) return false;
  if (/\s/.test(trimmed)) return false;
  return true;
}

export function normalizeOpenRouterModel(model: string): string {
  const trimmed = model.trim();
  return trimmed.startsWith("openrouter/") ? trimmed : `openrouter/${trimmed}`;
}

export type CompanyModelSnapshot = {
  model: string;
  providerName: string;
  apiKeySet: boolean;
  runtimeModel: string | null;
  modelReady: boolean;
};

export async function loadCompanyModelSnapshot(): Promise<CompanyModelSnapshot> {
  const [settings, configRes] = await Promise.all([
    fetchRuntimeSettings(),
    fetch("/api/runtime/company-model", { cache: "no-store" }).catch(() => null),
  ]);

  let savedModel = settings?.llm_model?.trim() ?? "";
  let providerName = "MemoryOS Continuity Labs";
  let apiKeySet = Boolean(settings?.llm_api_key_set);

  if (configRes?.ok) {
    const payload = (await configRes.json().catch(() => null)) as {
      data?: { model?: string; providerName?: string | null; apiKeySet?: boolean };
    } | null;
    const data = payload?.data;
    if (typeof data?.model === "string" && data.model.trim()) {
      savedModel = data.model.trim();
    }
    if (typeof data?.providerName === "string" && data.providerName.trim()) {
      providerName = data.providerName.trim();
    }
    if (typeof data?.apiKeySet === "boolean") {
      apiKeySet = data.apiKeySet;
    }
  }

  const model = savedModel || DEFAULT_OPENROUTER_MODEL;
  return {
    model,
    providerName,
    apiKeySet,
    runtimeModel: settings?.llm_model?.trim() ?? null,
    modelReady: resolveModelReady({
      apiKeySet,
      savedModel: model,
      runtimeSettings: settings,
    }),
  };
}

export type SaveCompanyModelInput = {
  apiKey?: string;
  model: string;
  providerName?: string;
};

export type SaveCompanyModelResult = {
  ok: boolean;
  modelReady: boolean;
  error?: string;
  runtimeSyncReason?: string;
};

export async function saveCompanyModel(
  input: SaveCompanyModelInput,
): Promise<SaveCompanyModelResult> {
  const model = normalizeOpenRouterModel(input.model);
  const trimmedKey = input.apiKey?.trim() ?? "";

  if (trimmedKey && !isPlausibleOpenRouterApiKey(trimmedKey)) {
    return {
      ok: false,
      modelReady: false,
      error:
        "That does not look like an OpenRouter key. Paste a key from https://openrouter.ai/keys (starts with sk-or-v1-).",
    };
  }

  const snapshot = await loadCompanyModelSnapshot();
  if (!trimmedKey && !snapshot.apiKeySet) {
    return {
      ok: false,
      modelReady: false,
      error: "Paste your OpenRouter API key, then save.",
    };
  }

  const putRes = await fetch("/api/runtime/company-model", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(trimmedKey ? { apiKey: trimmedKey } : {}),
      model,
      baseUrl: null,
      providerName: input.providerName?.trim() || snapshot.providerName,
    }),
  });

  const putPayload = (await putRes.json().catch(() => null)) as {
    error?: string;
    message?: string;
    runtimeSync?: { ok?: boolean; reason?: string };
  } | null;

  if (!putRes.ok) {
    return {
      ok: false,
      modelReady: false,
      error: putPayload?.message || putPayload?.error || "Could not save company model.",
    };
  }

  if (putPayload?.runtimeSync?.ok === false) {
    return {
      ok: false,
      modelReady: false,
      error:
        putPayload.runtimeSync.reason ??
        "Saved to your account but Continuity Labs runtime did not accept the API key.",
    };
  }

  const syncRes = await fetch("/api/runtime/openrouter-provider-key?force=1", {
    method: "POST",
    cache: "no-store",
  });
  const syncPayload = (await syncRes.json().catch(() => null)) as
    | { ok?: boolean; skipped?: boolean; reason?: string }
    | null;
  if (!syncRes.ok || (syncPayload?.ok === false && !syncPayload?.skipped)) {
    return {
      ok: false,
      modelReady: false,
      error:
        syncPayload?.reason ?? "Could not sync OpenRouter key to Continuity Labs runtime.",
    };
  }

  const after = await loadCompanyModelSnapshot();

  return { ok: true, modelReady: after.modelReady };
}

export function parseGitHubPrUrl(url: string): {
  owner: string;
  repo: string;
  pr: number;
  fullName: string;
} | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!parsed.hostname.replace(/^www\./, "").includes("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const pullIdx = parts.findIndex((p) => p === "pull");
    if (pullIdx < 2 || pullIdx + 1 >= parts.length) return null;
    const owner = parts[0];
    const repo = parts[1];
    const pr = Number.parseInt(parts[pullIdx + 1], 10);
    if (!owner || !repo || !Number.isFinite(pr) || pr <= 0) return null;
    return { owner, repo, pr, fullName: `${owner}/${repo}` };
  } catch {
    return null;
  }
}

export function projectIdFromRepo(fullName: string): string {
  return fullName.replace(/\//g, "-").toLowerCase();
}

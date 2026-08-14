export const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_BOOTSTRAP_OPENROUTER_MODEL = "openrouter/pareto-code";

/** Optional platform default for hosted demos — not required for end users. */
export function readPlatformOpenRouterApiKey(): string | null {
  const key =
    process.env.PLATFORM_OPENROUTER_KEY?.trim() ??
    process.env.OPENROUTER_API_KEY?.trim() ??
    "";
  if (!key || key === "sk-or-v1_replace_with_openrouter_key" || key.startsWith("sk-or-v1_replace")) {
    return null;
  }
  return key;
}

export function isOpenRouterModel(model: string | undefined | null): boolean {
  return Boolean(model?.trim().startsWith("openrouter/"));
}

export function normalizeOpenRouterModel(model: string): string {
  const trimmed = model.trim();
  return trimmed.startsWith("openrouter/") ? trimmed : `openrouter/${trimmed}`;
}

/** Reject runtime error text or other values mistaken for OpenRouter keys. */
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

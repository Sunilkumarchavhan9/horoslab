export type RuntimeSettings = {
  llm_api_key_set?: boolean;
  llm_model?: string | null;
  agent_settings?: {
    llm?: { model?: string | null };
  };
};

function lookupNestedString(
  obj: Record<string, unknown> | undefined,
  path: string,
): string | null {
  if (!obj) return null;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

/** OpenHands V1 nests LLM config under agent_settings; normalize for callers. */
export function parseRuntimeSettings(raw: RuntimeSettings | null): RuntimeSettings | null {
  if (!raw) return null;
  const nestedModel =
    lookupNestedString(raw.agent_settings as Record<string, unknown> | undefined, "llm.model") ??
    raw.agent_settings?.llm?.model?.trim() ??
    null;
  const llm_model = raw.llm_model?.trim() || nestedModel || null;
  return {
    ...raw,
    llm_api_key_set: Boolean(raw.llm_api_key_set),
    llm_model,
  };
}

export function resolveModelReady(input: {
  apiKeySet?: boolean;
  savedModel?: string | null;
  runtimeSettings?: RuntimeSettings | null;
}): boolean {
  const settings = parseRuntimeSettings(input.runtimeSettings ?? null);
  if (settings?.llm_api_key_set && settings.llm_model) {
    return true;
  }
  return Boolean(input.apiKeySet && input.savedModel?.trim());
}

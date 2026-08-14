import { listEpochAiModels, type EpochAiProvider } from "./aiRuntime";
import { readEpochAiProviderConfig } from "./aiProviders";

export type EpochAiDiscoveredModel = {
  provider: EpochAiProvider;
  model: string;
  capabilities: string[];
  contextWindow: number;
  source: "provider" | "catalog";
};

function catalogModels(provider: EpochAiProvider): EpochAiDiscoveredModel[] {
  return listEpochAiModels().filter((model) => model.provider === provider).map((model) => ({ provider: model.provider, model: model.model, capabilities: [...model.capabilities], contextWindow: model.contextWindow, source: "catalog" }));
}

function modelEndpoint(provider: EpochAiProvider, endpoint: string): string | null {
  if (provider === "ollama") return endpoint.replace(/\/api\/chat\/?$/, "/api/tags");
  if (provider === "gemini") return endpoint.replace(/\/$/, "");
  if (["openai", "openrouter", "deepseek", "vllm", "lm_studio", "nvidia_nim"].includes(provider)) return endpoint.replace(/\/chat\/completions\/?$/, "/models");
  return null;
}

export async function discoverEpochAiModels(input: { provider: EpochAiProvider; timeoutMs?: number; fetch?: typeof fetch; env?: NodeJS.ProcessEnv }): Promise<EpochAiDiscoveredModel[]> {
  const fallback = catalogModels(input.provider);
  let config;
  try { config = readEpochAiProviderConfig(input.provider, input.env); } catch { return fallback; }
  const endpoint = modelEndpoint(input.provider, config.endpoint);
  if (!endpoint) return fallback;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 5_000);
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${config.apiKey}` };
    if (input.provider === "gemini") { delete headers.Authorization; headers["x-goog-api-key"] = config.apiKey; }
    const response = await (input.fetch ?? fetch)(endpoint, { method: "GET", headers, signal: controller.signal });
    if (!response.ok) return fallback;
    const body = await response.json() as { models?: Array<{ name?: string; id?: string; capabilities?: string[]; inputTokenLimit?: number }>; data?: Array<{ id?: string }> };
    const names = input.provider === "ollama"
      ? (body.models ?? []).map((model) => ({ name: model.name, capabilities: ["reasoning"], contextWindow: model.inputTokenLimit ?? 128_000 }))
      : input.provider === "gemini"
        ? (body.models ?? []).map((model) => ({ name: model.name?.replace(/^models\//, ""), capabilities: ["reasoning", "structured_output", "vision"], contextWindow: model.inputTokenLimit ?? 1_000_000 }))
        : (body.data ?? []).map((model) => ({ name: model.id, capabilities: fallback.find((item) => item.model === model.id)?.capabilities ?? ["reasoning"], contextWindow: fallback.find((item) => item.model === model.id)?.contextWindow ?? 128_000 }));
    const discovered = names.filter((model): model is { name: string; capabilities: string[]; contextWindow: number } => typeof model.name === "string" && model.name.length > 0).map((model) => ({ provider: input.provider, model: model.name, capabilities: model.capabilities, contextWindow: model.contextWindow, source: "provider" as const }));
    return discovered.length > 0 ? discovered : fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

export async function discoverEpochAiProviderModels(input: { providers: EpochAiProvider[]; timeoutMs?: number; fetch?: typeof fetch; env?: NodeJS.ProcessEnv }): Promise<EpochAiDiscoveredModel[]> {
  const results = await Promise.all(input.providers.map((provider) => discoverEpochAiModels({ ...input, provider })));
  return results.flat();
}

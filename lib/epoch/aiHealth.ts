import { EpochAiProviderError, readEpochAiProviderConfig } from "./aiProviders";
import type { EpochAiProvider } from "./aiRuntime";

export type EpochAiProviderHealth = {
  provider: EpochAiProvider;
  configured: boolean;
  reachable: boolean;
  status: "healthy" | "degraded" | "offline" | "unconfigured";
  latencyMs: number | null;
  httpStatus: number | null;
  errorCode?: EpochAiProviderError["code"];
};

function healthRequest(provider: EpochAiProvider, endpoint: string): { url: string; method: "GET" | "HEAD" } {
  if (["openai", "openrouter", "deepseek"].includes(provider)) {
    return { url: endpoint.replace(/\/chat\/completions\/?$/i, "/models"), method: "GET" };
  }
  if (provider === "ollama") {
    return { url: endpoint.replace(/\/api\/chat\/?$/i, "/api/tags"), method: "GET" };
  }
  return { url: endpoint, method: "HEAD" };
}

export async function probeEpochAiProvider(input: { provider: EpochAiProvider; timeoutMs?: number; fetch?: typeof fetch }): Promise<EpochAiProviderHealth> {
  let config;
  try {
    config = readEpochAiProviderConfig(input.provider);
  } catch (error) {
    return {
      provider: input.provider,
      configured: false,
      reachable: false,
      status: "unconfigured",
      latencyMs: null,
      httpStatus: null,
      errorCode: error instanceof EpochAiProviderError ? error.code : "provider_unavailable",
    };
  }
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 5_000);
  try {
    const request = healthRequest(input.provider, config.endpoint);
    const headers: Record<string, string> = { Authorization: `Bearer ${config.apiKey}` };
    if (input.provider === "anthropic") {
      headers["x-api-key"] = config.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      delete headers.Authorization;
    }
    if (input.provider === "gemini") {
      headers["x-goog-api-key"] = config.apiKey;
      delete headers.Authorization;
    }
    const response = await (input.fetch ?? fetch)(request.url, {
      method: request.method,
      headers,
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startedAt;
    return {
      provider: input.provider,
      configured: true,
      reachable: response.status < 500,
      status: response.status < 400 ? "healthy" : response.status < 500 ? "degraded" : "offline",
      latencyMs,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      provider: input.provider,
      configured: true,
      reachable: false,
      status: "offline",
      latencyMs: Date.now() - startedAt,
      httpStatus: null,
      errorCode: controller.signal.aborted ? "provider_unavailable" : error instanceof EpochAiProviderError ? error.code : "provider_unavailable",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeEpochAiProviders(input: { providers: EpochAiProvider[]; timeoutMs?: number; fetch?: typeof fetch }): Promise<EpochAiProviderHealth[]> {
  return Promise.all(input.providers.map((provider) => probeEpochAiProvider({ provider, timeoutMs: input.timeoutMs, fetch: input.fetch })));
}

import type { CompanyModelConfig } from "./companyModelProvider";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strip MemoryOS `openrouter/` prefix for OpenRouter HTTP API model ids. */
export function openRouterApiModelId(model: string): string {
  const trimmed = model.trim();
  return trimmed.startsWith("openrouter/") ? trimmed.slice("openrouter/".length) : trimmed;
}

export type CompanyModelChatOptions = {
  config: CompanyModelConfig;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
};

export async function invokeCompanyModelChat(options: CompanyModelChatOptions): Promise<string> {
  const baseUrl = (options.config.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = openRouterApiModelId(options.config.model);
  const jsonMode = options.jsonMode !== false;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${options.config.apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://memoryostm.live",
      "X-Title": process.env.OPENROUTER_APP_TITLE ?? "MemoryOS Operational Wiki",
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1800,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userMessage },
      ],
    }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      isRecord(payload) &&
      isRecord(payload.error) &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `OpenRouter request failed (${response.status})`;
    throw new Error(msg);
  }

  if (isRecord(payload) && Array.isArray(payload.choices)) {
    const first = payload.choices[0];
    if (
      isRecord(first) &&
      isRecord(first.message) &&
      typeof first.message.content === "string"
    ) {
      return first.message.content;
    }
  }

  throw new Error("OpenRouter returned an empty response.");
}

export async function invokeCompanyModelJson<T>(options: CompanyModelChatOptions): Promise<T> {
  const raw = await invokeCompanyModelChat({ ...options, jsonMode: true });
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

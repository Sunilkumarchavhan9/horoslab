import { buildEpochAiCostEvidence, getEpochAiModel, redactEpochAiText, type EpochAiProvider, type EpochAiResponse } from "./aiRuntime";

export class EpochAiProviderError extends Error {
  constructor(public readonly code: "rate_limited" | "provider_unavailable" | "invalid_response" | "context_exceeded" | "timeout", message: string, public readonly retryAfterMs?: number) { super(message); }
}

export type EpochAiProviderConfig = { provider: EpochAiProvider; endpoint: string; apiKey: string; fetch?: typeof fetch };
export type EpochAiCompletionInput = { model: string; prompt: string; maxOutputTokens: number; requireJson?: boolean; reasoning?: boolean; signal?: AbortSignal };
export type EpochAiStreamInput = EpochAiCompletionInput & { signal?: AbortSignal; onDelta: (delta: string) => void | Promise<void> };

function providerRequest(input: EpochAiCompletionInput, config: EpochAiProviderConfig): { headers: Record<string, string>; body: string } {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.provider === "anthropic") {
    headers["x-api-key"] = config.apiKey;
    headers["anthropic-version"] = "2023-06-01";
    return { headers, body: JSON.stringify({ model: input.model, max_tokens: input.maxOutputTokens, messages: [{ role: "user", content: input.prompt }] }) };
  }
  if (config.provider === "gemini") {
    headers["x-goog-api-key"] = config.apiKey;
    return { headers, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: input.prompt }] }], generationConfig: { maxOutputTokens: input.maxOutputTokens, ...(input.requireJson ? { responseMimeType: "application/json" } : {}) } }) };
  }
  if (config.provider === "ollama") {
    return {
      headers,
      body: JSON.stringify({
        model: input.model,
        messages: [{ role: "user", content: input.prompt }],
        stream: false,
        options: { num_predict: input.maxOutputTokens },
        ...(input.requireJson ? { format: "json" } : {}),
      }),
    };
  }
  headers.Authorization = `Bearer ${config.apiKey}`;
  return { headers, body: JSON.stringify({ model: input.model, messages: [{ role: "user", content: input.prompt }], max_tokens: input.maxOutputTokens, response_format: input.requireJson ? { type: "json_object" } : undefined, ...(input.reasoning ? { reasoning: { enabled: true } } : {}) }) };
}

function providerOutput(config: EpochAiProviderConfig, body: unknown): { output: string; inputTokens?: number; outputTokens?: number; reasoningDetails?: unknown } | null {
  const value = body as Record<string, any> | null;
  if (config.provider === "anthropic") return { output: typeof value?.content?.[0]?.text === "string" ? value.content[0].text : "", inputTokens: value?.usage?.input_tokens, outputTokens: value?.usage?.output_tokens };
  if (config.provider === "gemini") return { output: typeof value?.candidates?.[0]?.content?.parts?.[0]?.text === "string" ? value.candidates[0].content.parts[0].text : "", inputTokens: value?.usageMetadata?.promptTokenCount, outputTokens: value?.usageMetadata?.candidatesTokenCount };
  if (config.provider === "ollama") return {
    output: typeof value?.message?.content === "string" ? value.message.content : (typeof value?.choices?.[0]?.message?.content === "string" ? value.choices[0].message.content : ""),
    inputTokens: value?.prompt_eval_count ?? value?.usage?.prompt_tokens,
    outputTokens: value?.eval_count ?? value?.usage?.completion_tokens,
  };
  return { output: typeof value?.choices?.[0]?.message?.content === "string" ? value.choices[0].message.content : "", inputTokens: value?.usage?.prompt_tokens, outputTokens: value?.usage?.completion_tokens, reasoningDetails: value?.choices?.[0]?.message?.reasoning_details };
}

function providerStreamRequest(input: EpochAiStreamInput, config: EpochAiProviderConfig): { endpoint: string; headers: Record<string, string>; body: string } {
  const request = providerRequest(input, config);
  if (config.provider === "anthropic") return { endpoint: config.endpoint, headers: { ...request.headers, Accept: "text/event-stream" }, body: JSON.stringify({ model: input.model, max_tokens: input.maxOutputTokens, stream: true, messages: [{ role: "user", content: input.prompt }] }) };
  if (config.provider === "gemini") return { endpoint: `${config.endpoint.replace(/\/$/, "")}/${input.model}:streamGenerateContent?alt=sse`, headers: { ...request.headers, Accept: "text/event-stream" }, body: request.body };
  return { endpoint: config.endpoint, headers: request.headers, body: JSON.stringify({ model: input.model, messages: [{ role: "user", content: input.prompt }], max_tokens: input.maxOutputTokens, stream: true, response_format: input.requireJson ? { type: "json_object" } : undefined, ...(input.reasoning ? { reasoning: { enabled: true } } : {}) }) };
}

export function readEpochAiProviderConfig(provider: EpochAiProvider, env: NodeJS.ProcessEnv = process.env): EpochAiProviderConfig {
  const prefix = provider.toUpperCase();
  const defaults: Partial<Record<EpochAiProvider, string>> = {
    openai: "https://api.openai.com/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    anthropic: "https://api.anthropic.com/v1/messages",
    gemini: "https://generativelanguage.googleapis.com/v1beta/models",
    deepseek: "https://api.deepseek.com/chat/completions",
    ollama: "http://127.0.0.1:11434/api/chat",
    vllm: "http://127.0.0.1:8000/v1/chat/completions",
    modal: undefined,
    lm_studio: "http://127.0.0.1:1234/v1/chat/completions",
    nvidia_nim: "https://integrate.api.nvidia.com/v1/chat/completions",
  };
  const configuredEndpoint = env[`EPOCH_${prefix}_AI_ENDPOINT`] ?? env[`EPOCH_${prefix}_ENDPOINT`] ?? defaults[provider];
  const modalEndpoint = provider === "modal" ? env.EPOCH_RUNTIME_MODAL_ENDPOINT : undefined;
  const endpoint = configuredEndpoint ?? (modalEndpoint ? `${modalEndpoint.replace(/\/+$/, "")}/chat/completions` : undefined);
  const apiKey = env[`EPOCH_${prefix}_AI_API_KEY`] ?? env[`EPOCH_${prefix}_API_KEY`] ?? env[`${prefix}_API_KEY`] ?? (provider === "modal" ? env.EPOCH_RUNTIME_MODAL_TOKEN : undefined) ?? (["local", "ollama", "vllm", "lm_studio"].includes(provider) ? "local" : undefined);
  if (!endpoint || !apiKey) throw new EpochAiProviderError("provider_unavailable", `epoch_ai_${provider}_provider_not_configured`);
  if (!["local", "ollama", "vllm", "lm_studio"].includes(provider) && !/^https:\/\//i.test(endpoint)) throw new EpochAiProviderError("provider_unavailable", "epoch_ai_remote_endpoint_must_use_https");
  return { provider, endpoint, apiKey };
}

export async function completeEpochAi(input: EpochAiCompletionInput, config: EpochAiProviderConfig): Promise<EpochAiResponse> {
  const startedAt = Date.now();
  const model = getEpochAiModel(config.provider, input.model);
  if (!model) throw new EpochAiProviderError("invalid_response", "epoch_ai_model_not_found");
  const inputTokens = Math.ceil(input.prompt.length / 4);
  if (inputTokens + input.maxOutputTokens > model.contextWindow) throw new EpochAiProviderError("context_exceeded", "epoch_ai_context_window_exceeded");
  const http = config.fetch ?? fetch;
  let response: Response;
  try {
    const request = providerRequest({ ...input, model: input.model }, config);
    const headers = request.headers;
    if (config.provider === "openrouter") {
      if (process.env.EPOCH_OPENROUTER_HTTP_REFERER) headers["HTTP-Referer"] = process.env.EPOCH_OPENROUTER_HTTP_REFERER;
      if (process.env.EPOCH_OPENROUTER_X_TITLE) headers["X-Title"] = process.env.EPOCH_OPENROUTER_X_TITLE;
    }
    response = await http(config.provider === "gemini" && !config.endpoint.endsWith(`/${input.model}:generateContent`) ? `${config.endpoint.replace(/\/$/, "")}/${input.model}:generateContent` : config.endpoint, { method: "POST", headers, signal: input.signal, body: request.body });
  } catch (error) {
    if (input.signal?.aborted) throw new EpochAiProviderError("timeout", "epoch_ai_provider_timeout");
    throw new EpochAiProviderError("provider_unavailable", error instanceof Error ? error.message : "provider_request_failed");
  }
  if (response.status === 429) { const retryAfter = Number(response.headers.get("retry-after") ?? 1); throw new EpochAiProviderError("rate_limited", "epoch_ai_provider_rate_limited", retryAfter * 1000); }
  if (!response.ok) throw new EpochAiProviderError("provider_unavailable", `epoch_ai_provider_http_${response.status}`);
  const body = await response.json().catch(() => null);
  const parsed = providerOutput(config, body);
  const output = parsed?.output;
  if (typeof output !== "string") throw new EpochAiProviderError("invalid_response", "epoch_ai_provider_output_missing");
  if (input.requireJson) { try { JSON.parse(output); } catch { throw new EpochAiProviderError("invalid_response", "epoch_ai_structured_output_invalid"); } }
  const outputTokens = parsed?.outputTokens ?? Math.ceil(output.length / 4);
  const redacted = redactEpochAiText(output);
  return { output: redacted.value, structured: Boolean(input.requireJson), providerMetadata: parsed?.reasoningDetails === undefined ? undefined : { reasoningDetails: parsed.reasoningDetails }, evidence: { ...buildEpochAiCostEvidence({ provider: config.provider, model: input.model, inputTokens: parsed?.inputTokens ?? inputTokens, outputTokens }), latencyMs: Date.now() - startedAt } };
}

export async function streamEpochAi(input: EpochAiStreamInput, config: EpochAiProviderConfig): Promise<EpochAiResponse> {
  const startedAt = Date.now();
  const model = getEpochAiModel(config.provider, input.model);
  if (!model) throw new EpochAiProviderError("invalid_response", "epoch_ai_model_not_found");
  const inputTokens = Math.ceil(input.prompt.length / 4);
  if (inputTokens + input.maxOutputTokens > model.contextWindow) throw new EpochAiProviderError("context_exceeded", "epoch_ai_context_window_exceeded");
  const http = config.fetch ?? fetch;
  const request = providerStreamRequest(input, config);
  const headers = request.headers;
  if (config.provider === "openrouter") {
    if (process.env.EPOCH_OPENROUTER_HTTP_REFERER) headers["HTTP-Referer"] = process.env.EPOCH_OPENROUTER_HTTP_REFERER;
    if (process.env.EPOCH_OPENROUTER_X_TITLE) headers["X-Title"] = process.env.EPOCH_OPENROUTER_X_TITLE;
  }
  let response: Response;
  try {
    response = await http(request.endpoint, { method: "POST", headers, signal: input.signal, body: request.body });
  } catch (error) {
    if (input.signal?.aborted) throw new EpochAiProviderError("provider_unavailable", "epoch_ai_stream_aborted");
    throw new EpochAiProviderError("provider_unavailable", error instanceof Error ? error.message : "epoch_ai_provider_failed");
  }
  if (response.status === 429) { const retryAfter = Number(response.headers.get("retry-after") ?? 1); throw new EpochAiProviderError("rate_limited", "epoch_ai_provider_rate_limited", retryAfter * 1000); }
  if (!response.ok || !response.body) throw new EpochAiProviderError("provider_unavailable", `epoch_ai_provider_http_${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  let reasoningDetails: unknown;
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  const consume = async (line: string) => {
    if (!line.startsWith("data:")) return;
    const value = line.slice(5).trim();
    if (!value || value === "[DONE]") return;
    const chunk = JSON.parse(value) as { choices?: Array<{ delta?: { content?: string; reasoning_details?: unknown } }>; usage?: typeof usage; delta?: { type?: string; text?: string }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
    usage = chunk.usage ?? (chunk.usageMetadata ? { prompt_tokens: chunk.usageMetadata.promptTokenCount, completion_tokens: chunk.usageMetadata.candidatesTokenCount } : usage);
    const text = config.provider === "anthropic"
      ? (chunk.delta?.type === "text_delta" ? chunk.delta.text : undefined)
      : config.provider === "gemini"
        ? chunk.candidates?.[0]?.content?.parts?.[0]?.text
        : chunk.choices?.[0]?.delta?.content;
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.reasoning_details !== undefined) reasoningDetails = delta.reasoning_details;
    if (typeof text === "string") { output += text; await input.onDelta(text); }
  };
  try {
    while (true) {
      const next = await reader.read();
      buffer += decoder.decode(next.value ?? new Uint8Array(), { stream: !next.done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) await consume(line);
      if (next.done) break;
    }
    if (buffer) await consume(buffer);
  } catch (error) {
    if (input.signal?.aborted) throw new EpochAiProviderError("provider_unavailable", "epoch_ai_stream_aborted");
    if (error instanceof EpochAiProviderError) throw error;
    throw new EpochAiProviderError("invalid_response", "epoch_ai_stream_invalid_event");
  } finally {
    reader.releaseLock();
  }
  if (!output) throw new EpochAiProviderError("invalid_response", "epoch_ai_provider_output_missing");
  if (input.requireJson) { try { JSON.parse(output); } catch { throw new EpochAiProviderError("invalid_response", "epoch_ai_structured_output_invalid"); } }
  const redacted = redactEpochAiText(output);
  return { output: redacted.value, structured: Boolean(input.requireJson), providerMetadata: reasoningDetails === undefined ? undefined : { reasoningDetails }, evidence: { ...buildEpochAiCostEvidence({ provider: config.provider, model: input.model, inputTokens: usage?.prompt_tokens ?? inputTokens, outputTokens: usage?.completion_tokens ?? Math.ceil(output.length / 4) }), latencyMs: Date.now() - startedAt } };
}

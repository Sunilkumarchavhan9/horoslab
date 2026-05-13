/**
 * Agent Router — Unified OpenRouter utility for MemoryOS AI operations.
 *
 * Agent A (fast, classification): Explain, Promote, classification tasks.
 * Agent B (deep reasoning): Autopilot, Compile, conflict detection, planning.
 *
 * All calls are server-side only. Never expose API keys to the client.
 */

type AgentId = "agent-a" | "agent-b";

// Ordered list of free models to try when the primary fails.
// The configured AGENT_A/B_MODEL is always tried first.
const FREE_FALLBACKS_A: string[] = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-3-27b-it:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

const FREE_FALLBACKS_B: string[] = [
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

function resolveModel(agentId: AgentId): string {
  if (agentId === "agent-b") {
    return process.env.AGENT_B_MODEL?.trim() || "google/gemma-3-27b-it:free";
  }
  return (
    process.env.AGENT_A_MODEL?.trim() || "meta-llama/llama-3.2-3b-instruct:free"
  );
}

function resolveFallbacks(agentId: AgentId): string[] {
  return agentId === "agent-b" ? FREE_FALLBACKS_B : FREE_FALLBACKS_A;
}

function isRetriable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message === "OpenRouter returned an empty response." ||
    /no endpoints found|provider returned error|response_format|json|overloaded|rate.?limit|529|503/i.test(
      error.message,
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface AgentChatOptions {
  agentId: AgentId;
  systemPrompt: string;
  userMessage: string;
  /** Max output tokens (default 800) */
  maxTokens?: number;
  /** Request JSON response format (default true) */
  jsonMode?: boolean;
  /** Temperature (default 0.2) */
  temperature?: number;
}

/** Single HTTP call to OpenRouter for one model. */
async function callOpenRouter(
  model: string,
  options: AgentChatOptions,
  jsonMode: boolean,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set.");

  const baseUrl = (
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
  ).replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer":
        process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title":
        process.env.OPENROUTER_APP_TITLE ?? "MemoryOS Living Memory Demo",
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 800,
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
    throw new Error(`${msg} (HTTP ${response.status})`);
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

/** Try one model: with JSON mode first, then plain text on retriable errors. */
async function tryModel(
  model: string,
  options: AgentChatOptions,
): Promise<string> {
  const wantsJson = options.jsonMode !== false;
  if (!wantsJson) return callOpenRouter(model, options, false);
  try {
    return await callOpenRouter(model, options, true);
  } catch (err) {
    if (isRetriable(err)) return callOpenRouter(model, options, false);
    throw err;
  }
}

/**
 * Invoke an agent with automatic model fallback.
 * The configured primary model is tried first; on retriable errors the next
 * free model in the fallback list is tried automatically.
 */
export async function invokeAgent(options: AgentChatOptions): Promise<string> {
  const primary = resolveModel(options.agentId);
  const fallbacks = resolveFallbacks(options.agentId);
  const candidates = [primary, ...fallbacks.filter((m) => m !== primary)];

  let lastError: unknown = new Error("No models available.");
  for (const model of candidates) {
    try {
      const result = await tryModel(model, options);
      if (model !== primary) {
        console.warn(
          `[agent-router] Primary "${primary}" unavailable; used fallback "${model}".`,
        );
      }
      return result;
    } catch (err) {
      lastError = err;
      if (!isRetriable(err)) break; // auth / unknown error — don't try more
      console.warn(
        `[agent-router] Model "${model}" failed (${
          err instanceof Error ? err.message : String(err)
        }); trying next…`,
      );
    }
  }
  throw lastError;
}

/**
 * Invoke an agent and parse JSON from the response.
 * JSON-mode → plain-text retries and model fallbacks are handled inside
 * invokeAgent, so this function only needs to strip markdown fences and parse.
 */
export async function invokeAgentJson<T>(
  options: AgentChatOptions,
): Promise<T> {
  const raw = await invokeAgent({ ...options, jsonMode: true });
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

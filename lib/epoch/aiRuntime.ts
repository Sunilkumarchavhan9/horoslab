export type EpochAiProvider = "openai" | "openrouter" | "local" | "private" | "anthropic" | "gemini" | "deepseek" | "ollama" | "vllm" | "modal" | "lm_studio" | "nvidia_nim";
export type EpochAiModel = { provider: EpochAiProvider; model: string; inputCostPer1k: number; outputCostPer1k: number; contextWindow: number; capabilities: string[] };
export type EpochAiRequest = { provider: EpochAiProvider; model: string; prompt: string; maxOutputTokens: number; missionId?: string };
export type EpochAiCostEvidence = { provider: EpochAiProvider; model: string; inputTokens: number; outputTokens: number; estimatedCostCents: number; pricingVersion: string; latencyMs?: number };
export type EpochAiResponse = { output: string; evidence: EpochAiCostEvidence; structured: boolean; providerMetadata?: { reasoningDetails?: unknown } };
export type EpochAiPromptTemplate = { id: string; version: string; template: string };

const CATALOG: EpochAiModel[] = [
  { provider: "openai", model: "gpt-4.1", inputCostPer1k: 1, outputCostPer1k: 4, contextWindow: 1_000_000, capabilities: ["reasoning", "tools", "structured_output"] },
  { provider: "openrouter", model: "openrouter/free", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "structured_output"] },
  { provider: "local", model: "local-default", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "structured_output"] },
  { provider: "private", model: "private-default", inputCostPer1k: 0, outputCostPer1k: 1, contextWindow: 200_000, capabilities: ["reasoning", "tools", "structured_output"] },
  { provider: "anthropic", model: "claude-3-5-sonnet", inputCostPer1k: 0.3, outputCostPer1k: 1.5, contextWindow: 200_000, capabilities: ["reasoning", "tools", "structured_output"] },
  { provider: "gemini", model: "gemini-2.0-flash", inputCostPer1k: 0.01, outputCostPer1k: 0.04, contextWindow: 1_000_000, capabilities: ["reasoning", "tools", "structured_output", "vision"] },
  { provider: "deepseek", model: "deepseek-chat", inputCostPer1k: 0.014, outputCostPer1k: 0.28, contextWindow: 64_000, capabilities: ["reasoning", "tools", "structured_output"] },
  { provider: "ollama", model: "llama3.2", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "tools", "structured_output"] },
  { provider: "ollama", model: "qwen2.5:3b", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 32_768, capabilities: ["reasoning", "structured_output"] },
  { provider: "vllm", model: "local-model", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "tools", "structured_output"] },
  { provider: "modal", model: "MiniMaxAI/SynLogic-7B", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "structured_output"] },
  { provider: "lm_studio", model: "local-model", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "tools", "structured_output"] },
  { provider: "nvidia_nim", model: "meta/llama-3.1-8b-instruct", inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "tools", "structured_output"] },
];

export function listEpochAiModels(): EpochAiModel[] { return CATALOG.map((model) => ({ ...model, capabilities: [...model.capabilities] })); }
export function getEpochAiModel(provider: EpochAiProvider, model: string): EpochAiModel | null {
  const known = CATALOG.find((entry) => entry.provider === provider && entry.model === model);
  if (known) return known;
  if ((provider === "ollama" || provider === "modal") && model.trim()) return { provider, model, inputCostPer1k: 0, outputCostPer1k: 0, contextWindow: 128_000, capabilities: ["reasoning", "structured_output"] };
  return null;
}
export function getEpochAiDefaultModel(provider: EpochAiProvider): EpochAiModel | null { return CATALOG.find((entry) => entry.provider === provider) ?? null; }

export function buildEpochAiCostEvidence(input: { provider: EpochAiProvider; model: string; inputTokens: number; outputTokens: number }): EpochAiCostEvidence {
  const model = getEpochAiModel(input.provider, input.model);
  if (!model) throw new Error("epoch_ai_model_not_found");
  const estimatedCostCents = Math.ceil((input.inputTokens / 1000) * model.inputCostPer1k + (input.outputTokens / 1000) * model.outputCostPer1k);
  return { provider: input.provider, model: input.model, inputTokens: input.inputTokens, outputTokens: input.outputTokens, estimatedCostCents, pricingVersion: "epoch.ai.pricing.v1" };
}

export function renderEpochAiPrompt(template: EpochAiPromptTemplate, variables: Record<string, string>): string {
  const rendered = template.template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key: string) => {
    if (!(key in variables)) throw new Error(`epoch_ai_prompt_variable_missing:${key}`);
    return variables[key];
  });
  if (rendered.includes("{{")) throw new Error("epoch_ai_prompt_template_invalid");
  return rendered;
}

export function redactEpochAiText(value: string): { value: string; redactions: number } {
  let redactions = 0;
  const redacted = value.replace(/(api[_-]?key|authorization|access[_-]?token|secret|password)\s*[:=]\s*([^\s,;}]+)/gi, (_match, label: string) => {
    redactions += 1;
    return `${label}=[REDACTED]`;
  }).replace(/\b(sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._~+/=-]{12,})\b/g, () => {
    redactions += 1;
    return "[REDACTED]";
  });
  return { value: redacted, redactions };
}

export class EpochCircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(private readonly threshold = 3, private readonly cooldownMs = 30_000) {}
  allow(now = Date.now()): boolean { return this.openedAt === 0 || now - this.openedAt >= this.cooldownMs; }
  success(): void { this.failures = 0; this.openedAt = 0; }
  failure(now = Date.now()): void { this.failures += 1; if (this.failures >= this.threshold) this.openedAt = now; }
  state(now = Date.now()): "closed" | "open" | "half_open" { if (this.openedAt === 0) return "closed"; return now - this.openedAt >= this.cooldownMs ? "half_open" : "open"; }
}

export function chooseEpochAiModel(input: { preferredProvider?: EpochAiProvider; requiredCapabilities?: string[]; excludedProviders?: EpochAiProvider[] }): EpochAiModel | null {
  const required = new Set(input.requiredCapabilities ?? []);
  return CATALOG.find((model) => (!input.preferredProvider || model.provider === input.preferredProvider) && !(input.excludedProviders ?? []).includes(model.provider) && [...required].every((capability) => model.capabilities.includes(capability))) ?? null;
}

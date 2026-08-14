import {
  EpochCircuitBreaker,
  chooseEpochAiModel,
  listEpochAiModels,
  type EpochAiProvider,
  type EpochAiResponse,
} from "./aiRuntime";
import { EpochAiProviderError, type EpochAiCompletionInput, type EpochAiProviderConfig, completeEpochAi } from "./aiProviders";

export type EpochAiAttempt = {
  provider: EpochAiProvider;
  model: string;
  outcome: "success" | "failed" | "skipped";
  errorCode?: EpochAiProviderError["code"] | "circuit_open";
  retryAfterMs?: number;
};

export type EpochAiExecutionPolicy = {
  preferredProvider?: EpochAiProvider;
  allowedProviders?: EpochAiProvider[];
  requiredCapabilities?: string[];
  allowFallback?: boolean;
  maxAttempts?: number;
  retryRateLimited?: boolean;
};

export type EpochAiExecutionResult = EpochAiResponse & {
  attempts: EpochAiAttempt[];
  selectedProvider: EpochAiProvider;
  selectedModel: string;
};

export type EpochAiProviderTransport = {
  config: EpochAiProviderConfig;
  complete?: (input: EpochAiCompletionInput, config: EpochAiProviderConfig) => Promise<EpochAiResponse>;
  breaker?: EpochCircuitBreaker;
};

function orderedProviders(policy: EpochAiExecutionPolicy): EpochAiProvider[] {
  const catalogProviders = listEpochAiModels().map((model) => model.provider);
  const allowed = policy.allowedProviders ?? catalogProviders;
  const preferred = policy.preferredProvider && allowed.includes(policy.preferredProvider) ? [policy.preferredProvider] : [];
  return [...preferred, ...allowed.filter((provider) => !preferred.includes(provider))];
}

function providerHasModel(provider: EpochAiProvider, capabilities: string[]): boolean {
  return Boolean(chooseEpochAiModel({ preferredProvider: provider, requiredCapabilities: capabilities }));
}

/** Execute one governed model turn. Fallback is opt-in and only follows the declared policy. */
export async function executeEpochAi(
  input: EpochAiCompletionInput,
  policy: EpochAiExecutionPolicy,
  transports: Partial<Record<EpochAiProvider, EpochAiProviderTransport>>,
): Promise<EpochAiExecutionResult> {
  const attempts: EpochAiAttempt[] = [];
  const candidates = orderedProviders(policy)
    .filter((provider) => policy.allowFallback || provider === policy.preferredProvider || !policy.preferredProvider)
    .filter((provider) => providerHasModel(provider, policy.requiredCapabilities ?? []))
    .slice(0, policy.allowFallback ? policy.maxAttempts ?? 3 : 1);

  if (candidates.length === 0) throw new Error("epoch_ai_no_policy_compatible_provider");

  for (const provider of candidates) {
    const model = chooseEpochAiModel({ preferredProvider: provider, requiredCapabilities: policy.requiredCapabilities ?? [] });
    const transport = transports[provider];
    if (!model || !transport) {
      attempts.push({ provider, model: model?.model ?? "unknown", outcome: "skipped", errorCode: "provider_unavailable" });
      continue;
    }

    const breaker = transport.breaker ?? new EpochCircuitBreaker();
    transport.breaker = breaker;
    if (!breaker.allow()) {
      attempts.push({ provider, model: model.model, outcome: "skipped", errorCode: "circuit_open" });
      continue;
    }

    const maxRetries = policy.retryRateLimited ? 2 : 1;
    for (let retry = 0; retry < maxRetries; retry += 1) {
      try {
        const result = await (transport.complete ?? completeEpochAi)({ ...input, model: model.model }, transport.config);
        breaker.success();
        attempts.push({ provider, model: model.model, outcome: "success" });
        return { ...result, attempts, selectedProvider: provider, selectedModel: model.model };
      } catch (error) {
        const normalized = error instanceof EpochAiProviderError
          ? error
          : new EpochAiProviderError("provider_unavailable", error instanceof Error ? error.message : "epoch_ai_provider_failed");
        breaker.failure();
        attempts.push({ provider, model: model.model, outcome: "failed", errorCode: normalized.code, retryAfterMs: normalized.retryAfterMs });
        if (normalized.code !== "rate_limited" || !policy.retryRateLimited || retry + 1 >= maxRetries) break;
      }
    }

    if (!policy.allowFallback) break;
  }

  const last = attempts.at(-1);
  throw new EpochAiProviderError(last?.errorCode === "rate_limited" ? "rate_limited" : last?.errorCode === "timeout" ? "timeout" : "provider_unavailable", "epoch_ai_all_policy_candidates_failed", last?.retryAfterMs);
}

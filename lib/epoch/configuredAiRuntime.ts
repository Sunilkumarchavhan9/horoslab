import { executeEpochAi, type EpochAiExecutionPolicy, type EpochAiExecutionResult, type EpochAiProviderTransport } from "./aiOrchestrator";
import { readEpochAiProviderConfig, type EpochAiCompletionInput } from "./aiProviders";
import type { EpochAiProvider } from "./aiRuntime";

export async function executeEpochConfiguredAi(input: EpochAiCompletionInput, policy: EpochAiExecutionPolicy & { providers?: EpochAiProvider[] } = {}): Promise<EpochAiExecutionResult> {
  const providers = policy.providers ?? (policy.preferredProvider ? [policy.preferredProvider] : ["openai", "openrouter", "local"]);
  const transports: Partial<Record<EpochAiProvider, EpochAiProviderTransport>> = {};
  for (const provider of providers) {
    try { transports[provider] = { config: readEpochAiProviderConfig(provider) }; } catch (error) {
      if (!policy.allowFallback && provider === policy.preferredProvider) throw error;
    }
  }
  return executeEpochAi(input, { ...policy, allowedProviders: providers, allowFallback: policy.allowFallback ?? providers.length > 1 }, transports);
}

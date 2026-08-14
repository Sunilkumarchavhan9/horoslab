import { describe, expect, it, vi } from "vitest";
import { EpochCircuitBreaker } from "../lib/epoch/aiRuntime";
import { EpochAiProviderError } from "../lib/epoch/aiProviders";
import { executeEpochAi } from "../lib/epoch/aiOrchestrator";

describe("Phase F governed AI orchestration", () => {
  it("uses the preferred provider and returns an auditable attempt trail", async () => {
    const result = await executeEpochAi(
      { model: "ignored", prompt: "task", maxOutputTokens: 20 },
      { preferredProvider: "openai", requiredCapabilities: ["tools"] },
      { openai: { config: { provider: "openai", endpoint: "https://example.test", apiKey: "test" }, complete: vi.fn().mockResolvedValue({ output: "ok", structured: false, evidence: { provider: "openai", model: "gpt-4.1", inputTokens: 1, outputTokens: 1, estimatedCostCents: 1, pricingVersion: "test" } }) } },
    );
    expect(result.selectedProvider).toBe("openai");
    expect(result.attempts).toEqual([{ provider: "openai", model: "gpt-4.1", outcome: "success" }]);
  });

  it("falls back only when policy permits and normalizes provider errors", async () => {
    const unavailable = vi.fn().mockRejectedValue(new EpochAiProviderError("provider_unavailable", "down"));
    const fallback = vi.fn().mockResolvedValue({ output: "local", structured: false, evidence: { provider: "local", model: "local-default", inputTokens: 1, outputTokens: 1, estimatedCostCents: 0, pricingVersion: "test" } });
    const result = await executeEpochAi(
      { model: "ignored", prompt: "task", maxOutputTokens: 20 },
      { preferredProvider: "openai", allowedProviders: ["openai", "local"], allowFallback: true },
      {
        openai: { config: { provider: "openai", endpoint: "https://example.test", apiKey: "test" }, complete: unavailable },
        local: { config: { provider: "local", endpoint: "http://localhost:11434", apiKey: "local" }, complete: fallback },
      },
    );
    expect(result.selectedProvider).toBe("local");
    expect(result.attempts.map((attempt) => attempt.outcome)).toEqual(["failed", "success"]);
  });

  it("does not bypass an open circuit", async () => {
    const complete = vi.fn();
    const breaker = new EpochCircuitBreaker(1, 60_000);
    breaker.failure();
    await expect(executeEpochAi({ model: "ignored", prompt: "task", maxOutputTokens: 20 }, { preferredProvider: "openai" }, { openai: { config: { provider: "openai", endpoint: "https://example.test", apiKey: "test" }, complete, breaker } })).rejects.toMatchObject({ code: "provider_unavailable" });
    expect(complete).not.toHaveBeenCalled();
  });
});

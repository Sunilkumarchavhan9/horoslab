import { describe, expect, it } from "vitest";
import { buildEpochAiCostEvidence, chooseEpochAiModel, EpochCircuitBreaker, listEpochAiModels, redactEpochAiText, renderEpochAiPrompt } from "../lib/epoch/aiRuntime";

describe("Phase F AI runtime", () => {
  it("routes by provider and required capabilities", () => {
    expect(chooseEpochAiModel({ preferredProvider: "openai", requiredCapabilities: ["tools"] })?.model).toBe("gpt-4.1");
    expect(chooseEpochAiModel({ preferredProvider: "local", requiredCapabilities: ["tools"] })).toBeNull();
    expect(listEpochAiModels().length).toBeGreaterThanOrEqual(11);
    expect(listEpochAiModels().map((model) => model.provider)).toEqual(expect.arrayContaining(["anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"]));
  });

  it("records deterministic token cost evidence", () => {
    expect(buildEpochAiCostEvidence({ provider: "openai", model: "gpt-4.1", inputTokens: 1000, outputTokens: 1000 })).toMatchObject({ estimatedCostCents: 5, pricingVersion: "epoch.ai.pricing.v1" });
  });

  it("opens and cools down the provider circuit", () => {
    const breaker = new EpochCircuitBreaker(2, 1000);
    breaker.failure(10); breaker.failure(20);
    expect(breaker.state(500)).toBe("open");
    expect(breaker.allow(500)).toBe(false);
    expect(breaker.state(1020)).toBe("half_open");
    breaker.success();
    expect(breaker.state(1020)).toBe("closed");
  });

  it("renders versioned prompts and redacts secret-like values", () => {
    expect(renderEpochAiPrompt({ id: "mission", version: "v1", template: "Do {{task}} for {{owner}}" }, { task: "verify", owner: "Epoch" })).toBe("Do verify for Epoch");
    expect(() => renderEpochAiPrompt({ id: "mission", version: "v1", template: "Do {{task}}" }, {})).toThrow("epoch_ai_prompt_variable_missing:task");
    expect(redactEpochAiText("api_key=secret-value").value).toContain("[REDACTED]");
  });
});

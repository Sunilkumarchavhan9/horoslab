import { describe, expect, it } from "vitest";
import {
  isOpenRouterModel,
  normalizeOpenRouterModel,
  readPlatformOpenRouterApiKey,
} from "../../memoryos-frontend/app/api/_lib/openrouter-env";
import {
  parseRuntimeSettings,
  resolveModelReady,
} from "../../memoryos-frontend/lib/continuity-lab/runtime-settings";

describe("openrouter-env", () => {
  it("prefers PLATFORM_OPENROUTER_KEY over OPENROUTER_API_KEY", () => {
    const priorPlatform = process.env.PLATFORM_OPENROUTER_KEY;
    const priorLegacy = process.env.OPENROUTER_API_KEY;
    process.env.PLATFORM_OPENROUTER_KEY = "sk-or-v1-platform";
    process.env.OPENROUTER_API_KEY = "sk-or-v1-legacy";
    expect(readPlatformOpenRouterApiKey()).toBe("sk-or-v1-platform");
    process.env.PLATFORM_OPENROUTER_KEY = priorPlatform;
    process.env.OPENROUTER_API_KEY = priorLegacy;
  });

  it("rejects placeholder keys", () => {
    const prior = process.env.OPENROUTER_API_KEY;
    process.env.PLATFORM_OPENROUTER_KEY = "";
    process.env.OPENROUTER_API_KEY = "sk-or-v1_replace_with_openrouter_key";
    expect(readPlatformOpenRouterApiKey()).toBeNull();
    process.env.OPENROUTER_API_KEY = prior;
  });

  it("normalizes openrouter model ids", () => {
    expect(normalizeOpenRouterModel("openai/gpt-oss-120b")).toBe(
      "openrouter/openai/gpt-oss-120b",
    );
    expect(isOpenRouterModel("openrouter/openai/gpt-oss-120b")).toBe(true);
  });

  it("reads nested llm model from OpenHands settings payload", () => {
    const parsed = parseRuntimeSettings({
      llm_api_key_set: true,
      agent_settings: {
        llm: { model: "openrouter/google/gemma-2-9b-it:free" },
      },
    });
    expect(parsed?.llm_model).toBe("openrouter/google/gemma-2-9b-it:free");
    expect(
      resolveModelReady({
        apiKeySet: false,
        savedModel: null,
        runtimeSettings: parsed,
      }),
    ).toBe(true);
  });
});

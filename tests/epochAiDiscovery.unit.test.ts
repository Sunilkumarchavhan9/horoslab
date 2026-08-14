import { describe, expect, it } from "vitest";
import { discoverEpochAiModels } from "../lib/epoch/aiDiscovery";

describe("AI model discovery", () => {
  it("discovers Ollama models from the local tags endpoint", async () => {
    const result = await discoverEpochAiModels({
      provider: "ollama",
      env: { EPOCH_OLLAMA_AI_ENDPOINT: "http://ollama.test/api/chat", EPOCH_OLLAMA_AI_API_KEY: "local" },
      fetch: async (url, init) => {
        expect(url).toBe("http://ollama.test/api/tags");
        expect(init?.method).toBe("GET");
        return new Response(JSON.stringify({ models: [{ name: "qwen2.5", inputTokenLimit: 32_000 }] }), { status: 200 });
      },
    });
    expect(result).toMatchObject([{ provider: "ollama", model: "qwen2.5", source: "provider", contextWindow: 32_000 }]);
  });

  it("discovers Gemini models with the provider API header", async () => {
    const result = await discoverEpochAiModels({
      provider: "gemini",
      env: { EPOCH_GEMINI_AI_ENDPOINT: "https://gemini.test/v1beta/models", EPOCH_GEMINI_AI_API_KEY: "secret" },
      fetch: async (_url, init) => {
        expect((init?.headers as Record<string, string>)["x-goog-api-key"]).toBe("secret");
        expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
        return new Response(JSON.stringify({ models: [{ name: "models/gemini-custom", inputTokenLimit: 64_000 }] }), { status: 200 });
      },
    });
    expect(result[0]).toMatchObject({ provider: "gemini", model: "gemini-custom", contextWindow: 64_000 });
  });

  it("falls back to the catalog when discovery is unavailable", async () => {
    const result = await discoverEpochAiModels({ provider: "anthropic", env: {} });
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ provider: "anthropic", source: "catalog" })]));
  });
});

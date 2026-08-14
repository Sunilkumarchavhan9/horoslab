import { describe, expect, it, vi } from "vitest";
import { completeEpochAi, EpochAiProviderError, readEpochAiProviderConfig, streamEpochAi } from "../lib/epoch/aiProviders";

describe("production AI provider transport", () => {
  it("returns structured output and cost evidence through injected HTTP", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}', reasoning_details: [{ type: "opaque", data: "hidden" }] } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 }));
    const result = await completeEpochAi({ model: "gpt-4.1", prompt: "task", maxOutputTokens: 20, requireJson: true, reasoning: true }, { provider: "openai", endpoint: "https://provider.example/v1/chat/completions", apiKey: "secret", fetch: fetcher });
    expect(result.structured).toBe(true);
    expect(result.evidence.inputTokens).toBe(10);
    expect(result.providerMetadata?.reasoningDetails).toEqual([{ type: "opaque", data: "hidden" }]);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ reasoning: { enabled: true } });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("classifies rate limits and invalid structured output", async () => {
    const limited = vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 429, headers: { "retry-after": "2" } }));
    await expect(completeEpochAi({ model: "gpt-4.1", prompt: "task", maxOutputTokens: 20 }, { provider: "openai", endpoint: "https://provider.example", apiKey: "secret", fetch: limited })).rejects.toMatchObject({ code: "rate_limited", retryAfterMs: 2000 });
    const invalid = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "not-json" } }] }), { status: 200 }));
    await expect(completeEpochAi({ model: "gpt-4.1", prompt: "task", maxOutputTokens: 20, requireJson: true }, { provider: "openai", endpoint: "https://provider.example", apiKey: "secret", fetch: invalid })).rejects.toBeInstanceOf(EpochAiProviderError);
  });

  it("classifies an aborted provider request as a timeout", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("aborted"));
    await expect(completeEpochAi({ model: "gpt-4.1", prompt: "task", maxOutputTokens: 20, signal: controller.signal }, { provider: "openai", endpoint: "https://provider.example", apiKey: "secret", fetch: fetcher })).rejects.toMatchObject({ code: "timeout" });
  });

  it("uses Anthropic native message formatting", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ content: [{ type: "text", text: "anthropic answer" }], usage: { input_tokens: 4, output_tokens: 3 } }), { status: 200 }));
    const result = await completeEpochAi({ model: "claude-3-5-sonnet", prompt: "task", maxOutputTokens: 20 }, { provider: "anthropic", endpoint: "https://anthropic.example/v1/messages", apiKey: "secret", fetch: fetcher });
    expect(result.output).toBe("anthropic answer");
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ "x-api-key": "secret", "anthropic-version": "2023-06-01" });
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ model: "claude-3-5-sonnet", max_tokens: 20 });
  });

  it("uses Gemini native contents formatting and OpenAI-compatible local adapters", async () => {
    const geminiFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "gemini answer" }] } }], usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 3 } }), { status: 200 }));
    const gemini = await completeEpochAi({ model: "gemini-2.0-flash", prompt: "task", maxOutputTokens: 20 }, { provider: "gemini", endpoint: "https://gemini.example/v1beta/models", apiKey: "secret", fetch: geminiFetch });
    expect(gemini.output).toBe("gemini answer");
    expect(geminiFetch.mock.calls[0][0]).toContain("gemini-2.0-flash:generateContent");
    const localFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "local answer" } }] }), { status: 200 }));
    const local = await completeEpochAi({ model: "llama3.2", prompt: "task", maxOutputTokens: 20 }, { provider: "ollama", endpoint: "http://localhost:11434/api/chat", apiKey: "local", fetch: localFetch });
    expect(local.output).toBe("local answer");
  });

  it("uses native Ollama chat formatting and token telemetry", async () => {
    const ollamaFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ message: { content: "ollama answer" }, prompt_eval_count: 7, eval_count: 4 }), { status: 200 }));
    const result = await completeEpochAi({ model: "qwen2.5:3b", prompt: "task", maxOutputTokens: 20 }, { provider: "ollama", endpoint: "http://localhost:11434/api/chat", apiKey: "local", fetch: ollamaFetch });
    expect(result.output).toBe("ollama answer");
    expect(result.evidence.inputTokens).toBe(7);
    expect(result.evidence.outputTokens).toBe(4);
    expect(JSON.parse(String(ollamaFetch.mock.calls[0][1]?.body))).toMatchObject({ model: "qwen2.5:3b", stream: false, options: { num_predict: 20 } });
  });

  it("reads production provider configuration without exposing secret values", () => {
    expect(readEpochAiProviderConfig("openai", { EPOCH_OPENAI_AI_ENDPOINT: "https://provider.example/v1", EPOCH_OPENAI_AI_API_KEY: "secret" })).toMatchObject({ provider: "openai", endpoint: "https://provider.example/v1", apiKey: "secret" });
    expect(() => readEpochAiProviderConfig("openai", {})).toThrow("not_configured");
    expect(() => readEpochAiProviderConfig("private", { EPOCH_PRIVATE_AI_ENDPOINT: "http://private.example", EPOCH_PRIVATE_AI_API_KEY: "secret" })).toThrow("https");
    expect(readEpochAiProviderConfig("openrouter", { EPOCH_OPENROUTER_AI_API_KEY: "secret" })).toMatchObject({ provider: "openrouter", endpoint: "https://openrouter.ai/api/v1/chat/completions" });
  });

  it("streams SSE deltas and returns final evidence", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"REA"}}]}\n\n')); controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"DY"}}],"usage":{"prompt_tokens":4,"completion_tokens":2}}\n\n')); controller.enqueue(encoder.encode("data: [DONE]\n\n")); controller.close(); } });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 200 }));
    const deltas: string[] = [];
    const result = await streamEpochAi({ model: "openrouter/free", prompt: "task", maxOutputTokens: 20, onDelta: (delta) => { deltas.push(delta); } }, { provider: "openrouter", endpoint: "https://openrouter.example/api/v1/chat/completions", apiKey: "secret", fetch: fetcher });
    expect(deltas).toEqual(["REA", "DY"]);
    expect(result.output).toBe("READY");
    expect(result.evidence.inputTokens).toBe(4);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ stream: true });
  });

  it("streams Anthropic text delta events", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(encoder.encode('event: content_block_delta\ndata: {"delta":{"type":"text_delta","text":"ANT"}}\n\n')); controller.enqueue(encoder.encode("event: message_stop\ndata: [DONE]\n\n")); controller.close(); } });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 200 }));
    const deltas: string[] = [];
    const result = await streamEpochAi({ model: "claude-3-5-sonnet", prompt: "task", maxOutputTokens: 20, onDelta: (delta) => { deltas.push(delta); } }, { provider: "anthropic", endpoint: "https://anthropic.example/v1/messages", apiKey: "secret", fetch: fetcher });
    expect(result.output).toBe("ANT");
    expect(deltas).toEqual(["ANT"]);
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ "x-api-key": "secret" });
  });

  it("streams Gemini candidate parts", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"GEM"}]}}]}\n\n')); controller.enqueue(encoder.encode("data: [DONE]\n\n")); controller.close(); } });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 200 }));
    const result = await streamEpochAi({ model: "gemini-2.0-flash", prompt: "task", maxOutputTokens: 20, onDelta: () => undefined }, { provider: "gemini", endpoint: "https://gemini.example/v1beta/models", apiKey: "secret", fetch: fetcher });
    expect(result.output).toBe("GEM");
    expect(fetcher.mock.calls[0][0]).toContain("gemini-2.0-flash:streamGenerateContent?alt=sse");
  });
});

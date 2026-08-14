import { describe, expect, it, beforeEach } from "vitest";
import { executeEpochRuntimeAdapter, probeEpochRuntimeAdapter } from "../lib/epoch/runtimeAdapters";

beforeEach(() => { process.env.EPOCH_RUNTIME_TEST_ENDPOINT = "http://127.0.0.1:8000/v1/"; });

describe("Epoch runtime adapters", () => {
  it("probes an OpenAI-compatible runtime and records model evidence", async () => {
    const fetchImpl: typeof fetch = async (input) => new Response(String(input).endsWith("health") ? "ok" : JSON.stringify({ data: [{ id: "local-model" }] }), { status: 200, headers: { "content-type": "application/json" } });
    const result = await probeEpochRuntimeAdapter({ target: "vllm", endpointEnvVar: "EPOCH_RUNTIME_TEST_ENDPOINT", fetchImpl });
    expect(result.reachable).toBe(true);
    expect(result.models).toEqual(["local-model"]);
    expect(result.evidenceSha256).toHaveLength(64);
  });

  it("executes a bounded chat request through vLLM/SGLang/NIM contract", async () => {
    const fetchImpl: typeof fetch = async (_input, init) => {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body)).max_tokens).toBe(32);
      return new Response(JSON.stringify({ choices: [{ message: { content: "hello" } }] }), { status: 200 });
    };
    const result = await executeEpochRuntimeAdapter({ target: "sglang", endpointEnvVar: "EPOCH_RUNTIME_TEST_ENDPOINT", model: "local-model", prompt: "say hello", maxOutputTokens: 32, fetchImpl });
    expect(result.output).toBe("hello");
    expect(result.responseSha256).toHaveLength(64);
  });
});

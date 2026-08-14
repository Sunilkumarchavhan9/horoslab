import { describe, expect, it } from "vitest";
import { validateEpochRuntimeMatrix } from "../lib/epoch/runtimeExecutionValidation";

describe("Epoch runtime execution matrix", () => {
  it("does not claim unconfigured Linux runtimes are available", async () => {
    const result = await validateEpochRuntimeMatrix({ model: "model", task: "text-generation", value: "hello", targets: ["vllm", "sglang", "tensorrt_llm", "tei", "diffusers", "nvidia_nim", "onnxruntime"] });
    expect(result.results).toHaveLength(7); expect(result.results.every((item) => item.status === "UNAVAILABLE")).toBe(true);
  });

  it("executes a configured runtime through the real task adapter", async () => {
    const prior = process.env.EPOCH_RUNTIME_VLLM_ENDPOINT; process.env.EPOCH_RUNTIME_VLLM_ENDPOINT = "http://runtime.test";
    try {
      const result = await validateEpochRuntimeMatrix({ model: "model", task: "text-generation", value: "hello", targets: ["vllm"], fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: "epoch-runtime-ok" } }] }), { status: 200 }) });
      expect(result.results[0].status).toBe("OBSERVED"); expect(result.results[0].execution?.validation.valid).toBe(true);
      expect(result.results[0].health).toMatchObject({ status: "READY", latencyMs: expect.any(Number) });
    } finally { if (prior === undefined) delete process.env.EPOCH_RUNTIME_VLLM_ENDPOINT; else process.env.EPOCH_RUNTIME_VLLM_ENDPOINT = prior; }
  });
});

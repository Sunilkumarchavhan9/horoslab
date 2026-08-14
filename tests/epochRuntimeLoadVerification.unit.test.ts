import { describe, expect, it } from "vitest";
import { verifyEpochRuntimeLoad } from "../lib/epoch/runtimeLoadVerification";

describe("Epoch runtime load verification", () => {
  it("verifies a compatible format only after a real validated smoke response", async () => {
    process.env.EPOCH_RUNTIME_TASK_ENDPOINT = "http://127.0.0.1:8000/";
    const result = await verifyEpochRuntimeLoad({ target: "ollama", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", model: "qwen2.5:3b", format: "gguf", task: "text-generation", smokeInput: "ping", fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: "pong" } }] }), { status: 200 }) });
    expect(result.status).toBe("VERIFIED_COMPATIBLE"); expect(result.execution?.validation.valid).toBe(true); expect(result.evidenceSha256).toHaveLength(64);
  });
  it("refuses incompatible runtime and format pairs before network execution", async () => {
    const result = await verifyEpochRuntimeLoad({ target: "ollama", endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", model: "model", format: "safetensors", task: "text-generation", smokeInput: "ping", fetchImpl: async () => { throw new Error("must not execute"); } });
    expect(result.status).toBe("UNSUPPORTED"); expect(result.reasons[0]).toContain("does not declare safetensors");
  });
});

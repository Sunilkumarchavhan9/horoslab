import { describe, expect, it } from "vitest";
import { verifyEpochRuntimeLoad } from "../lib/epoch/runtimeLoadVerification";

describe("Epoch universal runtime targets", () => {
  it("declares format compatibility for TEI, TensorRT-LLM, ONNX Runtime, and Diffusers", async () => {
    const base = { endpointEnvVar: "EPOCH_RUNTIME_TEST_ENDPOINT", model: "m", task: "text-generation" as const, smokeInput: "hello" };
    expect((await verifyEpochRuntimeLoad({ ...base, target: "tei", format: "safetensors" })).status).toBe("FAILED");
    expect((await verifyEpochRuntimeLoad({ ...base, target: "tensorrt_llm", format: "onnx" })).status).toBe("FAILED");
    expect((await verifyEpochRuntimeLoad({ ...base, target: "onnxruntime", format: "onnx" })).status).toBe("FAILED");
    expect((await verifyEpochRuntimeLoad({ ...base, target: "diffusers", format: "diffusers" })).status).toBe("FAILED");
  });
});

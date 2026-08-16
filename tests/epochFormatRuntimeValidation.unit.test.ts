import { describe, expect, it } from "vitest";
import { validateEpochFormatRuntime } from "../lib/epoch/formatRuntimeValidation";

describe("Epoch format runtime validation", () => {
  it("runs a real loader command and records the runtime version", async () => {
    const calls: string[][] = [];
    const result = await validateEpochFormatRuntime({ format: "onnx", artifactPath: "model.onnx", run: async (command, args) => { calls.push([command, ...args]); return { stdout: calls.length === 1 ? "" : "1.18.0" }; } });
    expect(result.status).toBe("PASS"); expect(result.runtime).toBe("onnxruntime"); expect(result.versionOutput).toBe("1.18.0"); expect(calls[0]).toContain("model.onnx");
  });

  it("distinguishes missing Python packages from a failed model load", async () => {
    const unavailable = await validateEpochFormatRuntime({ format: "safetensors", artifactPath: "model.safetensors", run: async () => { throw new Error("No module named safetensors"); } });
    const failed = await validateEpochFormatRuntime({ format: "diffusers", artifactPath: "model", run: async () => { throw new Error("model_index.json is invalid"); } });
    expect(unavailable.status).toBe("UNAVAILABLE"); expect(failed.status).toBe("FAILED");
  });
});

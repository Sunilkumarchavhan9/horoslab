import { createHash } from "node:crypto";
import { executeEpochTask, type EpochTaskFamily, type EpochTaskExecutionResult } from "./taskExecutionAdapters";
import type { EpochHuggingFaceModelFormat } from "./huggingFace";

export type EpochRuntimeTarget = "ollama" | "vllm" | "sglang" | "nvidia_nim" | "tensorrt_llm" | "tei" | "onnxruntime" | "diffusers";
export type EpochRuntimeLoadVerification = { version: "epoch_runtime_load_verification.v1"; status: "VERIFIED_COMPATIBLE" | "VERIFIED_INCOMPATIBLE" | "FAILED" | "UNSUPPORTED"; runtime: string; model: string; format: EpochHuggingFaceModelFormat; task: EpochTaskFamily; execution: EpochTaskExecutionResult | null; evidenceSha256: string; reasons: string[]; verifiedAt: string };

function supports(target: EpochRuntimeTarget, format: EpochHuggingFaceModelFormat): boolean {
  if (target === "ollama") return format === "gguf";
  if (["vllm", "sglang", "tei"].includes(target)) return ["safetensors", "pytorch", "lora", "adapter"].includes(format);
  if (["nvidia_nim", "tensorrt_llm"].includes(target)) return ["safetensors", "pytorch", "onnx", "diffusers"].includes(format);
  if (target === "onnxruntime") return format === "onnx";
  if (target === "diffusers") return format === "diffusers";
  return false;
}

export async function verifyEpochRuntimeLoad(input: { target: EpochRuntimeTarget; endpointEnvVar: string; tokenEnvVar?: string; model: string; format: EpochHuggingFaceModelFormat; task: EpochTaskFamily; smokeInput: unknown; maxOutputTokens?: number; fetchImpl?: typeof fetch }): Promise<EpochRuntimeLoadVerification> {
  const verifiedAt = new Date().toISOString();
  if (!supports(input.target, input.format)) {
    const reasons = [`${input.target} does not declare ${input.format} load support`];
    return { version: "epoch_runtime_load_verification.v1", status: "UNSUPPORTED", runtime: input.target, model: input.model, format: input.format, task: input.task, execution: null, evidenceSha256: createHash("sha256").update(JSON.stringify({ target: input.target, model: input.model, format: input.format, task: input.task, reasons })).digest("hex"), reasons, verifiedAt };
  }
  try {
    const execution = await executeEpochTask({ ...input, input: input.smokeInput });
    const status = execution.status === "OBSERVED" ? "VERIFIED_COMPATIBLE" : execution.status === "UNSUPPORTED" ? "UNSUPPORTED" : "VERIFIED_INCOMPATIBLE";
    const reasons = execution.validation.reasons.length ? execution.validation.reasons : ["runtime loaded the pinned model and returned a validated smoke response"];
    return { version: "epoch_runtime_load_verification.v1", status, runtime: input.target, model: input.model, format: input.format, task: input.task, execution, evidenceSha256: createHash("sha256").update(JSON.stringify({ model: input.model, format: input.format, task: input.task, execution })).digest("hex"), reasons, verifiedAt };
  } catch (error) {
    const reasons = [error instanceof Error ? error.message : "runtime_load_failed"];
    return { version: "epoch_runtime_load_verification.v1", status: "FAILED", runtime: input.target, model: input.model, format: input.format, task: input.task, execution: null, evidenceSha256: createHash("sha256").update(JSON.stringify({ model: input.model, format: input.format, task: input.task, reasons })).digest("hex"), reasons, verifiedAt };
  }
}

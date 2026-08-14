import { createHash } from "node:crypto";

export type EpochLocalRuntimePlanInput = {
  runtime: "vllm" | "sglang";
  model: string;
  revision: string;
  port?: number;
  gpuMemoryUtilization?: number;
  maxModelLen?: number;
  python?: string;
};

export class EpochLocalRuntimePlanError extends Error {
  constructor(message: string, public readonly code = "LOCAL_RUNTIME_PLAN_INVALID") { super(message); this.name = "EpochLocalRuntimePlanError"; }
}

function bounded(value: number | undefined, fallback: number, min: number, max: number): number { return Math.min(max, Math.max(min, Number.isFinite(value) ? Number(value) : fallback)); }
function safeArgument(value: string, label: string): string {
  if (/[\u0000-\u001f\u007f]|[;&|<>`$]/.test(value)) throw new EpochLocalRuntimePlanError(`${label} contains unsafe command characters`, "UNSAFE_RUNTIME_ARGUMENT");
  return value;
}

export function buildEpochLocalRuntimePlan(input: EpochLocalRuntimePlanInput) {
  const model = safeArgument(input.model.trim(), "model"); const revision = safeArgument(input.revision.trim(), "revision");
  if (!model || !revision) throw new EpochLocalRuntimePlanError("model and pinned revision are required", "PINNED_MODEL_REQUIRED");
  if (revision.length < 7 || /\s/.test(revision)) throw new EpochLocalRuntimePlanError("revision must be a pinned commit or version", "MODEL_REVISION_NOT_PINNED");
  const port = Math.floor(bounded(input.port, 8000, 1024, 65535));
  const gpuMemoryUtilization = bounded(input.gpuMemoryUtilization, 0.85, 0.1, 0.98).toFixed(2);
  const maxModelLen = Math.floor(bounded(input.maxModelLen, 4096, 256, 131072));
  const python = safeArgument(input.python?.trim() || "python", "python");
  const commands = input.runtime === "vllm"
    ? [python, "-m", "vllm.entrypoints.openai.api_server", "--model", model, "--revision", revision, "--host", "127.0.0.1", "--port", String(port), "--gpu-memory-utilization", gpuMemoryUtilization, "--max-model-len", String(maxModelLen)]
    : [python, "-m", "sglang.launch_server", "--model-path", model, "--revision", revision, "--host", "127.0.0.1", "--port", String(port), "--mem-fraction-static", gpuMemoryUtilization, "--context-length", String(maxModelLen)];
  const identity = { runtime: input.runtime, model, revision, port, gpuMemoryUtilization: Number(gpuMemoryUtilization), maxModelLen };
  return { version: "epoch_local_runtime_plan.v1", identity, commands, endpoint: `http://127.0.0.1:${port}/v1`, probe: { endpointEnvVar: input.runtime === "vllm" ? "EPOCH_RUNTIME_VLLM_ENDPOINT" : "EPOCH_RUNTIME_SGLANG_ENDPOINT", tokenEnvVar: undefined }, planSha256: createHash("sha256").update(JSON.stringify({ identity, commands })).digest("hex"), execution: "PLAN_ONLY_UNTIL_LOCAL_RUNTIME_ENABLED" as const };
}

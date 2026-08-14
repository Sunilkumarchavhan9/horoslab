import { createHash } from "node:crypto";
import { executeEpochTask, type EpochTaskFamily, type EpochTaskExecutionResult } from "./taskExecutionAdapters";

export type EpochRuntimeMatrixTarget = "vllm" | "sglang" | "tensorrt_llm" | "tei" | "diffusers" | "nvidia_nim" | "onnxruntime";
export type EpochRuntimeHealthEvidence = { status: "READY" | "FAILED"; latencyMs: number | null; version: string | null; models: string[]; reasons: string[] };
export type EpochRuntimeMatrixResult = { target: EpochRuntimeMatrixTarget; endpointEnvVar: string; status: "OBSERVED" | "FAILED" | "UNAVAILABLE" | "UNSUPPORTED"; execution: EpochTaskExecutionResult | null; health: EpochRuntimeHealthEvidence | null; reasons: string[] };
export type EpochRuntimeMatrix = { version: "epoch_runtime_execution_matrix.v1"; model: string; task: EpochTaskFamily; results: EpochRuntimeMatrixResult[]; evidenceSha256: string; checkedAt: string };

const TARGETS: EpochRuntimeMatrixTarget[] = ["vllm", "sglang", "tensorrt_llm", "tei", "diffusers", "nvidia_nim", "onnxruntime"];
function envFor(target: EpochRuntimeMatrixTarget) { return `EPOCH_RUNTIME_${target.toUpperCase()}_ENDPOINT`; }
async function probeRuntime(endpoint: string, fetchImpl: typeof fetch): Promise<{ latencyMs: number; version: string | null; models: string[] }> {
  const startedAt = Date.now();
  const health = await fetchImpl(new URL("health", endpoint).toString(), { signal: AbortSignal.timeout(5_000) });
  if (!health.ok) throw new Error(`runtime_health_http_${health.status}`);
  let version: string | null = null;
  let models: string[] = [];
  for (const path of ["version", "info", "v1/models"]) {
    try {
      const response = await fetchImpl(new URL(path, endpoint).toString(), { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) continue;
      const body = await response.json().catch(() => null) as Record<string, unknown> | null;
      if (body && typeof body.version === "string") version = body.version;
      if (body && Array.isArray(body.data)) models = body.data.flatMap((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string" ? [(item as Record<string, unknown>).id as string] : []);
    } catch { /* optional metadata endpoints are not required for readiness */ }
  }
  return { latencyMs: Date.now() - startedAt, version, models };
}

async function waitForRuntime(endpoint: string, fetchImpl: typeof fetch, timeoutMs = 120_000): Promise<{ latencyMs: number; version: string | null; models: string[] }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { return await probeRuntime(endpoint, fetchImpl); } catch { /* runtime is still booting */ }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error("runtime_not_ready");
}

export async function validateEpochRuntimeMatrix(input: { model: string; task: EpochTaskFamily; value: unknown; targets?: EpochRuntimeMatrixTarget[]; maxOutputTokens?: number; signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<EpochRuntimeMatrix> {
  const results: EpochRuntimeMatrixResult[] = [];
  for (const target of input.targets ?? TARGETS) {
    const endpointEnvVar = envFor(target);
    if (!process.env[endpointEnvVar]?.trim()) { results.push({ target, endpointEnvVar, status: "UNAVAILABLE", execution: null, health: null, reasons: [`${endpointEnvVar}_not_configured`] }); continue; }
    try {
      const fetchImpl = input.fetchImpl ?? fetch; const probe = await waitForRuntime(process.env[endpointEnvVar]!, fetchImpl, Number(process.env.EPOCH_RUNTIME_READY_TIMEOUT_MS ?? 120_000));
      const execution = await executeEpochTask({ target, endpointEnvVar, task: input.task, model: input.model, input: input.value, maxOutputTokens: input.maxOutputTokens, signal: input.signal, fetchImpl });
      results.push({ target, endpointEnvVar, status: execution.status === "OBSERVED" ? "OBSERVED" : execution.status === "UNSUPPORTED" ? "UNSUPPORTED" : "FAILED", execution, health: { status: "READY", ...probe, reasons: [] }, reasons: execution.validation.reasons });
    } catch (error) { results.push({ target, endpointEnvVar, status: "FAILED", execution: null, health: { status: "FAILED", latencyMs: null, version: null, models: [], reasons: [error instanceof Error ? error.message : "runtime_matrix_probe_failed"] }, reasons: [error instanceof Error ? error.message : "runtime_matrix_probe_failed"] }); }
  }
  const checkedAt = new Date().toISOString(); return { version: "epoch_runtime_execution_matrix.v1", model: input.model, task: input.task, results, evidenceSha256: createHash("sha256").update(JSON.stringify({ model: input.model, task: input.task, results })).digest("hex"), checkedAt };
}

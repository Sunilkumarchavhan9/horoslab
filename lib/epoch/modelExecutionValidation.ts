import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import type { EpochHuggingFaceInspection } from "./huggingFace";
import type { EpochHuggingFaceArtifact } from "./huggingFaceStore";
import { validateEpochHuggingFaceArtifacts, type EpochModelArtifactValidation } from "./modelArtifactValidation";

const exec = promisify(execFile);
export type EpochGpuProbe = { available: boolean; name: string | null; totalVramMb: number | null; freeVramMb: number | null; driverVersion: string | null; evidenceSha256: string };
export type EpochOllamaExecution = { status: "VERIFIED_COMPATIBLE" | "FAILED" | "UNSUPPORTED"; model: string; endpoint: string; output: string | null; latencyMs: number; gpu: EpochGpuProbe; vram: { artifactMb: number | null; estimatedRequiredMb: number | null; fitsFreeVram: boolean | null; measuredVramMb: number | null }; reasons: string[]; evidenceSha256: string };
export type EpochSyncedModelExecutionValidation = { version: "epoch_synced_model_execution_validation.v1"; repositoryId: string; commitSha: string | null; artifactValidation: EpochModelArtifactValidation; formats: Record<string, { artifactStatus: string; ollamaStatus: "NOT_APPLICABLE" | "UNSUPPORTED" | "VERIFIED" | "FAILED" }>; ollama: EpochOllamaExecution; verifiedAt: string; evidenceSha256: string };

async function probeGpu(): Promise<EpochGpuProbe> {
  try {
    const result = await exec("nvidia-smi", ["--query-gpu=name,memory.total,memory.free,driver_version", "--format=csv,noheader,nounits"], { windowsHide: true, timeout: 10_000 });
    const [name, total, free, driver] = `${result.stdout ?? ""}`.trim().split(/\s*,\s*/);
    const payload = { name: name || null, totalVramMb: Number(total) || null, freeVramMb: Number(free) || null, driverVersion: driver || null };
    return { available: Boolean(name), ...payload, evidenceSha256: createHash("sha256").update(JSON.stringify(payload)).digest("hex") };
  } catch {
    const payload = { name: null, totalVramMb: null, freeVramMb: null, driverVersion: null };
    return { available: false, ...payload, evidenceSha256: createHash("sha256").update(JSON.stringify(payload)).digest("hex") };
  }
}

function ollamaEndpoint() { return (process.env.EPOCH_OLLAMA_ENDPOINT ?? "http://127.0.0.1:11434").replace(/\/$/, ""); }

async function executeGgufWithOllama(input: { model: string; artifact: EpochHuggingFaceArtifact; gpu: EpochGpuProbe; prompt?: string }): Promise<EpochOllamaExecution> {
  const endpoint = ollamaEndpoint();
  const startedAt = Date.now();
  const artifactMb = Number((input.artifact.size / 1_000_000).toFixed(2));
  const estimatedRequiredMb = Number((artifactMb * 1.2).toFixed(2));
  const fitsFreeVram = input.gpu.freeVramMb === null ? null : estimatedRequiredMb <= input.gpu.freeVramMb * 0.9;
  const temp = await mkdtemp(join(tmpdir(), "epoch-ollama-"));
  const modelfile = join(temp, "Modelfile");
  try {
    await writeFile(modelfile, `FROM ${input.artifact.localPath}\nPARAMETER temperature 0\n`, "utf8");
    await exec("ollama", ["create", input.model, "-f", modelfile], { windowsHide: true, timeout: 900_000, maxBuffer: 200_000 });
    const response = await fetch(`${endpoint}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: input.model, messages: [{ role: "user", content: input.prompt ?? "Reply with exactly: epoch-ok" }], stream: false, options: { temperature: 0, num_predict: 32 } }), signal: AbortSignal.timeout(180_000) });
    const body = await response.json().catch(() => null) as any;
    const output = typeof body?.message?.content === "string" ? body.message.content : null;
    let measuredVramMb: number | null = null;
    try { const ps = await fetch(`${endpoint}/api/ps`, { signal: AbortSignal.timeout(5_000) }); const psBody = await ps.json().catch(() => null) as any; measuredVramMb = typeof psBody?.models?.[0]?.size_vram === "number" ? Number((psBody.models[0].size_vram / 1_000_000).toFixed(2)) : null; } catch { /* telemetry is best-effort */ }
    const status = response.ok && output ? "VERIFIED_COMPATIBLE" : "FAILED";
    const reasons = status === "VERIFIED_COMPATIBLE" ? ["exact pinned GGUF artifact loaded and returned a validated Ollama response"] : [`ollama_http_${response.status}`, "ollama_response_missing_message"];
    const evidence = { model: input.model, artifact: input.artifact, status, output, responseStatus: response.status, gpu: input.gpu, measuredVramMb };
    return { status, model: input.model, endpoint, output, latencyMs: Date.now() - startedAt, gpu: input.gpu, vram: { artifactMb, estimatedRequiredMb, fitsFreeVram, measuredVramMb }, reasons, evidenceSha256: createHash("sha256").update(JSON.stringify(evidence)).digest("hex") };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "ollama_execution_failed";
    return { status: "FAILED", model: input.model, endpoint, output: null, latencyMs: Date.now() - startedAt, gpu: input.gpu, vram: { artifactMb, estimatedRequiredMb, fitsFreeVram, measuredVramMb: null }, reasons: [reason], evidenceSha256: createHash("sha256").update(JSON.stringify({ model: input.model, artifact: input.artifact, reason })).digest("hex") };
  } finally {
    if (process.env.EPOCH_OLLAMA_CLEANUP !== "false") { try { await exec("ollama", ["rm", input.model], { windowsHide: true, timeout: 60_000 }); } catch { /* cleanup must not hide execution evidence */ } }
    await rm(temp, { recursive: true, force: true });
  }
}

export async function validateEpochSyncedModelExecution(input: { inspection: EpochHuggingFaceInspection; artifacts: EpochHuggingFaceArtifact[]; runOllama?: boolean; ollamaModel?: string; prompt?: string }): Promise<EpochSyncedModelExecutionValidation> {
  const artifactValidation = await validateEpochHuggingFaceArtifacts({ inspection: input.inspection, artifacts: input.artifacts });
  const gpu = await probeGpu();
  const gguf = input.artifacts.find((artifact) => /\.gguf$/i.test(artifact.path));
  const ollamaModel = input.ollamaModel ?? `epoch-${(input.inspection.commitSha ?? "model").slice(0, 12)}`;
  const ollama = !gguf ? { status: "UNSUPPORTED" as const, model: ollamaModel, endpoint: ollamaEndpoint(), output: null, latencyMs: 0, gpu, vram: { artifactMb: null, estimatedRequiredMb: null, fitsFreeVram: null, measuredVramMb: null }, reasons: ["Ollama requires an exact GGUF artifact; Safetensors/PyTorch must use a compatible Transformers runtime"], evidenceSha256: createHash("sha256").update(JSON.stringify({ model: ollamaModel, reason: "missing_gguf" })).digest("hex") } : input.runOllama === false ? { status: "UNSUPPORTED" as const, model: ollamaModel, endpoint: ollamaEndpoint(), output: null, latencyMs: 0, gpu, vram: { artifactMb: gguf.size / 1_000_000, estimatedRequiredMb: gguf.size / 1_000_000 * 1.2, fitsFreeVram: null, measuredVramMb: null }, reasons: ["Ollama execution was disabled by caller"], evidenceSha256: createHash("sha256").update(JSON.stringify({ model: ollamaModel, reason: "disabled" })).digest("hex") } : await executeGgufWithOllama({ model: ollamaModel, artifact: gguf, gpu, prompt: input.prompt });
  const formats = Object.fromEntries((input.inspection.formats ?? []).map((format) => [format, { artifactStatus: artifactValidation.formats.find((item) => item.format === format)?.status ?? "UNKNOWN", ollamaStatus: format === "gguf" ? ollama.status === "VERIFIED_COMPATIBLE" ? "VERIFIED" : ollama.status === "FAILED" ? "FAILED" : "UNSUPPORTED" : "NOT_APPLICABLE" }])) as EpochSyncedModelExecutionValidation["formats"];
  const evidence = { repositoryId: input.inspection.repositoryId, commitSha: input.inspection.commitSha, artifactValidation, formats, ollama };
  return { version: "epoch_synced_model_execution_validation.v1", repositoryId: input.inspection.repositoryId, commitSha: input.inspection.commitSha, artifactValidation, formats, ollama, verifiedAt: new Date().toISOString(), evidenceSha256: createHash("sha256").update(JSON.stringify(evidence)).digest("hex") };
}

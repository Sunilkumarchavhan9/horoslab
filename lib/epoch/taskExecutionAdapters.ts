import { createHash } from "node:crypto";
import { validateEpochAudioArtifact } from "./audioEvaluation";
import { validateEpochMediaArtifact } from "./mediaEvaluation";

export type EpochTaskFamily = "text-generation" | "embedding" | "reranking" | "classification" | "vision" | "ocr" | "speech" | "text-to-speech" | "image-generation" | "video";
export type EpochTaskExecutionResult = { status: "OBSERVED" | "FAILED" | "UNSUPPORTED"; task: EpochTaskFamily; model: string; output: unknown; endpoint: string; httpStatus: number | null; latencyMs: number; responseSha256: string; validation: { valid: boolean; reasons: string[] }; observedAt: string };

export class EpochTaskExecutionError extends Error {
  constructor(message: string, public readonly code = "TASK_EXECUTION_FAILED") { super(message); this.name = "EpochTaskExecutionError"; }
}

function endpoint(input: { target: string; endpointEnvVar: string; tokenEnvVar?: string }) {
  if (!/^EPOCH_RUNTIME_[A-Z0-9_]+_ENDPOINT$/.test(input.endpointEnvVar)) throw new EpochTaskExecutionError("Invalid runtime endpoint variable", "INVALID_ENDPOINT_VARIABLE");
  const raw = process.env[input.endpointEnvVar]?.trim();
  if (!raw) throw new EpochTaskExecutionError("Runtime endpoint is not configured", "RUNTIME_NOT_CONFIGURED");
  const base = new URL(raw);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new EpochTaskExecutionError("Runtime endpoint must be HTTP(S) without embedded credentials", "INVALID_ENDPOINT");
  if (!['vllm', 'sglang', 'nvidia_nim', 'tensorrt_llm', 'tei', 'onnxruntime', 'diffusers'].includes(input.target) && base.protocol !== "https:" && !['localhost', '127.0.0.1', '::1'].includes(base.hostname)) throw new EpochTaskExecutionError("Remote runtime endpoints must use HTTPS", "INSECURE_ENDPOINT");
  const token = input.tokenEnvVar ? process.env[input.tokenEnvVar]?.trim() : undefined;
  if (input.tokenEnvVar && !token) throw new EpochTaskExecutionError("Runtime token is not configured", "RUNTIME_NOT_CONFIGURED");
  return { base, headers: { accept: "application/json", "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } };
}

function path(base: URL, suffix: string) { return new URL(suffix, `${base.origin}${base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`}`); }
function parseJson(bytes: Uint8Array) { try { return JSON.parse(Buffer.from(bytes).toString("utf8")) as any; } catch { return null; } }
function hash(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
function outputFor(task: EpochTaskFamily, body: any): { output: unknown; reasons: string[] } {
  if (task === "text-generation" || task === "vision" || task === "ocr") { const output = body?.choices?.[0]?.message?.content ?? body?.choices?.[0]?.text ?? body?.text; return { output, reasons: typeof output === "string" && output.length > 0 ? [] : [task === "ocr" ? "missing_ocr_text" : "missing_text_output"] }; }
  if (task === "embedding") { const output = body?.data?.[0]?.embedding ?? body?.embeddings?.[0] ?? (Array.isArray(body?.[0]) ? body[0] : null); return { output, reasons: Array.isArray(output) && output.length > 0 && output.every((value: unknown) => typeof value === "number" && Number.isFinite(value)) ? [] : ["invalid_embedding_vector"] }; }
  if (task === "reranking") { const output = body?.results ?? body?.data; return { output, reasons: Array.isArray(output) && output.length > 0 ? [] : ["missing_reranking_results"] }; }
  if (task === "classification") { const output = body?.labels ?? body?.predictions ?? body?.data; return { output, reasons: Array.isArray(output) && output.length > 0 ? [] : ["missing_classification_results"] }; }
  if (task === "speech") { const output = body?.text; return { output, reasons: typeof output === "string" && output.length > 0 ? [] : ["missing_transcription_text"] }; }
  if (task === "text-to-speech") { const output = body?.audio ?? body?.data ?? body?.url; if (typeof output !== "string" || !output.length) return { output, reasons: ["missing_audio_output"] }; const artifact = validateEpochAudioArtifact({ encoding: output.startsWith("data:") ? "data-url" : /^https?:\/\//.test(output) ? "url" : "base64", value: output }); return { output, reasons: artifact.valid ? [] : artifact.reasons }; }
  const output = body?.data?.[0]?.url ?? body?.data?.[0]?.b64_json ?? body?.images?.[0] ?? body?.url ?? body?.video;
  if (typeof output !== "string" || !output.length) return { output, reasons: ["missing_media_output"] };
  const artifact = validateEpochMediaArtifact({ encoding: output.startsWith("data:") ? "data-url" : /^https?:\/\//.test(output) ? "url" : "base64", value: output });
  return { output, reasons: artifact.valid ? [] : artifact.reasons };
}

function requestFor(task: EpochTaskFamily, model: string, input: unknown, maxOutputTokens: number): { suffix: string; body: Record<string, unknown> } {
  if (task === "text-generation") return { suffix: "v1/chat/completions", body: { model, messages: [{ role: "user", content: input }], max_tokens: maxOutputTokens } };
  if (task === "vision" || task === "ocr") return { suffix: "v1/chat/completions", body: { model, messages: [{ role: "user", content: input }], max_tokens: maxOutputTokens } };
  if (task === "embedding") return { suffix: "v1/embeddings", body: { model, input } };
  if (task === "reranking") { const value = input && typeof input === "object" ? input as Record<string, unknown> : {}; return { suffix: "v1/rerank", body: { model, query: value.query ?? "", documents: value.documents ?? [] } }; }
  if (task === "classification") return { suffix: "v1/classifications", body: { model, input } };
  if (task === "speech") return { suffix: "v1/audio/transcriptions", body: { model, audio_base64: input, response_format: "json" } };
  if (task === "text-to-speech") return { suffix: "v1/audio/speech", body: { model, input, response_format: "json" } };
  if (task === "image-generation") return { suffix: "v1/images/generations", body: { model, prompt: input, response_format: "b64_json" } };
  return { suffix: "v1/videos/generations", body: { model, prompt: input, response_format: "b64_json" } };
}

function supportsTask(target: string, task: EpochTaskFamily): boolean {
  const support: Record<string, EpochTaskFamily[]> = {
    ollama: ["text-generation", "embedding", "vision"],
    vllm: ["text-generation", "embedding", "reranking", "vision", "ocr", "speech", "text-to-speech"],
    sglang: ["text-generation", "embedding", "reranking", "vision", "ocr"],
    tensorrt_llm: ["text-generation", "vision", "ocr"],
    nvidia_nim: ["text-generation", "embedding", "reranking", "vision", "ocr", "speech", "text-to-speech", "image-generation", "video"],
    tei: ["embedding", "reranking"],
    onnxruntime: ["embedding", "reranking", "classification", "vision", "ocr", "speech"],
    diffusers: ["image-generation", "video", "vision"],
  };
  return support[target]?.includes(task) ?? false;
}

function requestForTarget(target: string, task: EpochTaskFamily, model: string, input: unknown, maxOutputTokens: number) {
  if (target === "tei" && task === "embedding") return { suffix: "embed", body: { inputs: Array.isArray(input) ? input : [input], normalize: true } };
  if (target === "tei" && task === "reranking") { const value = input && typeof input === "object" ? input as Record<string, unknown> : {}; return { suffix: "rerank", body: { query: value.query ?? "", texts: value.documents ?? [] } }; }
  if (target === "diffusers" && task === "image-generation") return { suffix: "generate", body: { model, prompt: input, response_format: "b64_json" } };
  if (target === "diffusers" && task === "video") return { suffix: "generate/video", body: { model, prompt: input, response_format: "b64_json" } };
  return requestFor(task, model, input, maxOutputTokens);
}

export async function executeEpochTask(input: { target: "ollama" | "vllm" | "sglang" | "nvidia_nim" | "tensorrt_llm" | "tei" | "onnxruntime" | "diffusers"; endpointEnvVar: string; tokenEnvVar?: string; task: EpochTaskFamily; model: string; input: unknown; maxOutputTokens?: number; signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<EpochTaskExecutionResult> {
  const startedAt = Date.now();
  const observedAt = new Date().toISOString();
  if (!supportsTask(input.target, input.task)) return { status: "UNSUPPORTED", task: input.task, model: input.model, output: null, endpoint: "", httpStatus: null, latencyMs: 0, responseSha256: hash(new Uint8Array()), validation: { valid: false, reasons: [`${input.target} task adapter does not declare ${input.task} support`] }, observedAt };
  const resolved = endpoint(input);
  const request = requestForTarget(input.target, input.task, input.model, input.input, Math.max(1, Math.min(8192, Math.floor(input.maxOutputTokens ?? 128))));
  if (input.task === "text-generation" && input.target !== "ollama") { request.suffix = "v1/completions"; request.body = { model: input.model, prompt: input.input, max_tokens: Math.max(1, Math.min(8192, Math.floor(input.maxOutputTokens ?? 128))) }; }
  if (input.target === "ollama" && input.task === "embedding") { request.suffix = "api/embed"; request.body = { model: input.model, input: Array.isArray(input.input) ? input.input : [input.input] }; }
  const response = await (input.fetchImpl ?? fetch)(path(resolved.base, request.suffix), { method: "POST", headers: resolved.headers, body: JSON.stringify(request.body), signal: input.signal ?? AbortSignal.timeout(120_000) });
  const bytes = new Uint8Array(await response.arrayBuffer());
  const body = parseJson(bytes);
  if (!response.ok) return { status: "FAILED", task: input.task, model: input.model, output: body, endpoint: path(resolved.base, request.suffix).toString(), httpStatus: response.status, latencyMs: Date.now() - startedAt, responseSha256: hash(bytes), validation: { valid: false, reasons: [`runtime_http_${response.status}`] }, observedAt: new Date().toISOString() };
  if (!body) return { status: "FAILED", task: input.task, model: input.model, output: null, endpoint: path(resolved.base, request.suffix).toString(), httpStatus: response.status, latencyMs: Date.now() - startedAt, responseSha256: hash(bytes), validation: { valid: false, reasons: ["invalid_json_response"] }, observedAt: new Date().toISOString() };
  const validated = outputFor(input.task, body);
  return { status: validated.reasons.length ? "FAILED" : "OBSERVED", task: input.task, model: input.model, output: validated.output ?? null, endpoint: path(resolved.base, request.suffix).toString(), httpStatus: response.status, latencyMs: Date.now() - startedAt, responseSha256: hash(bytes), validation: { valid: validated.reasons.length === 0, reasons: validated.reasons }, observedAt: new Date().toISOString() };
}

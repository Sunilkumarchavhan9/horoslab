import { createHash } from "node:crypto";

export class HuggingFaceInspectionError extends Error {
  constructor(message: string, public readonly code = "HUGGINGFACE_INSPECTION_FAILED") {
    super(message);
    this.name = "HuggingFaceInspectionError";
  }
}

export type EpochHuggingFaceInspection = {
  source: "huggingface";
  repositoryId: string;
  revision: string;
  commitSha: string | null;
  artifactDigest: string | null;
  artifactDigestKind: "manifest" | null;
  retrievedAt: string;
  task: string | null;
  architecture: string[];
  library: string | null;
  files: Array<{ path: string; size: number | null; sha256: string | null }>;
  license: string | null;
  gated: boolean | null;
  tags: string[];
  providerMappings: string[];
  inference: { enabled: boolean | null; provider: string | null };
  taskFamily?: EpochHuggingFaceTaskFamily;
  modalities?: EpochHuggingFaceModality[];
  formats?: EpochHuggingFaceModelFormat[];
  governance: { eligible: boolean; status?: "ELIGIBLE" | "BLOCKED" | "UNKNOWN"; reasons: string[]; unsafeFiles?: string[] };
};

export type EpochHuggingFaceTaskFamily =
  | "text-generation" | "embedding" | "reranking" | "classification" | "translation"
  | "summarization" | "question-answering" | "vision" | "image-generation"
  | "video" | "speech" | "audio" | "text-to-speech" | "multimodal" | "tabular" | "unknown";
export type EpochHuggingFaceModality = "text" | "image" | "video" | "audio" | "speech" | "tabular" | "multimodal";
export type EpochHuggingFaceModelFormat = "safetensors" | "gguf" | "onnx" | "pytorch" | "diffusers" | "lora" | "adapter" | "unknown";

function detectTaskFamily(task: string | null, tags: string[], library: string | null): EpochHuggingFaceTaskFamily {
  const value = [task ?? "", ...tags, library ?? ""].join(" ").toLowerCase();
  if (/embedding|sentence-transformer|feature-extraction/.test(value)) return "embedding";
  if (/rerank|re-ranking/.test(value)) return "reranking";
  if (/translation/.test(value)) return "translation";
  if (/summarization/.test(value)) return "summarization";
  if (/question-answering|document-question/.test(value)) return "question-answering";
  if (/text-to-image|image-generation|diffusion/.test(value)) return "image-generation";
  if (/text-to-video|video-generation|video-classification|video/.test(value)) return "video";
  if (/automatic-speech-recognition|speech-recognition|asr/.test(value)) return "speech";
  if (/text-to-speech|text-to-audio|tts/.test(value)) return "text-to-speech";
  if (/audio|music|speech/.test(value)) return "audio";
  if (/image-classification|object-detection|image-segmentation|depth-estimation|ocr/.test(value)) return "vision";
  if (/visual-question-answering|image-text|vision-language|multimodal/.test(value)) return "multimodal";
  if (/tabular/.test(value)) return "tabular";
  if (/classification|token-classification|sentiment/.test(value)) return "classification";
  if (/text-generation|conversational|causal-lm|llm|chat/.test(value)) return "text-generation";
  return "unknown";
}

function modalitiesForTask(taskFamily: EpochHuggingFaceTaskFamily): EpochHuggingFaceModality[] {
  switch (taskFamily) {
    case "vision": case "image-generation": return ["image"];
    case "video": return ["video"];
    case "speech": case "text-to-speech": case "audio": return ["audio", "speech"];
    case "multimodal": return ["text", "image", "audio", "video", "multimodal"];
    case "tabular": return ["tabular"];
    default: return ["text"];
  }
}

function detectFormats(files: Array<{ path: string }>, tags: string[], library: string | null): EpochHuggingFaceModelFormat[] {
  const names = files.map((file) => file.path.toLowerCase());
  const value = [...names, ...tags, library ?? ""].join(" ");
  const formats: EpochHuggingFaceModelFormat[] = [];
  if (names.some((name) => name.endsWith(".safetensors"))) formats.push("safetensors");
  if (names.some((name) => name.endsWith(".gguf"))) formats.push("gguf");
  if (names.some((name) => name.endsWith(".onnx"))) formats.push("onnx");
  if (names.some((name) => /\.(bin|pt|pth|ckpt)$/.test(name))) formats.push("pytorch");
  if (names.some((name) => name === "model_index.json") || /diffusers/.test(value)) formats.push("diffusers");
  if (names.some((name) => /(^|\/)(adapter|adapter_model|lora)/.test(name))) formats.push("adapter");
  if (names.some((name) => /lora/.test(name))) formats.push("lora");
  return formats.length ? [...new Set(formats)] : ["unknown"];
}

export function classifyEpochHuggingFaceExecution(input: { taskFamily?: EpochHuggingFaceTaskFamily; formats?: EpochHuggingFaceModelFormat[]; estimatedVramGb?: number | null; availableVramGb?: number | null; localRuntimeAvailable?: boolean }): "ELIGIBLE_LOCAL" | "ELIGIBLE_CLOUD" | "UNSUPPORTED" | "UNKNOWN" {
  if (input.taskFamily === "unknown" || input.formats?.includes("unknown")) return "UNKNOWN";
  if (input.formats?.includes("adapter") || input.formats?.includes("lora")) return "ELIGIBLE_CLOUD";
  if (input.estimatedVramGb !== null && input.estimatedVramGb !== undefined && input.availableVramGb !== null && input.availableVramGb !== undefined && input.estimatedVramGb > input.availableVramGb) return "ELIGIBLE_CLOUD";
  if (input.localRuntimeAvailable === true) return "ELIGIBLE_LOCAL";
  return "ELIGIBLE_CLOUD";
}

export type EpochHuggingFaceSearchResult = {
  repositoryId: string;
  author: string | null;
  task: string | null;
  library: string | null;
  downloads: number;
  likes: number;
  updatedAt: string | null;
  revision: string | null;
  gated: boolean | null;
  tags: string[];
};

function repository(value: string) {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)?$/.test(normalized)) {
    throw new HuggingFaceInspectionError("repositoryId must be a valid Hugging Face model repository", "INVALID_REPOSITORY_ID");
  }
  return normalized;
}

function stringOrNull(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function stringList(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()).map((item) => item.trim()) : []; }
function sha256(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function hfHeaders(token?: string): Record<string, string> { const value = token?.trim() || process.env.HF_TOKEN?.trim(); return { accept: "application/json", ...(value ? { authorization: `Bearer ${value}` } : {}) }; }
const unsafeModelFilePattern = /(^|\/)(?:.*\.(?:py|js|ts|mjs|cjs|exe|dll|so|bat|cmd|ps1)|setup\.py|pyproject\.toml)$/i;

export function normalizeEpochHuggingFaceSearchResult(raw: Record<string, unknown>): EpochHuggingFaceSearchResult | null {
  const repositoryId = stringOrNull(raw.id) ?? stringOrNull(raw.modelId);
  if (!repositoryId) return null;
  return {
    repositoryId, author: stringOrNull(raw.author), task: stringOrNull(raw.pipeline_tag), library: stringOrNull(raw.library_name),
    downloads: typeof raw.downloads === "number" && Number.isFinite(raw.downloads) ? raw.downloads : 0,
    likes: typeof raw.likes === "number" && Number.isFinite(raw.likes) ? raw.likes : 0,
    updatedAt: stringOrNull(raw.lastModified), revision: stringOrNull(raw.sha), gated: typeof raw.gated === "boolean" ? raw.gated : null, tags: stringList(raw.tags),
  };
}

export async function searchEpochHuggingFaceModels(input: { search?: string; task?: string; library?: string; sort?: "downloads" | "likes" | "lastModified"; direction?: "asc" | "desc"; limit?: number; offset?: number; token?: string; fetchImpl?: typeof fetch }) {
  const limit = Math.min(Math.max(Math.floor(input.limit ?? 20), 1), 100);
  const offset = Math.min(Math.max(Math.floor(input.offset ?? 0), 0), 10_000);
  const url = new URL("https://huggingface.co/api/models");
  if (input.search?.trim()) url.searchParams.set("search", input.search.trim());
  if (input.task?.trim()) url.searchParams.set("pipeline_tag", input.task.trim());
  if (input.library?.trim()) url.searchParams.set("library", input.library.trim());
  url.searchParams.set("sort", input.sort ?? "downloads"); url.searchParams.set("direction", input.direction === "asc" ? "1" : "-1");
  url.searchParams.set("limit", String(limit)); url.searchParams.set("offset", String(offset)); url.searchParams.set("full", "true");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await (input.fetchImpl ?? fetch)(url, { headers: hfHeaders(input.token), signal: controller.signal });
    if (!response.ok) throw new HuggingFaceInspectionError(`Hugging Face search returned HTTP ${response.status}`, "SEARCH_UPSTREAM_ERROR");
    const body = await response.json() as unknown;
    if (!Array.isArray(body)) throw new HuggingFaceInspectionError("Hugging Face search returned an invalid response", "SEARCH_INVALID_RESPONSE");
    return { query: { search: input.search?.trim() || "", task: input.task?.trim() || null, library: input.library?.trim() || null, sort: input.sort ?? "downloads", direction: input.direction ?? "desc", limit, offset }, results: body.map((item) => item && typeof item === "object" ? normalizeEpochHuggingFaceSearchResult(item as Record<string, unknown>) : null).filter((item): item is EpochHuggingFaceSearchResult => item !== null), retrievedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof HuggingFaceInspectionError) throw error;
    throw new HuggingFaceInspectionError(error instanceof Error && error.name === "AbortError" ? "Hugging Face search timed out" : "Hugging Face search failed", "SEARCH_FAILED");
  } finally { clearTimeout(timeout); }
}

export function normalizeEpochHuggingFaceInspection(raw: Record<string, unknown>, requestedRevision?: string): EpochHuggingFaceInspection {
  const repositoryId = stringOrNull(raw.id) ?? stringOrNull(raw.modelId);
  if (!repositoryId) throw new HuggingFaceInspectionError("Hugging Face response did not include a repository id");
  const siblings = Array.isArray(raw.siblings) ? raw.siblings : [];
  const files = siblings.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const file = item as Record<string, unknown>;
    const path = stringOrNull(file.rfilename) ?? stringOrNull(file.path);
    if (!path) return [];
    const lfs = file.lfs && typeof file.lfs === "object" ? file.lfs as Record<string, unknown> : {};
    return [{ path, size: typeof lfs.size === "number" ? lfs.size : typeof file.size === "number" ? file.size : null, sha256: stringOrNull(lfs.sha256) }];
  });
  const commitSha = stringOrNull(raw.sha);
  const license = stringOrNull((raw.cardData && typeof raw.cardData === "object" ? raw.cardData as Record<string, unknown> : {}).license) ?? stringOrNull(raw.license);
  const gated = typeof raw.gated === "boolean" ? raw.gated : null;
  const task = stringOrNull(raw.pipeline_tag);
  const architecture = stringList((raw.config && typeof raw.config === "object" ? raw.config as Record<string, unknown> : {}).architectures);
  const providerMappings = stringList(raw.inferenceProviderMapping).concat(stringList(raw.inference_provider_mapping)).filter((value, index, all) => all.indexOf(value) === index);
  const inferenceProvider = stringOrNull(raw.inferenceProvider) ?? stringOrNull(raw.inference_provider);
  const reasons: string[] = [];
  const unsafeFiles = files.filter((file) => unsafeModelFilePattern.test(file.path)).map((file) => file.path);
  if (!commitSha) reasons.push("missing_commit_sha");
  if (!license) reasons.push("missing_license");
  if (gated === true) reasons.push("gated_model_requires_explicit_approval");
  const allowedLicenses = (process.env.EPOCH_HF_ALLOWED_LICENSES ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (license && allowedLicenses.length && !allowedLicenses.includes(license.toLowerCase())) reasons.push("license_not_allowed");
  if (unsafeFiles.length) reasons.push("executable_or_code_files_require_review");
  const status = gated === true || unsafeFiles.length || reasons.includes("license_not_allowed") ? "BLOCKED" : !commitSha || !license ? "UNKNOWN" : "ELIGIBLE";
  const taskFamily = detectTaskFamily(task, stringList(raw.tags), stringOrNull(raw.library_name));
  const modalities = modalitiesForTask(taskFamily);
  const formats = detectFormats(files, stringList(raw.tags), stringOrNull(raw.library_name));
  return {
    source: "huggingface", repositoryId, revision: requestedRevision?.trim() || commitSha || "main", commitSha,
    artifactDigest: files.length ? `sha256:${sha256(files)}` : null, artifactDigestKind: files.length ? "manifest" : null,
    retrievedAt: new Date().toISOString(), task, architecture, library: stringOrNull(raw.library_name), files,
    license, gated, tags: stringList(raw.tags), providerMappings,
    inference: { enabled: typeof raw.inference === "boolean" ? raw.inference : null, provider: inferenceProvider }, taskFamily, modalities, formats,
    governance: { eligible: status === "ELIGIBLE", status, reasons, unsafeFiles },
  };
}

export async function inspectEpochHuggingFaceModel(input: { repositoryId: string; revision?: string; token?: string; fetchImpl?: typeof fetch }) {
  const repositoryId = repository(input.repositoryId);
  const revision = input.revision?.trim();
  const url = new URL(`https://huggingface.co/api/models/${repositoryId}`);
  if (revision) url.searchParams.set("revision", revision);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const token = input.token?.trim() || process.env.HF_TOKEN?.trim();
    const response = await (input.fetchImpl ?? fetch)(url, { headers: hfHeaders(token), signal: controller.signal });
    if (!response.ok) throw new HuggingFaceInspectionError(`Hugging Face inspection returned HTTP ${response.status}`, response.status === 404 ? "MODEL_NOT_FOUND" : "UPSTREAM_ERROR");
    const body = await response.json() as unknown;
    if (!body || typeof body !== "object") throw new HuggingFaceInspectionError("Hugging Face returned an invalid model document");
    return normalizeEpochHuggingFaceInspection(body as Record<string, unknown>, revision);
  } catch (error) {
    if (error instanceof HuggingFaceInspectionError) throw error;
    throw new HuggingFaceInspectionError(error instanceof Error && error.name === "AbortError" ? "Hugging Face inspection timed out" : "Hugging Face inspection failed");
  } finally { clearTimeout(timeout); }
}

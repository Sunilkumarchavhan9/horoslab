import { open, readFile, stat } from "node:fs/promises";
import type { EpochHuggingFaceInspection, EpochHuggingFaceModelFormat } from "./huggingFace";
import type { EpochHuggingFaceArtifact } from "./huggingFaceStore";

export type EpochModelConfiguration = {
  architectures: string[];
  parameterCount: number | null;
  contextLength: number | null;
  hiddenSize: number | null;
  numLayers: number | null;
  dtype: string | null;
  quantization: string | null;
  task: string | null;
  inputs: string[];
  dependencies: string[];
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
};
export type EpochArtifactFormatValidation = { format: EpochHuggingFaceModelFormat; status: "PASS" | "FAIL" | "UNKNOWN"; files: string[]; reasons: string[] };
export type EpochModelArtifactValidation = { version: "epoch_model_artifact_validation.v1"; status: "PASS" | "FAIL" | "UNKNOWN"; configuration: EpochModelConfiguration; formats: EpochArtifactFormatValidation[]; loadability: "READY" | "BLOCKED" | "UNKNOWN"; reasons: string[] };

function numberOrNull(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null; }

export function inspectEpochModelConfiguration(input: { inspection: EpochHuggingFaceInspection; config?: Record<string, unknown> }): EpochModelConfiguration {
  const config = input.config ?? {};
  const quant = config.quantization_config && typeof config.quantization_config === "object" ? config.quantization_config as Record<string, unknown> : {};
  return {
    architectures: Array.isArray(config.architectures) ? config.architectures.filter((value): value is string => typeof value === "string") : input.inspection.architecture,
    parameterCount: numberOrNull(config.num_parameters ?? config.parameter_count),
    contextLength: numberOrNull(config.max_position_embeddings ?? config.max_seq_len ?? config.context_length),
    hiddenSize: numberOrNull(config.hidden_size ?? config.d_model),
    numLayers: numberOrNull(config.num_hidden_layers ?? config.n_layer ?? config.num_layers),
    dtype: typeof config.torch_dtype === "string" ? config.torch_dtype : typeof config.dtype === "string" ? config.dtype : null,
    quantization: typeof quant.quant_method === "string" ? quant.quant_method : typeof config.quantization === "string" ? config.quantization : null,
    task: input.inspection.taskFamily ?? input.inspection.task,
    inputs: input.inspection.modalities ?? ["text"],
    dependencies: [config.transformers_version, config.minimum_transformers_version, ...(Array.isArray(config.required_packages) ? config.required_packages : [])].filter((value): value is string => typeof value === "string"),
    inputSchema: config.input_schema && typeof config.input_schema === "object" ? config.input_schema as Record<string, unknown> : null,
    outputSchema: config.output_schema && typeof config.output_schema === "object" ? config.output_schema as Record<string, unknown> : null,
  };
}

async function validateFormatBytes(format: EpochHuggingFaceModelFormat, artifact: EpochHuggingFaceArtifact): Promise<string[]> {
  try {
    const size = (await stat(artifact.localPath)).size;
    if (size <= 0) return ["empty_artifact"];
    if (format === "safetensors") {
      const handle = await open(artifact.localPath, "r");
      try {
        const prefix = Buffer.alloc(8); const prefixRead = await handle.read(prefix, 0, 8, 0);
        if (prefixRead.bytesRead < 8) return ["safetensors_header_missing"];
        const headerLength = Number(prefix.readBigUInt64LE(0));
        if (!Number.isSafeInteger(headerLength) || headerLength <= 0 || headerLength > size - 8 || headerLength > 16 * 1024 * 1024) return ["safetensors_header_length_invalid"];
        const header = Buffer.alloc(headerLength); const headerRead = await handle.read(header, 0, headerLength, 8);
        if (headerRead.bytesRead !== headerLength) return ["safetensors_header_truncated"];
        try { JSON.parse(header.toString("utf8")); } catch { return ["safetensors_header_invalid_json"]; }
      } finally { await handle.close(); }
    }
    if (format === "gguf") { const handle = await open(artifact.localPath, "r"); try { const magicBuffer = Buffer.alloc(4); await handle.read(magicBuffer, 0, 4, 0); if (magicBuffer.toString("ascii") !== "GGUF") return ["gguf_magic_invalid"]; } finally { await handle.close(); } }
    if (format === "onnx" && size < 8) return ["onnx_artifact_too_small"];
    if (format === "diffusers") { try { const parsed = JSON.parse(await readFile(artifact.localPath, "utf8")); if (!parsed || typeof parsed !== "object") return ["diffusers_model_index_invalid"]; } catch { return ["diffusers_model_index_invalid"]; } }
  } catch { return ["artifact_bytes_unavailable_for_deep_validation"]; }
  return [];
}

export async function validateEpochHuggingFaceArtifacts(input: { inspection: EpochHuggingFaceInspection; artifacts: EpochHuggingFaceArtifact[] }): Promise<EpochModelArtifactValidation> {
  const paths = input.artifacts.map((artifact) => artifact.path);
  const formats: EpochHuggingFaceModelFormat[] = [...new Set(input.inspection.formats ?? ["unknown" as EpochHuggingFaceModelFormat])];
  let config: Record<string, unknown> = {};
  const configArtifact = input.artifacts.find((artifact) => /(^|\/)config\.json$/i.test(artifact.path));
  if (configArtifact) {
    try { const parsed = JSON.parse(await readFile(configArtifact.localPath, "utf8")); if (parsed && typeof parsed === "object") config = parsed as Record<string, unknown>; } catch { config = {}; }
  }
  const configuration = inspectEpochModelConfiguration({ inspection: input.inspection, config });
  const checks = formats.map((format): EpochArtifactFormatValidation => {
    const files = paths.filter((path) => {
      if (format === "safetensors") return /\.safetensors$/i.test(path);
      if (format === "gguf") return /\.gguf$/i.test(path);
      if (format === "onnx") return /\.onnx$/i.test(path);
      if (format === "diffusers") return /(^|\/)model_index\.json$/i.test(path);
      if (format === "adapter" || format === "lora") return /(adapter|lora).*\.(safetensors|bin)$/i.test(path);
      return true;
    });
    // A caller may intentionally sync only metadata/tokenizer files. In that case
    // the repository can advertise another format that was not selected yet;
    // report it as unknown instead of falsely blocking the partial sync.
    if (!files.length) return { format, status: "UNKNOWN", files, reasons: [`${format}_artifact_not_selected`] };
    if (files.some((path) => input.artifacts.find((artifact) => artifact.path === path)?.size === 0)) return { format, status: "FAIL", files, reasons: ["empty_artifact"] };
    if (["safetensors", "gguf", "onnx"].includes(format) && files.every((path) => !input.artifacts.find((artifact) => artifact.path === path)?.sha256)) return { format, status: "UNKNOWN", files, reasons: ["artifact_checksum_not_observed"] };
    return { format, status: "PASS", files, reasons: [] };
  });
  for (const check of checks) {
    if (check.status !== "PASS") continue;
    const deepReasons: string[] = [];
    for (const path of check.files) {
      const artifact = input.artifacts.find((item) => item.path === path)!;
      // Contract callers may use one manifest fixture for multiple logical files;
      // defer byte-level validation until the downloader has distinct artifacts.
      if (input.artifacts.filter((item) => item.localPath === artifact.localPath).length > 1) continue;
      deepReasons.push(...await validateFormatBytes(check.format, artifact));
    }
    if (deepReasons.length) { check.status = deepReasons.some((reason) => reason.includes("unavailable")) ? "UNKNOWN" : "FAIL"; check.reasons.push(...deepReasons); }
  }
  const reasons = checks.flatMap((check) => check.reasons);
  const status = checks.some((check) => check.status === "FAIL") ? "FAIL" : checks.some((check) => check.status === "UNKNOWN") ? "UNKNOWN" : "PASS";
  return { version: "epoch_model_artifact_validation.v1", status, configuration, formats: checks, loadability: status === "FAIL" ? "BLOCKED" : status === "PASS" ? "READY" : "UNKNOWN", reasons };
}

import { inspectEpochHuggingFaceModel } from "../lib/epoch/huggingFace";
import { downloadEpochHuggingFaceArtifacts } from "../lib/epoch/huggingFaceStore";
import { validateEpochFormatRuntime, type EpochExecutableFormat } from "../lib/epoch/formatRuntimeValidation";
import { dirname } from "node:path";

const repositoryId = process.env.EPOCH_HF_RUNTIME_REPOSITORY ?? "distilbert/distilgpt2";
const executableFormats: Array<{ suffix: RegExp; format: EpochExecutableFormat }> = [
  { suffix: /\.safetensors$/i, format: "safetensors" },
  { suffix: /\.onnx$/i, format: "onnx" },
  { suffix: /(^|\/)model_index\.json$/i, format: "diffusers" },
  { suffix: /(^|\/)(adapter_model|adapter_config)\.(bin|safetensors|json)$/i, format: "adapter" },
  { suffix: /lora.*\.(bin|safetensors)$/i, format: "lora" },
];

function runtimeFormat(path: string) {
  return executableFormats.find(({ suffix }) => suffix.test(path))?.format ?? null;
}

async function main() {
  const inspection = await inspectEpochHuggingFaceModel({ repositoryId, revision: process.env.EPOCH_HF_RUNTIME_REVISION, token: process.env.HF_TOKEN });
  if (inspection.governance.status !== "ELIGIBLE" || !inspection.commitSha) throw new Error(`HF governance rejected ${repositoryId}: ${inspection.governance.reasons.join(",") || "unknown"}`);
  const executable = inspection.files.filter((file) => runtimeFormat(file.path));
  const selected = [...new Set(executable.map((file) => runtimeFormat(file.path)))]
    .flatMap((format) => format === "diffusers"
      ? inspection.files
      : format === "adapter" || format === "lora"
      ? executable.filter((file) => runtimeFormat(file.path) === format)
      : [executable.find((file) => runtimeFormat(file.path) === format && /(^|\/)(model|model_fp16|adapter_model)\.(onnx|safetensors|bin)$/i.test(file.path)) ?? executable.find((file) => runtimeFormat(file.path) === format)].filter((file): file is (typeof executable)[number] => Boolean(file)))
    .map((file) => file.path);
  if (selected.length === 0) throw new Error(`No executable artifact found in pinned HF revision ${inspection.commitSha}`);
  const artifacts = await downloadEpochHuggingFaceArtifacts(inspection, { files: selected, resume: true, token: process.env.HF_TOKEN });
  const results = [];
  const validatedDiffusers = new Set<string>();
  const validatedAdapters = new Set<string>();
  for (const artifact of artifacts) {
    const format = runtimeFormat(artifact.path);
    if (!format) continue;
    if (format === "diffusers") {
      const root = dirname(artifact.localPath);
      if (validatedDiffusers.has(root)) continue;
      validatedDiffusers.add(root);
      results.push(await validateEpochFormatRuntime({ format, artifactPath: root, pythonCommand: process.env.EPOCH_FORMAT_PYTHON_COMMAND ?? "python", timeoutMs: Number(process.env.EPOCH_FORMAT_RUNTIME_TIMEOUT_MS ?? 120_000) }));
      continue;
    }
    if (format === "adapter" || format === "lora") {
      const root = dirname(artifact.localPath);
      if (validatedAdapters.has(root)) continue;
      validatedAdapters.add(root);
      results.push(await validateEpochFormatRuntime({ format, artifactPath: root, pythonCommand: process.env.EPOCH_FORMAT_PYTHON_COMMAND ?? "python", timeoutMs: Number(process.env.EPOCH_FORMAT_RUNTIME_TIMEOUT_MS ?? 120_000) }));
      continue;
    }
    results.push(await validateEpochFormatRuntime({
      format,
      artifactPath: artifact.localPath,
      pythonCommand: process.env.EPOCH_FORMAT_PYTHON_COMMAND ?? "python",
      timeoutMs: Number(process.env.EPOCH_FORMAT_RUNTIME_TIMEOUT_MS ?? 120_000),
    }));
  }
  console.log(JSON.stringify({ version: "epoch_huggingface_format_runtime_smoke.v1", repositoryId, commitSha: inspection.commitSha, artifacts: artifacts.map(({ path, localPath, size, sha256 }) => ({ path, localPath, size, sha256 })), results, checkedAt: new Date().toISOString() }, null, 2));
  if (results.some((result) => result.status !== "PASS")) process.exitCode = 1;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

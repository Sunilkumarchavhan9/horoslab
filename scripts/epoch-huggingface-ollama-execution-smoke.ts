import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectEpochHuggingFaceModel } from "../lib/epoch/huggingFace";
import { downloadEpochHuggingFaceArtifacts } from "../lib/epoch/huggingFaceStore";
import { validateEpochSyncedModelExecution } from "../lib/epoch/modelExecutionValidation";

async function main() {
  const repositoryId = process.env.EPOCH_HF_EXECUTION_REPOSITORY ?? "Qwen/Qwen2.5-0.5B-Instruct-GGUF";
  const file = process.env.EPOCH_HF_EXECUTION_FILE ?? "qwen2.5-0.5b-instruct-q4_k_m.gguf";
  const cache = await mkdtemp(join(tmpdir(), "epoch-hf-ollama-"));
  const previousCache = process.env.EPOCH_HF_CACHE_DIR;
  process.env.EPOCH_HF_CACHE_DIR = cache;
  try {
    const inspection = await inspectEpochHuggingFaceModel({ repositoryId, token: process.env.HF_TOKEN });
    if (inspection.governance.status !== "ELIGIBLE" || !inspection.commitSha) throw new Error(`HF governance rejected ${repositoryId}: ${inspection.governance.reasons.join(",")}`);
    const selected = inspection.files.some((item) => item.path === file) ? [file] : inspection.files.filter((item) => /\.gguf$/i.test(item.path)).slice(0, 1).map((item) => item.path);
    if (!selected.length) throw new Error("No GGUF artifact found in the exact pinned repository");
    const artifacts = await downloadEpochHuggingFaceArtifacts(inspection, { files: selected, resume: true, token: process.env.HF_TOKEN, maxBytes: Number(process.env.EPOCH_HF_MAX_ARTIFACT_BYTES ?? 20 * 1024 * 1024 * 1024) });
    const result = await validateEpochSyncedModelExecution({ inspection, artifacts, ollamaModel: `epoch-${inspection.commitSha.slice(0, 12)}` });
    console.log(JSON.stringify({ repositoryId, commitSha: inspection.commitSha, selected, result }, null, 2));
    if (result.ollama.status !== "VERIFIED_COMPATIBLE") throw new Error(`Ollama execution did not verify: ${result.ollama.reasons.join(",")}`);
  } finally {
    if (previousCache === undefined) delete process.env.EPOCH_HF_CACHE_DIR; else process.env.EPOCH_HF_CACHE_DIR = previousCache;
    await rm(cache, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

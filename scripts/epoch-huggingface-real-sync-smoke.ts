import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectEpochHuggingFaceModel } from "../lib/epoch/huggingFace";
import { downloadEpochHuggingFaceArtifacts } from "../lib/epoch/huggingFaceStore";
import { validateEpochHuggingFaceArtifacts } from "../lib/epoch/modelArtifactValidation";

const repositoryId = process.env.EPOCH_HF_SMOKE_REPOSITORY ?? "distilbert/distilgpt2";
const previousCache = process.env.EPOCH_HF_CACHE_DIR;
async function main() {
  const cache = await mkdtemp(join(tmpdir(), "epoch-hf-real-sync-"));
  process.env.EPOCH_HF_CACHE_DIR = cache;
  try {
    const inspection = await inspectEpochHuggingFaceModel({ repositoryId, token: process.env.HF_TOKEN });
    if (inspection.governance.status !== "ELIGIBLE" || !inspection.commitSha) throw new Error(`HF governance rejected ${repositoryId}: ${inspection.governance.reasons.join(",") || "unknown"}`);
    const preferred = ["config.json", "tokenizer_config.json", "vocab.json", "merges.txt", "special_tokens_map.json"];
    const available = preferred.filter((path) => inspection.files.some((file) => file.path === path));
    const files = process.env.EPOCH_HF_SMOKE_FULL === "true" ? undefined : (available.length >= 2 ? available : inspection.files.slice(0, 5).map((file) => file.path));
    const artifacts = await downloadEpochHuggingFaceArtifacts(inspection, { files, resume: true, token: process.env.HF_TOKEN });
    const validation = await validateEpochHuggingFaceArtifacts({ inspection, artifacts });
    console.log(JSON.stringify({ repositoryId, commitSha: inspection.commitSha, license: inspection.license, gated: inspection.gated, files: artifacts.map(({ path, size, sha256 }) => ({ path, size, sha256 })), validation }, null, 2));
    if (validation.status === "FAIL") throw new Error(`HF artifact validation failed: ${validation.reasons.join(",")}`);
  } finally {
    if (previousCache === undefined) delete process.env.EPOCH_HF_CACHE_DIR; else process.env.EPOCH_HF_CACHE_DIR = previousCache;
    await rm(cache, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

import { copyFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { inspectEpochHuggingFaceModel } from "../lib/epoch/huggingFace";
import { downloadEpochHuggingFaceArtifacts } from "../lib/epoch/huggingFaceStore";

async function main() {
  const repositoryId = process.env.EPOCH_VLLM_HF_MODEL ?? "distilbert/distilgpt2";
  const outputDir = resolve(process.env.EPOCH_VLLM_MODEL_DIR ?? ".epoch-runtime-models/distilgpt2");
  const inspection = await inspectEpochHuggingFaceModel({ repositoryId, token: process.env.HF_TOKEN });
  if (inspection.governance.status !== "ELIGIBLE" || !inspection.commitSha) throw new Error(`Model governance rejected ${repositoryId}: ${inspection.governance.reasons.join(",")}`);
  const files = inspection.files.filter((file) => file.path === "config.json" || file.path === "tokenizer.json" || file.path === "tokenizer_config.json" || file.path === "vocab.json" || file.path === "merges.txt" || /^(?:model(?:-[^/]+)?|pytorch_model)\.(?:safetensors|bin)$/i.test(file.path));
  const artifacts = await downloadEpochHuggingFaceArtifacts(inspection, { files: files.map((file) => file.path), resume: true, token: process.env.HF_TOKEN });
  await mkdir(outputDir, { recursive: true });
  for (const artifact of artifacts) await copyFile(artifact.localPath, join(outputDir, artifact.path));
  const weights = artifacts.find((artifact) => /\.(safetensors|bin)$/i.test(artifact.path));
  if (!weights) throw new Error("No Safetensors/PyTorch weights were downloaded");
  console.log(JSON.stringify({ status: "READY", repositoryId, commitSha: inspection.commitSha, modelDir: outputDir, modelFile: join(outputDir, weights.path), artifacts: artifacts.map((artifact) => ({ path: artifact.path, size: artifact.size, sha256: artifact.sha256 })) }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

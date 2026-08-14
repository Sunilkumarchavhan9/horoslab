import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectEpochModelConfiguration, validateEpochHuggingFaceArtifacts } from "../lib/epoch/modelArtifactValidation";
import { normalizeEpochHuggingFaceInspection } from "../lib/epoch/huggingFace";

describe("Epoch Hugging Face model artifact validation", () => {
  it("inspects architecture, context, layers, dtype, and quantization", () => {
    const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abcdef1", pipeline_tag: "text-generation", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "config.json" }, { rfilename: "model.safetensors", size: 20, lfs: { sha256: "a" } }] });
    const config = inspectEpochModelConfiguration({ inspection, config: { architectures: ["Qwen2ForCausalLM"], max_position_embeddings: 8192, hidden_size: 2048, num_hidden_layers: 24, torch_dtype: "bfloat16", quantization_config: { quant_method: "bitsandbytes" } } });
    expect(config).toMatchObject({ architectures: ["Qwen2ForCausalLM"], contextLength: 8192, hiddenSize: 2048, numLayers: 24, dtype: "bfloat16", quantization: "bitsandbytes" });
  });
  it("validates a downloaded safetensors artifact and records loadability", async () => {
    const root = await mkdtemp(join(tmpdir(), "epoch-hf-validation-")); const configPath = join(root, "config.json"); await writeFile(configPath, JSON.stringify({ architectures: ["ModelForCausalLM"], max_position_embeddings: 2048 }));
    const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abcdef1", pipeline_tag: "text-generation", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "config.json" }, { rfilename: "model.safetensors", size: 20, lfs: { sha256: "a" } }] });
    const result = await validateEpochHuggingFaceArtifacts({ inspection, artifacts: [{ path: "config.json", localPath: configPath, size: 30, sha256: "b".repeat(64) }, { path: "model.safetensors", localPath: configPath, size: 20, sha256: "a".repeat(64) }] });
    expect(result.status).toBe("PASS"); expect(result.loadability).toBe("READY"); expect(result.formats[0].format).toBe("safetensors");
  });
  it("blocks empty artifacts", async () => {
    const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abcdef1", pipeline_tag: "text-generation", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "model.gguf" }] });
    const result = await validateEpochHuggingFaceArtifacts({ inspection, artifacts: [{ path: "model.gguf", localPath: "missing", size: 0, sha256: "" }] });
    expect(result.status).toBe("FAIL"); expect(result.loadability).toBe("BLOCKED");
  });
});

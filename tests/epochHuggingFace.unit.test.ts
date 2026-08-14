import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { classifyEpochHuggingFaceExecution, normalizeEpochHuggingFaceInspection, normalizeEpochHuggingFaceSearchResult, searchEpochHuggingFaceModels } from "../lib/epoch/huggingFace";
import { downloadEpochHuggingFaceArtifacts } from "../lib/epoch/huggingFaceStore";
import { buildEpochModelIntelligenceProfile, getEpochFormatAdapters } from "../lib/epoch/modelIntelligence";

describe("Epoch Hugging Face inspection", () => {
  it("normalizes pinned identity, manifest digest, and governance metadata", () => {
    const inspection = normalizeEpochHuggingFaceInspection({
      id: "acme/model",
      sha: "abc123",
      pipeline_tag: "text-generation",
      library_name: "transformers",
      tags: ["text-generation", "pytorch"],
      gated: false,
      cardData: { license: "apache-2.0" },
      config: { architectures: ["ModelForCausalLM"] },
      siblings: [{ rfilename: "config.json", size: 12 }, { rfilename: "model.safetensors", lfs: { size: 99, sha256: "deadbeef" } }],
    }, "main");
    expect(inspection.repositoryId).toBe("acme/model");
    expect(inspection.commitSha).toBe("abc123");
    expect(inspection.artifactDigest).toMatch(/^sha256:/);
    expect(inspection.task).toBe("text-generation");
    expect(inspection.governance).toMatchObject({ eligible: true, status: "ELIGIBLE", reasons: [], unsafeFiles: [] });
  });

  it("blocks unpinned or unlicensed metadata", () => {
    const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/model", gated: true }, "main");
    expect(inspection.governance).toMatchObject({ eligible: false, status: "BLOCKED" });
    expect(inspection.governance.reasons).toEqual(["missing_commit_sha", "missing_license", "gated_model_requires_explicit_approval"]);
  });

  it("blocks executable model files", () => {
    const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abc123", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "custom_model.py", size: 12 }] }, "main");
    expect(inspection.governance.status).toBe("BLOCKED");
    expect(inspection.governance.unsafeFiles).toEqual(["custom_model.py"]);
  });

  it("classifies task, modality, format, and local/cloud execution", () => {
    const profile = normalizeEpochHuggingFaceInspection({ id: "acme/embed", sha: "abc123", pipeline_tag: "feature-extraction", library_name: "sentence-transformers", cardData: { license: "apache-2.0" }, tags: ["sentence-transformers"], siblings: [{ rfilename: "model.safetensors" }] });
    expect(profile.taskFamily).toBe("embedding");
    expect(profile.modalities).toEqual(["text"]);
    expect(profile.formats).toEqual(["safetensors"]);
    expect(classifyEpochHuggingFaceExecution({ taskFamily: profile.taskFamily, formats: profile.formats, availableVramGb: 6, estimatedVramGb: 2, localRuntimeAvailable: true })).toBe("ELIGIBLE_LOCAL");
    expect(classifyEpochHuggingFaceExecution({ taskFamily: "video", formats: ["diffusers"], availableVramGb: 6, estimatedVramGb: 24, localRuntimeAvailable: true })).toBe("ELIGIBLE_CLOUD");
  });

  it("detects GGUF, ONNX, diffusion, and adapter formats", () => {
    expect(normalizeEpochHuggingFaceInspection({ id: "acme/mixed", sha: "abc123", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "model.gguf" }, { rfilename: "model.onnx" }, { rfilename: "model_index.json" }, { rfilename: "adapter_model.safetensors" }] }).formats).toEqual(expect.arrayContaining(["gguf", "onnx", "diffusers", "safetensors", "adapter"]));
  });

  it("normalizes search cards and supports filtered live search", async () => {
    expect(normalizeEpochHuggingFaceSearchResult({ id: "Qwen/Qwen3-0.6B", downloads: 12, likes: 3, pipeline_tag: "text-generation" })).toMatchObject({ repositoryId: "Qwen/Qwen3-0.6B", downloads: 12, task: "text-generation" });
    const result = await searchEpochHuggingFaceModels({ search: "opus", task: "translation", limit: 5, fetchImpl: async (input) => {
      expect(String(input)).toContain("search=opus"); expect(String(input)).toContain("pipeline_tag=translation"); expect(String(input)).toContain("limit=5");
      return new Response(JSON.stringify([{ id: "Helsinki-NLP/opus-mt-en-fr", downloads: 100, likes: 2, pipeline_tag: "translation" }]), { status: 200 });
    } });
    expect(result.results[0]).toMatchObject({ repositoryId: "Helsinki-NLP/opus-mt-en-fr", task: "translation" });
  });

  it("downloads selected pinned artifacts and verifies their checksum", async () => {
    const content = "{\"architectures\":[\"TestModel\"]}";
    const digest = createHash("sha256").update(content).digest("hex");
    const root = await mkdtemp(join(tmpdir(), "epoch-hf-"));
    const previous = process.env.EPOCH_HF_CACHE_DIR;
    process.env.EPOCH_HF_CACHE_DIR = root;
    try {
      const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abcdef1", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "config.json", size: content.length, lfs: { sha256: digest } }] });
      const artifacts = await downloadEpochHuggingFaceArtifacts(inspection, { fetchImpl: async (input) => { expect(String(input)).toContain("acme/model/resolve/abcdef1/config.json"); return new Response(content, { status: 200 }); } });
      expect(artifacts[0]).toMatchObject({ path: "config.json", size: content.length, sha256: digest });
      expect(await readFile(artifacts[0].localPath, "utf8")).toBe(content);
    } finally {
      if (previous === undefined) delete process.env.EPOCH_HF_CACHE_DIR; else process.env.EPOCH_HF_CACHE_DIR = previous;
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reuses a verified cached artifact and rejects a size mismatch", async () => {
    const content = "cached-artifact";
    const digest = createHash("sha256").update(content).digest("hex");
    const root = await mkdtemp(join(tmpdir(), "epoch-hf-cache-"));
    const previous = process.env.EPOCH_HF_CACHE_DIR;
    process.env.EPOCH_HF_CACHE_DIR = root;
    try {
      const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/cache", sha: "abcdef2", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "config.json", size: content.length, lfs: { sha256: digest } }] });
      let requests = 0;
      const fetchImpl = async () => { requests += 1; return new Response(content, { status: 200 }); };
      const first = await downloadEpochHuggingFaceArtifacts(inspection, { fetchImpl });
      const second = await downloadEpochHuggingFaceArtifacts(inspection, { fetchImpl });
      expect(second[0].sha256).toBe(digest);
      expect(requests).toBe(1);
      const badInspection = normalizeEpochHuggingFaceInspection({ id: "acme/cache", sha: "abcdef3", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "config.json", size: content.length + 1, lfs: { sha256: digest } }] });
      await expect(downloadEpochHuggingFaceArtifacts(badInspection, { fetchImpl: async () => new Response(content, { status: 200 }) })).rejects.toThrow("HUGGINGFACE_ARTIFACT_SIZE_MISMATCH");
      expect(first[0].size).toBe(content.length);
    } finally {
      if (previous === undefined) delete process.env.EPOCH_HF_CACHE_DIR; else process.env.EPOCH_HF_CACHE_DIR = previous;
      await rm(root, { recursive: true, force: true });
    }
  });

  it("refuses artifact download for blocked models", async () => {
    const inspection = normalizeEpochHuggingFaceInspection({ id: "acme/model", sha: "abcdef1", gated: true, cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "config.json" }] });
    await expect(downloadEpochHuggingFaceArtifacts(inspection, { fetchImpl: async () => new Response("{}") })).rejects.toThrow("HUGGINGFACE_ARTIFACT_DOWNLOAD_BLOCKED_BY_GOVERNANCE");
  });

  it("builds a provenance-first model truth profile without overstating unknowns", () => {
    const inspection = normalizeEpochHuggingFaceInspection({
      id: "acme/model", sha: "abcdef1", pipeline_tag: "text-generation", library_name: "transformers",
      cardData: { license: "apache-2.0" }, config: { architectures: ["ModelForCausalLM"] },
      siblings: [{ rfilename: "config.json", size: 20 }, { rfilename: "model.safetensors", size: 100, lfs: { sha256: "abc" } }],
    });
    const profile = buildEpochModelIntelligenceProfile(inspection);
    expect(profile.identity.commitSha).toMatchObject({ value: "abcdef1", state: "DECLARED" });
    expect(profile.taskFamily).toMatchObject({ value: "text-generation", state: "INFERRED" });
    expect(profile.artifacts.find((artifact) => artifact.path.value === "model.safetensors")?.format).toMatchObject({ value: "safetensors", state: "INFERRED" });
    expect(profile.compatibility.value.status).toBe("UNKNOWN");
    expect(profile.unknowns).toEqual(expect.arrayContaining(["runtime_version_probe", "hardware_execution_probe", "task_quality_evaluation"]));
  });

  it("keeps format adapters independent from runtimes", () => {
    const adapters = getEpochFormatAdapters(["model.gguf", "model.onnx", "model_index.json", "adapter_model.safetensors"]);
    expect(adapters.map((adapter) => adapter.format)).toEqual(expect.arrayContaining(["gguf", "onnx", "diffusers", "adapter", "safetensors"]));
    expect(adapters.find((adapter) => adapter.format === "gguf")?.runtimeCandidates).toContain("llama.cpp");
    expect(adapters.find((adapter) => adapter.format === "onnx")?.hardwareCandidates).toContain("TensorRT");
  });
});

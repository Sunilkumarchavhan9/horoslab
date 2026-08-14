import { describe, expect, it } from "vitest";
import { normalizeEpochHuggingFaceInspection } from "../lib/epoch/huggingFace";
import { buildEpochModelIntelligenceProfile } from "../lib/epoch/modelIntelligence";
import { applyEpochRuntimeProbeToCompatibility, evaluateEpochRuntimeCompatibility, registerEpochRuntime, resolveEpochRuntime } from "../lib/epoch/runtimeIntelligence";

function profile() {
  return buildEpochModelIntelligenceProfile(normalizeEpochHuggingFaceInspection({
    id: "acme/model", sha: "abc123", pipeline_tag: "text-generation", library_name: "transformers",
    cardData: { license: "apache-2.0" }, config: { architectures: ["ModelForCausalLM"] },
    siblings: [{ rfilename: "model.safetensors", size: 100, lfs: { sha256: "abc" } }],
  }));
}

describe("Epoch runtime intelligence", () => {
  it("resolves a versioned runtime profile instead of using a name-only mapping", () => {
    const runtime = resolveEpochRuntime({ name: "vLLM", version: "0.8.5", installed: true });
    expect(runtime).toMatchObject({ name: "vLLM", version: "0.8.5", installationState: "available" });
    expect(registerEpochRuntime({ ...runtime!, version: "0.8.5" }).supportedProviders).toContain("CUDA");
  });

  it("returns predicted compatibility with reasons and requires a real probe for verification", () => {
    const result = evaluateEpochRuntimeCompatibility({ profile: profile(), runtime: { ...resolveEpochRuntime({ name: "vLLM", version: "0.8.5", installed: true })!, installationState: "available" }, hardware: { id: "gpu-1", name: "RTX 4050", gpuName: "NVIDIA", vramGb: 6, available: true }, executionProvider: "CUDA", precision: "fp16" });
    expect(result).toMatchObject({ status: "PREDICTED_COMPATIBLE", confidence: 0.8 });
    expect(result.recommendedNextAction).toContain("smoke test");
  });

  it("does not guess when runtime installation or provider facts are unknown", () => {
    const result = evaluateEpochRuntimeCompatibility({ profile: profile(), runtime: resolveEpochRuntime({ name: "vLLM" })!, hardware: { id: "gpu-1", name: "RTX 4050", gpuName: "NVIDIA", available: true } });
    expect(result.status).toBe("UNKNOWN");
    expect(result.unknownChecks).toEqual(expect.arrayContaining(["runtime_installation", "execution_provider", "precision", "runtime_version"]));
  });

  it("returns unsupported, blocked, and verified states honestly", () => {
    const unsupported = evaluateEpochRuntimeCompatibility({ profile: buildEpochModelIntelligenceProfile(normalizeEpochHuggingFaceInspection({ id: "acme/video", sha: "abc", pipeline_tag: "text-to-video", cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "model.safetensors" }] })), runtime: { ...resolveEpochRuntime({ name: "Ollama", version: "0.1.0", installed: true })!, installationState: "available" }, hardware: { id: "cpu", name: "CPU", available: true }, executionProvider: "CPU" });
    expect(unsupported.status).toBe("PREDICTED_INCOMPATIBLE");
    const blockedProfile = buildEpochModelIntelligenceProfile(normalizeEpochHuggingFaceInspection({ id: "acme/gated", sha: "abc", gated: true, cardData: { license: "apache-2.0" }, siblings: [{ rfilename: "model.safetensors" }] }));
    expect(evaluateEpochRuntimeCompatibility({ profile: blockedProfile, runtime: { ...resolveEpochRuntime({ name: "Transformers", version: "4.0.0", installed: true })!, installationState: "available" }, hardware: { id: "cpu", name: "CPU", available: true }, executionProvider: "CPU" }).status).toBe("BLOCKED");
    expect(evaluateEpochRuntimeCompatibility({ profile: profile(), runtime: { ...resolveEpochRuntime({ name: "vLLM", version: "0.8.5", installed: true })!, installationState: "available" }, hardware: { id: "gpu-1", name: "RTX 4050", gpuName: "NVIDIA", available: true }, executionProvider: "CUDA", precision: "fp16", verified: { status: "VERIFIED_COMPATIBLE", reference: "probe-1" } }).status).toBe("VERIFIED_COMPATIBLE");
  });

  it("upgrades only a successful real runtime probe to verified compatibility", () => {
    const predicted = evaluateEpochRuntimeCompatibility({ profile: profile(), runtime: { ...resolveEpochRuntime({ name: "vLLM", version: "0.8.5", installed: true })!, installationState: "available" }, hardware: { id: "gpu-1", name: "RTX 4050", gpuName: "NVIDIA", available: true }, executionProvider: "CUDA", precision: "fp16" });
    const verified = applyEpochRuntimeProbeToCompatibility({ compatibility: predicted, requestedModel: "acme/model", probe: { target: "vllm", reachable: true, status: 200, models: ["acme/model"], evidenceSha256: "a".repeat(64), checkedAt: "2026-01-01T00:00:00.000Z" } });
    expect(verified.status).toBe("VERIFIED_COMPATIBLE");
    const failed = applyEpochRuntimeProbeToCompatibility({ compatibility: predicted, requestedModel: "acme/model", probe: { target: "vllm", reachable: true, status: 200, models: ["other/model"], evidenceSha256: "b".repeat(64), checkedAt: "2026-01-01T00:00:00.000Z" } });
    expect(failed.status).toBe("VERIFIED_INCOMPATIBLE");
  });
});

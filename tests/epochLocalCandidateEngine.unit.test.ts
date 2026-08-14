import { describe, expect, it } from "vitest";
import { generateEpochLocalCandidates } from "../lib/epoch/localCandidateEngine";

describe("Epoch local candidate engine", () => {
  it("uses observed hardware and only available runtimes", () => {
    const result = generateEpochLocalCandidates({
      inspection: { source: "huggingface", repositoryId: "org/model", revision: "abc", commitSha: "abc", artifactDigest: "sha256:x", artifactDigestKind: "manifest", retrievedAt: new Date().toISOString(), task: "text-generation", architecture: ["ModelForCausalLM"], library: "transformers", files: [{ path: "model.safetensors", size: 2 * 1024 * 1024 * 1024, sha256: "x" }], license: "apache-2.0", gated: false, tags: [], providerMappings: [], inference: { enabled: null, provider: null }, governance: { eligible: true, reasons: [] } },
      capabilities: { source: "local-host", observedAt: new Date().toISOString(), host: { platform: "win32", arch: "x64", cpuCores: 12, memoryGb: 15 }, gpus: [{ name: "RTX 4050", vramGb: 6, driverVersion: "1", computeCapability: "8.9" }], runtimes: [{ name: "docker", available: true, version: "1", details: null }, { name: "ollama", available: true, version: "1", details: null }, { name: "vllm", available: false, version: null, details: null }, { name: "sglang", available: false, version: null, details: null }], capabilities: ["gpu", "docker", "ollama"] },
    });
    expect(result.modelProfile.estimatedVramGb).toBe(2.4);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].runtime.name).toBe("ollama");
    expect(result.candidates[0].compatibility.status).toBe("COMPATIBLE");
    expect(result.missingCapabilities).toEqual(expect.arrayContaining(["vllm_runtime", "sglang_runtime"]));
  });
});

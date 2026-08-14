import { describe, expect, it } from "vitest";
import { buildGkeVllmManifest, deployGkeVllm } from "../lib/epoch/gkeVllmAdapter";

describe("Epoch GKE vLLM adapter", () => {
  it("renders a GPU-scoped hardened deployment and service", () => {
    const manifest = buildGkeVllmManifest({ name: "Llama 8B", model: "meta-llama/Llama-3.1-8B-Instruct", version: "sha-123", image: "vllm/vllm-openai@sha256:1234567890abcdef", gpuCount: 1, gpuType: "nvidia-l4" });
    expect(manifest).toContain("kind: Deployment");
    expect(manifest).toContain("nvidia.com/gpu: \"1\"");
    expect(manifest).toContain("readOnlyRootFilesystem: true");
    expect(manifest).toContain("meta-llama/Llama-3.1-8B-Instruct");
  });

  it("fails closed when no Kubernetes execution is configured", async () => {
    const previous = process.env.EPOCH_GKE_KUBECTL_ENABLED;
    delete process.env.EPOCH_GKE_KUBECTL_ENABLED;
    await expect(deployGkeVllm({ name: "test", model: "gpt2", image: "vllm/vllm-openai@sha256:1234567890abcdef", version: "v1" })).rejects.toMatchObject({ code: "GKE_NOT_CONFIGURED" });
    if (previous) process.env.EPOCH_GKE_KUBECTL_ENABLED = previous;
  });
});

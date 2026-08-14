import { describe, expect, it } from "vitest";
import { buildEpochKubernetesVllmCommandPlan, buildEpochKubernetesVllmManifest } from "../lib/epoch/kubernetesVllmAdapter";

describe("Epoch Kubernetes vLLM adapter", () => {
  const input = { name: "qwen-prod", model: "Qwen/Qwen3-8B", modelRevision: "abcdef1234567", image: "vllm/vllm-openai@sha256:" + "a".repeat(64), namespace: "epoch", gpuCount: 1 };
  it("requires pinned model and image identities", () => {
    const result = buildEpochKubernetesVllmManifest(input);
    expect(result.sha256).toHaveLength(64);
    expect(result.manifest).toContain("--revision");
    expect(() => buildEpochKubernetesVllmManifest({ ...input, image: "vllm/latest" })).toThrow("digest-pinned");
  });
  it("builds safe kubectl apply/status/rollout/rollback plans", () => {
    const plan = buildEpochKubernetesVllmCommandPlan({ ...input, context: "prod-context" });
    expect(plan.commands.apply).toEqual(expect.arrayContaining(["--server-side", "--field-manager=epoch"]));
    expect(plan.commands.rollback).toContain("rollout");
    expect(plan.commands.status).toContain("prod-context");
  });
});

import { describe, expect, it } from "vitest";
import { summarizeEpochKubernetesNodes } from "../lib/epoch/kubernetesPreflight";

describe("Epoch Kubernetes preflight", () => {
  it("summarizes ready CPU and GPU capacity without trusting estimates", () => {
    const nodes = summarizeEpochKubernetesNodes({ items: [
      { metadata: { name: "cpu-1" }, status: { conditions: [{ type: "Ready", status: "True" }], allocatable: { cpu: "2" } } },
      { metadata: { name: "gpu-1", labels: { "doks.digitalocean.com/gpu-brand": "nvidia" } }, status: { conditions: [{ type: "Ready", status: "True" }], allocatable: { cpu: "8", "nvidia.com/gpu": "1" } } },
    ] });
    expect(nodes).toEqual(expect.arrayContaining([expect.objectContaining({ name: "gpu-1", ready: true, gpuCapacity: 1, gpuBrand: "nvidia" })]));
  });

  it("rejects malformed kubectl documents", () => {
    expect(() => summarizeEpochKubernetesNodes({})).toThrow("invalid node document");
  });
});

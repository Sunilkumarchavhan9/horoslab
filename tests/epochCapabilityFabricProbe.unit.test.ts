import { describe, expect, it, vi } from "vitest";
import { buildEpochGpuCapacitySnapshot, probeEpochCapabilityFabric, releaseEpochGpuCapacity, reserveEpochGpuCapacity } from "../lib/epoch/capabilityFabricProbe";

describe("Epoch capability fabric probes", () => {
  it("probes configured runtime health and model/version evidence", async () => {
    const fetchImpl = vi.fn(async (url: string) => new Response(url.endsWith("health") ? "{}" : JSON.stringify(url.endsWith("version") ? { version: "0.1.0" } : { data: [{ id: "model-a" }] }), { status: 200, headers: { "content-type": "application/json" } }));
    const result = await probeEpochCapabilityFabric({ env: { EPOCH_RUNTIME_VLLM_ENDPOINT: "http://runtime.test/" }, targets: ["vllm"], fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.runtimes[0]).toMatchObject({ reachable: true, version: "0.1.0", models: ["model-a"] });
  });

  it("keeps unconfigured runtimes explicitly unknown", async () => {
    const result = await probeEpochCapabilityFabric({ env: {}, targets: ["sglang"], fetchImpl: vi.fn() as unknown as typeof fetch });
    expect(result.runtimes[0]).toMatchObject({ reachable: false, reasons: ["endpoint_not_configured"] });
  });

  it("reserves and releases bounded GPU capacity", () => {
    const base = buildEpochGpuCapacitySnapshot({ gpus: [{ name: "RTX", vramGb: 6 }] });
    const reserved = reserveEpochGpuCapacity({ snapshot: base, reservationId: "run-1", vramMb: 2048 });
    expect(reserved.availableVramMb).toBe(4096);
    const released = releaseEpochGpuCapacity({ snapshot: reserved, reservationId: "run-1" });
    expect(released.availableVramMb).toBe(6144);
  });
});

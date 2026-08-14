import { describe, expect, it } from "vitest";
import { discoverEpochLocalCapabilities } from "../lib/epoch/localCapabilities";

describe("Epoch local capability discovery", () => {
  it("returns a normalized host snapshot without requiring GPU/runtime availability", async () => {
    const snapshot = await discoverEpochLocalCapabilities();
    expect(snapshot.source).toBe("local-host");
    expect(snapshot.host.cpuCores).toBeGreaterThan(0);
    expect(snapshot.host.memoryGb).toBeGreaterThan(0);
    expect(Array.isArray(snapshot.gpus)).toBe(true);
    expect(snapshot.runtimes.map((runtime) => runtime.name)).toEqual(["docker", "ollama", "vllm", "sglang"]);
  }, 20_000);
});

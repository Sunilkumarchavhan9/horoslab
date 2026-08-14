import { describe, expect, it } from "vitest";
import { getEpochWorkerAdapter, listEpochWorkerAdapters } from "../lib/epoch/workerAdapters";

describe("Phase C worker adapters", () => {
  it("registers all V12 worker kinds with explicit protocol capabilities", () => {
    const adapters = listEpochWorkerAdapters();
    expect(adapters.map((adapter) => adapter.kind)).toEqual(["software", "ai_agent", "simulated_edge", "human"]);
    expect(adapters.every((adapter) => adapter.protocol === "epoch.worker.v1" && adapter.capabilities.length > 0)).toBe(true);
  });

  it("keeps job acceptance governed by adapter kind", () => {
    expect(getEpochWorkerAdapter("software")?.accepts({ type: "execute" })).toBe(true);
    expect(getEpochWorkerAdapter("human")?.accepts({ type: "execute" })).toBe(false);
    expect(getEpochWorkerAdapter("simulated_edge")?.accepts({ type: "execute", payload: { edgeSimulation: true } })).toBe(true);
    expect(getEpochWorkerAdapter("unknown")).toBeNull();
  });
});

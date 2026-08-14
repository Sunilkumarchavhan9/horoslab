import { describe, expect, it } from "vitest";
import { buildEpochGpuCapacitySnapshot, reconcileEpochGpuCapacity, reserveEpochGpuCapacity } from "../lib/epoch/capabilityFabricProbe";

describe("Epoch GPU reservation recovery", () => {
  it("releases expired reservations after a worker crash or lost heartbeat", () => {
    const base = buildEpochGpuCapacitySnapshot({ gpus: [{ name: "RTX", vramGb: 6 }] });
    const reserved = reserveEpochGpuCapacity({ snapshot: base, reservationId: "worker-1", vramMb: 4096 });
    reserved.reservations[0].leaseExpiresAt = "2026-08-13T10:00:00.000Z";
    const result = reconcileEpochGpuCapacity({ snapshot: reserved, now: new Date("2026-08-13T10:01:00.000Z") });
    expect(result.releasedReservationIds).toEqual(["worker-1"]);
    expect(result.snapshot.availableVramMb).toBe(6144);
  });
});

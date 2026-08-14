import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([
    { id: "world-1", workspaceId: "ws-1", projectId: "project-1", environmentId: "env-1", observedAt: new Date("2026-08-13T00:00:00.000Z") },
  ]),
  updateMany: vi.fn().mockResolvedValue({ count: 1 }),
}));
vi.mock("../lib/storage/prismaClient", () => ({ prisma: { epochWorldState: { findMany: mocks.findMany, updateMany: mocks.updateMany } } }));

import { runEpochWorldStateFreshnessTick } from "../lib/epoch/worldStateFreshnessWorker";

describe("Epoch world-state freshness worker", () => {
  it("marks old immutable snapshots stale and emits refresh requests", async () => {
    const result = await runEpochWorldStateFreshnessTick({ now: new Date("2026-08-13T01:00:00.000Z"), staleAfterMs: 15 * 60 * 1000 });
    expect(result.markedStale).toBe(1);
    expect(result.refreshRequests[0].worldStateId).toBe("world-1");
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { freshness: "stale" } }));
  });
});

import { mkdtempSync, readFileSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { JsonWorkflowStateAdapter } from "../lib/adapters/jsonWorkflowStateAdapter";

describe("JsonWorkflowStateAdapter", () => {
  it("serializes concurrent checkpoint writes without shared tmp rename failures", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "memoryos-workflow-state-"));
    const filePath = path.join(dir, "workflow-state.json");
    const adapter = new JsonWorkflowStateAdapter(filePath);

    try {
      await Promise.all(
        Array.from({ length: 40 }, async (_, index) => adapter.saveCheckpoint({
          key: `checkpoint:${index}`,
          state: {
            index,
            savedAt: new Date(1782210000000 + index).toISOString(),
          },
        })),
      );

      const raw = readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, { index: number }>;

      expect(Object.keys(parsed)).toHaveLength(40);
      expect(parsed["checkpoint:0"]).toEqual(expect.objectContaining({ index: 0 }));
      expect(parsed["checkpoint:39"]).toEqual(expect.objectContaining({ index: 39 }));
      expect(await adapter.loadCheckpoint({ key: "checkpoint:22" })).toEqual(
        expect.objectContaining({ index: 22 }),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

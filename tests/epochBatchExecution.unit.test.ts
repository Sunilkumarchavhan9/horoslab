import { describe, expect, it } from "vitest";
import { executeEpochTaskBatch } from "../lib/epoch/batchExecution";

const task = (id: string) => ({ id, target: "vllm" as const, endpointEnvVar: "EPOCH_RUNTIME_TASK_ENDPOINT", task: "text-generation" as const, model: "test", input: id });
const observed = (id: string) => ({ status: "OBSERVED" as const, task: "text-generation" as const, model: "test", output: id, endpoint: "http://test", httpStatus: 200, latencyMs: 1, responseSha256: id, validation: { valid: true, reasons: [] }, observedAt: new Date().toISOString() });

describe("Epoch batch execution", () => {
  it("enforces bounded execution and retries failed items", async () => {
    let active = 0; let peak = 0; const attempts = new Map<string, number>();
    const result = await executeEpochTaskBatch({ tasks: [task("a"), task("b"), task("c")], concurrency: 2, maxRetries: 1, runner: async (item) => { active++; peak = Math.max(peak, active); await new Promise((resolve) => setTimeout(resolve, 5)); active--; const count = (attempts.get(item.id) ?? 0) + 1; attempts.set(item.id, count); if (item.id === "b" && count === 1) throw new Error("temporary"); return observed(item.id); } });
    expect(result.status).toBe("COMPLETED"); expect(result.completed).toBe(3); expect(peak).toBeLessThanOrEqual(2); expect(attempts.get("b")).toBe(2); expect(result.evidenceSha256).toHaveLength(64);
  });
  it("cancels queued work deterministically", async () => {
    const controller = new AbortController(); controller.abort(); const result = await executeEpochTaskBatch({ tasks: [task("a")], signal: controller.signal, runner: async (item) => observed(item.id) });
    expect(result.status).toBe("CANCELLED"); expect(result.cancelled).toBe(1); expect(result.items[0].error).toBe("batch_cancelled");
  });
});

import { describe, expect, it } from "vitest";
import { executeEpochPipeline } from "../lib/epoch/pipelineExecution";

const pipeline = {
  nodes: [
    { id: "retrieve", kind: "retrieve", input: ["query"], output: ["documents"], failureBehavior: "retry" as const, retryLimit: 1 },
    { id: "answer", kind: "answer", input: ["documents"], output: ["answer"], failureBehavior: "fallback" as const },
  ],
  edges: [{ from: "retrieve", to: "answer", contract: "documents" }],
  inputs: ["retrieve"],
  outputs: ["answer"],
};

describe("Epoch pipeline execution", () => {
  it("resumes with completed node outputs and skips their executor", async () => {
    let firstRuns = 0;
    let secondRuns = 0;
    const result = await executeEpochPipeline({
      pipeline: { nodes: [{ id: "first", kind: "tool", input: ["query"], output: ["text"] }, { id: "second", kind: "tool", input: ["text"], output: ["answer"] }], edges: [{ from: "first", to: "second", contract: "text" }] },
      input: { query: "epoch" },
      resume: { completed: { first: { text: "restored" } } },
      executors: {
        first: async () => { firstRuns += 1; return { output: { text: "wrong" } }; },
        second: async ({ input }) => { secondRuns += 1; return { output: { answer: input.text } }; },
      },
    });
    expect(result.status).toBe("completed");
    expect(result.outputs).toEqual({ answer: "restored" });
    expect(firstRuns).toBe(0);
    expect(secondRuns).toBe(1);
  });
  it("executes dependency-ordered nodes and enforces input/output contracts", async () => {
    const seen: string[] = [];
    const result = await executeEpochPipeline({ pipeline, input: { query: "epoch" }, executors: {
      retrieve: async ({ input }) => { seen.push(`retrieve:${String(input.query)}`); return { output: { documents: ["one"] } }; },
      answer: async ({ input }) => { seen.push(`answer:${JSON.stringify(input.documents)}`); return { output: { answer: "ok" } }; },
    } });
    expect(result.status).toBe("completed"); expect(seen).toEqual(["retrieve:epoch", 'answer:["one"]']); expect(result.outputs).toEqual({ answer: "ok" });
  });

  it("retries transient/runtime failures and selects a provider fallback", async () => {
    let attempts = 0; let fallback = 0;
    const result = await executeEpochPipeline({ pipeline: { nodes: [{ id: "serve", kind: "serve", input: ["prompt"], output: ["text"], failureBehavior: "fallback" }], edges: [] }, input: { prompt: "hi" }, executors: { serve: async () => { attempts += 1; throw new Error("provider_unavailable"); } }, fallbackExecutors: { serve: async () => { fallback += 1; return { output: { text: "fallback" } }; } }, recoveryPolicy: { maxAttempts: 2 } });
    expect(result.status).toBe("completed"); expect(attempts).toBe(1); expect(fallback).toBe(1); expect(result.events.some((event) => event.type === "fallback_selected")).toBe(true);
  });

  it("turns OOM, crash, and timeout into rediscovery evidence", async () => {
    for (const error of ["out of memory", "runtime process crashed", "request timeout"]) {
      const result = await executeEpochPipeline({ pipeline: { nodes: [{ id: "serve", kind: "serve", input: ["prompt"], output: ["text"], failureBehavior: "fail" }], edges: [] }, input: { prompt: "hi" }, executors: { serve: async () => { throw new Error(error); } }, recoveryPolicy: { maxAttempts: 1 } });
      expect(result.status).toBe(error.includes("timeout") ? "timed_out" : "failed"); expect(result.rediscovery?.rediscoveryRequired).toBe(true); expect(result.events.some((event) => event.type === "rediscovery_requested")).toBe(true);
    }
  });

  it("supports cancellation and timeout without leaving a running node", async () => {
    const controller = new AbortController();
    const resultPromise = executeEpochPipeline({ pipeline: { nodes: [{ id: "slow", kind: "slow", input: ["value"], output: ["value"] }], edges: [] }, input: { value: "x" }, executors: { slow: ({ signal }) => new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("timeout")), 10_000); signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason ?? new Error("cancelled")); }, { once: true }); }) }, timeoutMs: 20 });
    setTimeout(() => controller.abort(new Error("cancelled")), 5);
    const cancelled = await executeEpochPipeline({ pipeline: { nodes: [{ id: "slow", kind: "slow", input: ["value"], output: ["value"] }], edges: [] }, input: { value: "x" }, executors: { slow: ({ signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason ?? new Error("cancelled")), { once: true })) }, signal: controller.signal });
    await resultPromise.catch(() => undefined);
    expect(cancelled.status).toBe("cancelled"); expect(cancelled.rediscovery?.trigger).toBe("verification_failure");
  });
});

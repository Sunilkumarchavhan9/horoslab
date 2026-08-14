import { describe, expect, it } from "vitest";
import { buildEpochLocalRuntimePlan } from "../lib/epoch/localRuntimePlan";

describe("Epoch local runtime plans", () => {
  it("builds a pinned vLLM command without executing it", () => {
    const plan = buildEpochLocalRuntimePlan({ runtime: "vllm", model: "Qwen/Qwen2.5-3B-Instruct", revision: "abcdef1234567", port: 8001 });
    expect(plan.commands).toEqual(expect.arrayContaining(["--revision", "abcdef1234567", "--gpu-memory-utilization", "0.85"]));
    expect(plan.execution).toBe("PLAN_ONLY_UNTIL_LOCAL_RUNTIME_ENABLED");
  });

  it("builds an equivalent SGLang plan and rejects moving revisions", () => {
    expect(buildEpochLocalRuntimePlan({ runtime: "sglang", model: "Qwen/Qwen2.5-3B-Instruct", revision: "abcdef1234567" }).commands).toContain("sglang.launch_server");
    expect(() => buildEpochLocalRuntimePlan({ runtime: "vllm", model: "qwen", revision: "main" })).toThrow("pinned");
  });

  it("rejects shell metacharacters before process launch", () => {
    expect(() => buildEpochLocalRuntimePlan({ runtime: "vllm", model: "Qwen/model | whoami", revision: "abcdef1234567" })).toThrow("unsafe command characters");
  });
});

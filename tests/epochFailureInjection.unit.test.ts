import { describe, expect, it } from "vitest";
import { isEpochFailureInjected } from "../lib/epoch/failureInjection";
import { classifyEpochRuntimeError } from "../lib/epoch/recoveryPolicy";

describe("Epoch failure injection", () => {
  it("covers crash, OOM, timeout, and sandbox failure categories", () => {
    const env = { EPOCH_FAILURE_INJECTION: "pipeline_runtime_crash,pipeline_oom,pipeline_timeout,pipeline_sandbox_failure" };
    expect(isEpochFailureInjected("pipeline_runtime_crash", env)).toBe(true);
    expect(isEpochFailureInjected("pipeline_oom", env)).toBe(true);
    expect(classifyEpochRuntimeError("worker_lost:injected_runtime_crash")).toBe("worker_lost");
    expect(classifyEpochRuntimeError("timeout:injected_timeout")).toBe("timeout");
    expect(classifyEpochRuntimeError("sandbox_failure:injected_sandbox_failure")).toBe("unknown");
  });
});

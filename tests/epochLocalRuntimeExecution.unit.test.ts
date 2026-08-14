import { describe, expect, it, vi } from "vitest";
import { startEpochLocalRuntime } from "../lib/epoch/localRuntimeExecution";
import { isEpochFailureInjected } from "../lib/epoch/failureInjection";

describe("Epoch local runtime execution", () => {
  it("requires an explicit execution gate", async () => {
    const previous = process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED;
    delete process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED;
    await expect(startEpochLocalRuntime({ runtime: "vllm", model: "Qwen/model", revision: "abcdef1" })).rejects.toThrow("execution is disabled");
    if (previous === undefined) delete process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED; else process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED = previous;
  });

  it("starts only after the runtime health endpoint is ready", async () => {
    process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED = "true";
    const kill = vi.fn(() => true);
    const child = { pid: 4242, exitCode: null, kill } as any;
    const spawnImpl = vi.fn(() => child);
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 }));
    const runtime = await startEpochLocalRuntime({ runtime: "sglang", model: "Qwen/model", revision: "abcdef1", spawnImpl, fetchImpl });
    expect(runtime.status).toBe("READY");
    expect(spawnImpl).toHaveBeenCalledWith("python", expect.arrayContaining(["-m", "sglang.launch_server", "--revision", "abcdef1"]), expect.any(Object));
    runtime.stop();
    expect(kill).toHaveBeenCalled();
    delete process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED;
  });

  it("fails closed when the child process exits", async () => {
    process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED = "true";
    const child = { pid: 4343, exitCode: 1, kill: vi.fn(() => true) } as any;
    await expect(startEpochLocalRuntime({ runtime: "vllm", model: "Qwen/model", revision: "abcdef1", spawnImpl: vi.fn(() => child), fetchImpl: vi.fn() })).rejects.toThrow("exited");
    delete process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED;
  });

  it("rejects unsafe runtime arguments", async () => {
    await expect(startEpochLocalRuntime({ runtime: "vllm", model: "Qwen/model;whoami", revision: "abcdef1" })).rejects.toThrow("execution is disabled");
    process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED = "true";
    await expect(startEpochLocalRuntime({ runtime: "vllm", model: "Qwen/model;whoami", revision: "abcdef1" })).rejects.toThrow("unsafe command characters");
    delete process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED;
  });

  it("supports deterministic failure injection without changing production defaults", () => {
    expect(isEpochFailureInjected("local_runtime_health_timeout", { EPOCH_FAILURE_INJECTION: "local_runtime_health_timeout" })).toBe(true);
    expect(isEpochFailureInjected("local_runtime_process_exit", {})).toBe(false);
  });
});

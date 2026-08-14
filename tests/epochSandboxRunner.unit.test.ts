import { describe, expect, it } from "vitest";
import { buildEpochSandboxDockerArgs, runEpochSandbox, safeEpochSandboxFilePath } from "../lib/epoch/sandboxRunner";

describe("Epoch isolated sandbox", () => {
  it("fails closed when Docker execution is not explicitly enabled", async () => {
    const previous = process.env.EPOCH_SANDBOX_ENABLED;
    delete process.env.EPOCH_SANDBOX_ENABLED;
    const result = await runEpochSandbox({ command: ["sh", "-lc", "echo unsafe"] });
    expect(result.status).toBe("unavailable");
    if (previous) process.env.EPOCH_SANDBOX_ENABLED = previous;
  });

  it("builds a network-isolated resource-bounded Docker command", () => {
    const args = buildEpochSandboxDockerArgs({ image: "node:22-alpine", root: "C:/tmp/epoch", command: ["node", "-e", "console.log(1)"], memoryMb: 512, cpuLimit: 1, containerName: "epoch-test" });
    expect(args).toEqual(expect.arrayContaining(["--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--memory=512m", "--cpus=1", "--name", "epoch-test"]));
  });

  it("rejects sandbox file traversal", () => {
    expect(() => safeEpochSandboxFilePath("C:/tmp/epoch", "../escape.txt")).toThrow("escapes workspace");
  });
});

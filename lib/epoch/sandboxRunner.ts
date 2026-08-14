import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";

export type EpochSandboxInput = {
  image?: string;
  command: string[];
  files?: Record<string, string>;
  timeoutMs?: number;
  memoryMb?: number;
  cpuLimit?: number;
};

export type EpochSandboxResult = {
  status: "passed" | "failed" | "timed_out" | "unavailable";
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  outputSha256: string;
  isolation: { engine: "docker"; network: "none"; readOnlyRoot: true; capabilitiesDropped: true };
};

export class EpochSandboxError extends Error {
  constructor(message: string, public readonly code = "SANDBOX_FAILED") { super(message); this.name = "EpochSandboxError"; }
}

function bounded(value: number | undefined, fallback: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? Math.floor(value as number) : fallback)); }

export function safeEpochSandboxFilePath(root: string, file: string) {
  const normalized = file.replaceAll("/", sep);
  const resolved = join(root, normalized);
  const rel = relative(root, resolved);
  if (!rel || rel.startsWith("..") || rel.includes(`..${sep}`)) throw new EpochSandboxError("Sandbox file path escapes workspace", "INVALID_SANDBOX_PATH");
  return resolved;
}

export function buildEpochSandboxDockerArgs(input: { image: string; root: string; command: string[]; memoryMb: number; cpuLimit: number; containerName?: string }): string[] {
  const containerName = input.containerName ?? `epoch-sandbox-${randomUUID().slice(0, 12)}`;
  return ["run", "--rm", "--name", containerName, "--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--pids-limit=128", "--ipc=private", `--memory=${input.memoryMb}m`, `--cpus=${input.cpuLimit}`, "--tmpfs=/tmp:rw,noexec,nosuid,size=128m", "-v", `${input.root}:/workspace:ro`, "-w", "/workspace", input.image, ...input.command];
}

function cleanupDockerContainer(containerName: string): void {
  const cleanup = spawn("docker", ["rm", "-f", containerName], { windowsHide: true, stdio: "ignore" });
  cleanup.on("error", () => undefined);
}

export async function runEpochSandbox(input: EpochSandboxInput): Promise<EpochSandboxResult> {
  if (process.env.EPOCH_SANDBOX_ENABLED?.trim().toLowerCase() !== "true") return { status: "unavailable", exitCode: null, signal: null, stdout: "", stderr: "EPOCH_SANDBOX_ENABLED is not true", durationMs: 0, outputSha256: createHash("sha256").update("unavailable").digest("hex"), isolation: { engine: "docker", network: "none", readOnlyRoot: true, capabilitiesDropped: true } };
  if (!Array.isArray(input.command) || input.command.length === 0 || input.command.length > 32 || input.command.some((part) => typeof part !== "string" || part.length > 2000)) throw new EpochSandboxError("Sandbox command must be a bounded argv array", "INVALID_SANDBOX_COMMAND");
  const image = input.image?.trim() || process.env.EPOCH_SANDBOX_IMAGE?.trim();
  if (!image || !/^[A-Za-z0-9][A-Za-z0-9./_:@-]{0,240}$/.test(image)) throw new EpochSandboxError("Sandbox image is not configured or invalid", "SANDBOX_IMAGE_REQUIRED");
  const timeoutMs = bounded(input.timeoutMs, 120_000, 1000, 900_000);
  const memoryMb = bounded(input.memoryMb, 1024, 128, 8192);
  const cpuLimit = Math.min(8, Math.max(0.1, Number(input.cpuLimit ?? 1)));
  const root = await mkdtemp(join(tmpdir(), "epoch-sandbox-"));
  try {
    for (const [file, content] of Object.entries(input.files ?? {})) {
      if (file.length > 500 || content.length > 2_000_000) throw new EpochSandboxError("Sandbox file exceeds limits", "SANDBOX_INPUT_TOO_LARGE");
      const target = safeEpochSandboxFilePath(root, file);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
    }
    const containerName = `epoch-sandbox-${randomUUID().slice(0, 12)}`;
    const args = buildEpochSandboxDockerArgs({ image, root, command: input.command, memoryMb, cpuLimit, containerName });
    const startedAt = Date.now();
    return await new Promise<EpochSandboxResult>((resolve) => {
      const child = spawn("docker", args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = ""; let stderr = ""; let timedOut = false;
      const append = (current: string, chunk: Buffer) => `${current}${chunk.toString("utf8")}`.slice(0, 1_000_000);
      child.stdout.on("data", (chunk: Buffer) => { stdout = append(stdout, chunk); });
      child.stderr.on("data", (chunk: Buffer) => { stderr = append(stderr, chunk); });
      const timer = setTimeout(() => { timedOut = true; cleanupDockerContainer(containerName); child.kill("SIGKILL"); }, timeoutMs);
      child.on("error", (error) => { clearTimeout(timer); cleanupDockerContainer(containerName); resolve({ status: "unavailable", exitCode: null, signal: null, stdout, stderr: error.message, durationMs: Date.now() - startedAt, outputSha256: createHash("sha256").update(stdout + stderr).digest("hex"), isolation: { engine: "docker", network: "none", readOnlyRoot: true, capabilitiesDropped: true } }); });
      child.on("close", (exitCode, signal) => { clearTimeout(timer); resolve({ status: timedOut ? "timed_out" : exitCode === 0 ? "passed" : "failed", exitCode, signal, stdout, stderr, durationMs: Date.now() - startedAt, outputSha256: createHash("sha256").update(stdout + stderr).digest("hex"), isolation: { engine: "docker", network: "none", readOnlyRoot: true, capabilitiesDropped: true } }); });
    });
  } finally { await rm(root, { recursive: true, force: true }); }
}

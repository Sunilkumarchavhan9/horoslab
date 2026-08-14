import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import { prisma } from "../storage/prismaClient";

const exec = promisify(execFile);

export type EpochLocalCapabilities = {
  source: "local-host";
  observedAt: string;
  host: { platform: string; arch: string; cpuCores: number; memoryGb: number };
  gpus: Array<{ name: string; vramGb: number | null; driverVersion: string | null; computeCapability: string | null }>;
  runtimes: Array<{ name: "docker" | "ollama" | "vllm" | "sglang"; available: boolean; version: string | null; details: string | null }>;
  capabilities: string[];
};

async function command(name: string, args: string[] = []) {
  try { const result = await exec(name, args, { windowsHide: true, timeout: 10_000, maxBuffer: 200_000 }); return { available: true, output: `${result.stdout ?? ""}`.trim() }; }
  catch { return { available: false, output: "" }; }
}

function numberOrNull(value: string) { const parsed = Number(value.trim()); return Number.isFinite(parsed) ? parsed : null; }

export async function discoverEpochLocalCapabilities(): Promise<EpochLocalCapabilities> {
  const [gpu, docker, ollama] = await Promise.all([
    command("nvidia-smi", ["--query-gpu=name,memory.total,driver_version,compute_cap", "--format=csv,noheader,nounits"]),
    command("docker", ["version", "--format", "{{.Server.Version}}"]),
    command("ollama", ["--version"]),
  ]);
  const gpus = gpu.output.split(/\r?\n/).map((line) => line.split(",").map((item) => item.trim())).filter((parts) => parts.length >= 1 && parts[0]).map((parts) => ({ name: parts[0], vramGb: parts[1] ? (numberOrNull(parts[1]) ?? 0) / 1024 : null, driverVersion: parts[2] || null, computeCapability: parts[3] || null }));
  const runtimes: EpochLocalCapabilities["runtimes"] = [
    { name: "docker", available: docker.available, version: docker.output || null, details: docker.available ? "Docker daemon responded" : "Docker command or daemon unavailable" },
    { name: "ollama", available: ollama.available, version: ollama.output || null, details: ollama.available ? "Ollama CLI responded" : "Ollama CLI unavailable" },
    { name: "vllm", available: Boolean(process.env.EPOCH_LOCAL_VLLM_ENDPOINT?.trim()), version: process.env.EPOCH_LOCAL_VLLM_VERSION?.trim() || null, details: process.env.EPOCH_LOCAL_VLLM_ENDPOINT?.trim() ? "Configured endpoint" : "Set EPOCH_LOCAL_VLLM_ENDPOINT to register vLLM" },
    { name: "sglang", available: Boolean(process.env.EPOCH_LOCAL_SGLANG_ENDPOINT?.trim()), version: process.env.EPOCH_LOCAL_SGLANG_VERSION?.trim() || null, details: process.env.EPOCH_LOCAL_SGLANG_ENDPOINT?.trim() ? "Configured endpoint" : "Set EPOCH_LOCAL_SGLANG_ENDPOINT to register SGLang" },
  ];
  const capabilities = ["local_host", ...(gpus.length ? ["gpu", "nvidia_gpu"] : []), ...runtimes.filter((runtime) => runtime.available).map((runtime) => runtime.name), docker.available ? "container_sandbox" : ""].filter(Boolean);
  return { source: "local-host", observedAt: new Date().toISOString(), host: { platform: process.platform, arch: process.arch, cpuCores: os.cpus().length, memoryGb: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10 }, gpus, runtimes, capabilities };
}

export async function syncEpochLocalCapabilities(scope: { workspaceId: string; userId: string; orgId?: string }, snapshot: EpochLocalCapabilities) {
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "local-host", name: "local-machine" }, select: { id: true } });
  const data = { workspaceId: scope.workspaceId, userId: scope.userId, orgId: scope.orgId, name: "local-machine", source: "local-host", version: snapshot.observedAt, status: "active", capabilities: snapshot.capabilities, metadata: snapshot };
  return existing ? prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data }) : prisma.epochCapabilityRegistry.create({ data });
}

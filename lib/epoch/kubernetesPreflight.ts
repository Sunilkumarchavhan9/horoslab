import { spawn } from "node:child_process";

export type EpochKubernetesPreflightInput = { context?: string; requiredGpuCount?: number };
export type EpochKubernetesNodeSummary = { name: string; ready: boolean; cpuCapacity: string | null; gpuCapacity: number; gpuBrand: string | null };
export type EpochKubernetesPreflightResult = {
  status: "READY" | "BLOCKED";
  context: string | null;
  cpuNodeCount: number;
  readyCpuNodeCount: number;
  gpuNodeCount: number;
  availableGpuCount: number;
  requiredGpuCount: number;
  nodes: EpochKubernetesNodeSummary[];
  checks: Array<{ id: string; status: "PASS" | "FAIL"; detail: string }>;
  observedAt: string;
};

export class EpochKubernetesPreflightError extends Error {
  constructor(message: string, public readonly code = "KUBERNETES_PREFLIGHT_FAILED") { super(message); this.name = "EpochKubernetesPreflightError"; }
}

function requiredGpuCount(value: number | undefined): number { return Math.max(1, Math.min(8, Number.isFinite(value) ? Math.floor(value as number) : 1)); }

export function summarizeEpochKubernetesNodes(payload: unknown): EpochKubernetesNodeSummary[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { items?: unknown }).items)) throw new EpochKubernetesPreflightError("kubectl returned an invalid node document", "KUBERNETES_INVALID_NODE_DOCUMENT");
  return ((payload as { items: unknown[] }).items).flatMap((item): EpochKubernetesNodeSummary[] => {
    if (!item || typeof item !== "object") return [];
    const node = item as { metadata?: { name?: unknown; labels?: Record<string, unknown> }; status?: { conditions?: unknown[]; allocatable?: Record<string, unknown> } };
    const conditions = Array.isArray(node.status?.conditions) ? node.status.conditions : [];
    const ready = conditions.some((condition) => Boolean(condition && typeof condition === "object" && (condition as { type?: unknown }).type === "Ready" && (condition as { status?: unknown }).status === "True"));
    const allocatable = node.status?.allocatable ?? {};
    const rawGpu = allocatable["nvidia.com/gpu"] ?? allocatable["amd.com/gpu"] ?? 0;
    const gpuCapacity = typeof rawGpu === "number" ? rawGpu : Number.parseInt(String(rawGpu), 10) || 0;
    const name = typeof node.metadata?.name === "string" ? node.metadata.name : "unknown-node";
    const labels = node.metadata?.labels ?? {};
    const gpuBrand = typeof labels["doks.digitalocean.com/gpu-brand"] === "string" ? labels["doks.digitalocean.com/gpu-brand"] : typeof labels["accelerator"] === "string" ? labels["accelerator"] : null;
    return [{ name, ready, cpuCapacity: typeof allocatable.cpu === "string" ? allocatable.cpu : null, gpuCapacity, gpuBrand }];
  });
}

async function kubectlNodes(context?: string): Promise<{ context: string | null; payload: unknown }> {
  const args = context?.trim() ? ["--context", context.trim(), "get", "nodes", "-o", "json"] : ["get", "nodes", "-o", "json"];
  return new Promise((resolve, reject) => {
    const child = spawn("kubectl", args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    const timeout = setTimeout(() => { child.kill(); reject(new EpochKubernetesPreflightError("kubectl preflight timed out", "KUBERNETES_PREFLIGHT_TIMEOUT")); }, 20_000);
    child.stdout.on("data", (chunk: Buffer) => { stdout = `${stdout}${chunk.toString("utf8")}`.slice(0, 4_000_000); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = `${stderr}${chunk.toString("utf8")}`.slice(0, 100_000); });
    child.on("error", (error) => { clearTimeout(timeout); reject(new EpochKubernetesPreflightError(error.message, "KUBECTL_UNAVAILABLE")); });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) { reject(new EpochKubernetesPreflightError(stderr.trim() || `kubectl exited with ${code}`, "KUBERNETES_CLUSTER_UNAVAILABLE")); return; }
      try { resolve({ context: context?.trim() || null, payload: JSON.parse(stdout) }); } catch { reject(new EpochKubernetesPreflightError("kubectl returned invalid JSON", "KUBERNETES_INVALID_NODE_DOCUMENT")); }
    });
  });
}

export async function preflightEpochKubernetes(input: EpochKubernetesPreflightInput = {}): Promise<EpochKubernetesPreflightResult> {
  const required = requiredGpuCount(input.requiredGpuCount);
  const response = await kubectlNodes(input.context);
  const nodes = summarizeEpochKubernetesNodes(response.payload);
  const cpuNodes = nodes.filter((node) => Boolean(node.cpuCapacity));
  const readyCpuNodes = cpuNodes.filter((node) => node.ready);
  const gpuNodes = nodes.filter((node) => node.gpuCapacity > 0);
  const availableGpuCount = gpuNodes.filter((node) => node.ready).reduce((total, node) => total + node.gpuCapacity, 0);
  const checks = [
    { id: "cluster_reachable", status: "PASS" as const, detail: `kubectl returned ${nodes.length} node(s)` },
    { id: "cpu_pool", status: readyCpuNodes.length > 0 ? "PASS" as const : "FAIL" as const, detail: `${readyCpuNodes.length}/${cpuNodes.length} CPU node(s) ready` },
    { id: "gpu_capacity", status: availableGpuCount >= required ? "PASS" as const : "FAIL" as const, detail: `${availableGpuCount} ready GPU(s), ${required} required` },
  ];
  return { status: checks.every((check) => check.status === "PASS") ? "READY" : "BLOCKED", context: response.context, cpuNodeCount: cpuNodes.length, readyCpuNodeCount: readyCpuNodes.length, gpuNodeCount: gpuNodes.length, availableGpuCount, requiredGpuCount: required, nodes, checks, observedAt: new Date().toISOString() };
}

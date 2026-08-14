import { createHash } from "node:crypto";
import { prisma } from "../storage/prismaClient";

export const EPOCH_PROBED_RUNTIME_TARGETS = ["ollama", "vllm", "sglang", "tensorrt_llm", "tei", "diffusers", "nvidia_nim", "onnxruntime"] as const;
export type EpochProbedRuntimeTarget = (typeof EPOCH_PROBED_RUNTIME_TARGETS)[number];

export type EpochRuntimeCapabilityProbe = {
  target: EpochProbedRuntimeTarget;
  endpoint: string | null;
  reachable: boolean;
  status: number | null;
  version: string | null;
  models: string[];
  latencyMs: number | null;
  reasons: string[];
  evidenceSha256: string;
  observedAt: string;
};

export type EpochGpuCapacitySnapshot = {
  version: "epoch_gpu_capacity.v1";
  observedAt: string;
  gpuCount: number;
  totalVramMb: number;
  availableVramMb: number;
  reservedVramMb: number;
  reservations: Array<{ id: string; vramMb: number; status: "active" | "released"; ownerId?: string; leaseExpiresAt?: string }>;
  evidenceSha256: string;
};

function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function endpointEnv(target: EpochProbedRuntimeTarget) { return `EPOCH_RUNTIME_${target.toUpperCase()}_ENDPOINT`; }

async function probeEndpoint(endpoint: string, target: EpochProbedRuntimeTarget, fetchImpl: typeof fetch): Promise<EpochRuntimeCapabilityProbe> {
  const startedAt = Date.now();
  const evidence: unknown[] = [];
  try {
    const base = new URL(endpoint);
    const request = async (suffix: string) => fetchImpl(new URL(suffix, `${base.origin}${base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`}`).toString(), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    const health = await request("health");
    evidence.push({ path: "health", status: health.status });
    let version: string | null = null;
    let models: string[] = [];
    for (const suffix of ["version", "info", "v1/models"]) {
      try {
        const response = await request(suffix);
        const body = await response.json().catch(() => null) as Record<string, unknown> | null;
        evidence.push({ path: suffix, status: response.status });
        if (typeof body?.version === "string") version = body.version;
        if (Array.isArray(body?.data)) models = body.data.flatMap((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string" ? [(item as Record<string, unknown>).id as string] : []);
      } catch { /* optional metadata endpoint */ }
    }
    const observedAt = new Date().toISOString();
    const reachable = health.status >= 200 && health.status < 400;
    return { target, endpoint: base.origin + base.pathname, reachable, status: health.status, version, models, latencyMs: Date.now() - startedAt, reasons: reachable ? [] : [`health_http_${health.status}`], evidenceSha256: hash(evidence), observedAt };
  } catch (error) {
    const observedAt = new Date().toISOString();
    return { target, endpoint, reachable: false, status: null, version: null, models: [], latencyMs: Date.now() - startedAt, reasons: [error instanceof Error ? error.message : "runtime_probe_failed"], evidenceSha256: hash(evidence), observedAt };
  }
}

export async function probeEpochCapabilityFabric(input: { env?: NodeJS.ProcessEnv; targets?: EpochProbedRuntimeTarget[]; fetchImpl?: typeof fetch }): Promise<{ version: "epoch_capability_probe.v1"; runtimes: EpochRuntimeCapabilityProbe[]; observedAt: string; evidenceSha256: string }> {
  const env = input.env ?? process.env;
  const fetchImpl = input.fetchImpl ?? fetch;
  const targets = input.targets ?? [...EPOCH_PROBED_RUNTIME_TARGETS];
  const runtimes = await Promise.all(targets.map(async (target) => {
    const endpoint = env[endpointEnv(target)]?.trim() || null;
    if (!endpoint) return { target, endpoint: null, reachable: false, status: null, version: null, models: [], latencyMs: null, reasons: ["endpoint_not_configured"], evidenceSha256: hash({ target, reason: "endpoint_not_configured" }), observedAt: new Date().toISOString() } satisfies EpochRuntimeCapabilityProbe;
    return probeEndpoint(endpoint, target, fetchImpl);
  }));
  const observedAt = new Date().toISOString();
  return { version: "epoch_capability_probe.v1", runtimes, observedAt, evidenceSha256: hash({ runtimes, observedAt }) };
}

export function buildEpochGpuCapacitySnapshot(input: { gpus: Array<{ name: string; vramGb: number | null }>; reservations?: Array<{ id: string; vramMb: number; status?: "active" | "released"; ownerId?: string; leaseExpiresAt?: string }>; observedAt?: Date }): EpochGpuCapacitySnapshot {
  const reservations = (input.reservations ?? []).map((reservation) => ({ ...reservation, status: reservation.status ?? "active" as const }));
  const totalVramMb = input.gpus.reduce((sum, gpu) => sum + Math.max(0, Math.round((gpu.vramGb ?? 0) * 1024)), 0);
  const reservedVramMb = reservations.filter((reservation) => reservation.status === "active").reduce((sum, reservation) => sum + reservation.vramMb, 0);
  const availableVramMb = Math.max(0, totalVramMb - reservedVramMb);
  const observedAt = (input.observedAt ?? new Date()).toISOString();
  const unsigned = { version: "epoch_gpu_capacity.v1" as const, observedAt, gpuCount: input.gpus.length, totalVramMb, availableVramMb, reservedVramMb, reservations };
  return { ...unsigned, evidenceSha256: hash(unsigned) };
}

export function reserveEpochGpuCapacity(input: { snapshot: EpochGpuCapacitySnapshot; reservationId: string; vramMb: number }): EpochGpuCapacitySnapshot {
  if (!Number.isInteger(input.vramMb) || input.vramMb <= 0) throw new Error("epoch_gpu_reservation_invalid_size");
  if (input.snapshot.reservations.some((reservation) => reservation.id === input.reservationId && reservation.status === "active")) throw new Error("epoch_gpu_reservation_duplicate");
  if (input.vramMb > input.snapshot.availableVramMb) throw new Error("epoch_gpu_capacity_insufficient");
  return buildEpochGpuCapacitySnapshot({ gpus: [{ name: "reserved-capacity", vramGb: input.snapshot.totalVramMb / 1024 }], reservations: [...input.snapshot.reservations.filter((reservation) => reservation.status === "active"), { id: input.reservationId, vramMb: input.vramMb, status: "active" }], observedAt: new Date(input.snapshot.observedAt) });
}

const gpuCapacityLocks = new Map<string, Promise<void>>();

async function withGpuCapacityLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = gpuCapacityLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  gpuCapacityLocks.set(key, queued);
  await previous;
  try { return await operation(); } finally { release(); if (gpuCapacityLocks.get(key) === queued) gpuCapacityLocks.delete(key); }
}

export function releaseEpochGpuCapacity(input: { snapshot: EpochGpuCapacitySnapshot; reservationId: string }): EpochGpuCapacitySnapshot {
  const reservations = input.snapshot.reservations.map((reservation) => reservation.id === input.reservationId ? { ...reservation, status: "released" as const } : reservation);
  return buildEpochGpuCapacitySnapshot({ gpus: [{ name: "released-capacity", vramGb: input.snapshot.totalVramMb / 1024 }], reservations, observedAt: new Date() });
}

export function reconcileEpochGpuCapacity(input: { snapshot: EpochGpuCapacitySnapshot; now?: Date }): { snapshot: EpochGpuCapacitySnapshot; releasedReservationIds: string[] } {
  const now = (input.now ?? new Date()).getTime();
  const releasedReservationIds = input.snapshot.reservations.filter((reservation) => reservation.status === "active" && reservation.leaseExpiresAt && Date.parse(reservation.leaseExpiresAt) <= now).map((reservation) => reservation.id);
  const reservations = input.snapshot.reservations.map((reservation) => releasedReservationIds.includes(reservation.id) ? { ...reservation, status: "released" as const } : reservation);
  return { snapshot: buildEpochGpuCapacitySnapshot({ gpus: [{ name: "reconciled-capacity", vramGb: input.snapshot.totalVramMb / 1024 }], reservations, observedAt: input.now ?? new Date() }), releasedReservationIds };
}

export async function persistEpochCapabilityProbe(scope: { workspaceId: string; userId: string; orgId?: string }, probe: EpochRuntimeCapabilityProbe) {
  const name = `runtime:${probe.target}`;
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "runtime-probe", name }, select: { id: true, metadata: true } });
  const prior = existing?.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
  const metadata = { ...prior, latest: probe, history: [...(Array.isArray(prior.history) ? prior.history : []), probe].slice(-50) };
  const data = { workspaceId: scope.workspaceId, userId: scope.userId, orgId: scope.orgId, name, source: "runtime-probe", version: probe.version ?? "unknown", status: probe.reachable ? "active" : "unknown", capabilities: probe.models, metadata } as any;
  return existing ? prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data }) : prisma.epochCapabilityRegistry.create({ data });
}

export async function persistEpochGpuCapacity(scope: { workspaceId: string; userId: string; orgId?: string }, snapshot: EpochGpuCapacitySnapshot) {
  const name = "gpu-capacity:local";
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "gpu-capacity", name }, select: { id: true, metadata: true } });
  const prior = existing?.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
  const metadata = { ...prior, latest: snapshot, history: [...(Array.isArray(prior.history) ? prior.history : []), snapshot].slice(-50) };
  const data = { workspaceId: scope.workspaceId, userId: scope.userId, orgId: scope.orgId, name, source: "gpu-capacity", version: snapshot.observedAt, status: "active", capabilities: ["gpu_capacity", `gpu_count:${snapshot.gpuCount}`], metadata } as any;
  return existing ? prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data }) : prisma.epochCapabilityRegistry.create({ data });
}

export async function loadEpochRuntimeProbeMap(workspaceId: string): Promise<Record<string, EpochRuntimeCapabilityProbe>> {
  const rows = await prisma.epochCapabilityRegistry.findMany({ where: { workspaceId, source: "runtime-probe" }, select: { name: true, metadata: true } });
  return Object.fromEntries(rows.flatMap((row) => {
    const latest = row.metadata && typeof row.metadata === "object" && (row.metadata as Record<string, unknown>).latest && typeof (row.metadata as Record<string, unknown>).latest === "object" ? (row.metadata as Record<string, unknown>).latest as EpochRuntimeCapabilityProbe : null;
    return latest ? [[row.name.replace(/^runtime:/, ""), latest]] : [];
  }));
}

async function loadGpuCapacity(scope: { workspaceId: string }): Promise<{ id: string; snapshot: EpochGpuCapacitySnapshot } | null> {
  const row = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "gpu-capacity", name: "gpu-capacity:local" }, select: { id: true, metadata: true } });
  const latest = row?.metadata && typeof row.metadata === "object" && (row.metadata as Record<string, unknown>).latest && typeof (row.metadata as Record<string, unknown>).latest === "object" ? (row.metadata as Record<string, unknown>).latest as EpochGpuCapacitySnapshot : null;
  return row && latest ? { id: row.id, snapshot: latest } : null;
}

export async function reservePersistedEpochGpuCapacity(scope: { workspaceId: string; userId: string; orgId?: string }, input: { reservationId: string; vramMb: number; ownerId?: string; leaseMs?: number }) {
  return withGpuCapacityLock(scope.workspaceId, async () => {
    const current = await loadGpuCapacity(scope);
    if (!current) throw new Error("epoch_gpu_capacity_not_initialized");
    const reconciled = reconcileEpochGpuCapacity({ snapshot: current.snapshot });
    const snapshot = reserveEpochGpuCapacity({ snapshot: reconciled.snapshot, reservationId: input.reservationId, vramMb: input.vramMb });
    const reservation = snapshot.reservations.find((item) => item.id === input.reservationId);
    if (reservation) { reservation.ownerId = input.ownerId; reservation.leaseExpiresAt = new Date(Date.now() + Math.max(1_000, input.leaseMs ?? 60_000)).toISOString(); }
    const leasedSnapshot = buildEpochGpuCapacitySnapshot({ gpus: [{ name: "persisted-capacity", vramGb: snapshot.totalVramMb / 1024 }], reservations: snapshot.reservations, observedAt: new Date() });
    await persistEpochGpuCapacity(scope, leasedSnapshot);
    return leasedSnapshot;
  });
}

export async function releasePersistedEpochGpuCapacity(scope: { workspaceId: string; userId: string; orgId?: string }, reservationId: string) {
  return withGpuCapacityLock(scope.workspaceId, async () => {
    const current = await loadGpuCapacity(scope);
    if (!current) throw new Error("epoch_gpu_capacity_not_initialized");
    const snapshot = releaseEpochGpuCapacity({ snapshot: current.snapshot, reservationId });
    await persistEpochGpuCapacity(scope, snapshot);
    return snapshot;
  });
}

export async function reconcilePersistedEpochGpuCapacity(scope: { workspaceId: string; userId: string; orgId?: string }, now?: Date) {
  return withGpuCapacityLock(scope.workspaceId, async () => {
    const current = await loadGpuCapacity(scope);
    if (!current) throw new Error("epoch_gpu_capacity_not_initialized");
    const result = reconcileEpochGpuCapacity({ snapshot: current.snapshot, now });
    if (result.releasedReservationIds.length > 0) await persistEpochGpuCapacity(scope, result.snapshot);
    return result;
  });
}

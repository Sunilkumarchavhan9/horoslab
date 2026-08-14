import { createHmac, timingSafeEqual } from "node:crypto";

export type EpochEdgeEnrollment = { workerId: string; workspaceId: string; certificateId: string; issuedAt: string; expiresAt: string; protocol: "epoch.worker.v1"; signature?: string };
export type EpochEdgeTelemetry = { workerId: string; sequence: number; observedAt: string; connectivity: "online" | "offline"; metrics: Record<string, number>; signature: string };
export type EpochEdgeQueuedJob = { id: string; payload: Record<string, unknown>; queuedAt: string; attempts: number; sequence?: number };
export type EpochEdgePhase = "REGISTERING" | "AVAILABLE" | "ASSIGNED" | "EXECUTING" | "DEGRADED" | "UNREACHABLE" | "OFFLINE" | "DRAINING" | "RETIRED";
export type EpochEdgeState = {
  phase: EpochEdgePhase;
  capabilities: string[];
  revoked: boolean;
  revocationReason?: string;
  pendingJobs: EpochEdgeQueuedJob[];
  acknowledgedJobIds: string[];
  completedJobIds: string[];
  failedJobIds: string[];
  lastKnownVersion?: string;
  lastKnownChecksum?: string;
};

export function normalizeEpochEdgeState(metadata: Record<string, unknown> | undefined, capabilities: string[] = []): EpochEdgeState {
  const raw = metadata?.edgeState;
  const state = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const pendingJobs = Array.isArray(state.pendingJobs) ? state.pendingJobs.filter((job): job is EpochEdgeQueuedJob => Boolean(job && typeof job === "object" && typeof (job as Record<string, unknown>).id === "string")) : [];
  return {
    phase: typeof state.phase === "string" ? state.phase as EpochEdgePhase : "REGISTERING",
    capabilities: Array.isArray(state.capabilities) ? state.capabilities.filter((item): item is string => typeof item === "string") : [...capabilities],
    revoked: state.revoked === true,
    revocationReason: typeof state.revocationReason === "string" ? state.revocationReason : undefined,
    pendingJobs,
    acknowledgedJobIds: Array.isArray(state.acknowledgedJobIds) ? state.acknowledgedJobIds.filter((item): item is string => typeof item === "string") : [],
    completedJobIds: Array.isArray(state.completedJobIds) ? state.completedJobIds.filter((item): item is string => typeof item === "string") : [],
    failedJobIds: Array.isArray(state.failedJobIds) ? state.failedJobIds.filter((item): item is string => typeof item === "string") : [],
    lastKnownVersion: typeof state.lastKnownVersion === "string" ? state.lastKnownVersion : undefined,
    lastKnownChecksum: typeof state.lastKnownChecksum === "string" ? state.lastKnownChecksum : undefined,
  };
}

export function advertiseEpochEdgeCapabilities(state: EpochEdgeState, capabilities: string[]): EpochEdgeState {
  const normalized = [...new Set(capabilities.map((value) => value.trim()).filter(Boolean))];
  if (normalized.length === 0) throw new Error("epoch_edge_capabilities_required");
  if (state.revoked || state.phase === "RETIRED") throw new Error("epoch_edge_worker_revoked");
  return { ...state, capabilities: normalized, phase: "AVAILABLE" };
}

export function queueEpochEdgeJob(state: EpochEdgeState, job: EpochEdgeQueuedJob): EpochEdgeState {
  if (state.revoked || state.phase === "RETIRED") throw new Error("epoch_edge_worker_revoked");
  if (state.pendingJobs.some((queued) => queued.id === job.id) || state.acknowledgedJobIds.includes(job.id)) throw new Error("epoch_edge_job_duplicate");
  return { ...state, pendingJobs: [...state.pendingJobs, { ...job, attempts: Math.max(0, job.attempts) }], phase: "ASSIGNED" };
}

export function reconcileEpochEdgeQueue(state: EpochEdgeState, input: { completedJobIds?: string[]; failedJobIds?: string[] }): { state: EpochEdgeState; replay: EpochEdgeQueuedJob[]; completed: string[]; failed: string[] } {
  if (state.revoked || state.phase === "RETIRED") return { state: { ...state, pendingJobs: [] }, replay: [], completed: [], failed: [] };
  const completed = [...new Set(input.completedJobIds ?? [])];
  const failed = [...new Set(input.failedJobIds ?? [])];
  const completedSet = new Set(completed);
  const failedSet = new Set(failed);
  const pendingJobs = state.pendingJobs.filter((job) => !completedSet.has(job.id) && !failedSet.has(job.id));
  const nextState: EpochEdgeState = {
    ...state,
    phase: "AVAILABLE",
    pendingJobs,
    acknowledgedJobIds: [...new Set([...state.acknowledgedJobIds, ...completed, ...failed])],
    completedJobIds: [...new Set([...state.completedJobIds, ...completed])],
    failedJobIds: [...new Set([...state.failedJobIds, ...failed])],
  };
  return { state: nextState, replay: [...pendingJobs].sort((left, right) => (left.sequence ?? Number.MAX_SAFE_INTEGER) - (right.sequence ?? Number.MAX_SAFE_INTEGER)), completed, failed };
}

export function revokeEpochEdge(state: EpochEdgeState, reason: string): EpochEdgeState {
  return { ...state, phase: "RETIRED", revoked: true, revocationReason: reason.trim() || "revoked", pendingJobs: [] };
}

export function rollbackEpochEdgeUpdate(state: EpochEdgeState, version: string, checksum: string): EpochEdgeState {
  if (state.revoked || state.phase === "RETIRED") throw new Error("epoch_edge_worker_revoked");
  return { ...state, phase: "AVAILABLE", lastKnownVersion: version, lastKnownChecksum: checksum };
}

export function issueEpochEdgeEnrollment(input: { workerId: string; workspaceId: string; ttlMs?: number; now?: Date }): EpochEdgeEnrollment {
  if (!input.workerId || !input.workspaceId) throw new Error("epoch_edge_enrollment_scope_required");
  const now = input.now ?? new Date();
  return { workerId: input.workerId, workspaceId: input.workspaceId, certificateId: `edge-cert-${input.workerId}-${now.getTime()}`, issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + Math.max(60_000, input.ttlMs ?? 86_400_000)).toISOString(), protocol: "epoch.worker.v1" };
}

export function isEpochEdgeEnrollmentValid(enrollment: EpochEdgeEnrollment, now = new Date()): boolean { return enrollment.protocol === "epoch.worker.v1" && now < new Date(enrollment.expiresAt); }

function enrollmentPayload(enrollment: EpochEdgeEnrollment): string {
  return JSON.stringify({ workerId: enrollment.workerId, workspaceId: enrollment.workspaceId, certificateId: enrollment.certificateId, issuedAt: enrollment.issuedAt, expiresAt: enrollment.expiresAt, protocol: enrollment.protocol });
}

export function signEpochEdgeEnrollment(enrollment: EpochEdgeEnrollment, secret: string): string { return createHmac("sha256", secret).update(enrollmentPayload(enrollment)).digest("hex"); }
export function verifyEpochEdgeEnrollment(enrollment: EpochEdgeEnrollment, secret: string, now = new Date()): boolean {
  if (!isEpochEdgeEnrollmentValid(enrollment, now) || !enrollment.signature) return false;
  const expected = signEpochEdgeEnrollment(enrollment, secret);
  const actual = Buffer.from(enrollment.signature, "hex"); const target = Buffer.from(expected, "hex");
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export function signEpochEdgeTelemetry(input: Omit<EpochEdgeTelemetry, "signature">, secret: string): string { return createHmac("sha256", secret).update(JSON.stringify(input)).digest("hex"); }
export function verifyEpochEdgeTelemetry(input: EpochEdgeTelemetry, secret: string): boolean {
  const expected = signEpochEdgeTelemetry({ workerId: input.workerId, sequence: input.sequence, observedAt: input.observedAt, connectivity: input.connectivity, metrics: input.metrics }, secret);
  const actual = Buffer.from(input.signature, "hex"); const target = Buffer.from(expected, "hex");
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export function replayEpochEdgeQueue(queue: EpochEdgeQueuedJob[], handler: (job: EpochEdgeQueuedJob) => boolean): { completed: string[]; remaining: EpochEdgeQueuedJob[] } {
  const completed: string[] = []; const remaining: EpochEdgeQueuedJob[] = [];
  for (const job of queue) { if (handler(job)) completed.push(job.id); else remaining.push({ ...job, attempts: job.attempts + 1 }); }
  return { completed, remaining };
}

export function replayEpochEdgeQueueOrdered(queue: EpochEdgeQueuedJob[], handler: (job: EpochEdgeQueuedJob) => boolean): { completed: string[]; remaining: EpochEdgeQueuedJob[] } {
  const ordered = [...queue].sort((left, right) => (left.sequence ?? Number.MAX_SAFE_INTEGER) - (right.sequence ?? Number.MAX_SAFE_INTEGER) || left.queuedAt.localeCompare(right.queuedAt));
  const completed: string[] = [];
  const remaining: EpochEdgeQueuedJob[] = [];
  let blocked = false;
  for (const job of ordered) {
    if (blocked) {
      remaining.push({ ...job });
      continue;
    }
    if (!handler(job)) {
      blocked = true;
      remaining.push({ ...job, attempts: job.attempts + 1 });
      continue;
    }
    completed.push(job.id);
  }
  return { completed, remaining };
}

export function validateEpochEdgeTelemetrySequence(input: { previousSequence?: number; currentSequence: number }): { accepted: boolean; reason: "initial" | "next" | "duplicate" | "gap" | "regression" } {
  if (input.currentSequence < 0 || !Number.isInteger(input.currentSequence)) return { accepted: false, reason: "regression" };
  if (input.previousSequence === undefined) return { accepted: true, reason: "initial" };
  if (input.currentSequence === input.previousSequence) return { accepted: false, reason: "duplicate" };
  if (input.currentSequence < input.previousSequence) return { accepted: false, reason: "regression" };
  if (input.currentSequence !== input.previousSequence + 1) return { accepted: false, reason: "gap" };
  return { accepted: true, reason: "next" };
}

export type EpochEdgeSimulationResult = {
  enrollmentValid: boolean;
  telemetryValid: boolean;
  telemetrySequence: ReturnType<typeof validateEpochEdgeTelemetrySequence>;
  replay: ReturnType<typeof replayEpochEdgeQueueOrdered>;
};

export function runEpochEdgeSimulation(input: {
  enrollment: EpochEdgeEnrollment;
  enrollmentSecret: string;
  telemetry: EpochEdgeTelemetry;
  telemetrySecret: string;
  previousTelemetrySequence?: number;
  queue: EpochEdgeQueuedJob[];
  execute: (job: EpochEdgeQueuedJob) => boolean;
  now?: Date;
}): EpochEdgeSimulationResult {
  const enrollmentValid = verifyEpochEdgeEnrollment(input.enrollment, input.enrollmentSecret, input.now);
  const telemetryValid = verifyEpochEdgeTelemetry(input.telemetry, input.telemetrySecret);
  const telemetrySequence = validateEpochEdgeTelemetrySequence({ previousSequence: input.previousTelemetrySequence, currentSequence: input.telemetry.sequence });
  const replay = enrollmentValid && telemetryValid && telemetrySequence.accepted
    ? replayEpochEdgeQueueOrdered(input.queue, input.execute)
    : { completed: [], remaining: input.queue.map((job) => ({ ...job })) };
  return { enrollmentValid, telemetryValid, telemetrySequence, replay };
}

export function validateEpochEdgeUpdate(input: { version: string; checksum: string; signature: string; payload: string }, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(`${input.version}:${input.checksum}:${input.payload}`).digest("hex");
  const actual = Buffer.from(input.signature, "hex"); const target = Buffer.from(expected, "hex");
  return actual.length === target.length && timingSafeEqual(actual, target);
}

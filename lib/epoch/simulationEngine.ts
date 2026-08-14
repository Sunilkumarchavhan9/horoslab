import type { EpochCandidate } from "./candidateEngine";

export type EpochSimulationResult = {
  version: "epoch_simulation.v1";
  status: "PREDICTED" | "BLOCKED";
  evidenceStatus: "PREDICTED_NOT_OBSERVED";
  candidateId: string;
  predicted: {
    replicas: number | null;
    throughputRequestsPerSecond: number | null;
    p95LatencyMs: number | null;
    costPerHour: number | null;
    costPerRequest: number | null;
    monthlyProjection: number | null;
    vramUtilizationPct: number | null;
  };
  assumptions: string[];
  warnings: string[];
};

function number(value: unknown): number | null { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

export function simulateEpochCandidate(input: { candidate: EpochCandidate; workload?: Record<string, unknown>; monthlyHours?: number }): EpochSimulationResult {
  const candidate = input.candidate;
  if (candidate.compatibility.status === "INCOMPATIBLE") return { version: "epoch_simulation.v1", status: "BLOCKED", evidenceStatus: "PREDICTED_NOT_OBSERVED", candidateId: candidate.id, predicted: { replicas: null, throughputRequestsPerSecond: null, p95LatencyMs: null, costPerHour: null, costPerRequest: null, monthlyProjection: null, vramUtilizationPct: null }, assumptions: [], warnings: ["candidate is incompatible and cannot be simulated"] };
  const workload = input.workload ?? candidate.workload;
  const requestRate = number(workload.requestRatePerSecond ?? workload.requestRate) ?? 0;
  const concurrency = Math.max(1, number(workload.concurrency) ?? 1);
  const outputTokenValue = workload.outputTokens && typeof workload.outputTokens === "object" ? (workload.outputTokens as Record<string, unknown>).p50 : workload.outputTokens;
  const outputTokens = Math.max(1, number(outputTokenValue) ?? 128);
  const runtime = candidate.runtime;
  const hardware = candidate.hardware;
  const model = candidate.model;
  const throughputTokens = number(runtime.throughputTokensPerSecond ?? runtime.tokensPerSecond ?? hardware.throughputTokensPerSecond);
  const explicitRps = number(runtime.requestsPerSecond ?? runtime.maxRequestsPerSecond);
  const capacityRps = explicitRps ?? (throughputTokens !== null ? throughputTokens / outputTokens : null);
  const replicas = capacityRps !== null && requestRate > 0 ? Math.max(1, Math.ceil(requestRate / capacityRps)) : capacityRps !== null ? 1 : null;
  const throughputRequestsPerSecond = capacityRps !== null && replicas !== null ? capacityRps * replicas : null;
  const utilization = throughputRequestsPerSecond !== null && throughputRequestsPerSecond > 0 ? Math.min(99, requestRate / throughputRequestsPerSecond * 100) : null;
  const baseLatency = number(runtime.baseLatencyMs ?? runtime.latencyMs) ?? 100;
  const p95LatencyMs = capacityRps !== null ? Number((baseLatency * (1 + Math.min(4, concurrency / Math.max(1, capacityRps)) * 0.25)).toFixed(2)) : null;
  const costPerHour = number(hardware.costPerHour ?? runtime.costPerHour);
  const costPerRequest = costPerHour !== null && throughputRequestsPerSecond !== null && throughputRequestsPerSecond > 0 ? Number((costPerHour / throughputRequestsPerSecond / 3600).toFixed(8)) : null;
  const monthlyRequests = number(workload.monthlyRequests);
  const monthlyProjection = costPerRequest !== null && monthlyRequests !== null ? Number((costPerRequest * monthlyRequests).toFixed(2)) : costPerHour !== null ? Number((costPerHour * (input.monthlyHours ?? 730)).toFixed(2)) : null;
  const requiredVram = number(model.requiredVramGb);
  const availableVram = number(hardware.vramGb);
  const vramUtilizationPct = requiredVram !== null && availableVram !== null && availableVram > 0 ? Number((requiredVram / availableVram * 100).toFixed(2)) : null;
  const assumptions = ["Simulation is predictive and has not been benchmark verified", "Capacity is derived from declared runtime throughput or request capacity", "Latency uses a queue-pressure approximation", "Cost uses declared hourly hardware/runtime cost"];
  const warnings: string[] = [];
  if (candidate.compatibility.status === "UNKNOWN") warnings.push("candidate compatibility contains unknown facts");
  if (capacityRps === null) warnings.push("runtime throughput is unknown; capacity and latency are unavailable");
  if (costPerHour === null) warnings.push("hourly cost is unknown; economics are incomplete");
  return { version: "epoch_simulation.v1", status: "PREDICTED", evidenceStatus: "PREDICTED_NOT_OBSERVED", candidateId: candidate.id, predicted: { replicas, throughputRequestsPerSecond, p95LatencyMs, costPerHour, costPerRequest, monthlyProjection, vramUtilizationPct }, assumptions, warnings };
}

export function simulateEpochCandidates(input: { candidates: EpochCandidate[]; workload?: Record<string, unknown>; monthlyHours?: number }): EpochSimulationResult[] {
  return input.candidates.map((candidate) => simulateEpochCandidate({ candidate, workload: input.workload, monthlyHours: input.monthlyHours }));
}

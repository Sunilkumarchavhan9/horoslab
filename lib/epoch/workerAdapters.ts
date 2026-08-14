export const EPOCH_WORKER_KINDS = ["software", "ai_agent", "simulated_edge", "human"] as const;
export type EpochWorkerAdapterKind = (typeof EPOCH_WORKER_KINDS)[number];

export type EpochWorkerAdapter = {
  kind: EpochWorkerAdapterKind;
  protocol: "epoch.worker.v1";
  capabilities: string[];
  accepts: (job: { type: string; payload?: Record<string, unknown> }) => boolean;
  evaluationSignals: string[];
};

const adapters: Record<EpochWorkerAdapterKind, EpochWorkerAdapter> = {
  software: { kind: "software", protocol: "epoch.worker.v1", capabilities: ["code", "tests", "files"], accepts: (job) => ["plan", "execute", "verify"].includes(job.type), evaluationSignals: ["tests_passed", "files_changed", "runtime_ms"] },
  ai_agent: { kind: "ai_agent", protocol: "epoch.worker.v1", capabilities: ["reasoning", "tools", "structured_output"], accepts: (job) => ["plan", "execute", "review", "verify"].includes(job.type), evaluationSignals: ["tool_calls", "schema_valid", "policy_decisions"] },
  simulated_edge: { kind: "simulated_edge", protocol: "epoch.worker.v1", capabilities: ["offline_queue", "telemetry", "edge_execution"], accepts: (job) => Boolean(job.payload?.edgeSimulation === true), evaluationSignals: ["offline_ms", "telemetry_events", "replayed_jobs"] },
  human: { kind: "human", protocol: "epoch.worker.v1", capabilities: ["approval", "review", "judgement"], accepts: (job) => ["review", "verify"].includes(job.type), evaluationSignals: ["review_latency_ms", "approval", "uncertainty"] },
};

export function getEpochWorkerAdapter(kind: string): EpochWorkerAdapter | null {
  return adapters[kind as EpochWorkerAdapterKind] ?? null;
}

export function listEpochWorkerAdapters(): EpochWorkerAdapter[] {
  return Object.values(adapters);
}

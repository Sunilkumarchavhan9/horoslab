import type { EpochAiModel, EpochAiProvider } from "./aiRuntime";

export type EpochAiExecutionKind = "provider" | "local_gpu" | "edge" | "human";
export type EpochAiPrivacy = "public" | "tenant" | "private";

export type EpochAiWorkerTelemetry = {
  gpuUtilizationPct?: number;
  vramUsedMb?: number;
  vramTotalMb?: number;
  temperatureC?: number;
  throughputTokensPerSecond?: number;
  queueDepth?: number;
  loadedModels?: string[];
  observedAt: string;
};

export type EpochAiExecutionEndpoint = {
  id: string;
  kind: EpochAiExecutionKind;
  provider: EpochAiProvider | "ollama" | "vllm" | "lm_studio" | "nvidia_nim" | "human";
  model: string;
  capabilities: string[];
  contextWindow?: number;
  privacy: EpochAiPrivacy;
  region?: string;
  costPer1kTokens: number;
  latencyMs: number;
  reliability: number;
  queueDepth: number;
  available: boolean;
  telemetry?: EpochAiWorkerTelemetry;
};

export type EpochAiExecutionPolicy = {
  requiredCapabilities?: string[];
  allowedProviders?: string[];
  allowedPrivacy?: EpochAiPrivacy[];
  preferredRegion?: string;
  maxCostPer1kTokens?: number;
  maxLatencyMs?: number;
  minimumReliability?: number;
  allowFallback?: boolean;
};

export type EpochAiExecutionRoute = {
  selected: EpochAiExecutionEndpoint;
  fallback: EpochAiExecutionEndpoint[];
  considered: Array<{ endpointId: string; score: number; eligible: boolean; reasons: string[] }>;
  policy: EpochAiExecutionPolicy;
};

export function discoverEpochAiExecutionEndpoints(models: EpochAiModel[], extra: EpochAiExecutionEndpoint[] = []): EpochAiExecutionEndpoint[] {
  const catalogEndpoints = models.map((model) => ({
    id: `${model.provider}:${model.model}`,
    kind: "provider" as const,
    provider: model.provider,
    model: model.model,
    capabilities: [...model.capabilities],
    contextWindow: model.contextWindow,
    privacy: model.provider === "local" || model.provider === "private" ? "private" as const : "tenant" as const,
    costPer1kTokens: (model.inputCostPer1k + model.outputCostPer1k) / 2,
    latencyMs: 1_000,
    reliability: 0.8,
    queueDepth: 0,
    available: true,
  }));
  return [...catalogEndpoints, ...extra].map((endpoint) => ({ ...endpoint, capabilities: [...endpoint.capabilities] }));
}

export function mapEpochWorkersToAiExecutionEndpoints(workers: Array<{
  id: string;
  kind: string;
  capabilities: unknown;
  metadata: unknown;
  activeLeases: number;
  status: string;
}>): EpochAiExecutionEndpoint[] {
  return workers.flatMap((worker) => {
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata)
      ? worker.metadata as Record<string, unknown>
      : {};
    const provider = typeof metadata.provider === "string" ? metadata.provider : null;
    const model = typeof metadata.model === "string" ? metadata.model : null;
    if (!provider || !model) return [];
    const rawTelemetry = metadata.telemetry && typeof metadata.telemetry === "object" && !Array.isArray(metadata.telemetry)
      ? metadata.telemetry as Record<string, unknown>
      : null;
    const telemetry = rawTelemetry && typeof rawTelemetry.observedAt === "string"
      ? {
          gpuUtilizationPct: typeof rawTelemetry.gpuUtilizationPct === "number" ? rawTelemetry.gpuUtilizationPct : undefined,
          vramUsedMb: typeof rawTelemetry.vramUsedMb === "number" ? rawTelemetry.vramUsedMb : undefined,
          vramTotalMb: typeof rawTelemetry.vramTotalMb === "number" ? rawTelemetry.vramTotalMb : undefined,
          temperatureC: typeof rawTelemetry.temperatureC === "number" ? rawTelemetry.temperatureC : undefined,
          throughputTokensPerSecond: typeof rawTelemetry.throughputTokensPerSecond === "number" ? rawTelemetry.throughputTokensPerSecond : undefined,
          queueDepth: typeof rawTelemetry.queueDepth === "number" ? rawTelemetry.queueDepth : undefined,
          loadedModels: Array.isArray(rawTelemetry.loadedModels) ? rawTelemetry.loadedModels.filter((value): value is string => typeof value === "string") : undefined,
          observedAt: rawTelemetry.observedAt,
        }
      : undefined;
    const kind: EpochAiExecutionKind = ["ollama", "vllm", "lm_studio", "nvidia_nim"].includes(provider) || worker.kind.includes("gpu")
      ? "local_gpu"
      : worker.kind.includes("edge")
        ? "edge"
        : "provider";
    return [{
      id: worker.id,
      kind,
      provider: provider as EpochAiExecutionEndpoint["provider"],
      model,
      capabilities: Array.isArray(worker.capabilities) ? worker.capabilities.filter((value): value is string => typeof value === "string") : [],
      privacy: metadata.privacy === "private" ? "private" : metadata.privacy === "public" ? "public" : "tenant",
      region: typeof metadata.region === "string" ? metadata.region : undefined,
      costPer1kTokens: typeof metadata.costPer1kTokens === "number" ? metadata.costPer1kTokens : 0,
      latencyMs: typeof metadata.latencyMs === "number" ? metadata.latencyMs : 1_000,
      reliability: typeof metadata.reliability === "number" ? metadata.reliability : 0.8,
      queueDepth: worker.activeLeases,
      available: worker.status === "available" || worker.status === "busy",
      telemetry,
    }];
  });
}

function endpointScore(endpoint: EpochAiExecutionEndpoint, policy: EpochAiExecutionPolicy): number {
  const capabilityScore = endpoint.capabilities.length === 0 ? 0 : Math.min(30, endpoint.capabilities.length * 3);
  const reliabilityScore = Math.max(0, Math.min(40, endpoint.reliability * 40));
  const latencyScore = Math.max(0, 20 - Math.min(20, endpoint.latencyMs / 500));
  const queueScore = Math.max(0, 10 - Math.min(10, endpoint.queueDepth));
  const regionScore = policy.preferredRegion && endpoint.region === policy.preferredRegion ? 8 : 0;
  const costScore = Math.max(0, 12 - Math.min(12, endpoint.costPer1kTokens * 4));
  return capabilityScore + reliabilityScore + latencyScore + queueScore + regionScore + costScore;
}

export function routeEpochAiExecution(input: { endpoints: EpochAiExecutionEndpoint[]; policy?: EpochAiExecutionPolicy }): EpochAiExecutionRoute {
  const policy = input.policy ?? {};
  const required = new Set(policy.requiredCapabilities ?? []);
  const considered = input.endpoints.map((endpoint) => {
    const reasons: string[] = [];
    if (!endpoint.available) reasons.push("unavailable");
    if (policy.allowedProviders && !policy.allowedProviders.includes(endpoint.provider)) reasons.push("provider_not_allowed");
    if (policy.allowedPrivacy && !policy.allowedPrivacy.includes(endpoint.privacy)) reasons.push("privacy_not_allowed");
    if (policy.maxCostPer1kTokens !== undefined && endpoint.costPer1kTokens > policy.maxCostPer1kTokens) reasons.push("cost_limit_exceeded");
    if (policy.maxLatencyMs !== undefined && endpoint.latencyMs > policy.maxLatencyMs) reasons.push("latency_limit_exceeded");
    if (policy.minimumReliability !== undefined && endpoint.reliability < policy.minimumReliability) reasons.push("reliability_below_policy");
    if (![...required].every((capability) => endpoint.capabilities.includes(capability))) reasons.push("capability_missing");
    return { endpointId: endpoint.id, score: endpointScore(endpoint, policy), eligible: reasons.length === 0, reasons };
  });
  const eligible = input.endpoints
    .filter((endpoint) => considered.find((item) => item.endpointId === endpoint.id)?.eligible)
    .sort((a, b) => endpointScore(b, policy) - endpointScore(a, policy));
  if (eligible.length === 0) throw new Error("epoch_ai_execution_no_eligible_endpoint");
  return {
    selected: eligible[0],
    fallback: policy.allowFallback === false ? [] : eligible.slice(1),
    considered,
    policy,
  };
}

export type EpochAiExecutionHealth = {
  endpointId: string;
  available: boolean;
  status: "healthy" | "degraded" | "offline";
  queueDepth: number;
  reliability: number;
  latencyMs: number;
  telemetry?: EpochAiWorkerTelemetry;
};

export function buildEpochAiExecutionHealth(endpoints: EpochAiExecutionEndpoint[]): EpochAiExecutionHealth[] {
  return endpoints.map((endpoint) => ({
    endpointId: endpoint.id,
    available: endpoint.available,
    status: !endpoint.available
      ? "offline"
      : endpoint.reliability < 0.7 || endpoint.queueDepth >= 10 || (endpoint.telemetry?.temperatureC ?? 0) >= 90 || ((endpoint.telemetry?.vramUsedMb ?? 0) > 0 && (endpoint.telemetry?.vramTotalMb ?? 0) > 0 && (endpoint.telemetry?.vramUsedMb ?? 0) / (endpoint.telemetry?.vramTotalMb ?? 1) >= 0.95)
        ? "degraded"
        : "healthy",
    queueDepth: endpoint.queueDepth,
    reliability: endpoint.reliability,
    latencyMs: endpoint.latencyMs,
    telemetry: endpoint.telemetry,
  }));
}

export function buildEpochAiRebalancePlan(endpoints: EpochAiExecutionEndpoint[]): Array<{ endpointId: string; priority: number; action: "retain" | "drain" | "scale" }> {
  return [...endpoints]
    .sort((a, b) => endpointScore(b, {}) - endpointScore(a, {}))
    .map((endpoint, index) => ({
      endpointId: endpoint.id,
      priority: index + 1,
      action: !endpoint.available ? "drain" : endpoint.queueDepth >= 10 ? "scale" : "retain",
    }));
}

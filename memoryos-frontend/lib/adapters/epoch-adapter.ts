import {
  createEpochDeployment,
  createEpochProgram,
  createEpochProgramRun,
  executeEpochAiTest,
  getEpochDeployment,
  getEpochAiExecutionOverview,
  getEpochProgram,
  listEpochDeployments,
  listEpochEvidence,
  listEpochHuggingFaceModels,
  searchEpochHuggingFaceModels,
  listEpochPrograms,
  listEpochProgramRuns,
  listEpochRegistryArtifacts,
  rollbackEpochDeployment,
  updateEpochProgramStatus,
} from "../epoch-api";
import {
  EvidenceItem,
  EpochRuntimeOverview,
  ModelEntity,
  Program,
  ProgramStatus,
  RegistryArtifact,
  RunEntity,
  DeploymentEntity,
} from "../epoch-types";

type JsonRecord = Record<string, unknown>;

function text(value: unknown, fallback = "Unknown"): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function mapModel(endpoint: JsonRecord): ModelEntity {
  const provider = text(endpoint.provider, "unknown");
  const model = text(endpoint.model, text(endpoint.name, "unknown"));
  const capabilities = Array.isArray(endpoint.capabilities)
    ? endpoint.capabilities.filter((item): item is string => typeof item === "string")
    : [];
  const latency = number(endpoint.latencyMs);
  const available = endpoint.available !== false;

  return {
    id: text(endpoint.id, `${provider}:${model}`),
    name: model,
    provider,
    task: "general",
    parameters: "Unknown",
    contextWindow: number(endpoint.contextWindow),
    license: "Unknown",
    format: "API",
    status: available ? "available" : "paused",
    bestObservedProfile: {
      engine: provider,
      hardware: "Unknown",
      executionDomain: "cloud",
      p95LatencyMs: latency,
      costPer1M: number(endpoint.costPer1kTokens) * 1000,
    },
    capabilities,
    variants: [],
    description: `Live ${provider} execution endpoint for ${model}.`,
    version: "live",
  };
}

function mapHuggingFaceModel(value: JsonRecord): ModelEntity {
  const metadata = asRecord(value.metadata);
  const inspection = asRecord(metadata.inspection);
  const repositoryId = text(value.name, text(inspection.repositoryId));
  const revision = text(value.version, text(inspection.revision, "unknown"));
  const commitSha = text(inspection.commitSha, revision);
  const governance = asRecord(inspection.governance);
  const formats = Array.isArray(inspection.formats) ? inspection.formats.filter((item): item is string => typeof item === "string") : [];
  const tags = Array.isArray(value.capabilities)
    ? value.capabilities.filter((item): item is string => typeof item === "string")
    : Array.isArray(inspection.tags) ? inspection.tags.filter((item): item is string => typeof item === "string") : [];
  const status = text(value.status, "unknown").toLowerCase();
  const task = text(inspection.taskFamily, text(inspection.task, "unknown"));
  const contextWindow = number(inspection.contextLength, number(inspection.maxPositionEmbeddings));
  const parameterCount = number(inspection.parameterCount);

  return {
    id: text(value.id, repositoryId), name: repositoryId, provider: "Hugging Face", task,
    parameters: parameterCount > 0 ? `${parameterCount.toLocaleString()} parameters` : "Unknown",
    contextWindow, license: text(inspection.license, "Unknown"), format: formats.length ? formats.join(", ") : "Unknown",
    status: status === "active" ? "ready" : status === "syncing" ? "evaluating" : "paused",
    hfIdentity: { repositoryId, revision, commitSha, artifactDigest: text(inspection.artifactDigest, "") || undefined, license: text(inspection.license, "Unknown"), isGated: inspection.gated === true, retrievedAt: text(inspection.retrievedAt, text(value.updatedAt, new Date(0).toISOString())) },
    bestObservedProfile: { engine: "Not verified", hardware: "Not verified", executionDomain: "software", p95LatencyMs: 0, costPer1M: 0 },
    capabilities: tags, variants: [], importedFrom: "huggingface", version: revision,
    description: `${task} model synced from Hugging Face at commit ${commitSha}. ${governance.status ? `Governance: ${text(governance.status)}.` : ""}`.trim(),
  };
}

function mapRun(execution: JsonRecord): RunEntity {
  const startedAt = text(execution.createdAt, text(execution.startedAt, new Date(0).toISOString()));
  const finishedAt = text(execution.finishedAt, startedAt);
  const startedMs = Date.parse(startedAt);
  const finishedMs = Date.parse(finishedAt);
  const latencyMs = number(execution.latencyMs, Number.isFinite(finishedMs - startedMs) ? Math.max(0, finishedMs - startedMs) : 0);
  const success = execution.success === true || execution.status === "completed" || execution.status === "success";
  const status = text(execution.status, success ? "completed" : "failed");
  const provider = text(execution.provider, text(execution.providerId, "unknown"));
  const model = text(execution.model, "unknown");

  return {
    id: text(execution.id, `execution-${startedAt}`),
    type: "ai_execution",
    programId: "ai-execution",
    programName: "AI Execution",
    candidateName: model,
    environment: provider,
    executionDomain: "cloud",
    status: status === "running" ? "running" : status === "queued" ? "queued" : success ? "completed" : "failed",
    durationSeconds: latencyMs / 1000,
    startedAt,
    trustLevel: "OBSERVED",
    metrics: {
      latencyP95: latencyMs,
      throughputTps: number(execution.outputTokens) > 0 && latencyMs > 0 ? number(execution.outputTokens) / (latencyMs / 1000) : 0,
      gpuMemoryGb: number(execution.gpuHours),
      costUsd: number(execution.estimatedCost, number(execution.estimatedCostCents) / 100),
      qualityScore: success ? 100 : 0,
    },
    logs: [
      {
        timestamp: startedAt,
        level: success ? "info" : "error",
        message: success ? `Observed ${provider}/${model} execution.` : text(execution.error, `Observed ${provider}/${model} execution failure.`),
      },
    ],
  };
}

function mapEvidence(item: JsonRecord): EvidenceItem {
  const claim = text(item.summary, text(item.kind, "Observed runtime evidence"));
  const payload = asRecord(item.payload);
  const proof = asRecord(item.proof);
  const verdict = text(payload.verdict, "NOT_PROVEN").toUpperCase() as EvidenceItem["verdict"];
  const trustLevel = text(payload.trustLevel, "OBSERVED").toUpperCase() as EvidenceItem["trustLevel"];

  return {
    id: text(item.id, "evidence"),
    claim,
    confidencePct: number(payload.confidencePct),
    programId: text(item.missionId, "runtime"),
    programName: "Runtime evidence",
    candidateName: text(payload.model, text(payload.provider, "Runtime")),
    verdict,
    trustLevel,
    measurementsCount: 0,
    runsCount: item.executionRunId ? 1 : 0,
    verificationChecksPassed: verdict === "VERIFIED_SUCCESS" ? 1 : 0,
    verificationChecksTotal: 1,
    hardwareProfilesEvaluated: 0,
    supportedByArtifacts: proof.contentHash ? [text(proof.contentHash)] : [],
    claimChain: {
      claim,
      measurements: [],
      runs: [],
      artifacts: proof.contentHash ? [{ name: "canonical evidence hash", hash: text(proof.contentHash) }] : [],
      verification: [{ rule: "Backend evidence record exists", passed: true, details: text(item.kind) }],
    },
  };
}

function mapProgramRecord(value: JsonRecord): Program {
  return value as unknown as Program;
}

function mapDeploymentRecord(value: JsonRecord): DeploymentEntity {
  const history = Array.isArray(value.history) ? value.history : [];
  return {
    ...value,
    id: text(value.id, "deployment"),
    name: text(value.name),
    model: text(value.model),
    environment: value.environment === "production" || value.environment === "edge" ? value.environment : "staging",
    executionDomain: value.executionDomain === "software" || value.executionDomain === "data_center" ? value.executionDomain : "cloud",
    region: text(value.region, "Unknown"),
    status: value.status === "live" || value.status === "stopped" || value.status === "degraded" || value.status === "deploying" ? value.status : "draft",
    activeVersion: text(value.activeVersion, "-"),
    requests24h: number(value.requests24h),
    p95LatencyMs: number(value.p95LatencyMs),
    errorRatePct: number(value.errorRatePct),
    cost24hUsd: number(value.cost24hUsd),
    endpointUrl: text(value.endpointUrl, ""),
    createdAt: text(value.createdAt, new Date(0).toISOString()),
    hasTraffic: value.hasTraffic === true,
    history: history.map((item) => {
      const entry = asRecord(item);
      return {
        timestamp: text(entry.timestamp, text(entry.at, new Date(0).toISOString())),
        requests: number(entry.requests),
        tokens: number(entry.tokens),
        latencyMs: number(entry.latencyMs),
        errors: number(entry.errors),
      };
    }),
  };
}

function mapRegistryRecord(value: JsonRecord): RegistryArtifact {
  const history = Array.isArray(value.historyTree) ? value.historyTree : [];
  return {
    id: text(value.id, "artifact"),
    name: text(value.name),
    type: value.type === "weights" || value.type === "variant" || value.type === "container" || value.type === "snapshot" ? value.type : "model",
    version: text(value.version, "-"),
    source: text(value.source, "-"),
    sizeBytes: String(number(value.sizeBytes)),
    integrityHash: text(value.integrityHash, "-"),
    status: value.status === "verified" || value.status === "active" || value.status === "archived" ? value.status : "building",
    createdAt: text(value.createdAt, new Date(0).toISOString()),
    usedByPrograms: Array.isArray(value.usedByPrograms) ? value.usedByPrograms.filter((item): item is string => typeof item === "string") : [],
    historyTree: history.map((item) => {
      const entry = asRecord(item);
      return {
        version: text(entry.version, text(value.version, "-")),
        label: text(entry.label, text(entry.event, "artifact")),
        isActive: entry.isActive === true,
        createdAt: text(entry.createdAt, text(entry.at, new Date(0).toISOString())),
      };
    }),
  };
}

export const epochAdapter = {
  async getLiveOverview(workspaceId: string): Promise<Awaited<ReturnType<typeof getEpochAiExecutionOverview>>> {
    return getEpochAiExecutionOverview(workspaceId);
  },

  async getOverview(workspaceId: string): Promise<EpochRuntimeOverview> {
    const [live, programs, deployments] = await Promise.all([
      getEpochAiExecutionOverview(workspaceId),
      listEpochPrograms(workspaceId),
      listEpochDeployments(workspaceId),
    ]);
    const executions = live.executions.map(mapRun);
    const costs = asRecord(live.costs);
    return {
      activeProgramsCount: programs.length,
      runningProgramsCount: programs.filter((program) => ["running", "execution", "benchmarking", "optimizing"].includes(text(program.status))).length,
      optimizingCount: 0,
      verifiedCount: executions.filter((run) => run.status === "completed").length,
      liveDeploymentsCount: deployments.filter((deployment) => deployment.status === "live").length,
      totalModelsAvailable: live.catalog.length,
      totalGpuHoursSavedPct: 0,
      balanceUsd: number(costs.estimatedCost),
    };
  },

  async getPrograms(workspaceId: string): Promise<Program[]> {
    return (await listEpochPrograms(workspaceId)).map(mapProgramRecord);
  },

  async getProgramById(workspaceId: string, id: string): Promise<Program | null> {
    try {
      return mapProgramRecord(await getEpochProgram(workspaceId, id));
    } catch {
      return null;
    }
  },

  async createProgram(workspaceId: string, payload: unknown): Promise<Program> {
    return mapProgramRecord(await createEpochProgram(workspaceId, asRecord(payload)));
  },

  async updateProgramStatus(workspaceId: string, id: string, status: ProgramStatus): Promise<Program | null> {
    try {
      return mapProgramRecord(await updateEpochProgramStatus(workspaceId, id, status));
    } catch {
      return null;
    }
  },

  async listProgramRuns(workspaceId: string, programId: string): Promise<JsonRecord[]> {
    return listEpochProgramRuns(workspaceId, programId);
  },

  async createProgramRun(workspaceId: string, programId: string, payload: JsonRecord): Promise<JsonRecord> {
    return createEpochProgramRun(workspaceId, programId, payload);
  },

  async getModels(workspaceId: string, search?: string): Promise<ModelEntity[]> {
    const [live, synced] = await Promise.all([getEpochAiExecutionOverview(workspaceId), listEpochHuggingFaceModels(workspaceId).catch(() => [])]);
    const models = [...synced.map(mapHuggingFaceModel), ...live.catalog.map(mapModel).filter((model) => !synced.some((item) => text(item.name) === model.name))];
    if (!search) return models;
    const query = search.toLowerCase();
    return models.filter((model) => [model.name, model.provider, model.task, ...model.capabilities].some((value) => value.toLowerCase().includes(query)));
  },

  async searchHuggingFaceModels(workspaceId: string, query: string): Promise<ModelEntity[]> {
    const results = await searchEpochHuggingFaceModels(workspaceId, query);
    return results.map((result): ModelEntity => ({
      id: result.repositoryId,
      name: result.repositoryId,
      provider: "Hugging Face",
      task: result.task ?? "unknown",
      parameters: "Unknown",
      contextWindow: 0,
      license: "Unknown until inspected",
      format: result.library ?? "Unknown",
      status: "paused",
      hfIdentity: {
        repositoryId: result.repositoryId,
        revision: "unresolved",
        commitSha: "unresolved",
        license: "Unknown until inspected",
        isGated: false,
        retrievedAt: new Date().toISOString(),
      },
      bestObservedProfile: {
        engine: "Not verified",
        hardware: "Not verified",
        executionDomain: "software",
        p95LatencyMs: 0,
        costPer1M: 0,
      },
      capabilities: result.tags,
      variants: [],
      importedFrom: "huggingface",
      description: `${result.repositoryId} discovered on Hugging Face. Inspect and sync it before execution.`,
    }));
  },

  async getModelById(workspaceId: string, id: string): Promise<ModelEntity | null> {
    const models = await this.getModels(workspaceId);
    return models.find((model) => model.id === id) ?? null;
  },

  async getRuns(workspaceId: string, filter?: { type?: string }): Promise<RunEntity[]> {
    const live = await getEpochAiExecutionOverview(workspaceId);
    const runs = live.executions.map(mapRun);
    return filter?.type && filter.type !== "all" ? runs.filter((run) => run.type === filter.type) : runs;
  },

  async getRunById(workspaceId: string, id: string): Promise<RunEntity | null> {
    const runs = await this.getRuns(workspaceId);
    return runs.find((run) => run.id === id) ?? null;
  },

  async getDeployments(workspaceId: string): Promise<DeploymentEntity[]> {
    return (await listEpochDeployments(workspaceId)).map(mapDeploymentRecord);
  },

  async getDeploymentById(workspaceId: string, id: string): Promise<DeploymentEntity | null> {
    try {
      return mapDeploymentRecord(await getEpochDeployment(workspaceId, id));
    } catch {
      return null;
    }
  },

  async rollbackDeployment(workspaceId: string, deploymentId: string): Promise<boolean> {
    await rollbackEpochDeployment(workspaceId, deploymentId);
    return true;
  },

  async getRegistry(workspaceId: string): Promise<RegistryArtifact[]> {
    return (await listEpochRegistryArtifacts(workspaceId)).map(mapRegistryRecord);
  },

  async createDeployment(workspaceId: string, payload: unknown): Promise<DeploymentEntity> {
    return mapDeploymentRecord(await createEpochDeployment(workspaceId, asRecord(payload)));
  },

  async getEvidence(workspaceId: string): Promise<EvidenceItem[]> {
    const result = await listEpochEvidence(workspaceId);
    return result.items.map((item) => mapEvidence(item as unknown as JsonRecord));
  },

  async getEvidenceById(workspaceId: string, id: string): Promise<EvidenceItem | null> {
    const evidence = await this.getEvidence(workspaceId);
    return evidence.find((item) => item.id === id) ?? null;
  },

  async executeTest(workspaceId: string, prompt: string): Promise<JsonRecord> {
    return executeEpochAiTest(workspaceId, prompt);
  },
};

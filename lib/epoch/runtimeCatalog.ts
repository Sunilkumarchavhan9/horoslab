import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";
import {
  getOperationalArtifactById,
  listOperationalArtifacts,
  saveOperationalArtifact,
  type OperationalArtifactRecord,
} from "../operational/artifactStore";

const DEPLOYMENT_KIND = "epoch_runtime_deployment";
const REGISTRY_KIND = "epoch_runtime_registry_artifact";

type RuntimeDeploymentData = {
  name: string;
  model: string;
  environment: "production" | "staging" | "edge";
  executionDomain: string;
  region: string;
  status: string;
  activeVersion: string;
  requests24h: number;
  p95LatencyMs: number;
  errorRatePct: number;
  cost24hUsd: number;
  endpointUrl?: string;
  hasTraffic: boolean;
  history: Array<Record<string, unknown>>;
};

type RuntimeRegistryData = {
  name: string;
  type: "model" | "weights" | "variant" | "container" | "snapshot";
  version: string;
  source: string;
  sizeBytes: number;
  integrityHash: string;
  status: "verified" | "active" | "archived" | "building";
  usedByPrograms: string[];
  historyTree: Array<Record<string, unknown>>;
};

function phaseForStatus(status: string): string {
  if (status === "running") return "optimize";
  if (status === "completed") return "verify";
  if (status === "failed") return "verify";
  return "discovery";
}

function frontendStatusForStatus(status: string): string {
  switch (status) {
    case "planned":
      return "draft";
    case "running":
      return "optimizing";
    case "completed":
      return "ready";
    case "failed":
      return "failed";
    case "paused":
      return "paused";
    default:
      return [
        "draft",
        "discovering",
        "hypothesizing",
        "benchmarking",
        "optimizing",
        "verifying",
        "ready",
        "deployed",
        "paused",
        "failed",
        "uncertain",
      ].includes(status)
        ? status
        : "uncertain";
  }
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapProgramRun(row: {
  id: string;
  discoveryProgramId: string;
  name: string;
  status: string;
  design: unknown;
  result: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Record<string, unknown> {
  return {
    id: row.id,
    programId: row.discoveryProgramId,
    name: row.name,
    status: row.status,
    design: row.design,
    result: row.result,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapProgram(row: {
  id: string;
  name: string;
  objective: string;
  status: string;
  questions: unknown;
  hypothesisIds: unknown;
  experimentIds: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Record<string, unknown> {
  const status = row.status || "planned";
  return {
    id: row.id,
    name: row.name,
    status: frontendStatusForStatus(status),
    currentPhase: phaseForStatus(status),
    objective: row.objective,
    modelTarget: "",
    worldState: {},
    capabilityGap: { currentPerformance: "", targetPerformance: "", costCurrent: "", costTarget: "", gapSummary: "", requiredCapabilities: [] },
    hypotheses: arrayOfStrings(row.hypothesisIds).map((id) => ({ id, statement: "", status: "uncertain", confidencePct: 0, evidenceSummary: "" })),
    outcomeTarget: {
      objective: row.objective,
      baselineCostMonthly: 0,
      targetCostMonthly: 0,
      maxP99LatencyMs: 0,
      minQualityRetentionPct: 0,
      downtimeAllowedSec: 0,
      observationWindowHours: 0,
      verdict: "NOT_PROVEN",
    },
    constraints: {},
    candidates: [],
    thinkingSteps: [],
    // Experiment rows are loaded from EpochExperiment. Do not synthesize history
    // from IDs because that makes planned work look like an executed run.
    experiments: [],
    lastActivity: row.updatedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    progressPct: status === "completed" ? 100 : status === "running" ? 50 : 0,
    questions: Array.isArray(row.questions) ? row.questions : [],
  };
}

export async function listEpochRuntimePrograms(workspaceId: string): Promise<Record<string, unknown>[]> {
  const rows = await prisma.epochDiscoveryProgram.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" } });
  return rows.map(mapProgram);
}

export async function getEpochRuntimeProgram(workspaceId: string, id: string): Promise<Record<string, unknown> | null> {
  const row = await prisma.epochDiscoveryProgram.findFirst({ where: { workspaceId, id } });
  return row ? mapProgram(row) : null;
}

export async function createEpochRuntimeProgram(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const row = await prisma.epochDiscoveryProgram.create({
    data: {
      workspaceId,
      unknownId: typeof input.unknownId === "string" && input.unknownId ? input.unknownId : `runtime-program:${randomUUID()}`,
      name: typeof input.name === "string" ? input.name : "",
      objective: typeof input.objective === "string" ? input.objective : "",
      status: "planned",
      questions: Array.isArray(input.questions) ? input.questions : [],
      hypothesisIds: Array.isArray(input.hypothesisIds) ? input.hypothesisIds : [],
      experimentIds: Array.isArray(input.experimentIds) ? input.experimentIds : [],
    },
  });
  return mapProgram(row);
}

export async function updateEpochRuntimeProgramStatus(workspaceId: string, id: string, status: string): Promise<Record<string, unknown> | null> {
  const existing = await prisma.epochDiscoveryProgram.findFirst({ where: { workspaceId, id } });
  if (!existing) return null;
  const row = await prisma.epochDiscoveryProgram.update({ where: { id }, data: { status } });
  return mapProgram(row);
}

export async function listEpochRuntimeProgramRuns(workspaceId: string, programId: string): Promise<Record<string, unknown>[] | null> {
  const program = await prisma.epochDiscoveryProgram.findFirst({ where: { workspaceId, id: programId }, select: { id: true } });
  if (!program) return null;
  const rows = await prisma.epochExperiment.findMany({
    where: { workspaceId, discoveryProgramId: programId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapProgramRun);
}

export async function createEpochRuntimeProgramRun(
  workspaceId: string,
  programId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const program = await prisma.epochDiscoveryProgram.findFirst({ where: { workspaceId, id: programId } });
  if (!program) return null;

  const run = await prisma.epochExperiment.create({
    data: {
      workspaceId,
      discoveryProgramId: programId,
      name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : program.name,
      status: "queued",
      design: {
        prompt: typeof input.prompt === "string" ? input.prompt : "",
        source: typeof input.source === "string" ? input.source : "pipeline_workspace",
      },
      result: {},
    },
  });

  const experimentIds = arrayOfStrings(program.experimentIds);
  await prisma.epochDiscoveryProgram.update({
    where: { id: programId },
    data: { experimentIds: [...experimentIds, run.id] },
  });
  return mapProgramRun(run);
}

function deploymentFromRecord(record: OperationalArtifactRecord<RuntimeDeploymentData>): Record<string, unknown> {
  return { id: record.id, ...record.data, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function listEpochRuntimeDeployments(workspaceId: string): Promise<Record<string, unknown>[]> {
  const records = await listOperationalArtifacts<RuntimeDeploymentData>({ kind: DEPLOYMENT_KIND, scope: workspaceId });
  return records.map(deploymentFromRecord);
}

export async function getEpochRuntimeDeployment(workspaceId: string, id: string): Promise<Record<string, unknown> | null> {
  const record = await getOperationalArtifactById<RuntimeDeploymentData>(id, DEPLOYMENT_KIND);
  return record && record.scope === workspaceId ? deploymentFromRecord(record) : null;
}

export async function createEpochRuntimeDeployment(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = `deployment_${randomUUID()}`;
  const now = new Date().toISOString();
  const data: RuntimeDeploymentData = {
    name: typeof input.name === "string" ? input.name : id,
    model: typeof input.model === "string" ? input.model : "",
    environment: input.environment === "production" || input.environment === "edge" ? input.environment : "staging",
    executionDomain: typeof input.executionDomain === "string" ? input.executionDomain : "cloud",
    region: typeof input.region === "string" ? input.region : "",
    status: "draft",
    activeVersion: typeof input.activeVersion === "string" ? input.activeVersion : "",
    requests24h: 0,
    p95LatencyMs: 0,
    errorRatePct: 0,
    cost24hUsd: 0,
    endpointUrl: typeof input.endpointUrl === "string" ? input.endpointUrl : undefined,
    hasTraffic: false,
    history: [{ event: "created", at: now }],
  };
  return deploymentFromRecord(await saveOperationalArtifact({ id, kind: DEPLOYMENT_KIND, scope: workspaceId, name: data.name, status: data.status, data, now }));
}

export async function rollbackEpochRuntimeDeployment(workspaceId: string, id: string): Promise<Record<string, unknown> | null> {
  const record = await getOperationalArtifactById<RuntimeDeploymentData>(id, DEPLOYMENT_KIND);
  if (!record || record.scope !== workspaceId) return null;
  const now = new Date().toISOString();
  const data = { ...record.data, status: "stopped", hasTraffic: false, history: [...record.data.history, { event: "rollback", at: now }] };
  return deploymentFromRecord(await saveOperationalArtifact({ id: record.id, kind: DEPLOYMENT_KIND, scope: workspaceId, name: record.name, status: data.status, data, now }));
}

function registryFromRecord(record: OperationalArtifactRecord<RuntimeRegistryData>): Record<string, unknown> {
  return { id: record.id, ...record.data, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function listEpochRuntimeRegistryArtifacts(workspaceId: string): Promise<Record<string, unknown>[]> {
  const records = await listOperationalArtifacts<RuntimeRegistryData>({ kind: REGISTRY_KIND, scope: workspaceId });
  return records.map(registryFromRecord);
}

export async function createEpochRuntimeRegistryArtifact(workspaceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = `registry_${randomUUID()}`;
  const now = new Date().toISOString();
  const type = input.type === "weights" || input.type === "variant" || input.type === "container" || input.type === "snapshot" ? input.type : "model";
  const data: RuntimeRegistryData = {
    name: typeof input.name === "string" ? input.name : id,
    type,
    version: typeof input.version === "string" ? input.version : "",
    source: typeof input.source === "string" ? input.source : "",
    sizeBytes: typeof input.sizeBytes === "number" ? input.sizeBytes : 0,
    integrityHash: typeof input.integrityHash === "string" ? input.integrityHash : "",
    status: "building",
    usedByPrograms: arrayOfStrings(input.usedByPrograms),
    historyTree: [{ event: "created", at: now }],
  };
  return registryFromRecord(await saveOperationalArtifact({ id, kind: REGISTRY_KIND, scope: workspaceId, name: data.name, status: data.status, data, now }));
}

import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import { buildMcpWorkspaceSnapshot } from "../lib/mcp/mcpIntrospection";
import {
  createApiKeyForUser,
  listApiKeysForUser,
  revokeApiKeyForUser,
} from "../../lib/auth/apiKeyStore";
import {
  CloneEpochInstitutionSchema,
  EpochAuthorityPolicyListQuerySchema,
  EpochAuthorityPolicySchema,
  EpochArtifactSchema,
  EpochArtifactListQuerySchema,
  EpochAuditExportSchema,
  EpochMissionControlBootstrapSchema,
  EpochCertificateExportSchema,
  EpochMissionApprovalActionSchema,
  EpochEventQuerySchema,
  EpochCertificateListQuerySchema,
  EpochEvidenceListQuerySchema,
  EpochIntegrationListQuerySchema,
  EpochQueueEnqueueSchema,
  EpochQueueFailSchema,
  EpochQueueListQuerySchema,
  EpochQueueLeaseSchema,
  EpochQueueRecoverySchema,
  EpochWorkerCompletionSchema,
  EpochArtifactAccessTokenQuerySchema,
  CreateEpochVerifierAssignmentSchema,
  CompleteEpochVerifierAssignmentSchema,
  CreateEpochWorkerSchema,
  EpochWorkerUpdateSchema,
  EpochWorkerHeartbeatSchema,
  EpochWorkerEvaluationSchema,
  EpochWorkerEvaluationListQuerySchema,
  EpochRecoveryEscalationSchema,
  EpochRecoveryEscalationResolveSchema,
  EpochSettlementSchema,
  CreateEpochEvidenceSchema,
  CreateEpochInstitutionSchema,
  CreateEpochIntegrationSchema,
  CreateEpochEnvironmentSchema,
  UpdateEpochEnvironmentSchema,
  CreateEpochProjectSchema,
  UpdateEpochProjectSchema,
  DiscoverEpochSoftwareWorldStateSchema,
  DiscoverEpochHttpWorldStateSchema,
  DiscoverEpochPostgresWorldStateSchema,
  DiscoverEpochDockerWorldStateSchema,
  DiscoverEpochKubernetesWorldStateSchema,
  DiscoverEpochTelemetryWorldStateSchema,
  DiscoverEpochCloudWorldStateSchema,
  DiscoverEpochDataCenterWorldStateSchema,
  EpochCloudActionSchema,
  CreateEpochSimulationSchema,
  RunEpochSimulationSchema,
  VerifyEpochSimulationSchema,
  PromoteEpochSimulationSchema,
  BindEpochIntegrationEnvironmentSchema,
  CreateEpochMissionSchema,
  EpochMissionControlExportSchema,
  EpochMissionControlRestoreSchema,
  CreateEpochTemplateSchema,
  EpochInstitutionParamsSchema,
  EpochInstitutionVersionsQuerySchema,
  EpochMissionParamsSchema,
  EpochMissionListQuerySchema,
  EpochSmokeRunSchema,
  EpochSmokeHistoryQuerySchema,
  EpochMemoryRecordListQuerySchema,
  EpochPagedQuerySchema,
  EpochWorkspaceParamsSchema,
  EpochExecutionRunParamsSchema,
  EpochExecutionRunListQuerySchema,
  IssueEpochCertificateSchema,
  RunEpochMissionSchema,
  EpochVerificationRunParamsSchema,
  EpochVerificationRunListQuerySchema,
  EpochCertificateParamsSchema,
  EpochMemoryRecordListViewQuerySchema,
  EpochMemoryRecordParamsSchema,
  EpochQueueJobParamsSchema,
  EpochArtifactParamsSchema,
  EpochMissionLifecycleActionSchema,
  EpochMissionControlSnapshotQuerySchema,
  UpdateEpochInstitutionSchema,
  UpdateEpochMissionSchema,
  VerifyEpochMissionSchema,
  EpochWebhookDeliveryListQuerySchema,
} from "../schemas/epoch.schema";
import { registerMemoryRealtimeSink } from "../../lib/memory/realtimeEventBus";
import {
  archiveEpochInstitution,
  cloneEpochInstitution,
  createEpochInstitution,
  createEpochMission,
  getEpochAuthorityGate,
  getEpochAuthorityPolicy,
  getEpochMissionControl,
  createEpochTemplate,
  getEpochTemplate,
  getEpochCertificate,
  getEpochIntegration,
  getEpochInstitution,
  getEpochMission,
  getEpochMemoryRecord,
  getEpochExecutionRun,
  issueEpochCertificate,
  listEpochInstitutions,
  listEpochAuthorityPolicies,
  listEpochInstitutionVersions,
  listEpochExecutionRuns,
  listEpochIntegrations,
  listEpochMissions,
  listEpochMemoryLessons,
  listEpochSmokeRuns,
  listEpochMemoryRecords,
  listEpochVerificationRuns,
  listEpochTemplates,
  recordEpochMemory,
  runEpochMission,
  runEpochVerification,
  getEpochVerificationRun,
  deleteEpochInstitution,
  updateEpochInstitution,
  updateEpochMission,
  updateEpochIntegration,
  setEpochMemoryLessonStatus,
  upsertEpochIntegration,
  appendEpochEvidence,
} from "../../lib/epoch/epochStore";
import { countServiceUsersForOrg } from "../../lib/auth/serviceUserStore";
import { buildEpochMissionControlSnapshot } from "../../lib/epoch/epochMissionControl";
import { buildEpochServiceCatalog, getEpochServiceCatalogEntry } from "../../lib/epoch/epochServiceCatalog";
import { summarizeCertificateService } from "../../lib/epoch/services/certificateService";
import { summarizeDeveloperService } from "../../lib/epoch/services/developerService";
import { summarizeEvidenceService } from "../../lib/epoch/services/evidenceService";
import { summarizeIntegrationService } from "../../lib/epoch/services/integrationService";
import { summarizeMemoryService } from "../../lib/epoch/services/memoryService";
import { summarizeAuthorityService } from "../../lib/epoch/services/authorityService";
import { summarizeExecutionService } from "../../lib/epoch/services/executionService";
import { summarizeInstitutionService } from "../../lib/epoch/services/institutionService";
import { summarizeMissionService } from "../../lib/epoch/services/missionService";
import { summarizeVerificationService } from "../../lib/epoch/services/verificationService";
import { restoreEpochMissionControlSnapshot } from "../../lib/epoch/epochRestore";
import { emitEpochRuntimeEvent, listEpochRuntimeEvents } from "../../lib/epoch/epochEvents";
import {
  acknowledgeEpochJob,
  enqueueEpochJob,
  deadLetterEpochJob,
  failEpochJob,
  getEpochQueueStatus,
  getEpochQueueJobForWorkspace,
  listEpochDeadLetters,
  leaseEpochJobs,
  listEpochQueueJobsPage,
  retryDeadLetterEpochJob,
} from "../../lib/epoch/epochQueue";
import { getEpochArtifactById, listEpochArtifacts, saveEpochArtifact } from "../../lib/epoch/epochArtifacts";
import { issueEpochArtifactAccessToken, verifyEpochArtifactAccessToken } from "../../lib/epoch/artifactAccess";
import { buildEpochEvidenceBundle } from "../../lib/epoch/evidenceBundle";
import {
  getEpochWebhookDeliveryStats,
  getEpochWebhookDelivery,
  listEpochWebhookEvents,
  listEpochWebhookDeliveriesPage,
  listEpochWebhookRetryQueue,
  retryEpochWebhookDelivery,
  testEpochWebhookEndpoint,
} from "../../lib/epoch/epochWebhooks";
import { listAuditLogs } from "../../lib/security/auditLog";
import {
  getConnectorFreshnessCountsForUser,
  listConnectorFreshnessSnapshotsForUser,
} from "../../lib/integrations/connectorFreshnessSummary";
import { readOrgIdFromRequest } from "../../lib/auth/orgScope";
import { listConnectorSyncLogs } from "../../lib/integrations/syncLogStore";
import {
  completeEpochVerifierAssignment,
  createEpochVerifierAssignment,
  getEpochVerifierAssignment,
  listEpochVerifierAssignments,
} from "../../lib/epoch/verifierAssignments";
import {
  getEpochWorker,
  heartbeatEpochWorker,
  completeEpochWorkerLease,
  leaseEpochJobsForWorker,
  listEpochWorkers,
  registerEpochWorker,
  updateEpochWorker,
} from "../../lib/epoch/epochWorkers";
import { listEpochWorkerEvaluations, recordEpochWorkerEvaluation } from "../../lib/epoch/workerEvaluations";
import { listEpochWorkerAdapters } from "../../lib/epoch/workerAdapters";
import { createEpochRecoveryEscalation, listEpochRecoveryEscalations, resolveEpochRecoveryEscalation } from "../../lib/epoch/recoveryEscalations";
import { decideEpochToolCall } from "../../lib/epoch/recoveryActions";
import { getEpochMissionSettlement, settleEpochMission } from "../../lib/epoch/settlementStore";
import { getEpochAiDefaultModel, getEpochAiModel, listEpochAiModels } from "../../lib/epoch/aiRuntime";
import { buildEpochAiExecutionHealth, buildEpochAiRebalancePlan, discoverEpochAiExecutionEndpoints, mapEpochWorkersToAiExecutionEndpoints, routeEpochAiExecution, type EpochAiExecutionEndpoint, type EpochAiExecutionPolicy } from "../../lib/epoch/aiExecutionRuntime";
import { EpochAiProviderError, readEpochAiProviderConfig } from "../../lib/epoch/aiProviders";
import { executeEpochConfiguredAi } from "../../lib/epoch/configuredAiRuntime";
import { streamEpochAiToExecution } from "../../lib/epoch/streamExecution";
import { getEpochAiExecutionCache, invalidateEpochAiExecutionCache, putEpochAiExecutionCache } from "../../lib/epoch/aiExecutionCache";
import {
  createEpochRuntimeDeployment,
  createEpochRuntimeProgram,
  createEpochRuntimeProgramRun,
  createEpochRuntimeRegistryArtifact,
  getEpochRuntimeDeployment,
  getEpochRuntimeProgram,
  listEpochRuntimeDeployments,
  listEpochRuntimePrograms,
  listEpochRuntimeProgramRuns,
  listEpochRuntimeRegistryArtifacts,
  rollbackEpochRuntimeDeployment,
  updateEpochRuntimeProgramStatus,
} from "../../lib/epoch/runtimeCatalog";
import { probeEpochAiProviders } from "../../lib/epoch/aiHealth";
import { discoverEpochAiProviderModels } from "../../lib/epoch/aiDiscovery";
import { completeEpochAgentToolCall, createEpochAgentSession, getEpochAgentAdapter, governEpochAgentToolCall, listEpochAgentAdapters, checkpointEpochAgent, resumeEpochAgent, validateEpochAgentHandoff, type EpochAgentCheckpoint, type EpochAgentSession, type EpochAgentToolDecision } from "../../lib/epoch/agentRuntime";
import { advertiseEpochEdgeCapabilities, issueEpochEdgeEnrollment, normalizeEpochEdgeState, queueEpochEdgeJob, reconcileEpochEdgeQueue, revokeEpochEdge, rollbackEpochEdgeUpdate, signEpochEdgeEnrollment, validateEpochEdgeTelemetrySequence, validateEpochEdgeUpdate, verifyEpochEdgeTelemetry } from "../../lib/epoch/edgeRuntime";
import { authorizeEpochEnterpriseAction, governEpochBudget } from "../../lib/epoch/enterpriseControls";
import { authorizeEpochResidency, deriveEpochKeyDescriptor } from "../../lib/epoch/enterpriseResilience";
import { approvePersistedEpochCopilotDraft, persistEpochCopilotDraft, persistEpochMarketplaceManifest, persistEpochProductionInteraction, persistEpochRegressionDraft } from "../../lib/epoch/latePhaseStore";
import { approvePersistedEpochFixProposal, listEpochProductionIntelligence, persistEpochFixProposal } from "../../lib/epoch/productionIntelligenceStore";
import { EPOCH_API_VERSION, EPOCH_CONTRACT_VERSION, getEpochApiVersionInfo } from "../../lib/epoch/apiVersion";
import { executeEpochGitHubMission, reconcileEpochGitHubPullRequest } from "../../lib/epoch/githubMissionExecution";
import { buildEpochV13ControlPlane, ControlPlaneBoundaryError } from "../../lib/epoch/v13/controlPlaneService";
import { assertEpochV13Environment, createEpochV13Environment, EnvironmentBoundaryError, listEpochV13Environments, updateEpochV13Environment } from "../../lib/epoch/v13/environmentService";
import { GovernanceBoundaryError, getEpochV13Governance, listEpochV13Policies } from "../../lib/epoch/v13/governanceService";
import { createEpochV13Project, ProjectBoundaryError, listEpochV13Projects, updateEpochV13Project } from "../../lib/epoch/v13/projectService";
import { discoverEpochHttpWorldState, discoverEpochSoftwareWorldState, getLatestEpochSoftwareWorldState, WorldStateBoundaryError } from "../../lib/epoch/v13/softwareWorldStateService";
import { discoverEpochPostgresWorldState } from "../../lib/epoch/v13/postgresWorldStateService";
import { discoverEpochDockerWorldState } from "../../lib/epoch/v13/dockerWorldStateService";
import { discoverEpochKubernetesWorldState } from "../../lib/epoch/v13/kubernetesWorldStateService";
import { discoverEpochTelemetryWorldState } from "../../lib/epoch/v13/telemetryWorldStateService";
import { discoverEpochCloudWorldState } from "../../lib/epoch/v13/cloudWorldStateService";
import { discoverEpochDataCenterWorldState, listEpochDataCenterObservations } from "../../lib/epoch/v13/dataCenterWorldStateService";
import { claimEpochOutboxEvent, enqueueEpochOutboxEvent, listEpochOutboxEvents } from "../../lib/epoch/v13/outboxService";
import { CloudActionBoundaryError, executeEpochCloudAction } from "../../lib/epoch/v13/cloudActionService";
import {
  createEpochSimulation,
  listEpochSimulations,
  runEpochSimulation,
  getEpochSimulationRun,
  verifyEpochSimulation,
  decideEpochSimulation,
  SimulationBoundaryError,
} from "../../lib/epoch/v13/simulationService";
import { AutomationBoundaryError, createEpochAutomation, getEpochAutomation, listEpochAutomations, triggerEpochAutomation } from "../../lib/epoch/v13/automationService";
import { CapabilityFabricError, composeEpochCapability, createEpochCapabilityPlan, discoverEpochCapabilities, listEpochCapabilityGaps, runEpochCapabilityPlan } from "../../lib/epoch/v13/capabilityFabricService";

export const epochRouter = Router();

epochRouter.use((_req, res, next) => {
  res.setHeader("X-Epoch-API-Version", EPOCH_API_VERSION);
  res.setHeader("X-Epoch-Contract-Version", EPOCH_CONTRACT_VERSION);
  next();
});

epochRouter.get("/version", (_req, res) => {
  res.json({ ok: true, data: getEpochApiVersionInfo() });
});

epochRouter.get("/openapi", asyncHandler(async (_req, res) => {
  const contractPath = path.resolve(process.cwd(), "docs/generated/epoch-v12-contract.json");
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  res.json({ ok: true, data: contract });
}));

async function resolveWorkspace(req: Request, workspaceId: string): Promise<boolean> {
  const exactWorkspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: req.authUserId,
      ...(req.authOrgId ? { orgId: req.authOrgId } : {}),
    },
    select: { id: true },
  });
  if (exactWorkspace) {
    return true;
  }

  // V12 workspaces may predate the legacy Workspace row. Authorize them from
  // a durable Epoch tenant record without widening user or organization scope.
  const epochTenant = await prisma.epochInstitution.findFirst({
    where: {
      workspaceId,
      userId: req.authUserId,
      ...(req.authOrgId ? { orgId: req.authOrgId } : {}),
    },
    select: { workspaceId: true },
  });
  if (epochTenant) return true;

  if (req.authOrgId) {
    const fallbackWorkspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: req.authUserId,
        orgId: null,
      },
      select: { id: true },
    });
    if (fallbackWorkspace) return true;

    const fallbackEpochTenant = await prisma.epochInstitution.findFirst({
      where: { workspaceId, userId: req.authUserId, orgId: null },
      select: { workspaceId: true },
    });
    return Boolean(fallbackEpochTenant);
  }

  return false;
}

function sendWorkspaceNotFound(res: Response, meta: ReturnType<typeof buildApiMeta>): Response {
  return sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, meta);
}

async function listWorkspaceAiExecutionEndpoints(workspaceId: string): Promise<EpochAiExecutionEndpoint[]> {
  const workers = await listEpochWorkers(workspaceId);
  const workerEndpoints = mapEpochWorkersToAiExecutionEndpoints(workers);
  const endpoints = discoverEpochAiExecutionEndpoints(listEpochAiModels(), workerEndpoints);
  return endpoints.map((endpoint) => {
    if (endpoint.kind !== "provider" || !endpoint.id.includes(":")) return endpoint;
    try {
      readEpochAiProviderConfig(endpoint.provider as "openai" | "openrouter" | "local" | "private");
      return endpoint;
    } catch {
      return { ...endpoint, available: false };
    }
  });
}

async function ensureEpochModelProvider(workspaceId: string, provider: string, model: string): Promise<string | null> {
  const existing = await prisma.modelProvider.findFirst({
    where: { workspaceId, provider },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.modelProvider.create({
    data: {
      workspaceId,
      provider,
      displayName: provider,
      status: "connected",
      defaultModel: model,
      allowedAgents: [],
      allowedRuntimes: ["api", "mcp", "sdk", "cli"],
    },
    select: { id: true },
  });
  return created.id;
}

const EPOCH_SERVICE_IDS = z.enum([
  "institution-service",
  "mission-service",
  "authority-service",
  "execution-service",
  "verification-service",
  "evidence-service",
  "certificate-service",
  "memory-service",
  "integration-service",
  "developer-service",
]);

function missionTimelineEvent(stage: string, status: string, note: string, details?: Record<string, unknown>) {
  return {
    id: `evt_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    stage,
    status,
    note,
    timestamp: new Date().toISOString(),
    ...(details ?? {}),
  };
}

function serializeApiKeyForClient(key: {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expires: string;
  mode: string;
  status: string;
  endpoints: string[];
  contentTag: string;
  creditLimit: number | null;
  resetLimitEvery: string | null;
}) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.keyPrefix,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expires,
    mode: key.mode,
    status: key.status,
    endpoints: key.endpoints,
    contentTag: key.contentTag,
    creditLimit: key.creditLimit,
    resetLimitEvery: key.resetLimitEvery,
  };
}

type CursorPage = {
  limit?: number;
  cursor?: string;
};

function encodeEpochCursor(value: { sortAt: string; id: string }): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeEpochCursor(cursor: string | undefined): { sortAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { sortAt?: unknown }).sortAt === "string" &&
      typeof (parsed as { id?: unknown }).id === "string"
    ) {
      return { sortAt: (parsed as { sortAt: string }).sortAt, id: (parsed as { id: string }).id };
    }
  } catch {
    return null;
  }
  return null;
}

function paginateEpochRecords<T extends { id: string }>(
  rows: T[],
  input: CursorPage,
  getSortAt: (row: T) => string,
): { items: T[]; nextCursor: string | null; hasMore: boolean; total: number } {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 25)));
  const sorted = [...rows].sort((a, b) => {
    const bySort = getSortAt(b).localeCompare(getSortAt(a));
    if (bySort !== 0) return bySort;
    return b.id.localeCompare(a.id);
  });
  const cursor = decodeEpochCursor(input.cursor);
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = sorted.findIndex((row) => getSortAt(row) === cursor.sortAt && row.id === cursor.id);
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }
  const items = sorted.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < sorted.length;
  const nextCursor = hasMore && items.length > 0
    ? encodeEpochCursor({ sortAt: getSortAt(items[items.length - 1]), id: items[items.length - 1].id })
    : null;
  return { items, nextCursor, hasMore, total: sorted.length };
}

epochRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const startedAt = Date.now();
    const [institutions, templates, missions, evidence, verifications, certificates, memories, integrations] =
      await Promise.all([
        prisma.epochInstitution.count(),
        prisma.epochInstitutionTemplate.count(),
        prisma.epochMission.count(),
        prisma.epochEvidence.count(),
        prisma.epochVerificationRun.count(),
        prisma.epochCertificate.count(),
        prisma.epochMemoryRecord.count(),
        prisma.epochIntegrationConnection.count(),
      ]);

    const connectors = await prisma.connector.count();
    const mcpConnections = await prisma.mCPConnection.count();
    const webhookEndpoints = await prisma.webhookEndpoint.count();
    const webhookDeliveries = await prisma.webhookDelivery.count();
    const apiKeys = await prisma.agentAccessKey.count();

    sendApiSuccess(
      res,
      200,
      {
        services: {
          institution: institutions,
          template: templates,
          mission: missions,
          evidence,
          verification: verifications,
          certificate: certificates,
          memory: memories,
          integration: integrations,
        },
        developer: {
          connectors,
          mcpConnections,
          webhookEndpoints,
          webhookDeliveries,
          apiKeys,
        },
      },
      buildApiMeta(_req, startedAt, { intent: "epoch_status" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/services",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const catalog = await buildEpochServiceCatalog(params.data.workspaceId);
    sendApiSuccess(res, 200, { catalog }, buildApiMeta(req, startedAt, { intent: "epoch_service_catalog" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/service-summaries",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const [
      institutionService,
      missionService,
      authorityService,
      executionService,
      verificationService,
      evidenceService,
      certificateService,
      memoryService,
      integrationService,
      developerService,
    ] = await Promise.all([
      summarizeInstitutionService(params.data.workspaceId),
      summarizeMissionService(params.data.workspaceId),
      summarizeAuthorityService(params.data.workspaceId),
      summarizeExecutionService(params.data.workspaceId),
      summarizeVerificationService(params.data.workspaceId),
      summarizeEvidenceService(params.data.workspaceId),
      summarizeCertificateService(params.data.workspaceId),
      summarizeMemoryService(params.data.workspaceId),
      summarizeIntegrationService(params.data.workspaceId),
      summarizeDeveloperService(params.data.workspaceId),
    ]);

    sendApiSuccess(
      res,
      200,
      {
        workspaceId: params.data.workspaceId,
        services: {
          institution: institutionService,
          mission: missionService,
          authority: authorityService,
          execution: executionService,
          verification: verificationService,
          evidence: evidenceService,
          certificate: certificateService,
          memory: memoryService,
          integration: integrationService,
          developer: developerService,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_service_summaries" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/services/:serviceId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      serviceId: EPOCH_SERVICE_IDS,
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and serviceId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const catalog = await buildEpochServiceCatalog(params.data.workspaceId);
    const service = getEpochServiceCatalogEntry(catalog, params.data.serviceId);
    if (!service) {
      sendApiError(res, 404, { code: "SERVICE_NOT_FOUND", message: "Epoch service not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { service, catalogVersion: catalog.version }, buildApiMeta(req, startedAt, { intent: "epoch_service_detail" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/services/:serviceId/summary",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      serviceId: EPOCH_SERVICE_IDS,
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and serviceId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const summary = await ({
      "institution-service": () => summarizeInstitutionService(params.data.workspaceId),
      "mission-service": () => summarizeMissionService(params.data.workspaceId),
      "authority-service": () => summarizeAuthorityService(params.data.workspaceId),
      "execution-service": () => summarizeExecutionService(params.data.workspaceId),
      "verification-service": () => summarizeVerificationService(params.data.workspaceId),
      "evidence-service": () => summarizeEvidenceService(params.data.workspaceId),
      "certificate-service": () => summarizeCertificateService(params.data.workspaceId),
      "memory-service": () => summarizeMemoryService(params.data.workspaceId),
      "integration-service": () => summarizeIntegrationService(params.data.workspaceId),
      "developer-service": () => summarizeDeveloperService(params.data.workspaceId),
    }[params.data.serviceId]());

    sendApiSuccess(
      res,
      200,
      {
        serviceId: params.data.serviceId,
        summary,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_service_summary_detail" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/summary",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }

    const allowed = await resolveWorkspace(req, params.data.workspaceId);
    if (!allowed) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const [status, templates, institutions, missions] = await Promise.all([
      prisma.epochInstitution.count({ where: { workspaceId: params.data.workspaceId } }),
      prisma.epochInstitutionTemplate.count({ where: { workspaceId: params.data.workspaceId } }),
      prisma.epochInstitution.findMany({
        where: { workspaceId: params.data.workspaceId },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.epochMission.findMany({
        where: { workspaceId: params.data.workspaceId },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);
    sendApiSuccess(
      res,
      200,
      {
        workspaceId: params.data.workspaceId,
        status: {
          institutions: status,
          templates,
          recentInstitutions: institutions,
          recentMissions: missions,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_workspace_summary" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/control-plane",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    try {
      const controlPlane = await buildEpochV13ControlPlane({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        correlationId: req.requestId ?? randomUUID(),
        traceId: req.requestId ?? randomUUID(),
      });
      sendApiSuccess(res, 200, controlPlane, buildApiMeta(req, startedAt, { intent: "epoch_v13_control_plane" }));
    } catch (error) {
      if (error instanceof ControlPlaneBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/mission-control/snapshot",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const query = EpochMissionControlSnapshotQuerySchema.safeParse(req.query);
    const range = query.success ? query.data.range ?? null : null;
    const search = query.success ? query.data.search ?? null : null;
    const start = query.success ? query.data.start ?? null : null;
    const end = query.success ? query.data.end ?? null : null;
    const snapshot = await buildEpochMissionControlSnapshot(params.data.workspaceId, range, search, start, end);
    sendApiSuccess(res, 200, { snapshot }, buildApiMeta(req, startedAt, { intent: "epoch_mission_control_snapshot" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/mission-control/export",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochMissionControlExportSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid export payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const query = EpochMissionControlSnapshotQuerySchema.safeParse(req.query);
    const range = query.success ? query.data.range ?? null : null;
    const search = query.success ? query.data.search ?? null : null;
    const start = query.success ? query.data.start ?? null : null;
    const end = query.success ? query.data.end ?? null : null;
    const snapshot = await buildEpochMissionControlSnapshot(params.data.workspaceId, range, search, start, end);
    const artifactName = body.data.name ?? `mission-control-snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const artifact = await saveEpochArtifact({
      workspaceId: params.data.workspaceId,
      category: "export",
      name: artifactName,
      summary: `Mission-control export for ${params.data.workspaceId}`,
      payload: {
        snapshot,
      },
      proof: {
        exportedAt: snapshot.generatedAt,
        source: "mission-control",
      },
    });

    sendApiSuccess(
      res,
      201,
      { snapshot, artifact },
      buildApiMeta(req, startedAt, { intent: "epoch_mission_control_export" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/mission-control/restore",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochMissionControlRestoreSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid restore payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const restored = await restoreEpochMissionControlSnapshot({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      snapshot: body.data.snapshot,
      artifactName: body.data.artifactName,
      artifactId: body.data.artifactId,
    });
    if (!restored) {
      sendApiError(res, 404, { code: "SNAPSHOT_NOT_FOUND", message: "Mission control snapshot not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 201, restored, buildApiMeta(req, startedAt, { intent: "epoch_mission_control_restore" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/mission-control/bootstrap",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochMissionControlBootstrapSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid bootstrap payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const useCase = body.data.useCase ?? "sales_research";
    const reuseExisting = body.data.reuseExisting ?? true;
    const definitions = {
      sales_research: {
        templateName: "Sales Research Institution",
        institutionName: "Sales Research Institution",
        missionTitle: "Find 50 qualified accounts matching this ICP",
        objective: "Research 50 YC companies and produce a qualified outbound list.",
        category: "sales",
        summary: "Governed sales research institution for verified outbound qualification.",
        version: "mvp-1",
        budgetCents: 5000,
        deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        allowedTools: ["web browsing", "lead enrichment", "draft email"],
        blockedActions: ["send email without approval", "spend over $50", "private CRM fields"],
      },
      vendor_due_diligence: {
        templateName: "Vendor Due Diligence Institution",
        institutionName: "Vendor Due Diligence Institution",
        missionTitle: "Review 20 vendors for procurement readiness",
        objective: "Review 20 vendors and produce a verified due diligence shortlist.",
        category: "compliance",
        summary: "Governed vendor due diligence institution for procurement review.",
        version: "mvp-1",
        budgetCents: 10000,
        deadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        allowedTools: ["web browsing", "document review", "draft memo"],
        blockedActions: ["approve procurement without review", "access private security data"],
      },
    }[useCase];

    let template = await prisma.epochInstitutionTemplate.findFirst({
      where: {
        workspaceId: params.data.workspaceId,
        name: definitions.templateName,
        version: definitions.version,
      },
    });
    if (!template) {
      template = await createEpochTemplate({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        name: definitions.templateName,
        category: definitions.category,
        description: definitions.summary,
        version: definitions.version,
        definition: {
          useCase,
          primitiveCount: 5,
          missionFlow: ["Planner", "Executor", "Reviewer", "Human approval", "Certificate"],
          thesis: "Epoch turns agent workflows into governed institutions.",
          allowedTools: definitions.allowedTools,
          blockedActions: definitions.blockedActions,
        },
        proof: { useCase, bootstrap: true },
      });
    }

    let institution: any = await prisma.epochInstitution.findFirst({
      where: {
        workspaceId: params.data.workspaceId,
        name: definitions.institutionName,
        templateId: template.id,
      },
      include: {
        missions: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: { authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 }, executionRun: true, verificationRun: true, certificate: true, memoryRecord: true, evidence: { orderBy: { createdAt: "desc" } } },
        },
      },
    });
    if (!institution) {
      institution = await createEpochInstitution({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        name: definitions.institutionName,
        category: definitions.category,
        version: definitions.version,
        summary: definitions.summary,
        templateId: template.id,
        metadata: {
          useCase,
          bootstrap: true,
          mvp: true,
        },
        proof: { useCase, bootstrap: true },
      });
      institution = await prisma.epochInstitution.findFirst({
        where: { id: institution.id, workspaceId: params.data.workspaceId },
        include: {
          missions: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: { authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 }, executionRun: true, verificationRun: true, certificate: true, memoryRecord: true, evidence: { orderBy: { createdAt: "desc" } } },
          },
        },
      });
    }
    if (!institution) {
      sendApiError(res, 500, { code: "BOOTSTRAP_FAILED", message: "Unable to create institution" }, buildApiMeta(req, startedAt));
      return;
    }

    let mission: any = institution.missions?.[0] ?? null;
    if (!mission || !reuseExisting) {
      const createdMission = await createEpochMission({
        workspaceId: params.data.workspaceId,
        institutionId: institution.id,
        userId: req.authUserId,
        orgId: req.authOrgId,
        title: definitions.missionTitle,
        objective: definitions.objective,
        budgetCents: definitions.budgetCents,
        deadlineAt: definitions.deadlineAt,
        plan: [
          "Define the ICP and qualification rubric",
          "Collect candidate accounts with source links",
          "Score fit and record evidence",
          "Review the shortlist with human approval",
          "Save the institutional record",
        ],
        authority: {
          name: `${definitions.templateName} Authority`,
          canExecute: true,
          needsApproval: true,
          blocked: false,
          permissions: ["web.browse", "lead.enrich", "email.draft"],
          budgets: { maxCents: definitions.budgetCents },
          approvals: ["human"],
          checks: ["authority", "execution", "verification", "certificate"],
        },
        proof: {
          useCase,
          bootstrap: true,
        },
      });
      mission = await getEpochMission(params.data.workspaceId, createdMission.id);
      institution = await prisma.epochInstitution.findFirst({
        where: { id: institution.id, workspaceId: params.data.workspaceId },
        include: {
          missions: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: { authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 }, executionRun: true, verificationRun: true, certificate: true, memoryRecord: true, evidence: { orderBy: { createdAt: "desc" } } },
          },
        },
      });
    }
    if (!mission) {
      sendApiError(res, 500, { code: "MISSION_BOOTSTRAP_FAILED", message: "Unable to create mission" }, buildApiMeta(req, startedAt));
      return;
    }
    const authorityPolicy = Array.isArray(mission.authorityPolicies) ? mission.authorityPolicies[0] ?? null : null;
    const bootstrap = {
      useCase,
      template,
      institution,
      mission,
      authorityPolicy,
      recommendedUseCase: "sales_research",
      missionFlow: ["Planner", "Executor", "Reviewer", "Human approval", "Certificate"],
      allowedTools: definitions.allowedTools,
      blockedActions: definitions.blockedActions,
    };

    sendApiSuccess(
      res,
      201,
      { bootstrap },
      buildApiMeta(req, startedAt, { intent: "epoch_mission_control_bootstrap" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/templates",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochPagedQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const templates = await listEpochTemplates({ workspaceId: params.data.workspaceId, search: query.success ? query.data.search : undefined });
    const page = paginateEpochRecords(templates, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        templates: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_templates" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/templates",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochTemplateSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid template payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const template = await createEpochTemplate({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      ...body.data,
    });
    sendApiSuccess(res, 201, { template }, buildApiMeta(req, startedAt, { intent: "epoch_create_template" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/templates/:templateId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      templateId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and templateId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const template = await getEpochTemplate(params.data.workspaceId, params.data.templateId);
    if (!template) {
      sendApiError(res, 404, { code: "TEMPLATE_NOT_FOUND", message: "Template not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { template }, buildApiMeta(req, startedAt, { intent: "epoch_get_template" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/institutions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochPagedQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institutions = await listEpochInstitutions({ workspaceId: params.data.workspaceId, search: query.success ? query.data.search : undefined });
    const page = paginateEpochRecords(institutions, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        institutions: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_institutions" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/institutions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochInstitutionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid institution payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await createEpochInstitution({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      ...body.data,
    });
    sendApiSuccess(res, 201, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_create_institution" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/institutions/:institutionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "institutionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await getEpochInstitution(params.data.workspaceId, params.data.institutionId);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const memberCount = await countServiceUsersForOrg(req.authUserId, req.authOrgId ?? undefined);
    sendApiSuccess(
      res,
      200,
      {
        institution: {
          ...institution,
          memberCount,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_get_institution" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/institutions/:institutionId/versions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    const query = EpochInstitutionVersionsQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "institutionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const versions = await listEpochInstitutionVersions({
      workspaceId: params.data.workspaceId,
      institutionId: params.data.institutionId,
    });
    const page = paginateEpochRecords(versions, query.success ? query.data : {}, (row) => row.createdAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        versions: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_institution_versions" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/institutions/:institutionId/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    const query = EpochEventQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "institutionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await getEpochInstitution(params.data.workspaceId, params.data.institutionId);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const runtimeEvents = await listEpochRuntimeEvents({
      userId: req.authUserId,
      workspaceId: params.data.workspaceId,
      limit: query.success ? query.data.limit : undefined,
      subjectId: params.data.institutionId,
    });

    sendApiSuccess(
      res,
      200,
      {
        institutionId: institution.id,
        institution,
        versions: Array.isArray(institution.versions) ? institution.versions : [],
        missions: Array.isArray(institution.missions) ? institution.missions : [],
        memoryRecords: Array.isArray(institution.memoryRecords) ? institution.memoryRecords : [],
        integrations: Array.isArray(institution.integrations) ? institution.integrations : [],
        runtimeEvents,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_institution_history" }),
    );
  }),
);

epochRouter.patch(
  "/workspaces/:workspaceId/institutions/:institutionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    const body = UpdateEpochInstitutionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid institution update payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await updateEpochInstitution(params.data.workspaceId, params.data.institutionId, body.data);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_update_institution" }));
  }),
);

epochRouter.delete(
  "/workspaces/:workspaceId/institutions/:institutionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "institutionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await deleteEpochInstitution(params.data.workspaceId, params.data.institutionId);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_delete_institution" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/institutions/:institutionId/archive",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "institutionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await archiveEpochInstitution(params.data.workspaceId, params.data.institutionId);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_archive_institution" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/institutions/:institutionId/clone",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    const body = CloneEpochInstitutionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid clone payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await cloneEpochInstitution(params.data.workspaceId, params.data.institutionId, {
      userId: req.authUserId,
      orgId: req.authOrgId,
      ...body.data,
    });
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 201, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_clone_institution" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochMissionListQuerySchema.safeParse(req.query);
    const institutionId = typeof req.query.institutionId === "string" ? req.query.institutionId : undefined;
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const missions = await listEpochMissions({ workspaceId: params.data.workspaceId, institutionId });
    const reconciledMissions = await Promise.all(missions.map(async (mission) => {
      if (!mission.repository || mission.state !== "waiting_review") return mission;
      try {
        return await reconcileEpochGitHubPullRequest({ mission, userId: req.authUserId, orgId: req.authOrgId });
      } catch {
        return mission;
      }
    }));
    const page = paginateEpochRecords(reconciledMissions, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        missions: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_missions" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochMissionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid mission payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institution = await prisma.epochInstitution.findFirst({
      where: {
        id: body.data.institutionId,
        workspaceId: params.data.workspaceId,
      },
      select: { id: true },
    });
    if (!institution) {
      sendApiError(
        res,
        400,
        { code: "INSTITUTION_NOT_FOUND", message: "Select an institution that belongs to this workspace." },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const mission = await createEpochMission({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      ...body.data,
      deadlineAt: body.data.deadlineAt ? new Date(body.data.deadlineAt) : undefined,
    });
    sendApiSuccess(res, 201, { mission }, buildApiMeta(req, startedAt, { intent: "epoch_create_mission" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    let mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if (mission.repository && mission.state === "waiting_review") {
      try {
        mission = await reconcileEpochGitHubPullRequest({ mission, userId: req.authUserId, orgId: req.authOrgId });
      } catch {
        // A transient provider failure must not change the durable mission state.
      }
    }
    sendApiSuccess(res, 200, { mission }, buildApiMeta(req, startedAt, { intent: "epoch_get_mission" }));
  }),
);

epochRouter.patch(
  "/workspaces/:workspaceId/missions/:missionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = UpdateEpochMissionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid mission update payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await updateEpochMission(params.data.workspaceId, params.data.missionId, {
      ...body.data,
      startedAt: body.data.startedAt ? new Date(body.data.startedAt) : undefined,
      completedAt: body.data.completedAt ? new Date(body.data.completedAt) : undefined,
    });
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { mission }, buildApiMeta(req, startedAt, { intent: "epoch_update_mission" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/evidence",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = CreateEpochEvidenceSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid evidence payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const evidence = await appendEpochEvidence({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      executionRunId: mission.executionRun?.id,
      userId: req.authUserId,
      evidence: body.data.evidence,
    });
    sendApiSuccess(res, 201, { evidence }, buildApiMeta(req, startedAt, { intent: "epoch_add_evidence" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/verify",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = VerifyEpochMissionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid verification payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const verification = await runEpochVerification({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      executionRunId: mission.executionRun?.id,
      userId: req.authUserId,
      orgId: req.authOrgId,
      evidence:
        body.data.evidenceIds?.map((id) => ({ id })) ??
        (Array.isArray(mission.evidence) ? mission.evidence.map((item: { id: string }) => ({ id: item.id })) : undefined),
      checklist: body.data.checklist,
      humanApproval: body.data.humanApproval,
      confidence: body.data.confidence,
      output: body.data.output,
      approvals: body.data.approvals,
    });
    if (!verification) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 201, { verification }, buildApiMeta(req, startedAt, { intent: "epoch_verify_mission" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/verifier-assignments",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = CreateEpochVerifierAssignmentSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid verifier assignment payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const assignment = await createEpochVerifierAssignment({ workspaceId: params.data.workspaceId, missionId: params.data.missionId, ...body.data });
      if (!assignment) {
        sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 201, { assignment }, buildApiMeta(req, startedAt, { intent: "epoch_create_verifier_assignment" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "verifier_assignment_rejected";
      sendApiError(res, 409, { code: "VERIFIER_ASSIGNMENT_REJECTED", message }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/verifier-assignments",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const assignments = await listEpochVerifierAssignments(params.data.workspaceId, params.data.missionId);
    sendApiSuccess(res, 200, { assignments }, buildApiMeta(req, startedAt, { intent: "epoch_list_verifier_assignments" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/verifier-assignments/:assignmentId/complete",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), assignmentId: z.string().min(1) }).safeParse(req.params);
    const body = CompleteEpochVerifierAssignmentSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid verifier completion payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const assignment = await completeEpochVerifierAssignment({ workspaceId: params.data.workspaceId, assignmentId: params.data.assignmentId, userId: req.authUserId, orgId: req.authOrgId, confidence: body.data.confidence });
      if (!assignment) {
        sendApiError(res, 404, { code: "VERIFIER_ASSIGNMENT_NOT_FOUND", message: "Verifier assignment not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { assignment }, buildApiMeta(req, startedAt, { intent: "epoch_complete_verifier_assignment" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "verifier_completion_rejected";
      sendApiError(res, 409, { code: "VERIFIER_COMPLETION_REJECTED", message }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/verifier-assignments/:assignmentId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), assignmentId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "assignmentId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const assignment = await getEpochVerifierAssignment(params.data.workspaceId, params.data.assignmentId);
    if (!assignment) {
      sendApiError(res, 404, { code: "VERIFIER_ASSIGNMENT_NOT_FOUND", message: "Verifier assignment not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { assignment }, buildApiMeta(req, startedAt, { intent: "epoch_get_verifier_assignment" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/evidence-bundle",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const bundle = buildEpochEvidenceBundle({
      mission: { id: mission.id, title: mission.title, objective: mission.objective, state: mission.state },
      evidence: Array.isArray(mission.evidence) ? mission.evidence : [],
      verification: mission.verificationRun ?? null,
    });
    sendApiSuccess(res, 200, { bundle }, buildApiMeta(req, startedAt, { intent: "epoch_evidence_bundle" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/authority",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const gate = await getEpochAuthorityGate(params.data.workspaceId, params.data.missionId);
    if (!gate) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { gate }, buildApiMeta(req, startedAt, { intent: "epoch_authority_gate" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/authority",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochAuthorityPolicySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid authority payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const policy = await prisma.epochAuthorityPolicy.create({
      data: {
        workspaceId: params.data.workspaceId,
        institutionId: mission.institutionId,
        missionId: mission.id,
        userId: req.authUserId,
        orgId: req.authOrgId,
        name: body.data.name ?? "Mission Authority Policy",
        canExecute: body.data.canExecute ?? false,
        needsApproval: body.data.needsApproval ?? true,
        blocked: body.data.blocked ?? false,
        permissions: body.data.permissions ?? [],
        budgets: body.data.budgets ?? {},
        approvals: body.data.approvals ?? [],
        checks: body.data.checks ?? [],
        proof: body.data.proof ?? {},
        status: "active",
      } as any,
    });

    sendApiSuccess(res, 201, { policy }, buildApiMeta(req, startedAt, { intent: "epoch_create_authority_policy" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/authority/policies",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const query = EpochAuthorityPolicyListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const policies = await listEpochAuthorityPolicies({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      institutionId: query.success ? query.data.institutionId : undefined,
    });
    const page = paginateEpochRecords(policies, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        policies: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_authority_policies" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/authority/policies/:policyId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      missionId: z.string().min(1),
      policyId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId, missionId, and policyId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const policy = await getEpochAuthorityPolicy(params.data.workspaceId, params.data.policyId);
    if (!policy || policy.missionId !== mission.id) {
      sendApiError(res, 404, { code: "POLICY_NOT_FOUND", message: "Policy not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { policy }, buildApiMeta(req, startedAt, { intent: "epoch_get_authority_policy" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/approval",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochMissionApprovalActionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid mission approval payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    if (body.data.decision === "approved") {
      if (mission.repository) {
        const existingResult = mission.result && typeof mission.result === "object"
          ? mission.result as Record<string, unknown>
          : {};
        // Approval is idempotent after the guarded adapter has already opened
        // its PR. Never clone or overwrite an existing remote branch.
        if (
          mission.currentStep === "pull_request_review" &&
          typeof existingResult.pullRequestUrl === "string" &&
          typeof existingResult.branch === "string"
        ) {
          sendApiSuccess(
            res,
            200,
            { result: existingResult },
            buildApiMeta(req, startedAt, { intent: "epoch_github_mission_already_in_review" }),
          );
          return;
        }
        try {
          const result = await executeEpochGitHubMission({
            workspaceId: params.data.workspaceId,
            missionId: mission.id,
            userId: req.authUserId,
            orgId: req.authOrgId,
          });
          sendApiSuccess(res, 201, { result }, buildApiMeta(req, startedAt, { intent: "epoch_github_mission_executed" }));
        } catch (error) {
          sendApiError(
            res,
            409,
            {
              code: "GITHUB_EXECUTION_FAILED",
              message: error instanceof Error ? error.message : "Guarded GitHub mission execution failed.",
            },
            buildApiMeta(req, startedAt, { intent: "epoch_github_mission_execution_failed" }),
          );
        }
        return;
      }
      const evidence =
        body.data.evidenceIds && body.data.evidenceIds.length > 0
          ? (Array.isArray(mission.evidence)
              ? (mission.evidence as any[])
                  .filter((item: { id: string }) => body.data.evidenceIds?.includes(item.id))
                  .map((item: any) => ({
                    kind: item.kind,
                    url: item.url ?? undefined,
                    filePath: item.filePath ?? undefined,
                    contentType: item.contentType ?? undefined,
                    summary: item.summary,
                    payload: item.payload,
                    proof: item.proof,
                  }))
              : undefined)
          : undefined;
      const result = await runEpochMission({
        workspaceId: params.data.workspaceId,
        missionId: params.data.missionId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        checklist: body.data.checklist,
        evidence,
        humanApproval: "approved",
        confidence: body.data.confidence,
        output: body.data.output,
        approvals: body.data.approvals,
        notes: body.data.notes,
      });
      if (!result) {
        sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
        return;
      }
      if ("blocked" in result || "approvalRequired" in result) {
        sendApiError(
          res,
          409,
          {
            code: "MISSION_GATED",
            message: result.reason === "blocked_by_policy" ? "Mission blocked by policy" : "Mission needs approval before execution",
            details: result,
          },
          buildApiMeta(req, startedAt, { intent: "epoch_approve_mission" }),
        );
        return;
      }
      sendApiSuccess(res, 201, { result }, buildApiMeta(req, startedAt, { intent: "epoch_approve_mission" }));
      return;
    }

    const timeline = [
      ...(Array.isArray(mission.timeline) ? (mission.timeline as Record<string, unknown>[]) : []),
      missionTimelineEvent(
        "human",
        body.data.decision === "review" ? "reviewed" : "rejected",
        body.data.decision === "review" ? "Human requested review" : "Human rejected mission",
        {
          decision: body.data.decision,
          reason: body.data.reason ?? null,
          notes: body.data.notes ?? null,
        },
      ),
    ];

    const nextState = body.data.decision === "review" ? "waiting_review" : "failed";
    const missionUpdate = await updateEpochMission(params.data.workspaceId, mission.id, {
      state: nextState,
      currentStep: body.data.decision === "review" ? "human_review" : "human_rejected",
      completedAt: body.data.decision === "review" ? null : new Date(),
      timeline,
      result: {
        ...(mission.result as Record<string, unknown>),
        humanDecision: body.data.decision,
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
      },
      proof: {
        ...(mission.proof as Record<string, unknown>),
        humanDecision: body.data.decision,
        reason: body.data.reason ?? null,
      },
      allowRetry: true,
    });

    await recordEpochMemory({
      workspaceId: params.data.workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: req.authUserId,
      orgId: req.authOrgId,
      history: [
        {
          missionId: mission.id,
          title: mission.title,
          objective: mission.objective,
          decision: body.data.decision,
          reason: body.data.reason ?? null,
        },
      ],
      lessons:
        body.data.decision === "review"
          ? ["Mission paused for human review."]
          : ["Human rejection should update the mission plan before retrying."],
      mistakes: body.data.decision === "review" ? [] : [body.data.reason ?? "Human rejected the mission."],
      suggestedImprovements:
        body.data.decision === "review"
          ? ["Revise the mission and resubmit for approval."]
          : ["Update the authority policy or mission payload before retrying."],
      proof: {
        humanDecision: body.data.decision,
        reason: body.data.reason ?? null,
      },
    });

    sendApiSuccess(
      res,
      200,
      { mission: missionUpdate },
      buildApiMeta(req, startedAt, { intent: "epoch_record_mission_decision" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/cancel",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochMissionLifecycleActionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid cancel payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if (mission.state === "completed" || mission.state === "failed" || mission.state === "cancelled") {
      sendApiError(res, 409, { code: "MISSION_NOT_ACTIVE", message: "Only active missions can be cancelled" }, buildApiMeta(req, startedAt));
      return;
    }

    const timeline = [
      ...(Array.isArray(mission.timeline) ? (mission.timeline as Record<string, unknown>[]) : []),
      missionTimelineEvent("mission", "cancelled", "Mission cancelled", {
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
      }),
    ];

    if (!(mission.proof as Record<string, unknown>)?.cancelled) {
      const cancellationEvidence = await appendEpochEvidence({
        workspaceId: params.data.workspaceId,
        missionId: mission.id,
        userId: req.authUserId,
        evidence: [{
          kind: "cancellation",
          summary: "Mission execution was cancelled by a user.",
          payload: { reason: body.data.reason ?? null, notes: body.data.notes ?? null },
          proof: { userCancelled: true },
        }],
      });
      await runEpochVerification({
        workspaceId: params.data.workspaceId,
        missionId: mission.id,
        userId: req.authUserId,
        orgId: req.authOrgId,
        evidence: cancellationEvidence,
        checklist: ["Cancellation recorded", "No further privileged actions allowed"],
        humanApproval: "rejected",
        confidence: 100,
        output: { cancelled: true, reason: body.data.reason ?? null },
      });
    }

    const missionUpdate = await updateEpochMission(params.data.workspaceId, mission.id, {
      // Cancellation is a terminal mission failure. Keep the lifecycle
      // state in the retryable terminal branch so operators can explicitly
      // review and retry the mission after the cancellation is recorded.
      state: "failed",
      currentStep: "cancelled",
      completedAt: new Date(),
      timeline,
      result: {
        ...(mission.result as Record<string, unknown>),
        cancelled: true,
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
      },
      proof: {
        ...(mission.proof as Record<string, unknown>),
        cancelled: true,
        reason: body.data.reason ?? null,
      },
    });

    await recordEpochMemory({
      workspaceId: params.data.workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: req.authUserId,
      orgId: req.authOrgId,
      history: [
        {
          missionId: mission.id,
          title: mission.title,
          objective: mission.objective,
          action: "cancelled",
          reason: body.data.reason ?? null,
        },
      ],
      lessons: ["Cancelled missions should be reviewed before restart."],
      mistakes: body.data.reason ? [body.data.reason] : [],
      suggestedImprovements: ["Retry only after correcting the mission inputs or authority policy."],
      proof: {
        cancelled: true,
        reason: body.data.reason ?? null,
      },
    });

    sendApiSuccess(res, 200, { mission: missionUpdate }, buildApiMeta(req, startedAt, { intent: "epoch_cancel_mission" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/retry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochMissionLifecycleActionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid retry payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if (mission.state !== "failed") {
      sendApiError(res, 409, { code: "MISSION_NOT_RETRYABLE", message: "Mission is not in a retryable state" }, buildApiMeta(req, startedAt));
      return;
    }

    const timeline = [
      ...(Array.isArray(mission.timeline) ? (mission.timeline as Record<string, unknown>[]) : []),
      missionTimelineEvent("mission", "retried", "Mission retried", {
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
      }),
    ];

    const isRepositoryMission = Boolean(mission.repository);
    const missionUpdate = await updateEpochMission(params.data.workspaceId, mission.id, {
      state: isRepositoryMission ? "waiting_review" : "draft",
      currentStep: isRepositoryMission ? "human_review" : "planner",
      startedAt: null,
      completedAt: null,
      timeline,
      result: {
        ...(mission.result as Record<string, unknown>),
        retried: true,
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
      },
      proof: {
        ...(mission.proof as Record<string, unknown>),
        retried: true,
        cancelled: false,
        reason: body.data.reason ?? null,
      },
      allowRetry: true,
    });

    if (isRepositoryMission) {
      sendApiSuccess(
        res,
        201,
        { mission: missionUpdate, job: null },
        buildApiMeta(req, startedAt, { intent: "epoch_retry_github_mission" }),
      );
      return;
    }

    const job = await enqueueEpochJob({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      type: "plan",
      payload: {
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
      },
    });

    sendApiSuccess(
      res,
      201,
      { mission: missionUpdate, job },
      buildApiMeta(req, startedAt, { intent: "epoch_retry_mission" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/control",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const control = await getEpochMissionControl(params.data.workspaceId, params.data.missionId);
    if (!control) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { control }, buildApiMeta(req, startedAt, { intent: "epoch_mission_control" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const query = EpochEventQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const runtimeEvents = await listEpochRuntimeEvents({
      userId: req.authUserId,
      workspaceId: params.data.workspaceId,
      limit: query.success ? query.data.limit : undefined,
      subjectId: params.data.missionId,
    });

    sendApiSuccess(
      res,
      200,
      {
        missionId: mission.id,
        timeline: Array.isArray(mission.timeline) ? mission.timeline : [],
        runtimeEvents,
        evidence: Array.isArray(mission.evidence) ? mission.evidence : [],
        verification: mission.verificationRun ?? null,
        certificate: mission.certificate ?? null,
        memoryRecord: mission.memoryRecord ?? null,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_mission_history" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/executions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochExecutionRunListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const rows = await listEpochExecutionRuns({
      workspaceId: params.data.workspaceId,
      missionId: query.success ? query.data.missionId : undefined,
    });
    const page = paginateEpochRecords(rows, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        executions: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_execution_runs" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/executions/:executionRunId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochExecutionRunParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "executionRunId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const execution = await getEpochExecutionRun(params.data.workspaceId, params.data.executionRunId);
    if (!execution) {
      sendApiError(res, 404, { code: "EXECUTION_RUN_NOT_FOUND", message: "Execution run not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { execution }, buildApiMeta(req, startedAt, { intent: "epoch_get_execution_run" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/executions/:executionRunId/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochExecutionRunParamsSchema.safeParse(req.params);
    const query = EpochEventQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "executionRunId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const execution = await getEpochExecutionRun(params.data.workspaceId, params.data.executionRunId);
    if (!execution) {
      sendApiError(res, 404, { code: "EXECUTION_RUN_NOT_FOUND", message: "Execution run not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const runtimeEvents = await listEpochRuntimeEvents({
      userId: req.authUserId,
      workspaceId: params.data.workspaceId,
      limit: query.success ? query.data.limit : undefined,
      subjectId: execution.mission.id,
    });

    sendApiSuccess(
      res,
      200,
      {
        executionId: execution.id,
        missionId: execution.mission.id,
        execution,
        mission: execution.mission,
        logs: Array.isArray(execution.logs) ? execution.logs : [],
        evidence: Array.isArray(execution.evidence) ? execution.evidence : [],
        verification: execution.verification ?? null,
        certificate: execution.mission.certificate ?? null,
        memoryRecord: execution.mission.memoryRecord ?? null,
        runtimeEvents,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_execution_history" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/verifications",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochVerificationRunListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const rows = await listEpochVerificationRuns({
      workspaceId: params.data.workspaceId,
      missionId: query.success ? query.data.missionId : undefined,
    });
    const page = paginateEpochRecords(rows, query.success ? query.data : {}, (row) => row.createdAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        verifications: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_verification_runs" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/verifications/:verificationRunId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochVerificationRunParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "verificationRunId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const verification = await getEpochVerificationRun(params.data.workspaceId, params.data.verificationRunId);
    if (!verification) {
      sendApiError(res, 404, { code: "VERIFICATION_RUN_NOT_FOUND", message: "Verification run not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { verification }, buildApiMeta(req, startedAt, { intent: "epoch_get_verification_run" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/verifications/:verificationRunId/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochVerificationRunParamsSchema.safeParse(req.params);
    const query = EpochEventQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "verificationRunId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const verification = await getEpochVerificationRun(params.data.workspaceId, params.data.verificationRunId);
    if (!verification) {
      sendApiError(res, 404, { code: "VERIFICATION_RUN_NOT_FOUND", message: "Verification run not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const runtimeEvents = await listEpochRuntimeEvents({
      userId: req.authUserId,
      workspaceId: params.data.workspaceId,
      limit: query.success ? query.data.limit : undefined,
      subjectId: verification.mission.id,
    });

    sendApiSuccess(
      res,
      200,
      {
        verificationId: verification.id,
        missionId: verification.mission.id,
        verification,
        mission: verification.mission,
        checklist: Array.isArray(verification.checklist) ? verification.checklist : [],
        evidenceValidation: verification.evidenceValidation ?? null,
        policyValidation: verification.policyValidation ?? null,
        certificate: verification.certificate ?? null,
        runtimeEvents,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_verification_history" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/certificate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = IssueEpochCertificateSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid certificate payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const certificate = await issueEpochCertificate({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      verificationRunId: mission.verificationRun?.id,
      userId: req.authUserId,
      orgId: req.authOrgId,
      summary: body.data.summary,
      approvals: body.data.approvals,
      evidenceSummary: body.data.evidenceSummary,
      auditTrail: body.data.auditTrail,
      proof: body.data.proof,
    });
    if (!certificate) {
      sendApiError(res, 404, { code: "VERIFICATION_NOT_FOUND", message: "Verification run not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 201, { certificate }, buildApiMeta(req, startedAt, { intent: "epoch_issue_certificate" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/certificates/:certificateId/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochCertificateParamsSchema.safeParse(req.params);
    const query = EpochEventQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "certificateId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const certificate = await getEpochCertificate(params.data.workspaceId, params.data.certificateId);
    if (!certificate) {
      sendApiError(res, 404, { code: "CERTIFICATE_NOT_FOUND", message: "Certificate not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const runtimeEvents = await listEpochRuntimeEvents({
      userId: req.authUserId,
      workspaceId: params.data.workspaceId,
      limit: query.success ? query.data.limit : undefined,
      subjectId: certificate.mission.id,
    });

    sendApiSuccess(
      res,
      200,
      {
        certificateId: certificate.id,
        missionId: certificate.mission.id,
        certificate,
        mission: certificate.mission,
        verification: certificate.verification ?? null,
        auditTrail: Array.isArray(certificate.auditTrail) ? certificate.auditTrail : [],
        runtimeEvents,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_certificate_history" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/queue/execute",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = RunEpochMissionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid execute payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const queuedMission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!queuedMission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if (queuedMission.repository) {
      sendApiError(
        res,
        409,
        {
          code: queuedMission.state === "waiting_review" ? "MISSION_APPROVAL_REQUIRED" : "GITHUB_EXECUTION_APPROVAL_FLOW",
          message: queuedMission.state === "waiting_review"
            ? "Approve this repository mission first. Approval starts the guarded GitHub execution; Run and Queue are not separate execution paths."
            : "Repository missions execute through the guarded GitHub approval flow. Use Approve from Mission Control.",
        },
        buildApiMeta(req, startedAt, { intent: "epoch_queue_execute" }),
      );
      return;
    }

    const job = await enqueueEpochJob({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      missionId: params.data.missionId,
      type: "execute",
      payload: body.data,
    });
    sendApiSuccess(res, 201, { job }, buildApiMeta(req, startedAt, { intent: "epoch_queue_execute" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/run",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = RunEpochMissionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid run payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const runnableMission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!runnableMission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if (runnableMission.repository) {
      sendApiError(
        res,
        409,
        {
          code: runnableMission.state === "waiting_review" ? "MISSION_APPROVAL_REQUIRED" : "GITHUB_EXECUTION_APPROVAL_FLOW",
          message: runnableMission.state === "waiting_review"
            ? "Approve this repository mission first. Approval starts the guarded GitHub execution; Run is not a separate execution path."
            : "Repository missions execute through the guarded GitHub approval flow. Use Approve from Mission Control.",
        },
        buildApiMeta(req, startedAt, { intent: "epoch_run_mission" }),
      );
      return;
    }

    const result = await runEpochMission({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      evidence: body.data.evidence,
      checklist: body.data.checklist,
      humanApproval: body.data.humanApproval,
      confidence: body.data.confidence,
      output: body.data.output,
      approvals: body.data.approvals,
      notes: body.data.notes,
    });
    if (!result) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if ("blocked" in result || "approvalRequired" in result) {
      sendApiError(
        res,
        409,
        {
          code: "MISSION_GATED",
          message: result.reason === "blocked_by_policy" ? "Mission blocked by policy" : "Mission needs approval before execution",
          details: result,
        },
        buildApiMeta(req, startedAt, { intent: "epoch_run_mission" }),
      );
      return;
    }
    sendApiSuccess(res, 201, result, buildApiMeta(req, startedAt, { intent: "epoch_run_mission" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/environments",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const environments = await listEpochV13Environments({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        correlationId: req.requestId ?? randomUUID(),
        traceId: req.requestId ?? randomUUID(),
      });
      sendApiSuccess(res, 200, { environments }, buildApiMeta(req, startedAt, { intent: "epoch_v13_list_environments" }));
    } catch (error) {
      if (error instanceof EnvironmentBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/projects",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const projects = await listEpochV13Projects({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        correlationId: req.requestId ?? randomUUID(),
        traceId: req.requestId ?? randomUUID(),
      });
      sendApiSuccess(res, 200, { projects }, buildApiMeta(req, startedAt, { intent: "epoch_v13_list_projects" }));
    } catch (error) {
      if (error instanceof ProjectBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochProjectSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid project payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const project = await createEpochV13Project(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { project }, buildApiMeta(req, startedAt, { intent: "epoch_v13_create_project" }));
    } catch (error) {
      if (error instanceof ProjectBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.patch(
  "/workspaces/:workspaceId/projects/:projectId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = UpdateEpochProjectSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid project update" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const project = await updateEpochV13Project(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        params.data.projectId,
        body.data,
      );
      if (!project) {
        sendApiError(res, 404, { code: "PROJECT_NOT_FOUND", message: "Project not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { project }, buildApiMeta(req, startedAt, { intent: "epoch_v13_update_project" }));
    } catch (error) {
      if (error instanceof ProjectBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/projects/:projectId/world-state",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const environmentId = typeof req.query.environmentId === "string" ? req.query.environmentId : "";
    if (!params.success || !environmentId) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "environmentId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await getLatestEpochSoftwareWorldState(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        params.data.projectId,
        environmentId,
      );
      sendApiSuccess(res, 200, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_get_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochSoftwareWorldStateSchema.safeParse({ ...req.body, projectId: params.success ? params.data.projectId : undefined });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid software World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochSoftwareWorldState(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_software_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/http-discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochHttpWorldStateSchema.safeParse({ ...req.body, projectId: params.success ? params.data.projectId : undefined });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid HTTP World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochHttpWorldState(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_http_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/postgres-discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochPostgresWorldStateSchema.safeParse({
      ...req.body,
      projectId: params.success ? params.data.projectId : undefined,
    });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid PostgreSQL World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochPostgresWorldState(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_postgres_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/docker-discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochDockerWorldStateSchema.safeParse({
      ...req.body,
      projectId: params.success ? params.data.projectId : undefined,
    });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Docker World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochDockerWorldState(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_docker_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/kubernetes-discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochKubernetesWorldStateSchema.safeParse({ ...req.body, projectId: params.success ? params.data.projectId : undefined });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Kubernetes World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochKubernetesWorldState({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, body.data);
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_kubernetes_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/telemetry-discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochTelemetryWorldStateSchema.safeParse({
      ...req.body,
      projectId: params.success ? params.data.projectId : undefined,
    });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid telemetry World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochTelemetryWorldState(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_telemetry_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/cloud-discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochCloudWorldStateSchema.safeParse({ ...req.body, projectId: params.success ? params.data.projectId : undefined });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid cloud World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochCloudWorldState({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, body.data);
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_cloud_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/world-state/data-center-discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = DiscoverEpochDataCenterWorldStateSchema.safeParse({ ...req.body, projectId: params.success ? params.data.projectId : undefined });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid data-center World State discovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await discoverEpochDataCenterWorldState({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, body.data);
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_discover_data_center_world_state" }));
    } catch (error) {
      if (error instanceof WorldStateBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/data-center/observations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1) }).safeParse(req.params);
    const query = z.object({ limit: z.coerce.number().int().positive().max(200).default(100) }).safeParse(req.query);
    if (!params.success || !query.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const observations = await listEpochDataCenterObservations({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, query.data.limit);
    sendApiSuccess(res, 200, { observations }, buildApiMeta(req, startedAt, { intent: "epoch_v13_list_data_center_observations" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/outbox",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1) }).safeParse(req.params);
    const body = z.object({ aggregateType: z.string().min(1).max(120), aggregateId: z.string().min(1).max(200), eventType: z.string().min(1).max(200), idempotencyKey: z.string().min(8).max(200), payload: z.record(z.string(), z.unknown()).default({}) }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid outbox event payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const result = await enqueueEpochOutboxEvent({ workspaceId: params.data.workspaceId, ...body.data });
    sendApiSuccess(res, result.created ? 201 : 200, result, buildApiMeta(req, startedAt, { intent: "epoch_v13_enqueue_outbox_event" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/outbox",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1) }).safeParse(req.params);
    const query = z.object({ limit: z.coerce.number().int().positive().max(200).default(100) }).safeParse(req.query);
    if (!params.success || !query.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const events = await listEpochOutboxEvents(params.data.workspaceId, query.data.limit);
    sendApiSuccess(res, 200, { events }, buildApiMeta(req, startedAt, { intent: "epoch_v13_list_outbox_events" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/outbox/:eventId/claim",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), eventId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const event = await claimEpochOutboxEvent(params.data.workspaceId, params.data.eventId);
    if (!event) {
      sendApiError(res, 404, { code: "OUTBOX_EVENT_NOT_FOUND", message: "Outbox event not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { event }, buildApiMeta(req, startedAt, { intent: "epoch_v13_claim_outbox_event" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/cloud-actions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = EpochCloudActionSchema.safeParse({
      ...req.body,
      projectId: params.success ? params.data.projectId : undefined,
    });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid cloud action payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const worldState = await executeEpochCloudAction(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { worldState }, buildApiMeta(req, startedAt, { intent: "epoch_v13_cloud_action" }));
    } catch (error) {
      if (error instanceof CloudActionBoundaryError) {
        const status = error.code === "policy_denied" ? 403 : error.code === "approval_required" || error.code === "configuration" ? 409 : 502;
        sendApiError(res, status, { code: `EPOCH_CLOUD_ACTION_${error.code.toUpperCase()}`, message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/projects/:projectId/simulations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    const body = CreateEpochSimulationSchema.safeParse({
      ...req.body,
      projectId: params.success ? params.data.projectId : undefined,
    });
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid simulation payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const simulation = await createEpochSimulation(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { simulation }, buildApiMeta(req, startedAt, { intent: "epoch_v13_create_simulation" }));
    } catch (error) {
      if (error instanceof SimulationBoundaryError) {
        sendApiError(res, error.code === "not_found" ? 404 : 409, { code: `EPOCH_SIMULATION_${error.code.toUpperCase()}`, message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/projects/:projectId/simulations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), projectId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid simulation scope" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const simulations = await listEpochSimulations(
        { workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() },
        params.data.projectId,
      );
      sendApiSuccess(res, 200, { simulations }, buildApiMeta(req, startedAt, { intent: "epoch_v13_list_simulations" }));
    } catch (error) {
      if (error instanceof SimulationBoundaryError) {
        sendApiError(res, error.code === "not_found" ? 404 : 409, { code: `EPOCH_SIMULATION_${error.code.toUpperCase()}`, message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/simulations/:simulationId/runs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), simulationId: z.string().min(1) }).safeParse(req.params);
    const body = RunEpochSimulationSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid simulation run payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const run = await runEpochSimulation(
        { workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() },
        params.data.simulationId,
        body.data,
      );
      sendApiSuccess(res, 201, { run }, buildApiMeta(req, startedAt, { intent: "epoch_v13_run_simulation" }));
    } catch (error) {
      if (error instanceof SimulationBoundaryError) {
        sendApiError(res, error.code === "not_found" ? 404 : 409, { code: `EPOCH_SIMULATION_${error.code.toUpperCase()}`, message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/simulation-runs/:runId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), runId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid simulation run scope" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const result = await getEpochSimulationRun(
      { workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() },
      params.data.runId,
    );
    if (!result) {
      sendApiError(res, 404, { code: "EPOCH_SIMULATION_NOT_FOUND", message: "Simulation run not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt, { intent: "epoch_v13_get_simulation_run" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/simulation-runs/:runId/verify",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), runId: z.string().min(1) }).safeParse(req.params);
    const body = VerifyEpochSimulationSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid simulation verification payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const verification = await verifyEpochSimulation(
        { workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() },
        params.data.runId,
        body.data.expectedStatus,
      );
      sendApiSuccess(res, 200, { verification }, buildApiMeta(req, startedAt, { intent: "epoch_v13_verify_simulation" }));
    } catch (error) {
      if (error instanceof SimulationBoundaryError) {
        sendApiError(res, error.code === "not_found" ? 404 : 409, { code: `EPOCH_SIMULATION_${error.code.toUpperCase()}`, message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/simulation-runs/:runId/decision",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), runId: z.string().min(1) }).safeParse(req.params);
    const body = PromoteEpochSimulationSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Simulation decision requires explicit approval" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const decision = await decideEpochSimulation(
        { workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() },
        params.data.runId,
        body.data.decision,
      );
      sendApiSuccess(res, 200, { decision }, buildApiMeta(req, startedAt, { intent: "epoch_v13_decide_simulation" }));
    } catch (error) {
      if (error instanceof SimulationBoundaryError) {
        sendApiError(res, error.code === "not_found" ? 404 : 409, { code: `EPOCH_SIMULATION_${error.code.toUpperCase()}`, message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/environments",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochEnvironmentSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid environment payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const environment = await createEpochV13Environment(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        body.data,
      );
      sendApiSuccess(res, 201, { environment }, buildApiMeta(req, startedAt, { intent: "epoch_v13_create_environment" }));
    } catch (error) {
      if (error instanceof EnvironmentBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.patch(
  "/workspaces/:workspaceId/environments/:environmentId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), environmentId: z.string().min(1) }).safeParse(req.params);
    const body = UpdateEpochEnvironmentSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid environment update" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const environment = await updateEpochV13Environment(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        params.data.environmentId,
        body.data,
      );
      if (!environment) {
        sendApiError(res, 404, { code: "ENVIRONMENT_NOT_FOUND", message: "Environment not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { environment }, buildApiMeta(req, startedAt, { intent: "epoch_v13_update_environment" }));
    } catch (error) {
      if (error instanceof EnvironmentBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/integrations/:integrationId/bind-environment",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), integrationId: z.string().min(1) }).safeParse(req.params);
    const body = BindEpochIntegrationEnvironmentSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid environment binding" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const integration = await getEpochIntegration(params.data.workspaceId, params.data.integrationId);
    if (!integration || integration.userId !== req.authUserId || (req.authOrgId && integration.orgId && integration.orgId !== req.authOrgId)) {
      sendApiError(res, 404, { code: "INTEGRATION_NOT_FOUND", message: "Integration not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if (body.data.environmentId) {
      try {
        const environment = await assertEpochV13Environment(
          {
            workspaceId: params.data.workspaceId,
            userId: req.authUserId,
            orgId: req.authOrgId,
            correlationId: req.requestId ?? randomUUID(),
            traceId: req.requestId ?? randomUUID(),
          },
          body.data.environmentId,
        );
        if (!environment) {
          sendApiError(res, 404, { code: "ENVIRONMENT_NOT_FOUND", message: "Environment not found" }, buildApiMeta(req, startedAt));
          return;
        }
      } catch (error) {
        if (error instanceof EnvironmentBoundaryError) {
          sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
          return;
        }
        throw error;
      }
    }
    const updated = await updateEpochIntegration(params.data.workspaceId, params.data.integrationId, {
      environmentId: body.data.environmentId,
      proof: { action: body.data.environmentId ? "bind_environment" : "unbind_environment", environmentId: body.data.environmentId },
    });
    if (!updated) {
      sendApiError(res, 404, { code: "INTEGRATION_NOT_FOUND", message: "Integration not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { integration: updated }, buildApiMeta(req, startedAt, { intent: "epoch_v13_bind_integration_environment" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/integrations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochIntegrationListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const requestOrgId = readOrgIdFromRequest(req) ?? req.authOrgId;
    const integrations = await listEpochIntegrations({ workspaceId: params.data.workspaceId });
    // OAuth connectors are the authoritative external-system connection records.
    // Merge them into the workspace gateway view so a successful connector OAuth
    // does not appear disconnected merely because no Epoch shadow row was created.
    const connectorRows = await prisma.connector.findMany({
      where: {
        userId: req.authUserId,
        ...(requestOrgId
          ? { orgId: requestOrgId }
          : { orgId: null }),
      },
      select: { id: true, name: true, type: true, status: true, lastSyncAt: true, updatedAt: true },
    });
    const mergedByProvider = new Map(integrations.map((integration) => [integration.provider.toLowerCase(), integration]));
    for (const connector of connectorRows) {
      const providerKey = connector.type.toLowerCase();
      const existing = mergedByProvider.get(providerKey);
      if (existing) {
        mergedByProvider.set(providerKey, { ...existing, status: connector.status, lastSyncAt: connector.lastSyncAt ? new Date(connector.lastSyncAt) : existing.lastSyncAt, updatedAt: connector.updatedAt });
      } else {
        mergedByProvider.set(providerKey, {
          id: `connector-${connector.id}`,
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: requestOrgId ?? null,
          institutionId: null,
          environmentId: null,
          name: connector.name,
          provider: connector.type,
          status: connector.status,
          config: null,
          proof: { source: "connector-store", connectorId: connector.id },
          lastSyncAt: connector.lastSyncAt ? new Date(connector.lastSyncAt) : null,
          createdAt: connector.updatedAt,
          updatedAt: connector.updatedAt,
        } as typeof integrations[number]);
      }
    }
    const page = paginateEpochRecords(Array.from(mergedByProvider.values()), query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        integrations: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_integrations" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/integrations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochIntegrationSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid integration payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const integration = await upsertEpochIntegration({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      ...body.data,
    });
    sendApiSuccess(res, 201, { integration }, buildApiMeta(req, startedAt, { intent: "epoch_upsert_integration" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/integrations/health",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const snapshots = await listConnectorFreshnessSnapshotsForUser(req.authUserId, req.authOrgId);
    const counts = await getConnectorFreshnessCountsForUser(req.authUserId);
    sendApiSuccess(
      res,
      200,
      {
        backendAvailable: true,
        counts,
        freshness: snapshots,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_connector_health" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/integrations/logs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const logs = await listConnectorSyncLogs(req.authUserId, req.authOrgId);
    sendApiSuccess(res, 200, { logs }, buildApiMeta(req, startedAt, { intent: "epoch_connector_logs" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/integrations/:integrationId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      integrationId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and integrationId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const integration = await getEpochIntegration(params.data.workspaceId, params.data.integrationId);
    if (!integration) {
      sendApiError(res, 404, { code: "INTEGRATION_NOT_FOUND", message: "Integration not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { integration }, buildApiMeta(req, startedAt, { intent: "epoch_get_integration" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/integrations/:integrationId/disconnect",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      integrationId: z.string().min(1),
    }).safeParse(req.params);
    const body = z.object({
      reason: z.string().max(4000).optional(),
      notes: z.string().max(4000).optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid disconnect payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const integration = await updateEpochIntegration(params.data.workspaceId, params.data.integrationId, {
      status: "disconnected",
      proof: {
        action: "disconnect",
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
        disconnectedAt: new Date().toISOString(),
      },
    });
    if (!integration) {
      sendApiError(res, 404, { code: "INTEGRATION_NOT_FOUND", message: "Integration not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { integration }, buildApiMeta(req, startedAt, { intent: "epoch_disconnect_integration" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/integrations/:integrationId/refresh",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      integrationId: z.string().min(1),
    }).safeParse(req.params);
    const body = z.object({
      reason: z.string().max(4000).optional(),
      notes: z.string().max(4000).optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid refresh payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const integration = await updateEpochIntegration(params.data.workspaceId, params.data.integrationId, {
      status: "connected",
      config: body.data.config,
      lastSyncAt: new Date(),
      proof: {
        action: "refresh",
        reason: body.data.reason ?? null,
        notes: body.data.notes ?? null,
        refreshedAt: new Date().toISOString(),
      },
    });
    if (!integration) {
      sendApiError(res, 404, { code: "INTEGRATION_NOT_FOUND", message: "Integration not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { integration }, buildApiMeta(req, startedAt, { intent: "epoch_refresh_integration" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/evidence",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochEvidenceListQuerySchema.safeParse(req.query);
    const missionId = typeof req.query.missionId === "string" ? req.query.missionId : undefined;
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const rows = await prisma.epochEvidence.findMany({
      where: {
        workspaceId: params.data.workspaceId,
        ...(missionId ? { missionId } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const page = paginateEpochRecords(rows, query.success ? query.data : {}, (row) => row.createdAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        evidence: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_evidence" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/certificates",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochCertificateListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const rows = await prisma.epochCertificate.findMany({
      where: { workspaceId: params.data.workspaceId },
      orderBy: [{ issuedAt: "desc" }, { id: "desc" }],
    });
    const page = paginateEpochRecords(rows, query.success ? query.data : {}, (row) => row.issuedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        certificates: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_certificates" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/certificates/:certificateId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochCertificateParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "certificateId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const certificate = await getEpochCertificate(params.data.workspaceId, params.data.certificateId);
    if (!certificate) {
      sendApiError(res, 404, { code: "CERTIFICATE_NOT_FOUND", message: "Certificate not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { certificate }, buildApiMeta(req, startedAt, { intent: "epoch_get_certificate" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/certificates/:certificateId/export",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochCertificateParamsSchema.safeParse(req.params);
    const body = EpochCertificateExportSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid certificate export payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const certificate = await getEpochCertificate(params.data.workspaceId, params.data.certificateId);
    if (!certificate) {
      sendApiError(res, 404, { code: "CERTIFICATE_NOT_FOUND", message: "Certificate not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, certificate.mission.id);
    const runtimeEvents = await listEpochRuntimeEvents({
      userId: req.authUserId,
      workspaceId: params.data.workspaceId,
      limit: 100,
      subjectId: certificate.mission.id,
    });
    const certificateExport = {
      workspaceId: params.data.workspaceId,
      generatedAt: new Date().toISOString(),
      certificate,
      mission,
      verification: certificate.verification ?? null,
      evidence: mission?.evidence ?? [],
      auditTrail: Array.isArray(certificate.auditTrail) ? certificate.auditTrail : [],
      runtimeEvents,
    };
    const artifactName = body.data.name ?? `certificate-${certificate.id}-export`;
    const artifact = await saveEpochArtifact({
      workspaceId: params.data.workspaceId,
      missionId: certificate.mission.id,
      category: "export",
      name: artifactName,
      summary: `Certificate export for mission ${certificate.mission.id}`,
      payload: certificateExport,
      proof: {
        certificateId: certificate.id,
        verificationRunId: certificate.verificationRunId,
        exportedAt: certificateExport.generatedAt,
      },
    });

    sendApiSuccess(
      res,
      201,
      { certificateExport, artifact },
      buildApiMeta(req, startedAt, { intent: "epoch_certificate_export" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/memory-records",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochMemoryRecordListViewQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const rows = await listEpochMemoryRecords({
      workspaceId: params.data.workspaceId,
      institutionId: query.success ? query.data.institutionId : undefined,
      missionId: query.success ? query.data.missionId : undefined,
    });
    const page = paginateEpochRecords(rows, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        memoryRecords: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_memory_records" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/memory/records",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochMemoryRecordListViewQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const rows = await listEpochMemoryRecords({
      workspaceId: params.data.workspaceId,
      institutionId: query.success ? query.data.institutionId : undefined,
      missionId: query.success ? query.data.missionId : undefined,
    });
    const page = paginateEpochRecords(rows, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        memoryRecords: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_memory_records_alias" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/memory-records/:memoryRecordId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMemoryRecordParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "memoryRecordId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const memoryRecord = await getEpochMemoryRecord(params.data.workspaceId, params.data.memoryRecordId);
    if (!memoryRecord) {
      sendApiError(res, 404, { code: "MEMORY_RECORD_NOT_FOUND", message: "Memory record not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { memoryRecord }, buildApiMeta(req, startedAt, { intent: "epoch_get_memory_record" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/memory/records/:memoryRecordId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMemoryRecordParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "memoryRecordId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const memoryRecord = await getEpochMemoryRecord(params.data.workspaceId, params.data.memoryRecordId);
    if (!memoryRecord) {
      sendApiError(res, 404, { code: "MEMORY_RECORD_NOT_FOUND", message: "Memory record not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { memoryRecord }, buildApiMeta(req, startedAt, { intent: "epoch_get_memory_record_alias" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/institutions/:institutionId/memory-records",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochInstitutionParamsSchema.safeParse(req.params);
    const query = EpochMemoryRecordListViewQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "institutionId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const rows = await listEpochMemoryRecords({
      workspaceId: params.data.workspaceId,
      institutionId: params.data.institutionId,
      missionId: query.success ? query.data.missionId : undefined,
    });
    const page = paginateEpochRecords(rows, query.success ? query.data : {}, (row) => row.updatedAt.toISOString());
    sendApiSuccess(
      res,
      200,
      {
        memoryRecords: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_institution_memory_records" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/memory/lessons",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochMemoryRecordListViewQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const lessons = await listEpochMemoryLessons({
      workspaceId: params.data.workspaceId,
      institutionId: query.success ? query.data.institutionId : undefined,
      missionId: query.success ? query.data.missionId : undefined,
    });

    sendApiSuccess(
      res,
      200,
      {
        lessons,
        count: lessons.length,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_memory_lessons" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/memory/lessons/:lessonId/apply",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const workspaceId = typeof req.params.workspaceId === "string" ? req.params.workspaceId : "";
    const lessonId = typeof req.params.lessonId === "string" ? req.params.lessonId : "";
    if (!workspaceId || !lessonId) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and lessonId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const lesson = await setEpochMemoryLessonStatus({
      workspaceId,
      lessonId,
      status: "applied",
      userId: req.authUserId,
      orgId: req.authOrgId,
      proof: { action: "apply", source: "memory/lessons" },
    });
    if (!lesson) {
      sendApiError(res, 404, { code: "LESSON_NOT_FOUND", message: "Lesson not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { lesson }, buildApiMeta(req, startedAt, { intent: "epoch_apply_memory_lesson" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/memory/lessons/:lessonId/reject",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const workspaceId = typeof req.params.workspaceId === "string" ? req.params.workspaceId : "";
    const lessonId = typeof req.params.lessonId === "string" ? req.params.lessonId : "";
    if (!workspaceId || !lessonId) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and lessonId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const lesson = await setEpochMemoryLessonStatus({
      workspaceId,
      lessonId,
      status: "rejected",
      userId: req.authUserId,
      orgId: req.authOrgId,
      proof: { action: "reject", source: "memory/lessons" },
    });
    if (!lesson) {
      sendApiError(res, 404, { code: "LESSON_NOT_FOUND", message: "Lesson not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { lesson }, buildApiMeta(req, startedAt, { intent: "epoch_reject_memory_lesson" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const [mcpConnections, webhookEndpoints, webhookDeliveries, apiKeys, runtimeApiKeys, queueStatus, deadLetters, latestSmoke] = await Promise.all([
      prisma.mCPConnection.findMany({
        where: { workspaceId: params.data.workspaceId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.webhookEndpoint.findMany({
        where: { workspaceId: params.data.workspaceId },
        orderBy: { updatedAt: "desc" },
      }),
      getEpochWebhookDeliveryStats(params.data.workspaceId),
      prisma.agentAccessKey.findMany({
        where: { workspaceId: params.data.workspaceId },
        orderBy: { updatedAt: "desc" },
      }),
      listApiKeysForUser(req.authUserId),
      getEpochQueueStatus(params.data.workspaceId),
      listEpochDeadLetters(params.data.workspaceId),
      prisma.epochMission.findFirst({
        where: { workspaceId: params.data.workspaceId, title: "Epoch Smoke Mission" },
        orderBy: { updatedAt: "desc" },
        include: {
          institution: true,
          executionRun: true,
          verificationRun: true,
          certificate: true,
          memoryRecord: true,
        },
      }),
    ]);
    const safeWebhookEndpoints = webhookEndpoints.map(({ secret, ...webhook }) => webhook);
    const safeRuntimeApiKeys = runtimeApiKeys
      .filter((key) => key.contentTag === "epoch-runtime" || key.endpoints.includes("epoch_runtime"))
      .map(serializeApiKeyForClient);

    sendApiSuccess(
      res,
      200,
      {
        workspaceId: params.data.workspaceId,
        developer: {
          mcpConnections,
          webhookEndpoints: safeWebhookEndpoints,
          webhookDeliveries,
          apiKeys,
          runtimeApiKeys: safeRuntimeApiKeys,
          operations: {
            queueStatus,
            deadLetters: {
              count: deadLetters.length,
              latest: deadLetters[0] ?? null,
            },
            smoke: latestSmoke
              ? {
                  missionId: latestSmoke.id,
                  institutionId: latestSmoke.institutionId,
                  state: latestSmoke.state,
                  currentStep: latestSmoke.currentStep,
                  verificationDecision: latestSmoke.verificationRun?.finalDecision ?? null,
                  certificateId: latestSmoke.certificate?.id ?? null,
                  memoryRecordId: latestSmoke.memoryRecord?.id ?? null,
                }
              : null,
          },
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_developer_summary" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/cli",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const packagePath = path.resolve(process.cwd(), "packages/epoch-v12-cli/package.json");
    const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as Record<string, unknown>;
    sendApiSuccess(res, 200, {
      cli: {
        name: packageJson.name ?? "@epochtm/v12-cli",
        version: packageJson.version ?? "-",
        description: packageJson.description ?? "",
        bin: packageJson.bin ?? null,
        engines: packageJson.engines ?? null,
        packageManager: "npm/pnpm/bun",
        platforms: ["macOS", "Linux", "Windows", "Docker"],
        status: "Published",
      },
    }, buildApiMeta(req, startedAt, { intent: "epoch_cli_catalog" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/sdk",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const packagePath = path.resolve(process.cwd(), "packages/epoch-v12-sdk/package.json");
    const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as Record<string, unknown>;
    sendApiSuccess(res, 200, {
      sdk: {
        name: packageJson.name ?? "@epochtm/v12-sdk",
        version: packageJson.version ?? "-",
        description: packageJson.description ?? "",
        packageManager: "npm/pnpm/bun",
        languages: ["TypeScript"],
        status: "Published",
        install: {
          npm: "npm install @epochtm/v12-sdk",
          pnpm: "pnpm add @epochtm/v12-sdk",
          bun: "bun add @epochtm/v12-sdk",
        },
      },
    }, buildApiMeta(req, startedAt, { intent: "epoch_sdk_catalog" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/events",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochEventQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const events = await listEpochRuntimeEvents({
      userId: req.authUserId,
      workspaceId: params.data.workspaceId,
      limit: query.success ? query.data.limit : undefined,
    });
    sendApiSuccess(res, 200, { events }, buildApiMeta(req, startedAt, { intent: "epoch_list_events" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/events/stream",
  asyncHandler(async (req, res) => {
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "workspaceId is required" });
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, workspaceId: params.data.workspaceId })}\n\n`);

    const unregister = registerMemoryRealtimeSink(req.authUserId, res);
    const heartbeat = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
      } catch {
        // The close handler will clean up stale sinks.
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unregister();
    });
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/workers",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const workers = await listEpochWorkers(params.data.workspaceId);
    sendApiSuccess(res, 200, { workers }, buildApiMeta(req, startedAt, { intent: "epoch_list_workers" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/workers",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochWorkerSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid worker registration payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await registerEpochWorker({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      ...body.data,
    });
    sendApiSuccess(res, 201, { worker }, buildApiMeta(req, startedAt, { intent: "epoch_register_worker" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/workers/:workerId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workerId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await getEpochWorker(params.data.workspaceId, params.data.workerId);
    if (!worker) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { worker }, buildApiMeta(req, startedAt, { intent: "epoch_get_worker" }));
  }),
);

epochRouter.patch(
  "/workspaces/:workspaceId/workers/:workerId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    const body = EpochWorkerUpdateSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid worker update payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await updateEpochWorker({ workspaceId: params.data.workspaceId, workerId: params.data.workerId, ...body.data });
    if (!worker) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found or already retired" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { worker }, buildApiMeta(req, startedAt, { intent: "epoch_update_worker" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/workers/:workerId/heartbeat",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    const body = EpochWorkerHeartbeatSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid worker heartbeat payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await heartbeatEpochWorker({ workspaceId: params.data.workspaceId, workerId: params.data.workerId, ...body.data });
    if (!worker) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found or retired" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { worker }, buildApiMeta(req, startedAt, { intent: "epoch_worker_heartbeat" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/workers/:workerId/telemetry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    const body = z.object({
      gpuUtilizationPct: z.number().min(0).max(100).optional(),
      vramUsedMb: z.number().nonnegative().optional(),
      vramTotalMb: z.number().positive().optional(),
      temperatureC: z.number().min(-50).max(150).optional(),
      throughputTokensPerSecond: z.number().nonnegative().optional(),
      queueDepth: z.number().int().nonnegative().optional(),
      loadedModels: z.array(z.string().min(1).max(200)).max(100).optional(),
      observedAt: z.string().datetime().optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid AI worker telemetry" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await getEpochWorker(params.data.workspaceId, params.data.workerId);
    if (!worker || worker.retiredAt) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const telemetry = { ...body.data, observedAt: body.data.observedAt ?? new Date().toISOString() };
    const previousMetadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    await prisma.epochWorker.update({
      where: { id: worker.id },
      data: {
        activeLeases: telemetry.queueDepth ?? worker.activeLeases,
        lastHeartbeat: new Date(),
        metadata: { ...previousMetadata, telemetry } as any,
        history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "telemetry", at: telemetry.observedAt, telemetry }],
      },
    });
    emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.ai_execution.telemetry", label: "AI worker telemetry", subjectId: worker.id, payload: { workerId: worker.id, telemetry } });
    sendApiSuccess(res, 202, { workerId: worker.id, telemetry }, buildApiMeta(req, startedAt, { intent: "epoch_ai_worker_telemetry" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/ai-execution/workers/:workerId/telemetry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid worker telemetry request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await getEpochWorker(params.data.workspaceId, params.data.workerId);
    if (!worker) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    sendApiSuccess(res, 200, { workerId: worker.id, telemetry: metadata.telemetry ?? null }, buildApiMeta(req, startedAt, { intent: "epoch_ai_worker_telemetry_read" }));
  }),
);

epochRouter.get(
  "/worker-adapters",
  asyncHandler(async (req, res) => {
    sendApiSuccess(res, 200, { adapters: listEpochWorkerAdapters() }, buildApiMeta(req, Date.now(), { intent: "epoch_list_worker_adapters" }));
  }),
);

epochRouter.get(
  "/ai/catalog",
  asyncHandler(async (req, res) => {
    sendApiSuccess(res, 200, { version: "epoch.ai.catalog.v1", models: listEpochAiModels() }, buildApiMeta(req, Date.now(), { intent: "epoch_list_ai_models" }));
  }),
);

epochRouter.get(
  "/ai-execution/catalog",
  asyncHandler(async (req, res) => {
    const endpoints = discoverEpochAiExecutionEndpoints(listEpochAiModels());
    const configured = endpoints.map((endpoint) => {
      try {
        readEpochAiProviderConfig(endpoint.provider as "openai" | "openrouter" | "local" | "private");
        return endpoint;
      } catch {
        return { ...endpoint, available: false };
      }
    });
    sendApiSuccess(res, 200, { version: "epoch.ai.execution.v1", endpoints: configured }, buildApiMeta(req, Date.now(), { intent: "epoch_ai_execution_catalog" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/discover",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ providers: z.array(z.enum(["openai", "openrouter", "local", "private", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"])).min(1).max(11).default(["openai", "openrouter", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"]), timeoutMs: z.number().int().min(250).max(10_000).default(5_000) }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid AI model discovery request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const models = await discoverEpochAiProviderModels({ providers: body.data.providers, timeoutMs: body.data.timeoutMs });
    sendApiSuccess(res, 200, { models, discoveredAt: new Date().toISOString() }, buildApiMeta(req, startedAt, { intent: "epoch_ai_model_discovery" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/route",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({
      requiredCapabilities: z.array(z.string().min(1)).max(30).optional(),
      allowedProviders: z.array(z.string().min(1)).max(30).optional(),
      allowedPrivacy: z.array(z.enum(["public", "tenant", "private"])).max(3).optional(),
      preferredRegion: z.string().min(1).max(100).optional(),
      maxCostPer1kTokens: z.number().nonnegative().optional(),
      maxLatencyMs: z.number().int().positive().optional(),
      minimumReliability: z.number().min(0).max(1).optional(),
      allowFallback: z.boolean().optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid AI execution route policy" }, buildApiMeta(req, startedAt));
      return;
    }
    const endpointAvailability = await listWorkspaceAiExecutionEndpoints(params.data.workspaceId);
    try {
      const route = routeEpochAiExecution({ endpoints: endpointAvailability, policy: body.data as EpochAiExecutionPolicy });
      emitEpochRuntimeEvent({
        userId: req.authUserId,
        orgId: req.authOrgId,
        workspaceId: params.data.workspaceId,
        kind: "epoch.ai_execution.routed",
        label: "AI execution route selected",
        subjectId: route.selected.id,
        payload: {
          selectedEndpointId: route.selected.id,
          fallbackEndpointIds: route.fallback.map((endpoint) => endpoint.id),
          considered: route.considered,
          policy: route.policy,
        },
      });
      sendApiSuccess(res, 200, { route }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_route" }));
    } catch (error) {
      if (error instanceof Error && error.message === "epoch_ai_execution_no_eligible_endpoint") {
        sendApiError(res, 409, { code: "NO_ELIGIBLE_AI_EXECUTION_ENDPOINT", message: "No AI execution environment satisfies the mission policy" }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/execute",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({
      prompt: z.string().min(1).max(100_000),
      preferredProvider: z.enum(["openai", "openrouter", "local", "private", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"]).optional(),
      allowedProviders: z.array(z.enum(["openai", "openrouter", "local", "private", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"])).max(11).optional(),
      requiredCapabilities: z.array(z.string().min(1)).max(30).optional(),
      allowFallback: z.boolean().optional(),
      maxAttempts: z.number().int().min(1).max(4).optional(),
      retryRateLimited: z.boolean().optional(),
      maxOutputTokens: z.number().int().min(1).max(16_384).default(512),
      requireJson: z.boolean().default(false),
      reasoning: z.boolean().default(false),
      timeoutMs: z.number().int().min(100).max(300_000).default(120_000),
      maxCostCents: z.number().int().nonnegative().optional(),
      cacheTtlSeconds: z.number().int().min(1).max(86_400).optional(),
      cachePrivacy: z.enum(["public", "tenant", "private"]).default("tenant"),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid AI execution request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const providers = body.data.allowedProviders ?? (body.data.preferredProvider ? [body.data.preferredProvider] : ["openai", "openrouter", "local"]);
    const estimatedInputTokens = Math.ceil(body.data.prompt.length / 4);
    const estimatedCostCents = Math.max(...providers.map((provider) => {
      const model = getEpochAiDefaultModel(provider);
      return model ? Math.ceil((estimatedInputTokens / 1000) * model.inputCostPer1k + (body.data.maxOutputTokens / 1000) * model.outputCostPer1k) : 0;
    }));
    if (body.data.maxCostCents !== undefined && estimatedCostCents > body.data.maxCostCents) {
      emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.ai_execution.failed", label: "AI execution blocked by cost policy", payload: { errorCode: "budget_would_be_exceeded", estimatedCostCents, maxCostCents: body.data.maxCostCents, attemptedProviders: providers } });
      sendApiError(res, 409, { code: "AI_EXECUTION_BUDGET_EXCEEDED", message: "Estimated execution cost exceeds the declared budget", details: { estimatedCostCents, maxCostCents: body.data.maxCostCents } }, buildApiMeta(req, startedAt));
      return;
    }
    const input = {
      model: "",
      prompt: body.data.prompt,
      maxOutputTokens: body.data.maxOutputTokens,
      requireJson: body.data.requireJson,
      reasoning: body.data.reasoning,
      signal: undefined as AbortSignal | undefined,
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), body.data.timeoutMs);
    input.signal = controller.signal;
    const cacheProvider = body.data.preferredProvider ?? providers[0];
    const cacheModel = getEpochAiDefaultModel(cacheProvider);
    const cacheInput = cacheModel ? {
      workspaceId: params.data.workspaceId,
      provider: cacheProvider,
      model: cacheModel.model,
      prompt: body.data.prompt,
      maxOutputTokens: body.data.maxOutputTokens,
      requireJson: body.data.requireJson,
      reasoning: body.data.reasoning,
    } : null;
    if (body.data.cacheTtlSeconds && cacheInput) {
      const cached = await getEpochAiExecutionCache(cacheInput);
      if (cached) {
        const providerId = await ensureEpochModelProvider(params.data.workspaceId, cached.response.evidence.provider, cached.response.evidence.model);
        await prisma.modelUsageEvent.create({ data: { workspaceId: params.data.workspaceId, providerId, model: cached.response.evidence.model, taskType: "epoch_ai_cache_hit", inputTokens: cached.response.evidence.inputTokens, outputTokens: cached.response.evidence.outputTokens, estimatedCost: 0, latencyMs: 0, success: true } });
        emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.ai_execution.completed", label: "AI execution cache hit", subjectId: cached.response.evidence.model, payload: { provider: cached.response.evidence.provider, model: cached.response.evidence.model, cacheHit: true, cacheHitCount: cached.hitCount } });
        clearTimeout(timeout);
        sendApiSuccess(res, 200, { result: { ...cached.response, attempts: [], selectedProvider: cached.response.evidence.provider, selectedModel: cached.response.evidence.model, cacheHit: true, cacheHitCount: cached.hitCount } }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_cache_hit" }));
        return;
      }
    }
    try {
      const result = await executeEpochConfiguredAi(input, {
        preferredProvider: body.data.preferredProvider,
        allowedProviders: providers,
        providers,
        requiredCapabilities: body.data.requiredCapabilities,
        allowFallback: body.data.allowFallback,
        maxAttempts: body.data.maxAttempts,
        retryRateLimited: body.data.retryRateLimited,
      });
      const providerId = await ensureEpochModelProvider(params.data.workspaceId, result.selectedProvider, result.selectedModel);
      await prisma.modelUsageEvent.create({
        data: {
          workspaceId: params.data.workspaceId,
          providerId,
          model: result.selectedModel,
          taskType: "epoch_ai_execution",
          inputTokens: result.evidence.inputTokens,
          outputTokens: result.evidence.outputTokens,
          estimatedCost: result.evidence.estimatedCostCents / 100,
          latencyMs: result.evidence.latencyMs ?? Date.now() - startedAt,
          success: true,
        },
      });
      if (body.data.cacheTtlSeconds) {
        await putEpochAiExecutionCache({
          workspaceId: params.data.workspaceId,
          provider: result.selectedProvider,
          model: result.selectedModel,
          prompt: body.data.prompt,
          maxOutputTokens: body.data.maxOutputTokens,
          requireJson: body.data.requireJson,
          reasoning: body.data.reasoning,
          response: result,
          ttlSeconds: body.data.cacheTtlSeconds,
          privacy: body.data.cachePrivacy,
        });
      }
      emitEpochRuntimeEvent({
        userId: req.authUserId,
        orgId: req.authOrgId,
        workspaceId: params.data.workspaceId,
        kind: "epoch.ai_execution.completed",
        label: "AI execution completed",
        subjectId: result.selectedModel,
        payload: {
          provider: result.selectedProvider,
          model: result.selectedModel,
          attempts: result.attempts,
          inputTokens: result.evidence.inputTokens,
          outputTokens: result.evidence.outputTokens,
          estimatedCostCents: result.evidence.estimatedCostCents,
          latencyMs: result.evidence.latencyMs,
        },
      });
      sendApiSuccess(res, 200, { result }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_execute" }));
    } catch (error) {
      const normalized = error instanceof EpochAiProviderError
        ? error
        : new EpochAiProviderError("provider_unavailable", error instanceof Error ? error.message : "epoch_ai_execution_failed");
      await prisma.modelUsageEvent.create({
        data: {
          workspaceId: params.data.workspaceId,
          taskType: "epoch_ai_execution",
          latencyMs: Date.now() - startedAt,
          success: false,
          error: normalized.code,
        },
      });
      emitEpochRuntimeEvent({
        userId: req.authUserId,
        orgId: req.authOrgId,
        workspaceId: params.data.workspaceId,
        kind: "epoch.ai_execution.failed",
        label: "AI execution failed",
        payload: { errorCode: normalized.code, attemptedProviders: providers, latencyMs: Date.now() - startedAt },
      });
      const status = normalized.code === "rate_limited" ? 429 : normalized.code === "timeout" ? 504 : normalized.code === "context_exceeded" || normalized.code === "invalid_response" ? 400 : 502;
      sendApiError(res, status, { code: `AI_EXECUTION_${normalized.code.toUpperCase()}`, message: normalized.message, ...(normalized.retryAfterMs ? { retryAfterMs: normalized.retryAfterMs } : {}) }, buildApiMeta(req, startedAt));
    } finally {
      clearTimeout(timeout);
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/stream",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({
      missionId: z.string().min(1),
      executionId: z.string().min(1),
      prompt: z.string().min(1).max(100_000),
      provider: z.enum(["openai", "openrouter", "local", "private", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"]).default("openrouter"),
      maxOutputTokens: z.number().int().min(1).max(16_384).default(512),
      requireJson: z.boolean().default(false),
      reasoning: z.boolean().default(false),
      timeoutMs: z.number().int().min(100).max(300_000).default(120_000),
      correlationId: z.string().min(1).max(200).optional(),
      traceId: z.string().min(1).max(200).optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid AI stream request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const configuredModel = process.env.EPOCH_WORKER_AI_MODEL?.trim();
    const model = configuredModel ? getEpochAiModel(body.data.provider, configuredModel) : getEpochAiDefaultModel(body.data.provider);
    if (!model) {
      sendApiError(res, 400, { code: "AI_EXECUTION_MODEL_NOT_FOUND", message: "No catalog model is available for this provider" }, buildApiMeta(req, startedAt));
      return;
    }
    let providerConfig;
    try {
      providerConfig = readEpochAiProviderConfig(body.data.provider);
    } catch (error) {
      const normalized = error instanceof EpochAiProviderError ? error : new EpochAiProviderError("provider_unavailable", "epoch_ai_provider_not_configured");
      sendApiError(res, 503, { code: "AI_EXECUTION_PROVIDER_UNAVAILABLE", message: normalized.message }, buildApiMeta(req, startedAt));
      return;
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, body.data.timeoutMs);
    const correlationId = body.data.correlationId ?? `corr_${randomUUID()}`;
    const traceId = body.data.traceId ?? `trace_${randomUUID()}`;
    let clientClosed = false;
    req.on("close", () => {
      clientClosed = true;
      controller.abort();
    });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(`event: ready\ndata: ${JSON.stringify({ workspaceId: params.data.workspaceId, missionId: body.data.missionId, executionId: body.data.executionId, provider: body.data.provider, model: model.model, correlationId, traceId })}\n\n`);

    try {
      const streamed = await streamEpochAiToExecution({
        workspaceId: params.data.workspaceId,
        missionId: body.data.missionId,
        executionId: body.data.executionId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        correlationId,
        traceId,
        request: { model: model.model, prompt: body.data.prompt, maxOutputTokens: body.data.maxOutputTokens, requireJson: body.data.requireJson, reasoning: body.data.reasoning },
        provider: providerConfig,
        signal: controller.signal,
        onDelta: (delta) => {
          if (!clientClosed && !res.writableEnded) res.write(`event: delta\ndata: ${JSON.stringify(delta)}\n\n`);
        },
      });
      await prisma.modelUsageEvent.create({
        data: {
          workspaceId: params.data.workspaceId,
          model: streamed.response.evidence.model,
          taskType: "epoch_ai_stream",
          inputTokens: streamed.response.evidence.inputTokens,
          outputTokens: streamed.response.evidence.outputTokens,
          estimatedCost: streamed.response.evidence.estimatedCostCents / 100,
          latencyMs: streamed.response.evidence.latencyMs ?? Date.now() - startedAt,
          success: true,
        },
      });
      if (!clientClosed && !res.writableEnded) {
        res.write(`event: complete\ndata: ${JSON.stringify({ output: streamed.response.output, evidence: streamed.response.evidence, deltas: streamed.deltas.length })}\n\n`);
        res.end();
      }
    } catch (error) {
      const normalized = timedOut
        ? new EpochAiProviderError("timeout", "epoch_ai_stream_timeout")
        : error instanceof EpochAiProviderError
          ? error
          : new EpochAiProviderError("provider_unavailable", error instanceof Error ? error.message : "epoch_ai_stream_failed");
      await prisma.modelUsageEvent.create({
        data: { workspaceId: params.data.workspaceId, taskType: "epoch_ai_stream", latencyMs: Date.now() - startedAt, success: false, error: normalized.code },
      });
      if (!clientClosed && !res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ code: normalized.code, message: normalized.message })}\n\n`);
        res.end();
      }
    } finally {
      clearTimeout(timeout);
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/ai-execution/workers",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid workspace" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const endpoints = await listWorkspaceAiExecutionEndpoints(params.data.workspaceId);
    sendApiSuccess(res, 200, { endpoints }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_workers" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/workers",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = CreateEpochWorkerSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid AI execution worker registration" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const metadata = body.data.metadata as Record<string, unknown>;
    if (typeof metadata.provider !== "string" || typeof metadata.model !== "string") {
      sendApiError(res, 400, { code: "AI_WORKER_PROVIDER_MODEL_REQUIRED", message: "AI execution workers require metadata.provider and metadata.model" }, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await registerEpochWorker({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      ...body.data,
      projectScope: body.data.projectScope as Record<string, unknown>,
      metadata,
    });
    sendApiSuccess(res, 201, { worker }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_worker_register" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/ai-execution/health",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid workspace" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const health = buildEpochAiExecutionHealth(await listWorkspaceAiExecutionEndpoints(params.data.workspaceId));
    const healthRows = await prisma.$queryRaw<Array<{ provider: string; status: string; configured: boolean; reachable: boolean; latency_ms: number | null; http_status: number | null; error_code: string | null; checked_at: Date }>>`
      SELECT "provider", "status", "configured", "reachable", "latency_ms", "http_status", "error_code", "checked_at"
      FROM "epoch_ai_provider_health_checks"
      WHERE "workspace_id" = ${params.data.workspaceId}
      ORDER BY "checked_at" DESC
      LIMIT 50
    `;
    const latestProviderHealth = [...new Map(healthRows.map((row) => [row.provider, row])).values()];
    sendApiSuccess(res, 200, {
      health,
      providerHealth: latestProviderHealth,
      summary: {
        total: health.length,
        healthy: health.filter((item) => item.status === "healthy").length,
        degraded: health.filter((item) => item.status === "degraded").length,
        offline: health.filter((item) => item.status === "offline").length,
      },
    }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_health" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/health/probe",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({
      providers: z.array(z.enum(["openai", "openrouter", "local", "private", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"])).min(1).max(11).default(["openai", "openrouter", "local", "private"]),
      timeoutMs: z.number().int().min(250).max(10_000).default(5_000),
    }).safeParse(req.body ?? {});
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid provider health probe" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const health = await probeEpochAiProviders({ providers: body.data.providers, timeoutMs: body.data.timeoutMs });
    await Promise.all(health.map((item) => prisma.$executeRaw`
      INSERT INTO "epoch_ai_provider_health_checks" ("id", "workspace_id", "provider", "status", "configured", "reachable", "latency_ms", "http_status", "error_code")
      VALUES (${randomUUID()}, ${params.data.workspaceId}, ${item.provider}, ${item.status}, ${item.configured}, ${item.reachable}, ${item.latencyMs}, ${item.httpStatus}, ${item.errorCode ?? null})
    `));
    sendApiSuccess(res, 200, { health, probedAt: new Date().toISOString() }, buildApiMeta(req, startedAt, { intent: "epoch_ai_provider_health_probe" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/ai-execution/health/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({ provider: z.enum(["openai", "openrouter", "local", "private", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"]).optional(), limit: z.coerce.number().int().min(1).max(200).default(50) }).safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid provider health history query" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const rows = await prisma.$queryRaw<Array<{ provider: string; status: string; configured: boolean; reachable: boolean; latency_ms: number | null; http_status: number | null; error_code: string | null; checked_at: Date }>>`
      SELECT "provider", "status", "configured", "reachable", "latency_ms", "http_status", "error_code", "checked_at"
      FROM "epoch_ai_provider_health_checks"
      WHERE "workspace_id" = ${params.data.workspaceId}
        ${query.data.provider ? prisma.$queryRaw`AND "provider" = ${query.data.provider}` : prisma.$queryRaw``}
      ORDER BY "checked_at" DESC
      LIMIT ${query.data.limit}
    `;
    sendApiSuccess(res, 200, { checks: rows }, buildApiMeta(req, startedAt, { intent: "epoch_ai_provider_health_history" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/ai-execution/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }).safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid AI execution history query" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const executions = await prisma.modelUsageEvent.findMany({
      where: { workspaceId: params.data.workspaceId },
      orderBy: { createdAt: "desc" },
      take: query.data.limit,
      include: { provider: { select: { provider: true, displayName: true } } },
    });
    sendApiSuccess(res, 200, { executions }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_history" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/ai-execution/costs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid workspace" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const usage = await prisma.modelUsageEvent.findMany({
      where: { workspaceId: params.data.workspaceId },
      select: { providerId: true, model: true, inputTokens: true, outputTokens: true, estimatedCost: true, success: true, createdAt: true, provider: { select: { provider: true, displayName: true } } },
    });
    const byProvider = new Map<string, { executions: number; inputTokens: number; outputTokens: number; estimatedCost: number; provider: string; model: string; gpuHours: number; updatedAt: Date }>();
    for (const event of usage) {
      const key = event.providerId ?? "unattributed";
      const current = byProvider.get(key) ?? { executions: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0, provider: event.provider?.provider ?? "unattributed", model: event.model ?? "-", gpuHours: 0, updatedAt: event.createdAt };
      current.executions += 1;
      current.inputTokens += event.inputTokens;
      current.outputTokens += event.outputTokens;
      current.estimatedCost += event.estimatedCost;
      if (event.model && current.model === "-") current.model = event.model;
      if (event.createdAt > current.updatedAt) current.updatedAt = event.createdAt;
      byProvider.set(key, current);
    }
    sendApiSuccess(res, 200, {
      totalExecutions: usage.length,
      successfulExecutions: usage.filter((event) => event.success).length,
      inputTokens: usage.reduce((total, event) => total + event.inputTokens, 0),
      outputTokens: usage.reduce((total, event) => total + event.outputTokens, 0),
      estimatedCost: usage.reduce((total, event) => total + event.estimatedCost, 0),
      byProvider: [...byProvider.entries()].map(([providerId, values]) => ({ providerId, ...values })),
    }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_costs" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/ai-execution/rebalance",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success || (req.body !== undefined && (typeof req.body !== "object" || Array.isArray(req.body)))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid rebalance request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const endpoints = await listWorkspaceAiExecutionEndpoints(params.data.workspaceId);
    sendApiSuccess(res, 200, {
      dryRun: true,
      generatedAt: new Date().toISOString(),
      plan: buildEpochAiRebalancePlan(endpoints),
    }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_rebalance" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/agents/sessions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ missionId: z.string().min(1), workerId: z.string().min(1), framework: z.enum(["custom_worker", "openai_agents", "langgraph"]), parentSessionId: z.string().min(1).optional() }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent session request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const [mission, worker] = await Promise.all([
      prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } }),
      prisma.epochWorker.findFirst({ where: { id: body.data.workerId, workspaceId: params.data.workspaceId, retiredAt: null }, select: { id: true, metadata: true } }),
    ]);
    if (!mission || !worker) {
      sendApiError(res, 404, { code: "AGENT_SESSION_SCOPE_NOT_FOUND", message: "Mission or worker is not in this workspace" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!getEpochAgentAdapter(body.data.framework)) {
      sendApiError(res, 400, { code: "AGENT_FRAMEWORK_UNSUPPORTED", message: "Agent framework is not supported" }, buildApiMeta(req, startedAt));
      return;
    }
    const sessionId = randomUUID();
    const session = createEpochAgentSession({ id: sessionId, missionId: mission.id, workerId: worker.id, framework: body.data.framework, parentSessionId: body.data.parentSessionId });
    await prisma.agentSession.create({ data: { id: session.id, projectId: params.data.workspaceId, agentId: worker.id, model: "epoch-worker", tool: "epoch", task: mission.id, mode: session.framework, status: "RECORDING" } });
    sendApiSuccess(res, 201, { session }, buildApiMeta(req, startedAt, { intent: "epoch_agent_session_create" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/agents/sessions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }).safeParse(req.query);
    if (!params.success || !query.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent session list request" }, buildApiMeta(req, startedAt));
      return;
    }
    const sessions = await prisma.agentSession.findMany({ where: { projectId: params.data.workspaceId }, orderBy: { startedAt: "desc" }, take: query.data.limit });
    sendApiSuccess(res, 200, { sessions: sessions.map((session) => ({ id: session.id, missionId: session.task, workerId: session.agentId, framework: session.mode, status: session.status === "RECORDING" ? "active" : session.status === "PAUSED" ? "paused" : session.status === "COMPLETED" ? "completed" : "failed", checkpointVersion: Number(session.summary?.match(/checkpoint:(\d+)/)?.[1] ?? 0), startedAt: session.startedAt, endedAt: session.endedAt })) }, buildApiMeta(req, startedAt, { intent: "epoch_agent_session_list" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/agents/sessions/:sessionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), sessionId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent session detail request" }, buildApiMeta(req, startedAt));
      return;
    }
    const session = await prisma.agentSession.findFirst({ where: { id: params.data.sessionId, projectId: params.data.workspaceId }, include: { events: { orderBy: { timestamp: "asc" }, take: 500 } } });
    if (!session) {
      sendApiError(res, 404, { code: "AGENT_SESSION_NOT_FOUND", message: "Agent session not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { session: { id: session.id, missionId: session.task, workerId: session.agentId, framework: session.mode, status: session.status, checkpointVersion: Number(session.summary?.match(/checkpoint:(\d+)/)?.[1] ?? 0), startedAt: session.startedAt, endedAt: session.endedAt }, events: session.events }, buildApiMeta(req, startedAt, { intent: "epoch_agent_session_detail" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/agents/sessions/:sessionId/complete",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), sessionId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent completion request" }, buildApiMeta(req, startedAt));
      return;
    }
    const session = await prisma.agentSession.findFirst({ where: { id: params.data.sessionId, projectId: params.data.workspaceId, status: { in: ["RECORDING", "PAUSED"] } } });
    if (!session) {
      sendApiError(res, 404, { code: "AGENT_SESSION_NOT_FOUND", message: "Active agent session not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const updated = await prisma.agentSession.update({ where: { id: session.id }, data: { status: "COMPLETED", endedAt: new Date() } });
    await prisma.agentSessionEvent.create({ data: { sessionId: session.id, type: "completed", summary: "Agent session completed" } });
    sendApiSuccess(res, 200, { session: { id: updated.id, status: "completed", missionId: updated.task, workerId: updated.agentId } }, buildApiMeta(req, startedAt, { intent: "epoch_agent_session_complete" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/agents/sessions/:sessionId/handoff",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), sessionId: z.string().min(1) }).safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), framework: z.enum(["custom_worker", "openai_agents", "langgraph"]) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent handoff request" }, buildApiMeta(req, startedAt));
      return;
    }
    const source = await prisma.agentSession.findFirst({ where: { id: params.data.sessionId, projectId: params.data.workspaceId, status: { in: ["RECORDING", "PAUSED"] } } });
    const worker = await prisma.epochWorker.findFirst({ where: { id: body.data.workerId, workspaceId: params.data.workspaceId, retiredAt: null }, select: { id: true } });
    if (!source || !source.task || !worker) {
      sendApiError(res, 404, { code: "AGENT_HANDOFF_SCOPE_NOT_FOUND", message: "Source session or target worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const sourceFramework = getEpochAgentAdapter(source.mode)?.framework;
    if (!sourceFramework || !getEpochAgentAdapter(body.data.framework)) {
      sendApiError(res, 409, { code: "AGENT_SESSION_INVALID", message: "Unsupported agent framework" }, buildApiMeta(req, startedAt));
      return;
    }
    const from: EpochAgentSession = { id: source.id, missionId: source.task, workerId: source.agentId, framework: sourceFramework, status: source.status === "PAUSED" ? "paused" : "active", checkpointVersion: Number(source.summary?.match(/checkpoint:(\d+)/)?.[1] ?? 0) };
    const to = createEpochAgentSession({ id: randomUUID(), missionId: source.task, workerId: worker.id, framework: body.data.framework, parentSessionId: source.id });
    const handoff = validateEpochAgentHandoff({ from, to, missionId: source.task });
    if (!handoff.allowed) {
      sendApiError(res, 409, { code: "AGENT_HANDOFF_DENIED", message: handoff.reason }, buildApiMeta(req, startedAt));
      return;
    }
    await prisma.agentSession.update({ where: { id: source.id }, data: { status: "PAUSED" } });
    await prisma.agentSession.create({ data: { id: to.id, projectId: params.data.workspaceId, agentId: to.workerId, model: "epoch-worker", tool: "epoch", task: to.missionId, mode: to.framework, status: "RECORDING", handoffId: source.id } });
    await prisma.agentSessionEvent.create({ data: { sessionId: source.id, type: "handoff", summary: `Handed off to ${to.workerId}`, payloadJson: { targetSessionId: to.id, targetWorkerId: to.workerId, framework: to.framework } } });
    sendApiSuccess(res, 201, { session: to, handoff }, buildApiMeta(req, startedAt, { intent: "epoch_agent_handoff" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/agents/sessions/:sessionId/checkpoint",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), sessionId: z.string().min(1) }).safeParse(req.params);
    const body = z.object({ state: z.record(z.string(), z.unknown()), toolCallIds: z.array(z.string().min(1)).max(500).default([]) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent checkpoint request" }, buildApiMeta(req, startedAt));
      return;
    }
    const stored = await prisma.agentSession.findFirst({ where: { id: params.data.sessionId, projectId: params.data.workspaceId, status: { in: ["RECORDING", "PAUSED"] } } });
    if (!stored) {
      sendApiError(res, 404, { code: "AGENT_SESSION_NOT_FOUND", message: "Agent session not found or not checkpointable" }, buildApiMeta(req, startedAt));
      return;
    }
    const framework = getEpochAgentAdapter(stored.mode)?.framework;
    if (!framework || !stored.task) {
      sendApiError(res, 409, { code: "AGENT_SESSION_INVALID", message: "Agent session is missing its mission scope" }, buildApiMeta(req, startedAt));
      return;
    }
    const current: EpochAgentSession = { id: stored.id, missionId: stored.task, workerId: stored.agentId, framework, status: stored.status === "PAUSED" ? "paused" : "active", checkpointVersion: Number(stored.summary?.match(/checkpoint:(\d+)/)?.[1] ?? 0) };
    const result = checkpointEpochAgent({ session: current, state: body.data.state, toolCallIds: body.data.toolCallIds });
    await prisma.agentSession.update({ where: { id: stored.id }, data: { status: "PAUSED", summary: `checkpoint:${result.session.checkpointVersion}` } });
    await prisma.agentSessionEvent.create({ data: { sessionId: stored.id, type: "checkpoint", summary: `Checkpoint ${result.checkpoint.version}`, payloadJson: result.checkpoint as any } });
    sendApiSuccess(res, 200, { session: result.session, checkpoint: result.checkpoint }, buildApiMeta(req, startedAt, { intent: "epoch_agent_checkpoint" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/agents/sessions/:sessionId/tool-calls/authorize",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), sessionId: z.string().min(1) }).safeParse(req.params);
    const body = z.object({ id: z.string().min(1), tool: z.string().min(1).max(200), arguments: z.record(z.string(), z.unknown()).optional(), permissions: z.array(z.string().min(1)).max(200).default([]), approvalGranted: z.boolean().optional(), blockedTools: z.array(z.string().min(1)).max(200).optional(), traceId: z.string().min(1).optional() }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent tool call request" }, buildApiMeta(req, startedAt));
      return;
    }
    const stored = await prisma.agentSession.findFirst({ where: { id: params.data.sessionId, projectId: params.data.workspaceId, status: "RECORDING" } });
    if (!stored || !stored.task) {
      sendApiError(res, 404, { code: "AGENT_SESSION_NOT_FOUND", message: "Active agent session not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const framework = getEpochAgentAdapter(stored.mode)?.framework;
    if (!framework) {
      sendApiError(res, 409, { code: "AGENT_SESSION_INVALID", message: "Unsupported agent session framework" }, buildApiMeta(req, startedAt));
      return;
    }
    const decision = governEpochAgentToolCall({ session: { id: stored.id, missionId: stored.task, workerId: stored.agentId, framework, status: "active", checkpointVersion: Number(stored.summary?.match(/checkpoint:(\d+)/)?.[1] ?? 0) }, ...body.data });
    await prisma.agentSessionEvent.create({ data: { sessionId: stored.id, type: "tool_call", summary: `Tool ${body.data.tool}: ${decision.call.status}`, payloadJson: decision as any } });
    sendApiSuccess(res, 200, { decision }, buildApiMeta(req, startedAt, { intent: "epoch_agent_tool_authorize" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/agents/sessions/:sessionId/resume",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), sessionId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent resume request" }, buildApiMeta(req, startedAt));
      return;
    }
    const stored = await prisma.agentSession.findFirst({ where: { id: params.data.sessionId, projectId: params.data.workspaceId, status: "PAUSED" } });
    const checkpointEvent = stored ? await prisma.agentSessionEvent.findFirst({ where: { sessionId: stored.id, type: "checkpoint" }, orderBy: { timestamp: "desc" } }) : null;
    if (!stored || !stored.task || !checkpointEvent) {
      sendApiError(res, 404, { code: "AGENT_CHECKPOINT_NOT_FOUND", message: "Paused agent session has no checkpoint" }, buildApiMeta(req, startedAt));
      return;
    }
    const framework = getEpochAgentAdapter(stored.mode)?.framework;
    if (!framework) {
      sendApiError(res, 409, { code: "AGENT_SESSION_INVALID", message: "Unsupported agent session framework" }, buildApiMeta(req, startedAt));
      return;
    }
    const current: EpochAgentSession = { id: stored.id, missionId: stored.task, workerId: stored.agentId, framework, status: "paused", checkpointVersion: Number(stored.summary?.match(/checkpoint:(\d+)/)?.[1] ?? 0) };
    const checkpoint = checkpointEvent.payloadJson as unknown as EpochAgentCheckpoint;
    const resumed = resumeEpochAgent({ session: current, checkpoint });
    await prisma.agentSession.update({ where: { id: stored.id }, data: { status: "RECORDING" } });
    await prisma.agentSessionEvent.create({ data: { sessionId: stored.id, type: "resumed", summary: `Resumed checkpoint ${checkpoint.version}`, payloadJson: { version: checkpoint.version } } });
    sendApiSuccess(res, 200, { session: resumed.session, state: resumed.state, toolCallIds: resumed.toolCallIds }, buildApiMeta(req, startedAt, { intent: "epoch_agent_resume" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/agents/sessions/:sessionId/tool-calls/:callId/complete",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), sessionId: z.string().min(1), callId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent tool completion request" }, buildApiMeta(req, startedAt));
      return;
    }
    const stored = await prisma.agentSession.findFirst({ where: { id: params.data.sessionId, projectId: params.data.workspaceId }, select: { id: true, task: true, agentId: true, mode: true } });
    const callEvent = stored ? await prisma.agentSessionEvent.findFirst({ where: { sessionId: stored.id, type: "tool_call", payloadJson: { path: ["call", "id"], equals: params.data.callId } } }) : null;
    if (!stored || !stored.task || !callEvent) {
      sendApiError(res, 404, { code: "AGENT_TOOL_CALL_NOT_FOUND", message: "Tool call not found in this session" }, buildApiMeta(req, startedAt));
      return;
    }
    const framework = getEpochAgentAdapter(stored.mode)?.framework;
    if (!framework) {
      sendApiError(res, 409, { code: "AGENT_SESSION_INVALID", message: "Unsupported agent session framework" }, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const decision = completeEpochAgentToolCall({ decision: callEvent.payloadJson as unknown as EpochAgentToolDecision, missionId: stored.task, sessionId: stored.id });
      await prisma.agentSessionEvent.create({ data: { sessionId: stored.id, type: "tool_call_completed", summary: `Tool ${decision.call.tool} completed`, payloadJson: decision as any } });
      sendApiSuccess(res, 200, { decision }, buildApiMeta(req, startedAt, { intent: "epoch_agent_tool_complete" }));
    } catch (error) {
      sendApiError(res, 409, { code: "AGENT_TOOL_CALL_NOT_COMPLETABLE", message: error instanceof Error ? error.message : "Tool call cannot be completed" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.delete(
  "/workspaces/:workspaceId/ai-execution/cache",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({ provider: z.enum(["openai", "openrouter", "local", "private", "anthropic", "gemini", "deepseek", "ollama", "vllm", "lm_studio", "nvidia_nim"]).optional(), model: z.string().min(1).max(200).optional() }).safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid cache invalidation request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const deleted = await invalidateEpochAiExecutionCache({ workspaceId: params.data.workspaceId, ...query.data });
    sendApiSuccess(res, 200, { deleted }, buildApiMeta(req, startedAt, { intent: "epoch_ai_execution_cache_invalidate" }));
  }),
);

epochRouter.get(
  "/agents/catalog",
  asyncHandler(async (req, res) => {
    sendApiSuccess(res, 200, { version: "epoch.agent.catalog.v1", adapters: listEpochAgentAdapters() }, buildApiMeta(req, Date.now(), { intent: "epoch_list_agent_adapters" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/enrollment",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), ttlMs: z.number().int().positive().optional() }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge enrollment" }, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker || worker.retiredAt) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    const secret = process.env.EPOCH_EDGE_ENROLLMENT_SECRET;
    if (!secret) { sendApiError(res, 503, { code: "EDGE_ENROLLMENT_SECRET_UNAVAILABLE", message: "Edge enrollment signing is not configured" }, buildApiMeta(req, startedAt)); return; }
    const enrollment = issueEpochEdgeEnrollment({ workerId: body.data.workerId, workspaceId: params.data.workspaceId, ttlMs: body.data.ttlMs });
    enrollment.signature = signEpochEdgeEnrollment(enrollment, secret);
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    await prisma.epochWorker.update({ where: { id: worker.id }, data: { metadata: { ...metadata, edgeEnrollment: enrollment } as any, history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "edge_enrollment", at: enrollment.issuedAt, certificateId: enrollment.certificateId }] } });
    sendApiSuccess(res, 201, { enrollment }, buildApiMeta(req, startedAt, { intent: "epoch_edge_enrollment" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/telemetry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({
      workerId: z.string().min(1),
      sequence: z.number().int().nonnegative(),
      observedAt: z.string().datetime(),
      connectivity: z.enum(["online", "offline"]),
      metrics: z.record(z.string(), z.number().finite()),
      signature: z.string().regex(/^[a-f0-9]{64}$/i),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge telemetry" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker || worker.retiredAt) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const secret = process.env.EPOCH_EDGE_TELEMETRY_SECRET;
    if (!secret) {
      sendApiError(res, 503, { code: "EDGE_TELEMETRY_SECRET_UNAVAILABLE", message: "Edge telemetry verification is not configured" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!verifyEpochEdgeTelemetry(body.data, secret)) {
      sendApiError(res, 401, { code: "EDGE_TELEMETRY_SIGNATURE_INVALID", message: "Edge telemetry signature is invalid" }, buildApiMeta(req, startedAt));
      return;
    }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    const previousSequence = typeof metadata.edgeTelemetrySequence === "number" ? metadata.edgeTelemetrySequence : undefined;
    const sequence = validateEpochEdgeTelemetrySequence({ previousSequence, currentSequence: body.data.sequence });
    if (!sequence.accepted) {
      sendApiError(res, 409, { code: "EDGE_TELEMETRY_SEQUENCE_REJECTED", message: `Edge telemetry sequence ${sequence.reason}`, details: { previousSequence, currentSequence: body.data.sequence } }, buildApiMeta(req, startedAt));
      return;
    }
    await prisma.epochWorker.update({
      where: { id: worker.id },
      data: {
        status: body.data.connectivity === "offline" ? "offline" : worker.status === "offline" ? "available" : worker.status,
        lastHeartbeat: new Date(body.data.observedAt),
        metadata: { ...metadata, edgeTelemetrySequence: body.data.sequence, edgeTelemetry: body.data } as any,
        history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "edge_telemetry", at: body.data.observedAt, sequence: body.data.sequence, connectivity: body.data.connectivity }],
      },
    });
    emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.edge.telemetry", label: "Edge worker telemetry", subjectId: worker.id, payload: { workerId: worker.id, sequence: body.data.sequence, connectivity: body.data.connectivity, metrics: body.data.metrics } });
    sendApiSuccess(res, 202, { accepted: true, sequence }, buildApiMeta(req, startedAt, { intent: "epoch_edge_telemetry" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/capabilities",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), capabilities: z.array(z.string().min(1)).min(1).max(100) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge capabilities" }, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker || worker.retiredAt) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    let state;
    const registeredCapabilities = Array.isArray(worker.capabilities) && worker.capabilities.every((value): value is string => typeof value === "string") ? worker.capabilities : [];
    try { state = advertiseEpochEdgeCapabilities(normalizeEpochEdgeState(metadata, registeredCapabilities), body.data.capabilities); } catch (error) { sendApiError(res, 409, { code: "EDGE_CAPABILITIES_REJECTED", message: error instanceof Error ? error.message : "Edge capabilities rejected" }, buildApiMeta(req, startedAt)); return; }
    await prisma.epochWorker.update({ where: { id: worker.id }, data: { capabilities: state.capabilities, status: "available", metadata: { ...metadata, edgeCapabilities: state.capabilities, edgeState: state } as any, history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "edge_capabilities", at: new Date().toISOString(), capabilities: state.capabilities }] } });
    emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.edge.capabilities_advertised", label: "Edge capabilities advertised", subjectId: worker.id, payload: { workerId: worker.id, capabilities: state.capabilities } });
    sendApiSuccess(res, 200, { workerId: worker.id, capabilities: state.capabilities, state }, buildApiMeta(req, startedAt, { intent: "epoch_edge_capabilities" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/jobs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), jobId: z.string().min(1), missionId: z.string().min(1).optional(), payload: z.record(z.string(), z.unknown()), sequence: z.number().int().nonnegative().optional() }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge job" }, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker || worker.retiredAt) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    if (body.data.missionId && !(await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } }))) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    try {
      const registeredCapabilities = Array.isArray(worker.capabilities) && worker.capabilities.every((value): value is string => typeof value === "string") ? worker.capabilities : [];
      const state = queueEpochEdgeJob(normalizeEpochEdgeState(metadata, registeredCapabilities), { id: body.data.jobId, payload: body.data.payload, queuedAt: new Date().toISOString(), attempts: 0, sequence: body.data.sequence });
      await prisma.epochWorker.update({ where: { id: worker.id }, data: { metadata: { ...metadata, edgeState: state } as any, history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "edge_job_queued", at: new Date().toISOString(), jobId: body.data.jobId }] } });
      sendApiSuccess(res, 202, { accepted: true, job: state.pendingJobs.find((job) => job.id === body.data.jobId), state }, buildApiMeta(req, startedAt, { intent: "epoch_edge_job_queued" }));
    } catch (error) { sendApiError(res, 409, { code: "EDGE_JOB_REJECTED", message: error instanceof Error ? error.message : "Edge job rejected" }, buildApiMeta(req, startedAt)); }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/reconnect",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), sequence: z.number().int().nonnegative(), observedAt: z.string().datetime(), connectivity: z.literal("online"), metrics: z.record(z.string(), z.number().finite()), signature: z.string().regex(/^[a-f0-9]{64}$/i), completedJobIds: z.array(z.string().min(1)).default([]), failedJobIds: z.array(z.string().min(1)).default([]) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge reconnect" }, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker || worker.retiredAt) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    const secret = process.env.EPOCH_EDGE_TELEMETRY_SECRET;
    if (!secret || !verifyEpochEdgeTelemetry(body.data, secret)) { sendApiError(res, 401, { code: "EDGE_TELEMETRY_SIGNATURE_INVALID", message: "Edge reconnect signature is invalid" }, buildApiMeta(req, startedAt)); return; }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    const sequence = validateEpochEdgeTelemetrySequence({ previousSequence: typeof metadata.edgeTelemetrySequence === "number" ? metadata.edgeTelemetrySequence : undefined, currentSequence: body.data.sequence });
    if (!sequence.accepted) { sendApiError(res, 409, { code: "EDGE_TELEMETRY_SEQUENCE_REJECTED", message: `Edge telemetry sequence ${sequence.reason}` }, buildApiMeta(req, startedAt)); return; }
    const registeredCapabilities = Array.isArray(worker.capabilities) && worker.capabilities.every((value): value is string => typeof value === "string") ? worker.capabilities : [];
    const reconciled = reconcileEpochEdgeQueue(normalizeEpochEdgeState(metadata, registeredCapabilities), body.data);
    await prisma.epochWorker.update({ where: { id: worker.id }, data: { status: "available", lastHeartbeat: new Date(body.data.observedAt), metadata: { ...metadata, edgeTelemetrySequence: body.data.sequence, edgeTelemetry: body.data, edgeState: reconciled.state } as any, history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "edge_reconnected", at: body.data.observedAt, sequence: body.data.sequence, replayCount: reconciled.replay.length }] } });
    emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.edge.reconciled", label: "Edge worker reconciled", subjectId: worker.id, payload: { workerId: worker.id, sequence: body.data.sequence, completed: reconciled.completed, failed: reconciled.failed, replayCount: reconciled.replay.length } });
    sendApiSuccess(res, 202, { accepted: true, sequence, replay: reconciled, state: reconciled.state }, buildApiMeta(req, startedAt, { intent: "epoch_edge_reconnect" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/edge/workers/:workerId/state",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge state request" }, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, params.data.workerId);
    if (!worker) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    const registeredCapabilities = Array.isArray(worker.capabilities) && worker.capabilities.every((value): value is string => typeof value === "string") ? worker.capabilities : [];
    sendApiSuccess(res, 200, { workerId: worker.id, status: worker.status, capabilities: registeredCapabilities, state: normalizeEpochEdgeState(metadata, registeredCapabilities), enrollment: metadata.edgeEnrollment ?? null, telemetry: metadata.edgeTelemetry ?? null }, buildApiMeta(req, startedAt, { intent: "epoch_edge_state" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/updates/verify",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), version: z.string().min(1).max(100), checksum: z.string().min(1).max(256), signature: z.string().regex(/^[a-f0-9]{64}$/i), payload: z.string().max(1_000_000) }).safeParse(req.body);
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge update verification request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker || worker.retiredAt) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    const secret = process.env.EPOCH_EDGE_UPDATE_SECRET ?? process.env.EPOCH_EDGE_ENROLLMENT_SECRET;
    if (!secret) { sendApiError(res, 503, { code: "EDGE_UPDATE_SECRET_UNAVAILABLE", message: "Edge update verification is not configured" }, buildApiMeta(req, startedAt)); return; }
    const valid = validateEpochEdgeUpdate(body.data, secret);
    emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.edge.update_verified", label: valid ? "Edge update verified" : "Edge update rejected", subjectId: worker.id, payload: { workerId: worker.id, version: body.data.version, checksum: body.data.checksum, accepted: valid } });
    if (!valid) { sendApiError(res, 401, { code: "EDGE_UPDATE_SIGNATURE_INVALID", message: "Edge update signature is invalid" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { accepted: true, workerId: worker.id, version: body.data.version, checksum: body.data.checksum, stagedOnly: true }, buildApiMeta(req, startedAt, { intent: "epoch_edge_update_verify" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/updates/rollback",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), version: z.string().min(1).max(100), checksum: z.string().min(1).max(256), signature: z.string().regex(/^[a-f0-9]{64}$/i), payload: z.string().max(1_000_000), reason: z.string().min(1).max(500) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge rollback" }, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker || worker.retiredAt) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    const secret = process.env.EPOCH_EDGE_UPDATE_SECRET ?? process.env.EPOCH_EDGE_ENROLLMENT_SECRET;
    if (!secret || !validateEpochEdgeUpdate(body.data, secret)) { sendApiError(res, 401, { code: "EDGE_UPDATE_SIGNATURE_INVALID", message: "Edge update signature is invalid" }, buildApiMeta(req, startedAt)); return; }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    let state;
    const registeredCapabilities = Array.isArray(worker.capabilities) && worker.capabilities.every((value): value is string => typeof value === "string") ? worker.capabilities : [];
    try { state = rollbackEpochEdgeUpdate(normalizeEpochEdgeState(metadata, registeredCapabilities), body.data.version, body.data.checksum); } catch (error) { sendApiError(res, 409, { code: "EDGE_ROLLBACK_REJECTED", message: error instanceof Error ? error.message : "Edge rollback rejected" }, buildApiMeta(req, startedAt)); return; }
    await prisma.epochWorker.update({ where: { id: worker.id }, data: { status: "available", metadata: { ...metadata, edgeState: state, edgeRollback: { version: body.data.version, checksum: body.data.checksum, reason: body.data.reason, at: new Date().toISOString() } } as any, history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "edge_update_rollback", at: new Date().toISOString(), version: body.data.version, reason: body.data.reason }] } });
    emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.edge.update_rolled_back", label: "Edge update rolled back", subjectId: worker.id, payload: { workerId: worker.id, version: body.data.version, checksum: body.data.checksum, reason: body.data.reason } });
    sendApiSuccess(res, 200, { accepted: true, workerId: worker.id, state }, buildApiMeta(req, startedAt, { intent: "epoch_edge_update_rollback" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/edge/revoke",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ workerId: z.string().min(1), reason: z.string().min(1).max(500) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid edge revocation" }, buildApiMeta(req, startedAt)); return; }
    const worker = await getEpochWorker(params.data.workspaceId, body.data.workerId);
    if (!worker) { sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Edge worker not found" }, buildApiMeta(req, startedAt)); return; }
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    const registeredCapabilities = Array.isArray(worker.capabilities) && worker.capabilities.every((value): value is string => typeof value === "string") ? worker.capabilities : [];
    const state = revokeEpochEdge(normalizeEpochEdgeState(metadata, registeredCapabilities), body.data.reason);
    await prisma.epochWorker.update({ where: { id: worker.id }, data: { status: "retired", retiredAt: new Date(), metadata: { ...metadata, edgeState: state } as any, history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "edge_revoked", at: new Date().toISOString(), reason: body.data.reason }] } });
    emitEpochRuntimeEvent({ userId: req.authUserId, orgId: req.authOrgId, workspaceId: params.data.workspaceId, kind: "epoch.edge.revoked", label: "Edge worker revoked", subjectId: worker.id, payload: { workerId: worker.id, reason: body.data.reason } });
    sendApiSuccess(res, 200, { accepted: true, workerId: worker.id, state }, buildApiMeta(req, startedAt, { intent: "epoch_edge_revoke" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/capabilities",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid capability workspace" }, buildApiMeta(req, startedAt)); return; }
    try {
      const discovery = await discoverEpochCapabilities({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() });
      sendApiSuccess(res, 200, discovery, buildApiMeta(req, startedAt, { intent: "epoch_capabilities_discovered" }));
    } catch (error) {
      const status = error instanceof CapabilityFabricError && error.code === "not_found" ? 404 : 409;
      sendApiError(res, status, { code: "CAPABILITY_DISCOVERY_FAILED", message: error instanceof Error ? error.message : "Capability discovery failed" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/capabilities/compose",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ name: z.string().min(1).max(300), description: z.string().max(2_000).optional(), requiredCapabilities: z.array(z.string().min(1).max(200)).min(1).max(100) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid capability composition request" }, buildApiMeta(req, startedAt)); return; }
    try {
      const result = await composeEpochCapability({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, body.data);
      sendApiSuccess(res, 201, result, buildApiMeta(req, startedAt, { intent: "epoch_capability_composed" }));
    } catch (error) {
      const status = error instanceof CapabilityFabricError && error.code === "not_found" ? 404 : 409;
      sendApiError(res, status, { code: "CAPABILITY_COMPOSE_FAILED", message: error instanceof Error ? error.message : "Capability composition failed" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/capability-gaps",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid capability gap request" }, buildApiMeta(req, startedAt)); return; }
    const gaps = await listEpochCapabilityGaps({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() });
    sendApiSuccess(res, 200, { gaps }, buildApiMeta(req, startedAt, { intent: "epoch_capability_gaps_list" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/capability-gaps/:gapId/plans",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), gapId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid capability plan request" }, buildApiMeta(req, startedAt)); return; }
    try {
      const plan = await createEpochCapabilityPlan({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, params.data.gapId);
      sendApiSuccess(res, 201, { plan }, buildApiMeta(req, startedAt, { intent: "epoch_capability_plan_created" }));
    } catch (error) {
      const status = error instanceof CapabilityFabricError && error.code === "not_found" ? 404 : 409;
      sendApiError(res, status, { code: "CAPABILITY_PLAN_CREATE_FAILED", message: error instanceof Error ? error.message : "Capability plan creation failed" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/capability-plans/:planId/:action",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), planId: z.string().min(1), action: z.enum(["sandbox", "verify", "promote", "rollback"]) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid capability plan action" }, buildApiMeta(req, startedAt)); return; }
    try {
      const result = await runEpochCapabilityPlan({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, params.data.planId, params.data.action);
      sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt, { intent: `epoch_capability_${params.data.action}` }));
    } catch (error) {
      const status = error instanceof CapabilityFabricError && error.code === "not_found" ? 404 : 409;
      sendApiError(res, status, { code: "CAPABILITY_PLAN_ACTION_FAILED", message: error instanceof Error ? error.message : "Capability plan action failed" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/automations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid automation workspace" }, buildApiMeta(req, startedAt)); return; }
    const automations = await listEpochAutomations({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() });
    sendApiSuccess(res, 200, { automations }, buildApiMeta(req, startedAt, { intent: "epoch_automations_list" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/automations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({
      name: z.string().min(1).max(300),
      trigger: z.object({ type: z.string().min(1).max(200), filter: z.record(z.string(), z.unknown()).optional() }),
      level: z.enum(["A0", "A1", "A2", "A3", "A4", "A5", "A6"]),
      status: z.enum(["draft", "active", "paused", "disabled"]).default("draft"),
      policyId: z.string().min(1),
      institutionId: z.string().min(1).optional(),
      verificationRequired: z.boolean().default(true),
      budgetCents: z.number().int().nonnegative().default(0),
      actions: z.array(z.object({ environment: z.enum(["software", "cloud", "simulation", "edge", "sandbox"]), name: z.string().min(1).max(300), parameters: z.record(z.string(), z.unknown()).default({}) })).min(1).max(50),
    }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid automation" }, buildApiMeta(req, startedAt)); return; }
    try {
      const result = await createEpochAutomation({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, body.data);
      sendApiSuccess(res, 201, result, buildApiMeta(req, startedAt, { intent: "epoch_automation_created" }));
    } catch (error) {
      const status = error instanceof AutomationBoundaryError && error.code.endsWith("NOT_FOUND") ? 404 : 409;
      sendApiError(res, status, { code: error instanceof AutomationBoundaryError ? error.code : "AUTOMATION_CREATE_FAILED", message: error instanceof Error ? error.message : "Automation creation failed" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/automations/:automationId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), automationId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid automation request" }, buildApiMeta(req, startedAt)); return; }
    const automation = await getEpochAutomation({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, params.data.automationId);
    if (!automation) { sendApiError(res, 404, { code: "AUTOMATION_NOT_FOUND", message: "Automation not found" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, automation, buildApiMeta(req, startedAt, { intent: "epoch_automation_get" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/automations/:automationId/trigger",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), automationId: z.string().min(1) }).safeParse(req.params);
    const body = z.object({ type: z.string().min(1).max(200), payload: z.record(z.string(), z.unknown()).default({}), requestedCents: z.number().int().nonnegative().default(0) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid automation trigger" }, buildApiMeta(req, startedAt)); return; }
    try {
      const result = await triggerEpochAutomation({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, correlationId: req.requestId ?? randomUUID(), traceId: req.requestId ?? randomUUID() }, params.data.automationId, body.data);
      sendApiSuccess(res, 202, result, buildApiMeta(req, startedAt, { intent: "epoch_automation_triggered" }));
    } catch (error) {
      const status = error instanceof AutomationBoundaryError && error.code.endsWith("NOT_FOUND") ? 404 : 409;
      sendApiError(res, status, { code: error instanceof AutomationBoundaryError ? error.code : "AUTOMATION_TRIGGER_FAILED", message: error instanceof Error ? error.message : "Automation trigger failed" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/copilot/drafts",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ id: z.string().min(1), kind: z.enum(["mission", "operations", "policy", "analytics"]), missionId: z.string().min(1).optional(), content: z.record(z.string(), z.unknown()), risk: z.enum(["low", "medium", "high"]).optional() }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid copilot draft" }, buildApiMeta(req, startedAt)); return; }
    if (body.data.missionId && !(await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } }))) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    const draft = await persistEpochCopilotDraft({ ...body.data, workspaceId: params.data.workspaceId, authorId: req.authUserId });
    sendApiSuccess(res, 201, { draft }, buildApiMeta(req, startedAt, { intent: "epoch_copilot_draft_created" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/copilot/drafts/:draftId/approve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), draftId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid copilot approval" }, buildApiMeta(req, startedAt)); return; }
    const draft = await approvePersistedEpochCopilotDraft({ workspaceId: params.data.workspaceId, id: params.data.draftId, approverId: req.authUserId });
    if (!draft) { sendApiError(res, 404, { code: "COPILOT_DRAFT_NOT_FOUND", message: "Copilot draft not found or already decided" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { draft }, buildApiMeta(req, startedAt, { intent: "epoch_copilot_draft_approved" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/marketplace/manifests",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ id: z.string().min(1), version: z.string().min(1), kind: z.enum(["worker", "integration", "mission_template", "verifier_pack", "policy", "provider_adapter"]), publisherId: z.string().min(1), compatibleApi: z.string().min(1), permissions: z.array(z.string().min(1)), contentHash: z.string().min(1), signature: z.string().regex(/^[a-f0-9]+$/i), status: z.literal("active").default("active") }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid marketplace manifest" }, buildApiMeta(req, startedAt)); return; }
    const secret = process.env.EPOCH_MARKETPLACE_SIGNING_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
    if (!secret) { sendApiError(res, 503, { code: "MARKETPLACE_SIGNING_UNAVAILABLE", message: "Marketplace signing is not configured" }, buildApiMeta(req, startedAt)); return; }
    const manifest = await persistEpochMarketplaceManifest({ workspaceId: params.data.workspaceId, manifest: body.data, secret });
    sendApiSuccess(res, 201, { manifest }, buildApiMeta(req, startedAt, { intent: "epoch_marketplace_manifest_published" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/production/interactions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ id: z.string().min(1), missionId: z.string().min(1), executionId: z.string().min(1).optional(), workerId: z.string().min(1).optional(), input: z.string().max(100_000), output: z.string().max(100_000), latencyMs: z.number().int().nonnegative(), toolFailures: z.number().int().nonnegative().default(0), retries: z.number().int().nonnegative().default(0), userFeedback: z.enum(["positive", "negative"]).optional(), turns: z.number().int().positive().default(1), abandoned: z.boolean().default(false), repeatedQuestionCount: z.number().int().nonnegative().optional(), setupStep: z.string().max(500).optional(), supportEscalated: z.boolean().default(false), conversionDropped: z.boolean().default(false), humanEdited: z.boolean().default(false), capturedAt: z.string().datetime().optional() }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid production interaction" }, buildApiMeta(req, startedAt)); return; }
    if (!(await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } }))) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    const interaction = await persistEpochProductionInteraction({ ...body.data, workspaceId: params.data.workspaceId });
    sendApiSuccess(res, 201, { interaction }, buildApiMeta(req, startedAt, { intent: "epoch_production_interaction_captured" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/production/regressions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ id: z.string().min(1), clusterId: z.string().min(1), interactionId: z.string().min(1), expected: z.string().min(1), verification: z.string().min(1) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid regression draft" }, buildApiMeta(req, startedAt)); return; }
    const interaction = await prisma.epochProductionInteraction.findFirst({ where: { id: body.data.interactionId, workspaceId: params.data.workspaceId } });
    if (!interaction) { sendApiError(res, 404, { code: "INTERACTION_NOT_FOUND", message: "Production interaction not found" }, buildApiMeta(req, startedAt)); return; }
    const draft = await persistEpochRegressionDraft({ id: body.data.id, workspaceId: params.data.workspaceId, clusterId: body.data.clusterId, interaction: { ...interaction, executionId: interaction.executionId ?? undefined, workerId: interaction.workerId ?? undefined, userFeedback: interaction.userFeedback as "positive" | "negative" | undefined, signals: interaction.signals as never, capturedAt: interaction.capturedAt.toISOString() }, expected: body.data.expected, verification: body.data.verification });
    sendApiSuccess(res, 201, { draft }, buildApiMeta(req, startedAt, { intent: "epoch_regression_draft_created" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/production/fix-proposals",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ id: z.string().min(1), clusterId: z.string().min(1), kind: z.enum(["prompt", "tool", "memory", "policy", "recovery"]), proposal: z.string().min(1).max(20_000), risk: z.enum(["low", "medium", "high"]), rollback: z.string().min(1).max(10_000) }).safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid fix proposal" }, buildApiMeta(req, startedAt)); return; }
    const cluster = await prisma.epochFailureCluster.findFirst({ where: { id: body.data.clusterId, workspaceId: params.data.workspaceId }, select: { id: true } });
    if (!cluster) { sendApiError(res, 404, { code: "FAILURE_CLUSTER_NOT_FOUND", message: "Failure cluster not found" }, buildApiMeta(req, startedAt)); return; }
    const proposal = await persistEpochFixProposal({ ...body.data, workspaceId: params.data.workspaceId, proposedBy: req.authUserId });
    sendApiSuccess(res, 201, { proposal }, buildApiMeta(req, startedAt, { intent: "epoch_fix_proposal_created" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/production/fix-proposals/:proposalId/approve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), proposalId: z.string().min(1) }).safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid fix proposal approval" }, buildApiMeta(req, startedAt)); return; }
    try {
      const proposal = await approvePersistedEpochFixProposal({ workspaceId: params.data.workspaceId, proposalId: params.data.proposalId, approverId: req.authUserId });
      if (!proposal) { sendApiError(res, 404, { code: "FIX_PROPOSAL_NOT_FOUND", message: "Draft fix proposal not found" }, buildApiMeta(req, startedAt)); return; }
      sendApiSuccess(res, 200, { proposal }, buildApiMeta(req, startedAt, { intent: "epoch_fix_proposal_approved" }));
    } catch (error) {
      if (error instanceof Error && error.message === "epoch_fix_separation_of_duties_required") { sendApiError(res, 409, { code: "SEPARATION_OF_DUTIES_REQUIRED", message: "A fix proposal must be approved by a different user" }, buildApiMeta(req, startedAt)); return; }
      throw error;
    }
  }),
);

for (const resource of ["interactions", "failures", "clusters", "root-causes", "evaluations", "replays", "fix-proposals", "reliability", "improvements"] as const) {
  epochRouter.get(
    `/workspaces/:workspaceId/production/${resource}`,
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      const query = z.object({ limit: z.coerce.number().int().positive().max(100).optional() }).safeParse(req.query);
      if (!params.success || !query.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid production intelligence request" }, buildApiMeta(req, startedAt)); return; }
      const intelligence = await listEpochProductionIntelligence({ workspaceId: params.data.workspaceId, limit: query.data.limit });
      const key = resource === "root-causes" ? "rootCauses" : resource === "fix-proposals" ? "fixes" : resource;
      sendApiSuccess(res, 200, { [key]: intelligence[key as keyof typeof intelligence] }, buildApiMeta(req, startedAt, { intent: `epoch_production_list_${resource}` }));
    }),
  );
}

epochRouter.get(
  "/workspaces/:workspaceId/governance",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const governance = await getEpochV13Governance({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        correlationId: req.requestId ?? randomUUID(),
        traceId: req.requestId ?? randomUUID(),
      });
      sendApiSuccess(res, 200, governance, buildApiMeta(req, startedAt, { intent: "epoch_v13_get_governance" }));
    } catch (error) {
      if (error instanceof GovernanceBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/governance/policies",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochAuthorityPolicyListQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid governance policy request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const policies = await listEpochV13Policies(
        {
          workspaceId: params.data.workspaceId,
          userId: req.authUserId,
          orgId: req.authOrgId,
          correlationId: req.requestId ?? randomUUID(),
          traceId: req.requestId ?? randomUUID(),
        },
        { missionId: query.data.missionId, institutionId: query.data.institutionId },
      );
      sendApiSuccess(res, 200, { policies }, buildApiMeta(req, startedAt, { intent: "epoch_v13_list_governance_policies" }));
    } catch (error) {
      if (error instanceof GovernanceBoundaryError) {
        sendApiError(res, 409, { code: "CONTROL_PLANE_BOUNDARY_REQUIRED", message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/enterprise/authorize",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ role: z.enum(["owner", "admin", "operator", "reviewer", "worker", "viewer"]), action: z.enum(["mission.create", "mission.execute", "mission.verify", "evidence.read", "evidence.export", "worker.manage", "policy.manage", "audit.export", "billing.manage"]), subjectWorkspaceId: z.string().min(1), subjectProjectId: z.string().optional(), requestProjectId: z.string().optional() }).safeParse(req.body);
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid enterprise authorization request" }, buildApiMeta(req, startedAt)); return; }
    const decision = authorizeEpochEnterpriseAction({ ...body.data, requestWorkspaceId: params.data.workspaceId });
    sendApiSuccess(res, 200, { decision }, buildApiMeta(req, startedAt, { intent: "epoch_enterprise_authorize" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/enterprise/budget-check",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = z.object({ budgetCents: z.number().int().nonnegative(), spentCents: z.number().int().nonnegative(), requestedCents: z.number().int() }).safeParse(req.body);
    if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid budget request" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { decision: governEpochBudget(body.data) }, buildApiMeta(req, startedAt, { intent: "epoch_enterprise_budget_check" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/enterprise/residency-check",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = z.object({ workspaceRegion: z.string().min(1), requestedRegion: z.string().min(1), allowedRegions: z.array(z.string().min(1)) }).safeParse(req.body);
    if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid residency request" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { decision: authorizeEpochResidency(body.data) }, buildApiMeta(req, startedAt, { intent: "epoch_enterprise_residency_check" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/enterprise/key-descriptor",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({ purpose: z.enum(["tenant_data", "audit_export", "webhook"]), version: z.coerce.number().int().positive().optional() }).safeParse(req.query);
    if (!params.success || !query.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid key descriptor request" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { descriptor: deriveEpochKeyDescriptor({ workspaceId: params.data.workspaceId, ...query.data }) }, buildApiMeta(req, startedAt, { intent: "epoch_enterprise_key_descriptor" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/workers/:workerId/evaluations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    const query = EpochWorkerEvaluationListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workerId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await getEpochWorker(params.data.workspaceId, params.data.workerId);
    if (!worker) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const evaluations = await listEpochWorkerEvaluations({ workspaceId: params.data.workspaceId, workerId: params.data.workerId, limit: query.success ? query.data.limit : undefined });
    sendApiSuccess(res, 200, { evaluations }, buildApiMeta(req, startedAt, { intent: "epoch_list_worker_evaluations" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/workers/:workerId/evaluations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), workerId: z.string().min(1) }).safeParse(req.params);
    const body = EpochWorkerEvaluationSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid worker evaluation" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const evaluation = await recordEpochWorkerEvaluation({ workspaceId: params.data.workspaceId, workerId: params.data.workerId, ...body.data });
    if (!evaluation) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 201, { evaluation }, buildApiMeta(req, startedAt, { intent: "epoch_record_worker_evaluation" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/recovery-escalations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({ missionId: z.string().min(1).optional() }).safeParse(req.query);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const escalations = await listEpochRecoveryEscalations(params.data.workspaceId, query.success ? query.data.missionId : undefined);
    sendApiSuccess(res, 200, { escalations }, buildApiMeta(req, startedAt, { intent: "epoch_list_recovery_escalations" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/recovery-escalations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochRecoveryEscalationSchema.safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid recovery escalation" }, buildApiMeta(req, startedAt)); return; }
    const escalation = await createEpochRecoveryEscalation({ workspaceId: params.data.workspaceId, missionId: params.data.missionId, ...body.data });
    if (!escalation) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 201, { escalation }, buildApiMeta(req, startedAt, { intent: "epoch_create_recovery_escalation" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/recovery-escalations/:escalationId/resolve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), escalationId: z.string().min(1) }).safeParse(req.params);
    const body = EpochRecoveryEscalationResolveSchema.safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid escalation resolution" }, buildApiMeta(req, startedAt)); return; }
    const result = await resolveEpochRecoveryEscalation({ workspaceId: params.data.workspaceId, escalationId: params.data.escalationId, resolvedBy: req.authUserId, resolution: body.data.resolution });
    if (result.count === 0) { sendApiError(res, 404, { code: "ESCALATION_NOT_FOUND", message: "Open escalation not found" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { resolved: true }, buildApiMeta(req, startedAt, { intent: "epoch_resolve_recovery_escalation" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/tool-policy/evaluate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = z.object({ tool: z.string().min(1), permissions: z.array(z.string()), approvalGranted: z.boolean().optional(), blockedTools: z.array(z.string()).optional() }).safeParse(req.body);
    if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid tool policy request" }, buildApiMeta(req, startedAt)); return; }
    const decision = decideEpochToolCall(body.data);
    sendApiSuccess(res, 200, { decision }, buildApiMeta(req, startedAt, { intent: "epoch_evaluate_tool_policy" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/settlement",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const settlement = await getEpochMissionSettlement(params.data.workspaceId, params.data.missionId);
    if (!settlement) { sendApiError(res, 404, { code: "SETTLEMENT_NOT_FOUND", message: "Mission settlement not found" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { settlement }, buildApiMeta(req, startedAt, { intent: "epoch_get_settlement" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/settlement",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochSettlementSchema.safeParse(req.body);
    if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid settlement request" }, buildApiMeta(req, startedAt)); return; }
    const settlement = await settleEpochMission({ workspaceId: params.data.workspaceId, missionId: params.data.missionId, ...body.data });
    if (!settlement) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    sendApiSuccess(res, 200, { settlement }, buildApiMeta(req, startedAt, { intent: "epoch_settle_mission" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/queue/status",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const status = await getEpochQueueStatus(params.data.workspaceId);
    sendApiSuccess(res, 200, { status }, buildApiMeta(req, startedAt, { intent: "epoch_queue_status" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/queue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochQueueListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const page = await listEpochQueueJobsPage({
      workspaceId: params.data.workspaceId,
      limit: query.success ? query.data.limit : undefined,
      cursor: query.success ? query.data.cursor : undefined,
      status: query.success ? query.data.status : undefined,
      type: query.success ? query.data.type : undefined,
    });
    sendApiSuccess(
      res,
      200,
      {
        jobs: page.jobs,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_queue" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/queue/enqueue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochQueueEnqueueSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid queue payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const job = await enqueueEpochJob({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      institutionId: body.data.institutionId,
      missionId: body.data.missionId,
      type: body.data.type,
      payload: body.data.payload,
    });
    sendApiSuccess(res, 201, { job }, buildApiMeta(req, startedAt, { intent: "epoch_queue_enqueue" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/queue/lease",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochQueueLeaseSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid lease payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    if (body.data.workerId) {
      const result = await leaseEpochJobsForWorker({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        workerId: body.data.workerId,
        missionId: body.data.missionId,
        limit: body.data.limit,
        leaseMs: body.data.leaseMs,
      });
      if (result.reason && result.jobs.length === 0) {
        sendApiError(res, 409, { code: "WORKER_NOT_LEASABLE", message: result.reason }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt, { intent: "epoch_queue_worker_lease" }));
      return;
    }
    const jobs = await leaseEpochJobs({
      workspaceId: params.data.workspaceId,
      userId: req.authUserId,
      orgId: req.authOrgId,
      workerId: req.authUserId,
      limit: body.data.limit,
    });
    sendApiSuccess(res, 200, { jobs }, buildApiMeta(req, startedAt, { intent: "epoch_queue_lease" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/queue/:jobId/ack",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), jobId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "jobId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const completion = EpochWorkerCompletionSchema.safeParse(req.body);
    if (completion.success) {
      const result = await completeEpochWorkerLease({
        workspaceId: params.data.workspaceId,
        jobId: params.data.jobId,
        workerId: completion.data.workerId,
        fencingToken: completion.data.fencingToken,
      });
      if (!result.accepted) {
        sendApiError(res, 409, { code: "STALE_WORKER_LEASE", message: result.reason ?? "Worker lease is not valid" }, buildApiMeta(req, startedAt));
        return;
      }
    }

    const job = await acknowledgeEpochJob(params.data.jobId, req.authUserId, req.authOrgId);
    if (!job) {
      sendApiError(res, 404, { code: "JOB_NOT_FOUND", message: "Queue job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_queue_ack" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/queue/:jobId/fail",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), jobId: z.string().min(1) }).safeParse(req.params);
    const body = EpochQueueFailSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid failure payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const job = await failEpochJob(params.data.jobId, body.data.error, req.authUserId, req.authOrgId);
    if (!job) {
      sendApiError(res, 404, { code: "JOB_NOT_FOUND", message: "Queue job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_queue_fail" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/queue/:jobId/dead-letter",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), jobId: z.string().min(1) }).safeParse(req.params);
    const body = EpochQueueFailSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid dead-letter payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const job = await deadLetterEpochJob(params.data.jobId, body.data.error, {
      userId: req.authUserId,
      orgId: req.authOrgId,
    });
    if (!job) {
      sendApiError(res, 404, { code: "JOB_NOT_FOUND", message: "Queue job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_queue_dead_letter" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/queue/:jobId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochQueueJobParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and jobId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const job = await getEpochQueueJobForWorkspace(params.data.workspaceId, params.data.jobId);
    if (!job) {
      sendApiError(res, 404, { code: "JOB_NOT_FOUND", message: "Queue job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_get_queue_job" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/queue/dead-letter",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const jobs = await listEpochDeadLetters(params.data.workspaceId);
    sendApiSuccess(res, 200, { jobs }, buildApiMeta(req, startedAt, { intent: "epoch_list_dead_letters" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/queue/dead-letter/:jobId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), jobId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and jobId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const jobs = await listEpochDeadLetters(params.data.workspaceId);
    const job = jobs.find((item) => item.id === params.data.jobId) ?? null;
    if (!job) {
      sendApiError(res, 404, { code: "JOB_NOT_FOUND", message: "Dead-letter job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_get_dead_letter" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/queue/dead-letter/:jobId/requeue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), jobId: z.string().min(1) }).safeParse(req.params);
    const body = EpochQueueRecoverySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid recovery payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const job = await retryDeadLetterEpochJob(params.data.jobId, {
      userId: req.authUserId,
      orgId: req.authOrgId,
      delayMs: body.data.delayMs,
    });
    if (!job) {
      sendApiError(res, 404, { code: "JOB_NOT_FOUND", message: "Dead-letter job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(
      res,
      200,
      {
        job,
        recovery: {
          reason: body.data.reason ?? null,
          notes: body.data.notes ?? null,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_requeue_dead_letter" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/queue/:jobId/retry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), jobId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "jobId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const job = await retryDeadLetterEpochJob(params.data.jobId, {
      userId: req.authUserId,
      orgId: req.authOrgId,
    });
    if (!job) {
      sendApiError(res, 404, { code: "JOB_NOT_FOUND", message: "Dead-letter job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_retry_dead_letter" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/artifacts",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochArtifactListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const artifacts = await listEpochArtifacts({
      workspaceId: params.data.workspaceId,
      institutionId: query.success ? query.data.institutionId : undefined,
      missionId: query.success ? query.data.missionId : undefined,
      category: query.success ? query.data.category : undefined,
    });
    sendApiSuccess(res, 200, { artifacts }, buildApiMeta(req, startedAt, { intent: "epoch_list_artifacts" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/artifacts",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochArtifactSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid artifact payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const artifact = await saveEpochArtifact({
      workspaceId: params.data.workspaceId,
      institutionId: body.data.institutionId,
      missionId: body.data.missionId,
      category: body.data.category,
      name: body.data.name,
      mimeType: body.data.mimeType,
      url: body.data.url,
      filePath: body.data.filePath,
      summary: body.data.summary,
      expiresAt: body.data.expiresAt,
      payload: body.data.payload,
      proof: body.data.proof,
    });
    sendApiSuccess(res, 201, { artifact }, buildApiMeta(req, startedAt, { intent: "epoch_save_artifact" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/artifacts/:artifactId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochArtifactParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and artifactId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const artifact = await getEpochArtifactById({
      workspaceId: params.data.workspaceId,
      artifactId: params.data.artifactId,
    });
    if (!artifact) {
      sendApiError(res, 404, { code: "ARTIFACT_NOT_FOUND", message: "Artifact not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { artifact }, buildApiMeta(req, startedAt, { intent: "epoch_get_artifact" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/artifacts/:artifactId/access-token",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochArtifactParamsSchema.safeParse(req.params);
    const query = EpochArtifactAccessTokenQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid artifact access-token request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const artifact = await getEpochArtifactById({ workspaceId: params.data.workspaceId, artifactId: params.data.artifactId });
    if (!artifact) {
      sendApiError(res, 404, { code: "ARTIFACT_NOT_FOUND", message: "Artifact not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const secret = process.env.EPOCH_ARTIFACT_SIGNING_SECRET ?? process.env.AUTH_SECRET ?? "";
    try {
      const access = issueEpochArtifactAccessToken({ workspaceId: params.data.workspaceId, artifactId: artifact.id, secret, ttlSeconds: query.data.ttlSeconds });
      sendApiSuccess(res, 200, access, buildApiMeta(req, startedAt, { intent: "epoch_issue_artifact_access_token" }));
    } catch {
      sendApiError(res, 503, { code: "ARTIFACT_SIGNING_UNAVAILABLE", message: "Artifact signing is not configured" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/artifacts/:artifactId/download",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochArtifactParamsSchema.safeParse(req.params);
    const query = EpochArtifactAccessTokenQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and artifactId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    if (query.success && query.data.accessToken) {
      const secret = process.env.EPOCH_ARTIFACT_SIGNING_SECRET ?? process.env.AUTH_SECRET ?? "";
      const access = verifyEpochArtifactAccessToken({
        token: query.data.accessToken,
        workspaceId: params.data.workspaceId,
        artifactId: params.data.artifactId,
        secret,
      });
      if (!access.valid) {
        sendApiError(res, 403, { code: "INVALID_ARTIFACT_ACCESS_TOKEN", message: access.reason ?? "Invalid artifact access token" }, buildApiMeta(req, startedAt));
        return;
      }
    }

    const artifact = await getEpochArtifactById({
      workspaceId: params.data.workspaceId,
      artifactId: params.data.artifactId,
    });
    if (!artifact) {
      sendApiError(res, 404, { code: "ARTIFACT_NOT_FOUND", message: "Artifact not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const download = {
      artifact,
      exportedAt: new Date().toISOString(),
    };
    const filename = `${artifact.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}.json`;
    res.status(200);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(download, null, 2));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/audit",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochEventQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const [auditLogs, runtimeEvents, deadLetters] = await Promise.all([
      listAuditLogs({
        userId: req.authUserId,
        orgId: req.authOrgId,
        workspaceId: params.data.workspaceId,
        limit: query.success ? query.data.limit : undefined,
      }),
      listEpochRuntimeEvents({
        userId: req.authUserId,
        workspaceId: params.data.workspaceId,
        limit: query.success ? query.data.limit : undefined,
      }),
      listEpochDeadLetters(params.data.workspaceId),
    ]);
    sendApiSuccess(
      res,
      200,
      { auditLogs, runtimeEvents, deadLetters },
      buildApiMeta(req, startedAt, { intent: "epoch_audit_trail" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/audit/export",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochAuditExportSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid audit export payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const limit = body.data.limit ?? 100;
    const [snapshot, auditLogs, runtimeEvents, deadLetters] = await Promise.all([
      buildEpochMissionControlSnapshot(params.data.workspaceId),
      listAuditLogs({
        userId: req.authUserId,
        orgId: req.authOrgId,
        workspaceId: params.data.workspaceId,
        limit,
      }),
      listEpochRuntimeEvents({
        userId: req.authUserId,
        workspaceId: params.data.workspaceId,
        limit,
      }),
      listEpochDeadLetters(params.data.workspaceId),
    ]);

    const auditExport = {
      workspaceId: params.data.workspaceId,
      generatedAt: new Date().toISOString(),
      snapshot,
      summary: {
        auditLogs: auditLogs.length,
        runtimeEvents: runtimeEvents.length,
        deadLetters: deadLetters.length,
      },
      auditLogs,
      runtimeEvents,
      deadLetters,
    };
    const artifactName = body.data.name ?? `audit-export-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const artifact = await saveEpochArtifact({
      workspaceId: params.data.workspaceId,
      category: "audit_trail",
      name: artifactName,
      summary: `Audit export for ${params.data.workspaceId}`,
      payload: auditExport,
      proof: {
        exportedAt: auditExport.generatedAt,
        source: "audit",
        limit,
      },
    });

    sendApiSuccess(
      res,
      201,
      { auditExport, artifact },
      buildApiMeta(req, startedAt, { intent: "epoch_audit_export" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/developer/smoke/run",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochSmokeRunSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid smoke payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const institutionName = body.data.institutionName ?? "Epoch Smoke Institution";
    const missionTitle = body.data.missionTitle ?? "Epoch Smoke Mission";
    const objective = body.data.objective ?? "Prove the Epoch institution runtime end-to-end.";
    const reuseExisting = body.data.reuseExisting ?? true;

    let institution = await prisma.epochInstitution.findFirst({
      where: { workspaceId: params.data.workspaceId, name: institutionName },
      include: { missions: { where: { title: missionTitle }, orderBy: { updatedAt: "desc" }, take: 1 } },
    });
    let institutionCreated = false;
    if (!institution) {
      const createdInstitution = await createEpochInstitution({
        workspaceId: params.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        name: institutionName,
        category: "smoke",
        version: "1.0.0",
        summary: "Smoke institution for proving the Epoch runtime.",
        metadata: { smoke: true, source: "epoch_smoke" },
        proof: { smoke: true, source: "epoch_smoke" },
      });
      institutionCreated = true;
      institution = await prisma.epochInstitution.findFirst({
        where: { id: createdInstitution.id, workspaceId: params.data.workspaceId },
        include: { missions: { where: { title: missionTitle }, orderBy: { updatedAt: "desc" }, take: 1 } },
      });
    }
    if (!institution) {
      sendApiError(res, 500, { code: "SMOKE_SETUP_FAILED", message: "Unable to prepare smoke institution" }, buildApiMeta(req, startedAt));
      return;
    }

    let mission = institution.missions?.[0] ?? null;
    let missionCreated = false;
    if (!mission || !reuseExisting) {
      mission = await createEpochMission({
        workspaceId: params.data.workspaceId,
        institutionId: institution.id,
        userId: req.authUserId,
        orgId: req.authOrgId,
        title: missionTitle,
        objective,
        plan: [
          "Create the institution runtime",
          "Run execution",
          "Collect evidence",
          "Verify the result",
          "Issue a certificate",
          "Record memory",
        ],
        authority: {
          name: "Smoke execution policy",
          canExecute: true,
          needsApproval: false,
          blocked: false,
          approvals: ["smoke"],
          checks: ["authority", "execution", "verification", "certificate"],
          proof: { smoke: true, source: "epoch_smoke" },
        },
        proof: { smoke: true, source: "epoch_smoke" },
      });
      missionCreated = true;
    }

    if (!mission) {
      sendApiError(res, 500, { code: "SMOKE_SETUP_FAILED", message: "Unable to prepare smoke mission" }, buildApiMeta(req, startedAt));
      return;
    }

    const result = await runEpochMission({
      workspaceId: params.data.workspaceId,
      missionId: mission.id,
      userId: req.authUserId,
      orgId: req.authOrgId,
      checklist: [
        "Institution created",
        "Authority granted",
        "Execution completed",
        "Verification passed",
        "Certificate issued",
      ],
      humanApproval: "approved",
      confidence: 100,
      output: {
        smoke: true,
        workspaceId: params.data.workspaceId,
        institutionId: institution.id,
        missionId: mission.id,
      },
      approvals: ["smoke"],
      notes: "Epoch smoke workflow run from developer backend endpoint.",
    });

    if (!result) {
      sendApiError(res, 500, { code: "SMOKE_RUN_FAILED", message: "Epoch smoke run failed" }, buildApiMeta(req, startedAt));
      return;
    }

    if ("blocked" in result || "approvalRequired" in result) {
      sendApiError(
        res,
        409,
        {
          code: "SMOKE_GATED",
          message: result.reason === "blocked_by_policy" ? "Smoke mission blocked by policy" : "Smoke mission needs approval",
          details: result,
        },
        buildApiMeta(req, startedAt, { intent: "epoch_smoke_run" }),
      );
      return;
    }

    sendApiSuccess(
      res,
      201,
      {
        smoke: {
          workspaceId: params.data.workspaceId,
          institutionCreated,
          missionCreated,
          institutionId: institution.id,
          missionId: mission.id,
          result,
          proofChain: {
            mission: mission.id,
            execution: (result as { execution?: { id: string } | null }).execution?.id ?? null,
            verification: (result as { verification?: { id: string } | null }).verification?.id ?? null,
            certificate: (result as { certificate?: { id: string } | null }).certificate?.id ?? null,
            memoryRecord: (result as { memoryRecord?: { id: string } | null }).memoryRecord?.id ?? null,
          },
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_smoke_run" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/smoke/history",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochSmokeHistoryQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const page = await listEpochSmokeRuns({
      workspaceId: params.data.workspaceId,
      missionTitle: query.success ? query.data.missionTitle : undefined,
      limit: query.success ? query.data.limit : undefined,
      cursor: query.success ? query.data.cursor : undefined,
    });

    sendApiSuccess(
      res,
      200,
      {
        smokeRuns: page.smokeRuns.map((mission) => ({
          missionId: mission.id,
          institutionId: mission.institutionId,
          title: mission.title,
          objective: mission.objective,
          state: mission.state,
          currentStep: mission.currentStep,
          startedAt: mission.startedAt?.toISOString() ?? null,
          completedAt: mission.completedAt?.toISOString() ?? null,
          verificationDecision: mission.verificationRun?.finalDecision ?? null,
          certificateId: mission.certificate?.id ?? null,
          memoryRecordId: mission.memoryRecord?.id ?? null,
          updatedAt: mission.updatedAt.toISOString(),
        })),
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_smoke_history" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/runtime-api-keys",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const apiKeys = await prisma.agentAccessKey.findMany({
      where: { workspaceId: params.data.workspaceId },
      orderBy: { updatedAt: "desc" },
    });
    sendApiSuccess(res, 200, { apiKeys }, buildApiMeta(req, startedAt, { intent: "epoch_list_api_keys" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/api-keys",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const runtimeApiKeys = (await listApiKeysForUser(req.authUserId))
      .filter((key) => key.contentTag === "epoch-runtime" || key.endpoints.includes("epoch_runtime"))
      .map(serializeApiKeyForClient);
    sendApiSuccess(res, 200, { runtimeApiKeys }, buildApiMeta(req, startedAt, { intent: "epoch_list_runtime_api_keys" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/developer/runtime-api-keys",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const body = req.body as Record<string, unknown> | undefined;
    const name = typeof body?.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "epoch-runtime-key";
    const creditLimit =
      typeof body?.creditLimit === "number" && Number.isFinite(body.creditLimit)
        ? Math.max(0, Math.trunc(body.creditLimit))
        : typeof body?.creditLimit === "string" && body.creditLimit.trim().length > 0 && Number.isFinite(Number(body.creditLimit))
          ? Math.max(0, Math.trunc(Number(body.creditLimit)))
          : null;
    const resetLimitEvery =
      typeof body?.resetLimitEvery === "string" && body.resetLimitEvery.trim().length > 0
        ? body.resetLimitEvery.trim()
        : null;
    const expires =
      typeof body?.expires === "string" && body.expires.trim().length > 0
        ? body.expires.trim()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const result = await createApiKeyForUser({
      userId: req.authUserId,
      name,
        expires,
        mode: "scoped",
        endpoints: ["epoch_runtime"],
        contentTag: "epoch-runtime",
        creditLimit,
        resetLimitEvery,
      });

    sendApiSuccess(res, 201, {
      token: result.token,
      key: serializeApiKeyForClient(result.key),
      setup: {
        baseUrl: process.env.PUBLIC_BACKEND_URL ?? process.env.MEMORYOS_PUBLIC_APP_URL ?? "http://localhost:3012",
        endpoints: ["epoch_runtime"],
      },
    }, buildApiMeta(req, startedAt, { intent: "epoch_create_runtime_api_key" }));
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/developer/runtime-api-keys/:keyId/revoke",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      keyId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and keyId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const revoked = await revokeApiKeyForUser(req.authUserId, params.data.keyId);
    if (!revoked) {
      sendApiError(res, 404, { code: "API_KEY_NOT_FOUND", message: "API key not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(res, 200, { key: serializeApiKeyForClient(revoked) }, buildApiMeta(req, startedAt, { intent: "epoch_revoke_runtime_api_key" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/webhooks",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { workspaceId: params.data.workspaceId },
      orderBy: { updatedAt: "desc" },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
    sendApiSuccess(
      res,
      200,
      { webhooks: webhooks.map(({ secret, ...webhook }) => webhook) },
      buildApiMeta(req, startedAt, { intent: "epoch_list_webhooks" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/developer/webhooks",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({
      url: z.string().url().max(2000),
      events: z.array(z.string().min(1).max(120)).max(40),
      status: z.string().min(1).max(40).optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid webhook payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        workspaceId: params.data.workspaceId,
        url: body.data.url,
        events: body.data.events,
        status: body.data.status ?? "active",
        proof: {
          createdBy: req.authUserId,
          createdAt: new Date().toISOString(),
          source: "mission-control",
        },
      },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const { secret, ...safeWebhook } = webhook;
    sendApiSuccess(res, 201, { webhook: safeWebhook }, buildApiMeta(req, startedAt, { intent: "epoch_create_webhook" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/webhooks/events",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      cursor: z.string().min(1).max(400).optional(),
      endpointId: z.string().min(1).optional(),
    }).safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const page = await listEpochWebhookEvents({
      workspaceId: params.data.workspaceId,
      endpointId: query.success ? query.data.endpointId : undefined,
      limit: query.success ? query.data.limit : undefined,
      cursor: query.success ? query.data.cursor : undefined,
    });

    sendApiSuccess(
      res,
      200,
      {
        workspaceId: params.data.workspaceId,
        events: page.events,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_webhook_events" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/webhooks/deliveries",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      cursor: z.string().min(1).max(400).optional(),
      endpointId: z.string().min(1).optional(),
    }).safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const page = await listEpochWebhookDeliveriesPage({
      workspaceId: params.data.workspaceId,
      endpointId: query.success ? query.data.endpointId : undefined,
      limit: query.success ? query.data.limit : undefined,
      cursor: query.success ? query.data.cursor : undefined,
    });

    sendApiSuccess(
      res,
      200,
      {
        workspaceId: params.data.workspaceId,
        deliveries: page.deliveries,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_webhook_deliveries_workspace" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/webhooks/retry-queue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      cursor: z.string().min(1).max(400).optional(),
      endpointId: z.string().min(1).optional(),
    }).safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const page = await listEpochWebhookRetryQueue({
      workspaceId: params.data.workspaceId,
      endpointId: query.success ? query.data.endpointId : undefined,
      limit: query.success ? query.data.limit : undefined,
      cursor: query.success ? query.data.cursor : undefined,
    });

    sendApiSuccess(
      res,
      200,
      {
        workspaceId: params.data.workspaceId,
        retryQueue: page.items,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_webhook_retry_queue" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/webhooks/:webhookId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      webhookId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and webhookId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: params.data.webhookId, workspaceId: params.data.workspaceId },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
    if (!webhook) {
      sendApiError(res, 404, { code: "WEBHOOK_NOT_FOUND", message: "Webhook not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const { secret, ...safeWebhook } = webhook;
    sendApiSuccess(
      res,
      200,
      { webhook: safeWebhook },
      buildApiMeta(req, startedAt, { intent: "epoch_get_webhook" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/developer/webhooks/:webhookId/test",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      webhookId: z.string().min(1),
    }).safeParse(req.params);
    const body = z.object({
      label: z.string().min(1).max(200).optional(),
      eventType: z.string().min(1).max(120).optional(),
      subjectId: z.string().min(1).max(200).optional(),
      payload: z.record(z.string(), z.unknown()).optional(),
      occurredAt: z.string().min(1).optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid webhook test payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const delivery = await testEpochWebhookEndpoint({
      workspaceId: params.data.workspaceId,
      webhookId: params.data.webhookId,
      label: body.data.label,
      eventType: body.data.eventType,
      subjectId: body.data.subjectId,
      payload: body.data.payload,
      occurredAt: body.data.occurredAt,
    });
    if (!delivery) {
      sendApiError(res, 404, { code: "WEBHOOK_NOT_FOUND", message: "Webhook not found" }, buildApiMeta(req, startedAt));
      return;
    }

    sendApiSuccess(
      res,
      201,
      { delivery },
      buildApiMeta(req, startedAt, { intent: "epoch_test_webhook" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/developer/webhooks/:webhookId/retry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      webhookId: z.string().min(1),
    }).safeParse(req.params);
    const body = z.object({
      deliveryId: z.string().min(1).optional(),
    }).safeParse(req.body ?? {});
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid webhook retry payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const deliveryId = body.data.deliveryId
      ? body.data.deliveryId
      : (
          await prisma.webhookDelivery.findFirst({
            where: {
              workspaceId: params.data.workspaceId,
              endpointId: params.data.webhookId,
              status: { in: ["pending", "retrying", "dead_lettered"] },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { id: true },
          })
        )?.id;

    if (!deliveryId) {
      sendApiError(res, 404, { code: "WEBHOOK_DELIVERY_NOT_FOUND", message: "Webhook delivery not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const delivery = await retryEpochWebhookDelivery({
      workspaceId: params.data.workspaceId,
      deliveryId,
    });
    if (!delivery || delivery.endpointId !== params.data.webhookId) {
      sendApiError(res, 404, { code: "WEBHOOK_DELIVERY_NOT_FOUND", message: "Webhook delivery not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { delivery }, buildApiMeta(req, startedAt, { intent: "epoch_retry_webhook_endpoint_delivery" }));
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/webhooks/:webhookId/deliveries",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      webhookId: z.string().min(1),
    }).safeParse(req.params);
    const query = EpochWebhookDeliveryListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and webhookId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: params.data.webhookId, workspaceId: params.data.workspaceId },
    });
    if (!webhook) {
      sendApiError(res, 404, { code: "WEBHOOK_NOT_FOUND", message: "Webhook not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const page = await listEpochWebhookDeliveriesPage({
      workspaceId: params.data.workspaceId,
      endpointId: webhook.id,
      limit: query.success ? query.data.limit : undefined,
      cursor: query.success ? query.data.cursor : undefined,
      status: query.success ? query.data.status : undefined,
    });
    sendApiSuccess(
      res,
      200,
      {
        webhookId: webhook.id,
        deliveries: page.deliveries,
        page: {
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          total: page.total,
        },
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_webhook_deliveries" }),
    );
  }),
);

epochRouter.get(
  "/workspaces/:workspaceId/developer/webhooks/:webhookId/deliveries/:deliveryId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      webhookId: z.string().min(1),
      deliveryId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId, webhookId, and deliveryId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id: params.data.webhookId, workspaceId: params.data.workspaceId },
    });
    if (!webhook) {
      sendApiError(res, 404, { code: "WEBHOOK_NOT_FOUND", message: "Webhook not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const delivery = await getEpochWebhookDelivery({
      workspaceId: params.data.workspaceId,
      deliveryId: params.data.deliveryId,
    });
    if (!delivery || delivery.endpointId !== webhook.id) {
      sendApiError(res, 404, { code: "WEBHOOK_DELIVERY_NOT_FOUND", message: "Webhook delivery not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(
      res,
      200,
      { webhookId: webhook.id, delivery },
      buildApiMeta(req, startedAt, { intent: "epoch_get_webhook_delivery" }),
    );
  }),
);

epochRouter.post(
  "/workspaces/:workspaceId/developer/webhooks/:webhookId/deliveries/:deliveryId/retry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      webhookId: z.string().min(1),
      deliveryId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId, webhookId, and deliveryId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const delivery = await retryEpochWebhookDelivery({
      workspaceId: params.data.workspaceId,
      deliveryId: params.data.deliveryId,
    });
    if (!delivery || delivery.endpointId !== params.data.webhookId) {
      sendApiError(res, 404, { code: "WEBHOOK_DELIVERY_NOT_FOUND", message: "Webhook delivery not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { delivery }, buildApiMeta(req, startedAt, { intent: "epoch_retry_webhook_delivery" }));
  }),
);

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
      return;
    }
      const mcpConnections = await prisma.mCPConnection.findMany({
        where: { workspaceId: params.data.workspaceId },
        orderBy: { updatedAt: "desc" },
      });
      sendApiSuccess(res, 200, { mcpConnections }, buildApiMeta(req, startedAt, { intent: "epoch_list_mcp_connections" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/developer/mcp",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      const body = z.object({
        name: z.string().trim().min(1).max(120),
        uri: z.string().trim().url().max(500),
        capabilities: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
        resources: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
        policies: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
      }).safeParse(req.body);
      if (!params.success || !body.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "MCP name and a valid URI are required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const mcpConnection = await prisma.mCPConnection.create({
        data: {
          workspaceId: params.data.workspaceId,
          name: body.data.name,
          client: "external-mcp",
          status: "disconnected",
          config: {
            uri: body.data.uri,
            capabilities: body.data.capabilities ?? [],
            resources: body.data.resources ?? [],
            policies: body.data.policies ?? [],
          },
          proof: { source: "mission-control", registeredBy: req.authUserId ?? null },
        },
      });
      sendApiSuccess(res, 201, { mcpConnection }, buildApiMeta(req, startedAt, { intent: "epoch_register_mcp_connection" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/developer/mcp/:connectionId/connect",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = z.object({ workspaceId: z.string().min(1), connectionId: z.string().min(1) }).safeParse(req.params);
      const body = z.object({ token: z.string().max(4000).optional() }).safeParse(req.body ?? {});
      if (!params.success || !body.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid MCP connection request" }, buildApiMeta(req, startedAt));
        return;
      }
      const connection = await prisma.mCPConnection.findFirst({ where: { id: params.data.connectionId, workspaceId: params.data.workspaceId } });
      if (!connection) {
        sendApiError(res, 404, { code: "MCP_CONNECTION_NOT_FOUND", message: "MCP connection not found" }, buildApiMeta(req, startedAt));
        return;
      }
      const config = connection.config && typeof connection.config === "object" && !Array.isArray(connection.config) ? connection.config as Record<string, unknown> : {};
      const uri = typeof config.uri === "string" ? config.uri : "";
      let parsedUri: URL;
      try { parsedUri = new URL(uri); } catch {
        sendApiError(res, 400, { code: "MCP_URI_INVALID", message: "MCP URI must be a valid HTTP or HTTPS URL" }, buildApiMeta(req, startedAt));
        return;
      }
      if (parsedUri.protocol !== "http:" && parsedUri.protocol !== "https:") {
        sendApiError(res, 400, { code: "MCP_TRANSPORT_UNSUPPORTED", message: "Only HTTP MCP endpoints can be connected from Mission Control" }, buildApiMeta(req, startedAt));
        return;
      }
      const headers: Record<string, string> = { accept: "application/json, text/event-stream", "content-type": "application/json" };
      if (body.data.token) headers.authorization = `Bearer ${body.data.token}`;
      const rpc = { jsonrpc: "2.0", id: `epoch-${Date.now()}`, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "epoch-mission-control", version: "0.1.0" } } };
      const parseMcpResponse = (text: string): Record<string, unknown> | null => {
        try { return JSON.parse(text) as Record<string, unknown>; } catch { /* Streamable HTTP/SSE may wrap JSON in data lines. */ }
        const data = text.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).filter(Boolean).pop();
        if (!data) return null;
        try { return JSON.parse(data) as Record<string, unknown>; } catch { return null; }
      };
      try {
        const response = await fetch(parsedUri, { method: "POST", headers, body: JSON.stringify(rpc), signal: AbortSignal.timeout(10000) });
        const text = await response.text();
        if (!response.ok) throw new Error(`MCP endpoint returned HTTP ${response.status}`);
        const payload = parseMcpResponse(text);
        if (!payload || payload.error || !payload.result) throw new Error("MCP initialize response was invalid");
        const result = payload.result as Record<string, unknown>;
        const sessionId = response.headers.get("mcp-session-id");
        const sessionHeaders = sessionId ? { ...headers, "mcp-session-id": sessionId } : headers;
        const toolsResponse = await fetch(parsedUri, { method: "POST", headers: sessionHeaders, body: JSON.stringify({ jsonrpc: "2.0", id: `epoch-tools-${Date.now()}`, method: "tools/list", params: {} }), signal: AbortSignal.timeout(10000) });
        const toolsText = await toolsResponse.text();
        const toolsPayload = parseMcpResponse(toolsText);
        const toolsResult = toolsPayload?.result as Record<string, unknown> | undefined;
        const discoveredTools = Array.isArray(toolsResult?.tools) ? toolsResult.tools : [];
        const nextConfig = { ...config, protocolVersion: result.protocolVersion ?? "2025-06-18", serverInfo: result.serverInfo ?? {}, capabilities: discoveredTools.map((tool) => typeof tool === "object" && tool && "name" in tool ? String(tool.name) : "unknown"), sessionId, lastHandshakeAt: new Date().toISOString() };
        const mcpConnection = await prisma.mCPConnection.update({ where: { id: connection.id }, data: { status: "connected", lastTestAt: new Date(), config: nextConfig, proof: { handshake: "passed", toolsDiscovered: discoveredTools.length, connectedAt: new Date().toISOString() } } });
        sendApiSuccess(res, 200, { mcpConnection }, buildApiMeta(req, startedAt, { intent: "epoch_connect_mcp_connection" }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "MCP connection failed";
        const mcpConnection = await prisma.mCPConnection.update({ where: { id: connection.id }, data: { status: "error", lastTestAt: new Date(), proof: { handshake: "failed", error: message, failedAt: new Date().toISOString() } } });
        sendApiError(res, 502, { code: "MCP_CONNECTION_FAILED", message }, buildApiMeta(req, startedAt, { intent: "epoch_connect_mcp_connection" }));
        void mcpConnection;
      }
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp/status",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }

      const snapshot = await buildMcpWorkspaceSnapshot(params.data.workspaceId);
      sendApiSuccess(
        res,
        200,
        { workspaceId: params.data.workspaceId, mcp: snapshot },
        buildApiMeta(req, startedAt, { intent: "epoch_mcp_status" }),
      );
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp/clients",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }

      const snapshot = await buildMcpWorkspaceSnapshot(params.data.workspaceId);
      sendApiSuccess(
        res,
        200,
        { workspaceId: params.data.workspaceId, clients: snapshot.clients },
        buildApiMeta(req, startedAt, { intent: "epoch_mcp_clients" }),
      );
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp/tools",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }

      const snapshot = await buildMcpWorkspaceSnapshot(params.data.workspaceId);
      sendApiSuccess(
        res,
        200,
        { workspaceId: params.data.workspaceId, tools: snapshot.tools },
        buildApiMeta(req, startedAt, { intent: "epoch_mcp_tools" }),
      );
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp/resources",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }

      const snapshot = await buildMcpWorkspaceSnapshot(params.data.workspaceId);
      sendApiSuccess(
        res,
        200,
        { workspaceId: params.data.workspaceId, resources: snapshot.resources },
        buildApiMeta(req, startedAt, { intent: "epoch_mcp_resources" }),
      );
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp/requests",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }

      const snapshot = await buildMcpWorkspaceSnapshot(params.data.workspaceId);
      sendApiSuccess(
        res,
        200,
        { workspaceId: params.data.workspaceId, requests: snapshot.requests },
        buildApiMeta(req, startedAt, { intent: "epoch_mcp_requests" }),
      );
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp/logs",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }

      const snapshot = await buildMcpWorkspaceSnapshot(params.data.workspaceId);
      sendApiSuccess(
        res,
        200,
        { workspaceId: params.data.workspaceId, logs: snapshot.logs },
        buildApiMeta(req, startedAt, { intent: "epoch_mcp_logs" }),
      );
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/developer/mcp/sessions",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }

      const snapshot = await buildMcpWorkspaceSnapshot(params.data.workspaceId);
      sendApiSuccess(
        res,
        200,
        { workspaceId: params.data.workspaceId, sessions: snapshot.sessions },
        buildApiMeta(req, startedAt, { intent: "epoch_mcp_sessions" }),
      );
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/programs",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const programs = await listEpochRuntimePrograms(params.data.workspaceId);
      sendApiSuccess(res, 200, { programs }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_programs" }));
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/programs/:programId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = z.object({ workspaceId: z.string().min(1), programId: z.string().min(1) }).safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and programId are required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const program = await getEpochRuntimeProgram(params.data.workspaceId, params.data.programId);
      if (!program) {
        sendApiError(res, 404, { code: "PROGRAM_NOT_FOUND", message: "Program not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { program }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_program" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/programs",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      const body = z.record(z.string(), z.unknown()).safeParse(req.body);
      if (!params.success || !body.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid program payload" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const program = await createEpochRuntimeProgram(params.data.workspaceId, body.data);
      sendApiSuccess(res, 201, { program }, buildApiMeta(req, startedAt, { intent: "epoch_create_runtime_program" }));
    }),
  );

  epochRouter.patch(
    "/workspaces/:workspaceId/programs/:programId/status",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = z.object({ workspaceId: z.string().min(1), programId: z.string().min(1) }).safeParse(req.params);
      const body = z.object({ status: z.string().min(1).max(40) }).safeParse(req.body);
      if (!params.success || !body.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid program status payload" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const program = await updateEpochRuntimeProgramStatus(params.data.workspaceId, params.data.programId, body.data.status);
      if (!program) {
        sendApiError(res, 404, { code: "PROGRAM_NOT_FOUND", message: "Program not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { program }, buildApiMeta(req, startedAt, { intent: "epoch_update_runtime_program_status" }));
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/programs/:programId/runs",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = z.object({ workspaceId: z.string().min(1), programId: z.string().min(1) }).safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and programId are required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const runs = await listEpochRuntimeProgramRuns(params.data.workspaceId, params.data.programId);
      if (!runs) {
        sendApiError(res, 404, { code: "PROGRAM_NOT_FOUND", message: "Program not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { runs }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_program_runs" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/programs/:programId/runs",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = z.object({ workspaceId: z.string().min(1), programId: z.string().min(1) }).safeParse(req.params);
      const body = z.record(z.string(), z.unknown()).safeParse(req.body);
      if (!params.success || !body.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid program run payload" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const run = await createEpochRuntimeProgramRun(params.data.workspaceId, params.data.programId, body.data);
      if (!run) {
        sendApiError(res, 404, { code: "PROGRAM_NOT_FOUND", message: "Program not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 201, { run }, buildApiMeta(req, startedAt, { intent: "epoch_create_runtime_program_run" }));
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/deployments",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const deployments = await listEpochRuntimeDeployments(params.data.workspaceId);
      sendApiSuccess(res, 200, { deployments }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_deployments" }));
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/deployments/:deploymentId",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = z.object({ workspaceId: z.string().min(1), deploymentId: z.string().min(1) }).safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and deploymentId are required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const deployment = await getEpochRuntimeDeployment(params.data.workspaceId, params.data.deploymentId);
      if (!deployment) {
        sendApiError(res, 404, { code: "DEPLOYMENT_NOT_FOUND", message: "Deployment not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { deployment }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_deployment" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/deployments",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      const body = z.record(z.string(), z.unknown()).safeParse(req.body);
      if (!params.success || !body.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid deployment payload" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const deployment = await createEpochRuntimeDeployment(params.data.workspaceId, body.data);
      sendApiSuccess(res, 201, { deployment }, buildApiMeta(req, startedAt, { intent: "epoch_create_runtime_deployment" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/deployments/:deploymentId/rollback",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = z.object({ workspaceId: z.string().min(1), deploymentId: z.string().min(1) }).safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and deploymentId are required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const deployment = await rollbackEpochRuntimeDeployment(params.data.workspaceId, params.data.deploymentId);
      if (!deployment) {
        sendApiError(res, 404, { code: "DEPLOYMENT_NOT_FOUND", message: "Deployment not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiSuccess(res, 200, { deployment }, buildApiMeta(req, startedAt, { intent: "epoch_rollback_runtime_deployment" }));
    }),
  );

  epochRouter.get(
    "/workspaces/:workspaceId/registry",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      if (!params.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const artifacts = await listEpochRuntimeRegistryArtifacts(params.data.workspaceId);
      sendApiSuccess(res, 200, { artifacts }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_registry" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/registry",
    asyncHandler(async (req, res) => {
      const startedAt = Date.now();
      const params = EpochWorkspaceParamsSchema.safeParse(req.params);
      const body = z.record(z.string(), z.unknown()).safeParse(req.body);
      if (!params.success || !body.success) {
        sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid registry artifact payload" }, buildApiMeta(req, startedAt));
        return;
      }
      if (!(await resolveWorkspace(req, params.data.workspaceId))) {
        sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
        return;
      }
      const artifact = await createEpochRuntimeRegistryArtifact(params.data.workspaceId, body.data);
      sendApiSuccess(res, 201, { artifact }, buildApiMeta(req, startedAt, { intent: "epoch_create_runtime_registry_artifact" }));
    }),
  );

  epochRouter.post(
    "/workspaces/:workspaceId/missions/:missionId/memory",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = zodMemorySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid memory payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }

    const mission = await getEpochMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const memory = await recordEpochMemory({
      workspaceId: params.data.workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: req.authUserId,
      orgId: req.authOrgId,
      history: body.data.history,
      lessons: body.data.lessons,
      mistakes: body.data.mistakes,
      suggestedImprovements: body.data.suggestedImprovements,
      proof: body.data.proof,
    });
    sendApiSuccess(res, 201, { memory }, buildApiMeta(req, startedAt, { intent: "epoch_record_memory" }));
  }),
);

const zodMemorySchema = z.object({
  history: z.array(z.record(z.string(), z.unknown())).optional(),
  lessons: z.array(z.string().min(1).max(500)).optional(),
  mistakes: z.array(z.string().min(1).max(500)).optional(),
  suggestedImprovements: z.array(z.string().min(1).max(500)).optional(),
  proof: z.record(z.string(), z.unknown()).optional(),
});

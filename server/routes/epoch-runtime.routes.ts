import { Router } from "express";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import {
  enqueueEpochJob,
  deadLetterEpochJob,
  getEpochQueueStatus,
  getEpochQueueJobForWorkspace,
  listEpochDeadLetters,
  listEpochQueueJobsForMission,
  listEpochQueueJobsPage,
  retryDeadLetterEpochJob,
} from "../../lib/epoch/epochQueue";
import {
  CloneEpochInstitutionSchema,
  CreateEpochEvidenceSchema,
  CreateEpochInstitutionSchema,
  CreateEpochIntegrationSchema,
  CreateEpochMissionSchema,
  EpochInstitutionParamsSchema,
  EpochInstitutionVersionsQuerySchema,
  EpochExecutionRunParamsSchema,
  EpochCertificateParamsSchema,
  EpochMemoryRecordParamsSchema,
  EpochIntegrationListQuerySchema,
  EpochCertificateListViewQuerySchema,
  EpochMemoryRecordListViewQuerySchema,
  EpochExecutionRunListQuerySchema,
  EpochMissionParamsSchema,
  EpochMissionListQuerySchema,
  EpochPagedQuerySchema,
  EpochWorkspaceParamsSchema,
  EpochQueueEnqueueSchema,
  EpochQueueListQuerySchema,
  EpochQueueFailSchema,
  EpochQueueRecoverySchema,
  UpdateEpochInstitutionSchema,
  UpdateEpochMissionSchema,
  RunEpochMissionSchema,
  VerifyEpochMissionSchema,
  EpochOutcomeInputSchema,
  EpochExperienceInputSchema,
  EpochDecisionInputSchema,
  EpochVerificationWindowInputSchema,
} from "../schemas/epoch.schema";
import {
  archiveInstitution,
  cloneInstitution,
  createInstitution,
  getInstitution,
  listInstitutionVersions,
  summarizeInstitutionService,
  updateInstitution,
} from "../../lib/epoch/services/institutionService";
import {
  createMission,
  createMissionAuthorityPolicy,
  getMission,
  getMissionAuthorityGate,
  summarizeMissionService,
  updateMission,
} from "../../lib/epoch/services/missionService";
import { executeMission, getExecutionRun, summarizeExecutionService } from "../../lib/epoch/services/executionService";
import {
  getCertificate,
  issueCertificate,
  summarizeCertificateService,
} from "../../lib/epoch/services/certificateService";
import { getMemoryRecord, summarizeMemoryService } from "../../lib/epoch/services/memoryService";
import { recordEvidence, summarizeEvidenceService } from "../../lib/epoch/services/evidenceService";
import { verifyMission, summarizeVerificationService } from "../../lib/epoch/services/verificationService";
import {
  getIntegration,
  summarizeIntegrationService,
  getSupportedConnectorProfile,
  getSupportedConnectorMissionGuide,
  getSupportedConnectorProfiles,
  upsertIntegration,
} from "../../lib/epoch/services/integrationService";
import {
  listEpochExecutionRuns,
  listEpochIntegrations,
  listEpochMemoryRecords,
} from "../../lib/epoch/epochStore";
import { buildMcpWorkspaceSnapshot } from "../lib/mcp/mcpIntrospection";
import { EpochMissionTransitionError } from "../../lib/epoch/missionStateMachine";
import { buildEpochArchitectureRun } from "../../lib/epoch/v13/runtimeOrchestrator";
import {
  createDiscoveryProgram,
  createExperiment,
  createHypothesis,
  createUnknown,
  listDiscoveryState,
  recordObservation,
} from "../../lib/epoch/v13/discoveryService";
import { listEpochRuntimeEvents } from "../../lib/epoch/epochEvents";
import {
  getMissionOutcome,
  getOutcomeExperience,
  upsertMissionOutcome,
  upsertOutcomeExperience,
} from "../../lib/epoch/v13/outcomeService";
import { rankEpochCandidates } from "../../lib/epoch/decisionEngine";
import { buildEpochExecutionPlan } from "../../lib/epoch/executionPlan";
import { detectEpochDrift } from "../../lib/epoch/driftEngine";
import { evaluateEpochTelemetry } from "../../lib/epoch/telemetryEvaluation";
import { verifyEpochOutcome } from "../../lib/epoch/verificationEngine";
import { inspectEpochHuggingFaceModel, HuggingFaceInspectionError, searchEpochHuggingFaceModels } from "../../lib/epoch/huggingFace";
import { listSyncedEpochHuggingFaceModels, recordEpochHuggingFaceApproval, recordEpochHuggingFaceRuntimeLoad, recordEpochHuggingFaceVerification, syncEpochHuggingFaceModel } from "../../lib/epoch/huggingFaceStore";
import { EPOCH_RUNTIME_TARGETS, executeEpochRuntimeAdapter, EpochRuntimeAdapterError, probeEpochRuntimeAdapter } from "../../lib/epoch/runtimeAdapters";
import { runEpochSandbox } from "../../lib/epoch/sandboxRunner";
import { deployEpochRuntimeTarget, rollbackEpochRuntimeTarget } from "../../lib/epoch/deploymentAdapters";
import { deployGkeVllm, getGkeVllmStatus, rollbackGkeVllm } from "../../lib/epoch/gkeVllmAdapter";
import { discoverEpochLocalCapabilities, syncEpochLocalCapabilities } from "../../lib/epoch/localCapabilities";
import { generateEpochLocalCandidates } from "../../lib/epoch/localCandidateEngine";
import { runEpochLocalBenchmark } from "../../lib/epoch/localBenchmarkRunner";
import { runEpochOllamaMissionProof } from "../../lib/epoch/localMissionProof";
import { completeEpochAi, readEpochAiProviderConfig } from "../../lib/epoch/aiProviders";
import { runEpochMissionOrchestrator } from "../../lib/epoch/missionOrchestrator";
import { evaluateEpochEconomics, evaluateEpochQuality } from "../../lib/epoch/evaluationEngine";
import { buildEpochExperimentReproducibilityManifest, verifyEpochExperimentReproducibilityManifest } from "../../lib/epoch/experimentReproducibility";
import { compileEpochPipeline } from "../../lib/epoch/pipelineCompiler";
import { normalizeEpochWorkload } from "../../lib/epoch/workloadModel";
import { simulateEpochCandidates } from "../../lib/epoch/simulationEngine";
import { buildEpochWorldModelSnapshot, compareEpochWorldStates } from "../../lib/epoch/worldModel";
import { planEpochDiscovery } from "../../lib/epoch/discoveryLoop";
import { buildEpochKubernetesVllmCommandPlan, deployEpochKubernetesVllm, EpochKubernetesVllmError, rollbackEpochKubernetesVllm } from "../../lib/epoch/kubernetesVllmAdapter";
import { EpochKubernetesPreflightError, preflightEpochKubernetes } from "../../lib/epoch/kubernetesPreflight";
import { buildEpochLocalRuntimePlan, EpochLocalRuntimePlanError } from "../../lib/epoch/localRuntimePlan";
import { startEpochLocalRuntime, stopEpochLocalRuntime, EpochLocalRuntimeExecutionError } from "../../lib/epoch/localRuntimeExecution";
import { compileEpochMissionSystem, persistEpochMissionSystemProof } from "../../lib/epoch/missionSystemProof";
import { applyEpochRuntimeProbeToCompatibility, evaluateEpochRuntimeCompatibility, resolveEpochRuntime } from "../../lib/epoch/runtimeIntelligence";
import { executeEpochTask, EpochTaskExecutionError } from "../../lib/epoch/taskExecutionAdapters";
import { evaluateEpochEmbeddings } from "../../lib/epoch/embeddingEvaluation";
import { evaluateEpochReranking } from "../../lib/epoch/rerankingEvaluation";
import { evaluateEpochVision } from "../../lib/epoch/visionEvaluation";
import { evaluateEpochSpeech } from "../../lib/epoch/audioEvaluation";
import { evaluateEpochMedia } from "../../lib/epoch/mediaEvaluation";
import { executeEpochTaskBatch } from "../../lib/epoch/batchExecution";
import { scanEpochHuggingFaceFiles } from "../../lib/epoch/huggingFaceGovernance";
import { verifyEpochRuntimeLoad } from "../../lib/epoch/runtimeLoadVerification";
import { validateEpochSyncedModelExecution } from "../../lib/epoch/modelExecutionValidation";
import { evaluateEpochModelVerificationGate } from "../../lib/epoch/modelVerificationGate";
import { estimateEpochGpuMemory } from "../../lib/epoch/gpuMemoryEstimator";
import { validateEpochRuntimeMatrix } from "../../lib/epoch/runtimeExecutionValidation";
import { loadEpochArchitectureState, persistEpochArchitectureState } from "../../lib/epoch/architecturePersistence";
import { persistEpochRuntimeEvaluationEvidence } from "../../lib/epoch/runtimeEvaluationEvidence";
import { probeEpochCapabilityFabric, persistEpochCapabilityProbe, persistEpochGpuCapacity, reservePersistedEpochGpuCapacity, releasePersistedEpochGpuCapacity, reconcilePersistedEpochGpuCapacity, buildEpochGpuCapacitySnapshot } from "../../lib/epoch/capabilityFabricProbe";

export const epochRuntimeRouter = Router();
const epochJsonRecordSchema = z.record(z.string(), z.unknown());
const EpochGpuReservationSchema = z.object({ reservationId: z.string().min(1).max(200), vramMb: z.number().int().positive().max(10_000_000), ownerId: z.string().min(1).max(200).optional(), leaseMs: z.number().int().min(1_000).max(86_400_000).optional() });
const EpochGpuCapacitySchema = z.object({ gpus: z.array(z.object({ name: z.string().min(1).max(200), vramGb: z.number().nonnegative().nullable() })).min(1).max(32) });

async function resolveWorkspace(req: any, workspaceId: string): Promise<boolean> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: (req as any).authUserId,
      ...((req as any).authOrgId ? { orgId: (req as any).authOrgId } : {}),
    },
    select: { id: true },
  });
  return Boolean(workspace);
}

function sendWorkspaceNotFound(res: Parameters<typeof sendApiError>[0], meta: ReturnType<typeof buildApiMeta>) {
  return sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, meta);
}

const EpochArchitectureRunParamsSchema = EpochMissionParamsSchema;
const EpochArchitectureRunInputSchema = z.object({
  environment: z.enum(["software", "cloud", "simulation", "edge", "sandbox"]).optional(),
  architectureRunId: z.string().min(1).max(200).optional(),
});

const EpochHuggingFaceInspectionInputSchema = z.object({
  repositoryId: z.string().min(1).max(200),
  revision: z.string().min(1).max(200).optional(),
  sync: z.boolean().optional().default(true),
});

const EpochModelRegistryQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(200).optional() });
const EpochHuggingFaceSearchQuerySchema = z.object({ search: z.string().max(200).optional(), task: z.string().max(120).optional(), library: z.string().max(120).optional(), sort: z.enum(["downloads", "likes", "lastModified"]).optional(), direction: z.enum(["asc", "desc"]).optional(), limit: z.coerce.number().int().min(1).max(100).optional(), offset: z.coerce.number().int().min(0).max(10_000).optional() });
const EpochHuggingFaceSelectionInputSchema = z.object({ repositoryId: z.string().min(1).max(200), revision: z.string().min(1).max(200).optional(), missionId: z.string().min(1).max(200).optional(), downloadArtifacts: z.boolean().optional().default(true), files: z.array(z.string().min(1).max(500)).max(500).optional(), maxBytes: z.number().int().positive().max(500 * 1024 * 1024 * 1024).optional() });
const EpochHuggingFaceSyncJobInputSchema = EpochHuggingFaceSelectionInputSchema.omit({ missionId: true }).extend({ maxRetries: z.number().int().min(0).max(5).optional(), resume: z.boolean().optional().default(true) });
const EpochHuggingFaceSecurityScanInputSchema = z.object({ files: z.array(z.object({ path: z.string().min(1).max(500), size: z.number().int().nonnegative().nullable().optional() })).max(10_000), contents: z.record(z.string(), z.string().max(100_000)).optional() });
const EpochHuggingFaceApprovalInputSchema = z.object({ repositoryId: z.string().min(1).max(200), status: z.enum(["APPROVED", "REJECTED"]), reason: z.string().min(1).max(2000), securityScanSha256: z.string().length(64), files: z.array(z.object({ path: z.string().min(1).max(500), size: z.number().int().nonnegative().nullable().optional() })).max(10_000) });
const EpochLocalCandidateInputSchema = z.object({ repositoryId: z.string().min(1).max(200), revision: z.string().min(1).max(200).optional(), workload: z.record(z.string(), z.unknown()).optional(), sync: z.boolean().optional().default(true) });
const EpochSystemCompileInputSchema = z.object({ profile: epochJsonRecordSchema, runtime: epochJsonRecordSchema, hardware: epochJsonRecordSchema, compatibility: epochJsonRecordSchema, executionProvider: z.string().max(100).optional(), precision: z.string().max(50).optional(), quantization: z.string().max(50).optional(), batching: z.number().int().positive().max(1024).optional(), concurrency: z.number().int().positive().max(1024).optional(), timeoutMs: z.number().int().positive().max(3_600_000).optional() });
const EpochSystemProofInputSchema = z.object({ plan: epochJsonRecordSchema, observed: epochJsonRecordSchema.optional() });

const EpochRuntimeProbeInputSchema = z.object({
  target: z.enum(EPOCH_RUNTIME_TARGETS),
  endpointEnvVar: z.string().regex(/^EPOCH_RUNTIME_[A-Z0-9_]+_ENDPOINT$/),
  tokenEnvVar: z.string().regex(/^EPOCH_RUNTIME_[A-Z0-9_]+_TOKEN$/).optional(),
});
const EpochRuntimeProbeCompatibilityInputSchema = z.object({ profile: epochJsonRecordSchema, runtime: epochJsonRecordSchema, hardware: epochJsonRecordSchema, executionProvider: z.string().max(100).optional(), precision: z.string().max(50).optional(), requestedModel: z.string().max(300).optional(), probe: EpochRuntimeProbeInputSchema });

const EpochRuntimeExecutionInputSchema = EpochRuntimeProbeInputSchema.extend({
  target: z.enum(["vllm", "sglang", "nvidia_nim"]),
  model: z.string().min(1).max(300),
  prompt: z.string().min(1).max(100_000),
  maxOutputTokens: z.number().int().min(1).max(16_384).default(512),
});
const EpochTaskExecutionInputSchema = EpochRuntimeProbeInputSchema.omit({ target: true }).extend({ target: z.enum(["ollama", "vllm", "sglang", "nvidia_nim", "tensorrt_llm", "tei", "onnxruntime", "diffusers"]), task: z.enum(["text-generation", "embedding", "reranking", "classification", "vision", "ocr", "speech", "text-to-speech", "image-generation", "video"]), model: z.string().min(1).max(300), input: z.unknown(), maxOutputTokens: z.number().int().positive().max(8192).optional(), missionId: z.string().min(1).max(200).optional(), caseId: z.string().min(1).max(200).optional() });
const EpochEmbeddingEvaluationInputSchema = z.object({ cases: z.array(z.object({ id: z.string().min(1).max(200), query: z.array(z.number().finite()).min(1), relevantDocumentIds: z.array(z.string().min(1).max(200)).min(1) })).min(1).max(10_000), documents: z.array(z.object({ id: z.string().min(1).max(200), embedding: z.array(z.number().finite()).min(1) })).min(1).max(100_000), ks: z.array(z.number().int().positive().max(100)).max(10).optional() });
const EpochRerankingEvaluationInputSchema = z.object({ cases: z.array(z.object({ id: z.string().min(1).max(200), relevantDocumentIds: z.array(z.string().min(1).max(200)).min(1), rankedDocumentIds: z.array(z.string().min(1).max(200)).min(1) })).min(1).max(10_000), ks: z.array(z.number().int().positive().max(100)).max(10).optional() });
const EpochVisionEvaluationInputSchema = z.object({ cases: z.array(z.object({ id: z.string().min(1).max(200), expectedText: z.string().max(100_000), observedText: z.string().max(100_000) })).min(1).max(10_000), minimumTokenF1: z.number().min(0).max(1).optional(), minimumCharacterAccuracy: z.number().min(0).max(1).optional() });
const EpochSpeechEvaluationInputSchema = z.object({ cases: z.array(z.object({ id: z.string().min(1).max(200), expectedText: z.string().max(100_000), observedText: z.string().max(100_000) })).min(1).max(10_000), minimumTokenF1: z.number().min(0).max(1).optional() });
const EpochMediaEvaluationInputSchema = z.object({ cases: z.array(z.object({ id: z.string().min(1).max(200), artifact: z.object({ encoding: z.enum(["base64", "data-url", "url"]), value: z.string().max(500_000), mimeType: z.string().max(120).optional() }), expectedMimePrefix: z.enum(["image/", "video/"]).optional() })).min(1).max(10_000) });
const EpochTaskBatchInputSchema = z.object({ tasks: z.array(EpochTaskExecutionInputSchema.extend({ id: z.string().min(1).max(200) })).min(1).max(1000), concurrency: z.number().int().min(1).max(64).optional(), maxRetries: z.number().int().min(0).max(5).optional(), timeoutMs: z.number().int().min(100).max(900_000).optional() });
const EpochRuntimeBenchmarkJobSchema = z.object({ missionId: z.string().min(1).max(200) });
const EpochRuntimeQualityJobSchema = z.object({ missionId: z.string().min(1).max(200), cases: z.array(z.object({ id: z.string().min(1).max(200), input: z.string().max(100_000), expectedContains: z.string().optional(), expectedRegex: z.string().optional(), expectedJson: z.record(z.string(), z.unknown()).optional(), weight: z.number().positive().optional() })).min(1).max(500), minimumScorePct: z.number().min(0).max(100).optional() });
const EpochRuntimeMatrixInputSchema = z.object({ model: z.string().min(1).max(300), task: z.enum(["text-generation", "embedding", "reranking", "vision", "ocr", "speech", "text-to-speech", "image-generation", "video"]), input: z.unknown(), targets: z.array(z.enum(["vllm", "sglang", "tensorrt_llm", "tei", "diffusers"])).min(1).max(5).optional(), maxOutputTokens: z.number().int().positive().max(8192).optional() });
const EpochArchitectureStateInputSchema = z.object({ missionId: z.string().min(1).max(200), state: z.record(z.string(), z.unknown()) });
const EpochRuntimeLoadVerificationInputSchema = EpochTaskExecutionInputSchema.extend({ repositoryId: z.string().min(1).max(200).optional(), format: z.enum(["safetensors", "gguf", "onnx", "pytorch", "diffusers", "lora", "adapter", "unknown"]) });
const EpochHuggingFaceExecutionValidationInputSchema = z.object({ repositoryId: z.string().min(1).max(200), runOllama: z.boolean().optional().default(true), ollamaModel: z.string().min(1).max(200).optional(), prompt: z.string().min(1).max(10_000).optional() });
const EpochModelVerificationGateInputSchema = z.object({ repositoryId: z.string().min(1).max(200), verification: z.record(z.string(), z.unknown()), runtimeLoadStatus: z.string().min(1).max(80), qualityStatus: z.string().max(40).optional(), qualityScorePct: z.number().min(0).max(100).nullable().optional(), minimumQualityScorePct: z.number().min(0).max(100).optional(), benchmarkStatus: z.string().max(40).optional(), p99Ms: z.number().nonnegative().nullable().optional(), maximumP99Ms: z.number().positive().optional(), economicsStatus: z.string().max(40).optional(), requireEconomics: z.boolean().optional() });

const EpochLocalRuntimePlanInputSchema = z.object({ runtime: z.enum(["vllm", "sglang"]), model: z.string().min(1).max(300), revision: z.string().min(7).max(200), port: z.number().int().min(1024).max(65535).optional(), gpuMemoryUtilization: z.number().min(0.1).max(0.98).optional(), maxModelLen: z.number().int().min(256).max(131072).optional(), python: z.string().max(100).optional() });
const EpochLocalRuntimeStartInputSchema = EpochLocalRuntimePlanInputSchema.extend({ startupTimeoutMs: z.number().int().min(2_000).max(900_000).optional() });
const EpochLocalRuntimeStopInputSchema = z.object({ pid: z.number().int().positive() });

const EpochSandboxInputSchema = z.object({
  image: z.string().max(240).optional(),
  command: z.array(z.string().min(1).max(2000)).min(1).max(32),
  files: z.record(z.string().max(500), z.string().max(2_000_000)).optional(),
  timeoutMs: z.number().int().min(1000).max(900_000).optional(),
  memoryMb: z.number().int().min(128).max(8192).optional(),
  cpuLimit: z.number().min(0.1).max(8).optional(),
});

const EpochDeploymentInputSchema = z.object({
  target: z.enum(["kubernetes", "cloud", "data_center"]),
  endpointEnvVar: z.string().regex(/^EPOCH_DEPLOYMENT_[A-Z0-9_]+_ENDPOINT$/),
  tokenEnvVar: z.string().regex(/^EPOCH_DEPLOYMENT_[A-Z0-9_]+_TOKEN$/).optional(),
  name: z.string().min(1).max(200), model: z.string().min(1).max(300), version: z.string().min(1).max(300),
  manifest: z.record(z.string(), z.unknown()).default({}),
});
const EpochRollbackInputSchema = EpochDeploymentInputSchema.pick({ target: true, endpointEnvVar: true, tokenEnvVar: true }).extend({ deploymentId: z.string().min(1).max(300), version: z.string().max(300).optional(), reason: z.string().min(1).max(4000) });

const GkeVllmDeploymentInputSchema = z.object({
  name: z.string().min(1).max(100), model: z.string().min(1).max(300), image: z.string().max(240).optional(), namespace: z.string().max(63).optional(),
  gpuCount: z.number().int().min(1).max(8).optional(), gpuType: z.string().max(100).optional(), replicas: z.number().int().min(1).max(20).optional(), port: z.number().int().min(1024).max(65535).optional(), version: z.string().min(1).max(300),
});
const GkeVllmRollbackInputSchema = z.object({ name: z.string().min(1).max(100), namespace: z.string().max(63).optional(), toRevision: z.number().int().positive().optional(), reason: z.string().min(1).max(4000) });
const GkeVllmStatusInputSchema = z.object({ name: z.string().min(1).max(100), namespace: z.string().max(63).optional() });

epochRuntimeRouter.post("/workspaces/:workspaceId/capabilities/local/discover", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = z.object({ sync: z.boolean().optional().default(true) }).safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid local capability discovery request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const capabilities = await discoverEpochLocalCapabilities();
  const synced = body.data.sync ? await syncEpochLocalCapabilities({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, capabilities) : null;
  sendApiSuccess(res, 200, { capabilities, synced }, buildApiMeta(req, startedAt, { intent: "epoch_local_capability_discovery" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/capabilities/runtime/probe", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params);
  const body = z.object({ targets: z.array(z.enum(["ollama", "vllm", "sglang", "tensorrt_llm", "tei", "diffusers", "nvidia_nim", "onnxruntime"])).max(20).optional() }).safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime capability probe request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const result = await probeEpochCapabilityFabric({ targets: body.data.targets });
  const persisted = await Promise.all(result.runtimes.map((probe) => persistEpochCapabilityProbe({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, probe)));
  sendApiSuccess(res, 200, { result, persisted: persisted.length }, buildApiMeta(req, startedAt, { intent: "epoch_capability_runtime_probe" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/capabilities/gpu/capacity", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochGpuCapacitySchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid GPU capacity request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const snapshot = buildEpochGpuCapacitySnapshot({ gpus: body.data.gpus });
  await persistEpochGpuCapacity({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, snapshot);
  sendApiSuccess(res, 201, { snapshot }, buildApiMeta(req, startedAt, { intent: "epoch_gpu_capacity_sync" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/capabilities/gpu/reserve", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochGpuReservationSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid GPU reservation request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const snapshot = await reservePersistedEpochGpuCapacity({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, body.data); sendApiSuccess(res, 201, { snapshot }, buildApiMeta(req, startedAt, { intent: "epoch_gpu_reservation_acquire" })); }
  catch (error) { if (error instanceof Error && ["epoch_gpu_capacity_not_initialized", "epoch_gpu_capacity_insufficient", "epoch_gpu_reservation_duplicate"].includes(error.message)) { sendApiError(res, 409, { code: error.message.toUpperCase(), message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/capabilities/gpu/release", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = z.object({ reservationId: z.string().min(1).max(200) }).safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid GPU release request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const snapshot = await releasePersistedEpochGpuCapacity({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, body.data.reservationId); sendApiSuccess(res, 200, { snapshot }, buildApiMeta(req, startedAt, { intent: "epoch_gpu_reservation_release" })); }
  catch (error) { if (error instanceof Error && error.message === "epoch_gpu_capacity_not_initialized") { sendApiError(res, 409, { code: "EPOCH_GPU_CAPACITY_NOT_INITIALIZED", message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/capabilities/gpu/reconcile", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params);
  if (!params.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid workspace" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const result = await reconcilePersistedEpochGpuCapacity({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }); sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt, { intent: "epoch_gpu_reservation_reconcile" })); }
  catch (error) { if (error instanceof Error && error.message === "epoch_gpu_capacity_not_initialized") { sendApiError(res, 409, { code: "EPOCH_GPU_CAPACITY_NOT_INITIALIZED", message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/local-candidates", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochLocalCandidateInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "repositoryId is required" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try {
    const inspection = await inspectEpochHuggingFaceModel(body.data); const capabilities = await discoverEpochLocalCapabilities();
    const synced = body.data.sync ? await syncEpochLocalCapabilities({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, capabilities) : null;
    const result = generateEpochLocalCandidates({ inspection, capabilities, workload: body.data.workload });
    sendApiSuccess(res, 200, { ...result, inspection, capabilities, synced }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_local_candidates" }));
  } catch (error) { if (error instanceof HuggingFaceInspectionError) { sendApiError(res, error.code === "MODEL_NOT_FOUND" ? 404 : 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

const EpochGpuMemoryEstimateInputSchema = z.object({ model: z.string().min(1).max(300), parameterCount: z.number().positive().nullable().optional(), quantization: z.string().max(80).nullable().optional(), contextLength: z.number().int().positive().nullable().optional(), numLayers: z.number().int().positive().nullable().optional(), hiddenSize: z.number().int().positive().nullable().optional(), gpuName: z.string().min(1).max(200), vramMb: z.number().positive().max(2_000_000), utilizationLimitPct: z.number().min(10).max(99).optional() });
epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/gpu-estimate", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochGpuMemoryEstimateInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid GPU memory estimate request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const estimate = estimateEpochGpuMemory(body.data);
  sendApiSuccess(res, 200, { estimate }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_gpu_memory_estimate" }));
}));

epochRuntimeRouter.get("/workspaces/:workspaceId/models/huggingface/search", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const query = EpochHuggingFaceSearchQuerySchema.safeParse(req.query);
  if (!params.success || !query.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Hugging Face search request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const result = await searchEpochHuggingFaceModels(query.data); sendApiSuccess(res, 200, { ...result }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_model_search" })); }
  catch (error) { if (error instanceof HuggingFaceInspectionError) { sendApiError(res, 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/select", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochHuggingFaceSelectionInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "repositoryId is required" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  if (body.data.missionId) {
    const mission = await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true, proof: true } });
    if (!mission) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    try {
      const inspection = await inspectEpochHuggingFaceModel(body.data);
      const synced = await syncEpochHuggingFaceModel({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, inspection, { downloadArtifacts: body.data.downloadArtifacts, files: body.data.files, maxBytes: body.data.maxBytes });
      const proof = mission.proof && typeof mission.proof === "object" && !Array.isArray(mission.proof) ? mission.proof as Record<string, unknown> : {};
      await prisma.epochMission.update({ where: { id: mission.id }, data: { proof: { ...proof, modelSelection: { source: "huggingface", repositoryId: inspection.repositoryId, revision: inspection.revision, commitSha: inspection.commitSha, artifactDigest: inspection.artifactDigest, selectedAt: new Date().toISOString() } } } });
      sendApiSuccess(res, 200, { inspection, synced, missionId: mission.id }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_select_for_mission" }));
    } catch (error) { if (error instanceof HuggingFaceInspectionError) { sendApiError(res, error.code === "MODEL_NOT_FOUND" ? 404 : 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
    return;
  }
  try { const inspection = await inspectEpochHuggingFaceModel(body.data); const synced = await syncEpochHuggingFaceModel({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, inspection, { downloadArtifacts: body.data.downloadArtifacts, files: body.data.files, maxBytes: body.data.maxBytes }); sendApiSuccess(res, 200, { inspection, synced }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_select" })); }
  catch (error) { if (error instanceof HuggingFaceInspectionError) { sendApiError(res, error.code === "MODEL_NOT_FOUND" ? 404 : 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/sync-jobs", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochHuggingFaceSyncJobInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Hugging Face sync job request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const job = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, type: "model_sync", payload: { repositoryId: body.data.repositoryId, revision: body.data.revision, downloadArtifacts: body.data.downloadArtifacts, files: body.data.files, maxBytes: body.data.maxBytes, resume: body.data.resume, userId: req.authUserId, orgId: req.authOrgId, maxRetries: body.data.maxRetries } });
  sendApiSuccess(res, 202, { job }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_sync_job" }));
}));

const EpochModelBenchmarkJobInputSchema = z.object({
  repositoryId: z.string().min(1).max(200),
  model: z.string().min(1).max(300),
  prompts: z.array(z.string().min(1).max(10_000)).min(1).max(100),
  repetitions: z.number().int().min(1).max(20).optional(),
  warmup: z.number().int().min(0).max(3).optional(),
  maxOutputTokens: z.number().int().min(1).max(4096).optional(),
  endpoint: z.string().url().max(500).optional(),
  maximumP99Ms: z.number().positive().max(120_000).optional(),
  missionId: z.string().min(1).max(200).optional(),
});

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/benchmark-jobs", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochModelBenchmarkJobInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid model benchmark job request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  if (body.data.missionId) {
    const mission = await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } });
    if (!mission) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
  }
  const model = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: params.data.workspaceId, source: "huggingface", name: body.data.repositoryId }, select: { id: true } });
  if (!model) { sendApiError(res, 404, { code: "MODEL_NOT_SYNCED", message: "Sync the Hugging Face model before benchmarking" }, buildApiMeta(req, startedAt)); return; }
  const job = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, missionId: body.data.missionId, type: "model_benchmark", payload: { ...body.data } });
  sendApiSuccess(res, 202, { job }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_model_benchmark_job" }));
}));

const EpochModelQualityJobInputSchema = z.object({
  repositoryId: z.string().min(1).max(200), model: z.string().min(1).max(300),
  datasetId: z.literal("epoch-local-quality-v1").optional(),
  cases: z.array(z.object({ id: z.string().min(1), prompt: z.string().min(1), expectedContains: z.string().optional(), expectedRegex: z.string().optional(), expectedJson: z.record(z.string(), z.unknown()).optional(), weight: z.number().positive().optional(), tags: z.array(z.string()).optional() })).min(1).max(100).optional(),
  endpoint: z.string().url().max(500).optional(), maxOutputTokens: z.number().int().min(1).max(4096).optional(), minimumScorePct: z.number().min(0).max(100).optional(), missionId: z.string().min(1).max(200).optional(),
}).refine((value) => Boolean(value.datasetId || value.cases?.length), { message: "datasetId or cases is required" });

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/quality-jobs", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochModelQualityJobInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid model quality job request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  if (body.data.missionId && !(await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } }))) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
  if (!(await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: params.data.workspaceId, source: "huggingface", name: body.data.repositoryId }, select: { id: true } }))) { sendApiError(res, 404, { code: "MODEL_NOT_SYNCED", message: "Sync the Hugging Face model before quality evaluation" }, buildApiMeta(req, startedAt)); return; }
  const job = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, missionId: body.data.missionId, type: "model_quality", payload: { ...body.data } });
  sendApiSuccess(res, 202, { job }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_model_quality_job" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/security-scan", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochHuggingFaceSecurityScanInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Hugging Face security scan request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const scan = scanEpochHuggingFaceFiles(body.data); sendApiSuccess(res, 200, { scan }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_security_scan" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/approval", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochHuggingFaceApprovalInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Hugging Face approval request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const scan = scanEpochHuggingFaceFiles({ files: body.data.files });
  if (scan.scanSha256 !== body.data.securityScanSha256) { sendApiError(res, 409, { code: "SECURITY_SCAN_MISMATCH", message: "Approval must reference the exact security scan" }, buildApiMeta(req, startedAt)); return; }
  if (body.data.status === "APPROVED" && scan.status !== "PASS") { sendApiError(res, 422, { code: "SECURITY_SCAN_NOT_CLEAR", message: "Only a clean security scan can approve a model" }, buildApiMeta(req, startedAt)); return; }
  const approval = { status: body.data.status, approvedBy: req.authUserId, reason: body.data.reason, approvedAt: new Date().toISOString(), securityScanSha256: scan.scanSha256 } as const;
  try { const model = await recordEpochHuggingFaceApproval({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, { repositoryId: body.data.repositoryId, approval, scan }); sendApiSuccess(res, 200, { approval, model }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_model_approval" })); } catch (error) { if (error instanceof Error && error.message === "HUGGINGFACE_MODEL_NOT_SYNCED") { sendApiError(res, 404, { code: "MODEL_NOT_SYNCED", message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/gke/vllm/deploy", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = GkeVllmDeploymentInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid GKE vLLM deployment request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const deployment = await deployGkeVllm(body.data); sendApiSuccess(res, 200, { deployment }, buildApiMeta(req, startedAt, { intent: "epoch_gke_vllm_deploy" })); }
  catch (error) { if (error instanceof Error) { sendApiError(res, 502, { code: error.name === "GkeVllmAdapterError" ? (error as any).code : "GKE_VLLM_FAILED", message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/gke/vllm/rollback", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = GkeVllmRollbackInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid GKE vLLM rollback request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const rollback = await rollbackGkeVllm(body.data); sendApiSuccess(res, 200, { rollback }, buildApiMeta(req, startedAt, { intent: "epoch_gke_vllm_rollback" })); }
  catch (error) { if (error instanceof Error) { sendApiError(res, 502, { code: error.name === "GkeVllmAdapterError" ? (error as any).code : "GKE_VLLM_FAILED", message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/gke/vllm/status", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = GkeVllmStatusInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid GKE vLLM status request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const status = await getGkeVllmStatus(body.data); sendApiSuccess(res, 200, { status }, buildApiMeta(req, startedAt, { intent: "epoch_gke_vllm_status" })); }
  catch (error) { if (error instanceof Error) { sendApiError(res, 502, { code: error.name === "GkeVllmAdapterError" ? (error as any).code : "GKE_VLLM_FAILED", message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/deploy", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochDeploymentInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid deployment adapter request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const deployment = await deployEpochRuntimeTarget(body.data); sendApiSuccess(res, 200, { deployment }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_adapter_deploy" })); }
  catch (error) { if (error instanceof EpochRuntimeAdapterError) { sendApiError(res, 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/rollback", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochRollbackInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid rollback adapter request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const rollback = await rollbackEpochRuntimeTarget(body.data); sendApiSuccess(res, 200, { rollback }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_adapter_rollback" })); }
  catch (error) { if (error instanceof EpochRuntimeAdapterError) { sendApiError(res, 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/sandbox/run",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochSandboxInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid sandbox request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const result = await runEpochSandbox(body.data);
    sendApiSuccess(res, result.status === "unavailable" ? 503 : 200, { result }, buildApiMeta(req, startedAt, { intent: "epoch_sandbox_run" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/probe",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochRuntimeProbeInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime adapter probe request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const probe = await probeEpochRuntimeAdapter(body.data);
    sendApiSuccess(res, 200, { probe }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_adapter_probe" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/probe-compatibility",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochRuntimeProbeCompatibilityInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Model profile, runtime, hardware, and probe configuration are required" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const runtimeName = typeof body.data.runtime.name === "string" ? body.data.runtime.name : body.data.probe.target;
    const runtime = resolveEpochRuntime({ name: runtimeName, version: typeof body.data.runtime.version === "string" ? body.data.runtime.version : undefined, installed: true });
    if (!runtime) { sendApiError(res, 422, { code: "RUNTIME_NOT_REGISTERED", message: `Runtime ${runtimeName} is not registered` }, buildApiMeta(req, startedAt)); return; }
    const probe = await probeEpochRuntimeAdapter(body.data.probe);
    const predicted = evaluateEpochRuntimeCompatibility({ profile: body.data.profile as any, runtime: { ...runtime, ...body.data.runtime } as any, hardware: body.data.hardware as any, executionProvider: body.data.executionProvider, precision: body.data.precision });
    const compatibility = applyEpochRuntimeProbeToCompatibility({ compatibility: predicted, probe, requestedModel: body.data.requestedModel });
    sendApiSuccess(res, compatibility.status === "FAILED" ? 502 : 200, { probe, compatibility }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_probe_compatibility" }));
  }),
);

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/local-plan", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochLocalRuntimePlanInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid local runtime plan request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { sendApiSuccess(res, 200, { plan: buildEpochLocalRuntimePlan(body.data) }, buildApiMeta(req, startedAt, { intent: "epoch_local_runtime_plan" })); } catch (error) { if (error instanceof EpochLocalRuntimePlanError) { sendApiError(res, 400, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/local-start", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochLocalRuntimeStartInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid local runtime start request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const runtime = await startEpochLocalRuntime(body.data); const { stop: _stop, ...result } = runtime; sendApiSuccess(res, 201, { runtime: result }, buildApiMeta(req, startedAt, { intent: "epoch_local_runtime_start" })); }
  catch (error) { if (error instanceof EpochLocalRuntimeExecutionError) { sendApiError(res, error.code === "LOCAL_RUNTIME_EXECUTION_DISABLED" ? 409 : 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/local-stop", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochLocalRuntimeStopInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid local runtime stop request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  sendApiSuccess(res, 200, { stopped: stopEpochLocalRuntime(body.data.pid), pid: body.data.pid }, buildApiMeta(req, startedAt, { intent: "epoch_local_runtime_stop" }));
}));

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/execute",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochRuntimeExecutionInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime adapter execution request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    try {
      const execution = await executeEpochRuntimeAdapter(body.data);
      sendApiSuccess(res, 200, { execution }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_adapter_execute" }));
    } catch (error) {
      if (error instanceof EpochRuntimeAdapterError) { sendApiError(res, 502, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; }
      throw error;
    }
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/task-execute",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochTaskExecutionInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid task execution request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    try {
      const { missionId, caseId, ...taskInput } = body.data;
      const result = await executeEpochTask(taskInput);
      const evaluationEvidence = missionId ? await persistEpochRuntimeEvaluationEvidence({ workspaceId: params.data.workspaceId, missionId, userId: req.authUserId, task: taskInput.task, model: taskInput.model, caseId, execution: result }) : null;
      sendApiSuccess(res, result.status === "FAILED" ? 502 : result.status === "UNSUPPORTED" ? 409 : 200, { result, evaluationEvidence }, buildApiMeta(req, startedAt, { intent: "epoch_task_runtime_execute" }));
    } catch (error) {
      if (error instanceof EpochTaskExecutionError) { sendApiError(res, error.code === "RUNTIME_NOT_CONFIGURED" ? 409 : 400, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; }
      throw error;
    }
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/execution-matrix",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochRuntimeMatrixInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime execution matrix request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const matrix = await validateEpochRuntimeMatrix({ model: body.data.model, task: body.data.task, value: body.data.input, targets: body.data.targets, maxOutputTokens: body.data.maxOutputTokens });
    const hasFailure = matrix.results.some((item) => item.status === "FAILED");
    sendApiSuccess(res, hasFailure ? 207 : 200, { matrix }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_execution_matrix" }));
  }),
);

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/benchmark-jobs", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochRuntimeBenchmarkJobSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime benchmark job request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  if (!(await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } }))) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
  const job = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, missionId: body.data.missionId, type: "runtime_benchmark", payload: {} });
  sendApiSuccess(res, 202, { job }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_benchmark_job" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/quality-jobs", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochRuntimeQualityJobSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime quality job request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  if (!(await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } }))) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
  const job = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, missionId: body.data.missionId, type: "runtime_quality", payload: { cases: body.data.cases, minimumScorePct: body.data.minimumScorePct } });
  sendApiSuccess(res, 202, { job }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_quality_job" }));
}));

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/load-verify",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochRuntimeLoadVerificationInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime load verification request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const verification = await verifyEpochRuntimeLoad({ ...body.data, smokeInput: body.data.input });
    const model = body.data.repositoryId ? await recordEpochHuggingFaceRuntimeLoad({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, { repositoryId: body.data.repositoryId, verification: verification as unknown as Record<string, unknown> }) : null;
    sendApiSuccess(res, ["VERIFIED_COMPATIBLE", "UNSUPPORTED"].includes(verification.status) ? 200 : 502, { verification, model }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_load_verification" }));
  }),
);

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/execute-verify", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochHuggingFaceExecutionValidationInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "repositoryId is required" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const registry = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: params.data.workspaceId, source: "huggingface", name: body.data.repositoryId }, orderBy: { updatedAt: "desc" }, select: { metadata: true } });
  if (!registry) { sendApiError(res, 404, { code: "MODEL_NOT_SYNCED", message: "Sync the Hugging Face model before execution validation" }, buildApiMeta(req, startedAt)); return; }
  const metadata = registry.metadata && typeof registry.metadata === "object" ? registry.metadata as Record<string, unknown> : {};
  const inspection = metadata.inspection && typeof metadata.inspection === "object" ? metadata.inspection as any : null;
  const sync = metadata.sync && typeof metadata.sync === "object" ? metadata.sync as Record<string, unknown> : {};
  const artifacts = Array.isArray(sync.artifacts) ? sync.artifacts as any[] : [];
  if (!inspection || !artifacts.length) { sendApiError(res, 409, { code: "MODEL_ARTIFACTS_NOT_SYNCED", message: "The model has no downloaded artifacts to execute" }, buildApiMeta(req, startedAt)); return; }
  const validation = await validateEpochSyncedModelExecution({ inspection, artifacts, runOllama: body.data.runOllama, ollamaModel: body.data.ollamaModel, prompt: body.data.prompt });
  const model = await recordEpochHuggingFaceRuntimeLoad({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, { repositoryId: body.data.repositoryId, verification: validation as unknown as Record<string, unknown> });
  sendApiSuccess(res, validation.ollama.status === "VERIFIED_COMPATIBLE" || validation.ollama.status === "UNSUPPORTED" ? 200 : 502, { validation, model }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_execute_verify" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/architecture-state/persist", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochArchitectureStateInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "missionId and architecture state are required" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const stored = await persistEpochArchitectureState({ workspaceId: params.data.workspaceId, missionId: body.data.missionId, userId: req.authUserId, state: body.data.state as any });
  sendApiSuccess(res, 200, { stored: { missionId: stored.id, updatedAt: stored.updatedAt } }, buildApiMeta(req, startedAt, { intent: "epoch_architecture_state_persist" }));
}));

epochRuntimeRouter.get("/workspaces/:workspaceId/architecture-state/:missionId", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = z.object({ workspaceId: z.string().min(1), missionId: z.string().min(1) }).safeParse(req.params);
  if (!params.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid architecture state request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const state = await loadEpochArchitectureState(params.data.workspaceId, params.data.missionId); if (!state) { sendApiError(res, 404, { code: "ARCHITECTURE_STATE_NOT_FOUND", message: "No persisted architecture state for this mission" }, buildApiMeta(req, startedAt)); return; }
  sendApiSuccess(res, 200, { state }, buildApiMeta(req, startedAt, { intent: "epoch_architecture_state_replay" }));
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/models/huggingface/verification-gate", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = EpochModelVerificationGateInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid model verification gate request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const gate = evaluateEpochModelVerificationGate(body.data); try { const model = await recordEpochHuggingFaceVerification({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, { repositoryId: body.data.repositoryId, gate, verification: body.data.verification }); sendApiSuccess(res, gate.status === "PASS" ? 200 : 422, { gate, model }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_verification_gate" })); } catch (error) { if (error instanceof Error && error.message === "HUGGINGFACE_MODEL_NOT_SYNCED") { sendApiError(res, 404, { code: "MODEL_NOT_SYNCED", message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/embedding-evaluate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochEmbeddingEvaluationInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid embedding evaluation request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const evaluation = evaluateEpochEmbeddings(body.data);
    sendApiSuccess(res, evaluation.status === "PASS" ? 200 : 422, { evaluation }, buildApiMeta(req, startedAt, { intent: "epoch_embedding_quality_evaluation" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/reranking-evaluate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochRerankingEvaluationInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid reranking evaluation request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const evaluation = evaluateEpochReranking(body.data);
    sendApiSuccess(res, evaluation.status === "PASS" ? 200 : 422, { evaluation }, buildApiMeta(req, startedAt, { intent: "epoch_reranking_quality_evaluation" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/vision-evaluate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochVisionEvaluationInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid vision evaluation request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const evaluation = evaluateEpochVision(body.data);
    sendApiSuccess(res, evaluation.status === "PASS" ? 200 : 422, { evaluation }, buildApiMeta(req, startedAt, { intent: "epoch_vision_quality_evaluation" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/speech-evaluate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochSpeechEvaluationInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid speech evaluation request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const evaluation = evaluateEpochSpeech(body.data);
    sendApiSuccess(res, evaluation.status === "PASS" ? 200 : 422, { evaluation }, buildApiMeta(req, startedAt, { intent: "epoch_speech_quality_evaluation" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/media-evaluate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochMediaEvaluationInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid media evaluation request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const evaluation = evaluateEpochMedia(body.data);
    sendApiSuccess(res, evaluation.status === "PASS" ? 200 : 422, { evaluation }, buildApiMeta(req, startedAt, { intent: "epoch_media_quality_evaluation" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/task-batch",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochTaskBatchInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid task batch request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const batch = await executeEpochTaskBatch(body.data);
    sendApiSuccess(res, batch.status === "COMPLETED" ? 200 : 207, { batch }, buildApiMeta(req, startedAt, { intent: "epoch_task_batch_execute" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/runtime-adapters/benchmark",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ model: z.string().min(1).max(200), prompts: z.array(z.string().min(1).max(10_000)).min(1).max(20), repetitions: z.number().int().min(1).max(20).optional(), warmup: z.number().int().min(0).max(3).optional(), maxOutputTokens: z.number().int().min(1).max(4096).optional(), endpoint: z.string().url().optional(), missionId: z.string().min(1).max(100).optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid local benchmark request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const benchmark = await runEpochLocalBenchmark(body.data);
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, missionId: body.data.missionId, kind: "local_runtime_benchmark", value: benchmark, evidenceIds: [], observedAt: new Date(benchmark.completedAt) } });
    sendApiSuccess(res, 200, { benchmark, observation }, buildApiMeta(req, startedAt, { intent: "epoch_local_runtime_benchmark" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/local-runtime-proof",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = z.object({ model: z.string().min(1).max(200).optional(), endpoint: z.string().url().optional(), acceptanceCriteria: z.array(z.string().min(1).max(500)).min(1).max(20).optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid local runtime proof request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    const proof = await runEpochOllamaMissionProof({
      workspaceId: params.data.workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      title: mission.title,
      objective: `${mission.objective}\nReturn a concise answer containing the word accepted when the acceptance criteria are satisfied.`,
      acceptanceCriteria: body.data.acceptanceCriteria ?? ["The local model responds successfully."],
      model: body.data.model,
      endpoint: body.data.endpoint,
    });
    const proofJson = JSON.parse(JSON.stringify(proof)) as Record<string, unknown>;
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, missionId: mission.id, kind: "local_mission_proof", value: proofJson as any, evidenceIds: [proof.evidence.id], observedAt: new Date(proof.verification.createdAt) } });
    await updateMission(params.data.workspaceId, mission.id, { result: { ...(mission.result as Record<string, unknown> ?? {}), localRuntimeProof: proofJson }, proof: { ...(mission.proof as Record<string, unknown> ?? {}), localRuntimeProof: proofJson } });
    sendApiSuccess(res, 201, { proof, observation }, buildApiMeta(req, startedAt, { intent: "epoch_local_mission_runtime_proof" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/orchestrator/run",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ outcome: epochJsonRecordSchema.optional(), constraints: epochJsonRecordSchema.optional(), baseline: epochJsonRecordSchema.optional(), workload: epochJsonRecordSchema.optional(), model: epochJsonRecordSchema.optional(), currentReality: epochJsonRecordSchema.optional(), acceptanceCriteria: z.array(z.string().min(1).max(500)).max(50).optional(), unknowns: z.array(z.object({ statement: z.string().min(1), importance: z.enum(["low", "medium", "high"]).optional(), impact: z.enum(["low", "medium", "high"]).optional() })).max(50).optional(), hypotheses: z.array(z.object({ statement: z.string().min(1), confidence: z.number().min(0).max(1).optional() })).max(50).optional(), runtimeOptions: z.array(epochJsonRecordSchema).max(50).optional(), hardwareOptions: z.array(epochJsonRecordSchema).max(50).optional(), candidateMeasurements: z.record(z.string(), epochJsonRecordSchema).optional(), authorization: z.object({ allowed: z.boolean(), reason: z.string().min(1) }).optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Epoch orchestrator request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const result = runEpochMissionOrchestrator(body.data);
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "mission_orchestrator_run", value: JSON.parse(JSON.stringify(result)) as any, evidenceIds: [], observedAt: new Date(result.trace.generatedAt) } });
    sendApiSuccess(res, 201, { result, observation }, buildApiMeta(req, startedAt, { intent: "epoch_mission_orchestrator_run" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/orchestrator/system/compile",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochSystemCompileInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "A model profile, runtime, hardware, and compatibility report are required" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    try {
      const plan = compileEpochMissionSystem(body.data as any);
      sendApiSuccess(res, 200, { plan }, buildApiMeta(req, startedAt, { intent: "epoch_system_execution_plan_compile" }));
    } catch (error) {
      sendApiError(res, 422, { code: "SYSTEM_PLAN_COMPILE_FAILED", message: error instanceof Error ? error.message : "Unable to compile system plan" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/system-proof",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochSystemProofInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "A compiled system plan is required" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const mission = await prisma.epochMission.findFirst({ where: { id: params.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } });
    if (!mission) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    try {
      const evidence = await persistEpochMissionSystemProof({ workspaceId: params.data.workspaceId, missionId: params.data.missionId, userId: req.authUserId, plan: body.data.plan as any, observed: body.data.observed });
      sendApiSuccess(res, 201, { evidence }, buildApiMeta(req, startedAt, { intent: "epoch_system_proof_persist" }));
    } catch (error) {
      sendApiError(res, 422, { code: "SYSTEM_PROOF_PERSIST_FAILED", message: error instanceof Error ? error.message : "Unable to persist system proof" }, buildApiMeta(req, startedAt));
    }
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/evaluations/quality-economic",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ quality: z.object({ cases: z.array(z.object({ id: z.string().min(1), input: z.string(), expectedContains: z.string().optional(), expectedRegex: z.string().optional(), expectedJson: epochJsonRecordSchema.optional(), weight: z.number().positive().optional() })).min(1), outputs: z.array(z.object({ caseId: z.string().min(1), output: z.string(), error: z.string().optional() })), minimumScorePct: z.number().min(0).max(100).optional() }).optional(), economics: z.object({ costPerHour: z.number().nonnegative().optional(), requestsPerHour: z.number().positive().optional(), tokensPerHour: z.number().positive().optional(), monthlyRequests: z.number().nonnegative().optional(), monthlyHours: z.number().nonnegative().optional(), budgetPerMonth: z.number().nonnegative().optional() }).optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success || (!body.data.quality && !body.data.economics)) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Quality or economics input is required" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const quality = body.data.quality ? evaluateEpochQuality(body.data.quality) : null;
    const economics = body.data.economics ? evaluateEpochEconomics(body.data.economics) : null;
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "quality_economic_evaluation", value: JSON.parse(JSON.stringify({ quality, economics })) as any, evidenceIds: [], observedAt: new Date() } });
    sendApiSuccess(res, 201, { quality, economics, observation }, buildApiMeta(req, startedAt, { intent: "epoch_quality_economic_evaluation" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/experiments/reproducibility",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ experimentId: z.string().max(200).optional(), model: epochJsonRecordSchema, runtime: epochJsonRecordSchema, hardware: epochJsonRecordSchema, workload: epochJsonRecordSchema, configuration: epochJsonRecordSchema.optional(), dataset: epochJsonRecordSchema.optional(), softwareEnvironment: epochJsonRecordSchema.optional(), randomSeed: z.number().int().optional(), metrics: epochJsonRecordSchema.optional(), logs: z.array(z.object({ timestamp: z.string().optional(), level: z.string().optional(), message: z.string() })).max(10_000).optional(), artifacts: z.array(z.object({ name: z.string(), contentSha256: z.string().length(64), sizeBytes: z.number().int().nonnegative().optional(), uri: z.string().optional() })).max(10_000).optional(), manifest: z.unknown().optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid reproducibility manifest" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const manifest = body.data.manifest && typeof body.data.manifest === "object" ? body.data.manifest as any : buildEpochExperimentReproducibilityManifest(body.data as any);
    const verification = verifyEpochExperimentReproducibilityManifest(manifest);
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "experiment_reproducibility", value: JSON.parse(JSON.stringify({ manifest, verification })) as any, evidenceIds: [], observedAt: new Date(manifest.capturedAt) } });
    sendApiSuccess(res, verification.valid ? 200 : 422, { manifest, verification, observation }, buildApiMeta(req, startedAt, { intent: "epoch_experiment_reproducibility" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/pipelines/compile",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ nodes: z.array(z.object({ id: z.string().min(1), kind: z.string().min(1), input: z.array(z.string()), output: z.array(z.string()), latencyBudgetMs: z.number().nonnegative().optional(), qualityRequirement: z.number().min(0).max(100).optional(), resources: epochJsonRecordSchema.optional(), failureBehavior: z.enum(["fail", "retry", "fallback"]).optional(), retryLimit: z.number().int().nonnegative().optional(), security: epochJsonRecordSchema.optional() }).passthrough()).min(1).max(200), edges: z.array(z.object({ from: z.string().min(1), to: z.string().min(1), contract: z.string().min(1) })).max(500), inputs: z.array(z.string()).optional(), outputs: z.array(z.string()).optional(), workload: epochJsonRecordSchema.optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid pipeline compile request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const pipeline = compileEpochPipeline(body.data);
    const workload = normalizeEpochWorkload(body.data.workload ?? {});
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "pipeline_compilation", value: JSON.parse(JSON.stringify({ pipeline, workload })) as any, evidenceIds: [], observedAt: new Date() } });
    sendApiSuccess(res, pipeline.status === "COMPILED" ? 201 : 422, { pipeline, workload, observation }, buildApiMeta(req, startedAt, { intent: "epoch_pipeline_compile" }));
  }),
);

const EpochPipelineJobInputSchema = z.object({
  missionId: z.string().min(1).max(200),
  model: z.string().min(1).max(300),
  target: z.enum(["vllm", "sglang", "tei", "tensorrt_llm", "diffusers", "nvidia_nim"]).default("vllm"),
  endpointEnvVar: z.string().regex(/^EPOCH_RUNTIME_[A-Z0-9_]+_ENDPOINT$/).optional(),
  task: z.string().max(80).optional(),
  pipeline: z.object({ nodes: z.array(epochJsonRecordSchema).min(1).max(100), edges: z.array(epochJsonRecordSchema).max(200), inputs: z.array(z.string()).optional(), outputs: z.array(z.string()).optional() }),
  input: epochJsonRecordSchema.default({}),
  maxOutputTokens: z.number().int().min(1).max(8192).optional(),
  timeoutMs: z.number().int().positive().max(900_000).optional(),
});

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/pipelines/jobs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochPipelineJobInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid pipeline job request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const mission = await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } });
    if (!mission) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
    const job = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, missionId: body.data.missionId, type: "pipeline", payload: { ...body.data } });
    sendApiSuccess(res, 202, { job }, buildApiMeta(req, startedAt, { intent: "epoch_pipeline_execution_job" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/simulation/run",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ candidates: z.array(z.object({ id: z.string().min(1), model: epochJsonRecordSchema, runtime: epochJsonRecordSchema, hardware: epochJsonRecordSchema, workload: epochJsonRecordSchema, compatibility: z.object({ status: z.enum(["COMPATIBLE", "INCOMPATIBLE", "UNKNOWN"]), reasons: z.array(z.string()), checkedAt: z.string() }) })).min(1).max(500), workload: epochJsonRecordSchema.optional(), monthlyHours: z.number().nonnegative().optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid simulation request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const simulations = simulateEpochCandidates(body.data);
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "candidate_simulation", value: JSON.parse(JSON.stringify({ simulations })) as any, evidenceIds: [], observedAt: new Date() } });
    sendApiSuccess(res, 201, { simulations, observation }, buildApiMeta(req, startedAt, { intent: "epoch_candidate_simulation" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/world-model/snapshot",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const factSchema = z.object({ value: z.unknown(), source: z.string().min(1), confidence: z.number().min(0).max(1).optional(), classification: z.enum(["OBSERVED", "INFERRED", "SIMULATED", "USER_ASSERTED", "EXTERNAL", "UNKNOWN"]).optional(), observedAt: z.string().datetime().optional() });
    const body = z.object({ facts: z.record(z.string(), factSchema), previousVersion: z.number().int().nonnegative().optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid world model snapshot" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const snapshot = buildEpochWorldModelSnapshot(body.data);
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "world_model_snapshot", value: JSON.parse(JSON.stringify(snapshot)) as any, evidenceIds: [], observedAt: new Date(snapshot.capturedAt) } });
    sendApiSuccess(res, 201, { snapshot, observation }, buildApiMeta(req, startedAt, { intent: "epoch_world_model_snapshot" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/world-model/compare",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ planned: z.unknown(), current: z.unknown(), materialKeys: z.array(z.string()).optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid world model comparison" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const comparison = compareEpochWorldStates({ planned: body.data.planned as any, current: body.data.current as any, materialKeys: body.data.materialKeys });
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "world_model_comparison", value: JSON.parse(JSON.stringify(comparison)) as any, evidenceIds: [], observedAt: new Date() } });
    sendApiSuccess(res, comparison.decision === "BLOCK_AND_REDISCOVER" ? 409 : 200, { comparison, observation }, buildApiMeta(req, startedAt, { intent: "epoch_world_model_compare" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/discovery/plan",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = z.object({ trigger: z.enum(["initial", "drift", "verification_failure", "missing_evidence", "runtime_failure"]).optional(), failedStage: z.string().optional(), failureReason: z.string().optional(), unknowns: z.array(z.object({ id: z.string(), statement: z.string(), importance: z.enum(["low", "medium", "high"]), impact: z.enum(["low", "medium", "high"]), uncertainty: z.number().min(0).max(1), costToResolve: z.number().nonnegative(), status: z.enum(["OPEN", "RESOLVED", "IGNORED"]) })).max(500).optional(), hypotheses: z.array(z.object({ id: z.string(), statement: z.string(), priorConfidence: z.number().min(0).max(1), supportingEvidenceIds: z.array(z.string()), contradictingEvidenceIds: z.array(z.string()), status: z.enum(["UNTESTED", "SUPPORTED", "REJECTED", "UNCERTAIN", "CONFIRMED"]) })).max(500).optional(), capabilityGaps: z.array(z.object({ id: z.string(), capability: z.string(), reason: z.string(), severity: z.enum(["low", "medium", "high"]), status: z.enum(["OPEN", "CLOSED"]) })).max(500).optional() }).safeParse(req.body ?? {});
    if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid discovery plan request" }, buildApiMeta(req, startedAt)); return; }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
    const plan = planEpochDiscovery(body.data);
    const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, kind: "discovery_plan", value: JSON.parse(JSON.stringify(plan)) as any, evidenceIds: [], observedAt: new Date(plan.createdAt) } });
    sendApiSuccess(res, 201, { plan, observation }, buildApiMeta(req, startedAt, { intent: "epoch_discovery_plan" }));
  }),
);

const epochKubernetesVllmSchema = z.object({ name: z.string().min(1).max(100), model: z.string().min(1).max(300), modelRevision: z.string().min(7).max(200), image: z.string().min(1).max(500), namespace: z.string().max(100).optional(), replicas: z.number().int().min(1).max(50).optional(), gpuCount: z.number().int().min(1).max(8).optional(), gpuSelector: z.string().max(200).optional(), port: z.number().int().min(1024).max(65535).optional(), context: z.string().max(200).optional() });

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/kubernetes-vllm/preflight", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = z.object({ context: z.string().max(200).optional(), requiredGpuCount: z.number().int().min(1).max(8).optional() }).safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Kubernetes preflight request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const preflight = await preflightEpochKubernetes(body.data); sendApiSuccess(res, preflight.status === "READY" ? 200 : 409, { preflight }, buildApiMeta(req, startedAt, { intent: "epoch_kubernetes_vllm_preflight" })); } catch (error) { if (error instanceof EpochKubernetesPreflightError) { sendApiError(res, 503, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/kubernetes-vllm/plan", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = epochKubernetesVllmSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Kubernetes vLLM request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { sendApiSuccess(res, 200, { plan: buildEpochKubernetesVllmCommandPlan(body.data) }, buildApiMeta(req, startedAt, { intent: "epoch_kubernetes_vllm_plan" })); } catch (error) { if (error instanceof EpochKubernetesVllmError) { sendApiError(res, 400, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/kubernetes-vllm/deploy", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = epochKubernetesVllmSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Kubernetes vLLM deployment" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const deployment = await deployEpochKubernetesVllm(body.data); sendApiSuccess(res, 201, { deployment }, buildApiMeta(req, startedAt, { intent: "epoch_kubernetes_vllm_deploy" })); } catch (error) { if (error instanceof EpochKubernetesVllmError) { sendApiError(res, 503, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post("/workspaces/:workspaceId/runtime-adapters/kubernetes-vllm/rollback", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = epochKubernetesVllmSchema.extend({ reason: z.string().min(1).max(1000) }).safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid Kubernetes vLLM rollback" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  try { const rollback = await rollbackEpochKubernetesVllm(body.data); sendApiSuccess(res, 200, { rollback }, buildApiMeta(req, startedAt, { intent: "epoch_kubernetes_vllm_rollback" })); } catch (error) { if (error instanceof EpochKubernetesVllmError) { sendApiError(res, 503, { code: error.code, message: error.message }, buildApiMeta(req, startedAt)); return; } throw error; }
}));

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/model-registry/huggingface/inspect",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = EpochHuggingFaceInspectionInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "repositoryId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const inspection = await inspectEpochHuggingFaceModel(body.data);
      const synced = body.data.sync ? await syncEpochHuggingFaceModel({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, inspection) : null;
      sendApiSuccess(res, 200, { inspection, synced }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_inspect" }));
    } catch (error) {
      if (error instanceof HuggingFaceInspectionError) {
        const status = error.code === "MODEL_NOT_FOUND" ? 404 : error.code === "INVALID_REPOSITORY_ID" ? 400 : 502;
        sendApiError(res, status, { code: error.code, message: error.message }, buildApiMeta(req, startedAt));
        return;
      }
      throw error;
    }
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/model-registry/huggingface",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochModelRegistryQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid model registry request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const models = await listSyncedEpochHuggingFaceModels({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId }, query.data.limit);
    sendApiSuccess(res, 200, { models }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_registry_list" }));
  }),
);

const DiscoveryUnknownInputSchema = z.object({
  title: z.string().min(1).max(200),
  question: z.string().min(1).max(4000),
  impact: z.enum(["low", "medium", "high", "critical"]).optional(),
  projectId: z.string().min(1).optional(),
  environmentId: z.string().min(1).optional(),
  evidence: z.array(z.unknown()).optional(),
});

const DiscoveryProgramInputSchema = z.object({
  unknownId: z.string().min(1),
  name: z.string().min(1).max(200),
  objective: z.string().min(1).max(4000),
  questions: z.array(z.string().min(1).max(1000)).optional(),
});

const HypothesisInputSchema = z.object({
  discoveryProgramId: z.string().min(1),
  statement: z.string().min(1).max(4000),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.array(z.unknown()).optional(),
});

const ExperimentInputSchema = z.object({
  discoveryProgramId: z.string().min(1),
  name: z.string().min(1).max(200),
  hypothesisId: z.string().min(1).optional(),
  missionId: z.string().min(1).optional(),
  simulationRunId: z.string().min(1).optional(),
  design: z.record(z.string(), z.unknown()).optional(),
});

const ObservationInputSchema = z.object({
  experimentId: z.string().min(1).optional(),
  missionId: z.string().min(1).optional(),
  kind: z.string().min(1).max(120),
  value: z.record(z.string(), z.unknown()),
  evidenceIds: z.array(z.string().min(1)).optional(),
});

const DriftInputSchema = z.object({
  baseline: z.record(z.string(), z.unknown()),
  current: z.record(z.string(), z.unknown()),
  thresholdsPct: z.record(z.string(), z.number().nonnegative()).optional(),
});

const MissionTelemetryInputSchema = z.object({
  workerId: z.string().min(1).max(200),
  measurements: z.record(z.string(), z.number().finite()),
  evidenceIds: z.array(z.string().min(1).max(200)).max(200).optional(),
  observedAt: z.string().datetime().optional(),
});

const ProductionTelemetryInputSchema = z.object({
  missionId: z.string().min(1).max(200).optional(),
  deploymentId: z.string().min(1).max(300),
  repositoryId: z.string().min(1).max(200).optional(),
  model: z.string().min(1).max(300).optional(),
  benchmarkPrompts: z.array(z.string().min(1).max(10_000)).max(20).optional(),
  qualityDatasetId: z.literal("epoch-local-quality-v1").optional(),
  source: z.string().min(1).max(120),
  measurements: z.record(z.string(), z.number().finite()),
  baseline: z.record(z.string(), z.number().finite()).optional(),
  thresholdsPct: z.record(z.string(), z.number().nonnegative()).optional(),
  evidenceIds: z.array(z.string().min(1).max(200)).max(200).optional(),
  observedAt: z.string().datetime().optional(),
});

epochRuntimeRouter.post("/workspaces/:workspaceId/telemetry/production", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = EpochWorkspaceParamsSchema.safeParse(req.params); const body = ProductionTelemetryInputSchema.safeParse(req.body ?? {});
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid production telemetry payload" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, params.data.workspaceId))) { sendWorkspaceNotFound(res, buildApiMeta(req, startedAt)); return; }
  const rateWindowStart = new Date(Date.now() - 60_000);
  const telemetryCount = await prisma.epochObservation.count({ where: { workspaceId: params.data.workspaceId, kind: "production_telemetry", createdAt: { gte: rateWindowStart } } });
  const telemetryLimit = Number(process.env.EPOCH_TELEMETRY_MAX_EVENTS_PER_MINUTE ?? 120);
  if (Number.isFinite(telemetryLimit) && telemetryLimit > 0 && telemetryCount >= telemetryLimit) { sendApiError(res, 429, { code: "TELEMETRY_RATE_LIMITED", message: "Telemetry rate limit exceeded for this workspace" }, buildApiMeta(req, startedAt)); return; }
  if (body.data.missionId) {
    const mission = await prisma.epochMission.findFirst({ where: { id: body.data.missionId, workspaceId: params.data.workspaceId }, select: { id: true } });
    if (!mission) { sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt)); return; }
  }
  const observedAt = body.data.observedAt ? new Date(body.data.observedAt) : new Date();
  const previous = await prisma.epochObservation.findMany({ where: { workspaceId: params.data.workspaceId, kind: "production_telemetry" }, orderBy: { observedAt: "desc" }, take: 50, select: { value: true } });
  const previousForDeployment = previous.find((item) => {
    const value = item.value && typeof item.value === "object" && !Array.isArray(item.value) ? item.value as Record<string, unknown> : {};
    return value.deploymentId === body.data.deploymentId && value.evaluation && typeof value.evaluation === "object";
  });
  const previousValue = previousForDeployment?.value && typeof previousForDeployment.value === "object" && !Array.isArray(previousForDeployment.value) ? previousForDeployment.value as Record<string, unknown> : null;
  const previousMeasurements = previousValue?.measurements && typeof previousValue.measurements === "object" && !Array.isArray(previousValue.measurements) ? previousValue.measurements as Record<string, unknown> : undefined;
  const baseline = body.data.baseline ?? previousMeasurements;
  const evaluation = evaluateEpochTelemetry({ source: body.data.source, observedAt: observedAt.toISOString(), baseline: baseline ?? {}, current: body.data.measurements, thresholdsPct: body.data.thresholdsPct });
  const payload = { deploymentId: body.data.deploymentId, source: body.data.source, measurements: body.data.measurements, baseline: baseline ?? null, evaluation, observedAt: observedAt.toISOString() };
  const observation = await prisma.epochObservation.create({ data: { workspaceId: params.data.workspaceId, missionId: body.data.missionId, kind: "production_telemetry", value: JSON.parse(JSON.stringify({ ...payload, payloadSha256: createHash("sha256").update(JSON.stringify(payload)).digest("hex") })) as any, evidenceIds: body.data.evidenceIds ?? [], observedAt } });
  let rediscovery = null;
  const reverificationJobs = [] as Array<{ type: string; id: string }>;
  if (evaluation.action === "REDISCOVER") {
    rediscovery = await createUnknown(discoveryScope(req, params.data.workspaceId), { title: "Material production telemetry drift detected", question: "What changed in the deployed system or workload, and which candidate can restore the verified outcome?", impact: "high", evidence: [{ observationId: observation.id, deploymentId: body.data.deploymentId, evaluation }] });
    if (body.data.repositoryId && body.data.model) {
      const benchmarkJob = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, missionId: body.data.missionId, type: "model_benchmark", payload: { repositoryId: body.data.repositoryId, model: body.data.model, prompts: body.data.benchmarkPrompts?.length ? body.data.benchmarkPrompts : ["Respond with exactly READY."], recoveryFromObservationId: observation.id } });
      reverificationJobs.push({ type: benchmarkJob.type, id: benchmarkJob.id });
      if (body.data.qualityDatasetId) {
        const qualityJob = await enqueueEpochJob({ workspaceId: params.data.workspaceId, userId: req.authUserId, orgId: req.authOrgId, missionId: body.data.missionId, type: "model_quality", payload: { repositoryId: body.data.repositoryId, model: body.data.model, datasetId: body.data.qualityDatasetId, recoveryFromObservationId: observation.id } });
        reverificationJobs.push({ type: qualityJob.type, id: qualityJob.id });
      }
    }
  }
  if (body.data.missionId) {
    const mission = await getMission(params.data.workspaceId, body.data.missionId);
    const currentProof = mission?.proof && typeof mission.proof === "object" && !Array.isArray(mission.proof) ? mission.proof as Record<string, unknown> : {};
    if (mission) await updateMission(params.data.workspaceId, mission.id, { proof: { ...currentProof, latestTelemetryEvaluation: evaluation, rediscoveryUnknownId: rediscovery?.id ?? currentProof.rediscoveryUnknownId ?? null } });
  }
  sendApiSuccess(res, 202, { observation, evaluation, rediscovery, reverificationJobs }, buildApiMeta(req, startedAt, { intent: "epoch_production_telemetry_evaluated" }));
}));

const EpochEventListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  subjectId: z.string().min(1).optional(),
  kind: z.string().min(1).optional(),
  correlationId: z.string().min(1).optional(),
  causationId: z.string().min(1).optional(),
  traceId: z.string().min(1).optional(),
});

function discoveryScope(req: any, workspaceId: string) {
  return {
    workspaceId,
    userId: req.authUserId,
    orgId: req.authOrgId,
    correlationId: req.header("x-correlation-id") ?? req.requestId,
  };
}

function sendDiscoveryError(req: any, res: any, startedAt: number, error: unknown): boolean {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, { status: number; message: string }> = {
    UNKNOWN_NOT_FOUND: { status: 404, message: "Unknown not found" },
    DISCOVERY_PROGRAM_NOT_FOUND: { status: 404, message: "Discovery program not found" },
    HYPOTHESIS_NOT_FOUND: { status: 404, message: "Hypothesis not found" },
    EXPERIMENT_NOT_FOUND: { status: 404, message: "Experiment not found" },
    MISSION_NOT_FOUND: { status: 404, message: "Mission not found" },
    OBSERVATION_TARGET_REQUIRED: { status: 400, message: "experimentId or missionId is required" },
  };
  const mapped = messages[code];
  if (!mapped) return false;
  sendApiError(res, mapped.status, { code, message: mapped.message }, buildApiMeta(req, startedAt));
  return true;
}

async function sendArchitectureRun(req: any, res: any, input: { workspaceId: string; missionId: string; environment?: "software" | "cloud" | "simulation" | "edge" | "sandbox"; architectureRunId?: string }, startedAt: number) {
  try {
    const trace = await buildEpochArchitectureRun(
      {
        workspaceId: input.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        correlationId: req.header("x-correlation-id") ?? undefined,
        traceId: req.header("x-trace-id") ?? undefined,
      },
      input,
    );
    sendApiSuccess(res, 200, { architectureRun: trace }, buildApiMeta(req, startedAt, { intent: "epoch_architecture_run" }));
  } catch (error) {
    if (error instanceof Error && error.message === "MISSION_NOT_FOUND") {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    throw error;
  }
}

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/architecture-runs/:missionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochArchitectureRunParamsSchema.safeParse(req.params);
    const query = EpochArchitectureRunInputSchema.safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid architecture run request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    await sendArchitectureRun(req, res, { ...params.data, ...query.data }, startedAt);
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/architecture-runs/:missionId/refresh",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochArchitectureRunParamsSchema.safeParse(req.params);
    const body = EpochArchitectureRunInputSchema.safeParse(req.body ?? {});
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid architecture run request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    await sendArchitectureRun(req, res, { ...params.data, ...body.data }, startedAt);
  }),
);

function outcomeScope(req: any, workspaceId: string) {
  const correlationId = req.header("x-correlation-id") ?? req.requestId;
  return {
    workspaceId,
    userId: req.authUserId,
    orgId: req.authOrgId,
    correlationId,
    traceId: req.header("x-trace-id") ?? correlationId,
    causationId: req.header("x-causation-id") ?? undefined,
  };
}

function sendOutcomeError(req: any, res: any, startedAt: number, error: unknown): boolean {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, { status: number; message: string }> = {
    MISSION_NOT_FOUND: { status: 404, message: "Mission not found" },
    VERIFICATION_NOT_FOUND: { status: 404, message: "Verification run not found for mission" },
    EVIDENCE_NOT_FOUND: { status: 404, message: "One or more evidence records were not found for mission" },
    OUTCOME_NOT_FOUND: { status: 404, message: "Outcome not found" },
  };
  const mapped = messages[code];
  if (!mapped) return false;
  sendApiError(res, mapped.status, { code, message: mapped.message }, buildApiMeta(req, startedAt));
  return true;
}

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/outcome",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and missionId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const outcome = await getMissionOutcome(outcomeScope(req, params.data.workspaceId), params.data.missionId);
      sendApiSuccess(res, 200, { outcome }, buildApiMeta(req, startedAt, { intent: "epoch_get_outcome" }));
    } catch (error) {
      if (!sendOutcomeError(req, res, startedAt, error)) throw error;
    }
  }),
);

epochRuntimeRouter.put(
  "/workspaces/:workspaceId/missions/:missionId/outcome",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochOutcomeInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid outcome request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const outcome = await upsertMissionOutcome(outcomeScope(req, params.data.workspaceId), params.data.missionId, body.data);
      sendApiSuccess(res, 200, { outcome }, buildApiMeta(req, startedAt, { intent: "epoch_record_outcome" }));
    } catch (error) {
      if (!sendOutcomeError(req, res, startedAt, error)) throw error;
    }
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/outcomes/:outcomeId/experience",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), outcomeId: z.string().min(1) }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and outcomeId are required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const experience = await getOutcomeExperience(outcomeScope(req, params.data.workspaceId), params.data.outcomeId);
    sendApiSuccess(res, 200, { experience }, buildApiMeta(req, startedAt, { intent: "epoch_get_experience" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/outcomes/:outcomeId/experience",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({ workspaceId: z.string().min(1), outcomeId: z.string().min(1) }).safeParse(req.params);
    const body = EpochExperienceInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid experience request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const experience = await upsertOutcomeExperience(outcomeScope(req, params.data.workspaceId), params.data.outcomeId, body.data);
      sendApiSuccess(res, 201, { experience }, buildApiMeta(req, startedAt, { intent: "epoch_record_experience" }));
    } catch (error) {
      if (!sendOutcomeError(req, res, startedAt, error)) throw error;
    }
  }),
);

epochRuntimeRouter.get(
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

function paginate<T extends { id: string; updatedAt?: Date; createdAt?: Date }>(
  rows: T[],
  query: { limit?: number; cursor?: string },
  getSortAt: (row: T) => string,
) {
  const limit = Math.max(1, Math.min(100, Math.floor(query.limit ?? 25)));
  const sorted = [...rows].sort((a, b) => getSortAt(b).localeCompare(getSortAt(a)) || b.id.localeCompare(a.id));
  const items = sorted.slice(0, limit);
  return { items, nextCursor: null, hasMore: false, total: sorted.length };
}

epochRuntimeRouter.get(
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
    const summary = await summarizeInstitutionService(params.data.workspaceId);
    sendApiSuccess(res, 200, { institutions: summary.recent.institutions, page: paginate(summary.recent.institutions, query.success ? query.data : {}, (row) => row.updatedAt.toISOString()) }, buildApiMeta(req, startedAt, { intent: "epoch_list_institutions" }));
  }),
);

epochRuntimeRouter.post(
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
    const institution = await createInstitution({
      workspaceId: params.data.workspaceId,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      ...body.data,
    });
    sendApiSuccess(res, 201, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_create_institution" }));
  }),
);

epochRuntimeRouter.get(
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
    const institution = await getInstitution(params.data.workspaceId, params.data.institutionId);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_get_institution" }));
  }),
);

epochRuntimeRouter.patch(
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
    const institution = await updateInstitution(params.data.workspaceId, params.data.institutionId, body.data);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_update_institution" }));
  }),
);

epochRuntimeRouter.post(
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
    const institution = await archiveInstitution(params.data.workspaceId, params.data.institutionId);
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_archive_institution" }));
  }),
);

epochRuntimeRouter.post(
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
    const institution = await cloneInstitution(params.data.workspaceId, params.data.institutionId, {
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      ...body.data,
    });
    if (!institution) {
      sendApiError(res, 404, { code: "INSTITUTION_NOT_FOUND", message: "Institution not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 201, { institution }, buildApiMeta(req, startedAt, { intent: "epoch_clone_institution" }));
  }),
);

epochRuntimeRouter.get(
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
    const versions = await listInstitutionVersions(params.data.workspaceId, params.data.institutionId);
    sendApiSuccess(res, 200, { versions, page: paginate(versions, query.success ? query.data : {}, (row) => row.createdAt.toISOString()) }, buildApiMeta(req, startedAt, { intent: "epoch_list_institution_versions" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/missions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochMissionListQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const summary = await summarizeMissionService(params.data.workspaceId);
    sendApiSuccess(res, 200, { missions: summary.recent, page: paginate(summary.recent, query.success ? query.data : {}, (row) => row.updatedAt.toISOString()) }, buildApiMeta(req, startedAt, { intent: "epoch_list_missions" }));
  }),
);

epochRuntimeRouter.post(
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
    const mission = await createMission({
      workspaceId: params.data.workspaceId,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      ...body.data,
      deadlineAt: body.data.deadlineAt ? new Date(body.data.deadlineAt) : undefined,
    });
    sendApiSuccess(res, 201, { mission }, buildApiMeta(req, startedAt, { intent: "epoch_create_mission" }));
  }),
);

epochRuntimeRouter.get(
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
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { mission }, buildApiMeta(req, startedAt, { intent: "epoch_get_mission" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/decision",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochDecisionInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid decision request" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const decision = rankEpochCandidates({ evaluations: body.data.evaluations as never[], objectives: body.data.objectives });
    const executionPlan = decision.winner
      ? buildEpochExecutionPlan({ candidateId: decision.winner.candidateId })
      : null;
    const decisionRecord = { ...decision, executionPlan };
    const currentProof = mission.proof && typeof mission.proof === "object" && !Array.isArray(mission.proof) ? mission.proof as Record<string, unknown> : {};
    const currentResult = mission.result && typeof mission.result === "object" && !Array.isArray(mission.result) ? mission.result as Record<string, unknown> : {};
    await updateMission(params.data.workspaceId, params.data.missionId, {
      result: { ...currentResult, decision: decisionRecord },
      proof: { ...currentProof, decision: decisionRecord },
    });
    sendApiSuccess(res, 200, { decision: decisionRecord }, buildApiMeta(req, startedAt, { intent: "epoch_decide_candidates" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/missions/:missionId/lifecycle",
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
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const [queueStatus, queueJobs, gate] = await Promise.all([
      getEpochQueueStatus(params.data.workspaceId),
      listEpochQueueJobsForMission(params.data.workspaceId, params.data.missionId),
      getMissionAuthorityGate(params.data.workspaceId, params.data.missionId),
    ]);
    sendApiSuccess(
      res,
      200,
      {
        mission: {
          id: mission.id,
          state: mission.state,
          currentStep: mission.currentStep,
          startedAt: mission.startedAt?.toISOString() ?? null,
          completedAt: mission.completedAt?.toISOString() ?? null,
          timeline: mission.timeline,
          result: mission.result,
          plan: mission.plan,
        },
        gate,
        queue: {
          status: queueStatus,
          jobs: queueJobs,
        },
        stageHistory: Array.isArray(mission.timeline) ? mission.timeline : [],
      },
      buildApiMeta(req, startedAt, { intent: "epoch_mission_lifecycle" }),
    );
  }),
);

epochRuntimeRouter.patch(
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
    let mission;
    try {
      mission = await updateMission(params.data.workspaceId, params.data.missionId, {
        ...body.data,
        startedAt: body.data.startedAt ? new Date(body.data.startedAt) : undefined,
        completedAt: body.data.completedAt ? new Date(body.data.completedAt) : undefined,
      });
    } catch (error) {
      if (error instanceof EpochMissionTransitionError) {
        sendApiError(
          res,
          409,
          { code: error.code, message: error.message, details: { from: error.from, to: error.to } },
          buildApiMeta(req, startedAt),
        );
        return;
      }
      throw error;
    }
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { mission }, buildApiMeta(req, startedAt, { intent: "epoch_update_mission" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/run",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = RunEpochMissionSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid mission run payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }

    const result = await executeMission({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      ...body.data,
    });

    if (!result) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    if ("blocked" in result || "approvalRequired" in result) {
      sendApiSuccess(
        res,
        409,
        {
          missionId: mission.id,
          result,
        },
        buildApiMeta(req, startedAt, { intent: "epoch_run_mission" }),
      );
      return;
    }

    sendApiSuccess(
      res,
      201,
      {
        missionId: mission.id,
        result,
      },
      buildApiMeta(req, startedAt, { intent: "epoch_run_mission" }),
    );
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/queue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochQueueEnqueueSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid queue payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const job = await enqueueEpochJob({
      workspaceId: params.data.workspaceId,
      institutionId: body.data.institutionId ?? mission.institutionId,
      missionId: mission.id,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      type: body.data.type,
      payload: body.data.payload,
    });
    sendApiSuccess(res, 201, { job }, buildApiMeta(req, startedAt, { intent: "epoch_queue_job" }));
  }),
);

epochRuntimeRouter.get(
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
    const gate = await getMissionAuthorityGate(params.data.workspaceId, params.data.missionId);
    if (!gate) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { gate }, buildApiMeta(req, startedAt, { intent: "epoch_authority_gate" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/authority",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = z.object({
      name: z.string().min(1).optional(),
      canExecute: z.boolean().optional(),
      needsApproval: z.boolean().optional(),
      blocked: z.boolean().optional(),
      permissions: z.array(z.string()).optional(),
      budgets: z.record(z.string(), z.unknown()).optional(),
      approvals: z.array(z.string()).optional(),
      checks: z.array(z.string()).optional(),
      proof: z.record(z.string(), z.unknown()).optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid authority payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const policy = await createMissionAuthorityPolicy({
      workspaceId: params.data.workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      ...body.data,
    });
    sendApiSuccess(res, 201, { policy }, buildApiMeta(req, startedAt, { intent: "epoch_create_authority_policy" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/telemetry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = MissionTelemetryInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid mission telemetry payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const worker = await prisma.epochWorker.findFirst({ where: { id: body.data.workerId, workspaceId: params.data.workspaceId, retiredAt: null }, select: { id: true } });
    if (!worker) {
      sendApiError(res, 404, { code: "WORKER_NOT_FOUND", message: "Worker not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const observation = await recordObservation(discoveryScope(req, params.data.workspaceId), {
      missionId: params.data.missionId,
      kind: "worker_telemetry",
      value: { workerId: body.data.workerId, measurements: body.data.measurements, observedAt: body.data.observedAt ?? new Date().toISOString() },
      evidenceIds: body.data.evidenceIds,
    });
    sendApiSuccess(res, 202, { observation, workerId: worker.id }, buildApiMeta(req, startedAt, { intent: "epoch_mission_worker_telemetry" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/verification-window",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = EpochVerificationWindowInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid verification-window payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const verification = verifyEpochOutcome(body.data);
    const status = verification.status === "ACHIEVED" ? "achieved" : verification.status === "NOT_ACHIEVED" ? "not_achieved" : "unknown";
    const outcome = await upsertMissionOutcome(outcomeScope(req, params.data.workspaceId), params.data.missionId, {
      status,
      summary: `Verification window result: ${verification.status}`,
      evidenceIds: body.data.evidenceIds,
      customerResult: verification,
    });
    const currentProof = mission.proof && typeof mission.proof === "object" && !Array.isArray(mission.proof) ? mission.proof as Record<string, unknown> : {};
    await updateMission(params.data.workspaceId, params.data.missionId, {
      proof: { ...currentProof, verificationWindow: verification },
    });
    sendApiSuccess(res, 201, { verification, outcome }, buildApiMeta(req, startedAt, { intent: "epoch_verify_outcome_window" }));
  }),
);

epochRuntimeRouter.post(
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
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const evidence = await recordEvidence({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      executionRunId: mission.executionRun?.id,
      userId: (req as any).authUserId,
      evidence: body.data.evidence,
    });
    sendApiSuccess(res, 201, { evidence }, buildApiMeta(req, startedAt, { intent: "epoch_add_evidence" }));
  }),
);

epochRuntimeRouter.post(
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
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const verification = await verifyMission({
      workspaceId: params.data.workspaceId,
      missionId: params.data.missionId,
      executionRunId: mission.executionRun?.id,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      evidence: body.data.evidenceIds?.map((id) => ({ id })) ?? undefined,
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

epochRuntimeRouter.get(
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
    const executions = await listEpochExecutionRuns({
      workspaceId: params.data.workspaceId,
      missionId: query.success ? query.data.missionId : undefined,
    });
    sendApiSuccess(
      res,
      200,
      {
        executions,
        page: paginate(executions, query.success ? query.data : {}, (row) => row.updatedAt.toISOString()),
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_executions" }),
    );
  }),
);

epochRuntimeRouter.get(
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

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/queue/jobs",
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
    sendApiSuccess(res, 200, { page }, buildApiMeta(req, startedAt, { intent: "epoch_queue_jobs" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/queue/jobs/:jobId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      jobId: z.string().min(1),
    }).safeParse(req.params);
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
      sendApiError(res, 404, { code: "QUEUE_JOB_NOT_FOUND", message: "Queue job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_queue_job_detail" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/queue/jobs/:jobId/retry",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      jobId: z.string().min(1),
    }).safeParse(req.params);
    const body = EpochQueueRecoverySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid retry payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const job = await retryDeadLetterEpochJob(params.data.jobId, {
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      delayMs: body.data.delayMs,
      reason: body.data.reason,
    });
    if (!job) {
      sendApiError(res, 404, { code: "QUEUE_JOB_NOT_FOUND", message: "Queue job not found or not dead-lettered" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_retry_queue_job" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/queue/jobs/:jobId/dead-letter",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      jobId: z.string().min(1),
    }).safeParse(req.params);
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
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
    });
    if (!job) {
      sendApiError(res, 404, { code: "QUEUE_JOB_NOT_FOUND", message: "Queue job not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { job }, buildApiMeta(req, startedAt, { intent: "epoch_dead_letter_queue_job" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/queue/dead-letters",
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
    const deadLetters = await listEpochDeadLetters(params.data.workspaceId);
    sendApiSuccess(res, 200, { deadLetters }, buildApiMeta(req, startedAt, { intent: "epoch_queue_dead_letters" }));
  }),
);

epochRuntimeRouter.get(
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
    const execution = await getExecutionRun(params.data.workspaceId, params.data.executionRunId);
    if (!execution) {
      sendApiError(res, 404, { code: "EXECUTION_NOT_FOUND", message: "Execution run not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { execution }, buildApiMeta(req, startedAt, { intent: "epoch_get_execution" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/certificates",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochCertificateListViewQuerySchema.safeParse(req.query);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const certificates = await prisma.epochCertificate.findMany({
      where: {
        workspaceId: params.data.workspaceId,
        ...(query.success && query.data.missionId ? { missionId: query.data.missionId } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    sendApiSuccess(
      res,
      200,
      {
        certificates,
        page: paginate(certificates, query.success ? query.data : {}, (row) => row.createdAt.toISOString()),
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_certificates" }),
    );
  }),
);

epochRuntimeRouter.get(
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
    const certificate = await getCertificate(params.data.workspaceId, params.data.certificateId);
    if (!certificate) {
      sendApiError(res, 404, { code: "CERTIFICATE_NOT_FOUND", message: "Certificate not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { certificate }, buildApiMeta(req, startedAt, { intent: "epoch_get_certificate" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/certificate",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = z.object({
      summary: z.string().max(4000).optional(),
      approvals: z.array(z.string().min(1).max(500)).max(20).optional(),
      evidenceSummary: z.record(z.string(), z.unknown()).optional(),
      auditTrail: z.array(z.record(z.string(), z.unknown())).optional(),
      proof: z.record(z.string(), z.unknown()).optional(),
    }).safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid certificate payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const certificate = await issueCertificate({
      workspaceId: params.data.workspaceId,
      missionId: mission.id,
      verificationRunId: mission.verificationRun?.id,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      summary: body.data.summary,
      approvals: body.data.approvals,
      evidenceSummary: body.data.evidenceSummary,
      auditTrail: body.data.auditTrail,
      proof: body.data.proof,
    });
    sendApiSuccess(res, 201, { certificate }, buildApiMeta(req, startedAt, { intent: "epoch_issue_certificate" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/memory",
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
    const memories = await listEpochMemoryRecords({
      workspaceId: params.data.workspaceId,
      institutionId: query.success ? query.data.institutionId : undefined,
      missionId: query.success ? query.data.missionId : undefined,
    });
    sendApiSuccess(
      res,
      200,
      {
        memories,
        page: paginate(memories, query.success ? query.data : {}, (row) => row.updatedAt.toISOString()),
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_memory" }),
    );
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/memory/:memoryRecordId",
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
    const memory = await getMemoryRecord(params.data.workspaceId, params.data.memoryRecordId);
    if (!memory) {
      sendApiError(res, 404, { code: "MEMORY_NOT_FOUND", message: "Memory record not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(res, 200, { memory }, buildApiMeta(req, startedAt, { intent: "epoch_get_memory" }));
  }),
);

epochRuntimeRouter.get(
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
    const integrations = await listEpochIntegrations({ workspaceId: params.data.workspaceId });
    const filtered = query.success && query.data.institutionId
      ? integrations.filter((integration) => integration.institutionId === query.data.institutionId)
      : integrations;
    sendApiSuccess(
      res,
      200,
      {
        integrations: filtered,
        page: paginate(filtered, query.success ? query.data : {}, (row) => row.updatedAt.toISOString()),
      },
      buildApiMeta(req, startedAt, { intent: "epoch_list_integrations" }),
    );
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/integrations/providers",
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
    const integrationSummary = await summarizeIntegrationService(params.data.workspaceId);
    sendApiSuccess(
      res,
      200,
      {
        supportedConnectors: getSupportedConnectorProfiles(),
        providerSummary: integrationSummary.providers,
        connectorGuides: Object.fromEntries(
          getSupportedConnectorProfiles().map((profile) => [
            profile.provider,
            getSupportedConnectorMissionGuide(profile.provider),
          ]),
        ),
      },
      buildApiMeta(req, startedAt, { intent: "epoch_integration_providers" }),
    );
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/integrations/:integrationId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = z.object({
      workspaceId: z.string().min(1),
      integrationId: z.string().min(1),
    }).safeParse(req.params);
    if (!params.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "integrationId is required" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const integration = await getIntegration(params.data.workspaceId, params.data.integrationId);
    if (!integration) {
      sendApiError(res, 404, { code: "INTEGRATION_NOT_FOUND", message: "Integration not found" }, buildApiMeta(req, startedAt));
      return;
    }
    sendApiSuccess(
      res,
      200,
      {
        integration,
        profile: getSupportedConnectorProfile(integration.provider),
        missionGuide: getSupportedConnectorMissionGuide(integration.provider),
      },
      buildApiMeta(req, startedAt, { intent: "epoch_get_integration" }),
    );
  }),
);

epochRuntimeRouter.post(
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
    const integration = await upsertIntegration({
      workspaceId: params.data.workspaceId,
      institutionId: body.data.institutionId,
      userId: (req as any).authUserId,
      orgId: (req as any).authOrgId,
      name: body.data.name,
      provider: body.data.provider,
      status: body.data.status,
      config: body.data.config,
      proof: body.data.proof,
    });
    sendApiSuccess(res, 201, { integration }, buildApiMeta(req, startedAt, { intent: "epoch_upsert_integration" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/discovery/state",
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
    const state = await listDiscoveryState(params.data.workspaceId);
    sendApiSuccess(res, 200, state, buildApiMeta(req, startedAt, { intent: "epoch_discovery_state" }));
  }),
);

epochRuntimeRouter.get(
  "/workspaces/:workspaceId/events",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const query = EpochEventListQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid event query" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const events = await listEpochRuntimeEvents({
      userId: (req as any).authUserId,
      workspaceId: params.data.workspaceId,
      limit: query.data.limit,
      subjectId: query.data.subjectId,
      kind: query.data.kind as never,
      correlationId: query.data.correlationId,
      causationId: query.data.causationId,
      traceId: query.data.traceId,
    });
    sendApiSuccess(res, 200, { events, count: events.length }, buildApiMeta(req, startedAt, { intent: "epoch_list_events" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/unknowns",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = DiscoveryUnknownInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid unknown payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const unknown = await createUnknown(discoveryScope(req, params.data.workspaceId), body.data);
    sendApiSuccess(res, 201, { unknown }, buildApiMeta(req, startedAt, { intent: "epoch_create_unknown" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/discovery-programs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = DiscoveryProgramInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid discovery program payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const discoveryProgram = await createDiscoveryProgram(discoveryScope(req, params.data.workspaceId), body.data);
      sendApiSuccess(res, 201, { discoveryProgram }, buildApiMeta(req, startedAt, { intent: "epoch_create_discovery_program" }));
    } catch (error) {
      if (!sendDiscoveryError(req, res, startedAt, error)) throw error;
    }
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/hypotheses",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = HypothesisInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid hypothesis payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const hypothesis = await createHypothesis(discoveryScope(req, params.data.workspaceId), body.data);
      sendApiSuccess(res, 201, { hypothesis }, buildApiMeta(req, startedAt, { intent: "epoch_create_hypothesis" }));
    } catch (error) {
      if (!sendDiscoveryError(req, res, startedAt, error)) throw error;
    }
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/experiments",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = ExperimentInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid experiment payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const experiment = await createExperiment(discoveryScope(req, params.data.workspaceId), body.data);
      sendApiSuccess(res, 201, { experiment }, buildApiMeta(req, startedAt, { intent: "epoch_create_experiment" }));
    } catch (error) {
      if (!sendDiscoveryError(req, res, startedAt, error)) throw error;
    }
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/missions/:missionId/drift",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochMissionParamsSchema.safeParse(req.params);
    const body = DriftInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid drift payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    const mission = await getMission(params.data.workspaceId, params.data.missionId);
    if (!mission) {
      sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
      return;
    }
    const report = detectEpochDrift(body.data);
    const observation = await recordObservation(discoveryScope(req, params.data.workspaceId), {
      missionId: params.data.missionId,
      kind: "drift",
      value: report,
    });
    let rediscovery = null;
    if (report.material) {
      rediscovery = await createUnknown(discoveryScope(req, params.data.workspaceId), {
        title: "Material production drift detected",
        question: "What changed in the deployed system or workload, and which candidate can restore the verified outcome?",
        impact: "high",
        evidence: [{ observationId: observation.id, report }],
      });
    }
    const currentProof = mission.proof && typeof mission.proof === "object" && !Array.isArray(mission.proof) ? mission.proof as Record<string, unknown> : {};
    await updateMission(params.data.workspaceId, params.data.missionId, {
      proof: { ...currentProof, latestDrift: report, rediscoveryUnknownId: rediscovery?.id ?? null },
    });
    sendApiSuccess(res, 201, { report, observation, rediscovery }, buildApiMeta(req, startedAt, { intent: "epoch_detect_drift" }));
  }),
);

epochRuntimeRouter.post(
  "/workspaces/:workspaceId/observations",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const params = EpochWorkspaceParamsSchema.safeParse(req.params);
    const body = ObservationInputSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid observation payload" }, buildApiMeta(req, startedAt));
      return;
    }
    if (!(await resolveWorkspace(req, params.data.workspaceId))) {
      sendWorkspaceNotFound(res, buildApiMeta(req, startedAt));
      return;
    }
    try {
      const observation = await recordObservation(discoveryScope(req, params.data.workspaceId), body.data);
      sendApiSuccess(res, 201, { observation }, buildApiMeta(req, startedAt, { intent: "epoch_record_observation" }));
    } catch (error) {
      if (!sendDiscoveryError(req, res, startedAt, error)) throw error;
    }
  }),
);

import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import {
  ModelProfileSchema,
  CapabilitySchema,
  AuthorityGrantSchema,
  HypothesisSchema,
  ObservationSchema,
  OutcomeContractSchema,
  PolicySchema,
  StateSnapshotSchema,
  RealityEntitySchema,
  UnknownSchema,
  WorkloadProfileSchema,
  EnvironmentSchema,
  TeachingRecordSchema,
  composeCanonicalCandidates,
  compileEpochComposerRequest,
  getCanonicalArtifact,
  listCanonicalArtifacts,
  createCanonicalExperiment,
  buildAndPersistLesson,
  buildAndPersistTeachingDataset,
  buildAndPersistWorldExperience,
  persistCanonicalEvidence,
  persistCanonicalVerification,
  persistCanonicalBenchmark,
  persistCanonicalArtifact,
  persistCanonicalDecision,
  prepareCanonicalExecution,
  persistModelRevision,
  persistSkillRevision,
  persistAgentPolicyRevision,
  persistWorldModel,
  appendCanonicalRuntimeEvent,
  listCanonicalRuntimeEvents,
  CANONICAL_ADAPTERS,
  inspectCanonicalModel,
  buildCanonicalTelemetryObservation,
  buildRuntimeCapability,
  transitionCanonicalExecution,
  executeCanonicalRuntimeAction,
} from "../../lib/epoch/canonical";
import { z } from "zod";
import { createEpochInstitution, createEpochMission, getEpochMission } from "../../lib/epoch/epochStore";
import { normalizeEpochInputEnvelope } from "../../lib/epoch/inputIntelligence";
import { claimEpochOutboxEvent } from "../../lib/epoch/v13/outboxService";

const ComposerRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  input: z.union([z.string().min(1).max(100_000), z.record(z.string(), z.unknown())]),
  source: z.string().min(1).max(200).optional(),
  modality: z.enum(["text", "api", "system"]).optional(),
});

export const epochCanonicalRouter = Router();

async function resolveWorkspace(req: { authUserId?: string; authOrgId?: string }, workspaceId: string): Promise<boolean> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: req.authUserId,
      ...(req.authOrgId ? { orgId: req.authOrgId } : {}),
    },
    select: { id: true },
  });
  return Boolean(workspace);
}

epochCanonicalRouter.post("/composer/compile", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = ComposerRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and composer input are required" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }

  try {
    const plan = compileEpochComposerRequest({
      workspaceId: body.data.workspaceId,
      actorId: req.authUserId,
      input: body.data.input,
      source: body.data.source ?? "api",
      modality: body.data.modality ?? "api",
    });
    sendApiSuccess(res, 200, { plan }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_compiler" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Composer compilation failed";
    sendApiError(res, 422, { code: "COMPOSER_COMPILATION_FAILED", message }, buildApiMeta(req, startedAt));
  }
}));

const PersistedComposerRequestSchema = ComposerRequestSchema.extend({
  idempotencyKey: z.string().min(8).max(200).optional(),
});

epochCanonicalRouter.post("/composer/compile-and-create", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = PersistedComposerRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and composer input are required" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }

  try {
    const source = body.data.source ?? "api";
    const modality = body.data.modality ?? "api";
    const rawContent = typeof body.data.input === "string" ? body.data.input : JSON.stringify(body.data.input);
    const inputEnvelope = normalizeEpochInputEnvelope({
      content: rawContent,
      source,
      modality,
      ...(body.data.idempotencyKey ? { id: `composer_${body.data.idempotencyKey}` } : {}),
    });
    const existingInput = await prisma.epochInputEnvelope.findFirst({
      where: { workspaceId: body.data.workspaceId, contentSha256: inputEnvelope.contentSha256 },
      select: { missionId: true },
      orderBy: { createdAt: "desc" },
    });
    if (existingInput) {
      const existingMission = await getEpochMission(body.data.workspaceId, existingInput.missionId);
      if (existingMission) {
        sendApiSuccess(res, 200, { created: false, reused: true, mission: existingMission }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_mission_reused" }));
        return;
      }
    }

    const plan = compileEpochComposerRequest({
      workspaceId: body.data.workspaceId,
      actorId: req.authUserId,
      input: body.data.input,
      source,
      modality,
    });
    let institution = await prisma.epochInstitution.findFirst({
      where: { workspaceId: body.data.workspaceId, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (!institution) {
      const createdInstitution = await createEpochInstitution({
        workspaceId: body.data.workspaceId,
        userId: req.authUserId,
        orgId: req.authOrgId,
        name: "Epoch Computational Reality",
        category: "reality-intelligence",
        version: "canonical.v1",
        summary: "Default institution for canonical Epoch missions.",
        metadata: { source: "canonical-composer" },
        proof: { contractVersion: "epoch.canonical.v1" },
      });
      institution = { id: createdInstitution.id };
    }
    const created = await createEpochMission({
      workspaceId: body.data.workspaceId,
      institutionId: institution.id,
      userId: req.authUserId,
      orgId: req.authOrgId,
      title: plan.mission.title,
      objective: plan.mission.objective,
      acceptanceCriteria: plan.outcomeContract.successCriteria,
      constraints: {
        metrics: plan.outcomeContract.targetMetrics.flatMap((metric) => {
          if (metric.target === undefined || !["lt", "lte", "gte", "gt", "eq"].includes(metric.operator)) return [];
          return [{ metric: metric.metric, operator: metric.operator === "lt" ? "<" : metric.operator === "lte" ? "<=" : metric.operator === "gte" ? ">=" : metric.operator === "gt" ? ">" : "=", target: metric.target, unit: metric.unit }];
        }),
      },
      baseline: plan.outcomeContract.baseline,
      workload: {},
      authority: {
        name: "Canonical Composer Mission Authority",
        canExecute: false,
        needsApproval: true,
        permissions: ["reality.read", "capability.read", "experiment.create"],
        approvals: ["human"],
        checks: ["tenant", "policy", "freshness", "evidence", "verification"],
      },
      proof: {
        canonicalPlan: plan,
        idempotencyKey: body.data.idempotencyKey ?? null,
      },
      inputEnvelope: {
        id: inputEnvelope.id,
        modality: inputEnvelope.modality,
        source: inputEnvelope.source,
        trust: inputEnvelope.trust,
        content: inputEnvelope.content,
        contentType: inputEnvelope.contentType,
        metadata: inputEnvelope.metadata,
        capturedAt: inputEnvelope.capturedAt,
        sensitivity: inputEnvelope.sensitivity,
        classification: inputEnvelope.classification,
        validFrom: inputEnvelope.validFrom,
        validUntil: inputEnvelope.validUntil,
        ingestionVersion: inputEnvelope.ingestionVersion,
      },
    });
    const mission = await getEpochMission(body.data.workspaceId, created.id);
    const persistedPlan = mission
      ? {
          ...plan,
          outcomeContract: { ...plan.outcomeContract, missionId: created.id },
          mission: { ...plan.mission, id: created.id, authorityPolicyId: mission.authorityPolicies[0]?.id ?? plan.mission.authorityPolicyId },
        }
      : plan;
    await Promise.all([
      persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "Intent", objectId: persistedPlan.intent.id, missionId: created.id, payload: persistedPlan.intent, provenance: { classification: "USER_ASSERTED", source: source, inputId: inputEnvelope.id }, correlationId: persistedPlan.intent.correlation.correlationId, traceId: persistedPlan.intent.correlation.traceId, idempotencyKey: body.data.idempotencyKey }),
      persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "OutcomeContract", objectId: persistedPlan.outcomeContract.id, missionId: created.id, payload: persistedPlan.outcomeContract, provenance: { classification: "INFERRED", source: "canonical-composer", inputId: inputEnvelope.id }, correlationId: persistedPlan.outcomeContract.correlation.correlationId, traceId: persistedPlan.outcomeContract.correlation.traceId, idempotencyKey: body.data.idempotencyKey }),
      persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "Mission", objectId: persistedPlan.mission.id, missionId: created.id, payload: persistedPlan.mission, provenance: { classification: "OBSERVED", source: "epoch-mission-store", inputId: inputEnvelope.id }, correlationId: persistedPlan.mission.correlation.correlationId, traceId: persistedPlan.mission.correlation.traceId, idempotencyKey: body.data.idempotencyKey }),
    ]);
    sendApiSuccess(res, 201, { created: true, reused: false, plan: persistedPlan, mission }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_mission_created" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Canonical mission creation failed";
    sendApiError(res, 422, { code: "CANONICAL_MISSION_CREATION_FAILED", message }, buildApiMeta(req, startedAt));
  }
}));

const CandidateCompositionSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  model: z.unknown(),
  workload: z.unknown(),
  runtimes: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
  hardware: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
  policyAllowed: z.boolean().optional(),
  maxCandidates: z.number().int().positive().max(500).optional(),
});

async function validateCandidateCompositionRequest(req: Request, body: z.infer<typeof CandidateCompositionSchema>, startedAt: number, res: Response) {
  if (!(await resolveWorkspace(req, body.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return null;
  }
  const mission = await getEpochMission(body.workspaceId, body.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return null;
  }
  const model = ModelProfileSchema.safeParse(body.model);
  const workload = WorkloadProfileSchema.safeParse(body.workload);
  if (!model.success || !workload.success || model.data.workspaceId !== body.workspaceId || workload.data.workspaceId !== body.workspaceId) {
    sendApiError(res, 422, { code: "INVALID_CANONICAL_INPUT", message: "Model and workload must be valid canonical records in the request workspace" }, buildApiMeta(req, startedAt));
    return null;
  }
  return { mission, model: model.data, workload: workload.data };
}

epochCanonicalRouter.post("/candidates/compose", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = CandidateCompositionSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "mission, environment, model, workload, runtimes, and hardware are required" }, buildApiMeta(req, startedAt));
    return;
  }
  const validated = await validateCandidateCompositionRequest(req, body.data, startedAt, res);
  if (!validated) return;
  const candidates = composeCanonicalCandidates({
    missionId: body.data.missionId,
    environmentId: body.data.environmentId,
    model: validated.model,
    workload: validated.workload,
    runtimes: body.data.runtimes,
    hardware: body.data.hardware,
    policyAllowed: body.data.policyAllowed,
    maxCandidates: body.data.maxCandidates,
  });
  sendApiSuccess(res, 200, { candidates, count: candidates.length }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_candidate_composition" }));
}));

epochCanonicalRouter.post("/candidates/compose-and-persist", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = CandidateCompositionSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "mission, environment, model, workload, runtimes, and hardware are required" }, buildApiMeta(req, startedAt));
    return;
  }
  const validated = await validateCandidateCompositionRequest(req, body.data, startedAt, res);
  if (!validated) return;
  const candidates = composeCanonicalCandidates({
    missionId: body.data.missionId,
    environmentId: body.data.environmentId,
    model: validated.model,
    workload: validated.workload,
    runtimes: body.data.runtimes,
    hardware: body.data.hardware,
    policyAllowed: body.data.policyAllowed,
    maxCandidates: body.data.maxCandidates,
  });
  const persisted = await Promise.all(candidates.map((candidate) => persistCanonicalArtifact({
    workspaceId: body.data.workspaceId,
    objectType: "CandidateSystem",
    objectId: candidate.id,
    missionId: body.data.missionId,
    parentId: validated.model.id,
    payload: candidate,
    provenance: { classification: candidate.compatibility === "compatible" ? "INFERRED" : "UNKNOWN", source: "canonical-compatibility-engine", modelId: validated.model.id, workloadId: validated.workload.id },
    correlationId: candidate.correlation.correlationId,
    traceId: candidate.correlation.traceId,
  })));
  sendApiSuccess(res, 201, { candidates, persisted: persisted.length, count: candidates.length }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_candidates_persisted" }));
}));

const ExperimentRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  candidateId: z.string().min(1).max(200),
  hypothesisId: z.string().min(1).max(200).optional(),
  type: z.enum(["simulation", "sandbox", "benchmark", "controlled_test", "shadow", "canary", "ab_test", "counterfactual", "intervention"]),
  baseline: z.record(z.string(), z.unknown()),
  intervention: z.record(z.string(), z.unknown()),
  controls: z.record(z.string(), z.unknown()).optional(),
  metrics: z.array(z.string().min(1).max(200)).min(1).max(100),
  durationSeconds: z.number().int().positive().max(86_400),
  sampleSize: z.number().int().positive().max(1_000_000).optional(),
  safetyConstraints: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  rollback: z.record(z.string(), z.unknown()),
  evidenceRequirements: z.array(z.string().min(1).max(200)).max(100).optional(),
  verdictRules: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
});

function requestCorrelation(req: Request, fallback: string) {
  const header = req.headers["x-correlation-id"];
  const correlationId = typeof header === "string" && header.trim() ? header.trim() : `correlation_${fallback}`;
  const traceHeader = req.headers["x-trace-id"];
  const traceId = typeof traceHeader === "string" && traceHeader.trim() ? traceHeader.trim() : `trace_${fallback}`;
  return { correlationId, traceId };
}

epochCanonicalRouter.post("/experiments", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = ExperimentRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid canonical experiment request" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const mission = await getEpochMission(body.data.workspaceId, body.data.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return;
  }
  try {
    const ids = requestCorrelation(req, body.data.missionId);
    const experiment = await createCanonicalExperiment({ ...body.data, ...ids });
    sendApiSuccess(res, 201, { experiment }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_experiment_created" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Canonical experiment creation failed";
    sendApiError(res, 422, { code: "CANONICAL_EXPERIMENT_FAILED", message }, buildApiMeta(req, startedAt));
  }
}));

const BenchmarkRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  experimentId: z.string().min(1).max(200),
  modelRevision: z.string().min(1).max(500),
  artifactDigest: z.string().min(1).max(500).optional(),
  runtimeVersion: z.string().min(1).max(300),
  servingVersion: z.string().min(1).max(300).optional(),
  hardware: z.record(z.string(), z.unknown()),
  driver: z.record(z.string(), z.unknown()).optional(),
  kernel: z.string().max(300).optional(),
  container: z.string().max(500).optional(),
  configuration: z.record(z.string(), z.unknown()),
  workload: z.record(z.string(), z.unknown()),
  dataset: z.record(z.string(), z.unknown()).optional(),
  randomSeeds: z.array(z.number().int()).min(1).max(100),
  environment: z.record(z.string(), z.unknown()),
  measurementMethod: z.string().min(1).max(1000),
  results: z.record(z.string(), z.unknown()),
  status: z.enum(["planned", "running", "completed", "failed", "non_reproducible"]).optional(),
});

epochCanonicalRouter.post("/benchmarks", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = BenchmarkRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid canonical benchmark request" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const mission = await getEpochMission(body.data.workspaceId, body.data.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const experiment = await getCanonicalArtifact(body.data.workspaceId, "Experiment", body.data.experimentId);
  if (!experiment || experiment.missionId !== body.data.missionId) {
    sendApiError(res, 404, { code: "EXPERIMENT_NOT_FOUND", message: "Experiment not found for mission" }, buildApiMeta(req, startedAt));
    return;
  }
  const ids = requestCorrelation(req, body.data.experimentId);
  const benchmark = await persistCanonicalBenchmark({ ...body.data, ...ids });
  sendApiSuccess(res, 201, { benchmark }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_benchmark_recorded" }));
}));

const DecisionRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  outcome: z.unknown(),
  candidates: z.array(z.object({
    candidateId: z.string().min(1).max(200),
    measurements: z.record(z.string(), z.unknown()),
    evidenceIds: z.array(z.string().min(1).max(200)).optional(),
    risk: z.enum(["low", "medium", "high", "critical"]).optional(),
    score: z.number().optional(),
  })).min(1).max(500),
  assumptions: z.array(z.string().max(1000)).optional(),
  uncertainties: z.array(z.string().min(1).max(200)).optional(),
});

epochCanonicalRouter.post("/decisions", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = DecisionRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid canonical decision request" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const mission = await getEpochMission(body.data.workspaceId, body.data.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const outcome = OutcomeContractSchema.safeParse(body.data.outcome);
  if (!outcome.success || outcome.data.workspaceId !== body.data.workspaceId) {
    sendApiError(res, 422, { code: "INVALID_OUTCOME_CONTRACT", message: "Outcome must be a valid canonical contract in the request workspace" }, buildApiMeta(req, startedAt));
    return;
  }
  const ids = requestCorrelation(req, body.data.missionId);
  const decision = await persistCanonicalDecision({ ...body.data, outcome: outcome.data, ...ids });
  sendApiSuccess(res, 201, { decision }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_decision_created" }));
}));

async function persistRegistryArtifact(input: { req: Request; res: Response; startedAt: number; objectType: "ModelProfile" | "WorkloadProfile"; body: unknown }) {
  const body = input.body as { workspaceId?: string };
  const workspaceId = body.workspaceId;
  if (!workspaceId || !(await resolveWorkspace(input.req, workspaceId))) {
    sendApiError(input.res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(input.req, input.startedAt));
    return null;
  }
  const parsed = input.objectType === "ModelProfile" ? ModelProfileSchema.safeParse(input.body) : WorkloadProfileSchema.safeParse(input.body);
  if (!parsed.success) {
    sendApiError(input.res, 422, { code: "INVALID_CANONICAL_INPUT", message: `Invalid ${input.objectType} contract` }, buildApiMeta(input.req, input.startedAt));
    return null;
  }
  const record = parsed.data;
  const artifact = await persistCanonicalArtifact({
    workspaceId,
    objectType: input.objectType,
    objectId: record.id,
    payload: record,
    provenance: record.provenance,
    correlationId: record.correlation.correlationId,
    traceId: record.correlation.traceId,
  });
  sendApiSuccess(input.res, 201, { [input.objectType === "ModelProfile" ? "model" : "workload"]: record, artifact }, buildApiMeta(input.req, input.startedAt, { intent: `epoch_canonical_${input.objectType === "ModelProfile" ? "model" : "workload"}_registered` }));
  return record;
}

epochCanonicalRouter.post("/models", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistRegistryArtifact({ req, res, startedAt, objectType: "ModelProfile", body: req.body });
}));

epochCanonicalRouter.post("/workloads", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistRegistryArtifact({ req, res, startedAt, objectType: "WorkloadProfile", body: req.body });
}));

const RegistryListQuerySchema = z.object({
  workspaceId: z.string().min(1).max(200),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

epochCanonicalRouter.get("/models", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const query = RegistryListQuerySchema.safeParse(req.query);
  if (!query.success || !(await resolveWorkspace(req, query.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const artifacts = await listCanonicalArtifacts({ ...query.data, objectType: "ModelProfile" });
  sendApiSuccess(res, 200, { models: artifacts.map((artifact) => artifact.payload), count: artifacts.length }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_model_list" }));
}));

epochCanonicalRouter.get("/workloads", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const query = RegistryListQuerySchema.safeParse(req.query);
  if (!query.success || !(await resolveWorkspace(req, query.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const artifacts = await listCanonicalArtifacts({ ...query.data, objectType: "WorkloadProfile" });
  sendApiSuccess(res, 200, { workloads: artifacts.map((artifact) => artifact.payload), count: artifacts.length }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_workload_list" }));
}));

async function persistRealityContract(input: { req: Request; res: Response; startedAt: number; objectType: "RealityEntity" | "Observation" | "StateSnapshot"; body: unknown }) {
  const body = input.body as { workspaceId?: string };
  if (!body.workspaceId || !(await resolveWorkspace(input.req, body.workspaceId))) {
    sendApiError(input.res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(input.req, input.startedAt));
    return null;
  }
  const parsed = input.objectType === "RealityEntity" ? RealityEntitySchema.safeParse(input.body) : input.objectType === "Observation" ? ObservationSchema.safeParse(input.body) : StateSnapshotSchema.safeParse(input.body);
  if (!parsed.success) {
    sendApiError(input.res, 422, { code: "INVALID_REALITY_CONTRACT", message: `Invalid ${input.objectType} contract` }, buildApiMeta(input.req, input.startedAt));
    return null;
  }
  const record = parsed.data;
  const missionId = "missionId" in record && typeof record.missionId === "string" ? record.missionId : undefined;
  const artifact = await persistCanonicalArtifact({
    workspaceId: body.workspaceId,
    objectType: input.objectType,
    objectId: record.id,
    ...(missionId ? { missionId } : {}),
    payload: record,
    provenance: "provenance" in record ? record.provenance : { classification: "MEASURED", confidence: 1 },
    correlationId: record.correlation.correlationId,
    traceId: record.correlation.traceId,
  });
  sendApiSuccess(input.res, 201, { [input.objectType === "RealityEntity" ? "entity" : input.objectType === "Observation" ? "observation" : "stateSnapshot"]: record, artifact }, buildApiMeta(input.req, input.startedAt, { intent: `epoch_canonical_${input.objectType.toLowerCase()}_recorded` }));
  return record;
}

epochCanonicalRouter.post("/reality/entities", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistRealityContract({ req, res, startedAt, objectType: "RealityEntity", body: req.body });
}));

const EnvironmentRequestSchema = z.object({ workspaceId: z.string().min(1).max(200), name: z.string().min(1).max(300), kind: z.enum(["software", "ai_compute", "cloud", "kubernetes", "data_center", "physical", "scientific", "simulation", "sandbox"]), provider: z.string().max(200).optional(), configuration: z.record(z.string(), z.unknown()).optional(), topology: z.record(z.string(), z.unknown()).optional(), status: z.enum(["discovered", "configured", "ready", "degraded", "unavailable", "retired", "unknown"]), freshness: z.enum(["fresh", "stale", "unknown"]) });
epochCanonicalRouter.post("/environments", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = EnvironmentRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid canonical environment" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  const ids = requestCorrelation(req, body.data.name);
  const now = new Date().toISOString();
  const environment = EnvironmentSchema.parse({ contractVersion: "epoch.canonical.v1", id: `environment_${randomUUID()}`, workspaceId: body.data.workspaceId, createdAt: now, updatedAt: now, correlation: ids, name: body.data.name, kind: body.data.kind, ...(body.data.provider ? { provider: body.data.provider } : {}), configuration: body.data.configuration ?? {}, topology: body.data.topology ?? {}, status: body.data.status, provenance: { sourceType: "environment-api", capturedAt: now, classification: "USER_ASSERTED", confidence: 1, derivation: [] }, freshness: body.data.freshness });
  const artifact = await persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "Environment", objectId: environment.id, payload: environment, provenance: environment.provenance, correlationId: ids.correlationId, traceId: ids.traceId });
  sendApiSuccess(res, 201, { environment, artifact }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_environment_created" }));
}));

epochCanonicalRouter.post("/observations", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistRealityContract({ req, res, startedAt, objectType: "Observation", body: req.body });
}));

epochCanonicalRouter.post("/world-states", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistRealityContract({ req, res, startedAt, objectType: "StateSnapshot", body: req.body });
}));

const MissionContractArtifactSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
});

async function persistMissionArtifact(input: { req: Request; res: Response; startedAt: number; objectType: "Unknown" | "Hypothesis" | "Capability"; body: unknown }) {
  const body = input.body as { workspaceId?: string; missionId?: string };
  const scope = MissionContractArtifactSchema.safeParse(input.body);
  if (!scope.success || !(await resolveWorkspace(input.req, scope.data.workspaceId))) {
    sendApiError(input.res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(input.req, input.startedAt));
    return null;
  }
  const mission = await getEpochMission(scope.data.workspaceId, scope.data.missionId);
  if (!mission) {
    sendApiError(input.res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(input.req, input.startedAt));
    return null;
  }
  const parsed = input.objectType === "Unknown" ? UnknownSchema.safeParse(input.body) : input.objectType === "Hypothesis" ? HypothesisSchema.safeParse(input.body) : CapabilitySchema.safeParse(input.body);
  if (!parsed.success) {
    sendApiError(input.res, 422, { code: "INVALID_CANONICAL_INPUT", message: `Invalid ${input.objectType} contract` }, buildApiMeta(input.req, input.startedAt));
    return null;
  }
  const record = parsed.data;
  const artifact = await persistCanonicalArtifact({
    workspaceId: scope.data.workspaceId,
    objectType: input.objectType,
    objectId: record.id,
    missionId: "missionId" in record ? record.missionId : scope.data.missionId,
    payload: record,
    provenance: "provenance" in record ? record.provenance : { classification: "INFERRED", confidence: 0.5 },
    correlationId: record.correlation.correlationId,
    traceId: record.correlation.traceId,
  });
  sendApiSuccess(input.res, 201, { [input.objectType.toLowerCase()]: record, artifact }, buildApiMeta(input.req, input.startedAt, { intent: `epoch_canonical_${input.objectType.toLowerCase()}_created` }));
  return record;
}

epochCanonicalRouter.post("/unknowns", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistMissionArtifact({ req, res, startedAt, objectType: "Unknown", body: req.body });
}));

epochCanonicalRouter.post("/hypotheses", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistMissionArtifact({ req, res, startedAt, objectType: "Hypothesis", body: req.body });
}));

epochCanonicalRouter.post("/capabilities", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  await persistMissionArtifact({ req, res, startedAt, objectType: "Capability", body: req.body });
}));

const ExecutionPreparationSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  action: z.string().min(1).max(300),
  target: z.record(z.string(), z.unknown()),
  authorityGrant: z.unknown(),
  policy: z.unknown(),
  state: z.unknown(),
  preconditions: z.array(z.record(z.string(), z.unknown())).optional(),
  expectedPostconditions: z.array(z.record(z.string(), z.unknown())).optional(),
  rollback: z.record(z.string(), z.unknown()).optional(),
  timeoutSeconds: z.number().int().positive().max(86_400).optional(),
  evidenceRequirements: z.array(z.string().min(1).max(300)).optional(),
  risk: z.enum(["low", "medium", "high", "critical"]).optional(),
});

epochCanonicalRouter.post("/executions/prepare", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = ExecutionPreparationSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid execution preparation request" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const mission = await getEpochMission(body.data.workspaceId, body.data.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const authority = AuthorityGrantSchema.safeParse(body.data.authorityGrant);
  const policy = PolicySchema.safeParse(body.data.policy);
  const state = StateSnapshotSchema.safeParse(body.data.state);
  if (!authority.success || !policy.success || !state.success || authority.data.workspaceId !== body.data.workspaceId || policy.data.workspaceId !== body.data.workspaceId || state.data.workspaceId !== body.data.workspaceId) {
    sendApiError(res, 422, { code: "INVALID_AUTHORITY_CONTEXT", message: "Authority, policy, and state must be valid canonical records in the request workspace" }, buildApiMeta(req, startedAt));
    return;
  }
  const ids = requestCorrelation(req, body.data.missionId);
  const result = prepareCanonicalExecution({ ...body.data, authorityGrant: authority.data, policy: policy.data, state: state.data, ...ids });
  if (!result.execution) {
    sendApiError(res, 409, { code: "EXECUTION_BLOCKED", message: result.guard.reasons.join("; ") }, buildApiMeta(req, startedAt));
    return;
  }
  const execution = result.execution;
  const artifact = await persistCanonicalArtifact({
    workspaceId: body.data.workspaceId,
    objectType: "Execution",
    objectId: execution.id,
    missionId: body.data.missionId,
    parentId: authority.data.id,
    payload: execution,
    provenance: { classification: "INFERRED", source: "canonical-execution-guard", guard: result.guard },
    correlationId: execution.correlation.correlationId,
    traceId: execution.correlation.traceId,
  });
  sendApiSuccess(res, result.guard.status === "approval_required" ? 202 : 201, { execution, guard: result.guard, artifact }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_execution_prepared" }));
}));

const ExecutionTransitionRequestSchema = z.object({ workspaceId: z.string().min(1).max(200), missionId: z.string().min(1).max(200), nextState: z.enum(["prepared", "approved", "executing", "completed", "failed", "compensating", "rolled_back", "blocked"]), evidenceIds: z.array(z.string().min(1).max(200)).optional(), reason: z.string().max(2000).optional() });
epochCanonicalRouter.post("/executions/:executionId/transition", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = z.object({ executionId: z.string().min(1).max(200) }).safeParse(req.params); const body = ExecutionTransitionRequestSchema.safeParse(req.body);
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid execution transition" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try {
    const result = await transitionCanonicalExecution({ ...body.data, executionId: params.data.executionId, ...requestCorrelation(req, params.data.executionId) });
    sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt, { intent: "epoch_canonical_execution_transitioned" }));
  } catch (error) { sendApiError(res, 409, { code: "EXECUTION_TRANSITION_BLOCKED", message: error instanceof Error ? error.message : "Execution transition blocked" }, buildApiMeta(req, startedAt)); }
}));

epochCanonicalRouter.post("/executions/:executionId/run-runtime", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const params = z.object({ executionId: z.string().min(1).max(200) }).safeParse(req.params); const body = z.object({ workspaceId: z.string().min(1).max(200), missionId: z.string().min(1).max(200) }).safeParse(req.body);
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime execution request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try { const result = await executeCanonicalRuntimeAction({ ...body.data, executionId: params.data.executionId, ...requestCorrelation(req, params.data.executionId) }); sendApiSuccess(res, 201, result, buildApiMeta(req, startedAt, { intent: "epoch_canonical_runtime_executed" })); }
  catch (error) { sendApiError(res, 502, { code: "CANONICAL_RUNTIME_EXECUTION_FAILED", message: error instanceof Error ? error.message : "Runtime execution failed" }, buildApiMeta(req, startedAt)); }
}));

const EvidenceRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  executionId: z.string().min(1).max(200).optional(),
  claimId: z.string().min(1).max(200).optional(),
  type: z.enum(["metric", "log", "trace", "benchmark", "artifact", "deployment", "sensor", "camera", "instrument", "approval", "attestation"]),
  uri: z.string().min(1).max(2000),
  summary: z.string().max(4000).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  classification: z.enum(["OBSERVED", "MEASURED", "USER_ASSERTED", "EXTERNAL", "INFERRED", "PREDICTED", "SIMULATED", "VERIFIED"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

epochCanonicalRouter.post("/evidence", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = EvidenceRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid evidence request" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const mission = await getEpochMission(body.data.workspaceId, body.data.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const ids = requestCorrelation(req, body.data.missionId);
  const evidence = await persistCanonicalEvidence({ ...body.data, ...ids });
  sendApiSuccess(res, 201, { evidence }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_evidence_recorded" }));
}));

const VerificationRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  evidenceIds: z.array(z.string().min(1).max(200)).min(1).max(500),
  verifierId: z.string().min(1).max(200),
  executorId: z.string().min(1).max(200),
  method: z.string().min(1).max(1000),
  observationWindow: z.object({ start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) }),
  verdict: z.enum(["VERIFIED", "FAILED", "PARTIALLY_VERIFIED", "UNCERTAIN", "CONTRADICTED", "EXPIRED"]),
  findings: z.array(z.record(z.string(), z.unknown())).optional(),
});

epochCanonicalRouter.post("/verifications", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = VerificationRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid verification request" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const mission = await getEpochMission(body.data.workspaceId, body.data.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return;
  }
  try {
    const ids = requestCorrelation(req, body.data.missionId);
    const verification = await persistCanonicalVerification({ ...body.data, ...ids });
    sendApiSuccess(res, 201, { verification }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_verification_recorded" }));
  } catch (error) {
    sendApiError(res, 422, { code: "CANONICAL_VERIFICATION_FAILED", message: error instanceof Error ? error.message : "Verification failed" }, buildApiMeta(req, startedAt));
  }
}));

const ExperienceRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200),
  missionId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  initialStateId: z.string().min(1).max(200),
  observationIds: z.array(z.string().min(1).max(200)),
  unknownIds: z.array(z.string().min(1).max(200)),
  hypothesisId: z.string().min(1).max(200).optional(),
  actionId: z.string().min(1).max(200).optional(),
  resultingStateId: z.string().min(1).max(200).optional(),
  evidenceIds: z.array(z.string().min(1).max(200)),
  verificationId: z.string().min(1).max(200),
  lessonIds: z.array(z.string().min(1).max(200)).optional(),
  privacy: z.enum(["unknown", "approved", "restricted", "redacted", "rejected"]),
  license: z.enum(["unknown", "approved", "restricted", "rejected"]),
  safety: z.enum(["unknown", "approved", "restricted", "rejected"]),
  lineage: z.array(z.string().min(1).max(200)).optional(),
});

epochCanonicalRouter.post("/experiences", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = ExperienceRequestSchema.safeParse(req.body);
  if (!body.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid WorldExperience request" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const mission = await getEpochMission(body.data.workspaceId, body.data.missionId);
  if (!mission) {
    sendApiError(res, 404, { code: "MISSION_NOT_FOUND", message: "Mission not found" }, buildApiMeta(req, startedAt));
    return;
  }
  try {
    const ids = requestCorrelation(req, body.data.missionId);
    const experience = await buildAndPersistWorldExperience({ ...body.data, ...ids });
    sendApiSuccess(res, 201, { experience }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_experience_recorded" }));
  } catch (error) {
    sendApiError(res, 422, { code: "CANONICAL_EXPERIENCE_FAILED", message: error instanceof Error ? error.message : "Experience creation failed" }, buildApiMeta(req, startedAt));
  }
}));

const LessonRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200), missionId: z.string().min(1).max(200), experienceId: z.string().min(1).max(200), statement: z.string().min(1).max(4000), target: z.enum(["model", "skill", "tool", "retrieval", "workflow", "policy", "world_model", "execution"]), evidenceIds: z.array(z.string().min(1).max(200)).min(1), confidence: z.number().min(0).max(1),
});

epochCanonicalRouter.post("/teaching/lessons", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = LessonRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid lesson request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) { sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt)); return; }
  const ids = requestCorrelation(req, body.data.experienceId);
  try {
    const lesson = await buildAndPersistLesson({ ...body.data, ...ids });
    sendApiSuccess(res, 201, { lesson }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_lesson_created" }));
  } catch (error) { sendApiError(res, 422, { code: "CANONICAL_LESSON_FAILED", message: error instanceof Error ? error.message : "Lesson creation failed" }, buildApiMeta(req, startedAt)); }
}));

const TeachingDatasetRequestSchema = z.object({
  workspaceId: z.string().min(1).max(200), missionId: z.string().min(1).max(200), lessonIds: z.array(z.string().min(1).max(200)).min(1).max(500), target: z.enum(["sft", "preference", "tool_use", "evaluation", "specialized_training", "world_model"]), version: z.string().min(1).max(100), itemCount: z.number().int().nonnegative(), eligibility: z.enum(["pending", "approved", "rejected"]), lineage: z.array(z.string().min(1).max(200)).optional(),
});

epochCanonicalRouter.post("/teaching/datasets", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = TeachingDatasetRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid teaching dataset request" }, buildApiMeta(req, startedAt)); return; }
  if (!(await resolveWorkspace(req, body.data.workspaceId))) { sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt)); return; }
  const ids = requestCorrelation(req, body.data.missionId);
  try {
    const dataset = await buildAndPersistTeachingDataset({ ...body.data, ...ids });
    sendApiSuccess(res, 201, { dataset }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_teaching_dataset_created" }));
  } catch (error) { sendApiError(res, 422, { code: "CANONICAL_TEACHING_DATASET_FAILED", message: error instanceof Error ? error.message : "Teaching dataset creation failed" }, buildApiMeta(req, startedAt)); }
}));

const TeachingRecordRequestSchema = z.object({ workspaceId: z.string().min(1).max(200), missionId: z.string().min(1).max(200), experienceId: z.string().min(1).max(200), lessonId: z.string().min(1).max(200).optional(), datasetId: z.string().min(1).max(200).optional(), target: z.enum(["model", "skill", "tool", "retrieval", "workflow", "policy", "world_model", "execution"]), status: z.enum(["candidate", "eligible", "approved", "rejected", "consumed"]), sourceVerificationId: z.string().min(1).max(200), lineage: z.array(z.string()).optional() });
epochCanonicalRouter.post("/teaching/records", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = TeachingRecordRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid teaching record" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  const experience = await getCanonicalArtifact(body.data.workspaceId, "WorldExperience", body.data.experienceId);
  const verification = await getCanonicalArtifact(body.data.workspaceId, "Verification", body.data.sourceVerificationId);
  if (!experience || experience.missionId !== body.data.missionId || !verification || verification.missionId !== body.data.missionId) { sendApiError(res, 422, { code: "TEACHING_LINEAGE_NOT_FOUND", message: "Teaching record requires same-tenant, same-mission experience and verification" }, buildApiMeta(req, startedAt)); return; }
  const ids = requestCorrelation(req, body.data.experienceId); const now = new Date().toISOString();
  const record = TeachingRecordSchema.parse({ contractVersion: "epoch.canonical.v1", id: `teaching_record_${randomUUID()}`, workspaceId: body.data.workspaceId, createdAt: now, updatedAt: now, correlation: ids, experienceId: body.data.experienceId, ...(body.data.lessonId ? { lessonId: body.data.lessonId } : {}), ...(body.data.datasetId ? { datasetId: body.data.datasetId } : {}), target: body.data.target, status: body.data.status, sourceVerificationId: body.data.sourceVerificationId, lineage: body.data.lineage ?? [body.data.missionId, body.data.experienceId, body.data.sourceVerificationId] });
  const artifact = await persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "TeachingRecord", objectId: record.id, missionId: body.data.missionId, parentId: body.data.experienceId, payload: record, provenance: { classification: record.status === "approved" ? "VERIFIED" : "INFERRED", source: "teaching-gate", derivation: [body.data.experienceId, body.data.sourceVerificationId] }, correlationId: ids.correlationId, traceId: ids.traceId });
  sendApiSuccess(res, 201, { record, artifact }, buildApiMeta(req, startedAt, { intent: "epoch_teaching_record_created" }));
}));

epochCanonicalRouter.get("/adapters", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  sendApiSuccess(res, 200, { adapters: CANONICAL_ADAPTERS }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_adapter_catalog" }));
}));

const HuggingFaceAdapterRequestSchema = z.object({ workspaceId: z.string().min(1).max(200), repositoryId: z.string().min(1).max(300), revision: z.string().min(1).max(200).optional() });
epochCanonicalRouter.post("/adapters/huggingface/inspect", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = HuggingFaceAdapterRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and repositoryId are required" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try {
    const result = await inspectCanonicalModel({ ...body.data, ...requestCorrelation(req, body.data.repositoryId) });
    const artifact = await persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "ModelProfile", objectId: result.profile.id, payload: result.profile, provenance: result.profile.provenance, correlationId: result.profile.correlation.correlationId, traceId: result.profile.correlation.traceId });
    sendApiSuccess(res, 201, { profile: result.profile, inspection: result.inspection, artifact }, buildApiMeta(req, startedAt, { intent: "epoch_huggingface_model_profiled" }));
  } catch (error) { sendApiError(res, 502, { code: "HUGGINGFACE_ADAPTER_FAILED", message: error instanceof Error ? error.message : "Hugging Face inspection failed" }, buildApiMeta(req, startedAt)); }
}));

const TelemetryAdapterRequestSchema = z.object({ workspaceId: z.string().min(1).max(200), missionId: z.string().min(1).max(200), experimentId: z.string().min(1).max(200).optional(), environmentId: z.string().min(1).max(200), source: z.string().min(1).max(300), content: z.unknown(), contentType: z.string().max(200).optional(), observedAt: z.string().datetime({ offset: true }).optional() });
epochCanonicalRouter.post("/adapters/opentelemetry/ingest", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = TelemetryAdapterRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid OpenTelemetry observation" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try {
    const result = buildCanonicalTelemetryObservation({ ...body.data, ...requestCorrelation(req, body.data.missionId) });
    const artifact = await persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "Observation", objectId: result.observation.id, missionId: body.data.missionId, payload: result.observation, provenance: result.observation.provenance, correlationId: result.observation.correlation.correlationId, traceId: result.observation.correlation.traceId });
    sendApiSuccess(res, 201, { observation: result.observation, ingestion: result.ingestion, artifact }, buildApiMeta(req, startedAt, { intent: "epoch_opentelemetry_observation_ingested" }));
  } catch (error) { sendApiError(res, 422, { code: "OPENTELEMETRY_ADAPTER_FAILED", message: error instanceof Error ? error.message : "Telemetry ingestion failed" }, buildApiMeta(req, startedAt)); }
}));

const RuntimeCapabilityRequestSchema = z.object({ workspaceId: z.string().min(1).max(200), provider: z.string().min(1).max(200), version: z.string().max(100).optional(), status: z.enum(["discovered", "available", "degraded", "unavailable", "unknown"]), inputTypes: z.array(z.string().min(1)).min(1), outputTypes: z.array(z.string().min(1)).min(1), probe: z.record(z.string(), z.unknown()) });
epochCanonicalRouter.post("/adapters/runtime-capabilities", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = RuntimeCapabilityRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime capability" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  const capability = buildRuntimeCapability({ ...body.data, ...requestCorrelation(req, body.data.provider) });
  const artifact = await persistCanonicalArtifact({ workspaceId: body.data.workspaceId, objectType: "Capability", objectId: capability.id, payload: capability, provenance: capability.provenance, correlationId: capability.correlation.correlationId, traceId: capability.correlation.traceId });
  sendApiSuccess(res, 201, { capability, artifact }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_capability_recorded" }));
}));

const RevisionBaseSchema = z.object({ workspaceId: z.string().min(1).max(200), missionId: z.string().min(1).max(200).optional() });
const ModelRevisionRequestSchema = RevisionBaseSchema.extend({ modelProfileId: z.string().min(1).max(200), revision: z.string().min(1).max(200), artifactDigest: z.string().min(1).max(500), teachingDatasetIds: z.array(z.string()).optional(), evaluatorIds: z.array(z.string()).optional(), benchmarkIds: z.array(z.string()).optional(), lifecycle: z.enum(["candidate", "training", "benchmarked", "verified", "approved", "promoted", "rejected"]), lineage: z.array(z.string()).optional() });
const SkillRevisionRequestSchema = RevisionBaseSchema.extend({ skillId: z.string().min(1).max(200), version: z.string().min(1).max(200), teachingDatasetIds: z.array(z.string()).optional(), benchmarkIds: z.array(z.string()).optional(), lifecycle: z.enum(["candidate", "verified", "approved", "promoted", "rejected"]), lineage: z.array(z.string()).optional() });
const AgentPolicyRevisionRequestSchema = RevisionBaseSchema.extend({ agentId: z.string().min(1).max(200), version: z.string().min(1).max(200), teachingDatasetIds: z.array(z.string()).optional(), benchmarkIds: z.array(z.string()).optional(), lifecycle: z.enum(["candidate", "verified", "approved", "promoted", "rejected"]), lineage: z.array(z.string()).optional() });
const WorldModelRequestSchema = RevisionBaseSchema.extend({ environmentId: z.string().min(1).max(200), version: z.string().min(1).max(200), entityIds: z.array(z.string()), observationIds: z.array(z.string()), dynamics: z.record(z.string(), z.unknown()), predictionHorizonSeconds: z.number().nonnegative().optional(), lifecycle: z.enum(["candidate", "evaluated", "verified", "approved", "promoted", "rejected"]), lineage: z.array(z.string()).optional() });

async function evolutionWorkspace(req: Request, workspaceId: string, startedAt: number, res: Response) {
  if (await resolveWorkspace(req, workspaceId)) return true;
  sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
  return false;
}

epochCanonicalRouter.post("/evolution/model-revisions", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = ModelRevisionRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid model revision" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try { const value = await persistModelRevision({ ...body.data, ...requestCorrelation(req, body.data.modelProfileId) }); sendApiSuccess(res, 201, { revision: value }, buildApiMeta(req, startedAt, { intent: "epoch_model_revision_created" })); }
  catch (error) { sendApiError(res, 422, { code: "MODEL_REVISION_FAILED", message: error instanceof Error ? error.message : "Model revision failed" }, buildApiMeta(req, startedAt)); }
}));

epochCanonicalRouter.post("/evolution/skill-revisions", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = SkillRevisionRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid skill revision" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try { const value = await persistSkillRevision({ ...body.data, ...requestCorrelation(req, body.data.skillId) }); sendApiSuccess(res, 201, { revision: value }, buildApiMeta(req, startedAt, { intent: "epoch_skill_revision_created" })); }
  catch (error) { sendApiError(res, 422, { code: "SKILL_REVISION_FAILED", message: error instanceof Error ? error.message : "Skill revision failed" }, buildApiMeta(req, startedAt)); }
}));

epochCanonicalRouter.post("/evolution/agent-policy-revisions", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = AgentPolicyRevisionRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid agent policy revision" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try { const value = await persistAgentPolicyRevision({ ...body.data, ...requestCorrelation(req, body.data.agentId) }); sendApiSuccess(res, 201, { revision: value }, buildApiMeta(req, startedAt, { intent: "epoch_agent_policy_revision_created" })); }
  catch (error) { sendApiError(res, 422, { code: "AGENT_POLICY_REVISION_FAILED", message: error instanceof Error ? error.message : "Agent policy revision failed" }, buildApiMeta(req, startedAt)); }
}));

epochCanonicalRouter.post("/evolution/world-models", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = WorldModelRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid world model" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  try { const value = await persistWorldModel({ ...body.data, ...requestCorrelation(req, body.data.environmentId) }); sendApiSuccess(res, 201, { worldModel: value }, buildApiMeta(req, startedAt, { intent: "epoch_world_model_created" })); }
  catch (error) { sendApiError(res, 422, { code: "WORLD_MODEL_FAILED", message: error instanceof Error ? error.message : "World model failed" }, buildApiMeta(req, startedAt)); }
}));

const RuntimeEventRequestSchema = z.object({ workspaceId: z.string().min(1).max(200), type: z.string().min(1).max(200), subjectType: z.string().min(1).max(200), subjectId: z.string().min(1).max(200), occurredAt: z.string().datetime({ offset: true }), payload: z.record(z.string(), z.unknown()), idempotencyKey: z.string().min(1).max(300) });
epochCanonicalRouter.post("/events", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const body = RuntimeEventRequestSchema.safeParse(req.body);
  if (!body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "Invalid runtime event" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  const result = await appendCanonicalRuntimeEvent({ ...body.data, contractVersion: "epoch.canonical.v1", correlation: requestCorrelation(req, body.data.subjectId) });
  sendApiSuccess(res, result.created ? 201 : 200, result, buildApiMeta(req, startedAt, { intent: "epoch_runtime_event_appended" }));
}));

const RuntimeEventListQuerySchema = z.object({ workspaceId: z.string().min(1).max(200), limit: z.coerce.number().int().positive().max(200).optional() });
epochCanonicalRouter.get("/events", asyncHandler(async (req, res) => {
  const startedAt = Date.now(); const query = RuntimeEventListQuerySchema.safeParse(req.query);
  if (!query.success || !(await evolutionWorkspace(req, query.success ? query.data.workspaceId : "", startedAt, res))) { if (!query.success) sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt)); return; }
  const events = await listCanonicalRuntimeEvents(query.data.workspaceId, query.data.limit); sendApiSuccess(res, 200, { events, count: events.length }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_event_replay" }));
}));

epochCanonicalRouter.post("/events/:eventId/claim", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const params = z.object({ eventId: z.string().min(1).max(200) }).safeParse(req.params);
  const body = z.object({ workspaceId: z.string().min(1).max(200) }).safeParse(req.body);
  if (!params.success || !body.success) { sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId and eventId are required" }, buildApiMeta(req, startedAt)); return; }
  if (!(await evolutionWorkspace(req, body.data.workspaceId, startedAt, res))) return;
  const event = await claimEpochOutboxEvent(body.data.workspaceId, params.data.eventId);
  if (!event) { sendApiError(res, 404, { code: "EVENT_NOT_FOUND", message: "Runtime event not found" }, buildApiMeta(req, startedAt)); return; }
  sendApiSuccess(res, 200, { event, claimed: event.status === "published" }, buildApiMeta(req, startedAt, { intent: "epoch_runtime_event_claimed" }));
}));

const ArtifactListQuerySchema = z.object({
  workspaceId: z.string().min(1).max(200),
  objectType: z.string().min(1).max(100).optional(),
  missionId: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

epochCanonicalRouter.get("/artifacts", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const query = ArtifactListQuerySchema.safeParse(req.query);
  if (!query.success) {
    sendApiError(res, 400, { code: "BAD_REQUEST", message: "workspaceId is required" }, buildApiMeta(req, startedAt));
    return;
  }
  if (!(await resolveWorkspace(req, query.data.workspaceId))) {
    sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const artifacts = await listCanonicalArtifacts(query.data);
  sendApiSuccess(res, 200, { artifacts, count: artifacts.length }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_artifact_list" }));
}));

epochCanonicalRouter.get("/artifacts/:workspaceId/:objectType/:objectId", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const params = z.object({ workspaceId: z.string().min(1).max(200), objectType: z.string().min(1).max(100), objectId: z.string().min(1).max(200) }).safeParse(req.params);
  if (!params.success || !(await resolveWorkspace(req, params.data.workspaceId))) {
    sendApiError(res, 404, { code: "ARTIFACT_NOT_FOUND", message: "Canonical artifact not found" }, buildApiMeta(req, startedAt));
    return;
  }
  const artifact = await getCanonicalArtifact(params.data.workspaceId, params.data.objectType, params.data.objectId);
  if (!artifact) {
    sendApiError(res, 404, { code: "ARTIFACT_NOT_FOUND", message: "Canonical artifact not found" }, buildApiMeta(req, startedAt));
    return;
  }
  sendApiSuccess(res, 200, { artifact }, buildApiMeta(req, startedAt, { intent: "epoch_canonical_artifact_get" }));
}));

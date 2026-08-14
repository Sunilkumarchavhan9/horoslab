import { z } from "zod";

const JsonRecordSchema = z.record(z.string(), z.unknown());

export const EpochWorkspaceParamsSchema = z.object({
  workspaceId: z.string().min(1),
});

export const EpochInstitutionParamsSchema = EpochWorkspaceParamsSchema.extend({
  institutionId: z.string().min(1),
});

export const EpochMissionParamsSchema = EpochWorkspaceParamsSchema.extend({
  missionId: z.string().min(1),
});

export const EpochOutcomeInputSchema = z.object({
  status: z.enum(["pending", "achieved", "not_achieved", "unknown"]),
  summary: z.string().max(4000),
  verificationId: z.string().min(1).max(200).optional(),
  evidenceIds: z.array(z.string().min(1).max(200)).max(200).optional(),
  customerResult: JsonRecordSchema.optional(),
});

export const EpochExperienceInputSchema = z.object({
  summary: z.string().min(1).max(4000),
  lessons: z.array(z.string().min(1).max(1000)).max(100),
  confidence: z.number().min(0).max(1),
  reusable: z.boolean().optional(),
  context: JsonRecordSchema.optional(),
});

export const EpochExecutionRunParamsSchema = EpochWorkspaceParamsSchema.extend({
  executionRunId: z.string().min(1),
});

export const EpochVerificationRunParamsSchema = EpochWorkspaceParamsSchema.extend({
  verificationRunId: z.string().min(1),
});

export const EpochCertificateParamsSchema = EpochWorkspaceParamsSchema.extend({
  certificateId: z.string().min(1),
});

export const CreateEpochTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  version: z.string().min(1).max(40).optional(),
  definition: JsonRecordSchema.optional(),
  proof: JsonRecordSchema.optional(),
});

export const CreateEpochInstitutionSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(120).optional(),
  version: z.string().min(1).max(40).optional(),
  summary: z.string().max(4000).optional(),
  templateId: z.string().min(1).optional(),
  metadata: JsonRecordSchema.optional(),
  proof: JsonRecordSchema.optional(),
});

export const UpdateEpochInstitutionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(120).optional(),
  version: z.string().min(1).max(40).optional(),
  status: z.string().min(1).max(40).optional(),
  summary: z.string().max(4000).optional(),
  metadata: JsonRecordSchema.optional(),
  proof: JsonRecordSchema.optional(),
});

export const CloneEpochInstitutionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  version: z.string().min(1).max(40).optional(),
});

export const EpochAuthorityPolicySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  canExecute: z.boolean().optional(),
  needsApproval: z.boolean().optional(),
  blocked: z.boolean().optional(),
  permissions: z.array(z.string().min(1).max(120)).optional(),
  budgets: JsonRecordSchema.optional(),
  approvals: z.array(z.string().min(1).max(120)).optional(),
  checks: z.array(z.string().min(1).max(120)).optional(),
  proof: JsonRecordSchema.optional(),
});

export const CreateEpochMissionSchema = z.object({
  institutionId: z.string().min(1),
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(4000),
  repository: z.string().min(1).max(500).optional(),
  baseBranch: z.string().min(1).max(200).optional(),
  workingBranch: z.string().min(1).max(200).optional(),
  budgetCents: z.number().int().nonnegative().optional(),
  deadlineAt: z.string().datetime().optional(),
  plan: z.array(z.string().min(1).max(500)).max(30).optional(),
  acceptanceCriteria: z.array(z.string().min(1).max(500)).max(40).optional(),
  model: JsonRecordSchema.optional(),
  outcome: JsonRecordSchema.optional(),
  constraints: JsonRecordSchema.optional(),
  baseline: JsonRecordSchema.optional(),
  workload: JsonRecordSchema.optional(),
  runtimeOptions: z.array(JsonRecordSchema).max(100).optional(),
  hardwareOptions: z.array(JsonRecordSchema).max(100).optional(),
  allowedRuntimes: z.array(z.string().min(1).max(120)).max(100).optional(),
  allowedHardware: z.array(z.string().min(1).max(200)).max(100).optional(),
  authority: EpochAuthorityPolicySchema.optional(),
  proof: JsonRecordSchema.optional(),
  inputEnvelope: JsonRecordSchema.optional(),
}).superRefine((input, context) => {
  const hasRepositoryContext = Boolean(input.repository || input.baseBranch || input.workingBranch);
  if (hasRepositoryContext && !input.repository) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["repository"], message: "Repository is required when branch context is provided." });
  }
  if (input.repository && !input.workingBranch) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["workingBranch"], message: "Working branch is required for repository missions." });
  }
});

export const UpdateEpochMissionSchema = z.object({
  state: z.enum(["draft", "running", "waiting_review", "completed", "failed"]).optional(),
  objective: z.string().min(1).max(4000).optional(),
  currentStep: z.string().min(1).max(120).optional(),
  plan: z.array(z.string().min(1).max(500)).max(30).optional(),
  result: JsonRecordSchema.optional(),
  timeline: z.array(JsonRecordSchema).optional(),
  proof: JsonRecordSchema.optional(),
  startedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  budgetCents: z.number().int().nonnegative().optional(),
  acceptanceCriteria: z.array(z.string().min(1).max(500)).max(40).optional(),
});

export const EpochDecisionInputSchema = z.object({
  evaluations: z.array(JsonRecordSchema).max(500),
  objectives: z.array(z.object({
    metric: z.string().min(1).max(120),
    direction: z.enum(["minimize", "maximize"]),
    weight: z.number().finite().positive(),
  })).max(50).optional(),
});

export const EpochVerificationWindowInputSchema = z.object({
  measurements: z.record(z.string(), z.unknown()),
  constraints: z.array(z.object({
    metric: z.string().min(1).max(120),
    operator: z.enum(["<=", ">=", "=", "<", ">"]),
    target: z.number().finite(),
    unit: z.string().max(40).optional(),
    hard: z.boolean().default(true),
    source: z.enum(["explicit", "acceptance_criteria"]).default("explicit"),
  })).max(100),
  evidenceIds: z.array(z.string().min(1).max(200)).max(200),
  requiredWindowSeconds: z.number().int().positive().max(2_592_000),
  observedWindowSeconds: z.number().int().nonnegative().max(2_592_000),
});

const EpochEvidenceItemSchema = z.object({
  kind: z.string().min(1).max(120),
  url: z.string().url().max(2000).optional(),
  filePath: z.string().max(500).optional(),
  contentType: z.string().max(120).optional(),
  summary: z.string().max(2000).optional(),
  payload: JsonRecordSchema.optional(),
  proof: JsonRecordSchema.optional(),
});

export const CreateEpochEvidenceSchema = z.object({
  evidence: z.array(EpochEvidenceItemSchema).min(1).max(40),
});

export const RunEpochMissionSchema = z.object({
  evidence: z.array(EpochEvidenceItemSchema).max(40).optional(),
  checklist: z.array(z.string().min(1).max(500)).max(40).optional(),
  humanApproval: z.enum(["approved", "rejected", "review"]).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  output: JsonRecordSchema.optional(),
  approvals: z.array(z.string().min(1).max(500)).max(20).optional(),
  notes: z.string().max(4000).optional(),
});

export const EpochMissionApprovalActionSchema = z.object({
  decision: z.enum(["approved", "rejected", "review"]),
  reason: z.string().max(4000).optional(),
  notes: z.string().max(4000).optional(),
  checklist: z.array(z.string().min(1).max(500)).max(40).optional(),
  evidenceIds: z.array(z.string().min(1).max(120)).max(40).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  output: JsonRecordSchema.optional(),
  approvals: z.array(z.string().min(1).max(500)).max(20).optional(),
});

export const EpochMissionLifecycleActionSchema = z.object({
  reason: z.string().max(4000).optional(),
  notes: z.string().max(4000).optional(),
});

export const EpochSmokeRunSchema = z.object({
  institutionName: z.string().min(1).max(200).optional(),
  missionTitle: z.string().min(1).max(200).optional(),
  objective: z.string().min(1).max(4000).optional(),
  reuseExisting: z.boolean().optional(),
});

export const EpochSmokeHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).max(400).optional(),
  missionTitle: z.string().min(1).max(200).optional(),
});

export const VerifyEpochMissionSchema = z.object({
  checklist: z.array(z.string().min(1).max(500)).max(40).optional(),
  evidenceIds: z.array(z.string().min(1).max(120)).max(40).optional(),
  humanApproval: z.enum(["approved", "rejected", "review"]).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  output: JsonRecordSchema.optional(),
  approvals: z.array(z.string().min(1).max(500)).max(20).optional(),
});

export const CreateEpochVerifierAssignmentSchema = z.object({
  verifierId: z.string().min(1).max(120),
  verifierKind: z.enum(["software", "ai_agent", "human"]),
  evidenceIds: z.array(z.string().min(1).max(120)).max(100).optional(),
  checklist: z.array(z.string().min(1).max(500)).max(40).optional(),
});

export const CompleteEpochVerifierAssignmentSchema = z.object({
  confidence: z.number().int().min(0).max(100).optional(),
});

export const IssueEpochCertificateSchema = z.object({
  summary: z.string().max(4000).optional(),
  approvals: z.array(z.string().min(1).max(500)).max(20).optional(),
  evidenceSummary: JsonRecordSchema.optional(),
  auditTrail: z.array(JsonRecordSchema).optional(),
  proof: JsonRecordSchema.optional(),
});

export const CreateEpochIntegrationSchema = z.object({
  institutionId: z.string().min(1).optional(),
  name: z.string().min(1).max(200),
  provider: z.string().min(1).max(120),
  status: z.string().min(1).max(40).optional(),
  config: JsonRecordSchema.optional(),
  proof: JsonRecordSchema.optional(),
});

export const CreateEpochEnvironmentSchema = z.object({
  projectId: z.string().min(1),
  kind: z.enum(["software", "cloud", "simulation", "edge", "sandbox"]),
  name: z.string().min(1).max(300),
  status: z.enum(["connected", "degraded", "disconnected", "unknown"]).optional(),
  region: z.string().min(1).max(120).optional(),
  metadata: JsonRecordSchema.optional(),
});

export const UpdateEpochEnvironmentSchema = CreateEpochEnvironmentSchema.partial();

export const BindEpochIntegrationEnvironmentSchema = z.object({
  environmentId: z.string().min(1).nullable(),
});

export const CreateEpochProjectSchema = z.object({
  name: z.string().min(1).max(300),
  status: z.enum(["active", "archived"]).optional(),
  metadata: JsonRecordSchema.optional(),
});

export const UpdateEpochProjectSchema = CreateEpochProjectSchema.partial();

export const DiscoverEpochSoftwareWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(200),
  ref: z.string().min(1).max(255).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const DiscoverEpochHttpWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  allowPrivateNetwork: z.boolean().optional().default(false),
});

export const DiscoverEpochPostgresWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  connectionEnvVar: z.string().regex(/^EPOCH_V13_POSTGRES_[A-Z0-9_]+$/),
});

export const DiscoverEpochDockerWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  contextEnvVar: z.string().regex(/^EPOCH_V13_DOCKER_CONTEXT_[A-Z0-9_]+$/).optional(),
});

export const DiscoverEpochKubernetesWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  contextEnvVar: z.string().regex(/^EPOCH_V13_KUBERNETES_CONTEXT_[A-Z0-9_]+$/).optional(),
});

const EpochTelemetrySourceSchema = z.string().regex(/^EPOCH_V13_(LOGS|METRICS|TRACES|CI)_URL_[A-Z0-9_]+$/);

export const DiscoverEpochTelemetryWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  logsUrlEnvVar: EpochTelemetrySourceSchema.optional(),
  metricsUrlEnvVar: EpochTelemetrySourceSchema.optional(),
  tracesUrlEnvVar: EpochTelemetrySourceSchema.optional(),
  ciUrlEnvVar: EpochTelemetrySourceSchema.optional(),
}).refine(
  (value) => Boolean(value.logsUrlEnvVar || value.metricsUrlEnvVar || value.tracesUrlEnvVar || value.ciUrlEnvVar),
  { message: "At least one telemetry source environment variable is required" },
);

export const DiscoverEpochCloudWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  provider: z.enum(["aws", "azure", "gcp", "digitalocean", "custom"]),
  endpointEnvVar: z.string().regex(/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/),
  tokenEnvVar: z.string().regex(/^EPOCH_V13_CLOUD_TOKEN_[A-Z0-9_]+$/).optional(),
  resourceUrlEnvVars: z.object({
    compute: z.string().regex(/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/).optional(),
    containers: z.string().regex(/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/).optional(),
    databases: z.string().regex(/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/).optional(),
    queues: z.string().regex(/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/).optional(),
    deployments: z.string().regex(/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/).optional(),
  }).optional(),
});

export const DiscoverEpochDataCenterWorldStateSchema = z.object({
  projectId: z.string().min(1).max(200),
  environmentId: z.string().min(1).max(200),
  provider: z.string().min(1).max(100),
  endpointEnvVar: z.string().regex(/^EPOCH_V13_DATACENTER_URL_[A-Z0-9_]+$/),
  tokenEnvVar: z.string().regex(/^EPOCH_V13_DATACENTER_TOKEN_[A-Z0-9_]+$/).optional(),
  resourceUrlEnvVars: z.object({
    compute: z.string().regex(/^EPOCH_V13_DATACENTER_URL_[A-Z0-9_]+$/).optional(),
    storage: z.string().regex(/^EPOCH_V13_DATACENTER_URL_[A-Z0-9_]+$/).optional(),
    network: z.string().regex(/^EPOCH_V13_DATACENTER_URL_[A-Z0-9_]+$/).optional(),
    power: z.string().regex(/^EPOCH_V13_DATACENTER_URL_[A-Z0-9_]+$/).optional(),
  }).optional(),
});

export const EpochCloudActionSchema = z.object({
  projectId: z.string().min(1),
  environmentId: z.string().min(1),
  provider: z.enum(["aws", "azure", "gcp", "digitalocean", "custom"]),
  policyId: z.string().min(1),
  endpointEnvVar: z.string().regex(/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/),
  tokenEnvVar: z.string().regex(/^EPOCH_V13_CLOUD_TOKEN_[A-Z0-9_]+$/).optional(),
  resourceType: z.enum(["cloud", "compute", "containers", "databases", "queues", "deployments"]),
  action: z.enum(["read", "simulate", "stage", "execute", "rollback"]),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
  dryRun: z.boolean().default(true),
  approvalToken: z.string().min(1).max(500).optional(),
  idempotencyKey: z.string().min(8).max(200),
  body: JsonRecordSchema.optional(),
});

export const CreateEpochSimulationSchema = z.object({
  projectId: z.string().min(1),
  environmentId: z.string().min(1),
  name: z.string().min(1).max(300),
  mode: z.enum(["replay", "what_if", "fault_injection", "load", "regression"]).default("replay"),
  configuration: JsonRecordSchema.optional(),
});

export const RunEpochSimulationSchema = z.object({
  missionId: z.string().min(1).optional(),
  workerId: z.string().min(1).optional(),
  seed: z.number().int().optional(),
  variables: JsonRecordSchema.optional(),
  faults: z.array(JsonRecordSchema).max(50).optional(),
});

export const VerifyEpochSimulationSchema = z.object({
  expectedStatus: z.enum(["completed", "failed"]).default("completed"),
});

export const PromoteEpochSimulationSchema = z.object({
  decision: z.enum(["promote", "reject"]),
  approval: z.literal(true),
});

export const EpochQueueJobTypeSchema = z.enum(["plan", "execute", "review", "verify", "certificate", "memory", "benchmark", "quality", "model_sync", "model_benchmark", "model_quality"]);

export const EpochQueueEnqueueSchema = z.object({
  institutionId: z.string().min(1).optional(),
  missionId: z.string().min(1).optional(),
  type: EpochQueueJobTypeSchema,
  payload: JsonRecordSchema.optional(),
});

export const EpochQueueLeaseSchema = z.object({
  workerId: z.string().min(1).max(120).optional(),
  missionId: z.string().min(1).max(120).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  leaseMs: z.number().int().min(1000).max(300000).optional(),
});

export const EpochWorkerCompletionSchema = z.object({
  workerId: z.string().min(1).max(120),
  fencingToken: z.number().int().positive(),
});

export const EpochQueueFailSchema = z.object({
  error: z.string().min(1).max(4000),
});

export const EpochQueueRecoverySchema = z.object({
  reason: z.string().max(4000).optional(),
  notes: z.string().max(4000).optional(),
  delayMs: z.coerce.number().int().min(0).max(30000).optional(),
});

export const EpochWorkerKindSchema = z.enum(["software", "ai_agent", "simulated_edge", "human"]);
export const EpochWorkerStatusSchema = z.enum(["available", "busy", "draining", "offline", "blocked", "retired"]);

export const CreateEpochWorkerSchema = z.object({
  kind: EpochWorkerKindSchema,
  name: z.string().min(1).max(200),
  protocolVersion: z.string().min(1).max(80).default("epoch.worker.v1"),
  capabilities: z.array(z.string().min(1).max(120)).max(100).default([]),
  projectScope: JsonRecordSchema.default({}),
  maxConcurrency: z.number().int().min(1).max(100).default(1),
  metadata: JsonRecordSchema.default({}),
});

export const EpochWorkerUpdateSchema = z.object({
  status: EpochWorkerStatusSchema.optional(),
  capabilities: z.array(z.string().min(1).max(120)).max(100).optional(),
  projectScope: JsonRecordSchema.optional(),
  maxConcurrency: z.number().int().min(1).max(100).optional(),
  metadata: JsonRecordSchema.optional(),
});

export const EpochWorkerHeartbeatSchema = z.object({
  status: EpochWorkerStatusSchema.exclude(["retired"]).optional(),
  activeLeases: z.number().int().min(0).optional(),
});

export const EpochWorkerEvaluationSchema = z.object({
  missionId: z.string().min(1).optional(),
  outcome: z.enum(["passed", "failed", "unknown"]),
  score: z.number().int().min(0).max(100),
  latencyMs: z.number().int().nonnegative().optional(),
  evidence: JsonRecordSchema.optional(),
});

export const EpochWorkerEvaluationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const EpochRecoveryEscalationSchema = z.object({
  executionRunId: z.string().min(1).optional(),
  reason: z.string().min(1).max(4000),
  payload: JsonRecordSchema.optional(),
});

export const EpochRecoveryEscalationResolveSchema = z.object({
  resolution: z.string().min(1).max(4000),
});

export const EpochSettlementSchema = z.object({
  decision: z.enum(["PASS", "FAIL", "UNKNOWN"]),
  evidenceHash: z.string().min(1).max(200),
  assuranceConfidence: z.number().int().min(0).max(100),
  humanApproval: z.enum(["approved", "rejected", "review"]),
  unresolvedRisks: z.array(z.string().max(500)).max(100),
  summary: z.string().max(4000).optional(),
  lessons: z.array(z.string().max(1000)).max(100).optional(),
});

export const EpochArtifactSchema = z.object({
  institutionId: z.string().min(1).optional(),
  missionId: z.string().min(1).optional(),
  category: z.enum(["evidence", "document", "screenshot", "export", "certificate", "audit_trail"]),
  name: z.string().min(1).max(200),
  mimeType: z.string().max(120).optional(),
  url: z.string().url().max(2000).optional(),
  filePath: z.string().max(500).optional(),
  summary: z.string().max(4000).optional(),
  expiresAt: z.string().datetime().optional(),
  payload: JsonRecordSchema.optional(),
  proof: JsonRecordSchema.optional(),
});

export const EpochArtifactListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  institutionId: z.string().min(1).optional(),
  missionId: z.string().min(1).optional(),
  category: z.enum(["evidence", "document", "screenshot", "export", "certificate", "audit_trail"]).optional(),
});

export const EpochEventQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const EpochQueueStatusFilterSchema = z.enum(["queued", "leased", "done", "failed", "dead_lettered"]);

export const EpochQueueListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).max(400).optional(),
  status: EpochQueueStatusFilterSchema.optional(),
  type: EpochQueueJobTypeSchema.optional(),
});

export const EpochWebhookDeliveryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).max(400).optional(),
  status: z.enum(["pending", "retrying", "delivered", "dead_lettered"]).optional(),
});

export const EpochMissionControlExportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export const EpochMissionControlSnapshotQuerySchema = z.object({
  range: z.string().min(1).max(40).optional(),
  search: z.string().min(1).max(200).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

export const EpochMissionControlBootstrapSchema = z.object({
  useCase: z.enum(["sales_research", "vendor_due_diligence"]).optional(),
  reuseExisting: z.boolean().optional(),
});

export const EpochAuditExportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const EpochCertificateExportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export const EpochMissionControlRestoreSchema = z.object({
  artifactName: z.string().min(1).max(200).optional(),
  artifactId: z.string().min(1).max(200).optional(),
  snapshot: z.any().optional(),
});

export const EpochPagedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).max(400).optional(),
  search: z.string().min(1).max(200).optional(),
});

export const EpochMissionListQuerySchema = EpochPagedQuerySchema.extend({
  institutionId: z.string().min(1).optional(),
});

export const EpochEvidenceListQuerySchema = EpochPagedQuerySchema.extend({
  missionId: z.string().min(1).optional(),
});

export const EpochCertificateListQuerySchema = EpochPagedQuerySchema;

export const EpochMemoryRecordListQuerySchema = EpochPagedQuerySchema.extend({
  institutionId: z.string().min(1).optional(),
});

export const EpochIntegrationListQuerySchema = EpochPagedQuerySchema.extend({
  institutionId: z.string().min(1).optional(),
});

export const EpochInstitutionVersionsQuerySchema = EpochPagedQuerySchema;

export const EpochAuthorityPolicyListQuerySchema = EpochPagedQuerySchema.extend({
  missionId: z.string().min(1).optional(),
  institutionId: z.string().min(1).optional(),
});

export const EpochExecutionRunListQuerySchema = EpochPagedQuerySchema.extend({
  missionId: z.string().min(1).optional(),
});

export const EpochVerificationRunListQuerySchema = EpochPagedQuerySchema.extend({
  missionId: z.string().min(1).optional(),
});

export const EpochCertificateListViewQuerySchema = EpochPagedQuerySchema.extend({
  missionId: z.string().min(1).optional(),
});

export const EpochMemoryRecordListViewQuerySchema = EpochPagedQuerySchema.extend({
  institutionId: z.string().min(1).optional(),
  missionId: z.string().min(1).optional(),
});

export const EpochMemoryRecordParamsSchema = EpochWorkspaceParamsSchema.extend({
  memoryRecordId: z.string().min(1),
});

export const EpochQueueJobParamsSchema = EpochWorkspaceParamsSchema.extend({
  jobId: z.string().min(1),
});

export const EpochArtifactParamsSchema = EpochWorkspaceParamsSchema.extend({
  artifactId: z.string().min(1),
});

export const EpochArtifactAccessTokenQuerySchema = z.object({
  ttlSeconds: z.coerce.number().int().min(30).max(900).optional(),
  accessToken: z.string().min(20).max(2000).optional(),
});

import { z } from "zod";

/**
 * Canonical Day-1 domain contracts for the Epoch Reality Intelligence Runtime.
 *
 * These contracts deliberately live above adapters and persistence. Providers,
 * databases, workers, and physical systems must map into these objects rather
 * than becoming the domain model themselves.
 */
export const EPOCH_CANONICAL_CONTRACT_VERSION = "epoch.canonical.v1" as const;

const Id = z.string().min(1).max(200);
const NonEmpty = z.string().min(1);
const Json = z.record(z.string(), z.unknown());
const Timestamp = z.string().datetime({ offset: true });
const Confidence = z.number().min(0).max(1);

export const RealityKind = z.enum([
  "software", "ai_compute", "cloud", "kubernetes", "data_center",
  "physical", "scientific", "simulation", "sandbox",
]);
export const Classification = z.enum([
  "OBSERVED", "MEASURED", "USER_ASSERTED", "EXTERNAL", "INFERRED",
  "PREDICTED", "SIMULATED", "UNKNOWN", "STALE", "CONTRADICTED", "VERIFIED",
]);
export const Lifecycle = z.enum([
  "draft", "planned", "running", "paused", "completed", "failed",
  "blocked", "cancelled", "approved", "rejected", "expired",
]);

const Correlation = z.object({
  correlationId: Id,
  traceId: Id,
  causationId: Id.optional(),
});

const Metadata = z.object({
  contractVersion: z.literal(EPOCH_CANONICAL_CONTRACT_VERSION),
  id: Id,
  workspaceId: Id,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  correlation: Correlation,
});

export const ProvenanceSchema = z.object({
  sourceId: Id.optional(),
  sourceType: NonEmpty.optional(),
  sourceUri: z.string().max(2000).optional(),
  capturedAt: Timestamp.optional(),
  observedAt: Timestamp.optional(),
  validFrom: Timestamp.optional(),
  validUntil: Timestamp.optional(),
  classification: Classification,
  confidence: Confidence,
  integritySha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  derivation: z.array(Id).default([]),
});

export const IntentSchema = Metadata.extend({
  actorId: Id,
  source: NonEmpty,
  modality: z.enum(["text", "speech", "audio", "image", "video", "document", "tabular", "api", "telemetry", "event", "system"]),
  rawInputRef: Id.optional(),
  objective: NonEmpty,
  scope: Json.default({}),
  constraints: z.array(Json).default([]),
  requestedAction: NonEmpty.optional(),
  references: z.array(z.object({
    raw: NonEmpty,
    type: NonEmpty,
    entityId: Id.optional(),
    confidence: Confidence,
  })).default([]),
  confidence: Confidence,
  status: z.enum(["draft", "compiled", "needs_clarification", "rejected"]),
});

export const OutcomeContractSchema = Metadata.extend({
  missionId: Id.optional(),
  objective: NonEmpty,
  baseline: Json,
  targetMetrics: z.array(z.object({
    metric: NonEmpty,
    operator: z.enum(["lt", "lte", "eq", "gte", "gt", "decrease", "increase", "non_regression"]),
    target: z.number().optional(),
    unit: z.string().max(100).optional(),
    hard: z.boolean(),
  })).min(1),
  hardConstraints: z.array(Json).default([]),
  softObjectives: z.array(Json).default([]),
  prohibitedTradeoffs: z.array(Json).default([]),
  observationWindow: z.object({ start: Timestamp.optional(), durationSeconds: z.number().int().positive() }),
  successCriteria: z.array(NonEmpty).min(1),
  verificationMethod: NonEmpty,
  authorityRequirements: z.array(NonEmpty).default([]),
  expiresAt: Timestamp.optional(),
});

export const MissionSchema = Metadata.extend({
  title: NonEmpty,
  objective: NonEmpty,
  state: z.enum(["draft", "discovering", "investigating", "designing", "experimenting", "deciding", "authority", "executing", "observing", "verifying", "learning", "succeeded", "failed", "uncertain", "cancelled"]),
  intentId: Id,
  outcomeContractId: Id,
  environmentIds: z.array(Id).default([]),
  currentWorldStateId: Id.optional(),
  plannedWorldStateId: Id.optional(),
  unknownIds: z.array(Id).default([]),
  hypothesisIds: z.array(Id).default([]),
  candidateIds: z.array(Id).default([]),
  authorityPolicyId: Id,
  expiresAt: Timestamp.optional(),
});

export const RealityEntitySchema = Metadata.extend({
  canonicalKey: NonEmpty,
  entityType: NonEmpty,
  name: NonEmpty,
  kind: RealityKind,
  attributes: Json.default({}),
  provenance: ProvenanceSchema,
  validFrom: Timestamp,
  validUntil: Timestamp.optional(),
  status: z.enum(["active", "inactive", "unknown", "stale", "contradicted"]),
});

export const EnvironmentSchema = Metadata.extend({
  name: NonEmpty,
  kind: RealityKind,
  provider: NonEmpty.optional(),
  configuration: Json.default({}),
  topology: Json.default({}),
  status: z.enum(["discovered", "configured", "ready", "degraded", "unavailable", "retired", "unknown"]),
  provenance: ProvenanceSchema,
  freshness: z.enum(["fresh", "stale", "unknown"]),
});

export const StateSnapshotSchema = Metadata.extend({
  environmentId: Id,
  version: z.number().int().positive(),
  observedAt: Timestamp,
  facts: z.array(z.object({
    subjectId: Id,
    predicate: NonEmpty,
    value: z.unknown(),
    provenance: ProvenanceSchema,
  })).default([]),
  freshness: z.enum(["fresh", "stale", "unknown"]),
  integritySha256: z.string().regex(/^[a-f0-9]{64}$/i),
});

export const ObservationSchema = Metadata.extend({
  missionId: Id.optional(),
  experimentId: Id.optional(),
  environmentId: Id,
  kind: NonEmpty,
  value: Json,
  observedAt: Timestamp,
  provenance: ProvenanceSchema,
  temporalPosition: z.number().nonnegative().optional(),
}).refine((v) => Boolean(v.missionId || v.experimentId), { message: "Observation must belong to a mission or experiment." });

export const UnknownSchema = Metadata.extend({
  missionId: Id,
  statement: NonEmpty,
  importance: z.enum(["low", "medium", "high", "critical"]),
  impact: z.number().nonnegative(),
  uncertainty: Confidence,
  decisionDependency: z.boolean(),
  resolutionCost: z.number().nonnegative(),
  risk: z.enum(["low", "medium", "high", "critical"]),
  strategy: z.enum(["observe", "query", "estimate", "benchmark", "simulate", "experiment", "cross_validate", "ask", "block"]),
  status: z.enum(["open", "resolving", "resolved", "blocked", "rejected"]),
  evidenceIds: z.array(Id).default([]),
});

export const HypothesisSchema = Metadata.extend({
  missionId: Id,
  statement: NonEmpty,
  prior: Confidence,
  confidence: Confidence,
  evidenceIds: z.array(Id).default([]),
  experimentIds: z.array(Id).default([]),
  status: z.enum(["proposed", "testing", "supported", "rejected", "inconclusive"]),
});

export const CapabilitySchema = Metadata.extend({
  name: NonEmpty,
  category: NonEmpty,
  inputTypes: z.array(NonEmpty),
  outputTypes: z.array(NonEmpty),
  provider: NonEmpty.optional(),
  version: NonEmpty.optional(),
  status: z.enum(["discovered", "available", "degraded", "unavailable", "unknown"]),
  provenance: ProvenanceSchema,
});

export const ModelProfileSchema = Metadata.extend({
  repository: NonEmpty,
  revision: NonEmpty,
  commitSha: z.string().min(7).optional(),
  artifactDigest: NonEmpty.optional(),
  task: NonEmpty,
  modalities: z.array(NonEmpty),
  architecture: NonEmpty.optional(),
  contextWindow: z.number().int().positive().optional(),
  parameterCount: z.number().positive().optional(),
  license: NonEmpty.optional(),
  gated: z.boolean().optional(),
  claims: z.array(Json).default([]),
  verifiedFacts: z.array(Json).default([]),
  provenance: ProvenanceSchema,
  lifecycle: z.enum(["discovered", "profiled", "candidate", "benchmarked", "evaluated", "verified", "approved", "deployed", "rejected"]),
});

export const WorkloadProfileSchema = Metadata.extend({
  name: NonEmpty,
  modality: NonEmpty,
  requestShape: Json,
  inputTokens: z.number().nonnegative().optional(),
  outputTokens: z.number().nonnegative().optional(),
  requestRate: z.number().nonnegative().optional(),
  concurrency: z.number().int().nonnegative().optional(),
  slo: Json,
  baseline: Json,
  observationWindowSeconds: z.number().int().positive().optional(),
  provenance: ProvenanceSchema,
});

export const SystemSchema = Metadata.extend({
  name: NonEmpty,
  modelProfileId: Id.optional(),
  workloadProfileId: Id.optional(),
  runtime: Json,
  serving: Json,
  hardware: Json,
  network: Json.default({}),
  configuration: Json.default({}),
  environmentId: Id,
});

export const CandidateSystemSchema = Metadata.extend({
  missionId: Id,
  system: SystemSchema,
  compatibility: z.enum(["compatible", "incompatible", "unknown", "blocked"]),
  compatibilityReasons: z.array(NonEmpty).default([]),
  hardConstraintResult: z.enum(["pass", "fail", "unknown"]),
  predictedMetrics: Json.default({}),
  measuredMetrics: Json.default({}),
  risk: z.enum(["low", "medium", "high", "critical"]),
  rank: z.number().int().positive().optional(),
  status: z.enum(["generated", "eligible", "rejected", "testing", "selected", "deployed"]),
});

export const ExperimentSchema = Metadata.extend({
  missionId: Id,
  hypothesisId: Id.optional(),
  candidateId: Id.optional(),
  type: z.enum(["simulation", "sandbox", "benchmark", "controlled_test", "shadow", "canary", "ab_test", "counterfactual", "intervention"]),
  baseline: Json,
  intervention: Json,
  controls: Json.default({}),
  metrics: z.array(NonEmpty),
  durationSeconds: z.number().int().positive(),
  sampleSize: z.number().int().positive().optional(),
  safetyConstraints: z.array(Json).default([]),
  rollback: Json,
  evidenceRequirements: z.array(NonEmpty).default([]),
  verdictRules: z.array(Json).default([]),
  status: Lifecycle,
});

export const BenchmarkSchema = Metadata.extend({
  experimentId: Id,
  modelRevision: NonEmpty,
  artifactDigest: NonEmpty.optional(),
  runtimeVersion: NonEmpty,
  servingVersion: NonEmpty.optional(),
  hardware: Json,
  driver: Json.optional(),
  kernel: NonEmpty.optional(),
  container: NonEmpty.optional(),
  configuration: Json,
  workload: Json,
  dataset: Json.optional(),
  randomSeeds: z.array(z.number().int()),
  environment: Json,
  measurementMethod: NonEmpty,
  results: Json,
  reproducibilityHash: z.string().min(16),
  status: z.enum(["planned", "running", "completed", "failed", "non_reproducible"]),
});

export const DecisionSchema = Metadata.extend({
  missionId: Id,
  selectedCandidateId: Id.optional(),
  alternativeCandidateIds: z.array(Id),
  whyAlternativesLost: z.array(z.object({ candidateId: Id, reasons: z.array(NonEmpty) })),
  assumptions: z.array(NonEmpty),
  uncertainties: z.array(Id),
  expectedOutcome: Json,
  risk: z.enum(["low", "medium", "high", "critical"]),
  evidenceIds: z.array(Id),
  status: z.enum(["draft", "approved", "rejected", "superseded"]),
});

export const PolicySchema = Metadata.extend({
  name: NonEmpty,
  scope: z.enum(["organization", "workspace", "mission", "environment", "capability", "worker"]),
  decision: z.enum(["allow", "deny", "approval"]),
  permissions: z.array(NonEmpty),
  restrictions: z.array(NonEmpty),
  budgetCents: z.number().int().nonnegative().optional(),
});

export const AuthorityGrantSchema = Metadata.extend({
  policyId: Id,
  grantedBy: Id,
  subjectId: Id,
  actionTypes: z.array(NonEmpty),
  resourceIds: z.array(Id),
  expiresAt: Timestamp.optional(),
  status: z.enum(["active", "revoked", "expired"]),
});

export const ExecutionSchema = Metadata.extend({
  missionId: Id,
  action: NonEmpty,
  target: Json,
  authorityGrantId: Id,
  preconditions: z.array(Json),
  expectedPostconditions: z.array(Json),
  rollback: Json,
  timeoutSeconds: z.number().int().positive(),
  evidenceRequirements: z.array(NonEmpty),
  risk: z.enum(["low", "medium", "high", "critical"]),
  state: z.enum(["prepared", "approved", "executing", "completed", "failed", "compensating", "rolled_back", "blocked"]),
});

export const EvidenceSchema = Metadata.extend({
  missionId: Id,
  executionId: Id.optional(),
  claimId: Id.optional(),
  type: z.enum(["metric", "log", "trace", "benchmark", "artifact", "deployment", "sensor", "camera", "instrument", "approval", "attestation"]),
  uri: NonEmpty,
  contentHash: z.string().min(16),
  capturedAt: Timestamp,
  provenance: ProvenanceSchema,
});

export const VerificationSchema = Metadata.extend({
  missionId: Id,
  evidenceIds: z.array(Id).min(1),
  verifierId: Id,
  method: NonEmpty,
  observationWindow: z.object({ start: Timestamp, end: Timestamp }),
  verdict: z.enum(["VERIFIED", "FAILED", "PARTIALLY_VERIFIED", "UNCERTAIN", "CONTRADICTED", "EXPIRED"]),
  findings: z.array(Json),
  independent: z.literal(true),
});

export const WorldExperienceSchema = Metadata.extend({
  missionId: Id,
  environmentId: Id,
  initialStateId: Id,
  observationIds: z.array(Id),
  unknownIds: z.array(Id),
  hypothesisId: Id.optional(),
  actionId: Id.optional(),
  resultingStateId: Id.optional(),
  evidenceIds: z.array(Id),
  verificationId: Id,
  lessonIds: z.array(Id),
  provenance: z.array(ProvenanceSchema).min(1),
  privacy: z.enum(["unknown", "approved", "restricted", "redacted", "rejected"]),
  license: z.enum(["unknown", "approved", "restricted", "rejected"]),
  safety: z.enum(["unknown", "approved", "restricted", "rejected"]),
  teachingEligibility: z.enum(["pending", "eligible", "rejected", "restricted", "requires_redaction", "requires_review", "expired"]),
  lineage: z.array(Id),
});

export const LessonSchema = Metadata.extend({
  experienceId: Id,
  statement: NonEmpty,
  target: z.enum(["model", "skill", "tool", "retrieval", "workflow", "policy", "world_model", "execution"]),
  evidenceIds: z.array(Id).min(1),
  confidence: Confidence,
  status: z.enum(["candidate", "approved", "rejected"]),
});

export const TeachingDatasetSchema = Metadata.extend({
  lessonIds: z.array(Id).min(1),
  target: z.enum(["sft", "preference", "tool_use", "evaluation", "specialized_training", "world_model"]),
  version: NonEmpty,
  itemCount: z.number().int().nonnegative(),
  eligibility: z.enum(["pending", "approved", "rejected"]),
  lineage: z.array(Id),
});

export const TeachingRecordSchema = Metadata.extend({
  experienceId: Id,
  lessonId: Id.optional(),
  datasetId: Id.optional(),
  target: z.enum(["model", "skill", "tool", "retrieval", "workflow", "policy", "world_model", "execution"]),
  status: z.enum(["candidate", "eligible", "approved", "rejected", "consumed"]),
  sourceVerificationId: Id,
  lineage: z.array(Id),
});

export const ModelRevisionSchema = Metadata.extend({
  modelProfileId: Id,
  revision: NonEmpty,
  artifactDigest: NonEmpty,
  teachingDatasetIds: z.array(Id).default([]),
  evaluatorIds: z.array(Id).default([]),
  benchmarkIds: z.array(Id).default([]),
  lifecycle: z.enum(["candidate", "training", "benchmarked", "verified", "approved", "promoted", "rejected"]),
  lineage: z.array(Id),
});

export const SkillRevisionSchema = Metadata.extend({
  skillId: Id,
  version: NonEmpty,
  teachingDatasetIds: z.array(Id),
  benchmarkIds: z.array(Id),
  lifecycle: z.enum(["candidate", "verified", "approved", "promoted", "rejected"]),
  lineage: z.array(Id),
});

export const AgentPolicyRevisionSchema = Metadata.extend({
  agentId: Id,
  version: NonEmpty,
  teachingDatasetIds: z.array(Id),
  benchmarkIds: z.array(Id),
  lifecycle: z.enum(["candidate", "verified", "approved", "promoted", "rejected"]),
  lineage: z.array(Id),
});

export const WorldModelSchema = Metadata.extend({
  environmentId: Id,
  version: NonEmpty,
  entityIds: z.array(Id),
  observationIds: z.array(Id),
  dynamics: Json,
  predictionHorizonSeconds: z.number().nonnegative().optional(),
  lifecycle: z.enum(["candidate", "evaluated", "verified", "approved", "promoted", "rejected"]),
  lineage: z.array(Id),
});

export const RuntimeEventSchema = z.object({
  contractVersion: z.literal(EPOCH_CANONICAL_CONTRACT_VERSION),
  id: Id,
  workspaceId: Id,
  type: NonEmpty,
  subjectType: NonEmpty,
  subjectId: Id,
  occurredAt: Timestamp,
  correlation: Correlation,
  payload: Json,
});

export type Intent = z.infer<typeof IntentSchema>;
export type OutcomeContract = z.infer<typeof OutcomeContractSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type RealityEntity = z.infer<typeof RealityEntitySchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type StateSnapshot = z.infer<typeof StateSnapshotSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type Unknown = z.infer<typeof UnknownSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type Capability = z.infer<typeof CapabilitySchema>;
export type ModelProfile = z.infer<typeof ModelProfileSchema>;
export type WorkloadProfile = z.infer<typeof WorkloadProfileSchema>;
export type System = z.infer<typeof SystemSchema>;
export type CandidateSystem = z.infer<typeof CandidateSystemSchema>;
export type Experiment = z.infer<typeof ExperimentSchema>;
export type Benchmark = z.infer<typeof BenchmarkSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type AuthorityGrant = z.infer<typeof AuthorityGrantSchema>;
export type Execution = z.infer<typeof ExecutionSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Verification = z.infer<typeof VerificationSchema>;
export type WorldExperience = z.infer<typeof WorldExperienceSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type TeachingDataset = z.infer<typeof TeachingDatasetSchema>;
export type TeachingRecord = z.infer<typeof TeachingRecordSchema>;
export type ModelRevision = z.infer<typeof ModelRevisionSchema>;
export type SkillRevision = z.infer<typeof SkillRevisionSchema>;
export type AgentPolicyRevision = z.infer<typeof AgentPolicyRevisionSchema>;
export type WorldModel = z.infer<typeof WorldModelSchema>;
export type RuntimeEvent = z.infer<typeof RuntimeEventSchema>;

export const CANONICAL_SCHEMAS = {
  Intent: IntentSchema,
  OutcomeContract: OutcomeContractSchema,
  Mission: MissionSchema,
  RealityEntity: RealityEntitySchema,
  Environment: EnvironmentSchema,
  StateSnapshot: StateSnapshotSchema,
  Observation: ObservationSchema,
  Unknown: UnknownSchema,
  Hypothesis: HypothesisSchema,
  Capability: CapabilitySchema,
  ModelProfile: ModelProfileSchema,
  WorkloadProfile: WorkloadProfileSchema,
  System: SystemSchema,
  CandidateSystem: CandidateSystemSchema,
  Experiment: ExperimentSchema,
  Benchmark: BenchmarkSchema,
  Decision: DecisionSchema,
  Policy: PolicySchema,
  AuthorityGrant: AuthorityGrantSchema,
  Execution: ExecutionSchema,
  Evidence: EvidenceSchema,
  Verification: VerificationSchema,
  WorldExperience: WorldExperienceSchema,
  Lesson: LessonSchema,
  TeachingDataset: TeachingDatasetSchema,
  TeachingRecord: TeachingRecordSchema,
  ModelRevision: ModelRevisionSchema,
  SkillRevision: SkillRevisionSchema,
  AgentPolicyRevision: AgentPolicyRevisionSchema,
  WorldModel: WorldModelSchema,
  RuntimeEvent: RuntimeEventSchema,
} as const;

export function assertTenantScope(value: { workspaceId: string }, workspaceId: string): void {
  if (value.workspaceId !== workspaceId) {
    throw new Error("CROSS_TENANT_ACCESS_BLOCKED");
  }
}

export function assertFreshState(snapshot: Pick<StateSnapshot, "freshness">): void {
  if (snapshot.freshness !== "fresh") {
    throw new Error("STALE_CONSEQUENTIAL_STATE");
  }
}

export function assertTeachingEligible(experience: Pick<WorldExperience, "teachingEligibility" | "privacy" | "license" | "safety">): void {
  if (experience.teachingEligibility !== "eligible" || experience.privacy !== "approved" || experience.license !== "approved" || experience.safety !== "approved") {
    throw new Error("TEACHING_ELIGIBILITY_REQUIRED");
  }
}

export function assertIndependentVerification(verification: Pick<Verification, "independent">): void {
  if (verification.independent !== true) {
    throw new Error("INDEPENDENT_VERIFICATION_REQUIRED");
  }
}

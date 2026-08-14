import { z } from "zod";

export const EPOCH_V13_CONTRACT_VERSION = "epoch.runtime.v13" as const;

const Id = z.string().min(1).max(200);
const Json = z.record(z.string(), z.unknown());
const Timestamp = z.string().datetime();
const Environment = z.enum(["software", "cloud", "data_center", "simulation", "edge", "sandbox"]);

export const EpochArchitectureStageV1Schema = z.object({
  name: z.enum([
    "customer",
    "capability_fabric",
    "sandbox_verify",
    "mission",
    "worker_protocol",
    "environment",
    "edge",
    "execute",
    "observe",
    "measure",
    "evidence",
    "verification",
    "discovery",
    "action",
    "measure_again",
    "customer_outcome",
    "experience",
    "future_discovery",
  ]),
  status: z.enum(["pending", "running", "completed", "failed", "blocked"]),
  artifactIds: z.array(Id),
  reason: z.string().max(1000),
  completedAt: Timestamp.optional(),
});

const ContractMetadata = z.object({
  contractVersion: z.literal(EPOCH_V13_CONTRACT_VERSION),
  id: Id,
  workspaceId: Id,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  correlation: z.object({
    correlationId: Id,
    traceId: Id,
    causationId: Id.optional(),
  }),
});

export const EpochArchitectureRunV1Schema = ContractMetadata.extend({
  missionId: Id,
  environment: Environment,
  status: z.enum(["planned", "running", "completed", "failed", "blocked"]),
  currentStage: EpochArchitectureStageV1Schema.shape.name,
  stages: z.array(EpochArchitectureStageV1Schema).length(18),
  evidenceIds: z.array(Id),
  verificationIds: z.array(Id),
  outcomeId: Id.optional(),
  experienceId: Id.optional(),
});

const ControlPlaneIdentity = z.object({
  contractVersion: z.literal(EPOCH_V13_CONTRACT_VERSION),
  id: Id,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  correlation: z.object({
    correlationId: Id,
    traceId: Id,
    causationId: Id.optional(),
  }),
});

export const OrganizationV1Schema = ControlPlaneIdentity.extend({
  orgId: Id,
  name: z.string().min(1).max(300),
  status: z.enum(["active", "suspended", "archived"]),
});

export const ProjectV1Schema = ControlPlaneIdentity.extend({
  orgId: Id,
  workspaceId: Id,
  name: z.string().min(1).max(300),
  status: z.enum(["active", "archived"]),
});

export const UserV1Schema = ControlPlaneIdentity.extend({
  userId: Id,
  orgId: Id,
  roleIds: z.array(Id),
  status: z.enum(["active", "suspended", "removed"]),
});

export const RoleV1Schema = ControlPlaneIdentity.extend({
  orgId: Id,
  name: z.string().min(1).max(300),
  permissions: z.array(Id),
});

export const EnvironmentV1Schema = ControlPlaneIdentity.extend({
  projectId: Id,
  kind: Environment,
  name: z.string().min(1).max(300),
  status: z.enum(["connected", "degraded", "disconnected", "unknown"]),
  region: z.string().min(1).optional(),
});

export const ConnectionV1Schema = ControlPlaneIdentity.extend({
  environmentId: Id,
  provider: Id,
  status: z.enum(["connected", "paused", "error", "disconnected"]),
  scopes: z.array(Id),
  capabilities: z.array(Id),
});

export const MissionControlStateV1Schema = ControlPlaneIdentity.extend({
  projectId: Id.optional(),
  environmentIds: z.array(Id),
  activeMissionCount: z.number().int().nonnegative(),
  runningExecutionCount: z.number().int().nonnegative(),
  pendingApprovalCount: z.number().int().nonnegative(),
  workerCount: z.number().int().nonnegative(),
  evidenceCount: z.number().int().nonnegative(),
  verificationCount: z.number().int().nonnegative(),
});

export const UnknownV1Schema = ContractMetadata.extend({
  title: z.string().min(1).max(500),
  question: z.string().min(1).max(8000),
  desiredOutcome: z.string().max(4000).optional(),
  environment: Environment,
  risk: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "investigating", "resolved", "rejected"]),
  metadata: Json,
});

export const DiscoveryProgramV1Schema = ContractMetadata.extend({
  unknownId: Id,
  title: z.string().min(1).max(500),
  status: z.enum(["planned", "active", "paused", "completed", "cancelled"]),
  hypothesisIds: z.array(Id),
  experimentIds: z.array(Id),
  acceptanceCriteria: z.array(z.string().min(1).max(1000)),
});

export const WorldStateV1Schema = ContractMetadata.extend({
  environment: Environment,
  version: z.number().int().positive(),
  snapshot: Json,
  sourceIds: z.array(Id),
  freshness: z.enum(["fresh", "stale", "unknown"]),
});

export const SimulationRunV1Schema = ContractMetadata.extend({
  projectId: Id,
  environmentId: Id,
  missionId: Id.optional(),
  mode: z.enum(["replay", "what_if", "fault_injection", "load", "regression"]),
  status: z.enum(["configured", "running", "completed", "failed", "cancelled", "promoted", "rejected"]),
  seed: z.number().int(),
  simulated: z.literal(true),
  result: Json,
});

export const HypothesisV1Schema = ContractMetadata.extend({
  discoveryProgramId: Id,
  statement: z.string().min(1).max(4000),
  confidence: z.number().min(0).max(1),
  status: z.enum(["proposed", "supported", "rejected", "inconclusive"]),
  evidenceIds: z.array(Id),
});

export const CapabilityGapV1Schema = ContractMetadata.extend({
  name: z.string().min(1).max(300),
  description: z.string().max(4000),
  requiredCapabilities: z.array(z.string().min(1).max(200)),
  availableCapabilities: z.array(z.string().min(1).max(200)),
  status: z.enum(["identified", "planned", "building", "verified", "closed"]),
});

export const ExperimentV1Schema = ContractMetadata.extend({
  discoveryProgramId: Id,
  hypothesisId: Id,
  environment: Environment,
  plan: z.array(z.string().min(1).max(1000)).min(1),
  status: z.enum(["planned", "running", "completed", "failed", "cancelled"]),
  result: Json.optional(),
});

export const ObservationV1Schema = ContractMetadata.extend({
  missionId: Id.optional(),
  experimentId: Id.optional(),
  environment: Environment,
  kind: z.string().min(1).max(200),
  value: Json,
  observedAt: Timestamp,
}).refine((value) => Boolean(value.missionId || value.experimentId), {
  message: "An observation must belong to a mission or experiment.",
  path: ["missionId"],
});

export const ActionV1Schema = ContractMetadata.extend({
  missionId: Id.optional(),
  automationId: Id.optional(),
  environment: Environment,
  name: z.string().min(1).max(300),
  status: z.enum(["proposed", "approved", "executing", "completed", "failed", "denied"]),
  parameters: Json,
  policyDecisionId: Id,
}).refine((value) => Boolean(value.missionId || value.automationId), {
  message: "An action must belong to a mission or automation.",
  path: ["missionId"],
});

export const OutcomeV1Schema = ContractMetadata.extend({
  missionId: Id,
  status: z.enum(["pending", "achieved", "not_achieved", "unknown"]),
  summary: z.string().max(4000),
  verificationId: Id.optional(),
  evidenceIds: z.array(Id),
});

export const ExperienceV1Schema = ContractMetadata.extend({
  sourceOutcomeId: Id,
  summary: z.string().min(1).max(4000),
  lessons: z.array(z.string().min(1).max(1000)),
  confidence: z.number().min(0).max(1),
  reusable: z.boolean(),
});

export const AutomationV1Schema = ContractMetadata.extend({
  name: z.string().min(1).max(300),
  trigger: z.object({ type: z.string().min(1).max(200), filter: Json.optional() }),
  level: z.enum(["A0", "A1", "A2", "A3", "A4", "A5", "A6"]),
  status: z.enum(["draft", "active", "paused", "disabled"]),
  policyId: Id,
  actionIds: z.array(Id),
  verificationRequired: z.boolean(),
  budgetCents: z.number().int().nonnegative(),
});

export const WorkerProtocolV1Schema = z.object({
  protocolVersion: z.literal("epoch.worker.v1"),
  workerId: Id,
  missionId: Id,
  environment: Environment,
  capabilities: z.array(z.string().min(1).max(200)),
  maxConcurrency: z.number().int().positive(),
});

export const PolicyV1Schema = ContractMetadata.extend({
  name: z.string().min(1).max(300),
  scope: z.enum(["organization", "project", "mission", "worker", "capability", "environment"]),
  decision: z.enum(["allow", "deny", "approval"]),
  permissions: z.array(z.string().min(1).max(200)),
  restrictions: z.array(z.string().min(1).max(500)),
});

export const RuntimeEventV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V13_CONTRACT_VERSION),
  id: Id,
  type: z.string().min(1).max(200),
  occurredAt: Timestamp,
  subjectType: z.enum(["unknown", "discovery_program", "world_state", "hypothesis", "capability_gap", "experiment", "mission", "worker", "assignment", "execution", "observation", "evidence", "verification", "policy", "action", "outcome", "experience", "automation"]),
  subjectId: Id,
  correlation: z.object({ correlationId: Id, traceId: Id, causationId: Id.optional() }),
  payload: Json,
});

export const EPOCH_V13_CONTRACTS = {
  Organization: OrganizationV1Schema,
  Project: ProjectV1Schema,
  User: UserV1Schema,
  Role: RoleV1Schema,
  Environment: EnvironmentV1Schema,
  Connection: ConnectionV1Schema,
  MissionControlState: MissionControlStateV1Schema,
  Unknown: UnknownV1Schema,
  DiscoveryProgram: DiscoveryProgramV1Schema,
  WorldState: WorldStateV1Schema,
  SimulationRun: SimulationRunV1Schema,
  Hypothesis: HypothesisV1Schema,
  CapabilityGap: CapabilityGapV1Schema,
  Experiment: ExperimentV1Schema,
  Observation: ObservationV1Schema,
  Action: ActionV1Schema,
  Outcome: OutcomeV1Schema,
  Experience: ExperienceV1Schema,
  Automation: AutomationV1Schema,
  WorkerProtocol: WorkerProtocolV1Schema,
  Policy: PolicyV1Schema,
  RuntimeEvent: RuntimeEventV1Schema,
  ArchitectureStage: EpochArchitectureStageV1Schema,
  ArchitectureRun: EpochArchitectureRunV1Schema,
} as const;

export type OrganizationV1 = z.infer<typeof OrganizationV1Schema>;
export type ProjectV1 = z.infer<typeof ProjectV1Schema>;
export type UserV1 = z.infer<typeof UserV1Schema>;
export type RoleV1 = z.infer<typeof RoleV1Schema>;
export type EnvironmentV1 = z.infer<typeof EnvironmentV1Schema>;
export type ConnectionV1 = z.infer<typeof ConnectionV1Schema>;
export type MissionControlStateV1 = z.infer<typeof MissionControlStateV1Schema>;
export type UnknownV1 = z.infer<typeof UnknownV1Schema>;
export type DiscoveryProgramV1 = z.infer<typeof DiscoveryProgramV1Schema>;
export type WorldStateV1 = z.infer<typeof WorldStateV1Schema>;
export type SimulationRunV1 = z.infer<typeof SimulationRunV1Schema>;
export type HypothesisV1 = z.infer<typeof HypothesisV1Schema>;
export type CapabilityGapV1 = z.infer<typeof CapabilityGapV1Schema>;
export type ExperimentV1 = z.infer<typeof ExperimentV1Schema>;
export type ObservationV1 = z.infer<typeof ObservationV1Schema>;
export type ActionV1 = z.infer<typeof ActionV1Schema>;
export type OutcomeV1 = z.infer<typeof OutcomeV1Schema>;
export type ExperienceV1 = z.infer<typeof ExperienceV1Schema>;
export type AutomationV1 = z.infer<typeof AutomationV1Schema>;
export type WorkerProtocolV1 = z.infer<typeof WorkerProtocolV1Schema>;
export type PolicyV1 = z.infer<typeof PolicyV1Schema>;
export type RuntimeEventV13 = z.infer<typeof RuntimeEventV1Schema>;
export type EpochArchitectureStageV1 = z.infer<typeof EpochArchitectureStageV1Schema>;
export type EpochArchitectureRunV1 = z.infer<typeof EpochArchitectureRunV1Schema>;

import { z } from "zod";

export const EPOCH_V12_CONTRACT_VERSION = "epoch.runtime.v1" as const;

const Id = z.string().min(1);
const Json = z.record(z.string(), z.unknown());
const Timestamp = z.string().datetime();

export const MissionStateSchema = z.enum([
  "draft",
  "running",
  "waiting_review",
  "completed",
  "failed",
]);

export const WorkerStatusSchema = z.enum(["online", "draining", "offline", "blocked", "retired"]);
export const AssignmentStateSchema = z.enum(["queued", "leased", "running", "completed", "failed", "cancelled"]);
export const ExecutionStateSchema = z.enum(["queued", "running", "completed", "failed", "timed_out", "cancelled"]);
export const EvidenceKindSchema = z.string().min(1).max(120);
export const VerificationDecisionSchema = z.enum(["PASS", "FAIL", "UNKNOWN"]);
export const PolicyDecisionSchema = z.enum(["allow", "deny", "review"]);

export const CorrelationSchema = z.object({
  correlationId: Id,
  traceId: Id,
  causationId: Id.optional(),
});

export const MissionV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  workspaceId: Id,
  institutionId: Id,
  title: z.string().min(1),
  objective: z.string().min(1),
  state: MissionStateSchema,
  plan: z.array(z.string()),
  currentStep: z.string().nullable(),
  budgetCents: z.number().int().nonnegative(),
  deadlineAt: Timestamp.nullable(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  correlation: CorrelationSchema,
});

export const WorkerV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  kind: z.enum(["software", "ai_agent", "simulated_edge", "human"]),
  name: z.string().min(1),
  status: WorkerStatusSchema,
  capabilities: z.array(z.string()),
  correlation: CorrelationSchema,
});

export const AssignmentV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  missionId: Id,
  workerId: Id,
  state: AssignmentStateSchema,
  attempt: z.number().int().positive(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  correlation: CorrelationSchema,
});

export const ExecutionV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  missionId: Id,
  assignmentId: Id.nullable(),
  state: ExecutionStateSchema,
  attempt: z.number().int().positive(),
  logs: z.array(Json),
  startedAt: Timestamp.nullable(),
  finishedAt: Timestamp.nullable(),
  correlation: CorrelationSchema,
});

export const EvidenceV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  missionId: Id,
  executionId: Id.nullable(),
  kind: EvidenceKindSchema,
  summary: z.string(),
  payload: Json,
  proof: Json,
  createdAt: Timestamp,
  correlation: CorrelationSchema,
});

export const VerificationV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  missionId: Id,
  executionId: Id.nullable(),
  decision: VerificationDecisionSchema,
  confidence: z.number().int().min(0).max(100),
  evidenceIds: z.array(Id),
  checklist: z.array(z.string()),
  createdAt: Timestamp,
  correlation: CorrelationSchema,
});

export const PolicyDecisionV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  missionId: Id,
  decision: PolicyDecisionSchema,
  reason: z.string(),
  policyIds: z.array(Id),
  createdAt: Timestamp,
  correlation: CorrelationSchema,
});

export const RuntimeEventV1Schema = z.object({
  contractVersion: z.literal(EPOCH_V12_CONTRACT_VERSION),
  id: Id,
  type: z.string().min(1),
  occurredAt: Timestamp,
  subjectType: z.enum(["mission", "worker", "assignment", "execution", "evidence", "verification", "policy"]),
  subjectId: Id,
  payload: Json,
  correlation: CorrelationSchema,
});

export const EPOCH_V12_CONTRACT_NAMES = [
  "Mission",
  "Worker",
  "Assignment",
  "Execution",
  "Evidence",
  "Verification",
  "PolicyDecision",
  "RuntimeEvent",
] as const;

export const EPOCH_V12_CONTRACTS = {
  Mission: MissionV1Schema,
  Worker: WorkerV1Schema,
  Assignment: AssignmentV1Schema,
  Execution: ExecutionV1Schema,
  Evidence: EvidenceV1Schema,
  Verification: VerificationV1Schema,
  PolicyDecision: PolicyDecisionV1Schema,
  RuntimeEvent: RuntimeEventV1Schema,
} as const;

export type MissionV1 = z.infer<typeof MissionV1Schema>;
export type WorkerV1 = z.infer<typeof WorkerV1Schema>;
export type AssignmentV1 = z.infer<typeof AssignmentV1Schema>;
export type ExecutionV1 = z.infer<typeof ExecutionV1Schema>;
export type EvidenceV1 = z.infer<typeof EvidenceV1Schema>;
export type VerificationV1 = z.infer<typeof VerificationV1Schema>;
export type PolicyDecisionV1 = z.infer<typeof PolicyDecisionV1Schema>;
export type RuntimeEventV1 = z.infer<typeof RuntimeEventV1Schema>;

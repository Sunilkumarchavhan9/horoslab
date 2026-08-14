import { randomUUID } from "node:crypto";
import type {
  EvidenceV1,
  ExecutionV1,
  MissionV1,
  PolicyDecisionV1,
  VerificationV1,
} from "./contracts";
import {
  EPOCH_V12_CONTRACT_VERSION,
  EvidenceV1Schema,
  ExecutionV1Schema,
  MissionV1Schema,
  PolicyDecisionV1Schema,
  VerificationV1Schema,
} from "./contracts";

type LegacyRecord = Record<string, any>;

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return new Date(value).toISOString();
  return new Date(0).toISOString();
}

function correlation(record: LegacyRecord, fallbackSubject: string) {
  const source = record.correlation ?? {};
  return {
    correlationId: String(source.correlationId ?? record.correlationId ?? `corr_${fallbackSubject}`),
    traceId: String(source.traceId ?? record.traceId ?? `trace_${fallbackSubject}`),
    ...(source.causationId ?? record.causationId
      ? { causationId: String(source.causationId ?? record.causationId) }
      : {}),
  };
}

export function createCorrelation(subjectId = randomUUID().slice(0, 12)) {
  return { correlationId: `corr_${subjectId}`, traceId: `trace_${subjectId}` };
}

export function adaptEpochMission(record: LegacyRecord): MissionV1 {
  return MissionV1Schema.parse({
    contractVersion: EPOCH_V12_CONTRACT_VERSION,
    id: String(record.id),
    workspaceId: String(record.workspaceId),
    institutionId: String(record.institutionId),
    title: String(record.title),
    objective: String(record.objective),
    state: record.state ?? "draft",
    plan: Array.isArray(record.plan) ? record.plan : [],
    currentStep: record.currentStep ?? null,
    budgetCents: Number(record.budgetCents ?? 0),
    deadlineAt: record.deadlineAt ? iso(record.deadlineAt) : null,
    createdAt: iso(record.createdAt),
    updatedAt: iso(record.updatedAt),
    correlation: correlation(record, String(record.id)),
  });
}

export function adaptEpochExecution(record: LegacyRecord): ExecutionV1 {
  return ExecutionV1Schema.parse({
    contractVersion: EPOCH_V12_CONTRACT_VERSION,
    id: String(record.id),
    missionId: String(record.missionId),
    assignmentId: record.assignmentId ? String(record.assignmentId) : null,
    state: record.status ?? "running",
    attempt: Math.max(1, Number(record.retries ?? 0) + 1),
    logs: Array.isArray(record.logs) ? record.logs : [],
    startedAt: record.startedAt ? iso(record.startedAt) : null,
    finishedAt: record.finishedAt ? iso(record.finishedAt) : null,
    correlation: correlation(record, String(record.id)),
  });
}

export function adaptEpochEvidence(record: LegacyRecord): EvidenceV1 {
  return EvidenceV1Schema.parse({
    contractVersion: EPOCH_V12_CONTRACT_VERSION,
    id: String(record.id),
    missionId: String(record.missionId),
    executionId: record.executionRunId ? String(record.executionRunId) : null,
    kind: String(record.kind),
    summary: String(record.summary ?? ""),
    payload: record.payload && typeof record.payload === "object" ? record.payload : {},
    proof: record.proof && typeof record.proof === "object" ? record.proof : {},
    createdAt: iso(record.createdAt),
    correlation: correlation(record, String(record.id)),
  });
}

export function adaptEpochVerification(record: LegacyRecord): VerificationV1 {
  const decision = record.finalDecision === "pass" ? "PASS" : record.finalDecision === "fail" ? "FAIL" : "UNKNOWN";
  return VerificationV1Schema.parse({
    contractVersion: EPOCH_V12_CONTRACT_VERSION,
    id: String(record.id),
    missionId: String(record.missionId),
    executionId: record.executionRunId ? String(record.executionRunId) : null,
    decision,
    confidence: Math.max(0, Math.min(100, Number(record.confidence ?? 0))),
    evidenceIds: Array.isArray(record.evidenceIds) ? record.evidenceIds.map(String) : [],
    checklist: Array.isArray(record.checklist) ? record.checklist.map(String) : [],
    createdAt: iso(record.createdAt),
    correlation: correlation(record, String(record.id)),
  });
}

export function adaptEpochPolicyDecision(record: LegacyRecord): PolicyDecisionV1 {
  return PolicyDecisionV1Schema.parse({
    contractVersion: EPOCH_V12_CONTRACT_VERSION,
    id: String(record.id ?? `policy_${randomUUID().slice(0, 12)}`),
    missionId: String(record.missionId),
    decision: record.blocked ? "deny" : record.needsApproval ? "review" : "allow",
    reason: String(record.reason ?? record.name ?? "Legacy Epoch authority policy"),
    policyIds: [String(record.id ?? "legacy-policy")],
    createdAt: iso(record.createdAt),
    correlation: correlation(record, String(record.missionId)),
  });
}

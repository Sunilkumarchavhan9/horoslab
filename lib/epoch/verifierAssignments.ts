import { randomUUID } from "node:crypto";
import { prisma } from "../storage/prismaClient";
import { runEpochVerification } from "./epochStore";

export type EpochVerifierKind = "software" | "ai_agent" | "human";

export function assertIndependentVerifier(input: { verifierId: string; executionWorkerId?: string | null }): void {
  if (input.executionWorkerId && input.verifierId === input.executionWorkerId) {
    throw new Error("epoch_verifier_must_be_independent");
  }
}

function json(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

export async function createEpochVerifierAssignment(input: {
  workspaceId: string;
  missionId: string;
  verifierId: string;
  verifierKind: EpochVerifierKind;
  evidenceIds?: string[];
  checklist?: string[];
}) {
  const mission = await prisma.epochMission.findFirst({
    where: { id: input.missionId, workspaceId: input.workspaceId },
    include: { executionRun: true, evidence: { orderBy: { createdAt: "asc" } } },
  });
  if (!mission) return null;
  const execution = mission.executionRun?.executor && typeof mission.executionRun.executor === "object"
    ? mission.executionRun.executor as Record<string, unknown>
    : {};
  const executionWorkerId = typeof execution.workerId === "string"
    ? execution.workerId
    : typeof execution.assignedWorkerId === "string" ? execution.assignedWorkerId : null;
  assertIndependentVerifier({ verifierId: input.verifierId, executionWorkerId });
  if (input.verifierKind !== "human") {
    const verifier = await prisma.epochWorker.findFirst({ where: { id: input.verifierId, workspaceId: input.workspaceId } });
    if (!verifier || verifier.retiredAt || verifier.status === "offline" || verifier.status === "blocked") throw new Error("epoch_verifier_worker_unavailable");
  }
  const availableEvidenceIds = new Set(mission.evidence.map((item) => item.id));
  const evidenceIds = input.evidenceIds ?? mission.evidence.map((item) => item.id);
  if (evidenceIds.some((id) => !availableEvidenceIds.has(id))) throw new Error("epoch_verifier_evidence_scope_mismatch");
  return prisma.epochVerifierAssignment.create({
    data: {
      workspaceId: input.workspaceId,
      missionId: input.missionId,
      executionRunId: mission.executionRun?.id,
      verifierId: input.verifierId,
      verifierKind: input.verifierKind,
      evidenceIds: json(evidenceIds),
      checklist: json(input.checklist ?? ["Re-run deterministic checks", "Validate evidence integrity", "Confirm acceptance criteria"]),
      proof: json({ assignmentVersion: "epoch.verifier-assignment.v1", createdBy: input.verifierId }),
    } as any,
  });
}

export async function getEpochVerifierAssignment(workspaceId: string, assignmentId: string) {
  return prisma.epochVerifierAssignment.findFirst({ where: { workspaceId, id: assignmentId } });
}

export async function listEpochVerifierAssignments(workspaceId: string, missionId?: string) {
  return prisma.epochVerifierAssignment.findMany({
    where: { workspaceId, ...(missionId ? { missionId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function completeEpochVerifierAssignment(input: {
  workspaceId: string;
  assignmentId: string;
  userId: string;
  orgId?: string;
  confidence?: number;
}) {
  const assignment = await prisma.epochVerifierAssignment.findFirst({ where: { workspaceId: input.workspaceId, id: input.assignmentId } });
  if (!assignment) return null;
  if (assignment.status === "completed") return assignment;
  const mission = await prisma.epochMission.findFirst({ where: { id: assignment.missionId, workspaceId: input.workspaceId }, include: { executionRun: true } });
  if (!mission) return null;
  const execution = mission.executionRun?.executor && typeof mission.executionRun.executor === "object" ? mission.executionRun.executor as Record<string, unknown> : {};
  assertIndependentVerifier({ verifierId: assignment.verifierId, executionWorkerId: typeof execution.workerId === "string" ? execution.workerId : null });
  const evidenceIds = Array.isArray(assignment.evidenceIds) ? assignment.evidenceIds.map(String) : [];
  const checklist = Array.isArray(assignment.checklist) ? assignment.checklist.map(String) : undefined;
  const verification = await runEpochVerification({
    workspaceId: input.workspaceId,
    missionId: assignment.missionId,
    executionRunId: assignment.executionRunId ?? undefined,
    userId: input.userId,
    orgId: input.orgId,
    evidence: evidenceIds.map((id) => ({ id })),
    checklist,
    humanApproval: "approved",
    confidence: input.confidence,
  });
  if (!verification) return null;
  return prisma.epochVerifierAssignment.update({
    where: { id: assignment.id },
    data: {
      status: "completed",
      decision: verification.finalDecision,
      confidence: verification.confidence,
      result: json({ verificationRunId: verification.id, assurance: verification.assurance }),
      proof: json({ ...(assignment.proof as Record<string, unknown>), completedBy: assignment.verifierId, completedAt: new Date().toISOString(), idempotencyKey: `verifier:${assignment.id}` }),
      completedAt: new Date(),
    } as any,
  });
}

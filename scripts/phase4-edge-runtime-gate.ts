import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/storage/prismaClient";
import { appendEpochEvidence, createEpochMission } from "../lib/epoch/epochStore";
import { registerEpochWorker } from "../lib/epoch/epochWorkers";
import {
  advertiseEpochEdgeCapabilities,
  issueEpochEdgeEnrollment,
  normalizeEpochEdgeState,
  queueEpochEdgeJob,
  reconcileEpochEdgeQueue,
  revokeEpochEdge,
  rollbackEpochEdgeUpdate,
  signEpochEdgeEnrollment,
  signEpochEdgeTelemetry,
  validateEpochEdgeTelemetrySequence,
  verifyEpochEdgeEnrollment,
  verifyEpochEdgeTelemetry,
} from "../lib/epoch/edgeRuntime";

const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
const userId = process.env.EPOCH_V13_GATE_USER_ID;
const orgId = process.env.EPOCH_V13_GATE_ORG_ID;

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  if (!workspaceId || !userId) {
    throw new Error("Set EPOCH_V13_GATE_WORKSPACE_ID and EPOCH_V13_GATE_USER_ID before running this gate.");
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true, orgId: true },
  });
  assertCondition(workspace, "The configured V13 gate workspace was not found for this user.");
  const organizationId = workspace.orgId ?? orgId;
  assertCondition(organizationId, "The configured V13 gate workspace has no organization boundary.");

  let institution = await prisma.epochInstitution.findFirst({
    where: { workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true },
  });
  if (!institution) {
    institution = await prisma.epochInstitution.create({
      data: {
        workspaceId,
        userId,
        orgId: organizationId,
        name: `V13 edge acceptance fixture ${Date.now()}`,
        category: "acceptance-test",
        summary: "Temporary institution for the V13 edge runtime acceptance gate.",
        metadata: { source: "backend:v13:acceptance" },
      },
      select: { id: true },
    });
    console.log(`[INFO] Created temporary V13 edge institution ${institution.id}.`);
  }

  const fixture = `V13 edge runtime gate ${new Date().toISOString()}`;
  const mission = await createEpochMission({
    workspaceId,
    institutionId: institution.id,
    userId,
    orgId: organizationId,
    title: `${fixture} mission`,
    objective: "Prove safe offline edge buffering and reconnect reconciliation.",
  });
  const worker = await registerEpochWorker({
    workspaceId,
    userId,
    orgId: organizationId,
    kind: "edge",
    name: fixture,
    protocolVersion: "epoch.worker.v1",
    capabilities: ["mission.execute", "telemetry", "evidence", "offline.queue"],
    projectScope: { missionId: mission.id },
    maxConcurrency: 1,
    metadata: { purpose: "phase4-edge-runtime-gate", missionId: mission.id },
  });

  const enrollmentSecret = `phase4-enrollment-${randomUUID()}`;
  const enrollment = issueEpochEdgeEnrollment({ workerId: worker.id, workspaceId });
  const signedEnrollment = { ...enrollment, signature: signEpochEdgeEnrollment(enrollment, enrollmentSecret) };
  assertCondition(verifyEpochEdgeEnrollment(signedEnrollment, enrollmentSecret), "Edge enrollment identity verification failed.");
  console.log(`[PASS] Edge enrollment identity verified: worker=${worker.id}.`);

  const telemetrySecret = `phase4-telemetry-${randomUUID()}`;
  const telemetry = {
    workerId: worker.id,
    sequence: 1,
    observedAt: new Date().toISOString(),
    connectivity: "offline" as const,
    metrics: { queueDepth: 2 },
  };
  const signedTelemetry = { ...telemetry, signature: signEpochEdgeTelemetry(telemetry, telemetrySecret) };
  assertCondition(verifyEpochEdgeTelemetry(signedTelemetry, telemetrySecret), "Edge telemetry signature verification failed.");
  assertCondition(validateEpochEdgeTelemetrySequence({ currentSequence: 1 }).accepted, "Initial edge telemetry sequence was rejected.");
  assertCondition(validateEpochEdgeTelemetrySequence({ previousSequence: 1, currentSequence: 2 }).accepted, "Next edge telemetry sequence was rejected.");
  console.log("[PASS] Signed offline telemetry and sequence continuity verified.");

  let state = normalizeEpochEdgeState({}, []);
  state = advertiseEpochEdgeCapabilities(state, ["mission.execute", "telemetry", "evidence", "offline.queue"]);
  const firstJob = { id: `edge-job-${randomUUID()}`, payload: { missionId: mission.id, action: "checkpoint" }, queuedAt: new Date().toISOString(), attempts: 0, sequence: 1 };
  const secondJob = { id: `edge-job-${randomUUID()}`, payload: { missionId: mission.id, action: "verify" }, queuedAt: new Date().toISOString(), attempts: 0, sequence: 2 };
  state = queueEpochEdgeJob(state, firstJob);
  state = queueEpochEdgeJob(state, secondJob);
  const reconnect = reconcileEpochEdgeQueue(state, { completedJobIds: [firstJob.id] });
  assertCondition(reconnect.completed.includes(firstJob.id), "Reconnect did not acknowledge the completed offline job.");
  assertCondition(reconnect.replay.length === 1 && reconnect.replay[0]?.id === secondJob.id, "Reconnect replay did not preserve the pending job order.");
  state = reconnect.state;
  console.log(`[PASS] Offline queue survived reconnect with ordered replay: pending=${reconnect.replay.length}.`);

  state = rollbackEpochEdgeUpdate(state, "v13-edge-previous", "sha256:phase4-previous");
  assertCondition(state.lastKnownVersion === "v13-edge-previous", "Signed update rollback state was not recorded.");
  state = revokeEpochEdge(state, "phase4 edge gate complete");
  assertCondition(state.revoked && state.phase === "RETIRED" && state.pendingJobs.length === 0, "Edge revocation did not clear pending work safely.");

  await appendEpochEvidence({
    workspaceId,
    missionId: mission.id,
    userId,
    evidence: [{
      kind: "edge_runtime_gate",
      summary: "Edge enrollment, offline buffering, reconnect, rollback, revocation, and telemetry were verified locally.",
      payload: { workerId: worker.id, enrollment: signedEnrollment, telemetry: signedTelemetry, replayedJobId: secondJob.id, revoked: state.revoked },
      proof: { source: "phase4-edge-runtime-gate", safeStop: true },
    }],
  });
  await prisma.epochWorker.update({
    where: { id: worker.id },
    data: {
      status: "retired",
      retiredAt: new Date(),
      metadata: { purpose: "phase4-edge-runtime-gate", missionId: mission.id, edgeState: state } as Prisma.InputJsonValue,
      history: [...(Array.isArray(worker.history) ? worker.history : []), { id: randomUUID(), type: "phase4_gate_completed", at: new Date().toISOString(), phase: state.phase }],
    },
  });
  console.log(`[PASS] Edge evidence buffered and persisted: mission=${mission.id}.`);
  console.log(`[PASS] Phase 4 edge runtime gate passed: worker=${worker.id}, mission=${mission.id}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});

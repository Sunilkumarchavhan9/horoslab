import { prisma } from "../../storage/prismaClient";
import { getEpochAuthorityGate } from "../epochStore";
import { listEpochRuntimeEvents } from "../epochEvents";
import {
  EpochArchitectureRunV1Schema,
  type EpochArchitectureRunV1,
  type EpochArchitectureStageV1,
} from "./contracts";
import { persistEpochArchitectureRun } from "./architectureRunStore";

export type EpochArchitectureEnvironment = "software" | "cloud" | "simulation" | "edge" | "sandbox";

export type EpochArchitectureRunScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId?: string;
  traceId?: string;
};

const STAGES: EpochArchitectureStageV1["name"][] = [
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
];

const EVENT_GROUPS: Record<string, string[]> = {
  observe: ["epoch.execution.stream_delta", "epoch.ai_execution.telemetry", "epoch.edge.telemetry"],
  measure: ["epoch.ai_execution.telemetry", "epoch.ai_execution.completed", "epoch.ai_execution.failed"],
  discovery: ["epoch.cloud.action", "epoch.simulation.created", "epoch.simulation.completed", "epoch.capability.gap_identified"],
  action: ["epoch.cloud.action", "epoch.automation.triggered", "epoch.automation.completed", "epoch.mission.running"],
  future_discovery: ["epoch.production.interaction", "epoch.production.failure", "epoch.memory.recorded", "epoch.capability.gap_identified"],
};

function ids(value: Array<{ id: string }>): string[] {
  return value.map((item) => item.id);
}

function completed(name: EpochArchitectureStageV1["name"], artifactIds: string[], reason: string, observedAt: string): EpochArchitectureStageV1 {
  return { name, status: "completed", artifactIds, reason, completedAt: observedAt };
}

function pending(name: EpochArchitectureStageV1["name"], reason: string): EpochArchitectureStageV1 {
  return { name, status: "pending", artifactIds: [], reason };
}

function blocked(name: EpochArchitectureStageV1["name"], reason: string): EpochArchitectureStageV1 {
  return { name, status: "blocked", artifactIds: [], reason };
}

function eventIds(events: Array<{ id: string; payload?: unknown }>, kinds: string[]): string[] {
  const allowed = new Set(kinds);
  return events
    .filter((event) => allowed.has((event.payload as { epochKind?: string } | undefined)?.epochKind ?? ""))
    .map((event) => event.id);
}

/**
 * Builds and persists the V13 architecture trace over existing Epoch records.
 * This is an audit projection, not a second mission, evidence, or outcome store.
 */
export async function buildEpochArchitectureRun(
  scope: EpochArchitectureRunScope,
  input: { missionId: string; environment?: EpochArchitectureEnvironment; architectureRunId?: string },
): Promise<EpochArchitectureRunV1> {
  const mission = await prisma.epochMission.findFirst({
    where: { id: input.missionId, workspaceId: scope.workspaceId },
    select: { id: true, state: true, repository: true, createdAt: true, updatedAt: true },
  });
  if (!mission) throw new Error("MISSION_NOT_FOUND");

  const [workers, capabilityRegistries, authority, execution, evidence, verification, certificate, memory, settlement, canonicalOutcome, queueJobs, events] = await Promise.all([
    prisma.epochWorker.findMany({ where: { workspaceId: scope.workspaceId }, select: { id: true, kind: true, capabilities: true } }),
    prisma.epochCapabilityRegistry.findMany({ where: { workspaceId: scope.workspaceId, status: "active" }, select: { id: true } }),
    getEpochAuthorityGate(scope.workspaceId, mission.id),
    prisma.epochExecutionRun.findFirst({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true, status: true, retries: true } }),
    prisma.epochEvidence.findMany({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true } }),
    prisma.epochVerificationRun.findFirst({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true, finalDecision: true } }),
    prisma.epochCertificate.findFirst({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true } }),
    prisma.epochMemoryRecord.findFirst({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true } }),
    prisma.epochSettlement.findFirst({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true, decision: true } }),
    prisma.epochOutcome.findFirst({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true, status: true } }),
    prisma.epochQueueJob.findMany({ where: { workspaceId: scope.workspaceId, missionId: mission.id }, select: { id: true, status: true } }),
    listEpochRuntimeEvents({ userId: scope.userId, workspaceId: scope.workspaceId, subjectId: mission.id, limit: 500 }),
  ]);

  const canonicalExperience = canonicalOutcome
    ? await prisma.epochExperience.findFirst({
        where: { workspaceId: scope.workspaceId, outcomeId: canonicalOutcome.id },
        select: { id: true },
      })
    : null;

  const observedAt = new Date().toISOString();
  const executionIds = execution ? [execution.id] : [];
  const eventIdsFor = (name: string) => eventIds(events, EVENT_GROUPS[name] ?? []);
  const hasEdgeWorker = workers.some((worker) => worker.kind.toLowerCase() === "edge");
  const hasWorkerProtocol = workers.length > 0 || queueJobs.length > 0;
  const hasEnvironment = Boolean(input.environment || mission.repository);
  const authorityAllowed = Boolean(authority?.canExecute);
  const missionTerminalFailure = ["failed", "cancelled"].includes(mission.state.toLowerCase());

  const stages: EpochArchitectureStageV1[] = [
    completed("customer", [mission.id], "Mission is scoped to the requesting workspace customer.", observedAt),
    workers.length > 0 || capabilityRegistries.length > 0
      ? completed("capability_fabric", [...ids(workers), ...ids(capabilityRegistries)], "Workers and capability registries are available to the runtime.", observedAt)
      : pending("capability_fabric", "No worker or capability registry has been recorded for this workspace."),
    authority
      ? authorityAllowed
        ? completed("sandbox_verify", authority.policy ? [authority.policy.id] : [], "The mission has a recorded authority decision.", observedAt)
        : blocked("sandbox_verify", "Authority policy requires approval or blocks execution.")
      : pending("sandbox_verify", "No mission authority policy has been recorded."),
    completed("mission", [mission.id], "Mission record is durable and addressable.", mission.updatedAt.toISOString()),
    hasWorkerProtocol
      ? completed("worker_protocol", [...ids(workers), ...ids(queueJobs)], "Worker or queue protocol records are present.", observedAt)
      : pending("worker_protocol", "No worker assignment or queue job has been recorded."),
    hasEnvironment
      ? completed("environment", [mission.id], input.environment ? `Environment selected: ${input.environment}.` : "Repository context identifies the software environment.", observedAt)
      : pending("environment", "No software, cloud, simulation, or edge environment is attached to this mission."),
    hasEdgeWorker || eventIdsFor("edge").length > 0
      ? completed("edge", eventIdsFor("edge"), "Edge enrollment or telemetry is present.", observedAt)
      : pending("edge", "No edge worker or edge telemetry is recorded for this mission."),
    execution
      ? missionTerminalFailure
        ? completed("execute", executionIds, "Execution completed with a terminal failure or cancellation.", observedAt)
        : completed("execute", executionIds, "Execution run is recorded.", observedAt)
      : pending("execute", "No execution run has been recorded."),
    eventIdsFor("observe").length > 0
      ? completed("observe", eventIdsFor("observe"), "Runtime telemetry or stream events are recorded.", observedAt)
      : pending("observe", "No execution observation events have been recorded."),
    eventIdsFor("measure").length > 0
      ? completed("measure", eventIdsFor("measure"), "Execution telemetry contains measurement events.", observedAt)
      : pending("measure", "No execution measurement events have been recorded."),
    evidence.length > 0
      ? completed("evidence", ids(evidence), "Durable evidence artifacts are attached to the mission.", observedAt)
      : pending("evidence", "No evidence artifact has been recorded."),
    verification
      ? completed("verification", [verification.id], `Verification decision: ${verification.finalDecision}.`, observedAt)
      : pending("verification", "No verification run has been recorded."),
    eventIdsFor("discovery").length > 0
      ? completed("discovery", eventIdsFor("discovery"), "Discovery, simulation, cloud, or capability events are recorded.", observedAt)
      : pending("discovery", "No post-verification discovery event has been recorded."),
    eventIdsFor("action").length > 0
      ? completed("action", eventIdsFor("action"), "A governed runtime action event is recorded.", observedAt)
      : pending("action", "No governed action event has been recorded."),
    execution && execution.retries > 0
      ? completed("measure_again", executionIds, `Execution has ${execution.retries} retry attempt(s).`, observedAt)
      : pending("measure_again", "No second measurement or retry attempt has been recorded."),
    canonicalOutcome || settlement
      ? completed("customer_outcome", [canonicalOutcome?.id ?? settlement!.id], canonicalOutcome ? `Customer outcome: ${canonicalOutcome.status}.` : `Settlement decision: ${settlement!.decision}.`, observedAt)
      : pending("customer_outcome", "No settlement or customer outcome has been recorded."),
    canonicalExperience || memory
      ? completed("experience", [canonicalExperience?.id ?? memory!.id], canonicalExperience ? "Canonical mission experience is recorded." : "Mission memory has been converted into reusable experience.", observedAt)
      : pending("experience", "No mission experience or memory handoff has been recorded."),
    eventIdsFor("future_discovery").length > 0
      ? completed("future_discovery", eventIdsFor("future_discovery"), "Production intelligence or learning signals are available.", observedAt)
      : pending("future_discovery", "No future discovery or production-learning signal has been recorded."),
  ];

  const firstIncomplete = stages.find((stage) => stage.status !== "completed");
  const status = missionTerminalFailure
    ? "failed"
    : firstIncomplete?.status === "blocked"
      ? "blocked"
      : firstIncomplete
        ? "running"
        : "completed";
  const id = input.architectureRunId ?? `arch_${mission.id}`;
  const trace = EpochArchitectureRunV1Schema.parse({
    contractVersion: "epoch.runtime.v13",
    id,
    workspaceId: scope.workspaceId,
    missionId: mission.id,
    environment: input.environment ?? (mission.repository ? "software" : "sandbox"),
    status,
    currentStage: firstIncomplete?.name ?? "future_discovery",
    stages,
    evidenceIds: ids(evidence),
    verificationIds: verification ? [verification.id] : [],
    ...((canonicalOutcome?.id ?? settlement?.id) ? { outcomeId: canonicalOutcome?.id ?? settlement?.id } : {}),
    ...((canonicalExperience?.id ?? memory?.id) ? { experienceId: canonicalExperience?.id ?? memory?.id } : {}),
    createdAt: mission.createdAt.toISOString(),
    updatedAt: observedAt,
    correlation: {
      correlationId: scope.correlationId ?? id,
      traceId: scope.traceId ?? id,
    },
  });

  return persistEpochArchitectureRun(trace);
}

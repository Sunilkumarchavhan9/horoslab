import { createHash } from "node:crypto";
import { prisma } from "../storage/prismaClient";
import type { EpochPipelineEvent, EpochPipelineExecution } from "./pipelineExecution";

type JsonRecord = Record<string, unknown>;
function json(value: unknown): any { return JSON.parse(JSON.stringify(value)); }
function record(value: unknown): JsonRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}; }

export type EpochPipelineCheckpoint = {
  version: "epoch_pipeline_checkpoint.v1";
  runId: string;
  status: EpochPipelineExecution["status"] | "running";
  sequence: number;
  event: EpochPipelineEvent | null;
  execution: EpochPipelineExecution | null;
  checkpointSha256: string;
  updatedAt: string;
  events?: EpochPipelineEvent[];
};

export function buildEpochPipelineCheckpoint(input: { runId: string; sequence: number; event?: EpochPipelineEvent | null; execution?: EpochPipelineExecution | null; status?: EpochPipelineCheckpoint["status"]; updatedAt?: string }): EpochPipelineCheckpoint {
  const checkpoint: Omit<EpochPipelineCheckpoint, "checkpointSha256"> = {
    version: "epoch_pipeline_checkpoint.v1",
    runId: input.runId,
    status: input.status ?? input.execution?.status ?? "running",
    sequence: input.sequence,
    event: input.event ?? null,
    execution: input.execution ?? null,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
  return { ...checkpoint, checkpointSha256: createHash("sha256").update(JSON.stringify(checkpoint)).digest("hex") };
}

/** Persist a resumable checkpoint in the mission's canonical proof/timeline. */
export async function persistEpochPipelineCheckpoint(input: { workspaceId: string; missionId: string; checkpoint: EpochPipelineCheckpoint }) {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId }, select: { id: true, proof: true, timeline: true } });
  if (!mission) throw new Error("mission_not_found");
  const proof = record(mission.proof);
  const timeline = Array.isArray(mission.timeline) ? mission.timeline : [];
  const pipelineRuns = record(proof.pipelineRuns);
  const prior = record(pipelineRuns[input.checkpoint.runId]);
  const events = Array.isArray(prior.events) ? prior.events : [];
  const event = input.checkpoint.event;
  const nextEvents = event && !events.some((item) => record(item).sequence === input.checkpoint.sequence) ? [...events, { sequence: input.checkpoint.sequence, ...event }] : events;
  pipelineRuns[input.checkpoint.runId] = { ...prior, checkpoint: input.checkpoint, events: nextEvents };
  const timelineEvent = event ? { type: "pipeline_event", runId: input.checkpoint.runId, sequence: input.checkpoint.sequence, eventType: event.type, nodeId: event.nodeId ?? null, at: event.at, payload: event.payload } : null;
  const nextTimeline = timelineEvent && !timeline.some((item) => record(item).runId === input.checkpoint.runId && record(item).sequence === input.checkpoint.sequence) ? [...timeline, timelineEvent] : timeline;
  return prisma.epochMission.update({ where: { id: mission.id }, data: { currentStep: `pipeline:${input.checkpoint.runId}`, timeline: json(nextTimeline), proof: json({ ...proof, pipelineRuns }) } });
}

export async function loadEpochPipelineCheckpoint(input: { workspaceId: string; missionId: string; runId: string }): Promise<EpochPipelineCheckpoint | null> {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId }, select: { proof: true } });
  const run = record(record(mission?.proof).pipelineRuns)[input.runId];
  const checkpoint = record(run).checkpoint;
  return record(checkpoint).version === "epoch_pipeline_checkpoint.v1" ? { ...checkpoint as EpochPipelineCheckpoint, events: Array.isArray(record(run).events) ? record(run).events as EpochPipelineEvent[] : [] } : null;
}

export function createEpochPipelinePersistenceHandler(input: { workspaceId: string; missionId: string; runId: string; startingSequence?: number; getExecution?: () => EpochPipelineExecution | null }) {
  let sequence = input.startingSequence ?? 0;
  return async (event: EpochPipelineEvent) => {
    sequence += 1;
    await persistEpochPipelineCheckpoint({ workspaceId: input.workspaceId, missionId: input.missionId, checkpoint: buildEpochPipelineCheckpoint({ runId: input.runId, sequence, event, execution: input.getExecution?.() ?? null }) });
  };
}

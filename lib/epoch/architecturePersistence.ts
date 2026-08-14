import { prisma } from "../storage/prismaClient";
import type { EpochArchitectureState } from "./architectureRuntime";
import { buildEvidenceIntegrityProof } from "./evidenceIntegrity";

function json(value: unknown): any { return JSON.parse(JSON.stringify(value)); }

/** Durable bridge for the architecture runtime. Mission proof/timeline are the canonical replay log. */
export async function persistEpochArchitectureState(input: { workspaceId: string; missionId: string; userId: string; state: EpochArchitectureState }) {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId }, select: { id: true, proof: true, timeline: true } });
  if (!mission) throw new Error("mission_not_found");
  const priorProof = mission.proof && typeof mission.proof === "object" && !Array.isArray(mission.proof) ? mission.proof as Record<string, unknown> : {};
  const priorTimeline = Array.isArray(mission.timeline) ? mission.timeline : [];
  const timeline = [...priorTimeline, ...input.state.stages.map((stage) => ({ type: "architecture_stage", ...stage }))];
  const updated = await prisma.epochMission.update({ where: { id: mission.id }, data: { currentStep: input.state.stages.find((stage) => stage.status === "running")?.stage ?? null, timeline: json(timeline), proof: json({ ...priorProof, architectureRuntime: input.state, architectureStateSha256: input.state.worldModel.snapshotSha256 }) } });
  for (const evidence of input.state.evidence) {
    const existing = await prisma.epochEvidence.findUnique({ where: { id: evidence.id }, select: { id: true } });
    if (!existing) await prisma.epochEvidence.create({ data: { id: evidence.id, workspaceId: input.workspaceId, missionId: input.missionId, userId: input.userId, kind: evidence.kind, summary: evidence.stage, payload: json(evidence.payload), proof: json(evidence.proof) } });
  }
  return updated;
}

export async function loadEpochArchitectureState(workspaceId: string, missionId: string): Promise<EpochArchitectureState | null> {
  const mission = await prisma.epochMission.findFirst({ where: { id: missionId, workspaceId }, select: { proof: true } });
  const proof = mission?.proof && typeof mission.proof === "object" && !Array.isArray(mission.proof) ? mission.proof as Record<string, unknown> : {};
  return proof.architectureRuntime && typeof proof.architectureRuntime === "object" ? proof.architectureRuntime as EpochArchitectureState : null;
}

export function buildEpochArchitectureEvidenceProof(input: { stage: string; kind: string; payload: Record<string, unknown>; previousHash?: string | null }) {
  return buildEvidenceIntegrityProof({ kind: input.kind, summary: input.stage, payload: input.payload }, { previousHash: input.previousHash ?? null });
}

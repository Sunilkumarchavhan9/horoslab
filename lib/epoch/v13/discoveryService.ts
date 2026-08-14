import { randomUUID } from "node:crypto";
import { prisma } from "../../storage/prismaClient";
import { emitEpochRuntimeEvent } from "../epochEvents";

type Scope = { workspaceId: string; userId: string; orgId?: string; correlationId?: string; traceId?: string; causationId?: string };

function emit(scope: Scope, kind: Parameters<typeof emitEpochRuntimeEvent>[0]["kind"], label: string, subjectId: string, payload: Record<string, unknown> = {}) {
  emitEpochRuntimeEvent({ ...scope, kind, label, subjectId, correlationId: scope.correlationId, traceId: scope.traceId, causationId: scope.causationId, payload });
}

function json(value: unknown): any {
  return value ?? {};
}

export async function createUnknown(scope: Scope, input: { title: string; question: string; impact?: string; projectId?: string; environmentId?: string; evidence?: unknown[] }) {
  const unknown = await prisma.epochUnknown.create({
    data: {
      workspaceId: scope.workspaceId,
      projectId: input.projectId,
      environmentId: input.environmentId,
      title: input.title,
      question: input.question,
      impact: input.impact ?? "medium",
      evidence: json(input.evidence ?? []),
      correlationId: scope.correlationId ?? randomUUID(),
    },
  });
  emit(scope, "epoch.unknown.created", "Unknown created", unknown.id, { title: unknown.title, impact: unknown.impact });
  return unknown;
}

export async function createDiscoveryProgram(scope: Scope, input: { unknownId: string; name: string; objective: string; questions?: string[] }) {
  const unknown = await prisma.epochUnknown.findFirst({ where: { id: input.unknownId, workspaceId: scope.workspaceId } });
  if (!unknown) throw new Error("UNKNOWN_NOT_FOUND");
  const program = await prisma.epochDiscoveryProgram.create({
    data: { workspaceId: scope.workspaceId, unknownId: input.unknownId, name: input.name, objective: input.objective, questions: json(input.questions ?? []) },
  });
  emit(scope, "epoch.discovery_program.created", "Discovery program created", program.id, { unknownId: program.unknownId });
  return program;
}

export async function createHypothesis(scope: Scope, input: { discoveryProgramId: string; statement: string; confidence?: number; evidence?: unknown[] }) {
  const program = await prisma.epochDiscoveryProgram.findFirst({ where: { id: input.discoveryProgramId, workspaceId: scope.workspaceId } });
  if (!program) throw new Error("DISCOVERY_PROGRAM_NOT_FOUND");
  const hypothesis = await prisma.epochHypothesis.create({
    data: { workspaceId: scope.workspaceId, discoveryProgramId: input.discoveryProgramId, statement: input.statement, confidence: input.confidence ?? 0.5, evidence: json(input.evidence ?? []) },
  });
  await prisma.epochDiscoveryProgram.update({ where: { id: program.id }, data: { hypothesisIds: { set: [...(Array.isArray(program.hypothesisIds) ? program.hypothesisIds : []), hypothesis.id] } } });
  emit(scope, "epoch.hypothesis.created", "Hypothesis created", hypothesis.id, { discoveryProgramId: hypothesis.discoveryProgramId });
  return hypothesis;
}

export async function createExperiment(scope: Scope, input: { discoveryProgramId: string; name: string; hypothesisId?: string; missionId?: string; simulationRunId?: string; design?: Record<string, unknown> }) {
  const program = await prisma.epochDiscoveryProgram.findFirst({ where: { id: input.discoveryProgramId, workspaceId: scope.workspaceId } });
  if (!program) throw new Error("DISCOVERY_PROGRAM_NOT_FOUND");
  if (input.hypothesisId && !(await prisma.epochHypothesis.findFirst({ where: { id: input.hypothesisId, workspaceId: scope.workspaceId } }))) throw new Error("HYPOTHESIS_NOT_FOUND");
  if (input.missionId && !(await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: scope.workspaceId } }))) throw new Error("MISSION_NOT_FOUND");
  const experiment = await prisma.epochExperiment.create({ data: { workspaceId: scope.workspaceId, discoveryProgramId: input.discoveryProgramId, hypothesisId: input.hypothesisId, missionId: input.missionId, simulationRunId: input.simulationRunId, name: input.name, design: json(input.design ?? {}) } });
  await prisma.epochDiscoveryProgram.update({ where: { id: program.id }, data: { experimentIds: { set: [...(Array.isArray(program.experimentIds) ? program.experimentIds : []), experiment.id] } } });
  emit(scope, "epoch.experiment.created", "Experiment created", experiment.id, { discoveryProgramId: experiment.discoveryProgramId, missionId: experiment.missionId });
  return experiment;
}

export async function recordObservation(scope: Scope, input: { kind: string; value: Record<string, unknown>; experimentId?: string; missionId?: string; evidenceIds?: string[] }) {
  if (!input.experimentId && !input.missionId) throw new Error("OBSERVATION_TARGET_REQUIRED");
  if (input.experimentId && !(await prisma.epochExperiment.findFirst({ where: { id: input.experimentId, workspaceId: scope.workspaceId } }))) throw new Error("EXPERIMENT_NOT_FOUND");
  if (input.missionId && !(await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: scope.workspaceId } }))) throw new Error("MISSION_NOT_FOUND");
  const observation = await prisma.epochObservation.create({ data: { workspaceId: scope.workspaceId, experimentId: input.experimentId, missionId: input.missionId, kind: input.kind, value: json(input.value), evidenceIds: json(input.evidenceIds ?? []), observedAt: new Date() } });
  emit(scope, "epoch.observation.recorded", "Observation recorded", observation.id, { experimentId: observation.experimentId, missionId: observation.missionId, kind: observation.kind });
  return observation;
}

export async function listDiscoveryState(workspaceId: string) {
  const [unknowns, discoveryPrograms, hypotheses, experiments, observations] = await Promise.all([
    prisma.epochUnknown.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.epochDiscoveryProgram.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.epochHypothesis.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.epochExperiment.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.epochObservation.findMany({ where: { workspaceId }, orderBy: { observedAt: "desc" }, take: 100 }),
  ]);
  return { unknowns, discoveryPrograms, hypotheses, experiments, observations };
}

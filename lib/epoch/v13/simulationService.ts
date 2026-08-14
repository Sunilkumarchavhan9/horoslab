import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../storage/prismaClient";
import { emitEpochRuntimeEvent } from "../epochEvents";
import { SimulationRunV1Schema } from "./contracts";

export type SimulationScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

export class SimulationBoundaryError extends Error {
  constructor(public readonly code: "not_found" | "invalid" | "approval_required", message: string) {
    super(message);
    this.name = "SimulationBoundaryError";
  }
}

type SimulationMode = "replay" | "what_if" | "fault_injection" | "load" | "regression";

async function organization(scope: SimulationScope): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: scope.workspaceId, userId: scope.userId, ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}) },
    select: { orgId: true },
  });
  if (!workspace) throw new SimulationBoundaryError("not_found", "Workspace not found");
  const orgId = workspace.orgId ?? scope.orgId;
  if (!orgId) throw new SimulationBoundaryError("invalid", "Workspace has no organization boundary");
  return orgId;
}

async function assertSimulationScope(scope: SimulationScope, projectId: string, environmentId: string) {
  const orgId = await organization(scope);
  const project = await prisma.epochProject.findFirst({ where: { id: projectId, workspaceId: scope.workspaceId, orgId }, select: { id: true } });
  const environment = await prisma.epochEnvironment.findFirst({ where: { id: environmentId, workspaceId: scope.workspaceId, projectId, kind: "simulation" }, select: { id: true } });
  if (!project || !environment) throw new SimulationBoundaryError("not_found", "Simulation project or environment was not found");
  return orgId;
}

function json(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function proof(value: unknown) {
  return { contentHash: createHash("sha256").update(JSON.stringify(value)).digest("hex"), hashAlgorithm: "sha256", canonicalVersion: "epoch.simulation.v1" };
}

function correlation(scope: SimulationScope) {
  return { correlationId: scope.correlationId, traceId: scope.traceId };
}

function runContract(run: { id: string; workspaceId: string; simulationEnvironmentId: string; missionId: string | null; mode: string; status: string; seed: number; result: unknown; createdAt: Date; updatedAt: Date }, environmentId: string, projectId: string, scope: SimulationScope) {
  return SimulationRunV1Schema.parse({
    contractVersion: "epoch.runtime.v13",
    id: run.id,
    workspaceId: run.workspaceId,
    projectId,
    environmentId,
    ...(run.missionId ? { missionId: run.missionId } : {}),
    mode: run.mode,
    status: run.status,
    seed: run.seed,
    simulated: true,
    result: json(run.result),
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    correlation: correlation(scope),
  });
}

export async function createEpochSimulation(scope: SimulationScope, input: { projectId: string; environmentId: string; name: string; mode: SimulationMode; configuration?: Record<string, unknown> }) {
  await assertSimulationScope(scope, input.projectId, input.environmentId);
  const simulation = await prisma.epochSimulationEnvironment.create({
    data: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId, name: input.name, mode: input.mode, configuration: jsonValue(input.configuration ?? {}) },
  });
  emitEpochRuntimeEvent({ ...scope, kind: "epoch.simulation.created", label: "Simulation created", subjectId: simulation.id, payload: { mode: input.mode, simulated: true } });
  return simulation;
}

export async function listEpochSimulations(scope: SimulationScope, projectId: string) {
  const orgId = await organization(scope);
  const project = await prisma.epochProject.findFirst({ where: { id: projectId, workspaceId: scope.workspaceId, orgId }, select: { id: true } });
  if (!project) throw new SimulationBoundaryError("not_found", "Simulation project was not found");
  const rows = await prisma.epochSimulationEnvironment.findMany({ where: { workspaceId: scope.workspaceId, projectId }, include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } }, orderBy: { updatedAt: "desc" } });
  return rows;
}

export async function runEpochSimulation(scope: SimulationScope, simulationId: string, input: { missionId?: string; workerId?: string; seed?: number; variables?: Record<string, unknown>; faults?: Record<string, unknown>[] }) {
  const simulation = await prisma.epochSimulationEnvironment.findFirst({ where: { id: simulationId, workspaceId: scope.workspaceId }, include: { environment: true } });
  if (!simulation) throw new SimulationBoundaryError("not_found", "Simulation environment not found");
  await assertSimulationScope(scope, simulation.projectId, simulation.environmentId);
  if (input.missionId) {
    const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: scope.workspaceId }, select: { id: true } });
    if (!mission) throw new SimulationBoundaryError("not_found", "Mission not found in workspace");
  }
  const seed = input.seed ?? Math.floor(Date.now() / 1000);
  const faults = input.faults ?? [];
  const startedAt = new Date();
  const outcome = faults.length ? "failed" : "completed";
  const result = { simulated: true, label: "SIMULATED", outcome, seed, variables: input.variables ?? {}, faultCount: faults.length, noRealSideEffects: true };
  const run = await prisma.epochSimulationRun.create({ data: { workspaceId: scope.workspaceId, simulationEnvironmentId: simulation.id, missionId: input.missionId, workerId: input.workerId, mode: simulation.mode, status: outcome, seed, variables: jsonValue(input.variables ?? {}), faults: jsonValue(faults), result: jsonValue(result), startedAt, completedAt: new Date() } });
  emitEpochRuntimeEvent({ ...scope, kind: "epoch.simulation.started", label: "Simulation started", subjectId: run.id, payload: { simulated: true, mode: simulation.mode } });
  const observations = [
    { kind: "snapshot", value: { simulated: true, source: "simulation_environment", environmentId: simulation.environmentId, projectId: simulation.projectId } },
    { kind: "faults", value: { simulated: true, faults } },
    { kind: "result", value: result },
  ];
  await prisma.epochSimulationObservation.createMany({ data: observations.map((observation) => ({ workspaceId: scope.workspaceId, runId: run.id, kind: observation.kind, label: "SIMULATED", value: jsonValue(observation.value), observedAt: new Date() })) });
  if (input.missionId) {
    await prisma.epochEvidence.create({ data: { workspaceId: scope.workspaceId, missionId: input.missionId, userId: scope.userId, kind: "simulation", summary: "Simulation run completed with explicitly simulated observations.", payload: jsonValue({ runId: run.id, simulated: true, observations, result }), proof: jsonValue(proof(result)) } });
  }
  emitEpochRuntimeEvent({ ...scope, kind: "epoch.simulation.completed", label: "Simulation completed", subjectId: run.id, payload: { simulated: true, outcome, faultCount: faults.length } });
  return runContract(run, simulation.environmentId, simulation.projectId, scope);
}

export async function getEpochSimulationRun(scope: SimulationScope, runId: string) {
  const run = await prisma.epochSimulationRun.findFirst({ where: { id: runId, workspaceId: scope.workspaceId }, include: { environment: true, observations: { orderBy: { observedAt: "asc" } }, verification: true } });
  if (!run) return null;
  return { run: runContract(run, run.environment.environmentId, run.environment.projectId, scope), observations: run.observations, verification: run.verification };
}

export async function verifyEpochSimulation(scope: SimulationScope, runId: string, expectedStatus: "completed" | "failed") {
  const run = await prisma.epochSimulationRun.findFirst({ where: { id: runId, workspaceId: scope.workspaceId }, include: { environment: true, observations: true } });
  if (!run) throw new SimulationBoundaryError("not_found", "Simulation run not found");
  const actual = json(run.result).outcome;
  const hasOnlySimulated = run.observations.length > 0 && run.observations.every((item) => item.label === "SIMULATED");
  const passed = actual === expectedStatus && hasOnlySimulated;
  const verification = await prisma.epochSimulationVerification.upsert({ where: { runId }, create: { workspaceId: scope.workspaceId, runId, userId: scope.userId, decision: passed ? "PASS" : "FAIL", confidence: passed ? 100 : 0, checklist: jsonValue([{ name: "simulated_boundary", passed: hasOnlySimulated }, { name: "expected_outcome", passed: actual === expectedStatus }]), output: jsonValue({ simulated: true, expectedStatus, actual }), proof: jsonValue(proof({ runId, expectedStatus, actual })) }, update: { decision: passed ? "PASS" : "FAIL", confidence: passed ? 100 : 0, output: jsonValue({ simulated: true, expectedStatus, actual }), proof: jsonValue(proof({ runId, expectedStatus, actual })) } });
  emitEpochRuntimeEvent({ ...scope, kind: "epoch.simulation.verified", label: "Simulation verified", subjectId: runId, payload: { decision: verification.decision, simulated: true } });
  return verification;
}

export async function decideEpochSimulation(scope: SimulationScope, runId: string, decision: "promote" | "reject") {
  const run = await prisma.epochSimulationRun.findFirst({ where: { id: runId, workspaceId: scope.workspaceId }, include: { verification: true } });
  if (!run) throw new SimulationBoundaryError("not_found", "Simulation run not found");
  if (!run.verification || run.verification.decision !== "PASS") throw new SimulationBoundaryError("invalid", "Only a PASS simulation can be promoted or rejected");
  const kind = decision === "promote" ? "epoch.simulation.promoted" : "epoch.simulation.rejected";
  await prisma.epochSimulationRun.update({ where: { id: runId }, data: { status: decision === "promote" ? "promoted" : "rejected", result: jsonValue({ ...(json(run.result)), decision, simulated: true }) } });
  emitEpochRuntimeEvent({ ...scope, kind, label: `Simulation ${decision}`, subjectId: runId, payload: { decision, simulated: true } });
  return { runId, decision, simulated: true };
}

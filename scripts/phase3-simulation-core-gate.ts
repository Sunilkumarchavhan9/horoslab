import { randomUUID } from "node:crypto";
import { prisma } from "../lib/storage/prismaClient";
import { createEpochMission } from "../lib/epoch/epochStore";
import { createEpochV13Environment } from "../lib/epoch/v13/environmentService";
import { createEpochV13Project } from "../lib/epoch/v13/projectService";
import {
  createEpochSimulation,
  decideEpochSimulation,
  getEpochSimulationRun,
  runEpochSimulation,
  verifyEpochSimulation,
} from "../lib/epoch/v13/simulationService";

const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
const userId = process.env.EPOCH_V13_GATE_USER_ID;
const orgId = process.env.EPOCH_V13_GATE_ORG_ID;

async function main() {
  if (!workspaceId || !userId) {
    throw new Error("Set EPOCH_V13_GATE_WORKSPACE_ID and EPOCH_V13_GATE_USER_ID before running this gate.");
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true, orgId: true },
  });
  if (!workspace) throw new Error("The configured V13 gate workspace was not found for this user.");
  const organizationId = workspace.orgId ?? orgId;
  if (!organizationId) throw new Error("The configured V13 gate workspace has no organization boundary.");

  let institution = await prisma.epochInstitution.findFirst({
    where: { workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true },
  });
  let fixtureInstitutionId: string | null = null;
  if (!institution) {
    institution = await prisma.epochInstitution.create({
      data: {
        workspaceId,
        userId,
        orgId: organizationId,
        name: `V13 simulation acceptance fixture ${Date.now()}`,
        category: "acceptance-test",
        summary: "Temporary institution for the V13 simulation acceptance gate.",
        metadata: { source: "backend:v13:acceptance" },
      },
      select: { id: true },
    });
    fixtureInstitutionId = institution.id;
    console.log(`[INFO] Created temporary V13 simulation institution ${institution.id}.`);
  }

  try {
    const scope = {
    workspaceId,
    userId,
    orgId: organizationId,
    correlationId: randomUUID(),
    traceId: randomUUID(),
    };
  const fixtureName = `V13 local simulation gate ${new Date().toISOString()}`;
  const project = await createEpochV13Project(scope, { name: fixtureName, metadata: { purpose: "phase3-simulation-core-gate" } });
  const environment = await createEpochV13Environment(scope, {
    projectId: project.id,
    kind: "simulation",
    name: `${fixtureName} environment`,
    status: "connected",
    region: "local",
  });
  const mission = await createEpochMission({
    workspaceId,
    institutionId: institution.id,
    userId,
    orgId: organizationId,
    title: `${fixtureName} mission`,
    objective: "Validate a controlled failure and a successful simulated execution.",
  });
  const simulation = await createEpochSimulation(scope, {
    projectId: project.id,
    environmentId: environment.id,
    name: `${fixtureName} scenario`,
    mode: "fault_injection",
    configuration: { noRealSideEffects: true },
  });

  const failedRun = await runEpochSimulation(scope, simulation.id, {
    missionId: mission.id,
    seed: 1001,
    faults: [{ type: "worker_timeout", target: "simulated-worker", label: "SIMULATED" }],
  });
  if (failedRun.status !== "failed" || failedRun.simulated !== true) throw new Error("Controlled simulation did not fail as expected.");
  const failedVerification = await verifyEpochSimulation(scope, failedRun.id, "failed");
  if (failedVerification.decision !== "PASS") throw new Error("Failed simulation verification did not PASS.");
  await decideEpochSimulation(scope, failedRun.id, "reject");
  console.log(`[PASS] Controlled failure verified and rejected: run=${failedRun.id}.`);

  const successfulRun = await runEpochSimulation(scope, simulation.id, { missionId: mission.id, seed: 1002 });
  if (successfulRun.status !== "completed" || successfulRun.simulated !== true) throw new Error("Successful simulation did not complete as expected.");
  const successfulVerification = await verifyEpochSimulation(scope, successfulRun.id, "completed");
  if (successfulVerification.decision !== "PASS") throw new Error("Successful simulation verification did not PASS.");
  await decideEpochSimulation(scope, successfulRun.id, "promote");
  console.log(`[PASS] Successful simulation verified and promoted: run=${successfulRun.id}.`);

  const [missionEvidence, failedRecord, successfulRecord] = await Promise.all([
    prisma.epochEvidence.count({ where: { workspaceId, missionId: mission.id, kind: "simulation" } }),
    getEpochSimulationRun(scope, failedRun.id),
    getEpochSimulationRun(scope, successfulRun.id),
  ]);
  if (missionEvidence < 2 || failedRecord?.run.status !== "rejected" || successfulRecord?.run.status !== "promoted") {
    throw new Error("Simulation evidence or final decisions were not persisted correctly.");
  }
  if (![...(failedRecord?.observations ?? []), ...(successfulRecord?.observations ?? [])].some((item) => item.label !== "SIMULATED")) {
    console.log(`[PASS] All simulation observations are explicitly labeled SIMULATED; missionEvidence=${missionEvidence}.`);
  } else {
    throw new Error("A simulation observation was not labeled SIMULATED.");
  }
    console.log(`[PASS] Fixture project=${project.id} environment=${environment.id} mission=${mission.id} simulation=${simulation.id}.`);
  } finally {
    if (fixtureInstitutionId) {
      await prisma.epochMission.deleteMany({ where: { institutionId: fixtureInstitutionId } });
      await prisma.epochInstitution.delete({ where: { id: fixtureInstitutionId } });
    }
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

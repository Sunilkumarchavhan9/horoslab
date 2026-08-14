import { EpochArchitectureRunV1Schema } from "../lib/epoch/v13/contracts";
import { getEpochArchitectureRun } from "../lib/epoch/v13/architectureRunStore";
import { buildEpochArchitectureRun } from "../lib/epoch/v13/runtimeOrchestrator";
import { prisma } from "../lib/storage/prismaClient";
import { upsertMissionOutcome, upsertOutcomeExperience } from "../lib/epoch/v13/outcomeService";

const names = [
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
] as const;

const now = new Date().toISOString();
const run = EpochArchitectureRunV1Schema.parse({
  contractVersion: "epoch.runtime.v13",
  id: "architecture-contract-fixture",
  workspaceId: "workspace-contract-fixture",
  missionId: "mission-contract-fixture",
  environment: "software",
  status: "running",
  currentStage: "mission",
  stages: names.map((name) => ({ name, status: "pending", artifactIds: [], reason: "contract fixture" })),
  evidenceIds: [],
  verificationIds: [],
  createdAt: now,
  updatedAt: now,
  correlation: { correlationId: "correlation-contract-fixture", traceId: "trace-contract-fixture" },
});

if (run.stages.length !== 18) throw new Error("Architecture contract must contain all 18 stages.");
console.log("[PASS] Architecture runtime contract includes all 18 lifecycle stages.");

async function main() {
  const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
  const userId = process.env.EPOCH_V13_GATE_USER_ID;
  if (!workspaceId || !userId) {
    throw new Error("Set EPOCH_V13_GATE_WORKSPACE_ID and EPOCH_V13_GATE_USER_ID for the persistence round-trip.");
  }

  let fixtureMissionId: string | null = null;
  let fixtureInstitutionId: string | null = null;

  try {
    let mission = await prisma.epochMission.findFirst({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (!mission) {
      const fixtureInstitution = await prisma.epochInstitution.create({
        data: {
          workspaceId,
          userId,
          name: `V13 acceptance fixture ${Date.now()}`,
          category: "acceptance-test",
          summary: "Temporary V13 acceptance-gate fixture.",
          metadata: { source: "backend:v13:acceptance" },
        },
        select: { id: true },
      });
      fixtureInstitutionId = fixtureInstitution.id;

      const fixtureMission = await prisma.epochMission.create({
        data: {
          workspaceId,
          institutionId: fixtureInstitution.id,
          userId,
          title: `V13 acceptance fixture ${Date.now()}`,
          objective: "Exercise the architecture runtime persistence contract.",
          state: "draft",
          currentStep: "acceptance_gate",
          plan: [{ step: "architecture persistence round-trip", status: "pending" }],
          proof: { source: "backend:v13:acceptance" },
        },
        select: { id: true },
      });
      fixtureMissionId = fixtureMission.id;
      mission = fixtureMission;
      console.log(`[INFO] Created temporary V13 acceptance fixture mission ${mission.id}.`);
    }

    const outcome = await upsertMissionOutcome(
      { workspaceId, userId, correlationId: `architecture-gate:${mission.id}`, traceId: `architecture-gate:${mission.id}` },
      mission.id,
      { status: "achieved", summary: "Architecture runtime persistence gate outcome" },
    );
    const experience = await upsertOutcomeExperience(
      { workspaceId, userId, correlationId: `architecture-gate:${mission.id}`, traceId: `architecture-gate:${mission.id}` },
      outcome.id,
      { summary: "Architecture runtime persistence gate experience", lessons: ["Canonical outcome handoff is durable."], confidence: 1 },
    );

    const persisted = await buildEpochArchitectureRun(
      { workspaceId, userId, correlationId: `architecture-gate:${mission.id}`, traceId: `architecture-gate:${mission.id}` },
      { missionId: mission.id },
    );
    const reloaded = await getEpochArchitectureRun(workspaceId, mission.id);
    if (!reloaded) throw new Error("Persisted architecture run could not be reloaded.");
    if (reloaded.id !== persisted.id || reloaded.missionId !== mission.id || reloaded.stages.length !== 18) {
      throw new Error("Architecture run persistence round-trip did not preserve its canonical identifiers or stages.");
    }
    if (reloaded.outcomeId !== outcome.id || reloaded.experienceId !== experience.id) {
      throw new Error("Architecture run did not reference the canonical outcome and experience records.");
    }
    console.log(`[PASS] Architecture run persisted and reloaded for mission ${mission.id}.`);
  } finally {
    if (fixtureMissionId) {
      await prisma.epochMission.delete({ where: { id: fixtureMissionId } });
    }
    if (fixtureInstitutionId) {
      await prisma.epochInstitution.delete({ where: { id: fixtureInstitutionId } });
    }
    await prisma.$disconnect();
  }
}

void main();

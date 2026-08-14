import { mkdir, writeFile } from "node:fs/promises";
import {
  buildMissionLoopMetadata,
  canPerformPrivilegedAction,
  deterministicAssurance,
  readyMissionSteps,
  recordMissionCheckpoint,
  requestMissionCancellation,
} from "../lib/epoch/missionLoop";

type MissionProof = { id: string; checkpoints: number; assurance: "PASS" | "FAIL" | "UNKNOWN"; restarted: boolean; cancelled: boolean };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function proveMission(index: number): MissionProof {
  let loop = buildMissionLoopMetadata({ objective: `Phase B seeded mission ${index}`, plan: ["plan", "execute", "verify"], acceptanceCriteria: ["all steps complete"] });
  const firstStep = readyMissionSteps(loop)[0];
  assert(firstStep?.id === "step_1", `mission ${index}: first dependency was not ready`);
  loop = recordMissionCheckpoint(loop, { stepId: firstStep.id, status: "completed", attempt: 1, evidenceIds: [`evidence-${index}-1`] });

  const restarted = JSON.parse(JSON.stringify(loop)) as typeof loop;
  assert(readyMissionSteps(restarted).map((step) => step.id).join(",") === "step_2", `mission ${index}: restart lost checkpoint`);
  loop = restarted;
  while (readyMissionSteps(loop).length > 0) {
    const step = readyMissionSteps(loop)[0];
    loop = recordMissionCheckpoint(loop, { stepId: step.id, status: "completed", attempt: 1, evidenceIds: [`evidence-${index}-${step.id}`] });
  }
  assert(readyMissionSteps(loop).length === 0, `mission ${index}: dependency graph did not drain`);
  assert(loop.checkpoints.length === 3, `mission ${index}: checkpoint corruption detected`);

  const cancelled = requestMissionCancellation(loop, "reliability gate cancellation probe");
  assert(!canPerformPrivilegedAction(cancelled), `mission ${index}: cancellation did not block privilege`);
  const assurance = deterministicAssurance({ evidenceCount: loop.checkpoints.length, acceptancePassed: true, humanApproval: "approved", confidence: 100 });
  assert(assurance === "PASS", `mission ${index}: terminal assurance was ${assurance}`);
  return { id: `mission-${index}`, checkpoints: loop.checkpoints.length, assurance, restarted: true, cancelled: true };
}

async function main() {
  const missions = Array.from({ length: 25 }, (_, index) => proveMission(index + 1));
  const report = { gate: "epoch.phase-b.mission-reliability.v1", status: "passed", missionCount: missions.length, allTerminalPass: missions.every((mission) => mission.assurance === "PASS"), allRestartSafe: missions.every((mission) => mission.restarted), allCancellationSafe: missions.every((mission) => mission.cancelled), missions, generatedAt: new Date().toISOString() };
  await mkdir("docs/generated", { recursive: true });
  await writeFile("docs/generated/phase-b-mission-reliability.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Phase B reliability gate passed for ${missions.length} missions.`);
}

void main();

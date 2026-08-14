import {
  createEpochMission,
  createEpochAuthorityPolicy,
  getEpochMission,
  getEpochAuthorityGate,
  listEpochAuthorityPolicies,
  listEpochMissions,
  runEpochMission,
  updateEpochMission,
  type CreateEpochMissionInput,
  type UpdateEpochMissionInput,
} from "../epochStore";

export async function summarizeMissionService(workspaceId: string) {
  const missions = await listEpochMissions({ workspaceId });
  return {
    workspaceId,
    counts: {
      missions: missions.length,
      draft: missions.filter((mission) => mission.state === "draft").length,
      running: missions.filter((mission) => mission.state === "running").length,
      waitingReview: missions.filter((mission) => mission.state === "waiting_review").length,
      completed: missions.filter((mission) => mission.state === "completed").length,
      failed: missions.filter((mission) => mission.state === "failed").length,
    },
    recent: missions.slice(0, 10),
  };
}

export async function createMission(input: CreateEpochMissionInput) {
  return createEpochMission(input);
}

export async function updateMission(
  workspaceId: string,
  missionId: string,
  input: UpdateEpochMissionInput,
) {
  return updateEpochMission(workspaceId, missionId, input);
}

export async function runMission(input: Parameters<typeof runEpochMission>[0]) {
  return runEpochMission(input);
}

export async function getMission(workspaceId: string, missionId: string) {
  return getEpochMission(workspaceId, missionId);
}

export async function getMissionAuthorityGate(workspaceId: string, missionId: string) {
  return getEpochAuthorityGate(workspaceId, missionId);
}

export async function listMissionAuthorityPolicies(workspaceId: string, missionId?: string, institutionId?: string) {
  return listEpochAuthorityPolicies({ workspaceId, missionId, institutionId });
}

export async function createMissionAuthorityPolicy(input: Parameters<typeof createEpochAuthorityPolicy>[0]) {
  return createEpochAuthorityPolicy(input);
}

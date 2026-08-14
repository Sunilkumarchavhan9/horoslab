import {
  getEpochExecutionRun,
  listEpochExecutionRuns,
  runEpochMission,
} from "../epochStore";

export async function summarizeExecutionService(workspaceId: string) {
  const executions = await listEpochExecutionRuns({ workspaceId });
  return {
    workspaceId,
    counts: {
      executions: executions.length,
      running: executions.filter((run) => run.status === "running").length,
      completed: executions.filter((run) => run.status === "completed").length,
      failed: executions.filter((run) => run.status === "failed").length,
    },
    recent: executions.slice(0, 10),
  };
}

export async function listExecutionRuns(workspaceId: string, missionId?: string) {
  return listEpochExecutionRuns({ workspaceId, missionId });
}

export async function getExecutionRun(workspaceId: string, executionRunId: string) {
  return getEpochExecutionRun(workspaceId, executionRunId);
}

export async function executeMission(input: Parameters<typeof runEpochMission>[0]) {
  return runEpochMission(input);
}

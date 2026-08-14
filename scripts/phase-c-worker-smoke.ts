import { EpochV12Worker } from "../packages/epoch-v12-sdk/dist/index.js";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

async function main() {
  const worker = new EpochV12Worker({
    baseUrl: process.env.EPOCH_V12_API_URL ?? "http://localhost:3011",
    apiKey: required("EPOCH_V12_API_KEY"),
    workspaceId: required("EPOCH_V12_WORKSPACE_ID"),
    workerId: required("EPOCH_V12_WORKER_ID"),
  });
  const expectedMissionId = required("EPOCH_V12_MISSION_ID");

  const heartbeat = await worker.heartbeat("available");
  console.log("Heartbeat:", JSON.stringify(heartbeat));

  const lease = await worker.lease(1, 30_000, expectedMissionId);
  console.log("Lease:", JSON.stringify(lease));
  const job = lease.jobs.find((candidate) => String(candidate.missionId ?? "") === expectedMissionId);
  if (!job) {
    throw new Error(`Expected mission ${expectedMissionId} was not leased; no job was acknowledged.`);
  }

  const fencingToken = lease.fencingTokens[job.id];
  if (!Number.isInteger(fencingToken)) throw new Error(`No fencing token returned for job ${job.id}`);

  const evidence = await worker.recordEvidence(expectedMissionId, [{
    kind: "worker_smoke",
    summary: "Phase C worker lease smoke test completed its guarded worker step.",
    payload: { workerId: process.env.EPOCH_V12_WORKER_ID, jobId: job.id, fencingToken },
  }]);
  console.log("Evidence:", JSON.stringify(evidence));

  const completion = await worker.complete(job.id, fencingToken);
  console.log("Completion:", JSON.stringify(completion));

  const evaluation = await worker.evaluate({
    missionId: expectedMissionId,
    outcome: "passed",
    score: 100,
    evidence: { jobId: job.id, fencingToken, smoke: true },
  });
  console.log("Evaluation:", JSON.stringify(evaluation));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

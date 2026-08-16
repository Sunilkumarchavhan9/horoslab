import "dotenv/config";
import { prisma } from "../lib/storage/prismaClient";
import { enqueueEpochJob } from "../lib/epoch/epochQueue";
import { runEpochWorkerTick } from "../lib/epoch/epochWorker";
import { loadEpochQualityDataset } from "../lib/epoch/qualityDataset";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`EPOCH_SQS_WORKER_ACCEPTANCE_FAILED: ${message}`);
}

async function main(): Promise<void> {
  assert(process.env.EPOCH_SQS_MISSIONS_URL, "EPOCH_SQS_MISSIONS_URL is not configured");

  const userId = `epoch_sqs_worker_acceptance_${Date.now()}`;
  const workspace = await prisma.workspace.create({
    data: { userId, ownerId: userId, name: "Epoch AWS SQS Worker Acceptance", plan: "Free", region: "aws-ap-south-1" },
  });

  try {
    const institution = await prisma.epochInstitution.create({
      data: { workspaceId: workspace.id, userId, name: "AWS SQS Worker Institution", summary: "Controlled durable worker acceptance" },
    });
    const mission = await prisma.epochMission.create({
      data: { workspaceId: workspace.id, institutionId: institution.id, userId, title: "AWS SQS durable worker acceptance", objective: "Verify real SQS delivery, lease, checkpoint, completion, and acknowledgement", plan: ["benchmark", "quality", "evidence"], state: "draft" },
    });
    const dataset = await loadEpochQualityDataset();
    const outputs = dataset.cases.map((testCase) => ({
      caseId: testCase.id,
      output: testCase.expectedRegex?.includes("^NO$") ? "NO" : testCase.expectedContains ?? (testCase.expectedRegex?.includes("status") ? '{"status":"ready"}' : testCase.expectedRegex?.includes("ok") ? '{"ok":true}' : "accepted"),
    }));

    const benchmarkJob = await enqueueEpochJob({ workspaceId: workspace.id, institutionId: institution.id, missionId: mission.id, userId, type: "benchmark", payload: { mode: "aws-sqs-acceptance", caseIds: ["epoch-sqs-controlled-case"] } });
    const qualityJob = await enqueueEpochJob({ workspaceId: workspace.id, institutionId: institution.id, missionId: mission.id, userId, type: "quality", payload: { datasetId: dataset.id, outputs, minimumScorePct: 100 } });

    const deadline = Date.now() + 90_000;
    let lastTick = { processed: 0, leased: 0 };
    while (Date.now() < deadline) {
      lastTick = await runEpochWorkerTick();
      const jobs = await prisma.epochQueueJob.findMany({ where: { workspaceId: workspace.id, missionId: mission.id }, select: { id: true, status: true, type: true, retryCount: true } });
      if (jobs.every((job) => job.status === "done")) break;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    const stored = await prisma.epochMission.findUnique({ where: { id: mission.id }, include: { evidence: true } });
    const jobs = await prisma.epochQueueJob.findMany({ where: { workspaceId: workspace.id, missionId: mission.id }, select: { id: true, status: true, type: true, retryCount: true, lastError: true, payload: true } });
    const checkpoints = jobs.map((job) => {
      const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload) ? job.payload as Record<string, unknown> : {};
      return { jobId: job.id, workerCheckpoint: payload.workerCheckpoint };
    });
    const proof = stored?.proof && typeof stored.proof === "object" && !Array.isArray(stored.proof) ? stored.proof as Record<string, unknown> : {};

    assert(jobs.find((job) => job.id === benchmarkJob.id)?.status === "done", `benchmark job did not complete: ${JSON.stringify(jobs)}`);
    assert(jobs.find((job) => job.id === qualityJob.id)?.status === "done", `quality job did not complete: ${JSON.stringify(jobs)}`);
    assert(checkpoints.some((checkpoint) => checkpoint.jobId === benchmarkJob.id && checkpoint.workerCheckpoint && (checkpoint.workerCheckpoint as Record<string, unknown>).status === "completed"), "benchmark completion checkpoint missing");
    assert(checkpoints.some((checkpoint) => checkpoint.jobId === qualityJob.id && checkpoint.workerCheckpoint && (checkpoint.workerCheckpoint as Record<string, unknown>).status === "completed"), "quality completion checkpoint missing");
    assert(proof.benchmarkRun && typeof proof.benchmarkRun === "object", "benchmark proof was not persisted");
    assert(proof.qualityEvaluation && typeof proof.qualityEvaluation === "object", "quality proof was not persisted");

    console.log(JSON.stringify({ status: "PASS", transport: "aws-sqs", queueUrlConfigured: true, workspaceId: workspace.id, missionId: mission.id, lastTick, jobs, checkpoints, evidenceKinds: stored?.evidence.map((item) => item.kind) }, null, 2));
  } finally {
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch(() => undefined);
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

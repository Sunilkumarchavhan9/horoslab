import "dotenv/config";
import { prisma } from "../lib/storage/prismaClient";
import { enqueueEpochJob } from "../lib/epoch/epochQueue";
import { runEpochWorkerTick } from "../lib/epoch/epochWorker";
import { loadEpochQualityDataset } from "../lib/epoch/qualityDataset";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`EPOCH_WORKER_ACCEPTANCE_FAILED: ${message}`);
}

async function main(): Promise<void> {
  const userId = `epoch_worker_acceptance_${Date.now()}`;
  const workspace = await prisma.workspace.create({ data: { userId, ownerId: userId, name: "Epoch Worker Acceptance", plan: "Free", region: "local" } });
  try {
    const institution = await prisma.epochInstitution.create({ data: { workspaceId: workspace.id, userId, name: "Local Worker Institution", summary: "Durable benchmark and quality worker acceptance" } });
    const mission = await prisma.epochMission.create({ data: { workspaceId: workspace.id, institutionId: institution.id, userId, title: "Durable worker acceptance", objective: "Run benchmark and quality workers", plan: ["benchmark", "quality", "evidence"], state: "draft" } });
    const dataset = await loadEpochQualityDataset();
    const outputs = dataset.cases.map((testCase) => ({ caseId: testCase.id, output: testCase.expectedRegex?.includes("^NO$") ? "NO" : testCase.expectedContains ?? (testCase.expectedRegex?.includes("status") ? '{"status":"ready"}' : testCase.expectedRegex?.includes("ok") ? '{"ok":true}' : "accepted") }));
    const benchmarkJob = await enqueueEpochJob({ workspaceId: workspace.id, institutionId: institution.id, missionId: mission.id, userId, type: "benchmark", payload: { mode: "local", caseIds: ["epoch-worker-controlled-case"] } });
    const qualityJob = await enqueueEpochJob({ workspaceId: workspace.id, institutionId: institution.id, missionId: mission.id, userId, type: "quality", payload: { datasetId: dataset.id, outputs, minimumScorePct: 100 } });
    const tick = await runEpochWorkerTick();
    const stored = await prisma.epochMission.findUnique({ where: { id: mission.id }, include: { evidence: true } });
    const jobs = await prisma.epochQueueJob.findMany({ where: { workspaceId: workspace.id, missionId: mission.id }, select: { id: true, status: true, type: true } });
    const proof = stored?.proof && typeof stored.proof === "object" && !Array.isArray(stored.proof) ? stored.proof as Record<string, unknown> : {};
    assert(tick.processed >= 2, `worker processed ${tick.processed} jobs`);
    assert(jobs.find((job) => job.id === benchmarkJob.id)?.status === "done", `benchmark job was not completed: ${JSON.stringify(jobs)}`);
    assert(jobs.find((job) => job.id === qualityJob.id)?.status === "done", `quality job was not completed: ${JSON.stringify(jobs)}`);
    assert(proof.benchmarkRun && typeof proof.benchmarkRun === "object", "benchmark proof was not persisted");
    assert(proof.qualityEvaluation && typeof proof.qualityEvaluation === "object", "quality proof was not persisted");
    assert(stored?.evidence.some((item) => item.kind === "benchmark_run"), "benchmark evidence was not persisted");
    assert(stored?.evidence.some((item) => item.kind === "quality_evaluation"), "quality evidence was not persisted");
    console.log(JSON.stringify({ status: "PASS", workspaceId: workspace.id, missionId: mission.id, dataset: { id: dataset.id, sha256: dataset.sha256, cases: dataset.cases.length }, tick, jobs, evidenceKinds: stored?.evidence.map((item) => item.kind) }, null, 2));
  } finally {
    await prisma.workspace.delete({ where: { id: workspace.id } }).catch(() => undefined);
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

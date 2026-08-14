import { completeEpochAi, readEpochAiProviderConfig } from "../lib/epoch/aiProviders";
import { runEpochLocalBenchmark } from "../lib/epoch/localBenchmarkRunner";
import { evaluateEpochEconomics, evaluateEpochQuality } from "../lib/epoch/evaluationEngine";
import { runEpochMissionOrchestrator } from "../lib/epoch/missionOrchestrator";
import { runEpochOllamaMissionProof } from "../lib/epoch/localMissionProof";
import { buildEpochExperimentReproducibilityManifest, verifyEpochExperimentReproducibilityManifest } from "../lib/epoch/experimentReproducibility";
import { loadEpochQualityDataset } from "../lib/epoch/qualityDataset";
import { evaluateEpochTelemetry } from "../lib/epoch/telemetryEvaluation";
import { normalizeEpochHuggingFaceInspection } from "../lib/epoch/huggingFace";
import { buildEpochLocalRuntimePlan } from "../lib/epoch/localRuntimePlan";
import { runEpochSandbox } from "../lib/epoch/sandboxRunner";

const model = process.env.EPOCH_LOCAL_ACCEPTANCE_MODEL ?? "qwen2.5:3b";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`EPOCH_LOCAL_ACCEPTANCE_FAILED: ${message}`);
}

async function main(): Promise<void> {
  const config = readEpochAiProviderConfig("ollama");
  const hfInspection = normalizeEpochHuggingFaceInspection({ id: "Epoch/local-acceptance-model", sha: "abcdef1234567", cardData: { license: "apache-2.0" }, pipeline_tag: "text-generation", siblings: [{ rfilename: "config.json", size: 2 }] });
  const commitSha = hfInspection.commitSha;
  assert(hfInspection.governance.status === "ELIGIBLE" && commitSha, "Hugging Face governance or pinned revision failed");
  const vllmPlan = buildEpochLocalRuntimePlan({ runtime: "vllm", model: hfInspection.repositoryId, revision: commitSha });
  const sglangPlan = buildEpochLocalRuntimePlan({ runtime: "sglang", model: hfInspection.repositoryId, revision: commitSha });
  assert(vllmPlan.execution === "PLAN_ONLY_UNTIL_LOCAL_RUNTIME_ENABLED" && sglangPlan.execution === "PLAN_ONLY_UNTIL_LOCAL_RUNTIME_ENABLED", "local runtime plans failed");
  const sandbox = await runEpochSandbox({ image: process.env.EPOCH_SANDBOX_IMAGE || "node:22-alpine", command: ["node", "-e", "console.log('epoch-final-sandbox-ok')"], timeoutMs: 15_000, memoryMb: 256, cpuLimit: 0.5 });
  if (process.env.EPOCH_SANDBOX_ENABLED?.trim().toLowerCase() === "true") assert(sandbox.status === "passed" && sandbox.stdout.includes("epoch-final-sandbox-ok"), `sandbox failed: ${sandbox.status}`);
  const dataset = await loadEpochQualityDataset();
  const qualityCases = dataset.cases;
  const qualityOutputs = [] as Array<{ caseId: string; output: string; error?: string }>;
  for (const testCase of qualityCases) {
    try {
      const response = await completeEpochAi({ model, prompt: testCase.prompt, maxOutputTokens: 64 }, config);
      qualityOutputs.push({ caseId: testCase.id, output: response.output });
    } catch (error) {
      qualityOutputs.push({ caseId: testCase.id, output: "", error: error instanceof Error ? error.message : "quality_request_failed" });
    }
  }
  const quality = evaluateEpochQuality({ cases: qualityCases, outputs: qualityOutputs, minimumScorePct: 100 });
  assert(quality.status === "PASS", `quality evaluator returned ${quality.status}`);

  const benchmark = await runEpochLocalBenchmark({ model, prompts: ["Reply with exactly: benchmark one.", "Reply with exactly: benchmark two."], repetitions: 1, warmup: 1, maxOutputTokens: 32 });
  assert(benchmark.status === "completed" && benchmark.failedRuns === 0, "local benchmark did not complete cleanly");
  const requestsPerHour = benchmark.latencyMs.average ? 3_600_000 / benchmark.latencyMs.average : undefined;
  const economics = evaluateEpochEconomics({ costPerHour: Number(process.env.EPOCH_LOCAL_COST_PER_HOUR ?? 0), requestsPerHour, tokensPerHour: benchmark.throughput.outputTokensPerSecond ? benchmark.throughput.outputTokensPerSecond * 3600 : undefined, monthlyRequests: 1000 });
  assert(economics.status === "PASS", `economic evaluator returned ${economics.status}`);
  const telemetry = evaluateEpochTelemetry({ source: "epoch-local-acceptance", baseline: { quality: 100, p99: benchmark.latencyMs.p99 ?? 0 }, current: { quality: quality.weightedScorePct ?? 0, p99: benchmark.latencyMs.p99 ?? 0 }, thresholdsPct: { quality: 5, p99: 20 } });
  assert(telemetry.action === "CONTINUE", `telemetry evaluation requested ${telemetry.action}`);

  const candidateMeasurements = { candidate_1: { quality: quality.weightedScorePct ?? 0, p99: benchmark.latencyMs.p99 ?? Number.POSITIVE_INFINITY, costPerRequest: economics.costPerRequest ?? Number.POSITIVE_INFINITY } };
  const orchestration = runEpochMissionOrchestrator({ outcome: { objective: "Run the local model within quality, latency, and cost constraints" }, baseline: { quality: 100 }, workload: { monthlyRequests: 1000, inputTokens: 36, outputTokens: 3 }, acceptanceCriteria: ["quality >= 97", "p99 <= 1000"], model: { name: model, requiredVramGb: 4, supportedRuntimes: ["ollama"], supportedPrecisions: ["fp16"] }, currentReality: { provider: "ollama", endpoint: config.endpoint, benchmark: benchmark.model }, runtimeOptions: [{ name: "ollama", version: "0.32.8", supportedPrecisions: ["fp16"] }], hardwareOptions: [{ name: benchmark.gpuAfter?.name ?? "local-gpu", vramGb: (benchmark.gpuAfter?.memoryTotalMb ?? 6144) / 1024, available: true }], candidateMeasurements, authorization: { allowed: true, reason: "local bounded acceptance authorization" }, verification: { passed: true, evidenceIds: ["local-benchmark", "local-quality", "local-economics"], summary: "Local measured quality, benchmark, and economics passed" } });
  assert(orchestration.status === "SUCCESS" && orchestration.decision.winner?.candidateId === "candidate_1", "orchestrator did not select a verified candidate");

  const proof = await runEpochOllamaMissionProof({ workspaceId: "ws-local-acceptance", institutionId: "inst-local-acceptance", title: "Full local Epoch acceptance", objective: "Reply with exactly the single word accepted and nothing else.", acceptanceCriteria: ["The local model returns exactly accepted."], model });
  assert(proof.verification.decision === "PASS" && proof.policy.decision === "allow", "real mission proof failed");

  const manifest = buildEpochExperimentReproducibilityManifest({ experimentId: "epoch-local-full-acceptance", model: { name: model }, runtime: { provider: "ollama", endpoint: config.endpoint }, hardware: benchmark.gpuAfter ?? {}, workload: { prompts: qualityCases.length, repetitions: 1 }, configuration: { maxOutputTokens: 64 }, dataset: { id: dataset.id, sha256: dataset.sha256 }, softwareEnvironment: { node: process.version }, metrics: { benchmark, quality, economics, telemetry, missionVerification: proof.verification.decision }, artifacts: [{ name: "local-acceptance.json", contentSha256: "0".repeat(64) }] });
  assert(verifyEpochExperimentReproducibilityManifest(manifest).valid, "reproducibility manifest failed verification");

  const requiredStages = ["customer_outcome", "current_reality", "unknown_uncertainty", "hypotheses", "capability_gap", "capability_discovery", "system_generation", "simulation", "sandbox", "benchmark", "quality_evaluation", "economic_evaluation", "constraint_filter", "system_selection", "authorization", "execution", "observation", "evidence", "verification", "success"];
  const stageNames = new Set(orchestration.stages.map((stage) => stage.name));
  assert(requiredStages.every((name) => stageNames.has(name as never)), "orchestrator omitted a required architecture stage");
  console.log(JSON.stringify({ status: "PASS", model, huggingFace: { repositoryId: hfInspection.repositoryId, commitSha: hfInspection.commitSha, governance: hfInspection.governance.status }, runtimes: { vllmPlan: vllmPlan.planSha256, sglangPlan: sglangPlan.planSha256 }, sandbox: { status: sandbox.status, isolation: sandbox.isolation }, dataset: { id: dataset.id, sha256: dataset.sha256, cases: dataset.cases.length }, quality, benchmark: { status: benchmark.status, p95: benchmark.latencyMs.p95, p99: benchmark.latencyMs.p99, throughput: benchmark.throughput, gpu: benchmark.gpuAfter }, economics, telemetry: { action: telemetry.action, status: telemetry.drift.status }, winner: orchestration.decision.winner, missionVerification: proof.verification.decision, reproducibility: manifest.manifestSha256, stages: orchestration.stages.map((stage) => stage.name) }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

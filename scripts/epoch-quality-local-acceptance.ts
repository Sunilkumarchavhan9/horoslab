import { completeEpochAi, readEpochAiProviderConfig } from "../lib/epoch/aiProviders";
import { evaluateEpochQuality } from "../lib/epoch/evaluationEngine";
import { loadEpochQualityDataset } from "../lib/epoch/qualityDataset";

async function main(): Promise<void> {
  const dataset = await loadEpochQualityDataset();
  const model = process.env.EPOCH_LOCAL_ACCEPTANCE_MODEL ?? "qwen2.5:3b";
  const config = readEpochAiProviderConfig("ollama");
  const outputs = [] as Array<{ caseId: string; output: string; error?: string }>;
  for (const testCase of dataset.cases) {
    try { const response = await completeEpochAi({ model, prompt: testCase.prompt, maxOutputTokens: 64 }, config); outputs.push({ caseId: testCase.id, output: response.output.trim() }); }
    catch (error) { outputs.push({ caseId: testCase.id, output: "", error: error instanceof Error ? error.message : "quality_request_failed" }); }
  }
  const quality = evaluateEpochQuality({ cases: dataset.cases, outputs, minimumScorePct: Number(process.env.EPOCH_QUALITY_MINIMUM_SCORE_PCT ?? 80) });
  console.log(JSON.stringify({ status: quality.status, dataset: { id: dataset.id, sha256: dataset.sha256, cases: dataset.cases.length }, model, quality }, null, 2));
  if (quality.status !== "PASS") process.exitCode = 1;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

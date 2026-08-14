import { validateEpochRuntimeMatrix } from "../lib/epoch/runtimeExecutionValidation";

async function main() {
  const result = await validateEpochRuntimeMatrix({ model: process.env.EPOCH_RUNTIME_SMOKE_MODEL ?? "distilbert/distilgpt2", task: "text-generation", value: "Reply with exactly: epoch-runtime-ok", maxOutputTokens: 16 });
  console.log(JSON.stringify(result, null, 2));
  if (!result.results.some((item) => item.status === "OBSERVED")) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

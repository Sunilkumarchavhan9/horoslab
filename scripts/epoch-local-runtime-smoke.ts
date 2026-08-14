import { executeEpochRuntimeAdapter, probeEpochRuntimeAdapter } from "../lib/epoch/runtimeAdapters";

async function main(): Promise<void> {
  const target = (process.env.EPOCH_LOCAL_RUNTIME_TARGET ?? "vllm") as "vllm" | "sglang";
  if (target !== "vllm" && target !== "sglang") throw new Error("EPOCH_LOCAL_RUNTIME_TARGET must be vllm or sglang");
  const endpointEnvVar = target === "vllm" ? "EPOCH_RUNTIME_VLLM_ENDPOINT" : "EPOCH_RUNTIME_SGLANG_ENDPOINT";
  const model = process.env.EPOCH_LOCAL_RUNTIME_MODEL?.trim();
  if (!model) throw new Error("Set EPOCH_LOCAL_RUNTIME_MODEL to the served model id");
  if (!process.env[endpointEnvVar]?.trim()) throw new Error(`Set ${endpointEnvVar} to the running ${target} OpenAI-compatible endpoint`);
  const probe = await probeEpochRuntimeAdapter({ target, endpointEnvVar });
  if (!probe.reachable) throw new Error(`EPOCH_LOCAL_RUNTIME_SMOKE_BLOCKED: ${JSON.stringify(probe)}`);
  if (!probe.models.includes(model)) throw new Error(`EPOCH_LOCAL_RUNTIME_MODEL_NOT_SERVING: ${model}; available=${probe.models.join(",")}`);
  const execution = await executeEpochRuntimeAdapter({ target, endpointEnvVar, model, prompt: "Reply with exactly: runtime-ok", maxOutputTokens: 16 });
  if (!execution.output.toLowerCase().includes("runtime-ok")) throw new Error(`EPOCH_LOCAL_RUNTIME_OUTPUT_FAILED: ${execution.output}`);
  console.log(JSON.stringify({ status: "PASS", target, model, probe, execution: { status: execution.status, latencyMs: execution.latencyMs, responseSha256: execution.responseSha256 } }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

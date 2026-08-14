import { buildEpochRuntimeBenchmark, evaluateEpochRuntimeQuality } from "../lib/epoch/runtimeEvaluation";
import type { EpochTaskExecutionResult } from "../lib/epoch/taskExecutionAdapters";
import { planEpochDiscovery } from "../lib/epoch/discoveryLoop";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`EPOCH_RUNTIME_LOCAL_ACCEPTANCE_FAILED: ${message}`);
}

function execution(id: string, status: EpochTaskExecutionResult["status"], latencyMs: number, output: string): EpochTaskExecutionResult {
  return { status, task: "text-generation", model: "local/acceptance", output, endpoint: "http://local-runtime", httpStatus: status === "OBSERVED" ? 200 : 503, latencyMs, responseSha256: id.padEnd(64, "0").slice(0, 64), validation: { valid: status === "OBSERVED", reasons: status === "OBSERVED" ? [] : ["synthetic_runtime_failure"] }, observedAt: new Date().toISOString() };
}

function main(): void {
  const executions = [execution("observed-1", "OBSERVED", 42, "ready"), execution("observed-2", "OBSERVED", 58, "ready"), execution("failed-1", "FAILED", 0, "")];
  const benchmark = buildEpochRuntimeBenchmark({ executions, capturedAt: new Date("2026-08-13T00:00:00.000Z") });
  assert(benchmark.status === "completed" && benchmark.successRatePct === 66.67, "benchmark did not record observed and failed executions");

  const cases = [{ id: "case-ready", input: "health", expectedContains: "ready" }];
  const qualityPass = evaluateEpochRuntimeQuality({ cases, outputs: [{ caseId: "case-ready", output: "ready" }], minimumScorePct: 100 });
  assert(qualityPass.status === "PASS", "quality pass was not recorded");
  const qualityFail = evaluateEpochRuntimeQuality({ cases, outputs: [{ caseId: "case-ready", output: "unavailable" }], minimumScorePct: 100 });
  assert(qualityFail.status === "FAIL", "quality failure was not recorded");

  const rediscovery = planEpochDiscovery({ trigger: "runtime_failure", failedStage: "runtime_quality", failureReason: qualityFail.failures[0]?.reason ?? "quality_failed", now: new Date("2026-08-13T00:00:01.000Z") });
  assert(rediscovery.rediscoveryRequired && rediscovery.actions.some((action) => action.kind === "rediscover"), "runtime failure did not create rediscovery action");

  console.log(JSON.stringify({ status: "PASS", execution: { samples: executions.length, observed: benchmark.observedSamples }, benchmark, quality: { pass: qualityPass, fail: qualityFail }, rediscovery: { trigger: rediscovery.trigger, required: rediscovery.rediscoveryRequired, actions: rediscovery.actions } }, null, 2));
}

try { main(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }

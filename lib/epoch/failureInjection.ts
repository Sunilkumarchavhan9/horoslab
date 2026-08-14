export type EpochFailureInjection = "local_runtime_health_timeout" | "local_runtime_process_exit" | "pipeline_runtime_crash" | "pipeline_oom" | "pipeline_timeout" | "pipeline_sandbox_failure";

export function isEpochFailureInjected(failure: EpochFailureInjection, env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.EPOCH_FAILURE_INJECTION ?? "").split(",").map((value) => value.trim()).includes(failure);
}

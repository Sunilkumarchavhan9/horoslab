import { spawn, type ChildProcess } from "node:child_process";
import { buildEpochLocalRuntimePlan, type EpochLocalRuntimePlanInput } from "./localRuntimePlan";
import { isEpochFailureInjected } from "./failureInjection";

export class EpochLocalRuntimeExecutionError extends Error {
  constructor(message: string, public readonly code = "LOCAL_RUNTIME_EXECUTION_FAILED") { super(message); this.name = "EpochLocalRuntimeExecutionError"; }
}

const running = new Map<number, ChildProcess>();

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export async function startEpochLocalRuntime(input: EpochLocalRuntimePlanInput & { startupTimeoutMs?: number; fetchImpl?: typeof fetch; spawnImpl?: typeof spawn }) {
  if (process.env.EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED !== "true") throw new EpochLocalRuntimeExecutionError("Local runtime execution is disabled; set EPOCH_LOCAL_RUNTIME_EXECUTION_ENABLED=true", "LOCAL_RUNTIME_EXECUTION_DISABLED");
  const plan = buildEpochLocalRuntimePlan(input);
  const child = (input.spawnImpl ?? spawn)(plan.commands[0], plan.commands.slice(1), { stdio: "ignore", windowsHide: true });
  if (!child.pid) throw new EpochLocalRuntimeExecutionError("Local runtime process did not provide a pid", "LOCAL_RUNTIME_PROCESS_FAILED");
  running.set(child.pid, child);
  const timeoutMs = Math.min(900_000, Math.max(2_000, Math.floor(input.startupTimeoutMs ?? 120_000)));
  const deadline = Date.now() + timeoutMs;
  let lastError = "runtime health check timed out";
  while (Date.now() < deadline) {
    if (child.exitCode !== null || isEpochFailureInjected("local_runtime_process_exit")) { running.delete(child.pid); throw new EpochLocalRuntimeExecutionError(`Local runtime exited with code ${child.exitCode ?? 1}`, "LOCAL_RUNTIME_PROCESS_EXITED"); }
    try {
      const response = isEpochFailureInjected("local_runtime_health_timeout") ? null : await (input.fetchImpl ?? fetch)(`${plan.endpoint}/../health`, { signal: AbortSignal.timeout(2_000) });
      if (!response) { lastError = "injected health timeout"; await sleep(500); continue; }
      if (response.ok) return { plan, pid: child.pid, status: "READY" as const, endpoint: plan.endpoint, stop: () => stopEpochLocalRuntime(child.pid!) };
      lastError = `health returned HTTP ${response.status}`;
    } catch (error) { lastError = error instanceof Error ? error.message : "health check failed"; }
    await sleep(500);
  }
  stopEpochLocalRuntime(child.pid);
  throw new EpochLocalRuntimeExecutionError(lastError, "LOCAL_RUNTIME_STARTUP_TIMEOUT");
}

export function stopEpochLocalRuntime(pid: number): boolean {
  const child = running.get(pid);
  if (!child) return false;
  running.delete(pid);
  return child.kill();
}

export function listEpochLocalRuntimes() { return [...running.keys()]; }

#!/usr/bin/env node
export type EmulatorJob = { id: string; type: "plan" | "execute" | "verify"; payload: Record<string, unknown> };
export type EmulatorResult = { workerId: string; leased: string[]; completed: string[]; fencingTokens: Record<string, number> };

export function runEpochV12Emulator(input: { workerId: string; jobs: EmulatorJob[] }): EmulatorResult {
  const fencingTokens: Record<string, number> = {}; const leased: string[] = []; const completed: string[] = [];
  input.jobs.forEach((job, index) => { leased.push(job.id); fencingTokens[job.id] = index + 1; completed.push(job.id); });
  return { workerId: input.workerId, leased, completed, fencingTokens };
}

if (process.argv[1]?.endsWith("index.js")) {
  console.log(JSON.stringify(runEpochV12Emulator({ workerId: process.env.EPOCH_V12_WORKER_ID ?? "local-worker", jobs: [{ id: "local-job-1", type: "execute", payload: { simulated: true } }] }), null, 2));
}

#!/usr/bin/env node
export function runEpochV12Emulator(input) {
    const fencingTokens = {};
    const leased = [];
    const completed = [];
    input.jobs.forEach((job, index) => { leased.push(job.id); fencingTokens[job.id] = index + 1; completed.push(job.id); });
    return { workerId: input.workerId, leased, completed, fencingTokens };
}
if (process.argv[1]?.endsWith("index.js")) {
    console.log(JSON.stringify(runEpochV12Emulator({ workerId: process.env.EPOCH_V12_WORKER_ID ?? "local-worker", jobs: [{ id: "local-job-1", type: "execute", payload: { simulated: true } }] }), null, 2));
}

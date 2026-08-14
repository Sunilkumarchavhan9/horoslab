#!/usr/bin/env node
/* eslint-disable no-console */

const baseUrl = process.env.MEMORYOSTM_LOAD_BASE_URL ?? "http://127.0.0.1:3000";
const threadId = process.env.MEMORYOSTM_LOAD_THREAD_ID;
const authToken = process.env.MEMORYOSTM_LOAD_AUTH_TOKEN;
const durationSeconds = Number(process.env.MEMORYOSTM_LOAD_DURATION_SECONDS ?? 30);
const concurrency = Number(process.env.MEMORYOSTM_LOAD_CONCURRENCY ?? 20);

if (!threadId || !authToken) {
  console.error("Missing MEMORYOSTM_LOAD_THREAD_ID or MEMORYOSTM_LOAD_AUTH_TOKEN");
  process.exit(1);
}

const endAt = Date.now() + durationSeconds * 1000;
let okCount = 0;
let errorCount = 0;
const latencies = [];

async function worker() {
  while (Date.now() < endAt) {
    const started = performance.now();
    try {
      const res = await fetch(
        `${baseUrl}/api/runtime/threads/${encodeURIComponent(threadId)}/desktop/status`,
        {
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        },
      );
      const latency = performance.now() - started;
      latencies.push(latency);
      if (res.ok) {
        okCount += 1;
      } else {
        errorCount += 1;
      }
    } catch {
      errorCount += 1;
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

latencies.sort((a, b) => a - b);
const p95Index = Math.max(0, Math.floor(latencies.length * 0.95) - 1);
const p99Index = Math.max(0, Math.floor(latencies.length * 0.99) - 1);

console.log("Desktop status load test complete");
console.log(`Requests: ${okCount + errorCount}`);
console.log(`Success: ${okCount}`);
console.log(`Errors: ${errorCount}`);
console.log(`p95 latency: ${latencies[p95Index]?.toFixed(2) ?? "n/a"}ms`);
console.log(`p99 latency: ${latencies[p99Index]?.toFixed(2) ?? "n/a"}ms`);


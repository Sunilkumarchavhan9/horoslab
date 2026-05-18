import autocannon from "autocannon";
import type { Result } from "autocannon";

type PerfResult = {
  title: string;
  averageLatencyMs: number;
  requestsPerSecond: number;
  throughputBytesPerSecond: number;
  responses2xx: number;
  non2xxResponses: number;
};

function runAutocannon(
  title: string,
  options: autocannon.Options,
): Promise<PerfResult> {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      options,
      (error: Error | null, result: Result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        title,
        averageLatencyMs: Number(result.latency.average.toFixed(2)),
        requestsPerSecond: Number(result.requests.average.toFixed(2)),
        throughputBytesPerSecond: Number(result.throughput.average.toFixed(2)),
        responses2xx: Number((result as unknown as Record<string, number>)["2xx"] ?? 0),
        non2xxResponses: Number((result as unknown as Record<string, number>)["non2xx"] ?? 0),
      });
      },
    );

    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true,
    });
  });
}

async function main(): Promise<void> {
  const baseUrl = process.env.PERF_BASE_URL ?? "http://localhost:3001";
  const healthPath = process.env.PERF_HEALTH_PATH ?? "/api/health";
  const durationSeconds = Number.parseInt(process.env.PERF_DURATION ?? "10", 10);
  const connections = Number.parseInt(process.env.PERF_CONNECTIONS ?? "20", 10);

  console.log(
    `Running perf smoke test against ${baseUrl}${healthPath} (duration=${durationSeconds}s, connections=${connections})`,
  );

  const result = await runAutocannon("health", {
    url: `${baseUrl}${healthPath}`,
    method: "GET",
    duration: durationSeconds,
    connections,
  });

  if (result.responses2xx <= 0 || result.non2xxResponses > 0) {
    throw new Error(
      `Perf smoke failed: 2xx=${result.responses2xx}, non2xx=${result.non2xxResponses}. Check PERF_BASE_URL/PERF_HEALTH_PATH and deployment routing.`,
    );
  }

  console.log("\nPerf smoke summary:");
  console.log(
    JSON.stringify(
      {
        route: healthPath,
        ...result,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

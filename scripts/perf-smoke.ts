import autocannon from "autocannon";
import type { Result } from "autocannon";

type PerfResult = {
  title: string;
  averageLatencyMs: number;
  requestsPerSecond: number;
  throughputBytesPerSecond: number;
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
  const durationSeconds = Number.parseInt(process.env.PERF_DURATION ?? "10", 10);
  const connections = Number.parseInt(process.env.PERF_CONNECTIONS ?? "20", 10);

  console.log(
    `Running perf smoke test against ${baseUrl} (duration=${durationSeconds}s, connections=${connections})`,
  );

  const result = await runAutocannon("health", {
    url: `${baseUrl}/api/health`,
    method: "GET",
    duration: durationSeconds,
    connections,
  });

  console.log("\nPerf smoke summary:");
  console.log(
    JSON.stringify(
      {
        route: "/api/health",
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

import "dotenv/config";
import { getLatestRun } from "../lib/benchmark/benchmarkStore";

type BaselineReport = {
  passRate: number;
  totalCases: number;
  updatedAt: string;
};

async function readBaselineReport(): Promise<BaselineReport> {
  const latest = await getLatestRun();
  if (!latest || latest.totalCases <= 0) {
    throw new Error("benchmark baseline not found in Prisma benchmark_runs");
  }
  return {
    passRate: latest.passRate,
    totalCases: latest.totalCases,
    updatedAt: latest.completedAt ?? latest.generatedAt,
  };
}

async function main(): Promise<void> {
  // Compare eval should use the Prisma-backed runtime path in CI.
  process.env.MEMORY_STORE_PROVIDER = "prisma";

  const { runAllCases } = await import("./eval/harness");
  const baseline = await readBaselineReport();
  const current = await runAllCases({ printEach: false });

  console.log("Baseline:");
  console.log(
    `  passRate=${baseline.passRate.toFixed(1)}% totalCases=${baseline.totalCases} updatedAt=${baseline.updatedAt}`,
  );
  console.log("Current:");
  console.log(
    `  passRate=${current.score.toFixed(1)}% passed=${current.passed}/${current.total}`,
  );

  if (current.score < baseline.passRate) {
    console.error(
      `Regression detected: current pass rate ${current.score.toFixed(1)}% is below baseline ${baseline.passRate.toFixed(1)}%`,
    );
    process.exit(1);
  }

  console.log("No regression against retrieval baseline.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import path from "path";

type BaselineReport = {
  passRate: number;
  totalCases: number;
  updatedAt: string;
};

const BASELINE_PATH = path.join(
  process.cwd(),
  "data",
  "eval",
  "baseline-report.json",
);

function readBaselineReport(): BaselineReport {
  if (!existsSync(BASELINE_PATH)) {
    throw new Error(`baseline report not found: ${BASELINE_PATH}`);
  }

  const raw = readFileSync(BASELINE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<BaselineReport>;

  if (
    typeof parsed.passRate !== "number" ||
    Number.isNaN(parsed.passRate) ||
    parsed.passRate < 0 ||
    parsed.passRate > 100
  ) {
    throw new Error("baseline-report.json: passRate must be a number in [0,100]");
  }

  if (
    typeof parsed.totalCases !== "number" ||
    !Number.isInteger(parsed.totalCases) ||
    parsed.totalCases <= 0
  ) {
    throw new Error("baseline-report.json: totalCases must be a positive integer");
  }

  if (typeof parsed.updatedAt !== "string" || parsed.updatedAt.length === 0) {
    throw new Error("baseline-report.json: updatedAt must be a non-empty ISO string");
  }

  return {
    passRate: parsed.passRate,
    totalCases: parsed.totalCases,
    updatedAt: parsed.updatedAt,
  };
}

async function main(): Promise<void> {
  // Compare eval should use local store and avoid external Mem0 dependency in CI.
  process.env.MEMORY_STORE_PROVIDER = "local";

  const { runAllCases } = await import("./eval/harness");
  const baseline = readBaselineReport();
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

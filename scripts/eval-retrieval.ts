import "dotenv/config";
import { runAllCases } from "./eval/harness";

async function main(): Promise<void> {
  const summary = await runAllCases({ printEach: true });
  console.log(
    `\nSummary: ${summary.passed}/${summary.total} passed (${summary.score.toFixed(1)}%)`,
  );
  process.exit(summary.score >= 95 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import "dotenv/config";

async function main(): Promise<void> {
  // Eval should be deterministic and not require external Mem0 credentials in CI.
  if (!process.env.MEMORY_STORE_PROVIDER) {
    process.env.MEMORY_STORE_PROVIDER = "local";
  }

  const { runAllCases } = await import("./eval/harness");
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

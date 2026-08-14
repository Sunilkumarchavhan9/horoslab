import "dotenv/config";

async function main(): Promise<void> {
  // Retrieval eval must be deterministic and use the Prisma-backed runtime path.
  process.env.MEMORY_STORE_PROVIDER = "prisma";

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

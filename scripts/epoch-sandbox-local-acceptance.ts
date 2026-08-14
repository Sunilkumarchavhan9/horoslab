import { runEpochSandbox } from "../lib/epoch/sandboxRunner";

async function main(): Promise<void> {
  if (process.env.EPOCH_SANDBOX_ENABLED?.trim().toLowerCase() !== "true") throw new Error("Set EPOCH_SANDBOX_ENABLED=true to run the local sandbox acceptance");
  const result = await runEpochSandbox({ image: process.env.EPOCH_SANDBOX_IMAGE || "node:22-alpine", command: ["node", "-e", "console.log('epoch-sandbox-ok')"], timeoutMs: 15_000, memoryMb: 256, cpuLimit: 0.5 });
  if (result.status !== "passed" || !result.stdout.includes("epoch-sandbox-ok")) throw new Error(`Sandbox acceptance failed: ${JSON.stringify(result)}`);
  console.log(JSON.stringify({ status: "PASS", result }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

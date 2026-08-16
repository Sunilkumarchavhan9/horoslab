import { access } from "node:fs/promises";
import { validateEpochFormatRuntime, type EpochExecutableFormat } from "../lib/epoch/formatRuntimeValidation";

type Check = { format: EpochExecutableFormat; env: string };

const checks: Check[] = [
  { format: "safetensors", env: "EPOCH_SAFETENSORS_PATH" },
  { format: "onnx", env: "EPOCH_ONNX_PATH" },
  { format: "diffusers", env: "EPOCH_DIFFUSERS_PATH" },
  { format: "adapter", env: "EPOCH_ADAPTER_PATH" },
  { format: "lora", env: "EPOCH_LORA_PATH" },
];

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const configured = checks.filter(({ env }) => Boolean(process.env[env]));
  if (configured.length === 0) {
    console.error("No artifacts configured. Set one or more of: " + checks.map(({ env }) => env).join(", "));
    console.error("This smoke test never fabricates a PASS; provide real local artifact paths.");
    process.exitCode = 2;
    return;
  }

  const results = [];
  for (const { format, env } of configured) {
    const artifactPath = process.env[env]!;
    if (!(await exists(artifactPath))) {
      results.push({ format, artifactPath, status: "UNAVAILABLE", reasons: [`artifact_not_found:${env}`] });
      continue;
    }
    results.push(await validateEpochFormatRuntime({
      format,
      artifactPath,
      pythonCommand: process.env.EPOCH_FORMAT_PYTHON_COMMAND ?? "python",
      timeoutMs: Number(process.env.EPOCH_FORMAT_RUNTIME_TIMEOUT_MS ?? 120_000),
    }));
  }

  const report = {
    version: "epoch_format_runtime_smoke.v1",
    pythonCommand: process.env.EPOCH_FORMAT_PYTHON_COMMAND ?? "python",
    results,
    checkedAt: new Date().toISOString(),
  };
  console.log(JSON.stringify(report, null, 2));
  if (results.some((result) => result.status === "FAILED" || result.status === "UNAVAILABLE")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

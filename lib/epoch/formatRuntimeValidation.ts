import { execFile as nodeExecFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import type { EpochHuggingFaceModelFormat } from "./huggingFace";

const execFile = promisify(nodeExecFile);
export type EpochExecutableFormat = "safetensors" | "onnx" | "diffusers" | "adapter" | "lora";
export type EpochFormatRuntimeValidation = { version: "epoch_format_runtime_validation.v1"; format: EpochExecutableFormat; runtime: string; artifactPath: string; status: "PASS" | "FAILED" | "UNAVAILABLE"; versionOutput: string | null; durationMs: number; reasons: string[]; evidenceSha256: string; checkedAt: string };

type Runner = (command: string, args: string[], timeoutMs: number) => Promise<{ stdout?: string; stderr?: string }>;

const scripts: Record<EpochExecutableFormat, { runtime: string; code: string }> = {
  safetensors: { runtime: "safetensors", code: "import sys\nfrom safetensors import safe_open\nwith safe_open(sys.argv[1], framework='pt') as f:\n    list(f.keys())" },
  onnx: { runtime: "onnxruntime", code: "import onnxruntime as ort; ort.InferenceSession(__import__('sys').argv[1], providers=['CPUExecutionProvider'])" },
  diffusers: { runtime: "diffusers", code: "from diffusers import DiffusionPipeline; DiffusionPipeline.from_pretrained(__import__('sys').argv[1], local_files_only=True, safety_checker=None, requires_safety_checker=False)" },
  adapter: { runtime: "peft", code: "from peft import PeftConfig; PeftConfig.from_pretrained(__import__('sys').argv[1])" },
  lora: { runtime: "peft", code: "from peft import PeftConfig; PeftConfig.from_pretrained(__import__('sys').argv[1])" },
};

function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

function loaderReason(error: unknown) {
  const message = error instanceof Error ? error.message : "format_runtime_load_failed";
  const lines = message.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return (lines[lines.length - 1] ?? message).slice(0, 500);
}

export async function validateEpochFormatRuntime(input: { format: EpochHuggingFaceModelFormat; artifactPath: string; pythonCommand?: string; timeoutMs?: number; run?: Runner; checkedAt?: Date }): Promise<EpochFormatRuntimeValidation> {
  const started = Date.now();
  const checkedAt = (input.checkedAt ?? new Date()).toISOString();
  const format = input.format as EpochExecutableFormat;
  const definition = scripts[format];
  if (!definition) return result({ format, runtime: "none", artifactPath: input.artifactPath, status: "UNAVAILABLE", versionOutput: null, durationMs: 0, reasons: [`format_${input.format}_has_no_local_loader`], checkedAt });
  const run = input.run ?? (async (command, args, timeoutMs) => execFile(command, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 200_000 }));
  try {
    const response = await run(input.pythonCommand ?? "python", ["-c", definition.code, input.artifactPath], input.timeoutMs ?? 120_000);
    const version = await run(input.pythonCommand ?? "python", ["-c", `import ${definition.runtime}; print(getattr(${definition.runtime}, '__version__', 'unknown'))`], 15_000).catch(() => ({ stdout: "unknown" }));
    return result({ format, runtime: definition.runtime, artifactPath: input.artifactPath, status: "PASS", versionOutput: (version.stdout ?? "").trim() || "unknown", durationMs: Date.now() - started, reasons: [], checkedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "format_runtime_load_failed";
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    const unavailable = code === "ENOENT" || /not found|not recognized|no module named|cannot find|spawn .* ENOENT/i.test(message);
    return result({ format, runtime: definition.runtime, artifactPath: input.artifactPath, status: unavailable ? "UNAVAILABLE" : "FAILED", versionOutput: null, durationMs: Date.now() - started, reasons: [loaderReason(error)], checkedAt });
  }
}

function result(input: Omit<EpochFormatRuntimeValidation, "version" | "evidenceSha256">): EpochFormatRuntimeValidation {
  const unsigned = { version: "epoch_format_runtime_validation.v1" as const, ...input };
  return { ...unsigned, evidenceSha256: hash(unsigned) };
}

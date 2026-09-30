import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DhyraTMShellExecMode = "exec" | "prompt";

type DhyraTMShellExecRequest = {
  mode?: DhyraTMShellExecMode;
  value?: string;
};

function resolveProjectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
}

function runBridge(mode: DhyraTMShellExecMode, value: string, cwd: string) {
  return new Promise<{
    ok: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
  }>((resolve) => {
    const bridgePath = path.join(cwd, "tools", "dhyratm-shell", "session-bridge.mjs");
    const child = spawn(process.execPath, [bridgePath, mode, value], {
      cwd,
      env: {
        ...process.env,
        MEMORYOSTM_SHELL_PROJECT_ROOT: cwd,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (exitCode) => {
      resolve({
        ok: exitCode === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
      });
    });
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DhyraTMShellExecRequest | null;
  const mode = body?.mode === "prompt" ? "prompt" : "exec";
  const value = typeof body?.value === "string" ? body.value.trim() : "";

  if (!value) {
    return NextResponse.json(
      { ok: false, error: "A shell command or prompt is required." },
      { status: 400 },
    );
  }

  const cwd = resolveProjectRoot();
  const result = await runBridge(mode, value, cwd);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

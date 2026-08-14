export type MemoryOSTMShellExecMode = "exec" | "prompt";

export type MemoryOSTMShellExecResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
};

export async function executeMemoryOSTMShell(
  mode: MemoryOSTMShellExecMode,
  value: string,
): Promise<MemoryOSTMShellExecResult> {
  const response = await fetch("/api/runtime/memoryostm-shell-exec", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ mode, value }),
  });

  const payload = (await response.json().catch(() => null)) as MemoryOSTMShellExecResult | null;
  if (!payload) {
    throw new Error(`Shell execution failed (${response.status})`);
  }
  return payload;
}

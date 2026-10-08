export type HorosTMShellExecMode = "exec" | "prompt";

export type HorosTMShellExecResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
};

export async function executeHorosTMShell(
  mode: HorosTMShellExecMode,
  value: string,
): Promise<HorosTMShellExecResult> {
  const response = await fetch("/api/runtime/horostm-shell-exec", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ mode, value }),
  });

  const payload = (await response.json().catch(() => null)) as HorosTMShellExecResult | null;
  if (!payload) {
    throw new Error(`Shell execution failed (${response.status})`);
  }
  return payload;
}

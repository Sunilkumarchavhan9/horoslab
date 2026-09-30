export type DhyraTMShellExecMode = "exec" | "prompt";

export type DhyraTMShellExecResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
};

export async function executeDhyraTMShell(
  mode: DhyraTMShellExecMode,
  value: string,
): Promise<DhyraTMShellExecResult> {
  const response = await fetch("/api/runtime/dhyratm-shell-exec", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ mode, value }),
  });

  const payload = (await response.json().catch(() => null)) as DhyraTMShellExecResult | null;
  if (!payload) {
    throw new Error(`Shell execution failed (${response.status})`);
  }
  return payload;
}

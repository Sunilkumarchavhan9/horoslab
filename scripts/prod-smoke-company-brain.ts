import "dotenv/config";

type CheckResult = {
  name: string;
  pass: boolean;
  detail: string;
};

function getBaseUrl(): string {
  const origin = process.env.MEMORYOS_API_ORIGIN || process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3001";
  return origin.replace(/\/+$/, "");
}

function getAuthToken(): string {
  const token = process.env.SMOKE_AUTH_TOKEN || process.env.MEMORYOS_API_TOKEN || "";
  if (!token) {
    throw new Error("Missing auth token. Set SMOKE_AUTH_TOKEN in env for smoke test.");
  }
  return token;
}

async function check(
  name: string,
  fn: () => Promise<{ pass: boolean; detail: string }>,
): Promise<CheckResult> {
  try {
    const result = await fn();
    return { name, ...result };
  } catch (error) {
    return {
      name,
      pass: false,
      detail: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

async function fetchJson(url: string, token?: string): Promise<{ status: number; json: unknown }> {
  const response = await fetch(url, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        }
      : { Accept: "application/json" },
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

async function main(): Promise<void> {
  const baseUrl = getBaseUrl();
  const token = getAuthToken();
  const checks: CheckResult[] = [];

  checks.push(
    await check("health", async () => {
      const { status, json } = await fetchJson(`${baseUrl}/api/health`);
      if (status !== 200) return { pass: false, detail: `status=${status}` };
      const payload = json as { status?: string; companyBrain?: { queueBackendMode?: string } } | null;
      const ok = payload?.status === "ok";
      return {
        pass: ok,
        detail: ok
          ? `status=ok queueBackend=${payload?.companyBrain?.queueBackendMode ?? "unknown"}`
          : "health payload invalid",
      };
    }),
  );

  checks.push(
    await check("company_brain_status", async () => {
      const { status, json } = await fetchJson(`${baseUrl}/api/company-brain/status`, token);
      if (status !== 200) return { pass: false, detail: `status=${status}` };
      const payload = json as {
        scheduler?: { enabled?: boolean };
        graph?: { nodes?: number };
        skills?: { count?: number };
      } | null;
      const schedulerOn = Boolean(payload?.scheduler?.enabled);
      const graphNodes = Number(payload?.graph?.nodes ?? 0);
      const skills = Number(payload?.skills?.count ?? 0);
      return {
        pass: schedulerOn && graphNodes >= 0 && skills >= 0,
        detail: `scheduler=${schedulerOn} graphNodes=${graphNodes} skills=${skills}`,
      };
    }),
  );

  checks.push(
    await check("connectors_health", async () => {
      const { status, json } = await fetchJson(`${baseUrl}/api/connector/health`, token);
      if (status !== 200) return { pass: false, detail: `status=${status}` };
      const payload = json as { data?: { diagnostics?: unknown[]; backendAvailable?: boolean } } | null;
      const count = Array.isArray(payload?.data?.diagnostics) ? payload!.data!.diagnostics!.length : 0;
      return {
        pass: payload?.data?.backendAvailable !== false,
        detail: `diagnostics=${count} backendAvailable=${String(payload?.data?.backendAvailable ?? true)}`,
      };
    }),
  );

  checks.push(
    await check("governance_policy", async () => {
      const { status } = await fetchJson(`${baseUrl}/api/company-brain/governance`, token);
      return { pass: status === 200, detail: `status=${status}` };
    }),
  );

  checks.push(
    await check("compliance_policy", async () => {
      const { status } = await fetchJson(`${baseUrl}/api/company-brain/compliance`, token);
      return { pass: status === 200, detail: `status=${status}` };
    }),
  );

  checks.push(
    await check("audit_replay_approvals", async () => {
      const { status } = await fetchJson(`${baseUrl}/api/company-brain/audit/replay/approvals`, token);
      return { pass: status === 200, detail: `status=${status}` };
    }),
  );

  let passed = 0;
  for (const c of checks) {
    if (c.pass) passed += 1;
    console.log(`${c.pass ? "PASS" : "FAIL"} ${c.name} :: ${c.detail}`);
  }
  const score = (passed / checks.length) * 100;
  console.log(`\nSmoke score: ${passed}/${checks.length} (${score.toFixed(1)}%)`);

  if (passed !== checks.length) {
    process.exit(1);
  }
}

void main();

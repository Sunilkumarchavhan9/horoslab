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

async function postJson(
  url: string,
  token: string,
  body: Record<string, unknown>,
): Promise<{ status: number; json: unknown }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

  checks.push(
    await check("action_e2e_validation", async () => {
      const requestRes = await postJson(`${baseUrl}/api/company-brain/actions/request`, token, {
        name: "internal_noop_validation",
        payload: { source: "prod-smoke", note: "e2e validation action" },
      });
      if (requestRes.status !== 200) {
        return { pass: false, detail: `request status=${requestRes.status}` };
      }
      const requestJson = requestRes.json as { action?: { id?: string } };
      const actionId = requestJson.action?.id;
      if (!actionId) return { pass: false, detail: "missing actionId" };

      const approveRes = await postJson(`${baseUrl}/api/company-brain/actions/review`, token, {
        actionId,
        decision: "approve",
      });
      if (approveRes.status !== 200) {
        return { pass: false, detail: `approve status=${approveRes.status}` };
      }

      const execRes = await postJson(`${baseUrl}/api/company-brain/actions/execute`, token, { actionId });
      if (execRes.status !== 200) {
        return { pass: false, detail: `execute status=${execRes.status}` };
      }

      const evidenceRes = await fetchJson(`${baseUrl}/api/company-brain/validation/evidence`, token);
      if (evidenceRes.status !== 200) {
        return { pass: false, detail: `evidence status=${evidenceRes.status}` };
      }
      const evidence = evidenceRes.json as {
        auditSummary?: { byType?: Record<string, number> };
        actionSummary?: { executed?: number; failed?: number };
      } | null;
      const executed = Number(evidence?.actionSummary?.executed ?? 0);
      const failed = Number(evidence?.actionSummary?.failed ?? 0);
      const executedAudit = Number(evidence?.auditSummary?.byType?.["action.executed"] ?? 0);
      return {
        pass: executed > 0 || executedAudit > 0,
        detail: `executed=${executed} failed=${failed} action.executed=${executedAudit}`,
      };
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

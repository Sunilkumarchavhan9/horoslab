import "dotenv/config";
import { getOperationalArtifact, saveOperationalArtifact } from "../lib/operational/artifactStore";

type Check = {
  name: string;
  ok: boolean;
  severity: "blocker" | "warning";
  detail: string;
};

type JsonRecord = Record<string, unknown>;

const REPORT_FILES = [
  "phase1-e2e-gate",
  "phase1-github-source-gate",
  "phase1-slack-source-gate",
  "phase1-docs-source-gate",
  "phase1-engineering-sources-gate",
] as const;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function has(name: string): boolean {
  return Boolean(env(name));
}

function push(checks: Check[], name: string, ok: boolean, detail: string, severity: "blocker" | "warning" = "blocker"): void {
  checks.push({ name, ok, detail, severity });
}

function normalizePayload<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "ok" in payload &&
    (payload as JsonRecord).ok === true &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

async function requestJson<T>(input: {
  baseUrl: string;
  route: string;
  token?: string;
  orgId?: string;
  method?: "GET" | "POST";
  body?: unknown;
}): Promise<T> {
  const response = await fetch(`${input.baseUrl}${input.route}`, {
    method: input.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
      ...(input.orgId ? { "x-memoryos-org-id": input.orgId } : {}),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(`${input.route} failed: HTTP ${response.status}`);
  }
  return normalizePayload<T>(payload);
}

function isHttpsUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  } catch {
    return false;
  }
}

function secretLongEnough(...names: string[]): boolean {
  return names.some((name) => (env(name)?.length ?? 0) >= 32);
}

async function reportSummary(reportName: string): Promise<{ ok: boolean; detail: string }> {
  const artifact = await getOperationalArtifact<{
    generatedAt?: string;
    summary?: { passed?: number; failed?: number; total?: number };
  }>({
    kind: "phase_gate",
    name: reportName,
  });
  if (!artifact) {
    return { ok: false, detail: `missing operational artifact phase_gate/${reportName}` };
  }
  const failed = artifact.data.summary?.failed;
  const passed = artifact.data.summary?.passed;
  const total = artifact.data.summary?.total;
  const generatedAt = artifact.data.generatedAt ?? artifact.updatedAt;
  return {
    ok: failed === 0 && typeof passed === "number" && typeof total === "number" && passed === total,
    detail: `generatedAt=${generatedAt}, passed=${passed ?? "?"}, failed=${failed ?? "?"}, total=${total ?? "?"}`,
  };
}

async function runLiveChecks(checks: Check[], input: {
  baseUrl?: string;
  token?: string;
  orgId?: string;
}): Promise<void> {
  if (!input.baseUrl) {
    push(checks, "Live API base URL", false, "Set PHASE1_PROD_BASE_URL or PHASE1_GATE_BASE_URL to run live production checks.", "warning");
    return;
  }

  try {
    const health = await requestJson<{ status?: string }>({
      baseUrl: input.baseUrl,
      route: "/api/health",
    });
    push(checks, "Live health endpoint", health.status === "ok" || health.status === "healthy", `status=${health.status ?? "unknown"}`);
  } catch (error) {
    push(checks, "Live health endpoint", false, error instanceof Error ? error.message : "health check failed");
  }

  if (!input.token) {
    push(checks, "Live authenticated checks", false, "Set PHASE1_GATE_TOKEN or MEMORYOS_API_TOKEN.", "warning");
    return;
  }

  try {
    const connectorHealth = await requestJson<{
      backendAvailable?: boolean;
      diagnostics?: unknown[];
      freshness?: unknown[];
    }>({
      baseUrl: input.baseUrl,
      token: input.token,
      orgId: input.orgId,
      route: "/api/connector/health",
    });
    push(
      checks,
      "Live connector diagnostics",
      connectorHealth.backendAvailable !== false && Array.isArray(connectorHealth.diagnostics),
      `backendAvailable=${connectorHealth.backendAvailable !== false}, diagnostics=${connectorHealth.diagnostics?.length ?? 0}, freshness=${connectorHealth.freshness?.length ?? 0}`,
    );
  } catch (error) {
    push(checks, "Live connector diagnostics", false, error instanceof Error ? error.message : "connector diagnostics failed");
  }

  const feedbackOrg = input.orgId ?? `phase1-prod-gate-${Date.now()}`;
  try {
    const createFeedback = await requestJson<{ feedback?: { id?: string } }>({
      baseUrl: input.baseUrl,
      token: input.token,
      orgId: feedbackOrg,
      route: "/api/memory/continuity-feedback",
      method: "POST",
      body: {
        kind: "resume",
        rating: 5,
        useful: true,
        project: "MemoryOS",
        requestId: `phase1-prod-gate-${Date.now()}`,
        shouldRemember: ["Production gate verified continuity feedback capture."],
      },
    });
    const feedbackId = createFeedback.feedback?.id;
    const listFeedback = await requestJson<{ feedback?: Array<{ id?: string }>; summary?: { count?: number } }>({
      baseUrl: input.baseUrl,
      token: input.token,
      orgId: feedbackOrg,
      route: "/api/memory/continuity-feedback?limit=20",
    });
    push(
      checks,
      "Live continuity feedback capture",
      Boolean(feedbackId && listFeedback.feedback?.some((item) => item.id === feedbackId)),
      `feedbackId=${feedbackId ?? "missing"}, summaryCount=${listFeedback.summary?.count ?? 0}`,
    );
  } catch (error) {
    push(checks, "Live continuity feedback capture", false, error instanceof Error ? error.message : "feedback check failed");
  }

  try {
    const alpha = `phase1-isolation-alpha-${Date.now()}`;
    const beta = `phase1-isolation-beta-${Date.now()}`;
    const createFeedback = await requestJson<{ feedback?: { id?: string } }>({
      baseUrl: input.baseUrl,
      token: input.token,
      orgId: alpha,
      route: "/api/memory/continuity-feedback",
      method: "POST",
      body: {
        kind: "handoff",
        rating: 4,
        useful: true,
        project: "MemoryOS",
        requestId: `phase1-isolation-${Date.now()}`,
      },
    });
    const feedbackId = createFeedback.feedback?.id;
    const betaList = await requestJson<{ feedback?: Array<{ id?: string }> }>({
      baseUrl: input.baseUrl,
      token: input.token,
      orgId: beta,
      route: "/api/memory/continuity-feedback?limit=100",
    });
    push(
      checks,
      "Live org isolation smoke",
      Boolean(feedbackId) && !betaList.feedback?.some((item) => item.id === feedbackId),
      `alphaFeedbackId=${feedbackId ?? "missing"}, betaVisible=${betaList.feedback?.some((item) => item.id === feedbackId) === true}`,
    );
  } catch (error) {
    push(checks, "Live org isolation smoke", false, error instanceof Error ? error.message : "org isolation smoke failed");
  }
}

async function main(): Promise<void> {
  const profile = env("PHASE1_PRODUCTION_PROFILE") ?? env("PHASE1_GATE_PROFILE") ?? "production";
  const strict = profile === "production" || env("PHASE1_PRODUCTION_STRICT") === "1";
  const checks: Check[] = [];

  push(checks, "JWT signing secret", secretLongEnough("MEMORYOS_JWT_SECRET", "JWT_SECRET"), "MEMORYOS_JWT_SECRET or JWT_SECRET must be at least 32 chars.");
  push(checks, "OAuth state secret", secretLongEnough("CONNECTOR_OAUTH_STATE_SECRET"), "CONNECTOR_OAUTH_STATE_SECRET must be at least 32 chars.");
  push(checks, "Clerk frontend key configured", has("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"), "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY present.");
  push(checks, "Clerk backend key configured", has("CLERK_SECRET_KEY"), "CLERK_SECRET_KEY present.");
  push(checks, "GitHub OAuth configured", has("GITHUB_CLIENT_ID") && has("GITHUB_CLIENT_SECRET"), "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET present.");
  push(checks, "Slack OAuth configured", has("SLACK_CLIENT_ID") && has("SLACK_CLIENT_SECRET") && has("SLACK_SIGNING_SECRET"), "Slack client id, client secret, and signing secret present.");

  const callbackUrl = env("NEXT_PUBLIC_CONNECTOR_CALLBACK_URL");
  push(checks, "OAuth callback URL is HTTPS", isHttpsUrl(callbackUrl), "NEXT_PUBLIC_CONNECTOR_CALLBACK_URL must be HTTPS for production.", strict ? "blocker" : "warning");
  push(checks, "OAuth callback URL is not local", !isLocalUrl(callbackUrl), "NEXT_PUBLIC_CONNECTOR_CALLBACK_URL must not point at localhost in production.", strict ? "blocker" : "warning");

  push(checks, "Production runtime store", env("MEMORY_STORE_BACKEND") === "postgres", "MEMORY_STORE_BACKEND=postgres required for production.", strict ? "blocker" : "warning");
  push(checks, "Database URL configured", has("DATABASE_URL"), "DATABASE_URL present.");
  push(checks, "Metrics endpoint protected", has("METRICS_TOKEN"), "METRICS_TOKEN present so /api/metrics is not public.", strict ? "blocker" : "warning");
  push(checks, "Production CORS origins configured", has("MEMORYOS_CORS_ORIGINS") || has("NEXT_PUBLIC_APP_URL") || has("NEXT_PUBLIC_MEMORYOS_APP_URL"), "Set MEMORYOS_CORS_ORIGINS or app URL env.", strict ? "blocker" : "warning");
  push(checks, "Backend observability configured", has("SENTRY_DSN") && has("SENTRY_ENVIRONMENT") && has("DD_ENV") && has("DD_SERVICE") && has("DD_TRACE_ENABLED"), "Sentry + Datadog backend env present.", strict ? "blocker" : "warning");
  push(checks, "Frontend observability configured", has("NEXT_PUBLIC_SENTRY_DSN") || (has("NEXT_PUBLIC_DD_APPLICATION_ID") && has("NEXT_PUBLIC_DD_CLIENT_TOKEN")), "Frontend Sentry or Datadog RUM configured.", "warning");

  for (const report of REPORT_FILES) {
    const summary = await reportSummary(report);
    push(checks, `Gate report ${report}`, summary.ok, summary.detail, report === "phase1-e2e-gate" ? "blocker" : "warning");
  }

  await runLiveChecks(checks, {
    baseUrl: env("PHASE1_PROD_BASE_URL") ?? env("PHASE1_GATE_BASE_URL"),
    token: env("PHASE1_GATE_TOKEN") ?? env("MEMORYOS_API_TOKEN") ?? env("MEMORYOS_TOKEN"),
    orgId: env("PHASE1_GATE_ORG_ID") ?? env("MEMORYOS_ORG_ID"),
  });

  const blockers = checks.filter((check) => check.severity === "blocker" && !check.ok);
  const warnings = checks.filter((check) => check.severity === "warning" && !check.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    profile,
    strict,
    checks,
    summary: {
      passed: checks.filter((check) => check.ok).length,
      failed: checks.filter((check) => !check.ok).length,
      blockers: blockers.length,
      warnings: warnings.length,
      total: checks.length,
    },
  };

  await saveOperationalArtifact({
    kind: "phase_gate",
    name: "phase1-production-readiness-gate",
    status: blockers.length > 0 ? "fail" : "pass",
    data: report,
  });

  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 1 production readiness report saved to operational_artifacts:phase_gate/phase1-production-readiness-gate");

  if (blockers.length > 0) {
    throw new Error(`Phase 1 production readiness failed: ${blockers.length} blocker(s), ${warnings.length} warning(s).`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[phase1:production-readiness:gate] ${message}`);
  process.exit(1);
});

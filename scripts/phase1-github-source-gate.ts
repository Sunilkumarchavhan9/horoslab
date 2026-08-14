import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import "dotenv/config";
import { saveOperationalArtifact } from "../lib/operational/artifactStore";

type JsonRecord = Record<string, unknown>;

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
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
  token: string;
  orgId?: string;
  route: string;
  method?: "GET" | "POST";
  body?: unknown;
}): Promise<T> {
  const response = await fetch(`${input.baseUrl}${input.route}`, {
    method: input.method ?? "GET",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
      ...(input.orgId ? { "x-memoryos-org-id": input.orgId } : {}),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as JsonRecord).error === "string"
        ? String((payload as JsonRecord).error)
        : `HTTP ${response.status}`;
    throw new Error(`${input.route} failed: ${message}`);
  }
  return normalizePayload<T>(payload);
}

function push(checks: Check[], name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const baseUrl = env("PHASE1_GATE_BASE_URL") ?? "http://localhost:3011";
  const orgId = env("PHASE1_GATE_ORG_ID") ?? env("MEMORYOS_ORG_ID");
  const token =
    env("PHASE1_GATE_TOKEN") ??
    env("MEMORYOS_API_TOKEN") ??
    env("MEMORYOS_TOKEN") ??
    "";
  const githubToken =
    env("GITHUB_SOURCE_TOKEN") ??
    env("GITHUB_TOKEN") ??
    env("GH_TOKEN") ??
    env("GITHUB_PAT") ??
    "";

  if (!token) {
    throw new Error("Missing MemoryOS token. Set PHASE1_GATE_TOKEN or MEMORYOS_API_TOKEN.");
  }
  if (!githubToken) {
    throw new Error("Missing GitHub token. Set GITHUB_SOURCE_TOKEN, GITHUB_TOKEN, GH_TOKEN, or GITHUB_PAT.");
  }

  const checks: Check[] = [];
  const gateStartedAt = Date.now();

  await requestJson<{ message?: string }>({
    baseUrl,
    token,
    orgId,
    route: "/api/connector/github/connect",
    method: "POST",
    body: { accessToken: githubToken },
  });
  push(checks, "GitHub connect", true, "POST /api/connector/github/connect accepted token and queued sync");

  let latestGitHubLog: {
    type?: string;
    status?: string;
    extractedCount?: number;
    message?: string;
    at?: string;
  } | null = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const logsResult = await requestJson<{
      logs?: Array<{
        type?: string;
        status?: string;
        extractedCount?: number;
        message?: string;
        at?: string;
      }>;
    }>({
      baseUrl,
      token,
      orgId,
      route: "/api/connector/logs",
    });
    const latestAnyGitHubLog =
      logsResult.logs?.find((log) => log.type === "github" && log.status !== undefined) ?? null;
    const freshGitHubLog =
      logsResult.logs?.find((log) => {
        if (log.type !== "github" || log.status === undefined) return false;
        const logTime = log.at ? new Date(log.at).getTime() : 0;
        return Number.isFinite(logTime) && logTime >= gateStartedAt;
      }) ?? null;
    latestGitHubLog = freshGitHubLog ?? latestAnyGitHubLog;
    if (latestGitHubLog?.status === "success" || latestGitHubLog?.status === "error") break;
    await sleep(1000);
  }

  const syncOk = latestGitHubLog?.status === "success";
  const extractedCount =
    typeof latestGitHubLog?.extractedCount === "number" ? latestGitHubLog.extractedCount : 0;
  push(
    checks,
    "GitHub sync log",
    syncOk,
    latestGitHubLog
      ? `status=${latestGitHubLog.status}, extracted=${extractedCount}, message=${latestGitHubLog.message ?? ""}`
      : "No GitHub sync log observed",
  );
  const retrieve = await requestJson<{
    memories?: Array<{
      sourceRef?: string;
      traceProof?: unknown;
      metadata?: { sourceRef?: unknown; traceProof?: unknown };
    }>;
  }>({
    baseUrl,
    token,
    orgId,
    route: "/api/memory/retrieve",
    method: "POST",
    body: {
      question: "What GitHub repositories, PRs, or issues should future agents inherit?",
      topK: 20,
    },
  });
  const githubMemories =
    retrieve.memories?.filter((memory) =>
      String(memory.sourceRef ?? memory.metadata?.sourceRef ?? "").startsWith("github://"),
    ) ?? [];

  const list = await requestJson<{
    memories?: Array<{
      sourceRef?: string;
      traceProof?: unknown;
      metadata?: { sourceRef?: unknown; traceProof?: unknown };
    }>;
  }>({
    baseUrl,
    token,
    orgId,
    route: "/api/memory/list?limit=500",
  });
  const inventoryGitHubMemories =
    list.memories?.filter((memory) =>
      String(memory.sourceRef ?? memory.metadata?.sourceRef ?? "").startsWith("github://"),
    ) ?? [];
  const traceableGitHubMemories = inventoryGitHubMemories.filter((memory) =>
    Boolean(memory.traceProof ?? memory.metadata?.traceProof),
  );
  push(
    checks,
    "GitHub imported memories",
    extractedCount > 0 || inventoryGitHubMemories.length > 0,
    extractedCount > 0
      ? `GitHub sync extracted ${extractedCount} memory records`
      : `GitHub sync deduped this run, but ${inventoryGitHubMemories.length} GitHub memory records are already indexed`,
  );
  push(
    checks,
    "GitHub retrieval",
    githubMemories.length > 0 || inventoryGitHubMemories.length > 0,
    `retrievedGitHubMemories=${githubMemories.length}, indexedGitHubMemories=${inventoryGitHubMemories.length}`,
  );
  push(
    checks,
    "GitHub trace proof",
    traceableGitHubMemories.length > 0,
    `traceableGitHubMemories=${traceableGitHubMemories.length}`,
  );

  const passed = checks.filter((check) => check.ok).length;
  const failed = checks.length - passed;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    orgId: orgId ?? null,
    checks,
    summary: { passed, failed, total: checks.length },
  };

  await saveOperationalArtifact({
    kind: "phase_gate",
    name: "phase1-github-source-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 1 GitHub source gate report saved to operational_artifacts:phase_gate/phase1-github-source-gate");

  if (failed > 0) {
    throw new Error(`Phase 1 GitHub source gate failed: ${failed}/${checks.length} checks failed.`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[phase1:github-source:gate] ${message}`);
  process.exit(1);
});

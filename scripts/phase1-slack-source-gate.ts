import { mkdirSync, writeFileSync } from "fs";
import path from "path";
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

function isSlackSourceRef(value: unknown): boolean {
  const sourceRef = String(value ?? "");
  return sourceRef.startsWith("slack://") || sourceRef.includes("slack:message:");
}

async function main(): Promise<void> {
  const baseUrl = env("PHASE1_GATE_BASE_URL") ?? "http://localhost:3011";
  const orgId = env("PHASE1_GATE_ORG_ID") ?? env("MEMORYOS_ORG_ID");
  const token =
    env("PHASE1_GATE_TOKEN") ??
    env("MEMORYOS_API_TOKEN") ??
    env("MEMORYOS_TOKEN") ??
    "";

  if (!token) {
    throw new Error("Missing MemoryOS token. Set PHASE1_GATE_TOKEN or MEMORYOS_API_TOKEN.");
  }

  const checks: Check[] = [];

  const connectorsResult = await requestJson<{
    connectors?: Array<{ type?: string; status?: string; recordCount?: number; lastSyncAt?: string }>;
  }>({
    baseUrl,
    token,
    orgId,
    route: "/api/connector",
  });
  const slackConnector = connectorsResult.connectors?.find((connector) => connector.type === "slack");
  push(
    checks,
    "Slack connected",
    slackConnector?.status === "connected",
    slackConnector
      ? `status=${slackConnector.status}, records=${slackConnector.recordCount ?? 0}, lastSync=${slackConnector.lastSyncAt ?? "none"}`
      : "Slack connector is missing. Connect Slack with OAuth before running this gate.",
  );

  await requestJson<{ message?: string }>({
    baseUrl,
    token,
    orgId,
    route: "/api/connector/slack/sync",
    method: "POST",
  });
  push(checks, "Slack sync queued", true, "POST /api/connector/slack/sync accepted");

  let latestSlackLog: {
    type?: string;
    status?: string;
    extractedCount?: number;
    message?: string;
  } | null = null;

  for (let attempt = 0; attempt < 45; attempt += 1) {
    const logsResult = await requestJson<{
      logs?: Array<{
        type?: string;
        status?: string;
        extractedCount?: number;
        message?: string;
      }>;
    }>({
      baseUrl,
      token,
      orgId,
      route: "/api/connector/logs",
    });
    latestSlackLog =
      logsResult.logs?.find((log) => log.type === "slack" && log.status !== undefined) ?? null;
    if (latestSlackLog?.status === "success" || latestSlackLog?.status === "error") break;
    await sleep(2000);
  }

  const syncOk = latestSlackLog?.status === "success";
  const extractedCount =
    typeof latestSlackLog?.extractedCount === "number" ? latestSlackLog.extractedCount : 0;
  push(
    checks,
    "Slack sync log",
    syncOk,
    latestSlackLog
      ? `status=${latestSlackLog.status}, extracted=${extractedCount}, message=${latestSlackLog.message ?? ""}`
      : "No Slack sync log observed",
  );

  type GateMemory = {
    sourceRef?: string;
    traceProof?: { sourceType?: string; sourceRef?: string } | null;
    metadata?: { sourceRef?: unknown; traceProof?: { sourceType?: string; sourceRef?: string } | null };
  };

  let retrieveError: string | null = null;
  let retrieveMemories: GateMemory[] = [];
  try {
    const retrieve = await requestJson<{ memories?: GateMemory[] }>({
      baseUrl,
      token,
      orgId,
      route: "/api/memory/retrieve",
      method: "POST",
      body: {
        question: "What Slack incidents, decisions, blockers, handoffs, or runbooks should future agents inherit?",
        topK: 20,
      },
    });
    retrieveMemories = retrieve.memories ?? [];
  } catch (error) {
    retrieveError = error instanceof Error ? error.message : String(error);
  }

  const list = await requestJson<{ memories?: GateMemory[] }>({
    baseUrl,
    token,
    orgId,
    route: "/api/memory/list?limit=500",
  });
  const inventoryMemories = list.memories ?? [];

  const slackMemories =
    inventoryMemories.filter((memory) =>
      isSlackSourceRef(memory.sourceRef ?? memory.metadata?.sourceRef ?? memory.traceProof?.sourceRef ?? memory.metadata?.traceProof?.sourceRef),
    );
  const retrievedSlackMemories =
    retrieveMemories.filter((memory) =>
      isSlackSourceRef(memory.sourceRef ?? memory.metadata?.sourceRef ?? memory.traceProof?.sourceRef ?? memory.metadata?.traceProof?.sourceRef),
    );
  const traceableSlackMemories = slackMemories.filter((memory) => {
    const proof = memory.traceProof ?? memory.metadata?.traceProof;
    return proof?.sourceType === "slack" || isSlackSourceRef(proof?.sourceRef);
  });
  const meteredRetrievalBlocked =
    retrieveError?.includes("HTTP 402") === true || retrieveError?.includes("status=402") === true;
  const retrievalOk =
    (!retrieveError && retrievedSlackMemories.length > 0) ||
    (meteredRetrievalBlocked && slackMemories.length > 0 && traceableSlackMemories.length > 0);

  push(
    checks,
    "Slack imported memories",
    extractedCount > 0 || slackMemories.length > 0,
    extractedCount > 0
      ? `Slack sync extracted ${extractedCount} memory records`
      : `Slack sync deduped this run, but ${slackMemories.length} Slack memory records are retrievable`,
  );
  push(
    checks,
    "Slack retrieval",
    retrievalOk,
    meteredRetrievalBlocked && slackMemories.length > 0 && traceableSlackMemories.length > 0
      ? `metered retrieval blocked (${retrieveError}); source inventory still has ${slackMemories.length} Slack memories with ${traceableSlackMemories.length} trace proofs`
      : retrieveError
        ? `retrievalBlocked=${retrieveError}`
        : `retrievedSlackMemories=${retrievedSlackMemories.length}`,
  );
  push(
    checks,
    "Slack trace proof",
    traceableSlackMemories.length > 0,
    `traceableSlackMemories=${traceableSlackMemories.length}`,
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
    name: "phase1-slack-source-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 1 Slack source gate report saved to operational_artifacts:phase_gate/phase1-slack-source-gate");

  if (failed > 0) {
    throw new Error(`Phase 1 Slack source gate failed: ${failed}/${checks.length} checks failed.`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[phase1:slack-source:gate] ${message}`);
  process.exit(1);
});

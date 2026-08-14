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
  route: string;
  method?: "GET" | "POST";
  body?: unknown;
}): Promise<T> {
  const response = await fetch(`${input.baseUrl}${input.route}`, {
    method: input.method ?? "GET",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
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
  const token =
    env("PHASE1_GATE_TOKEN") ??
    env("MEMORYOS_API_TOKEN") ??
    env("MEMORYOS_TOKEN") ??
    "";

  if (!token) {
    throw new Error("Missing MemoryOS token. Set PHASE1_GATE_TOKEN or MEMORYOS_API_TOKEN.");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const docsRoot = path.join(process.cwd(), "data", "eval", "phase1-doc-source", stamp);
  const docPath = path.join(docsRoot, "phase1-engineering-continuity.md");
  mkdirSync(docsRoot, { recursive: true });
  writeFileSync(
    docPath,
    [
      "# Phase 1 Engineering Continuity",
      "",
      `Trace marker: phase1-docs-source-${stamp}`,
      "",
      "MemoryOS imports company docs so future agents inherit knowledge, context, memory, risky files, required tests, and trace proof before action.",
      "This document proves docs source import for the Phase 1 gate.",
    ].join("\n"),
    "utf8",
  );

  const checks: Check[] = [];

  await requestJson<{ message?: string; rootPath?: string }>({
    baseUrl,
    token,
    route: "/api/connector/local_files/connect",
    method: "POST",
    body: { rootPath: docsRoot },
  });
  push(checks, "Docs connect", true, "POST /api/connector/local_files/connect accepted docs root");

  await requestJson<{ message?: string }>({
    baseUrl,
    token,
    route: "/api/connector/local_files/sync",
    method: "POST",
  });
  push(checks, "Docs sync queued", true, "POST /api/connector/local_files/sync queued import");

  let latestDocsLog: {
    type?: string;
    status?: string;
    extractedCount?: number;
    message?: string;
  } | null = null;

  for (let attempt = 0; attempt < 30; attempt += 1) {
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
      route: "/api/connector/logs",
    });
    latestDocsLog =
      logsResult.logs?.find((log) => log.type === "local_files" && log.status !== undefined) ?? null;
    if (latestDocsLog?.status === "success" || latestDocsLog?.status === "error") break;
    await sleep(1000);
  }

  const syncOk = latestDocsLog?.status === "success";
  const extractedCount =
    typeof latestDocsLog?.extractedCount === "number" ? latestDocsLog.extractedCount : 0;
  push(
    checks,
    "Docs sync log",
    syncOk,
    latestDocsLog
      ? `status=${latestDocsLog.status}, extracted=${extractedCount}, message=${latestDocsLog.message ?? ""}`
      : "No local_files sync log observed",
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
    route: "/api/memory/retrieve",
    method: "POST",
    body: {
      question: `What docs explain phase1-docs-source-${stamp} for future agents?`,
      topK: 10,
    },
  });

  const docsMemories =
    retrieve.memories?.filter((memory) =>
      String(memory.sourceRef ?? memory.metadata?.sourceRef ?? "").startsWith("docs://"),
    ) ?? [];
  const traceableDocsMemories = docsMemories.filter((memory) =>
    Boolean(memory.traceProof ?? memory.metadata?.traceProof),
  );

  push(
    checks,
    "Docs imported memories",
    extractedCount > 0 || docsMemories.length > 0,
    extractedCount > 0
      ? `Docs sync extracted ${extractedCount} memory records`
      : `Docs sync deduped this run, but ${docsMemories.length} docs memories are retrievable`,
  );
  push(checks, "Docs retrieval", docsMemories.length > 0, `retrievedDocsMemories=${docsMemories.length}`);
  push(
    checks,
    "Docs trace proof",
    traceableDocsMemories.length > 0,
    `traceableDocsMemories=${traceableDocsMemories.length}`,
  );

  const passed = checks.filter((check) => check.ok).length;
  const failed = checks.length - passed;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    docsRoot,
    checks,
    summary: { passed, failed, total: checks.length },
  };

  await saveOperationalArtifact({
    kind: "phase_gate",
    name: "phase1-docs-source-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 1 docs source gate report saved to operational_artifacts:phase_gate/phase1-docs-source-gate");

  if (failed > 0) {
    throw new Error(`Phase 1 docs source gate failed: ${failed}/${checks.length} checks failed.`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[phase1:docs-source:gate] ${message}`);
  process.exit(1);
});

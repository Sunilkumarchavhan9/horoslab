import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { saveOperationalArtifact } from "../lib/operational/artifactStore";

type JsonRecord = Record<string, unknown>;

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

type SourceConfig = {
  type:
    | "cursor_chats"
    | "vs_code_chats"
    | "codex_chats"
    | "chatgpt_chats"
    | "windsurf_chats"
    | "devin_chats"
    | "ci_cd_logs"
    | "deployment_errors";
  rootDir: string;
  fileName: string;
  sourcePrefix: string;
  marker: string;
  content: string;
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

function sourceRefMatches(value: unknown, prefix: string): boolean {
  return String(value ?? "").startsWith(prefix);
}

async function waitForLatestLog(input: {
  baseUrl: string;
  token: string;
  orgId?: string;
  type: string;
}): Promise<{ type?: string; status?: string; extractedCount?: number; message?: string } | null> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const logsResult = await requestJson<{
      logs?: Array<{ type?: string; status?: string; extractedCount?: number; message?: string }>;
    }>({
      baseUrl: input.baseUrl,
      token: input.token,
      orgId: input.orgId,
      route: "/api/connector/logs",
    });
    const latest = logsResult.logs?.find((log) => log.type === input.type && log.status !== undefined) ?? null;
    if (latest?.status === "success" || latest?.status === "error") return latest;
    await sleep(1000);
  }
  return null;
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

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const evalRoot = path.join(process.cwd(), "data", "eval", "phase1-engineering-sources", stamp);
  const sources: SourceConfig[] = [
    {
      type: "cursor_chats",
      rootDir: path.join(evalRoot, "cursor-chats"),
      fileName: "cursor-session.md",
      sourcePrefix: "cursor-chat://",
      marker: `phase1-cursor-chat-${stamp}`,
      content:
        "Cursor session handoff: auth middleware changed. Future agents should run phase1:e2e:gate before shipping.",
    },
    {
      type: "vs_code_chats",
      rootDir: path.join(evalRoot, "vs-code-chats"),
      fileName: "vscode-chat.md",
      sourcePrefix: "vs-code-chat://",
      marker: `phase1-vs-code-chat-${stamp}`,
      content:
        "VS Code chat note: connector proxy callback was fixed. Future agents should verify OAuth callback routing.",
    },
    {
      type: "codex_chats",
      rootDir: path.join(evalRoot, "codex-chats"),
      fileName: "codex-session.md",
      sourcePrefix: "codex-chat://",
      marker: `phase1-codex-chat-${stamp}`,
      content:
        "Codex session handoff: production readiness gate must pass before Phase 1 is called production-grade.",
    },
    {
      type: "chatgpt_chats",
      rootDir: path.join(evalRoot, "chatgpt-chats"),
      fileName: "chatgpt-session.md",
      sourcePrefix: "chatgpt-chat://",
      marker: `phase1-chatgpt-chat-${stamp}`,
      content:
        "ChatGPT project conversation: user clarified source cards must be separate and real-logo based.",
    },
    {
      type: "windsurf_chats",
      rootDir: path.join(evalRoot, "windsurf-chats"),
      fileName: "windsurf-session.md",
      sourcePrefix: "windsurf-chat://",
      marker: `phase1-windsurf-chat-${stamp}`,
      content:
        "Windsurf session handoff: Cascade changed billing UI. Future agents should check approval and risk rules before edits.",
    },
    {
      type: "devin_chats",
      rootDir: path.join(evalRoot, "devin-chats"),
      fileName: "devin-session.md",
      sourcePrefix: "devin-chat://",
      marker: `phase1-devin-chat-${stamp}`,
      content:
        "Devin agent session: created a plan, executed tests, and handed off unresolved production OAuth verification.",
    },
    {
      type: "ci_cd_logs",
      rootDir: path.join(evalRoot, "ci-cd-logs"),
      fileName: "failed-build.log",
      sourcePrefix: "ci-cd://",
      marker: `phase1-ci-cd-${stamp}`,
      content:
        "CI failed in quality gate. npm test reported connector trace proof missing after source import.",
    },
    {
      type: "deployment_errors",
      rootDir: path.join(evalRoot, "deployment-errors"),
      fileName: "sentry-regression.json",
      sourcePrefix: "deployment-error://",
      marker: `phase1-deployment-error-${stamp}`,
      content:
        "{\"level\":\"error\",\"message\":\"Deployment regression in MemoryIgnition brief generation\",\"release\":\"phase1\"}",
    },
  ];

  for (const source of sources) {
    mkdirSync(source.rootDir, { recursive: true });
    writeFileSync(
      path.join(source.rootDir, source.fileName),
      [`Trace marker: ${source.marker}`, source.content].join("\n\n"),
      "utf8",
    );
  }

  const checks: Check[] = [];

  for (const source of sources) {
    await requestJson<{ message?: string; rootPath?: string }>({
      baseUrl,
      token,
      orgId,
      route: `/api/connector/${source.type}/connect`,
      method: "POST",
      body: { rootPath: source.rootDir },
    });
    push(checks, `${source.type} connect`, true, `connected root=${source.rootDir}`);

    await requestJson<{ message?: string }>({
      baseUrl,
      token,
      orgId,
      route: `/api/connector/${source.type}/sync`,
      method: "POST",
    });
    push(checks, `${source.type} sync queued`, true, `POST /api/connector/${source.type}/sync accepted`);

    const log = await waitForLatestLog({ baseUrl, token, orgId, type: source.type });
    const syncOk = log?.status === "success";
    const extractedCount = typeof log?.extractedCount === "number" ? log.extractedCount : 0;
    push(
      checks,
      `${source.type} sync log`,
      syncOk,
      log ? `status=${log.status}, extracted=${extractedCount}, message=${log.message ?? ""}` : "No sync log observed",
    );
  }

  type GateMemory = {
    sourceRef?: string;
    traceProof?: { sourceType?: string; sourceRef?: string } | null;
    metadata?: { sourceRef?: unknown; traceProof?: { sourceType?: string; sourceRef?: string } | null };
  };

  const list = await requestJson<{ memories?: GateMemory[] }>({
    baseUrl,
    token,
    orgId,
    route: "/api/memory/list?limit=1000",
  });
  const memories = list.memories ?? [];

  for (const source of sources) {
    const sourceMemories = memories.filter((memory) =>
      sourceRefMatches(
        memory.sourceRef ?? memory.metadata?.sourceRef ?? memory.traceProof?.sourceRef ?? memory.metadata?.traceProof?.sourceRef,
        source.sourcePrefix,
      ),
    );
    const traceable = sourceMemories.filter((memory) => Boolean(memory.traceProof ?? memory.metadata?.traceProof));
    push(
      checks,
      `${source.type} imported memories`,
      sourceMemories.length > 0,
      `${source.type} source memories=${sourceMemories.length}`,
    );
    push(
      checks,
      `${source.type} trace proof`,
      traceable.length > 0,
      `${source.type} traceable memories=${traceable.length}`,
    );
  }

  const passed = checks.filter((check) => check.ok).length;
  const failed = checks.length - passed;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    orgId: orgId ?? null,
    evalRoot,
    checks,
    summary: { passed, failed, total: checks.length },
  };

  await saveOperationalArtifact({
    kind: "phase_gate",
    name: "phase1-engineering-sources-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 1 engineering sources gate report saved to operational_artifacts:phase_gate/phase1-engineering-sources-gate");

  if (failed > 0) {
    throw new Error(`Phase 1 engineering sources gate failed: ${failed}/${checks.length} checks failed.`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[phase1:engineering-sources:gate] ${message}`);
  process.exit(1);
});

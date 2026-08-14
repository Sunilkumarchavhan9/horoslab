import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { buildCodexSessionImportContent } from "../lib/integrations/codexBridge";
import { writeEngineeringSignalExportUpload } from "../lib/integrations/engineeringSignalUpload";
import { saveOperationalArtifact } from "../lib/operational/artifactStore";

type JsonRecord = Record<string, unknown>;
type Check = { name: string; ok: boolean; detail: string };

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

async function waitForCodexLog(input: {
  baseUrl: string;
  token: string;
  orgId?: string;
}): Promise<{ status?: string; extractedCount?: number; message?: string } | null> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const logs = await requestJson<{ logs?: Array<{ type?: string; status?: string; extractedCount?: number; message?: string }> }>({
      baseUrl: input.baseUrl,
      token: input.token,
      orgId: input.orgId,
      route: "/api/connector/logs",
    });
    const latest = logs.logs?.find((log) => log.type === "codex_chats") ?? null;
    if (latest?.status === "success" || latest?.status === "error") return latest;
    await sleep(1000);
  }
  return null;
}

async function main(): Promise<void> {
  const baseUrl = env("PHASE1_GATE_BASE_URL") ?? env("MEMORYOS_BASE_URL") ?? "http://localhost:3011";
  const orgId = env("PHASE1_GATE_ORG_ID") ?? env("MEMORYOS_ORG_ID");
  const token = env("PHASE1_GATE_TOKEN") ?? env("MEMORYOS_API_TOKEN") ?? env("MEMORYOS_TOKEN") ?? "";
  if (!token) throw new Error("Missing token. Set PHASE1_GATE_TOKEN or MEMORYOS_API_TOKEN.");

  const checks: Check[] = [];
  const configPath = path.join(process.cwd(), ".codex", "config.toml");
  const skillPath = path.join(process.cwd(), ".codex", "skills", "memoryignition", "SKILL.md");

  const config = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
  const skill = existsSync(skillPath) ? readFileSync(skillPath, "utf8") : "";
  push(checks, "Codex MCP config", config.includes("[mcp_servers.memoryos]"), configPath);
  push(checks, "Codex MemoryIgnition skill", skill.includes("memoryignition_get_brief"), skillPath);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const threadId = `phase1-codex-${stamp}`;
  const rootPath = path.join(process.cwd(), "data", "eval", "phase1-codex-source", stamp);
  const source = writeEngineeringSignalExportUpload({
    type: "codex_chats",
    rootPath,
    filename: `${threadId}.md`,
    content: buildCodexSessionImportContent({
      task: "Phase 1 Codex source gate validates MemoryOS Codex inheritance and outcome capture.",
      threadId,
      project: "MemoryOS",
      status: 0,
      stdout: `Codex gate marker ${threadId}: MemoryIgnition brief was used before action.`,
      stderr: "",
      outcomeStatus: "success",
    }),
  });
  push(checks, "Codex source file", existsSync(source.absolutePath), source.absolutePath);

  await requestJson({
    baseUrl,
    token,
    orgId,
    route: "/api/connector/codex_chats/connect",
    method: "POST",
    body: { rootPath: source.rootPath },
  });
  push(checks, "Codex source connected", true, `root=${source.rootPath}`);

  await requestJson({
    baseUrl,
    token,
    orgId,
    route: "/api/connector/codex_chats/sync",
    method: "POST",
  });
  const latestLog = await waitForCodexLog({ baseUrl, token, orgId });
  const syncOk = latestLog?.status === "success";
  push(
    checks,
    "Codex source sync",
    syncOk,
    latestLog ? `status=${latestLog.status}, extracted=${latestLog.extractedCount ?? 0}, message=${latestLog.message ?? ""}` : "No codex_chats sync log observed",
  );

  const brief = await requestJson<{
    result?: { trace_proof?: unknown[]; relevant_memories?: unknown[] };
  }>({
    baseUrl,
    token,
    orgId,
    route: "/api/mcp/invoke",
    method: "POST",
    body: {
      name: "memoryignition_get_brief",
      input: {
        question: "Prepare Codex to continue MemoryOS Phase 1 production connector work.",
        task: "Prepare Codex to continue MemoryOS Phase 1 production connector work.",
        project: "MemoryOS",
        threadId,
        agent_id: "codex",
        risk_level: "medium",
        mode: "resume",
      },
    },
  });
  const briefOk = Array.isArray(brief.result?.trace_proof) && Array.isArray(brief.result?.relevant_memories);
  push(checks, "MemoryIgnition brief for Codex", briefOk, `traceProof=${brief.result?.trace_proof?.length ?? 0}`);

  const outcome = await requestJson<{
    result?: { outcome_recorded?: boolean; trace_proof?: unknown[] };
  }>({
    baseUrl,
    token,
    orgId,
    route: "/api/mcp/invoke",
    method: "POST",
    body: {
      name: "memoryignition_save_outcome",
      input: {
        threadId,
        message: "Phase 1 Codex source gate saved outcome.",
        modelResponse: "Codex source bridge writes a local source file and saves outcome learning.",
        outcome: "Codex source bridge validated.",
        outcome_status: "success",
        tool_calls: ["memoryignition_get_brief", "memoryignition_save_outcome"],
        risk_level: "medium",
      },
    },
  });
  push(
    checks,
    "Codex outcome learning",
    outcome.result?.outcome_recorded === true,
    `traceProof=${outcome.result?.trace_proof?.length ?? 0}`,
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
    name: "phase1-codex-source-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 1 Codex source gate report saved to operational_artifacts:phase_gate/phase1-codex-source-gate");
  if (failed > 0) throw new Error(`Phase 1 Codex source gate failed: ${failed}/${checks.length} checks failed.`);
}

main().catch((error) => {
  console.error(`\n[phase1:codex-source:gate] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

import path from "path";
import { saveOperationalArtifact } from "../lib/operational/artifactStore";

type JsonRecord = Record<string, unknown>;

type GateCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

type GateReport = {
  generatedAt: string;
  baseUrl: string;
  project: string;
  workspace: string;
  checks: GateCheck[];
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
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
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<T> {
  const response = await fetch(`${input.baseUrl}${input.path}`, {
    method: input.method ?? "GET",
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
      ...(input.headers ?? {}),
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
        : `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`${input.path} failed: ${message}`);
  }

  return normalizePayload<T>(payload);
}

function pushCheck(checks: GateCheck[], name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
}

async function main(): Promise<void> {
  const baseUrl = env("PHASE2_GATE_BASE_URL") ?? env("PHASE1_GATE_BASE_URL") ?? "http://localhost:3011";
  const token =
    env("PHASE2_GATE_TOKEN") ??
    env("PHASE1_GATE_TOKEN") ??
    env("MEMORYOS_API_TOKEN") ??
    env("MEMORYOS_TOKEN") ??
    "";

  if (!token) {
    throw new Error("Missing token. Set PHASE2_GATE_TOKEN, PHASE1_GATE_TOKEN, or MEMORYOS_API_TOKEN.");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const workspace = "phase2-gate";
  const project = `phase2-company-brain-${stamp}`;
  const checks: GateCheck[] = [];

  const health = await fetch(`${baseUrl}/api/health`);
  pushCheck(checks, "API health", health.ok, health.ok ? "GET /api/health = ok" : "Health endpoint failed");

  const capture = await requestJson<{
    acceptedCount?: number;
    acceptedMemories?: Array<{
      id?: string;
      companyBrainType?: string | null;
      traceProof?: { sourceRef?: string; evidence?: unknown[] } | null;
      freshness?: { status?: string } | null;
      conflict?: { status?: string } | null;
      graph?: { nodeId?: string; nodeType?: string; edgeRefs?: unknown[] } | null;
      retrievalIndexed?: boolean;
    }>;
    rejectedCount?: number;
    rejectedMemories?: Array<{ reason?: string; type?: string }>;
    breakdown?: { byType?: Record<string, number> };
  }>({
    baseUrl,
    token,
    path: "/api/memory/company-brain/phase2/capture",
    method: "POST",
    body: {
      workspace,
      project,
      threadId: `phase2-thread-${stamp}`,
      rawSignals: [
        {
          sourceType: "slack",
          sourceRef: `thread/raw-phase2-risk-${stamp}`,
          title: "Production deploy approval policy",
          body: "Production schema migrations must require approval before execution. token sk-1234567890abcdef1234567890abcdef",
          occurredAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          author: "security-team",
        },
      ],
      slackSignals: [
        {
          channelId: "C-phase2",
          channelName: "incidents",
          messageTs: `1710000000.${stamp.slice(-6)}`,
          userId: "U-security",
          text: "P1 incident: customer email jane@example.com saw production outage. Call +1 415 555 1212. token sk-abcdefabcdefabcdef12",
          permalink: "https://slack.example/archives/C-phase2/p1710000000000100",
        },
      ],
      jiraSignals: [
        {
          issueId: "10001",
          issueKey: `MEM-${stamp.slice(-6)}`,
          summary: "Decision: require approval for production migrations",
          description: "We agreed production schema migration must require approval.",
          status: "Approved",
          priority: "High",
          labels: ["decision", "production"],
          updatedAt: new Date().toISOString(),
          url: "https://jira.example/browse/MEM-42",
        },
      ],
      memories: [
        {
          type: "decision",
          title: "Use structured Company Brain memory for Phase 2",
          whatHappened: "Phase 2 captures typed memories with trace proof and graph metadata.",
          whyItMatters: "Future agents inherit cleaner decisions with source evidence.",
          evidence: ["strong.md#Phase 2", "phase2-gate"],
          source: "docs:strong.md",
          confidence: 0.95,
          shouldInheritBy: ["Codex", "Cursor"],
        },
        {
          type: "risk",
          title: "High-risk production actions need approval",
          whatHappened: "Schema, auth, billing, and deployment changes can harm production.",
          whyItMatters: "Future agents need approval rules before acting.",
          evidence: ["security-policy", "phase2-gate"],
          source: "policy:memoryos-risk",
          confidence: 0.93,
          conflictsWith: ["memory:unrestricted-agent-actions"],
          shouldInheritBy: ["Codex"],
        },
        {
          type: "context",
          title: "Company Brain context powers MemoryIgnition",
          whatHappened: "Structured context is retrieved before future agents act.",
          whyItMatters: "This connects Phase 2 to future-agent inheritance.",
          evidence: ["memory.before_model"],
          source: "mcp:memory.before_model",
          confidence: 0.9,
          shouldInheritBy: ["Codex"],
        },
      ],
    },
  });

  const accepted = capture.acceptedMemories ?? [];
  pushCheck(
    checks,
    "Structured capture",
    capture.acceptedCount === 6 && accepted.length === 6,
    `accepted=${capture.acceptedCount ?? 0}`,
  );
  pushCheck(
    checks,
    "Full taxonomy types",
    ["decision", "risk", "context"].every((type) => (capture.breakdown?.byType?.[type] ?? 0) >= 1) &&
      (capture.breakdown?.byType?.risk ?? 0) >= 2 &&
      (capture.breakdown?.byType?.incident ?? 0) >= 1 &&
      (capture.breakdown?.byType?.decision ?? 0) >= 2,
    `byType=${JSON.stringify(capture.breakdown?.byType ?? {})}`,
  );
  pushCheck(
    checks,
    "Trace proof coverage",
    accepted.every((memory) => memory.traceProof?.sourceRef && (memory.traceProof.evidence?.length ?? 0) > 0),
    `traceable=${accepted.filter((memory) => memory.traceProof?.sourceRef).length}/${accepted.length}`,
  );
  pushCheck(
    checks,
    "Freshness and conflict status",
    accepted.every((memory) => memory.freshness?.status) &&
      accepted.some((memory) => memory.conflict?.status === "possible_conflict"),
    "freshness present and risk conflict detected",
  );
  pushCheck(
    checks,
    "Graph memory",
    accepted.every((memory) => memory.graph?.nodeId && memory.graph.nodeType && Array.isArray(memory.graph.edgeRefs)),
    `nodes=${accepted.filter((memory) => memory.graph?.nodeId).length}`,
  );
  pushCheck(
    checks,
    "Retrieval index proof",
    accepted.every((memory) => memory.retrievalIndexed === true),
    `indexed=${accepted.filter((memory) => memory.retrievalIndexed).length}/${accepted.length}`,
  );

  const duplicateCapture = await requestJson<{
    acceptedCount?: number;
    rejectedCount?: number;
    rejectedMemories?: Array<{ reason?: string; type?: string }>;
  }>({
    baseUrl,
    token,
    path: "/api/memory/company-brain/phase2/capture",
    method: "POST",
    body: {
      workspace,
      project,
      threadId: `phase2-thread-${stamp}`,
      rawSignals: [
        {
          sourceType: "slack",
          sourceRef: `thread/raw-phase2-risk-${stamp}`,
          title: "Production deploy approval policy",
          body: "Production schema migrations must require approval before execution. token sk-1234567890abcdef1234567890abcdef",
          occurredAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          author: "security-team",
        },
      ],
    },
  });
  pushCheck(
    checks,
    "Raw extraction dedupe",
    duplicateCapture.acceptedCount === 0 &&
      duplicateCapture.rejectedCount === 1 &&
      duplicateCapture.rejectedMemories?.[0]?.reason === "duplicate",
    `accepted=${duplicateCapture.acceptedCount ?? 0}, rejected=${duplicateCapture.rejectedCount ?? 0}`,
  );

  const overview = await requestJson<{
    totalStructuredMemories?: number;
    moatCoverage?: {
      pillarsWithData?: number;
      traceProofCoverage?: number;
      conflictedCount?: number;
    };
    graph?: { nodes?: unknown[]; edges?: unknown[] };
    pillars?: Record<string, { count?: number }>;
  }>({
    baseUrl,
    token,
    path: `/api/memory/company-brain/phase2/overview?project=${encodeURIComponent(project)}`,
  });
  pushCheck(
    checks,
    "Phase 2 overview",
    (overview.totalStructuredMemories ?? 0) >= 6 &&
      (overview.moatCoverage?.traceProofCoverage ?? 0) >= 100 &&
      (overview.graph?.nodes?.length ?? 0) >= 6,
    `total=${overview.totalStructuredMemories ?? 0}, trace=${overview.moatCoverage?.traceProofCoverage ?? 0}`,
  );

  const orgProject = `${project}-org-isolation`;
  await requestJson<unknown>({
    baseUrl,
    token,
    path: "/api/memory/company-brain/phase2/capture",
    method: "POST",
    headers: { "x-memoryos-org-id": "phase2-alpha" },
    body: {
      project: orgProject,
      memories: [
        {
          type: "decision",
          title: "Alpha org deploy rule",
          whatHappened: "Alpha organization requires deploy approvals.",
          whyItMatters: "Only alpha agents should inherit this rule.",
          evidence: ["alpha-policy"],
          source: "policy:alpha",
        },
      ],
    },
  });
  const alphaOverview = await requestJson<{ totalStructuredMemories?: number }>({
    baseUrl,
    token,
    path: `/api/memory/company-brain/phase2/overview?project=${encodeURIComponent(orgProject)}`,
    headers: { "x-memoryos-org-id": "phase2-alpha" },
  });
  const betaOverview = await requestJson<{ totalStructuredMemories?: number }>({
    baseUrl,
    token,
    path: `/api/memory/company-brain/phase2/overview?project=${encodeURIComponent(orgProject)}`,
    headers: { "x-memoryos-org-id": "phase2-beta" },
  });
  pushCheck(
    checks,
    "Org isolation",
    (alphaOverview.totalStructuredMemories ?? 0) >= 1 && (betaOverview.totalStructuredMemories ?? 0) === 0,
    `alpha=${alphaOverview.totalStructuredMemories ?? 0}, beta=${betaOverview.totalStructuredMemories ?? 0}`,
  );

  const retrieve = await requestJson<{ memories?: unknown[] }>({
    baseUrl,
    token,
    path: "/api/memory/retrieve",
    method: "POST",
    body: {
      question: "What Company Brain context should future agents inherit for Phase 2 risk and decisions?",
      project,
      workspace,
      topK: 5,
    },
  });
  pushCheck(
    checks,
    "Retrieval uses structured brain",
    (retrieve.memories?.length ?? 0) > 0,
    `memories=${retrieve.memories?.length ?? 0}`,
  );

  const beforeModel = await requestJson<{
    result?: {
      relevant_memories?: unknown[];
      trace_proof?: unknown[];
      approval_rules?: { approval_required?: boolean; derived_risk_level?: string };
    };
  }>({
    baseUrl,
    token,
    path: "/api/mcp/invoke",
    method: "POST",
    body: {
      name: "memory.before_model",
      input: {
        question: "Prepare agent for production schema risk decision",
        workspace_id: workspace,
        repo_or_task: project,
        task_intent: "Deploy production schema migration",
        available_tools: ["read", "edit", "shell"],
        risk_level: "low",
        topK: 5,
      },
    },
  });
  pushCheck(
    checks,
    "MemoryIgnition inherits Company Brain",
    (beforeModel.result?.relevant_memories?.length ?? 0) > 0 &&
      (beforeModel.result?.trace_proof?.length ?? 0) > 0 &&
      beforeModel.result?.approval_rules?.approval_required === true,
    `relevant=${beforeModel.result?.relevant_memories?.length ?? 0}, risk=${beforeModel.result?.approval_rules?.derived_risk_level ?? "unknown"}`,
  );

  const passed = checks.filter((check) => check.ok).length;
  const failed = checks.length - passed;
  const report: GateReport = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    project,
    workspace,
    checks,
    summary: { passed, failed, total: checks.length },
  };

  await saveOperationalArtifact({
    kind: "phase_gate",
    name: "phase2-e2e-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });

  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 2 gate report saved to operational_artifacts:phase_gate/phase2-e2e-gate");

  if (failed > 0) {
    throw new Error(`Phase 2 gate failed: ${failed}/${checks.length} checks failed.`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[phase2:e2e:gate] ${message}`);
  process.exit(1);
});

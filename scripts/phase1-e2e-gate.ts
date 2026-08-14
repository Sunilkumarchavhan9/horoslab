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
  orgId: string | null;
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
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}): Promise<T> {
  const response = await fetch(`${input.baseUrl}${input.path}`, {
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
        : `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`${input.path} failed: ${message}`);
  }

  return normalizePayload<T>(payload);
}

async function requestHealth(baseUrl: string): Promise<boolean> {
  const response = await fetch(`${baseUrl}/api/health`);
  if (!response.ok) return false;
  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  return payload?.status === "ok";
}

function pushCheck(
  checks: GateCheck[],
  name: string,
  ok: boolean,
  detail: string,
): void {
  checks.push({ name, ok, detail });
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
    throw new Error(
      "Missing token. Set PHASE1_GATE_TOKEN or MEMORYOS_API_TOKEN before running phase1 gate.",
    );
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const workspace = "phase1-gate";
  const project = `phase1-engineering-continuity-${stamp}`;
  const threadId = `phase1-thread-${stamp}`;
  const checks: GateCheck[] = [];

  const healthy = await requestHealth(baseUrl);
  pushCheck(checks, "API health", healthy, healthy ? "GET /api/health = ok" : "Health endpoint failed");
  if (!healthy) {
    throw new Error("Phase 1 gate failed early: API health is not ok.");
  }

  const processResult = await requestJson<{
    acceptedMemories?: unknown[];
    rejectedMemories?: unknown[];
    timelineEvents?: unknown[];
  }>({
    baseUrl,
    token,
    orgId,
    path: "/api/memory/process",
    method: "POST",
    body: {
      threadId,
      message:
        "Phase 1 gate: investigating flaky PR checks in memory retrieval pipeline and saving continuity context.",
      contract: {
        contract_version: "memoryos.contract.v1",
        goal: "Maintain engineering continuity for active incidents and PR reviews",
        decisions: ["Use resume + handoff output instead of rewriting context"],
        next_actions: ["Run resume before next engineering session"],
      },
      enforceContract: true,
    },
  });
  const acceptedCount = Array.isArray(processResult.acceptedMemories)
    ? processResult.acceptedMemories.length
    : 0;
  pushCheck(
    checks,
    "Memory process",
    acceptedCount > 0,
    `POST /api/memory/process accepted=${acceptedCount}`,
  );

  const retrieveResult = await requestJson<{ memories?: unknown[] }>({
    baseUrl,
    token,
    orgId,
    path: "/api/memory/retrieve",
    method: "POST",
    body: {
      question: "What context exists for flaky PR checks and retrieval pipeline debugging?",
      topK: 5,
      workspace,
      project,
      threadId,
    },
  });
  const retrievedCount = Array.isArray(retrieveResult.memories) ? retrieveResult.memories.length : 0;
  pushCheck(
    checks,
    "Memory retrieve",
    retrievedCount > 0,
    `POST /api/memory/retrieve memories=${retrievedCount}`,
  );

  const continueResult = await requestJson<{ nextActions?: unknown[] }>({
    baseUrl,
    token,
    orgId,
    path: "/api/memory/continue",
    method: "POST",
    body: {
      question: "What should engineering do next to continue this work?",
      mode: "build_next",
      topK: 5,
      workspace,
      project,
      threadId,
    },
  });
  const continueActions = Array.isArray(continueResult.nextActions)
    ? continueResult.nextActions.length
    : 0;
  pushCheck(
    checks,
    "Memory continue",
    continueActions > 0,
    `POST /api/memory/continue nextActions=${continueActions}`,
  );

  const resumeResult = await requestJson<{
    summary?: string;
    openLoops?: string[];
    recommendedNextStep?: string;
  }>({
    baseUrl,
    token,
    orgId,
    path: "/api/memory/resume",
    method: "POST",
    body: {
      project,
      question: "Where did engineering leave off and what should continue now?",
      topK: 5,
      workspace,
      threadId,
    },
  });
  const resumeOk =
    typeof resumeResult.summary === "string" && resumeResult.summary.trim().length > 0;
  pushCheck(
    checks,
    "Memory resume",
    resumeOk,
    `POST /api/memory/resume summary=${resumeResult.summary ? "present" : "empty"}`,
  );

  const handoffResult = await requestJson<{
    summary?: string;
    openLoops?: string[];
    nextRecommendedAction?: string;
  }>({
    baseUrl,
    token,
    orgId,
    path: "/api/memory/handoff",
    method: "POST",
    body: {
      project,
      question: "Create an engineering handoff for another developer.",
      topK: 5,
      workspace,
      threadId,
    },
  });
  const handoffOk =
    typeof handoffResult.summary === "string" && handoffResult.summary.trim().length > 0;
  pushCheck(
    checks,
    "Memory handoff",
    handoffOk,
    `POST /api/memory/handoff summary=${handoffResult.summary ? "present" : "empty"}`,
  );

  const projectStateResult = await requestJson<{
    projectId?: string;
    briefSummary?: {
      currentGoal?: string;
      nextBestAction?: string;
    };
    resumeConfidenceScore?: number;
  }>({
    baseUrl,
    token,
    orgId,
    path: `/api/memory/project-state?projectId=${encodeURIComponent(project)}`,
    method: "GET",
  });
  const projectStateOk =
    projectStateResult.projectId === project &&
    typeof projectStateResult.briefSummary === "object" &&
    typeof projectStateResult.resumeConfidenceScore === "number";
  pushCheck(
    checks,
    "Project state",
    projectStateOk,
    projectStateOk
      ? `GET /api/memory/project-state confidence=${projectStateResult.resumeConfidenceScore}`
      : "Project state missing canonical snapshot fields",
  );

  const beforeModelResult = await requestJson<{
    name?: string;
    result?: {
      relevant_memories?: unknown[];
      executable_skills?: unknown[];
      past_mistakes?: unknown[];
      risky_files?: unknown[];
      approval_rules?: {
        risk_level?: string;
        approval_required?: boolean;
      };
      recommended_first_action?: string | null;
      trace_proof?: unknown[];
    };
  }>({
    baseUrl,
    token,
    orgId,
    path: "/api/mcp/invoke",
    method: "POST",
    body: {
      name: "memory.before_model",
      input: {
        question: "Prepare an engineering agent to continue the Phase 1 gate.",
        workspace_id: workspace,
        agent_id: "codex",
        repo_or_task: project,
        task_intent: "Continue MemoryOS Phase 1 engineering continuity",
        available_tools: ["read", "edit", "test"],
        risk_level: "medium",
        mode: "resume",
        topK: 5,
        threadId,
      },
    },
  });
  const beforePayload = beforeModelResult.result;
  const beforeModelOk =
    beforeModelResult.name === "memory.before_model" &&
    Array.isArray(beforePayload?.relevant_memories) &&
    Array.isArray(beforePayload?.executable_skills) &&
    Array.isArray(beforePayload?.past_mistakes) &&
    Array.isArray(beforePayload?.risky_files) &&
    typeof beforePayload?.approval_rules?.approval_required === "boolean" &&
    "recommended_first_action" in (beforePayload ?? {}) &&
    Array.isArray(beforePayload?.trace_proof);
  pushCheck(
    checks,
    "MemoryIgnition before-model",
    beforeModelOk,
    beforeModelOk
      ? `traceProof=${beforePayload?.trace_proof?.length ?? 0}, relevant=${beforePayload?.relevant_memories?.length ?? 0}`
      : "before_model missing Phase 1 MemoryIgnition fields",
  );

  const traceProofOk =
    (beforePayload?.relevant_memories?.length ?? 0) === 0 ||
    (beforePayload?.trace_proof?.length ?? 0) > 0;
  pushCheck(
    checks,
    "Trace proof",
    traceProofOk,
    traceProofOk
      ? "Trace proof present when retrieved context exists"
      : "Retrieved context exists but trace proof is empty",
  );

  const afterModelResult = await requestJson<{
    name?: string;
    result?: {
      acceptedCount?: number;
      rejectedCount?: number;
      outcome_recorded?: boolean;
      action_memory_id?: string;
      execution_outcome_id?: string;
      experience_draft?: {
        status?: string;
        outcome?: string | null;
        lesson?: string | null;
      };
      trace_proof?: unknown[];
    };
  }>({
    baseUrl,
    token,
    orgId,
    path: "/api/mcp/invoke",
    method: "POST",
    body: {
      name: "memory.after_model",
      input: {
        threadId,
        repo_or_task: project,
        task_intent: "Continue MemoryOS Phase 1 engineering continuity",
        outcome: "Phase 1 gate captured before-model and after-model continuity signals.",
        outcome_status: "success",
        files_touched: ["scripts/phase1-e2e-gate.ts"],
        tool_calls: ["memory.before_model", "memory.after_model"],
        risk_level: "medium",
      },
    },
  });
  const afterPayload = afterModelResult.result;
  const afterModelOk =
    afterModelResult.name === "memory.after_model" &&
    typeof afterPayload?.acceptedCount === "number" &&
    typeof afterPayload?.rejectedCount === "number" &&
    afterPayload?.outcome_recorded === true &&
    typeof afterPayload?.action_memory_id === "string" &&
    typeof afterPayload?.execution_outcome_id === "string" &&
    afterPayload?.experience_draft?.status === "draft" &&
    Array.isArray(afterPayload?.trace_proof) &&
    afterPayload.trace_proof.length > 0;
  pushCheck(
    checks,
    "MemoryIgnition after-model",
    afterModelOk,
    afterModelOk
      ? `accepted=${afterPayload?.acceptedCount}, actionMemory=${afterPayload?.action_memory_id}, executionOutcome=${afterPayload?.execution_outcome_id}, traceProof=${afterPayload?.trace_proof?.length ?? 0}`
      : "after_model missing durable outcome capture, experience draft, or trace proof fields",
  );

  const requestsResult = await requestJson<{ requests?: Array<{ path?: string }> }>({
    baseUrl,
    token,
    orgId,
    path: "/api/memory/requests?limit=200&range=7d",
    method: "GET",
  });
  const requestPaths = Array.isArray(requestsResult.requests)
    ? requestsResult.requests.map((entry) => String(entry.path ?? ""))
    : [];
  const observedCoreRoutes = [
    "/api/memory/process",
    "/api/memory/retrieve",
    "/api/memory/continue",
    "/api/memory/resume",
    "/api/memory/handoff",
    "/api/memory/project-state",
  ].filter((route) => requestPaths.some((pathValue) => pathValue.includes(route)));
  pushCheck(
    checks,
    "Runtime request evidence",
    observedCoreRoutes.length >= 6,
    `Observed routes=${observedCoreRoutes.join(", ") || "none"}`,
  );

  const kpisResult = await requestJson<{
    phase1?: {
      weeklyActiveTeamsTarget?: number;
      weeklyActiveTeamsObserved?: number;
      source?: string;
    };
  }>({
    baseUrl,
    token,
    orgId,
    path: "/api/company-brain/kpis",
    method: "GET",
  });
  const phase1 = kpisResult.phase1;
  const kpiOk =
    Boolean(phase1) &&
    typeof phase1?.weeklyActiveTeamsTarget === "number" &&
    typeof phase1?.weeklyActiveTeamsObserved === "number";
  pushCheck(
    checks,
    "Phase 1 KPI telemetry",
    kpiOk,
    kpiOk
      ? `target=${phase1?.weeklyActiveTeamsTarget}, observed=${phase1?.weeklyActiveTeamsObserved}, source=${phase1?.source ?? "unknown"}`
      : "phase1 KPI block missing from /api/company-brain/kpis",
  );

  const passed = checks.filter((check) => check.ok).length;
  const failed = checks.length - passed;
  const report: GateReport = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    orgId: orgId ?? null,
    project,
    workspace,
    checks,
    summary: {
      passed,
      failed,
      total: checks.length,
    },
  };

  await saveOperationalArtifact({
    kind: "phase_gate",
    name: "phase1-e2e-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });

  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 1 gate report saved to operational_artifacts:phase_gate/phase1-e2e-gate");

  if (failed > 0) {
    throw new Error(`Phase 1 gate failed: ${failed}/${checks.length} checks failed.`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[phase1:e2e:gate] ${message}`);
  process.exit(1);
});


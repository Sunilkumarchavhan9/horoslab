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

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const error = (payload as JsonRecord).error;
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && typeof (error as JsonRecord).message === "string") {
      return String((error as JsonRecord).message);
    }
    if (typeof (payload as JsonRecord).message === "string") return String((payload as JsonRecord).message);
  }
  return fallback;
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
    throw new Error(`${input.path} failed: ${errorMessage(payload, `HTTP ${response.status} ${response.statusText}`)}`);
  }

  return normalizePayload<T>(payload);
}

function pushCheck(checks: GateCheck[], name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
}

async function main(): Promise<void> {
  const baseUrl = env("PHASE3_GATE_BASE_URL") ?? env("PHASE2_GATE_BASE_URL") ?? "http://localhost:3011";
  const orgId = env("PHASE3_GATE_ORG_ID") ?? env("PHASE2_GATE_ORG_ID") ?? env("MEMORYOS_ORG_ID");
  const token =
    env("PHASE3_GATE_TOKEN") ??
    env("PHASE2_GATE_TOKEN") ??
    env("PHASE1_GATE_TOKEN") ??
    env("MEMORYOS_API_TOKEN") ??
    env("MEMORYOS_TOKEN") ??
    "";

  if (!token) {
    throw new Error("Missing token. Set PHASE3_GATE_TOKEN, PHASE2_GATE_TOKEN, PHASE1_GATE_TOKEN, or MEMORYOS_API_TOKEN.");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const workspace = "phase3-gate";
  const project = `phase3-memoryignition-${stamp}`;
  const checks: GateCheck[] = [];

  const health = await fetch(`${baseUrl}/api/health`);
  pushCheck(checks, "API health", health.ok, health.ok ? "GET /api/health = ok" : "Health endpoint failed");

  const capture = await requestJson<{
    acceptedCount?: number;
    acceptedMemories?: Array<{
      id?: string;
      type?: string;
      companyBrainType?: string | null;
      traceProof?: { sourceRef?: string; evidence?: unknown[] } | null;
    }>;
  }>({
    baseUrl,
    token,
    ...(orgId ? { orgId } : {}),
    path: "/api/memory/company-brain/phase2/capture",
    method: "POST",
    body: {
      workspace,
      project,
      threadId: `phase3-thread-${stamp}`,
      memories: [
        {
          type: "decision",
          title: "Signup email failure must not block account creation",
          whatHappened: "Engineering decided signup should succeed even when welcome email delivery times out.",
          whyItMatters: "Future agents fixing onboarding must preserve activation and avoid repeating the old rollback bug.",
          evidence: ["github:issue/phase3-signup-email", "slack:thread/signup-email-decision"],
          source: `phase3:decision:${stamp}`,
          confidence: 0.95,
          shouldInheritBy: ["Codex", "Cursor", "Claude"],
        },
        {
          type: "risk",
          title: "Onboarding route is risky",
          whatHappened: "app/api/onboarding/route.ts controls signup and customer activation.",
          whyItMatters: "Changes need careful review because bad edits can block new users.",
          evidence: ["incident:signup-regression", "support:activation-complaints"],
          source: `phase3:risk:${stamp}`,
          confidence: 0.94,
          shouldInheritBy: ["Codex", "Devin"],
        },
        {
          type: "test",
          title: "Run onboarding email tests",
          whatHappened: "npm test -- onboarding-email validates welcome-email timeout handling.",
          whyItMatters: "Future agents must run this before marking signup email fixes complete.",
          evidence: ["ci:phase3-onboarding-email"],
          source: `phase3:test:${stamp}`,
          confidence: 0.92,
          shouldInheritBy: ["Codex", "Cursor"],
        },
        {
          type: "agent_action",
          title: "Previous agent coupled email failure to signup failure",
          whatHappened: "A previous agent retried welcome email by throwing from user creation, which broke signup.",
          whyItMatters: "Future agents should avoid this past failure and separate account creation from email delivery.",
          evidence: ["codex:session/phase3-past-failure"],
          source: `phase3:past-failure:${stamp}`,
          confidence: 0.91,
          shouldInheritBy: ["Codex", "Claude"],
        },
      ],
    },
  });

  const accepted = capture.acceptedMemories ?? [];
  pushCheck(
    checks,
    "Source-backed memory seed",
    (capture.acceptedCount ?? 0) >= 4 && accepted.every((memory) => memory.traceProof?.sourceRef),
    `accepted=${capture.acceptedCount ?? 0}, traceable=${accepted.filter((memory) => memory.traceProof?.sourceRef).length}`,
  );

  const brief = await requestJson<{
    task_understanding?: { target_agent?: string; task_intent?: string };
    target_agent?: { id?: string; delivery?: string; supported?: boolean };
    relevant_memories?: unknown[];
    past_failure_retrieval?: unknown[];
    risky_file_retrieval?: unknown[];
    required_test_retrieval?: unknown[];
    approval_rule_retrieval?: Array<{ approval_required?: boolean; risk_level?: string }>;
    trace_proof?: unknown[];
    ready_to_send_prompt?: string;
    brief_proof_quality?: { score?: number; status?: string };
    evaluation_gate?: { can_inherit?: boolean; status?: string };
  }>({
    baseUrl,
    token,
    ...(orgId ? { orgId } : {}),
    path: "/api/memory/memoryignition/brief",
    method: "POST",
    body: {
      workspace,
      project,
      repo_or_task: project,
      task: "Fix signup email timeout in app/api/onboarding/route.ts without breaking user creation. Required test: npm test -- onboarding-email.",
      question: "Fix signup email timeout in app/api/onboarding/route.ts without breaking user creation. Required test: npm test -- onboarding-email.",
      task_intent: "Fix onboarding signup email failure safely in app/api/onboarding/route.ts. Required test: npm test -- onboarding-email.",
      agent_id: "codex",
      mode: "retrieve",
      risk_level: "high",
      available_tools: ["read_files", "edit_files", "terminal", "tests"],
      topK: 8,
    },
  });

  const prompt = brief.ready_to_send_prompt ?? "";
  const relevantCount = brief.relevant_memories?.length ?? 0;
  const traceCount = brief.trace_proof?.length ?? 0;

  pushCheck(
    checks,
    "Target agent selector contract",
    brief.task_understanding?.target_agent === "codex" &&
      brief.target_agent?.id === "codex" &&
      brief.target_agent.delivery === "copy_prompt",
    `target=${brief.target_agent?.id ?? "none"}, delivery=${brief.target_agent?.delivery ?? "none"}`,
  );
  pushCheck(
    checks,
    "Relevant memory retrieval",
    relevantCount > 0,
    `relevant_memories=${relevantCount}`,
  );
  pushCheck(
    checks,
    "Past failure retrieval",
    (brief.past_failure_retrieval?.length ?? 0) > 0,
    `past_failure_retrieval=${brief.past_failure_retrieval?.length ?? 0}`,
  );
  pushCheck(
    checks,
    "Risk/test/approval retrieval",
    (brief.risky_file_retrieval?.length ?? 0) > 0 &&
      (brief.required_test_retrieval?.length ?? 0) > 0 &&
      (brief.approval_rule_retrieval?.length ?? 0) > 0,
    `risky=${brief.risky_file_retrieval?.length ?? 0}, tests=${brief.required_test_retrieval?.length ?? 0}, approvals=${brief.approval_rule_retrieval?.length ?? 0}`,
  );
  pushCheck(
    checks,
    "Trace proof builder",
    traceCount > 0 && prompt.includes("## Trace Proof"),
    `trace_proof=${traceCount}`,
  );
  pushCheck(
    checks,
    "Ready-to-send prompt",
    prompt.includes("# MemoryIgnition Brief") &&
      prompt.includes("## Past Failures / Mistakes") &&
      prompt.includes("## Risky Files") &&
      prompt.includes("## Required Tests") &&
      prompt.includes("## Outcome Learning"),
    `promptChars=${prompt.length}`,
  );
  pushCheck(
    checks,
    "Inheritance gate",
    brief.evaluation_gate?.can_inherit === true && typeof brief.brief_proof_quality?.score === "number",
    `gate=${brief.evaluation_gate?.status ?? "none"}, proofScore=${brief.brief_proof_quality?.score ?? "none"}`,
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
    name: "phase3-memoryignition-brief-gate",
    status: failed > 0 ? "fail" : "pass",
    data: report,
  });

  console.log(JSON.stringify(report, null, 2));
  console.log("\nPhase 3 MemoryIgnition brief gate report saved to operational_artifacts:phase_gate/phase3-memoryignition-brief-gate");

  if (failed > 0) {
    throw new Error(`[phase3:memoryignition:gate] Phase 3 gate failed: ${failed}/${checks.length} checks failed.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

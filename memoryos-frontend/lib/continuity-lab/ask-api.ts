/**
 * Continuity Lab Ask — Q&A, Plan, and Auto mode against MemoryOS resume APIs.
 */

import { consoleApiFetch } from "@/lib/console-api";
import {
  fetchDecisionHistory,
  fetchExecutionHistory,
  formatLineageSummary,
} from "@/lib/continuity-lab/operational-api";
import {
  fetchResumeBrief,
  type OperationalResumeBrief,
} from "@/lib/continuity-lab/resume-brief";
import type { AskMode } from "@/lib/continuity-lab/ask-storage";

type ResumeResponse = {
  summary?: string;
  lastKnownState?: string;
  openLoops?: string[];
  recommendedNextStep?: string;
  brief?: OperationalResumeBrief;
};

export type AskPlan = {
  nextBestAction: string;
  steps: string[];
  blockers: string[];
  riskyFiles: string[];
  confidence: number;
  currentGoal: string;
};

export type AskQaResult = {
  kind: "qa";
  answer: string;
  deepContext?: string;
};

export type AskPlanResult = {
  kind: "plan";
  plan: AskPlan;
  brief: OperationalResumeBrief;
};

export type AskResult = AskQaResult | AskPlanResult;

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

export function resolveAskMode(mode: AskMode, question: string): "qa" | "plan" {
  if (mode === "qa") return "qa";
  if (mode === "plan") return "plan";
  const q = question.trim().toLowerCase();
  if (
    q.endsWith("?") ||
    /^(what|how|why|when|where|who|which|can|could|should|is|are|do|does|did|will|would)\b/.test(
      q,
    )
  ) {
    return "qa";
  }
  if (
    /\b(fix|implement|build|add|refactor|update|ship|deploy|create|migrate|remove|write|plan|design|setup|configure|start|launch|debug|investigate|optimize|test)\b/.test(
      q,
    )
  ) {
    return "plan";
  }
  return "qa";
}

async function buildDeepContextSuffix(projectId: string): Promise<string> {
  const [decisions, execution] = await Promise.all([
    fetchDecisionHistory(projectId, 8),
    fetchExecutionHistory(projectId, 6),
  ]);
  const lines: string[] = [];
  if (decisions.length) {
    lines.push(
      "Recent decisions:",
      ...decisions.slice(0, 6).map((d) => `- ${d.summary || d.content.slice(0, 120)}`),
    );
  }
  if (execution.length) {
    lines.push(
      "Recent execution:",
      ...execution.slice(0, 5).map((item) => `- ${formatLineageSummary(item)}`),
    );
  }
  return lines.length ? `\n\n${lines.join("\n")}` : "";
}

function formatQaAnswer(data: ResumeResponse): string {
  const parts = [
    typeof data.summary === "string" && data.summary.trim() ? data.summary.trim() : null,
    typeof data.lastKnownState === "string" && data.lastKnownState.trim()
      ? data.lastKnownState.trim()
      : null,
    Array.isArray(data.openLoops) && data.openLoops.length
      ? `Open loops:\n${data.openLoops.map((l) => `• ${l}`).join("\n")}`
      : null,
    typeof data.recommendedNextStep === "string" && data.recommendedNextStep.trim()
      ? `Recommended next: ${data.recommendedNextStep.trim()}`
      : null,
  ].filter(Boolean);
  return parts.join("\n\n") || "No answer returned yet. Connect GitHub and sync memory first.";
}

function briefToPlan(brief: OperationalResumeBrief): AskPlan {
  const steps = [
    brief.nextBestAction,
    ...brief.mustKnowContextForAgent.slice(0, 4),
    ...brief.driftAndCorrectiveActions.slice(0, 3),
  ]
    .map((s) => s.trim())
    .filter(Boolean);

  const uniqueSteps = [...new Set(steps)];

  return {
    nextBestAction: brief.nextBestAction || "Review operational context and pick the highest-impact task.",
    steps: uniqueSteps.length ? uniqueSteps : ["Load company memory for this repo and confirm scope."],
    blockers: brief.openBlockers.slice(0, 6),
    riskyFiles: brief.riskyFiles.slice(0, 8),
    confidence: brief.resumeConfidence?.score ?? 0,
    currentGoal: brief.currentGoal,
  };
}

export async function runAsk(input: {
  projectId: string;
  question: string;
  repo?: string | null;
  repos?: string[];
  mode: AskMode;
  deep: boolean;
  attachmentNote?: string | null;
}): Promise<AskResult> {
  const question = input.question.trim();
  if (!question) {
    throw new Error("Enter a question or task description.");
  }

  const resolvedMode = resolveAskMode(input.mode, question);
  const repo =
    input.repo?.trim() ||
    input.repos?.[0]?.trim() ||
    null;
  const repoScope =
    input.repos && input.repos.length > 1
      ? `\n\nRepositories in scope: ${input.repos.join(", ")}`
      : "";
  const attachment =
    input.attachmentNote?.trim() ? `\n\nAttachment note: ${input.attachmentNote.trim()}` : "";

  let deepContext = "";
  if (input.deep) {
    deepContext = await buildDeepContextSuffix(input.projectId);
  }

  const fullQuestion = `${question}${repoScope}${attachment}${deepContext}`;
  const topK = input.deep ? 16 : 8;

  if (resolvedMode === "plan") {
    const brief = await fetchResumeBrief({
      projectId: input.projectId,
      question: fullQuestion,
      repo,
    });
    if (!brief) {
      throw new Error("Could not generate a plan. Connect GitHub and sync memory first.");
    }
    return { kind: "plan", plan: briefToPlan(brief), brief };
  }

  const res = await consoleApiFetch("/api/memory/resume", {
    method: "POST",
    body: JSON.stringify({
      project: input.projectId,
      question: fullQuestion,
      topK,
      ...(repo ? { repo } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : "Could not reach company memory.",
    );
  }

  const payload = await res.json();
  const data = unwrapData<ResumeResponse>(payload) ?? (payload as ResumeResponse);

  return {
    kind: "qa",
    answer: formatQaAnswer(data),
    deepContext: deepContext || undefined,
  };
}

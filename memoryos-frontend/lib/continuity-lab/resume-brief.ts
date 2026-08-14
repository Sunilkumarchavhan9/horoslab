/**
 * Operational resume brief for Continuity Lab session start.
 */

import { consoleApiFetch } from "@/lib/console-api";
import { markFunnelBriefLoaded } from "@/lib/company-brain-funnel";
import { projectIdFromRepo } from "@/lib/continuity-lab/company-model";
import {
  saveMemoryOSLaunchContext,
  type MemoryOSLaunchContext,
} from "@/lib/continuity-launch-context";

export type ResumeConfidenceFactor = {
  label: string;
  weight: number;
  contribution: number;
};

export type ResumeConfidenceScore = {
  score: number;
  factors: ResumeConfidenceFactor[];
};

export type OperationalResumeBrief = {
  currentGoal: string;
  nextBestAction: string;
  whatChangedRecently: string[];
  keyDecisions: string[];
  openBlockers: string[];
  riskyFiles: string[];
  mustKnowContextForAgent: string[];
  driftAndCorrectiveActions: string[];
  whyTheseMemoriesWereSelected: Array<{
    memoryId: string;
    summary: string;
    finalScore: number;
    contractCategory?: string;
    reasonTags?: string[];
  }>;
  resumeConfidence: ResumeConfidenceScore;
};

export type ContinuityScoreSnapshot = ResumeConfidenceScore;

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

function parseBriefPayload(payload: unknown): OperationalResumeBrief | null {
  const data = unwrapData<Record<string, unknown>>(payload);
  if (!data) return null;

  const resumeConfidenceRaw = data.resumeConfidence;
  const resumeConfidence: ResumeConfidenceScore =
    resumeConfidenceRaw &&
    typeof resumeConfidenceRaw === "object" &&
    typeof (resumeConfidenceRaw as ResumeConfidenceScore).score === "number"
      ? {
          score: (resumeConfidenceRaw as ResumeConfidenceScore).score,
          factors: Array.isArray((resumeConfidenceRaw as ResumeConfidenceScore).factors)
            ? (resumeConfidenceRaw as ResumeConfidenceScore).factors.filter(
                (f): f is ResumeConfidenceFactor =>
                  Boolean(f) &&
                  typeof f === "object" &&
                  typeof (f as ResumeConfidenceFactor).label === "string",
              )
            : [],
        }
      : { score: 0, factors: [] };

  const stringList = (key: string): string[] =>
    Array.isArray(data[key])
      ? (data[key] as unknown[]).filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0,
        )
      : [];

  return {
    currentGoal: typeof data.currentGoal === "string" ? data.currentGoal.trim() : "",
    nextBestAction: typeof data.nextBestAction === "string" ? data.nextBestAction.trim() : "",
    whatChangedRecently: stringList("whatChangedRecently"),
    keyDecisions: stringList("keyDecisions"),
    openBlockers: stringList("openBlockers"),
    riskyFiles: stringList("riskyFiles"),
    mustKnowContextForAgent: stringList("mustKnowContextForAgent"),
    driftAndCorrectiveActions: stringList("driftAndCorrectiveActions"),
    whyTheseMemoriesWereSelected: Array.isArray(data.whyTheseMemoriesWereSelected)
      ? (data.whyTheseMemoriesWereSelected as Array<Record<string, unknown>>)
          .filter(
            (item) =>
              typeof item?.memoryId === "string" &&
              typeof item?.summary === "string" &&
              typeof item?.finalScore === "number",
          )
          .map((item) => ({
            memoryId: item.memoryId as string,
            summary: item.summary as string,
            finalScore: item.finalScore as number,
            contractCategory:
              typeof item.contractCategory === "string" ? item.contractCategory : undefined,
            reasonTags: Array.isArray(item.reasonTags)
              ? item.reasonTags.filter((tag): tag is string => typeof tag === "string")
              : [],
          }))
      : [],
    resumeConfidence,
  };
}

export function projectIdForLab(input: {
  repoFullName?: string | null;
  fallbackProject?: string | null;
}): string {
  if (input.repoFullName?.trim()) {
    return projectIdFromRepo(input.repoFullName.trim());
  }
  const fallback = input.fallbackProject?.trim();
  return fallback || "continuity-lab-workspace";
}

export async function fetchResumeBrief(input: {
  projectId: string;
  question?: string;
  repo?: string | null;
}): Promise<OperationalResumeBrief | null> {
  const project = input.projectId.trim();
  if (!project) return null;

  const question =
    input.question?.trim() ||
    "Where should we continue from the latest organizational memory?";

  try {
    const res = await consoleApiFetch("/api/memory/resume/brief", {
      method: "POST",
      body: JSON.stringify({
        project,
        question,
        topK: 8,
        ...(input.repo?.trim() ? { repo: input.repo.trim() } : {}),
      }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const brief = parseBriefPayload(payload);
    if (brief) markFunnelBriefLoaded();
    return brief;
  } catch {
    return null;
  }
}

export async function fetchContinuityScore(
  projectId: string,
): Promise<ContinuityScoreSnapshot | null> {
  const project = projectId.trim();
  if (!project) return null;
  try {
    const res = await consoleApiFetch(
      `/api/memory/continuity-score?projectId=${encodeURIComponent(project)}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<ResumeConfidenceScore>(payload);
    if (!data || typeof data.score !== "number") return null;
    return {
      score: data.score,
      factors: Array.isArray(data.factors) ? data.factors : [],
    };
  } catch {
    return null;
  }
}

export function compactBriefSummary(brief: OperationalResumeBrief): string {
  const goal = brief.currentGoal || brief.mustKnowContextForAgent[0];
  if (goal) return goal.slice(0, 280);
  if (brief.nextBestAction) return brief.nextBestAction.slice(0, 280);
  return "Operational brief loaded from company memory.";
}

export function buildLaunchContextFromBrief(input: {
  project: string;
  repo?: string | null;
  brief: OperationalResumeBrief;
}): Omit<MemoryOSLaunchContext, "createdAt"> {
  return {
    project: input.project,
    repo: input.repo ?? null,
    briefSummary: compactBriefSummary(input.brief),
    nextBestAction: input.brief.nextBestAction || undefined,
    currentGoal: input.brief.currentGoal || undefined,
    riskyFiles: input.brief.riskyFiles.slice(0, 12),
    openBlockers: input.brief.openBlockers.slice(0, 8),
    driftCorrectiveSteps: input.brief.driftAndCorrectiveActions.slice(0, 8),
    resumeConfidenceScore: input.brief.resumeConfidence.score,
    operationalBriefLoaded: true,
  };
}

export function saveOperationalLaunchContext(
  context: Omit<MemoryOSLaunchContext, "createdAt">,
): void {
  saveMemoryOSLaunchContext(context);
}

/** System-channel operational brief — not shown as the user chat message. */
export function buildOperationalSystemSuffix(brief: OperationalResumeBrief): string {
  const lines: string[] = [
    "MemoryOS operational brief (internal — summarize for the user; do not dump verbatim):",
  ];

  if (brief.currentGoal) lines.push(`Goal: ${brief.currentGoal}`);
  if (brief.nextBestAction) lines.push(`Next action: ${brief.nextBestAction}`);
  if (brief.openBlockers.length) {
    lines.push(`Blockers: ${brief.openBlockers.slice(0, 6).join("; ")}`);
  }
  if (brief.riskyFiles.length) {
    lines.push(`Risky files: ${brief.riskyFiles.slice(0, 10).join(", ")}`);
  }
  if (brief.keyDecisions.length) {
    lines.push(`Key decisions: ${brief.keyDecisions.slice(0, 5).join("; ")}`);
  }
  if (brief.whatChangedRecently.length) {
    lines.push(`Recent changes: ${brief.whatChangedRecently.slice(0, 5).join("; ")}`);
  }
  if (brief.driftAndCorrectiveActions.length) {
    lines.push(
      `Drift / corrective: ${brief.driftAndCorrectiveActions.slice(0, 5).join("; ")}`,
    );
  }
  if (brief.mustKnowContextForAgent.length) {
    lines.push(
      `Must know: ${brief.mustKnowContextForAgent.slice(0, 6).join("; ")}`,
    );
  }

  const topFactors = brief.resumeConfidence.factors
    .slice()
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map((f) => f.label);
  lines.push(
    `Resume confidence: ${brief.resumeConfidence.score}%${
      topFactors.length ? ` (${topFactors.join(", ")})` : ""
    }`,
  );

  return lines.join("\n");
}

export function formatContextLoadedLine(context: MemoryOSLaunchContext | null): string | null {
  if (!context?.operationalBriefLoaded) return null;
  const parts: string[] = ["MemoryOS context loaded"];
  if (typeof context.resumeConfidenceScore === "number") {
    parts.push(`confidence ${context.resumeConfidenceScore}%`);
  }
  if (context.nextBestAction?.trim()) {
    parts.push(`Next: ${context.nextBestAction.trim().slice(0, 120)}`);
  } else if (context.briefSummary?.trim()) {
    parts.push(context.briefSummary.trim().slice(0, 120));
  }
  return parts.join(" · ");
}

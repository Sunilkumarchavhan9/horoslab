/**
 * Continuity Lab launch context — passed from Mission Control / Playground into the lab iframe.
 * Mirrors the OpenHands `memoryos-launch-context` pattern (sessionStorage + postMessage).
 */

export const MEMORYOS_LAUNCH_CONTEXT_KEY = "memoryos.launch-context";
export const MEMORYOS_RESUME_PROJECT_KEY = "memoryos.resume.project";

export type MemoryOSLaunchContext = {
  project: string;
  briefSummary?: string;
  nextBestAction?: string;
  repo?: string | null;
  branch?: string | null;
  createdAt: string;
  currentGoal?: string;
  riskyFiles?: string[];
  openBlockers?: string[];
  driftCorrectiveSteps?: string[];
  resumeConfidenceScore?: number;
  operationalBriefLoaded?: boolean;
};

export function saveMemoryOSLaunchContext(context: Omit<MemoryOSLaunchContext, "createdAt">): void {
  if (typeof window === "undefined") return;
  const payload: MemoryOSLaunchContext = {
    ...context,
    project: context.project.trim(),
    createdAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(MEMORYOS_LAUNCH_CONTEXT_KEY, JSON.stringify(payload));
}

export function readMemoryOSLaunchContext(): MemoryOSLaunchContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(MEMORYOS_LAUNCH_CONTEXT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MemoryOSLaunchContext>;
    if (!parsed || typeof parsed.project !== "string" || !parsed.project.trim()) return null;
    const stringList = (key: keyof MemoryOSLaunchContext): string[] | undefined => {
      const raw = parsed[key];
      if (!Array.isArray(raw)) return undefined;
      const items = raw.filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0,
      );
      return items.length ? items : undefined;
    };

    return {
      project: parsed.project.trim(),
      briefSummary: typeof parsed.briefSummary === "string" ? parsed.briefSummary : undefined,
      nextBestAction: typeof parsed.nextBestAction === "string" ? parsed.nextBestAction : undefined,
      repo: typeof parsed.repo === "string" ? parsed.repo : null,
      branch: typeof parsed.branch === "string" ? parsed.branch : null,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      currentGoal: typeof parsed.currentGoal === "string" ? parsed.currentGoal : undefined,
      riskyFiles: stringList("riskyFiles"),
      openBlockers: stringList("openBlockers"),
      driftCorrectiveSteps: stringList("driftCorrectiveSteps"),
      resumeConfidenceScore:
        typeof parsed.resumeConfidenceScore === "number"
          ? parsed.resumeConfidenceScore
          : undefined,
      operationalBriefLoaded: parsed.operationalBriefLoaded === true,
    };
  } catch {
    return null;
  }
}

export function saveResumeProject(project: string): void {
  if (typeof window === "undefined") return;
  const trimmed = project.trim();
  if (!trimmed) return;
  window.sessionStorage.setItem(MEMORYOS_RESUME_PROJECT_KEY, trimmed);
}

export function readResumeProject(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(MEMORYOS_RESUME_PROJECT_KEY);
  return value?.trim() ? value.trim() : null;
}

export function buildContinuityLabOpenUrl(basePath = "/continuity-lab"): string {
  const context = readMemoryOSLaunchContext();
  if (!context) return basePath;
  try {
    const url = new URL(basePath, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    url.searchParams.set("project", context.project);
    if (context.briefSummary) {
      url.searchParams.set("brief", context.briefSummary.slice(0, 280));
    }
    if (context.repo) url.searchParams.set("repo", context.repo);
    return `${url.pathname}${url.search}`;
  } catch {
    return basePath;
  }
}

import { markFunnelLabOpened } from "@/lib/company-brain-funnel";

export function openContinuityLabWithBrief(input: {
  project: string;
  briefSummary?: string;
  nextBestAction?: string;
  repo?: string | null;
}): void {
  if (typeof window === "undefined") return;
  saveMemoryOSLaunchContext({
    project: input.project,
    briefSummary: input.briefSummary,
    nextBestAction: input.nextBestAction,
    repo: input.repo ?? null,
  });
  markFunnelLabOpened();
  const path = buildContinuityLabOpenUrl("/continuity-lab");
  const url = path.startsWith("http")
    ? path
    : `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function buildLaunchTaskFromContext(context: MemoryOSLaunchContext): string {
  const parts = [
    `Continue project: ${context.project}.`,
    context.repo
      ? `Work directly in repository ${context.repo} and keep code changes scoped to that repo.`
      : null,
    context.currentGoal ? `Goal: ${context.currentGoal}` : null,
    context.briefSummary ? `Brief: ${context.briefSummary}` : null,
    context.nextBestAction ? `Next: ${context.nextBestAction}` : null,
    context.riskyFiles?.length ? `Risky files: ${context.riskyFiles.slice(0, 6).join(", ")}` : null,
    context.openBlockers?.length ? `Known blockers: ${context.openBlockers.slice(0, 4).join("; ")}` : null,
    "If the task is a bug, reproduce it in the connected repo, implement the smallest fix, verify it, and surface the changed files in Changes/PR panels.",
    "Use MemoryOS governance for external writes.",
  ].filter(Boolean);
  return parts.join(" ");
}

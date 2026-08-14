/**
 * Continuity Lab — retrieve + handoff calls for session Memory panel.
 */

import { consoleApiFetch } from "@/lib/console-api";

export type RetrievedMemoryItem = {
  id: string;
  summary: string;
  content: string;
  type?: string;
  confidence?: number;
};

export type HandoffTrace = {
  summary: string;
  currentState: string;
  openLoops: string[];
  recommendedNextActions: string[];
  keyMemories: RetrievedMemoryItem[];
};

export type SessionMemoryExtraction = {
  memoryType: "decision" | "bug_fix" | "experience" | "handoff" | "playbook";
  title: string;
  content: string;
  evidence: string[];
  confidence: number;
  importance: "low" | "medium" | "high";
};

export type SessionHandoffPacket = {
  summary: string;
  injectedContext: RetrievedMemoryItem[];
  newMemories: SessionMemoryExtraction[];
  experienceLearned: string[];
  recommendedNextActions: string[];
  sameBugDetectionHint: string;
};

export type SessionPlaybook = {
  title: string;
  whenToUse: string;
  steps: string[];
  filesTouched: string[];
  commandsToRun: string[];
  risks: string[];
  verification: string[];
};

export type SessionPullRequestDraft = {
  branchName: string;
  title: string;
  body: string;
  testsRun: string[];
  risks: string[];
  filesChanged: string[];
  memoryHighlights: string[];
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

function parseMemoryRow(raw: unknown): RetrievedMemoryItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const content =
    typeof row.content === "string"
      ? row.content.trim()
      : typeof row.text === "string"
        ? row.text.trim()
        : "";
  const summary =
    typeof row.summary === "string"
      ? row.summary.trim()
      : content.slice(0, 160);
  if (!id && !summary && !content) return null;
  return {
    id: id || summary.slice(0, 32),
    summary: summary || content.slice(0, 160),
    content: content || summary,
    type: typeof row.type === "string" ? row.type : typeof row.memoryType === "string" ? row.memoryType : undefined,
    confidence: typeof row.confidence === "number" ? row.confidence : undefined,
  };
}

export async function fetchRelevantMemories(input: {
  projectId: string;
  question: string;
  repo?: string | null;
  topK?: number;
}): Promise<RetrievedMemoryItem[]> {
  const project = input.projectId.trim();
  const question = input.question.trim();
  if (!project || !question) return [];

  try {
    const res = await consoleApiFetch("/api/memory/retrieve", {
      method: "POST",
      body: JSON.stringify({
        project,
        question,
        topK: input.topK ?? 8,
        ...(input.repo?.trim() ? { repo: input.repo.trim() } : {}),
      }),
    });
    if (!res.ok) return [];
    const payload = await res.json();
    const data = unwrapData<{ memories?: unknown[] }>(payload) ?? (payload as { memories?: unknown[] });
    const list = Array.isArray(data?.memories) ? data.memories : [];
    return list.map(parseMemoryRow).filter((m): m is RetrievedMemoryItem => Boolean(m));
  } catch {
    return [];
  }
}

export async function fetchHandoffTrace(input: {
  projectId: string;
  question: string;
  repo?: string | null;
  topK?: number;
}): Promise<HandoffTrace | null> {
  const project = input.projectId.trim();
  const question = input.question.trim();
  if (!project || !question) return null;

  try {
    const res = await consoleApiFetch("/api/memory/handoff", {
      method: "POST",
      body: JSON.stringify({
        project,
        question,
        topK: input.topK ?? 8,
        ...(input.repo?.trim() ? { repo: input.repo.trim() } : {}),
      }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<Record<string, unknown>>(payload) ?? (payload as Record<string, unknown>);
    if (!data) return null;

    const recommended = Array.isArray(data.recommendedNextActions)
      ? (data.recommendedNextActions as unknown[]).filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0,
        )
      : typeof data.nextRecommendedAction === "string" && data.nextRecommendedAction.trim()
        ? [data.nextRecommendedAction.trim()]
        : [];

    const keyRaw = Array.isArray(data.keyMemories) ? data.keyMemories : [];
    const keyMemories = keyRaw.map(parseMemoryRow).filter((m): m is RetrievedMemoryItem => Boolean(m));

    return {
      summary:
        typeof data.summary === "string" && data.summary.trim()
          ? data.summary.trim()
          : "Handoff package from company memory.",
      currentState:
        (typeof data.currentState === "string" && data.currentState.trim()) ||
        (typeof data.lastKnownState === "string" && data.lastKnownState.trim()) ||
        "",
      openLoops: Array.isArray(data.openLoops)
        ? (data.openLoops as unknown[]).filter(
            (x): x is string => typeof x === "string" && x.trim().length > 0,
          )
        : [],
      recommendedNextActions: recommended,
      keyMemories,
    };
  } catch {
    return null;
  }
}

export function retrieveCompanyMemory(input: {
  question: string;
  launchContext?: {
    briefSummary?: string | null;
    currentGoal?: string | null;
    nextBestAction?: string | null;
  } | null;
  memories: RetrievedMemoryItem[];
  handoff: HandoffTrace | null;
}): RetrievedMemoryItem[] {
  const priority: RetrievedMemoryItem[] = [];
  if (input.launchContext?.briefSummary?.trim()) {
    priority.push({
      id: "injected-brief",
      summary: "Injected brief from launch context",
      content: input.launchContext.briefSummary.trim(),
      type: "injected_context",
      confidence: 1,
    });
  }
  if (input.launchContext?.currentGoal?.trim()) {
    priority.push({
      id: "injected-goal",
      summary: "Injected task goal",
      content: input.launchContext.currentGoal.trim(),
      type: "injected_context",
      confidence: 1,
    });
  }
  if (input.launchContext?.nextBestAction?.trim()) {
    priority.push({
      id: "injected-next-action",
      summary: "Injected next action",
      content: input.launchContext.nextBestAction.trim(),
      type: "injected_context",
      confidence: 1,
    });
  }
  return [...priority, ...input.memories].slice(0, 8);
}

export function extractExperienceFromSession(input: {
  question: string;
  files: string[];
  commands: string[];
  worklog: string[];
  memories: RetrievedMemoryItem[];
  handoff: HandoffTrace | null;
}): SessionMemoryExtraction[] {
  const files = input.files.slice(0, 4);
  const commands = input.commands.slice(0, 4);
  const worklog = input.worklog.slice(0, 4);
  const decision = {
    memoryType: "decision" as const,
    title: "Decision memory",
    content:
      input.handoff?.summary?.trim() ||
      `Use the session context to answer: ${input.question.trim().slice(0, 180)}`,
    evidence: [...files, ...commands].slice(0, 5),
    confidence: 0.84,
    importance: "high" as const,
  };
  const bugFix = {
    memoryType: "bug_fix" as const,
    title: "Bug fix memory",
    content:
      files.length > 0
        ? `If this bug repeats, inspect ${files[0]} first and re-run the same verification path.`
        : "If this issue returns, start with the previously inspected file set and verification steps.",
    evidence: [...files, ...worklog].slice(0, 5),
    confidence: 0.8,
    importance: "high" as const,
  };
  const experience = {
    memoryType: "experience" as const,
    title: "Experience learned",
    content:
      input.handoff?.currentState?.trim() ||
      "The session showed how to move from task intake to verified change and handoff.",
    evidence: [...worklog, ...commands].slice(0, 5),
    confidence: 0.76,
    importance: "medium" as const,
  };
  const handoff = {
    memoryType: "handoff" as const,
    title: "Handoff packet",
    content:
      input.handoff?.summary?.trim() ||
      "Summarize the next owner, the current state, and the verification already completed.",
    evidence: input.handoff?.recommendedNextActions.slice(0, 3) ?? [],
    confidence: 0.88,
    importance: "high" as const,
  };
  const playbook = {
    memoryType: "playbook" as const,
    title: "Reusable playbook",
    content: `1. Read injected memory.\n2. Inspect ${files[0] || "the repo"}.\n3. Reproduce the issue.\n4. Apply the smallest fix.\n5. Verify and hand off.`,
    evidence: [...files, ...commands].slice(0, 5),
    confidence: 0.73,
    importance: "medium" as const,
  };

  return [decision, bugFix, experience, handoff, playbook];
}

export function createHandoffPacket(input: {
  question: string;
  injectedMemory: RetrievedMemoryItem[];
  newMemories: SessionMemoryExtraction[];
  handoff: HandoffTrace | null;
}): SessionHandoffPacket {
  return {
    summary:
      input.handoff?.summary?.trim() ||
      `Handoff packet for ${input.question.trim().slice(0, 120)}`,
    injectedContext: input.injectedMemory,
    newMemories: input.newMemories,
    experienceLearned: input.newMemories
      .filter((memory) => memory.memoryType === "experience" || memory.memoryType === "decision")
      .map((memory) => memory.content)
      .slice(0, 4),
    recommendedNextActions: input.handoff?.recommendedNextActions ?? [],
    sameBugDetectionHint:
      "Next time this class of bug appears, compare the current file set and verification steps against this handoff packet first.",
  };
}

export function createPlaybookFromSession(input: {
  question: string;
  files: string[];
  commands: string[];
  newMemories: SessionMemoryExtraction[];
}): SessionPlaybook {
  const file = input.files[0] || "the repo";
  return {
    title: `Playbook: ${input.question.trim().slice(0, 48) || "Session"}`,
    whenToUse: "Use when the same issue, refactor, or handoff pattern appears again.",
    steps: [
      "Load injected context and relevant memories.",
      `Inspect ${file} and reproduce the issue.`,
      "Run the same commands used in the session.",
      "Apply the smallest verified fix.",
      "Package the outcome into a handoff and memory update.",
    ],
    filesTouched: input.files.slice(0, 6),
    commandsToRun: input.commands.slice(0, 6),
    risks: [
      "Do not overwrite unrelated session state.",
      "Keep the patch minimal and re-check verification.",
    ],
    verification: [
      "Re-run the original failing command or test.",
      "Confirm the same bug no longer reproduces.",
    ],
  };
}

function slugifySegment(value: string, fallback = "session"): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || fallback;
}

export function createPullRequestDraftFromSession(input: {
  sessionTitle: string;
  repoFullName: string | null;
  sessionId: string;
  question: string;
  files: string[];
  commands: string[];
  worklog: string[];
  memory: SessionMemoryExtraction[];
  handoff: SessionHandoffPacket | null;
}): SessionPullRequestDraft {
  const repoSegment = input.repoFullName?.split("/").pop() || "repo";
  const branchName = `memoryos/${slugifySegment(input.sessionTitle || input.question, "session")}-${input.sessionId.slice(0, 6)}`;
  const changedFiles = input.files.slice(0, 8);
  const testsRun = input.commands.filter((cmd) => /test|lint|build|check/i.test(cmd)).slice(0, 5);
  const memoryHighlights = input.memory.slice(0, 4).map((item) => `${item.title}: ${item.content}`);
  const summary = input.handoff?.summary?.trim() || input.question.trim();
  const body = [
    `## Summary`,
    summary ? summary : `Session work for ${repoSegment}.`,
    "",
    `## What changed`,
    ...(changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`) : ["- No tracked file list captured yet"]),
    "",
    `## Tests run`,
    ...(testsRun.length > 0 ? testsRun.map((cmd) => `- ${cmd}`) : ["- No explicit tests recorded"]),
    "",
    `## Risks`,
    ...((input.handoff?.newMemories ?? []).length > 0
      ? input.handoff!.newMemories
          .filter((m) => m.importance === "high")
          .slice(0, 3)
          .map((m) => `- ${m.title}`)
      : ["- Review the generated diff before merge"]),
    "",
    `## MemoryOS handoff`,
    ...(memoryHighlights.length > 0 ? memoryHighlights.map((line) => `- ${line}`) : ["- No memory highlights extracted yet"]),
  ].join("\n");

  return {
    branchName,
    title: input.sessionTitle.trim()
      ? `${input.sessionTitle.trim().slice(0, 72)}`
      : `MemoryOS session update for ${repoSegment}`,
    body,
    testsRun: testsRun.length > 0 ? testsRun : ["No explicit tests recorded"],
    risks:
      input.handoff?.newMemories
        .filter((m) => m.importance === "high")
        .slice(0, 3)
        .map((m) => m.title) ?? ["Review the generated diff before merge"],
    filesChanged: changedFiles,
    memoryHighlights: memoryHighlights.length > 0 ? memoryHighlights : ["No memory highlights extracted yet"],
  };
}

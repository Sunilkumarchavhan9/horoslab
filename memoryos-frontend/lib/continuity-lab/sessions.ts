/**
 * Continuity Lab session list and creation.
 *
 * MemoryOS-native shell backed by OpenHands app-conversations.
 */

import { saveMemoryOSLaunchContext } from "@/lib/continuity-launch-context";
import { markFunnelLabOpened } from "@/lib/company-brain-funnel";
import {
  buildLaunchContextFromBrief,
  buildOperationalSystemSuffix,
  compactBriefSummary,
  fetchResumeBrief,
  projectIdForLab,
  saveOperationalLaunchContext,
  type OperationalResumeBrief,
} from "@/lib/continuity-lab/resume-brief";
import { saveResumeProject } from "@/lib/continuity-launch-context";
import {
  formatUnderstandingForSystemSuffix,
  type PromptUnderstandingSummary,
} from "@/lib/continuity-lab/prompt-understanding-stub";
import {
  getAppConversationStartTask,
  startAppConversationTask,
} from "@/lib/continuity-lab/openhands-api";
import { readAskOsPreference } from "@/lib/continuity-lab/ask-os-preference";
import { fetchRepoIndexStatus } from "@/lib/continuity-lab/wiki-api";

const LOCAL_SESSIONS_KEY = "memoryos.continuity-lab.recent-sessions";

async function resolveRepoIndexStartupLine(
  repoFullName: string | null | undefined,
  projectId: string,
): Promise<string | null> {
  const repo = repoFullName?.trim();
  if (!repo) return null;

  const fallbackLine =
    `Repository index status for ${repo} is currently unavailable. Start by scoping all work to this repo and continue while index metadata refreshes in the background.`;

  try {
    const status = (await Promise.race([
      fetchRepoIndexStatus(repo, projectId),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ])) as Awaited<ReturnType<typeof fetchRepoIndexStatus>> | null;

    if (!status) return fallbackLine;
    if (status.status === "indexed") {
      return `Repository index is ready for ${repo}. Start by using indexed context first, then ask for missing details only if blocked.`;
    }
    if (status.status === "generating") {
      return `Repository index is still generating for ${repo}. Begin work with current context now and note that indexed coverage is in progress.`;
    }
    return `Repository index is not ready yet for ${repo}. Keep scope on this repo, state this limitation, and proceed with best-effort runtime analysis.`;
  } catch {
    return fallbackLine;
  }
}

export type LabSessionSource = "memoryos" | "product_agent" | "continuity_thread";

export type LabSessionSummary = {
  id: string;
  title: string;
  repo: string | null;
  createdAt: string;
  updatedAt: string;
  source: LabSessionSource;
  status?: string | null;
  creator?: string | null;
  tags?: string[];
  playbook?: string | null;
  prUrls?: string[];
  executionStatus?: string | null;
  sandboxStatus?: string | null;
  navigable?: boolean;
};

export function readLocalSessions(): LabSessionSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<LabSessionSummary>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Partial<LabSessionSummary> & { id: string; updatedAt: string } =>
        Boolean(item?.id && item?.updatedAt),
      )
      .map((item) => ({
        id: item.id!,
        title: item.title?.trim() || "Untitled session",
        repo: item.repo ?? null,
        createdAt: item.createdAt ?? item.updatedAt!,
        updatedAt: item.updatedAt!,
        source: item.source ?? "memoryos",
        navigable: item.navigable ?? true,
      }));
  } catch {
    return [];
  }
}

function writeLocalSessions(sessions: LabSessionSummary[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions.slice(0, 24)));
}

export function rememberLocalSession(session: LabSessionSummary): void {
  if (typeof window === "undefined") return;
  const existing = readLocalSessions().filter((s) => s.id !== session.id);
  writeLocalSessions([session, ...existing]);
}

export async function searchLabSessions(
  limit = 12,
): Promise<LabSessionSummary[]> {
  return readLocalSessions()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export type StartLabSessionInput = {
  prompt: string;
  project?: string;
  repo?: string | null;
  llmModel?: string | null;
  operationalBrief?: OperationalResumeBrief | null;
  briefQuestion?: string;
  useCompanyMemory?: boolean;
  understandingApprovedSummary?: PromptUnderstandingSummary | null;
};

export async function startLabSessionWithBrief(
  input: StartLabSessionInput,
): Promise<{ sessionPath: string; conversationId: string }> {
  const project =
    input.project?.trim() ||
    projectIdForLab({ repoFullName: input.repo, fallbackProject: null });
  const projectId = projectIdForLab({
    repoFullName: input.repo,
    fallbackProject: project,
  });

  const useCompanyMemory = input.useCompanyMemory !== false;
  let brief = input.operationalBrief ?? null;
  if (!brief && useCompanyMemory) {
    brief = await fetchResumeBrief({
      projectId,
      repo: input.repo ?? null,
      question: input.briefQuestion,
    });
  }

  if (brief) {
    saveOperationalLaunchContext(
      buildLaunchContextFromBrief({ project: projectId, repo: input.repo ?? null, brief }),
    );
    saveResumeProject(projectId);
  } else {
    saveMemoryOSLaunchContext({
      project: projectId,
      briefSummary: input.prompt.trim().slice(0, 280),
      repo: input.repo ?? null,
    });
    saveResumeProject(projectId);
  }

  return createLabSession({
    ...input,
    project: projectId,
    operationalBrief: brief,
  });
}

export async function createLabSession(input: StartLabSessionInput): Promise<{
  sessionPath: string;
  conversationId: string;
}> {
  const project = input.project?.trim() || "continuity-lab-workspace";
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("Enter a task for MemoryOS to work on.");
  }

  if (!input.operationalBrief) {
    saveMemoryOSLaunchContext({
      project,
      briefSummary: prompt.slice(0, 280),
      repo: input.repo ?? null,
    });
  }
  markFunnelLabOpened();

  const operationalSuffix = input.operationalBrief
    ? buildOperationalSystemSuffix(input.operationalBrief)
    : null;
  const understandingSuffix = input.understandingApprovedSummary
    ? formatUnderstandingForSystemSuffix(input.understandingApprovedSummary)
    : null;
  const briefLine = input.operationalBrief
    ? `Continue project ${project}. ${compactBriefSummary(input.operationalBrief)}`
    : `Continue project: ${project}. Use MemoryOS governance for external writes.`;

  const summary = [
    "You are the MemoryOS native session workspace.",
    briefLine,
    operationalSuffix,
    understandingSuffix,
  ]
    .filter(Boolean)
    .join("\n\n");

  const preferredOs =
    typeof window !== "undefined" ? readAskOsPreference() : "ubuntu";
  const repoIndexStartupLine = await resolveRepoIndexStartupLine(input.repo, project);
  const repoScopeLine = input.repo
    ? [
        `Repository scope: ${input.repo}.`,
        "Do not block session startup on repository clone. If live repo access is unavailable, explain the exact connector/token step needed and continue with available MemoryOS context.",
      ].join(" ")
    : "No repository is selected yet. Ask for a repo only if the task requires code access.";
  const sessionBehaviorLine = [
    `Preferred sandbox platform: ${preferredOs === "windows" ? "Windows" : "Ubuntu"}.`,
    repoScopeLine,
    repoIndexStartupLine,
    "Start by responding in the session workspace; ask at most one clarifying question only when truly blocked.",
  ].join("\n");
  const conversation = await startAppConversationTask({
    prompt,
    title: prompt.slice(0, 80),
    selectedRepository: input.repo ?? null,
    selectedBranch: null,
    llmModel: input.llmModel ?? null,
    systemMessageSuffix: [summary, sessionBehaviorLine].filter(Boolean).join("\n\n"),
  });

  const conversationId = `task-${conversation.id}`;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      `memoryos.continuity-lab.launch-sent.${conversationId}`,
      "1",
    );
  }
  const now = new Date().toISOString();
  rememberLocalSession({
    id: conversationId,
    title: prompt.slice(0, 80),
    repo: input.repo ?? null,
    createdAt: now,
    updatedAt: now,
    source: "memoryos",
    navigable: true,
    status: "starting",
    sandboxStatus: "starting",
    executionStatus: "starting",
  });

  return {
    conversationId,
    sessionPath: `/continuity-lab/session/${conversationId}`,
  };
}

export async function resolveSessionRouteId(conversationId: string): Promise<string> {
  if (conversationId.startsWith("task-")) {
    const task = await getAppConversationStartTask(conversationId);
    if (task?.status === "READY" && task.app_conversation_id) {
      return task.app_conversation_id;
    }
    const latestRuntimeSession = readLocalSessions()
      .filter((session) => !session.id.startsWith("task-") && session.navigable !== false)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (latestRuntimeSession) {
      return latestRuntimeSession.id;
    }
    return conversationId;
  }
  return conversationId;
}

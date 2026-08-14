/**
 * Company Brain onboarding funnel: connect GitHub → sync → continue brief → Continuity Lab.
 */

export const COMPANY_BRAIN_FUNNEL_ACTIVE_KEY = "memoryos.company-brain.funnel.active";
export const COMPANY_BRAIN_FUNNEL_FOCUS_KEY = "memoryos.company-brain.funnel.focus";
export const COMPANY_BRAIN_FUNNEL_DISMISSED_KEY = "memoryos.company-brain.funnel.dismissed";

export type CompanyBrainFunnelStepId =
  | "connect_github"
  | "sync_github"
  | "continue_brief"
  | "open_lab";

export type FunnelStepStatus = "pending" | "current" | "done";

export const COMPANY_BRAIN_FUNNEL_STEPS: Array<{
  id: CompanyBrainFunnelStepId;
  title: string;
  description: string;
}> = [
  {
    id: "connect_github",
    title: "Connect GitHub",
    description: "Link the repo where your team already works.",
  },
  {
    id: "sync_github",
    title: "First sync",
    description: "Ingest PRs, issues, and decisions into structured memory.",
  },
  {
    id: "continue_brief",
    title: "Continue project brief",
    description: "Generate a structured brief from organizational memory.",
  },
  {
    id: "open_lab",
    title: "Open Continuity Lab",
    description: "Chat with live intelligence and hand off to any model.",
  },
];

export type FunnelProgressInput = {
  githubConnected: boolean;
  githubSynced: boolean;
  /** True when any connector sync produced contract-category memories (P0.2). */
  hasStructuredIngest?: boolean;
  hasBrief: boolean;
  labOpened: boolean;
};

export function isFunnelActive(): boolean {
  if (typeof window === "undefined") return false;
  if (window.sessionStorage.getItem(COMPANY_BRAIN_FUNNEL_DISMISSED_KEY) === "1") {
    return false;
  }
  return window.sessionStorage.getItem(COMPANY_BRAIN_FUNNEL_ACTIVE_KEY) === "1";
}

export function activateCompanyBrainFunnel(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(COMPANY_BRAIN_FUNNEL_ACTIVE_KEY, "1");
  window.sessionStorage.removeItem(COMPANY_BRAIN_FUNNEL_DISMISSED_KEY);
}

export function focusFunnelOnGithub(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(COMPANY_BRAIN_FUNNEL_FOCUS_KEY, "github");
}

export function clearFunnelFocus(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(COMPANY_BRAIN_FUNNEL_FOCUS_KEY);
}

export function dismissCompanyBrainFunnel(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(COMPANY_BRAIN_FUNNEL_DISMISSED_KEY, "1");
  window.sessionStorage.removeItem(COMPANY_BRAIN_FUNNEL_ACTIVE_KEY);
  window.sessionStorage.removeItem(COMPANY_BRAIN_FUNNEL_FOCUS_KEY);
  void patchServerFunnelProgress({ dismissed: true });
}

export type ServerFunnelProgress = {
  connectGithub: boolean;
  syncGithub: boolean;
  briefLoaded: boolean;
  labOpened: boolean;
  proposalCreated?: boolean;
  proposalApproved?: boolean;
  approved?: boolean;
  executed?: boolean;
  resumed?: boolean;
  lastProject?: string | null;
  dismissed: boolean;
};

export type ContinuityLoopProgress = {
  briefGenerated: boolean;
  labOpened: boolean;
  proposalCreated: boolean;
  approved: boolean;
  executed: boolean;
  resumed: boolean;
  lastProject: string | null;
};

export type ContinuityLoopStepId =
  | "connect_github"
  | "sync_github"
  | "continue_brief"
  | "open_lab"
  | "agent_work"
  | "approve_proposal"
  | "execute_outcome"
  | "resume_project";

export const CONTINUITY_LOOP_STEPS: Array<{
  id: ContinuityLoopStepId;
  title: string;
  description: string;
  href?: string;
}> = [
  {
    id: "connect_github",
    title: "Connect GitHub",
    description: "Link the repo where your team already works.",
    href: "/mission-control?tab=Connected%20Intelligence%20Sources",
  },
  {
    id: "sync_github",
    title: "Ingest",
    description: "Sync PRs, issues, and decisions into structured memory.",
    href: "/mission-control?tab=Connected%20Intelligence%20Sources",
  },
  {
    id: "continue_brief",
    title: "Continue brief",
    description: "Generate a structured project brief from organizational memory.",
    href: "/playground",
  },
  {
    id: "open_lab",
    title: "Continuity Lab",
    description: "Open the governed agent workspace with your brief.",
    href: "/continuity-lab",
  },
  {
    id: "agent_work",
    title: "Agent work",
    description: "Let the agent inspect the repo and propose governed changes.",
    href: "/continuity-lab",
  },
  {
    id: "approve_proposal",
    title: "Human approves",
    description: "Review execution proposals in Governance before external writes.",
    href: "/mission-control?tab=Security%20%2B%20Governance",
  },
  {
    id: "execute_outcome",
    title: "Execute",
    description: "Run the approved action; outcome is saved to action memory.",
    href: "/mission-control?tab=Action%20Lineage",
  },
  {
    id: "resume_project",
    title: "Resume later",
    description: "Return to Playground with execution history in the next brief.",
    href: "/playground",
  },
];

export type CompanyBrainFunnelIngestion = {
  contractCountsByCategory: Record<string, number>;
  lastSyncSource: string | null;
  lastSyncAt: string | null;
  totalContractMemories: number;
  distinctCategories: number;
  thresholds: {
    minContractMemories: number;
    minDistinctCategories: number;
  };
  syncGithubThresholdMet: boolean;
};

export type CompanyBrainFunnelApiResponse = {
  progress: ServerFunnelProgress & {
    contractCountsByCategory?: Record<string, number>;
    lastSyncSource?: string | null;
    lastSyncAt?: string | null;
    proposalCreated?: boolean;
    proposalApproved?: boolean;
    executed?: boolean;
    resumed?: boolean;
  };
  ingestion: CompanyBrainFunnelIngestion;
  steps: {
    connectGithub: boolean;
    syncGithub: boolean;
    briefLoaded: boolean;
    labOpened: boolean;
  };
  continuityLoop?: ContinuityLoopProgress;
};

export function formatContractCategoryCounts(counts?: Record<string, number>): string {
  if (!counts) return "";
  return Object.entries(counts)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key.replace(/_/g, " ")}=${value}`)
    .join(" · ");
}

export function formatLastSyncSourceLabel(source: string | null | undefined): string {
  if (!source) return "No sync yet";
  return source
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseFunnelApiPayload(payload: unknown): CompanyBrainFunnelApiResponse | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as {
    data?: CompanyBrainFunnelApiResponse;
    progress?: CompanyBrainFunnelApiResponse["progress"];
    ingestion?: CompanyBrainFunnelIngestion;
    steps?: CompanyBrainFunnelApiResponse["steps"];
    continuityLoop?: ContinuityLoopProgress;
  };
  const nested = root.data;
  if (nested?.progress && nested.ingestion) {
    return {
      ...nested,
      continuityLoop: nested.continuityLoop ?? continuityLoopFromProgress(nested.progress),
    };
  }
  if (root.progress && root.ingestion && root.steps) {
    return {
      progress: root.progress,
      ingestion: root.ingestion,
      steps: root.steps,
      continuityLoop:
        root.continuityLoop ??
        nested?.continuityLoop ??
        continuityLoopFromProgress(root.progress),
    };
  }
  if (root.progress) {
    const progress = root.progress;
    return {
      progress,
      continuityLoop: continuityLoopFromProgress(progress),
      ingestion: {
        contractCountsByCategory: progress.contractCountsByCategory ?? {},
        lastSyncSource: progress.lastSyncSource ?? null,
        lastSyncAt: progress.lastSyncAt ?? null,
        totalContractMemories: 0,
        distinctCategories: 0,
        thresholds: { minContractMemories: 1, minDistinctCategories: 1 },
        syncGithubThresholdMet: Boolean(progress.syncGithub),
      },
      steps: {
        connectGithub: progress.connectGithub,
        syncGithub: progress.syncGithub,
        briefLoaded: progress.briefLoaded,
        labOpened: progress.labOpened,
      },
    };
  }
  return null;
}

async function readJsonIfPresent<T>(response: Response): Promise<T | null> {
  const text = await response.text().catch(() => "");
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchCompanyBrainFunnel(
  authHeaders: HeadersInit,
): Promise<CompanyBrainFunnelApiResponse | null> {
  try {
    const res = await fetch("/api/memory/company-brain/funnel", {
      headers: authHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = await readJsonIfPresent<unknown>(res);
    return parseFunnelApiPayload(payload);
  } catch {
    return null;
  }
}

export async function fetchServerFunnelProgress(
  authHeaders: HeadersInit,
): Promise<ServerFunnelProgress | null> {
  const funnel = await fetchCompanyBrainFunnel(authHeaders);
  if (!funnel) return null;
  return {
    connectGithub: funnel.progress.connectGithub,
    syncGithub: funnel.progress.syncGithub,
    briefLoaded: funnel.progress.briefLoaded,
    labOpened: funnel.progress.labOpened,
    dismissed: funnel.progress.dismissed ?? false,
  };
}

export function continuityLoopFromProgress(
  progress: Partial<ServerFunnelProgress> & {
    proposalCreated?: boolean;
    proposalApproved?: boolean;
  },
): ContinuityLoopProgress {
  return {
    briefGenerated: Boolean(progress.briefLoaded),
    labOpened: Boolean(progress.labOpened),
    proposalCreated: Boolean(progress.proposalCreated),
    approved: Boolean(progress.proposalApproved ?? progress.approved),
    executed: Boolean(progress.executed),
    resumed: Boolean(progress.resumed),
    lastProject:
      typeof progress.lastProject === "string" && progress.lastProject.trim()
        ? progress.lastProject.trim()
        : null,
  };
}

export type ContinuityLoopProgressInput = FunnelProgressInput & {
  proposalCreated?: boolean;
  approved?: boolean;
  executed?: boolean;
  resumed?: boolean;
};

export function deriveContinuityLoopStepStatuses(
  input: ContinuityLoopProgressInput,
): Record<ContinuityLoopStepId, FunnelStepStatus> {
  const doneConnect = input.githubConnected;
  const doneSync = input.githubSynced || Boolean(input.hasStructuredIngest);
  const doneBrief = input.hasBrief;
  const doneLab = input.labOpened;
  const doneProposal = Boolean(input.proposalCreated);
  const doneAgent = doneProposal;
  const doneApprove = Boolean(input.approved);
  const doneExecute = Boolean(input.executed);
  const doneResume = Boolean(input.resumed);

  const firstPending: ContinuityLoopStepId = !doneConnect
    ? "connect_github"
    : !doneSync
      ? "sync_github"
      : !doneBrief
        ? "continue_brief"
        : !doneLab
          ? "open_lab"
          : !doneAgent
            ? "agent_work"
            : !doneApprove
              ? "approve_proposal"
              : !doneExecute
                ? "execute_outcome"
                : !doneResume
                  ? "resume_project"
                  : "resume_project";

  const statusFor = (id: ContinuityLoopStepId): FunnelStepStatus => {
    const doneMap: Record<ContinuityLoopStepId, boolean> = {
      connect_github: doneConnect,
      sync_github: doneSync,
      continue_brief: doneBrief,
      open_lab: doneLab,
      agent_work: doneAgent,
      approve_proposal: doneApprove,
      execute_outcome: doneExecute,
      resume_project: doneResume,
    };
    if (doneMap[id]) return "done";
    const prerequisites: Record<ContinuityLoopStepId, boolean> = {
      connect_github: true,
      sync_github: doneConnect,
      continue_brief: doneSync,
      open_lab: doneBrief,
      agent_work: doneLab,
      approve_proposal: doneLab,
      execute_outcome: doneApprove || doneProposal,
      resume_project: doneExecute,
    };
    if (!prerequisites[id]) return "pending";
    return firstPending === id ? "current" : "pending";
  };

  return CONTINUITY_LOOP_STEPS.reduce(
    (acc, step) => {
      acc[step.id] = statusFor(step.id);
      return acc;
    },
    {} as Record<ContinuityLoopStepId, FunnelStepStatus>,
  );
}

export async function patchServerFunnelProgress(
  patch: Partial<ServerFunnelProgress> & {
    briefGenerated?: boolean;
    proposalCreated?: boolean;
    approved?: boolean;
  },
  authHeaders?: HeadersInit,
): Promise<CompanyBrainFunnelApiResponse | null> {
  if (typeof window === "undefined") return null;
  try {
    const { mergeMemoryOSOrgHeaders } = await import("@/lib/org-scope-client");
    let headers: HeadersInit = mergeMemoryOSOrgHeaders({
      "Content-Type": "application/json",
      ...(authHeaders ?? {}),
    });
    if (!new Headers(headers).get("Authorization")) {
      const { getOrCreateMemoryTokenWithRetry } = await import("@/lib/memory-token");
      const token = await getOrCreateMemoryTokenWithRetry({ attempts: 1, delayMs: 100 });
      if (!token) return null;
      headers = mergeMemoryOSOrgHeaders({
        ...Object.fromEntries(new Headers(headers).entries()),
        Authorization: `Bearer ${token}`,
      });
    }
    const res = await fetch("/api/memory/company-brain/funnel", {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    });
    if (!res.ok) return null;
    const payload = await readJsonIfPresent<unknown>(res);
    return parseFunnelApiPayload(payload);
  } catch {
    return null;
  }
}

export function markFunnelLabOpened(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("memoryos.company-brain.funnel.lab", "1");
  void patchServerFunnelProgress({ labOpened: true });
}

export function markFunnelResumed(project?: string): void {
  void patchServerFunnelProgress({
    resumed: true,
    ...(project?.trim() ? { lastProject: project.trim() } : {}),
  });
}

export function isFunnelLabOpened(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem("memoryos.company-brain.funnel.lab") === "1";
}

export function markFunnelBriefLoaded(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("memoryos.company-brain.funnel.brief", "1");
  void patchServerFunnelProgress({ briefLoaded: true });
}

export function isFunnelBriefLoaded(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem("memoryos.company-brain.funnel.brief") === "1";
}

export function deriveFunnelStepStatuses(
  input: FunnelProgressInput,
): Record<CompanyBrainFunnelStepId, FunnelStepStatus> {
  const doneConnect = input.githubConnected;
  const doneSync = input.githubSynced || Boolean(input.hasStructuredIngest);
  const doneBrief = input.hasBrief;
  const doneLab = input.labOpened;

  const firstPending: CompanyBrainFunnelStepId = !doneConnect
    ? "connect_github"
    : !doneSync
      ? "sync_github"
      : !doneBrief
        ? "continue_brief"
        : !doneLab
          ? "open_lab"
          : "open_lab";

  const statusFor = (id: CompanyBrainFunnelStepId): FunnelStepStatus => {
    if (id === "connect_github") {
      if (doneConnect) return "done";
      return firstPending === "connect_github" ? "current" : "pending";
    }
    if (id === "sync_github") {
      if (doneSync) return "done";
      if (!doneConnect) return "pending";
      return firstPending === "sync_github" ? "current" : "pending";
    }
    if (id === "continue_brief") {
      if (doneBrief) return "done";
      if (!doneSync) return "pending";
      return firstPending === "continue_brief" ? "current" : "pending";
    }
    if (doneLab) return "done";
    if (!doneBrief) return "pending";
    return firstPending === "open_lab" ? "current" : "pending";
  };

  return {
    connect_github: statusFor("connect_github"),
    sync_github: statusFor("sync_github"),
    continue_brief: statusFor("continue_brief"),
    open_lab: statusFor("open_lab"),
  };
}

export function isFunnelComplete(input: FunnelProgressInput): boolean {
  const synced = input.githubSynced || Boolean(input.hasStructuredIngest);
  return input.githubConnected && synced && input.hasBrief && input.labOpened;
}

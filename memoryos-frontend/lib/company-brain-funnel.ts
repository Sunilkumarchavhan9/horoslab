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
  dismissed: boolean;
};

export async function fetchServerFunnelProgress(
  authHeaders: HeadersInit,
): Promise<ServerFunnelProgress | null> {
  try {
    const res = await fetch("/api/memory/company-brain/funnel", {
      headers: authHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      data?: { progress?: ServerFunnelProgress };
      progress?: ServerFunnelProgress;
    };
    return payload.data?.progress ?? payload.progress ?? null;
  } catch {
    return null;
  }
}

export async function patchServerFunnelProgress(
  patch: Partial<ServerFunnelProgress>,
  authHeaders?: HeadersInit,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    let headers: HeadersInit = { "Content-Type": "application/json", ...(authHeaders ?? {}) };
    if (!("Authorization" in headers)) {
      const { getOrCreateMemoryTokenWithRetry } = await import("@/lib/memory-token");
      const token = await getOrCreateMemoryTokenWithRetry({ attempts: 1, delayMs: 100 });
      if (!token) return;
      headers = { ...headers, Authorization: `Bearer ${token}` };
    }
    await fetch("/api/memory/company-brain/funnel", {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    });
  } catch {
    // best-effort
  }
}

export function markFunnelLabOpened(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("memoryos.company-brain.funnel.lab", "1");
  void patchServerFunnelProgress({ labOpened: true });
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
  const doneSync = input.githubSynced;
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
  return (
    input.githubConnected &&
    input.githubSynced &&
    input.hasBrief &&
    input.labOpened
  );
}

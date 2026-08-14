"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  Bell,
  Bot,
  Copy,
  Edit,
  EyeOff,
  ExternalLink,
  FileDiff,
  Globe,
  History,
  Maximize2,
  Minimize2,
  Monitor,
  MoreHorizontal,
  Pin,
  Plus,
  Power,
  RotateCcw,
  Search,
  Settings,
  Square,
  Star,
  Terminal,
  Upload,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExecutionProposeModalPrefill } from "@/components/continuity-lab/continuity-lab-execution-propose-modal";
import { ContinuityLabSessionContinuityPanel } from "@/components/continuity-lab/continuity-lab-session-continuity-panel";
import { ContinuityLabPrReviewPanel } from "@/components/continuity-lab/continuity-lab-pr-review-panel";
import type { MemoryOSLaunchContext } from "@/lib/continuity-launch-context";
import {
  fetchResumeBrief,
  type OperationalResumeBrief,
} from "@/lib/continuity-lab/resume-brief";
import type {
  FileChangeEntry,
  PrReadyArtifact,
  ShellLineEntry,
  WorklogEntry,
} from "@/lib/continuity-lab/chat-events";
import type {
  SessionHandoffPacket,
  SessionMemoryExtraction,
  SessionPlaybook,
} from "@/lib/continuity-lab/continuity-memory-api";
import type {
  GitHubRepoBranchEntry,
  GitHubPullRequestDetail,
  GitHubRepoPullRequestEntry,
} from "@/lib/continuity-lab/wiki-api";
import { fetchGitHubPullRequest } from "@/lib/continuity-lab/wiki-api";
import {
  fetchExecutionHistory,
  formatLineageSummary,
  type ExecutionLineageItem,
} from "@/lib/continuity-lab/operational-api";
import {
  mergePrReview,
  savePrReviewActionMemory,
} from "@/lib/continuity-lab/pr-review-actions-api";
import { type MemoryOSTMShellLiveSnapshot } from "@/lib/continuity-lab/memoryostm-shell-session-api";
import {
  getRuntimeThread,
  listThreadArtifacts,
  listThreadHandoffs,
  submitRuntimeReviewDecision,
  type RuntimeAgentHandoff,
  type RuntimeArtifact,
  type RuntimeDesktopInputEvent,
  type RuntimeDesktopStreamState,
  type RuntimeExecutionStep,
  type RuntimeExecutionState,
  type RuntimeThread,
} from "@/lib/continuity-lab/openhands-api";
import { buildPrReviewViewModel } from "@/lib/continuity-lab/pr-review-model";
import { fetchMemoryOSTMShellSync } from "@/lib/continuity-lab/memoryostm-shell-sync-api";
import type {
  MemoryOSTMShellSyncEntry,
  MemoryOSTMShellSyncSnapshot,
} from "@/lib/continuity-lab/memoryostm-shell-sync";
import { useAgentStore } from "@/lib/continuity-lab/agent-store";
import { cn } from "@/lib/utils";
import { ContinuityLabMultiAgentPanel } from "@/components/continuity-lab/continuity-lab-multi-agent-panel";
import { ContinuityLabSessionShellTerminal } from "@/components/continuity-lab/continuity-lab-session-shell-terminal";

export type SessionRailPanel =
  | null
  | "session"
  | "changes"
  | "worklog"
  | "shell"
  | "desktop"
  | "agents"
  | "pr"
  | "memory";
type RailTabId = Extract<
  SessionRailPanel,
  | "session"
  | "changes"
  | "worklog"
  | "shell"
  | "desktop"
  | "agents"
  | "pr"
  | "memory"
>;

type ContinuityLabSessionRailProps = {
  focusChangePath?: string | null;
  panel: SessionRailPanel;
  onPanelChange: (panel: SessionRailPanel) => void;
  fileChanges: FileChangeEntry[];
  worklog: WorklogEntry[];
  shellLines: ShellLineEntry[];
  vscodeUrl: string | null;
  desktopControlUrl?: string | null;
  desktopWaiting: boolean;
  desktopReady: boolean;
  wakingDesktop?: boolean;
  showWriteBackBanner: boolean;
  writeBackPrefill?: ExecutionProposeModalPrefill;
  onOpenPropose: (prefill?: ExecutionProposeModalPrefill) => void;
  onDismissWriteBackBanner: () => void;
  labProjectId: string;
  sessionId: string;
  repoFullName: string | null;
  sessionQuestion?: string | null;
  launchContext: MemoryOSLaunchContext | null;
  sessionMemories: SessionMemoryExtraction[];
  handoffPacket: SessionHandoffPacket | null;
  playbook: SessionPlaybook | null;
  sessionTitle: string;
  defaultBranch: string;
  repoBranches?: GitHubRepoBranchEntry[];
  repoPulls: GitHubRepoPullRequestEntry[];
  governanceRefresh: number;
  onGovernanceExecuted: (project: string | null) => void;
  railExpanded: boolean;
  onToggleRailExpanded: () => void;
  railFullscreen?: boolean;
  onToggleRailFullscreen?: () => void;
  onToggleTabsPanel?: () => void;
  onWakeDesktop?: () => void;
  onDesktopInput?: (event: RuntimeDesktopInputEvent) => void;
  desktopStreamState?: RuntimeDesktopStreamState | null;
  desktopAutoReconnecting?: boolean;
  desktopReconnectAttemptCount?: number;
  className?: string;
};

const RAIL_TABS: {
  id: RailTabId;
  label: string;
  icon: typeof Monitor;
  description: string;
}[] = [
  {
    id: "changes",
    label: "Changes",
    icon: FileDiff,
    description: "See file edits",
  },
  {
    id: "worklog",
    label: "Worklog",
    icon: History,
    description: "Agent history and actions",
  },
  {
    id: "shell",
    label: "Shell",
    icon: Terminal,
    description: "Command history",
  },
  {
    id: "pr",
    label: "PR",
    icon: ExternalLink,
    description: "Review PR readiness and linked pull requests",
  },
  {
    id: "agents",
    label: "Agents",
    icon: Bot,
    description: "Manager, coder, reviewer, verifier runtime board",
  },
  {
    id: "memory",
    label: "Continuity",
    icon: Archive,
    description: "Open Company Brain and Mythic lineage context",
  },
];

function EmptyCenter({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center px-4 text-center text-[32px] text-white/60">
      <p className="text-lg text-white/65">{text}</p>
    </div>
  );
}

function PanelIntro({
  eyebrow,
  title,
  description,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string | null;
}) {
  return (
    <div className="m-2 mb-0 rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
        {eyebrow}
      </p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/90">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50">
            {description}
          </p>
        </div>
        {meta ? (
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
            {meta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function formatWorkerStatusLabel(
  status?: RuntimeExecutionState["workerStatus"] | null,
  blockedReason?: RuntimeExecutionState["blockedReason"] | null,
) {
  if (blockedReason) return blockedReason.replaceAll("_", " ");
  if (status === "running") return "Worker running";
  if (status === "queued") return "Queued";
  if (status === "blocked") return "Blocked";
  if (status === "awaiting_review_decision") return "Awaiting review decision";
  if (status === "awaiting_pr_result") return "Awaiting PR result";
  if (status === "completed") return "Completed";
  return "Idle";
}

function toShellHistoryEntry(entry: MemoryOSTMShellSyncEntry) {
  return {
    id: `shell-hook-${entry.id}`,
    at: entry.at,
    kind: entry.kind,
    title: entry.title,
    output: entry.output ?? null,
    detail:
      entry.kind === "command"
        ? (entry.detail ?? "Shell command")
        : entry.kind === "prompt"
          ? (entry.detail ?? "Prompt submitted")
          : entry.kind === "session"
            ? (entry.detail ?? "Session lifecycle")
            : (entry.detail ?? "Runtime execution"),
    tone: "default" as const,
  };
}

type ShellHistoryEntry = {
  id: string;
  at: string;
  kind: "command" | "runtime" | "prompt" | "session";
  title: string;
  output: string | null;
  detail: string | null;
  tone: "default" | "info" | "warn" | "error";
  state?: "starting" | "working" | "waiting" | "error" | "closed";
};

function formatStepState(step: RuntimeExecutionStep) {
  if (step.status === "done") return "Completed";
  if (step.status === "running") return "Active";
  if (step.status === "failed") return "Failed";
  if (step.status === "skipped") return "Skipped";
  if (step.approvalStatus === "rejected") return "Revision needed";
  if (step.approvalStatus === "pending") return "Awaiting approval";
  if (step.approvalStatus === "approved") return "Approved";
  return "Queued";
}

function formatStepReason(
  step: RuntimeExecutionStep,
  blockedReason?: string | null,
) {
  return (
    step.failureReason ||
    step.revisionReason ||
    (step.approvalStatus === "pending"
      ? "Waiting for reviewer decision."
      : null) ||
    (step.approvalStatus === "rejected"
      ? "Reviewer requested another pass."
      : null) ||
    blockedReason?.replaceAll("_", " ") ||
    null
  );
}

function plannerTone(step: RuntimeExecutionStep, isActive: boolean) {
  if (step.status === "failed" || step.approvalStatus === "rejected") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  }
  if (isActive || step.status === "running") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }
  if (step.status === "done" || step.approvalStatus === "approved") {
    return "border-indigo-500/25 bg-indigo-500/10 text-indigo-100";
  }
  if (step.approvalStatus === "pending") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-100";
  }
  return "border-white/10 bg-white/[0.03] text-white/85";
}

function LineageReasonList({
  brief,
}: {
  brief: OperationalResumeBrief | null;
}) {
  const reasons = brief?.whyTheseMemoriesWereSelected ?? [];
  if (reasons.length === 0) {
    return (
      <p className="text-[11px] text-white/45">
        No reused lineage has been attached yet.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {reasons.slice(0, 3).map((reason) => {
        const mythicTags = (reason.reasonTags ?? []).filter((tag) =>
          tag.includes("mythic_"),
        );
        return (
          <div
            key={reason.memoryId}
            className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[11px] text-white/80"
          >
            <p>{reason.summary}</p>
            <p className="mt-1 text-[10px] text-white/45">
              Score {reason.finalScore.toFixed(3)}
              {reason.contractCategory ? ` · ${reason.contractCategory}` : ""}
            </p>
            {mythicTags.length > 0 ? (
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-300/85">
                Mythic lineage: {mythicTags.join(", ")}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function RailSessionMenu() {
  const rows = [
    { label: "Archive", icon: Archive },
    { label: "Pin", icon: Pin },
    { label: "Edit tags", icon: Star },
    { label: "Copy session ID", icon: Copy },
    { label: "Update network config", icon: Globe },
    { label: "Rename", icon: Edit },
    { label: "Hide from team", icon: EyeOff },
    { label: "Schedule Devin", icon: Bell },
    { label: "Create playbook from session", icon: Upload },
    { label: "Analyze session", icon: Search },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded-md text-white/45 hover:bg-[#141414] hover:text-white"
          aria-label="Session menu"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 border border-[#2f2f2f] bg-[#141414] p-1 text-white shadow-2xl"
      >
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <DropdownMenuItem
              key={row.label}
              className="gap-2 text-[14px] text-white/90 focus:bg-white/10 focus:text-white"
            >
              <Icon className="size-3.5 text-white/70" />
              <span>{row.label}</span>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="gap-2 text-[14px] text-rose-400 focus:bg-white/10 focus:text-rose-300">
          <RotateCcw className="size-3.5" />
          <span>Reboot session</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[14px] text-rose-400 focus:bg-white/10 focus:text-rose-300">
          <Power className="size-3.5" />
          <span>Terminate session</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="justify-between gap-2 text-[14px] text-white/90 focus:bg-white/10 focus:text-white">
          <span className="inline-flex items-center gap-2">
            <Star className="size-3.5 text-white/70" />
            Focus mode
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-white/55">
            <kbd className="rounded bg-white/10 px-1 py-0.5">Control</kbd>
            <kbd className="rounded bg-white/10 px-1 py-0.5">Shift</kbd>
            <kbd className="rounded bg-white/10 px-1 py-0.5">F</kbd>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[14px] text-white/90 focus:bg-white/10 focus:text-white">
          <Bell className="size-3.5 text-white/70" />
          <span>Knowledge suggestions</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-[14px] text-white/90 focus:bg-white/10 focus:text-white">
          <Settings className="size-3.5 text-white/70" />
          <span>Session usage limits</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="gap-2 text-[14px] text-white/90 focus:bg-white/10 focus:text-white">
          <History className="size-3.5 text-white/70" />
          <span>View session insights</span>
        </DropdownMenuItem>
        <div className="px-3 py-1.5 text-[12px] text-white/55">
          <div>On-demand usage&nbsp;&nbsp;$0.53</div>
          <div>User messages&nbsp;&nbsp;1</div>
          <div>Session size&nbsp;&nbsp;XS</div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NewTabPanel() {
  return <div className="h-full" aria-hidden />;
}

function FeaturePickerMenu({
  addable,
  onSelect,
  isDisabled,
}: {
  addable: RailTabId[];
  onSelect: (id: RailTabId) => void;
  isDisabled: (id: RailTabId) => boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const available = RAIL_TABS;
    const matching = normalized
      ? available.filter((tab) => tab.label.toLowerCase().includes(normalized))
      : available;
    return matching;
  }, [query]);

  return (
    <DropdownMenu onOpenChange={(open) => !open && setQuery("")}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-[#1a1a1a] hover:text-white"
          aria-label="Open tools menu"
        >
          <Plus className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="min-w-[220px] border border-[#2a2a2a] bg-[#121212] p-0 text-white"
      >
        <div className="p-2">
          <DropdownMenuLabel className="px-0 text-xs font-medium text-white/55">
            Search
          </DropdownMenuLabel>
          <div className="mt-1 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/30 px-2 py-1.5">
            <Search className="size-3 text-white/45" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find tab"
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/35"
              onKeyDown={(event) => event.stopPropagation()}
            />
          </div>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <div className="p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-2 text-[11px] text-white/45">
              No tabs available
            </p>
          ) : null}
          {filtered.map((tab) => {
            const Icon = tab.icon;
            const disabled = !addable.includes(tab.id) || isDisabled(tab.id);
            return (
              <DropdownMenuItem
                key={tab.id}
                disabled={disabled}
                className="gap-2 rounded-md px-2 py-2 text-white/85 focus:bg-white/10 focus:text-white data-[disabled]:opacity-40"
                onClick={() => onSelect(tab.id)}
              >
                <Icon className="size-3.5 text-white/70" />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="text-sm">{tab.label}</span>
                  {disabled ? (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-white/35">
                      unavailable
                    </span>
                  ) : null}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ContinuityLabSessionRail({
  focusChangePath,
  panel,
  onPanelChange,
  fileChanges,
  worklog,
  shellLines,
  vscodeUrl,
  desktopControlUrl,
  desktopReady,
  desktopWaiting,
  wakingDesktop = false,
  showWriteBackBanner,
  writeBackPrefill,
  onOpenPropose,
  onDismissWriteBackBanner,
  labProjectId,
  repoFullName,
  sessionQuestion,
  launchContext,
  sessionMemories,
  handoffPacket,
  playbook,
  sessionTitle,
  defaultBranch,
  repoPulls,
  sessionId,
  railExpanded,
  onToggleRailExpanded,
  railFullscreen = false,
  onToggleRailFullscreen,
  onToggleTabsPanel,
  onWakeDesktop,
  onDesktopInput,
  desktopStreamState,
  desktopAutoReconnecting = false,
  desktopReconnectAttemptCount = 0,
  className,
}: ContinuityLabSessionRailProps) {
  const store = useAgentStore();
  const [openTabs, setOpenTabs] = useState<RailTabId[]>([
    "changes",
    "worklog",
    "shell",
    "pr",
  ]);
  const [brief, setBrief] = useState<OperationalResumeBrief | null>(null);
  const [executionHistory, setExecutionHistory] = useState<
    ExecutionLineageItem[]
  >([]);
  const [runtimeThread, setRuntimeThread] = useState<RuntimeThread | null>(
    null,
  );
  const [runtimeHandoffs, setRuntimeHandoffs] = useState<RuntimeAgentHandoff[]>(
    [],
  );
  const [runtimeArtifacts, setRuntimeArtifacts] = useState<RuntimeArtifact[]>(
    [],
  );
  const [fetchedPullRequest, setFetchedPullRequest] =
    useState<GitHubPullRequestDetail | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [focusedShellTimestamp, setFocusedShellTimestamp] = useState<
    string | null
  >(null);
  const [shellHistoryQuery, setShellHistoryQuery] = useState("");
  const [memoryostmShellSync, setMemoryostmShellSync] =
    useState<MemoryOSTMShellSyncSnapshot | null>(null);
  const [liveShellSession, setLiveShellSession] =
    useState<MemoryOSTMShellLiveSnapshot | null>(null);
  const [shellCommandError, setShellCommandError] = useState<string | null>(
    null,
  );
  const [shellTerminalScrollToken, setShellTerminalScrollToken] = useState(0);
  const mountedRef = useRef(false);

  const liveFileChanges =
    fileChanges.length > 0 ? fileChanges : store.fileChanges;
  const liveWorklog = worklog.length > 0 ? worklog : store.worklog;
  const liveShellLines = shellLines.length > 0 ? shellLines : store.shellLines;
  const desktopState = store.desktop;
  const isTaskSession = sessionId.startsWith("task-");
  const isLocalSession = sessionId.startsWith("local-");
  const isRuntimeSession =
    !isTaskSession &&
    !isLocalSession &&
    Boolean(vscodeUrl || desktopControlUrl || desktopState.controlUrl);
  const normalizedRuntimeSessionId = useMemo(
    () =>
      sessionId.startsWith("task-") || sessionId.startsWith("local-")
        ? null
        : sessionId,
    [sessionId],
  );
  const activePanel: SessionRailPanel =
    panel === "session" || panel === "desktop" ? "changes" : panel;
  const linkedPrUrl = store.prReady?.url ?? store.prStatus?.url ?? null;
  const prReady = store.prReady;
  const prNumber = prReady?.number ?? repoPulls[0]?.number ?? null;
  const repoParts = repoFullName?.includes("/")
    ? repoFullName.split("/", 2)
    : null;
  const repoOwner = repoParts?.[0] ?? null;
  const repoName = repoParts?.[1] ?? null;
  const livePullRequest =
    fetchedPullRequest && fetchedPullRequest.number === prNumber
      ? fetchedPullRequest
      : null;
  const livePullRequestFiles = useMemo(
    () => livePullRequest?.files ?? [],
    [livePullRequest],
  );
  const livePullRequestReviews = useMemo(
    () => livePullRequest?.reviews ?? [],
    [livePullRequest],
  );
  const livePullRequestComments = useMemo(
    () => livePullRequest?.commentsList ?? [],
    [livePullRequest],
  );
  const livePullRequestStatusState = livePullRequest?.statusState ?? null;
  const livePullRequestTitle = livePullRequest?.title ?? null;
  const fetchedPullRequestHeadSha = fetchedPullRequest?.headSha ?? null;
  const topPullTitle = repoPulls[0]?.title ?? null;
  const prCount = prNumber ?? repoPulls[0]?.number ?? (linkedPrUrl ? 1 : 0);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    if (repoOwner && repoName && prNumber) {
      void (async () => {
        const detail = await fetchGitHubPullRequest(
          repoOwner,
          repoName,
          prNumber,
        );
        if (cancelled || !mountedRef.current) return;
        setFetchedPullRequest(detail);
      })();
    }

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [prNumber, repoName, repoOwner]);

  const lineageByFile = useMemo(() => {
    const map = new Map<string, ExecutionLineageItem[]>();
    for (const item of executionHistory) {
      for (const file of item.actionMemory.filesChanged ?? []) {
        const normalized = file.trim();
        if (!normalized) continue;
        const next = map.get(normalized) ?? [];
        next.push(item);
        map.set(normalized, next);
      }
    }
    return map;
  }, [executionHistory]);

  const timelineEntries = useMemo(() => {
    const worklogEntries = liveWorklog.map((entry) => ({
      id: `worklog-${entry.id}`,
      at: entry.timestamp,
      title: entry.label,
      detail: entry.detail,
      tone: "default" as const,
    }));

    const logEntries = (runtimeThread?.executionLog ?? []).map((log) => ({
      id: `runtime-log-${log.id}`,
      at: log.at,
      title: log.message,
      detail: `Runtime ${log.level}`,
      tone:
        log.level === "error"
          ? ("error" as const)
          : log.level === "warn"
            ? ("warn" as const)
            : ("default" as const),
    }));

    const handoffEntries = runtimeHandoffs.map((handoff) => ({
      id: `handoff-${handoff.id}`,
      at: handoff.timestamp,
      title: `${handoff.source} -> ${handoff.target} handoff`,
      detail: handoff.metadata.notes,
      tone: "info" as const,
    }));

    const approvalEntries = executionHistory.flatMap((item) =>
      item.approvalTraces.map((approval) => ({
        id: `approval-${approval.id}`,
        at: approval.createdAt,
        title: `${approval.decision === "approved" ? "Approved" : "Rejected"} proposal`,
        detail:
          approval.reason || approval.proposalId || item.actionMemory.action,
        tone:
          approval.decision === "approved"
            ? ("success" as const)
            : ("error" as const),
      })),
    );

    const lineageEntries = executionHistory.map((item) => ({
      id: `lineage-${item.actionMemory.id}`,
      at: item.actionMemory.createdAt,
      title: item.actionMemory.action,
      detail: formatLineageSummary(item),
      tone:
        item.actionMemory.outcome === "success"
          ? ("success" as const)
          : item.actionMemory.outcome === "failed"
            ? ("error" as const)
            : ("warn" as const),
    }));

    const retryEntries = (runtimeThread?.executionState?.workerJobs ?? [])
      .filter((job) => job.attempts > 1 || job.status === "failed")
      .map((job) => ({
        id: `worker-${job.id}`,
        at: job.updatedAt,
        title:
          job.status === "failed"
            ? `Worker job failed for ${job.role ?? "runtime"}`
            : `Worker retried ${job.role ?? "runtime"} (${job.attempts} attempts)`,
        detail: job.error || job.note || job.stepId || null,
        tone: job.status === "failed" ? ("error" as const) : ("warn" as const),
      }));

    return [
      ...worklogEntries,
      ...logEntries,
      ...handoffEntries,
      ...approvalEntries,
      ...lineageEntries,
      ...retryEntries,
    ].sort((a, b) => a.at.localeCompare(b.at));
  }, [executionHistory, liveWorklog, runtimeHandoffs, runtimeThread]);

  const shellHistoryEntries = useMemo<ShellHistoryEntry[]>(() => {
    const liveSessionEntries: ShellHistoryEntry[] = (
      liveShellSession?.entries ?? []
    ).map((entry) => ({
      id: `shell-live-${entry.id}`,
      at: entry.at,
      kind: entry.kind,
      title: entry.title,
      output: entry.output ?? null,
      detail: entry.detail,
      state: entry.state,
      tone:
        entry.state === "error"
          ? ("error" as const)
          : entry.kind === "runtime"
            ? ("info" as const)
            : ("default" as const),
    }));

    const commandEntries: ShellHistoryEntry[] = liveShellLines.map(
      (line, index) => ({
        id: `shell-${line.id}`,
        at: line.timestamp,
        kind: line.kind === "runtime" ? "runtime" : "command",
        title: line.command,
        output: line.output ?? null,
        detail:
          line.kind === "runtime"
            ? "Runtime execution"
            : index === liveShellLines.length - 1 &&
                runtimeThread?.executionState?.workerStatus
              ? `Latest command · ${formatWorkerStatusLabel(runtimeThread.executionState.workerStatus, runtimeThread.executionState.blockedReason)}`
              : "Shell command",
        tone: "default" as const,
      }),
    );

    const hookEntries: ShellHistoryEntry[] = (
      memoryostmShellSync?.entries ?? []
    ).map(toShellHistoryEntry);

    const runtimeEntries: ShellHistoryEntry[] = (
      runtimeThread?.executionLog ?? []
    ).map((log) => ({
      id: `shell-runtime-${log.id}`,
      at: log.at,
      kind: "runtime",
      title: log.message,
      output: null,
      detail: `Runtime ${log.level}`,
      tone:
        log.level === "error"
          ? ("error" as const)
          : log.level === "warn"
            ? ("warn" as const)
            : ("info" as const),
    }));

    const commandKeys = new Set(
      [...liveSessionEntries, ...commandEntries].map(
        (entry) => `${entry.at}|${entry.title}|${entry.detail ?? ""}`,
      ),
    );
    for (const entry of hookEntries) {
      commandKeys.add(`${entry.at}|${entry.title}|${entry.detail ?? ""}`);
    }
    const dedupedRuntimeEntries = runtimeEntries.filter(
      (entry) =>
        !commandKeys.has(`${entry.at}|${entry.title}|${entry.detail ?? ""}`),
    );

    return [
      ...liveSessionEntries,
      ...commandEntries,
      ...hookEntries,
      ...dedupedRuntimeEntries,
    ].sort((a, b) => a.at.localeCompare(b.at));
  }, [
    liveShellLines,
    liveShellSession?.entries,
    memoryostmShellSync?.entries,
    runtimeThread,
  ]);

  const shellCommandEntries = useMemo(
    () =>
      shellHistoryEntries.filter(
        (entry) => entry.kind === "command" || entry.kind === "prompt",
      ),
    [shellHistoryEntries],
  );

  const shellHistoryRows = useMemo(
    () => shellCommandEntries,
    [shellCommandEntries],
  );
  const filteredShellHistoryRows = useMemo(() => {
    const query = shellHistoryQuery.trim().toLowerCase();
    if (!query) return shellHistoryRows;
    return shellHistoryRows.filter((entry) => {
      const output = "output" in entry ? entry.output : null;
      const haystack = [entry.title, entry.detail, output, entry.at]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [shellHistoryQuery, shellHistoryRows]);

  const focusedShellEntryId = useMemo(() => {
    if (!focusedShellTimestamp) return null;
    const target = new Date(focusedShellTimestamp).getTime();
    if (!Number.isFinite(target)) return null;
    let bestId: string | null = null;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (const entry of shellHistoryEntries) {
      const candidate = new Date(entry.at).getTime();
      if (!Number.isFinite(candidate)) continue;
      const delta = Math.abs(candidate - target);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestId = entry.id;
      }
    }
    return bestDelta <= 120_000 ? bestId : null;
  }, [focusedShellTimestamp, shellHistoryEntries]);

  useEffect(() => {
    if (!focusedShellEntryId || activePanel !== "shell") return;
    const element =
      document.getElementById(`shell-transcript-${focusedShellEntryId}`) ??
      document.getElementById(`shell-history-${focusedShellEntryId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activePanel, focusedShellEntryId]);

  const jumpToShellEntry = useCallback(
    (entry: { at: string }) => {
      setFocusedShellTimestamp(entry.at);
      onPanelChange("shell");
    },
    [onPanelChange],
  );

  const copyShellEntry = useCallback(
    async (entry: {
      id: string;
      title: string;
      output?: string | null;
      detail?: string | null;
    }) => {
      if (typeof navigator === "undefined" || !navigator.clipboard) return;
      const payload = [
        entry.title,
        entry.output || "",
        entry.detail ? `# ${entry.detail}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      try {
        await navigator.clipboard.writeText(payload);
      } catch {
        // Ignore clipboard failures; the row still jumps to the right point in time.
      }
    },
    [],
  );

  const plannerSteps = useMemo(() => {
    const steps = runtimeThread?.executionState?.steps ?? [];
    const activeRole = runtimeThread?.executionState?.activeRole ?? null;
    const blockedReason = runtimeThread?.executionState?.blockedReason ?? null;
    return steps.map((step, index) => ({
      step,
      index,
      isActive:
        step.status === "running" ||
        (step.status === "pending" &&
          step.role === activeRole &&
          runtimeThread?.executionState?.status === "running"),
      stateLabel: formatStepState(step),
      reason: formatStepReason(step, blockedReason),
      linkedArtifacts: runtimeArtifacts.filter((artifact) =>
        step.artifactIds?.includes(artifact.id),
      ),
    }));
  }, [runtimeArtifacts, runtimeThread]);

  const previewArtifacts = useMemo(
    () =>
      runtimeArtifacts.filter(
        (artifact) =>
          artifact.type === "preview" ||
          artifact.metadata.tags.includes("desktop_preview"),
      ),
    [runtimeArtifacts],
  );

  const verificationArtifacts = useMemo(
    () =>
      runtimeArtifacts.filter(
        (artifact) =>
          artifact.metadata.stage === "verify" ||
          artifact.type === "review_note" ||
          artifact.type === "recording" ||
          artifact.metadata.verificationRequired,
      ),
    [runtimeArtifacts],
  );

  const latestPreviewArtifact = previewArtifacts[0] ?? null;
  const latestVerificationArtifact = verificationArtifacts[0] ?? null;
  const desktopPreviewArtifact = useMemo(() => {
    const targetId = runtimeThread?.desktopSession?.previewArtifactId;
    if (targetId) {
      const byId = runtimeArtifacts.find(
        (artifact) => artifact.id === targetId,
      );
      if (byId) return byId;
    }
    return latestPreviewArtifact;
  }, [
    latestPreviewArtifact,
    runtimeArtifacts,
    runtimeThread?.desktopSession?.previewArtifactId,
  ]);
  const desktopRecordingArtifact = useMemo(() => {
    const targetId = runtimeThread?.desktopSession?.recordingArtifactId;
    if (targetId) {
      const byId = runtimeArtifacts.find(
        (artifact) => artifact.id === targetId,
      );
      if (byId) return byId;
    }
    return (
      runtimeArtifacts.find((artifact) => artifact.type === "recording") ?? null
    );
  }, [runtimeArtifacts, runtimeThread?.desktopSession?.recordingArtifactId]);
  const latestReviewOutcome = useMemo(() => {
    const latestApproval = executionHistory
      .flatMap((item) => item.approvalTraces)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (latestApproval) {
      return {
        label:
          latestApproval.decision === "approved"
            ? "Approved"
            : "Revision requested",
        detail:
          latestApproval.reason ||
          latestApproval.proposalId ||
          "Proposal decision recorded.",
      };
    }
    const reviewStep = [...plannerSteps]
      .reverse()
      .find(({ step }) => step.role === "reviewer" || step.stage === "verify");
    if (!reviewStep) return null;
    return {
      label: formatStepState(reviewStep.step),
      detail: reviewStep.reason || "Reviewer/verifier state available.",
    };
  }, [executionHistory, plannerSteps]);

  const prChangeGroups = useMemo(() => {
    if (livePullRequestFiles.length) {
      return livePullRequestFiles.slice(0, 8).map((file, index) => ({
        id: `github-${file.filename}-${index}`,
        index: index + 1,
        title: file.filename.split("/").pop() ?? file.filename,
        detail: `${file.status} · +${file.additions} / -${file.deletions}`,
        files: [file.filename],
        outcome:
          file.status === "removed" ? ("error" as const) : ("success" as const),
        summary: file.patch ?? `${file.status} file`,
      }));
    }
    const lineageGroups = executionHistory
      .filter((item) => item.actionMemory.filesChanged.length > 0)
      .map((item, index) => ({
        id: item.actionMemory.id,
        index: index + 1,
        title: item.actionMemory.action,
        detail: item.actionMemory.reason,
        files: item.actionMemory.filesChanged,
        outcome: item.actionMemory.outcome,
        summary: formatLineageSummary(item),
      }));

    if (lineageGroups.length > 0) return lineageGroups.slice(0, 6);

    return liveFileChanges.slice(0, 6).map((change, index) => ({
      id: change.id,
      index: index + 1,
      title: change.path.split("/").pop() ?? change.path,
      detail: change.detail ?? change.kind,
      files: [change.path],
      outcome: "success" as const,
      summary: change.content ?? change.detail ?? change.path,
    }));
  }, [executionHistory, liveFileChanges, livePullRequestFiles]);

  const prBugCards = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      tone: "rose" | "amber";
    }> = [];

    const execution = runtimeThread?.executionState;
    if (execution?.failureReason?.trim()) {
      items.push({
        id: "failure-reason",
        title: "Runtime failure",
        detail: execution.failureReason.trim(),
        tone: "rose",
      });
    }
    if (
      livePullRequestReviews.some(
        (review) => review.state.toLowerCase() === "changes_requested",
      )
    ) {
      items.push({
        id: "github-change-request",
        title: "GitHub review requested changes",
        detail: "A live GitHub review requested changes on this pull request.",
        tone: "rose",
      });
    }
    if (livePullRequestStatusState === "failure") {
      items.push({
        id: "github-status-failure",
        title: "GitHub checks failing",
        detail: "The combined GitHub status for this PR is failing.",
        tone: "rose",
      });
    }
    if (execution?.blockedReason?.trim()) {
      items.push({
        id: "blocked-reason",
        title: "Blocked condition",
        detail: execution.blockedReason.replaceAll("_", " "),
        tone: "amber",
      });
    }
    for (const step of plannerSteps) {
      if (
        step.reason &&
        (step.step.status === "failed" ||
          step.step.approvalStatus === "rejected")
      ) {
        items.push({
          id: step.step.id,
          title: step.step.label,
          detail: step.reason,
          tone: "rose",
        });
      }
    }
    for (const log of runtimeThread?.executionLog ?? []) {
      if (log.level !== "error") continue;
      items.push({
        id: log.id,
        title: "Error log",
        detail: log.message,
        tone: "rose",
      });
    }

    return items.slice(0, 4);
  }, [
    livePullRequestReviews,
    livePullRequestStatusState,
    plannerSteps,
    runtimeThread?.executionLog,
    runtimeThread?.executionState,
  ]);

  const prDiscussionItems = useMemo(() => {
    const items: Array<{ id: string; title: string; detail: string }> = [];

    for (const review of livePullRequestReviews) {
      items.push({
        id: `github-review-${review.id}`,
        title: review.state,
        detail: review.body || review.user || "GitHub review submitted.",
      });
    }
    for (const comment of livePullRequestComments) {
      items.push({
        id: `github-comment-${comment.id}`,
        title: comment.path ? comment.path : "Inline comment",
        detail: comment.body,
      });
    }
    for (const approval of executionHistory.flatMap(
      (item) => item.approvalTraces,
    )) {
      items.push({
        id: approval.id,
        title:
          approval.decision === "approved" ? "Approved" : "Revision requested",
        detail: approval.reason || approval.proposalId || "Approval recorded.",
      });
    }

    for (const handoff of runtimeHandoffs.slice(0, 3)) {
      items.push({
        id: handoff.id,
        title: `${handoff.source} → ${handoff.target}`,
        detail: handoff.metadata.notes || "Runtime handoff.",
      });
    }

    if (latestReviewOutcome) {
      items.push({
        id: "latest-review",
        title: latestReviewOutcome.label,
        detail: latestReviewOutcome.detail,
      });
    }

    return items.slice(0, 5);
  }, [
    executionHistory,
    latestReviewOutcome,
    livePullRequestComments,
    livePullRequestReviews,
    runtimeHandoffs,
  ]);

  const prReadyForReview = useMemo<PrReadyArtifact | null>(() => {
    if (prReady) {
      if (!fetchedPullRequest?.merged) {
        return prReady;
      }
      return {
        ...prReady,
        ciStatus: "merged",
        title: fetchedPullRequest.title ?? prReady.title,
        branch: fetchedPullRequest.headRef ?? prReady.branch,
        baseBranch: fetchedPullRequest.baseRef ?? prReady.baseBranch,
        filesChanged: fetchedPullRequest.changedFiles ?? prReady.filesChanged,
        additions: fetchedPullRequest.additions ?? prReady.additions,
        deletions: fetchedPullRequest.deletions ?? prReady.deletions,
        url: fetchedPullRequest.htmlUrl ?? prReady.url,
      };
    }
    if (!fetchedPullRequest) return null;
    const resolvedUrl = fetchedPullRequest.htmlUrl ?? linkedPrUrl ?? "";
    if (!resolvedUrl.trim()) return null;
    return {
      type: "pr_ready",
      id: `live-pr-${repoFullName ?? "repo"}-${fetchedPullRequest.number}`,
      url: resolvedUrl,
      number: fetchedPullRequest.number,
      title: fetchedPullRequest.title,
      branch: fetchedPullRequest.headRef ?? undefined,
      baseBranch: fetchedPullRequest.baseRef ?? defaultBranch ?? undefined,
      ciStatus: fetchedPullRequest.merged
        ? "merged"
        : fetchedPullRequest.statusState === "success"
          ? "passed"
          : fetchedPullRequest.statusState === "failure"
            ? "failed"
            : "pending",
      filesChanged: fetchedPullRequest.changedFiles,
      additions: fetchedPullRequest.additions,
      deletions: fetchedPullRequest.deletions,
    };
  }, [defaultBranch, fetchedPullRequest, linkedPrUrl, prReady, repoFullName]);

  const prReview = useMemo(
    () =>
      buildPrReviewViewModel({
        repoFullName,
        prReady: prReadyForReview,
        linkedPrUrl,
        repoPullTitle: livePullRequestTitle ?? topPullTitle,
        defaultBranch,
        previewUrl:
          vscodeUrl ?? desktopControlUrl ?? desktopState.previewUrl ?? null,
        brief,
        sessionMemories,
        handoffPacket,
        playbook,
        runtimeThread,
        runtimeArtifacts,
        executionHistory,
        runtimeHandoffs,
        changeGroups: prChangeGroups.map((group) => ({
          ...group,
          files: group.files.map((file) => {
            const match = liveFileChanges.find(
              (change) => change.path === file,
            );
            const githubFile = livePullRequestFiles.find(
              (entry) => entry.filename === file,
            );
            return {
              path: file,
              additions: githubFile?.additions,
              deletions: githubFile?.deletions,
              kind: githubFile?.status ?? match?.kind,
              detail: githubFile?.patch
                ? "Unified diff from GitHub"
                : (match?.detail ?? null),
              content: githubFile?.patch ?? match?.content ?? null,
            };
          }),
        })),
        bugs: prBugCards.map((bug, index) => ({
          id: bug.id ?? `bug-${index}`,
          severity: bug.tone === "rose" ? "high" : "medium",
          title: bug.title,
          detail: bug.detail,
          suggestion: bug.detail,
        })),
        discussion: prDiscussionItems.map((item) => ({
          id: item.id,
          author: "MemoryOS",
          title: item.title,
          detail: item.detail,
          timestamp: null,
          tone: "neutral" as const,
        })),
        latestReviewOutcome,
      }),
    [
      brief,
      defaultBranch,
      desktopControlUrl,
      desktopState.previewUrl,
      executionHistory,
      handoffPacket,
      latestReviewOutcome,
      linkedPrUrl,
      livePullRequestFiles,
      playbook,
      prBugCards,
      prChangeGroups,
      prDiscussionItems,
      repoFullName,
      livePullRequestTitle,
      topPullTitle,
      runtimeArtifacts,
      runtimeHandoffs,
      runtimeThread,
      sessionMemories,
      liveFileChanges,
      prReadyForReview,
      vscodeUrl,
    ],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const reloadMemoryOSTMShellSync = useCallback(async () => {
    const threadId = runtimeThread?.id;
    if (!threadId || threadId.startsWith("local-")) return;
    try {
      const snapshot = await fetchMemoryOSTMShellSync(threadId);
      setMemoryostmShellSync(snapshot);
    } catch {
      setMemoryostmShellSync(
        (current) =>
          current ?? {
            installed: false,
            state: "missing",
            summary: null,
            lastUpdatedAt: null,
            logPath: null,
            entries: [],
          },
      );
    }
  }, [runtimeThread?.id]);

  useEffect(() => {
    if (runtimeThread?.id.startsWith("local-")) {
      const fallback = window.setTimeout(() => {
        setMemoryostmShellSync(
          (current) =>
            current ?? {
              installed: false,
              state: "missing",
              summary: null,
              lastUpdatedAt: null,
              logPath: null,
              entries: [],
            },
        );
      }, 0);
      return () => window.clearTimeout(fallback);
    }

    const bootstrap = window.setTimeout(() => {
      void reloadMemoryOSTMShellSync();
    }, 0);
    const timer = window.setInterval(
      () => {
        void reloadMemoryOSTMShellSync();
      },
      activePanel === "shell" ? 4_000 : 12_000,
    );

    return () => {
      window.clearTimeout(bootstrap);
      window.clearInterval(timer);
    };
  }, [activePanel, reloadMemoryOSTMShellSync, runtimeThread?.id]);

  const desktopSessionState = runtimeThread?.desktopSession?.state ?? null;
  const desktopFreshness = useMemo(() => {
    if (
      runtimeThread?.runtimeState === "blocked" ||
      desktopSessionState === "blocked"
    )
      return "blocked";
    if (desktopSessionState === "error") return "missing";
    if (desktopSessionState === "starting") return "waiting";
    if (desktopSessionState === "stale") return "stale";
    if (desktopSessionState === "live") return "live";
    if (vscodeUrl && desktopReady && desktopState.lastFrameAt) {
      const age = now - new Date(desktopState.lastFrameAt).getTime();
      if (Number.isFinite(age) && age > 90_000) return "stale";
      return "live";
    }
    if (vscodeUrl && desktopReady) return "live";
    if (runtimeThread?.runtimeState === "running" || desktopWaiting)
      return "waiting";
    return "missing";
  }, [
    desktopSessionState,
    desktopState.lastFrameAt,
    desktopReady,
    desktopWaiting,
    now,
    runtimeThread?.runtimeState,
    vscodeUrl,
  ]);

  const shellLiveState = useMemo(() => {
    if (runtimeThread?.runtimeState === "running") return "running";
    if (runtimeThread?.runtimeState === "blocked") return "blocked";
    if (desktopWaiting) return "starting";
    if (liveShellSession?.state === "working") return "running";
    if (liveShellSession?.state === "starting") return "starting";
    if (liveShellSession?.state === "error") return "blocked";
    if (memoryostmShellSync?.state === "working") return "running";
    if (memoryostmShellSync?.state === "waiting") return "idle";
    return "idle";
  }, [
    desktopWaiting,
    liveShellSession?.state,
    memoryostmShellSync?.state,
    runtimeThread?.runtimeState,
  ]);

  const sessionOverview = useMemo(() => {
    const goal =
      launchContext?.currentGoal?.trim() ||
      sessionQuestion?.trim() ||
      sessionTitle.trim();
    const summary =
      launchContext?.briefSummary?.trim() ||
      handoffPacket?.summary?.trim() ||
      playbook?.whenToUse?.trim() ||
      "Task progress, shell, desktop, and review state are synchronized here.";
    const nextAction =
      launchContext?.nextBestAction?.trim() ||
      handoffPacket?.recommendedNextActions[0]?.trim() ||
      playbook?.steps[0]?.trim() ||
      "Continue from the active progress steps below.";
    const blockers = [
      ...(launchContext?.openBlockers ?? []),
      ...(handoffPacket?.experienceLearned ?? []).slice(0, 2),
    ].filter(Boolean);
    const risks = [
      ...(launchContext?.riskyFiles ?? []),
      ...(playbook?.risks ?? []),
    ].filter(Boolean);
    return {
      goal,
      summary,
      nextAction,
      blockers,
      risks,
    };
  }, [handoffPacket, launchContext, playbook, sessionQuestion, sessionTitle]);

  const handleLiveShellSnapshot = useCallback(
    (snapshot: MemoryOSTMShellLiveSnapshot) => {
      setLiveShellSession(snapshot);
      setShellCommandError(null);
    },
    [],
  );

  const renderedTabs = useMemo(() => {
    if (railFullscreen) return [];
    return openTabs;
  }, [openTabs, railFullscreen]);

  const addableTabs = useMemo(
    () =>
      RAIL_TABS.map((tab) => tab.id).filter((id) => !renderedTabs.includes(id)),
    [renderedTabs],
  );

  function closeTab(tab: RailTabId) {
    if (openTabs.length <= 1) return;
    const index = openTabs.indexOf(tab);
    const next = openTabs.filter((t) => t !== tab);
    setOpenTabs(next);
    if (activePanel === tab) {
      const fallback = next[Math.max(index - 1, 0)] ?? next[0] ?? "changes";
      onPanelChange(fallback);
    }
  }

  function addTab(tab: RailTabId) {
    if (!openTabs.includes(tab)) setOpenTabs((prev) => [...prev, tab]);
    onPanelChange(tab);
  }

  const reloadLineageContext = useCallback(async () => {
    const question =
      sessionQuestion?.trim() ||
      launchContext?.currentGoal?.trim() ||
      sessionTitle.trim();

    const [
      loadedBrief,
      loadedHistory,
      loadedRuntimeThread,
      loadedRuntimeHandoffs,
      loadedRuntimeArtifacts,
    ] = await Promise.all([
      fetchResumeBrief({
        projectId: labProjectId,
        repo: repoFullName,
        question,
      }),
      fetchExecutionHistory(labProjectId, 8),
      isRuntimeSession ? getRuntimeThread(sessionId) : Promise.resolve(null),
      isRuntimeSession
        ? listThreadHandoffs(sessionId, 12)
        : Promise.resolve([]),
      isRuntimeSession
        ? listThreadArtifacts(sessionId, 24)
        : Promise.resolve([]),
    ]);

    setBrief(loadedBrief);
    setExecutionHistory(loadedHistory);
    setRuntimeThread(loadedRuntimeThread);
    setRuntimeHandoffs(loadedRuntimeHandoffs);
    setRuntimeArtifacts(loadedRuntimeArtifacts);
  }, [
    labProjectId,
    launchContext,
    repoFullName,
    sessionId,
    sessionQuestion,
    sessionTitle,
    isRuntimeSession,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isRuntimeSession) {
        setRuntimeThread(null);
        setRuntimeHandoffs([]);
        setRuntimeArtifacts([]);
      }
      void reloadLineageContext();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reloadLineageContext, isRuntimeSession]);

  const openPrLink = useCallback(() => {
    const url = prReview?.header.githubUrl ?? linkedPrUrl;
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [linkedPrUrl, prReview?.header.githubUrl]);

  const openPreviewLink = useCallback(() => {
    const url =
      prReview?.header.previewUrl ??
      vscodeUrl ??
      desktopControlUrl ??
      desktopState.previewUrl ??
      null;
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [
    desktopControlUrl,
    desktopState.previewUrl,
    prReview?.header.previewUrl,
    vscodeUrl,
  ]);

  const mergeReview = useCallback(async () => {
    if (!prReview || !repoOwner || !repoName || !prReview.header.prNumber)
      return;

    const result = await mergePrReview({
      owner: repoOwner,
      repo: repoName,
      number: prReview.header.prNumber,
      mergeMethod: "merge",
      commitTitle: `Merge PR #${prReview.header.prNumber}`,
      commitMessage: `Merge ${prReview.header.title}`,
      expectedHeadSha: fetchedPullRequestHeadSha,
    });

    if (!result.ok) {
      console.warn("[ContinuityLab] PR merge failed:", result.error);
      return;
    }

    if (result.mergeResult?.merged) {
      setFetchedPullRequest((current) =>
        current
          ? {
              ...current,
              state: "closed",
              merged: true,
              mergedAt: result.mergeResult?.mergedAt ?? current.mergedAt,
              closedAt: result.mergeResult?.mergedAt ?? current.closedAt,
            }
          : current,
      );
    }

    await savePrReviewActionMemory({
      projectId: labProjectId,
      workspace: "continuity-lab",
      review: prReview,
      action: "merge",
      sourceType: "github_execution",
      sourceId:
        prReview.header.githubUrl ?? prReview.header.repoFullName ?? null,
      note: `Merged ${prReview.header.title}`,
    });
    await reloadLineageContext();
  }, [
    fetchedPullRequestHeadSha,
    labProjectId,
    prReview,
    reloadLineageContext,
    repoName,
    repoOwner,
  ]);

  const saveLearnings = useCallback(async () => {
    if (!prReview) return;
    const saved = await savePrReviewActionMemory({
      projectId: labProjectId,
      workspace: "continuity-lab",
      review: prReview,
      action: "save_learnings",
      sourceType: "continuity",
      note: `Saved learnings from ${prReview.header.title}`,
    });
    if (!saved.ok) return;
    onPanelChange("memory");
  }, [labProjectId, onPanelChange, prReview]);

  const reviewDecision = useCallback(
    async (decision: "approve" | "reject") => {
      if (sessionId.startsWith("task-") || !runtimeThread) return;
      await submitRuntimeReviewDecision(sessionId, {
        decision,
      });
      if (prReview) {
        await savePrReviewActionMemory({
          projectId: labProjectId,
          workspace: "continuity-lab",
          review: prReview,
          action: decision === "approve" ? "approve" : "request_changes",
          sourceType: "continuity",
          note:
            decision === "approve"
              ? `Approved ${prReview.header.title}`
              : `Requested changes for ${prReview.header.title}`,
        });
      }
      await reloadLineageContext();
    },
    [labProjectId, prReview, reloadLineageContext, runtimeThread, sessionId],
  );

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-t border-[#2a2a2a] bg-[#080808] lg:border-l lg:border-t-0",
        className,
      )}
    >
      <div className="flex h-7 items-center justify-end gap-1 border-b border-[#1b1b1b] px-2">
        <RailSessionMenu />
        <button
          type="button"
          onClick={onToggleTabsPanel}
          className="inline-flex size-6 items-center justify-center rounded-md text-white/45 hover:bg-[#141414] hover:text-white"
          aria-label="Toggle tabs panel"
          title="Hide tabs panel (Ctrl+Alt+B)"
        >
          <Square className="size-3.5" />
        </button>
      </div>

      <div className="flex h-11 items-center justify-between border-b border-[#1f1f1f] px-2">
        <div className="min-w-0 flex flex-1 items-center gap-1 overflow-x-auto pr-2">
          {renderedTabs.map((tabId) => {
            const tab = RAIL_TABS.find((entry) => entry.id === tabId);
            if (!tab) return null;
            const Icon = tab.icon;
            const active = activePanel === tabId;
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => onPanelChange(tabId)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition",
                  active
                    ? "bg-[#1a1a1a] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-white/65 hover:bg-[#151515] hover:text-white",
                )}
                title={tab.description}
              >
                <Icon className="size-3.5" />
                <span>
                  {tab.id === "pr" && prCount > 0
                    ? `PR #${prCount}`
                    : tab.label}
                </span>
                <span
                  className={cn(
                    "inline-flex size-3.5 items-center justify-center rounded text-white/45 hover:bg-white/10 hover:text-white",
                    renderedTabs.length <= 1 &&
                      "pointer-events-none opacity-30",
                    railFullscreen && "hidden",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(tabId);
                  }}
                >
                  <X className="size-3" />
                </span>
              </button>
            );
          })}
          <FeaturePickerMenu
            addable={addableTabs}
            onSelect={addTab}
            isDisabled={() => false}
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleRailExpanded}
            className="inline-flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-[#1a1a1a] hover:text-white"
            aria-label={
              railExpanded ? "Restore split layout" : "Expand tools panel"
            }
            title={railExpanded ? "Restore split layout" : "Expand tools panel"}
          >
            {railExpanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleRailFullscreen}
            className="inline-flex size-7 items-center justify-center rounded-md text-white/45 hover:bg-[#1a1a1a] hover:text-white"
            aria-label="Open panel in new window"
            title={railFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-[#070707]">
        {activePanel == null ? <NewTabPanel /> : null}

        {activePanel === "shell" ? (
          <div className="flex h-full min-h-0 flex-col gap-2 p-2">
            <div className="relative min-h-0 flex-[1.25] overflow-hidden rounded-md border border-[#242424] bg-[#0a0a0a]">
              <div className="flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[12px] text-white/90">
                    default
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/55">
                    Shell
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/65">
                    {desktopState.osType === "windows"
                      ? "Windows"
                      : desktopState.osType === "ubuntu"
                        ? "Ubuntu"
                        : "Ubuntu"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/65">
                    {shellLiveState === "running"
                      ? "Live"
                      : shellLiveState === "starting"
                        ? "Starting"
                        : shellLiveState === "blocked"
                          ? "Blocked"
                          : "Idle"}
                  </span>
                </div>
                {shellCommandError ? (
                  <span className="shrink-0 rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200">
                    {shellCommandError}
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-hidden">
                  {normalizedRuntimeSessionId ? (
                    <ContinuityLabSessionShellTerminal
                      threadId={normalizedRuntimeSessionId}
                      onSnapshot={handleLiveShellSnapshot}
                      onError={setShellCommandError}
                      scrollToEndToken={shellTerminalScrollToken}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/45">
                      Waiting for runtime shell...
                    </div>
                  )}
                </div>

                {focusedShellEntryId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const element =
                        document.getElementById(
                          `shell-history-${focusedShellEntryId}`,
                        ) ??
                        document.getElementById(
                          `shell-transcript-${focusedShellEntryId}`,
                        );
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/90 px-3 py-1 text-[11px] font-medium text-black shadow-lg shadow-black/30 transition hover:bg-white"
                  >
                    Jump to Output
                    <span aria-hidden="true">›</span>
                  </button>
                ) : null}

                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-white/45">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-2.5 py-1 text-white/50 hover:bg-white/5 hover:text-white"
                    aria-label="Back"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-2.5 py-1 text-white/50 hover:bg-white/5 hover:text-white"
                    aria-label="Forward"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setShellTerminalScrollToken((current) => current + 1)
                    }
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/80 hover:bg-white/[0.08] hover:text-white"
                  >
                    Go to end
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-[0.95] overflow-hidden rounded-md border border-[#242424] bg-[#090909]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="text-[10px] uppercase tracking-wide text-white/45">
                    Command history
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                    {desktopState.osType === "windows" ? "Windows" : "Ubuntu"}
                  </span>
                </div>
              </div>
              <div className="border-b border-white/8 px-3 py-2">
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] text-white/45">
                  <Search className="size-3.5 shrink-0" />
                  <input
                    value={shellHistoryQuery}
                    onChange={(event) =>
                      setShellHistoryQuery(event.target.value)
                    }
                    placeholder="Search Command History"
                    className="w-full bg-transparent text-[11px] text-white/80 outline-none placeholder:text-white/25"
                  />
                  {shellHistoryQuery ? (
                    <button
                      type="button"
                      onClick={() => setShellHistoryQuery("")}
                      className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/5 hover:text-white"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-white/8 px-3 py-2 text-[10px] uppercase tracking-wide text-white/35">
                <span>Command</span>
                <div className="flex items-center gap-10">
                  <span>Status</span>
                  <span>Duration</span>
                  <span>Start</span>
                </div>
              </div>
              <div className="max-h-[36vh] overflow-auto">
                {filteredShellHistoryRows.length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-white/45">
                    {shellHistoryQuery
                      ? "No matching shell commands."
                      : "No shell commands yet. Use the live terminal above to populate this history."}
                  </div>
                ) : (
                  filteredShellHistoryRows.map((entry, index) => {
                    const previousAt =
                      index > 0
                        ? new Date(
                            filteredShellHistoryRows[index - 1]!.at,
                          ).getTime()
                        : null;
                    const currentAt = new Date(entry.at).getTime();
                    const duration =
                      previousAt &&
                      Number.isFinite(previousAt) &&
                      Number.isFinite(currentAt)
                        ? Math.max(
                            0,
                            Math.round((currentAt - previousAt) / 1000),
                          )
                        : null;
                    const isFuture = currentAt > now;
                    const statusTone =
                      entry.state === "working"
                        ? "bg-emerald-400"
                        : entry.state === "error"
                          ? "bg-rose-400"
                          : "bg-sky-400";
                    const startLabel = new Date(entry.at).toLocaleString(
                      "en-US",
                      {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      },
                    );
                    return (
                      <div
                        key={entry.id}
                        id={`shell-history-${entry.id}`}
                        className={cn(
                          "group border-b border-white/[0.06] px-3 py-2.5 text-left transition hover:bg-white/[0.03]",
                          focusedShellEntryId === entry.id && "bg-white/[0.04]",
                          isFuture && "opacity-40",
                        )}
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-3">
                          <button
                            type="button"
                            onClick={() => jumpToShellEntry(entry)}
                            className="min-w-0 text-left"
                          >
                            <p className="truncate font-mono text-[12px] text-white/88">
                              {entry.title}
                            </p>
                          </button>
                          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-white/45">
                            <span
                              className={cn("size-2 rounded-full", statusTone)}
                            />
                            <span className="font-mono">
                              {duration != null ? `${duration}s` : "Live"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-white/45">
                            <button
                              type="button"
                              onClick={() => jumpToShellEntry(entry)}
                              className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-white/55 hover:bg-white/[0.08] hover:text-white"
                            >
                              {startLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyShellEntry({
                                  id: entry.id,
                                  title: entry.title,
                                  output:
                                    "output" in entry ? entry.output : null,
                                  detail: entry.detail,
                                })
                              }
                              className="inline-flex size-6 items-center justify-center rounded-full border border-white/10 text-white/40 opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-white"
                              aria-label="Copy shell command"
                              title="Copy command and output"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activePanel === "changes" ? (
          liveFileChanges.length === 0 ? (
            <EmptyCenter text="No changes yet" />
          ) : (
            <div className="h-full overflow-auto p-3">
              <div className="mb-3">
                <PanelIntro
                  eyebrow="Changes"
                  title="Code changes workspace"
                  description="Inspect file edits, compare them against prior successful Mythic lineage, and move into governed write-back when the change set is ready."
                  meta={`${prChangeGroups.length} groups`}
                />
              </div>
              <div className="mb-3 rounded-md border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/85">
                  Change Lineage
                </p>
                <p className="mt-1 text-[11px] text-white/45">
                  Review changed files against prior successful Mythic runs
                  before write-back and PR creation.
                </p>
                <div className="mt-2">
                  <LineageReasonList brief={brief} />
                </div>
                {brief?.nextBestAction ? (
                  <p className="mt-2 text-[11px] text-indigo-100/85">
                    Next best action: {brief.nextBestAction}
                  </p>
                ) : null}
                {showWriteBackBanner && writeBackPrefill ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPropose(writeBackPrefill)}
                      className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-200"
                    >
                      Open governed write-back
                    </button>
                    <button
                      type="button"
                      onClick={onDismissWriteBackBanner}
                      className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/70"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                {prChangeGroups.map((group) => (
                  <section
                    key={group.id}
                    className="overflow-hidden rounded-md border border-white/10 bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 px-3 py-2.5">
                      <div className="min-w-0 flex items-start gap-3">
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/25 text-[11px] font-semibold text-white/80">
                          {group.index}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {group.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-white/48">
                            {group.detail || group.summary}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                        {group.files.length} file
                        {group.files.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="space-y-1.5 px-3 py-2.5">
                      {group.files.map((file) => {
                        const lineage = lineageByFile.get(file) ?? [];
                        const matchedChange = liveFileChanges.find(
                          (change) => change.path === file,
                        );
                        return (
                          <div
                            key={`${group.id}:${file}`}
                            className="rounded-md border border-white/8 bg-[#0a0a0a] px-3 py-2 text-[11px] text-white/76"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-medium text-white/90">
                                  {file}
                                  {focusChangePath === file ? (
                                    <span className="ml-2 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-200">
                                      Focused
                                    </span>
                                  ) : null}
                                </p>
                                <p className="mt-0.5 text-white/45">
                                  {matchedChange?.kind}
                                  {matchedChange?.detail
                                    ? ` · ${matchedChange.detail}`
                                    : ""}
                                </p>
                              </div>
                              {lineage.length > 0 ? (
                                <span className="shrink-0 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] px-2 py-0.5 text-[10px] text-indigo-200">
                                  Related run
                                </span>
                              ) : null}
                            </div>
                            {matchedChange?.content ? (
                              <p className="mt-2 line-clamp-3 whitespace-pre-line text-white/58">
                                {matchedChange.content}
                              </p>
                            ) : null}
                            {lineage.length > 0 ? (
                              <div className="mt-2 rounded border border-indigo-500/15 bg-indigo-500/5 px-2 py-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200/85">
                                  Related successful run
                                </p>
                                <p className="mt-1 whitespace-pre-line text-[11px] text-white/75">
                                  {formatLineageSummary(lineage[0]!)}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )
        ) : null}

        {activePanel === "agents" ? (
          <div className="h-full overflow-auto p-3">
            <div className="mb-3">
              <PanelIntro
                eyebrow="Agents"
                title="Mythic agent board"
                description="Track manager, coder, reviewer, and verifier progress, inspect handoffs, and use operator actions only when the runtime flow needs intervention."
                meta={runtimeThread?.executionState?.activeRole ?? "manager"}
              />
            </div>
            <ContinuityLabMultiAgentPanel conversationId={sessionId} />
          </div>
        ) : null}

        {activePanel === "worklog" ? (
          timelineEntries.length === 0 && plannerSteps.length === 0 ? (
            <EmptyCenter text="No worklog events yet" />
          ) : (
            <div className="h-full overflow-auto p-3 text-sm text-white/80">
              <div className="mb-3">
                <PanelIntro
                  eyebrow="Worklog"
                  title="Execution timeline"
                  description="Chronological trace across runtime logs, handoffs, approvals, retries, and reused Mythic lineage."
                  meta={`${timelineEntries.length} events`}
                />
              </div>
              {plannerSteps.length > 0 ? (
                <div className="mb-3 rounded-md border border-indigo-500/15 bg-indigo-500/5 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200/85">
                        Planner DAG
                      </p>
                      <p className="mt-1 text-[11px] text-white/45">
                        Derived directly from runtime execution steps,
                        approvals, retries, and handoff lineage.
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                      {plannerSteps.length} steps
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {plannerSteps.map(
                      ({
                        step,
                        index,
                        isActive,
                        stateLabel,
                        reason,
                        linkedArtifacts,
                      }) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "min-w-[170px] rounded-md border px-3 py-2",
                              plannerTone(step, isActive),
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
                                {step.stage}
                              </span>
                              <span className="text-[10px] text-white/60">
                                {stateLabel}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-current">
                              {step.label}
                            </p>
                            <p className="mt-1 text-[11px] text-white/70">
                              {step.role}
                              {typeof step.retryCount === "number" &&
                              step.retryCount > 0
                                ? ` · retry ${step.retryCount}`
                                : ""}
                            </p>
                            {reason ? (
                              <p className="mt-1 line-clamp-3 text-[11px] text-white/65">
                                {reason}
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {step.proposalIds?.length ? (
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/60">
                                  Proposal {step.proposalIds.length}
                                </span>
                              ) : null}
                              {linkedArtifacts.length ? (
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/60">
                                  Artifact {linkedArtifacts.length}
                                </span>
                              ) : null}
                              {step.approvalStatus ? (
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/60">
                                  {step.approvalStatus.replaceAll("_", " ")}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {index < plannerSteps.length - 1 ? (
                            <span className="text-white/25">→</span>
                          ) : null}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
              <div className="mb-3 rounded-md border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/85">
                  End-to-End Trace
                </p>
                <p className="mt-1 text-[11px] text-white/45">
                  Chronological audit trail across runtime logs, handoffs,
                  approvals, retries, and reused Mythic lineage.
                </p>
                <div className="mt-2">
                  <LineageReasonList brief={brief} />
                </div>
              </div>
              {timelineEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border-b border-white/10 py-2 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        "text-sm",
                        entry.tone === "success" && "text-emerald-200",
                        entry.tone === "warn" && "text-amber-200",
                        entry.tone === "error" && "text-rose-200",
                        entry.tone === "info" && "text-indigo-200",
                      )}
                    >
                      {entry.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-white/35">
                      {entry.at.slice(11, 19)}
                    </span>
                  </div>
                  {entry.detail ? (
                    <p className="mt-1 whitespace-pre-line text-xs text-white/50">
                      {entry.detail}
                    </p>
                  ) : null}
                </div>
              ))}
              {runtimeThread?.executionState?.retryCount ? (
                <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/65">
                  Total runtime retries:{" "}
                  {runtimeThread.executionState.retryCount}
                </div>
              ) : null}
            </div>
          )
        ) : null}

        {activePanel === "memory" ? (
          <div className="h-full overflow-auto p-3">
            <div className="mb-3">
              <PanelIntro
                eyebrow="Continuity"
                title="Company Brain context"
                description="Resume reasoning, selected memories, and Mythic lineage stay hidden from the main chat and open here on demand."
                meta={repoFullName ?? labProjectId}
              />
            </div>
            <ContinuityLabSessionContinuityPanel
              projectId={labProjectId}
              repoFullName={repoFullName}
              launchContext={launchContext}
              sessionQuestion={sessionQuestion}
              sessionMemories={sessionMemories}
              handoffPacket={handoffPacket}
              playbook={playbook}
            />
          </div>
        ) : null}
        {activePanel === "pr" ? (
          <div className="h-full overflow-auto p-3">
            <ContinuityLabPrReviewPanel
              review={prReview}
              onApprove={() => void reviewDecision("approve")}
              onRequestChanges={() => void reviewDecision("reject")}
              onSaveLearnings={saveLearnings}
              onMerge={() => void mergeReview()}
              onOpenPreview={openPreviewLink}
              onOpenGitHub={openPrLink}
            />
          </div>
        ) : null}
        {panel === "session" ? (
          <div className="h-full overflow-auto p-3 text-sm text-white/80">
            <div className="mb-3">
              <PanelIntro
                eyebrow="Progress"
                title={sessionOverview.goal}
                description={sessionOverview.summary}
                meta={runtimeThread?.executionState?.activeRole ?? sessionTitle}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <section className="rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/45">
                      Current session
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/90">
                      Progress, runtime, and surface status
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                    {runtimeThread?.executionState?.status?.replaceAll(
                      "_",
                      " ",
                    ) ?? (shellLiveState === "running" ? "running" : "waiting")}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Runtime role
                    </p>
                    <p className="mt-1 text-sm text-white/85">
                      {runtimeThread?.executionState?.activeRole ?? "manager"}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Shell
                    </p>
                    <p className="mt-1 text-sm text-white/85">
                      {shellLiveState}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Desktop
                    </p>
                    <p className="mt-1 text-sm text-white/85">
                      {desktopFreshness}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Commands
                    </p>
                    <p className="mt-1 text-sm text-white/85">
                      {shellHistoryRows.length} tracked
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPanelChange("shell")}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    Open shell <ArrowRight className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPanelChange("desktop")}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    Open desktop <ArrowRight className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPanelChange("worklog")}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    Open worklog <ArrowRight className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPanelChange("memory")}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    Open continuity <ArrowRight className="size-3" />
                  </button>
                </div>
              </section>

              <section className="rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/45">
                      Next best action
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/90">
                      What Devin-style progress should do next
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                    {sessionMemories.length} memories
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  {sessionOverview.nextAction}
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Blockers
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sessionOverview.blockers.length ? (
                        sessionOverview.blockers.slice(0, 5).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-white/40">
                          No blockers surfaced yet.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Risks
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sessionOverview.risks.length ? (
                        sessionOverview.risks.slice(0, 6).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-100"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-white/40">
                          No risky files or risks flagged.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Memory signal
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {(sessionMemories.slice(0, 3).length
                        ? sessionMemories.slice(0, 3)
                        : []
                      ).map((memory) => (
                        <div
                          key={`${memory.title}-${memory.confidence}`}
                          className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-white/84">
                              {memory.title}
                            </p>
                            <span className="shrink-0 text-[10px] uppercase tracking-wide text-white/35">
                              {memory.importance}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/45">
                            {memory.content}
                          </p>
                        </div>
                      ))}
                      {!sessionMemories.length ? (
                        <p className="text-[11px] text-white/40">
                          No memory extraction loaded yet.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className="mt-3 rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/45">
                    Execution steps
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/90">
                    Live task progress from the runtime planner
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                  {plannerSteps.length} steps
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {plannerSteps
                  .slice(0, 6)
                  .map(
                    ({
                      step,
                      index,
                      isActive,
                      stateLabel,
                      reason,
                      linkedArtifacts,
                    }) => (
                      <div
                        key={step.id}
                        className={cn(
                          "rounded-md border px-3 py-2.5",
                          isActive
                            ? "border-indigo-500/30 bg-indigo-500/8"
                            : "border-white/10 bg-white/[0.03]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wide text-white/40">
                              Step {index + 1} · {step.stage}
                            </p>
                            <p className="mt-1 text-sm font-medium text-white/88">
                              {step.label}
                            </p>
                            <p className="mt-1 text-[11px] text-white/48">
                              {step.role}
                              {typeof step.retryCount === "number" &&
                              step.retryCount > 0
                                ? ` · retry ${step.retryCount}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                              {stateLabel}
                            </span>
                            {linkedArtifacts.length ? (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/45">
                                {linkedArtifacts.length} artifacts
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {reason ? (
                          <p className="mt-2 text-[11px] leading-5 text-white/48">
                            {reason}
                          </p>
                        ) : null}
                      </div>
                    ),
                  )}
              </div>
            </section>

            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              <section className="rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/45">
                      Shell stream
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/90">
                      Commands and output in one timeline
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                    {shellHistoryRows.length}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {shellHistoryRows.slice(-3).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onPanelChange("shell")}
                      className="flex w-full items-start justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left hover:bg-white/[0.05]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-white/84">
                          {entry.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-white/42">
                          {entry.detail || "Shell command"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-white/35">
                        {entry.at.slice(11, 19)}
                      </span>
                    </button>
                  ))}
                  {!shellHistoryRows.length ? (
                    <p className="text-[11px] text-white/40">
                      No shell commands recorded yet.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/45">
                      Desktop
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/90">
                      Live viewport and control surface
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                    {desktopFreshness}
                  </span>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/48">
                  {runtimeThread?.desktopSession?.state
                    ? `Desktop session is ${runtimeThread.desktopSession.state.replaceAll("_", " ")}.`
                    : "No desktop session state yet."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPanelChange("desktop")}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                  >
                    View desktop <ArrowRight className="size-3" />
                  </button>
                  {wakingDesktop ? (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-100">
                      Waking desktop...
                    </span>
                  ) : null}
                </div>
              </section>

              <section className="rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/45">
                      Continuity
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/90">
                      Memory and handoff trail
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                    {handoffPacket?.newMemories.length ?? 0}
                  </span>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/48">
                  {handoffPacket?.summary ??
                    playbook?.title ??
                    "No continuity packet has been generated yet."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPanelChange("memory")}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/8 hover:text-white"
                  >
                    View memory <ArrowRight className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onPanelChange("worklog")}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/8 hover:text-white"
                  >
                    View timeline <ArrowRight className="size-3" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

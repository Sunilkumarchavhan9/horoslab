"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCopy,
  GitPullRequest,
  HelpCircle,
  Loader2,
  Play,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";
import { readResumeProject } from "@/lib/continuity-launch-context";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import {
  fetchResumeBrief,
  projectIdForLab,
  type OperationalResumeBrief,
} from "@/lib/continuity-lab/resume-brief";
import {
  fetchDecisionHistory,
  fetchExecutionHistory,
  findIncidentContext,
  formatLineageSummary,
  type ExecutionLineageItem,
} from "@/lib/continuity-lab/operational-api";
import { startLabSessionWithBrief } from "@/lib/continuity-lab/sessions";

type ContinuityLabOperationalWorkflowsProps = {
  projectId: string | null;
  defaultRepo: string | null;
  onPrefillPrompt?: (text: string) => void;
};

type WorkflowModal =
  | { kind: "risky-files"; files: string[]; brief: OperationalResumeBrief | null }
  | { kind: "lineage"; item: ExecutionLineageItem }
  | null;

type WorkflowCardDef = {
  id: string;
  title: string;
  outcome: string;
  icon: typeof Play;
  disabled: boolean;
  disabledReason?: string;
  loading?: boolean;
  href?: string;
  onClick?: () => void;
};

function DarkModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg border border-[#3A3A3A] bg-[#111111] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2F2F2F] px-4 py-3">
          <p className="text-sm font-semibold text-[#F0EFE2]">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-[#F0EFE2]/50 hover:text-[#F0EFE2]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ContinuityLabOperationalWorkflows({
  projectId,
  defaultRepo,
  onPrefillPrompt,
}: ContinuityLabOperationalWorkflowsProps) {
  const router = useRouter();
  const {
    connector,
    canStartSession,
    modelReady,
    openCompanyModelModal,
    refresh,
  } = useContinuityLab();

  const githubConnected = connector.payload.github.connected;
  const resolvedProject =
    projectId ??
    readResumeProject() ??
    (defaultRepo ? projectIdForLab({ repoFullName: defaultRepo }) : null);

  const [brief, setBrief] = useState<OperationalResumeBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [hasIncidents, setHasIncidents] = useState<boolean | null>(null);
  const [hasLineage, setHasLineage] = useState<boolean | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [modal, setModal] = useState<WorkflowModal>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportDone, setExportDone] = useState(false);

  useEffect(() => {
    if (!resolvedProject || !githubConnected) {
      setBrief(null);
      setHasIncidents(null);
      setHasLineage(null);
      return;
    }

    let cancelled = false;
    setBriefLoading(true);

    void (async () => {
      const [loadedBrief, decisions, lineage] = await Promise.all([
        fetchResumeBrief({
          projectId: resolvedProject,
          repo: defaultRepo,
          question: "Where should we continue from the latest organizational memory?",
        }),
        fetchDecisionHistory(resolvedProject, 30),
        fetchExecutionHistory(resolvedProject, 5),
      ]);

      if (cancelled) return;

      setBrief(loadedBrief);
      setHasIncidents(
        Boolean(
          findIncidentContext({
            decisions,
            openBlockers: loadedBrief?.openBlockers ?? [],
          }),
        ),
      );
      setHasLineage(lineage.length > 0);
      setBriefLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedProject, defaultRepo, githubConnected]);

  const riskyFiles = brief?.riskyFiles ?? [];
  const resumePrompt =
    brief?.nextBestAction?.trim() ||
    brief?.currentGoal?.trim() ||
    "Continue the last coding task from company memory.";

  const requireSessionReady = useCallback((): boolean => {
    if (!canStartSession) {
      setError("Save your Company Model (OpenRouter key + model) before starting a session.");
      openCompanyModelModal();
      return false;
    }
    return true;
  }, [canStartSession, openCompanyModelModal]);

  async function startSession(prompt: string, briefQuestion?: string) {
    if (!requireSessionReady()) return;
    if (!resolvedProject) {
      setError("Connect GitHub to scope a repo before starting a session.");
      return;
    }
    setError(null);
    setActiveWorkflow("session");
    try {
      const { sessionPath } = await startLabSessionWithBrief({
        prompt,
        project: resolvedProject,
        repo: defaultRepo,
        operationalBrief: brief,
        briefQuestion,
      });
      await refresh();
      router.push(sessionPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setActiveWorkflow(null);
    }
  }

  async function handleResumeCodingTask() {
    onPrefillPrompt?.(resumePrompt);
    await startSession(
      resumePrompt,
      "Resume the last unfinished coding task for this project.",
    );
  }

  async function handleContinueIncident() {
    if (!resolvedProject) return;
    setActiveWorkflow("incident");
    setError(null);
    try {
      const decisions = await fetchDecisionHistory(resolvedProject, 30);
      const incident = findIncidentContext({
        decisions,
        openBlockers: brief?.openBlockers ?? [],
      });
      if (!incident) {
        setError("No active incident found in company memory.");
        return;
      }
      const prompt = [
        "Continue the open deployment incident from company memory.",
        incident.summary,
        "Summarize current state, blockers, and the next safe step before making changes.",
      ].join("\n");
      onPrefillPrompt?.(prompt);
      await startSession(prompt, `Continue incident context: ${incident.summary.slice(0, 120)}`);
    } finally {
      setActiveWorkflow(null);
    }
  }

  async function handleRiskyFiles() {
    if (riskyFiles.length === 0) return;
    if (brief) {
      setModal({ kind: "risky-files", files: riskyFiles, brief });
      return;
    }
    if (!resolvedProject) return;
    setActiveWorkflow("risky");
    try {
      const loaded = await fetchResumeBrief({
        projectId: resolvedProject,
        repo: defaultRepo,
        question: "Which files are risky from recent changes?",
      });
      const files = loaded?.riskyFiles ?? [];
      if (files.length === 0) {
        setError("No risky files flagged in the operational brief.");
        return;
      }
      setModal({ kind: "risky-files", files, brief: loaded });
    } finally {
      setActiveWorkflow(null);
    }
  }

  async function handleWhyLastAction() {
    if (!resolvedProject) return;
    setActiveWorkflow("lineage");
    setError(null);
    try {
      const items = await fetchExecutionHistory(resolvedProject, 10);
      const latest = items[0];
      if (!latest) {
        setError("No execution lineage recorded yet.");
        setHasLineage(false);
        return;
      }
      setModal({ kind: "lineage", item: latest });
    } finally {
      setActiveWorkflow(null);
    }
  }

  async function handleExportBrief() {
    if (!resolvedProject) return;
    setActiveWorkflow("export");
    setExportDone(false);
    try {
      const loaded =
        brief ??
        (await fetchResumeBrief({
          projectId: resolvedProject,
          repo: defaultRepo,
          question: "Export operational brief for teammate onboarding.",
        }));
      if (!loaded) {
        setError("No operational brief available to export.");
        return;
      }
      const exportPayload = {
        project: resolvedProject,
        repo: defaultRepo,
        exportedAt: new Date().toISOString(),
        currentGoal: loaded.currentGoal,
        nextBestAction: loaded.nextBestAction,
        openBlockers: loaded.openBlockers,
        riskyFiles: loaded.riskyFiles,
        keyDecisions: loaded.keyDecisions,
        whatChangedRecently: loaded.whatChangedRecently,
        resumeConfidence: loaded.resumeConfidence.score,
      };
      await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
      setExportDone(true);
    } catch {
      setError("Could not copy brief to clipboard.");
    } finally {
      setActiveWorkflow(null);
    }
  }

  const githubBlock = !githubConnected
    ? "Connect GitHub to scope repo memory."
    : undefined;
  const modelBlock = !modelReady ? "Save your Company Model first." : undefined;

  const cards: WorkflowCardDef[] = [
      {
        id: "resume-coding",
        title: "Resume coding task",
        outcome: "Pick up the last agent task with an operational brief.",
        icon: Play,
        disabled: Boolean(githubBlock || modelBlock || !resolvedProject),
        disabledReason: modelBlock ?? githubBlock ?? "Scope a repository first.",
        loading: activeWorkflow === "session" && !modal,
        onClick: () => void handleResumeCodingTask(),
      },
      {
        id: "review-pr",
        title: "Review open PR",
        outcome: "Start a governed PR review with repo context.",
        icon: GitPullRequest,
        disabled: Boolean(githubBlock),
        disabledReason: githubBlock,
        href: "/continuity-lab/review",
      },
      {
        id: "continue-incident",
        title: "Continue incident",
        outcome: "Resume deployment or outage work from incident memory.",
        icon: ShieldAlert,
        disabled: Boolean(
          githubBlock ||
            modelBlock ||
            !resolvedProject ||
            (hasIncidents === false && !briefLoading),
        ),
        disabledReason:
          modelBlock ??
          githubBlock ??
          (hasIncidents === false ? "No active incident in memory." : "Loading incident context…"),
        loading: activeWorkflow === "incident",
        onClick: () => void handleContinueIncident(),
      },
      {
        id: "risky-files",
        title: "Risky files check",
        outcome: "See files flagged from recent changes before you edit.",
        icon: AlertTriangle,
        disabled: Boolean(
          githubBlock ||
            !resolvedProject ||
            (riskyFiles.length === 0 && !briefLoading && brief !== null),
        ),
        disabledReason:
          githubBlock ??
          (riskyFiles.length === 0 && brief !== null
            ? "No risky files in the brief."
            : "Loading brief…"),
        loading: activeWorkflow === "risky",
        onClick: () => void handleRiskyFiles(),
      },
      {
        id: "why-last-action",
        title: "Why last action?",
        outcome: "Explain rollback or execution from action lineage.",
        icon: HelpCircle,
        disabled: Boolean(
          !resolvedProject || (hasLineage === false && !briefLoading),
        ),
        disabledReason:
          hasLineage === false ? "No execution lineage recorded yet." : "Loading lineage…",
        loading: activeWorkflow === "lineage",
        onClick: () => void handleWhyLastAction(),
      },
      {
        id: "onboard-teammate",
        title: "Onboard teammate",
        outcome: "Copy brief export · open repo wiki",
        icon: UserPlus,
        disabled: Boolean(githubBlock || !resolvedProject),
        disabledReason: githubBlock ?? "Connect GitHub first.",
        loading: activeWorkflow === "export",
        onClick: () => void handleExportBrief(),
      },
    ];

  return (
    <>
      <section className="mt-10 w-full space-y-4 text-left">
        <div>
          <h2 className="text-sm font-semibold text-[#F0EFE2]">Operational continuity</h2>
          <p className="mt-1 text-xs text-[#F0EFE2]/45">
            Resume incidents, reviews, and agent work — not a blank chat.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const inner = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      card.disabled ? "text-[#F0EFE2]/25" : "text-indigo-300",
                    )}
                  />
                  {card.loading ? (
                    <Loader2 className="size-3.5 animate-spin text-[#F0EFE2]/40" />
                  ) : card.href && !card.disabled ? (
                    <ArrowRight className="size-3.5 text-[#F0EFE2]/30" />
                  ) : null}
                </div>
                <p
                  className={cn(
                    "mt-3 text-sm font-semibold",
                    card.disabled ? "text-[#F0EFE2]/35" : "text-[#F0EFE2]",
                  )}
                >
                  {card.title}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-relaxed",
                    card.disabled ? "text-[#F0EFE2]/25" : "text-[#F0EFE2]/50",
                  )}
                >
                  {card.disabled && card.disabledReason
                    ? card.disabledReason
                    : card.outcome}
                </p>
                {card.id === "onboard-teammate" && !card.disabled ? (
                  <Link
                    href="/continuity-lab/wiki"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 hover:text-indigo-200"
                  >
                    Open wiki
                    <ArrowRight className="size-3" />
                  </Link>
                ) : null}
              </>
            );

            const className = cn(
              "flex h-full min-h-[120px] flex-col rounded-md bg-white/[0.03] px-3 py-3 text-left transition",
              card.disabled
                ? "cursor-not-allowed opacity-70"
                : "hover:bg-white/[0.05]",
            );

            if (card.href && !card.disabled) {
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  onClick={card.onClick}
                  className={className}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={card.id}
                type="button"
                disabled={card.disabled || card.loading}
                onClick={card.onClick}
                className={className}
              >
                {inner}
              </button>
            );
          })}
        </div>

        {exportDone ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-200/90">
            <ClipboardCopy className="size-3.5" />
            Brief copied to clipboard — paste into wiki or Slack for handoff.
          </p>
        ) : null}

        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </section>

      {modal?.kind === "risky-files" ? (
        <DarkModal title="Risky files from brief" onClose={() => setModal(null)}>
          <ul className="space-y-2">
            {modal.files.map((file) => (
              <li
                key={file}
                className={cn(subtlePanel(), "px-3 py-2 font-mono text-xs text-[#F0EFE2]/80")}
              >
                {file}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={!canStartSession || activeWorkflow === "session"}
            onClick={() => {
              const prompt = [
                "Review these risky files before continuing work:",
                ...modal.files.slice(0, 12),
                "Summarize risk and suggest a safe continuation plan.",
              ].join("\n");
              setModal(null);
              void startSession(prompt, "Risky files review from operational brief.");
            }}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 bg-[#4338CA] text-xs font-semibold text-[#F0EFE2] hover:bg-[#4f46e5] disabled:opacity-40"
          >
            {activeWorkflow === "session" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                Start session with file context
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </DarkModal>
      ) : null}

      {modal?.kind === "lineage" ? (
        <DarkModal title="Latest action lineage" onClose={() => setModal(null)}>
          <div className="space-y-3 text-sm text-[#F0EFE2]/75">
            <p className="font-semibold text-[#F0EFE2]">{modal.item.actionMemory.action}</p>
            <p className="text-xs leading-relaxed text-[#F0EFE2]/55">{modal.item.actionMemory.reason}</p>
            <span
              className={cn(
                "inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                modal.item.actionMemory.outcome === "rolled_back"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : modal.item.actionMemory.outcome === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-200",
              )}
            >
              {modal.item.actionMemory.outcome.replace(/_/g, " ")}
            </span>
            <pre className={cn(subtlePanel(), "whitespace-pre-wrap p-3 font-sans text-xs leading-relaxed text-[#F0EFE2]/60")}>
              {formatLineageSummary(modal.item)}
            </pre>
          </div>
          {modal.item.actionMemory.outcome === "rolled_back" ? (
            <button
              type="button"
              disabled={!canStartSession || activeWorkflow === "session"}
              onClick={() => {
                const prompt = [
                  "Explain and continue from the rolled-back action:",
                  modal.item.actionMemory.action,
                  modal.item.actionMemory.reason,
                  "What should we do next safely?",
                ].join("\n");
                setModal(null);
                void startSession(prompt, "Continue after rollback from action lineage.");
              }}
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 bg-[#4338CA] text-xs font-semibold text-[#F0EFE2] hover:bg-[#4f46e5] disabled:opacity-40"
            >
              Continue from rollback
              <ArrowRight className="size-3.5" />
            </button>
          ) : null}
        </DarkModal>
      ) : null}
    </>
  );
}

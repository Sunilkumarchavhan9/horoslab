"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  PauseCircle,
  Play,
  RefreshCcw,
  Terminal,
  XCircle,
} from "lucide-react";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import {
  completeRuntimeExecutionStep,
  enqueueRuntimeExecutionWorker,
  getRuntimeThread,
  listThreadArtifacts,
  listThreadHandoffs,
  requestRuntimeExecutionRevision,
  retryRuntimeExecutionWorkerJob,
  startRuntimeExecutionStep,
  startRuntimeExecutionTask,
  submitRuntimeReviewDecision,
  type RuntimeAgentHandoff,
  type RuntimeArtifact,
  type RuntimeExecutionStep,
  type RuntimeThread,
} from "@/lib/continuity-lab/openhands-api";
import {
  fetchResumeBrief,
  type OperationalResumeBrief,
} from "@/lib/continuity-lab/resume-brief";
import { cn } from "@/lib/utils";

type AgentRole = "manager" | "coder" | "reviewer" | "verifier";

const AGENT_ORDER: AgentRole[] = ["manager", "coder", "reviewer", "verifier"];

const AGENT_ROLE_DETAILS: Record<
  AgentRole,
  { title: string; role: string; desc: string; avatarColor: string }
> = {
  manager: {
    title: "Manager Agent",
    role: "Orchestrator",
    desc: "Owns plan activation, stage progression, and final PR readiness.",
    avatarColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
  },
  coder: {
    title: "Coder Agent",
    role: "Implementation",
    desc: "Turns approved plan steps into code, tests, and proposed changes.",
    avatarColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  },
  reviewer: {
    title: "Reviewer Agent",
    role: "Approval Gate",
    desc: "Approves or rejects implementation output before verification proceeds.",
    avatarColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  },
  verifier: {
    title: "Verifier Agent",
    role: "QA Evidence",
    desc: "Records verification evidence and determines whether the task can move to PR.",
    avatarColor: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  },
};

function statusInfo(status: string) {
  if (status === "running") {
    return {
      label: "Working",
      color:
        "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 animate-pulse",
    };
  }
  if (status === "done" || status === "completed") {
    return {
      label: "Done",
      color: "text-[#6ca8ff] bg-[#102849]/20 border-[#1f4da4]/50",
    };
  }
  if (status === "failed" || status === "blocked") {
    return {
      label: "Blocked",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    };
  }
  return {
    label: "Idle",
    color: "text-white/45 bg-white/[0.03] border-white/10",
  };
}

function latestHandoffForRole(
  handoffs: RuntimeAgentHandoff[],
  role: AgentRole,
): RuntimeAgentHandoff | null {
  return (
    handoffs.find((handoff) => handoff.target === role || handoff.source === role) ??
    null
  );
}

function MythicProvenanceList({
  brief,
}: {
  brief: OperationalResumeBrief | null;
}) {
  const reasons = brief?.whyTheseMemoriesWereSelected ?? [];
  if (reasons.length === 0) {
    return (
      <p className="text-[11px] text-white/45">
        No reused Mythic lineage is attached to this runtime context yet.
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
            className="rounded border border-white/5 bg-[#101010] px-2 py-1.5 text-[11px] text-white/75"
          >
            <p className="font-medium text-white">{reason.summary}</p>
            <p className="mt-0.5 text-[10px] text-white/45">
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

export function ContinuityLabMultiAgentPanel({
  conversationId,
}: {
  conversationId?: string | null;
}) {
  const [thread, setThread] = useState<RuntimeThread | null>(null);
  const [handoffs, setHandoffs] = useState<RuntimeAgentHandoff[]>([]);
  const [artifacts, setArtifacts] = useState<RuntimeArtifact[]>([]);
  const [resumeBrief, setResumeBrief] = useState<OperationalResumeBrief | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>("manager");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execution = thread?.executionState ?? null;
  const activeStep =
    execution?.steps.find((step) => step.status === "running") ?? null;

  const selectedStep = useMemo(() => {
    if (!execution) return null;
    return (
      execution.steps.find(
        (step) =>
          step.role === selectedAgent &&
          (step.status === "running" || step.status === "pending"),
      ) ??
      execution.steps.find((step) => step.role === selectedAgent) ??
      null
    );
  }, [execution, selectedAgent]);

  const selectedHandoff = useMemo(
    () => latestHandoffForRole(handoffs, selectedAgent),
    [handoffs, selectedAgent],
  );

  const selectedArtifacts = useMemo(() => {
    if (!selectedStep) return artifacts.slice(0, 4);
    const stepArtifacts = artifacts.filter((artifact) =>
      selectedStep.artifactIds?.includes(artifact.id),
    );
    return stepArtifacts.length > 0 ? stepArtifacts : artifacts.slice(0, 4);
  }, [artifacts, selectedStep]);

  async function loadRuntimeState() {
    if (!conversationId || conversationId.startsWith("task-")) {
      setThread(null);
      setHandoffs([]);
      setArtifacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [runtimeThread, runtimeHandoffs, runtimeArtifacts] = await Promise.all([
        getRuntimeThread(conversationId),
        listThreadHandoffs(conversationId, 20),
        listThreadArtifacts(conversationId, 20),
      ]);
      setThread(runtimeThread);
      setHandoffs(runtimeHandoffs);
      setArtifacts(runtimeArtifacts);
      if (runtimeThread?.project) {
        const brief = await fetchResumeBrief({
          projectId: runtimeThread.project,
          repo: runtimeThread.repoPath ?? null,
          question:
            runtimeThread.goal?.trim() ||
            runtimeThread.title?.trim() ||
            "Why was this Mythic execution context selected?",
        });
        setResumeBrief(brief);
      } else {
        setResumeBrief(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Mythic runtime state.");
      setResumeBrief(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRuntimeState();
  }, [conversationId]);

  async function runAction(action: () => Promise<void>) {
    setActing(true);
    setError(null);
    try {
      await action();
      await loadRuntimeState();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Mythic action failed.",
      );
    } finally {
      setActing(false);
    }
  }

  const canStartTask = Boolean(conversationId && execution && !execution.taskId);
  const canStartStep = Boolean(
    conversationId && selectedStep && selectedStep.status === "pending",
  );
  const canCompleteStep = Boolean(
    conversationId && selectedStep && selectedStep.status === "running",
  );
  const canOrchestrate = Boolean(conversationId && execution?.steps.some((step) => step.status === "pending" || step.status === "running"));
  const canRetryWorker = Boolean(
    conversationId && execution?.workerStatus === "blocked" && execution.workerJobId,
  );

  const stepCounts = useMemo(() => {
    const counts: Record<AgentRole, string> = {
      manager: "idle",
      coder: "idle",
      reviewer: "idle",
      verifier: "idle",
    };
    for (const role of AGENT_ORDER) {
      const steps = execution?.steps.filter((step) => step.role === role) ?? [];
      if (steps.some((step) => step.status === "running")) counts[role] = "running";
      else if (steps.some((step) => step.status === "failed")) counts[role] = "error";
      else if (steps.length > 0 && steps.every((step) => step.status === "done"))
        counts[role] = "completed";
    }
    return counts;
  }, [execution]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center bg-[#070707] text-white/70">
        <div className="inline-flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading Mythic runtime…
        </div>
      </div>
    );
  }

  if (!conversationId || !thread) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center bg-[#070707] px-6 text-center text-white/55">
        No runtime thread is available for this panel yet.
      </div>
    );
  }

  if (!execution || execution.steps.length === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 bg-[#070707] px-6 text-center">
        <p className="text-sm text-white/70">No Mythic task has been activated for this thread yet.</p>
        <p className="text-xs text-white/45">
          Generate and activate a runtime plan to turn this session into a real multi-agent execution path.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col bg-[#070707] text-white">
      <div className="flex items-center justify-between border-b border-[#1f1f1f] bg-[#0c0c0c] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Multi-Agent task board
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadRuntimeState()}
            className="inline-flex size-7 items-center justify-center rounded border border-[#2a2a2a] text-white/60 hover:bg-[#1a1a1a] hover:text-white"
            title="Refresh runtime state"
          >
            <RefreshCcw className={cn("size-3", loading && "animate-spin")} />
          </button>
          {canStartTask ? (
            <button
              type="button"
              disabled={acting}
              onClick={() =>
                void runAction(async () => {
                  const result = await startRuntimeExecutionTask(conversationId);
                  if (!result.ok) throw new Error(result.error ?? "Could not start task.");
                })
              }
              className="inline-flex h-7 items-center gap-1.5 rounded border border-indigo-500/35 bg-indigo-500/10 px-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-60"
            >
              <Play className="size-3 fill-current" />
              Start task
            </button>
          ) : null}
          {canOrchestrate ? (
            <button
              type="button"
              disabled={acting}
              onClick={() =>
                void runAction(async () => {
                  const result = await enqueueRuntimeExecutionWorker(conversationId, {
                    reviewDecision: selectedAgent === "reviewer" ? "approve" : undefined,
                  });
                  if (!result.ok) throw new Error(result.error ?? "Could not queue the next Mythic step.");
                })
              }
              className="inline-flex h-7 items-center gap-1.5 rounded border border-emerald-500/35 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              <Bot className="size-3" />
              Queue next
            </button>
          ) : null}
          {canRetryWorker ? (
            <button
              type="button"
              disabled={acting}
              onClick={() =>
                void runAction(async () => {
                  const result = await retryRuntimeExecutionWorkerJob(
                    conversationId,
                    execution.workerJobId!,
                  );
                  if (!result.ok) throw new Error(result.error ?? "Could not retry the blocked Mythic worker job.");
                })
              }
              className="inline-flex h-7 items-center gap-1.5 rounded border border-amber-500/35 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
            >
              <RefreshCcw className="size-3" />
              Retry blocked job
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-md border border-white/5 bg-[#101010]/60 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Current Stage
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {execution.currentStage.toUpperCase()} · {execution.status.toUpperCase()}
              </p>
            </div>
            <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/60">
              {execution.taskId ?? "Task pending activation"}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/75">
            {execution.approvalBlocked
              ? "Execution is blocked on approval or revision."
              : execution.blockedReason
                ? `Worker is blocked: ${execution.blockedReason.replaceAll("_", " ")}.`
              : execution.failureReason
                ? execution.failureReason
                : activeStep
                  ? `${activeStep.role} is working on: ${activeStep.label}`
                  : "Execution is ready for the next stage transition."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/55">
            <span className="rounded-full bg-white/[0.04] px-2 py-0.5">
              Worker: {execution.workerStatus ?? "idle"}
            </span>
            {execution.workerJobId ? (
              <span className="rounded-full bg-white/[0.04] px-2 py-0.5">
                Job: {execution.workerJobId}
              </span>
            ) : null}
          </div>
          {execution.lastWorkerError ? (
            <div className="mt-2 rounded border border-rose-500/15 bg-rose-500/5 px-2 py-1 text-[11px] text-rose-200">
              {execution.lastWorkerError}
            </div>
          ) : null}
          <div className="mt-3 rounded border border-emerald-500/15 bg-emerald-500/5 px-2.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/85">
              Borrowed Mythic Lineage
            </p>
            <p className="mt-1 text-[11px] text-white/45">
              Prior successful runs that the current execution can reuse for handoff quality, verification, and PR readiness.
            </p>
            <div className="mt-2">
              <MythicProvenanceList brief={resumeBrief} />
            </div>
          </div>
          {error ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200">
              <AlertTriangle className="size-3" />
              {error}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
            Agent Status Flow
          </p>
          <div className="grid grid-cols-4 items-center gap-1 rounded-md border border-[#1f1f1f] bg-[#0c0c0c] p-3">
            {AGENT_ORDER.map((agentId, index) => {
              const details = AGENT_ROLE_DETAILS[agentId];
              const info = statusInfo(stepCounts[agentId]);
              const isSelected = selectedAgent === agentId;
              const isActive = execution.activeRole === agentId;
              return (
                <React.Fragment key={agentId}>
                  <div
                    onClick={() => setSelectedAgent(agentId)}
                    className={cn(
                      "group relative flex cursor-pointer flex-col items-center justify-between rounded-md border p-2 text-center transition-all hover:bg-white/[0.02]",
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                        : "border-white/5",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide transition-all",
                        info.color,
                      )}
                    >
                      {info.label}
                    </div>
                    <div
                      className={cn(
                        "mt-2 flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                        details.avatarColor,
                        isActive && "animate-pulse",
                      )}
                    >
                      {agentId.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="mt-1.5 text-[11px] font-medium text-white/90">
                      {details.title.split(" ")[0]}
                    </span>
                  </div>
                  {index < AGENT_ORDER.length - 1 ? (
                    <div className="flex justify-center text-white/25" aria-hidden="true">
                      <ArrowRight className="size-3.5 text-white/10" />
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className={cn(subtlePanel(), "flex flex-col justify-between space-y-3 p-3.5")}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-[10px] font-bold",
                    AGENT_ROLE_DETAILS[selectedAgent].avatarColor,
                  )}
                >
                  {selectedAgent.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {AGENT_ROLE_DETAILS[selectedAgent].title}
                  </h4>
                  <p className="text-[10px] text-white/45">
                    Role: {AGENT_ROLE_DETAILS[selectedAgent].role}
                  </p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-white/70">
                {AGENT_ROLE_DETAILS[selectedAgent].desc}
              </p>
              {selectedStep ? (
                <div className="rounded border border-white/5 bg-[#101010] p-2 text-[11px] text-white/75">
                  <p className="font-medium text-white">{selectedStep.label}</p>
                  <p className="mt-1 text-white/50">
                    {selectedStep.stage} · {selectedStep.status}
                    {selectedStep.approvalStatus &&
                    selectedStep.approvalStatus !== "not_required"
                      ? ` · approval ${selectedStep.approvalStatus}`
                      : ""}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {canStartStep && selectedStep ? (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() =>
                    void runAction(async () => {
                      const result = await startRuntimeExecutionStep(conversationId, {
                        stepId: selectedStep.id,
                        role: selectedAgent,
                      });
                      if (!result.ok) throw new Error(result.error ?? "Could not start step.");
                    })
                  }
                  className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200"
                >
                  <Play className="size-3 fill-current" />
                  Start step
                </button>
              ) : null}
              {canCompleteStep && selectedStep ? (
                <>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      void runAction(async () => {
                        const result = await completeRuntimeExecutionStep(conversationId, {
                          stepId: selectedStep.id,
                          approvalStatus:
                            selectedAgent === "reviewer" ? "approved" : "not_required",
                          note: `${selectedAgent} completed ${selectedStep.label}`,
                        });
                        if (!result.ok) throw new Error(result.error ?? "Could not complete step.");
                      })
                    }
                    className="inline-flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-200"
                  >
                    <CheckCircle2 className="size-3" />
                    Complete
                  </button>
                  {selectedAgent === "reviewer" ? (
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() =>
                        void runAction(async () => {
                          const result = await completeRuntimeExecutionStep(conversationId, {
                            stepId: selectedStep.id,
                            approvalStatus: "rejected",
                            note: "Reviewer blocked the current implementation output.",
                          });
                          if (!result.ok) throw new Error(result.error ?? "Could not reject step.");
                        })
                      }
                      className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200"
                    >
                      <PauseCircle className="size-3" />
                      Reject
                    </button>
                  ) : null}
                  {selectedAgent === "reviewer" ? (
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() =>
                        void runAction(async () => {
                          const result = await submitRuntimeReviewDecision(conversationId, {
                            decision: "approve",
                            note: "Reviewer approved the current implementation output.",
                          });
                          if (!result.ok) throw new Error(result.error ?? "Could not submit reviewer approval.");
                        })
                      }
                      className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200"
                    >
                      <CheckCircle2 className="size-3" />
                      Submit approve
                    </button>
                  ) : null}
                  {selectedAgent === "reviewer" ? (
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() =>
                        void runAction(async () => {
                          const result = await submitRuntimeReviewDecision(conversationId, {
                            decision: "reject",
                            note: "Reviewer blocked the current implementation output.",
                          });
                          if (!result.ok) throw new Error(result.error ?? "Could not queue reviewer rejection.");
                        })
                      }
                      className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200"
                    >
                      <XCircle className="size-3" />
                      Auto reject
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      void runAction(async () => {
                        const result = await requestRuntimeExecutionRevision(conversationId, {
                          reason: `${selectedAgent} requested a revision before the next stage.`,
                          targetRole: "coder",
                        });
                        if (!result.ok) throw new Error(result.error ?? "Could not request revision.");
                      })
                    }
                    className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/75"
                  >
                    <RefreshCcw className="size-3" />
                    Request revision
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className={cn(subtlePanel(), "space-y-2 p-3.5")}>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <FileText className="size-3.5 text-indigo-400" />
              <span>Structured Context Inspector</span>
            </div>

            {selectedHandoff ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded border border-white/5 bg-[#101010] p-1.5 text-center">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-white/45">
                      Confidence
                    </span>
                    <span className="text-xs font-semibold text-indigo-300">
                      {Math.round(selectedHandoff.metadata.confidence * 100)}%
                    </span>
                  </div>
                  <div className="rounded border border-white/5 bg-[#101010] p-1.5 text-center">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-white/45">
                      Completeness
                    </span>
                    <span className="text-xs font-semibold text-emerald-300">
                      {Math.round(selectedHandoff.metadata.completeness * 100)}%
                    </span>
                  </div>
                </div>

                <div className="rounded border border-white/5 bg-[#101010] p-2">
                  <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-white/45">
                    Handoff Notes
                  </span>
                  <p className="text-[11px] italic text-white/80">
                    {selectedHandoff.metadata.notes}
                  </p>
                </div>

                <div className="rounded border border-white/5 bg-[#101010] p-2">
                  <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-white/45">
                    Requirements
                  </span>
                  <ul className="space-y-1">
                    {selectedHandoff.requirements.map((requirement) => (
                      <li
                        key={requirement}
                        className="flex items-start gap-1.5 text-[10px] text-white/80"
                      >
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-indigo-400" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {resumeBrief?.mustKnowContextForAgent?.length ? (
                  <div className="rounded border border-white/5 bg-[#101010] p-2">
                    <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-white/45">
                      Reused Context
                    </span>
                    <ul className="space-y-1">
                      {resumeBrief.mustKnowContextForAgent.slice(0, 4).map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-1.5 text-[10px] text-white/80"
                        >
                          <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded border border-dashed border-white/10 p-4 text-center">
                <p className="text-[11px] text-white/45">
                  No structured handoff exists yet for {AGENT_ROLE_DETAILS[selectedAgent].title}.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className={cn(subtlePanel(), "space-y-2 p-3.5")}>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Bot className="size-3.5 text-indigo-400" />
              <span>Execution Steps</span>
            </div>
            <div className="space-y-1.5">
              {execution.steps.map((step) => {
                const isDone = step.status === "done";
                const isRunning = step.status === "running";
                const isFailed = step.status === "failed";
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded border px-2.5 py-1.5 text-[11px] transition-all",
                      isDone
                        ? "border-[#1f4da4]/35 bg-[#102849]/10 text-white/80"
                        : isRunning
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                          : isFailed
                            ? "border-rose-500/30 bg-rose-500/5 text-rose-200"
                            : "border-white/5 bg-transparent text-white/55",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="size-3.5 shrink-0 text-[#6ca8ff]" />
                        ) : isRunning ? (
                          <Loader2 className="size-3.5 shrink-0 animate-spin text-emerald-400" />
                        ) : isFailed ? (
                          <XCircle className="size-3.5 shrink-0 text-rose-400" />
                        ) : (
                          <Circle className="size-3.5 shrink-0 text-white/30" />
                        )}
                        <span className="truncate">{step.label}</span>
                      </div>
                      <span className="shrink-0 rounded bg-white/[0.04] px-1 text-[8px] font-semibold uppercase">
                        {step.role}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/45">
                      {step.stage}
                      {step.approvalStatus && step.approvalStatus !== "not_required"
                        ? ` · approval ${step.approvalStatus}`
                        : ""}
                      {step.revisionReason ? ` · revision ${step.revisionReason}` : ""}
                      {step.failureReason ? ` · ${step.failureReason}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cn(subtlePanel(), "flex flex-col space-y-2 p-3.5")}>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Terminal className="size-3.5 text-emerald-400" />
              <span>Runtime Logs & Artifacts</span>
            </div>
            <div className="rounded border border-white/5 bg-black/60 p-2.5">
              <div className="space-y-1 font-mono text-[10px] text-emerald-400/90">
                {(thread.executionLog ?? []).slice(0, 8).map((log) => (
                  <div key={log.id} className="flex items-start gap-1 leading-relaxed">
                    <span className="select-none text-white/20">&gt;</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                  Artifact Links
                </p>
                {resumeBrief?.nextBestAction ? (
                  <div className="mb-2 rounded border border-indigo-500/15 bg-indigo-500/5 px-2 py-1.5 text-[11px] text-indigo-100/85">
                    Next best action from reused lineage: {resumeBrief.nextBestAction}
                  </div>
                ) : null}
                {selectedArtifacts.length === 0 ? (
                  <p className="text-[11px] text-white/45">No artifacts attached yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedArtifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="rounded border border-white/5 bg-[#101010] px-2 py-1.5 text-[11px] text-white/75"
                      >
                        <p className="font-medium text-white">{artifact.title}</p>
                        <p className="mt-0.5 text-white/45">
                          {artifact.type} · {artifact.uri}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

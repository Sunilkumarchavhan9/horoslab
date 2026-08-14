"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Shield } from "lucide-react";
import {
  executeLabProposal,
  fetchPendingExecutionProposals,
  markLabExecutionFunnelComplete,
  reviewLabExecutionProposal,
  type ExecutionProposalSummary,
} from "@/lib/continuity-lab/execution-governance";
import { recordLabAgentTurn } from "@/lib/continuity-lab/session-lineage";
import type { MemoryOSLaunchContext } from "@/lib/continuity-launch-context";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type ContinuityLabGovernancePanelProps = {
  projectId: string;
  sessionId: string;
  launchContext: MemoryOSLaunchContext | null;
  onOpenPropose: () => void;
  onExecuted?: (project: string | null) => void;
  refreshToken?: number;
};

function statusBadgeClass(status: ExecutionProposalSummary["status"]): string {
  if (status === "executed") return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
  if (status === "approved") return "border-[#6366F1]/40 bg-[#4338CA]/15 text-indigo-100";
  if (status === "failed" || status === "rejected") {
    return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  }
  return "border-[#3A3A3A] bg-[#141414] text-white/55";
}

export function ContinuityLabGovernancePanel({
  projectId,
  sessionId,
  launchContext,
  onOpenPropose,
  onExecuted,
  refreshToken = 0,
}: ContinuityLabGovernancePanelProps) {
  const [proposals, setProposals] = useState<ExecutionProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{
    id: string;
    status: ExecutionProposalSummary["status"];
  } | null>(null);

  const loadProposals = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchPendingExecutionProposals();
      setProposals(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load proposals.");
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadProposals();
  }, [loadProposals, refreshToken]);

  async function handleReview(
    proposalId: string,
    decision: "approve" | "reject",
    riskTier: ExecutionProposalSummary["riskTier"],
  ) {
    setBusyId(proposalId);
    setError(null);
    try {
      await reviewLabExecutionProposal(
        proposalId,
        decision,
        riskTier === "high",
      );
      await loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleExecute(proposalId: string) {
    setBusyId(proposalId);
    setError(null);
    try {
      const proposal = await executeLabProposal(proposalId);
      setLastOutcome({ id: proposal.id, status: proposal.status });
      if (proposal.status === "executed") {
        const project = await markLabExecutionFunnelComplete({
          project: launchContext?.project ?? projectId,
          launchContext,
        });
        void recordLabAgentTurn({
          sessionId,
          projectId,
          eventId: `execution-${proposal.id}`,
        });
        onExecuted?.(project);
      }
      await loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execute failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#2F2F2F] px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
          <Shield className="size-3 text-indigo-300" />
          Governed actions
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void loadProposals()}
            disabled={loading}
            className="inline-flex size-7 items-center justify-center text-white/50 hover:text-white"
            aria-label="Refresh proposals"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={onOpenPropose}
            className="h-7 border border-[#4338CA]/50 bg-[#4338CA]/20 px-2 text-[10px] font-semibold text-indigo-100 hover:bg-[#4338CA]/30"
          >
            Propose
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {lastOutcome?.status === "executed" ? (
          <p className="mb-3 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-[11px] text-emerald-100">
            Outcome saved to action memory.
          </p>
        ) : null}

        {error ? (
          <p className="mb-3 text-xs text-rose-300">{error}</p>
        ) : null}

        {loading ? (
          <p className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 className="size-3.5 animate-spin" />
            Loading proposals…
          </p>
        ) : proposals.length === 0 ? (
          <div className="space-y-2 text-xs text-white/40">
            <p>No pending governed actions.</p>
            <button
              type="button"
              onClick={onOpenPropose}
              className="text-indigo-300 underline hover:text-indigo-200"
            >
              Propose GitHub action
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {proposals.map((proposal) => (
              <li
                key={proposal.id}
                className={cn(subtlePanel(), "px-2.5 py-2")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {proposal.adapter} · {proposal.actionType}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/40">
                      {proposal.riskTier} risk
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 border px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      statusBadgeClass(proposal.status),
                    )}
                  >
                    {proposal.status}
                  </span>
                </div>
                {proposal.error ? (
                  <p className="mt-1 text-[10px] text-rose-300">{proposal.error}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {proposal.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === proposal.id}
                        onClick={() =>
                          void handleReview(proposal.id, "approve", proposal.riskTier)
                        }
                        className="border border-[#6366F1]/50 bg-[#4338CA]/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-100 disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === proposal.id}
                        onClick={() => void handleReview(proposal.id, "reject", proposal.riskTier)}
                        className="border border-[#3A3A3A] px-2 py-0.5 text-[10px] text-white/60 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {proposal.status === "approved" || proposal.status === "pending" ? (
                    <button
                      type="button"
                      disabled={busyId === proposal.id}
                      onClick={() => void handleExecute(proposal.id)}
                      className="border border-[#3A3A3A] px-2 py-0.5 text-[10px] text-white/70 disabled:opacity-40"
                    >
                      {busyId === proposal.id ? "…" : "Execute"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/mission-control?tab=Action%20Lineage"
          className="mt-4 inline-block text-[11px] text-indigo-300/90 underline hover:text-indigo-200"
        >
          View action lineage in Console
        </Link>
      </div>
    </div>
  );
}

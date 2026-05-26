"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COMPANY_BRAIN_FUNNEL_STEPS,
  deriveFunnelStepStatuses,
  dismissCompanyBrainFunnel,
  fetchServerFunnelProgress,
  focusFunnelOnGithub,
  isFunnelActive,
  isFunnelBriefLoaded,
  isFunnelComplete,
  isFunnelLabOpened,
  markFunnelLabOpened,
  patchServerFunnelProgress,
  type CompanyBrainFunnelStepId,
  type FunnelProgressInput,
  type FunnelStepStatus,
} from "@/lib/company-brain-funnel";
import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";
import { cn } from "@/lib/utils";

type CompanyBrainFunnelPanelProps = {
  progress: FunnelProgressInput;
  onConnectGithub: () => void;
  onSyncGithub: () => void;
  onContinueBrief: () => void;
  onOpenLab: () => void;
};

function stepAction(
  id: CompanyBrainFunnelStepId,
  handlers: CompanyBrainFunnelPanelProps,
): (() => void) | undefined {
  if (id === "connect_github") return handlers.onConnectGithub;
  if (id === "sync_github") return handlers.onSyncGithub;
  if (id === "continue_brief") return handlers.onContinueBrief;
  return handlers.onOpenLab;
}

function statusLabel(status: FunnelStepStatus): string {
  if (status === "done") return "Done";
  if (status === "current") return "Next";
  return "Pending";
}

export function CompanyBrainFunnelPanel(props: CompanyBrainFunnelPanelProps) {
  const [active, setActive] = useState(false);
  const [serverFlags, setServerFlags] = useState({
    briefLoaded: false,
    labOpened: false,
    dismissed: false,
  });

  useEffect(() => {
    setActive(isFunnelActive());
  }, []);

  useEffect(() => {
    void (async () => {
      const token = await getOrCreateMemoryTokenWithRetry({ attempts: 2, delayMs: 150 });
      if (!token) return;
      const remote = await fetchServerFunnelProgress({
        Authorization: `Bearer ${token}`,
      });
      if (!remote) return;
      if (remote.dismissed) {
        dismissCompanyBrainFunnel();
        setActive(false);
        return;
      }
      setServerFlags({
        briefLoaded: remote.briefLoaded,
        labOpened: remote.labOpened,
        dismissed: remote.dismissed,
      });
    })();
  }, []);

  useEffect(() => {
    if (props.progress.githubConnected) {
      void patchServerFunnelProgress({ connectGithub: true });
    }
    if (props.progress.githubSynced) {
      void patchServerFunnelProgress({ syncGithub: true });
    }
  }, [props.progress.githubConnected, props.progress.githubSynced]);

  const mergedProgress = useMemo(
    (): FunnelProgressInput => ({
      ...props.progress,
      hasBrief:
        props.progress.hasBrief || isFunnelBriefLoaded() || serverFlags.briefLoaded,
      labOpened: props.progress.labOpened || isFunnelLabOpened() || serverFlags.labOpened,
    }),
    [props.progress, serverFlags.briefLoaded, serverFlags.labOpened],
  );

  const statuses = useMemo(
    () => deriveFunnelStepStatuses(mergedProgress),
    [mergedProgress],
  );

  if (!active || isFunnelComplete(mergedProgress)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#C7D2FE] bg-gradient-to-br from-[#EEF2FF] to-[#F9FAFB] px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4338CA]">
            Company Brain setup
          </p>
          <p className="mt-1 text-sm font-semibold text-[#111827]">
            Connect tools → structured memory → Continuity Lab
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#6B7280]">
            This is the wedge we sell: GitHub-first ingest, a continue brief, then a living workspace
            where any model picks up without repeated context.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissCompanyBrainFunnel();
            setActive(false);
          }}
          className="text-xs font-medium text-[#6B7280] hover:text-[#111827]"
        >
          Dismiss
        </button>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {COMPANY_BRAIN_FUNNEL_STEPS.map((step) => {
          const status = statuses[step.id];
          const action = stepAction(step.id, props);
          return (
            <li
              key={step.id}
              className={cn(
                "flex flex-col rounded-lg border bg-white px-3 py-3",
                status === "current"
                  ? "border-[#4338CA] ring-1 ring-[#4338CA]/20"
                  : status === "done"
                    ? "border-[#A7F3D0]"
                    : "border-[#E5E7EB]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#111827]">{step.title}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    status === "done"
                      ? "bg-[#D1FAE5] text-[#065F46]"
                      : status === "current"
                        ? "bg-[#E0E7FF] text-[#4338CA]"
                        : "bg-[#F3F4F6] text-[#6B7280]",
                  )}
                >
                  {statusLabel(status)}
                </span>
              </div>
              <p className="mt-2 flex-1 text-[11px] leading-4 text-[#6B7280]">{step.description}</p>
              {status !== "done" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step.id === "connect_github") focusFunnelOnGithub();
                    if (step.id === "open_lab") markFunnelLabOpened();
                    action?.();
                  }}
                  disabled={status === "pending" && step.id !== "connect_github"}
                  className={cn(
                    "mt-3 w-full rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide",
                    status === "current"
                      ? "bg-[#111827] text-white hover:bg-[#1F2937]"
                      : "border border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]",
                  )}
                >
                  {step.id === "connect_github"
                    ? "Connect"
                    : step.id === "sync_github"
                      ? "Sync"
                      : step.id === "continue_brief"
                        ? "Brief"
                        : "Open lab"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

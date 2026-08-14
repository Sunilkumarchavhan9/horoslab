"use client";

import React from "react";
import type { CenterTab, FileChange, SessionState, WorklogStep } from "./index";

const TABS: Array<{ id: CenterTab; label: string }> = [
  { id: "chat", label: "Chat" },
  { id: "worklog", label: "Worklog" },
  { id: "changes", label: "Changes" },
  { id: "pr", label: "PR" },
];

function stepStatusClass(status: WorklogStep["status"]): string {
  if (status === "done")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (status === "running")
    return "border-blue-500/25 bg-blue-500/10 text-blue-200";
  if (status === "failed")
    return "border-rose-500/25 bg-rose-500/10 text-rose-200";
  return "border-white/10 bg-white/[0.04] text-white/60";
}

function stateLabel(state: SessionState): string {
  if (state === "idle") return "Idle";
  if (state === "planning") return "Planning";
  if (state === "executing") return "Executing";
  if (state === "repairing") return "Self-healing";
  return "Complete";
}

function stateTone(state: SessionState): string {
  if (state === "success")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (state === "repairing")
    return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  if (state === "executing")
    return "border-blue-500/25 bg-blue-500/10 text-blue-200";
  return "border-white/10 bg-white/[0.04] text-white/65";
}

export default function CenterWorkspace({
  children,
  activeTab,
  onSelectTab,
  worklog,
  changes,
  sessionState,
}: {
  children?: React.ReactNode;
  activeTab: CenterTab;
  onSelectTab: (tab: CenterTab) => void;
  worklog: WorklogStep[];
  changes: FileChange[];
  sessionState: SessionState;
}) {
  return (
    <main className="flex h-full min-w-0 flex-col bg-[#0b0b0d]">
      <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
                activeTab === tab.id
                  ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-white/55 hover:bg-white/6 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${stateTone(sessionState)}`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {stateLabel(sessionState)}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "chat" ? (
          <div className="rounded-2xl border border-white/10 bg-[#111114] p-4 text-sm text-white/75 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Execution Chat
                </p>
                <p className="mt-2 max-w-2xl leading-7 text-white/68">
                  Use the left panel to issue instructions and start autonomous
                  runs. This center surface is ready for live agent reasoning,
                  progress notes, and tool-backed output.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/3 px-2 py-0.5 text-[10px] text-white/60">
                Live backend
              </span>
            </div>
            {children ? <div className="mt-4">{children}</div> : null}
          </div>
        ) : null}

        {activeTab === "worklog" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-[#111114] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Execution timeline
              </p>
              <p className="mt-2 text-sm text-white/65">
                Real backend steps, approvals, and retries appear here as the
                session runs.
              </p>
            </div>
            {worklog.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-[#111114] p-4 text-[13px] text-white/55">
                No run yet. Click Start Run to generate the execution timeline.
              </p>
            ) : (
              worklog.map((step) => (
                <div
                  key={step.id}
                  className="rounded-2xl border border-white/10 bg-[#111114] p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-white">
                      {step.title}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stepStatusClass(step.status)}`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/40">
                    {step.phase}
                  </p>
                  <p className="mt-2 text-[13px] text-white/68">
                    {step.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "changes" ? (
          <div className="space-y-2">
            <div className="rounded-2xl border border-white/10 bg-[#111114] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Changes
              </p>
              <p className="mt-2 text-[13px] text-white/65">
                File edits are drawn from the real session stream instead of
                being faked.
              </p>
            </div>
            {changes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-[#111114] p-4 text-[13px] text-white/55">
                No file changes recorded yet.
              </p>
            ) : (
              changes.map((change) => (
                <div
                  key={change.path}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-[#111114] p-3.5"
                >
                  <div>
                    <p className="font-mono text-[13px] text-white">
                      {change.path}
                    </p>
                    <p className="mt-1 text-[13px] text-white/60">
                      {change.summary}
                    </p>
                  </div>
                  <p className="font-mono text-[11px]">
                    <span className="text-emerald-300">
                      +{change.additions}
                    </span>{" "}
                    <span className="text-rose-300">-{change.deletions}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "pr" ? (
          <div className="rounded-2xl border border-white/10 bg-[#111114] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Pull Request
            </p>
            <h2 className="mt-2 text-[17px] font-semibold text-white">
              Backend-backed run artifact
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-[13px] text-white/75">
              <li>
                Structured planning, execution, and verification states render
                in real time
              </li>
              <li>
                Shell output and worklog entries are streamed from the active
                session
              </li>
              <li>
                The UI stays honest when there is no PR yet instead of inventing
                one
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </main>
  );
}

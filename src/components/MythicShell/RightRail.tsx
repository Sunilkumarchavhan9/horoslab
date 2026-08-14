"use client";

import React, { useMemo, useState } from "react";
import type { AgentStatus, SessionState, ShellEvent } from "./index";

type RailTab = "shell" | "desktop" | "status";

function chipClass(state: AgentStatus["state"]): string {
  if (state === "running")
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (state === "blocked")
    return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  return "border-white/10 bg-white/[0.04] text-white/55";
}

function titleForSession(state: SessionState): string {
  if (state === "idle") return "Waiting for run";
  if (state === "planning") return "Generating plan";
  if (state === "executing") return "Executing steps";
  if (state === "repairing") return "Repairing failure";
  return "Run complete";
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

export default function RightRail({
  sessionState,
  shellEvents,
  agents,
}: {
  sessionState: SessionState;
  shellEvents: ShellEvent[];
  agents: AgentStatus[];
}) {
  const [tab, setTab] = useState<RailTab>("shell");

  const latestShell = shellEvents.slice(-1)[0] ?? null;
  const shellCount = shellEvents.length;
  const runningAgents = useMemo(
    () => agents.filter((agent) => agent.state === "running").length,
    [agents],
  );

  return (
    <aside className="flex h-full flex-col border-l border-white/10 bg-[#0c0c0f]">
      <div className="border-b border-white/10 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-white/90">
              {titleForSession(sessionState)}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
              Live backend session state
            </p>
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stateTone(sessionState)}`}
          >
            {sessionState}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/3 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
              Shell
            </p>
            <p className="mt-1 text-[13px] font-semibold text-white">
              {shellCount}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/3 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
              Agents
            </p>
            <p className="mt-1 text-[13px] font-semibold text-white">
              {runningAgents}/{agents.length}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/3 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
              Latest
            </p>
            <p className="mt-1 truncate text-[13px] font-semibold text-white">
              {latestShell ? latestShell.status : "none"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {(
            [
              ["shell", "Shell"],
              ["desktop", "Desktop"],
              ["status", "Status"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                tab === id
                  ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                  : "text-white/55 hover:bg-white/6 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === "shell" ? (
          <div className="space-y-2">
            {shellEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#111114] p-4 text-sm text-white/55">
                No shell events yet. Run the session to stream live commands and
                output here.
              </div>
            ) : (
              shellEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-white/10 bg-[#111114] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-xs text-emerald-200">
                      $ {event.command}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        event.status === "error"
                          ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
                          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-xs leading-6 ${
                      event.status === "error"
                        ? "text-rose-300"
                        : "text-white/75"
                    }`}
                  >
                    {event.output}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === "desktop" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Desktop bridge
              </p>
              <p className="mt-2 text-[13px] text-white/70">
                This workspace is wired to the backend session stream. When the
                runtime attaches a live desktop preview, it will surface here.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] text-white/55">
                <span className="size-2 rounded-full bg-rose-400" />
                <span className="size-2 rounded-full bg-amber-400" />
                <span className="size-2 rounded-full bg-emerald-400" />
                <span className="ml-2">Live desktop stream unavailable</span>
              </div>
              <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-white/15 text-[13px] text-white/45">
                Waiting for the backend to expose a desktop preview or control
                URL.
              </div>
            </div>
          </div>
        ) : null}

        {tab === "status" ? (
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.role}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111114] px-3 py-2.5"
              >
                <div>
                  <p className="text-[13px] font-semibold text-white/90">
                    {agent.role}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                    Runtime agent
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chipClass(agent.state)}`}
                >
                  {agent.state}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

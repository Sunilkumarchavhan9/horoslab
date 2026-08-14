"use client";

import React, { useState } from "react";
import type { ChatMessage, SessionState } from "./index";

function stateLabel(state: SessionState): string {
  if (state === "idle") return "Idle";
  if (state === "planning") return "Planning";
  if (state === "executing") return "Executing";
  if (state === "repairing") return "Self-healing";
  return "Complete";
}

export default function LeftNav({
  goal,
  onGoalChange,
  onRun,
  sessionState,
  messages,
  onSendMessage,
  apiBase,
  onApiBaseChange,
  apiToken,
  onApiTokenChange,
  connectionStatus,
}: {
  goal: string;
  onGoalChange: (value: string) => void;
  onRun: () => void;
  sessionState: SessionState;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  apiBase: string;
  onApiBaseChange: (value: string) => void;
  apiToken: string;
  onApiTokenChange: (value: string) => void;
  connectionStatus: string;
}) {
  const [draft, setDraft] = useState("");
  const hasLiveRun =
    sessionState === "planning" ||
    sessionState === "executing" ||
    sessionState === "repairing" ||
    sessionState === "success";

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#0d0d10]">
      <div className="border-b border-white/10 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-white/90">MemoryOS</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
              Operator cockpit
            </p>
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              hasLiveRun
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : "border-white/10 bg-white/4 text-white/60"
            }`}
          >
            {stateLabel(sessionState)}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-white/50">{connectionStatus}</p>
      </div>

      <div className="border-b border-white/10 px-4 py-3.5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
          Runtime endpoint
        </p>
        <input
          value={apiBase}
          onChange={(event) => onApiBaseChange(event.target.value)}
          className="mb-2 w-full rounded-lg border border-white/10 bg-[#141418] px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/30"
          placeholder="same-origin proxy (default)"
        />
        <input
          value={apiToken}
          onChange={(event) => onApiTokenChange(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#141418] px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/30"
          placeholder="Bearer token"
          type="password"
        />
      </div>

      <div className="border-b border-white/10 px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Goal
          </p>
          <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] text-white/50">
            Live
          </span>
        </div>
        <textarea
          value={goal}
          onChange={(event) => onGoalChange(event.target.value)}
          className="h-24 w-full resize-none rounded-xl border border-white/10 bg-[#141418] px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={onRun}
          className="mt-3 w-full rounded-xl bg-[#2f68ff] px-3 py-2 text-[13px] font-semibold text-white shadow-[0_10px_30px_rgba(47,104,255,0.25)] hover:bg-[#3d77ff]"
        >
          Start Run
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Chat log
          </p>
          <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] text-white/50">
            {messages.length}
          </span>
        </div>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl border px-3 py-2 text-[13px] ${
                message.role === "assistant"
                  ? "border-white/10 bg-[#141418] text-white/85"
                  : "border-blue-500/15 bg-blue-500/10 text-blue-100"
              }`}
            >
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                {message.role}
              </p>
              <p className="leading-6">{message.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141418] p-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message agent"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
          <button
            type="button"
            onClick={() => {
              onSendMessage(draft);
              setDraft("");
            }}
            className="rounded-md border border-white/10 bg-white/8 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/12"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}

"use client";

import React, { useState } from "react";
import { Plus, Play, ChevronRight, Clock } from "lucide-react";
import { ModelEntity, Program, EpochRuntimeOverview } from "@/lib/epoch-types";
import { TokenPromptInput } from "../primitives/token-prompt-input";
import { EpochFeedbackWidget } from "../primitives/epoch-feedback-widget";
import { cn } from "@/lib/utils";

interface HomeViewProps {
  overview?: EpochRuntimeOverview;
  programs?: Program[];
  models?: ModelEntity[];
  onSelectProgram: (programId: string) => void;
  onLaunchPrompt: (prompt: string, metadata?: Record<string, unknown>) => void;
  onNavigateToEvidence?: () => void;
  onNavigateToPipelines?: () => void;
  onRefresh?: () => void;
  onSelectPipeline?: (pipeline: { title: string; prompt: string }) => void;
  dark?: boolean;
}

export function HomeView({
  programs = [],
  models = [],
  onSelectProgram,
  onLaunchPrompt,
  onNavigateToPipelines,
  onSelectPipeline,
  dark = false,
}: HomeViewProps) {
  const [filter, setFilter] = useState<"all" | "live" | "stopped">("all");

  const sessions = programs.map((program) => ({
    id: program.id,
    title: program.name,
    status: program.status === "deployed" ? "Live" : "Draft",
    updatedAt: program.updatedAt || program.lastActivity,
    prompt: program.objective || `Run ${program.modelTarget}`,
  }));

  const filteredSessions = sessions.filter((s) => {
    if (filter === "live") return s.status === "Live";
    if (filter === "stopped") return s.status === "Draft" || s.status === "Stopped";
    return true;
  });

  const handleOpenSession = (s: typeof sessions[0]) => {
    if (onSelectPipeline) {
      onSelectPipeline({
        title: s.title,
        prompt: s.prompt,
      });
    } else {
      onSelectProgram(s.id);
    }
  };

  return (
    <div className="space-y-8 max-w-[840px] mx-auto">
      {/* Hero section with prompt input */}
      <section className="pt-2">
        <TokenPromptInput
          onLaunchPrompt={(params) => onLaunchPrompt(params.prompt, params)}
          dark={dark}
        />
      </section>

      {/* Workspace Recent Sessions section */}
      <section className="space-y-3 pt-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#788274] dark:text-[#889284]">
          WORKSPACE
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-[#2e2e2e] pb-3">
          <div className="flex items-center gap-3">
            <h2 className={cn("text-xs font-semibold tracking-tight", dark ? "text-white" : "text-[#171a17]")}>
              Recent sessions
            </h2>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "px-2.5 py-0.5 text-xs font-mono border transition-colors rounded-xs",
                  filter === "all"
                    ? dark
                      ? "border-[#444] bg-[#282828] text-white font-medium"
                      : "border-[#999] bg-[#eaeaea] text-[#111] font-medium"
                    : dark
                    ? "border-transparent text-[#788274] hover:text-white"
                    : "border-transparent text-[#687063] hover:text-[#171a17]"
                )}
              >
                All {sessions.length}
              </button>
              <button
                type="button"
                onClick={() => setFilter("live")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-xs font-mono transition-colors rounded-xs",
                  filter === "live"
                    ? dark
                      ? "bg-[#282828] text-white font-medium"
                      : "bg-[#eaeaea] text-[#111] font-medium"
                    : dark
                    ? "text-[#788274] hover:text-white"
                    : "text-[#687063] hover:text-[#171a17]"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                <span>Live</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter("stopped")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono transition-colors rounded-xs",
                  filter === "stopped"
                    ? dark
                      ? "bg-[#282828] text-white font-medium"
                      : "bg-[#eaeaea] text-[#111] font-medium"
                    : dark
                    ? "text-[#788274] hover:text-white"
                    : "text-[#687063] hover:text-[#171a17]"
                )}
              >
                Stopped {sessions.length}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToPipelines}
            className="text-xs font-mono text-[#788274] hover:text-[#75bf00] transition-colors"
          >
            All pipelines →
          </button>
        </div>

        {/* Sessions table */}
        <div
          className={cn(
            "border border-dashed divide-y divide-dashed rounded-xs overflow-hidden",
            dark ? "border-[#2e2e2e] bg-[#181818] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
          )}
        >
          {/* Table Header */}
          <div className={cn(
            "flex items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
            dark ? "border-[#282828] bg-[#141414] text-[#788274]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
          )}>
            <span>Pipeline</span>
            <span>Updated Status</span>
          </div>

          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenSession(session)}
              className={cn(
                "group flex items-center justify-between p-3.5 cursor-pointer transition-colors",
                dark ? "hover:bg-[#202020]" : "hover:bg-[#f8faf7]"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center border border-dashed text-xs transition-colors rounded-xs",
                    dark
                      ? "border-[#303030] bg-[#1a1a1a] text-[#889284] group-hover:border-[#75bf00] group-hover:text-[#75bf00]"
                      : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063] group-hover:border-[#75bf00] group-hover:text-[#2d5800]"
                  )}
                >
                  <span className="font-mono text-xs">🔗</span>
                </div>
                <div>
                  <div
                    className={cn(
                      "font-semibold text-xs transition-colors",
                      dark ? "text-white group-hover:text-[#75bf00]" : "text-[#171a17] group-hover:text-[#2d5800]"
                    )}
                  >
                    {session.title}
                  </div>
                  <div className="text-[11px] font-mono text-[#788274] mt-0.5">
                    0 nodes
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-[#788274]">4d ago</span>
                <span
                  className={cn(
                    "border border-dashed px-2 py-0.5 text-[10px] tracking-wider rounded-xs flex items-center gap-1.5 font-bold",
                    session.status === "Live"
                      ? "border-[#75bf00] bg-[#75bf00]/10 text-[#75bf00]"
                      : dark
                      ? "border-[#383838] bg-[#1a1a1a] text-[#889284]"
                      : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#888]" />
                  <span>{session.status}</span>
                </span>
                <span className="text-[#666] group-hover:text-white transition-colors">→</span>
              </div>
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div className="p-4 text-xs font-mono text-[#788274]">
              No persisted sessions yet. Launch a mission to create the first one.
            </div>
          )}
        </div>
      </section>

      {/* Floating Feedback Widget */}
      <EpochFeedbackWidget dark={dark} />
    </div>
  );
}

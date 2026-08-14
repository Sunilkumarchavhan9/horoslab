"use client";

import React, { useState } from "react";
import { Plus, Play, ChevronRight, Clock } from "lucide-react";
import { Program, EpochRuntimeOverview } from "@/lib/epoch-types";
import { TokenPromptInput } from "../primitives/token-prompt-input";
import { cn } from "@/lib/utils";

interface HomeViewProps {
  overview?: EpochRuntimeOverview;
  programs?: Program[];
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
  onSelectProgram,
  onLaunchPrompt,
  onNavigateToPipelines,
  onSelectPipeline,
  dark = false,
}: HomeViewProps) {
  const [filter, setFilter] = useState<"all" | "live" | "stopped">("all");

  const sessions = [
    {
      id: "session-1",
      title: "Untitled Pipeline",
      model: "Llama-3.1-8B-Instruct",
      runtime: "vLLM",
      gpu: "H100 NVL",
      status: "Draft",
      updatedAt: "10h ago",
      prompt: "Optimize meta-llama/Llama-3.1-8B-Instruct on vLLM for cheapest GPU with latency and VRAM checks",
    },
  ];

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
        <TokenPromptInput onSubmit={onLaunchPrompt} dark={dark} />
      </section>

      {/* Workspace Recent Sessions section matching Image 2 */}
      <section className="space-y-3 pt-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#788274] dark:text-[#889284]">
          WORKSPACE
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-[#2e2e2e] pb-3">
          <div className="flex items-center gap-3">
            <h2 className={cn("text-xs font-semibold tracking-tight", dark ? "text-white" : "text-[#171a17]")}>
              Recent sessions
            </h2>

            {/* Filter tabs matching Image 2 */}
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

        {/* Sessions list with dashed borders matching Screenshot */}
        <div
          className={cn(
            "border border-dashed divide-y divide-dashed rounded-xs",
            dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
          )}
        >
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenSession(session)}
              className={cn(
                "group flex items-center justify-between p-3.5 cursor-pointer transition-colors",
                dark ? "hover:bg-[#282828]" : "hover:bg-[#f8faf7]"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center border text-xs transition-colors rounded-xs",
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
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-[#788274]">11h ago</span>
                <span
                  className={cn(
                    "border px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm",
                    session.status === "Live"
                      ? "border-[#75bf00] bg-[#75bf00]/10 text-[#75bf00]"
                      : dark
                      ? "border-[#383838] bg-[#1a1a1a] text-[#889284]"
                      : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                  )}
                >
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Feedback button at bottom right matching Screenshot */}
      <button
        type="button"
        className={cn(
          "fixed bottom-4 right-4 z-40 flex items-center gap-2 border px-3 py-1.5 text-xs font-mono shadow-lg transition-colors rounded-xs",
          dark
            ? "border-[#383838] bg-[#202020] text-white hover:border-[#75bf00]"
            : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#171a17]"
        )}
      >
        <span className="font-bold text-[11px]">R</span>
        <span className="font-sans text-[11px]">Feedback</span>
      </button>
    </div>
  );
}

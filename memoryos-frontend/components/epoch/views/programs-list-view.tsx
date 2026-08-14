"use client";

import React, { useState } from "react";
import { Plus, Search, GitBranch, Download } from "lucide-react";
import { Program } from "@/lib/epoch-types";
import { cn } from "@/lib/utils";

interface ProgramsListViewProps {
  programs: Program[];
  onSelectProgram: (id: string) => void;
  onOpenNewProgram: () => void;
  onSelectPipeline?: (pipeline: { title: string; prompt: string }) => void;
  dark?: boolean;
}

export function ProgramsListView({
  programs,
  onSelectProgram,
  onOpenNewProgram,
  onSelectPipeline,
  dark = false,
}: ProgramsListViewProps) {
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const pipelines = [
    {
      id: "pipe-1",
      name: "Untitled Pipeline",
      modelsCount: 0,
      time: "11h ago",
      status: "Draft",
      prompt: "Optimize meta-llama/Llama-3.1-8B-Instruct on vLLM for cheapest GPU with latency and VRAM checks",
    },
  ];

  const handleOpenPipeline = (p: typeof pipelines[0]) => {
    if (onSelectPipeline) {
      onSelectPipeline({
        title: p.name,
        prompt: p.prompt,
      });
    } else {
      onSelectProgram(p.id);
    }
  };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      {/* Top Header matching Image 1 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded font-bold inline-block">
              Pipelines
            </span>
          </h1>
          <p className="mt-1 text-xs text-[#788274]">
            {pipelines.length} pipeline
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewProgram}
          className={cn(
            "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors rounded-xs",
            dark ? "border-[#383838] bg-[#202020] text-white hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#171a17]"
          )}
        >
          <Plus size={12} />
          <span>New Pipeline</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar matching Image 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={cn(
              "px-2.5 py-0.5 border transition-colors rounded-xs",
              filterTab === "all"
                ? dark ? "border-[#444] bg-[#282828] text-white font-bold" : "border-[#999] bg-[#eaeaea] text-[#111] font-bold"
                : dark ? "border-transparent text-[#788274] hover:text-white" : "border-transparent text-[#687063] hover:text-[#171a17]"
            )}
          >
            All {pipelines.length}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("live")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-0.5 transition-colors rounded-xs",
              filterTab === "live"
                ? dark ? "bg-[#282828] text-white font-bold" : "bg-[#eaeaea] text-[#111] font-bold"
                : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-[#171a17]"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
            <span>Live</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("stopped")}
            className={cn(
              "px-2.5 py-0.5 transition-colors rounded-xs",
              filterTab === "stopped"
                ? dark ? "bg-[#282828] text-white font-bold" : "bg-[#eaeaea] text-[#111] font-bold"
                : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-[#171a17]"
            )}
          >
            Stopped {pipelines.length}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("optimizing")}
            className={cn(
              "px-2.5 py-0.5 transition-colors rounded-xs",
              filterTab === "optimizing"
                ? dark ? "bg-[#282828] text-white font-bold" : "bg-[#eaeaea] text-[#111] font-bold"
                : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-[#171a17]"
            )}
          >
            Optimizing
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className={cn(
            "flex items-center gap-2 border px-2.5 py-1 text-xs transition-colors rounded-xs",
            dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
          )}>
            <Search size={12} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pipelines..."
              className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-36"
            />
          </label>
        </div>
      </div>

      {/* Pipeline Card matching Image 1 */}
      <div className="space-y-3">
        {pipelines.map((pipe) => (
          <div
            key={pipe.id}
            className={cn(
              "border border-dashed divide-y divide-dashed transition-colors rounded-xs",
              dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
            )}
          >
            {/* Row 1: Header */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center border text-xs rounded-xs",
                    dark ? "border-[#303030] bg-[#1a1a1a] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                  )}
                >
                  <span className="font-mono text-xs">🔗</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>{pipe.name}</span>
                    <span className="border border-[#383838] bg-[#1a1a1a] px-1.5 py-0.2 text-[10px] text-[#889284] uppercase tracking-wider rounded-sm">
                      {pipe.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#788274] mt-0.5">
                    <span>{pipe.modelsCount} models</span>
                    <span>•</span>
                    <span>{pipe.time}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert("Exporting pipeline configuration...")}
                className="flex items-center gap-1.5 text-xs font-mono text-[#788274] hover:text-white transition-colors"
              >
                <Download size={12} />
                <span>Export</span>
              </button>
            </div>

            {/* Row 2: Actions */}
            <div className="flex items-center justify-between p-3.5 text-xs">
              <span className="text-[#788274] font-mono">Empty pipeline</span>
              <button
                type="button"
                onClick={() => handleOpenPipeline(pipe)}
                className="font-semibold text-[#a0a89d] hover:text-[#75bf00] transition-colors"
              >
                Optimize
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

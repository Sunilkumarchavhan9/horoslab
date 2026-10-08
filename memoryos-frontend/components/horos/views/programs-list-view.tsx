"use client";

import React, { useState } from "react";
import { Plus, Search, GitBranch, Download, Play, Zap, ArrowRight, Layers, Clock, AlertCircle } from "lucide-react";
import { Program } from "@/lib/horos-types";
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
  dark = true,
}: ProgramsListViewProps) {
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  const pipelines = [
    {
      id: "pipe-1",
      name: "Untitled Pipeline",
      modelsCount: 0,
      nodesCount: 0,
      updatedAt: "Updated 4d ago",
      latency: "—",
      costPerReq: "—",
      quality: "—",
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

  const primaryText = dark ? "text-[#F0EFE2]" : "text-[#171a17]";
  const secondaryText = dark ? "text-[#889084]" : "text-[#687063]";

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-in fade-in duration-150">
      {/* Top Header matching Reference Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5">
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans">
              Pipelines
            </span>
          </h1>
          <p className={cn("mt-1 text-xs", secondaryText)}>
            Create, optimize, deploy, and reopen every pipeline in this workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewProgram}
          className={cn(
            "flex items-center gap-1.5 border border-dashed px-3 py-1.5 text-xs font-medium transition-colors rounded-xs font-mono",
            dark
              ? "border-[#383838] bg-[#202020] text-[#F0EFE2] hover:border-[#75bf00]"
              : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-black"
          )}
        >
          <Plus size={12} />
          <span>New Pipeline</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar matching Reference Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 text-xs font-mono">
          {[
            { id: "all", label: `All ${pipelines.length}` },
            { id: "live", label: "Live" },
            { id: "idle", label: "Idle 1" },
            { id: "failed", label: "Failed" },
            { id: "optimizing", label: "Optimizing..." },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={cn(
                "px-3 py-1 border border-dashed transition-colors rounded-xs",
                filterTab === tab.id
                  ? dark
                    ? "border-[#555] bg-[#282828] text-[#F0EFE2] font-bold"
                    : "border-[#888] bg-[#eaeaea] text-[#111] font-bold"
                  : dark
                    ? "border-transparent text-[#788274] hover:text-[#F0EFE2]"
                    : "border-transparent text-[#687063] hover:text-[#171a17]"
              )}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className={cn(
            "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[240px]",
            dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
          )}>
            <Search size={13} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or model..."
              className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-full"
            />
          </label>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#788274]">
            <span>{pipelines.length} pipelines</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
              className="hover:text-[#F0EFE2] transition-colors"
            >
              Newest first
            </button>
          </div>
        </div>
      </div>

      {/* Pipelines Table Container matching Reference Screenshot 1 */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {/* Table Header Row matching Reference Screenshot 1 */}
        <div className={cn(
          "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
          dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
        )}>
          <div className="col-span-3">Pipeline / Model</div>
          <div className="col-span-3">Details</div>
          <div className="col-span-1 text-right">Latency</div>
          <div className="col-span-1 text-right">Cost / Req</div>
          <div className="col-span-1 text-right">Quality</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Rows matching Reference Screenshot 1 */}
        {pipelines.map((pipe) => (
          <div
            key={pipe.id}
            className={cn(
              "grid grid-cols-12 gap-3 px-4 py-3.5 items-center text-xs transition-colors",
              dark ? "hover:bg-[#232323]" : "hover:bg-[#fafbfa]"
            )}
          >
            {/* 1. Pipeline / Model */}
            <div className="col-span-3 flex items-center gap-2.5 truncate">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center border border-dashed rounded-xs shrink-0",
                dark ? "border-[#383838] bg-[#181818] text-[#889284]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#687063]"
              )}>
                <span className="font-mono text-xs">🔗</span>
              </div>
              <div className="truncate">
                <div
                  onClick={() => handleOpenPipeline(pipe)}
                  className={cn("font-semibold text-xs cursor-pointer hover:underline", primaryText)}
                >
                  {pipe.name}
                </div>
                <div className="text-[11px] text-[#788274] font-mono mt-0.5 truncate">
                  Empty pipeline
                </div>
              </div>
            </div>

            {/* 2. Details */}
            <div className="col-span-3 space-y-0.5 font-mono">
              <span className="text-[10px] uppercase text-[#788274] block font-sans">Pipeline Summary</span>
              <span className={cn("text-xs block", primaryText)}>
                {pipe.nodesCount} nodes • {pipe.updatedAt}
              </span>
            </div>

            {/* 3. Latency */}
            <div className="col-span-1 text-right font-mono text-xs text-[#788274]">
              {pipe.latency}
            </div>

            {/* 4. Cost / Req */}
            <div className="col-span-1 text-right font-mono text-xs text-[#788274]">
              {pipe.costPerReq}
            </div>

            {/* 5. Quality */}
            <div className="col-span-1 text-right font-mono text-xs text-[#788274]">
              {pipe.quality}
            </div>

            {/* 6. Status */}
            <div className="col-span-1 text-center font-mono">
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-xs font-bold border border-dashed",
                dark ? "border-[#383838] bg-[#181818] text-[#a0a89d]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#656d60]"
              )}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#888]" />
                <span>{pipe.status}</span>
              </span>
            </div>

            {/* 7. Actions */}
            <div className="col-span-2 flex items-center justify-end gap-2 font-mono">
              <button
                type="button"
                onClick={() => alert("Exporting pipeline config...")}
                className={cn(
                  "flex items-center gap-1 border border-dashed px-2 py-1 text-[11px] rounded-xs transition-colors",
                  dark ? "border-[#383838] bg-[#181818] text-[#889084] hover:text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#525a4d]"
                )}
              >
                <Download size={11} />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPipeline(pipe)}
                className={cn(
                  "flex items-center gap-1 border border-dashed px-2.5 py-1 text-[11px] font-semibold rounded-xs transition-colors",
                  dark ? "border-[#383838] bg-[#222] text-[#75bf00] hover:bg-[#75bf00] hover:text-black" : "border-[#b9de78] bg-[#f5faee] text-[#2d5800]"
                )}
              >
                <span>Optimize</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

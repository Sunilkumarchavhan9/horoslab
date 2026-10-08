"use client";

import React, { useState } from "react";
import { Plus, Play, ChevronRight, Clock, Activity, CheckCircle2, AlertCircle, Loader2, Sparkles, Cpu, Boxes, ArrowRight, Layers, Eye } from "lucide-react";
import { ModelEntity, Program, HorosRuntimeOverview } from "@/lib/horos-types";
import { TokenPromptInput, MissionGraph } from "../primitives/token-prompt-input";
import {
  QwenLogo,
  MetaLogo,
  NvidiaLogo,
  BAAILogo,
  DeepSeekLogo,
  GoogleLogo,
  OpenAILogo,
  HuggingFaceLogo,
  TEILogo,
  VLLMLogo,
  SGLangLogo,
} from "../primitives/brand-icons";
import { HorosFeedbackWidget } from "../primitives/horos-feedback-widget";
import { cn } from "@/lib/utils";

interface HomeViewProps {
  overview?: HorosRuntimeOverview;
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

interface RecentMissionItem {
  id: string;
  title: string;
  targetStack: string;
  stackBadges?: Array<{ text: string; icon?: React.ReactNode }>;
  iconNode?: React.ReactNode;
  status: "RUNNING" | "ANALYZING" | "COMPLETED" | "PLANNING" | "EXPERIMENTING" | "EXECUTING" | "VERIFYING" | "FAILED";
  updatedAt: string;
  prompt: string;
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
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const defaultRecentMissions: RecentMissionItem[] = [
    {
      id: "m-1",
      title: "Reduce inference cost by 40%",
      iconNode: <QwenLogo size={14} />,
      targetStack: "Qwen3-32B · vLLM vs SGLang · H100",
      stackBadges: [
        { text: "Qwen3-32B", icon: <QwenLogo size={12} /> },
        { text: "vLLM", icon: <VLLMLogo size={12} /> },
        { text: "H100", icon: <NvidiaLogo size={12} /> },
      ],
      status: "RUNNING",
      updatedAt: "12m ago",
      prompt: "Reduce inference cost for Qwen3-32B on vLLM by 40% without increasing P99",
    },
    {
      id: "m-2",
      title: "Find why P99 increased under heavy load",
      iconNode: <Cpu size={14} className="text-[#e6b800]" />,
      targetStack: "checkout-service · OpenTelemetry · k8s",
      stackBadges: [
        { text: "checkout-service", icon: <HuggingFaceLogo size={12} /> },
        { text: "OpenTelemetry", icon: <Cpu size={12} /> },
        { text: "Kubernetes" },
      ],
      status: "ANALYZING",
      updatedAt: "45m ago",
      prompt: "Find why @checkout-service P99 increased after the latest deployment",
    },
    {
      id: "m-3",
      title: "Compare Qwen3-32B against Llama 3.1 70B",
      iconNode: <MetaLogo size={14} />,
      targetStack: "Qwen3-32B + Llama 3.1 70B · Dynamo + TRT",
      stackBadges: [
        { text: "Qwen3-32B", icon: <QwenLogo size={12} /> },
        { text: "Llama 3.1 70B", icon: <MetaLogo size={12} /> },
        { text: "Dynamo + TRT", icon: <NvidiaLogo size={12} /> },
      ],
      status: "EXPERIMENTING",
      updatedAt: "1h ago",
      prompt: "Compare @vLLM vs @SGLang vs @TensorRT-LLM for @Qwen/Qwen3-32B on @H100",
    },
    {
      id: "m-4",
      title: "Teach Qwen 2.5-VL to understand factory-01",
      iconNode: <QwenLogo size={14} />,
      targetStack: "Qwen 2.5-VL · factory-01 · Video + Sensors",
      stackBadges: [
        { text: "Qwen 2.5-VL", icon: <QwenLogo size={12} /> },
        { text: "factory-01", icon: <HuggingFaceLogo size={12} /> },
        { text: "Video + Sensors" },
      ],
      status: "VERIFYING",
      updatedAt: "2h ago",
      prompt: "Teach @Qwen/Qwen2.5-VL to understand @factory-01 from @video-data and @sensor-data, then predict what happens after an action",
    },
    {
      id: "m-5",
      title: "Predict GPU failures in cluster-prod",
      iconNode: <NvidiaLogo size={14} />,
      targetStack: "cluster-prod · Telemetry · 8x H100",
      stackBadges: [
        { text: "cluster-prod", icon: <NvidiaLogo size={12} /> },
        { text: "Telemetry", icon: <Cpu size={12} /> },
        { text: "8x H100", icon: <NvidiaLogo size={12} /> },
      ],
      status: "RUNNING",
      updatedAt: "3h ago",
      prompt: "Predict GPU failures in @cluster-prod from telemetry and thermal history",
    },
    {
      id: "m-6",
      title: "Optimize BGE-M3 embedding latency",
      iconNode: <BAAILogo size={14} />,
      targetStack: "BGE-M3 · TEI · L40S",
      stackBadges: [
        { text: "BGE-M3", icon: <BAAILogo size={12} /> },
        { text: "TEI", icon: <TEILogo size={12} /> },
        { text: "L40S", icon: <NvidiaLogo size={12} /> },
      ],
      status: "COMPLETED",
      updatedAt: "1d ago",
      prompt: "Deploy BGE-M3 embeddings on TEI to our Kubernetes cluster with /v1/embeddings autoscaling",
    },
  ];

  const missions: RecentMissionItem[] = programs.length > 0
    ? programs.map((program, idx) => ({
        id: program.id,
        title: program.name || program.objective || "Optimize Inference Pipeline",
        iconNode: <Cpu size={14} />,
        targetStack: `${program.modelTarget || "Qwen3-8B"} · vLLM · Auto`,
        stackBadges: [
          { text: program.modelTarget || "Qwen3-8B", icon: <QwenLogo size={12} /> },
          { text: "vLLM", icon: <VLLMLogo size={12} /> },
        ],
        status: program.status === "deployed" ? ("COMPLETED" as const) : ("RUNNING" as const),
        updatedAt: program.updatedAt || program.lastActivity || `${idx + 1}d ago`,
        prompt: program.objective || `Run ${program.modelTarget}`,
      }))
    : defaultRecentMissions;

  const filteredMissions = missions.filter((m) => {
    if (filter === "active") return m.status === "RUNNING" || m.status === "ANALYZING" || m.status === "EXECUTING" || m.status === "EXPERIMENTING";
    if (filter === "completed") return m.status === "COMPLETED" || m.status === "VERIFYING";
    return true;
  });

  const handleOpenMission = (m: RecentMissionItem) => {
    if (onSelectPipeline) {
      onSelectPipeline({
        title: m.title,
        prompt: m.prompt,
      });
    } else {
      onSelectProgram(m.id);
    }
  };

  const renderStatusBadge = (status: RecentMissionItem["status"]) => {
    switch (status) {
      case "RUNNING":
      case "EXECUTING":
        return (
          <span className="border border-dashed border-[#75bf00] bg-[#75bf00]/10 text-[#75bf00] px-2 py-0.5 text-[10px] tracking-wider rounded-xs flex items-center gap-1.5 font-bold font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00] animate-pulse" />
            <span>RUNNING</span>
          </span>
        );
      case "ANALYZING":
      case "EXPERIMENTING":
      case "PLANNING":
        return (
          <span className="border border-dashed border-[#e6b800] bg-[#3a2800]/40 text-[#e6b800] px-2 py-0.5 text-[10px] tracking-wider rounded-xs flex items-center gap-1.5 font-bold font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e6b800] animate-pulse" />
            <span>ANALYZING</span>
          </span>
        );
      case "COMPLETED":
      case "VERIFYING":
        return (
          <span className="border border-dashed border-[#383838] bg-[#1a1a1a] text-[#889284] px-2 py-0.5 text-[10px] tracking-wider rounded-xs flex items-center gap-1.5 font-bold font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#888]" />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span className="border border-dashed border-[#555] bg-[#1a1a1a] text-[#C8C7BA] px-2 py-0.5 text-[10px] tracking-wider rounded-xs flex items-center gap-1.5 font-bold font-mono">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-[840px] mx-auto">
      {/* Hero section with Natural-Language System Composer */}
      <section className="pt-2">
        <TokenPromptInput
          onLaunchPrompt={(params) => onLaunchPrompt(params.prompt, params)}
          dark={dark}
        />
      </section>

      {/* Workspace: Recent Missions */}
      <section className="space-y-3 pt-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#788274] dark:text-[#889284]">
          WORKSPACE
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-[#2e2e2e] pb-3">
          <div className="flex items-center gap-3">
            <h2 className={cn("text-xs font-semibold tracking-tight", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
              Recent missions
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
                      ? "border-[#444] bg-[#282828] text-[#F0EFE2] font-medium"
                      : "border-[#999] bg-[#eaeaea] text-[#111] font-medium"
                    : dark
                    ? "border-transparent text-[#788274] hover:text-[#F0EFE2]"
                    : "border-transparent text-[#687063] hover:text-[#171a17]"
                )}
              >
                All {missions.length}
              </button>
              <button
                type="button"
                onClick={() => setFilter("active")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-xs font-mono transition-colors rounded-xs",
                  filter === "active"
                    ? dark
                      ? "bg-[#282828] text-[#F0EFE2] font-medium"
                      : "bg-[#eaeaea] text-[#111] font-medium"
                    : dark
                    ? "text-[#788274] hover:text-[#F0EFE2]"
                    : "text-[#687063] hover:text-[#171a17]"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter("completed")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono transition-colors rounded-xs",
                  filter === "completed"
                    ? dark
                      ? "bg-[#282828] text-[#F0EFE2] font-medium"
                      : "bg-[#eaeaea] text-[#111] font-medium"
                    : dark
                    ? "text-[#788274] hover:text-[#F0EFE2]"
                    : "text-[#687063] hover:text-[#171a17]"
                )}
              >
                Completed
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToPipelines}
            className="text-xs font-mono text-[#788274] hover:text-[#75bf00] transition-colors"
          >
            All missions →
          </button>
        </div>

        {/* Missions table */}
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
            <span>Mission & Target</span>
            <span>Status</span>
          </div>

          {filteredMissions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => handleOpenMission(mission)}
              className={cn(
                "group flex items-center justify-between p-3.5 cursor-pointer transition-colors",
                dark ? "hover:bg-[#202020]" : "hover:bg-[#f8faf7]"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center border border-dashed text-xs transition-colors rounded-xs shrink-0",
                    dark
                      ? "border-[#303030] bg-[#1a1a1a] text-[#889284] group-hover:border-[#75bf00] group-hover:text-[#75bf00]"
                      : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063] group-hover:border-[#75bf00] group-hover:text-[#2d5800]"
                  )}
                >
                  {mission.iconNode || <span className="font-mono text-xs">⚡</span>}
                </div>
                <div>
                  <div
                    className={cn(
                      "font-semibold text-xs transition-colors",
                      dark ? "text-[#F0EFE2] group-hover:text-[#75bf00]" : "text-[#171a17] group-hover:text-[#2d5800]"
                    )}
                  >
                    {mission.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {mission.stackBadges ? (
                      mission.stackBadges.map((b, i) => (
                        <span
                          key={i}
                          className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border rounded-xs",
                            dark ? "border-[#2e2e2e] bg-[#1f1f1f] text-[#c0c8bc]" : "border-[#e0e4dd] bg-[#f2f5ef] text-[#444]"
                          )}
                        >
                          {b.icon}
                          <span>{b.text}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] font-mono text-[#788274] mt-0.5">
                        {mission.targetStack}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <span className="text-[#788274] hidden sm:inline">{mission.updatedAt}</span>
                {renderStatusBadge(mission.status)}
                <ArrowRight size={13} className="text-[#666] group-hover:text-[#75bf00] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
          {filteredMissions.length === 0 && (
            <div className="p-4 text-xs font-mono text-[#788274]">
              No matching missions. Launch a mission above to start a run.
            </div>
          )}
        </div>
      </section>

      {/* Floating Feedback Widget */}
      <HorosFeedbackWidget dark={dark} />
    </div>
  );
}

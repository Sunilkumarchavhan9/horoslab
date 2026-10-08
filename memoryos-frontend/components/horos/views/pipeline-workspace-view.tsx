"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  FileText,
  Play,
  Rocket,
  Plus,
  Bell,
  GitBranch,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Cloud,
  ExternalLink,
  ChevronRight,
  Terminal,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Sparkles,
  Check,
  RotateCcw,
  Search,
  X,
  Layers,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Columns,
  Moon,
  Sun,
  Edit2,
  Copy,
  Download,
  Keyboard,
  Headphones,
  Trash2,
  ArrowLeft,
  Gauge,
  FlaskConical,
  Volume2,
  VolumeX,
  Undo,
  Redo,
  Grid,
  Upload,
  Minus,
  Sliders,
  Code,
  Shuffle,
  Share2,
  Activity,
  TrendingDown,
  Server,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Box,
  Package,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  MetaLogo,
  QwenLogo,
  OpenAILogo,
  NvidiaLogo,
  GithubLogo,
  VLLMLogo,
  SGLangLogo,
  DeepSeekLogo,
} from "@/components/horos/primitives/brand-icons";
import { HorosBadge } from "../ui/horos-badge";
import { HorosButton } from "../ui/horos-button";
import { cn } from "@/lib/utils";
import { ExportKitModal } from "./export-kit-modal";
import { ReplayModal } from "./replay-modal";
import { HorosIcon } from "@/components/horos/primitives/horos-logo";

interface PipelineWorkspaceViewProps {
  pipelineTitle?: string;
  initialPrompt?: string;
  executionContext?: Record<string, unknown>;
  onBack?: () => void;
  onNavigateToPipelines?: () => void;
  onOpenShortcuts?: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
  onAcceptAndRun?: (payload: { title: string; prompt: string }) => Promise<unknown>;
  runStatus?: string;
  runError?: string;
}

export type ActiveWorkspaceTab =
  | "optimization"
  | "benchmarks"
  | "evidence"
  | "deploy"
  | "plan"
  | "pipeline"
  | "test"
  | "experiment"
  | "workspace"
  | "code"
  | "config";

type AgentViewMode = "split" | "hide_agent" | "focus_agent";

export function PipelineWorkspaceView({
  pipelineTitle = "Untitled Pipeline",
  initialPrompt = "Describe the objective, model constraints, and evaluation criteria for this pipeline.",
  executionContext = {},
  onBack,
  onNavigateToPipelines,
  onOpenShortcuts,
  dark = false,
  onToggleTheme,
  onAcceptAndRun,
  runStatus,
  runError,
}: PipelineWorkspaceViewProps) {
  const [openTabs, setOpenTabs] = useState<ActiveWorkspaceTab[]>([
    "optimization",
    "benchmarks",
    "plan",
    "deploy",
  ]);
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>("optimization");
  const [searchViewsModalOpen, setSearchViewsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [completionChimeMuted, setCompletionChimeMuted] = useState(false);

  const [currentTitle, setCurrentTitle] = useState(pipelineTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [agentViewMode, setAgentViewMode] = useState<AgentViewMode>("split");

  // Human Gate & Canary States (Blueprint Sec 48, 53, 91)
  const [humanGateStatus, setHumanGateStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [canaryStage, setCanaryStage] = useState<number>(100);
  const [rollbackSuccess, setRollbackSuccess] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [replayModalOpen, setReplayModalOpen] = useState(false);

  // Dropdown states
  const [viewModeMenuOpen, setViewModeMenuOpen] = useState(false);
  const [pipelineMenuOpen, setPipelineMenuOpen] = useState(false);
  const [runContextOpen, setRunContextOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"Optimize" | "Experiment">("Optimize");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [logFilter, setLogFilter] = useState("All");
  const [activeThoughtsVerbose, setActiveThoughtsVerbose] = useState(false);
  const [runSubmitting, setRunSubmitting] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  // Token Chip Composer States (Blueprint Sec 07-09)
  const [chipModel, setChipModel] = useState("Llama-3.1-8B");
  const [chipRuntime, setChipRuntime] = useState("vLLM");
  const [chipGoal, setChipGoal] = useState("Cost -30%");
  const [chipCompute, setChipCompute] = useState("A100-40GB");
  const [chipTarget, setChipTarget] = useState("Cloud (Managed)");
  const [chipDropdownOpen, setChipDropdownOpen] = useState<"model" | "runtime" | "goal" | "compute" | "target" | null>(null);
  const [recommendationDismissed, setRecommendationDismissed] = useState(false);

  // Deliverable Package Tab State (Blueprint Sec 49-50)
  const [deliverableActiveTab, setDeliverableActiveTab] = useState<"config" | "docker" | "helm" | "rollback">("config");
  const [feedbackRating, setFeedbackRating] = useState<"liked" | "disliked" | null>("liked");

  // Top Header Popovers (Images 1, 2, 3, 4)
  const [headerPopover, setHeaderPopover] = useState<"gpu" | "github" | "feedback" | "cost" | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "feature" | "feedback" | "support">("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [includeSessionData, setIncludeSessionData] = useState(true);

  const toggleStep = (stepKey: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const toggleThought = (thoughtKey: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [thoughtKey]: !prev[thoughtKey] }));
  };

  const viewMenuRef = useRef<HTMLDivElement>(null);
  const pipelineMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns and handle ESC key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewModeMenuOpen(false);
      }
      if (pipelineMenuRef.current && !pipelineMenuRef.current.contains(e.target as Node)) {
        setPipelineMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchViewsModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleOpenTab = (tabId: ActiveWorkspaceTab) => {
    if (!openTabs.includes(tabId)) {
      setOpenTabs([...openTabs, tabId]);
    }
    setActiveTab(tabId);
    setSearchViewsModalOpen(false);
    if (agentViewMode === "focus_agent") {
      setAgentViewMode("split");
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: ActiveWorkspaceTab) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t !== tabId);
    if (remaining.length === 0) {
      setOpenTabs(["optimization"]);
      setActiveTab("optimization");
    } else {
      setOpenTabs(remaining);
      if (activeTab === tabId) {
        setActiveTab(remaining[remaining.length - 1]);
      }
    }
  };

  const logs = runStatus
    ? [{ time: new Date().toLocaleTimeString(), delta: "now", level: "INFO", cat: "pipeline", msg: `Pipeline run ${runStatus}` }]
    : [];
  const objective = initialPrompt.trim() || "No pipeline objective supplied.";
  const contextValue = (key: string, fallback: string) => {
    const value = executionContext[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  };
  const contextModel = contextValue("model", "Auto");
  const contextEngine = contextValue("engine", "Auto");
  const contextGpu = contextValue("gpu", "Auto");
  const contextWorkload = contextValue("workload", "Auto");
  const contextOutput = contextValue("outputFormat", "Auto");
  const displayedRunStatus = runSubmitting ? "submitting" : runStatus || "not_started";
  const measuredState = runStatus === "completed" ? "measured" : "not measured";

  async function acceptAndRun() {
    if (!onAcceptAndRun || runSubmitting) return;
    setRunSubmitting(true);
    try {
      await onAcceptAndRun({
        title: currentTitle.trim() || pipelineTitle,
        prompt: initialPrompt,
      });
      setActiveTab("optimization");
      if (agentViewMode === "focus_agent") setAgentViewMode("split");
    } finally {
      setRunSubmitting(false);
    }
  }

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden text-xs font-sans antialiased",
      dark ? "bg-[#151515] text-[#f0f3ee]" : "bg-[#fbfbfa] text-[#151515]"
    )}>
      {/* Top Workspace Header matching Screenshots 1, 2 */}
      <header className={cn(
        "flex items-center justify-between border-b px-3 py-2 shrink-0 z-30",
        dark ? "border-[#282828] bg-[#151515]" : "border-[#d8ddd3] bg-white"
      )}>
        {/* Left: Brand + View Mode Switcher + Pipeline Menu Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack || onNavigateToPipelines}
            className="flex items-center justify-center p-1 text-[#F0EFE2] hover:opacity-80 transition-opacity"
            title="Back to pipelines"
          >
            <HorosIcon className="w-5 h-4 text-[#F0EFE2]" />
          </button>

          {/* View Mode Dropdown Trigger matching Screenshot 1 */}
          <div ref={viewMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setViewModeMenuOpen(!viewModeMenuOpen);
                setPipelineMenuOpen(false);
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center border transition-colors rounded-xs",
                viewModeMenuOpen
                  ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635]"
                  : dark
                    ? "border-[#383838] bg-[#202020] text-[#aaa] hover:border-[#75bf00]"
                    : "border-[#d8ddd3] bg-[#fafbfa] text-[#687063] hover:border-[#171a17]"
              )}
              title="Agent Layout View Options"
            >
              <Columns size={13} />
            </button>

            {/* View Mode Menu matching Screenshot 1 */}
            {viewModeMenuOpen && (
              <div className={cn(
                "absolute left-0 top-full z-50 mt-1 w-44 border py-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-xs rounded-xs",
                dark ? "border-[#383838] bg-[#202020] text-[#e0e4dd]" : "border-[#c9cec4] bg-white text-[#171a17]"
              )}>
                <button
                  type="button"
                  onClick={() => {
                    setAgentViewMode("hide_agent");
                    setViewModeMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    agentViewMode === "hide_agent"
                      ? "bg-[#e5e8e3] dark:bg-[#282828] font-semibold"
                      : "hover:bg-[#f3f6f0] dark:hover:bg-[#282828]"
                  )}
                >
                  <PanelLeftClose size={13} />
                  <span>Hide agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAgentViewMode("focus_agent");
                    setViewModeMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    agentViewMode === "focus_agent"
                      ? "bg-[#e5e8e3] dark:bg-[#282828] font-semibold"
                      : "hover:bg-[#f3f6f0] dark:hover:bg-[#282828]"
                  )}
                >
                  <Maximize2 size={13} />
                  <span>Focus agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAgentViewMode("split");
                    setViewModeMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    agentViewMode === "split"
                      ? "bg-[#e5e8e3] dark:bg-[#282828] font-semibold"
                      : "hover:bg-[#f3f6f0] dark:hover:bg-[#282828]"
                  )}
                >
                  <Columns size={13} />
                  <span>Show workspace</span>
                </button>
              </div>
            )}
          </div>

          <span className="text-[#c9cec4] dark:text-[#444]">|</span>

          {/* Pipeline Menu Dropdown Trigger matching Screenshot 2 */}
          <div ref={pipelineMenuRef} className="relative">
            {isEditingTitle ? (
              <input
                autoFocus
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingTitle(false);
                }}
                className="border border-[#75bf00] bg-white dark:bg-[#111] px-2 py-0.5 text-xs font-semibold outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPipelineMenuOpen(!pipelineMenuOpen);
                  setViewModeMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1 font-semibold text-xs transition-colors px-2 py-1 border",
                  pipelineMenuOpen
                    ? "border-[#c9cec4] bg-[#f0f2ee] dark:bg-[#222922]"
                    : "border-transparent hover:border-[#d8ddd3]"
                )}
              >
                <span>{currentTitle}</span>
                <ChevronDown size={12} className="text-[#788274]" />
              </button>
            )}

            {/* Pipeline Action Menu matching Screenshot 2 */}
            {pipelineMenuOpen && (
              <div className={cn(
                "absolute left-0 top-full z-50 mt-1 w-52 border py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-xs",
                dark ? "border-[#333] bg-[#181d18] text-[#e0e4dd]" : "border-[#c9cec4] bg-white text-[#171a17]"
              )}>
                <button
                  type="button"
                  onClick={() => {
                    setPipelineMenuOpen(false);
                    onNavigateToPipelines?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f3f6f0] dark:hover:bg-[#222922]"
                >
                  <ArrowLeft size={13} className="text-[#788274]" />
                  <span>Go to Pipelines</span>
                </button>

                <div className="border-t border-[#edf0eb] dark:border-[#2a3229] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setPipelineMenuOpen(false);
                    setIsEditingTitle(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f3f6f0] dark:hover:bg-[#222922]"
                >
                  <Edit2 size={13} className="text-[#788274]" />
                  <span>Rename pipeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPipelineMenuOpen(false);
                    alert("Pipeline duplicated.");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f3f6f0] dark:hover:bg-[#222922]"
                >
                  <Copy size={13} className="text-[#788274]" />
                  <span>Duplicate pipeline</span>
                </button>

                <button
                  type="button"
                  disabled
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left opacity-40 cursor-not-allowed"
                >
                  <Download size={13} className="text-[#788274]" />
                  <span>Download graph JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme?.();
                    setPipelineMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f3f6f0] dark:hover:bg-[#222922]"
                >
                  {dark ? <Sun size={13} className="text-[#788274]" /> : <Moon size={13} className="text-[#788274]" />}
                  <span>{dark ? "Light mode" : "Dark mode"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPipelineMenuOpen(false);
                    onOpenShortcuts?.();
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[#f3f6f0] dark:hover:bg-[#222922]"
                >
                  <div className="flex items-center gap-2.5">
                    <Keyboard size={13} className="text-[#788274]" />
                    <span>Keyboard shortcuts</span>
                  </div>
                  <kbd className="border border-[#d8ddd3] dark:border-[#444] px-1 font-mono text-[9px]">?</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPipelineMenuOpen(false);
                    alert("Opening HOROS support channel...");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f3f6f0] dark:hover:bg-[#222922]"
                >
                  <Headphones size={13} className="text-[#788274]" />
                  <span>Contact support</span>
                </button>

                <div className="border-t border-[#edf0eb] dark:border-[#2a3229] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setPipelineMenuOpen(false);
                    if (confirm("Permanently delete this pipeline session?")) {
                      onNavigateToPipelines?.();
                    }
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[#b91c1c] dark:text-[#f87171] hover:bg-[#fff5f5] dark:hover:bg-[#3b1212]"
                >
                  <Trash2 size={13} />
                  <span>Delete pipeline</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Dynamic Stage Tabs matching Screenshots */}
        {agentViewMode !== "focus_agent" && (
          <div className={cn(
            "flex items-center gap-1 border p-0.5 font-medium text-xs max-w-[50vw] overflow-visible relative",
            dark ? "border-[#333] bg-[#1a1f1a]" : "border-[#d8ddd3] bg-[#f5f7f3]"
          )}>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[40vw] scrollbar-none">
              {openTabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition-colors cursor-pointer rounded-sm shrink-0 whitespace-nowrap",
                      isActive
                        ? "bg-[#242424] text-[#F0EFE2] font-bold"
                        : "text-[#889284] hover:text-[#F0EFE2]"
                    )}
                  >
                    {tab === "optimization" && <Zap size={11} className="text-[#75bf00]" />}
                    {tab === "benchmarks" && <FlaskConical size={11} className="text-[#75bf00]" />}
                    {tab === "pipeline" && <GitBranch size={11} />}
                    {tab === "test" && <Play size={11} />}
                    {tab === "deploy" && <Rocket size={11} />}
                    {tab === "plan" && <FileText size={11} />}
                    {tab === "experiment" && <Shuffle size={11} />}
                    {tab === "workspace" && <Columns size={11} />}
                    {tab === "code" && <Code size={11} />}
                    {tab === "config" && <Sliders size={11} />}

                    <span className="capitalize">{tab}</span>

                    {openTabs.length > 1 && (
                      <span
                        onClick={(e) => handleCloseTab(e, tab)}
                        className="text-[#C8C7BA] text-[10px] hover:text-[#F0EFE2] ml-0.5 opacity-60 group-hover:opacity-100"
                      >
                        ×
                      </span>
                    )}
                  </button>
                );
              })}

              {/* New Tab indicator if search modal open */}
              {searchViewsModalOpen && (
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 font-semibold text-xs border shrink-0",
                  dark ? "border-[#75bf00] bg-[#141d14] text-[#F0EFE2]" : "border-[#75bf00] bg-[#f0fbe6] text-[#171a17]"
                )}>
                  <span>New tab</span>
                  <span
                    onClick={() => setSearchViewsModalOpen(false)}
                    className="text-[#C8C7BA] text-[10px] hover:text-[#F0EFE2] cursor-pointer ml-1"
                  >
                    ×
                  </span>
                </div>
              )}
            </div>

            {/* Open Command / Add Tab Dropdown Button [+] */}
            <div className="relative shrink-0 border-l border-[#333] pl-1">
              <button
                type="button"
                onClick={() => setSearchViewsModalOpen(!searchViewsModalOpen)}
                className={cn(
                  "px-2 py-1 transition-colors rounded-xs border border-transparent cursor-pointer flex items-center justify-center",
                  searchViewsModalOpen
                    ? "text-[#75bf00] bg-[#1c2a12] border-[#75bf00]"
                    : "text-[#687063] hover:text-[#171a17] dark:hover:text-[#F0EFE2]"
                )}
                title="Add view or jump to tab"
              >
                <Plus size={12} />
              </button>

              {searchViewsModalOpen && (
                <div className={cn(
                  "absolute left-0 top-full mt-2 w-64 border shadow-2xl p-1.5 space-y-1 font-mono text-xs z-[999] rounded-xs animate-in fade-in zoom-in-95 duration-100",
                  dark ? "border-[#333] bg-[#141414] text-[#F0EFE2]" : "border-[#c9cec4] bg-white text-[#171a17]"
                )}>
                  <div className="text-[10px] text-[#889284] px-2.5 py-1 uppercase tracking-wider font-semibold border-b border-[#242424] flex items-center justify-between">
                    <span>Add Workspace Tab</span>
                    <button type="button" onClick={() => setSearchViewsModalOpen(false)} className="hover:text-[#F0EFE2] cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>

                  <div className="space-y-0.5 pt-1">
                    {[
                      { id: "optimization" as ActiveWorkspaceTab, label: "Optimization", icon: Zap, color: "text-[#75bf00]" },
                      { id: "benchmarks" as ActiveWorkspaceTab, label: "Benchmarks", icon: FlaskConical, color: "text-[#75bf00]" },
                      { id: "plan" as ActiveWorkspaceTab, label: "Execution Plan", icon: FileText, color: "text-[#F0EFE2]" },
                      { id: "deploy" as ActiveWorkspaceTab, label: "Deploy Options", icon: Rocket, color: "text-[#F0EFE2]" },
                      { id: "experiment" as ActiveWorkspaceTab, label: "Experiment", icon: Shuffle, color: "text-[#e6b800]" },
                      { id: "code" as ActiveWorkspaceTab, label: "Generated Code", icon: Code, color: "text-[#F0EFE2]" },
                      { id: "config" as ActiveWorkspaceTab, label: "Serving Config", icon: Sliders, color: "text-[#F0EFE2]" },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      const isAlreadyOpen = openTabs.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenTab(item.id)}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-xs cursor-pointer transition-colors text-xs",
                            activeTab === item.id
                              ? dark ? "bg-[#282828] text-[#F0EFE2] font-bold" : "bg-[#f0f4ee] font-bold"
                              : dark ? "hover:bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2]" : "hover:bg-[#f8faf7] text-[#555]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <ItemIcon size={12} className={item.color} />
                            <span>{item.label}</span>
                          </div>
                          {isAlreadyOpen && (
                            <span className="text-[9px] text-[#75bf00] font-bold uppercase">Active</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Telemetry & Actions matching Screenshots 1, 2, 3, 4 */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* 1. GPU Allocation Widget & Popover Dropdown (Image 2) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHeaderPopover(headerPopover === "gpu" ? null : "gpu")}
              className={cn(
                "flex items-center gap-1.5 border px-2 py-1 transition-colors cursor-pointer rounded-xs",
                headerPopover === "gpu"
                  ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635]"
                  : dark ? "border-[#383838] bg-[#1a1f1a] text-[#F0EFE2] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#171a17]"
              )}
            >
              <NvidiaLogo size={13} />
              <span className="font-bold text-[11px]">1</span>
            </button>

            {headerPopover === "gpu" && (
              <div className="absolute right-0 top-full mt-2 w-72 border border-dashed border-[#383838] bg-[#141414] p-3 rounded-sm font-mono text-xs z-50 shadow-2xl space-y-2.5">
                <div className="flex items-center justify-between text-[#889284] text-[11px]">
                  <span>Session GPUs</span>
                  <span>Planned (estimate)</span>
                </div>
                <div className="flex items-center justify-between border border-[#282828] bg-[#1a1a1a] p-2 rounded-sm">
                  <div className="flex items-center gap-2">
                    <NvidiaLogo size={14} />
                    <span className="font-bold text-[#F0EFE2]">A100</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-[#F0EFE2] font-bold">40 GB</span>
                    <span className="text-[#889284]">High-end</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. GitHub Push Code Popover Dropdown (Image 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHeaderPopover(headerPopover === "github" ? null : "github")}
              className={cn(
                "flex items-center gap-1.5 border px-2 py-1 transition-colors cursor-pointer rounded-xs",
                headerPopover === "github"
                  ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635]"
                  : dark ? "border-[#383838] bg-[#1a1f1a] text-[#F0EFE2] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#171a17]"
              )}
            >
              <GithubLogo size={13} />
              <span className="font-sans text-[11px]">GitHub</span>
            </button>

            {headerPopover === "github" && (
              <div className="absolute right-0 top-full mt-2 w-80 border border-dashed border-[#383838] bg-[#141414] p-4 rounded-sm font-mono text-xs z-50 shadow-2xl space-y-3">
                <h4 className="font-bold text-[#F0EFE2] text-sm">Push your code to GitHub</h4>
                <p className="text-[#889284] text-[11px] leading-relaxed">
                  Send this session&apos;s generated pipeline files to a repository you own, with the optimization details in the commit message when available.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Connecting GitHub OAuth...")}
                  className="w-full border border-[#383838] bg-[#222] hover:bg-[#282828] text-[#F0EFE2] font-bold py-1.5 rounded-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <GithubLogo size={14} />
                  <span>Connect GitHub</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Send Feedback Popover Dropdown (Image 3) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHeaderPopover(headerPopover === "feedback" ? null : "feedback")}
              className={cn(
                "flex items-center gap-1 border px-2 py-1 transition-colors cursor-pointer rounded-xs",
                headerPopover === "feedback"
                  ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635]"
                  : dark ? "border-[#383838] bg-[#1a1f1a] text-[#F0EFE2] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#171a17]"
              )}
            >
              <MessageSquare size={11} />
              <span className="font-sans text-[11px]">Feedback</span>
            </button>

            {headerPopover === "feedback" && (
              <div className="absolute right-0 top-full mt-2 w-88 border border-dashed border-[#383838] bg-[#141414] p-4 rounded-sm font-mono text-xs z-50 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#F0EFE2]">Send Feedback</h4>
                  <button type="button" onClick={() => setHeaderPopover(null)} className="text-[#889284] hover:text-[#F0EFE2] cursor-pointer">
                    <X size={13} />
                  </button>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { id: "bug", label: "🪲 Bug" },
                    { id: "feature", label: "💡 Feature" },
                    { id: "feedback", label: "Feedback" },
                    { id: "support", label: "🎧 Support" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeedbackCategory(tab.id as typeof feedbackCategory)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-mono rounded-sm border cursor-pointer transition-colors whitespace-nowrap",
                        feedbackCategory === tab.id
                          ? "border-[#3a3a3a] bg-[#242424] text-[#F0EFE2] font-bold"
                          : "border-transparent text-[#889284] hover:text-[#F0EFE2]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Describe the issue, suggestion, or question..."
                  rows={3}
                  className="w-full border border-[#282828] bg-[#1a1a1a] p-2.5 text-xs text-[#F0EFE2] placeholder-[#666] outline-none rounded-sm font-mono"
                />

                {/* Include session info toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[#F0EFE2] text-xs block font-bold">Include session info</span>
                    <span className="text-[10px] text-[#788274] block">URL, browser, and screen size to help us debug.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeSessionData(!includeSessionData)}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center",
                      includeSessionData ? "bg-[#75bf00] justify-end" : "bg-[#333] justify-start"
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-black block" />
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  disabled={!feedbackMessage.trim()}
                  onClick={() => {
                    alert("Feedback submitted successfully!");
                    setFeedbackMessage("");
                    setHeaderPopover(null);
                  }}
                  className={cn(
                    "w-full border py-1.5 rounded-sm font-bold text-xs cursor-pointer transition-colors",
                    feedbackMessage.trim()
                      ? "border-[#75bf00] bg-[#75bf00] text-black"
                      : "border-[#333] bg-[#222] text-[#666] cursor-not-allowed"
                  )}
                >
                  Submit
                </button>
              </div>
            )}
          </div>

          {/* 4. Session Cost & Billing Popover Dropdown (Image 4) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHeaderPopover(headerPopover === "cost" ? null : "cost")}
              className={cn(
                "flex items-center gap-1 border px-2 py-1 font-mono text-[11px] transition-colors cursor-pointer rounded-xs",
                headerPopover === "cost"
                  ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635]"
                  : dark ? "border-[#383838] bg-[#141814] text-[#889284] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
              )}
            >
              <span>Session • </span>
              <span className="text-[#75bf00] font-bold">$0.49</span>
            </button>

            {headerPopover === "cost" && (
              <div className="absolute right-0 top-full mt-2 w-80 border border-dashed border-[#383838] bg-[#141414] p-4 rounded-sm font-mono text-xs z-50 shadow-2xl space-y-4">
                <div>
                  <span className="text-[#889284] text-[11px] block">Session cost</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-bold text-[#F0EFE2]">$0.49</span>
                    <span className="flex items-center gap-1 text-[11px] text-[#889284]">
                      <span className="h-2 w-2 rounded-full bg-[#889284]" />
                      Idle
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#242424] pt-3">
                  <span className="text-[#889284] text-[11px] block">Balance</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[#F0EFE2]">Balance remaining</span>
                    <span className="font-bold text-[#F0EFE2]">$9.51</span>
                  </div>
                </div>

                <div className="border-t border-[#242424] pt-3 space-y-1">
                  <span className="text-[#889284] text-[11px] block">Compute used</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F0EFE2] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#889284]" />
                      Agent tokens
                    </span>
                    <span className="font-bold text-[#F0EFE2]">$0.49</span>
                  </div>
                  <p className="text-[10px] text-[#666] leading-tight pt-0.5">
                    Each message holds $1.00 and settles to actual token cost (typically under $0.20).
                  </p>
                </div>

                <div className="border-t border-[#242424] pt-3 space-y-1.5 text-[11px]">
                  <span className="text-[#889284] block">Phases</span>
                  {[
                    "Hardware selection",
                    "Baseline profile",
                    "Apply Serving config tuning",
                    "Benchmark Serving config tuning",
                    "Compare baseline vs optimized",
                  ].map((phase) => (
                    <div key={phase} className="flex items-center justify-between text-[#889284]">
                      <span>• {phase}</span>
                      <span>-</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#242424] pt-2">
                  <a href="#billing" className="text-[#75bf00] hover:underline text-xs flex items-center gap-1 font-bold">
                    <span>View full billing</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Agent Stream & Composer (Visible when not hidden) */}
        {agentViewMode !== "hide_agent" && (
          <div className={cn(
            "border-r flex flex-col justify-between shrink-0 transition-all",
            agentViewMode === "focus_agent" ? "w-full" : "w-full md:w-[620px] lg:w-[680px] xl:w-[700px]",
            dark ? "border-[#282828] bg-[#151515]" : "border-[#d8ddd3] bg-white"
          )}>
            {/* Stream Log Scroll Area matching uploaded image */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
              <div className={cn(agentViewMode === "focus_agent" ? "max-w-[760px] mx-auto space-y-4" : "space-y-4")}>

                {/* User Prompt Message Card (Right Aligned matching Reference Screenshot) */}
                <div className="flex justify-end pt-1">
                  <div className={cn(
                    "border px-3.5 py-2.5 rounded-lg max-w-xl text-xs leading-relaxed transition-colors",
                    dark ? "border-[#2e2e2e] bg-[#202020] text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#171a17]"
                  )}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Optimize</span>
                      <span className={cn(
                        "border px-1.5 py-0.5 font-sans text-xs flex items-center gap-1.5 rounded-sm",
                        dark ? "border-[#383838] bg-[#252726] text-[#e0e4dd]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#171a17]"
                      )}>
                        <MetaLogo size={13} />
                        <span>llama-3.1-8B-Instruct</span>
                      </span>
                      <span>on</span>
                      <span className={cn(
                        "border px-1.5 py-0.5 font-sans text-xs flex items-center gap-1.5 rounded-sm",
                        dark ? "border-[#383838] bg-[#252726] text-[#e0e4dd]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#171a17]"
                      )}>
                        <VLLMLogo size={13} />
                        <span>vLLM</span>
                      </span>
                      <span>for cheapest GPU with latency and VRAM checks</span>
                    </div>
                  </div>
                </div>

                {/* Thought 1: Exact Match to Reference Screenshot media_1787256346747.png */}
                <div
                  onClick={() => toggleThought("t1")}
                  className="space-y-2 py-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      {expandedThoughts["t1"] !== false ? (
                        <ChevronDown size={14} className="text-[#C8C7BA] shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-[#C8C7BA] shrink-0" />
                      )}
                      <span className="font-bold text-[#F0EFE2]">Thoughts</span>
                      <span className="text-[#C8C7BA] truncate pl-1 font-mono">
                        The request is execution-grade: Llama 3.1 8B, vLLM, cost-first GPU selection,...
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleThought("t1");
                      }}
                      className="text-[#C8C7BA] hover:text-[#F0EFE2] shrink-0 ml-2 font-mono text-xs cursor-pointer"
                    >
                      Verbose
                    </button>
                  </div>

                  {expandedThoughts["t1"] !== false && (
                    <p className="text-xs text-[#a0a89d] leading-relaxed font-sans pl-5 animate-in fade-in duration-150">
                      The request is execution-grade: Llama 3.1 8B, vLLM, cost-first GPU selection, managed cloud deployment, prototype scale, 2,048 max context, 1 concurrency. I&apos;m recording the cost-first objective and exact model scope before sizing feasible GPUs.
                    </p>
                  )}
                </div>

                {/* Step 1: Requirements collected (Exact Screenshot Match - 0 Border - Sharp Corners) */}
                <div
                  onClick={() => toggleStep("requirements")}
                  className={cn(
                    "rounded-none p-4 cursor-pointer transition-all",
                    dark ? "bg-[#141414] hover:bg-[#181818]" : "bg-[#fafbfa]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-none text-xs mt-0.5",
                        dark ? "bg-[#222222] text-[#999999]" : "bg-[#f5f7f3] text-[#687063]"
                      )}>
                        <FileText size={15} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#F0EFE2]">Requirements collected</div>
                        <div className="text-[11px] text-[#788274] leading-relaxed pt-0.5">
                          Collected: use case, sector, scale, deployment, goal, format, preferred models, runs on, concurrency, context window, mode
                        </div>
                      </div>
                    </div>
                    {expandedSteps["requirements"] ? (
                      <ChevronDown size={15} className="text-[#75bf00] shrink-0 mt-1" />
                    ) : (
                      <ChevronRight size={15} className="text-[#C8C7BA] shrink-0 mt-1" />
                    )}
                  </div>

                  {expandedSteps["requirements"] && (
                    <div className="mt-3.5 pt-3.5 border-t border-[#222222] space-y-3 font-mono text-[11px] animate-in fade-in duration-150">
                      <div className="text-[11px] text-[#889284] font-sans">
                        Collected: use case, sector, scale, deployment, goal, format, preferred models, runs on, concurrency, context window, mode
                      </div>

                      {/* CLI Command Block */}
                      <div className="p-3.5 border border-[#222222] bg-[#050505] rounded-none space-y-1.5 text-[#75bf00] overflow-x-auto text-[10.5px] leading-relaxed">
                        <div>$ set-intake \</div>
                        <div className="pl-4 text-[#a0a89d]">--mode optimize \</div>
                        <div className="pl-4 text-[#a0a89d]">--sector other \</div>
                        <div className="pl-4 text-[#a0a89d]">--use-case &apos;general inference&apos; \</div>
                        <div className="pl-4 text-[#a0a89d]">--output-target managed_endpoint \</div>
                        <div className="pl-4 text-[#a0a89d]">--preferred-gpu auto \</div>
                        <div className="pl-4 text-[#a0a89d]">--target-vram-gb 16 \</div>
                        <div className="pl-4 text-[#a0a89d]">--expected-scale prototype \</div>
                        <div className="pl-4 text-[#a0a89d]">--max-context-len 2048 \</div>
                        <div className="pl-4 text-[#a0a89d]">--target-latency-ms 500 \</div>
                        <div className="pl-4 text-[#a0a89d]">--deployment-target cloud_managed \</div>
                        <div className="pl-4 text-[#a0a89d]">--optimization-goal cost \</div>
                        <div className="pl-4 text-[#a0a89d]">--deployment-profile production \</div>
                        <div className="pl-4 text-[#a0a89d]">--expected-concurrency 1</div>
                      </div>

                      {/* JSON Intake Payload Block matching RunInfra scroll UI */}
                      <div className="border border-[#222222] bg-[#050505] rounded-none text-[#a0a89d] space-y-1 text-[10.5px] max-h-52 overflow-auto p-3.5 [scrollbar-width:thin] [scrollbar-color:#2a2a2a_#050505] leading-relaxed">
                        <div>{"{"}</div>
                        <div className="pl-3"><span className="text-[#C8C7BA]">&quot;intake&quot;:</span> {"{"}</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;mode&quot;:</span> <span className="text-[#75bf00]">&quot;optimize&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;sector&quot;:</span> <span className="text-[#75bf00]">&quot;other&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;useCase&quot;:</span> <span className="text-[#75bf00]">&quot;general inference&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;outputTarget&quot;:</span> <span className="text-[#75bf00]">&quot;managed_endpoint&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;expectedScale&quot;:</span> <span className="text-[#75bf00]">&quot;prototype&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;maxContextLen&quot;:</span> <span className="text-[#F0EFE2]">2048</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;deploymentTarget&quot;:</span> <span className="text-[#75bf00]">&quot;cloud_managed&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;optimizationGoal&quot;:</span> <span className="text-[#75bf00]">&quot;cost&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;pipelineIntentV1&quot;:</span> {"{"}</div>
                        <div className="pl-9"><span className="text-[#C8C7BA]">&quot;source&quot;:</span> <span className="text-[#75bf00]">&quot;deterministic-intake&quot;</span>,</div>
                        <div className="pl-9"><span className="text-[#C8C7BA]">&quot;version&quot;:</span> <span className="text-[#F0EFE2]">1</span>,</div>
                        <div className="pl-9"><span className="text-[#C8C7BA]">&quot;topology&quot;:</span> <span className="text-[#75bf00]">&quot;single-model&quot;</span>,</div>
                        <div className="pl-9"><span className="text-[#C8C7BA]">&quot;modalities&quot;:</span> [<span className="text-[#75bf00]">&quot;llm&quot;</span>],</div>
                        <div className="pl-9"><span className="text-[#C8C7BA]">&quot;fingerprint&quot;:</span> <span className="text-[#75bf00]">&quot;v1:single-model:llm&quot;</span></div>
                        <div className="pl-6">{"}"},</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;deploymentProfile&quot;:</span> <span className="text-[#75bf00]">&quot;production&quot;</span>,</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;expectedConcurrency&quot;:</span> <span className="text-[#F0EFE2]">1</span></div>
                        <div className="pl-3">{"}"},</div>
                        <div className="pl-3"><span className="text-[#75bf00]">&quot;success&quot;:</span> <span className="text-[#F0EFE2]">true</span>,</div>
                        <div className="pl-3"><span className="text-[#C8C7BA]">&quot;intakeWarnings&quot;:</span> [</div>
                        <div className="pl-6 text-amber-400/90">&quot;targetLatencyMs=500 was NOT saved: no user message states this latency target. Ask the user for their actual target.&quot;,</div>
                        <div className="pl-6 text-amber-400/90">&quot;targetVramGb=16 was NOT saved: no user message states this VRAM budget. Ask the user for their actual VRAM budget.&quot;,</div>
                        <div className="pl-6 text-amber-400/90">&quot;preferredGpu=auto was NOT saved: no user message names this GPU. GPU selection stays auto; ask the user.&quot;</div>
                        <div className="pl-3">],</div>
                        <div className="pl-3"><span className="text-[#75bf00]">&quot;readyToConfirm&quot;:</span> <span className="text-[#F0EFE2]">true</span></div>
                        <div>{"}"}</div>
                      </div>

                      {/* Exit status tag outside scrollbox */}
                      <div className="text-[10.5px] font-mono text-[#75bf00] pt-0.5">exit 0</div>
                    </div>
                  )}
                </div>

                {/* Step 2: Intake updated (Exact Screenshot Match - 0 Border - Sharp Corners) */}
                <div
                  onClick={() => toggleStep("intake")}
                  className={cn(
                    "rounded-none p-4 cursor-pointer transition-all",
                    dark ? "bg-[#141414] hover:bg-[#181818]" : "bg-[#fafbfa]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-none text-xs",
                        dark ? "bg-[#222222] text-[#999999]" : "bg-[#f5f7f3] text-[#687063]"
                      )}>
                        <FileText size={15} />
                      </div>
                      <span className="font-bold text-xs text-[#F0EFE2]">Intake updated</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#788274]">
                      <span>Other, Prototype, Cloud (Managed), Low Cost</span>
                      {expandedSteps["intake"] ? (
                        <ChevronDown size={15} className="text-[#75bf00]" />
                      ) : (
                        <ChevronRight size={15} className="text-[#C8C7BA]" />
                      )}
                    </div>
                  </div>

                  {expandedSteps["intake"] && (
                    <div className="mt-3.5 pt-3.5 border-t border-[#222222] space-y-2 font-sans text-[11px] text-[#a0a89d] animate-in fade-in duration-150">
                      <div className="flex justify-between py-1 border-b border-[#222]">
                        <span className="text-[#788274]">Use Case</span>
                        <span className="text-[#F0EFE2] font-mono">general inference</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#222]">
                        <span className="text-[#788274]">Sector</span>
                        <span className="text-[#F0EFE2] font-mono">Other</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#222]">
                        <span className="text-[#788274]">Scale</span>
                        <span className="text-[#F0EFE2] font-mono">Prototype</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#222]">
                        <span className="text-[#788274]">Deployment</span>
                        <span className="text-[#F0EFE2] font-mono">Cloud (Managed)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#788274]">Goal</span>
                        <span className="text-[#F0EFE2] font-mono">Low Cost</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thought 2: Exact Match to Reference Screenshot media_1787256346747.png */}
                <div
                  onClick={() => toggleThought("t2")}
                  className="space-y-2 py-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      {expandedThoughts["t2"] !== false ? (
                        <ChevronDown size={14} className="text-[#C8C7BA] shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-[#C8C7BA] shrink-0" />
                      )}
                      <span className="font-bold text-[#F0EFE2]">Thoughts</span>
                      <span className="text-[#C8C7BA] truncate pl-1 font-mono">
                        The model resolved successfully and the requested numerical fields were...
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleThought("t2");
                      }}
                      className="text-[#C8C7BA] hover:text-[#F0EFE2] shrink-0 ml-2 font-mono text-xs cursor-pointer"
                    >
                      Verbose
                    </button>
                  </div>

                  {expandedThoughts["t2"] !== false && (
                    <p className="text-xs text-[#a0a89d] leading-relaxed font-sans pl-5 animate-in fade-in duration-150">
                      The model resolved successfully and the requested numerical fields were parsed. I&apos;m sizing the 8B model across compatible GPU tiers to identify the lowest-cost fit.
                    </p>
                  )}
                </div>

                {/* Step 3: GPU feasibility (Exact Screenshot Match - 0 Border - Sharp Corners) */}
                <div
                  onClick={() => toggleStep("gpu")}
                  className={cn(
                    "rounded-none p-4 cursor-pointer transition-all",
                    dark ? "bg-[#141414] hover:bg-[#181818]" : "bg-[#fafbfa]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-none text-xs",
                        dark ? "bg-[#222222] text-[#999999]" : "bg-[#f5f7f3] text-[#687063]"
                      )}>
                        <Search size={15} />
                      </div>
                      <span className="font-bold text-xs text-[#F0EFE2]">GPU feasibility</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#e0e4dd]">
                      <span>A100-40GB</span>
                      {expandedSteps["gpu"] ? (
                        <ChevronDown size={15} className="text-[#75bf00]" />
                      ) : (
                        <ChevronRight size={15} className="text-[#C8C7BA]" />
                      )}
                    </div>
                  </div>

                  {expandedSteps["gpu"] && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a] space-y-3 font-sans text-[11px] animate-in fade-in duration-150">
                      <p className="text-[#a0a89d] italic leading-relaxed">
                        8B model (16GB weights from catalog weight size) fits on A100-40GB. Real latency and cost will be measured during the runbook.
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 border border-[#383838] bg-[#181818] text-[#F0EFE2] font-mono text-[10.5px] rounded-xs">
                          Recommended: 1x A100-40GB
                        </span>
                      </div>

                      <p className="text-[10px] text-[#666] italic">
                        Estimated from model shape and hardware specs, not measured. Real numbers arrive once the runbook profiles this on a GPU.
                      </p>

                      {/* Feasibility Candidate Table */}
                      <div className="border border-[#262626] rounded-xs overflow-hidden font-mono text-[10.5px]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#262626] bg-[#181818] text-[#788274]">
                              <th className="p-2 font-normal">GPU</th>
                              <th className="p-2 font-normal">Latency</th>
                              <th className="p-2 font-normal">VRAM</th>
                              <th className="p-2 font-normal">$/req</th>
                              <th className="p-2 font-normal text-right">Verdict</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222] text-[#d0d4cd]">
                            <tr className="hover:bg-[#1c1c1c]">
                              <td className="p-2 font-semibold">2× T4</td>
                              <td className="p-2">9.6-14.4s</td>
                              <td className="p-2">19.5GB</td>
                              <td className="p-2">$0.0039</td>
                              <td className="p-2 text-right"><span className="border border-[#333] px-1.5 py-0.5 rounded-xs text-[#C8C7BA]">Comfortable</span></td>
                            </tr>
                            <tr className="hover:bg-[#1c1c1c]">
                              <td className="p-2 font-semibold">L4</td>
                              <td className="p-2">20.3-30.5s</td>
                              <td className="p-2">19.5GB</td>
                              <td className="p-2">$0.0056</td>
                              <td className="p-2 text-right"><span className="border border-[#333] px-1.5 py-0.5 rounded-xs text-[#C8C7BA]">Comfortable</span></td>
                            </tr>
                            <tr className="hover:bg-[#1c1c1c]">
                              <td className="p-2 font-semibold">A10G</td>
                              <td className="p-2">10.2-15.2s</td>
                              <td className="p-2">19.5GB</td>
                              <td className="p-2">$0.0039</td>
                              <td className="p-2 text-right"><span className="border border-[#333] px-1.5 py-0.5 rounded-xs text-[#C8C7BA]">Comfortable</span></td>
                            </tr>
                            <tr className="bg-[#1b2416] border-l-2 border-l-[#75bf00]">
                              <td className="p-2 font-bold text-[#F0EFE2] flex items-center gap-1.5">
                                <span>A100-40GB</span>
                                <span className="border border-[#384820] bg-[#182613] text-[#75bf00] px-1 text-[9px] rounded-xs font-normal">Recommended</span>
                              </td>
                              <td className="p-2 text-[#75bf00] font-semibold">3.9-5.9s</td>
                              <td className="p-2">19.5GB</td>
                              <td className="p-2 font-bold text-[#75bf00]">$0.0029</td>
                              <td className="p-2 text-right"><span className="border border-[#384820] bg-[#182613] text-[#75bf00] px-1.5 py-0.5 rounded-xs">Comfortable</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="text-[10px] text-[#666] italic">
                        Run a measured benchmark before treating this as production evidence.
                      </p>
                    </div>
                  )}
                </div>

                {/* Thought 3: 100% Exact Match to Reference Screenshot media_1787256346747.png */}
                <div
                  onClick={() => toggleThought("t3")}
                  className="space-y-2 py-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      {expandedThoughts["t3"] !== false ? (
                        <ChevronDown size={14} className="text-[#C8C7BA] shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-[#C8C7BA] shrink-0" />
                      )}
                      <span className="font-bold text-[#F0EFE2]">Thoughts</span>
                      <span className="text-[#C8C7BA] truncate pl-1 font-mono">
                        The feasibility result confirms that the model&apos;s catalog weight size is 16GB...
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleThought("t3");
                      }}
                      className="text-[#C8C7BA] hover:text-[#F0EFE2] shrink-0 ml-2 font-mono text-xs cursor-pointer"
                    >
                      Verbose
                    </button>
                  </div>

                  {expandedThoughts["t3"] !== false && (
                    <p className="text-xs text-[#a0a89d] leading-relaxed font-sans pl-5 animate-in fade-in duration-150">
                      The feasibility result confirms that the model&apos;s catalog weight size is 16GB and its 2,048-token, 256-output-token workload needs 19.5GB peak VRAM. A100-40GB is the lowest modeled cost per request at $0.002866, ahead of A10G at $0.003884 and the two-T4 configuration at $0.00393. The backend is locked to vLLM, which is compatible. There is no user-stated latency target, so the plan must explicitly say no target is set and use baseline measurement plus serving tuning only. Quantization, speculation, KV compression, and kernel work must be excluded because they were neither requested nor available in the current trial execution budget.
                    </p>
                  )}
                </div>

                {/* Step 4: Plan drafted (Exact Screenshot Match - 0 Border - Sharp Corners) */}
                <div
                  onClick={() => toggleStep("plan")}
                  className={cn(
                    "rounded-none p-4 cursor-pointer transition-all",
                    dark ? "bg-[#141414] hover:bg-[#181818]" : "bg-[#fafbfa]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs",
                        dark ? "bg-[#222222] text-[#999999]" : "bg-[#f5f7f3] text-[#687063]"
                      )}>
                        <Layers size={15} />
                      </div>
                      <span className="font-bold text-xs text-[#F0EFE2]">Plan drafted</span>
                    </div>
                    {expandedSteps["plan"] ? (
                      <ChevronDown size={15} className="text-[#75bf00]" />
                    ) : (
                      <ChevronRight size={15} className="text-[#C8C7BA]" />
                    )}
                  </div>

                  {expandedSteps["plan"] && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a] space-y-3 font-mono text-[10.5px] animate-in fade-in duration-150">
                      {/* CLI Command Block */}
                      <div className="p-3.5 border border-[#1a1a1a] bg-[#050505] rounded-xl space-y-1.5 text-[#75bf00] overflow-x-auto">
                        <div>$ create-plan \</div>
                        <div className="pl-4 text-[#a0a89d]">&quot;goals&quot;: &quot;Optimize meta-llama/Llama-3.1-8B-Instruct for cost, no numeric target set. Runs on managed cloud by default; vLLM is locked by user.&quot; \</div>
                        <div className="pl-4 text-[#a0a89d]">&quot;budget&quot;: {"{\"maxCells\":2,\"quotedHoldCents\":0}"} \</div>
                        <div className="pl-4 text-[#a0a89d]">&quot;insight&quot;: &quot;The catalog reports 16GB FP16 weights, and feasibility models 19.5GB peak VRAM fit.&quot; \</div>
                        <div className="pl-4 text-[#a0a89d]">&quot;priority&quot;: &quot;cost&quot; \</div>
                        <div className="pl-4 text-[#a0a89d]">&quot;recommended-gpu&quot;: &quot;A100-40GB&quot; \</div>
                        <div className="pl-4 text-[#a0a89d]">&quot;serving-backend&quot;: &quot;vLLM&quot;</div>
                      </div>

                      {/* JSON ToolInputs Spec matching RunInfra scroll UI */}
                      <div className="border border-[#1a1a1a] bg-[#050505] rounded-xl text-[#a0a89d] space-y-1 text-[10.5px] max-h-52 overflow-auto p-3.5 [scrollbar-width:thin] [scrollbar-color:#2a2a2a_#050505]">
                        <div>{"{"}</div>
                        <div className="pl-3"><span className="text-[#C8C7BA]">&quot;engine&quot;:</span> <span className="text-[#75bf00]">&quot;serving&quot;</span>,</div>
                        <div className="pl-3"><span className="text-[#C8C7BA]">&quot;status&quot;:</span> <span className="text-[#75bf00]">&quot;pending&quot;</span>,</div>
                        <div className="pl-3"><span className="text-[#C8C7BA]">&quot;modality&quot;:</span> <span className="text-[#75bf00]">&quot;llm&quot;</span>,</div>
                        <div className="pl-3"><span className="text-[#C8C7BA]">&quot;dependsOn&quot;:</span> [<span className="text-[#75bf00]">&quot;phase-baseline&quot;</span>],</div>
                        <div className="pl-3"><span className="text-[#C8C7BA]">&quot;toolInputs&quot;:</span> {"{"}</div>
                        <div className="pl-6"><span className="text-[#C8C7BA]">&quot;apply_serving_config&quot;:</span> {"{"}</div>
                        <div className="pl-9"><span className="text-[#C8C7BA]">&quot;techniques&quot;:</span> [<span className="text-[#75bf00]">&quot;vllm-continuous-batching&quot;</span>],</div>
                        <div className="pl-9"><span className="text-[#C8C7BA]">&quot;techniqueKnobs&quot;:</span> [</div>
                        <div className="pl-12 text-[#75bf00]">&quot;maxNumSeqs&quot;,</div>
                        <div className="pl-12 text-[#75bf00]">&quot;maxNumBatchedTokens&quot;,</div>
                        <div className="pl-12 text-[#75bf00]">&quot;enablePrefixCaching&quot;,</div>
                        <div className="pl-12 text-[#75bf00]">&quot;enableChunkedPrefill&quot;</div>
                        <div className="pl-9">]</div>
                        <div className="pl-6">{"}"}</div>
                        <div className="pl-3">{"}"}</div>
                        <div>{"}"}</div>
                      </div>

                      {/* Exit status tag outside scrollbox */}
                      <div className="text-[10.5px] font-mono text-[#666] pt-0.5">exit 0</div>
                    </div>
                  )}
                </div>

                {/* Step 5: Plan ready & Financial Balance Hold Card (Exact Screenshot 1 & 5) */}
                {/* Step 5: Plan ready (100% Exact Match to Reference Screenshot media_1787255584421.png) */}
                <div
                  onClick={() => toggleStep("plan_ready")}
                  className={cn(
                    "rounded-none p-4 transition-all cursor-pointer",
                    dark ? "bg-[#141414] hover:bg-[#181818]" : "bg-[#fafbfa] border border-[#d8ddd3]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-none text-xs",
                        dark ? "bg-[#222222] border border-[#383838] text-[#999999]" : "bg-[#f5f7f3] text-[#687063]"
                      )}>
                        <Layers size={14} />
                      </div>
                      <span className="font-bold text-xs text-[#F0EFE2]">Plan ready</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#788274]">
                      <span>Est. charge $18.50 / review / 5 phases / ~6m</span>
                      {expandedSteps["plan_ready"] !== false ? (
                        <ChevronDown size={14} className="text-[#75bf00] shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-[#C8C7BA] shrink-0" />
                      )}
                    </div>
                  </div>

                  {expandedSteps["plan_ready"] !== false && (
                    <div className="mt-3.5 pt-3.5 border-t border-[#222222] space-y-3.5 text-xs font-sans animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-[#d0d4cd] leading-relaxed">
                        Optimize meta-llama/Llama-3.1-8B-Instruct for cost, no numeric target set. Runs on managed cloud by default; vLLM is locked by user. GPU chosen by feasibility: 1x A100-40GB for the lowest modeled per-request cost and 19.5GB peak-VRAM fit.
                      </p>

                      <p className="text-[11px] text-[#C8C7BA]">
                        Recommended path: vLLM on A100-40GB. Review the plan before execution.
                      </p>

                      {/* Supported Green Badge Box */}
                      <div className="p-3 border border-[#283818] bg-[#121c0e] rounded-none space-y-1 font-mono text-[11px]">
                        <div className="flex items-center gap-2 text-[#75bf00] font-bold">
                          <span className="h-2 w-2 rounded-full bg-[#75bf00]" />
                          <span>SUPPORTED</span>
                        </div>
                        <div className="text-[11px] text-[#a0e060]">
                          Measured optimization is supported for this model.
                        </div>
                      </div>

                      {/* Financial Breakdown Table */}
                      <div className="pt-2 font-mono text-xs space-y-2">
                        <div className="flex items-center justify-between py-1.5 border-t border-dashed border-[#282828]">
                          <span className="text-[#C8C7BA]">Estimated run charge</span>
                          <span className="font-bold text-[#F0EFE2]">$18.50</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-t border-dashed border-[#282828]">
                          <span className="text-[#C8C7BA]">Temporary hold</span>
                          <span className="font-bold text-[#F0EFE2]">$37.00</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-t border-b border-dashed border-[#282828]">
                          <span className="text-[#C8C7BA]">Available balance</span>
                          <span className="font-bold text-[#75bf00]">$9.51</span>
                        </div>

                        <p className="text-[10.5px] text-[#666666] pt-1 leading-relaxed font-sans">
                          You will not be charged more than the estimate. The $37.00 displayed hold is the balance required to start, and only the final charge is deducted.
                        </p>

                        <div className="p-2.5 border border-amber-500/40 bg-amber-950/20 rounded-none text-amber-500 text-xs font-sans font-bold leading-relaxed">
                          Not enough available balance for the $37.00 temporary hold. No charge has been made.
                        </div>
                      </div>

                      {/* Action Triggers matching Reference Screenshot media_1787255584421.png */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenTab("plan")}
                          className="flex items-center gap-1.5 border border-[#383838] bg-[#181818] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-none transition-colors cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          <span>Open Plan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => alert("Reducing plan cost knobs...")}
                          className="border border-[#383838] bg-[#181818] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-none transition-colors cursor-pointer"
                        >
                          Reduce plan cost
                        </button>
                        <button
                          type="button"
                          onClick={() => alert("Refreshing balance...")}
                          className="border border-[#383838] bg-[#181818] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-none transition-colors cursor-pointer"
                        >
                          Refresh balance
                        </button>
                        <button
                          type="button"
                          onClick={() => alert("Adding funds to workspace balance...")}
                          className="border border-[#75bf00] bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-3.5 py-1.5 rounded-none transition-colors cursor-pointer"
                        >
                          Add funds
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 6: Human Gate & Execution Decision matching Image 1 & 4 collapsible dropdown accordion */}
                <div
                  onClick={() => toggleStep("human_gate")}
                  className={cn(
                    "rounded-none p-4 space-y-3.5 group relative transition-colors cursor-pointer",
                    dark ? "bg-[#141414] hover:bg-[#181818]" : "bg-white border border-[#d8ddd3]"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-[#282828] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-none text-xs",
                        dark ? "border border-[#383838] bg-[#151515] text-[#889284]" : "border border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                      )}>
                        <ShieldAlert size={12} />
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-semibold text-xs text-[#F0EFE2]">Human Gate: Production Approval</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-none border border-[#383838] bg-[#151515] text-[#C8C7BA]">
                          Gate C • Review
                        </span>
                      </div>
                    </div>

                    {expandedSteps["human_gate"] !== false ? (
                      <ChevronDown size={15} className="text-[#75bf00] shrink-0" />
                    ) : (
                      <ChevronRight size={15} className="text-[#C8C7BA] shrink-0" />
                    )}
                  </div>

                  {expandedSteps["human_gate"] !== false && (
                    <div className="space-y-2.5 text-xs font-sans animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-[#a0a89d] leading-relaxed">
                        Candidate B passed all verification benchmarks. Operational policy requires engineer approval for 100% production traffic cutover on @checkout-service.
                      </p>

                      {/* Section 43-50: Customer-Facing Mission Result Taxonomy & Deliverable Package */}
                      <div className="p-3.5 border border-dashed border-[#383838] bg-[#141414] rounded-sm space-y-3 font-mono text-[11px]">

                        {/* Header Badge */}
                        <div className="flex items-center justify-between border-b border-[#282828] pb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[#a3e635]" />
                            <span className="font-bold text-[#F0EFE2] uppercase tracking-wider text-xs">
                              {selectedMode === "Experiment" ? "VERIFIED EXPERIMENT RESULT" : "VERIFIED OPTIMIZATION RESULT"}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 border border-[#283818] bg-[#162414] text-[#a3e635] font-bold rounded-sm">
                            ● VERDICT: VERIFIED
                          </span>
                        </div>

                        {/* Result Matrix Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2.5 border border-[#282828] bg-[#181818] rounded-sm space-y-0.5">
                            <div className="text-[#889284] text-[10px]">P99 Latency:</div>
                            <div className="font-bold text-[#F0EFE2] text-xs">184ms → 139ms <span className="text-[#a3e635] font-normal text-[11px]">(-24%)</span></div>
                          </div>
                          <div className="p-2.5 border border-[#282828] bg-[#181818] rounded-sm space-y-0.5">
                            <div className="text-[#889284] text-[10px]">Throughput:</div>
                            <div className="font-bold text-[#F0EFE2] text-xs">401 → 518 tok/s <span className="text-[#a3e635] font-normal text-[11px]">(+29%)</span></div>
                          </div>
                          <div className="p-2.5 border border-[#282828] bg-[#181818] rounded-sm space-y-0.5">
                            <div className="text-[#889284] text-[10px]">Cost Impact:</div>
                            <div className="font-bold text-[#F0EFE2] text-xs">-$54.60/mo <span className="text-[#a3e635] font-normal text-[11px]">(-31%)</span></div>
                          </div>
                          <div className="p-2.5 border border-[#282828] bg-[#181818] rounded-sm space-y-0.5">
                            <div className="text-[#889284] text-[10px]">Quality Score:</div>
                            <div className="font-bold text-[#F0EFE2] text-xs">98.7% <span className="text-[#889284] font-normal text-[11px]">(Maintained)</span></div>
                          </div>
                        </div>

                        {/* Section 49-50: Deliverable Package Tabs */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#889284] uppercase tracking-wider font-semibold">Primary Deliverable Package:</span>
                            <div className="flex items-center gap-1 bg-[#181818] p-0.5 border border-[#282828] rounded-sm">
                              <button
                                type="button"
                                onClick={() => setDeliverableActiveTab("config")}
                                className={cn(
                                  "px-2.5 py-0.5 text-[10px] transition-colors rounded-sm cursor-pointer font-mono",
                                  deliverableActiveTab === "config"
                                    ? "bg-[#242424] text-[#F0EFE2] font-bold"
                                    : "text-[#889284] hover:text-[#F0EFE2]"
                                )}
                              >
                                Serving Config
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeliverableActiveTab("docker")}
                                className={cn(
                                  "px-2.5 py-0.5 text-[10px] transition-colors rounded-sm cursor-pointer font-mono",
                                  deliverableActiveTab === "docker"
                                    ? "bg-[#242424] text-[#F0EFE2] font-bold"
                                    : "text-[#889284] hover:text-[#F0EFE2]"
                                )}
                              >
                                Dockerfile
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeliverableActiveTab("helm")}
                                className={cn(
                                  "px-2.5 py-0.5 text-[10px] transition-colors rounded-sm cursor-pointer font-mono",
                                  deliverableActiveTab === "helm"
                                    ? "bg-[#242424] text-[#F0EFE2] font-bold"
                                    : "text-[#889284] hover:text-[#F0EFE2]"
                                )}
                              >
                                Kubernetes Helm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeliverableActiveTab("rollback")}
                                className={cn(
                                  "px-2.5 py-0.5 text-[10px] transition-colors rounded-sm cursor-pointer font-mono",
                                  deliverableActiveTab === "rollback"
                                    ? "bg-[#242424] text-[#F0EFE2] font-bold"
                                    : "text-[#889284] hover:text-[#F0EFE2]"
                                )}
                              >
                                Rollback Script
                              </button>
                            </div>
                          </div>

                          {/* Code Container View */}
                          <div className="p-3 border border-[#282828] bg-[#181818] rounded-sm text-[10.5px] font-mono overflow-x-auto text-[#d0d4cd] leading-relaxed max-h-44 overflow-y-auto">
                            {deliverableActiveTab === "config" && (
                              <pre className="text-[#a3e635]">{`{
  "engine": "vllm",
  "model": "${chipModel}",
  "tensor_parallel_size": 1,
  "max_num_seqs": 256,
  "max_num_batched_tokens": 8192,
  "enable_prefix_caching": true,
  "enable_chunked_prefill": true,
  "gpu_memory_utilization": 0.90,
  "dtype": "bfloat16"
}`}</pre>
                            )}

                            {deliverableActiveTab === "docker" && (
                              <pre className="text-[#e0e4dd]">{`FROM nvcr.io/nvidia/vllm:v0.6.2
ENV MODEL_ID="${chipModel}"
ENV TENSOR_PARALLEL_SIZE=1
COPY config.json /etc/vllm/config.json
EXPOSE 8000
CMD ["python3", "-m", "vllm.entrypoints.openai.api_server", "--config", "/etc/vllm/config.json"]`}</pre>
                            )}

                            {deliverableActiveTab === "helm" && (
                              <pre className="text-[#e0e4dd]">{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: horos-${chipModel.toLowerCase().replace(/[^a-z0-9]/g, "-")}
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: vllm-server
        image: vllm/vllm-openai:latest
        resources:
          limits:
            nvidia.com/gpu: "1"`}</pre>
                            )}

                            {deliverableActiveTab === "rollback" && (
                              <pre className="text-[#e0e4dd]">{`#!/bin/bash
# HOROS Automatic Rollback Script
set -e
echo "Rolling back deployment to baseline revision..."
kubectl rollout undo deployment/horos-${chipModel.toLowerCase().replace(/[^a-z0-9]/g, "-")}
echo "Rollback completed cleanly."`}</pre>
                            )}
                          </div>
                        </div>

                        {/* Proof & Verifier Receipt */}
                        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-[#282828] text-[10px] text-[#889284]">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-[#a3e635]" />
                            <span>SHA-256 Provenance Hash:</span>
                            <span className="font-mono text-[#F0EFE2] text-[9.5px]">8f9b2c3a4e7f1d...d9e1</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenTab("evidence")}
                            className="text-[#a3e635] hover:underline font-semibold cursor-pointer"
                          >
                            View Verifier Receipt →
                          </button>
                        </div>

                      </div>

                      {/* Autonomous Policy Engine Clearance Banner */}
                      <div className="flex items-center gap-2 text-xs font-mono text-[#889284] bg-[#181818] p-2.5 border border-[#282828] rounded-sm">
                        <CheckCircle2 size={13} className="text-[#a3e635] shrink-0" />
                        <span>✓ AUTONOMOUS POLICY ENGINE: Risk Check ✓ | Cost Check ✓ | Safety Check ✓ — Autonomous Authorization Granted.</span>
                      </div>

                      {/* Section 39 & 49-51: Action Control Bar (Deploy, Apply, Export Stack, Download Kit, Run Again) */}
                      <div className="border-t border-dashed border-[#282828] pt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setExportModalOpen(true)}
                            className="flex items-center gap-1.5 border border-[#383838] bg-[#181818] hover:bg-[#222] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-sm transition-colors cursor-pointer text-xs"
                            title="Export reproducible system stack"
                          >
                            <Box size={12} />
                            <span>Export Stack</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExportModalOpen(true)}
                            className="flex items-center gap-1.5 border border-[#383838] bg-[#181818] hover:bg-[#222] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-sm transition-colors cursor-pointer text-xs"
                            title="Download complete runnable delivery bundle"
                          >
                            <Download size={12} />
                            <span>Download Kit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => alert("Applying configuration changes to target runtime...")}
                            className="flex items-center gap-1.5 border border-[#383838] bg-[#181818] hover:bg-[#222] hover:border-[#a3e635] text-[#a3e635] px-3 py-1.5 rounded-sm transition-colors cursor-pointer text-xs"
                            title="Apply configuration changes directly"
                          >
                            <Zap size={12} />
                            <span>Apply Config</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setActiveTab("deploy")}
                            className="flex items-center gap-1.5 border border-[#383838] bg-[#222] hover:bg-[#282828] text-[#F0EFE2] px-3.5 py-1.5 text-xs rounded-sm transition-colors cursor-pointer font-bold"
                          >
                            <Rocket size={12} className="text-[#a3e635]" />
                            <span>Deploy to Cluster</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setReplayModalOpen(true)}
                            className="flex items-center gap-1 border border-[#383838] bg-[#181818] text-[#F0EFE2] text-xs px-2.5 py-1.5 rounded-sm hover:bg-[#222] hover:border-white transition-colors cursor-pointer"
                          >
                            <RefreshCw size={11} />
                            <span>Run Again</span>
                          </button>
                        </div>
                      </div>

                      {/* Bottom Feedback Actions Icon Row matching Image 4 */}
                      <div className="flex items-center gap-2 pt-2 text-[#788274] font-mono text-xs border-t border-dashed border-[#222]">
                        <button
                          type="button"
                          onClick={() => alert("Copied message content to clipboard.")}
                          className="p-1 hover:text-[#F0EFE2] transition-colors cursor-pointer rounded-xs"
                          title="Copy"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackRating(feedbackRating === "liked" ? null : "liked")}
                          className={cn(
                            "p-1 transition-colors cursor-pointer rounded-xs",
                            feedbackRating === "liked"
                              ? "border border-[#75bf00]/40 bg-[#75bf00]/15 text-[#75bf00]"
                              : "hover:text-[#F0EFE2]"
                          )}
                          title="Good response"
                        >
                          <ThumbsUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackRating(feedbackRating === "disliked" ? null : "disliked")}
                          className={cn(
                            "p-1 transition-colors cursor-pointer rounded-xs",
                            feedbackRating === "disliked"
                              ? "border border-red-500/40 bg-red-500/15 text-red-400"
                              : "hover:text-[#F0EFE2]"
                          )}
                          title="Bad response"
                        >
                          <ThumbsDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => alert("Regenerating decision analysis...")}
                          className="p-1 hover:text-[#F0EFE2] transition-colors cursor-pointer rounded-xs"
                          title="Regenerate"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Chat Composer matching Reference UI */}
            <div className={cn(
              "border-t p-3 relative",
              dark ? "border-[#282828] bg-[#151515]" : "border-[#d8ddd3] bg-[#fafbfa]"
            )}>
              <div className={cn(agentViewMode === "focus_agent" ? "max-w-[760px] mx-auto" : "")}>
                <div className={cn(
                  "border p-2.5 rounded-lg space-y-2 transition-colors",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply, or / for commands"
                    className="w-full bg-transparent border-0 outline-none resize-none font-sans text-xs text-[#F0EFE2] placeholder:text-[#666] leading-relaxed"
                  />

                  {/* Bottom Bar Inside Composer */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#282828]">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setRunContextOpen(!runContextOpen)}
                        className="flex items-center gap-1 text-[11px] font-mono text-[#889284] hover:text-[#F0EFE2] transition-colors"
                      >
                        <span>Run context</span>
                        <ChevronDown size={11} />
                      </button>

                      {/* Run Context Flyout Modal matching Reference Image 1 */}
                      {runContextOpen && (
                        <div className={cn(
                          "absolute bottom-full left-0 mb-2 w-72 border p-3.5 shadow-2xl space-y-3 font-mono text-xs z-50 rounded-xs animate-in fade-in zoom-in-95 duration-100",
                          dark ? "border-[#282828] bg-[#141414] text-[#e0e4dd]" : "border-[#c9cec4] bg-white text-[#171a17]"
                        )}>
                          <div className="font-bold text-[#F0EFE2] text-xs">
                            Run context
                          </div>

                          <div className="space-y-2 text-xs">
                            {/* Item 1: Engine */}
                            <div className="border-b border-dashed border-[#242424] pb-2 space-y-0.5">
                              <span className="text-[#889284] text-[10px] block">Engine</span>
                              <div className="flex items-center gap-1.5 font-bold text-[#F0EFE2] text-xs">
                                <VLLMLogo size={13} />
                                <span>{chipRuntime}</span>
                              </div>
                            </div>

                            {/* Item 2: GPU */}
                            <div className="border-b border-dashed border-[#242424] pb-2 space-y-0.5">
                              <span className="text-[#889284] text-[10px] block">GPU</span>
                              <div className="flex items-center gap-1.5 font-bold text-[#F0EFE2] text-xs">
                                <NvidiaLogo size={13} />
                                <span>{chipCompute.split("-")[0] || "A100"}</span>
                              </div>
                            </div>

                            {/* Item 3: Runs on */}
                            <div className="border-b border-dashed border-[#242424] pb-2 space-y-0.5">
                              <span className="text-[#889284] text-[10px] block">Runs on</span>
                              <div className="flex items-center gap-1.5 font-bold text-[#F0EFE2] text-xs">
                                <Cloud size={13} className="text-[#889284]" />
                                <span>Managed cloud</span>
                              </div>
                            </div>

                            {/* Item 4: Format */}
                            <div className="space-y-0.5">
                              <span className="text-[#889284] text-[10px] block">Format</span>
                              <div className="flex items-center gap-1.5 font-bold text-[#F0EFE2] text-xs">
                                <Cloud size={13} className="text-[#889284]" />
                                <span>Managed endpoint</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[10px] text-[#788274] pt-2 border-t border-dashed border-[#242424] leading-relaxed">
                            Locked for this run. Start a new plan to change these choices.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mode Switcher Trigger matching User Reference Image 1 */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setModeDropdownOpen(!modeDropdownOpen);
                            setRunContextOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs",
                            dark
                              ? "border-[#383838] bg-[#202020] text-[#F0EFE2] hover:border-[#444]"
                              : "border-[#d8ddd3] bg-[#fafbfa] text-[#2a3028]"
                          )}
                        >
                          {selectedMode === "Experiment" ? (
                            <FlaskConical size={13} className="text-[#75bf00]" />
                          ) : (
                            <Gauge size={13} className="text-[#75bf00]" />
                          )}
                          <span className="font-medium">{selectedMode}</span>
                          {modeDropdownOpen ? (
                            <ChevronUp size={11} className="text-[#788274]" />
                          ) : (
                            <ChevronDown size={11} className="text-[#788274]" />
                          )}
                        </button>

                        {/* Mode Dropdown Popover matching User Reference Image 1 */}
                        {modeDropdownOpen && (
                          <div className={cn(
                            "absolute right-0 bottom-full mb-2 w-80 border shadow-2xl p-1.5 space-y-1 text-xs z-50 rounded-xs animate-in fade-in zoom-in-95 duration-100",
                            dark
                              ? "border-[#333] bg-[#181818] text-[#F0EFE2]"
                              : "border-[#c9cec4] bg-white text-[#171a17]"
                          )}>
                            {/* Optimize Option */}
                            <div
                              onClick={() => {
                                setSelectedMode("Optimize");
                                setModeDropdownOpen(false);
                              }}
                              className={cn(
                                "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-left",
                                selectedMode === "Optimize"
                                  ? dark ? "bg-[#282828]" : "bg-[#f0f4ee]"
                                  : dark ? "hover:bg-[#222222]" : "hover:bg-[#f8faf7]"
                              )}
                            >
                              <Gauge
                                size={16}
                                className={cn(
                                  "shrink-0 mt-0.5",
                                  selectedMode === "Optimize" ? "text-[#75bf00]" : dark ? "text-[#C8C7BA]" : "text-[#788274]"
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={cn("font-medium text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                                    Optimize
                                  </span>
                                  {selectedMode === "Optimize" && (
                                    <Check size={14} className="text-[#75bf00]" />
                                  )}
                                </div>
                                <p className={cn("text-[11px] mt-0.5 leading-relaxed", dark ? "text-[#C8C7BA]" : "text-[#666]")}>
                                  Full run: measure candidates and apply the winner.
                                </p>
                              </div>
                            </div>

                            {/* Experiment Option */}
                            <div
                              onClick={() => {
                                setSelectedMode("Experiment");
                                setModeDropdownOpen(false);
                              }}
                              className={cn(
                                "flex items-start gap-3 p-2.5 rounded-xs cursor-pointer transition-colors text-left",
                                selectedMode === "Experiment"
                                  ? dark ? "bg-[#282828]" : "bg-[#f0f4ee]"
                                  : dark ? "hover:bg-[#222222]" : "hover:bg-[#f8faf7]"
                              )}
                            >
                              <FlaskConical
                                size={16}
                                className={cn(
                                  "shrink-0 mt-0.5",
                                  selectedMode === "Experiment" ? "text-[#75bf00]" : dark ? "text-[#C8C7BA]" : "text-[#788274]"
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={cn("font-medium text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                                    Experiment
                                  </span>
                                  {selectedMode === "Experiment" && (
                                    <Check size={14} className="text-[#75bf00]" />
                                  )}
                                </div>
                                <p className={cn("text-[11px] mt-0.5 leading-relaxed", dark ? "text-[#C8C7BA]" : "text-[#666]")}>
                                  Exploratory run: measure candidates side by side.
                                  <br />
                                  No winner is applied.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (replyText.trim()) {
                            setReplyText("");
                          }
                        }}
                        className="flex h-7 w-7 items-center justify-center border border-[#383838] bg-[#282828] text-[#889284] hover:border-white hover:text-[#F0EFE2] transition-colors rounded-xs"
                        title="Send command"
                      >
                        <ArrowUp size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANE: Stage Canvas (Visible when not in focus_agent mode) */}
        {agentViewMode !== "focus_agent" && (
          <div className={cn(
            "flex-1 flex flex-col justify-between overflow-y-auto",
            dark ? "bg-[#151515]" : "bg-white"
          )}>
            {/* Subheader Banner */}
            <div className={cn(
              "border-b px-4 py-2.5 flex items-center justify-between text-xs font-mono shrink-0",
              dark ? "border-[#282828] bg-[#151515]" : "border-[#edf0eb] bg-[#fafbfa]"
            )}>
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold truncate">{objective}</span>
                <span className="border border-[#d8ddd3] dark:border-[#383838] bg-[#202020] px-1.5 py-0.2 text-[10px] text-[#656d60] rounded-xs">
                  {displayedRunStatus}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-sans text-xs">
                <span className="text-[#656d60]">Execution data: {measuredState}</span>
                <span>|</span>
                <span className="font-mono text-[#788274] font-bold truncate max-w-[180px]">{contextModel}</span>
              </div>
            </div>
            {/* TAB CONTENT 1: OPTIMIZATION (Exact RunInfra 6-Metric Grid & Waterfall) */}
            {activeTab === "optimization" && (
              <div className="p-6 space-y-5 flex-1">
                {/* Subheader status */}
                <div className="flex items-center justify-between border-b border-[#242424] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#788274]" />
                    <span className="text-[#C8C7BA]">Baseline</span>
                  </div>
                  <span className="text-[#C8C7BA]">vLLM</span>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F0EFE2]">
                    Optimization results
                  </h3>
                </div>

                {/* Technique progression box */}
                <div className={cn(
                  "border rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className={cn(
                    "border-b px-3.5 py-2 font-semibold text-xs flex items-center justify-between",
                    dark ? "border-[#282828] bg-[#282828]" : "border-[#edf0eb] bg-[#fafbfa]"
                  )}>
                    <span>Technique progression ⓘ</span>
                    <span className="text-[11px] font-mono text-[#788274]">pending</span>
                  </div>
                  <div className="p-10 text-center text-xs text-[#889083] font-mono min-h-[120px] flex items-center justify-center">
                    pending (fills in as the run benchmarks each phase)
                  </div>
                  {/* 6 Metric Grid matching exact RunInfra Screenshot with Dashed Axis Lines */}
                  <div className={cn(
                    "border rounded-xs overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-[#242424]",
                    dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
                  )}>
                    {[
                      { title: "Latency ⓘ", hint: "fills in when a run measures it" },
                      { title: "TTFT p50 ⓘ", hint: "fills in when a run measures it" },
                      { title: "TPOT p50 ⓘ", hint: "fills in when a run measures it" },
                      { title: "Throughput ⓘ", hint: "fills in when a run measures it" },
                      { title: "Cost per 1M tokens ⓘ", hint: "fills in when a run measures cost per 1M tokens" },
                      { title: "VRAM ⓘ", hint: "fills in when a run measures it" },
                    ].map((metric, idx) => (
                      <div
                        key={metric.title}
                        className={cn(
                          "flex flex-col justify-between p-0",
                          idx % 2 === 0 ? "md:border-r border-[#242424]" : "",
                          idx < 4 ? "md:border-b border-[#242424]" : ""
                        )}
                      >
                        {/* Metric Header Bar */}
                        <div className="px-4 py-2.5 border-b border-[#202020] bg-[#1a1a1a]/70">
                          <div className="text-xs font-semibold text-[#d0d4cd] flex items-center justify-between">
                            <span>{metric.title}</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#687063] mt-0.5">
                            pending
                          </div>
                        </div>

                        {/* Metric Chart Body with Dashed Lines */}
                        <div className="p-8 min-h-[140px] flex flex-col items-center justify-center relative">
                          {/* Top Dashed Line */}
                          <div className="w-[85%] border-t border-[#262626] border-dashed mb-auto" />

                          {/* Center Pending Message */}
                          <div className="text-center py-4 space-y-1">
                            <div className="text-xs font-mono text-[#687063]">pending</div>
                            <div className="text-[11px] text-[#525a4d] font-sans">
                              {metric.hint}
                            </div>
                          </div>

                          {/* Bottom Dashed Line */}
                          <div className="w-[85%] border-t border-[#262626] border-dashed mt-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PLAN (Exact RunInfra Suite from Screenshots 1-5) */}
            {activeTab === "plan" && (
              <div className="p-6 space-y-6 flex-1 max-w-[840px] text-xs font-sans">
                <div className="text-[11px] font-mono text-[#788274]">
                  Experiment type: Optimize
                </div>

                {/* Plan Header & Goal */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-[#F0EFE2] leading-snug">
                    Plan: Optimize meta-llama/Llama-3.1-8B-Instruct for cost, no numeric target set. Runs on managed cl...
                  </h2>
                  <div className="text-[#a0a89d] text-xs leading-relaxed">
                    <strong className="text-[#F0EFE2]">Goal.</strong> Optimize meta-llama/Llama-3.1-8B-Instruct for cost, no numeric target set. Runs on managed cloud by default;{" "}
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.5 rounded-xs inline-flex items-center gap-1 font-mono text-[11px] text-[#F0EFE2]">
                      <VLLMLogo size={10} />
                      <span>vLLM</span>
                      <ChevronDown size={10} className="text-[#C8C7BA]" />
                    </span>{" "}
                    is locked by user. GPU chosen by feasibility: 1x{" "}
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.5 rounded-xs inline-flex items-center gap-1 font-mono text-[11px] text-[#F0EFE2]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                      <span>A100 40GB</span>
                      <ChevronDown size={10} className="text-[#C8C7BA]" />
                    </span>{" "}
                    for the lowest modeled per-request cost and 19.5GB peak-VRAM fit.
                  </div>
                  <div className="text-xs text-[#a0a89d]">
                    <strong className="text-[#F0EFE2]">Expected runtime.</strong> ≈ 6 min (330s total).
                  </div>
                </div>

                {/* Section 1: Context */}
                <div className="space-y-2.5 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Context</h3>
                  <div className="space-y-2.5 font-mono text-xs text-[#d0d4cd] pl-3">
                    <div className="flex items-center gap-3">
                      <span className="w-32 text-[#788274] font-sans">Models:</span>
                      <span className="font-semibold text-[#F0EFE2]">meta-llama/Llama-3.1-8B-Instruct</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-32 text-[#788274] font-sans">Backend:</span>
                      <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.5 rounded-xs inline-flex items-center gap-1 text-[#F0EFE2]">
                        <VLLMLogo size={10} />
                        <span>vLLM</span>
                        <ChevronDown size={10} className="text-[#C8C7BA]" />
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-32 text-[#788274] font-sans shrink-0">Deployment:</span>
                      <div>
                        <span className="text-[#F0EFE2] font-sans">RunInfra cloud (gated)</span>
                        <p className="text-[11px] text-[#788274] font-sans mt-0.5">
                          Deployment is not part of this runbook; execution will stop at verified optimization artifacts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-32 text-[#788274] font-sans shrink-0">GPU:</span>
                      <div>
                        <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.5 rounded-xs inline-flex items-center gap-1 text-[#F0EFE2]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                          <span>A100 40GB</span>
                          <ChevronDown size={10} className="text-[#C8C7BA]" />
                        </span>
                        <span className="text-[#788274] font-sans ml-2 text-[11px]">(unverified plan choice)</span>
                        <div className="text-[11px] text-[#788274] font-sans mt-1.5 flex items-start gap-1">
                          <span className="border border-[#383838] bg-[#202020] px-1 py-0.2 rounded-xs text-[#F0EFE2] text-[10px] font-mono shrink-0">
                            A100 40GB ▾
                          </span>
                          <span>is a provisional plan choice. No matching session-scoped measured per-GPU rows or catalog estimator recommendation is available.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-32 text-[#788274] font-sans">Target:</span>
                      <span className="font-sans">Achievable at <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.5 rounded-xs font-mono text-[#F0EFE2] text-[10px]">FP16</span></span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-32 text-[#788274] font-sans">Cost (estimate):</span>
                      <span className="text-[#F0EFE2] font-sans">~$0.0029 / request <span className="text-[#788274] text-[11px]">(agent estimate, not validated)</span></span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Reasoning */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Reasoning</h3>
                  <p className="leading-relaxed text-[#a0a89d] text-xs">
                    The catalog reports 16GB <span className="border border-[#383838] bg-[#202020] px-1 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">FP16</span> weights, and the feasibility workload models 19.5GB peak VRAM. For 2,048 input and 256 output tokens, 1x{" "}
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                      <span>A100 40GB</span>
                      <ChevronDown size={9} />
                    </span>{" "}
                    has the lowest modeled request cost at $0.002866, versus $0.003884 on{" "}
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                      <span>A10G</span>
                      <ChevronDown size={9} />
                    </span>{" "}
                    and $0.003930 on 2x{" "}
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                      <span>T4</span>
                      <ChevronDown size={9} />
                    </span>
                    ; Phase 1 will measure real latency because no latency target was specified.
                  </p>
                </div>

                {/* Section 3: Tradeoffs */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Tradeoffs</h3>
                  <div className="space-y-2 text-[#a0a89d] text-xs">
                    <div className="flex items-start gap-2">
                      <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] shrink-0 inline-flex items-center gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                        <span>A100 40GB</span>
                        <ChevronDown size={9} />
                      </span>
                      <span>is the lowest modeled per-request cost for this workload, not necessarily the lowest hourly GPU price.</span>
                    </div>
                    <p>The 3,935 to 5,891ms modeled end-to-end range is advisory only and will be replaced by a measured baseline.</p>
                    <p>
                      Quantization, <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">Speculative Decoding</span>, KV compression, and kernel work are not included.
                    </p>
                  </div>
                </div>

                {/* Section 4: Rejected Alternatives */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Rejected Alternatives</h3>
                  <div className="space-y-2 text-[#a0a89d] text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                        <span>SGLang</span>
                        <ChevronDown size={9} />
                      </span>
                      <span>and</span>
                      <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                        <span>TensorRT-LLM</span>
                        <ChevronDown size={9} />
                      </span>
                      <span>are not compared because the user selected vLLM.</span>
                    </div>
                    <p>
                      Quantization, <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">Speculative Decoding</span>, KV compression, and custom kernels are excluded because they were not explicitly requested; the latter optimizer phases are also unavailable in the current trial budget.
                    </p>
                  </div>
                </div>

                {/* Section 5: Optimization Techniques */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Optimization Techniques</h3>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-[#a0a89d]">
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                      <VLLMLogo size={9} />
                      <span>vLLM</span>
                      <ChevronDown size={9} />
                    </span>
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">
                      Continuous Batching
                    </span>
                    <span>: Lossless</span>
                    <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                      <VLLMLogo size={9} />
                      <span>vLLM</span>
                      <ChevronDown size={9} />
                    </span>
                    <span>serving tuning is the requested-compatible optimization path after baseline measurement.</span>
                  </div>
                </div>

                {/* Section 6: Model Facts */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Model Facts</h3>
                  <div className="space-y-1.5 text-xs text-[#a0a89d] pl-3">
                    <div>
                      <strong className="text-[#F0EFE2]">meta-llama/Llama-3.1-8B-Instruct:</strong> meta-llama/Llama-3.1-8B-Instruct
                    </div>
                    <div className="pl-4 space-y-1">
                      <div>Modality: llm</div>
                      <div>Detected as llm from the model architecture, not an explicit modality. Correct it if wrong.</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>Notes: 16GB est; 8B;</span>
                        <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-1">
                          <span className="text-[#3b82f6]">♾️</span>
                          <span>Llama 3.1 8B</span>
                          <ChevronDown size={9} />
                        </span>
                        <span>;</span>
                        <span className="border border-[#383838] bg-[#202020] px-1 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">FP16</span>
                        <span>; access: unknown</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 7: Execution Plan */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Execution Plan</h3>
                  <p className="text-xs text-[#a0a89d]">
                    Diagnosis is complete. The phases below will run in this order once you accept the plan.
                  </p>

                  <div className="space-y-4 pl-3">
                    {/* Phase 1 */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-[#F0EFE2]">1. Hardware selection</h4>
                      <div className="pl-4 space-y-0.5 text-xs text-[#a0a89d]">
                        <div><strong className="text-[#F0EFE2]">Engine:</strong> Hardware Engine</div>
                        <div><strong className="text-[#F0EFE2]">Strategy:</strong> GPU compatibility sweep</div>
                        <div><strong className="text-[#F0EFE2]">Why:</strong> Estimate VRAM, latency, and request cost across compatible GPUs before any paid run.</div>
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-[#F0EFE2]">2. Baseline profile</h4>
                      <div className="pl-4 space-y-0.5 text-xs text-[#a0a89d]">
                        <div><strong className="text-[#F0EFE2]">Engine:</strong> Profiler</div>
                        <div><strong className="text-[#F0EFE2]">Strategy:</strong> Measured baseline profile</div>
                        <div className="flex items-center gap-1">
                          <strong className="text-[#F0EFE2]">Why:</strong> Run the <span className="border border-[#383838] bg-[#202020] px-1 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">FP16</span> baseline on the selected GPU and record latency, throughput, and VRAM.
                        </div>
                      </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-[#F0EFE2]">3. Apply Serving config tuning</h4>
                      <div className="pl-4 space-y-0.5 text-xs text-[#a0a89d]">
                        <div><strong className="text-[#F0EFE2]">Engine:</strong> Serving Engine</div>
                        <div className="flex items-center gap-1">
                          <strong className="text-[#F0EFE2]">Strategy:</strong>
                          <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                            <VLLMLogo size={9} />
                            <span>vLLM</span>
                            <ChevronDown size={9} />
                          </span>
                          <span>serving candidate sweep</span>
                        </div>
                        <div><strong className="text-[#F0EFE2]">Why:</strong> Benchmark a small set of serving configs and keep the one that improves tail latency or throughput.</div>
                      </div>
                    </div>

                    {/* Phase 4 */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-[#F0EFE2]">4. Benchmark Serving config tuning</h4>
                      <div className="pl-4 space-y-0.5 text-xs text-[#a0a89d]">
                        <div><strong className="text-[#F0EFE2]">Engine:</strong> Serving Engine</div>
                        <div className="flex items-center gap-1">
                          <strong className="text-[#F0EFE2]">Strategy:</strong>
                          <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2] inline-flex items-center gap-0.5">
                            <VLLMLogo size={9} />
                            <span>vLLM</span>
                            <ChevronDown size={9} />
                          </span>
                          <span>serving candidate sweep</span>
                        </div>
                        <div><strong className="text-[#F0EFE2]">Why:</strong> Benchmark a small set of serving configs and keep the one that improves tail latency or throughput.</div>
                      </div>
                    </div>

                    {/* Phase 5 */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-[#F0EFE2]">5. Compare baseline vs optimized</h4>
                      <div className="pl-4 space-y-0.5 text-xs text-[#a0a89d]">
                        <div><strong className="text-[#F0EFE2]">Engine:</strong> Comparison</div>
                        <div><strong className="text-[#F0EFE2]">Strategy:</strong> Baseline-vs-optimized verdict (recorded, 0 GPU)</div>
                        <div><strong className="text-[#F0EFE2]">Why:</strong> Rank the measured pre-optimization baseline against the optimized version this run produced, side by side (0 GPU; reads results the optimization phases already recorded).</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 8: Files / Artifacts */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Files / Artifacts</h3>
                  <div className="space-y-1.5 text-xs text-[#a0a89d] pl-3">
                    <div><strong className="text-[#F0EFE2]">Pipeline tab graph:</strong> Update nodes, backend, GPU, and optimization metadata.</div>
                    <div><strong className="text-[#F0EFE2]">Optimization ledger:</strong> Record baseline, skipped, failed, and winning experiments.</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="text-[#F0EFE2]">Code tab files:</strong> Regenerate
                      <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">serve.sh</span>,
                      <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">Dockerfile</span>, and
                      <span className="border border-[#383838] bg-[#202020] px-1.5 py-0.2 rounded-xs font-mono text-[10px] text-[#F0EFE2]">compose</span> from accepted results.
                    </div>
                  </div>
                </div>

                {/* Section 9: Caveats */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-xs text-[#F0EFE2]">Caveats</h3>
                  <div className="space-y-1 text-xs text-[#a0a89d] pl-3">
                    <p>This is the execution plan, not completed benchmark evidence yet.</p>
                    <p>The GPU choice is unverified and the cost figure is an agent estimate.</p>
                    <p>Model access may require credentials or license approval: meta-llama/Llama-3.1-8B-Instruct.</p>
                    <p>Kernel Agent was not added: kernel generation is in re-validation and is temporarily excluded from optimization runs. Serving phase covers this plan's optimization goals.</p>
                    <p className="pt-2 text-[#788274]">Start writing your plan, or ask the agent in chat to draft one for you.</p>
                  </div>
                </div>

                {/* Bottom Action Bar matching exact Screenshots */}
                <div className="flex items-center justify-between border-t border-[#282828] pt-4 text-xs font-mono sticky bottom-0 bg-[#151515] py-2">
                  <span className="text-[#a0a89d]">Est. $18.50, hold $37.00</span>
                  <div className="flex items-center gap-2">
                    <HorosButton variant="outline" size="sm" onClick={() => setActiveTab("optimization")}>
                      Cancel
                    </HorosButton>
                    <HorosButton variant="outline" size="sm">
                      Reduce plan cost
                    </HorosButton>
                    <HorosButton variant="outline" size="sm">
                      Refresh balance
                    </HorosButton>
                    <HorosButton variant="action" size="sm" onClick={() => void acceptAndRun()} disabled={runSubmitting}>
                      {runSubmitting ? "Submitting..." : "Add funds"}
                    </HorosButton>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: EXPERIMENT / COMPARISON LAB (Populated Section 35-38 Matrix) */}
            {activeTab === "experiment" && (
              <div className="p-6 space-y-5 flex-1 max-w-[1100px] font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between border-b border-[#282828] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#75bf00]" />
                    <span className="text-[#F0EFE2] font-bold font-sans text-sm">Comparison Lab</span>
                    <span className="border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00] px-2 py-0.5 text-[10px] rounded-xs font-bold">
                      ● 4 Candidates Evaluated
                    </span>
                  </div>
                  <span className="text-[#C8C7BA] text-[11px]">
                    Measured in Ephorosl MicroVM Sandboxes (EIG Score: 9.2/10)
                  </span>
                </div>

                {/* Candidate Comparison Matrix Table (Section 38) */}
                <div className="space-y-2">
                  <div className="text-[10px] text-[#777] uppercase tracking-wider font-mono">
                    VALIDATED CANDIDATE COMPARISON MATRIX (SECTION 38)
                  </div>
                  <div className="border border-dashed border-[#262626] bg-[#141414] rounded-xs overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-dashed border-[#282828] text-[10px] text-[#666] bg-[#181818]">
                          <th className="p-2.5">CANDIDATE & RUNTIME</th>
                          <th className="p-2.5">HARDWARE</th>
                          <th className="p-2.5">TTFT (MS)</th>
                          <th className="p-2.5">P95 (MS)</th>
                          <th className="p-2.5">THROUGHPUT</th>
                          <th className="p-2.5">VRAM</th>
                          <th className="p-2.5">COST / 1M</th>
                          <th className="p-2.5">QUALITY</th>
                          <th className="p-2.5 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashed divide-[#222]">
                        <tr className="bg-[#75bf00]/5 hover:bg-[#75bf00]/10 transition-colors border-l-2 border-l-[#75bf00]">
                          <td className="p-2.5">
                            <div className="font-bold text-[#F0EFE2] font-sans flex items-center gap-1.5">
                              <QwenLogo size={14} />
                              <span>Qwen 2.5 32B</span>
                              <span className="text-[10px] font-mono text-[#777] flex items-center gap-1">
                                (<SGLangLogo size={12} /> SGLang FP8)
                              </span>
                            </div>
                            <div className="text-[9px] text-[#75bf00] font-mono mt-0.5">● OPTIMAL CHOICE (WINNER)</div>
                          </td>
                          <td className="p-2.5 text-[#C8C7BA]">
                            <div className="flex items-center gap-1.5">
                              <NvidiaLogo size={12} />
                              <span>1x A100-40GB</span>
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-[#75bf00]">28.4ms</td>
                          <td className="p-2.5 font-bold text-[#75bf00]">34.1ms</td>
                          <td className="p-2.5 text-[#F0EFE2]">310 t/s</td>
                          <td className="p-2.5 text-[#777]">13.2 GB</td>
                          <td className="p-2.5 font-bold text-[#F0EFE2]">$0.10</td>
                          <td className="p-2.5 font-bold text-[#75bf00]">99.1%</td>
                          <td className="p-2.5 text-right">
                            <span className="text-[#75bf00] font-bold text-[10px]">SELECTED</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#181818] transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-[#F0EFE2] font-sans flex items-center gap-1.5">
                              <MetaLogo size={14} />
                              <span>Llama 3.1 8B</span>
                              <span className="text-[10px] font-mono text-[#777] flex items-center gap-1">
                                (<VLLMLogo size={12} /> vLLM AWQ)
                              </span>
                            </div>
                            <div className="text-[9px] text-[#777] font-mono">Candidate #2</div>
                          </td>
                          <td className="p-2.5 text-[#777]">
                            <div className="flex items-center gap-1.5">
                              <NvidiaLogo size={12} />
                              <span>1x A100-40GB</span>
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-[#75bf00]">38.2ms</td>
                          <td className="p-2.5 font-bold text-[#75bf00]">38.2ms</td>
                          <td className="p-2.5 text-[#C8C7BA]">245 t/s</td>
                          <td className="p-2.5 text-[#777]">14.8 GB</td>
                          <td className="p-2.5 text-[#F0EFE2]">$0.12</td>
                          <td className="p-2.5 text-[#75bf00]">99.4%</td>
                          <td className="p-2.5 text-right">
                            <span className="text-[#777] text-[10px]">VERIFIED</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#181818] transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-[#F0EFE2] font-sans flex items-center gap-1.5">
                              <MetaLogo size={14} />
                              <span>Llama 3.1 70B</span>
                              <span className="text-[10px] font-mono text-[#777] flex items-center gap-1">
                                (<NvidiaLogo size={12} /> TRT-LLM INT4)
                              </span>
                            </div>
                            <div className="text-[9px] text-[#777] font-mono">Candidate #3</div>
                          </td>
                          <td className="p-2.5 text-[#777]">
                            <div className="flex items-center gap-1.5">
                              <NvidiaLogo size={12} />
                              <span>2x H100-80GB</span>
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-[#F0EFE2]">62.4ms</td>
                          <td className="p-2.5 font-bold text-[#F0EFE2]">78.5ms</td>
                          <td className="p-2.5 text-[#C8C7BA]">142 t/s</td>
                          <td className="p-2.5 text-[#777]">48.5 GB</td>
                          <td className="p-2.5 text-[#F0EFE2]">$0.85</td>
                          <td className="p-2.5 text-[#75bf00]">99.8%</td>
                          <td className="p-2.5 text-right">
                            <span className="text-[#777] text-[10px]">VERIFIED</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Measured Results & Sandbox Execution Panel (Section 37) */}
                <div className="p-4 border border-dashed border-[#262626] bg-[#141414] rounded-xs space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-dashed border-[#222] pb-2">
                    <span className="font-bold text-[#F0EFE2]">Sandbox MicroVM Container (#sbx-env-isolated-vllm-01)</span>
                    <span className="text-[10px] text-[#75bf00]">● Isolated Execution Verified</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] text-[#777]">
                    <div>CPU: <span className="text-[#F0EFE2]">8 cores</span></div>
                    <div>Memory: <span className="text-[#F0EFE2]">32 GB</span></div>
                    <div>GPU: <span className="text-[#75bf00]">1x A100 VFIO</span></div>
                    <div>Timeout: <span className="text-[#F0EFE2]">300s</span></div>
                  </div>

                  <pre className="p-2.5 bg-[#0d0d0d] border border-dashed border-[#282828] text-[10px] text-[#75bf00] rounded-xs leading-relaxed overflow-x-auto">
                    [HOROS Sandbox] Attached 1x A100 device via secure VFIO passthrough.
                    [vLLM Engine] Initializing engine with model Qwen2.5-32B (commit 8f4ca7b)...
                    [HOROS Benchmark] Synthetic load sweep: 100 req/s, 250 req/s, 500 req/s completed with 0 errors.
                    [HOROS Sandbox] Destroying ephorosl sandbox instance. SHA-256: sha256:8f4ca7b9e112d308fbc8a23d84f18e9
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: TEST (Exact Screenshot 1 in Batch 2) */}
            {activeTab === "test" && (
              <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xs border",
                  dark ? "border-[#2e2e2e] bg-[#202020] text-[#889284]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#687063]"
                )}>
                  <FlaskConical size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F0EFE2]">
                    This model is not ready for Current preview.
                  </h3>
                  <p className="text-xs text-[#788274] mt-1.5 max-w-sm leading-relaxed">
                    Optimized preview is waiting for the plan execution trace. Refresh after optimization completes, then retry.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    className="border border-[#383838] bg-[#1a201a] px-3.5 py-1.5 text-xs text-[#d0d4cd] rounded hover:border-white hover:text-[#F0EFE2] transition-colors"
                  >
                    Test Baseline instead
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenTab("plan")}
                    className="border border-[#383838] bg-[#1a201a] px-3.5 py-1.5 text-xs text-[#d0d4cd] rounded hover:border-white hover:text-[#F0EFE2] transition-colors"
                  >
                    Open the plan
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: CODE (Exact Screenshot 2 in Batch 2) */}
            {activeTab === "code" && (
              <div className="p-6 space-y-5 flex-1">
                <div className="flex items-center justify-between border-b border-[#242424] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#C8C7BA]">
                    <Layers size={13} />
                    <span>Models</span>
                    <span className="text-[#F0EFE2] font-semibold">Llama 3.1 8B Instruct</span>
                  </div>
                  <span className="text-[#C8C7BA]">vLLM</span>
                </div>

                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xs border text-[#889284]",
                    dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-[#fafbfa]"
                  )}>
                    <Code size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F0EFE2]">No code yet</h3>
                    <p className="text-xs text-[#788274] mt-1 max-w-sm leading-relaxed">
                      Generated serve scripts, deployment configs, and pipeline definitions appear here as the agent builds your pipeline.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: CONFIG / SESSION INTAKE (Exact Screenshot 3 in Batch 2) */}
            {activeTab === "config" && (
              <div className="p-6 space-y-5 flex-1 max-w-[800px] text-xs">
                <div className="flex items-center justify-between border-b border-[#242424] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#C8C7BA]">
                    <Layers size={13} />
                    <span>Models</span>
                    <span className="text-[#F0EFE2] font-semibold">Llama 3.1 8B Instruct</span>
                  </div>
                  <span className="text-[#C8C7BA]">vLLM</span>
                </div>

                {/* Top Card: Model Configuration */}
                <div className={cn(
                  "border rounded-xs p-4 space-y-1.5",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="text-[10px] uppercase font-mono text-[#788274]">Config</div>
                  <h4 className="font-semibold text-xs text-[#F0EFE2]">Model configuration</h4>
                  <p className="text-[11px] text-[#788274]">Configuration unlocks when a plan is accepted.</p>
                </div>

                {/* Bottom Card: Session Intake */}
                <div className={cn(
                  "border rounded-xs divide-y divide-[#282828]",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#F0EFE2]">Session intake</span>
                    <span className="border border-[#383838] bg-[#181818] px-1.5 py-0.2 text-[10px] text-[#C8C7BA] font-mono rounded-xs">
                      Read-only
                    </span>
                  </div>

                  <div className="p-4 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#C8C7BA]">Model</span>
                      <span className="text-[#F0EFE2] font-semibold">meta-llama/Llama-3.1-8B-Instruct</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#C8C7BA]">Engine</span>
                      <span className="text-[#F0EFE2]">vLLM</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#C8C7BA]">Planned GPU</span>
                      <span className="text-[#F0EFE2]">A100-40GB</span>
                    </div>
                  </div>

                  <div className="p-4 text-[11px] text-[#788274] font-sans">
                    Inference settings (system prompt, temperature, output format) unlock here when a plan is accepted.
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 7: PIPELINE / WORKSPACE (Exact Screenshot 3 in Batch 1) */}
            {(activeTab === "pipeline" || activeTab === "workspace") && (
              <div className="flex-1 flex flex-col justify-between p-4 relative min-h-[460px]">
                {/* Top Toolbar */}
                <div className="flex items-center gap-1.5 border border-[#2e2e2e] bg-[#202020] p-1 rounded-xs w-fit text-xs font-mono text-[#788274]">
                  <button type="button" className="p-1 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs" title="Undo"><Undo size={13} /></button>
                  <button type="button" className="p-1 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs" title="Redo"><Redo size={13} /></button>
                  <div className="h-3 w-px bg-[#2e2e2e] mx-1" />
                  <button type="button" className="p-1 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs" title="Auto Layout"><Grid size={13} /></button>
                  <button type="button" className="p-1 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs" title="Import"><Download size={13} /></button>
                  <button type="button" className="p-1 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs" title="Export"><Upload size={13} /></button>
                </div>

                {/* Center Canvas Box */}
                <div className="flex-1 flex items-center justify-center py-16">
                  <div className={cn(
                    "border rounded-xs p-6 max-w-sm w-full text-center space-y-2",
                    dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                  )}>
                    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#788274] font-bold">
                      BUILD YOUR PIPELINE
                    </div>
                    <div className="text-xs text-[#a0a89d]">
                      Describe your pipeline in chat to get started.
                    </div>
                  </div>
                </div>

                {/* Bottom Left Zoom Controls */}
                <div className="flex items-center gap-1 border border-[#2e2e2e] bg-[#202020] p-1 rounded-xs w-fit text-xs font-mono text-[#788274]">
                  <button type="button" className="px-1.5 py-0.5 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs"><Minus size={11} /></button>
                  <span className="px-2 text-[11px] font-mono text-[#a0a89d]">100%</span>
                  <button type="button" className="px-1.5 py-0.5 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs"><Plus size={11} /></button>
                  <div className="h-3 w-px bg-[#2e2e2e] mx-1" />
                  <button type="button" className="p-1 hover:text-[#F0EFE2] hover:bg-[#282828] rounded-xs" title="Fit to Screen"><Maximize2 size={12} /></button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 8: BENCHMARKS (Clean Subtle Minimalist Dark Layout matching Screenshot) */}
            {activeTab === "benchmarks" && (
              <div className="p-6 space-y-5 flex-1 max-w-[900px] text-xs">
                {/* Top Card: Model not recorded */}
                <div className={cn(
                  "border p-4 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="text-[10px] font-mono text-[#788274] uppercase tracking-wider">Benchmarks</div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-sm font-bold text-[#F0EFE2]">Model not recorded</h2>
                    <span className="text-xs text-[#6e756a] font-mono">no winner</span>
                  </div>
                </div>

                {/* Main Card */}
                <div className={cn(
                  "border p-6 rounded-xs space-y-4",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="flex items-center justify-between text-xs border-b border-[#282828] pb-3">
                    <span className="text-[#a0a89d]">Optimize a winner before measuring standard benchmark quality.</span>
                    <button
                      type="button"
                      onClick={() => handleOpenTab("optimization")}
                      className="text-[#788274] hover:text-[#F0EFE2] font-mono transition-colors cursor-pointer"
                    >
                      Optimization
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Quality Scores Box with Dashed Axis Lines */}
                    <div className={cn(
                      "border p-8 rounded-xs text-center space-y-1 min-h-[160px] flex flex-col justify-between relative",
                      dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-[#fafbfa]"
                    )}>
                      <div className="w-[85%] border-t border-[#262626] border-dashed mx-auto" />
                      <div className="space-y-1 py-4">
                        <div className="text-xs font-semibold text-[#889284]">quality scores</div>
                        <div className="text-[11px] text-[#555d51]">Fills in after an optimized winner is promoted.</div>
                      </div>
                      <div className="w-[85%] border-t border-[#262626] border-dashed mx-auto" />
                    </div>

                    {/* Suite Breakdown Box with Dashed Axis Lines */}
                    <div className={cn(
                      "border p-8 rounded-xs text-center space-y-1 min-h-[160px] flex flex-col justify-between relative",
                      dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-[#fafbfa]"
                    )}>
                      <div className="w-[85%] border-t border-[#262626] border-dashed mx-auto" />
                      <div className="space-y-1 py-4">
                        <div className="text-xs font-semibold text-[#889284]">suite breakdown</div>
                        <div className="text-[11px] text-[#555d51]">Fills in as the suite measures each benchmark.</div>
                      </div>
                      <div className="w-[85%] border-t border-[#262626] border-dashed mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 9: EVIDENCE & PROOF (Clean Minimalist Dark Theme) */}
            {activeTab === "evidence" && (
              <div className="p-6 space-y-5 flex-1 max-w-[800px] text-xs font-sans">
                <div className="flex items-center justify-between border-b border-[#282828] pb-3">
                  <div>
                    <h2 className="text-xs font-bold text-[#F0EFE2] uppercase tracking-wider">
                      Cryptographic Proof Package
                    </h2>
                    <p className="text-[11px] text-[#788274] font-mono mt-0.5">
                      Immutable evidence ledger compiled for independent verification
                    </p>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#383838] bg-[#1a1a1a] text-[#a0a89d] rounded-xs font-semibold">
                    VERDICT: VERIFIED
                  </span>
                </div>

                <div className={cn(
                  "border p-4 rounded-xs space-y-3 font-mono text-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="space-y-1.5 border-b border-[#282828] pb-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#C8C7BA]">Proof SHA-256:</span>
                      <span className="text-[#F0EFE2] font-semibold truncate max-w-xs">sha256:7f8a9e14c09d51b3a88f7236e788c3a1e4b9d029f</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#C8C7BA]">Independent Verifier:</span>
                      <span className="text-[#F0EFE2]">HOROS Verifier v2.4</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 border border-[#282828] bg-[#181818] rounded-xs space-y-1">
                      <div className="font-semibold text-[#F0EFE2] text-[11px]">SLO #1: Cost Reduction</div>
                      <div className="text-[11px] text-[#F0EFE2] font-bold">Passed (-34.2%)</div>
                      <div className="text-[10px] text-[#788274]">Baseline: $182K → Verified: $120.4K</div>
                    </div>

                    <div className="p-3 border border-[#282828] bg-[#181818] rounded-xs space-y-1">
                      <div className="font-semibold text-[#F0EFE2] text-[11px]">SLO #2: P99 Latency</div>
                      <div className="text-[11px] text-[#F0EFE2] font-bold">Passed (184ms)</div>
                      <div className="text-[10px] text-[#788274]">Peak concurrency: 128 streams</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 10: DEPLOY (Exact RunInfra Screenshot 1) */}
            {activeTab === "deploy" && (
              <div className="p-6 space-y-4 flex-1 max-w-[800px] text-xs">
                {/* Top Dashed Box: Deployment unlocks at $50 in lifetime credits */}
                <div className={cn(
                  "border border-dashed rounded-xs p-4 flex items-center justify-between gap-4",
                  dark ? "border-[#333] bg-[#181818]" : "border-[#ccc] bg-[#fafbfa]"
                )}>
                  <div className="flex items-center gap-3.5">
                    <div className="border border-[#2f3d20] bg-[#182613] text-[#86dc00] p-2 rounded-xs shrink-0 flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#F0EFE2]">Deployment unlocks at $50 in lifetime credits</h4>
                      <p className="text-[11px] text-[#788274] mt-0.5">
                        Add funds to unlock it. Your balance then pays for the traffic you serve.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="border border-[#384820] bg-[#1c2a12] hover:bg-[#253818] text-[#86dc00] px-3.5 py-1.5 text-xs font-mono rounded-xs font-semibold cursor-pointer transition-colors shrink-0"
                  >
                    Add funds
                  </button>
                </div>

                {/* Bottom Box: No model to deploy yet */}
                <div className={cn(
                  "border rounded-xs p-4 space-y-1.5",
                  dark ? "border-[#282828] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <h4 className="font-semibold text-xs text-[#F0EFE2]">No model to deploy yet</h4>
                  <p className="text-[11px] text-[#788274]">
                    Add a model in the Pipeline tab. After an optimization run, deploy options appear here.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Streaming Terminal Drawer */}
            <div className={cn(
              "border-t shrink-0",
              dark ? "border-[#282828] bg-[#151515]" : "border-[#d8ddd3] bg-[#fafbfa]"
            )}>
              <button
                type="button"
                onClick={() => setTerminalOpen(!terminalOpen)}
                className="flex w-full items-center justify-between px-4 py-2 text-xs font-mono text-[#788274] hover:text-[#F0EFE2]"
              >
                <div className="flex items-center gap-2">
                  <Terminal size={12} />
                  <span>Terminal</span>
                  <span className="bg-[#282828] border border-[#383838] px-1.5 py-0.2 text-[10px] text-[#F0EFE2] rounded-xs">1</span>
                </div>
                <ChevronRight
                  size={12}
                  className={cn("transition-transform", terminalOpen && "rotate-90")}
                />
              </button>

              {terminalOpen && (
                <div className="border-t border-[#edf0eb] dark:border-[#242b23] p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#788274]">Log Stream:</span>
                    {["All", "Info", "Warn", "Error"].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setLogFilter(filter)}
                        className={cn(
                          "px-2 py-0.5 text-[11px]",
                          logFilter === filter
                            ? "bg-[#75bf00] text-[#111] font-bold"
                            : "text-[#788274] hover:text-[#F0EFE2]"
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1 font-mono text-[11px] max-h-40 overflow-y-auto">
                    {logs.map((l, i) => (
                      <div key={i} className="flex items-start gap-2 hover:bg-[#f8faf6] dark:hover:bg-[#181d18] p-0.5">
                        <span className="text-[#889083] select-none">{l.time}</span>
                        <span className="text-[#2563eb] select-none">{l.delta}</span>
                        <span className="font-bold text-[#16a34a]">{l.level}</span>
                        <span className="text-[#788274]">[{l.cat}]</span>
                        <span>{l.msg}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#edf0eb] dark:border-[#222] pt-2 text-[10px] font-mono text-[#788274]">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                      <span>Connected</span>
                    </span>
                    <span>13 / 53</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Views Modal Overlay matching Images 1 & 2 */}
      {searchViewsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSearchViewsModalOpen(false)}
        >
          <div
            className={cn(
              "w-full max-w-[620px] rounded-xs border p-4 shadow-2xl space-y-4 text-xs font-sans",
              dark ? "border-[#383838] bg-[#202020] text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#171a17]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input with lime green border */}
            <div className={cn(
              "border px-3.5 py-2.5 rounded-xs flex items-center justify-between transition-colors",
              dark ? "border-[#75bf00] bg-[#151515]" : "border-[#75bf00] bg-[#fafbfa]"
            )}>
              <div className="flex items-center gap-2.5 flex-1">
                <Search size={14} className="text-[#788274]" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search views"
                  className="bg-transparent text-xs text-[#F0EFE2] placeholder:text-[#666] outline-none w-full font-mono"
                />
              </div>
              <kbd className="border border-[#383838] bg-[#202020] px-1.5 py-0.5 font-mono text-[10px] text-[#788274] rounded-xs">
                esc
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {/* Section 1: Jump to existing tab */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#788274] uppercase tracking-wider block">
                  Jump to existing tab
                </span>

                <div className="space-y-1">
                  {openTabs.map((tab) => {
                    const isCurrent = activeTab === tab;
                    return (
                      <div
                        key={tab}
                        onClick={() => handleOpenTab(tab)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xs border cursor-pointer transition-colors",
                          isCurrent
                            ? dark
                              ? "border-[#75bf00] bg-[#1a2216]"
                              : "border-[#75bf00] bg-[#f0fbe6]"
                            : dark
                              ? "border-transparent hover:bg-[#282828]"
                              : "border-transparent hover:bg-[#f8faf6]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-xs border text-xs",
                            dark ? "border-[#383838] bg-[#151515] text-[#75bf00]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#2d5800]"
                          )}>
                            {tab === "optimization" && <Zap size={13} />}
                            {tab === "benchmarks" && <FlaskConical size={13} />}
                            {tab === "pipeline" && <GitBranch size={13} />}
                            {tab === "test" && <Play size={13} />}
                            {tab === "deploy" && <Rocket size={13} />}
                            {tab === "plan" && <FileText size={13} />}
                          </div>
                          <div>
                            <div className="font-semibold text-xs capitalize">{tab}</div>
                            <div className="text-[11px] text-[#788274]">
                              {tab === "optimization" && "Add a model before running optimization."}
                              {tab === "benchmarks" && "Optimize a winner before running benchmarks."}
                              {tab === "pipeline" && "Add a Hugging Face model to start a dynamic session."}
                              {tab === "test" && "Add a model before testing."}
                              {tab === "deploy" && "Add a model before deploying."}
                              {tab === "plan" && "A plan is linked to this session."}
                            </div>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="font-mono text-[11px] text-[#788274]">Current</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Suggested */}
              <div className="space-y-1.5 border-t border-[#2e2e2e] pt-3">
                <span className="text-[11px] font-mono text-[#788274] uppercase tracking-wider block">
                  Suggested
                </span>

                <div
                  onClick={() => handleOpenTab("pipeline")}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xs border border-transparent cursor-pointer transition-colors",
                    dark ? "hover:bg-[#282828]" : "hover:bg-[#f8faf6]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-xs border text-xs",
                      dark ? "border-[#383838] bg-[#151515] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                    )}>
                      <GitBranch size={13} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Pipeline</div>
                      <div className="text-[11px] text-[#788274]">
                        Add a Hugging Face model to start a dynamic session.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: More views */}
              <div className="space-y-1.5 border-t border-[#2e2e2e] pt-3">
                <span className="text-[11px] font-mono text-[#788274] uppercase tracking-wider block">
                  More views
                </span>

                <div className="space-y-1">
                  {[
                    { id: "experiment" as ActiveWorkspaceTab, name: "Experiment", icon: <Shuffle size={13} />, desc: "No valid comparison matrix is loaded for this session." },
                    { id: "benchmarks" as ActiveWorkspaceTab, name: "Benchmarks", icon: <FlaskConical size={13} />, desc: "Optimize a winner before running benchmarks." },
                    { id: "plan" as ActiveWorkspaceTab, name: "Plan", icon: <FileText size={13} />, desc: "A plan is linked to this session." },
                    { id: "workspace" as ActiveWorkspaceTab, name: "Workspace", icon: <Columns size={13} />, desc: "Add a model before using the split workspace." },
                    { id: "code" as ActiveWorkspaceTab, name: "Code", icon: <Code size={13} />, desc: "Add a model before generating runtime code." },
                    { id: "config" as ActiveWorkspaceTab, name: "Config", icon: <Sliders size={13} />, desc: "Session settings apply to the current pipeline." },
                  ].map((v) => (
                    <div
                      key={v.id}
                      onClick={() => handleOpenTab(v.id)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xs border border-transparent cursor-pointer transition-colors",
                        dark ? "hover:bg-[#282828]" : "hover:bg-[#f8faf6]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-xs border text-xs",
                          dark ? "border-[#383838] bg-[#151515] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                        )}>
                          {v.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-xs">{v.name}</div>
                          <div className="text-[11px] text-[#788274]">{v.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Actions */}
              <div className="space-y-1.5 border-t border-[#2e2e2e] pt-3">
                <span className="text-[11px] font-mono text-[#788274] uppercase tracking-wider block">
                  Actions
                </span>

                <div
                  onClick={() => setCompletionChimeMuted(!completionChimeMuted)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xs border cursor-pointer transition-colors",
                    dark ? "border-[#2e2e2e] bg-[#202020] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white hover:border-[#75bf00]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-xs border text-xs",
                      dark ? "border-[#383838] bg-[#151515] text-[#75bf00]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#2d5800]"
                    )}>
                      {completionChimeMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs">
                        {completionChimeMuted ? "Unmute completion chime" : "Mute completion chime"}
                      </div>
                      <div className="text-[11px] text-[#788274] line-clamp-1">
                        Soft chime when a plan is ready, a run finishes, or a deploy goes live while this tab...
                      </div>
                    </div>
                  </div>
                  <kbd className="border border-[#383838] bg-[#151515] px-1.5 py-0.5 font-mono text-[10px] text-[#788274] rounded-xs">
                    ↵
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Export Stack / Download Kit & Replay Runner */}
      <ExportKitModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        dark={dark}
      />

      <ReplayModal
        open={replayModalOpen}
        onClose={() => setReplayModalOpen(false)}
        dark={dark}
      />
    </div>
  );
}

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
  ExternalLink,
  ChevronRight,
  Terminal,
  Clock,
  ShieldAlert,
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
} from "lucide-react";
import { MetaLogo, VLLMLogo } from "../primitives/brand-icons";
import { EpochBadge } from "../ui/epoch-badge";
import { EpochButton } from "../ui/epoch-button";
import { cn } from "@/lib/utils";
import { EpochIcon } from "@/components/epoch/primitives/epoch-logo";

interface PipelineWorkspaceViewProps {
  pipelineTitle?: string;
  initialPrompt?: string;
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
  | "pipeline"
  | "test"
  | "deploy"
  | "plan"
  | "experiment"
  | "workspace"
  | "code"
  | "config";

type AgentViewMode = "split" | "hide_agent" | "focus_agent";

export function PipelineWorkspaceView({
  pipelineTitle = "Untitled Pipeline",
  initialPrompt = "Describe the objective, model constraints, and evaluation criteria for this pipeline.",
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
    "test",
  ]);
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>("optimization");
  const [searchViewsModalOpen, setSearchViewsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [completionChimeMuted, setCompletionChimeMuted] = useState(false);

  const [currentTitle, setCurrentTitle] = useState(pipelineTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [agentViewMode, setAgentViewMode] = useState<AgentViewMode>("split");

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
            className="flex items-center justify-center p-1 text-white hover:opacity-80 transition-opacity"
            title="Back to pipelines"
          >
            <EpochIcon className="w-5 h-4 text-white" />
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
                    alert("Opening Epoch support channel...");
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
            "flex items-center gap-1 border p-0.5 font-medium text-xs overflow-x-auto max-w-[50vw]",
            dark ? "border-[#333] bg-[#1a1f1a]" : "border-[#d8ddd3] bg-[#f5f7f3]"
          )}>
            {openTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 transition-all group shrink-0",
                    isActive
                      ? dark
                        ? "bg-[#111] text-white shadow-sm font-semibold border border-[#333]"
                        : "bg-white text-[#171a17] shadow-sm font-semibold border border-[#d8ddd3]"
                      : "text-[#687063] hover:text-[#171a17] dark:hover:text-white"
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
                      className="text-[#888] text-[10px] hover:text-white ml-0.5 opacity-60 group-hover:opacity-100"
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
                dark ? "border-[#75bf00] bg-[#141d14] text-white" : "border-[#75bf00] bg-[#f0fbe6] text-[#171a17]"
              )}>
                <span>New tab</span>
                <span
                  onClick={() => setSearchViewsModalOpen(false)}
                  className="text-[#888] text-[10px] hover:text-white cursor-pointer ml-1"
                >
                  ×
                </span>
              </div>
            )}

            {/* Open Command Modal Button [+] */}
            <button
              type="button"
              onClick={() => setSearchViewsModalOpen(true)}
              className={cn(
                "px-2 py-1 transition-colors shrink-0",
                searchViewsModalOpen
                  ? "text-[#75bf00]"
                  : "text-[#687063] hover:text-[#171a17] dark:hover:text-white"
              )}
              title="Add view or jump to tab"
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        {/* Right: Telemetry & Actions matching Screenshots 1, 2, 3, 4, 5 */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className={cn(
            "flex items-center gap-1.5 border px-2 py-1",
            dark ? "border-[#333] bg-[#1a1f1a]" : "border-[#d8ddd3] bg-[#fafbfa]"
          )}>
            <span className="h-2 w-2 rounded-full bg-[#75bf00]" />
            <span className="font-bold text-[11px]">1</span>
          </div>

          <button
            type="button"
            className={cn(
              "flex items-center gap-1 border px-2 py-1 transition-colors",
              dark ? "border-[#333] bg-[#1a1f1a] hover:border-white" : "border-[#d8ddd3] bg-[#fafbfa] hover:border-[#171a17]"
            )}
          >
            <GitBranch size={11} />
            <span className="font-sans text-[11px]">GitHub</span>
          </button>

          <button
            type="button"
            className={cn(
              "flex items-center gap-1 border px-2 py-1 transition-colors",
              dark ? "border-[#333] bg-[#1a1f1a] hover:border-white" : "border-[#d8ddd3] bg-[#fafbfa] hover:border-[#171a17]"
            )}
          >
            <MessageSquare size={11} />
            <span className="font-sans text-[11px]">Feedback</span>
          </button>

          <div className={cn(
            "border px-2 py-1 font-mono text-[11px]",
            dark ? "border-[#333] bg-[#141814] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
          )}>
            <span>Session • </span>
            <span className="text-[#75bf00] font-bold">$0.49</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Agent Stream & Composer (Visible when not hidden) */}
        {agentViewMode !== "hide_agent" && (
          <div className={cn(
            "border-r flex flex-col justify-between shrink-0 transition-all",
            agentViewMode === "focus_agent" ? "w-full" : "w-full md:w-[480px] lg:w-[540px]",
            dark ? "border-[#282828] bg-[#151515]" : "border-[#d8ddd3] bg-white"
          )}>
            {/* Stream Log Scroll Area matching uploaded image */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
              <div className={cn(agentViewMode === "focus_agent" ? "max-w-[760px] mx-auto space-y-4" : "space-y-4")}>
                
                {/* User Prompt Message Card (Right Aligned matching Reference Screenshot) */}
                <div className="flex justify-end pt-1">
                  <div className={cn(
                    "border px-3.5 py-2.5 rounded-lg max-w-xl text-xs leading-relaxed transition-colors",
                    dark ? "border-[#2e2e2e] bg-[#202020] text-white" : "border-[#d8ddd3] bg-white text-[#171a17]"
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

                {/* Thought 1 */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] text-[#788274] font-mono">
                    <span className="truncate">&gt; Thoughts The request is execution-grade. Llama 3.1 8B, vLLM, cost-first GPU selection,...</span>
                    <button
                      type="button"
                      onClick={() => setActiveThoughtsVerbose(!activeThoughtsVerbose)}
                      className="text-[#889284] hover:text-white shrink-0 ml-2 font-sans text-[11px]"
                    >
                      Verbose
                    </button>
                  </div>
                  <p className={cn("text-xs font-semibold leading-relaxed", dark ? "text-white" : "text-[#171a17]")}>
                    I&apos;m recording the cost-first objective and exact model scope before sizing feasible GPUs.
                  </p>
                </div>

                {/* Step 1: Requirements collected */}
                <div className={cn(
                  "border rounded-lg p-3 flex items-start justify-between cursor-pointer transition-colors hover:border-[#444]",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs",
                      dark ? "border-[#383838] bg-[#151515] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                    )}>
                      <FileText size={12} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-white">Requirements collected</div>
                      <div className="text-[11px] text-[#788274] leading-relaxed">
                        Collected: use case, sector, scale, deployment, goal, format, preferred models, runs on, concurrency, context window, mode
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#788274] shrink-0 mt-0.5" />
                </div>

                {/* Step 2: Intake updated */}
                <div className={cn(
                  "border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors hover:border-[#444]",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs",
                      dark ? "border-[#383838] bg-[#151515] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                    )}>
                      <FileText size={12} />
                    </div>
                    <span className="font-semibold text-xs text-white">Intake updated</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#788274]">
                    <span>Other, Prototype, Cloud (Managed), Low Cost</span>
                    <ChevronRight size={13} className="text-[#788274]" />
                  </div>
                </div>

                {/* Thought 2 */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-[#788274] font-mono">
                    <span className="truncate">&gt; Thoughts The model resolved successfully and the requested numerical fields were...</span>
                    <button
                      type="button"
                      onClick={() => setActiveThoughtsVerbose(!activeThoughtsVerbose)}
                      className="text-[#889284] hover:text-white shrink-0 ml-2 font-sans text-[11px]"
                    >
                      Verbose
                    </button>
                  </div>
                  <p className={cn("text-xs font-semibold leading-relaxed", dark ? "text-white" : "text-[#171a17]")}>
                    I&apos;m sizing the 8B model across compatible GPU tiers to identify the lowest-cost fit.
                  </p>
                </div>

                {/* Step 3: GPU feasibility */}
                <div className={cn(
                  "border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors hover:border-[#444]",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs",
                      dark ? "border-[#383838] bg-[#151515] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                    )}>
                      <Search size={12} />
                    </div>
                    <span className="font-semibold text-xs text-white">GPU feasibility</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#e0e4dd]">
                    <span>A100-40GB</span>
                    <ChevronRight size={13} className="text-[#788274]" />
                  </div>
                </div>

                {/* Thought 3 */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-[#788274] font-mono">
                    <span className="truncate">&gt; Thoughts The feasibility result confirms that the model&apos;s catalog weight size is 16GB...</span>
                    <button
                      type="button"
                      onClick={() => setActiveThoughtsVerbose(!activeThoughtsVerbose)}
                      className="text-[#889284] hover:text-white shrink-0 ml-2 font-sans text-[11px]"
                    >
                      Verbose
                    </button>
                  </div>
                </div>

                {/* Step 4: Plan drafted */}
                <div className={cn(
                  "border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors hover:border-[#444]",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs",
                      dark ? "border-[#383838] bg-[#151515] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                    )}>
                      <Layers size={12} />
                    </div>
                    <span className="font-semibold text-xs text-white">Plan drafted</span>
                  </div>
                  <ChevronRight size={13} className="text-[#788274]" />
                </div>

                {/* Step 5: Plan ready matching exact reference screenshot */}
                <div className={cn(
                  "border rounded-lg p-4 space-y-3.5 shadow-sm",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#c9cec4] bg-white"
                )}>
                  <div className="flex items-center justify-between border-b border-[#edf0eb] dark:border-[#282828] pb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs",
                        dark ? "border-[#383838] bg-[#151515] text-[#889284]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#687063]"
                      )}>
                        <Layers size={12} />
                      </div>
                      <span className="font-semibold text-xs text-white">Plan ready</span>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-mono text-[11px] text-[#788274] hover:text-white"
                    >
                      <span>1 trial run / review / 5 phases / ~6m</span>
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <p className="leading-relaxed font-normal text-[#e0e4dd]">
                      Optimize meta-llama/Llama-3.1-8B-Instruct for cost, no numeric target set. Runs on managed cloud by default; vLLM is locked by user. GPU chosen by feasibility: 1x A100-40GB for the lowest modeled per-request cost and 19.5GB peak-VRAM fit.
                    </p>

                    <p className="text-[#788274] leading-relaxed">
                      Recommended path: vLLM on A100-40GB. Review the plan before execution.
                    </p>

                    <div className="border-t border-dashed border-[#d8ddd3] dark:border-[#282828] pt-3 text-[11px] font-sans text-[#e0e4dd]">
                      This uses 1 of your 3 remaining trial runs. No charge.
                    </div>
                  </div>

                  {/* Plan Action Buttons matching screenshot */}
                  <div className="border-t border-dashed border-[#d8ddd3] dark:border-[#282828] pt-3 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (agentViewMode === "focus_agent") setAgentViewMode("split");
                        setActiveTab("plan");
                      }}
                      className={cn(
                        "flex items-center gap-1.5 border px-3 py-1.5 text-xs rounded transition-colors",
                        dark ? "border-[#383838] bg-[#151515] text-[#d0d4cd] hover:border-white hover:text-white" : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-black"
                      )}
                    >
                      <ExternalLink size={12} />
                      <span>Open Plan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void acceptAndRun()}
                      disabled={runSubmitting}
                      className={cn(
                        "flex items-center gap-1.5 border px-3.5 py-1.5 text-xs rounded transition-colors",
                        dark ? "border-[#383838] bg-[#151515] text-white hover:border-white hover:bg-[#282828]" : "border-[#171a17] bg-[#171a17] text-white"
                      )}
                    >
                      <Play size={11} className="fill-current text-[#75bf00]" />
                      <span>{runSubmitting ? "Submitting..." : "Accept and run"}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Feedback Actions Icon Row matching Screenshot */}
                <div className="flex items-center gap-3 pt-1 text-[#788274]">
                  <button type="button" className="hover:text-white transition-colors" title="Copy">
                    <Copy size={13} />
                  </button>
                  <button type="button" className="hover:text-white transition-colors" title="Good response">
                    <span className="text-xs">👍</span>
                  </button>
                  <button type="button" className="hover:text-white transition-colors" title="Bad response">
                    <span className="text-xs">👎</span>
                  </button>
                  <button type="button" className="hover:text-white transition-colors" title="Regenerate">
                    <RotateCcw size={13} />
                  </button>
                </div>

              </div>
            </div>

            {/* Bottom Chat Composer matching Reference UI */}
            <div className={cn(
              "border-t p-3 relative",
              dark ? "border-[#282828] bg-[#151515]" : "border-[#d8ddd3] bg-[#fafbfa]"
            )}>
              <div className={cn(agentViewMode === "focus_agent" ? "max-w-[760px] mx-auto" : "")}>
                {/* Unified Card Container matching Screenshot */}
                <div className={cn(
                  "border p-2.5 rounded-lg space-y-2 transition-colors",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply, or / for commands"
                    className="w-full bg-transparent border-0 outline-none resize-none font-sans text-xs text-white placeholder:text-[#666] leading-relaxed"
                  />

                  {/* Bottom Bar Inside Composer */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#282828]">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setRunContextOpen(!runContextOpen)}
                        className="flex items-center gap-1 text-[11px] font-mono text-[#889284] hover:text-white transition-colors"
                      >
                        <span>Run context</span>
                        <ChevronDown size={11} />
                      </button>

                      {/* Run Context Flyout Modal */}
                      {runContextOpen && (
                        <div className={cn(
                          "absolute bottom-full left-0 mb-2 w-64 border p-3 shadow-xl space-y-2.5 text-xs font-mono z-50 rounded-xs",
                          dark ? "border-[#383838] bg-[#202020] text-[#e0e4dd]" : "border-[#d8ddd3] bg-white text-[#171a17]"
                        )}>
                          <div className="flex items-center justify-between border-b border-[#282828] pb-1.5 font-bold text-white">
                            <span>RUN CONTEXT</span>
                            <span className="text-[10px] text-[#788274]">vLLM</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-[#889284]">
                            <div className="flex justify-between"><span>Model:</span><span className="text-white">Llama 3.1 8B</span></div>
                            <div className="flex justify-between"><span>Target GPU:</span><span className="text-white">A100-40GB</span></div>
                            <div className="flex justify-between"><span>Engine:</span><span className="text-white">vLLM (Auto)</span></div>
                            <div className="flex justify-between"><span>Budget:</span><span className="text-[#75bf00]">$0.49 / trial</span></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mode Switcher Trigger matching User Reference Image */}
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
                              ? "border-[#383838] bg-[#202020] text-white hover:border-[#444]"
                              : "border-[#d8ddd3] bg-[#fafbfa] text-[#2a3028]"
                          )}
                        >
                          {selectedMode === "Experiment" ? (
                            <FlaskConical size={13} className="text-[#788274]" />
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

                        {/* Mode Dropdown Popover matching User Reference Image */}
                        {modeDropdownOpen && (
                          <div className={cn(
                            "absolute right-0 bottom-full mb-2 w-80 border border-dashed shadow-2xl p-1.5 space-y-1 text-xs z-50 rounded-lg animate-in fade-in zoom-in-95 duration-100",
                            dark
                              ? "border-[#383838] bg-[#202020] text-white"
                              : "border-[#c9cec4] bg-white text-[#171a17]"
                          )}>
                            {/* Optimize Option */}
                            <div
                              onClick={() => {
                                setSelectedMode("Optimize");
                                setModeDropdownOpen(false);
                              }}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors text-left",
                                selectedMode === "Optimize"
                                  ? dark ? "bg-[#282828]" : "bg-[#f3f6f0]"
                                  : dark ? "hover:bg-[#282828]" : "hover:bg-[#f3f6f0]"
                              )}
                            >
                              <Gauge size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white text-xs">Optimize</span>
                                  {selectedMode === "Optimize" && (
                                    <Check size={14} className="text-[#75bf00]" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#888] mt-0.5 leading-relaxed">
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
                                "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors text-left",
                                selectedMode === "Experiment"
                                  ? dark ? "bg-[#282828]" : "bg-[#f3f6f0]"
                                  : dark ? "hover:bg-[#282828]" : "hover:bg-[#f3f6f0]"
                              )}
                            >
                              <FlaskConical size={16} className="text-[#788274] shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white text-xs">Experiment</span>
                                  {selectedMode === "Experiment" && (
                                    <Check size={14} className="text-[#75bf00]" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#888] mt-0.5 leading-relaxed">
                                  Exploratory run: measure candidates side by side. No winner is applied.
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
                        className="flex h-7 w-7 items-center justify-center border border-[#383838] bg-[#282828] text-[#889284] hover:border-white hover:text-white transition-colors rounded-xs"
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
                <span className="font-mono text-[#788274] font-bold">No model selected</span>
              </div>
            </div>

            {runError ? (
              <div className="mx-6 mt-4 border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 rounded-xs">
                {runError}
              </div>
            ) : null}

            {/* TAB CONTENT 1: OPTIMIZATION */}
            {activeTab === "optimization" && (
              <div className="p-6 space-y-6 flex-1">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">
                    Optimization results
                  </h3>
                </div>

                <div className={cn(
                  "border rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className={cn(
                    "border-b px-3 py-2 font-semibold text-xs",
                    dark ? "border-[#282828] bg-[#282828]" : "border-[#edf0eb] bg-[#fafbfa]"
                  )}>
                    Technique progression ⓘ
                  </div>
                  <div className="p-12 text-center text-xs text-[#889083] font-mono min-h-[140px] flex items-center justify-center">
                    pending (fills in as the run benchmarks each phase)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={cn(
                    "border rounded-xs",
                    dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                  )}>
                    <div className={cn(
                      "border-b px-3 py-2 font-semibold text-xs",
                      dark ? "border-[#282828] bg-[#282828]" : "border-[#edf0eb] bg-[#fafbfa]"
                    )}>
                      Latency ⓘ
                    </div>
                    <div className="p-10 text-center text-xs text-[#889083] font-mono min-h-[120px] flex items-center justify-center">
                      pending (fills in when a run measures it)
                    </div>
                  </div>

                  <div className={cn(
                    "border rounded-xs",
                    dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                  )}>
                    <div className={cn(
                      "border-b px-3 py-2 font-semibold text-xs",
                      dark ? "border-[#282828] bg-[#282828]" : "border-[#edf0eb] bg-[#fafbfa]"
                    )}>
                      TTFT p50 ⓘ
                    </div>
                    <div className="p-10 text-center text-xs text-[#889083] font-mono min-h-[120px] flex items-center justify-center">
                      pending (fills in when a run measures it)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: BENCHMARKS matching Image 3 */}
            {activeTab === "benchmarks" && (
              <div className="p-6 space-y-6 flex-1 max-w-[900px]">
                <div className={cn(
                  "border p-4 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="text-[11px] font-mono text-[#788274] uppercase tracking-wider">Benchmarks</div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-base font-bold text-white">Model not recorded</h2>
                    <span className="text-xs text-[#788274] font-mono">no winner</span>
                  </div>
                </div>

                <div className={cn(
                  "border p-6 rounded-xs space-y-4",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="flex items-center justify-between text-xs border-b border-[#282828] pb-3">
                    <span className="text-[#a0a89d]">Optimize a winner before measuring standard benchmark quality.</span>
                    <button
                      type="button"
                      onClick={() => handleOpenTab("optimization")}
                      className="text-[#788274] hover:text-[#75bf00] font-mono transition-colors"
                    >
                      Optimization
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className={cn(
                      "border border-dashed p-8 rounded-xs text-center space-y-1 min-h-[140px] flex flex-col justify-center",
                      dark ? "border-[#2e2e2e] bg-[#151515]" : "border-[#d8ddd3] bg-[#fafbfa]"
                    )}>
                      <div className="text-xs font-semibold text-[#889284]">quality scores</div>
                      <div className="text-[11px] text-[#687063]">Fills in after an optimized winner is promoted.</div>
                    </div>

                    <div className={cn(
                      "border border-dashed p-8 rounded-xs text-center space-y-1 min-h-[140px] flex flex-col justify-center",
                      dark ? "border-[#2e2e2e] bg-[#151515]" : "border-[#d8ddd3] bg-[#fafbfa]"
                    )}>
                      <div className="text-xs font-semibold text-[#889284]">suite breakdown</div>
                      <div className="text-[11px] text-[#687063]">Fills in as the suite measures each benchmark.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: PIPELINE CANVAS matching Image 4 */}
            {activeTab === "pipeline" && (
              <div className="flex-1 flex flex-col justify-between p-4 relative min-h-[460px]">
                {/* Top Toolbar */}
                <div className="flex items-center gap-1.5 border border-[#2e2e2e] bg-[#202020] p-1 rounded-xs w-fit text-xs font-mono text-[#788274]">
                  <button type="button" className="p-1 hover:text-white hover:bg-[#282828] rounded-xs" title="Undo"><Undo size={13} /></button>
                  <button type="button" className="p-1 hover:text-white hover:bg-[#282828] rounded-xs" title="Redo"><Redo size={13} /></button>
                  <div className="h-3 w-px bg-[#2e2e2e] mx-1" />
                  <button type="button" className="p-1 hover:text-white hover:bg-[#282828] rounded-xs" title="Auto Layout"><Grid size={13} /></button>
                  <button type="button" className="p-1 hover:text-white hover:bg-[#282828] rounded-xs" title="Import"><Download size={13} /></button>
                  <button type="button" className="p-1 hover:text-white hover:bg-[#282828] rounded-xs" title="Export"><Upload size={13} /></button>
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
                  <button type="button" className="px-1.5 py-0.5 hover:text-white hover:bg-[#282828] rounded-xs"><Minus size={11} /></button>
                  <span className="px-2 text-[11px] font-mono text-[#a0a89d]">100%</span>
                  <button type="button" className="px-1.5 py-0.5 hover:text-white hover:bg-[#282828] rounded-xs"><Plus size={11} /></button>
                  <div className="h-3 w-px bg-[#2e2e2e] mx-1" />
                  <button type="button" className="p-1 hover:text-white hover:bg-[#282828] rounded-xs" title="Fit to Screen"><Maximize2 size={12} /></button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: TEST matching Image 5 */}
            {activeTab === "test" && (
              <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xs border",
                  dark ? "border-[#2e2e2e] bg-[#202020] text-[#889284]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#687063]"
                )}>
                  <FlaskConical size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    This model is not ready for Current preview.
                  </h3>
                  <p className="text-xs text-[#788274] mt-1.5 max-w-sm leading-relaxed">
                    Optimized preview is waiting for the plan execution trace. Refresh after optimization completes, then retry.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    className="border border-[#333e31] bg-[#1a201a] px-3.5 py-1.5 text-xs text-[#d0d4cd] rounded hover:border-white hover:text-white transition-colors"
                  >
                    Test Baseline instead
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenTab("plan")}
                    className="border border-[#333e31] bg-[#1a201a] px-3.5 py-1.5 text-xs text-[#d0d4cd] rounded hover:border-white hover:text-white transition-colors"
                  >
                    Open the plan
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: PLAN */}
            {activeTab === "plan" && (
              <div className="p-6 space-y-6 flex-1 max-w-[840px]">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[#788274] font-mono">
                    Experiment type: Optimize
                  </span>
                  <h1 className="text-xl font-bold mt-1 leading-snug">
                    Plan: {objective}
                  </h1>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-xs">Goal</h4>
                    <p className="mt-1 leading-relaxed text-[#525a4d] dark:text-[#a0a89d]">
                      {objective}
                    </p>
                    <p className="mt-1 text-[11px] text-[#788274] font-mono">
                      Run status: {displayedRunStatus}. Measurements will appear after execution records them.
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-dashed border-[#d8ddd3] dark:border-[#333] pt-4">
                    <h4 className="font-semibold text-xs">Context</h4>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-28 text-[#788274] font-sans">Models:</span>
                        <span className="font-semibold text-[#788274]">Not selected</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-28 text-[#788274] font-sans">Backend:</span>
                        <span className="text-[#788274]">Not selected</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-28 text-[#788274] font-sans">Deployment:</span>
                        <span className="text-[#788274]">Not recorded</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-28 text-[#788274] font-sans shrink-0">GPU:</span>
                        <div className="space-y-1">
                          <span className="text-[#788274]">Not measured</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-28 text-[#788274] font-sans">Cost (estimate):</span>
                        <span className="text-[#788274]">Not measured</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between border-t border-[#d8ddd3] dark:border-[#333] pt-4">
                  <span className="font-mono text-xs text-[#788274]">Persisted run: {displayedRunStatus}</span>
                  <div className="flex items-center gap-2">
                    <EpochButton variant="outline" size="sm" onClick={() => setActiveTab("optimization")}>
                      Cancel
                    </EpochButton>
                    <EpochButton variant="action" size="sm" onClick={() => void acceptAndRun()} disabled={runSubmitting}>
                      {runSubmitting ? "Submitting..." : "Accept and run"}
                    </EpochButton>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: DEPLOY */}
            {activeTab === "deploy" && (
              <div className="p-6 space-y-6 flex-1">
                <div className="border border-[#b9de78] bg-[#fbfdf9] dark:bg-[#172412] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center bg-[#75bf00] text-[#111]">
                      <Zap size={13} />
                    </span>
                    <div>
                      <span className="font-semibold text-xs">Deployment requires Core</span>
                      <p className="text-[11px] text-[#525a4d] dark:text-[#a0a89d]">Upgrade your plan to unlock this feature.</p>
                    </div>
                  </div>
                  <EpochButton variant="action" size="sm">
                    Upgrade
                  </EpochButton>
                </div>

                <div className={cn(
                  "border border-dashed p-12 text-center space-y-1",
                  dark ? "border-[#333] bg-[#141814]" : "border-[#c9cec4] bg-[#fafbfa]"
                )}>
                  <div className="font-semibold text-xs">No model to deploy yet</div>
                  <p className="text-xs text-[#687063] dark:text-[#a0a89d]">
                    Add a model in the Pipeline tab. After an optimization run, deploy options appear here.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 7: EXPERIMENT */}
            {activeTab === "experiment" && (
              <div className="p-6 space-y-4 flex-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">Experiment Matrix</h3>
                <div className={cn(
                  "border border-dashed p-12 text-center rounded-xs space-y-1",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="font-semibold text-xs text-white">No valid comparison matrix loaded</div>
                  <p className="text-xs text-[#788274]">
                    Add models to run cross-runtime sweeps across vLLM, SGLang, and TensorRT-LLM.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 8: CODE */}
            {activeTab === "code" && (
              <div className="p-6 space-y-4 flex-1 font-mono text-xs">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] font-sans">Runtime Code</h3>
                <div className={cn(
                  "border p-4 rounded-xs bg-[#151515] text-[#93c5fd] overflow-x-auto space-y-2",
                  dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
                )}>
                  <div className="text-[#788274]">// Python Client with OpenAI SDK</div>
                  <div><span className="text-[#f43f5e]">import</span> openai</div>
                  <div>client = openai.OpenAI(base_url=<span className="text-[#a3e635]">&quot;http://localhost:8000/v1&quot;</span>, api_key=<span className="text-[#a3e635]">&quot;epoch-local&quot;</span>)</div>
                  <div>response = client.chat.completions.create(model=<span className="text-[#a3e635]">&quot;meta-llama/Llama-3.1-8B-Instruct&quot;</span>, messages=[...])</div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 9: CONFIG */}
            {activeTab === "config" && (
              <div className="p-6 space-y-4 flex-1 max-w-[720px] text-xs">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">Pipeline Configuration</h3>
                <div className={cn(
                  "border p-4 rounded-xs space-y-3",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Max Concurrency</div>
                      <div className="text-[#788274] text-[11px]">Maximum concurrent requests before queueing</div>
                    </div>
                    <span className="font-mono border border-[#383838] bg-[#151515] px-2 py-0.5 rounded-xs">64</span>
                  </div>
                  <div className="border-t border-[#282828] pt-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Prefill Chunking</div>
                      <div className="text-[#788274] text-[11px]">Chunked prefill for improved TTFT under load</div>
                    </div>
                    <span className="font-mono text-[#75bf00]">Enabled</span>
                  </div>
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
                className="flex w-full items-center justify-between px-4 py-2 text-xs font-mono text-[#788274] hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Terminal size={12} />
                  <span>Terminal</span>
                  <span className="bg-[#282828] border border-[#383838] px-1.5 py-0.2 text-[10px] text-white rounded-xs">1</span>
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
                            : "text-[#788274] hover:text-white"
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
              dark ? "border-[#383838] bg-[#202020] text-white" : "border-[#d8ddd3] bg-white text-[#171a17]"
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
                  className="bg-transparent text-xs text-white placeholder:text-[#666] outline-none w-full font-mono"
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
    </div>
  );
}

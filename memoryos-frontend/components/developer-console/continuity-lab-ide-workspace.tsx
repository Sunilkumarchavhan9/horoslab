"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ContinuityLabBrandMark } from "@/components/developer-console/continuity-lab-brand";
import { ContinuityLabFileChanges } from "@/components/developer-console/continuity-lab-file-changes";
import { ContinuityLabGitHubExecution } from "@/components/developer-console/continuity-lab-github-execution";
import type { LabFileChange, RepoRef } from "@/lib/continuity-lab-editor";
import { cn } from "@/lib/utils";

export type LabLayoutMode = "agent" | "editor";

export type LabThreadItem = {
  id: string;
  title: string;
  subtitle?: string;
  active?: boolean;
};

export type LabMutationItem = {
  id: string;
  label: string;
  detail: string;
  timestamp?: string;
};

export type LabChatMessage = {
  speaker: "user" | "assistant";
  text: string;
  createdAt: string;
};

type ContinuityLabIdeWorkspaceProps = {
  threadTitle: string;
  repoLabel: string;
  threads: LabThreadItem[];
  mutations: LabMutationItem[];
  toolsPanel: ReactNode;
  toolsOpen: boolean;
  onToolsOpenChange: (open: boolean) => void;
  reviewOpen: boolean;
  onReviewOpenChange: (open: boolean) => void;
  agentOpen: boolean;
  onAgentOpenChange: (open: boolean) => void;
  onNewChat: () => void;
  githubConnected: boolean;
  briefBody?: string;
  onCommitClick?: () => void;
  layoutMode: LabLayoutMode;
  onLayoutModeChange: (mode: LabLayoutMode) => void;
  agentPanel: ReactNode;
  editorPanel: ReactNode;
  fileChanges: LabFileChange[];
  editorRepo: RepoRef | null;
  localWorkspaceRoot?: string | null;
  onSavedToDisk?: (path: string, content: string) => void;
};

export function ContinuityLabIdeWorkspace({
  threadTitle,
  repoLabel,
  threads,
  mutations,
  toolsPanel,
  toolsOpen,
  onToolsOpenChange,
  reviewOpen,
  onReviewOpenChange,
  agentOpen,
  onAgentOpenChange,
  onNewChat,
  githubConnected,
  briefBody,
  onCommitClick,
  layoutMode,
  onLayoutModeChange,
  agentPanel,
  editorPanel,
  fileChanges,
  editorRepo,
  localWorkspaceRoot,
  onSavedToDisk,
}: ContinuityLabIdeWorkspaceProps) {
  const changeCount = mutations.length + fileChanges.length;
  const isEditor = layoutMode === "editor";

  return (
    <div className="continuity-lab-ide flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#1a1a1a] font-sans text-[#ececec] antialiased">
      {/* Threads rail */}
      <aside className="hidden w-[200px] shrink-0 flex-col border-r border-white/[0.08] bg-[#171717] lg:flex">
        <div className="border-b border-white/[0.08] px-3 py-3">
          <ContinuityLabBrandMark compact />
        </div>
        <div className="space-y-0.5 p-2">
          <RailButton onClick={onNewChat}>New thread</RailButton>
          <RailButton onClick={() => onToolsOpenChange(true)}>Memory & tools</RailButton>
          <Link
            href="/developer-console"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#ececec] hover:bg-[#2f2f2f]"
          >
            <PlugIcon />
            Connectors
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <p className="px-3 py-1 text-xs font-medium text-[#8e8e8e]">Threads</p>
          {threads.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[#6b6b6b]">Current session</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "mb-0.5 w-full rounded-lg px-3 py-2 text-left transition",
                  t.active ? "bg-[#2f2f2f]" : "hover:bg-[#252525]",
                )}
              >
                <p className="truncate text-sm text-[#ececec]">{t.title}</p>
                {t.subtitle ? (
                  <p className="truncate text-xs text-[#8e8e8e]">{t.subtitle}</p>
                ) : null}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main + review */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#212121] px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#ececec]">{threadTitle}</p>
            <p className="truncate text-xs text-[#8e8e8e]">{repoLabel}</p>
          </div>
          <LayoutToggle mode={layoutMode} onChange={onLayoutModeChange} />
          {isEditor ? (
            <button
              type="button"
              onClick={() => onAgentOpenChange(true)}
              className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-[#ececec] hover:bg-[#2f2f2f] md:hidden"
            >
              Agent
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onReviewOpenChange(true)}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-[#ececec] hover:bg-[#2f2f2f] lg:hidden"
          >
            Review
          </button>
          <a
            href="/developer-console/continuity-lab?layout=agent"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg border border-white/10 px-2.5 py-1 text-xs text-[#ececec] hover:bg-[#2f2f2f] sm:inline-block"
          >
            Agents ↗
          </a>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Agent Window — always visible on md+ in both modes */}
          <aside
            className={cn(
              "flex shrink-0 flex-col border-r border-white/[0.08] bg-[#212121]",
              "w-[min(400px,34vw)] min-w-[280px]",
              isEditor
                ? agentOpen
                  ? "fixed inset-y-0 left-0 z-50 w-full max-w-md shadow-2xl md:static md:z-auto md:shadow-none"
                  : "hidden md:flex"
                : "min-w-0 w-full flex-1",
            )}
          >
            {isEditor ? (
              <button
                type="button"
                className="absolute right-2 top-2 z-10 rounded-lg p-1 text-[#8e8e8e] hover:bg-white/10 md:hidden"
                onClick={() => onAgentOpenChange(false)}
                aria-label="Close agent"
              >
                <CloseIcon />
              </button>
            ) : null}
            <div className="h-full min-h-0">{agentPanel}</div>
          </aside>

          {/* Editor — only in editor layout */}
          {isEditor ? (
            <div className="flex min-w-0 flex-1 flex-col">{editorPanel}</div>
          ) : null}
        </div>
      </div>

      {/* Review */}
      <ReviewPanel
        changeCount={changeCount}
        fileChanges={fileChanges}
        editorRepo={editorRepo}
        githubConnected={githubConnected}
        briefBody={briefBody}
        mutations={mutations}
        reviewOpen={reviewOpen}
        onReviewOpenChange={onReviewOpenChange}
        onToolsOpenChange={onToolsOpenChange}
        onCommitClick={onCommitClick}
        localWorkspaceRoot={localWorkspaceRoot}
        onSavedToDisk={onSavedToDisk}
      />

      {toolsOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/50"
            aria-label="Close tools"
            onClick={() => onToolsOpenChange(false)}
          />
          <aside className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#171717] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-medium">Memory & tools</span>
              <button type="button" onClick={() => onToolsOpenChange(false)} className="p-2">
                <CloseIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{toolsPanel}</div>
          </aside>
        </>
      ) : null}

      {agentOpen && isEditor ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close agent overlay"
          onClick={() => onAgentOpenChange(false)}
        />
      ) : null}
    </div>
  );
}

function ReviewPanel({
  changeCount,
  fileChanges,
  editorRepo,
  githubConnected,
  briefBody,
  mutations,
  reviewOpen,
  onReviewOpenChange,
  onToolsOpenChange,
  onCommitClick,
  localWorkspaceRoot,
  onSavedToDisk,
}: {
  changeCount: number;
  fileChanges: LabFileChange[];
  editorRepo: RepoRef | null;
  githubConnected: boolean;
  briefBody?: string;
  mutations: LabMutationItem[];
  reviewOpen: boolean;
  onReviewOpenChange: (open: boolean) => void;
  onToolsOpenChange: (open: boolean) => void;
  onCommitClick?: () => void;
  localWorkspaceRoot?: string | null;
  onSavedToDisk?: (path: string, content: string) => void;
}) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-white/[0.08] bg-[#1a1a1a] lg:w-[min(380px,32vw)]",
        reviewOpen
          ? "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col shadow-2xl lg:static lg:z-auto lg:shadow-none"
          : "hidden lg:flex",
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5">
        <div>
          <p className="text-sm font-medium text-[#ececec]">Review</p>
          <p className="text-xs text-[#8e8e8e]">
            {changeCount > 0 ? `${changeCount} changes` : "No pending changes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToolsOpenChange(true)}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-[#ececec] hover:bg-[#2f2f2f]"
          >
            Tools
          </button>
          <button
            type="button"
            onClick={onCommitClick}
            disabled={!githubConnected}
            className="rounded-lg bg-[#ececec] px-3 py-1 text-xs font-medium text-[#1a1a1a] disabled:opacity-40"
          >
            Commit
          </button>
          <button
            type="button"
            className="rounded-lg p-1 text-[#8e8e8e] hover:bg-[#2f2f2f] lg:hidden"
            onClick={() => onReviewOpenChange(false)}
            aria-label="Close review"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ContinuityLabFileChanges
          changes={fileChanges}
          repo={editorRepo}
          githubConnected={githubConnected}
          localWorkspaceRoot={localWorkspaceRoot}
          onSavedToDisk={onSavedToDisk}
        />
        {mutations.length > 0 ? (
          <div className="border-b border-white/[0.08] p-3">
            <p className="mb-2 text-xs font-medium text-[#8e8e8e]">Runtime activity</p>
            <ul className="space-y-2">
              {mutations.map((m) => (
                <li
                  key={m.id}
                  className="rounded-md border border-white/[0.06] bg-[#252525] px-3 py-2 font-mono text-[11px]"
                >
                  <p className="text-[#10b981]">✓ {m.label}</p>
                  <p className="mt-1 text-[#8e8e8e]">{m.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="p-3">
          <p className="mb-2 text-xs font-medium text-[#8e8e8e]">GitHub write-back</p>
          <ContinuityLabGitHubExecution
            githubConnected={githubConnected}
            suggestedBody={briefBody}
          />
        </div>
      </div>
    </aside>
  );
}

function RailButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#ececec] transition hover:bg-[#2f2f2f] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PlugIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22v-5M9 8V2M15 8V2M7 8h10v4a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V8Z" />
    </svg>
  );
}

function LayoutToggle({
  mode,
  onChange,
}: {
  mode: LabLayoutMode;
  onChange: (m: LabLayoutMode) => void;
}) {
  return (
    <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange("agent")}
        className={cn(
          "rounded-md px-2.5 py-1",
          mode === "agent" ? "bg-[#ececec] text-[#1a1a1a]" : "text-[#8e8e8e]",
        )}
      >
        Agent
      </button>
      <button
        type="button"
        onClick={() => onChange("editor")}
        className={cn(
          "rounded-md px-2.5 py-1",
          mode === "editor" ? "bg-[#ececec] text-[#1a1a1a]" : "text-[#8e8e8e]",
        )}
      >
        Editor
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

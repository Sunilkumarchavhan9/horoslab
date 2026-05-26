"use client";

import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import { ContinuityLabAgentWindow } from "@/components/developer-console/continuity-lab-agent-window";
import { ContinuityLabEditorWorkbench } from "@/components/developer-console/continuity-lab-editor-workbench";
import type { ContinueBrief } from "@/components/developer-console/continuity-lab-project-plan";
import {
  ContinuityLabIdeWorkspace,
  type LabChatMessage,
  type LabLayoutMode,
  type LabMutationItem,
  type LabThreadItem,
} from "@/components/developer-console/continuity-lab-ide-workspace";
import { ContinuityLabDesktopHome } from "@/components/developer-console/continuity-lab-desktop-home";
import type { LabFileChange, RepoRef } from "@/lib/continuity-lab-editor";
import { desktopOpenFolder, isMemoryOsDesktop } from "@/lib/memoryos-desktop";
import { ContinuityLabIntelligencePanel } from "@/components/developer-console/continuity-lab-intelligence-panel";
import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";
import { Input } from "@/components/developer-console/console-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsageMeter } from "@/components/developer-console/usage-meter";
import type { BillingPlan } from "@/lib/plan-catalog";

type DemoMessage = {
  speaker: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
};

type TimelineEventRecord = {
  id: string;
  eventType: string;
  reason: string;
  timestamp: string;
};

type ProjectState = {
  systemGoal?: string;
  missingInfo?: string[];
};

type RuntimeAgent = { id: string; label: string; model: string };

type BillingSnapshot = {
  currentPlan: BillingPlan;
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
};

function ChatComposer({
  chatInput,
  onChatInputChange,
  onKeyDownSend,
  onSendMessage,
  onStartVoice,
  onStopVoice,
  isVoiceRecordingActive,
  hasActiveSession,
  isEnding,
  isChatLoading,
  composerReady,
  isStartingSession,
}: {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onKeyDownSend: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  isVoiceRecordingActive: boolean;
  hasActiveSession: boolean;
  isEnding: boolean;
  isChatLoading: boolean;
  composerReady: boolean;
  isStartingSession?: boolean;
}) {
  return (
    <div className="flex w-full items-center gap-2 rounded-[26px] border border-white/[0.08] bg-[#2f2f2f] px-4 py-3">
      <button
        type="button"
        aria-label="Add"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8e8e8e] hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <Input
        value={chatInput}
        onChange={(e) => onChatInputChange(e.target.value)}
        onKeyDown={onKeyDownSend}
        disabled={!composerReady || isEnding || isChatLoading || isStartingSession}
        placeholder={isStartingSession ? "Starting session…" : "Ask anything"}
        className="min-h-[28px] flex-1 border-0 bg-transparent text-[16px] text-[#ececec] placeholder:text-[#8e8e8e] focus-visible:ring-0"
      />
      <button
        type="button"
        aria-label={isVoiceRecordingActive ? "Stop voice" : "Voice"}
        onClick={isVoiceRecordingActive ? onStopVoice : onStartVoice}
        disabled={!composerReady || isEnding || isStartingSession}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8e8e8e] hover:bg-white/10 disabled:opacity-35"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
          <path d="M8 21h8" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Send"
        onClick={onSendMessage}
        disabled={!chatInput.trim() || !composerReady || isEnding || isChatLoading || isStartingSession}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#212121] disabled:opacity-30"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5" />
          <path d="m7 10 5-5 5 5" />
        </svg>
      </button>
    </div>
  );
}

export function ContinuityLabSessionView({
  toolsOpen,
  onToolsOpenChange,
  activeAgent,
  onActiveAgentChange,
  availableRuntimeAgents,
  hasRuntimeAgents,
  isRuntimeAgentsLoading,
  hasActiveSession,
  isEnding,
  canEnd,
  onEndConversation,
  micError,
  errorMessage,
  workspace,
  project,
  threadId,
  autobrief,
  onBriefLoaded,
  onAnalyzeRisk,
  conversation,
  isChatLoading,
  isVoiceRecordingActive,
  chatScrollRef,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onKeyDownSend,
  isSwitchingAgent,
  onSwitchAgent,
  isNextStepLoading,
  onGenerateNextStep,
  onExecuteNextStep,
  isExecuting,
  applyCompanyBrainSkills,
  onToggleCompanyBrainSkills,
  onStartVoice,
  onStopVoice,
  billing,
  projectState,
  visibleTimeline,
  onSubmitGoalIntake,
  intakeGoal,
  onIntakeGoalChange,
  intakeOwner,
  onIntakeOwnerChange,
  intakeDeadline,
  onIntakeDeadlineChange,
  onSendToIde,
  isSendingIdePacket,
  onNewChat,
  canStartSession,
  isStartingSession,
  mutationHistory,
  onExplainPlan,
  initialLayoutMode,
  forceDesktop = false,
}: {
  toolsOpen: boolean;
  onToolsOpenChange: (open: boolean) => void;
  activeAgent: string;
  onActiveAgentChange: (id: string) => void;
  availableRuntimeAgents: RuntimeAgent[];
  hasRuntimeAgents: boolean;
  isRuntimeAgentsLoading: boolean;
  hasActiveSession: boolean;
  isEnding: boolean;
  canEnd: boolean;
  onEndConversation: () => void;
  micError: string | null;
  errorMessage: string | null;
  workspace: string;
  project: string;
  threadId: string;
  autobrief: boolean;
  onBriefLoaded: (brief: { currentGoal?: string; openBlockers?: string[] }) => void;
  onAnalyzeRisk: (summary: string) => void;
  conversation: DemoMessage[];
  isChatLoading: boolean;
  isVoiceRecordingActive: boolean;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyDownSend: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isSwitchingAgent: boolean;
  onSwitchAgent: () => void;
  isNextStepLoading: boolean;
  onGenerateNextStep: () => void;
  onExecuteNextStep: () => void;
  isExecuting: boolean;
  applyCompanyBrainSkills: boolean;
  onToggleCompanyBrainSkills: () => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  billing: BillingSnapshot | null;
  projectState: ProjectState;
  visibleTimeline: TimelineEventRecord[];
  onSubmitGoalIntake: () => void;
  intakeGoal: string;
  onIntakeGoalChange: (v: string) => void;
  intakeOwner: string;
  onIntakeOwnerChange: (v: string) => void;
  intakeDeadline: string;
  onIntakeDeadlineChange: (v: string) => void;
  onSendToIde: () => void;
  isSendingIdePacket: boolean;
  onNewChat: () => void;
  /** True when no live session yet — still show full ChatGPT shell. */
  canStartSession?: boolean;
  isStartingSession?: boolean;
  mutationHistory?: Array<{ type: string; label: string; detail: string; timestamp?: string }>;
  onExplainPlan?: () => void;
  initialLayoutMode?: LabLayoutMode;
  forceDesktop?: boolean;
}) {
  const [isDesktopApp, setIsDesktopApp] = useState(Boolean(forceDesktop));

  useEffect(() => {
    setIsDesktopApp(Boolean(forceDesktop) || isMemoryOsDesktop());
  }, [forceDesktop]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [connectedTools, setConnectedTools] = useState<string[]>([]);
  const [briefBody, setBriefBody] = useState<string | undefined>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LabLayoutMode>(initialLayoutMode ?? "agent");
  const [fileChanges, setFileChanges] = useState<LabFileChange[]>([]);
  const [editorRepo, setEditorRepo] = useState<RepoRef | null>(null);
  const [localWorkspaceRoot, setLocalWorkspaceRoot] = useState<string | null>(null);
  const [savedPaths, setSavedPaths] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("memoryos-local-workspace");
    if (saved) setLocalWorkspaceRoot(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localWorkspaceRoot) {
      window.sessionStorage.setItem("memoryos-local-workspace", localWorkspaceRoot);
    } else {
      window.sessionStorage.removeItem("memoryos-local-workspace");
    }
  }, [localWorkspaceRoot]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialLayoutMode) return;
    const saved = window.sessionStorage.getItem("memoryos-lab-layout");
    if (saved === "agent" || saved === "editor") setLayoutMode(saved);
  }, [initialLayoutMode]);

  const handleBriefLoaded = useCallback(
    (loaded: ContinueBrief) => {
      onBriefLoaded(loaded);
      const body = [
        loaded.currentGoal ? `Goal: ${loaded.currentGoal}` : "",
        loaded.openBlockers?.length ? `Blockers: ${loaded.openBlockers.join("; ")}` : "",
        loaded.riskyFiles?.length ? `Risky: ${loaded.riskyFiles.join(", ")}` : "",
        loaded.nextBestAction ? `Next: ${loaded.nextBestAction}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      if (body) setBriefBody(body);
    },
    [onBriefLoaded],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("memoryos-lab-layout", layoutMode);
  }, [layoutMode]);

  const loadConnectors = useCallback(async () => {
    try {
      const token = await getOrCreateMemoryTokenWithRetry({ attempts: 2, delayMs: 200 });
      if (!token) return;
      const res = await fetch("/api/connector", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const payload = (await res.json()) as {
        data?: { connectors?: Array<{ type: string; status?: string }> };
        connectors?: Array<{ type: string; status?: string }>;
      };
      const connectors = payload.data?.connectors ?? payload.connectors ?? [];
      const connected = connectors.filter((c) => c.status === "connected");
      setGithubConnected(connected.some((c) => c.type === "github"));
      setConnectedTools(
        connected.map((c) => c.type.charAt(0).toUpperCase() + c.type.slice(1)),
      );
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    void loadConnectors();
    const timer = window.setInterval(() => void loadConnectors(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadConnectors]);

  const chatMessages = conversation.filter((m) => m.speaker !== "system");
  const showWelcome = chatMessages.length === 0 && !isChatLoading;
  const composerReady = hasActiveSession || Boolean(canStartSession);
  const activeAgentLabel =
    availableRuntimeAgents.find((a) => a.id === activeAgent)?.label ?? "MemoryOS";

  const labMessages: LabChatMessage[] = chatMessages.map((m) => ({
    speaker: m.speaker === "assistant" ? "assistant" : "user",
    text: m.text,
    createdAt: m.createdAt,
  }));

  const labMutations: LabMutationItem[] = useMemo(
    () =>
      (mutationHistory ?? []).map((m, i) => ({
        id: `${m.label}-${m.timestamp ?? i}`,
        label: m.label,
        detail: m.detail,
        timestamp: m.timestamp,
      })),
    [mutationHistory],
  );

  const threads: LabThreadItem[] = useMemo(() => {
    const fromTimeline = visibleTimeline.slice(0, 8).map((e) => ({
      id: e.id,
      title: e.eventType.replace(/_/g, " "),
      subtitle: e.reason.slice(0, 48),
      active: false,
    }));
    const goal = projectState.systemGoal?.trim();
    if (goal || hasActiveSession) {
      return [
        {
          id: "current",
          title: goal || "Current thread",
          subtitle: `${workspace} / ${project}`,
          active: true,
        },
        ...fromTimeline,
      ];
    }
    return fromTimeline;
  }, [visibleTimeline, projectState.systemGoal, hasActiveSession, workspace, project]);

  const threadTitle =
    projectState.systemGoal?.trim() ||
    chatMessages.find((m) => m.speaker === "user")?.text?.slice(0, 64) ||
    "Continuity Lab";
  const repoLabel = `${workspace} / ${project}`;
  const showDesktopHome = isDesktopApp && !localWorkspaceRoot && layoutMode === "editor";

  async function handleDesktopOpenFolder(): Promise<void> {
    const folder = await desktopOpenFolder();
    if (folder) setLocalWorkspaceRoot(folder);
  }

  const composer = (
    <ChatComposer
      chatInput={chatInput}
      onChatInputChange={onChatInputChange}
      onKeyDownSend={onKeyDownSend}
      onSendMessage={onSendMessage}
      onStartVoice={onStartVoice}
      onStopVoice={onStopVoice}
      isVoiceRecordingActive={isVoiceRecordingActive}
      hasActiveSession={hasActiveSession}
      isEnding={isEnding}
      isChatLoading={isChatLoading}
      composerReady={composerReady}
      isStartingSession={isStartingSession}
    />
  );

  const modelSelector = (
    <Select value={activeAgent} onValueChange={onActiveAgentChange}>
      <SelectTrigger
        disabled={!hasRuntimeAgents || isRuntimeAgentsLoading}
        className="h-8 gap-1 border border-white/10 bg-[#2f2f2f] px-2 text-xs text-[#ececec] shadow-none focus:ring-0 [&>svg]:opacity-70"
      >
        <SelectValue placeholder={isRuntimeAgentsLoading ? "Loading…" : activeAgentLabel} />
      </SelectTrigger>
      <SelectContent>
        {availableRuntimeAgents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const toolsPanel = (
    <div className="space-y-5">
      <ContinuityLabIntelligencePanel
        workspace={workspace}
        project={project}
        threadId={threadId}
        hasActiveSession={hasActiveSession}
        autoloadBrief={autobrief}
        embedGitHubExecution={false}
        onBriefLoaded={handleBriefLoaded}
        onAnalyzeRisk={onAnalyzeRisk}
      />

      <div className="space-y-2 border-t border-white/10 pt-4">
        <p className="text-xs text-[#8e8e8e]">Actions</p>
        <div className="flex flex-wrap gap-2">
          <ToolAction label="Handoff" onClick={onSwitchAgent} disabled={isSwitchingAgent} />
          <ToolAction label="Next step" onClick={onGenerateNextStep} disabled={isNextStepLoading} />
          <ToolAction label="Execute" onClick={onExecuteNextStep} disabled={isExecuting} />
          <ToolAction label="Send to IDE" onClick={onSendToIde} disabled={isSendingIdePacket} />
          <ToolAction
            label={`Skills ${applyCompanyBrainSkills ? "on" : "off"}`}
            onClick={onToggleCompanyBrainSkills}
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h3 className="text-sm text-[#ececec]">Project</h3>
        <div className="mt-3 space-y-2">
          <Input
            value={intakeGoal}
            onChange={(e) => onIntakeGoalChange(e.target.value)}
            placeholder="Goal"
            className="h-9 border-white/10 bg-[#2f2f2f] text-sm text-[#ececec]"
          />
          <Input
            value={intakeOwner}
            onChange={(e) => onIntakeOwnerChange(e.target.value)}
            placeholder="Owner"
            className="h-9 border-white/10 bg-[#2f2f2f] text-sm text-[#ececec]"
          />
          <Input
            value={intakeDeadline}
            onChange={(e) => onIntakeDeadlineChange(e.target.value)}
            placeholder="Deadline"
            className="h-9 border-white/10 bg-[#2f2f2f] text-sm text-[#ececec]"
          />
          <button
            type="button"
            onClick={onSubmitGoalIntake}
            disabled={!hasActiveSession || isChatLoading}
            className="w-full rounded-full bg-white py-2.5 text-sm font-medium text-[#212121] disabled:opacity-40"
          >
            Save goal
          </button>
        </div>
      </div>

      {billing ? (
        <div className="border-t border-white/10 pt-4">
          <UsageMeter usage={billing.usage} currentPlan={billing.currentPlan} compact />
        </div>
      ) : null}

      {canEnd ? (
        <button
          type="button"
          onClick={onEndConversation}
          disabled={isEnding}
          className="w-full py-2 text-sm text-red-400 hover:underline disabled:opacity-40"
        >
          {isEnding ? "Ending…" : "End chat"}
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      {(micError || errorMessage) && (
        <div className="fixed left-0 right-0 top-0 z-[80] bg-red-950/90 px-4 py-2 text-center text-sm text-red-200">
          {micError ?? errorMessage}
        </div>
      )}

      <ContinuityLabIdeWorkspace
        threadTitle={threadTitle}
        repoLabel={repoLabel}
        threads={threads}
        mutations={labMutations}
        toolsPanel={toolsPanel}
        toolsOpen={toolsOpen}
        onToolsOpenChange={onToolsOpenChange}
        reviewOpen={reviewOpen}
        onReviewOpenChange={setReviewOpen}
        agentOpen={agentOpen}
        onAgentOpenChange={setAgentOpen}
        onNewChat={onNewChat}
        githubConnected={githubConnected}
        briefBody={briefBody ?? projectState.systemGoal}
        onCommitClick={() => setReviewOpen(true)}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        fileChanges={fileChanges}
        editorRepo={editorRepo}
        agentPanel={
          <ContinuityLabAgentWindow
            workspace={workspace}
            project={project}
            threadId={threadId}
            hasActiveSession={hasActiveSession}
            autoloadBrief={autobrief}
            onBriefLoaded={handleBriefLoaded}
            onExplainPlan={onExplainPlan}
            connectedTools={connectedTools}
            messages={labMessages}
            mutations={labMutations}
            chatScrollRef={chatScrollRef}
            isChatLoading={isChatLoading}
            showWelcome={showWelcome}
            composer={composer}
            modelSelector={modelSelector}
            activeAgentLabel={activeAgentLabel}
            compactHeader={layoutMode === "editor"}
          />
        }
        localWorkspaceRoot={localWorkspaceRoot}
        onSavedToDisk={(path, content) => {
          setSavedPaths((s) => ({ ...s, [path]: content }));
        }}
        editorPanel={
          showDesktopHome ? (
            <ContinuityLabDesktopHome
              githubConnected={githubConnected}
              onOpenFolder={() => void handleDesktopOpenFolder()}
              onConnectGithub={() => onToolsOpenChange(true)}
            />
          ) : (
            <ContinuityLabEditorWorkbench
              githubConnected={githubConnected}
              localWorkspaceRoot={localWorkspaceRoot}
              onLocalWorkspaceRootChange={setLocalWorkspaceRoot}
              savedPaths={savedPaths}
              onFileChangesChange={setFileChanges}
              onRepoChange={setEditorRepo}
            />
          )
        }
      />
    </>
  );
}

function ToolAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#ececec] hover:bg-[#2f2f2f] disabled:opacity-40"
    >
      {label}
    </button>
  );
}

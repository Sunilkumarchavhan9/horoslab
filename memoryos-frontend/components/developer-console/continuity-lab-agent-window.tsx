"use client";

import type { ReactNode, RefObject } from "react";
import { ContinuityLabProjectPlan, type ContinueBrief } from "@/components/developer-console/continuity-lab-project-plan";
import type { LabChatMessage, LabMutationItem } from "@/components/developer-console/continuity-lab-ide-workspace";
function ActivityStack({ mutations }: { mutations: LabMutationItem[] }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#212121] p-2.5">
      <p className="text-[10px] text-[#8e8e8e]">Agent activity</p>
      <ul className="mt-1.5 space-y-1">
        {mutations.map((m) => (
          <li key={m.id} className="flex items-start gap-1.5 text-xs text-[#ececec]">
            <span className="text-[#10b981]">✓</span>
            <span>{m.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContinuityLabAgentWindow({
  workspace,
  project,
  threadId,
  hasActiveSession,
  autoloadBrief,
  onBriefLoaded,
  onExplainPlan,
  connectedTools,
  messages,
  mutations,
  chatScrollRef,
  isChatLoading,
  showWelcome,
  composer,
  modelSelector,
  activeAgentLabel,
  compactHeader,
}: {
  workspace: string;
  project: string;
  threadId: string;
  hasActiveSession: boolean;
  autoloadBrief?: boolean;
  onBriefLoaded?: (brief: ContinueBrief) => void;
  onExplainPlan?: () => void;
  connectedTools: string[];
  messages: LabChatMessage[];
  mutations: LabMutationItem[];
  chatScrollRef: RefObject<HTMLDivElement | null>;
  isChatLoading: boolean;
  showWelcome: boolean;
  composer: ReactNode;
  modelSelector: ReactNode;
  activeAgentLabel: string;
  compactHeader?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#212121]">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-3 py-2">
        <div>
          <p className="text-sm font-medium text-[#ececec]">Agents</p>
          {!compactHeader ? (
            <p className="text-[10px] text-[#8e8e8e]">Company Brain</p>
          ) : null}
        </div>
        {modelSelector}
      </div>

      <ContinuityLabProjectPlan
        workspace={workspace}
        project={project}
        threadId={threadId}
        hasActiveSession={hasActiveSession}
        autoloadBrief={autoloadBrief}
        onBriefLoaded={onBriefLoaded}
        onExplainPlan={onExplainPlan}
        connectedTools={connectedTools}
      />

      <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {showWelcome ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-[#ececec]">What should we work on?</p>
            <p className="text-xs leading-relaxed text-[#8e8e8e]">
              Read the project plan above, then ask to debug, implement, or propose a commit.
              Memory from Slack, Jira, and GitHub is already in context.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={`${message.createdAt}-${index}`}>
                {message.speaker === "user" ? (
                  <div className="rounded-2xl bg-[#2f2f2f] px-3 py-2 text-[14px] leading-relaxed text-[#ececec]">
                    {message.text}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[14px] leading-relaxed text-[#ececec]">{message.text}</p>
                    {index === messages.length - 1 && mutations.length > 0 ? (
                      <ActivityStack mutations={mutations.slice(0, 5)} />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            {isChatLoading ? (
              <p className="text-xs text-[#8e8e8e]">Working…</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.08] bg-[#212121] p-3">
        <p className="mb-1.5 text-[10px] text-[#6b6b6b]">{activeAgentLabel}</p>
        {composer}
      </div>
    </div>
  );
}

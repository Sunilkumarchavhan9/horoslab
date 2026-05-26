"use client";

import type { ReactNode } from "react";
import { ContinuityLabBrandMark } from "@/components/developer-console/continuity-lab-brand";
import { cn } from "@/lib/utils";

export function ContinuityLabChatShell({
  header,
  messages,
  composer,
  centerSlot,
  toolsOpen,
  onToolsOpenChange,
  toolsPanel,
  onNewChat,
  onOpenTools,
}: {
  header: ReactNode;
  messages: ReactNode;
  composer: ReactNode;
  centerSlot?: ReactNode;
  toolsOpen: boolean;
  onToolsOpenChange: (open: boolean) => void;
  toolsPanel: ReactNode;
  onNewChat?: () => void;
  onOpenTools?: () => void;
}) {
  const isCentered = Boolean(centerSlot);

  return (
    <div className="continuity-lab-chat relative flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#212121] font-sans text-[#ececec] antialiased">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#171717] md:flex">
        <div className="border-b border-white/10 px-4 py-4">
          <ContinuityLabBrandMark />
        </div>

        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal text-[#ececec] transition hover:bg-[#2f2f2f]"
          >
            <EditIcon />
            New chat
          </button>
          <button
            type="button"
            onClick={onOpenTools}
            className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal text-[#ececec] transition hover:bg-[#2f2f2f]"
          >
            <SearchIcon />
            Memory & tools
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <p className="px-3 py-1 text-xs font-medium text-[#8e8e8e]">Chats</p>
          <p className="rounded-lg px-3 py-2 text-sm font-normal text-[#ececec] hover:bg-[#2f2f2f]">
            Current session
          </p>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-3 py-2.5 md:border-b-0 md:py-3">
          <div className="md:hidden">
            <ContinuityLabBrandMark compact />
          </div>
          <div className="min-w-0 flex-1 md:flex md:justify-center">{header}</div>
          <button
            type="button"
            onClick={onOpenTools}
            className="rounded-lg p-2 text-[#8e8e8e] hover:bg-[#2f2f2f] md:hidden"
            aria-label="Memory and tools"
          >
            <PanelIcon />
          </button>
        </header>

        {isCentered ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-8">
            {centerSlot}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">{messages}</div>
            <div className="shrink-0 px-4 pb-6 pt-2">{composer}</div>
          </div>
        )}
      </div>

      {toolsOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60"
          aria-label="Close tools"
          onClick={() => onToolsOpenChange(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[380px] flex-col bg-[#212121] shadow-2xl transition-transform duration-200 ease-out",
          toolsOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm text-[#ececec]">Memory & tools</span>
          <button
            type="button"
            onClick={() => onToolsOpenChange(false)}
            className="rounded-lg p-2 text-[#8e8e8e] hover:bg-[#2f2f2f]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{toolsPanel}</div>
      </aside>
    </div>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

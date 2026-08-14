"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BarChart3,
  Copy,
  EyeOff,
  Focus,
  Globe,
  MoreHorizontal,
  Pin,
  RefreshCw,
  SquarePen,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { ContinuityLabSessionNetworkModal } from "@/components/continuity-lab/continuity-lab-session-network-modal";
import { ContinuityLabSessionTagsModal } from "@/components/continuity-lab/continuity-lab-session-tags-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatLabRelativeTime } from "@/lib/continuity-lab/format-relative-time";
import {
  archiveLabSession,
  displaySessionTitle,
  getLabSessionMeta,
  isLabSessionArchived,
  isLabSessionNetworkControlsEnabled,
  LAB_SESSION_STORAGE_EVENT,
  notifyLabSessionStorageChanged,
  setLabSessionTitle,
  terminateLabSession,
  toggleLabSessionPin,
  unarchiveLabSession,
} from "@/lib/continuity-lab/session-storage";
import type { LabSessionSummary } from "@/lib/continuity-lab/sessions";
import { cn } from "@/lib/utils";

export type SessionMenuStats = {
  userMessageCount: number;
  estimatedSizeKb: number;
  category?: string;
};

type ContinuityLabSessionMenuProps = {
  session: LabSessionSummary;
  stats?: SessionMenuStats;
  onUpdated?: () => void;
  onAnalyze?: () => void;
  onFocusMode?: () => void;
  focusModeActive?: boolean;
  triggerClassName?: string;
  align?: "start" | "end" | "center";
};

function formatSizeKb(kb: number): string {
  if (kb < 1) return "<1 KB";
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function focusShortcutLabel(): string {
  if (typeof navigator !== "undefined" && /Mac/i.test(navigator.platform)) {
    return "⌃⇧F";
  }
  return "Ctrl+Shift+F";
}

export function ContinuityLabSessionMenu({
  session,
  stats,
  onUpdated,
  onAnalyze,
  onFocusMode,
  focusModeActive = false,
  triggerClassName,
  align = "end",
}: ContinuityLabSessionMenuProps) {
  const router = useRouter();
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [metaVersion, setMetaVersion] = useState(0);

  const displayTitle = displaySessionTitle(session.id, session.title);
  const meta = getLabSessionMeta(session.id);
  void metaVersion;
  const isPinned = Boolean(meta.pinned);
  const isArchived = isLabSessionArchived(session.id);
  const networkControls = isLabSessionNetworkControlsEnabled(session.id);
  const category = stats?.category ?? meta.category;

  useEffect(() => {
    function bump() {
      setMetaVersion((n) => n + 1);
    }
    window.addEventListener(LAB_SESSION_STORAGE_EVENT, bump);
    return () => window.removeEventListener(LAB_SESSION_STORAGE_EVENT, bump);
  }, []);

  async function copySessionId() {
    try {
      await navigator.clipboard.writeText(session.id);
    } catch {
      // ignore
    }
  }

  function handleRename() {
    const next = window.prompt("Rename session", displayTitle);
    if (next === null) return;
    setLabSessionTitle(session.id, next);
    notifyLabSessionStorageChanged();
    onUpdated?.();
  }

  function handlePin() {
    toggleLabSessionPin(session.id);
    notifyLabSessionStorageChanged();
    onUpdated?.();
  }

  function handleArchive() {
    if (isArchived) {
      unarchiveLabSession(session.id);
    } else {
      archiveLabSession(session.id);
    }
    notifyLabSessionStorageChanged();
    onUpdated?.();
  }

  function handleDuplicate() {
    const params = new URLSearchParams();
    params.set("prefill", displayTitle);
    if (session.repo) params.set("repo", session.repo);
    if ((meta.tags?.length ?? 0) > 0) {
      params.set("tags", meta.tags!.join(","));
    }
    router.push(`/continuity-lab?${params.toString()}`);
  }

  function handleTerminate() {
    if (!window.confirm("End this session? You can start a new one from home.")) return;
    terminateLabSession(session.id);
    notifyLabSessionStorageChanged();
    onUpdated?.();
    router.push("/continuity-lab");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center text-white/50 hover:bg-[#141414] hover:text-white",
              triggerClassName,
            )}
            aria-label="Session options"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="min-w-[240px] border border-[#2F2F2F] bg-[#0d0d0d] p-1 text-white"
        >
          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => handleArchive()}
          >
            <Archive className="size-3.5" />
            {isArchived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => handlePin()}
          >
            <Pin className="size-3.5" />
            {isPinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => setTagsModalOpen(true)}
          >
            <Tag className="size-3.5" />
            Edit tags
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => void copySessionId()}
          >
            <Copy className="size-3.5" />
            Copy session ID
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => setNetworkModalOpen(true)}
          >
            <Globe className="size-3.5" />
            Update network config
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => handleRename()}
          >
            <SquarePen className="size-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white data-disabled:opacity-40"
            title="Team visibility requires org-scoped sessions (not available locally)"
          >
            <EyeOff className="size-3.5" />
            Hide from team
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#2F2F2F]" />

          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => handleDuplicate()}
          >
            <Users className="size-3.5" />
            Start duplicate session
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white"
            onSelect={() => onAnalyze?.()}
            disabled={!onAnalyze}
            title={onAnalyze ? undefined : "Open a session to analyze continuity"}
          >
            <BarChart3 className="size-3.5" />
            Analyze session
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#2F2F2F]" />

          <DropdownMenuItem
            disabled
            className="gap-2 text-white/85 focus:bg-[#141414] focus:text-white data-disabled:opacity-40"
            title="Sandbox reboot requires a runtime API (not wired in Continuity Lab yet)"
          >
            <RefreshCw className="size-3.5" />
            Reboot session
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2 text-rose-300 focus:bg-rose-500/15 focus:text-rose-200"
            onSelect={() => handleTerminate()}
          >
            <Trash2 className="size-3.5" />
            Terminate session
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#2F2F2F]" />

          <DropdownMenuItem
            className={cn(
              "gap-2 text-white/85 focus:bg-[#141414] focus:text-white",
              !onFocusMode && "data-disabled:opacity-40",
            )}
            disabled={!onFocusMode}
            title={
              onFocusMode
                ? focusModeActive
                  ? "Exit focus mode"
                  : "Hide tools rail and widen chat"
                : "Focus mode is available on an open session"
            }
            onSelect={() => onFocusMode?.()}
          >
            <Focus className="size-3.5" />
            {focusModeActive ? "Exit focus mode" : "Focus mode"}
            <span className="ml-auto text-[10px] text-white/30">{focusShortcutLabel()}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#2F2F2F]" />

          <DropdownMenuLabel className="px-2 py-2 text-[10px] font-normal leading-relaxed text-white/40">
            <span className="block text-white/55">Session insights</span>
            {stats ? (
              <>
                <span className="mt-1.5 block">
                  {stats.userMessageCount} user message
                  {stats.userMessageCount === 1 ? "" : "s"}
                </span>
                <span className="block">Transcript ~{formatSizeKb(stats.estimatedSizeKb)}</span>
              </>
            ) : (
              <span className="mt-1.5 block text-white/30">
                Open session for message stats
              </span>
            )}
            {category ? (
              <span className="mt-1 block truncate">Project: {category}</span>
            ) : null}
            <span className="mt-1.5 block truncate font-mono text-[9px] text-white/35">
              {session.id}
            </span>
            {session.repo ? (
              <span className="mt-0.5 block truncate text-white/35">{session.repo}</span>
            ) : null}
            {(meta.tags?.length ?? 0) > 0 ? (
              <span className="mt-0.5 block truncate">Tags: {meta.tags!.join(", ")}</span>
            ) : null}
            <span className="mt-0.5 block">
              {isPinned ? "Pinned · " : ""}
              {isArchived ? "Archived · " : ""}
              Network {networkControls ? "restricted" : "unrestricted (local pref)"}
            </span>
            <span className="mt-0.5 block">
              Updated {formatLabRelativeTime(session.updatedAt)}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>

      <ContinuityLabSessionTagsModal
        open={tagsModalOpen}
        sessionId={session.id}
        initialTags={meta.tags ?? []}
        onClose={() => setTagsModalOpen(false)}
        onSaved={() => {
          notifyLabSessionStorageChanged();
          onUpdated?.();
        }}
      />

      <ContinuityLabSessionNetworkModal
        open={networkModalOpen}
        sessionId={session.id}
        initialEnabled={networkControls}
        onClose={() => setNetworkModalOpen(false)}
        onSaved={() => {
          notifyLabSessionStorageChanged();
          onUpdated?.();
        }}
      />
    </>
  );
}

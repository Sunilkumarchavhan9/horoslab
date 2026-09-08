"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  Copy,
  Link2,
  Mic,
  MoreHorizontal,
  Plug,
  Send,
  Sparkles,
  ToggleLeft,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { improvePromptStub } from "@/lib/continuity-lab/improve-prompt";
import {
  readAutoApproveChildSessions,
  saveAutoApproveChildSessions,
} from "@/lib/continuity-lab/ask-child-sessions-preference";
import {
  readConfirmBeforeWork,
  saveConfirmBeforeWork,
} from "@/lib/continuity-lab/confirm-before-work";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ContinuityLabAskMoreMenuProps = {
  prompt: string;
  copyLinkBase?: string;
  onImprovePrompt: (next: string) => void;
  onInjectResumeBrief?: () => void;
  onAttachWiki?: () => void;
  disabled?: boolean;
};

const itemClass =
  "gap-2.5 rounded-none px-3 py-2 text-xs text-[#F0EFE2]/85 focus:bg-[#141414] focus:text-[#F0EFE2] data-disabled:text-[#F0EFE2]/30";

export function ContinuityLabAskMoreMenu({
  prompt,
  copyLinkBase = "/continuity-lab/ask",
  onImprovePrompt,
  onInjectResumeBrief,
  onAttachWiki,
  disabled,
}: ContinuityLabAskMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [confirmBeforeWork, setConfirmBeforeWork] = useState(false);

  useEffect(() => {
    setAutoApprove(readAutoApproveChildSessions());
    setConfirmBeforeWork(readConfirmBeforeWork());
  }, []);

  async function copyPromptLink() {
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}${copyLinkBase}`
        : copyLinkBase;
    const url = prompt.trim()
      ? `${base}?prefill=${encodeURIComponent(prompt.trim())}`
      : base;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function toggleAutoApprove() {
    const next = !autoApprove;
    setAutoApprove(next);
    saveAutoApproveChildSessions(next);
    setOpen(false);
  }

  function toggleConfirmBeforeWork() {
    const next = !confirmBeforeWork;
    setConfirmBeforeWork(next);
    saveConfirmBeforeWork(next);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#3A3A3A] bg-[#0A0A0A] text-[#F0EFE2]/70 hover:border-[#4A4A4A] hover:text-[#F0EFE2] disabled:opacity-40"
          aria-label="More options"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="z-50 min-w-[240px] w-72 border border-[#2F2F2F] bg-[#0A0A0A] p-1 text-[#F0EFE2] shadow-2xl !w-72"
      >
        <DropdownMenuItem asChild className={itemClass}>
          <Link
            href="/continuity-lab/settings/connections?tab=mcps"
            title="Manage MCP connectors"
          >
            <Plug className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
            Manage MCP connectors
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          title="Lightweight rewrite stub — not a full LLM editor yet"
          onSelect={() => {
            onImprovePrompt(improvePromptStub(prompt));
            setOpen(false);
          }}
        >
          <Wand2 className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          Improve prompt
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={itemClass}>
          <Link href="/continuity-lab/automations/new">
            <Calendar className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
            Schedule
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          onSelect={() => void copyPromptLink()}
        >
          {copied ? (
            <Copy className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          ) : (
            <Link2 className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          )}
          {copied ? "Link copied" : "Copy prompt as link"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          disabled
          title="Coming soon"
        >
          <Mic className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          Record voice prompt
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-3 bg-[#2F2F2F]" />
        <DropdownMenuItem
          className={itemClass}
          title="Saved locally — runtime approval gate not wired yet"
          onSelect={toggleAutoApprove}
        >
          <ToggleLeft className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          {autoApprove ? "Auto-approve child sessions (on)" : "Auto-approve child sessions"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          title="Restate your goal and wait for OK before the agent runs tools"
          onSelect={toggleConfirmBeforeWork}
        >
          <ClipboardCheck className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          {confirmBeforeWork
            ? "Confirm understanding before work (on)"
            : "Confirm understanding before work"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          disabled
          title="Coming soon — use Slack connector in settings"
        >
          <Send className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          Send to Slack Channel
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-3 bg-[#2F2F2F]" />
        <DropdownMenuItem
          className={itemClass}
          onSelect={() => {
            onInjectResumeBrief?.();
            setOpen(false);
          }}
        >
          <Sparkles className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          Inject resume brief
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          onSelect={() => {
            onAttachWiki?.();
            setOpen(false);
          }}
        >
          <BookOpen className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
          Attach operational wiki
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

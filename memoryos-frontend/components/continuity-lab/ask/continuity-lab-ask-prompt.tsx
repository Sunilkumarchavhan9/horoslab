"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  Bot,
  Brain,
  ChevronDown,
  FolderGit2,
  ImagePlus,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { labComposerClass } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";
import {
  readAskAgentType,
  saveAskAgentType,
  type AskAgentType,
} from "@/lib/continuity-lab/ask-agent-type";
import { ContinuityLabAskMoreMenu } from "@/components/continuity-lab/ask/continuity-lab-ask-more-menu";
import { ContinuityLabAskContextBar } from "@/components/continuity-lab/ask/continuity-lab-ask-context-bar";
import { ContinuityLabAskMemoryToggles } from "@/components/continuity-lab/ask/continuity-lab-ask-memory-toggles";
import {
  CONFIRM_BEFORE_WORK_CHANGED,
  readConfirmBeforeWork,
} from "@/lib/continuity-lab/confirm-before-work";

const AGENT_OPTIONS: Array<{
  id: AskAgentType;
  label: string;
  description: string;
  icon: typeof Bot;
}> = [
  {
    id: "agent",
    label: "Agent",
    description: "Default governed coding agent",
    icon: Bot,
  },
  {
    id: "continuity",
    label: "Continuity",
    description: "Memory-heavy — resume briefs and action memory first",
    icon: Brain,
  },
];

type ContinuityLabAskPromptProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  repoCount: number;
  selectedRepos?: string[];
  onOpenRepos: () => void;
  onInjectResumeBrief?: () => void;
  onAttachWiki?: () => void;
  onAttachmentNote?: (note: string | null) => void;
  advancedHref?: string;
  copyLinkBase?: string;
  hideContextBar?: boolean;
  showMemoryToggles?: boolean;
};

export function ContinuityLabAskPrompt({
  value,
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
  placeholder = "Ask MemoryOS about your codebase…",
  repoCount,
  selectedRepos = [],
  onOpenRepos,
  onInjectResumeBrief,
  onAttachWiki,
  onAttachmentNote,
  advancedHref,
  copyLinkBase,
  hideContextBar = false,
  showMemoryToggles = true,
}: ContinuityLabAskPromptProps) {
  const [agentType, setAgentType] = useState<AskAgentType>(() =>
    readAskAgentType(),
  );
  // Initialize to false to match server rendering. Read the user's persisted
  // preference after mount to avoid hydration mismatches between SSR and
  // client-side localStorage values.
  const [confirmBeforeWork, setConfirmBeforeWork] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeAgent =
    AGENT_OPTIONS.find((a) => a.id === agentType) ?? AGENT_OPTIONS[0];
  const ActiveAgentIcon = activeAgent.icon;

  useEffect(() => {
    function onConfirmPrefChanged() {
      setConfirmBeforeWork(readConfirmBeforeWork());
    }
    // Read persisted preference on mount and also subscribe to changes.
    onConfirmPrefChanged();
    window.addEventListener(CONFIRM_BEFORE_WORK_CHANGED, onConfirmPrefChanged);
    return () =>
      window.removeEventListener(
        CONFIRM_BEFORE_WORK_CHANGED,
        onConfirmPrefChanged,
      );
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !disabled && value.trim()) onSubmit();
    }
  }

  function handleFilePick(
    e: ChangeEvent<HTMLInputElement>,
    kind: "image" | "file",
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onAttachmentNote?.(
      `[${kind}] ${file.name} (${file.type || "unknown type"})`,
    );
  }

  return (
    <div className="w-full">
      <div className={labComposerClass}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          disabled={loading || disabled}
          placeholder={placeholder}
          className="min-h-[7.5rem] w-full resize-none bg-transparent px-5 pb-2 pt-5 text-[15px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50 sm:min-h-[8.5rem] sm:text-base"
        />

        <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-xs font-medium text-white/85 hover:bg-white/[0.09]"
                >
                  <ActiveAgentIcon className="size-3.5 text-[#6366F1]" />
                  {activeAgent.label}
                  <ChevronDown className="size-3 text-white/45" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                collisionPadding={12}
                className="z-50 min-w-[240px] !w-64 border border-white/[0.06] bg-[#1a1a1a] p-1 text-white shadow-xl"
              >
                {AGENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <DropdownMenuItem
                      key={opt.id}
                      className={cn(
                        "items-start gap-3 rounded-none px-3 py-2.5 text-left focus:bg-white/[0.06] focus:text-white",
                        agentType === opt.id && "bg-white/[0.06]",
                      )}
                      onSelect={() => {
                        setAgentType(opt.id);
                        saveAskAgentType(opt.id);
                      }}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-[#6366F1]" />
                      <span>
                        <span className="block text-xs font-semibold text-white">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-white/45">
                          {opt.description}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.09] hover:text-white"
                  aria-label="Add attachment"
                >
                  <Plus className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                collisionPadding={12}
                className="z-50 min-w-[208px] !w-52 border border-white/[0.06] bg-[#1a1a1a] p-1 text-white shadow-xl"
              >
                <DropdownMenuItem
                  className="gap-2 rounded-none px-3 py-2 text-xs text-white/80 focus:bg-white/[0.06] focus:text-white"
                  onSelect={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="size-3.5 text-white/50" />
                  Upload image
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 rounded-none px-3 py-2 text-xs text-white/80 focus:bg-white/[0.06] focus:text-white"
                  onSelect={onOpenRepos}
                >
                  <FolderGit2 className="size-3.5 text-white/50" />
                  Add files/repos
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 rounded-none px-3 py-2 text-xs text-white/80 focus:bg-white/[0.06] focus:text-white"
                  onSelect={() => fileInputRef.current?.click()}
                >
                  <Plus className="size-3.5 text-white/50" />
                  Attach file note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ContinuityLabAskMoreMenu
              prompt={value}
              copyLinkBase={copyLinkBase}
              onImprovePrompt={onChange}
              onInjectResumeBrief={onInjectResumeBrief}
              onAttachWiki={onAttachWiki}
              disabled={disabled || loading}
            />
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || disabled || !value.trim()}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0A0A0A] transition hover:bg-white/90 disabled:opacity-35"
            aria-label="Start session"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>

      {!hideContextBar ? (
        <>
          <ContinuityLabAskContextBar
            repoCount={repoCount}
            selectedRepos={selectedRepos}
            onOpenRepos={onOpenRepos}
            advancedHref={advancedHref ?? "/continuity-lab/capabilities"}
          />
          {showMemoryToggles ? (
            <ContinuityLabAskMemoryToggles
              className="mt-2"
              disabled={disabled || loading}
            />
          ) : null}
          {confirmBeforeWork ? (
            <p className="mt-2 text-[11px] text-white/45">
              Confirm-before-work is on — you&apos;ll review a short summary
              before the agent runs.
            </p>
          ) : null}
        </>
      ) : null}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFilePick(e, "image")}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFilePick(e, "file")}
      />
    </div>
  );
}

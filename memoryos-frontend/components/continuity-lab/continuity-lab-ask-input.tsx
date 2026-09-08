"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  ArrowUp,
  ChevronDown,
  FolderGit2,
  ImagePlus,
  ListTree,
  Mic,
  MessageCircleQuestion,
  Plus,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { AskMode } from "@/lib/continuity-lab/ask-storage";
import { ContinuityLabBranchSelect } from "@/components/continuity-lab/continuity-lab-branch-select";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: Array<{
  id: AskMode;
  label: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    id: "auto",
    label: "Auto",
    description: "Automatically select mode",
    icon: Wand2,
  },
  {
    id: "qa",
    label: "Q&A",
    description: "Answer questions about codebase",
    icon: MessageCircleQuestion,
  },
  {
    id: "plan",
    label: "Plan",
    description: "Create actionable plans for tasks",
    icon: ListTree,
  },
];

type ContinuityLabAskInputProps = {
  value: string;
  onChange: (value: string) => void;
  mode: AskMode;
  onModeChange: (mode: AskMode) => void;
  deep: boolean;
  onDeepChange: (deep: boolean) => void;
  repo: string | null;
  branch: string;
  defaultBranch?: string | null;
  onBranchChange: (branch: string) => void;
  onOpenRepoModal: () => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onAttachmentNote?: (note: string | null) => void;
  showRepoControls?: boolean;
};

export function ContinuityLabAskInput({
  value,
  onChange,
  mode,
  onModeChange,
  deep,
  onDeepChange,
  repo,
  branch,
  defaultBranch,
  onBranchChange,
  onOpenRepoModal,
  onSubmit,
  loading = false,
  disabled = false,
  placeholder = "Ask about your codebase with operational context",
  onAttachmentNote,
  showRepoControls = true,
}: ContinuityLabAskInputProps) {
  const [modeOpen, setModeOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeMode = MODE_OPTIONS.find((m) => m.id === mode) ?? MODE_OPTIONS[0];
  const ActiveModeIcon = activeMode.icon;

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!modeRef.current?.contains(e.target as Node)) setModeOpen(false);
      if (!plusRef.current?.contains(e.target as Node)) setPlusOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !disabled && value.trim()) onSubmit();
    }
  }

  function handleImagePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setPlusOpen(false);
    if (!file) return;
    onAttachmentNote?.(`[image] ${file.name} (${file.type || "unknown type"})`);
  }

  return (
    <div className="w-full">
      <div className={cn(subtlePanel(), "overflow-hidden rounded-[18px] border-[#2f2f2f] bg-[#1b1b1b]")}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          disabled={loading || disabled}
          placeholder={placeholder}
          className="min-h-[12rem] w-full resize-none bg-transparent px-5 pb-2 pt-5 text-base leading-relaxed text-[#F0EFE2] placeholder:text-[#F0EFE2]/45 focus:outline-none disabled:opacity-50"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div ref={modeRef} className="relative">
              <button
                type="button"
                onClick={() => setModeOpen((v) => !v)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 text-sm font-semibold text-orange-300 hover:bg-orange-400/15"
                aria-haspopup="menu"
                aria-expanded={modeOpen}
              >
                <ActiveModeIcon className="size-4 text-orange-300" />
                {deep ? "Deep · " : ""}
                {activeMode.label}
                <ChevronDown className="size-3.5 text-orange-200/70" />
              </button>

              {modeOpen ? (
                <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-[min(24.5rem,calc(100vw-2rem))] rounded-md border border-white/[0.08] bg-[#1d1d1d] p-2 shadow-2xl">
                  {MODE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onModeChange(opt.id);
                          setModeOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left hover:bg-white/[0.06]",
                          mode === opt.id && "bg-white/[0.06]",
                        )}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white/[0.06]">
                          <Icon className="size-4 text-[#F0EFE2]/80" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[#F0EFE2]">{opt.label}</span>
                          <span className="mt-1 block text-sm leading-snug text-[#F0EFE2]/45">
                            {opt.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  <div className="mx-2 my-2 border-t border-white/[0.06]" />
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-white/[0.04]">
                    <span>
                      <span className="block text-sm font-semibold text-[#F0EFE2]">Deep mode</span>
                      <span className="mt-1 block text-sm text-[#F0EFE2]/45">
                        More thorough answers with deeper reasoning
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={deep}
                      onChange={(e) => onDeepChange(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="relative h-6 w-10 rounded-full bg-white/[0.12] transition peer-checked:bg-[#3b82f6] peer-checked:[&>span]:translate-x-4">
                      <span className="absolute left-1 top-1 size-4 rounded-full bg-white transition" />
                    </span>
                  </label>
                </div>
              ) : null}
            </div>

            <div ref={plusRef} className="relative">
              <button
                type="button"
                onClick={() => setPlusOpen((v) => !v)}
                className="inline-flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-[#F0EFE2]/70 hover:bg-white/[0.09] hover:text-[#F0EFE2]"
                aria-label="Add attachment"
              >
                <Plus className="size-5" />
              </button>
              {plusOpen ? (
                <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-56 rounded-md border border-white/[0.08] bg-[#1d1d1d] py-2 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-[#F0EFE2]/80 hover:bg-white/[0.06]"
                  >
                    <ImagePlus className="size-4 text-[#F0EFE2]/60" />
                    Upload image
                  </button>
                  {showRepoControls ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPlusOpen(false);
                        onOpenRepoModal();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-[#F0EFE2]/80 hover:bg-white/[0.06]"
                    >
                      <FolderGit2 className="size-4 text-[#F0EFE2]/60" />
                      Add files/repos
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || disabled || !value.trim()}
            title={value.trim() ? "Start session" : "Voice input is not configured yet"}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition",
              value.trim()
                ? "bg-white text-[#0A0A0A] hover:bg-white/90 disabled:opacity-35"
                : "cursor-default bg-transparent text-[#F0EFE2]/45",
            )}
            aria-label={value.trim() ? "Start session" : "Voice input unavailable"}
          >
            {loading ? (
              <Sparkles className="size-4 animate-pulse" />
            ) : value.trim() ? (
              <ArrowUp className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
          </button>
        </div>
      </div>

      {showRepoControls ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 px-3 text-sm text-[#F0EFE2]/85">
          <button
            type="button"
            onClick={onOpenRepoModal}
            className="inline-flex h-8 max-w-[24rem] items-center gap-1.5 text-sm text-[#F0EFE2] hover:text-[#F0EFE2]/85"
          >
            <FolderGit2 className="size-4 shrink-0 text-[#F0EFE2]/75" />
            <span className="truncate">{repo ?? "Select repository"}</span>
          </button>
          {repo ? (
            <ContinuityLabBranchSelect
              value={branch}
              defaultBranch={defaultBranch}
              onChange={onBranchChange}
            />
          ) : null}
          {deep ? (
            <span className="inline-flex h-7 items-center rounded-md border border-orange-400/20 bg-orange-400/10 px-2 text-[10px] font-semibold uppercase tracking-wide text-orange-200">
              Deep
            </span>
          ) : null}
        </div>
      ) : null}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />
    </div>
  );
}

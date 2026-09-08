"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Mic, Plus, Send } from "lucide-react";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import type { LabSlashCommand } from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";
import { cn } from "@/lib/utils";

type ContinuityLabSessionChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  slashCommands?: LabSlashCommand[];
};

function slashQuery(value: string): string | null {
  const match = value.match(/^\/([a-z0-9-]*)$/i);
  if (!match) return null;
  return match[1].toLowerCase();
}

export function ContinuityLabSessionChatInput({
  value,
  onChange,
  onSubmit,
  sending = false,
  disabled = false,
  placeholder = "Ask Devin to build features, fix bugs, or work on your code",
  slashCommands = [],
}: ContinuityLabSessionChatInputProps) {
  const [highlightIndex, setHighlightIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const query = slashQuery(value);

  const suggestions = useMemo(() => {
    if (query === null || slashCommands.length === 0) return [];
    if (!query) return slashCommands.slice(0, 8);
    return slashCommands
      .filter(
        (c) =>
          c.name.toLowerCase().startsWith(query) ||
          c.description.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [query, slashCommands]);
  const activeSuggestionIndex =
    suggestions.length === 0
      ? 0
      : Math.min(highlightIndex, suggestions.length - 1);

  function applySuggestion(command: LabSlashCommand) {
    onChange(`/${command.name} `);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="relative shrink-0 bg-[#0A0A0A] px-2 pb-2 pt-2"
    >
      {suggestions.length > 0 ? (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Slash commands"
          className={cn(
            subtlePanel(),
            "absolute bottom-full left-1/2 z-20 mb-2 max-h-48 w-[min(46rem,calc(100%-1rem))] -translate-x-1/2 overflow-y-auto shadow-lg",
          )}
        >
          {suggestions.map((command, index) => (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === activeSuggestionIndex}
              className={cn(
                "flex w-full flex-col gap-0.5 border-b border-white/[0.06] px-3 py-2 text-left last:border-b-0",
                index === activeSuggestionIndex
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.05]",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(command);
              }}
            >
              <span className="font-mono text-sm text-[#F0EFE2]">
                /{command.name}
              </span>
              <span className="text-xs text-[#F0EFE2]/45">
                {command.description}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[46rem]">
        <div className="overflow-hidden rounded-[18px] border border-[#2B2F36] bg-[#15171C] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            disabled={disabled || sending}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent px-4 pb-2 pt-3 text-[14px] leading-6 text-[#F0EFE2] placeholder:text-[#F0EFE2]/42 focus:outline-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightIndex((i) =>
                    Math.min(i + 1, suggestions.length - 1),
                  );
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (
                  e.key === "Tab" ||
                  (e.key === "Enter" && !e.shiftKey && query !== null)
                ) {
                  const picked = suggestions[activeSuggestionIndex];
                  if (
                    picked &&
                    (e.key === "Tab" || value.trim() === `/${query}`)
                  ) {
                    e.preventDefault();
                    applySuggestion(picked);
                    return;
                  }
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onChange("");
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!sending && !disabled && value.trim()) onSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2 border-t border-[#2B2F36] px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md text-[#F0EFE2]/60 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                aria-label="Add"
              >
                <Plus className="size-4" />
              </button>
              <span className="rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[14px] font-medium leading-4 text-[#F0EFE2]/82">
                Agent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md text-[#F0EFE2]/55 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                aria-label="Microphone"
              >
                <Mic className="size-4" />
              </button>
              <button
                type="submit"
                disabled={sending || disabled || !value.trim()}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full transition",
                  value.trim()
                    ? "bg-[#A8AFB8] text-[#13161A] hover:bg-[#B7BEC7]"
                    : "bg-[#8B929B]/60 text-[#13161A]/70",
                  "disabled:opacity-70",
                )}
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DhyraShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dark?: boolean;
}

interface ShortcutRow {
  label: string;
  keys: string[];
}

interface ShortcutSection {
  title: string;
  rows: ShortcutRow[];
}

export function DhyraShortcutsDialog({
  open,
  onOpenChange,
  dark = true,
}: DhyraShortcutsDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        if (!open) {
          e.preventDefault();
          onOpenChange(true);
        }
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const sections: ShortcutSection[] = [
    {
      title: "Global",
      rows: [
        { label: "Open the command palette", keys: ["Ctrl", "K"] },
        { label: "Open keyboard shortcuts", keys: ["Shift", "/"] },
        { label: "Close keyboard shortcuts", keys: ["Esc"] },
      ],
    },
    {
      title: "Session",
      rows: [
        { label: "Previous session view", keys: ["Alt", "↑"] },
        { label: "Next session view", keys: ["Alt", "↓"] },
        { label: "Open the session command bar", keys: ["Ctrl", "Shift", "K"] },
      ],
    },
    {
      title: "Composer",
      rows: [{ label: "Focus the session composer", keys: ["/"] }],
    },
  ];

  return (
    <div
      onClick={() => onOpenChange(false)}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[14vh] backdrop-blur-[2px] p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[520px] border shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-xs rounded-xs cursor-default",
          dark ? "border-[#383838] bg-[#181818] text-[#F0EFE2]" : "border-[#a8b0a2] bg-white text-[#171a17]"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-start justify-between border-b p-4",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#e1e4df] bg-white"
        )}>
          <div>
            <h2 className={cn("text-sm font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
              Keyboard shortcuts
            </h2>
            <p className={cn("mt-0.5 text-xs", dark ? "text-[#C8C7BA]" : "text-[#687063]")}>
              A compact guide to the keyboard controls available here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "border px-2.5 py-1 text-xs cursor-pointer transition-colors rounded-xs",
              dark
                ? "border-[#383838] bg-[#222] text-[#C8C7BA] hover:border-white hover:text-[#F0EFE2]"
                : "border-[#d8ddd3] bg-[#f5f7f3] text-[#2a3028] hover:border-[#171a17] hover:text-[#171a17]"
            )}
          >
            Close
          </button>
        </div>

        {/* Sections */}
        <div className={cn("divide-y", dark ? "divide-[#282828]" : "divide-[#edf0eb]")}>
          {sections.map((section) => (
            <div key={section.title}>
              {/* Category banner */}
              <div className={cn(
                "px-4 py-1.5 font-mono text-[11px]",
                dark ? "bg-[#141414] text-[#889284]" : "bg-[#f0f2ee] text-[#6b7367]"
              )}>
                {section.title}
              </div>

              {/* Rows */}
              <div className={cn("divide-y", dark ? "divide-[#222] bg-[#181818]" : "divide-[#edf0eb] bg-white")}>
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 transition-colors",
                      dark ? "hover:bg-[#202020]" : "hover:bg-[#fafbfa]"
                    )}
                  >
                    <span className={dark ? "text-[#ddd]" : "text-[#171a17]"}>{row.label}</span>
                    <div className="flex items-center gap-1 font-mono">
                      {row.keys.map((k, i) => (
                        <span
                          key={i}
                          className={cn(
                            "border px-1.5 py-0.5 text-[10px] rounded-xs",
                            dark
                              ? "border-[#383838] bg-[#222] text-[#F0EFE2]"
                              : "border-[#d8ddd3] bg-[#f5f7f3] text-[#2a3028]"
                          )}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EpochShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutRow {
  label: string;
  keys: string[];
}

interface ShortcutSection {
  title: string;
  rows: ShortcutRow[];
}

export function EpochShortcutsDialog({
  open,
  onOpenChange,
}: EpochShortcutsDialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[14vh] backdrop-blur-[2px] p-4">
      <div className="w-full max-w-[520px] border border-[#a8b0a2] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-xs">
        {/* Header matching Screenshot 2 */}
        <div className="flex items-start justify-between border-b border-[#e1e4df] p-4 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-[#171a17]">
              Keyboard shortcuts
            </h2>
            <p className="mt-0.5 text-xs text-[#687063]">
              A compact guide to the keyboard controls available here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="border border-[#d8ddd3] bg-[#f5f7f3] px-2.5 py-1 text-xs text-[#2a3028] hover:border-[#171a17] hover:text-[#171a17] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Sections matching Screenshot 2 */}
        <div className="divide-y divide-[#edf0eb]">
          {sections.map((section) => (
            <div key={section.title}>
              {/* Category banner */}
              <div className="bg-[#f0f2ee] px-4 py-1.5 font-mono text-[11px] text-[#6b7367]">
                {section.title}
              </div>

              {/* Rows */}
              <div className="divide-y divide-[#edf0eb] bg-white">
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[#fafbfa]"
                  >
                    <span className="text-[#171a17]">{row.label}</span>
                    <div className="flex items-center gap-1 font-mono">
                      {row.keys.map((k, i) => (
                        <span
                          key={i}
                          className="border border-[#d8ddd3] bg-[#fafbfa] px-2 py-0.5 text-[11px] text-[#4b5247] shadow-sm"
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

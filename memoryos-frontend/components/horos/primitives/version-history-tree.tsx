"use client";

import React from "react";
import { GitCommit, Check, RotateCcw } from "lucide-react";
import { HorosBadge } from "../ui/horos-badge";
import { cn } from "@/lib/utils";

interface VersionNode {
  version: string;
  label: string;
  isActive: boolean;
  createdAt: string;
}

interface VersionHistoryTreeProps {
  history: VersionNode[];
  onSelectVersion?: (version: string) => void;
  dark?: boolean;
  className?: string;
}

export function VersionHistoryTree({
  history,
  onSelectVersion,
  dark = true,
  className,
}: VersionHistoryTreeProps) {
  return (
    <div className={cn(
      "border p-4 font-mono text-xs rounded-xs transition-colors",
      dark ? "border-[#2e2e2e] bg-[#202020] text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#171a17]",
      className
    )}>
      <div className={cn(
        "flex items-center justify-between border-b border-dashed pb-2.5",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <span className={cn(
          "font-sans text-xs font-semibold uppercase tracking-[0.14em]",
          dark ? "text-[#F0EFE2]" : "text-[#171a17]"
        )}>
          Lineage & Version Tree
        </span>
        <span className="text-[11px] text-[#788274]">
          {history.length} snapshots recorded
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {history.map((node, idx) => {
          const isLast = idx === history.length - 1;

          return (
            <div key={node.version} className="relative flex items-start gap-3">
              {/* Vertical branch line */}
              {!isLast ? (
                <div className={cn("absolute left-[11px] top-6 bottom-[-16px] w-[1px]", dark ? "bg-[#333]" : "bg-[#d8ddd3]")} />
              ) : null}

              {/* Node indicator */}
              <div
                className={cn(
                  "relative z-10 flex h-6 w-6 items-center justify-center border font-bold text-[10px] rounded-xs",
                  node.isActive
                    ? "border-[#75bf00] bg-[#75bf00] text-black"
                    : dark
                    ? "border-[#383838] bg-[#1a1a1a] text-[#C8C7BA]"
                    : "border-[#c9cec4] bg-[#fafbfa] text-[#6b7367]"
                )}
              >
                {node.isActive ? <Check size={12} strokeWidth={3} /> : <GitCommit size={12} />}
              </div>

              {/* Content */}
              <div className={cn(
                "flex flex-1 flex-wrap items-center justify-between gap-2 border-b border-dashed pb-2.5",
                dark ? "border-[#2e2e2e]" : "border-[#edf0eb]"
              )}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{node.version}</span>
                    {node.isActive ? (
                      <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] px-1.5 py-0.2 text-[10px] font-bold rounded-xs">
                        ACTIVE RUNTIME
                      </span>
                    ) : idx === 1 ? (
                      <span className={cn("border px-1.5 py-0.2 text-[10px] rounded-xs", dark ? "border-[#383838] text-[#C8C7BA]" : "border-[#d8ddd3] text-[#666]")}>
                        PREVIOUS STABLE
                      </span>
                    ) : null}
                  </div>
                  <p className={cn("mt-0.5 font-sans text-xs", dark ? "text-[#889084]" : "text-[#555d50]")}>{node.label}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#788274]">{node.createdAt}</span>
                  {!node.isActive && onSelectVersion ? (
                    <button
                      type="button"
                      onClick={() => onSelectVersion(node.version)}
                      className={cn(
                        "flex items-center gap-1 border px-2 py-0.5 text-[11px] font-sans rounded-xs transition-colors",
                        dark ? "border-[#383838] bg-[#1a1a1a] text-[#aaa] hover:text-[#F0EFE2] hover:border-[#555]" : "border-[#c9cec4] bg-white text-[#4b5247] hover:bg-[#f6f7f5]"
                      )}
                    >
                      <RotateCcw size={10} /> Rollback
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

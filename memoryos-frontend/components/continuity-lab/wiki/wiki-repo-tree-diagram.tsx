"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { RepoTreeDiagramNode } from "@/lib/continuity-lab/wiki-workspace";

type WikiRepoTreeDiagramProps = {
  nodes: RepoTreeDiagramNode[];
  focusPath?: string | null;
  className?: string;
};

const GROUP_STYLES: Record<
  NonNullable<RepoTreeDiagramNode["group"]>,
  { dot: string; label: string }
> = {
  frontend: { dot: "bg-indigo-400", label: "text-indigo-300/80" },
  backend: { dot: "bg-emerald-400", label: "text-emerald-300/80" },
  static: { dot: "bg-amber-400", label: "text-amber-300/80" },
  config: { dot: "bg-slate-400", label: "text-slate-300/80" },
};

export function WikiRepoTreeDiagram({ nodes, focusPath, className }: WikiRepoTreeDiagramProps) {
  const grouped = useMemo(() => {
    const byGroup = new Map<string, RepoTreeDiagramNode[]>();
    for (const node of nodes) {
      const key = node.group ?? "other";
      const list = byGroup.get(key) ?? [];
      list.push(node);
      byGroup.set(key, list);
    }
    return byGroup;
  }, [nodes]);

  if (!nodes.length) {
    return (
      <div className="rounded-md border border-dashed border-[#3A3A3A] bg-[#0D0D0D]/60 px-4 py-6 text-center">
        <p className="text-sm text-[#F0EFE2]/45">
          Connect GitHub and sync this repo to render repository structure.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-[#2F2F2F] bg-[#0D0D0D] p-4",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap gap-3 text-[10px] uppercase tracking-wide text-[#F0EFE2]/40">
        {(["frontend", "backend", "static", "config"] as const).map((group) => {
          const style = GROUP_STYLES[group];
          if (!grouped.has(group)) return null;
          return (
            <span key={group} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", style.dot)} />
              <span className={style.label}>{group}</span>
            </span>
          );
        })}
      </div>

      <div className="space-y-1 font-mono text-xs">
        {nodes.map((node) => {
          const isFocused = focusPath && node.path === focusPath;
          const groupStyle = node.group ? GROUP_STYLES[node.group] : null;
          return (
            <div
              key={node.id}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1",
                isFocused ? "bg-[#4338CA]/20 text-[#F0EFE2]" : "text-[#F0EFE2]/70",
              )}
              style={{ paddingLeft: `${8 + node.depth * 16}px` }}
            >
              {groupStyle ? (
                <span className={cn("size-1.5 shrink-0 rounded-full", groupStyle.dot)} />
              ) : (
                <span className="size-1.5 shrink-0 rounded-full bg-white/20" />
              )}
              <span className={cn(node.type === "dir" ? "text-[#F0EFE2]/90" : "text-[#F0EFE2]/60")}>
                {node.type === "dir" ? "▸ " : "· "}
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

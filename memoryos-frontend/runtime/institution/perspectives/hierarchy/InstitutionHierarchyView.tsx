"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight, Network, Building2, Folder, Users, Box, Target, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstitutionStore } from "../../store";
import { useInstitutionRuntimeData, type HierarchyNode as HierarchyNodeType } from "../../runtime/institution-runtime-data";

export function InstitutionHierarchyView() {
  const { selectEntity, selectedEntity } = useInstitutionStore();
  const { hierarchy, loading, error, refresh } = useInstitutionRuntimeData();

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
      <div className="flex items-center justify-between gap-3 px-8 py-6 border-b border-border dark:border-[#333]">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
            <Network className="size-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-none">Institution Hierarchy</h1>
            <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">Live institutional structure from the backend.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-[13px] text-muted-foreground">Loading live hierarchy...</div>
      ) : error ? (
        <div className="flex items-start gap-3 px-8 py-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <h3 className="text-[13px] font-bold uppercase tracking-wider">Backend unavailable</h3>
            <p className="text-[13px] mt-1 font-medium">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col w-full overflow-y-auto">
        {hierarchy ? (
          <HierarchyNode node={hierarchy} level={0} selectEntity={selectEntity} selectedEntity={selectedEntity} />
        ) : (
          <div className="p-8 text-[13px] text-muted-foreground">No institution hierarchy is available yet.</div>
        )}
      </div>
    </div>
  );
}

function HierarchyNode({
  node,
  level,
  selectEntity,
  selectedEntity,
}: {
  node: HierarchyNodeType;
  level: number;
  selectEntity: (id: string | null) => void;
  selectedEntity: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedEntity === node.id;
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const icon =
    node.type === "Business Unit" ? (
      <Building2 className="size-4 mr-3" />
    ) : node.type === "Department" ? (
      <Folder className="size-4 mr-3" />
    ) : node.type === "Team" ? (
      <Users className="size-4 mr-3" />
    ) : node.type === "Agent Pool" ? (
      <Box className="size-4 mr-3" />
    ) : (
      <Target className="size-4 mr-3" />
    );

  return (
    <div className="flex flex-col w-full">
      <div
        className={cn(
          "flex items-center gap-4 py-3 px-8 transition-colors cursor-pointer select-none border-b border-border dark:border-[#333]",
          isSelected ? "bg-muted/50 dark:bg-[#1a1a1a]" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50 bg-card dark:bg-[#111]",
        )}
        onClick={() => {
          if (hasChildren && isSelected) {
            setExpanded(!expanded);
          } else {
            selectEntity(node.id);
            if (!expanded) setExpanded(true);
          }
        }}
      >
        <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
          <div className="flex items-center justify-center size-5 text-muted-foreground dark:text-muted-foreground mr-2">
            {hasChildren ? <ChevronRight className={cn("size-4 transition-transform", expanded ? "rotate-90" : "")} /> : <span className="size-1 bg-[#ccc] dark:bg-[#555] rounded-full" />}
          </div>

          <span className={cn(isSelected ? "text-foreground dark:text-[#eee]" : "text-muted-foreground dark:text-muted-foreground")}>{icon}</span>

          <span className={cn("text-[14px] font-bold leading-none", isSelected ? "text-foreground dark:text-[#eee]" : "text-foreground/90 dark:text-[#ccc]")}>{node.name}</span>

          <span className="ml-4 text-[10px] font-mono uppercase text-muted-foreground dark:text-muted-foreground tracking-wide bg-[#eee] dark:bg-[#222] px-2 py-0.5">{node.type}</span>

          {node.status === "at_risk" && <AlertTriangle className="size-3.5 text-amber-500 ml-4" />}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="flex flex-col w-full">
          {node.children!.map((child) => (
            <HierarchyNode key={child.id} node={child} level={level + 1} selectEntity={selectEntity} selectedEntity={selectedEntity} />
          ))}
        </div>
      )}
    </div>
  );
}

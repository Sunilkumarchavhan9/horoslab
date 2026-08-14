"use client";

import { Database, Lock, Target, Box, Activity, GitCommit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstitutionStore } from "../store";
import { useInstitutionRuntimeData, type HierarchyNode } from "../runtime/institution-runtime-data";

function findHierarchyNode(node: HierarchyNode | null, id: string): HierarchyNode | null {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findHierarchyNode(child, id);
    if (found) return found;
  }
  return null;
}

export function InstitutionInspector() {
  const { selectedEntity } = useInstitutionStore();
  const { identity, genome, governance, hierarchy, institution, versions, missions, integrations, memoryRecords } = useInstitutionRuntimeData();

  const selectedItem =
    identity.capabilities.find((capability) => capability.id === selectedEntity) ??
    identity.dependencies.find((dependency) => dependency.id === selectedEntity) ??
    genome.find((trait) => trait.id === selectedEntity) ??
    governance.find((policy) => policy.id === selectedEntity) ??
    (selectedEntity ? findHierarchyNode(hierarchy, selectedEntity) : null);

  return (
    <div className="w-[320px] border-l border-border bg-muted/50 flex flex-col p-6 overflow-y-auto font-sans">
      {!selectedEntity ? (
        <div className="flex flex-col gap-6 animate-in fade-in">
          <div className="flex flex-col gap-1 border-b border-border pb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Evolution Timeline</h3>
            <p className="text-[12px] text-muted-foreground">How we arrived at {institution?.version ?? "the current live institution"}</p>
          </div>

          <div className="flex flex-col gap-0 relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-[#eee]" />
            {[
              { v: institution?.version ?? "live", label: institution?.name ?? "Institution selected", date: institution?.updatedAt ?? institution?.createdAt, icon: Lock, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
              { v: `${versions.length} versions`, label: "Backend version history", date: versions[0]?.createdAt, icon: GitCommit, color: "text-foreground", bg: "bg-card border-border" },
              { v: `${missions.length} missions`, label: "Live mission coverage", date: missions[0]?.updatedAt, icon: Target, color: "text-foreground", bg: "bg-card border-border" },
              { v: `${integrations.length} integrations`, label: "Connected live sources", date: integrations[0]?.updatedAt, icon: Activity, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            ].map((ev, i) => (
              <div key={i} className="flex gap-4 relative z-10 py-3">
                <div className={cn("size-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5", ev.bg)}>
                  <ev.icon className={cn("size-3", ev.color)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono text-muted-foreground">{ev.v}</span>
                  <span className="text-[13px] text-foreground leading-tight mt-0.5">{ev.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-1">{ev.date ? new Date(ev.date).toLocaleDateString() : "Unknown"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col gap-2 border-b border-border pb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cross-Runtime Impact</h3>
            <h2 className="text-lg font-bold text-foreground leading-none">{selectedItem?.name ?? "Selected item"}</h2>
            <span className="text-[10px] font-mono text-muted-foreground bg-[#eee] px-2 py-0.5 rounded w-fit uppercase">{selectedItem?.id ?? selectedEntity}</span>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Related missions</h4>
            <div className="flex flex-col gap-2">
              {missions.slice(0, 2).map((mission) => (
                <div key={mission.id} className="border border-border bg-card p-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-[#0f52ff]" />
                    <span className="text-[12px] font-medium text-foreground">{mission.title ?? mission.objective ?? "Mission"}</span>
                  </div>
                  <span className={cn("size-2 rounded-full", mission.state === "failed" ? "bg-rose-500" : "bg-emerald-500")} />
                </div>
              ))}
              {missions.length === 0 && <div className="text-[12px] text-muted-foreground">No missions are linked to the current institution.</div>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Affected integrations</h4>
            <div className="border border-border bg-card p-3 rounded-md flex flex-col gap-2">
              {integrations.slice(0, 3).map((integration) => (
                <div key={integration.id} className="flex items-center gap-2">
                  <Box className="size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-foreground">{integration.provider ?? integration.id ?? "Integration"}</span>
                    <span className="text-[10px] text-muted-foreground">{integration.provider ?? "provider"} • {integration.status ?? "unknown"}</span>
                  </div>
                </div>
              ))}
              {integrations.length === 0 && <div className="text-[12px] text-muted-foreground">No integrations are attached.</div>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Reality Nodes</h4>
            <div className="flex flex-wrap gap-2">
              {memoryRecords.slice(0, 3).map((record) => (
                <span key={record.id} className="border border-border bg-card px-2 py-1 rounded text-[11px] text-muted-foreground flex items-center gap-1">
                  <Database className="size-3" /> {record.summary ?? record.id}
                </span>
              ))}
              {memoryRecords.length === 0 && (
                <span className="border border-border bg-card px-2 py-1 rounded text-[11px] text-muted-foreground flex items-center gap-1">
                  <Database className="size-3" /> No memory records yet
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

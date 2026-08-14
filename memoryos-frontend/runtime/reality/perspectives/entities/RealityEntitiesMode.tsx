"use client";

import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { Server, Database, Cloud, FileText, GitCommit, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Beta view: keep the entity story focused on the software release mission.
const entities = [
  { id: "e1", category: "software", type: "Repository", name: "memoryos-core", status: "healthy", owner: "GitHub" },
  { id: "e2", category: "software", type: "Event Store", name: "Reality Event Store", status: "healthy", owner: "Reality Runtime" },
  { id: "e3", category: "software", type: "Mission", name: "Software Release Mission", status: "healthy", owner: "Mission Control" },
  { id: "e4", category: "software", type: "Evidence", name: "Release Evidence Pack", status: "healthy", owner: "Execution" },
  { id: "e5", category: "software", type: "Verification", name: "PASS / FAIL Verification", status: "healthy", owner: "Verification" },
  { id: "e6", category: "software", type: "Learning", name: "Learning Artifact", status: "healthy", owner: "MemoryOS" },
];

const renderIcon = (type: string) => {
  switch (type) {
    case "Repository": return <GitCommit className="size-4" />;
    case "Event Store": return <Database className="size-4" />;
    case "Mission": return <Sparkles className="size-4" />;
    case "Evidence": return <FileText className="size-4" />;
    case "Verification": return <ShieldCheck className="size-4" />;
    case "Learning": return <Cloud className="size-4" />;
    default: return <Cloud className="size-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    case "warning": return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
    case "error": return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
    default: return "text-foreground bg-muted";
  }
};

export function RealityEntitiesMode() {
  return (
    <div className="absolute inset-0 bg-card dark:bg-[#111] overflow-y-auto p-8 custom-sidebar-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Reality Entities</h1>
          <p className="text-sm text-muted-foreground">Track the live software-release mission entities that feed the beta demo. Physical simulation entities stay hidden until we actively switch into that mode.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Software Release Story</h2>
            <div className="space-y-3">
              {entities.map((entity) => (
                <div key={entity.id} className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg hover:border-border/80 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 bg-card rounded-md border border-border shrink-0">
                      {renderIcon(entity.type)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{entity.name}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{entity.type} &bull; {entity.owner}</div>
                    </div>
                  </div>
                  <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0", getStatusColor(entity.status))}>
                    {entity.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Beta Guardrail</h2>
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-card border border-border flex items-center justify-center">
                  <ShieldCheck className="size-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Physical demo nodes are hidden</div>
                  <div className="text-xs text-muted-foreground">We only surface the software-release institution until we intentionally switch to the physical-world template.</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-3.5" />
                One mission spine: Connect → Sync → Plan → Execute → Evidence → Verify → Settle → Learn
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

GlobalRealityRegistry.register({
  id: 'entities',
  title: 'Reality Entities',
  component: RealityEntitiesMode,
});

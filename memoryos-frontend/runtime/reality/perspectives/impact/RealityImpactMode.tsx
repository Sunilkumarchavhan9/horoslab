"use client";

import { useRealityStore } from "../../runtime/store";
import { Search, AlertTriangle, ShieldAlert, GitCommit, Database, CheckCircle2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { RealityEntityType } from "../../entities/types";

// --- Mock Data ---
const IMPACTS = [
 { id: "imp_1", sourceNode: "memoryos-core", sourceName: "memoryos-core", type: "repository" as RealityEntityType, impactCount: 14, severity: "critical", desc: "A commit here affects 3 databases, 2 services, and 9 downstream missions." },
 { id: "imp_2", sourceNode: "auth-service", sourceName: "Auth Service", type: "service" as RealityEntityType, impactCount: 5, severity: "high", desc: "Restarting this service triggers re-authentication across 4 dependent systems." },
 { id: "imp_3", sourceNode: "users-db", sourceName: "Users DB", type: "database" as RealityEntityType, impactCount: 2, severity: "low", desc: "Schema changes localized to backup pipelines." },
];

export function RealityImpactMode() {
 const { selection, setSelection, searchQuery } = useRealityStore();

 const filteredImpacts = IMPACTS.filter(imp => 
 imp.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
 
 <div className="flex items-center justify-between px-8 py-6 border-b border-border dark:border-[#333]">
 <div className="flex items-center gap-3">
 <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
 <AlertTriangle className="size-4" />
 </div>
 <div>
 <h1 className="text-[18px] font-bold leading-none">Impact Analysis</h1>
 <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">Simulate changes and predict downstream consequences before deploying.</p>
 </div>
 </div>
 
 <button className="flex items-center gap-2 px-4 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[13px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors">
 <AlertTriangle className="size-4" /> Run Simulation
 </button>
 </div>

 <div className="flex flex-col w-full overflow-y-auto divide-y divide-[#eee] dark:divide-[#333]">
 
 <div className="flex items-center px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground w-1/4">Source</span>
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground w-1/6">Severity</span>
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex-1">Impact Radius</span>
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground w-[80px] text-right">Affected</span>
 </div>

 {filteredImpacts.map(imp => {
 const isActive = selection?.id === imp.sourceNode;
 return (
 <div 
 key={imp.id}
 onClick={() => setSelection({ type: imp.type, id: imp.sourceNode, sourceView: 'impact' })}
 className={`flex items-center px-8 py-6 cursor-pointer transition-colors group ${
 isActive ? "bg-muted/50 dark:bg-[#1a1a1a]" : "bg-card dark:bg-[#111] hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 }`}
 >
 <div className="flex items-center gap-4 w-1/4">
 <div className={cn("p-2 shrink-0 flex items-center justify-center", 
 imp.severity === "critical" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : 
 imp.severity === "high" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : 
 "bg-[#eee] dark:bg-[#222] text-muted-foreground dark:text-muted-foreground"
 )}>
 {imp.type === 'repository' ? <GitCommit className="size-4" /> : imp.type === 'database' ? <Database className="size-4" /> : <CheckCircle2 className="size-4" />}
 </div>
 <span className={`text-[15px] font-bold truncate transition-colors ${
 isActive ? "text-foreground dark:text-[#eee]" : "text-foreground/90 dark:text-[#ccc] group-hover:text-blue-600 dark:group-hover:text-blue-400"
 }`}>
 {imp.sourceName}
 </span>
 </div>
 
 <div className="w-1/6 flex items-center">
 <span className={cn(
 "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
 imp.severity === "critical" ? "bg-red-500 text-white" : 
 imp.severity === "high" ? "bg-amber-500 text-white" : 
 "bg-[#eee] dark:bg-[#222] text-muted-foreground dark:text-muted-foreground"
 )}>
 {imp.severity}
 </span>
 </div>
 
 <div className="flex-1 text-[14px] font-medium text-muted-foreground dark:text-muted-foreground pr-4">
 {imp.desc}
 </div>

 <div className="w-[80px] text-right">
 <span className="text-[16px] font-bold font-mono text-foreground dark:text-[#eee]">{imp.impactCount}</span>
 </div>
 </div>
 );
 })}
 
 {filteredImpacts.length === 0 && (
 <div className="px-8 py-12 text-center text-muted-foreground dark:text-muted-foreground text-[13px] font-medium">
 No impact analysis found matching "{searchQuery}"
 </div>
 )}
 </div>
 </div>
 );
}

GlobalRealityRegistry.register({
 id: 'impact',
 title: 'Impact Analysis',
 component: RealityImpactMode,
});

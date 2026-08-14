"use client";

import { useAgentStore } from "../store";
import { Brain, Activity, Target, ShieldCheck, Box } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentInspector() {
 const { selectedEntity, registry, capabilities, leases } = useAgentStore();

 const selectedAgent = registry.find(a => a.id === selectedEntity);
 const selectedCapability = capabilities.find(c => c.id === selectedEntity);

 return (
 <div className="w-[320px] border-l border-border bg-muted/50 flex flex-col p-6 overflow-y-auto font-sans">
 
 {!selectedEntity ? (
 <div className="flex flex-col gap-6 animate-in fade-in">
 <div className="flex flex-col gap-1 border-b border-border pb-4">
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Agent Context</h3>
 <p className="text-[12px] text-muted-foreground">Select an agent or capability to view operational details.</p>
 </div>
 
 <div className="flex flex-col gap-4 text-center mt-10 opacity-50">
 <Brain className="size-10 mx-auto text-muted-foreground" />
 <p className="text-[13px] text-muted-foreground">Waiting for selection...</p>
 </div>
 </div>
 ) : selectedAgent ? (
 <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
 <div className="flex flex-col gap-2 border-b border-border pb-4">
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Identity Context</h3>
 <h2 className="text-lg font-bold text-foreground leading-none">{selectedAgent.name}</h2>
 <span className="text-[10px] font-mono text-muted-foreground bg-[#eee] px-2 py-0.5 rounded w-fit uppercase">{selectedAgent.id}</span>
 </div>

 <div className="flex flex-col gap-4">
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Active Leases (1)</h4>
 <div className="border border-border bg-card p-3 rounded-md flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Target className="size-4 text-[#0f52ff]" />
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-foreground">msn-rotate-github</span>
 <span className="text-[10px] font-mono text-muted-foreground">lse-1029</span>
 </div>
 </div>
 <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
 </div>
 </div>

 <div className="flex flex-col gap-4">
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Current Operations</h4>
 <div className="border border-border bg-card p-3 rounded-md flex items-center gap-2">
 <Activity className="size-4 text-muted-foreground" />
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-foreground">Revoking Tokens</span>
 <span className="text-[10px] text-muted-foreground">Progress: 42%</span>
 </div>
 </div>
 </div>
 
 </div>
 ) : selectedCapability ? (
 <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
 <div className="flex flex-col gap-2 border-b border-border pb-4">
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Capability Context</h3>
 <h2 className="text-lg font-bold text-foreground leading-none">{selectedCapability.name}</h2>
 <span className="text-[10px] font-mono text-muted-foreground bg-[#eee] px-2 py-0.5 rounded w-fit uppercase">{selectedCapability.id}</span>
 </div>

 <div className="flex flex-col gap-4">
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Capable Agents (2)</h4>
 <div className="flex flex-col gap-2">
 <div className="border border-border bg-card p-3 rounded-md flex items-center gap-2">
 <Box className="size-4 text-muted-foreground" />
 <span className="text-[12px] font-medium text-foreground">Security Agent #42</span>
 </div>
 <div className="border border-border bg-card p-3 rounded-md flex items-center gap-2">
 <Box className="size-4 text-muted-foreground" />
 <span className="text-[12px] font-medium text-foreground">Security Agent #11</span>
 </div>
 </div>
 </div>
 </div>
 ) : null}

 </div>
 );
}

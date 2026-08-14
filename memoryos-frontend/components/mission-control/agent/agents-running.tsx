"use client";

import React from "react";
import { Activity, Clock, Terminal, Zap, ShieldCheck, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader, AgentStatusBadge, MOCK_AGENTS } from "./agent-shared-components";

export function AgentsRunning() {
 const runningAgents = MOCK_AGENTS.filter(a => a.status === "RUNNING" || a.status === "WAITING" || a.status === "REVIEWING");

 return (
 <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-8 bg-card dark:bg-[#050505] text-foreground dark:text-white">
 <SectionHeader 
 title="Live Operations" 
 description="Real-time telemetry and execution tracing for all active agents."
 action={
 <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-md text-[12px] font-bold">
 <span className="relative flex h-2 w-2 mr-1">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
 </span>
 LIVE
 </div>
 }
 />

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-[1600px]">
 {/* Left Col: Running Agents Grid */}
 <div className="xl:col-span-2 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {runningAgents.map((agent) => (
 <div key={agent.id} className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] overflow-hidden flex flex-col group hover:border-[#0f52ff]/50 transition-colors cursor-pointer relative">
 {/* Status Bar Indicator */}
 <div className={cn(
 "absolute top-0 left-0 w-full h-1",
 agent.status === "RUNNING" ? "bg-emerald-500" :
 agent.status === "WAITING" ? "bg-amber-500" :
 agent.status === "REVIEWING" ? "bg-[#0f52ff]" : "bg-black/20 dark:bg-white/20"
 )} />
 
 <div className="p-6 border-b border-border dark:border-white/5">
 <div className="flex items-start justify-between mb-4">
 <div className="flex flex-col">
 <h3 className="text-[16px] font-bold tracking-tight">{agent.name}</h3>
 <span className="text-[12px] text-foreground/50 dark:text-white/50">{agent.institution} • Mission {agent.currentMission}</span>
 </div>
 <AgentStatusBadge status={agent.status} />
 </div>
 
 {/* Telemetry Sparks */}
 <div className="grid grid-cols-3 gap-2">
 <div className="flex flex-col p-2 rounded bg-muted dark:bg-white/5 border border-border dark:border-white/5">
 <div className="flex items-center gap-1 text-foreground/50 dark:text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">
 <Cpu className="size-3" /> CPU
 </div>
 <span className="text-[13px] font-mono font-medium">{Math.floor(Math.random() * 40 + 10)}%</span>
 </div>
 <div className="flex flex-col p-2 rounded bg-muted dark:bg-white/5 border border-border dark:border-white/5">
 <div className="flex items-center gap-1 text-foreground/50 dark:text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">
 <Activity className="size-3" /> Tokens
 </div>
 <span className="text-[13px] font-mono font-medium">{(Math.random() * 10).toFixed(1)}k/s</span>
 </div>
 <div className="flex flex-col p-2 rounded bg-muted dark:bg-white/5 border border-border dark:border-white/5">
 <div className="flex items-center gap-1 text-foreground/50 dark:text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">
 <Clock className="size-3" /> Runtime
 </div>
 <span className="text-[13px] font-mono font-medium">02:14:45</span>
 </div>
 </div>
 </div>

 {/* Live Step Tracker */}
 <div className="p-6 bg-muted/50 dark:bg-white/[0.02] flex flex-col gap-3">
 <div className="flex items-center justify-between text-[11px] font-bold text-foreground/40 dark:text-white/40 uppercase tracking-wider">
 <span>Current Execution Step</span>
 <span className="text-[#0f52ff]">Step 4/7</span>
 </div>
 
 <div className="flex items-center gap-2">
 <div className="size-6 rounded bg-[#0f52ff]/10 text-[#0f52ff] flex items-center justify-center shrink-0">
 <Terminal className="size-3.5" />
 </div>
 <div className="flex-1 truncate text-[13px] font-mono text-foreground/80 dark:text-white/80">
 {agent.status === "REVIEWING" ? "> Waiting for manual approval on PR #442..." : "> Generating system architecture diagram..."}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Graph Visualization */}
 <div className="h-[300px] rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] p-6 flex items-center justify-center relative overflow-hidden">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,82,255,0.05)_0%,transparent_70%)]" />
 <div className="flex items-center gap-8 z-10">
 {/* Nodes */}
 <div className="flex flex-col items-center gap-2 animate-pulse">
 <div className="size-16 rounded-md bg-card dark:bg-[#121212] border border-border dark:border-white/10 flex items-center justify-center text-[#0f52ff]">
 <Zap className="size-6" />
 </div>
 <span className="text-[11px] font-bold uppercase tracking-wider">Planner</span>
 </div>
 
 <div className="w-16 h-0.5 bg-[#0f52ff]/30 relative">
 <div className="absolute inset-0 bg-[#0f52ff] w-1/2 animate-[ping_1.5s_infinite]" />
 </div>

 <div className="flex flex-col items-center gap-2">
 <div className="size-16 rounded-md bg-[#0f52ff]/10 border border-[#0f52ff]/30 shadow-[0_0_15px_rgba(15,82,255,0.2)] flex items-center justify-center text-[#0f52ff]">
 <Cpu className="size-6" />
 </div>
 <span className="text-[11px] font-bold uppercase tracking-wider text-[#0f52ff]">Claude Core</span>
 </div>

 <div className="w-16 h-0.5 bg-black/10 dark:bg-white/10" />

 <div className="flex flex-col items-center gap-2 opacity-50">
 <div className="size-16 rounded-md bg-card dark:bg-[#121212] border border-border dark:border-white/10 flex items-center justify-center text-foreground/50 dark:text-white/50">
 <ShieldCheck className="size-6" />
 </div>
 <span className="text-[11px] font-bold uppercase tracking-wider">Verifier</span>
 </div>
 </div>
 </div>
 </div>

 {/* Right Col: Global Event Stream */}
 <div className="flex flex-col rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] overflow-hidden h-[750px]">
 <div className="p-6 border-b border-border dark:border-white/10 bg-muted dark:bg-white/5 shrink-0 flex items-center justify-between">
 <h3 className="text-[14px] font-bold tracking-tight flex items-center gap-2">
 <Terminal className="size-4" /> Global Stream
 </h3>
 <span className="text-[11px] font-mono text-foreground/50 dark:text-white/50">Follow</span>
 </div>
 
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-1 font-mono text-[12px]">
 {/* Stream Items */}
 <div className="py-2 text-foreground/60 dark:text-white/60">
 <span className="text-[#0f52ff] mr-2">[09:14:02]</span>
 [agt_plan_02] Discovered 14 new endpoints to test
 </div>
 <div className="py-2 text-foreground/60 dark:text-white/60">
 <span className="text-[#0f52ff] mr-2">[09:14:05]</span>
 [agt_rev_01] Commencing review of PR #442...
 </div>
 <div className="py-2 text-amber-500">
 <span className="text-amber-500/70 mr-2">[09:14:12]</span>
 [agt_sec_03] WAITING on human approval (Rate limit reached)
 </div>
 <div className="py-2 text-foreground/60 dark:text-white/60">
 <span className="text-[#0f52ff] mr-2">[09:14:15]</span>
 [agt_plan_02] Generated execution graph (12 nodes)
 </div>
 <div className="py-2 text-emerald-500">
 <span className="text-emerald-500/70 mr-2">[09:14:18]</span>
 [agt_rev_01] Found 0 vulnerabilities. Approval passed.
 </div>
 {Array.from({length: 20}).map((_, i) => (
 <div key={i} className="py-2 text-foreground/40 dark:text-white/30">
 <span className="mr-2 opacity-50">[09:13:{59 - i}]</span>
 [system] Node heartbeat OK
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}

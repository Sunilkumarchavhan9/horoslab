"use client";

import React from "react";
import { Cpu, Zap, Activity, Clock, Terminal, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, ExecutionStatusBadge, MOCK_EXECUTION_NODES } from "./execution-shared-components";

export function ExecutionWorkers() {
 const workers = MOCK_EXECUTION_NODES.filter(n => n.type !== "approval" && n.type !== "verify");

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#050505] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar className="border-b-0" />

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col gap-8">
 <SectionHeader 
 title="Workers Execution" 
 description="Live telemetry for all active and pending execution threads."
 />

 {/* Top Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
 {workers.map(worker => (
 <div key={worker.id} className="bg-card dark:bg-[#0a0a0a] border border-border dark:border-white/10 rounded-md overflow-hidden flex flex-col group">
 <div className={cn(
 "h-1 w-full",
 worker.status === "RUNNING" ? "bg-[#0f52ff]" :
 worker.status === "COMPLETED" ? "bg-emerald-500" : "bg-black/10 dark:bg-white/10"
 )} />
 <div className="p-6 flex flex-col gap-6">
 <div className="flex justify-between items-start">
 <div className="flex flex-col">
 <span className="text-[14px] font-bold">{worker.name}</span>
 <span className="text-[11px] text-foreground/50 dark:text-[#F0EFE2]/50">{worker.agent}</span>
 </div>
 <ExecutionStatusBadge status={worker.status as any} />
 </div>
 
 <div className="grid grid-cols-2 gap-2 mt-2">
 <div className="flex flex-col gap-1 p-2 bg-muted dark:bg-white/5 rounded-md">
 <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40 flex items-center gap-1"><Cpu className="size-3" /> CPU</span>
 <span className="text-[12px] font-mono">{worker.status === "RUNNING" ? "42%" : "0%"}</span>
 </div>
 <div className="flex flex-col gap-1 p-2 bg-muted dark:bg-white/5 rounded-md">
 <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40 flex items-center gap-1"><Clock className="size-3" /> Time</span>
 <span className="text-[12px] font-mono">{worker.duration}</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Center Live Graph */}
 <div className="flex flex-col rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] overflow-hidden">
 <div className="p-6 border-b border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <h3 className="text-[13px] font-bold tracking-tight">Live Execution Graph</h3>
 </div>
 <div className="h-[250px] relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_0%,transparent_100%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]">
 <div className="flex items-center gap-6 relative z-10">
 {MOCK_EXECUTION_NODES.map((node, i) => {
 const isLast = i === MOCK_EXECUTION_NODES.length - 1;
 return (
 <React.Fragment key={node.id}>
 <div className="flex flex-col items-center gap-2 group">
 <div className={cn(
 "size-14 rounded-md flex items-center justify-center border transition-all duration-500",
 node.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
 node.status === "RUNNING" ? "bg-[#0f52ff]/10 border-[#0f52ff]/50 text-[#0f52ff] shadow-[0_0_20px_rgba(15,82,255,0.2)] animate-pulse" :
 "bg-card dark:bg-[#121212] border-border dark:border-white/10 text-foreground/30 dark:text-[#F0EFE2]/30"
 )}>
 {node.type === "planner" && <Zap className="size-6" />}
 {node.type === "research" && <Activity className="size-6" />}
 {node.type === "coding" && <Terminal className="size-6" />}
 {node.type === "review" && <CheckCircle2 className="size-6" />}
 {node.type === "approval" && <ShieldCheck className="size-6" />}
 {node.type === "verify" && <ShieldCheck className="size-6" />}
 </div>
 <span className={cn(
 "text-[10px] font-bold uppercase tracking-wider",
 node.status === "RUNNING" ? "text-[#0f52ff]" : "text-foreground/50 dark:text-[#F0EFE2]/50"
 )}>{node.name}</span>
 </div>
 
 {!isLast && (
 <div className="w-12 h-0.5 bg-black/10 dark:bg-white/10 relative overflow-hidden">
 {node.status === "COMPLETED" && <div className="absolute inset-0 bg-emerald-500" />}
 {node.status === "RUNNING" && <div className="absolute inset-0 w-1/2 bg-[#0f52ff] animate-[ping_1s_infinite]" />}
 </div>
 )}
 </React.Fragment>
 );
 })}
 </div>
 </div>
 </div>

 {/* Bottom Streaming Logs */}
 <div className="flex-1 flex flex-col rounded-md border border-border dark:border-white/10 bg-[#1e1e1e] overflow-hidden min-h-[300px]">
 <div className="p-3 border-b border-white/10 bg-black/20 flex justify-between items-center text-[#F0EFE2]">
 <span className="text-[12px] font-mono font-bold flex items-center gap-2">
 <Terminal className="size-4" /> Global Execution Stream
 </span>
 <div className="flex items-center gap-2">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
 </span>
 <span className="text-[10px] uppercase font-bold text-[#F0EFE2]/50 tracking-widest">Live</span>
 </div>
 </div>
 <div className="flex-1 p-6 font-mono text-[12px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
 <div className="text-[#F0EFE2]/50"><span className="text-[#0f52ff]">11:20:00</span> [system] Mission #193 initialized</div>
 <div className="text-[#F0EFE2]/50"><span className="text-[#0f52ff]">11:20:02</span> [node_1:planner] Analyzing mission objectives</div>
 <div className="text-emerald-400"><span className="text-emerald-400/50">11:20:14</span> [node_1:planner] Strategy generated. Graph constructed.</div>
 <div className="text-[#F0EFE2]/50"><span className="text-[#0f52ff]">11:20:15</span> [node_2:research] Spinning up Claude 3.5 Sonnet container</div>
 <div className="text-[#F0EFE2]/50"><span className="text-[#0f52ff]">11:20:18</span> [node_2:research] Reading 12 files from src/components</div>
 <div className="text-emerald-400"><span className="text-emerald-400/50">11:21:00</span> [node_2:research] Context extracted successfully. Output generated.</div>
 <div className="text-[#0f52ff] animate-pulse"><span className="text-[#0f52ff]/50">11:21:02</span> [node_3:coding] Commencing refactor execution...</div>
 <div className="text-[#F0EFE2]/80"><span className="text-[#0f52ff]">11:21:10</span> [node_3:coding] &gt; Editing src/components/button.tsx</div>
 <div className="text-[#F0EFE2]/80"><span className="text-[#0f52ff]">11:21:45</span> [node_3:coding] &gt; Editing src/lib/utils.ts</div>
 {Array.from({length: 10}).map((_, i) => (
 <div key={i} className="text-[#F0EFE2]/30"><span className="opacity-50 text-[#0f52ff]">11:22:{String(i).padStart(2, '0')}</span> [system] Node heartbeat OK</div>
 ))}
 </div>
 </div>

 </div>
 </div>
 );
}

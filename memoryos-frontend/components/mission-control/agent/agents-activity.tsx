"use client";

import React from "react";
import { Activity, Clock, Zap, Target, FileJson, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, SplitPane } from "./agent-shared-components";

export function AgentsActivity() {
 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#0a0a0a] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar className="border-b-0" />
 
 <div className="flex-1 overflow-hidden">
 <SplitPane 
 rightWidth="350px"
 left={
 <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-8 bg-card dark:bg-[#050505]">
 <SectionHeader 
 title="Activity & Metrics" 
 description="Global telemetry on agent operations, execution times, and capability usage."
 />

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 {[
 { label: "Actions Today", value: "14,293", icon: <Zap className="size-4" />, color: "text-[#0f52ff]" },
 { label: "Tool Calls", value: "8,402", icon: <FileJson className="size-4" />, color: "text-amber-500" },
 { label: "Evidence Saved", value: "1.2k", icon: <ShieldCheck className="size-4" />, color: "text-emerald-500" },
 { label: "Failures", value: "24", icon: <AlertTriangle className="size-4" />, color: "text-red-500" },
 ].map(m => (
 <div key={m.label} className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] flex flex-col gap-2 relative overflow-hidden group">
 <div className="flex justify-between items-start relative z-10">
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50 font-bold uppercase tracking-wider">{m.label}</span>
 <div className={cn("p-2 rounded bg-muted dark:bg-white/5", m.color)}>
 {m.icon}
 </div>
 </div>
 <span className="text-[28px] font-bold tracking-tight relative z-10">{m.value}</span>
 {/* Mock sparkline */}
 <svg className="absolute bottom-0 left-0 w-full h-1/2 opacity-10 group-hover:opacity-20 transition-opacity" viewBox="0 0 100 20" preserveAspectRatio="none">
 <path d="M0,20 L10,15 L20,18 L30,5 L40,12 L50,8 L60,18 L70,2 L80,10 L90,15 L100,0 L100,20 Z" className={cn("fill-current", m.color)} />
 </svg>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Heatmap Mock */}
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] p-6 flex flex-col gap-6">
 <div className="flex flex-col">
 <h3 className="text-[14px] font-bold">Activity Heatmap</h3>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">Most active operating hours</span>
 </div>
 <div className="grid grid-cols-12 gap-1 h-32">
 {Array.from({length: 12}).map((_, col) => (
 <div key={col} className="flex flex-col gap-1 justify-end">
 {Array.from({length: 7}).map((_, row) => {
 const intensity = Math.random();
 return (
 <div 
 key={row} 
 className={cn(
 "w-full rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-[#0f52ff]/50",
 intensity > 0.8 ? "bg-[#0f52ff]" : 
 intensity > 0.5 ? "bg-[#0f52ff]/60" : 
 intensity > 0.2 ? "bg-[#0f52ff]/30" : "bg-muted dark:bg-white/5"
 )}
 style={{ height: 'calc(100% / 7)' }}
 title={`Hour ${col * 2}: ${Math.floor(intensity * 100)} ops`}
 />
 );
 })}
 </div>
 ))}
 </div>
 <div className="flex justify-between text-[10px] font-mono text-foreground/40 dark:text-[#F0EFE2]/40">
 <span>00:00</span>
 <span>12:00</span>
 <span>24:00</span>
 </div>
 </div>

 {/* Token Usage Mock */}
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] p-6 flex flex-col gap-6">
 <div className="flex flex-col">
 <h3 className="text-[14px] font-bold">Compute Utilization</h3>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">Tokens / CPU cycles across institutions</span>
 </div>
 <div className="flex-1 flex items-end gap-2 px-6 pb-2 border-l border-b border-border dark:border-white/10 relative">
 <div className="w-1/4 bg-emerald-500/80 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: '60%' }} title="Engineering" />
 <div className="w-1/4 bg-amber-500/80 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: '85%' }} title="Security" />
 <div className="w-1/4 bg-[#0f52ff]/80 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: '30%' }} title="HR" />
 <div className="w-1/4 bg-purple-500/80 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: '45%' }} title="Finance" />
 </div>
 <div className="flex justify-between px-6 text-[10px] font-bold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40">
 <span>Eng</span>
 <span>Sec</span>
 <span>HR</span>
 <span>Fin</span>
 </div>
 </div>
 </div>
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#0a0a0a]">
 <div className="p-6 border-b border-border dark:border-white/10 shrink-0 bg-card dark:bg-[#121212]">
 <h3 className="text-[16px] font-bold tracking-tight">Recent Audit Events</h3>
 <p className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50 mt-1">Chronological log of agent actions</p>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px before:h-full before:w-px before:bg-black/10 dark:before:bg-card/10">
 {[
 { agent: "Claude Reviewer", action: "Opened PR #443", time: "10 mins ago", type: "success" },
 { agent: "Security Verifier", action: "Passed Pen Test", time: "15 mins ago", type: "success" },
 { agent: "Epoch Planner", action: "Generated Execution Graph", time: "1 hr ago", type: "info" },
 { agent: "Onboarding Coordinator", action: "Failed to send email (Timeout)", time: "3 hrs ago", type: "error" },
 { agent: "Claude Reviewer", action: "Requested Capability Lease", time: "4 hrs ago", type: "warning" },
 ].map((event, i) => (
 <div key={i} className="relative flex gap-6 z-10">
 <div className={cn(
 "size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 bg-card dark:bg-[#121212]",
 event.type === "success" ? "border-emerald-500 text-emerald-500" :
 event.type === "error" ? "border-red-500 text-red-500" :
 event.type === "warning" ? "border-amber-500 text-amber-500" :
 "border-[#0f52ff] text-[#0f52ff]"
 )}>
 {event.type === "success" && <CheckCircle2 className="size-3" />}
 {event.type === "error" && <AlertTriangle className="size-3" />}
 {event.type === "warning" && <Clock className="size-3" />}
 {event.type === "info" && <Target className="size-3" />}
 </div>
 <div className="flex flex-col bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md p-3 w-full ">
 <div className="flex items-center justify-between mb-1">
 <span className="text-[12px] font-bold text-foreground dark:text-[#F0EFE2]">{event.agent}</span>
 <span className="text-[10px] text-foreground/40 dark:text-[#F0EFE2]/40 font-mono">{event.time}</span>
 </div>
 <span className="text-[13px] text-foreground/70 dark:text-[#F0EFE2]/70">{event.action}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 }
 />
 </div>
 </div>
 );
}

"use client";

import React, { useState } from "react";
import { Search, Plus, Target, CheckCircle2, Circle, Clock, Zap, Cpu, History, MessageSquare, ListTree, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, SplitPane, ExecutionStatusBadge, MOCK_EXECUTION_NODES } from "./execution-shared-components";

export function ExecutionPlanner({ onViewNode }: { onViewNode?: (id: string) => void }) {
 const [selectedNode, setSelectedNode] = useState<string | null>(null);

 const handleNodeClick = (id: string) => {
 setSelectedNode(id);
 onViewNode?.(id);
 };

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#0a0a0a] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-6 w-1/2">
 <span className="text-[13px] font-bold text-foreground dark:text-[#F0EFE2] flex items-center gap-2">
 <Target className="size-4" />
 Mission #193
 </span>
 <span className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50 border-l border-border dark:border-white/10 pl-4">
 Strategy Canvas
 </span>
 </div>
 <div className="flex items-center gap-3">
 <ExecutionStatusBadge status="RUNNING" />
 </div>
 </CommandBar>

 <div className="flex-1 overflow-hidden">
 <SplitPane 
 rightWidth="320px"
 left={
 <div className="relative w-full h-full bg-card dark:bg-[#050505] overflow-auto custom-scrollbar flex items-center justify-center p-8">
 {/* Dot Grid Background */}
 <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
 
 {/* Planner Canvas / Tree Visualization */}
 <div className="relative flex flex-col items-center gap-8 z-10 w-full max-w-2xl py-12">
 {MOCK_EXECUTION_NODES.map((node, index) => {
 const isFirst = index === 0;
 const isLast = index === MOCK_EXECUTION_NODES.length - 1;
 
 return (
 <div key={node.id} className="relative flex flex-col items-center w-full">
 {/* Edge to previous node */}
 {!isFirst && (
 <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-black/10 dark:bg-white/10 -translate-x-1/2">
 {node.status === "RUNNING" && (
 <div className="w-full bg-[#0f52ff] absolute top-0 bottom-1/2 animate-[ping_1.5s_infinite]" />
 )}
 {node.status === "COMPLETED" && (
 <div className="w-full bg-emerald-500 absolute inset-0" />
 )}
 </div>
 )}

 {/* Node Card */}
 <div 
 onClick={() => handleNodeClick(node.id)}
 className={cn(
 "w-full max-w-sm rounded-md border p-6 bg-card dark:bg-[#121212] transition-all cursor-pointer group hover:",
 selectedNode === node.id 
 ? "border-[#0f52ff] ring-1 ring-[#0f52ff]/50" 
 : node.status === "RUNNING"
 ? "border-[#0f52ff]/50 dark:border-[#0f52ff]/50 shadow-[0_0_20px_rgba(15,82,255,0.1)]"
 : node.status === "COMPLETED"
 ? "border-emerald-500/30"
 : "border-border dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
 )}
 >
 <div className="flex items-start justify-between mb-3">
 <div className="flex flex-col">
 <h3 className="text-[14px] font-bold tracking-tight text-foreground dark:text-[#F0EFE2] group-hover:text-[#0f52ff] transition-colors">{node.name}</h3>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">{node.agent}</span>
 </div>
 <div className={cn(
 "size-6 rounded-full border-2 flex items-center justify-center shrink-0",
 node.status === "COMPLETED" ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" :
 node.status === "RUNNING" ? "border-[#0f52ff] text-[#0f52ff] bg-[#0f52ff]/10 animate-pulse" :
 "border-black/20 dark:border-white/20 text-foreground/30 dark:text-[#F0EFE2]/30"
 )}>
 {node.status === "COMPLETED" ? <CheckCircle2 className="size-3.5" /> : 
 node.status === "RUNNING" ? <Zap className="size-3.5" /> : 
 <Circle className="size-3.5" />}
 </div>
 </div>

 <div className="flex items-center justify-between text-[11px] font-mono border-t border-border dark:border-white/5 pt-3 mt-3">
 <span className={cn(
 node.status === "COMPLETED" ? "text-emerald-500" :
 node.status === "RUNNING" ? "text-[#0f52ff]" :
 "text-foreground/40 dark:text-[#F0EFE2]/40"
 )}>
 {node.status}
 </span>
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40 flex items-center gap-1">
 <Clock className="size-3" /> {node.duration}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#121212]">
 <div className="p-6 border-b border-border dark:border-white/10 shrink-0">
 <h3 className="text-[16px] font-bold tracking-tight">Plan Steps</h3>
 <p className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50 mt-1">Linear execution strategy</p>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
 <div className="relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-px before:bg-black/10 dark:before:bg-card/10">
 {MOCK_EXECUTION_NODES.map((node, i) => (
 <div key={node.id} className="relative flex items-start gap-6 mb-8 last:mb-0 z-10 group">
 <div className={cn(
 "size-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-card dark:bg-[#121212] transition-colors cursor-pointer",
 node.status === "COMPLETED" ? "border-emerald-500 text-emerald-500" :
 node.status === "RUNNING" ? "border-[#0f52ff] text-[#0f52ff]" :
 "border-border dark:border-white/10 text-foreground/30 dark:text-[#F0EFE2]/30 group-hover:border-black/30 dark:group-hover:border-white/30"
 )}>
 {i + 1}
 </div>
 <div className="flex flex-col pt-1.5 cursor-pointer" onClick={() => handleNodeClick(node.id)}>
 <span className={cn("text-[13px] font-bold transition-colors", selectedNode === node.id ? "text-[#0f52ff]" : "text-foreground dark:text-[#F0EFE2]")}>{node.name}</span>
 <span className="text-[11px] text-foreground/50 dark:text-[#F0EFE2]/50">{node.agent}</span>
 
 {node.status === "COMPLETED" && (
 <div className="mt-3 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-md flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
 <CheckCircle2 className="size-3" /> Evidence Generated
 </div>
 )}
 {node.status === "RUNNING" && (
 <div className="mt-3 p-2 bg-[#0f52ff]/5 border border-[#0f52ff]/10 rounded-md flex items-center gap-2 text-[11px] font-mono text-[#0f52ff]">
 <Loader2 className="size-3 animate-spin" /> Analyzing 18 files...
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 }
 />
 </div>
 </div>
 );
}

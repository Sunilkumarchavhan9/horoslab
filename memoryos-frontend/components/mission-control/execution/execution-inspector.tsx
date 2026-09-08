"use client";

import React, { useState } from "react";
import { X, Activity, Settings2, FileJson, Database, History, Cpu, Server, Network, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutionStatusBadge, MOCK_EXECUTION_NODES } from "./execution-shared-components";

export function ExecutionInspector({ id, onClose }: { id: string, onClose: () => void }) {
 const [activeTab, setActiveTab] = useState<"Overview" | "Evidence" | "Logs" | "Payload">("Overview");
 
 const node = MOCK_EXECUTION_NODES.find(n => n.id === id) || MOCK_EXECUTION_NODES[0];

 return (
 <div className="absolute inset-0 bg-card dark:bg-[#0a0a0a] z-50 flex flex-col font-sans animate-in slide-in-from-right-8 duration-300">
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/10 shrink-0 bg-card dark:bg-[#050505]">
 <div className="flex items-center gap-6">
 <button 
 onClick={onClose}
 className="p-2 rounded-md hover:bg-accent dark:hover:bg-card/5 text-foreground/60 dark:text-[#F0EFE2]/60 hover:text-foreground dark:hover:text-[#F0EFE2] transition-colors"
 >
 <X className="size-5" />
 </button>
 <div className="flex flex-col">
 <h2 className="text-[20px] font-bold text-foreground dark:text-[#F0EFE2] tracking-tight">{node.name}</h2>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">{node.agent}</span>
 </div>
 <div className="ml-4 pl-4 border-l border-border dark:border-white/10">
 <ExecutionStatusBadge status={node.status as any} />
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-2 px-8 py-0 border-b border-border dark:border-white/10 bg-card dark:bg-[#121212] shrink-0">
 {[
 { id: "Overview", icon: <Activity className="size-3.5" /> },
 { id: "Evidence", icon: <Database className="size-3.5" /> },
 { id: "Logs", icon: <History className="size-3.5" /> },
 { id: "Payload", icon: <FileJson className="size-3.5" /> },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "flex items-center gap-2 px-6 py-3 text-[13px] font-medium border-b-2 transition-colors relative top-[1px]",
 activeTab === tab.id 
 ? "border-[#0f52ff] text-foreground dark:text-[#F0EFE2]" 
 : "border-transparent text-foreground/50 dark:text-[#F0EFE2]/50 hover:text-foreground dark:hover:text-[#F0EFE2] hover:border-black/20 dark:hover:border-white/20"
 )}
 >
 {tab.icon}
 {tab.id}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="flex-1 overflow-hidden flex relative">
 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
 {activeTab === "Overview" && (
 <div className="grid grid-cols-2 gap-8 max-w-4xl">
 {/* Identity Info */}
 <div className="col-span-2 md:col-span-1 space-y-6">
 <div>
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3">Node Identity</h3>
 <div className="bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-md p-6 space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Assigned Agent</span>
 <span className="text-[13px] font-bold text-foreground dark:text-[#F0EFE2]">{node.agent}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Node Type</span>
 <span className="text-[13px] font-mono text-foreground dark:text-[#F0EFE2]">{node.type}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Duration</span>
 <span className="text-[13px] font-mono text-foreground dark:text-[#F0EFE2]">{node.duration}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Dependencies */}
 <div className="col-span-2 md:col-span-1 space-y-6">
 <div>
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3">Dependencies</h3>
 {node.deps.length === 0 ? (
 <div className="text-[13px] text-foreground/40 dark:text-[#F0EFE2]/40 italic p-6 border border-dashed border-border dark:border-white/10 rounded-md">
 No dependencies. This node runs at the start of the graph.
 </div>
 ) : (
 <div className="flex flex-col gap-2">
 {node.deps.map(dep => (
 <div key={dep} className="flex items-center justify-between p-3 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <span className="text-[13px] font-mono">{dep}</span>
 <CheckCircle2 className="size-4 text-emerald-500" />
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {activeTab === "Payload" && (
 <div className="max-w-4xl h-full flex flex-col">
 <div className="bg-[#050505] rounded-md p-6 font-mono text-[13px] text-emerald-400 overflow-auto flex-1 shadow-inner">
 <pre>
{`{
 "mission_id": "m_193",
 "node_id": "${node.id}",
 "type": "${node.type}",
 "assigned_agent": "${node.agent}",
 "input": {
 "context_files": ["src/components/button.tsx"],
 "instruction": "Refactor to use React Server Components"
 },
 "metadata": {
 "started_at": "2026-07-25T11:20:00Z",
 "timeout": 300000
 }
}`}
 </pre>
 </div>
 </div>
 )}

 {["Evidence", "Logs"].includes(activeTab) && (
 <div className="flex items-center justify-center h-full text-foreground/40 dark:text-[#F0EFE2]/40 text-[14px]">
 {activeTab} stream attached
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

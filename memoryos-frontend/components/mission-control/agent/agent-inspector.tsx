"use client";

import React, { useState } from "react";
import { X, Activity, Settings2, FileJson, Database, History, Cpu, Server, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentStatusBadge, MOCK_AGENTS } from "./agent-shared-components";

export function AgentInspector({ id, onClose }: { id: string, onClose: () => void }) {
 const [activeTab, setActiveTab] = useState<"Overview" | "Runtime" | "Skills" | "Evidence" | "Audit">("Overview");
 
 const agent = MOCK_AGENTS.find(a => a.id === id) || MOCK_AGENTS[0];

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
 <h2 className="text-[20px] font-bold text-foreground dark:text-[#F0EFE2] tracking-tight">{agent.name}</h2>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">{agent.provider}</span>
 </div>
 <div className="ml-4 pl-4 border-l border-border dark:border-white/10">
 <AgentStatusBadge status={agent.status} />
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-2 px-8 py-0 border-b border-border dark:border-white/10 bg-card dark:bg-[#121212] shrink-0">
 {[
 { id: "Overview", icon: <Activity className="size-3.5" /> },
 { id: "Runtime", icon: <Cpu className="size-3.5" /> },
 { id: "Skills", icon: <Settings2 className="size-3.5" /> },
 { id: "Evidence", icon: <Database className="size-3.5" /> },
 { id: "Audit", icon: <History className="size-3.5" /> },
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
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3">Identity</h3>
 <div className="bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-md p-6 space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Institution</span>
 <span className="text-[13px] font-bold text-foreground dark:text-[#F0EFE2]">{agent.institution}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Role</span>
 <span className="text-[13px] font-bold text-foreground dark:text-[#F0EFE2]">{agent.team}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Health</span>
 <span className="text-[13px] font-bold text-emerald-500">{agent.health}%</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Version</span>
 <span className="text-[13px] font-mono text-foreground dark:text-[#F0EFE2]">v1.2.4</span>
 </div>
 </div>
 </div>

 <div>
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3">Capabilities</h3>
 <div className="flex flex-wrap gap-2">
 {agent.capabilities.map(c => (
 <span key={c} className="px-3 py-1.5 rounded-md bg-card dark:bg-[#121212] border border-border dark:border-white/10 text-[12px] font-medium text-foreground/80 dark:text-[#F0EFE2]/80">
 {c}
 </span>
 ))}
 </div>
 </div>
 </div>

 {/* Mission State */}
 <div className="col-span-2 md:col-span-1 space-y-6">
 <div>
 <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3">Current Execution</h3>
 <div className="bg-card dark:bg-[#121212] border border-[#0f52ff]/30 shadow-[0_0_20px_rgba(15,82,255,0.05)] rounded-md p-6 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-1 h-full bg-[#0f52ff]" />
 <div className="flex items-center gap-3 mb-4">
 <div className="p-2 bg-[#0f52ff]/10 rounded-md text-[#0f52ff]">
 <Activity className="size-4" />
 </div>
 <div className="flex flex-col">
 <span className="text-[13px] font-bold">Mission {agent.currentMission}</span>
 <span className="text-[11px] text-foreground/50 dark:text-[#F0EFE2]/50">Running for 2h 14m</span>
 </div>
 </div>
 <div className="space-y-3">
 <div className="flex justify-between items-center text-[12px]">
 <span className="text-foreground/60 dark:text-[#F0EFE2]/60">Stage</span>
 <span className="font-mono text-[#0f52ff]">Reviewing Dependencies</span>
 </div>
 <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5">
 <div className="bg-[#0f52ff] h-1.5 rounded-full" style={{ width: "65%" }} />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === "Runtime" && (
 <div className="max-w-4xl space-y-8">
 <div className="grid grid-cols-3 gap-6">
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#121212]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-1 block">CPU Utilization</span>
 <span className="text-[24px] font-mono font-bold text-emerald-500">24%</span>
 </div>
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#121212]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-1 block">Memory</span>
 <span className="text-[24px] font-mono font-bold text-foreground dark:text-[#F0EFE2]">1.2 GB</span>
 </div>
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#121212]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-1 block">Latency</span>
 <span className="text-[24px] font-mono font-bold text-[#0f52ff]">120ms</span>
 </div>
 </div>
 <div className="h-[300px] border border-border dark:border-white/10 bg-card dark:bg-[#121212] rounded-md flex items-center justify-center text-foreground/40 dark:text-[#F0EFE2]/40">
 Live Resource Graph
 </div>
 </div>
 )}

 {["Skills", "Evidence", "Audit"].includes(activeTab) && (
 <div className="flex items-center justify-center h-full text-foreground/40 dark:text-[#F0EFE2]/40 text-[14px]">
 {activeTab} view coming soon
 </div>
 )}
 </div>

 {/* Right Sidebar - Live Logs */}
 <div className="w-[350px] shrink-0 border-l border-border dark:border-white/10 bg-card dark:bg-[#050505] flex flex-col">
 <div className="p-6 border-b border-border dark:border-white/10 shrink-0 flex items-center justify-between">
 <span className="text-[12px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 flex items-center gap-2">
 <FileJson className="size-4" /> Live Logs
 </span>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 font-mono text-[11px] text-foreground/60 dark:text-[#F0EFE2]/60 space-y-2">
 <div className="text-emerald-500">{`> Container initialized`}</div>
 <div>{`> Fetching context for Mission ${agent.currentMission}`}</div>
 <div>{`> Generating plan...`}</div>
 <div className="text-[#0f52ff]">{`> Tool call: get_repository_files`}</div>
 <div>{`> Received 45 files`}</div>
 <div className="animate-pulse">{`> Analyzing dependencies...`}</div>
 </div>
 </div>
 </div>
 </div>
 );
}

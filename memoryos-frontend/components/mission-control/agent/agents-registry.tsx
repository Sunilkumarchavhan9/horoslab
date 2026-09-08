"use client";

import React, { useState } from "react";
import { Search, Plus, Filter, LayoutGrid, List, Play, Pause, Copy, Trash, Eye, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, AgentStatusBadge, MOCK_AGENTS } from "./agent-shared-components";

export function AgentsRegistry({ onViewAgent }: { onViewAgent?: (id: string) => void }) {
 const [searchQuery, setSearchQuery] = useState("");
 const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#0a0a0a] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-6 w-1/2">
 <div className="relative w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40 dark:text-[#F0EFE2]/40" />
 <input 
 type="text" 
 placeholder="Search agents..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-md h-9 pl-9 pr-4 text-[13px] text-foreground dark:text-[#F0EFE2] placeholder:text-foreground/40 dark:placeholder:text-[#F0EFE2]/30 focus:outline-none focus:border-[#0f52ff]/50 focus:ring-1 focus:ring-[#0f52ff]/20 transition-all"
 />
 </div>
 <button className="p-2 rounded-md hover:bg-accent dark:hover:bg-card/5 text-foreground/60 dark:text-[#F0EFE2]/60 hover:text-foreground dark:hover:text-[#F0EFE2] transition-colors border border-transparent hover:border-border dark:hover:border-white/10">
 <Filter className="size-4" />
 </button>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center p-0.5 bg-muted dark:bg-white/5 rounded-md border border-border dark:border-white/10 mr-4">
 <button 
 onClick={() => setViewMode("list")}
 className={cn("p-1.5 rounded-sm transition-colors", viewMode === "list" ? "bg-card dark:bg-white/10 text-foreground dark:text-[#F0EFE2] " : "text-foreground/40 dark:text-[#F0EFE2]/40 hover:text-foreground dark:hover:text-[#F0EFE2]")}
 >
 <List className="size-3.5" />
 </button>
 <button 
 onClick={() => setViewMode("grid")}
 className={cn("p-1.5 rounded-sm transition-colors", viewMode === "grid" ? "bg-card dark:bg-white/10 text-foreground dark:text-[#F0EFE2] " : "text-foreground/40 dark:text-[#F0EFE2]/40 hover:text-foreground dark:hover:text-[#F0EFE2]")}
 >
 <LayoutGrid className="size-3.5" />
 </button>
 </div>
 <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0f52ff] hover:bg-[#0042e6] text-[#F0EFE2] rounded-md text-[13px] font-medium transition-colors">
 <Plus className="size-4" />
 Create Agent
 </button>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-card dark:bg-[#050505]">
 <SectionHeader 
 title="Agents Registry" 
 description="Manage all AI agents operating within your institutions."
 />

 {/* Top Metrics */}
 <div className="grid grid-cols-4 gap-6 mb-8">
 {[
 { label: "Total Agents", value: "542", color: "text-foreground dark:text-[#F0EFE2]" },
 { label: "Active", value: "132", color: "text-emerald-500" },
 { label: "Healthy", value: "94%", color: "text-foreground dark:text-[#F0EFE2]" },
 { label: "Running", value: "27", color: "text-[#0f52ff]" },
 ].map(m => (
 <div key={m.label} className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] flex flex-col gap-1">
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50 font-medium uppercase tracking-wider">{m.label}</span>
 <span className={cn("text-[28px] font-bold tracking-tight", m.color)}>{m.value}</span>
 </div>
 ))}
 </div>

 {/* Grid View */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {MOCK_AGENTS.map((agent) => (
 <div 
 key={agent.id}
 className="flex flex-col rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] hover:border-black/20 dark:hover:border-white/20 hover: transition-all overflow-hidden group cursor-pointer"
 onClick={() => onViewAgent?.(agent.id)}
 >
 {/* Card Header */}
 <div className="flex items-start justify-between p-6 border-b border-border dark:border-white/5 relative">
 <div className="flex flex-col">
 <h3 className="text-[15px] font-bold text-foreground dark:text-[#F0EFE2] group-hover:text-[#0f52ff] transition-colors">{agent.name}</h3>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">{agent.provider}</span>
 </div>
 <AgentStatusBadge status={agent.status} />

 {/* Hover Actions */}
 <div className="absolute inset-0 bg-card/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity z-10">
 <button className="p-2 rounded-full bg-muted dark:bg-white/5 hover:bg-black/10 dark:hover:bg-card/10 text-foreground dark:text-[#F0EFE2] transition-colors" title="Open Inspector">
 <Eye className="size-4" />
 </button>
 <button className="p-2 rounded-full bg-muted dark:bg-white/5 hover:bg-[#0f52ff]/10 text-foreground dark:text-[#F0EFE2] hover:text-[#0f52ff] transition-colors" title="View Runtime">
 <Activity className="size-4" />
 </button>
 {agent.status === "PAUSED" ? (
 <button className="p-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors" title="Resume">
 <Play className="size-4" />
 </button>
 ) : (
 <button className="p-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors" title="Pause">
 <Pause className="size-4" />
 </button>
 )}
 <button className="p-2 rounded-full bg-muted dark:bg-white/5 hover:bg-black/10 dark:hover:bg-card/10 text-foreground dark:text-[#F0EFE2] transition-colors" title="Clone">
 <Copy className="size-4" />
 </button>
 <button className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors" title="Terminate">
 <Trash className="size-4" />
 </button>
 </div>
 </div>

 {/* Card Body */}
 <div className="p-6 flex flex-col gap-6">
 <div className="flex justify-between items-center">
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-semibold text-foreground/40 dark:text-[#F0EFE2]/40 uppercase tracking-wider">Institution</span>
 <span className="text-[13px] text-foreground dark:text-[#F0EFE2] font-medium">{agent.institution}</span>
 </div>
 <div className="flex flex-col gap-1 text-right">
 <span className="text-[11px] font-semibold text-foreground/40 dark:text-[#F0EFE2]/40 uppercase tracking-wider">Health</span>
 <span className="text-[13px] text-emerald-500 font-bold">{agent.health}%</span>
 </div>
 </div>

 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-semibold text-foreground/40 dark:text-[#F0EFE2]/40 uppercase tracking-wider">Capabilities</span>
 <div className="flex flex-wrap gap-1.5 mt-1">
 {agent.capabilities.map(c => (
 <span key={c} className="px-2 py-0.5 rounded-md bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-[11px] text-foreground/70 dark:text-[#F0EFE2]/70">
 {c}
 </span>
 ))}
 </div>
 </div>

 <div className="flex justify-between items-center mt-2 pt-4 border-t border-border dark:border-white/5">
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-semibold text-foreground/40 dark:text-[#F0EFE2]/40 uppercase tracking-wider">Current Mission</span>
 <span className="text-[13px] text-[#0f52ff] font-medium font-mono">{agent.currentMission}</span>
 </div>
 <div className="flex flex-col gap-1 text-right">
 <span className="text-[11px] font-semibold text-foreground/40 dark:text-[#F0EFE2]/40 uppercase tracking-wider">Last Activity</span>
 <span className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">{agent.lastActivity}</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

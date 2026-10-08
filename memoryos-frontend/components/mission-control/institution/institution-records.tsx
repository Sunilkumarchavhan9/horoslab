"use client";

import React, { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, ArrowRight, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, CommandBar } from "./institution-shared-components";

const MOCK_INSTITUTIONS = [
 {
 id: "inst_eng_01",
 name: "Engineering",
 status: "ACTIVE" as const,
 version: "v12",
 missions: 18,
 agents: 42,
 health: 98,
 lastMutation: "2 days ago",
 owner: "HOROS Planner",
 risk: "Low"
 },
 {
 id: "inst_sec_02",
 name: "Security Auditing",
 status: "DEGRADED" as const,
 version: "v4",
 missions: 5,
 agents: 12,
 health: 72,
 lastMutation: "5 hrs ago",
 owner: "Security Ops",
 risk: "High"
 },
 {
 id: "inst_hr_03",
 name: "HR Onboarding",
 status: "ACTIVE" as const,
 version: "v8",
 missions: 3,
 agents: 4,
 health: 99,
 lastMutation: "1 week ago",
 owner: "People Team",
 risk: "Low"
 },
 {
 id: "inst_fin_04",
 name: "Financial Reconciliation",
 status: "OFFLINE" as const,
 version: "v11",
 missions: 0,
 agents: 8,
 health: 0,
 lastMutation: "3 weeks ago",
 owner: "Finance",
 risk: "Medium"
 }
];

export function InstitutionRecords({ onSelect }: { onSelect?: (id: string) => void }) {
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedId, setSelectedId] = useState<string>(MOCK_INSTITUTIONS[0].id);
 const [viewMode, setViewMode] = useState<"grid" | "list">("list");

 const selectedInst = MOCK_INSTITUTIONS.find(i => i.id === selectedId);

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#0a0a0a] text-foreground dark:text-[#F0EFE2] font-sans">
 <CommandBar>
 <div className="flex items-center gap-6 w-1/2">
 <div className="relative w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40 dark:text-[#F0EFE2]/40" />
 <input 
 type="text" 
 placeholder="Search institutions..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-md h-9 pl-9 pr-4 text-[13px] text-foreground dark:text-[#F0EFE2] placeholder:text-foreground/30 dark:text-[#F0EFE2]/30 focus:outline-none focus:border-[#0f52ff]/50 focus:ring-1 focus:ring-[#0f52ff]/20 transition-all"
 />
 </div>
 <button className="p-2 rounded-md hover:bg-accent dark:bg-white/5 text-foreground/60 dark:text-[#F0EFE2]/60 hover:text-foreground dark:text-[#F0EFE2] transition-colors border border-transparent hover:border-border dark:border-white/10">
 <Filter className="size-4" />
 </button>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center p-0.5 bg-muted dark:bg-white/5 rounded-md border border-border dark:border-white/10 mr-4">
 <button 
 onClick={() => setViewMode("list")}
 className={cn("p-1.5 rounded-sm transition-colors", viewMode === "list" ? "bg-black/10 dark:bg-white/10 text-foreground dark:text-[#F0EFE2]" : "text-foreground/40 dark:text-[#F0EFE2]/40 hover:text-foreground dark:text-[#F0EFE2]")}
 >
 <List className="size-3.5" />
 </button>
 <button 
 onClick={() => setViewMode("grid")}
 className={cn("p-1.5 rounded-sm transition-colors", viewMode === "grid" ? "bg-black/10 dark:bg-white/10 text-foreground dark:text-[#F0EFE2]" : "text-foreground/40 dark:text-[#F0EFE2]/40 hover:text-foreground dark:text-[#F0EFE2]")}
 >
 <LayoutGrid className="size-3.5" />
 </button>
 </div>
 <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0f52ff] hover:bg-[#0042e6] text-foreground dark:text-[#F0EFE2] rounded-md text-[13px] font-medium transition-colors">
 <Plus className="size-4" />
 Institution
 </button>
 </div>
 </CommandBar>

 <div className="flex flex-1 overflow-hidden">
 {/* Main List/Grid */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-[24px] font-semibold tracking-tight">Active Institutions</h1>
 <span className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50">{MOCK_INSTITUTIONS.length} running</span>
 </div>

 {viewMode === "list" ? (
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#121212] overflow-hidden">
 <table className="w-full text-left text-[13px]">
 <thead className="bg-muted dark:bg-white/5 border-b border-border dark:border-white/10 text-foreground/50 dark:text-[#F0EFE2]/50 font-medium">
 <tr>
 <th className="px-6 py-3 font-medium">Institution</th>
 <th className="px-6 py-3 font-medium">Status</th>
 <th className="px-6 py-3 font-medium">Team</th>
 <th className="px-6 py-3 font-medium">Risk</th>
 <th className="px-6 py-3 font-medium">Version</th>
 <th className="px-6 py-3 font-medium">Health</th>
 <th className="px-6 py-3"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {MOCK_INSTITUTIONS.map((inst) => (
 <tr 
 key={inst.id} 
 onClick={() => setSelectedId(inst.id)}
 className={cn(
 "group cursor-pointer transition-colors",
 selectedId === inst.id ? "bg-[#0f52ff]/5" : "hover:bg-accent dark:bg-white/5"
 )}
 >
 <td className="px-6 py-3.5">
 <div className="font-semibold text-foreground dark:text-[#F0EFE2] group-hover:text-[#0f52ff] transition-colors">{inst.name}</div>
 </td>
 <td className="px-6 py-3.5"><StatusBadge status={inst.status} /></td>
 <td className="px-6 py-3.5 text-foreground/70 dark:text-[#F0EFE2]/70">{inst.owner}</td>
 <td className="px-6 py-3.5">
 <span className={cn(
 "px-2 py-0.5 rounded text-[11px] font-medium",
 inst.risk === "Low" ? "bg-emerald-500/10 text-emerald-500" :
 inst.risk === "Medium" ? "bg-amber-500/10 text-amber-500" :
 "bg-red-500/10 text-red-500"
 )}>{inst.risk}</span>
 </td>
 <td className="px-6 py-3.5 font-mono text-[12px] text-foreground/60 dark:text-[#F0EFE2]/60">{inst.version}</td>
 <td className="px-6 py-3.5">
 <div className="flex items-center gap-2">
 <div className="w-16 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
 <div 
 className={cn("h-full rounded-full", inst.health > 90 ? "bg-emerald-500" : inst.health > 50 ? "bg-amber-500" : "bg-red-500")} 
 style={{ width: `${inst.health}%` }} 
 />
 </div>
 <span className="text-[11px] text-foreground/50 dark:text-[#F0EFE2]/50 w-6">{inst.health}%</span>
 </div>
 </td>
 <td className="px-6 py-3.5 text-right">
 <button 
 onClick={(e) => { e.stopPropagation(); onSelect?.(inst.id); }}
 className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-black/10 dark:bg-white/10 text-foreground/60 dark:text-[#F0EFE2]/60 hover:text-foreground dark:text-[#F0EFE2] transition-all flex items-center gap-1 text-[12px] font-medium"
 >
 Open <ArrowRight className="size-3.5" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {MOCK_INSTITUTIONS.map(inst => (
 <div 
 key={inst.id}
 onClick={() => setSelectedId(inst.id)}
 className={cn(
 "p-6 rounded-md border bg-card dark:bg-[#121212] cursor-pointer transition-all flex flex-col group",
 selectedId === inst.id ? "border-[#0f52ff]/50 ring-1 ring-[#0f52ff]/20" : "border-border dark:border-white/10 hover:border-black/20 dark:border-white/20 hover:bg-card dark:bg-[#1a1a1a]"
 )}
 >
 <div className="flex items-start justify-between mb-4">
 <h3 className="font-semibold text-[15px] group-hover:text-[#0f52ff] transition-colors">{inst.name}</h3>
 <StatusBadge status={inst.status} />
 </div>
 
 <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[12px] mb-5">
 <div className="flex flex-col gap-1"><span className="text-foreground/40 dark:text-[#F0EFE2]/40">Version</span><span className="font-mono text-foreground/80 dark:text-[#F0EFE2]/80">{inst.version}</span></div>
 <div className="flex flex-col gap-1"><span className="text-foreground/40 dark:text-[#F0EFE2]/40">Missions</span><span className="text-foreground/80 dark:text-[#F0EFE2]/80">{inst.missions}</span></div>
 <div className="flex flex-col gap-1"><span className="text-foreground/40 dark:text-[#F0EFE2]/40">Agents</span><span className="text-foreground/80 dark:text-[#F0EFE2]/80">{inst.agents}</span></div>
 <div className="flex flex-col gap-1"><span className="text-foreground/40 dark:text-[#F0EFE2]/40">Last Mutation</span><span className="text-foreground/80 dark:text-[#F0EFE2]/80">{inst.lastMutation}</span></div>
 </div>

 <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border dark:border-white/5">
 <div className="flex-1 flex items-center gap-2">
 <div className="text-[11px] font-medium text-foreground/50 dark:text-[#F0EFE2]/50">Health</div>
 <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
 <div 
 className={cn("h-full rounded-full", inst.health > 90 ? "bg-emerald-500" : inst.health > 50 ? "bg-amber-500" : "bg-red-500")} 
 style={{ width: `${inst.health}%` }} 
 />
 </div>
 <div className="text-[11px] font-mono text-foreground/80 dark:text-[#F0EFE2]/80">{inst.health}%</div>
 </div>
 </div>
 
 {selectedId === inst.id && (
 <button 
 onClick={(e) => { e.stopPropagation(); onSelect?.(inst.id); }}
 className="absolute inset-0 z-10 m-auto h-8 w-24 bg-[#0f52ff] text-foreground dark:text-[#F0EFE2] text-[12px] font-medium rounded-md flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity "
 >
 Open <ArrowRight className="size-3.5" />
 </button>
 )}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Right Inspector */}
 <div className="w-[320px] shrink-0 border-l border-border dark:border-white/10 bg-card dark:bg-[#121212] overflow-y-auto custom-scrollbar flex flex-col">
 {selectedInst ? (
 <div className="p-6 flex flex-col gap-6">
 <div className="flex items-start justify-between">
 <div>
 <h2 className="text-[18px] font-semibold tracking-tight">{selectedInst.name}</h2>
 <div className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50 mt-1">{selectedInst.id}</div>
 </div>
 <button className="p-1.5 rounded hover:bg-black/10 dark:bg-white/10 text-foreground/50 dark:text-[#F0EFE2]/50 hover:text-foreground dark:text-[#F0EFE2] transition-colors">
 <MoreHorizontal className="size-4" />
 </button>
 </div>

 <div className="flex gap-2">
 <button 
 onClick={() => onSelect?.(selectedInst.id)}
 className="flex-1 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:bg-white/20 rounded-md text-[12px] font-medium transition-colors"
 >
 Open Workspace
 </button>
 <button className="flex-1 py-1.5 bg-muted dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-border dark:border-white/10 rounded-md text-[12px] font-medium transition-colors">
 Clone
 </button>
 </div>

 <div className="space-y-4 border-t border-border dark:border-white/10 pt-5">
 <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40">Properties</h3>
 <div className="grid grid-cols-2 gap-6 text-[13px]">
 <div className="flex flex-col gap-1">
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">Owner</span>
 <span>{selectedInst.owner}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">Runtime</span>
 <span>14,204 hrs</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">Policies</span>
 <span>24 active</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">Evidence</span>
 <span>1.2M records</span>
 </div>
 </div>
 </div>

 <div className="space-y-4 border-t border-border dark:border-white/10 pt-5">
 <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40">Recent Missions</h3>
 <div className="space-y-2">
 {[1, 2, 3].map(i => (
 <div key={i} className="p-3 rounded-md border border-border dark:border-white/5 bg-card/[0.02] hover:bg-card/[0.04] cursor-pointer transition-colors group">
 <div className="flex items-center justify-between mb-1">
 <span className="text-[12px] font-medium group-hover:text-[#0f52ff] transition-colors">Security Audit Q{i}</span>
 <span className="text-[10px] text-emerald-500 font-bold uppercase">Pass</span>
 </div>
 <div className="text-[11px] text-foreground/40 dark:text-[#F0EFE2]/40">Completed 2 days ago</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : (
 <div className="flex items-center justify-center h-full text-foreground/30 dark:text-[#F0EFE2]/30 text-[13px]">
 Select an institution
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

"use client";

import React, { useState } from "react";
import { GitCommit, GitBranch, ShieldAlert, Fingerprint, Database, Undo2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader, SplitPane } from "./institution-shared-components";

const VERSIONS = [
 { id: "v14", date: "2 hours ago", author: "Alice Engineer", reason: "Updated budget policy for Q4", fitness: 98, missions: 12 },
 { id: "v13", date: "2 days ago", author: "Bob Security", reason: "Added mandatory human review for auth", fitness: 95, missions: 45 },
 { id: "v12", date: "1 week ago", author: "System", reason: "Auto-mutation: optimized prompt templates", fitness: 92, missions: 120 },
 { id: "v11", date: "2 weeks ago", author: "Alice Engineer", reason: "Initial setup for engineering domain", fitness: 88, missions: 340 },
];

export function InstitutionVersions() {
 const [selectedVersion, setSelectedVersion] = useState("v14");

 return (
 <SplitPane 
 leftWidth="320px"
 left={
 <div className="py-6 px-6 bg-card dark:bg-[#0a0a0a] min-h-full flex flex-col">
 <SectionHeader title="Version History" />
 
 <div className="relative mt-2">
 <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-black/10 dark:bg-white/10" />
 
 <div className="flex flex-col gap-6 relative z-10">
 {VERSIONS.map(v => (
 <div 
 key={v.id}
 onClick={() => setSelectedVersion(v.id)}
 className="flex gap-6 cursor-pointer group"
 >
 <div className={cn(
 "size-8 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors",
 selectedVersion === v.id ? "bg-card dark:bg-[#121212] border-[#0f52ff] text-[#0f52ff]" : "bg-card dark:bg-[#121212] border-black/20 dark:border-white/20 text-foreground/40 dark:text-white/40 group-hover:border-black/40 dark:border-white/40 group-hover:text-foreground dark:text-white"
 )}>
 <GitCommit className="size-4" />
 </div>
 <div className="flex flex-col pt-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className={cn(
 "font-mono text-[13px] font-bold transition-colors",
 selectedVersion === v.id ? "text-[#0f52ff]" : "text-foreground dark:text-white"
 )}>{v.id}</span>
 <span className="text-[11px] text-foreground/40 dark:text-white/40">{v.date}</span>
 </div>
 <span className="text-[12px] text-foreground/70 dark:text-white/70 line-clamp-2 leading-snug mb-1.5">{v.reason}</span>
 <div className="flex items-center gap-3 text-[11px] text-foreground/40 dark:text-white/40">
 <span className="flex items-center gap-1"><Fingerprint className="size-3" /> {v.author}</span>
 <span className="flex items-center gap-1 text-emerald-500"><Check className="size-3" /> {v.fitness}%</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#121212]">
 <div className="px-8 py-6 border-b border-border dark:border-white/10 shrink-0 flex items-start justify-between bg-card dark:bg-[#0a0a0a]">
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-3">
 <h2 className="text-[20px] font-semibold text-foreground dark:text-white font-mono tracking-tight">{selectedVersion}</h2>
 <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[11px] font-bold uppercase tracking-wider">Current</span>
 </div>
 <p className="text-[14px] text-foreground/60 dark:text-white/60">Updated budget policy for Q4</p>
 </div>
 
 <button className="flex items-center gap-2 px-6 py-2 bg-muted dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-foreground dark:text-white border border-border dark:border-white/10 rounded-md text-[13px] font-medium transition-colors">
 <Undo2 className="size-4" /> Rollback to {selectedVersion}
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
 <h3 className="text-[14px] font-semibold text-foreground dark:text-white mb-4">Changed Files</h3>
 
 <div className="space-y-6">
 {/* Diff 1 */}
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#050505] overflow-hidden">
 <div className="px-6 py-3 bg-muted dark:bg-white/5 border-b border-border dark:border-white/10 flex items-center gap-2 text-[13px] font-mono text-foreground/80 dark:text-white/80">
 <ShieldAlert className="size-4 text-amber-500" /> policies/budget.json
 </div>
 <div className="p-6 font-mono text-[12px] leading-relaxed overflow-x-auto">
 <div className="text-foreground/40 dark:text-white/40 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-border dark:border-white/10">1</div>
 <div className="pl-4">{`{`}</div>
 </div>
 <div className="text-foreground/40 dark:text-white/40 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-border dark:border-white/10">2</div>
 <div className="pl-4">{` "budget": {`}</div>
 </div>
 <div className="bg-red-500/10 text-red-400 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-red-500/20 text-red-500/50">3</div>
 <div className="pl-4">- "daily_limit": 100,</div>
 </div>
 <div className="bg-emerald-500/10 text-emerald-400 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-emerald-500/20 text-emerald-500/50">3</div>
 <div className="pl-4">+ "daily_limit": 50,</div>
 </div>
 <div className="text-foreground/40 dark:text-white/40 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-border dark:border-white/10">4</div>
 <div className="pl-4">{` "currency": "USD"`}</div>
 </div>
 <div className="text-foreground/40 dark:text-white/40 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-border dark:border-white/10">5</div>
 <div className="pl-4">{` }`}</div>
 </div>
 <div className="text-foreground/40 dark:text-white/40 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-border dark:border-white/10">6</div>
 <div className="pl-4">{`}`}</div>
 </div>
 </div>
 </div>
 
 {/* Diff 2 */}
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#050505] overflow-hidden">
 <div className="px-6 py-3 bg-muted dark:bg-white/5 border-b border-border dark:border-white/10 flex items-center gap-2 text-[13px] font-mono text-foreground/80 dark:text-white/80">
 <Database className="size-4 text-[#0f52ff]" /> genome/evidence_duties.json
 </div>
 <div className="p-6 font-mono text-[12px] leading-relaxed overflow-x-auto">
 <div className="bg-emerald-500/10 text-emerald-400 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-emerald-500/20 text-emerald-500/50">12</div>
 <div className="pl-4">+ "require_cost_tracking": true,</div>
 </div>
 <div className="bg-emerald-500/10 text-emerald-400 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-emerald-500/20 text-emerald-500/50">13</div>
 <div className="pl-4">+ "cost_tracking_tags": ["department", "mission_type"]</div>
 </div>
 </div>
 </div>

 </div>
 </div>
 </div>
 }
 />
 );
}

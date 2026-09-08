"use client";

import React, { useState } from "react";
import { FileCode2, MessageSquare, Check, X, ShieldAlert, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader, SplitPane } from "./institution-shared-components";

const PROPOSALS = [
 { id: "CP-42", title: "Reduce budget limit to $50", status: "Waiting Approval", author: "Alice Engineer", comments: 3, age: "2 hours ago" },
 { id: "CP-41", title: "Add strict evidence duty for HR", status: "Approved", author: "System", comments: 0, age: "1 day ago" },
 { id: "CP-40", title: "Update auto-verify thresholds", status: "Rejected", author: "Bob Security", comments: 5, age: "3 days ago" },
];

export function InstitutionChangeProposals() {
 const [selectedCp, setSelectedCp] = useState("CP-42");
 
 return (
 <SplitPane 
 leftWidth="320px"
 left={
 <div className="py-6 px-6 bg-card dark:bg-[#0a0a0a] min-h-full flex flex-col">
 <SectionHeader title="Change Proposals" />
 
 <div className="flex flex-col gap-2 mt-4">
 {PROPOSALS.map(cp => (
 <div 
 key={cp.id}
 onClick={() => setSelectedCp(cp.id)}
 className={cn(
 "p-6 rounded-md border cursor-pointer transition-all group",
 selectedCp === cp.id ? "bg-muted dark:bg-white/5 border-[#0f52ff]/50 ring-1 ring-[#0f52ff]/20" : "bg-card dark:bg-[#121212] border-border dark:border-white/10 hover:border-black/20 dark:border-white/20"
 )}
 >
 <div className="flex items-start justify-between mb-2">
 <span className="text-[11px] font-mono font-bold text-foreground/50 dark:text-[#F0EFE2]/50">{cp.id}</span>
 <span className={cn(
 "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
 cp.status === "Waiting Approval" ? "bg-amber-500/10 text-amber-500" :
 cp.status === "Approved" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
 )}>
 {cp.status}
 </span>
 </div>
 <h4 className={cn("text-[13px] font-semibold mb-3 leading-snug", selectedCp === cp.id ? "text-foreground dark:text-[#F0EFE2]" : "text-foreground/80 dark:text-[#F0EFE2]/80 group-hover:text-foreground dark:text-[#F0EFE2]")}>
 {cp.title}
 </h4>
 <div className="flex items-center justify-between text-[11px] text-foreground/40 dark:text-[#F0EFE2]/40">
 <span>{cp.author}</span>
 <div className="flex items-center gap-3">
 <span className="flex items-center gap-1"><Clock className="size-3" /> {cp.age}</span>
 <span className="flex items-center gap-1"><MessageSquare className="size-3" /> {cp.comments}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#121212]">
 <div className="px-8 py-6 border-b border-border dark:border-white/10 shrink-0 flex items-start justify-between bg-card dark:bg-[#0a0a0a]">
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-3">
 <h2 className="text-[20px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight">Reduce budget limit to $50</h2>
 <span className="text-[14px] text-foreground/50 dark:text-[#F0EFE2]/50 font-mono">#CP-42</span>
 </div>
 <div className="flex items-center gap-2 text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">
 <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 font-medium rounded-full text-[11px]">Review Required</span>
 <span>• Opened by Alice Engineer 2 hours ago</span>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <button className="flex items-center gap-1.5 px-6 py-2 bg-muted dark:bg-white/5 hover:bg-red-500/10 text-foreground dark:text-[#F0EFE2] hover:text-red-500 border border-border dark:border-white/10 rounded-md text-[13px] font-medium transition-colors">
 <X className="size-4" /> Reject
 </button>
 <button className="flex items-center gap-1.5 px-6 py-2 bg-[#0f52ff] hover:bg-[#0042e6] text-foreground dark:text-[#F0EFE2] rounded-md text-[13px] font-medium transition-colors">
 <Check className="size-4" /> Approve & Merge
 </button>
 </div>
 </div>
 
 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
 <div className="max-w-4xl space-y-8">
 
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#050505] overflow-hidden">
 <div className="px-6 py-3 bg-muted dark:bg-white/5 border-b border-border dark:border-white/10 flex items-center justify-between">
 <div className="flex items-center gap-2 text-[13px] font-mono text-foreground/80 dark:text-[#F0EFE2]/80">
 <ShieldAlert className="size-4 text-emerald-500" /> policies/budget.json
 </div>
 <div className="text-[12px] text-foreground/40 dark:text-[#F0EFE2]/40">1 file changed, 1 insertion(+), 1 deletion(-)</div>
 </div>
 <div className="p-6 font-mono text-[12px] leading-relaxed overflow-x-auto">
 <div className="text-foreground/40 dark:text-[#F0EFE2]/40 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-border dark:border-white/10">3</div>
 <div className="pl-4">{` "budget": {`}</div>
 </div>
 <div className="bg-red-500/10 text-red-400 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-red-500/20 text-red-500/50">4</div>
 <div className="pl-4">- "daily_limit": 100,</div>
 </div>
 <div className="bg-emerald-500/10 text-emerald-400 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-emerald-500/20 text-emerald-500/50">4</div>
 <div className="pl-4">+ "daily_limit": 50,</div>
 </div>
 <div className="text-foreground/40 dark:text-[#F0EFE2]/40 select-none flex">
 <div className="w-8 text-right pr-4 border-r border-border dark:border-white/10">5</div>
 <div className="pl-4">{` "currency": "USD"`}</div>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-[14px] font-semibold text-foreground dark:text-[#F0EFE2] border-b border-border dark:border-white/10 pb-2">Discussion</h3>
 
 <div className="flex gap-6">
 <div className="size-8 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
 <div className="flex-1 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5 overflow-hidden">
 <div className="px-6 py-2 border-b border-border dark:border-white/10 bg-card/[0.02] flex items-center gap-2 text-[12px]">
 <span className="font-semibold text-foreground dark:text-[#F0EFE2]">Alice Engineer</span>
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">commented 2 hours ago</span>
 </div>
 <div className="p-6 text-[13px] text-foreground/80 dark:text-[#F0EFE2]/80">
 As discussed in the sync, we need to tighten the budget for this institution until the new optimization passes simulation.
 </div>
 </div>
 </div>

 <div className="flex gap-6">
 <div className="size-8 rounded-full bg-[#0f52ff]/20 flex items-center justify-center shrink-0">
 <ShieldAlert className="size-4 text-[#0f52ff]" />
 </div>
 <div className="flex-1 rounded-md border border-[#0f52ff]/20 bg-[#0f52ff]/5 overflow-hidden">
 <div className="px-6 py-2 border-b border-[#0f52ff]/10 bg-[#0f52ff]/10 flex items-center gap-2 text-[12px]">
 <span className="font-semibold text-[#0f52ff]">System Simulator</span>
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">reported 1 hour ago</span>
 </div>
 <div className="p-6 text-[13px] text-foreground/80 dark:text-[#F0EFE2]/80 space-y-3">
 <p>Simulation passed successfully against last 1,000 missions.</p>
 <ul className="list-disc pl-5 text-foreground/60 dark:text-[#F0EFE2]/60 space-y-1">
 <li>0 missions would have failed due to budget limits.</li>
 <li>Average daily spend over last 30 days: $12.40.</li>
 </ul>
 </div>
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
